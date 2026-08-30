/* ═══════════════════════════════════════════════════
   GPA CALCULATOR
═══════════════════════════════════════════════════ */
if (!DB.gpa) DB.gpa = { rows: [] };

const GPA_SCALE_40 = {
  'A+':4.0,'A':4.0,'A-':3.7,'B+':3.3,'B':3.0,'B-':2.7,
  'C+':2.3,'C':2.0,'C-':1.7,'D+':1.3,'D':1.0,'D-':0.7,'F':0.0
};
const GPA_PCT_TO_LETTER = p => p>=90?'A+':p>=85?'A':p>=80?'A-':p>=77?'B+':p>=73?'B':p>=70?'B-':p>=67?'C+':p>=63?'C':p>=60?'C-':p>=57?'D+':p>=53?'D':p>=50?'D-':'F';

function gpaAddRow(course) {
  if (!DB.gpa.rows) DB.gpa.rows = [];
  DB.gpa.rows.push(course || { name:'', grade:'A', credits:3, type:'Regular' });
  save(); renderGPA();
}
// The GPA Calculator was entirely manual entry — course name, letter grade,
// credits — completely disconnected from the marks already sitting in Grade
// Book, so a real average had to be re-typed as a guessed letter grade.
// This pulls current course averages straight in using the same
// percentage→letter mapping the GPA scale reference already displays.
function gpaImportFromGradebook() {
  const withMarks = DB.courses.filter(c => courseAvg(c.name) !== null);
  if (!withMarks.length) { toast('No graded courses yet — log marks in Grade Book first!'); return; }
  if (!DB.gpa) DB.gpa = { rows: [] };
  if (!DB.gpa.rows) DB.gpa.rows = [];
  let added = 0, updated = 0;
  withMarks.forEach(c => {
    const letter = GPA_PCT_TO_LETTER(courseAvg(c.name));
    const existing = DB.gpa.rows.find(r => r.name === c.name);
    if (existing) { existing.grade = letter; updated++; }
    else { DB.gpa.rows.push({ name: c.name, grade: letter, credits: 3, type: 'Regular' }); added++; }
  });
  save(); renderGPA();
  toast(`⇩ Imported ${added} course${added===1?'':'s'}${updated?`, updated ${updated}`:''} from Gradebook`);
}
function gpaRemoveRow(i) {
  DB.gpa.rows.splice(i,1); save(); renderGPA();
}
function gpaUpdateRow(i, field, val) {
  if (!DB.gpa.rows[i]) return;
  DB.gpa.rows[i][field] = val;
  save(); calcGPA();
}
function renderGPA() {
  const el = g('gpa-rows'); if (!el) return;
  if (!DB.gpa.rows || !DB.gpa.rows.length) {
    el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--ink4);font-size:13px">No courses added yet. Click "+ Add Course" to start.</div>';
    calcGPA(); return;
  }
  el.innerHTML = DB.gpa.rows.map((r,i) => `
    <div class="gpa-row">
      <input class="fi" value="${r.name||''}" placeholder="Course name" oninput="gpaUpdateRow(${i},'name',this.value)" style="font-size:12px;padding:6px 10px"/>
      <select class="fsel" onchange="gpaUpdateRow(${i},'grade',this.value)" style="font-size:12px;padding:6px 8px">
        ${['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F'].map(g=>`<option${r.grade===g?' selected':''}>${g}</option>`).join('')}
      </select>
      <input class="fi" type="number" value="${r.credits||3}" min="0.5" max="6" step="0.5" oninput="gpaUpdateRow(${i},'credits',+this.value)" style="font-size:12px;padding:6px 10px"/>
      <select class="fsel" onchange="gpaUpdateRow(${i},'type',this.value)" style="font-size:12px;padding:6px 8px">
        ${['Regular','Honors','AP/IB'].map(t=>`<option${r.type===t?' selected':''}>${t}</option>`).join('')}
      </select>
      <div style="font-size:12px;font-weight:700;color:var(--ac);display:flex;align-items:center">${gpaPoints(r).toFixed(1)}</div>
      <button onclick="gpaRemoveRow(${i})" style="background:none;border:none;color:var(--ink4);cursor:pointer;font-size:14px;border-radius:6px;padding:4px" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--ink4)'">✕</button>
    </div>`).join('');
  calcGPA();
}
function gpaPoints(r) {
  const base = GPA_SCALE_40[r.grade] || 0;
  const bonus = r.type === 'Honors' ? 0.5 : r.type === 'AP/IB' ? 1.0 : 0;
  return Math.min(4.3, base + bonus);
}
function calcGPA() {
  if (!DB.gpa.rows || !DB.gpa.rows.length) { ['gpa-val','gpa-w-val','gpa-rank'].forEach(id => { const e=g(id); if(e) e.textContent='—'; }); renderGPAScaleRef(); return; }
  let totalPts=0, totalWPts=0, totalCreds=0;
  DB.gpa.rows.forEach(r => {
    const base = GPA_SCALE_40[r.grade]||0;
    const w = gpaPoints(r);
    const c = +r.credits||0;
    totalPts += base * c; totalWPts += w * c; totalCreds += c;
  });
  const gpa = totalCreds ? (totalPts/totalCreds).toFixed(2) : '—';
  const wgpa = totalCreds ? (totalWPts/totalCreds).toFixed(2) : '—';
  const letter = gpa !== '—' ? (gpa>=3.7?'A+':gpa>=3.3?'A':gpa>=3.0?'A-':gpa>=2.7?'B+':gpa>=2.3?'B':gpa>=2.0?'B-':gpa>=1.7?'C+':gpa>=1.3?'C':gpa>=1.0?'C-':'D') : '—';
  const gv=g('gpa-val'),wv=g('gpa-w-val'),rv=g('gpa-rank');
  if(gv) gv.textContent=gpa; if(wv) wv.textContent=wgpa; if(rv) rv.textContent=letter;
  renderGPAScaleRef();
}
function renderGPAScaleRef() {
  const el = g('gpa-scale-ref'); if (!el) return;
  const scale = [['A+','90-100','4.0'],['A','85-89','4.0'],['A-','80-84','3.7'],['B+','77-79','3.3'],['B','73-76','3.0'],['B-','70-72','2.7'],['C+','67-69','2.3'],['C','63-66','2.0'],['D','50-59','1.0'],['F','<50','0.0']];
  el.innerHTML = scale.map(([l,r,p])=>`<div class="gpa-scale-badge"><strong>${l}</strong><div style="font-size:9px;color:var(--ink4)">${r}% · ${p}</div></div>`).join('');
}

