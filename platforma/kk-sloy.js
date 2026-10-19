/* Слой-переводчик страниц раздела «Обучение» (и тренажёра) на казахский — тот же приём, что в
 * программе FBSM (index.html, «ЯЗЫК: русский / қазақша»): страница пишется по-русски, а при
 * выбранном казахском текст на экране подменяется по словарю цельных фраз и шаблонов с местами
 * {0} под числа и имена. Словари: свой kk-obuchenie.json (главнее) + kk.json программы —
 * чтобы названия кнопок совпадали с настоящей программой.
 * Язык — localStorage 'fbsm.yazyk' (общий с программой: один источник github.io). Русский —
 * слой ничего не делает. Не трогает поля ввода, скрипты и всё с data-no-tr.
 * Строки, которых нет в словаре, копятся в window.__KK_NET — по ним пополняем словарь. */
(function () {
  "use strict";
  var yaz = "ru", q = null;
  try { q = new URLSearchParams(location.search); } catch (e) {}
  var izAdresa = q && q.get("l");
  if (izAdresa === "kk" || izAdresa === "ru") { try { localStorage.setItem("fbsm.yazyk", izAdresa); } catch (e) {} }
  try { yaz = localStorage.getItem("fbsm.yazyk") === "kk" ? "kk" : "ru"; } catch (e) {}

  // Переключатель «Қаз / Рус» — в пустых местах .yaz-perekl (их ставит разметка программы).
  function perekl() {
    document.querySelectorAll(".yaz-perekl").forEach(function (el) {
      if (el.children.length) return;
      el.setAttribute("data-no-tr", "");
      var svet = el.dataset.svet === "1";
      [["kk", "Қаз"], ["ru", "Рус"]].forEach(function (v) {
        var b = document.createElement("button");
        b.type = "button"; b.textContent = v[1];
        var akt = v[0] === yaz;
        b.style.cssText = "border:1px solid " + (svet ? "rgba(255,255,255,.5)" : "#22307E") + ";padding:4px 10px;margin:0 2px;" +
          "border-radius:999px;cursor:pointer;font:600 12px/1 system-ui,sans-serif;" +
          (akt ? (svet ? "background:#fff;color:#22307E" : "background:#22307E;color:#fff") : "background:transparent;color:" + (svet ? "#fff" : "#22307E"));
        b.addEventListener("click", function () {
          if (akt) return;
          try { localStorage.setItem("fbsm.yazyk", v[0]); } catch (e) {}
          var dalshe = function () {
            var qs = new URLSearchParams(location.search); if (qs.has("l")) qs.set("l", v[0]);
            location.search = qs.toString() || "";
            if (!qs.toString()) location.reload();
          };
          var pass = q && q.get("s");
          if (pass && /^[0-9a-f-]{36}$/i.test(pass)) {
            fetch("https://qeehxcnnuzuwskznhdyg.supabase.co/functions/v1/obuchenie/api/yazyk?forceFunctionRegion=ap-northeast-2", {
              method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ s: pass, yazyk: v[0] })
            }).then(dalshe, dalshe);
          } else dalshe();
        });
        el.appendChild(b);
      });
    });
  }
  if (document.body) perekl(); else document.addEventListener("DOMContentLoaded", perekl);
  new MutationObserver(function () { if (document.querySelector(".yaz-perekl:empty")) perekl(); })
    .observe(document.documentElement, { childList: true, subtree: true });

  if (yaz !== "kk") return;
  var SAIT = "https://umgroupkz-commits.github.io/";
  var SLOVARI = [SAIT + "fbsm-obuchenie/platforma/kk-obuchenie.json", SAIT + "fbsmsalemanagers/kk.json"];
  var KIR = /[А-Яа-яЁё]/;
  var plain = new Map(), shablony = [], net = new Set();
  window.__KK_NET = net;
  var norm = function (s) { return String(s).replace(/\s+/g, " ").trim(); };
  var SLOVA = [["января","қаңтар"],["февраля","ақпан"],["марта","наурыз"],["апреля","сәуір"],["мая","мамыр"],["июня","маусым"],
    ["июля","шілде"],["августа","тамыз"],["сентября","қыркүйек"],["октября","қазан"],["ноября","қараша"],["декабря","желтоқсан"]]
    .map(function (p) { return [new RegExp("(?<![А-Яа-яЁё])" + p[0] + "(?![А-Яа-яЁё])", "g"), p[1]]; });

  function shablon(ru, kk) {
    var kuski = ru.split(/\{(\d+)\}/), nomera = [], re = "^";
    for (var i = 0; i < kuski.length; i++) {
      if (i % 2 === 0) re += kuski[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      else { re += "(.+?)"; nomera.push(+kuski[i]); }
    }
    var klyuch = kuski.filter(function (_, i) { return i % 2 === 0; }).sort(function (a, b) { return b.length - a.length; })[0] || "";
    return { re: new RegExp(re + "$"), kk: kk, nomera: nomera, klyuch: klyuch };
  }
  function stroka(s) {
    var k = norm(s);
    if (!k || !KIR.test(k)) return null;
    var t = plain.get(k);
    // дата целиком: «15 октября 2026» → «2026 жылғы 15 қазан»
    var md = t == null && /^(\d{1,2}) ([а-я]+) (\d{4})$/.exec(k);
    if (md) SLOVA.forEach(function (p) { if (p[0].test(md[2])) { p[0].lastIndex = 0; t = md[3] + " жылғы " + md[1] + " " + p[1]; } p[0].lastIndex = 0; });
    if (t == null) {
      for (var i = 0; i < shablony.length; i++) {
        var sh = shablony[i];
        if (k.indexOf(sh.klyuch) < 0) continue;
        var m = sh.re.exec(k);
        if (!m) continue;
        t = sh.kk.replace(/\{(\d+)\}/g, function (_, n) {
          var j = sh.nomera.indexOf(+n); if (j < 0) return "";
          var v = m[j + 1]; var pv = plain.get(norm(v)); return pv != null ? pv : v;
        });
        break;
      }
    }
    if (t == null) { if (net.size < 3000) net.add(k); t = k; }
    SLOVA.forEach(function (p) { t = t.replace(p[0], p[1]); });
    if (t === k) return null;
    return String(s).match(/^\s*/)[0] + t + String(s).match(/\s*$/)[0];
  }
  var videl = new WeakMap(), ATR = ["placeholder", "title", "aria-label"];
  function uzel(n) {
    var v = n.nodeValue;
    if (videl.get(n) === v || !KIR.test(v)) return;
    var p = n.parentElement;
    if (!p || p.closest("script,style,textarea,[contenteditable=true],[data-no-tr]")) { videl.set(n, v); return; }
    var t = stroka(v);
    if (t != null && t !== v) n.nodeValue = t;
    videl.set(n, n.nodeValue);
  }
  function atributy(el) {
    if (!el.getAttribute || el.closest("[data-no-tr]")) return;
    ATR.forEach(function (a) {
      var v = el.getAttribute(a); if (!v || !KIR.test(v)) return;
      var t = stroka(v); if (t != null && t !== v) el.setAttribute(a, t);
    });
  }
  function obrabotat(root) {
    if (!root) return;
    if (root.nodeType === 3) { uzel(root); return; }
    if (root.nodeType !== 1) return;
    atributy(root);
    root.querySelectorAll("[placeholder],[title],[aria-label]").forEach(atributy);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) uzel(n);
  }
  function vklyuchit() {
    document.documentElement.lang = "kk";
    if (document.title) { var tt = stroka(document.title); if (tt) document.title = tt; }
    obrabotat(document.body);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === "characterData") uzel(m.target);
        else if (m.type === "attributes") atributy(m.target);
        else m.addedNodes.forEach(obrabotat);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATR });
    var a0 = window.alert.bind(window), c0 = window.confirm.bind(window);
    window.alert = function (m) { return a0(stroka(m) || m); };
    window.confirm = function (m) { return c0(stroka(m) || m); };
  }
  // Пока словари грузятся, страница спрятана: иначе мелькает русский текст.
  var skryt = document.createElement("style");
  skryt.textContent = "body{visibility:hidden}";
  (document.head || document.documentElement).appendChild(skryt);
  var pokazat = function () { skryt.remove(); };
  setTimeout(pokazat, 2500);
  Promise.all(SLOVARI.map(function (u) {
    return fetch(u + "?v=" + Math.floor(Date.now() / 600000)).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
  })).then(function (ds) {
    // свой словарь главнее: он первый, кладём его последним
    ds.slice().reverse().forEach(function (d) {
      Object.keys(d.plain || {}).forEach(function (k) { plain.set(norm(k), d.plain[k]); });
    });
    ds.forEach(function (d) { (d.shablony || []).forEach(function (p) { shablony.push(shablon(p[0], p[1])); }); });
    shablony = shablony.filter(function (x) { return x.klyuch.trim().length >= 2; })
      .sort(function (a, b) { return b.klyuch.length - a.klyuch.length; });
    var start = function () { vklyuchit(); pokazat(); };
    if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
  });
})();
