import type { SoundCueId, SoundCueSpec, SoundEngine } from '../types';
import { soundCueMap } from '../data/soundCues';

/**
 * Web Audio implementation of the SoundEngine contract (Section 6).
 *
 * Everything is synthesized — no external audio assets — so eyes-closed /
 * audio-only sessions work offline. All levels are deliberately conservative:
 * cue partials are normalized so a cue's summed peak never exceeds its spec
 * gain (max 0.6 in the cue table), and the master chain tops out at 1.0, so
 * output stays comfortably below clipping even for 4-note cues at intensity 1.
 *
 * The module performs no top-level window/AudioContext access, so it is safe
 * to import in non-browser (typecheck/SSR/test) contexts. The AudioContext is
 * created lazily and unlocked via resume() after a user gesture.
 */

/** How long setIntensity() takes to ramp — smooth, never a click. */
const INTENSITY_RAMP_S = 0.3;
/** Fast mute ramp for setEnabled(false); short but click-free. */
const MUTE_RAMP_S = 0.03;
/** Chime arpeggiation: each successive partial starts this much later. */
const CHIME_STAGGER_S = 0.04;
/** Each successive chime partial is this much quieter than the previous. */
const CHIME_DECAY_PER_NOTE = 0.75;
/** exponentialRamp cannot reach 0 — this is our silence floor. */
const SILENCE = 0.0001;

type AudioContextCtor = new () => AudioContext;

/** Resolve the AudioContext constructor without touching window at import time. */
function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as typeof window & { webkitAudioContext?: AudioContextCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export function createSoundEngine(): SoundEngine {
  let ctx: AudioContext | null = null;
  let masterGain: GainNode | null = null;

  let enabled = true;
  let intensity = 1;

  let pacingTimer: ReturnType<typeof setInterval> | null = null;

  const warnedUnknownCues = new Set<string>();

  /** Lazily create the AudioContext + master chain. Null outside the browser. */
  function ensureContext(): AudioContext | null {
    if (ctx) return ctx;
    const Ctor = getAudioContextCtor();
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
    masterGain = ctx.createGain();
    masterGain.gain.value = enabled ? intensity : 0;
    masterGain.connect(ctx.destination);
    return ctx;
  }

  /** Smoothly ramp the master gain to its current target (intensity or mute). */
  function rampMaster(seconds: number): void {
    if (!ctx || !masterGain) return;
    const target = enabled ? intensity : 0;
    const now = ctx.currentTime;
    const g = masterGain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(target, now + seconds);
  }

  /** Shape the per-cue gain node according to the cue's envelope. */
  function applyEnvelope(
    gain: AudioParam,
    spec: SoundCueSpec,
    t0: number,
    tEnd: number,
  ): void {
    const peak = Math.max(SILENCE, clamp01(spec.gain));
    switch (spec.envelope) {
      case 'pluck':
        // Fast ~10ms attack, exponential decay across the duration.
        gain.setValueAtTime(SILENCE, t0);
        gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
        gain.exponentialRampToValueAtTime(SILENCE, tEnd);
        break;
      case 'swell': {
        // Slow rise to peak at ~60% of the duration, then a gentle fall.
        const peakAt = t0 + (tEnd - t0) * 0.6;
        gain.setValueAtTime(0, t0);
        gain.linearRampToValueAtTime(peak, peakAt);
        gain.linearRampToValueAtTime(0, tEnd);
        break;
      }
      case 'chime':
        // Fast attack, long soft exponential tail (covers staggered partials).
        gain.setValueAtTime(SILENCE, t0);
        gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
        gain.exponentialRampToValueAtTime(SILENCE, tEnd);
        break;
    }
    gain.setValueAtTime(0, tEnd);
  }

  function synthesize(spec: SoundCueSpec): void {
    const ac = ensureContext();
    if (!ac || !masterGain) return;

    const t0 = ac.currentTime;
    const durationS = spec.durationMs / 1000;
    const isChime = spec.envelope === 'chime';
    const staggerS = isChime ? CHIME_STAGGER_S : 0;
    // Chime partials arpeggiate, so the cue rings until the last one finishes.
    const tEnd = t0 + durationS + staggerS * (spec.freqs.length - 1);

    // Per-cue envelope gain: cueGain -> masterGain -> destination.
    const cueGain = ac.createGain();
    cueGain.connect(masterGain);
    applyEnvelope(cueGain.gain, spec, t0, tEnd);

    // Mix weights: successive chime notes are quieter; other envelopes are
    // equal-weight. Normalize so the weights sum to 1 — the summed peak of a
    // cue is then exactly spec.gain regardless of how many partials it has.
    const weights = spec.freqs.map((_, i) =>
      isChime ? Math.pow(CHIME_DECAY_PER_NOTE, i) : 1,
    );
    const weightSum = weights.reduce((a, b) => a + b, 0) || 1;

    const stopAt = tEnd + 0.05;
    spec.freqs.forEach((freq, i) => {
      const osc = ac.createOscillator();
      osc.type = spec.wave;
      osc.frequency.value = freq;

      const noteGain = ac.createGain();
      noteGain.gain.value = weights[i] / weightSum;

      osc.connect(noteGain);
      noteGain.connect(cueGain);

      osc.start(t0 + staggerS * i);
      osc.stop(stopAt);
      osc.onended = () => {
        osc.disconnect();
        noteGain.disconnect();
        // The last-scheduled oscillator releases the cue's envelope node.
        if (i === spec.freqs.length - 1) cueGain.disconnect();
      };
    });
  }

  function play(cue: SoundCueId): void {
    if (!enabled) return;
    const spec = soundCueMap.get(cue);
    if (!spec) {
      if (!warnedUnknownCues.has(cue)) {
        warnedUnknownCues.add(cue);
        // eslint-disable-next-line no-console
        console.warn(`[soundEngine] Unknown sound cue id: "${cue}"`);
      }
      return;
    }
    synthesize(spec);
  }

  function stopPacing(): void {
    if (pacingTimer !== null) {
      clearInterval(pacingTimer);
      pacingTimer = null;
    }
  }

  function startPacing(breathsPerMinute: number): void {
    stopPacing(); // retune cleanly on repeat calls
    if (!enabled) return;
    const bpm = Math.min(240, Math.max(1, breathsPerMinute));
    if (!Number.isFinite(bpm)) return;
    const periodMs = 60000 / bpm;

    // Drift-tolerant scheduling: beats are computed from a fixed start
    // timestamp rather than accumulating setInterval error. If the tab is
    // throttled we quietly skip missed beats instead of bursting to catch up.
    const startedAt = Date.now();
    let nextBeat = 0;
    play('cue-breath-pulse'); // first pulse lands immediately
    nextBeat = 1;

    const tickMs = Math.max(10, Math.min(50, periodMs / 4));
    pacingTimer = setInterval(() => {
      const elapsedBeats = Math.floor((Date.now() - startedAt) / periodMs);
      if (elapsedBeats >= nextBeat) {
        play('cue-breath-pulse');
        nextBeat = elapsedBeats + 1;
      }
    }, tickMs);
  }

  function setIntensity(level: number): void {
    intensity = clamp01(level);
    rampMaster(INTENSITY_RAMP_S);
  }

  function setEnabled(on: boolean): void {
    enabled = on;
    if (!on) stopPacing();
    // Hard-but-clickless mute on disable; gentle restore on enable.
    rampMaster(on ? INTENSITY_RAMP_S : MUTE_RAMP_S);
  }

  async function resume(): Promise<void> {
    const ac = ensureContext();
    if (!ac) return;
    if (ac.state === 'suspended') {
      try {
        await ac.resume();
      } catch {
        // Some browsers reject when called outside a user gesture; the next
        // gesture-driven resume() will unlock the context.
      }
    }
  }

  return { play, setIntensity, setEnabled, startPacing, stopPacing, resume };
}

export default createSoundEngine;
