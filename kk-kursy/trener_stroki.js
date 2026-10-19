// Тексты заданий тренажёра (KURSY в obuchenie.js: t, txt[], zad) — для словаря слоя-переводчика.
// node trener_stroki.js  → ru/_trener.json (только то, чего ещё нет в kk/_trener.json)
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "..", "obuchenie.js"), "utf8");

// Блок от открывающей скобки до парной, мимо строк и комментариев.
function blok(ot) {
  let i = ot, d = 0, q = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === "\\") { i++; continue; } if (c === q) q = null; continue; }
    if (c === "'" || c === '"' || c === "`") { q = c; continue; }
    if (c === "/" && src[i + 1] === "/") { i = src.indexOf("\n", i); continue; }
    if (c === "{" || c === "[") d++;
    if (c === "}" || c === "]") { d--; if (d === 0) break; }
  }
  return Function("return " + src.slice(ot, i + 1))();
}
const KURSY = blok(src.indexOf("{", src.indexOf("const KURSY = {")));
// роли, дописанные отдельно: KURSY.aho = [ … ]
for (const m of src.matchAll(/^KURSY\.(\w+) = \[/gm)) KURSY[m[1]] = blok(m.index + m[0].length - 1);

const norm = (s) => String(s).replace(/\s+/g, " ").trim();
const vse = [];
for (const rol of Object.keys(KURSY)) for (const s of KURSY[rol]) {
  for (const x of [s.t, ...(s.txt || []), s.zad]) if (x && /[А-Яа-яЁё]/.test(x)) vse.push(norm(x));
}
const uniq = [...new Set(vse)];
const kkPut = path.join(__dirname, "kk", "_trener.json");
const gotovo = fs.existsSync(kkPut) ? JSON.parse(fs.readFileSync(kkPut, "utf8")) : {};
const net = uniq.filter((x) => !(x in gotovo));
fs.writeFileSync(path.join(__dirname, "ru", "_trener.json"), JSON.stringify(net, null, 1));
console.log("ролей", Object.keys(KURSY).length, "строк", uniq.length, "без перевода", net.length, "знаков", net.reduce((a, x) => a + x.length, 0));
