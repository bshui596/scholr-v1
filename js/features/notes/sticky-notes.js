/* ── SCRATCH PAD ── */
function openScratch(){ g('scratch-area').value=localStorage.getItem('scholr_scratch')||''; showMo('mo-scratch'); }
function saveScratch(){ localStorage.setItem('scholr_scratch',g('scratch-area')?.value||''); }
function copyScratch(){ navigator.clipboard?.writeText(g('scratch-area')?.value||'').then(()=>toast('Copied!')); }
function scratchToNote(){
  const text=g('scratch-area')?.value?.trim(); if(!text) return;
  if(!DB.courses.length){toast('Add courses first');return;}
  const c=DB.courses[0];
  const n={id:'n'+Date.now(),title:'Scratch Note '+new Date().toLocaleDateString(),sub:'From scratch pad',
    course:c.name,ccolor:c.color,content:'<p>'+text.split('\n').join('</p><p>')+'</p>',
    created:new Date().toISOString(),updated:new Date().toISOString()};
  DB.notes.unshift(n); save(); renderNotesList(); closeMo('mo-scratch'); go('notes'); openNote(n.id); toast('Saved as note!');
}
