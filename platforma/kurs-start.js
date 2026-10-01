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
 *       на человека, которого подтвердил портал (сервер сверяет пропуск сам).
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
