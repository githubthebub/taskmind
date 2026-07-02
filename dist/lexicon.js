/**
 * Neurological re-indexing text lexicon. Fully local dictionary component:
 * every prompt lives in the active StateConfig, selected deterministically by
 * (phase, cycle) so a session is reproducible and no prompt repeats
 * back-to-back within a phase slot.
 */
export class Lexicon {
    constructor(config) {
        this.config = config;
    }
    prompt(phase, cycle) {
        const pool = this.config.prompts[phase];
        if (pool.length === 0)
            return this.config.anchor;
        return pool[cycle % pool.length] ?? this.config.anchor;
    }
    get anchor() {
        return this.config.anchor;
    }
}
