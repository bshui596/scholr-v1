/* ── NEW CALENDAR ── */
function calNewCal() {
  const cg = g('cal-mgr-color-g');
  cg.innerHTML = CAL_COLORS.map(c=>`<div style="width:22px;height:22px;border-radius:50%;background:${c};cursor:pointer;border:2px solid transparent;transition:all .12s" onclick="calPickMgrColor('${c}',this)"></div>`).join('');
  g('cal-mgr-name').value=''; g('cal-mgr-desc').value=''; g('cal-mgr-color').value=CAL_COLORS[0];
  cg.firstElementChild && (cg.firstElementChild.style.border='2px solid var(--ink)');
  showMo('mo-cal-mgr');
}
function calPickMgrColor(c, el) {
  g('cal-mgr-color').value=c;
  document.querySelectorAll('#cal-mgr-color-g div').forEach(d=>d.style.border='2px solid transparent');
  el.style.border='2px solid var(--ink)';
}
function calSaveCal() {
  const name = g('cal-mgr-name').value.trim();
  if (!name) { toast('Enter calendar name!'); return; }
  if (!DB.calendar.cals) DB.calendar.cals = [];
  DB.calendar.cals.push({ id:'cal'+Date.now(), name, color: g('cal-mgr-color').value||'#0F6B30', desc: g('cal-mgr-desc').value.trim(), visible:true });
  save(); closeMo('mo-cal-mgr'); renderCalendar(); toast('Calendar created!');
}

