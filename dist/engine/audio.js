/**
 * Client-side oscillator complex (Web Audio, zero assets, zero network).
 *
 * Layer A — grounding: a 110Hz sine fundamental, low-pass filtered, held at a
 * low steady level with a slow amplitude drift so it reads as felt warmth
 * rather than a "tone". It swells slightly on the long exhale, the phase in
 * which slow paced breathing does its parasympathetic work.
 *
 * Layer B — focus: a 432Hz partial routed through a slowly wandering stereo
 * panner. Its gain envelope follows the breath: rises across the inhale,
 * sustains with a gentle shimmer through the hold, and releases across the
 * exhale — so the ear can track the cycle with eyes closed.
 *
 * All parameter moves use setTargetAtTime / linearRamp so there are no clicks.
 */
const GROUND_HZ = 110;
const FOCUS_HZ = 432;
const MASTER_LEVEL = 0.5;
const GROUND_BASE = 0.16;
const GROUND_EXHALE = 0.24;
const FOCUS_PEAK = 0.1;
const FOCUS_HOLD = 0.085;
export class OscillatorComplex {
    constructor(bus) {
        this.ctx = null;
        this.master = null;
        this.groundGain = null;
        this.focusGain = null;
        this.enabled = true;
        bus.on('transition', ({ to }) => this.onPhase(to));
        bus.on('sessionStart', () => void this.resume());
        bus.on('sessionEnd', () => this.fadeOut());
    }
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled)
            this.fadeOut();
    }
    /** Must be called from a user gesture the first time (autoplay policy). */
    async resume() {
        if (!this.enabled)
            return;
        if (!this.ctx)
            this.buildGraph();
        if (this.ctx && this.ctx.state !== 'running') {
            try {
                await this.ctx.resume();
            }
            catch {
                // Autoplay blocked — the next explicit gesture will retry.
            }
        }
        if (this.ctx && this.master) {
            this.master.gain.setTargetAtTime(MASTER_LEVEL, this.ctx.currentTime, 0.4);
        }
    }
    buildGraph() {
        const Ctor = window.AudioContext ??
            window.webkitAudioContext;
        if (!Ctor)
            return;
        const ctx = new Ctor();
        this.ctx = ctx;
        this.master = ctx.createGain();
        this.master.gain.value = 0;
        this.master.connect(ctx.destination);
        // --- Layer A: 110Hz grounding fundamental ---
        const ground = ctx.createOscillator();
        ground.type = 'sine';
        ground.frequency.value = GROUND_HZ;
        const groundFilter = ctx.createBiquadFilter();
        groundFilter.type = 'lowpass';
        groundFilter.frequency.value = 220;
        groundFilter.Q.value = 0.7;
        this.groundGain = ctx.createGain();
        this.groundGain.gain.value = GROUND_BASE;
        // Slow amplitude drift (0.05Hz) keeps the drone organic.
        const drift = ctx.createOscillator();
        drift.type = 'sine';
        drift.frequency.value = 0.05;
        const driftDepth = ctx.createGain();
        driftDepth.gain.value = 0.03;
        drift.connect(driftDepth).connect(this.groundGain.gain);
        ground.connect(groundFilter).connect(this.groundGain).connect(this.master);
        // --- Layer B: 432Hz spatial focus layer ---
        const focus = ctx.createOscillator();
        focus.type = 'sine';
        focus.frequency.value = FOCUS_HZ;
        this.focusGain = ctx.createGain();
        this.focusGain.gain.value = 0;
        let focusOut = this.focusGain;
        if (typeof ctx.createStereoPanner === 'function') {
            const panner = ctx.createStereoPanner();
            // Slow spatial wander (0.08Hz) between the ears.
            const panLfo = ctx.createOscillator();
            panLfo.type = 'sine';
            panLfo.frequency.value = 0.08;
            const panDepth = ctx.createGain();
            panDepth.gain.value = 0.6;
            panLfo.connect(panDepth).connect(panner.pan);
            panLfo.start();
            this.focusGain.connect(panner);
            focusOut = panner;
        }
        focus.connect(this.focusGain);
        focusOut.connect(this.master);
        ground.start();
        focus.start();
        drift.start();
    }
    /** Crossfades the two layers at each phase boundary. */
    onPhase(phase) {
        if (!this.ctx || !this.groundGain || !this.focusGain || !this.enabled)
            return;
        const t = this.ctx.currentTime;
        const focus = this.focusGain.gain;
        const ground = this.groundGain.gain;
        switch (phase) {
            case 'inhale':
                // Focus layer rises across the 4s inhale; grounding recedes to base.
                focus.cancelScheduledValues(t);
                focus.setTargetAtTime(FOCUS_PEAK, t, 1.4);
                ground.setTargetAtTime(GROUND_BASE, t, 1.0);
                break;
            case 'hold':
                // Sustain with a slight settle so the hold reads as stillness.
                focus.cancelScheduledValues(t);
                focus.setTargetAtTime(FOCUS_HOLD, t, 2.0);
                break;
            case 'exhale':
                // Focus releases over the 8s exhale; grounding swells underneath.
                focus.cancelScheduledValues(t);
                focus.setTargetAtTime(0.004, t, 2.6);
                ground.setTargetAtTime(GROUND_EXHALE, t, 2.2);
                break;
            case 'idle':
                this.fadeOut();
                break;
        }
    }
    fadeOut() {
        if (!this.ctx || !this.master)
            return;
        this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
    }
}
