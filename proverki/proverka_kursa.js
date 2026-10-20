// Проверка курса-страницы: node proverka_kursa.js <адрес папки kurs/> <файл.html> <ключ сохранения>
// 1) шаг 1 открывается только верным ответом; 2) все шаги рисуются по ширине телефона;
// 3) экзамен берёт вопросы из всех тем; 4) на один меньше зачёта - незачёт, верные ответы
// на ошибках не показаны; 5) всё верно - зачёт, сертификат с кодом; 6) ошибок JS нет.
// Браузер - Chromium от Playwright (как у остальных проверок), путь ищется сам.
const { spawn } = require("node:child_process");
const os = require("node:os"), path = require("node:path"), fs = require("node:fs");
const [BASE, FAIL, KEY] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function chrome() {
  const pw = path.join(process.env.LOCALAPPDATA || "", "ms-playwright");
  for (const d of fs.existsSync(pw) ? fs.readdirSync(pw) : []) {
    const p = path.join(pw, d, "chrome-win64", "chrome.exe");
    if (/^chromium-\d+$/.test(d) && fs.existsSync(p)) return p;
  }
  return "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
}
(async () => {
  const PORT = 9400 + Math.floor(Math.random() * 90);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "kurs-"));
  const proc = spawn(chrome(), ["--headless=new", "--remote-debugging-port=" + PORT, "--user-data-dir=" + profile,
    "--no-first-run", "--disable-gpu", "--no-sandbox", "about:blank"], { stdio: "ignore" });
  let ver = null;
  for (let i = 0; i < 60 && !ver; i++) { await sleep(500); try { ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); } catch (e) {} }
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0; const waiting = new Map(); const oshibki = [];
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data);
    if (m.method === "Runtime.exceptionThrown") oshibki.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300));
    if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); } });
  const send = (method, params = {}, sessionId) => new Promise((res) => { const i = ++id; waiting.set(i, res); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
  const t = await send("Target.createTarget", { url: "about:blank" });
  const S = (await send("Target.attachToTarget", { targetId: t.result.targetId, flatten: true })).result.sessionId;
  await send("Page.enable", {}, S); await send("Runtime.enable", {}, S);
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }, S);
  const ev = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }, S);
    if (r.result.exceptionDetails) return { oshibka: JSON.stringify(r.result.exceptionDetails).slice(0, 300) };
    return r.result.result.value;
  };
  const otkryt = async (ms = 1300) => { await send("Page.navigate", { url: BASE + FAIL + "?v=" + Date.now() + (/.kk.html$/.test(FAIL) ? "&l=kk" : "") }, S); await sleep(ms); };
  const sost = (o) => `localStorage.setItem(${JSON.stringify(KEY)}, JSON.stringify(${JSON.stringify(Object.assign({ exam: null, answers: [], done: false, cert: null, name: "" }, o))})); 1`;
  let bad = 0; const ok = (u, chto, d) => { if (!u) bad++; console.log((u ? "✓ " : "✗ ") + chto, d !== undefined ? JSON.stringify(d).slice(0, 260) : ""); };

  await otkryt(); await ev(`localStorage.clear(); 1`); await otkryt();
  const s1 = await ev(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const opts = [...document.querySelectorAll('#stage .check button.opt')];
    let neverno = null, verno = null;
    for (const b of opts) { b.click(); await sleep(120);
      const u = JSON.parse(localStorage.getItem(${JSON.stringify(KEY)}) || '{}').unlocked || 0;
      if (document.querySelector('#stage .verdict.ok')) { verno = u; break; } else neverno = u; }
    return { neverno, verno, shagov: document.querySelectorAll('#rail button').length - 1 };
  })()`);
  ok(s1.verno === 1 && (s1.neverno === null || s1.neverno === 0), "шаг 1 открывается только верным ответом", s1);
  const N = s1.shagov;
  const shagi = [];
  for (let i = 0; i < N; i++) {
    await ev(sost({ step: i, unlocked: i })); await otkryt(1000);
    shagi.push(await ev(`({ h: (document.querySelector('#stage h2')||{}).textContent, w: document.documentElement.scrollWidth })`));
  }
  ok(shagi.every((s) => s.h && s.w <= 390), `все ${N} шагов рисуются по ширине телефона`, shagi.map((s, i) => Object.assign({ i }, s)).filter((s) => !s.h || s.w > 390));

  await ev(sost({ step: 999, unlocked: 999 })); await otkryt(1500);
  const ex = await ev(`(() => { const st = JSON.parse(localStorage.getItem(${JSON.stringify(KEY)})); const t = document.body.innerText.match(/(\\d+)\\s*(?:из|\\/)\\s*(\\d+)/);
    return { n: st.exam.length, temy: new Set(st.exam.map(q => q.s)).size, pass: t ? +t[1] : null }; })()`);
  ok(ex.n >= 10 && ex.temy === Math.min(N, ex.n), `экзамен: ${ex.n} вопросов из ${ex.temy} тем`, ex);

  const progon = (oshibok) => ev(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const st = JSON.parse(localStorage.getItem(${JSON.stringify(KEY)}));
    for (let qi = 0; qi < st.exam.length; qi++) { const q = st.exam[qi]; const p = q.o.findIndex(o => o.right);
      document.querySelectorAll('.qbox')[qi].querySelectorAll('button.opt')[qi < ${"$"}{oshibok} ? (p + 1) % q.o.length : p].click(); await sleep(15); }
    [...document.querySelectorAll('#stage button')].find(b => /Проверить ответы|Жауаптарды тексеру/.test(b.textContent)).click();
    await sleep(500);
    const inp = document.querySelector('#stage input[type=text]');
    if (inp) { inp.value = 'Проверка Стенда'; inp.dispatchEvent(new Event('input', { bubbles: true })); await sleep(900); }
    return { ball: (document.querySelector('.score')||{}).innerText, zel: document.querySelectorAll('.qbox button.opt.right').length,
      kras: document.querySelectorAll('.qbox button.opt.wrong').length, cert: !!document.querySelector('canvas.certimg'),
      kod: (document.querySelector('.codebox')||{}).textContent };
  })()`.replace("${oshibok}", String(oshibok)));
  const nezachet = ex.n - ex.pass + 1;
  const r1 = await progon(nezachet);
  ok(/Не хватило|Жетпеді/.test(r1.ball) && r1.zel === ex.n - nezachet && r1.kras === nezachet && !r1.cert,
    `${ex.n - nezachet}/${ex.n} - незачёт, верные ответы на ошибках не показаны`, r1);
  await ev(`[...document.querySelectorAll('#stage button')].find(b => /заново|қайта/i.test(b.textContent)).click(); 1`); await sleep(400);
  const r2 = await progon(0);
  ok(r2.cert && /^FBSM-/.test(r2.kod || ""), `${ex.n}/${ex.n} - зачёт и сертификат`, r2);
  ok(oshibki.length === 0, "ошибок JS нет", oshibki);
  ws.close(); proc.kill();
  console.log(bad ? `\nЕСТЬ КРАСНЫЕ: ${bad}` : "\nитог: курс проходится, экзамен строгий");
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
