/**
 * Practitioner progression — PRACTICE-GATED, NEVER PAYMENT-GATED.
 *
 * Mudra tiers and eyes-closed mode unlock through completed sessions and
 * learn-mode walkthroughs only. There is no purchase, subscription, or any
 * other payment path to these unlocks, and none may ever be added.
 *
 * State is localStorage-backed and guarded the same way as the session log:
 * unavailable/corrupt storage degrades to sensible defaults, never a throw.
 */

import { MUDRA_TIER_THRESHOLDS, STORAGE_KEYS } from '../constants';
import { mudraShapes } from '../data/mudras';
import type {
  ContinuationPath,
  MudraId,
  MudraTier,
  ProgressionState,
} from '../types';

function defaultProgression(): ProgressionState {
  return {
    sessionsCompleted: 0,
    completedByPath: {},
    mudraTier: 1,
    learnModeCompleted: [],
  };
}

/** Tier is derived purely from completed-session count. */
function deriveTier(sessionsCompleted: number): MudraTier {
  if (sessionsCompleted >= MUDRA_TIER_THRESHOLDS.tier3) return 3;
  if (sessionsCompleted >= MUDRA_TIER_THRESHOLDS.tier2) return 2;
  return 1;
}

function save(p: ProgressionState): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.progression, JSON.stringify(p));
  } catch {
    // Storage unavailable — progression just won't persist this time.
  }
}

export function loadProgression(): ProgressionState {
  try {
    if (typeof localStorage === 'undefined') return defaultProgression();
    const raw = localStorage.getItem(STORAGE_KEYS.progression);
    if (!raw) return defaultProgression();
    const parsed = JSON.parse(raw) as Partial<ProgressionState> | null;
    if (!parsed || typeof parsed !== 'object') return defaultProgression();
    const sessionsCompleted =
      typeof parsed.sessionsCompleted === 'number' && parsed.sessionsCompleted >= 0
        ? parsed.sessionsCompleted
        : 0;
    return {
      sessionsCompleted,
      completedByPath:
        parsed.completedByPath && typeof parsed.completedByPath === 'object'
          ? parsed.completedByPath
          : {},
      // Always re-derive rather than trusting the stored tier.
      mudraTier: deriveTier(sessionsCompleted),
      learnModeCompleted: Array.isArray(parsed.learnModeCompleted)
        ? parsed.learnModeCompleted
        : [],
    };
  } catch {
    return defaultProgression();
  }
}

/**
 * Record one completed session on the given path, re-deriving the mudra tier
 * from MUDRA_TIER_THRESHOLDS. Returns the new state (also persisted).
 */
export function recordCompletedSession(
  path: ContinuationPath | 'classic-anapanasati',
): ProgressionState {
  const p = loadProgression();
  const sessionsCompleted = p.sessionsCompleted + 1;
  const next: ProgressionState = {
    ...p,
    sessionsCompleted,
    completedByPath: {
      ...p.completedByPath,
      [path]: (p.completedByPath[path] ?? 0) + 1,
    },
    mudraTier: deriveTier(sessionsCompleted),
  };
  save(next);
  return next;
}

/** Mark mudra learn-mode walkthroughs completed (idempotent union). */
export function markLearnModeCompleted(ids: MudraId[]): ProgressionState {
  const p = loadProgression();
  const merged = [...p.learnModeCompleted];
  for (const id of ids) {
    if (!merged.includes(id)) merged.push(id);
  }
  const next: ProgressionState = { ...p, learnModeCompleted: merged };
  save(next);
  return next;
}

/**
 * Eyes-closed (audio-only) mode is eligible only once the learn-mode
 * walkthrough is complete for EVERY mudra in the app.
 */
export function eyesClosedEligible(p: ProgressionState): boolean {
  const all = Object.keys(mudraShapes) as MudraId[];
  return all.every((id) => p.learnModeCompleted.includes(id));
}
