/**
 * Tactile haptic sequencing grid over navigator.vibrate.
 *
 * Two layers, both derived from the active StateConfig:
 *  - Transition anchor: fired once at every breath phase change (Pīti uses the
 *    cascading micro-pulse [30, 60, 30] — pulse/gap/pulse in ms).
 *  - Phase grid: an optional repeating pattern per phase, re-armed on every
 *    transition and cleanly cancelled (vibrate(0)) so loops never bleed
 *    across phase boundaries.
 *
 * Desktop browsers without the Vibration API degrade to a silent no-op; the
 * `supported` flag lets the UI say so honestly.
 */
export class HapticGrid {
    constructor(profile) {
        this._enabled = false;
        this.loopTimer = null;
        this.profile = profile;
        this.supported =
            typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
    }
    get enabled() {
        return this._enabled;
    }
    enable() {
        this._enabled = true;
    }
    disable() {
        this._enabled = false;
        this.clearLoop();
        if (this.supported)
            navigator.vibrate(0);
    }
    /** Fire the transition anchor, then arm this phase's repeating grid cell. */
    onPhaseChange(phase) {
        if (!this._enabled || !this.supported)
            return;
        this.clearLoop();
        navigator.vibrate(0); // hard-stop any in-flight pattern before re-arming
        navigator.vibrate(this.profile.transitionPattern);
        const cell = this.profile.grid[phase];
        if (!cell)
            return;
        const transitionMs = this.profile.transitionPattern.reduce((a, b) => a + b, 0);
        const fire = () => {
            if (!this._enabled)
                return;
            navigator.vibrate(cell.pattern);
        };
        // First grid pulse waits out the transition anchor, then repeats.
        this.loopTimer = window.setTimeout(() => {
            fire();
            this.loopTimer = window.setInterval(fire, cell.repeatEveryMs);
        }, transitionMs + 120);
    }
    stop() {
        this.clearLoop();
        if (this.supported)
            navigator.vibrate(0);
    }
    clearLoop() {
        if (this.loopTimer !== null) {
            window.clearTimeout(this.loopTimer);
            window.clearInterval(this.loopTimer);
            this.loopTimer = null;
        }
    }
}
