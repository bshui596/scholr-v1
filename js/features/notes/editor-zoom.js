/* ── EDITOR CUSTOMIZATION ── */
function setDocW(v){document.documentElement.style.setProperty('--doc-w',v+'px');DB.p.docW=v;save();}
function setDocFs(v){document.documentElement.style.setProperty('--doc-fs',v);DB.p.docFs=v;save();}
function setDocLh(v){document.documentElement.style.setProperty('--doc-lh',v);DB.p.docLh=v;save();}
function setDocPad(v){document.documentElement.style.setProperty('--doc-pad',v);DB.p.docPad=v;save();}
function setSbWSlider(v){const sb=g('sb');sb.style.width=v+'px';sbW=+v;document.documentElement.style.setProperty('--sw',v+'px');DB.p.sbW=+v;save();}
function applyEditorPrefs(){
  const p=DB.p;
  if(p.docW) document.documentElement.style.setProperty('--doc-w',p.docW+'px');
  if(p.docFs) document.documentElement.style.setProperty('--doc-fs',p.docFs);
  if(p.docLh) document.documentElement.style.setProperty('--doc-lh',p.docLh);
  if(p.docPad) document.documentElement.style.setProperty('--doc-pad',p.docPad);
  if(p.rad) document.documentElement.style.setProperty('--rad',p.rad);
  if(p.th) document.documentElement.style.setProperty('--th',p.th);
  if(p.shadow) setShadow(p.shadow);
  if(p.btnStyle) setBtnStyle(p.btnStyle);
  if(p.sbStyle) setSbStyle(p.sbStyle);
  applyCustomTheme();
  applyDocStyle();
}

