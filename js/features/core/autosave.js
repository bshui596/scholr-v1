/* ── CLOUD SYNC ──────────────────────────────────────────────
   localStorage is instant but device-local only. When window.storage
   is available (Scholr running as a Claude artifact) we mirror DB to
   it so the same workspace can be reopened from any device signed
   into the same account. localStorage remains the fast local cache;
   cloud is the source of truth on load if it's newer. ── */
const CLOUD_ON = (typeof window !== 'undefined' && !!window.storage);
let cloudSyncTmr = null, cloudStatusEl = null;

function setCloudStatus(s) {
  // s: 'synced' | 'syncing' | 'offline' | 'error'
  if (!cloudStatusEl) cloudStatusEl = document.getElementById('cloud-status');
  if (!cloudStatusEl) return;
  const map = {
    synced:  {ic:'☁️', t:'Synced', c:'var(--ac)'},
    syncing: {ic:'🔄', t:'Syncing…', c:'var(--ink4)'},
    offline: {ic:'📴', t:'Local only', c:'var(--ink4)'},
    error:   {ic:'⚠️', t:'Sync failed', c:'var(--red)'}
  };
  const m = map[s] || map.offline;
  cloudStatusEl.innerHTML = `<span>${m.ic}</span><span>${m.t}</span>`;
  cloudStatusEl.style.color = m.c;
}

async function cloudLoadInto(localDb) {
  if (!CLOUD_ON) { setCloudStatus('offline'); return localDb; }
  try {
    const res = await window.storage.get('scholr-db', false);
    if (res && res.value) {
      const cloudDb = JSON.parse(res.value);
      // Prefer whichever copy was touched more recently
      const cloudTs = cloudDb._syncedAt || 0, localTs = localDb._syncedAt || 0;
      setCloudStatus('synced');
      if (cloudTs >= localTs) return cloudDb;
    } else {
      setCloudStatus('synced');
    }
  } catch (e) {
    setCloudStatus(localDb ? 'offline' : 'error');
  }
  return localDb;
}

function cloudSaveNow() {
  if (!CLOUD_ON) return;
  setCloudStatus('syncing');
  window.storage.set('scholr-db', JSON.stringify(DB), false)
    .then(r => setCloudStatus(r ? 'synced' : 'error'))
    .catch(() => setCloudStatus('error'));
}

function save() {
  DB._syncedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch(e) { toast('⚠️ Storage full!'); }
  // Debounce cloud writes so rapid edits (typing, drag/drop) don't spam requests
  clearTimeout(cloudSyncTmr);
  cloudSyncTmr = setTimeout(cloudSaveNow, 1200);
}

