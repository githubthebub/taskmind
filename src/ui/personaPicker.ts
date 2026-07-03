import type { PersonaId } from '../types.js';

/**
 * Coach voice selector. Three registers of the same coach — the protocol,
 * gating, and honesty rules never change, only how the encouragement lands.
 */
export const PERSONAS: readonly { id: PersonaId; label: string; tagline: string }[] = [
  { id: 'sage', label: 'Sage', tagline: 'warm, steady, on your side' },
  { id: 'challenger', label: 'Challenger', tagline: 'blunt, numbers, no cope' },
  { id: 'alchemist', label: 'Alchemist', tagline: 'reframes everything' },
];

export class PersonaPicker {
  private current: PersonaId = 'sage';
  private readonly chips = new Map<PersonaId, HTMLButtonElement>();
  private readonly tagline: HTMLElement;

  constructor(
    container: HTMLElement,
    private readonly onChange: (persona: PersonaId) => void,
  ) {
    container.classList.add('persona-picker');
    container.innerHTML = `
      <div class="persona-chips" role="group" aria-label="Coach voice">
        ${PERSONAS.map(
          (p) => `<button type="button" class="persona-chip" data-persona="${p.id}">${p.label}</button>`,
        ).join('')}
      </div>
      <div class="persona-tagline"></div>
    `;
    this.tagline = container.querySelector('.persona-tagline') as HTMLElement;
    for (const p of PERSONAS) {
      const chip = container.querySelector(`[data-persona="${p.id}"]`) as HTMLButtonElement;
      this.chips.set(p.id, chip);
      chip.addEventListener('click', () => {
        if (p.id === this.current) return;
        this.set(p.id);
        this.onChange(p.id);
      });
    }
    this.render();
  }

  get persona(): PersonaId {
    return this.current;
  }

  /** Set without firing onChange (boot-time restore). */
  set(persona: PersonaId): void {
    this.current = persona;
    this.render();
  }

  private render(): void {
    for (const [id, chip] of this.chips) {
      chip.classList.toggle('on', id === this.current);
    }
    const meta = PERSONAS.find((p) => p.id === this.current);
    this.tagline.textContent = meta ? meta.tagline : '';
  }
}
