/* ── ICS EXPORT/IMPORT (Google Calendar / Outlook / Apple Calendar compatible) ── */
function icsDate(dateStr, timeStr, allDay){
  const d = dateStr.replace(/-/g,'');
  if (allDay || !timeStr) return d;
  return d + 'T' + timeStr.replace(':','') + '00';
}
function exportICS(){
  const events = DB.calendar?.events || [];
  let out = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Scholr//EN\r\nCALSCALE:GREGORIAN\r\n';
  events.forEach(ev=>{
    out += 'BEGIN:VEVENT\r\n';
    out += 'UID:'+ev.id+'@scholr\r\n';
    out += (ev.allDay ? 'DTSTART;VALUE=DATE:'+icsDate(ev.startDate,null,true) : 'DTSTART:'+icsDate(ev.startDate,ev.startTime))+'\r\n';
    const endDate = ev.endDate || ev.startDate;
    out += (ev.allDay ? 'DTEND;VALUE=DATE:'+icsDate(endDate,null,true) : 'DTEND:'+icsDate(endDate,ev.endTime||ev.startTime))+'\r\n';
    out += 'SUMMARY:'+(ev.title||'').replace(/,/g,'\\,')+'\r\n';
    if (ev.description) out += 'DESCRIPTION:'+ev.description.replace(/\n/g,'\\n').replace(/,/g,'\\,')+'\r\n';
    if (ev.location) out += 'LOCATION:'+ev.location.replace(/,/g,'\\,')+'\r\n';
    if (ev.repeat && ev.repeat!=='none') {
      const freqMap = {daily:'DAILY',weekly:'WEEKLY',biweekly:'WEEKLY',monthly:'MONTHLY',yearly:'YEARLY',custom:(ev.customPeriod||'week').toUpperCase()+'LY'};
      let rrule = 'FREQ='+(freqMap[ev.repeat]||'WEEKLY');
      if (ev.repeat==='biweekly') rrule += ';INTERVAL=2';
      else if (ev.repeat==='custom' && ev.customFreq>1) rrule += ';INTERVAL='+ev.customFreq;
      if (ev.repeatEnd) rrule += ';UNTIL='+icsDate(ev.repeatEnd,null,true);
      out += 'RRULE:'+rrule+'\r\n';
    }
    out += 'END:VEVENT\r\n';
  });
  out += 'END:VCALENDAR\r\n';
  const blob = new Blob([out], {type:'text/calendar'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'scholr-calendar-'+new Date().toISOString().slice(0,10)+'.ics';
  a.click(); logDataEvent('Exported calendar', events.length+' events as .ics'); toast('Calendar exported — import this .ics into Google Calendar, Outlook, or Apple Calendar');
}
function importICS(){
  const inp = document.createElement('input'); inp.type='file'; inp.accept='.ics,text/calendar'; inp.style.display='none';
  document.body.appendChild(inp);
  inp.onchange = e => {
    const f = e.target.files[0]; if (!f) { inp.remove(); return; }
    const r = new FileReader();
    r.onload = ev => {
      try {
        // RFC5545 line folding: continuation lines start with a space or tab — unfold them first,
        // and normalize all line-ending styles so exports from any calendar app parse consistently.
        const text = ev.target.result.replace(/\r\n[ \t]/g,'').replace(/\n[ \t]/g,'').replace(/\r\n/g,'\n');
        const blocks = text.split('BEGIN:VEVENT').slice(1);
        if (!blocks.length) { toast('No events found in that file'); inp.remove(); return; }
        if (!DB.calendar) DB.calendar = buildDefaultCalendar();
        if (!DB.calendar.events) DB.calendar.events = [];
        const targetCal = (DB.calendar.cals||[]).find(c=>c.id==='personal') || (DB.calendar.cals||[])[0];
        const targetCalId = targetCal ? targetCal.id : 'personal';
        let added = 0, skipped = 0;
        blocks.forEach(block => {
          // Strip VALARM sub-blocks (reminders) so their own DESCRIPTION/etc. lines
          // can't get mistaken for the event's own properties.
          block = block.replace(/BEGIN:VALARM[\s\S]*?END:VALARM/g, '');
          const get = (key) => { const m = block.match(new RegExp(key+'[^:\\n]*:([^\\n]+)')); return m ? m[1].trim() : ''; };
          const dtstartRaw = get('DTSTART');
          if (!dtstartRaw) { skipped++; return; } // truly unusable without a start date
          const summary = get('SUMMARY').replace(/\\,/g,',').replace(/\\n/g,'\n') || '(Untitled event)';
          const dtendRaw = get('DTEND');
          const allDay = !dtstartRaw.includes('T');
          // Convert to local date/time properly — a UTC ("Z") timestamp read as literal
          // local time can land on the wrong calendar day entirely (e.g. an 11pm-local
          // evening event stored as past-midnight UTC), which was the alignment bug.
          const pad = n => String(n).padStart(2,'0');
          const parseDT = (raw) => {
            if (!raw.includes('T')) return { d: `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`, t:'' };
            const y=+raw.slice(0,4), mo=+raw.slice(4,6)-1, d=+raw.slice(6,8), hh=+raw.slice(9,11), mm=+raw.slice(11,13), ss=+raw.slice(13,15)||0;
            const dt = raw.endsWith('Z') ? new Date(Date.UTC(y,mo,d,hh,mm,ss)) : new Date(y,mo,d,hh,mm,ss);
            return { d: `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`, t: `${pad(dt.getHours())}:${pad(dt.getMinutes())}` };
          };
          const toISO = (raw) => { const y=raw.slice(0,4), mo=raw.slice(4,6), d=raw.slice(6,8); return `${y}-${mo}-${d}`; };
          const startParsed = parseDT(dtstartRaw);
          const endParsed = dtendRaw ? parseDT(dtendRaw) : startParsed;

          // Parse RRULE (recurring events) so the full series carries over, not just one instance
          let repeat = 'none', repeatEnd = '', customFreq = 1, customPeriod = 'week';
          const rruleRaw = get('RRULE');
          if (rruleRaw) {
            const parts = {};
            rruleRaw.split(';').forEach(kv => { const [k,v] = kv.split('='); if (k) parts[k]=v; });
            const freq = (parts.FREQ||'').toUpperCase();
            const interval = parseInt(parts.INTERVAL) || 1;
            const freqToPeriod = {DAILY:'day', WEEKLY:'week', MONTHLY:'month', YEARLY:'year'};
            customPeriod = freqToPeriod[freq] || 'week';
            customFreq = interval;
            if (freq==='DAILY' && interval===1) repeat='daily';
            else if (freq==='WEEKLY' && interval===1) repeat='weekly';
            else if (freq==='WEEKLY' && interval===2) repeat='biweekly';
            else if (freq==='MONTHLY' && interval===1) repeat='monthly';
            else if (freq==='YEARLY' && interval===1) repeat='yearly';
            else if (freq) repeat='custom';
            if (parts.UNTIL) {
              repeatEnd = toISO(parts.UNTIL);
            } else if (parts.COUNT) {
              // Approximate an end date from COUNT occurrences since Scholr stores an end date, not a count
              const n = parseInt(parts.COUNT) || 1;
              const startD = new Date(startParsed.d);
              const endD = new Date(startD);
              if (customPeriod==='day') endD.setDate(endD.getDate() + n*customFreq);
              else if (customPeriod==='week') endD.setDate(endD.getDate() + n*customFreq*7);
              else if (customPeriod==='month') endD.setMonth(endD.getMonth() + n*customFreq);
              else endD.setFullYear(endD.getFullYear() + n*customFreq);
              repeatEnd = endD.toISOString().slice(0,10);
            }
          }

          DB.calendar.events.push({
            id: 'ics'+Date.now()+Math.random().toString(36).slice(2,6),
            title: summary, allDay,
            startDate: startParsed.d,
            endDate: endParsed.d,
            startTime: startParsed.t, endTime: endParsed.t,
            repeat, repeatEnd, customFreq, customPeriod,
            location: get('LOCATION').replace(/\\,/g,','),
            description: get('DESCRIPTION').replace(/\\,/g,',').replace(/\\n/g,'\n'),
            calId: targetCalId, color: '', notif: 'none', status: 'free', visibility: 'public',
            created: new Date().toISOString()
          });
          added++;
        });
        save(); renderCalendar();
        if (added) logDataEvent('Imported calendar', added+' event(s) from '+f.name);
        toast(added ? `${added} event(s) imported${skipped?` (${skipped} skipped — no date)`:''}!` : 'No valid events found in that file');
      } catch(err) { toast('Could not read that .ics file — '+err.message); }
      inp.remove();
    };
    r.readAsText(f);
  };
  inp.click();
}
function getEventOccurrences(ev, rangeStart, rangeEnd) {
  const results = [];
  const start = new Date(ev.startDate);
  const end = rangeEnd || new Date(new Date().getFullYear()+1, 11, 31);
  const rStart = rangeStart || new Date(new Date().getFullYear()-1, 0, 1);

  if (!ev.repeat || ev.repeat === 'none') {
    if (start >= rStart && start <= end) results.push(new Date(start));
    return results;
  }

  const repeatEnd = ev.repeatEnd ? new Date(ev.repeatEnd) : new Date(new Date().getFullYear()+2, 11, 31);
  const isCustom = ev.repeat === 'custom';
  const freq = isCustom ? (ev.customFreq || 1) : 1;
  const period = isCustom ? (ev.customPeriod || 'week') : (ev.repeat === 'daily' ? 'day' : ev.repeat === 'weekly' ? 'week' : ev.repeat === 'biweekly' ? 'week' : ev.repeat === 'monthly' ? 'month' : 'year');
  const biweeklyFactor = ev.repeat === 'biweekly' ? 2 : 1;

  let cur = new Date(start);
  let safety = 0;
  while (cur <= end && cur <= repeatEnd && safety < 1000) {
    safety++;
    if (cur >= rStart) results.push(new Date(cur));
    if (period === 'day') cur.setDate(cur.getDate() + freq);
    else if (period === 'week') cur.setDate(cur.getDate() + freq * 7 * biweeklyFactor);
    else if (period === 'month') cur.setMonth(cur.getMonth() + freq);
    else cur.setFullYear(cur.getFullYear() + freq);
  }
  return results;
}

