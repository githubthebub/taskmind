/**
 * Attention Puzzle Engine — falling-block pattern-matching game on Canvas 2D.
 *
 * Offline-first: zero network calls, zero external assets, DOM-only.
 * Implements the IPuzzleEngine contract from ../types.ts.
 */

import type {
  BlockPiece,
  IPuzzleEngine,
  PuzzleCallbacks,
  PuzzleConfig,
  PuzzleStats,
} from '../types.js';

/* ------------------------------------------------------------------ */
/* Internal types & constants                                          */
/* ------------------------------------------------------------------ */

/** A settled board cell: null = empty, number = colorIndex of the block. */
type Cell = number | null;

interface Palette {
  boardBackground: string;
  panelBackground: string;
  gridLine: string;
  gridLineWidth: number;
  cellBorder: string;
  text: string;
  textDim: string;
  blocks: string[];
  ghostAlpha: number;
  patternFill: string;
  pulseColor: string;
}

const NORMAL_PALETTE: Palette = {
  boardBackground: '#1c2230',
  panelBackground: '#232b3d',
  gridLine: '#2a3348',
  gridLineWidth: 1,
  cellBorder: '#141a26',
  text: '#dde4f0',
  textDim: '#8b95ab',
  blocks: ['#5b8dd9', '#d9a05b', '#6fbf8f', '#c76f8a', '#9a7fd1', '#5bbfc7', '#c7b35b'],
  ghostAlpha: 0.22,
  patternFill: '#aab6cc',
  pulseColor: 'rgba(255, 255, 255, 0.05)',
};

const MAX_CONTRAST_PALETTE: Palette = {
  boardBackground: '#000000',
  panelBackground: '#0a0a0a',
  gridLine: '#ffffff',
  gridLineWidth: 2,
  cellBorder: '#ffffff',
  text: '#ffffff',
  textDim: '#cccccc',
  blocks: ['#00e5ff', '#ffea00', '#00ff6a', '#ff2ec4', '#b26bff', '#ff8a00', '#ff3b3b'],
  ghostAlpha: 0.35,
  patternFill: '#ffffff',
  pulseColor: 'rgba(255, 255, 255, 0.12)',
};

/** Seven distinct geometric piece shapes (I, O, T, L, J, S, Z). */
const PIECE_SHAPES: ReadonlyArray<ReadonlyArray<ReadonlyArray<number>>> = [
  [[1, 1, 1, 1]], // I
  [
    [1, 1],
    [1, 1],
  ], // O
  [
    [1, 1, 1],
    [0, 1, 0],
  ], // T
  [
    [1, 0],
    [1, 0],
    [1, 1],
  ], // L
  [
    [0, 1],
    [0, 1],
    [1, 1],
  ], // J
  [
    [0, 1, 1],
    [1, 1, 0],
  ], // S
  [
    [1, 1, 0],
    [0, 1, 1],
  ], // Z
];

/** Wall-kick offsets tried in order when a rotation collides. */
const WALL_KICK_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [-2, 0],
  [2, 0],
  [0, -1],
  [-1, -1],
  [1, -1],
];

const SIDE_PANEL_CELLS = 6;
const STATS_EMIT_INTERVAL_MS = 500;
const GAME_OVER_RESET_DELAY_MS = 1500;
const MATCH_WINDOW_MS = 60_000;
const MAX_FRAME_DELTA_MS = 250;

export const DEFAULT_PUZZLE_CONFIG: PuzzleConfig = {
  cols: 10,
  rows: 18,
  cellPx: 28,
  baseTickMs: 700,
  tempoMultiplier: 1,
  contrastMode: 'normal',
  puzzleMode: 'standard',
  patternTargets: [
    // Three-in-a-row segment of one color.
    [[1, 1, 1]],
    // 2x2 uniform square.
    [
      [1, 1],
      [1, 1],
    ],
    // U-shaped cup of one color.
    [
      [1, 0, 1],
      [1, 1, 1],
    ],
  ],
};

function rotateClockwise(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated: number[][] = [];
  for (let c = 0; c < cols; c++) {
    const newRow: number[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      const sourceRow = shape[r];
      newRow.push(c < sourceRow.length ? sourceRow[c] : 0);
    }
    rotated.push(newRow);
  }
  return rotated;
}

function cloneShape(shape: ReadonlyArray<ReadonlyArray<number>>): number[][] {
  return shape.map((row) => [...row]);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/* ------------------------------------------------------------------ */
/* Engine                                                              */
/* ------------------------------------------------------------------ */

export class PuzzleEngine implements IPuzzleEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly callbacks: PuzzleCallbacks;
  private readonly config: PuzzleConfig;

  private board: Cell[][];
  private piece: BlockPiece | null = null;
  private nextPieceId = 1;

  private started = false;
  private paused = false;
  private destroyed = false;
  private inputLocked = false;

  private rafId: number | null = null;
  private prevFrameTs: number | null = null;

  /** Active (unpaused) gameplay clock in ms; drives focus time and rolling windows. */
  private clockMs = 0;
  private dropAccumulatorMs = 0;
  private gameOverElapsedMs: number | null = null;
  private pulseIntensity = 0;

  private blocksCleared = 0;
  private linesClearedTotal = 0;
  private patternsMatchedTotal = 0;
  private rotationsPerformed = 0;
  private piecesPlaced = 0;
  private holePenalty = 0;
  private matchEventClockTimes: number[] = [];
  private currentTargetIndex = 0;

  private statsDirty = false;
  private lastStatsEmitClockMs = -Infinity;
  private lastWholeFocusSecond = 0;

  private readonly keydownHandler: (event: KeyboardEvent) => void;

  constructor(canvas: HTMLCanvasElement, config: PuzzleConfig, callbacks: PuzzleCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.config = {
      ...config,
      patternTargets: config.patternTargets.map((p) => p.map((row) => [...row])),
    };

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('PuzzleEngine: unable to acquire 2D rendering context');
    }
    this.ctx = ctx;

    this.board = this.createEmptyBoard();
    this.syncCanvasSize();

    this.keydownHandler = (event: KeyboardEvent): void => {
      this.handleKeyDown(event);
    };
    window.addEventListener('keydown', this.keydownHandler);

    // Render loop starts immediately so the board is visible pre-start;
    // game logic only advances once start() is called.
    this.rafId = requestAnimationFrame(this.frame);
  }

  /* ------------------------------ public API ----------------------- */

  get stats(): PuzzleStats {
    return this.buildStats();
  }

  start(): void {
    if (this.destroyed || this.started) {
      return;
    }
    this.started = true;
    this.paused = false;
    this.prevFrameTs = null;
    if (this.piece === null && this.gameOverElapsedMs === null) {
      this.spawnPiece();
    }
    this.emitStats(true);
  }

  pause(): void {
    if (this.destroyed || this.paused) {
      return;
    }
    this.paused = true;
    this.emitStats(true);
  }

  resume(): void {
    if (this.destroyed || !this.paused) {
      return;
    }
    this.paused = false;
    this.prevFrameTs = null;
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    window.removeEventListener('keydown', this.keydownHandler);
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  applyConfig(patch: Partial<PuzzleConfig>): void {
    if (this.destroyed) {
      return;
    }
    const dimensionsBefore = `${this.config.cols}x${this.config.rows}x${this.config.cellPx}`;

    if (patch.cols !== undefined) {
      this.config.cols = Math.max(4, Math.floor(patch.cols));
    }
    if (patch.rows !== undefined) {
      this.config.rows = Math.max(6, Math.floor(patch.rows));
    }
    if (patch.cellPx !== undefined) {
      this.config.cellPx = Math.max(8, Math.floor(patch.cellPx));
    }
    if (patch.baseTickMs !== undefined) {
      this.config.baseTickMs = Math.max(30, patch.baseTickMs);
    }
    if (patch.tempoMultiplier !== undefined) {
      this.config.tempoMultiplier = Math.max(0.05, patch.tempoMultiplier);
    }
    if (patch.contrastMode !== undefined) {
      this.config.contrastMode = patch.contrastMode;
    }
    if (patch.puzzleMode !== undefined) {
      this.config.puzzleMode = patch.puzzleMode;
    }
    if (patch.patternTargets !== undefined && patch.patternTargets.length > 0) {
      this.config.patternTargets = patch.patternTargets.map((p) => p.map((row) => [...row]));
    }
    this.currentTargetIndex = this.currentTargetIndex % Math.max(1, this.config.patternTargets.length);

    const dimensionsAfter = `${this.config.cols}x${this.config.rows}x${this.config.cellPx}`;
    if (dimensionsBefore !== dimensionsAfter) {
      this.syncCanvasSize();
      this.board = this.createEmptyBoard();
      this.piece = null;
      this.dropAccumulatorMs = 0;
      if (this.started && this.gameOverElapsedMs === null) {
        this.spawnPiece();
      }
    }
  }

  setInputLocked(locked: boolean): void {
    this.inputLocked = locked;
  }

  /* ------------------------------ frame loop ----------------------- */

  private readonly frame = (timestamp: number): void => {
    if (this.destroyed) {
      return;
    }
    const rawDelta = this.prevFrameTs === null ? 0 : timestamp - this.prevFrameTs;
    this.prevFrameTs = timestamp;
    const delta = clamp(rawDelta, 0, MAX_FRAME_DELTA_MS);

    if (this.started && !this.paused) {
      this.update(delta);
    }
    this.render();
    this.emitStats(false);

    this.rafId = requestAnimationFrame(this.frame);
  };

  private update(deltaMs: number): void {
    this.clockMs += deltaMs;

    const wholeSecond = Math.floor(this.clockMs / 1000);
    if (wholeSecond !== this.lastWholeFocusSecond) {
      this.lastWholeFocusSecond = wholeSecond;
      this.statsDirty = true;
    }

    this.pulseIntensity = Math.max(0, this.pulseIntensity - deltaMs / 380);

    if (this.gameOverElapsedMs !== null) {
      this.gameOverElapsedMs += deltaMs;
      if (this.gameOverElapsedMs >= GAME_OVER_RESET_DELAY_MS) {
        this.gameOverElapsedMs = null;
        this.board = this.createEmptyBoard();
        this.dropAccumulatorMs = 0;
        this.spawnPiece();
      }
      return;
    }

    this.dropAccumulatorMs += deltaMs;
    const interval = this.gravityIntervalMs();
    while (this.dropAccumulatorMs >= interval && this.gameOverElapsedMs === null) {
      this.dropAccumulatorMs -= interval;
      this.gravityStep();
    }
  }

  private gravityIntervalMs(): number {
    let interval = this.config.baseTickMs / Math.max(0.05, this.config.tempoMultiplier);
    if (this.config.puzzleMode === 'high-precision') {
      interval *= 2; // half gravity speed for precision play
    }
    return Math.max(30, interval);
  }

  private gravityStep(): void {
    if (this.config.puzzleMode === 'high-tempo') {
      this.pulseIntensity = 1;
    }
    if (this.piece === null) {
      this.spawnPiece();
      return;
    }
    if (this.canPlace(this.piece.shape, this.piece.position.col, this.piece.position.row + 1)) {
      this.piece.position.row += 1;
    } else {
      this.lockPiece();
    }
  }

  /* ------------------------------ input ---------------------------- */

  private handleKeyDown(event: KeyboardEvent): void {
    if (
      this.destroyed ||
      this.inputLocked ||
      !this.started ||
      this.paused ||
      this.gameOverElapsedMs !== null ||
      this.piece === null
    ) {
      return;
    }

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.tryShift(-1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.tryShift(1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.softDrop();
        break;
      case ' ':
        event.preventDefault();
        this.hardDrop();
        break;
      case 'ArrowUp':
      case 'z':
      case 'Z':
        event.preventDefault();
        this.rotatePiece();
        break;
      default:
        break;
    }
  }

  private tryShift(dx: number): void {
    if (this.piece === null) {
      return;
    }
    const { col, row } = this.piece.position;
    if (this.canPlace(this.piece.shape, col + dx, row)) {
      this.piece.position.col += dx;
    }
  }

  private softDrop(): void {
    if (this.piece === null) {
      return;
    }
    const { col, row } = this.piece.position;
    if (this.canPlace(this.piece.shape, col, row + 1)) {
      this.piece.position.row += 1;
      this.dropAccumulatorMs = 0;
    } else {
      this.lockPiece();
    }
  }

  private hardDrop(): void {
    if (this.piece === null) {
      return;
    }
    this.piece.position.row = this.dropTargetRow(this.piece);
    this.lockPiece();
  }

  private rotatePiece(): void {
    if (this.piece === null) {
      return;
    }
    const rotated = rotateClockwise(this.piece.shape);
    for (const [dx, dy] of WALL_KICK_OFFSETS) {
      const col = this.piece.position.col + dx;
      const row = this.piece.position.row + dy;
      if (this.canPlace(rotated, col, row)) {
        this.piece.shape = rotated;
        this.piece.position.col = col;
        this.piece.position.row = row;
        this.piece.rotationState = (((this.piece.rotationState + 1) % 4) as 0 | 1 | 2 | 3);
        this.rotationsPerformed += 1;
        this.statsDirty = true;
        return;
      }
    }
  }

  /* ------------------------------ board logic ---------------------- */

  private createEmptyBoard(): Cell[][] {
    const board: Cell[][] = [];
    for (let r = 0; r < this.config.rows; r++) {
      board.push(new Array<Cell>(this.config.cols).fill(null));
    }
    return board;
  }

  private canPlace(shape: number[][], col: number, row: number): boolean {
    for (let r = 0; r < shape.length; r++) {
      const shapeRow = shape[r];
      for (let c = 0; c < shapeRow.length; c++) {
        if (shapeRow[c] !== 1) {
          continue;
        }
        const boardCol = col + c;
        const boardRow = row + r;
        if (boardCol < 0 || boardCol >= this.config.cols || boardRow >= this.config.rows) {
          return false;
        }
        if (boardRow >= 0 && this.board[boardRow][boardCol] !== null) {
          return false;
        }
      }
    }
    return true;
  }

  private dropTargetRow(piece: BlockPiece): number {
    let row = piece.position.row;
    while (this.canPlace(piece.shape, piece.position.col, row + 1)) {
      row += 1;
    }
    return row;
  }

  private spawnPiece(): void {
    const shapeIndex = Math.floor(Math.random() * PIECE_SHAPES.length);
    const shape = cloneShape(PIECE_SHAPES[shapeIndex]);
    const width = shape[0].length;
    const piece: BlockPiece = {
      id: this.nextPieceId++,
      shape,
      colorIndex: shapeIndex,
      position: {
        col: Math.max(0, Math.floor((this.config.cols - width) / 2)),
        row: 0,
      },
      rotationState: 0,
    };
    if (!this.canPlace(piece.shape, piece.position.col, piece.position.row)) {
      this.piece = null;
      this.triggerGameOver();
      return;
    }
    this.piece = piece;
  }

  private lockPiece(): void {
    if (this.piece === null) {
      return;
    }
    const piece = this.piece;
    this.piece = null;

    const holesBefore = this.countHoles();
    let toppedOut = false;
    for (let r = 0; r < piece.shape.length; r++) {
      const shapeRow = piece.shape[r];
      for (let c = 0; c < shapeRow.length; c++) {
        if (shapeRow[c] !== 1) {
          continue;
        }
        const boardRow = piece.position.row + r;
        const boardCol = piece.position.col + c;
        if (boardRow < 0) {
          toppedOut = true;
          continue;
        }
        this.board[boardRow][boardCol] = piece.colorIndex;
      }
    }

    const holesAfter = this.countHoles();
    const holesCreated = Math.max(0, holesAfter - holesBefore);
    const holeWeight = this.config.puzzleMode === 'high-precision' ? 2 : 1;
    this.holePenalty += holesCreated * holeWeight;
    this.piecesPlaced += 1;
    this.statsDirty = true;

    this.clearFullLines();
    this.matchPatterns();

    if (toppedOut) {
      this.triggerGameOver();
      return;
    }
    this.spawnPiece();
  }

  private countHoles(): number {
    let holes = 0;
    for (let c = 0; c < this.config.cols; c++) {
      let roofSeen = false;
      for (let r = 0; r < this.config.rows; r++) {
        if (this.board[r][c] !== null) {
          roofSeen = true;
        } else if (roofSeen) {
          holes += 1;
        }
      }
    }
    return holes;
  }

  private clearFullLines(): void {
    const survivingRows: Cell[][] = [];
    let clearedLines = 0;
    for (let r = 0; r < this.config.rows; r++) {
      const row = this.board[r];
      if (row.every((cell) => cell !== null)) {
        clearedLines += 1;
      } else {
        survivingRows.push(row);
      }
    }
    if (clearedLines === 0) {
      return;
    }
    while (survivingRows.length < this.config.rows) {
      survivingRows.unshift(new Array<Cell>(this.config.cols).fill(null));
    }
    this.board = survivingRows;

    this.linesClearedTotal += clearedLines;
    this.blocksCleared += clearedLines * this.config.cols;
    for (let i = 0; i < clearedLines; i++) {
      this.matchEventClockTimes.push(this.clockMs);
    }
    this.statsDirty = true;
    this.callbacks.onBlockCleared(this.blocksCleared);
  }

  /**
   * Scans the settled board for row segments matching any configured
   * pattern target. A match requires every 1-cell of the pattern to be
   * occupied by the SAME colorIndex, and every 0-cell inside the pattern's
   * bounding box to be empty. Matched 1-cells are cleared.
   */
  private matchPatterns(): void {
    const targets = this.config.patternTargets;
    if (targets.length === 0) {
      return;
    }
    let guard = 0;
    let found = true;
    while (found && guard < 64) {
      guard += 1;
      found = false;
      for (const pattern of targets) {
        const match = this.findPatternMatch(pattern);
        if (match !== null) {
          this.clearPatternCells(pattern, match.row, match.col);
          found = true;
          break;
        }
      }
    }
  }

  private findPatternMatch(pattern: number[][]): { row: number; col: number } | null {
    const patternHeight = pattern.length;
    if (patternHeight === 0) {
      return null;
    }
    const patternWidth = Math.max(...pattern.map((row) => row.length));
    if (patternWidth === 0) {
      return null;
    }
    for (let baseRow = 0; baseRow <= this.config.rows - patternHeight; baseRow++) {
      for (let baseCol = 0; baseCol <= this.config.cols - patternWidth; baseCol++) {
        if (this.patternMatchesAt(pattern, patternWidth, baseRow, baseCol)) {
          return { row: baseRow, col: baseCol };
        }
      }
    }
    return null;
  }

  private patternMatchesAt(
    pattern: number[][],
    patternWidth: number,
    baseRow: number,
    baseCol: number,
  ): boolean {
    let uniformColor: number | null = null;
    let oneCells = 0;
    for (let r = 0; r < pattern.length; r++) {
      const patternRow = pattern[r];
      for (let c = 0; c < patternWidth; c++) {
        const wanted = c < patternRow.length ? patternRow[c] : 0;
        const cell = this.board[baseRow + r][baseCol + c];
        if (wanted === 1) {
          if (cell === null) {
            return false;
          }
          if (uniformColor === null) {
            uniformColor = cell;
          } else if (uniformColor !== cell) {
            return false;
          }
          oneCells += 1;
        } else if (cell !== null) {
          return false;
        }
      }
    }
    return oneCells > 0;
  }

  private clearPatternCells(pattern: number[][], baseRow: number, baseCol: number): void {
    let cellsCleared = 0;
    for (let r = 0; r < pattern.length; r++) {
      const patternRow = pattern[r];
      for (let c = 0; c < patternRow.length; c++) {
        if (patternRow[c] === 1) {
          this.board[baseRow + r][baseCol + c] = null;
          cellsCleared += 1;
        }
      }
    }
    this.patternsMatchedTotal += 1;
    this.blocksCleared += cellsCleared;
    this.matchEventClockTimes.push(this.clockMs);
    this.currentTargetIndex =
      (this.currentTargetIndex + 1) % Math.max(1, this.config.patternTargets.length);
    this.statsDirty = true;
    this.callbacks.onBlockCleared(this.blocksCleared);
  }

  private triggerGameOver(): void {
    this.piece = null;
    this.gameOverElapsedMs = 0;
    this.statsDirty = true;
    this.callbacks.onGameOver(this.buildStats());
  }

  /* ------------------------------ stats ---------------------------- */

  private buildStats(): PuzzleStats {
    const windowStart = this.clockMs - MATCH_WINDOW_MS;
    this.matchEventClockTimes = this.matchEventClockTimes.filter((t) => t >= windowStart);
    const observedWindowSec = clamp(this.clockMs / 1000, 1, 60);
    const matchesPerMinute =
      Math.round(this.matchEventClockTimes.length * (60 / observedWindowSec) * 100) / 100;
    const errorRate =
      this.piecesPlaced === 0 ? 0 : clamp(this.holePenalty / this.piecesPlaced, 0, 1);
    return {
      blocksCleared: this.blocksCleared,
      linesCleared: this.linesClearedTotal,
      patternsMatched: this.patternsMatchedTotal,
      rotationsPerformed: this.rotationsPerformed,
      matchesPerMinute,
      errorRate: Math.round(errorRate * 1000) / 1000,
      elapsedFocusSeconds: Math.round((this.clockMs / 1000) * 10) / 10,
    };
  }

  private emitStats(force: boolean): void {
    if (!this.statsDirty && !force) {
      return;
    }
    if (!force && this.clockMs - this.lastStatsEmitClockMs < STATS_EMIT_INTERVAL_MS) {
      return;
    }
    this.statsDirty = false;
    this.lastStatsEmitClockMs = this.clockMs;
    this.callbacks.onStatsUpdate(this.buildStats());
  }

  /* ------------------------------ rendering ------------------------ */

  private syncCanvasSize(): void {
    const { cols, rows, cellPx } = this.config;
    this.canvas.width = (cols + SIDE_PANEL_CELLS) * cellPx;
    this.canvas.height = rows * cellPx;
  }

  private palette(): Palette {
    return this.config.contrastMode === 'max' ? MAX_CONTRAST_PALETTE : NORMAL_PALETTE;
  }

  private render(): void {
    const ctx = this.ctx;
    const pal = this.palette();
    const { cols, rows, cellPx } = this.config;
    const boardWidth = cols * cellPx;
    const boardHeight = rows * cellPx;
    const panelX = boardWidth;
    const panelWidth = SIDE_PANEL_CELLS * cellPx;

    ctx.fillStyle = pal.boardBackground;
    ctx.fillRect(0, 0, boardWidth, boardHeight);
    ctx.fillStyle = pal.panelBackground;
    ctx.fillRect(panelX, 0, panelWidth, boardHeight);

    // Grid lines.
    ctx.strokeStyle = pal.gridLine;
    ctx.lineWidth = pal.gridLineWidth;
    ctx.beginPath();
    for (let c = 0; c <= cols; c++) {
      ctx.moveTo(c * cellPx + 0.5, 0);
      ctx.lineTo(c * cellPx + 0.5, boardHeight);
    }
    for (let r = 0; r <= rows; r++) {
      ctx.moveTo(0, r * cellPx + 0.5);
      ctx.lineTo(boardWidth, r * cellPx + 0.5);
    }
    ctx.stroke();

    // Settled cells.
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = this.board[r][c];
        if (cell !== null) {
          this.drawCell(c, r, cell, 1, pal);
        }
      }
    }

    // Ghost + active piece.
    if (this.piece !== null && this.gameOverElapsedMs === null) {
      const ghostRow = this.dropTargetRow(this.piece);
      this.drawPiece(this.piece, ghostRow, pal.ghostAlpha, pal);
      this.drawPiece(this.piece, this.piece.position.row, 1, pal);
    }

    // High-tempo screen pulse.
    if (this.config.puzzleMode === 'high-tempo' && this.pulseIntensity > 0) {
      ctx.save();
      ctx.globalAlpha = this.pulseIntensity;
      ctx.fillStyle = pal.pulseColor;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.restore();
    }

    this.renderSidePanel(pal, panelX, panelWidth);
    this.renderOverlays(pal, boardWidth, boardHeight);
  }

  private drawPiece(piece: BlockPiece, atRow: number, alpha: number, pal: Palette): void {
    for (let r = 0; r < piece.shape.length; r++) {
      const shapeRow = piece.shape[r];
      for (let c = 0; c < shapeRow.length; c++) {
        if (shapeRow[c] === 1) {
          const boardRow = atRow + r;
          if (boardRow >= 0) {
            this.drawCell(piece.position.col + c, boardRow, piece.colorIndex, alpha, pal);
          }
        }
      }
    }
  }

  private drawCell(col: number, row: number, colorIndex: number, alpha: number, pal: Palette): void {
    const ctx = this.ctx;
    const { cellPx } = this.config;
    const color = pal.blocks[((colorIndex % pal.blocks.length) + pal.blocks.length) % pal.blocks.length];
    const inset = this.config.contrastMode === 'max' ? 1 : 2;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(col * cellPx + inset, row * cellPx + inset, cellPx - inset * 2, cellPx - inset * 2);
    ctx.strokeStyle = pal.cellBorder;
    ctx.lineWidth = this.config.contrastMode === 'max' ? 2 : 1;
    ctx.strokeRect(
      col * cellPx + inset + 0.5,
      row * cellPx + inset + 0.5,
      cellPx - inset * 2 - 1,
      cellPx - inset * 2 - 1,
    );
    ctx.restore();
  }

  private renderSidePanel(pal: Palette, panelX: number, panelWidth: number): void {
    const ctx = this.ctx;
    const { cellPx } = this.config;
    const pad = Math.floor(cellPx * 0.5);
    const fontPx = Math.max(10, Math.floor(cellPx * 0.42));
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    ctx.fillStyle = pal.text;
    ctx.font = `bold ${fontPx}px monospace`;
    ctx.fillText('TARGET', panelX + pad, pad);

    const targets = this.config.patternTargets;
    let patternBottom = pad + fontPx + 6;
    if (targets.length > 0) {
      const pattern = targets[this.currentTargetIndex % targets.length];
      ctx.fillStyle = pal.textDim;
      ctx.font = `${Math.max(9, fontPx - 3)}px monospace`;
      ctx.fillText(
        `${(this.currentTargetIndex % targets.length) + 1} / ${targets.length}`,
        panelX + pad,
        patternBottom,
      );
      patternBottom += fontPx + 4;

      const patternHeight = pattern.length;
      const patternWidth = Math.max(1, ...pattern.map((row) => row.length));
      const available = panelWidth - pad * 2;
      const previewCell = Math.max(6, Math.min(cellPx, Math.floor(available / Math.max(1, patternWidth))));
      for (let r = 0; r < patternHeight; r++) {
        const patternRow = pattern[r];
        for (let c = 0; c < patternWidth; c++) {
          const x = panelX + pad + c * previewCell;
          const y = patternBottom + r * previewCell;
          const filled = c < patternRow.length && patternRow[c] === 1;
          ctx.fillStyle = filled ? pal.patternFill : pal.boardBackground;
          ctx.fillRect(x + 1, y + 1, previewCell - 2, previewCell - 2);
          ctx.strokeStyle = pal.gridLine;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, previewCell - 1, previewCell - 1);
        }
      }
      patternBottom += patternHeight * previewCell + Math.floor(cellPx * 0.6);
    }

    const stats = this.buildStats();
    const lines: Array<readonly [string, string]> = [
      ['BLOCKS', String(stats.blocksCleared)],
      ['LINES', String(stats.linesCleared)],
      ['PATTERNS', String(stats.patternsMatched)],
      ['ROT', String(stats.rotationsPerformed)],
      ['MPM', stats.matchesPerMinute.toFixed(1)],
      ['ERR', `${Math.round(stats.errorRate * 100)}%`],
      ['FOCUS', `${Math.floor(stats.elapsedFocusSeconds)}s`],
    ];
    ctx.font = `${Math.max(9, fontPx - 2)}px monospace`;
    let y = patternBottom;
    const lineHeight = fontPx + 5;
    for (const [label, value] of lines) {
      ctx.fillStyle = pal.textDim;
      ctx.fillText(label, panelX + pad, y);
      ctx.fillStyle = pal.text;
      ctx.textAlign = 'right';
      ctx.fillText(value, panelX + panelWidth - pad, y);
      ctx.textAlign = 'left';
      y += lineHeight;
    }

    if (this.inputLocked) {
      ctx.fillStyle = pal.text;
      ctx.font = `bold ${Math.max(9, fontPx - 2)}px monospace`;
      ctx.fillText('INPUT LOCKED', panelX + pad, this.canvas.height - lineHeight - pad);
    }
  }

  private renderOverlays(pal: Palette, boardWidth: number, boardHeight: number): void {
    const ctx = this.ctx;
    const fontPx = Math.max(12, Math.floor(this.config.cellPx * 0.6));

    if (this.gameOverElapsedMs !== null) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(0, 0, boardWidth, boardHeight);
      ctx.fillStyle = pal.text;
      ctx.font = `bold ${fontPx}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('STACK TOPPED OUT', boardWidth / 2, boardHeight / 2 - fontPx);
      ctx.font = `${Math.max(10, fontPx - 4)}px monospace`;
      ctx.fillText('rebuilding…', boardWidth / 2, boardHeight / 2 + 4);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
    } else if (this.paused && this.started) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(0, 0, boardWidth, boardHeight);
      ctx.fillStyle = pal.text;
      ctx.font = `bold ${fontPx}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PAUSED', boardWidth / 2, boardHeight / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
    } else if (!this.started) {
      ctx.fillStyle = pal.textDim;
      ctx.font = `${fontPx}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('READY', boardWidth / 2, boardHeight / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
    }
  }
}
