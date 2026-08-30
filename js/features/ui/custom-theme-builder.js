/* ── EDITOR INSERT DROPDOWNS ── */
function toggleInsMenu(id){
  const panel = g(id); if (!panel) return;
  const wasOn = panel.classList.contains('on');
  closeInsMenus();
  if (wasOn) return;
  const btn = panel.previousElementSibling;
  const rect = btn.getBoundingClientRect();
  panel.style.left = rect.left + 'px';
  panel.style.top = (rect.bottom + 6) + 'px';
  panel.classList.add('on');
  requestAnimationFrame(()=>{
    const pw = panel.offsetWidth, vw = window.innerWidth;
    if (rect.left + pw > vw - 8) panel.style.left = Math.max(8, vw - pw - 8) + 'px';
    const ph = panel.offsetHeight, vh = window.innerHeight;
    if (rect.bottom + 6 + ph > vh - 8) panel.style.top = Math.max(8, rect.top - ph - 6) + 'px';
  });
}
function closeInsMenus(){ document.querySelectorAll('.ins-dd-panel.on').forEach(p=>p.classList.remove('on')); }
document.addEventListener('click', e=>{
  if (!e.target.closest('.ins-dd') && !e.target.closest('.ins-dd-panel')) closeInsMenus();
});
function renderLayoutSwatches(){
  const cont=g('lm-theme-sw'); if(!cont) return;
  cont.innerHTML = THEMES.filter(t=>t.id!=='custom').map(t=>
    `<button class="theme-sw${DB.p.theme===t.id?' on':''}" style="background:${t.c}" title="${t.id}" onclick="pickTheme(this,'${t.id}')" aria-label="Theme: ${t.id}">${t.e}</button>`
  ).join('');
}
function quickSbW(w){
  sbW=w; document.documentElement.style.setProperty('--sw', w+'px'); g('sb').style.width=w+'px';
  DB.p.sbW=w; save();
  const slider=g('s-sbw'); if(slider) slider.value=w;
}
function quickDensity(v){ setDensity(v); }

