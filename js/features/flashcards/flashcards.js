/* ═══════════════════════════════════════════════════
   FLASHCARDS MODULE
═══════════════════════════════════════════════════ */
if (!DB.flashcards) DB.flashcards = { decks: [], cards: [] };
if (!DB.flashcards.reviewLog) DB.flashcards.reviewLog = [];
if (!DB.exams) DB.exams = [];
if (!DB.studyLog) DB.studyLog = []; // {id, ts, minutes, course} — one entry per completed focus session
let fcCurrentDeck = null, fcStudyCards = [], fcStudyIdx = 0, fcFlipped = false;

function fcNewDeck() {
  g('fc-deck-id').value = '';
  setText('fc-deck-mo-title','New Flashcard Deck');
  g('fc-deck-name').value = '';
  g('fc-deck-desc').value = '';
  // Color swatches
  const colors = ['#0F6B30','#1D4ED8','#6D28D9','#BE185D','#B45309','#0F766E','#C05418'];
  const cg = g('fc-deck-colors');
  if (cg) cg.innerHTML = colors.map(c=>`<div style="width:22px;height:22px;border-radius:50%;background:${c};cursor:pointer;border:2px solid transparent" onclick="document.getElementById('fc-deck-color').value='${c}';this.parentElement.querySelectorAll('div').forEach(d=>d.style.border='2px solid transparent');this.style.border='2px solid var(--ink)'"></div>`).join('');
  if (cg?.firstElementChild) cg.firstElementChild.style.border = '2px solid var(--ink)';
  g('fc-deck-color').value = colors[0];
  // Course select
  const cs = g('fc-deck-course');
  if (cs) cs.innerHTML = `<option value="">General</option>` + (DB.courses||[]).map(c=>`<option value="${c.name}">${c.name}</option>`).join('');
  showMo('mo-fc-deck');
}
function fcSaveDeck() {
  const name = g('fc-deck-name')?.value.trim();
  if (!name) { toast('Enter deck name!'); return; }
  const id = g('fc-deck-id').value || 'deck' + Date.now();
  const existing = (DB.flashcards.decks||[]).findIndex(d=>d.id===id);
  const deck = { id, name, desc: g('fc-deck-desc')?.value.trim(), color: g('fc-deck-color')?.value||'#0F6B30', courseId: g('fc-deck-course')?.value||'', created: Date.now() };
  if (existing >= 0) DB.flashcards.decks[existing] = deck; else DB.flashcards.decks.push(deck);
  save(); closeMo('mo-fc-deck'); fcRenderDecks(); toast('Deck saved!');
}
function fcRenderDecks() {
  const el = g('fc-deck-grid'); if (!el) return;
  if (!DB.flashcards.decks?.length) {
    el.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--ink4)"><div style="font-size:40px;margin-bottom:10px">🃏</div><p>No flashcard decks yet. Click "+ New Deck" to create one.</p></div>';
    return;
  }
  el.innerHTML = DB.flashcards.decks.map(deck => {
    const cards = (DB.flashcards.cards||[]).filter(c=>c.deckId===deck.id);
    const stats = fcDeckDueStats(deck.id);
    return `<div class="fc-deck-card" style="--deck-color:${deck.color}">
      <div class="fc-deck-name">${deck.name}</div>
      <div class="fc-deck-count">${cards.length} cards${deck.desc?'  ·  '+deck.desc:''}${stats.due?`  ·  <span style="color:var(--amb);font-weight:700">${stats.due} due</span>`:''}</div>
      <div class="fc-deck-acts">
        <button class="btn bp sm" onclick="fcStartStudy('${deck.id}')">▶ Study</button>
        <button class="btn bo sm" onclick="fcAddCard('${deck.id}')">+ Card</button>
        <button class="btn bo sm" onclick="fcEditDeck('${deck.id}')">✏️</button>
        <button class="btn bo sm" onclick="fcExportDeck('${deck.id}')" title="Export this deck">⬇</button>
        <button class="btn bd sm" onclick="fcDeleteDeck('${deck.id}')">🗑</button>
      </div>
    </div>`;
  }).join('');
}
function fcEditDeck(id) {
  const deck = DB.flashcards.decks.find(d=>d.id===id); if (!deck) return;
  g('fc-deck-id').value = id;
  setText('fc-deck-mo-title','Edit Deck');
  g('fc-deck-name').value = deck.name;
  g('fc-deck-desc').value = deck.desc||'';
  const colors = ['#0F6B30','#1D4ED8','#6D28D9','#BE185D','#B45309','#0F766E','#C05418'];
  const cg = g('fc-deck-colors');
  if (cg) cg.innerHTML = colors.map(c=>`<div style="width:22px;height:22px;border-radius:50%;background:${c};cursor:pointer;border:${deck.color===c?'2px solid var(--ink)':'2px solid transparent'}" onclick="document.getElementById('fc-deck-color').value='${c}';this.parentElement.querySelectorAll('div').forEach(d=>d.style.border='2px solid transparent');this.style.border='2px solid var(--ink)'"></div>`).join('');
  g('fc-deck-color').value = deck.color;
  const cs = g('fc-deck-course');
  if (cs) { cs.innerHTML = `<option value="">General</option>` + (DB.courses||[]).map(c=>`<option value="${c.name}">${c.name}</option>`).join(''); cs.value = deck.courseId||''; }
  showMo('mo-fc-deck');
}
function fcDeleteDeck(id) {
  if (!confirm('Delete this deck and all its cards?')) return;
  DB.flashcards.decks = DB.flashcards.decks.filter(d=>d.id!==id);
  DB.flashcards.cards = DB.flashcards.cards.filter(c=>c.deckId!==id);
  save(); fcRenderDecks(); toast('Deck deleted');
}
function fcAddCard(deckId) {
  g('fc-card-id').value = '';
  g('fc-card-deck-id').value = deckId;
  setText('fc-card-mo-title','Add Card');
  g('fc-card-q').value = ''; g('fc-card-a').value = ''; g('fc-card-hint').value = '';
  showMo('mo-fc-card');
}
function fcSaveCard() {
  const q = g('fc-card-q')?.value.trim(), a = g('fc-card-a')?.value.trim();
  if (!q || !a) { toast('Enter question and answer!'); return; }
  const id = g('fc-card-id').value || 'fc'+Date.now();
  const deckId = g('fc-card-deck-id').value;
  const existing = (DB.flashcards.cards||[]).findIndex(c=>c.id===id);
  const card = { id, deckId, q, a, hint: g('fc-card-hint')?.value.trim(), created: Date.now(), reviews:0, ease:2.5 };
  if (existing >= 0) DB.flashcards.cards[existing] = card; else DB.flashcards.cards.push(card);
  save(); closeMo('mo-fc-card'); fcRenderDecks(); toast('Card saved!');
}
function fcSaveCardAndAnother() {
  fcSaveCard();
  setTimeout(() => { fcAddCard(g('fc-card-deck-id')?.value); }, 100);
}
function fcStartStudy(deckId) {
  const deck = DB.flashcards.decks.find(d=>d.id===deckId); if (!deck) return;
  deck.lastStudied = Date.now(); save();
  fcCurrentDeck = deck;
  fcStudyCards = (DB.flashcards.cards||[]).filter(c=>c.deckId===deckId);
  if (!fcStudyCards.length) { toast('No cards in this deck. Add some first!'); return; }
  fcStudyCards = [...fcStudyCards].sort(()=>Math.random()-.5);
  fcStudyIdx = 0; fcFlipped = false;
  setText('fc-study-deck-name', deck.name);
  g('fc-decks-view').style.display = 'none';
  g('fc-study-view').style.display = 'block';
  g('fc-done-screen').style.display = 'none';
  g('fc-card-wrap').style.display = '';
  g('fc-ans-btns').style.display = 'none';
  g('fc-nav-btns').style.display = 'flex';
  fcShowCard();
}
function fcShowCard() {
  if (fcStudyIdx >= fcStudyCards.length) { fcShowDone(); return; }
  const card = fcStudyCards[fcStudyIdx];
  const cardEl = g('fc-card');
  // Snap back to the front face instantly (no transition) BEFORE swapping in the
  // next card's text, so the new answer never flashes on the still-visible back face.
  cardEl.style.transition = 'none';
  cardEl.style.transform = 'rotateY(0deg)';
  cardEl.offsetHeight; // force reflow so the snap applies immediately
  g('fc-front').textContent = card.q;
  g('fc-back').textContent = card.a;
  cardEl.style.transition = 'transform .4s cubic-bezier(.4,0,.2,1)';
  fcFlipped = false;
  g('fc-ans-btns').style.display = 'none';
  g('fc-nav-btns').style.display = 'flex';
  const prog = fcStudyIdx / fcStudyCards.length;
  g('fc-prog-bar').style.width = (prog*100) + '%';
  g('fc-progress-lbl').textContent = `${fcStudyIdx+1} / ${fcStudyCards.length}`;
}
function fcFlip() {
  if (fcFlipped) return;
  fcFlipped = true;
  g('fc-card').style.transform = 'rotateY(180deg)';
  g('fc-ans-btns').style.display = 'flex';
  g('fc-nav-btns').style.display = 'none';
}
// Lightweight SM-2-style scheduler. Each card tracks:
//   ease      — multiplier that grows/shrinks based on how easy reviews feel
//   interval  — days until the next review
//   nextReview — timestamp; a card with no nextReview (or one in the past) is "due"
//   reviews / lastReviewed — bookkeeping, also shown in Admin stats
function fcRateCard(card, ease) {
  card.ease = card.ease || 2.5;
  card.interval = card.interval || 0;
  card.reviews = (card.reviews || 0) + 1;
  if (ease === 'hard') {
    card.ease = Math.max(1.3, card.ease - 0.2);
    card.interval = card.interval ? Math.max(1, Math.round(card.interval * 1.2)) : 1;
  } else if (ease === 'good') {
    card.interval = !card.interval ? 1 : card.interval === 1 ? 6 : Math.round(card.interval * card.ease);
  } else if (ease === 'easy') {
    card.ease = card.ease + 0.15;
    card.interval = !card.interval ? 3 : card.interval === 1 ? 8 : Math.round(card.interval * card.ease * 1.3);
  }
  card.lastReviewed = Date.now();
  card.nextReview = Date.now() + card.interval * 86400000;
}
function fcAnswer(ease) {
  const card = fcStudyCards[fcStudyIdx];
  if (card) {
    fcRateCard(card, ease);
    DB.flashcards.reviewLog.push({ ts: Date.now(), deckId: card.deckId, ease });
    if (DB.flashcards.reviewLog.length > 3000) DB.flashcards.reviewLog = DB.flashcards.reviewLog.slice(-3000);
    markStreakToday();
    save();
  }
  fcStudyIdx++; fcFlipped = false; fcShowCard();
}
function fcNext() { fcStudyIdx++; fcShowCard(); }
function fcPrev() { fcStudyIdx = Math.max(0, fcStudyIdx-1); fcShowCard(); }
function fcShowDone() {
  g('fc-card-wrap').style.display = 'none';
  g('fc-ans-btns').style.display = 'none';
  g('fc-nav-btns').style.display = 'none';
  g('fc-done-screen').style.display = 'block';
  g('fc-done-stats').textContent = `Reviewed ${fcStudyCards.length} cards from "${fcCurrentDeck.name}"`;
  g('fc-prog-bar').style.width = '100%';
}
function fcRestartStudy() { if (fcCurrentDeck) fcStartStudy(fcCurrentDeck.id); }
function fcMode(m) {
  if (m === 'decks') {
    g('fc-decks-view').style.display = '';
    g('fc-study-view').style.display = 'none';
    fcRenderDecks();
  }
}
function fcImportDeck() {
  const input = document.createElement('input'); input.type='file'; input.accept='.json,.csv';
  input.onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.deck && data.cards) {
          data.deck.id = 'deck'+Date.now();
          DB.flashcards.decks.push(data.deck);
          data.cards.forEach(c => { c.id='fc'+Date.now()+Math.random(); c.deckId=data.deck.id; DB.flashcards.cards.push(c); });
          save(); fcRenderDecks(); logDataEvent('Imported deck', data.deck.name||file.name); toast('Deck imported!');
        }
      } catch(e) { toast('Invalid file format'); }
    };
    r.readAsText(file);
  };
  input.click();
}

