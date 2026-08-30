/* ── CALENDAR LIST (sidebar) ── */
function renderCalCals() {
  const el = g('cal-cals');
  if (!el) return;
  el.innerHTML = (DB.calendar.cals||[]).map(cal => `
    <div class="cal-cal-item">
      <input type="checkbox" ${cal.visible?'checked':''} onchange="calToggleCal('${cal.id}',this.checked)" style="accent-color:${cal.color}"/>
      <div class="cal-cal-dot" style="background:${cal.color}"></div>
      <span class="cal-cal-name">${cal.name}</span>
    </div>`).join('');
}

function calToggleCal(id, v) {
  const cal = (DB.calendar.cals||[]).find(c=>c.id===id);
  if (cal) { cal.visible = v; save(); renderCalendar(); }
}

