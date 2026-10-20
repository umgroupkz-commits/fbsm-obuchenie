// Снимок шага курса на телефоне: node snimok.js <адрес файла> <ключ> <номер шага> <куда png>
const { spawn } = require("node:child_process"); const os = require("os"), path = require("path"), fs = require("fs");
const [URL_, KEY, SHAG, OUT] = process.argv.slice(2); const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pw = path.join(process.env.LOCALAPPDATA, "ms-playwright"); const d = fs.readdirSync(pw).find((x) => /^chromium-\d+$/.test(x));
(async () => {
  const PORT = 9300 + Math.floor(Math.random() * 90);
  const proc = spawn(path.join(pw, d, "chrome-win64", "chrome.exe"), ["--headless=new", "--remote-debugging-port=" + PORT, "--user-data-dir=" + fs.mkdtempSync(path.join(os.tmpdir(), "sn-")), "about:blank"], { stdio: "ignore" });
  let ver; for (let i = 0; i < 60 && !ver; i++) { await sleep(500); try { ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); } catch (e) {} }
  const ws = new WebSocket(ver.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener("open", r));
  let id = 0; const w = new Map(); ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && w.has(m.id)) { w.get(m.id)(m); w.delete(m.id); } });
  const send = (method, params = {}, s) => new Promise((res) => { const i = ++id; w.set(i, res); ws.send(JSON.stringify({ id: i, method, params, sessionId: s })); });
  const t = await send("Target.createTarget", { url: "about:blank" }); const S = (await send("Target.attachToTarget", { targetId: t.result.targetId, flatten: true })).result.sessionId;
  await send("Page.enable", {}, S); await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }, S);
  await send("Page.navigate", { url: URL_ }, S); await sleep(1200);
  await send("Runtime.evaluate", { expression: `localStorage.setItem(${JSON.stringify(KEY)}, JSON.stringify({step:${SHAG},unlocked:${SHAG},exam:null,answers:[],done:false,cert:null,name:''}))` }, S);
  await send("Page.reload", {}, S); await sleep(1500);
  await send("Runtime.evaluate", { expression: "document.querySelector('#stage').scrollIntoView()" }, S); await sleep(300);
  const sh = await send("Page.captureScreenshot", { format: "png" }, S); fs.writeFileSync(OUT, Buffer.from(sh.result.data, "base64"));
  ws.close(); proc.kill(); console.log("снимок", OUT);
})();
