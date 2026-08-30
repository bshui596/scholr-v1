const AI_HTML = `
<button id="ai-chat-fab" class="ai-chat-fab" onclick="aiChatToggle()" title="Scholr AI Tools" aria-label="Open AI tools">🤖</button>

<div id="ai-chat-panel" class="ai-chat-panel" role="dialog" aria-label="AI assistant">
  <div id="ai-resize-handle" class="ai-resize-handle" title="Drag to resize"></div>
  <div class="ai-chat-head" id="ai-chat-head">
    <div style="display:flex;align-items:center;gap:8px">
      <span style="font-size:18px">🤖</span>
      <div>
        <div style="font-weight:700;font-size:13px">Scholr AI</div>
        <div style="font-size:10.5px;color:var(--ink4)">Chat, write, study — pick a tool</div>
      </div>
    </div>
    <button class="icon-btn" onclick="aiChatToggle()" aria-label="Close">✕</button>
  </div>

  <div class="ai-tab-row" id="ai-tab-row">
    <button class="ai-tab active bonus-ripple" data-tab="chat">💬 Chat</button>
    <button class="ai-tab bonus-ripple" data-tab="notes">📝 Notes</button>
    <button class="ai-tab bonus-ripple" data-tab="essay">✍️ Essay</button>
    <button class="ai-tab bonus-ripple" data-tab="outline">🧩 Outline</button>
    <button class="ai-tab bonus-ripple" data-tab="summarize">📄 Summarize</button>
    <button class="ai-tab bonus-ripple" data-tab="flashcards">🗂️ Flashcards</button>
    <button class="ai-tab bonus-ripple" data-tab="quiz">❓ Quiz</button>
    <button class="ai-tab bonus-ripple" data-tab="explain">💡 Explain</button>
    <button class="ai-tab bonus-ripple" data-tab="rewrite">🔁 Rewrite</button>
    <button class="ai-tab bonus-ripple" data-tab="polish">✨ Polish</button>
    <button class="ai-tab bonus-ripple" data-tab="studyplan">📅 Study Plan</button>
  </div>

  <!-- Chat pane -->
  <div class="ai-body" id="ai-pane-chat">
    <div id="ai-chat-msgs" class="ai-chat-msgs">
      <div class="ai-msg ai-msg-bot">Hi! I'm your Scholr AI. Ask a question here, or use the tabs above for essays, notes, quizzes, and more 🙂</div>
    </div>
    <div id="ai-chat-typing" class="ai-chat-typing" style="display:none;padding:0 14px 8px">
      <span class="ai-typing-dots"><span></span><span></span><span></span></span>
    </div>
    <form id="ai-chat-form" class="ai-chat-input-row" onsubmit="return aiChatSend(event)">
      <input id="ai-chat-input" type="text" placeholder="Type a message…" autocomplete="off" maxlength="4000"/>
      <button type="button" id="ai-mic-btn" class="ai-mic-btn" onclick="aiVoiceInput()" title="Voice input">🎤</button>\n    <button type="submit" class="ai-tool-btn bonus-ripple" id="ai-chat-send-btn">Send</button>
    </form>
  </div>

  <!-- Notes -->
  <div class="ai-body hidden" id="ai-pane-notes">
    <div class="ai-tool-pane">
      <textarea id="ai-notes-input" placeholder="Paste lecture text, a transcript, or a topic…"></textarea>
      <div class="ai-tool-row"><button class="ai-tool-btn bonus-ripple" onclick="runAiTool('notes')">Generate Notes</button></div>
      <div id="ai-notes-output" class="ai-tool-output" style="display:none"></div>
    </div>
  </div>

  <!-- Essay -->
  <div class="ai-body hidden" id="ai-pane-essay">
    <div class="ai-tool-pane">
      <textarea id="ai-essay-input" placeholder="Essay topic / prompt…" style="min-height:60px"></textarea>
      <div class="ai-tool-row">
        <select id="ai-essay-words"><option value="250">250 words</option><option value="400" selected>400 words</option><option value="600">600 words</option><option value="900">900 words</option></select>
        <select id="ai-essay-tone"><option value="academic" selected>Academic</option><option value="persuasive">Persuasive</option><option value="analytical">Analytical</option><option value="casual">Casual</option></select>
        <button class="ai-tool-btn bonus-ripple" onclick="runAiTool('essay')">Draft Essay</button>
      </div>
      <div id="ai-essay-output" class="ai-tool-output" style="display:none"></div>
    </div>
  </div>

  <!-- Outline -->
  <div class="ai-body hidden" id="ai-pane-outline">
    <div class="ai-tool-pane">
      <textarea id="ai-outline-input" placeholder="Topic for your outline…" style="min-height:60px"></textarea>
      <div class="ai-tool-row"><button class="ai-tool-btn bonus-ripple" onclick="runAiTool('outline')">Generate Outline</button></div>
      <div id="ai-outline-output" class="ai-tool-output" style="display:none"></div>
    </div>
  </div>

  <!-- Summarize -->
  <div class="ai-body hidden" id="ai-pane-summarize">
    <div class="ai-tool-pane">
      <textarea id="ai-summarize-input" placeholder="Paste your note here…"></textarea>
      <div class="ai-tool-row"><button class="ai-tool-btn bonus-ripple" onclick="runAiTool('summarize')">Summarize</button></div>
      <div id="ai-summarize-output" class="ai-tool-output" style="display:none"></div>
    </div>
  </div>

  <!-- Flashcards -->
  <div class="ai-body hidden" id="ai-pane-flashcards">
    <div class="ai-tool-pane">
      <textarea id="ai-flashcards-input" placeholder="Paste study material…"></textarea>
      <div class="ai-tool-row">
        <select id="ai-flashcards-count"><option value="5">5 cards</option><option value="8" selected>8 cards</option><option value="12">12 cards</option></select>
        <select id="ai-flashcards-course"><option value="">No course (General deck)</option></select>
        <button class="ai-tool-btn bonus-ripple" onclick="runAiTool('flashcards')">Generate Flashcards</button>
      </div>
      <div id="ai-flashcards-output" style="display:flex;flex-direction:column;gap:8px"></div>
      <button id="ai-flashcards-addall" class="ai-tool-btn bonus-ripple" style="display:none" onclick="aiAddAllFlashcardsToDeck()">➕ Add all to my deck</button>
    </div>
  </div>

  <!-- Quiz -->
  <div class="ai-body hidden" id="ai-pane-quiz">
    <div class="ai-tool-pane">
      <textarea id="ai-quiz-input" placeholder="Paste study material…"></textarea>
      <div class="ai-tool-row">
        <select id="ai-quiz-count"><option value="3">3 questions</option><option value="5" selected>5 questions</option><option value="8">8 questions</option></select>
        <button class="ai-tool-btn bonus-ripple" onclick="runAiTool('quiz')">Generate Quiz</button>
      </div>
      <div id="ai-quiz-output" style="display:flex;flex-direction:column;gap:8px"></div>
    </div>
  </div>

  <!-- Explain -->
  <div class="ai-body hidden" id="ai-pane-explain">
    <div class="ai-tool-pane">
      <textarea id="ai-explain-input" placeholder="Paste a concept or question…"></textarea>
      <div class="ai-tool-row">
        <select id="ai-explain-level"><option value="simple" selected>Simple</option><option value="detailed">Detailed</option></select>
        <button class="ai-tool-btn bonus-ripple" onclick="runAiTool('explain')">Explain</button>
      </div>
      <div id="ai-explain-output" class="ai-tool-output" style="display:none"></div>
    </div>
  </div>

  <!-- Rewrite -->
  <div class="ai-body hidden" id="ai-pane-rewrite">
    <div class="ai-tool-pane">
      <textarea id="ai-rewrite-input" placeholder="Paste text to rewrite…"></textarea>
      <div class="ai-tool-row">
        <select id="ai-rewrite-tone"><option value="clearer" selected>Clearer</option><option value="formal">Formal</option><option value="casual">Casual</option><option value="concise">Concise</option><option value="simpler">Simpler</option></select>
        <button class="ai-tool-btn bonus-ripple" onclick="runAiTool('rewrite')">Rewrite</button>
      </div>
      <div id="ai-rewrite-output" class="ai-tool-output" style="display:none"></div>
    </div>
  </div>

  <!-- Polish -->
  <div class="ai-body hidden" id="ai-pane-polish">
    <div class="ai-tool-pane">
      <textarea id="ai-polish-input" placeholder="Paste writing to fix grammar/clarity…"></textarea>
      <div class="ai-tool-row"><button class="ai-tool-btn bonus-ripple" onclick="runAiTool('polish')">Polish</button></div>
      <div id="ai-polish-output" class="ai-tool-output" style="display:none"></div>
    </div>
  </div>

  <!-- Study Plan -->
  <div class="ai-body hidden" id="ai-pane-studyplan">
    <div class="ai-tool-pane">
      <textarea id="ai-studyplan-input" placeholder="Paste material or topics to study…"></textarea>
      <div class="ai-tool-row">
        <select id="ai-studyplan-days"><option value="3">3 days</option><option value="7" selected>7 days</option><option value="14">14 days</option></select>
        <button class="ai-tool-btn bonus-ripple" onclick="runAiTool('studyplan')">Generate Plan</button>
      </div>
      <div id="ai-studyplan-output" class="ai-tool-output" style="display:none"></div>
    </div>
  </div>
</div>
`;

