/* ── FORMATTING STATE TRACKER ── */
function trackFmtState(){
  try{
    const b=document.queryCommandState('bold'),i=document.queryCommandState('italic'),u=document.queryCommandState('underline');
    g('tb-b')?.classList.toggle('on',b);
    g('tb-i')?.classList.toggle('on',i);
    g('tb-u')?.classList.toggle('on',u);
  }catch(e){}
}

