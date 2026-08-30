/* ── SIDEBAR DRAG ── */
function initSbDrag() {
  const h = g('sb-handle'), sb = g('sb');
  let drag = false, sx = 0, sw0 = 0;
  h.addEventListener('mousedown', e => {
    drag=true; sx=e.clientX; sw0=sb.offsetWidth;
    h.classList.add('drag'); document.body.style.cssText='cursor:col-resize;user-select:none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!drag) return;
    const w = Math.max(160, Math.min(440, sw0 + e.clientX - sx));
    sb.style.width = w + 'px'; sbW = w;
    document.documentElement.style.setProperty('--sw', w + 'px');
  });
  document.addEventListener('mouseup', () => {
    if (!drag) return; drag=false;
    h.classList.remove('drag'); document.body.style.cssText='';
    DB.p.sbW = sbW; save();
  });
}

