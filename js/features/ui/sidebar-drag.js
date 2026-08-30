/* ── THEME / FONT ── */
function applyTheme(id) { document.documentElement.setAttribute('data-t', id); DB.p.theme = id; }
function applyFont(id) {
  document.documentElement.setAttribute('data-f', id); DB.p.font = id;
  const lnk = g('gfont');
  if (lnk && FONT_URLS[id]) lnk.href = `https://fonts.googleapis.com/css2?family=${FONT_URLS[id]}&display=swap`;
}

