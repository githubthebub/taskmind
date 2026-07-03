const STORAGE_KEY = 'taskmind.progress.v1';
export const DEFAULT_PROGRESS = {
    schemaVersion: 1,
    verifiedCycles: 0,
    bestRun: 0,
    sessionsCompleted: 0,
    companionLevel: 1,
    milestonesReached: [],
    hapticsEnabled: true,
    audioEnabled: true,
    mudraMode: false,
    mudraId: 'gyan',
};
/**
 * Local-only persistence. Everything lives in localStorage on this device;
 * there is no network path anywhere in the app.
 */
export class ProgressStore {
    constructor() {
        this.subscribers = new Set();
        this.state = this.load();
    }
    get() {
        return this.state;
    }
    update(patch) {
        this.state = { ...this.state, ...patch, schemaVersion: 1 };
        this.save();
        for (const fn of [...this.subscribers])
            fn(this.state);
        return this.state;
    }
    subscribe(fn) {
        this.subscribers.add(fn);
        return () => this.subscribers.delete(fn);
    }
    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw)
                return DEFAULT_PROGRESS;
            const parsed = JSON.parse(raw);
            if (parsed.schemaVersion !== 1)
                return DEFAULT_PROGRESS;
            return { ...DEFAULT_PROGRESS, ...parsed, schemaVersion: 1 };
        }
        catch {
            return DEFAULT_PROGRESS;
        }
    }
    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        }
        catch {
            // Storage unavailable (private mode quota etc.) — session still works, progress just won't persist.
        }
    }
}
