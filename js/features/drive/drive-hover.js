/* ── INTERFACE CUSTOMIZATION ── */
function setShadow(v){
  DB.p.shadow=v; save();
  const sh={'flat':'none','subtle':'0 1px 2px rgba(0,0,0,.05)','default':'0 4px 16px rgba(0,0,0,.07),0 2px 4px rgba(0,0,0,.04)','strong':'0 8px 30px rgba(0,0,0,.14),0 4px 8px rgba(0,0,0,.08)'};
  document.documentElement.style.setProperty('--sh2',sh[v]||sh.default);
}
function setBtnStyle(v){
  DB.p.btnStyle=v; save();
  document.documentElement.setAttribute('data-btn', v || 'default');
}
function checklistAdd(){
  const input = g('cl-input'); if(!input) return;
  const title = input.value.trim(); if(!title){toast('Add a checklist item first');return;}
  DB.checklist = DB.checklist||[];
  DB.checklist.unshift({id:'c'+Date.now(),title,done:false,created:new Date().toISOString()});
  input.value=''; save(); renderChecklist(); toast('Checklist item added');
}
function toggleChecklist(id){
  const item = (DB.checklist||[]).find(x=>x.id===id); if(!item) return;
  item.done = !item.done; save(); renderChecklist();
}
function removeChecklist(id){
  DB.checklist = (DB.checklist||[]).filter(x=>x.id!==id); save(); renderChecklist();
}
function renderChecklist(){
  const list = g('cl-list'); if(!list) return;
  DB.checklist = DB.checklist||[];
  if(!DB.checklist.length){
    list.innerHTML = '<div class="emp"><span class="ei">☑️</span><p>Your checklist is empty. Add a task to start.</p></div>';
    return;
  }
  list.innerHTML = DB.checklist.map(item =>
    `<div class="hw-item" style="padding:10px 0;border-bottom:1px solid var(--bor)">
      <button class="icon-btn" style="width:28px;height:28px;border-radius:8px;${item.done?'background:var(--ac);color:var(--on-ac,#fff);':''}" onclick="toggleChecklist('${item.id}')">${item.done?'✓':'○'}</button>
      <div class="hw-body" style="min-width:0">
        <div class="hw-title${item.done?' done':''}" style="font-size:13px">${item.title}</div>
        <div class="hw-meta" style="margin-top:4px;color:var(--ink4);font-size:11px">${new Date(item.created).toLocaleDateString('en-CA')}</div>
      </div>
      <button class="btn bd xs" style="margin-left:12px" onclick="removeChecklist('${item.id}')">Remove</button>
    </div>`).join('');
}
function setSbStyle(v){
  DB.p.sbStyle=v; save();
  const sb=g('sb');
  sb.setAttribute('data-sbstyle',v);
  if(v==='minimal'){sb.style.width='52px';g('sb-tog').style.display='none';}
  else{sb.style.width=(DB.p.sbW||260)+'px';g('sb-tog').style.display='';}
}
function setDocStyle(v){
  DB.p.docStyle=v; save();
  const doc=document.querySelector('.ed-doc');
  if(!doc) return;
  doc.removeAttribute('data-docstyle');
  doc.setAttribute('data-docstyle',v);
  const styles={
    white:'background:#fff',
    cream:'background:#FFFEF5',
    lined:'background:#fff;background-image:repeating-linear-gradient(transparent,transparent 27px,#e5e7eb 27px,#e5e7eb 28px)',
    dotted:'background:#fff;background-image:radial-gradient(circle,#d1d5db 1px,transparent 1px);background-size:22px 22px',
    transparent:'background:transparent;box-shadow:none;border:1.5px dashed var(--bor)',
  };
  doc.style.cssText=(doc.style.cssText||'').replace(/background[^;]*;?/g,'');
  Object.assign(doc.style,{background:'',backgroundImage:'',boxShadow:'',border:''});
  if(v==='white'){doc.style.background='#fff';}
  else if(v==='cream'){doc.style.background='#FFFEF5';}
  else if(v==='lined'){doc.style.background='#fff';doc.style.backgroundImage='repeating-linear-gradient(transparent,transparent 27px,#e5e7eb 27px,#e5e7eb 28px)';}
  else if(v==='dotted'){doc.style.background='#fff';doc.style.backgroundImage='radial-gradient(circle,#d1d5db 1px,transparent 1px)';doc.style.backgroundSize='22px 22px';}
  else if(v==='transparent'){doc.style.background='transparent';doc.style.boxShadow='none';doc.style.border='1.5px dashed var(--bor)';}
}
function applyDocStyle(){
  const v=DB.p.docStyle||'white';
  // Re-apply after note opens
  setTimeout(()=>setDocStyle(v),50);
}

