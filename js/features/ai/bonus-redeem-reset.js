function bonusRedeemCode(){
  const input = g('bonus-code-input');
  const msg = g('bonus-code-msg');
  if (!input) return;
  const code = input.value.trim().toUpperCase();
  const entry = BONUS_CODES[code];
  const flags = bonusGetUnlocked();

  if (!code) { msg.textContent = 'Enter a code first.'; msg.className = 'bonus-codes-msg err'; return; }
  if (!entry) { msg.textContent = '❌ Invalid code.'; msg.className = 'bonus-codes-msg err'; return; }
  if (flags[entry.flag]) { msg.textContent = 'Already unlocked!'; msg.className = 'bonus-codes-msg err'; return; }

  flags[entry.flag] = true;
  if (entry.flag === 'starter') BONUS_STARTER_FLAGS.forEach(f => flags[f] = true);
  bonusSetUnlocked(flags);
  localStorage.setItem('scholr_bonus_last_code', code);

  msg.textContent = '✅ Unlocked: ' + entry.label;
  msg.className = 'bonus-codes-msg ok bonus-check-pop';
  input.value = '';
  bonusApplyEffects(flags);
  bonusRenderUnlocked();
}

// Removes only the most recently redeemed code (does not touch admin unless
// admin was the last one redeemed) — a quick "undo my last code" action.
function bonusResetLastCode(){
  const lastCode = localStorage.getItem('scholr_bonus_last_code');
  const msg = g('bonus-code-msg');
  if (!lastCode || !BONUS_CODES[lastCode]) {
    if (msg) { msg.textContent = 'No previous code to reset.'; msg.className = 'bonus-codes-msg err'; }
    return;
  }
  const flags = bonusGetUnlocked();
  const entry = BONUS_CODES[lastCode];
  delete flags[entry.flag];
  if (entry.flag === 'starter') BONUS_STARTER_FLAGS.forEach(f => delete flags[f]);
  bonusSetUnlocked(flags);
  localStorage.removeItem('scholr_bonus_last_code');
  if (msg) { msg.textContent = '↺ Reset: ' + entry.label; msg.className = 'bonus-codes-msg ok'; }
  bonusApplyEffects(flags);
  bonusRenderUnlocked();
}

// One press: wipes ALL redeemed codes (including admin) back to just the
// default STR2030 starter set.
function bonusResetAll(){
  if (!confirm('Reset all bonus codes back to default? This removes admin access and every unlocked extra.')) return;
  const flags = { starter: true };
  BONUS_STARTER_FLAGS.forEach(f => flags[f] = true);
  bonusSetUnlocked(flags);
  localStorage.removeItem('scholr_bonus_last_code');
  bonusApplyEffects(flags);
  bonusRenderUnlocked();
  const msg = g('bonus-code-msg');
  if (msg) { msg.textContent = '✅ Reset to default (STR2030 only)'; msg.className = 'bonus-codes-msg ok bonus-check-pop'; }
}

// Turns OFF one specific feature (even a default starter one) — always
// removable, individually, regardless of how it was unlocked.
function bonusRemoveFeature(flag){
  const flags = bonusGetUnlocked();
  delete flags[flag];
  bonusSetUnlocked(flags);
  bonusApplyEffects(flags);   // tears down the matching onscreen element
  bonusRenderUnlocked();
}

