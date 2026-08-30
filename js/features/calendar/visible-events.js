/* ── GET VISIBLE EVENTS ── */
function getVisibleCals() {
  return new Set((DB.calendar.cals||[]).filter(c=>c.visible).map(c=>c.id));
}

