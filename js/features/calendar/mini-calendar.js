/* ── MINI CALENDAR ── */
function renderMiniCal() {
  const wrap = g('cal-mini');
  if (!wrap) return;
  const y = calState.miniYear, m = calState.miniMonth;
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m+1, 0).getDate();
  const now = new Date();
  let html = `<div class="cal-mini-nav">
    <button onclick="calMiniNav(-1)">‹</button>
    <span>${MONTHS[m].slice(0,3)} ${y}</span>
    <button onclick="calMiniNav(1)">›</button>
  </div>
  <div class="cal-mini-grid">
    ${DAYS_SHORT.map(d=>`<div class="cal-mini-dh">${d[0]}</div>`).join('')}`;
  for (let i = 0; i < first; i++) html += `<div class="cal-mini-d other">&nbsp;</div>`;
  const allEventDates = new Set();
  (DB.calendar.events||[]).forEach(ev => {
    getEventOccurrences(ev, new Date(y,m,1), new Date(y,m+1,0)).forEach(d => {
      allEventDates.add(d.toDateString());
    });
  });
  for (let d = 1; d <= days; d++) {
    const dt = new Date(y, m, d);
    const isToday = dt.toDateString() === now.toDateString();
    const isSel = dt.toDateString() === calState.selectedDate.toDateString();
    const hasEv = allEventDates.has(dt.toDateString());
    html += `<div class="cal-mini-d${isToday?' today':''}${isSel&&!isToday?' selected':''}${hasEv?' has-event':''}" onclick="calMiniClick(${y},${m},${d})">${d}</div>`;
  }
  html += '</div>';
  wrap.innerHTML = html;
}

function calMiniNav(dir) {
  calState.miniMonth += dir;
  if (calState.miniMonth > 11) { calState.miniMonth = 0; calState.miniYear++; }
  if (calState.miniMonth < 0) { calState.miniMonth = 11; calState.miniYear--; }
  renderMiniCal();
}

function calMiniClick(y, m, d) {
  const dt = new Date(y, m, d);
  calState.selectedDate = dt;
  calState.year = y; calState.month = m;
  calState.weekStart = getWeekStart(dt);
  calState.dayDate = dt;
  calState.miniYear = y; calState.miniMonth = m;
  renderCalendar();
}

