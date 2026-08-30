/* ── INLINE COLOR ── */
let savedEdRange = null;
function saveEdSelection(){
  const sel = window.getSelection();
  if (sel && sel.rangeCount && !sel.isCollapsed) {
    const r = sel.getRangeAt(0);
    if (g('doc-ed') && g('doc-ed').contains(r.commonAncestorContainer)) savedEdRange = r.cloneRange();
  }
}
// Returns the active range to color: the live selection if it's still inside
// the note (true when a swatch used mousedown+preventDefault, so focus never
// left the editor), otherwise falls back to whatever was saved just before
// focus moved away (the "Custom colour…" native picker case).
function getEdColorRange(){
  const doc = g('doc-ed'); if (!doc) return null;
  let sel = window.getSelection();
  if (sel && sel.rangeCount && !sel.isCollapsed && doc.contains(sel.anchorNode) && doc.contains(sel.focusNode)) {
    return sel.getRangeAt(0);
  }
  if (savedEdRange) {
    doc.focus({preventScroll:true});
    sel = window.getSelection();
    sel.removeAllRanges();
    try { sel.addRange(savedEdRange); } catch(e){ return null; }
    return (!sel.isCollapsed) ? sel.getRangeAt(0) : null;
  }
  return null;
}
// Wraps every text node touched by `range` in its own <span style="prop:val">,
// so it works across bold/italic/lists/multi-paragraph selections — not just
// a single plain text node (which is all range.surroundContents() can handle).
function wrapRangeWithStyle(range, prop, val){
  const doc = g('doc-ed');
  const walker = document.createTreeWalker(doc, NodeFilter.SHOW_TEXT, {
    acceptNode: n => range.intersectsNode(n) && n.nodeValue.trim() !== '' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
  });
  const nodes = []; let n;
  while ((n = walker.nextNode())) nodes.push(n);
  if (!nodes.length) return false;
  nodes.forEach(node => {
    let start = node === range.startContainer ? range.startOffset : 0;
    let end = node === range.endContainer ? range.endOffset : node.nodeValue.length;
    if (start >= end) return;
    let target = node;
    if (end < target.nodeValue.length) target.splitText(end);
    if (start > 0) target = target.splitText(start);
    const span = document.createElement('span');
    span.style[prop] = val;
    target.parentNode.insertBefore(span, target);
    span.appendChild(target);
  });
  return true;
}
function setColorSwatchIndicator(menuId, color){
  const panel = g(menuId), btn = panel && panel.previousElementSibling;
  const car = btn && btn.querySelector('.clr-car');
  if (car) car.style.background = color === 'transparent' ? 'var(--sur)' : color;
}
function applyTextColor(color){
  const range = getEdColorRange();
  setColorSwatchIndicator('clr-menu-text', color);
  if (!range) { g('doc-ed')?.focus(); document.execCommand('foreColor',false,color); touch(); return; }
  if (!wrapRangeWithStyle(range, 'color', color)) document.execCommand('foreColor',false,color);
  savedEdRange = null; touch();
}
function applyHighlightColor(color){
  const range = getEdColorRange();
  setColorSwatchIndicator('clr-menu-hl', color);
  if (!range) { g('doc-ed')?.focus(); document.execCommand('hiliteColor',false,color); touch(); return; }
  if (!wrapRangeWithStyle(range, 'backgroundColor', color)) document.execCommand('hiliteColor',false,color);
  savedEdRange = null; touch();
}
