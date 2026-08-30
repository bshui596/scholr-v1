async function aiChatSend(e){
  if (e) e.preventDefault();
  if (aiChatBusy) return false;
  const inp = g('ai-chat-input');
  if (!inp) return false;
  const text = inp.value.trim();
  if (!text) return false;

  inp.value = '';
  aiChatAppendMsg(text, 'user');
  aiChatHistory.push({ role: 'user', content: text });
  aiSaveHistory();

  const typingEl = g('ai-chat-typing');
  const sendBtn = g('ai-chat-send-btn');
  aiChatBusy = true;
  if (typingEl) typingEl.style.display = 'block';
  if (sendBtn) sendBtn.disabled = true;
  inp.disabled = true;

  const botEl = aiChatAppendMsg('', 'bot');
  let fullReply = '';
  const reqStart = performance.now();

  // One retry on network-level failure (not on explicit server error messages) — keeps chat working through a hiccup instead of dying on the first blip.
  for (let attempt = 0; attempt < 2; attempt++) {
    fullReply = '';
    try {
      const res = await fetchWithTimeout(AI_CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: aiChatHistory.slice(-10) })
      }, AI_TIMEOUT_MS);
      if (!res.ok || !res.body) {
        let errMsg = 'Server error (' + res.status + ')';
        try { const errData = await res.json(); if (errData.error) errMsg = errData.error; } catch (_) {}
        throw new Error(errMsg);
      }
      if (typingEl) typingEl.style.display = 'none';

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const msgsWrap = g('ai-chat-msgs');
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          let parsed;
          try { parsed = JSON.parse(jsonStr); } catch (_) { continue; }
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.text) {
            fullReply += parsed.text;
            botEl.innerHTML = aiRenderMd(fullReply);
            if (msgsWrap) msgsWrap.scrollTop = msgsWrap.scrollHeight;
          }
        }
      }
      if (!fullReply.trim()) botEl.textContent = "Sorry, I couldn't come up with a response to that.";
      aiChatHistory.push({ role: 'assistant', content: fullReply });
      aiSaveHistory();
      aiLogRequest('chat', Math.round(performance.now() - reqStart), true);
      break; // success — no need to retry
    } catch (err) {
      const isAbort = err.name === 'AbortError';
      const isNetwork = err instanceof TypeError; // fetch network failure
      if (attempt === 0 && (isAbort || isNetwork)) {
        botEl.textContent = 'Connection hiccup — retrying…';
        continue;
      }
      console.error('AI chat error:', err);
      botEl.textContent = '⚠️ Sorry, I couldn\'t reach the assistant (' + (isAbort ? 'timed out' : err.message) + ').';
      aiLogRequest('chat', Math.round(performance.now() - reqStart), false);
    }
  }

  aiChatBusy = false;
  if (typingEl) typingEl.style.display = 'none';
  if (sendBtn) sendBtn.disabled = false;
  inp.disabled = false;
  inp.focus();
  aiTypeset(botEl);
  aiAddSpeakerButton(botEl, fullReply);
  return false;
}

