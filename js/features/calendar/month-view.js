/* ── MONTH VIEW ── */
function renderMonthView() {
  const y = calState.year, m = calState.month;
  const label = `${MONTHS[m]} ${y}`;
  setText('cal-hd-label', label);
  calState.miniYear = y; calState.miniMonth = m;

  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m+1, 0).getDate();
  const now = new Date();
  const visCals = getVisibleCals();

  let html = `<div class="cal-month-grid">
    ${DAYS_SHORT.map(d=>`<div class="cal-day-hd">${d}</div>`).join('')}`;

  // Collect events for this month range
  const rangeS = new Date(y, m, 1-first);
  const totalCells = Math.ceil((first + days) / 7) * 7;
  const rangeE = new Date(y, m, days + (totalCells - first - days));

  // Build event map: date string -> events[]
  const evMap = {};
  (DB.calendar.events||[]).forEach(ev => {
    if (!visCals.has(ev.calId)) return;
    getEventOccurrences(ev, rangeS, rangeE).forEach(d => {
      const key = d.toDateString();
      if (!evMap[key]) evMap[key] = [];
      evMap[key].push(ev);
    });
  });

  for (let cell = 0; cell < totalCells; cell++) {
    const dt = new Date(y, m, 1 - first + cell);
    const isToday = dt.toDateString() === now.toDateString();
    const isOther = dt.getMonth() !== m;
    const isSel = dt.toDateString() === calState.selectedDate.toDateString();
    const evs = evMap[dt.toDateString()] || [];
    const dateStr = dt.toISOString().split('T')[0];

    html += `<div class="cal-cell${isToday?' today':''}${isOther?' other-month':''}${isSel&&!isToday?' selected':''}" onclick="calCellClick('${dateStr}')">
      <div class="cal-dn">${dt.getDate()}</div>`;

    const maxShow = 3;
    evs.slice(0, maxShow).forEach(ev => {
      const col = evColor(ev);
      html += `<div class="cal-ev-chip" style="background:${col}22;color:${col};border-left:3px solid ${col}" onclick="event.stopPropagation();calShowPop('${ev.id}',this)" title="${ev.title}">${ev.allDay?'':''+fmtTime(ev.startTime)+' '}${ev.title}</div>`;
    });
    if (evs.length > maxShow) html += `<div class="cal-more" onclick="event.stopPropagation();calCellClick('${dateStr}')">+${evs.length-maxShow} more</div>`;
    html += '</div>';
  }
  html += '</div>';
  g('cal-grid').innerHTML = html;
}

