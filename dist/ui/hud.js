import { MILESTONES } from '../engine/milestones.js';
/**
 * Progress HUD: companion level, verified-cycle count, best run, and a gauge
 * toward the next milestone. Reads exclusively from the local ProgressState.
 */
export class Hud {
    constructor(container) {
        container.classList.add('hud');
        container.innerHTML = `
      <div class="hud-stat"><span class="hud-value" data-id="level">1</span><span class="hud-key">level</span></div>
      <div class="hud-stat"><span class="hud-value" data-id="cycles">0</span><span class="hud-key">verified cycles</span></div>
      <div class="hud-stat"><span class="hud-value" data-id="best">0</span><span class="hud-key">best run</span></div>
      <div class="hud-next">
        <div class="hud-next-label" data-id="next"></div>
        <div class="hud-gauge"><div class="hud-gauge-fill" data-id="gauge"></div></div>
      </div>
    `;
        this.levelEl = container.querySelector('[data-id="level"]');
        this.cyclesEl = container.querySelector('[data-id="cycles"]');
        this.bestEl = container.querySelector('[data-id="best"]');
        this.nextEl = container.querySelector('[data-id="next"]');
        this.gaugeFill = container.querySelector('[data-id="gauge"]');
    }
    render(progress) {
        this.levelEl.textContent = String(progress.companionLevel);
        this.cyclesEl.textContent = String(progress.verifiedCycles);
        this.bestEl.textContent = String(progress.bestRun);
        const next = MILESTONES.find((m) => progress.verifiedCycles < m.cyclesRequired);
        if (!next) {
            this.nextEl.textContent = 'All milestones reached';
            this.gaugeFill.style.width = '100%';
            return;
        }
        const prevRequired = MILESTONES.filter((m) => m.cyclesRequired <= progress.verifiedCycles)
            .reduce((max, m) => Math.max(max, m.cyclesRequired), 0);
        const span = next.cyclesRequired - prevRequired;
        const done = progress.verifiedCycles - prevRequired;
        const pct = span > 0 ? Math.round((done / span) * 100) : 0;
        this.nextEl.textContent = `next: ${next.title} (${progress.verifiedCycles}/${next.cyclesRequired})`;
        this.gaugeFill.style.width = `${pct}%`;
    }
}
