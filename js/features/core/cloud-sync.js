/* ── SEMESTER / GRADE SWITCHING ──────────────────────────────
   Courses, notes, homework, grades, etc. all live "per semester".
   Switching Grade or Semester in Settings archives the current
   working set under DB.archives[grade__sem] and either restores a
   previously-archived snapshot for the target grade/semester, or
   starts that semester fresh — so you can always come back and
   check earlier work. ── */
const SEM_KEYS = ['courses','hw','notes','folders','tt','slots','grades','dp','streak','checklist','exams','goals','planner','notifs'];
function semKey(grade, sem){ return grade + '__' + sem; }
function emptySemData(){
  return { courses:[], hw:[], notes:[], folders:[], tt:{}, slots:[...DEF_SLOTS],
    grades:[], dp:{}, streak:[], checklist:[], exams:[], goals:[], planner:[], notifs:[] };
}
function snapshotSemData(){
  const def = emptySemData(), snap = {};
  SEM_KEYS.forEach(k => { snap[k] = JSON.parse(JSON.stringify(DB[k] !== undefined ? DB[k] : def[k])); });
  return snap;
}
function applySemData(data){
  const def = emptySemData();
  SEM_KEYS.forEach(k => { DB[k] = (data && data[k] !== undefined) ? data[k] : def[k]; });
}
/* Archives the currently-active grade/sem (if different from the target),
   then loads the target's archived snapshot if one exists, else a blank one. */
function archiveAndSwitchSemester(newGrade, newSem){
  const oldKey = semKey(DB.p.grade, DB.p.sem), newKey = semKey(newGrade, newSem);
  if (oldKey !== newKey) {
    if (!DB.archives) DB.archives = {};
    DB.archives[oldKey] = { grade: DB.p.grade, sem: DB.p.sem, savedAt: new Date().toISOString(), data: snapshotSemData() };
    const existing = DB.archives[newKey];
    applySemData(existing ? existing.data : emptySemData());
    delete DB.archives[newKey]; // now active, not archived
  }
  DB.p.grade = newGrade;
  DB.p.sem = newSem;
}
function renderSemArchives(){
  const el = g('sem-archive-list'); if (!el) return;
  const arch = DB.archives || {};
  const keys = Object.keys(arch).sort((a,b) => new Date(arch[b].savedAt) - new Date(arch[a].savedAt));
  if (!keys.length) { el.innerHTML = '<div style="font-size:12px;color:var(--ink4)">No archived semesters yet — switch your Grade or Semester above and past work will show up here.</div>'; return; }
  el.innerHTML = keys.map(k => {
    const a = arch[k], d = a.data || {};
    const cCount = (d.courses||[]).length, nCount = (d.notes||[]).length, hCount = (d.hw||[]).length;
    return `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border:1px solid var(--bor);border-radius:8px;margin-bottom:7px;background:var(--s2)">
      <div>
        <div style="font-weight:600;font-size:13px">${a.grade} · ${a.sem}</div>
        <div style="font-size:11px;color:var(--ink4)">${cCount} course${cCount===1?'':'s'} · ${nCount} note${nCount===1?'':'s'} · ${hCount} homework · saved ${new Date(a.savedAt).toLocaleDateString()}</div>
      </div>
      <button class="btn bg sm" onclick="switchToArchivedSemester('${k}')">Open</button>
    </div>`;
  }).join('');
}
function switchToArchivedSemester(key){
  const a = (DB.archives||{})[key]; if (!a) return;
  showConfirm(
    `Open ${a.grade} · ${a.sem}? Your current ${DB.p.grade} · ${DB.p.sem} work will be saved first, and you can switch back to it anytime.`,
    () => { archiveAndSwitchSemester(a.grade, a.sem); save(); renderAll(); toast(`Now viewing ${a.grade} · ${a.sem}`); },
    'Open'
  );
}

