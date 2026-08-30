/* ── COLORED BOX INSERT ── */
function insColorBox(){
  const colors=[
    {bg:'#DBEAFE',bo:'#3B82F6',tx:'#1E40AF',name:'Blue'},
    {bg:'#D1FAE5',bo:'#10B981',tx:'#065F46',name:'Green'},
    {bg:'#FEE2E2',bo:'#EF4444',tx:'#991B1B',name:'Red'},
    {bg:'#FEF3C7',bo:'#F59E0B',tx:'#92400E',name:'Yellow'},
    {bg:'#EDE9FE',bo:'#8B5CF6',tx:'#4C1D95',name:'Purple'},
    {bg:'#FCE7F3',bo:'#EC4899',tx:'#9D174D',name:'Pink'},
    {bg:'#F3F4F6',bo:'#6B7280',tx:'#111827',name:'Gray'},
    {bg:'#FFF7ED',bo:'#F97316',tx:'#9A3412',name:'Orange'},
  ];
  showMo('mo-cbox');
  const grid=g('cbox-grid');
  if(grid) grid.innerHTML=colors.map(col=>
    `<div onclick="insColorBoxColor('${col.bg}','${col.bo}','${col.tx}')" style="padding:10px 14px;background:${col.bg};border:2px solid ${col.bo};border-radius:8px;cursor:pointer;color:${col.tx};font-weight:700;font-size:12px;transition:transform .1s" onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform=''">${col.name}</div>`
  ).join('');
}
function insColorBoxColor(bg,bo,tx){
  cmd('insertHTML',`<div style="background:${bg};border:2px solid ${bo};border-radius:10px;padding:14px 18px;margin:12px 0;color:${tx}" contenteditable="true"><strong style="display:block;margin-bottom:4px">Title</strong><div style="font-size:13.5px;line-height:1.6">Type your content here…</div></div><p></p>`);
  closeMo('mo-cbox'); touch();
}
