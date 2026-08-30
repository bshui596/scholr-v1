/* ═══════════════════════════════════════════════════
   CAS TRACKER (Creativity, Activity, Service)
═══════════════════════════════════════════════════ */
if (!DB.cas) DB.cas = [];
function casNew(){
  ['cas-id','cas-title','cas-hours','cas-refl'].forEach(f=>{ if(g(f)) g(f).value=''; });
  if (g('cas-strand')) g('cas-strand').value='C';
  if (g('cas-date')) g('cas-date').value=new Date().toISOString().slice(0,10);
  showMo('mo-cas');
}
function casSave(){
  if (!DB.cas) DB.cas = [];
  const title = g('cas-title').value.trim();
  if (!title) { toast('Add a title'); return; }
  const id = g('cas-id').value || 'cas'+Date.now();
  const entry = { id, title, strand:g('cas-strand').value, date:g('cas-date').value||new Date().toISOString().slice(0,10),
    hours: parseFloat(g('cas-hours').value)||0, refl:g('cas-refl').value.trim() };
  const idx = DB.cas.findIndex(e=>e.id===id);
  if (idx>=0) DB.cas[idx]=entry; else DB.cas.unshift(entry);
  save(); closeMo('mo-cas'); casRender();
  ['cas-id','cas-title','cas-hours','cas-refl'].forEach(f=>{ if(g(f)) g(f).value=''; });
  toast('CAS experience logged!');
}
function casEdit(id){
  const e = DB.cas.find(x=>x.id===id); if (!e) return;
  g('cas-id').value=e.id; g('cas-title').value=e.title; g('cas-strand').value=e.strand;
  g('cas-date').value=e.date; g('cas-hours').value=e.hours||''; g('cas-refl').value=e.refl||'';
  showMo('mo-cas');
}
function casDelete(id){ if(!confirm('Delete this CAS entry?')) return; DB.cas=DB.cas.filter(e=>e.id!==id); save(); casRender(); }
function casRender(){
  if (!DB.cas) DB.cas = [];
  const strandInfo = {C:{ic:'🎨',lbl:'Creativity',col:'#C05418'}, A:{ic:'🏃',lbl:'Activity',col:'#1750A8'}, S:{ic:'🤝',lbl:'Service',col:'#0F6B30'}};
  ['C','A','S'].forEach(s=>{
    const ct = DB.cas.filter(e=>e.strand===s).length;
    setText('cas-'+s.toLowerCase()+'-ct', ct);
  });
  const list = g('cas-list'); if (!list) return;
  if (!DB.cas.length) { list.innerHTML = '<div class="card" style="padding:24px;text-align:center;color:var(--ink4);font-size:12.5px">No CAS experiences logged yet — click "+ Log CAS experience" to add your first one.</div>'; return; }
  list.innerHTML = DB.cas.map(e=>{
    const si = strandInfo[e.strand]||strandInfo.C;
    return `<div class="card" style="padding:14px 16px;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;background:${si.col}18;color:${si.col}">${si.ic} ${si.lbl}</span>
        <strong style="font-size:13.5px;flex:1">${e.title}</strong>
        <span style="font-size:11px;color:var(--ink4)">${e.date}${e.hours?' · '+e.hours+'h':''}</span>
        <button onclick="casEdit('${e.id}')" style="background:none;border:none;color:var(--ink4);cursor:pointer;font-size:12px">✎</button>
        <button onclick="casDelete('${e.id}')" style="background:none;border:none;color:var(--ink4);cursor:pointer;font-size:12px">✕</button>
      </div>
      ${e.refl?`<p style="font-size:12.5px;color:var(--ink3);line-height:1.6">${e.refl}</p>`:''}
    </div>`;
  }).join('');
}

