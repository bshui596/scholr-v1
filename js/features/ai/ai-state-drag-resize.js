/* ---- widget logic ---- */
const AI_BASE = 'https://scholr-btv4.onrender.com';
const AI_CHAT_ENDPOINT = AI_BASE + '/api/chat';
const AI_TIMEOUT_MS = 20000; // fail fast with a clear message instead of hanging forever

// Races a fetch against a timeout instead of using AbortController/signal.
// Some sandboxed preview hosts proxy fetch() through postMessage to a parent
// frame, and AbortSignal objects can't be structured-cloned — passing one in
// fetch options throws "DataCloneError: ...AbortSignal object could not be
// cloned." Racing avoids putting a signal in the options object at all.
function fetchWithTimeout(url, options, timeoutMs){
  const timeoutErr = () => Object.assign(new Error('Request timed out — please try again.'), { name: 'AbortError' });
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(timeoutErr()), timeoutMs))
  ]);
}

// ---------- Request timing/success log (feeds the Admin Panel stats) ----------
function aiLoadReqLog(){
  try { return JSON.parse(localStorage.getItem('scholr_ai_reqlog') || '[]'); } catch (_) { return []; }
}
let aiReqLog = aiLoadReqLog();
function aiLogRequest(endpoint, ms, ok){
  aiReqLog.push({ endpoint, ms, ok, t: Date.now() });
  if (aiReqLog.length > 40) aiReqLog = aiReqLog.slice(-40);
  try { localStorage.setItem('scholr_ai_reqlog', JSON.stringify(aiReqLog)); } catch (_) {}
}
function aiGetStats(){
  if (!aiReqLog.length) return null;
  const recent = aiReqLog.slice(-20);
  const okCount = recent.filter(r => r.ok).length;
  const avgMs = Math.round(recent.reduce((s,r) => s + r.ms, 0) / recent.length);
  const last = recent[recent.length - 1];
  const byEndpoint = {};
  recent.forEach(r => {
    if (!byEndpoint[r.endpoint]) byEndpoint[r.endpoint] = { count: 0, totalMs: 0 };
    byEndpoint[r.endpoint].count++;
    byEndpoint[r.endpoint].totalMs += r.ms;
  });
  return {
    lastMs: last.ms, lastOk: last.ok, lastEndpoint: last.endpoint,
    avgMs, successRate: Math.round((okCount / recent.length) * 100),
    totalLogged: aiReqLog.length, byEndpoint
  };
}
const aiSessionStart = Date.now();

// ---------- Memory: restore chat history + panel size/position across reloads ----------
function aiLoadHistory(){
  try { return JSON.parse(localStorage.getItem('scholr_ai_chat_history') || '[]'); }
  catch (_) { return []; }
}
function aiSaveHistory(){
  try { localStorage.setItem('scholr_ai_chat_history', JSON.stringify(aiChatHistory.slice(-30))); } catch (_) {}
}

let aiChatHistory = aiLoadHistory();
let aiChatOpen = false;
let aiChatBusy = false;

function aiChatToggle(){
  aiChatOpen = !aiChatOpen;
  const panel = g('ai-chat-panel');
  if (panel) panel.classList.toggle('on', aiChatOpen);
  if (aiChatOpen) { const inp = g('ai-chat-input'); if (inp) setTimeout(() => inp.focus(), 60); }
}

// Restore previous conversation into the chat pane on load (if any)
function aiRestoreChatUI(){
  const wrap = g('ai-chat-msgs');
  if (!wrap || !aiChatHistory.length) return;
  wrap.querySelectorAll('.ai-msg').forEach((el,i) => { if (i>0) el.remove(); }); // keep the greeting
  aiChatHistory.forEach(turn => {
    const el = aiChatAppendMsg(turn.content, turn.role === 'user' ? 'user' : 'bot');
    if (turn.role === 'assistant' && el) { aiTypeset(el); aiAddSpeakerButton(el, turn.content); }
  });
}

// ---------- Drag + resize the panel (position/size saved to localStorage) ----------
function aiApplySavedGeometry(){
  const panel = g('ai-chat-panel');
  if (!panel) return;
  try {
    const geo = JSON.parse(localStorage.getItem('scholr_ai_panel_geo') || 'null');
    if (geo) {
      if (geo.w) panel.style.width = geo.w + 'px';
      if (geo.h) panel.style.height = geo.h + 'px';
      if (geo.top != null && geo.left != null) {
        panel.style.top = geo.top + 'px'; panel.style.left = geo.left + 'px';
        panel.style.right = 'auto'; panel.style.bottom = 'auto';
      }
    }
  } catch (_) {}
}
function aiSaveGeometry(){
  const panel = g('ai-chat-panel');
  if (!panel) return;
  const rect = panel.getBoundingClientRect();
  localStorage.setItem('scholr_ai_panel_geo', JSON.stringify({
    w: Math.round(rect.width), h: Math.round(rect.height),
    top: Math.round(rect.top), left: Math.round(rect.left)
  }));
}
(function initAiDragResize(){
  document.addEventListener('mousedown', (e) => {
    const head = e.target.closest && e.target.closest('#ai-chat-head');
    const handle = e.target.closest && e.target.closest('#ai-resize-handle');
    const panel = g('ai-chat-panel');
    if (!panel) return;

    if (head && !e.target.closest('button')) {
      const rect = panel.getBoundingClientRect();
      const offX = e.clientX - rect.left, offY = e.clientY - rect.top;
      panel.classList.add('ai-dragging');
      const onMove = (me) => {
        panel.style.left = Math.max(4, Math.min(window.innerWidth - 60, me.clientX - offX)) + 'px';
        panel.style.top = Math.max(4, Math.min(window.innerHeight - 60, me.clientY - offY)) + 'px';
        panel.style.right = 'auto'; panel.style.bottom = 'auto';
      };
      const onUp = () => {
        panel.classList.remove('ai-dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        aiSaveGeometry();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    } else if (handle) {
      const rect = panel.getBoundingClientRect();
      const startX = e.clientX, startY = e.clientY, startW = rect.width, startH = rect.height, startLeft = rect.left;
      panel.classList.add('ai-dragging');
      const onMove = (me) => {
        const newW = Math.max(300, startW - (me.clientX - startX));
        const newH = Math.max(340, startH + (me.clientY - startY));
        panel.style.width = newW + 'px';
        panel.style.height = newH + 'px';
        panel.style.left = (startLeft + (startW - newW)) + 'px';
        panel.style.right = 'auto'; panel.style.bottom = 'auto';
      };
      const onUp = () => {
        panel.classList.remove('ai-dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        aiSaveGeometry();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }
  });
  document.addEventListener('DOMContentLoaded', aiApplySavedGeometry);
  if (document.readyState !== 'loading') aiApplySavedGeometry();
})();

// Tab switching
document.addEventListener('click', (e) => {
  const tab = e.target.closest && e.target.closest('.ai-tab');
  if (!tab) return;
  document.querySelectorAll('.ai-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  document.querySelectorAll('.ai-body').forEach(p => p.classList.add('hidden'));
  const pane = g('ai-pane-' + tab.dataset.tab);
  if (pane) pane.classList.remove('hidden');
});

function aiTypeset(el){
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([el]).catch(err => console.error('MathJax render error:', err));
  }
}

// ---------- Lightweight markdown renderer for AI replies ----------
// No external markdown library is loaded (keeps the app dependency-free/offline),
// so this handles just what the AI's system prompts actually produce:
// **bold**, *italic*, # / ## / ### headers, `code`, ```code blocks```, and "- " lists.
// HTML is escaped first so the model's own output can never inject markup.
function aiRenderMd(text){
  let h = String(text)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  // Fenced code blocks first (so their contents aren't touched by later rules)
  h = h.replace(/```([\s\S]*?)```/g, (m, code) => `<pre class="ai-code">${code.trim()}</pre>`);
  h = h.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  // Headers (line-anchored)
  h = h.replace(/^#### (.*)$/gm, '<h5>$1</h5>');
  h = h.replace(/^### (.*)$/gm, '<h4>$1</h4>');
  h = h.replace(/^## (.*)$/gm, '<h3>$1</h3>');
  h = h.replace(/^# (.*)$/gm, '<h3>$1</h3>');
  // Bold / italic (bold first so *** and ** resolve correctly)
  h = h.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  // "- " bullet lines, grouped into a single <ul>
  h = h.replace(/(^|\n)((?:- .*(?:\n|$))+)/g, (m, pre, block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^- /,'')}</li>`).join('');
    return pre + `<ul class="ai-ul">${items}</ul>`;
  });
  // Any remaining newlines (outside code blocks, which don't reach this line
  // as raw text anymore since they were already swapped for <pre> above)
  h = h.replace(/\n/g, '<br>');
  return h;
}

// ---------- Streaming chat ----------
function aiChatAppendMsg(text, who){
  const wrap = g('ai-chat-msgs');
  if (!wrap) return null;
  const div = document.createElement('div');
  div.className = 'ai-msg ' + (who === 'user' ? 'ai-msg-user' : 'ai-msg-bot');
  if (who === 'user') div.textContent = text;
  else div.innerHTML = aiRenderMd(text);
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
  return div;
}

