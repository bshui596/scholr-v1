/* ── BOOT (runs when app opens) ── */
function boot() {
  const p = DB.p;
  applyTheme(p.theme || 'forest');
  applyFont(p.font || 'outfit');
  applyEditorPrefs();
  applyNoteDefaults();
  sbW = p.sbW || 260;
  document.documentElement.style.setProperty('--sw', sbW+'px');
  g('sb').style.width = sbW + 'px';
  if (p.density) setDensity(p.density, true);
  if (p.th) document.documentElement.style.setProperty('--th', p.th);
  if (p.rad) document.documentElement.style.setProperty('--rad', p.rad);
  applySavedSidebarStyle();
  renderAll();
  initSbDrag();
  initNlDrag();
  checkDueReminders();
  renderLayoutSwatches();
  seedYCDSBCalendar();
}

function renderAll() {
  renderSidebarNav();
  renderProfile();
  renderSbCourses();
  renderDashboard();
  renderDashboardQuote();
  renderHW();
  renderNotesList();
  renderDrive();
  renderTT();
  renderDayPlan();
  renderChecklist();
  renderGrades();
  renderGoals();
  renderPlanner();
  renderRubric();
  renderSettings();
  populateSels();
  updateBadge();
  renderNotifCenter();
  pomRenderDots();
  pomUpdateDisplay();
  pomUpdateStats();
}

