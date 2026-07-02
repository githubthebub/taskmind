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
    this._gen = 0; // bumped by stop(); start() aborts if it changed mid-await
  }

  _ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
  }

  _ramp(param, v, seconds) {
    const t = this.ctx.currentTime;
    param.cancelScheduledValues(t);
    param.setValueAtTime(param.value, t);
    param.linearRampToValueAtTime(v, t + seconds);
  }

  /* one-shot sine with a soft attack/decay envelope */
  _tone(freq, at, peak, decay, dest) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    o.connect(g).connect(dest);
    o.start(at);
    o.stop(at + decay + 0.1);
  }

  async start() {
    this._ensure();
    const gen = this._gen;
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    // a stop() during the await means nobody owns this soundscape anymore
    if (gen !== this._gen || this.nodes) return;

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

    this.nodes = { oscs, oscGains, lfo, surfLfo, noise, noiseGain, noiseFilter, tone, bus };
    this.setEnabled(this.enabled);
  }

  /* morph timbre with session intensity 0..1 */
  setIntensity(x, seconds = 4) {
    if (!this.nodes) return;
    this._ramp(this.nodes.tone.frequency, 700 + x * 2200, seconds);
    this._ramp(this.nodes.noiseFilter.frequency, 300 + x * 900, seconds);
    this._ramp(this.nodes.noiseGain.gain, 0.04 + x * 0.09, seconds);
    this._ramp(this.nodes.oscGains[3].gain, 0.05 + x * 0.18, seconds);
    this.nodes.oscs.forEach((o, i) =>
      this._ramp(o.detune, (i % 2 ? 1 : -1) * (4 + x * 9), seconds));
  }

  /* soft cue tone at breath transitions: dir 'in' | 'out' */
  breathCue(dir) {
    if (!this.ctx || !this.enabled) return;
    // C5 rising for the inhale, G4 falling for the exhale
    this._tone(dir === 'in' ? 523.25 : 392, this.ctx.currentTime, 0.05, 0.9, this.master);
  }

  /* gentle completion chime — small rising arpeggio.
     Routed straight to the destination so the master fade in stop()
     can't cut it short. */
  chime() {
    if (!this.ctx || !this.enabled) return;
    const level = 0.11 * this.volume;
    [523.25, 659.25, 783.99].forEach((f, i) =>
      this._tone(f, this.ctx.currentTime + i * 0.35, level, 2.2, this.ctx.destination));
  }

  setEnabled(on) {
    this.enabled = on;
    if (!this.ctx || !this.master) return;
    this._ramp(this.master.gain, on ? this.volume * 0.6 : 0, 1.2);
  }

  setVolume(v) {
    this.volume = v;
    if (this.enabled) this.setEnabled(true);
  }

  suspend() { this.ctx?.suspend(); }
  resume()  { this.ctx?.resume(); }

  stop() {
    this._gen++;
    if (!this.ctx) return;
    this._ramp(this.master.gain, 0, 2);
    const nodes = this.nodes;
    this.nodes = null;
    if (!nodes) return;
    setTimeout(() => {
      try {
        [...nodes.oscs, nodes.lfo, nodes.surfLfo, nodes.noise].forEach(o => o.stop());
        nodes.bus.disconnect();
        nodes.tone.disconnect();
      } catch (_) { /* already stopped */ }
    }, 2500);
  }

  /* ---------- spoken guidance ---------- */

  invalidateVoice() { this._voice = null; }

  _pickVoice() {
    if (this._voice !== null) return this._voice;
    const voices = window.speechSynthesis?.getVoices() ?? [];
    if (!voices.length) return undefined; // don't cache "no voices yet"
    const prefs = [/samantha/i, /female/i, /karen/i, /serena/i, /zira/i, /en[-_]/i];
    for (const p of prefs) {
      const v = voices.find(v => p.test(v.name) || p.test(v.lang));
      if (v) { this._voice = v; return v; }
    }
    this._voice = voices[0];
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
