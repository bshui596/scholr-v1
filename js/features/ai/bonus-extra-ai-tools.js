async function runAiExtraTool(tool){
  const outEl = g('ai-' + tool + '-output');
  const btn = event && event.target;
  if (tool === 'translate') {
    const text = g('ai-translate-input').value.trim();
    if (!text) { outEl.style.display='block'; outEl.textContent='Please enter text first.'; return; }
    if (btn) btn.disabled = true;
    outEl.style.display = 'block'; outEl.textContent = 'Translating…';
    try {
      const { translated } = await aiPost('/api/translate', { text, targetLanguage: g('ai-translate-lang').value });
      outEl.textContent = translated;
    } catch (err) { outEl.textContent = '⚠️ ' + err.message; }
    finally { if (btn) btn.disabled = false; }
  } else if (tool === 'brainstorm') {
    const topic = g('ai-brainstorm-input').value.trim();
    const wrap = g('ai-brainstorm-output');
    if (!topic) { wrap.textContent = 'Please enter a topic first.'; return; }
    if (btn) btn.disabled = true;
    wrap.innerHTML = '<div class="ai-tool-output">Brainstorming…</div>';
    try {
      const { ideas } = await aiPost('/api/brainstorm', { topic });
      wrap.innerHTML = '';
      (ideas || []).forEach((idea, i) => {
        const div = document.createElement('div');
        div.className = 'ai-tool-output bonus-card-hover';
        div.style.animationDelay = (i * 0.03) + 's';
        div.textContent = '💡 ' + idea;
        wrap.appendChild(div);
      });
    } catch (err) { wrap.innerHTML = '<div class="ai-tool-output">⚠️ ' + err.message + '</div>'; }
    finally { if (btn) btn.disabled = false; }
  } else if (tool === 'citation') {
    const source = g('ai-citation-input').value.trim();
    if (!source) { outEl.style.display='block'; outEl.textContent='Please paste source info first.'; return; }
    if (btn) btn.disabled = true;
    outEl.style.display = 'block'; outEl.textContent = 'Generating…';
    try {
      const { citation } = await aiPost('/api/citation', { source, style: g('ai-citation-style').value });
      outEl.textContent = citation;
    } catch (err) { outEl.textContent = '⚠️ ' + err.message; }
    finally { if (btn) btn.disabled = false; }
  }
}

