// ---------- Shared helper for one-shot tool endpoints ----------
// Includes a timeout + one automatic retry on network failure so a single
// dropped request doesn't make a tool look broken. Also logs timing for the Admin Panel.
async function aiPost(path, body){
  const reqStart = performance.now();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetchWithTimeout(AI_BASE + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }, AI_TIMEOUT_MS);
      let data = {};
      try { data = await res.json(); } catch (_) {}
      if (!res.ok) throw new Error(data.error || ('Server error (' + res.status + ')'));
      aiLogRequest(path.replace('/api/',''), Math.round(performance.now() - reqStart), true);
      return data;
    } catch (err) {
      const isAbort = err.name === 'AbortError';
      const isNetwork = err instanceof TypeError;
      if (attempt === 0 && (isAbort || isNetwork)) continue;
      aiLogRequest(path.replace('/api/',''), Math.round(performance.now() - reqStart), false);
      throw isAbort ? new Error('Request timed out — please try again.') : err;
    }
  }
}

// ---------- Generic tool runner wired to the tab panes ----------
const AI_TOOL_CONFIG = {
  notes:      { endpoint: '/api/notes',      buildBody: () => ({ text: g('ai-notes-input').value.trim() }),
                resultKey: 'notes',      outputId: 'ai-notes-output' },
  essay:      { endpoint: '/api/essay',      buildBody: () => ({ topic: g('ai-essay-input').value.trim(), wordCount: +g('ai-essay-words').value, tone: g('ai-essay-tone').value }),
                resultKey: 'essay',      outputId: 'ai-essay-output' },
  outline:    { endpoint: '/api/outline',    buildBody: () => ({ topic: g('ai-outline-input').value.trim() }),
                resultKey: 'outline',    outputId: 'ai-outline-output' },
  summarize:  { endpoint: '/api/summarize',  buildBody: () => ({ text: g('ai-summarize-input').value.trim() }),
                resultKey: 'summary',    outputId: 'ai-summarize-output' },
  explain:    { endpoint: '/api/explain',    buildBody: () => ({ text: g('ai-explain-input').value.trim(), level: g('ai-explain-level').value }),
                resultKey: 'explanation',outputId: 'ai-explain-output' },
  rewrite:    { endpoint: '/api/rewrite',    buildBody: () => ({ text: g('ai-rewrite-input').value.trim(), tone: g('ai-rewrite-tone').value }),
                resultKey: 'rewritten',  outputId: 'ai-rewrite-output' },
  polish:     { endpoint: '/api/polish',     buildBody: () => ({ text: g('ai-polish-input').value.trim() }),
                resultKey: 'improved',   outputId: 'ai-polish-output' },
  studyplan:  { endpoint: '/api/studyplan',  buildBody: () => ({ text: g('ai-studyplan-input').value.trim(), days: +g('ai-studyplan-days').value }),
                resultKey: 'plan',       outputId: 'ai-studyplan-output' },
};

async function runAiTool(tool){
  if (tool === 'flashcards') return runAiFlashcards();
  if (tool === 'quiz') return runAiQuiz();

  const cfg = AI_TOOL_CONFIG[tool];
  if (!cfg) return;
  const body = cfg.buildBody();
  const requiredVal = body.text || body.topic;
  const outEl = g(cfg.outputId);
  if (!requiredVal) { if (outEl){ outEl.style.display='block'; outEl.textContent = 'Please enter some text first.'; } return; }

  const btn = event && event.target;
  if (btn) { btn.disabled = true; btn.textContent = 'Working…'; }
  if (outEl) { outEl.style.display = 'block'; outEl.textContent = 'Thinking…'; }

  try {
    const data = await aiPost(cfg.endpoint, body);
    if (outEl) { outEl.textContent = data[cfg.resultKey] || 'No response.'; aiTypeset(outEl); }
  } catch (err) {
    console.error('AI tool error (' + tool + '):', err);
    if (outEl) outEl.textContent = '⚠️ ' + err.message;
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = btn.textContent.replace('Working…', '') || 'Run'; }
  }
}

