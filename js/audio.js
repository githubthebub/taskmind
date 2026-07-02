/* ============================================================
   VELVET — audio engine
   Fully synthesized: warm detuned drone + sub layer + slow LFO
   shimmer, gentle noise "surf", and soft breath-cue tones.
   Intensity (0..1) morphs brightness, detune and surf level.
   ============================================================ */

class SoundScape {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.nodes = null;
    this.enabled = true;
    this.voiceEnabled = true;
    this.volume = 0.7;
    this._voice = null;
  }

  _ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
  }

  async start() {
    this._ensure();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    if (this.nodes) return;

    const ctx = this.ctx;
    const bus = ctx.createGain();
    bus.gain.value = 0.5;

    // --- warm chord drone: root + fifth + octave, gently detuned ---
    const freqs = [55, 82.41, 110, 164.81];
    const oscGains = [];
    const oscs = freqs.map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i < 2 ? 'sine' : 'triangle';
      o.frequency.value = f;
      o.detune.value = (i % 2 ? 4 : -4);
      const g = ctx.createGain();
      g.gain.value = [0.5, 0.28, 0.2, 0.07][i];
      o.connect(g).connect(bus);
      o.start();
      oscGains.push(g);
      return o;
    });

    // slow shimmer LFO on the upper partial
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain).connect(oscGains[3].gain);
    lfo.start();

    // --- filtered noise "surf" bed ---
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      // pink-ish noise via leaky integrator
      last = last * 0.97 + (Math.random() * 2 - 1) * 0.03;
      data[i] = last * 8;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 350;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.05;
    // very slow swell on the surf
    const surfLfo = ctx.createOscillator();
    surfLfo.frequency.value = 0.045;
    const surfLfoGain = ctx.createGain();
    surfLfoGain.gain.value = 0.03;
    surfLfo.connect(surfLfoGain).connect(noiseGain.gain);
    surfLfo.start();
    noise.connect(noiseFilter).connect(noiseGain).connect(bus);
    noise.start();

    // --- master tone shaping ---
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 900;
    bus.connect(tone).connect(this.master);

    this.nodes = { oscs, oscGains, noiseGain, noiseFilter, tone, bus };
    this.setEnabled(this.enabled);
  }

  /* morph timbre with session intensity 0..1 */
  setIntensity(x, seconds = 4) {
    if (!this.nodes) return;
    const t = this.ctx.currentTime;
    const ramp = (param, v) => {
      param.cancelScheduledValues(t);
      param.setValueAtTime(param.value, t);
      param.linearRampToValueAtTime(v, t + seconds);
    };
    ramp(this.nodes.tone.frequency, 700 + x * 2200);
    ramp(this.nodes.noiseFilter.frequency, 300 + x * 900);
    ramp(this.nodes.noiseGain.gain, 0.04 + x * 0.09);
    ramp(this.nodes.oscGains[3].gain, 0.05 + x * 0.18);
    this.nodes.oscs.forEach((o, i) =>
      ramp(o.detune, (i % 2 ? 1 : -1) * (4 + x * 9)));
  }

  /* soft cue tone at breath transitions: dir 'in' | 'out' */
  breathCue(dir) {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = dir === 'in' ? 523.25 : 392; // C5 up, G4 down
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 1);
  }

  /* gentle completion chime — small rising arpeggio */
  chime() {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const t = ctx.currentTime + i * 0.35;
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.08, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      o.connect(g).connect(this.master);
      o.start(t);
      o.stop(t + 2.3);
    });
  }

  setEnabled(on) {
    this.enabled = on;
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(on ? this.volume * 0.6 : 0, t + 1.2);
  }

  setVolume(v) {
    this.volume = v;
    if (this.enabled) this.setEnabled(true);
  }

  suspend() { this.ctx?.suspend(); }
  resume()  { this.ctx?.resume(); }

  stop() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + 2);
    const nodes = this.nodes;
    this.nodes = null;
    setTimeout(() => {
      try {
        nodes?.oscs.forEach(o => o.stop());
        nodes?.bus.disconnect();
      } catch (_) { /* already stopped */ }
    }, 2500);
  }

  /* ---------- spoken guidance ---------- */

  _pickVoice() {
    if (this._voice !== null) return this._voice;
    const voices = window.speechSynthesis?.getVoices() ?? [];
    const prefs = [/samantha/i, /female/i, /karen/i, /serena/i, /zira/i, /en[-_]/i];
    for (const p of prefs) {
      const v = voices.find(v => p.test(v.name) || p.test(v.lang));
      if (v) { this._voice = v; return v; }
    }
    this._voice = voices[0] ?? undefined;
    return this._voice;
  }

  speak(text) {
    if (!this.voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.82;
    u.pitch = 0.95;
    u.volume = Math.min(1, this.volume + 0.2);
    const v = this._pickVoice();
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  }

  stopSpeech() { window.speechSynthesis?.cancel(); }
}

export const sound = new SoundScape();
