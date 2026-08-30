
document.addEventListener('DOMContentLoaded',function(){
  if(!document.getElementById('split-ov')){
    const ov=document.createElement('div');ov.id='split-ov';
    ov.innerHTML=`<div class="split-top">
          <div class="split-ctrl">
          <button class="btn bo xs" onclick="setSplitSize(35)">35</button>
          <button class="btn bo xs" onclick="setSplitSize(50)">50</button>
          <button class="btn bo xs" onclick="setSplitSize(65)">65</button>
          <button class="btn bo xs" onclick="splitSwap()">⇄ Swap</button>
          <button class="btn bo xs" onclick="setSplitEmbed('desmos')">Desmos</button>
          <button class="btn bo xs" onclick="setSplitEmbed('geogebra')">GeoGebra</button>
          <button class="btn bo xs" onclick="setSplitEmbed('calendar')">Calendar</button>
          <button class="btn bo xs" onclick="toggleSplitWide()">Wider embeds</button>
          <button class="btn bo xs" onclick="toggleCustomCursor()">Cursor</button>
          <button class="btn bd xs" onclick="closeSplit()">Close</button>
        </div>
      </div>
      <div class="split-body">
        <div id="split-left" class="split-pane" style="width:55%"></div>
        <div id="split-resizer" class="split-resizer" role="separator" aria-orientation="vertical"></div>
        <div id="split-right" class="split-pane" style="width:45%"></div>
      </div>`;
    document.body.appendChild(ov);
  }

  window._splitEmbed = 'desmos';
  window.openSplit = function(rightType){
    const ov=document.getElementById('split-ov');
    const left=document.getElementById('split-left');
    const right=document.getElementById('split-right');
    // copy main content into left pane
    const main = document.querySelector('.ps');
    left.innerHTML = main ? main.innerHTML : '<div style="padding:14px">No main content</div>';
    // choose embed
    const type = rightType || window._splitEmbed || 'desmos';
    setSplitEmbed(type);
    ov.classList.add('on'); document.body.style.overflow='hidden';
  };

  window.setSplitEmbed = function(type){
    window._splitEmbed = type;
    const right=document.getElementById('split-right'); if(!right) return;
    right.classList.remove('wide');
    const urls = { desmos:'https://www.desmos.com/calculator', gcal:'https://calendar.google.com/calendar/embed?mode=WEEK', quizlet:'https://quizlet.com/', geogebra:'https://www.geogebra.org/graphing' };
    // build container with iframe + fallback area
    if(type==='calendar'){
      const cal = document.getElementById('cal-grid');
      const localHtml = cal ? cal.cloneNode(true).outerHTML : '<div style="padding:14px">Calendar not found</div>';
      right.innerHTML = `
        <div style="display:flex;flex-direction:column;height:100%">
          <div style="padding:10px;display:flex;gap:8px;align-items:center">
            <button class="btn bo xs" onclick="(function(){const r=document.getElementById('split-right'); r.querySelector('.cal-local').style.display='block'; r.querySelector('.cal-gcal').style.display='none';})()">Local</button>
            <button class="btn bo xs" onclick="(function(){const r=document.getElementById('split-right'); r.querySelector('.cal-local').style.display='none'; r.querySelector('.cal-gcal').style.display='block';})()">Google Calendar</button>
            <a class="btn bp xs" href="${urls.gcal}" target="_blank" rel="noopener">Open Google Calendar</a>
          </div>
          <div style="flex:1;overflow:auto">
            <div class="cal-local" style="height:100%">${localHtml}</div>
            <div class="cal-gcal" style="display:none;height:100%"><iframe src="${urls.gcal}" style="width:100%;height:100%;border:0"></iframe></div>
          </div>
        </div>`;
      return;
    }
    if(type==='embed-frame'){
      const ef = document.getElementById('embed-frame'); right.innerHTML = ef ? ef.outerHTML : '<div style="padding:14px">Embed not ready</div>';
      return;
    }
    if(!urls[type]){ right.innerHTML = '<div style="padding:14px">Unknown source</div>'; return; }
    // default: insert iframe and handle valid browsers without falsely flagging cross-origin pages as blocked
    right.innerHTML = `<div style="position:relative;height:100%"><iframe id="split-embed-iframe" src="${urls[type]||''}" style="width:100%;height:100%;border:0" allowfullscreen loading="lazy"></iframe><div id="split-embed-fallback" style="display:none;position:absolute;inset:0;background:var(--sur);padding:18px;box-sizing:border-box"></div></div>`;
    const ifr = document.getElementById('split-embed-iframe');
    const fb = document.getElementById('split-embed-fallback');
    if (ifr) {
      ifr.addEventListener('load', function(){
        if (fb) fb.style.display='none';
        ifr.style.display='block';
      }, { once: true });
      ifr.addEventListener('error', function(){
        if (fb) {
          fb.style.display='block';
          fb.innerHTML = `<div style="font-size:28px">🔒</div><div style="font-weight:700">${type} could not be embedded</div><div style="color:var(--ink4)">Open in a new tab to use the site.</div><div style="margin-top:10px"><a class="btn bp sm" href="${urls[type]}" target="_blank" rel="noopener">Open ${type} in new tab →</a></div>`;
        }
        ifr.style.display='none';
      }, { once: true });
    }
  };

  window.toggleSplitWide = function(){const right=document.getElementById('split-right'); if(!right) return; right.classList.toggle('wide');};
  window.toggleCustomCursor = function(){document.body.classList.toggle('use-custom-cursor');};

  

  

  window.closeSplit = function(){const ov=document.getElementById('split-ov'); if(ov) ov.classList.remove('on'); document.body.style.overflow='';};
  window.splitSwap = function(){const L=document.getElementById('split-left'), R=document.getElementById('split-right'); [L.innerHTML,R.innerHTML]=[R.innerHTML,L.innerHTML];};
  window.setSplitSize = function(p){const L=document.getElementById('split-left'), R=document.getElementById('split-right'); L.style.width = p+'%'; R.style.width = (100-p)+'%';};

  // resizer drag
  (function(){
    const res = document.getElementById('split-resizer'); if(!res) return; let dragging=false;
    res.addEventListener('mousedown', function(e){ dragging=true; document.body.classList.add('no-select');});
    document.addEventListener('mouseup', function(){ dragging=false; document.body.classList.remove('no-select');});
    document.addEventListener('mousemove', function(e){ if(!dragging) return; const ov=document.getElementById('split-ov'); const rect=ov.getBoundingClientRect(); let p = ((e.clientX-rect.left)/rect.width)*100; p=Math.max(10,Math.min(90,p)); setSplitSize(p); });
  })();

  window.openDesmos = function(){ if(typeof go==='function'){ go('desmos'); } else { openSplit('desmos'); }};
});
