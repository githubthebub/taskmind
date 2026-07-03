/**
 * BreathingOverlay — full-screen 4s-inhale / 7s-hold / 8s-exhale guide.
 *
 * When the engine flags HYPER arousal the overlay seizes the UI: all
 * pointer, wheel and keyboard input is intercepted at the capture phase so
 * nothing reaches the app underneath, and the game surface is frozen. A
 * smoothly eased circle drives the pacing; soft synthesized cues mark each
 * phase change. The overlay releases only after a configurable number of
 * complete cycles (default 3 ≈ 57s of paced breathing).
 */

interface BreathPhase {
  name: 'Inhale' | 'Hold' | 'Exhale';
  seconds: number;
  cueHz: number;
}

const BREATH_478: BreathPhase[] = [
  { name: 'Inhale', seconds: 4, cueHz: 392 },
  { name: 'Hold', seconds: 7, cueHz: 440 },
  { name: 'Exhale', seconds: 8, cueHz: 330 },
];

class BreathingOverlay {
  private root: HTMLElement;
  private circle: HTMLElement;
  private phaseLabel: HTMLElement;
  private countLabel: HTMLElement;
  private cycleLabel: HTMLElement;
  private audio: CalmAudio;
  private raf = 0;
  private active = false;
  private onComplete: (() => void) | null = null;
  private trapHandler: (ev: Event) => void;

  constructor(root: HTMLElement, audio: CalmAudio) {
    this.root = root;
    this.audio = audio;
    this.circle = root.querySelector('.breath-circle') as HTMLElement;
    this.phaseLabel = root.querySelector('.breath-phase') as HTMLElement;
    this.countLabel = root.querySelector('.breath-count') as HTMLElement;
    this.cycleLabel = root.querySelector('.breath-cycle') as HTMLElement;
    this.trapHandler = (ev: Event) => {
      if (!this.active) return;
      ev.preventDefault();
      ev.stopPropagation();
    };
  }

  get isActive(): boolean {
    return this.active;
  }

  /** Seize the UI and run `cycles` full 4-7-8 cycles, then call onComplete. */
  start(cycles: number, onComplete: () => void): void {
    if (this.active) return;
    this.active = true;
    this.onComplete = onComplete;
    this.root.classList.add('visible');
    this.trapInput(true);

    const cycleMs = BREATH_478.reduce((acc, p) => acc + p.seconds, 0) * 1000;
    const totalMs = cycleMs * cycles;
    const startT = performance.now();
    let lastPhase: BreathPhase | null = null;

    const frame = (now: number): void => {
      const elapsed = now - startT;
      if (elapsed >= totalMs) {
        this.finish();
        return;
      }
      const inCycle = elapsed % cycleMs;
      const cycleIdx = Math.floor(elapsed / cycleMs);
      let acc = 0;
      for (const phase of BREATH_478) {
        const phaseMs = phase.seconds * 1000;
        if (inCycle < acc + phaseMs) {
          const phaseProgress = (inCycle - acc) / phaseMs;
          this.renderPhase(phase, phaseProgress, cycleIdx + 1, cycles);
          if (phase !== lastPhase) {
            this.audio.cue(phase.cueHz);
            lastPhase = phase;
          }
          break;
        }
        acc += phaseMs;
      }
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  private renderPhase(phase: BreathPhase, progress: number, cycle: number, cycles: number): void {
    // Cosine easing gives the circle a fluid, non-mechanical swell.
    const eased = (1 - Math.cos(Math.PI * progress)) / 2;
    let scale: number;
    if (phase.name === 'Inhale') scale = 0.55 + 0.45 * eased;
    else if (phase.name === 'Hold') scale = 1;
    else scale = 1 - 0.45 * eased;
    this.circle.style.transform = `scale(${scale.toFixed(4)})`;
    this.phaseLabel.textContent = phase.name;
    const remaining = Math.ceil(phase.seconds * (1 - progress));
    this.countLabel.textContent = String(Math.max(1, remaining));
    this.cycleLabel.textContent = `Cycle ${cycle} of ${cycles} — let your heart rate settle`;
  }

  private trapInput(on: boolean): void {
    const events = ['pointerdown', 'pointerup', 'pointermove', 'wheel', 'keydown', 'keyup', 'touchstart', 'touchmove'];
    for (const name of events) {
      if (on) document.addEventListener(name, this.trapHandler, { capture: true, passive: false });
      else document.removeEventListener(name, this.trapHandler, { capture: true });
    }
  }

  private finish(): void {
    cancelAnimationFrame(this.raf);
    this.trapInput(false);
    this.active = false;
    this.root.classList.remove('visible');
    const cb = this.onComplete;
    this.onComplete = null;
    if (cb !== null) cb();
  }
}
