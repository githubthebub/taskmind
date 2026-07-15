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
    PLAZA: 15, SAKURA_TREE: 16, LOTUS: 17, GRASS_US: 18, GRASS_UK: 19
  };

  const SOLID = new Set([
    T.TREE, T.WATER, T.WALL, T.SIGN, T.TEMPLE, T.MOUNTAIN, T.SAKURA_TREE
  ]);

  // Which culture each tall-grass tile belongs to.
  const GRASS_CULTURE = {
    5: 'india', 6: 'japan', 18: 'usa', 19: 'uk'
  };

  const MAP_W = 48, MAP_H = 44;

  // Emoji faces for the Kotomon (drawn on canvas in encounters/dex)
  const KOTO_EMOJI = {
    // India
    garuda: '🦅', naga: '🐍', airavata: '🐘', hamsa: '🦢', makara: '🐊', nandi: '🐂',
    // Japan
    kitsune: '🦊', tanuki: '🦝', kappa: '🐢', tengu: '👺', ryu: '🐉', baku: '🌙',
    // USA
    thunderbird: '🌩️', jackalope: '🐇', sasquatch: '👣', mothman: '🦋', babe: '🐃', groundhog: '🦫',
    // UK
    nessie: '🦕', unicorn: '🦄', welshdragon: '🐲', pixie: '🧚', greenman: '🌿', blackshuck: '🐺'
  };

  // Per-culture display metadata (flags, labels, dex colours).
  const CULTURE_META = {
    india: { flag: '🇮🇳', label: 'Bharat spirit',    where: 'the spice gardens of India' },
    japan: { flag: '🇯🇵', label: 'Nihon spirit',     where: 'the bamboo groves of Japan' },
    usa:   { flag: '🇺🇸', label: 'Columbia spirit',  where: 'the wild frontiers of the USA' },
    uk:    { flag: '🇬🇧', label: 'Britannia spirit', where: 'the misty moors of Britain' }
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
   *  Region map — four cultural arms radiating from a central hub.
   *  West = India, East = Japan, North = UK (London), South = USA.
   * ------------------------------------------------------------------ */
  function regionAt(x, y) {
    if (x >= 20 && x <= 27 && y >= 18 && y <= 25) return 'hub';
    if (x <= 19 && y >= 16 && y <= 27) return 'india';   // west arm
    if (x >= 28 && y >= 16 && y <= 27) return 'japan';   // east arm
    if (y <= 17 && x >= 19 && x <= 28) return 'uk';      // north arm
    if (y >= 26 && x >= 19 && x <= 28) return 'usa';     // south arm
    return 'hub';
  }

  /* ------------------------------------------------------------------ *
   *  World builder — lays out the four regions and the central hub.
   * ------------------------------------------------------------------ */
  function buildWorld() {
    const m = [];
    for (let y = 0; y < MAP_H; y++) m.push(new Array(MAP_W).fill(T.GRASS));
    const set = (x, y, t) => {
      if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) m[y][x] = t;
    };
    const rect = (x0, y0, w, h, t) => {
      for (let y = y0; y < y0 + h; y++)
        for (let x = x0; x < x0 + w; x++) set(x, y, t);
    };

    // Fill the four corner blocks with scenery so the arms stay distinct.
    rect(1, 1, 18, 15, T.TREE);          // top-left
    rect(29, 1, 18, 15, T.TREE);         // top-right
    rect(1, 28, 18, 15, T.TREE);         // bottom-left
    rect(29, 28, 18, 15, T.TREE);        // bottom-right
    // A little variety among the trees.
    rect(2, 2, 5, 3, T.MOUNTAIN);
    rect(41, 2, 5, 3, T.MOUNTAIN);
    rect(3, 37, 4, 4, T.WATER);
    rect(40, 37, 5, 4, T.WATER);

    // Outer border of trees
    for (let x = 0; x < MAP_W; x++) { set(x, 0, T.TREE); set(x, MAP_H - 1, T.TREE); }
    for (let y = 0; y < MAP_H; y++) { set(0, y, T.TREE); set(MAP_W - 1, y, T.TREE); }

    // Central hub plaza.
    rect(20, 18, 8, 8, T.PLAZA);

    // The two great crossroads (over grass and plaza alike).
    for (let x = 1; x < MAP_W - 1; x++) { set(x, 21, T.PATH); set(x, 22, T.PATH); }
    for (let y = 1; y < MAP_H - 1; y++) { set(23, y, T.PATH); set(24, y, T.PATH); }

    // ---------------- BHARAT (India) — west arm ----------------
    rect(3, 18, 3, 3, T.TEMPLE); set(4, 17, T.TEMPLE);        // mandir + tower
    [[7, 18], [8, 18], [8, 17], [6, 25], [7, 26], [12, 25]].forEach(([x, y]) => set(x, y, T.RANGOLI));
    set(5, 24, T.LOTUS); set(6, 24, T.LOTUS); set(5, 25, T.LOTUS);
    rect(9, 17, 5, 3, T.GRASS_IN);
    rect(3, 24, 5, 3, T.GRASS_IN);
    rect(14, 24, 4, 3, T.GRASS_IN);
    [[15, 18], [16, 25], [2, 20]].forEach(([x, y]) => set(x, y, T.TREE));

    // ---------------- NIHON (Japan) — east arm ----------------
    rect(42, 18, 3, 3, T.TEMPLE); set(43, 17, T.TEMPLE);      // pagoda + tower
    set(32, 19, T.TORII); set(32, 20, T.TORII);
    [[35, 18], [44, 24], [30, 25], [45, 20]].forEach(([x, y]) => set(x, y, T.SAKURA_TREE));
    [[35, 19], [30, 26], [44, 25]].forEach(([x, y]) => set(x, y, T.SAKURA_PETAL));
    rect(29, 17, 5, 3, T.GRASS_JP);
    rect(39, 24, 5, 3, T.GRASS_JP);
    rect(30, 24, 4, 3, T.GRASS_JP);

    // ---------------- LONDON (UK) — north arm ----------------
    rect(20, 2, 2, 4, T.TEMPLE);                              // clock tower (Big Ben-ish)
    rect(19, 6, 3, 3, T.GRASS_UK);
    rect(26, 4, 2, 4, T.GRASS_UK);
    rect(20, 12, 3, 3, T.GRASS_UK);
    [[27, 2], [19, 14], [26, 11]].forEach(([x, y]) => set(x, y, T.TREE));

    // ---------------- COLUMBIA (USA) — south arm ----------------
    rect(25, 37, 3, 4, T.TEMPLE);                             // skyscraper
    rect(19, 29, 3, 3, T.GRASS_US);
    rect(26, 30, 2, 4, T.GRASS_US);
    rect(20, 36, 3, 3, T.GRASS_US);
    [[19, 34], [21, 40], [27, 29]].forEach(([x, y]) => set(x, y, T.TREE));

    // --- Signs (walk into and press SPACE) ---
    const signs = {};
    const placeSign = (x, y, key) => { set(x, y, T.SIGN); signs[x + ',' + y] = key; };
    placeSign(26, 19, 'welcome');   // hub
    placeSign(21, 24, 'hub');       // hub
    placeSign(9, 20, 'india');
    placeSign(34, 20, 'japan');
    placeSign(25, 10, 'london');
    placeSign(22, 30, 'usa');
    placeSign(33, 23, 'torii');

    // --- NPCs (one guide per culture + a hub sage) ---
    const npcSpecs = [
      { x: 6, y: 23, key: 'india' },
      { x: 40, y: 23, key: 'japan' },
      { x: 26, y: 13, key: 'uk' },
      { x: 20, y: 33, key: 'usa' },
      { x: 25, y: 23, key: 'hub' }
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
  // Ground tints per region (warm India, cool Japan, temperate UK, prairie USA).
  const GROUND = {
    india: ['#7cb342', '#8bc34a'],
    japan: ['#66bb6a', '#7bc47f'],
    uk:    ['#7fa06d', '#8cae76'],
    usa:   ['#9caf5a', '#aec06a'],
    hub:   ['#83bd77', '#8fc783']
  };

  function drawTile(t, sx, sy, tx, ty) {
    // base ground colour depends on which cultural region the tile sits in
    const region = regionAt(tx, ty);
    const g = GROUND[region] || GROUND.hub;

    // Draw grass under everything first for decorations/solids that sit on land
    ctx.fillStyle = ((tx + ty) % 2 === 0) ? g[0] : g[1];
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
        drawLandmark(sx, sy, region);
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
        drawTallGrass(sx, sy, '#558b2f', '#7cb342'); break;
      case T.GRASS_JP:
        drawTallGrass(sx, sy, '#2e7d32', '#43a047'); break;
      case T.GRASS_US:
        drawTallGrass(sx, sy, '#7d8b2f', '#b7c05a'); break;   // golden prairie
      case T.GRASS_UK:
        drawTallGrass(sx, sy, '#4f7a52', '#7fa06d'); break;   // misty moor
      default:
        break; // plain grass already drawn
    }
  }

  function drawTallGrass(sx, sy, dark, light) {
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

  // Region-specific landmark tile (India mandir, Japan pagoda, UK clock tower, USA tower).
  function drawLandmark(sx, sy, region) {
    if (region === 'uk') {
      // Stone clock tower
      ctx.fillStyle = '#b7a678';
      ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = '#8d7d52';
      ctx.fillRect(sx, sy, TILE, 4);
      circle(sx + TILE / 2, sy + TILE / 2, 7, '#f4f1e0');   // clock face
      ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(sx + TILE / 2, sy + TILE / 2);
      ctx.lineTo(sx + TILE / 2, sy + TILE / 2 - 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx + TILE / 2, sy + TILE / 2);
      ctx.lineTo(sx + TILE / 2 + 4, sy + TILE / 2); ctx.stroke();
    } else if (region === 'usa') {
      // Glass-and-steel skyscraper
      ctx.fillStyle = '#5d6d7e';
      ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = '#aed6f1';
      for (let wy = 4; wy < TILE - 3; wy += 8)
        for (let wx = 4; wx < TILE - 3; wx += 8)
          ctx.fillRect(sx + wx, sy + wy, 5, 5);
    } else {
      // India mandir / Japan pagoda (warm red + gold)
      ctx.fillStyle = region === 'japan' ? '#b71c1c' : '#c0392b';
      ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = region === 'japan' ? '#ffd54f' : '#f1c40f';
      ctx.fillRect(sx + 6, sy + 6, TILE - 12, TILE - 12);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(sx, sy, TILE, 5);
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
      : n.home === 'japan' ? '#8e44ad'
      : n.home === 'uk' ? '#2c3e50'
      : n.home === 'usa' ? '#2980b9' : '#c0392b';
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
    const culture = GRASS_CULTURE[tileAt(p.x, p.y)];
    if (culture && Math.random() < ENCOUNTER_CHANCE) startEncounter(culture);
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
  function pickQuestion(culture) {
    // Prefer a question about this culture (or a cross-culture "link" one),
    // but fall back to the whole pool so answers stay varied.
    const preferred = QUESTIONS.filter(q => q.culture === culture || q.link);
    const pool = (preferred.length && Math.random() < 0.7) ? preferred : QUESTIONS;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function startEncounter(culture) {
    state.mode = 'quiz';
    state.encountersDone++;
    state.activeKotomon = pickKotomon(culture);
    state.activeQuestion = pickQuestion(culture);
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
    const cm = CULTURE_META[k.home] || { flag: '🌏', label: 'Spirit' };
    const meta = document.createElement('div');
    meta.innerHTML =
      '<div class="k-name">A wild <b>' + escapeHtml(k.name) + '</b> appeared!</div>' +
      '<div class="k-title">' + escapeHtml(k.title) + '</div>' +
      '<div class="k-home ' + k.home + '">' + cm.flag + ' ' + escapeHtml(cm.label) +
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
      '🌏 You have befriended all ' + KOTOMON.length + ' Kotomon across four cultures!',
      'From Garuda to the Thunderbird, from the Ryu to Nessie — you have traced the threads ' +
      'that join India, Japan, the USA and Britain.',
      'Master Bodhi smiles: "You could now hold your own in a Tokyo boardroom, a London pub, ' +
      'a Delhi market and a New York pitch. You are a true Culture Bridge Master!"',
      'Keep exploring, or press [C] for your Culturedex, [B] for the Business Guide. ' +
      'Well done — dost / tomodachi / mate / buddy!'
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
          : '<div class="dex-lore muted">Find this spirit in ' +
            escapeHtml((CULTURE_META[k.home] || {}).where || 'the tall grass') + '.</div>') +
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
    const rows = PHRASEBOOK.map(p =>
      '<tr><td class="meaning">' + escapeHtml(p.meaning) + '</td>' +
      '<td class="in">' + escapeHtml(p.india) + '</td>' +
      '<td class="jp">' + escapeHtml(p.japan) + '</td>' +
      '<td class="us">' + escapeHtml(p.usa) + '</td>' +
      '<td class="gb">' + escapeHtml(p.uk) + '</td></tr>'
    ).join('');
    overlay.innerHTML =
      '<div class="menu-panel"><div class="menu-head">' +
      '<h2>🗣️ Phrasebook</h2>' +
      '<span class="count">everyday &amp; business</span>' +
      '<button class="close" data-close="1">✕</button></div>' +
      '<div class="table-scroll"><table class="phrase-table"><thead><tr>' +
      '<th>Meaning</th><th>🇮🇳 India</th><th>🇯🇵 Japan</th>' +
      '<th>🇺🇸 USA</th><th>🇬🇧 UK</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>' +
      '<div class="menu-foot">Press [P] or [Esc] to close</div></div>';
    overlay.classList.add('show');
    overlay.querySelector('[data-close]').onclick = closeMenu;
  }

  function openBusinessGuide() {
    state.mode = 'menu';
    const overlay = document.getElementById('menu');
    const cards = BUSINESS_GUIDE.map(gd =>
      '<div class="biz-card ' + gd.culture + '">' +
      '<div class="biz-head">' + gd.flag + ' ' + escapeHtml(gd.name) + '</div>' +
      gd.tips.map(t =>
        '<div class="biz-tip"><span class="biz-label">' + escapeHtml(t.label) + '</span>' +
        escapeHtml(t.text) + '</div>').join('') +
      '</div>'
    ).join('');
    overlay.innerHTML =
      '<div class="menu-panel"><div class="menu-head">' +
      '<h2>💼 Business Guide</h2>' +
      '<span class="count">meet, greet &amp; negotiate</span>' +
      '<button class="close" data-close="1">✕</button></div>' +
      '<div class="biz-grid">' + cards + '</div>' +
      '<div class="menu-foot">Practical etiquette for deals &amp; daily life · Press [B] or [Esc] to close</div></div>';
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

  const SAVE_KEY = 'culture-bridge-save-v2';
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
      if (k === 'b' || k === 'B') { e.preventDefault(); openBusinessGuide(); return; }
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
      if (k === 'Escape' || k === 'c' || k === 'C' || k === 'p' || k === 'P'
          || k === 'b' || k === 'B') {
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
    const biz = document.getElementById('btn-biz');
    if (biz) biz.addEventListener('click', () => {
      if (state.mode === 'play') openBusinessGuide(); else closeMenu();
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
      x: 23, y: 20, dir: 'down', moving: false,
      fromX: 23, fromY: 20, moveStart: 0
    };
    load();
    initCanvas();
    updateHud();
    wireTouchControls();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    // Opening tip
    showToast('Four roads, four cultures. Walk into the tall grass to meet a Kotomon!  ' +
              '[C] Dex  [P] Phrases  [B] Business', 5200);
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
