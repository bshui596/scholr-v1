/* ── DASHBOARD ── */
function renderDashboard() {
  const now = new Date(), h = now.getHours();
  setText('dg-time', h<12?'morning':h<17?'afternoon':'evening');
  setText('dg-name', DB.p.name||'there');
  setText('dg-date', now.toLocaleDateString('en-CA',{weekday:'long',month:'long',day:'numeric',year:'numeric'}));
  const pend = DB.hw.filter(x=>x.status!=='done'), done = DB.hw.filter(x=>x.status==='done'), tot=DB.hw.length;
  setText('st-pend', pend.length); setText('st-notes', DB.notes.length); setText('st-done', done.length);
  setBar('sf-pend', tot?pend.length/tot*100:0);
  setBar('sf-notes', Math.min(100, DB.notes.length*5));
  setBar('sf-done', tot?done.length/tot*100:0);
  if (DB.grades.length) {
    const avg = calcAvg(); setText('st-avg', avg.toFixed(0)+'%'); setBar('sf-avg', avg);
  } else { setText('st-avg','—'); setBar('sf-avg',0); }
  const hwEl = g('d-hw'), up = pend.slice(0,5);
  hwEl.innerHTML = up.length ? up.map(hwRow).join('') : '<div class="emp"><span class="ei">✅</span><p>No pending assignments!</p></div>';
  renderDSched();
  renderDExam();
  renderDGoals();
}
function renderDExam() {
  const el = g('d-exam'); if (!el) return;
  const upcoming = (DB.exams||[]).filter(e=>dLeft(e.date)>=0).sort((a,b)=>new Date(a.date)-new Date(b.date));
  if (!upcoming.length) { el.style.display='none'; return; }
  const ex = upcoming[0], days = dLeft(ex.date), badge = examCountdownBadge(days), prog = examProgress(ex);
  el.style.display = 'block';
  el.innerHTML = `<div class="card" style="cursor:pointer;border-left:4px solid ${ex.ccolor||'var(--ac)'}" onclick="go('exams')">
    <div class="sec-lbl" style="margin-bottom:6px">Next Exam</div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
      <div>
        <div style="font-weight:700;font-size:14px">${escapeHtml(ex.title)}</div>
        <div style="font-size:11px;color:var(--ink4);margin-top:2px">${escapeHtml(ex.course)}</div>
      </div>
      <span class="due ${badge.cls}" style="font-size:12px;white-space:nowrap">${badge.label}</span>
    </div>
    ${prog.total?`<div style="height:4px;background:var(--bor);border-radius:99px;overflow:hidden;margin-top:10px"><div style="height:100%;width:${prog.pct}%;background:${ex.ccolor||'var(--ac)'};border-radius:99px"></div></div><div style="font-size:10px;color:var(--ink4);margin-top:4px">${prog.done}/${prog.total} study tasks done</div>`:''}
  </div>`;
}
