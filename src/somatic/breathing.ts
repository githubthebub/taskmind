/**
 * Somatic Breathing Overlay — unskippable fullscreen 4-7-8 breathing gate.
 *
 * Mounts a fixed, maximum-z-index overlay with a vector (SVG) breathing
 * animation driven by requestAnimationFrame elapsed time. Swallows every
 * click / key / touch interaction until all configured cycles complete,
 * then fades out, tears down all DOM and listeners, and resolves.
 *
 * Offline-first: no network, no external assets. Styles are injected via a
 * <style> element owned by this module (all classes prefixed `fme-breath-`).
 */

import type {
  BreathingConfig,
  BreathingPhase,
  IAudioEngine,
  IBreathingOverlay,
} from '../types.js';

/** Canonical 4-7-8 configuration: 3 unskippable cycles. */
export const DEFAULT_BREATHING_CONFIG: BreathingConfig = {
  phases: [
    { name: 'inhale', durationMs: 4000, instruction: 'Inhale through the nose' },
    { name: 'hold', durationMs: 7000, instruction: 'Hold' },
    { name: 'exhale', durationMs: 8000, instruction: 'Exhale slowly through the mouth' },
  ],
  cycles: 3,
  skippable: false,
};

/* ------------------------------------------------------------------ */
/* Internal helpers                                                    */
/* ------------------------------------------------------------------ */

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Every interaction event class the overlay captures and swallows. */
const SWALLOWED_EVENTS: readonly string[] = [
  'click',
  'dblclick',
  'auxclick',
  'contextmenu',
  'mousedown',
  'mouseup',
  'pointerdown',
  'pointerup',
  'touchstart',
  'touchmove',
  'touchend',
  'touchcancel',
  'keydown',
  'keyup',
  'keypress',
  'wheel',
];

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/** Geometry constants for the 320x320 SVG viewBox. */
const CENTER = 160;
const ARC_RADIUS = 142;
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS;
const SHIMMER_RADIUS = 128;
const CIRCLE_MIN_R = 44;
const CIRCLE_MAX_R = 112;

const OVERLAY_STYLES = `
.fme-breath-overlay {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(4, 6, 12, 0.96);
  color: #e8ecf5;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  -webkit-user-select: none;
  user-select: none;
  touch-action: none;
  cursor: default;
  opacity: 1;
  transition: opacity 600ms ease;
}
.fme-breath-overlay.fme-breath-fade-out {
  opacity: 0;
}
.fme-breath-stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 1rem;
  max-width: 92vw;
}
.fme-breath-svg {
  width: min(64vmin, 380px);
  height: min(64vmin, 380px);
  display: block;
}
.fme-breath-phase-name {
  font-size: clamp(1.1rem, 3vmin, 1.6rem);
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #9fd4ff;
}
.fme-breath-countdown {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -54%);
  font-size: clamp(2.6rem, 9vmin, 4.5rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #f4f8ff;
  text-shadow: 0 0 24px rgba(120, 180, 255, 0.35);
  pointer-events: none;
}
.fme-breath-svg-wrap {
  position: relative;
}
.fme-breath-instruction {
  font-size: clamp(0.95rem, 2.4vmin, 1.15rem);
  color: #b9c3d6;
  text-align: center;
  min-height: 1.4em;
}
.fme-breath-cycle {
  font-size: 0.8rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #6b7690;
}
`;

interface PhaseCursor {
  cycle: number;
  phaseIndex: number;
}

/* ------------------------------------------------------------------ */
/* BreathingOverlay                                                    */
/* ------------------------------------------------------------------ */

export class BreathingOverlay implements IBreathingOverlay {
  private readonly config: BreathingConfig;
  private readonly audio: IAudioEngine | undefined;
  private inFlight: Promise<void> | null = null;
  private mounted = false;

  constructor(config: BreathingConfig, audio?: IAudioEngine) {
    this.config = config;
    this.audio = audio;
  }

  get active(): boolean {
    return this.mounted;
  }

  run(host: HTMLElement): Promise<void> {
    if (this.inFlight) {
      return this.inFlight;
    }
    const promise = this.execute(host).then(() => {
      this.inFlight = null;
    });
    this.inFlight = promise;
    return promise;
  }

  private execute(host: HTMLElement): Promise<void> {
    return new Promise<void>((resolve) => {
      const phases: BreathingPhase[] = this.config.phases;
      const totalCycles = Math.max(1, Math.floor(this.config.cycles));

      if (phases.length === 0) {
        resolve();
        return;
      }

      /* ---------------- DOM construction ---------------- */

      const style = document.createElement('style');
      style.setAttribute('data-fme-breath', 'true');
      style.textContent = OVERLAY_STYLES;
      document.head.appendChild(style);

      const overlay = document.createElement('div');
      overlay.className = 'fme-breath-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Guided breathing exercise');
      overlay.tabIndex = -1;

      const stage = document.createElement('div');
      stage.className = 'fme-breath-stage';

      const phaseName = document.createElement('div');
      phaseName.className = 'fme-breath-phase-name';

      const svgWrap = document.createElement('div');
      svgWrap.className = 'fme-breath-svg-wrap';

      const svg = svgEl('svg', {
        class: 'fme-breath-svg',
        viewBox: '0 0 320 320',
        'aria-hidden': 'true',
      });

      const defs = svgEl('defs', {});
      const gradient = svgEl('radialGradient', {
        id: 'fme-breath-grad',
        cx: '50%',
        cy: '46%',
        r: '60%',
      });
      const stop0 = svgEl('stop', {
        offset: '0%',
        'stop-color': '#8fd0ff',
        'stop-opacity': '0.9',
      });
      const stop1 = svgEl('stop', {
        offset: '70%',
        'stop-color': '#3d78c4',
        'stop-opacity': '0.55',
      });
      const stop2 = svgEl('stop', {
        offset: '100%',
        'stop-color': '#1d3a66',
        'stop-opacity': '0.25',
      });
      gradient.append(stop0, stop1, stop2);
      defs.appendChild(gradient);

      const arcTrack = svgEl('circle', {
        cx: String(CENTER),
        cy: String(CENTER),
        r: String(ARC_RADIUS),
        fill: 'none',
        stroke: 'rgba(140, 165, 205, 0.18)',
        'stroke-width': '5',
      });

      const arcProgress = svgEl('circle', {
        cx: String(CENTER),
        cy: String(CENTER),
        r: String(ARC_RADIUS),
        fill: 'none',
        stroke: '#7fc4ff',
        'stroke-width': '5',
        'stroke-linecap': 'round',
        'stroke-dasharray': String(ARC_CIRCUMFERENCE),
        'stroke-dashoffset': String(ARC_CIRCUMFERENCE),
        transform: `rotate(-90 ${CENTER} ${CENTER})`,
      });

      const shimmer = svgEl('circle', {
        cx: String(CENTER),
        cy: String(CENTER),
        r: String(SHIMMER_RADIUS),
        fill: 'none',
        stroke: 'rgba(159, 212, 255, 0.55)',
        'stroke-width': '2',
        'stroke-dasharray': '4 18',
        'stroke-linecap': 'round',
        opacity: '0',
      });

      const breathCircle = svgEl('circle', {
        cx: String(CENTER),
        cy: String(CENTER),
        r: String(CIRCLE_MIN_R),
        fill: 'url(#fme-breath-grad)',
        stroke: 'rgba(159, 212, 255, 0.65)',
        'stroke-width': '2.5',
      });

      svg.append(defs, arcTrack, arcProgress, shimmer, breathCircle);

      const countdown = document.createElement('div');
      countdown.className = 'fme-breath-countdown';

      svgWrap.append(svg, countdown);

      const instruction = document.createElement('div');
      instruction.className = 'fme-breath-instruction';
      instruction.setAttribute('aria-live', 'polite');

      const cycleLabel = document.createElement('div');
      cycleLabel.className = 'fme-breath-cycle';

      stage.append(phaseName, svgWrap, instruction, cycleLabel);
      overlay.appendChild(stage);
      host.appendChild(overlay);
      this.mounted = true;
      overlay.focus();

      /* ---------------- Interaction lockdown ---------------- */

      const swallow = (ev: Event): void => {
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        if (ev.cancelable) {
          ev.preventDefault();
        }
      };
      const listenerOpts: AddEventListenerOptions = { capture: true, passive: false };
      for (const type of SWALLOWED_EVENTS) {
        // Window-level capture: nothing beneath the overlay (or focused
        // elsewhere in the document) can receive input while the gate runs.
        window.addEventListener(type, swallow, listenerOpts);
        overlay.addEventListener(type, swallow, listenerOpts);
      }

      /* ---------------- Teardown ---------------- */

      let rafId = 0;
      let fadeTimer = 0;
      let finished = false;

      const cleanup = (): void => {
        cancelAnimationFrame(rafId);
        window.clearTimeout(fadeTimer);
        for (const type of SWALLOWED_EVENTS) {
          window.removeEventListener(type, swallow, listenerOpts);
          overlay.removeEventListener(type, swallow, listenerOpts);
        }
        overlay.remove();
        style.remove();
        this.mounted = false;
      };

      const finish = (): void => {
        if (finished) {
          return;
        }
        finished = true;
        cancelAnimationFrame(rafId);
        overlay.classList.add('fme-breath-fade-out');
        fadeTimer = window.setTimeout(() => {
          cleanup();
          resolve();
        }, 620);
      };

      /* ---------------- Time-driven animation ---------------- */

      const cursor: PhaseCursor = { cycle: 0, phaseIndex: 0 };
      let phaseStart: number | null = null;
      let announcedPhase = -1;

      const currentPhase = (): BreathingPhase => {
        const p = phases[cursor.phaseIndex];
        return p ?? phases[0] as BreathingPhase;
      };

      const announcePhase = (): void => {
        const phase = currentPhase();
        const stamp = cursor.cycle * phases.length + cursor.phaseIndex;
        if (stamp === announcedPhase) {
          return;
        }
        announcedPhase = stamp;
        phaseName.textContent = phase.name;
        instruction.textContent = phase.instruction;
        cycleLabel.textContent = `cycle ${cursor.cycle + 1} of ${totalCycles}`;
        try {
          this.audio?.playPhaseCue(phase.name);
        } catch {
          // Audio failures must never break the breathing gate.
        }
      };

      const renderFrame = (elapsedInPhase: number): void => {
        const phase = currentPhase();
        const duration = Math.max(1, phase.durationMs);
        const progress = clamp01(elapsedInPhase / duration);

        // Circular progress arc for the current phase.
        arcProgress.setAttribute(
          'stroke-dashoffset',
          String(ARC_CIRCUMFERENCE * (1 - progress)),
        );

        // Countdown of whole seconds remaining in the phase.
        const secondsLeft = Math.max(1, Math.ceil((duration - elapsedInPhase) / 1000));
        countdown.textContent = String(secondsLeft);

        // Breathing circle radius + hold shimmer.
        let radius: number;
        let shimmerOpacity = 0;
        let shimmerAngle = 0;
        if (phase.name === 'inhale') {
          radius = CIRCLE_MIN_R + (CIRCLE_MAX_R - CIRCLE_MIN_R) * easeInOutSine(progress);
        } else if (phase.name === 'hold') {
          radius = CIRCLE_MAX_R;
          // Slow rotation shimmer: dashed ring drifts at 14 deg/s, fading
          // in over the first 400ms and out over the last 400ms of the hold.
          shimmerAngle = (elapsedInPhase / 1000) * 14;
          const fadeIn = clamp01(elapsedInPhase / 400);
          const fadeOut = clamp01((duration - elapsedInPhase) / 400);
          shimmerOpacity = 0.85 * Math.min(fadeIn, fadeOut);
        } else {
          radius = CIRCLE_MAX_R - (CIRCLE_MAX_R - CIRCLE_MIN_R) * easeInOutSine(progress);
        }
        breathCircle.setAttribute('r', radius.toFixed(2));
        shimmer.setAttribute('opacity', shimmerOpacity.toFixed(3));
        shimmer.setAttribute(
          'transform',
          `rotate(${(shimmerAngle % 360).toFixed(2)} ${CENTER} ${CENTER})`,
        );
      };

      const frame = (now: number): void => {
        if (finished) {
          return;
        }
        if (phaseStart === null) {
          phaseStart = now;
          announcePhase();
        }

        let elapsed = now - phaseStart;

        // Advance through any phases whose full duration has elapsed
        // (handles background-tab time jumps without drifting).
        while (elapsed >= Math.max(1, currentPhase().durationMs)) {
          const consumed = Math.max(1, currentPhase().durationMs);
          phaseStart += consumed;
          elapsed -= consumed;
          cursor.phaseIndex += 1;
          if (cursor.phaseIndex >= phases.length) {
            cursor.phaseIndex = 0;
            cursor.cycle += 1;
            if (cursor.cycle >= totalCycles) {
              renderFrame(Math.max(1, currentPhase().durationMs));
              finish();
              return;
            }
          }
          announcePhase();
        }

        renderFrame(elapsed);
        rafId = requestAnimationFrame(frame);
      };

      rafId = requestAnimationFrame(frame);
    });
  }
}
