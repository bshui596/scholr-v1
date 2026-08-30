/* ═══════════════════════════════════════════════════
   POMODORO MODULE (full)
═══════════════════════════════════════════════════ */
if (!DB.pomodoro) DB.pomodoro = { focus:25, short:5, long:15, sessions:4, auto:1, alarm:1, todayCount:0, totalMinutes:0, lastDate: '' };
if (DB.pomodoro.alarm === undefined) DB.pomodoro.alarm = 1;
let pomState = { mode:'focus', running:false, timer:null, secondsLeft: (DB.pomodoro.focus||25)*60, currentSession:1, totalSessions: DB.pomodoro.sessions||4, flipped:false, focusOpen:false };

function pomSetMode(m, btn) {
  pomStop();
  pomState.mode = m;
  document.querySelectorAll('.pom-tab-btn').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  const durations = { focus: DB.pomodoro.focus||25, short: DB.pomodoro.short||5, long: DB.pomodoro.long||15 };
  pomState.secondsLeft = durations[m] * 60;
  pomUpdateDisplay();
  const labels = { focus:'Focus Session', short:'Short Break', long:'Long Break' };
  const el = g('pom-mode-lbl'); if (el) el.textContent = labels[m];
  const fl = g('focus-mode-lbl'); if (fl) fl.textContent = labels[m];
}
function pomToggle(fromFocus) {
  if (pomState.running) pomStop(); else pomStart(fromFocus);
}
function pomStart(fromFocus) {
  pomState.running = true;
  const btn = g('pom-btn'); if (btn) btn.innerHTML = '⏸ Pause';
  const fb = g('focus-toggle'); if (fb) fb.textContent = '⏸ Pause';
  pomState.timer = setInterval(() => {
    pomState.secondsLeft--;
    pomUpdateDisplay();
    if (pomState.secondsLeft <= 0) pomComplete();
  }, 1000);
}
function pomStop() {
  pomState.running = false;
  clearInterval(pomState.timer);
  const btn = g('pom-btn'); if (btn) btn.innerHTML = '▶ Start';
  const fb = g('focus-toggle'); if (fb) fb.textContent = '▶ Start';
}
function pomReset() {
  pomStop();
  const durations = { focus: DB.pomodoro.focus||25, short: DB.pomodoro.short||5, long: DB.pomodoro.long||15 };
  pomState.secondsLeft = durations[pomState.mode] * 60;
  pomUpdateDisplay();
}
function pomSkip() {
  pomStop();
  pomComplete();
}
/* Gentle two-note chime (no harsh attack) played when a focus session or
   break ends. Built the same way as the ambient sounds above: a couple of
   oscillators with a soft volume envelope and a lowpass filter so it fades
   in/out instead of clicking on. Respects DB.pomodoro.alarm. */
function playChime() {
  if (DB.pomodoro.alarm === 0) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [659.25, 987.77]; // E5 then B5 — soft, unobtrusive interval
    notes.forEach((freq, i) => {
      const start = ctx.currentTime + i * 0.42;
      const dur = 1.1;
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 2200;
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0, start);
      g2.gain.linearRampToValueAtTime(0.16, start + 0.18); // slow fade-in, not sudden
      g2.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      o.connect(filt); filt.connect(g2); g2.connect(ctx.destination);
      o.start(start); o.stop(start + dur + 0.05);
    });
    setTimeout(() => { try { ctx.close(); } catch(e) {} }, (notes.length * 0.42 + 1.3) * 1000);
  } catch(e) { /* Web Audio not supported — silently skip, toast still shows */ }
}
function pomComplete() {
  pomStop();
  playChime();
  if (pomState.mode === 'focus') {
    const mins = DB.pomodoro.focus||25;
    DB.pomodoro.todayCount = (DB.pomodoro.todayCount||0) + 1;
    DB.pomodoro.totalMinutes = (DB.pomodoro.totalMinutes||0) + mins;
    const course = g('pom-course')?.value || '';
    DB.studyLog.push({ id:'sl'+Date.now(), ts: Date.now(), minutes: mins, course });
    if (DB.studyLog.length > 3000) DB.studyLog = DB.studyLog.slice(-3000); // keep the log from growing forever
    markStreakToday(); // a completed focus session is real study time — it belongs in the streak same as finishing homework or a flashcard review
    save();
    pomState.currentSession++;
    if (pomState.currentSession > pomState.totalSessions) pomState.currentSession = 1;
    // Auto break
    if (pomState.currentSession === 1) pomSetMode('long', null);
    else pomSetMode('short', null);
    toast('🍅 Focus session complete! Take a break.');
  } else {
    pomSetMode('focus', null);
    document.querySelector('.pom-tab-btn')?.classList.add('on');
    document.querySelectorAll('.pom-tab-btn:not(:first-child)').forEach(b=>b.classList.remove('on'));
    toast('☕ Break over! Time to focus.');
  }
  pomRenderDots();
  pomUpdateStats();
  renderStreak();
  if (DB.pomodoro.auto) setTimeout(() => pomStart(), 1500);
}
function pomUpdateDisplay() {
  const m = Math.floor(pomState.secondsLeft/60), s = pomState.secondsLeft%60;
  const txt = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  const el = g('pom-display'); if (el) el.textContent = txt;
  const fl = g('focus-display'); if (fl) fl.textContent = txt;
  const dd = g('d-pom-display'); if (dd) dd.textContent = txt;
  // Update rings
  const total = { focus: DB.pomodoro.focus||25, short: DB.pomodoro.short||5, long: DB.pomodoro.long||15 }[pomState.mode] * 60;
  const pct = pomState.secondsLeft / total;
  const circ = 603.2;
  const c = g('pom-circle'); if (c) c.setAttribute('stroke-dashoffset', circ * pct);
  const fc = g('focus-ring'); if (fc) fc.setAttribute('stroke-dashoffset', circ * pct);
  const dc = g('d-pom-circle'); if (dc) { const c2=213.6; dc.setAttribute('stroke-dashoffset', c2 * pct); }
}
function pomRenderDots() {
  const total = pomState.totalSessions;
  const html = Array.from({length:total},(_,i)=>`<div style="width:10px;height:10px;border-radius:50%;background:${i<pomState.currentSession-1?'var(--ac)':'var(--bor)'};transition:background .3s"></div>`).join('');
  const d = g('pom-dots'); if (d) d.innerHTML = html;
  const fd = g('focus-dots'); if (fd) fd.innerHTML = html;
}
function pomApplySettings() {
  DB.pomodoro.focus = +g('pom-set-focus')?.value||25;
  DB.pomodoro.short = +g('pom-set-short')?.value||5;
  DB.pomodoro.long = +g('pom-set-long')?.value||15;
  DB.pomodoro.sessions = +g('pom-set-sessions')?.value||4;
  DB.pomodoro.auto = +(g('pom-auto')?.value ?? 1);
  DB.pomodoro.alarm = +(g('pom-alarm')?.value ?? 1);
  pomState.totalSessions = DB.pomodoro.sessions;
  save(); pomReset(); pomRenderDots(); pomSyncSettingsUI();
}
/* Keeps every pomodoro-related control (on the timer page AND the settings
   page) showing whatever is actually saved in DB.pomodoro, since the two
   pages have separate inputs for the same values. */
function pomSyncSettingsUI() {
  const p = DB.pomodoro;
  setValue('pom-set-focus', p.focus); setValue('pom-set-short', p.short);
  setValue('pom-set-long', p.long); setValue('pom-set-sessions', p.sessions);
  setSel('pom-auto', p.auto ? '1' : '0'); setSel('pom-alarm', p.alarm===0 ? '0' : '1');
  setSel('st-focus', String(p.focus)); setSel('st-short', String(p.short));
  setSel('st-long', String(p.long)); setSel('st-sess', String(p.sessions));
  setSel('st-auto', p.auto ? '1' : '0'); setSel('st-alarm', p.alarm===0 ? '0' : '1');
  pomPopulateCourseSel();
}
// Lets a focus session be tagged with a course, purely so Study Overview
// (analytics) can break study time down by subject. "General" (no course)
// is a valid, first-class option — not every session is course-specific.
function pomPopulateCourseSel() {
  const sel = g('pom-course'); if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = '<option value="">General</option>' + DB.courses.map(c => `<option>${c.name}</option>`).join('');
  if (prev) setSel('pom-course', prev);
}
// One-click bridge from a homework card or exam study task straight into a
// focus session for that course — previously the only way to set the
// Pomodoro's course was to open the timer and pick it from a dropdown
// yourself, with no memory of what you were actually working on.
function pomFocusOn(course) {
  go('pomodoro');
  setTimeout(() => {
    pomPopulateCourseSel();
    if (course) setSel('pom-course', course);
    toast(`🍅 Focus session ready for ${course || 'General'} — press Start when you're set.`);
  }, 30);
}
function pomUpdateStats() {
  const tc = g('pom-today-count'); if (tc) tc.textContent = DB.pomodoro.todayCount||0;
  const tt = g('pom-total-time');
  if (tt) { const m=DB.pomodoro.totalMinutes||0; tt.textContent = `${Math.floor(m/60)}h ${m%60}m`; }
  const ds = g('d-pom-status'); if (ds) ds.textContent = pomState.running ? '🔴 Running...' : (DB.pomodoro.todayCount ? `${DB.pomodoro.todayCount} sessions today` : 'Ready to focus');
}

