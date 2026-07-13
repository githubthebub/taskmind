/* ============================================================================
 * Culture Bridge — Game Engine
 * ----------------------------------------------------------------------------
 * A small top-down, Pokemon-inspired explorer. You walk a world that joins
 * India (Bharat) and Japan (Nihon), meet folklore "Kotomon" in the tall grass,
 * and befriend them by answering culture-exchange questions.
 *
 * Rendering: the overworld is drawn on a <canvas>; menus, dialogue and the
 * quiz are lightweight HTML overlays for accessibility and reliability.
 * Data (creatures, questions, phrasebook, signs) lives in js/data.js.
 * ==========================================================================*/
(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   *  Tile + world constants
   * ------------------------------------------------------------------ */
  const TILE = 32;                 // pixel size of one tile
  const VIEW_W = 21;               // viewport width  in tiles
  const VIEW_H = 15;               // viewport height in tiles
  const MOVE_MS = 150;             // ms to step one tile
  const ENCOUNTER_CHANCE = 0.22;   // per step in tall grass

  // Tile codes
  const T = {
    GRASS: 0, PATH: 1, TREE: 2, WATER: 3, WALL: 4,
    GRASS_IN: 5, GRASS_JP: 6, SIGN: 7, BRIDGE: 9, TORII: 10,
    RANGOLI: 11, SAKURA_PETAL: 12, TEMPLE: 13, MOUNTAIN: 14,
    PLAZA: 15, SAKURA_TREE: 16, LOTUS: 17
  };

  const SOLID = new Set([
    T.TREE, T.WATER, T.WALL, T.SIGN, T.TEMPLE, T.MOUNTAIN, T.SAKURA_TREE
  ]);

  const MAP_W = 44, MAP_H = 30;

  // Emoji faces for the twelve Kotomon (drawn on canvas in encounters/dex)
  const KOTO_EMOJI = {
    garuda: '🦅', naga: '🐍', airavata: '🐘',
    hamsa: '🦢', makara: '🐊', nandi: '🐂',
    kitsune: '🦊', tanuki: '🦝', kappa: '🐢',
    tengu: '👺', ryu: '🐉', baku: '🦄'
  };

  /* ------------------------------------------------------------------ *
   *  Game state
   * ------------------------------------------------------------------ */
  const state = {
    mode: 'play',                 // 'play' | 'dialogue' | 'quiz' | 'menu'
    map: null,
    signs: {},                    // "x,y" -> textKey
    npcs: [],                     // {x,y,name,home,lines}
    player: null,
    keys: new Set(),
    camera: { x: 0, y: 0 },
    lastTime: 0,
    befriended: new Set(),
    harmony: 0,
    encountersDone: 0,
    activeQuestion: null,
    activeKotomon: null,
    toast: null,
    toastUntil: 0,
    won: false
  };

  /* ------------------------------------------------------------------ *
   *  World builder — lays out the two regions and the bridge between.
   * ------------------------------------------------------------------ */
  function buildWorld() {
    const m = [];
    for (let y = 0; y < MAP_H; y++) {
      m.push(new Array(MAP_W).fill(T.GRASS));
    }
    const set = (x, y, t) => {
      if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) m[y][x] = t;
    };
    const rect = (x0, y0, w, h, t) => {
      for (let y = y0; y < y0 + h; y++)
        for (let x = x0; x < x0 + w; x++) set(x, y, t);
    };

    // Outer border of trees / mountains
    for (let x = 0; x < MAP_W; x++) { set(x, 0, T.TREE); set(x, MAP_H - 1, T.TREE); }
    for (let y = 0; y < MAP_H; y++) { set(0, y, T.TREE); set(MAP_W - 1, y, T.TREE); }
    // Mountain ridges top corners for flavour
    rect(1, 1, 4, 2, T.MOUNTAIN);
    rect(MAP_W - 5, 1, 4, 2, T.MOUNTAIN);

    // River down the middle with a crossing bridge
    const RX = 21;
    for (let y = 1; y < MAP_H - 1; y++) { set(RX, y, T.WATER); set(RX + 1, y, T.WATER); }
    // Bridge crossing at the central path rows
    set(RX, 14, T.BRIDGE); set(RX + 1, 14, T.BRIDGE);
    set(RX, 15, T.BRIDGE); set(RX + 1, 15, T.BRIDGE);

    // Main east-west path across the whole world (rows 14-15)
    for (let x = 1; x < MAP_W - 1; x++) {
      if (m[14][x] !== T.WATER) set(x, 14, T.PATH);
      if (m[15][x] !== T.WATER) set(x, 15, T.PATH);
    }
    set(RX, 14, T.BRIDGE); set(RX + 1, 14, T.BRIDGE);
    set(RX, 15, T.BRIDGE); set(RX + 1, 15, T.BRIDGE);

    // --- BHARAT (India) region: left side ---
    // Temple (mandir) with tower
    rect(4, 5, 4, 3, T.TEMPLE);
    set(5, 4, T.TEMPLE); set(6, 4, T.TEMPLE);         // tower step
    // Rangoli decoration + lotus pond edges
    const rangoli = [[10, 6], [11, 6], [12, 6], [11, 5], [11, 7], [9, 20], [10, 21], [8, 22]];
    rangoli.forEach(([x, y]) => set(x, y, T.RANGOLI));
    set(6, 20, T.LOTUS); set(7, 20, T.LOTUS); set(6, 21, T.LOTUS);
    // Spice-garden tall grass patches (India encounter zones)
    rect(9, 9, 6, 4, T.GRASS_IN);
    rect(3, 18, 5, 4, T.GRASS_IN);
    rect(13, 20, 5, 5, T.GRASS_IN);
    // A few scattered trees for shape
    [[3, 11], [16, 8], [2, 25], [17, 4], [15, 16]].forEach(([x, y]) => set(x, y, T.TREE));
    // Connecting paths to the main road
    for (let y = 8; y <= 14; y++) set(11, y, T.PATH);
    for (let y = 15; y <= 22; y++) set(11, y, T.PATH);

    // --- NIHON (Japan) region: right side ---
    // Pagoda + torii gate
    rect(36, 5, 4, 3, T.TEMPLE);
    set(37, 4, T.TEMPLE); set(38, 4, T.TEMPLE);
    set(33, 14, T.TORII); set(33, 15, T.TORII);
    // Sakura trees + fallen petals
    [[30, 6], [32, 8], [40, 10], [29, 11], [38, 18], [41, 22], [31, 24]]
      .forEach(([x, y]) => set(x, y, T.SAKURA_TREE));
    [[30, 7], [31, 7], [40, 11], [38, 19], [31, 25]]
      .forEach(([x, y]) => set(x, y, T.SAKURA_PETAL));
    // Bamboo-grove tall grass patches (Japan encounter zones)
    rect(28, 9, 6, 4, T.GRASS_JP);
    rect(36, 18, 5, 4, T.GRASS_JP);
    rect(29, 20, 5, 5, T.GRASS_JP);
    // Connecting paths
    for (let y = 8; y <= 14; y++) set(31, y, T.PATH);
    for (let y = 15; y <= 22; y++) set(31, y, T.PATH);

    // --- Central hub plaza around the bridge (the "Harmony" meeting place) ---
    rect(18, 13, 3, 4, T.PLAZA);
    rect(23, 13, 3, 4, T.PLAZA);

    // --- Signs (walk into and press SPACE) ---
    const signs = {};
    const placeSign = (x, y, key) => { set(x, y, T.SIGN); signs[x + ',' + y] = key; };
    placeSign(19, 13, 'welcome');
    placeSign(8, 13, 'india');
    placeSign(35, 13, 'japan');
    placeSign(20, 12, 'bridge');
    placeSign(33, 16, 'torii');
    placeSign(6, 8, 'temple');

    // --- NPCs ---
    const npcSpecs = [
      { x: 9, y: 16, key: 'india' },
      { x: 34, y: 16, key: 'japan' },
      { x: 24, y: 16, key: 'bridge' }
    ];
    const npcs = npcSpecs.map(spec => {
      const src = NPCS.find(n => n.home === spec.key);
      return { x: spec.x, y: spec.y, name: src.name, home: src.home, lines: src.lines };
    });

    state.map = m;
    state.signs = signs;
    state.npcs = npcs;
  }

  function tileAt(x, y) {
    if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return T.TREE;
    return state.map[y][x];
  }
  function isSolid(x, y) {
    if (SOLID.has(tileAt(x, y))) return true;
    return state.npcs.some(n => n.x === x && n.y === y);
  }

  /* ------------------------------------------------------------------ *
   *  Canvas setup
   * ------------------------------------------------------------------ */
  let canvas, ctx;
  function initCanvas() {
    canvas = document.getElementById('game');
    canvas.width = VIEW_W * TILE;
    canvas.height = VIEW_H * TILE;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
  }

  /* ------------------------------------------------------------------ *
   *  Rendering
   * ------------------------------------------------------------------ */
  function drawTile(t, sx, sy, tx, ty) {
    // base ground colour differs slightly by region (west = warm, east = cool)
    const westWarm = tx < 21;
    const grassA = westWarm ? '#7cb342' : '#66bb6a';
    const grassB = westWarm ? '#8bc34a' : '#7bc47f';

    // Draw grass under everything first for decorations/solids that sit on land
    ctx.fillStyle = ((tx + ty) % 2 === 0) ? grassA : grassB;
    ctx.fillRect(sx, sy, TILE, TILE);

    switch (t) {
      case T.PATH:
      case T.PLAZA:
        ctx.fillStyle = t === T.PLAZA ? '#d7ccc8' : '#c8a165';
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(sx + 4, sy + 4, 3, 3);
        ctx.fillRect(sx + 20, sy + 16, 3, 3);
        break;
      case T.TREE:
        ctx.fillStyle = '#4e342e';
        ctx.fillRect(sx + TILE / 2 - 3, sy + TILE - 10, 6, 10);
        ctx.fillStyle = '#2e7d32';
        circle(sx + TILE / 2, sy + TILE / 2 - 2, 13, '#2e7d32');
        circle(sx + TILE / 2 - 6, sy + TILE / 2 + 3, 9, '#388e3c');
        circle(sx + TILE / 2 + 6, sy + TILE / 2 + 3, 9, '#43a047');
        break;
      case T.SAKURA_TREE:
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(sx + TILE / 2 - 3, sy + TILE - 10, 6, 10);
        circle(sx + TILE / 2, sy + TILE / 2 - 2, 13, '#f8bbd0');
        circle(sx + TILE / 2 - 6, sy + TILE / 2 + 3, 9, '#f48fb1');
        circle(sx + TILE / 2 + 6, sy + TILE / 2 + 3, 9, '#f8bbd0');
        break;
      case T.WATER:
        ctx.fillStyle = '#4fa3d1';
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(sx + 4, sy + 8, 10, 2);
        ctx.fillRect(sx + 16, sy + 20, 10, 2);
        break;
      case T.BRIDGE:
        ctx.fillStyle = '#a1674a';
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = '#8d5638';
        for (let i = 0; i < TILE; i += 8) ctx.fillRect(sx + i, sy, 2, TILE);
        break;
      case T.WALL:
        ctx.fillStyle = '#9e9e9e';
        ctx.fillRect(sx, sy, TILE, TILE);
        break;
      case T.TEMPLE:
        ctx.fillStyle = westWarm ? '#c0392b' : '#b71c1c';
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = westWarm ? '#f1c40f' : '#ffd54f';
        ctx.fillRect(sx + 6, sy + 6, TILE - 12, TILE - 12);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(sx, sy, TILE, 5);
        break;
      case T.MOUNTAIN:
        ctx.fillStyle = '#8d6e63';
        tri(sx + TILE / 2, sy + 3, sx + 3, sy + TILE - 3, sx + TILE - 3, sy + TILE - 3, '#8d6e63');
        ctx.fillStyle = '#efebe9';
        tri(sx + TILE / 2, sy + 3, sx + TILE / 2 - 6, sy + 13, sx + TILE / 2 + 6, sy + 13, '#efebe9');
        break;
      case T.TORII:
        ctx.fillStyle = '#e53935';
        ctx.fillRect(sx + 3, sy, 4, TILE);
        ctx.fillRect(sx + TILE - 7, sy, 4, TILE);
        ctx.fillRect(sx, sy + 3, TILE, 5);
        ctx.fillRect(sx + 2, sy + 11, TILE - 4, 4);
        break;
      case T.RANGOLI:
        drawRangoli(sx, sy);
        break;
      case T.LOTUS:
        circle(sx + TILE / 2, sy + TILE / 2, 10, '#4fa3d1');
        circle(sx + TILE / 2, sy + TILE / 2, 5, '#f06292');
        break;
      case T.SAKURA_PETAL:
        ctx.fillStyle = '#f8bbd0';
        [[8, 10], [18, 14], [12, 22], [22, 20]].forEach(([dx, dy]) =>
          circle(sx + dx, sy + dy, 2.5, '#f8bbd0'));
        break;
      case T.SIGN:
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(sx + TILE / 2 - 2, sy + 14, 4, 14);
        ctx.fillStyle = '#a1887f';
        ctx.fillRect(sx + 5, sy + 4, TILE - 10, 13);
        ctx.fillStyle = '#4e342e';
        ctx.fillRect(sx + 7, sy + 7, TILE - 14, 2);
        ctx.fillRect(sx + 7, sy + 11, TILE - 18, 2);
        break;
      case T.GRASS_IN:
      case T.GRASS_JP:
        drawTallGrass(sx, sy, t === T.GRASS_IN);
        break;
      default:
        break; // plain grass already drawn
    }
  }

  function drawTallGrass(sx, sy, india) {
    const dark = india ? '#558b2f' : '#2e7d32';
    const light = india ? '#7cb342' : '#43a047';
    ctx.fillStyle = dark;
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = light;
    for (let bx = 3; bx < TILE; bx += 7) {
      for (let by = 6; by < TILE; by += 9) {
        ctx.beginPath();
        ctx.moveTo(sx + bx, sy + by + 6);
        ctx.lineTo(sx + bx - 2, sy + by);
        ctx.lineTo(sx + bx + 2, sy + by);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  function drawRangoli(sx, sy) {
    const cx = sx + TILE / 2, cy = sy + TILE / 2;
    const cols = ['#e74c3c', '#f1c40f', '#e67e22', '#8e44ad', '#16a085'];
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI / 4) * i;
      ctx.fillStyle = cols[i % cols.length];
      circle(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8, 3, cols[i % cols.length]);
    }
    circle(cx, cy, 3.5, '#fff');
  }

  function circle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  function tri(ax, ay, bx, by, cx2, cy2, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx2, cy2);
    ctx.closePath(); ctx.fill();
  }

  function drawPlayer(sx, sy) {
    const p = state.player;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(sx + TILE / 2, sy + TILE - 4, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // body (a young culture-explorer)
    ctx.fillStyle = '#3949ab';
    ctx.fillRect(sx + 9, sy + 14, 14, 13);
    // head
    circle(sx + TILE / 2, sy + 11, 8, '#f5cba7');
    // hair
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(sx + 8, sy + 4, 16, 6);
    // facing indicator (a little scarf that points the way)
    ctx.fillStyle = '#e74c3c';
    if (p.dir === 'down') ctx.fillRect(sx + 12, sy + 20, 8, 5);
    else if (p.dir === 'up') ctx.fillRect(sx + 12, sy + 13, 8, 4);
    else if (p.dir === 'left') ctx.fillRect(sx + 8, sy + 16, 5, 8);
    else ctx.fillRect(sx + 19, sy + 16, 5, 8);
  }

  function drawNPC(n, sx, sy) {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(sx + TILE / 2, sy + TILE - 4, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    const robe = n.home === 'india' ? '#e67e22'
      : n.home === 'japan' ? '#8e44ad' : '#c0392b';
    ctx.fillStyle = robe;
    ctx.fillRect(sx + 8, sy + 13, 16, 14);
    circle(sx + TILE / 2, sy + 10, 8, '#f5cba7');
    ctx.fillStyle = '#212121';
    ctx.fillRect(sx + 9, sy + 3, 14, 6);
    // little "!" so players know they can talk
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✱', sx + TILE / 2, sy - 2);
  }

  function render() {
    const p = state.player;
    // Smooth pixel position of the player
    let px = p.x, py = p.y;
    if (p.moving) {
      const tt = Math.min(1, (performance.now() - p.moveStart) / MOVE_MS);
      px = p.fromX + (p.x - p.fromX) * tt;
      py = p.fromY + (p.y - p.fromY) * tt;
    }
    // Camera centres on player, clamped to map
    let camX = px - Math.floor(VIEW_W / 2);
    let camY = py - Math.floor(VIEW_H / 2);
    camX = Math.max(0, Math.min(camX, MAP_W - VIEW_W));
    camY = Math.max(0, Math.min(camY, MAP_H - VIEW_H));

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const startX = Math.floor(camX), startY = Math.floor(camY);
    const offX = (camX - startX) * TILE, offY = (camY - startY) * TILE;

    for (let vy = -1; vy <= VIEW_H + 1; vy++) {
      for (let vx = -1; vx <= VIEW_W + 1; vx++) {
        const tx = startX + vx, ty = startY + vy;
        if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) continue;
        const sx = vx * TILE - offX, sy = vy * TILE - offY;
        drawTile(state.map[ty][tx], sx, sy, tx, ty);
      }
    }
    // NPCs
    state.npcs.forEach(n => {
      const sx = (n.x - camX) * TILE, sy = (n.y - camY) * TILE;
      if (sx > -TILE && sx < canvas.width && sy > -TILE && sy < canvas.height)
        drawNPC(n, sx, sy);
    });
    // Player
    drawPlayer((px - camX) * TILE, (py - camY) * TILE);

    // Toast message
    if (state.toast && performance.now() < state.toastUntil) {
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, canvas.height - 34, canvas.width, 34);
      ctx.fillStyle = '#fff';
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.toast, canvas.width / 2, canvas.height - 12);
    }
  }

  function showToast(msg, ms) {
    state.toast = msg;
    state.toastUntil = performance.now() + (ms || 2600);
  }

  /* ------------------------------------------------------------------ *
   *  Input + movement
   * ------------------------------------------------------------------ */
  function tryMove(dir) {
    const p = state.player;
    if (p.moving) return;
    p.dir = dir;
    let nx = p.x, ny = p.y;
    if (dir === 'up') ny--;
    else if (dir === 'down') ny++;
    else if (dir === 'left') nx--;
    else nx++;
    if (isSolid(nx, ny)) return;
    p.fromX = p.x; p.fromY = p.y;
    p.x = nx; p.y = ny;
    p.moving = true;
    p.moveStart = performance.now();
  }

  function afterStep() {
    const p = state.player;
    const t = tileAt(p.x, p.y);
    if ((t === T.GRASS_IN || t === T.GRASS_JP) && Math.random() < ENCOUNTER_CHANCE) {
      startEncounter(t === T.GRASS_IN ? 'india' : 'japan');
    }
  }

  function facingTile() {
    const p = state.player;
    let x = p.x, y = p.y;
    if (p.dir === 'up') y--;
    else if (p.dir === 'down') y++;
    else if (p.dir === 'left') x--;
    else x++;
    return { x, y };
  }

  function interact() {
    const f = facingTile();
    // Sign?
    const key = state.signs[f.x + ',' + f.y];
    if (key && SIGN_TEXTS[key]) { openDialogue([SIGN_TEXTS[key]], null); return; }
    // NPC?
    const npc = state.npcs.find(n => n.x === f.x && n.y === f.y);
    if (npc) { openDialogue(npc.lines, npc.name); return; }
  }

  /* ------------------------------------------------------------------ *
   *  Dialogue overlay
   * ------------------------------------------------------------------ */
  let dialogueLines = [], dialogueIdx = 0, dialogueSpeaker = null;
  function openDialogue(lines, speaker) {
    dialogueLines = lines; dialogueIdx = 0; dialogueSpeaker = speaker;
    state.mode = 'dialogue';
    renderDialogue();
  }
  function renderDialogue() {
    const box = document.getElementById('dialogue');
    const speaker = dialogueSpeaker ? '<div class="speaker">' + dialogueSpeaker + '</div>' : '';
    box.innerHTML = speaker +
      '<p>' + escapeHtml(dialogueLines[dialogueIdx]) + '</p>' +
      '<div class="hint">▶ Space / click to continue</div>';
    box.classList.add('show');
  }
  function advanceDialogue() {
    dialogueIdx++;
    if (dialogueIdx >= dialogueLines.length) {
      document.getElementById('dialogue').classList.remove('show');
      state.mode = 'play';
    } else {
      renderDialogue();
    }
  }

  /* ------------------------------------------------------------------ *
   *  Encounter + quiz
   * ------------------------------------------------------------------ */
  function pickKotomon(region) {
    const pool = KOTOMON.filter(k => k.home === region);
    const fresh = pool.filter(k => !state.befriended.has(k.id));
    const arr = fresh.length ? fresh : pool;
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function pickQuestion() {
    return QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
  }

  function startEncounter(region) {
    state.mode = 'quiz';
    state.encountersDone++;
    state.activeKotomon = pickKotomon(region);
    state.activeQuestion = pickQuestion();
    renderQuiz();
  }

  function shuffledChoices(q) {
    const arr = q.choices.map((text, i) => ({ text, correct: i === q.answer }));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function creatureSprite(k, size) {
    // Returns a data-canvas rendering of the Kotomon as an <canvas> element.
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const g = c.getContext('2d');
    // rounded background using palette
    g.fillStyle = k.palette.detail;
    roundRect(g, 2, 2, size - 4, size - 4, 14);
    g.fill();
    g.fillStyle = k.palette.body;
    roundRect(g, 6, 6, size - 12, size - 12, 12);
    g.fill();
    // emoji
    g.font = Math.floor(size * 0.5) + 'px serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(KOTO_EMOJI[k.id] || '✨', size / 2, size / 2 + 2);
    return c;
  }

  function renderQuiz() {
    const k = state.activeKotomon, q = state.activeQuestion;
    const overlay = document.getElementById('quiz');
    overlay.innerHTML = '';

    const panel = document.createElement('div');
    panel.className = 'quiz-panel';

    // Creature header
    const head = document.createElement('div');
    head.className = 'quiz-creature';
    const sprite = creatureSprite(k, 96);
    sprite.className = 'sprite';
    head.appendChild(sprite);
    const meta = document.createElement('div');
    meta.innerHTML =
      '<div class="k-name">A wild <b>' + escapeHtml(k.name) + '</b> appeared!</div>' +
      '<div class="k-title">' + escapeHtml(k.title) + '</div>' +
      '<div class="k-home ' + k.home + '">' +
      (k.home === 'india' ? '🇮🇳 Bharat spirit' : '🇯🇵 Nihon spirit') +
      '</div>';
    head.appendChild(meta);
    panel.appendChild(head);

    // Question
    const qEl = document.createElement('div');
    qEl.className = 'quiz-q';
    qEl.innerHTML = '<span class="topic">' + escapeHtml(q.topic) +
      (q.link ? ' ↔ Bridge' : '') + '</span>' + escapeHtml(q.q);
    panel.appendChild(qEl);

    // Choices
    const choices = shuffledChoices(q);
    const list = document.createElement('div');
    list.className = 'quiz-choices';
    choices.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.className = 'choice';
      btn.innerHTML = '<span class="num">' + (i + 1) + '</span>' + escapeHtml(choice.text);
      btn.onclick = () => answerQuiz(choice.correct, btn, list);
      list.appendChild(btn);
    });
    panel.appendChild(list);

    const foot = document.createElement('div');
    foot.className = 'quiz-foot';
    foot.textContent = 'Press 1–4 or click to answer';
    panel.appendChild(foot);

    overlay.appendChild(panel);
    overlay.classList.add('show');
    state._quizChoices = list;
    state._quizAnswered = false;
  }

  function answerQuiz(correct, btn, list) {
    if (state._quizAnswered) return;
    state._quizAnswered = true;
    const k = state.activeKotomon, q = state.activeQuestion;

    // Mark buttons
    Array.from(list.children).forEach(b => { b.disabled = true; });
    btn.classList.add(correct ? 'right' : 'wrong');
    if (!correct) {
      // reveal the correct one
      Array.from(list.children).forEach(b => {
        if (b.textContent.replace(/^[1-4]/, '').trim() === q.choices[q.answer])
          b.classList.add('right');
      });
    }

    let gained = 0, newlyBefriended = false;
    if (correct) {
      gained = q.link ? 15 : 10;
      if (!state.befriended.has(k.id)) {
        state.befriended.add(k.id);
        newlyBefriended = true;
        gained += 5;
      }
    } else {
      gained = 2; // consolation for learning
    }
    state.harmony += gained;
    save();

    // Result panel
    const overlay = document.getElementById('quiz');
    const result = document.createElement('div');
    result.className = 'quiz-result ' + (correct ? 'ok' : 'no');
    let head;
    if (correct && newlyBefriended)
      head = '🎉 ' + k.name + ' became your friend!';
    else if (correct)
      head = '✅ Correct! ' + k.name + ' nods warmly.';
    else
      head = '❌ ' + k.name + ' slipped away — but you learned something.';

    result.innerHTML =
      '<div class="r-head">' + escapeHtml(head) + '</div>' +
      '<div class="r-explain">' + escapeHtml(q.explain) + '</div>' +
      (newlyBefriended
        ? '<div class="r-bridge"><b>Culture Bridge:</b> ' + escapeHtml(k.bridge) + '</div>'
        : '') +
      '<div class="r-points">+' + gained + ' Harmony Points</div>' +
      '<button class="continue" id="continueBtn">Continue ▶</button>';
    overlay.querySelector('.quiz-panel').appendChild(result);
    result.scrollIntoView({ behavior: 'smooth', block: 'end' });
    document.getElementById('continueBtn').onclick = closeQuiz;
  }

  function closeQuiz() {
    document.getElementById('quiz').classList.remove('show');
    state.mode = 'play';
    updateHud();
    if (!state.won && state.befriended.size === KOTOMON.length) {
      state.won = true;
      save();
      setTimeout(showVictory, 350);
    }
  }

  function showVictory() {
    openDialogue([
      '🌏 You have befriended all twelve Kotomon!',
      'From Garuda to Karura, from Saraswati to Benzaiten, from stupa to pagoda — you have ' +
      'traced every thread joining India and Japan.',
      'Master Bodhi smiles: "You see it now. Two lanterns, one flame. You are a true ' +
      'Culture Bridge Master!"',
      'Keep exploring, or press [C] to admire your Culturedex. Well done, friend / dost / tomodachi!'
    ], 'Victory');
  }

  /* ------------------------------------------------------------------ *
   *  Culturedex + Phrasebook overlays
   * ------------------------------------------------------------------ */
  function openDex() {
    state.mode = 'menu';
    const overlay = document.getElementById('menu');
    let html = '<div class="menu-panel"><div class="menu-head">' +
      '<h2>📖 Culturedex</h2>' +
      '<span class="count">' + state.befriended.size + ' / ' + KOTOMON.length + ' befriended</span>' +
      '<button class="close" data-close="1">✕</button></div>' +
      '<div class="dex-grid">';

    KOTOMON.forEach(k => {
      const got = state.befriended.has(k.id);
      html += '<div class="dex-card ' + (got ? 'got ' : 'unknown ') + k.home + '">' +
        '<div class="dex-emoji">' + (got ? (KOTO_EMOJI[k.id] || '✨') : '❓') + '</div>' +
        '<div class="dex-name">' + (got ? escapeHtml(k.name) : '???') + '</div>' +
        (got ? '<div class="dex-title">' + escapeHtml(k.title) + '</div>' +
          '<div class="dex-lore">' + escapeHtml(k.lore) + '</div>' +
          '<div class="dex-bridge">' + escapeHtml(k.bridge) + '</div>'
          : '<div class="dex-lore muted">Find this spirit in the ' +
            (k.home === 'india' ? 'spice gardens of Bharat.' : 'bamboo groves of Nihon.') + '</div>') +
        '</div>';
    });
    html += '</div><div class="menu-foot">Press [C] or [Esc] to close</div></div>';
    overlay.innerHTML = html;
    overlay.classList.add('show');
    overlay.querySelector('[data-close]').onclick = closeMenu;
  }

  function openPhrasebook() {
    state.mode = 'menu';
    const overlay = document.getElementById('menu');
    let rows = PHRASEBOOK.map(p =>
      '<tr><td class="meaning">' + escapeHtml(p.meaning) + '</td>' +
      '<td class="in"><span class="rom">' + escapeHtml(p.hindi) + '</span>' +
      '<span class="scr">' + escapeHtml(p.hindiScript) + '</span></td>' +
      '<td class="jp"><span class="rom">' + escapeHtml(p.japanese) + '</span>' +
      '<span class="scr">' + escapeHtml(p.japaneseScript) + '</span></td></tr>'
    ).join('');
    overlay.innerHTML =
      '<div class="menu-panel"><div class="menu-head">' +
      '<h2>🗣️ Phrasebook</h2>' +
      '<span class="count">Hindi ↔ Japanese</span>' +
      '<button class="close" data-close="1">✕</button></div>' +
      '<table class="phrase-table"><thead><tr><th>Meaning</th>' +
      '<th>🇮🇳 Hindi</th><th>🇯🇵 Japanese</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>' +
      '<div class="menu-foot">Press [P] or [Esc] to close</div></div>';
    overlay.classList.add('show');
    overlay.querySelector('[data-close]').onclick = closeMenu;
  }

  function closeMenu() {
    document.getElementById('menu').classList.remove('show');
    state.mode = 'play';
  }

  /* ------------------------------------------------------------------ *
   *  HUD + persistence
   * ------------------------------------------------------------------ */
  function updateHud() {
    document.getElementById('hud-harmony').textContent = state.harmony;
    document.getElementById('hud-caught').textContent =
      state.befriended.size + '/' + KOTOMON.length;
  }

  const SAVE_KEY = 'culture-bridge-save-v1';
  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        befriended: Array.from(state.befriended),
        harmony: state.harmony,
        won: state.won
      }));
    } catch (e) { /* storage may be unavailable; the game still plays */ }
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      (d.befriended || []).forEach(id => state.befriended.add(id));
      state.harmony = d.harmony || 0;
      state.won = !!d.won;
    } catch (e) { /* ignore corrupt save */ }
  }

  /* ------------------------------------------------------------------ *
   *  Helpers
   * ------------------------------------------------------------------ */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  /* ------------------------------------------------------------------ *
   *  Global key handling (routes by mode)
   * ------------------------------------------------------------------ */
  function onKeyDown(e) {
    const k = e.key;
    // Global menu toggles allowed from play
    if (state.mode === 'play') {
      if (k === 'c' || k === 'C') { e.preventDefault(); openDex(); return; }
      if (k === 'p' || k === 'P') { e.preventDefault(); openPhrasebook(); return; }
      if (k === ' ' || k === 'Enter') { e.preventDefault(); interact(); return; }
      // Add to the held set (for continuous walking) and also attempt an
      // immediate step, so a single quick tap always moves exactly one tile.
      let dir = null;
      if (['ArrowUp', 'w', 'W'].includes(k)) dir = 'up';
      else if (['ArrowDown', 's', 'S'].includes(k)) dir = 'down';
      else if (['ArrowLeft', 'a', 'A'].includes(k)) dir = 'left';
      else if (['ArrowRight', 'd', 'D'].includes(k)) dir = 'right';
      if (dir) {
        e.preventDefault();
        state.keys.add(dir);
        if (!state.player.moving) tryMove(dir);
      }
      return;
    }
    if (state.mode === 'dialogue') {
      if (k === ' ' || k === 'Enter') { e.preventDefault(); advanceDialogue(); }
      return;
    }
    if (state.mode === 'quiz') {
      if (!state._quizAnswered && ['1', '2', '3', '4'].includes(k)) {
        e.preventDefault();
        const btns = state._quizChoices.children;
        const idx = parseInt(k, 10) - 1;
        if (btns[idx]) btns[idx].click();
      } else if (state._quizAnswered && (k === ' ' || k === 'Enter')) {
        e.preventDefault();
        const c = document.getElementById('continueBtn');
        if (c) c.click();
      }
      return;
    }
    if (state.mode === 'menu') {
      if (k === 'Escape' || k === 'c' || k === 'C' || k === 'p' || k === 'P') {
        e.preventDefault(); closeMenu();
      }
      return;
    }
  }
  function onKeyUp(e) {
    const k = e.key;
    if (['ArrowUp', 'w', 'W'].includes(k)) state.keys.delete('up');
    else if (['ArrowDown', 's', 'S'].includes(k)) state.keys.delete('down');
    else if (['ArrowLeft', 'a', 'A'].includes(k)) state.keys.delete('left');
    else if (['ArrowRight', 'd', 'D'].includes(k)) state.keys.delete('right');
  }

  // On-screen D-pad + buttons for touch devices
  function wireTouchControls() {
    const bind = (id, dir) => {
      const el = document.getElementById(id);
      if (!el) return;
      const down = e => {
        e.preventDefault();
        if (state.mode === 'play') {
          state.keys.add(dir);
          if (!state.player.moving) tryMove(dir);
        }
      };
      const up = e => { e.preventDefault(); state.keys.delete(dir); };
      el.addEventListener('touchstart', down, { passive: false });
      el.addEventListener('touchend', up, { passive: false });
      el.addEventListener('mousedown', down);
      el.addEventListener('mouseup', up);
      el.addEventListener('mouseleave', up);
    };
    bind('dpad-up', 'up'); bind('dpad-down', 'down');
    bind('dpad-left', 'left'); bind('dpad-right', 'right');
    const a = document.getElementById('btn-a');
    if (a) a.addEventListener('click', () => {
      if (state.mode === 'play') interact();
      else if (state.mode === 'dialogue') advanceDialogue();
    });
    const dex = document.getElementById('btn-dex');
    if (dex) dex.addEventListener('click', () => {
      if (state.mode === 'play') openDex(); else closeMenu();
    });
    const phr = document.getElementById('btn-phrase');
    if (phr) phr.addEventListener('click', () => {
      if (state.mode === 'play') openPhrasebook(); else closeMenu();
    });
  }

  /* ------------------------------------------------------------------ *
   *  Main loop
   * ------------------------------------------------------------------ */
  function loop() {
    const p = state.player;
    if (state.mode === 'play') {
      if (p.moving) {
        if (performance.now() - p.moveStart >= MOVE_MS) {
          p.moving = false;
          afterStep();
        }
      }
      if (!p.moving && state.mode === 'play') {
        // Priority order for simultaneous presses
        const order = ['up', 'down', 'left', 'right'];
        for (const d of order) {
          if (state.keys.has(d)) { tryMove(d); break; }
        }
      }
    }
    render();
    requestAnimationFrame(loop);
  }

  /* ------------------------------------------------------------------ *
   *  Boot
   * ------------------------------------------------------------------ */
  function start() {
    buildWorld();
    state.player = {
      x: 19, y: 16, dir: 'right', moving: false,
      fromX: 19, fromY: 16, moveStart: 0
    };
    load();
    initCanvas();
    updateHud();
    wireTouchControls();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    // Opening tip
    showToast('Walk into the tall grass to meet a Kotomon!  [C] Culturedex   [P] Phrasebook', 5000);
    requestAnimationFrame(loop);
  }

  // Expose a tiny API (used by the title screen "Start" button)
  window.CultureBridge = {
    start,
    reset: function () {
      try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
      state.befriended.clear();
      state.harmony = 0;
      state.won = false;
      updateHud();
      showToast('Progress reset. A fresh journey begins!');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {/* wait for Start */});
  }
})();
