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

  /* ------------------------------- audio ---------------------------------- *
   * Everything is synthesised with the Web Audio API — no sound files, so the
   * game stays a single self-contained page. Gentle, culture-flavoured ambient
   * notes play in the background; short SFX punctuate the action.
   * ------------------------------------------------------------------------ */
  const SCALES = {
    india: [261.6, 293.7, 349.2, 392.0, 466.2, 523.3],   // raga-ish
    japan: [261.6, 311.1, 349.2, 392.0, 466.2, 523.3],   // hirajoshi-ish
    usa:   [261.6, 329.6, 392.0, 440.0, 523.3, 659.3],   // bright major pentatonic
    uk:    [246.9, 293.7, 329.6, 392.0, 440.0, 493.9],   // wistful
    hub:   [261.6, 329.6, 392.0, 493.9, 587.3]
  };
  const Sound = {
    ctx: null, master: null, muted: false, region: 'hub', _amb: null, _step: 0,
    init() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.55;
        this.master.connect(this.ctx.destination);
        this.startAmbient();
      } catch (e) { this.ctx = null; }
    },
    setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.55; },
    tone(freq, dur, type, gain, delay) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime + (delay || 0);
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gain || 0.18, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.03);
    },
    arp(freqs, step, type, gain) { freqs.forEach((f, i) => this.tone(f, step * 2.1, type, gain, i * step)); },
    select() { this.tone(660, 0.05, 'square', 0.06); },
    menu() { this.tone(440, 0.05, 'square', 0.07); this.tone(587, 0.06, 'square', 0.06, 0.04); },
    good() { this.arp([523, 659, 784, 1047], 0.075, 'triangle', 0.16); },
    friend() { this.arp([523, 659, 784, 1047, 1319], 0.08, 'triangle', 0.18); },
    bad() { this.tone(196, 0.18, 'sawtooth', 0.08); this.tone(165, 0.22, 'sawtooth', 0.07, 0.04); },
    dispel() { this.arp([392, 523, 659, 880, 1175], 0.055, 'sine', 0.14); },
    lantern() { this.arp([392, 494, 587, 784, 988, 1175, 1568], 0.11, 'triangle', 0.2); },
    stamp() { this.tone(320, 0.05, 'square', 0.1); this.tone(640, 0.08, 'square', 0.1, 0.05); },
    bike() { this.tone(300, 0.07, 'triangle', 0.08); this.tone(450, 0.09, 'triangle', 0.08, 0.05); },
    victory() { this.arp([523, 659, 784, 1047, 784, 1047, 1319, 1568], 0.13, 'triangle', 0.22); },
    startAmbient() {
      const tick = () => {
        this._amb = setTimeout(tick, 1350 + Math.random() * 900);
        if (!this.ctx || this.muted || state.mode !== 'play') return;
        const sc = SCALES[this.region] || SCALES.hub;
        const n = sc[Math.floor(Math.random() * sc.length)];
        this.tone(n, 1.8, 'sine', 0.05);
        if (this._step++ % 4 === 0) this.tone(sc[0] / 2, 2.6, 'sine', 0.04);  // soft bass
      };
      tick();
    }
  };

  /* particles: ambient weather + celebratory bursts (screen-space) */
  const WEATHER = { india: 'mote', japan: 'petal', uk: 'rain', usa: 'leaf', hub: 'spark' };
  let weather = [], bursts = [], flash = 0;

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
    sceneKind: 'recruit', activeMuddle: null,
    menuView: 'main',
    // --- quest / story ---
    lanterns: new Set(),          // countries whose Lantern is relit
    muddles: [],                  // {x,y,culture,alive}
    introSeen: false,
    objective: '',
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

    // Muddles — grey obstacles of misunderstanding, 3 per country. Clear all
    // three (with a Kindred ally) to relight that country's Lantern.
    const mud = [
      ['india', 8, 18], ['india', 12, 25], ['india', 4, 24],
      ['japan', 31, 25], ['japan', 37, 19], ['japan', 41, 25],
      ['uk', 20, 8], ['uk', 26, 6], ['uk', 21, 14],
      ['usa', 20, 30], ['usa', 27, 33], ['usa', 22, 38]
    ];
    state.muddles = mud.map(([culture, x, y]) => ({ culture, x, y, alive: true }));
  }
  // The Lantern site of each country (its landmark), for the glow when relit.
  const LANTERN_AT = { india: [4, 19], japan: [43, 19], uk: [20, 3], usa: [26, 38] };

  function muddleAt(x, y) { return state.muddles.find(mu => mu.alive && mu.x === x && mu.y === y); }
  function tileAt(x, y) {
    if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return T.TREE;
    return state.map[y][x];
  }
  function isSolid(x, y) {
    if (SOLID.has(tileAt(x, y))) return true;
    if (muddleAt(x, y)) return true;
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
    // a little bounce while walking (more springy on the bike)
    let bob = 0;
    if (p.moving) {
      const tt = Math.min(1, (performance.now() - p.moveStart) / p.moveDur);
      bob = -Math.abs(Math.sin(tt * Math.PI)) * (state.biking ? 3 : 2);
    }
    sy += bob;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(sx + TILE / 2, sy - bob + TILE - 4, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
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
    // Lantern glows at relit landmarks
    state.lanterns.forEach(c => {
      const L = LANTERN_AT[c]; if (!L) return;
      const sx = (L[0] - camX) * TILE + TILE / 2, sy = (L[1] - camY) * TILE + TILE / 2;
      const pulse = 12 + 3 * Math.sin(performance.now() / 300);
      const grd = ctx.createRadialGradient(sx, sy, 2, sx, sy, pulse + 14);
      grd.addColorStop(0, 'rgba(255,224,130,0.85)'); grd.addColorStop(1, 'rgba(255,224,130,0)');
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(sx, sy, pulse + 14, 0, Math.PI * 2); ctx.fill();
      ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🏮', sx, sy - 20);
    });
    // Muddles
    state.muddles.forEach(mu => {
      if (!mu.alive) return;
      const sx = (mu.x - camX) * TILE, sy = (mu.y - camY) * TILE;
      if (sx > -TILE && sx < canvas.width && sy > -TILE && sy < canvas.height) drawMuddle(sx, sy);
    });
    state.npcs.forEach(n => {
      const sx = (n.x - camX) * TILE, sy = (n.y - camY) * TILE;
      if (sx > -TILE && sx < canvas.width && sy > -TILE && sy < canvas.height) drawNPC(n, sx, sy);
    });
    drawPlayer((px - camX) * TILE, (py - camY) * TILE);

    // celebratory bursts (world-anchored)
    for (const b of bursts) {
      const bx = (b.wx - camX) * TILE, by = (b.wy - camY) * TILE;
      ctx.globalAlpha = Math.max(0, b.life);
      circle(bx, by, b.size, b.color);
      ctx.globalAlpha = 1;
    }
    drawWeather();

    // lantern-relight screen flash
    if (flash > 0) {
      ctx.fillStyle = 'rgba(255,235,160,' + (flash * 0.5) + ')';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (state.toast && performance.now() < state.toastUntil) {
      ctx.fillStyle = 'rgba(0,0,0,0.78)'; ctx.fillRect(0, canvas.height - 34, canvas.width, 34);
      ctx.fillStyle = '#fff'; ctx.font = '14px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(state.toast, canvas.width / 2, canvas.height - 12);
    }
  }
  function showToast(msg, ms) { state.toast = msg; state.toastUntil = performance.now() + (ms || 2600); }

  /* --------------------------- particles / weather ------------------------ */
  function setWeather(region) {
    const type = WEATHER[region] || 'spark';
    const n = type === 'rain' ? 46 : 34;
    weather = [];
    for (let i = 0; i < n; i++) weather.push(newParticle(type, true));
  }
  function newParticle(type, anywhere) {
    const p = { type, x: Math.random() * (VIEW_W * TILE), y: anywhere ? Math.random() * (VIEW_H * TILE) : -8 };
    if (type === 'rain') { p.vx = -0.6; p.vy = 8 + Math.random() * 4; p.len = 8 + Math.random() * 6; }
    else if (type === 'petal') { p.vx = -0.4 + Math.random() * 0.2; p.vy = 0.7 + Math.random() * 0.5; p.r = Math.random() * 6.28; p.spin = -0.05 + Math.random() * 0.1; p.size = 3 + Math.random() * 2; p.sway = Math.random() * 6.28; }
    else if (type === 'leaf') { p.vx = -0.3 + Math.random() * 0.2; p.vy = 0.6 + Math.random() * 0.5; p.size = 3 + Math.random() * 2; p.sway = Math.random() * 6.28; p.col = ['#e59866', '#d68910', '#ca6f1e'][Math.floor(Math.random() * 3)]; }
    else if (type === 'mote') { p.vx = -0.15 + Math.random() * 0.3; p.vy = -0.2 - Math.random() * 0.3; p.size = 1.5 + Math.random() * 1.5; p.tw = Math.random() * 6.28; }
    else { p.vx = -0.1 + Math.random() * 0.2; p.vy = -0.15 + Math.random() * 0.3; p.size = 1.2 + Math.random() * 1.4; p.tw = Math.random() * 6.28; }
    return p;
  }
  function drawWeather() {
    const W = VIEW_W * TILE, H = VIEW_H * TILE, t = performance.now() / 1000;
    for (const p of weather) {
      p.x += p.vx; p.y += p.vy;
      if (p.type === 'petal' || p.type === 'leaf') p.x += Math.sin(t + p.sway) * 0.4;
      if (p.y > H + 10 || p.x < -12) { Object.assign(p, newParticle(p.type, false)); p.x = Math.random() * W; continue; }
      if (p.type === 'rain') {
        ctx.strokeStyle = 'rgba(174,214,241,0.5)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx, p.y + p.len); ctx.stroke();
      } else if (p.type === 'petal') {
        p.r += p.spin;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = 'rgba(248,187,208,0.85)';
        ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      } else if (p.type === 'leaf') {
        ctx.fillStyle = p.col; ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.size, p.size * 0.55, t + p.sway, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      } else {
        const a = 0.35 + 0.35 * Math.sin(t * 3 + p.tw);
        ctx.fillStyle = p.type === 'mote' ? 'rgba(255,224,150,' + a + ')' : 'rgba(255,255,255,' + a + ')';
        circle(p.x, p.y, p.size, ctx.fillStyle);
      }
    }
  }
  function spawnBurst(wx, wy, color, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, sp = 0.05 + Math.random() * 0.14;
      bursts.push({ wx, wy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.06, life: 1, size: 2 + Math.random() * 3, color });
    }
  }
  function updateParticles() {
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i]; b.wx += b.vx; b.wy += b.vy; b.vy += 0.008; b.life -= 0.02;
      if (b.life <= 0) bursts.splice(i, 1);
    }
    if (flash > 0) flash = Math.max(0, flash - 0.02);
  }

  function drawMuddle(sx, sy) {
    const t = performance.now() / 260;
    const cx = sx + TILE / 2, cy = sy + TILE / 2 + Math.sin(t) * 1.5;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(cx, sy + TILE - 4, 9, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7f8c8d';
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      const r = 10 + Math.sin(a * 3 + t) * 2.2;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.9;
      a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4d5656'; circle(cx - 3, cy - 1, 1.6, '#2c3e50'); circle(cx + 3, cy - 1, 1.6, '#2c3e50');
    ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ecf0f1'; ctx.fillText('❓', cx, cy + 4);
  }

  /* ------------------------------ movement -------------------------------- */
  function moveDur() { return state.biking ? BIKE_MS : WALK_MS; }

  function tryMove(dir) {
    const p = state.player;
    if (p.moving) return;
    p.dir = dir;
    let nx = p.x, ny = p.y;
    if (dir === 'up') ny--; else if (dir === 'down') ny++;
    else if (dir === 'left') nx--; else nx++;
    const mu = muddleAt(nx, ny);
    if (mu) { startDispel(mu); return; }        // bump a Muddle to face it
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
      Sound.region = region; setWeather(region);
      if (COUNTRIES.indexOf(region) >= 0 && !state.passport.has(region)) {
        state.passport.add(region);
        state.rapport[region] = Math.min(100, state.rapport[region] + 5);
        Sound.stamp();
        showToast('🛂 Passport stamped: ' + CULTURE_META[region].flag + ' ' + CULTURE_META[region].name + '!', 2800);
        save();
      }
      updateObjective();
    }
    const culture = GRASS_CULTURE[tileAt(p.x, p.y)];
    if (culture && Math.random() < ENCOUNTER_CHANCE) startScene(culture);
  }

  function toggleBike() {
    const on = tileAt(state.player.x, state.player.y) === T.BIKE;
    if (!state.biking) {
      if (!on) { showToast('You can only hop on your bike on a 🚲 cycle path!'); return; }
      state.biking = true; Sound.bike(); showToast('🚲 Hopped on your bike! Zoom around. (S to hop off)');
    } else {
      state.biking = false; Sound.bike(); showToast('🚶 Hopped off your bike.');
    }
  }
  function toggleMute() {
    Sound.setMuted(!Sound.muted);
    showToast(Sound.muted ? '🔇 Sound off' : '🔊 Sound on');
    save();
    const btn = document.getElementById('btn-mute'); if (btn) btn.textContent = Sound.muted ? '🔇' : '🔊';
  }

  function facingTile() {
    const p = state.player; let x = p.x, y = p.y;
    if (p.dir === 'up') y--; else if (p.dir === 'down') y++;
    else if (p.dir === 'left') x--; else x++;
    return { x, y };
  }
  function interact() {
    const f = facingTile();
    const mu = muddleAt(f.x, f.y);
    if (mu) { startDispel(mu); return; }
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
    if (dlgIdx >= dlgLines.length) {
      document.getElementById('dialogue').classList.remove('show'); state.mode = 'play';
      if (state._pendingEnding) { state._pendingEnding = false; setTimeout(showEnding, 500); }
      updateObjective();
    }
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

  function allyOf(culture) {
    const id = KINDREDS.find(k => k.home === culture && state.befriended.has(k.id));
    return id || null;
  }

  function startScene(culture) {
    state.mode = 'scene';
    state.sceneKind = 'recruit';
    state.activeMuddle = null;
    state.activeKindred = pickKindred(culture);
    state.activeScene = pickScene(culture);
    state.sceneAnswered = false;
    renderScene();
  }

  function startDispel(mu) {
    const ally = allyOf(mu.culture);
    if (!ally) { openDialogue([MUDDLE.need_ally], null); return; }
    state.mode = 'scene';
    state.sceneKind = 'dispel';
    state.activeMuddle = mu;
    state.activeKindred = ally;         // your friend stands with you
    state.activeScene = pickScene(mu.culture);
    state.sceneAnswered = false;
    renderScene();
  }

  function renderScene() {
    const k = state.activeKindred, sc = state.activeScene;
    const cm = CULTURE_META[k.home];
    const dispel = state.sceneKind === 'dispel';
    const overlay = document.getElementById('quiz');
    overlay.innerHTML = '';
    const panel = document.createElement('div'); panel.className = 'quiz-panel';

    const head = document.createElement('div'); head.className = 'quiz-creature';
    const sprite = kindredSprite(k, 92); sprite.className = 'sprite'; head.appendChild(sprite);
    const meta = document.createElement('div');
    if (dispel) {
      meta.innerHTML = '<div class="k-name">❓ A <b>Muddle</b> blocks the way!</div>' +
        '<div class="k-title">' + cm.flag + ' ' + escapeHtml(cm.name) + ' · your friend ' + escapeHtml(k.name) + ' stands with you</div>' +
        '<div class="k-home ' + k.home + '">Melt it with the local way!</div>';
    } else {
      meta.innerHTML = '<div class="k-name">A curious <b>' + escapeHtml(k.name) + '</b> is watching…</div>' +
        '<div class="k-title">' + cm.flag + ' ' + escapeHtml(cm.name) + ' · ' + escapeHtml(k.title) + '</div>' +
        '<div class="k-home ' + k.home + '">Behave well and it may befriend you!</div>';
    }
    head.appendChild(meta); panel.appendChild(head);

    const setup = document.createElement('div'); setup.className = 'scene-setup';
    setup.textContent = dispel ? MUDDLE.intro + ' — ' + sc.setup : sc.setup; panel.appendChild(setup);
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
    const k = state.activeKindred;
    const dispel = state.sceneKind === 'dispel';
    Array.from(list.children).forEach(b => { b.disabled = true; });
    btn.classList.add(a.good ? 'right' : 'wrong');

    let newFriend = false, clearedMuddle = false;
    if (a.good) {
      state.harmony += 10;
      state.rapport[k.home] = Math.min(100, state.rapport[k.home] + 12);
      if (dispel && state.activeMuddle) { state.activeMuddle.alive = false; clearedMuddle = true; state.harmony += 5; Sound.dispel(); }
      else if (!dispel && !state.befriended.has(k.id)) { state.befriended.add(k.id); newFriend = true; state.harmony += 5; Sound.friend(); }
      else Sound.good();
    } else {
      state.harmony += 2;
      state.rapport[k.home] = Math.min(100, state.rapport[k.home] + 3);
      Sound.bad();
    }
    logTip(k.home, a.tip);
    save();

    let head;
    if (dispel) {
      head = a.good ? '✨ ' + k.name + ' flares bright — the Muddle dissolves!' : '😵 ' + MUDDLE.lose;
    } else {
      head = a.good
        ? (newFriend ? '🎉 ' + k.name + ' is charmed and befriends you!' : '✅ Nicely handled! ' + k.name + ' nods along.')
        : '😅 A little awkward… ' + k.name + ' watches you learn.';
    }
    const result = document.createElement('div');
    result.className = 'quiz-result ' + (a.good ? 'ok' : 'no');
    result.innerHTML =
      '<div class="r-head">' + escapeHtml(head) + '</div>' +
      '<div class="r-explain">' + escapeHtml(a.reaction) + '</div>' +
      '<div class="r-bridge"><b>📖 Journal:</b> ' + escapeHtml(a.tip) + '</div>' +
      '<div class="r-points">+' + (a.good ? (newFriend || clearedMuddle ? 15 : 10) : 2) + ' Harmony</div>' +
      '<button class="continue" id="continueBtn">Continue ▶</button>';
    document.querySelector('.quiz-panel').appendChild(result);
    result.scrollIntoView({ behavior: 'smooth', block: 'end' });
    state._clearedMuddleCulture = clearedMuddle ? k.home : null;
    document.getElementById('continueBtn').onclick = closeScene;
  }

  function closeScene() {
    document.getElementById('quiz').classList.remove('show');
    state.mode = 'play'; updateHud();
    const cleared = state._clearedMuddleCulture; state._clearedMuddleCulture = null;
    // Relight a Lantern once its country's Muddles are all cleared.
    if (cleared && !state.lanterns.has(cleared) && muddlesLeft(cleared) === 0) {
      lightLantern(cleared); return;
    }
    updateObjective(); save();
  }

  function muddlesLeft(culture) { return state.muddles.filter(mu => mu.alive && mu.culture === culture).length; }

  function lightLantern(culture) {
    state.lanterns.add(culture);
    save(); updateHud();
    Sound.lantern(); flash = 1;
    const L = LANTERN_AT[culture]; if (L) spawnBurst(L[0] + 0.5, L[1] + 0.5, '#ffe082', 26);
    const g = GUARDIANS[culture];
    const lines = g.lines.concat(['🏮 ' + state.lanterns.size + ' of 4 Lanterns are lit. ' +
      (state.lanterns.size < 4 ? 'The Bridge grows brighter — on to the next land!' : '')]);
    openDialogue(lines, g.flag + ' ' + g.name + ', Guardian of ' + CULTURE_META[culture].name);
    if (state.lanterns.size === 4 && !state.won) { state.won = true; save(); state._pendingEnding = true; }
    updateObjective();
  }

  function updateObjective() {
    const el = document.getElementById('objective'); if (!el) return;
    let text;
    if (state.lanterns.size === 4) text = '🌉 All four Lanterns are lit — the World Bridge is whole! Explore freely.';
    else {
      const r = state.currentRegion;
      if (COUNTRIES.indexOf(r) >= 0 && !state.lanterns.has(r)) {
        const left = muddlesLeft(r), ally = allyOf(r);
        if (!ally) text = '🎯 ' + CULTURE_META[r].flag + ' Befriend a local Kindred (walk into the tall grass) to gain an ally.';
        else if (left > 0) text = '🎯 ' + CULTURE_META[r].flag + ' Dispel ' + left + ' Muddle' + (left > 1 ? 's' : '') + ' to relight the Lantern of ' + CULTURE_META[r].name + '.';
        else text = '🎯 ' + CULTURE_META[r].flag + ' The Lantern of ' + CULTURE_META[r].name + ' is ready to light!';
      } else {
        text = '🎯 Pick a road and relight a country\'s Lantern.  🏮 ' + state.lanterns.size + '/4 lit';
      }
    }
    el.textContent = text;
  }

  function showEnding() { Sound.victory(); flash = 1; openDialogue(STORY_END, '🌏 The World Bridge'); }

  /* --------------------------------- menu --------------------------------- */
  function openMenu() { Sound.menu(); state.mode = 'menu'; state.menuView = 'main'; renderMenu(); }
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
      const lit = state.lanterns.has(c), left = muddlesLeft(c);
      const quest = lit ? '🏮 Lantern lit!' : (left + ' Muddle' + (left === 1 ? '' : 's') + ' left');
      return '<div class="pp-row">' +
        '<div class="pp-flag ' + (visited ? '' : 'faded') + '">' + cm.flag + '</div>' +
        '<div class="pp-info"><b>' + escapeHtml(cm.name) + '</b> ' +
        '<span class="pp-quest ' + (lit ? 'lit' : '') + '">' + quest + '</span>' +
        '<span class="pp-stamp">' + (visited ? '✔ visited' : 'not yet visited') + '</span>' +
        '<div class="pp-bar"><i style="width:' + r + '%"></i></div>' +
        '<span class="pp-rap">Rapport ' + r + '%</span></div></div>';
    }).join('');
    return menuHead('🛂 Passport', '🏮 ' + state.lanterns.size + '/4') + '<div class="pp-list">' + rows +
      '</div><div class="menu-foot">Befriend a Kindred, then dispel a country\'s Muddles to relight its Lantern.</div>';
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
    const lan = document.getElementById('hud-lanterns'); if (lan) lan.textContent = state.lanterns.size + '/4';
  }
  const SAVE_KEY = 'culture-bridge-save-v4';
  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        befriended: Array.from(state.befriended), harmony: state.harmony,
        passport: Array.from(state.passport), rapport: state.rapport,
        journal: state.journal, won: state.won,
        lanterns: Array.from(state.lanterns), introSeen: state.introSeen,
        dispelled: state.muddles.filter(mu => !mu.alive).map(mu => mu.x + ',' + mu.y),
        muted: Sound.muted
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
      (d.lanterns || []).forEach(c => state.lanterns.add(c));
      state.introSeen = !!d.introSeen;
      Sound.muted = !!d.muted;
      const dispelled = new Set(d.dispelled || []);
      state.muddles.forEach(mu => { if (dispelled.has(mu.x + ',' + mu.y)) mu.alive = false; });
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
      if (k === 'm' || k === 'M') { e.preventDefault(); toggleMute(); return; }
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
    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) muteBtn.addEventListener('click', () => { Sound.init(); toggleMute(); });
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
    updateParticles();
    render();
    requestAnimationFrame(loop);
  }

  /* --------------------------------- boot --------------------------------- */
  function start() {
    buildWorld();
    state.player = { x: 23, y: 20, dir: 'down', moving: false, fromX: 23, fromY: 20, moveStart: 0, moveDur: WALK_MS };
    state.currentRegion = regionAt(23, 20);
    load(); initCanvas(); updateHud(); wireTouch(); updateObjective();
    Sound.init(); Sound.region = state.currentRegion; setWeather(state.currentRegion);
    const mb = document.getElementById('btn-mute'); if (mb) mb.textContent = Sound.muted ? '🔇' : '🔊';
    window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp);
    requestAnimationFrame(loop);
    if (!state.introSeen) {
      state.introSeen = true; save();
      openDialogue(STORY_INTRO, '📜 The Legend of the Four Lanterns');
    } else {
      showToast('Welcome back, Bridgekeeper! 🏮 ' + state.lanterns.size + '/4 Lanterns lit. Press F for the menu.', 4200);
    }
  }

  window.CultureBridge = {
    start,
    reset: function () {
      try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
      state.befriended.clear(); state.harmony = 0; state.won = false;
      state.passport.clear(); state.rapport = { india: 0, japan: 0, uk: 0, usa: 0 };
      state.journal = []; state.journalKeys.clear();
      state.lanterns.clear(); state.introSeen = false;
      state.muddles.forEach(mu => { mu.alive = true; });
      updateHud(); updateObjective(); showToast('Progress reset. A fresh legend begins!');
    }
  };
})();
