/* ── SELECTS / MODALS ── */
function populateSels(){
  const cn=DB.courses.map(c=>c.name);
  ['hw-co','cls-co','gr-co','dp-co','exam-co','wp-co','gl-co'].forEach(id=>{
    const e=g(id); if(!e) return;
    const prev=e.value;
    e.innerHTML=cn.length?cn.map(n=>`<option>${n}</option>`).join('')+'<option value="">— None —</option>':'<option>No courses yet</option>';
    if(prev) setSel(id,prev);
  });
  const se=g('cls-sl'); if(se) se.innerHTML=(DB.slots||[]).map((s,i)=>`<option value="${i}">${s}</option>`).join('');
}
function showMo(id){g(id).classList.add('on'); if(['mo-hw','mo-hw-edit','mo-cls','mo-gr','mo-dp','mo-exam','mo-plan','mo-goal'].includes(id))populateSels(); if(id==='mo-hw'){ if(g('hw-link')) g('hw-link').value=''; clearHWFields('hw-fields'); }}
function closeMo(id){g(id).classList.remove('on');}
/* In-app confirm dialog. Native window.confirm() doesn't reliably fire inside
   a sandboxed artifact iframe, so destructive actions route through this
   instead of confirm(). */
let _confirmCb = null;
function showConfirm(msg, onYes, okLabel){
  setText('confirm-msg', msg);
  const okBtn = g('confirm-ok'); if (okBtn) okBtn.textContent = okLabel || 'Delete';
  _confirmCb = onYes;
  showMo('mo-confirm');
}
function confirmYes(){
  const cb = _confirmCb; _confirmCb = null;
  closeMo('mo-confirm');
  if (cb) cb();
}
function confirmNo(){ _confirmCb = null; closeMo('mo-confirm'); }
document.addEventListener('click',e=>{if(e.target.classList.contains('mo'))e.target.classList.remove('on');});
function clearHWFields(id){const c=g(id); if(!c)return; c.innerHTML='';}
function addHWField(id,label='',value=''){const c=g(id); if(!c)return; const row=document.createElement('div'); row.className='hw-field-row'; row.style.cssText='display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:center;margin-bottom:8px'; row.innerHTML=`<input class="fi" placeholder="Field name" value="${label||''}" data-hw-field="k"/><input class="fi" placeholder="Value" value="${value||''}" data-hw-field="v"/><button class="btn bd xs" type="button" onclick="this.parentNode.remove();">✕</button>`; c.appendChild(row);}
function collectHWFields(id){const c=g(id); if(!c)return[]; return Array.from(c.querySelectorAll('[data-hw-field="k"]')).map(k=>{const row=k.closest('.hw-field-row'); if(!row) return null; const v=row.querySelector('[data-hw-field="v"]'); const key=k.value.trim(); const val=v?v.value.trim():''; return key?{k:key,v:val}:null;}).filter(Boolean);}

