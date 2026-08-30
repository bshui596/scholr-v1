/* ── WEEK VIEW ── */
function renderWeekView() {
  const ws = new Date(calState.weekStart);
  const we = new Date(ws); we.setDate(we.getDate() + 6);
  const now = new Date();
  const visCals = getVisibleCals();

  // Header label
  const sameMonth = ws.getMonth() === we.getMonth();
  let lbl = sameMonth
    ? `${MONTHS[ws.getMonth()]} ${ws.getDate()}–${we.getDate()}, ${ws.getFullYear()}`
    : `${MONTHS[ws.getMonth()]} ${ws.getDate()} – ${MONTHS[we.getMonth()]} ${we.getDate()}, ${we.getFullYear()}`;
  setText('cal-hd-label', lbl);

  // Build event map per day
  const evMap = {};
  (DB.calendar.events||[]).forEach(ev => {
    if (!visCals.has(ev.calId)) return;
    getEventOccurrences(ev, ws, we).forEach(d => {
      const key = d.toDateString();
      if (!evMap[key]) evMap[key] = [];
      evMap[key].push(ev);
    });
  });

  // Header days
  let hdHtml = '<div style="width:52px;border-bottom:2px solid var(--bor)"></div>';
  for (let i = 0; i < 7; i++) {
    const dt = new Date(ws); dt.setDate(ws.getDate() + i);
    const isToday = dt.toDateString() === now.toDateString();
    hdHtml += `<div class="cal-week-dh${isToday?' today':''}" onclick="calState.dayDate=new Date('${dt.toISOString().split('T')[0]}');calView('day')">
      <div class="wdn">${DAYS_SHORT[dt.getDay()]}</div>
      <div class="wdd">${dt.getDate()}</div>
    </div>`;
  }

  // Now line
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowPx = nowMin * 48 / 60;
  const nowDayIdx = [...Array(7)].findIndex((_,i)=>{const d=new Date(ws);d.setDate(ws.getDate()+i);return d.toDateString()===now.toDateString();});

  // Build hour rows & events
  let colsHtml = '';
  for (let d = 0; d < 7; d++) {
    const dt = new Date(ws); dt.setDate(ws.getDate() + d);
    const dayEvs = evMap[dt.toDateString()] || [];
    const isToday = dt.toDateString() === now.toDateString();
    const dateStr = dt.toISOString().split('T')[0];

    let hours = '';
    for (let h = 0; h < 24; h++) {
      const t = `${String(h).padStart(2,'0')}:00`;
      hours += `<div class="cal-hour-line" style="height:48px" onclick="calQuickNew('${dateStr}','${t}')"></div>`;
    }

    // Position events
    let evChips = '';
    dayEvs.filter(ev=>!ev.allDay).forEach(ev => {
      const [sh,sm] = (ev.startTime||'00:00').split(':').map(Number);
      const [eh,em] = (ev.endTime||'23:59').split(':').map(Number);
      const top = (sh*60+sm)*48/60;
      const height = Math.max(24, ((eh*60+em)-(sh*60+sm))*48/60);
      const col = evColor(ev);
      evChips += `<div class="cal-week-event" style="top:${top}px;height:${height}px;background:${col}22;color:${col};border-left-color:${col}" onclick="calShowPop('${ev.id}',this)">
        <div style="font-size:11px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${ev.title}</div>
        ${height>30?`<div style="font-size:9px;opacity:.8">${fmtTime(ev.startTime)}</div>`:''}
      </div>`;
    });

    const nowLine = (isToday) ? `<div class="cal-now-line" style="top:${nowPx}px"></div>` : '';
    colsHtml += `<div class="cal-week-col" style="position:relative">${hours}${evChips}${nowLine}</div>`;
  }

  // All-day row
  let allDayHtml = '<div style="width:52px;font-size:9px;color:var(--ink4);padding:4px 6px;border-bottom:1px solid var(--bor)">all-day</div>';
  for (let d = 0; d < 7; d++) {
    const dt = new Date(ws); dt.setDate(ws.getDate() + d);
    const allDayEvs = (evMap[dt.toDateString()]||[]).filter(ev=>ev.allDay);
    allDayHtml += `<div style="border-right:1px solid var(--bor);border-bottom:1px solid var(--bor);padding:2px 3px;min-height:24px">
      ${allDayEvs.map(ev=>`<div class="cal-ev-chip" style="background:${evColor(ev)};color:#fff" onclick="calShowPop('${ev.id}',this)">${ev.title}</div>`).join('')}
    </div>`;
  }

  let timeColHtml = '<div style="height:24px;border-bottom:1px solid var(--bor)"></div>';
  for (let h = 0; h < 24; h++) {
    const label = h === 0 ? '' : (h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h-12} PM`);
    timeColHtml += `<div class="cal-time-slot">${label}</div>`;
  }

  g('cal-grid').innerHTML = `<div class="cal-week-wrap">
    <div style="display:grid;grid-template-columns:52px repeat(7,1fr);border-bottom:2px solid var(--bor);background:var(--sur);position:sticky;top:0;z-index:10">${hdHtml}</div>
    <div style="display:grid;grid-template-columns:52px repeat(7,1fr);border-bottom:1px solid var(--bor)">${allDayHtml}</div>
    <div style="display:flex">
      <div style="width:52px;flex-shrink:0">${timeColHtml}</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);flex:1;position:relative">${colsHtml}</div>
    </div>
  </div>`;
}

