function aiSpeak(text){
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.05; u.pitch = 1;
  window.speechSynthesis.speak(u);
}
function aiStopSpeak(){ if (window.speechSynthesis) window.speechSynthesis.cancel(); }

function aiVoiceInput(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { alert('Voice input is not supported in this browser.'); return; }
  const rec = new SR();
  rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1;
  const micBtn = g('ai-mic-btn');
  if (micBtn) micBtn.classList.add('ai-mic-listening');
  rec.onresult = (e) => {
    const text = e.results[0][0].transcript;
    const inp = g('ai-chat-input');
    if (inp) { inp.value = text; inp.focus(); }
  };
  rec.onerror = () => { if (micBtn) micBtn.classList.remove('ai-mic-listening'); };
  rec.onend = () => { if (micBtn) micBtn.classList.remove('ai-mic-listening'); };
  rec.start();
}

/* Add a speaker icon to each bot chat message after it finishes streaming */
function aiAddSpeakerButton(botEl, fullReply){
  if (!fullReply || !fullReply.trim()) return;
  const btn = document.createElement('button');
  btn.className = 'ai-speak-btn';
  btn.title = 'Read aloud';
  btn.textContent = '🔊';
  btn.onclick = (e) => { e.stopPropagation(); aiSpeak(fullReply); };
  botEl.appendChild(btn);
}

/* ---------- Announcements banner (dashboard) ---------- */
const SCHOLR_ANNOUNCEMENTS = [
  { id: 'a1', text: '🎉 New: AI Tools panel — essays, notes, quizzes, flashcards & more.', date: '2026-08-20' },
  { id: 'a2', text: '⚡ AI chat now streams responses live and renders math with MathJax.', date: '2026-08-20' },
  { id: 'a3', text: '🎁 Try a bonus code in Settings — STR2030 unlocks starter themes.', date: '2026-08-20' },
];

function announceInit(){
  const seen = JSON.parse(localStorage.getItem('scholr_announce_seen') || '{}');
  const unseen = SCHOLR_ANNOUNCEMENTS.filter(a => !seen[a.id]);
  if (!unseen.length) return;

  const style = document.createElement('style');
  style.textContent = `
    .ai-speak-btn{border:none;background:transparent;cursor:pointer;font-size:12px;margin-left:6px;opacity:.7;transition:opacity .15s}
    .ai-speak-btn:hover{opacity:1}
    .ai-mic-btn{border:1px solid var(--bor);background:var(--bg);border-radius:9px;padding:8px 10px;cursor:pointer;font-size:13px;transition:all .15s}
    .ai-mic-listening{background:#dc2626 !important;color:#fff;animation:aiMicPulse 1s infinite}
    @keyframes aiMicPulse{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.5)}50%{box-shadow:0 0 0 8px rgba(220,38,38,0)}}
    .scholr-announce-bar{
      position:fixed;top:0;left:0;right:0;z-index:9500;background:linear-gradient(90deg,var(--ac),var(--ac2));
      color:#fff;padding:7px 16px;font-size:12px;font-weight:500;display:flex;align-items:center;justify-content:center;gap:14px;
      animation:announceSlideDown .3s ease both;box-shadow:0 2px 10px rgba(0,0,0,.15);
    }
    @keyframes announceSlideDown{from{transform:translateY(-100%)}to{transform:translateY(0)}}
    .scholr-announce-bar button{background:rgba(255,255,255,.2);border:none;color:#fff;border-radius:6px;padding:3px 9px;cursor:pointer;font-size:11px}
    .scholr-announce-bar button:hover{background:rgba(255,255,255,.32)}
  `;
  document.head.appendChild(style);

  let idx = 0;
  const bar = document.createElement('div');
  bar.className = 'scholr-announce-bar';
  bar.innerHTML = `<span id="scholr-announce-text">${unseen[0].text}</span><button id="scholr-announce-dismiss">Dismiss</button>`;
  document.body.prepend(bar);

  // The bar is position:fixed (so it can slide in above everything without
  // disturbing the app's own layout), which means it doesn't push anything
  // down on its own — without this it simply overlapped the top of the
  // topbar. Push the app shell down by the bar's rendered height instead.
  const appEl = document.querySelector('.app');
  const pushDown = () => {
    if (!appEl) return;
    const h = bar.offsetHeight;
    appEl.style.marginTop = h + 'px';
    appEl.style.height = `calc(100% - ${h}px)`;
    document.documentElement.style.setProperty('--banner-h', h + 'px');
  };
  pushDown();
  window.addEventListener('resize', pushDown);

  g('scholr-announce-dismiss').onclick = () => {
    seen[unseen[idx].id] = true;
    localStorage.setItem('scholr_announce_seen', JSON.stringify(seen));
    idx++;
    if (idx < unseen.length) {
      g('scholr-announce-text').textContent = unseen[idx].text;
    } else {
      bar.remove();
      if (appEl) { appEl.style.marginTop = ''; appEl.style.height = ''; }
      document.documentElement.style.setProperty('--banner-h', '0px');
      window.removeEventListener('resize', pushDown);
    }
  };
}
let _announceInitDone = false;
function announceInitOnce(){
  if (_announceInitDone) return;
  _announceInitDone = true;
  announceInit();
}
document.addEventListener('DOMContentLoaded', announceInitOnce);
if (document.readyState !== 'loading') announceInitOnce();

