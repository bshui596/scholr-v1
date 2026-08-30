/* ── DUE-DATE REMINDERS ──────────────────────────────────────────
   Refreshes the notification center every boot (cheap + deduped),
   but the toast/browser-notification nag only fires once per
   calendar day (tracked via DB.lastReminderDate) so it never nags
   more than once. In-app toast always works; browser notifications
   are opt-in via notifyEnable() since auto-prompting for permission
   on load is bad UX and often gets auto-denied. ── */
function checkDueReminders(){
  generateNotifs(); save(); renderNotifCenter();
  const today = new Date().toISOString().slice(0,10);
  if (DB.lastReminderDate === today) return;
  DB.lastReminderDate = today; save();
  const pending = (DB.hw||[]).filter(h=>h.status!=='done' && h.due);
  const overdue = pending.filter(h=>dLeft(h.due)<0);
  const dueToday = pending.filter(h=>dLeft(h.due)===0);
  if (!overdue.length && !dueToday.length) return;
  const parts = [];
  if (dueToday.length) parts.push(`${dueToday.length} due today`);
  if (overdue.length) parts.push(`${overdue.length} overdue`);
  const msg = `📌 ${parts.join(' · ')}`;
  toast(msg);
  if ('Notification' in window && Notification.permission === 'granted') {
    requestIdleCallback(() => {
      try { new Notification('Scholr', { body: msg, icon: '📗', tag: 'due-reminder', requireInteraction: false }); } catch(e) {}
    }, { timeout: 100 });
  }
}
function notifyEnable(){
  if (!('Notification' in window)) { toast('Notifications not supported in this browser'); return; }
  if (Notification.permission === 'granted') { toast('Reminders already enabled'); return; }
  Notification.requestPermission().then(p => {
    toast(p === 'granted' ? '🔔 Reminders enabled' : 'Reminders blocked — you can re-enable in browser settings');
  });
}

