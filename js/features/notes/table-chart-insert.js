/* ── IMAGE RESIZE / SELECT ── */
let selectedEdImg = null;
function setupImageInteractions(){
  const doc = g('doc-ed'); if (!doc || doc.dataset.imgWired) return;
  doc.dataset.imgWired = '1';
  doc.addEventListener('click', e=>{
    const img = e.target.closest('img');
    if (img) selectEdImage(img); else deselectEdImage();
  });
  doc.addEventListener('scroll', ()=>{ if (selectedEdImg) positionImgHandle(selectedEdImg); });
  g('ed-scroll')?.addEventListener('scroll', ()=>{ if (selectedEdImg) positionImgHandle(selectedEdImg); });
  window.addEventListener('resize', ()=>{ if (selectedEdImg) positionImgHandle(selectedEdImg); });
  document.addEventListener('click', e=>{
    if (!e.target.closest('img') && !e.target.closest('#img-resize-handle')) deselectEdImage();
  });
}
function selectEdImage(img){
  document.querySelectorAll('#doc-ed img.ed-img-selected').forEach(i=>i.classList.remove('ed-img-selected'));
  img.classList.add('ed-img-selected');
  selectedEdImg = img;
  positionImgHandle(img);
  const h = g('img-resize-handle'); if (h) h.style.display = 'block';
}
function deselectEdImage(){
  document.querySelectorAll('#doc-ed img.ed-img-selected').forEach(i=>i.classList.remove('ed-img-selected'));
  selectedEdImg = null;
  const h = g('img-resize-handle'); if (h) h.style.display = 'none';
}
function positionImgHandle(img){
  const h = g('img-resize-handle'); if (!h) return;
  const r = img.getBoundingClientRect();
  h.style.left = (r.right - 8) + 'px';
  h.style.top = (r.bottom - 8) + 'px';
}
function imgHandleDown(e){
  e.preventDefault(); e.stopPropagation();
  if (!selectedEdImg) return;
  const img = selectedEdImg;
  const startX = e.clientX;
  const startW = img.getBoundingClientRect().width;
  const maxW = g('doc-ed').clientWidth;
  function onMove(ev){
    const newW = Math.max(60, Math.min(maxW, startW + (ev.clientX - startX)));
    img.style.width = newW + 'px';
    img.style.maxWidth = 'none';
    img.style.height = 'auto';
    positionImgHandle(img);
  }
  function onUp(){
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    touch();
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}
function insLink(){const u=prompt('URL:','https://');if(!u)return;const t=window.getSelection().toString()||u;cmd('insertHTML',`<a href="${u}" target="_blank" style="color:var(--ac)">${t}</a>`);}
function insBulletType(){showMo('mo-bullet');}
function insBulletList(marker,isOrdered){
  const items=['Item one','Item two','Item three'];
  if(marker==='custom'){
    // Let user pick — default to disc
    cmd('insertUnorderedList');
    return;
  }
  if(isOrdered){
    cmd('insertOrderedList');
  } else {
    cmd('insertUnorderedList');
  }
  // Apply custom list style to parent UL/OL
  setTimeout(()=>{
    const sel=window.getSelection();
    if(!sel||!sel.rangeCount) return;
    let node=sel.anchorNode;
    while(node&&node.nodeName!=='UL'&&node.nodeName!=='OL'&&node!==g('doc-ed')) node=node.parentNode;
    if(node&&(node.nodeName==='UL'||node.nodeName==='OL')){
      node.style.listStyleType=marker;
    }
    touch();
  },30);
}
function insHR(){
  // Insert a properly deletable divider as a block element
  const id='hr'+Date.now();
  cmd('insertHTML',
    `<div data-divider="1" id="${id}" style="position:relative;margin:16px 0;cursor:pointer;group" contenteditable="false">`+
    `<hr style="border:none;border-top:2px solid var(--bor);margin:0"/>`+
    `<button onclick="document.getElementById('${id}').remove();touch()" `+
    `style="position:absolute;top:-8px;right:4px;background:var(--sur);border:1px solid var(--bor);border-radius:50%;width:18px;height:18px;font-size:9px;cursor:pointer;color:var(--ink4);display:none;line-height:1;padding:0" `+
    `class="hr-del-btn">✕</button>`+
    `</div><p></p>`
  );
  // Show delete button on hover
  setTimeout(()=>{
    const div=document.getElementById(id);
    if(div){
      div.addEventListener('mouseenter',()=>{ const b=div.querySelector('.hr-del-btn'); if(b) b.style.display='flex'; });
      div.addEventListener('mouseleave',()=>{ const b=div.querySelector('.hr-del-btn'); if(b) b.style.display='none'; });
    }
  },100);
  touch();
}
function insCode(){cmd('insertHTML','<code style="font-family:var(--font-m);background:var(--s3);padding:2px 6px;border-radius:5px;font-size:12px;color:var(--ac)">code</code> ');}
function insCodeBlock(){cmd('insertHTML',`<pre style="background:#0A1A0E;color:#8AF0A8;padding:16px 20px;border-radius:10px;font-family:var(--font-m);font-size:12px;margin:12px 0;overflow-x:auto;line-height:1.7" contenteditable="true">// code here</pre><p></p>`);}
function insQuote(){cmd('insertHTML',`<blockquote style="border-left:4px solid var(--ac2);margin:10px 0;padding:8px 14px;background:var(--acll);border-radius:0 8px 8px 0;color:var(--ink2);font-style:italic" contenteditable="true">Quote…</blockquote><p></p>`);}
function insMath(){const ex=prompt('Math expression:','E = mc²');if(!ex)return;cmd('insertHTML',`<span style="font-family:var(--font-m);background:var(--s3);padding:2px 9px;border-radius:5px;font-size:13px;color:var(--ac);display:inline-block;margin:1px 3px">${ex}</span> `);}
function insEq(){showMo('mo-eq');}
function insEqSubmit(){
  const ex=g('eq-src')?.value?.trim(); if(!ex) return;
  const display=g('eq-disp')?.checked!==false;
  const id='eq'+Date.now();
  const tag=display
    ? `<div id="${id}" class="eq-block" style="text-align:center;padding:14px 20px;margin:14px 0;background:var(--s2);border-radius:9px;border:1.5px solid var(--bor);cursor:pointer;font-size:15px" onclick="editEq(this,'${id}')" title="Click to edit">\\[${ex}\\]</div><p></p>`
    : `<span id="${id}" class="eq-inline" onclick="editEq(this,'${id}')" title="Click to edit" style="cursor:pointer">\\(${ex}\\)</span> `;
  g('doc-ed').focus();
  document.execCommand('insertHTML',false,tag);
  closeMo('mo-eq');
  if(g('eq-src')) g('eq-src').value='';
  // Trigger MathJax
  setTimeout(()=>{if(window.MathJax){MathJax.typesetPromise([g('doc-ed')]).catch(e=>console.log(e));}},80);
  touch();
}
function editEq(el,id){
  const src=el.textContent.replace(/^\\\[|\\\]$|^\\\(|\\\)$/g,'').trim();
  const newSrc=prompt('Edit equation:',src);
  if(newSrc===null) return;
  const isBlock=el.classList.contains('eq-block');
  el.outerHTML = isBlock
    ? `<div id="${id}" class="eq-block" style="text-align:center;padding:14px 20px;margin:14px 0;background:var(--s2);border-radius:9px;border:1.5px solid var(--bor);cursor:pointer;font-size:15px" onclick="editEq(this,'${id}')" title="Click to edit">\\[${newSrc}\\]</div>`
    : `<span id="${id}" class="eq-inline" onclick="editEq(this,'${id}')" title="Click to edit" style="cursor:pointer">\\(${newSrc}\\)</span>`;
  setTimeout(()=>{if(window.MathJax){MathJax.typesetPromise([g('doc-ed')]).catch(e=>console.log(e));}},80);
  touch();
}
function insDate(){const now=new Date();cmd('insertHTML',`<span style="background:var(--acll);color:var(--ac);font-size:11px;font-weight:700;padding:2px 10px;border-radius:99px;display:inline-block;margin:1px 3px">📅 ${now.toLocaleDateString('en-CA',{weekday:'short',month:'short',day:'numeric',year:'numeric'})}</span><span style="color:inherit;font-size:inherit"> </span>`);document.execCommand('removeFormat',false,null);}
function insCheck(){
  const doc = g('doc-ed'); if (!doc) return;
  doc.focus();
  let sel = window.getSelection();
  let range;
  if (sel && sel.rangeCount && doc.contains(sel.anchorNode)) range = sel.getRangeAt(0);
  else { range = document.createRange(); range.selectNodeContents(doc); range.collapse(false); }

  // Find the direct child of doc-ed that contains the cursor, so the new
  // item is inserted as a proper sibling — never nested inside a <p>,
  // which is what caused items to merge/break when inserted back to back.
  let anchor = range.startContainer;
  while (anchor && anchor.parentNode !== doc) anchor = anchor.parentNode;

  const item = document.createElement('div');
  item.className = 'ed-check-item';
  item.innerHTML = `<input type="checkbox" onclick="this.nextElementSibling.classList.toggle('done',this.checked);touch()"/><span contenteditable="true">Task item</span>`;

  if (anchor && anchor.parentNode === doc) doc.insertBefore(item, anchor.nextSibling);
  else doc.appendChild(item);

  const span = item.querySelector('span');
  const r2 = document.createRange();
  r2.selectNodeContents(span);
  sel.removeAllRanges(); sel.addRange(r2);
  touch();
}
function insKbd(){cmd('insertHTML',`<kbd>Ctrl</kbd> `);}
function insHL(){const t=window.getSelection().toString()||'highlighted text';cmd('insertHTML',`<mark style="background:#fef08a;padding:1px 3px;border-radius:3px">${t}</mark>`);}
function insCall(t){
  const m={info:{bg:'#DBEAFE',bl:'#3B82F6',i:'💡'},warn:{bg:'#FEF3C7',bl:'#F59E0B',i:'⚠️'},tip:{bg:'#D1FAE5',bl:'#10B981',i:'✅'},error:{bg:'#FEE2E2',bl:'#EF4444',i:'🔴'},star:{bg:'#FEF9C3',bl:'#EAB308',i:'⭐'},q:{bg:'#EDE9FE',bl:'#8B5CF6',i:'❓'},def:{bg:'#FDF2F8',bl:'#EC4899',i:'📖'}};
  const s=m[t]||m.info;
  cmd('insertHTML',`<div style="background:${s.bg};border-left:4px solid ${s.bl};border-radius:8px;padding:11px 14px;margin:10px 0;display:flex;gap:10px;align-items:flex-start"><span style="font-size:16px;flex-shrink:0;margin-top:2px">${s.i}</span><div contenteditable="true" style="flex:1;font-size:13.5px;line-height:1.6">Type here…</div></div><p></p>`);
}
function insStrand(lbl,bg,fg){cmd('insertHTML',`<span style="background:${bg};color:${fg};display:inline-block;font-size:10.5px;font-weight:700;padding:2px 9px;border-radius:99px;margin:2px 3px">${lbl}</span> `);}
function insYT(){const url=prompt('YouTube URL:','https://www.youtube.com/watch?v=');if(!url)return;const vid=url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)?.[1];if(!vid){toast('Invalid YouTube URL');return;}cmd('insertHTML',`<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:10px;margin:12px 0"><iframe src="https://www.youtube.com/embed/${vid}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:10px" allowfullscreen></iframe></div><p></p>`);}
function insProgress(){const v=prompt('Progress (0-100):','75');const pct=Math.max(0,Math.min(100,parseInt(v)||0));const lbl=prompt('Label:','Progress');cmd('insertHTML',`<div style="margin:10px 0"><div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:5px"><span>${lbl||'Progress'}</span><span>${pct}%</span></div><div style="height:9px;background:var(--bor);border-radius:99px;overflow:hidden"><div style="width:${pct}%;height:100%;background:var(--ac);border-radius:99px"></div></div></div>`);}
function insToggle(){cmd('insertHTML',`<details style="border:1px solid var(--bor);border-radius:9px;padding:10px 14px;margin:10px 0"><summary style="font-weight:600;cursor:pointer;user-select:none;font-size:14px">▶ Click to expand</summary><div contenteditable="true" style="margin-top:9px;font-size:13.5px;line-height:1.7;padding-top:8px;border-top:1px solid var(--bor)">Content here…</div></details><p></p>`);}
function ins2Col(){cmd('insertHTML',`<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:12px 0"><div contenteditable="true" style="background:var(--s2);border-radius:9px;padding:12px;min-height:80px;font-size:13.5px;line-height:1.6">Left column…</div><div contenteditable="true" style="background:var(--s2);border-radius:9px;padding:12px;min-height:80px;font-size:13.5px;line-height:1.6">Right column…</div></div><p></p>`);}
function ins3Col(){cmd('insertHTML',`<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:12px 0"><div contenteditable="true" style="background:var(--s2);border-radius:9px;padding:11px;min-height:70px;font-size:13px;line-height:1.6">Col 1…</div><div contenteditable="true" style="background:var(--s2);border-radius:9px;padding:11px;min-height:70px;font-size:13px;line-height:1.6">Col 2…</div><div contenteditable="true" style="background:var(--s2);border-radius:9px;padding:11px;min-height:70px;font-size:13px;line-height:1.6">Col 3…</div></div><p></p>`);}
function insFlashcard(){cmd('insertHTML',`<div style="perspective:600px;margin:12px 0;cursor:pointer" onclick="const b=this.querySelector('.fc-back');b.style.display=b.style.display==='none'?'block':'none';const f=this.querySelector('.fc-front');f.style.display=f.style.display==='none'?'block':'none'"><div class="fc-front" style="background:linear-gradient(135deg,var(--ac),var(--ac2));color:var(--on-ac,#fff);border-radius:12px;padding:18px 20px;text-align:center;font-weight:700;font-size:15px" contenteditable="true">Front: Question</div><div class="fc-back" style="display:none;background:var(--s2);border:2px solid var(--bor);border-radius:12px;padding:18px 20px;font-size:14px;line-height:1.7" contenteditable="true">Back: Answer</div></div><p></p>`);}
function insTimeline(){cmd('insertHTML',`<div style="margin:12px 0;padding-left:16px;border-left:3px solid var(--ac)"><div style="margin-bottom:12px"><span style="background:var(--ac);color:var(--on-ac,#fff);font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px">Date 1</span><div contenteditable="true" style="margin-top:5px;font-size:13.5px;line-height:1.6">Event description…</div></div><div style="margin-bottom:12px"><span style="background:var(--ac);color:var(--on-ac,#fff);font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px">Date 2</span><div contenteditable="true" style="margin-top:5px;font-size:13.5px;line-height:1.6">Event description…</div></div></div><p></p>`);}
function insSteps(){cmd('insertHTML',`<ol style="list-style:none;padding:0;margin:12px 0;counter-reset:steps"><li style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start"><span style="background:var(--ac);color:var(--on-ac,#fff);font-size:11px;font-weight:800;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">1</span><div contenteditable="true" style="flex:1;font-size:13.5px;line-height:1.6;padding-top:2px">Step one…</div></li><li style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start"><span style="background:var(--ac);color:var(--on-ac,#fff);font-size:11px;font-weight:800;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">2</span><div contenteditable="true" style="flex:1;font-size:13.5px;line-height:1.6;padding-top:2px">Step two…</div></li><li style="display:flex;gap:12px;margin-bottom:4px;align-items:flex-start"><span style="background:var(--ac);color:var(--on-ac,#fff);font-size:11px;font-weight:800;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">3</span><div contenteditable="true" style="flex:1;font-size:13.5px;line-height:1.6;padding-top:2px">Step three…</div></li></ol><p></p>`);}
function insFootnote(){const n=document.querySelectorAll('[data-fn]').length+1;cmd('insertHTML',`<sup style="cursor:pointer;color:var(--ac);font-size:10px;font-weight:700" title="Footnote ${n}">[${n}]</sup>`);const fn=prompt('Footnote text:','');if(fn)cmd('insertHTML',`<div data-fn="${n}" style="border-top:1px solid var(--bor);margin-top:20px;padding-top:8px;font-size:11.5px;color:var(--ink3)">[${n}] ${fn}</div>`);}
function insRating(){const v=prompt('Rating (1-5):','4');const r=Math.max(1,Math.min(5,parseInt(v)||4));cmd('insertHTML',`<div style="display:inline-flex;gap:2px;font-size:18px;margin:2px 4px">${'★'.repeat(r)}<span style="color:var(--bor2)">${'★'.repeat(5-r)}</span></div>`);}
function insSpoiler(){cmd('insertHTML',`<span style="background:var(--ink);color:var(--ink);border-radius:4px;padding:1px 6px;cursor:pointer;user-select:none;font-size:13.5px" onclick="this.style.color=this.style.color===''||this.style.color==='var(--ink)'?'inherit':'var(--ink)'" title="Click to reveal" contenteditable="true">hidden text</span> `);}


