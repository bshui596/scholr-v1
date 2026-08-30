/* ═══════════════════════════════════════════════════
   EXAM PLANNER MODULE
   DB.exams[]: { id, course, ccolor, title, date, time, location,
                 topics:[string], plan:[{date,label,tasks:[{id,text,kind,done}]}],
                 calEventId, created }
═══════════════════════════════════════════════════ */
let examExpandedIds = new Set();

function examIsoDate(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function examDayLabel(d){ return d.toLocaleDateString('en-CA',{weekday:'short',month:'short',day:'numeric'}); }
function examMkTask(text,kind){ return { id:'t'+Date.now()+Math.random().toString(36).slice(2,7), text, kind:kind||'topic', done:false }; }

// Builds just the day scaffolding (dates/labels, which days are "review" days)
// for an exam study plan — pure calendar math, no content. AI fills in the
// actual task text; this keeps the exam date logic reliable either way.
function examBuildDayScaffold(examDateStr, studyWindow){
  const exam = new Date(examDateStr+'T00:00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  const allDays = [];
  const cursor = new Date(today);
  while (cursor < exam) { allDays.push(new Date(cursor)); cursor.setDate(cursor.getDate()+1); }
  if (!allDays.length) allDays.push(new Date(today));
  const MAXW = studyWindow>0 ? studyWindow : 14;
  const days = allDays.length > MAXW ? allDays.slice(-MAXW) : allDays;
  const reviewDayCount = days.length >= 3 ? 1 : 0;
  return days.map((d,i) => ({
    date: examIsoDate(d), label: examDayLabel(d),
    isReview: i >= days.length - reviewDayCount
  }));
}

// Asks the AI backend to write the actual day-by-day task content for an
// exam study plan. Falls back to the local template generator (genExamStudyPlan)
// if the AI call fails or is unavailable, so exam saving never breaks.
async function examGenerateAiPlan(topics, examDateStr, studyWindow, examTitle, examType){
  const scaffold = examBuildDayScaffold(examDateStr, studyWindow);
  try {
    const data = await aiPost('/api/examplan', {
      topics, examTitle: examTitle || 'this exam', dayCount: scaffold.length,
      examType: examType || 'Test'
    });
    const aiDays = Array.isArray(data.days) ? data.days : null;
    if (!aiDays || aiDays.length !== scaffold.length) throw new Error('Unexpected AI response shape');

    return scaffold.map((day, i) => {
      const tasks = (aiDays[i] || []).filter(t => typeof t === 'string' && t.trim()).slice(0, 3)
        .map(t => examMkTask(t.trim(), day.isReview ? 'practice' : 'topic'));
      if (!tasks.length) tasks.push(examMkTask('Review & practice', 'practice'));
      return { date: day.date, label: day.label, tasks };
    });
  } catch (err) {
    console.error('AI exam plan failed, using local generator:', err);
    return genExamStudyPlan(topics, examDateStr, studyWindow, examType);
  }
}

// Builds a day-by-day study plan for the days leading up to the exam,
// spreading the given topics across the available days (or generic
// review tasks if no topics were given), with the day(s) closest to
// the exam reserved for cumulative review.
//
// Task language is tailored to the exam TYPE — a Presentation, Lab, or
// Essay needs a completely different prep routine than a Test/Quiz, so
// "just study the topics" doesn't actually help the student prepare.
const EXAM_TYPE_CONFIG = {
  'Test':           { topicVerb: t => t, genericTasks: ['Practice problems & self-quiz','Review weak areas & flashcards','Timed practice test','Summarize key concepts','Redo missed problems'], reviewTasks: ['Final review — go over every topic','Practice questions / past exam'] },
  'Final Exam':     { topicVerb: t => t, genericTasks: ['Practice problems & self-quiz','Review weak areas & flashcards','Timed practice test','Summarize key concepts','Redo missed problems','Build a cumulative cheat sheet'], reviewTasks: ['Full cumulative review — every unit','Timed practice under exam conditions'] },
  'Quiz':           { topicVerb: t => t, genericTasks: ['Skim notes & flashcards','Quick self-quiz','Review weak spots'], reviewTasks: ['Final skim of notes & flashcards','Quick practice questions'] },
  'Presentation':   { topicVerb: t => `Prepare & outline: ${t}`, genericTasks: ['Draft the slide outline','Build out slide content','Design visuals & transitions','Write speaker notes','Time a practice run-through'], reviewTasks: ['Full timed run-through, start to finish','Prepare for Q&A / anticipated questions'] },
  'Lab':            { topicVerb: t => `Review procedure: ${t}`, genericTasks: ['Review the lab manual / procedure','Review safety steps & equipment','Practice calculations / data analysis','Review expected results & sources of error'], reviewTasks: ['Walk through the full procedure start to finish','Review write-up format & sample results'] },
  'Essay':          { topicVerb: t => `Draft section: ${t}`, genericTasks: ['Research & gather sources','Draft thesis & outline','Write a body paragraph','Revise for clarity & flow','Check citations & formatting'], reviewTasks: ['Full read-through & polish','Final proofread & citation check'] },
  'Other':          { topicVerb: t => t, genericTasks: ['Review notes & materials','Practice / apply key concepts','Review weak areas'], reviewTasks: ['Final review','Last practice pass'] }
};
function examTypeConfig(type){ return EXAM_TYPE_CONFIG[type] || EXAM_TYPE_CONFIG['Test']; }

function genExamStudyPlan(topics, examDateStr, studyWindow, examType){
  const cfg = examTypeConfig(examType);
  const exam = new Date(examDateStr+'T00:00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  const allDays = [];
  const cursor = new Date(today);
  while (cursor < exam) { allDays.push(new Date(cursor)); cursor.setDate(cursor.getDate()+1); }
  if (!allDays.length) allDays.push(new Date(today)); // exam is today or already past

  const MAXW = studyWindow>0 ? studyWindow : 14; // customizable — cap the plan to N days closest to the exam
  const days = allDays.length > MAXW ? allDays.slice(-MAXW) : allDays;
  const reviewDayCount = days.length >= 3 ? 1 : 0;
  const topicDays = days.slice(0, days.length - reviewDayCount);
  const reviewDays = days.slice(days.length - reviewDayCount);

  const plan = days.map(d => ({ date: examIsoDate(d), label: examDayLabel(d), tasks: [] }));
  const byDate = Object.fromEntries(plan.map(p=>[p.date, p]));

  if (!topics.length) {
    topicDays.forEach((d,i) => {
      const text = i===0 ? cfg.genericTasks[0] : cfg.genericTasks[i % cfg.genericTasks.length];
      byDate[examIsoDate(d)].tasks.push(examMkTask(text,'practice'));
    });
  } else if (topics.length <= topicDays.length) {
    const perDay = topicDays.length / topics.length;
    topics.forEach((t,i) => {
      const dayIdx = Math.min(topicDays.length-1, Math.floor(i*perDay));
      byDate[examIsoDate(topicDays[dayIdx])].tasks.push(examMkTask(cfg.topicVerb(t),'topic'));
    });
    let gi = 0;
    topicDays.forEach(d => {
      const p = byDate[examIsoDate(d)];
      if (!p.tasks.length) { p.tasks.push(examMkTask(cfg.genericTasks[gi % cfg.genericTasks.length],'practice')); gi++; }
    });
  } else {
    topics.forEach((t,i) => {
      const dayIdx = i % topicDays.length;
      byDate[examIsoDate(topicDays[dayIdx])].tasks.push(examMkTask(cfg.topicVerb(t),'topic'));
    });
  }
  reviewDays.forEach(d => {
    byDate[examIsoDate(d)].tasks.push(examMkTask(cfg.reviewTasks[0],'review'));
    byDate[examIsoDate(d)].tasks.push(examMkTask(cfg.reviewTasks[1],'review'));
  });
  return plan;
}

// Carries "done" checkmarks over from the old plan to the new one when
// a plan is regenerated (e.g. topics edited), matched by task text.
function examMergePlanProgress(oldPlan, newPlan){
  const doneSet = new Set();
  (oldPlan||[]).forEach(day => (day.tasks||[]).forEach(t => { if (t.done) doneSet.add(t.text); }));
  (newPlan||[]).forEach(day => day.tasks.forEach(t => { if (doneSet.has(t.text)) t.done = true; }));
}

function examCountdownBadge(days){
  if (days < 0) return { label:'Past', cls:'ovd' };
  if (days === 0) return { label:'Today!', cls:'ovd' };
  if (days === 1) return { label:'Tomorrow', cls:'urg' };
  if (days <= 7) return { label:`${days} days left`, cls:'urg' };
  return { label:`${days} days left`, cls:'' };
}
function examProgress(ex){
  let done=0, total=0;
  (ex.plan||[]).forEach(day => (day.tasks||[]).forEach(t => { total++; if (t.done) done++; }));
  return { done, total, pct: total ? Math.round(done/total*100) : 0 };
}

function examOpenAdd(){
  if (!DB.courses.length) { toast('Add courses in Settings first!'); go('settings'); return; }
  g('exam-id').value = '';
  setText('exam-mo-title','Add Exam');
  g('exam-title').value=''; g('exam-date').value=''; g('exam-time').value=''; g('exam-loc').value=''; g('exam-topics').value='';
  setSel('exam-type','Test'); setSel('exam-pri','1'); g('exam-window').value=14;
  showMo('mo-exam');
}
function examOpenEdit(id){
  const ex = (DB.exams||[]).find(e=>e.id===id); if (!ex) return;
  g('exam-id').value = ex.id;
  setText('exam-mo-title','Edit Exam');
  showMo('mo-exam');
  setSel('exam-co', ex.course);
  g('exam-title').value = ex.title;
  g('exam-date').value = ex.date;
  g('exam-time').value = ex.time||'';
  g('exam-loc').value = ex.location||'';
  g('exam-topics').value = (ex.topics||[]).join('\n');
  setSel('exam-type', ex.type||'Test');
  setSel('exam-pri', String(ex.pri??1));
  g('exam-window').value = ex.window||14;
}
async function examSave(){
  const course = g('exam-co')?.value;
  const title = g('exam-title')?.value.trim();
  const date = g('exam-date')?.value;
  if (!course) { toast('Choose a course!'); return; }
  if (!title) { toast('Enter an exam title!'); return; }
  if (!date) { toast('Pick an exam date!'); return; }
  const id = g('exam-id').value || 'ex'+Date.now();
  const existingIdx = (DB.exams||[]).findIndex(e=>e.id===id);
  const topics = (g('exam-topics')?.value||'').split('\n').map(s=>s.trim()).filter(Boolean);
  const c = DB.courses.find(c=>c.name===course);
  const window = Math.max(1, Math.min(30, +g('exam-window')?.value || 14));

  const saveBtn = document.querySelector('.mdl-acts .btn.bp[onclick="examSave()"]');
  const prevLabel = saveBtn ? saveBtn.textContent : '';
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '✨ AI is planning…'; }
  const examType = g('exam-type')?.value || 'Test';
  const plan = await examGenerateAiPlan(topics, date, window, title, examType);
  if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = prevLabel; }

  const old = existingIdx>=0 ? DB.exams[existingIdx] : null;
  if (old) examMergePlanProgress(old.plan, plan);
  // Study-plan tasks regenerate with new ids on every save, so any tasks
  // already pushed to the Weekly Planner would otherwise go stale/unlinked.
  const hadLinkedPlannerItems = old ? (DB.planner||[]).some(p=>p.examId===id) : false;
  if (old) DB.planner = (DB.planner||[]).filter(p=>p.examId!==id);
  const exam = {
    id, course, ccolor: c?c.color:'#0F6B30', title, date,
    type: examType, pri: +(g('exam-pri')?.value ?? 1), window,
    time: g('exam-time')?.value||'', location: g('exam-loc')?.value.trim()||'',
    topics, plan,
    calEventId: old?old.calEventId:null,
    created: old?old.created:new Date().toISOString()
  };
  if (!DB.exams) DB.exams = [];
  if (existingIdx>=0) DB.exams[existingIdx]=exam; else DB.exams.push(exam);
  examSyncCalendarEvent(exam);
  save(); closeMo('mo-exam'); examRender(); renderDExam(); renderPlanner();
  toast(hadLinkedPlannerItems ? 'Exam saved! Re-sync to refresh its Weekly Planner tasks.' : 'Exam saved!');
}
function examSyncCalendarEvent(exam){
  if (!DB.calendar) DB.calendar = buildDefaultCalendar();
  const id = exam.calEventId || ('examev'+exam.id);
  const existing = DB.calendar.events.find(e=>e.id===id);
  const payload = {
    id, title: `📝 ${exam.title} (${exam.course})`, allDay: !exam.time,
    startDate: exam.date, endDate: exam.date,
    startTime: exam.time||'', endTime:'', repeat:'none', repeatEnd:'',
    location: exam.location||'', description: 'Added via Exam Planner',
    calId:'school', color: exam.ccolor||'#0F6B30', notif:'none', status:'busy',
    visibility:'public', created: existing?existing.created:new Date().toISOString()
  };
  const idx = DB.calendar.events.findIndex(e=>e.id===id);
  if (idx>=0) DB.calendar.events[idx]=payload; else DB.calendar.events.push(payload);
  exam.calEventId = id;
}
function examDelete(id){
  showConfirm('Delete this exam and its study plan? This cannot be undone.', () => {
    const ex = (DB.exams||[]).find(e=>e.id===id);
    if (ex && ex.calEventId && DB.calendar) DB.calendar.events = (DB.calendar.events||[]).filter(e=>e.id!==ex.calEventId);
    DB.exams = (DB.exams||[]).filter(e=>e.id!==id);
    DB.planner = (DB.planner||[]).filter(p=>p.examId!==id);
    examExpandedIds.delete(id);
    save(); examRender(); renderDExam(); renderPlanner(); toast('Exam deleted');
  });
}
function examClearAll(){
  showConfirm('Delete ALL exams and their study plans? This cannot be undone.', () => {
    const ids = (DB.exams||[]).map(e=>e.calEventId).filter(Boolean);
    if (DB.calendar) DB.calendar.events = (DB.calendar.events||[]).filter(e=>!ids.includes(e.id));
    DB.exams = []; DB.planner = (DB.planner||[]).filter(p=>!p.examId); examExpandedIds.clear();
    save(); examRender(); renderDExam(); renderPlanner(); toast('All exams cleared');
  });
}
function examToggleTask(examId, taskId){
  const ex = (DB.exams||[]).find(e=>e.id===examId); if (!ex) return;
  let newDone = null;
  for (const day of (ex.plan||[])) {
    const t = (day.tasks||[]).find(x=>x.id===taskId);
    if (t) { t.done = !t.done; newDone = t.done; break; }
  }
  if (newDone !== null) (DB.planner||[]).forEach(p=>{ if (p.examId===examId && p.examTaskId===taskId) p.done=newDone; });
  if (newDone === true) markStreakToday();
  save(); examRender(); renderDExam(); renderPlanner(); renderStreak();
}
// Jumps to the Exam Planner and expands the given exam's card, used by
// links from the Weekly Planner so study tasks and exams stay one click apart.
function examOpenAndExpand(id){
  go('exams');
  if (!examExpandedIds.has(id)) examExpandedIds.add(id);
  examRender();
  setTimeout(()=>{ const card=document.querySelector(`[data-exam-id="${id}"]`); if (card) card.scrollIntoView({behavior:'smooth',block:'center'}); }, 50);
}
function examToggleExpand(id){
  if (examExpandedIds.has(id)) examExpandedIds.delete(id); else examExpandedIds.add(id);
  examRender();
}
function examRender(){
  const el = g('exam-list'); if (!el) return;
  const exams = DB.exams||[];
  if (!exams.length) {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--ink4)"><div style="font-size:40px;margin-bottom:10px">⏳</div><p>No exams yet. Click "+ Add Exam" and Scholr will build a study plan for you.</p></div>';
    return;
  }
  const upcoming = exams.filter(e=>dLeft(e.date)>=0).sort((a,b)=>(b.pri??1)-(a.pri??1) || new Date(a.date)-new Date(b.date));
  const past = exams.filter(e=>dLeft(e.date)<0).sort((a,b)=>new Date(b.date)-new Date(a.date));
  let html = upcoming.length
    ? upcoming.map(ex=>examCardHTML(ex,false)).join('')
    : '<div style="padding:20px;text-align:center;color:var(--ink4);font-size:12.5px">No upcoming exams.</div>';
  if (past.length) {
    html += `<div class="sec-lbl" style="margin:18px 0 8px">Past Exams</div>` + past.map(ex=>examCardHTML(ex,true)).join('');
  }
  el.innerHTML = html;
}
const EXAM_PRI = {2:{lbl:'High',ic:'🔴'},1:{lbl:'Medium',ic:'🟡'},0:{lbl:'Low',ic:'🟢'}};
const EXAM_TYPE_IC = {Test:'📝',Quiz:'❓',['Final Exam']:'🎓',Presentation:'🎤',Lab:'🧪',Essay:'✍️',Other:'📋'};
function examCardHTML(ex, isPast){
  const days = dLeft(ex.date), badge = examCountdownBadge(days), prog = examProgress(ex);
  const expanded = examExpandedIds.has(ex.id);
  const dateLabel = new Date(ex.date+'T00:00:00').toLocaleDateString('en-CA',{weekday:'long',month:'long',day:'numeric'});
  const pri = EXAM_PRI[ex.pri??1], typeIc = EXAM_TYPE_IC[ex.type]||'📝';
  return `<div class="card" data-exam-id="${ex.id}" style="margin-bottom:12px;border-left:4px solid ${ex.ccolor||'var(--ac)'}">
    <div style="display:flex;gap:10px;align-items:flex-start;cursor:pointer" onclick="examToggleExpand('${ex.id}')">
      <div style="flex:1;min-width:0">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:4px">
          <span class="tag" style="background:${ex.ccolor}22;color:${ex.ccolor}">${escapeHtml(ex.course)}</span>
          <span class="tag" style="background:var(--s2);color:var(--ink3)">${typeIc} ${escapeHtml(ex.type||'Test')}</span>
          <span class="tag" style="background:var(--s2);color:var(--ink3)" title="Priority">${pri.ic} ${pri.lbl}</span>
          ${!isPast?`<span class="due ${badge.cls}">${badge.label}</span>`:`<span class="due">${dateLabel}</span>`}
        </div>
        <div style="font-weight:700;font-size:15px">${escapeHtml(ex.title)}</div>
        <div style="font-size:11.5px;color:var(--ink4);margin-top:2px">${dateLabel}${ex.time?' · '+escapeHtml(ex.time):''}${ex.location?' · '+escapeHtml(ex.location):''}${ex.window?' · '+ex.window+'-day plan':''}</div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0" onclick="event.stopPropagation()">
        <button class="btn bo sm" onclick="pomFocusOn('${ex.course.replace(/'/g,"\\'")}')" title="Start a focus session for this course">🍅</button>
        <button class="btn bo sm" onclick="examOpenEdit('${ex.id}')">✏️</button>
        <button class="btn bd sm" onclick="examDelete('${ex.id}')">🗑</button>
      </div>
    </div>
    ${!isPast?`<div style="height:5px;background:var(--bor);border-radius:99px;overflow:hidden;margin:10px 0 4px">
      <div style="height:100%;width:${prog.pct}%;background:${ex.ccolor||'var(--ac)'};border-radius:99px;transition:width .3s"></div>
    </div>
    <div style="font-size:10.5px;color:var(--ink4)">${prog.done}/${prog.total} study tasks done (${prog.pct}%)</div>`:''}
    ${expanded?examDetailHTML(ex):''}
  </div>`;
}
function examDetailHTML(ex){
  const notesList = (DB.notes||[]).filter(n=>n.course===ex.course).sort((a,b)=>new Date(b.updated||b.created)-new Date(a.updated||a.created)).slice(0,5);
  const deckList = (DB.flashcards?.decks||[]).filter(d=>d.courseId===ex.course);
  const hwList = (DB.hw||[]).filter(h=>h.course===ex.course && h.status!=='done');

  const planHTML = (ex.plan||[]).map(day => `
    <div style="margin-bottom:10px">
      <div style="font-size:11px;font-weight:800;color:var(--ink4);text-transform:uppercase;letter-spacing:.4px;margin-bottom:5px">${day.label}</div>
      ${day.tasks.map(t=>`<div class="hw-item" style="padding:5px 0">
        <div class="hw-cb ${t.done?'ck':''}" onclick="examToggleTask('${ex.id}','${t.id}')"></div>
        <div class="hw-body"><div class="hw-title ${t.done?'done':''}" style="white-space:normal">${t.kind==='review'?'🔁 ':''}${escapeHtml(t.text)}</div></div>
      </div>`).join('')}
    </div>`).join('') || '<p style="font-size:12px;color:var(--ink4)">No study days available before this exam.</p>';

  const notesHTML = notesList.length
    ? notesList.map(n=>`<div class="tag" style="cursor:pointer;background:var(--s2);color:var(--ink3)" onclick="go('notes');openNote('${n.id}')">📝 ${escapeHtml(n.title||'Untitled')}</div>`).join('')
    : '<span style="font-size:11.5px;color:var(--ink4)">No notes for this course yet</span>';
  const decksHTML = deckList.length
    ? deckList.map(d=>`<button class="btn bo sm" onclick="go('flashcards');fcStartStudy('${d.id}')">🃏 ${escapeHtml(d.name)}</button>`).join('')
    : '<span style="font-size:11.5px;color:var(--ink4)">No flashcard decks for this course yet</span>';
  const hwHTML = hwList.length ? hwList.map(hwRow).join('') : '<span style="font-size:11.5px;color:var(--ink4)">No pending homework for this course</span>';

  return `<div style="border-top:1px solid var(--bor);margin-top:10px;padding-top:12px">
    <div class="sec-lbl" style="margin-bottom:8px;display:flex;align-items:center;gap:8px">📅 Study Plan
      <button class="btn bo sm" style="margin-left:auto" onclick="event.stopPropagation();examSyncPlanner('${ex.id}')" title="Push these study tasks into the Weekly Planner">🗂️ Sync to Planner</button>
    </div>
    ${planHTML}
    <div class="sec-lbl" style="margin:14px 0 8px">🔗 Related Notes &amp; Flashcards</div>
    <div style="font-size:10.5px;font-weight:800;color:var(--ink4);text-transform:uppercase;letter-spacing:.4px;margin-bottom:5px">Notes</div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">${notesHTML}</div>
    <div style="font-size:10.5px;font-weight:800;color:var(--ink4);text-transform:uppercase;letter-spacing:.4px;margin-bottom:5px">Flashcard Decks</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">${decksHTML}</div>
    <div class="sec-lbl" style="margin:14px 0 8px">📋 Related Homework</div>
    <div>${hwHTML}</div>
  </div>`;
}

