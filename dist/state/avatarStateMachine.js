/**
 * Interpreter for the local JSON avatar state machine. Pure and synchronous:
 * given the current state and an event, either transitions (returning the new
 * node) or ignores the event (returning null). No side effects — rendering
 * subscribes to onChange.
 */
export class AvatarStateMachine {
    constructor(definition) {
        this.definition = definition;
        this.changeListeners = new Set();
        if (!definition.states[definition.initial]) {
            throw new Error(`Avatar machine: initial state "${definition.initial}" not defined`);
        }
        this.current = definition.initial;
    }
    get stateId() {
        return this.current;
    }
    get node() {
        return this.definition.states[this.current];
    }
    send(event) {
        const target = this.node.on[event];
        if (!target)
            return null;
        const nextNode = this.definition.states[target];
        if (!nextNode) {
            throw new Error(`Avatar machine: state "${this.current}" routes "${event}" to unknown state "${target}"`);
        }
        this.current = target;
        for (const fn of [...this.changeListeners])
            fn(target, nextNode);
        return nextNode;
    }
    onChange(fn) {
        this.changeListeners.add(fn);
        return () => this.changeListeners.delete(fn);
    }
}
