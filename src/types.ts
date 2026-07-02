/** Shared contracts for the Sensory Rewire engine stack. */

export type StateKey = 'piti' | 'sukha' | 'flow';

export type BreathPhase = 'inhale' | 'hold' | 'exhale';

export const BREATH_PHASES: readonly BreathPhase[] = ['inhale', 'hold', 'exhale'];

/** 4-7-8 style breath protocol, seconds per phase. */
export interface BreathProfile {
  inhaleSec: number;
  holdSec: number;
  exhaleSec: number;
}

/** Per-phase scalar map, e.g. binaural beat offsets keyed by breath phase. */
export type PhaseMap<T> = Record<BreathPhase, T>;

export interface AudioProfile {
  /** Fundamental sine frequency in Hz (the parasympathetic "floor"). */
  fundamentalHz: number;
  /** Linear gain of the fundamental layer, 0..1. */
  fundamentalGain: number;
  /** Binaural beat offset (Hz) applied to the right-ear fundamental, per phase. */
  binauralBeatHz: PhaseMap<number>;
  /** Spatial layer carrier frequency in Hz. */
  spatialHz: number;
  /** Linear gain of the spatial layer, 0..1. */
  spatialGain: number;
  /** Pan LFO rate (Hz) for the spatial layer, per phase. */
  panRateHz: PhaseMap<number>;
  /** Frequency-modulation depth (Hz) on the spatial carrier, per phase. */
  fmDepthHz: PhaseMap<number>;
  /** Frequency-modulation rate (Hz) on the spatial carrier, per phase. */
  fmRateHz: PhaseMap<number>;
  /** Time constant (s) for all parameter crossfades between phases. */
  crossfadeSec: number;
}

export interface HapticCell {
  /** navigator.vibrate pattern: [pulse, gap, pulse, ...] in ms. */
  pattern: number[];
  /** Interval (ms) at which the pattern repeats while the phase is active. */
  repeatEveryMs: number;
}

export interface HapticProfile {
  /** Pattern fired once at every breath phase transition. */
  transitionPattern: number[];
  /** Optional repeating pattern per phase; null = silence for that phase. */
  grid: PhaseMap<HapticCell | null>;
}

export interface StateConfig {
  key: StateKey;
  title: string;
  subtitle: string;
  description: string;
  /** Accent color (CSS) used across portal card, orb, and prompt styling. */
  accent: string;
  breath: BreathProfile;
  audio: AudioProfile;
  haptics: HapticProfile;
  /** Rotating attention-direction scripts, per breath phase. */
  prompts: PhaseMap<string[]>;
  /** Short anchor line shown persistently under the orb. */
  anchor: string;
}

export interface PhaseChangeEvent {
  phase: BreathPhase;
  /** Completed full breath cycles so far (0 on the first inhale). */
  cycle: number;
}

export interface ProgressEvent {
  phase: BreathPhase;
  /** Normalized progress through the current phase, 0..1. */
  t: number;
  remainingSec: number;
}
