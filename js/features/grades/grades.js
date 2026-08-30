/* ── HW EDIT ── */
function editHW(id){
  const h=DB.hw.find(x=>x.id===id); if(!h) return;
  populateSels();
  setValue('hwe-id',id); setValue('hwe-ti',h.title); setValue('hwe-no',h.notes||'');
  setValue('hwe-du',h.due||''); setValue('hwe-link',h.link||'');
  clearHWFields('hwe-fields'); (h.fields||[]).forEach(f=>addHWField('hwe-fields',f.k,f.v));
  setSel('hwe-co',h.course); setSel('hwe-pr',h.priority); setSel('hwe-status',h.status);
  const co=g('hwe-co'); if(co){co.innerHTML=DB.courses.map(c=>`<option>${c.name}</option>`).join('');setSel('hwe-co',h.course);}
  showMo('mo-hw-edit');
}
function saveHWEdit(){
  const id=g('hwe-id')?.value; if(!id) return;
  const h=DB.hw.find(x=>x.id===id); if(!h) return;
  h.title=g('hwe-ti').value||h.title;
  h.course=g('hwe-co').value; h.link=g('hwe-link').value.trim();
  h.due=g('hwe-du').value; h.priority=g('hwe-pr').value;
  h.notes=g('hwe-no').value; h.status=g('hwe-status').value;
  h.fields=collectHWFields('hwe-fields');
  save(); closeMo('mo-hw-edit'); renderHW(); renderDashboard(); updateBadge(); toast('Assignment updated!');
}
