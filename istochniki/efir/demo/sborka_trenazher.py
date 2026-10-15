# -*- coding: utf-8 -*-
"""Тренажёр курса «Окно подтверждения заказов с эфира».

Как у тренажёра программы учёта продаж: страницы не рисуются «похожими»,
а снимаются с настоящего окна (live.php из репозитория бота), запущенного на
стенде с выдуманными данными (demo/chatplace-bridge/lib_liveorders.php).
Поменялось окно — прогоните сборку, тренажёр подтянет его сам.

Запуск:  python sborka_trenazher.py <папка php бота> <куда положить efir-tren>
Нужен Docker (образ php:8.3-cli).
"""
import io, json, os, re, shutil, subprocess, sys
from urllib.parse import parse_qs, urlsplit, unquote
import html as H

ZDES = os.path.dirname(os.path.abspath(__file__))
PHP, OUT = sys.argv[1], sys.argv[2]

FILTERS = ['wait', 'kaspi', 'halyk', 'nobank', 'correct', 'attention', 'notmine', 'cancel',
           'pay_kaspi', 'pay_halyk', 'pay_nobank', 'paid', 'ship', 'ship_pickup', 'ship_post', 'ship_nodlv',
           'shipped', 'shipped_pickup', 'shipped_post', 'shipped_nodlv', 'hold',
           'st_ready', 'st_multi', 'st_check', 'st_nowa', 'st_sent', 'st_changed', 'failed', 'st_deleted']
D = '2026-10-14'
urls = {'list': f'?d={D}&s=*', 'open': '?d=open&s=*', 'holds': '?v=holds', 'tracks': '?v=tracks'}
urls.update({'f-' + f: f'?d={D}&s=*&f={f}' for f in FILTERS})
io.open(os.path.join(ZDES, 'urls.json'), 'w', encoding='utf-8').write(json.dumps(urls))

def win(p):
    return subprocess.run(['cygpath', '-w', p], capture_output=True, text=True).stdout.strip() if p.startswith('/') else p

raw = os.path.join(ZDES, 'raw')
shutil.rmtree(raw, ignore_errors=True)
r = subprocess.run(['docker', 'run', '--rm', '--network', 'none', '-v', win(PHP) + ':/app', '-v', win(ZDES) + ':/d',
                    'php:8.3-cli', 'sh', '/d/snap.sh'], capture_output=True, text=True, encoding='utf-8',
                   env=dict(os.environ, MSYS_NO_PATHCONV='1'))
bad = [l for l in r.stdout.splitlines() if 'ОШИБКИ' in l]
assert r.returncode == 0 and not bad, (r.stdout[-2000:], r.stderr[-2000:])
names = set(urls)


def target(q):
    """Ссылка окна «?…» → файл тренажёра (или '' — такой страницы нет)."""
    p = {k: v[0] for k, v in parse_qs(q.lstrip('?')).items()}
    if 'receipt' in p:
        return 'chek.svg'
    if 'export' in p or 'join' in p:
        return ''
    if p.get('v') in ('holds', 'tracks'):
        return p['v'] + '.html'
    if p.get('d') == 'open':
        return 'open.html'
    f = p.get('f', '')
    if f:
        return 'f-' + f + '.html' if ('f-' + f) in names else ''
    return 'list.html'


def fix(page, h):
    def href(m):
        q = H.unescape(m.group(1))
        t = target(q)
        return 'href="%s"' % t if t else 'href="#" data-tren="none"'
    h = re.sub(r'href="(\?[^"]*)"', href, h)
    # переписка в Битриксе и ссылки «диалог» — в тренажёре не открываются
    h = re.sub(r'href="https?://[^"]*(?:IM_DIALOG|open\.php)[^"]*"', 'href="#" data-tren="dialog"', h)
    # «Кто» — уже вписан
    h = re.sub(r'(name="who"[^>]*value=")(")', r'\1Ученик\2', h)
    # автообновление раз в 2 минуты сбросило бы задание
    h = h.replace('}, 120000);', '}, 864000000);')
    inj = '<link rel="stylesheet" href="tren.css">\n'
    h = h.replace('</head>', inj + '</head>', 1)
    h = h.replace('</body>', '<script>window.TREN_PAGE=%s;</script>\n<script src="tren.js"></script>\n</body>'
                  % json.dumps(page), 1)
    return h


os.makedirs(OUT, exist_ok=True)
for page in urls:
    h = io.open(os.path.join(raw, page + '.html'), encoding='utf-8').read()
    io.open(os.path.join(OUT, page + '.html'), 'w', encoding='utf-8', newline='\n').write(fix(page, h))
for f in ('tren.js', 'tren.css', 'chek.svg'):
    shutil.copy(os.path.join(ZDES, 'tren', f), os.path.join(OUT, f))
print('тренажёр собран:', OUT, len(urls), 'страниц')
