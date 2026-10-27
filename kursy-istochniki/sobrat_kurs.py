# -*- coding: utf-8 -*-
"""Сборщик курсов-страниц из содержания (модуль с SHAGI и BANK) по шаблону platforma/kurs/uvolnenie.html.

  python sobrat_kurs.py materialy        - собрать курс из materialy_soderzhanie.py

Что делает со шаблоном (как у «Стандарта продаж»): шаги и банк - из содержания (JSON), трудный
экзамен по кругу из всех шагов, при незачёте верные ответы не раскрываются, пауза-совет после
ZA_RAZ новых шагов подряд, блоки «Пример» / «Кейс» / «Разбор». Код сертификата считается
шаблоном из имени, даты, балла и VERSION - при новой редакции старую добавлять в VERSION_PREV.
Раньше сборщики лежали во временной папке и пропали при переезде - теперь живут здесь."""
import importlib, io, json, os, re, sys

sys.stdout.reconfigure(encoding='utf-8')
TUT = os.path.dirname(os.path.abspath(__file__))
KURSY = os.path.normpath(os.path.join(TUT, '..', 'platforma', 'kurs'))
sys.path.insert(0, TUT)

KURSY_META = {
    'materialy': dict(
        modul='materialy_soderzhanie', fail='materialy.html', key='fbsm-materialy-v1',
        version='ред.1 · 20.10.2026', version_prev=[],
        title='Материалы и одежда: что мы продаём', eyebrow='FBSM · товар · ткани и модели',
        podpis='Материалы и одежда', nazv='Волокна, полотна, модели, посадка, корейская бирка, уход, брак и наши бренды',
        tekst_kurs='Обучение «Материалы и одежда» пройдено.\\n', tekst_prog='Программа: материалы и одежда, ',
        exam=30, pass_=27, za_raz=5,
        lede='шагов о том, что мы продаём: волокна и полотна (двухнитка, трёхнитка, холодок, флис), модели и посадка, '
             'как читать корейскую бирку и значки ухода, пух, брак до продажи, уход и наши бренды. В каждом шаге - примеры '
             'и кейсы с разбором, после шага - вопрос. В конце трудный экзамен: 30 вопросов, зачёт от 27, и сертификат. '
             '<strong>Проходите частями, не больше 5 шагов за раз</strong>: курс запоминает, где вы остановились.'),
    'zarplata-upr': dict(
        modul='zarplata_upr_soderzhanie', fail='zarplata-upr.html', key='fbsm-zarplata-upr-v1',
        version='ред.1 · 22.10.2026', version_prev=[],
        title='Как считается зарплата управляющего', eyebrow='FBSM · деньги · управляющий',
        podpis='Зарплата управляющего', nazv='Оклад за смену, процент от выручки магазина, ступени плана, бонусы за чек и UPT',
        tekst_kurs='Обучение «Зарплата управляющего» пройдено.\\n', tekst_prog='Программа: зарплата управляющего, ',
        exam=10, pass_=8, za_raz=10,
        lede='шагов о том, как считается ваша зарплата: оклад за смену и отметка выхода, процент от выручки магазина и ступени плана, '
             'бонусы за средний чек и UPT, пример расчёта и где всё это видно в программе. После каждого шага - вопрос. '
             'В конце экзамен: 10 вопросов, зачёт от 8, и сертификат.'),
    'upravlyayushchiy': dict(
        modul='upravlyayushchiy_soderzhanie', fail='upravlyayushchiy.html', key='fbsm-upravlyayushchiy-v1',
        version='ред.1 · 27.10.2026', version_prev=[],
        title='Управляющий магазином FBSM', eyebrow='FBSM · регламент · управляющий',
        podpis='Управляющий магазином', nazv='Регламент работы управляющего магазином: роль, распорядок, контроль, команда, деньги, товар, покупатели, хозяйство, офис',
        tekst_kurs='Обучение «Управляющий магазином FBSM» пройдено.\\n', tekst_prog='Программа: регламент управляющего магазином, ',
        exam=30, pass_=27, za_raz=5,
        lede='шагов по регламенту работы управляющего магазином: роль и ответственный за день, утро и вечер, неделя и месяц, '
             'что контролировать, команда, скидки и товар, покупатели, хозяйство и задания офиса, нештатные ситуации, права и допуск к работе. '
             'В шагах - кейсы с разбором и ссылки на обучалки, где показано, как делать. После шага - вопрос. В конце трудный экзамен: '
             '30 вопросов из всех тем, зачёт от 27, и сертификат. Экзамен - обязательное условие самостоятельной работы управляющего. '
             '<strong>Проходите частями, не больше 5 шагов за раз</strong>: курс запоминает, где вы остановились.'),
}


def sobrat(imya):
    m = KURSY_META[imya]
    sod = importlib.import_module(m['modul'])
    SHAGI, BANK = sod.SHAGI, sod.BANK
    assert all(0 <= b['s'] < len(SHAGI) for b in BANK)
    assert all(0 <= b['r'] < len(b['o']) for b in BANK)
    assert all(0 <= s['check']['right'] < len(s['check']['opts']) for s in SHAGI)
    assert len({b['q'] for b in BANK}) == len(BANK), 'повтор вопроса в банке'
    for i in range(len(SHAGI)):
        assert sum(1 for b in BANK if b['s'] == i) >= 4, ('мало вопросов по шагу', i, SHAGI[i]['rail'])
    # Верный вариант в вопросе после шага - на разных местах (иначе запоминается «всегда Б»).
    for n, s in enumerate(SHAGI):
        c = s['check']
        verno = c['opts'][c['right']]
        ost = [o for i, o in enumerate(c['opts']) if i != c['right']]
        mesto = (n * 3 + 1) % len(c['opts'])
        c['opts'] = ost[:mesto] + [verno] + ost[mesto:]
        c['right'] = mesto
    vse_teksty = json.dumps([SHAGI, BANK], ensure_ascii=False)
    assert '—' not in vse_teksty and '–' not in vse_teksty, 'в текстах длинное или среднее тире - только дефис'

    t = io.open(os.path.join(KURSY, 'uvolnenie.html'), encoding='utf-8').read()
    t = t.replace('<script src="../kurs-start.js"></script>\n', '', 1)
    js = lambda x: json.dumps(x, ensure_ascii=False, indent=1)
    i = t.index('var STEPS = ['); j = t.index('\n  ];', i)
    t = t[:i] + 'var STEPS = ' + js(SHAGI) + ';' + t[j + len('\n  ];'):]
    i = t.index('var BANK = ['); j = t.index('\n  ];', i)
    t = t[:i] + 'var BANK = ' + js(BANK) + ';' + t[j + len('\n  ];'):]

    def rep(a, b):
        nonlocal t
        assert t.count(a) == 1, ('вхождений ' + str(t.count(a)) + ': ' + a[:70])
        t = t.replace(a, b)

    rep('<title>Тренажёр увольнения сотрудника</title>', '<title>' + m['title'] + '</title>')
    rep('<h1>Увольнение сотрудника: тренажёр</h1>', '<h1>' + m['title'] + '</h1>')
    rep('<div class="eyebrow">FBSM · Битрикс24 · HR-процессы</div>', '<div class="eyebrow">' + m['eyebrow'] + '</div>')
    rep('var VERSION = "ред.1 · 22.09.2026"', 'var VERSION = "' + m['version'] + '"')
    rep('var VERSION_PREV = [];', 'var VERSION_PREV = ' + json.dumps(m['version_prev'], ensure_ascii=False) + ';')
    rep('var KEY = "fbsm-uvolnenie-v1"', 'var KEY = "' + m['key'] + '"')
    rep('var CERT_PODPIS = "Увольнение сотрудника"', 'var CERT_PODPIS = "' + m['podpis'] + '"')
    rep('var KURS_NAZV = "Стадия «Увольнение» в смарт-процессе найма"', 'var KURS_NAZV = "' + m['nazv'] + '"')
    rep('"Обучение по HR-процессу пройдено.\\n"', '"' + m['tekst_kurs'] + '"')
    rep('"Программа: увольнение сотрудника, "', '"' + m['tekst_prog'] + '"')
    rep('var DWELL = 12000;', 'var DWELL = 20000;')
    rep('var EXAM_SIZE = 10;', 'var EXAM_SIZE = ' + str(m['exam']) + ';')
    rep('var PASS = 8;', 'var PASS = ' + str(m['pass_']) + ';')
    rep('card.appendChild(el("h2", null, "Десять вопросов по процессу"));',
        'card.appendChild(el("h2", null, "Экзамен: ' + str(m['exam']) + ' вопросов"));')
    rep('"Проходной результат - " + PASS + " из " + EXAM_SIZE + ". Вопросы и варианты каждый раз перемешиваются, так что подсмотреть чужие ответы не выйдет."'.replace(' - ', ' — '),
        '"Зачёт - " + PASS + " из " + EXAM_SIZE + ", то есть не больше " + (EXAM_SIZE - PASS) + " ошибок. Вопросы берутся из каждой темы курса, каждый раз новые и в новом порядке. Если не сдали - увидите, где ошиблись, но не правильные ответы: перечитайте эти шаги и пробуйте снова."')
    # вопросы экзамена - по кругу из каждого шага
    rep('''    var picked = shuffle(BANK).slice(0, EXAM_SIZE);''', '''    var gruppy = {};
    shuffle(BANK).forEach(function (q) { (gruppy[q.s] = gruppy[q.s] || []).push(q); });
    var kluchi = shuffle(Object.keys(gruppy));
    var picked = [];
    while (picked.length < EXAM_SIZE) {
      var bylo = picked.length;
      kluchi.forEach(function (k) { if (picked.length < EXAM_SIZE && gruppy[k].length) picked.push(gruppy[k].shift()); });
      if (picked.length === bylo) break;
    }
    picked = shuffle(picked);''')
    # при незачёте верные ответы не раскрываются
    rep('''        if (state.done) {
          if (o.right) b.classList.add("right");
          else if (state.answers[qi] === oi) b.classList.add("wrong");''', '''        if (state.done) {
          var sdal = state.exam.filter(function (x, xi) { return x.o[state.answers[xi]] && x.o[state.answers[xi]].right; }).length >= PASS;
          if (o.right && (sdal || state.answers[qi] === oi)) b.classList.add("right");
          else if (state.answers[qi] === oi) b.classList.add("wrong");''')
    # пауза-совет после ZA_RAZ новых шагов подряд
    rep('''          if (state.unlocked === state.step) { state.unlocked = state.step + 1; save(); }''',
        '''          if (state.unlocked === state.step) { state.unlocked = state.step + 1; save(); zaRaz++; }''')
    rep('''    next.addEventListener("click", function () {
      state.step = state.step + 1;
      save();
      draw();''', '''    next.addEventListener("click", function () {
      state.step = state.step + 1;
      save();
      if (zaRaz >= ZA_RAZ) { drawPauza(); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      draw();''')
    rep('''  function shuffle(a) {''', '''  /* Пауза после ZA_RAZ новых шагов подряд: совет, а не запрет - прогресс уже сохранён. */
  var ZA_RAZ = ''' + str(m['za_raz']) + ''', zaRaz = 0;
  function drawPauza() {
    var card = el("div", "card");
    card.appendChild(el("div", "eyebrow", "Пауза"));
    card.appendChild(el("h2", null, "Вы прошли " + zaRaz + " шагов подряд - хорошая порция"));
    card.appendChild(el("p", null, "Чтобы запомнилось, лучше остановиться здесь и вернуться позже - например, завтра. " +
      (state.step >= STEPS.length ? "Экзамен трудный: сдавайте его отдельным заходом, на свежую голову. " : "") +
      "Прогресс сохранён: когда откроете курс снова из раздела «Обучение», он продолжится с этого места - даже на другом телефоне или компьютере."));
    var foot = el("div", "foot");
    var dalshe = el("button", "btn ghost");
    dalshe.type = "button";
    dalshe.textContent = state.step >= STEPS.length ? "Всё равно к экзамену" : "Всё равно продолжить";
    dalshe.addEventListener("click", function () { zaRaz = 0; draw(); window.scrollTo({ top: 0, behavior: "smooth" }); });
    foot.appendChild(dalshe);
    card.appendChild(foot);
    stageEl.textContent = "";
    stageEl.appendChild(card);
  }

  function shuffle(a) {''')
    lede = re.search(r'<p class="lede">.*?</p>', t, re.S).group(0)
    t = t.replace(lede, '<p class="lede">' + str(len(SHAGI)) + ' ' + m['lede'] + '</p>')
    rep('</style>', '''  .primer, .keis { margin: 14px 0; padding: 12px 14px; border-radius: 8px; border-left: 3px solid var(--ok); background: var(--ok-soft); }
  .keis { border-left-color: var(--stamp); background: var(--stamp-soft); }
  .primer .tag, .keis .tag { display: block; font-size: 11px; letter-spacing: .09em; text-transform: uppercase; font-weight: 600; margin-bottom: 6px; color: var(--ok); }
  .keis .tag { color: var(--stamp); }
  .primer p, .keis p { margin: 0 0 6px; max-width: 62ch; }
  .keis details, details.razbor { margin-top: 6px; }
  .keis summary, details.razbor summary { cursor: pointer; font-weight: 600; color: var(--stamp); }
  details.razbor { padding: 10px 14px; border: 1px dashed var(--line); border-radius: 8px; margin: 12px 0; }
  .hangyl { font-size: 1.08em; }
</style>''')
    assert 'Увольнен' not in t.split('<script>')[0] and 'увольнен' not in t.split('<script>')[0]
    # правило Андрея: в текстах только дефис - и в надписях самого шаблона
    t = t.replace('—', '-').replace('–', '-')
    put = os.path.join(KURSY, m['fail'])
    io.open(put, 'w', encoding='utf-8', newline='\n').write(t.replace('<head>', '<head>\n<script src="../kurs-start.js"></script>', 1))
    print('курс собран:', m['fail'], len(t), 'символов,', len(SHAGI), 'шагов,', len(BANK), 'вопросов в банке')


if __name__ == '__main__':
    sobrat(sys.argv[1])
