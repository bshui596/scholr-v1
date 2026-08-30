/* ── NOTE DEFAULT SETTINGS ── */
function saveNoteDefaults(){
  const p=DB.p;
  p.defDocW=g('s-docw')?.value;
  p.defDocFs=g('s-docfs')?.value;
  p.defDocLh=g('s-doclh')?.value;
  p.defDocPad=g('s-docpad')?.value;
  p.defFont=p.font;
  p.defZoom=docZoom;
  save(); toast('Note defaults saved!');
}
function applyNoteDefaults(){
  const p=DB.p;
  if(p.defDocW) setDocW(p.defDocW);
  if(p.defDocFs) setDocFs(p.defDocFs);
  if(p.defDocLh) setDocLh(p.defDocLh);
  if(p.defDocPad) setDocPad(p.defDocPad);
  if(p.defZoom) { docZoom=p.defZoom; zoomDoc(0); }
}

