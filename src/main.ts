/**
 * SHIELD MAX bootstrap — wires the four modules together.
 *
 *   game telemetry ──▶ BehavioralMatrixEngine ──▶ directives ──▶ game
 *                                   │
 *                 HYPER ▶ BreathingOverlay (input freeze, 4-7-8)
 *              SLUGGISH ▶ 2.5× tempo + contrast scaling
 *              BALANCED ▶ ExitDirector (lock the device, leave)
 *
 * Pure logic classes are exported on `globalThis.SHIELD` so the Node test
 * harness can exercise them without a browser.
 */

const SHIELD_TEMPO_BOOST = 2.5;
const SHIELD_CONTRAST_BOOST = 1.35;
const TELEMETRY_WINDOW_MS = 20000;
const TELEMETRY_INTERVAL_MS = 1000;

interface ShieldExports {
  BehavioralMatrixEngine: typeof BehavioralMatrixEngine;
  computeArousalIndex: typeof computeArousalIndex;
  DEFAULT_ENGINE_CONFIG: MatrixEngineConfig;
  FocusVault: typeof FocusVault;
  MemoryBackend: typeof MemoryBackend;
  generateFailureScenarios: typeof generateFailureScenarios;
  computeHedonicCurve: typeof computeHedonicCurve;
  hashMilestone: typeof hashMilestone;
  RewardGate: typeof RewardGate;
  REWARD_BUNDLES: RewardBundle[];
  ExitDirector: typeof ExitDirector;
  rotatedShape: typeof rotatedShape;
  BREATH_478: typeof BREATH_478;
  /** live app handles, populated at boot; used by the browser smoke test */
  app?: { game: VisuospatialCompanion };
}

const SHIELD: ShieldExports = {
  BehavioralMatrixEngine,
  computeArousalIndex,
  DEFAULT_ENGINE_CONFIG,
  FocusVault,
  MemoryBackend,
  generateFailureScenarios,
  computeHedonicCurve,
  hashMilestone,
  RewardGate,
  REWARD_BUNDLES,
  ExitDirector,
  rotatedShape,
  BREATH_478,
};
(globalThis as { SHIELD?: ShieldExports }).SHIELD = SHIELD;

function shieldBoot(): void {
  const $ = (sel: string): HTMLElement => {
    const el = document.querySelector(sel);
    if (el === null) throw new Error(`SHIELD MAX: missing required element ${sel}`);
    return el as HTMLElement;
  };

  const vault = new FocusVault();
  const audio = new CalmAudio();
  const engine = new BehavioralMatrixEngine();
  const game = new VisuospatialCompanion($('#game-canvas') as HTMLCanvasElement);
  const breathing = new BreathingOverlay($('#breathing-overlay'), audio);
  const crucible = new CrucibleModule($('#crucible-panel'), vault);
  void crucible; // constructed for its event wiring; owns its own lifecycle
  const rewards = new RewardGate($('#rewards-panel'), vault, audio);
  const exitDirector = new ExitDirector($('#exit-overlay'));

  const stateBadge = $('#state-badge');
  const arousalFill = $('#arousal-fill');
  const hudLevel = $('#hud-level');
  const hudStreak = $('#hud-streak');
  const hudTimer = $('#hud-timer');
  const hudMemory = $('#hud-memory');
  const hudClears = $('#hud-clears');
  const toast = $('#toast');

  const sessionStart = Date.now();
  let patternsThisSession = 0;
  let bestAccuracy = 0;
  let toastTimer = 0;

  const showToast = (text: string): void => {
    toast.textContent = text;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 4000);
  };

  const directives: GameDirectives = { tempoMultiplier: 1, contrastBoost: 1, frozen: false };
  const pushDirectives = (): void => game.applyDirectives(directives);

  const stateLabels: Record<FocusStateId, string> = {
    SLUGGISH: 'Sluggish / Low-Tempo',
    BALANCED: 'Balanced / Deep-Work',
    HYPER: 'Hyper-Arousal / Restless',
  };

  const renderState = (state: FocusStateId): void => {
    stateBadge.textContent = stateLabels[state];
    stateBadge.dataset.state = state;
  };
  renderState(engine.currentState);

  engine.onStateChange((ev) => {
    renderState(ev.to);
    switch (ev.action) {
      case 'FREEZE_AND_BREATHE': {
        // Immediate takeover: freeze standard input, run 3 full 4-7-8 cycles.
        directives.frozen = true;
        directives.tempoMultiplier = 1;
        directives.contrastBoost = 1;
        pushDirectives();
        breathing.start(3, () => {
          directives.frozen = false;
          pushDirectives();
          showToast('Heart rate down-shifted. Re-entering at a calmer tempo.');
        });
        break;
      }
      case 'TEMPO_BOOST': {
        directives.tempoMultiplier = SHIELD_TEMPO_BOOST;
        directives.contrastBoost = SHIELD_CONTRAST_BOOST;
        directives.frozen = false;
        pushDirectives();
        showToast('Low tempo detected — contrast and pace raised 2.5× to re-alert.');
        break;
      }
      case 'EXIT_PROMPT': {
        directives.tempoMultiplier = 1;
        directives.contrastBoost = 1;
        directives.frozen = false;
        pushDirectives();
        break;
      }
      case 'NONE':
        break;
    }
  });

  game.onPatternCleared = (streak, accuracy) => {
    patternsThisSession++;
    if (accuracy > bestAccuracy) bestAccuracy = accuracy;
    vault.recordPatternCleared(streak);
    hudClears.textContent = String(vault.totalPatternsCleared);
    rewards.refresh();
    showToast(`Pattern cleared — streak ${streak}, accuracy ${Math.round(accuracy * 100)}%.`);
  };

  rewards.onUnlock = (bundle) => showToast(`Vault unlocked: ${bundle.title}`);

  game.onHud = (hud) => {
    hudLevel.textContent = String(hud.level);
    hudStreak.textContent = String(hud.streak);
    hudTimer.textContent = `${hud.timeLeft.toFixed(0)}s`;
    hudMemory.textContent = hud.memoryMode ? 'RECALL' : 'VISIBLE';
    hudMemory.dataset.mode = hud.memoryMode ? 'recall' : 'visible';
  };

  exitDirector.onExitConfirmed = () => {
    game.stop();
    vault.recordSession({
      startedAt: sessionStart,
      endedAt: Date.now(),
      patternsCleared: patternsThisSession,
      bestAccuracy,
      timeInStateMs: engine.timeInStateMs,
      exitedIntentionally: true,
    });
    document.body.classList.add('session-ended');
    $('#ended-summary').textContent =
      `Session banked: ${patternsThisSession} patterns, best accuracy ${Math.round(bestAccuracy * 100)}%. ` +
      'The screen is done with you. Go.';
  };

  // Telemetry pump: game → engine → HUD/directives, once per second.
  window.setInterval(() => {
    if (breathing.isActive || document.body.classList.contains('session-ended')) return;
    const sample = game.sampleTelemetry(performance.now(), TELEMETRY_WINDOW_MS);
    const arousalIndex = engine.ingest(sample);
    arousalFill.style.width = `${Math.round(arousalIndex * 100)}%`;
    arousalFill.dataset.band = arousalIndex < 0.33 ? 'low' : arousalIndex < 0.7 ? 'mid' : 'high';
    exitDirector.maybePrompt(
      engine.currentState,
      engine.stateResidencyMs,
      patternsThisSession,
      (Date.now() - sessionStart) / 60000,
    );
  }, TELEMETRY_INTERVAL_MS);

  // Tab switching for the right-hand panels.
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.tab-btn'));
  for (const btn of tabs) {
    btn.addEventListener('click', () => {
      for (const other of tabs) other.classList.toggle('active', other === btn);
      for (const panel of Array.from(document.querySelectorAll<HTMLElement>('.tab-panel'))) {
        panel.classList.toggle('active', panel.id === btn.dataset.panel);
      }
    });
  }

  ($('#touch-rotate') as HTMLButtonElement).addEventListener('click', () => game.uiRotate());
  ($('#touch-place') as HTMLButtonElement).addEventListener('click', () => game.uiPlace());
  ($('#touch-swap') as HTMLButtonElement).addEventListener('click', () => game.uiDiscard());

  hudClears.textContent = String(vault.totalPatternsCleared);
  rewards.refresh();
  game.start();
  SHIELD.app = { game };
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', shieldBoot);
  } else {
    shieldBoot();
  }
}
