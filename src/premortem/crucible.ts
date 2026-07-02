/**
 * Exhaustion Premortem Module — "Crucible Portal"
 *
 * Offline-first, zero network calls. Walks a milestone through three
 * pre-programmed structural failure scenarios (radical accountability,
 * no blame externalization), logs containment strategies, and renders a
 * deterministic hedonic-adaptation decay curve on a raw HTML5 canvas.
 */

import type {
  ContainmentEntry,
  FailureScenario,
  HedonicPoint,
  ICruciblePortal,
  IFocusStore,
  Milestone,
} from '../types.js';

/* ------------------------------------------------------------------ */
/* Failure scenarios (fixed content)                                   */
/* ------------------------------------------------------------------ */

export const FAILURE_SCENARIOS: FailureScenario[] = [
  {
    id: 'motivation-cliff',
    title: 'The Motivation Cliff',
    narrative:
      'Week three. The novelty is dead, the announcement likes have evaporated, and the work has ' +
      'revealed itself as what it always was: boring, repetitive maintenance. Nobody stole your ' +
      'motivation — it was never fuel, it was a launch bonus, and you built your plan as if it ' +
      'would last forever. The version of you that starts things is not the version that has to ' +
      'show up on a gray Tuesday when the task list is pure grind. If your system only works when ' +
      'you feel like it, you do not have a system; you have a mood.',
    accountabilityPrompt:
      'The cliff is not an if, it is a when. What exactly will YOU do on the day this happens? ' +
      'Name the behavior, the trigger, and the fallback — the minimum non-negotiable action you ' +
      'will take when you feel nothing.',
  },
  {
    id: 'invisible-tradeoff',
    title: 'The Invisible Tradeoff',
    narrative:
      'You never decided to sacrifice your sleep, your relationships, or your health — you just ' +
      'kept saying "one more hour" until the milestone quietly ate them. The cost was invisible ' +
      'because you chose not to look at the receipt. Then something breaks: a body that stops ' +
      'cooperating, a partner who stops asking, a friendship that goes silent. You will want to ' +
      'call it bad luck, but it was a ledger you refused to read. Every yes to the milestone was ' +
      'a no to something you never had the honesty to name.',
    accountabilityPrompt:
      'Name the thing this milestone is most likely to cannibalize first. What exactly will YOU ' +
      'do on the day you notice it slipping? Name the behavior, the trigger, and the fallback — ' +
      'the hard line you will not trade away no matter how close the finish looks.',
  },
  {
    id: 'moving-goalpost',
    title: 'The Moving Goalpost',
    narrative:
      'You hit the milestone and feel almost nothing, because the goal was never yours — it was ' +
      'borrowed from someone else\'s scoreboard: a parent, a feed, a peer you quietly resent. ' +
      'Achievement built on comparison pays out in comparison, and the leaderboard resets the ' +
      'moment you finish. So the goalpost moves, the hollowness gets rebranded as "ambition", and ' +
      'you sign up for the next borrowed target to outrun the question you keep dodging. No one ' +
      'made you chase it; you picked someone else\'s definition of enough because it was easier ' +
      'than writing your own.',
    accountabilityPrompt:
      'The day you achieve this and it feels hollow — what exactly will YOU do? Name the ' +
      'behavior, the trigger, and the fallback, and state in one sentence the internal standard ' +
      'this milestone serves that would survive if every scoreboard vanished.',
  },
];

/* ------------------------------------------------------------------ */
/* Deterministic hashing / seeding                                     */
/* ------------------------------------------------------------------ */

/** FNV-1a 32-bit hash; returns an unsigned 32-bit integer. */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Deterministic unit-interval value derived from an id plus a salt. */
function seededUnit(id: string, salt: string): number {
  return fnv1a(`${id}::${salt}`) / 0x100000000;
}

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug.length > 0 ? slug : 'milestone';
}

function makeMilestoneId(title: string): string {
  return `${slugify(title)}-${fnv1a(title).toString(16).padStart(8, '0')}`;
}

/* ------------------------------------------------------------------ */
/* Hedonic model parameters                                            */
/* ------------------------------------------------------------------ */

interface HedonicParams {
  peak: number;
  baseline: number;
  tau: number;
  rippleAmp: number;
  ripplePhase: number;
  rippleFreq: number;
}

function hedonicParams(milestoneId: string): HedonicParams {
  return {
    peak: 0.85 + 0.15 * seededUnit(milestoneId, 'peak'),
    baseline: 0.28 + 0.14 * seededUnit(milestoneId, 'baseline'),
    tau: 1.6 + 1.6 * seededUnit(milestoneId, 'tau'),
    rippleAmp: 0.03 * seededUnit(milestoneId, 'ripple-amp'),
    ripplePhase: 2 * Math.PI * seededUnit(milestoneId, 'ripple-phase'),
    rippleFreq: 0.8 + 1.4 * seededUnit(milestoneId, 'ripple-freq'),
  };
}

/* ------------------------------------------------------------------ */
/* Portal implementation                                               */
/* ------------------------------------------------------------------ */

type StageMode =
  | { kind: 'intake' }
  | { kind: 'scenario'; milestone: Milestone; index: number }
  | { kind: 'verdict'; milestone: Milestone };

interface TrackedListener {
  target: EventTarget;
  type: string;
  handler: EventListener;
}

const CHART_W = 640;
const CHART_H = 300;
const MIN_STRATEGY_CHARS = 80;

export class CruciblePortal implements ICruciblePortal {
  private readonly store: IFocusStore;
  private root: HTMLDivElement | null = null;
  private styleEl: HTMLStyleElement | null = null;
  private stageEl: HTMLDivElement | null = null;
  private archiveEl: HTMLDivElement | null = null;
  private listeners: TrackedListener[] = [];
  private mode: StageMode = { kind: 'intake' };

  constructor(store: IFocusStore) {
    this.store = store;
  }

  /* ----------------------------- lifecycle ---------------------------- */

  mount(container: HTMLElement): void {
    this.unmount();

    this.styleEl = document.createElement('style');
    this.styleEl.textContent = CRUCIBLE_CSS;
    document.head.appendChild(this.styleEl);

    this.root = document.createElement('div');
    this.root.className = 'fme-crucible-root';

    const header = document.createElement('header');
    header.className = 'fme-crucible-header';
    const title = document.createElement('h2');
    title.className = 'fme-crucible-title';
    title.textContent = 'The Crucible Portal';
    const tagline = document.createElement('p');
    tagline.className = 'fme-crucible-tagline';
    tagline.textContent =
      'Premortem, not pep talk. Name the milestone, face the three ways it structurally fails, and log what you will actually do.';
    header.appendChild(title);
    header.appendChild(tagline);
    this.root.appendChild(header);

    this.stageEl = document.createElement('div');
    this.stageEl.className = 'fme-crucible-stage';
    this.root.appendChild(this.stageEl);

    this.archiveEl = document.createElement('div');
    this.archiveEl.className = 'fme-crucible-archive';
    this.root.appendChild(this.archiveEl);

    container.appendChild(this.root);

    this.mode = { kind: 'intake' };
    this.renderStage();
    this.renderArchive();
  }

  unmount(): void {
    for (const { target, type, handler } of this.listeners) {
      target.removeEventListener(type, handler);
    }
    this.listeners = [];
    if (this.root && this.root.parentNode) {
      this.root.parentNode.removeChild(this.root);
    }
    if (this.styleEl && this.styleEl.parentNode) {
      this.styleEl.parentNode.removeChild(this.styleEl);
    }
    this.root = null;
    this.styleEl = null;
    this.stageEl = null;
    this.archiveEl = null;
    this.mode = { kind: 'intake' };
  }

  /* --------------------------- hedonic model -------------------------- */

  computeHedonicCurve(milestone: Milestone): HedonicPoint[] {
    const p = hedonicParams(milestone.id);
    const points: HedonicPoint[] = [];
    for (let monthIndex = 0; monthIndex <= 12; monthIndex++) {
      const decay = p.baseline + (p.peak - p.baseline) * Math.exp(-monthIndex / p.tau);
      const ripple = p.rippleAmp * Math.sin(p.rippleFreq * monthIndex + p.ripplePhase);
      const satisfaction = Math.min(1, Math.max(0, decay + ripple));
      points.push({ monthIndex, satisfaction });
    }
    return points;
  }

  /* ----------------------------- listeners ---------------------------- */

  private on(target: EventTarget, type: string, handler: EventListener): void {
    target.addEventListener(type, handler);
    this.listeners.push({ target, type, handler });
  }

  private dropListenersFor(scope: HTMLElement): void {
    this.listeners = this.listeners.filter(({ target, type, handler }) => {
      const inScope = target instanceof Node && scope.contains(target);
      if (inScope) target.removeEventListener(type, handler);
      return !inScope;
    });
  }

  /* ------------------------------ rendering --------------------------- */

  private renderStage(): void {
    const stage = this.stageEl;
    if (!stage) return;
    this.dropListenersFor(stage);
    stage.textContent = '';

    switch (this.mode.kind) {
      case 'intake':
        this.renderIntake(stage);
        break;
      case 'scenario':
        this.renderScenario(stage, this.mode.milestone, this.mode.index);
        break;
      case 'verdict':
        this.renderVerdict(stage, this.mode.milestone);
        break;
    }
  }

  private renderIntake(stage: HTMLElement): void {
    const card = document.createElement('section');
    card.className = 'fme-crucible-card';

    const heading = document.createElement('h3');
    heading.className = 'fme-crucible-card-heading';
    heading.textContent = 'Name the milestone';
    card.appendChild(heading);

    const hint = document.createElement('p');
    hint.className = 'fme-crucible-hint';
    hint.textContent =
      'One concrete outcome you are chasing. You will not get a pep talk — you will get its three most likely failure modes.';
    card.appendChild(hint);

    const row = document.createElement('div');
    row.className = 'fme-crucible-input-row';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'fme-crucible-input';
    input.placeholder = 'e.g. Ship v1 of the focus engine';
    input.maxLength = 120;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'fme-crucible-btn';
    button.textContent = 'Enter the Crucible';
    button.disabled = true;

    row.appendChild(input);
    row.appendChild(button);
    card.appendChild(row);
    stage.appendChild(card);

    this.on(input, 'input', () => {
      button.disabled = input.value.trim().length === 0;
    });
    this.on(input, 'keydown', (ev: Event) => {
      if (ev instanceof KeyboardEvent && ev.key === 'Enter' && !button.disabled) {
        button.click();
      }
    });
    this.on(button, 'click', () => {
      const titleText = input.value.trim();
      if (titleText.length === 0) return;
      const id = makeMilestoneId(titleText);
      const existing = this.store.getMilestones().find((m) => m.id === id);
      if (existing) {
        // Re-entering a known milestone resumes it; overwriting would
        // silently destroy already-logged containment strategies.
        this.mode = existing.crucibleComplete
          ? { kind: 'verdict', milestone: existing }
          : { kind: 'scenario', milestone: existing, index: existing.containments.length };
      } else {
        const milestone: Milestone = {
          id,
          title: titleText,
          createdAtMs: Date.now(),
          containments: [],
          crucibleComplete: false,
        };
        this.store.upsertMilestone(milestone);
        this.mode = { kind: 'scenario', milestone, index: 0 };
      }
      this.renderStage();
      this.renderArchive();
    });

    input.focus();
  }

  private renderScenario(stage: HTMLElement, milestone: Milestone, index: number): void {
    const scenario = FAILURE_SCENARIOS[index];

    const card = document.createElement('section');
    card.className = 'fme-crucible-card';

    const progress = document.createElement('div');
    progress.className = 'fme-crucible-progress';
    progress.textContent = `Milestone: ${milestone.title} — Failure ${index + 1} of ${FAILURE_SCENARIOS.length}`;
    card.appendChild(progress);

    const heading = document.createElement('h3');
    heading.className = 'fme-crucible-card-heading';
    heading.textContent = scenario.title;
    card.appendChild(heading);

    const narrative = document.createElement('p');
    narrative.className = 'fme-crucible-narrative';
    narrative.textContent = scenario.narrative;
    card.appendChild(narrative);

    const prompt = document.createElement('p');
    prompt.className = 'fme-crucible-prompt';
    prompt.textContent = scenario.accountabilityPrompt;
    card.appendChild(prompt);

    const textarea = document.createElement('textarea');
    textarea.className = 'fme-crucible-textarea';
    textarea.rows = 5;
    textarea.placeholder =
      'Behavior + trigger + fallback. Be specific enough that a stranger could execute it.';
    card.appendChild(textarea);

    const footer = document.createElement('div');
    footer.className = 'fme-crucible-footer';

    const counter = document.createElement('span');
    counter.className = 'fme-crucible-counter';

    const logBtn = document.createElement('button');
    logBtn.type = 'button';
    logBtn.className = 'fme-crucible-btn';
    logBtn.textContent = 'Log Containment';
    logBtn.disabled = true;

    footer.appendChild(counter);
    footer.appendChild(logBtn);
    card.appendChild(footer);
    stage.appendChild(card);

    const updateCounter = (): void => {
      const len = textarea.value.trim().length;
      const ready = len >= MIN_STRATEGY_CHARS;
      counter.textContent = ready
        ? `${len} characters — containment is loggable.`
        : `${len} / ${MIN_STRATEGY_CHARS} characters minimum. Vague answers stay unlogged.`;
      counter.classList.toggle('fme-crucible-counter-ready', ready);
      logBtn.disabled = !ready;
    };
    updateCounter();

    this.on(textarea, 'input', updateCounter);
    this.on(logBtn, 'click', () => {
      const strategyText = textarea.value.trim();
      if (strategyText.length < MIN_STRATEGY_CHARS) return;

      const entry: ContainmentEntry = {
        scenarioId: scenario.id,
        strategyText,
        loggedAtMs: Date.now(),
      };
      milestone.containments = [...milestone.containments, entry];

      const isLast = index === FAILURE_SCENARIOS.length - 1;
      if (isLast) {
        milestone.crucibleComplete = true;
      }
      this.store.upsertMilestone(milestone);

      this.mode = isLast
        ? { kind: 'verdict', milestone }
        : { kind: 'scenario', milestone, index: index + 1 };
      this.renderStage();
      this.renderArchive();
    });

    textarea.focus();
  }

  private renderVerdict(stage: HTMLElement, milestone: Milestone): void {
    const card = document.createElement('section');
    card.className = 'fme-crucible-card';

    const heading = document.createElement('h3');
    heading.className = 'fme-crucible-card-heading';
    heading.textContent = `Hedonic forecast — ${milestone.title}`;
    card.appendChild(heading);

    if (!milestone.crucibleComplete) {
      const warn = document.createElement('p');
      warn.className = 'fme-crucible-hint';
      warn.textContent =
        `Crucible incomplete: ${milestone.containments.length} of ${FAILURE_SCENARIOS.length} containments logged.`;
      card.appendChild(warn);
    }

    const points = this.computeHedonicCurve(milestone);
    const params = hedonicParams(milestone.id);

    const canvas = document.createElement('canvas');
    canvas.className = 'fme-crucible-canvas';
    card.appendChild(canvas);
    drawHedonicChart(canvas, points, params.baseline);

    const peakValue = points[0].satisfaction;
    let nearBaselineMonth = 12;
    for (const pt of points) {
      if (pt.satisfaction <= params.baseline + 0.05) {
        nearBaselineMonth = pt.monthIndex;
        break;
      }
    }

    const verdict = document.createElement('p');
    verdict.className = 'fme-crucible-verdict';
    verdict.textContent =
      `Satisfaction peaks at ${peakValue.toFixed(2)} and decays to near-baseline by month ` +
      `${nearBaselineMonth}. The spike is real. The plateau is the job. Your containments are the plan.`;
    card.appendChild(verdict);

    if (milestone.crucibleComplete) {
      const list = document.createElement('ol');
      list.className = 'fme-crucible-containment-list';
      for (const entry of milestone.containments) {
        const scenario = FAILURE_SCENARIOS.find((s) => s.id === entry.scenarioId);
        const li = document.createElement('li');
        const label = document.createElement('strong');
        label.textContent = scenario ? `${scenario.title}: ` : `${entry.scenarioId}: `;
        li.appendChild(label);
        li.appendChild(document.createTextNode(entry.strategyText));
        list.appendChild(li);
      }
      card.appendChild(list);
    }

    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'fme-crucible-btn fme-crucible-btn-ghost';
    again.textContent = milestone.crucibleComplete
      ? 'Enter another milestone'
      : 'Back to intake';
    this.on(again, 'click', () => {
      this.mode = { kind: 'intake' };
      this.renderStage();
    });
    card.appendChild(again);

    stage.appendChild(card);
  }

  private renderArchive(): void {
    const archive = this.archiveEl;
    if (!archive) return;
    this.dropListenersFor(archive);
    archive.textContent = '';

    const milestones = this.store.getMilestones();
    if (milestones.length === 0) return;

    const heading = document.createElement('h3');
    heading.className = 'fme-crucible-card-heading';
    heading.textContent = 'Stored milestones';
    archive.appendChild(heading);

    const list = document.createElement('ul');
    list.className = 'fme-crucible-milestone-list';

    for (const m of milestones) {
      const li = document.createElement('li');
      li.className = 'fme-crucible-milestone-item';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fme-crucible-milestone-btn';
      btn.textContent = m.title;
      this.on(btn, 'click', () => {
        if (m.crucibleComplete || m.containments.length >= FAILURE_SCENARIOS.length) {
          this.mode = { kind: 'verdict', milestone: m };
        } else {
          this.mode = { kind: 'scenario', milestone: m, index: m.containments.length };
        }
        this.renderStage();
      });

      const status = document.createElement('span');
      const complete = m.crucibleComplete;
      status.className = complete
        ? 'fme-crucible-status fme-crucible-status-complete'
        : 'fme-crucible-status';
      status.textContent = complete
        ? 'Crucible complete'
        : `In progress (${m.containments.length}/${FAILURE_SCENARIOS.length})`;

      li.appendChild(btn);
      li.appendChild(status);
      list.appendChild(li);
    }

    archive.appendChild(list);
  }
}

/* ------------------------------------------------------------------ */
/* Canvas chart (no libraries)                                         */
/* ------------------------------------------------------------------ */

function drawHedonicChart(
  canvas: HTMLCanvasElement,
  points: HedonicPoint[],
  baseline: number,
): void {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.round(CHART_W * dpr);
  canvas.height = Math.round(CHART_H * dpr);
  canvas.style.width = `${CHART_W}px`;
  canvas.style.maxWidth = '100%';
  // Height follows width so narrow viewports scale instead of squishing.
  canvas.style.height = 'auto';
  canvas.style.aspectRatio = `${CHART_W} / ${CHART_H}`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const margin = { top: 26, right: 18, bottom: 36, left: 48 };
  const plotW = CHART_W - margin.left - margin.right;
  const plotH = CHART_H - margin.top - margin.bottom;
  const xOf = (month: number): number => margin.left + (month / 12) * plotW;
  const yOf = (sat: number): number => margin.top + (1 - sat) * plotH;

  // Background
  ctx.fillStyle = '#101623';
  ctx.fillRect(0, 0, CHART_W, CHART_H);

  // Horizontal gridlines + satisfaction labels (0 .. 1 in 0.25 steps)
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= 4; i++) {
    const sat = i / 4;
    const y = yOf(sat);
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, y);
    ctx.lineTo(margin.left + plotW, y);
    ctx.stroke();
    ctx.fillStyle = '#8ea0b8';
    ctx.fillText(sat.toFixed(2), margin.left - 8, y);
  }

  // Month ticks + labels 0..12
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let month = 0; month <= 12; month++) {
    const x = xOf(month);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.moveTo(x, margin.top);
    ctx.lineTo(x, margin.top + plotH);
    ctx.stroke();
    ctx.fillStyle = '#8ea0b8';
    ctx.fillText(String(month), x, margin.top + plotH + 6);
  }

  // Axis titles
  ctx.fillStyle = '#aebdd2';
  ctx.fillText('months after achievement', margin.left + plotW / 2, CHART_H - 14);
  ctx.save();
  ctx.translate(12, margin.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('satisfaction', 0, 0);
  ctx.restore();

  // Axes
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, margin.top + plotH);
  ctx.lineTo(margin.left + plotW, margin.top + plotH);
  ctx.stroke();

  // Smooth curve path (midpoint quadratic smoothing)
  const traceCurve = (): void => {
    ctx.beginPath();
    ctx.moveTo(xOf(points[0].monthIndex), yOf(points[0].satisfaction));
    for (let i = 1; i < points.length - 1; i++) {
      const cx = xOf(points[i].monthIndex);
      const cy = yOf(points[i].satisfaction);
      const mx = (cx + xOf(points[i + 1].monthIndex)) / 2;
      const my = (cy + yOf(points[i + 1].satisfaction)) / 2;
      ctx.quadraticCurveTo(cx, cy, mx, my);
    }
    const last = points[points.length - 1];
    ctx.lineTo(xOf(last.monthIndex), yOf(last.satisfaction));
  };

  // Area fill under the curve
  traceCurve();
  ctx.lineTo(xOf(12), yOf(0));
  ctx.lineTo(xOf(0), yOf(0));
  ctx.closePath();
  const fill = ctx.createLinearGradient(0, margin.top, 0, margin.top + plotH);
  fill.addColorStop(0, 'rgba(94,176,255,0.34)');
  fill.addColorStop(1, 'rgba(94,176,255,0.03)');
  ctx.fillStyle = fill;
  ctx.fill();

  // Curve stroke
  traceCurve();
  ctx.strokeStyle = '#5eb0ff';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  // Dashed hedonic baseline
  const baseY = yOf(baseline);
  ctx.save();
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = '#e8a13d';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(margin.left, baseY);
  ctx.lineTo(margin.left + plotW, baseY);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#e8a13d';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('hedonic baseline', margin.left + plotW - 4, baseY - 4);

  // Peak marker (decay model peaks at month 0)
  const peak = points[0];
  const px = xOf(peak.monthIndex);
  const py = yOf(peak.satisfaction);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#5eb0ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px, py, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#dce8f7';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`peak ${peak.satisfaction.toFixed(2)}`, px + 10, py);
}

/* ------------------------------------------------------------------ */
/* Injected styles                                                     */
/* ------------------------------------------------------------------ */

const CRUCIBLE_CSS = `
.fme-crucible-root {
  max-width: 720px;
  margin: 0 auto;
  padding: 16px;
  color: #dce4ef;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  line-height: 1.55;
}
.fme-crucible-header { margin-bottom: 18px; }
.fme-crucible-title {
  margin: 0 0 6px;
  font-size: 1.45rem;
  letter-spacing: 0.02em;
  color: #f3f6fb;
}
.fme-crucible-tagline { margin: 0; color: #97a6ba; font-size: 0.92rem; }
.fme-crucible-card {
  background: #161d2b;
  border: 1px solid #2a3549;
  border-radius: 10px;
  padding: 18px;
  margin-bottom: 20px;
}
.fme-crucible-card-heading { margin: 0 0 10px; font-size: 1.1rem; color: #f0f4fa; }
.fme-crucible-hint { margin: 0 0 12px; color: #97a6ba; font-size: 0.9rem; }
.fme-crucible-progress {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6f8099;
  margin-bottom: 8px;
}
.fme-crucible-input-row { display: flex; gap: 10px; flex-wrap: wrap; }
.fme-crucible-input {
  flex: 1 1 240px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #33415a;
  background: #0e1420;
  color: #e8eef7;
  font-size: 1rem;
}
.fme-crucible-input:focus { outline: 2px solid #5eb0ff; outline-offset: 1px; }
.fme-crucible-btn {
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #3a6ea8;
  background: #234a75;
  color: #eaf2fc;
  font-size: 0.95rem;
  cursor: pointer;
}
.fme-crucible-btn:hover:not(:disabled) { background: #2c5c92; }
.fme-crucible-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.fme-crucible-btn-ghost { background: transparent; border-color: #3b4a63; margin-top: 12px; }
.fme-crucible-narrative { margin: 0 0 12px; color: #cfd9e7; }
.fme-crucible-prompt {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-left: 3px solid #e8a13d;
  background: rgba(232,161,61,0.08);
  color: #f0dcb8;
  font-size: 0.95rem;
}
.fme-crucible-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #33415a;
  background: #0e1420;
  color: #e8eef7;
  font-size: 0.95rem;
  resize: vertical;
}
.fme-crucible-textarea:focus { outline: 2px solid #5eb0ff; outline-offset: 1px; }
.fme-crucible-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.fme-crucible-counter { font-size: 0.85rem; color: #8b6f3f; }
.fme-crucible-counter-ready { color: #6fce8f; }
.fme-crucible-canvas {
  display: block;
  margin: 8px 0 12px;
  border-radius: 8px;
  border: 1px solid #2a3549;
}
.fme-crucible-verdict {
  margin: 0 0 12px;
  font-weight: 600;
  color: #f3e9d4;
}
.fme-crucible-containment-list { margin: 0 0 8px; padding-left: 20px; }
.fme-crucible-containment-list li { margin-bottom: 8px; font-size: 0.92rem; color: #c6d1e0; }
.fme-crucible-milestone-list { list-style: none; margin: 0; padding: 0; }
.fme-crucible-milestone-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #222c3f;
}
.fme-crucible-milestone-btn {
  background: none;
  border: none;
  color: #7cbcff;
  font-size: 0.95rem;
  cursor: pointer;
  text-align: left;
  padding: 0;
  text-decoration: underline;
}
.fme-crucible-status { font-size: 0.8rem; color: #97a6ba; white-space: nowrap; }
.fme-crucible-status-complete { color: #6fce8f; }
`;
