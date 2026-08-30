/* ═══════════════════════════════════════════════════
   IB DIPLOMA POINTS CALCULATOR
═══════════════════════════════════════════════════ */
if (!DB.ib) DB.ib = { subjects: [] };
const IB_PCT_BANDS = [[90,100,7],[80,89,6],[70,79,5],[60,69,4],[50,59,3],[40,49,2],[0,39,1]];
function ibPctConvert(){
  const v = parseFloat(g('ib-pct-inp')?.value);
  const res = g('ib-pct-result');
  if (isNaN(v)) { res.textContent=''; return; }
  const band = IB_PCT_BANDS.find(([lo,hi])=>v>=lo && v<=hi);
  res.textContent = band ? `≈ IB ${band[2]}` : '';
  ibRenderPctTable(band?band[2]:null);
}
function ibRenderPctTable(highlight){
  const el = g('ib-pct-table'); if (!el) return;
  el.innerHTML = IB_PCT_BANDS.slice().reverse().map(([lo,hi,grade])=>
    `<div style="padding:6px 2px;border-radius:6px;background:${grade===highlight?'var(--acll)':'var(--s2)'};border:1px solid ${grade===highlight?'var(--acl)':'var(--bor)'}">
      <div style="font-weight:800;color:${grade===highlight?'var(--ac)':'var(--ink)'}">${grade}</div>
      <div style="color:var(--ink4);font-size:9.5px">${lo}-${hi}%</div>
    </div>`).join('');
}
function ibRenderSubjects() {
  ibRenderPctTable(null);
  if (!DB.ib) DB.ib = { subjects: [] };
  if (!DB.ib.subjects.length) {
    // Seed from courses (up to 6), preferring ones tagged HL/SL
    const src = DB.courses.filter(c=>c.level==='HL'||c.level==='SL').slice(0,6);
    const pick = src.length ? src : DB.courses.slice(0,6);
    DB.ib.subjects = pick.map(c=>({name:c.name, level:c.level||'SL', grade:''}));
    while (DB.ib.subjects.length < 6) DB.ib.subjects.push({name:'', level:'SL', grade:''});
  }
  const el = g('ib-subjects'); if (!el) return;
  el.innerHTML = DB.ib.subjects.map((s,i)=>`
    <div style="display:grid;grid-template-columns:2fr 90px 80px 30px;gap:8px;margin-bottom:8px;align-items:center">
      <input class="fi" value="${s.name||''}" placeholder="Subject name" oninput="ibUpdate(${i},'name',this.value)" style="font-size:12.5px;padding:7px 10px"/>
      <select class="fsel" onchange="ibUpdate(${i},'level',this.value)" style="font-size:12px;padding:7px 6px"><option${s.level==='HL'?' selected':''}>HL</option><option${s.level==='SL'?' selected':''}>SL</option></select>
      <select class="fsel" onchange="ibUpdate(${i},'grade',this.value)" style="font-size:12px;padding:7px 6px"><option value="">—</option>${[7,6,5,4,3,2,1].map(g=>`<option${String(s.grade)===String(g)?' selected':''}>${g}</option>`).join('')}</select>
      <button onclick="ibRemove(${i})" style="background:none;border:none;color:var(--ink4);cursor:pointer;font-size:14px" aria-label="Remove subject">✕</button>
    </div>`).join('');
  ibCalc();
}
function ibUpdate(i,f,v){ DB.ib.subjects[i][f]=v; save(); ibCalc(); }
function ibRemove(i){ DB.ib.subjects.splice(i,1); save(); ibRenderSubjects(); }
function ibAddSubjectRow(){ DB.ib.subjects.push({name:'',level:'SL',grade:''}); save(); ibRenderSubjects(); }
// Standard IB TOK/EE bonus matrix (rows = EE grade, cols = TOK grade). null = failing condition, no diploma.
const IB_MATRIX = {
  A:{A:3,B:3,C:2,D:2,E:null}, B:{A:3,B:2,C:2,D:1,E:null}, C:{A:2,B:2,C:1,D:0,E:null},
  D:{A:2,B:1,C:0,D:0,E:null}, E:{A:null,B:null,C:null,D:null,E:null}
};
function ibCalc(){
  const subjTotal = (DB.ib.subjects||[]).reduce((sum,s)=>sum + (parseInt(s.grade)||0), 0);
  const tok = g('ib-tok')?.value, ee = g('ib-ee')?.value;
  let bonus = 0, note = 'Select TOK and EE grades to calculate bonus points.', failing = false;
  if (tok && ee) {
    const b = IB_MATRIX[ee]?.[tok];
    if (b === null) { failing = true; bonus = 0; note = '⚠️ This TOK/EE combination is a failing condition under IB rules — 0 bonus points, and it may affect diploma award regardless of subject score.'; }
    else { bonus = b; note = `${bonus} bonus point${bonus===1?'':'s'} from this TOK (${tok}) / EE (${ee}) combination.`; }
  }
  const total = subjTotal + bonus;
  setText('ib-total', `${total} / 45`);
  const noteEl = g('ib-bonus-note'); if (noteEl) noteEl.textContent = note;
  const statusEl = g('ib-status');
  if (statusEl) {
    if (failing) statusEl.textContent = 'Failing condition flagged — see note below';
    else if (total >= 24) statusEl.textContent = `Above the 24-point minimum threshold ✓ (subject to no other failing conditions)`;
    else statusEl.textContent = `Below the typical 24-point minimum — keep working!`;
  }
}

