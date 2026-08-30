/* ── CUSTOMIZABLE SIDEBAR ── */
// Related pages are combined into a single hub entry (see PAGE_GROUPS below).
// Clicking a hub entry opens its default page; a tab strip under the topbar
// lets you switch between the pages grouped inside it.
const SIDEBAR_ITEMS = [
  {id:'dashboard', ic:'🏠', label:'Dashboard', sec:'Main', pg:'dashboard'},
  {id:'homework', ic:'📋', label:'Homework', sec:'Main', pg:'homework', badge:'hw-badge'},
  {id:'notes', ic:'📝', label:'Notes', sec:'Main', pg:'notes'},
  {id:'checklist', ic:'☑️', label:'Checklist', sec:'Main', pg:'checklist'},
  {id:'drive', ic:'📁', label:'Drive', sec:'Main', pg:'drive'},
  {id:'schedule', ic:'🗓', label:'Schedule', sec:'Schedule', pg:'timetable', group:'schedule'},
  {id:'academics', ic:'📊', label:'Academics', sec:'Academics', pg:'grades', group:'academics'},
  {id:'ib', ic:'🎓', label:'IB Diploma', sec:'Academics', pg:'ibpoints', group:'ib'},
  {id:'calc', ic:'🖩', label:'Calculator', sec:'Tools', action:'toggleCalc()'},
  {id:'embeds', ic:'📈', label:'Tools', sec:'Tools', pg:'embeds', group:'tools'},
  {id:'pomodoro', ic:'🍅', label:'Pomodoro', sec:'Tools', pg:'pomodoro'},
  {id:'scratch', ic:'🗒', label:'Scratch Pad', sec:'Tools', action:'openScratch()'},
  {id:'focus', ic:'🎯', label:'Focus Mode', sec:'Tools', action:'toggleFocus()'},
  {id:'data', ic:'📤', label:'Import & Export', sec:'Tools', pg:'data'},
  {id:'settings', ic:'⚙️', label:'Settings', sec:'Tools', pg:'settings'},
  {id:'guide', ic:'❓', label:'Guide', sec:'Tools', pg:'guide'},
];
function sbGetOrder(){
  const defaultOrder = SIDEBAR_ITEMS.map(i=>i.id);
  let order = (DB.p.sbOrder||[]).filter(id=>defaultOrder.includes(id));
  defaultOrder.forEach(id=>{ if(!order.includes(id)) order.push(id); }); // new items get appended
  return order;
}
/* ── PAGE GROUPS — related pages combined behind one sidebar entry,
   switchable via a tab strip under the topbar ── */
const PAGE_GROUPS = {
  schedule: {label:'Schedule', pages:[
    {id:'timetable', label:'Timetable', ic:'🗓'},
    {id:'dayplan', label:'Day Plan', ic:'📅'},
    {id:'planday', label:'Plan My Day', ic:'🧭'},
    {id:'planner', label:'Weekly Planner', ic:'🗂️'},
    {id:'calendar', label:'Calendar', ic:'🗓️'},
    {id:'classroom', label:'Classroom', ic:'🎓'},
  ]},
  academics: {label:'Academics', pages:[
    {id:'grades', label:'Grade Book', ic:'📊'},
    {id:'goals', label:'Grade Goals', ic:'🏆'},
    {id:'gpa', label:'GPA Calculator', ic:'🎯'},
    {id:'flashcards', label:'Flashcards', ic:'🃏'},
    {id:'exams', label:'Exam Planner', ic:'⏳'},
    {id:'analytics', label:'Study Overview', ic:'📈'},
    {id:'rubric', label:'Rubric', ic:'🧾'},
  ]},
  ib: {label:'IB Diploma', pages:[
    {id:'ibpoints', label:'IB Points', ic:'🎓'},
    {id:'cas', label:'CAS Tracker', ic:'🌱'},
  ]},
  tools: {label:'Tools', pages:[
    {id:'embeds', label:'Math Tools', ic:'📈'},
    {id:'converter', label:'Converter', ic:'⚖️'},
  ]},
};
const PAGE_TO_GROUP = {};
Object.entries(PAGE_GROUPS).forEach(([key,grp])=>grp.pages.forEach(p=>PAGE_TO_GROUP[p.id]=key));

function renderPgTabs(id){
  const bar = g('pg-tabs');
  if(!bar) return;
  const groupKey = PAGE_TO_GROUP[id];
  if(!groupKey){ bar.style.display='none'; bar.innerHTML=''; return; }
  const grp = PAGE_GROUPS[groupKey];
  bar.style.display='flex';
  bar.innerHTML = grp.pages.map(p=>
    `<div class="pg-tab${p.id===id?' on':''}" onclick="go('${p.id}')">${p.ic?`<span>${p.ic}</span>`:''}${p.label}</div>`
  ).join('');
}

function sbGetCollapsed(){ return DB.p.sbCollapsed || []; }
function sbToggleSection(sec){
  const list = sbGetCollapsed();
  const i = list.indexOf(sec);
  if (i === -1) list.push(sec); else list.splice(i,1);
  DB.p.sbCollapsed = list; save();
  renderSidebarNav();
}
function renderSidebarNav(){
  const order = sbGetOrder();
  const hidden = DB.p.sbHidden || [];
  const collapsed = sbGetCollapsed();
  const byId = Object.fromEntries(SIDEBAR_ITEMS.map(i=>[i.id,i]));
  // Group by section (in first-seen order) so related features sit together
  // under one collapsible header instead of a long flat list.
  const secs = []; const bySec = {};
  order.forEach(id=>{
    if (hidden.includes(id)) return;
    const it = byId[id]; if (!it) return;
    if (!bySec[it.sec]) { bySec[it.sec] = []; secs.push(it.sec); }
    bySec[it.sec].push(it);
  });
  let html = '';
  secs.forEach(sec=>{
    const isClosed = collapsed.includes(sec);
    html += `<div class="sb-sec${isClosed?' collapsed':''}" onclick="sbToggleSection('${sec}')">${sec}</div>`;
    html += `<div class="sb-sec-body${isClosed?' collapsed':''}">`;
    bySec[sec].forEach(it=>{
      const onclick = it.pg ? `go('${it.pg}')` : it.action;
      const dataPg = it.group ? '' : (it.pg ? ` data-pg="${it.pg}"` : '');
      const dataGrp = it.group ? ` data-grp="${it.group}"` : '';
      const badge = it.badge ? `<span class="sb-badge" id="${it.badge}">0</span>` : '';
      html += `<div class="sb-a" data-id="${it.id}"${dataPg}${dataGrp} onclick="${onclick}" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}"><span class="sb-ico">${it.ic}</span><span>${it.label}</span>${badge}</div>`;
    });
    html += `</div>`;
  });
  const el = g('sb-nav-items'); if (el) el.innerHTML = html;
  document.querySelector(`.sb-a[data-pg="${curPg}"]`)?.classList.add('on');
  const curGrp = PAGE_TO_GROUP[curPg];
  if (curGrp) document.querySelector(`.sb-a[data-grp="${curGrp}"]`)?.classList.add('on');

  // make sidebar items draggable for reordering
  const items = el ? Array.from(el.querySelectorAll('.sb-a')) : [];
  let dragSrc = null;
  items.forEach(it => {
    it.draggable = true;
    it.addEventListener('dragstart', e => { dragSrc = it; it.style.opacity = '.5'; e.dataTransfer.effectAllowed = 'move'; });
    it.addEventListener('dragend', () => { if(dragSrc) dragSrc.style.opacity=''; dragSrc = null; });
    it.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; it.classList.add('drag-over'); });
    it.addEventListener('dragleave', () => it.classList.remove('drag-over'));
    it.addEventListener('drop', e => {
      e.stopPropagation(); it.classList.remove('drag-over'); if (!dragSrc || dragSrc === it) return;
      const order = sbGetOrder();
      const srcId = dragSrc.getAttribute('data-id'); const dstId = it.getAttribute('data-id');
      const srcIdx = order.indexOf(srcId); const dstIdx = order.indexOf(dstId);
      if (srcIdx === -1 || dstIdx === -1) return;
      order.splice(srcIdx,1);
      order.splice(dstIdx,0,srcId);
      DB.p.sbOrder = order; save(); renderSidebarNav();
    });
  });
}
function openSidebarCustomize(){
  closeLayoutMenu();
  const order = sbGetOrder(), hidden = DB.p.sbHidden || [];
  const byId = Object.fromEntries(SIDEBAR_ITEMS.map(i=>[i.id,i]));
  const el = g('sbc-list');
  el.innerHTML = order.map((id,i)=>{
    const it = byId[id]; if (!it) return '';
    const isHidden = hidden.includes(id);
    return `<div style="display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:8px;background:var(--s2);margin-bottom:5px;${isHidden?'opacity:.45':''}">
      <span style="font-size:14px">${it.ic}</span>
      <span style="flex:1;font-size:12.5px;font-weight:600">${it.label}</span>
      <span style="font-size:9.5px;color:var(--ink4);text-transform:uppercase">${it.sec}</span>
      <button onclick="sbcMove(${i},-1)" style="background:none;border:none;cursor:pointer;font-size:13px;color:var(--ink4)" ${i===0?'disabled':''} aria-label="Move up">↑</button>
      <button onclick="sbcMove(${i},1)" style="background:none;border:none;cursor:pointer;font-size:13px;color:var(--ink4)" ${i===order.length-1?'disabled':''} aria-label="Move down">↓</button>
      <button onclick="sbcToggleHide('${id}')" style="background:none;border:none;cursor:pointer;font-size:13px;color:var(--ink4)" aria-label="${isHidden?'Show':'Hide'} item">${isHidden?'🙈':'👁'}</button>
    </div>`;
  }).join('');
  showMo('mo-sbc');
}
function sbcMove(i, dir){
  const order = sbGetOrder();
  const j = i + dir;
  if (j < 0 || j >= order.length) return;
  [order[i], order[j]] = [order[j], order[i]];
  DB.p.sbOrder = order; save(); renderSidebarNav(); openSidebarCustomize();
}
function sbcToggleHide(id){
  let hidden = DB.p.sbHidden || [];
  hidden = hidden.includes(id) ? hidden.filter(x=>x!==id) : [...hidden, id];
  DB.p.sbHidden = hidden; save(); renderSidebarNav();
  if (g('mo-sbc')?.classList.contains('on')) openSidebarCustomize();
  if (g('sp-sidebar')?.classList.contains('on')) renderSidebarSettings();
}
function sbcReset(){
  DB.p.sbOrder = null; DB.p.sbHidden = []; save(); renderSidebarNav();
  if (g('mo-sbc')?.classList.contains('on')) openSidebarCustomize();
  if (g('sp-sidebar')?.classList.contains('on')) renderSidebarSettings();
  toast('Sidebar reset to default');
}

function go(id) {
  curPg = id;
  const ns = g('ns'), ps = g('ps');
  if (id === 'notes') {
    ns.classList.add('on'); ps.classList.add('notes-mode');
    g('tb-acts').style.display = 'none';
    if (noteId) { g('ed').style.display='flex'; g('no-note').classList.remove('vis'); }
    else if (DB.notes.length) openNote(DB.notes[0].id);
    else { g('ed').style.display='none'; g('no-note').classList.add('vis'); }
  } else {
    ns.classList.remove('on'); ps.classList.remove('notes-mode');
    g('tb-acts').style.display = 'flex';
  }
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  if (id !== 'notes') g('pg-'+id)?.classList.add('on');
  document.querySelectorAll('.sb-a').forEach(a => a.classList.remove('on'));
  document.querySelector(`.sb-a[data-pg="${id}"]`)?.classList.add('on');
  const grp = PAGE_TO_GROUP[id];
  if (grp) document.querySelector(`.sb-a[data-grp="${grp}"]`)?.classList.add('on');
  renderPgTabs(id);
  setText('pg-title', PG[id]||id);
  if (id==='dashboard') renderDashboard();
  if (id==='drive') renderDrive();
  if (id==='grades') renderGrades();
  if (id==='dayplan') renderDayPlan();
  if (id==='planday') renderPlanDay();
  if (id==='planner') renderPlanner();
  if (id==='goals') renderGoals();
  if (id==='checklist') renderChecklist();
  if (id==='rubric') renderRubric();
  if (id==='calendar') renderCalendar();
  if (id==='classroom') classroomInit();
  if (id==='settings') { renderSettings(); sTab('profile'); }
  if (id==='gpa') { renderGPA(); renderGPAScaleRef(); }
  if (id==='flashcards') fcRenderDecks();
  if (id==='exams') examRender();
  if (id==='analytics') renderAnalytics();
  if (id==='pomodoro') { pomRenderDots(); pomUpdateDisplay(); pomUpdateStats(); pomSyncSettingsUI(); }
  if (id==='converter') setTimeout(()=>convCat('length', document.querySelector('[data-cat="length"]')),0);
  if (id==='ibpoints') ibRenderSubjects();
  if (id==='cas') casRender();
  if (id==='admin') renderAdmin();
  if (id==='data') renderDataPage();
}

