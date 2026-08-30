/* ── INLINE FONT / SIZE ── */
function setSelFont(fontFamily){
  if(!fontFamily){document.execCommand('removeFormat');return;}
  document.execCommand('fontName', false, fontFamily);
  touch();
}
function setSelSize(size){
  const sel=window.getSelection();
  if(!sel||!sel.rangeCount) return;
  if(sel.isCollapsed){
    // Insert a marker span for future typing
    const span=document.createElement('span');
    span.style.fontSize=size;
    span.innerHTML='​'; // zero-width space to anchor
    const range=sel.getRangeAt(0);
    range.insertNode(span);
    range.setStart(span,1);range.setEnd(span,1);
    sel.removeAllRanges();sel.addRange(range);
    return;
  }
  const range=sel.getRangeAt(0);
  const span=document.createElement('span');
  span.style.fontSize=size;
  try{
    range.surroundContents(span);
    sel.removeAllRanges();const r=document.createRange();r.selectNode(span);sel.addRange(r);
  }catch(e){
    // Selection crosses elements — wrap each text node
    const frag=range.extractContents();
    const wrapper=document.createElement('span');
    wrapper.style.fontSize=size;
    wrapper.appendChild(frag);
    range.insertNode(wrapper);
  }
  touch();
}
function setLineSpacing(v){
  if(!v) return;
  const ed=g('doc-ed'); if(!ed) return;
  const sel=window.getSelection();
  // If no selection or collapsed, apply to all paragraphs in doc
  if(!sel||!sel.rangeCount||sel.isCollapsed){
    ed.querySelectorAll('p,div,li,h1,h2,h3,h4,h5,h6,blockquote,pre').forEach(el=>el.style.lineHeight=v);
    ed.style.lineHeight=v;
  } else {
    // Apply to all block elements within selection
    let node=sel.anchorNode;
    while(node&&node!==ed&&!['P','DIV','LI','H1','H2','H3','H4','H5','H6','BLOCKQUOTE','PRE'].includes(node.nodeName)) node=node.parentNode;
    if(node&&node!==ed) node.style.lineHeight=v;
  }
  // Update CSS var too
  document.documentElement.style.setProperty('--doc-lh',v);
  touch();
}

