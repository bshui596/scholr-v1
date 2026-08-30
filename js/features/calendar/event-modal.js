/* ── OPEN EVENT MODAL ── */
function calNewEvent() {
  const now = new Date();
  calOpenModal(null, now.toISOString().split('T')[0], `${String(now.getHours()).padStart(2,'0')}:00`);
}

function calOpenModal(evId, dateStr, timeStr) {
  // Populate calendar select
  const calSel = g('cal-ev-cal');
  calSel.innerHTML = (DB.calendar.cals||[]).map(c=>`<option value="${c.id}">${c.name}</option>`).join('');

  // Color swatches
  const cg = g('cal-ev-color-g');
  cg.innerHTML = CAL_COLORS.map(c=>`<div style="width:20px;height:20px;border-radius:50%;background:${c};cursor:pointer;border:2px solid transparent;transition:all .12s" onclick="calPickEvColor('${c}',this)" title="${c}"></div>`).join('');

  if (evId) {
    // Edit mode
    const ev = (DB.calendar.events||[]).find(e=>e.id===evId);
    if (!ev) return;
    setText('cal-mo-title','✏️ Edit Event');
    g('cal-ev-id').value = evId;
    g('cal-ev-title').value = ev.title || '';
    g('cal-ev-allday').checked = !!ev.allDay;
    calToggleAllDay(!!ev.allDay);
    g('cal-ev-sd').value = ev.startDate || '';
    g('cal-ev-ed').value = ev.endDate || ev.startDate || '';
    g('cal-ev-st').value = ev.startTime || '';
    g('cal-ev-et').value = ev.endTime || '';
    g('cal-ev-repeat').value = ev.repeat || 'none';
    calToggleRepeat(ev.repeat || 'none');
    if (ev.repeatEnd) g('cal-ev-repeat-end').value = ev.repeatEnd;
    if (ev.customFreq) g('cal-ev-freq').value = ev.customFreq;
    if (ev.customPeriod) g('cal-ev-period').value = ev.customPeriod;
    if (ev.customDays) {
      document.querySelectorAll('#cal-ev-days input').forEach(inp => {
        inp.checked = ev.customDays.includes(+inp.value);
      });
    }
    g('cal-ev-loc').value = ev.location || '';
    g('cal-ev-desc').value = ev.description || '';
    if (ev.calId) g('cal-ev-cal').value = ev.calId;
    g('cal-ev-notif').value = ev.notif || 'none';
    g('cal-ev-status').value = ev.status || 'busy';
    g('cal-ev-vis').value = ev.visibility || 'default';
    if (ev.color) {
      g('cal-ev-color').value = ev.color;
      cg.querySelectorAll('div').forEach(d=>{ if(d.title===ev.color) d.style.border='2px solid var(--ink)'; });
    }
    g('cal-ev-del-btn').style.display = '';
  } else {
    // New mode
    setText('cal-mo-title','🗓️ New Event');
    g('cal-ev-id').value = '';
    g('cal-ev-title').value = '';
    g('cal-ev-allday').checked = false;
    calToggleAllDay(false);
    g('cal-ev-sd').value = dateStr || '';
    g('cal-ev-ed').value = dateStr || '';
    g('cal-ev-st').value = timeStr || '';
    g('cal-ev-et').value = timeStr ? (()=>{ const [h,m]=timeStr.split(':').map(Number); return `${String(Math.min(h+1,23)).padStart(2,'0')}:${String(m).padStart(2,'0')}`; })() : '';
    g('cal-ev-repeat').value = 'none';
    calToggleRepeat('none');
    g('cal-ev-repeat-end').value = '';
    g('cal-ev-loc').value = '';
    g('cal-ev-desc').value = '';
    g('cal-ev-notif').value = 'none';
    g('cal-ev-status').value = 'busy';
    g('cal-ev-vis').value = 'default';
    g('cal-ev-color').value = '';
    g('cal-ev-del-btn').style.display = 'none';
  }
  showMo('mo-cal-event');
}

function calPickEvColor(color, el) {
  g('cal-ev-color').value = color;
  document.querySelectorAll('#cal-ev-color-g div').forEach(d=>d.style.border='2px solid transparent');
  el.style.border = '2px solid var(--ink)';
}

function calToggleAllDay(v) {
  g('cal-ev-st-wrap').style.display = v ? 'none' : '';
  g('cal-ev-et-wrap').style.display = v ? 'none' : '';
}

function calToggleRepeat(v) {
  const show = v !== 'none';
  g('cal-ev-repeat-end-wrap').style.display = show ? '' : 'none';
  g('cal-ev-custom-repeat').style.display = v === 'custom' ? '' : 'none';
}

function calSaveEvent() {
  const title = g('cal-ev-title').value.trim();
  if (!title) { toast('Enter event title!'); return; }
  const id = g('cal-ev-id').value;
  const ev = {
    id: id || 'cev'+Date.now(),
    title,
    allDay: g('cal-ev-allday').checked,
    startDate: g('cal-ev-sd').value,
    endDate: g('cal-ev-ed').value || g('cal-ev-sd').value,
    startTime: g('cal-ev-st').value,
    endTime: g('cal-ev-et').value,
    repeat: g('cal-ev-repeat').value,
    repeatEnd: g('cal-ev-repeat-end').value,
    customFreq: +g('cal-ev-freq').value||1,
    customPeriod: g('cal-ev-period').value,
    customDays: [...document.querySelectorAll('#cal-ev-days input:checked')].map(i=>+i.value),
    location: g('cal-ev-loc').value.trim(),
    description: g('cal-ev-desc').value.trim(),
    calId: g('cal-ev-cal').value || 'default',
    color: g('cal-ev-color').value || '',
    notif: g('cal-ev-notif').value,
    status: g('cal-ev-status').value,
    visibility: g('cal-ev-vis').value,
    created: id ? undefined : new Date().toISOString()
  };
  if (!DB.calendar.events) DB.calendar.events = [];
  if (id) {
    const idx = DB.calendar.events.findIndex(e=>e.id===id);
    if (idx>=0) { ev.created = DB.calendar.events[idx].created; DB.calendar.events[idx] = ev; }
  } else {
    DB.calendar.events.push(ev);
  }
  save(); closeMo('mo-cal-event'); renderCalendar();
  toast(id ? 'Event updated!' : 'Event created!');
}

function calDeleteEvent() {
  const id = g('cal-ev-id').value;
  if (!id) return;
  if (!confirm('Delete this event?')) return;
  DB.calendar.events = (DB.calendar.events||[]).filter(e=>e.id!==id);
  save(); closeMo('mo-cal-event'); renderCalendar(); toast('Event deleted');
}

