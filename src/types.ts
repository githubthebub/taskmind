/**
 * Core vocabulary for the jhana guidance engine.
 *
 * All timestamps are milliseconds on a caller-supplied monotonic clock
 * (e.g. performance.now()). The engine never reads wall-clock time itself,
 * which keeps every component deterministic and unit-testable.
 *
 * All qualitative signals are normalized to [0, 1].
 */

/** The practice phases, ordered by depth. */
export enum Phase {
  /** Arrival: posture, settling the body, letting the day drain off. */
  Settling = 'SETTLING',
  /**
   * Upacara samadhi. Exclusive attention on tactile breath sensations at
   * the nostril rims / upper lip, tuning into the inherent pleasantness
   * of the breath (cool inhale, releasing exhale).
   */
  Access = 'ACCESS',
  /**
   * Whole-body breathing: the breath re-perceived as an energy field
   * spreading through the body, inviting piti (rapture) to arise.
   */
  PitiCultivation = 'PITI_CULTIVATION',
  /**
   * The pivot: attention shifts from the breath itself onto the
   * pleasantness of piti/sukha, without grasping at it.
   */
  Transition = 'TRANSITION',
  /**
   * First jhana: absorption with applied/sustained attention
   * (vitakka/vicara), piti and sukha born of seclusion.
   */
  Jhana1 = 'JHANA_1',
  /**
   * Second jhana: vitakka/vicara released, inner confidence (sampasadana),
   * piti and sukha born of concentration itself.
   */
  Jhana2 = 'JHANA_2',
  /** Deliberate, gentle exit and review. */
  Emergence = 'EMERGENCE',
}

/** Depth ordering used for progression/regression logic. */
export const PHASE_DEPTH: Readonly<Record<Phase, number>> = {
  [Phase.Settling]: 0,
  [Phase.Access]: 1,
  [Phase.PitiCultivation]: 2,
  [Phase.Transition]: 3,
  [Phase.Jhana1]: 4,
  [Phase.Jhana2]: 5,
  [Phase.Emergence]: 6,
};

/** A single breath event, from tap input, microphone, or a respiration belt. */
export interface BreathMark {
  /** Timestamp in ms (monotonic clock). */
  t: number;
  kind: 'inhaleStart' | 'exhaleStart';
}

/** Continuously derived respiration metrics. */
export interface BreathMetrics {
  /** Breaths per minute (EMA-smoothed). 0 until at least two full cycles. */
  bpm: number;
  /** Rhythm regularity in [0,1]: 1 = metronomic, 0 = chaotic. */
  regularity: number;
  /** Exhale/inhale duration ratio (EMA). >1 indicates a relaxing pattern. */
  exhaleRatio: number;
  /** True once enough cycles have been observed for metrics to be trusted. */
  warmedUp: boolean;
}

/**
 * Sparse qualitative self-assessment. The UI surfaces these as occasional
 * one-tap check-ins or sliders; every field is optional so a report can
 * carry a single dimension.
 */
export interface SelfReport {
  /** How continuously attention stays with the object. */
  focus?: number;
  /** Perceived pleasantness of the breath sensations. */
  pleasantness?: number;
  /** Intensity of piti: tingling, warmth, energetic waves. */
  piti?: number;
  /** Intensity of sukha: still, contented bliss. */
  sukha?: number;
  /** Excitement / striving / clenching around the experience. */
  effort?: number;
}

/** Optional biometric sample from a wearable. */
export interface BiometricSample {
  /** Beats per minute. */
  heartRate?: number;
  /** Heart-rate variability, RMSSD in ms. */
  hrvRmssd?: number;
  /** Breaths per minute from a chest strap (overrides tap-derived bpm). */
  respirationRate?: number;
}

/** The fused, smoothed view of the meditator that drives all decisions. */
export interface SignalSnapshot {
  /** Attention stability [0,1]. */
  stability: number;
  /** Hedonic tone of the breath object [0,1]. */
  pleasantness: number;
  /** Rapture intensity [0,1]. */
  piti: number;
  /** Bliss/contentment intensity [0,1]. */
  sukha: number;
  /** Striving / over-efforting [0,1]. */
  effort: number;
  /**
   * Risk that the meditator is grasping at piti (which collapses the
   * state) [0,1]. Driven by rate-of-change of piti, effort, and
   * cardiovascular arousal.
   */
  graspingRisk: number;
  breath: BreathMetrics;
}

/** Why a phase change happened — used for adaptive scripting and analytics. */
export type TransitionReason =
  | 'progress' // criteria met, moving deeper
  | 'regression' // state faded, stepping back without judgment
  | 'grasping' // over-excitement collapsed the state
  | 'user' // explicit user request
  | 'timeout'; // session time budget reached

export interface PhaseChange {
  from: Phase;
  to: Phase;
  at: number;
  reason: TransitionReason;
}

/** How urgently a guidance cue should be delivered. */
export enum CuePriority {
  /** Optional flavor; dropped freely if the meditator is deep. */
  Ambient = 0,
  /** Regular deepening instruction for the current phase. */
  Deepening = 1,
  /** Marks entry into a new phase; always delivered. */
  PhaseEntry = 2,
  /** Fixes an active problem (grasping, dullness, collapse). Preempts. */
  Corrective = 3,
}

export interface GuidanceCue {
  id: string;
  phase: Phase;
  priority: CuePriority;
  /** Spoken/displayed text. */
  text: string;
  /** Suggested delivery: lower = softer, slower TTS / dimmer text. */
  intensity: number;
  at: number;
}

/** Everything the engine can emit toward the UI/audio layer. */
export type EngineEvent =
  | { type: 'phaseChange'; change: PhaseChange }
  | { type: 'cue'; cue: GuidanceCue }
  | { type: 'signals'; at: number; signals: SignalSnapshot };

export type EngineListener = (event: EngineEvent) => void;

/** Clamp helper used across the engine. */
export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
