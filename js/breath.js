/* =========================================================
   Haven — breath engine
   Drives a timed phase loop and reports progress so the UI
   (ring, character glow, cues) can move with the breath.
   ========================================================= */

class BreathEngine {
  /**
   * @param {object} pattern   entry from PATTERNS
   * @param {number} cycles    how many full cycles to run
   * @param {object} cbs       { onPhase(phase, cycle, cycles), onProgress(phaseFrac, phase), onCycle(i), onDone() }
   */
  constructor(pattern, cycles, cbs) {
    this.pattern = pattern;
    this.cycles = cycles;
    this.cbs = cbs || {};
    this._raf = null;
    this._running = false;
    this._stopped = false;
  }

  start() {
    this._running = true;
    this._cycle = 0;
    this._phaseIx = -1;
    this._phaseStart = 0;
    this._nextPhase(performance.now());
    this._tick = this._tick.bind(this);
    this._raf = requestAnimationFrame(this._tick);
  }

  stop() {
    this._stopped = true;
    this._running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  _nextPhase(now) {
    this._phaseIx++;
    if (this._phaseIx >= this.pattern.phases.length) {
      this._phaseIx = 0;
      this._cycle++;
      if (this.cbs.onCycle) this.cbs.onCycle(this._cycle);
      if (this._cycle >= this.cycles) {
        this._running = false;
        if (this.cbs.onDone) this.cbs.onDone();
        return;
      }
    }
    this._phaseStart = now;
    const phase = this.pattern.phases[this._phaseIx];
    if (this.cbs.onPhase) this.cbs.onPhase(phase, this._cycle, this.cycles);
  }

  _tick(now) {
    if (!this._running || this._stopped) return;
    const phase = this.pattern.phases[this._phaseIx];
    const frac = Math.min(1, (now - this._phaseStart) / (phase.secs * 1000));
    if (this.cbs.onProgress) this.cbs.onProgress(frac, phase);
    if (frac >= 1) {
      this._nextPhase(now);
      if (!this._running) return;
    }
    this._raf = requestAnimationFrame(this._tick);
  }
}

/* Maps breath phase progress to a 0..1 "fullness" for ring & character.
   Inhale ramps up, hold keeps level, exhale ramps down with an ease. */
function breathFullness(frac, phase, prevFullness) {
  const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  if (phase.kind === 'in')  {
    // top-up inhales start from where the last inhale left off
    const base = phase.name === 'Top-up' ? 0.72 : 0.08;
    const top  = phase.name === 'Top-up' ? 1.0  : 0.72;
    return base + (top - base) * easeInOut(frac);
  }
  if (phase.kind === 'hold') return prevFullness != null ? prevFullness : 1;
  return 1.0 - 0.92 * easeInOut(frac); // out
}
