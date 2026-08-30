/* ── ONBOARDING ── */
function oRender() {
  document.querySelectorAll('.ob-step').forEach((s,i) => s.classList.toggle('on', i===obStep));
  document.querySelectorAll('#ob-prog .ob-dot').forEach((d,i) => d.classList.toggle('on', i<=obStep));
}
function oN() {
  if (obStep === 1) {
    const n = g('ob-name').value.trim();
    if (!n) { toast('Enter your name first!'); return; }
  }
  obStep = Math.min(4, obStep + 1);
  oRender();
}
function oB() { obStep = Math.max(0, obStep - 1); oRender(); }

function obPickTpl(el) {
  document.querySelectorAll('#ob-tpl-g .tpl-c').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  obTpl = el.dataset.t;
}
// Wire tpl clicks
document.querySelectorAll('#ob-tpl-g .tpl-c').forEach(c => c.addEventListener('click', () => obPickTpl(c)));

function obLoadPreset(track) {
  const list = g('ob-cr'); list.innerHTML = '';
  const ib = [
    ['English A: Lang & Lit', '#6D28D9', 'HL'], ['Mathematics: AA', '#1D4ED8', 'SL'],
    ['Biology', '#0F6B30', 'HL'], ['Chemistry', '#0C706A', 'SL'],
    ['History', '#C05418', 'HL'], ['French B', '#B5185B', 'SL'],
    ['Theory of Knowledge', '#8A5000', 'Core'], ['CAS', '#901818', 'Core']
  ];
  const mainstream = [
    ['English', '#6D28D9', ''], ['Advanced Functions', '#1D4ED8', ''],
    ['Biology', '#0F6B30', ''], ['Chemistry', '#0C706A', ''],
    ['Canadian History', '#C05418', ''], ['French', '#B5185B', ''],
    ['Physical Education', '#901818', ''], ['Careers/Civics', '#8A5000', '']
  ];
  (track==='IB'?ib:mainstream).forEach(([n,c,lvl])=>obAddC(n,c,lvl));
  if (g('ob-program')) g('ob-program').value = track;
  toast((track==='IB'?'IB':'Mainstream')+' course list loaded — edit freely below');
}
function obAddC(name='', color='', level='') {
  const list = g('ob-cr'), i = list.children.length;
  const col = color || PAL[i % PAL.length];
  const row = document.createElement('div');
  row.className = 'cb-row';
  row.innerHTML = `<div class="cdot" style="background:${col}"><input type="color" value="${col}" oninput="this.parentElement.style.background=this.value"/></div><input class="cb-inp" value="${name}" placeholder="Course name" autocomplete="off"/><select class="cb-lvl" title="IB level" style="border:1px solid var(--bor);border-radius:6px;font-size:11px;padding:4px 3px;background:var(--sur);color:var(--ink3)"><option value=""${!level?' selected':''}>—</option><option value="HL"${level==='HL'?' selected':''}>HL</option><option value="SL"${level==='SL'?' selected':''}>SL</option><option value="Core"${level==='Core'?' selected':''}>Core</option></select><button class="cb-x" onclick="this.parentElement.remove()">✕</button>`;
  list.appendChild(row);
}
function obSaveCourses() {
  DB.courses = [];
  document.querySelectorAll('#ob-cr .cb-row').forEach(r => {
    const n = r.querySelector('.cb-inp').value.trim();
    const c = r.querySelector('input[type=color]').value;
    const lvl = r.querySelector('.cb-lvl')?.value || '';
    if (n) DB.courses.push({name:n, color:c, level:lvl});
  });
  if (!DB.courses.length) { toast('Add at least one course!'); return; }
  DB.p.program = g('ob-program')?.value || 'Mainstream';
  save(); oN();
}

function obFinish() {
  const p = DB.p;
  p.name = g('ob-name').value.trim() || 'Student';
  p.grade = g('ob-grade').value;
  p.sem = g('ob-sem').value;
  p.school = g('ob-school').value.trim();
  p.tpl = obTpl;
  p.setup = true;
  if (!DB.notes.find(n => n.id === 'welcome')) {
    DB.notes.unshift({
      id:'welcome', title:'👋 Welcome to Scholr!', sub:'Quick start guide',
      course: DB.courses[0]?.name||'General', ccolor: DB.courses[0]?.color||'#0F6B30',
      content: welcomeHTML(p.name),
      created: new Date().toISOString(), updated: new Date().toISOString()
    });
  }
  save();
  applyTheme(p.theme); applyFont(p.font);
  g('ob').style.display = 'none'; g('app').style.display = 'flex';
  boot();
}

function welcomeHTML(name) {
  return `<h2>Welcome, ${name}! 🎉</h2>
<p>Here's a quick tour of everything Scholr can do:</p>
<h3>📝 Notes editor</h3>
<ul>
<li><strong>Format bar:</strong> paragraph styles, font sizes, bold/italic/underline/strikethrough, superscript, subscript, text & highlight colours, alignment, lists, indent, undo/redo</li>
<li><strong>Insert bar:</strong> images (upload or URL), tables, 8 chart types, links, dividers, inline code, code blocks, block quotes, math, equations, date stamps, checkboxes, keyboard keys, highlights, YouTube embeds, progress bars, toggles, 2-column layouts, 7 callout types, strand tags</li>
<li><strong>12 templates</strong> — click 📋 in the notes list</li>
<li><strong>Click the course tag</strong> at top of the document to cycle courses</li>
</ul>
<div style="background:#D1FAE5;border-left:4px solid #059669;border-radius:8px;padding:10px 14px;margin:10px 0;display:flex;gap:10px"><span style="font-size:17px">💡</span><div><strong>Auto-saves every 1.5 seconds.</strong> Ctrl+S to force save.</div></div>
<div style="background:#DBEAFE;border-left:4px solid #2563EB;border-radius:8px;padding:10px 14px;margin:10px 0;display:flex;gap:10px"><span style="font-size:17px">🖱️</span><div><strong>Drag sidebar edge</strong> to resize it. <strong>Drag note list edge</strong> to resize the panel.</div></div>
<h3>📋 Homework</h3>
<p>Kanban board with course filters, strand tags, due dates, priorities. Move cards between columns.</p>
<h3>📊 Grade Book</h3>
<p>Track marks per course & category. Auto-calculates averages and letter grades.</p>
<h3>📅 Day Planner</h3>
<p>Hourly blocks + 28-day study streak calendar + quick homework checklist.</p>`;
}

