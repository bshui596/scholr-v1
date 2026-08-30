/* ── TIMETABLE — day-number system ── */
// DB.schedule = { dayNum:1, days:{ '1':{label:'Day 1',status:'school',slots:{}} } }
// slot key = slotIndex (0,1,2...) → {course,teacher,room,period,notes}

function ttInit(){
  if(!DB.schedule) DB.schedule={dayNum:1,days:{}};
  const dn=DB.schedule.dayNum;
  if(!DB.schedule.days[dn]) DB.schedule.days[dn]={label:'Day '+dn,status:'school',slots:{}};
}
function ttCurDay(){
  ttInit();
  const dn=DB.schedule.dayNum;
  if(!DB.schedule.days[dn]) DB.schedule.days[dn]={label:'Day '+dn,status:'school',slots:{}};
  return DB.schedule.days[dn];
}
function ttNav(dir){
  ttInit();
  const newDay=Math.max(1,DB.schedule.dayNum+dir);
  DB.schedule.dayNum=newDay;
  if(!DB.schedule.days[newDay]) DB.schedule.days[newDay]={label:'Day '+newDay,status:'school',slots:{}};
  save(); renderTT();
}
function ttAddDay(){
  ttInit();
  const keys=Object.keys(DB.schedule.days).map(Number);
  const newDay=keys.length?Math.max(...keys)+1:1;
  DB.schedule.days[newDay]={label:'Day '+newDay,status:'school',slots:{}};
  DB.schedule.dayNum=newDay;
  save(); renderTT(); toast('Added Day '+newDay);
}
function ttToggleOff(){
  ttInit();
  const day=ttCurDay();
  day.status=day.status==='off'?'school':'off';
  if(day.status==='off') day.slots={};
  save(); renderTT();
}
function ttSkip(){
  ttInit();
  let n=DB.schedule.dayNum+1;
  while(DB.schedule.days[n]&&DB.schedule.days[n].status!=='school') n++;
  DB.schedule.dayNum=n;
  if(!DB.schedule.days[n]) DB.schedule.days[n]={label:'Day '+n,status:'school',slots:{}};
  save(); renderTT(); toast('Jumped to Day '+n);
}
function ttShift(){
  ttInit();
  const curDay=ttCurDay();
  const keys=Object.keys(DB.schedule.days).map(Number);
  const newDay=Math.max(...keys)+1;
  DB.schedule.days[newDay]={label:'Day '+newDay,status:'school',slots:JSON.parse(JSON.stringify(curDay.slots||{}))};
  DB.schedule.dayNum=newDay;
  save(); renderTT(); toast('Copied schedule to Day '+newDay);
}
function ttRename(){
  ttInit();
  const day=ttCurDay();
  const n=prompt('Rename day:',day.label);
  if(n!=null){day.label=n.trim()||'Day '+DB.schedule.dayNum;save();renderTT();}
}
function ttClearDay(){
  if(!confirm('Clear all classes from this day?')) return;
  const day=ttCurDay(); day.slots={};
  save(); renderTT();
}
function renderTT(){
  ttInit();
  const dn=DB.schedule.dayNum, day=ttCurDay();
  const lbl=g('tt-day-lbl'), badge=g('tt-day-badge'), offBtn=g('tt-off-btn');
  if(lbl) lbl.textContent=day.label||'Day '+dn;
  if(badge){badge.textContent=day.status==='off'?'🏖 Off Day':'📚 School Day';badge.className='dp-day-badge '+(day.status==='off'?'off':'school');}
  if(offBtn) offBtn.textContent=day.status==='off'?'📚 Mark School':'🏖 Off Day';
  // Side nav
  const nav=g('tt-day-nav');
  if(nav){
    const allDays=Object.entries(DB.schedule.days).sort((a,b)=>+a[0]-+b[0]);
    nav.innerHTML=allDays.map(([d,dy])=>{
      const isActive=+d===dn;
      const cnt=Object.keys(dy.slots||{}).length;
      return `<div onclick="DB.schedule.dayNum=${d};save();renderTT()" style="display:flex;align-items:center;gap:6px;padding:5px 7px;border-radius:6px;cursor:pointer;background:${isActive?'var(--acll)':'transparent'};margin-bottom:2px;transition:background .1s"><span style="font-size:11px;font-weight:700;color:${isActive?'var(--ac)':'var(--ink4)'};min-width:44px">${dy.label||'Day '+d}</span><span style="font-size:10px;color:${dy.status==='off'?'var(--red)':'var(--ink4)'}">${dy.status==='off'?'🏖':cnt+' cls'}</span></div>`;
    }).join('');
  }
  // Build table
  const head=g('tt-head-main'), body=g('tt-body');
  if(!head||!body) return;
  if(day.status==='off'){
    head.innerHTML='';
    body.innerHTML='<div style="text-align:center;padding:40px;color:var(--ink4)"><div style="font-size:36px;margin-bottom:8px">🏖</div><p>Day off</p></div>';
    return;
  }
  // Header: Time + Class (rows below are one period per row, not one column per slot)
  const slots=DB.slots||[];
  head.innerHTML=`<div class="tt-dh" style="width:62px;flex:0 0 62px">Time</div><div class="tt-dh">Class</div>`;
  body.innerHTML='';
  if(!slots.length){body.innerHTML='<div style="text-align:center;padding:30px;color:var(--ink4)">Add time slots in Settings → Timetable</div>';return;}
  // Each slot = one row (time | class card)
  slots.forEach((slot,si)=>{
    const row=document.createElement('div'); row.className='tt-row';
    row.innerHTML=`<div class="tt-t">${slot}</div>`;
    const cellDiv=document.createElement('div'); cellDiv.className='tt-cell';
    const cls=(day.slots||{})[si];
    if(cls){
      const c2=DB.courses.find(c=>c.name===cls.course),col=c2?.color||'#0F6B30';
      cellDiv.innerHTML=`<div class="tt-cls" style="background:${col}22;color:${col}" onclick="ttEditSlot(${dn},${si},event)">${cls.course}<small>${cls.period||''} ${cls.room?'· '+cls.room:''}</small>${cls.teacher?`<small>${cls.teacher}</small>`:''}<button onclick="ttRmSlot(${dn},${si},event)" style="position:absolute;top:3px;right:3px;background:none;color:${col};font-size:9px;opacity:0;padding:1px 3px;cursor:pointer" class="tt-del">✕</button></div>`;
      const cls2=cellDiv.querySelector('.tt-cls'); if(cls2){cls2.style.position='relative';}
      cellDiv.addEventListener('mouseenter',()=>cellDiv.querySelector('.tt-del')&&(cellDiv.querySelector('.tt-del').style.opacity='1'));
      cellDiv.addEventListener('mouseleave',()=>cellDiv.querySelector('.tt-del')&&(cellDiv.querySelector('.tt-del').style.opacity='0'));
    } else {
      cellDiv.innerHTML=`<div class="tt-empty" onclick="qAddCls(${dn},${si})">+</div>`;
    }
    row.appendChild(cellDiv);
    body.appendChild(row);
  });
}
function saveClass(){
  const course=g('cls-co').value, teacher=g('cls-te').value||'', room=g('cls-rm').value||'';
  const period=g('cls-per')?.value||'', notes=g('cls-nt')?.value||'';
  const si=+g('cls-sl').value||0;
  if(!course){toast('Select a course!');return;}
  ttInit();
  const day=ttCurDay();
  if(!day.slots) day.slots={};
  day.slots[si]={course,teacher,room,period,notes};
  save(); closeMo('mo-cls'); renderTT(); renderDashboard(); toast('Class added!');
}
function qAddCls(dn,si){
  // Navigate to that day first
  ttInit(); DB.schedule.dayNum=dn; save(); renderTT();
  populateSels();
  const se=g('cls-sl'); if(se) for(let o of se.options) if(o.value===String(si)){o.selected=true;break;}
  showMo('mo-cls');
}
function ttRmSlot(dn,si,e){
  e.stopPropagation();
  if(!DB.schedule?.days?.[dn]?.slots) return;
  delete DB.schedule.days[dn].slots[si];
  save(); renderTT();
}
function ttEditSlot(dn,si,e){
  e.stopPropagation();
  populateSels();
  const se=g('cls-sl'); if(se) for(let o of se.options) if(o.value===String(si)){o.selected=true;break;}
  const cls=DB.schedule?.days?.[dn]?.slots?.[si];
  if(cls){
    setSel('cls-co',cls.course);
    setValue('cls-te',cls.teacher||'');
    setValue('cls-rm',cls.room||'');
    if(g('cls-per')) g('cls-per').value=cls.period||'';
    if(g('cls-nt')) g('cls-nt').value=cls.notes||'';
  }
  showMo('mo-cls');
}
function clearTT(){if(confirm('Clear all days?')){DB.schedule={dayNum:1,days:{}};save();renderTT();}}

