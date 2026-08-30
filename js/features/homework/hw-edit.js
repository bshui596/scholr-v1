/* ── DAY PLAN — Day-number system (not calendar dates) ── */
function dpInit(){
  if(!DB.dayPlan) DB.dayPlan={dayNum:1,days:{}};
  const dn=DB.dayPlan.dayNum;
  if(!DB.dayPlan.days[dn]) DB.dayPlan.days[dn]={label:'Day '+dn,status:'school',blocks:[]};
}
function dpCurDay(){
  dpInit();
  const dn=DB.dayPlan.dayNum;
  if(!DB.dayPlan.days[dn]) DB.dayPlan.days[dn]={label:'Day '+dn,status:'school',blocks:[]};
  return DB.dayPlan.days[dn];
}
function dpNav(dir){
  dpInit();
  const newDay=Math.max(1,DB.dayPlan.dayNum+dir);
  DB.dayPlan.dayNum=newDay;
  if(!DB.dayPlan.days[newDay]) DB.dayPlan.days[newDay]={label:'Day '+newDay,status:'school',blocks:[]};
  save(); renderDayPlan();
}
function dpSkip(){
  dpInit();
  let n=DB.dayPlan.dayNum+1;
  while(DB.dayPlan.days[n]&&DB.dayPlan.days[n].status!=='school') n++;
  DB.dayPlan.dayNum=n;
  if(!DB.dayPlan.days[n]) DB.dayPlan.days[n]={label:'Day '+n,status:'school',blocks:[]};
  save(); renderDayPlan(); toast('Jumped to Day '+n);
}
function dpToggleOff(){
  dpInit();
  const day=dpCurDay();
  day.status=day.status==='off'?'school':'off';
  if(day.status==='off') day.blocks=[];
  save(); renderDayPlan();
}
function dpRename(){
  dpInit();
  const day=dpCurDay();
  const newName=prompt('Rename this day:',day.label||'Day '+DB.dayPlan.dayNum);
  if(newName!=null){day.label=newName.trim()||'Day '+DB.dayPlan.dayNum;save();renderDayPlan();}
}
function autoPlanDay(){
  if(!confirm("Auto-generate today's plan from your timetable, assignment priorities, and free time between commitments? This replaces the blocks already on this Day Plan day.")) return;
  dpInit();
  const day=dpCurDay();
  ttInit();
  const ttDay=DB.schedule.days[DB.schedule.dayNum];

  const pad=n=>String(n).padStart(2,'0');
  const toHM=mins=>pad(Math.floor(mins/60)%24)+':'+pad(mins%60);
  const DAY_END=21*60; // don't schedule past 9:00 PM
  let t=8*60; // start the generated day at 8:00
  const blocks=[];

  // 1. Today's timetable — one block per scheduled class
  if(ttDay && ttDay.status!=='off'){
    const slotOrder=Object.keys(ttDay.slots||{}).map(Number).sort((a,b)=>a-b);
    slotOrder.forEach(si=>{
      const cls=ttDay.slots[si];
      const start=toHM(t); t+=50; const end=toHM(t); t+=5;
      blocks.push({start,end,what:cls.course,type:'Class',course:cls.course||''});
    });
  }
  if(blocks.length) t+=15; // short break after school

  // 2. Find today's free time — pull "busy" calendar commitments (practices,
  //    appointments, other exams) out of the window so we plan around them
  const now0=new Date();
  const todayStr=now0.toDateString();
  const rangeStart=new Date(now0.getFullYear(),now0.getMonth(),now0.getDate());
  const rangeEnd=new Date(now0.getFullYear(),now0.getMonth(),now0.getDate()+1);
  const busy=[];
  (DB.calendar?.events||[]).forEach(ev=>{
    if(ev.status!=='busy'||ev.allDay||!ev.startTime) return;
    getEventOccurrences(ev,rangeStart,rangeEnd).forEach(d=>{
      if(d.toDateString()!==todayStr) return;
      const s=tmMin(ev.startTime), e=ev.endTime?tmMin(ev.endTime):s+60;
      busy.push({s,e});
    });
  });
  busy.sort((a,b)=>a.s-b.s);
  const freeBusy=[];
  busy.forEach(b=>{
    const last=freeBusy[freeBusy.length-1];
    if(last && b.s<=last.e) last.e=Math.max(last.e,b.e);
    else freeBusy.push({...b});
  });
  // nudge a start time forward past any busy commitment it collides with
  function nextFreeSlot(start,dur){
    let s=start,moved=true;
    while(moved){
      moved=false;
      for(const b of freeBusy){
        if(s<b.e && s+dur>b.s){ s=b.e; moved=true; }
      }
    }
    return s;
  }

  // 3. Build a priority-ordered work queue: overdue work always comes first
  //    (catch-up), then homework/exams ranked by priority, then by how soon
  //    they're due — so the most important things land in the earliest free time
  const PRI_W={High:3,Medium:2,Low:1};
  const HW_PRI_IC={High:'🔴',Medium:'🟡',Low:'🟢'};
  const EXAM_PRI_IC={2:'🔴',1:'🟡',0:'🟢'};

  const overdue=(DB.hw||[]).filter(h=>h.status!=='done'&&h.due&&dLeft(h.due)<0)
    .sort((a,b)=>new Date(a.due)-new Date(b.due))
    .map(h=>({dur:25,what:`⚠️ Catch up: ${h.title}`,type:'Overdue',course:h.course||''}));

  const dueSoon=(DB.hw||[]).filter(h=>h.status!=='done'&&h.due&&dLeft(h.due)>=0&&dLeft(h.due)<=3)
    .sort((a,b)=>(PRI_W[b.priority]||2)-(PRI_W[a.priority]||2)||new Date(a.due)-new Date(b.due))
    .slice(0,6)
    .map(h=>({dur:h.priority==='High'?35:h.priority==='Low'?15:25,what:`${HW_PRI_IC[h.priority]||'🟡'} Study: ${h.title}`,type:'Study',course:h.course||'',_w:PRI_W[h.priority]||2}));

  const examSoon=(DB.exams||[]).filter(e=>dLeft(e.date)>=0&&dLeft(e.date)<=5)
    .sort((a,b)=>(b.pri??1)-(a.pri??1)||new Date(a.date)-new Date(b.date))
    .slice(0,4)
    .map(e=>({dur:(e.pri===2||dLeft(e.date)<=1)?45:e.pri===0?20:30,what:`${EXAM_PRI_IC[e.pri??1]} Exam prep: ${e.title}`,type:'Exam',course:e.course||'',_w:(e.pri??1)+1}));

  // interleave homework + exam prep by priority weight, soonest first
  const rest=[...dueSoon,...examSoon].sort((a,b)=>b._w-a._w);

  let skipped=0;
  [...overdue,...rest].forEach(item=>{
    const start=nextFreeSlot(t,item.dur);
    if(start+item.dur>DAY_END){ skipped++; return; }
    t=start;
    const startL=toHM(t); t+=item.dur; const endL=toHM(t); t+=5; // short breather between blocks
    blocks.push({start:startL,end:endL,what:item.what,type:item.type,course:item.course});
  });

  if(!blocks.length){toast('Nothing to plan — no classes, homework, or exams found!');return;}

  day.blocks=blocks;
  save();
  renderDayPlan();
  if(typeof renderPlanDay==='function') renderPlanDay();
  renderDashboard();
  toast(`Auto-generated ${blocks.length} block${blocks.length!==1?'s':''} for today!`+(skipped?` (${skipped} more didn't fit before 9 PM)`:''));
}
function renderDayPlan(){
  dpInit();
  const dn=DB.dayPlan.dayNum, day=dpCurDay();
  const lbl=g('dp-dl'), badge=g('dp-badge'), offBtn=g('dp-off-btn');
  if(lbl){lbl.textContent=day.label||'Day '+dn;lbl.title='Click to rename';lbl.onclick=dpRename;lbl.style.cursor='pointer';}
  if(badge){badge.textContent=day.status==='off'?'🏖 Off Day':day.status==='skip'?'⏭ Skipped':'📚 School Day';badge.className='dp-day-badge '+(day.status==='off'?'off':day.status==='skip'?'skip':'school');}
  if(offBtn) offBtn.textContent=day.status==='off'?'📚 Mark School':'🏖 Off Day';
  // Day sidebar list
  const dl=g('dp-day-list');
  if(dl){
    const allDays=Object.entries(DB.dayPlan.days).sort((a,b)=>+a[0]-+b[0]).slice(0,12);
    dl.innerHTML=allDays.map(([d,dy])=>{
      const isActive=+d===dn;
      return `<div onclick="DB.dayPlan.dayNum=${d};save();renderDayPlan()" style="display:flex;align-items:center;gap:7px;padding:5px 8px;border-radius:6px;cursor:pointer;background:${isActive?'var(--acll)':'transparent'};margin-bottom:2px;transition:background .1s"><span style="font-size:11px;font-weight:700;color:${isActive?'var(--ac)':'var(--ink4)'};width:50px;flex-shrink:0">${dy.label||'Day '+d}</span><span style="font-size:10.5px;color:${dy.status==='off'?'var(--red)':dy.status==='skip'?'var(--amb)':'var(--ink3)'}">${dy.status==='off'?'🏖 Off':dy.status==='skip'?'⏭ Skip':'📚 '+(dy.blocks?dy.blocks.length:0)+' block'+(dy.blocks?.length!==1?'s':'')}</span></div>`;
    }).join('');
  }
  const tl=g('dp-tl'); tl.innerHTML='';
  if(day.status==='off'){tl.innerHTML='<div class="emp"><span class="ei">🏖</span><p>Day off — enjoy the break!</p></div>';renderStreak();renderDpChecklist();return;}
  const blocks=(day.blocks||[]).sort((a,b)=>a.start.localeCompare(b.start));
  const nm=new Date().getHours()*60+new Date().getMinutes();
  if(!blocks.length){tl.innerHTML='<div class="emp"><span class="ei">📅</span><p>No blocks planned for '+( day.label||'Day '+dn)+'</p></div>';}
  else{
    blocks.forEach((b,idx)=>{
      const sm=tmMin(b.start),em=tmMin(b.end),isNow=nm>=sm&&nm<em&&b.end,isPast=nm>=em&&b.end;
      const col=DP_COL[b.type]||'#374151';
      const div=document.createElement('div'); div.className='dp-blk';
      div.innerHTML=`<div class="dp-time">${b.start}${b.end?'–'+b.end:''}</div><div class="dp-line"><div class="dp-dot ${isNow?'now':''}"></div>${idx<blocks.length-1?'<div class="dp-vl"></div>':''}</div><div class="dp-card" style="${isNow?'border-left:3px solid '+col:''}"><div class="dp-ct">${isNow?'🟢 ':''}${isPast?`<s style="opacity:.5">${b.what}</s>`:b.what}</div><div class="dp-cm"><span class="tag" style="background:${col}22;color:${col}">${b.type}</span>${b.course&&b.course!=='— None —'?`<span class="tag" style="background:${(DB.courses.find(c=>c.name===b.course)?.color||col)+'22'};color:${DB.courses.find(c=>c.name===b.course)?.color||col}">${b.course}</span>`:''}<button onclick="rmDpBlock(${dn},${idx})" style="background:none;color:var(--ink4);font-size:11px;padding:1px 4px;border-radius:3px;cursor:pointer;margin-left:auto">✕</button></div></div>`;
      tl.appendChild(div);
    });
  }
  tl.innerHTML+=`<button class="dp-add" onclick="showMo('mo-dp')">+ Add Block</button>`;
  renderStreak(); renderDpChecklist();
}
let pmdCalState = null;
function renderPlanDay() {
  const now = new Date();
  setText('pmd-date-sub', now.toLocaleDateString('en-CA',{weekday:'long',month:'long',day:'numeric',year:'numeric'}));
  if (!pmdCalState) pmdCalState = { miniYear: now.getFullYear(), miniMonth: now.getMonth() };
  renderPmdMini();
  renderPmdHW();
  renderPmdExams();

  const scheduleEl = g('pmd-schedule');
  if (!scheduleEl) return;

  dpInit();
  const day = dpCurDay();
  const blocks = (day.blocks || []).sort((a,b) => (a.start || '23:59').localeCompare(b.start || '23:59'));
  const dueItems = (DB.hw || []).filter(h => h.status !== 'done' && h.due).sort((a,b) => new Date(a.due) - new Date(b.due)).slice(0, 4);
  const examItems = (DB.exams || []).filter(e => dLeft(e.date) >= 0).sort((a,b) => new Date(a.date) - new Date(b.date)).slice(0, 3);

  const focusItems = [
    ...dueItems.map(item => ({ type: 'Homework', label: item.title, meta: item.course || 'Assignment', icon: '📌' })),
    ...examItems.map(item => ({ type: 'Exam', label: item.title, meta: item.course || 'Upcoming exam', icon: '⏳' }))
  ].slice(0, 4);

  scheduleEl.innerHTML = blocks.length ? blocks.map((b, idx) => {
    const course = b.course && b.course !== '— None —' ? b.course : '';
    const type = b.type || 'Study';
    return `<div class="pmd-block">
      <div class="pmd-block-time">${b.start || '—'}${b.end ? '–' + b.end : ''}</div>
      <div class="pmd-block-body">
        <div class="pmd-block-head">
          <div class="pmd-block-title">${escapeHtml(b.what || 'Untitled task')}</div>
          <span class="pmd-tag" style="color:${DP_COL[type] || 'var(--ac)'};background:${(DP_COL[type] || 'var(--ac)')}22;border-color:${(DP_COL[type] || 'var(--ac)')}33">${escapeHtml(type)}</span>
        </div>
        <div class="pmd-block-badges">${course ? `<span class="pmd-tag">${escapeHtml(course)}</span>` : ''}</div>
        <div class="pmd-block-meta">${idx === 0 ? 'Priority block' : 'Keep momentum'} • ${b.end ? 'Planned session' : 'Quick task'}</div>
      </div>
    </div>`;
  }).join('') : '<div class="pmd-empty">No blocks scheduled yet — add a focus block to build your day.</div>';

  const focusEl = g('pmd-focus-list');
  if (focusEl) {
    focusEl.innerHTML = focusItems.length ? focusItems.map(item => `
      <div class="pmd-focus-item">
        <div class="pmd-focus-ic">${item.icon}</div>
        <div class="pmd-focus-copy">
          <div class="pmd-focus-title">${escapeHtml(item.label)}</div>
          <div class="pmd-focus-meta">${escapeHtml(item.type)} • ${escapeHtml(item.meta)}</div>
        </div>
      </div>
    `).join('') : '<div class="pmd-empty" style="padding:12px">Everything looks clear for now.</div>';
  }

  setText('pmd-kpi-hw', String(dueItems.length));
  setText('pmd-kpi-exams', String(examItems.length));
  setText('pmd-kpi-blocks', String(blocks.length));
  setText('pmd-kpi-score', String(Math.min(100, Math.max(0, Math.round((blocks.length * 20) + (dueItems.length ? 15 : 0) + (examItems.length ? 10 : 0))))));
}

function renderPmdMini() {
  const wrap = g('pmd-mini');
  if (!wrap || !pmdCalState) return;

  const y = pmdCalState.miniYear, m = pmdCalState.miniMonth;
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const now = new Date();
  let html = `<div class="cal-mini-nav">
    <button onclick="pmdMiniNav(-1)">‹</button>
    <span>${MONTHS[m].slice(0,3)} ${y}</span>
    <button onclick="pmdMiniNav(1)">›</button>
  </div>
  <div class="cal-mini-grid">
    ${DAYS_SHORT.map(d => `<div class="cal-mini-dh">${d[0]}</div>`).join('')}`;

  for (let i = 0; i < first; i++) html += `<div class="cal-mini-d other">&nbsp;</div>`;

  const allEventDates = new Set();
  (DB.calendar.events || []).forEach(ev => {
    getEventOccurrences(ev, new Date(y, m, 1), new Date(y, m + 1, 0)).forEach(d => allEventDates.add(d.toDateString()));
  });

  for (let d = 1; d <= days; d++) {
    const dt = new Date(y, m, d);
    const isToday = dt.toDateString() === now.toDateString();
    const hasEv = allEventDates.has(dt.toDateString());
    html += `<div class="cal-mini-d${isToday ? ' today' : ''}${hasEv ? ' has-event' : ''}" onclick="pmdMiniClick(${y},${m},${d})">${d}</div>`;
  }

  html += '</div>';
  wrap.innerHTML = html;
}

function pmdMiniNav(dir) {
  if (!pmdCalState) pmdCalState = { miniYear: new Date().getFullYear(), miniMonth: new Date().getMonth() };
  pmdCalState.miniMonth += dir;
  if (pmdCalState.miniMonth > 11) { pmdCalState.miniMonth = 0; pmdCalState.miniYear++; }
  if (pmdCalState.miniMonth < 0) { pmdCalState.miniMonth = 11; pmdCalState.miniYear--; }
  renderPmdMini();
}

function pmdMiniClick(y, m, d) {
  const dt = new Date(y, m, d);
  if (typeof calState !== 'undefined') {
    calState.selectedDate = dt;
    calState.year = y; calState.month = m;
    calState.weekStart = getWeekStart(dt);
    calState.dayDate = dt;
    calState.miniYear = y; calState.miniMonth = m;
  }
  go('calendar');
}

function renderPmdHW() {
  const el = g('pmd-hw-list');
  if (!el) return;
  const items = (DB.hw || []).filter(h => h.status !== 'done' && h.due).sort((a,b) => new Date(a.due) - new Date(b.due));
  setText('pmd-hw-count', String(items.length));
  el.innerHTML = items.length ? items.slice(0, 4).map(hwRow).join('') : '<div class="emp"><span class="ei">✅</span><p>Nothing due soon!</p></div>';
}

function renderPmdExams() {
  const el = g('pmd-exam-list');
  if (!el) return;
  const items = (DB.exams || []).filter(e => dLeft(e.date) >= 0).sort((a,b) => new Date(a.date) - new Date(b.date));
  setText('pmd-exam-count', String(items.length));
  el.innerHTML = items.length ? items.slice(0, 3).map(ex => {
    const days = dLeft(ex.date), badge = examCountdownBadge(days);
    return `<div class="pmd-exam-item" style="border-left:3px solid ${ex.ccolor || 'var(--ac)'};padding:10px 12px;margin-bottom:8px;border-radius:10px;background:var(--s2);cursor:pointer" onclick="go('exams')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <div>
          <div style="font-size:12px;font-weight:700;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px">${escapeHtml(ex.title)}</div>
          <div style="font-size:10.5px;color:var(--ink4)">${escapeHtml(ex.course || '')}</div>
        </div>
        <span class="due ${badge.cls}" style="font-size:10px;white-space:nowrap">${badge.label}</span>
      </div>
    </div>`;
  }).join('') : '<div class="emp"><span class="ei">🎉</span><p>No exams scheduled!</p></div>';
}
function renderDpChecklist(){
  const cl=g('dp-cl'),pend=DB.hw.filter(h=>h.status!=='done').slice(0,6);
  if(!cl)return;
  cl.innerHTML=pend.length?pend.map(h=>`<div class="hw-item"><div class="hw-cb ${h.status==='done'?'ck':''}" onclick="tglHW('${h.id}');renderDayPlan()"></div><div class="hw-body"><div class="hw-title ${h.status==='done'?'done':''}">${h.title}</div><div class="hw-meta"><span style="font-size:10.5px;color:var(--ink4)">${h.course}</span>${h.due?`<span class="due ${dLeft(h.due)<0?'ovd':dLeft(h.due)<=2?'urg':''}">${dueFmt(h.due)}</span>`:''}</div></div></div>`).join(''):'<div style="font-size:12.5px;color:var(--ink4);text-align:center;padding:10px">All done! 🎉</div>';
}
function tmMin(t){if(!t)return 0;const m=t.match(/(\d+):(\d+)/);return m?+m[1]*60+ +m[2]:0;}
function saveDp(){
  const what=g('dp-wh').value.trim(); if(!what){toast('Enter an activity!');return;}
  dpInit();
  const day=dpCurDay();
  if(!day.blocks) day.blocks=[];
  day.blocks.push({what,start:g('dp-s').value||'00:00',end:g('dp-e').value||'',type:g('dp-ty').value,course:g('dp-co').value});
  day.blocks.sort((a,b)=>a.start.localeCompare(b.start));
  markStreakToday();
  save(); closeMo('mo-dp'); g('dp-wh').value=''; renderDayPlan(); toast('Block added!');
}
function rmDpBlock(dn,idx){
  const day=DB.dayPlan?.days?.[dn]; if(!day)return;
  day.blocks.splice(idx,1); save(); renderDayPlan();
}

// Carries today's schedule blocks over to the next planned day — for
// recurring routines (same classes/study blocks tomorrow) without
// re-entering everything by hand. Appends rather than overwrites, and
// skips exact duplicates already on the next day.
function dpCarryOverToNextDay(){
  dpInit();
  const day = dpCurDay();
  if (!day.blocks || !day.blocks.length) { toast('Nothing to carry over!'); return; }
  const nextDn = DB.dayPlan.dayNum + 1;
  if (!DB.dayPlan.days[nextDn]) DB.dayPlan.days[nextDn] = { label: 'Day ' + nextDn, status: 'school', blocks: [] };
  const nextDay = DB.dayPlan.days[nextDn];
  if (!nextDay.blocks) nextDay.blocks = [];

  const doCarry = () => {
    let added = 0;
    day.blocks.forEach(b => {
      const dup = nextDay.blocks.some(nb => nb.what === b.what && nb.start === b.start && nb.type === b.type);
      if (!dup) { nextDay.blocks.push({ ...b }); added++; }
    });
    nextDay.blocks.sort((a,b) => (a.start||'').localeCompare(b.start||''));
    save(); renderDayPlan(); renderPlanDay();
    toast(added ? `Carried ${added} block(s) to Day ${nextDn}` : 'Already on Day ' + nextDn + ' — nothing new to add');
  };

  if (typeof showConfirm === 'function') {
    showConfirm(`Carry ${day.blocks.length} block(s) from Day ${DB.dayPlan.dayNum} to Day ${nextDn}?`, doCarry, 'Carry Over');
  } else if (confirm(`Carry ${day.blocks.length} block(s) to Day ${nextDn}?`)) {
    doCarry();
  }
}

// Shared "did something today" marker for the streak grid. Previously only
// adding a day-plan block counted — finishing a homework item, reviewing
// flashcards, or checking off an exam study task were all real study
// activity that left the streak untouched. All of those now feed it too.
function markStreakToday(){
  if(!DB.streak) DB.streak=[];
  const dk=new Date().toISOString().slice(0,10);
  if(!DB.streak.includes(dk)){ DB.streak.push(dk); return true; }
  return false;
}
function renderStreak(){
  const grid=g('sg'); if(!grid) return;
  const today=new Date(), streak=DB.streak||[]; let cnt=0;
  grid.innerHTML='';
  for(let i=27;i>=0;i--){const d=new Date(today);d.setDate(d.getDate()-i);const dk=d.toISOString().slice(0,10);const isToday=i===0,done=streak.includes(dk);const div=document.createElement('div');div.className=`s-day ${done?'done':isToday?'today':'empty'}`;div.title=dk;grid.appendChild(div);}
  for(let i=0;;i++){const d=new Date(today);d.setDate(d.getDate()-i);const dk=d.toISOString().slice(0,10);if(streak.includes(dk))cnt++;else break;}
  setText('dp-sv',cnt);
}

