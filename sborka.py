# -*- coding: utf-8 -*-
"""Собирает обучалку из боевой программы и файла с курсами.

Смысл сборки в том, чтобы обучалка не рисовала «похожие» экраны, а брала
у боевой программы её же оформление и её же оболочку — шапку, боковое меню,
нижнюю панель на телефоне. Тогда человек, прошедший обучение, видит в работе
ровно то, к чему привык, вплоть до цвета кнопки.

Отсюда правило: поменялось оформление в боевой — достаточно прогнать сборку
заново, и обучалка подтянет его сама. Переписывать стили руками не нужно
и нельзя: две копии разойдутся молча.

Запуск:  python sborka.py
"""
import io, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

ZDES = os.path.dirname(os.path.abspath(__file__))
BOEVAYA = os.path.abspath(os.path.join(ZDES, '..', 'fbsmsalemanagers', 'index.html'))

boy = io.open(BOEVAYA, encoding='utf-8').read()

# ── оформление берём целиком, как есть ──
stili = re.findall(r'<style>(.*?)</style>', boy, re.S)
assert len(stili) == 1, 'ожидал один блок стилей в боевой программе'
stili = stili[0]

# ── оболочка: экран входа и рабочий экран ──
tel = re.search(r'<body>(.*?)<script', boy, re.S)
assert tel, 'не нашёл разметку страницы в боевой программе'
obolochka = tel.group(1)

# Кнопки в оболочке зовут функции боевой программы. Имена совпадают —
# в обучалке они свои, но называются так же, поэтому менять ничего не надо.

# ── версия боевой: показываем её же, чтобы было видно, к чему учим ──
mv = re.search(r"APP_VERSION='([^']+)'", boy)
versiya_boy = mv.group(1) if mv else '—'

kursy = io.open(os.path.join(ZDES, 'obuchenie.js'), encoding='utf-8').read()
kursy = kursy.replace('@@VERSIYA_BOEVOY@@', versiya_boy)

out = (
'<!doctype html>\n<html lang="ru">\n<head>\n'
'<meta charset="utf-8">\n'
'<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
'<title>FBSM — обучение</title>\n'
'<!--\n'
'  Обучалка FBSM. Собрана из боевой программы: оформление и оболочка взяты\n'
'  у неё же, чтобы человек учился на том виде, который увидит в работе.\n'
'  Файл собирается скриптом sborka.py — править его руками бесполезно,\n'
'  правки живут в obuchenie.js.\n'
'\n'
'  Данные здесь выдуманные. Ни один клик не уходит на сервер: двадцать\n'
'  человек, тренирующихся в боевой базе, оставили бы там записи в зарплате\n'
'  и графике, и разбирать это пришлось бы руками.\n'
'-->\n'
'<style>\n' + stili + '\n'
+ io.open(os.path.join(ZDES, 'trener.css'), encoding='utf-8').read() +
'\n</style>\n</head>\n<body>\n'
+ obolochka +
'\n<div id="trener"></div>\n'
'<script>\n' + kursy + '\n</script>\n</body>\n</html>\n')

io.open(os.path.join(ZDES, 'index.html'), 'w', encoding='utf-8', newline='\n').write(out)
print('собрано: %d КБ (стили из боевой %s)' % (len(out) // 1024, versiya_boy))
