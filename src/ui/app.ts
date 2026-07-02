/**
 * UI Orchestrator.
 *
 * Wires the store, content indexer, audio engine, state engine, puzzle
 * engine, breathing overlay, and crucible portal into a three-view layout:
 *
 *   Accelerator  — canvas puzzle + archetype selector + quota HUD
 *   Crucible     — exhaustion premortem portal
 *   Vault        — quota-gated motivational / grounding content
 *
 * Owns the two interception behaviors the platform is built around:
 *   1. Breathing-gate interception: entering 'hyper' locks every
 *      interactable target and runs the unskippable 4-7-8 overlay.
 *   2. Exit-driven UX: a verified 'balanced' state instructs the user to
 *      lock the app and anchor concentration onto real-world execution.
 */
import type {
  ArousalArchetype,
  ArchetypeProfile,
  FocusSessionRecord,
  PuzzleStats,
} from '../types.js';
import { PuzzleEngine, DEFAULT_PUZZLE_CONFIG } from '../puzzle/engine.js';
import { BreathingOverlay, DEFAULT_BREATHING_CONFIG } from '../somatic/breathing.js';
import { AudioEngine } from '../audio/audioEngine.js';
import { CruciblePortal } from '../premortem/crucible.js';
import { FocusStore } from '../storage/store.js';
import { ContentIndexer, QUOTA_TIERS, quotaGate } from '../content/indexer.js';
import { StateEngine, ARCHETYPE_PROFILES } from '../state/stateEngine.js';

type ViewName = 'accelerator' | 'crucible' | 'vault';

const ARCHETYPES: ArousalArchetype[] = ['sluggish', 'balanced', 'hyper'];

export class App {
  private readonly root: HTMLElement;
  private readonly store = new FocusStore();
  private readonly indexer = new ContentIndexer();
  private readonly audio = new AudioEngine(quotaGate);
  private readonly breathing = new BreathingOverlay(DEFAULT_BREATHING_CONFIG, this.audio);
  private readonly crucible = new CruciblePortal(this.store);
  private stateEngine!: StateEngine;
  private puzzle: PuzzleEngine | null = null;

  private view: ViewName = 'accelerator';
  private sessionStartMs = Date.now();
  private sessionStartArchetype: ArousalArchetype = 'balanced';
  private lastStats: PuzzleStats | null = null;
  private locked = false;

  private els = {
    tabs: new Map<ViewName, HTMLButtonElement>(),
    views: new Map<ViewName, HTMLElement>(),
    archetypeButtons: new Map<ArousalArchetype, HTMLButtonElement>(),
    stateLabel: null as HTMLElement | null,
    stateDescription: null as HTMLElement | null,
    hud: null as HTMLElement | null,
    canvas: null as HTMLCanvasElement | null,
    exitPanel: null as HTMLElement | null,
    vaultBody: null as HTMLElement | null,
  };

  constructor(root: HTMLElement) {
    this.root = root;
  }

  start(): void {
    const schema = this.store.load();
    this.stateEngine = new StateEngine(
      {
        onStateChange: (prev, next, profile) => this.handleStateChange(prev, next, profile),
        onBreathingGateRequired: (target) => void this.runBreathingGate(target),
        onBalancedVerified: () => this.engageExitUX(),
      },
      'balanced',
      schema.stateMatrixOverride,
    );
    this.buildLayout();
    this.mountPuzzle();
    this.applyProfileToUI(this.stateEngine.profile);
    this.renderVault();
    this.showView('accelerator');
    window.addEventListener('pagehide', () => this.recordSession());
  }

  /* ---------------------------------------------------------------- */
  /* Layout                                                            */
  /* ---------------------------------------------------------------- */

  private buildLayout(): void {
    this.root.innerHTML = '';

    const header = el('header', 'fme-header');
    header.append(
      el('h1', 'fme-title', 'FOCUS METRIC ENGINE'),
      el('p', 'fme-subtitle', 'Offline task accelerator · visuospatial anchor · state shifter'),
    );

    const nav = el('nav', 'fme-tabs');
    const tabDefs: Array<[ViewName, string]> = [
      ['accelerator', 'Accelerator'],
      ['crucible', 'Crucible Portal'],
      ['vault', 'Vault'],
    ];
    for (const [name, label] of tabDefs) {
      const btn = el('button', 'fme-tab', label) as HTMLButtonElement;
      btn.type = 'button';
      btn.addEventListener('click', () => this.showView(name));
      this.els.tabs.set(name, btn);
      nav.append(btn);
    }

    const main = el('main', 'fme-main');
    for (const [name] of tabDefs) {
      const section = el('section', `fme-view fme-view-${name}`);
      section.hidden = true;
      this.els.views.set(name, section);
      main.append(section);
    }

    this.buildAcceleratorView(this.els.views.get('accelerator')!);
    this.crucible.mount(this.els.views.get('crucible')!);
    this.buildVaultView(this.els.views.get('vault')!);

    this.root.append(header, nav, main);
  }

  private buildAcceleratorView(host: HTMLElement): void {
    const statePanel = el('div', 'fme-state-panel');
    statePanel.append(el('h2', 'fme-panel-heading', 'Report your current state'));
    const btnRow = el('div', 'fme-archetype-row');
    for (const id of ARCHETYPES) {
      const profile = ARCHETYPE_PROFILES[id];
      const btn = el('button', `fme-archetype fme-archetype-${id}`, profile.label) as HTMLButtonElement;
      btn.type = 'button';
      btn.addEventListener('click', () => this.selectArchetype(id));
      this.els.archetypeButtons.set(id, btn);
      btnRow.append(btn);
    }
    const stateLabel = el('div', 'fme-state-label');
    const stateDescription = el('p', 'fme-state-description');
    this.els.stateLabel = stateLabel;
    this.els.stateDescription = stateDescription;
    statePanel.append(btnRow, stateLabel, stateDescription);

    const stage = el('div', 'fme-stage');
    const canvas = document.createElement('canvas');
    canvas.className = 'fme-canvas';
    canvas.tabIndex = 0;
    this.els.canvas = canvas;
    const hud = el('aside', 'fme-hud');
    this.els.hud = hud;
    stage.append(canvas, hud);

    const exitPanel = el('div', 'fme-exit-panel');
    exitPanel.hidden = true;
    this.els.exitPanel = exitPanel;

    host.append(statePanel, stage, exitPanel);
  }

  private buildVaultView(host: HTMLElement): void {
    host.append(
      el('h2', 'fme-panel-heading', 'The Vault — earned, never given'),
      el(
        'p',
        'fme-vault-note',
        'Every item below is gated behind verified block-clearing quotas. Locked bodies are not stored in the view — clear blocks to index them.',
      ),
    );
    const body = el('div', 'fme-vault-body');
    this.els.vaultBody = body;
    host.append(body);
  }

  private showView(name: ViewName): void {
    if (this.locked) return;
    this.view = name;
    for (const [n, section] of this.els.views) section.hidden = n !== name;
    for (const [n, btn] of this.els.tabs) btn.classList.toggle('fme-tab-active', n === name);
    if (name === 'vault') this.renderVault();
    if (name === 'accelerator') this.puzzle?.resume();
    else this.puzzle?.pause();
  }

  /* ---------------------------------------------------------------- */
  /* Puzzle wiring                                                     */
  /* ---------------------------------------------------------------- */

  private mountPuzzle(): void {
    const canvas = this.els.canvas;
    if (!canvas) return;
    const profile = this.stateEngine.profile;
    this.puzzle = new PuzzleEngine(
      canvas,
      {
        ...DEFAULT_PUZZLE_CONFIG,
        tempoMultiplier: profile.tempoMultiplier,
        contrastMode: profile.contrastMode,
        puzzleMode: profile.puzzleMode,
      },
      {
        onStatsUpdate: (stats) => this.handleStats(stats),
        onBlockCleared: (total) => this.handleBlockCleared(total),
        onGameOver: (finalStats) => this.handleStats(finalStats),
      },
    );
    this.puzzle.start();
  }

  private handleStats(stats: PuzzleStats): void {
    this.lastStats = stats;
    this.stateEngine.reportPerformance({
      timestampMs: Date.now(),
      matchesPerMinute: stats.matchesPerMinute,
      errorRate: stats.errorRate,
      focusSeconds: stats.elapsedFocusSeconds,
    });
    this.renderHud(stats);
  }

  private handleBlockCleared(_totalThisRun: number): void {
    if (!this.lastStats) return;
    const quota = this.store.load().quota;
    const updated = this.store.updateQuota({
      totalBlocksCleared: quota.totalBlocksCleared + 1,
      sessionBlocksCleared: quota.sessionBlocksCleared + 1,
    });
    // A fresh tier unlock is a verified quota event: legal path back to balanced.
    if (updated.unlockedTiers.length > quota.unlockedTiers.length) {
      this.stateEngine.requestTransition('balanced', 'quota-verified');
      if (this.view === 'vault') this.renderVault();
    }
  }

  private renderHud(stats: PuzzleStats): void {
    const hud = this.els.hud;
    if (!hud) return;
    const quota = this.store.load().quota;
    const nextTier = QUOTA_TIERS.find((t) => t > quota.totalBlocksCleared);
    hud.innerHTML = '';
    const rows: Array<[string, string]> = [
      ['State', ARCHETYPE_PROFILES[this.stateEngine.current].label],
      ['Focus', formatSeconds(stats.elapsedFocusSeconds)],
      ['Blocks cleared', String(quota.totalBlocksCleared)],
      ['Session clears', String(quota.sessionBlocksCleared)],
      ['Lines', String(stats.linesCleared)],
      ['Patterns matched', String(stats.patternsMatched)],
      ['Rotations', String(stats.rotationsPerformed)],
      ['Matches/min', stats.matchesPerMinute.toFixed(1)],
      ['Error rate', `${Math.round(stats.errorRate * 100)}%`],
      [
        'Next unlock',
        nextTier === undefined ? 'all tiers open' : `${nextTier - quota.totalBlocksCleared} blocks away`,
      ],
    ];
    for (const [k, v] of rows) {
      const row = el('div', 'fme-hud-row');
      row.append(el('span', 'fme-hud-key', k), el('span', 'fme-hud-value', v));
      hud.append(row);
    }
  }

  /* ---------------------------------------------------------------- */
  /* State transitions, breathing gate, exit UX                        */
  /* ---------------------------------------------------------------- */

  private selectArchetype(target: ArousalArchetype): void {
    if (this.locked || this.breathing.active) return;
    this.stateEngine.requestTransition(target, 'user-select');
    this.applyProfileToUI(this.stateEngine.profile);
  }

  private handleStateChange(
    _prev: ArousalArchetype,
    _next: ArousalArchetype,
    profile: ArchetypeProfile,
  ): void {
    this.puzzle?.applyConfig({
      tempoMultiplier: profile.tempoMultiplier,
      contrastMode: profile.contrastMode,
      puzzleMode: profile.puzzleMode,
    });
    this.applyProfileToUI(profile);
  }

  private applyProfileToUI(profile: ArchetypeProfile): void {
    document.body.classList.remove('fme-mode-sluggish', 'fme-mode-balanced', 'fme-mode-hyper');
    document.body.classList.add(`fme-mode-${this.stateEngine.current}`);
    document.body.classList.toggle('fme-contrast-max', profile.contrastMode === 'max');
    for (const [id, btn] of this.els.archetypeButtons) {
      btn.classList.toggle('fme-archetype-active', id === this.stateEngine.current);
    }
    if (this.els.stateLabel) this.els.stateLabel.textContent = profile.label;
    if (this.els.stateDescription) this.els.stateDescription.textContent = profile.description;
  }

  /**
   * Hyper-arousal interception: lock every interactable target, run the
   * unskippable 4-7-8 overlay, then commit the transition and drop the
   * user into the slow high-precision iteration.
   */
  private async runBreathingGate(_target: ArousalArchetype): Promise<void> {
    this.setInteractablesLocked(true);
    this.puzzle?.pause();
    this.puzzle?.setInputLocked(true);
    try {
      await this.breathing.run(document.body);
    } finally {
      this.stateEngine.notifyBreathingComplete();
      this.setInteractablesLocked(false);
      this.puzzle?.setInputLocked(false);
      if (this.view === 'accelerator') this.puzzle?.resume();
      this.applyProfileToUI(this.stateEngine.profile);
    }
  }

  /** Disables every interactable target entry element in the document. */
  private setInteractablesLocked(locked: boolean): void {
    const controls = this.root.querySelectorAll<HTMLElement>('button, input, textarea, select');
    for (const c of controls) {
      (c as HTMLButtonElement | HTMLInputElement | HTMLTextAreaElement).disabled = locked;
    }
    document.body.classList.toggle('fme-gate-locked', locked);
  }

  /**
   * Exit-driven UX: the app's success state is the user leaving it.
   * A verified balanced state surfaces the instruction to lock the app,
   * close the screen, and anchor concentration on real-world execution.
   */
  private engageExitUX(): void {
    const panel = this.els.exitPanel;
    if (!panel) return;
    panel.hidden = false;
    panel.innerHTML = '';
    panel.append(
      el('h2', 'fme-exit-heading', 'BALANCED STATE VERIFIED'),
      el(
        'p',
        'fme-exit-body',
        'Your concentration is stabilized. This application has done its job. ' +
          'Lock the application. Close the screen. Carry this exact state directly ' +
          'into the first physical action of your real-world task — now, before it decays.',
      ),
    );
    const lockBtn = el('button', 'fme-exit-lock', 'Lock application & exit to task') as HTMLButtonElement;
    lockBtn.type = 'button';
    lockBtn.addEventListener('click', () => this.lockApplication());
    panel.append(lockBtn);
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private lockApplication(): void {
    this.recordSession();
    this.locked = true;
    this.puzzle?.pause();
    this.puzzle?.setInputLocked(true);
    this.root.innerHTML = '';
    const lockScreen = el('div', 'fme-lockscreen');
    lockScreen.append(
      el('h1', 'fme-lockscreen-title', 'LOCKED'),
      el(
        'p',
        'fme-lockscreen-body',
        'The engine is sealed. Your stabilized state belongs to the task in front of you. Go execute.',
      ),
      el('p', 'fme-lockscreen-hint', 'Reload the page to start a new regulation session.'),
    );
    this.root.append(lockScreen);
  }

  private recordSession(): void {
    const stats = this.lastStats;
    const record: FocusSessionRecord = {
      id: `session-${this.sessionStartMs.toString(36)}`,
      startedAtMs: this.sessionStartMs,
      endedAtMs: Date.now(),
      archetypeAtStart: this.sessionStartArchetype,
      archetypeAtEnd: this.stateEngine.current,
      blocksCleared: this.store.load().quota.sessionBlocksCleared,
      focusSeconds: Math.round(stats?.elapsedFocusSeconds ?? 0),
    };
    this.store.appendSession(record);
    this.store.updateQuota({ sessionBlocksCleared: 0 });
  }

  /* ---------------------------------------------------------------- */
  /* Vault                                                             */
  /* ---------------------------------------------------------------- */

  private renderVault(): void {
    const body = this.els.vaultBody;
    if (!body) return;
    const total = this.store.load().quota.totalBlocksCleared;
    body.innerHTML = '';

    for (const item of this.indexer.getUnlocked(total)) {
      const card = el('article', 'fme-vault-card fme-vault-unlocked');
      card.append(
        el('h3', 'fme-vault-card-title', `Tier ${item.tier} · ${item.title}`),
        el('p', 'fme-vault-card-kind', item.kind === 'motivational-text' ? 'Identity priming' : 'Grounding script'),
        el('p', 'fme-vault-card-body', item.body),
      );
      if (item.kind === 'grounding-script') {
        const play = el('button', 'fme-vault-play', 'Play grounding audio') as HTMLButtonElement;
        play.type = 'button';
        play.addEventListener('click', () => {
          const ok = this.audio.playGroundingScript(item.tier, this.store.load().quota.totalBlocksCleared);
          play.textContent = ok ? 'Playing…' : 'Quota not verified';
          window.setTimeout(() => (play.textContent = 'Play grounding audio'), 2500);
        });
        card.append(play);
      }
      body.append(card);
    }

    for (const preview of this.indexer.getLockedPreviews(total)) {
      const card = el('article', 'fme-vault-card fme-vault-locked');
      card.append(
        el('h3', 'fme-vault-card-title', `Tier ${preview.tier} · ${preview.title}`),
        el('p', 'fme-vault-card-body', `LOCKED — clear ${preview.quotaThreshold} total blocks to index this content.`),
      );
      body.append(card);
    }
  }
}

/* ------------------------------------------------------------------ */

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatSeconds(total: number): string {
  const s = Math.floor(total % 60);
  const m = Math.floor(total / 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
