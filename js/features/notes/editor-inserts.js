/* ── EDITOR COMMANDS ── */
function autoResize(el){if(!el)return;el.style.height="auto";el.style.height=el.scrollHeight+"px";}
function printNote(){
  const n=DB.notes.find(x=>x.id===noteId); if(!n) return;
  const w=window.open('','_blank');
  const fontFam=DB.p.font||'outfit';
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${n.title||'Note'}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Outfit',Georgia,serif;max-width:760px;margin:0 auto;padding:48px 56px;line-height:1.7;color:#111;font-size:13.5px}
h1{font-size:28px;font-weight:700;margin-bottom:4px;line-height:1.2}
h2{font-size:20px;font-weight:600;margin:18px 0 6px;border-bottom:2px solid #e5e7eb;padding-bottom:4px}
h3{font-size:15px;font-weight:700;margin:14px 0 4px;color:#1f2937}
h4{font-size:13px;font-weight:700;margin:10px 0 3px}
p{margin-bottom:8px}
ul,ol{padding-left:24px;margin:6px 0}
li{margin-bottom:3px}
ul>li{list-style-type:disc}
ul>li>ul>li{list-style-type:circle}
ul>li>ul>li>ul>li{list-style-type:square}
ol>li{list-style-type:decimal}
ol>li>ol>li{list-style-type:lower-alpha}
ol>li>ol>li>ol>li{list-style-type:lower-roman}
pre{background:#f3f4f6;padding:14px;border-radius:6px;font-family:monospace;font-size:12px;overflow-x:auto;margin:10px 0}
code{background:#f3f4f6;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12px}
blockquote{border-left:4px solid #9ca3af;padding:8px 14px;background:#f9fafb;margin:10px 0;border-radius:0 6px 6px 0}
table{border-collapse:collapse;width:100%;margin:12px 0;font-size:12.5px;table-layout:fixed}
td,th{border:1px solid #d1d5db;padding:7px 11px;vertical-align:top}
th{background:#f3f4f6;font-weight:700}
.ed-check-item{display:flex;align-items:flex-start;gap:8px;padding:3px 0}
img{max-width:100%;border-radius:6px;margin:8px 0}
hr{border:none;border-top:1.5px solid #e5e7eb;margin:18px 0}
.eq-block{text-align:center;padding:12px;background:#f3f4f6;border-radius:6px;margin:12px 0}
details{border:1px solid #e5e7eb;border-radius:6px;padding:10px 14px;margin:10px 0}
@media print{body{padding:20px;font-size:12px}h1{font-size:22px}h2{font-size:17px}}
</style></head><body>
<h1>${n.title||'Untitled'}</h1>
${n.sub?'<p style="color:#6b7280;margin-top:4px;font-size:13px">'+n.sub+'</p>':''}
<div style="font-size:11px;color:#9ca3af;margin:8px 0 16px;border-bottom:1px solid #e5e7eb;padding-bottom:10px">${n.course||''} &nbsp;·&nbsp; ${new Date(n.updated||Date.now()).toLocaleDateString()}</div>
${n.content||'<p>Empty note</p>'}
</body></html>`);
  w.document.close();
  if(window.MathJax){ setTimeout(()=>{MathJax.typesetPromise([w.document.body]).then(()=>setTimeout(()=>w.print(),600)).catch(()=>setTimeout(()=>w.print(),600));},400); }
  else { setTimeout(()=>w.print(),600); }
}
function exportNoteWord(){
  const n=DB.notes.find(x=>x.id===noteId); if(!n){toast('No note open');return;}
  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8"><title>${n.title||'Untitled'}</title>
<style>
body{font-family:Calibri,Arial,sans-serif;font-size:12pt;line-height:1.5;color:#111}
h1{font-size:22pt;font-weight:700;margin-bottom:4pt}
h2{font-size:16pt;font-weight:600;margin:14pt 0 6pt}
h3{font-size:13pt;font-weight:700;margin:10pt 0 4pt}
table{border-collapse:collapse;width:100%}
td,th{border:1px solid #999;padding:6pt 8pt;vertical-align:top}
th{background:#f0f0f0;font-weight:700}
.ed-check-item{margin:3pt 0}
</style></head>
<body>
<h1>${n.title||'Untitled'}</h1>
${n.sub?'<p style="color:#666">'+n.sub+'</p>':''}
${n.content||'<p>Empty note</p>'}
</body></html>`;
  const blob = new Blob(['\ufeff', html], {type:'application/msword'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = (n.title||'note').toLowerCase().replace(/[^a-z0-9]+/g,'-') + '.doc';
  a.click();
  if (typeof logDataEvent === 'function') logDataEvent('Exported note', (n.title||'Untitled')+' as Word');
  toast('Downloaded as Word document');
}
function exportSingleNoteMarkdown(){
  const n=DB.notes.find(x=>x.id===noteId); if(!n){toast('No note open');return;}
  const div=document.createElement('div'); div.innerHTML=n.content||'';
  const text=(div.innerText||div.textContent||'').trim();
  const md = `# ${n.title||'Untitled'}\n\n${text}\n`;
  const blob = new Blob([md], {type:'text/markdown'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = (n.title||'note').toLowerCase().replace(/[^a-z0-9]+/g,'-') + '.md';
  a.click();
  if (typeof logDataEvent === 'function') logDataEvent('Exported note', (n.title||'Untitled')+' as Markdown');
  toast('Downloaded as Markdown');
}
function updateWordCount(){
  const el=g('doc-ed'), wc=g('ed-wc'); if(!el||!wc) return;
  const text=(el.innerText||'').trim();
  const words=text?text.split(/\s+/).length:0;
  wc.textContent=words+' words';
}
function cmd(c,v){g('doc-ed').focus();document.execCommand(c,false,v||null);touch();}
function edKey(e){
  if(e.key==='Tab'){
    e.preventDefault();
    // If in a list, indent/outdent the list item (like Google Docs)
    const sel=window.getSelection();
    if(sel&&sel.rangeCount){
      let node=sel.anchorNode;
      while(node&&node!==g('doc-ed')&&node.nodeName!=='LI') node=node.parentNode;
      if(node&&node.nodeName==='LI'){
        document.execCommand(e.shiftKey?'outdent':'indent',false,null);
        return;
      }
    }
    document.execCommand('insertHTML',false,'\u00a0\u00a0\u00a0\u00a0');
  }
  if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();saveNote();toast('\ud83d\udcbe Saved!');}
  if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.key==='b'){e.preventDefault();cmd('bold');}
  if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.key==='i'){e.preventDefault();cmd('italic');}
  if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.key==='u'){e.preventDefault();cmd('underline');}
  if((e.ctrlKey||e.metaKey)&&e.key==='Enter'&&latexOn){e.preventDefault();renderLatex();}
  setTimeout(()=>trackFmtState(),10);
}

