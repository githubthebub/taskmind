/**
 * SHIELD MAX — shared type contracts.
 *
 * Every module in the bundle codes against these interfaces only.
 * The compilation unit is a single-file, zero-dependency browser bundle
 * (tsconfig `module: "none"`), so all symbols share one script scope and
 * are re-exported onto `globalThis.SHIELD` by main.ts for the test harness.
 */

/** The three Yerkes–Dodson arousal states tracked by the engine. */
type FocusStateId = 'SLUGGISH' | 'BALANCED' | 'HYPER';

/** One rolling-window sample of behavioral telemetry from the game surface. */
interface MetricsSample {
  /** ms since session start */
  t: number;
  /** steering, rotation and placement inputs per minute over the window */
  actionsPerMinute: number;
  /** misplacements ÷ total placements over the window (0..1) */
  errorRate: number;
  /** mean ms between piece spawn and first input */
  meanLatencyMs: number;
  /** fraction of the window with no input at all (0..1) */
  idleRatio: number;
}

/** A single row of the JSON state-transition table. */
interface StateTransitionRule {
  from: FocusStateId | '*';
  to: FocusStateId;
  /** inclusive lower bound on arousal index */
  min: number;
  /** exclusive upper bound on arousal index */
  max: number;
  /** ms the reading must persist before the transition fires */
  dwellMs: number;
  /** side effect the app layer must execute on entry */
  action: 'NONE' | 'FREEZE_AND_BREATHE' | 'TEMPO_BOOST' | 'EXIT_PROMPT';
}

/** Declarative engine config — kept as plain JSON so it can be audited/persisted. */
interface MatrixEngineConfig {
  initial: FocusStateId;
  /** hysteresis margin applied when leaving the current state's band */
  hysteresis: number;
  rules: StateTransitionRule[];
}

interface StateChangeEvent {
  from: FocusStateId;
  to: FocusStateId;
  action: StateTransitionRule['action'];
  /** normalized 0..1 composite arousal index that tripped the rule */
  arousalIndex: number;
}

type StateChangeListener = (ev: StateChangeEvent) => void;

/** Persistent record of one completed focus session. */
interface SessionRecord {
  startedAt: number;
  endedAt: number;
  patternsCleared: number;
  bestAccuracy: number;
  timeInStateMs: Record<FocusStateId, number>;
  exitedIntentionally: boolean;
}

/** Cumulative, versioned localStorage schema. */
interface FocusVaultSchema {
  version: number;
  totalPatternsCleared: number;
  totalSessions: number;
  totalFocusMs: number;
  bestStreak: number;
  unlockedBundleIds: string[];
  sessions: SessionRecord[];
  crucibleEntries: CrucibleEntry[];
}

/** One generated pre-mortem scenario. */
interface FailureScenario {
  frictionCategory: string;
  title: string;
  narrative: string;
  /** 0..1 modeled probability weight used to shade the chart */
  weight: number;
}

/** A saved Crucible run. */
interface CrucibleEntry {
  createdAt: number;
  milestone: string;
  scenarios: FailureScenario[];
  curve: HedonicCurve;
}

/** Parameters of the hedonic adaptation model S(t) = B + (P − B)·e^(−λt). */
interface HedonicCurve {
  /** long-run satisfaction baseline (0..1) */
  baseline: number;
  /** peak satisfaction at attainment (0..1) */
  peak: number;
  /** monthly decay constant λ */
  lambda: number;
  /** month index → modeled satisfaction, 13 points (month 0..12) */
  points: number[];
  /** months until the boost has decayed halfway back to baseline */
  halfLifeMonths: number;
}

/** A gated motivational bundle in the reward vault. */
interface RewardBundle {
  id: string;
  /** total lifetime patterns cleared required to unlock */
  requiredClears: number;
  title: string;
  lines: string[];
  /** calming audio script rendered by CalmAudio (generated, no assets) */
  audio: { baseHz: number; beatHz: number; seconds: number };
}

/** Runtime knobs the engine pushes down into the game surface. */
interface GameDirectives {
  /** 1.0 normally, 2.5 under SLUGGISH tempo boost */
  tempoMultiplier: number;
  /** 1.0 normally, raised under SLUGGISH for contrast scaling */
  contrastBoost: number;
  frozen: boolean;
}
