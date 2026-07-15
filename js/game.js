/* ============================================================================
 * Culture Bridge — Game Engine
 * ----------------------------------------------------------------------------
 * A top-down travel adventure across four cultures. You explore, meet locals,
 * and choose HOW to act — the locals react like real people would, so you pick
 * up the dos and don'ts by playing. Behave well and folklore "Kindreds"
 * befriend you. Ride your bike on cycle paths, collect a passport of stamps,
 * and fill your Journal of customs.
 *
 * Overworld: <canvas>. Dialogue, scenes and menus: HTML overlays.
 * ==========================================================================*/
(function () {
  'use strict';

  /* ------------------------------- constants ------------------------------ */
  const TILE = 32, VIEW_W = 21, VIEW_H = 15;
  const WALK_MS = 150, BIKE_MS = 78;      // move duration on foot / on bike
  const ENCOUNTER_CHANCE = 0.20;
  const MAP_W = 48, MAP_H = 44;

  const T = {
    GRASS: 0, PATH: 1, TREE: 2, WATER: 3, WALL: 4,
    GRASS_IN: 5, GRASS_JP: 6, SIGN: 7, BIKE: 8, BRIDGE: 9, TORII: 10,
    RANGOLI: 11, SAKURA_PETAL: 12, TEMPLE: 13, MOUNTAIN: 14,
    PLAZA: 15, SAKURA_TREE: 16, LOTUS: 17, GRASS_US: 18, GRASS_UK: 19, FLAG: 20
  };
  const SOLID = new Set([T.TREE, T.WATER, T.WALL, T.SIGN, T.TEMPLE, T.MOUNTAIN, T.SAKURA_TREE]);
  const GRASS_CULTURE = { 5: 'india', 6: 'japan', 18: 'usa', 19: 'uk' };

  const KINDRED_EMOJI = {
    garuda: '🦅', naga: '🐍', airavata: '🐘', hamsa: '🦢', makara: '🐊', nandi: '🐂',
    kitsune: '🦊', tanuki: '🦝', kappa: '🐢', tengu: '👺', ryu: '🐉', baku: '🌙',
    thunderbird: '🌩️', jackalope: '🐇', sasquatch: '👣', mothman: '🦋', babe: '🐃', groundhog: '🦫',
    nessie: '🦕', unicorn: '🦄', welshdragon: '🐲', pixie: '🧚', greenman: '🌿', blackshuck: '🐺'
  };
  const CULTURE_META = {
    india: { flag: '🇮🇳', name: 'India',  place: 'the gardens of India' },
    japan: { flag: '🇯🇵', name: 'Japan',  place: 'the groves of Japan' },
    usa:   { flag: '🇺🇸', name: 'USA',    place: 'the parks of the USA' },
    uk:    { flag: '🇬🇧', name: 'London', place: 'the moors of Britain' }
  };
  const COUNTRIES = ['india', 'japan', 'uk', 'usa'];

  const GROUND = {
    india: ['#7cb342', '#8bc34a'], japan: ['#66bb6a', '#7bc47f'],
    uk: ['#7fa06d', '#8cae76'], usa: ['#9caf5a', '#aec06a'], hub: ['#83bd77', '#8fc783']
  };

  /* --------------------------------- state -------------------------------- */
  const state = {
    mode: 'play',                 // play | dialogue | scene | menu
    map: null, signs: {}, npcs: [],
    player: null, keys: new Set(), camera: { x: 0, y: 0 },
    befriended: new Set(),
    harmony: 0,
    biking: false,
    passport: new Set(),
    rapport: { india: 0, japan: 0, uk: 0, usa: 0 },
    journal: [],                  // [{culture, tip}]
    journalKeys: new Set(),
    currentRegion: 'hub',
    activeScene: null, activeKindred: null, sceneAnswered: false,
    menuView: 'main',
    toast: null, toastUntil: 0,
    won: false
  };

  /* ------------------------------ region map ------------------------------ */
  function regionAt(x, y) {
    if (x >= 20 && x <= 27 && y >= 18 && y <= 25) return 'hub';
    if (x <= 19 && y >= 16 && y <= 27) return 'india';
    if (x >= 28 && y >= 16 && y <= 27) return 'japan';
    if (y <= 17 && x >= 19 && x <= 28) return 'uk';
    if (y >= 26 && x >= 19 && x <= 28) return 'usa';
    return 'hub';
  }

  function buildWorld() {
    const m = [];
    for (let y = 0; y < MAP_H; y++) m.push(new Array(MAP_W).fill(T.GRASS));
    const set = (x, y, t) => { if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) m[y][x] = t; };
    const rect = (x0, y0, w, h, t) => {
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, t);
    };

    // Corner scenery blocks isolate the four arms
    rect(1, 1, 18, 15, T.TREE); rect(29, 1, 18, 15, T.TREE);
    rect(1, 28, 18, 15, T.TREE); rect(29, 28, 18, 15, T.TREE);
    rect(2, 2, 5, 3, T.MOUNTAIN); rect(41, 2, 5, 3, T.MOUNTAIN);
    rect(3, 37, 4, 4, T.WATER); rect(40, 37, 5, 4, T.WATER);
    for (let x = 0; x < MAP_W; x++) { set(x, 0, T.TREE); set(x, MAP_H - 1, T.TREE); }
    for (let y = 0; y < MAP_H; y++) { set(0, y, T.TREE); set(MAP_W - 1, y, T.TREE); }

    rect(20, 18, 8, 8, T.PLAZA);
    for (let x = 1; x < MAP_W - 1; x++) { set(x, 21, T.PATH); set(x, 22, T.PATH); }
    for (let y = 1; y < MAP_H - 1; y++) { set(23, y, T.PATH); set(24, y, T.PATH); }

    // Flags at the four gateways so it's obvious which way each country is
    set(17, 21, T.FLAG); set(30, 21, T.FLAG); set(23, 16, T.FLAG); set(24, 27, T.FLAG);

    // India (west)
    rect(3, 18, 3, 3, T.TEMPLE); set(4, 17, T.TEMPLE);
    [[7, 18], [8, 18], [8, 17], [6, 25], [7, 26], [12, 25]].forEach(([x, y]) => set(x, y, T.RANGOLI));
    set(5, 24, T.LOTUS); set(6, 24, T.LOTUS);
    rect(9, 17, 5, 3, T.GRASS_IN); rect(3, 24, 5, 3, T.GRASS_IN); rect(14, 24, 4, 3, T.GRASS_IN);
    for (let x = 6; x <= 16; x++) set(x, 20, T.BIKE);      // cycle lane
    [[15, 18], [2, 20]].forEach(([x, y]) => set(x, y, T.TREE));

    // Japan (east)
    rect(42, 18, 3, 3, T.TEMPLE); set(43, 17, T.TEMPLE);
    set(32, 19, T.TORII); set(32, 20, T.TORII);
    [[35, 18], [44, 24], [30, 25], [45, 20]].forEach(([x, y]) => set(x, y, T.SAKURA_TREE));
    [[35, 19], [30, 26], [44, 25]].forEach(([x, y]) => set(x, y, T.SAKURA_PETAL));
    rect(29, 17, 5, 3, T.GRASS_JP); rect(39, 24, 5, 3, T.GRASS_JP); rect(30, 24, 4, 3, T.GRASS_JP);
    for (let x = 31; x <= 43; x++) set(x, 23, T.BIKE);

    // London (north)
    rect(20, 2, 2, 4, T.TEMPLE);
    rect(19, 6, 3, 3, T.GRASS_UK); rect(26, 4, 2, 4, T.GRASS_UK); rect(20, 12, 3, 3, T.GRASS_UK);
    for (let y = 4; y <= 14; y++) set(22, y, T.BIKE);
    [[27, 2], [26, 11]].forEach(([x, y]) => set(x, y, T.TREE));

    // USA (south)
    rect(25, 37, 3, 4, T.TEMPLE);
    rect(19, 29, 3, 3, T.GRASS_US); rect(26, 30, 2, 4, T.GRASS_US); rect(20, 36, 3, 3, T.GRASS_US);
    for (let y = 29; y <= 39; y++) set(25, y, T.BIKE);
    [[19, 34], [21, 40]].forEach(([x, y]) => set(x, y, T.TREE));

    const signs = {};
    const sign = (x, y, key) => { set(x, y, T.SIGN); signs[x + ',' + y] = key; };
    sign(26, 19, 'welcome'); sign(21, 24, 'hub');
    sign(9, 20, 'india_border'); sign(6, 19, 'bike');
    sign(34, 20, 'japan_border'); sign(33, 23, 'torii');
    sign(25, 10, 'london_border'); sign(22, 30, 'usa_border');

    const npcSpecs = [
      { x: 6, y: 23, key: 'india' }, { x: 40, y: 22, key: 'japan' },
      { x: 26, y: 13, key: 'uk' }, { x: 20, y: 33, key: 'usa' }, { x: 25, y: 23, key: 'hub' }
    ];
    const npcs = npcSpecs.map(s => {
      const src = NPCS.find(n => n.home === s.key);
      return { x: s.x, y: s.y, name: src.name, home: src.home, lines: src.lines };
    });

    state.map = m; state.signs = signs; state.npcs = npcs;
  }

  function tileAt(x, y) {
    if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return T.TREE;
    return state.map[y][x];
  }
  function isSolid(x, y) {
    if (SOLID.has(tileAt(x, y))) return true;
    return state.npcs.some(n => n.x === x && n.y === y);
  }

  /* -------------------------------- canvas -------------------------------- */
  let canvas, ctx;
  function initCanvas() {
    canvas = document.getElementById('game');
    canvas.width = VIEW_W * TILE; canvas.height = VIEW_H * TILE;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
  }

  /* ------------------------------ rendering ------------------------------- */
  function drawTile(t, sx, sy, tx, ty) {
    const region = regionAt(tx, ty);
    const g = GROUND[region] || GROUND.hub;
    ctx.fillStyle = ((tx + ty) % 2 === 0) ? g[0] : g[1];
    ctx.fillRect(sx, sy, TILE, TILE);

    switch (t) {
      case T.PATH: case T.PLAZA:
        ctx.fillStyle = t === T.PLAZA ? '#d7ccc8' : '#c8a165';
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(sx + 4, sy + 4, 3, 3); ctx.fillRect(sx + 20, sy + 16, 3, 3);
        break;
      case T.BIKE:
        ctx.fillStyle = '#c9d6a3';
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath(); ctx.moveTo(sx + TILE / 2, sy); ctx.lineTo(sx + TILE / 2, sy + TILE); ctx.stroke();
        ctx.setLineDash([]);
        break;
      case T.TREE:
        ctx.fillStyle = '#4e342e'; ctx.fillRect(sx + TILE / 2 - 3, sy + TILE - 10, 6, 10);
        circle(sx + TILE / 2, sy + TILE / 2 - 2, 13, '#2e7d32');
        circle(sx + TILE / 2 - 6, sy + TILE / 2 + 3, 9, '#388e3c');
        circle(sx + TILE / 2 + 6, sy + TILE / 2 + 3, 9, '#43a047');
        break;
      case T.SAKURA_TREE:
        ctx.fillStyle = '#5d4037'; ctx.fillRect(sx + TILE / 2 - 3, sy + TILE - 10, 6, 10);
        circle(sx + TILE / 2, sy + TILE / 2 - 2, 13, '#f8bbd0');
        circle(sx + TILE / 2 - 6, sy + TILE / 2 + 3, 9, '#f48fb1');
        circle(sx + TILE / 2 + 6, sy + TILE / 2 + 3, 9, '#f8bbd0');
        break;
      case T.WATER:
        ctx.fillStyle = '#4fa3d1'; ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(sx + 4, sy + 8, 10, 2); ctx.fillRect(sx + 16, sy + 20, 10, 2);
        break;
      case T.WALL:
        ctx.fillStyle = '#9e9e9e'; ctx.fillRect(sx, sy, TILE, TILE); break;
      case T.TEMPLE:
        drawLandmark(sx, sy, region); break;
      case T.MOUNTAIN:
        tri(sx + TILE / 2, sy + 3, sx + 3, sy + TILE - 3, sx + TILE - 3, sy + TILE - 3, '#8d6e63');
        tri(sx + TILE / 2, sy + 3, sx + TILE / 2 - 6, sy + 13, sx + TILE / 2 + 6, sy + 13, '#efebe9');
        break;
      case T.TORII:
        ctx.fillStyle = '#e53935';
        ctx.fillRect(sx + 3, sy, 4, TILE); ctx.fillRect(sx + TILE - 7, sy, 4, TILE);
        ctx.fillRect(sx, sy + 3, TILE, 5); ctx.fillRect(sx + 2, sy + 11, TILE - 4, 4);
        break;
      case T.RANGOLI: drawRangoli(sx, sy); break;
      case T.LOTUS:
        circle(sx + TILE / 2, sy + TILE / 2, 10, '#4fa3d1');
        circle(sx + TILE / 2, sy + TILE / 2, 5, '#f06292'); break;
      case T.SAKURA_PETAL:
        [[8, 10], [18, 14], [12, 22], [22, 20]].forEach(([dx, dy]) => circle(sx + dx, sy + dy, 2.5, '#f8bbd0'));
        break;
      case T.SIGN:
        ctx.fillStyle = '#6d4c41'; ctx.fillRect(sx + TILE / 2 - 2, sy + 14, 4, 14);
        ctx.fillStyle = '#a1887f'; ctx.fillRect(sx + 5, sy + 4, TILE - 10, 13);
        ctx.fillStyle = '#4e342e';
        ctx.fillRect(sx + 7, sy + 7, TILE - 14, 2); ctx.fillRect(sx + 7, sy + 11, TILE - 18, 2);
        break;
      case T.FLAG:
        ctx.fillStyle = '#7d6b55'; ctx.fillRect(sx + 6, sy + 4, 3, TILE - 6);
        ctx.font = '17px serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText((CULTURE_META[flagRegion(tx, ty)] || { flag: '🌏' }).flag, sx + 9, sy + 11);
        break;
      case T.GRASS_IN: drawTallGrass(sx, sy, '#558b2f', '#7cb342'); break;
      case T.GRASS_JP: drawTallGrass(sx, sy, '#2e7d32', '#43a047'); break;
      case T.GRASS_US: drawTallGrass(sx, sy, '#7d8b2f', '#b7c05a'); break;
      case T.GRASS_UK: drawTallGrass(sx, sy, '#4f7a52', '#7fa06d'); break;
      default: break;
    }
  }

  // The gateway flags sit just outside their country, so point them the right way.
  function flagRegion(x, y) {
    if (x < 20) return 'india';
    if (x > 27) return 'japan';
    if (y < 18) return 'uk';
    return 'usa';
  }

  function drawTallGrass(sx, sy, dark, light) {
    ctx.fillStyle = dark; ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = light;
    for (let bx = 3; bx < TILE; bx += 7) for (let by = 6; by < TILE; by += 9) {
      ctx.beginPath(); ctx.moveTo(sx + bx, sy + by + 6);
      ctx.lineTo(sx + bx - 2, sy + by); ctx.lineTo(sx + bx + 2, sy + by);
      ctx.closePath(); ctx.fill();
    }
  }
  function drawLandmark(sx, sy, region) {
    if (region === 'uk') {
      ctx.fillStyle = '#b7a678'; ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = '#8d7d52'; ctx.fillRect(sx, sy, TILE, 4);
      circle(sx + TILE / 2, sy + TILE / 2, 7, '#f4f1e0');
      ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(sx + TILE / 2, sy + TILE / 2); ctx.lineTo(sx + TILE / 2, sy + TILE / 2 - 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx + TILE / 2, sy + TILE / 2); ctx.lineTo(sx + TILE / 2 + 4, sy + TILE / 2); ctx.stroke();
    } else if (region === 'usa') {
      ctx.fillStyle = '#5d6d7e'; ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = '#aed6f1';
      for (let wy = 4; wy < TILE - 3; wy += 8) for (let wx = 4; wx < TILE - 3; wx += 8) ctx.fillRect(sx + wx, sy + wy, 5, 5);
    } else {
      ctx.fillStyle = region === 'japan' ? '#b71c1c' : '#c0392b'; ctx.fillRect(sx, sy, TILE, TILE);
      ctx.fillStyle = region === 'japan' ? '#ffd54f' : '#f1c40f'; ctx.fillRect(sx + 6, sy + 6, TILE - 12, TILE - 12);
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(sx, sy, TILE, 5);
    }
  }
  function drawRangoli(sx, sy) {
    const cx = sx + TILE / 2, cy = sy + TILE / 2;
    const cols = ['#e74c3c', '#f1c40f', '#e67e22', '#8e44ad', '#16a085'];
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI / 4) * i;
      circle(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8, 3, cols[i % cols.length]);
    }
    circle(cx, cy, 3.5, '#fff');
  }
  function circle(x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  function tri(ax, ay, bx, by, cx2, cy2, color) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx2, cy2); ctx.closePath(); ctx.fill();
  }

  function drawPlayer(sx, sy) {
    const p = state.player;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(sx + TILE / 2, sy + TILE - 4, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
    if (state.biking) {
      circle(sx + 9, sy + TILE - 6, 5, '#212121'); circle(sx + 23, sy + TILE - 6, 5, '#212121');
      circle(sx + 9, sy + TILE - 6, 2, '#9e9e9e'); circle(sx + 23, sy + TILE - 6, 2, '#9e9e9e');
      ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx + 9, sy + TILE - 6); ctx.lineTo(sx + 16, sy + 16);
      ctx.lineTo(sx + 23, sy + TILE - 6); ctx.stroke();
    }
    ctx.fillStyle = '#3949ab'; ctx.fillRect(sx + 9, sy + 12, 14, 13);
    circle(sx + TILE / 2, sy + 9, 8, '#f5cba7');
    ctx.fillStyle = '#3e2723'; ctx.fillRect(sx + 8, sy + 2, 16, 6);
    ctx.fillStyle = '#e74c3c';
    if (p.dir === 'down') ctx.fillRect(sx + 12, sy + 18, 8, 5);
    else if (p.dir === 'up') ctx.fillRect(sx + 12, sy + 11, 8, 4);
    else if (p.dir === 'left') ctx.fillRect(sx + 8, sy + 14, 5, 8);
    else ctx.fillRect(sx + 19, sy + 14, 5, 8);
  }
  function drawNPC(n, sx, sy) {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(sx + TILE / 2, sy + TILE - 4, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
    const robe = n.home === 'india' ? '#e67e22' : n.home === 'japan' ? '#8e44ad'
      : n.home === 'uk' ? '#2c3e50' : n.home === 'usa' ? '#2980b9' : '#c0392b';
    ctx.fillStyle = robe; ctx.fillRect(sx + 8, sy + 13, 16, 14);
    circle(sx + TILE / 2, sy + 10, 8, '#f5cba7');
    ctx.fillStyle = '#212121'; ctx.fillRect(sx + 9, sy + 3, 14, 6);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('💬', sx + TILE / 2, sy - 1);
  }

  function render() {
    const p = state.player;
    let px = p.x, py = p.y;
    if (p.moving) {
      const tt = Math.min(1, (performance.now() - p.moveStart) / p.moveDur);
      px = p.fromX + (p.x - p.fromX) * tt; py = p.fromY + (p.y - p.fromY) * tt;
    }
    let camX = px - Math.floor(VIEW_W / 2), camY = py - Math.floor(VIEW_H / 2);
    camX = Math.max(0, Math.min(camX, MAP_W - VIEW_W));
    camY = Math.max(0, Math.min(camY, MAP_H - VIEW_H));

    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const startX = Math.floor(camX), startY = Math.floor(camY);
    const offX = (camX - startX) * TILE, offY = (camY - startY) * TILE;
    for (let vy = -1; vy <= VIEW_H + 1; vy++) for (let vx = -1; vx <= VIEW_W + 1; vx++) {
      const tx = startX + vx, ty = startY + vy;
      if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) continue;
      drawTile(state.map[ty][tx], vx * TILE - offX, vy * TILE - offY, tx, ty);
    }
    state.npcs.forEach(n => {
      const sx = (n.x - camX) * TILE, sy = (n.y - camY) * TILE;
      if (sx > -TILE && sx < canvas.width && sy > -TILE && sy < canvas.height) drawNPC(n, sx, sy);
    });
    drawPlayer((px - camX) * TILE, (py - camY) * TILE);

    if (state.toast && performance.now() < state.toastUntil) {
      ctx.fillStyle = 'rgba(0,0,0,0.78)'; ctx.fillRect(0, canvas.height - 34, canvas.width, 34);
      ctx.fillStyle = '#fff'; ctx.font = '14px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(state.toast, canvas.width / 2, canvas.height - 12);
    }
  }
  function showToast(msg, ms) { state.toast = msg; state.toastUntil = performance.now() + (ms || 2600); }

  /* ------------------------------ movement -------------------------------- */
  function moveDur() { return state.biking ? BIKE_MS : WALK_MS; }

  function tryMove(dir) {
    const p = state.player;
    if (p.moving) return;
    p.dir = dir;
    let nx = p.x, ny = p.y;
    if (dir === 'up') ny--; else if (dir === 'down') ny++;
    else if (dir === 'left') nx--; else nx++;
    if (isSolid(nx, ny)) return;
    p.fromX = p.x; p.fromY = p.y; p.x = nx; p.y = ny;
    p.moving = true; p.moveStart = performance.now(); p.moveDur = moveDur();
  }

  function afterStep() {
    const p = state.player;
    // Passport stamp on first entry to a country
    const region = regionAt(p.x, p.y);
    if (region !== state.currentRegion) {
      state.currentRegion = region;
      if (COUNTRIES.indexOf(region) >= 0 && !state.passport.has(region)) {
        state.passport.add(region);
        state.rapport[region] = Math.min(100, state.rapport[region] + 5);
        showToast('🛂 Passport stamped: ' + CULTURE_META[region].flag + ' ' + CULTURE_META[region].name + '!', 2800);
        save();
      }
    }
    const culture = GRASS_CULTURE[tileAt(p.x, p.y)];
    if (culture && Math.random() < ENCOUNTER_CHANCE) startScene(culture);
  }

  function toggleBike() {
    const on = tileAt(state.player.x, state.player.y) === T.BIKE;
    if (!state.biking) {
      if (!on) { showToast('You can only hop on your bike on a 🚲 cycle path!'); return; }
      state.biking = true; showToast('🚲 Hopped on your bike! Zoom around. (S to hop off)');
    } else {
      state.biking = false; showToast('🚶 Hopped off your bike.');
    }
  }

  function facingTile() {
    const p = state.player; let x = p.x, y = p.y;
    if (p.dir === 'up') y--; else if (p.dir === 'down') y++;
    else if (p.dir === 'left') x--; else x++;
    return { x, y };
  }
  function interact() {
    const f = facingTile();
    const key = state.signs[f.x + ',' + f.y];
    if (key && SIGN_TEXTS[key]) { openDialogue([SIGN_TEXTS[key]], null); return; }
    const npc = state.npcs.find(n => n.x === f.x && n.y === f.y);
    if (npc) { openDialogue(npc.lines, npc.name); return; }
  }

  /* ------------------------------ dialogue -------------------------------- */
  let dlgLines = [], dlgIdx = 0, dlgSpeaker = null;
  function openDialogue(lines, speaker) {
    dlgLines = lines; dlgIdx = 0; dlgSpeaker = speaker; state.mode = 'dialogue'; renderDialogue();
  }
  function renderDialogue() {
    const box = document.getElementById('dialogue');
    box.innerHTML = (dlgSpeaker ? '<div class="speaker">' + escapeHtml(dlgSpeaker) + '</div>' : '') +
      '<p>' + escapeHtml(dlgLines[dlgIdx]) + '</p><div class="hint">▶ Space / click to continue</div>';
    box.classList.add('show');
  }
  function advanceDialogue() {
    dlgIdx++;
    if (dlgIdx >= dlgLines.length) { document.getElementById('dialogue').classList.remove('show'); state.mode = 'play'; }
    else renderDialogue();
  }

  /* ------------------------- scenes (the core loop) ----------------------- */
  function kindredSprite(k, size) {
    const c = document.createElement('canvas'); c.width = size; c.height = size;
    const g = c.getContext('2d');
    g.fillStyle = k.palette.detail; roundRect(g, 2, 2, size - 4, size - 4, 14); g.fill();
    g.fillStyle = k.palette.body; roundRect(g, 6, 6, size - 12, size - 12, 12); g.fill();
    g.font = Math.floor(size * 0.5) + 'px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(KINDRED_EMOJI[k.id] || '✨', size / 2, size / 2 + 2);
    return c;
  }
  function pickKindred(culture) {
    const pool = KINDREDS.filter(k => k.home === culture);
    const fresh = pool.filter(k => !state.befriended.has(k.id));
    const arr = fresh.length ? fresh : pool;
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function pickScene(culture) {
    const arr = SCENES[culture];
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function startScene(culture) {
    state.mode = 'scene';
    state.activeKindred = pickKindred(culture);
    state.activeScene = pickScene(culture);
    state.sceneAnswered = false;
    renderScene();
  }

  function renderScene() {
    const k = state.activeKindred, sc = state.activeScene;
    const cm = CULTURE_META[k.home];
    const overlay = document.getElementById('quiz');
    overlay.innerHTML = '';
    const panel = document.createElement('div'); panel.className = 'quiz-panel';

    const head = document.createElement('div'); head.className = 'quiz-creature';
    const sprite = kindredSprite(k, 92); sprite.className = 'sprite'; head.appendChild(sprite);
    const meta = document.createElement('div');
    meta.innerHTML = '<div class="k-name">A curious <b>' + escapeHtml(k.name) + '</b> is watching…</div>' +
      '<div class="k-title">' + cm.flag + ' ' + escapeHtml(cm.name) + ' · ' + escapeHtml(k.title) + '</div>' +
      '<div class="k-home ' + k.home + '">Behave well and it may befriend you!</div>';
    head.appendChild(meta); panel.appendChild(head);

    const setup = document.createElement('div'); setup.className = 'scene-setup';
    setup.textContent = sc.setup; panel.appendChild(setup);
    const prompt = document.createElement('div'); prompt.className = 'quiz-q';
    prompt.innerHTML = '<span class="topic">' + cm.flag + ' What do you do?</span>' + escapeHtml(sc.prompt);
    panel.appendChild(prompt);

    const list = document.createElement('div'); list.className = 'quiz-choices';
    // shuffle actions so the "good" one isn't always first
    const acts = sc.actions.map((a, i) => ({ a, i }));
    for (let i = acts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [acts[i], acts[j]] = [acts[j], acts[i]]; }
    acts.forEach((entry, idx) => {
      const btn = document.createElement('button'); btn.className = 'choice';
      btn.innerHTML = '<span class="num">' + (idx + 1) + '</span>' + escapeHtml(entry.a.text);
      btn.onclick = () => chooseAction(entry.a, btn, list);
      list.appendChild(btn);
    });
    panel.appendChild(list);
    const foot = document.createElement('div'); foot.className = 'quiz-foot';
    foot.textContent = 'Press 1–' + acts.length + ' or click';
    panel.appendChild(foot);

    overlay.appendChild(panel); overlay.classList.add('show');
    state._sceneList = list;
  }

  function logTip(culture, tip) {
    if (state.journalKeys.has(tip)) return;
    state.journalKeys.add(tip); state.journal.push({ culture, tip });
  }

  function chooseAction(a, btn, list) {
    if (state.sceneAnswered) return;
    state.sceneAnswered = true;
    const k = state.activeKindred, sc = state.activeScene;
    Array.from(list.children).forEach(b => { b.disabled = true; });
    btn.classList.add(a.good ? 'right' : 'wrong');

    let newFriend = false;
    if (a.good) {
      state.harmony += 10;
      state.rapport[k.home] = Math.min(100, state.rapport[k.home] + 12);
      if (!state.befriended.has(k.id)) { state.befriended.add(k.id); newFriend = true; state.harmony += 5; }
    } else {
      state.harmony += 2;
      state.rapport[k.home] = Math.min(100, state.rapport[k.home] + 3);
    }
    logTip(k.home, a.tip);
    save();

    const result = document.createElement('div');
    result.className = 'quiz-result ' + (a.good ? 'ok' : 'no');
    let head = a.good
      ? (newFriend ? '🎉 ' + k.name + ' is charmed and befriends you!' : '✅ Nicely handled! ' + k.name + ' nods along.')
      : '😅 A little awkward… ' + k.name + ' watches you learn.';
    result.innerHTML =
      '<div class="r-head">' + escapeHtml(head) + '</div>' +
      '<div class="r-explain">' + escapeHtml(a.reaction) + '</div>' +
      '<div class="r-bridge"><b>📖 Journal:</b> ' + escapeHtml(a.tip) + '</div>' +
      '<div class="r-points">+' + (a.good ? (newFriend ? 15 : 10) : 2) + ' Harmony</div>' +
      '<button class="continue" id="continueBtn">Continue ▶</button>';
    document.querySelector('.quiz-panel').appendChild(result);
    result.scrollIntoView({ behavior: 'smooth', block: 'end' });
    document.getElementById('continueBtn').onclick = closeScene;
  }

  function closeScene() {
    document.getElementById('quiz').classList.remove('show');
    state.mode = 'play'; updateHud();
    if (!state.won && state.befriended.size === KINDREDS.length) {
      state.won = true; save(); setTimeout(showVictory, 350);
    }
  }
  function showVictory() {
    openDialogue([
      '🌏 You have befriended all ' + KINDREDS.length + ' Kindreds across four cultures!',
      'You bowed in Tokyo, queued in London, shared chai in Delhi and tipped well in New York — ' +
      'and the locals loved you for it.',
      'Senzo beams: "You could stroll into any country on Earth and feel at home. You are a true ' +
      'Culture Bridge Master!"',
      'Keep exploring, or open the Menu (F) to admire your Friends, Passport and Journal.'
    ], 'You did it!');
  }

  /* --------------------------------- menu --------------------------------- */
  function openMenu() { state.mode = 'menu'; state.menuView = 'main'; renderMenu(); }
  function closeMenu() { document.getElementById('menu').classList.remove('show'); state.mode = 'play'; }
  function setMenuView(v) { state.menuView = v; renderMenu(); }

  function renderMenu() {
    const overlay = document.getElementById('menu');
    let body = '';
    if (state.menuView === 'main') body = menuMain();
    else if (state.menuView === 'friends') body = menuFriends();
    else if (state.menuView === 'passport') body = menuPassport();
    else if (state.menuView === 'journal') body = menuJournal();
    else if (state.menuView === 'phrase') body = menuPhrase();
    else if (state.menuView === 'business') body = menuBusiness();
    overlay.innerHTML = '<div class="menu-panel">' + body + '</div>';
    overlay.classList.add('show');
    const back = overlay.querySelector('[data-back]'); if (back) back.onclick = () => setMenuView('main');
    const close = overlay.querySelector('[data-close]'); if (close) close.onclick = closeMenu;
    overlay.querySelectorAll('[data-view]').forEach(el => { el.onclick = () => setMenuView(el.getAttribute('data-view')); });
  }
  function menuHead(title, count) {
    return '<div class="menu-head">' +
      (state.menuView === 'main' ? '' : '<button class="menu-back" data-back>‹ Back</button>') +
      '<h2>' + title + '</h2>' + (count ? '<span class="count">' + count + '</span>' : '') +
      '<button class="close" data-close>✕</button></div>';
  }
  function menuMain() {
    const items = [
      { v: 'friends', icon: '🧑‍🤝‍🧑', label: 'Friends', sub: state.befriended.size + ' / ' + KINDREDS.length + ' Kindreds befriended' },
      { v: 'passport', icon: '🛂', label: 'Passport', sub: state.passport.size + ' / 4 countries visited' },
      { v: 'journal', icon: '📖', label: 'Journal', sub: state.journal.length + ' customs learned' },
      { v: 'phrase', icon: '🗣️', label: 'Phrasebook', sub: 'everyday & business phrases' },
      { v: 'business', icon: '💼', label: 'Business Guide', sub: 'deal-making etiquette' }
    ];
    return menuHead('☰ Menu') + '<div class="menu-list">' +
      items.map((it, i) => '<button class="menu-item" data-view="' + it.v + '">' +
        '<span class="mi-icon">' + it.icon + '</span>' +
        '<span class="mi-text"><b>' + it.label + '</b><span>' + it.sub + '</span></span>' +
        '<span class="mi-key">' + (i + 1) + '</span></button>').join('') +
      '</div><div class="menu-foot">Move W/A/D + arrows · Talk Space · Bike S · Close menu F / Esc</div>';
  }
  function menuFriends() {
    let cards = '';
    KINDREDS.forEach(k => {
      const got = state.befriended.has(k.id);
      cards += '<div class="dex-card ' + (got ? 'got ' : 'unknown ') + k.home + '">' +
        '<div class="dex-emoji">' + (got ? (KINDRED_EMOJI[k.id] || '✨') : '❓') + '</div>' +
        '<div class="dex-name">' + (got ? escapeHtml(k.name) : '???') + '</div>' +
        (got ? '<div class="dex-title">' + escapeHtml(k.title) + '</div><div class="dex-lore">' + escapeHtml(k.lore) + '</div>'
          : '<div class="dex-lore muted">Behave well in ' + escapeHtml(CULTURE_META[k.home].place) + ' to befriend.</div>') +
        '</div>';
    });
    return menuHead('🧑‍🤝‍🧑 Friends', state.befriended.size + ' / ' + KINDREDS.length) +
      '<div class="dex-grid">' + cards + '</div>';
  }
  function menuPassport() {
    let rows = COUNTRIES.map(c => {
      const cm = CULTURE_META[c], visited = state.passport.has(c), r = state.rapport[c];
      return '<div class="pp-row">' +
        '<div class="pp-flag ' + (visited ? '' : 'faded') + '">' + cm.flag + '</div>' +
        '<div class="pp-info"><b>' + escapeHtml(cm.name) + '</b>' +
        '<span class="pp-stamp">' + (visited ? '✔ visited' : 'not yet visited') + '</span>' +
        '<div class="pp-bar"><i style="width:' + r + '%"></i></div>' +
        '<span class="pp-rap">Rapport ' + r + '%</span></div></div>';
    }).join('');
    return menuHead('🛂 Passport', state.passport.size + ' / 4') + '<div class="pp-list">' + rows +
      '</div><div class="menu-foot">Walk into a country to stamp it. Treat locals well to raise your rapport.</div>';
  }
  function menuJournal() {
    if (!state.journal.length) {
      return menuHead('📖 Journal') + '<div class="journal-empty">Your Journal is empty. Explore, meet the ' +
        'locals, and the customs you discover will be noted here automatically.</div>';
    }
    let by = {};
    state.journal.forEach(e => { (by[e.culture] = by[e.culture] || []).push(e.tip); });
    let html = '';
    COUNTRIES.forEach(c => {
      if (!by[c]) return;
      html += '<div class="jr-group"><div class="jr-head ' + c + '">' + CULTURE_META[c].flag + ' ' +
        escapeHtml(CULTURE_META[c].name) + '</div>' +
        by[c].map(t => '<div class="jr-tip">• ' + escapeHtml(t) + '</div>').join('') + '</div>';
    });
    return menuHead('📖 Journal', state.journal.length + ' learned') + '<div class="jr-list">' + html + '</div>';
  }
  function menuPhrase() {
    const rows = PHRASEBOOK.map(p =>
      '<tr><td class="meaning">' + escapeHtml(p.meaning) + '</td>' +
      '<td class="in">' + escapeHtml(p.india) + '</td><td class="jp">' + escapeHtml(p.japan) + '</td>' +
      '<td class="us">' + escapeHtml(p.usa) + '</td><td class="gb">' + escapeHtml(p.uk) + '</td></tr>').join('');
    return menuHead('🗣️ Phrasebook') +
      '<div class="table-scroll"><table class="phrase-table"><thead><tr><th>Meaning</th>' +
      '<th>🇮🇳 India</th><th>🇯🇵 Japan</th><th>🇺🇸 USA</th><th>🇬🇧 UK</th></tr></thead><tbody>' +
      rows + '</tbody></table></div>';
  }
  function menuBusiness() {
    const cards = BUSINESS_GUIDE.map(gd => '<div class="biz-card ' + gd.culture + '">' +
      '<div class="biz-head">' + gd.flag + ' ' + escapeHtml(gd.name) + '</div>' +
      gd.tips.map(t => '<div class="biz-tip"><span class="biz-label">' + escapeHtml(t.label) + '</span>' +
        escapeHtml(t.text) + '</div>').join('') + '</div>').join('');
    return menuHead('💼 Business Guide') + '<div class="biz-grid">' + cards + '</div>';
  }

  /* ------------------------------ HUD + save ------------------------------ */
  function updateHud() {
    document.getElementById('hud-harmony').textContent = state.harmony;
    document.getElementById('hud-caught').textContent = state.befriended.size + '/' + KINDREDS.length;
  }
  const SAVE_KEY = 'culture-bridge-save-v3';
  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        befriended: Array.from(state.befriended), harmony: state.harmony,
        passport: Array.from(state.passport), rapport: state.rapport,
        journal: state.journal, won: state.won
      }));
    } catch (e) {}
  }
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (!d) return;
      (d.befriended || []).forEach(id => state.befriended.add(id));
      state.harmony = d.harmony || 0; state.won = !!d.won;
      (d.passport || []).forEach(c => state.passport.add(c));
      if (d.rapport) Object.assign(state.rapport, d.rapport);
      (d.journal || []).forEach(e => { state.journal.push(e); state.journalKeys.add(e.tip); });
    } catch (e) {}
  }

  /* ------------------------------- helpers -------------------------------- */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function roundRect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  /* --------------------------------- input -------------------------------- */
  function onKeyDown(e) {
    const k = e.key;
    if (state.mode === 'play') {
      if (k === 'f' || k === 'F' || k === 'Enter') { e.preventDefault(); openMenu(); return; }
      if (k === ' ') { e.preventDefault(); interact(); return; }
      if (k === 's' || k === 'S') { e.preventDefault(); toggleBike(); return; }
      // quick-jump menu shortcuts
      if (k === 'c' || k === 'C') { e.preventDefault(); openMenu(); setMenuView('friends'); return; }
      if (k === 'p' || k === 'P') { e.preventDefault(); openMenu(); setMenuView('phrase'); return; }
      if (k === 'b' || k === 'B') { e.preventDefault(); openMenu(); setMenuView('business'); return; }
      if (k === 'j' || k === 'J') { e.preventDefault(); openMenu(); setMenuView('journal'); return; }
      let dir = null;
      if (['ArrowUp', 'w', 'W'].includes(k)) dir = 'up';
      else if (k === 'ArrowDown') dir = 'down';
      else if (['ArrowLeft', 'a', 'A'].includes(k)) dir = 'left';
      else if (['ArrowRight', 'd', 'D'].includes(k)) dir = 'right';
      if (dir) { e.preventDefault(); state.keys.add(dir); if (!state.player.moving) tryMove(dir); }
      return;
    }
    if (state.mode === 'dialogue') {
      if (k === ' ' || k === 'Enter') { e.preventDefault(); advanceDialogue(); }
      return;
    }
    if (state.mode === 'scene') {
      if (!state.sceneAnswered && /^[1-9]$/.test(k)) {
        const btns = state._sceneList.children; const idx = parseInt(k, 10) - 1;
        if (btns[idx]) { e.preventDefault(); btns[idx].click(); }
      } else if (state.sceneAnswered && (k === ' ' || k === 'Enter')) {
        e.preventDefault(); const c = document.getElementById('continueBtn'); if (c) c.click();
      }
      return;
    }
    if (state.mode === 'menu') {
      if (k === 'Escape') { e.preventDefault(); closeMenu(); return; }
      if (k === 'f' || k === 'F') { e.preventDefault(); if (state.menuView === 'main') closeMenu(); else setMenuView('main'); return; }
      if (state.menuView === 'main' && /^[1-5]$/.test(k)) {
        const views = ['friends', 'passport', 'journal', 'phrase', 'business'];
        e.preventDefault(); setMenuView(views[parseInt(k, 10) - 1]); return;
      }
      if (state.menuView !== 'main' && (k === 'Backspace')) { e.preventDefault(); setMenuView('main'); }
      return;
    }
  }
  function onKeyUp(e) {
    const k = e.key;
    if (['ArrowUp', 'w', 'W'].includes(k)) state.keys.delete('up');
    else if (k === 'ArrowDown') state.keys.delete('down');
    else if (['ArrowLeft', 'a', 'A'].includes(k)) state.keys.delete('left');
    else if (['ArrowRight', 'd', 'D'].includes(k)) state.keys.delete('right');
  }

  function wireTouch() {
    const bind = (id, dir) => {
      const el = document.getElementById(id); if (!el) return;
      const down = e => { e.preventDefault(); if (state.mode === 'play') { state.keys.add(dir); if (!state.player.moving) tryMove(dir); } };
      const up = e => { e.preventDefault(); state.keys.delete(dir); };
      el.addEventListener('touchstart', down, { passive: false });
      el.addEventListener('touchend', up, { passive: false });
      el.addEventListener('mousedown', down); el.addEventListener('mouseup', up); el.addEventListener('mouseleave', up);
    };
    bind('dpad-up', 'up'); bind('dpad-down', 'down'); bind('dpad-left', 'left'); bind('dpad-right', 'right');
    const talk = document.getElementById('btn-a');
    if (talk) talk.addEventListener('click', () => {
      if (state.mode === 'play') interact();
      else if (state.mode === 'dialogue') advanceDialogue();
      else if (state.mode === 'scene' && state.sceneAnswered) { const c = document.getElementById('continueBtn'); if (c) c.click(); }
    });
    const menuBtn = document.getElementById('btn-menu');
    if (menuBtn) menuBtn.addEventListener('click', () => { if (state.mode === 'play') openMenu(); else if (state.mode === 'menu') closeMenu(); });
    const bikeBtn = document.getElementById('btn-bike');
    if (bikeBtn) bikeBtn.addEventListener('click', () => { if (state.mode === 'play') toggleBike(); });
  }

  /* --------------------------------- loop --------------------------------- */
  function loop() {
    const p = state.player;
    if (state.mode === 'play') {
      if (p.moving && performance.now() - p.moveStart >= p.moveDur) { p.moving = false; afterStep(); }
      if (!p.moving && state.mode === 'play') {
        for (const d of ['up', 'down', 'left', 'right']) if (state.keys.has(d)) { tryMove(d); break; }
      }
    }
    render();
    requestAnimationFrame(loop);
  }

  /* --------------------------------- boot --------------------------------- */
  function start() {
    buildWorld();
    state.player = { x: 23, y: 20, dir: 'down', moving: false, fromX: 23, fromY: 20, moveStart: 0, moveDur: WALK_MS };
    state.currentRegion = regionAt(23, 20);
    load(); initCanvas(); updateHud(); wireTouch();
    window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp);
    showToast('Explore four countries! Meet locals, act well, befriend Kindreds. F = menu · S = bike', 5600);
    requestAnimationFrame(loop);
  }

  window.CultureBridge = {
    start,
    reset: function () {
      try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
      state.befriended.clear(); state.harmony = 0; state.won = false;
      state.passport.clear(); state.rapport = { india: 0, japan: 0, uk: 0, usa: 0 };
      state.journal = []; state.journalKeys.clear();
      updateHud(); showToast('Progress reset. A fresh journey begins!');
    }
  };
})();
