import type { BreathPhase, BreathProfile, PhaseChangeEvent, ProgressEvent } from './types.js';
import { BREATH_PHASES } from './types.js';

type PhaseListener = (e: PhaseChangeEvent) => void;
type ProgressListener = (e: ProgressEvent) => void;

/**
 * Drift-free 4-7-8 breath clock. The single source of truth for phase timing:
 * audio, haptics, lexicon, and the UI orb all subscribe here and keep no
 * clocks of their own. Runs on performance.now() deltas inside rAF, so phase
 * boundaries never accumulate setTimeout error.
 */
export class BreathClock {
  private profile: BreathProfile;
  private phaseIndex = 0;
  private cycle = 0;
  private phaseStartMs = 0;
  private rafId: number | null = null;
  private running = false;
  private phaseListeners = new Set<PhaseListener>();
  private progressListeners = new Set<ProgressListener>();

  constructor(profile: BreathProfile) {
    this.profile = profile;
  }

  get phase(): BreathPhase {
    return BREATH_PHASES[this.phaseIndex] ?? 'inhale';
  }

  get isRunning(): boolean {
    return this.running;
  }

  onPhaseChange(fn: PhaseListener): () => void {
    this.phaseListeners.add(fn);
    return () => this.phaseListeners.delete(fn);
  }

  onProgress(fn: ProgressListener): () => void {
    this.progressListeners.add(fn);
    return () => this.progressListeners.delete(fn);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.phaseIndex = 0;
    this.cycle = 0;
    this.phaseStartMs = performance.now();
    this.emitPhase();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private phaseDurationMs(phase: BreathPhase): number {
    switch (phase) {
      case 'inhale':
        return this.profile.inhaleSec * 1000;
      case 'hold':
        return this.profile.holdSec * 1000;
      case 'exhale':
        return this.profile.exhaleSec * 1000;
    }
  }

  private tick = (now: number): void => {
    if (!this.running) return;
    let duration = this.phaseDurationMs(this.phase);
    let elapsed = now - this.phaseStartMs;

    // Advance across as many boundaries as the elapsed time covers (handles
    // background-tab rAF starvation without drifting the schedule).
    while (elapsed >= duration) {
      this.phaseStartMs += duration;
      this.phaseIndex = (this.phaseIndex + 1) % BREATH_PHASES.length;
      if (this.phaseIndex === 0) this.cycle += 1;
      this.emitPhase();
      elapsed = now - this.phaseStartMs;
      duration = this.phaseDurationMs(this.phase);
    }

    const t = Math.min(1, Math.max(0, elapsed / duration));
    const progress: ProgressEvent = {
      phase: this.phase,
      t,
      remainingSec: Math.max(0, (duration - elapsed) / 1000),
    };
    for (const fn of this.progressListeners) fn(progress);

    this.rafId = requestAnimationFrame(this.tick);
  };

  private emitPhase(): void {
    const e: PhaseChangeEvent = { phase: this.phase, cycle: this.cycle };
    for (const fn of this.phaseListeners) fn(e);
  }
}
