/* ── CELL CLICK ── */
function calCellClick(dateStr) {
  const dt = new Date(dateStr + 'T00:00:00');
  calState.selectedDate = dt;
  if (calState.view === 'month') {
    calState.dayDate = dt;
    calView('day');
  }
  renderMiniCal();
}

