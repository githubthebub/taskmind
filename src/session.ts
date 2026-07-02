import { BreathAnalyzer } from './breath.js';
import { GuidanceEngine } from './guidance.js';
import { JhanaStateMachine, PartialConfig } from './machine.js';
import { SignalFusion } from './signals.js';
import {
  BiometricSample,
  BreathMark,
  EngineListener,
  Phase,
  SelfReport,
  SignalSnapshot,
} from './types.js';

export interface SessionOptions {
  /** Machine tuning overrides (thresholds, dwell times). */
  config?: PartialConfig;
  /** Hard session length; when reached the machine moves to Emergence. */
  sessionBudgetMs?: number;
  /** Receives phase changes, guidance cues, and throttled signal frames. */
  listener?: EngineListener;
  /** How often `signals` frames are emitted to the listener (ms). */
  signalEmitIntervalMs?: number;
}

/**
 * The complete engine: breath analysis + signal fusion + phase machine +
 * guidance, behind one small API.
 *
 * Usage:
 *   const session = new MeditationSession(performance.now(), { listener });
 *   // drive it:
 *   requestAnimationFrame loop / interval: session.tick(performance.now())
 *   // feed it:
 *   session.breathMark({ t, kind: 'inhaleStart' })
 *   session.selfReport(now, { piti: 0.7 })
 *   session.biometric(now, { heartRate: 62 })
 *
 * Every input path and the tick path are O(1), allocation-light, and free
 * of internal timers, so the engine adds no perceptible latency at any
 * tick rate from 1 Hz to 120 Hz.
 */
export class MeditationSession {
  private readonly breath = new BreathAnalyzer();
  private readonly fusion = new SignalFusion();
  private readonly machine: JhanaStateMachine;
  private readonly guidance = new GuidanceEngine();
  private readonly listener: EngineListener;
  private readonly budgetMs: number;
  private readonly signalEmitIntervalMs: number;

  private readonly startedAt: number;
  private lastSignalEmitAt = -Infinity;
  private ended = false;

  constructor(now: number, opts: SessionOptions = {}) {
    this.machine = new JhanaStateMachine(now, opts.config);
    this.listener = opts.listener ?? (() => {});
    this.budgetMs = opts.sessionBudgetMs ?? Infinity;
    this.signalEmitIntervalMs = opts.signalEmitIntervalMs ?? 250;
    this.startedAt = now;

    // Opening cue: enter Settling explicitly so the UI has something to say.
    this.listener({
      type: 'cue',
      cue: this.guidance.onPhaseChange({
        from: Phase.Settling,
        to: Phase.Settling,
        at: now,
        reason: 'progress',
      }),
    });
  }

  get phase(): Phase {
    return this.machine.phase;
  }

  signals(): SignalSnapshot {
    return this.fusion.snapshot();
  }

  /** Feed a breath event (tap, mic envelope crossing, belt sample edge). */
  breathMark(mark: BreathMark): void {
    if (this.ended) return;
    this.fusion.setBreath(this.breath.mark(mark));
  }

  /** Feed a sparse qualitative check-in. */
  selfReport(now: number, report: SelfReport): void {
    if (this.ended) return;
    // Advance fusion time first so the report's delta is dated correctly
    // for the grasping detector's rate estimate.
    this.fusion.tick(now);
    this.fusion.report(report);
  }

  /** Feed a biometric sample from a wearable, if available. */
  biometric(now: number, sample: BiometricSample): void {
    if (this.ended) return;
    if (sample.respirationRate !== undefined) {
      this.breath.setExternalRate(sample.respirationRate);
      this.fusion.setBreath(this.breath.metrics());
    }
    this.fusion.biometric(sample);
  }

  /** User taps "begin" during Settling. */
  begin(now: number): void {
    this.applyChange(this.machine.requestBegin(now));
  }

  /** User ends the sit. */
  end(now: number): void {
    this.applyChange(this.machine.requestEmergence(now));
    this.ended = true;
  }

  /**
   * Main loop. Call at any steady cadence (rAF, 10 Hz, 1 Hz — all fine).
   */
  tick(now: number): void {
    if (this.ended) return;

    this.fusion.tick(now);
    const snapshot = this.fusion.snapshot();

    // Session budget: guide out gracefully instead of cutting off.
    if (now - this.startedAt >= this.budgetMs && this.machine.phase !== Phase.Emergence) {
      const change = this.machine.requestEmergence(now);
      if (change) {
        change.reason = 'timeout';
        this.listener({ type: 'phaseChange', change });
        this.listener({ type: 'cue', cue: this.guidance.onPhaseChange(change) });
      }
    } else {
      this.applyChange(this.machine.update(now, snapshot));
    }

    const cue = this.guidance.poll(now, this.machine.phase, snapshot, this.machine.holding);
    if (cue) this.listener({ type: 'cue', cue });

    if (now - this.lastSignalEmitAt >= this.signalEmitIntervalMs) {
      this.lastSignalEmitAt = now;
      this.listener({ type: 'signals', at: now, signals: snapshot });
    }
  }

  private applyChange(change: ReturnType<JhanaStateMachine['update']>): void {
    if (!change) return;
    this.listener({ type: 'phaseChange', change });
    this.listener({ type: 'cue', cue: this.guidance.onPhaseChange(change) });
  }
}
