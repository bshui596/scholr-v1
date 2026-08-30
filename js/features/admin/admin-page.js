/* ═══════════════════════════════════════════════════
   ADMIN PAGE (hidden — reachable only via admin unlock code)
═══════════════════════════════════════════════════ */
function renderAdmin(){
  setText('ad-st-notes', DB.notes?.length||0);
  setText('ad-st-hw', DB.hw?.length||0);
  setText('ad-st-courses', DB.courses?.length||0);
  setText('ad-st-fc', DB.flashcards?.cards?.length||0);
  let bytes = 0; try { bytes = new Blob([localStorage.getItem(KEY)||'']).size; } catch(e){}
  setText('ad-st-size', (bytes/1024).toFixed(1)+' KB');
  setText('ad-st-cloud', CLOUD_ON ? 'Active' : 'Offline');
  const grid = g('ad-page-grid');
  if (grid) grid.innerHTML = Object.keys(PG).map(id =>
    `<button class="btn bo xs" onclick="go('${id}')">${PG[id]}</button>`).join('');
}

