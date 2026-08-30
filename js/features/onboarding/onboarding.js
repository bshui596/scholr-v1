/* ── NOTE LIST DRAG ── */
function initNlDrag() {
  const h = g('nl-h'), ns = g('ns');
  if (!h || !ns) return;
  let drag = false, sx = 0, sw0 = 0;
  h.addEventListener('mousedown', e => {
    drag=true; sx=e.clientX;
    const cols = getComputedStyle(ns).gridTemplateColumns.split(' ');
    sw0 = parseInt(cols[0]) || nlW;
    h.classList.add('drag'); document.body.style.cssText='cursor:col-resize;user-select:none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!drag) return;
    const w = Math.max(150, Math.min(420, sw0 + e.clientX - sx));
    ns.style.gridTemplateColumns = w + 'px 5px 1fr'; nlW = w;
  });
  document.addEventListener('mouseup', () => {
    if (!drag) return; drag=false;
    h.classList.remove('drag'); document.body.style.cssText='';
  });
}
function sbToggle() {
  const sb = g('sb'); const btn = g('sb-mobile-btn'); const inner = g('sb-tog');
  const hidden = sb.classList.toggle('hidden');
  if (hidden) {
    sb.classList.remove('slim'); sb.style.width = '0';
    if (inner) inner.textContent = '☰';
    if (btn) btn.textContent = '☰';
  } else {
    sb.style.width = sbW + 'px';
    if (inner) inner.textContent = '⇐';
    if (btn) btn.textContent = '✕';
  }
}

