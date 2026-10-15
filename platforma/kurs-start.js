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

  var q;
  try { q = new URLSearchParams(location.search); } catch (e) { return; }
  var kurs = q.get("k") || "", pass = q.get("s") || "", imya = q.get("i") || "";
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
        setTimeout(function () { bar.remove(); }, 4000);
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
