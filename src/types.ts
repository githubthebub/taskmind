/**
 * Shared type contracts for the Stillpoint meditation app.
 *
 * Architecture (see README):
 *   Safety gate → Stage 0 trigger (bhastrika/tummo + kumbhaka) → Rapture Onset
 *   self-report tap → Path selector → one of four continuation paths.
 *
 * IMPORTANT FRAMING CONSTRAINT (applies to all code and copy):
 * "Rapture Onset" and "Settled" are USER SELF-REPORT taps only. Nothing in
 * this codebase claims physiological detection of pīti, sukha, or jhāna.
 */

// ---------------------------------------------------------------------------
// Stage 0: Trigger engine
// ---------------------------------------------------------------------------

export type TriggerTechnique = 'bhastrika' | 'tummo';

export interface TriggerConfig {
  technique: TriggerTechnique;
  /** Number of breath rounds. */
  rounds: number;
  /** Rapid breaths per round. */
  breathsPerRound: number;
  /** Hold (kumbhaka) after each round's final exhale. */
  retentionAfterRound: boolean;
}

export type TriggerEvent =
  | { type: 'round-start'; round: number }
  | { type: 'retention-start' }
  | { type: 'retention-release' }
  | { type: 'rapture-onset-tap'; timestamp: number };

export interface TriggerOutcome {
  /** Epoch ms of the Rapture Onset self-report tap; null if the user skipped. */
  raptureOnsetAt: number | null;
  roundsCompleted: number;
  /** True when the user chose "skip to settling anyway" after N tap-less rounds. */
  skippedToSettle: boolean;
}

// ---------------------------------------------------------------------------
// Continuation paths
// ---------------------------------------------------------------------------

export type ContinuationPath = 'fast-settle' | 'anapanasati' | 'tantric' | 'combo';

// --- Path A: Fast Settle (soft jhāna, Brasington-style) ---

export type JhanaFactor = 'vitakka' | 'vicara' | 'piti' | 'sukha' | 'ekaggata' | 'upekkha';

export interface SoftJhanaFactor {
  factor: JhanaFactor;
  label: string;
  /** Gentle in-session prompt, not a demand. */
  promptText: string;
}

// --- Path B: Full Ānāpānasati (16 steps, 4 tetrads) ---

export type TetradName = 'Body (kāya)' | 'Feeling (vedanā)' | 'Mind (citta)' | 'Insight (dhamma)';

export interface AnapanasatiStep {
  tetrad: 1 | 2 | 3 | 4;
  tetradName: TetradName;
  step: number; // 1-16
  instruction: string;
  attentionObject: string;
}

// --- Path C: Extended Tantric ---

export type Bandha = 'mula' | 'uddiyana' | 'jalandhara' | 'maha';

export interface BandhaStep {
  bandha: Bandha;
  name: string;
  description: string;
  /** jalandhara -> uddiyana -> mula when combining. */
  engagementOrder: number;
  /** antara = retention after inhale; bahya = retention after exhale. */
  pairsWithRetention: 'antara' | 'bahya';
}

export type ChakraId =
  | 'muladhara'
  | 'svadhisthana'
  | 'manipura'
  | 'anahata'
  | 'vishuddha'
  | 'ajna'
  | 'sahasrara';

export interface Chakra {
  id: ChakraId;
  name: string;
  sanskritName: string;
  location: string;
}

export interface TantricStage {
  stage: number;
  name: string;
  bandha: Bandha | null;
  chakra: ChakraId;
  mudra: MudraId;
  eyeState: EyeState;
  /** Traditional-practice framing; never a physiological claim. */
  guidance: string;
  /** Variant used when the user did NOT report Rapture Onset — the copy must
   *  not assert a rapture/energy state for them. Falls back to `guidance`. */
  guidanceNoRapture?: string;
}

// --- Path D: Combo ---

/**
 * Labels tantric stages with tetrad / jhāna-factor correspondences where a
 * correspondence is genuine; where it is not, `genuine` is false and the UI
 * must present the pairing as personal synthesis, not shared canonical lineage.
 */
export interface ComboCorrespondence {
  stage: number;
  tetradNote: string | null;
  jhanaFactorNote: string | null;
  genuine: boolean;
}

// ---------------------------------------------------------------------------
// Section 6: Shared mudra / figure / sound system
// ---------------------------------------------------------------------------

export type MudraId =
  | 'dhyana'
  | 'jnana-palms-down'
  | 'jnana-palms-up'
  | 'anjali'
  | 'bhairava'
  | 'padma';

export type FingerId = 'thumb' | 'index' | 'middle' | 'ring' | 'little';
export type FingerCurl = 'extended' | 'half' | 'curled';

export interface FingerState {
  curl: FingerCurl;
  /** Fingertip touches thumb tip (e.g. jñāna mudrā index). */
  touchesThumb: boolean;
}

export interface MudraShape {
  id: MudraId;
  name: string;
  sanskritName: string;
  meaning: string;
  palm: 'up' | 'down' | 'inward';
  placement: 'knees' | 'lap' | 'heart';
  fingers: Record<FingerId, FingerState>;
}

export type EyeState = 'open' | 'soft' | 'closed' | 'shambhavi-lock';

/** Figure motion mode — Path A settling must move toward 'still', never busier. */
export type FigureMotion = 'active' | 'settling' | 'still';

export interface SeatedBodyProps {
  mudra: MudraId;
  eyeState: EyeState;
  /** 0..1 breath cycle position for subtle torso animation; omit for none. */
  breathPhase?: number;
  /** Chakra to highlight on the figure (Path C/D visualization target). */
  glowChakra?: ChakraId | null;
  motion: FigureMotion;
  /** Morph transition duration between mudra/eye states. */
  transitionMs?: number;
}

export interface HandMudraProps {
  shape: MudraShape;
  side: 'left' | 'right';
  transitionMs?: number;
}

export interface FaceBlobProps {
  eyeState: EyeState;
  /** 0..1; higher = softer, more settled expression. */
  calm: number;
  transitionMs?: number;
}

// ---------------------------------------------------------------------------
// Sound cues
// ---------------------------------------------------------------------------

export type SoundCueId =
  | 'cue-breath-pulse'
  | 'cue-round-start'
  | 'cue-retention-start'
  | 'cue-retention-soft-cap'
  | 'cue-retention-release'
  | 'cue-rapture-onset' // "ignition confirmed"
  | 'cue-settled'
  | 'cue-settle-prompt'
  | 'cue-step-advance'
  | 'cue-chakra-shift'
  | 'cue-session-complete'
  | `cue-bandha-${Bandha}`
  | `cue-mudra-${MudraId}`;

/** Simple additive-synthesis spec so cues need no external audio assets. */
export interface SoundCueSpec {
  id: SoundCueId;
  /** Partial frequencies in Hz, played together. */
  freqs: number[];
  wave: OscillatorType;
  durationMs: number;
  /** 0..1 peak gain before master intensity is applied. */
  gain: number;
  envelope: 'pluck' | 'swell' | 'chime';
  description: string;
}

export interface SoundEngine {
  play(cue: SoundCueId): void;
  /**
   * 0..1 master intensity. Path A settling tapers this DOWN as the user
   * progresses — stimulation must never increase during settling.
   */
  setIntensity(level: number): void;
  setEnabled(on: boolean): void;
  /** Continuous breath-pacing pulse (bhastrika tempo), in breaths per minute. */
  startPacing(breathsPerMinute: number): void;
  stopPacing(): void;
  /** Unlock/resume the AudioContext after a user gesture. */
  resume(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Section 4: Returning-practitioner value layer
// ---------------------------------------------------------------------------

export type MudraTier = 1 | 2 | 3;

export interface ProgressionState {
  sessionsCompleted: number;
  completedByPath: Partial<Record<ContinuationPath | 'classic-anapanasati', number>>;
  /** Derived from sessionsCompleted — practice-gated, never payment-gated. */
  mudraTier: MudraTier;
  /** Mudra sets whose learn-mode walkthrough the user has completed. */
  learnModeCompleted: MudraId[];
}

// ---------------------------------------------------------------------------
// Session log (private by default, exportable)
// ---------------------------------------------------------------------------

export interface SessionLogEntry {
  id: string;
  /** Epoch ms of Stage 0 start (post safety gate). */
  startedAt: number;
  technique: TriggerTechnique | 'none';
  path: ContinuationPath | 'classic-anapanasati' | null;
  /** Core metric: ms from session start to Rapture Onset tap. Null = no tap. */
  raptureOnsetMs: number | null;
  /** Path A metric: ms from Rapture Onset tap to Settled tap. */
  settledMs: number | null;
  roundsCompleted: number;
  stepsCompleted: number | null;
  stagesCompleted: number | null;
  mudraSetUsed: string;
  eyesClosed: boolean;
  completed: boolean;
  endedAt: number;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface AppSettings {
  trigger: TriggerConfig;
  /** After this many tap-less rounds, offer keep-going / break / skip-to-settling. */
  maxRoundsBeforePrompt: number;
  /** Path B: breath cycles per step (self-paced default). */
  breathsPerStep: number;
  /** Path B: soft-auto advance after breathsPerStep cycles (manual otherwise). */
  autoAdvanceSteps: boolean;
  /** Path C/D: opt-in longer mudra chains (requires unlocked tier). */
  advancedMudraChains: boolean;
  /** Audio-only, no-visual live sessions (requires learn-mode completion). */
  eyesClosedMode: boolean;
  soundEnabled: boolean;
  /** 'brisk' cue tempo unlocks at tier 2. */
  cueTempo: 'standard' | 'brisk';
}

// ---------------------------------------------------------------------------
// Screen component contracts (implemented in src/components/*)
// ---------------------------------------------------------------------------

export interface SafetyGateProps {
  /** All contraindications denied + environment affirmed → Stage 0 unlocks. */
  onCleared: () => void;
  /** A contraindication applies → breath-retention work stays locked; the
   *  caller routes to gentle classic practice instead. */
  onContraindicated: () => void;
  onBack: () => void;
}

export interface TriggerStageProps {
  settings: AppSettings;
  sound: SoundEngine;
  sessionStartedAt: number;
  onComplete: (outcome: TriggerOutcome) => void;
  /** Carries the partial outcome so completed rounds are logged faithfully. */
  onAbort: (outcome: TriggerOutcome) => void;
}

export interface PathSelectorProps {
  outcome: TriggerOutcome;
  onSelect: (path: ContinuationPath) => void;
  onEndSession: () => void;
}

export interface PathScreenProps {
  settings: AppSettings;
  progression: ProgressionState;
  sound: SoundEngine;
  sessionStartedAt: number;
  raptureOnsetAt: number | null;
  /** Resolved eyes-closed eligibility (settings toggle AND learn-mode done). */
  eyesClosed: boolean;
  onComplete: (completion: PathCompletion) => void;
  onAbort: () => void;
}

export interface AnapanasatiProps extends PathScreenProps {
  /** post-trigger → offer "start at step 5" shortcut; classic → full 1-16. */
  entryMode: 'post-trigger' | 'classic';
}

export interface PathCompletion {
  /** Path A: epoch ms of the Settled self-report tap (null if none). */
  settledAt?: number | null;
  stepsCompleted?: number;
  stagesCompleted?: number;
  mudraSetUsed: string;
  endedEarly: boolean;
}
