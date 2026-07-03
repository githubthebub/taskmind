import type { Mudra } from '../types.js';
import { MUDRAS, mudraById } from '../data/mudras.js';

/**
 * Mudra mode selector. When active, the coach demonstrates a hand position
 * for the user to mimic; this panel names it, states its traditional
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
  }
}
