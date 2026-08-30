/* ═══════════════════════════════════════════════════
   FOCUS MODE
═══════════════════════════════════════════════════ */
function toggleFocus() {
  const ov = g('focus-overlay');
  if (!ov) return;
  pomState.focusOpen = !pomState.focusOpen;
  ov.style.display = pomState.focusOpen ? 'flex' : 'none';
  if (pomState.focusOpen) {
    pomRenderDots(); pomUpdateDisplay();
    // Auto-start the timer the moment Focus Mode opens (unless it's already
    // running, or the user has switched Auto-start to Manual in settings).
    if (!pomState.running && DB.pomodoro.auto) pomStart(true);
  }
  else {
    stopAmbient(); // leaving focus mode: kill any playing ambient sound
    if (pomState.running) pomStop(); // ...and stop the session timer itself, not just hide it
  }
}
let ambCtx = null;
function stopAmbient() {
  if (ambCtx) {
    if (ambCtx._lofiInterval) clearInterval(ambCtx._lofiInterval);
    try { ambCtx.close(); } catch(e) {}
    ambCtx = null;
  }
  document.querySelectorAll('.amb-btn').forEach(b => b.classList.remove('on'));
}
function toggleAmbient(type) {
  // Simple oscillator-based ambient noise (plus a generative lofi beat option)
  const btn = g('amb-' + type);
  const wasSameType = ambCtx && ambCtx._type === type;
  stopAmbient();
  if (wasSameType) return; // clicking the currently-playing sound again just turns it off
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    ctx._type = type;
    if (type === 'lofi') {
      startLofiBeat(ctx);
      ambCtx = ctx;
      if (btn) btn.classList.add('on');
      return;
    }
    const bufLen = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = type === 'white' ? 'allpass' : type === 'rain' ? 'highpass' : type === 'nature' ? 'bandpass' : 'lowpass';
    filter.frequency.value = type === 'cafe' ? 800 : type === 'rain' ? 2000 : 600;
    gain.gain.value = type === 'white' ? 0.05 : 0.08;
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    src.start(); ambCtx = ctx;
    if (btn) btn.classList.add('on');
  } catch(e) { toast('Audio not supported in this browser'); }
}

/* Generative lo-fi beat: soft chord pad (Am7 → Fmaj7 → Cmaj7 → G7) over a
   laid-back kick/hat/snare pattern, plus a little vinyl crackle for texture.
   Everything is scheduled ahead of time against ctx.currentTime so it stays
   in the pocket, and the whole thing tears down via clearInterval + ctx.close(). */
function startLofiBeat(ctx) {
  const bpm = 78;
  const secPerBeat = 60 / bpm;
  const master = ctx.createGain();
  master.gain.value = 0.32;
  master.connect(ctx.destination);

  // vinyl crackle bed
  const cLen = ctx.sampleRate * 2;
  const cBuf = ctx.createBuffer(1, cLen, ctx.sampleRate);
  const cData = cBuf.getChannelData(0);
  for (let i = 0; i < cLen; i++) cData[i] = (Math.random() * 2 - 1) * (Math.random() < 0.02 ? 1 : 0.12);
  const cSrc = ctx.createBufferSource();
  cSrc.buffer = cBuf; cSrc.loop = true;
  const cFilter = ctx.createBiquadFilter();
  cFilter.type = 'highpass'; cFilter.frequency.value = 2500;
  const cGain = ctx.createGain(); cGain.gain.value = 0.02;
  cSrc.connect(cFilter); cFilter.connect(cGain); cGain.connect(master);
  cSrc.start();

  // chord progression: Am7, Fmaj7, Cmaj7, G7 (one bar each)
  const chords = [
    [220.00, 261.63, 329.63, 392.00],
    [174.61, 220.00, 261.63, 349.23],
    [261.63, 329.63, 392.00, 493.88],
    [196.00, 246.94, 293.66, 349.23],
  ];

  function playPad(freqs, time, dur) {
    freqs.forEach(f => {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 1100;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(0.045, time + 0.5);
      g.gain.linearRampToValueAtTime(0, time + dur);
      o.connect(filt); filt.connect(g); g.connect(master);
      o.start(time); o.stop(time + dur + 0.05);
    });
  }
  function playKick(time) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, time);
    o.frequency.exponentialRampToValueAtTime(45, time + 0.15);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    o.connect(g); g.connect(master);
    o.start(time); o.stop(time + 0.3);
  }
  function playHat(time, vel) {
    const len = Math.floor(ctx.sampleRate * 0.05);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const filt = ctx.createBiquadFilter(); filt.type = 'highpass'; filt.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime((vel || 0.06), time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    src.connect(filt); filt.connect(g); g.connect(master);
    src.start(time);
  }
  function playSnare(time) {
    const len = Math.floor(ctx.sampleRate * 0.15);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const filt = ctx.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 1800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.14, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    src.connect(filt); filt.connect(g); g.connect(master);
    src.start(time);
  }

  let barIndex = 0, beatIndex = 0;
  let nextNoteTime = ctx.currentTime + 0.1;
  const scheduleAhead = 0.2;

  function scheduler() {
    while (nextNoteTime < ctx.currentTime + scheduleAhead) {
      if (beatIndex === 0) playPad(chords[barIndex % chords.length], nextNoteTime, secPerBeat * 4 * 0.95);
      if (beatIndex === 0 || beatIndex === 2) playKick(nextNoteTime);
      if (beatIndex === 2) playSnare(nextNoteTime);
      playHat(nextNoteTime, 0.06);
      playHat(nextNoteTime + secPerBeat / 2, 0.035); // swung offbeat
      nextNoteTime += secPerBeat;
      beatIndex++;
      if (beatIndex >= 4) { beatIndex = 0; barIndex++; }
    }
  }
  scheduler();
  ctx._lofiInterval = setInterval(scheduler, 50);
}

