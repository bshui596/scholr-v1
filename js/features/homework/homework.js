/* ── WHAT SHOULD I DO? ── */
// Combines three very different data shapes into one ranked list:
//   - homework: has explicit due dates + priority, so urgency is direct.
//   - exams: urgency comes from days-until-exam, boosted by how many study
//     plan tasks are still unchecked (a close exam with no prep done should
//     outrank a close exam that's already mostly studied).
//   - flashcards: the hardest of the three, because decks have no due date
//     or study-plan concept at all. We approximate "should study this deck"
//     from two signals: (1) is it linked to a course with an upcoming exam
//     (via deck.courseId matching exam.course), and (2) how long since it
//     was last opened for study (deck.lastStudied, set by fcStartStudy).
//     A deck tied to a near exam and never studied can still surface as the
//     top recommendation; otherwise flashcards act as a low-priority
//     "keep it fresh" suggestion that only wins when nothing else is urgent.
let wtdCurrent = null;

function wtdHwCandidates() {
  const pending = (DB.hw || []).filter(h => h.status !== 'done');
  return pending.map(h => {
    const days = h.due ? dLeft(h.due) : null;
    let urgency = 10, urgencyLevel = 'low', reason = '';
    if (days === null) { urgency = 5; }
    else if (days < 0) { urgency = 100; urgencyLevel = 'high'; reason = `It's overdue by ${Math.abs(days)} day${Math.abs(days)===1?'':'s'}.`; }
    else if (days === 0) { urgency = 90; urgencyLevel = 'high'; reason = `It's due today.`; }
    else if (days === 1) { urgency = 75; urgencyLevel = 'high'; reason = `It's due tomorrow.`; }
    else if (days <= 3) { urgency = 55; urgencyLevel = 'med'; reason = `It's due in ${days} days.`; }
    else if (days <= 7) { urgency = 30; urgencyLevel = 'low'; }
    else { urgency = 10; urgencyLevel = 'low'; }
    const priW = h.priority === 'High' ? 30 : h.priority === 'Medium' ? 15 : 5;
    const ipBonus = h.status === 'ip' ? 10 : 0;
    const score = urgency + priW + ipBonus;
    let est = h.priority === 'High' ? 45 : h.priority === 'Medium' ? 30 : 20;
    if (days !== null && days < 0) est += 15;
    if (!reason) {
      if (h.priority === 'High') reason = `It's marked High priority.`;
      else if (h.status === 'ip') reason = `You've already started this one — worth finishing.`;
      else reason = `It's your most urgent incomplete assignment.`;
    }
    const c = DB.courses.find(c => c.name === h.course);
    return { type: 'hw', id: h.id, title: h.title, score, urgencyLevel, reason, estMin: est,
      dueLabel: h.due ? dueFmt(h.due) : 'No due date', color: c?.color || 'var(--ac)' };
  });
}

function wtdExamCandidates() {
  const exams = (DB.exams || []).filter(e => dLeft(e.date) >= 0 && dLeft(e.date) <= 21);
  return exams.map(ex => {
    const days = dLeft(ex.date);
    let urgency = 8, urgencyLevel = 'low';
    if (days === 0) { urgency = 95; urgencyLevel = 'high'; }
    else if (days === 1) { urgency = 85; urgencyLevel = 'high'; }
    else if (days <= 3) { urgency = 65; urgencyLevel = 'med'; }
    else if (days <= 7) { urgency = 40; urgencyLevel = 'med'; }
    else if (days <= 14) { urgency = 20; urgencyLevel = 'low'; }
    else { urgency = 8; urgencyLevel = 'low'; }
    const prog = examProgress(ex);
    const remaining = prog.total - prog.done;
    const remainingBonus = Math.min(remaining * 4, 20);
    const priW = (ex.pri ?? 1) * 12;
    const score = urgency + remainingBonus + priW;
    const next = examNextTask(ex);
    const badge = examCountdownBadge(days);
    let est = 40 + Math.min(remaining, 3) * 5;
    let reason;
    if (next) {
      reason = days <= 1
        ? `Your ${ex.course} exam is ${days === 0 ? 'today' : 'tomorrow'} and this study task is still unchecked.`
        : `${remaining} study task${remaining===1?'':'s'} left before your ${ex.course} exam in ${days} days.`;
    } else if (prog.total && remaining === 0) {
      reason = `You've finished the study plan — a light review keeps it fresh before the exam.`;
      est = 20;
    } else {
      reason = `No study plan yet for an exam in ${days} day${days===1?'':'s'}.`;
    }
    return { type: 'exam', id: ex.id, title: `${ex.title} (${ex.course})`, score, urgencyLevel, reason, estMin: est,
      dueLabel: badge.label, color: ex.ccolor || 'var(--ac)' };
  });
}

// Finds the most relevant unfinished study-plan task: today's if there is
// one, otherwise the earliest day that still has something unchecked.
function examNextTask(ex) {
  const todayIso = examIsoDate(new Date());
  const todayDay = (ex.plan || []).find(d => d.date === todayIso);
  if (todayDay) {
    const t = (todayDay.tasks || []).find(t => !t.done);
    if (t) return { task: t, day: todayDay };
  }
  for (const day of (ex.plan || [])) {
    const t = (day.tasks || []).find(t => !t.done);
    if (t) return { task: t, day };
  }
  return null;
}

// Per-deck view of how many cards fcRateCard has actually scheduled for
// review. A card with no nextReview yet (never rated) counts as due now.
function fcDeckDueStats(deckId) {
  const cards = (DB.flashcards?.cards || []).filter(c => c.deckId === deckId);
  const now = Date.now();
  let due = 0, mostOverdueDays = 0;
  cards.forEach(c => {
    if (!c.nextReview) { due++; return; }
    if (c.nextReview <= now) {
      due++;
      mostOverdueDays = Math.max(mostOverdueDays, Math.floor((now - c.nextReview) / 86400000));
    }
  });
  return { total: cards.length, due, mostOverdueDays };
}

function wtdFlashcardCandidates() {
  const decks = (DB.flashcards?.decks || []);
  const upcomingExams = (DB.exams || []).filter(e => dLeft(e.date) >= 0 && dLeft(e.date) <= 14);
  return decks.map(deck => {
    const stats = fcDeckDueStats(deck.id);
    if (!stats.total) return null;
    const linkedExam = deck.courseId
      ? upcomingExams.filter(e => e.course === deck.courseId).sort((a, b) => dLeft(a.date) - dLeft(b.date))[0]
      : null;
    const examDays = linkedExam ? dLeft(linkedExam.date) : null;
    const examUrgency = linkedExam ? (examDays === 0 ? 95 : examDays === 1 ? 85 : examDays <= 3 ? 65 : examDays <= 7 ? 40 : 20) : 0;
    const daysSince = deck.lastStudied ? Math.floor((Date.now() - deck.lastStudied) / 86400000) : null;

    let score, urgencyLevel, reason, dueLabel;
    if (stats.due > 0) {
      // Cards are actually due by the SM-2 schedule — this is the strongest signal.
      const dueUrgency = Math.min(15 + stats.due * 3 + stats.mostOverdueDays * 2, 55);
      score = dueUrgency + examUrgency * 0.5;
      urgencyLevel = stats.mostOverdueDays > 3 || score > 60 ? 'high' : score > 30 ? 'med' : 'low';
      dueLabel = `${stats.due} card${stats.due === 1 ? '' : 's'} due for review`;
      reason = linkedExam
        ? `${stats.due} card${stats.due === 1 ? '' : 's'} are due for review, and your ${linkedExam.course} exam is in ${examDays} day${examDays === 1 ? '' : 's'}.`
        : stats.mostOverdueDays > 0
          ? `${stats.due} card${stats.due === 1 ? '' : 's'} are overdue for review (up to ${stats.mostOverdueDays} day${stats.mostOverdueDays === 1 ? '' : 's'} late).`
          : `${stats.due} card${stats.due === 1 ? '' : 's'} are due for review today.`;
    } else if (linkedExam) {
      // Nothing due by the schedule, but an exam is close enough to be worth a look anyway.
      score = examUrgency * 0.35;
      urgencyLevel = examDays <= 3 ? 'med' : 'low';
      dueLabel = `${linkedExam.course} exam in ${examDays} day${examDays === 1 ? '' : 's'}`;
      reason = `Your ${linkedExam.course} exam is in ${examDays} day${examDays === 1 ? '' : 's'} — nothing's due yet, but a review can't hurt.`;
    } else {
      // Nothing due, nothing linked — small "keep it fresh" nudge only.
      const staleBonus = daysSince === null ? 8 : daysSince > 14 ? 6 : daysSince > 7 ? 3 : 0;
      score = 4 + staleBonus;
      urgencyLevel = 'low';
      dueLabel = daysSince === null ? 'Never studied' : `Studied ${daysSince} day${daysSince === 1 ? '' : 's'} ago`;
      reason = daysSince === null
        ? `This deck has never been studied — a quick review keeps it fresh.`
        : `Nothing's due yet, but it's been ${daysSince} day${daysSince === 1 ? '' : 's'} since you last opened this deck.`;
    }
    const estMin = Math.max(10, Math.min(30, Math.round((stats.due || stats.total) * 0.5)));
    return { type: 'fc', id: deck.id, title: deck.name, score, urgencyLevel, reason, estMin, dueLabel, color: deck.color || 'var(--ac)' };
  }).filter(Boolean);
}

// Grade goals live entirely on their own page (courseAvg vs gl.target) with
// no link to the daily task recommender — a course can be quietly slipping
// behind its goal for weeks and never surface here unless it also happens to
// have homework or an exam due. This closes that gap: a goal that's
// meaningfully behind target becomes its own "catch up" candidate, weighted
// by how far behind it is and, if a deadline is set, how close that is.
function wtdGoalCandidates() {
  const goals = DB.goals || [];
  return goals.map(gl => {
    const avg = courseAvg(gl.course);
    if (avg === null) return null; // no marks logged yet — nothing actionable to recommend
    const gap = gl.target - avg;
    if (gap < 2) return null; // on track or only trivially behind — don't nag
    const days = gl.deadline ? dLeft(gl.deadline) : null;
    let urgency = Math.min(10 + gap * 2, 60);
    if (days !== null) {
      if (days < 0) urgency += 25;
      else if (days <= 3) urgency += 30;
      else if (days <= 7) urgency += 18;
      else if (days <= 14) urgency += 8;
    }
    const score = urgency;
    const urgencyLevel = gap >= 10 ? 'high' : gap >= 5 ? 'med' : 'low';
    const c = DB.courses.find(c => c.name === gl.course);
    const nextHw = goalNextAssignment(gl.course);
    const hwClause = nextHw ? ` "${nextHw.title}" is due ${dueFmt(nextHw.due).toLowerCase()} — a good place to focus.` : '';
    const reason = (days !== null
      ? `Your ${gl.course} average is ${gap.toFixed(1)}% below your ${gl.target}% goal, ${days < 0 ? 'and the deadline has passed' : `with ${days} day${days === 1 ? '' : 's'} left`}.`
      : `Your ${gl.course} average is ${gap.toFixed(1)}% below your ${gl.target}% goal.`) + hwClause;
    return { type: 'goal', id: gl.id, title: `Catch up in ${gl.course}`, score, urgencyLevel, reason, estMin: 25,
      dueLabel: days !== null ? (days < 0 ? 'Past deadline' : dueFmt(gl.deadline)) : `${avg.toFixed(1)}% avg`, color: c?.color || 'var(--ac)' };
  }).filter(Boolean);
}

function computeWhatToDo() {
  const all = [...wtdHwCandidates(), ...wtdExamCandidates(), ...wtdFlashcardCandidates(), ...wtdGoalCandidates()];
  if (!all.length) return { top: null, others: [] };
  all.sort((a, b) => b.score - a.score);
  return { top: all[0], others: all.slice(1, 4) };
}

const WTD_TYPE_LABEL = { hw: '📚 Homework', exam: '📝 Exam Prep', fc: '🃏 Flashcards', goal: '🏆 Goal Catch-up' };

function openWhatNow() {
  const result = computeWhatToDo();
  const body = g('wtd-body'), goBtn = g('wtd-go-btn');
  if (!result.top) {
    wtdCurrent = null;
    goBtn.style.display = 'none';
    body.innerHTML = `<div class="emp" style="padding:20px 0"><span class="ei">✅</span><p>You're all caught up! No pending tasks right now.</p></div>`;
  } else {
    const r = result.top;
    wtdCurrent = r;
    goBtn.style.display = '';
    const dot = r.urgencyLevel === 'high' ? '🔴' : r.urgencyLevel === 'med' ? '🟡' : '🟢';
    body.innerHTML = `
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;color:var(--ac);margin-bottom:10px">Recommended</div>
      <div class="card" style="border-left:4px solid ${r.color};padding:16px;margin-bottom:14px">
        <div style="font-size:10.5px;font-weight:700;color:var(--ink4);margin-bottom:6px">${WTD_TYPE_LABEL[r.type]}</div>
        <div style="font-size:15px;font-weight:700;margin-bottom:6px">${dot} ${escapeHtml(r.title)}</div>
        <div style="font-size:12px;color:var(--ink4);margin-bottom:10px">${escapeHtml(r.dueLabel)}</div>
        <div style="font-size:12px;color:var(--ink3);margin-bottom:8px"><strong>Estimated time:</strong> ${r.estMin} minutes</div>
        <div style="font-size:12px;color:var(--ink3);line-height:1.5"><strong>Why:</strong> ${escapeHtml(r.reason)}</div>
      </div>
      ${result.others.length ? `<div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;color:var(--ink4);margin-bottom:6px">Also worth doing</div>${result.others.map(o => `<div style="font-size:12px;color:var(--ink3);padding:7px 0;border-top:1px solid var(--bor);display:flex;justify-content:space-between;gap:8px"><span>${WTD_TYPE_LABEL[o.type].split(' ')[0]} ${escapeHtml(o.title)}</span><span style="color:var(--ink4);white-space:nowrap">${escapeHtml(o.dueLabel)}</span></div>`).join('')}` : ''}
    `;
  }
  showMo('mo-whatnow');
}
function wtdGoToTask() {
  if (!wtdCurrent) { closeMo('mo-whatnow'); return; }
  closeMo('mo-whatnow');
  if (wtdCurrent.type === 'hw') {
    go('homework');
  } else if (wtdCurrent.type === 'exam') {
    go('exams');
    if (!examExpandedIds.has(wtdCurrent.id)) examToggleExpand(wtdCurrent.id);
  } else if (wtdCurrent.type === 'fc') {
    go('flashcards');
    fcStartStudy(wtdCurrent.id);
  } else if (wtdCurrent.type === 'goal') {
    go('goals');
  }
}
function hwRow(h) {
  const c = DB.courses.find(c=>c.name===h.course);
  const d=h.due?dueFmt(h.due):'', ovd=h.due&&dLeft(h.due)<0, urg=!ovd&&h.due&&dLeft(h.due)<=2;
  const meta = [];
  if(c) meta.push(`<span class="tag" style="background:${c.color}22;color:${c.color}">${c.name}</span>`);
  if(h.link) meta.push(`<a class="tag" href="${h.link}" target="_blank" style="background:var(--acll);color:var(--ac);border:1px solid var(--acl);text-decoration:none">Link</a>`);
  (h.fields||[]).forEach(f=>{ if(f.k) meta.push(`<span class="tag" style="background:var(--s2);color:var(--ink)">${f.k}${f.v?': '+f.v:''}</span>`); });
  return `<div class="hw-item"><div class="hw-cb ${h.status==='done'?'ck':''}" onclick="tglHW('${h.id}')"></div><div class="hw-body"><div class="hw-title ${h.status==='done'?'done':''}">${h.title}</div><div class="hw-meta">${meta.join('')}${d?`<span class="due ${ovd?'ovd':urg?'urg':''}">${d}</span>`:''}</div></div></div>`;
}
function renderDSched() {
  const el=g('d-sched');
  // Use current day from schedule
  const dn=DB.schedule?.dayNum||1, day=DB.schedule?.days?.[dn];
  if(!day||day.status==='off'){el.innerHTML='<div class="emp"><span class="ei">🏖</span><p>Day off today!</p></div>';return;}
  const slots=DB.slots||[];
  const today=[];
  slots.forEach((slot,si)=>{ const cls=(day.slots||{})[si]; if(cls) today.push({slot,...cls}); });
  if(!today.length){el.innerHTML='<div class="emp"><span class="ei">🗓</span><p>No classes for '+(day.label||'Day '+dn)+'</p></div>';return;}
  const nm=new Date().getHours()*60+new Date().getMinutes();
  el.innerHTML=today.map(cls=>{
    const c=DB.courses.find(c=>c.name===cls.course),col=c?.color||'#0F6B30',now=Math.abs(slotMin(cls.slot)-nm)<80;
    return `<div class="sch-item ${now?'cur':''}"><div class="sch-t">${cls.slot}</div><div class="sch-dot" style="background:${col}"></div><div style="flex:1"><div style="font-size:12px;font-weight:600">${now?'🟢 ':''}${cls.course}</div><div style="font-size:10.5px;color:var(--ink4)">${cls.period||''} ${cls.room?'· '+cls.room:''}</div></div></div>`;
  }).join('');
}
function slotMin(s) {
  const m=s.match(/(\d+):(\d+)\s*(AM|PM)?/i); if(!m) return 0;
  let h=+m[1],mn=+m[2];
  if(m[3]?.toUpperCase()==='PM'&&h<12) h+=12;
  if(m[3]?.toUpperCase()==='AM'&&h===12) h=0;
  return h*60+mn;
}
function setBar(id,pct) { const e=g(id); if(e) e.style.width=Math.max(0,Math.min(100,pct))+'%'; }
function dueFmt(ds) { const d=dLeft(ds); if(d<0)return'Overdue'; if(d===0)return'Due today'; if(d===1)return'Tomorrow'; if(d<=6)return`In ${d}d`; return new Date(ds).toLocaleDateString('en-CA',{month:'short',day:'numeric'}); }
function dLeft(ds) { const d=new Date(ds); d.setHours(23,59,59); return Math.ceil((d-new Date())/86400000); }

