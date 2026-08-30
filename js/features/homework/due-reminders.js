/* ── NOTIFICATION CENTER ──────────────────────────────────────────
   In-app log of things that need attention: homework due/overdue,
   upcoming exams, and grade goals falling behind. Persisted in
   DB.notifs so it survives reloads; deduped per-day via `key` so
   generateNotifs() can be called freely without spamming the list. */
const NOTIF_ICON = {hw:'📋', exam:'⏳', goal:'🏆'};
function pushNotif(type, msg, key){
  if (!DB.notifs) DB.notifs = [];
  const today = new Date().toISOString().slice(0,10);
  if (key && DB.notifs.some(n=>n.key===key && n.date===today)) return;
  DB.notifs.unshift({id:'nt'+Date.now()+Math.random().toString(36).slice(2,6), type, msg, date:today, read:false, key:key||null});
  DB.notifs = DB.notifs.slice(0,40);
}
function generateNotifs(){
  if (!DB.notifs) DB.notifs = [];
  (DB.hw||[]).filter(h=>h.status!=='done' && h.due).forEach(h=>{
    const d = dLeft(h.due), t = h.title||'Assignment';
    if (d<0) pushNotif('hw', `⏰ "${t}" is overdue`, 'hw-over-'+h.id);
    else if (d===0) pushNotif('hw', `📌 "${t}" is due today`, 'hw-today-'+h.id);
    else if (d===1) pushNotif('hw', `📌 "${t}" is due tomorrow`, 'hw-tom-'+h.id);
  });
  (DB.exams||[]).forEach(ex=>{
    const d = dLeft(ex.date);
    if (d===3 || d===1 || d===0) pushNotif('exam', `⏳ ${ex.title} (${ex.course}) is ${d===0?'today':d===1?'tomorrow':'in '+d+' days'}`, 'exam-'+d+'-'+ex.id);
  });
  (DB.goals||[]).forEach(gl=>{
    const avg = courseAvg(gl.course);
    if (avg!==null && avg < gl.target - 5) pushNotif('goal', `🏆 ${gl.course} average (${avg.toFixed(0)}%) is below your ${gl.target}% goal`, 'goal-'+gl.id);
  });
}
function renderNotifCenter(){
  const list=g('notif-list'), badge=g('notif-badge');
  const notifs = DB.notifs||[];
  const unread = notifs.filter(n=>!n.read).length;
  if (badge) { badge.style.display = unread ? 'flex' : 'none'; badge.textContent = unread>9?'9+':unread; }
  if (!list) return;
  list.innerHTML = notifs.length ? notifs.map(n=>`<div class="notif-row ${n.read?'':'unread'}" onclick="markNotifRead('${n.id}')">
      <span class="notif-ic">${NOTIF_ICON[n.type]||'🔔'}</span>
      <div><div class="notif-msg">${n.msg}</div><div class="notif-date">${n.date}</div></div>
    </div>`).join('') : '<div class="palette-empty">You\'re all caught up 🎉</div>';
}
function markNotifRead(id){ const n=(DB.notifs||[]).find(x=>x.id===id); if(n && !n.read){ n.read=true; save(); renderNotifCenter(); } }
function toggleNotifCenter(){
  const panel=g('notif-panel'); if (!panel) return;
  closeLayoutMenu();
  const opening = !panel.classList.contains('on');
  panel.classList.toggle('on');
  if (opening) { (DB.notifs||[]).forEach(n=>n.read=true); save(); renderNotifCenter(); }
}
function clearNotifs(){ DB.notifs=[]; save(); renderNotifCenter(); toast('Notifications cleared'); }
document.addEventListener('click', e => {
  const panel=g('notif-panel'), btn=g('notif-btn');
  if (panel && panel.classList.contains('on') && !panel.contains(e.target) && e.target!==btn && !(btn&&btn.contains(e.target))) {
    panel.classList.remove('on');
  }
});

