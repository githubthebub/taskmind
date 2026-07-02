import { BREATH_PHASES } from './types.js';
/**
 * Drift-free 4-7-8 breath clock. The single source of truth for phase timing:
 * audio, haptics, lexicon, and the UI orb all subscribe here and keep no
 * clocks of their own. Runs on performance.now() deltas inside rAF, so phase
 * boundaries never accumulate setTimeout error.
 */
export class BreathClock {
    constructor(profile) {
        this.phaseIndex = 0;
        this.cycle = 0;
        this.phaseStartMs = 0;
        this.rafId = null;
        this.running = false;
        this.phaseListeners = new Set();
        this.progressListeners = new Set();
        this.tick = (now) => {
            if (!this.running)
                return;
            let duration = this.phaseDurationMs(this.phase);
            let elapsed = now - this.phaseStartMs;
            // Advance across as many boundaries as the elapsed time covers (handles
            // background-tab rAF starvation without drifting the schedule).
            while (elapsed >= duration) {
                this.phaseStartMs += duration;
                this.phaseIndex = (this.phaseIndex + 1) % BREATH_PHASES.length;
                if (this.phaseIndex === 0)
                    this.cycle += 1;
                this.emitPhase();
                elapsed = now - this.phaseStartMs;
                duration = this.phaseDurationMs(this.phase);
            }
            const t = Math.min(1, Math.max(0, elapsed / duration));
            const progress = {
                phase: this.phase,
                t,
                remainingSec: Math.max(0, (duration - elapsed) / 1000),
            };
            for (const fn of this.progressListeners)
                fn(progress);
            this.rafId = requestAnimationFrame(this.tick);
        };
        this.profile = profile;
    }
    get phase() {
        return BREATH_PHASES[this.phaseIndex] ?? 'inhale';
    }
    get isRunning() {
        return this.running;
    }
    onPhaseChange(fn) {
        this.phaseListeners.add(fn);
        return () => this.phaseListeners.delete(fn);
    }
    onProgress(fn) {
        this.progressListeners.add(fn);
        return () => this.progressListeners.delete(fn);
    }
    start() {
        if (this.running)
            return;
        this.running = true;
        this.phaseIndex = 0;
        this.cycle = 0;
        this.phaseStartMs = performance.now();
        this.emitPhase();
        this.rafId = requestAnimationFrame(this.tick);
    }
    stop() {
        this.running = false;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
    phaseDurationMs(phase) {
        switch (phase) {
            case 'inhale':
                return this.profile.inhaleSec * 1000;
            case 'hold':
                return this.profile.holdSec * 1000;
            case 'exhale':
                return this.profile.exhaleSec * 1000;
        }
    }
    emitPhase() {
        const e = { phase: this.phase, cycle: this.cycle };
        for (const fn of this.phaseListeners)
            fn(e);
    }
}
