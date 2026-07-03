import type { EventBus } from '../state/bus.js';

/**
 * Tactile pacing grid built on navigator.vibrate.
 *
 * At every phase boundary of the breath loop the device emits a distinct
 * double-pulse micro-sequence — 30ms pulse, 50ms gap, 30ms pulse — giving the
 * user a single tactile anchor point on the device glass at the exact moment
 * the breath instruction changes. Cycle completion gets a slightly longer
 * triple signature so it is distinguishable without looking at the screen.
 */
export const BOUNDARY_PULSE: readonly number[] = [30, 50, 30];
export const CYCLE_PULSE: readonly number[] = [30, 50, 30, 120, 60];

export class HapticGrid {
  private enabled = true;
  private readonly supported: boolean;

  constructor(bus: EventBus) {
    this.supported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

    bus.on('transition', ({ from, to, cycleCount }) => {
      if (to === 'idle') return;
      // A cycle completes when exhale wraps back to inhale.
      if (from === 'exhale' && to === 'inhale' && cycleCount > 0) {
        this.pulse(CYCLE_PULSE);
      } else {
        this.pulse(BOUNDARY_PULSE);
      }
    });

    bus.on('sessionEnd', () => this.cancel());
  }

  get available(): boolean {
    return this.supported;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.cancel();
  }

  private pulse(pattern: readonly number[]): void {
    if (!this.enabled || !this.supported) return;
    try {
      navigator.vibrate([...pattern]);
    } catch {
      // Some browsers throw before a user gesture — silently skip.
    }
  }

  private cancel(): void {
    if (!this.supported) return;
    try {
      navigator.vibrate(0);
    } catch {
      /* no-op */
    }
  }
}
