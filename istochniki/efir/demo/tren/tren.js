/* Тренажёр курса «Окно подтверждения заказов с эфира».
 * Страницы — копии настоящего окна (live.php) на выдуманных данных, снятые
 * со стенда сборщиком sborka_trenazher.py. Этот скрипт:
 *  — показывает задание шага (?z=номер шага курса) и подсвечивает кнопку;
 *  — перехватывает всё, что в жизни ушло бы на сервер: ни один клик никуда
 *    не уходит, клиентам ничего не отправляется;
 *  — когда задание сделано, сообщает курсу (postMessage) — шаг засчитан.
 */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var Z = params.get('z') || '';
  var PAGE = window.TREN_PAGE || '';
  var DONE_KEY = 'efirTren.done.' + Z;

  // ── задания по шагам курса (номер — индекс шага) ──
  function row(tail) { return document.querySelector('tr[data-tail="' + tail + '"]'); }
  function inRow(tail, sel) { var r = row(tail); return r ? r.querySelector(sel) : null; }
  function sellerPill() {
    var a = Array.prototype.slice.call(document.querySelectorAll('.bar a.pill'));
    return a.filter(function (x) { return x.textContent.indexOf('Бектемирова') >= 0; })[0] || null;
  }
  function pickedN() { return document.querySelectorAll('.pick:checked').length; }

  var TASKS = {
    '0': { page: 'list', zad: 'Оставьте в окне только свои заказы: нажмите имя продавца «Бектемирова Аида…» в строке «Продавец».',
      tyk: function () { return sellerPill(); },
      ok: function (e) { return e.t === 'click' && e.el.closest('a.pill') && e.el.closest('a.pill').textContent.indexOf('Бектемирова') >= 0; } },
    '1': { page: 'list', zad: 'Клиент 6203 не писал в WhatsApp, но вы знаете его номер. Нажмите у него «✎ номер вручную» и впишите 8 701 000 62 03.',
      tyk: function () { return inRow('6203', 'a.setph'); },
      ok: function (e) { return e.t === 'fetch' && e.act === 'assign' && /\d{10}/.test((e.phone || '').replace(/\D/g, '')); } },
    '2': { page: 'list', zad: 'Отметьте ссылкой «☑ выбрать всех, кому можно отправить» и нажмите «Отправить отмеченным».',
      tyk: function () { return pickedN() ? document.querySelector('button[value="send"]') : document.getElementById('pickready'); },
      ok: function (e) { return e.t === 'submit' && e.act === 'send' && e.n > 0; } },
    '3': { page: 'list', zad: 'Посмотрите, что ответила клиентка 7405: откройте «подробнее» в её строке.',
      tyk: function () { return inRow('7405', 'details.more summary'); },
      ok: function (e) { return e.t === 'click' && e.el.closest('tr[data-tail="7405"] details.more summary'); } },
    '4': { page: 'list', zad: 'Клиентка 7506 прислала чек: откройте «📎 чек — открыть», затем в её строке выберите в списке «поставить статус…» → «оплачено».',
      tyk: function () { return sessionStorage.getItem('efirTren.chek') ? inRow('7506', 'select.rowmk') : inRow('7506', 'a.rc'); },
      ok: function (e) { return e.t === 'fetch' && e.act === 'mark:paid' && e.keys.join(',').indexOf('t7506') >= 0; } },
    '5': { page: 'list', zad: 'Клиентка 7607 просит отложить заказ до следующего эфира: нажмите у неё «📦 в отложку».',
      tyk: function () { return inRow('7607', '.holdbtn'); },
      ok: function (e) { return e.t === 'fetch' && e.act === 'mark:hold_on' && e.keys.join(',').indexOf('t7607') >= 0; } },
    '6': { page: 'list', zad: 'Отправьте «готов к выдаче» тем, кто забирает сам: фильтр «отправлено» → «↳ самовывоз», отметьте всех галочкой в заголовке и нажмите «Отправить это сообщение отмеченным».',
      tyk: function () {
        if (PAGE !== 'f-shipped_pickup') return document.querySelector('a[href^="f-shipped_pickup.html"]');
        return pickedN() ? document.querySelector('button[value="note"]') : document.getElementById('all');
      },
      ok: function (e) { return e.t === 'submit' && e.act === 'note' && e.n > 0 && PAGE === 'f-shipped_pickup'; } },
    '7': { page: 'list', zad: 'Найдите клиентку по последним цифрам: впишите 9455 в поле «Поиск».',
      tyk: function () { return document.getElementById('q'); },
      ok: function (e) { return e.t === 'input' && e.el.id === 'q' && e.el.value.indexOf('9455') >= 0; } },
    '8': { page: 'tracks', zad: 'Выгрузка накладных уже загружена. Нажмите «☑ отметить все уверенные», у посылки AP000008800KZ выберите, чья она, отметьте её и нажмите «Отправить трек-коды отмеченным».',
      tyk: function () {
        if (!pickedN()) return document.getElementById('pickok');
        var r = document.querySelector('input[name="to[AP000008800KZ]"]:checked');
        return r ? document.querySelector('button[value="track_send"]') : document.querySelector('input[name="to[AP000008800KZ]"]');
      },
      ok: function (e) { return e.t === 'submit' && e.act === 'track_send' && e.n > 0; } }
  };
  var task = TASKS[Z] || null;

  // ── связь с курсом ──
  function tell(msg) {
    msg.type = 'efir-tren'; msg.z = Z;
    try { if (window.parent && window.parent !== window) window.parent.postMessage(msg, '*'); } catch (e) {}
    try { if (window.opener) window.opener.postMessage(msg, '*'); } catch (e) {}
  }
  function isDone() { try { return sessionStorage.getItem(DONE_KEY) === '1'; } catch (e) { return false; } }

  // ── плашка задания ──
  var bar = document.createElement('div');
  bar.className = 'tren-bar';
  function drawBar() {
    if (!task) {
      bar.innerHTML = '<b>Тренажёр</b> — копия окна на выдуманных данных. Нажимайте что угодно: клиентам ничего не уходит.';
      return;
    }
    var d = isDone();
    bar.className = 'tren-bar' + (d ? ' ok' : '');
    bar.innerHTML = '<b>' + (d ? '✓ Задание выполнено' : 'Задание') + '</b> ' + esc(task.zad)
      + (d ? ' <span class="tren-next">Вернитесь в курс и нажмите «Дальше».</span>' : '');
  }
  function esc(s) { var x = document.createElement('div'); x.textContent = s; return x.innerHTML; }
  document.body.insertBefore(bar, document.body.firstChild);
  drawBar();

  function lightUp() {
    document.querySelectorAll('.tren-tyk').forEach(function (x) { x.classList.remove('tren-tyk'); });
    if (!task || isDone()) return;
    var el = task.tyk();
    if (el) {
      el.classList.add('tren-tyk');
      var d = el.closest('details'); if (d && el.tagName !== 'SUMMARY') d.open = true;
    }
  }
  setTimeout(lightUp, 50);
  document.addEventListener('change', function () { setTimeout(lightUp, 30); }, true);

  function event(e) {
    setTimeout(lightUp, 30);
    if (!task || isDone()) return;
    if (!task.ok(e)) return;
    try { sessionStorage.setItem(DONE_KEY, '1'); } catch (x) {}
    drawBar(); lightUp();
    tell({ done: true });
    note('✓ Задание выполнено — вернитесь в курс и нажмите «Дальше».');
  }
  if (isDone()) tell({ done: true });

  // ── всплывающая подсказка (у окна есть своя — используем её) ──
  function note(t) {
    if (typeof window.toast === 'function' && document.getElementById('toast')) { window.toast(t); return; }
    var n = document.createElement('div'); n.className = 'tren-note'; n.textContent = t;
    document.body.appendChild(n); setTimeout(function () { n.remove(); }, 4000);
  }

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
    if (/^chek\.svg/.test(href)) { try { sessionStorage.setItem('efirTren.chek', '1'); } catch (x) {} setTimeout(lightUp, 30); return; }
    if (/^[a-z0-9_-]+\.html/i.test(href) && Z !== '') {
      ev.preventDefault();
      location.href = href.split('?')[0] + '?z=' + encodeURIComponent(Z);
    }
  }, true);
  document.addEventListener('input', function (ev) { event({ t: 'input', el: ev.target }); }, true);

  // ── формы: в жизни уходят на сервер, здесь — разыгрываем результат ──
  var SAY = {
    send: 'клиентам ушёл бы состав заказа в WhatsApp',
    note: 'клиентам ушло бы это сообщение',
    close_chats: 'диалоги в Битриксе были бы завершены (переписка осталась бы)',
    track_send: 'клиентам ушли бы трек-коды, карточки стали бы «отправлено»',
    hold_note: 'клиентам ушло бы напоминание об отложке',
    hold_sent: 'отложки были бы закрыты, карточки — «отправлено»',
    hold_off: 'клиенты были бы убраны из отложки',
    track_load: 'выгрузка была бы загружена — в тренажёре она уже загружена'
  };
  document.addEventListener('submit', function (ev) {
    if (ev.defaultPrevented) return;          // окно само отменило (не отмечено, «Отмена» в вопросе)
    ev.preventDefault();
    var act = ev.submitter ? ev.submitter.value : '';
    var n = pickedN();
    if (!act) { note('В тренажёре дата одна — 14.10.2026.'); return; }
    if (act === 'send') {
      document.querySelectorAll('.pick:checked').forEach(function (c) {
        var tr = c.closest('tr'), st = tr && tr.querySelector('.st');
        if (st) { st.textContent = 'отправлено'; st.style.color = '#2f6fed'; }
        c.checked = false;
      });
    } else {
      document.querySelectorAll('.pick:checked').forEach(function (c) { c.checked = false; });
    }
    if (typeof window.upd === 'function') window.upd();
    note('Тренажёр: ' + (n ? n + ' — ' : '') + (SAY[act] || 'действие выполнено') + '. На самом деле ничего не отправлено.');
    event({ t: 'submit', act: act, n: n });
  }, false);

  // ── запросы окна без перезагрузки (статусы, отложка, «чей», номер вручную) ──
  var BOARD = {
    paid: ['оплачено', '#0c8599', 'paid'], wait_pay: ['ожидание платежа', '#7048e8', 'pay_nobank'],
    ship: ['готово к отправке', '#0c8599', 'ship'], sent_out: ['отправлено', '#2b8a3e', 'shipped'],
    confirm_kaspi: ['подтвердили — Kaspi', '#2f9e44', 'kaspi'], confirm_halyk: ['подтвердили — Halyk', '#2f9e44', 'halyk'],
    correct: ['корректировка', '#d9480f', 'correct'], manager: ['⚠ нужен менеджер', '#c92a2a', 'attention'],
    cancel: ['отменили', '#868e96', 'cancel'], clear: ['', '', '']
  };
  var realFetch = window.fetch;
  window.fetch = function (url, opt) {
    var body = opt && opt.body;
    if (!(body instanceof FormData)) return realFetch ? realFetch.apply(this, arguments) : Promise.reject(new Error('нет'));
    var act = String(body.get('act') || ''), keys = [];
    body.forEach(function (v, k) { var m = /^sel\[(.*)\]$/.exec(k); if (m) keys.push(m[1]); });
    var res = { ok: true, msg: '', rows: {} };
    if (act === 'assign') {
      var ph = String(body.get('phone') || '');
      res.msg = ph ? 'Тренажёр: номер записан бы — ' + ph + '. В жизни окно обновится и карточку можно будет отправить.'
                   : 'Тренажёр: заказ вернулся бы в общую карточку.';
      event({ t: 'fetch', act: act, phone: ph, keys: keys });
      res.ok = false;                           // окно не перезагружаем — задание видно
      return Promise.resolve({ json: function () { return Promise.resolve(res); } });
    }
    var code = act.replace(/^mark:/, '');
    keys.forEach(function (k) {
      var b = BOARD[code];
      res.rows[k] = { board: b ? b[2] : null, label: b ? b[0] : '', color: b ? b[1] : '',
        hold: code === 'hold_on' ? 1 : (code === 'hold_off' || code === 'sent_out' ? 0 : null),
        dlv: code === 'dlv_pickup' ? 'самовывоз' : (code === 'dlv_post' ? 'доставка' : null) };
    });
    res.msg = 'Тренажёр: готово. Клиенту ничего не уходит' + (code === 'wait_pay' ? ' (в жизни бот один раз напишет «счёт выставлен»)' : '') + '.';
    event({ t: 'fetch', act: act, keys: keys });
    return Promise.resolve({ json: function () { return Promise.resolve(res); } });
  };
})();
