/* ── SETTINGS ── */
function renderSettings() {
  const p = DB.p;
  setValue('s-name', p.name); setValue('s-school', p.school||'');
  setSel('s-grade', p.grade); setSel('s-sem', p.sem); setSel('s-tpl', p.tpl||'blank');
  renderSemArchives();
  // Avatar
  const ag = g('ava-g');
  if (ag) ag.innerHTML = AVATARS.map(a =>
    `<div class="ava-opt ${p.avatar===a&&!p.avatarImg?'on':''}" data-av="${a}" onclick="pickAv('${a}')">${a}</div>`
  ).join('') + `<div class="ava-upload" onclick="uploadAv()" title="Upload photo">📷</div>`;
  // Themes
  const tg = g('theme-g');
  if (tg) tg.innerHTML = THEMES.map(t =>
    `<div class="theme-sw ${p.theme===t.id?'on':''}" style="background:${t.c}" title="${t.id}" onclick="pickTheme(this,'${t.id}')">${t.e}</div>`
  ).join('');
  // Fonts
  const fg = g('font-g');
  if (fg) fg.innerHTML = FONTS.map(f =>
    `<div class="font-c ${p.font===f.id?'on':''}" onclick="pickFont(this,'${f.id}')"><span class="fn" style="font-family:'${f.s}'">${f.l}</span><span class="fs">Aa Bb</span></div>`
  ).join('');
  // Editor prefs
  if(p.docW) setSel('s-docw', p.docW);
  if(p.docFs) setSel('s-docfs', p.docFs);
  if(p.docLh) setSel('s-doclh', p.docLh);
  if(p.docPad) setSel('s-docpad', p.docPad);
  const sbSlider = g('s-sbw'); if(sbSlider) sbSlider.value = p.sbW || 260;
  if(p.density) setSel('s-density', p.density);
  if(p.rad) setSel('s-rad', p.rad);
  if(p.th) setSel('s-th', p.th);
  if(p.shadow) setSel('s-shadow', p.shadow);
  if(p.btnStyle) setSel('s-btnstyle', p.btnStyle);
  if(p.sbStyle) setSel('s-sbstyle', p.sbStyle);
  if(p.docStyle) setSel('s-docstyle', p.docStyle);
  const ctSec=g('custom-theme-sec'); if(ctSec) ctSec.style.display=p.theme==='custom'?'block':'none';
  buildCustomTheme();
  // Courses
  const cr = g('s-cr');
  if (cr) { cr.innerHTML=''; DB.courses.forEach(c => addCRow(cr, c.name, c.color, c.level)); }
  // Slots
  const sl = g('s-slots');
  if (sl) { sl.innerHTML=''; (DB.slots||[]).forEach(s => addSlotRow(sl, s)); }
  pomSyncSettingsUI();
}
function pickTheme(el, id) {
  document.querySelectorAll('.theme-sw').forEach(s => s.classList.remove('on'));
  el.classList.add('on'); applyTheme(id); save(); toast(`Theme: ${id}`);
}
/* Sidebar style: 'dark' = fixed independent rail (default), 'matched' = the
   sidebar reuses whatever theme (including a custom one) is active. */
function setSidebarStyle(style){
  const sb = g('sb'); if (!sb) return;
  sb.classList.toggle('theme-matched', style === 'matched');
  DB.p.sbStyle = style; save();
  syncSidebarStyleButtons();
}
function syncSidebarStyleButtons(){
  const style = DB.p?.sbStyle === 'matched' ? 'matched' : 'dark';
  g('sb-style-dark')?.classList.toggle('on', style === 'dark');
  g('sb-style-matched')?.classList.toggle('on', style === 'matched');
}
function applySavedSidebarStyle(){
  const sb = g('sb'); if (!sb) return;
  sb.classList.toggle('theme-matched', DB.p?.sbStyle === 'matched');
  syncSidebarStyleButtons();
}
function pickFont(el, id) {
  document.querySelectorAll('.font-c').forEach(c => c.classList.remove('on'));
  el.classList.add('on'); applyFont(id); save(); toast(`Font: ${id}`);
}
function sTab(id) {
  document.querySelectorAll('.set-tab').forEach(t => t.classList.remove('on'));
  document.querySelectorAll('.set-p').forEach(p => p.classList.remove('on'));
  document.querySelector(`.set-tab[data-tab="${id}"]`)?.classList.add('on');
  g('sp-'+id)?.classList.add('on');
  if (id === 'sidebar') renderSidebarSettings();
}
function renderSidebarSettings(){
  const order = sbGetOrder(), hidden = DB.p.sbHidden || [];
  const byId = Object.fromEntries(SIDEBAR_ITEMS.map(i=>[i.id,i]));
  const el = g('sp-sidebar-list'); if (!el) return;
  el.innerHTML = order.map(id=>{
    const it = byId[id]; if (!it) return '';
    const on = !hidden.includes(id);
    return `<div class="set-row"><label><span style="margin-right:6px">${it.ic}</span>${it.label}<small>${it.sec}</small></label>
      <input type="checkbox" ${on?'checked':''} onchange="sbcToggleHide('${id}')" style="width:18px;height:18px;accent-color:var(--ac);cursor:pointer"/>
    </div>`;
  }).join('');
}
function addSlotRow(list, val='') {
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:7px;align-items:center;margin-bottom:6px';
  row.innerHTML = `<input class="fi" style="max-width:150px" value="${val}" placeholder="e.g. 8:30 AM" autocomplete="off"/><button class="cb-x" onclick="this.parentElement.remove()">✕</button>`;
  list.appendChild(row);
}
function saveSlots() {
  DB.slots = [];
  document.querySelectorAll('#s-slots input').forEach(i => { const v=i.value.trim(); if(v) DB.slots.push(v); });
  save(); renderTT(); toast('Slots saved!');
}

/* ── NAVIGATION ── */
const PG = {dashboard:'Dashboard',homework:'Homework',notes:'Notes',checklist:'Checklist',drive:'My Drive',timetable:'Timetable',dayplan:'Day Plan',planday:'Plan My Day',planner:'Weekly Planner',calendar:'Calendar',classroom:'Google Classroom',grades:'Grade Book',goals:'Grade Goals',rubric:'Rubric',settings:'Settings',data:'Import & Export',exams:'Exam Planner',analytics:'Study Overview'};
let curPg = 'dashboard';

