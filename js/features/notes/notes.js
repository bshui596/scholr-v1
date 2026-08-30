/* ── HOMEWORK ── */
function saveHW() {
  const t=g('hw-ti').value.trim(); if(!t){toast('Enter a title!');return;}
  DB.hw.unshift({id:'h'+Date.now(),title:t,status:'todo',course:g('hw-co').value,link:g('hw-link').value.trim(),fields:collectHWFields('hw-fields'),due:g('hw-du').value,priority:g('hw-pr').value,notes:g('hw-no').value,created:new Date().toISOString()});
  save(); closeMo('mo-hw'); g('hw-ti').value=''; g('hw-no').value=''; g('hw-link').value=''; clearHWFields('hw-fields');
  renderHW(); renderDashboard(); updateBadge(); toast('Assignment added!');
}
function renderHW(filt) {
  if (filt!==undefined) hwFilt=filt;
  ['todo','ip','done'].forEach(s=>g('col-'+s).innerHTML='');
  const list = hwFilt==='all'?DB.hw:DB.hw.filter(h=>h.course===hwFilt);
  list.forEach(h=>(g('col-'+h.status)||g('col-todo')).appendChild(kcard(h)));
  ['todo','ip','done'].forEach(s=>setText('kc-'+s, list.filter(h=>h.status===s).length));
  const bar=g('hw-pills');
  bar.innerHTML=`<div class="pill ${hwFilt==='all'?'on':''}" onclick="renderHW('all')">All</div>`;
  DB.courses.forEach(c=>bar.innerHTML+=`<div class="pill ${hwFilt===c.name?'on':''}" onclick="renderHW('${c.name}')">${c.name}</div>`);
}
function kcard(h) {
  const d=document.createElement('div'); d.className=`kcard ${h.status==='done'?'done':''}`;
  const c=DB.courses.find(c=>c.name===h.course), col=c?.color||'#0F6B30';
  const ovd=h.due&&dLeft(h.due)<0&&h.status!=='done', urg=!ovd&&h.due&&dLeft(h.due)<=2&&h.status!=='done';
  const priC=h.priority==='High'?'background:#FEE2E2;color:#B91C1C':h.priority==='Medium'?'background:#FEF3C7;color:#92400E':'background:#D1FAE5;color:#065F46';
  const fieldTags=(h.fields||[]).filter(f=>f.k).map(f=>`<span class="tag" style="background:var(--s2);color:var(--ink)">${f.k}${f.v?': '+f.v:''}</span>`).join('');
  d.innerHTML=`<button class="kc-del" onclick="delHW('${h.id}')">✕</button><button class="kc-edit" onclick="editHW('${h.id}')" title="Edit">✏️</button><div class="kc-title">${h.title}</div>${h.notes?`<div style="font-size:11px;color:var(--ink3);margin-bottom:5px;line-height:1.4">${h.notes.substring(0,60)}</div>`:''}<div class="kc-tags"><span class="tag" style="background:${col}22;color:${col}">${h.course}</span>${h.link?`<a class="tag" href="${h.link}" target="_blank" style="background:var(--acll);color:var(--ac);border:1px solid var(--acl);text-decoration:none">Link</a>`:''}${fieldTags}<span class="tag" style="${priC}">${h.priority}</span></div>${h.due?`<div style="font-size:11px;font-weight:${ovd||urg?700:400};color:${ovd?'var(--red)':urg?'var(--amb)':'var(--ink4)'};margin-top:4px">${dueFmt(h.due)}</div>`:''}<div class="kc-acts">${h.status!=='todo'?`<button class="btn bo xs" onclick="mvHW('${h.id}','todo')">← To Do</button>`:''}${h.status!=='ip'?`<button class="btn xs" style="background:var(--ambl);color:var(--amb);border:none" onclick="mvHW('${h.id}','ip')">⚡ Progress</button>`:''}${h.status!=='done'?`<button class="btn bs xs" onclick="mvHW('${h.id}','done')">✅ Done</button>`:''}${h.status!=='done'?`<button class="btn bo xs" onclick="pomFocusOn('${h.course.replace(/'/g,"\\'")}')" title="Start a focus session for this course">🍅</button>`:''}</div>`;
  return d;
}
function mvHW(id,s){const h=DB.hw.find(x=>x.id===id);if(h){h.status=s;h.completedAt=s==='done'?Date.now():null;save();renderHW();renderDashboard();updateBadge();}}
function delHW(id){DB.hw=DB.hw.filter(x=>x.id!==id);save();renderHW();renderDashboard();updateBadge();}
function tglHW(id){const h=DB.hw.find(x=>x.id===id);if(h){h.status=h.status==='done'?'todo':'done';h.completedAt=h.status==='done'?Date.now():null;if(h.status==='done')markStreakToday();save();renderDashboard();renderHW();updateBadge();renderStreak();}}
function updateBadge(){setText('hw-badge',DB.hw.filter(h=>h.status!=='done').length);}

