function bonusMountFocusTimer(){
  const div = document.createElement('div');
  div.id = 'bonus-focus-widget';
  div.className = 'bonus-floating-card';
  div.style.cssText = 'left:20px;right:auto;bottom:20px;top:auto;padding:12px 14px;width:180px';
  div.innerHTML = `
    <div style="font-weight:700;font-size:12px;margin-bottom:6px">⏱️ Focus Timer</div>
    <div id="bonus-focus-display" style="font-size:22px;font-weight:800;text-align:center;margin:6px 0">25:00</div>
    <div style="display:flex;gap:6px">
      <button class="bonus-ripple" onclick="bonusFocusToggle()" id="bonus-focus-btn" style="flex:1;border:1px solid var(--bor);background:var(--ac);color:var(--on-ac,#fff);border-radius:8px;padding:6px;font-size:11px;cursor:pointer">Start</button>
      <button class="bonus-ripple" onclick="bonusFocusReset()" style="border:1px solid var(--bor);background:var(--bg);border-radius:8px;padding:6px 9px;font-size:11px;cursor:pointer">↺</button>
    </div>`;
  document.body.appendChild(div);
}
let bonusFocusInterval = null, bonusFocusSeconds = 25 * 60;
function bonusFocusToggle(){
  const btn = g('bonus-focus-btn');
  if (bonusFocusInterval) {
    clearInterval(bonusFocusInterval); bonusFocusInterval = null;
    if (btn) btn.textContent = 'Start';
  } else {
    bonusFocusInterval = setInterval(() => {
      bonusFocusSeconds = Math.max(0, bonusFocusSeconds - 1);
      const m = String(Math.floor(bonusFocusSeconds / 60)).padStart(2, '0');
      const s = String(bonusFocusSeconds % 60).padStart(2, '0');
      const disp = g('bonus-focus-display'); if (disp) disp.textContent = m + ':' + s;
      if (bonusFocusSeconds === 0) {
        clearInterval(bonusFocusInterval); bonusFocusInterval = null;
        if (btn) btn.textContent = 'Start';
        if (typeof toast === 'function') toast('⏱️ Focus session complete!');
      }
    }, 1000);
    if (btn) btn.textContent = 'Pause';
  }
}
function bonusFocusReset(){
  clearInterval(bonusFocusInterval); bonusFocusInterval = null;
  bonusFocusSeconds = 25 * 60;
  const disp = g('bonus-focus-display'); if (disp) disp.textContent = '25:00';
  const btn = g('bonus-focus-btn'); if (btn) btn.textContent = 'Start';
}

function bonusUpdateStreak(){
  const today = new Date().toISOString().slice(0, 10);
  let data;
  try { data = JSON.parse(localStorage.getItem('scholr_streak') || '{}'); } catch (_) { data = {}; }
  if (data.lastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    data.count = (data.lastDate === yesterday) ? (data.count || 0) + 1 : 1;
    data.lastDate = today;
    localStorage.setItem('scholr_streak', JSON.stringify(data));
  }
  let badge = g('bonus-streak-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'bonus-streak-badge';
    badge.style.cssText = 'position:fixed;top:calc(var(--th,52px) + var(--banner-h,0px) + 10px);right:14px;z-index:6000;background:var(--sur);border:1px solid var(--bor);border-radius:20px;padding:5px 12px;font-size:12px;font-weight:700;box-shadow:var(--sh2);transition:top .2s;animation:bonusPop .3s ease both';
    document.body.appendChild(badge);
  }
  badge.textContent = '🔥 ' + (data.count || 1) + ' day streak';
}

function bonusMountQuickNav(){
  if (typeof PG === 'undefined') return;
  const bar = document.createElement('div');
  bar.id = 'bonus-quicknav-bar';
  bar.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:calc(14px + var(--banner-h,0px));z-index:7000;display:flex;gap:4px;background:var(--sur);border:1px solid var(--bor);border-radius:12px;padding:4px;box-shadow:var(--sh2);flex-wrap:wrap;max-width:90vw;transition:top .2s;animation:bonusPop .3s ease both';
  Object.keys(PG).slice(0, 8).forEach(id => {
    const btn = document.createElement('button');
    btn.className = 'bonus-ripple';
    btn.style.cssText = 'border:none;background:transparent;color:var(--ink3);border-radius:8px;padding:5px 9px;font-size:11px;cursor:pointer;transition:all .15s';
    btn.textContent = PG[id];
    btn.onclick = () => go(id);
    btn.onmouseenter = () => btn.style.background = 'var(--s2)';
    btn.onmouseleave = () => btn.style.background = 'transparent';
    bar.appendChild(btn);
  });
  document.body.appendChild(bar);
}

// Auto-speak hook: if enabled, read bot replies aloud automatically once streaming finishes.
const _bonusOrigAddSpeaker = typeof aiAddSpeakerButton === 'function' ? aiAddSpeakerButton : null;
function bonusMaybeAutoSpeak(fullReply){
  const flags = bonusGetUnlocked();
  if (flags.autospeak && fullReply && typeof aiSpeak === 'function') aiSpeak(fullReply);
}

// Ripple effect for any element with .bonus-ripple
document.addEventListener('click', (e) => {
  const el = e.target.closest && e.target.closest('.bonus-ripple');
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const fx = document.createElement('span');
  const size = Math.max(rect.width, rect.height);
  fx.className = 'bonus-ripple-fx';
  fx.style.width = fx.style.height = size + 'px';
  fx.style.left = (e.clientX - rect.left - size / 2) + 'px';
  fx.style.top = (e.clientY - rect.top - size / 2) + 'px';
  el.appendChild(fx);
  setTimeout(() => fx.remove(), 500);
});

