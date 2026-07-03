/**
 * Modeled neurochemical state profile.
 *
 * Four gauges drift from an alert-arousal baseline toward the target
 * "sleep onset" profile across the first five minutes of a session, landing
 * exactly on target at the 5:00 mark and holding there. The panel is
 * explicitly labeled as a modeled, illustrative trajectory — the app measures
 * nothing; this visualizes the state the practice is aiming the user toward
 * (invariant #6 in CLINICAL_FLOW_ENGINE.md: copy stays honest).
 */

export const PROFILE_TARGET_MS = 300_000; // 5 minutes

interface GaugeSpec {
  readonly id: string;
  readonly label: string;
  /** Baseline at session start (alert arousal), 0..10. */
  readonly start: number;
  /** Target at PROFILE_TARGET_MS, 0..10. */
  readonly target: number;
  /** Qualifier shown once the target is reached. */
  readonly tag: string;
}

export const GAUGES: readonly GaugeSpec[] = [
  { id: 'gaba', label: 'GABA', start: 3, target: 9, tag: 'Sleep Onset' },
  { id: 'serotonin', label: 'Serotonin (5-HT)', start: 5, target: 4, tag: '' },
  { id: 'dopamine', label: 'Dopamine (DA)', start: 6, target: 2, tag: 'Inactive Reward' },
  { id: 'norepinephrine', label: 'Norepinephrine (NE)', start: 7, target: 1, tag: 'Minimal Arousal' },
];

/** Ease-out: visible movement early, gentle settle into the target. */
function ease(t: number): number {
  return 1 - Math.pow(1 - t, 2);
}

export function gaugeValue(spec: GaugeSpec, elapsedMs: number): number {
  const t = Math.min(1, Math.max(0, elapsedMs / PROFILE_TARGET_MS));
  return spec.start + (spec.target - spec.start) * ease(t);
}

export class NeuroPanel {
  private readonly rows = new Map<string, { fill: HTMLElement; value: HTMLElement; tag: HTMLElement }>();
  private readonly root: HTMLElement;
  private settled = false;

  constructor(container: HTMLElement) {
    this.root = container;
    container.classList.add('neuro-panel');
    container.hidden = true;
    container.innerHTML = `
      <div class="neuro-head">
        <span class="neuro-title">State profile</span>
        <span class="neuro-note">modeled trajectory — illustrative, not a measurement</span>
      </div>
      ${GAUGES.map(
        (g) => `
        <div class="neuro-row" data-gauge="${g.id}">
          <span class="neuro-label">${g.label}</span>
          <div class="neuro-bar"><div class="neuro-fill"></div></div>
          <span class="neuro-value"></span>
          <span class="neuro-tag"></span>
        </div>`,
      ).join('')}
    `;
    for (const g of GAUGES) {
      const row = container.querySelector(`[data-gauge="${g.id}"]`) as HTMLElement;
      this.rows.set(g.id, {
        fill: row.querySelector('.neuro-fill') as HTMLElement,
        value: row.querySelector('.neuro-value') as HTMLElement,
        tag: row.querySelector('.neuro-tag') as HTMLElement,
      });
    }
    this.update(0);
  }

  show(): void {
    this.root.hidden = false;
  }

  update(elapsedMs: number): void {
    const done = elapsedMs >= PROFILE_TARGET_MS;
    if (done && this.settled) return; // targets are held; nothing left to redraw
    for (const g of GAUGES) {
      const row = this.rows.get(g.id);
      if (!row) continue;
      const v = gaugeValue(g, elapsedMs);
      row.fill.style.width = `${v * 10}%`;
      row.value.textContent = `${done ? g.target : Math.round(v)}/10`;
      row.tag.textContent = done && g.tag ? g.tag : '';
    }
    this.root.classList.toggle('settled', done);
    this.settled = done;
  }

  /** Freeze at session end: keep whatever the profile reached. */
  freeze(): void {
    this.root.classList.add('frozen');
  }

  reset(): void {
    this.root.classList.remove('frozen');
    this.settled = false;
    this.update(0);
  }
}
