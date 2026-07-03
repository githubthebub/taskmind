import type { BreathPhase } from '../types.js';
import type { EventBus } from '../state/bus.js';

/**
 * Client-side oscillator complex (Web Audio, zero assets, zero network).
 *
 * Layer A — grounding: a 110Hz sine fundamental, low-pass filtered, held at a
 * low steady level with a slow amplitude drift so it reads as felt warmth
 * rather than a "tone". It swells slightly on the long exhale, the phase in
 * which slow paced breathing does its parasympathetic work.
 *
 * Layer B — focus: a 432Hz partial routed through a slowly wandering stereo
 * panner. Its gain envelope follows the breath: rises across the inhale,
 * sustains with a gentle shimmer through the hold, and releases across the
 * exhale — so the ear can track the cycle with eyes closed.
 *
 * Layer C — phase voice: each phase has its own sound. A triangle voice
 * glides UP a fifth across the inhale (264→396Hz), holds steady through the
 * hold, and glides DOWN a full octave across the exhale (396→198Hz), so
 * pitch direction alone tells you which phase you are in. Each boundary is
 * marked by a soft chime on a descending A-major triad: E5 for inhale,
 * C#5 for hold, A4 for exhale.
 *
 * All parameter moves use setTargetAtTime / linearRamp so there are no clicks.
 */

const GROUND_HZ = 110;
const FOCUS_HZ = 432;
const MASTER_LEVEL = 0.5;
const GROUND_BASE = 0.16;
const GROUND_EXHALE = 0.24;
const FOCUS_PEAK = 0.1;
const FOCUS_HOLD = 0.085;
const VOICE_INHALE = 0.055;
const VOICE_HOLD = 0.04;
const VOICE_EXHALE = 0.05;
const VOICE_LOW = 264; // C4-ish start of the inhale glide
const VOICE_HIGH = 396; // a fifth up; the hold plateau
const VOICE_FLOOR = 198; // an octave below the plateau, end of exhale
const CHIME_HZ: Record<Exclude<BreathPhase, 'idle'>, number> = {
  inhale: 659.25, // E5
  hold: 554.37, // C#5
  exhale: 440, // A4
};
const CHIME_LEVEL = 0.09;

export class OscillatorComplex {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private groundGain: GainNode | null = null;
  private focusGain: GainNode | null = null;
  private voice: OscillatorNode | null = null;
  private voiceGain: GainNode | null = null;
  private enabled = true;
  /** Phase durations in seconds, taken from the active protocol. */
  private inhaleSec = 4;
  private exhaleSec = 8;

  constructor(bus: EventBus) {
    bus.on('transition', ({ to }) => this.onPhase(to));
    bus.on('sessionStart', ({ protocol }) => {
      this.inhaleSec = protocol.inhaleMs / 1000;
      this.exhaleSec = protocol.exhaleMs / 1000;
      void this.resume();
    });
    bus.on('sessionEnd', () => this.fadeOut());
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.fadeOut();
  }

  /** Must be called from a user gesture the first time (autoplay policy). */
  async resume(): Promise<void> {
    if (!this.enabled) return;
    if (!this.ctx) this.buildGraph();
    if (this.ctx && this.ctx.state !== 'running') {
      try {
        await this.ctx.resume();
      } catch {
        // Autoplay blocked — the next explicit gesture will retry.
      }
    }
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(MASTER_LEVEL, this.ctx.currentTime, 0.4);
    }
  }

  private buildGraph(): void {
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    // --- Layer A: 110Hz grounding fundamental ---
    const ground = ctx.createOscillator();
    ground.type = 'sine';
    ground.frequency.value = GROUND_HZ;

    const groundFilter = ctx.createBiquadFilter();
    groundFilter.type = 'lowpass';
    groundFilter.frequency.value = 220;
    groundFilter.Q.value = 0.7;

    this.groundGain = ctx.createGain();
    this.groundGain.gain.value = GROUND_BASE;

    // Slow amplitude drift (0.05Hz) keeps the drone organic.
    const drift = ctx.createOscillator();
    drift.type = 'sine';
    drift.frequency.value = 0.05;
    const driftDepth = ctx.createGain();
    driftDepth.gain.value = 0.03;
    drift.connect(driftDepth).connect(this.groundGain.gain);

    ground.connect(groundFilter).connect(this.groundGain).connect(this.master);

    // --- Layer B: 432Hz spatial focus layer ---
    const focus = ctx.createOscillator();
    focus.type = 'sine';
    focus.frequency.value = FOCUS_HZ;

    this.focusGain = ctx.createGain();
    this.focusGain.gain.value = 0;

    let focusOut: AudioNode = this.focusGain;
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      // Slow spatial wander (0.08Hz) between the ears.
      const panLfo = ctx.createOscillator();
      panLfo.type = 'sine';
      panLfo.frequency.value = 0.08;
      const panDepth = ctx.createGain();
      panDepth.gain.value = 0.6;
      panLfo.connect(panDepth).connect(panner.pan);
      panLfo.start();
      this.focusGain.connect(panner);
      focusOut = panner;
    }
    focus.connect(this.focusGain);
    focusOut.connect(this.master);

    // --- Layer C: per-phase gliding voice ---
    this.voice = ctx.createOscillator();
    this.voice.type = 'triangle';
    this.voice.frequency.value = VOICE_LOW;
    this.voiceGain = ctx.createGain();
    this.voiceGain.gain.value = 0;
    this.voice.connect(this.voiceGain).connect(this.master);

    ground.start();
    focus.start();
    drift.start();
    this.voice.start();
  }

  /** Soft boundary chime; a short one-shot voice per phase entry. */
  private chime(phase: Exclude<BreathPhase, 'idle'>): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = CHIME_HZ[phase];
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(CHIME_LEVEL, t + 0.02);
    env.gain.setTargetAtTime(0, t + 0.06, 0.18);
    osc.connect(env).connect(this.master);
    osc.start(t);
    osc.stop(t + 1.2);
  }

  /** Per-phase sound: crossfades layers, glides the voice, rings the chime. */
  private onPhase(phase: BreathPhase): void {
    if (!this.ctx || !this.groundGain || !this.focusGain || !this.voice || !this.voiceGain || !this.enabled) {
      if (phase === 'idle') this.fadeOut();
      return;
    }
    const t = this.ctx.currentTime;
    const focus = this.focusGain.gain;
    const ground = this.groundGain.gain;
    const freq = this.voice.frequency;
    const vGain = this.voiceGain.gain;

    switch (phase) {
      case 'inhale':
        this.chime('inhale');
        // Focus layer rises across the inhale; grounding recedes to base.
        focus.cancelScheduledValues(t);
        focus.setTargetAtTime(FOCUS_PEAK, t, 1.4);
        ground.setTargetAtTime(GROUND_BASE, t, 1.0);
        // Voice glides UP a fifth over the whole inhale.
        freq.cancelScheduledValues(t);
        freq.setValueAtTime(VOICE_LOW, t);
        freq.linearRampToValueAtTime(VOICE_HIGH, t + this.inhaleSec);
        vGain.cancelScheduledValues(t);
        vGain.setTargetAtTime(VOICE_INHALE, t, 0.6);
        break;
      case 'hold':
        this.chime('hold');
        // Sustain with a slight settle so the hold reads as stillness.
        focus.cancelScheduledValues(t);
        focus.setTargetAtTime(FOCUS_HOLD, t, 2.0);
        // Voice holds its plateau, slightly quieter — a held note.
        freq.cancelScheduledValues(t);
        freq.setValueAtTime(VOICE_HIGH, t);
        vGain.cancelScheduledValues(t);
        vGain.setTargetAtTime(VOICE_HOLD, t, 1.2);
        break;
      case 'exhale':
        this.chime('exhale');
        // Focus releases over the exhale; grounding swells underneath.
        focus.cancelScheduledValues(t);
        focus.setTargetAtTime(0.004, t, 2.6);
        ground.setTargetAtTime(GROUND_EXHALE, t, 2.2);
        // Voice glides DOWN a full octave over the whole exhale.
        freq.cancelScheduledValues(t);
        freq.setValueAtTime(VOICE_HIGH, t);
        freq.linearRampToValueAtTime(VOICE_FLOOR, t + this.exhaleSec);
        vGain.cancelScheduledValues(t);
        vGain.setTargetAtTime(VOICE_EXHALE, t, 0.8);
        break;
      case 'idle':
        vGain.cancelScheduledValues(t);
        vGain.setTargetAtTime(0, t, 0.4);
        this.fadeOut();
        break;
    }
  }

  private fadeOut(): void {
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
  }
}
