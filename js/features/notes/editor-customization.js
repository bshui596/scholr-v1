/* ── DATA ── */
function clearD(t){
  if(!confirm(`Clear all ${t}?`)) return;
  if(t==='hw') DB.hw=[];
  if(t==='notes'){DB.notes=[];noteId=null;}
  if(t==='grades') DB.grades=[];
  save(); renderAll(); toast(`${t} cleared`);
}
function resetAll(){if(!confirm('Reset everything? This cannot be undone.'))return;localStorage.removeItem(KEY);location.reload();}

