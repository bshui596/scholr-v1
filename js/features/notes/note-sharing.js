/* ── DATA EXPORT / IMPORT ── */
function todayStr(){ return new Date().toISOString().slice(0,10); }
function dlBlob(content, filename, mime){
  const blob=new Blob([content],{type:mime});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click();
}
function logDataEvent(action, detail){
  DB.p.dataLog = DB.p.dataLog || [];
  DB.p.dataLog.unshift({action, detail:detail||'', date:new Date().toISOString()});
  DB.p.dataLog = DB.p.dataLog.slice(0,8);
  save(); renderDataLog();
}
function renderDataLog(){
  const el=g('data-log'); if(!el) return;
  const log = DB.p.dataLog||[];
  el.innerHTML = log.length ? log.map(l=>`<div class="set-row" style="padding:8px 2px"><label style="font-weight:600">${l.action}<small>${l.detail}</small></label><span style="font-size:10.5px;color:var(--ink4);white-space:nowrap">${new Date(l.date).toLocaleString()}</span></div>`).join('')
    : '<p style="font-size:11.5px;color:var(--ink4)">No activity yet — exports and imports will show up here.</p>';
}
function renderDataPage(){
  renderDataLog();
  const row=g('data-last-backup-row'), lbl=g('data-last-backup');
  if (DB.p.lastBackupAt && row && lbl) { row.style.display='flex'; lbl.textContent=new Date(DB.p.lastBackupAt).toLocaleString(); }
  else if (row) row.style.display='none';
  const sel=g('data-reminder-sel'); if (sel) sel.value=String(DB.p.backupReminderDays||0);
}
function setBackupReminder(days){ DB.p.backupReminderDays=+days; save(); toast(+days===0?'Backup reminders off':'Backup reminders set'); }
function checkBackupReminder(){
  const days=DB.p.backupReminderDays; if (!days) return;
  const last=DB.p.lastBackupAt||0;
  if (Date.now()-last > days*86400000) toast('⏰ It\'s been a while — consider backing up your data');
}
function handleDataDrop(ev){
  ev.preventDefault();
  g('data-dropzone')?.classList.remove('drag-on');
  const file = ev.dataTransfer?.files?.[0]; if (!file) return;
  if (!file.name.endsWith('.json')) { toast('Please drop a .json backup file'); return; }
  const r=new FileReader();
  r.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      if(!data.p||!data.notes) throw new Error('Invalid format');
      if(!confirm('This will replace ALL your current data. Continue?')) return;
      DB=data; save(); renderAll(); applyTheme(DB.p.theme||'forest'); applyFont(DB.p.font||'outfit'); applyEditorPrefs();
      logDataEvent('Restored backup', file.name);
      toast('Data imported successfully!');
    }catch(err){ toast('Error: '+err.message); }
  };
  r.readAsText(file);
}
function exportData(){
  DB.p.lastBackupAt = Date.now();
  const blob=new Blob([JSON.stringify(DB,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download='scholr-backup-'+todayStr()+'.json';
  a.click(); logDataEvent('Full backup downloaded',''); toast('Data exported!');
}
function importData(){
  const inp=document.createElement('input'); inp.type='file'; inp.accept='.json';
  inp.onchange=e=>{
    const f=e.target.files[0]; if(!f) return;
    const r=new FileReader();
    r.onload=ev=>{
      try{
        const data=JSON.parse(ev.target.result);
        if(!data.p||!data.notes) throw new Error('Invalid format');
        if(!confirm('This will replace ALL your current data. Continue?')) return;
        DB=data; save(); renderAll(); applyTheme(DB.p.theme||'forest'); applyFont(DB.p.font||'outfit'); applyEditorPrefs();
        logDataEvent('Restored backup', f.name);
        toast('Data imported successfully!');
      }catch(err){ toast('Error: '+err.message); }
    };
    r.readAsText(f);
  };
  inp.click();
}
function exportSettings(){
  const settings={p:DB.p,courses:DB.courses,slots:DB.slots};
  const blob=new Blob([JSON.stringify(settings,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download='scholr-settings-'+todayStr()+'.json';
  a.click(); logDataEvent('Exported settings',''); toast('Settings exported!');
}
function importSettings(){
  const inp=document.createElement('input'); inp.type='file'; inp.accept='.json';
  inp.onchange=e=>{
    const f=e.target.files[0]; if(!f) return;
    const r=new FileReader();
    r.onload=ev=>{
      try{
        const data=JSON.parse(ev.target.result);
        if(!data.p) throw new Error('Invalid settings file');
        if(!confirm('Import these settings? This will overwrite your current settings.')) return;
        DB.p=data.p; if(data.courses) DB.courses=data.courses; if(data.slots) DB.slots=data.slots;
        save(); renderAll(); applyTheme(DB.p.theme||'forest'); applyFont(DB.p.font||'outfit'); applyEditorPrefs();
        logDataEvent('Imported settings', f.name);
        toast('Settings imported!');
      }catch(err){ toast('Error: '+err.message); }
    };
    r.readAsText(f);
  };
  inp.click();
}
function exportNotesMarkdown(){
  if (!DB.notes.length) { toast('No notes to export'); return; }
  const md = DB.notes.map(n=>{
    const div=document.createElement('div'); div.innerHTML=n.content||'';
    const text=(div.innerText||div.textContent||'').trim();
    return `# ${n.title||'Untitled'}\n\n${text}\n`;
  }).join('\n---\n\n');
  dlBlob(md, 'scholr-notes-'+todayStr()+'.md', 'text/markdown');
  logDataEvent('Exported notes', DB.notes.length+' notes as Markdown');
}
function exportGradesCSV(){
  if (!DB.grades.length) { toast('No grades to export'); return; }
  const rows=[['Name','Course','Category','Mark','Out Of','Percent','Weight','Date','Notes']];
  DB.grades.forEach(gr=>rows.push([gr.name,gr.course,gr.cat,gr.mark,gr.out,gr.pct,gr.wt,gr.date,gr.notes||'']));
  const csv=rows.map(r=>r.map(v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`).join(',')).join('\n');
  dlBlob(csv, 'scholr-grades-'+todayStr()+'.csv', 'text/csv');
  logDataEvent('Exported grades', DB.grades.length+' entries as CSV');
}
function fcExportDeck(deckId){
  const deck=(DB.flashcards.decks||[]).find(d=>d.id===deckId); if (!deck) return;
  const cards=(DB.flashcards.cards||[]).filter(c=>c.deckId===deckId).map(c=>({q:c.q,a:c.a,hint:c.hint||''}));
  dlBlob(JSON.stringify({deck:{name:deck.name,desc:deck.desc||''},cards},null,2),
    'scholr-deck-'+(deck.name||'deck').toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.json', 'application/json');
  logDataEvent('Exported deck', deck.name);
}
function fcExportAllDecks(){
  if (!DB.flashcards.decks?.length) { toast('No decks to export'); return; }
  const payload = DB.flashcards.decks.map(d=>({
    deck:{name:d.name,desc:d.desc||''},
    cards:(DB.flashcards.cards||[]).filter(c=>c.deckId===d.id).map(c=>({q:c.q,a:c.a,hint:c.hint||''}))
  }));
  dlBlob(JSON.stringify(payload,null,2), 'scholr-flashcards-'+todayStr()+'.json', 'application/json');
  logDataEvent('Exported all decks', DB.flashcards.decks.length+' decks');
}

