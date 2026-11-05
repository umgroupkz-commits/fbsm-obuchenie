// ══════════════════════════════════════════════════════════════
//  FBSM · ОБУЧЕНИЕ
//
//  Это не слайды рядом с картинками, а сама программа: та же оболочка,
//  то же оформление, те же экраны. Отличий два — данные выдуманные,
//  и поверх лежит тренер: сверху объясняет, снизу даёт задание и ждёт,
//  пока вы его выполните в настоящем интерфейсе.
//
//  Ни один клик не уходит на сервер. Двадцать человек, тренирующихся
//  в боевой базе, оставили бы там записи в зарплате и графике.
// ══════════════════════════════════════════════════════════════
const VERSIYA_BOEVOY = '@@VERSIYA_BOEVOY@@';
const TEL_RUK = '77771865433';

// ── кто может учиться ──
const ROLI = [
  {id:'seller',    nm:'Продавец'},
  {id:'manager',   nm:'Управляющий'},
  {id:'streamer',  nm:'Стример'},
  {id:'streammgr', nm:'Менеджер по эфирам'},
  {id:'immgr',     nm:'Менеджер интернет-магазина'},
  {id:'store',     nm:'Кладовщик'},
  {id:'whhead',    nm:'Заведующий складом'},
  {id:'runner',    nm:'Раннер'},
  {id:'aho',       nm:'Руководитель АХО'},
  {id:'accountant',nm:'Бухгалтер'},
  {id:'hr',        nm:'HR-менеджер'},
  {id:'smm',       nm:'SMM-менеджер'},
  {id:'admin',     nm:'Главный администратор'},
];
const ROLE_LABELS = {};
ROLI.forEach(r => ROLE_LABELS[r.id] = r.nm);
const CLOCK_ROLES = ['runner','whhead','store','immgr'];
const isClockRole = r => CLOCK_ROLES.indexOf(r) >= 0;
// Кто сдаёт «Отчёт за день» вместе с отметкой «Пришёл / Ушёл»: менеджер интернет-магазина, менеджер по эфирам и с 01.11.2026 -
// заведующий складом и кладовщик (в боевой это isOfisRole и OFIS_OTMETKA на сервере). «Ушёл» без сданного отчёта не нажимается.
const OTCHET_ROLI = ['immgr','whhead','store','streammgr'];
const sdaetOtchet = r => OTCHET_ROLI.indexOf(r) >= 0;

// ── выдуманные данные ──
const MAG = 'Алматы';
const USERS = [
  {id:'u1', name:'Уркинбаева Аиша',   role:'seller',   shop:'Алматы'},
  {id:'u2', name:'Абдуолимов Абдуллах',role:'seller',  shop:'Алматы'},
  {id:'u3', name:'Жумагул Молдыр',    role:'seller',   shop:'Алматы'},
  {id:'u4', name:'Кузьмин Никита',    role:'streamer', shop:'Алматы'},
  {id:'u5', name:'Кусепова Мадина',   role:'streammgr',shop:'Алматы'},
  {id:'u6', name:'Порываев Руслан',   role:'manager',  shop:'Алматы'},
];
const PRODAZHI = [
  {d:'13', s:388900, c:25, u:52, st:'zamok'},
  {d:'12', s:412500, c:28, u:61, st:'ждёт'},
  {d:'11', s:508200, c:33, u:79, st:'ок'},
  {d:'10', s:297100, c:21, u:44, st:'ок'},
  {d:'09', s:361800, c:26, u:58, st:'ок'},
];
const MOY = {prodano:3240000, plan:4350000, smen:11, srchek:11240, upt:2.41};

const fmt = n => (Math.round(n)||0).toLocaleString('ru-RU').replace(/ /g,' ') + ' ₸';
const fmtN = n => (Math.round(n)||0).toLocaleString('ru-RU').replace(/ /g,' ');
const esc = s => String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

let CU = null, _page = '';

// ══ ОБОЛОЧКА (повторяет боевую) ══════════════════════════════
function showScreen(n){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+n).classList.add('active');
}
function setContent(h){ document.getElementById('content').innerHTML = h; }
function setTitle(t){ document.getElementById('main-title').textContent = t; }
function setBadge(h){ document.getElementById('main-badge').innerHTML = h||''; }
window.mobSheet = on => {
  const el=document.getElementById('mob-sheet'); if(el) el.classList.toggle('on',!!on);
};
function nav(fn){
  _page = fn;
  document.querySelectorAll('.ni,.mni').forEach(n=>n.classList.remove('active'));
  ['n-','s-','m-'].forEach(p=>{ const el=document.getElementById(p+fn); if(el) el.classList.add('active'); });
  if(!document.getElementById('m-'+fn)){
    const more=document.getElementById('m-more'); if(more) more.classList.add('active');
  }
  mobSheet(false);
  setTimeout(()=>tr.sobytie('page:'+fn), 0);
}

const MOB_SHORT = {'Ввод продаж':'Продажи','Отчёт магазина':'Отчёт','Начисление ЗП':'Зарплата',
  'История продавцов':'Продавцы','История отчётов':'Отчёты','Что нового':'Новое','Вычеты из ЗП':'Вычеты','Конструктор ЗП':'Конструктор','Вакансии HR':'Вакансии',
  'Мой дашборд':'Дашборд','Отметка смены':'Смена','Сотрудники':'Люди',
  'Проверка точки':'Проверка','Заявки на хоз. нужды':'Заявки','Хоз. заявка':'Заявка','Отчёты офиса':'Офис','Отчёт за день':'Мой отчёт'};

function setupMobile(items){
  const flat = items.filter(i=>!i.g);
  const inBar = flat.length>6 ? flat.slice(0,5) : flat;
  let bar = inBar.map(i=>`<button class="mni" id="m-${i.fn}" onclick="${i.fn}()">`
    +`<span class="i">${i.ic}</span><span class="l">${MOB_SHORT[i.l]||i.l}</span></button>`).join('');
  if(flat.length>inBar.length)
    bar += `<button class="mni" id="m-more" onclick="mobSheet(true)">`
         + `<span class="i">☰</span><span class="l">Ещё</span></button>`;
  document.getElementById('mob-nav').innerHTML = bar;
  document.getElementById('ms-nav').innerHTML = items.map(i =>
    i.g ? `<div class="nav-g">${i.g}</div>`
        : `<button class="ni" id="s-${i.fn}" onclick="mobSheet(false);${i.fn}()">`
          +`<span style="width:22px">${i.ic}</span>${i.l}</button>`).join('');
  document.getElementById('ms-name').textContent = CU.name;
  document.getElementById('ms-shop').textContent = CU.shop||'Администратор';
  document.getElementById('ms-ver').textContent = 'обучение · программа '+VERSIYA_BOEVOY;
}

// Меню в точности как в боевой: человек должен привыкнуть к своему набору.
function menyu(){
  const ANTI = {ic:'🌦️',l:'Антирейтинг',fn:'pgAntireiting'};
  const ACH = {ic:'🏅',l:'Достижения',fn:'pgAchivki'};
  const LIST = {ic:'💵',l:'Мой расчётный лист',fn:'pgMoiList'};
  const GRAF = {ic:'📅',l:'График',fn:'pgSchedule'};
  // Как в боевой 2026-09-28 · 4: менеджер по эфирам отмечается кнопкой, но меню своё.
  const SVOE_MENYU = new Set(['stream'+'mgr']);
  const items = isClockRole(CU.role) && !SVOE_MENYU.has(CU.role)
  ?[{g:'Моя работа'},
    {ic:'🕒',l:'Смена',fn:'pgRunner'}, ...(sdaetOtchet(CU.role)?[{ic:'📝',l:'Отчёт за день',fn:'pgOtchet'}]:[]),
    {ic:'📋',l:'История',fn:'pgRunnerHist'},
    {ic:'💰',l:'Моя ЗП',fn:'pgRunnerZP'}, LIST, ANTI, ACH,
    {g:'Магазин'}, GRAF, ...(CU.role==='store'||CU.role==='whhead'?[{ic:'🔎',l:'Проверка точки',fn:'pgProverka'}]:[])]
  :CU.role==='streammgr'
  ?[{g:'Моя работа'},{ic:'🕒',l:'Смена',fn:'pgRunner'},{ic:'📝',l:'Отчёт за день',fn:'pgOtchet'},{ic:'📋',l:'История',fn:'pgRunnerHist'},
    {ic:'💰',l:'Моя ЗП',fn:'pgEfirZP'}, LIST, ANTI, ACH,
    {g:'Магазин'}, GRAF, {ic:'🏪',l:'Отчёт магазина',fn:'pgShopReport'}]
  :CU.role==='streamer'
  ?[{g:'Моя работа'},
    {ic:'➕',l:'Ввод продаж',fn:'pgEnter'},{ic:'📋',l:'История',fn:'pgHist'},
    {ic:'💰',l:'Моя ЗП',fn:'pgStreamZP'}, LIST, ANTI, ACH,
    {g:'Магазин'},{ic:'🧾',l:'Сверка кассы',fn:'pgSverka'}, GRAF]
  :CU.role==='seller'
  ?[{g:'Моя работа'},
    {ic:'📊',l:'Дашборд',fn:'pgDash'},{ic:'➕',l:'Ввод продаж',fn:'pgEnter'},
    {ic:'📋',l:'История',fn:'pgHist'}, LIST, ANTI, ACH,
    {g:'Магазин'}, GRAF,{ic:'🏆',l:'Рейтинг',fn:'pgRating'},
    {ic:'🏪',l:'Отчёт магазина',fn:'pgShopReport'}]
  :CU.role==='manager'
  ?[{g:'Магазин'},
    {ic:'📊',l:'Сводка',fn:'pgReport'},{ic:'📈',l:'Дашборд',fn:'pgDash2'},
    {ic:'👣',l:'Посещения',fn:'pgVisits'}, GRAF,
    {ic:'🏆',l:'Рейтинг',fn:'pgRating'},{ic:'🏪',l:'Отчёт магазина',fn:'pgShopReport'},
    {ic:'📚',l:'История отчётов',fn:'pgReportHist'},{ic:'✅',l:'Подтверждения',fn:'pgPodtverzhdeniya'},
    {ic:'🗣️',l:'Жалобы',fn:'pgZhaloby'},
    {g:'Люди'},{ic:'📖',l:'История продавцов',fn:'pgSellerHist'}, ANTI, ACH,
    {g:'Деньги'},{ic:'💹',l:'Моя ЗП',fn:'pgMgrDash'}, LIST,
    {ic:'💰',l:'Начисление ЗП',fn:'pgPayroll'}, {ic:'📦',l:'Выдачи ИМ',fn:'pgImVydachi'}, {ic:'🧾',l:'Вычеты из ЗП',fn:'pgVychety'}]
  :CU.role==='accountant'
  ?[{g:'Моя работа'},{ic:'📝',l:'Отчёт за день',fn:'pgOtchet'},
    {g:'Деньги'},{ic:'💰',l:'Начисление ЗП',fn:'pgPayroll'},{ic:'📦',l:'Выдачи ИМ',fn:'pgImVydachi'},{ic:'🧾',l:'Вычеты из ЗП',fn:'pgVychety'},
    {ic:'🧮',l:'Конструктор ЗП',fn:'pgKonstruktor'},
    {ic:'💵',l:'Касса',fn:'pgKassa'},
    {g:'Магазин'}, GRAF, ANTI, ACH,
    {g:'Моё'}, LIST]
  :CU.role==='smm'
  ?[{g:'Моя работа'}, {ic:'📝',l:'Отчёт за день',fn:'pgOtchet'}, LIST, ANTI, ACH]
  :CU.role==='hr'
  ?[{g:'Моя работа'}, {ic:'📝',l:'Отчёт за день',fn:'pgOtchet'},
    {ic:'🧑‍💼',l:'Вакансии',fn:'pgVakansii'}, LIST, ANTI, ACH]
  :CU.role==='aho'
  ?[{g:'Графики'}, GRAF, {ic:'📝',l:'Отчёт за день',fn:'pgOtchet'}, {ic:'🔎',l:'Проверка точки',fn:'pgProverka'}, {ic:'🧰',l:'Заявки на хоз. нужды',fn:'pgHozZayavki'},
    {g:'Люди'}, ANTI, ACH,
    {g:'Деньги'}, LIST, {ic:'🧾',l:'Вычеты из ЗП',fn:'pgVychety'}]
  :[{g:'Магазины'},
    {ic:'📊',l:'Сводка',fn:'pgReport'},{ic:'📈',l:'Дашборд',fn:'pgDash2'},
    {ic:'👣',l:'Посещения',fn:'pgVisits'}, GRAF,
    {ic:'🏆',l:'Рейтинг',fn:'pgRating'},
    {ic:'🗣️',l:'Жалобы',fn:'pgZhaloby'},
    {g:'Люди'},{ic:'👤',l:'Сотрудники',fn:'pgSellers'},{ic:'👥',l:'Новые',fn:'pgQueue'},
    {ic:'🧑‍💼',l:'Вакансии HR',fn:'pgVakansii'},
    {ic:'📖',l:'История продавцов',fn:'pgSellerHist'},{ic:'📚',l:'История отчётов',fn:'pgReportHist'},
    {ic:'📝',l:'Отчёты офиса',fn:'pgOtchetyOfisa'},
    {ic:'🔎',l:'Проверка точки',fn:'pgProverka'}, {ic:'🧰',l:'Заявки на хоз. нужды',fn:'pgHozZayavki'},
    {ic:'🔐',l:'Входы в программу',fn:'pgLogins'},{ic:'✅',l:'Подтверждения',fn:'pgPodtverzhdeniya'}, ANTI, ACH,
    {ic:'🥋',l:'Аттестация',fn:'pgAttestaciya'},
    {g:'Деньги'},{ic:'💰',l:'Начисление ЗП',fn:'pgPayroll'},{ic:'📦',l:'Выдачи ИМ',fn:'pgImVydachi'},
    {ic:'💵',l:'Касса',fn:'pgKassa'},{ic:'🎯',l:'Планы',fn:'pgPlans'}, {ic:'🧾',l:'Вычеты из ЗП',fn:'pgVychety'},
    {ic:'⚙️',l:'Настройки',fn:'pgParams'},
    {ic:'🧮',l:'Конструктор ЗП',fn:'pgKonstruktor'},
    {g:'Программа'},{ic:'📝',l:'Что нового',fn:'pgChangelog'}];
  // «Что нового» видят все: там только изменения программы, без сумм зарплат.
  if(CU.role!=='aho'&&CU.role!=='admin'&&!items.some(i=>i.fn==='pgHozZayavka')){
    const vtoraya=items.findIndex((i,k)=>k>0&&i.g);
    items.splice(vtoraya>0?vtoraya:items.length,0,{ic:'🧰',l:'Хоз. заявка',fn:'pgHozZayavka'});
  }
  if(!items.some(i=>i.fn==='pgChangelog')) items.push({g:'Программа'},{ic:'📝',l:'Что нового',fn:'pgChangelog'});
  return items;
}

function setupSidebar(){
  document.getElementById('sb-ver').textContent = 'обучение';
  document.getElementById('sb-name').textContent = CU.name;
  document.getElementById('sb-shop').textContent = CU.shop||'Администратор';
  const items = menyu();
  document.getElementById('sb-nav').innerHTML = items.map(i =>
    i.g ? `<div class="nav-g">${i.g}</div>`
        : `<button class="ni" id="n-${i.fn}" onclick="${i.fn}()"><span style="width:20px">${i.ic}</span>${i.l}</button>`
  ).join('');
  setupMobile(items);
}

// ══ ВХОД ═════════════════════════════════════════════════════
window.doLogin = function(){
  // В режиме курса должность и пароль задаёт платформа — поля скрыты.
  const kursRol = window.__KURS_ROL && ROLE_LABELS[window.__KURS_ROL] ? window.__KURS_ROL : '';
  const rol = kursRol || document.getElementById('lname').value;
  const pass = kursRol ? '1234' : document.getElementById('lpass').value.trim();
  const err = document.getElementById('lerr');
  const imya = (document.getElementById('l-imya')||{}).value || '';
  err.style.display='none';
  if(!imya.trim()){ err.textContent='Напишите, как вас зовут — это попадёт в свидетельство'; err.style.display='block'; return; }
  if(!rol){ err.textContent='Выберите должность'; err.style.display='block'; return; }
  if(pass!=='1234'){ err.textContent='Пароль для обучения — 1234'; err.style.display='block'; return; }
  CU = {id:'me', name:imya.trim(), role:rol,
        shop: (rol==='admin'||rol==='accountant') ? null : (isClockRole(rol)?'Склад Пушкина':MAG)};
  document.getElementById('lpass').value='';
  setupSidebar(); showScreen('app');
  tr.start(rol);
};
window.doLogout = function(){
  if(!confirm('Выйти из обучения? Прогресс сохранится.')) return;
  mobSheet(false);
  document.querySelectorAll('.ov').forEach(o=>o.remove());
  CU=null; tr.stop(); showScreen('login');
};

// ══ СТРАНИЦЫ ═════════════════════════════════════════════════
const zaglushka = (t) => setContent('<div class="card"><div class="ct">'+t+'</div>'
  +'<div class="alert ai" style="display:block">Этот раздел в обучении не разбираем — '
  +'он устроен так же, как соседние, и осваивается по ходу работы.</div></div>');

window.pgDash = function(){
  nav('pgDash'); setTitle('Мой дашборд'); setBadge('');
  const pct = MOY.prodano/MOY.plan;
  setContent(`
  <div class="card"><div class="ct">Сентябрь · ${esc(CU.shop||'')}</div>
    <div class="g4">
      <div class="metric"><div class="ml">Продажи</div><div class="mv">${fmtN(MOY.prodano)}</div></div>
      <div class="metric"><div class="ml">План</div><div class="mv">${fmtN(MOY.plan)}</div></div>
      <div class="metric"><div class="ml">Выполнение</div><div class="mv" style="color:var(--amber)">${Math.round(pct*100)}%</div></div>
      <div class="metric"><div class="ml">Смен</div><div class="mv">${MOY.smen}</div></div>
    </div>
    <div class="pb" style="margin-top:1rem"><div class="pf" style="width:${Math.round(pct*100)}%"></div></div>
    <div class="rnote">До 80 % не хватает ${fmt(MOY.plan*0.8-MOY.prodano)} — это ступень «3 % от продаж».</div>
  </div>
  <div class="card"><div class="ct">Прогноз до конца месяца</div>
    <div class="zpr"><span>Продажи, если темп сохранится</span><b>${fmt(4480000)}</b></div>
    <div class="zpr"><span>Это будет</span><b style="color:var(--amber)">103 % плана</b></div>
    <div class="zpr"><span>Зарплата при таком итоге</span><b style="color:var(--blue)">${fmt(268400)}</b></div>
    <div class="rnote">Прогноз считает так: уже проданное плюс ваш средний результат
      за смену, умноженный на оставшиеся смены в графике. Это не обещание —
      он меняется каждый день.</div>
  </div>
  <div class="card"><div class="ct">KPI</div>
    <div class="zpr"><span>Средний чек</span><b>${fmtN(MOY.srchek)} <span style="color:var(--muted);font-weight:400">из 15 000</span></b></div>
    <div class="zpr"><span>UPT (штук в чеке)</span><b>${MOY.upt} <span style="color:var(--muted);font-weight:400">из 2,5</span></b></div>
    <div class="rnote">За каждый показатель, дотянутый до нормы, к зарплате прибавляется 10 000.</div>
  </div>
  <div class="card"><div class="ct">С 1 октября — 1 % с продаж без скидки</div>
    <div class="zpr"><span>Продажи без скидки (пример)</span><b>${fmt(2140000)}</b></div>
    <div class="zpr"><span>1 % с продаж без скидки</span><b style="color:var(--green)">+${fmtN(21400)}</b></div>
    <div class="rnote">Сверх всех процентов и бонусов, гарантированно и без порога: считаются строки чека без ручной
      и без автоматической скидки, за вычетом их возвратов. С октября эта строка — в «Моём дашборде», в начислении
      и в расчётном листе; в прогнозе «ЗП при 80/100/140 %» она растёт вместе с продажами.</div>
  </div>`);
  // Блок «Сервис для клиента» на главной продавца (как в боевой, модуль servis, 29.10.2026).
  if(CU.role==='seller') document.getElementById('content').insertAdjacentHTML('beforeend', zhPlitka());
};

let _podtv = false;
window.pgEnter = function(){
  nav('pgEnter'); setTitle('Ввод продаж'); setBadge(_podtv?'':'<span class="tag tw">1 день ждёт</span>');
  setContent(`
  <div class="card"><div class="ct">Новые из 1С</div>
    ${_podtv ? '<div class="alert as" style="display:block">✓ Всё подтверждено. Новых дней нет.</div>' : `
    <div class="alert ai" style="display:block">Выручка, чеки и позиции подставлены из 1С.
      Править их нельзя — если цифра неверна, дело в 1С, скажите управляющему.</div>
    <div class="g3" style="margin:1rem 0">
      <div class="metric"><div class="ml">Выручка</div><div class="mv">${fmtN(412500)}</div></div>
      <div class="metric"><div class="ml">Чеков</div><div class="mv">28</div></div>
      <div class="metric"><div class="ml">Позиций</div><div class="mv">61</div></div>
    </div>
    <div style="font-size:13px;color:var(--muted);margin-bottom:.75rem">12 сентября, пятница · ${esc(CU.shop||'')}</div>
    <button class="btn bp bbl" id="uch-podtv" onclick="uchPodtverdit()">Подтвердить продажи за 12 сентября</button>
    <div class="rnote">Пока день не подтверждён, эти деньги в зарплату не идут.
      Подтверждать надо каждый рабочий день.</div>`}
  </div>
  <div class="card"><div class="ct">13 сентября, суббота</div>
    <div class="g3" style="margin:0 0 1rem">
      <div class="metric"><div class="ml">Выручка</div><div class="mv">${fmtN(388900)}</div></div>
      <div class="metric"><div class="ml">Чеков</div><div class="mv">25</div></div>
      <div class="metric"><div class="ml">Позиций</div><div class="mv">52</div></div>
    </div>
    <button class="btn bp bbl" id="uch-zamok" style="opacity:.6" title="Не сданы отчёт магазина и закрытие кассы"
      onclick="document.getElementById('uch-zamok-pl').style.display='block'">🔒 Подтвердить пока нельзя</button>
    <div class="alert" id="uch-zamok-pl" style="background:var(--al);color:var(--amber);display:block;font-size:12.5px;margin-top:8px">Продажи за 13.09.2026 подтвердить пока нельзя: в магазине «${esc(CU.shop||'')}» за этот день не сданы отчёт магазина и закрытие кассы. Как только их сдадут — подтвердите.</div>
    <div class="rnote">Замок снимется сам, когда отчёт и касса будут сданы, — обновите страницу.</div>
  </div>
  <div class="card" style="max-width:520px;border-color:var(--amber)"><div class="ct">Так будет, если вас нет в 1С</div>
    <div class="alert" style="background:var(--al);color:var(--amber);display:block;font-size:12.5px">⚠️ Ваши продажи из 1С не приходят:
      вашей учётки нет в справочнике 1С, или она ещё не связана с программой. Скажите управляющему — как только вас заведут
      в 1С и свяжут в «Новых», цифры появятся здесь сами. Вводить продажи руками нельзя.</div>
    <div style="border-top:1px dashed var(--border);padding-top:10px;margin-top:10px">
      <button class="btn bbl" id="uch-bez-prodazh" onclick="this.textContent='✓ Смена отмечена без продаж'">🕒 Отметить смену без продаж</button>
      <div style="font-size:11px;color:var(--muted);margin-top:6px;text-align:center">Работали, но продаж не было — смена засчитается в оклад</div></div>
  </div>`);
};
window.uchPodtverdit = function(){
  _podtv = true;
  PRODAZHI.find(p=>p.d==='12').st = 'ок';
  tr.sobytie('act:podtverdil');
  pgEnter();
};

window.pgHist = function(){
  nav('pgHist'); setTitle('История продаж'); setBadge('');
  setContent(`
  <div class="card"><div class="ct">Сентябрь</div>
    <div class="tw-wrap"><table>
      <tr><th>Дата</th><th>Продажи</th><th>Чеков</th><th>Позиций</th><th>Статус</th></tr>
      ${PRODAZHI.map(p=>`<tr${p.st!=='ок'?' style="background:var(--al)"':''}>
        <td>${p.d} сентября</td><td>${fmtN(p.s)}</td><td>${p.c}</td><td>${p.u}</td>
        <td>${p.st==='zamok'
          ? '<span class="tag tw">🔒 подтвердить пока нельзя</span><div style="font-size:11px;color:var(--amber);margin-top:3px">не сданы отчёт магазина и закрытие кассы</div>'
          : p.st==='ждёт'
          ? '<span class="tag tw">ждёт вашего подтверждения</span>'
          : '<span class="tag ts">✓ в расчёте</span>'}</td></tr>`).join('')}
    </table></div>
    <div class="rnote">Жёлтым — дни, которые вы ещё не подтвердили. Если такой день
      висит несколько суток, утром об этом напомнят в общий чат.</div>
  </div>`);
};

window._obRateMode = window._obRateMode || 'prod';
window.pgRating = function(){
  nav('pgRating'); setTitle('Рейтинг'); setBadge('');
  const mag = window._obRateMode === 'mag';
  // [имя, магазин, выручка, индекс, место по индексу, выполнение плана %]
  const r = mag
    ? [['Республика','',19675111,119,1,123],['Караганда','',14759819,109,2,114],
       ['Асфендиярова','',13377365,98,3,103],['Алматы','',20528491,80,5,73]]
    : [['Забабурина Александра','Республика',5989560,124,1,120],['Толегенова Бибигул','Асфендиярова',3546886,113,2,104],
       ['Абдуолимов Абдуллах','Алматы',5159152,101,4,98],[CU.name+' (вы)','Алматы',3120000,88,7,74]];
  const knopka = (v,t) => `<button class="btn bsm${window._obRateMode===v?' bp':''}" style="min-height:40px"
    onclick="window._obRateMode='${v}';pgRating()">${t}</button>`;
  setContent(`
  <div class="card">
    <div style="display:flex;gap:6px;margin-bottom:10px">${knopka('prod','Продавцы')}${knopka('mag','Магазины')}</div>
    <div class="ct">Рейтинг сети · сентябрь · по индексу месяца</div>
    <div class="alert" style="background:var(--al);color:var(--amber);display:block;font-size:12.5px;margin-bottom:8px">Это учебный пример: магазин «Алматы» и все цифры здесь выдуманы, ваше имя подставлено для наглядности. Свой настоящий рейтинг и свой магазин вы увидите в рабочей программе.</div>
    <div class="tw-wrap"><table>
      <tr><th>#</th><th>${mag?'Магазин':'Продавец'}</th><th>Индекс</th>${mag?'':'<th>Магазин</th>'}<th>Выручка</th><th>Выполнение</th></tr>
      ${r.map((x,i)=>`<tr${x[0].includes('(вы)')?' style="background:var(--al)"':''}>
        <td>${i+1}</td><td>${esc(x[0])}</td>
        <td><b>${x[3]}</b> <span style="color:var(--muted);font-size:12px">${x[4]} место</span></td>
        ${mag?'':'<td>'+esc(x[1])+'</td>'}<td>${fmt(x[2])}</td>
        <td style="font-weight:700;color:${x[5]>=100?'var(--green)':'var(--amber)'}">${x[5]}%</td></tr>`).join('')}
    </table></div>
    <div class="rnote">Рейтинг общий по всей сети и открыт всем. «Индекс» — тот же сводный
      индекс, по которому выбирают «${mag?'Магазин':'Продавца'} месяца» в «Достижениях». Он в баллах: 100 — средний,
      выше — лучше. Поровну весят план${mag?'':' (в темпе за смену)'}, средний чек и UPT, на втором месте — дисциплина по антирейтингу,
      поэтому у большого магазина нет преимущества. Наведите на цифру в программе — увидите, из чего она сложена.</div>
  </div>`);
};

// ── график с настоящей кистью ──
const G_DNEY = 14;
let _grafik = {}, _kist = null;
let _gost = false, _podpis = false;   // гость в графике и подпись графика — у руководителя АХО
window.pgSchedule = function(){
  nav('pgSchedule'); setTitle('График смен'); setBadge('');
  const mozhet = CU.role==='admin' || CU.role==='manager' || CU.role==='aho';
  const vseTochki = CU.role==='admin' || CU.role==='aho';   // АХО и админ видят все точки
  const lyudi = USERS.filter(u=>['seller','streamer','streammgr'].indexOf(u.role)>=0)
    .concat(CU.role==='aho' ? [{id:'aho1', name:CU.name+' (вы)', role:'aho'}] : [])
    .concat(_gost ? [{id:'gost', name:'Абдуолимов Абдуллах (гость с Манаса)', role:'seller'}] : [])
    .concat(mozhet ? [{id:'run1', name:'Раннер Ерлан', role:'runner'}] : []);
  let h = '<div class="card"><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">'
    + '<select class="fc" style="width:auto"><option>сентябрь 2026 г.</option></select>'
    + (vseTochki
      ? '<select class="fc" style="width:auto" id="uch-tochka" onchange="uchTochka()">'
        + ['Все точки','Республика','Манаса','Асфендиярова','Склад Пушкина'].map(x=>'<option>'+x+'</option>').join('')
        + '</select>'
      : '<b style="font-size:15px">'+esc(MAG)+'</b>')
    + (CU.role==='aho'
      ? '<button class="btn bsm" id="uch-gost" onclick="uchGost()">👤 Поставить гостя</button>'
        + '<button class="btn bsm'+(_podpis?'':' bp')+'" id="uch-podpis" onclick="uchPodpis()">'
        + (_podpis?'✓ График подписан':'✍️ Подписать график за месяц')+'</button>'
      : '')
    + '</div>'
    + (CU.role==='aho'
      ? '<div class="rnote" style="margin-top:.6rem">Вы ведёте графики всех магазинов и складов и подписываете их '
        + 'за месяц. Сами вы стоите в графике склада, как любой сотрудник, — но отмечаться вам не нужно: '
        + 'поставленный день и есть факт.</div>'
      : '')
    + '</div>';
  h += '<div class="card">';
  if(mozhet){
    h += '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:.75rem">'
      + '<button class="btn bsm sch-brush-btn'+(_kist?' bp':'')+'" onclick="uchKist()">'
      + (_kist?'✓ Кисть включена':'🖌 Кисть')+'</button>'
      + '<span style="font-size:12px;color:var(--muted)">'
      + (_kist?'Клик по клетке ставит смену':'Включите — и дни будут ставиться одним кликом')
      + '</span></div>';
    if(_kist){
      h += '<div class="fl">Точка</div><div class="sch-opts">'
        + '<button class="sch-opt sel"><span class="sch-dot" style="background:#A32D2D"></span>АТ — AtakentMALL</button>'
        + '</div><div class="fl">Тип смены</div><div class="sch-opts">'
        + '<button class="sch-opt sel">Полная смена</button>'
        + '<button class="sch-opt">Полсмены</button>'
        + '<button class="sch-opt">🧽 Стереть день</button></div>';
    }
  }
  h += '<div class="sch-wrap"><table class="sch"><thead><tr><th class="sch-name">Сотрудник</th>';
  for(let d=1; d<=G_DNEY; d++){
    const wd = new Date(2026,8,d).getDay();
    h += '<th class="sch-day'+((wd===0||wd===6)?' sch-we':'')+'"><span class="sch-dn">'+d+'</span>'
       + '<span class="sch-dw">'+['вс','пн','вт','ср','чт','пт','сб'][wd]+'</span></th>';
  }
  h += '<th class="sch-tot">План</th><th class="sch-tot">Факт</th></tr></thead><tbody>';
  lyudi.forEach(u=>{
    let pl=0, row='';
    for(let d=1; d<=G_DNEY; d++){
      const k=u.id+'|'+d, chasy=u.id==='run1'?RUN_CHASY[d]:null, est=!!_grafik[k]||!!chasy;
      if(est) pl++;
      row += '<td class="sch-day"><div class="sch-cell'+(est?'':' noplan')+'" '
          + (mozhet?('onclick="uchKletka(\''+u.id+'\','+d+')"'):'')
          + '><div class="sch-p" style="'+(est?'background:#A32D2D;color:#fff':'color:var(--muted)')
          + (chasy?';font-size:11px'+(chasy.t[0]==='⏳'?';box-shadow:inset 0 0 0 2px #F5B700':''):'')+'">'
          // У смены по кнопке в клетке только часы, без кода точки: точку видно по цвету.
          + (chasy?chasy.t:(est?'АТ':''))+'</div><div class="sch-f"></div></div></td>';
    }
    h += '<tr><td class="sch-name"><b>'+esc(u.name)+'</b>'
       + '<div style="font-size:11px;color:var(--muted)">'+ROLE_LABELS[u.role]+'</div></td>'
       + row + '<td class="sch-tot">'+pl+'</td><td class="sch-tot">0</td></tr>';
  });
  h += '</tbody></table></div>';
  h += '<div class="rnote">'+(mozhet
      ? 'Кисть — главный приём: включили один раз и щёлкаете по дням. Без неё клик '
        +'по клетке открывает диалог, где комментарий к дню, подмена и ручной зачёт выхода.'
        +'<br>У тех, кто отмечается кнопкой «Пришёл/Ушёл», вместо кода точки — часы смены: «8:15»; '
        +'«⏳8:15» — ждёт решения; «✎9:00» — время указал руководитель. Точку видно по цвету клетки. '
        +'Нажмите на такой день — увидите, как смена прошла по кнопке.'
      : 'График ставит управляющий. Если вас нет в графике на день, вы не сможете '
        +'подтвердить за него продажи — это защита от того, чтобы чужие продажи '
        +'записались на вас.')+'</div></div>';
  setContent(h);
};
window.uchKist = function(){ _kist = !_kist; tr.sobytie('act:kist'); pgSchedule(); };
window.uchTochka = function(){ tr.sobytie('act:tochka'); };
window.uchGost = function(){ _gost = true; tr.sobytie('act:gost'); pgSchedule(); };
window.uchPodpis = function(){ _podpis = true; tr.sobytie('act:podpis'); pgSchedule(); };
// Часы раннера по дням: t — что видно в клетке, str — блок «Смена по кнопке» в окне дня.
const RUN_CHASY = {
  10:{t:'8:15', str:['По кнопке: 09:00 – 17:15','Сейчас: 09:00 – 17:15 (8:15)']},
  11:{t:'8:40', str:['По кнопке: 08:55 – 17:35','Сейчас: 08:55 – 17:35 (8:40)']},
  12:{t:'⏳9:00', str:['По кнопке: 10:30 – 17:00','Сейчас: 09:00 – 18:00 (9:00)','Правил(а): Раннер Ерлан','Ждёт подтверждения']},
  13:{t:'✎9:00', str:['По кнопке: 09:10 – не нажат уход','Сейчас: 09:00 – 18:00 (9:00)','Правил(а): Порываев Руслан','Решил(а): Порываев Руслан']},
};
window.uchKletka = function(uid,d){
  if(uid==='run1' && !_kist){
    const ch = RUN_CHASY[d];
    if(!ch){ alert('В этот день смены по кнопке не было.'); return; }
    const ov = document.createElement('div'); ov.className = 'ov';
    ov.innerHTML = '<div class="ovc" style="max-width:420px"><div class="ct">Раннер Ерлан · ' + d + ' сентября</div>'
      + '<div style="font-size:12.5px"><div class="fl">Смена по кнопке</div>'
      + ch.str.map(x=>'<div>'+esc(x)+'</div>').join('')
      + '<button class="btn bsm" style="margin-top:.5rem" onclick="this.closest(\'.ov\').remove();tr.sobytie(\'act:ukazal\');'
      + 'alert(\'В программе откроется окно: впишите приход и уход. Так правится и уже подтверждённая смена.\')">✏️ Указать время</button></div>'
      + '<div style="margin-top:1rem;text-align:right"><button class="btn bsm" onclick="this.closest(\'.ov\').remove()">Закрыть</button></div></div>';
    document.body.appendChild(ov);
    tr.sobytie('act:chasy');
    return;
  }
  if(!_kist){
    alert('Кисть выключена. В боевой программе здесь откроется диалог дня — '
        + 'с комментарием, подменой и ручным зачётом выхода.');
    return;
  }
  _grafik[uid+'|'+d] = true;
  tr.sobytie('act:smena:'+Object.keys(_grafik).length);
  pgSchedule();
};

// ── отчёт магазина ──
let _otchet = false;
window.pgShopReport = function(){
  nav('pgShopReport'); setTitle('Отчёт магазина'); setBadge('');
  setContent(`
  <div class="card" style="max-width:760px"><div class="ct">🏪 ${esc(MAG)} · 12 сентября, пятница</div>
    <div style="margin-bottom:1rem"><div class="ct">🤝 Ответственность за магазин принята?</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn bp" style="flex:1;min-height:44px">✅ Да, принята</button>
        <button class="btn bd2" style="flex:1;min-height:44px">❌ Нет — было не в порядке</button></div>
      <div class="rnote">Ответить можно до 11:00. «Нет» — отметьте пункты, которые были не в порядке, у каждого напишите,
        что не так, и приложите фото: замечания уйдут в чат отчётов, а всем, кто работал в прошлую смену, — по 3 штрафных
        балла. Не ответите — в 11:00 программа сама поставит «Да». Если потом руководство найдёт беспорядок, о котором
        вы не сообщили, — по штрафному баллу каждому на смене за каждый такой пункт, даже если он остался со вчера.</div></div>
    ${_otchet?'<div class="alert as" style="display:block">✓ Отчёт заполнил '+esc(CU.name)
      +' · ушёл в телеграм. Можно поправить и отправить заново.</div>':''}
    <div class="rnote" style="margin-top:0">Если по графику вы в этот день на подмене в другом магазине, здесь будет строка
      «🔁 По графику вы в этот день на подмене в магазине …» — отчёт и касса тогда сдаются за тот магазин.</div>
    <div class="alert ai" style="display:block">Выручка, чеки и единицы подставлены из 1С.
      Править их здесь нельзя — если цифра неверна, дело в 1С.</div>
    <div class="g3" style="margin:1rem 0">
      <div class="metric"><div class="ml">Выручка (₸)</div><div class="mv">${fmtN(644955)}</div></div>
      <div class="metric"><div class="ml">Чеков</div><div class="mv">50</div></div>
      <div class="metric"><div class="ml">Позиций в чеках</div><div class="mv">113</div></div>
    </div>
    <div class="rnote">Позиция — это строка в чеке, а не штука: две одинаковые вещи одной строкой — одна позиция.</div>
    <div class="zpr"><span>Возвраты (из 1С)</span><b>1 чек на ${fmtN(12000)} ₸</b></div>
    <div class="rnote">Возвраты приходят из 1С сами, вносить их руками не нужно. Выручка выше — уже за их вычетом.</div>
    <div class="fr">
      <div class="fg"><label class="fl">Посетителей (счётчик)</label>
        <input type="number" inputmode="numeric" id="uch-vis" class="fc" placeholder="например 728"
          oninput="uchOtchetProverka()"></div>
      <div class="fg"><label class="fl">Сотрудников на смене</label>
        <input type="number" class="fc" value="5"></div>
    </div>
    <div class="fg"><label class="fl">Состав смены / комментарий</label>
      <textarea class="fc" rows="2" placeholder="кто работал"></textarea></div>
    ${sverkaHtml()}
    <div style="border-top:1px solid var(--bd);margin-top:1rem;padding-top:1rem">
      <div class="ct">Чек-лист смены</div>
      <div class="rnote" style="margin-top:0">🧹 Зал: пол и пыль, ничего не валяется, развеска аккуратная и без мятого,
        новый товар вывешен, каждая модель со склада в зале, размеры пополнены. 🚪 Примерочные пустые.
        📦 Склад разложен по наименованиям, брак в отдельном месте. 🔒 Кассовая зона, мусор, свет и техника.
        📋 Работа смены: Direct, WhatsApp и онлайн-заказы, сторис, приёмка товара.</div>
      <div class="rnote">Сделано — поставьте галочку. Не сделано — под пунктом напишите почему: без причины отчёт
        не отправится.</div></div>
    <div style="border-top:1px solid var(--bd);margin-top:1rem;padding-top:1rem">
      <div class="ct">Задачи смены</div><button class="btn bsm">+ задача</button></div>
    <div style="border-top:1px solid var(--bd);margin-top:1rem;padding-top:1rem">
      <div class="fg"><label class="fl">Инциденты</label>
        <textarea class="fc" rows="2" placeholder="Нештатные ситуации, поломки, конфликты. Если всё спокойно — напишите: Без инцидентов"></textarea></div></div>
    <button class="btn bp bbl" id="uch-send" onclick="uchOtchet()" disabled>Отправить отчёт</button>
    <div class="rnote">Заполняйте ближе к закрытию: программа берёт цифры на момент
      открытия страницы. Открыли в семь вечера, отправили в десять — увидите семичасовые.
      Если 1С досчитает день позже, отчёт обновится сам, заново слать не нужно.</div>
    ${CU.role==='manager'?'<div class="rnote">Отправка отчёта засчитает вам смену в графике за этот день.</div>':''}
    <div style="border-top:1px solid var(--bd);margin-top:1rem;padding-top:1rem">
      <div class="ct">🧰 Заявка на хоз. нужды <span style="font-weight:400;color:var(--muted)">— по желанию</span></div>
      <div class="rnote" style="margin-top:0">Чего не хватает или что сломалось — <b>каждую позицию с новой строки</b>.
        Заявка сразу уйдёт руководителю АХО, писать ему в личку не нужно. Что уже в работе — видно ниже, повторять не нужно.</div>
      <textarea id="uch-hoz" class="fc" rows="3" style="font-size:16px;font-family:inherit"
        placeholder="Например:&#10;пакеты М — 2 пачки&#10;лампа в примерочную"
        oninput="document.getElementById('uch-hoz-btn').disabled=!this.value.trim()"></textarea>
      <div class="rnote">📷 Можно приложить до 3 фото.</div>
      <label style="display:flex;gap:10px;align-items:center;min-height:44px;font-size:14px">
        <input type="checkbox" style="width:22px;height:22px"> ❗ Срочно</label>
      <button class="btn bp bbl" id="uch-hoz-btn" style="min-height:44px" onclick="uchHoz()" disabled>📤 Отправить заявку</button>
      ${_hozU?uchHozSpisok(_hozU, MAG):''}
    </div>
  </div>`);
};
let _hozU = '';
window.uchHoz = function(){ const t = document.getElementById('uch-hoz'); _hozU = t ? t.value.trim() : 'пакеты'; tr.sobytie('act:hoz_zayavka'); pgShopReport(); };
window.uchOtchetProverka = function(){
  const v = document.getElementById('uch-vis').value;
  document.getElementById('uch-send').disabled = !(v && +v>0);
};
window.uchOtchet = function(){ _otchet = true; tr.sobytie('act:otchet'); pgShopReport(); };

// ── сверка кассы (в отчёте магазина и отдельной страницей у стримера) ──
let _sverka = false;
const sverkaHtml = () => `
    <div style="border-top:1px solid var(--bd);margin-top:1rem;padding-top:1rem">
      <div class="ct">💵 Сверка кассы ${_sverka?'<span class="tag ts">принята</span>':'<span class="tag ti">не сверена</span>'}</div>
      ${_sverka?'<div class="alert as" style="display:block">✓ Сверка принята. Снимите Z-отчёт, приложите фото и впишите два итога — после этого смена закрыта.</div>':''}
      <div class="fr">
        <div class="fg"><label class="fl">Остаток на начало</label><input class="fc" value="20 000" disabled></div>
        <div class="fg"><label class="fl">Наличными продажи</label><input class="fc" value="185 000" disabled></div></div>
      <div class="fr">
        <div class="fg"><label class="fl">Инкассация (забрали до пересчёта)</label><input class="fc" type="number" inputmode="numeric" value="0"></div>
        <div class="fg"><label class="fl">Фактически в кассе</label>
          <input class="fc" type="number" inputmode="numeric" id="uch-fakt" placeholder="сколько насчитали" oninput="uchSverkaProverka()"></div></div>
      <div class="rnote" style="margin-top:0">Должно остаться: 205 000 ₸. Безналичные сверяются так же: терминалы против X-отчёта.</div>
      <div class="fg"><label class="fl">Если не сошлось — причина</label>
        <select class="fc"><option>—</option><option>Обмен товара по Halyk</option>
          <option>Отложенная продажа (перенос на завтра)</option><option>Другое (опишите ниже)</option></select></div>
      <button class="btn bp bbl" id="uch-sverka" onclick="uchSverka()" disabled>Сверить и отправить</button>
      <div class="rnote">Не сошлось — расхождение уйдёт бухгалтеру, и смена не закроется, пока он его не подтвердит.</div>
      <div class="rnote">Сроки: касса открывается к 10:00, а закрывается до 06:00 следующего дня — ночные смены укладываются.</div>
    </div>`;
window.uchSverkaProverka = function(){
  const v = document.getElementById('uch-fakt').value;
  document.getElementById('uch-sverka').disabled = _sverka || !(v && +v>0);
};
window.uchSverka = function(){ _sverka = true; tr.sobytie('act:sverka'); if(window[_page]) window[_page](); };
window.pgSverka = function(){
  nav('pgSverka'); setTitle('Сверка кассы'); setBadge('');
  setContent(`<div class="card" style="max-width:760px"><div class="ct">🧾 ${esc(MAG)} · 12 сентября</div>
    <div class="alert ai" style="display:block">Отчёта магазина у стримера нет, а касса в подразделении есть — сверку вы сдаёте здесь.</div>
    ${sverkaHtml()}</div>`);
};

// ── отчёт за день (офисные должности; с 02.10.2026 в программе, а не в Битриксе) ──
let _otcU = false;
window.pgOtchet = function(){
  nav('pgOtchet'); setTitle('Отчёт за день'); setBadge('');
  setContent(`
  <div class="card" style="max-width:620px">
    <div class="ct">Отчёт за 12 сентября, пятница ${_otcU?'<span class="tag ts">засчитан</span>':''}</div>
    <div class="fg"><label class="fl">Что сделано за день *</label>
      <textarea id="uch-otc" class="fc" rows="5" style="font-family:inherit;font-size:16px"
        placeholder="Конкретно: что сделано и чем закончилось. Не «работала», а «провела 3 собеседования, двоих пригласила на стажировку»"
        oninput="document.getElementById('uch-otc-btn').disabled=!this.value.trim()"></textarea></div>
    <div class="fg"><label class="fl">Планы на завтра <span style="color:var(--muted)">— по желанию</span></label>
      <textarea class="fc" rows="2" style="font-family:inherit;font-size:16px"></textarea></div>
    <div class="fg"><label class="fl">Проблемы / нужна помощь <span style="color:var(--muted)">— по желанию</span></label>
      <textarea class="fc" rows="2" style="font-family:inherit;font-size:16px"
        placeholder="Если что-то мешает работе — напишите. Это поле читают в первую очередь."></textarea></div>
    <button class="btn bp bbl" id="uch-otc-btn" style="min-height:44px" onclick="uchOtc()" ${_otcU?'':'disabled'}>${_otcU?'Сохранить изменения':'✓ Сдать отчёт'}</button>
    <div class="rnote">Отчёт сразу уходит руководству в Telegram. Без отчёта рабочий день не засчитывается в зарплату,
      а у тех, кто отмечается кнопкой, без него не завершить смену. Забыли сдать - отчёт можно сдать за любой из последних 40 дней:
      вверху список несданных дней, внизу выбор даты. Такой отчёт придёт руководителю с кнопками «Засчитать день / Не засчитывать»;
      пока его не засчитали, день не оплачивается.</div>
  </div>
  <div class="card" style="max-width:620px"><div class="fl">Сдать отчёт за другой день</div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><input type="date" class="fc" style="max-width:200px" min="2026-08-03" max="2026-09-12" value="2026-09-11">
      <button class="btn bsm" onclick="zhToast('В обучении за другой день не сдаём')">Открыть</button></div>
    <div class="rnote">За прошедший день отчёт уходит руководителю на проверку - засчитать день или нет.</div></div>`);
};
window.uchOtc = function(){ _otcU = true; tr.sobytie('act:otchet_ofisa'); pgOtchet(); };

// Список под формой заявки — как в боевой (08.10.2026): каждая строка — позиция.
function uchHozSpisok(tekst, otdel){
  const stroki = String(tekst).split(/\n/).map((x) => x.replace(/^\s*(?:[•·*\-–—]+\s*|\d{1,2}[.)]\s+)/, '').trim()).filter(Boolean);
  const str = (t, pod, tag) => '<div style="display:flex;gap:8px;align-items:flex-start;padding:7px 0;border-bottom:1px dashed var(--border);font-size:13px">'
    + '<div style="flex:1;min-width:0;overflow-wrap:anywhere"><div>' + esc(t) + '</div>' + pod + '</div>' + tag + '</div>';
  return '<div class="alert as" style="display:block;margin-top:8px">✅ Принято: ' + stroki.length + ' поз. — добавлено в список «' + esc(otdel) + '», руководитель АХО получил сообщение</div>'
    + '<div style="margin-top:12px;font-size:13px;font-weight:600">«' + esc(otdel) + '» — в работе (' + (stroki.length + 1) + ')</div>'
    + stroki.map((t) => str(t, '<div style="color:var(--muted);font-size:12px">сегодня · ждёт сегодня</div>', '<span class="tag tw">в работе</span>')).join('')
    + str('Вешалки — 20 шт.', '<div style="color:var(--muted);font-size:12px">вчера 18:40 · ждёт 1 дн.</div>'
      + '<div style="color:var(--amber);font-size:12.5px">💬 АХО: привезу в пятницу</div>', '<span class="tag tw">в работе</span>')
    + '<div style="margin-top:10px;font-size:13px;font-weight:600">Закрыто за неделю (2)</div>'
    + str('Пакеты М — 2 пачки', '', '<span class="tag ts">сделано</span>')
    + str('Новый отпариватель', '<div style="font-size:12.5px;color:var(--red)">Причина: старый отремонтировали, вернём в среду</div>', '<span class="tag td">не будет</span>');
}

// ── вкладка «Хоз. заявка» у всех сотрудников (07.10.2026) ──
let _hozT = '';
window.pgHozZayavka = function(){
  nav('pgHozZayavka'); setTitle('Хоз. заявка'); setBadge('');
  const otdel = MAG;
  setContent(`
  <div class="card" style="max-width:760px">
    <div class="ct">🧰 Заявка на хоз. нужды</div>
    <div class="rnote" style="margin-top:0">Чего не хватает или что сломалось — <b>каждую позицию с новой строки</b>.
      Заявка сразу уйдёт руководителю АХО, писать ему в личку не нужно. Заявка идёт от вашего магазина или отдела.</div>
    <textarea id="uch-hoz" class="fc" rows="3" style="font-size:16px;font-family:inherit"
      placeholder="Например:&#10;лампа в студии мигает&#10;скотч — 2 шт."
      oninput="document.getElementById('uch-hoz-btn').disabled=!this.value.trim()"></textarea>
    <div class="rnote">📷 Можно приложить до 3 фото.</div>
    <label style="display:flex;gap:10px;align-items:center;min-height:44px;font-size:14px">
      <input type="checkbox" style="width:22px;height:22px"> ❗ Срочно</label>
    <button class="btn bp bbl" id="uch-hoz-btn" style="min-height:44px" onclick="uchHozT()" disabled>📤 Отправить заявку</button>
    ${_hozT?uchHozSpisok(_hozT, otdel):''}
  </div>`);
};
window.uchHozT = function(){ const t = document.getElementById('uch-hoz'); _hozT = t ? t.value.trim() : 'скотч'; tr.sobytie('act:hoz_zayavka'); pgHozZayavka(); };

// ── заявки на хоз. нужды: по магазинам, каждая строка отдельно (08.10.2026) ──
// (руководитель АХО отмечает, администратор смотрит)
let _hozZ = {}, _hozOtkr = null;
window.pgHozZayavki = function(){
  nav('pgHozZayavki'); setTitle('Заявки на хоз. нужды'); setBadge('');
  const mozhno = CU.role === 'aho';
  const mag = [
    {shop: 'Республика', prosr: true, dney: '4 дн.', zay: [
      {kto: 'Дина Серикова', kogda: '3 октября 18:05', prosr: true, poz: [{id: 1, t: 'Пакеты М — 2 пачки'}, {id: 2, t: 'Лампа в примерочной'}]},
      {kto: 'Дина Серикова', kogda: 'вчера 19:40', poz: [{id: 3, t: 'Вешалки детские — 20 шт.'}]}]},
    {shop: MAG, srochno: true, dney: 'сегодня', zay: [
      {kto: 'Анна Иванова', kogda: 'сегодня 11:20', srochno: true, poz: [{id: 4, t: 'Сломался отпариватель — нужен на замену'}, {id: 5, t: 'Скотч широкий — 3 шт.'}]}]},
  ];
  const vRabote = (m) => m.zay.reduce((a, z) => a + z.poz.filter((p) => !_hozZ[p.id] || _hozZ[p.id].st === 'otvet').length, 0);
  const kn = (t, lbl, st, on, id) => `<button class="btn"${id ? ' id="' + id + '"' : ''} style="width:44px;min-height:44px;padding:0;justify-content:center;font-size:16px;${st}" aria-label="${lbl}" title="${lbl}" onclick="${on}">${t}</button>`;
  const stroka = (p) => {
    const r = _hozZ[p.id], zakr = r && r.st !== 'otvet', red = _hozOtkr && _hozOtkr.id === p.id;
    let h = `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:7px 0;border-top:1px solid var(--s2)">
      <div style="flex:1 1 160px;min-width:0;font-size:14px${zakr ? ';color:var(--muted);text-decoration:line-through' : ''}">${esc(p.t)}</div>`;
    if (mozhno && !zakr && !red) h += '<div style="display:flex;gap:6px;margin-left:auto">'
      + kn('✓', 'Сделано', 'color:var(--green);border-color:var(--green)', `uchHozZakryt(${p.id},'done')`, 'uch-hoz-done-' + p.id)
      + kn('✕', 'Не будет', 'color:var(--red);border-color:var(--red)', `_hozOtkr={id:${p.id},st:'rejected'};pgHozZayavki()`)
      + kn('💬', 'Ответить, позиция остаётся в работе', '', `_hozOtkr={id:${p.id},st:'otvet'};pgHozZayavki()`) + '</div>';
    if (mozhno && zakr) h += `<button class="btn bsm" style="margin-left:auto" onclick="delete _hozZ[${p.id}];pgHozZayavki()">вернуть</button>`;
    h += '</div>';
    if (r && r.st === 'done') h += '<div style="font-size:12.5px;color:var(--green);margin:-2px 0 4px">✓ сделано, сегодня</div>';
    if (r && r.st === 'rejected') h += '<div style="font-size:12.5px;color:var(--red);margin:-2px 0 4px">✕ не будет — ' + esc(r.ot) + '</div>';
    if (r && r.st === 'otvet') h += '<div style="font-size:12.5px;color:var(--amber);margin:-2px 0 4px">💬 в работе: ' + esc(r.ot) + '</div>';
    if (red) h += `<textarea id="uch-hoz-k" class="fc" rows="2" style="margin-top:4px;font-size:16px" placeholder="${_hozOtkr.st === 'rejected' ? 'Почему не будет — обязательно, магазин увидит' : 'Ответ магазину: например, «купил 2 из 3, остальное в пятницу»'}"></textarea>
      <div style="display:flex;gap:8px;margin:6px 0;flex-wrap:wrap">
        <button class="btn bp" id="uch-hoz-ok" style="flex:1 1 140px;min-height:44px;justify-content:center" onclick="uchHozZakryt(${p.id},'${_hozOtkr.st}')">${_hozOtkr.st === 'rejected' ? '✕ Не будет' : '💬 Отправить ответ'}</button>
        <button class="btn" style="flex:1 1 100px;min-height:44px;justify-content:center" onclick="_hozOtkr=null;pgHozZayavki()">Отмена</button></div>`;
    return h;
  };
  const kart = (m) => `<details class="card" open style="max-width:760px;padding:0;margin-bottom:10px${m.prosr ? ';border-left:4px solid var(--red)' : ''}">
    <summary style="cursor:pointer;padding:12px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;min-height:52px">
      <b style="font-size:16px">${esc(m.shop)}</b>${m.srochno ? '<span class="tag td">срочно</span>' : ''}${m.prosr ? '<span class="tag td">просрочено</span>' : ''}
      <span style="margin-left:auto;font-size:13px;color:var(--muted)">${vRabote(m)} поз. · ждёт ${m.dney}</span></summary>
    <div style="padding:0 12px 12px">${m.zay.map((z) => `<div style="border-top:1px dashed var(--border);padding-top:8px;margin-top:4px">
      <div style="font-size:12.5px;color:var(--muted)">${z.kogda} · ${esc(z.kto)}${z.srochno ? ' <span class="tag td">срочно</span>' : ''}${z.prosr ? ' <span class="tag td">просрочено</span>' : ''}</div>
      ${z.poz.map(stroka).join('')}</div>`).join('')}
      ${mozhno ? `<div style="border-top:1px solid var(--border);margin-top:10px;padding-top:10px"><button class="btn bbl" style="min-height:44px;color:var(--green);border-color:var(--green)"
        onclick="${m.zay.map((z) => z.poz.map((p) => `_hozZ[${p.id}]={st:'done'};`).join('')).join('')}tr.sobytie('act:hoz_zakryta');pgHozZayavki()">✓ Всё по магазину сделано</button></div>` : ''}
    </div></details>`;
  const vsego = mag.reduce((a, m) => a + vRabote(m), 0);
  setContent((mozhno ? '' : '<div class="alert ai" style="max-width:760px">Позиции отмечает руководитель АХО — здесь только просмотр.</div>')
    + `<div class="card" style="max-width:760px;padding:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:baseline"><b style="font-size:20px">${vsego}</b>
       <span>поз. в работе · магазинов: ${mag.length}</span><span class="tag td" style="margin-left:auto">просрочено: 1</span></div>`
    + mag.map(kart).join('')
    + '<div class="rnote" style="max-width:760px">Ниже в боевой программе — «Закрыто за 30 дней». По будням в 9:30 руководителю АХО '
    + 'приходит сводка по магазинам; обычная без ответа больше 3 дней или срочная больше суток помечается «просрочено».</div>');
  if (_hozOtkr) { const t = document.getElementById('uch-hoz-k'); if (t) t.focus(); }
};
window.uchHozZakryt = function(id, st){
  if (st !== 'done') {
    const t = document.getElementById('uch-hoz-k'), v = t ? t.value.trim() : '';
    if (!v) { if (t) { t.style.borderColor = 'var(--red)'; t.focus(); } return; }
    _hozZ[id] = {st, ot: v};
  } else _hozZ[id] = {st: 'done'};
  _hozOtkr = null;
  if (st !== 'otvet') tr.sobytie('act:hoz_zakryta');
  pgHozZayavki();
};

// ── проверка точки (администратор, АХО, складские) ──
let _prvU = {};
window.pgProverka = function(){
  nav('pgProverka'); setTitle('Проверка точки'); setBadge('');
  const punkty = [['p_floor','Пол и пыль: на полу нет вещей, вешалок, бирок и мусора'],
    ['p_fitting','Примерочные пустые: вещи на местах, нет вешалок и мусора'],
    ['p_stock','Склад разложен по наименованиям: группа → модель → размер'],
    ['p_brak','Брак отложен в отдельное место и передан на уценку']];
  setContent(`
  <div class="card" style="max-width:760px"><div class="ct">🔎 Проверка точки · 12 сентября, пятница</div>
    <div class="fg"><label class="fl">Магазин</label><select class="fc"><option>${esc(MAG)}</option></select></div>
    <div class="alert" style="background:var(--al);color:var(--amber);display:block">Сейчас после 11:00: за нарушения,
      о которых смена не сообщила при приёмке, — по штрафному баллу за каждый пункт каждому на сегодняшней смене. До 11:00 — прошлой
      смене. За то, о чём смена сообщила утром сама, штрафа от проверки нет.</div>
    <div class="rnote">В программе пунктов 11 — здесь для тренировки четыре. По каждому — «В порядке» или «Нарушение»;
      нарушение — что не так и фото.</div>
    ${punkty.map(([id,t])=>`<div style="padding:.6rem 0;border-bottom:1px dashed var(--bd)"><div style="font-size:13px">${t}</div>
      <div style="display:flex;gap:8px;margin-top:6px">
        <button class="btn${_prvU[id]===true?' bp':''}" style="flex:1;min-height:44px" onclick="uchPrv('${id}',true)">✅ В порядке</button>
        <button class="btn bd2" style="flex:1;min-height:44px${_prvU[id]===false?';background:var(--red);color:#fff':''}" onclick="uchPrv('${id}',false)">❌ Нарушение</button></div>
      ${_prvU[id]===false?'<textarea class="fc" rows="2" style="margin-top:6px;font-size:16px" placeholder="Что именно не так"></textarea><div class="rnote">📷 и фото нарушения</div>':''}</div>`).join('')}
    <button class="btn bp bbl" style="min-height:44px" id="uch-prv" onclick="uchPrvZapis()" ${Object.keys(_prvU).length<punkty.length?'disabled':''}>📤 Записать проверку</button>
    <div class="rnote">Одна проверка на точку в день. Результат с фото уходит в чат отчётов.</div>
  </div>`);
};
window.uchPrv = function(id, ok){ _prvU[id] = ok; pgProverka(); };
window.uchPrvZapis = function(){ tr.sobytie('act:proverka'); const b=document.getElementById('uch-prv'); if(b){ b.textContent='✓ Проверка записана'; b.disabled=true; } };

// ── антирейтинг ──
const BALL_PRAVILA_U = [
  ['Прогул: смена стоит в графике, а отметки о выходе так и нет (ждём три дня после смены; появится позже — балл снимется сам)', '10', 'магазины: продавцы, управляющие, стримеры, раннеры, менеджеры эфиров'],
  ['Отчёт магазина сдан позже 09:00 следующего утра (пока не сдан — день не идёт в зарплату, поэтому его сдают, и это уже «с опозданием»)', '1 каждому', 'все, кто был на смене в магазине, и управляющий магазина'],
  ['Магазин принят с замечаниями: утренняя смена до 11:00 ответила «Нет» в отчёте магазина и приложила фото беспорядка', '3 каждому', 'все, кто работал на точке в предыдущий рабочий день'],
  ['Руководство при проверке точки нашло беспорядок, о котором смена не сообщила при приёмке', '1 каждому за каждый пункт', 'смена этого дня (проверка до 11:00 — прошлая смена)'],
  ['Касса за смену не закрыта до 06:00 следующего дня', '1', 'кассир смены'],
  ['Касса магазина не открыта к 10:00 (или не открыта вовсе)', '1 каждому', 'все, кто был на смене в магазине (кроме стримеров)'],
  ['Смена без нажатой кнопки «Пришёл» или «Ушёл» — в том числе когда смену закрыла программа', '1', 'кто отмечается кнопкой «Пришёл / Ушёл»'],
  ['Отметку прихода или ухода исправили задним числом (больше чем на 5 минут)', '1', 'кто отмечается кнопкой «Пришёл / Ушёл»'],
  ['Опоздание: «Пришёл» нажат позже начала рабочего дня', '3', 'склад, офис, интернет-магазин — кто отмечается кнопкой'],
  ['Отчёт за день не сдан до 12:00 следующего дня (досданный «ждёт руководителя» балла не даёт)', '1', 'офисные должности: в дни со сменой или в рабочие дни по графику'],
  ['Задача в Битриксе просрочена или сдана после срока', '1', 'исполнитель задачи'],
  ['Задача висит просроченной ещё неделю', '1 за неделю', 'исполнитель задачи'],
  ['Балл от руководства — всегда с причиной', 'сколько поставят', 'все'],
];
const BALL_SKORO_U = [
  'за день в Инстаграме города не вышло ни одной сторис (аккаунты Караганды, Астаны и Алматы; замер в 23:50) — '
    + 'по баллу продавцам, стримерам и управляющим магазинов этого города, кто стоял в графике',
  'клиенту не ответили 24 часа',
  'жалоба клиента',
  'обязательный курс не пройден в срок',
];
const BALL_NET_U = [
  'выходной, отпуск, больничный: у магазинов смотрим график, у офиса и склада — будни',
  'срок задачи перенесли до того, как он наступил',
  'последний комментарий в задаче до срока — ваш (например, почему не успеваете)',
  'задачу поставили уже с прошедшим сроком',
  'работу сдали на проверку вовремя, а постановщик принял позже',
  'отчёт за день сдан, а балл за несданный всё равно стоит',
];
let _arVkl = 'pogoda', _osporil = false, _reshil = '';
// Блок «Ждут решения» — у тех, кто разбирает оспоренные баллы (как в боевой: таблица,
// «Снять» и «Отклонить», красная пометка дольше трёх дней).
const zhdutHtml = () => _reshil
  ? `<div class="card" style="max-width:640px"><div class="ct">⏳ Ждут решения — 0</div>
      <div class="alert as" style="display:block">✓ ${_reshil==='snyal'?'Балл снят — у сотрудника он погас':'Оспаривание отклонено — балл остаётся, вашу причину сотрудник видит в истории'}.</div></div>`
  : `<div class="card" style="max-width:640px;border-color:var(--red)"><div class="ct">⏳ Ждут решения — 1</div>
    <div class="tw-wrap"><table><tr><th>Кто</th><th>Балл</th><th>Что написал</th><th></th></tr>
      <tr><td><b>Семикопенко Дарья</b><div style="font-size:11px;color:var(--muted)">${esc(MAG)}</div></td>
        <td>11 сентября<div style="font-size:12px">Смена без нажатой кнопки «Пришёл» или «Ушёл»</div></td>
        <td>«Была на смене, телефон сел — есть чек за 11:20»<div style="margin-top:3px"><span class="tag tw">ждёт 2 дн.</span></div></td>
        <td style="white-space:nowrap"><button class="btn bsm bp" id="uch-snyat" onclick="uchReshil('snyal')">Снять</button>
          <button class="btn bsm" id="uch-otklonit" onclick="uchReshil('otklonil')">Отклонить</button></td></tr></table></div>
    <div class="rnote">Снять — балл гаснет. Отклонить — балл остаётся, человек видит в истории вашу причину и повторно
      оспорить его уже не может. Дольше трёх дней — красная пометка.</div></div>`;
window.uchReshil = function(v){ _reshil = v; tr.sobytie('act:reshil'); pgAntireiting(); };
window.pgAntireiting = function(){
  nav('pgAntireiting'); setTitle('Антирейтинг'); setBadge('');
  const tabs = `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:1rem">
    <button class="btn bsm ${_arVkl==='pogoda'?'bp':''}" id="uch-ar-pogoda" onclick="uchArVkl('pogoda')">🌦️ Погода</button>
    <button class="btn bsm ${_arVkl==='pravila'?'bp':''}" id="uch-ar-pravila" onclick="uchArVkl('pravila')">📋 Правила</button></div>`;
  if(_arVkl==='pravila'){
    setContent(tabs + `
    <div class="card"><div class="ct">За что начисляются баллы</div>
      <div class="tw-wrap"><table><tr><th>За что</th><th>Баллы</th><th>Кого касается</th></tr>
      ${BALL_PRAVILA_U.map(r=>`<tr><td>${esc(r[0])}</td><td style="font-weight:700;white-space:nowrap">${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}
      </table></div>
      <div class="rnote">Баллы ставит программа сама, ночью. Нарушение — балл, без потолков.</div></div>
    <div class="card"><div class="ct">Скоро добавятся</div>
      <p style="margin:0">${BALL_SKORO_U.map(esc).join('; ')}.</p>
      <div class="rnote">Эти нарушения начнут считаться, когда программа научится собирать для них данные.</div></div>
    <div class="card"><div class="ct">За что балла нет</div>
      <ul style="margin:0;padding-left:1.2em;line-height:1.7">${BALL_NET_U.map(x=>'<li>'+esc(x)+'</li>').join('')}</ul></div>
    <div class="card"><div class="ct">Погода и срок жизни балла</div>
      <p style="margin:0 0 .5rem">☀️ Ясно — 0 · ⛅ Облачно — 1–5 · 🌧️ Моросит — 6–14 · ☔ Зонт обязателен — 15–29 · ⛈️ Штормовое предупреждение — 30 и больше</p>
      <div class="rnote">Балл живёт 90 дней и сгорает сам. До 30 сентября идёт проверка, 1 октября — амнистия: счёт обнуляется, и дальше всё всерьёз.</div></div>
    <div class="card"><div class="ct">Если балл не по делу</div>
      <p style="margin:0">Откройте «Моя история», нажмите «Оспорить» у балла и напишите причину одной строкой. Руководитель или администратор посмотрит и снимет, если так. Пока балл не сняли, он считается.</p></div>`);
    return;
  }
  const adm = CU.role==='admin';
  const ruk = ['manager','accountant','admin'].indexOf(CU.role) >= 0;
  setContent(tabs + (ruk ? zhdutHtml() : '') + `
  <div class="card" style="max-width:640px"><div class="ct">Моя погода</div>
    <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
      <div style="font-size:40px;line-height:1">⛅</div>
      <div><div style="font-size:20px;font-weight:700;color:var(--muted)">Облачно</div>
        <div style="font-size:13px;color:var(--muted)">2 балла за последние 90 дней</div></div></div></div>
  <div class="card" style="max-width:640px"><div class="ct">Моя история</div>
    <div class="tw-wrap"><table><tr><th>Когда</th><th>За что</th><th>Балл</th><th></th></tr>
      <tr><td>11 сентября</td><td>Смена без отметки прихода или ухода</td><td>1</td>
        <td>${_osporil?'<span class="tag ti">оспорен</span>':'<button class="btn bsm" id="uch-osporit-0" onclick="uchOsporit()">Оспорить</button>'}</td></tr>
      <tr><td>3 сентября</td><td>Отчёт магазина сдан не в день смены</td><td>1</td><td></td></tr>
    </table></div>
    ${_osporil?'<div class="alert as" style="display:block">✓ Отправлено: руководитель посмотрит и снимет балл, если так. Пока не сняли — он считается.</div>':''}
    <div class="rnote">Балл живёт 90 дней и сгорает сам. Счёт — то, что действует сейчас; оспоренный балл считается, пока его не сняли.</div></div>
  ${adm?`<div class="card" style="max-width:640px"><div class="ct">Права администратора</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn bsm">➕ Поставить балл</button><button class="btn bsm">🕊️ Амнистия</button></div>
    <div class="rnote">Ручной балл — с причиной, она видна человеку в его истории. Амнистия гасит счёт всей компании по выбранный день.</div></div>`:''}
  <div class="card" style="max-width:640px"><div class="ct">Погода в компании</div>
    <div class="tw-wrap"><table><tr><th>Сотрудник</th><th>Счёт</th><th>Статус</th></tr>
      <tr><td>Забабурина Александра</td><td>0</td><td>☀️ Ясно</td></tr>
      <tr><td>Семикопенко Дарья</td><td>7</td><td>🌧️ Моросит</td></tr>
      <tr><td>Акишева Жанар</td><td>1</td><td>⛅ Облачно</td></tr></table></div>
    <div class="rnote">За что начислен балл — видно в истории по человеку.</div></div>`);
};
window.uchArVkl = function(v){ _arVkl = v; if(v==='pravila') tr.sobytie('act:pravila'); pgAntireiting(); };
window.uchOsporit = function(){
  const ov=document.createElement('div'); ov.className='ov';
  ov.innerHTML=`<div class="ovc" style="max-width:420px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <b>Оспорить балл</b>
      <button class="btn bsm" onclick="this.closest('.ov').remove()">✕</button></div>
    <div class="fg"><label class="fl">Причина одной строкой</label>
      <input class="fc" value="Был на смене, забыл отметиться — есть чек за 11:20"></div>
    <button class="btn bp bbl tr-tyk" id="uch-osp-send" onclick="uchOspSend(this)">Отправить</button></div>`;
  document.body.appendChild(ov);
};
window.uchOspSend = function(b){ b.closest('.ov').remove(); _osporil = true; tr.sobytie('act:osporil'); pgAntireiting(); };

// ── Достижения: игрушечные люди и награды ──
// Повторяет боевую 2026-09-20 · 26: статуэтки — картинками из stat/, карточка
// награды на весь экран открывается нажатием на любую награду, описание —
// двумя фразами («за что» и «что это за вещь»), антикубки — на «Пыльной полке».
// Тексты фраз взяты из каталога наград (поля za_kratko и fraza).
const ACH_STAT = 'https://umgroupkz-commits.github.io/fbsmsalemanagers/stat/';
const ACH_KAT_U = {
  m_prodavec:{st:'Вега',nm:'Продавец месяца',kat:'Месяц: победители',
    zk:'Лучший сводный результат месяца в сети: план, средний чек и UPT',
    fr:'Награда из горного хрусталя в форме пятиконечной звезды на серебряной игле, основание — белый мрамор'},
  p_plan100:{st:'Десятка',nm:'План 100 %',kat:'Месяц: пороги',zk:'Личный план месяца выполнен',
    fr:'Награда из дуба в форме мишени с латунной стрелой точно в центре'},
  p_chek:{st:'Пятнашка',nm:'Чек 15 000',kat:'Месяц: пороги',zk:'Средний чек месяца от 15 000 ₸',
    fr:'Награда из клёна в форме чековой ленты с выжженным числом 15'},
  k_tri_plana:{st:'Три стрелы',nm:'Три из трёх',kat:'Квартал',zk:'Личный план выполнен в каждом месяце квартала',
    fr:'Награда в форме трёх золочёных стрел в одной мишени из красной яшмы'},
  n_nedelya:{st:'Лошадка',nm:'Первая неделя',kat:'Новичкам',zk:'Первые пять смен',
    fr:'Награда из плетёной соломы в форме лошадки'},
  r_den:{st:'Планка',nm:'Личный рекорд дня',kat:'Рекорды',zk:'Побит собственный лучший день по продажам',
    fr:'Награда из {м} в форме планки для прыжков в высоту, постамент — серый мрамор',rost:'chislo'},
  r_mesyac:{st:'Вершина',nm:'Лучший месяц',kat:'Рекорды',zk:'Самый сильный месяц продаж за всё своё время',
    fr:'Награда из {м} в форме горного пика с флажком, постамент — скальная порода',rost:'chislo'},
  r_zadachi:{st:'Турбина',nm:'Свой рекорд задач',kat:'Рекорды',zk:'Больше задач в срок за месяц, чем когда-либо раньше',
    fr:'Награда из {м} в форме турбины с лопатками, постамент — титан',rost:'chislo'},
  r_set_den:{st:'Комета',nm:'Рекорд сети за день',kat:'Рекорды',zk:'Самые большие продажи за день в истории сети',
    fr:'Награда из {м} в форме кометы с длинным хвостом, постамент — синий авантюрин',rost:'chislo'},
  r_set_cheki:{st:'Кассовый аппарат',nm:'Рекорд сети по чекам',kat:'Рекорды',zk:'Больше всех чеков за день в истории сети',
    fr:'Награда из {м} в форме старинной кассы с рычагом, постамент — красное дерево',rost:'chislo'},
  r_set_shtuki:{st:'Караван',nm:'Рекорд сети по товарам',kat:'Рекорды',zk:'Больше всех проданных товаров за день в истории сети',
    fr:'Награда из {м} в форме верблюда, гружённого тюками, постамент — жёлтый песчаник',rost:'chislo'},
  r_1m:{st:'Слиток дня',nm:'Миллион за смену',kat:'Рекорды',zk:'Личные продажи от 1 000 000 ₸ за один день',
    fr:'Награда из {м} в форме банковского слитка с выбитой датой, постамент — чёрный гранит',rost:'chislo'},
  l_prodazhi:{st:'Монетный столб',nm:'Личные продажи',kat:'Ступени',zk:'Сумма личных продаж за всё время',
    fr:'Награда из {м} в форме стопки монет, постамент — зелёный мрамор',rost:'stupen',
    lest:['1 млн ₸','3 млн ₸','5 млн ₸','10 млн ₸','25 млн ₸','50 млн ₸','100 млн ₸','250 млн ₸'],
    suf_lest:['t1','t2','t3','t4','t5','t6','t7','t8'],
    met_lest:['med','bronza','serebro','zoloto','platina','sapfir','izumrud','brilliant']},
  l_smeny:{st:'Подкова',nm:'Смены',kat:'Ступени',zk:'Число отработанных смен',
    fr:'Награда из {м} в форме подковы с гвоздями, постамент — кузнечная сталь',rost:'stupen',
    lest:['10 смен','50 смен','100 смен','250 смен','500 смен','1 000 смен'],
    suf_lest:['med','bronza','serebro','zoloto','platina','brilliant'],
    met_lest:['med','bronza','serebro','zoloto','platina','brilliant']},
  l_stazh:{st:'Годовые кольца',nm:'Стаж в FBSM',kat:'Ступени',zk:'Стаж работы в компании',
    fr:'Награда из {м} в форме среза ствола с годовыми кольцами, постамент — кап берёзы',rost:'stupen',
    lest:['Первый месяц','Полгода','1 год','2 года','3 года','4 года','5 лет'],
    suf_lest:['med','bronza','serebro','serebro','zoloto','zoloto','platina'],
    met_lest:['med','bronza','serebro','serebro','zoloto','zoloto','platina'],
    beskonechno:'дальше — каждый год; с 10 лет платина с сапфиром, с 15 — с изумрудом, с 20 — с бриллиантом; ступени не кончаются'},
  l_kursy:{st:'Сова',nm:'Курсы',kat:'Ступени',zk:'Сданный курс обучения — одна сова за каждый курс',
    fr:'Награда из белого фарфора в форме совы, сидящей на стопке книг'},
  n_100k:{st:'Монета',nm:'Первые 100 000 ₸',kat:'Новичкам',zk:'Первые 100 000 ₸ личных продаж',
    fr:'Награда из меди в форме монеты, стоящей на ребре'},
  x_zont:{st:'Дырявый зонт',nm:'Дырявый зонт',kat:'Антикубки',anti:true,pogoda:true,
    zk:'Погода «Зонт обязателен» — 15 и больше штрафных баллов',
    fr:'Антикубок из ржавой жести в форме зонта со сломанной спицей и дырой в куполе, постамент — трухлявая доска'},
  x_grom:{st:'Громоотвод',nm:'Громоотвод',kat:'Антикубки',anti:true,pogoda:true,
    zk:'Погода «Шторм» — 30–49 штрафных баллов за 90 дней',
    fr:'Антикубок из горелого железа в форме погнутого штыря, в который бьёт молния, постамент — трухлявая доска'},
  x_kosyak:{st:'Мистер Косяк',nm:'Мистер Косяк',kat:'Антикубки',anti:true,zk:'Косяк — причина указана при выдаче',
    fr:'Антикубок из гнутой проволоки и жести в форме человечка, наступившего на собственные шнурки, постамент — трухлявая доска'},
  x_muha:{st:'Сонная муха',nm:'Сонная муха',kat:'Антикубки',anti:true,zk:'Хронические опоздания',
    fr:'Антикубок из потемневшего олова в форме мухи, уснувшей на будильнике, постамент — трухлявая доска'},
  x_girya:{st:'Ржавая гиря',nm:'Ржавая гиря',kat:'Антикубки',anti:true,zk:'Подвёл команду',
    fr:'Антикубок из ржавого чугуна в форме пудовой гири с цепью, постамент — трухлявая доска'},
  x_grabli:{st:'Грабли',nm:'Грабли',kat:'Антикубки',anti:true,zk:'Повторение одной и той же ошибки',
    fr:'Антикубок из рассохшегося дерева и ржавого железа в форме граблей, на которые уже наступали, постамент — трухлявая доска'},
  x_storis:{st:'Погасший экран',nm:'Погасший экран',kat:'Антикубки',anti:true,zk:'10 и больше дней без сторис за 30 дней',
    fr:'Антикубок из потемневшего олова и пыльного стекла в форме старого телефона с погасшим треснувшим экраном, постамент — трухлявая доска'},
  x_uragan:{st:'Сорванная крыша',nm:'Сорванная крыша',kat:'Антикубки',anti:true,pogoda:true,zk:'Погода «Ураган» — 50–79 баллов за 90 дней',
    fr:'Антикубок из ржавой мятой жести в форме домика с сорванной бурей крышей, постамент — трухлявая доска'},
  x_krasnaya:{st:'Красный флаг',nm:'Красный флаг',kat:'Антикубки',anti:true,pogoda:true,zk:'Погода «Красная зона» — 80 и больше баллов, разбор с руководством',
    fr:'Антикубок в форме рваного выцветшего красного флага на погнутом ржавом древке, постамент — трухлявая доска'},
  x_otchet:{st:'Пустой ежедневник',nm:'Пустой ежедневник',kat:'Антикубки',anti:true,zk:'3 и больше несданных отчётов за день за 30 дней',
    fr:'Антикубок в форме раскрытого ежедневника с пустыми пожелтевшими страницами, паутиной в углу и высохшей ручкой, постамент — трухлявая доска'},
  x_kolokol:{st:'Треснувший колокольчик',nm:'Треснувший колокольчик',kat:'Антикубки',anti:true,zk:'Больше 12 баллов за жалобы клиентов за 30 дней',
    fr:'Антикубок из потускневшей латуни в форме настольного звонка с трещиной по куполу и погнутой кнопкой, постамент — трухлявая доска'},
  x_obryv:{st:'Обрыв связи',nm:'Обрыв связи',kat:'Антикубки',anti:true,zk:'10 и больше дней с обращениями без ответа за 30 дней',
    fr:'Антикубок из потемневшего олова и потёртого бакелита в форме телефонной трубки с оборванным витым шнуром, постамент — трухлявая доска'},
  x_zerkalo:{st:'Кривое зеркало',nm:'Кривое зеркало',kat:'Антикубки',anti:true,zk:'Приукрашенные цифры и отчёты',
    fr:'Антикубок из мутного стекла в гнутой латуни в форме зеркала в перекошенной раме, постамент — трухлявая доска'},
  x_kopilka:{st:'Разбитая копилка',nm:'Разбитая копилка',kat:'Антикубки',anti:true,zk:'Небрежность с деньгами и товаром',
    fr:'Антикубок из треснувшей глины в форме свиньи-копилки с отколотым боком, постамент — трухлявая доска'},
  x_kaktus:{st:'Кактус',nm:'Кактус',kat:'Антикубки',anti:true,zk:'Грубость с клиентом или коллегой',
    fr:'Антикубок из позеленевшей меди в форме кактуса в щербатом горшке, постамент — трухлявая доска'},
};
// Вкладка «Ордена»: сколько ЧЕЛОВЕК имеют награду (в карточке ×N — сколько раз
// получил один человек; это разные числа, и в уроке про это сказано прямо).
const ACH_ORD_U = [
  ['Месяц: победители', [['m_prodavec',1]]],
  ['Месяц: пороги',     [['p_plan100',2],['p_chek',1]]],
  ['Квартал',           [['k_tri_plana',1]]],
  ['Рекорды',           [['r_den',2],['r_set_den',1],['r_set_cheki',1],['r_set_shtuki',0],['r_1m',1],
                         ['r_mesyac',0],['r_zadachi',0]]],
  ['Ступени',           [['l_smeny',3],['l_stazh',3],['l_prodazhi',1],['l_kursy',2]]],
  ['Новичкам',          [['n_nedelya',2],['n_100k',2]]],
  ['Антикубки',         [['x_zont',1],['x_muha',1],['x_kosyak',0],['x_grabli',0],['x_girya',0],
                         ['x_zerkalo',0],['x_kopilka',0],['x_kaktus',0],['x_grom',0],['x_storis',0],['x_otchet',0],['x_kolokol',0],['x_obryv',0],['x_uragan',0],['x_krasnaya',0]]],
];
const ACH_METALL_U = {med:'медь',bronza:'бронза',serebro:'серебро',zoloto:'золото',
  platina:'платина',sapfir:'платина с сапфиром',izumrud:'платина с изумрудом',brilliant:'платина с бриллиантом'};
const ACH_MET_ROD_U = {med:'меди',bronza:'бронзы',serebro:'серебра',zoloto:'золота',platina:'платины',
  sapfir:'платины с сапфиром',izumrud:'платины с изумрудом',brilliant:'платины с бриллиантом'};
const ACH_POROGI_U = [[2,'bronza'],[4,'serebro'],[7,'zoloto'],[12,'platina'],[24,'brilliant']];
// Металл рекордов растёт по числу наград — то же правило, что в боевой.
const achMetallU = n => n>=24?'brilliant':n>=12?'platina':n>=7?'zoloto':n>=4?'serebro':n>=2?'bronza':'med';
const achMetU = g => { const k = ACH_KAT_U[g.code]; return k.rost==='chislo' ? achMetallU(g.n||1) : (k.rost==='stupen' ? k.met_lest[g.stup] : null); };
const achSufU = g => { const k = ACH_KAT_U[g.code]; return k.rost==='chislo' ? achMetallU(g.n||1) : (k.rost==='stupen' ? k.suf_lest[g.stup||0] : null); };
const achSrcU = g => ACH_STAT + g.code + (achSufU(g) ? '__'+achSufU(g) : '') + '.webp';
const achSrcBigU = g => ACH_STAT + 'b/' + g.code + (achSufU(g) ? '__'+achSufU(g) : '') + '.jpg';
const achStatU = (g,px) => `<img src="${achSrcU(g)}" alt="" loading="lazy" style="width:${px}px;height:${px}px;`
  +`object-fit:contain;flex:none;border-radius:${Math.round(px/8)}px;background:#fff" onerror="this.style.visibility='hidden'">`;
// Описание — две фразы: за что награда и что это за вещь. В каталоге у наград
// с меняющимся металлом стоит «{м}» — подставляем металл в родительном падеже.
const achFrazaU = (code,met) => { const f = ACH_KAT_U[code].fr || '';
  return (met && ACH_MET_ROD_U[met] ? f.replace('{м}', ACH_MET_ROD_U[met]) : f.replace('из {м} ','')) + '.'; };
const achOpisU = (code,met) => `<div style="font-weight:600;line-height:1.4">${esc(ACH_KAT_U[code].zk)}</div>
  <div style="font-size:13px;line-height:1.45;color:var(--muted);margin-top:3px">${esc(achFrazaU(code,met))}</div>`;
// Название награды: у лестниц — со ступенью, «Смены · 50 смен».
const achNazvU = g => { const k = ACH_KAT_U[g.code]; return k.rost==='stupen' ? k.nm+' · '+k.lest[g.stup] : k.nm; };
const ACH_REKORDY_U = ['r_den','r_mesyac','r_zadachi'];   // личные рекорды — как в боевой
// Кубок: белая плитка на «доске», стопка позади и цифра в кружке.
const achKubokU = o => {
  const stopka = o.n>1
    ? `<div style="position:absolute;inset:0;transform:translate(6px,5px) rotate(5deg);background:var(--s2);border:1px solid var(--border);border-radius:12px"></div>`
      +`<div style="position:absolute;inset:0;transform:translate(3px,2.5px) rotate(2.5deg);background:var(--bg);border:1px solid var(--border);border-radius:12px"></div>`
    : '';
  return `<button ${o.attrs||''} style="background:none;border:none;padding:0 0 6px;cursor:pointer;font:inherit;color:var(--text);min-width:0;
    border-bottom:3px solid ${o.anti?'var(--red)':'var(--border)'};${o.seryy?'opacity:.45;filter:grayscale(1)':''}">
    <div style="position:relative;height:76px;margin:6px 12px 6px 8px">${stopka}
      <div style="position:absolute;inset:0;background:#fff;border:1px ${o.anti?'dashed var(--red)':'solid var(--border)'};border-radius:12px;display:flex;align-items:center;justify-content:center;overflow:hidden">${achStatU(o.g,64)}</div>
      ${o.znachok?`<span style="position:absolute;top:-6px;right:-8px;font-size:11px;font-weight:700;background:${o.anti?'var(--red)':'var(--blue)'};color:#fff;border-radius:99px;padding:1px 6px">${esc(o.znachok)}</span>`:''}
    </div><div style="font-size:11px;line-height:1.25;padding:0 2px">${esc(o.podpis)}</div>
    ${o.sub?`<div style="font-size:10.5px;line-height:1.2;color:var(--muted);padding:1px 2px 0">${esc(o.sub)}</div>`:''}</button>`;
};
const ACH_U = [
  {n:'Забабурина Александра', d:'Продавец-консультант · Республика', dost:67, ya:true,
   stazh:'1 год 3 месяца', dr:'14 марта', g:[
    {code:'m_prodavec',za:'Лучший сводный индекс сети за август 2026 — 124 балла',den:'1 сентября 2026'},
    {code:'p_plan100',za:'План за август 2026 выполнен на 154 %',den:'1 сентября 2026'},
    {code:'p_chek',za:'Средний чек августа 2026 — 15 400 ₸',den:'1 сентября 2026'},
    {code:'l_prodazhi',za:'Личных продаж за всё время — 5 млн ₸',den:'22 августа 2026',stup:2,
     proydeno:[['5 млн ₸','22 августа 2026'],['3 млн ₸','4 июля 2026'],['1 млн ₸','19 мая 2026']]},
    {code:'l_smeny',za:'Сотая смена',den:'14 августа 2026',stup:2,
     proydeno:[['100 смен','14 августа 2026'],['50 смен','2 июля 2026'],['10 смен','3 июня 2026']]},
    {code:'l_stazh',za:'Год в FBSM',den:'3 июня 2026',stup:2,ur:'1 год',
     dalshe:'до «2 года» — ещё 8 месяцев',pct:34,
     proydeno:[['1 год','3 июня 2026'],['Полгода','3 декабря 2025'],['Первый месяц','3 июля 2025']]},
    {code:'r_den',za:'Лучший день — 1 040 000 ₸, 29 августа 2026',den:'29 августа 2026',n:3,
     znach:'1 040 000 ₸',prezhn:'870 000 ₸',
     daty:[['Лучший день — 1 040 000 ₸','29 августа 2026'],['Лучший день — 870 000 ₸','12 августа 2026'],
           ['Лучший день — 640 000 ₸','23 июля 2026']]},
    {code:'r_1m',za:'1 040 000 ₸ за смену 29 августа 2026',den:'29 августа 2026',n:1},
    {code:'r_set_den',za:'Рекорд сети по продажам за день — держит с 6 сентября 2026',den:'6 сентября 2026',n:1},
    {code:'n_100k',za:'Первые 100 000 ₸ личных продаж',den:'14 сентября 2026'},
    {code:'l_kursy',za:'Сдано три курса обучения',den:'19 сентября 2026',n:3,
     daty:[['Курс «Ежедневный отчёт»','19 сентября 2026'],['Курс «Зарплата продавца-кассира»','15 сентября 2026'],
           ['Курс «Программа учёта продаж»','12 сентября 2026']]}]},
  {n:'Торебай Гулжайкын', d:'Продавец-консультант · Манаса', dost:67,
   stazh:'1 месяц', dr:'2 декабря', g:[
    {code:'n_nedelya',za:'Первые пять смен',den:'16 августа 2026'},
    {code:'l_smeny',za:'Десятая смена',den:'27 августа 2026',stup:0,proydeno:[['10 смен','27 августа 2026']]},
    {code:'l_stazh',za:'Первый месяц в FBSM',den:'11 сентября 2026',stup:0,ur:'первый месяц',
     dalshe:'до «полгода» — ещё 4 месяца',pct:22,proydeno:[['Первый месяц','11 сентября 2026']]}],
   anti:[{code:'x_zont',den:'18 сентября 2026',za:'Погода «Зонт обязателен» — 16 штрафных баллов',
     srok:'пока не улучшится погода в антирейтинге'},
    {code:'x_kosyak',den:'17 сентября 2026',za:'Оставил магазин без сдачи — причину вписал управляющий',
     srok:'ещё 4 дня'}]},
  {n:'Акишева Жанар', d:'Продавец-кассир · Асфендиярова', dost:67,
   stazh:'6 месяцев', dr:'30 июля', g:[
    {code:'n_nedelya',za:'Первые пять смен',den:'8 марта 2026'},
    {code:'n_100k',za:'Первые 100 000 ₸ личных продаж',den:'11 марта 2026'},
    {code:'l_kursy',za:'Сдан один курс обучения',den:'10 марта 2026',n:1},
    {code:'k_tri_plana',za:'План выполнен во всех месяцах II квартала 2026: 104 %, 112 %, 108 %',den:'1 июля 2026'},
    {code:'l_smeny',za:'Пятидесятая смена',den:'2 июля 2026',stup:1,
     proydeno:[['50 смен','2 июля 2026'],['10 смен','20 марта 2026']]},
    {code:'l_stazh',za:'Полгода в FBSM',den:'3 сентября 2026',stup:1,ur:'полгода',
     dalshe:'до «1 год» — ещё 5 месяцев',pct:18,
     proydeno:[['Полгода','3 сентября 2026'],['Первый месяц','3 апреля 2026']]}],
   anti:[{code:'x_muha',den:'16 сентября 2026',za:'3 опоздания за 30 дней',
     srok:'ещё 12 дней, если новых нарушений не будет'}]},
];
let _achVklU = 'lyudi';
// Карточка сотрудника — та же, что в программе: счётчик видов, «Путь»,
// «Рекорды», «Полка наград», ниже — «Пыльная полка». Любая награда открывает
// одну и ту же карточку награды.
// Суммы в плитке рекорда не должны рваться по разрядам.
const achNerazryvU = s => String(s||'').replace(/(\d) (?=\d)/g, '$1\u00A0').replace(/(\d) (?=₸)/g, '$1\u00A0');
const achRekordTekstU = g => `<div style="font-size:14px;font-weight:700;line-height:1.3">${esc(achNerazryvU(g.znach||g.za))}</div>`
  + (g.den||g.prezhn ? `<div style="font-size:11.5px;color:var(--muted);line-height:1.3">${esc(achNerazryvU([g.den, g.prezhn?'прежний '+g.prezhn:''].filter(Boolean).join(' · ')))}</div>` : '');
const achKartochkaU = (p,i) => {
  const sobrano = p.g.length;
  const otkr = (g,anti) => `onclick="uchAchNagrada(${i},'${g.code}'${anti?',1':''})"`;
  let h = `<div class="g3" style="margin-bottom:1rem">
      <div class="metric"><div class="ml">Наград</div><div class="mv">${p.g.length}</div></div>
      <div class="metric"><div class="ml">Стаж</div><div class="mv" style="font-size:15px">${esc(p.stazh||'—')}</div></div>
      <div class="metric"><div class="ml">День рождения</div><div class="mv" style="font-size:15px">${p.dr?'🎂 '+esc(p.dr):'—'}</div></div></div>
    <div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:8px;background:var(--s2);border-radius:99px;overflow:hidden">
      <div style="width:${Math.round(sobrano/p.dost*100)}%;height:100%;background:var(--blue)"></div></div>
      <b style="font-size:13px;white-space:nowrap">${sobrano} из ${p.dost}</b></div>
    <div style="font-size:12px;color:var(--muted);margin:2px 0 14px">видов наград, доступных по должности</div>`;
  const lest = p.g.filter(g => ACH_KAT_U[g.code].rost==='stupen');
  if(lest.length){
    h += `<div class="ct" style="margin:0 0 .5rem">Путь</div>`;
    lest.forEach((g,j) => {
      const k = ACH_KAT_U[g.code];
      h += `<button id="uch-ach-put-${j}" ${otkr(g)} style="display:block;width:100%;text-align:left;background:none;font:inherit;color:var(--text);border:1px solid var(--border);border-radius:var(--r);padding:8px 10px;margin-bottom:6px;cursor:pointer">
        <span style="display:flex;align-items:center;gap:10px">${achStatU(g,44)}
        <span style="flex:1;min-width:0"><span style="display:block;font-weight:600;font-size:14px">${esc(achNazvU(g))}</span>
        ${achPutBarU(g)}<span style="display:block;font-size:12px;color:var(--muted)">${esc(achDalsheU(g))}</span></span>
        <span style="color:var(--muted);font-size:16px">›</span></span></button>`;
    });
  }
  const rek = p.g.filter(g => ACH_REKORDY_U.indexOf(g.code) >= 0);
  if(rek.length){
    h += `<div class="ct" style="margin:1rem 0 .5rem">Рекорды</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">`
      + rek.map((g,j) => `<div id="uch-ach-rek-${j}" ${otkr(g)} style="display:flex;gap:8px;align-items:center;border:1px solid var(--border);border-radius:var(--r);padding:7px 8px;cursor:pointer;min-width:0">
        ${achStatU(g,40)}<div style="min-width:0"><div style="font-size:12px;color:var(--muted)">${esc(ACH_KAT_U[g.code].nm)}</div>
        ${achRekordTekstU(g)}
        ${g.n>1?`<div style="font-size:11.5px;color:var(--muted)">бит ${g.n} ${g.n<5?'раза':'раз'}</div>`:''}</div></div>`).join('')
      + `</div>`;
  }
  h += `<div class="ct" style="margin:1rem 0 .6rem">Полка наград</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:10px 6px">`
    + p.g.map((g,j) => achKubokU({g, n:g.n||1, znachok:g.n>1?'×'+g.n:'', podpis:ACH_KAT_U[g.code].st, sub:ACH_KAT_U[g.code].nm,
        attrs:`id="uch-ach-n-${j}" ${otkr(g)}`})).join('')
    + `</div>`;
  if(p.anti && p.anti.length){
    h += `<div class="ct" style="margin:1.2rem 0 .3rem;color:var(--red)">Пыльная полка</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:.5rem">Антикубки временные — уйдут сами, когда выйдет срок, исправится погода или станет меньше нарушений. В счётчик наград они не входят.</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:10px 6px">`
      + p.anti.map((g,j) => achKubokU({g, n:1, podpis:ACH_KAT_U[g.code].st, sub:g.srok,
          attrs:`id="uch-ach-a-${j}" ${otkr(g,1)}`})).join('')
      + `</div>`;
  }
  return h;
};
const achPutBarU = g => { const k = ACH_KAT_U[g.code];
  return k.lest && g.pct===undefined
    ? `<span style="display:flex;gap:3px;margin:6px 0 3px">${k.lest.map((s,j)=>`<span style="flex:1;height:6px;border-radius:99px;background:${j<=g.stup?'var(--blue)':'var(--s2)'}"></span>`).join('')}</span>`
    : `<span style="display:block;height:6px;background:var(--s2);border-radius:99px;overflow:hidden;margin:5px 0 3px"><span style="display:block;width:${g.pct}%;height:100%;background:var(--blue)"></span></span>`; };
const achDalsheU = g => { const k = ACH_KAT_U[g.code];
  if(g.dalshe) return g.dalshe;
  return g.stup+1 < k.lest.length ? `ступень ${g.stup+1} из ${k.lest.length} · дальше — «${k.lest[g.stup+1]}»`
    : `все ${k.lest.length} ступени пройдены`; };
window.pgAchivki = function(){
  nav('pgAchivki'); setTitle('Достижения'); setBadge('');
  const b = (v,t) => `<button class="btn bsm ${_achVklU===v?'bp':''}" id="uch-ach-${v}" onclick="uchAchVkl('${v}')">${t}</button>`;
  const tabs = `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:1rem">${b('lyudi','👥 Люди')}${b('ordena','🏅 Ордена')}${b('lenta','🕒 Лента')}${b('pravila','📋 Правила')}${CU.role==='admin'?b('vruchit','🎁 Вручить'):''}</div>`;
  if(_achVklU==='vruchit' && CU.role!=='admin') _achVklU = 'lyudi';
  if(_achVklU==='vruchit'){ setContent(tabs + uchAchVruchitHtml()); return; }
  if(_achVklU==='pravila'){
    setContent(tabs + `<div class="card" style="max-width:640px"><div class="ct">Как считается сводный индекс</div>
      <p style="margin:0 0 .5rem">Побеждает лучший, а не тот, у кого больше покупателей. Каждый показатель сравнивается с другими участниками месяца, итог — в баллах: 100 — средний, 115 — заметно лучше остальных.</p>
      <div class="tw-wrap"><table><tr><td>План — в темпе за смену: продано за смену ÷ личный план на одну смену по графику</td><td><b>28 %</b></td></tr>
      <tr><td>Средний чек ÷ средний чек точки, где продавали</td><td><b>28 %</b></td></tr>
      <tr><td>UPT ÷ UPT той же точки</td><td><b>28 %</b></td></tr>
      <tr><td>Дисциплина — баллы антирейтинга за месяц (меньше — лучше)</td><td><b>16 %</b></td></tr></table></div>
      <div class="rnote">Ниже на вкладке — все ачивки: за что даются, кому и сколько раз.</div></div>
      <div class="card" style="max-width:640px"><div class="ct">Металл статуэтки</div>
      <p style="margin:0 0 .5rem">У большинства наград материал постоянный — он часть замысла статуэтки. Металл растёт только у двух видов:</p>
      <div class="tw-wrap"><table><tr><td>Рекорды — по числу наград</td><td>2 — бронза · 4 — серебро · 7 — золото · 12 — платина · 24 — бриллиант</td></tr>
      <tr><td>Лестницы — по ступени</td><td>металл закреплён за ступенью: «Смены», «Личные продажи», «Стаж»</td></tr></table></div>
      <div class="rnote">Антикубки в счётчик наград не входят и уходят сами: погодные — когда счёт антирейтинга опустится ниже порога, остальные — по сроку, который назначили при выдаче.</div></div>`);
    return;
  }
  if(_achVklU==='ordena'){
    setContent(tabs + ACH_ORD_U.map(([kat,spisok]) => `<div class="card" style="max-width:640px">
      <div class="ct"${kat==='Антикубки'?' style="color:var(--red)"':''}>${esc(kat)}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:10px 6px">`
      + spisok.map(([code,lyudey],j) => { const k = ACH_KAT_U[code];
          return achKubokU({g:{code,n:1,stup:0}, n:lyudey,
            znachok:lyudey>1?String(lyudey):'', podpis:k.st, sub:k.nm+(k.skoro?' · скоро':''),
            anti:!!k.anti, seryy:!lyudey && !k.anti,
            attrs:`id="uch-ach-ord-${kat==='Антикубки'?'a':''}${j}" onclick="uchAchOrden('${code}')"`}); }).join('')
      + `</div></div>`).join('')
      + `<div class="rnote">Серые — ещё никем не получены. Цифра — у скольких человек награда есть.
        Нажмите на статуэтку — там описание, условие и все, у кого она есть.</div>`);
    return;
  }
  if(_achVklU==='lenta'){
    setContent(tabs + `<div class="card" style="max-width:640px"><div class="ct">Последние награды</div>
      <p style="margin:0">Новые награды по дням. Нажмите — откроется, за что именно. О каждой новой награде программа пишет в общий чат Битрикса.</p></div>`);
    return;
  }
  setContent(tabs + `<div class="card" style="max-width:640px">` + ACH_U.map((p,i)=>`
    <button id="uch-ach-p-${i}" onclick="uchAchProfil(${i})" style="display:flex;gap:12px;align-items:center;width:100%;text-align:left;padding:10px;border:1px solid var(--border);border-radius:var(--rs);background:var(--surface);margin-bottom:8px;cursor:pointer;color:var(--text);font:inherit">
      <span style="width:44px;height:44px;border-radius:50%;background:var(--bl);color:var(--bd);display:inline-flex;align-items:center;justify-content:center;font-weight:700;flex:none">${p.n.split(' ').map(x=>x[0]).join('')}</span>
      <span style="min-width:0"><b>${esc(p.n)}</b><span style="display:block;font-size:12px;color:var(--muted)">${esc(p.d)} · наград: ${p.g.length}</span>
      <span style="display:flex;gap:3px;margin-top:4px;flex-wrap:wrap;align-items:center">${p.g.slice(0,6).map(g=>achStatU(g,26)).join('')}${(p.anti||[]).map(g=>`<span style="display:inline-flex;border:1px dashed var(--red);border-radius:6px;padding:1px">${achStatU(g,24)}</span>`).join('')}</span></span></button>`).join('') + `</div>`);
};
window.uchAchVkl = function(v){ _achVklU = v; pgAchivki(); };
window.uchAchProfil = function(i){
  const p = ACH_U[i], ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'uch-ach-prof';
  ov.innerHTML = `<div class="ovc" style="max-width:640px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><b>${esc(p.n)}</b>
    <button class="btn bsm" id="uch-ach-zakryt" onclick="this.closest('.ov').remove()">✕</button></div>
    <div style="font-size:13px;color:var(--muted);margin-bottom:.8rem">${esc(p.d)} · фото и должность — из Битрикса</div>
    ${achKartochkaU(p,i)}
    <div class="rnote">Нажмите любую награду — «Путь», рекорд, кубок на полке или антикубок — откроется одна и та же карточка награды.</div></div>`;
  document.body.appendChild(ov);
  tr.sobytie('act:achprofil');
};
// Карточка награды: на телефоне во весь экран. Открывается из «Пути»,
// «Рекордов», с полки и с пыльной полки — раскрывающихся панелей больше нет.
window.uchAchNagrada = function(i,code,anti){
  const p = ACH_U[i], spisok = anti ? p.anti : p.g, g = spisok.find(x => x.code===code);
  const k = ACH_KAT_U[code], met = achMetU(g);
  let prog = '';
  if(k.rost==='stupen') prog = achPutBarU(g) + `<span style="display:block;font-size:12.5px;color:var(--muted);text-align:center">${esc(achDalsheU(g))}</span>`;
  else if(k.rost==='chislo'){ const sl = ACH_POROGI_U.find(x => x[0] > (g.n||1));
    prog = `<span style="display:block;font-size:12.5px;color:var(--muted);text-align:center">${sl?'до '+esc(ACH_MET_ROD_U[sl[1]])+' — ещё '+(sl[0]-(g.n||1)):'высший металл'}</span>`; }
  const spisokStrok = (g.proydeno || g.daty || []).map(([nm,den]) =>
    `<span style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 2px;border-bottom:1px solid var(--border);font-size:13.5px">
      <span style="min-width:0">${k.rost==='stupen'?'<b>'+esc(achNazvU({code,stup:0}).split(' · ')[0])+' · '+esc(nm)+'</b>':esc(nm)}</span>
      <span style="font-size:12px;color:var(--muted);white-space:nowrap">${esc(den)} ›</span></span>`).join('');
  const h = `<div class="ovc ach-nag" style="max-width:520px;padding:0;overflow-y:auto">
    <div style="position:relative;text-align:center;padding:14px 16px 8px;background:radial-gradient(circle at 50% 42%,#fff 0,#fff 46%,${k.anti?'#fbeaea':'#eaf1f9'} 100%)">
      <button class="btn bsm" id="uch-ach-nag-zakryt" style="position:absolute;top:10px;right:10px" onclick="this.closest('.ov').remove()">✕</button>
      <img src="${achSrcBigU(g)}" alt="" style="width:min(300px,70vw);height:min(300px,70vw);object-fit:contain;mix-blend-mode:multiply"
        onerror="this.onerror=null;this.src='${achSrcU(g)}'"></div>
    <div style="padding:12px 20px 18px;text-align:center">
      ${k.anti?`<div style="font-size:11.5px;font-weight:700;letter-spacing:.08em;color:var(--red)">АНТИКУБОК</div>`:''}
      <div style="font-size:26px;font-weight:700;line-height:1.2">«${esc(k.st)}»</div>
      ${achNazvU(g)===k.st?'':`<div style="font-size:14px;color:var(--muted);margin-top:2px">${esc(achNazvU(g))}</div>`}
      <div style="font-size:16px;font-weight:600;line-height:1.4;margin-top:14px">${esc(k.anti?g.za:k.zk)}</div>
      <div style="font-size:13.5px;line-height:1.45;color:var(--muted);margin-top:6px">${esc(achFrazaU(code,met))}</div>
      ${k.anti
        ? `<div style="font-size:14px;font-weight:600;color:var(--red);margin-top:14px">Простоит: ${esc(g.srok)}</div>
           <div style="font-size:12px;color:var(--muted);margin-top:2px">На зарплату и награды не влияет.</div>`
        : `<div style="font-size:14px;margin-top:14px">${esc(g.den)}${g.n>1?' · получена '+g.n+' '+(g.n<5?'раза':'раз'):''}</div>
           ${prog?`<div style="margin-top:8px">${prog}</div>`:''}
           ${p.ya?`<button class="btn bp bbl tr-tyk" id="uch-ach-podelitsya" style="margin-top:16px" onclick="uchAchPodelitsya(this,${i},'${code}')">📤 Поделиться</button>
             <div class="rnote" style="text-align:left">Кнопка есть только у своей награды: чужой поделиться нельзя.</div>`
             :`<div class="rnote" style="text-align:left">Поделиться можно только своей наградой — у чужой кнопки нет.</div>`}`}
      <div style="text-align:left;margin-top:16px">
        ${spisokStrok
          ? `<details><summary style="cursor:pointer;font-size:13px;color:var(--blue);padding:6px 0">${k.anti?'Все антикубки':k.rost==='stupen'?'Пройденные ступени':'Все даты'} · ${(g.proydeno||g.daty).length}</summary>${spisokStrok}</details>`
          : `<button onclick="this.nextElementSibling.style.display='block'" style="background:none;border:none;padding:6px 0;font:inherit;font-size:13px;color:var(--blue);cursor:pointer">Как посчитано ›</button>
             <div class="rnote" style="display:none;margin-top:0">В программе здесь открывается расшифровка вручения: из чего сложилась награда и кто рядом.</div>`}
      </div></div></div>`;
  const ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'uch-ach-vr'; ov.style.zIndex = 105;
  ov.innerHTML = h;
  ov.addEventListener('click', e => { if(e.target===ov) ov.remove(); });
  document.body.appendChild(ov);
  if(window.tr && tr.podsvetit) tr.podsvetit();
};
window.uchAchPodelitsya = function(b,i,code){
  const p = ACH_U[i], g = p.g.find(x => x.code===code), k = ACH_KAT_U[code];
  b.closest('.ovc').innerHTML = `<div style="padding:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><b>Открытка готова</b>
      <button class="btn bsm" id="uch-ach-otkr-zakryt" onclick="this.closest('.ov').remove()">✕</button></div>
    <div style="background:var(--s2);border-radius:var(--r);padding:14px;text-align:center">
      ${achStatU(g,120)}<div style="font-size:11px;letter-spacing:.08em;color:var(--muted);margin-top:6px">FBSM · НАГРАДА</div>
      <div style="font-weight:700;font-size:18px">«${esc(k.st)}»</div>
      <div style="font-size:13px;color:var(--muted)">${esc(achNazvU(g))}</div>
      <div style="font-size:13.5px;font-weight:600;margin-top:8px">${esc(k.zk)}</div>
      <div style="font-size:12.5px;color:var(--muted);margin-top:4px">${esc(achFrazaU(code,achMetU(g)))}</div>
      <div style="font-size:12.5px;margin-top:8px">${esc(p.n)} · ${esc(g.den)}</div></div>
    <div class="rnote">Программа рисует картинку 1080×1350 — формат ленты. Личных сумм на ней нет: статуэтка, награда,
      за что она и что это за вещь. Отдаётся только сама картинка, без сопроводительного текста: куда отправить —
      решаете вы.</div></div>`;
  tr.sobytie('act:achpodel');
};
// Окно ордена: то же описание двумя фразами, у рекордов — линейка металла,
// у лестниц — все ступени со своим металлом и теми, кто на них стоит.
window.uchAchOrden = function(code){
  const k = ACH_KAT_U[code];
  const kto = [];
  ACH_U.forEach(p => (p.g.concat(p.anti||[])).forEach(g => { if(g.code===code) kto.push([p.n, g]); }));
  const METALLY = [['med','1 раз'],['bronza','2–3'],['serebro','4–6'],['zoloto','7–11'],['platina','12–23'],['brilliant','24+']];
  let h = `<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:.75rem">
      <div style="display:flex;gap:12px;align-items:center;min-width:0">${achStatU({code,n:1,stup:0},84)}
      <div><div style="font-size:18px;font-weight:700">${esc(k.nm)}</div>
      <div style="font-size:12px;color:var(--muted)">${k.anti?'антикубок':'награда'} · ${k.pogoda?'ставит и снимает программа':(k.anti?'вручается руками на срок':'программа, автоматически')}${k.skoro?' · скоро':''}</div></div></div>
      <button class="btn bsm" id="uch-ach-ord-zakryt" onclick="this.closest('.ov').remove()">✕</button></div>
    <div style="background:var(--s2);border-radius:var(--r);padding:10px 12px;margin-bottom:1rem">${achOpisU(code,null)}
      ${k.rost==='chislo'?`<div style="font-size:12.5px;color:var(--muted);margin-top:4px">Металл растёт с числом наград.</div>`:''}
      ${k.rost==='stupen'?`<div style="font-size:12.5px;color:var(--muted);margin-top:4px">Металл закреплён за ступенью.</div>`:''}</div>`;
  if(k.rost==='chislo'){
    h += `<div class="ct">Как растёт металл</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:6px;margin-bottom:1rem">`
      + METALLY.map(m => `<div style="text-align:center"><img src="${ACH_STAT+code+'__'+m[0]+'.webp'}" alt="" loading="lazy"
          style="width:64px;height:64px;object-fit:contain;border-radius:8px;background:#fff;border:1px solid var(--border)" onerror="this.style.visibility='hidden'">
        <div style="font-size:11px;line-height:1.2">${esc(ACH_METALL_U[m[0]])}</div>
        <div style="font-size:10.5px;color:var(--muted)">${m[1]}</div></div>`).join('') + `</div>`;
  }
  if(k.rost==='stupen'){
    h += `<div class="ct">Ступени</div><div class="tw-wrap"><table><tr><th>Ступень</th><th>У кого</th></tr>`
      + k.lest.map((nm,j) => { const u = kto.filter(([, g]) => g.stup===j).map(([n]) => n);
          return `<tr><td style="white-space:nowrap">${achStatU({code,stup:j},36)} ${esc(nm)}
            <div style="font-size:11px;color:var(--muted)">${esc(ACH_METALL_U[k.met_lest[j]]||'')}</div></td>
            <td>${u.length?esc(u.join(', ')):'<span style="color:var(--muted)">—</span>'}</td></tr>`; }).join('')
      + `</table></div>${k.beskonechno?`<div class="rnote">${esc(k.beskonechno)}</div>`:''}`;
  }
  if(k.skoro) h += `<div class="alert ai" style="display:block">Награда ещё не запущена — в списке она стоит с пометкой «скоро».</div>`;
  h += `<div class="ct" style="margin-top:1rem">Кто получил${kto.length?' ('+kto.length+')':''}</div>`;
  h += kto.length
    ? kto.map(([imya,g]) => `<div style="display:flex;gap:10px;align-items:center;padding:8px;border:1px solid var(--border);border-radius:var(--rs);margin-bottom:6px">
        ${achStatU(g,34)}<span style="min-width:0"><span style="display:block;font-weight:600">${esc(imya)}</span>
        <span style="display:block;font-size:12px">${esc(g.za)}</span>
        <span style="display:block;font-size:11px;color:var(--muted)">${esc(g.den||'')}</span></span></div>`).join('')
    : `<div style="color:var(--muted)">Пока никто. Можно стать первым.</div>`;
  const ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'uch-ach-ord'; ov.style.zIndex = 110;
  ov.innerHTML = `<div class="ovc" style="max-width:600px">${h}</div>`;
  document.body.appendChild(ov);
  tr.sobytie('act:achorden');
};

// ── «Вручить» — только у главного администратора ──
// Антикубок всегда на срок: бессрочных не бывает, максимум 30 дней.
let _achVrKomu = 0, _achVrCode = 'x_kosyak', _achVrSrok = 7, _achVrPostavlen = false;
const ACH_VRUCHIT_U = ['x_kosyak','x_girya','x_zerkalo','x_muha','x_kopilka','x_kaktus','x_grabli','m_prodavec','p_plan100'];
window.uchAchVruchitHtml = function(){
  const anti = !!ACH_KAT_U[_achVrCode].anti;
  if(_achVrPostavlen) return `<div class="card" style="max-width:640px"><div class="ct">🎁 Вручить</div>
    <div class="alert as" style="display:block">✓ Антикубок «${esc(ACH_KAT_U[_achVrCode].st)}» поставлен ${esc(ACH_U[_achVrKomu].n)} на ${_achVrSrok} дн.
      Он встанет на «Пыльную полку», а по сроку уйдёт сам. Снять раньше — «Отозвать» в окне антикубка; кнопка есть у владельца и у главного администратора, снятое рукой обнуляет счёт: вернётся только за новые нарушения после снятия. Всё, что выдаёт программа, сначала приходит владельцу на утверждение — карточкой в телеграм и блоком «На утверждении» в «Ленте»; до утверждения награду никто не видит.</div></div>`;
  return `<div class="card" style="max-width:640px"><div class="ct">🎁 Вручить</div>
    <div class="fg"><label class="fl">Кому</label><select class="fc" id="uch-ach-komu" onchange="uchAchVrPole('komu',this.value)">
      ${ACH_U.map((p,i)=>`<option value="${i}" ${i===_achVrKomu?'selected':''}>${esc(p.n)}</option>`).join('')}</select></div>
    <div class="fg"><label class="fl">Награда</label><select class="fc" id="uch-ach-nagrada" onchange="uchAchVrPole('code',this.value)">
      ${ACH_VRUCHIT_U.map(c=>`<option value="${c}" ${c===_achVrCode?'selected':''}>${ACH_KAT_U[c].anti?'Антикубок · ':''}${esc(ACH_KAT_U[c].st)}</option>`).join('')}</select></div>
    ${anti?`<div class="fg"><label class="fl">На какой срок (дней)</label>
      <select class="fc" id="uch-ach-srok" onchange="uchAchVrPole('srok',this.value)">
        ${[7,14,30,3,1].map(d=>`<option value="${d}" ${d===_achVrSrok?'selected':''}>${d}</option>`).join('')}</select></div>
      <div class="rnote">Бессрочных антикубков не бывает: максимум 30 дней. «Дырявый зонт» и «Громоотвод» ставит и снимает
        сама программа ночью по погоде антирейтинга — их вручать руками не нужно.</div>`:''}
    <button class="btn bp bbl" id="uch-ach-postavit" onclick="uchAchPostavit()">${anti?'Поставить антикубок':'Вручить награду'}</button>
    <div class="rnote">В архиве черновиков рядом с «Утвердить все» и «Удалить отмеченные» есть «✅ Утвердить отмеченные».
      В окне ордена вы, в отличие от остальных, видите и черновики — иначе до утверждения ступени стоят пустыми.</div></div>`;
};
window.uchAchVrPole = function(pole,v){
  if(pole==='komu') _achVrKomu = +v;
  if(pole==='code') _achVrCode = v;
  if(pole==='srok') _achVrSrok = +v;
  pgAchivki();
};
window.uchAchPostavit = function(){
  const k = ACH_KAT_U[_achVrCode], imya = ACH_U[_achVrKomu].n;
  const vopros = k.anti ? `Поставить антикубок «${esc(k.st)}» на ${_achVrSrok} дней — ${esc(imya)}?`
    : `Вручить «${esc(k.st)}» — ${esc(imya)}?`;
  const ov = document.createElement('div'); ov.className = 'ov'; ov.style.zIndex = 110;
  ov.innerHTML = `<div class="ovc" style="max-width:420px"><div style="margin-bottom:1rem">${vopros}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn bp tr-tyk" id="uch-ach-vr-da" onclick="uchAchVruchil(this)">Да, поставить</button>
      <button class="btn" onclick="this.closest('.ov').remove()">Отмена</button></div></div>`;
  document.body.appendChild(ov);
  if(window.tr && tr.podsvetit) tr.podsvetit();
};
window.uchAchVruchil = function(b){
  b.closest('.ov').remove(); _achVrPostavlen = true;
  tr.sobytie('act:achvruchit'); pgAchivki();
};

// ── экраны, которые в обучении показываем без данных ──
const infoPage = (fn, title, txt) => {
  window[fn] = function(){
    nav(fn); setTitle(title); setBadge('');
    setContent('<div class="card" style="max-width:640px"><div class="ct">'+esc(title)+'</div><p>'+esc(txt)+'</p>'
      +'<div class="alert ai" style="display:block">В обучении этот экран без данных — в программе здесь живые цифры.</div></div>');
  };
};
infoPage('pgDash2', 'Дашборд', 'Цифры магазина за месяц в одном экране.');
infoPage('pgVisits', 'Посещения', 'Динамика трафика: сколько посетителей было по дням. Управляющий видит только свой магазин.');
infoPage('pgReportHist', 'История отчётов', 'Отчёты магазинов по дням. Пропущенные дни видны сразу: отчёт, которого нет, — это тоже факт.');
infoPage('pgOtchetyOfisa', 'Отчёты офиса', 'Ежедневные отчёты офисных должностей по дням: кто сдал, кто нет, и текст. Досданный за вчера отчёт ждёт вашего решения — «Засчитать день» или «Не засчитывать».');
// Как в боевой 2026-10-06 · 6: «Задержки» без пункта меню, на их месте «Подтверждения».
infoPage('pgDelays', 'Задержки', 'Продажи подтверждают и отчёт отправляют день в день, крайний срок — утро следующего. Здесь видно, кто не успел.');
// Как в боевой 2026-10-08 · 2: конструктор зарплаты — единственный расчёт.
infoPage('pgKonstruktor', 'Конструктор ЗП', 'Из чего складывается зарплата. Должность — это оклад, то, как считаются смены, и роль в программе: у своей должности кнопка «🔐 Доступы» задаёт меню и права. '
  +'С октября среди показателей — «Продажи без скидки» (1С) и «Выдача заказов интернет-магазина» (новая группа «Сайт»). '
  +'KPI — правило над показателем из 1С, Битрикса или программы: процент, ступени, бонус за условие, сумма за единицу, коэффициент или формула. '
  +'Один KPI крепится к нескольким должностям и людям; у каждого KPI видно, где он участвует, у каждого показателя — в каких KPI. '
  +'Кнопка «Проба» показывает, что KPI дал бы людям за прошлый месяц, ничего не сохраняя. Менять может только главный администратор, '
  +'правка действует с выбранного месяца. Всё начисление считает только конструктор; июнь–август 2026 — архив прежнего расчёта.');
infoPage('pgSellerHist', 'История продавцов', 'История работы продавцов магазина.');
// Как в боевой · 34: очередь из 1С и Битрикса, решение одно на обе записи. После
// «Добавить / Прикрепить / Игнорировать» строка уходит на месте, счётчик уменьшается,
// страница целиком не перерисовывается. Нашёлся похожий среди заведённых —
// подсказка «💡 Похоже, уже есть у нас» и главной становится «Прикрепить».
const istU = (t,c) => `<span class="tag" style="background:${c==='g'?'var(--gl)':'var(--bl)'};color:${c==='g'?'var(--green)':'var(--bd)'};font-size:10.5px">${t}</span>`;
let _novZhdut = null, _novRazobrano = [];
const NOV_U = [
  {id:0, imya:'<b>Жумабаева Айгерим</b> '+istU('1С','g')+'<div>Айгерим Жумабаева '+istU('Битрикс','b')+'</div>',
   podpis:'Продавец-кассир · отдел «Магазин Республика» · из 1С — Республика', prodazhi:1240000, kratko:'Жумабаева Айгерим'},
  {id:1, imya:'<b>Ахметова Алия</b> '+istU('Битрикс','b'),
   podpis:'Продавец-кассир · отдел «Магазин Манаса»', prodazhi:0, kratko:'Ахметова Алия',
   pohozh:'Ахметова Алия · связан с Битриксом'},
  {id:2, imya:'<b>Ким Сергей</b> '+istU('Битрикс','b'), podpis:'Водитель · отдел «Склад»', prodazhi:0, kratko:'Ким Сергей'},
];
window.pgQueue = function(){
  if(_novZhdut===null) _novZhdut = NOV_U.map(x=>x.id);
  nav('pgQueue'); setTitle('Новые сотрудники'); setBadge('');
  const sel = (id,opts) => `<select class="fc" id="${id}" style="min-width:120px">${opts.map(o=>`<option>${o}</option>`).join('')}</select>`;
  const stroka = p => {
    const glav = p.pohozh ? 'pri' : 'dob';
    const kn = (k,nm) => `<button class="btn bsm ${glav===k?'bp':''}" id="uch-nov-${k==='dob'?'dobavit':k==='pri'?'prikrepit':'ignor'}-${p.id}" onclick="uchNovReshit(${p.id},'${k}')">${nm}</button>`;
    return `<tr id="uch-nov-str-${p.id}">
      <td>${p.imya}<div style="font-size:11.5px;color:var(--muted)">${esc(p.podpis)}</div>
        ${p.pohozh?`<div id="uch-nov-podskazka-${p.id}" style="font-size:12px;margin-top:3px">💡 Похоже, уже есть у нас: ${esc(p.pohozh)} — нажмите «Прикрепить»</div>`:''}</td>
      <td>${p.prodazhi?fmt(p.prodazhi):'—'}</td>
      <td>${sel('uch-nov-rol-'+p.id,['Продавец-кассир','Раннер','Стример'])}</td>
      <td>${sel('uch-nov-mag-'+p.id,['Республика','Манаса','Асфендиярова'])}</td>
      <td>${sel('uch-nov-est-'+p.id, p.pohozh?['Ахметова Алия','— нет —']:['— нет —','Ахметова Алия'])}</td>
      <td style="white-space:nowrap">${kn('dob','Добавить')} ${kn('pri','Прикрепить')} ${kn('ign','Игнорировать')}</td></tr>`;
  };
  setContent(`<div class="card"><div class="ct" id="uch-nov-schet">Ждут решения — ${_novZhdut.length}</div>
    <p style="margin:0 0 .6rem">Сюда приходят все, кого программа ещё не знает: из 1С — сама каждые 15 минут, из Битрикса —
      каждую ночь и по кнопке внизу. Если человек есть и там, и там, — это одна строка с двумя именами.</p>
    <div id="uch-nov-itog"></div>
    <div class="tw-wrap"><table><tr><th>Кто</th><th>Продажи за 30 дней</th><th>Роль у нас</th><th>Магазин у нас</th><th>Уже заведён у нас</th><th></th></tr>
      ${NOV_U.filter(p=>_novZhdut.indexOf(p.id)>=0).map(stroka).join('')}</table></div>
    <div class="rnote">Добавить — создать карточку с паролем 1234 и связать обе записи. Прикрепить — связать с тем, кто уже заведён.
      Игнорировать — спрятать служебные учётки. О каждом новом человеке бот пишет в чат отчётов магазинов со ссылкой сюда.</div>
    <button class="btn" style="margin-top:.6rem">🔄 Обновить из Битрикса</button></div>
  <div class="card"><div class="ct">Уже разобраны</div><div class="tw-wrap"><table id="uch-nov-razobrany">
    <tr><th>Кто</th><th>Решение</th><th>Кто решил</th></tr>
    ${_novRazobrano.join('')}
    <tr><td>Серикова Дана ${istU('1С','g')} ${istU('Битрикс','b')}</td><td>связан → Серикова Дана</td><td>автоматически</td></tr>
    <tr><td>admin1 ${istU('Битрикс','b')}</td><td>игнорируется</td><td>вы</td></tr></table></div>
    <div class="rnote">«Автоматически» — программа узнала человека по фамилии и имени сама.</div></div>`);
};
window.uchNovReshit = function(id,k){
  const p = NOV_U.find(x=>x.id===id);
  _novZhdut = _novZhdut.filter(x=>x!==id);
  const str = document.getElementById('uch-nov-str-'+id); if(str) str.remove();
  document.getElementById('uch-nov-schet').textContent = 'Ждут решения — '+_novZhdut.length;
  const reshenie = k==='dob' ? 'добавлен' : k==='pri' ? 'связан → '+(p.pohozh||p.kratko).split(' · ')[0] : 'игнорируется';
  const row = `<tr><td>${esc(p.kratko)}</td><td>${esc(reshenie)}</td><td>вы</td></tr>`;
  _novRazobrano.unshift(row);
  const tb = document.getElementById('uch-nov-razobrany');
  if(tb) tb.rows[0].insertAdjacentHTML('afterend', row);
  document.getElementById('uch-nov-itog').innerHTML = `<div class="alert as" style="display:block">✓ ${k==='dob'
    ? 'Карточка создана, пароль 1234. Связаны сразу и 1С, и вход из Битрикса.'
    : k==='pri' ? 'Прикреплено к заведённой карточке — вход из Битрикса у человека заработает.' : 'Спрятано из очереди.'}</div>`;
  tr.sobytie(k==='pri' ? 'act:novye-pri' : 'act:novye');
};

// ── «Что нового» ──
const CHANGELOG_U = [
  {d:'3 ноября 2026', items:[
    'Вкладка «Жалобы» у управляющего и администратора: жалобы клиентов, подарок к жалобе, заявка директору по развитию, поручение продавцу, итог у клиента и «Учёт подарков». У продавца на главной - блок «Сервис для клиента».',
    'У главного администратора - вкладка «Аттестация»: пояса продавцов и аттестации раз в три месяца.',
    'Склад: полная смена - 9 часов с обедом (10:00-19:00), время сверх 9 часов оплачивается по той же ставке. Кладовщик и заведующий складом сдают «Отчёт за день», без него «Ушёл» не нажимается.']},
  {d:'15 октября 2026', items:[
    'Программа больше не завершает день сама: не нажали «Ушёл» - день не засчитывается в зарплату. Исправить его можно до 09:00 следующего дня (штрафной балл), дальше - только руководитель.']},
  {d:'22 сентября 2026', items:[
    'Новые сотрудники из Битрикса приходят в ту же очередь, что из 1С: одна карточка на человека с пометками источников. «Добавить» или «Прикрепить» связывает сразу и 1С, и вход из Битрикса. Пункт меню «Новые из 1С» стал «Новые сотрудники».',
    'Режим просмотра для администратора: кнопка 👁 у сотрудника показывает программу его глазами, только чтение. Сверху красная плашка и «Вернуться к себе».',
    'Повременные (раннер, кладовщик, зав. складом): оплачивается фактическое время, и меньше нормы, и больше — 10 часов дают 10/8 ставки.',
    'Достижения: у антикубка за поведение видно, по какой день он простоит без новых нарушений.',
    'Страница «Что нового» — вы на ней. Открывается из меню и по щелчку на версии программы.']},
  {d:'21 сентября 2026', items:[
    'Антирейтинг: отчёт магазина считается сданным вовремя до 09:00 следующего утра.']},
  {d:'20 сентября 2026', items:[
    'Достижения: карточка сотрудника со статуэтками, награда на весь экран, «Поделиться наградой», настоящий стаж в профиле, «Ордена».',
    'Достижения: антикубки — «пыльная полка», срок при выдаче; архив с кнопкой «Утвердить отмеченные».']},
];
window.pgChangelog = function(){
  nav('pgChangelog'); setTitle('Что нового'); setBadge('');
  setContent(`<div class="card"><div class="ct">Версия ${esc(VERSIYA_BOEVOY)}</div>
    <div style="font-size:12.5px;color:var(--muted)">Программа обновляется сама: если на экране версия старее, закройте вкладку и откройте заново.</div></div>`
    + CHANGELOG_U.map(v => `<div class="card"><div class="ct">${esc(v.d)}</div>
      <ul style="margin:0;padding-left:1.2rem;font-size:13.5px;line-height:1.5">${v.items.map(x=>`<li style="margin:.25rem 0">${esc(x)}</li>`).join('')}</ul></div>`).join('')
    + `<div class="rnote">В обучении список короче — в программе здесь вся история изменений по датам.</div>`);
};
infoPage('pgLogins', 'Входы в программу', 'Кто и когда входил в программу.');
infoPage('pgKassa', 'Касса', 'Кассовые смены, которые ждут вашего подтверждения, и история всех кассовых смен.');

// ── сводка управляющего ──
window.pgReport = function(){
  nav('pgReport'); setTitle('Сводка по продавцам'); setBadge('');
  const rows = [
    ['Абдуолимов Абдуллах', 4118000, 4350000, 236700, false],
    ['Уркинбаева Аиша',     3240000, 4350000, 268400, false],
    ['Жумагул Молдыр',       318000, 4350000,      0, true],
  ];
  setContent(`
  <div class="card"><div class="ct">План / Факт по магазинам</div>
    <div class="tw-wrap"><table>
      <tr><th>Магазин</th><th>Консультанты</th><th>Итого факт</th><th>План</th><th>%</th><th>Прогноз</th></tr>
      <tr><td><b>Алматы</b></td><td>${fmtN(7676000)}</td><td><b>${fmtN(14820000)}</b></td>
        <td>${fmtN(28000000)}</td><td style="color:var(--amber);font-weight:700">53%</td>
        <td><b>${fmtN(26400000)}</b><div style="font-size:11px;color:var(--amber);font-weight:700">94%</div></td></tr>
    </table></div>
  </div>
  <div class="card"><div class="ct">${esc(MAG)}</div>
    <div class="tw-wrap"><table>
      <tr><th>Продавец</th><th>Продажи</th><th>План</th><th>%</th><th>Прогноз ЗП</th><th>Смен</th></tr>
      ${rows.map(r=>{const p=Math.round(r[1]/r[2]*100);return `<tr${r[4]?' style="background:var(--al)"':''}>
        <td>${esc(r[0])}${r[4]?' <span class="tag tw">2 дн. ждут подтверждения</span>':''}</td>
        <td>${fmtN(r[1])}</td><td>${fmtN(r[2])}</td>
        <td style="font-weight:700;color:${p>=100?'var(--green)':'var(--amber)'}">${p}%</td>
        <td>${r[3]?fmtN(r[3]):'—'}</td><td>${r[4]?2:12}</td></tr>`}).join('')}
    </table></div>
    <div class="rnote">Жёлтым — те, у кого есть неподтверждённые дни. Пока продавец их
      не подтвердил, эти продажи в зарплату не идут, и в конце месяца спросят с вас.</div>
  </div>`);
};

// ── подтверждения смен по кнопке (как в боевой 2026-10-06 · 6) ──
// Одна спорная смена раннера; решение в обучении ничего не сохраняет.
let _podtvSmena = '';
const PODTV_ZHDYOT = () => _podtvSmena ? 0 : 1;
window.uchPodtv = function(chto){ _podtvSmena = chto; tr.sobytie('act:podtv'); pgPodtverzhdeniya(); };
window.pgPodtverzhdeniya = function(){
  nav('pgPodtverzhdeniya'); setTitle('Подтверждения'); setBadge('');
  let h = '<div class="card"><div class="ct">⏳ Ждут решения: ' + PODTV_ZHDYOT() + '</div>'
    + '<div style="font-size:12.5px;color:var(--muted)">Смены по кнопке «Пришёл/Ушёл», которые правили, добавили задним числом '
    + 'или закрыла программа. Пока смена не решена, она идёт в зарплату по записанному времени. '
    + 'Уже подтверждённую смену можно поправить в графике — нажать на день.</div></div>';
  if(_podtvSmena){
    h += '<div class="card" style="color:var(--muted)">Всё решено 👍<div style="font-size:12.5px;margin-top:.4rem">'
      + 'Раннер Ерлан, 12 сентября — ' + esc(_podtvSmena) + '. В программе решение сразу попадает в журнал и в зарплату.</div></div>';
  } else {
    h += '<div class="card" style="border-left:4px solid var(--amber)">'
      + '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>Раннер Ерлан</b>'
      + '<span style="color:var(--muted);font-size:13px">Алматы · 12 сентября, сб</span></div>'
      + '<div style="font-size:13px;margin:.35rem 0">🕒 Правка времени</div>'
      + '<div style="font-size:13px;color:var(--muted)">По кнопке: <s>10:30 – 17:00</s></div>'
      + '<div style="font-size:14px">Стало: <b>09:00 – 18:00</b> · 9:00</div>'
      + '<div style="font-size:12px;color:var(--muted)">Исправил(а): Раннер Ерлан</div>'
      + '<div style="font-size:12px;color:var(--muted)">💬 Пришёл раньше, забыл нажать «Пришёл»</div>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:.6rem">'
      + '<button class="btn bsm bp" id="uch-podtv-ok" onclick="uchPodtv(\'день засчитан как 09:00 – 18:00\')">✅ Подтвердить</button>'
      + '<button class="btn bsm" onclick="uchPodtv(\'вернули время по кнопке: 10:30 – 17:00\')">↩️ Отклонить</button>'
      + '<button class="btn bsm" onclick="uchPodtv(\'время указали вы — в программе откроется окно, где вписываются приход и уход\')">✏️ Указать время</button>'
      + '<button class="btn bsm bd2" style="margin-left:auto" onclick="uchPodtv(\'день не засчитан\')">Не засчитать</button>'
      + '</div></div>';
  }
  h += '<div class="rnote">Здесь собраны два случая: правка времени (сотрудник поправил приход или уход, в том числе указал время ухода за незавершённый день) '
    + 'и смена, добавленная задним числом. Программа день сама не завершает: не нажали «Ушёл» - день не засчитан, пока человек не исправит его до 09:00 следующего дня '
    + '(со штрафным баллом), и тогда правка приходит сюда. «↩️ Отклонить» есть только у правки: возвращает время по кнопке. '
    + 'Управляющий видит свою точку, администратор - все.</div>';
  setContent(h);
};

// ══ ЖАЛОБЫ КЛИЕНТОВ И УЧЁТ ПОДАРКОВ (как в боевой 2026-11-03 · 3) ══════════════
// Вкладка «Жалобы» у управляющего и администратора, окна «Записать подарок» и «Жалоба клиента»,
// блок «Сервис для клиента» на дашборде продавца. Данные выдуманные, ничего не сохраняется.
// Права кнопок повторяют боевую программу (srvMozhno); там последнее слово всё равно за сервером.
const ZH_MAGAZINY = ['Республика','Асфендиярова','Манаса','Алматы','Караганда'];
const ZH_VIDY = {kompliment:'Комплимент', bonusy:'Бонусы', remont:'Ремонт или химчистка за наш счёт', dostavka:'Доставка за наш счёт',
  skidka_brak:'Скидка за брак', obmen:'Обмен', vozvrat:'Возврат денег', prochee:'Прочее'};
const ZH_PODSKAZKA = {kompliment:'Например: шоколадка', bonusy:'Например: бонусы на карту', remont:'Например: химчистка пуховика',
  dostavka:'Например: доставка курьером', skidka_brak:'Например: скидка на куртку с дефектом', obmen:'Например: обмен на другой размер',
  vozvrat:'Например: возврат за платье', prochee:'Например: подарочный пакет'};
// Аптечка сервиса: код решения -> [подпись, кто вправе дать].
const ZH_RESHENIYA = {
  izvinenie:['Извинение','prodavec'], kompliment:['Комплимент на кассе','prodavec'], otvet:['Ответили и разъяснили','prodavec'],
  obmen14:['Обмен в 14 дней','prodavec'], vozvrat14:['Возврат денег в 14 дней','prodavec'], brak14:['Брак до 14 дней: замена или деньги','prodavec'],
  brak_pozzhe:['Брак после 14 дней','upravlyayushchiy'], obmen30:['Обмен качественной вещи 15-30 дней','upravlyayushchiy'],
  bonusy:['Бонусы','upravlyayushchiy'], skidka_brak:['Скидка за брак','prodavec'], dostavka_remont:['Бесплатная доставка или ремонт','upravlyayushchiy'],
  drugoe:['Другое','upravlyayushchiy'], dengi:['Деньги вне закона, крупная сумма','admin']};
const ZH_STATUS = {novyy:'новый', v_rabote:'в работе', zhdet_soglasovaniya:'ждёт согласования', reshen:'решён', zakryt:'закрыт отказом', ne_zhaloba:'не жалоба'};
const ZH_TEG = {novyy:'td', v_rabote:'tw', zhdet_soglasovaniya:'tw', reshen:'ts', zakryt:'ti', ne_zhaloba:'ti'};
const ZH_FILTRY = {otkr:'Открытые', novyy:'Новые', v_rabote:'В работе', zhdet_soglasovaniya:'Ждут согласования', reshen:'Решены',
  zakryt:'Закрыты отказом', ne_zhaloba:'Не жалоба', vse:'Все'};
const ZH_DEYSTVIYA = {sozdan:'заведён', antireiting:'решение в антирейтинге', vzyal:'взял', zayavka:'заявка на согласование', soglasovat:'согласовал', otklonitZayavku:'заявка отклонена',
  otkazat:'отказ', reshen:'решено', naRazbor:'на разбор', dovolen:'итог у клиента', neZhaloba:'не жалоба', poruchit:'поручил', podarok:'подарок'};
const ZH_OTKRYTYE = ['novyy','v_rabote','zhdet_soglasovaniya'];
const ZH_POTOLOK = {bonusy:3000, remont:5000};
const zhGr = v => v === 'dostavka' ? 'remont' : v;

let _zh = null;
function zhSostoyanie(){
  if(_zh && _zh.rol === CU.role) return _zh;
  const sl = (id, st, uroven, dney, kogda, tekst, o) => Object.assign({id, status:st, uroven, dney, kogda, magazin:MAG, tekst,
    istochnik:'В магазине', tema:'Обслуживание в магазине', klient:'', kontakt:'', sozdal:'Уркинбаева Аиша', vzyal:'', podarki:[],
    reshenie:'', reshenieTekst:'', prichina:'', zayavka:null, poruchenie:null, dovolen:'', razbor:false, dialog:false, sozdalYa:false,
    zhaloba:false, ar:null, deystviya:[[kogda, 'Уркинбаева Аиша', 'sozdan']]}, o || {});
  _zh = {rol:CU.role, vkl:'sluchai', status:'otkr', mag:'', dney:30, nextId:42, forma:null, pod:null, dir:null,
    uf:{ot:'2026-09-01', do:'2026-09-12', mag:''},
    sluchai:[
      sl(41,'novyy',1,0,'сегодня 11:20','Клиентка ждала на кассе 15 минут и ушла без покупки. Просит извиниться.',
        {klient:'Анна', kontakt:'77011234567'}),
      sl(40,'v_rabote',2,1,'вчера 18:05','Заказ с эфира ждали четыре дня. Клиентка просит компенсацию бонусами 5 000 ₸.',
        {tema:'Заказ онлайн и с эфира', istochnik:'WhatsApp-бот', klient:'Динара', kontakt:'https://instagram.com/dinara_k', sozdal:'бот',
         vzyal:'Порываев Руслан', dialog:true, zhaloba:true, ar:'podtverzhdena',
         deystviya:[['вчера 18:40','Порываев Руслан','vzyal'], ['вчера 18:10','Главный администратор','antireiting'], ['вчера 18:05','бот','sozdan']]}),
      sl(39,'zhdet_soglasovaniya',2,2,'2 дня назад','Пуховик: шов разошёлся через 20 дней после покупки. Клиент просит замену.',
        {tema:'Брак и качество', klient:'Ержан', kontakt:'77025554433', vzyal:'Порываев Руслан',
         zayavka:{reshenie:'Брак после 14 дней', summa:0, opis:'замена на такой же размер', kto:'Порываев Руслан', rukovoditel:true},
         deystviya:[['2 дня назад','Порываев Руслан','zayavka'], ['2 дня назад','Порываев Руслан','vzyal'], ['2 дня назад','Уркинбаева Аиша','sozdan']]}),
      sl(38,'reshen',1,3,'3 дня назад','Платье: молния разошлась после первой носки.',
        {tema:'Брак и качество', klient:'Айгерим', kontakt:'77073334455', vzyal:'Порываев Руслан', reshenie:'Обмен в 14 дней',
         reshenieTekst:'обмен на такой же размер',
         podarki:[{vid:'kompliment', summa:0, kolvo:1, procent:0, chto:'шоколадка', kto:'Порываев Руслан', kogda:'3 дня назад', den:'2026-09-09'}],
         deystviya:[['3 дня назад','Порываев Руслан','reshen'], ['3 дня назад','Порываев Руслан','vzyal'], ['3 дня назад','Уркинбаева Аиша','sozdan']]}),
      sl(36,'novyy',2,4,'4 дня назад','Отзыв в 2ГИС: консультанта пришлось ждать 20 минут, ушла без покупки.',
        {tema:'Обслуживание в магазине', istochnik:'2ГИС', klient:'Отзыв в 2ГИС', sozdal:'бот', dialog:true, zhaloba:true, ar:'zhdet',
         deystviya:[['4 дня назад','бот','sozdan']]}),
      sl(37,'reshen',1,9,'9 дней назад','Курьер привёз заказ с опозданием на день.',
        {tema:'Заказ онлайн и с эфира', klient:'Мария', kontakt:'77015556677', vzyal:'Порываев Руслан', reshenie:'Бонусы', dovolen:'da',
         podarki:[{vid:'bonusy', summa:2500, kolvo:0, procent:0, chto:'бонусы на карту', kto:'Порываев Руслан', kogda:'3 сентября', den:'2026-09-03'}],
         deystviya:[['3 сентября','Порываев Руслан','dovolen'], ['3 сентября','Порываев Руслан','reshen'], ['3 сентября','Уркинбаева Аиша','sozdan']]}),
    ]};
  return _zh;
}
function zhNaiti(id){ return zhSostoyanie().sluchai.find(s => s.id === id) || null; }
function zhZapis(s, chto){ s.deystviya.unshift(['только что', CU.name, chto]); }
function zhSkolko(o){
  const ch = [];
  if(+o.summa > 0) ch.push('<span>' + esc(fmt(o.summa)) + '</span>');
  if(+o.kolvo > 0) ch.push('<span>' + (+o.kolvo) + ' шт.</span>');
  if(+o.procent > 0) ch.push('<span>' + (+o.procent) + ' %</span>');
  return ch.join(', ');
}
function zhKontakt(k){
  k = String(k || '');
  if(/^\d{10,15}$/.test(k)) return '<a href="#" onclick="zhToast(\'В программе здесь открывается WhatsApp клиента\');return false" style="color:var(--bd)">💬 +' + k + '</a>';
  const m = /^https:\/\/instagram\.com\/([A-Za-z0-9._]+)$/.exec(k);
  return m ? '<a href="#" onclick="zhToast(\'В программе здесь открывается Instagram клиента\');return false" style="color:var(--bd)">📷 @' + esc(m[1]) + '</a>' : '';
}
function zhPodarokTekst(g){
  const sk = zhSkolko(g);
  return '<span>' + esc(ZH_VIDY[g.vid] || g.vid) + '</span>' + (sk ? ', ' + sk : '') + (g.chto ? ' - ' + esc(g.chto) : '')
    + (g.odobreno ? ', <span>одобрено в чате «Ручные скидки»</span>' : '') + ' · ' + esc(g.kto || '') + ' · ' + esc(g.kogda || '');
}
function zhToast(t){
  let el = document.getElementById('app-toast');
  if(!el){
    el = document.createElement('div'); el.id = 'app-toast';
    el.style.cssText = 'position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:220;'
      + 'max-width:88vw;padding:12px 16px;border-radius:12px;font-size:14px;box-shadow:0 6px 24px rgba(0,0,0,.25);white-space:pre-line;'
      + 'text-align:center;color:#fff;background:#1f2a37';
    document.body.appendChild(el);
  }
  el.textContent = t; el.style.display = 'block';
  clearTimeout(el._t); el._t = setTimeout(() => { el.style.display = 'none'; }, 2600);
}
function zhOshibka(id, t){ const el = document.getElementById(id); if(el) el.innerHTML = '<div class="alert ae" style="display:block;margin:8px 0 0">' + esc(t) + '</div>'; }
function zhOkno(html){
  zhOknoZakryt();
  const ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'zh-ov';
  ov.innerHTML = '<div class="ovc" style="max-width:520px">' + html + '</div>';
  ov.addEventListener('click', e => { if(e.target === ov) zhOknoZakryt(); });
  document.body.appendChild(ov);
  tr.podsvetit();
  return ov;
}
window.zhOknoZakryt = function(){ const o = document.getElementById('zh-ov'); if(o) o.remove(); };
function zhObnovit(){
  if(_page === 'pgZhaloby') pgZhaloby(); else if(_page === 'pgDash') pgDash();
}

// Можно ли показать кнопку (зеркало srvMozhno боевой программы).
function zhMozhno(s, chto){
  const adm = CU.role === 'admin', upr = CU.role === 'manager', st = s.status;
  // Жалоба ждёт решения директора: сначала оно (3.11.2026).
  if(chto === 'arPodtverdit') return adm && s.zhaloba && s.ar === 'zhdet';
  if(s.ar === 'zhdet' && ['vzyal','reshen','otkazat','zayavka','podarok'].indexOf(chto) >= 0) return false;
  if(chto === 'neZhaloba' && !adm && s.ar === 'podtverzhdena') return false;
  if(chto === 'poruchit') return (adm || upr) && st === 'reshen' && !!s.magazin && !(s.poruchenie && s.poruchenie.vypolneno);
  if(chto === 'dovolen') return (adm || upr) && (st === 'reshen' || st === 'zakryt') && !s.dovolen;
  if(chto === 'naRazbor') return adm || upr;
  if(chto === 'podarok') return st !== 'ne_zhaloba' && (adm || s.uroven !== 3);
  if(['reshen','zakryt','ne_zhaloba'].indexOf(st) >= 0) return false;
  if(!adm && s.uroven === 3 && ['reshen','otkazat','soglasovat','neZhaloba','otklonitZayavku'].indexOf(chto) >= 0) return false;
  // Заявку руководителя согласует только директор по развитию.
  if(upr && (chto === 'soglasovat' || chto === 'otklonitZayavku') && s.zayavka && s.zayavka.rukovoditel) return false;
  switch(chto){
    case 'vzyal': return st === 'novyy';
    case 'reshen': return st === 'v_rabote' || st === 'novyy';
    case 'zayavka': return !adm && st !== 'zhdet_soglasovaniya' && (st === 'v_rabote' || !upr);
    case 'soglasovat': case 'otklonitZayavku': return st === 'zhdet_soglasovaniya';
    case 'otkazat': return st === 'v_rabote' || st === 'novyy';
    case 'neZhaloba': return st === 'novyy' || (adm && st === 'v_rabote' && s.zhaloba);
  }
  return false;
}

window.pgZhaloby = function(){
  nav('pgZhaloby'); setTitle('Жалобы'); setBadge('');
  const z = zhSostoyanie();
  const kn = 'flex:1 1 160px;min-height:44px;justify-content:center';
  const vk = (k, t, id) => '<button class="btn' + (z.vkl === k ? ' bp' : '') + '" id="' + id + '" style="flex:1 1 120px;justify-content:center;min-height:40px" onclick="uchZhVkl(\'' + k + '\')">' + t + '</button>';
  setContent('<div style="max-width:820px">'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">'
    + '<button class="btn bp" id="uch-zh-top-podarok" style="' + kn + '" onclick="uchZhPodarok()">🎁 Записать подарок</button>'
    + '<button class="btn" id="uch-zh-top-zhaloba" style="' + kn + '" onclick="uchZhZhaloba()">＋ Жалоба клиента</button></div>'
    + '<div style="display:flex;gap:6px;margin-bottom:12px">' + vk('sluchai', 'Случаи', 'uch-zh-vk-sluchai') + vk('uchet', 'Учёт подарков', 'uch-zh-vk-uchet') + '</div>'
    + (z.vkl === 'uchet' ? zhUchetHtml(z) : zhSluchaiHtml(z)) + '</div>');
};
window.uchZhVkl = function(k){ zhSostoyanie().vkl = k; if(k === 'uchet') tr.sobytie('act:zh-uchet'); pgZhaloby(); };
window.uchZhFiltr = function(k, v){ zhSostoyanie()[k] = v; pgZhaloby(); };

function zhSluchaiHtml(z){
  // Жалоба бота или 2ГИС, которую директор по развитию ещё не подтвердил, управляющему не видна.
  const vse = z.sluchai.filter(s => s.dney <= z.dney && (CU.role === 'admin' || s.ar !== 'zhdet'));
  const spisok = vse.filter(s => (z.status === 'vse' || (z.status === 'otkr' ? ZH_OTKRYTYE.indexOf(s.status) >= 0 : s.status === z.status))
    && (!z.mag || (z.mag === '-' ? !s.magazin : s.magazin === z.mag)));
  const mags = [...new Set(vse.map(s => s.magazin).filter(Boolean))].sort();
  const sel = (id, opts, val, on) => '<select id="' + id + '" class="fc" style="flex:1 1 150px;width:auto;font-size:16px" onchange="' + on + '">'
    + opts.map(([v, t]) => '<option value="' + esc(v) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select>';
  const novyh = vse.filter(s => s.status === 'novyy').length, zhdut = vse.filter(s => s.status === 'zhdet_soglasovaniya').length;
  let h = '<div class="card" style="padding:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">'
    + sel('uch-zh-f-st', Object.entries(ZH_FILTRY), z.status, "uchZhFiltr('status',this.value)")
    + sel('uch-zh-f-mag', [['', 'Все магазины'], ...mags.map(m => [m, m]), ['-', 'Без магазина']], z.mag, "uchZhFiltr('mag',this.value)")
    + sel('uch-zh-f-dn', [[7, 'За 7 дней'], [30, 'За 30 дней'], [90, 'За 90 дней']], z.dney, "uchZhFiltr('dney',+this.value)")
    + '<div style="flex:1 1 100%;font-size:13px;color:var(--muted)">'
    + '<span>Показано:</span> <b>' + spisok.length + '</b> · <span>новых:</span> <b>' + novyh + '</b> · <span>ждут согласования:</span> <b>' + zhdut + '</b></div></div>';
  h += spisok.length ? spisok.map(zhKartochka).join('') : '<div class="card" style="color:var(--muted)">Таких случаев нет.</div>';
  h += '<div class="rnote"><span>Уровень 1 - решить на месте; уровень 2 - ответить клиенту сегодня, решить до 24 часов; уровень 3 - решает директор по развитию.</span> '
    + '<span>Жалобы из WhatsApp-бота и 2ГИС приходят сюда сами. Директор по развитию подтверждает их здесь же: баллы ставит антирейтинг, а управляющий видит жалобу после подтверждения.</span> '
    + '<span>Закрытые жалобы в фильтре «Открытые» не видны: выберите «Решены», «Закрыты отказом» или «Все».</span></div>';
  return h;
}

function zhKartochka(s){
  const i = s.id, z = zhSostoyanie();
  const cvet = s.uroven >= 3 ? 'var(--red)' : s.uroven === 2 ? 'var(--amber)' : 'var(--border)';
  const ryad = (lbl, val) => val ? '<div class="zpr" style="gap:10px"><span>' + lbl + '</span><span style="color:var(--text);text-align:right;overflow-wrap:anywhere">' + val + '</span></div>' : '';
  let h = '<details class="card" open style="padding:0;margin-bottom:10px;border-left:4px solid ' + cvet + '">'
    + '<summary style="cursor:pointer;padding:12px;min-height:52px;display:block;list-style:none">'
    + '<span style="display:inline-flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:13px">'
    + '<b>№' + i + '</b><span class="tag ' + (ZH_TEG[s.status] || 'ti') + '">' + esc(ZH_STATUS[s.status] || s.status) + '</span>'
    + '<span class="tag ti"><span>Уровень</span> ' + (+s.uroven || 1) + '</span>'
    + (s.razbor ? '<span class="tag tw">На разбор</span>' : '')
    + (s.zhaloba && s.status === 'novyy' && s.ar === 'zhdet' ? '<span class="tag tw">ждёт вашего решения</span>' : '')
    + (s.zhaloba && s.ar === 'podtverzhdena' ? '<span class="tag ti">подтверждена</span>' : '')
    + '<span style="color:var(--muted)">' + esc(s.kogda) + '</span>'
    + '<span style="color:var(--muted)">' + esc(s.magazin || 'без магазина') + '</span></span>'
    + '<div style="margin-top:4px;font-size:14px;overflow-wrap:anywhere;white-space:pre-wrap">' + esc(s.tekst) + '</div>'
    + '</summary><div style="padding:0 12px 12px">';
  h += ryad('Тема', esc(s.tema))
    + ryad('Откуда', '<span>' + esc(s.istochnik) + '</span>')
    + ryad('Клиент', esc(s.klient))
    + ryad('Контакт', zhKontakt(s.kontakt))
    + ryad('Завёл', esc(s.sozdal))
    + ryad('Взял', esc(s.vzyal))
    + ryad('Решение', s.reshenie ? '<span>' + esc(s.reshenie) + '</span>' + (s.reshenieTekst ? ' - ' + esc(s.reshenieTekst) : '') : '')
    + s.podarki.map(g => ryad('Подарок', zhPodarokTekst(g))).join('')
    + ryad('Причина', esc(s.prichina))
    + ryad('Поручено', s.poruchenie ? esc(s.poruchenie.komu) + ' - ' + esc(s.poruchenie.chto) : '')
    + ryad('Исполнение', s.poruchenie ? (s.poruchenie.vypolneno ? '<span>выполнено</span>' : '<span>ждёт исполнения</span>') : '')
    + ryad('Итог у клиента', s.dovolen === 'da' ? 'доволен' : s.dovolen === 'net' ? 'недоволен' : '')
    + '<div style="margin:8px 0"><button class="btn" style="min-height:44px" onclick="zhToast(\'В обучении фото не загружаем\')">＋ <span>Добавить фото</span></button></div>';
  if(s.status === 'zhdet_soglasovaniya' && s.zayavka){
    const q = s.zayavka, sk = zhSkolko({summa:q.summa});
    h += '<div class="alert ai" style="display:block;margin:8px 0 0"><b>Заявка на согласование</b>: <span>' + esc(q.reshenie) + '</span>'
      + (sk ? ', ' + sk : '') + (q.opis ? ' - ' + esc(q.opis) : '') + ' · ' + esc(q.kto) + '</div>';
  }
  if(s.dialog) h += '<button class="btn bsm" style="margin-top:8px;min-height:36px" onclick="zhToast(\'В программе здесь открывается диалог клиента с ботом\')">💬 Открыть диалог</button>';
  h += zhKnopki(s);
  if(z.forma && z.forma.id === i) h += zhFormaHtml(s, z.forma.chto);
  h += '<div style="margin-top:10px;font-size:12px;color:var(--muted)">'
    + s.deystviya.slice(0, 5).map(d => '<div>' + esc(d[0]) + ' · ' + esc(d[1]) + ' · <span>' + esc(ZH_DEYSTVIYA[d[2]] || d[2]) + '</span></div>').join('') + '</div>';
  return h + '</div></details>';
}

function zhKnopki(s){
  const i = s.id, b = [];
  const kn = (t, on, cls, id) => '<button class="btn bsm' + (cls ? ' ' + cls : '') + '"' + (id ? ' id="' + id + '"' : '') + ' style="min-height:40px" onclick="' + on + '">' + t + '</button>';
  if(zhMozhno(s, 'arPodtverdit')) b.push(kn('✓ Подтвердить, баллы', 'uchZhArPodtverdit(' + i + ')', 'bp', `uch-zh-ar-${i}`));
  if(zhMozhno(s, 'vzyal')) b.push(kn('✋ Взял', 'uchZhVzyal(' + i + ')', 'bp', `uch-zh-vzyal-${i}`));
  if(zhMozhno(s, 'reshen')) b.push(kn('✓ Решено', "uchZhForma(" + i + ",'reshen')", 'bp', `uch-zh-reshit-${i}`));
  if(zhMozhno(s, 'podarok')) b.push(kn('🎁 Записать подарок', 'uchZhPodarok(' + i + ')', '', `uch-zh-podarok-${i}`));
  if(zhMozhno(s, 'soglasovat')) b.push(kn('Согласовать', "uchZhDeystvie(" + i + ",'soglasovat')", 'bp', `uch-zh-soglasovat-${i}`));
  if(zhMozhno(s, 'otklonitZayavku')) b.push(kn('Отклонить заявку', "uchZhDeystvie(" + i + ",'otklonitZayavku')", 'bd2', `uch-zh-otklonit-${i}`));
  if(zhMozhno(s, 'zayavka')) b.push(kn('Заявка на согласование', "uchZhForma(" + i + ",'zayavka')", '', `uch-zh-zayavka-${i}`));
  if(zhMozhno(s, 'otkazat')) b.push(kn('Отказать', "uchZhForma(" + i + ",'otkazat')", 'bd2', `uch-zh-otkazat-${i}`));
  if(zhMozhno(s, 'neZhaloba')) b.push(kn('Не жалоба', "uchZhForma(" + i + ",'neZhaloba')", '', `uch-zh-nezh-${i}`));
  if(zhMozhno(s, 'poruchit')) b.push(kn(s.poruchenie ? 'Поручить другому' : 'Поручить продавцу', "uchZhForma(" + i + ",'poruchit')", '', `uch-zh-poruchit-${i}`));
  if(zhMozhno(s, 'dovolen')){
    b.push(kn('🙂 Клиент доволен', "uchZhDovolen(" + i + ",'da')", '', `uch-zh-dovolen-${i}`));
    b.push(kn('Недоволен', "uchZhDovolen(" + i + ",'net')", '', `uch-zh-nedovolen-${i}`));
  }
  if(zhMozhno(s, 'naRazbor')) b.push(kn(s.razbor ? 'Снять с разбора' : 'На разбор', "uchZhRazbor(" + i + ")"));
  return b.length ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">' + b.join('') + '</div>' + zhPodskazka(s) : '';
}
// Что нажать, чтобы закрыть жалобу (тексты как в боевой программе).
function zhPodskazka(s){
  const adm = CU.role === 'admin', st = s.status;
  let t = '';
  if(s.ar === 'zhdet') t = 'Жалоба ждёт вашего решения: «Подтвердить, баллы» - баллы поставятся, жалоба уйдёт управляющему; «Не жалоба» - баллов не будет, жалоба закроется.';
  else if(st === 'novyy' || st === 'v_rabote'){
    if(!adm && s.uroven === 3) t = 'Уровень 3 решает директор по развитию: нажмите «Взял» и отправьте ему заявку.';
    else t = zhMozhno(s, 'neZhaloba') && st === 'novyy'
      ? 'Закрыть жалобу: «Решено» - клиенту помогли; «Отказать» - отказали, с причиной; «Не жалоба» - это не жалоба. «На разбор» жалобу не закрывает: это метка для месячного разбора.'
      : 'Закрыть жалобу: «Решено» - клиенту помогли; «Отказать» - отказали, с причиной. «На разбор» жалобу не закрывает: это метка для месячного разбора.';
  } else if(st === 'zhdet_soglasovaniya') t = 'Жалоба ждёт решения по заявке. После согласования она вернётся в работу, и её можно будет закрыть.';
  else if((st === 'reshen' || st === 'zakryt') && !s.dovolen) t = 'Жалоба закрыта. Через 2 дня спросите клиента и отметьте итог: «Клиент доволен» или «Недоволен».';
  return t ? '<div class="rnote" style="margin-top:6px">' + t + '</div>' : '';
}

// ── кнопки без формы ──
window.uchZhVzyal = function(id){
  const s = zhNaiti(id); if(!s) return;
  s.status = 'v_rabote'; s.vzyal = CU.name; zhZapis(s, 'vzyal');
  zhToast('Записано'); tr.sobytie('act:zh-vzyal'); pgZhaloby();
};
// Подтверждение жалобы бота или 2ГИС: баллы ставит антирейтинг, жалоба уходит управляющему.
window.uchZhArPodtverdit = function(id){
  zhOkno('<div class="ct" style="margin-bottom:.6rem">Подтвердить жалобу?</div>'
    + '<p style="margin:0 0 1rem">Подтвердить жалобу? Баллы поставятся сразу.</p>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
    + '<button class="btn bp" id="uch-zh-da" style="flex:1 1 140px;min-height:44px;justify-content:center" onclick="uchZhArDa(' + id + ')">Да</button>'
    + '<button class="btn" style="flex:0 1 110px;min-height:44px;justify-content:center" onclick="zhOknoZakryt()">Отмена</button></div>');
};
window.uchZhArDa = function(id){
  const s = zhNaiti(id); if(!s) return;
  s.ar = 'podtverzhdena'; zhZapis(s, 'antireiting');
  zhOknoZakryt(); zhToast('Подтверждено: баллы поставлены'); tr.sobytie('act:zh-arpodtv'); pgZhaloby();
};
window.uchZhDovolen = function(id, v){
  const s = zhNaiti(id); if(!s) return;
  s.dovolen = v; zhZapis(s, 'dovolen');
  zhToast('Записано'); tr.sobytie('act:zh-dovolen'); pgZhaloby();
};
window.uchZhRazbor = function(id){
  const s = zhNaiti(id); if(!s) return;
  s.razbor = !s.razbor; zhZapis(s, 'naRazbor');
  zhToast('Записано'); pgZhaloby();
};
// «Согласовать» и «Отклонить заявку» переспрашивают, как в боевой.
window.uchZhDeystvie = function(id, chto){
  const soglas = chto === 'soglasovat';
  zhOkno('<div class="ct" style="margin-bottom:.6rem">' + (soglas ? 'Согласовать заявку?' : 'Отклонить заявку?') + '</div>'
    + '<p style="margin:0 0 1rem">' + (soglas ? 'Согласовать заявку по случаю №' + id + '? После согласования отметьте решение.'
      : 'Отклонить заявку по случаю №' + id + '? Случай вернётся в работу.') + '</p>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
    + '<button class="btn bp" id="uch-zh-da" style="flex:1 1 140px;min-height:44px;justify-content:center" onclick="uchZhPodtverdit(' + id + ',\'' + chto + '\')">Да</button>'
    + '<button class="btn" style="flex:0 1 110px;min-height:44px;justify-content:center" onclick="zhOknoZakryt()">Отмена</button></div>');
};
window.uchZhPodtverdit = function(id, chto){
  const s = zhNaiti(id); if(!s) return;
  s.status = 'v_rabote'; zhZapis(s, chto);
  zhOknoZakryt(); zhToast('Записано');
  if(chto === 'soglasovat') tr.sobytie('act:zh-soglasoval');
  pgZhaloby();
};

// ── формы внутри карточки: решено, заявка, отказ, не жалоба, поручить ──
window.uchZhForma = function(id, chto){ const z = zhSostoyanie(); z.forma = {id, chto}; pgZhaloby(); };
window.uchZhFormaOtmena = function(){ zhSostoyanie().forma = null; pgZhaloby(); };
function zhSkidkaOdobrenie(id){
  if(CU.role === 'admin') return '';
  return '<label style="display:flex;gap:8px;align-items:flex-start;font-size:14px;margin:2px 0 10px;cursor:pointer">'
    + '<input type="checkbox" id="' + id + '" style="width:20px;height:20px;flex:none"><span>Одобрено в чате «Ручные скидки»</span></label>'
    + '<div class="rnote" style="margin:-4px 0 10px">До 20 % - сразу. 21-50 % - только после одобрения в чате, больше 50 % не бывает. Дефект записать в чек.</div>';
}
function zhPolya(kod){
  const pole = (id, lbl, ph, val) => '<div class="fg" style="flex:1 1 120px"><label class="fl">' + lbl + '</label><input id="' + id
    + '" type="number" inputmode="numeric" min="0" class="fc" style="font-size:16px" placeholder="' + ph + '"' + (val != null ? ' value="' + val + '"' : '') + '></div>';
  let h = '<div style="display:flex;gap:8px;flex-wrap:wrap">';
  if(kod === 'dostavka_remont') h += '<div class="fg" style="flex:1 1 180px"><label class="fl">Что дали</label><select id="uch-zh-vid" class="fc" style="font-size:16px">'
    + '<option value="remont">' + esc(ZH_VIDY.remont) + '</option><option value="dostavka">' + esc(ZH_VIDY.dostavka) + '</option></select></div>';
  if(kod === 'bonusy' || kod === 'dostavka_remont') h += pole('uch-zh-summa', 'Сумма, ₸', '0');
  else if(kod === 'vozvrat14' || kod === 'dengi') h += pole('uch-zh-summa', 'Сумма, ₸ (если были деньги)', '0');
  if(kod === 'skidka_brak') h += pole('uch-zh-procent', 'Скидка, %', '10');
  if(kod === 'kompliment') h += pole('uch-zh-kolvo', 'Штук', '1', 1);
  h += '</div>' + (kod === 'skidka_brak' ? zhSkidkaOdobrenie('uch-zh-odobr') : '')
    + '<div class="fg"><label class="fl">' + (kod === 'drugoe' ? 'Опишите решение' : 'Комментарий (необязательно)')
    + '</label><textarea id="uch-zh-tekst" class="fc" rows="2" style="font-size:16px;font-family:inherit" placeholder="Например: шоколадка, обмен на размер M"></textarea></div>';
  return h;
}
window.zhReshVybor = function(){
  const el = document.getElementById('uch-zh-polya'), r = document.getElementById('uch-zh-r');
  if(el && r) el.innerHTML = zhPolya(r.value);
  const m = document.getElementById('uch-zh-msg'); if(m) m.innerHTML = '';
};
function zhFormaHtml(s, chto){
  const i = s.id, adm = CU.role === 'admin';
  const kn = (txt, idb) => '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">'
    + '<button class="btn bp" id="' + idb + '" style="flex:1 1 160px;min-height:44px;justify-content:center" onclick="uchZhOtpravit(' + i + ',\'' + chto + '\')">' + txt + '</button>'
    + '<button class="btn" style="flex:0 1 110px;min-height:44px;justify-content:center" onclick="uchZhFormaOtmena()">Отмена</button></div><div id="uch-zh-msg"></div>';
  const tArea = (lbl, ph) => '<div class="fg"><label class="fl">' + lbl + '</label><textarea id="uch-zh-t" class="fc" rows="2" style="font-size:16px;font-family:inherit" placeholder="' + esc(ph) + '"></textarea></div>';
  let h = '<div style="border-top:1px dashed var(--border);margin-top:10px;padding-top:10px">';
  if(chto === 'reshen' || chto === 'zayavka'){
    const mozhno = Object.keys(ZH_RESHENIYA).filter(k => chto === 'zayavka' || adm || ZH_RESHENIYA[k][1] !== 'admin');
    // Подарки уже записаны - закрыть можно по ним, ничего не вписывая.
    const podarki = chto === 'reshen' ? s.podarki : [];
    if(podarki.length){
      mozhno.unshift('__podarki');
      h += '<div class="rnote" style="margin:0 0 8px"><b>Уже дали:</b> ' + podarki.map(zhPodarokTekst).join('; ') + '</div>';
    }
    const kod = mozhno[0];
    h += '<div class="fg"><label class="fl">' + (chto === 'zayavka' ? 'Что просите согласовать' : 'Решение') + '</label>'
      + '<select id="uch-zh-r" class="fc" style="font-size:16px" onchange="zhReshVybor()">'
      + mozhno.map(k => '<option value="' + k + '"' + (k === kod ? ' selected' : '') + '>' + esc(k === '__podarki' ? 'По записанным подаркам' : ZH_RESHENIYA[k][0]) + '</option>').join('') + '</select></div>'
      + '<div id="uch-zh-polya">' + zhPolya(kod) + '</div>'
      + (chto === 'zayavka' && s.podarki.length ? '<div class="rnote" style="margin:0 0 8px">Сумма - сколько добавить: уже записанные подарки прибавятся к заявке сами.</div>' : '')
      + kn(chto === 'zayavka' ? 'Отправить заявку' : 'Отметить решение', chto === 'zayavka' ? 'uch-zh-otpravit-zayavku' : 'uch-zh-otmetit');
  } else if(chto === 'otkazat'){
    h += tArea('Причина отказа', 'Например: вещь носили, ярлыков нет') + kn('Отказать клиенту', 'uch-zh-otkazat-ok');
  } else if(chto === 'neZhaloba'){
    h += tArea('Почему это не жалоба (необязательно)', 'Например: вопрос о наличии размера') + kn('Это не жалоба', 'uch-zh-nezh-ok');
  } else if(chto === 'poruchit'){
    const lyudi = USERS.filter(u => u.shop === s.magazin && ['seller','runner','manager'].indexOf(u.role) >= 0)
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    h += '<div class="fg"><label class="fl">Кому</label><select id="uch-zh-komu" class="fc" style="font-size:16px"><option value="">- выберите -</option>'
      + lyudi.map(u => '<option value="' + esc(u.name) + '">' + esc(u.name) + '</option>').join('') + '</select></div>'
      + tArea('Что сделать', 'Например: провести обмен на размер M, клиентка придёт завтра') + kn('Поручить', 'uch-zh-poruchit-ok');
  }
  return h + '</div>';
}

// Красный блок «Нужно согласование» и кнопка заявки с тем же содержимым.
function zhSoglasovanie(msgId, chto, summa, potolok){
  const el = document.getElementById(msgId); if(!el) return;
  el.innerHTML = '<div class="alert ae" style="display:block;margin:8px 0 0"><div style="font-weight:700;margin-bottom:4px">Нужно согласование директора по развитию</div>'
    + '<div>' + esc(chto) + ' на ' + esc(fmt(summa)) + ' - больше вашего потолка ' + esc(fmt(potolok)) + ' на жалобу. Решение за директором по развитию.</div></div>'
    + '<button class="btn bp" id="uch-zh-dir" style="width:100%;min-height:44px;justify-content:center;margin-top:8px" onclick="uchZhDir()">Отправить директору по развитию</button>';
  tr.podsvetit();
}
window.uchZhDir = function(){
  const z = zhSostoyanie(), d = z.dir; if(!d) return;
  let s;
  if(d.nov){
    s = zhNovyy(d.nov.tekst, d.nov.klient, 'В магазине', d.nov.magazin);
  } else s = zhNaiti(d.id);
  if(!s) return;
  s.status = 'zhdet_soglasovaniya';
  s.zayavka = {reshenie:d.reshenie, summa:d.summa, opis:d.tekst, kto:CU.name, rukovoditel:true};
  zhZapis(s, 'zayavka');
  z.dir = null; z.forma = null; z.pod = null;
  zhOknoZakryt(); zhToast('Заявка отправлена: случай №' + s.id);
  tr.sobytie('act:zh-zayavka'); zhObnovit();
};
window.uchZhOtpravit = function(id, chto){
  const z = zhSostoyanie(), s = zhNaiti(id); if(!s) return;
  const g = x => (document.getElementById(x) || {}).value || '';
  const adm = CU.role === 'admin', msg = t => zhOshibka('uch-zh-msg', t);
  const gotovo = (t) => { z.forma = null; zhToast(t); pgZhaloby(); };
  if(chto === 'reshen' || chto === 'zayavka'){
    const kod = g('uch-zh-r'), tekst = g('uch-zh-tekst').trim();
    const summa = Math.max(0, Math.round(+g('uch-zh-summa')) || 0), procent = Math.max(0, Math.round(+g('uch-zh-procent')) || 0);
    const kolvo = Math.max(0, Math.round(+g('uch-zh-kolvo')) || 0);
    const vid = kod === 'dostavka_remont' ? (g('uch-zh-vid') || 'remont') : (kod === 'bonusy' || kod === 'skidka_brak' || kod === 'kompliment') ? kod : '';
    if(kod === 'drugoe' && tekst.length < 3) return msg('Опишите решение');
    if((kod === 'bonusy' || kod === 'dostavka_remont') && !(summa > 0)) return msg('Укажите сумму компенсации');
    if(kod === 'skidka_brak'){
      if(!(procent >= 1)) return msg('Укажите процент скидки за брак');
      if(procent > 50) return msg('Больше 50 % скидку за брак не даём');
      if(!adm && procent > 20 && !(document.getElementById('uch-zh-odobr') || {}).checked) return msg('Скидка 21-50 % - только после одобрения в чате «Ручные скидки»: поставьте отметку');
    }
    const nazvanie = kod === '__podarki' ? 'По записанным подаркам' : ZH_RESHENIYA[kod][0];
    const uzhe = (vid === 'bonusy' || vid === 'remont' || vid === 'dostavka')
      ? s.podarki.filter(p => zhGr(p.vid) === zhGr(vid)).reduce((a, p) => a + (+p.summa || 0), 0) : 0;
    if(chto === 'zayavka'){
      s.status = 'zhdet_soglasovaniya';
      s.zayavka = {reshenie:nazvanie, summa:summa + uzhe, opis:tekst, kto:CU.name, rukovoditel:true};
      zhZapis(s, 'zayavka'); tr.sobytie('act:zh-zayavka');
      return gotovo('Заявка отправлена');
    }
    // Потолок управляющего считается по сумме подарков жалобы; сверх него - заявка директору на всю сумму.
    if(!adm && (vid === 'bonusy' || vid === 'remont' || vid === 'dostavka') && uzhe + summa > ZH_POTOLOK[zhGr(vid)]){
      z.dir = {id, nov:null, reshenie:nazvanie, vid, summa:uzhe + summa, tekst};
      return zhSoglasovanie('uch-zh-msg', zhGr(vid) === 'bonusy' ? 'Бонусы' : 'Ремонт, химчистка и доставка', uzhe + summa, ZH_POTOLOK[zhGr(vid)]);
    }
    s.status = 'reshen'; s.reshenie = nazvanie; s.reshenieTekst = tekst;
    if(kod !== '__podarki' && vid && (summa > 0 || kod === 'kompliment' || kod === 'skidka_brak'))
      s.podarki.push({vid, summa, kolvo:kod === 'kompliment' ? (kolvo || 1) : 0, procent, chto:tekst, odobreno:!!(document.getElementById('uch-zh-odobr') || {}).checked,
        kto:CU.name, kogda:'только что', den:'2026-09-12'});
    zhZapis(s, 'reshen'); tr.sobytie('act:zh-reshil');
    return gotovo('Записано');
  }
  if(chto === 'otkazat'){
    const t = g('uch-zh-t').trim();
    if(t.length < 3) return msg('Напишите причину отказа');
    s.status = 'zakryt'; s.prichina = t; zhZapis(s, 'otkazat');
    return gotovo('Записано');
  }
  if(chto === 'neZhaloba'){
    s.status = 'ne_zhaloba'; s.prichina = g('uch-zh-t').trim(); zhZapis(s, 'neZhaloba');
    return gotovo('Записано');
  }
  if(chto === 'poruchit'){
    const komu = g('uch-zh-komu'), t = g('uch-zh-t').trim();
    if(!komu) return msg('Выберите, кому поручить');
    if(t.length < 3) return msg('Напишите, что нужно сделать');
    s.poruchenie = {komu, chto:t, vypolneno:false}; zhZapis(s, 'poruchit'); tr.sobytie('act:zh-poruchil');
    return gotovo('Записано');
  }
};

// ── новая жалоба ──
function zhNovyy(tekst, klient, istochnik, magazin){
  const z = zhSostoyanie(), kogda = 'только что';
  const s = {id:z.nextId++, status:'novyy', uroven:1, dney:0, kogda, magazin:magazin || MAG, tekst, istochnik, tema:'Прочее',
    klient:klient || '', kontakt:'', sozdal:CU.name, vzyal:'', podarki:[], reshenie:'', reshenieTekst:'', prichina:'', zayavka:null,
    poruchenie:null, dovolen:'', razbor:false, dialog:false, sozdalYa:true, deystviya:[[kogda, CU.name, 'sozdan']]};
  z.sluchai.unshift(s);
  return s;
}
function zhMagazinPole(){
  // Магазин выбирает только директор по развитию; остальным программа ставит их магазин.
  if(CU.role !== 'admin') return '';
  return '<div class="fg"><label class="fl">Магазин</label><select id="uch-zh-mag" class="fc" style="font-size:16px"><option value="">- выберите -</option>'
    + ZH_MAGAZINY.map(m => '<option value="' + esc(m) + '">' + esc(m) + '</option>').join('') + '</select></div>';
}
window.uchZhZhaloba = function(){
  tr.sobytie('act:zh-okno');
  zhOkno('<div class="ct" style="margin-bottom:.4rem">＋ Жалоба клиента</div>'
    + '<div style="font-size:13px;color:var(--muted);margin-bottom:.8rem">Клиент недоволен - запишите, что случилось и что он просит. Дальше случай возьмёт управляющий, в Астане - директор по развитию.</div>'
    + zhMagazinPole()
    + '<div class="fg"><label class="fl">Что случилось</label><textarea id="uch-zh-j-tekst" class="fc" rows="4" style="font-size:16px;font-family:inherit" placeholder="Например: у пуховика после первой носки лезет пух, клиентка просит обмен"></textarea></div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
    + '<div class="fg" style="flex:1 1 180px"><label class="fl">Клиент - имя, телефон или Instagram</label><input id="uch-zh-j-klient" class="fc" style="font-size:16px" placeholder="Например: Анна, 87011234567"><div class="rnote">Телефон нужен, чтобы начислить бонусы.</div></div>'
    + '<div class="fg" style="flex:1 1 140px"><label class="fl">Откуда</label><select id="uch-zh-j-ist" class="fc" style="font-size:16px">'
    + '<option value="В магазине">В магазине</option><option value="Звонок">Звонок</option><option value="Другое">Другое</option></select></div></div>'
    + '<div class="fg"><label class="fl">Фото - брак, чек, вещь (необязательно)</label><button type="button" class="btn" style="min-height:44px" onclick="zhToast(\'В обучении фото не загружаем\')">＋ Добавить фото</button></div>'
    + '<div id="uch-zh-j-msg"></div>'
    + '<div style="display:flex;gap:8px;margin-top:1rem;flex-wrap:wrap">'
    + '<button class="btn bp" id="uch-zh-j-ok" style="flex:1 1 160px;min-height:44px;justify-content:center" onclick="uchZhZhalobaSohranit()">Записать жалобу</button>'
    + '<button class="btn" style="flex:0 1 120px;min-height:44px;justify-content:center" onclick="zhOknoZakryt()">Отмена</button></div>');
};
window.uchZhZhalobaSohranit = function(){
  const g = x => (document.getElementById(x) || {}).value || '';
  const mag = document.getElementById('uch-zh-mag');
  if(mag && !mag.value) return zhOshibka('uch-zh-j-msg', 'Выберите магазин');
  const tekst = g('uch-zh-j-tekst').trim();
  if(tekst.length < 5) return zhOshibka('uch-zh-j-msg', 'Опишите ситуацию своими словами');
  const s = zhNovyy(tekst, g('uch-zh-j-klient').trim(), g('uch-zh-j-ist'), mag ? mag.value : MAG);
  zhToast('Жалоба записана: случай №' + s.id); tr.sobytie('act:zh-zhaloba');
  const okno = document.querySelector('#zh-ov .ovc');
  zhObnovit();
  if(!okno) return;
  // Сначала жалоба, потом подарок: подарок сразу к ней, без повторного ввода.
  okno.innerHTML = '<div class="ct" style="margin-bottom:.4rem">✓ Жалоба записана: случай №' + s.id + '</div>'
    + '<div style="font-size:13px;color:var(--muted)">Дали клиенту что-то сразу? Запишите подарок к этой жалобе.</div>'
    + '<div style="display:flex;gap:8px;margin-top:1rem;flex-wrap:wrap">'
    + '<button class="btn bp" style="flex:1 1 160px;min-height:44px;justify-content:center" onclick="uchZhPodarok(' + s.id + ')">🎁 Добавить подарок</button>'
    + '<button class="btn" style="flex:0 1 120px;min-height:44px;justify-content:center" onclick="zhOknoZakryt()">Закрыть</button></div>';
};

// ── «Записать подарок»: всегда к жалобе - к этой, новой или существующей ──
function zhVidyPodarka(){
  if(CU.role === 'admin') return Object.keys(ZH_VIDY);
  return CU.role === 'manager' ? ['kompliment','bonusy','remont','dostavka','prochee'] : ['kompliment','prochee'];
}
window.uchZhPodarok = function(id){
  const z = zhSostoyanie(), s = id ? zhNaiti(id) : null;
  z.pod = {id:id || 0, rezhim:id ? 'k' : 'nov', vid:null, galNov:true, klient:''};
  const adm = CU.role === 'admin', upr = CU.role === 'manager';
  const podskazka = adm ? '' : '<div class="rnote" style="margin-top:6px">'
    + (upr ? '<span>Без согласования: бонусы до ' + fmt(ZH_POTOLOK.bonusy) + '; ремонт, химчистка и доставка до ' + fmt(ZH_POTOLOK.remont) + '. Больше - с согласования директора по развитию.</span> ' : '')
    + '<span>Обмен, возврат и скидку за брак по правилам сюда не записывайте - только подарок клиенту.</span></div>';
  tr.sobytie('act:zh-okno');
  zhOkno('<div class="ct" style="margin-bottom:.4rem">🎁 Записать подарок</div>'
    + (id
      ? '<div style="font-size:13px;margin-bottom:.8rem;overflow-wrap:anywhere"><b>Жалоба №' + id + '</b>' + (s ? ': ' + esc(String(s.tekst).slice(0, 160)) : '') + '</div>'
      : '<div style="font-size:13px;color:var(--muted);margin-bottom:.6rem">Подарок записывается к жалобе: создайте новую или выберите существующую.</div>'
        + '<div id="uch-zh-p-rezh" style="display:flex;gap:6px;margin-bottom:.8rem">'
        + '<button type="button" class="btn bsm bp" data-r="nov" style="flex:1 1 120px;min-height:40px;justify-content:center" onclick="uchZhPodRezhim(\'nov\')">Новая жалоба</button>'
        + '<button type="button" class="btn bsm" data-r="sush" style="flex:1 1 120px;min-height:40px;justify-content:center" onclick="uchZhPodRezhim(\'sush\')">К существующей</button></div>'
        + '<div id="uch-zh-p-nov">' + zhMagazinPole()
        + '<div class="fg"><label class="fl">Что случилось</label><textarea id="uch-zh-p-tekst" class="fc" rows="3" style="font-size:16px;font-family:inherit" placeholder="Например: клиентка ждала на кассе 10 минут"></textarea></div></div>'
        + '<div id="uch-zh-p-sush" style="display:none"></div>')
    + '<div class="fg"><label class="fl">Что дали</label><div id="uch-zh-vidy" style="display:flex;flex-wrap:wrap;gap:6px">'
    + zhVidyPodarka().map(v => '<button type="button" class="btn bsm" data-vid="' + v + '" style="min-height:40px" onclick="uchZhPodVid(\'' + v + '\')">'
      + esc(v === 'kompliment' ? 'Комплимент (шоколадка)' : ZH_VIDY[v]) + '</button>').join('')
    + '</div>' + podskazka + '</div>'
    + '<div id="uch-zh-p-polya"></div><div id="uch-zh-p-gal"></div><div id="uch-zh-p-msg"></div>'
    + '<div style="display:flex;gap:8px;margin-top:1rem;flex-wrap:wrap">'
    + '<button class="btn bp" id="uch-zh-pod-save" style="flex:1 1 160px;min-height:44px;justify-content:center" onclick="uchZhPodSohranit()">Сохранить</button>'
    + '<button class="btn" id="uch-zh-pod-otmena" style="flex:0 1 120px;min-height:44px;justify-content:center" onclick="zhOknoZakryt()">Отмена</button></div>');
  zhPodGal();
};
window.uchZhPodRezhim = function(r){
  const p = zhSostoyanie().pod; if(!p) return;
  p.rezhim = r;
  document.querySelectorAll('#uch-zh-p-rezh [data-r]').forEach(b => b.classList.toggle('bp', b.getAttribute('data-r') === r));
  const nov = document.getElementById('uch-zh-p-nov'), sush = document.getElementById('uch-zh-p-sush');
  if(nov) nov.style.display = r === 'nov' ? '' : 'none';
  if(sush) sush.style.display = r === 'sush' ? '' : 'none';
  if(r === 'sush'){
    const otkr = zhSostoyanie().sluchai.filter(s => ZH_OTKRYTYE.indexOf(s.status) >= 0 && zhMozhno(s, 'podarok'));
    sush.innerHTML = otkr.length
      ? '<div class="fg"><label class="fl">Жалоба</label><select id="uch-zh-p-sl" class="fc" style="font-size:16px" onchange="zhPodGal()"><option value="">- выберите жалобу -</option>'
        + otkr.map(s => '<option value="' + s.id + '">№' + s.id + ' · ' + esc(s.kogda) + ' · ' + esc(s.magazin || 'без магазина') + ' · ' + esc(String(s.tekst).slice(0, 70)) + '</option>').join('') + '</select></div>'
      : '<div style="font-size:13px;color:var(--muted);margin-bottom:.8rem">Открытых жалоб нет. Создайте новую.</div>';
  }
  const m = document.getElementById('uch-zh-p-msg'); if(m) m.innerHTML = '';
  zhPodGal();
};
// Галочка «Этим жалоба решена»: с нуля стоит сразу (шоколадка - одним окном), к жалобе снята.
// При снятой галочке новой жалобе нужен контакт клиента: её будут решать.
window.zhPodGal = function(){
  const el = document.getElementById('uch-zh-p-gal'), p = zhSostoyanie().pod; if(!el || !p) return;
  const kl = document.getElementById('uch-zh-p-klient');
  if(kl){ p.klient = kl.value; const g0 = document.getElementById('uch-zh-p-resh'); if(g0) p.galNov = g0.checked; }
  const vybor = document.getElementById('uch-zh-p-sl');
  const s = p.rezhim === 'k' ? zhNaiti(p.id) : p.rezhim === 'sush' && vybor && vybor.value ? zhNaiti(+vybor.value) : null;
  const vidna = p.rezhim === 'nov' || (s && (s.status === 'novyy' || s.status === 'v_rabote') && (CU.role === 'admin' || s.uroven !== 3));
  el.innerHTML = (vidna ? '<label style="display:flex;gap:8px;align-items:flex-start;font-size:14px;margin:8px 0;cursor:pointer">'
      + '<input type="checkbox" id="uch-zh-p-resh" style="width:20px;height:20px;flex:none"' + (p.rezhim === 'nov' && p.galNov ? ' checked' : '') + ' onchange="zhPodKlient()">'
      + '<span>Этим жалоба решена</span></label>' : '')
    + (p.rezhim === 'nov' ? '<div id="uch-zh-p-kl" style="display:none"><div class="fg"><label class="fl">Клиент - имя, телефон или Instagram</label>'
      + '<input id="uch-zh-p-klient" class="fc" style="font-size:16px" placeholder="Например: Анна, 87011234567" value="' + esc(p.klient || '') + '">'
      + '<div class="rnote">Телефон нужен, чтобы начислить бонусы.</div></div></div>' : '');
  zhPodKlient();
};
window.zhPodKlient = function(){
  const k = document.getElementById('uch-zh-p-kl'), g = document.getElementById('uch-zh-p-resh');
  if(k && g) k.style.display = g.checked ? 'none' : '';
};
window.uchZhPodVid = function(v){
  const z = zhSostoyanie(); z.pod.vid = v;
  document.querySelectorAll('#uch-zh-vidy [data-vid]').forEach(b => b.classList.toggle('bp', b.getAttribute('data-vid') === v));
  const adm = CU.role === 'admin';
  const pole = (id, lbl, tip, ph, val) => '<div class="fg" style="flex:1 1 140px"><label class="fl">' + lbl + '</label><input id="' + id + '" type="' + tip + '" class="fc" style="font-size:16px" '
    + (tip === 'number' ? 'inputmode="numeric" min="0" ' : '') + 'placeholder="' + esc(ph) + '"' + (val != null ? ' value="' + esc(val) + '"' : '') + '></div>';
  let h = '<div style="display:flex;gap:8px;flex-wrap:wrap">' + pole('uch-zh-p-chto', 'Что именно', 'text', ZH_PODSKAZKA[v] || '', null);
  if(['bonusy','remont','dostavka'].indexOf(v) >= 0) h += pole('uch-zh-p-summa', 'Сумма, ₸', 'number', '0', null);
  else if((v === 'prochee' && adm) || v === 'vozvrat') h += pole('uch-zh-p-summa', 'Сумма, ₸ (если были деньги)', 'number', '0', null);
  if(v === 'kompliment') h += pole('uch-zh-p-kolvo', 'Штук', 'number', '1', '1');
  if(v === 'skidka_brak') h += pole('uch-zh-p-procent', 'Скидка, %', 'number', '10', null);
  h += '</div>' + (v === 'skidka_brak' ? zhSkidkaOdobrenie('uch-zh-p-odobr') : '');
  document.getElementById('uch-zh-p-polya').innerHTML = h;
  const m = document.getElementById('uch-zh-p-msg'); if(m) m.innerHTML = '';
};
window.uchZhPodSohranit = function(){
  const z = zhSostoyanie(), p = z.pod; if(!p) return;
  const g = x => (document.getElementById(x) || {}).value || '';
  const ch = x => !!(document.getElementById(x) || {}).checked;
  const num = x => Math.max(0, Math.round(+g(x)) || 0);
  const nov = p.rezhim === 'nov', adm = CU.role === 'admin', upr = CU.role === 'manager', v = p.vid;
  const msg = t => zhOshibka('uch-zh-p-msg', t);
  const id = p.rezhim === 'k' ? p.id : p.rezhim === 'sush' ? +g('uch-zh-p-sl') : 0;
  const mag = document.getElementById('uch-zh-mag');
  if(nov && mag && !mag.value) return msg('Выберите магазин');
  const tekst = g('uch-zh-p-tekst').trim();
  if(nov && tekst.length < 5) return msg('Опишите ситуацию своими словами');
  if(!nov && !id) return msg('Выберите жалобу');
  if(!v) return msg('Выберите, что дали клиенту');
  const gift = {vid:v, chto:g('uch-zh-p-chto').trim(), summa:num('uch-zh-p-summa'), kolvo:num('uch-zh-p-kolvo'), procent:num('uch-zh-p-procent'),
    odobreno:ch('uch-zh-p-odobr'), kto:CU.name, kogda:'только что', den:'2026-09-12'};
  if(['bonusy','remont','dostavka'].indexOf(v) >= 0 && !(gift.summa > 0)) return msg('Укажите сумму компенсации');
  if(v === 'skidka_brak' && !(gift.procent >= 1 && gift.procent <= 100)) return msg('Укажите процент скидки за брак');
  if(v === 'prochee' && gift.chto.length < 3) return msg('Опишите, что дали');
  const reshena = ch('uch-zh-p-resh');
  // Потолок управляющего считается по сумме подарков жалобы; сверх него - заявка директору на всю сумму.
  if(upr && ZH_POTOLOK[zhGr(v)]){
    const s0 = id ? zhNaiti(id) : null, gr = zhGr(v);
    const uzhe = s0 ? s0.podarki.filter(x => zhGr(x.vid) === gr).reduce((a, x) => a + (+x.summa || 0), 0) : 0;
    if(uzhe + gift.summa > ZH_POTOLOK[gr]){
      z.dir = {id:id || 0, nov:nov ? {tekst, klient:g('uch-zh-p-klient').trim(), magazin:mag ? mag.value : MAG} : null,
        reshenie:ZH_RESHENIYA[gr === 'bonusy' ? 'bonusy' : 'dostavka_remont'][0], vid:v, summa:uzhe + gift.summa, tekst:gift.chto};
      return zhSoglasovanie('uch-zh-p-msg', gr === 'bonusy' ? 'Бонусы' : 'Ремонт, химчистка и доставка', uzhe + gift.summa, ZH_POTOLOK[gr]);
    }
  }
  if(v === 'skidka_brak' && gift.procent > 50) return msg('Больше 50 % скидку за брак не даём');
  if(v === 'skidka_brak' && !adm && gift.procent > 20 && !gift.odobreno) return msg('Скидка 21-50 % - только после одобрения в чате «Ручные скидки»: поставьте отметку');
  const s = nov ? zhNovyy(tekst, g('uch-zh-p-klient').trim(), 'В магазине', mag ? mag.value : MAG) : zhNaiti(id);
  if(!s) return;
  s.podarki.push(gift); zhZapis(s, 'podarok');
  if(reshena && (nov || s.status === 'novyy' || s.status === 'v_rabote')){ s.status = 'reshen'; s.reshenie = 'По записанным подаркам'; zhZapis(s, 'reshen'); }
  z.pod = null; zhOknoZakryt(); zhToast('Записано: случай №' + s.id);
  tr.sobytie('act:zh-podarok'); zhObnovit();
};

// ── Учёт подарков: что и кому подарено, итоги по видам, магазинам и людям ──
function zhUchetHtml(z){
  const adm = CU.role === 'admin', f = z.uf;
  const zap = [];
  z.sluchai.forEach(s => s.podarki.forEach(g => { if(g.den >= f.ot && g.den <= f.do && (!f.mag || s.magazin === f.mag)) zap.push({s, g}); }));
  const summa = zap.reduce((a, x) => a + (+x.g.summa || 0), 0);
  const po = kluch => { const o = {}; zap.forEach(x => { const k = kluch(x); o[k] = o[k] || {zapisey:0, summa:0, kolvo:0}; o[k].zapisey++; o[k].summa += +x.g.summa || 0; o[k].kolvo += +x.g.kolvo || 0; }); return o; };
  const blok = (zag, o, podpis) => {
    const e = Object.entries(o).sort((a, b) => (b[1].summa - a[1].summa) || (b[1].zapisey - a[1].zapisey));
    return '<div class="card" style="margin:0;padding:12px"><div class="ct" style="font-size:14px;margin-bottom:6px">' + zag + '</div>'
      + (e.length ? e.map(([k, v]) => '<div class="zpr" style="gap:10px"><span>' + esc(podpis(k)) + '</span><span style="color:var(--text);white-space:nowrap">'
        + '<span>записей</span> ' + v.zapisey + (v.summa ? ' · <span>' + esc(fmt(v.summa)) + '</span>' : '') + (v.kolvo ? ' · <span>' + v.kolvo + ' шт.</span>' : '') + '</span></div>').join('')
        : '<div style="font-size:13px;color:var(--muted)">Пусто</div>') + '</div>';
  };
  let h = '<div class="card" style="padding:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end">'
    + '<div class="fg" style="flex:1 1 140px;margin:0"><label class="fl">С</label><input id="uch-zh-u-ot" type="date" class="fc" style="font-size:16px" value="' + esc(f.ot) + '"></div>'
    + '<div class="fg" style="flex:1 1 140px;margin:0"><label class="fl">По</label><input id="uch-zh-u-do" type="date" class="fc" style="font-size:16px" value="' + esc(f.do) + '"></div>'
    + (adm ? '<div class="fg" style="flex:1 1 150px;margin:0"><label class="fl">Магазин</label><select id="uch-zh-u-mag" class="fc" style="font-size:16px"><option value="">Все магазины</option>'
      + ZH_MAGAZINY.map(m => '<option value="' + esc(m) + '"' + (f.mag === m ? ' selected' : '') + '>' + esc(m) + '</option>').join('') + '</select></div>' : '')
    + '<button class="btn bp" id="uch-zh-u-pokazat" style="min-height:44px" onclick="uchZhUchetFiltr()">Показать</button></div>'
    + '<div class="card" style="padding:12px;display:flex;gap:16px;flex-wrap:wrap;align-items:baseline">'
    + '<span><span>Записей:</span> <b style="font-size:18px">' + zap.length + '</b></span>'
    + '<span><span>Сумма:</span> <b style="font-size:18px">' + esc(fmt(summa)) + '</b></span></div>'
    + '<div class="g2" style="margin-bottom:1rem">' + blok('По видам', po(x => x.g.vid), k => ZH_VIDY[k] || k) + blok('По магазинам', po(x => x.s.magazin || 'без магазина'), k => k) + '</div>'
    + '<div style="margin-bottom:1rem">' + blok('Кто записал', po(x => x.g.kto), k => k) + '</div>';
  h += zap.length ? zap.map(x => {
    const sk = zhSkolko(x.g);
    return '<div class="card" style="padding:12px;margin-bottom:8px;cursor:pointer" onclick="uchZhUchetOtkryt(' + x.s.id + ')">'
      + '<div style="font-size:12.5px;color:var(--muted);display:flex;gap:6px;flex-wrap:wrap">'
      + '<b style="color:var(--text)">№' + x.s.id + '</b><span>' + esc(x.g.kogda) + '</span><span>' + esc(x.s.magazin || 'без магазина') + '</span><span>' + esc(x.g.kto) + '</span></div>'
      + '<div style="font-size:14px;margin-top:4px;overflow-wrap:anywhere">' + esc(String(x.s.tekst).slice(0, 300)) + '</div>'
      + '<div style="font-size:13.5px;margin-top:4px"><b>' + esc(ZH_VIDY[x.g.vid] || x.g.vid) + '</b>' + (x.g.chto ? ' - ' + esc(x.g.chto) : '') + (sk ? ' · ' + sk : '')
      + (x.s.dovolen === 'da' ? ' · <span>клиент доволен</span>' : x.s.dovolen === 'net' ? ' · <span>клиент недоволен</span>' : '') + '</div></div>';
  }).join('') : '<div class="card" style="color:var(--muted)">За этот период записей нет.</div>';
  return h;
}
window.uchZhUchetFiltr = function(){
  const z = zhSostoyanie(), g = i => (document.getElementById(i) || {}).value || '';
  z.uf = {ot:g('uch-zh-u-ot') || '2026-09-01', do:g('uch-zh-u-do') || '2026-09-12', mag:g('uch-zh-u-mag')};
  pgZhaloby();
};
// Строка учёта открывает жалобу: она может быть уже закрыта, поэтому фильтр «Все».
window.uchZhUchetOtkryt = function(id){
  const z = zhSostoyanie(); z.vkl = 'sluchai'; z.status = 'vse'; z.mag = ''; z.dney = 90; pgZhaloby();
};

// ── блок «Сервис для клиента» на дашборде продавца ──
function zhPlitka(){
  const moi = zhSostoyanie().sluchai.filter(s => s.sozdalYa), kn = 'flex:1 1 150px;min-height:44px;justify-content:center';
  const otkr = moi.filter(s => ZH_OTKRYTYE.indexOf(s.status) >= 0);
  return '<div class="card" id="srv-tile" style="max-width:520px;border-left:3px solid var(--blue)">'
    + '<div class="ct" style="margin-bottom:.6rem">🤝 Сервис для клиента</div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
    + '<button class="btn bp" id="uch-srv-podarok" style="' + kn + '" onclick="uchZhPodarok()">🎁 Записать подарок</button>'
    + '<button class="btn" id="uch-srv-zhaloba" style="' + kn + '" onclick="uchZhZhaloba()">＋ Жалоба клиента</button></div>'
    + '<div style="margin-top:10px;font-size:13px;color:var(--muted)"><span>Мои случаи за 30 дней:</span> <b>' + moi.length + '</b>'
    + (otkr.length ? ' · <span>в работе:</span> <b>' + otkr.length + '</b>' : '') + '</div></div>';
}

// ══ АТТЕСТАЦИЯ ПРОДАВЦОВ И ПОЯСА (как в боевой 2026-11-03 · 3; только главный администратор) ═══
// Упрощённо: видно, что есть на экране и что делает администратор. Данные выдуманные.
const ATT_POYASA_U = [['⚪','Белый',0],['🟡','Жёлтый',1000],['🟢','Зелёный',2000],['🟤','Коричневый',3000],['⚫','Чёрный',4000]];
const attChipU = (ic, nm) => '<span class="tag" style="white-space:nowrap">' + ic + ' ' + esc(nm) + '</span>';
const ATT_VKL_U = [['prodavcy','🥋 Продавцы и пояса'],['attestacii','📝 Аттестации'],['usloviya','📋 Условия'],['raspisanie','🗓️ Расписание и потоки'],
  ['bank','📚 Банк экзамена'],['zhurnal','📜 Журнал']];
const ATT_PROSTO_U = {
  usloviya:'Условия каждого пояса: план, чек и UPT, антирейтинг, письменный тест, устная часть, курсы - и общие нормы (чек, UPT, вопросов в тесте, смен в месяце).',
  raspisanie:'Потоки продавцов и сроки экзамена: когда он открывается, напоминание не сдавшим, письменная и устная части. От потока зависит месяц первой аттестации.',
  bank:'Вопросы письменного теста по курсам и кейсы. В экзамен идут только утверждённые кейсы.',
  zhurnal:'Журнал изменений: кто и когда менял настройки, пояса и решения по аттестации.'};
let _attVklU = 'prodavcy';
window.pgAttestaciya = function(){
  nav('pgAttestaciya'); setTitle('Аттестация'); setBadge('');
  let h = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1rem">'
    + ATT_VKL_U.map(([k, t]) => '<button class="btn bsm' + (_attVklU === k ? ' bp' : '') + '" onclick="uchAttVkl(\'' + k + '\')">' + t + '</button>').join('') + '</div>';
  if(_attVklU === 'prodavcy'){
    h += '<div class="card" style="max-width:820px"><div class="ct">Пояса и надбавка за смену</div>'
      + '<div class="tw-wrap"><table><tr><th>Пояс</th><th>Надбавка</th></tr>'
      + ATT_POYASA_U.map(p => '<tr><td>' + p[0] + ' ' + esc(p[1]) + '</td><td>' + (p[2] ? '+' + esc(fmt(p[2])) + ' к смене' : '-') + '</td></tr>').join('')
      + '</table></div><div style="font-size:12px;color:var(--muted);margin-top:8px">Надбавка попадает в расчётный лист отдельной строкой «Надбавка за … пояс» за каждую смену.'
      + ' Ставки меняются в «Конструкторе ЗП» (KPI «Надбавка за … пояс»). Пояс меняется только решением по аттестации. Показатели считаются с 1 ноября 2026 г.</div></div>'
      + '<div class="card" style="max-width:820px"><div class="ct">Продавцы: 3</div>'
      + '<div class="tw-wrap"><table><tr><th>Продавец</th><th>Магазин</th><th>ноябрь 2026 г.</th><th>с 1 декабря 2026 г.</th><th>Поток</th><th>Аттестация</th><th></th></tr>'
      + [['Уркинбаева Аиша', 1, 'февраль 2027 г.', ''], ['Абдуолимов Абдуллах', 2, 'март 2027 г.', ''], ['Жумагул Молдыр', 0, '', 'новичок: стаж 1 мес.']].map(p =>
        '<tr><td>' + esc(p[0]) + '</td><td>' + esc(MAG) + '</td><td>' + attChipU('⚪', 'Белый') + '</td><td>' + attChipU('⚪', 'Белый') + '</td>'
        + '<td>' + (p[1] || '<span style="color:var(--muted)">-</span>') + '</td>'
        + '<td style="white-space:nowrap">' + (p[2] ? esc(p[2]) : '<span style="color:var(--muted)">поток не назначен</span>')
        + (p[3] ? '<div style="font-size:11px;color:var(--muted)">' + esc(p[3]) + '</div>' : '') + '</td>'
        + '<td>' + (p[2] ? '<button class="btn bsm" onclick="zhToast(\'В обучении карточку аттестации не открываем\')">Карточка</button>' : '') + '</td></tr>').join('')
      + '</table></div><div style="font-size:12px;color:var(--muted);margin-top:8px">Поток и месяц аттестации назначаются во вкладке «Расписание и потоки».</div></div>';
  } else if(_attVklU === 'attestacii'){
    h += '<div class="card" style="max-width:820px"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px">'
      + '<b>Месяц аттестации</b><select class="fc" style="width:auto"><option>февраль 2027 г.</option></select>'
      + '<span style="font-size:12px;color:var(--muted)">Окно: ноябрь 2026 г. - январь 2027 г.</span></div>'
      + '<div class="tw-wrap"><table><tr><th>Продавец</th><th>Магазин</th><th>Пояс</th><th>Состояние</th><th>Устно</th><th></th></tr>'
      + [['Уркинбаева Аиша', attChipU('⚪', 'Белый'), '<span class="tag">заполняется</span>'],
         ['Абдуолимов Абдуллах', attChipU('🟡', 'Жёлтый'), '<span class="tag tw">ждёт решения</span> предложено: ⬆️ Новый пояс'],
         ['Карпенко Динара', attChipU('🟢', 'Зелёный'), '<span class="tag ts">решено</span> ✅ Остался на поясе']].map(p =>
        '<tr><td>' + esc(p[0]) + '</td><td>' + esc(MAG) + '</td><td>' + p[1] + '</td><td>' + p[2] + '</td><td style="font-size:12px"><span style="color:var(--muted)">-</span></td>'
        + '<td><button class="btn bsm" onclick="zhToast(\'В обучении карточку аттестации не открываем\')">Открыть</button></td></tr>').join('')
      + '</table></div></div>'
      + '<div class="rnote" style="max-width:820px">В карточке администратор вписывает свои оценки (письменный тест, кейсы, устная часть). Когда заполнено всё, программа предлагает исход - '
      + '«⬆️ Новый пояс», «✅ Остался на поясе» или «⬇️ Потерял пояс», - а вы подтверждаете или отклоняете. Отклоняете - выбираете другой пояс и пишете причину. Данные здесь учебные.</div>';
  } else {
    const t = ATT_VKL_U.find(x => x[0] === _attVklU);
    h += '<div class="card" style="max-width:820px"><div class="ct">' + t[1] + '</div><p style="margin:0">' + esc(ATT_PROSTO_U[_attVklU]) + '</p>'
      + '<div class="alert ai" style="display:block;margin-top:.75rem">В обучении эту вкладку не разбираем - в программе здесь живые данные.</div></div>';
  }
  setContent(h);
};
window.uchAttVkl = function(k){ _attVklU = k; pgAttestaciya(); };

// ── выдачи интернет-магазина (как в боевой 2026-10-06 · 10) ──
let _imPrivyazan = false;
window.uchImPrivyazat = function(){ _imPrivyazan = true; tr.sobytie('act:im-privyazal'); pgImVydachi(); };
window.pgImVydachi = function(){
  nav('pgImVydachi'); setTitle('Выдачи ИМ'); setBadge('');
  const glavny = CU.role === 'admin';
  const rows = [['Уркинбаева Аиша', 12, 486000, 24000, true], ['Жумагул Молдыр', 7, 251500, 0, true],
    ['Порываев Руслан', 2, 64000, 0, false]].concat(_imPrivyazan ? [['Абдуолимов Абдуллах', 3, 96000, 0, true]] : []);
  let h = '<div class="card"><select class="fc" style="width:auto"><option>октябрь 2026 г.</option></select></div>'
    + '<div class="card"><div class="ct">📦 Выдано заказов интернет-магазина</div>'
    + '<div style="font-size:12.5px;color:var(--muted);margin-bottom:.6rem">Данные сайта, не 1С. Продавцу — 1 % от «выдано − возвраты» '
    + 'за месяц, меньше нуля — ноль. Возврат вычитается у того, кто выдавал заказ, в месяце возврата.</div>'
    + '<div class="tw-wrap"><table><tr><th>Сотрудник</th><th>Заказов</th><th>Выдано</th><th>Возвраты</th><th>База</th><th>1 %</th></tr>'
    + rows.map((r) => { const baza = r[2] - r[3];
        return '<tr><td>' + esc(r[0]) + (r[4] ? '' : ' <span style="font-size:11px;color:var(--muted)">не продавец — без 1 %</span>') + '</td><td>' + r[1]
          + '</td><td>' + fmt(r[2]) + '</td><td>' + (r[3] ? '−' + fmt(r[3]) : '—') + '</td><td>' + fmt(baza) + '</td><td><b>'
          + (r[4] ? fmt(Math.round(baza * 0.01)) : '—') + '</b></td></tr>'; }).join('')
    + '</table></div></div>';
  if(!_imPrivyazan){
    h += '<div class="card" style="border:2px solid var(--amber)"><div class="ct">❓ Чьи выдачи? Логин сайта не сопоставлен</div>'
      + '<div style="font-size:12.5px;color:var(--muted);margin-bottom:.5rem">Пока логин не привязан к сотруднику, эти выдачи никому не начисляются.</div>'
      + '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b>almaty_kassa2</b>'
      + '<span style="color:var(--muted)">«Касса 2» · 3 заказ(ов), ' + fmt(96000) + '</span>'
      + (glavny ? '<select class="fc" style="width:auto"><option>— кто это? —</option><option selected>Абдуолимов Абдуллах</option></select>'
        + '<button class="btn bsm bp" id="uch-im-priv" onclick="uchImPrivyazat()">Привязать</button>' : '')
      + '</div>' + (glavny ? '' : '<div class="rnote">Привязывает главный администратор.</div>') + '</div>';
  }
  if(glavny) h += '<div class="card"><div class="ct">Логины сайта</div><div style="font-size:12.5px">'
    + '<div>almaty_aisha → Уркинбаева Аиша</div><div>almaty_moldir → Жумагул Молдыр</div>'
    + (_imPrivyazan ? '<div>almaty_kassa2 → Абдуолимов Абдуллах</div>' : '') + '</div></div>';
  h += '<div class="rnote">Начисление 1 % за выдачу заказов включится, когда сайт начнёт передавать боевые данные — сейчас они тестовые. '
    + (CU.role === 'manager' ? 'Вы видите только свой магазин.' : '') + '</div>';
  setContent(h);
};

// ── начисление ──
let _zakryt = false, _excel = false;
// Спорная смена в обучении: решение ничего не сохраняет, блок просто закрывается.
window.uchSpor = function(btn, chto){
  const card = btn.closest('.card');
  card.innerHTML = '<div class="ct" style="margin:0">✓ Спорных смен нет</div>'
    + '<div style="font-size:12.5px;color:var(--muted)">Раннер Ерлан, 16 сентября — ' + esc(chto)
    + '. В программе решение сразу попадает в журнал и в сумму начисления.</div>';
  card.style.border = '';
};

window.pgPayroll = function(){
  nav('pgPayroll'); setTitle('Начисление ЗП'); setBadge('');
  const r = [['Забабурина Александра',14,5223760,154,407426],
             ['Семикопенко Дарья',15,7463973,101,388559],
             ['Акишева Жанар',13,3115699,104,202628]];
  setContent(`
  <div class="alert" style="display:block;background:var(--al);color:var(--amber);font-size:13px">⚠️ Проверьте до выплаты:
    2 оплаченных дня без отметки в графике · график Караганды не подписан${PODTV_ZHDYOT() ? ' · 1 смена раннера на проверке' : ''}</div>
  ${PODTV_ZHDYOT() ? `<div class="card" style="border:2px solid var(--amber);display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
    <b>⏳ Смен по кнопке ждут подтверждения: ${PODTV_ZHDYOT()}</b>
    <button class="btn bsm bp" id="uch-podtv-otkryt" onclick="pgPodtverzhdeniya()">Открыть →</button></div>` : ''}
  <div class="card"><div class="ct">🚚 Руководитель АХО, складской и транспортной логистики — 615 000 ₸ оклад при норме 22 раб. дней, смены по графику</div>
    <div class="tw-wrap"><table>
      <tr><th>Сотрудник</th><th>Смен</th><th>Оклад</th><th>Премия</th><th>Удержания</th><th>К выплате</th><th></th></tr>
      <tr><td>Цой Владислав</td><td>21</td><td>${fmtN(587045)}</td><td>0</td><td>0</td>
        <td style="font-weight:700;color:var(--blue)">${fmtN(587045)}</td>
        <td style="white-space:nowrap">
          <button class="btn bsm" id="uch-korr-aho" onclick="uchKorr('Цой Владислав')" title="Корректировка">💵</button>
          <button class="btn bsm" id="uch-kvit-aho" onclick="uchKvitokAho()" title="Квиток">🖨️</button></td></tr>
    </table></div>
    <div class="rnote">Смены — дни, поставленные в графике склада: отмечаться руководителю не нужно, план и есть факт.</div></div>
  <div class="card"><div class="ct">🧮 Бухгалтеры — 425 540 ₸ оклад в месяц</div>
    <div class="tw-wrap"><table>
      <tr><th>Сотрудник</th><th>Оклад</th><th>Премия</th><th>Удержания</th><th>К выплате</th><th></th></tr>
      <tr><td><b>Пак Марина</b></td><td>${fmtN(425540)}</td><td>—</td><td>—</td>
        <td style="font-weight:700;color:var(--blue)">${fmtN(425540)}</td>
        <td style="white-space:nowrap">
          <button class="btn bsm" id="uch-korr-buh" onclick="uchKorr('Пак Марина',1)" title="Корректировка">💵</button>
          <button class="btn bsm" id="uch-kvit-buh" onclick="uchKvitokBuh()" title="Квиток">🖨️</button></td></tr>
    </table></div>
    <div class="rnote">Свободное посещение: ни графика, ни отметок — оклад за месяц платится целиком.
      Оклад указан с налогами: пенсионные, ИПН и ВОСМС вносятся в корректировке.</div></div>
  <div class="card"><div class="ct">🧑‍💼 HR-менеджеры — 300 000 ₸ оклад в месяц</div>
    <div class="alert ${vakSchet().zhdut?'ae':'ai'}" style="display:block;font-size:12.5px">Закрытых вакансий
      в Битриксе: <b>${vakSchet().vsego}</b>, подтверждено <b>${vakSchet().ok}</b>${
      vakSchet().net?', отклонено '+vakSchet().net:''}${
      vakSchet().zhdut?`, <b>ждут решения ${vakSchet().zhdut}</b> — в премию не идут`:''}.
      <a href="#" onclick="pgVakansii();return false">Открыть вакансии</a></div>
    <div class="tw-wrap"><table>
      <tr><th>Сотрудник</th><th>Оклад</th><th>За вакансии</th><th>Премия</th><th>Удержания</th><th>К выплате</th><th></th></tr>
      <tr><td><b>Дундукова Елена</b></td><td>${fmtN(300000)}</td>
        <td>${vakPremiya()>0?'+'+fmtN(vakPremiya()):'—'}</td><td>—</td><td>—</td>
        <td style="font-weight:700;color:var(--blue)">${fmtN(300000+vakPremiya())}</td>
        <td style="white-space:nowrap">
          <button class="btn bsm" id="uch-korr-hr" onclick="uchKorr('Дундукова Елена',1)" title="Корректировка">💵</button>
          <button class="btn bsm" id="uch-kvit-hr" onclick="uchKvitokHr()" title="Квиток">🖨️</button></td></tr>
    </table></div>
    <div class="rnote">Свободное посещение: ни графика, ни отметок — оклад за месяц платится целиком.
      Сверх оклада — 40 000 ₸ за каждую подтверждённую вакансию сверх пяти. Работает неофициально:
      налоги не удерживаются.</div></div>
  <div class="card"><div class="ct">📣 SMM-менеджеры — 200 000 ₸ оклад в месяц</div>
    <div class="tw-wrap"><table>
      <tr><th>Сотрудник</th><th>Оклад</th><th>Премия</th><th>Удержания</th><th>К выплате</th><th></th></tr>
      <tr><td><b>Санжар Бауыржан</b></td><td>${fmtN(200000)}</td><td>—</td><td>—</td>
        <td style="font-weight:700;color:var(--blue)">${fmtN(200000)}</td>
        <td style="white-space:nowrap">
          <button class="btn bsm" id="uch-korr-smm" onclick="uchKorr('Санжар Бауыржан',1)" title="Корректировка">💵</button>
          <button class="btn bsm" id="uch-kvit-smm" onclick="uchKvitokSmm()" title="Квиток">🖨️</button></td></tr>
    </table></div>
    <div class="rnote">Свободное посещение: ни графика, ни отметок — оклад за месяц платится целиком.</div></div>
  <div class="card"><div class="ct">Август · продавцы</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:.75rem">
      <button class="btn bsm" id="uch-excel" onclick="uchExcel()">📊 Экспорт в Excel</button>
      <button class="btn bsm" id="uch-zakryt" onclick="uchZakrytMesyac()" ${_zakryt?'disabled':''}>${_zakryt?'Месяц закрыт':'🔒 Закрыть месяц'}</button></div>
    ${_excel?'<div class="alert as" style="display:block">✓ Начисления выгружены в Excel (в обучении — без файла). '
      +'Удержания идут столбцом «Вычеты (журнал)»: это сумма из журнала вычетов, а не старые штрафы руками.</div>':''}
    ${_zakryt?'<div class="alert as" style="display:block">✓ Август закрыт: правки в него больше не проходят</div>':''}
    <div class="tw-wrap"><table>
      <tr><th>Продавец</th><th>Смен</th><th>Продажи</th><th>%</th><th>К выплате</th><th></th></tr>
      ${r.map((x,i)=>`<tr><td>${esc(x[0])}</td><td>${x[1]}</td><td>${fmtN(x[2])}</td>
        <td style="font-weight:700;color:var(--green)">${x[3]}%</td>
        <td style="font-weight:700;color:var(--blue)">${fmtN(x[4])}</td>
        <td style="white-space:nowrap">
          <button class="btn bsm" id="uch-korr-${i}" onclick="uchKorr('${esc(x[0])}')" title="Корректировка">💵</button>
          <button class="btn bsm" id="uch-kvit-${i}" onclick="uchKvitok('${esc(x[0])}',${x[4]},${x[1]})" title="Квиток">🖨️</button>
        </td></tr>`).join('')}
    </table></div>
    <div class="rnote">💵 — корректировка: аванс, пенсионные, ИПН, ВОСМС, штрафы, премия
      и смены руками. 🖨️ — квиток: расшифровка «из чего сложилась сумма».</div>
  </div>`);
};
window.uchKorr = function(kto, svobodnoe){
  const ov=document.createElement('div'); ov.className='ov';
  ov.innerHTML=`<div class="ovc" style="max-width:420px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <b>Корректировка — ${esc(kto)}</b>
      <button class="btn bsm" onclick="this.closest('.ov').remove()">✕</button></div>
    <div class="fr"><div class="fg"><label class="fl">Аванс</label><input class="fc" type="number" value="0"></div>
      <div class="fg"><label class="fl">Штрафы</label><input class="fc" type="number" value="0"></div></div>
    <div class="fr"><div class="fg"><label class="fl">Премия</label><input class="fc" type="number" value="0"></div>
      ${svobodnoe?'':`<div class="fg"><label class="fl">Смены (если забыл отметиться)</label><input class="fc" type="number" placeholder="как есть"></div>`}</div>
    <div class="fg"><label class="fl">Вычеты по журналу</label>
      <div style="font-size:13px;background:var(--s2);border-radius:8px;padding:8px 10px">
        За месяц: <b>60 000 ₸</b> · перенос с прошлых месяцев: <b>15 000 ₸</b> · к удержанию: <b>75 000 ₸</b></div></div>
    <div class="fg"><label class="fl">Удержать в этом месяце (пусто — всё, 75 000 ₸). Остаток перейдёт на следующий месяц</label>
      <input class="fc" type="number" id="uch-korr-vych" placeholder="75000"></div>
    <button class="btn bp bbl tr-tyk" id="uch-sohr-korr" onclick="uchSohrKorr(this)">Сохранить</button>
    <div class="rnote">${svobodnoe
      ? 'У свободного посещения смен нет вовсе: оклад за месяц платится целиком, и поля «Смен» и «Скорректированная сумма продаж» в этом окне не показываются.'
      : 'Вписанные здесь смены важнее расчётных: программа могла ошибиться, а человек — забыть отметиться.'}</div></div>`;
  document.body.appendChild(ov);
  tr.sobytie('act:korr-otkryl');
};
window.uchSohrKorr = function(b){ b.closest('.ov').remove(); tr.sobytie('act:korr'); };
window.uchExcel = function(){ _excel=true; tr.sobytie('act:excel'); pgPayroll(); };
window.uchZakrytMesyac = function(){ _zakryt=true; tr.sobytie('act:zakryl'); pgPayroll(); };
window.uchKvitok = function(kto,sum,smen){
  const ov=document.createElement('div'); ov.className='ov';
  ov.innerHTML=`<div class="ovc">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <b>Расчётный лист</b>
      <div style="display:flex;gap:8px">
        <button class="btn bp bsm">🖨️ Печать</button>
        <button class="btn bsm">📱 WhatsApp</button>
        <button class="btn bsm" onclick="this.closest('.ov').remove()">✕</button></div></div>
    <div style="border:1px solid var(--bd);border-radius:var(--rs);padding:1.25rem">
      <div style="text-align:center;margin-bottom:1rem"><div style="font-size:20px;font-weight:700">FBSM</div>
        <div style="font-size:13px;color:var(--muted)">Расчётный лист за август 2026 г.</div></div>
      <div style="font-size:13px;margin-bottom:1rem"><b>${esc(kto)}</b> · смен ${smen}</div>
      <table><tr><th>Составляющая ЗП</th><th>Сумма</th></tr>
        <!-- Как в боевой 2026-09-27 · 1: каждая ступень и бонус — своей строкой, ставка и сумма; невыполненное — нулём с причиной. -->
        <tr><td>Оклад: ${smen} смен × 6 000 ₸</td><td>${fmtN(smen*6000)}</td></tr>
        <tr><td>Гарантированный % от продаж <b>+2 %</b></td><td>+104 475</td></tr>
        <tr><td>При выполнении личного плана на 80 % <b>+1 %</b></td><td>+52 238</td></tr>
        <tr><td>При выполнении личного плана на 100 % <b>+1 %</b></td><td>+52 238</td></tr>
        <tr><td>При выполнении личного плана на 140 % <b>+2 %</b></td><td>+104 475</td></tr>
        <tr><td>Бонус за план магазина от 100 % <b>+10 000 ₸</b>
          <div style="color:var(--muted);font-size:11px">выполнение плана магазина 92,4 %</div></td><td style="color:var(--muted)">0</td></tr>
        <tr><td>Бонус за средний чек от 15 000 ₸ <b>+10 000 ₸</b>
          <div style="color:var(--muted);font-size:11px">средний чек 12 380 ₸</div></td><td style="color:var(--muted)">0</td></tr>
        <tr><td>Бонус за UPT от 2,5 <b>+10 000 ₸</b></td><td>+10 000</td></tr>
        <tr><td>Вычеты по журналу</td><td style="color:var(--red)">−60 000</td></tr>
        <tr><td colspan="2" style="font-size:11.5px;color:var(--muted)">Недостача, 20.09.2026: Акт ревизии №12 — 60 000</td></tr>
        <tr><td colspan="2" style="font-size:11.5px;color:var(--muted)">Перенос с прошлых месяцев — 15 000</td></tr>
        <tr><td colspan="2" style="font-size:11.5px;color:var(--muted)">Не удержано, перейдёт на следующий месяц — 15 000</td></tr>
        ${(CU.role==='accountant'||CU.role==='admin')?`<tr><td colspan="2" style="font-size:12px;color:var(--amber)">
          ⚠️ Вычеты больше половины начисленного. По закону (ст. 115 ТК РК) за месяц удерживают не больше 50 %:
          поставьте сумму в корректировке, остаток перейдёт дальше.</td></tr>`:''}
        <tr style="background:var(--gl)"><td><b>ИТОГО К ВЫПЛАТЕ</b></td>
          <td><b style="font-size:16px;color:var(--blue)">${fmtN(sum)}</b></td></tr></table>
    </div></div>`;
  document.body.appendChild(ov);
  tr.sobytie('act:kvitok');
};

// ── вакансии HR ──
// Как в боевой · 7: каждая закрытая вакансия решается отдельно. Карточка найма,
// перешедшая в этом месяце на «В штате», приходит сюда со стадией «ждёт решения»;
// главный администратор подтверждает или отклоняет её с комментарием, и в премию
// идут только подтверждённые. Общего числа, как было раньше, больше нет.
const VAK_OKLAD = 300000, VAK_POROG = 5, VAK_ZA = 40000;
let VAK_SPISOK = [
  {card:1207, fio:'Нургалиева Асем',   dolzh:'Продавец-кассир', fil:'Магазин — Астаны — Республика', den:'3 сентября 2026',  reshenie:'ok',  kto:'Станков Андрей', kogda:'5 сентября 2026', kom:''},
  {card:1211, fio:'Ким Виталий',       dolzh:'Продавец-кассир', fil:'Магазин — Астаны — Манаса',     den:'8 сентября 2026',  reshenie:'ok',  kto:'Станков Андрей', kogda:'9 сентября 2026', kom:''},
  {card:1216, fio:'Абенов Дархан',     dolzh:'Раннер',          fil:'Магазин — Алматы — Атакент',    den:'11 сентября 2026', reshenie:'ok',  kto:'Станков Андрей', kogda:'12 сентября 2026', kom:''},
  {card:1220, fio:'Есетова Аружан',    dolzh:'Стример',         fil:'Офис',                          den:'15 сентября 2026', reshenie:'ok',  kto:'Станков Андрей', kogda:'16 сентября 2026', kom:''},
  {card:1224, fio:'Сапаров Нурлан',    dolzh:'Кладовщик',       fil:'Склад',                         den:'19 сентября 2026', reshenie:'ok',  kto:'Станков Андрей', kogda:'20 сентября 2026', kom:''},
  {card:1229, fio:'Оспанова Дана',     dolzh:'Продавец-кассир', fil:'Магазин — Караганды — Грандстор', den:'22 сентября 2026', reshenie:'ok', kto:'Станков Андрей', kogda:'23 сентября 2026', kom:''},
  {card:1231, fio:'Мухтаров Санжар',   dolzh:'Продавец-кассир', fil:'Магазин — Астаны — Асфендиярова', den:'22 сентября 2026', reshenie:'net', kto:'Станков Андрей', kogda:'23 сентября 2026', kom:'Не вышел на второй день, карточку закрыли по ошибке'},
  {card:1234, fio:'Ибраева Камила',    dolzh:'Менеджер Интернет-магазина', fil:'Интернет-магазин',   den:'23 сентября 2026', reshenie:null, kto:'', kogda:'', kom:''},
  {card:1238, fio:'Жанибеков Алишер',  dolzh:'Продавец-кассир', fil:'Магазин — Алматы — Атакент',    den:'24 сентября 2026', reshenie:null, kto:'', kogda:'', kom:''},
];
const vakSchet = () => ({
  vsego: VAK_SPISOK.length,
  ok: VAK_SPISOK.filter(v=>v.reshenie==='ok').length,
  net: VAK_SPISOK.filter(v=>v.reshenie==='net').length,
  zhdut: VAK_SPISOK.filter(v=>!v.reshenie).length,
});
const vakPremiya = () => Math.max(0, vakSchet().ok - VAK_POROG) * VAK_ZA;
window.pgVakansii = function(){
  nav('pgVakansii'); setTitle(CU.role==='hr' ? 'Вакансии' : 'Вакансии HR'); setBadge('');
  const s = vakSchet(), mozhno = CU.role==='admin';
  setContent(`
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
      <div class="ct" style="margin:0">Закрытые вакансии</div>
      <select class="fc" style="width:auto"><option>сентябрь 2026 г.</option><option>август 2026 г.</option></select></div>
    <div class="g3" style="margin:1rem 0">
      <div class="metric"><div class="ml">В Битриксе</div><div class="mv">${s.vsego}</div></div>
      <div class="metric"><div class="ml">Подтверждено</div><div class="mv">${s.ok}${
        s.zhdut?` <span style="font-size:12px;color:var(--amber)">ждут ${s.zhdut}</span>`:''}</div></div>
      <div class="metric"><div class="ml">Премия HR</div><div class="mv">${fmtN(vakPremiya())}</div></div>
    </div>
    <div style="font-size:12.5px;color:var(--muted);margin-bottom:.75rem">Закрытая вакансия — карточка воронки найма
      впервые перешла на «В штате» в этом месяце. Оклад ${fmtN(VAK_OKLAD)} ₸ при 0–${VAK_POROG} вакансиях,
      за каждую сверх — ${fmtN(VAK_ZA)} ₸. В зарплату идут только подтверждённые.</div>
    ${VAK_SPISOK.map((v,i)=>{
      const tag = v.reshenie==='ok' ? '<span class="tag ts">подтверждена</span>'
                : v.reshenie==='net' ? '<span class="tag td">отклонена</span>'
                : '<span class="tag tw">ждёт решения</span>';
      return `<div class="card" style="margin:0 0 .6rem;padding:.8rem 1rem${v.reshenie==='net'?';opacity:.75':''}">
        <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:flex-start">
          <div><b>${esc(v.fio)}</b> ${tag}
            <div style="font-size:12.5px;color:var(--muted);margin-top:2px">${esc(v.dolzh)} · ${esc(v.fil)} · в штате с ${v.den}</div>
            <div style="font-size:12px;margin-top:2px"><a href="#" onclick="return false" style="color:var(--blue)">Карточка в Битриксе #${v.card}</a></div>
            ${v.reshenie?`<div style="font-size:12px;color:var(--muted);margin-top:4px">${esc(v.kto)}, ${v.kogda}${v.kom?': '+esc(v.kom):''}</div>`:''}
          </div>
          ${mozhno?`<div style="white-space:nowrap">
            ${v.reshenie!=='ok'?`<button class="btn bsm bp tr-tyk" id="uch-vak-ok-${i}" onclick="uchVakReshit(${i},'ok')">Подтвердить</button> `:''}
            ${v.reshenie!=='net'?`<button class="btn bsm bd2" id="uch-vak-net-${i}" onclick="uchVakReshit(${i},'net')">Отклонить</button> `:''}
            ${v.reshenie?`<button class="btn bsm" id="uch-vak-snyat-${i}" onclick="uchVakReshit(${i},null)">Снять</button>`:''}
          </div>`:''}
        </div></div>`;
    }).join('')}
  </div>`);
};
// Отклонение без причины не проходит: комментарий увидит HR-менеджер, и по нему
// человек поймёт, почему вакансию не засчитали в премию.
window.uchVakReshit = function(i, reshenie){
  if(!reshenie){ uchVakZapisat(i, null, ''); return; }
  const otkaz = reshenie === 'net';
  const ov = document.createElement('div'); ov.className = 'ov'; ov.style.zIndex = 110;
  ov.innerHTML = `<div class="ovc" style="max-width:440px">
    <b>${otkaz?'Отклонить вакансию':'Подтвердить вакансию'}</b>
    <div class="fg" style="margin-top:1rem"><label class="fl">${otkaz
      ? 'Почему не засчитываем? Комментарий обязателен — его увидит HR-менеджер.'
      : 'Комментарий — по желанию.'}</label>
      <textarea class="fc" rows="2" id="uch-vak-kom">${otkaz?'Карточку закрыли повторно':''}</textarea></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn ${otkaz?'bd2':'bp'} tr-tyk" id="uch-vak-da" onclick="uchVakDa(this,${i},'${reshenie}')">${otkaz?'Отклонить':'Подтвердить'}</button>
      <button class="btn" onclick="this.closest('.ov').remove()">Отмена</button></div>
    <div id="uch-vak-msg"></div></div>`;
  document.body.appendChild(ov);
  if(window.tr && tr.podsvetit) tr.podsvetit();
};
window.uchVakDa = function(b, i, reshenie){
  const kom = (document.getElementById('uch-vak-kom').value || '').trim();
  if(reshenie === 'net' && !kom){
    document.getElementById('uch-vak-msg').innerHTML =
      '<div class="alert ae" style="display:block;margin-top:8px">Без комментария отклонить нельзя.</div>';
    return;
  }
  b.closest('.ov').remove();
  uchVakZapisat(i, reshenie, kom);
};
window.uchVakZapisat = function(i, reshenie, kom){
  const v = VAK_SPISOK[i];
  v.reshenie = reshenie;
  v.kto = reshenie ? CU.name : '';
  v.kogda = reshenie ? '24 сентября 2026' : '';
  v.kom = reshenie ? kom : '';
  tr.sobytie(reshenie === 'ok' ? 'act:vak-podtv' : reshenie === 'net' ? 'act:vak-otklonil' : 'act:vak-snyal');
  pgVakansii();
};

// ── вычеты из зарплаты ──
// Как в боевой · 4: вычет вносится сразу нескольким (галочки и «магазин — все»),
// согласия и надписи про закон нет, журнал с основанием и автором, удаление
// с обязательной причиной — только у главного администратора.
const VYCH_VIDY = ['Удержание', 'Недостача', 'Другое'];
let _vychVybor = {}, _vychZhurnal = [
  {den:'20.09.2026', kto:'Семикопенко Дарья', mag:'Асфендиярова', vid:'Недостача', sum:60000,
   osn:'Акт ревизии №12', mes:'сентябрь 2026 г.', vnes:'Пак Марина, бухгалтер, 20.09.2026'},
  {den:'12.09.2026', kto:'Кузьмин Никита', mag:'Республика', vid:'Удержание', sum:15000,
   osn:'Разбитая витрина, служебная записка', mes:'сентябрь 2026 г.', vnes:'Станков Андрей, 12.09.2026',
   udalen:'Удалил Станков Андрей, 13.09.2026: внесли дважды'},
];
window.pgVychety = function(){
  nav('pgVychety'); setTitle('Вычеты из ЗП'); setBadge('');
  const lyudi = USERS.filter(u=>['seller','streamer','streammgr','runner'].indexOf(u.role)>=0);
  const vybrano = Object.keys(_vychVybor).filter(k=>_vychVybor[k]).length;
  const spisok = `<div style="max-height:200px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:6px 10px">
    <label style="display:flex;gap:6px;align-items:center;font-weight:600;padding:3px 0">
      <input type="checkbox" id="uch-vych-mag" onchange="uchVychVse(this.checked)"> ${esc(MAG)} — все</label>
    ${lyudi.map(u=>`<label style="display:flex;gap:6px;align-items:center;padding:3px 0 3px 16px">
      <input type="checkbox" class="uch-vych-ch" id="uch-vych-${u.id}" ${_vychVybor[u.id]?'checked':''}
        onchange="uchVychOtmetit('${u.id}',this.checked)">
      <span>${esc(u.name)}<span style="display:block;font-size:11px;color:var(--muted)">${ROLE_LABELS[u.role]}</span></span></label>`).join('')}
  </div>`;
  setContent(`
  <div class="card" style="max-width:560px"><div class="ct">Внести вычет</div>
    <div class="fg"><label class="fl">Сотрудники <span style="color:var(--muted)">— выбрано: ${vybrano}</span></label>
      <input type="text" class="fc" placeholder="найти по имени" style="margin-bottom:6px" id="uch-vych-poisk">
      ${spisok}</div>
    <div class="fr">
      <div class="fg"><label class="fl">Вид</label><select class="fc" id="uch-vych-vid">${VYCH_VIDY.map(v=>`<option>${v}</option>`).join('')}</select></div>
      <div class="fg"><label class="fl">Сумма (₸)</label><input type="number" class="fc" id="uch-vych-sum" value="2500"></div>
    </div>
    <div class="fg"><label class="fl">Дата события</label><input type="date" class="fc" value="2026-09-24"></div>
    <div class="fg"><label class="fl">Основание</label><textarea class="fc" rows="2" id="uch-vych-osn">Недостача по итогам смены, акт №14</textarea></div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:.75rem">Каждому выбранному — одинаковый вычет.
      Попадёт в зарплату за месяц события; если месяц уже закрыт — в следующий.</div>
    <button class="btn bp" id="uch-vych-vnesti" onclick="uchVychVnesti()">Внести вычет</button>
    <div id="uch-vych-msg"></div>
  </div>
  <div class="card"><div class="ct">Журнал вычетов</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;margin-bottom:1rem">
      <div><label class="fl">Месяц</label><select class="fc"><option>сентябрь 2026 г.</option><option>все</option></select></div>
      <div><label class="fl">Сотрудник</label><select class="fc"><option>все</option>${lyudi.map(u=>`<option>${esc(u.name)}</option>`).join('')}</select></div>
      <div><label class="fl">Вид</label><select class="fc"><option>все</option>${VYCH_VIDY.map(v=>`<option>${v}</option>`).join('')}</select></div>
      <label style="display:flex;gap:6px;align-items:center;font-size:13px;padding-bottom:8px">
        <input type="checkbox" checked disabled> с удалёнными</label>
    </div>
    <div style="font-size:13px;margin-bottom:.75rem">Записей: <b>${_vychZhurnal.filter(r=>!r.udalen).length}</b> ·
      сумма: <b>${fmt(_vychZhurnal.filter(r=>!r.udalen).reduce((a,r)=>a+r.sum,0))}</b>
      <span style="color:var(--muted)">(удалённых ${_vychZhurnal.filter(r=>r.udalen).length})</span></div>
    <div class="tw-wrap"><table>
      <tr><th>Дата</th><th>Сотрудник</th><th>Вид</th><th>Сумма</th><th>Основание</th><th>Удержится</th><th>Внёс</th>${CU.role==='admin'?'<th></th>':''}</tr>
      ${_vychZhurnal.map((r,i)=>`<tr${r.udalen?' style="opacity:.55;text-decoration:line-through"':''}>
        <td style="white-space:nowrap">${r.den}</td>
        <td><b>${esc(r.kto)}</b><div style="font-size:11px;color:var(--muted)">${esc(r.mag)}</div></td>
        <td>${r.vid}</td><td style="white-space:nowrap">${fmt(r.sum)}</td>
        <td>${esc(r.osn)}${r.udalen?`<div style="font-size:11px;color:var(--red);text-decoration:none">${esc(r.udalen)}</div>`:''}</td>
        <td>${r.mes}</td><td style="font-size:12px">${esc(r.vnes)}</td>
        ${CU.role==='admin'?`<td>${r.udalen?'':`<button class="btn bsm bd2" id="uch-vych-udalit-${i}" onclick="uchVychUdalit(${i})">Удалить</button>`}</td>`:''}</tr>`).join('')}
    </table></div>
    <div class="rnote">Удалить вычет может только главный администратор и только с причиной: строка остаётся зачёркнутой,
      под ней видно, кто и почему удалил. В закрытом месяце удалить нельзя.</div>
  </div>`);
};
window.uchVychOtmetit = function(id,v){ _vychVybor[id] = v; pgVychety(); };
window.uchVychVse = function(v){
  USERS.filter(u=>['seller','streamer','streammgr','runner'].indexOf(u.role)>=0).forEach(u=>{ _vychVybor[u.id] = v; });
  pgVychety();
};
window.uchVychVnesti = function(){
  const kto = USERS.filter(u=>_vychVybor[u.id]);
  if(!kto.length){ document.getElementById('uch-vych-msg').innerHTML =
    '<div class="alert ae" style="display:block;margin-top:8px">Никто не выбран: отметьте сотрудников галочками.</div>'; return; }
  const sum = +document.getElementById('uch-vych-sum').value || 0;
  const vid = document.getElementById('uch-vych-vid').value;
  const osn = document.getElementById('uch-vych-osn').value;
  const ov = document.createElement('div'); ov.className = 'ov'; ov.style.zIndex = 110;
  ov.innerHTML = `<div class="ovc" style="max-width:440px">
    <div style="margin-bottom:1rem;line-height:1.5">Внести одинаковый вычет ${kto.length} сотрудник${kto.length===1?'у':'ам'}?<br><br>
      ${esc(vid)}: <b>${fmt(sum)}</b> каждому, всего <b>${fmt(sum*kto.length)}</b><br>
      Основание: ${esc(osn)}<br><br>${kto.map(u=>esc(u.name)).join(', ')}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn bp tr-tyk" id="uch-vych-da" onclick="uchVychDa(this,${sum},'${esc(vid)}')">Да, внести</button>
      <button class="btn" onclick="this.closest('.ov').remove()">Отмена</button></div></div>`;
  document.body.appendChild(ov);
  if(window.tr && tr.podsvetit) tr.podsvetit();
};
window.uchVychDa = function(b,sum,vid){
  const kto = USERS.filter(u=>_vychVybor[u.id]);
  const osn = document.getElementById('uch-vych-osn').value;
  b.closest('.ov').remove();
  kto.forEach(u=>_vychZhurnal.unshift({den:'24.09.2026', kto:u.name, mag:CU.shop||MAG, vid, sum, osn,
    mes:'сентябрь 2026 г.', vnes:CU.name+', '+ROLE_LABELS[CU.role]+', 24.09.2026'}));
  _vychVybor = {};
  tr.sobytie('act:vychet');
  pgVychety();
  const m = document.getElementById('uch-vych-msg');
  if(m) m.innerHTML = `<div class="alert as" style="display:block;margin-top:8px">✓ Внесено ${kto.length} сотрудник${kto.length===1?'у':'ам'}.
    Удержится из зарплаты за сентябрь 2026 г.</div>`;
};
window.uchVychUdalit = function(i){
  const ov = document.createElement('div'); ov.className = 'ov'; ov.style.zIndex = 110;
  ov.innerHTML = `<div class="ovc" style="max-width:420px"><b>Удалить вычет</b>
    <div class="fg" style="margin-top:1rem"><label class="fl">Причина (обязательно)</label>
      <textarea class="fc" rows="2" id="uch-vych-prich">Внесли дважды</textarea></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn bp tr-tyk" id="uch-vych-udal-da" onclick="uchVychUdalilDa(this,${i})">Удалить</button>
      <button class="btn" onclick="this.closest('.ov').remove()">Отмена</button></div></div>`;
  document.body.appendChild(ov);
  if(window.tr && tr.podsvetit) tr.podsvetit();
};
window.uchVychUdalilDa = function(b,i){
  const prich = document.getElementById('uch-vych-prich').value || 'без причины';
  b.closest('.ov').remove();
  _vychZhurnal[i].udalen = 'Удалил '+CU.name+', 24.09.2026: '+prich;
  tr.sobytie('act:vychet-udalil');
  pgVychety();
};

// ── сотрудники ──
window.pgSellers = function(){
  nav('pgSellers'); setTitle('Сотрудники'); setBadge('');
  setContent(`
  <div class="card"><div class="ct">Сотрудники</div>
    <div class="tw-wrap"><table>
      <tr><th>Имя</th><th>Должность</th><th>Магазин</th><th></th></tr>
      ${USERS.map(u=>`<tr><td>${esc(u.name)}</td><td>${ROLE_LABELS[u.role]}</td>
        <td>${esc(u.shop)}</td>
        <td style="white-space:nowrap">${CU.role==='admin'?`<button class="btn bsm" id="uch-prosmotr-${u.id}" title="Посмотреть программу глазами сотрудника" onclick="uchProsmotr('${u.id}')">👁</button> `:''}<button class="btn bsm" id="uch-pravka-${u.id}" onclick="uchPravka('${u.id}')">✏️</button></td></tr>`).join('')}
    </table></div>
    <div class="rnote">Уволенных не удаляют, а скрывают: вместе с человеком ушла бы
      вся его история продаж и зарплат за прошлые месяцы.</div>
  </div>`);
};
window.uchPravka = function(id){
  const u = USERS.find(x=>x.id===id);
  const roli = ['seller','streamer','streammgr','runner'];
  const ov=document.createElement('div'); ov.className='ov';
  ov.innerHTML=`<div class="ovc" style="max-width:430px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <b>${esc(u.name)}</b>
      <button class="btn bsm" onclick="this.closest('.ov').remove()">✕</button></div>
    <div class="fg"><label class="fl">ФИО</label><input class="fc" value="${esc(u.name)}"></div>
    <div class="fr">
      <div class="fg"><label class="fl">Магазин</label>
        <select class="fc"><option>Алматы</option><option>Республика</option><option>Офис</option></select></div>
      <div class="fg"><label class="fl">Роль</label>
        <select class="fc" id="uch-rol">${roli.map(r=>`<option value="${r}" ${u.role===r?'selected':''}>${ROLE_LABELS[r]}</option>`).join('')}</select></div>
    </div>
    <div class="fg"><label class="fl">Новый пароль (пустым — не менять)</label>
      <input class="fc" placeholder="новый пароль"></div>
    <button class="btn bp bbl" id="uch-sohr" onclick="uchSohrCheloveka('${u.id}')">Сохранить</button>
  </div>`;
  document.body.appendChild(ov);
  tr.sobytie('act:karta');
};
window.uchSohrCheloveka = function(id){
  const u = USERS.find(x=>x.id===id);
  u.role = document.getElementById('uch-rol').value;
  document.querySelector('.ov').remove();
  tr.sobytie('act:sohranil');
  pgSellers();
};

// ── планы и параметры ──
window.pgPlans = function(){
  nav('pgPlans'); setTitle('Планы'); setBadge('');
  setContent(`
  <div class="card"><div class="ct">Планы на сентябрь</div>
    <div class="tw-wrap"><table>
      <tr><th>Магазин</th><th>План точки</th><th>Доля не продавцов</th><th>План продавцу</th></tr>
      <tr><td>Алматы</td><td>${fmtN(28000000)}</td><td>50 % — стримеры</td><td>${fmtN(4700000)}</td></tr>
      <tr><td>Караганда</td><td>${fmtN(13000000)}</td><td>25 % — эфиры и админ</td><td>${fmtN(4900000)}</td></tr>
      <tr><td>Республика</td><td>${fmtN(16000000)}</td><td>—</td><td>${fmtN(5350000)}</td></tr>
    </table></div>
    <div class="rnote">Где заметная часть продаж идёт без продавца, эта доля вычитается,
      и на продавцов делится остаток. Планы за прошлый месяц правятся, пока месяц не
      закрыт; каждое изменение пишется в журнал со старым значением.</div>
  </div>`);
};
window.pgParams = function(){
  // Как в боевой 2026-10-08 · 2: ставок старого расчёта больше нет, деньги — только
  // в «Конструкторе ЗП»; здесь общие настройки.
  nav('pgParams'); setTitle('Настройки'); setBadge('');
  setContent(`
  <div class="alert ai" style="display:block;max-width:560px;font-size:12.5px">💰 Оклады, проценты и бонусы всех должностей — в
    <a href="#" onclick="pgKonstruktor();return false">«Конструкторе ЗП»</a>. Здесь только общие настройки.</div>
  <div class="card" style="max-width:560px"><div class="ct">🕒 Смены по кнопке «Пришёл / Ушёл»</div>
    <div class="alert ai" style="display:block;margin-bottom:1rem;font-size:12.5px">Длина полной смены и шаг, с которым
      округляется отработанное время. Их же берёт «Конструктор ЗП». Незавершённый день не засчитывается: исправить можно до 09:00 следующего дня, со штрафным баллом.</div>
    <div class="fr">
      <div class="fg"><label class="fl">Часов в смене</label><input class="fc" type="number" step="0.5" value="8"></div>
      <div class="fg"><label class="fl">Шаг округления (мин)</label><input class="fc" type="number" step="5" value="15"></div>
    </div>
    <button class="btn bp bbl" id="uch-param" onclick="tr.sobytie('act:param')">Сохранить</button>
  </div>
  <div class="card" style="max-width:560px"><div class="ct">🏬 Подразделения, Telegram, учёт задержек</div>
    <div class="rnote">Список магазинов и складов, чат для отчётов и время, до которого отчёт считается вовремя, —
      ниже на этой же странице.</div></div>`);
};

// ── Режим просмотра: главный администратор смотрит программу глазами сотрудника ──
// Как в боевой · 30: подтверждение, красная плашка во всю ширину, любая запись
// отвечает «Режим просмотра», «Вернуться к себе» — без пароля.
let _prosmotr = null;
window.uchProsmotr = function(id){
  const u = USERS.find(x=>x.id===id);
  const ov = document.createElement('div'); ov.className = 'ov'; ov.style.zIndex = 110;
  ov.innerHTML = `<div class="ovc" style="max-width:440px"><div style="margin-bottom:1rem;line-height:1.5">
      Посмотреть программу глазами ${esc(u.name)}?<br><br>В этом режиме только просмотр: отметить смену,
      подтвердить продажи или закрыть кассу от его имени нельзя.</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn bp tr-tyk" id="uch-prosmotr-da" onclick="uchProsmotrDa(this,'${id}')">Да, посмотреть</button>
      <button class="btn" onclick="this.closest('.ov').remove()">Отмена</button></div></div>`;
  document.body.appendChild(ov);
  if(window.tr && tr.podsvetit) tr.podsvetit();
};
window.uchProsmotrDa = function(b,id){
  b.closest('.ov').remove();
  _prosmotr = USERS.find(x=>x.id===id);
  let pl = document.getElementById('uch-prosmotr-plashka');
  if(!pl){ pl = document.createElement('div'); pl.id = 'uch-prosmotr-plashka'; document.body.prepend(pl); }
  pl.style.cssText = 'position:sticky;top:0;z-index:95;display:flex;gap:10px;align-items:center;justify-content:space-between;'
    + 'flex-wrap:wrap;padding:8px 14px;background:var(--red);color:#fff;font-size:14px';
  pl.innerHTML = `<span>👁 Вы смотрите программу глазами: <b>${esc(_prosmotr.name)}</b> · только просмотр</span>
    <button class="btn bsm" id="uch-prosmotr-nazad" onclick="uchProsmotrNazad()">Вернуться к себе</button>`;
  nav('pgSellers'); setTitle('Дашборд · '+_prosmotr.name); setBadge('');
  setContent(`<div class="card" style="max-width:560px"><div class="ct">Так программу видит ${esc(_prosmotr.name)}</div>
    <p style="margin:0 0 .6rem">Его меню, дашборд, зарплата, график и достижения — ровно как у него.
      Попробуйте что-нибудь записать:</p>
    <button class="btn bp bbl" id="uch-prosmotr-deystvie" onclick="uchProsmotrPopytka()">✓ Подтвердить продажи</button>
    <div id="uch-prosmotr-otvet"></div>
    <div class="rnote">Режим живёт 2 часа, потом сессия истекает. Кто и на кого смотрел — пишется в журнал программы.
      Обновили страницу — плашка вернётся, но «Вернуться к себе» после обновления — это обычный выход,
      свой вход придётся ввести заново.</div></div>`);
  tr.sobytie('act:prosmotr');
};
window.uchProsmotrPopytka = function(){
  document.getElementById('uch-prosmotr-otvet').innerHTML =
    '<div class="alert ae" style="display:block;margin-top:.6rem">Режим просмотра: вы смотрите программу глазами сотрудника, действия недоступны.</div>';
};
window.uchProsmotrNazad = function(){
  _prosmotr = null;
  const pl = document.getElementById('uch-prosmotr-plashka'); if(pl) pl.remove();
  tr.sobytie('act:prosmotr-nazad');
  pgSellers();
};

// ── повременные ──
// С 15.10.2026 программа день сама не завершает: не нажали «Ушёл» - день не засчитан. Исправить можно до 09:00
// следующего дня (штрафной балл, в силу после подтверждения руководителем), дальше - только руководитель.
let _prihod = false, _uhod = false, _uhodOtkaz = false;
window.pgRunner = function(){
  nav('pgRunner'); setTitle('Смена'); setBadge('');
  const im = CU.role==='immgr'||CU.role==='streammgr', sklad = CU.role==='store' || CU.role==='whhead';
  setContent(`
  <div class="card" style="max-width:520px"><div class="ct">🕒 Сегодня · 12 сентября</div>
    ${_prihod?'<div class="alert as" style="display:block">✓ Смена начата в 09:02</div>':''}
    ${_uhod?'<div class="alert as" style="display:block">✓ Смена завершена в 18:07 · отработано 9 ч 05 мин</div>':''}
    <button class="btn bp bbl" id="uch-nachat" onclick="uchPrihod()" ${_prihod?'disabled':''}>▶ Начать смену</button>
    <button class="btn bp bbl" id="uch-zavershit" style="margin-top:.6rem" onclick="uchUhod()" ${(!_prihod||_uhod)?'disabled':''}>■ Завершить смену</button>
    ${_uhodOtkaz?`<div class="alert ae" style="display:block;margin-top:.6rem">Не удалось завершить: Сначала сдайте отчёт за 12.09 - вкладка «Отчёт за день». Без отчёта рабочий день не закрывается и не будет учтён в зарплате.</div>
      <button class="btn bp bbl" id="uch-zapolnit-otchet" onclick="pgOtchet()">📝 Заполнить отчёт</button>`:''}
    ${sdaetOtchet(CU.role)&&!_uhod?'<div class="rnote" style="color:var(--amber)">Перед завершением сдайте отчёт за день - <a href="#" onclick="pgOtchet();return false">вкладка «Отчёт за день»</a>. Без отчёта день не будет учтён в зарплате.</div>':''}
    <div class="rnote">Когда уходите - нажмите «Завершить смену». Незавершённый день не засчитывается в зарплату; исправить его можно до 09:00 следующего дня - со штрафным баллом.</div>
    <div class="rnote">${im?'Полная смена - 9 часов. Оклад считается по времени с шагом 15 минут: переработка оплачивается, короткий день считается частью. 10 часов дают 10/9 дня.'
      :sklad?'Полная смена - 9 часов с обедом (10:00-19:00). Платится отработанное время с шагом 15 минут - и меньше нормы, и больше: время сверх 9 часов оплачивается по той же ставке, 10 часов дают 10/9 ставки.'
      :'Полная смена равна смене вашего магазина: в Алматы 12 часов, в остальных магазинах 10. Платится отработанное время с шагом 15 минут - и меньше смены, и больше: при смене 10 часов 12 часов дают 12/10 ставки.'}</div>
  </div>`);
};
window.uchPrihod = function(){ _prihod=true; _uhodOtkaz=false; tr.sobytie('act:prihod'); pgRunner(); };
// Как в боевой: «Ушёл» без сданного отчёта не нажимается (склад, менеджер интернет-магазина, менеджер по эфирам).
window.uchUhod = function(){
  if(sdaetOtchet(CU.role) && !_otcU){ _uhodOtkaz=true; pgRunner(); return; }
  _uhodOtkaz=false; _uhod=true; tr.sobytie('act:uhod'); pgRunner();
};
let _pravka = false;
window.pgRunnerHist = function(){
  nav('pgRunnerHist'); setTitle('История'); setBadge('');
  // ✏️ есть только у сегодняшней смены; день без «Ушёл» (10 сентября) не засчитан, и править его может только руководитель.
  const dni = [['12 сентября (сегодня)','09:02','18:07','9 ч 05 мин', _pravka?'правка на проверке':'в расчёте'],
               ['11 сентября','09:00','17:10','8 ч 10 мин','в расчёте'],
               ['10 сентября','09:05','','-','не засчитан'],
               ['9 сентября','08:58','17:02','8 ч 04 мин','в расчёте']];
  const cvet = st => st==='в расчёте' ? 'var(--green)' : st==='не засчитан' ? 'var(--red)' : 'var(--amber)';
  setContent(`
  <div class="card" style="max-width:640px"><div class="ct">📋 История смен</div>
    <div class="tw-wrap"><table><tr><th>День</th><th>Начало</th><th>Конец</th><th>Итог</th><th></th></tr>
    ${dni.map((d,i)=>`<tr><td>${d[0]}</td><td>${d[1]}</td><td>${d[2]||'<span style="color:var(--amber)">не закрыта</span>'}</td>
      <td>${d[3]}<div style="font-size:11px;color:${cvet(d[4])}">${d[4]}</div></td>
      <td>${i===0?`<button class="btn bsm" id="uch-hist-${i}" onclick="uchPravkaSmeny('${d[0]}')" title="Поправить время">✏️</button>`:''}</td></tr>`).join('')}
    </table></div>
    ${_pravka?'<div class="alert as" style="display:block">✓ Правка отправлена управляющему на проверку</div>':''}
    <div class="rnote">Поправить время можно у сегодняшней смены: правка уйдёт управляющему на проверку. В зарплату день попадёт сразу,
      но пока не подтвердят - сумма ещё может измениться.</div>
    <div class="rnote">В смене за 10 сентября не нажато «Ушёл»: она «не закрыта» и в зарплату не идёт. Программа такие дни сама не закрывает.
      Вчерашний день можно исправить на странице «Смена» до 09:00 - со штрафным баллом; позже и любой прошедший день исправляет только руководитель - напишите ему.</div>
  </div>`);
};
window.uchPravkaSmeny = function(den){
  const ov=document.createElement('div'); ov.className='ov';
  ov.innerHTML=`<div class="ovc" style="max-width:420px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <b>Время смены — ${esc(den)}</b>
      <button class="btn bsm" onclick="this.closest('.ov').remove()">✕</button></div>
    <div class="fr"><div class="fg"><label class="fl">Начало</label><input class="fc" type="time" value="09:02"></div>
      <div class="fg"><label class="fl">Конец</label><input class="fc" type="time" value="18:30"></div></div>
    <button class="btn bp bbl tr-tyk" id="uch-na-proverku" onclick="uchNaProverku(this)">Отправить на проверку</button></div>`;
  document.body.appendChild(ov);
};
window.uchNaProverku = function(b){ b.closest('.ov').remove(); _pravka=true; tr.sobytie('act:pravka'); pgRunnerHist(); };

const zpStr = (rows,itogo) => `
  <div class="card" style="max-width:560px"><div class="ct">Моя зарплата · ноябрь</div>
    <select class="fc" style="max-width:220px;margin-bottom:1rem"><option>ноябрь 2026 г.</option></select>
    ${rows.map(r=>`<div class="zpr"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}
    <div class="zpr" style="border-top:2px solid var(--bd);font-size:16px">
      <span><b>К выплате</b></span><b style="color:var(--blue)">${itogo}</b></div>
    <div class="rnote">Это ваша зарплата и только ваша. Чужих цифр здесь нет.</div>
  </div>`;
window.pgRunnerZP = function(){ nav('pgRunnerZP'); setTitle('Моя зарплата'); setBadge('');
  if(CU.role==='immgr')
    setContent(zpStr([['Оклад (19,5 из 21 раб. дней)',fmt(278571)],['Отработано','175 ч 30 мин']], fmt(278571))
      + '<div class="card"><div class="rnote" style="margin-top:0">Учебный пример: оклад 300 000 ₸, норма ноября 21 день. '
      + 'День считается как часы, поделённые на 9: 9 часов - целый день, 10 часов - 10/9 дня, 6 часов - 6/9. Ваш оклад - в вашей карточке.</div></div>');
  else if(CU.role==='store' || CU.role==='whhead')
    setContent(zpStr([['Полные смены (13 × 9 000)',fmt(117000)],['Смена 12 ноября: 10 ч - 10/9 ставки',fmt(10000)],
      ['Отработано','127 ч 00 мин']], fmt(127000))
      + '<div class="card"><div class="rnote" style="margin-top:0">Учебный пример: полная смена - 9 часов с обедом, условно 9 000 ₸ за смену, то есть '
      + '1 000 ₸ за час. Время сверх 9 часов оплачивается по той же ставке. Ваша ставка - в вашей карточке.</div></div>');
  else
    setContent(zpStr([['Полные смены (14 × 8 000)',fmt(112000)],['Смена 12 ноября: 12 ч - 12/10 ставки',fmt(9600)],
      ['Отработано','152 ч 00 мин']], fmt(121600))
      + '<div class="card"><div class="rnote" style="margin-top:0">Учебный пример: полная смена 10 часов, 8 000 ₸ за смену, то есть '
      + '800 ₸ за час. В Алматы полная смена 12 часов. Ваша ставка - в вашей карточке.</div></div>'); };
window.pgStreamZP = function(){ nav('pgStreamZP'); setTitle('Моя зарплата'); setBadge('');
  setContent(zpStr([['Оклад (24 из 21 раб. дней)',fmt(342857)],
    ['5 % от личных продаж',fmt(114500)]], fmt(457357))); };
window.pgEfirZP = function(){ nav('pgEfirZP'); setTitle('Моя зарплата'); setBadge('');
  setContent(zpStr([['Оклад (19 из 21 раб. дней)',fmt(226190)],
    ['1 % с эфиров Алматы',fmt(29397)]], fmt(255587))
    + '<div class="card"><div class="ct">С чьих эфиров идёт процент</div>'
    + '<div class="zpr"><span>Кузьмин Никита</span><b>'+fmt(2541045)+'</b></div>'
    + '<div class="zpr"><span>Шаймурат Мадина</span><b>'+fmt(398632)+'</b></div>'
    + '<div class="rnote">Если здесь пусто, значит в вашей карточке указано не то '
    + 'подразделение — скажите администратору, иначе процент выйдет нулевым.</div></div>'); };
// ── мой расчётный лист ──
// В боевой сотрудник открывает тот же квиток, что видит бухгалтер, за любой
// прошлый месяц. Здесь показываем устройство: выбор месяца, пометка «закрыт
// или нет» и кнопка, открывающая квиток. Цифры выдуманные, как везде.
window.pgMoiList = function(){
  nav('pgMoiList'); setTitle('Мой расчётный лист'); setBadge('');
  setContent(`
  <div class="card" style="max-width:560px"><div class="ct">Мой расчётный лист</div>
    <select id="mlm" class="fc" style="max-width:240px;margin-bottom:1rem" onchange="loadMoiList()">
      <option value="2026-08">август 2026 г.</option>
      <option value="2026-07">июль 2026 г.</option>
      <option value="2026-06">июнь 2026 г.</option>
    </select>
    <div id="mlbody"></div></div>`);
  loadMoiList();
};
window.loadMoiList = function(){
  const mk = document.getElementById('mlm').value;
  const zakryt = mk !== '2026-08';   // август ещё считают, июль и раньше закрыты
  const lbl = {'2026-08':'август 2026 г.','2026-07':'июль 2026 г.','2026-06':'июнь 2026 г.'}[mk];
  document.getElementById('mlbody').innerHTML =
    (zakryt
      ? '<div class="alert" style="background:var(--gl);color:var(--green);font-size:13px">Месяц закрыт, суммы окончательные.</div>'
      : '<div class="alert" style="background:var(--al);color:var(--amber);font-size:13px">Месяц ещё не закрыт — бухгалтер может внести правки, суммы не окончательные.</div>')
    + '<button class="btn bp bbl" id="ml-btn" onclick="otkrytMoiList()">Открыть расчётный лист за ' + lbl + '</button>'
    + '<div style="font-size:12px;color:var(--muted);margin-top:1rem">В листе видно всё, из чего сложилась зарплата: '
    + 'смены, продажи, проценты, бонусы, премия, аванс, пенсионные, ИПН, ВОСМС и штрафы. '
    + 'Лист можно распечатать или отправить себе в WhatsApp.</div>';
};
window.otkrytMoiList = function(){
  if(CU.role==='aho') uchKvitokAho();
  else if(CU.role==='hr') uchKvitokHr();
  else if(CU.role==='accountant') uchKvitokBuh();
  else if(CU.role==='smm') uchKvitokSmm();
  else uchKvitok(CU.name, 353426, 15);
  tr.sobytie('act:moilist');
};
// Бухгалтер, HR-менеджер и SMM-менеджер — свободное посещение: ни графика,
// ни отметок, ни смен, оклад за месяц платится целиком. У HR сверху к нему —
// премия за вакансии, и только за подтверждённые.
function uchKvitokOklad(dolzhnost, oklad, stroki, pripiska){
  const ov=document.createElement('div'); ov.className='ov';
  ov.innerHTML=`<div class="ovc">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <b>Расчётный лист</b>
      <div style="display:flex;gap:8px">
        <button class="btn bp bsm">🖨️ Печать</button>
        <button class="btn bsm">📱 WhatsApp</button>
        <button class="btn bsm" onclick="this.closest('.ov').remove()">✕</button></div></div>
    <div style="border:1px solid var(--bd);border-radius:var(--rs);padding:1.25rem">
      <div style="text-align:center;margin-bottom:1rem"><div style="font-size:20px;font-weight:700">FBSM</div>
        <div style="font-size:13px;color:var(--muted)">Расчётный лист за сентябрь 2026 г.</div></div>
      <div style="font-size:13px;margin-bottom:1rem"><b>${esc(CU.name)}</b> · ${dolzhnost}</div>
      <table><tr><th>Составляющая ЗП</th><th>Сумма</th></tr>
        <tr><td>Оклад за месяц</td><td>${fmtN(oklad)}</td></tr>
        ${stroki}</table>
    </div>
    <div class="rnote">${pripiska}</div></div>`;
  document.body.appendChild(ov);
  tr.sobytie('act:kvitok');
}
window.uchKvitokHr = function(){
  const s = vakSchet(), prem = vakPremiya();
  uchKvitokOklad('HR-менеджер', VAK_OKLAD,
    `<tr><td>Закрытые вакансии: подтверждено ${s.ok}${s.zhdut?` (ещё ${s.zhdut} ждут решения)`:''}
       — сверх ${VAK_POROG} по ${fmtN(VAK_ZA)} ₸</td><td>${prem>0?'+'+fmtN(prem):'—'}</td></tr>
     <tr style="background:var(--gl)"><td><b>ИТОГО К ВЫПЛАТЕ</b></td>
       <td><b style="font-size:16px;color:var(--blue)">${fmtN(VAK_OKLAD+prem)}</b></td></tr>`,
    'В премию идут только подтверждённые вакансии. Те, что ждут решения главного администратора, ' +
    'в сумме не участвуют — как и отклонённые. Работает неофициально, налоги с этих сумм не удерживаются.');
};
window.uchKvitokBuh = function(){
  uchKvitokOklad('Бухгалтер', 425540,
    `<tr style="background:var(--gl)"><td><b>ИТОГО К ВЫПЛАТЕ</b></td>
       <td><b style="font-size:16px;color:var(--blue)">${fmtN(425540)}</b></td></tr>`,
    'Свободное посещение: ни графика, ни отметок, ни смен — оклад за месяц платится целиком. ' +
    'Оклад указан с налогами: пенсионные, ИПН и ВОСМС вносятся в корректировке.');
};
window.uchKvitokSmm = function(){
  uchKvitokOklad('SMM-менеджер', 200000,
    `<tr style="background:var(--gl)"><td><b>ИТОГО К ВЫПЛАТЕ</b></td>
       <td><b style="font-size:16px;color:var(--blue)">${fmtN(200000)}</b></td></tr>`,
    'Свободное посещение: ни графика, ни отметок, ни смен — оклад за месяц платится целиком. ' +
    'Аванс, удержания и премия вносятся бухгалтером в корректировке.');
};
// У руководителя АХО оклад месячный и не зависит от выходов — квиток другой.
window.uchKvitokAho = function(){
  const ov=document.createElement('div'); ov.className='ov';
  ov.innerHTML=`<div class="ovc">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <b>Расчётный лист</b>
      <div style="display:flex;gap:8px">
        <button class="btn bp bsm">🖨️ Печать</button>
        <button class="btn bsm">📱 WhatsApp</button>
        <button class="btn bsm" onclick="this.closest('.ov').remove()">✕</button></div></div>
    <div style="border:1px solid var(--bd);border-radius:var(--rs);padding:1.25rem">
      <div style="text-align:center;margin-bottom:1rem"><div style="font-size:20px;font-weight:700">FBSM</div>
        <div style="font-size:13px;color:var(--muted)">Расчётный лист за ноябрь 2026 г.</div></div>
      <div style="font-size:13px;margin-bottom:1rem"><b>${esc(CU.name)}</b> · Руководитель АХО</div>
      <table><tr><th>Составляющая ЗП</th><th>Сумма</th></tr>
        <tr><td>Оклад (20 из 21 раб. дней × 615 000 ₸)</td><td>${fmtN(585714)}</td></tr>
        <tr><td>Норма месяца</td><td>21 раб. день - будни минус праздники и переносы</td></tr>
        <tr><td>Премия</td><td>+0</td></tr>
        <tr><td>Удержания</td><td>−0</td></tr>
        <tr style="background:var(--gl)"><td><b>ИТОГО К ВЫПЛАТЕ</b></td>
          <td><b style="font-size:16px;color:var(--blue)">${fmtN(585714)}</b></td></tr></table>
    </div>
    <div class="rnote">Дни берутся из графика склада: отмечаться не нужно, поставленный день и есть факт.
      Отпуск и больничный в оплату не идут.</div></div>`;
  document.body.appendChild(ov);
  tr.sobytie('act:kvitok');
};

window.pgMgrDash = function(){ nav('pgMgrDash'); setTitle('Моя зарплата'); setBadge('');
  setContent(zpStr([['Оклад (24 раб. дня × 30 000)',fmt(720000)],
    ['% от продаж магазина',fmt(239532)]], fmt(959532))); };

// ══ ТРЕНЕР ═══════════════════════════════════════════════════
const KURSY = {

seller:[
 {t:'Ваш дашборд', otkryt:'pgDash',
  txt:['Это первое, что вы видите после входа. Слева меню, на телефоне — панель внизу.',
       'Здесь всё про вас: сколько продано, какой план, сколько смен и какая выйдет '
      +'зарплата, если темп сохранится.'],
  zad:'Осмотритесь на дашборде и нажмите «Дальше».'},
 {t:'Сервис для клиента', otkryt:'pgDash', cel:'act:zh-okno',
  txt:['На главной внизу стоит блок «🤝 Сервис для клиента» с двумя кнопками. «🎁 Записать подарок» - вы отдали клиенту шоколадку или что-то ещё (у продавца это '
      +'«Комплимент (шоколадка)» и «Прочее»): запишите, что случилось и что дали. «＋ Жалоба клиента» - клиент недоволен, а на месте решить не вышло: '
      +'запишите, что случилось и что он просит, дальше жалобу возьмёт управляющий.',
       'Обмен, возврат и скидку за брак по правилам вы делаете на месте и в программу жалоб не пишете - они уже есть в 1С, чеке и чате «Ручные скидки». '
      +'Если управляющий поручил вам что-то по жалобе, поручение видно в этом же блоке: проведите и нажмите «✓ Выполнено».'],
  zad:'Нажмите «🎁 Записать подарок», посмотрите окно и закройте его кнопкой «Отмена».', tyk:'#uch-srv-podarok'},
 {t:'Подтверждение продаж — главное', otkryt:'pgEnter', cel:'page:pgEnter',
  txt:['Продажи приходят из 1С сами, но в зарплату попадают только после вашего '
      +'подтверждения. Не подтвердили — деньги не начислены.',
       'Срок — до 11:00 следующего дня: утром вчерашний день ещё висит на «Вводе продаж» отдельной карточкой. '
      +'После 11:00 подтвердить сами вы уже не сможете — только через управляющего.'],
  zad:'Откройте раздел «Ввод продаж» в меню.', tyk:'#n-pgEnter,#m-pgEnter'},
 {t:'Подтвердите день', cel:'act:podtverdil',
  txt:['Цифры править нельзя, и это правильно: они из 1С. Если сумма неверна — '
      +'скажите управляющему, чинить надо в 1С.'],
  zad:'Нажмите «Подтвердить продажи за 12 сентября».', tyk:'#uch-podtv'},
 {t:'Когда подтвердить нельзя',
  txt:['Ниже — 13 сентября: кнопка выглядит как «🔒 Подтвердить пока нельзя», а под ней жёлтая строка — '
      +'в магазине за этот день не сданы отчёт магазина и закрытие кассы. Подтвердить можно, только когда их сдадут; '
      +'замок снимется сам, стоит обновить страницу. В «Истории» у такого дня та же строка мелким.',
       'Если продажи из 1С не приходят совсем — вашей учётки нет в 1С или она не связана, — вместо цифр будет жёлтое '
      +'предупреждение: скажите управляющему, вводить продажи руками нельзя. Если связь есть, а продаж ещё не было, '
      +'вы увидите обычное «данные из 1С ещё не пришли».'],
  zad:'Прочитайте и нажмите «Дальше».'},
 {t:'Смена без продаж',
  txt:['Были на смене, а продаж не было — всё равно отметьтесь: на том же экране кнопка '
      +'«🕒 Отметить смену без продаж». Смена засчитается в оклад, выручка не изменится.',
       'Не сохраняется — значит, вас нет в графике на этот день. Скажите управляющему, '
      +'он поставит смену.'],
  zad:'Прочитайте и нажмите «Дальше».'},
 {t:'История', otkryt:'pgHist', cel:'page:pgHist',
  txt:['Здесь видно все ваши дни и что с ними: зелёное — уже в расчёте, жёлтое — '
      +'ждёт вас. Только что подтверждённый день позеленел.'],
  zad:'Откройте «История» и найдите день, который вы подтвердили.', tyk:'#n-pgHist,#m-pgHist'},
 {t:'График смен', otkryt:'pgSchedule', cel:'page:pgSchedule',
  txt:['Плановые смены себе и коллегам вы можете ставить сами, но только на будущие дни. '
      +'Сегодняшний и прошедшие дни правит управляющий. Если вас нет в графике на день, вы не сможете '
      +'подтвердить за него продажи — так ловятся дни, когда продажи записались не на того.'],
  zad:'Откройте «График» и найдите свою строку.', tyk:'#n-pgSchedule,#s-pgSchedule'},
 {t:'Рейтинг', otkryt:'pgRating', cel:'page:pgRating',
  txt:['Рейтинг общий по сети и открыт всем. Вверху переключатель «Продавцы / Магазины» — '
      +'магазины сравниваются по тем же показателям.',
      'Колонка «Индекс» и сортировка «По индексу месяца» показывают, кто сейчас идёт на «Продавца месяца» '
      +'и «Магазин месяца»: индекс в баллах (100 — средний) из плана, среднего чека, UPT и дисциплины, '
      +'поэтому у большого магазина нет преимущества.'],
  zad:'Откройте «Рейтинг» и переключитесь на «Магазины».', tyk:'#n-pgRating,#s-pgRating'},
 {t:'Отчёт магазина и касса', cel:'page:pgShopReport',
  txt:['Отчёт магазина сдаёт тот, кто закрывает смену. Если в этот день в графике стоит управляющий, отчёт сдаёт он под своим входом, а кассу закрываете вы. Выручка, чеки и позиции — из 1С, их не правят. '
      +'Здесь же сверка кассы: деньги и отчёт закрываются одним заходом.',
       'Утром первым делом — «Ответственность за магазин принята?» сверху отчёта. Всё в порядке — «Да». Беспорядок от прошлой смены — «Нет» до 11:00: отметьте пункты, у каждого что не так и фото; прошлой смене по 3 штрафных балла. Промолчали — магазин ваш: беспорядок, который потом найдёт руководство, — по баллу за каждый пункт каждому на смене.',
       'Вечером у каждого пункта чек-листа — галочка или причина, почему не сделано: без причины отчёт не отправится. Возвраты приходят из 1С сами.'],
  zad:'Откройте «Отчёт магазина».', tyk:'#n-pgShopReport,#m-pgShopReport,#s-pgShopReport'},
 {t:'Сверка кассы', cel:'act:sverka',
  txt:['Впишите, сколько наличных фактически в кассе, и нажмите «Сверить и отправить». Не сошлось — '
      +'выберите причину: расхождение уйдёт бухгалтеру, и смена не закроется, пока он его не подтвердит.',
       'После принятой сверки снимите Z-отчёт и закройте смену. Закрыть кассу нужно до 06:00 следующего дня — '
      +'ночная смена укладывается; не закрыта — балл кассиру смены. Открыть кассу нужно к 10:00: не открыта — '
      +'по баллу всем на смене, кроме стримеров.'],
  zad:'Впишите сумму в «Фактически в кассе» и нажмите «Сверить и отправить».', tyk:'#uch-sverka,#uch-fakt'},
 {t:'Заявка на хоз. нужды', otkryt:'pgShopReport', cel:'act:hoz_zayavka',
  txt:['Не хватает пакетов, вешалок или что-то сломалось — внизу «Отчёта магазина» есть блок «Заявка на хоз. нужды». '
      +'Напишите, что нужно — каждую позицию с новой строки, при желании приложите фото и отметьте «Срочно». Заявка сразу уходит '
      +'руководителю АХО — писать ему в личку не нужно. Отчёт для этого сдавать не надо: заявку можно отправить в любое время дня.',
       'Ниже видно, что из заявок магазина ещё в работе и что ответил руководитель АХО, а в «Закрыто за неделю» — что сделано '
      +'и что не будет и почему. Если пишете то, что уже в работе, программа подскажет — повторять не нужно.'],
  zad:'Напишите заявку и нажмите «Отправить заявку».', tyk:'#uch-hoz,#uch-hoz-btn'},
 {t:'Из чего складывается зарплата', otkryt:'pgDash',
  txt:['Оклад 6 000 за смену. Процент от ваших продаж растёт ступенями: 2 % всегда, '
      +'3 % от 80 % плана, 4 % от 100 %, 6 % от 140 %.',
       'Сверху три бонуса по 10 000: за план магазина, за средний чек от 15 000 '
      +'и за UPT от 2,5. Ступень считается по всему месяцу — не хватило до 100 % '
      +'пятидесяти тысяч, и теряется весь процент ступени, а не его часть.',
       'С 1 октября сверх всего — ещё 1 % с продаж без скидки: строки чека без ручной и автоматической скидки, '
      +'за вычетом их возвратов. Гарантированно, без порога. Продавайте без скидки, где можно, — это ваши деньги.'],
  zad:'Посмотрите на дашборде, сколько вам не хватает до ступени.'},
 {t:'Ваш расчётный лист', otkryt:'pgMoiList', cel:'page:pgMoiList',
  txt:['Начиная с 6-го числа здесь лежит лист за прошлый месяц — и за все более ранние. '
      +'Это тот же лист, что видит бухгалтер: оклад, проценты, бонусы, аванс, '
      +'пенсионные, ИПН, ВОСМС, штрафы и итог к выплате.',
       'Над листом — пометка. Зелёная: месяц закрыт, суммы окончательные. Жёлтая: '
      +'бухгалтер ещё может внести правки.'],
  zad:'Откройте «Мой расчётный лист».', tyk:'#n-pgMoiList,#m-pgMoiList,#s-pgMoiList'},
 {t:'Откройте сам лист', otkryt:'pgMoiList', cel:'act:moilist',
  txt:['В листе видно всё, из чего сложилась зарплата, включая вычеты: у каждого удержания написаны вид, дата и основание — если что-то непонятно, спрашивайте у управляющего. Выберите месяц и нажмите кнопку. Лист можно распечатать или отправить себе '
      +'в WhatsApp — пересылать его вам больше не нужно.'],
  zad:'Нажмите «Открыть расчётный лист».', tyk:'#ml-btn'},

 {t:'Антирейтинг', cel:'page:pgAntireiting',
  txt:['Баллы ставит программа сама, ночью, за нарушения. Балл живёт 90 дней и сгорает сам. '
      +'До 30 сентября идёт проверка, 1 октября — амнистия: счёт обнулится, и дальше всё всерьёз.',
       'Вас касаются: прогул — 10 баллов (смена в графике, а отметки о выходе нет три дня); отчёт магазина '
      +'сдан позже 09:00 следующего утра — по баллу каждому, кто был на смене; касса не закрыта до 06:00 следующего дня — '
      +'балл кассиру; касса не открыта к 10:00 — по баллу всем на смене; просроченная задача в Битриксе — балл.'],
  zad:'Откройте «Антирейтинг».', tyk:'#n-pgAntireiting,#m-pgAntireiting,#s-pgAntireiting'},
 {t:'Правила и погода', cel:'act:pravila',
  txt:['Во вкладке «Правила» — за что и сколько баллов и за что балла нет. Погода показывает счёт: '
      +'☀️ ясно — 0 баллов, ⛅ облачно — 1–5, 🌧️ моросит — 6–14, ☔ зонт обязателен — 15–29, '
      +'⛈️ штормовое предупреждение — 30 и больше.'],
  zad:'Откройте вкладку «Правила».', tyk:'#uch-ar-pravila'},
 {t:'Если балл не по делу', cel:'act:osporil',
  txt:['На «Погоде», в «Моей истории», у балла есть кнопка «Оспорить». Напишите причину одной строкой — '
      +'руководитель или администратор посмотрит и снимет, если так. Пока балл не сняли, он считается.'],
  zad:'Вернитесь на «Погоду», нажмите «Оспорить» у балла за 11 сентября и отправьте причину.',
  tyk:'#uch-osp-send,#uch-osporit-0,#uch-ar-pogoda'},
 {t:'Достижения', cel:'page:pgAchivki',
  txt:['Здесь награды за хорошую работу: лучшие продажи, план, средний чек, UPT, рекорды, стаж, дисциплина. '
      +'Их выдаёт программа сама по цифрам учёта, особые — вручает руководство. У каждой награды своя статуэтка '
      +'с именем: «Вега», «Десятка», «Слиток дня» — её видно на полке и в расшифровке.',
       'Победителя месяца определяет сводный индекс в баллах: план, средний чек и UPT поровну, дисциплина по антирейтингу — на втором месте. '
      +'Поэтому большая точка не выигрывает просто потому, что большая. Как он считается и откуда берётся металл '
      +'статуэтки — во вкладке «Правила».',
       'За обучение награды тоже есть: «Букварь» — за первый сданный курс, «Сова» — по одной за каждый курс, '
      +'они копятся на полке стопкой. Один курс — одна «Сова», пересдача второй не даёт. Выдаются не сразу, '
      +'а ночным расчётом, наутро. Курс засчитывается тому, под кем вы вошли в обучение из Битрикса, — '
      +'поэтому чужой ссылкой на курс лучше не пользоваться: сдача запишется не на вас.'],
  zad:'Откройте «Достижения».', tyk:'#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Профиль и награды', cel:'act:achprofil',
  txt:['Нажмите на человека — откроется его карточка. В шапке три плитки: сколько наград, стаж и день рождения. '
      +'Стаж там настоящий, от даты приёма — «1 год 3 месяца»; а строка «Стаж в FBSM · 1 год» ниже, в «Пути», — '
      +'это ступень награды, и числа у них разные. Под шапкой счётчик: сколько видов наград собрано из тех, что доступны '
      +'по должности. «Путь» — лестницы с полоской и подписью, какая ступень следующая. «Рекорды» — только личные: крупно само значение рекорда, '
      +'под ним дата и прежний результат, и сколько раз он бит. Рекордов вообще два уровня: свои личные — лучший '
      +'день, лучший месяц, задачи в срок, — и рекорды сети за день: продажи, чеки, товары. Рекорд сети держит '
      +'один человек на всю сеть, и в карточке он стоит кубком на полке: «Комета», «Кассовый аппарат», «Караван». '
      +'Рекорда сети за месяц не бывает. «Полка наград» — все статуэтки, одинаковые стоят стопкой с ×N. '
      +'Нажатие на любую из них — из «Пути», из «Рекордов», с полки, с пыльной полки — открывает одну и ту же '
      +'карточку награды; на телефоне она во весь экран.',
       'Ниже — «Пыльная полка»: антикубки стоят такими же кубками, как награды, а под кубком серым — сколько ещё '
      +'простоят. Они временные и в счётчик наград не входят. Антикубки бывают трёх пород. Погодные — '
      +'«Дырявый зонт» и «Громоотвод» — приходят от погоды антирейтинга (15 и 30 штрафных баллов) и уходят, когда '
      +'счёт опустится. За поведение программа ставит ночью сама, по действующим баллам за последние 30 дней: '
      +'«Сонная муха» — три опоздания, «Разбитая копилка» — три незакрытые в день смены кассы, «Кривое зеркало» — '
      +'три правки задним числом, «Грабли» — четыре одинаковых нарушения. У них видно, по какой день антикубок '
      +'простоит, если новых нарушений не будет; новое нарушение того же вида этот день сдвигает. Больше одного '
      +'такого сразу не бывает. Остальные вручает руководство на срок от 1 до 30 дней — '
      +'и те же четыре тоже можно вручить руками, тогда у них будет срок. В карточке антикубка написано прямо: '
      +'на зарплату и награды он не влияет.'],
  zad:'Откройте профиль Александры Забабуриной.', tyk:'#uch-ach-p-0,#uch-ach-lyudi'},
 {t:'Поделиться наградой', cel:'act:achpodel',
  txt:['В карточке награды сверху крупная статуэтка, её имя и название награды, а описание — двумя фразами: '
      +'за что она даётся и что это за вещь («Награда из серебра в форме подковы с гвоздями, постамент — кузнечная сталь»). '
      +'Ниже дата, прогресс — «ступень 2 из 6 · дальше — «100 смен»» у лестниц, «до золота — ещё 3» у рекордов — '
      +'и синяя ссылка внизу: «Все даты» или «Пройденные ступени».',
       'У своей награды есть «📤 Поделиться»: программа рисует открытку 1080×1350 — статуэтка, награда, обе фразы, '
      +'имя и дата. Личных сумм на ней нет. О новой награде программа и так пишет в общий чат Битрикса: '
      +'«Статуэтка «Вега». Награда из горного хрусталя в форме…»; про антикубок текст другой — он «ставит на полку» '
      +'и уходит по сроку или с погодой.'],
  zad:'Откройте первую статуэтку на полке и нажмите «Поделиться».',
  tyk:'#uch-ach-podelitsya,#uch-ach-n-0,#uch-ach-p-0,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Ордена', cel:'act:achorden',
  txt:['Вкладка «Ордена» — все награды компании по категориям, теми же статуэтками, что стоят на полке. '
      +'Цифра в синем кружке и стопка позади — у СКОЛЬКИХ ЧЕЛОВЕК эта награда есть. Это не то же самое, '
      +'что ×N в карточке сотрудника: там ×N — сколько раз получил он сам.',
       'Серые, обесцвеченные — награды, которых пока нет ни у кого; «скоро» — ещё не запущенные. Антикубки идут '
      +'последней категорией, красным, в пунктирной рамке, и серыми не бывают. Нажмите на статуэтку — откроется '
      +'орден: те же две фразы — за что награда и что это за вещь, у рекордов — линейка, как растёт металл '
      +'(и строка «Металл растёт с числом наград»), у лестниц — все ступени и кто на них. '
      +'У стажа ступень появляется каждый год, а металл меняется реже: несколько соседних лет стоят в одном металле '
      +'и с одной статуэткой.'],
  zad:'Откройте вкладку «Ордена» и нажмите первую статуэтку.',
  tyk:'#uch-ach-ord-0,#uch-ach-ordena,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Что нового', cel:'page:pgChangelog',
  txt:['Программа меняется часто. Что поменялось — человеческими словами, по датам — на странице «Что нового». '
      +'Она открывается щелчком по строке версии внизу бокового меню, а на телефоне — внизу листа «Ещё». '
      +'Сверху там номер версии: если он старее, чем у коллег, закройте вкладку и откройте заново.'],
  zad:'Щёлкните по строке версии внизу меню.', tyk:'#n-pgChangelog,#m-pgChangelog,#s-pgChangelog,#sb-ver,#ms-ver'},],

manager:[
 {t:'Сводка — ваш главный экран', otkryt:'pgReport',
  txt:['Видно каждого продавца: продажи, процент плана, прогноз зарплаты. Жёлтым — '
      +'у кого висят неподтверждённые дни.',
       'Пока человек их не подтвердил, деньги ему не начислены, и спросят в конце '
      +'месяца с вас.'],
  zad:'Найдите в сводке того, у кого есть неподтверждённые дни.'},
 {t:'Отчёт магазина', otkryt:'pgShopReport', cel:'page:pgShopReport',
  txt:['Сдаётся каждый день. Стоите в графике на этот день - сдаёте сами под своим входом: только так отмечается ваш выход, вручную его не поставить. Выручка, чеки и позиции — из 1С, не правятся. Остальное '
      +'заполняете вы.',
       'Утром первым делом — «Ответственность за магазин принята?» сверху отчёта. Всё в порядке — «Да». Беспорядок от прошлой смены — «Нет» до 11:00: отметьте пункты, у каждого что не так и фото; прошлой смене по 3 штрафных балла. Промолчали — магазин ваш: беспорядок, который потом найдёт руководство, — по баллу за каждый пункт каждому на смене.',
       'Вечером у каждого пункта чек-листа — галочка или причина, почему не сделано: без причины отчёт не отправится. Возвраты приходят из 1С сами.'],
  zad:'Откройте «Отчёт магазина».', tyk:'#n-pgShopReport,#s-pgShopReport'},
 {t:'Сверка кассы', cel:'act:sverka',
  txt:['Впишите, сколько наличных фактически в кассе, и нажмите «Сверить и отправить». Не сошлось — '
      +'выберите причину: расхождение уйдёт бухгалтеру, и смена не закроется, пока он его не подтвердит.',
       'После принятой сверки снимите Z-отчёт и закройте смену. Закрыть кассу нужно до 06:00 следующего дня — '
      +'ночная смена укладывается; не закрыта — балл кассиру смены. Открыть кассу нужно к 10:00: не открыта — '
      +'по баллу всем на смене, кроме стримеров.'],
  zad:'Впишите сумму в «Фактически в кассе» и нажмите «Сверить и отправить».', tyk:'#uch-sverka,#uch-fakt'},
 {t:'Заполните и отправьте', cel:'act:otchet',
  txt:['Кнопка отправки не работает, пока не заполнены посетители — это не придирка, '
      +'а защита от пустых отчётов.',
       'Отчёт уйдёт в телеграм после ближайшего обмена с 1С, чтобы в группу попали итоговые цифры. '
      +'Отправка засчитает вам смену в графике за этот день.'],
  zad:'Впишите число посетителей и нажмите «Отправить отчёт».', tyk:'#uch-send,#uch-vis'},
 {t:'Заявка на хоз. нужды', otkryt:'pgShopReport', cel:'act:hoz_zayavka',
  txt:['Не хватает пакетов, вешалок или что-то сломалось — внизу «Отчёта магазина» есть блок «Заявка на хоз. нужды». '
      +'Напишите, что нужно — каждую позицию с новой строки, при желании приложите фото и отметьте «Срочно». Заявка сразу уходит '
      +'руководителю АХО — писать ему в личку не нужно. Отчёт для этого сдавать не надо: заявку можно отправить в любое время дня.',
       'Ниже видно, что из заявок магазина ещё в работе и что ответил руководитель АХО, а в «Закрыто за неделю» — что сделано '
      +'и что не будет и почему. Если пишете то, что уже в работе, программа подскажет — повторять не нужно.'],
  zad:'Напишите заявку и нажмите «Отправить заявку».', tyk:'#uch-hoz,#uch-hoz-btn'},
 {t:'График — включите кисть', otkryt:'pgSchedule', cel:'act:kist',
  txt:['График на месяц ставится кистью: включили один раз — и щёлкаете по дням. '
      +'Без кисти клик открывает диалог дня.'],
  zad:'Откройте «График» и включите кисть.', tyk:'.sch-brush-btn,#n-pgSchedule,#s-pgSchedule'},
 {t:'Поставьте смены', cel:'act:smena:4',
  txt:['Клетка красится сразу, сохранение уходит фоном — поэтому сорок пять дней '
      +'ставятся быстро.'],
  zad:'Поставьте четыре смены — щёлкните по четырём дням.'},
 {t:'Начисление', otkryt:'pgPayroll', cel:'page:pgPayroll',
  txt:['Здесь видно, из чего сложилась зарплата каждого. Две кнопки в строке: '
      +'💵 корректировка и 🖨️ квиток.',
       'Если у кого-то из отмечающихся кнопкой есть смены, которые ждут решения, наверху страницы стоит '
      +'строка «⏳ Смен по кнопке ждут подтверждения» и кнопка «Открыть →» — она ведёт в «Подтверждения».',
       'Дальше идёт «🚚 Руководитель АХО, складской и транспортной логистики»: оклад 615 000 ₸ при норме '
      +'рабочих дней, а смены — дни, поставленные ему в графике склада. Отмечаться ему не нужно: план и есть факт.'],
  zad:'Откройте «Начисление ЗП».', tyk:'#n-pgPayroll,#s-pgPayroll'},
 {t:'Посмотрите квиток', cel:'act:kvitok',
  txt:['Квиток — расшифровка для человека: оклад, каждая ступень, каждый бонус, вычеты '
      +'и итог. Печатается или уходит в WhatsApp.',
       'Отдавайте квиток до выплаты, а не после — вопросов будет меньше.'],
  zad:'Нажмите 🖨️ в любой строке.', tyk:'#uch-kvit-0'},
 {t:'Зачем заполнять график заранее',
  txt:['Продавец, которого нет в графике на день, не сможет подтвердить за него продажи. '
      +'Незакрытые дни — это не бюрократия, а остановка работы.',
       'Программа предупреждает заранее: над таблицей висит список ближайших дней, '
      +'на которых на вашей точке никого нет.'],
  zad:'Прочитайте и нажмите «Дальше».'},
 {t:'Ваш расчётный лист', otkryt:'pgMoiList', cel:'page:pgMoiList',
  txt:['Начиная с 6-го числа здесь лежит лист за прошлый месяц — и за все более ранние. '
      +'Это тот же лист, что видит бухгалтер: оклад, проценты, бонусы, аванс, '
      +'пенсионные, ИПН, ВОСМС, штрафы и итог к выплате.',
       'Над листом — пометка. Зелёная: месяц закрыт, суммы окончательные. Жёлтая: '
      +'бухгалтер ещё может внести правки.'],
  zad:'Откройте «Мой расчётный лист».', tyk:'#n-pgMoiList,#m-pgMoiList,#s-pgMoiList'},
 {t:'Откройте сам лист', otkryt:'pgMoiList', cel:'act:moilist',
  txt:['Выберите месяц и нажмите кнопку. Лист можно распечатать или отправить себе '
      +'в WhatsApp — пересылать его вам больше не нужно.'],
  zad:'Нажмите «Открыть расчётный лист».', tyk:'#ml-btn'},

 {t:'Подтверждения', cel:'page:pgPodtverzhdeniya',
  txt:['Сюда попадают смены по кнопке «Пришёл/Ушёл», которые ждут вашего решения: сотрудник поправил '
      +'приход или уход, добавил смену задним числом или не завершил день и сам указал, во сколько ушёл (это штрафной балл).',
       'Пока смена не решена, она идёт в зарплату по записанному времени.'],
  zad:'Откройте «Подтверждения».', tyk:'#n-pgPodtverzhdeniya,#m-pgPodtverzhdeniya,#s-pgPodtverzhdeniya'},
 {t:'Решите смену', cel:'act:podtv',
  txt:['«✅ Подтвердить» — согласиться со временем. «↩️ Отклонить» — вернуть время по кнопке, есть только у правки. '
      +'«✏️ Указать время» — вписать своё. «Не засчитать» — день не идёт в зарплату.',
       'Уже подтверждённую смену можно поправить в графике: нажмите на день — там блок «Смена по кнопке» '
      +'и та же кнопка «✏️ Указать время».'],
  zad:'Подтвердите смену раннера.', tyk:'#uch-podtv-ok'},
 {t:'Жалобы клиентов', cel:'page:pgZhaloby',
  txt:['Вкладка «Жалобы» в группе «Магазин» - все жалобы на вашу точку: из WhatsApp-бота и 2ГИС (они появляются у вас после того, как директор по развитию подтвердит жалобу в карточке) '
      +'и те, что записали ваши люди кнопкой «Жалоба клиента». Цифра у пункта меню - новые и ждущие согласования за 30 дней.',
       'Вверху две кнопки: «🎁 Записать подарок» и «＋ Жалоба клиента». Ниже две вкладки: «Случаи» и «Учёт подарков». В «Случаях» по умолчанию стоит фильтр «Открытые»: '
      +'закрытые жалобы там не видны - выберите «Решены», «Закрыты отказом» или «Все». Уровень 1 решают на месте, уровень 2 - ответить клиенту сегодня и решить до 24 часов, '
      +'уровень 3 решает директор по развитию.'],
  zad:'Откройте «Жалобы».', tyk:'#n-pgZhaloby,#m-pgZhaloby,#s-pgZhaloby'},
 {t:'Возьмите жалобу', otkryt:'pgZhaloby', cel:'act:zh-vzyal',
  txt:['Новая жалоба стоит со статусом «новый». Нажмите «✋ Взял» - она станет «в работе», и все увидят, что вы ею занимаетесь. '
      +'В карточке видно тему, откуда пришла жалоба, клиента и его контакт (WhatsApp или Instagram ссылкой, чтобы сразу начислить бонусы), кто завёл, кто взял и последние действия.',
       'Закрыть жалобу можно и без «Взял»: «✓ Решено» и «Отказать» видны сразу. «На разбор» жалобу не закрывает: это метка для месячного разбора.'],
  zad:'Нажмите «✋ Взял» в жалобе №41.', tyk:'#uch-zh-vzyal-41,#n-pgZhaloby,#m-pgZhaloby,#s-pgZhaloby'},
 {t:'Запишите подарок к жалобе', otkryt:'pgZhaloby', cel:'act:zh-podarok',
  txt:['Подарок всегда записывается к жалобе: ситуацию заново вписывать не нужно, подарков может быть несколько. В карточке нажмите «🎁 Записать подарок», '
      +'выберите, что дали - Комплимент (шоколадка), Бонусы, Ремонт или химчистку, Доставку за наш счёт или Прочее - и впишите, что именно. '
      +'Верхняя кнопка «🎁 Записать подарок» сначала спросит: «Новая жалоба» или «К существующей».',
       'Без согласования вы даёте бонусы до 3 000 ₸, а ремонт, химчистку и доставку - до 5 000 ₸ на жалобу: потолок считается по сумме всех подарков жалобы. '
      +'Обмен, возврат и скидку за брак по правилам сюда не записывайте - только подарок клиенту.'],
  zad:'В жалобе №41 нажмите «🎁 Записать подарок», выберите «Комплимент (шоколадка)» и нажмите «Сохранить».',
  tyk:'#uch-zh-pod-save,#uch-zh-pod-otmena,#uch-zh-podarok-41,#n-pgZhaloby,#m-pgZhaloby,#s-pgZhaloby'},
 {t:'Решите жалобу', otkryt:'pgZhaloby', cel:'act:zh-reshil',
  txt:['«✓ Решено» открывает форму: решение из списка, что дали, сумма, штуки или процент и комментарий. Если подарки уже записаны, первым пунктом стоит '
      +'«По записанным подаркам» - ничего вписывать заново не нужно. У вас есть все решения, кроме «Деньги вне закона, крупная сумма»: это решает директор по развитию.',
       'Скидку за брак даёте вы: до 20 % сразу, 21-50 % - только с отметкой «Одобрено в чате «Ручные скидки»», больше 50 % программа не принимает. '
      +'Жалобу уровня 3 вы не решаете: только «Взял» и заявка директору по развитию.'],
  zad:'В жалобе №41 нажмите «✓ Решено», оставьте первый пункт в списке и нажмите «Отметить решение».',
  tyk:'#uch-zh-otmetit,#uch-zh-reshit-41,#n-pgZhaloby,#m-pgZhaloby,#s-pgZhaloby'},
 {t:'Больше потолка - заявка директору', otkryt:'pgZhaloby', cel:'act:zh-zayavka',
  txt:['В жалобе №40 клиентка просит бонусы 5 000 ₸ - это больше вашего потолка в 3 000 ₸. Нажмите «✓ Решено», выберите «Бонусы», впишите 5000 и нажмите «Отметить решение»: '
      +'программа покажет красный блок «Нужно согласование директора по развитию» и кнопку «Отправить директору по развитию».',
       'Заявка уходит на всю сумму, а не на разницу. Жалоба получает статус «ждёт согласования»; решает директор по развитию, после согласования жалоба возвращается в работу, и вы её закрываете. '
      +'Ту же заявку можно подать кнопкой «Заявка на согласование», если заранее знаете, что нужно больше потолка.'],
  zad:'В жалобе №40: «✓ Решено» → «Бонусы» → 5000 → «Отметить решение» → «Отправить директору по развитию».',
  tyk:'#uch-zh-dir,#uch-zh-otmetit,#uch-zh-reshit-40,#n-pgZhaloby,#m-pgZhaloby,#s-pgZhaloby'},
 {t:'Поручите продавцу', otkryt:'pgZhaloby', cel:'act:zh-poruchil',
  txt:['Жалоба решена, но в магазине ещё нужно что-то сделать - например, провести обмен. Нажмите «Поручить продавцу», выберите сотрудника вашего магазина и впишите, что сделать. '
      +'Он увидит поручение на своей главной в блоке «Сервис для клиента» и отметит «✓ Выполнено». Сам он жалобу не решает - только исполняет.',
       'Решённые жалобы в фильтре «Открытые» не видны: выберите в фильтре «Решены». Пока поручение не выполнено, его можно передать другому.'],
  zad:'В фильтре выберите «Решены», в жалобе №38 нажмите «Поручить продавцу», выберите сотрудника, впишите, что сделать, и нажмите «Поручить».',
  tyk:'#uch-zh-poruchit-ok,#uch-zh-poruchit-38,#uch-zh-f-st,#n-pgZhaloby,#m-pgZhaloby,#s-pgZhaloby'},
 {t:'Клиент доволен', otkryt:'pgZhaloby', cel:'act:zh-dovolen',
  txt:['Через 2 дня после решения спросите клиента, всё ли устроило. На решённой жалобе нажмите «🙂 Клиент доволен» или «Недоволен» - итог запишется в карточку.'],
  zad:'В фильтре «Решены» в жалобе №38 нажмите «🙂 Клиент доволен».',
  tyk:'#uch-zh-dovolen-38,#uch-zh-f-st,#n-pgZhaloby,#m-pgZhaloby,#s-pgZhaloby'},
 {t:'Подпись графика',
  txt:['1-го числа подпишите график за прошедший месяц кнопкой «Подписать график». '
      +'Неподписанный график бухгалтер увидит в предупреждениях перед выплатой.'],
  zad:'Прочитайте и нажмите «Дальше».'},
 {t:'Ваши продавцы', cel:'page:pgSellerHist',
  txt:['Людей вы не заводите и должности не меняете: новые сотрудники приходят сами из 1С и Битрикса, а стыкует '
      +'их главный администратор. Своих продавцов вы смотрите в «Истории продавцов». Если человека нет или у него '
      +'не та должность — скажите главному администратору.'],
  zad:'Откройте «История продавцов».', tyk:'#n-pgSellerHist,#m-pgSellerHist,#s-pgSellerHist'},
 {t:'Вычеты из ЗП', otkryt:'pgVychety', cel:'act:vychet',
  txt:['Недостачи и удержания вносятся здесь, а не в корректировке начисления: в «Вычетах» у каждой суммы '
      +'есть вид, дата события, основание и автор — видно, кто и за что удержал.',
       'Сотрудников можно отметить сразу нескольких или весь магазин галочкой «— все»: каждому внесётся '
      +'одинаковый вычет. Программа переспросит, сколько человек и сколько всего. Вычет попадёт в зарплату '
      +'за месяц события; если месяц уже закрыт — в следующий.'],
  zad:'Отметьте сотрудника, впишите сумму и внесите вычет.',
  tyk:'#uch-vych-da,#uch-vych-vnesti,#n-pgVychety,#m-pgVychety,#s-pgVychety'},
 {t:'Выдачи ИМ', cel:'page:pgImVydachi',
  txt:['Здесь видно, кто из продавцов выдал в магазине заказы самовывоза с сайта и возвраты по ним: '
      +'выдано − возвраты = база, продавцу — 1 % от неё. Данные приходят с сайта, а не из 1С.',
       'Если логин сайта не сопоставлен с сотрудником, выдачи попадают в блок «❓ Чьи выдачи?» и никому не начисляются, '
      +'пока главный администратор не привяжет логин. Начисление 1 % за выдачу включится, когда сайт начнёт передавать '
      +'боевые данные.'],
  zad:'Откройте «Выдачи ИМ».', tyk:'#n-pgImVydachi,#m-pgImVydachi,#s-pgImVydachi'},
 {t:'Антирейтинг', cel:'page:pgAntireiting',
  txt:['Баллы ставит программа сама, ночью, за нарушения. Балл живёт 90 дней и сгорает сам. '
      +'До 30 сентября идёт проверка, 1 октября — амнистия: счёт обнулится, и дальше всё всерьёз.',
       'Вас касаются: прогул — 10 баллов; отчёт магазина сдан позже 09:00 следующего утра — балл каждому на смене '
      +'и вам как управляющему; касса не открыта к 10:00 — по баллу всем на смене; просроченная задача — балл. '
      +'Спорные баллы ваших людей разбираете вы — в блоке «Ждут решения».'],
  zad:'Откройте «Антирейтинг».', tyk:'#n-pgAntireiting,#m-pgAntireiting,#s-pgAntireiting'},
 {t:'Правила и погода', cel:'act:pravila',
  txt:['Во вкладке «Правила» — за что и сколько баллов и за что балла нет. Погода показывает счёт: '
      +'☀️ ясно — 0 баллов, ⛅ облачно — 1–5, 🌧️ моросит — 6–14, ☔ зонт обязателен — 15–29, '
      +'⛈️ штормовое предупреждение — 30 и больше.'],
  zad:'Откройте вкладку «Правила».', tyk:'#uch-ar-pravila'},
 {t:'Если балл не по делу', cel:'act:osporil',
  txt:['На «Погоде», в «Моей истории», у балла есть кнопка «Оспорить». Напишите причину одной строкой — '
      +'руководитель или администратор посмотрит и снимет, если так. Пока балл не сняли, он считается.'],
  zad:'Вернитесь на «Погоду», нажмите «Оспорить» у балла за 11 сентября и отправьте причину.',
  tyk:'#uch-osp-send,#uch-osporit-0,#uch-ar-pogoda'},
 {t:'Достижения', cel:'page:pgAchivki',
  txt:['Здесь награды за хорошую работу: лучшие продажи, план, средний чек, UPT, рекорды, стаж, дисциплина. '
      +'Их выдаёт программа сама по цифрам учёта, особые — вручает руководство. У каждой награды своя статуэтка '
      +'с именем: «Вега», «Десятка», «Слиток дня» — её видно на полке и в расшифровке.',
       'Победителя месяца определяет сводный индекс в баллах: план, средний чек и UPT поровну, дисциплина по антирейтингу — на втором месте. '
      +'Поэтому большая точка не выигрывает просто потому, что большая. Как он считается и откуда берётся металл '
      +'статуэтки — во вкладке «Правила».',
       'За обучение награды тоже есть: «Букварь» — за первый сданный курс, «Сова» — по одной за каждый курс, '
      +'они копятся на полке стопкой. Один курс — одна «Сова», пересдача второй не даёт. Выдаются не сразу, '
      +'а ночным расчётом, наутро. Курс засчитывается тому, под кем вы вошли в обучение из Битрикса, — '
      +'поэтому чужой ссылкой на курс лучше не пользоваться: сдача запишется не на вас.'],
  zad:'Откройте «Достижения».', tyk:'#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Профиль и награды', cel:'act:achprofil',
  txt:['Нажмите на человека — откроется его карточка. В шапке три плитки: сколько наград, стаж и день рождения. '
      +'Стаж там настоящий, от даты приёма — «1 год 3 месяца»; а строка «Стаж в FBSM · 1 год» ниже, в «Пути», — '
      +'это ступень награды, и числа у них разные. Под шапкой счётчик: сколько видов наград собрано из тех, что доступны '
      +'по должности. «Путь» — лестницы с полоской и подписью, какая ступень следующая. «Рекорды» — только личные: крупно само значение рекорда, '
      +'под ним дата и прежний результат, и сколько раз он бит. Рекордов вообще два уровня: свои личные — лучший '
      +'день, лучший месяц, задачи в срок, — и рекорды сети за день: продажи, чеки, товары. Рекорд сети держит '
      +'один человек на всю сеть, и в карточке он стоит кубком на полке: «Комета», «Кассовый аппарат», «Караван». '
      +'Рекорда сети за месяц не бывает. «Полка наград» — все статуэтки, одинаковые стоят стопкой с ×N. '
      +'Нажатие на любую из них — из «Пути», из «Рекордов», с полки, с пыльной полки — открывает одну и ту же '
      +'карточку награды; на телефоне она во весь экран.',
       'Ниже — «Пыльная полка»: антикубки стоят такими же кубками, как награды, а под кубком серым — сколько ещё '
      +'простоят. Они временные и в счётчик наград не входят. Антикубки бывают трёх пород. Погодные — '
      +'«Дырявый зонт» и «Громоотвод» — приходят от погоды антирейтинга (15 и 30 штрафных баллов) и уходят, когда '
      +'счёт опустится. За поведение программа ставит ночью сама, по действующим баллам за последние 30 дней: '
      +'«Сонная муха» — три опоздания, «Разбитая копилка» — три незакрытые в день смены кассы, «Кривое зеркало» — '
      +'три правки задним числом, «Грабли» — четыре одинаковых нарушения. У них видно, по какой день антикубок '
      +'простоит, если новых нарушений не будет; новое нарушение того же вида этот день сдвигает. Больше одного '
      +'такого сразу не бывает. Остальные вручает руководство на срок от 1 до 30 дней — '
      +'и те же четыре тоже можно вручить руками, тогда у них будет срок. В карточке антикубка написано прямо: '
      +'на зарплату и награды он не влияет.'],
  zad:'Откройте профиль Александры Забабуриной.', tyk:'#uch-ach-p-0,#uch-ach-lyudi'},
 {t:'Поделиться наградой', cel:'act:achpodel',
  txt:['В карточке награды сверху крупная статуэтка, её имя и название награды, а описание — двумя фразами: '
      +'за что она даётся и что это за вещь («Награда из серебра в форме подковы с гвоздями, постамент — кузнечная сталь»). '
      +'Ниже дата, прогресс — «ступень 2 из 6 · дальше — «100 смен»» у лестниц, «до золота — ещё 3» у рекордов — '
      +'и синяя ссылка внизу: «Все даты» или «Пройденные ступени».',
       'У своей награды есть «📤 Поделиться»: программа рисует открытку 1080×1350 — статуэтка, награда, обе фразы, '
      +'имя и дата. Личных сумм на ней нет. О новой награде программа и так пишет в общий чат Битрикса: '
      +'«Статуэтка «Вега». Награда из горного хрусталя в форме…»; про антикубок текст другой — он «ставит на полку» '
      +'и уходит по сроку или с погодой.'],
  zad:'Откройте первую статуэтку на полке и нажмите «Поделиться».',
  tyk:'#uch-ach-podelitsya,#uch-ach-n-0,#uch-ach-p-0,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Ордена', cel:'act:achorden',
  txt:['Вкладка «Ордена» — все награды компании по категориям, теми же статуэтками, что стоят на полке. '
      +'Цифра в синем кружке и стопка позади — у СКОЛЬКИХ ЧЕЛОВЕК эта награда есть. Это не то же самое, '
      +'что ×N в карточке сотрудника: там ×N — сколько раз получил он сам.',
       'Серые, обесцвеченные — награды, которых пока нет ни у кого; «скоро» — ещё не запущенные. Антикубки идут '
      +'последней категорией, красным, в пунктирной рамке, и серыми не бывают. Нажмите на статуэтку — откроется '
      +'орден: те же две фразы — за что награда и что это за вещь, у рекордов — линейка, как растёт металл '
      +'(и строка «Металл растёт с числом наград»), у лестниц — все ступени и кто на них. '
      +'У стажа ступень появляется каждый год, а металл меняется реже: несколько соседних лет стоят в одном металле '
      +'и с одной статуэткой.'],
  zad:'Откройте вкладку «Ордена» и нажмите первую статуэтку.',
  tyk:'#uch-ach-ord-0,#uch-ach-ordena,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Ждут решения', cel:'act:reshil',
  txt:['Если сотрудник оспорил балл, у вас в «Антирейтинге» сверху появляется блок «⏳ Ждут решения» '
      +'с его объяснением. Число оспоренных видно и в пункте меню.',
       'Снять — балл гаснет. Отклонить — балл остаётся, человек видит в истории вашу причину и повторно '
      +'оспорить его уже не может. Оспаривание, которое ждёт дольше трёх дней, помечено красным.'],
  zad:'Откройте «Антирейтинг» и решите оспоренный балл: снимите или отклоните.',
  tyk:'#uch-snyat,#uch-ar-pogoda,#n-pgAntireiting,#m-pgAntireiting,#s-pgAntireiting'},
 {t:'Что нового', cel:'page:pgChangelog',
  txt:['Программа меняется часто. Что поменялось — человеческими словами, по датам — на странице «Что нового». '
      +'Она открывается щелчком по строке версии внизу бокового меню, а на телефоне — внизу листа «Ещё». '
      +'Сверху там номер версии: если он старее, чем у коллег, закройте вкладку и откройте заново.'],
  zad:'Щёлкните по строке версии внизу меню.', tyk:'#n-pgChangelog,#m-pgChangelog,#s-pgChangelog,#sb-ver,#ms-ver'},],

streamer:[
 {t:'Ваша смена — это отметка', otkryt:'pgEnter', cel:'page:pgEnter',
  txt:['Смена засчитывается в день, когда вы подтвердили продажи. День без продаж — '
      +'тоже смена: провели эфир, заказов не было, всё равно отмечайтесь.'],
  zad:'Откройте «Ввод продаж».', tyk:'#n-pgEnter,#m-pgEnter'},
 {t:'Подтвердите день', cel:'act:podtverdil',
  txt:['Не отметились — день не оплачен, даже если вы работали.',
       'Если кнопка выглядит как «🔒 Подтвердить пока нельзя», за этот день в магазине не сданы отчёт и закрытие '
      +'кассы: подтвердите, когда их сдадут, — замок снимется сам. Продаж из 1С нет совсем — скажите управляющему, '
      +'руками их не вводят; «🕒 Отметить смену без продаж» засчитает смену в оклад.'],
  zad:'Нажмите «Подтвердить продажи».', tyk:'#uch-podtv'},
 {t:'Ваша зарплата', otkryt:'pgStreamZP', cel:'page:pgStreamZP',
  txt:['Оклад 300 000 делится на норму рабочих дней месяца и умножается на отработанные. '
      +'Сверху 5 % от ваших личных продаж. Потолка нет: отработали больше нормы — '
      +'получите больше оклада.'],
  zad:'Откройте «Моя ЗП».', tyk:'#n-pgStreamZP,#s-pgStreamZP'},
 {t:'График', otkryt:'pgSchedule', cel:'page:pgSchedule',
  txt:['Плановые смены на будущие дни можно ставить и самим, сегодня и прошлое правит управляющий. '
      +'Отмечаетесь вы сами — подтверждением продаж.'],
  zad:'Откройте «График».', tyk:'#n-pgSchedule,#s-pgSchedule'},
 {t:'Ваш расчётный лист', otkryt:'pgMoiList', cel:'page:pgMoiList',
  txt:['Начиная с 6-го числа здесь лежит лист за прошлый месяц — и за все более ранние. '
      +'Это тот же лист, что видит бухгалтер: оклад, проценты, бонусы, аванс, '
      +'пенсионные, ИПН, ВОСМС, штрафы и итог к выплате.',
       'Над листом — пометка. Зелёная: месяц закрыт, суммы окончательные. Жёлтая: '
      +'бухгалтер ещё может внести правки.'],
  zad:'Откройте «Мой расчётный лист».', tyk:'#n-pgMoiList,#m-pgMoiList,#s-pgMoiList'},
 {t:'Откройте сам лист', otkryt:'pgMoiList', cel:'act:moilist',
  txt:['Выберите месяц и нажмите кнопку. Лист можно распечатать или отправить себе '
      +'в WhatsApp — пересылать его вам больше не нужно.'],
  zad:'Нажмите «Открыть расчётный лист».', tyk:'#ml-btn'},

 {t:'Сверка кассы', cel:'page:pgSverka',
  txt:['Отчёта магазина у стримера нет, а касса в подразделении есть — сверку вы сдаёте '
      +'отдельной страницей «Сверка кассы».'],
  zad:'Откройте «Сверку кассы».', tyk:'#n-pgSverka,#m-pgSverka,#s-pgSverka'},
 {t:'Сверка кассы', cel:'act:sverka',
  txt:['Впишите, сколько наличных фактически в кассе, и нажмите «Сверить и отправить». Не сошлось — '
      +'выберите причину: расхождение уйдёт бухгалтеру, и смена не закроется, пока он его не подтвердит.',
       'После принятой сверки снимите Z-отчёт и закройте смену. Закрыть кассу нужно до 06:00 следующего дня — '
      +'ночная смена укладывается; не закрыта — балл кассиру смены. Открыть кассу нужно к 10:00: не открыта — '
      +'по баллу всем на смене, кроме стримеров.'],
  zad:'Впишите сумму в «Фактически в кассе» и нажмите «Сверить и отправить».', tyk:'#uch-sverka,#uch-fakt'},
 {t:'Антирейтинг', cel:'page:pgAntireiting',
  txt:['Баллы ставит программа сама, ночью, за нарушения. Балл живёт 90 дней и сгорает сам. '
      +'До 30 сентября идёт проверка, 1 октября — амнистия: счёт обнулится, и дальше всё всерьёз.',
       'Вас касаются: прогул — 10 баллов; касса не закрыта до 06:00 следующего дня — балл кассиру смены; '
      +'просроченная задача в Битриксе — балл. За неоткрытую к 10:00 кассу стримерам балл не ставится.'],
  zad:'Откройте «Антирейтинг».', tyk:'#n-pgAntireiting,#m-pgAntireiting,#s-pgAntireiting'},
 {t:'Правила и погода', cel:'act:pravila',
  txt:['Во вкладке «Правила» — за что и сколько баллов и за что балла нет. Погода показывает счёт: '
      +'☀️ ясно — 0 баллов, ⛅ облачно — 1–5, 🌧️ моросит — 6–14, ☔ зонт обязателен — 15–29, '
      +'⛈️ штормовое предупреждение — 30 и больше.'],
  zad:'Откройте вкладку «Правила».', tyk:'#uch-ar-pravila'},
 {t:'Если балл не по делу', cel:'act:osporil',
  txt:['На «Погоде», в «Моей истории», у балла есть кнопка «Оспорить». Напишите причину одной строкой — '
      +'руководитель или администратор посмотрит и снимет, если так. Пока балл не сняли, он считается.'],
  zad:'Вернитесь на «Погоду», нажмите «Оспорить» у балла за 11 сентября и отправьте причину.',
  tyk:'#uch-osp-send,#uch-osporit-0,#uch-ar-pogoda'},
 {t:'Достижения', cel:'page:pgAchivki',
  txt:['Здесь награды за хорошую работу: лучшие продажи, план, средний чек, UPT, рекорды, стаж, дисциплина. '
      +'Их выдаёт программа сама по цифрам учёта, особые — вручает руководство. У каждой награды своя статуэтка '
      +'с именем: «Вега», «Десятка», «Слиток дня» — её видно на полке и в расшифровке.',
       'Победителя месяца определяет сводный индекс в баллах: план, средний чек и UPT поровну, дисциплина по антирейтингу — на втором месте. '
      +'Поэтому большая точка не выигрывает просто потому, что большая. Как он считается и откуда берётся металл '
      +'статуэтки — во вкладке «Правила».',
       'За обучение награды тоже есть: «Букварь» — за первый сданный курс, «Сова» — по одной за каждый курс, '
      +'они копятся на полке стопкой. Один курс — одна «Сова», пересдача второй не даёт. Выдаются не сразу, '
      +'а ночным расчётом, наутро. Курс засчитывается тому, под кем вы вошли в обучение из Битрикса, — '
      +'поэтому чужой ссылкой на курс лучше не пользоваться: сдача запишется не на вас.'],
  zad:'Откройте «Достижения».', tyk:'#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Профиль и награды', cel:'act:achprofil',
  txt:['Нажмите на человека — откроется его карточка. В шапке три плитки: сколько наград, стаж и день рождения. '
      +'Стаж там настоящий, от даты приёма — «1 год 3 месяца»; а строка «Стаж в FBSM · 1 год» ниже, в «Пути», — '
      +'это ступень награды, и числа у них разные. Под шапкой счётчик: сколько видов наград собрано из тех, что доступны '
      +'по должности. «Путь» — лестницы с полоской и подписью, какая ступень следующая. «Рекорды» — только личные: крупно само значение рекорда, '
      +'под ним дата и прежний результат, и сколько раз он бит. Рекордов вообще два уровня: свои личные — лучший '
      +'день, лучший месяц, задачи в срок, — и рекорды сети за день: продажи, чеки, товары. Рекорд сети держит '
      +'один человек на всю сеть, и в карточке он стоит кубком на полке: «Комета», «Кассовый аппарат», «Караван». '
      +'Рекорда сети за месяц не бывает. «Полка наград» — все статуэтки, одинаковые стоят стопкой с ×N. '
      +'Нажатие на любую из них — из «Пути», из «Рекордов», с полки, с пыльной полки — открывает одну и ту же '
      +'карточку награды; на телефоне она во весь экран.',
       'Ниже — «Пыльная полка»: антикубки стоят такими же кубками, как награды, а под кубком серым — сколько ещё '
      +'простоят. Они временные и в счётчик наград не входят. Антикубки бывают трёх пород. Погодные — '
      +'«Дырявый зонт» и «Громоотвод» — приходят от погоды антирейтинга (15 и 30 штрафных баллов) и уходят, когда '
      +'счёт опустится. За поведение программа ставит ночью сама, по действующим баллам за последние 30 дней: '
      +'«Сонная муха» — три опоздания, «Разбитая копилка» — три незакрытые в день смены кассы, «Кривое зеркало» — '
      +'три правки задним числом, «Грабли» — четыре одинаковых нарушения. У них видно, по какой день антикубок '
      +'простоит, если новых нарушений не будет; новое нарушение того же вида этот день сдвигает. Больше одного '
      +'такого сразу не бывает. Остальные вручает руководство на срок от 1 до 30 дней — '
      +'и те же четыре тоже можно вручить руками, тогда у них будет срок. В карточке антикубка написано прямо: '
      +'на зарплату и награды он не влияет.'],
  zad:'Откройте профиль Александры Забабуриной.', tyk:'#uch-ach-p-0,#uch-ach-lyudi'},
 {t:'Поделиться наградой', cel:'act:achpodel',
  txt:['В карточке награды сверху крупная статуэтка, её имя и название награды, а описание — двумя фразами: '
      +'за что она даётся и что это за вещь («Награда из серебра в форме подковы с гвоздями, постамент — кузнечная сталь»). '
      +'Ниже дата, прогресс — «ступень 2 из 6 · дальше — «100 смен»» у лестниц, «до золота — ещё 3» у рекордов — '
      +'и синяя ссылка внизу: «Все даты» или «Пройденные ступени».',
       'У своей награды есть «📤 Поделиться»: программа рисует открытку 1080×1350 — статуэтка, награда, обе фразы, '
      +'имя и дата. Личных сумм на ней нет. О новой награде программа и так пишет в общий чат Битрикса: '
      +'«Статуэтка «Вега». Награда из горного хрусталя в форме…»; про антикубок текст другой — он «ставит на полку» '
      +'и уходит по сроку или с погодой.'],
  zad:'Откройте первую статуэтку на полке и нажмите «Поделиться».',
  tyk:'#uch-ach-podelitsya,#uch-ach-n-0,#uch-ach-p-0,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Ордена', cel:'act:achorden',
  txt:['Вкладка «Ордена» — все награды компании по категориям, теми же статуэтками, что стоят на полке. '
      +'Цифра в синем кружке и стопка позади — у СКОЛЬКИХ ЧЕЛОВЕК эта награда есть. Это не то же самое, '
      +'что ×N в карточке сотрудника: там ×N — сколько раз получил он сам.',
       'Серые, обесцвеченные — награды, которых пока нет ни у кого; «скоро» — ещё не запущенные. Антикубки идут '
      +'последней категорией, красным, в пунктирной рамке, и серыми не бывают. Нажмите на статуэтку — откроется '
      +'орден: те же две фразы — за что награда и что это за вещь, у рекордов — линейка, как растёт металл '
      +'(и строка «Металл растёт с числом наград»), у лестниц — все ступени и кто на них. '
      +'У стажа ступень появляется каждый год, а металл меняется реже: несколько соседних лет стоят в одном металле '
      +'и с одной статуэткой.'],
  zad:'Откройте вкладку «Ордена» и нажмите первую статуэтку.',
  tyk:'#uch-ach-ord-0,#uch-ach-ordena,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Хоз. заявка', otkryt:'pgHozZayavka', cel:'act:hoz_zayavka',
  txt:['Не хватает чего-то для работы или что-то сломалось — вкладка «🧰 Хоз. заявка». Каждую позицию '
      +'пишите с новой строки, при желании приложите фото и отметьте «Срочно». Заявка сразу уходит руководителю АХО — писать ему в личку не нужно.',
       'Заявка идёт от вашего магазина или отдела. Ниже видно, что ещё в работе и что ответил руководитель АХО, а в «Закрыто за неделю» — '
      +'что сделано и что не будет и почему. Уже есть в работе — повторять не нужно.'],
  zad:'Напишите заявку и нажмите «Отправить заявку».', tyk:'#uch-hoz,#uch-hoz-btn'},
 {t:'Что нового', cel:'page:pgChangelog',
  txt:['Программа меняется часто. Что поменялось — человеческими словами, по датам — на странице «Что нового». '
      +'Она открывается щелчком по строке версии внизу бокового меню, а на телефоне — внизу листа «Ещё». '
      +'Сверху там номер версии: если он старее, чем у коллег, закройте вкладку и откройте заново.'],
  zad:'Щёлкните по строке версии внизу меню.', tyk:'#n-pgChangelog,#m-pgChangelog,#s-pgChangelog,#sb-ver,#ms-ver'},],

streammgr:[
 {t:'Чем эта должность отличается',
  txt:['Вы не продаёте сами и продажи не подтверждаете. Ваша работа — чтобы продавали '
      +'стримеры, и зарплата считается от их результата.',
       'Смены вы отмечаете сами кнопками «Пришёл / Ушёл» на странице «Смена», из них считается зарплата.'],
  zad:'Прочитайте и нажмите «Дальше».'},
 {t:'Отчёт за день', cel:'page:pgOtchet',
  txt:['Ежедневный отчёт теперь сдаётся здесь, в программе, а не в Битриксе. Он сразу уходит руководству в Telegram.',
       'Без отчёта рабочий день не засчитывается в зарплату, а без него не завершить смену. Забыли сдать - отчёт можно сдать за любой из последних 40 дней: '
      +'вверху список несданных дней, внизу выбор даты. Такой отчёт придёт руководителю на проверку, и день засчитает он.'],
  zad:'Откройте «Отчёт за день».', tyk:'#n-pgOtchet,#m-pgOtchet,#s-pgOtchet'},
 {t:'Сдайте отчёт', cel:'act:otchet_ofisa',
  txt:['Обязательно только «Что сделано за день»: пишите конкретно — что сделано и чем закончилось. '
      +'Планы и проблемы — по желанию; проблемы руководство читает в первую очередь.'],
  zad:'Напишите, что сделано, и нажмите «Сдать отчёт».', tyk:'#uch-otc,#uch-otc-btn'},
 {t:'Ваша зарплата', otkryt:'pgEfirZP', cel:'page:pgEfirZP',
  txt:['С ноября оклад считается по времени: 250 000 делится на норму рабочих дней месяца и умножается на часы, поделённые на 9. '
      +'Переработка оплачивается, короткий день считается частью. Сверху 1 % от продаж стримеров вашего подразделения.'],
  zad:'Откройте «Моя ЗП» и посмотрите, с чьих эфиров идёт процент.', tyk:'#n-pgEfirZP,#m-pgEfirZP'},
 {t:'Если список пуст',
  txt:['Внизу страницы зарплаты перечислены стримеры, с которых идёт процент. Если там '
      +'пусто — в вашей карточке указано не то подразделение, и процент выйдет нулевым.',
       'Это особенно важно, если вы сидите в офисе, а ведёте эфиры магазина: '
      +'подразделение для процента указывается отдельно.'],
  zad:'Запомните это и нажмите «Дальше».'},
 {t:'График', otkryt:'pgSchedule', cel:'page:pgSchedule',
  txt:['С сентября ваши смены — это отметки кнопкой «Пришёл / Ушёл» на странице «Смена»: нет отметок — нет оклада. '
      +'План на будущие дни ставьте в графике сами; сегодня и прошлое правит руководитель.'],
  zad:'Откройте «График».', tyk:'#n-pgSchedule,#s-pgSchedule'},
 {t:'Ваш расчётный лист', otkryt:'pgMoiList', cel:'page:pgMoiList',
  txt:['Начиная с 6-го числа здесь лежит лист за прошлый месяц — и за все более ранние. '
      +'Это тот же лист, что видит бухгалтер: оклад, проценты, бонусы, аванс, '
      +'пенсионные, ИПН, ВОСМС, штрафы и итог к выплате.',
       'Над листом — пометка. Зелёная: месяц закрыт, суммы окончательные. Жёлтая: '
      +'бухгалтер ещё может внести правки.'],
  zad:'Откройте «Мой расчётный лист».', tyk:'#n-pgMoiList,#m-pgMoiList,#s-pgMoiList'},
 {t:'Откройте сам лист', otkryt:'pgMoiList', cel:'act:moilist',
  txt:['Выберите месяц и нажмите кнопку. Лист можно распечатать или отправить себе '
      +'в WhatsApp — пересылать его вам больше не нужно.'],
  zad:'Нажмите «Открыть расчётный лист».', tyk:'#ml-btn'},

 {t:'Отчёт магазина и касса', cel:'page:pgShopReport',
  txt:['В Алматы отчёт магазина вместе со сверкой кассы сдаёт менеджер по эфирам. Выручка, чеки '
      +'и позиции — из 1С, их не правят.',
       'Утром первым делом — «Ответственность за магазин принята?» сверху отчёта. Всё в порядке — «Да». Беспорядок от прошлой смены — «Нет» до 11:00: отметьте пункты, у каждого что не так и фото; прошлой смене по 3 штрафных балла. Промолчали — магазин ваш: беспорядок, который потом найдёт руководство, — по баллу за каждый пункт каждому на смене.',
       'Вечером у каждого пункта чек-листа — галочка или причина, почему не сделано: без причины отчёт не отправится. Возвраты приходят из 1С сами.'],
  zad:'Откройте «Отчёт магазина».', tyk:'#n-pgShopReport,#m-pgShopReport,#s-pgShopReport'},
 {t:'Сверка кассы', cel:'act:sverka',
  txt:['Впишите, сколько наличных фактически в кассе, и нажмите «Сверить и отправить». Не сошлось — '
      +'выберите причину: расхождение уйдёт бухгалтеру, и смена не закроется, пока он его не подтвердит.',
       'После принятой сверки снимите Z-отчёт и закройте смену. Закрыть кассу нужно до 06:00 следующего дня — '
      +'ночная смена укладывается; не закрыта — балл кассиру смены. Открыть кассу нужно к 10:00: не открыта — '
      +'по баллу всем на смене, кроме стримеров.'],
  zad:'Впишите сумму в «Фактически в кассе» и нажмите «Сверить и отправить».', tyk:'#uch-sverka,#uch-fakt'},
 {t:'Заявка на хоз. нужды', otkryt:'pgShopReport', cel:'act:hoz_zayavka',
  txt:['Не хватает пакетов, вешалок или что-то сломалось — внизу «Отчёта магазина» есть блок «Заявка на хоз. нужды». '
      +'Напишите, что нужно — каждую позицию с новой строки, при желании приложите фото и отметьте «Срочно». Заявка сразу уходит '
      +'руководителю АХО — писать ему в личку не нужно. Отчёт для этого сдавать не надо: заявку можно отправить в любое время дня.',
       'Ниже видно, что из заявок магазина ещё в работе и что ответил руководитель АХО, а в «Закрыто за неделю» — что сделано '
      +'и что не будет и почему. Если пишете то, что уже в работе, программа подскажет — повторять не нужно.'],
  zad:'Напишите заявку и нажмите «Отправить заявку».', tyk:'#uch-hoz,#uch-hoz-btn'},
 {t:'Антирейтинг', cel:'page:pgAntireiting',
  txt:['Баллы ставит программа сама, ночью, за нарушения. Балл живёт 90 дней и сгорает сам. '
      +'До 30 сентября идёт проверка, 1 октября — амнистия: счёт обнулится, и дальше всё всерьёз.',
       'Вас касаются: прогул — 10 баллов; отчёт магазина сдан позже 09:00 следующего утра — по баллу всем на смене; '
      +'касса не закрыта до 06:00 следующего дня — балл кассиру; касса не открыта к 10:00 — по баллу всем '
      +'на смене; просроченная задача в Битриксе — балл.'],
  zad:'Откройте «Антирейтинг».', tyk:'#n-pgAntireiting,#m-pgAntireiting,#s-pgAntireiting'},
 {t:'Правила и погода', cel:'act:pravila',
  txt:['Во вкладке «Правила» — за что и сколько баллов и за что балла нет. Погода показывает счёт: '
      +'☀️ ясно — 0 баллов, ⛅ облачно — 1–5, 🌧️ моросит — 6–14, ☔ зонт обязателен — 15–29, '
      +'⛈️ штормовое предупреждение — 30 и больше.'],
  zad:'Откройте вкладку «Правила».', tyk:'#uch-ar-pravila'},
 {t:'Если балл не по делу', cel:'act:osporil',
  txt:['На «Погоде», в «Моей истории», у балла есть кнопка «Оспорить». Напишите причину одной строкой — '
      +'руководитель или администратор посмотрит и снимет, если так. Пока балл не сняли, он считается.'],
  zad:'Вернитесь на «Погоду», нажмите «Оспорить» у балла за 11 сентября и отправьте причину.',
  tyk:'#uch-osp-send,#uch-osporit-0,#uch-ar-pogoda'},
 {t:'Достижения', cel:'page:pgAchivki',
  txt:['Здесь награды за хорошую работу: лучшие продажи, план, средний чек, UPT, рекорды, стаж, дисциплина. '
      +'Их выдаёт программа сама по цифрам учёта, особые — вручает руководство. У каждой награды своя статуэтка '
      +'с именем: «Вега», «Десятка», «Слиток дня» — её видно на полке и в расшифровке.',
       'Победителя месяца определяет сводный индекс в баллах: план, средний чек и UPT поровну, дисциплина по антирейтингу — на втором месте. '
      +'Поэтому большая точка не выигрывает просто потому, что большая. Как он считается и откуда берётся металл '
      +'статуэтки — во вкладке «Правила».',
       'За обучение награды тоже есть: «Букварь» — за первый сданный курс, «Сова» — по одной за каждый курс, '
      +'они копятся на полке стопкой. Один курс — одна «Сова», пересдача второй не даёт. Выдаются не сразу, '
      +'а ночным расчётом, наутро. Курс засчитывается тому, под кем вы вошли в обучение из Битрикса, — '
      +'поэтому чужой ссылкой на курс лучше не пользоваться: сдача запишется не на вас.'],
  zad:'Откройте «Достижения».', tyk:'#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Профиль и награды', cel:'act:achprofil',
  txt:['Нажмите на человека — откроется его карточка. В шапке три плитки: сколько наград, стаж и день рождения. '
      +'Стаж там настоящий, от даты приёма — «1 год 3 месяца»; а строка «Стаж в FBSM · 1 год» ниже, в «Пути», — '
      +'это ступень награды, и числа у них разные. Под шапкой счётчик: сколько видов наград собрано из тех, что доступны '
      +'по должности. «Путь» — лестницы с полоской и подписью, какая ступень следующая. «Рекорды» — только личные: крупно само значение рекорда, '
      +'под ним дата и прежний результат, и сколько раз он бит. Рекордов вообще два уровня: свои личные — лучший '
      +'день, лучший месяц, задачи в срок, — и рекорды сети за день: продажи, чеки, товары. Рекорд сети держит '
      +'один человек на всю сеть, и в карточке он стоит кубком на полке: «Комета», «Кассовый аппарат», «Караван». '
      +'Рекорда сети за месяц не бывает. «Полка наград» — все статуэтки, одинаковые стоят стопкой с ×N. '
      +'Нажатие на любую из них — из «Пути», из «Рекордов», с полки, с пыльной полки — открывает одну и ту же '
      +'карточку награды; на телефоне она во весь экран.',
       'Ниже — «Пыльная полка»: антикубки стоят такими же кубками, как награды, а под кубком серым — сколько ещё '
      +'простоят. Они временные и в счётчик наград не входят. Антикубки бывают трёх пород. Погодные — '
      +'«Дырявый зонт» и «Громоотвод» — приходят от погоды антирейтинга (15 и 30 штрафных баллов) и уходят, когда '
      +'счёт опустится. За поведение программа ставит ночью сама, по действующим баллам за последние 30 дней: '
      +'«Сонная муха» — три опоздания, «Разбитая копилка» — три незакрытые в день смены кассы, «Кривое зеркало» — '
      +'три правки задним числом, «Грабли» — четыре одинаковых нарушения. У них видно, по какой день антикубок '
      +'простоит, если новых нарушений не будет; новое нарушение того же вида этот день сдвигает. Больше одного '
      +'такого сразу не бывает. Остальные вручает руководство на срок от 1 до 30 дней — '
      +'и те же четыре тоже можно вручить руками, тогда у них будет срок. В карточке антикубка написано прямо: '
      +'на зарплату и награды он не влияет.'],
  zad:'Откройте профиль Александры Забабуриной.', tyk:'#uch-ach-p-0,#uch-ach-lyudi'},
 {t:'Поделиться наградой', cel:'act:achpodel',
  txt:['В карточке награды сверху крупная статуэтка, её имя и название награды, а описание — двумя фразами: '
      +'за что она даётся и что это за вещь («Награда из серебра в форме подковы с гвоздями, постамент — кузнечная сталь»). '
      +'Ниже дата, прогресс — «ступень 2 из 6 · дальше — «100 смен»» у лестниц, «до золота — ещё 3» у рекордов — '
      +'и синяя ссылка внизу: «Все даты» или «Пройденные ступени».',
       'У своей награды есть «📤 Поделиться»: программа рисует открытку 1080×1350 — статуэтка, награда, обе фразы, '
      +'имя и дата. Личных сумм на ней нет. О новой награде программа и так пишет в общий чат Битрикса: '
      +'«Статуэтка «Вега». Награда из горного хрусталя в форме…»; про антикубок текст другой — он «ставит на полку» '
      +'и уходит по сроку или с погодой.'],
  zad:'Откройте первую статуэтку на полке и нажмите «Поделиться».',
  tyk:'#uch-ach-podelitsya,#uch-ach-n-0,#uch-ach-p-0,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Ордена', cel:'act:achorden',
  txt:['Вкладка «Ордена» — все награды компании по категориям, теми же статуэтками, что стоят на полке. '
      +'Цифра в синем кружке и стопка позади — у СКОЛЬКИХ ЧЕЛОВЕК эта награда есть. Это не то же самое, '
      +'что ×N в карточке сотрудника: там ×N — сколько раз получил он сам.',
       'Серые, обесцвеченные — награды, которых пока нет ни у кого; «скоро» — ещё не запущенные. Антикубки идут '
      +'последней категорией, красным, в пунктирной рамке, и серыми не бывают. Нажмите на статуэтку — откроется '
      +'орден: те же две фразы — за что награда и что это за вещь, у рекордов — линейка, как растёт металл '
      +'(и строка «Металл растёт с числом наград»), у лестниц — все ступени и кто на них. '
      +'У стажа ступень появляется каждый год, а металл меняется реже: несколько соседних лет стоят в одном металле '
      +'и с одной статуэткой.'],
  zad:'Откройте вкладку «Ордена» и нажмите первую статуэтку.',
  tyk:'#uch-ach-ord-0,#uch-ach-ordena,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Что нового', cel:'page:pgChangelog',
  txt:['Программа меняется часто. Что поменялось — человеческими словами, по датам — на странице «Что нового». '
      +'Она открывается щелчком по строке версии внизу бокового меню, а на телефоне — внизу листа «Ещё». '
      +'Сверху там номер версии: если он старее, чем у коллег, закройте вкладку и откройте заново.'],
  zad:'Щёлкните по строке версии внизу меню.', tyk:'#n-pgChangelog,#m-pgChangelog,#s-pgChangelog,#sb-ver,#ms-ver'},],

runner:[
 {t:'Начало смены', otkryt:'pgRunner', cel:'act:prihod',
  txt:['Ваш день считается по времени между началом и концом смены. Отмечайтесь '
      +'с телефона, прямо на месте, когда пришли.'],
  zad:'Нажмите «Начать смену».', tyk:'#uch-nachat'},
 {t:'Конец смены', otkryt:'pgRunner', cel:'act:uhod',
  txt:['Уходя - «Завершить смену». Программа день сама не завершает: не нажали «Ушёл» - день не засчитывается в зарплату.',
       'Бот напоминает: через 10 минут после начала рабочего дня, если не нажат «Пришёл», и через 10 минут после его конца, если не нажат «Ушёл»; '
      +'в 23:00 - что день не завершён. Исправить незавершённый день можно до 09:00 следующего дня: на странице «Смена» впишите, во сколько ушли. '
      +'Это нарушение (штрафной балл), и время вступит в силу после подтверждения руководителем. Пропущенные и прошедшие дни исправляет только руководитель.'],
  zad:'Нажмите «Завершить смену».', tyk:'#uch-zavershit'},
 {t:'История смен', cel:'page:pgRunnerHist',
  txt:['Здесь все ваши смены. Жёлтым - дни на проверке у управляющего: пока он не решил, '
      +'в зарплату такой день не попадёт. Дни без «Ушёл» помечены «не закрыта» и не засчитаны.'],
  zad:'Откройте «История».', tyk:'#n-pgRunnerHist,#m-pgRunnerHist,#s-pgRunnerHist'},
 {t:'Поправьте время смены', cel:'act:pravka',
  txt:['Ошиблись со временем - у сегодняшней смены есть ✏️. Впишите настоящее время и отправьте: правка уходит управляющему на проверку, '
      +'в зарплату день попадёт сразу, но пока не подтвердят, сумма может измениться.',
       'Прошедшие дни вы не правите. Вчерашний день без «Ушёл» исправляется на странице «Смена» до 09:00 (со штрафным баллом), '
      +'остальное исправляет руководитель - напишите ему.'],
  zad:'Нажмите ✏️ у сегодняшней смены, затем «Отправить на проверку».', tyk:'#uch-hist-0'},
 {t:'Моя зарплата', cel:'page:pgRunnerZP',
  txt:['Полная смена равна смене вашего магазина: в Алматы 12 часов, в остальных магазинах 10. Платится отработанное время с шагом 15 минут, и меньше смены, и больше: '
      +'при смене 10 часов 12 часов дают 12/10 ставки. Не нажали «Ушёл» - день не засчитывается в зарплату.'],
  zad:'Откройте «Моя ЗП».', tyk:'#n-pgRunnerZP,#m-pgRunnerZP,#s-pgRunnerZP'},
 {t:'График', cel:'page:pgSchedule',
  txt:['График показывает, когда вы должны выйти, — его ставит управляющий. '
      +'Засчитываются же смены по вашим отметкам начала и конца.'],
  zad:'Откройте «График».', tyk:'#n-pgSchedule,#m-pgSchedule,#s-pgSchedule'},
 {t:'Ваш расчётный лист', cel:'page:pgMoiList',
  txt:['Начиная с 6-го числа здесь лежит лист за прошлый месяц — и за все более ранние. '
      +'Это тот же лист, что видит бухгалтер: начисления, аванс, пенсионные, ИПН, ВОСМС, '
      +'штрафы и итог к выплате.',
       'Над листом — пометка. Зелёная: месяц закрыт, суммы окончательные. Жёлтая: '
      +'бухгалтер ещё может внести правки.'],
  zad:'Откройте «Мой расчётный лист».', tyk:'#n-pgMoiList,#m-pgMoiList,#s-pgMoiList'},
 {t:'Откройте сам лист', otkryt:'pgMoiList', cel:'act:moilist',
  txt:['Выберите месяц и нажмите кнопку. Лист можно распечатать или отправить себе '
      +'в WhatsApp — пересылать его вам больше не нужно.'],
  zad:'Нажмите «Открыть расчётный лист».', tyk:'#ml-btn'},

 {t:'Антирейтинг', cel:'page:pgAntireiting',
  txt:['Баллы ставит программа сама, ночью, за нарушения. Балл живёт 90 дней и сгорает сам. '
      +'До 30 сентября идёт проверка, 1 октября — амнистия: счёт обнулится, и дальше всё всерьёз.',
       'Вас касаются: прогул — 10 баллов; смена без нажатой кнопки начала или конца (в правилах — «Пришёл» / '
      +'«Ушёл»), в том числе день без «Ушёл», и отметка, исправленная задним числом больше чем на 5 минут, — '
      +'по баллу; просроченная задача в Битриксе — балл.'],
  zad:'Откройте «Антирейтинг».', tyk:'#n-pgAntireiting,#m-pgAntireiting,#s-pgAntireiting'},
 {t:'Правила и погода', cel:'act:pravila',
  txt:['Во вкладке «Правила» — за что и сколько баллов и за что балла нет. Погода показывает счёт: '
      +'☀️ ясно — 0 баллов, ⛅ облачно — 1–5, 🌧️ моросит — 6–14, ☔ зонт обязателен — 15–29, '
      +'⛈️ штормовое предупреждение — 30 и больше.'],
  zad:'Откройте вкладку «Правила».', tyk:'#uch-ar-pravila'},
 {t:'Если балл не по делу', cel:'act:osporil',
  txt:['На «Погоде», в «Моей истории», у балла есть кнопка «Оспорить». Напишите причину одной строкой — '
      +'руководитель или администратор посмотрит и снимет, если так. Пока балл не сняли, он считается.'],
  zad:'Вернитесь на «Погоду», нажмите «Оспорить» у балла за 11 сентября и отправьте причину.',
  tyk:'#uch-osp-send,#uch-osporit-0,#uch-ar-pogoda'},
 {t:'Достижения', cel:'page:pgAchivki',
  txt:['Здесь награды за хорошую работу: лучшие продажи, план, средний чек, UPT, рекорды, стаж, дисциплина. '
      +'Их выдаёт программа сама по цифрам учёта, особые — вручает руководство. У каждой награды своя статуэтка '
      +'с именем: «Вега», «Десятка», «Слиток дня» — её видно на полке и в расшифровке.',
       'Победителя месяца определяет сводный индекс в баллах: план, средний чек и UPT поровну, дисциплина по антирейтингу — на втором месте. '
      +'Поэтому большая точка не выигрывает просто потому, что большая. Как он считается и откуда берётся металл '
      +'статуэтки — во вкладке «Правила».',
       'За обучение награды тоже есть: «Букварь» — за первый сданный курс, «Сова» — по одной за каждый курс, '
      +'они копятся на полке стопкой. Один курс — одна «Сова», пересдача второй не даёт. Выдаются не сразу, '
      +'а ночным расчётом, наутро. Курс засчитывается тому, под кем вы вошли в обучение из Битрикса, — '
      +'поэтому чужой ссылкой на курс лучше не пользоваться: сдача запишется не на вас.'],
  zad:'Откройте «Достижения».', tyk:'#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Профиль и награды', cel:'act:achprofil',
  txt:['Нажмите на человека — откроется его карточка. В шапке три плитки: сколько наград, стаж и день рождения. '
      +'Стаж там настоящий, от даты приёма — «1 год 3 месяца»; а строка «Стаж в FBSM · 1 год» ниже, в «Пути», — '
      +'это ступень награды, и числа у них разные. Под шапкой счётчик: сколько видов наград собрано из тех, что доступны '
      +'по должности. «Путь» — лестницы с полоской и подписью, какая ступень следующая. «Рекорды» — только личные: крупно само значение рекорда, '
      +'под ним дата и прежний результат, и сколько раз он бит. Рекордов вообще два уровня: свои личные — лучший '
      +'день, лучший месяц, задачи в срок, — и рекорды сети за день: продажи, чеки, товары. Рекорд сети держит '
      +'один человек на всю сеть, и в карточке он стоит кубком на полке: «Комета», «Кассовый аппарат», «Караван». '
      +'Рекорда сети за месяц не бывает. «Полка наград» — все статуэтки, одинаковые стоят стопкой с ×N. '
      +'Нажатие на любую из них — из «Пути», из «Рекордов», с полки, с пыльной полки — открывает одну и ту же '
      +'карточку награды; на телефоне она во весь экран.',
       'Ниже — «Пыльная полка»: антикубки стоят такими же кубками, как награды, а под кубком серым — сколько ещё '
      +'простоят. Они временные и в счётчик наград не входят. Антикубки бывают трёх пород. Погодные — '
      +'«Дырявый зонт» и «Громоотвод» — приходят от погоды антирейтинга (15 и 30 штрафных баллов) и уходят, когда '
      +'счёт опустится. За поведение программа ставит ночью сама, по действующим баллам за последние 30 дней: '
      +'«Сонная муха» — три опоздания, «Разбитая копилка» — три незакрытые в день смены кассы, «Кривое зеркало» — '
      +'три правки задним числом, «Грабли» — четыре одинаковых нарушения. У них видно, по какой день антикубок '
      +'простоит, если новых нарушений не будет; новое нарушение того же вида этот день сдвигает. Больше одного '
      +'такого сразу не бывает. Остальные вручает руководство на срок от 1 до 30 дней — '
      +'и те же четыре тоже можно вручить руками, тогда у них будет срок. В карточке антикубка написано прямо: '
      +'на зарплату и награды он не влияет.'],
  zad:'Откройте профиль Александры Забабуриной.', tyk:'#uch-ach-p-0,#uch-ach-lyudi'},
 {t:'Поделиться наградой', cel:'act:achpodel',
  txt:['В карточке награды сверху крупная статуэтка, её имя и название награды, а описание — двумя фразами: '
      +'за что она даётся и что это за вещь («Награда из серебра в форме подковы с гвоздями, постамент — кузнечная сталь»). '
      +'Ниже дата, прогресс — «ступень 2 из 6 · дальше — «100 смен»» у лестниц, «до золота — ещё 3» у рекордов — '
      +'и синяя ссылка внизу: «Все даты» или «Пройденные ступени».',
       'У своей награды есть «📤 Поделиться»: программа рисует открытку 1080×1350 — статуэтка, награда, обе фразы, '
      +'имя и дата. Личных сумм на ней нет. О новой награде программа и так пишет в общий чат Битрикса: '
      +'«Статуэтка «Вега». Награда из горного хрусталя в форме…»; про антикубок текст другой — он «ставит на полку» '
      +'и уходит по сроку или с погодой.'],
  zad:'Откройте первую статуэтку на полке и нажмите «Поделиться».',
  tyk:'#uch-ach-podelitsya,#uch-ach-n-0,#uch-ach-p-0,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Ордена', cel:'act:achorden',
  txt:['Вкладка «Ордена» — все награды компании по категориям, теми же статуэтками, что стоят на полке. '
      +'Цифра в синем кружке и стопка позади — у СКОЛЬКИХ ЧЕЛОВЕК эта награда есть. Это не то же самое, '
      +'что ×N в карточке сотрудника: там ×N — сколько раз получил он сам.',
       'Серые, обесцвеченные — награды, которых пока нет ни у кого; «скоро» — ещё не запущенные. Антикубки идут '
      +'последней категорией, красным, в пунктирной рамке, и серыми не бывают. Нажмите на статуэтку — откроется '
      +'орден: те же две фразы — за что награда и что это за вещь, у рекордов — линейка, как растёт металл '
      +'(и строка «Металл растёт с числом наград»), у лестниц — все ступени и кто на них. '
      +'У стажа ступень появляется каждый год, а металл меняется реже: несколько соседних лет стоят в одном металле '
      +'и с одной статуэткой.'],
  zad:'Откройте вкладку «Ордена» и нажмите первую статуэтку.',
  tyk:'#uch-ach-ord-0,#uch-ach-ordena,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Хоз. заявка', otkryt:'pgHozZayavka', cel:'act:hoz_zayavka',
  txt:['Не хватает чего-то для работы или что-то сломалось — вкладка «🧰 Хоз. заявка». Каждую позицию '
      +'пишите с новой строки, при желании приложите фото и отметьте «Срочно». Заявка сразу уходит руководителю АХО — писать ему в личку не нужно.',
       'Заявка идёт от вашего магазина или отдела. Ниже видно, что ещё в работе и что ответил руководитель АХО, а в «Закрыто за неделю» — '
      +'что сделано и что не будет и почему. Уже есть в работе — повторять не нужно.'],
  zad:'Напишите заявку и нажмите «Отправить заявку».', tyk:'#uch-hoz,#uch-hoz-btn'},
 {t:'Что нового', cel:'page:pgChangelog',
  txt:['Программа меняется часто. Что поменялось — человеческими словами, по датам — на странице «Что нового». '
      +'Она открывается щелчком по строке версии внизу бокового меню, а на телефоне — внизу листа «Ещё». '
      +'Сверху там номер версии: если он старее, чем у коллег, закройте вкладку и откройте заново.'],
  zad:'Щёлкните по строке версии внизу меню.', tyk:'#n-pgChangelog,#m-pgChangelog,#s-pgChangelog,#sb-ver,#ms-ver'},],

accountant:[
 {t:'Начисление', otkryt:'pgPayroll',
  txt:['Ведомость собирается сама: продажи из 1С, смены из графика и отметок, сетка '
      +'из параметров. Ваше дело — проверить и внести корректировки.',
       'Отдельный блок наверху — «🚚 Руководитель АХО»: оклад 615 000 ₸ делится на норму рабочих дней '
      +'и умножается на дни из графика склада; отмечаться ему не нужно.',
       'Следом три блока свободного посещения: «🧮 Бухгалтеры» — 425 540 ₸, «🧑‍💼 HR-менеджеры» — 300 000 ₸ '
      +'и «📣 SMM-менеджеры» — 200 000 ₸. У них нет ни графика, ни отметок, ни смен: оклад за месяц платится '
      +'целиком, и колонки «Смен» в этих блоках нет вовсе.',
       'У HR сверху оклада — премия за вакансии: сверх пяти по 40 000 ₸, и только за подтверждённые главным '
      +'администратором. Красная строка «ждут решения N — в премию не идут» значит, что он ещё не решил '
      +'по всем карточкам: напомните, иначе человек получит один оклад.'],
  zad:'Осмотрите ведомость и нажмите «Дальше».'},
 {t:'Отчёт за день', cel:'page:pgOtchet',
  txt:['Ежедневный отчёт теперь сдаётся здесь, в программе, а не в Битриксе. Он сразу уходит руководству в Telegram.',
       'Без отчёта рабочий день не засчитывается в зарплату. Забыли сдать - отчёт можно сдать за любой из последних 40 дней: '
      +'вверху список несданных дней, внизу выбор даты. Такой отчёт придёт руководителю на проверку, и день засчитает он.'],
  zad:'Откройте «Отчёт за день».', tyk:'#n-pgOtchet,#m-pgOtchet,#s-pgOtchet'},
 {t:'Сдайте отчёт', cel:'act:otchet_ofisa',
  txt:['Обязательно только «Что сделано за день»: пишите конкретно — что сделано и чем закончилось. '
      +'Планы и проблемы — по желанию; проблемы руководство читает в первую очередь.'],
  zad:'Напишите, что сделано, и нажмите «Сдать отчёт».', tyk:'#uch-otc,#uch-otc-btn'},
 {t:'Сначала предупреждения', otkryt:'pgPayroll',
  txt:['Над ведомостью — то, что мешает выплате: оплаченные дни без отметки в графике, '
      +'неподписанный график, смены на проверке. Разберите их до выплаты: за каждым '
      +'стоит чья-то неверная сумма.'],
  zad:'Прочитайте предупреждения и нажмите «Дальше».'},
 {t:'Корректировка', cel:'act:korr',
  txt:['💵 — аванс, пенсионные, ИПН, ВОСМС, штрафы и премия. Там же можно переписать '
      +'смены и сумму продаж, если программа посчитала не так.',
       'Внизу окна — серый блок «Вычеты по журналу»: за месяц, перенос с прошлых месяцев и сколько всего '
      +'к удержанию. Руками эти суммы не вводятся, они приходят из раздела «Вычеты из ЗП».',
       'У бухгалтеров, HR и SMM окно короче: полей «Смен» и «Скорректированная сумма продаж» там нет — '
      +'у свободного посещения смен не бывает, а продаж у этих должностей нет.'],
  zad:'Нажмите 💵 у Забабуриной Александры, затем «Сохранить».', tyk:'#uch-korr-0'},
 {t:'Удержать можно меньше',
  txt:['Под блоком есть поле «Удержать в этом месяце». Пустое — удерживается всё. Поставите меньше — '
      +'удержится ровно столько, а остаток сам перейдёт на следующий месяц и появится там строкой '
      +'«перенос с прошлых месяцев». Это поле видят только бухгалтер и главный администратор.',
       'Зачем так: вычет падает в тот месяц, когда случилось событие, а не когда о нём вспомнили. Если за месяц '
      +'набралось больше половины начисленного, программа покажет жёлтое предупреждение: по статье 115 ТК РК '
      +'за месяц удерживают не больше 50 %. Тогда поставьте в поле половину — остальное уйдёт дальше само.',
       'В квитке сотрудника всё это видно построчно: каждый вычет с основанием, «Перенос с прошлых месяцев» '
      +'и «Не удержано, перейдёт на следующий месяц». В выгрузке Excel эти суммы идут столбцом «Вычеты (журнал)» — '
      +'столбца «Штрафы» больше нет.'],
  zad:'Прочитайте и нажмите «Дальше».'},
 {t:'Расчётный лист', cel:'act:kvitok',
  txt:['🖨️ открывает лист: оклад, каждая ступень, каждый бонус, вычеты и итог. Его можно '
      +'распечатать или отправить в WhatsApp. Отдавайте человеку до выплаты, а не после.'],
  zad:'Нажмите 🖨️ в любой строке.', tyk:'#uch-kvit-0'},

 {t:'Выгрузка для выплаты', cel:'act:excel',
  txt:['«Экспорт в Excel» выгружает все начисления месяца одним файлом — по нему делают выплату.'],
  zad:'Закройте лист и нажмите «Экспорт в Excel».', tyk:'#uch-excel'},
 {t:'Закрытие месяца', cel:'act:zakryl',
  txt:['Закрытый месяц не правится ничем: ни продажами из 1С, ни графиком, ни '
      +'корректировками. Это защита от того, чтобы цифры разошлись с уже выданными деньгами.',
       'Закрывайте месяц только после выплаты, а не «чтобы не забыть».'],
  zad:'Нажмите «Закрыть месяц».', tyk:'#uch-zakryt'},
 {t:'Мой расчётный лист', cel:'act:moilist',
  txt:['Внизу меню, в группе «Моё», — ваш собственный расчётный лист. Ваш оклад — 425 540 ₸ за месяц, '
      +'и в графике вы не стоите: свободное посещение, оклад платится целиком, строки «Смен» в листе нет.',
       'Оклад указан с налогами: 425 540 ₸ дают на руки около 350 000 ₸, пенсионные, ИПН и ВОСМС вносятся '
      +'в корректировке — себе в том числе.'],
  zad:'Откройте «Мой расчётный лист» и нажмите «Открыть расчётный лист».',
  tyk:'#ml-btn,#n-pgMoiList,#m-pgMoiList,#s-pgMoiList'},
 {t:'Вычеты из ЗП', otkryt:'pgVychety', cel:'act:vychet',
  txt:['Недостачи и удержания вносятся здесь, а не в корректировке начисления: в «Вычетах» у каждой суммы '
      +'есть вид, дата события, основание и автор — видно, кто и за что удержал.',
       'Сотрудников можно отметить сразу нескольких или весь магазин галочкой «— все»: каждому внесётся '
      +'одинаковый вычет. Программа переспросит, сколько человек и сколько всего. Вычет попадёт в зарплату '
      +'за месяц события; если месяц уже закрыт — в следующий.'],
  zad:'Отметьте сотрудника, впишите сумму и внесите вычет.',
  tyk:'#uch-vych-da,#uch-vych-vnesti,#n-pgVychety,#m-pgVychety,#s-pgVychety'},
 {t:'Конструктор ЗП', otkryt:'pgKonstruktor', cel:'page:pgKonstruktor',
  txt:['Четыре вкладки — «KPI», «Должности», «Показатели» и «Люди» — это устройство зарплаты: должность задаёт '
      +'оклад и счёт смен, а KPI считает надбавку по показателю из 1С, Битрикса или программы.',
       'Вам это нужно, чтобы отвечать на вопрос «почему у меня такая сумма»: видно, какие KPI действуют на '
      +'должность и на человека и в каком месяце. Менять здесь может только главный администратор — '
      +'если правило посчитано неверно, идите к нему, а не правьте начисление руками.',
       'С 8 октября 2026 «Начисление ЗП», «Сводка» и «Моя зарплата» считают только по конструктору — '
      +'другого расчёта в программе нет. Июнь–август 2026 открываются архивом: итоги и расчётные листы, как их выплатили.'],
  zad:'Откройте «Конструктор ЗП».', tyk:'#n-pgKonstruktor,#m-pgKonstruktor,#s-pgKonstruktor'},
 {t:'Касса', cel:'page:pgKassa',
  txt:['В разделе «Касса» — кассовые смены, которые ждут вашего подтверждения, и история всех '
      +'кассовых смен. Расхождение из сверки кассира приходит сюда: пока вы его не подтвердили, '
      +'смена не закрыта.'],
  zad:'Откройте «Кассу».', tyk:'#n-pgKassa,#m-pgKassa,#s-pgKassa'},
 {t:'График', cel:'page:pgSchedule',
  txt:['Сверяйте с графиком оплаченные дни: день, оплаченный без отметки в графике, — '
      +'первое, что всплывает в предупреждениях.'],
  zad:'Откройте «График».', tyk:'#n-pgSchedule,#m-pgSchedule,#s-pgSchedule'},
 {t:'Сверка с 1С',
  txt:['Раз в сутки программа сама сверяет расчёт с тем, что отдаёт 1С, и пишет в чат, '
      +'если разошлось. Такое сообщение — не «может быть», а точно расхождение '
      +'в чьей-то зарплате. Разбирайте сразу.'],
  zad:'Прочитайте и нажмите «Дальше».'},

 {t:'Выдачи ИМ', cel:'page:pgImVydachi',
  txt:['Здесь видно, кто из продавцов выдал в магазине заказы самовывоза с сайта и возвраты по ним: '
      +'выдано − возвраты = база, продавцу — 1 % от неё. Данные приходят с сайта, а не из 1С.',
       'Если логин сайта не сопоставлен с сотрудником, выдачи попадают в блок «❓ Чьи выдачи?» и никому не начисляются, '
      +'пока главный администратор не привяжет логин. Начисление 1 % за выдачу включится, когда сайт начнёт передавать '
      +'боевые данные.'],
  zad:'Откройте «Выдачи ИМ».', tyk:'#n-pgImVydachi,#m-pgImVydachi,#s-pgImVydachi'},
 {t:'Антирейтинг', cel:'page:pgAntireiting',
  txt:['Баллы ставит программа сама, ночью, за нарушения. Балл живёт 90 дней и сгорает сам. '
      +'До 30 сентября идёт проверка, 1 октября — амнистия: счёт обнулится, и дальше всё всерьёз.',
       'Вас касаются просроченные задачи в Битриксе и несданный «Отчёт за день» — по баллу.'],
  zad:'Откройте «Антирейтинг».', tyk:'#n-pgAntireiting,#m-pgAntireiting,#s-pgAntireiting'},
 {t:'Правила и погода', cel:'act:pravila',
  txt:['Во вкладке «Правила» — за что и сколько баллов и за что балла нет. Погода показывает счёт: '
      +'☀️ ясно — 0 баллов, ⛅ облачно — 1–5, 🌧️ моросит — 6–14, ☔ зонт обязателен — 15–29, '
      +'⛈️ штормовое предупреждение — 30 и больше.'],
  zad:'Откройте вкладку «Правила».', tyk:'#uch-ar-pravila'},
 {t:'Если балл не по делу', cel:'act:osporil',
  txt:['На «Погоде», в «Моей истории», у балла есть кнопка «Оспорить». Напишите причину одной строкой — '
      +'руководитель или администратор посмотрит и снимет, если так. Пока балл не сняли, он считается.'],
  zad:'Вернитесь на «Погоду», нажмите «Оспорить» у балла за 11 сентября и отправьте причину.',
  tyk:'#uch-osp-send,#uch-osporit-0,#uch-ar-pogoda'},
 {t:'Достижения', cel:'page:pgAchivki',
  txt:['Здесь награды за хорошую работу: лучшие продажи, план, средний чек, UPT, рекорды, стаж, дисциплина. '
      +'Их выдаёт программа сама по цифрам учёта, особые — вручает руководство. У каждой награды своя статуэтка '
      +'с именем: «Вега», «Десятка», «Слиток дня» — её видно на полке и в расшифровке.',
       'Победителя месяца определяет сводный индекс в баллах: план, средний чек и UPT поровну, дисциплина по антирейтингу — на втором месте. '
      +'Поэтому большая точка не выигрывает просто потому, что большая. Как он считается и откуда берётся металл '
      +'статуэтки — во вкладке «Правила».',
       'За обучение награды тоже есть: «Букварь» — за первый сданный курс, «Сова» — по одной за каждый курс, '
      +'они копятся на полке стопкой. Один курс — одна «Сова», пересдача второй не даёт. Выдаются не сразу, '
      +'а ночным расчётом, наутро. Курс засчитывается тому, под кем вы вошли в обучение из Битрикса, — '
      +'поэтому чужой ссылкой на курс лучше не пользоваться: сдача запишется не на вас.'],
  zad:'Откройте «Достижения».', tyk:'#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Профиль и награды', cel:'act:achprofil',
  txt:['Нажмите на человека — откроется его карточка. В шапке три плитки: сколько наград, стаж и день рождения. '
      +'Стаж там настоящий, от даты приёма — «1 год 3 месяца»; а строка «Стаж в FBSM · 1 год» ниже, в «Пути», — '
      +'это ступень награды, и числа у них разные. Под шапкой счётчик: сколько видов наград собрано из тех, что доступны '
      +'по должности. «Путь» — лестницы с полоской и подписью, какая ступень следующая. «Рекорды» — только личные: крупно само значение рекорда, '
      +'под ним дата и прежний результат, и сколько раз он бит. Рекордов вообще два уровня: свои личные — лучший '
      +'день, лучший месяц, задачи в срок, — и рекорды сети за день: продажи, чеки, товары. Рекорд сети держит '
      +'один человек на всю сеть, и в карточке он стоит кубком на полке: «Комета», «Кассовый аппарат», «Караван». '
      +'Рекорда сети за месяц не бывает. «Полка наград» — все статуэтки, одинаковые стоят стопкой с ×N. '
      +'Нажатие на любую из них — из «Пути», из «Рекордов», с полки, с пыльной полки — открывает одну и ту же '
      +'карточку награды; на телефоне она во весь экран.',
       'Ниже — «Пыльная полка»: антикубки стоят такими же кубками, как награды, а под кубком серым — сколько ещё '
      +'простоят. Они временные и в счётчик наград не входят. Антикубки бывают трёх пород. Погодные — '
      +'«Дырявый зонт» и «Громоотвод» — приходят от погоды антирейтинга (15 и 30 штрафных баллов) и уходят, когда '
      +'счёт опустится. За поведение программа ставит ночью сама, по действующим баллам за последние 30 дней: '
      +'«Сонная муха» — три опоздания, «Разбитая копилка» — три незакрытые в день смены кассы, «Кривое зеркало» — '
      +'три правки задним числом, «Грабли» — четыре одинаковых нарушения. У них видно, по какой день антикубок '
      +'простоит, если новых нарушений не будет; новое нарушение того же вида этот день сдвигает. Больше одного '
      +'такого сразу не бывает. Остальные вручает руководство на срок от 1 до 30 дней — '
      +'и те же четыре тоже можно вручить руками, тогда у них будет срок. В карточке антикубка написано прямо: '
      +'на зарплату и награды он не влияет.'],
  zad:'Откройте профиль Александры Забабуриной.', tyk:'#uch-ach-p-0,#uch-ach-lyudi'},
 {t:'Поделиться наградой', cel:'act:achpodel',
  txt:['В карточке награды сверху крупная статуэтка, её имя и название награды, а описание — двумя фразами: '
      +'за что она даётся и что это за вещь («Награда из серебра в форме подковы с гвоздями, постамент — кузнечная сталь»). '
      +'Ниже дата, прогресс — «ступень 2 из 6 · дальше — «100 смен»» у лестниц, «до золота — ещё 3» у рекордов — '
      +'и синяя ссылка внизу: «Все даты» или «Пройденные ступени».',
       'У своей награды есть «📤 Поделиться»: программа рисует открытку 1080×1350 — статуэтка, награда, обе фразы, '
      +'имя и дата. Личных сумм на ней нет. О новой награде программа и так пишет в общий чат Битрикса: '
      +'«Статуэтка «Вега». Награда из горного хрусталя в форме…»; про антикубок текст другой — он «ставит на полку» '
      +'и уходит по сроку или с погодой.'],
  zad:'Откройте первую статуэтку на полке и нажмите «Поделиться».',
  tyk:'#uch-ach-podelitsya,#uch-ach-n-0,#uch-ach-p-0,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Ордена', cel:'act:achorden',
  txt:['Вкладка «Ордена» — все награды компании по категориям, теми же статуэтками, что стоят на полке. '
      +'Цифра в синем кружке и стопка позади — у СКОЛЬКИХ ЧЕЛОВЕК эта награда есть. Это не то же самое, '
      +'что ×N в карточке сотрудника: там ×N — сколько раз получил он сам.',
       'Серые, обесцвеченные — награды, которых пока нет ни у кого; «скоро» — ещё не запущенные. Антикубки идут '
      +'последней категорией, красным, в пунктирной рамке, и серыми не бывают. Нажмите на статуэтку — откроется '
      +'орден: те же две фразы — за что награда и что это за вещь, у рекордов — линейка, как растёт металл '
      +'(и строка «Металл растёт с числом наград»), у лестниц — все ступени и кто на них. '
      +'У стажа ступень появляется каждый год, а металл меняется реже: несколько соседних лет стоят в одном металле '
      +'и с одной статуэткой.'],
  zad:'Откройте вкладку «Ордена» и нажмите первую статуэтку.',
  tyk:'#uch-ach-ord-0,#uch-ach-ordena,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Ждут решения', cel:'act:reshil',
  txt:['Если сотрудник оспорил балл, у вас в «Антирейтинге» сверху появляется блок «⏳ Ждут решения» '
      +'с его объяснением. Число оспоренных видно и в пункте меню.',
       'Снять — балл гаснет. Отклонить — балл остаётся, человек видит в истории вашу причину и повторно '
      +'оспорить его уже не может. Оспаривание, которое ждёт дольше трёх дней, помечено красным.'],
  zad:'Откройте «Антирейтинг» и решите оспоренный балл: снимите или отклоните.',
  tyk:'#uch-snyat,#uch-ar-pogoda,#n-pgAntireiting,#m-pgAntireiting,#s-pgAntireiting'},
 {t:'Хоз. заявка', otkryt:'pgHozZayavka', cel:'act:hoz_zayavka',
  txt:['Не хватает чего-то для работы или что-то сломалось — вкладка «🧰 Хоз. заявка». Каждую позицию '
      +'пишите с новой строки, при желании приложите фото и отметьте «Срочно». Заявка сразу уходит руководителю АХО — писать ему в личку не нужно.',
       'Заявка идёт от вашего магазина или отдела. Ниже видно, что ещё в работе и что ответил руководитель АХО, а в «Закрыто за неделю» — '
      +'что сделано и что не будет и почему. Уже есть в работе — повторять не нужно.'],
  zad:'Напишите заявку и нажмите «Отправить заявку».', tyk:'#uch-hoz,#uch-hoz-btn'},
 {t:'Что нового', cel:'page:pgChangelog',
  txt:['Программа меняется часто. Что поменялось — человеческими словами, по датам — на странице «Что нового». '
      +'Она открывается щелчком по строке версии внизу бокового меню, а на телефоне — внизу листа «Ещё». '
      +'Сверху там номер версии: если он старее, чем у коллег, закройте вкладку и откройте заново.'],
  zad:'Щёлкните по строке версии внизу меню.', tyk:'#n-pgChangelog,#m-pgChangelog,#s-pgChangelog,#sb-ver,#ms-ver'},],

admin:[
 {t:'Сводка по сети', otkryt:'pgReport',
  txt:['Вы видите все магазины и всех людей. Слева меню разбито на три части: '
      +'магазины, люди, деньги.'],
  zad:'Осмотритесь и нажмите «Дальше».'},
 {t:'Отчёты офиса', cel:'page:pgOtchetyOfisa',
  txt:['Ежедневные отчёты офисных должностей теперь сдаются в программе, а не в Битриксе. Здесь видно по дням, '
      +'кто сдал и кто нет, с текстом. Досданный за вчера отчёт ждёт вашего решения: «Засчитать день» или «Не засчитывать».'],
  zad:'Откройте «Отчёты офиса».', tyk:'#n-pgOtchetyOfisa,#s-pgOtchetyOfisa'},
 {t:'Проверка точки', otkryt:'pgProverka', cel:'page:pgProverka',
  txt:['Иногда вы проверяете порядок в магазинах — по тем же 11 пунктам, по которым смена принимает магазин утром. '
      +'По каждому пункту «В порядке» или «Нарушение»; нарушение — что не так и фото.',
       'Каждый пункт с нарушением, о котором смена не сообщила при приёмке, — 1 штрафной балл каждому на смене '
      +'(проверка до 11:00 — прошлой смене). Одна проверка на точку в день, результат с фото уходит в чат отчётов.'],
  zad:'Откройте «Проверка точки».', tyk:'#n-pgProverka,#m-pgProverka,#s-pgProverka'},
 {t:'Отметьте пункты', cel:'act:proverka',
  txt:['Пройдите все пункты и нажмите «Записать проверку». Пока хоть один пункт не отмечен, записать нельзя.'],
  zad:'Отметьте все пункты и запишите проверку.', tyk:'#uch-prv'},
 {t:'Заявки на хоз. нужды', cel:'page:pgHozZayavki',
  txt:['Хоз. заявки — в разделе «Заявки на хоз. нужды», собранные по магазинам: каждая строка заявки отдельно, с ответом '
      +'руководителя АХО; ниже — закрытое за 30 дней, кто и когда закрыл. Отмечает только руководитель АХО, у вас — просмотр.'],
  zad:'Откройте «Заявки на хоз. нужды».', tyk:'#n-pgHozZayavki,#s-pgHozZayavki'},
 {t:'Сотрудники', otkryt:'pgSellers', cel:'page:pgSellers',
  txt:['Здесь заводят людей, меняют должности и магазины, выдают пароли. Делает это только главный администратор — '
      +'то есть вы: у управляющих пункта «Сотрудники» нет вовсе, у остальных администраторов нет «Сотрудников» '
      +'и «Новых», а сервер им отвечает «Сотрудников заводит и меняет только главный администратор».'],
  zad:'Откройте «Сотрудники».', tyk:'#n-pgSellers,#s-pgSellers'},
 {t:'Откройте карточку', cel:'act:karta',
  txt:['Карандаш открывает карточку: имя, магазин, должность, пароль. У менеджера '
      +'по эфирам там же указывается, с чьих эфиров идёт процент.'],
  zad:'Нажмите ✏️ у Кузьмина Никиты.', tyk:'#uch-pravka-u4'},
 {t:'Смените должность и сохраните', cel:'act:sohranil',
  txt:['Смена должности меняет и меню человека, и способ расчёта его зарплаты — '
      +'с ближайшего пересчёта, включая текущий месяц, если он открыт.'],
  zad:'Выберите другую должность и нажмите «Сохранить».', tyk:'#uch-sohr,#uch-rol'},
 {t:'Режим просмотра', cel:'act:prosmotr',
  txt:['Кнопка 👁 перед карандашом открывает программу глазами сотрудника: его меню, дашборд, зарплату, график '
      +'и достижения. Удобно, когда человек говорит «у меня не так» — вы видите ровно то, что видит он.',
       'Сверху встанет красная плашка «Вы смотрите программу глазами …». В этом режиме ничего нельзя записать: '
      +'отметить смену, подтвердить продажи, открыть кассу, вручить награду, поставить балл — на всё программа '
      +'ответит «Режим просмотра». Кнопки 👁 нет только у вас самого.'],
  zad:'Нажмите 👁 у Кузьмина Никиты и подтвердите.',
  tyk:'#uch-prosmotr-da,#uch-prosmotr-u4,#n-pgSellers,#s-pgSellers'},
 {t:'Вернуться к себе', cel:'act:prosmotr-nazad',
  txt:['Попробуйте нажать кнопку действия — увидите отказ. Режим живёт 2 часа, потом сессия истекает; '
      +'кто и на кого смотрел, пишется в журнал программы.',
       '«Вернуться к себе» возвращает в вашу учётку без пароля. Но если страницу обновили, плашка останется, '
      +'а «Вернуться к себе» сработает как обычный выход — свой вход придётся ввести заново.'],
  zad:'Нажмите «Вернуться к себе» на красной плашке.', tyk:'#uch-prosmotr-nazad'},
 {t:'Планы', otkryt:'pgPlans', cel:'page:pgPlans',
  txt:['План ставится магазину и каждому продавцу. Там, где заметная часть продаж идёт '
      +'без продавца — эфиры, админ, склад, — эта доля вычитается, и на продавцов '
      +'делится остаток.'],
  zad:'Откройте «Планы».', tyk:'#n-pgPlans,#s-pgPlans'},
 {t:'Настройки', otkryt:'pgParams', cel:'act:param',
  txt:['С 8 октября 2026 зарплату считает только «Конструктор ЗП»: оклады, проценты и бонусы всех '
      +'должностей правятся там. Старых ставок в программе больше нет. Июнь–август 2026 посчитаны '
      +'прежним расчётом и выплачены — в «Начислении» они открываются как архив, только для просмотра.',
       'В «Настройках» остались общие вещи: длина смены по кнопке «Пришёл / Ушёл» и шаг округления '
      +'времени, список подразделений, чат Telegram и учёт задержек.'],
  zad:'Откройте «Настройки» и нажмите «Сохранить».', tyk:'#uch-param,#n-pgParams,#s-pgParams'},
 {t:'Конструктор ЗП', otkryt:'pgKonstruktor', cel:'page:pgKonstruktor',
  txt:['Здесь собрана сама зарплата: четыре вкладки — «KPI», «Должности», «Показатели» и «Люди». '
      +'Должность задаёт оклад и то, как считаются смены, и она же — роль в программе: у своей должности (например, «Экспедитор») '
      +'кнопка «🔐 Доступы» задаёт, как человек отмечает работу, чьи данные видит, какие страницы в меню и что может делать; '
      +'можно «взять как у» встроенной должности и поправить. KPI — правило над показателем из 1С, Битрикса '
      +'или программы: процент, ступени, бонус за условие, сумма за единицу, коэффициент или формула.',
       'Один KPI крепится сразу к нескольким должностям и людям, поэтому у каждого KPI видно, где он участвует, '
      +'а у каждого показателя — в каких KPI он считается. Вверху выбор месяца «Как действует в»: правка '
      +'начинает работать с выбранного месяца, а закрытые месяцы не меняются.',
       'Кнопка «▶ Проба» показывает, что KPI дал бы людям за прошлый месяц, ничего не сохраняя, — '
      +'смотрите на ней, прежде чем менять правило живым людям. Менять конструктор может только главный '
      +'администратор; бухгалтер видит его, но правит не он.',
       'С 8 октября 2026 всё начисление считает только конструктор: старых ставок и переключателя расчёта '
      +'больше нет. Июнь–август 2026 — архив прежнего расчёта, только для просмотра.'],
  zad:'Откройте «Конструктор ЗП».', tyk:'#n-pgKonstruktor,#m-pgKonstruktor,#s-pgKonstruktor'},
 {t:'Вычеты из ЗП', otkryt:'pgVychety', cel:'act:vychet',
  txt:['Недостачи и удержания вносятся здесь, а не в корректировке начисления: в «Вычетах» у каждой суммы '
      +'есть вид, дата события, основание и автор — видно, кто и за что удержал.',
       'Сотрудников можно отметить сразу нескольких или весь магазин галочкой «— все»: каждому внесётся '
      +'одинаковый вычет. Программа переспросит, сколько человек и сколько всего. Вычет попадёт в зарплату '
      +'за месяц события; если месяц уже закрыт — в следующий.'],
  zad:'Отметьте сотрудника, впишите сумму и внесите вычет.',
  tyk:'#uch-vych-da,#uch-vych-vnesti,#n-pgVychety,#m-pgVychety,#s-pgVychety'},
 {t:'Удалить вычет', cel:'act:vychet-udalil',
  txt:['Удалить запись может только главный администратор и только с причиной. Строка не исчезает: остаётся '
      +'зачёркнутой, под ней красным — кто и почему удалил. В закрытом месяце удалить нельзя.'],
  zad:'Удалите вычет и впишите причину.', tyk:'#uch-vych-udal-da,#uch-vych-udalit-0'},
 {t:'Вакансии HR', otkryt:'pgVakansii', cel:'act:vak-podtv',
  txt:['Пункт «Вакансии HR» в группе «Люди» показывает карточки найма, перешедшие в этом месяце на «В штате». '
      +'Из них считается премия HR-менеджера: первые пять входят в оклад, за каждую сверх — 40 000 ₸.',
       'Каждая вакансия решается отдельно, общего числа больше нет. Пока вы не нажали «Подтвердить», карточка '
      +'стоит со меткой «ждёт решения» и в премию не идёт: в начислении у HR это видно красной строкой '
      +'«ждут решения N — в премию не идут». Комментарий при подтверждении — по желанию.'],
  zad:'Откройте «Вакансии HR» и подтвердите вакансию, которая ждёт решения.',
  tyk:'#uch-vak-da,#uch-vak-ok-7,#n-pgVakansii,#s-pgVakansii'},
 {t:'Отклонить вакансию', cel:'act:vak-otklonil',
  txt:['Если человек не вышел, карточку закрыли повторно или вакансию закрыл не HR — вакансию отклоняют. '
      +'Комментарий при этом обязателен, и написан он для HR-менеджера: он увидит вашу причину в своей карточке '
      +'и в разговоре о зарплате будет знать, почему эта вакансия не в премии.',
       'Решение не бетонное: кнопка «Снять» возвращает карточку в «ждёт решения». В закрытом месяце ничего '
      +'из этого уже не меняется.'],
  zad:'Отклоните вакансию, которая ждёт решения, и впишите причину.',
  tyk:'#uch-vak-da,#uch-vak-net-8,#n-pgVakansii,#s-pgVakansii'},
 {t:'Журнал',
  txt:['Всё существенное записывается: кто и когда изменил план, роль, смену, '
      +'корректировку. Журнал нужен не для слежки, а чтобы через месяц понять, '
      +'почему цифра такая.'],
  zad:'Прочитайте и нажмите «Дальше».'},

 {t:'Новые сотрудники', cel:'act:novye',
  txt:['Сотрудников руками больше не заводят — их стыкуют. В «Новые» приходят все, кого программа ещё '
      +'не знает: из 1С — сама каждые 15 минут, из Битрикса — каждую ночь и по кнопке «🔄 Обновить из Битрикса». '
      +'Если человек есть в обоих, это одна строка с двумя именами: зелёная пометка «1С», синяя «Битрикс».',
       'Решение одно на обе записи. «Добавить» создаёт карточку с паролем 1234 и связывает и 1С, и вход из Битрикса; '
      +'«Прикрепить» — связывает с уже заведённым; «Игнорировать» прячет служебные учётки. Несопоставленный продавец '
      +'в расчёт не попадёт. Кого при входе из Битрикса не узнали, сам попадает сюда — и видит, что вы прикрепите '
      +'его учётку. «Автоматически» в разобранных — программа узнала человека по фамилии и имени сама.'],
  zad:'Откройте «Новые» и добавьте Жумабаеву Айгерим.',
  tyk:'#uch-nov-dobavit-0,#n-pgQueue,#m-pgQueue,#s-pgQueue'},
 {t:'Уже есть у нас', cel:'act:novye-pri',
  txt:['Если программа нашла похожего среди заведённых, в строке подсказка «💡 Похоже, уже есть у нас: …», и главной '
      +'становится синяя «Прикрепить» — не заводите человека второй раз. Строка после решения уходит на месте, '
      +'счётчик «Ждут решения» уменьшается.',
       'О каждом новом человеке в очереди — из 1С, из Битрикса или неузнанном при входе — бот пишет в чат отчётов '
      +'магазинов «👤 Новый сотрудник ждёт решения в «Новые»…» со ссылкой сюда.'],
  zad:'Прикрепите Ахметову Алию к уже заведённой карточке.', tyk:'#uch-nov-prikrepit-1'},
 {t:'Касса', cel:'page:pgKassa',
  txt:['Кассовые смены, ждущие подтверждения, и история всех кассовых смен — как у бухгалтера.'],
  zad:'Откройте «Кассу».', tyk:'#n-pgKassa,#m-pgKassa,#s-pgKassa'},
 {t:'Подтверждения', cel:'page:pgPodtverzhdeniya',
  txt:['Сюда попадают смены по кнопке «Пришёл/Ушёл», которые ждут вашего решения: сотрудник поправил '
      +'приход или уход, добавил смену задним числом или не завершил день и сам указал, во сколько ушёл (это штрафной балл).',
       'Пока смена не решена, она идёт в зарплату по записанному времени.'],
  zad:'Откройте «Подтверждения».', tyk:'#n-pgPodtverzhdeniya,#m-pgPodtverzhdeniya,#s-pgPodtverzhdeniya'},
 {t:'Решите смену', cel:'act:podtv',
  txt:['«✅ Подтвердить» — согласиться со временем. «↩️ Отклонить» — вернуть время по кнопке, есть только у правки. '
      +'«✏️ Указать время» — вписать своё. «Не засчитать» — день не идёт в зарплату.',
       'Уже подтверждённую смену можно поправить в графике: нажмите на день — там блок «Смена по кнопке» '
      +'и та же кнопка «✏️ Указать время».'],
  zad:'Подтвердите смену раннера.', tyk:'#uch-podtv-ok'},
 {t:'Жалобы клиентов', cel:'page:pgZhaloby',
  txt:['Вкладка «Жалобы» в группе «Магазины» - жалобы по всей сети: из WhatsApp-бота и 2ГИС (управляющему они видны после вашего подтверждения) '
      +'и те, что записали сотрудники кнопкой «Жалоба клиента». Цифра у пункта меню - новые и ждущие согласования за 30 дней.',
       'Вверху две кнопки: «🎁 Записать подарок» и «＋ Жалоба клиента» - в окнах вы выбираете магазин. Ниже две вкладки: «Случаи» и «Учёт подарков». '
      +'Фильтры - статус (по умолчанию «Открытые»), магазин и период. Уровень 3 решаете вы; управляющий по такой жалобе может только взять её и отправить вам заявку.'],
  zad:'Откройте «Жалобы».', tyk:'#n-pgZhaloby,#m-pgZhaloby,#s-pgZhaloby'},
 {t:'Подтвердите жалобу из 2ГИС', otkryt:'pgZhaloby', cel:'act:zh-arpodtv',
  txt:['Жалобы из WhatsApp-бота и 2ГИС приходят в «Жалобы» сами, но управляющему не видны, пока вы их не подтвердите. У такой жалобы метка «ждёт вашего решения». '
      +'«✓ Подтвердить, баллы» - антирейтинг ставит баллы сразу, а жалоба уходит управляющему: он получает карточку в Telegram и видит её во вкладке. '
      +'«Не жалоба» - баллов не будет, жалоба закроется.',
       'Если вы подтвердили жалобу, а потом отметили «Не жалоба», программа спросит, снять ли уже поставленные баллы. '
      +'Жалобы клиентов теперь решаются только здесь; в «Антирейтинге» остался список «Без ответа сутки».'],
  zad:'В жалобе №36 нажмите «✓ Подтвердить, баллы» и подтвердите.',
  tyk:'#uch-zh-da,#uch-zh-ar-36,#n-pgZhaloby,#m-pgZhaloby,#s-pgZhaloby'},
 {t:'Согласуйте заявку управляющего', otkryt:'pgZhaloby', cel:'act:zh-soglasoval',
  txt:['Сверх потолка управляющий подарок не даёт: бонусы больше 3 000 ₸, ремонт, химчистка и доставка больше 5 000 ₸ на жалобу - только с вашего согласия. '
      +'Жалоба получает статус «ждёт согласования», а в карточке видно, что просят: решение, сумму и от кого. Заявку управляющего согласуете только вы.',
       '«Согласовать» возвращает жалобу в работу - дальше её закрывают кнопкой «Решено». «Отклонить заявку» тоже возвращает жалобу в работу. Ваши решения потолками не ограничены.'],
  zad:'В жалобе №39 нажмите «Согласовать» и подтвердите.',
  tyk:'#uch-zh-da,#uch-zh-soglasovat-39,#n-pgZhaloby,#m-pgZhaloby,#s-pgZhaloby'},
 {t:'Учёт подарков', otkryt:'pgZhaloby', cel:'act:zh-uchet',
  txt:['Вкладка «Учёт подарков» показывает, что, кому и сколько подарено. Вверху даты «С» и «По» (по умолчанию с 1-го числа) и выбор магазина - выбирать магазин можете только вы. '
      +'Ниже итог «Записей / Сумма», блоки «По видам», «По магазинам» и «Кто записал», затем список: одна строка - один подарок, нажатие открывает жалобу.',
       'Жалобы, закрытые без подарка, и отказы в учёт не входят.'],
  zad:'Откройте вкладку «Учёт подарков».', tyk:'#uch-zh-vk-uchet'},
 {t:'Выдачи ИМ', cel:'page:pgImVydachi',
  txt:['Здесь видно, кто из продавцов выдал в магазине заказы самовывоза с сайта и возвраты по ним: '
      +'выдано − возвраты = база, продавцу — 1 % от неё. Данные приходят с сайта, а не из 1С.',
       'Если логин сайта не сопоставлен с сотрудником, выдачи попадают в блок «❓ Чьи выдачи?» и никому не начисляются, '
      +'пока главный администратор не привяжет логин. Начисление 1 % за выдачу включится, когда сайт начнёт передавать '
      +'боевые данные.'],
  zad:'Откройте «Выдачи ИМ».', tyk:'#n-pgImVydachi,#m-pgImVydachi,#s-pgImVydachi'},
 {t:'Чьи выдачи', cel:'act:im-privyazal',
  txt:['Привязывать логины сайта к сотрудникам можете только вы. Выберите человека в списке и нажмите «Привязать» — '
      +'с этой минуты его выдачи считаются ему.'],
  zad:'Привяжите логин almaty_kassa2.', tyk:'#uch-im-priv'},
 {t:'Антирейтинг', cel:'page:pgAntireiting',
  txt:['Баллы ставит программа сама, ночью, за нарушения. Балл живёт 90 дней и сгорает сам. '
      +'До 30 сентября идёт проверка, 1 октября — амнистия: счёт обнулится, и дальше всё всерьёз.',
       'Баллы видят все: у каждого своя погода и история, внизу — погода в компании.'],
  zad:'Откройте «Антирейтинг».', tyk:'#n-pgAntireiting,#m-pgAntireiting,#s-pgAntireiting'},
 {t:'Правила и погода', cel:'act:pravila',
  txt:['Во вкладке «Правила» — за что и сколько баллов и за что балла нет. Погода показывает счёт: '
      +'☀️ ясно — 0 баллов, ⛅ облачно — 1–5, 🌧️ моросит — 6–14, ☔ зонт обязателен — 15–29, '
      +'⛈️ штормовое предупреждение — 30 и больше.'],
  zad:'Откройте вкладку «Правила».', tyk:'#uch-ar-pravila'},
 {t:'Права администратора',
  txt:['На «Погоде» у вас две кнопки: «➕ Поставить балл» — всегда с причиной, она видна человеку '
      +'в его истории; «🕊️ Амнистия» — гасит счёт всей компании по выбранный день.',
       'Оспоренные баллы разбираете вы или руководитель: пока балл не сняли, он считается.'],
  zad:'Прочитайте и нажмите «Дальше».'},
 {t:'Ждут решения', cel:'act:reshil',
  txt:['Если сотрудник оспорил балл, у вас в «Антирейтинге» сверху появляется блок «⏳ Ждут решения» '
      +'с его объяснением. Число оспоренных видно и в пункте меню.',
       'Снять — балл гаснет. Отклонить — балл остаётся, человек видит в истории вашу причину и повторно '
      +'оспорить его уже не может. Оспаривание, которое ждёт дольше трёх дней, помечено красным.'],
  zad:'Откройте «Антирейтинг» и решите оспоренный балл: снимите или отклоните.',
  tyk:'#uch-snyat,#uch-ar-pogoda,#n-pgAntireiting,#m-pgAntireiting,#s-pgAntireiting'},
 {t:'Достижения', cel:'page:pgAchivki',
  txt:['Здесь награды за хорошую работу: лучшие продажи, план, средний чек, UPT, рекорды, стаж, дисциплина. '
      +'Их выдаёт программа сама по цифрам учёта, особые — вручает руководство. У каждой награды своя статуэтка '
      +'с именем: «Вега», «Десятка», «Слиток дня» — её видно на полке и в расшифровке.',
       'Победителя месяца определяет сводный индекс в баллах: план, средний чек и UPT поровну, дисциплина по антирейтингу — на втором месте. '
      +'Поэтому большая точка не выигрывает просто потому, что большая. Как он считается и откуда берётся металл '
      +'статуэтки — во вкладке «Правила».',
       'За обучение награды тоже есть: «Букварь» — за первый сданный курс, «Сова» — по одной за каждый курс, '
      +'они копятся на полке стопкой. Один курс — одна «Сова», пересдача второй не даёт. Выдаются не сразу, '
      +'а ночным расчётом, наутро. Курс засчитывается тому, под кем вы вошли в обучение из Битрикса, — '
      +'поэтому чужой ссылкой на курс лучше не пользоваться: сдача запишется не на вас.'],
  zad:'Откройте «Достижения».', tyk:'#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Профиль и награды', cel:'act:achprofil',
  txt:['Нажмите на человека — откроется его карточка. В шапке три плитки: сколько наград, стаж и день рождения. '
      +'Стаж там настоящий, от даты приёма — «1 год 3 месяца»; а строка «Стаж в FBSM · 1 год» ниже, в «Пути», — '
      +'это ступень награды, и числа у них разные. Под шапкой счётчик: сколько видов наград собрано из тех, что доступны '
      +'по должности. «Путь» — лестницы с полоской и подписью, какая ступень следующая. «Рекорды» — только личные: крупно само значение рекорда, '
      +'под ним дата и прежний результат, и сколько раз он бит. Рекордов вообще два уровня: свои личные — лучший '
      +'день, лучший месяц, задачи в срок, — и рекорды сети за день: продажи, чеки, товары. Рекорд сети держит '
      +'один человек на всю сеть, и в карточке он стоит кубком на полке: «Комета», «Кассовый аппарат», «Караван». '
      +'Рекорда сети за месяц не бывает. «Полка наград» — все статуэтки, одинаковые стоят стопкой с ×N. '
      +'Нажатие на любую из них — из «Пути», из «Рекордов», с полки, с пыльной полки — открывает одну и ту же '
      +'карточку награды; на телефоне она во весь экран.',
       'Ниже — «Пыльная полка»: антикубки стоят такими же кубками, как награды, а под кубком серым — сколько ещё '
      +'простоят. Они временные и в счётчик наград не входят. Антикубки бывают трёх пород. Погодные — '
      +'«Дырявый зонт» и «Громоотвод» — приходят от погоды антирейтинга (15 и 30 штрафных баллов) и уходят, когда '
      +'счёт опустится. За поведение программа ставит ночью сама, по действующим баллам за последние 30 дней: '
      +'«Сонная муха» — три опоздания, «Разбитая копилка» — три незакрытые в день смены кассы, «Кривое зеркало» — '
      +'три правки задним числом, «Грабли» — четыре одинаковых нарушения. У них видно, по какой день антикубок '
      +'простоит, если новых нарушений не будет; новое нарушение того же вида этот день сдвигает. Больше одного '
      +'такого сразу не бывает. Остальные вручает руководство на срок от 1 до 30 дней — '
      +'и те же четыре тоже можно вручить руками, тогда у них будет срок. В карточке антикубка написано прямо: '
      +'на зарплату и награды он не влияет.'],
  zad:'Откройте профиль Александры Забабуриной.', tyk:'#uch-ach-p-0,#uch-ach-lyudi'},
 {t:'Поделиться наградой', cel:'act:achpodel',
  txt:['В карточке награды сверху крупная статуэтка, её имя и название награды, а описание — двумя фразами: '
      +'за что она даётся и что это за вещь («Награда из серебра в форме подковы с гвоздями, постамент — кузнечная сталь»). '
      +'Ниже дата, прогресс — «ступень 2 из 6 · дальше — «100 смен»» у лестниц, «до золота — ещё 3» у рекордов — '
      +'и синяя ссылка внизу: «Все даты» или «Пройденные ступени».',
       'У своей награды есть «📤 Поделиться»: программа рисует открытку 1080×1350 — статуэтка, награда, обе фразы, '
      +'имя и дата. Личных сумм на ней нет. О новой награде программа и так пишет в общий чат Битрикса: '
      +'«Статуэтка «Вега». Награда из горного хрусталя в форме…»; про антикубок текст другой — он «ставит на полку» '
      +'и уходит по сроку или с погодой.'],
  zad:'Откройте первую статуэтку на полке и нажмите «Поделиться».',
  tyk:'#uch-ach-podelitsya,#uch-ach-n-0,#uch-ach-p-0,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Ордена', cel:'act:achorden',
  txt:['Вкладка «Ордена» — все награды компании по категориям, теми же статуэтками, что стоят на полке. '
      +'Цифра в синем кружке и стопка позади — у СКОЛЬКИХ ЧЕЛОВЕК эта награда есть. Это не то же самое, '
      +'что ×N в карточке сотрудника: там ×N — сколько раз получил он сам.',
       'Серые, обесцвеченные — награды, которых пока нет ни у кого; «скоро» — ещё не запущенные. Антикубки идут '
      +'последней категорией, красным, в пунктирной рамке, и серыми не бывают. Нажмите на статуэтку — откроется '
      +'орден: те же две фразы — за что награда и что это за вещь, у рекордов — линейка, как растёт металл '
      +'(и строка «Металл растёт с числом наград»), у лестниц — все ступени и кто на них. '
      +'У стажа ступень появляется каждый год, а металл меняется реже: несколько соседних лет стоят в одном металле '
      +'и с одной статуэткой.'],
  zad:'Откройте вкладку «Ордена» и нажмите первую статуэтку.',
  tyk:'#uch-ach-ord-0,#uch-ach-ordena,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
{t:'Антикубок на срок', cel:'act:achvruchit',
  txt:['Вручаете награды и антикубки только вы. У антикубка обязательно есть срок: 7 дней по умолчанию, '
      +'можно 1, 3, 14 или 30 — больше 30 нельзя, бессрочных антикубков не бывает. Программа переспросит: '
      +'«Поставить антикубок «…» на N дней — Имя?». Снять раньше срока — «Отозвать» в окне антикубка.',
       '«Дырявый зонт» и «Громоотвод» руками не выдают: их ставит и снимает сама программа ночью по погоде '
      +'антирейтинга. «Сонную муху», «Разбитую копилку», «Кривое зеркало» и «Грабли» программа тоже ставит сама — '
      +'по нарушениям за 30 дней; вручную их поставить можно, тогда у них будет срок и программа такой антикубок '
      +'не трогает. Только ручные — «Кактус», «Мистер Косяк» и «Ржавая гиря».',
       'Общий вход «Главный Администратор» — служебная учётка. В списке людей «Достижений», в «Орденах» '
      +'и в таблице антирейтинга её нет: наград и баллов она не получает.'],
  zad:'Откройте «Вручить», поставьте антикубок и подтвердите.',
  tyk:'#uch-ach-vr-da,#uch-ach-postavit,#uch-ach-vruchit,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},

 {t:'Аттестация и пояса', cel:'page:pgAttestaciya',
  txt:['Пункт «Аттестация» в группе «Люди» после «Достижений» есть только у главного администратора. У продавца пять поясов: Белый, Жёлтый, Зелёный, Коричневый, Чёрный; '
      +'каждая ступень прибавляет к смене 1 000 ₸ (до +4 000 ₸ у Чёрного), надбавка идёт в расчётный лист отдельной строкой. Пояс меняется только решением по аттестации, '
      +'она проходит раз в три месяца, а продавцы разбиты на три потока. Показатели считаются с 1 ноября 2026 года.',
       'На экране шесть вкладок: «Продавцы и пояса» (у кого какой пояс, поток и месяц аттестации), «Аттестации» (карточки по месяцам), «Условия», «Расписание и потоки», «Банк экзамена» и «Журнал». '
      +'Вы назначаете потоки, а в карточке аттестации вписываете свои оценки - письменный тест, кейсы, устная часть. Когда заполнено всё, программа предлагает исход: '
      +'«Новый пояс», «Остался на поясе» или «Потерял пояс». Вы подтверждаете предложение или отклоняете его: тогда выбираете другой пояс и пишете причину.',
       'Подтвердить или отклонить можно с 1-го числа месяца аттестации. За один раз пояс меняется на одну ступень, новый действует с 1-го числа следующего месяца. '
      +'О новом поясе и подтверждённом поясе пишут в общем чате, о потере пояса - нет.'],
  zad:'Откройте «Аттестация».', tyk:'#n-pgAttestaciya,#m-pgAttestaciya,#s-pgAttestaciya'},

 {t:'Что нового', cel:'page:pgChangelog',
  txt:['Программа меняется часто. Что поменялось — человеческими словами, по датам — на странице «Что нового». '
      +'Она открывается щелчком по строке версии внизу бокового меню, а на телефоне — внизу листа «Ещё». '
      +'Сверху там номер версии: если он старее, чем у коллег, закройте вкладку и откройте заново.'],
  zad:'Щёлкните по строке версии внизу меню.', tyk:'#n-pgChangelog,#m-pgChangelog,#s-pgChangelog,#sb-ver,#ms-ver'},],
};
KURSY.aho = [
 {t:'Ваш экран — «График»', otkryt:'pgSchedule', cel:'page:pgSchedule',
  txt:['Вы ведёте графики всех магазинов и складов. Программа так и открывается — сразу на «Графике». '
      +'Меню короткое: «График», «Отчёт за день», «Проверка точки», «Антирейтинг», «Достижения» и «Мой расчётный лист».',
       'Сами вы тоже стоите в графике — в графике склада, как любой сотрудник. Отмечаться при этом не нужно: '
      +'поставленный день и есть факт, из этих дней считается ваш оклад.'],
  zad:'Откройте «График».', tyk:'#n-pgSchedule,#m-pgSchedule,#s-pgSchedule'},
 {t:'Отчёт за день', cel:'page:pgOtchet',
  txt:['Ежедневный отчёт теперь сдаётся здесь, в программе, а не в Битриксе. Он сразу уходит руководству в Telegram.',
       'Без отчёта рабочий день не засчитывается в зарплату. Забыли сдать - отчёт можно сдать за любой из последних 40 дней: '
      +'вверху список несданных дней, внизу выбор даты. Такой отчёт придёт руководителю на проверку, и день засчитает он.'],
  zad:'Откройте «Отчёт за день».', tyk:'#n-pgOtchet,#m-pgOtchet,#s-pgOtchet'},
 {t:'Сдайте отчёт', cel:'act:otchet_ofisa',
  txt:['Обязательно только «Что сделано за день»: пишите конкретно — что сделано и чем закончилось. '
      +'Планы и проблемы — по желанию; проблемы руководство читает в первую очередь.'],
  zad:'Напишите, что сделано, и нажмите «Сдать отчёт».', tyk:'#uch-otc,#uch-otc-btn'},
 {t:'Проверка точки', otkryt:'pgProverka', cel:'page:pgProverka',
  txt:['Иногда вы проверяете порядок в магазинах — по тем же 11 пунктам, по которым смена принимает магазин утром. '
      +'По каждому пункту «В порядке» или «Нарушение»; нарушение — что не так и фото.',
       'Каждый пункт с нарушением, о котором смена не сообщила при приёмке, — 1 штрафной балл каждому на смене '
      +'(проверка до 11:00 — прошлой смене). Одна проверка на точку в день, результат с фото уходит в чат отчётов.'],
  zad:'Откройте «Проверка точки».', tyk:'#n-pgProverka,#m-pgProverka,#s-pgProverka'},
 {t:'Отметьте пункты', cel:'act:proverka',
  txt:['Пройдите все пункты и нажмите «Записать проверку». Пока хоть один пункт не отмечен, записать нельзя.'],
  zad:'Отметьте все пункты и запишите проверку.', tyk:'#uch-prv'},
 {t:'Заявки на хоз. нужды', otkryt:'pgHozZayavki', cel:'act:hoz_zakryta',
  txt:['Хоз. заявки приходят вам через программу: о каждой сразу приходит сообщение — в Telegram, если вы подключили бота, '
      +'иначе в Битрикс. В разделе «Заявки на хоз. нужды» они собраны по магазинам: один магазин — одна карточка, внутри все '
      +'строки его заявок. Сверху — магазины с просрочкой и срочными.',
       'Каждую строку отмечайте отдельно: ✓ — сделано; ✕ — не будет, причина обязательна, магазину придёт сообщение; '
      +'💬 — ответить, не закрывая («привезу в пятницу»). Ошиблись — «вернуть». Сделали всё сразу — «Всё по магазину сделано». '
      +'По будням в 9:30 — сводка по магазинам; обычная без ответа больше 3 дней или срочная больше суток — «просрочено».'],
  zad:'Отметьте одну строку сделанной — кнопка ✓.', tyk:'#uch-hoz-done-1'},
 {t:'Все точки сразу', otkryt:'pgSchedule', cel:'act:tochka',
  txt:['Вверху переключатель точек: «Все точки», магазины и склад. У управляющего такого нет — он видит только свой '
      +'магазин, а вы всю сеть.'],
  zad:'Переключите точку в списке вверху.', tyk:'#uch-tochka'},
 {t:'Включите кисть', cel:'act:kist',
  txt:['Кисть — главный приём: включили один раз и щёлкаете по дням. Без неё клик по клетке открывает диалог дня '
      +'с комментарием, подменой и ручным зачётом выхода.'],
  zad:'Нажмите «Кисть».', tyk:'.sch-brush-btn'},
 {t:'Поставьте смены', cel:'act:smena:4',
  txt:['Щёлкайте по клеткам — смены ставятся сразу. Планируйте заранее: пока человека нет в графике на день, '
      +'он не сможет подтвердить продажи, а день не попадёт в зарплату.'],
  zad:'Поставьте четыре смены.', tyk:'.sch-cell'},
 {t:'Гость из другой точки', cel:'act:gost',
  txt:['Если человека с одной точки ставят на смену в другую, его добавляют в график как гостя. Так его выход '
      +'засчитается там, где он реально работал, и продажи не запишутся чужому магазину.'],
  zad:'Нажмите «Поставить гостя».', tyk:'#uch-gost'},
 {t:'Подпишите график', cel:'act:podpis',
  txt:['В конце месяца график подписывается — по всем точкам, а не только по одной. Неподписанный график видно '
      +'в «Начислении ЗП» предупреждением, и бухгалтер не закроет месяц спокойно.'],
  zad:'Нажмите «Подписать график за месяц».', tyk:'#uch-podpis'},
 {t:'Ваш расчётный лист', otkryt:'pgMoiList', cel:'page:pgMoiList',
  txt:['В «Моём расчётном листе» видно, из чего сложилась зарплата за любой месяц: оклад по дням графика, '
      +'премия и удержания, а также норма месяца.'],
  zad:'Откройте «Мой расчётный лист».', tyk:'#n-pgMoiList,#m-pgMoiList,#s-pgMoiList'},
 {t:'Откройте сам лист', otkryt:'pgMoiList', cel:'act:moilist',
  txt:['Оклад — 615 000 ₸ при полной норме: он делится на норму рабочих дней месяца (будни минус официальные праздники и переносы: в ноябре 21, в декабре 22, в январе 18) и умножается '
      +'на дни, поставленные вам в графике склада. Отпуск и больничный в оплату не идут. Лист можно распечатать '
      +'или отправить себе в WhatsApp.'],
  zad:'Нажмите «Открыть расчётный лист».', tyk:'#ml-btn'},
 {t:'Вычеты из ЗП', otkryt:'pgVychety', cel:'act:vychet',
  txt:['Недостачи и удержания вносятся здесь, а не в корректировке начисления: в «Вычетах» у каждой суммы '
      +'есть вид, дата события, основание и автор — видно, кто и за что удержал.',
       'Сотрудников можно отметить сразу нескольких или весь магазин галочкой «— все»: каждому внесётся '
      +'одинаковый вычет. Программа переспросит, сколько человек и сколько всего. Вычет попадёт в зарплату '
      +'за месяц события; если месяц уже закрыт — в следующий.'],
  zad:'Отметьте сотрудника, впишите сумму и внесите вычет.',
  tyk:'#uch-vych-da,#uch-vych-vnesti,#n-pgVychety,#m-pgVychety,#s-pgVychety'},

 {t:'Антирейтинг', cel:'page:pgAntireiting',
  txt:['Штрафные баллы за нарушения. Вас касаются: прогул — 10 баллов; просроченная задача в Битриксе — балл. '
      +'Баллы ваших людей вы видите здесь же.'],
  zad:'Откройте «Антирейтинг».', tyk:'#n-pgAntireiting,#m-pgAntireiting,#s-pgAntireiting'},
 {t:'Правила и погода', cel:'act:pravila',
  txt:['На вкладке «Правила» — за что и сколько баллов, кого касается и что скоро добавится. '
      +'«Погода» показывает, насколько всё хорошо у человека сейчас.'],
  zad:'Откройте вкладку «Правила».', tyk:'#uch-ar-pravila'},
 {t:'Достижения', cel:'page:pgAchivki',
  txt:['Здесь награды за хорошую работу: лучшие продажи, план, средний чек, UPT, рекорды, стаж, дисциплина. '
      +'Их выдаёт программа сама по цифрам учёта, особые — вручает руководство. У каждой награды своя статуэтка '
      +'с именем: «Вега», «Десятка», «Слиток дня» — её видно на полке и в расшифровке.',
       'Победителя месяца определяет сводный индекс в баллах: план, средний чек и UPT поровну, дисциплина по антирейтингу — на втором месте. '
      +'Поэтому большая точка не выигрывает просто потому, что большая. Как он считается и откуда берётся металл '
      +'статуэтки — во вкладке «Правила».',
       'За обучение награды тоже есть: «Букварь» — за первый сданный курс, «Сова» — по одной за каждый курс, '
      +'они копятся на полке стопкой. Один курс — одна «Сова», пересдача второй не даёт. Выдаются не сразу, '
      +'а ночным расчётом, наутро. Курс засчитывается тому, под кем вы вошли в обучение из Битрикса, — '
      +'поэтому чужой ссылкой на курс лучше не пользоваться: сдача запишется не на вас.'],
  zad:'Откройте «Достижения».', tyk:'#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Профиль и награды', cel:'act:achprofil',
  txt:['Нажмите на человека — откроется его карточка. В шапке три плитки: сколько наград, стаж и день рождения. '
      +'Стаж там настоящий, от даты приёма — «1 год 3 месяца»; а строка «Стаж в FBSM · 1 год» ниже, в «Пути», — '
      +'это ступень награды, и числа у них разные. Под шапкой счётчик: сколько видов наград собрано из тех, что доступны '
      +'по должности. «Путь» — лестницы с полоской и подписью, какая ступень следующая. «Рекорды» — только личные: крупно само значение рекорда, '
      +'под ним дата и прежний результат, и сколько раз он бит. Рекордов вообще два уровня: свои личные — лучший '
      +'день, лучший месяц, задачи в срок, — и рекорды сети за день: продажи, чеки, товары. Рекорд сети держит '
      +'один человек на всю сеть, и в карточке он стоит кубком на полке: «Комета», «Кассовый аппарат», «Караван». '
      +'Рекорда сети за месяц не бывает. «Полка наград» — все статуэтки, одинаковые стоят стопкой с ×N. '
      +'Нажатие на любую из них — из «Пути», из «Рекордов», с полки, с пыльной полки — открывает одну и ту же '
      +'карточку награды; на телефоне она во весь экран.',
       'Ниже — «Пыльная полка»: антикубки стоят такими же кубками, как награды, а под кубком серым — сколько ещё '
      +'простоят. Они временные и в счётчик наград не входят. Антикубки бывают трёх пород. Погодные — '
      +'«Дырявый зонт» и «Громоотвод» — приходят от погоды антирейтинга (15 и 30 штрафных баллов) и уходят, когда '
      +'счёт опустится. За поведение программа ставит ночью сама, по действующим баллам за последние 30 дней: '
      +'«Сонная муха» — три опоздания, «Разбитая копилка» — три незакрытые в день смены кассы, «Кривое зеркало» — '
      +'три правки задним числом, «Грабли» — четыре одинаковых нарушения. У них видно, по какой день антикубок '
      +'простоит, если новых нарушений не будет; новое нарушение того же вида этот день сдвигает. Больше одного '
      +'такого сразу не бывает. Остальные вручает руководство на срок от 1 до 30 дней — '
      +'и те же четыре тоже можно вручить руками, тогда у них будет срок. В карточке антикубка написано прямо: '
      +'на зарплату и награды он не влияет.'],
  zad:'Откройте профиль Александры Забабуриной.', tyk:'#uch-ach-p-0,#uch-ach-lyudi'},
 {t:'Поделиться наградой', cel:'act:achpodel',
  txt:['В карточке награды сверху крупная статуэтка, её имя и название награды, а описание — двумя фразами: '
      +'за что она даётся и что это за вещь («Награда из серебра в форме подковы с гвоздями, постамент — кузнечная сталь»). '
      +'Ниже дата, прогресс — «ступень 2 из 6 · дальше — «100 смен»» у лестниц, «до золота — ещё 3» у рекордов — '
      +'и синяя ссылка внизу: «Все даты» или «Пройденные ступени».',
       'У своей награды есть «📤 Поделиться»: программа рисует открытку 1080×1350 — статуэтка, награда, обе фразы, '
      +'имя и дата. Личных сумм на ней нет. О новой награде программа и так пишет в общий чат Битрикса: '
      +'«Статуэтка «Вега». Награда из горного хрусталя в форме…»; про антикубок текст другой — он «ставит на полку» '
      +'и уходит по сроку или с погодой.'],
  zad:'Откройте первую статуэтку на полке и нажмите «Поделиться».',
  tyk:'#uch-ach-podelitsya,#uch-ach-n-0,#uch-ach-p-0,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Ордена', cel:'act:achorden',
  txt:['Вкладка «Ордена» — все награды компании по категориям, теми же статуэтками, что стоят на полке. '
      +'Цифра в синем кружке и стопка позади — у СКОЛЬКИХ ЧЕЛОВЕК эта награда есть. Это не то же самое, '
      +'что ×N в карточке сотрудника: там ×N — сколько раз получил он сам.',
       'Серые, обесцвеченные — награды, которых пока нет ни у кого; «скоро» — ещё не запущенные. Антикубки идут '
      +'последней категорией, красным, в пунктирной рамке, и серыми не бывают. Нажмите на статуэтку — откроется '
      +'орден: те же две фразы — за что награда и что это за вещь, у рекордов — линейка, как растёт металл '
      +'(и строка «Металл растёт с числом наград»), у лестниц — все ступени и кто на них. '
      +'У стажа ступень появляется каждый год, а металл меняется реже: несколько соседних лет стоят в одном металле '
      +'и с одной статуэткой.'],
  zad:'Откройте вкладку «Ордена» и нажмите первую статуэтку.',
  tyk:'#uch-ach-ord-0,#uch-ach-ordena,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Что нового', cel:'page:pgChangelog',
  txt:['Программа меняется часто. Что поменялось — человеческими словами, по датам — на странице «Что нового». '
      +'Она открывается щелчком по строке версии внизу бокового меню, а на телефоне — внизу листа «Ещё». '
      +'Сверху там номер версии: если он старее, чем у коллег, закройте вкладку и откройте заново.'],
  zad:'Щёлкните по строке версии внизу меню.', tyk:'#n-pgChangelog,#m-pgChangelog,#s-pgChangelog,#sb-ver,#ms-ver'},
];

KURSY.store = [
 {t:'Начало смены', otkryt:'pgRunner', cel:'act:prihod',
  txt:['Вы кладовщик: ваш день считается по времени между началом и концом смены. '
      +'Отмечайтесь с телефона на складе, когда пришли.'],
  zad:'Нажмите «Начать смену».', tyk:'#uch-nachat'},
 {t:'Проверка точки', otkryt:'pgProverka', cel:'page:pgProverka',
  txt:['Иногда вы проверяете порядок в магазинах — по тем же 11 пунктам, по которым смена принимает магазин утром. '
      +'По каждому пункту «В порядке» или «Нарушение»; нарушение — что не так и фото.',
       'Каждый пункт с нарушением, о котором смена не сообщила при приёмке, — 1 штрафной балл каждому на смене '
      +'(проверка до 11:00 — прошлой смене). Одна проверка на точку в день, результат с фото уходит в чат отчётов.'],
  zad:'Откройте «Проверка точки».', tyk:'#n-pgProverka,#m-pgProverka,#s-pgProverka'},
 {t:'Отметьте пункты', cel:'act:proverka',
  txt:['Пройдите все пункты и нажмите «Записать проверку». Пока хоть один пункт не отмечен, записать нельзя.'],
  zad:'Отметьте все пункты и запишите проверку.', tyk:'#uch-prv'},
 {t:'Отчёт за день', cel:'page:pgOtchet',
  txt:['С 1 ноября ежедневный отчёт сдают и складские - кладовщик и заведующий складом, как менеджер интернет-магазина. '
      +'Вкладка «Отчёт за день» есть в меню (на телефоне - «Мой отчёт» внизу), отчёт сразу уходит руководству в Telegram.',
       'Без отчёта рабочий день не засчитывается в зарплату, а «Ушёл» без сданного отчёта не нажимается. Забыли сдать - отчёт можно сдать за любой из последних 40 дней: '
      +'вверху список несданных дней, внизу выбор даты. Такой отчёт придёт руководителю на проверку, и день засчитает он.'],
  zad:'Откройте «Отчёт за день».', tyk:'#n-pgOtchet,#m-pgOtchet,#s-pgOtchet'},
 {t:'Сдайте отчёт', cel:'act:otchet_ofisa',
  txt:['Обязательно только «Что сделано за день»: пишите конкретно - что сделано и чем закончилось. '
      +'Планы и проблемы - по желанию; проблемы руководство читает в первую очередь.'],
  zad:'Напишите, что сделано, и нажмите «Сдать отчёт».', tyk:'#uch-otc,#uch-otc-btn'},
 {t:'Конец смены', otkryt:'pgRunner', cel:'act:uhod',
  txt:['Уходя - «Завершить смену». Сначала сдайте отчёт за день: без него «Ушёл» не нажимается. Программа день сама не завершает: не нажали «Ушёл» - день не засчитывается в зарплату.',
       'Бот напоминает: через 10 минут после начала рабочего дня, если не нажат «Пришёл», и через 10 минут после его конца, если не нажат «Ушёл»; '
      +'в 23:00 - что день не завершён. Исправить незавершённый день можно до 09:00 следующего дня: на странице «Смена» впишите, во сколько ушли. '
      +'Это нарушение (штрафной балл), и время вступит в силу после подтверждения руководителем. Пропущенные и прошедшие дни исправляет только руководитель.'],
  zad:'Нажмите «Завершить смену».', tyk:'#uch-zavershit'},
 {t:'История смен', cel:'page:pgRunnerHist',
  txt:['Здесь все ваши смены. Жёлтым - дни на проверке у управляющего: пока он не решил, '
      +'в зарплату такой день не попадёт. Дни без «Ушёл» помечены «не закрыта» и не засчитаны.'],
  zad:'Откройте «История».', tyk:'#n-pgRunnerHist,#m-pgRunnerHist,#s-pgRunnerHist'},
 {t:'Поправьте время смены', cel:'act:pravka',
  txt:['Ошиблись со временем - у сегодняшней смены есть ✏️. Впишите настоящее время и отправьте: правка уходит управляющему на проверку, '
      +'в зарплату день попадёт сразу, но пока не подтвердят, сумма может измениться.',
       'Прошедшие дни вы не правите. Вчерашний день без «Ушёл» исправляется на странице «Смена» до 09:00 (со штрафным баллом), '
      +'остальное исправляет руководитель - напишите ему.'],
  zad:'Нажмите ✏️ у сегодняшней смены, затем «Отправить на проверку».', tyk:'#uch-hist-0'},
 {t:'Моя зарплата', cel:'page:pgRunnerZP',
  txt:['Полная смена - 9 часов с обедом (10:00-19:00). Платится отработанное время с шагом 15 минут, и меньше нормы, и больше: '
      +'время сверх 9 часов оплачивается по той же ставке, задержались до 10 часов - получите 10/9 ставки. Не нажали «Ушёл» - день не засчитывается в зарплату.'],
  zad:'Откройте «Моя ЗП».', tyk:'#n-pgRunnerZP,#m-pgRunnerZP,#s-pgRunnerZP'},
 {t:'График', cel:'page:pgSchedule',
  txt:['График показывает, когда вы должны выйти, — его ставит управляющий. '
      +'Засчитываются же смены по вашим отметкам начала и конца.'],
  zad:'Откройте «График».', tyk:'#n-pgSchedule,#m-pgSchedule,#s-pgSchedule'},
 {t:'Ваш расчётный лист', cel:'page:pgMoiList',
  txt:['Начиная с 6-го числа здесь лежит лист за прошлый месяц — и за все более ранние. '
      +'Это тот же лист, что видит бухгалтер: начисления, аванс, пенсионные, ИПН, ВОСМС, '
      +'штрафы и итог к выплате.',
       'Над листом — пометка. Зелёная: месяц закрыт, суммы окончательные. Жёлтая: '
      +'бухгалтер ещё может внести правки.'],
  zad:'Откройте «Мой расчётный лист».', tyk:'#n-pgMoiList,#m-pgMoiList,#s-pgMoiList'},
 {t:'Откройте сам лист', otkryt:'pgMoiList', cel:'act:moilist',
  txt:['Выберите месяц и нажмите кнопку. Лист можно распечатать или отправить себе '
      +'в WhatsApp — пересылать его вам больше не нужно.'],
  zad:'Нажмите «Открыть расчётный лист».', tyk:'#ml-btn'},

 {t:'Антирейтинг', cel:'page:pgAntireiting',
  txt:['Баллы ставит программа сама, ночью, за нарушения. Балл живёт 90 дней и сгорает сам. '
      +'До 30 сентября идёт проверка, 1 октября — амнистия: счёт обнулится, и дальше всё всерьёз.',
       'Вас касаются: опоздание — начало смены позже начала рабочего дня — 3 балла; смена без нажатой кнопки '
      +'начала или конца (в правилах — «Пришёл» / «Ушёл»), в том числе день без «Ушёл», и отметка, исправленная '
      +'задним числом больше чем на 5 минут, — по баллу; просроченная задача в Битриксе — балл.'],
  zad:'Откройте «Антирейтинг».', tyk:'#n-pgAntireiting,#m-pgAntireiting,#s-pgAntireiting'},
 {t:'Правила и погода', cel:'act:pravila',
  txt:['Во вкладке «Правила» — за что и сколько баллов и за что балла нет. Погода показывает счёт: '
      +'☀️ ясно — 0 баллов, ⛅ облачно — 1–5, 🌧️ моросит — 6–14, ☔ зонт обязателен — 15–29, '
      +'⛈️ штормовое предупреждение — 30 и больше.'],
  zad:'Откройте вкладку «Правила».', tyk:'#uch-ar-pravila'},
 {t:'Если балл не по делу', cel:'act:osporil',
  txt:['На «Погоде», в «Моей истории», у балла есть кнопка «Оспорить». Напишите причину одной строкой — '
      +'руководитель или администратор посмотрит и снимет, если так. Пока балл не сняли, он считается.'],
  zad:'Вернитесь на «Погоду», нажмите «Оспорить» у балла за 11 сентября и отправьте причину.',
  tyk:'#uch-osp-send,#uch-osporit-0,#uch-ar-pogoda'},
 {t:'Достижения', cel:'page:pgAchivki',
  txt:['Здесь награды за хорошую работу: лучшие продажи, план, средний чек, UPT, рекорды, стаж, дисциплина. '
      +'Их выдаёт программа сама по цифрам учёта, особые — вручает руководство. У каждой награды своя статуэтка '
      +'с именем: «Вега», «Десятка», «Слиток дня» — её видно на полке и в расшифровке.',
       'Победителя месяца определяет сводный индекс в баллах: план, средний чек и UPT поровну, дисциплина по антирейтингу — на втором месте. '
      +'Поэтому большая точка не выигрывает просто потому, что большая. Как он считается и откуда берётся металл '
      +'статуэтки — во вкладке «Правила».',
       'За обучение награды тоже есть: «Букварь» — за первый сданный курс, «Сова» — по одной за каждый курс, '
      +'они копятся на полке стопкой. Один курс — одна «Сова», пересдача второй не даёт. Выдаются не сразу, '
      +'а ночным расчётом, наутро. Курс засчитывается тому, под кем вы вошли в обучение из Битрикса, — '
      +'поэтому чужой ссылкой на курс лучше не пользоваться: сдача запишется не на вас.'],
  zad:'Откройте «Достижения».', tyk:'#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Профиль и награды', cel:'act:achprofil',
  txt:['Нажмите на человека — откроется его карточка. В шапке три плитки: сколько наград, стаж и день рождения. '
      +'Стаж там настоящий, от даты приёма — «1 год 3 месяца»; а строка «Стаж в FBSM · 1 год» ниже, в «Пути», — '
      +'это ступень награды, и числа у них разные. Под шапкой счётчик: сколько видов наград собрано из тех, что доступны '
      +'по должности. «Путь» — лестницы с полоской и подписью, какая ступень следующая. «Рекорды» — только личные: крупно само значение рекорда, '
      +'под ним дата и прежний результат, и сколько раз он бит. Рекордов вообще два уровня: свои личные — лучший '
      +'день, лучший месяц, задачи в срок, — и рекорды сети за день: продажи, чеки, товары. Рекорд сети держит '
      +'один человек на всю сеть, и в карточке он стоит кубком на полке: «Комета», «Кассовый аппарат», «Караван». '
      +'Рекорда сети за месяц не бывает. «Полка наград» — все статуэтки, одинаковые стоят стопкой с ×N. '
      +'Нажатие на любую из них — из «Пути», из «Рекордов», с полки, с пыльной полки — открывает одну и ту же '
      +'карточку награды; на телефоне она во весь экран.',
       'Ниже — «Пыльная полка»: антикубки стоят такими же кубками, как награды, а под кубком серым — сколько ещё '
      +'простоят. Они временные и в счётчик наград не входят. Антикубки бывают трёх пород. Погодные — '
      +'«Дырявый зонт» и «Громоотвод» — приходят от погоды антирейтинга (15 и 30 штрафных баллов) и уходят, когда '
      +'счёт опустится. За поведение программа ставит ночью сама, по действующим баллам за последние 30 дней: '
      +'«Сонная муха» — три опоздания, «Разбитая копилка» — три незакрытые в день смены кассы, «Кривое зеркало» — '
      +'три правки задним числом, «Грабли» — четыре одинаковых нарушения. У них видно, по какой день антикубок '
      +'простоит, если новых нарушений не будет; новое нарушение того же вида этот день сдвигает. Больше одного '
      +'такого сразу не бывает. Остальные вручает руководство на срок от 1 до 30 дней — '
      +'и те же четыре тоже можно вручить руками, тогда у них будет срок. В карточке антикубка написано прямо: '
      +'на зарплату и награды он не влияет.'],
  zad:'Откройте профиль Александры Забабуриной.', tyk:'#uch-ach-p-0,#uch-ach-lyudi'},
 {t:'Поделиться наградой', cel:'act:achpodel',
  txt:['В карточке награды сверху крупная статуэтка, её имя и название награды, а описание — двумя фразами: '
      +'за что она даётся и что это за вещь («Награда из серебра в форме подковы с гвоздями, постамент — кузнечная сталь»). '
      +'Ниже дата, прогресс — «ступень 2 из 6 · дальше — «100 смен»» у лестниц, «до золота — ещё 3» у рекордов — '
      +'и синяя ссылка внизу: «Все даты» или «Пройденные ступени».',
       'У своей награды есть «📤 Поделиться»: программа рисует открытку 1080×1350 — статуэтка, награда, обе фразы, '
      +'имя и дата. Личных сумм на ней нет. О новой награде программа и так пишет в общий чат Битрикса: '
      +'«Статуэтка «Вега». Награда из горного хрусталя в форме…»; про антикубок текст другой — он «ставит на полку» '
      +'и уходит по сроку или с погодой.'],
  zad:'Откройте первую статуэтку на полке и нажмите «Поделиться».',
  tyk:'#uch-ach-podelitsya,#uch-ach-n-0,#uch-ach-p-0,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Ордена', cel:'act:achorden',
  txt:['Вкладка «Ордена» — все награды компании по категориям, теми же статуэтками, что стоят на полке. '
      +'Цифра в синем кружке и стопка позади — у СКОЛЬКИХ ЧЕЛОВЕК эта награда есть. Это не то же самое, '
      +'что ×N в карточке сотрудника: там ×N — сколько раз получил он сам.',
       'Серые, обесцвеченные — награды, которых пока нет ни у кого; «скоро» — ещё не запущенные. Антикубки идут '
      +'последней категорией, красным, в пунктирной рамке, и серыми не бывают. Нажмите на статуэтку — откроется '
      +'орден: те же две фразы — за что награда и что это за вещь, у рекордов — линейка, как растёт металл '
      +'(и строка «Металл растёт с числом наград»), у лестниц — все ступени и кто на них. '
      +'У стажа ступень появляется каждый год, а металл меняется реже: несколько соседних лет стоят в одном металле '
      +'и с одной статуэткой.'],
  zad:'Откройте вкладку «Ордена» и нажмите первую статуэтку.',
  tyk:'#uch-ach-ord-0,#uch-ach-ordena,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Хоз. заявка', otkryt:'pgHozZayavka', cel:'act:hoz_zayavka',
  txt:['Не хватает чего-то для работы или что-то сломалось — вкладка «🧰 Хоз. заявка». Каждую позицию '
      +'пишите с новой строки, при желании приложите фото и отметьте «Срочно». Заявка сразу уходит руководителю АХО — писать ему в личку не нужно.',
       'Заявка идёт от вашего магазина или отдела. Ниже видно, что ещё в работе и что ответил руководитель АХО, а в «Закрыто за неделю» — '
      +'что сделано и что не будет и почему. Уже есть в работе — повторять не нужно.'],
  zad:'Напишите заявку и нажмите «Отправить заявку».', tyk:'#uch-hoz,#uch-hoz-btn'},
 {t:'Что нового', cel:'page:pgChangelog',
  txt:['Программа меняется часто. Что поменялось — человеческими словами, по датам — на странице «Что нового». '
      +'Она открывается щелчком по строке версии внизу бокового меню, а на телефоне — внизу листа «Ещё». '
      +'Сверху там номер версии: если он старее, чем у коллег, закройте вкладку и откройте заново.'],
  zad:'Щёлкните по строке версии внизу меню.', tyk:'#n-pgChangelog,#m-pgChangelog,#s-pgChangelog,#sb-ver,#ms-ver'},];
KURSY.whhead = [
 {t:'Начало смены', otkryt:'pgRunner', cel:'act:prihod',
  txt:['Вы заведуете складом: ваш день считается по времени между началом и концом смены, '
      +'как у кладовщика и раннера. Отмечайтесь с телефона на складе, когда пришли.'],
  zad:'Нажмите «Начать смену».', tyk:'#uch-nachat'},
 {t:'Проверка точки', otkryt:'pgProverka', cel:'page:pgProverka',
  txt:['Иногда вы проверяете порядок в магазинах — по тем же 11 пунктам, по которым смена принимает магазин утром. '
      +'По каждому пункту «В порядке» или «Нарушение»; нарушение — что не так и фото.',
       'Каждый пункт с нарушением, о котором смена не сообщила при приёмке, — 1 штрафной балл каждому на смене '
      +'(проверка до 11:00 — прошлой смене). Одна проверка на точку в день, результат с фото уходит в чат отчётов.'],
  zad:'Откройте «Проверка точки».', tyk:'#n-pgProverka,#m-pgProverka,#s-pgProverka'},
 {t:'Отметьте пункты', cel:'act:proverka',
  txt:['Пройдите все пункты и нажмите «Записать проверку». Пока хоть один пункт не отмечен, записать нельзя.'],
  zad:'Отметьте все пункты и запишите проверку.', tyk:'#uch-prv'},
 {t:'Отчёт за день', cel:'page:pgOtchet',
  txt:['С 1 ноября ежедневный отчёт сдают и складские - кладовщик и заведующий складом, как менеджер интернет-магазина. '
      +'Вкладка «Отчёт за день» есть в меню (на телефоне - «Мой отчёт» внизу), отчёт сразу уходит руководству в Telegram.',
       'Без отчёта рабочий день не засчитывается в зарплату, а «Ушёл» без сданного отчёта не нажимается. Забыли сдать - отчёт можно сдать за любой из последних 40 дней: '
      +'вверху список несданных дней, внизу выбор даты. Такой отчёт придёт руководителю на проверку, и день засчитает он.'],
  zad:'Откройте «Отчёт за день».', tyk:'#n-pgOtchet,#m-pgOtchet,#s-pgOtchet'},
 {t:'Сдайте отчёт', cel:'act:otchet_ofisa',
  txt:['Обязательно только «Что сделано за день»: пишите конкретно - что сделано и чем закончилось. '
      +'Планы и проблемы - по желанию; проблемы руководство читает в первую очередь.'],
  zad:'Напишите, что сделано, и нажмите «Сдать отчёт».', tyk:'#uch-otc,#uch-otc-btn'},
 {t:'Конец смены', otkryt:'pgRunner', cel:'act:uhod',
  txt:['Уходя - «Завершить смену». Сначала сдайте отчёт за день: без него «Ушёл» не нажимается. Программа день сама не завершает: не нажали «Ушёл» - день не засчитывается в зарплату.',
       'Бот напоминает: через 10 минут после начала рабочего дня, если не нажат «Пришёл», и через 10 минут после его конца, если не нажат «Ушёл»; '
      +'в 23:00 - что день не завершён. Исправить незавершённый день можно до 09:00 следующего дня: на странице «Смена» впишите, во сколько ушли. '
      +'Это нарушение (штрафной балл), и время вступит в силу после подтверждения руководителем. Пропущенные и прошедшие дни исправляет только руководитель.'],
  zad:'Нажмите «Завершить смену».', tyk:'#uch-zavershit'},
 {t:'История смен', cel:'page:pgRunnerHist',
  txt:['Здесь все ваши смены. Жёлтым - дни на проверке у управляющего: пока он не решил, '
      +'в зарплату такой день не попадёт. Дни без «Ушёл» помечены «не закрыта» и не засчитаны.'],
  zad:'Откройте «История».', tyk:'#n-pgRunnerHist,#m-pgRunnerHist,#s-pgRunnerHist'},
 {t:'Поправьте время смены', cel:'act:pravka',
  txt:['Ошиблись со временем - у сегодняшней смены есть ✏️. Впишите настоящее время и отправьте: правка уходит управляющему на проверку, '
      +'в зарплату день попадёт сразу, но пока не подтвердят, сумма может измениться.',
       'Прошедшие дни вы не правите. Вчерашний день без «Ушёл» исправляется на странице «Смена» до 09:00 (со штрафным баллом), '
      +'остальное исправляет руководитель - напишите ему.'],
  zad:'Нажмите ✏️ у сегодняшней смены, затем «Отправить на проверку».', tyk:'#uch-hist-0'},
 {t:'Моя зарплата', cel:'page:pgRunnerZP',
  txt:['Полная смена - 9 часов с обедом (10:00-19:00). Платится отработанное время с шагом 15 минут, и меньше нормы, и больше: '
      +'время сверх 9 часов оплачивается по той же ставке, задержались до 10 часов - получите 10/9 ставки. Не нажали «Ушёл» - день не засчитывается в зарплату.'],
  zad:'Откройте «Моя ЗП».', tyk:'#n-pgRunnerZP,#m-pgRunnerZP,#s-pgRunnerZP'},
 {t:'График', cel:'page:pgSchedule',
  txt:['График показывает, когда вы должны выйти, — его ставит управляющий. '
      +'Засчитываются же смены по вашим отметкам начала и конца.'],
  zad:'Откройте «График».', tyk:'#n-pgSchedule,#m-pgSchedule,#s-pgSchedule'},
 {t:'Ваш расчётный лист', cel:'page:pgMoiList',
  txt:['Начиная с 6-го числа здесь лежит лист за прошлый месяц — и за все более ранние. '
      +'Это тот же лист, что видит бухгалтер: начисления, аванс, пенсионные, ИПН, ВОСМС, '
      +'штрафы и итог к выплате.',
       'Над листом — пометка. Зелёная: месяц закрыт, суммы окончательные. Жёлтая: '
      +'бухгалтер ещё может внести правки.'],
  zad:'Откройте «Мой расчётный лист».', tyk:'#n-pgMoiList,#m-pgMoiList,#s-pgMoiList'},
 {t:'Откройте сам лист', otkryt:'pgMoiList', cel:'act:moilist',
  txt:['Выберите месяц и нажмите кнопку. Лист можно распечатать или отправить себе '
      +'в WhatsApp — пересылать его вам больше не нужно.'],
  zad:'Нажмите «Открыть расчётный лист».', tyk:'#ml-btn'},

 {t:'Антирейтинг', cel:'page:pgAntireiting',
  txt:['Баллы ставит программа сама, ночью, за нарушения. Балл живёт 90 дней и сгорает сам. '
      +'До 30 сентября идёт проверка, 1 октября — амнистия: счёт обнулится, и дальше всё всерьёз.',
       'Вас касаются: опоздание — начало смены позже начала рабочего дня — 3 балла; смена без нажатой кнопки '
      +'начала или конца (в правилах — «Пришёл» / «Ушёл»), в том числе день без «Ушёл», и отметка, исправленная '
      +'задним числом больше чем на 5 минут, — по баллу; просроченная задача в Битриксе — балл.'],
  zad:'Откройте «Антирейтинг».', tyk:'#n-pgAntireiting,#m-pgAntireiting,#s-pgAntireiting'},
 {t:'Правила и погода', cel:'act:pravila',
  txt:['Во вкладке «Правила» — за что и сколько баллов и за что балла нет. Погода показывает счёт: '
      +'☀️ ясно — 0 баллов, ⛅ облачно — 1–5, 🌧️ моросит — 6–14, ☔ зонт обязателен — 15–29, '
      +'⛈️ штормовое предупреждение — 30 и больше.'],
  zad:'Откройте вкладку «Правила».', tyk:'#uch-ar-pravila'},
 {t:'Если балл не по делу', cel:'act:osporil',
  txt:['На «Погоде», в «Моей истории», у балла есть кнопка «Оспорить». Напишите причину одной строкой — '
      +'руководитель или администратор посмотрит и снимет, если так. Пока балл не сняли, он считается.'],
  zad:'Вернитесь на «Погоду», нажмите «Оспорить» у балла за 11 сентября и отправьте причину.',
  tyk:'#uch-osp-send,#uch-osporit-0,#uch-ar-pogoda'},
 {t:'Достижения', cel:'page:pgAchivki',
  txt:['Здесь награды за хорошую работу: лучшие продажи, план, средний чек, UPT, рекорды, стаж, дисциплина. '
      +'Их выдаёт программа сама по цифрам учёта, особые — вручает руководство. У каждой награды своя статуэтка '
      +'с именем: «Вега», «Десятка», «Слиток дня» — её видно на полке и в расшифровке.',
       'Победителя месяца определяет сводный индекс в баллах: план, средний чек и UPT поровну, дисциплина по антирейтингу — на втором месте. '
      +'Поэтому большая точка не выигрывает просто потому, что большая. Как он считается и откуда берётся металл '
      +'статуэтки — во вкладке «Правила».',
       'За обучение награды тоже есть: «Букварь» — за первый сданный курс, «Сова» — по одной за каждый курс, '
      +'они копятся на полке стопкой. Один курс — одна «Сова», пересдача второй не даёт. Выдаются не сразу, '
      +'а ночным расчётом, наутро. Курс засчитывается тому, под кем вы вошли в обучение из Битрикса, — '
      +'поэтому чужой ссылкой на курс лучше не пользоваться: сдача запишется не на вас.'],
  zad:'Откройте «Достижения».', tyk:'#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Профиль и награды', cel:'act:achprofil',
  txt:['Нажмите на человека — откроется его карточка. В шапке три плитки: сколько наград, стаж и день рождения. '
      +'Стаж там настоящий, от даты приёма — «1 год 3 месяца»; а строка «Стаж в FBSM · 1 год» ниже, в «Пути», — '
      +'это ступень награды, и числа у них разные. Под шапкой счётчик: сколько видов наград собрано из тех, что доступны '
      +'по должности. «Путь» — лестницы с полоской и подписью, какая ступень следующая. «Рекорды» — только личные: крупно само значение рекорда, '
      +'под ним дата и прежний результат, и сколько раз он бит. Рекордов вообще два уровня: свои личные — лучший '
      +'день, лучший месяц, задачи в срок, — и рекорды сети за день: продажи, чеки, товары. Рекорд сети держит '
      +'один человек на всю сеть, и в карточке он стоит кубком на полке: «Комета», «Кассовый аппарат», «Караван». '
      +'Рекорда сети за месяц не бывает. «Полка наград» — все статуэтки, одинаковые стоят стопкой с ×N. '
      +'Нажатие на любую из них — из «Пути», из «Рекордов», с полки, с пыльной полки — открывает одну и ту же '
      +'карточку награды; на телефоне она во весь экран.',
       'Ниже — «Пыльная полка»: антикубки стоят такими же кубками, как награды, а под кубком серым — сколько ещё '
      +'простоят. Они временные и в счётчик наград не входят. Антикубки бывают трёх пород. Погодные — '
      +'«Дырявый зонт» и «Громоотвод» — приходят от погоды антирейтинга (15 и 30 штрафных баллов) и уходят, когда '
      +'счёт опустится. За поведение программа ставит ночью сама, по действующим баллам за последние 30 дней: '
      +'«Сонная муха» — три опоздания, «Разбитая копилка» — три незакрытые в день смены кассы, «Кривое зеркало» — '
      +'три правки задним числом, «Грабли» — четыре одинаковых нарушения. У них видно, по какой день антикубок '
      +'простоит, если новых нарушений не будет; новое нарушение того же вида этот день сдвигает. Больше одного '
      +'такого сразу не бывает. Остальные вручает руководство на срок от 1 до 30 дней — '
      +'и те же четыре тоже можно вручить руками, тогда у них будет срок. В карточке антикубка написано прямо: '
      +'на зарплату и награды он не влияет.'],
  zad:'Откройте профиль Александры Забабуриной.', tyk:'#uch-ach-p-0,#uch-ach-lyudi'},
 {t:'Поделиться наградой', cel:'act:achpodel',
  txt:['В карточке награды сверху крупная статуэтка, её имя и название награды, а описание — двумя фразами: '
      +'за что она даётся и что это за вещь («Награда из серебра в форме подковы с гвоздями, постамент — кузнечная сталь»). '
      +'Ниже дата, прогресс — «ступень 2 из 6 · дальше — «100 смен»» у лестниц, «до золота — ещё 3» у рекордов — '
      +'и синяя ссылка внизу: «Все даты» или «Пройденные ступени».',
       'У своей награды есть «📤 Поделиться»: программа рисует открытку 1080×1350 — статуэтка, награда, обе фразы, '
      +'имя и дата. Личных сумм на ней нет. О новой награде программа и так пишет в общий чат Битрикса: '
      +'«Статуэтка «Вега». Награда из горного хрусталя в форме…»; про антикубок текст другой — он «ставит на полку» '
      +'и уходит по сроку или с погодой.'],
  zad:'Откройте первую статуэтку на полке и нажмите «Поделиться».',
  tyk:'#uch-ach-podelitsya,#uch-ach-n-0,#uch-ach-p-0,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Ордена', cel:'act:achorden',
  txt:['Вкладка «Ордена» — все награды компании по категориям, теми же статуэтками, что стоят на полке. '
      +'Цифра в синем кружке и стопка позади — у СКОЛЬКИХ ЧЕЛОВЕК эта награда есть. Это не то же самое, '
      +'что ×N в карточке сотрудника: там ×N — сколько раз получил он сам.',
       'Серые, обесцвеченные — награды, которых пока нет ни у кого; «скоро» — ещё не запущенные. Антикубки идут '
      +'последней категорией, красным, в пунктирной рамке, и серыми не бывают. Нажмите на статуэтку — откроется '
      +'орден: те же две фразы — за что награда и что это за вещь, у рекордов — линейка, как растёт металл '
      +'(и строка «Металл растёт с числом наград»), у лестниц — все ступени и кто на них. '
      +'У стажа ступень появляется каждый год, а металл меняется реже: несколько соседних лет стоят в одном металле '
      +'и с одной статуэткой.'],
  zad:'Откройте вкладку «Ордена» и нажмите первую статуэтку.',
  tyk:'#uch-ach-ord-0,#uch-ach-ordena,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Хоз. заявка', otkryt:'pgHozZayavka', cel:'act:hoz_zayavka',
  txt:['Не хватает чего-то для работы или что-то сломалось — вкладка «🧰 Хоз. заявка». Каждую позицию '
      +'пишите с новой строки, при желании приложите фото и отметьте «Срочно». Заявка сразу уходит руководителю АХО — писать ему в личку не нужно.',
       'Заявка идёт от вашего магазина или отдела. Ниже видно, что ещё в работе и что ответил руководитель АХО, а в «Закрыто за неделю» — '
      +'что сделано и что не будет и почему. Уже есть в работе — повторять не нужно.'],
  zad:'Напишите заявку и нажмите «Отправить заявку».', tyk:'#uch-hoz,#uch-hoz-btn'},
 {t:'Что нового', cel:'page:pgChangelog',
  txt:['Программа меняется часто. Что поменялось — человеческими словами, по датам — на странице «Что нового». '
      +'Она открывается щелчком по строке версии внизу бокового меню, а на телефоне — внизу листа «Ещё». '
      +'Сверху там номер версии: если он старее, чем у коллег, закройте вкладку и откройте заново.'],
  zad:'Щёлкните по строке версии внизу меню.', tyk:'#n-pgChangelog,#m-pgChangelog,#s-pgChangelog,#sb-ver,#ms-ver'},];
KURSY.immgr = [
 {t:'Начало смены', otkryt:'pgRunner', cel:'act:prihod',
  txt:['Вы менеджер интернет-магазина или контент-менеджер: смены отмечаются так же, как у склада, — '
      +'кнопками начала и конца.'],
  zad:'Нажмите «Начать смену».', tyk:'#uch-nachat'},
 {t:'Отчёт за день', cel:'page:pgOtchet',
  txt:['Ежедневный отчёт теперь сдаётся здесь, в программе, а не в Битриксе. Он сразу уходит руководству в Telegram.',
       'Без отчёта рабочий день не засчитывается в зарплату, а без него не завершить смену. Забыли сдать - отчёт можно сдать за любой из последних 40 дней: '
      +'вверху список несданных дней, внизу выбор даты. Такой отчёт придёт руководителю на проверку, и день засчитает он.'],
  zad:'Откройте «Отчёт за день».', tyk:'#n-pgOtchet,#m-pgOtchet,#s-pgOtchet'},
 {t:'Сдайте отчёт', cel:'act:otchet_ofisa',
  txt:['Обязательно только «Что сделано за день»: пишите конкретно — что сделано и чем закончилось. '
      +'Планы и проблемы — по желанию; проблемы руководство читает в первую очередь.'],
  zad:'Напишите, что сделано, и нажмите «Сдать отчёт».', tyk:'#uch-otc,#uch-otc-btn'},
 {t:'Конец смены', otkryt:'pgRunner', cel:'act:uhod',
  txt:['Уходя - «Завершить смену». Сначала сдайте отчёт за день: без него «Ушёл» не нажимается. Программа день сама не завершает: не нажали «Ушёл» - день не засчитывается в зарплату.',
       'Бот напоминает: через 10 минут после начала рабочего дня, если не нажат «Пришёл», и через 10 минут после его конца, если не нажат «Ушёл»; '
      +'в 23:00 - что день не завершён. Исправить незавершённый день можно до 09:00 следующего дня: на странице «Смена» впишите, во сколько ушли. '
      +'Это нарушение (штрафной балл), и время вступит в силу после подтверждения руководителем. Пропущенные и прошедшие дни исправляет только руководитель.'],
  zad:'Нажмите «Завершить смену».', tyk:'#uch-zavershit'},
 {t:'История смен', cel:'page:pgRunnerHist',
  txt:['Здесь все ваши смены. Жёлтым - дни на проверке у управляющего: пока он не решил, '
      +'в зарплату такой день не попадёт. Дни без «Ушёл» помечены «не закрыта» и не засчитаны.'],
  zad:'Откройте «История».', tyk:'#n-pgRunnerHist,#m-pgRunnerHist,#s-pgRunnerHist'},
 {t:'Поправьте время смены', cel:'act:pravka',
  txt:['Ошиблись со временем - у сегодняшней смены есть ✏️. Впишите настоящее время и отправьте: правка уходит управляющему на проверку, '
      +'в зарплату день попадёт сразу, но пока не подтвердят, сумма может измениться.',
       'Прошедшие дни вы не правите. Вчерашний день без «Ушёл» исправляется на странице «Смена» до 09:00 (со штрафным баллом), '
      +'остальное исправляет руководитель - напишите ему.'],
  zad:'Нажмите ✏️ у сегодняшней смены, затем «Отправить на проверку».', tyk:'#uch-hist-0'},
 {t:'Моя зарплата', cel:'page:pgRunnerZP',
  txt:['С ноября оклад считается по времени: он делится на норму рабочих дней месяца и умножается на часы, поделённые на 9. '
      +'Полная смена - 9 часов, переработка оплачивается, короткий день считается частью: 10 часов дают 10/9 дня, 6 часов - 6/9. '
      +'Не нажали «Ушёл» - день не засчитывается в зарплату, а без отчёта за день смену не завершить.'],
  zad:'Откройте «Моя ЗП».', tyk:'#n-pgRunnerZP,#m-pgRunnerZP,#s-pgRunnerZP'},
 {t:'График', cel:'page:pgSchedule',
  txt:['График показывает, когда вы должны выйти, — его ставит управляющий. '
      +'Засчитываются же смены по вашим отметкам начала и конца.'],
  zad:'Откройте «График».', tyk:'#n-pgSchedule,#m-pgSchedule,#s-pgSchedule'},
 {t:'Ваш расчётный лист', cel:'page:pgMoiList',
  txt:['Начиная с 6-го числа здесь лежит лист за прошлый месяц — и за все более ранние. '
      +'Это тот же лист, что видит бухгалтер: начисления, аванс, пенсионные, ИПН, ВОСМС, '
      +'штрафы и итог к выплате.',
       'Над листом — пометка. Зелёная: месяц закрыт, суммы окончательные. Жёлтая: '
      +'бухгалтер ещё может внести правки.'],
  zad:'Откройте «Мой расчётный лист».', tyk:'#n-pgMoiList,#m-pgMoiList,#s-pgMoiList'},
 {t:'Откройте сам лист', otkryt:'pgMoiList', cel:'act:moilist',
  txt:['Выберите месяц и нажмите кнопку. Лист можно распечатать или отправить себе '
      +'в WhatsApp — пересылать его вам больше не нужно.'],
  zad:'Нажмите «Открыть расчётный лист».', tyk:'#ml-btn'},

 {t:'Антирейтинг', cel:'page:pgAntireiting',
  txt:['Баллы ставит программа сама, ночью, за нарушения. Балл живёт 90 дней и сгорает сам. '
      +'До 30 сентября идёт проверка, 1 октября — амнистия: счёт обнулится, и дальше всё всерьёз.',
       'Вас касаются: опоздание — начало смены позже начала рабочего дня — 3 балла; смена без нажатой кнопки '
      +'начала или конца (в правилах — «Пришёл» / «Ушёл»), в том числе день без «Ушёл», и отметка, исправленная '
      +'задним числом больше чем на 5 минут, — по баллу; просроченная задача в Битриксе — балл.'],
  zad:'Откройте «Антирейтинг».', tyk:'#n-pgAntireiting,#m-pgAntireiting,#s-pgAntireiting'},
 {t:'Правила и погода', cel:'act:pravila',
  txt:['Во вкладке «Правила» — за что и сколько баллов и за что балла нет. Погода показывает счёт: '
      +'☀️ ясно — 0 баллов, ⛅ облачно — 1–5, 🌧️ моросит — 6–14, ☔ зонт обязателен — 15–29, '
      +'⛈️ штормовое предупреждение — 30 и больше.'],
  zad:'Откройте вкладку «Правила».', tyk:'#uch-ar-pravila'},
 {t:'Если балл не по делу', cel:'act:osporil',
  txt:['На «Погоде», в «Моей истории», у балла есть кнопка «Оспорить». Напишите причину одной строкой — '
      +'руководитель или администратор посмотрит и снимет, если так. Пока балл не сняли, он считается.'],
  zad:'Вернитесь на «Погоду», нажмите «Оспорить» у балла за 11 сентября и отправьте причину.',
  tyk:'#uch-osp-send,#uch-osporit-0,#uch-ar-pogoda'},
 {t:'Достижения', cel:'page:pgAchivki',
  txt:['Здесь награды за хорошую работу: лучшие продажи, план, средний чек, UPT, рекорды, стаж, дисциплина. '
      +'Их выдаёт программа сама по цифрам учёта, особые — вручает руководство. У каждой награды своя статуэтка '
      +'с именем: «Вега», «Десятка», «Слиток дня» — её видно на полке и в расшифровке.',
       'Победителя месяца определяет сводный индекс в баллах: план, средний чек и UPT поровну, дисциплина по антирейтингу — на втором месте. '
      +'Поэтому большая точка не выигрывает просто потому, что большая. Как он считается и откуда берётся металл '
      +'статуэтки — во вкладке «Правила».',
       'За обучение награды тоже есть: «Букварь» — за первый сданный курс, «Сова» — по одной за каждый курс, '
      +'они копятся на полке стопкой. Один курс — одна «Сова», пересдача второй не даёт. Выдаются не сразу, '
      +'а ночным расчётом, наутро. Курс засчитывается тому, под кем вы вошли в обучение из Битрикса, — '
      +'поэтому чужой ссылкой на курс лучше не пользоваться: сдача запишется не на вас.'],
  zad:'Откройте «Достижения».', tyk:'#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Профиль и награды', cel:'act:achprofil',
  txt:['Нажмите на человека — откроется его карточка. В шапке три плитки: сколько наград, стаж и день рождения. '
      +'Стаж там настоящий, от даты приёма — «1 год 3 месяца»; а строка «Стаж в FBSM · 1 год» ниже, в «Пути», — '
      +'это ступень награды, и числа у них разные. Под шапкой счётчик: сколько видов наград собрано из тех, что доступны '
      +'по должности. «Путь» — лестницы с полоской и подписью, какая ступень следующая. «Рекорды» — только личные: крупно само значение рекорда, '
      +'под ним дата и прежний результат, и сколько раз он бит. Рекордов вообще два уровня: свои личные — лучший '
      +'день, лучший месяц, задачи в срок, — и рекорды сети за день: продажи, чеки, товары. Рекорд сети держит '
      +'один человек на всю сеть, и в карточке он стоит кубком на полке: «Комета», «Кассовый аппарат», «Караван». '
      +'Рекорда сети за месяц не бывает. «Полка наград» — все статуэтки, одинаковые стоят стопкой с ×N. '
      +'Нажатие на любую из них — из «Пути», из «Рекордов», с полки, с пыльной полки — открывает одну и ту же '
      +'карточку награды; на телефоне она во весь экран.',
       'Ниже — «Пыльная полка»: антикубки стоят такими же кубками, как награды, а под кубком серым — сколько ещё '
      +'простоят. Они временные и в счётчик наград не входят. Антикубки бывают трёх пород. Погодные — '
      +'«Дырявый зонт» и «Громоотвод» — приходят от погоды антирейтинга (15 и 30 штрафных баллов) и уходят, когда '
      +'счёт опустится. За поведение программа ставит ночью сама, по действующим баллам за последние 30 дней: '
      +'«Сонная муха» — три опоздания, «Разбитая копилка» — три незакрытые в день смены кассы, «Кривое зеркало» — '
      +'три правки задним числом, «Грабли» — четыре одинаковых нарушения. У них видно, по какой день антикубок '
      +'простоит, если новых нарушений не будет; новое нарушение того же вида этот день сдвигает. Больше одного '
      +'такого сразу не бывает. Остальные вручает руководство на срок от 1 до 30 дней — '
      +'и те же четыре тоже можно вручить руками, тогда у них будет срок. В карточке антикубка написано прямо: '
      +'на зарплату и награды он не влияет.'],
  zad:'Откройте профиль Александры Забабуриной.', tyk:'#uch-ach-p-0,#uch-ach-lyudi'},
 {t:'Поделиться наградой', cel:'act:achpodel',
  txt:['В карточке награды сверху крупная статуэтка, её имя и название награды, а описание — двумя фразами: '
      +'за что она даётся и что это за вещь («Награда из серебра в форме подковы с гвоздями, постамент — кузнечная сталь»). '
      +'Ниже дата, прогресс — «ступень 2 из 6 · дальше — «100 смен»» у лестниц, «до золота — ещё 3» у рекордов — '
      +'и синяя ссылка внизу: «Все даты» или «Пройденные ступени».',
       'У своей награды есть «📤 Поделиться»: программа рисует открытку 1080×1350 — статуэтка, награда, обе фразы, '
      +'имя и дата. Личных сумм на ней нет. О новой награде программа и так пишет в общий чат Битрикса: '
      +'«Статуэтка «Вега». Награда из горного хрусталя в форме…»; про антикубок текст другой — он «ставит на полку» '
      +'и уходит по сроку или с погодой.'],
  zad:'Откройте первую статуэтку на полке и нажмите «Поделиться».',
  tyk:'#uch-ach-podelitsya,#uch-ach-n-0,#uch-ach-p-0,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Ордена', cel:'act:achorden',
  txt:['Вкладка «Ордена» — все награды компании по категориям, теми же статуэтками, что стоят на полке. '
      +'Цифра в синем кружке и стопка позади — у СКОЛЬКИХ ЧЕЛОВЕК эта награда есть. Это не то же самое, '
      +'что ×N в карточке сотрудника: там ×N — сколько раз получил он сам.',
       'Серые, обесцвеченные — награды, которых пока нет ни у кого; «скоро» — ещё не запущенные. Антикубки идут '
      +'последней категорией, красным, в пунктирной рамке, и серыми не бывают. Нажмите на статуэтку — откроется '
      +'орден: те же две фразы — за что награда и что это за вещь, у рекордов — линейка, как растёт металл '
      +'(и строка «Металл растёт с числом наград»), у лестниц — все ступени и кто на них. '
      +'У стажа ступень появляется каждый год, а металл меняется реже: несколько соседних лет стоят в одном металле '
      +'и с одной статуэткой.'],
  zad:'Откройте вкладку «Ордена» и нажмите первую статуэтку.',
  tyk:'#uch-ach-ord-0,#uch-ach-ordena,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Хоз. заявка', otkryt:'pgHozZayavka', cel:'act:hoz_zayavka',
  txt:['Не хватает чего-то для работы или что-то сломалось — вкладка «🧰 Хоз. заявка». Каждую позицию '
      +'пишите с новой строки, при желании приложите фото и отметьте «Срочно». Заявка сразу уходит руководителю АХО — писать ему в личку не нужно.',
       'Заявка идёт от вашего магазина или отдела. Ниже видно, что ещё в работе и что ответил руководитель АХО, а в «Закрыто за неделю» — '
      +'что сделано и что не будет и почему. Уже есть в работе — повторять не нужно.'],
  zad:'Напишите заявку и нажмите «Отправить заявку».', tyk:'#uch-hoz,#uch-hoz-btn'},
 {t:'Что нового', cel:'page:pgChangelog',
  txt:['Программа меняется часто. Что поменялось — человеческими словами, по датам — на странице «Что нового». '
      +'Она открывается щелчком по строке версии внизу бокового меню, а на телефоне — внизу листа «Ещё». '
      +'Сверху там номер версии: если он старее, чем у коллег, закройте вкладку и откройте заново.'],
  zad:'Щёлкните по строке версии внизу меню.', tyk:'#n-pgChangelog,#m-pgChangelog,#s-pgChangelog,#sb-ver,#ms-ver'},];

KURSY.hr = [
 {t:'Ваш экран — «Вакансии»', otkryt:'pgVakansii', cel:'page:pgVakansii',
  txt:['Вы HR-менеджер. Программа открывается сразу на «Вакансиях»: меню короткое — «Отчёт за день», «Вакансии», '
      +'«Мой расчётный лист», «Антирейтинг» и «Достижения». Учёт продаж вас не касается, а зарплата считается здесь же.',
       'Графика и отметок у вас нет: рабочий день засчитывается по сданному «Отчёту за день» — '
      +'день без отчёта не учитывается в зарплате. Оклад — 300 000 ₸ за месяц.'],
  zad:'Откройте «Вакансии».', tyk:'#n-pgVakansii,#m-pgVakansii,#s-pgVakansii'},
 {t:'Отчёт за день', cel:'page:pgOtchet',
  txt:['Ежедневный отчёт теперь сдаётся здесь, в программе, а не в Битриксе. Он сразу уходит руководству в Telegram.',
       'Без отчёта рабочий день не засчитывается в зарплату. Забыли сдать - отчёт можно сдать за любой из последних 40 дней: '
      +'вверху список несданных дней, внизу выбор даты. Такой отчёт придёт руководителю на проверку, и день засчитает он.'],
  zad:'Откройте «Отчёт за день».', tyk:'#n-pgOtchet,#m-pgOtchet,#s-pgOtchet'},
 {t:'Сдайте отчёт', cel:'act:otchet_ofisa',
  txt:['Обязательно только «Что сделано за день»: пишите конкретно — что сделано и чем закончилось. '
      +'Планы и проблемы — по желанию; проблемы руководство читает в первую очередь.'],
  zad:'Напишите, что сделано, и нажмите «Сдать отчёт».', tyk:'#uch-otc,#uch-otc-btn'},
 {t:'Что считается закрытой вакансией',
  txt:['Закрытая вакансия — карточка воронки найма, которая в этом месяце впервые перешла на стадию «В штате». '
      +'Карточки программа берёт из Битрикса сама, руками их сюда никто не вносит: закрыли человека в найме — '
      +'он появился в списке.',
       'Каждая вакансия стоит отдельной карточкой: ФИО, должность, подразделение, с какого числа человек в штате '
      +'и ссылка на карточку в Битриксе. Рядом метка: «ждёт решения», «подтверждена» или «отклонена». '
      +'У отклонённой и подтверждённой видно, кто решил, когда и с каким комментарием.'],
  zad:'Посмотрите карточки и нажмите «Дальше».'},
 {t:'Как считается премия',
  txt:['Первые пять ПОДТВЕРЖДЁННЫХ вакансий за месяц входят в оклад. За каждую сверх пяти — 40 000 ₸. '
      +'Шесть подтверждённых — это одна сверх порога, то есть 40 000 ₸ к окладу.',
       'Те, что ждут решения, в премию не идут — их видно в плитке «Подтверждено» оранжевой припиской «ждут N». '
      +'Отклонённые не идут тоже, и у них написана причина: её пишет главный администратор, и написана она '
      +'для вас. Если считаете, что отклонили зря, — идите к нему с этой карточкой, а не с общим числом.'],
  zad:'Прочитайте и нажмите «Дальше».'},
 {t:'Мой расчётный лист', cel:'page:pgMoiList',
  txt:['Свою зарплату вы видите сами, за любой месяц. Пока месяц не закрыт, суммы не окончательные — '
      +'об этом наверху жёлтая пометка.'],
  zad:'Откройте «Мой расчётный лист».', tyk:'#n-pgMoiList,#m-pgMoiList,#s-pgMoiList'},
 {t:'Откройте сам лист', otkryt:'pgMoiList', cel:'act:moilist',
  txt:['В листе две строки: «Оклад за месяц» и строка вакансий — «подтверждено 6 (ещё 2 ждут решения)». '
      +'Смен и нормы месяца там нет: у вас свободное посещение, оклад за месяц платится целиком.',
       'Премия за вакансии работает неофициально: налоги с неё не удерживаются. Лист можно распечатать '
      +'или отправить себе в WhatsApp.'],
  zad:'Нажмите «Открыть расчётный лист».', tyk:'#ml-btn'},
 {t:'Антирейтинг', cel:'page:pgAntireiting',
  txt:['Штрафные баллы за нарушения ставит программа сама, ночью. Вас касаются просроченные задачи в Битриксе — '
      +'по баллу за каждую. Балл живёт 90 дней и сгорает сам.'],
  zad:'Откройте «Антирейтинг».', tyk:'#n-pgAntireiting,#m-pgAntireiting,#s-pgAntireiting'},
 {t:'Правила и погода', cel:'act:pravila',
  txt:['Во вкладке «Правила» — за что и сколько баллов. «Погода» показывает счёт: ☀️ ясно — 0 баллов, '
      +'⛅ облачно — 1–5, 🌧️ моросит — 6–14, ☔ зонт обязателен — 15–29, ⛈️ штормовое предупреждение — 30 и больше.'],
  zad:'Откройте вкладку «Правила».', tyk:'#uch-ar-pravila'},
 {t:'Если балл не по делу', cel:'act:osporil',
  txt:['На «Погоде», в «Моей истории», у балла есть кнопка «Оспорить». Напишите причину одной строкой — '
      +'руководитель или администратор посмотрит и снимет, если так. Пока балл не сняли, он считается.'],
  zad:'Вернитесь на «Погоду», нажмите «Оспорить» у балла за 11 сентября и отправьте причину.',
  tyk:'#uch-osp-send,#uch-osporit-0,#uch-ar-pogoda'},
 {t:'Достижения', cel:'page:pgAchivki',
  txt:['Награды за хорошую работу программа выдаёт сама по цифрам учёта, особые вручает руководство. '
      +'У каждой своя статуэтка с именем — её видно на полке и в расшифровке.',
       'За обучение награды тоже есть: «Букварь» — за первый сданный курс, «Сова» — по одной за каждый курс. '
      +'Выдаются не сразу, а ночным расчётом, наутро. Курс засчитывается тому, под кем вы вошли в обучение '
      +'из Битрикса, — поэтому чужой ссылкой на курс лучше не пользоваться: сдача запишется не на вас.'],
  zad:'Откройте «Достижения».', tyk:'#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Профиль и награды', cel:'act:achprofil',
  txt:['Нажмите на человека — откроется его карточка: сколько наград, стаж, день рождения, «Путь» со ступенями, '
      +'«Рекорды» и «Полка наград». Ниже — «Пыльная полка» с антикубками: они временные, в счёт наград не идут '
      +'и на зарплату не влияют.',
       'Вам это нужно и по работе: карточка человека показывает, как у него шли дела, — на собеседовании '
      +'с переводом или при разговоре об увольнении это честнее, чем слова.'],
  zad:'Откройте профиль Александры Забабуриной.', tyk:'#uch-ach-p-0,#uch-ach-lyudi'},
 {t:'Поделиться наградой', cel:'act:achpodel',
  txt:['В карточке награды — статуэтка, её имя, за что даётся и что это за вещь. У своей награды есть '
      +'«📤 Поделиться»: программа рисует открытку 1080×1350. Личных сумм на ней нет.'],
  zad:'Откройте первую статуэтку на полке и нажмите «Поделиться».',
  tyk:'#uch-ach-podelitsya,#uch-ach-n-0,#uch-ach-p-0,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Хоз. заявка', otkryt:'pgHozZayavka', cel:'act:hoz_zayavka',
  txt:['Не хватает чего-то для работы или что-то сломалось — вкладка «🧰 Хоз. заявка». Каждую позицию '
      +'пишите с новой строки, при желании приложите фото и отметьте «Срочно». Заявка сразу уходит руководителю АХО — писать ему в личку не нужно.',
       'Заявка идёт от вашего магазина или отдела. Ниже видно, что ещё в работе и что ответил руководитель АХО, а в «Закрыто за неделю» — '
      +'что сделано и что не будет и почему. Уже есть в работе — повторять не нужно.'],
  zad:'Напишите заявку и нажмите «Отправить заявку».', tyk:'#uch-hoz,#uch-hoz-btn'},
 {t:'Что нового', cel:'page:pgChangelog',
  txt:['Программа меняется часто. Что поменялось — человеческими словами, по датам — на странице «Что нового». '
      +'Она открывается щелчком по строке версии внизу бокового меню, а на телефоне — внизу листа «Ещё». '
      +'Сверху там номер версии: если он старее, чем у коллег, закройте вкладку и откройте заново.'],
  zad:'Щёлкните по строке версии внизу меню.', tyk:'#n-pgChangelog,#m-pgChangelog,#s-pgChangelog,#sb-ver,#ms-ver'},
];

KURSY.smm = [
 {t:'Ваш экран — «Мой расчётный лист»', otkryt:'pgMoiList', cel:'page:pgMoiList',
  txt:['Вы SMM-менеджер. В программе учёта продаж у вас четыре пункта: «Отчёт за день», «Мой расчётный лист», '
      +'«Антирейтинг» и «Достижения». Продажи, графики и кассы вас не касаются — программа открывается сразу на вашем листе.',
       'Графика и отметок у вас нет: рабочий день засчитывается по сданному «Отчёту за день» — '
      +'день без отчёта не учитывается в зарплате. Оклад — 200 000 ₸ за месяц.'],
  zad:'Откройте «Мой расчётный лист».', tyk:'#n-pgMoiList,#m-pgMoiList,#s-pgMoiList'},
 {t:'Отчёт за день', cel:'page:pgOtchet',
  txt:['Ежедневный отчёт теперь сдаётся здесь, в программе, а не в Битриксе. Он сразу уходит руководству в Telegram.',
       'Без отчёта рабочий день не засчитывается в зарплату. Забыли сдать - отчёт можно сдать за любой из последних 40 дней: '
      +'вверху список несданных дней, внизу выбор даты. Такой отчёт придёт руководителю на проверку, и день засчитает он.'],
  zad:'Откройте «Отчёт за день».', tyk:'#n-pgOtchet,#m-pgOtchet,#s-pgOtchet'},
 {t:'Сдайте отчёт', cel:'act:otchet_ofisa',
  txt:['Обязательно только «Что сделано за день»: пишите конкретно — что сделано и чем закончилось. '
      +'Планы и проблемы — по желанию; проблемы руководство читает в первую очередь.'],
  zad:'Напишите, что сделано, и нажмите «Сдать отчёт».', tyk:'#uch-otc,#uch-otc-btn'},
 {t:'Откройте сам лист', otkryt:'pgMoiList', cel:'act:moilist',
  txt:['В листе одна строка начисления — «Оклад за месяц», и итог к выплате. Ни смен, ни нормы месяца там нет: '
      +'это и значит свободное посещение.',
       'Аванс, удержания и премию вносит бухгалтер в корректировке — они появятся в листе отдельными строками. '
      +'Лист можно распечатать или отправить себе в WhatsApp.'],
  zad:'Нажмите «Открыть расчётный лист».', tyk:'#ml-btn'},
 {t:'Антирейтинг', cel:'page:pgAntireiting',
  txt:['Штрафные баллы за нарушения программа ставит сама, ночью. Вас касаются просроченные задачи в Битриксе — '
      +'по баллу за каждую, и несданный «Отчёт за день» — балл. '
      +'Балл живёт 90 дней и сгорает сам.'],
  zad:'Откройте «Антирейтинг».', tyk:'#n-pgAntireiting,#m-pgAntireiting,#s-pgAntireiting'},
 {t:'Правила и погода', cel:'act:pravila',
  txt:['Во вкладке «Правила» — за что и сколько баллов. «Погода» показывает счёт: ☀️ ясно — 0 баллов, '
      +'⛅ облачно — 1–5, 🌧️ моросит — 6–14, ☔ зонт обязателен — 15–29, ⛈️ штормовое предупреждение — 30 и больше.'],
  zad:'Откройте вкладку «Правила».', tyk:'#uch-ar-pravila'},
 {t:'Если балл не по делу', cel:'act:osporil',
  txt:['На «Погоде», в «Моей истории», у балла есть кнопка «Оспорить». Напишите причину одной строкой — '
      +'руководитель или администратор посмотрит и снимет, если так. Пока балл не сняли, он считается.'],
  zad:'Вернитесь на «Погоду», нажмите «Оспорить» у балла за 11 сентября и отправьте причину.',
  tyk:'#uch-osp-send,#uch-osporit-0,#uch-ar-pogoda'},
 {t:'Достижения', cel:'page:pgAchivki',
  txt:['Награды за хорошую работу программа выдаёт сама по цифрам учёта, особые вручает руководство. '
      +'У каждой своя статуэтка с именем — её видно на полке и в расшифровке.',
       'За обучение награды тоже есть: «Букварь» — за первый сданный курс, «Сова» — по одной за каждый курс. '
      +'Выдаются ночным расчётом, наутро. Курс засчитывается тому, под кем вы вошли в обучение из Битрикса, — '
      +'поэтому чужой ссылкой на курс лучше не пользоваться: сдача запишется не на вас.'],
  zad:'Откройте «Достижения».', tyk:'#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Профиль и награды', cel:'act:achprofil',
  txt:['Нажмите на человека — откроется его карточка: сколько наград, стаж, день рождения, «Путь» со ступенями, '
      +'«Рекорды» и «Полка наград». Ниже — «Пыльная полка» с антикубками: они временные, в счёт наград не идут '
      +'и на зарплату не влияют.'],
  zad:'Откройте профиль Александры Забабуриной.', tyk:'#uch-ach-p-0,#uch-ach-lyudi'},
 {t:'Поделиться наградой', cel:'act:achpodel',
  txt:['В карточке награды — статуэтка, её имя, за что даётся и что это за вещь. У своей награды есть '
      +'«📤 Поделиться»: программа рисует открытку 1080×1350. Личных сумм на ней нет.'],
  zad:'Откройте первую статуэтку на полке и нажмите «Поделиться».',
  tyk:'#uch-ach-podelitsya,#uch-ach-n-0,#uch-ach-p-0,#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Хоз. заявка', otkryt:'pgHozZayavka', cel:'act:hoz_zayavka',
  txt:['Не хватает чего-то для работы или что-то сломалось — вкладка «🧰 Хоз. заявка». Каждую позицию '
      +'пишите с новой строки, при желании приложите фото и отметьте «Срочно». Заявка сразу уходит руководителю АХО — писать ему в личку не нужно.',
       'Заявка идёт от вашего магазина или отдела. Ниже видно, что ещё в работе и что ответил руководитель АХО, а в «Закрыто за неделю» — '
      +'что сделано и что не будет и почему. Уже есть в работе — повторять не нужно.'],
  zad:'Напишите заявку и нажмите «Отправить заявку».', tyk:'#uch-hoz,#uch-hoz-btn'},
 {t:'Что нового', cel:'page:pgChangelog',
  txt:['Программа меняется часто. Что поменялось — человеческими словами, по датам — на странице «Что нового». '
      +'Она открывается щелчком по строке версии внизу бокового меню, а на телефоне — внизу листа «Ещё». '
      +'Сверху там номер версии: если он старее, чем у коллег, закройте вкладку и откройте заново.'],
  zad:'Щёлкните по строке версии внизу меню.', tyk:'#n-pgChangelog,#m-pgChangelog,#s-pgChangelog,#sb-ver,#ms-ver'},
];

// ── движок тренера ──
const KEY = 'fbsm.obuch.v2';
const tr = {
  kurs:null, i:0, gotovo:false, rol:null,
  // Какие шаги уже выполнены. Нужно для «← Назад»: одноразовое действие
  // (подтвердить день, сдать отчёт, принять сверку) второй раз не сделать,
  // и без этой памяти человек застревал на пройденном шаге.
  sdelano:{},

  start(rol){
    this.rol = rol;
    this.kurs = KURSY[rol] || KURSY.seller;
    const d = this.chitat();
    this.i = (d && d.rol===rol) ? Math.min(d.i, this.kurs.length-1) : 0;
    this.sdelano = {};
    if(d && d.rol===rol && Array.isArray(d.sdelano)) d.sdelano.forEach(n=>{ this.sdelano[n] = true; });
    this.shag();
  },
  stop(){ document.getElementById('trener').innerHTML=''; },

  chitat(){ try{ return JSON.parse(localStorage.getItem(KEY)||'null'); }catch(e){ return null; } },
  pisat(){ try{ localStorage.setItem(KEY, JSON.stringify(
      {rol:this.rol, i:this.i, sdelano:Object.keys(this.sdelano).map(Number)})); }catch(e){} },

  shag(){
    const s = this.kurs[this.i];
    this.gotovo = !s.cel || !!this.sdelano[this.i];
    this.pisat();
    if(s.otkryt && window[s.otkryt]) window[s.otkryt]();
    this.risovat();
    // Подсветку ставим после отрисовки страницы: раньше её просто нечего подсвечивать.
    setTimeout(()=>this.podsvetit(), 60);
    window.scrollTo(0,0);
  },

  // Подсвечиваем ПЕРВОЕ, что нашлось на странице. Порядок в tyk такой:
  // сначала цель на нужном экране, потом пункт меню, которым до неё дойти.
  // Пока человек не перешёл, кнопки нет — светится меню; перешёл — светится
  // кнопка. Раньше подсветка ставилась один раз, и после перехода человек
  // искал нужное сам.
  podsvetit(){
    document.querySelectorAll('.tr-tyk').forEach(e=>e.classList.remove('tr-tyk'));
    const s = this.kurs[this.i];
    if(!s.tyk || this.gotovo) return;
    for(const sel of s.tyk.split(',')){
      const el = document.querySelector(sel.trim());
      if(el){ el.classList.add('tr-tyk'); return; }
    }
  },

  // Страницы и кнопки сообщают сюда, что человек сделал.
  sobytie(chto){
    const s = this.kurs && this.kurs[this.i];
    // Экран перерисовался — плашку сверху и подсветку ставим заново.
    if(chto.indexOf('page:')===0) setTimeout(()=>{ this.verh(); this.podsvetit(); }, 0);
    if(!s || this.gotovo || !s.cel) { return; }
    let popal = (s.cel === chto);
    // Цель вида act:smena:4 — «поставить столько-то»: сравниваем число.
    if(!popal && s.cel.startsWith('act:smena:') && chto.startsWith('act:smena:'))
      popal = (+chto.split(':')[2] >= +s.cel.split(':')[2]);
    if(!popal) return;
    this.gotovo = true;
    this.sdelano[this.i] = true;
    this.pisat();
    document.querySelectorAll('.tr-tyk').forEach(e=>e.classList.remove('tr-tyk'));
    this.niz();
  },

  dalee(){
    if(!this.gotovo) return;
    if(this.i+1 >= this.kurs.length){ this.finish(); return; }
    this.i++; this.shag();
  },
  nazad(){ if(this.i>0){ this.i--; this.shag(); } },

  risovat(){ this.verh(); this.niz(); },

  verh(){
    const s = this.kurs[this.i], n = this.kurs.length;
    const c = document.getElementById('content');
    if(!c) return;
    const old = c.querySelector('.tr-verh'); if(old) old.remove();
    const d = document.createElement('div');
    d.className = 'tr-verh';
    d.innerHTML = `<div class="tr-n">Шаг ${this.i+1} из ${n} · ${esc(ROLE_LABELS[this.rol])}</div>`
      + `<h3>${esc(s.t)}</h3>`
      + (s.txt||[]).map(p=>`<p>${esc(p)}</p>`).join('')
      + `<div class="tr-pb"><i style="width:${Math.round(this.i/n*100)}%"></i></div>`;
    c.insertBefore(d, c.firstChild);
  },

  niz(){
    const s = this.kurs[this.i], posl = (this.i+1 >= this.kurs.length);
    document.getElementById('trener').innerHTML = `
      <div class="tr-niz"><div class="tr-in">
        <div class="tr-zad"><b>Задание</b>
          ${this.gotovo ? '<span class="tr-ok">✓ Выполнено</span> — <span>'+esc(s.zad||'')+'</span>' : '<span>'+esc(s.zad||'')+'</span>'}
        </div>
        ${this.i>0?'<button class="btn bsm" onclick="tr.nazad()">← Назад</button>':''}
        <button class="btn bp" onclick="tr.dalee()" ${this.gotovo?'':'disabled'}>
          ${posl?'Завершить':'Дальше →'}</button>
      </div></div>`;
  },

  finish(){
    document.getElementById('trener').innerHTML='';
    setTitle('Обучение пройдено'); setBadge('');
    const data = new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
    setContent(`
      <div class="card" style="max-width:720px"><div class="ct">🎓 Обучение пройдено</div>
        <p style="color:var(--muted)">Отправьте свидетельство руководителю — по нему
          засчитают аттестацию.</p>
        <canvas id="cert" class="tr-cert" width="1000" height="620"></canvas>
        <div class="codebox" id="uch-kod" style="font:600 18px/1.2 ui-monospace,Consolas,monospace;letter-spacing:.04em;
          color:var(--blue,#185FA5);background:var(--bl,#e8f0fa);border:1px dashed var(--blue,#185FA5);
          border-radius:8px;padding:10px 14px;margin:1rem 0 0;text-align:center"></div>
        <button class="btn bp bbl" style="margin-top:1rem" onclick="uchOtpravit()">📲 Отправить в WhatsApp</button>
        <button class="btn bbl" style="margin-top:.6rem" onclick="uchSkachat()">⬇️ Сохранить картинку</button>
        <div class="rnote" id="uch-shint">На телефоне откроется выбор приложения —
          выберите WhatsApp и отправьте на +7 777 186 54 33.</div>
      </div>
      <div class="card" style="max-width:720px">
        <button class="btn bbl" onclick="tr.i=0;tr.shag()">Пройти заново</button>
      </div>`);
    cert(document.getElementById('cert'), CU.name, ROLE_LABELS[this.rol], data);
    const kod = uchKod(CU.name, this.rol, data);
    document.getElementById('uch-kod').textContent = kod;
    // Открыто из платформы обучения — она подставила обработчик и запишет
    // результат на портал. Открыто просто так — обработчика нет, остаётся картинка.
    if(typeof window.__onCourseDone === 'function'){
      try{ window.__onCourseDone({name:CU.name, right:this.kurs.length, total:this.kurs.length, code:kod, date:data}); }
      catch(e){ /* свидетельство всё равно показано */ }
    }
    try{ localStorage.removeItem(KEY); }catch(e){}
  },
};
window.tr = tr;

function uchKod(imya, rol, data){
  const s = String(imya||'').trim().toLowerCase()+'|'+rol+'|'+data;
  let a = 2166136261, b = 5381;
  for(let i=0;i<s.length;i++){ const c=s.charCodeAt(i);
    a = Math.imul(a ^ c, 16777619) >>> 0; b = (Math.imul(b, 33) + c) >>> 0; }
  const z = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const part = n => { let o=''; for(let i=0;i<5;i++){ o+=z[n%34]; n=Math.floor(n/34); } return o; };
  return 'FBSM-'+part(a)+'-'+part(b);
}
function cert(cv,imya,rol,data){
  const c=cv.getContext('2d'), W=cv.width;
  c.fillStyle='#0f2b4a'; c.fillRect(0,0,W,cv.height);
  c.strokeStyle='rgba(255,255,255,.18)'; c.lineWidth=2; c.strokeRect(28,28,W-56,cv.height-56);
  const cx=W/2; c.textAlign='center';
  c.fillStyle='#7fb4e8'; c.font='600 26px system-ui,sans-serif';
  c.fillText('FBSM · СИСТЕМА УЧЁТА ПРОДАЖ', cx, 96);
  c.fillStyle='#fff'; c.font='700 54px system-ui,sans-serif';
  c.fillText('Обучение пройдено', cx, 176);
  c.fillStyle='#9db9d6'; c.font='400 24px system-ui,sans-serif';
  c.fillText('подтверждаем, что программу освоил', cx, 232);
  let r=62; c.font='700 '+r+'px system-ui,sans-serif';
  while(c.measureText(imya).width > W-160 && r>26){ r-=3; c.font='700 '+r+'px system-ui,sans-serif'; }
  c.fillStyle='#fff'; c.fillText(imya, cx, 316);
  c.strokeStyle='#2f5f92'; c.lineWidth=3;
  c.beginPath(); c.moveTo(cx-190,344); c.lineTo(cx+190,344); c.stroke();
  c.fillStyle='#7fb4e8'; c.font='600 30px system-ui,sans-serif'; c.fillText(rol, cx, 396);
  c.fillStyle='#9db9d6'; c.font='400 22px system-ui,sans-serif'; c.fillText(data, cx, 452);
  c.font='400 19px system-ui,sans-serif'; c.fillStyle='#6f8dae';
  c.fillText('Все шаги курса выполнены, задания зачтены', cx, 520);
  c.fillText('Отправьте это изображение руководителю', cx, 552);
}
window.uchSkachat = function(){
  const a=document.createElement('a');
  a.download='FBSM-обучение-'+CU.name.replace(/\s+/g,'-')+'.png';
  a.href=document.getElementById('cert').toDataURL('image/png'); a.click();
};
// Картинку в WhatsApp отдаёт только системное «поделиться»: ссылка wa.me
// умеет нести лишь текст. На компьютере, где «поделиться» обычно нет,
// сохраняем файл и открываем переписку с готовой подписью.
window.uchOtpravit = async function(){
  const cv=document.getElementById('cert');
  const text='Обучение FBSM пройдено. '+CU.name+' — '+ROLE_LABELS[tr.rol]+'.';
  try{
    const blob=await new Promise(r=>cv.toBlob(r,'image/png'));
    const file=new File([blob],'FBSM-обучение.png',{type:'image/png'});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({files:[file], text}); return;
    }
  }catch(e){}
  uchSkachat();
  const h=document.getElementById('uch-shint');
  if(h) h.textContent='Картинка сохранена. Сейчас откроется WhatsApp — прикрепите её вручную.';
  setTimeout(()=>window.open('https://wa.me/'+TEL_RUK+'?text='+encodeURIComponent(text),'_blank'),700);
};

// ══ ЗАПУСК ═══════════════════════════════════════════════════
(function(){
  const sel=document.getElementById('lname');
  sel.innerHTML='<option value="">— выберите должность —</option>'
    + ROLI.map(r=>`<option value="${r.id}">${r.nm}</option>`).join('');
  // Поле имени: в боевой его нет, здесь оно нужно для свидетельства.
  const fg=sel.closest('.fg');
  fg.insertAdjacentHTML('beforebegin',
    '<div class="fg"><label class="fl">Как вас зовут</label>'
    +'<input id="l-imya" class="fc" placeholder="Фамилия и имя"></div>');
  fg.querySelector('.fl').textContent='Ваша должность';
  document.querySelector('.ac .sub').textContent='Обучение · тренировка на выдуманных данных';
  document.getElementById('lpass').closest('.fg').insertAdjacentHTML('beforeend',
    '<div class="rnote">В боевой программе вы выбираете своё имя и вводите свой пароль. '
    +'Здесь вместо имени — должность, а пароль для всех один: <b>1234</b>.</div>');
  const l=document.getElementById('loader'); if(l) l.style.display='none';
  showScreen('login');
  const d=tr.chitat();
  if(d && d.rol) document.getElementById('lname').value=d.rol;
  // Режим курса: платформа обучения открывает тренажёр сразу на нужной должности.
  const KR = window.__KURS_ROL;
  if(KR && ROLE_LABELS[KR]){
    sel.value = KR; fg.style.display = 'none';
    document.getElementById('lpass').closest('.fg').style.display = 'none';
    document.querySelector('.ac .sub').textContent = 'Курс «'+ROLE_LABELS[KR]+'» · тренировка на выдуманных данных';
    if(window.__KURS_IMYA) document.getElementById('l-imya').value = window.__KURS_IMYA;
  }
})();
