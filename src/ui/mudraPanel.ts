import type { Mudra, MudraFinger } from '../types.js';
import { MUDRAS, mudraById } from '../data/mudras.js';

/**
 * Mudra mode selector. When active, the coach demonstrates a hand position
 * for the user to mimic; this panel names it, shows a schematic finger
 * diagram (which fingertips actually touch), states its traditional
 * association, and gives the concrete physical cue. Selection cycles with
 * prev/next and is reported through onChange (null = mode off).
 */
export class MudraPanel {
  private active = false;
  private index = 0;
  private readonly toggleBtn: HTMLButtonElement;
  private readonly detail: HTMLElement;
  private readonly nameEl: HTMLElement;
  private readonly sanskritEl: HTMLElement;
  private readonly traditionEl: HTMLElement;
  private readonly cueEl: HTMLElement;
  private readonly diagramEl: HTMLElement;

  constructor(
    container: HTMLElement,
    private readonly onChange: (mudra: Mudra | null) => void,
  ) {
    container.classList.add('mudra-panel');
    container.innerHTML = `
      <button type="button" class="mudra-toggle">Mudra mode</button>
      <div class="mudra-detail" hidden>
        <div class="mudra-nav">
          <button type="button" class="mudra-arrow" data-dir="-1" aria-label="Previous mudra">‹</button>
          <div class="mudra-title">
            <span class="mudra-name"></span>
            <span class="mudra-sanskrit"></span>
          </div>
          <button type="button" class="mudra-arrow" data-dir="1" aria-label="Next mudra">›</button>
        </div>
        <div class="mudra-diagram" aria-hidden="true"></div>
        <p class="mudra-cue"></p>
        <p class="mudra-tradition"></p>
      </div>
    `;
    this.toggleBtn = container.querySelector('.mudra-toggle') as HTMLButtonElement;
    this.detail = container.querySelector('.mudra-detail') as HTMLElement;
    this.nameEl = container.querySelector('.mudra-name') as HTMLElement;
    this.sanskritEl = container.querySelector('.mudra-sanskrit') as HTMLElement;
    this.traditionEl = container.querySelector('.mudra-tradition') as HTMLElement;
    this.cueEl = container.querySelector('.mudra-cue') as HTMLElement;
    this.diagramEl = container.querySelector('.mudra-diagram') as HTMLElement;

    this.toggleBtn.addEventListener('click', () => this.setActive(!this.active));
    for (const arrow of container.querySelectorAll<HTMLButtonElement>('.mudra-arrow')) {
      arrow.addEventListener('click', () => {
        const dir = Number(arrow.dataset.dir);
        this.index = (this.index + dir + MUDRAS.length) % MUDRAS.length;
        this.render();
        this.onChange(this.current);
      });
    }
  }

  get current(): Mudra {
    return MUDRAS[this.index];
  }

  /** Restore persisted state without firing onChange (boot-time). */
  restore(active: boolean, mudraId: string): void {
    this.index = Math.max(0, MUDRAS.indexOf(mudraById(mudraId)));
    this.active = active;
    this.render();
  }

  setActive(active: boolean): void {
    this.active = active;
    this.render();
    this.onChange(active ? this.current : null);
  }

  private render(): void {
    this.toggleBtn.classList.toggle('on', this.active);
    this.detail.hidden = !this.active;
    if (!this.active) return;
    const m = this.current;
    this.nameEl.textContent = m.name;
    this.sanskritEl.textContent = m.sanskrit;
    this.traditionEl.textContent = m.tradition;
    this.cueEl.textContent = m.cue;
    this.diagramEl.innerHTML = diagramSvg(m);
  }
}

/* ------------------------------------------------------------------ */
/* Schematic diagrams: palm-up hand maps that make the finger geometry */
/* unambiguous — touching fingertips curl to the thumb and the contact */
/* point is ringed; extended fingers stay straight and highlighted.    */
/* ------------------------------------------------------------------ */

const FINGERS: readonly { name: MudraFinger; baseX: number; tipY: number }[] = [
  { name: 'index', baseX: 46, tipY: 26 },
  { name: 'middle', baseX: 58, tipY: 20 },
  { name: 'ring', baseX: 70, tipY: 24 },
  { name: 'pinky', baseX: 82, tipY: 34 },
];

/** Thumb tip — where touching fingers meet. */
const THUMB_TIP = { x: 26, y: 56 };

function diagramSvg(m: Mudra): string {
  switch (m.kind) {
    case 'pinch':
      return pinchSvg(m.touching ?? []);
    case 'bowl':
      return bowlSvg();
    case 'palms':
      return palmsSvg();
  }
}

function pinchSvg(touching: readonly MudraFinger[]): string {
  const fingers = FINGERS.map((f) => {
    if (touching.includes(f.name)) {
      // Curl from the finger base across the palm to the thumb tip.
      return `<path class="dg-finger dg-touch"
        d="M${f.baseX} 64 Q${(f.baseX + THUMB_TIP.x) / 2 - 6} ${f.tipY + 12} ${THUMB_TIP.x + 3} ${THUMB_TIP.y - 3}"/>`;
    }
    return `<path class="dg-finger dg-ext" d="M${f.baseX} 64 L${f.baseX - 3} ${f.tipY}"/>`;
  }).join('\n');

  return `
  <svg viewBox="0 0 120 108">
    <ellipse class="dg-palm" cx="62" cy="80" rx="27" ry="19"/>
    <path class="dg-finger dg-thumb" d="M42 86 Q26 76 ${THUMB_TIP.x} ${THUMB_TIP.y}"/>
    ${fingers}
    <circle class="dg-contact" cx="${THUMB_TIP.x + 2}" cy="${THUMB_TIP.y - 2}" r="7"/>
    <text class="dg-label" x="62" y="104" text-anchor="middle">palm up</text>
  </svg>`;
}

function bowlSvg(): string {
  return `
  <svg viewBox="0 0 120 108">
    <path class="dg-finger" d="M18 56 Q60 96 102 56"/>
    <path class="dg-finger" d="M30 52 Q60 82 90 52"/>
    <path class="dg-finger dg-thumb" d="M46 48 Q54 42 59 44"/>
    <path class="dg-finger dg-thumb" d="M74 48 Q66 42 61 44"/>
    <circle class="dg-contact" cx="60" cy="44" r="6"/>
    <text class="dg-label" x="60" y="104" text-anchor="middle">hands cupped, thumbs touch</text>
  </svg>`;
}

function palmsSvg(): string {
  return `
  <svg viewBox="0 0 120 108">
    <rect class="dg-palm" x="40" y="22" width="18" height="62" rx="8"/>
    <rect class="dg-palm" x="62" y="22" width="18" height="62" rx="8"/>
    <path class="dg-finger dg-thumb" d="M40 52 Q32 48 30 40"/>
    <path class="dg-finger dg-thumb" d="M80 52 Q88 48 90 40"/>
    <path class="dg-contact-line" d="M60 24 L60 82"/>
    <text class="dg-label" x="60" y="104" text-anchor="middle">palms pressed, fingers up</text>
  </svg>`;
}
