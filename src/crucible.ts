/**
 * CrucibleModule — exhaustion pre-mortem overlay.
 *
 * The user names a milestone they're chasing. The module deterministically
 * generates three structural failure scenarios drawn from real-world friction
 * classes (time scarcity, motivation decay, logistics, social friction,
 * resource limits, competing priorities), then charts the hedonic adaptation
 * model S(t) = B + (P − B)·e^(−λt) across 12 months so the user sees the
 * satisfaction decay curve *before* the anticipation loop closes. All
 * generation is local and seeded from the milestone text itself — the same
 * milestone always yields the same pre-mortem, which makes the module
 * testable and honest (it is a model, not an oracle).
 */

interface FrictionTemplate {
  category: string;
  title: string;
  /** `{m}` is replaced with the user's milestone text */
  narrative: string;
  weight: number;
}

const FRICTION_LIBRARY: FrictionTemplate[] = [
  {
    category: 'Time scarcity',
    title: 'The calendar collision',
    narrative:
      'Three weeks in, the time you earmarked for "{m}" collides with obligations that were always going to resurface — work crunch, family logistics, sleep debt. The plan assumed your best weeks were your average weeks. Progress stalls not from lack of desire but because the schedule never had structural slack.',
    weight: 0.85,
  },
  {
    category: 'Motivation decay',
    title: 'The novelty cliff',
    narrative:
      'The initial dopamine of committing to "{m}" fades on schedule, around day 10–14. What remains is the unglamorous middle: repetition without visible progress. If the habit is still riding on enthusiasm instead of a fixed trigger and a tiny minimum dose, this is where it quietly ends.',
    weight: 0.9,
  },
  {
    category: 'Logistical dependency',
    title: 'The single point of failure',
    narrative:
      '"{m}" secretly depends on one fragile link — a tool, a space, a person, an app, a commute window. When that link breaks for a week, the streak breaks with it, and restarting costs more activation energy than starting did.',
    weight: 0.7,
  },
  {
    category: 'Social friction',
    title: 'The unimpressed room',
    narrative:
      'You expected the people around you to notice progress on "{m}". Mostly, they don\'t — or they gently mock the new routine. Without external applause, the effort has to be self-justifying. If your plan needed an audience, this is where it wobbles.',
    weight: 0.6,
  },
  {
    category: 'Resource constraint',
    title: 'The hidden invoice',
    narrative:
      'The true cost of "{m}" — money, energy, attention — turns out to be 1.5–2× the estimate. Something else in your life pays that invoice. When the subsidizing area (rest, relationships, finances) runs dry, the milestone gets renegotiated downward.',
    weight: 0.65,
  },
  {
    category: 'Competing priorities',
    title: 'The urgent usurper',
    narrative:
      'A legitimately urgent project arrives and borrows "just two weeks" from "{m}". Urgency is renewable; it will borrow again. Without a pre-committed floor — a minimum weekly dose that survives any emergency — important-but-not-urgent work loses every individual negotiation.',
    weight: 0.8,
  },
];

/** Deterministic 32-bit FNV-1a hash so scenarios are stable per milestone. */
function hashMilestone(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function generateFailureScenarios(milestone: string): FailureScenario[] {
  const clean = milestone.trim();
  const seed = hashMilestone(clean.toLowerCase());
  const picked: FailureScenario[] = [];
  const used = new Set<number>();
  let cursor = seed;
  while (picked.length < 3) {
    cursor = (Math.imul(cursor, 1664525) + 1013904223) >>> 0;
    const idx = cursor % FRICTION_LIBRARY.length;
    if (used.has(idx)) continue;
    used.add(idx);
    const t = FRICTION_LIBRARY[idx];
    picked.push({
      frictionCategory: t.category,
      title: t.title,
      narrative: t.narrative.split('{m}').join(clean),
      weight: t.weight,
    });
  }
  return picked;
}

/**
 * Hedonic adaptation model. Peak satisfaction at attainment decays
 * exponentially back toward baseline: S(t) = B + (P − B)·e^(−λt).
 * λ is derived from the milestone hash within an empirically plausible
 * band (half-life roughly 1.5–4 months for single-event boosts).
 */
function computeHedonicCurve(milestone: string): HedonicCurve {
  const seed = hashMilestone(milestone.trim().toLowerCase());
  const baseline = 0.5;
  const peak = 0.92;
  // Map the seed onto λ ∈ [0.17, 0.46] per month.
  const lambda = 0.17 + (seed % 1000) / 1000 * 0.29;
  const points: number[] = [];
  for (let month = 0; month <= 12; month++) {
    points.push(baseline + (peak - baseline) * Math.exp(-lambda * month));
  }
  const halfLifeMonths = Math.LN2 / lambda;
  return { baseline, peak, lambda, points, halfLifeMonths };
}

class CrucibleModule {
  private input: HTMLTextAreaElement;
  private runButton: HTMLButtonElement;
  private output: HTMLElement;
  private chartCanvas: HTMLCanvasElement;
  private vault: FocusVault;
  private lastCurve: HedonicCurve | null = null;
  private resizeTimer = 0;

  constructor(root: HTMLElement, vault: FocusVault) {
    this.vault = vault;
    this.input = root.querySelector('.crucible-input') as HTMLTextAreaElement;
    this.runButton = root.querySelector('.crucible-run') as HTMLButtonElement;
    this.output = root.querySelector('.crucible-output') as HTMLElement;
    this.chartCanvas = root.querySelector('.crucible-chart') as HTMLCanvasElement;
    this.runButton.addEventListener('click', () => this.run());
    // The chart's backing store is sized at draw time; re-render it after
    // resize/orientation changes so it never displays stretched.
    window.addEventListener('resize', () => {
      if (this.lastCurve === null) return;
      clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => {
        if (this.lastCurve !== null) this.drawCurve(this.lastCurve);
      }, 150);
    });
  }

  run(): void {
    const milestone = this.input.value.trim();
    if (milestone.length < 3) {
      this.output.innerHTML = '<p class="crucible-hint">Name a real milestone first — a sentence is enough.</p>';
      return;
    }
    const scenarios = generateFailureScenarios(milestone);
    const curve = computeHedonicCurve(milestone);
    this.render(scenarios, curve);
    this.vault.recordCrucibleEntry({ createdAt: Date.now(), milestone, scenarios, curve });
  }

  private render(scenarios: FailureScenario[], curve: HedonicCurve): void {
    const frag = document.createDocumentFragment();
    for (const s of scenarios) {
      const card = document.createElement('article');
      card.className = 'crucible-card';
      const h = document.createElement('h4');
      h.textContent = `${s.frictionCategory} — ${s.title}`;
      const p = document.createElement('p');
      p.textContent = s.narrative;
      const meter = document.createElement('div');
      meter.className = 'crucible-meter';
      const fill = document.createElement('span');
      fill.style.width = `${Math.round(s.weight * 100)}%`;
      meter.appendChild(fill);
      const meterLabel = document.createElement('small');
      meterLabel.textContent = `Structural risk weight ${Math.round(s.weight * 100)}%`;
      card.append(h, p, meter, meterLabel);
      frag.appendChild(card);
    }
    const summary = document.createElement('p');
    summary.className = 'crucible-summary';
    summary.textContent =
      `Hedonic model: satisfaction peaks at ${Math.round(curve.peak * 100)}% on attainment and decays toward the ` +
      `${Math.round(curve.baseline * 100)}% baseline with a half-life of ${curve.halfLifeMonths.toFixed(1)} months. ` +
      'The feeling you are chasing is a spike, not a plateau — build the system, not the fantasy.';
    frag.appendChild(summary);
    this.output.replaceChildren(frag);
    this.drawCurve(curve);
  }

  private drawCurve(curve: HedonicCurve): void {
    this.lastCurve = curve;
    const canvas = this.chartCanvas;
    const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = canvas.getContext('2d');
    if (ctx === null) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = rect.width;
    const h = rect.height;
    const pad = { left: 34, right: 12, top: 14, bottom: 24 };
    ctx.clearRect(0, 0, w, h);

    const x = (month: number): number => pad.left + (month / 12) * (w - pad.left - pad.right);
    const y = (v: number): number => pad.top + (1 - v) * (h - pad.top - pad.bottom);

    // Baseline reference.
    ctx.strokeStyle = 'rgba(148,163,184,0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x(0), y(curve.baseline));
    ctx.lineTo(x(12), y(curve.baseline));
    ctx.stroke();
    ctx.setLineDash([]);

    // Decay curve.
    ctx.strokeStyle = '#f0abfc';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    curve.points.forEach((v, month) => {
      if (month === 0) ctx.moveTo(x(month), y(v));
      else ctx.lineTo(x(month), y(v));
    });
    ctx.stroke();

    // Axes and labels.
    ctx.fillStyle = 'rgba(226,232,240,0.75)';
    ctx.font = '11px system-ui, sans-serif';
    for (const month of [0, 3, 6, 9, 12]) {
      // Right-align the final label so it doesn't clip past the canvas edge.
      ctx.textAlign = month === 12 ? 'right' : 'center';
      ctx.fillText(`${month}mo`, month === 12 ? x(12) + 8 : x(month), h - 6);
    }
    ctx.textAlign = 'left';
    ctx.fillText('satisfaction', 4, pad.top + 2);
    ctx.fillText('baseline', 4, y(curve.baseline) - 4);

    // Half-life marker.
    const hl = Math.min(12, curve.halfLifeMonths);
    ctx.strokeStyle = 'rgba(94,234,212,0.7)';
    ctx.beginPath();
    ctx.moveTo(x(hl), y(1));
    ctx.lineTo(x(hl), y(0));
    ctx.stroke();
    ctx.fillStyle = 'rgba(94,234,212,0.9)';
    ctx.textAlign = hl > 9 ? 'right' : 'left';
    ctx.fillText(`half-life ${curve.halfLifeMonths.toFixed(1)}mo`, x(hl) + (hl > 9 ? -4 : 4), pad.top + 14);
  }
}
