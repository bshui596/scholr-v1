/* ═══════════════════════════════════════════════════
   CALCULATOR MODULE
═══════════════════════════════════════════════════ */
let calcExpr = '', calcResult = '0', calcNewNum = true, calcHistArr = [];
let calcCurrentMode = 'basic';
let calcDegMode = true; // scientific calculators default to degrees for trig — this was missing entirely before

function toggleCalc() {
  const p = g('calc-panel');
  if (!p) return;
  p.style.display = p.style.display === 'none' ? 'block' : 'none';
  makeDraggable(p, g('calc-hd'));
}
function makeDraggable(el, handle) {
  if (el._draggable) return;
  el._draggable = true;
  let ox, oy, ex, ey;
  handle.addEventListener('mousedown', e => {
    ox = e.clientX - el.getBoundingClientRect().left;
    oy = e.clientY - el.getBoundingClientRect().top;
    const mm = e2 => {
      el.style.right = 'auto'; el.style.bottom = 'auto';
      el.style.left = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, e2.clientX - ox)) + 'px';
      el.style.top = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, e2.clientY - oy)) + 'px';
    };
    const mu = () => { document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu); };
    document.addEventListener('mousemove', mm); document.addEventListener('mouseup', mu);
  });
}

function setCalcSize(size){
  const p = g('calc-panel'); if(!p) return;
  if(size==='small'){ p.style.width='240px'; p.style.height='auto'; p.style.right='20px'; p.style.bottom='20px'; }
  else if(size==='medium'){ p.style.width='360px'; p.style.height='auto'; p.style.right='20px'; p.style.bottom='20px'; }
  else if(size==='large'){ p.style.width='520px'; p.style.height='auto'; p.style.right='20px'; p.style.bottom='20px'; }
  // ensure draggable works
  makeDraggable(p, g('calc-hd'));
}
function calcMode(m) {
  calcCurrentMode = m;
  document.querySelectorAll('.calc-mode-btn').forEach(b => b.classList.remove('on'));
  g('calc-m-' + m)?.classList.add('on');
  g('calc-sci-row').style.display = m === 'sci' ? 'block' : 'none';
}
function calcInput(v) {
  if (calcNewNum && !'÷×−+'.includes(v)) { calcExpr = v === '.' ? '0.' : v; calcNewNum = false; }
  else calcExpr += v;
  g('calc-display').textContent = calcExpr || '0';
  g('calc-expr').textContent = '';
}
function calcSci(fn) {
  if (fn === '1/(') { calcExpr = '1/(' + (calcExpr || '') + ')'; calcNewNum = false; g('calc-display').textContent = calcExpr; return; }
  calcExpr += fn; calcNewNum = false;
  g('calc-display').textContent = calcExpr;
}
function calcToggleDeg(){
  calcDegMode = !calcDegMode;
  const btn = g('calc-deg-btn'); if (btn) btn.textContent = calcDegMode ? 'DEG' : 'RAD';
}
function calcClear() {
  calcExpr = ''; calcResult = '0'; calcNewNum = true;
  g('calc-display').textContent = '0';
  g('calc-expr').textContent = '';
}
function calcToggleSign() {
  if (calcExpr.startsWith('-')) calcExpr = calcExpr.slice(1);
  else if (calcExpr) calcExpr = '-' + calcExpr;
  g('calc-display').textContent = calcExpr || '0';
}
function calcEquals() {
  if (!calcExpr) return;
  try {
    const expr = calcExpr
      .replace(/÷/g,'/').replace(/×/g,'*').replace(/−/g,'-')
      .replace(/π/g, Math.PI).replace(/e(?![0-9])/g, Math.E)
      .replace(/sin\(/g, calcDegMode?'sinD(':'Math.sin(').replace(/cos\(/g, calcDegMode?'cosD(':'Math.cos(')
      .replace(/tan\(/g, calcDegMode?'tanD(':'Math.tan(').replace(/log\(/g,'Math.log10(')
      .replace(/ln\(/g,'Math.log(').replace(/sqrt\(/g,'Math.sqrt(')
      .replace(/abs\(/g,'Math.abs(').replace(/\^/g,'**');
    const raw = Function('"use strict"; const sinD=x=>Math.sin(x*Math.PI/180),cosD=x=>Math.cos(x*Math.PI/180),tanD=x=>Math.tan(x*Math.PI/180); return (' + expr + ')')();
    const res = +raw.toFixed(10);
    g('calc-expr').textContent = calcExpr + ' =';
    g('calc-display').textContent = res;
    g('calc-hist-row').textContent = 'ANS: ' + res;
    calcHistArr.unshift({ expr: calcExpr, res });
    if (calcHistArr.length > 20) calcHistArr.pop();
    renderCalcHist();
    calcExpr = String(res); calcNewNum = true;
  } catch(e) {
    g('calc-display').textContent = 'Error';
    calcExpr = ''; calcNewNum = true;
  }
}
function renderCalcHist() {
  const el = g('calc-hist-list'); if (!el) return;
  el.innerHTML = calcHistArr.map(h => `<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--bor);cursor:pointer" onclick="calcExpr='${h.res}';g('calc-display').textContent='${h.res}';g('calc-expr').textContent='${h.expr} ='"><span style="color:var(--ink4)">${h.expr}</span><strong>${h.res}</strong></div>`).join('');
}
function calcClearHist() { calcHistArr = []; renderCalcHist(); }
// Keyboard support for calculator
document.addEventListener('keydown', e => {
  const p = g('calc-panel');
  if (!p || p.style.display === 'none') return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  const key = e.key;
  if ('0123456789'.includes(key)) calcInput(key);
  else if (key === '+') calcInput('+');
  else if (key === '-') calcInput('−');
  else if (key === '*') calcInput('×');
  else if (key === '/') { e.preventDefault(); calcInput('÷'); }
  else if (key === '.') calcInput('.');
  else if (key === 'Enter' || key === '=') calcEquals();
  else if (key === 'Backspace') { calcExpr = calcExpr.slice(0,-1); g('calc-display').textContent = calcExpr || '0'; }
  else if (key === 'Escape') calcClear();
});

