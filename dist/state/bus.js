/**
 * Minimal typed pub/sub bus. All subsystems are decoupled through this:
 * the breath engine publishes, haptics/audio/avatar/UI subscribe.
 */
export class EventBus {
    constructor() {
        this.listeners = new Map();
    }
    on(event, fn) {
        let set = this.listeners.get(event);
        if (!set) {
            set = new Set();
            this.listeners.set(event, set);
        }
        set.add(fn);
        return () => set?.delete(fn);
    }
    emit(event, payload) {
        const set = this.listeners.get(event);
        if (!set)
            return;
        for (const fn of [...set]) {
            fn(payload);
        }
    }
}
