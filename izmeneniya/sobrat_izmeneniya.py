"""Собирает platforma/izmeneniya.json: что поменялось в каждом курсе с любого момента в прошлом.

Зачем: человек открывает курс, который уже сдавал, и видит плашку «курс обновлён после вашей
сдачи» - какие шаги изменились (метки в полосе шагов, подсветка изменённых абзацев) и что
написано про эти правки в «Что нового». Это рисует kurs-start.js, а дату сдачи даёт функция
obuchenie (/api/sdano). Значок «обновлён после вашей сдачи» в «Моих обучениях» берёт отсюда же
поле obnovlen.

Как считается: проходим историю git каждой страницы курса (русской), из каждой правки достаём
шаги (izmeneniya/shagi.js) и сравниваем с нынешней страницей по абзацам. Сравнение - по буквам
и цифрам, без регистра, тегов и знаков препинания: опечатка в тире или пробел изменением не
считаются. Подряд идущие правки с одинаковым результатом схлопываются.

Формат на курс (ключ - имя файла страницы, например "priem"):
  id, nazv            - id и название курса из supabase/functions/obuchenie/kursy.ts
  obnovlen            - когда появилось нынешнее содержание (ISO, UTC)
  zapisi: [{t, v, izm}] - с момента t (до следующей записи) человек видел редакцию v;
                         izm: {номер шага: [номера изменённых абзацев] | "vse"} относительно нынешней
  novoe: [{t, d, ru, kk}] - строки «Что нового» про этот курс (t - когда вступила, d - дата строки)
  kk_abzacy: {шаг: [номер абзаца в казахской копии]} - где в казахской есть свои вставки

Запуск после каждой правки курса или «Что нового» (страница курса уже закоммичена):
  python izmeneniya/sobrat_izmeneniya.py             - собрать и записать, затем закоммитить izmeneniya.json
  python izmeneniya/sobrat_izmeneniya.py --proverka  - пересобрать в памяти и сравнить с файлом (полминуты)
  python izmeneniya/sobrat_izmeneniya.py --bystro    - быстро: правились ли курсы после сборки (так сверяет
                                                       proverka_obucheniya.py)
"""
import difflib
import html.parser
import io
import json
import math
import os
import re
import subprocess
import sys
from datetime import datetime, timezone

sys.stdout.reconfigure(encoding="utf-8")
O = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = os.path.dirname(O)
SHAGI = os.path.join(O, "izmeneniya", "shagi.js")
VYHOD = os.path.join(O, "platforma", "izmeneniya.json")
KURSY = os.path.join(R, "supabase", "functions", "obuchenie", "kursy.ts")
INDEX = os.path.join(R, "supabase", "functions", "obuchenie", "index.ts")
RAZDEL_KK = os.path.join(O, "kk-kursy", "kk", "_razdel.json")
VOID = {"br", "img", "hr", "input", "meta", "link", "wbr", "source", "col", "area"}


def git(*a):
    return subprocess.run(["git", "-C", O, *a], capture_output=True, check=True).stdout.decode("utf-8")


def shagi(tekst):
    r = subprocess.run(["node", SHAGI], input=tekst.encode("utf-8"), capture_output=True, check=True)
    return json.loads(r.stdout.decode("utf-8"))


class Bloki(html.parser.HTMLParser):
    """Делит html шага на элементы верхнего уровня - как body.children в браузере."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.glub, self.bloki, self.tek, self.formy, self.forma = 0, [], [], [], []

    def handle_starttag(self, tag, attrs):
        if self.glub == 0:
            self.tek, self.forma = [], []
        self.forma.append(tag + "." + (dict(attrs).get("class") or ""))
        if tag not in VOID:
            self.glub += 1
        elif self.glub == 0:
            self.bloki.append("")
            self.formy.append(" ".join(self.forma))

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        self.glub -= 1
        if self.glub == 0:
            self.bloki.append(" ".join(self.tek))
            self.formy.append(" ".join(self.forma))

    def handle_data(self, d):
        if self.glub > 0:
            self.tek.append(d)


def razbor(h):
    p = Bloki()
    p.feed(h)
    p.close()
    return p


def bloki(h):
    return razbor(h).bloki


def sopostavit_kk(ru_steps, kk_steps):
    """Номер абзаца русского шага -> номер в казахском, где в казахском есть свои вставки.
    Выравнивание (как в diff) по похожести абзацев: разметка (теги и классы перевод не меняет),
    длина текста и общие цифры и латиница. Казахские вставки пропускаются бесплатно.
    Возвращает {шаг: [номер в kk или -1]} только для шагов, где число абзацев разное."""
    def znaki(s):
        return set(re.findall(r"[0-9]+|[a-z]{2,}", s.lower()))

    def pohozh(fa, ta, fb, tb):
        sc = 1.0 if fa == fb else 0.0
        la, lb = max(len(ta), 1), max(len(tb), 1)
        sc += max(0.0, 1.0 - abs(math.log(lb / la)))
        za, zb = znaki(ta), znaki(tb)
        if za or zb:
            sc += len(za & zb) / len(za | zb)
        return sc

    karta = {}
    for j, (a, b) in enumerate(zip(ru_steps, kk_steps)):
        ra, rb = razbor(a["html"]), razbor(b["html"])
        n, k = len(ra.bloki), len(rb.bloki)
        if n == k:
            continue
        # dp[i][jj] - лучшая сумма для первых i русских и jj казахских абзацев
        dp = [[-1e9] * (k + 1) for _ in range(n + 1)]
        hod = [[None] * (k + 1) for _ in range(n + 1)]
        dp[0][0] = 0.0
        for i in range(n + 1):
            for jj in range(k + 1):
                if dp[i][jj] <= -1e9:
                    continue
                if jj < k and dp[i][jj] > dp[i][jj + 1]:            # казахская вставка
                    dp[i][jj + 1], hod[i][jj + 1] = dp[i][jj], "kk"
                if i < n and dp[i][jj] - 1 > dp[i + 1][jj]:         # русский абзац без пары
                    dp[i + 1][jj], hod[i + 1][jj] = dp[i][jj] - 1, "ru"
                if i < n and jj < k:
                    s = dp[i][jj] + pohozh(ra.formy[i], ra.bloki[i], rb.formy[jj], rb.bloki[jj])
                    if s > dp[i + 1][jj + 1]:
                        dp[i + 1][jj + 1], hod[i + 1][jj + 1] = s, "para"
        m = [-1] * n
        i, jj = n, k
        while i or jj:
            h = hod[i][jj]
            if h == "para":
                i, jj = i - 1, jj - 1
                m[i] = jj
            elif h == "kk":
                jj -= 1
            else:
                i -= 1
        karta[str(j)] = m
    return karta


def norm(s):
    s = s.lower().replace("ё", "е")
    return re.sub(r"[^0-9a-zа-яәіңғүұқөһ]+", "", s)


def izm_otnositelno(stare, tek):
    """Что в нынешних шагах tek отличается от шагов stare."""
    po_title = {norm(s["title"]): s for s in stare}
    po_rail = {norm(s["rail"]): s for s in stare}
    izm = {}
    for j, s in enumerate(tek):
        st = po_title.get(norm(s["title"])) or po_rail.get(norm(s["rail"]))
        if st is None:
            izm[str(j)] = "vse"
            continue
        b_st = {norm(b) for b in bloki(st["html"])}
        b_tek = bloki(s["html"])
        n_tek = {norm(b) for b in b_tek}
        novye = [k for k, b in enumerate(b_tek) if norm(b) and norm(b) not in b_st]
        ubrano = any(b and b not in n_tek for b in b_st)
        if novye or ubrano or norm(st["q"]) != norm(s["q"]):
            izm[str(j)] = novye
    return izm


def kursy():
    t = io.open(KURSY, encoding="utf-8").read()
    spisok = json.loads(t[t.index("["):t.rindex("]") + 1])
    return [k for k in spisok if k.get("stranica", "").startswith("platforma/kurs/")]


def changelog():
    t = io.open(INDEX, encoding="utf-8").read()
    i = t.index("const CHANGELOG_OB")
    t = t[i:t.index("\n];", i)]
    vyhod = []
    for m in re.finditer(r'\{ d: "(\d{4}-\d\d-\d\d)", items: \[(.*?)\] \}', t, re.S):
        for s in re.findall(r'^\s*("(?:[^"\\]|\\.)*"),?\s*$', m.group(2), re.M):
            vyhod.append((m.group(1), json.loads(s)))
    return vyhod


def utc(iso):
    return datetime.fromisoformat(iso).astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sobrat():
    kk = json.loads(io.open(RAZDEL_KK, encoding="utf-8").read())
    stroki = changelog()
    itog, preduprezhdeniya = {}, []
    for k in kursy():
        put = k["stranica"]
        fajl = os.path.basename(put)[:-5]
        tek = shagi(io.open(os.path.join(O, put.replace("/", os.sep)), encoding="utf-8").read())
        kk_karta = {}
        if tek["error"]:
            raise SystemExit(f"{put}: {tek['error']}")
        # Казахская копия должна делиться на абзацы так же - иначе подсветка уедет.
        p_kk = os.path.join(O, put.replace("/", os.sep)[:-5] + ".kk.html")
        if os.path.exists(p_kk):
            s_kk = shagi(io.open(p_kk, encoding="utf-8").read())
            if s_kk["version"] != tek["version"]:
                preduprezhdeniya.append(f"{fajl}.kk: редакция {s_kk['version']}, а русская {tek['version']} - пересоберите kk")
            elif len(s_kk["steps"]) != len(tek["steps"]):
                preduprezhdeniya.append(f"{fajl}.kk: шагов {len(s_kk['steps'])}, а в русской {len(tek['steps'])} - пересоберите kk")
            else:
                kk_karta = sopostavit_kk(tek["steps"], s_kk["steps"])
                for j, m in kk_karta.items():
                    if -1 in m:
                        preduprezhdeniya.append(f"{fajl}.kk, шаг {int(j) + 1}: не все абзацы нашлись в казахской - их подсветки там не будет")
        pravki = [x.split("|", 1) for x in git("log", "--reverse", "--format=%H|%cI", "--", put).split()]
        zapisi, versii = [], {}
        for h, t in pravki:
            s = shagi(git("show", f"{h}:{put}"))
            if s["error"]:
                continue
            if s["version"]:
                n = re.match(r"ред\.(\d+)", s["version"])
                if n and n.group(1) not in versii:
                    versii[n.group(1)] = utc(t)
            izm = izm_otnositelno(s["steps"], tek["steps"])
            if not zapisi or zapisi[-1]["izm"] != izm:
                zapisi.append({"t": utc(t), "v": (s["version"] or "").split(" · ")[0], "izm": izm})
        if zapisi and zapisi[-1]["izm"]:
            preduprezhdeniya.append(f"{fajl}: страница отличается от последней правки в git - закоммитьте её до сборки")
        itog[fajl] = {"id": k["id"], "nazv": k["title"], "kluch": tek["key"], "hesh": pravki[-1][0] if pravki else "",
                      "obnovlen": zapisi[-1]["t"] if zapisi else None,
                      "zapisi": zapisi, "novoe": novoe_kursa(k, stroki, versii, kk), "kk_abzacy": kk_karta}
    return itog, preduprezhdeniya


def novoe_kursa(k, stroki, versii, kk):
    """Строки «Что нового», где курс назван по имени; t - время его редакции «ред.N», иначе конец дня строки."""
    novoe = []
    for d, s in stroki:
        if f"«{k['title']}»" not in s:
            continue
        n = re.search(r"«" + re.escape(k["title"]) + r"»,? \(?ред\.\s?(\d+)", s)
        t = versii.get(n.group(1)) if n else None
        novoe.append({"t": t or utc(d + "T23:59:59+05:00"), "d": d, "ru": s, "kk": kk.get(s, "")})
    return novoe


def ustarelo():
    """Быстрая сверка без пересборки (для proverka_obucheniya.py): какие курсы правились после сборки
    izmeneniya.json - новая правка в git, незакоммиченная страница или другие строки «Что нового»."""
    if not os.path.exists(VYHOD):
        return ["нет platforma/izmeneniya.json"]
    bylo = json.loads(io.open(VYHOD, encoding="utf-8").read())
    kk = json.loads(io.open(RAZDEL_KK, encoding="utf-8").read())
    stroki = changelog()
    out = []
    for k in kursy():
        fajl = os.path.basename(k["stranica"])[:-5]
        b = bylo.get(fajl)
        if not b:
            out.append(f"{fajl}: курса нет в izmeneniya.json")
        elif git("log", "-1", "--format=%H", "--", k["stranica"]).strip() != b.get("hesh"):
            out.append(f"{fajl}: курс правился после сборки")
        elif git("status", "--porcelain", "--", k["stranica"]).strip():
            out.append(f"{fajl}: страница курса не закоммичена")
        elif [(n["ru"], n["kk"]) for n in novoe_kursa(k, stroki, {}, kk)] != [(n["ru"], n["kk"]) for n in b["novoe"]]:
            out.append(f"{fajl}: поменялись строки «Что нового»")
    return out


def main():
    if "--bystro" in sys.argv:
        out = ustarelo()
        print("\n".join(out) or "izmeneniya.json свежий")
        sys.exit(1 if out else 0)
    itog, pred = sobrat()
    tekst = json.dumps(itog, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    for p in pred:
        print("ВНИМАНИЕ:", p)
    staryi = io.open(VYHOD, encoding="utf-8").read() if os.path.exists(VYHOD) else ""
    if "--proverka" in sys.argv:
        print("izmeneniya.json", "свежий" if staryi == tekst else "УСТАРЕЛ - запустите izmeneniya/sobrat_izmeneniya.py")
        sys.exit(0 if staryi == tekst else 1)
    io.open(VYHOD, "w", encoding="utf-8", newline="\n").write(tekst)
    for f, k in sorted(itog.items()):
        print(f"{f}: правок с разным содержанием {len(k['zapisi'])}, строк «Что нового» {len(k['novoe'])}, обновлён {k['obnovlen']}")
    print("записано", VYHOD, len(tekst.encode("utf-8")) // 1024, "КБ")


if __name__ == "__main__":
    main()
