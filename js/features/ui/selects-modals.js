/* ── RUBRIC ── */
function renderRubric(){
  const cont=g('rubric-g'); if(!cont) return;
  cont.innerHTML='';
  const grades=['Level 1','Level 2','Level 3','Level 4'];
  const criteria=['Knowledge','Understanding','Application','Communication'];
  const head = `<div class="card"><table class="gb-tbl" style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:12px 10px;background:rgba(15,23,42,.05)"></th>${grades.map(g=>`<th style="padding:12px 10px;background:rgba(15,23,42,.05)">${g}</th>`).join('')}</tr></thead><tbody>`;
  const body = criteria.map(r=>`<tr><th style="padding:10px 10px;background:rgba(226,232,240,.35);text-align:left">${r}</th>${grades.map(()=>`<td contenteditable="true" style="min-height:56px;padding:10px;border:1px solid rgba(148,163,184,.25);vertical-align:top">Describe performance</td>`).join('')}</tr>`).join('');
  cont.innerHTML=head + body + '</tbody></table></div>';
}
function insRubric(){
  const html=`<div style="margin:16px 0;padding:14px;border:1px solid rgba(148,163,184,.35);border-radius:var(--rad);background:var(--bg2);font-size:13px"><div style="font-weight:700;margin-bottom:10px">Rubric</div><table style="width:100%;border-collapse:collapse"><thead><tr><th style="padding:10px 8px;text-align:left;border-bottom:1px solid rgba(148,163,184,.35)"></th><th style="padding:10px 8px;text-align:left;border-bottom:1px solid rgba(148,163,184,.35)">Level 1</th><th style="padding:10px 8px;text-align:left;border-bottom:1px solid rgba(148,163,184,.35)">Level 2</th><th style="padding:10px 8px;text-align:left;border-bottom:1px solid rgba(148,163,184,.35)">Level 3</th><th style="padding:10px 8px;text-align:left;border-bottom:1px solid rgba(148,163,184,.35)">Level 4</th></tr></thead><tbody>${['Knowledge','Understanding','Application','Communication'].map(r=>`<tr><th style="padding:10px 8px;text-align:left;border-bottom:1px solid rgba(148,163,184,.35)">${r}</th>`+['','','',''].map(()=>`<td contenteditable="true" style="padding:10px 8px;border-bottom:1px solid rgba(148,163,184,.35);vertical-align:top">Edit criterion</td>`).join('')+`</tr>`).join('')}</tbody></table></div><p></p>`;
  cmd('insertHTML', html);
}

