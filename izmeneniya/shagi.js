/* Достаёт из страницы курса массив шагов STEPS, редакцию VERSION и ключ состояния KEY.
 * Вызывает sobrat_izmeneniya.py: страница курса приходит на stdin, ответ - JSON в stdout.
 * Шаги выполняются в песочнице: незнакомые имена (PHONE и т.п.) превращаются в пустую строку,
 * поэтому подойдут и старые редакции страниц из истории git. */
"use strict";
const vm = require("vm");

let src = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => { src += c; });
process.stdin.on("end", () => {
  const out = { version: null, key: null, steps: null, error: null };
  const mv = src.match(/var VERSION = "([^"]*)"/);
  if (mv) out.version = mv[1];
  const mk = src.match(/var KEY = "([^"]*)"/);
  if (mk) out.key = mk[1];
  try {
    const i = src.indexOf("var STEPS = [");
    if (i < 0) throw new Error("нет var STEPS");
    const nach = src.indexOf("[", i);
    const kon = konecMassiva(src, nach);
    const tekst = src.slice(nach, kon + 1);
    const pesok = new Proxy({}, {
      has: () => true,
      get: (t, k) => (k === Symbol.unscopables ? undefined : k in globalThis ? globalThis[k] : ""),
    });
    const ctx = vm.createContext({ pesok });
    const steps = vm.runInContext("with (pesok) { (" + tekst + ") }", ctx, { timeout: 2000 });
    out.steps = steps.map((s) => ({
      rail: String(s.rail || ""),
      title: String(s.title || ""),
      html: String(s.html || ""),
      q: s.check ? String(s.check.q || "") + " | " + (s.check.opts || []).join(" | ") : "",
    }));
  } catch (e) {
    out.error = String(e && e.message || e);
  }
  process.stdout.write(JSON.stringify(out));
});

// Индекс закрывающей скобки массива с учётом строк и комментариев.
function konecMassiva(s, i) {
  let glub = 0;
  for (; i < s.length; i++) {
    const c = s[i];
    if (c === "'" || c === '"' || c === "`") {
      for (i++; i < s.length && s[i] !== c; i++) if (s[i] === "\\") i++;
    } else if (c === "/" && s[i + 1] === "/") {
      while (i < s.length && s[i] !== "\n") i++;
    } else if (c === "/" && s[i + 1] === "*") {
      i = s.indexOf("*/", i + 2) + 1;
    } else if (c === "[" || c === "{" || c === "(") glub++;
    else if (c === "]" || c === "}" || c === ")") { glub--; if (glub === 0) return i; }
  }
  throw new Error("массив STEPS не закрыт");
}
