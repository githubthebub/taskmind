/**
 * FOCUS METRIC ENGINE — Shared Type Contract
 *
 * Single source of truth for every module in the application.
 * All modules are offline-first: no network calls, no cloud hooks,
 * localStorage-backed persistence only.
 */

/* ------------------------------------------------------------------ */
/* Behavioral State Engine (Yerkes-Dodson arousal model)              */
/* ------------------------------------------------------------------ */

/** The three user arousal archetypes. */
export type ArousalArchetype = 'sluggish' | 'balanced' | 'hyper';

/** Rendering + gameplay parameters bound to an archetype. */
export interface ArchetypeProfile {
  id: ArousalArchetype;
  label: string;
  description: string;
  /** Gameplay speed multiplier applied to gravity/spawn cadence. 1.0 = baseline. */
  tempoMultiplier: number;
  /** 'max' switches canvas palette to maximum-contrast rendering. */
  contrastMode: 'normal' | 'max';
  /** When true, entering this state locks inputs and forces the 4-7-8 breathing gate. */
  requiresBreathingGate: boolean;
  /** Puzzle precision mode: 'high-precision' slows piece motion and tightens scoring. */
  puzzleMode: 'standard' | 'high-precision' | 'high-tempo';
}

/** One row of the local JSON state-transition matrix. */
export interface StateTransition {
  from: ArousalArchetype;
  to: ArousalArchetype;
  /** Trigger that permits this transition. */
  trigger:
    | 'user-select'
    | 'breathing-complete'
    | 'quota-verified'
    | 'performance-drop'
    | 'performance-rise';
  /** Minimum verified focus seconds required before this transition is legal. */
  minFocusSeconds: number;
}

export interface StateEngineEvents {
  onStateChange: (prev: ArousalArchetype, next: ArousalArchetype, profile: ArchetypeProfile) => void;
  /** Fired when a transition demands the breathing gate before completing. */
  onBreathingGateRequired: (pendingTarget: ArousalArchetype) => void;
  /** Fired when the engine verifies a 'balanced' state: exit-driven UX must engage. */
  onBalancedVerified: () => void;
}

export interface IStateEngine {
  readonly current: ArousalArchetype;
  readonly profile: ArchetypeProfile;
  /** Full transition matrix (serializable local JSON). */
  readonly matrix: StateTransition[];
  requestTransition(target: ArousalArchetype, trigger: StateTransition['trigger']): boolean;
  /** Called by the breathing overlay when the unskippable cycle finishes. */
  notifyBreathingComplete(): void;
  /** Aborts a pending gated transition without committing it (fail-closed). */
  cancelPendingGate(): void;
  /** Feed live puzzle performance so the engine can auto-detect drift. */
  reportPerformance(sample: PerformanceSample): void;
  serialize(): string;
}

export interface PerformanceSample {
  timestampMs: number;
  matchesPerMinute: number;
  errorRate: number; // 0..1 misdrop ratio
  focusSeconds: number;
}

/* ------------------------------------------------------------------ */
/* Attention Puzzle (HTML5 Canvas block-matching grid)                */
/* ------------------------------------------------------------------ */

export interface GridPosition {
  col: number;
  row: number;
}

/** A tetromino-style geometric piece; matrix of 0/1 cells. */
export interface BlockPiece {
  id: number;
  shape: number[][];
  colorIndex: number;
  position: GridPosition;
  rotationState: 0 | 1 | 2 | 3;
}

export interface PuzzleConfig {
  cols: number;
  rows: number;
  cellPx: number;
  /** Base fall interval in ms before tempo multiplier is applied. */
  baseTickMs: number;
  tempoMultiplier: number;
  contrastMode: 'normal' | 'max';
  puzzleMode: 'standard' | 'high-precision' | 'high-tempo';
  /** Pattern-matching matrices: clearing requires matching one of these target patterns per row segment. */
  patternTargets: number[][][];
}

export interface PuzzleStats {
  blocksCleared: number;
  linesCleared: number;
  patternsMatched: number;
  rotationsPerformed: number;
  matchesPerMinute: number;
  errorRate: number;
  elapsedFocusSeconds: number;
}

export interface PuzzleCallbacks {
  onStatsUpdate: (stats: PuzzleStats) => void;
  onBlockCleared: (totalCleared: number) => void;
  onGameOver: (finalStats: PuzzleStats) => void;
}

export interface IPuzzleEngine {
  readonly stats: PuzzleStats;
  start(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
  /** Hot-swap config when the state engine changes archetype. */
  applyConfig(patch: Partial<PuzzleConfig>): void;
  /** Lock/unlock user input (used by breathing gate interception). */
  setInputLocked(locked: boolean): void;
}

/* ------------------------------------------------------------------ */
/* Somatic Breathing Overlay (4s inhale / 7s hold / 8s exhale)        */
/* ------------------------------------------------------------------ */

export interface BreathingPhase {
  name: 'inhale' | 'hold' | 'exhale';
  durationMs: number;
  instruction: string;
}

export interface BreathingConfig {
  phases: BreathingPhase[];
  /** Number of full 4-7-8 cycles before the gate releases. */
  cycles: number;
  /** Unskippable: overlay ignores dismissal attempts until cycles complete. */
  skippable: false;
}

export interface IBreathingOverlay {
  /**
   * Mounts a fullscreen vector overlay into `host`, locks everything beneath,
   * and resolves only after all cycles complete. Never resolves early.
   */
  run(host: HTMLElement): Promise<void>;
  readonly active: boolean;
}

/* ------------------------------------------------------------------ */
/* Exhaustion Premortem Module ('Crucible Portal')                    */
/* ------------------------------------------------------------------ */

export interface FailureScenario {
  id: string;
  title: string;
  /** Deterministic structural failure narrative shown to the user. */
  narrative: string;
  /** Radical-accountability prompt the user must answer. */
  accountabilityPrompt: string;
}

export interface ContainmentEntry {
  scenarioId: string;
  strategyText: string;
  loggedAtMs: number;
}

export interface Milestone {
  id: string;
  title: string;
  createdAtMs: number;
  containments: ContainmentEntry[];
  /** True once all three failure scenarios have logged strategies. */
  crucibleComplete: boolean;
}

/** One point on the hedonic adaptation / satisfaction decay curve. */
export interface HedonicPoint {
  monthIndex: number; // 0..12
  satisfaction: number; // 0..1
}

export interface ICruciblePortal {
  mount(container: HTMLElement): void;
  unmount(): void;
  /** Deterministic decay model: same milestone id -> same curve. */
  computeHedonicCurve(milestone: Milestone): HedonicPoint[];
}

/* ------------------------------------------------------------------ */
/* Persistence (localStorage schema) & Content Gating                  */
/* ------------------------------------------------------------------ */

export interface FocusSessionRecord {
  id: string;
  startedAtMs: number;
  endedAtMs: number;
  archetypeAtStart: ArousalArchetype;
  archetypeAtEnd: ArousalArchetype;
  blocksCleared: number;
  focusSeconds: number;
}

export interface QuotaState {
  /** Lifetime verified block clears. */
  totalBlocksCleared: number;
  /** Clears accrued in the current session. */
  sessionBlocksCleared: number;
  /** Content tiers already unlocked (tier index = quota threshold met). */
  unlockedTiers: number[];
}

export interface StoreSchema {
  sessions: FocusSessionRecord[];
  quota: QuotaState;
  milestones: Milestone[];
  stateMatrixOverride: StateTransition[] | null;
  schemaVersion: number;
}

export interface IFocusStore {
  load(): StoreSchema;
  save(schema: StoreSchema): void;
  appendSession(record: FocusSessionRecord): void;
  updateQuota(patch: Partial<QuotaState>): QuotaState;
  upsertMilestone(m: Milestone): void;
  getMilestones(): Milestone[];
  reset(): void;
}

/** Motivational/grounding content locked behind block-clearing quotas. */
export interface GatedContentItem {
  tier: number;
  /** Blocks that must be cleared before this item is retrievable. */
  quotaThreshold: number;
  kind: 'motivational-text' | 'grounding-script';
  title: string;
  body: string;
}

export interface IContentIndexer {
  /** Returns only items whose quotaThreshold <= verified cleared blocks. Locked items are never returned. */
  getUnlocked(totalBlocksCleared: number): GatedContentItem[];
  /** Returns metadata (titles + thresholds only, bodies withheld) for locked items. */
  getLockedPreviews(totalBlocksCleared: number): Array<Pick<GatedContentItem, 'tier' | 'quotaThreshold' | 'title'>>;
}

/** Offline audio: WebAudio-synthesized grounding cues; zero external assets. */
export interface IAudioEngine {
  /** Plays a breathing-phase cue tone (distinct pitch per phase). */
  playPhaseCue(phase: BreathingPhase['name']): void;
  /** Plays a synthesized grounding sweep, gated by quota verification. */
  playGroundingScript(tier: number, totalBlocksCleared: number): boolean;
  setMuted(muted: boolean): void;
}
