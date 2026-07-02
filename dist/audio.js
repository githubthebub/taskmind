/**
 * Client-side Oscillator Frequency Engine. Pure Web Audio node graph — no
 * samples, no fetches, no cloud.
 *
 * Layer 1 (fundamental): two sines panned hard L/R around `fundamentalHz`
 * (default 110 Hz); the right ear is detuned by the per-phase binaural beat
 * offset, producing the beat inside the listener's head.
 *
 * Layer 2 (spatial): a `spatialHz` (432 Hz) sine through a StereoPanner whose
 * pan is driven by a slow LFO, plus an FM LFO into the carrier frequency.
 * Pan rate, FM depth, and FM rate all re-target on every breath phase via
 * setTargetAtTime — smooth crossfades, never a click.
 */
export class OscillatorEngine {
    constructor(profile) {
        this.ctx = null;
        this.master = null;
        this.fundL = null;
        this.fundR = null;
        this.spatial = null;
        this.panLfo = null;
        this.fmLfo = null;
        this.fmDepth = null;
        this._enabled = false;
        this.profile = profile;
    }
    get enabled() {
        return this._enabled;
    }
    /**
     * Build the graph and fade in. Must be called from a user gesture.
     * Deliberately synchronous: no await between context creation and
     * `_enabled = true`, so a stop()/teardown can never interleave with a
     * half-started graph.
     */
    start(initialPhase) {
        if (this._enabled)
            return;
        const p = this.profile;
        const ctx = new AudioContext();
        this.ctx = ctx;
        try {
            this.buildGraph(ctx, p, initialPhase);
            this._enabled = true;
        }
        catch (err) {
            void ctx.close();
            this.ctx = null;
            throw err;
        }
        void ctx.resume(); // best-effort; the gesture-created context is normally already running
    }
    buildGraph(ctx, p, initialPhase) {
        const now = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.0001, now);
        master.gain.linearRampToValueAtTime(1, now + 2); // 2s fade-in
        master.connect(ctx.destination);
        this.master = master;
        // --- Layer 1: binaural fundamental (110 Hz floor) ---
        const fundGain = ctx.createGain();
        fundGain.gain.value = p.fundamentalGain;
        fundGain.connect(master);
        const panL = ctx.createStereoPanner();
        panL.pan.value = -1;
        panL.connect(fundGain);
        const panR = ctx.createStereoPanner();
        panR.pan.value = 1;
        panR.connect(fundGain);
        const fundL = ctx.createOscillator();
        fundL.type = 'sine';
        fundL.frequency.value = p.fundamentalHz;
        fundL.connect(panL);
        const fundR = ctx.createOscillator();
        fundR.type = 'sine';
        fundR.frequency.value = p.fundamentalHz + p.binauralBeatHz[initialPhase];
        fundR.connect(panR);
        this.fundL = fundL;
        this.fundR = fundR;
        // --- Layer 2: spatial 432 Hz panning layer with FM ---
        const spatialGain = ctx.createGain();
        spatialGain.gain.value = p.spatialGain;
        const panner = ctx.createStereoPanner();
        panner.pan.value = 0;
        spatialGain.connect(panner);
        panner.connect(master);
        const spatial = ctx.createOscillator();
        spatial.type = 'sine';
        spatial.frequency.value = p.spatialHz;
        spatial.connect(spatialGain);
        this.spatial = spatial;
        const panLfo = ctx.createOscillator();
        panLfo.type = 'sine';
        panLfo.frequency.value = p.panRateHz[initialPhase];
        const panDepth = ctx.createGain();
        panDepth.gain.value = 0.85; // sweep width, ±0.85 of full stereo field
        panLfo.connect(panDepth);
        panDepth.connect(panner.pan);
        this.panLfo = panLfo;
        const fmLfo = ctx.createOscillator();
        fmLfo.type = 'sine';
        fmLfo.frequency.value = p.fmRateHz[initialPhase];
        const fmDepth = ctx.createGain();
        fmDepth.gain.value = p.fmDepthHz[initialPhase];
        fmLfo.connect(fmDepth);
        fmDepth.connect(spatial.frequency);
        this.fmLfo = fmLfo;
        this.fmDepth = fmDepth;
        for (const osc of [fundL, fundR, spatial, panLfo, fmLfo])
            osc.start(now);
    }
    /** Re-target every phase-dependent parameter with a smooth crossfade. */
    setPhase(phase) {
        if (!this._enabled || !this.ctx)
            return;
        const p = this.profile;
        const now = this.ctx.currentTime;
        const tc = p.crossfadeSec / 3; // setTargetAtTime reaches ~95% at 3τ
        this.fundR?.frequency.setTargetAtTime(p.fundamentalHz + p.binauralBeatHz[phase], now, tc);
        this.panLfo?.frequency.setTargetAtTime(p.panRateHz[phase], now, tc);
        this.fmLfo?.frequency.setTargetAtTime(p.fmRateHz[phase], now, tc);
        this.fmDepth?.gain.setTargetAtTime(p.fmDepthHz[phase], now, tc);
    }
    /** Fade out and tear the graph down. */
    async stop() {
        if (!this._enabled || !this.ctx || !this.master)
            return;
        this._enabled = false;
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const FADE = 0.8;
        this.master.gain.cancelScheduledValues(now);
        this.master.gain.setValueAtTime(this.master.gain.value, now);
        this.master.gain.linearRampToValueAtTime(0.0001, now + FADE);
        await new Promise((r) => setTimeout(r, FADE * 1000 + 50));
        for (const osc of [this.fundL, this.fundR, this.spatial, this.panLfo, this.fmLfo]) {
            try {
                osc?.stop();
            }
            catch {
                /* already stopped */
            }
        }
        await ctx.close();
        this.ctx = null;
        this.master = null;
        this.fundL = this.fundR = this.spatial = this.panLfo = this.fmLfo = null;
        this.fmDepth = null;
    }
}
