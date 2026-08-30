/* ═══════════════════════════════════════════════════
   GOOGLE CLASSROOM
   Client-side only integration using Google Identity Services (GIS)
   for OAuth + the Classroom REST API. Requires the user to supply
   their own Google OAuth Client ID (created in Google Cloud Console
   with this site's origin authorized) — Scholr has no backend that
   can hold Google API credentials.

   Privacy: the OAuth access token is kept ONLY in memory (gcToken)
   and is never written to DB/localStorage. What IS cached locally
   (in DB.classroom) is just the last-fetched course/assignment list,
   so the page has something to show instantly on reopen — refresh
   any time with the Refresh button.
═══════════════════════════════════════════════════ */

const GC_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly'
].join(' ');

let gcToken = null;       // { access_token, expiresAt } — memory only, never persisted
let gcTokenClient = null; // google.accounts.oauth2 token client, created lazily
let gcGisLoading = null;  // promise while the GIS script is loading
let gcBusy = false;

if (!DB.classroom) DB.classroom = { clientId: '', courses: null, lastSync: null };

function classroomLoadGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gcGisLoading) return gcGisLoading;
  gcGisLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load Google\'s sign-in script — check your connection.'));
    document.head.appendChild(s);
  });
  return gcGisLoading;
}

function classroomTokenValid() {
  return gcToken && gcToken.access_token && gcToken.expiresAt > Date.now() + 15000;
}

/* ---------- Setup (client ID) ---------- */
function classroomSaveClientId() {
  const val = (g('gc-client-id')?.value || '').trim();
  if (!val) { toast('Paste your Google OAuth Client ID first'); return; }
  DB.classroom.clientId = val;
  gcTokenClient = null; // force re-init with new client id
  save();
  classroomRender();
}

function classroomClearClientId() {
  DB.classroom.clientId = '';
  DB.classroom.courses = null;
  gcToken = null; gcTokenClient = null;
  save();
  classroomRender();
}

/* ---------- Connect / disconnect ---------- */
async function classroomConnect() {
  const clientId = DB.classroom.clientId;
  if (!clientId) { toast('Add your Google OAuth Client ID first'); return; }
  try {
    await classroomLoadGis();
  } catch (e) {
    classroomShowError(e.message);
    return;
  }
  if (!gcTokenClient) {
    gcTokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GC_SCOPES,
      callback: (resp) => {
        if (resp.error) {
          classroomShowError('Google sign-in was cancelled or denied (' + resp.error + ').');
          return;
        }
        gcToken = { access_token: resp.access_token, expiresAt: Date.now() + (resp.expires_in || 3600) * 1000 };
        classroomFetchData();
      },
      error_callback: (err) => {
        classroomShowError('Google sign-in failed: ' + (err?.type || 'unknown error') + '. Make sure this site\'s origin is authorized for that Client ID.');
      }
    });
  }
  gcTokenClient.requestAccessToken({ prompt: classroomTokenValid() ? '' : 'consent' });
}

function classroomDisconnect() {
  if (gcToken && window.google?.accounts?.oauth2) {
    try { google.accounts.oauth2.revoke(gcToken.access_token, () => {}); } catch (e) {}
  }
  gcToken = null;
  DB.classroom.courses = null;
  DB.classroom.lastSync = null;
  save();
  classroomRender();
}

/* ---------- Fetch courses + coursework ---------- */
async function classroomApiGet(url) {
  const res = await fetch(url, { headers: { Authorization: 'Bearer ' + gcToken.access_token } });
  if (res.status === 401) throw new Error('Your session expired — click Connect again.');
  if (res.status === 403) throw new Error('Access denied. If this app is still in "Testing" mode in Google Cloud Console, add your Google account as a test user.');
  if (!res.ok) throw new Error('Google Classroom API error (' + res.status + ')');
  return res.json();
}

async function classroomFetchData() {
  if (!classroomTokenValid()) { classroomConnect(); return; }
  gcBusy = true;
  classroomRender();
  try {
    const coursesRes = await classroomApiGet('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&pageSize=50');
    const courses = coursesRes.courses || [];
    const results = await Promise.all(courses.map(async (c) => {
      let work = [];
      try {
        const cwRes = await classroomApiGet(`https://classroom.googleapis.com/v1/courses/${c.id}/courseWork?courseWorkStates=PUBLISHED&orderBy=dueDate desc&pageSize=30`);
        work = cwRes.courseWork || [];
      } catch (e) { /* per-course fetch failures shouldn't kill the whole page */ }
      return {
        id: c.id, name: c.name, section: c.section || '', link: c.alternateLink,
        color: CAL_COLORS ? CAL_COLORS[Math.abs(hashStr(c.id)) % CAL_COLORS.length] : '#1D4ED8',
        work: work.map(w => ({
          id: w.id, title: w.title, link: w.alternateLink,
          due: w.dueDate ? `${w.dueDate.year}-${String(w.dueDate.month).padStart(2,'0')}-${String(w.dueDate.day).padStart(2,'0')}` : null
        }))
      };
    }));
    DB.classroom.courses = results;
    DB.classroom.lastSync = new Date().toISOString();
    save();
  } catch (e) {
    classroomShowError(e.message);
  } finally {
    gcBusy = false;
    classroomRender();
  }
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return h;
}

function classroomRefresh() { classroomFetchData(); }

function classroomShowError(msg) {
  const el = g('gc-error');
  if (!el) { toast(msg); return; }
  el.textContent = msg;
  el.style.display = 'block';
}

/* ---------- Render ---------- */
function classroomInit() { classroomRender(); }

function classroomRender() {
  const root = g('gc-root');
  if (!root) return;

  if (!DB.classroom.clientId) {
    root.innerHTML = classroomSetupHTML();
    return;
  }

  if (!DB.classroom.courses) {
    root.innerHTML = classroomConnectHTML();
    return;
  }

  root.innerHTML = classroomCoursesHTML();
}

function classroomSetupHTML() {
  return `
  <div class="card gc-state-card">
    <div class="gc-ic">🎓</div>
    <h3>Connect Google Classroom</h3>
    <p>Scholr can pull your live courses & assignments from Google Classroom. This needs a Google OAuth Client ID for this site — Scholr has no server that can hold Google credentials for you, so this one-time setup happens per device.</p>
    <div class="gc-setup-form">
      <label class="fl">Google OAuth Client ID</label>
      <input class="fi" id="gc-client-id" placeholder="xxxxxxxxxx.apps.googleusercontent.com" autocomplete="off"/>
      <div style="margin-top:10px"><button class="btn bp sm" onclick="classroomSaveClientId()">Save & Continue</button></div>
      <div class="gc-help">
        How to get one (free, takes ~2 min):
        <ol>
          <li>Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener">Google Cloud Console → Credentials</a> and create an <strong>OAuth client ID</strong> (type: Web application).</li>
          <li>Add this site's URL under <strong>Authorized JavaScript origins</strong>.</li>
          <li>Enable the <strong>Google Classroom API</strong> for the project.</li>
          <li>On the OAuth consent screen, add your own Google account under <strong>Test users</strong> while the app is unverified.</li>
          <li>Paste the generated Client ID above.</li>
        </ol>
      </div>
    </div>
  </div>`;
}

function classroomConnectHTML() {
  return `
  <div class="card gc-state-card">
    <div class="gc-ic">🔗</div>
    <h3>Sign in to Google Classroom</h3>
    <p>You're set up — sign in with the Google account you use for school to load your courses and assignments.</p>
    <div id="gc-error" style="display:none;color:var(--red,#B91C1C);font-size:12px;max-width:420px;margin:0 auto 10px"></div>
    <button class="btn bp sm" onclick="classroomConnect()" ${gcBusy?'disabled':''}>${gcBusy?'<span class="gc-spin"></span>Connecting…':'🔗 Connect Google Classroom'}</button>
    <div style="margin-top:10px"><button class="btn bo sm" onclick="classroomClearClientId()">Use a different Client ID</button></div>
  </div>`;
}

function classroomCoursesHTML() {
  const courses = DB.classroom.courses || [];
  const synced = DB.classroom.lastSync ? new Date(DB.classroom.lastSync).toLocaleString('en-CA', {dateStyle:'medium', timeStyle:'short'}) : '';
  const today = new Date(); today.setHours(0,0,0,0);

  const body = !courses.length
    ? `<div class="card gc-empty">No active courses found on this account.</div>`
    : courses.map(c => {
        const workHtml = !c.work.length
          ? `<div class="gc-empty">No published assignments in this course yet.</div>`
          : c.work.map(w => {
              const overdue = w.due && new Date(w.due + 'T23:59:59') < today;
              const dueLabel = w.due ? new Date(w.due + 'T00:00:00').toLocaleDateString('en-CA', {month:'short', day:'numeric'}) : 'No due date';
              return `<a class="gc-work" href="${w.link||c.link}" target="_blank" rel="noopener">
                <span class="gc-work-ic">📄</span>
                <span class="gc-work-body">
                  <span class="gc-work-title">${escapeHtml(w.title)}</span>
                  <span class="gc-work-due${overdue?' overdue':''}">${overdue?'⚠ Overdue — ':''}${dueLabel}</span>
                </span>
              </a>`;
            }).join('');
        return `
        <div class="card gc-course">
          <div class="gc-course-hd">
            <div class="gc-course-dot" style="background:${c.color}"></div>
            <div class="gc-course-name">${escapeHtml(c.name)}${c.section?` <span style="color:var(--ink4);font-weight:500">— ${escapeHtml(c.section)}</span>`:''}</div>
            <a class="gc-course-link" href="${c.link}" target="_blank" rel="noopener">Open in Classroom →</a>
          </div>
          <div class="gc-work-list">${workHtml}</div>
        </div>`;
      }).join('');

  return `
  <div class="gc-toolbar">
    <div class="gc-toolbar-meta">${courses.length} course${courses.length===1?'':'s'}${synced?' · synced '+synced:''}</div>
    <div style="display:flex;gap:8px">
      <button class="btn bo sm" onclick="classroomRefresh()" ${gcBusy?'disabled':''}>${gcBusy?'<span class="gc-spin"></span>Syncing…':'⟳ Refresh'}</button>
      <button class="btn bo sm" onclick="classroomDisconnect()">Disconnect</button>
    </div>
  </div>
  <div id="gc-error" style="display:none;color:var(--red,#B91C1C);font-size:12px;margin-bottom:10px"></div>
  ${body}`;
}
