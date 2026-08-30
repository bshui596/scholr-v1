const BONUS_HTML = `
<div class="bonus-codes-wrap">
  <div class="bonus-codes-title">🎁 Bonus Codes</div>
  <div style="font-size:11px;color:var(--ink4)">Have a code? Redeem it here to unlock extra features.</div>
  <div class="bonus-codes-row">
    <input id="bonus-code-input" type="text" placeholder="ENTER CODE" maxlength="24" onkeydown="if(event.key==='Enter')bonusRedeemCode()"/>
    <button class="bonus-ripple" onclick="bonusRedeemCode()">Redeem</button>
  </div>
  <div class="bonus-codes-row">
    <button class="bonus-ripple" style="flex:1;background:var(--s2);color:var(--ink3);border:1px solid var(--bor)" onclick="bonusResetLastCode()">↺ Reset previous code</button>
    <button class="bonus-ripple" style="flex:1;background:var(--s2);color:#dc2626;border:1px solid #dc2626" onclick="bonusResetAll()">⚠️ Reset ALL to default</button>
  </div>
  <div id="bonus-code-msg" class="bonus-codes-msg"></div>
  <div id="bonus-unlocked-list" class="bonus-unlocked-list"></div>
  <div id="bonus-admin-slot"></div>
</div>`;

function bonusEnsureDefault(){
  const flags = bonusGetUnlocked();
  if (!flags.starter) {
    flags.starter = true;
    BONUS_STARTER_FLAGS.forEach(f => flags[f] = true);
    bonusSetUnlocked(flags);
  }
}

function bonusInit(){
  bonusEnsureDefault();
  const styleTag = document.createElement('style');
  styleTag.id = 'bonus-styles';
  styleTag.textContent = BONUS_CSS;
  document.head.appendChild(styleTag);

  // Try to attach inside an existing Settings panel; otherwise float it.
  const settingsContainer =
    document.querySelector('#settings, .settings, [id*="settings" i], [class*="settings" i]');

  if (settingsContainer) {
    const section = document.createElement('div');
    section.id = 'bonus-codes-section';
    section.innerHTML = BONUS_HTML;
    settingsContainer.appendChild(section);
  } else {
    const details = document.createElement('details');
    details.className = 'bonus-floating-card';
    details.innerHTML = `<summary>🎁 Bonus Codes</summary>${BONUS_HTML}`;
    document.body.appendChild(details);
  }

  bonusApplyEffects(bonusGetUnlocked());
  bonusRenderUnlocked();
}


document.addEventListener('DOMContentLoaded', bonusInit);
if (document.readyState !== 'loading') bonusInit();



/* ---------- Speech: text-to-speech + voice input (native browser APIs, fast & free) ---------- */
