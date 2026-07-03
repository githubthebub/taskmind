import type { AvatarExpression, AvatarStateNode, BreathTick } from '../types.js';

/**
 * The coach avatar: a layered inline SVG. Expression is selected by toggling
 * layer groups via a data-expression attribute (CSS does the show/hide), so
 * the DOM is built once and never re-created. The body scales subtly with the
 * live breath tick so the coach visibly breathes WITH the user, and the aura
 * ring deepens with companion level.
 */

const LEVEL_AURAS = ['#8ecdf7', '#7ee0c0', '#ffd97a', '#ff9ecb', '#c9a6ff', '#7af0ff'];

export class AvatarView {
  private readonly root: HTMLElement;
  private readonly bubble: HTMLElement;
  private readonly svgWrap: HTMLElement;
  private bubbleTimer: number | null = null;

  constructor(container: HTMLElement) {
    this.root = container;
    this.root.classList.add('avatar');
    this.root.innerHTML = `
      <div class="avatar-bubble" role="status" aria-live="polite" hidden></div>
      <div class="avatar-svg-wrap">${avatarSvg()}</div>
    `;
    this.bubble = this.root.querySelector('.avatar-bubble') as HTMLElement;
    this.svgWrap = this.root.querySelector('.avatar-svg-wrap') as HTMLElement;
    this.setExpression('warm');
    this.setLevel(1);
  }

  setExpression(expression: AvatarExpression): void {
    this.svgWrap.dataset.expression = expression;
  }

  applyState(node: AvatarStateNode): void {
    this.setExpression(node.expression);
    this.svgWrap.style.setProperty('--anim-intensity', String(node.animationIntensity));
  }

  setLevel(level: number): void {
    const aura = LEVEL_AURAS[Math.min(level, LEVEL_AURAS.length) - 1];
    this.svgWrap.style.setProperty('--aura', aura);
    this.svgWrap.dataset.level = String(level);
  }

  say(line: string, holdMs = 5200): void {
    if (!line) return;
    this.bubble.textContent = line;
    this.bubble.hidden = false;
    this.bubble.classList.remove('pop');
    // Force a reflow so the pop animation restarts.
    void this.bubble.offsetWidth;
    this.bubble.classList.add('pop');
    if (this.bubbleTimer !== null) window.clearTimeout(this.bubbleTimer);
    this.bubbleTimer = window.setTimeout(() => {
      this.bubble.hidden = true;
    }, holdMs);
  }

  /** Breathe with the user: scale follows the live phase progress. */
  syncBreath(tick: BreathTick): void {
    let scale = 1;
    if (tick.phase === 'inhale') scale = 1 + 0.05 * tick.phaseProgress;
    else if (tick.phase === 'hold') scale = 1.05;
    else if (tick.phase === 'exhale') scale = 1.05 - 0.05 * tick.phaseProgress;
    this.svgWrap.style.setProperty('--breath-scale', scale.toFixed(4));
  }

  celebrate(): void {
    this.svgWrap.classList.remove('celebrate');
    void this.svgWrap.offsetWidth;
    this.svgWrap.classList.add('celebrate');
  }
}

function avatarSvg(): string {
  return `
  <svg viewBox="0 0 200 200" class="avatar-svg" aria-hidden="true">
    <circle class="aura" cx="100" cy="104" r="86"/>
    <g class="body">
      <ellipse cx="100" cy="112" rx="62" ry="58" class="skin"/>
      <ellipse cx="100" cy="130" rx="40" ry="26" class="belly"/>
      <!-- ears/leaf tuft grows with level (CSS reveals per data-level) -->
      <g class="tuft">
        <path class="leaf leaf-1" d="M100 54 q-4 -20 8 -26 q2 16 -8 26z"/>
        <path class="leaf leaf-2" d="M96 56 q-16 -12 -12 -26 q14 6 12 26z"/>
        <path class="leaf leaf-3" d="M106 56 q16 -12 12 -26 q-14 6 -12 26z"/>
      </g>

      <!-- eye layers -->
      <g class="eyes eyes-open">
        <circle cx="78" cy="102" r="7"/>
        <circle cx="122" cy="102" r="7"/>
        <circle cx="80.5" cy="99.5" r="2.4" class="glint"/>
        <circle cx="124.5" cy="99.5" r="2.4" class="glint"/>
      </g>
      <g class="eyes eyes-happy">
        <path d="M70 102 q8 -9 16 0" />
        <path d="M114 102 q8 -9 16 0" />
      </g>
      <g class="eyes eyes-lidded">
        <path d="M71 101 q7 5 14 0" />
        <path d="M115 101 q7 5 14 0" />
      </g>
      <g class="eyes eyes-soft">
        <path d="M71 100 q7 7 14 2" />
        <path d="M115 102 q7 5 14 -2" />
      </g>

      <!-- mouth layers -->
      <path class="mouth mouth-smile" d="M88 126 q12 10 24 0"/>
      <path class="mouth mouth-grin" d="M84 124 q16 18 32 0 q-16 6 -32 0z"/>
      <path class="mouth mouth-o" d="M100 127 m-6 0 a6 6.5 0 1 0 12 0 a6 6.5 0 1 0 -12 0"/>
      <path class="mouth mouth-gentle" d="M90 128 q10 5 20 0"/>

      <g class="blush">
        <ellipse cx="66" cy="118" rx="8" ry="4.5"/>
        <ellipse cx="134" cy="118" rx="8" ry="4.5"/>
      </g>
    </g>
    <g class="sparkles">
      <path class="spark s1" d="M40 60 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z"/>
      <path class="spark s2" d="M160 52 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5z"/>
      <path class="spark s3" d="M164 140 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/>
    </g>
  </svg>`;
}
