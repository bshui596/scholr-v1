/* ── ZOOM ── */
let docZoom = 100;
function zoomDoc(delta){
  docZoom = Math.max(50, Math.min(200, docZoom + delta));
  applyZoom();
}
function zoomReset(){
  docZoom = 100;
  applyZoom();
}
function applyZoom(){
  const doc = document.querySelector('.ed-doc');
  const lbl = g('zoom-lbl'); if(lbl) lbl.textContent = docZoom + '%';
  if(!doc) return;
  const scale = docZoom/100;
  // offsetHeight/offsetWidth reflect the untransformed layout box, so this
  // stays correct however many times zoom is applied in a row.
  const naturalH = doc.offsetHeight;
  doc.style.transformOrigin = 'top center';
  doc.style.transform = scale===1 ? '' : `scale(${scale})`;
  // A CSS transform doesn't change the box's footprint in normal flow, so
  // without this the scroll area was always sized for 100% — zooming in
  // clipped the bottom of the page (no room to scroll to it) and zooming
  // out left a big dead-space gap below the shrunk page. Compensating the
  // margin makes the scroll container's height track the visible size.
  const diff = naturalH * scale - naturalH;
  doc.style.marginBottom = scale===1 ? '' : diff + 'px';
}

