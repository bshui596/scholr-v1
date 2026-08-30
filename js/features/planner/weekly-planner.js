/* ── GRADE GOALS ── */
function courseAvg(course){
  const cg=(DB.grades||[]).filter(g=>g.course===course);
  return cg.length ? cg.reduce((s,g)=>s+g.pct,0)/cg.length : null;
}
// The nearest not-yet-done homework item for a course — lets a Grade Goal
// answer "so what do I actually do about it?" instead of just showing a
// number that's behind target. Overdue items still count as "next", since
// they're still the most relevant thing sitting there.
function goalNextAssignment(course){
  const pending=(DB.hw||[]).filter(h=>h.course===course && h.status!=='done' && h.due);
  if(!pending.length) return null;
  return pending.sort((a,b)=>new Date(a.due)-new Date(b.due))[0];
}
function openGoal(course){
  showMo('mo-goal');
  const existing=(DB.goals||[]).find(x=>x.course===course);
  setTimeout(()=>{
    if(course) setSel('gl-co',course);
    if(existing){ g('gl-tg').value=existing.target; g('gl-dl').value=existing.deadline||''; g('gl-nt').value=existing.note||''; }
    else { g('gl-tg').value=''; g('gl-dl').value=''; g('gl-nt').value=''; }
  },0);
}
function saveGoal(){
  const course=g('gl-co').value, target=+g('gl-tg').value;
  if(!course){toast('Choose a course!');return;}
  if(!DB.courses.length){toast('Add courses in Settings first!');go('settings');return;}
  if(!target && target!==0 || target<0 || target>100){toast('Enter a target between 0–100!');return;}
  if(!DB.goals) DB.goals=[];
  const existing=DB.goals.find(x=>x.course===course);
  const payload={id:existing?existing.id:'gl'+Date.now(), course, target, deadline:g('gl-dl').value||'', note:g('gl-nt').value.trim()};
  if(existing) Object.assign(existing,payload); else DB.goals.push(payload);
  save(); closeMo('mo-goal'); renderGoals(); renderDashboard(); toast('🏆 Goal saved!');
}
function delGoal(id){ DB.goals=(DB.goals||[]).filter(x=>x.id!==id); save(); renderGoals(); renderDashboard(); }
function renderGoals(){
  const cont=g('gl-list'); if(!cont) return;
  const goals=DB.goals||[];
  if(!goals.length){ cont.innerHTML='<div class="emp"><span class="ei">🏆</span><p>No grade goals yet — set a target average for a course.</p></div>'; return; }
  cont.innerHTML = goals.map(gl=>{
    const c=DB.courses.find(c=>c.name===gl.course);
    const avg=courseAvg(gl.course);
    const pct = avg===null?0:Math.max(0,Math.min(100, avg));
    const onTrack = avg!==null && avg>=gl.target;
    const close = avg!==null && !onTrack && avg>=gl.target-5;
    const barColor = onTrack?'var(--ac)':close?'var(--amb)':avg===null?'var(--bor2)':'var(--red)';
    const daysLeft = gl.deadline? dLeft(gl.deadline) : null;
    let statusTxt;
    if(avg===null) statusTxt='No marks logged yet';
    else if(onTrack) statusTxt='✅ On track';
    else if(close) statusTxt=`⚠️ ${(gl.target-avg).toFixed(1)}% to go`;
    else statusTxt=`🔻 ${(gl.target-avg).toFixed(1)}% below target`;
    const nextHw = goalNextAssignment(gl.course);
    const nextHwOvd = nextHw && dLeft(nextHw.due)<0;
    const nextHwLine = nextHw
      ? `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid var(--bor);font-size:11px;cursor:pointer" onclick="event.stopPropagation();go('homework')" title="Go to Homework">
           <span style="color:var(--ink3);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📌 Next: ${escapeHtml(nextHw.title)}</span>
           <span style="color:${nextHwOvd?'var(--red)':'var(--ink4)'};font-weight:${nextHwOvd?'700':'400'};white-space:nowrap;margin-left:8px">${dueFmt(nextHw.due)}</span>
         </div>`
      : '';
    return `<div class="card" style="padding:14px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px">
        <div style="min-width:0">
          <div style="display:flex;align-items:center;gap:7px"><span style="width:9px;height:9px;border-radius:50%;background:${c?c.color:'#0F6B30'};flex-shrink:0;display:inline-block"></span><strong style="font-size:13.5px">${gl.course}</strong></div>
          ${gl.note?`<div style="font-size:11px;color:var(--ink4);margin-top:3px">${gl.note}</div>`:''}
        </div>
        <div style="display:flex;gap:2px;flex-shrink:0">
          <button onclick="openGrade('${gl.course}')" title="Add Mark" style="background:none;color:var(--ink4);cursor:pointer;font-size:12px;padding:2px 4px">➕</button>
          <button onclick="openGoal('${gl.course}')" title="Edit" style="background:none;color:var(--ink4);cursor:pointer;font-size:12px;padding:2px 4px">✎</button>
          <button onclick="delGoal('${gl.id}')" title="Delete" style="background:none;color:var(--ink4);cursor:pointer;font-size:12px;padding:2px 4px">✕</button>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:12px">
        <div style="font-family:var(--font-h);font-size:24px;font-weight:700;color:${barColor}">${avg!==null?avg.toFixed(1)+'%':'—'}</div>
        <div style="font-size:11px;color:var(--ink4)">Target ${gl.target}%</div>
      </div>
      <div class="gb-bar" style="width:100%;margin-top:7px"><div class="gb-fill" style="width:${pct}%;background:${barColor}"></div></div>
      <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:11px;color:var(--ink4)">
        <span>${statusTxt}</span>
        ${gl.deadline?`<span>${daysLeft<0?'Past deadline':daysLeft===0?'Due today':daysLeft+'d left'}</span>`:''}
      </div>
      ${nextHwLine}
    </div>`;
  }).join('');
}

function renderDGoals(){
  const el=g('d-goals'); if(!el) return;
  const goals=DB.goals||[];
  if(!goals.length){ el.style.display='none'; return; }
  el.style.display='block';
  const rows=goals.slice(0,3).map(gl=>{
    const avg=courseAvg(gl.course);
    const onTrack=avg!==null && avg>=gl.target;
    const color=onTrack?'var(--ac)':avg===null?'var(--bor2)':(avg>=gl.target-5?'var(--amb)':'var(--red)');
    const pct=avg===null?0:Math.max(0,Math.min(100,avg));
    return `<div style="margin-bottom:9px">
      <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:3px"><span>${gl.course}</span><span style="color:${color};font-weight:700">${avg!==null?avg.toFixed(0)+'%':'—'} / ${gl.target}%</span></div>
      <div class="gb-bar" style="width:100%"><div class="gb-fill" style="width:${pct}%;background:${color}"></div></div>
    </div>`;
  }).join('');
  el.innerHTML = `<div class="card" style="padding:14px;cursor:pointer" onclick="go('goals')">
    <div class="sec-lbl" style="margin-bottom:10px">🏆 Grade Goals</div>
    ${rows}
    ${goals.length>3?`<div style="font-size:11px;color:var(--ink4);text-align:center;margin-top:4px">+${goals.length-3} more →</div>`:''}
  </div>`;
}

