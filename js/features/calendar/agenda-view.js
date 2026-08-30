/* ── AGENDA VIEW ── */
function renderAgendaView() {
  const y = calState.year, m = calState.month;
  setText('cal-hd-label', `${MONTHS[m]} ${y} — Agenda`);
  calState.miniYear = y; calState.miniMonth = m;

  const rangeS = new Date(y, m, 1);
  const rangeE = new Date(y, m+1, 0);
  const visCals = getVisibleCals();

  const evMap = {};
  (DB.calendar.events||[]).forEach(ev => {
    if (!visCals.has(ev.calId)) return;
    getEventOccurrences(ev, rangeS, rangeE).forEach(d => {
      const key = d.toDateString();
      if (!evMap[key]) evMap[key] = [];
      evMap[key].push(ev);
    });
  });

  const days = new Date(y, m+1, 0).getDate();
  let html = '';
  let hasAny = false;
  for (let d = 1; d <= days; d++) {
    const dt = new Date(y, m, d);
    const evs = evMap[dt.toDateString()] || [];
    if (!evs.length) continue;
    hasAny = true;
    const isToday = dt.toDateString() === new Date().toDateString();
    html += `<div class="cal-agenda-group">
      <div class="cal-agenda-date">${isToday?'<span style="color:var(--ac)">Today · </span>':''}${dt.toLocaleDateString('en-CA',{weekday:'long',month:'long',day:'numeric'})}</div>
      ${evs.sort((a,b)=>(a.startTime||'').localeCompare(b.startTime||'')).map(ev=>`
        <div class="cal-agenda-ev" onclick="calShowPop('${ev.id}',this)">
          <div class="cal-agenda-time">${fmtEventTime(ev)}</div>
          <div class="cal-agenda-dot" style="background:${evColor(ev)}"></div>
          <div class="cal-agenda-body">
            <div class="cal-agenda-title">${ev.title}</div>
            ${ev.location?`<div class="cal-agenda-meta">📍 ${ev.location}</div>`:''}
            ${ev.description?`<div class="cal-agenda-meta">${ev.description.slice(0,80)}${ev.description.length>80?'…':''}</div>`:''}
          </div>
        </div>`).join('')}
    </div>`;
  }
  if (!hasAny) html = '<div class="emp"><span class="ei">🗓️</span><p>No events this month. Click <strong>+ Create</strong> to add one.</p></div>';
  g('cal-grid').innerHTML = html;
}

