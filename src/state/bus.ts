import type { EngineEventName, EngineEvents, Listener } from '../types.js';

/**
 * Minimal typed pub/sub bus. All subsystems are decoupled through this:
 * the breath engine publishes, haptics/audio/avatar/UI subscribe.
 */
export class EventBus {
  private readonly listeners = new Map<EngineEventName, Set<Listener<EngineEventName>>>();

  on<E extends EngineEventName>(event: E, fn: Listener<E>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(fn as Listener<EngineEventName>);
    return () => set?.delete(fn as Listener<EngineEventName>);
  }

  emit<E extends EngineEventName>(event: E, payload: EngineEvents[E]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const fn of [...set]) {
      (fn as Listener<E>)(payload);
    }
  }
}
