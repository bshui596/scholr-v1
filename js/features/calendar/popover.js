/* ── POPOVER ── */
function calShowPop(evId, anchorEl) {
  const ev = (DB.calendar.events||[]).find(e=>e.id===evId);
  if (!ev) return;
  calState.popEventId = evId;
  const col = evColor(ev);
  const pop = g('cal-popover');
  g('cal-pop-title').innerHTML = `<span style="color:${col}">●</span> ${ev.title}`;
  g('cal-pop-time').textContent = fmtEventTime(ev) + (ev.repeat&&ev.repeat!=='none'?' · Repeats':'');

  const locEl = g('cal-pop-loc');
  if (ev.location) { locEl.textContent = '📍 ' + ev.location; locEl.style.display=''; }
  else locEl.style.display='none';

  const descEl = g('cal-pop-desc');
  if (ev.description) { descEl.textContent = ev.description; descEl.style.display=''; }
  else descEl.style.display='none';

  const calObj = (DB.calendar.cals||[]).find(c=>c.id===ev.calId);
  g('cal-pop-cal').textContent = calObj ? '📅 ' + calObj.name : '';

  // Position
  const rect = anchorEl.getBoundingClientRect();
  pop.style.display='block';
  let left = rect.right + 10;
  let top = rect.top;
  if (left + 290 > window.innerWidth) left = rect.left - 300;
  if (top + 200 > window.innerHeight) top = window.innerHeight - 210;
  pop.style.left = Math.max(4, left) + 'px';
  pop.style.top = Math.max(4, top) + 'px';
}

function calEditFromPop() {
  const id = calState.popEventId;
  g('cal-popover').style.display='none';
  if (id) calOpenModal(id);
}
function calDeleteFromPop() {
  const id = calState.popEventId;
  if (!id || !confirm('Delete this event?')) return;
  DB.calendar.events = (DB.calendar.events||[]).filter(e=>e.id!==id);
  save(); g('cal-popover').style.display='none'; renderCalendar(); toast('Event deleted');
}

