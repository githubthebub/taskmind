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
    constructor(container) {
        this.bubbleTimer = null;
        this.root = container;
        this.root.classList.add('avatar');
        this.root.innerHTML = `
      <div class="avatar-bubble" role="status" aria-live="polite" hidden></div>
      <div class="avatar-svg-wrap">${avatarSvg()}</div>
    `;
        this.bubble = this.root.querySelector('.avatar-bubble');
        this.svgWrap = this.root.querySelector('.avatar-svg-wrap');
        this.orbit = this.root.querySelector('.orbit');
        this.setExpression('warm');
        this.setLevel(1);
    }
    setExpression(expression) {
        this.svgWrap.dataset.expression = expression;
    }
    applyState(node) {
        this.setExpression(node.expression);
        this.svgWrap.style.setProperty('--anim-intensity', String(node.animationIntensity));
    }
    setLevel(level) {
        const aura = LEVEL_AURAS[Math.min(level, LEVEL_AURAS.length) - 1];
        this.svgWrap.style.setProperty('--aura', aura);
        this.svgWrap.dataset.level = String(level);
    }
    /** Show mudra hands (or hide them with null). */
    setMudra(mudraId) {
        if (mudraId)
            this.svgWrap.dataset.mudra = mudraId;
        else
            delete this.svgWrap.dataset.mudra;
    }
    say(line, holdMs = 5200) {
        if (!line)
            return;
        this.bubble.textContent = line;
        this.bubble.hidden = false;
        this.bubble.classList.remove('pop');
        // Force a reflow so the pop animation restarts.
        void this.bubble.offsetWidth;
        this.bubble.classList.add('pop');
        if (this.bubbleTimer !== null)
            window.clearTimeout(this.bubbleTimer);
        this.bubbleTimer = window.setTimeout(() => {
            this.bubble.hidden = true;
        }, holdMs);
    }
    /**
     * Phase-locked motion, driven by the shared tick stream:
     * body scale + aura brightness follow the breath curve, and the tracer dot
     * makes one full orbit per phase.
     */
    syncBreath(tick) {
        this.svgWrap.classList.add('live');
        this.svgWrap.dataset.phase = tick.phase;
        // 0 = fully exhaled, 1 = fully inhaled.
        let fullness = 0;
        if (tick.phase === 'inhale')
            fullness = tick.phaseProgress;
        else if (tick.phase === 'hold')
            fullness = 1;
        else if (tick.phase === 'exhale')
            fullness = 1 - tick.phaseProgress;
        this.svgWrap.style.setProperty('--breath-scale', (1 + 0.05 * fullness).toFixed(4));
        this.svgWrap.style.setProperty('--aura-op', (0.1 + 0.16 * fullness).toFixed(3));
        const deg = (tick.phaseProgress * 360).toFixed(1);
        this.orbit.setAttribute('transform', `rotate(${deg} 100 104)`);
    }
    /** Return to the idle look after a session ends. */
    setIdle() {
        this.svgWrap.classList.remove('live');
        delete this.svgWrap.dataset.phase;
        this.svgWrap.style.setProperty('--breath-scale', '1');
        this.orbit.setAttribute('transform', 'rotate(0 100 104)');
    }
    celebrate() {
        this.svgWrap.classList.remove('celebrate');
        void this.svgWrap.offsetWidth;
        this.svgWrap.classList.add('celebrate');
    }
}
function avatarSvg() {
    return `
  <svg viewBox="0 0 200 200" class="avatar-svg" aria-hidden="true">
    <circle class="aura" cx="100" cy="104" r="86"/>
    <g class="orbit" transform="rotate(0 100 104)">
      <circle class="orbit-track" cx="100" cy="104" r="93"/>
      <circle class="orbit-dot" cx="100" cy="11" r="4.5"/>
    </g>
    <g class="body">
      <!-- feet peek out from under the body -->
      <g class="feet">
        <ellipse class="foot" cx="76" cy="169" rx="14" ry="7"/>
        <ellipse class="foot" cx="124" cy="169" rx="14" ry="7"/>
        <path class="toe-line" d="M70 165 l0 4"/>
        <path class="toe-line" d="M76 164 l0 5"/>
        <path class="toe-line" d="M118 165 l0 4"/>
        <path class="toe-line" d="M124 164 l0 5"/>
      </g>
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

      <!-- breath-hold face: puffed cheeks + pressed mouth (shown only
           during the hold phase, overriding the expression's mouth) -->
      <g class="cheeks">
        <ellipse cx="72" cy="122" rx="11" ry="8"/>
        <ellipse cx="128" cy="122" rx="11" ry="8"/>
      </g>
      <path class="mouth-hold" d="M93 128 q7 2.5 14 0"/>

      <g class="blush">
        <ellipse cx="66" cy="118" rx="8" ry="4.5"/>
        <ellipse cx="134" cy="118" rx="8" ry="4.5"/>
      </g>

      <!-- mudra hand layers (revealed via data-mudra) -->
      <g class="hands hands-gyan">
        <path class="hand-arm" d="M50 126 Q36 140 46 154"/>
        <path class="hand-arm" d="M150 126 Q164 140 154 154"/>
        <ellipse class="hand-palm" cx="52" cy="158" rx="12" ry="8.5"/>
        <ellipse class="hand-palm" cx="148" cy="158" rx="12" ry="8.5"/>
        <circle class="hand-loop" cx="59" cy="152" r="4.6"/>
        <circle class="hand-loop" cx="141" cy="152" r="4.6"/>
        <path class="hand-line" d="M44 152 l-9 -5"/>
        <path class="hand-line" d="M42 158 l-10 0"/>
        <path class="hand-line" d="M44 163 l-9 5"/>
        <path class="hand-line" d="M156 152 l9 -5"/>
        <path class="hand-line" d="M158 158 l10 0"/>
        <path class="hand-line" d="M156 163 l9 5"/>
      </g>
      <g class="hands hands-dhyana">
        <path class="hand-arm" d="M52 126 Q56 150 78 158"/>
        <path class="hand-arm" d="M148 126 Q144 150 122 158"/>
        <ellipse class="hand-palm" cx="100" cy="159" rx="23" ry="8.5"/>
        <ellipse class="hand-palm hand-palm-upper" cx="100" cy="154" rx="16" ry="6"/>
        <circle class="hand-thumb" cx="95" cy="148" r="2.8"/>
        <circle class="hand-thumb" cx="105" cy="148" r="2.8"/>
      </g>
      <g class="hands hands-anjali">
        <path class="hand-arm" d="M58 132 Q74 150 91 148"/>
        <path class="hand-arm" d="M142 132 Q126 150 109 148"/>
        <rect class="hand-palm" x="91" y="128" width="8.5" height="30" rx="4"/>
        <rect class="hand-palm" x="100.5" y="128" width="8.5" height="30" rx="4"/>
        <path class="hand-line" d="M100 130 l0 26"/>
      </g>
      <g class="hands hands-prana">
        <path class="hand-arm" d="M50 126 Q36 140 46 154"/>
        <path class="hand-arm" d="M150 126 Q164 140 154 154"/>
        <ellipse class="hand-palm" cx="52" cy="158" rx="12" ry="8.5"/>
        <ellipse class="hand-palm" cx="148" cy="158" rx="12" ry="8.5"/>
        <circle class="hand-loop" cx="57" cy="155" r="4.6"/>
        <circle class="hand-loop" cx="143" cy="155" r="4.6"/>
        <path class="hand-line" d="M48 150 l-4 -13"/>
        <path class="hand-line" d="M54 149 l-1 -13"/>
        <path class="hand-line" d="M152 150 l4 -13"/>
        <path class="hand-line" d="M146 149 l1 -13"/>
      </g>
    </g>
    <g class="sparkles">
      <path class="spark s1" d="M40 60 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z"/>
      <path class="spark s2" d="M160 52 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5z"/>
      <path class="spark s3" d="M164 140 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/>
    </g>
  </svg>`;
}
