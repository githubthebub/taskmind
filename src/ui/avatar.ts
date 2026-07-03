import type { AvatarExpression, AvatarStateNode, BreathTick } from '../types.js';

/**
 * The coach avatar: a layered inline SVG. Expression is selected by toggling
 * layer groups via a data-expression attribute (CSS does the show/hide), so
 * the DOM is built once and never re-created.
 *
 * Phase-locked animation: the body scales with the live breath tick (inflate
 * on inhale, still on hold, deflate on exhale), the aura brightens and dims
 * with the same curve, and an orbiting tracer dot completes exactly one lap
 * around the coach per phase — its color keyed to the current phase.
 *
 * Mudra mode: hand-position layers (one per mudra) the user can mimic,
 * toggled via a single data-mudra attribute.
 */

const LEVEL_AURAS = ['#8ecdf7', '#7ee0c0', '#ffd97a', '#ff9ecb', '#c9a6ff', '#7af0ff'];

export class AvatarView {
  private readonly root: HTMLElement;
  private readonly bubble: HTMLElement;
  private readonly svgWrap: HTMLElement;
  private readonly orbit: SVGGElement;
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
    this.orbit = this.root.querySelector('.orbit') as unknown as SVGGElement;
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

  /** Show mudra hands (or hide them with null). */
  setMudra(mudraId: string | null): void {
    if (mudraId) this.svgWrap.dataset.mudra = mudraId;
    else delete this.svgWrap.dataset.mudra;
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

  /**
   * Phase-locked motion, driven by the shared tick stream:
   * body scale + aura brightness follow the breath curve, and the tracer dot
   * makes one full orbit per phase.
   */
  syncBreath(tick: BreathTick): void {
    this.svgWrap.classList.add('live');
    this.svgWrap.dataset.phase = tick.phase;

    // 0 = fully exhaled, 1 = fully inhaled.
    let fullness = 0;
    if (tick.phase === 'inhale') fullness = tick.phaseProgress;
    else if (tick.phase === 'hold') fullness = 1;
    else if (tick.phase === 'exhale') fullness = 1 - tick.phaseProgress;

    this.svgWrap.style.setProperty('--breath-scale', (1 + 0.05 * fullness).toFixed(4));
    this.svgWrap.style.setProperty('--aura-op', (0.1 + 0.16 * fullness).toFixed(3));

    const deg = (tick.phaseProgress * 360).toFixed(1);
    this.orbit.setAttribute('transform', `rotate(${deg} 100 104)`);
  }

  /** Return to the idle look after a session ends. */
  setIdle(): void {
    this.svgWrap.classList.remove('live');
    delete this.svgWrap.dataset.phase;
    this.svgWrap.style.setProperty('--breath-scale', '1');
    this.orbit.setAttribute('transform', 'rotate(0 100 104)');
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
    <g class="orbit" transform="rotate(0 100 104)">
      <circle class="orbit-track" cx="100" cy="104" r="93"/>
      <circle class="orbit-dot" cx="100" cy="11" r="4.5"/>
    </g>
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

      <!-- mudra hand layers (revealed via data-mudra) -->
      <g class="hands hands-gyan">
        <path class="hand-arm" d="M52 128 Q42 142 52 152"/>
        <path class="hand-arm" d="M148 128 Q158 142 148 152"/>
        <ellipse class="hand-palm" cx="56" cy="154" rx="9" ry="6.5"/>
        <ellipse class="hand-palm" cx="144" cy="154" rx="9" ry="6.5"/>
        <circle class="hand-loop" cx="61" cy="150" r="3.4"/>
        <circle class="hand-loop" cx="139" cy="150" r="3.4"/>
        <path class="hand-line" d="M50 150 l-7 -4"/>
        <path class="hand-line" d="M49 154 l-8 0"/>
        <path class="hand-line" d="M50 158 l-7 4"/>
        <path class="hand-line" d="M150 150 l7 -4"/>
        <path class="hand-line" d="M151 154 l8 0"/>
        <path class="hand-line" d="M150 158 l7 4"/>
      </g>
      <g class="hands hands-dhyana">
        <path class="hand-arm" d="M54 128 Q58 150 80 156"/>
        <path class="hand-arm" d="M146 128 Q142 150 120 156"/>
        <ellipse class="hand-palm" cx="100" cy="157" rx="19" ry="7"/>
        <ellipse class="hand-palm hand-palm-upper" cx="100" cy="153" rx="13" ry="5"/>
        <circle class="hand-thumb" cx="96" cy="148" r="2.2"/>
        <circle class="hand-thumb" cx="104" cy="148" r="2.2"/>
      </g>
      <g class="hands hands-anjali">
        <path class="hand-arm" d="M60 134 Q75 148 93 146"/>
        <path class="hand-arm" d="M140 134 Q125 148 107 146"/>
        <rect class="hand-palm" x="93.5" y="132" width="6" height="24" rx="3"/>
        <rect class="hand-palm" x="100.5" y="132" width="6" height="24" rx="3"/>
      </g>
      <g class="hands hands-prana">
        <path class="hand-arm" d="M52 128 Q42 142 52 152"/>
        <path class="hand-arm" d="M148 128 Q158 142 148 152"/>
        <ellipse class="hand-palm" cx="56" cy="154" rx="9" ry="6.5"/>
        <ellipse class="hand-palm" cx="144" cy="154" rx="9" ry="6.5"/>
        <circle class="hand-loop" cx="60" cy="152" r="3.4"/>
        <circle class="hand-loop" cx="140" cy="152" r="3.4"/>
        <path class="hand-line" d="M53 148 l-3 -10"/>
        <path class="hand-line" d="M57 147 l-1 -10"/>
        <path class="hand-line" d="M147 148 l3 -10"/>
        <path class="hand-line" d="M143 147 l1 -10"/>
      </g>
    </g>
    <g class="sparkles">
      <path class="spark s1" d="M40 60 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z"/>
      <path class="spark s2" d="M160 52 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5z"/>
      <path class="spark s3" d="M164 140 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/>
    </g>
  </svg>`;
}
