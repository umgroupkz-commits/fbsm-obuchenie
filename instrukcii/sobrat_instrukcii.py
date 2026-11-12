# -*- coding: utf-8 -*-
"""Библиотека инструкций в разделе «Обучение»: страница для чтения по каждой инструкции, на двух языках.

  python sobrat_instrukcii.py          - собрать страницы и каталог функции (obuchenie/instrukcii.ts)
  python sobrat_instrukcii.py izvlech  - какие абзацы ещё не переведены (ru/instr_<id>.json)
  python sobrat_instrukcii.py sverka   - что отстало; то же читает proverka_obucheniya.py

Каталог - katalog.json рядом. Откуда берётся текст (поле «iz»):
  docx   - файл из папки «Инструкции FBSM», казахский перевод по абзацам: kk-kursy/kk/instr_<id>.json;
  vlozh  - полный текст уже лежит в курсе («Читать инструкцию целиком»), оба языка берутся оттуда;
  kurs   - отдельного документа нет: читается материал самого курса, оба языка берутся из него.
Отпечаток источника пишется в страницу: поменялся документ или курс - сверка это покажет."""
import glob, hashlib, html as H, io, json, os, re, subprocess, sys

sys.stdout.reconfigure(encoding='utf-8')
TUT = os.path.dirname(os.path.abspath(__file__))
OB = os.path.normpath(os.path.join(TUT, '..'))
KURSY = os.path.join(OB, 'platforma', 'kurs')
VYHOD = os.path.join(OB, 'platforma', 'instrukcii')
KK = os.path.join(OB, 'kk-kursy', 'kk')
RU = os.path.join(OB, 'kk-kursy', 'ru')
PAPKA_DOC = r'C:\Работа\Fractional CEO - клиенты\FBSM\Инструкции FBSM'
TS = os.path.normpath(os.path.join(OB, '..', 'supabase', 'functions', 'obuchenie', 'instrukcii.ts'))


def katalog():
    return json.load(io.open(os.path.join(TUT, 'katalog.json'), encoding='utf-8'))['instrukcii']


def defis(s):
    return s.replace('—', '-').replace('–', '-')


def otp(s):
    return hashlib.sha1(s.encode('utf-8')).hexdigest()[:12]


def shagi(fail):
    r = subprocess.run(['node', os.path.join(TUT, 'shagi_kursa.js'), os.path.join(KURSY, fail)], capture_output=True)
    if r.returncode:
        raise SystemExit('не прочитан курс %s: %s' % (fail, r.stderr.decode('utf-8', 'replace')[:200]))
    return json.loads(r.stdout.decode('utf-8'))


VLOZH = re.compile(r'<details class="verify"[^>]*><summary>[^<]*</summary>(?:<p[^>]*><a [^>]*>[^<]*</a></p>)?<div class="docfull"[^>]*>(.*?)</div></details>', re.S)


def iz_vlozheniya(fail, nomer):
    vse = ''.join(s['html'] for s in shagi(fail))
    naideno = VLOZH.findall(vse)
    if nomer >= len(naideno):
        raise SystemExit('в курсе %s нет вложения №%d (всего %d)' % (fail, nomer, len(naideno)))
    return defis(naideno[nomer])


def iz_kursa(fail):
    out = []
    for s in shagi(fail):
        h = VLOZH.sub('', s['html'])
        h = re.sub(r'<details class="verify".*?</details>', '', h, flags=re.S)
        out.append('<h2>' + H.escape(s['title'], quote=False) + '</h2>' + h)
    return defis('\n'.join(out))


def fail_docx(shablon):
    naideno = [f for f in glob.glob(os.path.join(PAPKA_DOC, '*.docx')) if shablon in os.path.basename(f)]
    if len(naideno) != 1:
        raise SystemExit('документ «%s»: найдено %d' % (shablon, len(naideno)))
    return naideno[0]


def bloki_docx(put):
    """Документ в список блоков: (тег, текст) или ('table', строки)."""
    import docx
    from docx.table import Table
    from docx.text.paragraph import Paragraph
    d = docx.Document(put)
    out = []
    for el in d.element.body.iterchildren():
        if el.tag.endswith('}p'):
            p = Paragraph(el, d)
            t = defis(p.text.strip())
            if not t:
                continue
            st = (p.style.name or '').lower()
            if 'title' in st or 'заголов' in st and '1' in st or st == 'heading 1':
                out.append(('h2', t))
            elif 'heading' in st or 'заголов' in st:
                out.append(('h3', t))
            elif 'list' in st or 'спис' in st or el.find('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}numPr') is not None:
                out.append(('li', t))
            else:
                out.append(('p', t))
        elif el.tag.endswith('}tbl'):
            tb = Table(el, d)
            stroki = []
            for r in tb.rows:
                ya, prev = [], None
                for c in r.cells:
                    if c._tc is prev:
                        continue
                    prev = c._tc
                    ya.append(defis(' '.join(x.text.strip() for x in c.paragraphs if x.text.strip())))
                stroki.append(ya)
            out.append(('table', stroki))
    return out


def teksty(bloki):
    for b in bloki:
        if b[0] == 'table':
            for r in b[1]:
                for c in r:
                    if c:
                        yield c
        else:
            yield b[1]


def docx_html(bloki, slovar=None):
    per = (lambda s: slovar[s]) if slovar is not None else (lambda s: s)
    # ссылки на видео (YouTube) в тексте документа - нажимаемые, в новой вкладке. Только видео: сайт обучения открытый,
    # приглашения в рабочие чаты и прочие закрытые ссылки нажимаемыми не делаем.
    e = lambda s: re.sub(r'(https://(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/)[A-Za-z0-9_-]+)',r'<a href="\1" target="_blank" rel="noopener">\1</a>',
                         H.escape(per(s) if s else '', quote=False))
    out, spisok = [], False
    for b in bloki:
        if b[0] == 'li':
            if not spisok:
                out.append('<ul>')
                spisok = True
            out.append('<li>' + e(b[1]) + '</li>')
            continue
        if spisok:
            out.append('</ul>')
            spisok = False
        if b[0] == 'table':
            r0 = '<tr>' + ''.join('<th>' + e(c) + '</th>' for c in b[1][0]) + '</tr>'
            ost = ''.join('<tr>' + ''.join('<td>' + e(c) + '</td>' for c in r) + '</tr>' for r in b[1][1:])
            out.append('<div class="tab"><table>' + r0 + ost + '</table></div>')
        else:
            out.append('<%s>%s</%s>' % (b[0], e(b[1]), b[0]))
    if spisok:
        out.append('</ul>')
    return '\n'.join(out)


SHABLON = io.open(os.path.join(TUT, 'shablon.html'), encoding='utf-8').read()


def stranica(it, kk, telo, ot):
    sl = {'ru': dict(nazad='← К инструкциям', dlya='Для кого', red='Редакция', obuch='По этой инструкции есть обучалка с примерами и экзамен: они в списке инструкций и в разделе «Мои обучения».'),
          'kk': dict(nazad='← Нұсқаулықтарға', dlya='Кімге арналған', red='Редакция', obuch='Бұл нұсқаулық бойынша мысалдары бар оқу және емтихан бар: олар нұсқаулықтар тізімінде және «Менің оқуым» бөлімінде.')}['kk' if kk else 'ru']
    z = {'{{LANG}}': 'kk' if kk else 'ru', '{{TITLE}}': H.escape(it['nazv_kk'] if kk else it['nazv'], quote=False),
         '{{DLYA}}': H.escape(it['dlya_kk'] if kk else it['dlya'], quote=False), '{{RED}}': H.escape(it.get('red_kk' if kk else 'red', ''), quote=False),
         '{{L_NAZAD}}': sl['nazad'], '{{L_DLYA}}': sl['dlya'], '{{L_RED}}': sl['red'], '{{L_OBUCH}}': sl['obuch'] if it.get('kursy') else '',
         '{{OTSTAET}}': (('<div class="otst">' + ('Құжат жаңартылуда: оқудан немесе бағдарламадан айырмашылық болса, оқу мен бағдарлама дұрыс.' if kk else 'Документ обновляется: если что-то расходится с обучалкой или программой, верны обучалка и программа.') + '</div>') if it.get('otstaet') else ''),
         '{{ID}}': it['id'], '{{OTP}}': ot, '{{TELO}}': telo}
    t = SHABLON
    for a, b in z.items():
        t = t.replace(a, b)
    return t


def istochnik(it):
    """(русский текст страницы, казахский или None, отпечаток источника, список недостающих абзацев)."""
    if it['iz'] == 'docx':
        bl = bloki_docx(fail_docx(it['fail']))
        ru = docx_html(bl)
        p = os.path.join(KK, 'instr_' + it['id'] + '.json')
        sl = json.load(io.open(p, encoding='utf-8')) if os.path.exists(p) else {}
        net = [t for t in dict.fromkeys(teksty(bl)) if t not in sl]
        kk = docx_html(bl, sl) if not net else None
        if it.get('kartinka'):
            # Картинка из папки инструкций лежит в platforma/dokumenty; на казахской странице та же, русская.
            img = '<p class="kartinka"><a href="../dokumenty/%s" target="_blank" rel="noopener"><img src="../dokumenty/%s" alt="%s" style="max-width:100%%;height:auto;border:1px solid #ddd;border-radius:8px"></a></p>\n'
            ru = img % (it['kartinka'], it['kartinka'], H.escape(it['nazv'])) + ru
            kk = kk and (img % (it['kartinka'], it['kartinka'], H.escape(it['nazv_kk'])) + kk)
        if it.get('pdf'):
            pd = '<p class="pdf"><a href="../dokumenty/%s" target="_blank" rel="noopener">%s</a></p>' + chr(10)
            ru = pd % (it['pdf'], '📄 PDF, где все ссылки нажимаются') + ru
            kk = kk and (pd % (it['pdf'], '📄 Барлық сілтемелері басылатын PDF') + kk)
        return ru, kk, otp(ru), net
    f = it['kurs_fail']
    fk = f.replace('.html', '.kk.html')
    if it['iz'] == 'vlozh':
        ru, kk = iz_vlozheniya(f, it['nomer']), iz_vlozheniya(fk, it['nomer'])
    else:
        ru, kk = iz_kursa(f), iz_kursa(fk)
    return ru, kk, otp(ru), []


def sverka():
    """Что отстало: список строк для proverka_obucheniya.py."""
    out = []
    for it in katalog():
        try:
            ru, kk, ot, net = istochnik(it)
        except SystemExit as e:
            out.append('Библиотека инструкций: «%s» не собрать: %s.' % (it['nazv'], e))
            continue
        pr = os.path.join(VYHOD, it['id'] + '.html')
        if not os.path.exists(pr):
            out.append('Библиотека инструкций: нет страницы «%s»: python fbsm-obuchenie/instrukcii/sobrat_instrukcii.py.' % it['nazv'])
        elif 'content="%s"' % ot not in io.open(pr, encoding='utf-8').read():
            out.append('Библиотека инструкций: источник «%s» изменился: пересобрать sobrat_instrukcii.py.' % it['nazv'])
        if net:
            out.append('Библиотека инструкций: «%s» - без казахского перевода %d абзацев: kk-kursy/kk/instr_%s.json.' % (it['nazv'], len(net), it['id']))
        for k in it.get('kursy') or []:
            if '"id": "%s"' % k not in io.open(os.path.join(os.path.dirname(TS), 'kursy.ts'), encoding='utf-8').read():
                out.append('Библиотека инструкций: у «%s» указан неизвестный курс %s.' % (it['nazv'], k))
    return out


def main():
    rezhim = sys.argv[1] if len(sys.argv) > 1 else 'sobrat'
    if rezhim == 'sverka':
        v = sverka()
        print('\n'.join(v) if v else 'библиотека инструкций в порядке')
        return
    os.makedirs(VYHOD, exist_ok=True)
    os.makedirs(RU, exist_ok=True)
    ts = []
    bez_kk = {}
    for it in katalog():
        ru, kk, ot, net = istochnik(it)
        if rezhim == 'izvlech':
            if net:
                json.dump(net, io.open(os.path.join(RU, 'instr_' + it['id'] + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
                print(it['id'], 'без перевода', len(net), 'абзацев,', sum(map(len, net)), 'знаков')
            continue
        io.open(os.path.join(VYHOD, it['id'] + '.html'), 'w', encoding='utf-8', newline='\n').write(stranica(it, False, ru, ot))
        if kk is not None:
            io.open(os.path.join(VYHOD, it['id'] + '.kk.html'), 'w', encoding='utf-8', newline='\n').write(stranica(it, True, kk, ot))
        else:
            bez_kk[it['id']] = len(net)
        ts.append({k: it.get(k, '') for k in ('id', 'nazv', 'gruppa', 'dlya', 'red', 'proekt', 'kursy', 'otstaet')} | {'kk': kk is not None})
    if rezhim == 'izvlech':
        return
    tekst = ('// Собрано fbsm-obuchenie/instrukcii/sobrat_instrukcii.py из katalog.json. Руками не править.\n'
             'export default ' + json.dumps(ts, ensure_ascii=False, indent=1) + ';\n')
    io.open(TS, 'w', encoding='utf-8', newline='\n').write(tekst)
    print('страниц:', len(ts), '; без казахской копии:', bez_kk or 'нет')


if __name__ == '__main__':
    main()
