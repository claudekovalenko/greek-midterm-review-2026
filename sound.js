// Sound effects and background music, all synthesized with Web Audio, so
// there are no audio files to load. Browsers only allow sound after a tap,
// so nothing plays until the first one.

const Sound = (() => {
  let ctx, master, sfxBus, musicBus;
  let musicTimer = null, nextBar = 0, bar = 0;

  function init() {
    if (ctx) return ctx.state === "suspended" ? ctx.resume() : null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.5; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
  }

  // One enveloped note. type: oscillator shape; t: start time.
  function tone(freq, t, dur, { type = "sine", vol = 0.3, bus = sfxBus, attack = 0.01, slideTo } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.05);
  }

  const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  const sfx = {
    reveal() {
      const t = ctx.currentTime;
      tone(880, t, 0.12, { type: "triangle", vol: 0.15 });
    },
    // Rises a step with each answer in a row, so a streak sounds like one.
    got(streak = 1) {
      const t = ctx.currentTime, up = Math.min(streak - 1, 7) * 2;
      tone(hz(72 + up), t, 0.18, { type: "triangle", vol: 0.25 });
      tone(hz(79 + up), t + 0.08, 0.32, { type: "triangle", vol: 0.22 });
      if (streak >= 5) tone(hz(84 + up), t + 0.16, 0.4, { type: "sine", vol: 0.15 });
    },
    miss() {
      const t = ctx.currentTime;
      tone(220, t, 0.3, { type: "sawtooth", vol: 0.08, slideTo: 140 });
      tone(165, t + 0.05, 0.35, { type: "sine", vol: 0.2, slideTo: 110 });
    },
    // A little fanfare; brighter the better the round went.
    finish(pct) {
      const t = ctx.currentTime;
      const notes = pct >= 80 ? [60, 64, 67, 72, 76, 79, 84] : pct >= 50 ? [60, 64, 67, 72] : [60, 63, 67];
      notes.forEach((n, i) => tone(hz(n), t + i * 0.11, 0.5, { type: "triangle", vol: 0.2 }));
      tone(hz(notes[notes.length - 1] - 12), t + notes.length * 0.11, 1.2, { type: "sine", vol: 0.18 });
    },
  };

  // ── Music: a slow loop in the Dorian mode (a Greek name, at least) ──
  // Soft pad chords, a plucked arpeggio and a quiet bass, 4 bars round.
  const BPM = 76, BEAT = 60 / BPM, BAR = BEAT * 4;
  const CHORDS = [ // D Dorian: Dm7 · G · Am7 · Cmaj7
    [50, 57, 60, 65], [55, 59, 62, 67], [57, 60, 64, 67], [48, 55, 59, 64],
  ];
  function scheduleBar(t, i) {
    const ch = CHORDS[i % CHORDS.length];
    ch.forEach((n) => tone(hz(n), t, BAR * 1.05, { type: "sine", vol: 0.05, bus: musicBus, attack: 0.6 }));
    tone(hz(ch[0] - 12), t, BEAT * 1.8, { type: "triangle", vol: 0.12, bus: musicBus, attack: 0.02 });
    tone(hz(ch[0] - 12), t + BEAT * 2, BEAT * 1.8, { type: "triangle", vol: 0.1, bus: musicBus, attack: 0.02 });
    const arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[2] + 12, ch[1] + 12, ch[2] + 12, ch[3] + 12];
    arp.forEach((n, k) => {
      if (k === 7 && i % 2) return; // breathe every other bar
      tone(hz(n), t + k * BEAT / 2, BEAT * 0.9, { type: "triangle", vol: 0.045, bus: musicBus });
    });
  }
  function tick() {
    while (nextBar < ctx.currentTime + 1.5) { scheduleBar(nextBar, bar++); nextBar += BAR; }
  }

  return {
    unlock: init,
    play(name, arg) { if (!ctx) init(); if (ctx && Sound.sfxOn) sfx[name](arg); },
    sfxOn: true,
    musicOn: false,
    startMusic() {
      init(); if (!ctx || musicTimer) return;
      nextBar = ctx.currentTime + 0.1;
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.setValueAtTime(0.0001, ctx.currentTime);
      musicBus.gain.exponentialRampToValueAtTime(0.7, ctx.currentTime + 2);
      tick(); musicTimer = setInterval(tick, 400);
    },
    stopMusic() {
      if (!ctx || !musicTimer) return;
      clearInterval(musicTimer); musicTimer = null;
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.setValueAtTime(musicBus.gain.value, ctx.currentTime);
      musicBus.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
    },
  };
})();
