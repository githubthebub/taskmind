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

type PieceMatrix = number[][];

interface ActivePiece {
  shape: PieceMatrix;
  /** logical rotation, 0..3 quarter turns */
  rotation: number;
  /** displayed angle in quarter-turns, tweened toward `rotation` */
  displayAngle: number;
  col: number;
  row: number;
  color: string;
  spawnedAt: number;
  touched: boolean;
}

interface InputEventRecord {
  t: number;
  kind: 'action' | 'error' | 'placement';
}

const PIECE_LIBRARY: PieceMatrix[] = [
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

function rotateMatrix(m: PieceMatrix): PieceMatrix {
  const rows = m.length;
  const cols = m[0].length;
  const out: PieceMatrix = [];
  for (let c = 0; c < cols; c++) {
    const row: number[] = [];
    for (let r = rows - 1; r >= 0; r--) row.push(m[r][c]);
    out.push(row);
  }
  return out;
}

function rotatedShape(shape: PieceMatrix, quarterTurns: number): PieceMatrix {
  let out = shape;
  for (let i = 0; i < ((quarterTurns % 4) + 4) % 4; i++) out = rotateMatrix(out);
  return out;
}

class VisuospatialCompanion {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private target: boolean[][] = [];
  private filled: boolean[][] = [];
  private piece: ActivePiece | null = null;
  private directives: GameDirectives = { tempoMultiplier: 1, contrastBoost: 1, frozen: false };
  private events: InputEventRecord[] = [];
  private level = 1;
  private streak = 0;
  private placements = 0;
  private correctPlacements = 0;
  private patternDeadline = 0;
  private previewUntil = 0;
  private raf = 0;
  private lastFrame = 0;
  private running = false;
  private flash: { color: string; until: number } | null = null;

  onPatternCleared: ((streak: number, accuracy: number) => void) | null = null;
  onHud: ((hud: { level: number; streak: number; timeLeft: number; memoryMode: boolean }) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (ctx === null) throw new Error('SHIELD MAX requires a 2D canvas context');
    this.ctx = ctx;
    this.bindInput();
  }

  get currentLevel(): number {
    return this.level;
  }

  get currentStreak(): number {
    return this.streak;
  }

  get patternAccuracy(): number {
    return this.placements === 0 ? 1 : this.correctPlacements / this.placements;
  }

  applyDirectives(d: GameDirectives): void {
    this.directives = { ...d };
    const contrast = d.contrastBoost;
    this.canvas.style.filter =
      contrast > 1 ? `contrast(${contrast.toFixed(2)}) saturate(${(1 + (contrast - 1) * 0.8).toFixed(2)})` : '';
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.newPattern();
    this.lastFrame = performance.now();
    const loop = (now: number): void => {
      if (!this.running) return;
      const dt = Math.min(100, now - this.lastFrame);
      this.lastFrame = now;
      this.tick(now, dt);
      this.draw(now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /**
   * Fold the trailing `windowMs` of input events into one telemetry sample
   * for the behavioral engine.
   */
  sampleTelemetry(now: number, windowMs: number): MetricsSample {
    const cutoff = now - windowMs;
    this.events = this.events.filter((e) => e.t >= cutoff);
    const actions = this.events.filter((e) => e.kind !== 'error');
    const errors = this.events.filter((e) => e.kind === 'error').length;
    const placements = this.events.filter((e) => e.kind === 'placement').length;
    const actionsPerMinute = (actions.length / windowMs) * 60000;
    const errorRate = placements + errors === 0 ? 0 : errors / (placements + errors);
    const latency =
      this.piece !== null && !this.piece.touched
        ? Math.min(3000, now - this.piece.spawnedAt)
        : this.meanRecentLatency();
    const idleRatio = this.computeIdleRatio(now, windowMs);
    return { t: now, actionsPerMinute, errorRate, meanLatencyMs: latency, idleRatio };
  }

  private latencies: number[] = [];

  private meanRecentLatency(): number {
    if (this.latencies.length === 0) return 800;
    const recent = this.latencies.slice(-8);
    return recent.reduce((a, b) => a + b, 0) / recent.length;
  }

  private computeIdleRatio(now: number, windowMs: number): number {
    if (this.events.length === 0) return 1;
    const ts = this.events.map((e) => e.t).sort((a, b) => a - b);
    let idle = Math.max(0, ts[0] - (now - windowMs));
    for (let i = 1; i < ts.length; i++) idle += Math.max(0, ts[i] - ts[i - 1] - 2000);
    idle += Math.max(0, now - ts[ts.length - 1] - 2000);
    return Math.min(1, idle / windowMs);
  }

  // ── Pattern lifecycle ────────────────────────────────────────────────

  private newPattern(): void {
    this.target = VisuospatialCompanion.emptyGrid();
    this.filled = VisuospatialCompanion.emptyGrid();
    this.placements = 0;
    this.correctPlacements = 0;
    const pieceBudget = Math.min(6, 2 + this.level);
    let placed = 0;
    let guard = 0;
    while (placed < pieceBudget && guard < 200) {
      guard++;
      const shape = rotatedShape(
        PIECE_LIBRARY[Math.floor(Math.random() * PIECE_LIBRARY.length)],
        Math.floor(Math.random() * 4),
      );
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

  private spawnPiece(now: number): void {
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

  private static emptyGrid(): boolean[][] {
    return Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => false));
  }

  private canStamp(grid: boolean[][], shape: PieceMatrix, row: number, col: number, ontoTarget: boolean): boolean {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 0) continue;
        const rr = row + r;
        const cc = col + c;
        if (rr < 0 || cc < 0 || rr >= BOARD_SIZE || cc >= BOARD_SIZE) return false;
        if (ontoTarget) {
          // Placement is valid only onto still-unfilled target cells.
          if (!this.target[rr][cc] || this.filled[rr][cc]) return false;
        } else if (grid[rr][cc]) {
          return false;
        }
      }
    }
    return true;
  }

  private stamp(grid: boolean[][], shape: PieceMatrix, row: number, col: number): void {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 1) grid[row + r][col + c] = true;
      }
    }
  }

  private patternComplete(): boolean {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (this.target[r][c] && !this.filled[r][c]) return false;
      }
    }
    return true;
  }

  // ── Input ────────────────────────────────────────────────────────────

  private bindInput(): void {
    document.addEventListener('keydown', (ev) => {
      if (this.directives.frozen || !this.running || this.piece === null) return;
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
      if (this.directives.frozen || !this.running || this.piece === null) return;
      const cell = this.cellFromPointer(ev);
      if (cell !== null && (cell.col !== this.piece.col || cell.row !== this.piece.row)) {
        this.piece.col = cell.col;
        this.piece.row = cell.row;
        this.clampPiece();
        this.registerAction();
      }
    });
    this.canvas.addEventListener('pointerdown', (ev) => {
      if (this.directives.frozen || !this.running) return;
      ev.preventDefault();
      if (ev.button === 2) this.rotatePiece(1);
      else this.tryPlace();
      this.registerAction();
    });
    this.canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
    this.canvas.addEventListener(
      'wheel',
      (ev) => {
        if (this.directives.frozen || !this.running) return;
        ev.preventDefault();
        this.rotatePiece(ev.deltaY > 0 ? 1 : -1);
        this.registerAction();
      },
      { passive: false },
    );
  }

  /** Rotate via on-screen touch controls. */
  uiRotate(): void {
    if (this.directives.frozen || !this.running) return;
    this.rotatePiece(1);
    this.registerAction();
  }

  /** Place via on-screen touch controls. */
  uiPlace(): void {
    if (this.directives.frozen || !this.running) return;
    this.tryPlace();
    this.registerAction();
  }

  /** Swap the current piece via on-screen touch controls. */
  uiDiscard(): void {
    if (this.directives.frozen || !this.running) return;
    this.discardPiece();
    this.registerAction();
  }

  private cellFromPointer(ev: PointerEvent): { row: number; col: number } | null {
    const rect = this.canvas.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    const cell = size / BOARD_SIZE;
    const col = Math.floor((ev.clientX - rect.left) / cell);
    const row = Math.floor((ev.clientY - rect.top) / cell);
    if (row < 0 || col < 0 || row >= BOARD_SIZE || col >= BOARD_SIZE) return null;
    return { row, col };
  }

  private registerAction(): void {
    const now = performance.now();
    if (this.piece !== null && !this.piece.touched) {
      this.piece.touched = true;
      this.latencies.push(now - this.piece.spawnedAt);
      if (this.latencies.length > 50) this.latencies = this.latencies.slice(-50);
    }
    this.events.push({ t: now, kind: 'action' });
  }

  private rotatePiece(dir: 1 | -1): void {
    if (this.piece === null) return;
    this.piece.rotation = (((this.piece.rotation + dir) % 4) + 4) % 4;
    this.clampPiece();
  }

  private clampPiece(): void {
    if (this.piece === null) return;
    const shape = rotatedShape(this.piece.shape, this.piece.rotation);
    this.piece.row = Math.max(0, Math.min(BOARD_SIZE - shape.length, this.piece.row));
    this.piece.col = Math.max(0, Math.min(BOARD_SIZE - shape[0].length, this.piece.col));
  }

  private discardPiece(): void {
    // Swapping an unplaceable piece is allowed but reads as a minor error.
    this.events.push({ t: performance.now(), kind: 'error' });
    this.spawnPiece(performance.now());
  }

  private tryPlace(): void {
    if (this.piece === null) return;
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
        if (this.onPatternCleared !== null) this.onPatternCleared(this.streak, accuracy);
        this.newPattern();
        return;
      }
      this.spawnPiece(now);
    } else {
      this.events.push({ t: now, kind: 'error' });
      this.flash = { color: 'rgba(248,113,113,0.3)', until: now + 220 };
    }
  }

  // ── Simulation & rendering ───────────────────────────────────────────

  private tick(now: number, dt: number): void {
    if (this.directives.frozen) return;
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
      while (delta > 2) delta -= 4;
      while (delta < -2) delta += 4;
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

  private draw(now: number): void {
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
        } else if (this.target[r][c] && showTarget) {
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
      } else {
        this.flash = null;
      }
    }
  }

  private drawPiece(ctx: CanvasRenderingContext2D, p: ActivePiece, cell: number): void {
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
        if (logicalShape[r][c] === 0) continue;
        ctx.fillStyle = valid ? p.color : '#f87171';
        ctx.fillRect(c * cell + 2, r * cell + 2, cell - 4, cell - 4);
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
