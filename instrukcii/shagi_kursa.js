// Шаги курса из его страницы: node shagi_kursa.js <файл.html> → JSON [{title, html}].
// Шаги живут в странице массивом STEPS; у старых курсов это код со склейкой строк, поэтому он исполняется, а не разбирается.
const fs = require("fs"), vm = require("vm");
const t = fs.readFileSync(process.argv[2], "utf8");
const nachalo = t.indexOf("var STEPS = [");
if (nachalo < 0) { console.error("нет STEPS"); process.exit(1); }
let i = t.indexOf("[", nachalo), d = 0, q = null;
for (; i < t.length; i++) {
  const c = t[i];
  if (q) { if (c === "\\") { i++; continue; } if (c === q) q = null; continue; }
  if (c === '"' || c === "'" || c === "`") { q = c; continue; }
  if (c === "/" && t[i + 1] === "/") { i = t.indexOf("\n", i); continue; }
  if (c === "[" || c === "{") d++;
  if (c === "]" || c === "}") { d--; if (d === 0) break; }
}
const kod = t.slice(t.indexOf("[", nachalo), i + 1);
const shagi = vm.runInNewContext("(" + kod + ")");
process.stdout.write(JSON.stringify(shagi.map((s) => ({ title: s.title || s.rail || "", html: s.html || s.body || s.text || "" }))));
