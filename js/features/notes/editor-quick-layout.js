/* ── INTERFACE STYLE ── */
function setRad(v){document.documentElement.style.setProperty('--rad',v);DB.p.rad=v;save();}
function setTh(v){document.documentElement.style.setProperty('--th',v);DB.p.th=v;save();}
function setDensity(v, skipSave){
  DB.p.density=v; if(!skipSave) save();
  const d=v==='compact'?'6px 20px':v==='comfortable'?'22px 26px':'12px 22px';
  document.documentElement.style.setProperty('--ps-pad',d);
  const sp=g('ps'); if(sp){const p=v==='compact'?'14px':v==='comfortable'?'30px':'22px';sp.style.padding=p;}
  const sel=g('s-density'); if(sel) sel.value=v;
}

