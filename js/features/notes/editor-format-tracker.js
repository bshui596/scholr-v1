/* ── CUSTOM THEME BUILDER ── */
const CUSTOM_COLS = [
  {k:'--c-bg',l:'Page background'},
  {k:'--c-sur',l:'Card surface'},
  {k:'--c-s2',l:'Secondary surface'},
  {k:'--c-ink',l:'Text colour'},
  {k:'--c-ink3',l:'Muted text'},
  {k:'--c-ac',l:'Accent colour'},
  {k:'--c-ac2',l:'Accent hover'},
  {k:'--c-bor',l:'Border'},
];
function buildCustomTheme(){
  const cont=g('custom-cols'); if(!cont) return;
  cont.innerHTML=CUSTOM_COLS.map(col=>`
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px">
      <input type="color" value="${getComputedStyle(document.documentElement).getPropertyValue(col.k.replace('--c-','--'))||'#888'}" 
        oninput="previewCustom('${col.k}',this.value)"
        style="width:32px;height:28px;border:1.5px solid var(--bor);border-radius:5px;cursor:pointer;-webkit-appearance:none;padding:1px"/>
      <span style="font-size:11.5px;font-weight:500">${col.l}</span>
    </div>`).join('');
}
function previewCustom(k,v){document.documentElement.style.setProperty(k,v);}
function saveCustomTheme(){
  pickTheme(document.querySelector('.theme-sw[title="custom"]')||document.createElement('div'),'custom');
  CUSTOM_COLS.forEach(col=>{
    const val=getComputedStyle(document.documentElement).getPropertyValue(col.k);
    DB.p[col.k]=val;
  });
  save(); toast('Custom theme saved!');
}
function applyCustomTheme(){
  if(DB.p?.theme!=='custom') return;
  CUSTOM_COLS.forEach(col=>{if(DB.p[col.k]) document.documentElement.style.setProperty(col.k,DB.p[col.k]);});
}

