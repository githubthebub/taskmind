// ============================================================
// POKeMON FRLG: SEVII EDITION - 3D renderer (three.js)
// HD-2D style: textured voxel terrain + billboard pixel sprites
// ============================================================

'use strict';

const R3D = (() => {
  let renderer, worldScene, worldCam, sun, sunTarget;
  let battleScene, battleCam, foeSprite, monSprite;
  let playerSprite, playerShadow, npcSprites = [], itemSprites = {};
  let waterMesh, waterGeo, waterTexRef = null, smokeSprites = [], ferryGroup;
  let flowerSprites = [], tuftMatRef = null, foamMatRef = null, cloudSprites = [];
  let lavaMatRef = null, lavaLightRef = null, lavaTileMatRef = null;
  let mapGroup = null, currentMap = null;
  let t = 0;
  const texCache = {};
  let curFoeSpecies = null, curMonSpecies = null, curPlayerKey = null;

  // ---------- pixel-art sprite textures ----------
  function makeCanvas(rows, pal, flip) {
    const c = document.createElement('canvas');
    c.width = rows[0].length; c.height = rows.length;
    const g = c.getContext('2d');
    for (let r = 0; r < rows.length; r++) {
      for (let i = 0; i < rows[r].length; i++) {
        const ch = flip ? rows[r][rows[r].length - 1 - i] : rows[r][i];
        if (ch === '.') continue;
        g.fillStyle = pal[ch] || '#f0f';
        g.fillRect(i, r, 1, 1);
      }
    }
    return c;
  }
  function nearest(tex) {
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  }

  // ---------- sprite enhancement pipeline ----------
  // autoShade: soft top-light / bottom-shade per column, skipping outlines
  function autoShade(src, outlineColor) {
    const w = src.width, h = src.height;
    const g = src.getContext('2d');
    const img = g.getImageData(0, 0, w, h);
    const d = img.data;
    const oc = outlineColor ? parseInt(outlineColor.slice(1), 16) : -1;
    const isOutline = i => ((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]) === oc;
    const shade = (i, f) => {
      d[i] = Math.min(255, Math.round(d[i] * f));
      d[i + 1] = Math.min(255, Math.round(d[i + 1] * f));
      d[i + 2] = Math.min(255, Math.round(d[i + 2] * f));
    };
    for (let x = 0; x < w; x++) {
      let top = -1, bottom = -1;
      for (let y = 0; y < h; y++) {
        const i = (y * w + x) * 4;
        if (d[i + 3] > 0 && !isOutline(i)) { if (top < 0) top = y; bottom = y; }
      }
      if (top >= 0) {
        shade((top * w + x) * 4, 1.18);
        if (top + 1 <= bottom) shade(((top + 1) * w + x) * 4, 1.08);
        if (bottom > top + 2) shade((bottom * w + x) * 4, 0.82);
      }
    }
    g.putImageData(img, 0, 0);
    return src;
  }

  // EPX / Scale2x: doubles resolution while smoothing diagonals
  function epx(src) {
    const w = src.width, h = src.height;
    const d = src.getContext('2d').getImageData(0, 0, w, h).data;
    const out = document.createElement('canvas');
    out.width = w * 2; out.height = h * 2;
    const og = out.getContext('2d');
    const oimg = og.createImageData(w * 2, h * 2);
    const od = oimg.data;
    const at = (x, y) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return 0;
      const i = (y * w + x) * 4;
      if (d[i + 3] === 0) return 0;
      return (d[i] << 24 >>> 0) + (d[i + 1] << 16) + (d[i + 2] << 8) + 255;
    };
    const put = (x, y, v) => {
      const i = (y * w * 2 + x) * 4;
      if (v === 0) { od[i + 3] = 0; return; }
      od[i] = (v >>> 24) & 255; od[i + 1] = (v >>> 16) & 255; od[i + 2] = (v >>> 8) & 255; od[i + 3] = 255;
    };
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1);
        let p1 = P, p2 = P, p3 = P, p4 = P;
        if (C === A && C !== D && A !== B) p1 = A;
        if (A === B && A !== C && B !== D) p2 = B;
        if (D === C && D !== B && C !== A) p3 = C;
        if (B === D && B !== A && D !== C) p4 = D;
        put(x * 2, y * 2, p1); put(x * 2 + 1, y * 2, p2);
        put(x * 2, y * 2 + 1, p3); put(x * 2 + 1, y * 2 + 1, p4);
      }
    }
    og.putImageData(oimg, 0, 0);
    return out;
  }

  function fxCanvas(rows, pal, flip, passes) {
    let c = autoShade(makeCanvas(rows, pal, flip), pal.k);
    for (let i = 0; i < passes; i++) c = epx(c);
    return c;
  }
  function pixelTex(key, rows, pal, flip, passes = 1) {
    if (texCache[key]) return texCache[key];
    return (texCache[key] = nearest(new THREE.CanvasTexture(fxCanvas(rows, pal, flip, passes))));
  }
  function monTex(species, flip) {
    const s = SPRITES[species];
    return pixelTex('mon:' + species + (flip ? ':f' : ''), s.px, s.pal, flip, 2);
  }
  // processed 96x96 canvas for big 2D drawing (title screen)
  const bigMonCache = {};
  function bigMonCanvas(species) {
    if (bigMonCache[species]) return bigMonCache[species];
    const s = SPRITES[species];
    return (bigMonCache[species] = fxCanvas(s.px, s.pal, false, 2));
  }
  // face + walk frame + mirror (for alternating steps)
  function playerTex(face, frame, mirror) {
    const base = face === 'left' ? 'right' : face;
    const flip = (face === 'left') !== !!mirror;
    const rows = PLAYER_SPRITES[base][frame];
    return pixelTex('pl:' + base + ':' + frame + (flip ? ':f' : ''), rows, PLAYER_SPRITES.pal, flip, 1);
  }

  function softShadowTex() {
    if (texCache.softsh) return texCache.softsh;
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(16, 16, 2, 16, 16, 15);
    grd.addColorStop(0, 'rgba(20,40,20,0.42)');
    grd.addColorStop(0.7, 'rgba(20,40,20,0.22)');
    grd.addColorStop(1, 'rgba(20,40,20,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 32, 32);
    return (texCache.softsh = new THREE.CanvasTexture(c));
  }
  function cloudTex(seed) {
    const key = 'cloud' + seed;
    if (texCache[key]) return texCache[key];
    const c = document.createElement('canvas');
    c.width = 64; c.height = 32;
    const g = c.getContext('2d');
    const blobs = [[18, 20, 11], [32, 16, 13], [46, 20, 10], [26, 22, 9], [40, 23, 8]];
    for (const [bx, by, br] of blobs) {
      const grd = g.createRadialGradient(bx, by - seed, 1, bx, by - seed, br);
      grd.addColorStop(0, 'rgba(255,255,255,0.95)');
      grd.addColorStop(0.8, 'rgba(250,252,255,0.7)');
      grd.addColorStop(1, 'rgba(250,252,255,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, 64, 32);
    }
    return (texCache[key] = new THREE.CanvasTexture(c));
  }
  function skyTex(top, bottom) {
    const key = 'sky:' + top + bottom;
    if (texCache[key]) return texCache[key];
    const c = document.createElement('canvas');
    c.width = 4; c.height = 128;
    const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 0, 128);
    grd.addColorStop(0, top);
    grd.addColorStop(1, bottom);
    g.fillStyle = grd;
    g.fillRect(0, 0, 4, 128);
    return (texCache[key] = new THREE.CanvasTexture(c));
  }

  const FLOWER_FRAMES = [
    [
      '..rr....',
      '.rRRr...',
      '.rRWr.y.',
      '..rr.yYy',
      '...g..y.',
      '...gg...',
      '..g.....',
      '........',
    ],
    [
      '........',
      '..rr....',
      '.rRRr.y.',
      '.rRWryYy',
      '..rrg.y.',
      '...gg...',
      '....g...',
      '........',
    ],
  ];
  const FLOWER_PAL = { r:'#e04838', R:'#f47868', W:'#f8e8b0', y:'#f0c828', Y:'#f8e468', g:'#3a8c4a' };

  const NPC_ROWS = [
    '.....kkkkkk.....',
    '....kHHHHHHk....',
    '...kHHHHHHHHk...',
    '...kHHHHHHHHk...',
    '...kHssssssHk...',
    '...kskWsskWsk...',
    '....kssssssk....',
    '....kssssssk....',
    '.....kssssk.....',
    '....kCCCCCCk....',
    '...kCCCCCCCCk...',
    '..ksCCCCCCCCsk..',
    '..kskCCCCCCksk..',
    '...k.kCCCCk.k...',
    '.....kCCCCk.....',
    '....kLLkkLLk....',
    '....kLLkkLLk....',
    '....kkk..kkk....',
    '................',
    '................',
  ];
  function npcTex(color) {
    const key = 'npc:' + color;
    if (texCache[key]) return texCache[key];
    const pal = { k:'#2a2020', H:'#5a4632', s:'#ecb488', W:'#ffffff', C:color, L:'#404048' };
    return (texCache[key] = nearest(new THREE.CanvasTexture(fxCanvas(NPC_ROWS, pal, false, 1))));
  }

  const TREE_ROWS = [
    '.....kkkkkk.....',
    '...kkglllggkk...',
    '..kgglggggggk...',
    '.kggggggggdggk..',
    '.kglgggdggggdk..',
    'kggggggggggggdk.',
    'kglggdgggglggdk.',
    'kgggggggdggggdk.',
    'kgdggggggggdddk.',
    '.kgggdggdggddk..',
    '.kddgggggdddk...',
    '..kkdddddddkk...',
    '...kkkkkkkkk....',
    '.....kTtTk......',
    '.....kTtTk......',
    '....kTTtTTk.....',
    '.....kkkkk......',
  ];
  const TREE_PAL = { k:'#1e3c22', g:'#3a8c4a', d:'#2a6c38', l:'#58a858', T:'#7a5230', t:'#93683c' };

  function ballTex() {
    if (texCache.ball) return texCache.ball;
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    const g = c.getContext('2d');
    g.fillStyle = '#2a2020'; g.beginPath(); g.arc(8, 9, 7, 0, 7); g.fill();
    g.fillStyle = '#d83828'; g.beginPath(); g.arc(8, 9, 6, Math.PI, 0); g.fill();
    g.fillStyle = '#f0f0f0'; g.beginPath(); g.arc(8, 9, 6, 0, Math.PI); g.fill();
    g.fillStyle = '#2a2020'; g.fillRect(2, 8, 12, 2);
    g.fillStyle = '#f8f8f8'; g.fillRect(6, 7, 4, 4);
    g.fillStyle = '#2a2020'; g.fillRect(7, 8, 2, 2);
    return (texCache.ball = nearest(new THREE.CanvasTexture(c)));
  }
  function gemTex() {
    if (texCache.gem) return texCache.gem;
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    const g = c.getContext('2d');
    g.fillStyle = '#5a1a14';
    g.beginPath(); g.moveTo(8, 1); g.lineTo(15, 8); g.lineTo(8, 15); g.lineTo(1, 8); g.closePath(); g.fill();
    g.fillStyle = '#d83828';
    g.beginPath(); g.moveTo(8, 2); g.lineTo(14, 8); g.lineTo(8, 14); g.lineTo(2, 8); g.closePath(); g.fill();
    g.fillStyle = '#f87858'; g.fillRect(5, 4, 3, 3);
    g.fillStyle = '#ffd0b8'; g.fillRect(6, 5, 1, 1);
    return (texCache.gem = nearest(new THREE.CanvasTexture(c)));
  }
  function grassTuftTex(frame) {
    const key = 'tuft' + frame;
    if (texCache[key]) return texCache[key];
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    const g = c.getContext('2d');
    const lean = frame ? 1 : 0;
    g.fillStyle = '#256e2c';
    for (const [x, h] of [[1, 7], [4, 10], [7, 12], [10, 9], [13, 7]]) {
      g.fillRect(x, 16 - h, 2, h);
      g.fillRect(x + 1 + lean, 16 - h - 2, 1, 2);
    }
    g.fillStyle = '#389040';
    for (const [x, h] of [[2, 5], [6, 8], [9, 6], [12, 5]]) g.fillRect(x + (frame ? (x % 2 ? 1 : 0) : 0), 16 - h, 1, h);
    g.fillStyle = '#4aa850';
    g.fillRect(3 + lean, 5, 1, 2); g.fillRect(8 + lean, 3, 1, 2); g.fillRect(12, 7, 1, 2);
    return (texCache[key] = nearest(new THREE.CanvasTexture(c)));
  }

  // ---------- procedural tile textures ----------
  function tileTex(key, w, h, draw) {
    if (texCache[key]) return texCache[key];
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'));
    return (texCache[key] = nearest(new THREE.CanvasTexture(c)));
  }
  function speckle(g, colors, n, seed) {
    let s = seed;
    const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    for (let i = 0; i < n; i++) {
      g.fillStyle = colors[Math.floor(rnd() * colors.length)];
      g.fillRect(Math.floor(rnd() * 16), Math.floor(rnd() * 16), rnd() > 0.6 ? 2 : 1, 1);
    }
  }
  const TILE_DRAWS = {
    grass: g => { g.fillStyle = '#70c048'; g.fillRect(0, 0, 16, 16); speckle(g, ['#5cb038', '#84d058', '#65b840'], 26, 7); },
    dark:  g => { g.fillStyle = '#54a83c'; g.fillRect(0, 0, 16, 16); speckle(g, ['#448c30', '#66b848'], 24, 11); },
    path:  g => { g.fillStyle = '#e4cc90'; g.fillRect(0, 0, 16, 16); speckle(g, ['#d0b878', '#f0dca4', '#c8ac6c'], 22, 3); },
    sand:  g => { g.fillStyle = '#e0cc8c'; g.fillRect(0, 0, 16, 16); speckle(g, ['#ccb474', '#f0e0a4', '#c4a868'], 22, 5); },
    plank: g => {
      g.fillStyle = '#b08050'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#8a6038'; g.fillRect(0, 3, 16, 1); g.fillRect(0, 8, 16, 1); g.fillRect(0, 13, 16, 1);
      g.fillStyle = '#c89868'; g.fillRect(0, 0, 16, 1); g.fillRect(0, 5, 16, 1); g.fillRect(0, 10, 16, 1);
      g.fillStyle = '#7a5430'; g.fillRect(4, 4, 1, 4); g.fillRect(11, 9, 1, 4);
    },
    rockTop: g => { g.fillStyle = '#b4a184'; g.fillRect(0, 0, 16, 16); speckle(g, ['#9c8a6c', '#c8b494'], 20, 13); },
    rockSide: g => {
      g.fillStyle = '#93826a'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#7a6a54'; g.fillRect(0, 4, 16, 1); g.fillRect(0, 10, 16, 1);
      g.fillStyle = '#a8967c'; g.fillRect(0, 0, 16, 2);
      g.fillStyle = '#6a5c48'; g.fillRect(0, 14, 16, 2);
      g.fillRect(3, 5, 1, 5); g.fillRect(12, 11, 1, 4);
    },
    roofRed: g => {
      g.fillStyle = '#e05848'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#c04030'; g.fillRect(0, 5, 16, 1); g.fillRect(0, 11, 16, 1);
      g.fillStyle = '#f08068'; g.fillRect(0, 0, 16, 2);
    },
    roofBlue: g => {
      g.fillStyle = '#5880c8'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#4064a8'; g.fillRect(0, 5, 16, 1); g.fillRect(0, 11, 16, 1);
      g.fillStyle = '#80a4e0'; g.fillRect(0, 0, 16, 2);
    },
    wall: g => {
      g.fillStyle = '#e4d8c0'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#ccbc9c'; g.fillRect(0, 7, 16, 1);
      g.fillStyle = '#b4a484'; g.fillRect(0, 14, 16, 2);
      g.fillStyle = '#f0e8d4'; g.fillRect(0, 0, 16, 1);
    },
    spa: g => {
      g.fillStyle = '#58d0c0'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#88e8dc'; g.fillRect(2, 3, 5, 1); g.fillRect(9, 8, 5, 1); g.fillRect(4, 12, 4, 1);
      g.fillStyle = '#40b0a0'; g.fillRect(8, 5, 4, 1); g.fillRect(1, 9, 4, 1);
    },
    floor: g => {
      g.fillStyle = '#e8d8b4'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#dcc89c'; g.fillRect(0, 0, 8, 8); g.fillRect(8, 8, 8, 8);
      g.fillStyle = '#c8b488'; g.fillRect(0, 15, 16, 1); g.fillRect(15, 0, 1, 16);
    },
    iwall: g => {
      g.fillStyle = '#c8ac84'; g.fillRect(0, 0, 16, 16);
      g.fillStyle = '#e0c89c'; g.fillRect(1, 1, 14, 8);
      g.fillStyle = '#a88c64'; g.fillRect(0, 12, 16, 4);
      g.fillStyle = '#8a7050'; g.fillRect(0, 15, 16, 1);
    },
    water: g => {
      g.fillStyle = '#4890e0'; g.fillRect(0, 0, 32, 32);
      g.fillStyle = '#3878c8';
      g.fillRect(4, 6, 8, 2); g.fillRect(20, 14, 8, 2); g.fillRect(8, 24, 8, 2);
      g.fillStyle = '#80c0f0';
      g.fillRect(2, 2, 6, 1); g.fillRect(18, 4, 7, 1); g.fillRect(10, 12, 6, 1);
      g.fillRect(24, 20, 6, 1); g.fillRect(4, 20, 5, 1); g.fillRect(16, 28, 7, 1);
    },
  };
  function groundMats(topKey, sideColor) {
    const key = 'gm:' + topKey + ':' + sideColor;
    if (texCache[key]) return texCache[key];
    const top = new THREE.MeshLambertMaterial({ map: tileTex('tt:' + topKey, topKey === 'water' ? 32 : 16, topKey === 'water' ? 32 : 16, TILE_DRAWS[topKey]) });
    const side = new THREE.MeshLambertMaterial({ color: sideColor });
    return (texCache[key] = [side, side, top, side, side, side]);
  }
  function allMat(topKey) {
    const key = 'am:' + topKey;
    if (texCache[key]) return texCache[key];
    return (texCache[key] = new THREE.MeshLambertMaterial({ map: tileTex('tt:' + topKey, 16, 16, TILE_DRAWS[topKey]) }));
  }

  function makeSprite(tex, w, h) {
    const m = new THREE.SpriteMaterial({ map: tex, alphaTest: 0.5 });
    const s = new THREE.Sprite(m);
    s.scale.set(w, h, 1);
    return s;
  }

  // ---------- init ----------
  function init(canvas) {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    renderer.setSize(480, 320, false);
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    worldScene = new THREE.Scene();
    worldCam = new THREE.PerspectiveCamera(38, 480 / 320, 0.1, 120);

    sun = new THREE.DirectionalLight(0xfff2dd, 1.15);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -14; sun.shadow.camera.right = 14;
    sun.shadow.camera.top = 14; sun.shadow.camera.bottom = -14;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 60;
    sunTarget = new THREE.Object3D();
    worldScene.add(sunTarget);
    sun.target = sunTarget;
    worldScene.add(sun);
    worldScene.add(new THREE.AmbientLight(0xbcd4e8, 0.75));

    playerSprite = makeSprite(playerTex('down', 0, false), 1.05, 1.31);
    playerSprite.center.set(0.5, 0.06);
    worldScene.add(playerSprite);
    playerShadow = blobShadow(0.34);
    worldScene.add(playerShadow);

    buildBattleScene();
  }

  function blobShadow(r) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(r * 2.6, r * 2.6),
      new THREE.MeshBasicMaterial({ map: softShadowTex(), transparent: true, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    return m;
  }

  // ---------- world building ----------
  const MAT = {};
  function mat(key, opts) {
    if (!MAT[key]) MAT[key] = new THREE.MeshLambertMaterial(opts);
    return MAT[key];
  }

  function setMap(mapKey) {
    if (mapGroup) { worldScene.remove(mapGroup); disposeGroup(mapGroup); }
    npcSprites.forEach(s => { worldScene.remove(s.sprite); worldScene.remove(s.shadow); });
    npcSprites = [];
    Object.values(itemSprites).forEach(s => worldScene.remove(s));
    itemSprites = {};
    smokeSprites.forEach(s => worldScene.remove(s));
    smokeSprites = [];
    cloudSprites.forEach(s => worldScene.remove(s));
    cloudSprites = [];
    flowerSprites = [];
    tuftMatRef = null; foamMatRef = null; lavaMatRef = null; lavaLightRef = null; lavaTileMatRef = null;
    if (waterMesh) { worldScene.remove(waterMesh); waterMesh = null; waterTexRef = null; }
    if (ferryGroup) { worldScene.remove(ferryGroup); ferryGroup = null; }

    currentMap = mapKey;
    const m = MAPS[mapKey];
    mapGroup = m.outdoor ? buildOutdoor(m) : buildIndoor(m);
    worldScene.add(mapGroup);

    if (m.outdoor) {
      // warm dusk palette on the volcano summit
      worldScene.background = m.warm ? skyTex('#e8935a', '#f8dca8') : skyTex('#5aa8e8', '#c8ecff');
      worldScene.fog = new THREE.Fog(m.warm ? 0xf0c090 : 0xb8e0f8, 20, 46);
      sun.intensity = m.warm ? 1.0 : 1.15;
      // drifting clouds
      for (let i = 0; i < 4; i++) {
        const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex(i % 2), transparent: true, opacity: 0.85, depthWrite: false }));
        spr.scale.set(7 + i * 1.5, 3 + i * 0.6, 1);
        spr.userData.baseX = 2 + i * 9;
        spr.userData.speed = 0.12 + i * 0.04;
        spr.position.set(spr.userData.baseX, 10 + (i % 2) * 2.2, 4 + i * 12);
        worldScene.add(spr);
        cloudSprites.push(spr);
      }
    } else {
      worldScene.background = new THREE.Color(0x241c14);
      worldScene.fog = new THREE.Fog(0x241c14, 12, 26);
      sun.intensity = 0.55;
    }

    for (const n of m.npcs) {
      const spr = makeSprite(npcTex(n.color), 1.0, 1.25);
      spr.center.set(0.5, 0.08);
      spr.position.set(n.x + 0.5, 0.06, n.y + 0.5);
      worldScene.add(spr);
      const sh = blobShadow(0.3);
      sh.position.set(n.x + 0.5, 0.015, n.y + 0.55);
      worldScene.add(sh);
      npcSprites.push({ sprite: spr, shadow: sh, npc: n });
    }
    const balls = ITEM_BALLS[mapKey] || {};
    for (const key in balls) {
      const [x, y] = key.split(',').map(Number);
      const isGem = balls[key].item === 'RUBY';
      const spr = makeSprite(isGem ? gemTex() : ballTex(), isGem ? 0.5 : 0.44, isGem ? 0.5 : 0.44);
      spr.center.set(0.5, 0.1);
      spr.position.set(x + 0.5, 0.05, y + 0.5);
      worldScene.add(spr);
      itemSprites[key] = spr;
    }
    snapCamera();
  }

  function eachTile(grid, cb) {
    for (let y = 0; y < grid.length; y++)
      for (let x = 0; x < grid[y].length; x++) cb(grid[y][x], x, y);
  }

  function instanced(group, geo, material, positions, { castShadow = false, receiveShadow = true, vary = 0 } = {}) {
    if (!positions.length) return;
    const im = new THREE.InstancedMesh(geo, material, positions.length);
    const m4 = new THREE.Matrix4();
    const col = new THREE.Color();
    positions.forEach((p, i) => {
      m4.makeTranslation(p[0], p[1], p[2]);
      if (p[3]) { const r = new THREE.Matrix4().makeRotationY(p[3]); m4.multiply(r); }
      im.setMatrixAt(i, m4);
      if (vary) {
        // deterministic per-tile brightness variation breaks up flat terrain
        const hsh = (Math.sin(p[0] * 127.1 + p[2] * 311.7) * 43758.5453) % 1;
        const f = 1 - vary / 2 + Math.abs(hsh) * vary;
        col.setRGB(f, f, f);
        im.setColorAt(i, col);
      }
    });
    im.castShadow = castShadow;
    im.receiveShadow = receiveShadow;
    group.add(im);
  }

  const groundGeo = new THREE.BoxGeometry(1, 0.5, 1);

  function buildOutdoor(m) {
    const g = new THREE.Group();
    const grid = m.grid;
    const pos = { grass: [], dark: [], path: [], sand: [], rock: [], plank: [], spa: [], rocky: [], lava: [],
      wallC: [], wallH: [], roofC: [], roofH: [], tree: [], tuftA: [], tuftB: [], flower: [], sign: [] };

    eachTile(grid, (tc, x, y) => {
      const cx = x + 0.5, cz = y + 0.5;
      switch (tc) {
        case 'G': case 'F': case 'R': case '!': pos.grass.push([cx, -0.25, cz]); break;
        case '.': (m.rocky ? pos.rocky : pos.grass).push([cx, -0.25, cz]); break;
        case 'T':
          pos.dark.push([cx, -0.25, cz]);
          pos.tuftA.push([cx, 0.26, cz]);
          pos.tuftB.push([cx, 0.26, cz, Math.PI / 2]);
          break;
        case 'P': case '5': (m.rocky ? pos.rocky : pos.path).push([cx, -0.26, cz]); break;
        case 'L': pos.lava.push([cx, -0.28, cz]); break;
        case 'S': pos.sand.push([cx, -0.27, cz]); break;
        case 'I': (m.rocky ? pos.rocky : pos.sand).push([cx, -0.27, cz]); break;
        case '#': {
          const h = 1.1 + ((x * 7 + y * 13) % 5) * 0.12;
          pos.rock.push([cx, h / 2 - 0.5, cz]);
          break;
        }
        case 'D': pos.plank.push([cx, -0.26, cz]); break;
        case '~': pos.spa.push([cx, -0.3, cz]); break;
        case 'A': pos.roofC.push([cx, 0, cz]); break;
        case 'B': pos.roofH.push([cx, 0, cz]); break;
        case 'a': case '1': pos.wallC.push([cx, 0, cz]); break;
        case 'b': case '2': case '4': pos.wallH.push([cx, 0, cz]); break;
      }
      if (tc === 'R') pos.tree.push([cx, 0, cz]);
      if (tc === 'F') pos.flower.push([cx, 0, cz]);
      if (tc === '!') pos.sign.push([cx, 0, cz]);
    });

    instanced(g, groundGeo, groundMats('grass', 0x4e8834), pos.grass, { vary: 0.1 });
    instanced(g, groundGeo, groundMats('dark', 0x3d7a2c), pos.dark, { vary: 0.1 });
    instanced(g, groundGeo, groundMats('path', 0xb89868), pos.path, { vary: 0.06 });
    instanced(g, groundGeo, groundMats('sand', 0xc8ac74), pos.sand, { vary: 0.07 });
    instanced(g, new THREE.BoxGeometry(1, 1.7, 1),
      [allMat('rockSide'), allMat('rockSide'), new THREE.MeshLambertMaterial({ map: tileTex('tt:rockTop', 16, 16, TILE_DRAWS.rockTop) }), allMat('rockSide'), allMat('rockSide'), allMat('rockSide')],
      pos.rock, { castShadow: true });
    instanced(g, groundGeo, groundMats('plank', 0x7a5430), pos.plank);
    instanced(g, groundGeo, groundMats('spa', 0x2a8a7c), pos.spa);
    instanced(g, groundGeo, groundMats('rockTop', 0x7a6a54), pos.rocky, { vary: 0.09 });
    if (pos.lava.length) {
      lavaTileMatRef = new THREE.MeshBasicMaterial({ color: 0xff6830 });
      instanced(g, groundGeo, lavaTileMatRef, pos.lava);
    }

    // buildings: textured walls + shingled roof slabs
    const wallM = allMat('wall');
    instanced(g, new THREE.BoxGeometry(1, 1.5, 1), wallM, pos.wallC.map(p => [p[0], 0.75, p[2]]), { castShadow: true });
    instanced(g, new THREE.BoxGeometry(1, 1.5, 1), wallM, pos.wallH.map(p => [p[0], 0.75, p[2]]), { castShadow: true });
    instanced(g, new THREE.BoxGeometry(1.08, 0.7, 1.08), allMat('roofRed'), pos.roofC.map(p => [p[0], 1.82, p[2]]), { castShadow: true });
    instanced(g, new THREE.BoxGeometry(1.08, 0.7, 1.08), allMat('roofBlue'), pos.roofH.map(p => [p[0], 1.82, p[2]]), { castShadow: true });
    instanced(g, new THREE.BoxGeometry(1.08, 0.28, 1.08), allMat('roofRed'), pos.wallC.map(p => [p[0], 1.6, p[2]]));
    instanced(g, new THREE.BoxGeometry(1.08, 0.28, 1.08), allMat('roofBlue'), pos.wallH.map(p => [p[0], 1.6, p[2]]));
    // ridge caps along the roof tops
    instanced(g, new THREE.BoxGeometry(1.1, 0.09, 0.34), mat('ridgeC', { color: 0xb03828 }), pos.roofC.map(p => [p[0], 2.21, p[2]]));
    instanced(g, new THREE.BoxGeometry(1.1, 0.09, 0.34), mat('ridgeH', { color: 0x3c5898 }), pos.roofH.map(p => [p[0], 2.21, p[2]]));

    // doors, windows, and the PokeCenter sign
    eachTile(grid, (tc, x, y) => {
      if (tc === '1' || tc === '2' || tc === '4') {
        const door = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.0),
          mat(tc === '1' ? 'doorC' : 'doorH', { color: tc === '1' ? 0x8a4432 : 0x6a4a34 }));
        door.position.set(x + 0.5, 0.52, y + 1.005);
        g.add(door);
        const frame = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 1.08), mat('doorFrame', { color: 0x3a3230 }));
        frame.position.set(x + 0.5, 0.52, y + 1.001);
        g.add(frame);
      }
      if (tc === '1') {
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5),
          new THREE.MeshBasicMaterial({ map: ballTex(), transparent: true, alphaTest: 0.4 }));
        sign.position.set(x + 0.5, 1.28, y + 1.01);
        g.add(sign);
      }
      if (tc === 'a' || tc === 'b') {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.4), mat('win', { color: 0xa8d8f0, emissive: 0x334455 }));
        win.position.set(x + 0.5, 0.95, y + 1.005);
        g.add(win);
      }
    });

    // trees as billboard pixel sprites (HD-2D style)
    const treeTexture = pixelTex('tree', TREE_ROWS, TREE_PAL);
    for (const p of pos.tree) {
      const spr = makeSprite(treeTexture, 1.35, 1.43);
      spr.center.set(0.5, 0.04);
      spr.position.set(p[0], 0.02, p[2]);
      worldScene.add(spr); // added to scene so we can track for disposal via mapGroup? keep in group:
      worldScene.remove(spr);
      g.add(spr);
      const sh = blobShadow(0.42);
      sh.position.set(p[0], 0.014, p[2] + 0.1);
      g.add(sh);
    }

    // tall grass tufts: crossed quads with a 2-frame sway
    const tuftGeo = new THREE.PlaneGeometry(0.95, 0.55);
    tuftMatRef = new THREE.MeshLambertMaterial({ map: grassTuftTex(0), alphaTest: 0.4, side: THREE.DoubleSide });
    instanced(g, tuftGeo, tuftMatRef, pos.tuftA);
    instanced(g, tuftGeo, tuftMatRef, pos.tuftB);

    // foam strips where sand/planks meet the sea
    const foamPos = [];
    eachTile(grid, (tc, x, y) => {
      if (tc !== 'W') return;
      const solidBeach = c2 => c2 === 'S' || c2 === 'D' || c2 === 'I';
      if (y > 0 && solidBeach(grid[y - 1][x])) foamPos.push([x + 0.5, -0.14, y + 0.14, 0]);
      if (x > 0 && solidBeach(grid[y][x - 1])) foamPos.push([x + 0.14, -0.14, y + 0.5, Math.PI / 2]);
      if (x < grid[y].length - 1 && solidBeach(grid[y][x + 1])) foamPos.push([x + 0.86, -0.14, y + 0.5, Math.PI / 2]);
    });
    if (foamPos.length) {
      foamMatRef = new THREE.MeshBasicMaterial({ color: 0xe8f8ff, transparent: true, opacity: 0.55, depthWrite: false });
      const foamGeo = new THREE.PlaneGeometry(1, 0.22);
      const fm = new THREE.InstancedMesh(foamGeo, foamMatRef, foamPos.length);
      const m4 = new THREE.Matrix4(), rx = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
      foamPos.forEach((p, i) => {
        m4.makeTranslation(p[0], p[1], p[2]);
        const ry = new THREE.Matrix4().makeRotationY(p[3]);
        m4.multiply(ry).multiply(rx);
        fm.setMatrixAt(i, m4);
      });
      g.add(fm);
    }

    // flowers: animated billboard sprites (two sway frames)
    const fTexA = pixelTex('flowerA', FLOWER_FRAMES[0], FLOWER_PAL, false, 1);
    const fTexB = pixelTex('flowerB', FLOWER_FRAMES[1], FLOWER_PAL, false, 1);
    for (const p of pos.flower) {
      for (const [ox, oz] of [[-0.2, -0.12], [0.22, 0.18]]) {
        const spr = makeSprite(fTexA, 0.42, 0.42);
        spr.center.set(0.5, 0.1);
        spr.position.set(p[0] + ox, 0.02, p[2] + oz);
        spr.userData.texA = fTexA; spr.userData.texB = fTexB;
        g.add(spr);
        flowerSprites.push(spr);
      }
    }

    // signs
    instanced(g, new THREE.BoxGeometry(0.12, 0.5, 0.12), mat('trunk', { color: 0x7a5230 }), pos.sign.map(p => [p[0], 0.25, p[2]]), { castShadow: true });
    instanced(g, new THREE.BoxGeometry(0.7, 0.42, 0.1), mat('signbd', { color: 0xc09858 }), pos.sign.map(p => [p[0], 0.58, p[2]]), { castShadow: true });

    // sea with scrolling ripple texture + gentle vertex waves
    waterGeo = new THREE.PlaneGeometry(110, 110, 44, 44);
    const wtex = tileTex('tt:water', 32, 32, TILE_DRAWS.water);
    wtex.wrapS = wtex.wrapT = THREE.RepeatWrapping;
    wtex.repeat.set(55, 55);
    waterTexRef = wtex;
    waterMesh = new THREE.Mesh(waterGeo, new THREE.MeshLambertMaterial({ map: wtex, transparent: true, opacity: 0.95 }));
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(15, -0.22, 30);
    g.add(waterMesh);

    // Mt. Ember on the horizon (bigger and closer on the summit map)
    const vk = m.volcano || { x: 13, z: -7.5, s: 1 };
    const vx = vk.x, vz = vk.z, vs = vk.s;
    const volcano = new THREE.Mesh(new THREE.ConeGeometry(11 * vs, 9 * vs, 9), mat('volcano', { color: 0x6e5a48 }));
    volcano.position.set(vx, 3.2 * vs, vz);
    g.add(volcano);
    const crater = new THREE.Mesh(new THREE.CylinderGeometry(2.4 * vs, 3.4 * vs, 1.6 * vs, 9), mat('crater', { color: 0x4a3a30 }));
    crater.position.set(vx, 7.4 * vs, vz);
    g.add(crater);
    lavaMatRef = new THREE.MeshBasicMaterial({ color: 0xff6830 });
    const lava = new THREE.Mesh(new THREE.CylinderGeometry(2.1 * vs, 2.1 * vs, 0.3 * vs, 9), lavaMatRef);
    lava.position.set(vx, 8.05 * vs, vz);
    g.add(lava);
    lavaLightRef = new THREE.PointLight(0xff7838, 1.4, 16 * vs);
    lavaLightRef.position.set(vx, 8.8 * vs, vz);
    g.add(lavaLightRef);
    for (let i = 0; i < 4; i++) {
      const c = document.createElement('canvas');
      c.width = 32; c.height = 32;
      const cg = c.getContext('2d');
      cg.fillStyle = 'rgba(120,120,128,0.7)';
      cg.beginPath(); cg.arc(16, 16, 11, 0, 7); cg.fill();
      const tex = new THREE.CanvasTexture(c);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.55, depthWrite: false }));
      s.scale.set(2.4 * vs, 2.4 * vs, 1);
      s.userData.phase = i / 4;
      s.userData.vk = vk;
      s.position.set(vx, 8.6 * vs, vz);
      worldScene.add(s);
      smokeSprites.push(s);
    }

    if (!m.ferry) {
      g.traverse(o => { if (o.isMesh || o.isInstancedMesh) o.receiveShadow = true; });
      return g;
    }

    // Seagallop ferry docked beside the pier
    ferryGroup = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 5.2), mat('hull', { color: 0xf0f0f0 }));
    hull.position.y = 0.1;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.18, 5.24), mat('stripe', { color: 0x3868c0 }));
    stripe.position.y = 0.0;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 2.2), mat('cabin', { color: 0xe0e8f0 }));
    cabin.position.set(0, 0.85, -0.4);
    const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.7, 8), mat('funnel', { color: 0xc84838 }));
    funnel.position.set(0, 1.55, -0.4);
    ferryGroup.add(hull, stripe, cabin, funnel);
    ferryGroup.position.set(16.6, -0.05, 50.2);
    ferryGroup.traverse(o => { o.castShadow = true; });
    worldScene.add(ferryGroup);

    g.traverse(o => { if (o.isMesh || o.isInstancedMesh) o.receiveShadow = true; });
    return g;
  }

  function buildIndoor(m) {
    const g = new THREE.Group();
    const pos = { floor: [], wall: [], counter: [], shelf: [], table: [], mat: [], heal: [], pc: [] };
    eachTile(m.grid, (tc, x, y) => {
      const cx = x + 0.5, cz = y + 0.5;
      pos.floor.push([cx, -0.25, cz]);
      switch (tc) {
        case 'w': pos.wall.push([cx, 0.75, cz]); break;
        case 'c': pos.counter.push([cx, 0.4, cz]); break;
        case 'k': pos.shelf.push([cx, 0.7, cz]); break;
        case 't': pos.table.push([cx, 0.3, cz]); break;
        case 'm': pos.mat.push([cx, 0.01, cz]); break;
        case 'h': pos.heal.push([cx, 0.45, cz]); break;
        case 'p': pos.pc.push([cx, 0.55, cz]); break;
      }
    });
    instanced(g, groundGeo, groundMats('floor', 0xb89868), pos.floor);
    instanced(g, new THREE.BoxGeometry(1, 1.5, 1), allMat('iwall'), pos.wall, { castShadow: true });
    instanced(g, new THREE.BoxGeometry(1, 0.8, 0.8), mat('counter', { color: 0xc87858 }), pos.counter, { castShadow: true });
    instanced(g, new THREE.BoxGeometry(0.95, 1.4, 0.7), mat('shelf', { color: 0x91613d }), pos.shelf, { castShadow: true });
    instanced(g, new THREE.BoxGeometry(0.95, 0.6, 0.95), mat('table', { color: 0xb58a56 }), pos.table, { castShadow: true });
    instanced(g, new THREE.BoxGeometry(0.85, 0.04, 0.85), mat('mat', { color: 0x8fbc6a }), pos.mat);
    instanced(g, new THREE.BoxGeometry(0.9, 0.9, 0.75), mat('healbox', { color: 0xd8dce4 }), pos.heal, { castShadow: true });
    instanced(g, new THREE.BoxGeometry(0.9, 1.1, 0.75), mat('pcbox', { color: 0x707a8c }), pos.pc, { castShadow: true });
    eachTile(m.grid, (tch, x, y) => {
      if (tch === 'p') {
        const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.45),
          new THREE.MeshBasicMaterial({ color: 0x70e8c8 }));
        scr.position.set(x + 0.5, 0.85, y + 0.89);
        g.add(scr);
      }
      if (tch === 'h') {
        const lamp = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.2),
          new THREE.MeshBasicMaterial({ color: 0xe86058 }));
        lamp.position.set(x + 0.5, 0.75, y + 0.89);
        g.add(lamp);
      }
    });
    const lamp = new THREE.PointLight(0xffe8c0, 0.9, 14);
    lamp.position.set(m.grid[0].length / 2, 3.2, m.grid.length / 2);
    g.add(lamp);
    g.traverse(o => { if (o.isMesh || o.isInstancedMesh) o.receiveShadow = true; });
    return g;
  }

  function disposeGroup(g) {
    g.traverse(o => { if (o.geometry && o.geometry !== groundGeo) o.geometry.dispose(); });
  }

  function hideItem(key) { if (itemSprites[key]) itemSprites[key].visible = false; }

  // ---------- world rendering ----------
  function playerWorldPos() {
    return { x: game.px + game.ox / 16 + 0.5, z: game.py + game.oy / 16 + 0.5 };
  }

  function snapCamera() {
    const p = playerWorldPos();
    const indoor = currentMap && !MAPS[currentMap].outdoor;
    const dy = indoor ? 5.2 : 7.6, dz = indoor ? 4.4 : 6.6;
    worldCam.position.set(p.x, dy, p.z + dz);
    worldCam.lookAt(p.x, 0.4, p.z - 0.4);
  }

  function renderWorld() {
    if (!currentMap) return;
    t += 1 / 60;
    const p = playerWorldPos();

    // player billboard with walk animation; mirror step on alternate tiles
    const stepFrame = game.walking && game.walkFrame < 4 ? 1 : 0;
    const mirror = stepFrame === 1 && (game.dir === 'down' || game.dir === 'up') && ((game.px + game.py) % 2 === 0);
    const key = game.dir + ':' + stepFrame + ':' + mirror;
    if (curPlayerKey !== key) {
      curPlayerKey = key;
      playerSprite.material.map = playerTex(game.dir, stepFrame, mirror);
      playerSprite.material.needsUpdate = true;
    }
    playerSprite.position.set(p.x, 0.06, p.z);
    playerShadow.position.set(p.x, 0.015, p.z + 0.05);

    for (const key2 in itemSprites) itemSprites[key2].visible = !game.collected[key2];

    const indoor = !MAPS[currentMap].outdoor;
    const dy = indoor ? 5.2 : 7.6, dz = indoor ? 4.4 : 6.6;
    worldCam.position.lerp(new THREE.Vector3(p.x, dy, p.z + dz), 0.14);
    worldCam.lookAt(worldCam.position.x, 0.4, worldCam.position.z - dz - 0.4);

    sun.position.set(p.x + 6, 12, p.z + 4);
    sunTarget.position.set(p.x, 0, p.z);

    if (waterGeo) {
      const posAttr = waterGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i), y = posAttr.getY(i);
        posAttr.setZ(i, Math.sin(x * 0.7 + t * 1.6) * 0.05 + Math.cos(y * 0.5 + t * 1.1) * 0.05);
      }
      posAttr.needsUpdate = true;
    }
    if (waterTexRef) { waterTexRef.offset.x = t * 0.02; waterTexRef.offset.y = t * 0.008; }

    // ambient life: swaying tufts, flower frames, drifting clouds, foam pulse, lava glow
    const frame2 = Math.floor(t * 1.7) % 2;
    if (tuftMatRef && tuftMatRef.userData.frame !== frame2) {
      tuftMatRef.userData.frame = frame2;
      tuftMatRef.map = grassTuftTex(frame2);
      tuftMatRef.needsUpdate = true;
    }
    for (const f of flowerSprites) {
      const want = frame2 ? f.userData.texB : f.userData.texA;
      if (f.material.map !== want) { f.material.map = want; f.material.needsUpdate = true; }
    }
    for (const cSpr of cloudSprites) {
      cSpr.position.x = ((cSpr.userData.baseX + t * cSpr.userData.speed) % 44) - 6;
    }
    if (foamMatRef) foamMatRef.opacity = 0.4 + 0.22 * Math.sin(t * 2.2);
    if (lavaMatRef) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 3.1);
      lavaMatRef.color.setRGB(1, 0.42 + pulse * 0.25, 0.19 + pulse * 0.12);
      if (lavaLightRef) lavaLightRef.intensity = 1.1 + pulse * 0.8;
    }

    if (lavaTileMatRef) {
      const pulse2 = 0.5 + 0.5 * Math.sin(t * 2.6);
      lavaTileMatRef.color.setRGB(1, 0.4 + pulse2 * 0.22, 0.16 + pulse2 * 0.1);
    }
    for (const s of smokeSprites) {
      const vk = s.userData.vk || { x: 13, z: -7.5, s: 1 };
      const ph = (t * 0.14 + s.userData.phase) % 1;
      s.position.y = (8.6 + ph * 4.2) * vk.s;
      s.position.x = vk.x + Math.sin(ph * 5 + s.userData.phase * 7) * 0.8 * vk.s;
      s.material.opacity = 0.5 * (1 - ph);
      const sc = (1.6 + ph * 2.6) * vk.s;
      s.scale.set(sc, sc, 1);
    }
    if (ferryGroup) ferryGroup.position.y = -0.05 + Math.sin(t * 1.3) * 0.03;

    renderer.render(worldScene, worldCam);
  }

  // ---------- battle ----------
  function buildBattleScene() {
    battleScene = new THREE.Scene();
    battleScene.background = skyTex('#4ea0e4', '#cceeff');
    battleScene.fog = new THREE.Fog(0xbce4f8, 18, 40);
    for (let i = 0; i < 3; i++) {
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex(i % 2), transparent: true, opacity: 0.9, depthWrite: false }));
      spr.scale.set(9 + i * 2, 3.6 + i, 1);
      spr.position.set(-14 + i * 13, 8 + i * 1.6, -24);
      battleScene.add(spr);
    }
    battleCam = new THREE.PerspectiveCamera(40, 480 / 320, 0.1, 100);
    battleCam.position.set(0, 2.1, 6.4);
    battleCam.lookAt(0.3, 1.0, -1.2);

    const light = new THREE.DirectionalLight(0xfff2dd, 1.1);
    light.position.set(4, 8, 5);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.camera.left = -8; light.shadow.camera.right = 8;
    light.shadow.camera.top = 8; light.shadow.camera.bottom = -8;
    battleScene.add(light);
    battleScene.add(new THREE.AmbientLight(0xc0d8e8, 0.8));

    const gtex = tileTex('tt:grass', 16, 16, TILE_DRAWS.grass);
    gtex.wrapS = gtex.wrapT = THREE.RepeatWrapping;
    const gtex2 = gtex.clone();
    gtex2.needsUpdate = true;
    gtex2.wrapS = gtex2.wrapT = THREE.RepeatWrapping;
    gtex2.repeat.set(30, 30);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 24),
      new THREE.MeshLambertMaterial({ map: gtex2 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    battleScene.add(ground);

    // battle platforms: mottled grassy discs with darker rims
    const ptex = tileTex('tt:dark', 16, 16, TILE_DRAWS.dark);
    ptex.wrapS = ptex.wrapT = THREE.RepeatWrapping;
    const ptex2 = ptex.clone();
    ptex2.needsUpdate = true;
    ptex2.wrapS = ptex2.wrapT = THREE.RepeatWrapping;
    ptex2.repeat.set(3, 3);
    const platTop = new THREE.MeshLambertMaterial({ map: ptex2, color: 0xd8e8b0 });
    const platSide = new THREE.MeshLambertMaterial({ color: 0x86ac58 });
    const mkPlat = (r, x, z) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.12, 0.22, 20), [platSide, platTop, platSide]);
      p.position.set(x, 0.11, z);
      p.receiveShadow = true;
      battleScene.add(p);
    };
    mkPlat(1.9, 1.9, -2.9);
    mkPlat(2.0, -1.9, 1.3);

    // scenery: billboard trees + Mt. Ember silhouette
    const treeTexture = pixelTex('tree', TREE_ROWS, TREE_PAL);
    for (const [x, z, s] of [[-8, -9, 2.6], [7, -11, 3.2], [-5, -13, 2.2], [10, -8, 2.4], [-11, -6, 2.2]]) {
      const spr = makeSprite(treeTexture, s, s * 1.06);
      spr.center.set(0.5, 0.04);
      spr.position.set(x, 0, z);
      battleScene.add(spr);
    }
    const vol = new THREE.Mesh(new THREE.ConeGeometry(9, 7.5, 9),
      new THREE.MeshLambertMaterial({ color: 0x6e5a48 }));
    vol.position.set(4, 2.4, -26);
    battleScene.add(vol);

    foeSprite = makeSprite(monTex('MEOWTH'), 2.5, 2.5);
    foeSprite.center.set(0.5, 0.06);
    foeSprite.position.set(1.9, 0.2, -2.9);
    battleScene.add(foeSprite);
    const foeSh = blobShadow(0.85); foeSh.position.set(1.9, 0.23, -2.8); battleScene.add(foeSh);

    monSprite = makeSprite(monTex('BLASTOISE', true), 2.7, 2.7);
    monSprite.center.set(0.5, 0.05);
    monSprite.position.set(-1.9, 0.2, 1.3);
    battleScene.add(monSprite);
    const monSh = blobShadow(0.95); monSh.position.set(-1.9, 0.23, 1.4); battleScene.add(monSh);
  }

  let foeIntro = 0, monIntro = 0;
  function renderBattle() {
    const foe = battle.foe, pm = game.party[battle.activeIdx];
    if (foe && curFoeSpecies !== foe.species) {
      curFoeSpecies = foe.species;
      foeSprite.material.map = monTex(foe.species);
      foeSprite.material.needsUpdate = true;
      foeIntro = 1; // slide in from the right
    }
    if (pm && curMonSpecies !== pm.species) {
      curMonSpecies = pm.species;
      monSprite.material.map = monTex(pm.species, true);
      monSprite.material.needsUpdate = true;
      monIntro = 1; // slide in from the left
    }
    foeSprite.visible = !!(foe && foe.hp > 0);
    monSprite.visible = !!(pm && pm.hp > 0);

    foeIntro = Math.max(0, foeIntro - 0.04);
    monIntro = Math.max(0, monIntro - 0.04);
    const ease = v => v * v;

    let foeDx = 0, monDx = 0;
    if (battle.foeAnim > 0) { foeDx = -battle.foeAnim * 0.06; battle.foeAnim--; }
    if (battle.playerAnim > 0) { monDx = battle.playerAnim * 0.06; battle.playerAnim--; }
    foeSprite.position.x = 1.9 + foeDx + ease(foeIntro) * 7;
    monSprite.position.x = -1.9 + monDx - ease(monIntro) * 7;

    t += 1 / 240;
    foeSprite.position.y = 0.2 + Math.sin(t * 9) * 0.03;
    monSprite.position.y = 0.2 + Math.cos(t * 8) * 0.03;

    // gentle camera drift + hit shake
    const driftX = Math.sin(t * 1.7) * 0.05, driftY = Math.cos(t * 1.3) * 0.03;
    if (battle.shake > 0) {
      battleCam.position.x = driftX + (battle.shake % 2 ? 0.09 : -0.09);
      battle.shake--;
    } else battleCam.position.x = driftX;
    battleCam.position.y = 2.1 + driftY;

    renderer.render(battleScene, battleCam);
  }

  return { init, setMap, renderWorld, renderBattle, hideItem, snapCamera, bigMonCanvas };
})();
