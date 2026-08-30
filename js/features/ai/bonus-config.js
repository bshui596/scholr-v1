const BONUS_CODES = {
  'SCHOLR-ADMIN':      { flag: 'admin',       label: '🛠️ Admin Panel (full access)' },
  'STR-TOOLS-EXTRA':  { flag: 'toolsExtra',  label: '🧰 3 extra AI tabs: Translate, Brainstorm, Citation' },
  'STR-FOCUS-TIMER':  { flag: 'focus',       label: '⏱️ Pomodoro focus timer widget' },
  'STR-STREAK-DAYS':  { flag: 'streak',      label: '🔥 Daily streak tracker' },
  'STR-AUTO-SPEAK':   { flag: 'autospeak',   label: '🔊 Auto-read AI replies aloud' },
  'STR-QUICK-EXPORT': { flag: 'quickexport', label: '📦 One-click export all your data' },
  'STR-QUICK-NAV':    { flag: 'quicknav',    label: '🧭 Quick-jump nav (press any page instantly)' },
  'STR-TASK-SORT':    { flag: 'tasksort',    label: '📊 Smart homework sort (auto priority by due date)' },
  'STR-NOTE-PIN':     { flag: 'notepin',     label: '📌 Pin important notes to the top' },
};

// STR2030 is the default code — auto-applied for everyone, not shown as a redeemable entry.
const BONUS_STARTER_FLAGS = ['toolsExtra','focus','streak','autospeak','quickexport','quicknav','tasksort','notepin'];

function bonusGetUnlocked(){
  try { return JSON.parse(localStorage.getItem('scholr_bonus_flags') || '{}'); }
  catch (_) { return {}; }
}
function bonusSetUnlocked(flags){
  localStorage.setItem('scholr_bonus_flags', JSON.stringify(flags));
}

