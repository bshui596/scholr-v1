/* ── AUTOSAVE with visual feedback ── */
function touch() {
  setStatus('saving');
  updateWordCount();
  clearTimeout(saveTmr);
  saveTmr = setTimeout(saveNote, 1500);
}
function setStatus(s) {
  const dot = g('ed-dot'), st = g('ed-st');
  if (!dot || !st) return;
  if (s === 'saving') { dot.className='dot saving'; dot.style.cssText=''; st.textContent='Saving…'; }
  else if (s === 'saved') { dot.className='dot saved'; st.textContent='Saved'; showSaveBanner(); }
  else { dot.className='dot'; st.textContent=''; }
}
function showSaveBanner() {
  const b = g('save-banner');
  g('save-msg').textContent = 'Saved';
  b.classList.add('on');
  clearTimeout(b._t);
  b._t = setTimeout(() => b.classList.remove('on'), 1800);
}

