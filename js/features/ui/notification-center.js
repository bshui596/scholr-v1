/* ── TOAST ── */
function toast(msg){const t=g('toast');t.textContent=msg;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),2000);}

