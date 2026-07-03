/**
 * Focus verification and milestone gating.
 *
 * Companion progression is earned, never granted: a cycle only counts as
 * "verified" if the tab stayed visible and focused for its entire duration.
 * Switching apps, backgrounding the tab, or stopping mid-cycle breaks the
 * current run — remaining cycles still complete, they just don't verify.
 */
export const MILESTONES = [
    { id: 'first-contact', title: 'First Contact', cyclesRequired: 1, unlocksLevel: 1 },
    { id: 'settling', title: 'Settling In', cyclesRequired: 5, unlocksLevel: 2 },
    { id: 'steady-flame', title: 'Steady Flame', cyclesRequired: 15, unlocksLevel: 3 },
    { id: 'deep-current', title: 'Deep Current', cyclesRequired: 40, unlocksLevel: 4 },
    { id: 'still-water', title: 'Still Water', cyclesRequired: 90, unlocksLevel: 5 },
    { id: 'clear-signal', title: 'Clear Signal', cyclesRequired: 180, unlocksLevel: 6 },
];
export class MilestoneTracker {
    constructor(bus, store) {
        this.bus = bus;
        this.store = store;
        /** Verified cycles in the current uninterrupted run. */
        this.runCycles = 0;
        /** True once focus broke this session; cleared on the next session start. */
        this.interrupted = false;
        this.sessionActive = false;
        bus.on('sessionStart', () => {
            this.sessionActive = true;
            this.interrupted = false;
            this.runCycles = 0;
        });
        bus.on('transition', ({ from, to, cycleCount }) => {
            if (!this.sessionActive)
                return;
            if (from === 'exhale' && to === 'inhale' && cycleCount > 0) {
                this.onCycleComplete();
            }
        });
        bus.on('sessionEnd', () => {
            this.sessionActive = false;
        });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden')
                this.breakFocus('visibility');
        });
        window.addEventListener('blur', () => this.breakFocus('blur'));
    }
    breakFocus(reason) {
        if (!this.sessionActive || this.interrupted)
            return;
        this.interrupted = true;
        this.runCycles = 0;
        this.bus.emit('focusBroken', { reason });
    }
    onCycleComplete() {
        if (this.interrupted)
            return; // Post-interruption cycles don't verify this session.
        this.runCycles += 1;
        const prev = this.store.get();
        const verifiedCycles = prev.verifiedCycles + 1;
        const bestRun = Math.max(prev.bestRun, this.runCycles);
        const newlyReached = MILESTONES.filter((m) => verifiedCycles >= m.cyclesRequired && !prev.milestonesReached.includes(m.id));
        const companionLevel = newlyReached.length
            ? Math.max(prev.companionLevel, ...newlyReached.map((m) => m.unlocksLevel))
            : prev.companionLevel;
        const next = this.store.update({
            verifiedCycles,
            bestRun,
            companionLevel,
            milestonesReached: [...prev.milestonesReached, ...newlyReached.map((m) => m.id)],
        });
        this.bus.emit('progress', next);
        for (const m of newlyReached)
            this.bus.emit('milestone', m);
        if (companionLevel > prev.companionLevel) {
            this.bus.emit('levelUp', { level: companionLevel });
        }
    }
    /** Called by the session controller when the user ends a session. */
    finishSession(cycles) {
        const prev = this.store.get();
        const next = this.store.update({ sessionsCompleted: prev.sessionsCompleted + 1 });
        this.bus.emit('sessionEnd', { cycles, uninterrupted: !this.interrupted });
        this.bus.emit('progress', next);
    }
    nextMilestone() {
        const { verifiedCycles } = this.store.get();
        return MILESTONES.find((m) => verifiedCycles < m.cyclesRequired) ?? null;
    }
}
