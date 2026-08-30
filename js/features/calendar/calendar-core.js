/* ── ENTRY SCREEN ──
   No password is required to get in. This screen is kept as a placeholder
   for a real account sign-in down the road — for now "Continue" just
   dismisses it. Admin access has moved entirely to the Bonus Code section
   in Settings (see bonus-config.js / bonus-redeem-reset.js), which is
   stored separately under localStorage 'scholr_bonus_flags'. */
function gateCheck(){
  const gate = document.getElementById('gate');
  if (!gate) return;
  gate.style.transition = 'opacity .4s';
  gate.style.opacity = '0';
  setTimeout(()=>gate.remove(), 400);
  sessionStorage.setItem('scholr_access','granted');
}
// Check if already granted this session (sessionStorage clears when the tab/browser closes,
// so the entry screen shows again on every new visit, not just once per device)
if(sessionStorage.getItem('scholr_access')==='granted'){
  document.addEventListener('DOMContentLoaded',()=>{
    const gate=document.getElementById('gate');
    if(gate) gate.remove();
  });
}

/* ════════════════════════════════════════
   CALENDAR MODULE
════════════════════════════════════════ */

let calState = {
  view: 'month',
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  weekStart: getWeekStart(new Date()),
  dayDate: new Date(),
  miniYear: new Date().getFullYear(),
  miniMonth: new Date().getMonth(),
  selectedDate: new Date(),
  popEventId: null
};

const CAL_COLORS = ['#0F6B30','#1D4ED8','#6D28D9','#BE185D','#B45309','#0F766E','#C05418','#901818','#374151','#0369A1','#D97706','#7C3AED'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getWeekStart(d) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() - dt.getDay());
  dt.setHours(0,0,0,0);
  return dt;
}

function calView(v) {
  calState.view = v;
  document.querySelectorAll('.cal-view-btn').forEach(b => {
    b.classList.toggle('on', b.dataset.v === v);
  });
  renderCalendar();
}

function calNav(dir) {
  if (calState.view === 'month') {
    calState.month += dir;
    if (calState.month > 11) { calState.month = 0; calState.year++; }
    if (calState.month < 0) { calState.month = 11; calState.year--; }
  } else if (calState.view === 'week') {
    const ws = new Date(calState.weekStart);
    ws.setDate(ws.getDate() + dir * 7);
    calState.weekStart = ws;
  } else if (calState.view === 'day') {
    const dd = new Date(calState.dayDate);
    dd.setDate(dd.getDate() + dir);
    calState.dayDate = dd;
  } else if (calState.view === 'agenda') {
    calState.month += dir;
    if (calState.month > 11) { calState.month = 0; calState.year++; }
    if (calState.month < 0) { calState.month = 11; calState.year--; }
  }
  renderCalendar();
}

function calToday() {
  const now = new Date();
  calState.year = now.getFullYear();
  calState.month = now.getMonth();
  calState.weekStart = getWeekStart(now);
  calState.dayDate = now;
  renderCalendar();
}

function renderCalendar() {
  // pg-calendar now hosts an embedded external calendar (iframe); the
  // built-in calendar DOM (cal-grid etc.) no longer exists on the page.
  // Guard so any leftover caller (mini-cal nav, event save/delete...)
  // no-ops instead of throwing.
  if (!g('cal-grid')) return;
  renderMiniCal();
  renderCalCals();
  const v = calState.view;
  if (v === 'month') renderMonthView();
  else if (v === 'week') renderWeekView();
  else if (v === 'day') renderDayView();
  else if (v === 'agenda') renderAgendaView();
}

