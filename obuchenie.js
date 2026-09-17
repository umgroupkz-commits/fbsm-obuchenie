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
  {id:'accountant',nm:'Бухгалтер'},
  {id:'admin',     nm:'Главный администратор'},
];
const ROLE_LABELS = {};
ROLI.forEach(r => ROLE_LABELS[r.id] = r.nm);
const CLOCK_ROLES = ['runner','whhead','store','immgr'];
const isClockRole = r => CLOCK_ROLES.indexOf(r) >= 0;

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
  'История продавцов':'Продавцы','История отчётов':'Отчёты','Новые из 1С':'Из 1С',
  'Мой дашборд':'Дашборд','Отметка смены':'Смена','Сотрудники':'Люди'};

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
  return isClockRole(CU.role)
  ?[{g:'Моя работа'},
    {ic:'🕒',l:'Смена',fn:'pgRunner'},{ic:'📋',l:'История',fn:'pgRunnerHist'},
    {ic:'💰',l:'Моя ЗП',fn:'pgRunnerZP'}, LIST, ANTI, ACH,
    {g:'Магазин'}, GRAF]
  :CU.role==='streammgr'
  ?[{g:'Моя работа'},{ic:'💰',l:'Моя ЗП',fn:'pgEfirZP'}, LIST, ANTI, ACH,
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
    {ic:'📚',l:'История отчётов',fn:'pgReportHist'},{ic:'⏱️',l:'Задержки',fn:'pgDelays'},
    {g:'Люди'},{ic:'👤',l:'Сотрудники',fn:'pgSellers'},{ic:'📖',l:'История продавцов',fn:'pgSellerHist'}, ANTI, ACH,
    {g:'Деньги'},{ic:'💹',l:'Моя ЗП',fn:'pgMgrDash'}, LIST,
    {ic:'💰',l:'Начисление ЗП',fn:'pgPayroll'}]
  :CU.role==='accountant'
  ?[{g:'Деньги'},{ic:'💰',l:'Начисление ЗП',fn:'pgPayroll'},{ic:'💵',l:'Касса',fn:'pgKassa'},
    {g:'Магазин'}, GRAF,{ic:'⏱️',l:'Задержки',fn:'pgDelays'}, ANTI, ACH]
  :[{g:'Магазины'},
    {ic:'📊',l:'Сводка',fn:'pgReport'},{ic:'📈',l:'Дашборд',fn:'pgDash2'},
    {ic:'👣',l:'Посещения',fn:'pgVisits'}, GRAF,
    {ic:'🏆',l:'Рейтинг',fn:'pgRating'},
    {g:'Люди'},{ic:'👤',l:'Сотрудники',fn:'pgSellers'},{ic:'👥',l:'Новые из 1С',fn:'pgQueue'},
    {ic:'📖',l:'История продавцов',fn:'pgSellerHist'},{ic:'📚',l:'История отчётов',fn:'pgReportHist'},
    {ic:'🔐',l:'Входы в программу',fn:'pgLogins'},{ic:'⏱️',l:'Задержки',fn:'pgDelays'}, ANTI, ACH,
    {g:'Деньги'},{ic:'💰',l:'Начисление ЗП',fn:'pgPayroll'},
    {ic:'💵',l:'Касса',fn:'pgKassa'},{ic:'🎯',l:'Планы',fn:'pgPlans'},{ic:'⚙️',l:'Параметры',fn:'pgParams'}];
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
  </div>`);
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
  </div>`);
};
window.uchPodtverdit = function(){
  _podtv = true;
  PRODAZHI[0].st = 'ок';
  tr.sobytie('act:podtverdil');
  pgEnter();
};

window.pgHist = function(){
  nav('pgHist'); setTitle('История продаж'); setBadge('');
  setContent(`
  <div class="card"><div class="ct">Сентябрь</div>
    <div class="tw-wrap"><table>
      <tr><th>Дата</th><th>Продажи</th><th>Чеков</th><th>Позиций</th><th>Статус</th></tr>
      ${PRODAZHI.map(p=>`<tr${p.st==='ждёт'?' style="background:var(--al)"':''}>
        <td>${p.d} сентября</td><td>${fmtN(p.s)}</td><td>${p.c}</td><td>${p.u}</td>
        <td>${p.st==='ждёт'
          ? '<span class="tag tw">ждёт вашего подтверждения</span>'
          : '<span class="tag ts">✓ в расчёте</span>'}</td></tr>`).join('')}
    </table></div>
    <div class="rnote">Жёлтым — дни, которые вы ещё не подтвердили. Если такой день
      висит несколько суток, утром об этом напомнят в общий чат.</div>
  </div>`);
};

window.pgRating = function(){
  nav('pgRating'); setTitle('Рейтинг'); setBadge('');
  const r = [['Забабурина Александра','Манаса',154],['Толегенова Бибигул','Асфендиярова',126],
             ['Абдуолимов Абдуллах','Алматы',102],[CU.name+' (вы)','Алматы',74]];
  setContent(`
  <div class="card"><div class="ct">Рейтинг сети · сентябрь</div>
    <div class="tw-wrap"><table>
      <tr><th>#</th><th>Продавец</th><th>Магазин</th><th>Выполнение</th></tr>
      ${r.map((x,i)=>`<tr${x[0].includes('(вы)')?' style="background:var(--al)"':''}>
        <td>${i+1}</td><td>${esc(x[0])}</td><td>${esc(x[1])}</td>
        <td style="font-weight:700;color:${x[2]>=100?'var(--green)':'var(--amber)'}">${x[2]}%</td></tr>`).join('')}
    </table></div>
    <div class="rnote">Рейтинг общий по всей сети и открыт всем. Считается по проценту
      выполнения плана, а не по сумме — иначе у большого магазина было бы преимущество.</div>
  </div>`);
};

// ── график с настоящей кистью ──
const G_DNEY = 14;
let _grafik = {}, _kist = null;
window.pgSchedule = function(){
  nav('pgSchedule'); setTitle('График смен'); setBadge('');
  const mozhet = CU.role==='admin' || CU.role==='manager';
  const lyudi = USERS.filter(u=>['seller','streamer','streammgr'].indexOf(u.role)>=0);
  let h = '<div class="card"><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">'
    + '<select class="fc" style="width:auto"><option>сентябрь 2026 г.</option></select>'
    + '<b style="font-size:15px">'+esc(MAG)+'</b></div></div>';
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
      const k=u.id+'|'+d, est=!!_grafik[k];
      if(est) pl++;
      row += '<td class="sch-day"><div class="sch-cell'+(est?'':' noplan')+'" '
          + (mozhet?('onclick="uchKletka(\''+u.id+'\','+d+')"'):'')
          + '><div class="sch-p" style="'+(est?'background:#A32D2D;color:#fff':'color:var(--muted)')+'">'
          + (est?'АТ':'')+'</div><div class="sch-f"></div></div></td>';
    }
    h += '<tr><td class="sch-name"><b>'+esc(u.name)+'</b>'
       + '<div style="font-size:11px;color:var(--muted)">'+ROLE_LABELS[u.role]+'</div></td>'
       + row + '<td class="sch-tot">'+pl+'</td><td class="sch-tot">0</td></tr>';
  });
  h += '</tbody></table></div>';
  h += '<div class="rnote">'+(mozhet
      ? 'Кисть — главный приём: включили один раз и щёлкаете по дням. Без неё клик '
        +'по клетке открывает диалог, где комментарий к дню, подмена и ручной зачёт выхода.'
      : 'График ставит управляющий. Если вас нет в графике на день, вы не сможете '
        +'подтвердить за него продажи — это защита от того, чтобы чужие продажи '
        +'записались на вас.')+'</div></div>';
  setContent(h);
};
window.uchKist = function(){ _kist = !_kist; tr.sobytie('act:kist'); pgSchedule(); };
window.uchKletka = function(uid,d){
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
    ${_otchet?'<div class="alert as" style="display:block">✓ Отчёт заполнил '+esc(CU.name)
      +' · ушёл в Битрикс. Можно поправить и отправить заново.</div>':''}
    <div class="alert ai" style="display:block">Выручка, чеки и единицы подставлены из 1С.
      Править их здесь нельзя — если цифра неверна, дело в 1С.</div>
    <div class="g3" style="margin:1rem 0">
      <div class="metric"><div class="ml">Выручка (₸)</div><div class="mv">${fmtN(644955)}</div></div>
      <div class="metric"><div class="ml">Чеков</div><div class="mv">50</div></div>
      <div class="metric"><div class="ml">Позиций в чеках</div><div class="mv">113</div></div>
    </div>
    <div class="rnote">Позиция — это строка в чеке, а не штука: две одинаковые вещи одной строкой — одна позиция.</div>
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
      <div class="rnote" style="margin-top:0">Отметьте пункты, выполненные за смену.</div></div>
    <div style="border-top:1px solid var(--bd);margin-top:1rem;padding-top:1rem">
      <div class="ct">Задачи смены</div><button class="btn bsm">+ задача</button></div>
    <div style="border-top:1px solid var(--bd);margin-top:1rem;padding-top:1rem">
      <div class="ct">Возвраты</div><button class="btn bsm">+ возврат</button></div>
    <div style="border-top:1px solid var(--bd);margin-top:1rem;padding-top:1rem">
      <div class="fg"><label class="fl">Инциденты</label>
        <textarea class="fc" rows="2" placeholder="Нештатные ситуации, поломки, конфликты. Если всё спокойно — напишите: Без инцидентов"></textarea></div></div>
    <button class="btn bp bbl" id="uch-send" onclick="uchOtchet()" disabled>Отправить отчёт</button>
    <div class="rnote">Заполняйте ближе к закрытию: программа берёт цифры на момент
      открытия страницы. Открыли в семь вечера, отправили в десять — увидите семичасовые.
      Если 1С досчитает день позже, отчёт обновится сам, заново слать не нужно.</div>
    ${CU.role==='manager'?'<div class="rnote">Отправка отчёта засчитает вам смену в графике за этот день.</div>':''}
  </div>`);
};
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

// ── антирейтинг ──
const BALL_PRAVILA_U = [
  ['Прогул: смена стоит в графике, а отметки о выходе нет до конца следующего дня', '10', 'магазины, склад и офис по графику'],
  ['Отчёт магазина сдан не в день смены', '1', 'кто сдаёт отчёт магазина'],
  ['Касса не закрыта в день смены', '1', 'кассир смены'],
  ['Смена без отметки прихода или ухода', '1', 'кто отмечается кнопками смены'],
  ['Отметку прихода или ухода исправили задним числом (больше чем на 5 минут)', '1', 'кто отмечается кнопками смены'],
  ['Ежедневный отчёт в Битриксе не сдан: поле «Что сделано за день» пустое', '1', 'у кого есть ежедневный отчёт'],
  ['Задача в Битриксе просрочена или сдана после срока', '1', 'исполнитель задачи'],
  ['Задача висит просроченной ещё неделю', '1 за неделю', 'исполнитель задачи'],
  ['Балл от администратора — всегда с причиной', '1', 'все'],
];
const BALL_SKORO_U = [
  'опоздание по графику — по времени открытия кассы',
  'клиенту не ответили 24 часа',
  'жалоба клиента',
  'обязательный курс не пройден в срок',
];
const BALL_NET_U = [
  'выходной, отпуск, больничный',
  'срок задачи перенесли до того, как он наступил',
  'последний комментарий в задаче до срока — ваш (например, почему не успеваете)',
  'задачу поставили уже с прошедшим сроком',
  'работу сдали на проверку вовремя, а постановщик принял позже',
  'ежедневный отчёт ушёл в «Не сдан», но текст в нём написан',
];
let _arVkl = 'pogoda', _osporil = false;
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
  setContent(tabs + `
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
const ACH_U = [
  {n:'Забабурина Александра', d:'Продавец-консультант · Республика', g:[['👑','Продавец месяца','Лучший сводный индекс сети за август 2026: 1,25'],['🛒','UPT 2,5','UPT за август 2026: 2,57'],['🎯','План 100 %','План за август 2026 выполнен на 154 %']]},
  {n:'Торебай Гулжайкын', d:'Продавец-консультант · Манаса', g:[['🏪','Лучшие продажи магазина','Лучшие продажи в точке Манаса за август 2026'],['🌱','Первая продажа','Первая продажа — 11 августа 2026']]},
  {n:'Акишева Жанар', d:'Продавец-кассир · Асфендиярова', g:[['📆','Первая неделя','Пятая смена — 17 августа 2026']]},
];
let _achVklU = 'lyudi';
window.pgAchivki = function(){
  nav('pgAchivki'); setTitle('Достижения'); setBadge('');
  const b = (v,t) => `<button class="btn bsm ${_achVklU===v?'bp':''}" id="uch-ach-${v}" onclick="uchAchVkl('${v}')">${t}</button>`;
  const tabs = `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:1rem">${b('lyudi','👥 Люди')}${b('ordena','🏅 Ордена')}${b('lenta','🕒 Лента')}${b('pravila','📋 Правила')}</div>`;
  if(_achVklU==='pravila'){
    setContent(tabs + `<div class="card" style="max-width:640px"><div class="ct">Как считается сводный индекс</div>
      <p style="margin:0 0 .5rem">Побеждает лучший, а не тот, у кого больше покупателей. Каждый показатель сравнивается с обычным уровнем: 1,00 — как у всех.</p>
      <div class="tw-wrap"><table><tr><td>План — продажи ÷ личный план</td><td><b>40 %</b></td></tr>
      <tr><td>Средний чек ÷ средний чек своей точки</td><td><b>20 %</b></td></tr>
      <tr><td>UPT ÷ UPT своей точки</td><td><b>20 %</b></td></tr>
      <tr><td>Вклад на смене — продал ÷ честная доля</td><td><b>20 %</b></td></tr></table></div>
      <div class="rnote">Ниже на вкладке — все ачивки: за что даются, кому и сколько раз.</div></div>`);
    return;
  }
  if(_achVklU!=='lyudi'){
    setContent(tabs + `<div class="card" style="max-width:640px"><div class="ct">${_achVklU==='ordena'?'Ордена':'Последние награды'}</div>
      <p style="margin:0">${_achVklU==='ordena'?'Все награды компании. Серые — ещё никем не получены; нажмите — там условие и все, у кого она есть.':'Новые награды по дням. Нажмите — откроется, за что именно.'}</p></div>`);
    return;
  }
  setContent(tabs + `<div class="card" style="max-width:640px">` + ACH_U.map((p,i)=>`
    <button id="uch-ach-p-${i}" onclick="uchAchProfil(${i})" style="display:flex;gap:12px;align-items:center;width:100%;text-align:left;padding:10px;border:1px solid var(--border);border-radius:var(--rs);background:var(--surface);margin-bottom:8px;cursor:pointer;color:var(--text);font:inherit">
      <span style="width:44px;height:44px;border-radius:50%;background:var(--bl);color:var(--bd);display:inline-flex;align-items:center;justify-content:center;font-weight:700;flex:none">${p.n.split(' ').map(x=>x[0]).join('')}</span>
      <span><b>${esc(p.n)}</b><span style="display:block;font-size:12px;color:var(--muted)">${esc(p.d)} · наград: ${p.g.length}</span>
      <span style="display:block;font-size:22px">${p.g.map(x=>x[0]).join(' ')}</span></span></button>`).join('') + `</div>`);
};
window.uchAchVkl = function(v){ _achVklU = v; pgAchivki(); };
window.uchAchProfil = function(i){
  const p = ACH_U[i], ov = document.createElement('div'); ov.className = 'ov';
  ov.innerHTML = `<div class="ovc" style="max-width:520px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><b>${esc(p.n)}</b>
    <button class="btn bsm" id="uch-ach-zakryt" onclick="this.closest('.ov').remove()">✕</button></div>
    <div style="font-size:13px;color:var(--muted);margin-bottom:.8rem">${esc(p.d)} · фото и должность — из Битрикса</div>
    ${p.g.map(x=>`<div style="display:flex;gap:10px;padding:8px;border:1px solid var(--border);border-radius:var(--rs);margin-bottom:6px"><span style="font-size:28px">${x[0]}</span><span><b>${esc(x[1])}</b><span style="display:block;font-size:12.5px">${esc(x[2])}</span></span></div>`).join('')}
    <div class="rnote">Нажмите на награду в программе — откроется расшифровка: из чего сложился индекс и кто занял первые места.</div></div>`;
  document.body.appendChild(ov);
  tr.sobytie('act:achprofil');
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
infoPage('pgVisits', 'Посещения', 'Динамика трафика: сколько посетителей было по дням.');
infoPage('pgReportHist', 'История отчётов', 'Отчёты магазинов по дням. Пропущенные дни видны сразу: отчёт, которого нет, — это тоже факт.');
infoPage('pgDelays', 'Задержки', 'Продажи подтверждают и отчёт отправляют день в день, крайний срок — утро следующего. Здесь видно, кто не успел.');
infoPage('pgSellerHist', 'История продавцов', 'История работы продавцов магазина.');
infoPage('pgQueue', 'Новые из 1С', 'Люди, пришедшие из 1С, ждут сопоставления с должностью и подразделением. Несопоставленный продавец в расчёт не попадёт.');
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

// ── начисление ──
let _zakryt = false, _excel = false;
window.pgPayroll = function(){
  nav('pgPayroll'); setTitle('Начисление ЗП'); setBadge('');
  const r = [['Забабурина Александра',14,5223760,154,407426],
             ['Семикопенко Дарья',15,7463973,101,388559],
             ['Акишева Жанар',13,3115699,104,202628]];
  setContent(`
  <div class="alert" style="display:block;background:var(--al);color:var(--amber);font-size:13px">⚠️ Проверьте до выплаты:
    2 оплаченных дня без отметки в графике · график Караганды не подписан · 1 смена раннера на проверке</div>
  <div class="card"><div class="ct">Август · продавцы</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:.75rem">
      <button class="btn bsm" id="uch-excel" onclick="uchExcel()">📊 Экспорт в Excel</button>
      <button class="btn bsm" id="uch-zakryt" onclick="uchZakrytMesyac()" ${_zakryt?'disabled':''}>${_zakryt?'Месяц закрыт':'🔒 Закрыть месяц'}</button></div>
    ${_excel?'<div class="alert as" style="display:block">✓ Начисления выгружены в Excel (в обучении — без файла)</div>':''}
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
window.uchKorr = function(kto){
  const ov=document.createElement('div'); ov.className='ov';
  ov.innerHTML=`<div class="ovc" style="max-width:420px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <b>Корректировка — ${esc(kto)}</b>
      <button class="btn bsm" onclick="this.closest('.ov').remove()">✕</button></div>
    <div class="fr"><div class="fg"><label class="fl">Аванс</label><input class="fc" type="number" value="0"></div>
      <div class="fg"><label class="fl">Штрафы</label><input class="fc" type="number" value="0"></div></div>
    <div class="fr"><div class="fg"><label class="fl">Премия</label><input class="fc" type="number" value="0"></div>
      <div class="fg"><label class="fl">Смены (если забыл отметиться)</label><input class="fc" type="number" placeholder="как есть"></div></div>
    <button class="btn bp bbl tr-tyk" id="uch-sohr-korr" onclick="uchSohrKorr(this)">Сохранить</button>
    <div class="rnote">Вписанные здесь смены важнее расчётных: программа могла
      ошибиться, а человек — забыть отметиться.</div></div>`;
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
        <tr><td>Оклад (${smen} смен × 6 000)</td><td>${fmtN(smen*6000)}</td></tr>
        <tr><td>% от продаж (2 %)</td><td>+104 475</td></tr>
        <tr><td>Доб. % при 80 % (1 %)</td><td>+52 238</td></tr>
        <tr><td>Доб. % при 100 % (1 %)</td><td>+52 238</td></tr>
        <tr><td>Доб. % при 140 % (2 %)</td><td>+104 475</td></tr>
        <tr><td>Бонус KPI — UPT</td><td>+10 000</td></tr>
        <tr style="background:var(--gl)"><td><b>ИТОГО К ВЫПЛАТЕ</b></td>
          <td><b style="font-size:16px;color:var(--blue)">${fmtN(sum)}</b></td></tr></table>
    </div></div>`;
  document.body.appendChild(ov);
  tr.sobytie('act:kvitok');
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
        <td><button class="btn bsm" id="uch-pravka-${u.id}" onclick="uchPravka('${u.id}')">✏️</button></td></tr>`).join('')}
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
  nav('pgParams'); setTitle('Параметры'); setBadge('');
  setContent(`
  <div class="card" style="max-width:560px"><div class="ct">⚙️ Параметры ЗП — Продавец</div>
    <div class="fr">
      <div class="fg"><label class="fl">Оклад за смену (₸)</label><input class="fc" type="number" value="6000"></div>
      <div class="fg"><label class="fl">Норма месяца (считает программа)</label>
        <input class="fc" type="text" disabled value="22 раб. дней — будни 5/2"></div>
    </div>
    <div class="fr">
      <div class="fg"><label class="fl">База от продаж</label><input class="fc" type="number" step="0.001" value="0.02"></div>
      <div class="fg"><label class="fl">Доб. % при 80 %</label><input class="fc" type="number" step="0.001" value="0.01"></div>
    </div>
    <div class="fr">
      <div class="fg"><label class="fl">Доб. % при 100 %</label><input class="fc" type="number" step="0.001" value="0.01"></div>
      <div class="fg"><label class="fl">Доб. % при 140 %</label><input class="fc" type="number" step="0.001" value="0.02"></div>
    </div>
    <button class="btn bp bbl" id="uch-param" onclick="tr.sobytie('act:param')">Сохранить параметры</button>
    <div class="alert" style="display:block;margin-top:1rem;background:var(--al);color:var(--amber)">Меняете здесь — меняется
      у всех и сразу, включая текущий месяц. Закрытые месяцы не пересчитываются.
      Норму рабочих дней программа считает сама по календарю, это поле не правится.</div>
  </div>`);
};

// ── повременные ──
let _prihod = false, _uhod = false;
window.pgRunner = function(){
  nav('pgRunner'); setTitle('Смена'); setBadge('');
  const im = CU.role==='immgr';
  setContent(`
  <div class="card" style="max-width:520px"><div class="ct">🕒 Сегодня · 12 сентября</div>
    ${_prihod?'<div class="alert as" style="display:block">✓ Смена начата в 09:02</div>':''}
    ${_uhod?'<div class="alert as" style="display:block">✓ Смена завершена в 18:07 · отработано 9 ч 05 мин</div>':''}
    <button class="btn bp bbl" id="uch-nachat" onclick="uchPrihod()" ${_prihod?'disabled':''}>▶ Начать смену</button>
    <button class="btn bp bbl" id="uch-zavershit" style="margin-top:.6rem" onclick="uchUhod()" ${(!_prihod||_uhod)?'disabled':''}>■ Завершить смену</button>
    <div class="rnote">Забыли завершить — программа закроет смену через 8 часов сама
      и отправит день управляющему на проверку.
      ${im?'Оклад у вас месячный: отмеченный день засчитывается целым.'
          :'Полная смена — 8 часов; меньше — оплата по времени с шагом 15 минут, больше — всё равно одна смена.'}</div>
  </div>`);
};
window.uchPrihod = function(){ _prihod=true; tr.sobytie('act:prihod'); pgRunner(); };
window.uchUhod = function(){ _uhod=true; tr.sobytie('act:uhod'); pgRunner(); };
let _pravka = false;
window.pgRunnerHist = function(){
  nav('pgRunnerHist'); setTitle('История'); setBadge('');
  const dni = [['11 сентября','09:00','17:10','8 ч 10 мин','в расчёте'],
               ['10 сентября','09:05','—','закрыта программой', _pravka?'правка на проверке':'на проверке'],
               ['9 сентября','08:58','17:02','8 ч 04 мин','в расчёте']];
  setContent(`
  <div class="card" style="max-width:640px"><div class="ct">📋 История смен</div>
    <div class="tw-wrap"><table><tr><th>День</th><th>Начало</th><th>Конец</th><th>Итог</th><th></th></tr>
    ${dni.map((d,i)=>`<tr><td>${d[0]}</td><td>${d[1]}</td><td>${d[2]}</td>
      <td>${d[3]}<div style="font-size:11px;color:${d[4]==='в расчёте'?'var(--green)':'var(--amber)'}">${d[4]}</div></td>
      <td><button class="btn bsm" id="uch-hist-${i}" onclick="uchPravkaSmeny('${d[0]}')" title="Поправить время">✏️</button></td></tr>`).join('')}
    </table></div>
    ${_pravka?'<div class="alert as" style="display:block">✓ Правка отправлена управляющему на проверку</div>':''}
    <div class="rnote">Смену за 10 сентября закрыла программа: завершить её забыли.
      Поправьте время — правка уйдёт управляющему, и до его решения день в зарплату не попадёт.</div>
  </div>`);
};
window.uchPravkaSmeny = function(den){
  const ov=document.createElement('div'); ov.className='ov';
  ov.innerHTML=`<div class="ovc" style="max-width:420px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <b>Время смены — ${esc(den)}</b>
      <button class="btn bsm" onclick="this.closest('.ov').remove()">✕</button></div>
    <div class="fr"><div class="fg"><label class="fl">Начало</label><input class="fc" type="time" value="09:05"></div>
      <div class="fg"><label class="fl">Конец</label><input class="fc" type="time" value="17:30"></div></div>
    <button class="btn bp bbl tr-tyk" id="uch-na-proverku" onclick="uchNaProverku(this)">Отправить на проверку</button></div>`;
  document.body.appendChild(ov);
};
window.uchNaProverku = function(b){ b.closest('.ov').remove(); _pravka=true; tr.sobytie('act:pravka'); pgRunnerHist(); };

const zpStr = (rows,itogo) => `
  <div class="card" style="max-width:560px"><div class="ct">Моя зарплата · август</div>
    <select class="fc" style="max-width:220px;margin-bottom:1rem"><option>август 2026 г.</option></select>
    ${rows.map(r=>`<div class="zpr"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}
    <div class="zpr" style="border-top:2px solid var(--bd);font-size:16px">
      <span><b>К выплате</b></span><b style="color:var(--blue)">${itogo}</b></div>
    <div class="rnote">Это ваша зарплата и только ваша. Чужих цифр здесь нет.</div>
  </div>`;
window.pgRunnerZP = function(){ nav('pgRunnerZP'); setTitle('Моя зарплата'); setBadge('');
  if(CU.role==='immgr')
    setContent(zpStr([['Оклад (19 из 21 раб. дня)',fmt(271429)],['Отмечено дней','19']], fmt(271429)));
  else
    setContent(zpStr([['Смены (15 × 12 500)',fmt(187500)],['Отработано','120 ч 00 мин']], fmt(187500))); };
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
  uchKvitok(CU.name, 353426, 15);
  tr.sobytie('act:moilist');
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
 {t:'Подтверждение продаж — главное', otkryt:'pgEnter', cel:'page:pgEnter',
  txt:['Продажи приходят из 1С сами, но в зарплату попадают только после вашего '
      +'подтверждения. Не подтвердили — деньги не начислены.'],
  zad:'Откройте раздел «Ввод продаж» в меню.', tyk:'#n-pgEnter,#m-pgEnter'},
 {t:'Подтвердите день', cel:'act:podtverdil',
  txt:['Цифры править нельзя, и это правильно: они из 1С. Если сумма неверна — '
      +'скажите управляющему, чинить надо в 1С.'],
  zad:'Нажмите «Подтвердить продажи за 12 сентября».', tyk:'#uch-podtv'},
 {t:'Смена без продаж',
  txt:['Были на смене, а продаж не было — всё равно отметьтесь: на том же экране кнопка '
      +'«Отметить смену без продаж». Смена засчитается, выручка не изменится.',
       'Не сохраняется — значит, вас нет в графике на этот день. Скажите управляющему, '
      +'он поставит смену.'],
  zad:'Прочитайте и нажмите «Дальше».'},
 {t:'История', otkryt:'pgHist', cel:'page:pgHist',
  txt:['Здесь видно все ваши дни и что с ними: зелёное — уже в расчёте, жёлтое — '
      +'ждёт вас. Только что подтверждённый день позеленел.'],
  zad:'Откройте «История» и найдите день, который вы подтвердили.', tyk:'#n-pgHist,#m-pgHist'},
 {t:'График смен', otkryt:'pgSchedule', cel:'page:pgSchedule',
  txt:['График ставит управляющий. Если вас нет в графике на день, вы не сможете '
      +'подтвердить за него продажи — так ловятся дни, когда продажи записались не на того.'],
  zad:'Откройте «График» и найдите свою строку.', tyk:'#n-pgSchedule,#s-pgSchedule'},
 {t:'Рейтинг', otkryt:'pgRating', cel:'page:pgRating',
  txt:['Рейтинг общий по сети и открыт всем. Считается по проценту выполнения плана, '
      +'а не по сумме — иначе у большого магазина было бы преимущество.'],
  zad:'Откройте «Рейтинг».', tyk:'#n-pgRating,#s-pgRating'},
 {t:'Отчёт магазина и касса', cel:'page:pgShopReport',
  txt:['Отчёт магазина сдаёт тот, кто закрывает смену. Выручка, чеки и позиции — из 1С, их не правят. '
      +'Здесь же сверка кассы: деньги и отчёт закрываются одним заходом.'],
  zad:'Откройте «Отчёт магазина».', tyk:'#n-pgShopReport,#m-pgShopReport,#s-pgShopReport'},
 {t:'Сверка кассы', cel:'act:sverka',
  txt:['Впишите, сколько наличных фактически в кассе, и нажмите «Сверить и отправить». Не сошлось — '
      +'выберите причину: расхождение уйдёт бухгалтеру, и смена не закроется, пока он его не подтвердит.',
       'После принятой сверки снимите Z-отчёт и закройте смену. Касса, не закрытая в день смены, — балл антирейтинга.'],
  zad:'Впишите сумму в «Фактически в кассе» и нажмите «Сверить и отправить».', tyk:'#uch-sverka,#uch-fakt'},
 {t:'Из чего складывается зарплата', otkryt:'pgDash',
  txt:['Оклад 6 000 за смену. Процент от ваших продаж растёт ступенями: 2 % всегда, '
      +'3 % от 80 % плана, 4 % от 100 %, 6 % от 140 %.',
       'Сверху три бонуса по 10 000: за план магазина, за средний чек от 15 000 '
      +'и за UPT от 2,5. Ступень считается по всему месяцу — не хватило до 100 % '
      +'пятидесяти тысяч, и теряется весь процент ступени, а не его часть.'],
  zad:'Посмотрите на дашборде, сколько вам не хватает до ступени.'},
 {t:'Ваш расчётный лист', otkryt:'pgMoiList', cel:'page:pgMoiList',
  txt:['Начиная с 6-го числа здесь лежит лист за прошлый месяц — и за все более ранние. '
      +'Это тот же лист, что видит бухгалтер: оклад, проценты, бонусы, аванс, '
      +'пенсионные, ИПН, ВОСМС, штрафы и итог к выплате.',
       'Над листом — пометка. Зелёная: месяц закрыт, суммы окончательные. Жёлтая: '
      +'бухгалтер ещё может внести правки.'],
  zad:'Откройте «Мой расчётный лист».', tyk:'#n-pgMoiList,#m-pgMoiList,#s-pgMoiList'},
 {t:'Откройте сам лист', cel:'act:moilist',
  txt:['Выберите месяц и нажмите кнопку. Лист можно распечатать или отправить себе '
      +'в WhatsApp — пересылать его вам больше не нужно.'],
  zad:'Нажмите «Открыть расчётный лист».', tyk:'#ml-btn'},

 {t:'Антирейтинг', cel:'page:pgAntireiting',
  txt:['Баллы ставит программа сама, ночью, за нарушения. Балл живёт 90 дней и сгорает сам. '
      +'До 30 сентября идёт проверка, 1 октября — амнистия: счёт обнулится, и дальше всё всерьёз.',
       'Вас касаются: прогул — 10 баллов (смена в графике, а отметки о выходе нет до конца следующего дня); '
      +'отчёт магазина или касса не в день смены и просроченная задача в Битриксе — по баллу.'],
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
      +'Их выдаёт программа сама по цифрам учёта, особые — вручает руководство. У каждого сотрудника свой профиль с фото из Битрикса.',
       'Победителя месяца определяет сводный индекс: план, средний чек и UPT относительно своей точки и вклад на смене. '
      +'Поэтому большая точка не выигрывает просто потому, что большая. Как он считается — во вкладке «Правила».'],
  zad:'Откройте «Достижения».', tyk:'#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Профиль и награды', cel:'act:achprofil',
  txt:['Нажмите на человека — откроется его профиль: все награды, за что и когда. О новой награде программа пишет в общий чат Битрикса.'],
  zad:'Откройте профиль Александры Забабуриной.', tyk:'#uch-ach-p-0,#uch-ach-lyudi'},],

manager:[
 {t:'Сводка — ваш главный экран', otkryt:'pgReport',
  txt:['Видно каждого продавца: продажи, процент плана, прогноз зарплаты. Жёлтым — '
      +'у кого висят неподтверждённые дни.',
       'Пока человек их не подтвердил, деньги ему не начислены, и спросят в конце '
      +'месяца с вас.'],
  zad:'Найдите в сводке того, у кого есть неподтверждённые дни.'},
 {t:'Отчёт магазина', otkryt:'pgShopReport', cel:'page:pgShopReport',
  txt:['Сдаётся каждый день. Выручка, чеки и позиции — из 1С, не правятся. Остальное '
      +'заполняете вы.'],
  zad:'Откройте «Отчёт магазина».', tyk:'#n-pgShopReport,#s-pgShopReport'},
 {t:'Сверка кассы', cel:'act:sverka',
  txt:['Впишите, сколько наличных фактически в кассе, и нажмите «Сверить и отправить». Не сошлось — '
      +'выберите причину: расхождение уйдёт бухгалтеру, и смена не закроется, пока он его не подтвердит.',
       'После принятой сверки снимите Z-отчёт и закройте смену. Касса, не закрытая в день смены, — балл антирейтинга.'],
  zad:'Впишите сумму в «Фактически в кассе» и нажмите «Сверить и отправить».', tyk:'#uch-sverka,#uch-fakt'},
 {t:'Заполните и отправьте', cel:'act:otchet',
  txt:['Кнопка отправки не работает, пока не заполнены посетители — это не придирка, '
      +'а защита от пустых отчётов.',
       'Отчёт уйдёт в Битрикс после ближайшего обмена с 1С, чтобы в ленту попали итоговые цифры. '
      +'Отправка засчитает вам смену в графике за этот день.'],
  zad:'Впишите число посетителей и нажмите «Отправить отчёт».', tyk:'#uch-send,#uch-vis'},
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
      +'💵 корректировка и 🖨️ квиток.'],
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
 {t:'Откройте сам лист', cel:'act:moilist',
  txt:['Выберите месяц и нажмите кнопку. Лист можно распечатать или отправить себе '
      +'в WhatsApp — пересылать его вам больше не нужно.'],
  zad:'Нажмите «Открыть расчётный лист».', tyk:'#ml-btn'},

 {t:'Задержки', cel:'page:pgDelays',
  txt:['Продажи подтверждают и отчёт отправляют день в день, крайний срок — утро следующего. '
      +'«Задержки» показывают, кто не успел.'],
  zad:'Откройте «Задержки».', tyk:'#n-pgDelays,#m-pgDelays,#s-pgDelays'},
 {t:'Подпись графика',
  txt:['1-го числа подпишите график за прошедший месяц кнопкой «Подписать график». '
      +'Неподписанный график бухгалтер увидит в предупреждениях перед выплатой.'],
  zad:'Прочитайте и нажмите «Дальше».'},
 {t:'Антирейтинг', cel:'page:pgAntireiting',
  txt:['Баллы ставит программа сама, ночью, за нарушения. Балл живёт 90 дней и сгорает сам. '
      +'До 30 сентября идёт проверка, 1 октября — амнистия: счёт обнулится, и дальше всё всерьёз.',
       'Вас касаются: прогул — 10 баллов; отчёт магазина не в день смены и просроченная задача '
      +'в Битриксе — по баллу. Спорные баллы ваших людей разбираете вы.'],
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
      +'Их выдаёт программа сама по цифрам учёта, особые — вручает руководство. У каждого сотрудника свой профиль с фото из Битрикса.',
       'Победителя месяца определяет сводный индекс: план, средний чек и UPT относительно своей точки и вклад на смене. '
      +'Поэтому большая точка не выигрывает просто потому, что большая. Как он считается — во вкладке «Правила».'],
  zad:'Откройте «Достижения».', tyk:'#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Профиль и награды', cel:'act:achprofil',
  txt:['Нажмите на человека — откроется его профиль: все награды, за что и когда. О новой награде программа пишет в общий чат Битрикса.'],
  zad:'Откройте профиль Александры Забабуриной.', tyk:'#uch-ach-p-0,#uch-ach-lyudi'},],

streamer:[
 {t:'Ваша смена — это отметка', otkryt:'pgEnter', cel:'page:pgEnter',
  txt:['Смена засчитывается в день, когда вы подтвердили продажи. День без продаж — '
      +'тоже смена: провели эфир, заказов не было, всё равно отмечайтесь.'],
  zad:'Откройте «Ввод продаж».', tyk:'#n-pgEnter,#m-pgEnter'},
 {t:'Подтвердите день', cel:'act:podtverdil',
  txt:['Не отметились — день не оплачен, даже если вы работали.'],
  zad:'Нажмите «Подтвердить продажи».', tyk:'#uch-podtv'},
 {t:'Ваша зарплата', otkryt:'pgStreamZP', cel:'page:pgStreamZP',
  txt:['Оклад 300 000 делится на норму рабочих дней месяца и умножается на отработанные. '
      +'Сверху 5 % от ваших личных продаж. Потолка нет: отработали больше нормы — '
      +'получите больше оклада.'],
  zad:'Откройте «Моя ЗП».', tyk:'#n-pgStreamZP,#s-pgStreamZP'},
 {t:'График', otkryt:'pgSchedule', cel:'page:pgSchedule',
  txt:['Дни вам ставит управляющий, но отмечаетесь вы сами — подтверждением продаж.'],
  zad:'Откройте «График».', tyk:'#n-pgSchedule,#s-pgSchedule'},
 {t:'Ваш расчётный лист', otkryt:'pgMoiList', cel:'page:pgMoiList',
  txt:['Начиная с 6-го числа здесь лежит лист за прошлый месяц — и за все более ранние. '
      +'Это тот же лист, что видит бухгалтер: оклад, проценты, бонусы, аванс, '
      +'пенсионные, ИПН, ВОСМС, штрафы и итог к выплате.',
       'Над листом — пометка. Зелёная: месяц закрыт, суммы окончательные. Жёлтая: '
      +'бухгалтер ещё может внести правки.'],
  zad:'Откройте «Мой расчётный лист».', tyk:'#n-pgMoiList,#m-pgMoiList,#s-pgMoiList'},
 {t:'Откройте сам лист', cel:'act:moilist',
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
       'После принятой сверки снимите Z-отчёт и закройте смену. Касса, не закрытая в день смены, — балл антирейтинга.'],
  zad:'Впишите сумму в «Фактически в кассе» и нажмите «Сверить и отправить».', tyk:'#uch-sverka,#uch-fakt'},
 {t:'Антирейтинг', cel:'page:pgAntireiting',
  txt:['Баллы ставит программа сама, ночью, за нарушения. Балл живёт 90 дней и сгорает сам. '
      +'До 30 сентября идёт проверка, 1 октября — амнистия: счёт обнулится, и дальше всё всерьёз.',
       'Вас касаются: прогул — 10 баллов; касса не закрыта в день смены и просроченная задача '
      +'в Битриксе — по баллу.'],
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
      +'Их выдаёт программа сама по цифрам учёта, особые — вручает руководство. У каждого сотрудника свой профиль с фото из Битрикса.',
       'Победителя месяца определяет сводный индекс: план, средний чек и UPT относительно своей точки и вклад на смене. '
      +'Поэтому большая точка не выигрывает просто потому, что большая. Как он считается — во вкладке «Правила».'],
  zad:'Откройте «Достижения».', tyk:'#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Профиль и награды', cel:'act:achprofil',
  txt:['Нажмите на человека — откроется его профиль: все награды, за что и когда. О новой награде программа пишет в общий чат Битрикса.'],
  zad:'Откройте профиль Александры Забабуриной.', tyk:'#uch-ach-p-0,#uch-ach-lyudi'},],

streammgr:[
 {t:'Чем эта должность отличается',
  txt:['Вы не продаёте сами и продажи не подтверждаете. Ваша работа — чтобы продавали '
      +'стримеры, и зарплата считается от их результата.',
       'Смены вам ставит управляющий в графике, оттуда они и берутся в зарплату.'],
  zad:'Прочитайте и нажмите «Дальше».'},
 {t:'Ваша зарплата', otkryt:'pgEfirZP', cel:'page:pgEfirZP',
  txt:['Оклад 250 000 делится на норму рабочих дней месяца и умножается на отработанные. '
      +'Сверху 1 % от продаж стримеров вашего подразделения.'],
  zad:'Откройте «Моя ЗП» и посмотрите, с чьих эфиров идёт процент.', tyk:'#n-pgEfirZP,#m-pgEfirZP'},
 {t:'Если список пуст',
  txt:['Внизу страницы зарплаты перечислены стримеры, с которых идёт процент. Если там '
      +'пусто — в вашей карточке указано не то подразделение, и процент выйдет нулевым.',
       'Это особенно важно, если вы сидите в офисе, а ведёте эфиры магазина: '
      +'подразделение для процента указывается отдельно.'],
  zad:'Запомните это и нажмите «Дальше».'},
 {t:'График', otkryt:'pgSchedule', cel:'page:pgSchedule',
  txt:['Ваши смены — отметки в графике. Следите, чтобы управляющий их проставил: '
      +'нет отметок — нет оклада.'],
  zad:'Откройте «График».', tyk:'#n-pgSchedule,#s-pgSchedule'},
 {t:'Ваш расчётный лист', otkryt:'pgMoiList', cel:'page:pgMoiList',
  txt:['Начиная с 6-го числа здесь лежит лист за прошлый месяц — и за все более ранние. '
      +'Это тот же лист, что видит бухгалтер: оклад, проценты, бонусы, аванс, '
      +'пенсионные, ИПН, ВОСМС, штрафы и итог к выплате.',
       'Над листом — пометка. Зелёная: месяц закрыт, суммы окончательные. Жёлтая: '
      +'бухгалтер ещё может внести правки.'],
  zad:'Откройте «Мой расчётный лист».', tyk:'#n-pgMoiList,#m-pgMoiList,#s-pgMoiList'},
 {t:'Откройте сам лист', cel:'act:moilist',
  txt:['Выберите месяц и нажмите кнопку. Лист можно распечатать или отправить себе '
      +'в WhatsApp — пересылать его вам больше не нужно.'],
  zad:'Нажмите «Открыть расчётный лист».', tyk:'#ml-btn'},

 {t:'Отчёт магазина и касса', cel:'page:pgShopReport',
  txt:['В Алматы отчёт магазина вместе со сверкой кассы сдаёт менеджер по эфирам. Выручка, чеки '
      +'и позиции — из 1С, их не правят.'],
  zad:'Откройте «Отчёт магазина».', tyk:'#n-pgShopReport,#m-pgShopReport,#s-pgShopReport'},
 {t:'Сверка кассы', cel:'act:sverka',
  txt:['Впишите, сколько наличных фактически в кассе, и нажмите «Сверить и отправить». Не сошлось — '
      +'выберите причину: расхождение уйдёт бухгалтеру, и смена не закроется, пока он его не подтвердит.',
       'После принятой сверки снимите Z-отчёт и закройте смену. Касса, не закрытая в день смены, — балл антирейтинга.'],
  zad:'Впишите сумму в «Фактически в кассе» и нажмите «Сверить и отправить».', tyk:'#uch-sverka,#uch-fakt'},
 {t:'Антирейтинг', cel:'page:pgAntireiting',
  txt:['Баллы ставит программа сама, ночью, за нарушения. Балл живёт 90 дней и сгорает сам. '
      +'До 30 сентября идёт проверка, 1 октября — амнистия: счёт обнулится, и дальше всё всерьёз.',
       'Вас касаются: прогул — 10 баллов; отчёт магазина или касса не в день смены и просроченная '
      +'задача в Битриксе — по баллу.'],
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
      +'Их выдаёт программа сама по цифрам учёта, особые — вручает руководство. У каждого сотрудника свой профиль с фото из Битрикса.',
       'Победителя месяца определяет сводный индекс: план, средний чек и UPT относительно своей точки и вклад на смене. '
      +'Поэтому большая точка не выигрывает просто потому, что большая. Как он считается — во вкладке «Правила».'],
  zad:'Откройте «Достижения».', tyk:'#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Профиль и награды', cel:'act:achprofil',
  txt:['Нажмите на человека — откроется его профиль: все награды, за что и когда. О новой награде программа пишет в общий чат Битрикса.'],
  zad:'Откройте профиль Александры Забабуриной.', tyk:'#uch-ach-p-0,#uch-ach-lyudi'},],

runner:[
 {t:'Начало смены', otkryt:'pgRunner', cel:'act:prihod',
  txt:['Ваш день считается по времени между началом и концом смены. Отмечайтесь '
      +'с телефона, прямо на месте, когда пришли.'],
  zad:'Нажмите «Начать смену».', tyk:'#uch-nachat'},
 {t:'Конец смены', cel:'act:uhod',
  txt:['Уходя — «Завершить смену». Забыли — программа закроет смену через 8 часов сама '
      +'и отправит день управляющему на проверку.'],
  zad:'Нажмите «Завершить смену».', tyk:'#uch-zavershit'},
 {t:'История смен', cel:'page:pgRunnerHist',
  txt:['Здесь все ваши смены. Жёлтым — дни на проверке у управляющего: пока он не решил, '
      +'в зарплату такой день не попадёт.'],
  zad:'Откройте «История».', tyk:'#n-pgRunnerHist,#m-pgRunnerHist,#s-pgRunnerHist'},
 {t:'Поправьте время смены', cel:'act:pravka',
  txt:['Смену за 10 сентября закрыла программа — завершить её забыли. Нажмите ✏️, '
      +'впишите настоящее время и отправьте. Правка тоже уходит управляющему на проверку.'],
  zad:'Нажмите ✏️ у 10 сентября, затем «Отправить на проверку».', tyk:'#uch-hist-1'},
 {t:'Моя зарплата', cel:'page:pgRunnerZP',
  txt:['Полная смена — 8 часов. Отработали меньше — оплата по времени с шагом 15 минут, '
      +'больше — всё равно одна смена.'],
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
 {t:'Откройте сам лист', cel:'act:moilist',
  txt:['Выберите месяц и нажмите кнопку. Лист можно распечатать или отправить себе '
      +'в WhatsApp — пересылать его вам больше не нужно.'],
  zad:'Нажмите «Открыть расчётный лист».', tyk:'#ml-btn'},

 {t:'Антирейтинг', cel:'page:pgAntireiting',
  txt:['Баллы ставит программа сама, ночью, за нарушения. Балл живёт 90 дней и сгорает сам. '
      +'До 30 сентября идёт проверка, 1 октября — амнистия: счёт обнулится, и дальше всё всерьёз.',
       'Вас касаются: прогул — 10 баллов; смена без отметки прихода или ухода и отметка, исправленная '
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
      +'Их выдаёт программа сама по цифрам учёта, особые — вручает руководство. У каждого сотрудника свой профиль с фото из Битрикса.',
       'Победителя месяца определяет сводный индекс: план, средний чек и UPT относительно своей точки и вклад на смене. '
      +'Поэтому большая точка не выигрывает просто потому, что большая. Как он считается — во вкладке «Правила».'],
  zad:'Откройте «Достижения».', tyk:'#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Профиль и награды', cel:'act:achprofil',
  txt:['Нажмите на человека — откроется его профиль: все награды, за что и когда. О новой награде программа пишет в общий чат Битрикса.'],
  zad:'Откройте профиль Александры Забабуриной.', tyk:'#uch-ach-p-0,#uch-ach-lyudi'},],

accountant:[
 {t:'Начисление', otkryt:'pgPayroll',
  txt:['Ведомость собирается сама: продажи из 1С, смены из графика и отметок, сетка '
      +'из параметров. Ваше дело — проверить и внести корректировки.'],
  zad:'Осмотрите ведомость и нажмите «Дальше».'},
 {t:'Сначала предупреждения',
  txt:['Над ведомостью — то, что мешает выплате: оплаченные дни без отметки в графике, '
      +'неподписанный график, смены на проверке. Разберите их до выплаты: за каждым '
      +'стоит чья-то неверная сумма.'],
  zad:'Прочитайте предупреждения и нажмите «Дальше».'},
 {t:'Корректировка', cel:'act:korr',
  txt:['💵 — аванс, пенсионные, ИПН, ВОСМС, штрафы и премия. Там же можно переписать '
      +'смены и сумму продаж, если программа посчитала не так.'],
  zad:'Нажмите 💵 у Забабуриной Александры, затем «Сохранить».', tyk:'#uch-korr-0'},
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

 {t:'Задержки', cel:'page:pgDelays',
  txt:['Кто не подтвердил продажи или не отправил отчёт день в день — видно здесь. '
      +'Крайний срок — утро следующего дня.'],
  zad:'Откройте «Задержки».', tyk:'#n-pgDelays,#m-pgDelays,#s-pgDelays'},
 {t:'Антирейтинг', cel:'page:pgAntireiting',
  txt:['Баллы ставит программа сама, ночью, за нарушения. Балл живёт 90 дней и сгорает сам. '
      +'До 30 сентября идёт проверка, 1 октября — амнистия: счёт обнулится, и дальше всё всерьёз.',
       'Вас касаются просроченные задачи в Битриксе и, если у вас есть ежедневный отчёт, '
      +'его пустое поле «Что сделано за день» — по баллу.'],
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
      +'Их выдаёт программа сама по цифрам учёта, особые — вручает руководство. У каждого сотрудника свой профиль с фото из Битрикса.',
       'Победителя месяца определяет сводный индекс: план, средний чек и UPT относительно своей точки и вклад на смене. '
      +'Поэтому большая точка не выигрывает просто потому, что большая. Как он считается — во вкладке «Правила».'],
  zad:'Откройте «Достижения».', tyk:'#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Профиль и награды', cel:'act:achprofil',
  txt:['Нажмите на человека — откроется его профиль: все награды, за что и когда. О новой награде программа пишет в общий чат Битрикса.'],
  zad:'Откройте профиль Александры Забабуриной.', tyk:'#uch-ach-p-0,#uch-ach-lyudi'},],

admin:[
 {t:'Сводка по сети', otkryt:'pgReport',
  txt:['Вы видите все магазины и всех людей. Слева меню разбито на три части: '
      +'магазины, люди, деньги.'],
  zad:'Осмотритесь и нажмите «Дальше».'},
 {t:'Сотрудники', otkryt:'pgSellers', cel:'page:pgSellers',
  txt:['Здесь заводят людей, меняют должности и магазины, выдают пароли.'],
  zad:'Откройте «Сотрудники».', tyk:'#n-pgSellers,#s-pgSellers'},
 {t:'Откройте карточку', cel:'act:karta',
  txt:['Карандаш открывает карточку: имя, магазин, должность, пароль. У менеджера '
      +'по эфирам там же указывается, с чьих эфиров идёт процент.'],
  zad:'Нажмите ✏️ у Кузьмина Никиты.', tyk:'#uch-pravka-u4'},
 {t:'Смените должность и сохраните', cel:'act:sohranil',
  txt:['Смена должности меняет и меню человека, и способ расчёта его зарплаты — '
      +'с ближайшего пересчёта, включая текущий месяц, если он открыт.'],
  zad:'Выберите другую должность и нажмите «Сохранить».', tyk:'#uch-sohr,#uch-rol'},
 {t:'Планы', otkryt:'pgPlans', cel:'page:pgPlans',
  txt:['План ставится магазину и каждому продавцу. Там, где заметная часть продаж идёт '
      +'без продавца — эфиры, админ, склад, — эта доля вычитается, и на продавцов '
      +'делится остаток.'],
  zad:'Откройте «Планы».', tyk:'#n-pgPlans,#s-pgPlans'},
 {t:'Параметры расчёта', otkryt:'pgParams', cel:'act:param',
  txt:['Сетка зарплаты у каждой должности своя. Изменения действуют сразу и на текущий '
      +'месяц тоже, поэтому сперва посмотрите в начислении, что получится.',
       'Норму рабочих дней месяца программа считает сама по календарю — это поле '
      +'не редактируется.'],
  zad:'Откройте «Параметры» и нажмите «Сохранить параметры».', tyk:'#uch-param,#n-pgParams,#s-pgParams'},
 {t:'Журнал',
  txt:['Всё существенное записывается: кто и когда изменил план, роль, смену, '
      +'корректировку. Журнал нужен не для слежки, а чтобы через месяц понять, '
      +'почему цифра такая.'],
  zad:'Прочитайте и нажмите «Дальше».'},

 {t:'Новые из 1С', cel:'page:pgQueue',
  txt:['Люди, пришедшие из 1С, ждут сопоставления с должностью и подразделением. '
      +'Несопоставленный продавец в расчёт не попадёт.'],
  zad:'Откройте «Новые из 1С».', tyk:'#n-pgQueue,#m-pgQueue,#s-pgQueue'},
 {t:'Касса', cel:'page:pgKassa',
  txt:['Кассовые смены, ждущие подтверждения, и история всех кассовых смен — как у бухгалтера.'],
  zad:'Откройте «Кассу».', tyk:'#n-pgKassa,#m-pgKassa,#s-pgKassa'},
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
  zad:'Прочитайте и нажмите «Дальше».'},],
};
KURSY.store = [
 {t:'Начало смены', otkryt:'pgRunner', cel:'act:prihod',
  txt:['Вы кладовщик: ваш день считается по времени между началом и концом смены. '
      +'Отмечайтесь с телефона на складе, когда пришли.'],
  zad:'Нажмите «Начать смену».', tyk:'#uch-nachat'},
 {t:'Конец смены', cel:'act:uhod',
  txt:['Уходя — «Завершить смену». Забыли — программа закроет смену через 8 часов сама '
      +'и отправит день управляющему на проверку.'],
  zad:'Нажмите «Завершить смену».', tyk:'#uch-zavershit'},
 {t:'История смен', cel:'page:pgRunnerHist',
  txt:['Здесь все ваши смены. Жёлтым — дни на проверке у управляющего: пока он не решил, '
      +'в зарплату такой день не попадёт.'],
  zad:'Откройте «История».', tyk:'#n-pgRunnerHist,#m-pgRunnerHist,#s-pgRunnerHist'},
 {t:'Поправьте время смены', cel:'act:pravka',
  txt:['Смену за 10 сентября закрыла программа — завершить её забыли. Нажмите ✏️, '
      +'впишите настоящее время и отправьте. Правка тоже уходит управляющему на проверку.'],
  zad:'Нажмите ✏️ у 10 сентября, затем «Отправить на проверку».', tyk:'#uch-hist-1'},
 {t:'Моя зарплата', cel:'page:pgRunnerZP',
  txt:['Полная смена — 8 часов. Отработали меньше — оплата по времени с шагом 15 минут, '
      +'больше — всё равно одна смена.'],
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
 {t:'Откройте сам лист', cel:'act:moilist',
  txt:['Выберите месяц и нажмите кнопку. Лист можно распечатать или отправить себе '
      +'в WhatsApp — пересылать его вам больше не нужно.'],
  zad:'Нажмите «Открыть расчётный лист».', tyk:'#ml-btn'},

 {t:'Антирейтинг', cel:'page:pgAntireiting',
  txt:['Баллы ставит программа сама, ночью, за нарушения. Балл живёт 90 дней и сгорает сам. '
      +'До 30 сентября идёт проверка, 1 октября — амнистия: счёт обнулится, и дальше всё всерьёз.',
       'Вас касаются: прогул — 10 баллов; смена без отметки прихода или ухода и отметка, исправленная '
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
      +'Их выдаёт программа сама по цифрам учёта, особые — вручает руководство. У каждого сотрудника свой профиль с фото из Битрикса.',
       'Победителя месяца определяет сводный индекс: план, средний чек и UPT относительно своей точки и вклад на смене. '
      +'Поэтому большая точка не выигрывает просто потому, что большая. Как он считается — во вкладке «Правила».'],
  zad:'Откройте «Достижения».', tyk:'#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Профиль и награды', cel:'act:achprofil',
  txt:['Нажмите на человека — откроется его профиль: все награды, за что и когда. О новой награде программа пишет в общий чат Битрикса.'],
  zad:'Откройте профиль Александры Забабуриной.', tyk:'#uch-ach-p-0,#uch-ach-lyudi'},];
KURSY.whhead = [
 {t:'Начало смены', otkryt:'pgRunner', cel:'act:prihod',
  txt:['Вы заведуете складом: ваш день считается по времени между началом и концом смены, '
      +'как у кладовщика и раннера. Отмечайтесь с телефона на складе, когда пришли.'],
  zad:'Нажмите «Начать смену».', tyk:'#uch-nachat'},
 {t:'Конец смены', cel:'act:uhod',
  txt:['Уходя — «Завершить смену». Забыли — программа закроет смену через 8 часов сама '
      +'и отправит день управляющему на проверку.'],
  zad:'Нажмите «Завершить смену».', tyk:'#uch-zavershit'},
 {t:'История смен', cel:'page:pgRunnerHist',
  txt:['Здесь все ваши смены. Жёлтым — дни на проверке у управляющего: пока он не решил, '
      +'в зарплату такой день не попадёт.'],
  zad:'Откройте «История».', tyk:'#n-pgRunnerHist,#m-pgRunnerHist,#s-pgRunnerHist'},
 {t:'Поправьте время смены', cel:'act:pravka',
  txt:['Смену за 10 сентября закрыла программа — завершить её забыли. Нажмите ✏️, '
      +'впишите настоящее время и отправьте. Правка тоже уходит управляющему на проверку.'],
  zad:'Нажмите ✏️ у 10 сентября, затем «Отправить на проверку».', tyk:'#uch-hist-1'},
 {t:'Моя зарплата', cel:'page:pgRunnerZP',
  txt:['Полная смена — 8 часов. Отработали меньше — оплата по времени с шагом 15 минут, '
      +'больше — всё равно одна смена.'],
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
 {t:'Откройте сам лист', cel:'act:moilist',
  txt:['Выберите месяц и нажмите кнопку. Лист можно распечатать или отправить себе '
      +'в WhatsApp — пересылать его вам больше не нужно.'],
  zad:'Нажмите «Открыть расчётный лист».', tyk:'#ml-btn'},

 {t:'Антирейтинг', cel:'page:pgAntireiting',
  txt:['Баллы ставит программа сама, ночью, за нарушения. Балл живёт 90 дней и сгорает сам. '
      +'До 30 сентября идёт проверка, 1 октября — амнистия: счёт обнулится, и дальше всё всерьёз.',
       'Вас касаются: прогул — 10 баллов; смена без отметки прихода или ухода и отметка, исправленная '
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
      +'Их выдаёт программа сама по цифрам учёта, особые — вручает руководство. У каждого сотрудника свой профиль с фото из Битрикса.',
       'Победителя месяца определяет сводный индекс: план, средний чек и UPT относительно своей точки и вклад на смене. '
      +'Поэтому большая точка не выигрывает просто потому, что большая. Как он считается — во вкладке «Правила».'],
  zad:'Откройте «Достижения».', tyk:'#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Профиль и награды', cel:'act:achprofil',
  txt:['Нажмите на человека — откроется его профиль: все награды, за что и когда. О новой награде программа пишет в общий чат Битрикса.'],
  zad:'Откройте профиль Александры Забабуриной.', tyk:'#uch-ach-p-0,#uch-ach-lyudi'},];
KURSY.immgr = [
 {t:'Начало смены', otkryt:'pgRunner', cel:'act:prihod',
  txt:['Вы менеджер интернет-магазина: смены отмечаются так же, как у склада, — '
      +'кнопками начала и конца.'],
  zad:'Нажмите «Начать смену».', tyk:'#uch-nachat'},
 {t:'Конец смены', cel:'act:uhod',
  txt:['Уходя — «Завершить смену». Забыли — программа закроет смену через 8 часов сама '
      +'и отправит день управляющему на проверку.'],
  zad:'Нажмите «Завершить смену».', tyk:'#uch-zavershit'},
 {t:'История смен', cel:'page:pgRunnerHist',
  txt:['Здесь все ваши смены. Жёлтым — дни на проверке у управляющего: пока он не решил, '
      +'в зарплату такой день не попадёт.'],
  zad:'Откройте «История».', tyk:'#n-pgRunnerHist,#m-pgRunnerHist,#s-pgRunnerHist'},
 {t:'Поправьте время смены', cel:'act:pravka',
  txt:['Смену за 10 сентября закрыла программа — завершить её забыли. Нажмите ✏️, '
      +'впишите настоящее время и отправьте. Правка тоже уходит управляющему на проверку.'],
  zad:'Нажмите ✏️ у 10 сентября, затем «Отправить на проверку».', tyk:'#uch-hist-1'},
 {t:'Моя зарплата', cel:'page:pgRunnerZP',
  txt:['Оклад у вас месячный: отмеченный день засчитывается целым, сколько бы часов '
      +'он ни длился.'],
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
 {t:'Откройте сам лист', cel:'act:moilist',
  txt:['Выберите месяц и нажмите кнопку. Лист можно распечатать или отправить себе '
      +'в WhatsApp — пересылать его вам больше не нужно.'],
  zad:'Нажмите «Открыть расчётный лист».', tyk:'#ml-btn'},

 {t:'Антирейтинг', cel:'page:pgAntireiting',
  txt:['Баллы ставит программа сама, ночью, за нарушения. Балл живёт 90 дней и сгорает сам. '
      +'До 30 сентября идёт проверка, 1 октября — амнистия: счёт обнулится, и дальше всё всерьёз.',
       'Вас касаются: прогул — 10 баллов; смена без отметки прихода или ухода и отметка, исправленная '
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
      +'Их выдаёт программа сама по цифрам учёта, особые — вручает руководство. У каждого сотрудника свой профиль с фото из Битрикса.',
       'Победителя месяца определяет сводный индекс: план, средний чек и UPT относительно своей точки и вклад на смене. '
      +'Поэтому большая точка не выигрывает просто потому, что большая. Как он считается — во вкладке «Правила».'],
  zad:'Откройте «Достижения».', tyk:'#n-pgAchivki,#m-pgAchivki,#s-pgAchivki'},
 {t:'Профиль и награды', cel:'act:achprofil',
  txt:['Нажмите на человека — откроется его профиль: все награды, за что и когда. О новой награде программа пишет в общий чат Битрикса.'],
  zad:'Откройте профиль Александры Забабуриной.', tyk:'#uch-ach-p-0,#uch-ach-lyudi'},];

// ── движок тренера ──
const KEY = 'fbsm.obuch.v2';
const tr = {
  kurs:null, i:0, gotovo:false, rol:null,

  start(rol){
    this.rol = rol;
    this.kurs = KURSY[rol] || KURSY.seller;
    const d = this.chitat();
    this.i = (d && d.rol===rol) ? Math.min(d.i, this.kurs.length-1) : 0;
    this.shag();
  },
  stop(){ document.getElementById('trener').innerHTML=''; },

  chitat(){ try{ return JSON.parse(localStorage.getItem(KEY)||'null'); }catch(e){ return null; } },
  pisat(){ try{ localStorage.setItem(KEY, JSON.stringify({rol:this.rol,i:this.i})); }catch(e){} },

  shag(){
    const s = this.kurs[this.i];
    this.gotovo = !s.cel;
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
          ${this.gotovo ? '<span class="tr-ok">✓ Выполнено</span> — '+esc(s.zad||'') : esc(s.zad||'')}
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
