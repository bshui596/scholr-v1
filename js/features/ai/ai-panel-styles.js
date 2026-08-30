
/* ══════════════════════════════════════════════
   SCHOLR AI — full frontend integration (v2)
   Tabbed AI Tools panel: Chat (streaming) · Notes · Essay · Outline ·
   Summarize · Flashcards · Quiz · Explain · Rewrite · Polish · Study Plan

   Fully inline in this file — no manual copy/paste required.
══════════════════════════════════════════════ */

/* ---- injected CSS ---- */
const AI_CSS = `
.ai-chat-fab{
  position:fixed;right:22px;bottom:22px;z-index:8000;
  width:56px;height:56px;border-radius:50%;
  background:linear-gradient(135deg,var(--ac),var(--ac2));
  color:#fff;font-size:24px;display:flex;align-items:center;justify-content:center;
  box-shadow:var(--sh3);border:none;cursor:pointer;
  transition:transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
  animation:aiFabPop .4s cubic-bezier(.34,1.56,.64,1);
}
.ai-chat-fab:hover{transform:translateY(-3px) scale(1.06);box-shadow:0 10px 28px rgba(0,0,0,.25)}
.ai-chat-fab:active{transform:scale(.94)}
@keyframes aiFabPop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}

.ai-chat-panel{
  position:fixed;right:22px;bottom:90px;z-index:8000;
  width:380px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 120px);
  min-width:300px;min-height:340px;
  background:var(--sur);border:1px solid var(--bor);border-radius:16px;
  box-shadow:var(--sh3);display:flex;flex-direction:column;overflow:hidden;
  opacity:0;transform:translateY(16px) scale(.96);pointer-events:none;
  transition:opacity .2s ease,transform .2s cubic-bezier(.34,1.56,.64,1);
}
.ai-chat-panel.on{opacity:1;transform:none;pointer-events:auto}
.ai-chat-panel.ai-dragging{transition:none;user-select:none}
.ai-resize-handle{
  position:absolute;left:2px;bottom:2px;width:16px;height:16px;cursor:nwse-resize;
  background:linear-gradient(135deg,transparent 50%,var(--bor) 50%);border-radius:0 0 0 4px;z-index:2;
}

.ai-chat-head{
  display:flex;align-items:center;justify-content:space-between;gap:8px;
  padding:12px 14px;border-bottom:1px solid var(--bor);background:var(--s2);flex-shrink:0;
  cursor:grab;
}
.ai-chat-head:active{cursor:grabbing}
.ai-tab-row{
  display:flex;gap:4px;padding:8px 10px;border-bottom:1px solid var(--bor);
  overflow-x:auto;flex-shrink:0;scrollbar-width:thin;
}
.ai-tab{
  flex-shrink:0;padding:6px 11px;border-radius:20px;font-size:11.5px;font-weight:600;
  background:transparent;border:1px solid var(--bor);color:var(--ink3);cursor:pointer;
  transition:all .15s;white-space:nowrap;
}
.ai-tab:hover{border-color:var(--ac);color:var(--ac)}
.ai-tab.active{background:var(--ac);border-color:var(--ac);color:var(--on-ac,#fff)}

.ai-body{flex:1;overflow-y:auto;display:flex;flex-direction:column}
.ai-body.hidden{display:none}

.ai-chat-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
.ai-msg{
  max-width:86%;padding:9px 12px;border-radius:12px;font-size:12.5px;line-height:1.5;
  white-space:pre-wrap;word-wrap:break-word;
  animation:aiMsgIn .25s cubic-bezier(.2,.8,.3,1) both;
}
@keyframes aiMsgIn{from{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:none}}
.ai-msg-bot{align-self:flex-start;background:var(--s2);color:var(--ink2);border-bottom-left-radius:3px;border:1px solid var(--bor);box-shadow:0 1px 3px rgba(0,0,0,.06)}
.ai-msg-bot h3,.ai-msg-bot h4,.ai-msg-bot h5{font-family:var(--font);color:var(--ink);line-height:1.3;margin:6px 0 3px}
.ai-msg-bot h3{font-size:14.5px;font-weight:700}
.ai-msg-bot h4{font-size:13.5px;font-weight:700}
.ai-msg-bot h5{font-size:12.5px;font-weight:700}
.ai-msg-bot h3:first-child,.ai-msg-bot h4:first-child,.ai-msg-bot h5:first-child{margin-top:0}
.ai-msg-bot .ai-ul{margin:3px 0 3px 16px;padding:0}
.ai-msg-bot .ai-ul li{margin-bottom:2px}
.ai-msg-bot code{background:var(--s3);color:var(--ink);padding:1px 5px;border-radius:4px;font-family:var(--font-m);font-size:11.5px}
.ai-msg-bot pre.ai-code{background:var(--s3);color:var(--ink);padding:9px 11px;border-radius:8px;font-family:var(--font-m);font-size:11.5px;overflow-x:auto;margin:5px 0;white-space:pre}
.ai-msg-user{align-self:flex-end;background:var(--ac);color:var(--on-ac,#fff);border-bottom-right-radius:3px;box-shadow:0 1px 3px rgba(0,0,0,.1)}

.ai-typing-dots{display:inline-flex;gap:3px;align-items:center;padding:2px 0}
.ai-typing-dots span{
  width:5px;height:5px;border-radius:50%;background:var(--ink4);
  animation:aiDotBounce 1.1s infinite ease-in-out;
}
.ai-typing-dots span:nth-child(2){animation-delay:.15s}
.ai-typing-dots span:nth-child(3){animation-delay:.3s}
@keyframes aiDotBounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-4px);opacity:1}}

.ai-chat-input-row{display:flex;gap:8px;padding:10px;border-top:1px solid var(--bor);flex-shrink:0}
.ai-chat-input-row input{
  flex:1;border:1px solid var(--bor);border-radius:9px;padding:8px 11px;
  font-size:12.5px;background:var(--bg);color:var(--ink);outline:none;transition:border-color .15s;
}
.ai-chat-input-row input:focus{border-color:var(--ac);box-shadow:0 0 0 3px color-mix(in srgb, var(--ac) 18%, transparent)}
.ai-chat-input-row button:disabled{opacity:.6;cursor:default}

.ai-tool-pane{padding:14px;display:flex;flex-direction:column;gap:10px;flex:1;overflow-y:auto}
.ai-tool-pane textarea{
  width:100%;min-height:110px;resize:vertical;border:1px solid var(--bor);border-radius:9px;
  padding:9px 11px;font-size:12.5px;font-family:inherit;background:var(--bg);color:var(--ink);
  outline:none;transition:border-color .15s;
}
.ai-tool-pane textarea:focus{border-color:var(--ac);box-shadow:0 0 0 3px color-mix(in srgb, var(--ac) 18%, transparent)}
.ai-tool-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.ai-tool-row select{
  border:1px solid var(--bor);border-radius:8px;padding:6px 9px;font-size:11.5px;
  background:var(--bg);color:var(--ink);
}
.ai-tool-btn{
  border:none;border-radius:9px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;
  background:linear-gradient(135deg,var(--ac),var(--ac2));color:var(--on-ac,#fff);
  transition:transform .15s,box-shadow .15s;
}
.ai-tool-btn:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,0,0,.18)}
.ai-tool-btn:active{transform:translateY(0) scale(.97)}
.ai-tool-btn:disabled{opacity:.6;cursor:default;transform:none;box-shadow:none}

.ai-tool-output{
  border:1px solid var(--bor);border-radius:10px;padding:12px;font-size:12.5px;line-height:1.55;
  white-space:pre-wrap;overflow-wrap:break-word;word-break:break-word;max-width:100%;
  background:var(--s2);color:var(--ink2);min-height:40px;
  animation:aiFadeIn .25s ease both;
}
@keyframes aiFadeIn{from{opacity:0}to{opacity:1}}

.ai-flash-card{
  border:1px solid var(--bor);border-radius:10px;padding:12px;background:var(--s2);cursor:pointer;
  animation:aiMsgIn .25s ease both;transition:transform .15s;
}
.ai-flash-card:hover{transform:translateY(-2px)}
.ai-flash-q{font-weight:600;font-size:12.5px;color:var(--ink)}
.ai-flash-a{font-size:12px;color:var(--ink3);margin-top:6px;display:none}
.ai-flash-card.flipped .ai-flash-a{display:block}

.ai-quiz-q{border:1px solid var(--bor);border-radius:10px;padding:12px;background:var(--s2);animation:aiMsgIn .25s ease both}
.ai-quiz-opt{
  display:block;width:100%;text-align:left;padding:7px 10px;margin-top:6px;border-radius:8px;
  border:1px solid var(--bor);background:var(--bg);color:var(--ink2);font-size:12px;cursor:pointer;
  transition:all .15s;
}
.ai-quiz-opt:hover{border-color:var(--ac)}
.ai-quiz-opt.correct{background:#16a34a22;border-color:#16a34a;color:#16a34a}
.ai-quiz-opt.wrong{background:#dc262622;border-color:#dc2626;color:#dc2626}


.ai-tab{position:relative;overflow:hidden}
.ai-tool-btn{position:relative;overflow:hidden}
.ai-chat-fab{position:fixed;}
.ai-stream-cursor{display:inline-block;width:2px;height:1em;background:var(--ac);margin-left:1px;
  vertical-align:middle;animation:aiCursorBlink .8s steps(1) infinite}
@keyframes aiCursorBlink{50%{opacity:0}}
.ai-tab.active{animation:aiTabPop .25s cubic-bezier(.34,1.56,.64,1)}
@keyframes aiTabPop{0%{transform:scale(.9)}60%{transform:scale(1.04)}100%{transform:scale(1)}}

@media(max-width:480px){
  .ai-chat-panel{right:12px;left:12px;width:auto;bottom:82px}
  .ai-chat-fab{right:16px;bottom:16px}
}
`;

/* ---- injected HTML ---- */
