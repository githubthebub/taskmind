import type { BreathPhase } from '../types.js';
import { PromptDeck } from '../data/prompts.js';

/**
 * The reframing text grid. Draws a level- and phase-appropriate prompt from
 * the local dictionary and renders it with a slow crossfade. Cadence is
 * deliberately sparse — one prompt per breath cycle, at the start of the
 * inhale — so the text supports the anchor instead of competing with it.
 */
export class PromptGrid {
  private readonly deck = new PromptDeck();
  private readonly el: HTMLElement;

  constructor(container: HTMLElement) {
    container.classList.add('prompt-grid');
    container.innerHTML = `<p class="prompt-text" aria-live="polite"></p>`;
    this.el = container.querySelector('.prompt-text') as HTMLElement;
  }

  showFor(phase: BreathPhase, level: number): void {
    const prompt = this.deck.draw(phase, level);
    if (!prompt) return;
    this.el.classList.remove('visible');
    window.setTimeout(() => {
      this.el.textContent = prompt.text;
      this.el.classList.add('visible');
    }, 350);
  }

  clear(): void {
    this.el.classList.remove('visible');
  }
}
