/* ── QUICK LAYOUT MENU (topbar) ── */
function toggleLayoutMenu(){
  const m=g('layout-menu');
  m.classList.toggle('on');
  if (m.classList.contains('on')) { renderLayoutSwatches(); syncSidebarStyleButtons(); }
}
function closeLayoutMenu(){ g('layout-menu')?.classList.remove('on'); }
document.addEventListener('click', e=>{
  const menu=g('layout-menu'), btn=g('layout-btn');
  if (menu && menu.classList.contains('on') && !menu.contains(e.target) && e.target!==btn) closeLayoutMenu();
});

/* ── MORE TOOLS MENU (topbar) — houses less-frequent actions
   (Calculator/Focus Mode/Split) so the topbar stays uncluttered ── */
function toggleMoreMenu(){ g('more-menu')?.classList.toggle('on'); }
function closeMoreMenu(){ g('more-menu')?.classList.remove('on'); }
document.addEventListener('click', e=>{
  const menu=g('more-menu'), btn=g('more-btn');
  if (menu && menu.classList.contains('on') && !menu.contains(e.target) && e.target!==btn) closeMoreMenu();
});

