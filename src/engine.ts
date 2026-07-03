/**
 * BehavioralMatrixEngine — local JSON state-transition engine over the
 * Yerkes–Dodson arousal model.
 *
 * Telemetry (action tempo, error rate, latency, idleness) is folded into a
 * single normalized arousal index. The engine walks a declarative JSON rule
 * table with hysteresis and dwell-time debouncing, and emits the side effect
 * each state entry demands:
 *
 *   HYPER    → FREEZE_AND_BREATHE  (input freeze + 4-7-8 vagal downshift)
 *   SLUGGISH → TEMPO_BOOST         (2.5× game tempo + contrast scaling)
 *   BALANCED → EXIT_PROMPT         (exit-driven UX: leave the app)
 *
 * Everything is deterministic and locally computed — no clocks are read
 * internally; callers pass timestamps in, which keeps the engine pure and
 * unit-testable.
 */

const DEFAULT_ENGINE_CONFIG: MatrixEngineConfig = {
  initial: 'BALANCED',
  hysteresis: 0.05,
  rules: [
    { from: '*', to: 'SLUGGISH', min: 0.0, max: 0.33, dwellMs: 4000, action: 'TEMPO_BOOST' },
    { from: '*', to: 'BALANCED', min: 0.33, max: 0.7, dwellMs: 6000, action: 'EXIT_PROMPT' },
    { from: '*', to: 'HYPER', min: 0.7, max: 1.01, dwellMs: 2500, action: 'FREEZE_AND_BREATHE' },
  ],
};

/**
 * Fold one telemetry sample into a 0..1 arousal index.
 * High tempo, high error rate and low latency read as high arousal;
 * idleness and long latencies read as low arousal.
 */
function computeArousalIndex(s: MetricsSample): number {
  const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
  // 40 actions/min is treated as flat-out for this task class.
  const tempo = clamp01(s.actionsPerMinute / 40);
  const errors = clamp01(s.errorRate / 0.5);
  // 3s+ to first input on a piece reads as fully sluggish.
  const alacrity = clamp01(1 - s.meanLatencyMs / 3000);
  const engagement = clamp01(1 - s.idleRatio / 0.6);
  const index = 0.4 * tempo + 0.25 * errors + 0.2 * alacrity + 0.15 * engagement;
  return clamp01(index);
}

class BehavioralMatrixEngine {
  private config: MatrixEngineConfig;
  private state: FocusStateId;
  private listeners: StateChangeListener[] = [];
  private candidate: { to: FocusStateId; since: number } | null = null;
  private timeInState: Record<FocusStateId, number> = { SLUGGISH: 0, BALANCED: 0, HYPER: 0 };
  private lastSampleT: number | null = null;
  /** ms of continuous residence in the current state */
  private stateEnteredAt = 0;

  constructor(config?: MatrixEngineConfig) {
    this.config = config ?? DEFAULT_ENGINE_CONFIG;
    this.state = this.config.initial;
  }

  get currentState(): FocusStateId {
    return this.state;
  }

  get stateResidencyMs(): number {
    return this.lastSampleT === null ? 0 : this.lastSampleT - this.stateEnteredAt;
  }

  get timeInStateMs(): Record<FocusStateId, number> {
    return { ...this.timeInState };
  }

  onStateChange(listener: StateChangeListener): void {
    this.listeners.push(listener);
  }

  /** The full rule table, exposed for the blueprint's audit checklist. */
  get transitionTable(): MatrixEngineConfig {
    return JSON.parse(JSON.stringify(this.config)) as MatrixEngineConfig;
  }

  /**
   * Ingest one telemetry sample. Returns the arousal reading so the HUD can
   * render it. Fires state-change listeners when a dwell-debounced rule trips.
   */
  ingest(sample: MetricsSample): ArousalReading {
    const index = computeArousalIndex(sample);
    const reading: ArousalReading = { index, sample };

    if (this.lastSampleT !== null) {
      this.timeInState[this.state] += Math.max(0, sample.t - this.lastSampleT);
    } else {
      this.stateEnteredAt = sample.t;
    }
    this.lastSampleT = sample.t;

    const target = this.matchRule(index);
    if (target === null || target.to === this.state) {
      this.candidate = null;
      return reading;
    }

    if (this.candidate === null || this.candidate.to !== target.to) {
      this.candidate = { to: target.to, since: sample.t };
    }
    if (sample.t - this.candidate.since >= target.dwellMs) {
      const from = this.state;
      this.state = target.to;
      this.stateEnteredAt = sample.t;
      this.candidate = null;
      const ev: StateChangeEvent = { from, to: target.to, action: target.action, reading };
      for (const listener of this.listeners) listener(ev);
    }
    return reading;
  }

  /**
   * Find the rule whose band contains the index, widening the current
   * state's own band by the hysteresis margin so readings hovering at a
   * boundary don't thrash.
   */
  private matchRule(index: number): StateTransitionRule | null {
    const h = this.config.hysteresis;
    for (const rule of this.config.rules) {
      if (rule.from !== '*' && rule.from !== this.state) continue;
      let lo = rule.min;
      let hi = rule.max;
      if (rule.to === this.state) {
        lo -= h;
        hi += h;
      }
      if (index >= lo && index < hi) return rule;
    }
    return null;
  }
}
