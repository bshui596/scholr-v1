function bonusApplyEffects(flags){
  bonusApplyFeatureHooks(flags);
}

function bonusApplyFeatureHooks(flags){
  // Extra AI tabs: Translate / Brainstorm / Citation
  if (flags.toolsExtra && !g('ai-tab-extra-added')) {
    const tabRow = g('ai-tab-row');
    const body = g('ai-chat-panel');
    if (tabRow && body) {
      const marker = document.createElement('span');
      marker.id = 'ai-tab-extra-added';
      marker.style.display = 'none';
      tabRow.appendChild(marker);

      [['translate','🌐 Translate'], ['brainstorm','💭 Brainstorm'], ['citation','📚 Citation']].forEach(([key,label]) => {
        const tabBtn = document.createElement('button');
        tabBtn.className = 'ai-tab bonus-ripple ai-tab-extra';
        tabBtn.dataset.tab = key;
        tabBtn.textContent = label;
        tabRow.appendChild(tabBtn);

        const pane = document.createElement('div');
        pane.className = 'ai-body hidden ai-tab-extra-pane';
        pane.id = 'ai-pane-' + key;
        if (key === 'translate') {
          pane.innerHTML = `<div class="ai-tool-pane">
            <textarea id="ai-translate-input" placeholder="Text to translate…"></textarea>
            <div class="ai-tool-row">
              <select id="ai-translate-lang"><option>Spanish</option><option>French</option><option>German</option><option>Mandarin Chinese</option><option>Japanese</option></select>
              <button class="ai-tool-btn bonus-ripple" onclick="runAiExtraTool('translate')">Translate</button>
            </div>
            <div id="ai-translate-output" class="ai-tool-output" style="display:none"></div>
          </div>`;
        } else if (key === 'brainstorm') {
          pane.innerHTML = `<div class="ai-tool-pane">
            <textarea id="ai-brainstorm-input" placeholder="Topic to brainstorm…" style="min-height:60px"></textarea>
            <div class="ai-tool-row"><button class="ai-tool-btn bonus-ripple" onclick="runAiExtraTool('brainstorm')">Brainstorm</button></div>
            <div id="ai-brainstorm-output" style="display:flex;flex-direction:column;gap:6px"></div>
          </div>`;
        } else {
          pane.innerHTML = `<div class="ai-tool-pane">
            <textarea id="ai-citation-input" placeholder="Paste source info (title, author, URL, etc.)…" style="min-height:60px"></textarea>
            <div class="ai-tool-row">
              <select id="ai-citation-style"><option>APA</option><option>MLA</option><option>Chicago</option></select>
              <button class="ai-tool-btn bonus-ripple" onclick="runAiExtraTool('citation')">Generate Citation</button>
            </div>
            <div id="ai-citation-output" class="ai-tool-output" style="display:none"></div>
          </div>`;
        }
        body.appendChild(pane);
      });
    }
  }
  if (!flags.toolsExtra && g('ai-tab-extra-added')) {
    document.querySelectorAll('.ai-tab-extra').forEach(el => el.remove());
    document.querySelectorAll('.ai-tab-extra-pane').forEach(el => el.remove());
    const marker = g('ai-tab-extra-added'); if (marker) marker.remove();
    // if an extra tab was the active one, fall back to Chat
    const activeTab = document.querySelector('.ai-tab.active');
    if (!activeTab) {
      const chatTab = document.querySelector('.ai-tab[data-tab="chat"]');
      if (chatTab) chatTab.classList.add('active');
      const chatPane = g('ai-pane-chat'); if (chatPane) chatPane.classList.remove('hidden');
    }
  }

  // Focus timer widget
  if (flags.focus && !g('bonus-focus-widget')) bonusMountFocusTimer();
  if (!flags.focus) { const w = g('bonus-focus-widget'); if (w) w.remove(); clearInterval(bonusFocusInterval); bonusFocusInterval = null; }

  // Daily streak tracker
  if (flags.streak) bonusUpdateStreak();
  if (!flags.streak) { const b = g('bonus-streak-badge'); if (b) b.remove(); }

  // Quick-export button floats near the FAB if unlocked
  if (flags.quickexport && !g('bonus-quickexport-btn')) {
    const btn = document.createElement('button');
    btn.id = 'bonus-quickexport-btn';
    btn.className = 'bonus-floating-card bonus-ripple';
    btn.style.cssText = 'right:90px;left:auto;bottom:22px;width:auto;padding:10px 14px;cursor:pointer;font-size:12px;font-weight:600;border:1px solid var(--bor)';
    btn.textContent = '📦 Export data';
    btn.onclick = bonusExportData;
    document.body.appendChild(btn);
  }
  if (!flags.quickexport) { const b = g('bonus-quickexport-btn'); if (b) b.remove(); }

  // Quick-nav mini command bar — retired from the floating overlay; the sidebar's
  // grouped hubs plus the ⌘K command palette already cover instant page-jumping,
  // and the floating bar only added a second, less discoverable way to do the same
  // thing while colliding with the topbar. The flag/toggle still exists in Settings,
  // it just no longer mounts this element.
  { const bar = g('bonus-quicknav-bar'); if (bar) bar.remove(); }
}

