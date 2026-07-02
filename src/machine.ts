import {
  PHASE_DEPTH,
  Phase,
  PhaseChange,
  SignalSnapshot,
  TransitionReason,
} from './types.js';

/**
 * Tunable thresholds and dwell times for the phase graph.
 *
 * Design principles:
 *  - progression requires a minimum dwell (samadhi needs marination time);
 *  - every advance criterion has a lower regression criterion (hysteresis),
 *    so the machine never oscillates at a boundary;
 *  - grasping never *punishes*: it first holds progression, and only after
 *    sustained over-excitement does it step back one phase, paired with
 *    reassuring guidance rather than failure framing.
 */
export interface MachineConfig {
  /** Minimum time (ms) in each phase before progression is considered. */
  dwell: Record<Phase, number>;
  /** Minimum time (ms) in a phase before regression is considered. */
  regressionHoldMs: number;
  grasping: {
    /** Above this risk, progression is frozen. */
    hold: number;
    /** Above this risk for `sustainMs`, the state collapses one phase. */
    collapse: number;
    sustainMs: number;
  };
  advance: {
    settlingStability: number;
    accessStability: number;
    accessPleasantness: number;
    pitiStability: number;
    pitiIntensity: number;
    transitionPiti: number;
    transitionSukha: number;
    transitionMaxEffort: number;
    jhana2Stability: number;
    jhana2MaxEffort: number;
    jhana2MinPiti: number;
  };
  regress: {
    /** PitiCultivation -> Access when stability drops below this. */
    pitiStabilityExit: number;
    /** Transition -> PitiCultivation when piti drops below this. */
    transitionPitiExit: number;
    /** Jhana1 -> PitiCultivation when both factors drop below these. */
    jhana1PitiExit: number;
    jhana1SukhaExit: number;
    /** Jhana2 -> Jhana1 when effort re-arises above this. */
    jhana2EffortExit: number;
  };
}

export const DEFAULT_CONFIG: MachineConfig = {
  dwell: {
    [Phase.Settling]: 90_000,
    [Phase.Access]: 180_000,
    [Phase.PitiCultivation]: 120_000,
    [Phase.Transition]: 90_000,
    [Phase.Jhana1]: 300_000,
    [Phase.Jhana2]: Infinity, // nothing deeper to advance to (yet)
    [Phase.Emergence]: Infinity,
  },
  regressionHoldMs: 20_000,
  grasping: { hold: 0.5, collapse: 0.75, sustainMs: 15_000 },
  advance: {
    settlingStability: 0.35,
    accessStability: 0.6,
    accessPleasantness: 0.5,
    pitiStability: 0.65,
    pitiIntensity: 0.5,
    transitionPiti: 0.65,
    transitionSukha: 0.5,
    transitionMaxEffort: 0.4,
    jhana2Stability: 0.8,
    jhana2MaxEffort: 0.25,
    jhana2MinPiti: 0.5,
  },
  regress: {
    pitiStabilityExit: 0.35,
    transitionPitiExit: 0.25,
    jhana1PitiExit: 0.3,
    jhana1SukhaExit: 0.3,
    jhana2EffortExit: 0.5,
  },
};

/** Merge a partial config over the defaults (one level deep per section). */
export function makeConfig(overrides?: PartialConfig): MachineConfig {
  if (!overrides) return DEFAULT_CONFIG;
  return {
    dwell: { ...DEFAULT_CONFIG.dwell, ...overrides.dwell },
    regressionHoldMs: overrides.regressionHoldMs ?? DEFAULT_CONFIG.regressionHoldMs,
    grasping: { ...DEFAULT_CONFIG.grasping, ...overrides.grasping },
    advance: { ...DEFAULT_CONFIG.advance, ...overrides.advance },
    regress: { ...DEFAULT_CONFIG.regress, ...overrides.regress },
  };
}

export interface PartialConfig {
  dwell?: Partial<Record<Phase, number>>;
  regressionHoldMs?: number;
  grasping?: Partial<MachineConfig['grasping']>;
  advance?: Partial<MachineConfig['advance']>;
  regress?: Partial<MachineConfig['regress']>;
}

/**
 * The phase state machine. Pure with respect to time: every decision is a
 * function of (phase, signals, now), so behavior is fully reproducible.
 */
export class JhanaStateMachine {
  readonly config: MachineConfig;

  private _phase: Phase = Phase.Settling;
  private _enteredAt: number;
  /** When graspingRisk first exceeded the collapse threshold, or NaN. */
  private graspingSince = NaN;
  /** True while progression is frozen by the grasping detector. */
  private _holding = false;

  constructor(startAt: number, config?: PartialConfig) {
    this.config = makeConfig(config);
    this._enteredAt = startAt;
  }

  get phase(): Phase {
    return this._phase;
  }

  get enteredAt(): number {
    return this._enteredAt;
  }

  /** True when the grasping detector is currently freezing progression. */
  get holding(): boolean {
    return this._holding;
  }

  timeInPhase(now: number): number {
    return now - this._enteredAt;
  }

  /**
   * Evaluate the phase graph against the latest signals.
   * Returns a PhaseChange if one occurred, else null.
   */
  update(now: number, s: SignalSnapshot): PhaseChange | null {
    if (this._phase === Phase.Emergence) return null;

    const collapse = this.trackGrasping(now, s);
    if (collapse) return collapse;

    const regression = this.checkRegression(now, s);
    if (regression) return regression;

    if (this._holding) return null; // grasping: hold depth, don't advance
    return this.checkProgression(now, s);
  }

  /** Explicit user action: end the sit gently. */
  requestEmergence(now: number): PhaseChange | null {
    if (this._phase === Phase.Emergence) return null;
    return this.transition(now, Phase.Emergence, 'user');
  }

  /** Explicit user action: "I'm settled, begin" (skips the settling dwell). */
  requestBegin(now: number): PhaseChange | null {
    if (this._phase !== Phase.Settling) return null;
    return this.transition(now, Phase.Access, 'user');
  }

  // --- internals -----------------------------------------------------------

  private trackGrasping(now: number, s: SignalSnapshot): PhaseChange | null {
    const g = this.config.grasping;
    this._holding = s.graspingRisk >= g.hold;

    if (s.graspingRisk >= g.collapse) {
      if (Number.isNaN(this.graspingSince)) this.graspingSince = now;
      const deepEnoughToCollapse = PHASE_DEPTH[this._phase] >= PHASE_DEPTH[Phase.Transition];
      if (deepEnoughToCollapse && now - this.graspingSince >= g.sustainMs) {
        this.graspingSince = NaN;
        return this.transition(now, this.oneStepBack(), 'grasping');
      }
    } else {
      this.graspingSince = NaN;
    }
    return null;
  }

  private checkRegression(now: number, s: SignalSnapshot): PhaseChange | null {
    if (this.timeInPhase(now) < this.config.regressionHoldMs) return null;
    const r = this.config.regress;

    switch (this._phase) {
      case Phase.PitiCultivation:
        if (s.stability < r.pitiStabilityExit) {
          return this.transition(now, Phase.Access, 'regression');
        }
        return null;
      case Phase.Transition:
        if (s.piti < r.transitionPitiExit) {
          return this.transition(now, Phase.PitiCultivation, 'regression');
        }
        return null;
      case Phase.Jhana1:
        if (s.piti < r.jhana1PitiExit && s.sukha < r.jhana1SukhaExit) {
          return this.transition(now, Phase.PitiCultivation, 'regression');
        }
        return null;
      case Phase.Jhana2:
        if (s.effort > r.jhana2EffortExit) {
          return this.transition(now, Phase.Jhana1, 'regression');
        }
        return null;
      default:
        return null;
    }
  }

  private checkProgression(now: number, s: SignalSnapshot): PhaseChange | null {
    if (this.timeInPhase(now) < this.config.dwell[this._phase]) return null;
    const a = this.config.advance;

    switch (this._phase) {
      case Phase.Settling:
        if (s.stability >= a.settlingStability) {
          return this.transition(now, Phase.Access, 'progress');
        }
        return null;
      case Phase.Access:
        if (s.stability >= a.accessStability && s.pleasantness >= a.accessPleasantness) {
          return this.transition(now, Phase.PitiCultivation, 'progress');
        }
        return null;
      case Phase.PitiCultivation:
        if (s.stability >= a.pitiStability && s.piti >= a.pitiIntensity) {
          return this.transition(now, Phase.Transition, 'progress');
        }
        return null;
      case Phase.Transition:
        if (
          s.piti >= a.transitionPiti &&
          s.sukha >= a.transitionSukha &&
          s.effort <= a.transitionMaxEffort
        ) {
          return this.transition(now, Phase.Jhana1, 'progress');
        }
        return null;
      case Phase.Jhana1:
        if (
          s.stability >= a.jhana2Stability &&
          s.effort <= a.jhana2MaxEffort &&
          s.piti >= a.jhana2MinPiti
        ) {
          return this.transition(now, Phase.Jhana2, 'progress');
        }
        return null;
      default:
        return null;
    }
  }

  private oneStepBack(): Phase {
    switch (this._phase) {
      case Phase.Jhana2:
        return Phase.Jhana1;
      case Phase.Jhana1:
        return Phase.Transition;
      case Phase.Transition:
        return Phase.PitiCultivation;
      case Phase.PitiCultivation:
        return Phase.Access;
      default:
        return Phase.Settling;
    }
  }

  private transition(now: number, to: Phase, reason: TransitionReason): PhaseChange {
    const change: PhaseChange = { from: this._phase, to, at: now, reason };
    this._phase = to;
    this._enteredAt = now;
    this.graspingSince = NaN;
    this._holding = false;
    return change;
  }
}
