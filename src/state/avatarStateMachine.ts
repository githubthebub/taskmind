import type { AvatarEvent, AvatarMachineDefinition, AvatarStateNode } from '../types.js';

/**
 * Interpreter for the local JSON avatar state machine. Pure and synchronous:
 * given the current state and an event, either transitions (returning the new
 * node) or ignores the event (returning null). No side effects — rendering
 * subscribes to onChange.
 */
export class AvatarStateMachine {
  private current: string;
  private readonly changeListeners = new Set<(id: string, node: AvatarStateNode) => void>();

  constructor(private readonly definition: AvatarMachineDefinition) {
    if (!definition.states[definition.initial]) {
      throw new Error(`Avatar machine: initial state "${definition.initial}" not defined`);
    }
    this.current = definition.initial;
  }

  get stateId(): string {
    return this.current;
  }

  get node(): AvatarStateNode {
    return this.definition.states[this.current];
  }

  send(event: AvatarEvent): AvatarStateNode | null {
    const target = this.node.on[event];
    if (!target) return null;
    const nextNode = this.definition.states[target];
    if (!nextNode) {
      throw new Error(`Avatar machine: state "${this.current}" routes "${event}" to unknown state "${target}"`);
    }
    this.current = target;
    for (const fn of [...this.changeListeners]) fn(target, nextNode);
    return nextNode;
  }

  onChange(fn: (id: string, node: AvatarStateNode) => void): () => void {
    this.changeListeners.add(fn);
    return () => this.changeListeners.delete(fn);
  }
}
