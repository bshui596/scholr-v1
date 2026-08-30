function bonusRenderUnlocked(){
  const listEl = g('bonus-unlocked-list');
  const adminSlot = g('bonus-admin-slot');
  if (!listEl) return;
  const flags = bonusGetUnlocked();
  listEl.innerHTML = '';
  const items = Object.entries(BONUS_CODES).filter(([, v]) => flags[v.flag]);
  if (!items.length) {
    listEl.innerHTML = '<div style="font-size:11.5px;color:var(--ink4)">No bonus features unlocked yet.</div>';
  } else {
    items.forEach(([code, v]) => {
      const row = document.createElement('div');
      row.className = 'bonus-unlocked-item bonus-check-pop';
      row.innerHTML = `<span>${v.label}</span><span style="display:flex;align-items:center;gap:6px"><span style="color:var(--ink4);font-size:10.5px">${code}</span><button class="bonus-ripple" onclick="bonusRemoveFeature('${v.flag}')" title="Turn off" style="border:none;background:transparent;color:var(--ink4);cursor:pointer;font-size:13px;padding:2px 4px">✕</button></span>`;
      listEl.appendChild(row);
    });
  }
  if (adminSlot) adminSlot.innerHTML = flags.admin ? bonusAdminPanelHtml() : '';
  bonusApplyFeatureHooks(flags);
}

// ---------- Admin Panel: real access to real app data ----------
function bonusAdminPanelHtml(){
  let keyCount = 0, approxBytes = 0;
  try {
    keyCount = localStorage.length;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      approxBytes += (k?.length || 0) + (localStorage.getItem(k)?.length || 0);
    }
  } catch (_) {}

  const noteCount = (typeof DB !== 'undefined' && Array.isArray(DB.notes)) ? DB.notes.length : '—';
  const courseCount = (typeof DB !== 'undefined' && Array.isArray(DB.courses)) ? DB.courses.length : '—';
  const hwCount = (typeof DB !== 'undefined' && Array.isArray(DB.hw)) ? DB.hw.length : '—';

  const navButtons = Object.keys(typeof PG !== 'undefined' ? PG : {})
    .map(id => `<button onclick="go('${id}')">${(typeof PG!=='undefined'&&PG[id])||id}</button>`)
    .join('');

  // ---- AI performance stats ----
  const stats = aiGetStats();
  const perfRows = stats ? `
      <div class="bonus-admin-stat"><span>Last AI response</span><span>${stats.lastMs} ms ${stats.lastOk ? '✅' : '❌'} (${stats.lastEndpoint})</span></div>
      <div class="bonus-admin-stat"><span>Avg response (last 20)</span><span>${stats.avgMs} ms</span></div>
      <div class="bonus-admin-stat"><span>Success rate (last 20)</span><span>${stats.successRate}%</span></div>
      <div class="bonus-admin-stat"><span>Total AI requests logged</span><span>${stats.totalLogged}</span></div>
      ${Object.entries(stats.byEndpoint).map(([ep,d]) =>
        `<div class="bonus-admin-stat" style="padding-left:10px;font-size:11px;opacity:.8"><span>↳ ${ep}</span><span>${Math.round(d.totalMs/d.count)} ms avg (${d.count}×)</span></div>`
      ).join('')}
  ` : `<div class="bonus-admin-stat"><span>AI requests</span><span>none logged yet</span></div>`;

  // ---- "cool data" ----
  const sessionMin = ((Date.now() - aiSessionStart) / 60000).toFixed(1);
  const theme = document.documentElement.getAttribute('data-t') || 'default';
  const online = navigator.onLine ? 'Online ✅' : 'Offline ❌';
  const unlockedCount = Object.values(bonusGetUnlocked()).filter(Boolean).length;

  return `
    <div class="bonus-admin-panel bonus-check-pop">
      <div style="font-weight:700;font-size:12.5px">🛠️ Admin Panel</div>

      <div style="font-size:11px;color:var(--ink4);margin-top:2px">⚡ AI Performance</div>
      ${perfRows}

      <div style="font-size:11px;color:var(--ink4);margin-top:4px">📊 App Data</div>
      <div class="bonus-admin-stat"><span>Notes</span><span>${noteCount}</span></div>
      <div class="bonus-admin-stat"><span>Courses</span><span>${courseCount}</span></div>
      <div class="bonus-admin-stat"><span>Homework items</span><span>${hwCount}</span></div>
      <div class="bonus-admin-stat"><span>localStorage keys</span><span>${keyCount}</span></div>
      <div class="bonus-admin-stat"><span>Approx. storage used</span><span>${(approxBytes/1024).toFixed(1)} KB</span></div>
      <div class="bonus-admin-stat"><span>Debug mode</span><span id="bonus-debug-state">${localStorage.getItem('scholr_debug') === '1' ? 'ON' : 'OFF'}</span></div>

      <div style="font-size:11px;color:var(--ink4);margin-top:4px">🧭 Session</div>
      <div class="bonus-admin-stat"><span>Time on page</span><span>${sessionMin} min</span></div>
      <div class="bonus-admin-stat"><span>Theme</span><span>${theme}</span></div>
      <div class="bonus-admin-stat"><span>Network</span><span>${online}</span></div>
      <div class="bonus-admin-stat"><span>Screen size</span><span>${window.innerWidth}×${window.innerHeight}</span></div>
      <div class="bonus-admin-stat"><span>Bonus features unlocked</span><span>${unlockedCount}</span></div>

      <div style="font-size:11px;color:var(--ink4);margin-top:4px">Jump to any page:</div>
      <div class="bonus-admin-btns">${navButtons}</div>

      <div style="font-size:11px;color:var(--ink4);margin-top:4px">Actions:</div>
      <div class="bonus-admin-btns">
        <button onclick="bonusToggleDebug()">Toggle debug mode</button>
        <button onclick="bonusExportData()">Export all data (JSON)</button>
        <button onclick="bonusUnlockEverything()">Unlock every bonus feature</button>
        <button onclick="bonusAdminClearNotes()">Clear all notes</button>
        <button onclick="bonusAdminClearHW()">Clear all homework</button>
        <button onclick="bonusConfirmClear()">⚠️ Clear ALL local data</button>
        <button onclick="bonusRenderUnlocked()">🔄 Refresh stats</button>
      </div>
    </div>`;
}

function bonusToggleDebug(){
  const on = localStorage.getItem('scholr_debug') === '1';
  localStorage.setItem('scholr_debug', on ? '0' : '1');
  const el = g('bonus-debug-state');
  if (el) el.textContent = on ? 'OFF' : 'ON';
}

function bonusUnlockEverything(){
  const flags = bonusGetUnlocked();
  Object.values(BONUS_CODES).forEach(v => flags[v.flag] = true);
  bonusSetUnlocked(flags);
  bonusApplyEffects(flags);
  bonusRenderUnlocked();
  if (typeof toast === 'function') toast('✅ All bonus features unlocked');
}

function bonusAdminClearNotes(){
  if (typeof DB === 'undefined') return;
  if (!confirm('Delete ALL notes? This cannot be undone.')) return;
  DB.notes = []; noteId = null;
  if (typeof save === 'function') save();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof toast === 'function') toast('All notes cleared');
  bonusRenderUnlocked();
}

function bonusAdminClearHW(){
  if (typeof DB === 'undefined') return;
  if (!confirm('Delete ALL homework items? This cannot be undone.')) return;
  DB.hw = [];
  if (typeof save === 'function') save();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof toast === 'function') toast('All homework cleared');
  bonusRenderUnlocked();
}

function bonusExportData(){
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    data[k] = localStorage.getItem(k);
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'scholr-data-export.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function bonusConfirmClear(){
  if (!confirm('This will erase ALL locally saved Scholr data on this device. This cannot be undone. Continue?')) return;
  localStorage.clear();
  location.reload();
}

// ---------- Apply genuine (non-theme) feature unlocks ----------
