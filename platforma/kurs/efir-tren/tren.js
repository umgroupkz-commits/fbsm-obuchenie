/* Тренажёр курса «Окно подтверждения заказов с эфира».
 * Страницы — копии настоящего окна (live.php) на выдуманных данных, снятые
 * со стенда сборщиком sborka_trenazher.py. Этот скрипт:
 *  — ведёт по шагу курса (?z=номер шага) цепочкой заданий — по одному на
 *    каждую кнопку темы: подсвечивает, что нажать, и засчитывает сделанное;
 *  — перехватывает всё, что в жизни ушло бы на сервер: ни один клик никуда
 *    не уходит, клиентам ничего не отправляется;
 *  — когда вся цепочка пройдена, сообщает курсу (postMessage) — шаг засчитан.
 * Ред. 20.10.2026: по просьбе Андрея обучалка показывает каждую возможность окна.
 */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var Z = params.get('z') || '';
  var PAGE = window.TREN_PAGE || '';
  var IDX_KEY = 'efirTren.i.' + Z;

  // ── поиск элементов окна ──
  function $(sel) { return document.querySelector(sel); }
  function row(tail) { return $('tr[data-tail="' + tail + '"]'); }
  function inRow(tail, sel) { var r = row(tail); return r ? r.querySelector(sel) : null; }
  function link(file) { return $('a[href^="' + file + '"]'); }
  function tab(file) { return $('.tabs a[href^="' + file + '"]') || link(file); }
  function sellerPill() {
    return Array.prototype.slice.call(document.querySelectorAll('.bar a.pill'))
      .filter(function (x) { return x.textContent.indexOf('Бектемирова') >= 0; })[0] || null;
  }
  function pickedN() { return document.querySelectorAll('.pick:checked').length; }
  function on(page, el, nav) { return PAGE === page ? el() : nav(); }
  function has(e, t) { return (e.orders || []).join(',').indexOf(t) >= 0; }
  function keyHas(e, tail) { return (e.keys || []).join(',').indexOf('t' + tail) >= 0; }
  function inside(e, sel) { return e.t === 'click' && e.el.closest && e.el.closest(sel); }

  // ── задания: шаг курса → цепочка ──
  var TASKS = {
    '0': [
      { zad: 'Нажмите своё имя «Бектемирова Аида…» в строке «Продавец» — в окне останутся только ваши заказы.',
        tyk: function () { return on('list', sellerPill, function () { return tab('list.html'); }); },
        ok: function (e) { return inside(e, 'a.pill') && e.el.closest('a.pill').textContent.indexOf('Бектемирова') >= 0; } },
      { zad: 'Откройте вкладку «Все незакрытые» — там карточки всех эфиров за месяц, которые ещё в работе.',
        tyk: function () { return tab('open.html'); },
        ok: function (e) { return e.t === 'page' && e.page === 'open'; } },
      { zad: 'Вернитесь на вкладку «Эфир за дату».',
        tyk: function () { return tab('list.html'); },
        ok: function (e) { return e.t === 'page' && e.page === 'list'; } }
    ],
    '1': [
      { zad: 'У 2742 двое покупателей на одни цифры. Под первым заказом в списке «чей:» выберите номер, чей это заказ.',
        tyk: function () { return on('list', function () { return inRow('2742', 'select.whose'); }, function () { return tab('list.html'); }); },
        ok: function (e) { return e.t === 'fetch' && e.act === 'assign' && e.phone && (e.orders || []).length === 1 && (has(e, 'demo-1101') || has(e, 'demo-1102')); } },
      { zad: 'Можно и проще — выбрать номер кружком: у 2742 нажмите на кружок у номера. Окно его запомнит.',
        tyk: function () { return inRow('2742', 'input.phpick'); },
        ok: function (e) { return e.t === 'fetch' && e.act === 'assign' && (e.orders || []).length === 2; } },
      { zad: 'Клиент 6203 не писал в WhatsApp, но вы знаете его номер: нажмите у него «✎ номер вручную» и впишите 8 701 000 62 03.',
        tyk: function () { return inRow('6203', 'a.setph'); },
        ok: function (e) { return e.t === 'fetch' && e.act === 'assign' && has(e, 'demo-1105') && /^\d{11}$/.test((e.phone || '').replace(/\D/g, '')); } }
    ],
    '2': [
      { zad: 'Раскройте «текст сообщения» у клиента 5101 — так клиент увидит состав заказа.',
        tyk: function () { return inRow('5101', 'details:not(.more) summary'); },
        ok: function (e) { return inside(e, 'tr[data-tail="5101"] details:not(.more) summary'); } },
      { zad: 'Посмотрите на 9344: «⚠ с клиентом уже работает…» — такого «выбрать всех» не отмечает. Нажмите «☑ выбрать всех, кому можно отправить».',
        tyk: function () { return $('#pickready'); },
        ok: function (e) { return inside(e, '#pickready'); } },
      { zad: 'Нажмите «Отправить отмеченным» и подтвердите. Сообщения уходят по одному, с паузами — дождитесь конца.',
        tyk: function () { return $('button[value="send"]'); },
        ok: function (e) { return e.t === 'send' && e.act === 'send'; } }
    ],
    '3': [
      { zad: 'Откройте «подробнее» у 7405 — там ответ клиентки, банк и что она дописала после.',
        tyk: function () { return on('list', function () { return inRow('7405', 'details.more summary'); }, function () { return tab('list.html'); }); },
        ok: function (e) { return inside(e, 'tr[data-tail="7405"] details.more summary'); } },
      { zad: 'Откройте фильтр «⚠ заказ не его» в «Фильтре по статусу».',
        tyk: function () { return link('f-notmine.html'); },
        ok: function (e) { return e.t === 'page' && e.page === 'f-notmine'; } },
      { zad: 'Клиентка 9233 ответила «это не мой заказ». Нажмите у неё «✎ другой номер» и впишите номер настоящей покупательницы, например 8 705 000 92 33.',
        tyk: function () { return inRow('9233', 'a.setph'); },
        ok: function (e) { return e.t === 'fetch' && e.act === 'assign' && has(e, 'demo-1115'); } }
    ],
    '4': [
      { zad: 'Клиентка 7506 прислала чек: нажмите у неё «📎 чек — открыть». Чек откроется сразу, без входа в диалог.',
        tyk: function () { return on('list', function () { return inRow('7506', 'a.rc'); }, function () { return tab('list.html'); }); },
        ok: function (e) { return inside(e, 'tr[data-tail="7506"] a.rc'); } },
      { zad: 'Сумма сходится. В строке 7506 выберите в списке «поставить статус…» → «оплачено».',
        tyk: function () { return inRow('7506', 'select.rowmk'); },
        ok: function (e) { return e.t === 'fetch' && e.act === 'mark:paid' && keyHas(e, '7506'); } },
      { zad: 'Нескольким сразу: отметьте галочкой 7607, вверху выберите «Статус выбранным…» → «готово к отправке» и нажмите «Поставить».',
        tyk: function () {
          var c = inRow('7607', '.pick');
          if (c && !c.checked) return c;
          return $('#mk') && !$('#mk').value ? $('#mk') : $('#mkgo');
        },
        ok: function (e) { return e.t === 'fetch' && e.act === 'mark:ship' && keyHas(e, '7607'); } }
    ],
    '5': [
      { zad: 'Клиентка 7304 просит отложить заказ до следующего эфира: нажмите у неё «📦 в отложку».',
        tyk: function () { return on('list', function () { return inRow('7304', '.holdbtn'); }, function () { return tab('list.html'); }); },
        ok: function (e) { return e.t === 'fetch' && e.act === 'mark:hold_on' && keyHas(e, '7304'); } },
      { zad: 'Откройте вкладку «📦 Отложки» — все, кто копит заказы.',
        tyk: function () { return tab('holds.html'); },
        ok: function (e) { return e.t === 'page' && e.page === 'holds'; } },
      { zad: 'Найдите клиентку по последним цифрам: впишите 9122 в поле «Поиск».',
        tyk: function () { return on('holds', function () { return $('#q'); }, function () { return tab('holds.html'); }); },
        ok: function (e) { return e.t === 'input' && e.el.id === 'q' && e.el.value.indexOf('9122') >= 0 && PAGE === 'holds'; } },
      { zad: 'Раскройте «состав» — что лежит в её отложке и с каких эфиров.',
        tyk: function () { return $('#hf table details summary'); },
        ok: function (e) { return inside(e, '#hf table details summary'); } },
      { zad: 'Отметьте её галочкой и нажмите «Отправить это сообщение отмеченным» — напоминание с составом и суммой.',
        tyk: function () { var c = $('#hf .pick'); return c && !c.checked ? c : $('button[value="hold_note"]'); },
        ok: function (e) { return e.t === 'send' && e.act === 'hold_note'; } }
    ],
    '6': [
      { zad: 'Клиентка 7405 заберёт сама: в её строке нажмите «🏬 самовывоз».',
        tyk: function () { return on('list', function () { return inRow('7405', 'a.dlv[data-v="dlv_pickup"]'); }, function () { return tab('list.html'); }); },
        ok: function (e) { return e.t === 'fetch' && e.act === 'mark:dlv_pickup' && keyHas(e, '7405'); } },
      { zad: 'Откройте фильтр «отправлено» → «↳ самовывоз».',
        tyk: function () { return link('f-shipped_pickup.html'); },
        ok: function (e) { return e.t === 'page' && e.page === 'f-shipped_pickup'; } },
      { zad: 'Отметьте всех галочкой в заголовке, оставьте «и завершить их чаты» и нажмите «Отправить это сообщение отмеченным».',
        tyk: function () { return pickedN() ? $('button[value="note"]') : $('#all'); },
        ok: function (e) { return e.t === 'send' && e.act === 'note' && PAGE === 'f-shipped_pickup'; } },
      { zad: 'Вернитесь в «Эфир за дату», отметьте 8900 и нажмите «✅ Завершить чаты» — диалог закроется, переписка останется.',
        tyk: function () {
          if (PAGE !== 'list') return tab('list.html');
          var c = inRow('8900', '.pick');
          return c && !c.checked ? c : $('button[value="close_chats"]');
        },
        ok: function (e) { return e.t === 'submit' && e.act === 'close_chats'; } }
    ],
    '7': [
      { zad: 'Откройте фильтр «ждём ответа» — кому состав ушёл, а ответа ещё нет.',
        tyk: function () { return link('f-wait.html'); },
        ok: function (e) { return e.t === 'page' && e.page === 'f-wait'; } },
      { zad: 'Нажмите «все» рядом с «Фильтр по статусу» — фильтр сбросится.',
        tyk: function () { return link('list.html'); },
        ok: function (e) { return e.t === 'page' && e.page === 'list'; } },
      { zad: 'Найдите клиентку по последним цифрам: впишите 9455 в поле «Поиск».',
        tyk: function () { return $('#q'); },
        ok: function (e) { return e.t === 'input' && e.el.id === 'q' && e.el.value.indexOf('9455') >= 0; } },
      { zad: 'Очистите поиск и в «Сортировке» выберите «по сумме ↓».',
        tyk: function () { return $('#sort'); },
        ok: function (e) { return e.t === 'change' && e.el.id === 'sort' && e.el.value === 'sum'; } },
      { zad: 'Калькулятор 🧮: наберите 7395+1800 — окно посчитает сумму для клиента.',
        tyk: function () { return $('#calc'); },
        ok: function (e) { return e.t === 'input' && e.el.id === 'calc' && e.el.value.replace(/\s/g, '').indexOf('7395+1800') >= 0; } }
    ],
    '8': [
      { zad: 'Выгрузка накладных уже загружена. Нажмите «☑ отметить все уверенные» — посылки, где совпал номер телефона.',
        tyk: function () { return on('tracks', function () { return $('#pickok'); }, function () { return tab('tracks.html'); }); },
        ok: function (e) { return inside(e, '#pickok'); } },
      { zad: 'У посылки AP000008800KZ две подходящие карточки: выберите кружком, чья она, и отметьте её галочкой слева.',
        tyk: function () {
          var r = $('input[name="to[AP000008800KZ]"]:checked');
          return r ? $('input[name="sel[AP000008800KZ]"]') : $('input[name="to[AP000008800KZ]"]');
        },
        ok: function () {
          var r = $('input[name="to[AP000008800KZ]"]:checked'), c = $('input[name="sel[AP000008800KZ]"]');
          return !!(r && c && c.checked);
        } },
      { zad: 'Нажмите «Отправить трек-коды отмеченным» — клиентам уйдут трек-коды, карточки станут «отправлено».',
        tyk: function () { return $('button[value="track_send"]'); },
        ok: function (e) { return e.t === 'send' && e.act === 'track_send'; } }
    ]
  };
  var list = TASKS[Z] || null;

  // ── ход по цепочке ──
  function idx() { try { return +(sessionStorage.getItem(IDX_KEY) || 0); } catch (e) { return 0; } }
  function setIdx(i) { try { sessionStorage.setItem(IDX_KEY, String(i)); } catch (e) {} }
  function done() { return !!list && idx() >= list.length; }
  function cur() { return list && !done() ? list[idx()] : null; }

  // ── связь с курсом ──
  function tell(msg) {
    msg.type = 'efir-tren'; msg.z = Z;
    try { if (window.parent && window.parent !== window) window.parent.postMessage(msg, '*'); } catch (e) {}
    try { if (window.opener) window.opener.postMessage(msg, '*'); } catch (e) {}
  }

  // ── плашка задания ──
  var bar = document.createElement('div');
  bar.className = 'tren-bar';
  function esc(s) { var x = document.createElement('div'); x.textContent = s; return x.innerHTML; }
  function drawBar() {
    if (!list) {
      bar.innerHTML = '<b>Тренажёр</b> — копия окна на выдуманных данных. Нажимайте что угодно: клиентам ничего не уходит.';
      return;
    }
    var i = idx(), n = list.length, dots = '';
    for (var k = 0; k < n; k++) dots += '<i class="' + (k < i ? 'ok' : (k === i ? 'now' : '')) + '"></i>';
    if (done()) {
      bar.className = 'tren-bar ok';
      bar.innerHTML = '<span class="tren-dots">' + dots + '</span><b>✓ Все задания выполнены</b> '
        + '<span class="tren-next">Вернитесь в курс и нажмите «Дальше».</span>';
      return;
    }
    bar.className = 'tren-bar';
    bar.innerHTML = '<span class="tren-dots">' + dots + '</span><b>Задание ' + (i + 1) + ' из ' + n + '</b> ' + esc(list[i].zad);
  }
  document.body.insertBefore(bar, document.body.firstChild);
  drawBar();

  function lightUp() {
    document.querySelectorAll('.tren-tyk').forEach(function (x) { x.classList.remove('tren-tyk'); });
    var t = cur();
    if (!t) return;
    var el = t.tyk();
    if (el) {
      el.classList.add('tren-tyk');
      var d = el.closest('details'); if (d && el.tagName !== 'SUMMARY') d.open = true;
    }
  }
  setTimeout(lightUp, 60);

  function event(e) {
    var t = cur();
    if (t && t.ok(e)) {
      setIdx(idx() + 1);
      drawBar();
      if (done()) { tell({ done: true }); note('✓ Все задания шага выполнены — вернитесь в курс и нажмите «Дальше».'); }
      else note('✓ Готово. Задание ' + (idx() + 1) + ' из ' + list.length + ' — в жёлтой плашке сверху.');
    }
    setTimeout(lightUp, 40);
  }
  if (done()) tell({ done: true });

  function note(t) {
    if (typeof window.toast === 'function' && $('#toast')) { window.toast(t); return; }
    var n = document.createElement('div'); n.className = 'tren-note'; n.textContent = t;
    document.body.appendChild(n); setTimeout(function () { n.remove(); }, 4000);
  }

  // В тренажёре паузы между сообщениями не нужны: клиентам ничего не уходит.
  window.pause = function () { return 250; };

  // ── ссылки: страницы тренажёра — с номером шага; остальное — подсказка ──
  document.addEventListener('click', function (ev) {
    var el = ev.target;
    if (el.closest) event({ t: 'click', el: el });
    var a = el.closest ? el.closest('a') : null;
    if (!a) return;
    var tren = a.getAttribute('data-tren');
    if (tren === 'dialog') { ev.preventDefault(); note('В тренажёре чат не открывается. В работе здесь откроется переписка с клиентом в Битриксе.'); return; }
    if (tren === 'none') { ev.preventDefault(); note('В тренажёре эта ссылка не открывается.'); return; }
    var href = a.getAttribute('href') || '';
    if (/^[a-z0-9_-]+\.html/i.test(href) && Z !== '') {
      ev.preventDefault();
      location.href = href.split('?')[0] + '?z=' + encodeURIComponent(Z);
    }
  }, true);
  document.addEventListener('input', function (ev) { event({ t: 'input', el: ev.target }); }, true);
  document.addEventListener('change', function (ev) { event({ t: 'change', el: ev.target }); setTimeout(lightUp, 40); }, true);

  // ── обычные формы (завершить чаты, отложки): в жизни уходят на сервер ──
  var SAY = {
    send: 'клиенту ушёл бы состав заказа в WhatsApp',
    note: 'клиенту ушло бы это сообщение',
    close_chats: 'диалоги в Битриксе были бы завершены (переписка осталась бы)',
    track_send: 'клиенту ушёл бы трек-код, карточка стала бы «отправлено»',
    hold_note: 'клиенту ушло бы напоминание об отложке',
    hold_sent: 'отложки были бы закрыты, карточки — «отправлено»',
    hold_off: 'клиенты были бы убраны из отложки',
    track_load: 'выгрузка была бы загружена — в тренажёре она уже загружена'
  };
  document.addEventListener('submit', function (ev) {
    if (ev.defaultPrevented) return;          // окно само отменило или шлёт по одному запросами
    ev.preventDefault();
    var sb = ev.submitter || (ev.target && ev.target._btn) || null;
    var act = sb ? sb.value : '';
    var n = pickedN();
    if (!act) { note('В тренажёре дата одна — 14.10.2026.'); return; }
    document.querySelectorAll('.pick:checked').forEach(function (c) { c.checked = false; });
    if (typeof window.upd === 'function') window.upd();
    note('Тренажёр: ' + (n ? n + ' — ' : '') + (SAY[act] || 'действие выполнено') + '. На самом деле ничего не отправлено.');
    event({ t: 'submit', act: act, n: n });
  }, false);

  // ── запросы окна (статусы, отложка, «чей», номер, отправка по одному) ──
  var BOARD = {
    paid: ['оплачено', '#0c8599', 'paid'], wait_pay: ['ожидание платежа', '#7048e8', 'pay_nobank'],
    ship: ['готово к отправке', '#0c8599', 'ship'], sent_out: ['отправлено', '#2b8a3e', 'shipped'],
    confirm_kaspi: ['подтвердили — Kaspi', '#2f9e44', 'kaspi'], confirm_halyk: ['подтвердили — Halyk', '#2f9e44', 'halyk'],
    correct: ['корректировка', '#d9480f', 'correct'], manager: ['⚠ нужен менеджер', '#c92a2a', 'attention'],
    cancel: ['отменили', '#868e96', 'cancel'], clear: ['', '', '']
  };
  function reply(obj) { return Promise.resolve({ json: function () { return Promise.resolve(obj); } }); }
  var realFetch = window.fetch;
  window.fetch = function (url, opt) {
    var body = opt && opt.body;
    if (!(body instanceof FormData)) return realFetch ? realFetch.apply(this, arguments) : Promise.reject(new Error('нет'));
    var act = String(body.get('act') || ''), keys = [], orders = body.getAll('orders[]').map(String);
    body.forEach(function (v, k) { var m = /^sel\[(.*)\]$/.exec(k); if (m) keys.push(m[1]); });
    if (act === 'assign') {
      var ph = String(body.get('phone') || '');
      event({ t: 'fetch', act: act, phone: ph, keys: keys, orders: orders });
      return reply({ ok: false,                 // окно не перезагружаем — задание видно
        msg: ph ? 'Тренажёр: номер был бы записан — ' + ph + '. В работе окно запомнит его у карточки.'
                : 'Тренажёр: заказ вернулся бы в общую карточку.' });
    }
    // Отправка по одному клиенту за запрос (состав, рассылка, трек-коды, напоминания).
    if (SAY[act] && act !== 'close_chats' && act !== 'hold_sent' && act !== 'hold_off' && act !== 'track_load') {
      if (act === 'send') keys.forEach(function (k) {
        var c = $('.pick[name="sel[' + k.replace(/"/g, '\\"') + ']"]');
        var tr = c && c.closest('tr'), st = tr && tr.querySelector('.st');
        if (st) { st.textContent = 'отправлено'; st.style.color = '#2f6fed'; }
      });
      note('Тренажёр: ' + SAY[act] + '. На самом деле ничего не отправлено.');
      event({ t: 'send', act: act, keys: keys });
      return reply({ ok: true, sent: 1, bad: [] });
    }
    var code = act.replace(/^mark:/, ''), rows = {};
    keys.forEach(function (k) {
      var b = BOARD[code];
      rows[k] = { board: b ? b[2] : null, label: b ? b[0] : '', color: b ? b[1] : '',
        hold: code === 'hold_on' ? 1 : (code === 'hold_off' || code === 'sent_out' ? 0 : null),
        dlv: code === 'dlv_pickup' ? 'самовывоз' : (code === 'dlv_post' ? 'доставка' : null) };
    });
    event({ t: 'fetch', act: act, keys: keys });
    return reply({ ok: true, rows: rows, sent: 1, bad: [],
      msg: 'Тренажёр: готово. Клиенту ничего не уходит' + (code === 'wait_pay' ? ' (в работе один раз уйдёт «счёт выставлен»)' : '') + '.' });
  };

  event({ t: 'page', page: PAGE });
})();
