/**
 * FocusStore — localStorage-backed persistence with an in-memory cache.
 *
 * Offline-first and corruption-safe: any parse or shape error during load()
 * falls back to a fresh default schema, and every localStorage access is
 * wrapped in try/catch so private-mode / quota failures degrade gracefully
 * to in-memory-only operation. Never throws on corrupt data.
 */

import type {
  ArousalArchetype,
  ContainmentEntry,
  FocusSessionRecord,
  IFocusStore,
  Milestone,
  QuotaState,
  StateTransition,
  StoreSchema,
} from '../types.js';
import { QUOTA_TIERS } from '../content/indexer.js';

const SCHEMA_VERSION = 1;
const MAX_SESSION_RECORDS = 200;

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

function defaultSchema(): StoreSchema {
  return {
    sessions: [],
    quota: {
      totalBlocksCleared: 0,
      sessionBlocksCleared: 0,
      unlockedTiers: [],
    },
    milestones: [],
    stateMatrixOverride: null,
    schemaVersion: SCHEMA_VERSION,
  };
}

/** Structural deep copy for the plain-JSON store schema. */
function cloneSchema(schema: StoreSchema): StoreSchema {
  return JSON.parse(JSON.stringify(schema)) as StoreSchema;
}

function cloneMilestone(m: Milestone): Milestone {
  return JSON.parse(JSON.stringify(m)) as Milestone;
}

/* ------------------------------------------------------------------ */
/* Runtime validation (field-by-field type checks)                     */
/* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

const AROUSAL_ARCHETYPES: readonly ArousalArchetype[] = ['sluggish', 'balanced', 'hyper'];

function isArousalArchetype(value: unknown): value is ArousalArchetype {
  return isString(value) && (AROUSAL_ARCHETYPES as readonly string[]).includes(value);
}

const TRANSITION_TRIGGERS: readonly StateTransition['trigger'][] = [
  'user-select',
  'breathing-complete',
  'quota-verified',
  'performance-drop',
  'performance-rise',
];

function isTransitionTrigger(value: unknown): value is StateTransition['trigger'] {
  return isString(value) && (TRANSITION_TRIGGERS as readonly string[]).includes(value);
}

function isFocusSessionRecord(value: unknown): value is FocusSessionRecord {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isNumber(value.startedAtMs) &&
    isNumber(value.endedAtMs) &&
    isArousalArchetype(value.archetypeAtStart) &&
    isArousalArchetype(value.archetypeAtEnd) &&
    isNumber(value.blocksCleared) &&
    isNumber(value.focusSeconds)
  );
}

function isQuotaState(value: unknown): value is QuotaState {
  return (
    isRecord(value) &&
    isNumber(value.totalBlocksCleared) &&
    isNumber(value.sessionBlocksCleared) &&
    Array.isArray(value.unlockedTiers) &&
    value.unlockedTiers.every(isNumber)
  );
}

function isContainmentEntry(value: unknown): value is ContainmentEntry {
  return (
    isRecord(value) &&
    isString(value.scenarioId) &&
    isString(value.strategyText) &&
    isNumber(value.loggedAtMs)
  );
}

function isMilestone(value: unknown): value is Milestone {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.title) &&
    isNumber(value.createdAtMs) &&
    Array.isArray(value.containments) &&
    value.containments.every(isContainmentEntry) &&
    isBoolean(value.crucibleComplete)
  );
}

function isStateTransition(value: unknown): value is StateTransition {
  return (
    isRecord(value) &&
    isArousalArchetype(value.from) &&
    isArousalArchetype(value.to) &&
    isTransitionTrigger(value.trigger) &&
    isNumber(value.minFocusSeconds)
  );
}

function isStoreSchema(value: unknown): value is StoreSchema {
  if (!isRecord(value)) return false;
  if (!isNumber(value.schemaVersion)) return false;
  if (!Array.isArray(value.sessions) || !value.sessions.every(isFocusSessionRecord)) {
    return false;
  }
  if (!isQuotaState(value.quota)) return false;
  if (!Array.isArray(value.milestones) || !value.milestones.every(isMilestone)) {
    return false;
  }
  const override = value.stateMatrixOverride;
  if (override !== null && (!Array.isArray(override) || !override.every(isStateTransition))) {
    return false;
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export class FocusStore implements IFocusStore {
  private readonly storageKey: string;
  private cache: StoreSchema;

  constructor(storageKey = 'focus-metric-engine.v1') {
    this.storageKey = storageKey;
    this.cache = this.readFromStorage();
  }

  load(): StoreSchema {
    this.cache = this.readFromStorage();
    return cloneSchema(this.cache);
  }

  save(schema: StoreSchema): void {
    this.cache = cloneSchema(schema);
    this.persist();
  }

  appendSession(record: FocusSessionRecord): void {
    this.cache.sessions.push({ ...record });
    if (this.cache.sessions.length > MAX_SESSION_RECORDS) {
      this.cache.sessions = this.cache.sessions.slice(-MAX_SESSION_RECORDS);
    }
    this.persist();
  }

  updateQuota(patch: Partial<QuotaState>): QuotaState {
    const merged: QuotaState = {
      ...this.cache.quota,
      ...patch,
    };
    merged.unlockedTiers = QUOTA_TIERS
      .map((threshold, tierIndex) => ({ threshold, tierIndex }))
      .filter(({ threshold }) => threshold <= merged.totalBlocksCleared)
      .map(({ tierIndex }) => tierIndex);
    this.cache.quota = merged;
    this.persist();
    return {
      ...merged,
      unlockedTiers: [...merged.unlockedTiers],
    };
  }

  upsertMilestone(m: Milestone): void {
    const copy = cloneMilestone(m);
    const index = this.cache.milestones.findIndex((existing) => existing.id === copy.id);
    if (index >= 0) {
      this.cache.milestones[index] = copy;
    } else {
      this.cache.milestones.push(copy);
    }
    this.persist();
  }

  getMilestones(): Milestone[] {
    return this.cache.milestones.map(cloneMilestone);
  }

  reset(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.storageKey);
      }
    } catch {
      // Storage unavailable (private mode, disabled, etc.) — in-memory only.
    }
    this.cache = defaultSchema();
  }

  /* ------------------------------------------------------------------ */
  /* Internals                                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Reads and validates the persisted schema. Any storage failure, parse
   * error, unexpected shape, or unsupported schema version yields a fresh
   * default schema. Never throws.
   */
  private readFromStorage(): StoreSchema {
    let raw: string | null = null;
    try {
      if (typeof localStorage !== 'undefined') {
        raw = localStorage.getItem(this.storageKey);
      }
    } catch {
      return defaultSchema();
    }
    if (raw === null) {
      return defaultSchema();
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isStoreSchema(parsed) && parsed.schemaVersion === SCHEMA_VERSION) {
        return cloneSchema(parsed);
      }
      // Unknown shape or future/legacy version with no migration path:
      // fall back to a fresh default rather than propagating bad state.
      return defaultSchema();
    } catch {
      return defaultSchema();
    }
  }

  private persist(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.cache));
      }
    } catch {
      // Quota exceeded or storage unavailable — keep the in-memory cache.
    }
  }
}
