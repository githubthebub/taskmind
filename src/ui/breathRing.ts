import type { BreathTick } from '../types.js';

const PHASE_LABEL: Record<string, string> = {
  inhale: 'Breathe in',
  hold: 'Hold',
  exhale: 'Breathe out',
  idle: 'Ready',
};

/**
 * The visual pacer: an SVG progress ring that fills over each phase, with the
 * current instruction and a per-phase color. Runs off the shared tick stream,
 * so it can never drift from the haptic/audio boundaries.
 */
export class BreathRing {
  private readonly progressArc: SVGCircleElement;
  private readonly label: HTMLElement;
  private readonly count: HTMLElement;
  private readonly circumference: number;
  private lastPhase = 'idle';

  constructor(container: HTMLElement) {
    const r = 84;
    this.circumference = 2 * Math.PI * r;
    container.classList.add('breath-ring');
    container.innerHTML = `
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle class="ring-track" cx="100" cy="100" r="${r}"/>
        <circle class="ring-progress" cx="100" cy="100" r="${r}"
          stroke-dasharray="${this.circumference.toFixed(1)}"
          stroke-dashoffset="${this.circumference.toFixed(1)}"/>
      </svg>
      <div class="ring-center">
        <div class="ring-label" role="status">Ready</div>
        <div class="ring-count" aria-label="completed cycles"></div>
      </div>
    `;
    this.progressArc = container.querySelector('.ring-progress') as unknown as SVGCircleElement;
    this.label = container.querySelector('.ring-label') as HTMLElement;
    this.count = container.querySelector('.ring-count') as HTMLElement;
  }

  update(tick: BreathTick): void {
    if (tick.phase !== this.lastPhase) {
      this.lastPhase = tick.phase;
      this.label.textContent = PHASE_LABEL[tick.phase] ?? '';
      this.progressArc.dataset.phase = tick.phase;
    }
    const offset = this.circumference * (1 - tick.phaseProgress);
    this.progressArc.style.strokeDashoffset = offset.toFixed(1);
    this.count.textContent = tick.cycleCount > 0 ? `${tick.cycleCount} cycle${tick.cycleCount === 1 ? '' : 's'}` : '';
  }

  reset(): void {
    this.lastPhase = 'idle';
    this.label.textContent = PHASE_LABEL.idle;
    this.count.textContent = '';
    this.progressArc.style.strokeDashoffset = this.circumference.toFixed(1);
    delete this.progressArc.dataset.phase;
  }
}
