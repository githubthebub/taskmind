/**
 * Behavioral State Engine — Yerkes-Dodson arousal model.
 *
 * Maintains the current arousal archetype, enforces a local JSON
 * state-transition matrix, and mediates the somatic breathing gate:
 * a user-initiated move into 'hyper' is intercepted and only commits
 * once the unskippable 4-7-8 overlay reports completion.
 */
import type {
  ArousalArchetype,
  ArchetypeProfile,
  IStateEngine,
  PerformanceSample,
  StateEngineEvents,
  StateTransition,
} from '../types.js';

export const ARCHETYPE_PROFILES: Record<ArousalArchetype, ArchetypeProfile> = {
  sluggish: {
    id: 'sluggish',
    label: 'Sluggish / Low-Tempo',
    description:
      'Under-aroused. Maximum visual contrast and a 2.5x tempo multiplier prompt a noradrenergic alerting response.',
    tempoMultiplier: 2.5,
    contrastMode: 'max',
    requiresBreathingGate: false,
    puzzleMode: 'high-tempo',
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced / Deep-Work',
    description:
      'Optimal arousal. Standard tempo; the goal state. Once verified, the engine directs you out of the app and onto the real task.',
    tempoMultiplier: 1.0,
    contrastMode: 'normal',
    requiresBreathingGate: false,
    puzzleMode: 'standard',
  },
  hyper: {
    id: 'hyper',
    label: 'Hyper-Arousal / Restless',
    description:
      'Over-aroused. Entry is gated behind an unskippable 4-7-8 breathing cycle (vagal downregulation), then a slow, high-precision puzzle iteration.',
    tempoMultiplier: 0.6,
    contrastMode: 'normal',
    requiresBreathingGate: true,
    puzzleMode: 'high-precision',
  },
};

/** Local JSON state-transition matrix. Serializable; overridable via the store. */
export const DEFAULT_STATE_MATRIX: StateTransition[] = [
  // Explicit user self-reports are always legal entry points.
  { from: 'balanced', to: 'sluggish', trigger: 'user-select', minFocusSeconds: 0 },
  { from: 'balanced', to: 'hyper', trigger: 'user-select', minFocusSeconds: 0 },
  { from: 'sluggish', to: 'hyper', trigger: 'user-select', minFocusSeconds: 0 },
  { from: 'sluggish', to: 'balanced', trigger: 'user-select', minFocusSeconds: 0 },
  { from: 'hyper', to: 'sluggish', trigger: 'user-select', minFocusSeconds: 0 },
  { from: 'hyper', to: 'balanced', trigger: 'user-select', minFocusSeconds: 0 },
  // Gate completion commits the pending hyper entry.
  { from: 'balanced', to: 'hyper', trigger: 'breathing-complete', minFocusSeconds: 0 },
  { from: 'sluggish', to: 'hyper', trigger: 'breathing-complete', minFocusSeconds: 0 },
  // Performance-driven regulation toward the balanced optimum.
  { from: 'hyper', to: 'balanced', trigger: 'performance-rise', minFocusSeconds: 120 },
  { from: 'sluggish', to: 'balanced', trigger: 'performance-rise', minFocusSeconds: 90 },
  { from: 'balanced', to: 'sluggish', trigger: 'performance-drop', minFocusSeconds: 60 },
  { from: 'balanced', to: 'hyper', trigger: 'performance-drop', minFocusSeconds: 60 },
  // Verified block-clearing quotas also earn the way back to balanced.
  { from: 'hyper', to: 'balanced', trigger: 'quota-verified', minFocusSeconds: 60 },
  { from: 'sluggish', to: 'balanced', trigger: 'quota-verified', minFocusSeconds: 45 },
];

/** Seconds of sustained balanced-state focus required before verification. */
const BALANCED_VERIFY_SECONDS = 180;
/** Error-rate ceiling and match-rate floor for a sample to count as "clean". */
const CLEAN_ERROR_CEILING = 0.3;
const CLEAN_MATCH_FLOOR = 2;
/** Rolling window of recent performance samples. */
const SAMPLE_WINDOW = 12;

export class StateEngine implements IStateEngine {
  private state: ArousalArchetype;
  private readonly events: StateEngineEvents;
  private readonly transitions: StateTransition[];
  /** Target awaiting breathing-gate completion, if any. */
  private pendingGateTarget: ArousalArchetype | null = null;
  /** Archetype the gate was requested from (transition source). */
  private gateSource: ArousalArchetype | null = null;
  /** Accumulated verified focus seconds in the current state. */
  private focusInState = 0;
  private lastFocusTotal = 0;
  private samples: PerformanceSample[] = [];
  private balancedVerifiedFired = false;

  constructor(
    events: StateEngineEvents,
    initial: ArousalArchetype = 'balanced',
    matrixOverride: StateTransition[] | null = null,
  ) {
    this.events = events;
    this.state = initial;
    this.transitions = matrixOverride ?? DEFAULT_STATE_MATRIX;
  }

  get current(): ArousalArchetype {
    return this.state;
  }

  get profile(): ArchetypeProfile {
    return ARCHETYPE_PROFILES[this.state];
  }

  get matrix(): StateTransition[] {
    return this.transitions.map((t) => ({ ...t }));
  }

  /** True while a hyper entry is intercepted, awaiting the breathing overlay. */
  get gatePending(): boolean {
    return this.pendingGateTarget !== null;
  }

  requestTransition(target: ArousalArchetype, trigger: StateTransition['trigger']): boolean {
    if (target === this.state && this.pendingGateTarget === null) return false;
    const rule = this.transitions.find(
      (t) => t.from === this.state && t.to === target && t.trigger === trigger,
    );
    if (!rule) return false;
    if (this.focusInState < rule.minFocusSeconds) return false;

    if (ARCHETYPE_PROFILES[target].requiresBreathingGate && trigger !== 'breathing-complete') {
      // Intercept: do not commit until the somatic gate completes.
      this.pendingGateTarget = target;
      this.gateSource = this.state;
      this.events.onBreathingGateRequired(target);
      return true;
    }
    this.commit(target);
    return true;
  }

  notifyBreathingComplete(): void {
    if (this.pendingGateTarget === null) return;
    const target = this.pendingGateTarget;
    this.pendingGateTarget = null;
    this.gateSource = null;
    this.commit(target);
  }

  reportPerformance(sample: PerformanceSample): void {
    const delta = sample.focusSeconds - this.lastFocusTotal;
    this.lastFocusTotal = sample.focusSeconds;
    if (delta > 0 && delta < 30) this.focusInState += delta;

    this.samples.push(sample);
    if (this.samples.length > SAMPLE_WINDOW) this.samples.shift();
    this.evaluateAutoTransitions();
    this.evaluateBalancedVerification();
  }

  serialize(): string {
    return JSON.stringify(
      {
        current: this.state,
        focusInState: Math.round(this.focusInState),
        pendingGateTarget: this.pendingGateTarget,
        matrix: this.transitions,
      },
      null,
      2,
    );
  }

  private commit(target: ArousalArchetype): void {
    const prev = this.state;
    this.state = target;
    this.focusInState = 0;
    this.balancedVerifiedFired = false;
    this.samples = [];
    this.events.onStateChange(prev, target, ARCHETYPE_PROFILES[target]);
  }

  private cleanSampleRatio(): number {
    if (this.samples.length === 0) return 0;
    const clean = this.samples.filter(
      (s) => s.errorRate <= CLEAN_ERROR_CEILING && s.matchesPerMinute >= CLEAN_MATCH_FLOOR,
    ).length;
    return clean / this.samples.length;
  }

  private evaluateAutoTransitions(): void {
    if (this.pendingGateTarget !== null || this.samples.length < SAMPLE_WINDOW / 2) return;
    const ratio = this.cleanSampleRatio();
    if (this.state !== 'balanced' && ratio >= 0.75) {
      this.requestTransition('balanced', 'performance-rise');
    } else if (this.state === 'balanced' && ratio <= 0.2) {
      // Frantic (high error at speed) reads as hyper; stalled reads as sluggish.
      const recent = this.samples[this.samples.length - 1];
      const target: ArousalArchetype =
        recent.errorRate > CLEAN_ERROR_CEILING && recent.matchesPerMinute >= CLEAN_MATCH_FLOOR
          ? 'hyper'
          : 'sluggish';
      this.requestTransition(target, 'performance-drop');
    }
  }

  private evaluateBalancedVerification(): void {
    if (this.state !== 'balanced' || this.balancedVerifiedFired) return;
    if (this.focusInState >= BALANCED_VERIFY_SECONDS && this.cleanSampleRatio() >= 0.6) {
      this.balancedVerifiedFired = true;
      this.events.onBalancedVerified();
    }
  }
}
