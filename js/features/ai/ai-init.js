// Inject the CSS + HTML automatically once the page loads
(function initAiTools(){
  const styleTag = document.createElement('style');
  styleTag.id = 'ai-tools-styles';
  styleTag.textContent = AI_CSS;
  document.head.appendChild(styleTag);

  const container = document.createElement('div');
  container.id = 'ai-tools-container';
  container.innerHTML = AI_HTML;
  document.body.appendChild(container);
  aiApplySavedGeometry();
  aiRestoreChatUI();
})();

/* ══════════════════════════════════════════════
   SCHOLR — Bonus Codes (Settings) + extra animations
   Self-contained: injects its own CSS/HTML/JS.
   Paste this whole file before </body>, after the AI tools snippet.

   WHAT IT DOES
   - Adds a "🎁 Bonus Codes" section that auto-attaches into your
     Settings panel if it finds a common settings container
     (#settings, .settings, [id*="settings"]) — otherwise it shows
     as its own small floating card, bottom-left, so nothing breaks.
   - Redeeming a code unlocks a real feature flag in localStorage.
   - Built-in codes (edit BONUS_CODES below to change these):
       !BSHUI596!        -> Admin Panel (real DB stats, quick-nav,
                             clear notes/HW, export/clear all data)
       STR2030           -> Starter Pack, unlocked by default
       STR-TOOLS-EXTRA   -> 3 extra AI tabs: Translate/Brainstorm/Citation
       STR-FOCUS-TIMER   -> Pomodoro focus timer widget
       STR-STREAK-DAYS   -> daily streak tracker badge
       STR-AUTO-SPEAK    -> auto-reads AI replies aloud
       STR-QUICK-EXPORT  -> one-click "export all data" button
       STR-QUICK-NAV     -> quick-jump nav bar to any page
   - Adds reusable animation classes (ripple buttons, card lift,
     shimmer skeleton, staggered fade-in lists) you can reuse
     anywhere else in Scholr too.
══════════════════════════════════════════════ */

const BONUS_CSS = `
/* ---- reusable animation helpers ---- */
@keyframes bonusFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes bonusPop{0%{transform:scale(.85);opacity:0}60%{transform:scale(1.04)}100%{transform:scale(1);opacity:1}}
@keyframes bonusShimmer{0%{background-position:-200px 0}100%{background-position:200px 0}}
@keyframes bonusRipple{to{transform:scale(3);opacity:0}}
@keyframes bonusConfettiFall{to{transform:translateY(110vh) rotate(540deg);opacity:0}}
@keyframes bonusRainbowShift{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(360deg)}}
@keyframes bonusCheckPop{0%{transform:scale(0) rotate(-20deg)}70%{transform:scale(1.15) rotate(4deg)}100%{transform:scale(1) rotate(0)}}

.bonus-stagger > *{animation:bonusFadeUp .35s ease both}
.bonus-stagger > *:nth-child(1){animation-delay:.02s}
.bonus-stagger > *:nth-child(2){animation-delay:.06s}
.bonus-stagger > *:nth-child(3){animation-delay:.10s}
.bonus-stagger > *:nth-child(4){animation-delay:.14s}
.bonus-stagger > *:nth-child(5){animation-delay:.18s}
.bonus-stagger > *:nth-child(n+6){animation-delay:.22s}

.bonus-card-hover{transition:transform .18s ease,box-shadow .18s ease}
.bonus-card-hover:hover{transform:translateY(-3px);box-shadow:var(--sh3)}

.bonus-ripple{position:relative;overflow:hidden}
.bonus-ripple-fx{position:absolute;border-radius:50%;background:rgba(255,255,255,.5);
  transform:scale(0);pointer-events:none;animation:bonusRipple .5s ease-out forwards}

.bonus-skeleton{
  background:linear-gradient(90deg,var(--s2) 25%,var(--bor) 37%,var(--s2) 63%);
  background-size:400px 100%;animation:bonusShimmer 1.4s ease-in-out infinite;border-radius:8px;
}

.bonus-check-pop{animation:bonusCheckPop .4s cubic-bezier(.34,1.56,.64,1) both}
/* ---- Bonus Codes panel ---- */
.bonus-codes-wrap{padding:14px;display:flex;flex-direction:column;gap:10px;animation:bonusFadeUp .3s ease both}
.bonus-codes-title{font-weight:700;font-size:13.5px;display:flex;align-items:center;gap:6px}
.bonus-codes-row{display:flex;gap:8px}
.bonus-codes-row input{
  flex:1;border:1px solid var(--bor);border-radius:9px;padding:8px 11px;font-size:12.5px;
  background:var(--bg);color:var(--ink);outline:none;transition:border-color .15s,box-shadow .15s;
  text-transform:uppercase;letter-spacing:.5px;
}
.bonus-codes-row input:focus{border-color:var(--ac);box-shadow:0 0 0 3px color-mix(in srgb, var(--ac) 18%, transparent)}
.bonus-codes-row button{
  border:none;border-radius:9px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;color:var(--on-ac,#fff);
  background:linear-gradient(135deg,var(--ac),var(--ac2));transition:transform .15s;
}
.bonus-codes-row button:hover{transform:translateY(-1px)}
.bonus-codes-row button:active{transform:scale(.96)}
.bonus-codes-msg{font-size:11.5px;min-height:15px}
.bonus-codes-msg.ok{color:#16a34a}
.bonus-codes-msg.err{color:#dc2626}

.bonus-unlocked-list{display:flex;flex-direction:column;gap:6px}
.bonus-unlocked-item{
  display:flex;align-items:center;justify-content:space-between;gap:8px;
  padding:8px 10px;border:1px solid var(--bor);border-radius:9px;background:var(--s2);font-size:12px;
}

.bonus-admin-panel{
  border:1px dashed var(--ac);border-radius:10px;padding:12px;margin-top:6px;
  display:flex;flex-direction:column;gap:8px;background:var(--s2);
}
.bonus-admin-stat{display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px solid var(--bor)}
.bonus-admin-btns{display:flex;gap:8px;flex-wrap:wrap}
.bonus-admin-btns button{
  border:1px solid var(--bor);background:var(--bg);color:var(--ink2);border-radius:8px;
  padding:6px 10px;font-size:11.5px;cursor:pointer;transition:all .15s;
}
.bonus-admin-btns button:hover{border-color:var(--ac);color:var(--ac);transform:translateY(-1px)}

.bonus-floating-card{
  position:fixed;left:20px;bottom:20px;z-index:7500;width:280px;max-width:calc(100vw - 40px);
  background:var(--sur);border:1px solid var(--bor);border-radius:14px;box-shadow:var(--sh3);
  animation:bonusPop .3s cubic-bezier(.34,1.56,.64,1) both;
}
.bonus-floating-card summary{cursor:pointer;padding:10px 14px;font-weight:700;font-size:12.5px;list-style:none;
  display:flex;align-items:center;gap:6px}
.bonus-floating-card summary::-webkit-details-marker{display:none}
`;

