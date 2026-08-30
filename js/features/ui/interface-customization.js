/* ── STICKY NOTES ── */
function createStickyFromScratch(){
  const text = (g('scratch-area')?.value||'').trim(); if(!text){toast('Scratch pad is empty'); return;} 
  const st = { id:'s'+Date.now(), text, left:40, top:40, w:220, h:160, color:'#FFFB7D' };
  const list = JSON.parse(localStorage.getItem('scholr_stickies')||'[]'); list.push(st); localStorage.setItem('scholr_stickies', JSON.stringify(list)); renderStickies(); toast('Sticky created');
}
function renderStickies(){
  document.querySelectorAll('.sticky-note').forEach(el=>el.remove());
  const list = JSON.parse(localStorage.getItem('scholr_stickies')||'[]');
  list.forEach(s=>{
    const el = document.createElement('div'); el.className='sticky-note'; el.style.position='fixed'; el.style.left=(s.left||40)+'px'; el.style.top=(s.top||40)+'px'; el.style.width=(s.w||220)+'px'; el.style.height=(s.h||160)+'px'; el.style.background=s.color||'#FFFB7D'; el.style.border='1px solid rgba(0,0,0,.12)'; el.style.borderRadius='8px'; el.style.padding='8px'; el.style.zIndex=12010; el.style.boxShadow='0 6px 20px rgba(0,0,0,.12)';
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><strong style="font-size:12px">Sticky</strong><div><button style="background:none;border:none;cursor:pointer;font-size:13px;margin-right:6px" onclick="removeSticky('${s.id}')">✕</button></div></div><div contenteditable style="height:calc(100% - 28px);overflow:auto">${escapeHtml(s.text)}</div>`;
    document.body.appendChild(el);
    makeDraggable(el, el);
    // save position on mouseup
    el.addEventListener('mouseup', ()=>{
      const rect = el.getBoundingClientRect(); const list2 = JSON.parse(localStorage.getItem('scholr_stickies')||'[]');
      const it = list2.find(x=>x.id===s.id); if(it){ it.left = rect.left; it.top = rect.top; it.w = rect.width; it.h = rect.height; localStorage.setItem('scholr_stickies', JSON.stringify(list2)); }
    });
  });
}
function removeSticky(id){ let list = JSON.parse(localStorage.getItem('scholr_stickies')||'[]'); list = list.filter(s=>s.id!==id); localStorage.setItem('scholr_stickies', JSON.stringify(list)); renderStickies(); }
function escapeHtml(str){ return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
document.addEventListener('DOMContentLoaded', renderStickies);
