/* ═══════════════════════════════════════════════════
   STUDY OVERVIEW (ANALYTICS)
   Pulls together data the app already collects elsewhere —
   Pomodoro session logs, homework completion timestamps,
   flashcard review logs, and the gradebook — into one page.
   Study-time-based metrics respect a Week/Month toggle (anPeriod);
   both windows are rolling (last 7 / last 30 days), not calendar
   periods. Grade Trend and Exam Prep aren't period-scoped — a
   trend needs enough grade entries to mean anything regardless of
   which window you're looking at, and exam prep is about what's
   left to do, not when you did it.
═══════════════════════════════════════════════════ */
let anPeriod = 'week';
function anSetPeriod(p, el){
  anPeriod = p;
  document.querySelectorAll('#an-period-tabs .pom-tab-btn').forEach(b => b.classList.remove('on'));
  el?.classList.add('on');
  renderAnalytics();
}
function analyticsPeriodDays(period){ return period === 'month' ? 30 : 7; }

function analyticsStudyForPeriod(period){
  const since = Date.now() - analyticsPeriodDays(period)*86400000;
  const entries = (DB.studyLog||[]).filter(e => e.ts >= since);
  const totalMinutes = entries.reduce((s,e) => s + (e.minutes||0), 0);
  const byCourse = {};
  entries.forEach(e => { const c = e.course || 'General'; byCourse[c] = (byCourse[c]||0) + (e.minutes||0); });
  return { totalMinutes, byCourse };
}

// Compares total study minutes in the current period to the equal-length
// period immediately before it (e.g. this week vs last week).
function analyticsStudyComparison(period){
  const days = analyticsPeriodDays(period), now = Date.now();
  const curStart = now - days*86400000, prevStart = curStart - days*86400000;
  const sum = (from, to) => (DB.studyLog||[]).filter(e => e.ts >= from && e.ts < to).reduce((s,e) => s+(e.minutes||0), 0);
  const curMins = sum(curStart, now + 1), prevMins = sum(prevStart, curStart);
  if (prevMins > 0) {
    const pct = Math.round((curMins-prevMins)/prevMins*100);
    return { direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat', pct };
  }
  return { direction: curMins > 0 ? 'new' : 'none', pct: null };
}

// Assignments marked done with completedAt in the window, split by whether
// that completion landed on/before the due date. No-due-date items count
// toward "completed" but are excluded from the on-time percentage.
function analyticsHwStats(period){
  const since = Date.now() - analyticsPeriodDays(period)*86400000;
  const completed = (DB.hw||[]).filter(h => h.status==='done' && h.completedAt && h.completedAt >= since);
  let onTime = 0, late = 0, noDue = 0;
  completed.forEach(h => {
    if (!h.due) { noDue++; return; }
    if (h.completedAt <= new Date(h.due+'T23:59:59').getTime()) onTime++; else late++;
  });
  const eligible = onTime + late;
  return { completedCount: completed.length, onTime, late, noDue, onTimePct: eligible ? Math.round(onTime/eligible*100) : null };
}

// Completion rate = of the assignments that were actually DUE inside this
// window, what fraction ended up done (regardless of when they were
// completed) — a "did you keep up with your due dates" metric, distinct
// from the "assignments completed" activity count above.
function analyticsHwCompletionRate(period){
  const since = Date.now() - analyticsPeriodDays(period)*86400000, now = Date.now();
  const dueInPeriod = (DB.hw||[]).filter(h => h.due && (() => { const t = new Date(h.due+'T23:59:59').getTime(); return t >= since && t <= now; })());
  const done = dueInPeriod.filter(h => h.status==='done');
  return { total: dueInPeriod.length, done: done.length, pct: dueInPeriod.length ? Math.round(done.length/dueInPeriod.length*100) : null };
}

const FC_EASE_WEIGHT = { hard: 0.3, good: 0.7, easy: 1 };
// "Performance" is a rough recall-quality score: Hard counts for little,
// Good counts for most of a correct recall, Easy counts fully. Only review
// log entries that actually recorded a rating count toward it.
function analyticsFlashcardStats(period){
  const since = Date.now() - analyticsPeriodDays(period)*86400000;
  const all = (DB.flashcards?.reviewLog||[]).filter(r => r.ts >= since);
  const rated = all.filter(r => FC_EASE_WEIGHT[r.ease] !== undefined);
  const counts = { hard: 0, good: 0, easy: 0 };
  rated.forEach(r => counts[r.ease]++);
  const pct = rated.length ? Math.round(rated.reduce((s,r) => s+FC_EASE_WEIGHT[r.ease], 0) / rated.length * 100) : null;
  return { total: all.length, rated: rated.length, pct, ...counts };
}

function analyticsMostLeastStudied(byCourse){
  const rows = Object.entries(byCourse).sort((a,b) => b[1]-a[1]);
  if (!rows.length) return { most: null, least: null };
  return {
    most: { name: rows[0][0], mins: rows[0][1] },
    least: rows.length > 1 ? { name: rows[rows.length-1][0], mins: rows[rows.length-1][1] } : null
  };
}

// Trend = average of the more-recent half of a course's grade entries minus
// the average of the earlier half. Needs at least 2 entries to say anything;
// with just 0 or 1, there's nothing to compare yet. Deliberately not
// period-scoped — grades don't come in often enough for a 7/30-day window
// to reliably contain two of them.
function analyticsGradeTrends(){
  return (DB.courses||[]).map(c => {
    const entries = (DB.grades||[]).filter(g => g.course===c.name).slice().sort((a,b) => new Date(a.date)-new Date(b.date));
    if (entries.length < 2) return { course: c.name, color: c.color, trend: null, entryCount: entries.length };
    const half = Math.floor(entries.length/2);
    const avg = arr => arr.reduce((s,x) => s+x.pct, 0) / arr.length;
    const trend = avg(entries.slice(half)) - avg(entries.slice(0, half));
    return { course: c.name, color: c.color, trend, entryCount: entries.length };
  });
}

// Current streak = consecutive calendar days (ending today, or yesterday if
// today has no session yet so the streak isn't shown as broken mid-day) with
// at least one logged focus session. Longest = best run in all-time history.
function analyticsStudyStreak(){
  const days = new Set((DB.studyLog||[]).map(e => new Date(e.ts).toDateString()));
  const todayStr = new Date().toDateString();
  const activeToday = days.has(todayStr);
  let cur = new Date();
  if (!activeToday) cur.setDate(cur.getDate()-1);
  let streak = 0;
  while (days.has(cur.toDateString())) { streak++; cur.setDate(cur.getDate()-1); }
  const sortedDays = Array.from(days).map(d => new Date(d).getTime()).sort((a,b)=>a-b);
  let longest = 0, run = 0, prev = null;
  sortedDays.forEach(t => {
    run = (prev !== null && t - prev === 86400000) ? run+1 : 1;
    longest = Math.max(longest, run);
    prev = t;
  });
  return { current: streak, longest, activeToday };
}

// Buckets logged focus-session minutes in the period by rough time of day.
function analyticsTimeOfDay(period){
  const since = Date.now() - analyticsPeriodDays(period)*86400000;
  const entries = (DB.studyLog||[]).filter(e => e.ts >= since);
  const buckets = { Morning:0, Afternoon:0, Evening:0, Night:0 };
  entries.forEach(e => {
    const h = new Date(e.ts).getHours();
    const b = (h>=5&&h<12) ? 'Morning' : (h>=12&&h<17) ? 'Afternoon' : (h>=17&&h<22) ? 'Evening' : 'Night';
    buckets[b] += (e.minutes||0);
  });
  return buckets;
}

// Average gap (in days) between an assignment's due date and when it was
// actually completed, for items completed within the period. Positive =
// finished ahead of the deadline on average; negative = finished after it.
function analyticsProcrastination(period){
  const since = Date.now() - analyticsPeriodDays(period)*86400000;
  const completed = (DB.hw||[]).filter(h => h.status==='done' && h.completedAt && h.completedAt>=since && h.due);
  if (!completed.length) return { count:0, avgDays:null };
  const diffs = completed.map(h => (new Date(h.due+'T23:59:59').getTime() - h.completedAt) / 86400000);
  return { count: completed.length, avgDays: diffs.reduce((s,d)=>s+d,0)/diffs.length };
}

// Pearson correlation, per course, between all-time total logged study
// minutes and average grade %. Not period-scoped for the same reason as
// grade trends: too sparse over a 7/30-day window. Needs >=2 courses that
// have both a grade entry and any study time to say anything.
function analyticsGradeStudyCorrelation(){
  const points = (DB.courses||[]).map(c => {
    const grades = (DB.grades||[]).filter(g => g.course===c.name);
    const avgGrade = grades.length ? grades.reduce((s,g)=>s+g.pct,0)/grades.length : null;
    const mins = (DB.studyLog||[]).filter(e => e.course===c.name).reduce((s,e)=>s+(e.minutes||0), 0);
    return { course: c.name, color: c.color, avgGrade, mins };
  }).filter(p => p.avgGrade !== null);
  if (points.length < 2) return { points, r: null };
  const xs = points.map(p=>p.mins), ys = points.map(p=>p.avgGrade), n = points.length;
  const mx = xs.reduce((a,b)=>a+b,0)/n, my = ys.reduce((a,b)=>a+b,0)/n;
  let num=0, dx2=0, dy2=0;
  for (let i=0;i<n;i++){ const dx=xs[i]-mx, dy=ys[i]-my; num+=dx*dy; dx2+=dx*dx; dy2+=dy*dy; }
  const r = (dx2===0||dy2===0) ? null : num/Math.sqrt(dx2*dy2);
  return { points, r };
}

function fmtHM(mins){ return `${Math.floor(mins/60)}h ${mins%60}m`; }

function renderAnalytics(){
  const period = anPeriod;
  const study = analyticsStudyForPeriod(period);
  const hwStats = analyticsHwStats(period);
  const cmp = analyticsStudyComparison(period);
  const periodLabel = period === 'month' ? 'Month' : 'Week';

  setText('an-hero-label', `Your ${periodLabel}`);
  setText('an-hero-time', fmtHM(study.totalMinutes));
  setText('an-hero-hw', hwStats.completedCount);
  setText('an-hero-ontime', hwStats.onTimePct===null ? '—' : hwStats.onTimePct+'%');
  setText('an-hero-cmp-label', `vs previous ${period}`);
  const cmpEl = g('an-hero-cmp');
  if (cmpEl) {
    if (cmp.direction === 'up') { cmpEl.textContent = `↑ ${cmp.pct}%`; cmpEl.style.color = 'var(--ac)'; }
    else if (cmp.direction === 'down') { cmpEl.textContent = `↓ ${Math.abs(cmp.pct)}%`; cmpEl.style.color = 'var(--red)'; }
    else if (cmp.direction === 'flat') { cmpEl.textContent = `→ 0%`; cmpEl.style.color = 'var(--ink4)'; }
    else if (cmp.direction === 'new') { cmpEl.textContent = `New this ${period}`; cmpEl.style.color = 'var(--ac)'; }
    else { cmpEl.textContent = '—'; cmpEl.style.color = 'var(--ink4)'; }
  }

  const compRate = analyticsHwCompletionRate(period);
  const mostLeast = analyticsMostLeastStudied(study.byCourse);
  const sum = g('an-week-sum');
  if (sum) sum.innerHTML = `
    <div class="gb-sc"><div class="gb-sv" style="color:${compRate.pct===null?'var(--ink4)':'var(--ac)'}">${compRate.pct===null?'—':compRate.pct+'%'}</div><div class="gb-sl">Completion Rate</div></div>
    <div class="gb-sc"><div class="gb-sv" style="font-size:20px;color:var(--ink2)">${hwStats.onTime} <span style="color:var(--ink4);font-weight:400">on-time</span> · ${hwStats.late} <span style="color:var(--ink4);font-weight:400">late</span></div><div class="gb-sl">On-Time vs Late</div></div>
    <div class="gb-sc"><div class="gb-sv" style="font-size:18px;color:var(--ac)">${mostLeast.most?escapeHtml(mostLeast.most.name):'—'}</div><div class="gb-sl">${mostLeast.most?fmtHM(mostLeast.most.mins)+' · ':''}Most Studied</div></div>
    <div class="gb-sc"><div class="gb-sv" style="font-size:18px;color:var(--ink3)">${mostLeast.least?escapeHtml(mostLeast.least.name):'—'}</div><div class="gb-sl">${mostLeast.least?fmtHM(mostLeast.least.mins)+' · ':''}Least Studied</div></div>
  `;

  const trendEl = g('an-grade-trend');
  if (trendEl) {
    const trends = analyticsGradeTrends();
    trendEl.innerHTML = trends.length ? trends.map(t => {
      let valHtml, dotColor = t.color || 'var(--ac)';
      if (t.trend === null) {
        valHtml = `<span style="color:var(--ink4);font-size:11.5px">${t.entryCount===0?'No grades yet':'Not enough data yet'}</span>`;
      } else {
        const arrow = t.trend > 0.5 ? '↑' : t.trend < -0.5 ? '↓' : '→';
        const color = t.trend > 0.5 ? 'var(--ac)' : t.trend < -0.5 ? 'var(--red)' : 'var(--ink4)';
        valHtml = `<span class="an-row-val" style="color:${color}">${arrow} ${Math.abs(t.trend) < 0.5 ? '0' : Math.abs(Math.round(t.trend))}%</span>`;
      }
      return `<div class="an-row"><span class="an-dot" style="background:${dotColor}"></span><span class="an-row-name">${escapeHtml(t.course)}</span>${valHtml}</div>`;
    }).join('') : '<div style="padding:16px 0;text-align:center;color:var(--ink4);font-size:12.5px">Add a course to see grade trends.</div>';
  }

  setText('an-study-time-sub', `Focus session minutes logged this ${period}, by course`);
  const stEl = g('an-study-time');
  if (stEl) {
    const rows = Object.entries(study.byCourse).sort((a,b) => b[1]-a[1]);
    const maxMin = rows.length ? rows[0][1] : 0;
    const colorFor = name => DB.courses.find(c => c.name===name)?.color || 'var(--ac)';
    stEl.innerHTML = rows.length ? rows.map(([name, mins]) => `
      <div class="an-row" style="display:block">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="an-dot" style="background:${colorFor(name)}"></span>
          <span class="an-row-name">${escapeHtml(name)}</span>
          <span class="an-row-val">${fmtHM(mins)}</span>
        </div>
        <div class="an-bar-track"><div class="an-bar-fill" style="width:${maxMin?Math.round(mins/maxMin*100):0}%;background:${colorFor(name)}"></div></div>
      </div>
    `).join('') : `<div style="padding:16px 0;text-align:center;color:var(--ink4);font-size:12.5px">No focus sessions logged this ${period} — start one from Pomodoro.</div>`;
  }

  const examEl = g('an-exam-progress');
  if (examEl) {
    const upcoming = (DB.exams||[]).filter(e => dLeft(e.date) >= 0).sort((a,b) => new Date(a.date)-new Date(b.date));
    examEl.innerHTML = upcoming.length ? upcoming.map(ex => {
      const prog = examProgress(ex), days = dLeft(ex.date);
      const daysLabel = days===0 ? 'Today' : days===1 ? 'Tomorrow' : `${days}d left`;
      return `<div class="an-row" style="display:block">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <span class="an-row-name">${escapeHtml(ex.title)} <span style="color:var(--ink4);font-weight:400">(${escapeHtml(ex.course)})</span></span>
          <span class="an-row-val" style="color:var(--ink4)">${daysLabel}</span>
        </div>
        <div class="an-bar-track"><div class="an-bar-fill" style="width:${prog.pct}%;background:${ex.ccolor||'var(--ac)'}"></div></div>
        <div style="font-size:10.5px;color:var(--ink4);margin-top:3px">${prog.done}/${prog.total} study tasks done${prog.total?` (${prog.pct}%)`:''}</div>
      </div>`;
    }).join('') : '<div style="padding:16px 0;text-align:center;color:var(--ink4);font-size:12.5px">No upcoming exams — add one in Exam Planner.</div>';
  }

  setText('an-fc-perf-sub', `How your review ratings broke down this ${period}`);
  const fcEl = g('an-fc-perf');
  if (fcEl) {
    const fc = analyticsFlashcardStats(period);
    if (!fc.rated) {
      fcEl.innerHTML = `<div style="padding:16px 0;text-align:center;color:var(--ink4);font-size:12.5px">No rated flashcard reviews this ${period} yet.</div>`;
    } else {
      const bar = (label, count, color) => `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="font-size:11px;color:var(--ink4);width:38px;flex-shrink:0">${label}</span>
          <div class="an-bar-track" style="flex:1;margin-top:0"><div class="an-bar-fill" style="width:${Math.round(count/fc.rated*100)}%;background:${color}"></div></div>
          <span style="font-size:11px;color:var(--ink3);width:26px;text-align:right;flex-shrink:0">${count}</span>
        </div>`;
      fcEl.innerHTML = `
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:12px">
          <span style="font-family:var(--font-h);font-size:26px;font-weight:700;color:var(--ac)">${fc.pct}%</span>
          <span style="font-size:11px;color:var(--ink4)">avg. recall quality · ${fc.rated} rated review${fc.rated===1?'':'s'}</span>
        </div>
        ${bar('Easy', fc.easy, 'var(--ac)')}
        ${bar('Good', fc.good, 'var(--blu)')}
        ${bar('Hard', fc.hard, 'var(--red)')}
      `;
    }
  }

  const streakEl = g('an-streak');
  if (streakEl) {
    const st = analyticsStudyStreak();
    streakEl.innerHTML = `
      <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:8px">
        <span style="font-family:var(--font-h);font-size:30px;font-weight:700;color:var(--ac)">${st.current}</span>
        <span style="font-size:11px;color:var(--ink4)">day${st.current===1?'':'s'} in a row${st.activeToday?'':' — log one today to keep it going'}</span>
      </div>
      <div style="font-size:11px;color:var(--ink4)">Longest streak: <strong style="color:var(--ink2)">${st.longest} day${st.longest===1?'':'s'}</strong></div>
    `;
  }

  setText('an-tod-sub', `When you studied this ${period}`);
  const todEl = g('an-tod');
  if (todEl) {
    const buckets = analyticsTimeOfDay(period);
    const total = Object.values(buckets).reduce((a,b)=>a+b,0);
    const order = [['Morning','☀️'],['Afternoon','🌤'],['Evening','🌆'],['Night','🌙']];
    todEl.innerHTML = total ? order.map(([name,ic]) => {
      const mins = buckets[name];
      return `<div class="an-row" style="display:block">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="width:16px;text-align:center">${ic}</span>
          <span class="an-row-name">${name}</span>
          <span class="an-row-val">${fmtHM(mins)}</span>
        </div>
        <div class="an-bar-track"><div class="an-bar-fill" style="width:${Math.round(mins/total*100)}%;background:var(--ac)"></div></div>
      </div>`;
    }).join('') : `<div style="padding:16px 0;text-align:center;color:var(--ink4);font-size:12.5px">No focus sessions logged this ${period} yet.</div>`;
  }

  setText('an-procrast-sub', `Based on assignments completed this ${period}`);
  const procEl = g('an-procrast');
  if (procEl) {
    const pr = analyticsProcrastination(period);
    if (!pr.count) {
      procEl.innerHTML = `<div style="padding:16px 0;text-align:center;color:var(--ink4);font-size:12.5px">No completed assignments with due dates this ${period} yet.</div>`;
    } else {
      const early = pr.avgDays >= 0;
      const days = Math.abs(pr.avgDays).toFixed(1);
      procEl.innerHTML = `
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px">
          <span style="font-family:var(--font-h);font-size:26px;font-weight:700;color:${early?'var(--ac)':'var(--red)'}">${days}</span>
          <span style="font-size:11px;color:var(--ink4)">day${days==='1.0'?'':'s'} ${early?'ahead of':'past'} the due date, on average</span>
        </div>
        <div style="font-size:11px;color:var(--ink4)">Based on ${pr.count} completed assignment${pr.count===1?'':'s'} with a due date</div>
      `;
    }
  }

  const corrEl = g('an-corr');
  if (corrEl) {
    const cor = analyticsGradeStudyCorrelation();
    if (cor.points.length < 2) {
      corrEl.innerHTML = `<div style="padding:16px 0;text-align:center;color:var(--ink4);font-size:12.5px">Need grades logged in at least 2 courses to compare against study time.</div>`;
    } else {
      const r = cor.r;
      let label, color;
      if (r === null) { label = 'Not enough spread to tell'; color = 'var(--ink4)'; }
      else if (r > 0.5) { label = 'Strong positive link'; color = 'var(--ac)'; }
      else if (r > 0.2) { label = 'Mild positive link'; color = 'var(--ac)'; }
      else if (r > -0.2) { label = 'No clear link'; color = 'var(--ink4)'; }
      else if (r > -0.5) { label = 'Mild negative link'; color = 'var(--amb)'; }
      else { label = 'Strong negative link'; color = 'var(--red)'; }
      corrEl.innerHTML = `
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:10px">
          <span style="font-family:var(--font-h);font-size:26px;font-weight:700;color:${color}">${r===null?'—':r.toFixed(2)}</span>
          <span style="font-size:11px;color:${color}">${label}</span>
        </div>
        ${cor.points.slice().sort((a,b)=>b.avgGrade-a.avgGrade).map(p => `
          <div class="an-row"><span class="an-dot" style="background:${p.color||'var(--ac)'}"></span><span class="an-row-name">${escapeHtml(p.course)}</span><span class="an-row-val">${p.avgGrade.toFixed(0)}% · ${fmtHM(p.mins)}</span></div>
        `).join('')}
        <div style="font-size:10px;color:var(--ink4);margin-top:6px">All-time avg. grade vs. total logged study minutes, per course</div>
      `;
    }
  }
}

