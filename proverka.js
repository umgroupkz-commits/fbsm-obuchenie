// Проверка синхронизации обучалки с боевой программой: node proverka.js
// Запускается сама в конце sborka.py. Падает (код 1), если урок ведёт на несуществующий
// элемент или экран, или меню какой-то роли разошлось с боевой fbsmsalemanagers/index.html.
// Каждая подсветка задания ведёт на существующий элемент, каждый экран из урока
// и из меню существует, меню каждой роли совпадает с боевой программой.
const fs = require("fs"), path = require("path");
const dir = process.argv[2] || __dirname;
const h = fs.readFileSync(path.join(dir, "index.html"), "utf8");
const src = fs.readFileSync(path.join(dir, "obuchenie.js"), "utf8");
for (const m of h.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Function(m[1]);
console.log("синтаксис сборки цел");

const a = src.indexOf("const KURSY"), b = src.indexOf("// ── движок тренера");
const KURSY = new Function("ROLE_LABELS", src.slice(a, b) + "; return KURSY;")({});
const hasScreen = (fn) => src.includes("window." + fn + " =") || src.includes("window." + fn + "=") || src.includes("infoPage('" + fn + "'");
const menuFns = [...src.matchAll(/fn:'(pg[A-Za-z0-9]+)'/g)].map((m) => m[1]);
const roli = ["seller", "manager", "runner", "admin", "accountant", "streamer", "streammgr", "store", "whhead", "immgr", "aho"];
let bad = 0;
for (const r of roli) {
  const k = KURSY[r], miss = [];
  if (!k) { console.log("НЕТ КУРСА", r); bad++; continue; }
  for (const s of k) {
    if (s.tyk) {
      const ok = s.tyk.split(",").some((sel) => {
        const id = sel.trim().replace(/^[#.]/, "");
        const base = id.replace(/-\d+$/, "-${i}");
        return h.includes('id="' + id + '"') || h.includes('id="' + base + '"') || h.includes(id) ||
          (/^[nms]-pg/.test(id) && menuFns.includes(id.slice(2)));
      });
      if (!ok) miss.push(s.t + " → " + s.tyk);
    }
    const pg = (s.cel || "").startsWith("page:") ? s.cel.slice(5) : null;
    if (pg && !hasScreen(pg)) miss.push("нет экрана " + pg);
    if (s.otkryt && !hasScreen(s.otkryt)) miss.push("нет экрана " + s.otkryt);
  }
  console.log(r.padEnd(11), "шагов", String(k.length).padStart(2), "заданий", String(k.filter((s) => s.cel).length).padStart(2),
    miss.length ? "ПРОБЛЕМЫ: " + miss.join("; ") : "");
  bad += miss.length;
}
for (const fn of new Set(menuFns)) if (!hasScreen(fn)) { console.log("пункт меню без экрана:", fn); bad++; }

// меню: сравнение с боевой программой по набору экранов на роль
const boy = fs.readFileSync(path.join(dir, "..", "fbsmsalemanagers", "index.html"), "utf8");
const bs = boy.indexOf("const items=isClockRole(CU.role)"), be = boy.indexOf("document.getElementById('sb-nav')", bs);
const boyMenu = boy.slice(bs, be);
const ts = src.indexOf("function menyu(){"), te = src.indexOf("\nfunction setupSidebar(){");
const trMenu = src.slice(ts, te);
const branches = (text, marks) => {
  const out = {};
  const idx = marks.map((mk) => [mk[0], text.indexOf(mk[1])]).sort((x, y) => x[1] - y[1]);
  idx.forEach(([name, at], i) => {
    const end = i + 1 < idx.length ? idx[i + 1][1] : text.length;
    out[name] = [...text.slice(at, end).matchAll(/fn:'(pg[A-Za-z0-9]+)'/g)].map((m) => m[1]);
  });
  return out;
};
const BM = branches(boyMenu, [["clock", "isClockRole"], ["aho", "'aho'"], ["streammgr", "'streammgr'"], ["streamer", "'streamer'"], ["seller", "'seller'"], ["manager", "'manager'"], ["accountant", "'accountant'"], ["admin", ":[{g:'Магазины'}"]]);
// в тренажёре общие пункты вынесены в константы — разворачиваем их
const trExp = trMenu.replace(/\bANTI\b/g, "{fn:'pgAntireiting'}").replace(/\bLIST\b/g, "{fn:'pgMoiList'}").replace(/\bGRAF\b/g, "{fn:'pgSchedule'}").replace(/\bACH\b/g, "{fn:'pgAchivki'}");
const TM = branches(trExp, [["clock", "isClockRole(CU.role)"], ["aho", "'aho'"], ["streammgr", "'streammgr'"], ["streamer", "'streamer'"], ["seller", "'seller'"], ["manager", "'manager'"], ["accountant", "'accountant'"], ["admin", ":[{g:'Магазины'}"]]);
for (const k of Object.keys(BM)) {
  const x = BM[k].join(","), y = (TM[k] || []).join(",");
  if (x !== y) { bad++; console.log("МЕНЮ " + k + " расходится:\n  боевая:   " + x + "\n  тренажёр: " + y); }
  else console.log("меню " + k.padEnd(10) + " совпадает (" + BM[k].length + " пунктов)");
}
console.log(bad ? "ЕСТЬ ПРОБЛЕМЫ: " + bad : "всё сходится");
process.exit(bad ? 1 : 0);
