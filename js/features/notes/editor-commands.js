/* ── NOTES ── */
let nlCFilt = '';
function renderNotesList(q='', cfilt) {
  if (cfilt!==undefined) nlCFilt=cfilt;
  const cont=g('nl-list'); cont.innerHTML='';
  let notes=[...DB.notes];
  if (q) notes=notes.filter(n=>n.title?.toLowerCase().includes(q.toLowerCase())||n.content?.toLowerCase().includes(q.toLowerCase()));
  if (nlCFilt) notes=notes.filter(n=>n.course===nlCFilt);
  if (!notes.length) { cont.innerHTML='<div style="padding:14px 8px;font-size:12px;color:var(--ink4);text-align:center">No notes found</div>'; return; }
  const grps={};
  notes.forEach(n=>{ const gg=n.course||'General'; if(!grps[gg])grps[gg]=[]; grps[gg].push(n); });
  Object.entries(grps).forEach(([gg,ns])=>{
    const lbl=document.createElement('div'); lbl.className='nl-grp'; lbl.textContent=gg; cont.appendChild(lbl);
    ns.forEach(n=>{
      const d=document.createElement('div'); d.className=`nl-item ${noteId===n.id?'on':''}`; d.dataset.id=n.id;
      d.innerHTML=`<div class="nl-t">${n.title||'Untitled'}</div><div class="nl-m">${relTime(n.updated)}</div><button class="nl-share" onclick="shareNote('${n.id}');event.stopPropagation()" title="Share">🔗</button><button class="nl-del" onclick="delNote('${n.id}',event)">✕</button>`;
      d.onclick=e=>{ if(!e.target.classList.contains('nl-del')) openNote(n.id); };
      cont.appendChild(d);
    });
  });
}
function nlSearch(v){renderNotesList(v);}
function nlFilterCourse(c){renderNotesList('',c);}
function newNote() {
  if (!DB.courses.length){toast('Add courses in Settings first!');go('settings');return;}
  const c=DB.courses[0];
  const n={id:'n'+Date.now(),title:'',sub:'',course:c.name,ccolor:c.color,content:'',created:new Date().toISOString(),updated:new Date().toISOString()};
  DB.notes.unshift(n); save();
  if (curPg!=='notes') go('notes');
  openNote(n.id); renderNotesList();
  if (DB.p.tpl && DB.p.tpl!=='blank') setTimeout(()=>applyTpl(DB.p.tpl),80);
}
function openNote(id) {
  const n=DB.notes.find(x=>x.id===id); if(!n) return;
  noteId=id;
  g('ed').style.display='flex'; g('no-note').classList.remove('vis');
  const tag=g('doc-tag');
  tag.textContent=n.course||'Course'; tag.style.background=(n.ccolor||'#0F6B30')+'22'; tag.style.color=n.ccolor||'#0F6B30';
  g('doc-ttl').value=n.title||''; g('doc-sub').value=n.sub||'';
  g('doc-ed').innerHTML=n.content||'';
  document.querySelectorAll('.nl-item').forEach(e=>e.classList.toggle('on',e.dataset.id===id));
  g('ed-scroll').scrollTop=0;
  setStatus('saved');
  deselectEdImage();
  // Auto-resize title and subtitle textareas, apply doc style
  setTimeout(()=>{
    autoResize(g('doc-ttl'));autoResize(g('doc-sub'));updateWordCount();
    if(window.MathJax) MathJax.typesetPromise([g('doc-ed')]).catch(()=>{});
    applyDocStyle();
    setupImageInteractions();
  },30);
}
function cycleTag() {
  if (!noteId||!DB.courses.length) return;
  const n=DB.notes.find(x=>x.id===noteId); if(!n) return;
  const i=DB.courses.findIndex(c=>c.name===n.course);
  const next=DB.courses[(i+1)%DB.courses.length];
  n.course=next.name; n.ccolor=next.color;
  const tag=g('doc-tag'); tag.textContent=next.name; tag.style.background=next.color+'22'; tag.style.color=next.color;
  touch();
}
function touch() {
  setStatus('saving');
  clearTimeout(saveTmr);
  saveTmr = setTimeout(saveNote, 1500);
}
function saveNote() {
  if (!noteId) return;
  const n=DB.notes.find(x=>x.id===noteId); if(!n) return;
  n.title=g('doc-ttl').value||'Untitled'; n.sub=g('doc-sub').value;
  n.content=g('doc-ed').innerHTML; n.updated=new Date().toISOString();
  save(); setStatus('saved'); renderNotesList(); renderDrive();
}
function delNote(id,e) {
  if(e) e.stopPropagation();
  if(!confirm('Delete this note?')) return;
  DB.notes=DB.notes.filter(n=>n.id!==id);
  if(noteId===id){ noteId=null; g('doc-ed').innerHTML=''; g('doc-ttl').value=''; g('doc-sub').value=''; g('no-note').classList.add('vis'); g('ed').style.display='none'; }
  save(); renderNotesList(); renderDrive(); toast('Note deleted');
}
function relTime(iso) {
  if(!iso) return '';
  const d=(Date.now()-new Date(iso))/1000;
  if(d<60) return 'Just now'; if(d<3600) return Math.floor(d/60)+'m ago';
  if(d<86400) return Math.floor(d/3600)+'h ago';
  return new Date(iso).toLocaleDateString('en-CA',{month:'short',day:'numeric'});
}
function gSearch(v){if(!v)return;go('notes');renderNotesList(v);}

// Bridges Notes and Flashcards, which otherwise never talk to each other:
// insFlashcard() only drops a decorative flip-card <div> into the note's
// HTML, and nothing in the real Flashcards module (DB.flashcards) ever
// reads a note. This takes the highlighted text, guesses a question/answer
// split, and files it as an actual scheduled card in the deck for that
// note's course — creating that deck on first use, same as a course-linked
// deck made by hand in the Flashcards page.
function sendSelToFlashcards(){
  if (!noteId) { toast('Open a note first!'); return; }
  const n = DB.notes.find(x=>x.id===noteId); if (!n) return;
  const sel = window.getSelection().toString().trim();
  if (!sel) { toast('Highlight some text in the note first!'); return; }
  let q, a;
  const qMark = sel.indexOf('?');
  if (qMark > 0 && qMark < sel.length - 1) {
    q = sel.slice(0, qMark + 1).trim();
    a = sel.slice(qMark + 1).trim();
  } else {
    const m = sel.match(/^(.{2,80}?)\s*[-–—:]\s+(.+)$/s);
    if (m) { q = m[1].trim(); a = m[2].trim(); }
    else { q = n.title || 'Untitled note'; a = sel; }
  }
  if (!DB.flashcards) DB.flashcards = { decks: [], cards: [] };
  let deck = (DB.flashcards.decks||[]).find(d => d.courseId === (n.course||''));
  if (!deck) {
    const c = DB.courses.find(c=>c.name===n.course);
    deck = { id:'deck'+Date.now(), name:(n.course||'General')+' (from Notes)', desc:'Auto-created from note highlights', color:c?.color||'#0F6B30', courseId:n.course||'', created:Date.now() };
    DB.flashcards.decks.push(deck);
  }
  const card = { id:'fc'+Date.now()+Math.floor(Math.random()*1000), deckId:deck.id, q, a, hint:'', created:Date.now(), reviews:0, ease:2.5, sourceNoteId:n.id };
  DB.flashcards.cards.push(card);
  save();
  toast(`🃏 Added to "${deck.name}"`);
}

