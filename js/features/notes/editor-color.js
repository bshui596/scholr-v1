/* ── LATEX MODE ── */
let latexOn = false;
function toggleLatex(){
  latexOn = !latexOn;
  const panel = g('latex-panel'), btn = g('tb-latex');
  if(panel) panel.style.display = latexOn ? 'block' : 'none';
  if(btn) btn.classList.toggle('on', latexOn);
  if(latexOn && g('latex-src')) g('latex-src').focus();
}
function renderLatex(){
  const src = g('latex-src')?.value?.trim(); if(!src) return;
  // Convert common LaTeX to HTML
  let html = src
    .replace(/\\section\{([^}]+)\}/g,'<h2>$1</h2>')
    .replace(/\\subsection\{([^}]+)\}/g,'<h3>$1</h3>')
    .replace(/\\subsubsection\{([^}]+)\}/g,'<h4>$1</h4>')
    .replace(/\\textbf\{([^}]+)\}/g,'<strong>$1</strong>')
    .replace(/\\textit\{([^}]+)\}/g,'<em>$1</em>')
    .replace(/\\underline\{([^}]+)\}/g,'<u>$1</u>')
    .replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g,(m,items)=>{
      const lis=items.trim().split('\\item').filter(x=>x.trim()).map(x=>'<li>'+x.trim()+'</li>').join('');
      return '<ul>'+lis+'</ul>';
    })
    .replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g,(m,items)=>{
      const lis=items.trim().split('\\item').filter(x=>x.trim()).map(x=>'<li>'+x.trim()+'</li>').join('');
      return '<ol>'+lis+'</ol>';
    })
    .replace(/\\begin\{verbatim\}([\s\S]*?)\\end\{verbatim\}/g,'<pre>$1</pre>')
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\\\[([\s\S]*?)\\\]/g,'<div style="text-align:center;font-family:var(--font-m);font-size:16px;margin:14px 0;padding:10px;background:var(--s2);border-radius:8px">$1</div>')
    .replace(/\\\(([^)]+)\\\)/g,'<span style="font-family:var(--font-m);background:var(--s3);padding:1px 6px;border-radius:4px;font-size:13px">$1</span>')
    .replace(/\\\\|\n/g,'<br/>')
    .replace(/\n/g,'<br/>');
  g('doc-ed').focus();
  document.execCommand('insertHTML',false, '<div style="border-left:3px solid var(--ac2);margin:8px 0;padding:10px 14px;background:var(--acll);border-radius:0 8px 8px 0">' + html + '</div><p></p>');
  touch();
  if(g('latex-src')) g('latex-src').value = '';
}

