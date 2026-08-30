/* ── FORMAT TIME ── */
function fmtTime(timeStr) {
  if (!timeStr) return '';
  const [h,m] = timeStr.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2,'0')} ${ampm}`;
}
function fmtEventTime(ev) {
  if (ev.allDay) return 'All day';
  const s = fmtTime(ev.startTime), e = fmtTime(ev.endTime);
  return e ? `${s} – ${e}` : s;
}

