import type { BreathPhase, BreathProtocol, BreathTick, PhaseTransition } from '../types.js';
import type { EventBus } from '../state/bus.js';

export const PROTOCOL_478: BreathProtocol = {
  name: '4-7-8',
  inhaleMs: 4000,
  holdMs: 7000,
  exhaleMs: 8000,
};

const PHASE_ORDER: readonly Exclude<BreathPhase, 'idle'>[] = ['inhale', 'hold', 'exhale'];

/**
 * Drift-free breath clock. Phase boundaries are computed from absolute
 * timestamps (performance.now) rather than accumulated frame deltas, so a
 * dropped frame never desynchronizes the haptic/audio boundary cues.
 */
export class BreathEngine {
  private phase: BreathPhase = 'idle';
  private phaseIndex = 0;
  private phaseStartedAt = 0;
  private sessionStartedAt = 0;
  private cycleCount = 0;
  private rafHandle: number | null = null;

  constructor(
    private readonly bus: EventBus,
    private readonly protocol: BreathProtocol = PROTOCOL_478,
  ) {}

  get running(): boolean {
    return this.phase !== 'idle';
  }

  get cycles(): number {
    return this.cycleCount;
  }

  start(): void {
    if (this.running) return;
    const now = performance.now();
    this.sessionStartedAt = now;
    this.cycleCount = 0;
    this.phaseIndex = 0;
    // sessionStart must precede the first transition so subscribers (avatar
    // machine, audio) are in their session state before the inhale event lands.
    this.bus.emit('sessionStart', { protocol: this.protocol });
    this.enterPhase('inhale', now, 'idle');
    this.rafHandle = requestAnimationFrame(this.frame);
  }

  stop(): void {
    if (!this.running) return;
    if (this.rafHandle !== null) cancelAnimationFrame(this.rafHandle);
    this.rafHandle = null;
    const from = this.phase;
    this.phase = 'idle';
    this.bus.emit('transition', { from, to: 'idle', cycleCount: this.cycleCount });
  }

  private phaseDuration(phase: Exclude<BreathPhase, 'idle'>): number {
    switch (phase) {
      case 'inhale':
        return this.protocol.inhaleMs;
      case 'hold':
        return this.protocol.holdMs;
      case 'exhale':
        return this.protocol.exhaleMs;
    }
  }

  private enterPhase(phase: Exclude<BreathPhase, 'idle'>, at: number, from: BreathPhase): void {
    this.phase = phase;
    this.phaseStartedAt = at;
    const transition: PhaseTransition = { from, to: phase, cycleCount: this.cycleCount };
    this.bus.emit('transition', transition);
  }

  private readonly frame = (now: number): void => {
    if (!this.running) return;
    const current = this.phase as Exclude<BreathPhase, 'idle'>;
    let duration = this.phaseDuration(current);
    let elapsedInPhase = now - this.phaseStartedAt;

    // Cross as many boundaries as the elapsed time demands (handles tab
    // throttling where one frame gap spans multiple phases).
    while (elapsedInPhase >= duration) {
      const boundaryTime = this.phaseStartedAt + duration;
      const from = this.phase as Exclude<BreathPhase, 'idle'>;
      this.phaseIndex = (this.phaseIndex + 1) % PHASE_ORDER.length;
      if (this.phaseIndex === 0) this.cycleCount += 1;
      this.enterPhase(PHASE_ORDER[this.phaseIndex], boundaryTime, from);
      duration = this.phaseDuration(PHASE_ORDER[this.phaseIndex]);
      elapsedInPhase = now - this.phaseStartedAt;
    }

    const tick: BreathTick = {
      phase: this.phase,
      phaseProgress: Math.min(1, elapsedInPhase / duration),
      cycleCount: this.cycleCount,
      elapsedMs: now - this.sessionStartedAt,
    };
    this.bus.emit('tick', tick);
    this.rafHandle = requestAnimationFrame(this.frame);
  };
}
