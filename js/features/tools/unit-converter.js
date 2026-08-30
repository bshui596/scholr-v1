/* ═══════════════════════════════════════════════════
   UNIT CONVERTER
═══════════════════════════════════════════════════ */
const CONV_CATS = {
  length: { units:['km','m','cm','mm','mi','yd','ft','in','nm'], base:'m', factors:{km:1000,m:1,cm:.01,mm:.001,mi:1609.344,yd:.9144,ft:.3048,in:.0254,nm:1e-9} },
  weight: { units:['kg','g','mg','lb','oz','t','stone'], base:'kg', factors:{kg:1,g:.001,mg:1e-6,lb:.453592,oz:.0283495,t:1000,stone:6.35029} },
  temp: { units:['°C','°F','K'], base:'°C', special:true },
  area: { units:['km²','m²','cm²','ha','mi²','acre','ft²','in²'], base:'m²', factors:{'km²':1e6,'m²':1,'cm²':.0001,'ha':10000,'mi²':2589988,'acre':4046.86,'ft²':.0929,'in²':.000645} },
  volume: { units:['L','mL','m³','cm³','gal(US)','fl oz','cup','tbsp','tsp'], base:'L', factors:{L:1,mL:.001,'m³':1000,'cm³':.001,'gal(US)':3.78541,'fl oz':.0295735,cup:.236588,tbsp:.0147868,tsp:.00492892} },
  speed: { units:['m/s','km/h','mph','knot','ft/s'], base:'m/s', factors:{'m/s':1,'km/h':1/3.6,mph:.44704,knot:.514444,'ft/s':.3048} },
  time: { units:['s','min','h','day','week','month','year'], base:'s', factors:{s:1,min:60,h:3600,day:86400,week:604800,month:2629800,year:31557600} },
  data: { units:['B','KB','MB','GB','TB','Kib','Mib','Gib'], base:'B', factors:{B:1,KB:1000,MB:1e6,GB:1e9,TB:1e12,Kib:1024,Mib:1048576,Gib:1073741824} },
  energy: { units:['J','kJ','cal','kcal','Wh','kWh','BTU'], base:'J', factors:{J:1,kJ:1000,cal:4.184,kcal:4184,Wh:3600,kWh:3600000,BTU:1055.06} },
  pressure: { units:['Pa','kPa','MPa','bar','psi','atm','mmHg'], base:'Pa', factors:{Pa:1,kPa:1000,MPa:1e6,bar:100000,psi:6894.76,atm:101325,mmHg:133.322} }
};
let convCurrentCat = 'length';

function convCat(cat, btn) {
  convCurrentCat = cat;
  document.querySelectorAll('[data-cat]').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  const catData = CONV_CATS[cat];
  const fromSel = g('conv-from'), toSel = g('conv-to');
  if (!fromSel || !toSel) return;
  const opts = catData.units.map(u=>`<option value="${u}">${u}</option>`).join('');
  fromSel.innerHTML = opts; toSel.innerHTML = opts;
  toSel.selectedIndex = 1;
  convCalc();
}
function convCalc() {
  const val = +g('conv-input')?.value;
  const from = g('conv-from')?.value;
  const to = g('conv-to')?.value;
  const cat = CONV_CATS[convCurrentCat];
  if (!cat || isNaN(val) || !from || !to) return;
  let result;
  if (cat.special && convCurrentCat === 'temp') {
    // Temperature special conversion
    let celsius;
    if (from === '°C') celsius = val;
    else if (from === '°F') celsius = (val - 32) * 5/9;
    else celsius = val - 273.15;
    if (to === '°C') result = celsius;
    else if (to === '°F') result = celsius * 9/5 + 32;
    else result = celsius + 273.15;
  } else {
    const toBase = val * (cat.factors[from]||1);
    result = toBase / (cat.factors[to]||1);
  }
  const formatted = Math.abs(result) < 0.001 && result !== 0 ? result.toExponential(4) : +result.toFixed(6);
  const resEl = g('conv-result');
  if (resEl) resEl.textContent = `${formatted} ${to}`;
  g('conv-formula').textContent = `${val} ${from} = ${formatted} ${to}`;
  // All conversions table
  renderConvAll(val, from, cat);
}
function renderConvAll(val, from, cat) {
  const el = g('conv-all'); if (!el) return;
  el.innerHTML = cat.units.map(u => {
    let res;
    if (cat.special && convCurrentCat === 'temp') {
      let c = from==='°C'?val:from==='°F'?(val-32)*5/9:val-273.15;
      res = u==='°C'?c:u==='°F'?c*9/5+32:c+273.15;
    } else {
      res = val * (cat.factors[from]||1) / (cat.factors[u]||1);
    }
    const fmt = Math.abs(res)<.0001&&res!==0?res.toExponential(3):+res.toFixed(6);
    return `<div class="conv-row"><span class="conv-unit">${u}</span><span class="conv-val">${fmt}</span></div>`;
  }).join('');
}
function convSwap() {
  const f = g('conv-from'), t = g('conv-to');
  if (!f||!t) return;
  const tmp = f.value; f.value = t.value; t.value = tmp;
  convCalc();
}

