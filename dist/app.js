"use strict";
/**
 * SHIELD MAX — shared type contracts.
 *
 * Every module in the bundle codes against these interfaces only.
 * The compilation unit is a single-file, zero-dependency browser bundle
 * (tsconfig `module: "none"`), so all symbols share one script scope and
 * are re-exported onto `globalThis.SHIELD` by main.ts for the test harness.
 */
/**
 * FocusVault — versioned localStorage persistence for all focus metrics.
 * Zero network, zero cloud: the vault never leaves the device.
 * Falls back to an in-memory store when localStorage is unavailable
 * (private-mode browsers, test harness).
 */
const VAULT_KEY = 'shieldmax.vault.v1';
const VAULT_VERSION = 1;
class MemoryBackend {
    constructor() {
        this.map = {};
    }
    getItem(key) {
        return Object.prototype.hasOwnProperty.call(this.map, key) ? this.map[key] : null;
    }
    setItem(key, value) {
        this.map[key] = value;
    }
}
class FocusVault {
    constructor(backend) {
        this.backend = backend ?? FocusVault.detectBackend();
        this.data = this.load();
    }
    static detectBackend() {
        try {
            if (typeof localStorage !== 'undefined') {
                const probe = '__shieldmax_probe__';
                localStorage.setItem(probe, '1');
                localStorage.removeItem(probe);
                return localStorage;
            }
        }
        catch {
            /* private mode or storage disabled — degrade to memory */
        }
        return new MemoryBackend();
    }
    static emptySchema() {
        return {
            version: VAULT_VERSION,
            totalPatternsCleared: 0,
            totalSessions: 0,
            totalFocusMs: 0,
            bestStreak: 0,
            unlockedBundleIds: [],
            sessions: [],
            crucibleEntries: [],
        };
    }
    load() {
        const raw = this.backend.getItem(VAULT_KEY);
        if (raw === null)
            return FocusVault.emptySchema();
        try {
            const parsed = JSON.parse(raw);
            if (typeof parsed !== 'object' || parsed === null || parsed.version !== VAULT_VERSION) {
                return FocusVault.emptySchema();
            }
            // Merge over the empty schema so missing fields self-heal.
            return { ...FocusVault.emptySchema(), ...parsed, version: VAULT_VERSION };
        }
        catch {
            return FocusVault.emptySchema();
        }
    }
    persist() {
        this.backend.setItem(VAULT_KEY, JSON.stringify(this.data));
    }
    snapshot() {
        return JSON.parse(JSON.stringify(this.data));
    }
    get totalPatternsCleared() {
        return this.data.totalPatternsCleared;
    }
    get unlockedBundleIds() {
        return [...this.data.unlockedBundleIds];
    }
    recordPatternCleared(streak) {
        this.data.totalPatternsCleared += 1;
        if (streak > this.data.bestStreak)
            this.data.bestStreak = streak;
        this.persist();
    }
    markBundleUnlocked(id) {
        if (!this.data.unlockedBundleIds.includes(id)) {
            this.data.unlockedBundleIds.push(id);
            this.persist();
        }
    }
    recordSession(record) {
        this.data.totalSessions += 1;
        this.data.totalFocusMs += Math.max(0, record.endedAt - record.startedAt);
        this.data.sessions.push(record);
        // Keep the vault bounded: retain the 200 most recent sessions.
        if (this.data.sessions.length > 200) {
            this.data.sessions = this.data.sessions.slice(-200);
        }
        this.persist();
    }
    recordCrucibleEntry(entry) {
        this.data.crucibleEntries.push(entry);
        if (this.data.crucibleEntries.length > 100) {
            this.data.crucibleEntries = this.data.crucibleEntries.slice(-100);
        }
        this.persist();
    }
}
/**
 * CalmAudio — fully generated calming audio via WebAudio.
 * No samples, no fetches: every sound is synthesized on-device from
 * oscillators (a warm drone with a slow binaural-style beat and a
 * breathing-paced amplitude swell).
 */
class CalmAudio {
    constructor() {
        this.ctx = null;
        this.activeNodes = [];
    }
    ensureCtx() {
        if (typeof AudioContext === 'undefined')
            return null;
        if (this.ctx === null)
            this.ctx = new AudioContext();
        if (this.ctx.state === 'suspended')
            void this.ctx.resume();
        return this.ctx;
    }
    get playing() {
        return this.activeNodes.length > 0;
    }
    /** Play a generated calming drone described by a reward bundle's audio script. */
    playScript(script) {
        const ctx = this.ensureCtx();
        if (ctx === null)
            return;
        this.stop();
        const master = ctx.createGain();
        master.gain.value = 0;
        master.connect(ctx.destination);
        const now = ctx.currentTime;
        const end = now + script.seconds;
        // Gentle fade in / out so the drone never clicks.
        master.gain.linearRampToValueAtTime(0.16, now + 2);
        master.gain.setValueAtTime(0.16, end - 2);
        master.gain.linearRampToValueAtTime(0, end);
        const oscA = ctx.createOscillator();
        oscA.type = 'sine';
        oscA.frequency.value = script.baseHz;
        const oscB = ctx.createOscillator();
        oscB.type = 'sine';
        oscB.frequency.value = script.baseHz + script.beatHz;
        // Slow amplitude swell at a resting-breath cadence (~6 breaths/min).
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.1;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.05;
        lfo.connect(lfoGain);
        lfoGain.connect(master.gain);
        oscA.connect(master);
        oscB.connect(master);
        oscA.start(now);
        oscB.start(now);
        lfo.start(now);
        oscA.stop(end);
        oscB.stop(end);
        lfo.stop(end);
        const handle = {
            stop: () => {
                try {
                    oscA.stop();
                    oscB.stop();
                    lfo.stop();
                }
                catch {
                    /* already stopped */
                }
                master.disconnect();
            },
        };
        this.activeNodes.push(handle);
        oscA.onended = () => {
            this.activeNodes = this.activeNodes.filter((n) => n !== handle);
            master.disconnect();
        };
    }
    /** Short soft cue tone used by the breathing guide at phase changes. */
    cue(freqHz) {
        const ctx = this.ensureCtx();
        if (ctx === null)
            return;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freqHz;
        const gain = ctx.createGain();
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.65);
    }
    stop() {
        for (const node of this.activeNodes)
            node.stop();
        this.activeNodes = [];
    }
}
/**
 * BehavioralMatrixEngine — local JSON state-transition engine over the
 * Yerkes–Dodson arousal model.
 *
 * Telemetry (action tempo, error rate, latency, idleness) is folded into a
 * single normalized arousal index. The engine walks a declarative JSON rule
 * table with hysteresis and dwell-time debouncing, and emits the side effect
 * each state entry demands:
 *
 *   HYPER    → FREEZE_AND_BREATHE  (input freeze + 4-7-8 vagal downshift)
 *   SLUGGISH → TEMPO_BOOST         (2.5× game tempo + contrast scaling)
 *   BALANCED → EXIT_PROMPT         (exit-driven UX: leave the app)
 *
 * Everything is deterministic and locally computed — no clocks are read
 * internally; callers pass timestamps in, which keeps the engine pure and
 * unit-testable.
 */
const DEFAULT_ENGINE_CONFIG = {
    initial: 'BALANCED',
    hysteresis: 0.05,
    rules: [
        { from: '*', to: 'SLUGGISH', min: 0.0, max: 0.33, dwellMs: 4000, action: 'TEMPO_BOOST' },
        { from: '*', to: 'BALANCED', min: 0.33, max: 0.7, dwellMs: 6000, action: 'EXIT_PROMPT' },
        { from: '*', to: 'HYPER', min: 0.7, max: 1.01, dwellMs: 2500, action: 'FREEZE_AND_BREATHE' },
    ],
};
/**
 * Fold one telemetry sample into a 0..1 arousal index.
 * High tempo, high error rate and low latency read as high arousal;
 * idleness and long latencies read as low arousal.
 */
function computeArousalIndex(s) {
    const clamp01 = (v) => Math.min(1, Math.max(0, v));
    // 40 actions/min is treated as flat-out for this task class.
    const tempo = clamp01(s.actionsPerMinute / 40);
    const errors = clamp01(s.errorRate / 0.5);
    // 3s+ to first input on a piece reads as fully sluggish.
    const alacrity = clamp01(1 - s.meanLatencyMs / 3000);
    const engagement = clamp01(1 - s.idleRatio / 0.6);
    const index = 0.4 * tempo + 0.25 * errors + 0.2 * alacrity + 0.15 * engagement;
    return clamp01(index);
}
class BehavioralMatrixEngine {
    constructor(config) {
        this.listeners = [];
        this.candidate = null;
        this.timeInState = { SLUGGISH: 0, BALANCED: 0, HYPER: 0 };
        this.lastSampleT = null;
        /** ms of continuous residence in the current state */
        this.stateEnteredAt = 0;
        this.config = config ?? DEFAULT_ENGINE_CONFIG;
        this.state = this.config.initial;
    }
    get currentState() {
        return this.state;
    }
    get stateResidencyMs() {
        return this.lastSampleT === null ? 0 : this.lastSampleT - this.stateEnteredAt;
    }
    get timeInStateMs() {
        return { ...this.timeInState };
    }
    onStateChange(listener) {
        this.listeners.push(listener);
    }
    /** The full rule table, exposed for the blueprint's audit checklist. */
    get transitionTable() {
        return JSON.parse(JSON.stringify(this.config));
    }
    /**
     * Ingest one telemetry sample. Returns the arousal reading so the HUD can
     * render it. Fires state-change listeners when a dwell-debounced rule trips.
     */
    ingest(sample) {
        const index = computeArousalIndex(sample);
        const reading = { index, sample };
        if (this.lastSampleT !== null) {
            this.timeInState[this.state] += Math.max(0, sample.t - this.lastSampleT);
        }
        else {
            this.stateEnteredAt = sample.t;
        }
        this.lastSampleT = sample.t;
        const target = this.matchRule(index);
        if (target === null || target.to === this.state) {
            this.candidate = null;
            return reading;
        }
        if (this.candidate === null || this.candidate.to !== target.to) {
            this.candidate = { to: target.to, since: sample.t };
        }
        if (sample.t - this.candidate.since >= target.dwellMs) {
            const from = this.state;
            this.state = target.to;
            this.stateEnteredAt = sample.t;
            this.candidate = null;
            const ev = { from, to: target.to, action: target.action, reading };
            for (const listener of this.listeners)
                listener(ev);
        }
        return reading;
    }
    /**
     * Find the rule whose band contains the index, widening the current
     * state's own band by the hysteresis margin so readings hovering at a
     * boundary don't thrash.
     */
    matchRule(index) {
        const h = this.config.hysteresis;
        for (const rule of this.config.rules) {
            if (rule.from !== '*' && rule.from !== this.state)
                continue;
            let lo = rule.min;
            let hi = rule.max;
            if (rule.to === this.state) {
                lo -= h;
                hi += h;
            }
            if (index >= lo && index < hi)
                return rule;
        }
        return null;
    }
}
/**
 * BreathingOverlay — full-screen 4s-inhale / 7s-hold / 8s-exhale guide.
 *
 * When the engine flags HYPER arousal the overlay seizes the UI: all
 * pointer, wheel and keyboard input is intercepted at the capture phase so
 * nothing reaches the app underneath, and the game surface is frozen. A
 * smoothly eased circle drives the pacing; soft synthesized cues mark each
 * phase change. The overlay releases only after a configurable number of
 * complete cycles (default 3 ≈ 57s of paced breathing).
 */
const BREATH_478 = [
    { name: 'Inhale', seconds: 4, cueHz: 392 },
    { name: 'Hold', seconds: 7, cueHz: 440 },
    { name: 'Exhale', seconds: 8, cueHz: 330 },
];
class BreathingOverlay {
    constructor(root, audio) {
        this.raf = 0;
        this.active = false;
        this.onComplete = null;
        this.root = root;
        this.audio = audio;
        this.circle = root.querySelector('.breath-circle');
        this.phaseLabel = root.querySelector('.breath-phase');
        this.countLabel = root.querySelector('.breath-count');
        this.cycleLabel = root.querySelector('.breath-cycle');
        this.trapHandler = (ev) => {
            if (!this.active)
                return;
            ev.preventDefault();
            ev.stopPropagation();
        };
    }
    get isActive() {
        return this.active;
    }
    /** Seize the UI and run `cycles` full 4-7-8 cycles, then call onComplete. */
    start(cycles, onComplete) {
        if (this.active)
            return;
        this.active = true;
        this.onComplete = onComplete;
        this.root.classList.add('visible');
        this.trapInput(true);
        const cycleMs = BREATH_478.reduce((acc, p) => acc + p.seconds, 0) * 1000;
        const totalMs = cycleMs * cycles;
        const startT = performance.now();
        let lastPhase = null;
        const frame = (now) => {
            const elapsed = now - startT;
            if (elapsed >= totalMs) {
                this.finish();
                return;
            }
            const inCycle = elapsed % cycleMs;
            const cycleIdx = Math.floor(elapsed / cycleMs);
            let acc = 0;
            for (const phase of BREATH_478) {
                const phaseMs = phase.seconds * 1000;
                if (inCycle < acc + phaseMs) {
                    const phaseProgress = (inCycle - acc) / phaseMs;
                    this.renderPhase(phase, phaseProgress, cycleIdx + 1, cycles);
                    if (phase !== lastPhase) {
                        this.audio.cue(phase.cueHz);
                        lastPhase = phase;
                    }
                    break;
                }
                acc += phaseMs;
            }
            this.raf = requestAnimationFrame(frame);
        };
        this.raf = requestAnimationFrame(frame);
    }
    renderPhase(phase, progress, cycle, cycles) {
        // Cosine easing gives the circle a fluid, non-mechanical swell.
        const eased = (1 - Math.cos(Math.PI * progress)) / 2;
        let scale;
        if (phase.name === 'Inhale')
            scale = 0.55 + 0.45 * eased;
        else if (phase.name === 'Hold')
            scale = 1;
        else
            scale = 1 - 0.45 * eased;
        this.circle.style.transform = `scale(${scale.toFixed(4)})`;
        this.phaseLabel.textContent = phase.name;
        const remaining = Math.ceil(phase.seconds * (1 - progress));
        this.countLabel.textContent = String(Math.max(1, remaining));
        this.cycleLabel.textContent = `Cycle ${cycle} of ${cycles} — let your heart rate settle`;
    }
    trapInput(on) {
        const events = ['pointerdown', 'pointerup', 'pointermove', 'wheel', 'keydown', 'keyup', 'touchstart', 'touchmove'];
        for (const name of events) {
            if (on)
                document.addEventListener(name, this.trapHandler, { capture: true, passive: false });
            else
                document.removeEventListener(name, this.trapHandler, { capture: true });
        }
    }
    finish() {
        cancelAnimationFrame(this.raf);
        this.trapInput(false);
        this.active = false;
        this.root.classList.remove('visible');
        const cb = this.onComplete;
        this.onComplete = null;
        if (cb !== null)
            cb();
    }
}
/**
 * VisuospatialCompanion — client-side 2D block-matching canvas game.
 *
 * A target matrix pattern is shown beside an 8×8 board. The player steers a
 * stream of polyomino pieces (keyboard, mouse or touch), rotating them with a
 * fluidly tweened animation, and stamps them onto the board so the filled
 * cells reproduce the target matrix. Placement, rotation and pattern-recall
 * demands are tuned to saturate visuospatial working memory: from level 3 the
 * target matrix fades after a short preview and must be reconstructed from
 * memory, which crowds out background verbal/ruminative processing.
 *
 * The module emits behavioral telemetry (tempo, error rate, first-input
 * latency, idleness) that the BehavioralMatrixEngine folds into its arousal
 * index, and it obeys GameDirectives pushed back down (2.5× tempo boost and
 * contrast scaling under SLUGGISH; hard input freeze under HYPER).
 */
const PIECE_LIBRARY = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[0, 1, 0], [1, 1, 1]], // T
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 1, 0], [0, 1, 1]], // Z
    [[1, 0], [1, 0], [1, 1]], // L
    [[0, 1], [0, 1], [1, 1]], // J
    [[1, 1, 1]], // tri
    [[1], [1]], // domino
];
const BOARD_SIZE = 8;
function rotateMatrix(m) {
    const rows = m.length;
    const cols = m[0].length;
    const out = [];
    for (let c = 0; c < cols; c++) {
        const row = [];
        for (let r = rows - 1; r >= 0; r--)
            row.push(m[r][c]);
        out.push(row);
    }
    return out;
}
function rotatedShape(shape, quarterTurns) {
    let out = shape;
    for (let i = 0; i < ((quarterTurns % 4) + 4) % 4; i++)
        out = rotateMatrix(out);
    return out;
}
class VisuospatialCompanion {
    constructor(canvas) {
        this.target = [];
        this.filled = [];
        this.piece = null;
        this.directives = { tempoMultiplier: 1, contrastBoost: 1, frozen: false };
        this.events = [];
        this.level = 1;
        this.streak = 0;
        this.placements = 0;
        this.correctPlacements = 0;
        this.patternDeadline = 0;
        this.previewUntil = 0;
        this.raf = 0;
        this.lastFrame = 0;
        this.running = false;
        this.flash = null;
        this.onPatternCleared = null;
        this.onHud = null;
        this.latencies = [];
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (ctx === null)
            throw new Error('SHIELD MAX requires a 2D canvas context');
        this.ctx = ctx;
        this.bindInput();
    }
    get currentLevel() {
        return this.level;
    }
    get currentStreak() {
        return this.streak;
    }
    get patternAccuracy() {
        return this.placements === 0 ? 1 : this.correctPlacements / this.placements;
    }
    applyDirectives(d) {
        this.directives = { ...d };
        const contrast = d.contrastBoost;
        this.canvas.style.filter =
            contrast > 1 ? `contrast(${contrast.toFixed(2)}) saturate(${(1 + (contrast - 1) * 0.8).toFixed(2)})` : '';
    }
    start() {
        if (this.running)
            return;
        this.running = true;
        this.newPattern();
        this.lastFrame = performance.now();
        const loop = (now) => {
            if (!this.running)
                return;
            const dt = Math.min(100, now - this.lastFrame);
            this.lastFrame = now;
            this.tick(now, dt);
            this.draw(now);
            this.raf = requestAnimationFrame(loop);
        };
        this.raf = requestAnimationFrame(loop);
    }
    stop() {
        this.running = false;
        cancelAnimationFrame(this.raf);
    }
    /**
     * Fold the trailing `windowMs` of input events into one telemetry sample
     * for the behavioral engine.
     */
    sampleTelemetry(now, windowMs) {
        const cutoff = now - windowMs;
        this.events = this.events.filter((e) => e.t >= cutoff);
        const actions = this.events.filter((e) => e.kind !== 'error');
        const errors = this.events.filter((e) => e.kind === 'error').length;
        const placements = this.events.filter((e) => e.kind === 'placement').length;
        const actionsPerMinute = (actions.length / windowMs) * 60000;
        const errorRate = placements + errors === 0 ? 0 : errors / (placements + errors);
        const latency = this.piece !== null && !this.piece.touched
            ? Math.min(3000, now - this.piece.spawnedAt)
            : this.meanRecentLatency();
        const idleRatio = this.computeIdleRatio(now, windowMs);
        return { t: now, actionsPerMinute, errorRate, meanLatencyMs: latency, idleRatio };
    }
    meanRecentLatency() {
        if (this.latencies.length === 0)
            return 800;
        const recent = this.latencies.slice(-8);
        return recent.reduce((a, b) => a + b, 0) / recent.length;
    }
    computeIdleRatio(now, windowMs) {
        if (this.events.length === 0)
            return 1;
        const ts = this.events.map((e) => e.t).sort((a, b) => a - b);
        let idle = Math.max(0, ts[0] - (now - windowMs));
        for (let i = 1; i < ts.length; i++)
            idle += Math.max(0, ts[i] - ts[i - 1] - 2000);
        idle += Math.max(0, now - ts[ts.length - 1] - 2000);
        return Math.min(1, idle / windowMs);
    }
    // ── Pattern lifecycle ────────────────────────────────────────────────
    newPattern() {
        this.target = VisuospatialCompanion.emptyGrid();
        this.filled = VisuospatialCompanion.emptyGrid();
        this.placements = 0;
        this.correctPlacements = 0;
        const pieceBudget = Math.min(6, 2 + this.level);
        let placed = 0;
        let guard = 0;
        while (placed < pieceBudget && guard < 200) {
            guard++;
            const shape = rotatedShape(PIECE_LIBRARY[Math.floor(Math.random() * PIECE_LIBRARY.length)], Math.floor(Math.random() * 4));
            const row = Math.floor(Math.random() * (BOARD_SIZE - shape.length + 1));
            const col = Math.floor(Math.random() * (BOARD_SIZE - shape[0].length + 1));
            if (this.canStamp(this.target, shape, row, col, false)) {
                this.stamp(this.target, shape, row, col);
                placed++;
            }
        }
        const now = performance.now();
        const baseSeconds = Math.max(35, 75 - this.level * 5);
        this.patternDeadline = now + baseSeconds * 1000;
        // Memory mode from level 3: the target matrix is only previewed.
        this.previewUntil = this.level >= 3 ? now + Math.max(2500, 6000 - this.level * 500) : Number.POSITIVE_INFINITY;
        this.spawnPiece(now);
    }
    spawnPiece(now) {
        const shape = PIECE_LIBRARY[Math.floor(Math.random() * PIECE_LIBRARY.length)];
        const colors = ['#5eead4', '#93c5fd', '#f0abfc', '#fcd34d', '#86efac'];
        this.piece = {
            shape,
            rotation: 0,
            displayAngle: 0,
            col: Math.floor(BOARD_SIZE / 2) - 1,
            row: Math.floor(BOARD_SIZE / 2) - 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            spawnedAt: now,
            touched: false,
        };
    }
    static emptyGrid() {
        return Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => false));
    }
    canStamp(grid, shape, row, col, ontoTarget) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] === 0)
                    continue;
                const rr = row + r;
                const cc = col + c;
                if (rr < 0 || cc < 0 || rr >= BOARD_SIZE || cc >= BOARD_SIZE)
                    return false;
                if (ontoTarget) {
                    // Placement is valid only onto still-unfilled target cells.
                    if (!this.target[rr][cc] || this.filled[rr][cc])
                        return false;
                }
                else if (grid[rr][cc]) {
                    return false;
                }
            }
        }
        return true;
    }
    stamp(grid, shape, row, col) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] === 1)
                    grid[row + r][col + c] = true;
            }
        }
    }
    patternComplete() {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (this.target[r][c] && !this.filled[r][c])
                    return false;
            }
        }
        return true;
    }
    // ── Input ────────────────────────────────────────────────────────────
    bindInput() {
        document.addEventListener('keydown', (ev) => {
            if (this.directives.frozen || !this.running || this.piece === null)
                return;
            const p = this.piece;
            let handled = true;
            switch (ev.key) {
                case 'ArrowLeft':
                case 'a':
                    p.col -= 1;
                    break;
                case 'ArrowRight':
                case 'd':
                    p.col += 1;
                    break;
                case 'ArrowUp':
                case 'w':
                    p.row -= 1;
                    break;
                case 'ArrowDown':
                case 's':
                    p.row += 1;
                    break;
                case 'q':
                    this.rotatePiece(-1);
                    break;
                case 'e':
                    this.rotatePiece(1);
                    break;
                case ' ':
                case 'Enter':
                    this.tryPlace();
                    break;
                case 'x':
                    this.discardPiece();
                    break;
                default:
                    handled = false;
            }
            if (handled) {
                ev.preventDefault();
                this.clampPiece();
                this.registerAction();
            }
        });
        this.canvas.addEventListener('pointermove', (ev) => {
            if (this.directives.frozen || !this.running || this.piece === null)
                return;
            const cell = this.cellFromPointer(ev);
            if (cell !== null && (cell.col !== this.piece.col || cell.row !== this.piece.row)) {
                this.piece.col = cell.col;
                this.piece.row = cell.row;
                this.clampPiece();
                this.registerAction();
            }
        });
        this.canvas.addEventListener('pointerdown', (ev) => {
            if (this.directives.frozen || !this.running)
                return;
            ev.preventDefault();
            if (ev.button === 2)
                this.rotatePiece(1);
            else
                this.tryPlace();
            this.registerAction();
        });
        this.canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
        this.canvas.addEventListener('wheel', (ev) => {
            if (this.directives.frozen || !this.running)
                return;
            ev.preventDefault();
            this.rotatePiece(ev.deltaY > 0 ? 1 : -1);
            this.registerAction();
        }, { passive: false });
    }
    /** Rotate via on-screen touch controls. */
    uiRotate() {
        if (this.directives.frozen || !this.running)
            return;
        this.rotatePiece(1);
        this.registerAction();
    }
    /** Place via on-screen touch controls. */
    uiPlace() {
        if (this.directives.frozen || !this.running)
            return;
        this.tryPlace();
        this.registerAction();
    }
    /** Swap the current piece via on-screen touch controls. */
    uiDiscard() {
        if (this.directives.frozen || !this.running)
            return;
        this.discardPiece();
        this.registerAction();
    }
    cellFromPointer(ev) {
        const rect = this.canvas.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height);
        const cell = size / BOARD_SIZE;
        const col = Math.floor((ev.clientX - rect.left) / cell);
        const row = Math.floor((ev.clientY - rect.top) / cell);
        if (row < 0 || col < 0 || row >= BOARD_SIZE || col >= BOARD_SIZE)
            return null;
        return { row, col };
    }
    registerAction() {
        const now = performance.now();
        if (this.piece !== null && !this.piece.touched) {
            this.piece.touched = true;
            this.latencies.push(now - this.piece.spawnedAt);
            if (this.latencies.length > 50)
                this.latencies = this.latencies.slice(-50);
        }
        this.events.push({ t: now, kind: 'action' });
    }
    rotatePiece(dir) {
        if (this.piece === null)
            return;
        this.piece.rotation = (((this.piece.rotation + dir) % 4) + 4) % 4;
        this.clampPiece();
    }
    clampPiece() {
        if (this.piece === null)
            return;
        const shape = rotatedShape(this.piece.shape, this.piece.rotation);
        this.piece.row = Math.max(0, Math.min(BOARD_SIZE - shape.length, this.piece.row));
        this.piece.col = Math.max(0, Math.min(BOARD_SIZE - shape[0].length, this.piece.col));
    }
    discardPiece() {
        // Swapping an unplaceable piece is allowed but reads as a minor error.
        this.events.push({ t: performance.now(), kind: 'error' });
        this.spawnPiece(performance.now());
    }
    tryPlace() {
        if (this.piece === null)
            return;
        const now = performance.now();
        const shape = rotatedShape(this.piece.shape, this.piece.rotation);
        this.placements++;
        if (this.canStamp(this.filled, shape, this.piece.row, this.piece.col, true)) {
            this.stamp(this.filled, shape, this.piece.row, this.piece.col);
            this.correctPlacements++;
            this.events.push({ t: now, kind: 'placement' });
            this.flash = { color: 'rgba(94,234,212,0.25)', until: now + 180 };
            if (this.patternComplete()) {
                this.streak++;
                const accuracy = this.patternAccuracy;
                this.level++;
                if (this.onPatternCleared !== null)
                    this.onPatternCleared(this.streak, accuracy);
                this.newPattern();
                return;
            }
            this.spawnPiece(now);
        }
        else {
            this.events.push({ t: now, kind: 'error' });
            this.flash = { color: 'rgba(248,113,113,0.3)', until: now + 220 };
        }
    }
    // ── Simulation & rendering ───────────────────────────────────────────
    tick(now, dt) {
        if (this.directives.frozen)
            return;
        // Tempo multiplier accelerates the countdown and all animation pacing.
        this.patternDeadline -= dt * (this.directives.tempoMultiplier - 1);
        if (now >= this.patternDeadline) {
            this.streak = 0;
            this.level = Math.max(1, this.level - 1);
            this.newPattern();
        }
        if (this.piece !== null) {
            // Tween displayed angle toward the logical rotation for fluid turns.
            const targetAngle = this.piece.rotation;
            let delta = targetAngle - this.piece.displayAngle;
            while (delta > 2)
                delta -= 4;
            while (delta < -2)
                delta += 4;
            const speed = 0.012 * this.directives.tempoMultiplier;
            const step = delta * Math.min(1, speed * dt);
            this.piece.displayAngle =
                Math.abs(delta) < 0.01 ? targetAngle : (((this.piece.displayAngle + step) % 4) + 4) % 4;
        }
        if (this.onHud !== null) {
            this.onHud({
                level: this.level,
                streak: this.streak,
                timeLeft: Math.max(0, (this.patternDeadline - now) / 1000),
                memoryMode: now > this.previewUntil,
            });
        }
    }
    draw(now) {
        const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1;
        const rect = this.canvas.getBoundingClientRect();
        const cssSize = Math.min(rect.width, rect.height);
        const pixelSize = Math.round(cssSize * dpr);
        if (this.canvas.width !== pixelSize || this.canvas.height !== pixelSize) {
            this.canvas.width = pixelSize;
            this.canvas.height = pixelSize;
        }
        const ctx = this.ctx;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssSize, cssSize);
        const cell = cssSize / BOARD_SIZE;
        const showTarget = now <= this.previewUntil;
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const x = c * cell;
                const y = r * cell;
                ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(148,163,184,0.06)' : 'rgba(148,163,184,0.1)';
                ctx.fillRect(x, y, cell, cell);
                if (this.filled[r][c]) {
                    ctx.fillStyle = '#38bdf8';
                    ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
                }
                else if (this.target[r][c] && showTarget) {
                    ctx.strokeStyle = 'rgba(94,234,212,0.55)';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x + 3, y + 3, cell - 6, cell - 6);
                }
            }
        }
        if (this.piece !== null && !this.directives.frozen) {
            this.drawPiece(ctx, this.piece, cell);
        }
        if (this.flash !== null) {
            if (now < this.flash.until) {
                ctx.fillStyle = this.flash.color;
                ctx.fillRect(0, 0, cssSize, cssSize);
            }
            else {
                this.flash = null;
            }
        }
    }
    drawPiece(ctx, p, cell) {
        const logicalShape = rotatedShape(p.shape, p.rotation);
        const cx = (p.col + logicalShape[0].length / 2) * cell;
        const cy = (p.row + logicalShape.length / 2) * cell;
        // Draw the base (unrotated) shape spun by the tweened display angle so
        // rotation reads as one continuous geometric motion.
        const residual = ((p.displayAngle - p.rotation) * Math.PI) / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(residual);
        ctx.translate(-logicalShape[0].length * cell * 0.5, -logicalShape.length * cell * 0.5);
        const valid = this.canStamp(this.filled, logicalShape, p.row, p.col, true);
        ctx.globalAlpha = 0.85;
        for (let r = 0; r < logicalShape.length; r++) {
            for (let c = 0; c < logicalShape[r].length; c++) {
                if (logicalShape[r][c] === 0)
                    continue;
                ctx.fillStyle = valid ? p.color : '#f87171';
                ctx.fillRect(c * cell + 2, r * cell + 2, cell - 4, cell - 4);
            }
        }
        ctx.restore();
        ctx.globalAlpha = 1;
    }
}
/**
 * CrucibleModule — exhaustion pre-mortem overlay.
 *
 * The user names a milestone they're chasing. The module deterministically
 * generates three structural failure scenarios drawn from real-world friction
 * classes (time scarcity, motivation decay, logistics, social friction,
 * resource limits, competing priorities), then charts the hedonic adaptation
 * model S(t) = B + (P − B)·e^(−λt) across 12 months so the user sees the
 * satisfaction decay curve *before* the anticipation loop closes. All
 * generation is local and seeded from the milestone text itself — the same
 * milestone always yields the same pre-mortem, which makes the module
 * testable and honest (it is a model, not an oracle).
 */
const FRICTION_LIBRARY = [
    {
        category: 'Time scarcity',
        title: 'The calendar collision',
        narrative: 'Three weeks in, the time you earmarked for "{m}" collides with obligations that were always going to resurface — work crunch, family logistics, sleep debt. The plan assumed your best weeks were your average weeks. Progress stalls not from lack of desire but because the schedule never had structural slack.',
        weight: 0.85,
    },
    {
        category: 'Motivation decay',
        title: 'The novelty cliff',
        narrative: 'The initial dopamine of committing to "{m}" fades on schedule, around day 10–14. What remains is the unglamorous middle: repetition without visible progress. If the habit is still riding on enthusiasm instead of a fixed trigger and a tiny minimum dose, this is where it quietly ends.',
        weight: 0.9,
    },
    {
        category: 'Logistical dependency',
        title: 'The single point of failure',
        narrative: '"{m}" secretly depends on one fragile link — a tool, a space, a person, an app, a commute window. When that link breaks for a week, the streak breaks with it, and restarting costs more activation energy than starting did.',
        weight: 0.7,
    },
    {
        category: 'Social friction',
        title: 'The unimpressed room',
        narrative: 'You expected the people around you to notice progress on "{m}". Mostly, they don\'t — or they gently mock the new routine. Without external applause, the effort has to be self-justifying. If your plan needed an audience, this is where it wobbles.',
        weight: 0.6,
    },
    {
        category: 'Resource constraint',
        title: 'The hidden invoice',
        narrative: 'The true cost of "{m}" — money, energy, attention — turns out to be 1.5–2× the estimate. Something else in your life pays that invoice. When the subsidizing area (rest, relationships, finances) runs dry, the milestone gets renegotiated downward.',
        weight: 0.65,
    },
    {
        category: 'Competing priorities',
        title: 'The urgent usurper',
        narrative: 'A legitimately urgent project arrives and borrows "just two weeks" from "{m}". Urgency is renewable; it will borrow again. Without a pre-committed floor — a minimum weekly dose that survives any emergency — important-but-not-urgent work loses every individual negotiation.',
        weight: 0.8,
    },
];
/** Deterministic 32-bit FNV-1a hash so scenarios are stable per milestone. */
function hashMilestone(text) {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}
function generateFailureScenarios(milestone) {
    const clean = milestone.trim();
    const seed = hashMilestone(clean.toLowerCase());
    const picked = [];
    const used = new Set();
    let cursor = seed;
    while (picked.length < 3) {
        cursor = (Math.imul(cursor, 1664525) + 1013904223) >>> 0;
        const idx = cursor % FRICTION_LIBRARY.length;
        if (used.has(idx))
            continue;
        used.add(idx);
        const t = FRICTION_LIBRARY[idx];
        picked.push({
            frictionCategory: t.category,
            title: t.title,
            narrative: t.narrative.split('{m}').join(clean),
            weight: t.weight,
        });
    }
    return picked;
}
/**
 * Hedonic adaptation model. Peak satisfaction at attainment decays
 * exponentially back toward baseline: S(t) = B + (P − B)·e^(−λt).
 * λ is derived from the milestone hash within an empirically plausible
 * band (half-life roughly 1.5–4 months for single-event boosts).
 */
function computeHedonicCurve(milestone) {
    const seed = hashMilestone(milestone.trim().toLowerCase());
    const baseline = 0.5;
    const peak = 0.92;
    // Map the seed onto λ ∈ [0.17, 0.46] per month.
    const lambda = 0.17 + (seed % 1000) / 1000 * 0.29;
    const points = [];
    for (let month = 0; month <= 12; month++) {
        points.push(baseline + (peak - baseline) * Math.exp(-lambda * month));
    }
    const halfLifeMonths = Math.LN2 / lambda;
    return { baseline, peak, lambda, points, halfLifeMonths };
}
class CrucibleModule {
    constructor(root, vault) {
        this.vault = vault;
        this.input = root.querySelector('.crucible-input');
        this.runButton = root.querySelector('.crucible-run');
        this.output = root.querySelector('.crucible-output');
        this.chartCanvas = root.querySelector('.crucible-chart');
        this.runButton.addEventListener('click', () => this.run());
    }
    run() {
        const milestone = this.input.value.trim();
        if (milestone.length < 3) {
            this.output.innerHTML = '<p class="crucible-hint">Name a real milestone first — a sentence is enough.</p>';
            return;
        }
        const scenarios = generateFailureScenarios(milestone);
        const curve = computeHedonicCurve(milestone);
        this.render(scenarios, curve);
        this.vault.recordCrucibleEntry({ createdAt: Date.now(), milestone, scenarios, curve });
    }
    render(scenarios, curve) {
        const frag = document.createDocumentFragment();
        for (const s of scenarios) {
            const card = document.createElement('article');
            card.className = 'crucible-card';
            const h = document.createElement('h4');
            h.textContent = `${s.frictionCategory} — ${s.title}`;
            const p = document.createElement('p');
            p.textContent = s.narrative;
            const meter = document.createElement('div');
            meter.className = 'crucible-meter';
            const fill = document.createElement('span');
            fill.style.width = `${Math.round(s.weight * 100)}%`;
            meter.appendChild(fill);
            const meterLabel = document.createElement('small');
            meterLabel.textContent = `Structural risk weight ${Math.round(s.weight * 100)}%`;
            card.append(h, p, meter, meterLabel);
            frag.appendChild(card);
        }
        const summary = document.createElement('p');
        summary.className = 'crucible-summary';
        summary.textContent =
            `Hedonic model: satisfaction peaks at ${Math.round(curve.peak * 100)}% on attainment and decays toward the ` +
                `${Math.round(curve.baseline * 100)}% baseline with a half-life of ${curve.halfLifeMonths.toFixed(1)} months. ` +
                'The feeling you are chasing is a spike, not a plateau — build the system, not the fantasy.';
        frag.appendChild(summary);
        this.output.replaceChildren(frag);
        this.drawCurve(curve);
    }
    drawCurve(curve) {
        const canvas = this.chartCanvas;
        const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, Math.round(rect.width * dpr));
        canvas.height = Math.max(1, Math.round(rect.height * dpr));
        const ctx = canvas.getContext('2d');
        if (ctx === null)
            return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const w = rect.width;
        const h = rect.height;
        const pad = { left: 34, right: 12, top: 14, bottom: 24 };
        ctx.clearRect(0, 0, w, h);
        const x = (month) => pad.left + (month / 12) * (w - pad.left - pad.right);
        const y = (v) => pad.top + (1 - v) * (h - pad.top - pad.bottom);
        // Baseline reference.
        ctx.strokeStyle = 'rgba(148,163,184,0.4)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x(0), y(curve.baseline));
        ctx.lineTo(x(12), y(curve.baseline));
        ctx.stroke();
        ctx.setLineDash([]);
        // Decay curve.
        ctx.strokeStyle = '#f0abfc';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        curve.points.forEach((v, month) => {
            if (month === 0)
                ctx.moveTo(x(month), y(v));
            else
                ctx.lineTo(x(month), y(v));
        });
        ctx.stroke();
        // Axes and labels.
        ctx.fillStyle = 'rgba(226,232,240,0.75)';
        ctx.font = '11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        for (const month of [0, 3, 6, 9, 12]) {
            ctx.fillText(`${month}mo`, x(month), h - 6);
        }
        ctx.textAlign = 'left';
        ctx.fillText('satisfaction', 4, pad.top + 2);
        ctx.fillText('baseline', 4, y(curve.baseline) - 4);
        // Half-life marker.
        const hl = Math.min(12, curve.halfLifeMonths);
        ctx.strokeStyle = 'rgba(94,234,212,0.7)';
        ctx.beginPath();
        ctx.moveTo(x(hl), y(1));
        ctx.lineTo(x(hl), y(0));
        ctx.stroke();
        ctx.fillStyle = 'rgba(94,234,212,0.9)';
        ctx.textAlign = hl > 9 ? 'right' : 'left';
        ctx.fillText(`half-life ${curve.halfLifeMonths.toFixed(1)}mo`, x(hl) + (hl > 9 ? -4 : 4), pad.top + 14);
    }
}
/**
 * RewardGate — identity-priming vault.
 *
 * Motivational text bundles and generated calming-audio scripts are strictly
 * gated behind verified block-clearing milestones: a bundle renders only when
 * the vault's persisted lifetime clear count meets its threshold. There is no
 * bypass path — the gate re-verifies against persisted state on every render,
 * so editing the DOM or replaying events cannot unlock content early.
 */
const REWARD_BUNDLES = [
    {
        id: 'b01-first-clear',
        requiredClears: 1,
        title: 'First Clear — Proof of Motion',
        lines: [
            'You just demonstrated the only skill that matters: starting.',
            'Identity note: you are someone who converts restlessness into structure.',
        ],
        audio: { baseHz: 110, beatHz: 4, seconds: 45 },
    },
    {
        id: 'b02-persistence',
        requiredClears: 5,
        title: 'Five Clears — The Persistence Layer',
        lines: [
            'Five patterns held in working memory and executed. That is trainable capacity, and you are training it.',
            'Identity note: you finish small things on purpose, which is how large things get finished by accident.',
        ],
        audio: { baseHz: 96, beatHz: 3, seconds: 60 },
    },
    {
        id: 'b03-deep-worker',
        requiredClears: 15,
        title: 'Fifteen Clears — Deep-Work Credentials',
        lines: [
            'Your arousal curve is spending real time in the balanced band. That state transfers to everything you touch.',
            'Identity note: you regulate first, then act. Calm is your operating posture, not your reward.',
        ],
        audio: { baseHz: 82, beatHz: 2.5, seconds: 75 },
    },
    {
        id: 'b04-practitioner',
        requiredClears: 40,
        title: 'Forty Clears — The Practitioner',
        lines: [
            'At this volume the game is no longer the point. You have built a reliable off-ramp from rumination into action.',
            'Identity note: the device is a tool you put down. The real work happens after you lock the screen.',
        ],
        audio: { baseHz: 72, beatHz: 2, seconds: 90 },
    },
];
class RewardGate {
    constructor(root, vault, audio) {
        this.onUnlock = null;
        this.vault = vault;
        this.audio = audio;
        this.listEl = root.querySelector('.reward-list');
    }
    /** Pure gate check, used by both the UI and the test harness. */
    static isUnlocked(bundle, verifiedClears) {
        return verifiedClears >= bundle.requiredClears;
    }
    /** Re-verify every bundle against persisted milestones and render. */
    refresh() {
        const clears = this.vault.totalPatternsCleared;
        const frag = document.createDocumentFragment();
        for (const bundle of REWARD_BUNDLES) {
            const unlocked = RewardGate.isUnlocked(bundle, clears);
            if (unlocked && !this.vault.unlockedBundleIds.includes(bundle.id)) {
                this.vault.markBundleUnlocked(bundle.id);
                if (this.onUnlock !== null)
                    this.onUnlock(bundle);
            }
            frag.appendChild(this.renderBundle(bundle, unlocked, clears));
        }
        this.listEl.replaceChildren(frag);
    }
    renderBundle(bundle, unlocked, clears) {
        const card = document.createElement('article');
        card.className = `reward-card ${unlocked ? 'unlocked' : 'locked'}`;
        const h = document.createElement('h4');
        h.textContent = unlocked ? bundle.title : 'Locked bundle';
        card.appendChild(h);
        if (unlocked) {
            for (const line of bundle.lines) {
                const p = document.createElement('p');
                p.textContent = line;
                card.appendChild(p);
            }
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-secondary';
            btn.textContent = `Play calming audio (${bundle.audio.seconds}s)`;
            btn.addEventListener('click', () => {
                // Gate is re-verified at play time against persisted state.
                if (RewardGate.isUnlocked(bundle, this.vault.totalPatternsCleared)) {
                    this.audio.playScript(bundle.audio);
                }
            });
            card.appendChild(btn);
        }
        else {
            const p = document.createElement('p');
            p.className = 'reward-locked-note';
            p.textContent = `Clear ${bundle.requiredClears - clears} more pattern${bundle.requiredClears - clears === 1 ? '' : 's'} to unlock.`;
            card.appendChild(p);
        }
        return card;
    }
}
/**
 * ExitDirector — exit-driven UX.
 *
 * The application's terminal success state is the user *leaving it*. When the
 * behavioral engine reports a sustained BALANCED state with at least one
 * verified pattern clear this session, the director takes the foreground and
 * explicitly commands the transition: lock the device, move the regained
 * focus onto a real-world task. Dismissing the prompt is possible but the
 * prompt re-arms after a cooldown — the app never converts balance into more
 * screen time by default.
 */
class ExitDirector {
    constructor(root) {
        this.cooldownUntil = 0;
        this.onExitConfirmed = null;
        this.root = root;
        this.statsEl = root.querySelector('.exit-stats');
        root.querySelector('.exit-confirm').addEventListener('click', () => {
            this.hide();
            if (this.onExitConfirmed !== null)
                this.onExitConfirmed();
        });
        root.querySelector('.exit-dismiss').addEventListener('click', () => {
            this.cooldownUntil = performance.now() + ExitDirector.COOLDOWN_MS;
            this.hide();
        });
    }
    get isVisible() {
        return this.root.classList.contains('visible');
    }
    /** Pure eligibility check, shared with the test harness. */
    static shouldPrompt(state, residencyMs, patternsClearedThisSession, now, cooldownUntil) {
        return (state === 'BALANCED' &&
            residencyMs >= ExitDirector.SUSTAIN_MS &&
            patternsClearedThisSession >= 1 &&
            now >= cooldownUntil);
    }
    maybePrompt(state, residencyMs, patternsCleared, sessionMinutes) {
        if (this.isVisible)
            return;
        if (!ExitDirector.shouldPrompt(state, residencyMs, patternsCleared, performance.now(), this.cooldownUntil)) {
            return;
        }
        this.statsEl.textContent =
            `${patternsCleared} pattern${patternsCleared === 1 ? '' : 's'} cleared · ` +
                `${Math.max(1, Math.round(sessionMinutes))} min session · balanced state held for ` +
                `${Math.round(residencyMs / 1000)}s`;
        this.root.classList.add('visible');
    }
    hide() {
        this.root.classList.remove('visible');
    }
}
/** ms of sustained BALANCED residency required before prompting */
ExitDirector.SUSTAIN_MS = 45000;
/** ms before a dismissed prompt is allowed to re-arm */
ExitDirector.COOLDOWN_MS = 120000;
/**
 * SHIELD MAX bootstrap — wires the four modules together.
 *
 *   game telemetry ──▶ BehavioralMatrixEngine ──▶ directives ──▶ game
 *                                   │
 *                 HYPER ▶ BreathingOverlay (input freeze, 4-7-8)
 *              SLUGGISH ▶ 2.5× tempo + contrast scaling
 *              BALANCED ▶ ExitDirector (lock the device, leave)
 *
 * Pure logic classes are exported on `globalThis.SHIELD` so the Node test
 * harness can exercise them without a browser.
 */
const SHIELD_TEMPO_BOOST = 2.5;
const SHIELD_CONTRAST_BOOST = 1.35;
const TELEMETRY_WINDOW_MS = 20000;
const TELEMETRY_INTERVAL_MS = 1000;
const SHIELD = {
    BehavioralMatrixEngine,
    computeArousalIndex,
    DEFAULT_ENGINE_CONFIG,
    FocusVault,
    MemoryBackend,
    generateFailureScenarios,
    computeHedonicCurve,
    hashMilestone,
    RewardGate,
    REWARD_BUNDLES,
    ExitDirector,
    rotatedShape,
    BREATH_478,
};
globalThis.SHIELD = SHIELD;
function shieldBoot() {
    const $ = (sel) => {
        const el = document.querySelector(sel);
        if (el === null)
            throw new Error(`SHIELD MAX: missing required element ${sel}`);
        return el;
    };
    const vault = new FocusVault();
    const audio = new CalmAudio();
    const engine = new BehavioralMatrixEngine();
    const game = new VisuospatialCompanion($('#game-canvas'));
    const breathing = new BreathingOverlay($('#breathing-overlay'), audio);
    const crucible = new CrucibleModule($('#crucible-panel'), vault);
    void crucible; // constructed for its event wiring; owns its own lifecycle
    const rewards = new RewardGate($('#rewards-panel'), vault, audio);
    const exitDirector = new ExitDirector($('#exit-overlay'));
    const stateBadge = $('#state-badge');
    const arousalFill = $('#arousal-fill');
    const hudLevel = $('#hud-level');
    const hudStreak = $('#hud-streak');
    const hudTimer = $('#hud-timer');
    const hudMemory = $('#hud-memory');
    const hudClears = $('#hud-clears');
    const toast = $('#toast');
    const sessionStart = Date.now();
    let patternsThisSession = 0;
    let bestAccuracy = 0;
    let toastTimer = 0;
    const showToast = (text) => {
        toast.textContent = text;
        toast.classList.add('visible');
        clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 4000);
    };
    const directives = { tempoMultiplier: 1, contrastBoost: 1, frozen: false };
    const pushDirectives = () => game.applyDirectives(directives);
    const stateLabels = {
        SLUGGISH: 'Sluggish / Low-Tempo',
        BALANCED: 'Balanced / Deep-Work',
        HYPER: 'Hyper-Arousal / Restless',
    };
    const renderState = (state) => {
        stateBadge.textContent = stateLabels[state];
        stateBadge.dataset.state = state;
    };
    renderState(engine.currentState);
    engine.onStateChange((ev) => {
        renderState(ev.to);
        switch (ev.action) {
            case 'FREEZE_AND_BREATHE': {
                // Immediate takeover: freeze standard input, run 3 full 4-7-8 cycles.
                directives.frozen = true;
                directives.tempoMultiplier = 1;
                directives.contrastBoost = 1;
                pushDirectives();
                breathing.start(3, () => {
                    directives.frozen = false;
                    pushDirectives();
                    showToast('Heart rate down-shifted. Re-entering at a calmer tempo.');
                });
                break;
            }
            case 'TEMPO_BOOST': {
                directives.tempoMultiplier = SHIELD_TEMPO_BOOST;
                directives.contrastBoost = SHIELD_CONTRAST_BOOST;
                directives.frozen = false;
                pushDirectives();
                showToast('Low tempo detected — contrast and pace raised 2.5× to re-alert.');
                break;
            }
            case 'EXIT_PROMPT': {
                directives.tempoMultiplier = 1;
                directives.contrastBoost = 1;
                directives.frozen = false;
                pushDirectives();
                break;
            }
            case 'NONE':
                break;
        }
    });
    game.onPatternCleared = (streak, accuracy) => {
        patternsThisSession++;
        if (accuracy > bestAccuracy)
            bestAccuracy = accuracy;
        vault.recordPatternCleared(streak);
        hudClears.textContent = String(vault.totalPatternsCleared);
        rewards.refresh();
        showToast(`Pattern cleared — streak ${streak}, accuracy ${Math.round(accuracy * 100)}%.`);
    };
    rewards.onUnlock = (bundle) => showToast(`Vault unlocked: ${bundle.title}`);
    game.onHud = (hud) => {
        hudLevel.textContent = String(hud.level);
        hudStreak.textContent = String(hud.streak);
        hudTimer.textContent = `${hud.timeLeft.toFixed(0)}s`;
        hudMemory.textContent = hud.memoryMode ? 'RECALL' : 'VISIBLE';
        hudMemory.dataset.mode = hud.memoryMode ? 'recall' : 'visible';
    };
    exitDirector.onExitConfirmed = () => {
        game.stop();
        vault.recordSession({
            startedAt: sessionStart,
            endedAt: Date.now(),
            patternsCleared: patternsThisSession,
            bestAccuracy,
            timeInStateMs: engine.timeInStateMs,
            exitedIntentionally: true,
        });
        document.body.classList.add('session-ended');
        $('#ended-summary').textContent =
            `Session banked: ${patternsThisSession} patterns, best accuracy ${Math.round(bestAccuracy * 100)}%. ` +
                'The screen is done with you. Go.';
    };
    // Telemetry pump: game → engine → HUD/directives, once per second.
    window.setInterval(() => {
        if (breathing.isActive || document.body.classList.contains('session-ended'))
            return;
        const sample = game.sampleTelemetry(performance.now(), TELEMETRY_WINDOW_MS);
        const reading = engine.ingest(sample);
        arousalFill.style.width = `${Math.round(reading.index * 100)}%`;
        arousalFill.dataset.band = reading.index < 0.33 ? 'low' : reading.index < 0.7 ? 'mid' : 'high';
        exitDirector.maybePrompt(engine.currentState, engine.stateResidencyMs, patternsThisSession, (Date.now() - sessionStart) / 60000);
    }, TELEMETRY_INTERVAL_MS);
    // Tab switching for the right-hand panels.
    const tabs = Array.from(document.querySelectorAll('.tab-btn'));
    for (const btn of tabs) {
        btn.addEventListener('click', () => {
            for (const other of tabs)
                other.classList.toggle('active', other === btn);
            for (const panel of Array.from(document.querySelectorAll('.tab-panel'))) {
                panel.classList.toggle('active', panel.id === btn.dataset.panel);
            }
        });
    }
    $('#touch-rotate').addEventListener('click', () => game.uiRotate());
    $('#touch-place').addEventListener('click', () => game.uiPlace());
    $('#touch-swap').addEventListener('click', () => game.uiDiscard());
    hudClears.textContent = String(vault.totalPatternsCleared);
    rewards.refresh();
    game.start();
}
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', shieldBoot);
    }
    else {
        shieldBoot();
    }
}
