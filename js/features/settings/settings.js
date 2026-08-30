/* ── COURSES ── */
function renderSbCourses() {
  const c = g('sb-cr'); c.innerHTML = '';
  if (!DB.courses.length) { c.innerHTML='<div style="padding:4px 10px;font-size:11px;color:var(--ink4)">No courses</div>'; return; }
  DB.courses.forEach(cr => {
    const d = document.createElement('div');
    d.className = 'sb-a';
    d.innerHTML = `<span class="sb-cdot" style="background:${cr.color}"></span><span>${cr.name}</span>`;
    d.onclick = () => { nlFilterCourse(cr.name); go('notes'); };
    c.appendChild(d);
  });
}
function addCRow(list, name='', color='', level='') {
  const i = list.children.length, col = color || PAL[i % PAL.length];
  const row = document.createElement('div'); row.className = 'cb-row';
  row.innerHTML = `<div class="cdot" style="background:${col}"><input type="color" value="${col}" oninput="this.parentElement.style.background=this.value"/></div><input class="cb-inp" value="${name}" placeholder="Course name" autocomplete="off"/><select class="cb-lvl" title="IB level" style="border:1px solid var(--bor);border-radius:6px;font-size:11px;padding:4px 3px;background:var(--sur);color:var(--ink3)"><option value=""${!level?' selected':''}>—</option><option value="HL"${level==='HL'?' selected':''}>HL</option><option value="SL"${level==='SL'?' selected':''}>SL</option><option value="Core"${level==='Core'?' selected':''}>Core</option></select><button class="cb-x" onclick="this.parentElement.remove()">✕</button>`;
  list.appendChild(row);
}
function saveCourses() {
  DB.courses = [];
  document.querySelectorAll('#s-cr .cb-row').forEach(r => {
    const n = r.querySelector('.cb-inp').value.trim(), c = r.querySelector('input[type=color]').value;
    const lvl = r.querySelector('.cb-lvl')?.value || '';
    if (n) DB.courses.push({name:n, color:c, level:lvl});
  });
  save(); renderAll(); toast('Courses saved!');
}

