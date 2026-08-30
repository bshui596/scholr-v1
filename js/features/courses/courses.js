/* ── PROFILE ── */
function renderProfile() {
  const p = DB.p;
  g('u-name').textContent = p.name || 'Student';
  g('u-sub').textContent = `${p.grade} · ${(p.sem||'').replace('Semester ','')}`;
  document.querySelectorAll('.ava').forEach(a => {
    if (p.avatarImg) { a.innerHTML = `<img src="${p.avatarImg}"/>`; a.style.background='none'; }
    else { a.textContent = p.avatar||'🎓'; a.style.background=''; }
  });
}
function saveProfile() {
  const newName = g('s-name').value || DB.p.name;
  const newSchool = g('s-school').value;
  const newTpl = g('s-tpl').value;
  const newGrade = g('s-grade').value;
  const newSem = g('s-sem').value;
  const switching = DB.p.grade && (newGrade !== DB.p.grade || newSem !== DB.p.sem);

  const applyNonAcademicFields = () => { DB.p.name = newName; DB.p.school = newSchool; DB.p.tpl = newTpl; };

  if (switching) {
    showConfirm(
      `Switching to ${newGrade} · ${newSem} will save (archive) your current courses, notes, homework and grades, then start a clean workspace for the new semester. You can come back to ${DB.p.grade} · ${DB.p.sem} anytime from the Semester History list below. Continue?`,
      () => {
        archiveAndSwitchSemester(newGrade, newSem);
        applyNonAcademicFields();
        save(); renderAll(); toast('Switched semester — previous work archived!');
      },
      'Switch & Archive'
    );
  } else {
    DB.p.grade = newGrade; DB.p.sem = newSem;
    applyNonAcademicFields();
    save(); renderAll(); toast('Profile saved!');
  }
}
function pickAv(emoji) {
  DB.p.avatar = emoji; DB.p.avatarImg = ''; save(); renderProfile();
  document.querySelectorAll('.ava-opt').forEach(o => o.classList.toggle('on', o.dataset.av===emoji));
}
function uploadAv() {
  const i = document.createElement('input'); i.type='file'; i.accept='image/*';
  i.onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => { DB.p.avatarImg = ev.target.result; DB.p.avatar=''; save(); renderProfile(); toast('Avatar updated!'); };
    r.readAsDataURL(f);
  };
  i.click();
}

