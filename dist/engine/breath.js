export const PROTOCOL_478 = {
    name: '4-7-8',
    inhaleMs: 4000,
    holdMs: 7000,
    exhaleMs: 8000,
};
const PHASE_ORDER = ['inhale', 'hold', 'exhale'];
/**
 * Drift-free breath clock. Phase boundaries are computed from absolute
 * timestamps (performance.now) rather than accumulated frame deltas, so a
 * dropped frame never desynchronizes the haptic/audio boundary cues.
 */
export class BreathEngine {
    constructor(bus, protocol = PROTOCOL_478) {
        this.bus = bus;
        this.protocol = protocol;
        this.phase = 'idle';
        this.phaseIndex = 0;
        this.phaseStartedAt = 0;
        this.sessionStartedAt = 0;
        this.cycleCount = 0;
        this.rafHandle = null;
        this.frame = (now) => {
            if (!this.running)
                return;
            const current = this.phase;
            let duration = this.phaseDuration(current);
            let elapsedInPhase = now - this.phaseStartedAt;
            // Cross as many boundaries as the elapsed time demands (handles tab
            // throttling where one frame gap spans multiple phases).
            while (elapsedInPhase >= duration) {
                const boundaryTime = this.phaseStartedAt + duration;
                const from = this.phase;
                this.phaseIndex = (this.phaseIndex + 1) % PHASE_ORDER.length;
                if (this.phaseIndex === 0)
                    this.cycleCount += 1;
                this.enterPhase(PHASE_ORDER[this.phaseIndex], boundaryTime, from);
                duration = this.phaseDuration(PHASE_ORDER[this.phaseIndex]);
                elapsedInPhase = now - this.phaseStartedAt;
            }
            const tick = {
                phase: this.phase,
                phaseProgress: Math.min(1, elapsedInPhase / duration),
                cycleCount: this.cycleCount,
                elapsedMs: now - this.sessionStartedAt,
            };
            this.bus.emit('tick', tick);
            this.rafHandle = requestAnimationFrame(this.frame);
        };
    }
    get running() {
        return this.phase !== 'idle';
    }
    get cycles() {
        return this.cycleCount;
    }
    start() {
        if (this.running)
            return;
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
    stop() {
        if (!this.running)
            return;
        if (this.rafHandle !== null)
            cancelAnimationFrame(this.rafHandle);
        this.rafHandle = null;
        const from = this.phase;
        this.phase = 'idle';
        this.bus.emit('transition', { from, to: 'idle', cycleCount: this.cycleCount });
    }
    phaseDuration(phase) {
        switch (phase) {
            case 'inhale':
                return this.protocol.inhaleMs;
            case 'hold':
                return this.protocol.holdMs;
            case 'exhale':
                return this.protocol.exhaleMs;
        }
    }
    enterPhase(phase, at, from) {
        this.phase = phase;
        this.phaseStartedAt = at;
        const transition = { from, to: phase, cycleCount: this.cycleCount };
        this.bus.emit('transition', transition);
    }
}
