// Аватар служебного бота «FBSM Уведомления»: квадрат 320×320 в той же гамме,
// что сертификаты обучения. Запуск: node avatar_bota.js → avatar_bota.png и
// avatar_bota.b64 рядом со скриптом.
const { spawn } = require("node:child_process");
const os = require("node:os"), path = require("node:path"), fs = require("node:fs");
const CHROME = path.join(os.homedir(), "AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe");
const PORT = 9501;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const RISUNOK = `(() => {
  const cv = document.createElement('canvas');
  cv.width = 320; cv.height = 320;
  const c = cv.getContext('2d'), W = 320, cx = W / 2;
  c.fillStyle = '#0f2b4a'; c.fillRect(0, 0, W, W);
  // мягкое свечение сверху, чтобы квадрат не выглядел плоским
  const g = c.createLinearGradient(0, 0, 0, W);
  g.addColorStop(0, 'rgba(127,180,232,.20)'); g.addColorStop(1, 'rgba(127,180,232,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, W);
  c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 6; c.strokeRect(14, 14, W - 28, W - 28);
  c.textAlign = 'center';
  c.fillStyle = '#ffffff'; c.font = '700 92px system-ui,sans-serif';
  c.fillText('FBSM', cx, 158);
  c.strokeStyle = '#2f5f92'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(cx - 84, 182); c.lineTo(cx + 84, 182); c.stroke();
  c.fillStyle = '#7fb4e8'; c.font = '600 34px system-ui,sans-serif';
  c.fillText('уведомления', cx, 228);
  c.fillStyle = '#6f8dae'; c.font = '400 22px system-ui,sans-serif';
  c.fillText('служебный бот', cx, 266);
  return cv.toDataURL('image/png');
})()`;

(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "k17-av-"));
  const proc = spawn(CHROME, ["--headless=new", "--remote-debugging-port=" + PORT, "--user-data-dir=" + profile,
    "--no-first-run", "--disable-gpu", "--no-sandbox", "about:blank"], { stdio: "ignore" });
  let ver = null;
  for (let i = 0; i < 60 && !ver; i++) { await sleep(500); try { ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); } catch (e) {} }
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0; const waiting = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); } });
  const send = (method, params = {}, sessionId) => new Promise((res) => { const i = ++id; waiting.set(i, res); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
  const t = await send("Target.createTarget", { url: "about:blank" });
  const S = (await send("Target.attachToTarget", { targetId: t.result.targetId, flatten: true })).result.sessionId;
  const r = await send("Runtime.evaluate", { expression: RISUNOK, returnByValue: true }, S);
  const dataUrl = r.result.result.value;
  const b64 = dataUrl.split(",")[1];
  fs.writeFileSync(path.join(__dirname, "avatar_bota.png"), Buffer.from(b64, "base64"));
  fs.writeFileSync(path.join(__dirname, "avatar_bota.b64"), b64);
  console.log("нарисован аватар:", Math.round(b64.length / 1024) + " КБ base64");
  ws.close(); proc.kill();
})().catch((e) => { console.error(e); process.exit(2); });
