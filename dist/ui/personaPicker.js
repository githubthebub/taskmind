/**
 * Coach voice selector. Three registers of the same coach — the protocol,
 * gating, and honesty rules never change, only how the encouragement lands.
 */
export const PERSONAS = [
    { id: 'sage', label: 'Sage', tagline: 'warm, steady, on your side' },
    { id: 'challenger', label: 'Challenger', tagline: 'blunt, numbers, no cope' },
    { id: 'alchemist', label: 'Alchemist', tagline: 'reframes everything' },
];
export class PersonaPicker {
    constructor(container, onChange) {
        this.onChange = onChange;
        this.current = 'sage';
        this.chips = new Map();
        container.classList.add('persona-picker');
        container.innerHTML = `
      <div class="persona-chips" role="group" aria-label="Coach voice">
        ${PERSONAS.map((p) => `<button type="button" class="persona-chip" data-persona="${p.id}">${p.label}</button>`).join('')}
      </div>
      <div class="persona-tagline"></div>
    `;
        this.tagline = container.querySelector('.persona-tagline');
        for (const p of PERSONAS) {
            const chip = container.querySelector(`[data-persona="${p.id}"]`);
            this.chips.set(p.id, chip);
            chip.addEventListener('click', () => {
                if (p.id === this.current)
                    return;
                this.set(p.id);
                this.onChange(p.id);
            });
        }
        this.render();
    }
    get persona() {
        return this.current;
    }
    /** Set without firing onChange (boot-time restore). */
    set(persona) {
        this.current = persona;
        this.render();
    }
    render() {
        for (const [id, chip] of this.chips) {
            chip.classList.toggle('on', id === this.current);
        }
        const meta = PERSONAS.find((p) => p.id === this.current);
        this.tagline.textContent = meta ? meta.tagline : '';
    }
}
