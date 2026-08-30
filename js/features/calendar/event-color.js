/* ── EVENT COLOR ── */
function evColor(ev) {
  if (ev.color) return ev.color;
  const cal = (DB.calendar.cals||[]).find(c=>c.id===ev.calId);
  return cal?.color || '#0F6B30';
}

