/* ── TABLE INSERT ── */
function insTbl(){
  const rows=+g('tbl-r').value||3, cols=+g('tbl-c').value||3, hdr=g('tbl-h').value==='yes', sty=g('tbl-s').value;
  const cls = 'ed-tbl' + (sty==='striped'?' ed-tbl-striped':sty==='minimal'?' ed-tbl-minimal':'');
  const colW = (100/cols).toFixed(3)+'%';
  let html=`<table class="${cls}"><colgroup>`+`<col style="width:${colW}">`.repeat(cols)+`</colgroup>`;
  if(hdr){html+=`<thead><tr>`;for(let c=0;c<cols;c++)html+=`<th contenteditable="true">Header ${c+1}</th>`;html+=`</tr></thead>`;}
  html+=`<tbody>`;
  for(let r=0;r<(rows-(hdr?1:0));r++){html+=`<tr>`;for(let c=0;c<cols;c++)html+=`<td contenteditable="true"></td>`;html+=`</tr>`;}
  html+=`</tbody></table><p></p>`;
  g('doc-ed').focus(); document.execCommand('insertHTML',false,html); closeMo('mo-tbl'); touch();
}

/* ── CHART INSERT ── */
function pickCT(btn,t){document.querySelectorAll('.ct-btn').forEach(b=>b.classList.remove('on'));btn.classList.add('on');cType=t;}
function insChart(){
  const title=g('c-ti').value||'Chart';
  const labels=(g('c-lb').value||'A,B,C,D').split(',').map(s=>s.trim());
  const vals=(g('c-v1').value||'85,72,91,68').split(',').map(s=>parseFloat(s)||0);
  const v2r=(g('c-v2')?.value||'').trim();
  const col1=g('c-col1')?.value||'#0F6B30';
  const col2=g('c-col2')?.value||'#1D4ED8';
  const l1=g('c-l1')?.value||title;
  const l2=g('c-l2')?.value||'Series 2';
  const height=g('c-h')?.value||220;
  const bgMode=g('c-bg')?.value||'card';
  const showLeg=g('c-leg')?.value!=='0';
  const fillArea=g('c-fill')?.value==='1';
  const id='ch'+Date.now();
  const isPie=['pie','doughnut','polarArea'].includes(cType);
  // Beautiful color palette for pie charts
  const piePal=[col1,'#1D4ED8','#6D28D9','#BE185D','#B45309','#0F766E','#374151','#C05418'];
  const bgMain=col1+'99', bdMain=col1;
  const bg2=col2+'99', bd2=col2;
  const ds=[{
    label:l1,data:vals,
    backgroundColor:isPie?piePal.slice(0,vals.length).map(p=>p+'CC'):bgMain,
    borderColor:isPie?piePal.slice(0,vals.length):bdMain,
    borderWidth:isPie?2:2,tension:.4,fill:fillArea,
    pointBackgroundColor:bdMain,pointRadius:4,pointHoverRadius:6,
    borderRadius:cType==='bar'?6:0,
  }];
  if(v2r){
    const v2=v2r.split(',').map(s=>parseFloat(s)||0);
    ds.push({label:l2,data:v2,backgroundColor:bg2,borderColor:bd2,borderWidth:2,tension:.4,fill:fillArea,pointBackgroundColor:bd2,pointRadius:4,pointHoverRadius:6,borderRadius:cType==='bar'?6:0});
  }
  const bgStyle = bgMode==='dark'?'background:#111;color:#eee':'background:var(--sur)';
  const titleStyle = bgMode==='dark'?'color:#eee':'color:var(--ink)';
  const htmlChunk=`<div data-chart="1" style="border:1px solid var(--bor);border-radius:12px;padding:16px 18px;margin:12px 0;${bgStyle};box-shadow:var(--sh2)"><div style="font-weight:700;font-size:13px;margin-bottom:10px;${titleStyle}">${title}</div><canvas id="${id}" height="${height}"></canvas></div><p></p>`;
  g('doc-ed').focus();
  document.execCommand('insertHTML',false,htmlChunk);
  closeMo('mo-cht');
  setTimeout(()=>{
    const cv=document.getElementById(id); if(!cv) return;
    const isDark=bgMode==='dark';
    const gridCol=isDark?'rgba(255,255,255,.1)':'rgba(0,0,0,.07)';
    const textCol=isDark?'#aaa':'#666';
    new Chart(cv.getContext('2d'),{
      type:cType,
      data:{labels,datasets:ds},
      options:{
        responsive:true,
        animation:{duration:800,easing:'easeOutQuart'},
        plugins:{
          legend:{display:showLeg,labels:{color:textCol,font:{size:11},padding:14,usePointStyle:true}},
          tooltip:{backgroundColor:'rgba(0,0,0,.8)',titleColor:'#fff',bodyColor:'#ddd',cornerRadius:8,padding:10}
        },
        scales:isPie?{}:{
          y:{beginAtZero:true,grid:{color:gridCol},ticks:{color:textCol,font:{size:11}}},
          x:{grid:{color:'transparent'},ticks:{color:textCol,font:{size:11}}}
        }
      }
    });
    touch();
  },100);
}

