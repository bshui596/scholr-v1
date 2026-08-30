// ---------- Flashcards (interactive flip cards) ----------
let aiLastGeneratedFlashcards = [];

function aiPopulateCourseSelect(){
  const sel = g('ai-flashcards-course');
  if (!sel || sel.dataset.filled) return;
  try {
    (DB.courses || []).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.name; opt.textContent = c.name;
      sel.appendChild(opt);
    });
    sel.dataset.filled = '1';
  } catch (_) {}
}

async function runAiFlashcards(){
  aiPopulateCourseSelect();
  const text = g('ai-flashcards-input').value.trim();
  const outWrap = g('ai-flashcards-output');
  const addAllBtn = g('ai-flashcards-addall');
  if (!text) { outWrap.innerHTML = ''; outWrap.textContent = 'Please paste some material first.'; return; }
  const btn = event && event.target;
  if (btn) { btn.disabled = true; btn.textContent = 'Working…'; }
  if (addAllBtn) addAllBtn.style.display = 'none';
  outWrap.innerHTML = '<div class="ai-tool-output">Generating flashcards…</div>';
  try {
    const count = +g('ai-flashcards-count').value;
    const { flashcards } = await aiPost('/api/flashcards', { text, count });
    aiLastGeneratedFlashcards = flashcards || [];
    outWrap.innerHTML = '';
    aiLastGeneratedFlashcards.forEach((card, idx) => {
      const div = document.createElement('div');
      div.className = 'ai-flash-card';
      const q = document.createElement('div'); q.className = 'ai-flash-q'; q.textContent = card.question;
      const a = document.createElement('div'); a.className = 'ai-flash-a'; a.textContent = card.answer;
      div.appendChild(q); div.appendChild(a);
      div.onclick = (e) => { if (e.target.closest('.ai-flash-add-btn')) return; div.classList.toggle('flipped'); aiTypeset(div); };

      const addBtn = document.createElement('button');
      addBtn.className = 'ai-flash-add-btn bonus-ripple';
      addBtn.textContent = '➕ Add to deck';
      addBtn.style.cssText = 'margin-top:8px;border:1px solid var(--bor);background:var(--bg);color:var(--ink3);border-radius:8px;padding:5px 9px;font-size:11px;cursor:pointer';
      addBtn.onclick = (e) => { e.stopPropagation(); aiAddFlashcardToDeck(card.question, card.answer); addBtn.textContent = '✅ Added'; addBtn.disabled = true; };
      div.appendChild(addBtn);

      outWrap.appendChild(div);
    });
    if (aiLastGeneratedFlashcards.length && addAllBtn) addAllBtn.style.display = 'block';
    aiTypeset(outWrap);
  } catch (err) {
    console.error('Flashcards error:', err);
    outWrap.innerHTML = '<div class="ai-tool-output">⚠️ ' + err.message + '</div>';
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Generate Flashcards'; }
  }
}

// Files an AI-generated Q&A pair into the REAL Flashcards module (DB.flashcards),
// the same structure the app's own deck/study features read from — not a
// decorative div. Creates (or reuses) a deck for the selected course, or a
// general "AI Generated" deck if none is picked.
function aiAddFlashcardToDeck(question, answer){
  if (typeof DB === 'undefined') { if (typeof toast==='function') toast('App not ready yet.'); return; }
  const courseSel = g('ai-flashcards-course');
  const courseName = courseSel ? courseSel.value : '';
  if (!DB.flashcards) DB.flashcards = { decks: [], cards: [] };
  let deck = (DB.flashcards.decks || []).find(d => d.courseId === courseName && d.aiGenerated);
  if (!deck) {
    const c = (DB.courses || []).find(c => c.name === courseName);
    deck = {
      id: 'deck' + Date.now() + Math.floor(Math.random()*1000),
      name: (courseName || 'General') + ' (AI Generated)',
      desc: 'Auto-created from AI-generated flashcards',
      color: c?.color || '#0F6B30', courseId: courseName || '', created: Date.now(), aiGenerated: true
    };
    DB.flashcards.decks.push(deck);
  }
  const card = { id:'fc'+Date.now()+Math.floor(Math.random()*1000), deckId:deck.id, q:question, a:answer, hint:'', created:Date.now(), reviews:0, ease:2.5 };
  DB.flashcards.cards.push(card);
  if (typeof save === 'function') save();
  if (typeof toast === 'function') toast(`🃏 Added to "${deck.name}"`);
}

function aiAddAllFlashcardsToDeck(){
  if (!aiLastGeneratedFlashcards.length) return;
  aiLastGeneratedFlashcards.forEach(c => aiAddFlashcardToDeck(c.question, c.answer));
  document.querySelectorAll('.ai-flash-add-btn').forEach(b => { b.textContent = '✅ Added'; b.disabled = true; });
  if (typeof toast === 'function') toast(`🃏 Added ${aiLastGeneratedFlashcards.length} cards to your deck`);
}

