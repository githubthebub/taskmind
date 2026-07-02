import {
  BiometricSample,
  BreathMetrics,
  SelfReport,
  SignalSnapshot,
  clamp01,
} from './types.js';

/**
 * Fuses sparse self-reports, continuous breath metrics, and optional
 * biometrics into one smooth, low-latency view of the meditator.
 *
 * Model, per qualitative signal:
 *  - a self-report snaps the signal most of the way to the reported value;
 *  - between reports the signal relaxes exponentially toward a resting
 *    target (a sensor-derived estimate for stability, zero for the rest),
 *    because absorption factors fade when not refreshed;
 *  - biometrics modulate effort/arousal rather than replacing reports.
 *
 * Everything is O(1) per call. No allocation happens on the tick path
 * except the returned snapshot object.
 */

/** How strongly a fresh self-report overrides the current estimate. */
const REPORT_WEIGHT = 0.8;

/** Exponential time constants (ms) for relaxation between reports. */
const TAU = {
  stability: 90_000, // drifts toward breath-derived estimate
  pleasantness: 300_000,
  piti: 240_000,
  sukha: 300_000,
  effort: 60_000, // striving releases fairly quickly once noticed
} as const;

/** Grasping detector tuning. */
const GRASPING = {
  /** Piti rising this fast (units per minute) saturates the rise term. */
  pitiRiseSaturation: 0.3,
  /** Smoothing time constant for the risk output (fast: ~5 s). */
  tauMs: 5_000,
  weights: { rise: 0.5, effort: 0.35, arousal: 0.3 },
} as const;

/** Heart-rate deviation (bpm above baseline) that saturates arousal. */
const HR_AROUSAL_SPAN = 15;
/** Time constant for the resting heart-rate baseline. */
const HR_BASELINE_TAU = 120_000;

function decayFactor(dt: number, tau: number): number {
  return Math.exp(-dt / tau);
}

export class SignalFusion {
  private stability = 0.2;
  private pleasantness = 0;
  private piti = 0;
  private sukha = 0;
  private effort = 0.3; // people usually arrive striving a little

  private graspingRisk = 0;
  /** EMA of d(piti)/dt in units per ms, for the grasping detector. */
  private pitiRate = 0;
  /**
   * Piti as of the previous tick. The rise detector diffs against this
   * rather than a within-tick value so that self-report jumps (which land
   * between ticks) are seen by the grasping detector.
   */
  private pitiAtLastTick = 0;

  private hrBaseline = NaN;
  private arousal = 0;

  private breath: BreathMetrics = {
    bpm: 0,
    regularity: 0,
    exhaleRatio: 1,
    warmedUp: false,
  };

  private lastTickAt = NaN;

  /** Latest breath metrics from the analyzer. */
  setBreath(metrics: BreathMetrics): void {
    this.breath = metrics;
  }

  /** Apply a (possibly partial) self-report. */
  report(report: SelfReport): void {
    const blend = (current: number, reported: number | undefined): number =>
      reported === undefined
        ? current
        : clamp01(current + REPORT_WEIGHT * (clamp01(reported) - current));

    this.stability = blend(this.stability, report.focus);
    this.pleasantness = blend(this.pleasantness, report.pleasantness);
    this.piti = blend(this.piti, report.piti);
    this.sukha = blend(this.sukha, report.sukha);
    this.effort = blend(this.effort, report.effort);
  }

  /** Apply a biometric sample. */
  biometric(sample: BiometricSample): void {
    if (sample.heartRate !== undefined && sample.heartRate > 20) {
      const hr = sample.heartRate;
      if (Number.isNaN(this.hrBaseline)) {
        this.hrBaseline = hr;
      } else {
        // The baseline tracks slowly so transient spikes read as arousal.
        this.hrBaseline += (1 - decayFactor(1_000, HR_BASELINE_TAU)) * (hr - this.hrBaseline);
      }
      this.arousal = clamp01((hr - this.hrBaseline) / HR_AROUSAL_SPAN);
    }
    if (sample.hrvRmssd !== undefined && sample.hrvRmssd > 0) {
      // Rising vagal tone gently confirms ease; it never *creates* sukha,
      // it only stops the fade while the nervous system agrees.
      if (sample.hrvRmssd > 60) {
        this.effort = clamp01(this.effort - 0.02);
      }
    }
  }

  /**
   * Advance internal time to `now`, applying relaxation and updating the
   * grasping detector. Call at UI frame rate or slower; cost is constant.
   */
  tick(now: number): void {
    if (Number.isNaN(this.lastTickAt)) {
      this.lastTickAt = now;
      return;
    }
    const dt = now - this.lastTickAt;
    if (dt <= 0) return;
    this.lastTickAt = now;

    // Stability relaxes toward what the breath rhythm indicates. Until the
    // analyzer warms up, it drifts toward a neutral prior instead.
    const stabilityTarget = this.breath.warmedUp ? this.breath.regularity : 0.3;
    this.stability = relax(this.stability, stabilityTarget, dt, TAU.stability);

    this.pleasantness = relax(this.pleasantness, 0, dt, TAU.pleasantness);
    this.piti = relax(this.piti, 0, dt, TAU.piti);
    this.sukha = relax(this.sukha, 0, dt, TAU.sukha);
    // Effort relaxes toward the arousal floor: a racing heart keeps some
    // striving in the picture even without a report.
    this.effort = relax(this.effort, this.arousal * 0.5, dt, TAU.effort);

    // --- Grasping detector -------------------------------------------------
    const instantRate = (this.piti - this.pitiAtLastTick) / dt; // units per ms
    this.pitiAtLastTick = this.piti;
    const k = 1 - decayFactor(dt, GRASPING.tauMs);
    this.pitiRate += k * (instantRate - this.pitiRate);

    const risePerMin = Math.max(0, this.pitiRate * 60_000);
    const rise = clamp01(risePerMin / GRASPING.pitiRiseSaturation);
    const rawRisk = clamp01(
      GRASPING.weights.rise * rise +
        GRASPING.weights.effort * this.effort +
        GRASPING.weights.arousal * this.arousal,
    );
    this.graspingRisk += k * (rawRisk - this.graspingRisk);
  }

  snapshot(): SignalSnapshot {
    return {
      stability: this.stability,
      pleasantness: this.pleasantness,
      piti: this.piti,
      sukha: this.sukha,
      effort: this.effort,
      graspingRisk: this.graspingRisk,
      breath: this.breath,
    };
  }
}

function relax(value: number, target: number, dt: number, tau: number): number {
  return target + (value - target) * decayFactor(dt, tau);
}
