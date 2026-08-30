/* ═══════════════════════════════════════════════════
   MOTIVATIONAL QUOTES
═══════════════════════════════════════════════════ */
const QUOTES = [
  {t:'Math is 90% believing you copied the formula down correctly and 10% finding out you didn\'t.',a:'Brian Shui'},
  {t:'I don\'t skip steps in a proof, I just believe in the reader.',a:'Brian Shui'},
  {t:'Pi is a rational number rounded to an unreasonable number of decimal places.',a:'Brian Shui'},
  {t:'There are 10 kinds of people: those who understand binary, and my Calculus teacher.',a:'Brian Shui'},
  {t:'The derivative of my sleep schedule during exam week is undefined.',a:'Brian Shui'},
  {t:'I asked my math teacher if I\'d ever use this in real life. She said "no, but you\'ll use the studying."',a:'Brian Shui'},
  {t:'Every unsolved problem is just a solved problem that hasn\'t met me yet. Some are still waiting.',a:'Brian Shui'},
  {t:'A wise man once divided by zero. We don\'t talk about him.',a:'Brian Shui'},
  {t:'The four stages of a math test: confidence, confusion, acceptance, blaming the pencil.',a:'Brian Shui'},
  {t:'I don\'t procrastinate, I just let deadlines build suspense.',a:'Brian Shui'},
  {t:'CAS hours are just Creativity, Activity, and Searching for the submission deadline at 11:58pm.',a:'Brian Shui'},
  {t:'TOK taught me that knowledge is uncertain, but my WiFi disconnecting during an exam is not.',a:'Brian Shui'},
  {t:'My GPA and I have a complicated relationship. Mostly I complicate it.',a:'Brian Shui'},
  {t:'I don\'t need a calculator, I need a time machine to start my IA earlier.',a:'Brian Shui'},
  {t:'Coffee: because pulling an all-nighter for an Extended Essay shouldn\'t also require an extended nap.',a:'Brian Shui'},
];
function renderDashboardQuote() {
  const q = QUOTES[new Date().getDate() % QUOTES.length];
  const tEl = g('d-quote-text'), aEl = g('d-quote-auth');
  if (tEl) tEl.textContent = '"' + q.t + '"';
  if (aEl) aEl.textContent = '— ' + q.a;
}

/* New pages wired into existing go() below */
Object.assign(PG, { gpa:'GPA Calculator', flashcards:'Flashcards', pomodoro:'Pomodoro', converter:'Unit Converter', guide:'Getting Started Guide', ibpoints:'IB Diploma Points', cas:'CAS Tracker', admin:'Admin', embeds:'Math Tools' });
function embedSwitch(which){
  const urls = { desmos:'https://www.desmos.com/calculator', gcal:'https://calendar.google.com/calendar/embed?mode=WEEK', quizlet:'https://quizlet.com/', geogebra:'https://www.geogebra.org/graphing' };
  const btn = g('embed-btn-'+which);
  document.querySelectorAll('#pg-embeds .btn').forEach(b=>{ if (b.id && b.id.startsWith('embed-btn-')) { b.classList.remove('bp'); b.classList.add('bo'); } });
  if (btn) { btn.classList.remove('bo'); btn.classList.add('bp'); }
  const frame = g('embed-frame'), fallback = g('embed-fallback');
  if (fallback) fallback.style.display = 'none';
  if (frame) {
    frame.style.display = 'block';
    frame.onload = function(){ if (fallback) fallback.style.display = 'none'; };
    frame.src = urls[which] || 'https://www.desmos.com/calculator';
  }
}

document.addEventListener('click', e => {
  const pop = g('cal-popover');
  if (pop && pop.style.display==='block' && !pop.contains(e.target) && !e.target.closest('.cal-ev-chip') && !e.target.closest('.cal-week-event') && !e.target.closest('.cal-agenda-ev')) {
    pop.style.display='none';
  }
});

(function init() {
  // Apply saved theme/font immediately (before any interaction)
  applyTheme(DB.p.theme || 'forest');
  applyFont(DB.p.font || 'outfit');

  if (DB.p.setup) {
    // Returning user — skip onboarding
    g('ob').style.display = 'none';
    g('app').style.display = 'flex';
    boot();
    setTimeout(checkBackupReminder, 1200);
  } else {
    // New user — pre-populate onboarding courses with the IB preset
    document.addEventListener('DOMContentLoaded', () => {
      obLoadPreset('IB');
    });
  }

  // Non-blocking cloud hydrate: local copy renders instantly above; if a
  // newer copy exists in cloud storage (e.g. edited on another device),
  // swap it in and re-render once it arrives.
  (async () => {
    const hydrated = await cloudLoadInto(DB);
    if (hydrated && hydrated._syncedAt && hydrated._syncedAt > (DB._syncedAt || 0)) {
      DB = hydrated;
      try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch(e) {}
      if (DB.p.setup) {
        applyTheme(DB.p.theme || 'forest');
        applyFont(DB.p.font || 'outfit');
        renderAll();
        toast('☁️ Synced latest changes from another device');
      }
    }
  })();

  document.addEventListener('selectionchange', ()=>{ if(noteId) trackFmtState(); });
  // Global keyboard shortcuts
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey||e.metaKey) && e.key==='s') {
      e.preventDefault();
      if (noteId) { saveNote(); toast('💾 Saved!'); }
    }
    if ((e.ctrlKey||e.metaKey) && e.key==='k') {
      e.preventDefault();
      openPalette('');
    }
    if (e.key==='Escape') {
      document.querySelectorAll('.mo.on').forEach(m => m.classList.remove('on'));
      closePalette();
      closeLayoutMenu();
      closeInsMenus();
    }
  });
})();
