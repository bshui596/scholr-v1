/* ── DRIVE ── */
const FOLDER_ICONS = ['📁', '📂', '📘', '📗', '📙', '📕', '📒', '🔬', '🎨', '📐', '🌍', '🏛', '⚗️', '🧮', '📏', '🎭', '🏆', '🧪', '📌', '🗂'];
const FOLDER_COLORS = ['#1D4ED8', '#0F6B30', '#6D28D9', '#BE185D', '#B45309', '#0F766E', '#374151', '#C05418', '#901818', '#0369A1'];
let driveView = 'grid'; // 'grid' | 'list'
let drivePath = []; // breadcrumb stack [{id,name}]

function toggleDriveView(){
  driveView = driveView==='grid'?'list':'grid';
  const btn=g('drive-view-btn');
  if(btn) btn.textContent = driveView==='grid'?'⊞ Grid':'☰ List';
  renderDrive();
}

function getDriveFolder(){
  // Returns current folder id or null (root)
  return drivePath.length ? drivePath[drivePath.length-1].id : null;
}

function renderDriveBreadcrumb(){
  const bc=g('drive-breadcrumb'); if(!bc) return;
  const crumbs=[{id:null,name:'My Drive'},...drivePath];
  bc.innerHTML = crumbs.map((cr,i)=>{
    const isLast = i===crumbs.length-1;
    return isLast
      ? `<span style="font-weight:700;color:var(--ink)">${cr.name}</span>`
      : `<span style="cursor:pointer;color:var(--ac)" onclick="driveBcNav(${i})">${cr.name}</span><span style="color:var(--ink4);margin:0 3px">›</span>`;
  }).join('');
}

function driveBcNav(depth){
  // Navigate to breadcrumb level
  drivePath = drivePath.slice(0,depth); // 0 = root (empty), 1 = first folder, etc.
  renderDrive();
}

function openDriveFolder(fid){
  if(!DB.folders) return;
  const f=DB.folders.find(x=>x.id===fid); if(!f) return;
  drivePath.push({id:fid,name:f.name});
  renderDrive();
}

function renderDrive(q=''){
  if(!DB.folders) DB.folders=[];
  const curFolderId = getDriveFolder();
  renderDriveBreadcrumb();
  const cont=g('drive-content'); if(!cont) return;

  // Subfolders in current folder
  const subFolders = DB.folders.filter(f=>f.parent===(curFolderId||null));
  // Notes in current folder (folder = null means root or matching folderId)
  let notes = DB.notes.filter(n=>(n.folderId||null)===(curFolderId||null));
  if(q){ 
    const ql=q.toLowerCase();
    notes=[...DB.notes].filter(n=>n.title?.toLowerCase().includes(ql)||n.content?.toLowerCase().includes(ql));
  }

  let html='';

  // Folders section
  if(subFolders.length && !q){
    html+=`<div class="row-hd" style="margin-bottom:10px"><div class="sec-lbl">Folders</div><button class="btn bo xs" onclick="showMo('mo-folder')">+ New</button></div>`;
    html+=driveView==='grid'
      ? `<div class="folder-g">${subFolders.map(f=>folderCard(f,'grid')).join('')}</div>`
      : `<div class="card" style="padding:8px">${subFolders.map(f=>folderCard(f,'list')).join('')}</div>`;
  } else if(!q) {
    html+=`<div style="margin-bottom:12px"><button class="btn bo sm" onclick="showMo('mo-folder')">📁 New Folder</button></div>`;
  }

  // Notes section
  const sortedNotes=[...notes].sort((a,b)=>new Date(b.updated)-new Date(a.updated));
  const label = q ? `Search results (${sortedNotes.length})` : curFolderId ? 'Notes in this folder' : 'All Notes';
  html+=`<div class="row-hd" style="margin-bottom:10px"><div class="sec-lbl">${label}</div></div>`;
  
  if(!sortedNotes.length){
    html+=`<div class="emp"><span class="ei">${q?'🔍':'📝'}</span><p>${q?'No results found':'No notes here yet'}</p><button class="btn bp sm" onclick="newNote();go('notes')">+ New Note</button></div>`;
  } else if(driveView==='grid'){
    html+=`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">${sortedNotes.map(n=>noteCard(n,'grid')).join('')}</div>`;
  } else {
    html+=`<div class="card" style="padding:6px">${sortedNotes.map(n=>noteCard(n,'list')).join('')}</div>`;
  }

  cont.innerHTML=html;

  // Build folder parent select in modal
  const fp=g('folder-parent');
  if(fp){
    fp.innerHTML='<option value="">Root (top level)</option>'+(DB.folders||[]).map(f=>`<option value="${f.id}">${f.icon||'📁'} ${f.name}</option>`).join('');
    if(curFolderId) setSel('folder-parent',curFolderId);
  }
  // Build folder icons
  const ig=g('folder-icon-g');
  if(ig) ig.innerHTML=FOLDER_ICONS.map((ic,i)=>`<div onclick="selectFolderIcon(this,'${ic}')" style="padding:5px;border-radius:6px;cursor:pointer;text-align:center;font-size:18px;border:2px solid ${i===0?'var(--ac2)':'transparent'};transition:all .12s" title="${ic}">${ic}</div>`).join('');
  const cg=g('folder-color-g');
  if(cg) cg.innerHTML=FOLDER_COLORS.map((col,i)=>`<div onclick="selectFolderColor(this,'${col}')" style="width:24px;height:24px;border-radius:50%;background:${col};cursor:pointer;border:3px solid ${i===0?'#fff':'transparent'};box-shadow:${i===0?'0 0 0 2px var(--ac)':'none'};transition:all .12s"></div>`).join('');
}

let selFolderIcon = FOLDER_ICONS[0];
let selFolderColor = FOLDER_COLORS[0];
function selectFolderIcon(el,ic){selFolderIcon=ic;document.querySelectorAll('#folder-icon-g div').forEach(d=>d.style.border='2px solid transparent');el.style.border='2px solid var(--ac2)';}
function selectFolderColor(el,col){selFolderColor=col;document.querySelectorAll('#folder-color-g div').forEach(d=>{d.style.border='3px solid transparent';d.style.boxShadow='none';});el.style.border='3px solid #fff';el.style.boxShadow='0 0 0 2px var(--ac)';}

function folderCard(f, mode){
  const cnt=DB.notes.filter(n=>n.folderId===f.id).length;
  const sub=DB.folders.filter(x=>x.parent===f.id).length;
  if(mode==='grid'){
    return `<div class="df" onclick="openDriveFolder('${f.id}')" style="position:relative;border-top:3px solid ${f.color||'var(--ac)'}" title="${f.name}">
      <div class="df-ico" style="color:${f.color||'var(--ac)'}">${f.icon||'📁'}</div>
      <div class="df-n">${f.name}</div>
      <div class="df-c">${cnt} note${cnt!==1?'s':''}${sub?' · '+sub+' folder'+(sub!==1?'s':''):''}</div>
      <button onclick="deleteFolderConfirm('${f.id}',event)" style="position:absolute;top:4px;right:4px;background:none;border:none;color:var(--ink4);cursor:pointer;font-size:10px;opacity:0;padding:2px" class="df-del">✕</button>
    </div>`;
  } else {
    return `<div class="fr-row" onclick="openDriveFolder('${f.id}')" style="border-radius:7px;position:relative">
      <span class="fr-ico" style="color:${f.color||'var(--ac)'}">${f.icon||'📁'}</span>
      <span class="fr-n" style="font-weight:700">${f.name}</span>
      <span class="fr-m" style="color:var(--ink4)">${cnt} note${cnt!==1?'s':''}</span>
      <span class="fr-d" style="color:var(--ink4)">Folder</span>
    </div>`;
  }
}

function noteCard(n, mode){
  const course=DB.courses.find(c=>c.name===n.course);
  const col=course?.color||'#0F6B30';
  const words=(n.content||'').replace(/<[^>]+>/g,'').trim().split(/\s+/).filter(Boolean).length;
  const preview=(n.content||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,80);
  if(mode==='grid'){
    return `<div onclick="openNote('${n.id}');go('notes')" style="background:var(--sur);border:1px solid var(--bor);border-radius:var(--rad);padding:12px;cursor:pointer;transition:all .14s;box-shadow:var(--sh1);position:relative;border-top:3px solid ${col}" onmouseover="this.style.boxShadow='var(--sh2)';this.style.transform='translateY(-2px)'" onmouseout="this.style.boxShadow='var(--sh1)';this.style.transform=''">
      <div style="font-weight:700;font-size:12.5px;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${n.title||'Untitled'}</div>
      <div style="font-size:10.5px;color:var(--ink4);margin-bottom:6px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.4">${preview||'Empty note'}</div>
      <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap">
        <span style="font-size:9.5px;font-weight:700;background:${col}22;color:${col};padding:1px 6px;border-radius:99px">${n.course||'General'}</span>
        <span style="font-size:9.5px;color:var(--ink4);margin-left:auto">${relTime(n.updated)}</span>
      </div>
      <div style="font-size:9px;color:var(--ink4);margin-top:3px">${words} words</div>
      <div style="position:absolute;top:5px;right:5px;display:flex;gap:3px;opacity:0;transition:opacity .12s" class="note-card-acts">
        <button onclick="openMoveNote('${n.id}',event)" style="background:var(--acll);color:var(--ac);border:none;border-radius:4px;padding:2px 5px;font-size:9.5px;cursor:pointer">📂</button>
        <button onclick="delNote('${n.id}',event)" style="background:var(--redl);color:var(--red);border:none;border-radius:4px;padding:2px 5px;font-size:9.5px;cursor:pointer">✕</button>
      </div>
    </div>`;
  } else {
    return `<div class="fr-row" onclick="openNote('${n.id}');go('notes')" style="position:relative">
      <span class="fr-ico">📝</span>
      <div style="flex:1;min-width:0">
        <div class="fr-n">${n.title||'Untitled'}</div>
        <div style="font-size:10.5px;color:var(--ink4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${preview||'Empty'}</div>
      </div>
      <span class="fr-m" style="color:${col}">${n.course||'General'}</span>
      <span class="fr-d">${relTime(n.updated)}</span>
      <button onclick="openMoveNote('${n.id}',event)" style="background:none;border:none;color:var(--ink4);cursor:pointer;font-size:12px;padding:2px 4px;opacity:0" class="note-move-btn">📂</button>
    </div>`;
  }
}

// Add hover show actions for note cards
document.addEventListener('mouseover',e=>{
  const card=e.target.closest('[class=""]');
  const acts=e.target.closest('div')?.querySelector('.note-card-acts');
  if(acts) acts.style.opacity='1';
  const mb=e.target.closest('.fr-row')?.querySelector('.note-move-btn');
  if(mb) mb.style.opacity='1';
});
document.addEventListener('mouseout',e=>{
  const acts=e.target.closest('div')?.querySelector('.note-card-acts');
  if(acts) acts.style.opacity='0';
  const mb=e.target.closest('.fr-row')?.querySelector('.note-move-btn');
  if(mb) mb.style.opacity='0';
});

function saveFolder(){
  const name=g('folder-name')?.value?.trim(); if(!name){toast('Enter a folder name!');return;}
  if(!DB.folders) DB.folders=[];
  const fid='f'+Date.now();
  DB.folders.push({id:fid,name,icon:selFolderIcon,color:selFolderColor,parent:g('folder-parent')?.value||null,created:new Date().toISOString()});
  g('folder-name').value='';
  save(); closeMo('mo-folder'); renderDrive(); toast('Folder created: '+name);
}

function deleteFolderConfirm(fid,e){
  e.stopPropagation();
  if(!confirm('Delete this folder? Notes will move to root.')) return;
  DB.notes.filter(n=>n.folderId===fid).forEach(n=>delete n.folderId);
  DB.folders=(DB.folders||[]).filter(f=>f.id!==fid&&f.parent!==fid);
  save(); renderDrive(); toast('Folder deleted');
}

function openMoveNote(nid,e){
  e.stopPropagation();
  setValue('move-note-id',nid);
  const sel=g('move-folder-sel');
  if(sel){
    sel.innerHTML='<option value="">Root (no folder)</option>'+(DB.folders||[]).map(f=>`<option value="${f.id}">${f.icon||'📁'} ${f.name}</option>`).join('');
    const n=DB.notes.find(x=>x.id===nid);
    if(n?.folderId) setSel('move-folder-sel',n.folderId);
  }
  showMo('mo-move-note');
}

function doMoveNote(){
  const nid=g('move-note-id')?.value, fid=g('move-folder-sel')?.value||null;
  const n=DB.notes.find(x=>x.id===nid); if(!n) return;
  n.folderId=fid||undefined;
  save(); closeMo('mo-move-note'); renderDrive(); toast('Note moved!');
}


