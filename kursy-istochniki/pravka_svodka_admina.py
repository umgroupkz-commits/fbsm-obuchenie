# -*- coding: utf-8 -*-
"""Раздел «Обучение» у администратора (22.10.2026, просьба Андрея: «кто какой курс прошёл - история
неудобная, много информации, свернуть бы»): наверху короткая сводка «Кто что прошёл» - строка на
сотрудника, курсы значками ✓ сдал / ⏳ идёт / ○ не начинал, поиск и «только с несданными».
Назначения, «Назначено, но не пройдено» и журнал - свёрнуты (открываются по нажатию)."""
import io, sys
sys.stdout.reconfigure(encoding='utf-8')
p = r'C:\Вайбкодинг\Сетки з.п\supabase\functions\obuchenie\index.ts'
t = io.open(p, encoding='utf-8').read()


def rep(a, b):
    global t
    assert t.count(a) == 1, (t.count(a), a[:70])
    t = t.replace(a, b)


# «Назначено, но не пройдено» - свёрнутым блоком
rep('''    ? `<h2>Назначено, но не пройдено — ${pending.length}</h2>
<div class="scroller">''', '''    ? `<details class="blok"><summary>Назначено, но не пройдено - ${pending.length}</summary>
<div class="scroller">''')
rep('''      ).join("")
    }</tbody></table></div>`
    : `<h2>Назначено, но не пройдено</h2><p class="muted">Хвостов нет: всё назначенное пройдено.</p>`;''',
    '''      ).join("")
    }</tbody></table></div></details>`
    : `<details class="blok"><summary>Назначено, но не пройдено - 0</summary><p class="muted">Хвостов нет: всё назначенное пройдено.</p></details>`;

  // Сводка «Кто что прошёл»: строка на сотрудника, курсы значками. Сначала те, у кого есть несданное.
  const svodStroki = staff.map((p) => {
    const kursy = all.filter((c) => assigned.has(p.id + "|" + c.id) || best.has(p.id + "|" + c.id));
    if (!kursy.length) return null;
    const sdano = kursy.filter((c) => best.has(p.id + "|" + c.id)).length;
    const chips = kursy.map((c) => {
      const k = p.id + "|" + c.id, d = best.get(k), g = progress.get(k), nazv = esc(c.short || c.title);
      if (d) return `<span class="chip ok" title="${esc(c.title)}: ${esc(rez(d))}, ${esc(ddmm(String(d.finished_at)))}">✓ ${nazv} <b>${esc(rez(d))}</b></span>`;
      if (g) return `<span class="chip go" title="${esc(c.title)}: ${esc(progressText(g))}">⏳ ${nazv}</span>`;
      return `<span class="chip no" title="${esc(c.title)}: не начинал">○ ${nazv}</span>`;
    }).join("");
    return { ost: kursy.length - sdano, name: p.name, html:
      `<tr data-name="${esc((p.name + " " + p.post).toLowerCase())}" data-ost="${kursy.length - sdano}"><td>${esc(p.name)}<div class="muted" style="font-size:12.5px">${esc(p.post)}</div></td>` +
      `<td class="num">${sdano}&nbsp;из&nbsp;${kursy.length}</td><td>${chips}</td></tr>` };
  }).filter((x): x is { ost: number; name: string; html: string } => !!x)
    .sort((a, b) => (b.ost > 0 ? 1 : 0) - (a.ost > 0 ? 1 : 0) || a.name.localeCompare(b.name, "ru"));
  const svodHtml = `<h2 id="svodka">Кто что прошёл</h2>
<p class="muted">✓ сдал (рядом балл), ⏳ начал, ○ ещё не начинал. Наведите на значок - курс полностью и дата.</p>
<div class="row" style="margin:0 0 10px"><input type="search" id="sq" placeholder="Найти сотрудника или должность" autocomplete="off">
<label class="muted" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="sost"> только с несданными</label></div>
<div class="scroller"><table class="svod"><thead><tr><th>Сотрудник</th><th class="num">Сдано</th><th>Курсы</th></tr></thead><tbody id="sb">${
    svodStroki.map((x) => x.html).join("")
  }</tbody></table></div>
<script>(function(){var q=document.getElementById("sq"),o=document.getElementById("sost");
function f(){var s=q.value.trim().toLowerCase();Array.prototype.forEach.call(document.querySelectorAll("#sb tr"),function(r){
r.hidden=(s&&r.dataset.name.indexOf(s)<0)||(o.checked&&r.dataset.ost==="0");});}
q.addEventListener("input",f);o.addEventListener("change",f);})();</script>`;''')

# назначения - свёрнутым блоком, сводка - над ними
rep('''  return `${LINK_JS}<h2 id="naznacheniya">Кому что проходить</h2>
<p class="muted">Отметьте курсы''', '''  return `${LINK_JS}${svodHtml}
<details class="blok" id="naznacheniya"><summary>Кому что проходить - назначить курсы</summary>
<p class="muted">Отметьте курсы''')
rep('''<div class="bar"><button class="btn" id="save" disabled>Сохранить назначения</button><span id="st" class="muted"></span></div>
<script type="application/json" id="asg-data">''', '''<div class="bar"><button class="btn" id="save" disabled>Сохранить назначения</button><span id="st" class="muted"></span></div>
</details>
<script type="application/json" id="asg-data">''')
rep('''<h2>Журнал прохождений</h2>
${''', '''<details class="blok"><summary>Журнал прохождений - последние 60</summary>
${''')
rep('''<div class="note"><p class="muted">Имя в журнале приходит от портала, а не из формы: вписать чужое нельзя.</p></div>
''', '''<div class="note"><p class="muted">Имя в журнале приходит от портала, а не из формы: вписать чужое нельзя.</p></div>
</details>
''')
# оформление
rep('''@media (max-width:520px){.wrap{padding:20px 14px 60px}''', '''details.blok{margin:18px 0;border:1px solid var(--line);border-radius:10px;background:var(--panel);padding:0 14px}
details.blok>summary{cursor:pointer;padding:12px 0;font-weight:600;font-size:16px}
details.blok[open]>summary{border-bottom:1px solid var(--line);margin-bottom:10px}
.svod td{vertical-align:top}
.chip{display:inline-block;margin:2px 4px 2px 0;padding:3px 8px;border-radius:999px;font-size:12.5px;white-space:nowrap;border:1px solid var(--line)}
.chip.ok{background:var(--ok-soft);color:var(--ok);border-color:transparent}
.chip.go{background:var(--warn-soft);color:var(--warn);border-color:transparent}
.chip.no{color:var(--muted)}
@media (max-width:520px){.wrap{padding:20px 14px 60px}''')
io.open(p, 'w', encoding='utf-8', newline='\n').write(t)
print('ok')
