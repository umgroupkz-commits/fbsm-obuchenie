# -*- coding: utf-8 -*-
"""Казахские копии курсов-страниц: platforma/kurs/<имя>.html → <имя>.kk.html.

  python kk_kurs.py izvlech [имя …]   — какие строки ещё не переведены (ru/<имя>.json, ru/_obshchie.json)
  python kk_kurs.py sobrat  [имя …]   — собрать .kk.html; без перевода хоть одной строки не собирает
  python kk_kurs.py svezhest          — какие казахские копии отстали от русских курсов (правили после перевода)

Правило: поправили русский курс — сразу izvlech → перевести новые строки → sobrat, иначе
казахская копия останется старой редакции (svezhest это покажет).

Единица перевода — цельная строка: JS-литерал с кириллицей ('…' или "…") внутри <script> и
кусок текста HTML с кириллицей вне скриптов. Словарь: kk/_obshchie.json (строки шаблона, общие
для курсов) + kk/<имя>.json; ключ — строка как она записана в исходнике (с тегами и \\-экранами).
Не переводятся (общие для обоих языков, иначе разъедутся прогресс и код сертификата):
VERSION и VERSION_PREV («ред.N · ДД.ММ.ГГГГ»), ключ сохранения KEY и комментарии.
"""
import io, json, os, re, subprocess, sys

sys.stdout.reconfigure(encoding='utf-8')
TUT = os.path.dirname(os.path.abspath(__file__))
KURSY = os.path.normpath(os.path.join(TUT, '..', 'platforma', 'kurs'))
KIR = re.compile(r'[А-Яа-яЁё]')
LIT = re.compile(r'"(?:[^"\\\n]|\\.)*"|\'(?:[^\'\\\n]|\\.)*\'')
KOMM = re.compile(r'/\*.*?\*/|(?<![:\\"\'])//[^\n]*', re.S)
NE_TROGAT = re.compile(r'^ред\.\d+ · \d\d\.\d\d\.\d{4}$')
SKRIPT = re.compile(r'(<script\b[^>]*>)(.*?)(</script>)', re.S)
TEKST_HTML = re.compile(r'>([^<>]*[А-Яа-яЁё][^<>]*)<')
ATR_HTML = re.compile(r'\b(title|aria-label|placeholder|content|alt)="([^"]*[А-Яа-яЁё][^"]*)"')


def kursy(imena):
    vse = sorted(f[:-5] for f in os.listdir(KURSY) if f.endswith('.html') and not f.endswith('.kk.html'))
    return [k for k in vse if not imena or k in imena]


def chitat(k):
    return io.open(os.path.join(KURSY, k + '.html'), encoding='utf-8').read()


def kuski_skripta(kod):
    """Литералы с кириллицей вне комментариев: [(начало, конец, содержимое)]."""
    zakryto = [(m.start(), m.end()) for m in KOMM.finditer(kod)]
    vnutri = lambda p: any(a <= p < b for a, b in zakryto)
    out = []
    for m in LIT.finditer(kod):
        s = m.group(0)[1:-1]
        if not KIR.search(s) or vnutri(m.start()) or NE_TROGAT.match(s):
            continue
        out.append((m.start() + 1, m.end() - 1, s))
    return out


def stroki(t):
    """Все переводимые строки курса по порядку."""
    out = []
    poz = 0
    for m in SKRIPT.finditer(t):
        out += html_stroki(t[poz:m.start()])
        out += [s for _, _, s in kuski_skripta(m.group(2))]
        poz = m.end()
    out += html_stroki(t[poz:])
    return out


def html_stroki(h):
    h = re.sub(r'<style\b.*?</style>', '', h, flags=re.S)
    return [m.group(1).strip() for m in TEKST_HTML.finditer(h) if m.group(1).strip()] + \
           [m.group(2) for m in ATR_HTML.finditer(h)]


def slovar(k):
    d = {}
    for f in ('_obshchie.json', k + '.json'):
        p = os.path.join(TUT, 'kk', f)
        if os.path.exists(p):
            d.update(json.load(io.open(p, encoding='utf-8')))
    return d


def izvlech(imena):
    os.makedirs(os.path.join(TUT, 'ru'), exist_ok=True)
    po_kursam = {k: list(dict.fromkeys(stroki(chitat(k)))) for k in kursy(imena)}
    vstrech = {}
    for k, ss in po_kursam.items():
        for s in ss:
            vstrech.setdefault(s, set()).add(k)
    obshchie_est = slovar('_')
    obshchie = sorted(s for s, kk in vstrech.items() if len(kk) > 1 and s not in obshchie_est)
    json.dump(obshchie, io.open(os.path.join(TUT, 'ru', '_obshchie.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('общих строк без перевода:', len(obshchie))
    for k, ss in po_kursam.items():
        d = slovar(k)
        net = [s for s in ss if s not in d and s not in obshchie]
        json.dump(net, io.open(os.path.join(TUT, 'ru', k + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print(f'{k}: строк {len(ss)}, без перевода {len(net)}')


def sobrat(imena):
    plohie = 0
    for k in kursy(imena):
        t, d = chitat(k), slovar(k)
        net = [s for s in dict.fromkeys(stroki(t)) if s not in d]
        if net:
            print(f'✗ {k}: нет перевода у {len(net)} строк, например: {net[0][:80]}')
            plohie += 1
            continue
        out, poz = [], 0
        for m in SKRIPT.finditer(t):
            out.append(html_perevesti(t[poz:m.start()], d))
            kod, kp, kusok = m.group(2), 0, []
            for a, b, s in kuski_skripta(kod):
                kusok += [kod[kp:a], d[s]]
                kp = b
            kusok.append(kod[kp:])
            out.append(m.group(1) + ''.join(kusok) + m.group(3))
            poz = m.end()
        out.append(html_perevesti(t[poz:], d))
        kk = ''.join(out).replace('<html lang="ru"', '<html lang="kk"', 1)
        # правило Андрея (20.10.2026): в текстах только дефис
        kk = kk.replace('—', '-').replace('–', '-')
        # из какой версии русского курса собрана копия — по ней «svezhest» находит устаревшие
        kk = kk.replace('<head>', '<head>\n<meta name="kk-istochnik" content="' + otpechatok(t) + '">', 1)
        put = os.path.join(KURSY, k + '.kk.html')
        io.open(put, 'w', encoding='utf-8', newline='\n').write(kk)
        # синтаксис скриптов: перевод не должен сломать кавычки. Свой файл на курс —
        # сборку могут запускать параллельно. Сломанная копия не остаётся на месте.
        js = os.path.join(TUT, f'_proverka_{k}.js')
        sloman = False
        for i, m in enumerate(SKRIPT.finditer(kk)):
            if not m.group(2).strip():
                continue
            io.open(js, 'w', encoding='utf-8').write(m.group(2))
            r = subprocess.run(['node', '--check', js], capture_output=True, text=True, encoding='utf-8')
            if r.returncode:
                print(f'✗ {k}: скрипт {i} не разбирается: {r.stderr[:300]}')
                sloman = True
        if os.path.exists(js):
            os.remove(js)
        if sloman:
            os.remove(put)
            plohie += 1
            continue
        ru_ost = [s for s in stroki(kk) if re.search(r'[ЁёЭэЩщЪъ]', re.sub(r'\(«[^»]*»\)', '', s))]
        print(f'✓ {k}.kk.html собран' + (f'; похоже на русский: {len(ru_ost)}, например {ru_ost[0][:60]}' if ru_ost else ''))
    spisok_v_kurs_start()
    return plohie


def spisok_v_kurs_start():
    """Курсы, у которых есть .kk.html, — в KK_KURSY в kurs-start.js (по нему курс открывает копию)."""
    est = sorted(f[:-8] for f in os.listdir(KURSY) if f.endswith('.kk.html'))
    p = os.path.normpath(os.path.join(KURSY, '..', 'kurs-start.js'))
    t = io.open(p, encoding='utf-8').read()
    t2 = re.sub(r'var KK_KURSY = \[[^\]]*\];', 'var KK_KURSY = ' + json.dumps(est) + ';', t, count=1)
    io.open(p, 'w', encoding='utf-8', newline='\n').write(t2)
    print('kurs-start.js: казахские копии у', ', '.join(est))


def html_perevesti(h, d):
    def tekst(m):
        s = m.group(1).strip()
        return m.group(0) if not s else m.group(0).replace(s, d.get(s, s), 1)
    h = TEKST_HTML.sub(lambda m: '>' + tekst(m)[1:-1] + '<', h)
    return ATR_HTML.sub(lambda m: f'{m.group(1)}="{d.get(m.group(2), m.group(2))}"', h)


def otpechatok(t):
    import hashlib
    return hashlib.sha1(t.encode('utf-8')).hexdigest()[:12]


def svezhest():
    """Казахские копии, собранные не из нынешней русской страницы: курс правили после перевода."""
    staryh = 0
    for f in sorted(os.listdir(KURSY)):
        if not f.endswith('.kk.html'):
            continue
        k = f[:-8]
        kk = io.open(os.path.join(KURSY, f), encoding='utf-8').read()
        m = re.search(r'<meta name="kk-istochnik" content="([0-9a-f]+)">', kk)
        if not m or m.group(1) != otpechatok(chitat(k)):
            staryh += 1
            net = [s for s in dict.fromkeys(stroki(chitat(k))) if s not in slovar(k)]
            print(f'✗ {k}: русский курс менялся после перевода; новых строк без перевода: {len(net)}')
        else:
            print(f'✓ {k}: свежая')
    return staryh


if __name__ == '__main__':
    cmd, imena = sys.argv[1], sys.argv[2:]
    if cmd == 'izvlech':
        izvlech(imena)
    elif cmd == 'sobrat':
        sys.exit(1 if sobrat(imena) else 0)
    elif cmd == 'svezhest':
        sys.exit(1 if svezhest() else 0)
