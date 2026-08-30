/* ── YCDSB SECONDARY SCHOOL CALENDAR 2026-27 ──────────────────────
   Sourced from the official York Catholic District School Board
   2026-2027 School Year Calendar. Secondary-relevant entries only
   (PA days marked "S" or "E/S", mandatory school-closure ranges).
   Runs idempotently on every boot so it applies to existing workspaces too. ── */
function seedYCDSBCalendar() {
  if (!DB.calendar) DB.calendar = buildDefaultCalendar();
  if (!DB.calendar.cals.find(c=>c.id==='ycdsb')) {
    DB.calendar.cals.push({ id:'ycdsb', name:'St. Robert CHS / YCDSB', color:'#0F6B30', desc:'Official board PA days, breaks & exam windows', visible:true });
  }
  const mk = (id, title, startDate, endDate, desc, allDay=true) => ({
    id, title, allDay, startDate, endDate: endDate||startDate,
    startTime:'', endTime:'', repeat:'none', repeatEnd:'',
    location:'St. Robert Catholic High School', description:desc||'',
    calId:'ycdsb', color:'#0F6B30', notif:'none', status:'free',
    visibility:'public', created:new Date().toISOString()
  });
  const events = [
    mk('ycdsb-padays-1', '📌 PA Day — No School', '2026-09-02', '2026-09-03', 'Secondary/Elementary PA Days (start of year)'),
    mk('ycdsb-firstday', '🎒 First Day of School', '2026-09-08', null, ''),
    mk('ycdsb-pa-nov20', '📌 PA Day — No School', '2026-11-20', null, 'Elementary/Secondary PA Day'),
    mk('ycdsb-winterbreak', '❄️ Winter Break — No School', '2026-12-21', '2027-01-01', 'Christmas Break'),
    mk('ycdsb-sem1exams', '📝 Semester 1 Exam Period', '2027-01-04', '2027-01-08', 'Approximate window — confirm your exact exam schedule with your school'),
    mk('ycdsb-pa-feb2', '📌 PA Day — No School', '2027-02-02', null, 'Secondary PA Day'),
    mk('ycdsb-marchbreak', '🌷 March Break — No School', '2027-03-15', '2027-03-19', ''),
    mk('ycdsb-pa-may3', '📌 PA Day — No School', '2027-05-03', null, 'Secondary PA Day'),
    mk('ycdsb-sem2exams', '📝 Semester 2 Exam Period', '2027-06-07', '2027-06-16', 'Approximate window (incl. Exam Review Day) — confirm your exact exam schedule with your school'),
    mk('ycdsb-pa-jun29', '📌 PA Day — No School', '2027-06-29', '2027-06-30', 'Secondary / Elementary+Secondary PA Days (end of year)'),
  ];
  let added = 0;
  events.forEach(ev => {
    if (!DB.calendar.events.find(e=>e.id===ev.id)) { DB.calendar.events.push(ev); added++; }
  });
  if (added) save();
}

function getEaster(y) {
  // Anonymous Gregorian algorithm
  const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,
        f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,
        i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,
        m=Math.floor((a+11*h+22*l)/451),
        month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
  return new Date(y,month-1,day);
}

function loadDB() {
  let db;
  try { const r = localStorage.getItem(KEY); if (r) db = JSON.parse(r); } catch(e) {}
  if (!db) db = {
    p:{name:'',grade:'Grade 11',sem:'Semester 2',school:'',tpl:'blank',
       theme:'forest',font:'outfit',avatar:'🎓',avatarImg:'',setup:false,sbW:260,btnStyle:'default',docStyle:'white'},
    courses:[], hw:[], notes:[], tt:{},
    slots:[...DEF_SLOTS], grades:[], dp:{}, streak:[], folders:[], checklist:[], exams:[],
    goals:[], planner:[], notifs:[], archives:{}
  };
  // Always ensure calendar exists with proper structure
  if (!db.calendar || !db.calendar.cals || !db.calendar.events) {
    db.calendar = buildDefaultCalendar();
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch(e) {}
  }
  // Migrate older saves that predate goals / planner / notification center / semester archives
  if (!db.goals) db.goals = [];
  if (!db.planner) db.planner = [];
  if (!db.notifs) db.notifs = [];
  if (!db.archives) db.archives = {};
  return db;
}

