/* ── DAY VIEW ── */
function renderDayView() {
  const dt = calState.dayDate;
  const now = new Date();
  const isToday = dt.toDateString() === now.toDateString();
  const visCals = getVisibleCals();
  const dateStr = dt.toISOString().split('T')[0];

  setText('cal-hd-label', dt.toLocaleDateString('en-CA',{weekday:'long',month:'long',day:'numeric',year:'numeric'}));

  const dayEvs = [];
  (DB.calendar.events||[]).forEach(ev => {
    if (!visCals.has(ev.calId)) return;
    getEventOccurrences(ev, dt, dt).forEach(() => dayEvs.push(ev));
  });

  const allDay = dayEvs.filter(e=>e.allDay);
  const timed = dayEvs.filter(e=>!e.allDay).sort((a,b)=>(a.startTime||'').localeCompare(b.startTime||''));

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowPx = nowMin * 48 / 60;

  let timeCol = '';
  let hoursCol = '';
  for (let h = 0; h < 24; h++) {
    const label = h === 0 ? '' : (h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h-12} PM`);
    timeCol += `<div class="cal-time-slot">${label}</div>`;
    hoursCol += `<div class="cal-hour-line" style="height:48px" onclick="calQuickNew('${dateStr}','${String(h).padStart(2,'0')}:00')"></div>`;
  }

  let evChips = '';
  timed.forEach(ev => {
    const [sh,sm] = (ev.startTime||'00:00').split(':').map(Number);
    const [eh,em] = (ev.endTime||'23:59').split(':').map(Number);
    const top = (sh*60+sm)*48/60;
    const height = Math.max(30, ((eh*60+em)-(sh*60+sm))*48/60);
    const col = evColor(ev);
    evChips += `<div class="cal-week-event" style="top:${top}px;height:${height}px;background:${col}22;color:${col};border-left-color:${col};left:60px;right:4px" onclick="calShowPop('${ev.id}',this)">
      <div style="font-weight:700">${ev.title}</div>
      <div style="font-size:10px;opacity:.8">${fmtTime(ev.startTime)}${ev.endTime?' – '+fmtTime(ev.endTime):''}</div>
      ${ev.location?`<div style="font-size:10px;opacity:.7">📍 ${ev.location}</div>`:''}
    </div>`;
  });

  const nowLine = isToday ? `<div class="cal-now-line" style="top:${nowPx}px;left:0;right:0"></div>` : '';

  g('cal-grid').innerHTML = `<div style="min-width:300px">
    ${allDay.length ? `<div style="padding:8px;border-bottom:1px solid var(--bor);background:var(--s2)">
      <div style="font-size:10px;font-weight:700;color:var(--ink4);margin-bottom:5px">ALL DAY</div>
      ${allDay.map(ev=>`<div class="cal-ev-chip" style="background:${evColor(ev)};color:#fff;margin-bottom:3px" onclick="calShowPop('${ev.id}',this)">${ev.title}</div>`).join('')}
    </div>` : ''}
    <div style="display:flex;position:relative">
      <div style="width:52px;flex-shrink:0">${timeCol}</div>
      <div style="flex:1;position:relative">${hoursCol}${evChips}${nowLine}</div>
    </div>
  </div>`;
}

