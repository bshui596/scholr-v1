/* ── DB: initialized IMMEDIATELY so onclick handlers always work ── */
let DB = loadDB();
let noteId = null, cType = 'bar', obStep = 0, obTpl = 'blank';
let hwFilt = 'all', saveTmr = null, sbW = 260, nlW = 220;
let saveQueue = false, saving = false;

function buildDefaultCalendar() {
  const cals = [
    { id:'personal', name:'Personal', color:'#0F6B30', desc:'', visible:true },
    { id:'school',   name:'School',   color:'#1D4ED8', desc:'', visible:true },
    { id:'holidays', name:'Holidays', color:'#B45309', desc:'Canadian public holidays', visible:true }
  ];

  // Canadian public holidays 2024-2034
  const CAHolidays = [];
  const addH = (y,m,d,name) => CAHolidays.push({
    id:'h'+y+m+d+name.replace(/\s/g,''),
    title:name, allDay:true,
    startDate:`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`,
    endDate:`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`,
    startTime:'', endTime:'', repeat:'none', repeatEnd:'',
    location:'Canada', description:'Canadian public holiday',
    calId:'holidays', color:'#B45309', notif:'none', status:'free',
    visibility:'public', created:new Date().toISOString()
  });

  // Helper: nth weekday of a month
  function nthDay(y, m, n, dow) { // n=1..5, dow=0=Sun..6=Sat
    let d=1, count=0;
    while(true){const dt=new Date(y,m-1,d);if(dt.getDay()===dow)count++;if(count===n)return d;d++;}
  }
  // Last weekday
  function lastDay(y, m, dow) {
    let d=new Date(y,m,0).getDate();
    while(new Date(y,m-1,d).getDay()!==dow)d--;return d;
  }
  // Nearest weekday for stat holidays
  function nearest(y,m,d) {
    const dt=new Date(y,m-1,d),day=dt.getDay();
    if(day===6)return d-1; if(day===0)return d+1; return d;
  }

  for (let y = 2024; y <= 2034; y++) {
    addH(y, 1, nearest(y,1,1),   "New Year's Day");
    // Family Day - 3rd Monday of Feb (ON/BC/AB/SK/NB)
    addH(y, 2, nthDay(y,2,3,1),  'Family Day');
    // Good Friday - varies
    const easterD = getEaster(y);
    const gf = new Date(easterD); gf.setDate(gf.getDate()-2);
    const em = new Date(easterD); em.setDate(em.getDate()+1);
    addH(y, gf.getMonth()+1, gf.getDate(), 'Good Friday');
    addH(y, em.getMonth()+1, em.getDate(), 'Easter Monday');
    // Victoria Day - last Monday before May 25
    const vicD = (function(){let d=24;while(new Date(y,4,d).getDay()!==1)d--;return d;})();
    addH(y, 5, vicD, 'Victoria Day');
    addH(y, 7, nearest(y,7,1),   'Canada Day');
    // Civic Holiday / Simcoe Day - 1st Mon of Aug
    addH(y, 8, nthDay(y,8,1,1),  'Civic Holiday');
    // Labour Day - 1st Mon of Sep
    addH(y, 9, nthDay(y,9,1,1),  'Labour Day');
    // Thanksgiving - 2nd Mon of Oct
    addH(y,10, nthDay(y,10,2,1), 'Thanksgiving');
    addH(y,11, nearest(y,11,11), 'Remembrance Day');
    addH(y,12, nearest(y,12,25), 'Christmas Day');
    addH(y,12, nearest(y,12,26), 'Boxing Day');
  }
  return { cals, events: CAHolidays };
}

