/* Запуск курса из раздела «Обучение».
 *
 * Подключается первым скриптом в <head> каждого курса (platforma/kurs/*.html)
 * и тренажёра программы (index.html в корне, через sborka.py). Без параметров
 * ничего не делает — курс открывается как публичный, с сертификатом.
 *
 * Параметры адреса (их ставит функция obuchenie, когда рисует «Мои обучения»):
 *   k — id курса: тренажёру по нему выбирается должность (window.__KURS_ROL);
 *   i — имя для сертификата (window.__KURS_IMYA);
 *   s — пропуск: по завершении результат уходит на /api/finish и записывается
 *       на человека, которого подтвердил портал (сервер сверяет пропуск сам);
 *       по нему же прогресс курса хранится в базе (/api/progress) — см. ниже.
 *
 * Скрипт синхронный: должность обязана быть известна до того, как тренажёр
 * начнёт рисовать экран.
 */
(function () {
  var API = "https://qeehxcnnuzuwskznhdyg.supabase.co/functions/v1/obuchenie";
  // Курс → должность в тренажёре. Тот же список, что rol в supabase/functions/obuchenie/kursy.ts.
  var ROL = {"programma-seller":"seller","programma-manager":"manager","programma-runner":"runner","programma-store":"store","programma-whhead":"whhead","programma-immgr":"immgr","programma-aho":"aho","programma-streamer":"streamer","programma-streammgr":"streammgr","programma-accountant":"accountant","programma-hr":"hr","programma-smm":"smm","programma-admin":"admin"};

  // Исходное удаление из localStorage - до того, как прогресс ниже начнёт пересылать каждое удаление в базу.
  var DEL0 = Storage.prototype.removeItem;
  var q;
  try { q = new URLSearchParams(location.search); } catch (e) { return; }
  var kurs = q.get("k") || "", pass = q.get("s") || "", imya = q.get("i") || "";

  /* ── Язык курса: русский или казахская копия <имя>.kk.html ──
   * Выбор один на программу FBSM и обучение: localStorage 'fbsm.yazyk' (программа и обучение
   * на одном источнике umgroupkz-commits.github.io) и users.yazyk на сервере. ?l= в адресе
   * ставит раздел «Обучение» по выбору человека в базе — он главнее. Список курсов, у которых
   * есть казахская копия, дописывает сборщик kk-kursy/kk_kurs.py. */
  var KK_KURSY = ["dostizheniya", "efir", "instrukcii-seller", "loyalnost", "materialy", "otchet", "poyasa", "priem", "revizii", "skidki", "spisanie", "standart", "telegram", "upravlyayushchiy", "uvolnenie", "vozvraty", "zarplata", "zarplata-upr", "zhaloby"];
  var YAZ_KL = "fbsm.yazyk";
  var mKurs = location.pathname.match(/\/kurs\/([a-z0-9-]+?)(\.kk)?\.html$/);
  if (mKurs && KK_KURSY.indexOf(mKurs[1]) >= 0) {
    var yaz = q.get("l");
    if (yaz === "kk" || yaz === "ru") { try { localStorage.setItem(YAZ_KL, yaz); } catch (e) {} }
    else { try { yaz = localStorage.getItem(YAZ_KL) === "kk" ? "kk" : "ru"; } catch (e) { yaz = "ru"; } }
    var naKk = !!mKurs[2];
    var kuda = function (y) {
      var qs = new URLSearchParams(location.search); qs.set("l", y);
      return location.pathname.replace(/(\.kk)?\.html$/, y === "kk" ? ".kk.html" : ".html") + "?" + qs.toString() + location.hash;
    };
    if ((yaz === "kk") !== naKk) { location.replace(kuda(yaz)); return; }
    document.addEventListener("DOMContentLoaded", function () {
      var box = document.createElement("div");
      box.style.cssText = "position:fixed;top:10px;right:10px;z-index:98;display:flex;border-radius:999px;overflow:hidden;" +
        "box-shadow:0 1px 4px rgba(0,0,0,.25);font:600 13px/1 system-ui,sans-serif";
      [["kk", "Қаз"], ["ru", "Рус"]].forEach(function (v) {
        var b = document.createElement("button");
        b.type = "button"; b.textContent = v[1];
        b.style.cssText = "border:0;padding:8px 12px;cursor:pointer;" +
          (v[0] === yaz ? "background:#22307E;color:#fff" : "background:#fff;color:#22307E");
        b.addEventListener("click", function () {
          if (v[0] === yaz) return;
          try { localStorage.setItem(YAZ_KL, v[0]); } catch (e) {}
          var dalshe = function () { location.href = kuda(v[0]); };
          if (/^[0-9a-f-]{36}$/i.test(pass)) {
            fetch(API + "/api/yazyk?forceFunctionRegion=ap-northeast-2", {
              method: "POST", headers: { "Content-Type": "text/plain" }, keepalive: true,
              body: JSON.stringify({ s: pass, yazyk: v[0] })
            }).then(dalshe, dalshe);
          } else dalshe();
        });
        box.appendChild(b);
      });
      document.body.appendChild(box);
    });
  }

  if (!kurs) return;
  if (ROL[kurs]) window.__KURS_ROL = ROL[kurs];
  if (imya) window.__KURS_IMYA = imya.slice(0, 80);
  if (!/^[0-9a-f-]{36}$/i.test(pass)) return;

  /* ── Прогресс в базе: курс продолжается с того же шага на любом устройстве ──
   * Курсы хранят своё состояние в localStorage под ключом fbsm-… (тренажёр — fbsm.obuch.v2).
   * Здесь каждая такая запись копируется в базу (/api/progress, по пропуску), а при открытии
   * более свежая запись из базы кладётся в браузер, и страница один раз перезагружается.
   * Пока база не ответила, ничего не отправляем: иначе пустой старт на новом телефоне
   * затёр бы прогресс, сделанный на другом устройстве. */
  (function () {
    var LS;
    try { LS = window.localStorage; LS.getItem("fbsm-proba"); } catch (e) { return; }
    var URL_P = API + "/api/progress?forceFunctionRegion=ap-northeast-2";
    var TS = "fbsm-sync-vremya", PEREZ = "fbsm-sync-perezagruzka";
    var NASH = /^fbsm[-.][a-z0-9.-]{1,60}$/i;
    var proto = Storage.prototype, set0 = proto.setItem, del0 = proto.removeItem;
    var vremena = {};
    try { vremena = JSON.parse(LS.getItem(TS) || "{}") || {}; } catch (e) {}
    var gotov = false, ochered = {}, tajmer = null;

    function vremya(k, v) { vremena[k] = v; try { set0.call(LS, TS, JSON.stringify(vremena)); } catch (e) {} }
    function meta(znach) {
      var m = { shag: 0, vsego: 0, ekzamen: false };
      try {
        var st = JSON.parse(znach);
        var rail = document.querySelectorAll("#rail button").length;
        if (st && typeof st.unlocked === "number") {          // курс-страница
          m.vsego = rail > 1 ? rail - 1 : 0;
          m.shag = m.vsego ? Math.min(st.unlocked, m.vsego) : st.unlocked;
          m.ekzamen = !!st.exam || (m.vsego > 0 && st.step >= m.vsego);
        } else if (st && typeof st.i === "number") {          // тренажёр программы
          m.shag = st.i;
        }
      } catch (e) {}
      return m;
    }
    function otpravit(keepalive) {
      if (!gotov) return;
      Object.keys(ochered).forEach(function (k) {
        var v = ochered[k]; delete ochered[k];
        var telo = { s: pass, kurs: kurs, kluch: k, znachenie: v };
        if (v !== null) { var m = meta(v); telo.shag = m.shag; telo.vsego = m.vsego; telo.ekzamen = m.ekzamen; }
        try {
          fetch(URL_P, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(telo), keepalive: !!keepalive })
            .then(function (r) { return r.json(); })
            .then(function (o) { if (o && o.ok) vremya(k, String(o.vremya)); })
            .catch(function () {});
        } catch (e) {}
      });
    }
    function vOchered(k, v) {
      if (!NASH.test(k) || k === TS || k === PEREZ) return;
      ochered[k] = v;
      clearTimeout(tajmer);
      tajmer = setTimeout(otpravit, 1500);
    }
    proto.setItem = function (k, v) { set0.apply(this, arguments); if (this === LS) vOchered(String(k), String(v)); };
    proto.removeItem = function (k) { del0.apply(this, arguments); if (this === LS) vOchered(String(k), null); };
    addEventListener("pagehide", function () { otpravit(true); });
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") otpravit(true); });

    var bylaPerezagruzka = false;
    try { bylaPerezagruzka = sessionStorage.getItem(PEREZ) === "1"; sessionStorage.removeItem(PEREZ); } catch (e) {}
    if (bylaPerezagruzka) {
      addEventListener("DOMContentLoaded", function () {
        var bar = document.createElement("div");
        bar.style.cssText = "position:fixed;left:0;right:0;top:0;padding:10px 16px;text-align:center;z-index:99;" +
          "font:600 14px/1.4 system-ui,sans-serif;color:#fff;background:#22307E";
        bar.textContent = "Продолжаем с того места, где вы остановились";
        document.body.appendChild(bar);
        setTimeout(function () { bar.remove(); }, 6000);
      });
    }

    fetch(URL_P + "&s=" + encodeURIComponent(pass))
      .then(function (r) { return r.json(); })
      .then(function (o) {
        if (!o || !o.ok) return;                 // нет ответа базы — ничего не пишем
        var pomenyal = false;
        (o.zapisi || []).forEach(function (z) {
          var k = String(z.kluch), v = String(z.znachenie), t = String(z.vremya);
          if (!NASH.test(k) || !(t > (vremena[k] || ""))) return;
          if (LS.getItem(k) !== v) { set0.call(LS, k, v); pomenyal = true; }
          vremya(k, t);
        });
        if (pomenyal && !bylaPerezagruzka) {
          ochered = {};                          // то, что страница успела записать, — старее базы
          try { sessionStorage.setItem(PEREZ, "1"); } catch (e) {}
          location.reload();
          return;
        }
        gotov = true;
        otpravit(false);
      })
      .catch(function () {});
  })();

  /* ── Что поменялось с вашей сдачи ──
   * Человек открывает курс, который уже сдавал (дата сдачи - /api/sdano), а курс с тех пор менялся.
   * Тогда: плашка над полосой шагов (изменённые шаги и строки «Что нового» после сдачи), метка на
   * изменённых шагах в полосе и жёлтая подсветка новых и изменённых абзацев внутри шага.
   * Что изменилось - из ../izmeneniya.json (собирает izmeneniya/sobrat_izmeneniya.py по истории
   * правок курса). Свёрнута ли плашка - localStorage 'izm-svernut.<курс>' (в базу не уходит). */
  (function () {
    if (!mKurs) return;
    var fajl = mKurs[1], kk = !!mKurs[2];
    var T = kk ? {
      zag: "Курс сіз тапсырғаннан кейін жаңартылды", sdali: "сіз тапсырдыңыз",
      shagi: "Өзгерген қадамдар:", chto: "Не өзгерді:",
      podsk: "Өзгерген қадамдар жолақта сары сызықпен белгіленген, жаңа және өзгерген мәтін сары түспен боялған.",
      nedost: "Бұл қадамға курсты ретімен өтіп жетесіз.",
      metka: "Сіз тапсырғаннан кейін өзгерді",
      shag: "Бұл қадам сіз тапсырғаннан кейін өзгерді.", vse: " Бұл - жаңа қадам.",
      abz: " Жаңа және өзгерген мәтін сары түспен боялған.", drugoe: " Өзгеріс сұрақта немесе алынып тасталған мәтінде."
    } : {
      zag: "Курс обновлён после вашей сдачи", sdali: "вы сдали",
      shagi: "Изменённые шаги:", chto: "Что поменялось:",
      podsk: "Изменённые шаги отмечены жёлтой полосой, новый и изменённый текст подсвечен жёлтым.",
      nedost: "До этого шага нужно дойти по порядку.",
      metka: "Изменено после вашей сдачи",
      shag: "Этот шаг изменён после вашей сдачи.", vse: " Это новый шаг.",
      abz: " Новый и изменённый текст подсвечен жёлтым.", drugoe: " Изменение - в вопросе или в убранном тексте."
    };
    var data = function (iso) {
      var d = new Date(Date.parse(iso) + 5 * 3600000).toISOString().slice(0, 10).split("-");
      return d[2] + "." + d[1] + "." + d[0];
    };
    var kesh = Math.floor(Date.now() / 600000);
    Promise.all([
      fetch("../izmeneniya.json?v=" + kesh).then(function (r) { return r.json(); }),
      fetch(API + "/api/sdano?forceFunctionRegion=ap-northeast-2&k=" + encodeURIComponent(kurs) + "&s=" + encodeURIComponent(pass))
        .then(function (r) { return r.json(); })
    ]).then(function (otv) {
      var K = otv[0] && otv[0][fajl], sdano = otv[1] && otv[1].ok && otv[1].sdano;
      var zanovo = otv[1] && otv[1].ok && otv[1].zanovo;
      if (zanovo) { snova(K, zanovo); return; }
      if (!K || !sdano || !K.zapisi || !K.zapisi.length) return;
      var ts = Date.parse(sdano), rec = K.zapisi[0];
      K.zapisi.forEach(function (z) { if (Date.parse(z.t) <= ts) rec = z; });
      var izm = rec.izm || {};
      var novoe = (K.novoe || []).filter(function (n) { return Date.parse(n.t) > ts; });
      var nomera = Object.keys(izm).map(Number).sort(function (a, b) { return a - b; });
      if (!nomera.length && !novoe.length) return;
      var gotovo = function () { pokazat(K, izm, nomera, novoe, sdano); };
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", gotovo); else gotovo();
    }).catch(function () {});

    /* Курс назначен заново по незачёту проверки знаний (решение Андрея 10.11.2026): прежняя сдача погашена,
     * прогресс в базе стёрт. Один раз на этом устройстве стираем и прежнее состояние курса в браузере -
     * исходным removeItem, без записи в базу: если человек уже начал заново на другом устройстве, его
     * свежий прогресс придёт из базы при перезагрузке. Потом - плашка, зачем проходить снова. */
    function snova(K, zanovo) {
      var MET = "izm-sbros." + fajl + "." + zanovo;
      var bylo = null;
      try { bylo = localStorage.getItem(MET); } catch (e) { return; }
      if (!bylo && K && K.kluch) {
        try {
          localStorage.setItem(MET, "1");
          if (localStorage.getItem(K.kluch) !== null) { DEL0.call(localStorage, K.kluch); location.reload(); return; }
        } catch (e) {}
      }
      var gotovo = function () {
        var rail = document.getElementById("rail");
        if (!rail || document.getElementById("izm-snova")) return;
        var d = document.createElement("div");
        d.id = "izm-snova";
        d.style.cssText = "margin:16px 0 0;padding:12px 16px;border-radius:8px;background:#FDE8E6;color:#5A1712;" +
          "border:1px solid #E5A29B;font:600 15px/1.45 system-ui,sans-serif";
        d.textContent = kk
          ? "Курс " + data(zanovo) + " білімді тексеру нәтижесі бойынша қайта тағайындалды: оны басынан қайта өтіп, емтиханды тапсырыңыз. Курс үшін «Үкі» тапсырғаннан кейін қайта беріледі."
          : "Курс назначен заново " + data(zanovo) + " по итогам проверки знаний: пройдите его с начала и сдайте экзамен. «Сова» за курс вернётся после сдачи.";
        rail.parentNode.insertBefore(d, rail);
      };
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", gotovo); else gotovo();
    }

    function pokazat(K, izm, nomera, novoe, sdano) {
      var rail = document.getElementById("rail"), stage = document.getElementById("stage");
      if (!rail || !stage) return;
      var knopki = function () { return rail.querySelectorAll("button"); };
      var stil = document.createElement("style");
      stil.textContent =
        "#izm-plashka{margin:16px 0 0;padding:12px 16px;border-radius:8px;background:#FFF4CC;color:#3A2A00;border:1px solid #E8C55A;font:15px/1.45 system-ui,sans-serif}" +
        "#izm-plashka summary{cursor:pointer;font-weight:700}#izm-plashka ul{margin:6px 0 0;padding-left:20px}" +
        "#izm-plashka .izm-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 0}" +
        "#izm-plashka .izm-chips button{border:1px solid #C9A227;background:#fff;color:#3A2A00;border-radius:999px;padding:4px 10px;font:600 13px/1.2 system-ui,sans-serif;cursor:pointer}" +
        "#izm-plashka .izm-sm{margin:8px 0 0;font-size:13px;opacity:.85}" +
        ".izm-abz{background:#FFF4CC;box-shadow:-6px 0 0 #E8A317;border-radius:3px}" +
        ".izm-shag{margin:0 0 12px;padding:8px 12px;border-radius:6px;background:#FFF4CC;color:#3A2A00;font:600 14px/1.4 system-ui,sans-serif}";
      document.head.appendChild(stil);

      var KL = "izm-svernut." + fajl + "." + K.obnovlen, svernut = false;
      try { svernut = localStorage.getItem(KL) === "1"; } catch (e) {}
      var pl = document.createElement("details");
      pl.id = "izm-plashka";
      pl.open = !svernut;
      pl.addEventListener("toggle", function () { try { localStorage.setItem(KL, pl.open ? "0" : "1"); } catch (e) {} });
      var sm = document.createElement("summary");
      sm.textContent = T.zag + " (" + T.sdali + " " + data(sdano) + ")";
      pl.appendChild(sm);
      if (nomera.length) {
        var p1 = document.createElement("div"); p1.style.marginTop = "6px"; p1.textContent = T.shagi; pl.appendChild(p1);
        var chips = document.createElement("div"); chips.className = "izm-chips";
        var bb = knopki(), msg = document.createElement("div");
        msg.className = "izm-sm";
        nomera.forEach(function (j) {
          if (!bb[j]) return;
          var c = document.createElement("button");
          c.type = "button";
          c.textContent = (j + 1) + ". " + bb[j].textContent;
          c.addEventListener("click", function () {
            var b = knopki()[j];
            if (b && b.classList.contains("now")) { stage.scrollIntoView({ behavior: "smooth" }); return; }
            if (b && b.classList.contains("can")) { b.click(); stage.scrollIntoView({ behavior: "smooth" }); msg.textContent = ""; }
            else msg.textContent = T.nedost;
          });
          chips.appendChild(c);
        });
        pl.appendChild(chips);
        pl.appendChild(msg);
      }
      if (novoe.length) {
        var p2 = document.createElement("div"); p2.style.marginTop = "8px"; p2.textContent = T.chto; pl.appendChild(p2);
        var ul = document.createElement("ul");
        novoe.slice().reverse().forEach(function (n) {
          var li = document.createElement("li");
          li.textContent = n.d.split("-").reverse().join(".") + ": " + ((kk && n.kk) || n.ru);
          ul.appendChild(li);
        });
        pl.appendChild(ul);
      }
      if (nomera.length) {
        var p3 = document.createElement("div"); p3.className = "izm-sm"; p3.textContent = T.podsk; pl.appendChild(p3);
      }
      rail.parentNode.insertBefore(pl, rail);

      function metki() {
        var bb = knopki();
        nomera.forEach(function (j) {
          if (!bb[j] || bb[j].getAttribute("data-izm")) return;
          bb[j].setAttribute("data-izm", "1");
          bb[j].style.boxShadow = "inset 0 -4px 0 #E8A317";
          bb[j].title = T.metka;
        });
      }
      function podsvetka() {
        var bb = knopki(), j = -1;
        for (var i = 0; i < bb.length; i++) if (bb[i].classList.contains("now")) j = i;
        var card = stage.querySelector(".card");
        if (j < 0 || !(String(j) in izm) || !card || card.getAttribute("data-izm")) return;
        card.setAttribute("data-izm", "1");
        var spisok = izm[String(j)], body = card.children[2];
        var karta = kk && K.kk_abzacy && K.kk_abzacy[String(j)];
        var nashli = 0;
        if (spisok !== "vse" && body && body.tagName === "DIV" && !body.className) {
          spisok.forEach(function (k) {
            var n = karta ? karta[k] : k;
            if (n == null || n < 0 || !body.children[n]) return;
            body.children[n].classList.add("izm-abz");
            nashli++;
          });
        }
        var zam = document.createElement("div");
        zam.className = "izm-shag";
        zam.textContent = T.shag + (spisok === "vse" ? T.vse : nashli ? T.abz : T.drugoe);
        var h2 = card.querySelector("h2");
        if (h2 && h2.nextSibling) card.insertBefore(zam, h2.nextSibling); else card.insertBefore(zam, card.firstChild);
      }
      metki(); podsvetka();
      new MutationObserver(metki).observe(rail, { childList: true });
      new MutationObserver(podsvetka).observe(stage, { childList: true });
    }
  })();

  window.__onCourseDone = function (r) {
    fetch(API + "/api/finish?forceFunctionRegion=ap-northeast-2", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course: kurs, s: pass, score: r.right, total: r.total, code: r.code })
    }).then(function (res) { return res.json(); }).then(function (out) {
      var bar = document.createElement("div");
      bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;padding:12px 18px;text-align:center;z-index:99;" +
        "font:600 14px/1.4 system-ui,sans-serif;color:#fff;background:" + (out.ok ? "#2C6640" : "#9E2B25");
      bar.textContent = out.ok
        ? "Записано на портале: " + out.name + ", результат " + out.score + "/" + out.total
        : "Результат не записан на портале — пришлите сертификат вручную.";
      document.body.appendChild(bar);
      // Полосу внизу легко не заметить — пишем итог прямо под кодом сертификата.
      var box = document.querySelector(".codebox");
      if (box) {
        var note = document.getElementById("saved-note") || document.createElement("p");
        note.id = "saved-note";
        note.style.cssText = "margin:10px 0 0;font:600 15px/1.4 system-ui,sans-serif;color:" + (out.ok ? "#2C6640" : "#9E2B25");
        note.textContent = out.ok
          ? "✓ Сохранено на портале — больше ничего нажимать не нужно"
          : "Не сохранилось на портале — отправьте сертификат в WhatsApp";
        box.parentNode.insertBefore(note, box.nextSibling);
      }
    }).catch(function () {});
  };
})();
