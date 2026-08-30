/* ── WEEKLY PLANNER ── */
let wpWeekOffset = 0;
const WP_DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
function wpMonday(d){ const x=new Date(d); const day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); x.setHours(0,0,0,0); return x; }
function wpWeekKey(offset){ const m=wpMonday(new Date()); m.setDate(m.getDate()+offset*7); return m.toISOString().slice(0,10); }
function wpNav(dir){ wpWeekOffset = dir===0 ? 0 : wpWeekOffset+dir; renderPlanner(); }
function wpSave(){
  const text=g('wp-tx').value.trim();
  if(!text){toast('Enter a task!');return;}
  if(!DB.planner) DB.planner=[];
  DB.planner.push({id:'wp'+Date.now(), week:wpWeekKey(wpWeekOffset), day:+g('wp-day').value, text, course:g('wp-co').value||'', pr:+g('wp-pr').value||0, done:false});
  save(); closeMo('mo-plan'); g('wp-tx').value=''; renderPlanner(); toast('Added to planner!');
}
function wpToggle(id){
  const it=(DB.planner||[]).find(i=>i.id===id); if(!it) return;
  it.done=!it.done;
  if (it.examId && it.examTaskId) {
    const ex=(DB.exams||[]).find(e=>e.id===it.examId);
    if (ex) for (const day of (ex.plan||[])) { const t=(day.tasks||[]).find(x=>x.id===it.examTaskId); if (t) { t.done=it.done; break; } }
  }
  save(); renderPlanner();
}
function wpWeekKeyForDate(dateStr){ return wpMonday(new Date(dateStr+'T00:00:00')).toISOString().slice(0,10); }
function wpDayIndexForDate(dateStr){ return (new Date(dateStr+'T00:00:00').getDay()+6)%7; }
// Pulls an exam's study-plan tasks into the Weekly Planner, placed on the
// correct week/day for each task's date. Safe to call repeatedly — tasks
// already linked (by examTaskId) are skipped. Pass silent=true to batch
// several exams into one save/toast (see wpSyncAllExams).
function examSyncPlanner(examId, silent){
  const ex=(DB.exams||[]).find(e=>e.id===examId); if(!ex) return 0;
  if(!DB.planner) DB.planner=[];
  const already=new Set(DB.planner.filter(p=>p.examId===examId).map(p=>p.examTaskId));
  let added=0;
  (ex.plan||[]).forEach(day=>{
    (day.tasks||[]).forEach(t=>{
      if(already.has(t.id)) return;
      DB.planner.push({
        id:'wpx'+t.id, week:wpWeekKeyForDate(day.date), day:wpDayIndexForDate(day.date),
        text:`⏳ ${t.text}`, course:ex.course, pr:(ex.pri??1)>=2?1:0, done:!!t.done,
        examId:ex.id, examTaskId:t.id
      });
      added++;
    });
  });
  if(!silent){
    save(); if(g('wp-board')) renderPlanner();
    toast(added?`Added ${added} study task${added===1?'':'s'} to Weekly Planner`:'Already synced — nothing new to add');
  }
  return added;
}
function wpSyncAllExams(){
  const exams=(DB.exams||[]).filter(e=>dLeft(e.date)>=0);
  if(!exams.length){ toast('No upcoming exams to sync'); return; }
  let added=0; exams.forEach(ex=>{ added+=examSyncPlanner(ex.id,true); });
  save(); renderPlanner();
  toast(added?`Added ${added} study task${added===1?'':'s'} from ${exams.length} exam${exams.length===1?'':'s'}`:'Already synced — nothing new to add');
}
function wpDel(id){ DB.planner=(DB.planner||[]).filter(i=>i.id!==id); save(); renderPlanner(); }
function wpCarryOver(){
  const week=wpWeekKey(wpWeekOffset), nextWeek=wpWeekKey(wpWeekOffset+1);
  const unfinished=(DB.planner||[]).filter(i=>i.week===week && !i.done);
  if(!unfinished.length){ toast('Nothing to carry over!'); return; }

  const doCarry=()=>{
    unfinished.forEach(i=>{ i.week=nextWeek; });
    save(); renderPlanner(); toast(`Carried ${unfinished.length} item(s) to next week`);
  };

  // If an unfinished item is tied to an exam, carrying it over only makes
  // sense if it'll still land BEFORE that exam. If the day it'd land on is
  // on/after the exam date, the exam will already be over by then — flag it
  // instead of silently scheduling study time for a test that's already happened.
  const nextMonday=new Date(nextWeek+'T00:00:00');
  const overlapping=[];
  unfinished.forEach(i=>{
    if(!i.examId) return;
    const ex=(DB.exams||[]).find(e=>e.id===i.examId); if(!ex) return;
    const landDate=new Date(nextMonday); landDate.setDate(landDate.getDate()+i.day);
    if(examIsoDate(landDate) >= ex.date) overlapping.push(ex);
  });

  if(overlapping.length){
    const names=[...new Set(overlapping.map(ex=>`${ex.title} (${ex.course})`))];
    const plural=overlapping.length===1;
    const msg=`⚠️ ${overlapping.length} study task${plural?'':'s'} you're carrying over ${plural?'is':'are'} for ${names.join(', ')} — that exam will already be over by the day ${plural?'it lands':'they land'} next week. Carry over anyway?`;
    showConfirm(msg, doCarry, 'Carry Over Anyway');
  } else {
    doCarry();
  }
}
function renderPlanner(){
  const board=g('wp-board'); if(!board) return;
  const week=wpWeekKey(wpWeekOffset);
  const monday=new Date(week+'T00:00:00');
  const sunday=new Date(monday); sunday.setDate(sunday.getDate()+6);
  const rangeEl=g('wp-range');
  if(rangeEl) rangeEl.textContent = monday.toLocaleDateString('en-CA',{month:'short',day:'numeric'})+' – '+sunday.toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'})+(wpWeekOffset===0?' · This week':'');
  const items=(DB.planner||[]).filter(i=>i.week===week);
  const monIso=examIsoDate(monday), sunIso=examIsoDate(sunday);
  const weekExams=(DB.exams||[]).filter(e=>e.date>=monIso && e.date<=sunIso).sort((a,b)=>new Date(a.date)-new Date(b.date));
  // Homework due this week never showed up in the Weekly Planner at all —
  // only exams did (via weekExams below). A course could have three
  // assignments due Wednesday and the planner would show nothing.
  const weekHW=(DB.hw||[]).filter(h=>h.status!=='done' && h.due && h.due>=monIso && h.due<=sunIso);
  const stripEl=g('wp-exam-strip');
  if(stripEl){
    stripEl.style.display = weekExams.length ? 'flex' : 'none';
    stripEl.innerHTML = weekExams.map(ex=>{
      const d=dLeft(ex.date), dayLbl = d===0?'Today':d===1?'Tomorrow':new Date(ex.date+'T00:00:00').toLocaleDateString('en-CA',{weekday:'short'});
      const typeIc = EXAM_TYPE_IC[ex.type]||'📝';
      return `<div class="wp-exam-chip" style="border-left:3px solid ${ex.ccolor||'var(--ac)'}" onclick="examOpenAndExpand('${ex.id}')">
        <span>${typeIc} ${escapeHtml(ex.title)}</span><span class="wp-exam-chip-meta">${escapeHtml(ex.course)} · ${dayLbl}</span>
      </div>`;
    }).join('');
  }
  board.innerHTML = WP_DAYS.map((label,idx)=>{
    const dayDate=new Date(monday); dayDate.setDate(dayDate.getDate()+idx);
    const isToday = dayDate.toDateString()===new Date().toDateString();
    const dayItems = items.filter(i=>i.day===idx).sort((a,b)=>(b.pr-a.pr));
    const dayExams = weekExams.filter(e=>e.date===examIsoDate(dayDate));
    const dayBadgeIc = dayExams.length>1 ? '🗓️' : (dayExams.length ? (EXAM_TYPE_IC[dayExams[0].type]||'📝') : '');
    const examBadge = dayExams.length ? `<div class="wp-col-exam" title="${escapeHtml(dayExams.map(e=>e.title).join(', '))}" onclick="examOpenAndExpand('${dayExams[0].id}')">${dayBadgeIc} ${dayExams.length>1?dayExams.length+' exams':escapeHtml(dayExams[0].title)}</div>` : '';
    const dayHW = weekHW.filter(h=>h.due===examIsoDate(dayDate));
    const hwBadge = dayHW.length ? `<div class="wp-col-hw" title="${escapeHtml(dayHW.map(h=>h.title).join(', '))}" onclick="${dayHW.length===1?`editHW('${dayHW[0].id}')`:`go('homework')`}">📚 ${dayHW.length>1?dayHW.length+' due':escapeHtml(dayHW[0].title)}</div>` : '';
    return `<div class="wp-col ${isToday?'wp-today':''}">
      <div class="wp-col-hd"><span>${label}</span><span class="wp-col-date">${dayDate.getDate()}</span></div>
      ${examBadge}
      ${hwBadge}
      <div class="wp-col-body">${dayItems.length?dayItems.map(i=>{
        const linkedExam = i.examId ? (DB.exams||[]).find(e=>e.id===i.examId) : null;
        return `
        <div class="wp-item ${i.done?'done':''}">
          <label class="wp-check"><input type="checkbox" ${i.done?'checked':''} onchange="wpToggle('${i.id}')"/></label>
          <div class="wp-item-txt">${i.pr?'⭐ ':''}${linkedExam?`<span class="wp-item-examname" onclick="examOpenAndExpand('${linkedExam.id}')" title="Open ${escapeHtml(linkedExam.title)} in Exam Planner">${EXAM_TYPE_IC[linkedExam.type]||'📝'} ${escapeHtml(linkedExam.title)}</span> — `:''}${i.text.replace(/^⏳\s*/,'')}${i.course?`<div class="wp-item-co">${escapeHtml(i.course)}</div>`:''}</div>
          <button class="wp-item-x" onclick="wpDel('${i.id}')">✕</button>
        </div>`;
      }).join(''):'<div class="wp-empty">—</div>'}</div>
    </div>`;
  }).join('');
}

