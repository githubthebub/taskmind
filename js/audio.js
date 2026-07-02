/* ============================================================
   ATTUNE — audio engine

   Everything is synthesized live with WebAudio — no assets, no
   network. Three layers:

     1. drone      — two slightly-detuned low sine/triangle pairs
                     through a slow-breathing lowpass filter
     2. water      — filtered noise with a long-period swell,
                     like surf heard through a wall
     3. cues       — soft chimes marking breath phases

   The soundscape has a single "mood" parameter (0…1, mapped from
   the target state's energy): low = darker, slower, deeper;
   high = brighter, more open.

   Spoken guidance uses speechSynthesis with a slow, low delivery.
   ============================================================ */

(() => {
  const A = {
    ctx: null,
    master: null,
    droneGain: null,
    waterGain: null,
    cueGain: null,
    nodes: [],
    running: false,
    enabled: true,
    voiceEnabled: true,
    voice: null,
    lfos: [],
  };
  Attune.Audio = A;

  A.init = function () {
    if (A.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) { A.enabled = false; return; }
    A.ctx = new Ctx();

    A.master = A.ctx.createGain();
    A.master.gain.value = 0;
    A.master.connect(A.ctx.destination);

    A.droneGain = A.ctx.createGain(); A.droneGain.gain.value = 0.5;
    A.waterGain = A.ctx.createGain(); A.waterGain.gain.value = 0.16;
    A.cueGain = A.ctx.createGain();  A.cueGain.gain.value = 0.5;
    A.droneGain.connect(A.master);
    A.waterGain.connect(A.master);
    A.cueGain.connect(A.master);
  };

  /* one detuned oscillator pair */
  function voicePair(freq, detune, type, gainVal) {
    const g = A.ctx.createGain();
    g.gain.value = gainVal;
    for (const dt of [-detune, detune]) {
      const o = A.ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = dt;
      o.connect(g);
      o.start();
      A.nodes.push(o);
    }
    return g;
  }

  A.start = function (mood = 0.35) {
    if (!A.enabled) return;
    A.init();
    if (!A.ctx) return;
    if (A.ctx.state === "suspended") A.ctx.resume();
    if (A.running) { A.setMood(mood); return; }
    A.running = true;

    const now = A.ctx.currentTime;

    /* ----- drone: root + fifth, breathing filter ----- */
    const root = 55 + mood * 18;                    // A1-ish, brighter with mood
    const filter = A.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 220 + mood * 500;
    filter.Q.value = 0.7;
    filter.connect(A.droneGain);

    voicePair(root, 3, "sine", 0.32).connect(filter);
    voicePair(root * 1.5, 4, "sine", 0.16).connect(filter);
    voicePair(root * 2, 5, "triangle", 0.05).connect(filter);

    // filter swells on a ~14s period — the room itself breathes
    const lfo = A.ctx.createOscillator();
    lfo.frequency.value = 1 / 14;
    const lfoGain = A.ctx.createGain();
    lfoGain.gain.value = 120 + mood * 260;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    A.nodes.push(lfo);
    A.lfos.push({ lfo, lfoGain, filter });

    /* ----- water: looped noise through bandpass with swell ----- */
    const len = 4 * A.ctx.sampleRate;
    const buf = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      // pinkish noise via leaky integrator
      const white = Math.random() * 2 - 1;
      last = last * 0.97 + white * 0.03;
      data[i] = last * 6;
    }
    const noise = A.ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const nFilter = A.ctx.createBiquadFilter();
    nFilter.type = "bandpass";
    nFilter.frequency.value = 380 + mood * 320;
    nFilter.Q.value = 0.5;
    const swell = A.ctx.createGain();
    swell.gain.value = 0.4;
    const swellLfo = A.ctx.createOscillator();
    swellLfo.frequency.value = 1 / 11;
    const swellDepth = A.ctx.createGain();
    swellDepth.gain.value = 0.3;
    swellLfo.connect(swellDepth);
    swellDepth.connect(swell.gain);
    noise.connect(nFilter); nFilter.connect(swell); swell.connect(A.waterGain);
    noise.start();
    swellLfo.start();
    A.nodes.push(noise, swellLfo);

    A.master.gain.setTargetAtTime(0.5, now, 4);
  };

  A.setMood = function (mood) {
    if (!A.ctx || !A.running) return;
    for (const { filter, lfoGain } of A.lfos) {
      filter.frequency.setTargetAtTime(220 + mood * 500, A.ctx.currentTime, 6);
      lfoGain.gain.setTargetAtTime(120 + mood * 260, A.ctx.currentTime, 6);
    }
  };

  A.stop = function () {
    if (!A.ctx || !A.running) return;
    A.master.gain.setTargetAtTime(0, A.ctx.currentTime, 1.6);
    const nodes = A.nodes;
    A.nodes = [];
    A.lfos = [];
    A.running = false;
    setTimeout(() => nodes.forEach((n) => { try { n.stop(); } catch {} }), 5000);
  };

  A.setEnabled = function (on) {
    A.enabled = on;
    if (!A.ctx) return;
    if (on && A.running) A.master.gain.setTargetAtTime(0.5, A.ctx.currentTime, 1);
    else if (A.ctx) A.master.gain.setTargetAtTime(0, A.ctx.currentTime, 0.5);
  };

  /* ----- breath cues: soft sine blip, rising for inhale,
           falling for exhale, flat for holds ----- */
  A.cue = function (kind) {
    if (!A.ctx || !A.running || !A.enabled) return;
    const t = A.ctx.currentTime;
    const o = A.ctx.createOscillator();
    const g = A.ctx.createGain();
    o.type = "sine";
    const base = { inhale: 392, exhale: 294, holdIn: 349, holdOut: 262 }[kind] || 330;
    o.frequency.setValueAtTime(base, t);
    if (kind === "inhale") o.frequency.linearRampToValueAtTime(base * 1.25, t + 0.5);
    if (kind === "exhale") o.frequency.linearRampToValueAtTime(base * 0.8, t + 0.7);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.11, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    o.connect(g); g.connect(A.cueGain);
    o.start(t); o.stop(t + 1.2);
  };

  /* a single low bell for phase transitions */
  A.bell = function () {
    if (!A.ctx || !A.running || !A.enabled) return;
    const t = A.ctx.currentTime;
    for (const [f, amp] of [[220, 0.12], [331, 0.05], [442, 0.025]]) {
      const o = A.ctx.createOscillator();
      const g = A.ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
      o.connect(g); g.connect(A.cueGain);
      o.start(t); o.stop(t + 3.6);
    }
  };

  /* ============ spoken guidance ============ */

  function pickVoice() {
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return null;
    const prefs = [
      (v) => /en/i.test(v.lang) && /female|samantha|karen|moira|serena|allison|ava|aria|jenny|libby|sonia/i.test(v.name),
      (v) => /en/i.test(v.lang) && v.localService,
      (v) => /en/i.test(v.lang),
    ];
    for (const p of prefs) {
      const v = voices.find(p);
      if (v) return v;
    }
    return voices[0];
  }

  A.speak = function (text) {
    if (!A.voiceEnabled || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (!A.voice) A.voice = pickVoice();
    if (A.voice) u.voice = A.voice;
    u.rate = 0.82;
    u.pitch = 0.9;
    u.volume = 0.95;
    speechSynthesis.speak(u);
  };

  A.hush = function () {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  };

  if ("speechSynthesis" in window) {
    speechSynthesis.onvoiceschanged = () => { A.voice = pickVoice(); };
  }
})();
