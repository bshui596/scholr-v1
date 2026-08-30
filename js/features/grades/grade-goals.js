/* ── GRADES ── */
function saveGrade(){
  const name=g('gr-na').value.trim(); if(!name){toast('Enter a name!');return;}
  const mark=+g('gr-mk').value, out=+g('gr-of').value||100;
  if(isNaN(mark)){toast('Enter a valid mark!');return;}
  DB.grades.push({id:'g'+Date.now(),name,course:g('gr-co').value,cat:g('gr-ca').value,mark,out,pct:Math.round(mark/out*100),wt:+g('gr-wt').value||25,date:g('gr-dt').value,notes:g('gr-nt').value});
  save(); closeMo('mo-gr'); g('gr-na').value=''; renderGrades(); renderGoals(); renderDashboard(); toast('Mark added!');
}
function calcAvg(){return DB.grades.length?DB.grades.reduce((s,g)=>s+g.pct,0)/DB.grades.length:0;}
function lGrade(p){if(p>=90)return'A+';if(p>=85)return'A';if(p>=80)return'A-';if(p>=77)return'B+';if(p>=73)return'B';if(p>=70)return'B-';if(p>=67)return'C+';if(p>=63)return'C';if(p>=60)return'C-';if(p>=57)return'D+';if(p>=53)return'D';if(p>=50)return'D-';return'F';}
function lKey(l){return l.startsWith('A')?'A':l.startsWith('B')?'B':l.startsWith('C')?'C':l.startsWith('D')?'D':'F';}
function renderGrades(){
  const sum=g('gb-sum'), cont=g('gb-cr');
  const avg=DB.grades.length?calcAvg():null, ltr=avg!==null?lGrade(avg):null, lk=ltr?lKey(ltr):'A';
  const hi=DB.grades.length?Math.max(...DB.grades.map(g=>g.pct)):null, lo=DB.grades.length?Math.min(...DB.grades.map(g=>g.pct)):null;
  sum.innerHTML=`<div class="gb-sc"><div class="gb-sv" style="color:var(--ac)">${avg!==null?avg.toFixed(1)+'%':'—'}</div><div class="gb-sl">Overall Average</div></div><div class="gb-sc"><div class="gb-sv" style="color:${GR_CLR[lk]?.fg||'var(--ink)'}">${ltr||'—'}</div><div class="gb-sl">Letter Grade</div></div><div class="gb-sc"><div class="gb-sv" style="color:var(--ac2)">${hi!==null?hi+'%':'—'}</div><div class="gb-sl">Highest</div></div><div class="gb-sc"><div class="gb-sv" style="color:var(--red)">${lo!==null?lo+'%':'—'}</div><div class="gb-sl">Lowest</div></div><div class="gb-sc"><div class="gb-sv">${DB.grades.length}</div><div class="gb-sl">Total Entries</div></div>`;
  cont.innerHTML='';
  if(!DB.courses.length){cont.innerHTML='<div class="emp"><span class="ei">📊</span><p>Add courses in Settings</p></div>';return;}
  DB.courses.forEach(c=>{
    const cg=DB.grades.filter(gg=>gg.course===c.name), ca=cg.length?cg.reduce((s,gg)=>s+gg.pct,0)/cg.length:null;
    const cl=ca!==null?lGrade(ca):null, clk=cl?lKey(cl):'A';
    const goal=(DB.goals||[]).find(x=>x.course===c.name);
    const goalBadge = goal ? `<span class="tag" onclick="event.stopPropagation();go('goals')" title="Goal: ${goal.target}% — click to view Grade Goals" style="cursor:pointer;background:var(--acll);color:var(--ac);font-weight:700">🎯 ${goal.target}%</span>` : '';
    const div=document.createElement('div'); div.className='gb-course';
    div.innerHTML=`<div class="gb-ch" onclick="this.nextElementSibling.classList.toggle('open')"><span style="width:9px;height:9px;border-radius:50%;background:${c.color};display:inline-block;flex-shrink:0"></span><span class="gb-cn">${c.name}</span>${ca!==null?`<span class="gb-avg" style="color:${c.color}">${ca.toFixed(1)}%</span><span class="gb-ltr" style="background:${GR_CLR[clk]?.bg};color:${GR_CLR[clk]?.fg}">${cl}</span>`:'<span style="font-size:12.5px;color:var(--ink4)">No marks</span>'}${goalBadge}<span style="margin-left:8px;color:var(--ink4);font-size:11px">▼</span></div><div class="gb-bd">${cg.length?`<table class="gb-tbl"><thead><tr><th>Assignment</th><th>Category</th><th>Mark</th><th>%</th><th>Bar</th><th>Date</th><th></th></tr></thead><tbody>${cg.map(gg=>{const lk2=lKey(lGrade(gg.pct));return`<tr><td><strong>${gg.name}</strong>${gg.notes?`<div style="font-size:10.5px;color:var(--ink4)">${gg.notes}</div>`:''}</td><td><span class="tag" style="background:var(--s2);color:var(--ink)">${gg.cat||'General'}</span></td><td>${gg.mark}/${gg.out}</td><td style="font-weight:700;color:${GR_CLR[lk2]?.fg||'var(--ink)'}">${gg.pct}%</td><td><div class="gb-bar"><div class="gb-fill" style="width:${gg.pct}%;background:${c.color}"></div></div></td><td style="font-size:11px;color:var(--ink4)">${gg.date||''}</td><td><button onclick="delGrade('${gg.id}')" style="background:none;color:var(--ink4);cursor:pointer;font-size:11px">✕</button></td></tr>`;}).join('')}</tbody></table>`:'<div style="padding:13px;font-size:12.5px;color:var(--ink4)">No marks yet</div>'}<button class="gb-add" onclick="openGrade('${c.name}')">+ Add Mark for ${c.name}</button></div>`;
    cont.appendChild(div);
  });
}
function openGrade(course){populateSels();setSel('gr-co',course);showMo('mo-gr');}
function delGrade(id){DB.grades=DB.grades.filter(g=>g.id!==id);save();renderGrades();renderDashboard();renderGoals();}

