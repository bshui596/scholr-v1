/* ── COMMAND PALETTE (⌘K) ── */
const PALETTE_NAV = [
  {label:'Dashboard', ic:'🏠', run:()=>go('dashboard')},
  {label:'Homework', ic:'📋', run:()=>go('homework')},
  {label:'Notes', ic:'📝', run:()=>go('notes')},
  {label:'Checklist', ic:'☑️', run:()=>go('checklist')},
  {label:'Drive', ic:'📁', run:()=>go('drive')},
  {label:'Timetable', ic:'🗓', run:()=>go('timetable')},
  {label:'Day Plan', ic:'📅', run:()=>go('dayplan')},
  {label:'Calendar', ic:'🗓️', run:()=>go('calendar')},
  {label:'Google Classroom', ic:'🎓', run:()=>go('classroom')},
  {label:'Grade Book', ic:'📊', run:()=>go('grades')},
  {label:'GPA Calculator', ic:'🎯', run:()=>go('gpa')},
  {label:'Flashcards', ic:'🃏', run:()=>go('flashcards')},
  {label:'Rubric', ic:'🧾', run:()=>go('rubric')},
  {label:'IB Diploma Points', ic:'🎓', run:()=>go('ibpoints')},
  {label:'CAS Tracker', ic:'🌱', run:()=>go('cas')},
  {label:'Unit Converter', ic:'⚖️', run:()=>go('converter')},
  {label:'Pomodoro', ic:'🍅', run:()=>go('pomodoro')},
  {label:'Import & Export', ic:'📤', run:()=>go('data')},
  {label:'Settings', ic:'⚙️', run:()=>go('settings')},
  {label:'Getting Started Guide', ic:'❓', run:()=>go('guide')},
];
const PALETTE_ACTIONS = [
  {label:'New homework task', ic:'➕', sub:'Action', run:()=>showMo('mo-hw')},
  {label:'New note', ic:'➕', sub:'Action', run:()=>newNote()},
  {label:'Toggle Focus Mode', ic:'🎯', sub:'Action', run:()=>toggleFocus()},
  {label:'Open calculator', ic:'🖩', sub:'Action', run:()=>toggleCalc()},
  {label:'Open scratch pad', ic:'🗒', sub:'Action', run:()=>openScratch()},
  {label:'Quick layout & theme', ic:'🎨', sub:'Action', run:()=>toggleLayoutMenu()},
  {label:'Customize sidebar', ic:'🔀', sub:'Action', run:()=>openSidebarCustomize()},
  {label:'Download full backup', ic:'⬇', sub:'Action', run:()=>exportData()},
];
let paletteSel = 0, paletteMatches = [];

function openPalette(q=''){
  const ov = g('palette-ov'); if (!ov) return;
  ov.classList.add('on');
  const inp = g('palette-inp');
  inp.value = q;
  document.activeElement?.blur?.();
  setTimeout(()=>inp.focus(), 30);
  renderPalette(q);
}
function closePalette(){ g('palette-ov')?.classList.remove('on'); }

function renderPalette(q){
  q = (q||'').toLowerCase().trim();
  const notesMatch = q ? (DB.notes||[]).filter(n=>(n.title||'').toLowerCase().includes(q)).slice(0,5)
      .map(n=>({label:n.title||'Untitled', ic:'📝', sub:'Note', run:()=>{ closePalette(); go('notes'); openNote(n.id); }})) : [];
  const items = [...PALETTE_NAV, ...PALETTE_ACTIONS].filter(i=>!q || i.label.toLowerCase().includes(q));
  paletteMatches = [...notesMatch, ...items];
  paletteSel = 0;
  const el = g('palette-results');
  if (!paletteMatches.length) { el.innerHTML = '<div class="palette-empty">No matches — try a page name or "note"</div>'; return; }
  el.innerHTML = paletteMatches.map((it,i)=>
    `<div class="palette-item${i===0?' sel':''}" data-i="${i}" onmouseenter="paletteSel=${i};paletteHighlight()" onclick="paletteRun(${i})">
      <span class="pi-ic">${it.ic}</span><span>${it.label}</span>${it.sub?`<span class="pi-sub">${it.sub}</span>`:''}
    </div>`).join('');
}
function paletteHighlight(){
  document.querySelectorAll('.palette-item').forEach((el,i)=>el.classList.toggle('sel', i===paletteSel));
  document.querySelector('.palette-item.sel')?.scrollIntoView({block:'nearest'});
}
function paletteRun(i){
  const it = paletteMatches[i]; if (!it) return;
  closePalette();
  it.run();
}
function paletteKeyNav(e){
  if (e.key==='ArrowDown'){ e.preventDefault(); paletteSel=Math.min(paletteSel+1, paletteMatches.length-1); paletteHighlight(); }
  else if (e.key==='ArrowUp'){ e.preventDefault(); paletteSel=Math.max(paletteSel-1, 0); paletteHighlight(); }
  else if (e.key==='Enter'){ e.preventDefault(); paletteRun(paletteSel); }
  else if (e.key==='Escape'){ closePalette(); }
}

