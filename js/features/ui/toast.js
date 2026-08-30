/* ── DRIVE HOVER EFFECTS (CSS supplement) ── */
document.addEventListener('mouseover',e=>{
  const df=e.target.closest('.df');
  if(df){ const del=df.querySelector('.df-del'); if(del) del.style.opacity='1'; }
});
document.addEventListener('mouseout',e=>{
  const df=e.target.closest('.df');
  if(df){ const del=df.querySelector('.df-del'); if(del) del.style.opacity='0'; }
});

/* (css patch applied above) */
