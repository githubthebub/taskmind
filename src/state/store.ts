import type { ProgressState } from '../types.js';

const STORAGE_KEY = 'taskmind.progress.v1';

export const DEFAULT_PROGRESS: ProgressState = {
  schemaVersion: 1,
  verifiedCycles: 0,
  bestRun: 0,
  sessionsCompleted: 0,
  companionLevel: 1,
  milestonesReached: [],
  hapticsEnabled: true,
  audioEnabled: true,
};

/**
 * Local-only persistence. Everything lives in localStorage on this device;
 * there is no network path anywhere in the app.
 */
export class ProgressStore {
  private state: ProgressState;
  private readonly subscribers = new Set<(s: ProgressState) => void>();

  constructor() {
    this.state = this.load();
  }

  get(): ProgressState {
    return this.state;
  }

  update(patch: Partial<Omit<ProgressState, 'schemaVersion'>>): ProgressState {
    this.state = { ...this.state, ...patch, schemaVersion: 1 };
    this.save();
    for (const fn of [...this.subscribers]) fn(this.state);
    return this.state;
  }

  subscribe(fn: (s: ProgressState) => void): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  private load(): ProgressState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_PROGRESS;
      const parsed = JSON.parse(raw) as Partial<ProgressState>;
      if (parsed.schemaVersion !== 1) return DEFAULT_PROGRESS;
      return { ...DEFAULT_PROGRESS, ...parsed, schemaVersion: 1 };
    } catch {
      return DEFAULT_PROGRESS;
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Storage unavailable (private mode quota etc.) — session still works, progress just won't persist.
    }
  }
}
