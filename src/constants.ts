import type { AppSettings } from './types';

/**
 * Soft maximum for kumbhaka retention, in seconds. When reached the app plays
 * a gentle release cue and shows a calm "release when you're ready" prompt —
 * never a countdown, never an alarm.
 *
 * PLACEHOLDER VALUE — this cap must be reviewed and signed off by a clinician
 * or experienced teacher before any release. It is deliberately conservative
 * until then. Do not raise it in code review; raise it with a clinician.
 */
export const SOFT_RETENTION_CAP_SECONDS = 60;

/**
 * Safety invariant: retention duration and bandha intensity never
 * auto-escalate. Any change comes from an explicit user-initiated setting.
 */
export const AUTO_ESCALATION_ALLOWED = false;

export const DEFAULT_SETTINGS: AppSettings = {
  trigger: {
    technique: 'bhastrika',
    rounds: 3,
    breathsPerRound: 25, // user-adjustable 20-30 default band
    retentionAfterRound: true,
  },
  maxRoundsBeforePrompt: 3,
  breathsPerStep: 4,
  autoAdvanceSteps: false,
  advancedMudraChains: false,
  eyesClosedMode: false,
  soundEnabled: true,
  cueTempo: 'standard',
};

/** Bhastrika pacing band, breaths per minute (pulsing tempo, not box phases). */
export const BHASTRIKA_BPM = { min: 40, default: 60, max: 90 } as const;
/** Tummo pacing is deeper and slower than bhastrika. */
export const TUMMO_BPM = { min: 20, default: 30, max: 40 } as const;

/** Practice-gated (never payment-gated) mudra complexity tiers. */
export const MUDRA_TIER_THRESHOLDS = { tier2: 5, tier3: 15 } as const;

export const STORAGE_KEYS = {
  settings: 'stillpoint.settings.v1',
  sessionLog: 'stillpoint.sessionLog.v1',
  progression: 'stillpoint.progression.v1',
} as const;
