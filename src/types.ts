/**
 * Shared contracts for the somatic engagement engine.
 * Every subsystem (breath, haptics, audio, avatar, prompts, milestones)
 * communicates exclusively through these types and the event bus.
 */

/** The three active phases of the 4-7-8 protocol, plus the idle rest state. */
export type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'idle';

/** Durations of each active phase, in milliseconds. */
export interface BreathProtocol {
  readonly name: string;
  readonly inhaleMs: number;
  readonly holdMs: number;
  readonly exhaleMs: number;
}

/** Emitted continuously (once per animation frame) while a session runs. */
export interface BreathTick {
  readonly phase: BreathPhase;
  /** 0..1 progress through the current phase. */
  readonly phaseProgress: number;
  /** Completed cycles this session. */
  readonly cycleCount: number;
  /** Elapsed session time in ms. */
  readonly elapsedMs: number;
}

/** Emitted exactly once at each phase boundary. */
export interface PhaseTransition {
  readonly from: BreathPhase;
  readonly to: BreathPhase;
  readonly cycleCount: number;
}

/** Avatar expression layers — each maps to an SVG layer group. */
export type AvatarExpression =
  | 'neutral'
  | 'warm'
  | 'focused'
  | 'delighted'
  | 'proud'
  | 'gentle-concern';

/** Events the avatar state machine consumes. */
export type AvatarEvent =
  | 'SESSION_START'
  | 'PHASE_INHALE'
  | 'PHASE_HOLD'
  | 'PHASE_EXHALE'
  | 'CYCLE_COMPLETE'
  | 'FOCUS_BROKEN'
  | 'MILESTONE_REACHED'
  | 'LEVEL_UP'
  | 'SESSION_END';

/** One node in the local JSON avatar state machine. */
export interface AvatarStateNode {
  readonly expression: AvatarExpression;
  /** Dialogue pool key to draw micro-dialogue lines from while in this state. */
  readonly dialoguePool: string;
  /** Breathing-idle animation intensity, 0..1. */
  readonly animationIntensity: number;
  /** event -> next state id */
  readonly on: Readonly<Partial<Record<AvatarEvent, string>>>;
}

export interface AvatarMachineDefinition {
  readonly initial: string;
  readonly states: Readonly<Record<string, AvatarStateNode>>;
}

/** A milestone that gates avatar/companion progression. */
export interface FocusMilestone {
  readonly id: string;
  readonly title: string;
  /** Verified uninterrupted cycles required (lifetime, across sessions). */
  readonly cyclesRequired: number;
  /** Companion level unlocked when reached. */
  readonly unlocksLevel: number;
}

/** Persisted progress. Local only — never leaves the device. */
export interface ProgressState {
  readonly schemaVersion: 1;
  /** Lifetime verified uninterrupted cycles. */
  readonly verifiedCycles: number;
  /** Longest uninterrupted run of cycles in a single session. */
  readonly bestRun: number;
  readonly sessionsCompleted: number;
  readonly companionLevel: number;
  readonly milestonesReached: readonly string[];
  /** User toggles. */
  readonly hapticsEnabled: boolean;
  readonly audioEnabled: boolean;
}

/** One cognitive-reframing prompt shown during practice. */
export interface ReframePrompt {
  readonly id: string;
  /** Phase during which this prompt is relevant ('any' = phase-agnostic). */
  readonly phase: BreathPhase | 'any';
  /** Minimum companion level before this prompt enters rotation. */
  readonly minLevel: number;
  readonly text: string;
}

/** App-wide event map for the typed bus. */
export interface EngineEvents {
  tick: BreathTick;
  transition: PhaseTransition;
  sessionStart: { protocol: BreathProtocol };
  sessionEnd: { cycles: number; uninterrupted: boolean };
  focusBroken: { reason: 'visibility' | 'blur' | 'manual' };
  milestone: FocusMilestone;
  levelUp: { level: number };
  progress: ProgressState;
}

export type EngineEventName = keyof EngineEvents;

export type Listener<E extends EngineEventName> = (payload: EngineEvents[E]) => void;
