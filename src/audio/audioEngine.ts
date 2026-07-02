/**
 * Offline WebAudio Engine — pure synthesis, zero audio files, zero network.
 *
 * The AudioContext is created lazily on the first play call so construction
 * is safe before any user gesture (autoplay policy) and in environments
 * without WebAudio support. All output routes through a master GainNode
 * that `setMuted` gates.
 */

import type { BreathingPhase, IAudioEngine } from '../types.js';

type QuotaGate = (tier: number, totalBlocksCleared: number) => boolean;

interface PhaseCueSpec {
  startHz: number;
  endHz: number;
  durationS: number;
  peakGain: number;
}

const PHASE_CUES: Record<BreathingPhase['name'], PhaseCueSpec> = {
  // Inhale: rising sine 396 Hz -> 528 Hz over 0.6 s.
  inhale: { startHz: 396, endHz: 528, durationS: 0.6, peakGain: 0.28 },
  // Hold: steady 432 Hz for 0.4 s.
  hold: { startHz: 432, endHz: 432, durationS: 0.4, peakGain: 0.24 },
  // Exhale: falling sine 528 Hz -> 264 Hz over 1.2 s.
  exhale: { startHz: 528, endHz: 264, durationS: 1.2, peakGain: 0.28 },
};

const GROUNDING_DURATION_S = 8;
const MAX_GROUNDING_LAYERS = 4;

export class AudioEngine implements IAudioEngine {
  private readonly quotaGate: QuotaGate;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  private contextUnavailable = false;

  constructor(quotaGate: QuotaGate) {
    this.quotaGate = quotaGate;
  }

  /* ---------------------------------------------------------------- */
  /* Context management                                                 */
  /* ---------------------------------------------------------------- */

  /**
   * Lazily builds the AudioContext + master gain on first playback.
   * Never throws: returns null when WebAudio is unavailable.
   */
  private ensureContext(): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {
          /* resume denied by autoplay policy; a later gesture will retry */
        });
      }
      return this.ctx;
    }
    if (this.contextUnavailable) {
      return null;
    }
    try {
      const globalScope = globalThis as typeof globalThis & {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      };
      const Ctor = globalScope.AudioContext ?? globalScope.webkitAudioContext;
      if (!Ctor) {
        this.contextUnavailable = true;
        return null;
      }
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.gain.value = this.muted ? 0 : 1;
      master.connect(ctx.destination);
      this.ctx = ctx;
      this.master = master;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {
          /* will resume on a future user gesture */
        });
      }
      return ctx;
    } catch {
      this.contextUnavailable = true;
      return null;
    }
  }

  /* ---------------------------------------------------------------- */
  /* IAudioEngine                                                       */
  /* ---------------------------------------------------------------- */

  playPhaseCue(phase: BreathingPhase['name']): void {
    const ctx = this.ensureContext();
    const master = this.master;
    if (!ctx || !master) {
      return;
    }
    const spec = PHASE_CUES[phase];
    const now = ctx.currentTime;
    const attackS = 0.03;
    const releaseS = Math.min(0.25, spec.durationS * 0.4);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(spec.startHz, now);
    if (spec.endHz !== spec.startHz) {
      osc.frequency.exponentialRampToValueAtTime(spec.endHz, now + spec.durationS);
    }

    // Attack/release gain envelope to avoid clicks.
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(spec.peakGain, now + attackS);
    env.gain.setValueAtTime(spec.peakGain, now + spec.durationS - releaseS);
    env.gain.exponentialRampToValueAtTime(0.0001, now + spec.durationS);

    osc.connect(env);
    env.connect(master);
    osc.start(now);
    osc.stop(now + spec.durationS + 0.05);
    osc.onended = () => {
      osc.disconnect();
      env.disconnect();
    };
  }

  playGroundingScript(tier: number, totalBlocksCleared: number): boolean {
    if (!this.quotaGate(tier, totalBlocksCleared)) {
      return false;
    }
    const ctx = this.ensureContext();
    const master = this.master;
    if (!ctx || !master) {
      return false;
    }

    const now = ctx.currentTime;
    const end = now + GROUNDING_DURATION_S;
    const layerCount = Math.min(
      MAX_GROUNDING_LAYERS,
      Math.max(1, 1 + Math.floor(tier)),
    );

    const nodesToDisconnect: AudioNode[] = [];
    const oscillators: OscillatorNode[] = [];

    // Overall envelope: fade in 1 s, sustain, fade out over the last 2 s.
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(0.6, now + 1);
    envelope.gain.setValueAtTime(0.6, end - 2);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);

    // Slow breath-cadence amplitude pulse: 0.5 Hz sine modulating a gain
    // stage around a 0.55 baseline (soft swell, never fully silent).
    const pulseStage = ctx.createGain();
    pulseStage.gain.value = 0.55;
    const pulseLfo = ctx.createOscillator();
    pulseLfo.type = 'sine';
    pulseLfo.frequency.value = 0.5;
    const pulseDepth = ctx.createGain();
    pulseDepth.gain.value = 0.35;
    pulseLfo.connect(pulseDepth);
    pulseDepth.connect(pulseStage.gain);

    // LFO-modulated lowpass filter sweep over the whole bed.
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    filter.Q.value = 1.2;
    const filterLfo = ctx.createOscillator();
    filterLfo.type = 'sine';
    filterLfo.frequency.value = 0.12;
    const filterDepth = ctx.createGain();
    filterDepth.gain.value = 420;
    filterLfo.connect(filterDepth);
    filterDepth.connect(filter.frequency);

    // Layer 1: low 110 Hz triangle drone. Higher tiers add one harmonic
    // sine layer each (220 / 330 / 440 Hz) at decreasing gain, capped at 4.
    for (let layer = 0; layer < layerCount; layer += 1) {
      const osc = ctx.createOscillator();
      osc.type = layer === 0 ? 'triangle' : 'sine';
      osc.frequency.value = 110 * (layer + 1);
      // Slight detune on upper layers for gentle beating/movement.
      osc.detune.value = layer === 0 ? 0 : (layer % 2 === 0 ? -4 : 4) * layer;
      const layerGain = ctx.createGain();
      layerGain.gain.value = layer === 0 ? 0.5 : 0.22 / layer;
      osc.connect(layerGain);
      layerGain.connect(filter);
      oscillators.push(osc);
      nodesToDisconnect.push(layerGain);
    }

    filter.connect(pulseStage);
    pulseStage.connect(envelope);
    envelope.connect(master);
    nodesToDisconnect.push(
      filter,
      pulseStage,
      envelope,
      pulseDepth,
      filterDepth,
    );
    oscillators.push(pulseLfo, filterLfo);

    for (const osc of oscillators) {
      osc.start(now);
      osc.stop(end + 0.1);
    }
    const anchor = oscillators[0];
    if (anchor) {
      anchor.onended = () => {
        for (const osc of oscillators) {
          osc.disconnect();
        }
        for (const node of nodesToDisconnect) {
          node.disconnect();
        }
      };
    }
    return true;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    const ctx = this.ctx;
    const master = this.master;
    if (ctx && master) {
      // Short ramp instead of a hard jump to avoid clicks.
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(muted ? 0 : 1, now + 0.05);
    }
  }
}
