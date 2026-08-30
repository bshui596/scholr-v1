/* ── NOTE SHARING ──────────────────────────────────────────────
   Codes are written to shared cloud storage (window.storage, shared=true)
   so a code entered on a different device/browser actually resolves to
   the note. DB.myShares keeps a personal (non-shared) manifest of codes
   this workspace has issued, purely so "My Shared Notes" can list titles
   without re-fetching everyone's shared keys. Falls back to a same-
   browser-only localStorage mode if cloud storage isn't available. ── */
const SHARE_KEY = 'scholr_shares'; // legacy same-browser fallback store
function getShares(){ try{ return JSON.parse(localStorage.getItem(SHARE_KEY)||'{}'); }catch(e){ return {}; } }
function saveShares(s){ localStorage.setItem(SHARE_KEY,JSON.stringify(s)); }

async function shareNote(id){
  const n=DB.notes.find(x=>x.id===id); if(!n) return;
  if (!DB.myShares) DB.myShares=[];
  const existing = DB.myShares.find(s=>s.noteId===id);
  const code = existing ? existing.code : Math.floor(100000+Math.random()*900000).toString();
  const payload = {noteId:id, owner:DB.p.name||'A Scholr user', title:n.title||'Untitled', content:n.content, shared:new Date().toISOString()};

  if (CLOUD_ON) {
    try {
      await window.storage.set('share:'+code, JSON.stringify(payload), true);
      if (!existing) { DB.myShares.push({code, title:n.title||'Untitled', noteId:id}); save(); }
      toast('Share code: '+code+' — works on any device');
    } catch(e) { toast('⚠️ Could not create share link, try again'); return; }
  } else {
    // Fallback: same-browser only, clearly labeled as such in the modal copy
    const shares=getShares();
    shares[code]={...payload};
    saveShares(shares);
    if (!existing) { DB.myShares.push({code, title:n.title||'Untitled', noteId:id}); save(); }
  }
  showMo('mo-share');
  g('share-code').textContent=code;
  g('share-title').textContent=n.title||'Untitled';
  g('share-code-inp').value=code;
  renderSharedList();
}
async function importSharedNote(){
  const code=g('import-code')?.value?.trim();
  if(!code||code.length!==6){toast('Enter a valid 6-digit code');return;}
  let data=null;
  if (CLOUD_ON) {
    try {
      const res = await window.storage.get('share:'+code, true);
      if (res && res.value) data = JSON.parse(res.value);
    } catch(e) { /* fall through to legacy check below */ }
  }
  if (!data) { const shares=getShares(); data = shares[code]; }
  if(!data){toast('Code not found or expired');return;}
  const newNote={id:'n'+Date.now(),title:data.title+' (shared)',sub:'Shared by '+data.owner,
    course:DB.courses[0]?.name||'General',ccolor:DB.courses[0]?.color||'#0F6B30',
    content:data.content,created:new Date().toISOString(),updated:new Date().toISOString()};
  DB.notes.unshift(newNote); save(); renderNotesList();
  closeMo('mo-share'); toast('Note imported: '+data.title);
}
async function revokeShare(code){
  if (CLOUD_ON) { try { await window.storage.delete('share:'+code, true); } catch(e) {} }
  const shares=getShares(); delete shares[code]; saveShares(shares);
  DB.myShares = (DB.myShares||[]).filter(s=>s.code!==code); save();
  renderSharedList(); toast('Share revoked');
}
function renderSharedList(){
  const cont=g('shared-list'); if(!cont) return;
  const mine = DB.myShares||[];
  cont.innerHTML=mine.length?mine.map(s=>
    `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--bor)">
      <code style="background:var(--s2);padding:2px 8px;border-radius:5px;font-family:var(--font-m);font-size:13px;font-weight:700;letter-spacing:1px">${s.code}</code>
      <span style="flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.title||'Untitled'}</span>
      <button onclick="revokeShare('${s.code}')" class="btn bd xs">Revoke</button>
    </div>`).join(''):'<div style="font-size:12px;color:var(--ink4);text-align:center;padding:12px">No shared notes</div>';
}

