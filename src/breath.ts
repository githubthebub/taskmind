import { BreathMark, BreathMetrics, clamp01 } from './types.js';

/**
 * Streaming respiration analysis from discrete breath marks.
 *
 * Every update is O(1): the analyzer keeps exponential moving averages
 * rather than sample buffers, so feedback latency is constant regardless
 * of session length. Marks may come from tap input, an audio envelope
 * detector, or a respiration belt — the analyzer only sees timestamps.
 */
export class BreathAnalyzer {
  /** EMA smoothing factor for period statistics (per breath cycle). */
  private static readonly ALPHA = 0.25;
  /** Ignore marks closer together than this (debounce / double-tap). */
  private static readonly MIN_INTERVAL_MS = 350;
  /** A gap longer than this means the signal dropped; restart statistics. */
  private static readonly MAX_GAP_MS = 30_000;
  /** Cycles needed before metrics are considered trustworthy. */
  private static readonly WARMUP_CYCLES = 3;

  private lastInhaleAt = NaN;
  private lastExhaleAt = NaN;
  private lastMarkAt = NaN;

  /** EMA of full-cycle (inhale-to-inhale) period, ms. */
  private periodEma = NaN;
  /** EMA of squared deviation of period, ms^2 (for regularity). */
  private periodVarEma = 0;
  /** EMA of exhale/inhale duration ratio. */
  private ratioEma = NaN;
  private cycles = 0;

  /** Externally supplied respiration rate (e.g. chest strap), bpm. */
  private externalBpm: number | null = null;

  /** Feed one breath mark. Returns the updated metrics. */
  mark(mark: BreathMark): BreathMetrics {
    const t = mark.t;

    if (!Number.isNaN(this.lastMarkAt)) {
      if (t - this.lastMarkAt < BreathAnalyzer.MIN_INTERVAL_MS) {
        return this.metrics(); // debounce: ignore accidental double events
      }
      if (t - this.lastMarkAt > BreathAnalyzer.MAX_GAP_MS) {
        this.resetStatistics(); // signal dropped; start fresh
      }
    }
    this.lastMarkAt = t;

    if (mark.kind === 'inhaleStart') {
      if (!Number.isNaN(this.lastInhaleAt)) {
        this.observePeriod(t - this.lastInhaleAt);
        // Exhale duration = previous exhaleStart -> this inhaleStart.
        if (!Number.isNaN(this.lastExhaleAt) && this.lastExhaleAt > this.lastInhaleAt) {
          const inhaleDur = this.lastExhaleAt - this.lastInhaleAt;
          const exhaleDur = t - this.lastExhaleAt;
          if (inhaleDur > 0 && exhaleDur > 0) {
            this.observeRatio(exhaleDur / inhaleDur);
          }
        }
      }
      this.lastInhaleAt = t;
    } else {
      this.lastExhaleAt = t;
    }
    return this.metrics();
  }

  /** Accept a respiration rate from a wearable; takes precedence over taps. */
  setExternalRate(bpm: number | null): void {
    this.externalBpm = bpm !== null && bpm > 0 && bpm < 60 ? bpm : null;
  }

  metrics(): BreathMetrics {
    const warmedUp = this.cycles >= BreathAnalyzer.WARMUP_CYCLES || this.externalBpm !== null;
    let bpm = 0;
    if (this.externalBpm !== null) {
      bpm = this.externalBpm;
    } else if (!Number.isNaN(this.periodEma) && this.periodEma > 0) {
      bpm = 60_000 / this.periodEma;
    }

    // Coefficient of variation of the breath period, mapped so that
    // cv = 0 -> regularity 1 and cv >= 0.5 -> regularity 0.
    let regularity = 0;
    if (this.cycles >= BreathAnalyzer.WARMUP_CYCLES && this.periodEma > 0) {
      const cv = Math.sqrt(this.periodVarEma) / this.periodEma;
      regularity = clamp01(1 - cv * 2);
    }

    return {
      bpm,
      regularity,
      exhaleRatio: Number.isNaN(this.ratioEma) ? 1 : this.ratioEma,
      warmedUp,
    };
  }

  private observePeriod(period: number): void {
    if (period <= 0) return;
    if (Number.isNaN(this.periodEma)) {
      this.periodEma = period;
      this.periodVarEma = 0;
    } else {
      const dev = period - this.periodEma;
      this.periodEma += BreathAnalyzer.ALPHA * dev;
      this.periodVarEma += BreathAnalyzer.ALPHA * (dev * dev - this.periodVarEma);
    }
    this.cycles++;
  }

  private observeRatio(ratio: number): void {
    this.ratioEma = Number.isNaN(this.ratioEma)
      ? ratio
      : this.ratioEma + BreathAnalyzer.ALPHA * (ratio - this.ratioEma);
  }

  private resetStatistics(): void {
    this.periodEma = NaN;
    this.periodVarEma = 0;
    this.ratioEma = NaN;
    this.cycles = 0;
    this.lastInhaleAt = NaN;
    this.lastExhaleAt = NaN;
  }
}
