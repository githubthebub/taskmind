// ============================================================
// POKeMON FRLG: SEVII EDITION - 3D renderer (three.js)
// HD-2D style: low-res 3D voxel terrain + billboard pixel sprites
// ============================================================

'use strict';

const R3D = (() => {
  let renderer, worldScene, worldCam, sun, sunTarget;
  let battleScene, battleCam, foeSprite, monSprite;
  let playerSprite, playerShadow, npcSprites = [], itemSprites = {};
  let waterMesh, waterGeo, smokeSprites = [], ferryGroup;
  let mapGroup = null, currentMap = null;
  let t = 0;
  const texCache = {};
  let curFoeSpecies = null, curMonSpecies = null, curPlayerFace = null;

  // ---------- pixel-art textures ----------
  function makeCanvas(rows, pal, flip) {
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
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
  function pixelTex(key, rows, pal, flip) {
    if (texCache[key]) return texCache[key];
    const tex = new THREE.CanvasTexture(makeCanvas(rows, pal, flip));
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    texCache[key] = tex;
    return tex;
  }
  function monTex(species, flip) {
    const s = SPRITES[species];
    return pixelTex('mon:' + species + (flip ? ':f' : ''), s.px, s.pal, flip);
  }
  function playerTex(face) {
    const flip = face === 'left';
    const rows = PLAYER_SPRITES[flip ? 'right' : face];
    return pixelTex('pl:' + face, rows, PLAYER_SPRITES.pal, flip);
  }
  function npcTex(color) {
    const key = 'npc:' + color;
    if (texCache[key]) return texCache[key];
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    const g = c.getContext('2d');
    g.fillStyle = '#584838'; g.fillRect(5, 1, 6, 2);
    g.fillStyle = '#e8b088'; g.fillRect(4, 2, 8, 5);
    g.fillStyle = '#282020'; g.fillRect(6, 4, 1, 1); g.fillRect(9, 4, 1, 1);
    g.fillStyle = color;     g.fillRect(4, 7, 8, 5); g.fillRect(3, 8, 1, 3); g.fillRect(12, 8, 1, 3);
    g.fillStyle = '#404048'; g.fillRect(5, 12, 2, 3); g.fillRect(9, 12, 2, 3);
    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
    texCache[key] = tex;
    return tex;
  }
  function ballTex() {
    if (texCache.ball) return texCache.ball;
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    const g = c.getContext('2d');
    g.fillStyle = '#d83828'; g.beginPath(); g.arc(8, 9, 6, Math.PI, 0); g.fill();
    g.fillStyle = '#f0f0f0'; g.beginPath(); g.arc(8, 9, 6, 0, Math.PI); g.fill();
    g.fillStyle = '#282828'; g.fillRect(2, 8, 12, 2);
    g.fillStyle = '#f8f8f8'; g.fillRect(7, 8, 3, 3);
    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
    texCache.ball = tex;
    return tex;
  }
  function grassTuftTex() {
    if (texCache.tuft) return texCache.tuft;
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    const g = c.getContext('2d');
    g.fillStyle = '#2e6e34';
    for (const [x, h] of [[1, 7], [4, 10], [7, 12], [10, 9], [13, 7]]) {
      g.fillRect(x, 16 - h, 2, h);
      g.fillRect(x + 1, 16 - h - 2, 1, 2);
    }
    g.fillStyle = '#3d8a40';
    for (const [x, h] of [[2, 5], [6, 8], [9, 6], [12, 5]]) g.fillRect(x, 16 - h, 1, h);
    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
    texCache.tuft = tex;
    return tex;
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

    // player billboard + blob shadow
    playerSprite = makeSprite(playerTex('down'), 1.05, 1.05);
    playerSprite.center.set(0.5, 0.08);
    worldScene.add(playerSprite);
    playerShadow = blobShadow(0.34);
    worldScene.add(playerShadow);

    buildBattleScene();
  }

  function blobShadow(r) {
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(r, 12),
      new THREE.MeshBasicMaterial({ color: 0x1a2a1a, transparent: true, opacity: 0.3 })
    );
    m.rotation.x = -Math.PI / 2;
    return m;
  }

  // ---------- world building ----------
  const MAT = {}; // shared materials
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
    if (waterMesh) { worldScene.remove(waterMesh); waterMesh = null; }
    if (ferryGroup) { worldScene.remove(ferryGroup); ferryGroup = null; }

    currentMap = mapKey;
    const m = MAPS[mapKey];
    mapGroup = m.outdoor ? buildOutdoor(m) : buildIndoor(m);
    worldScene.add(mapGroup);

    if (m.outdoor) {
      worldScene.background = new THREE.Color(0x9cd0ee);
      worldScene.fog = new THREE.Fog(0x9cd0ee, 20, 46);
      sun.intensity = 1.15;
    } else {
      worldScene.background = new THREE.Color(0x241c14);
      worldScene.fog = new THREE.Fog(0x241c14, 12, 26);
      sun.intensity = 0.55;
    }

    // NPC billboards
    for (const n of m.npcs) {
      const spr = makeSprite(npcTex(n.color), 1.0, 1.0);
      spr.center.set(0.5, 0.08);
      spr.position.set(n.x + 0.5, 0.06, n.y + 0.5);
      worldScene.add(spr);
      const sh = blobShadow(0.3);
      sh.position.set(n.x + 0.5, 0.015, n.y + 0.55);
      worldScene.add(sh);
      npcSprites.push({ sprite: spr, shadow: sh, npc: n });
    }
    // item balls
    if (mapKey === 'oneisland') {
      for (const key in ITEM_BALLS) {
        const [x, y] = key.split(',').map(Number);
        const spr = makeSprite(ballTex(), 0.44, 0.44);
        spr.center.set(0.5, 0.1);
        spr.position.set(x + 0.5, 0.05, y + 0.5);
        worldScene.add(spr);
        itemSprites[key] = spr;
      }
    }
    snapCamera();
  }

  function eachTile(grid, cb) {
    for (let y = 0; y < grid.length; y++)
      for (let x = 0; x < grid[y].length; x++) cb(grid[y][x], x, y);
  }

  function instanced(group, geo, material, positions, { castShadow = false, receiveShadow = true } = {}) {
    if (!positions.length) return;
    const im = new THREE.InstancedMesh(geo, material, positions.length);
    const m4 = new THREE.Matrix4();
    positions.forEach((p, i) => {
      m4.makeTranslation(p[0], p[1], p[2]);
      if (p[3]) { const r = new THREE.Matrix4().makeRotationY(p[3]); m4.multiply(r); }
      im.setMatrixAt(i, m4);
    });
    im.castShadow = castShadow;
    im.receiveShadow = receiveShadow;
    group.add(im);
  }

  const groundGeo = new THREE.BoxGeometry(1, 0.5, 1);

  function buildOutdoor(m) {
    const g = new THREE.Group();
    const grid = m.grid;
    const pos = { grass: [], dark: [], path: [], sand: [], rock: [], plank: [], spa: [],
      wallC: [], wallH: [], roofC: [], roofH: [], tree: [], tuftA: [], tuftB: [], flower: [], sign: [] };

    eachTile(grid, (t, x, y) => {
      const cx = x + 0.5, cz = y + 0.5;
      switch (t) {
        case 'G': case 'F': case 'R': case '!': pos.grass.push([cx, -0.25, cz]); break;
        case 'T':
          pos.dark.push([cx, -0.25, cz]);
          pos.tuftA.push([cx, 0.26, cz]);
          pos.tuftB.push([cx, 0.26, cz, Math.PI / 2]);
          break;
        case 'P': pos.path.push([cx, -0.26, cz]); break;
        case 'S': case 'I': pos.sand.push([cx, -0.27, cz]); break;
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
      if (t === 'R') pos.tree.push([cx, 0, cz]);
      if (t === 'F') pos.flower.push([cx, 0, cz]);
      if (t === '!') pos.sign.push([cx, 0, cz]);
      if (t === '#') { /* rocks handled */ }
    });

    instanced(g, groundGeo, mat('grass', { color: 0x6db84c }), pos.grass);
    instanced(g, groundGeo, mat('darkgrass', { color: 0x4c9a44 }), pos.dark);
    instanced(g, groundGeo, mat('path', { color: 0xdec688 }), pos.path);
    instanced(g, groundGeo, mat('sand', { color: 0xeedc9e }), pos.sand);
    instanced(g, new THREE.BoxGeometry(1, 1.7, 1), mat('rock', { color: 0x8f8068 }), pos.rock, { castShadow: true });
    instanced(g, new THREE.BoxGeometry(1, 0.5, 1), mat('plank', { color: 0xa87848 }), pos.plank);
    instanced(g, groundGeo, mat('spa', { color: 0x5fd8c8, emissive: 0x2a7a70 }), pos.spa);

    // buildings: wall boxes + roof slabs
    instanced(g, new THREE.BoxGeometry(1, 1.5, 1), mat('wallC', { color: 0xf2e8d5 }), pos.wallC.map(p => [p[0], 0.75, p[2]]), { castShadow: true });
    instanced(g, new THREE.BoxGeometry(1, 1.5, 1), mat('wallH', { color: 0xe8dcc5 }), pos.wallH.map(p => [p[0], 0.75, p[2]]), { castShadow: true });
    instanced(g, new THREE.BoxGeometry(1.08, 0.7, 1.08), mat('roofC', { color: 0xe05848 }), pos.roofC.map(p => [p[0], 1.82, p[2]]), { castShadow: true });
    instanced(g, new THREE.BoxGeometry(1.08, 0.7, 1.08), mat('roofH', { color: 0x5880c8 }), pos.roofH.map(p => [p[0], 1.82, p[2]]), { castShadow: true });
    // roofs sit on the row behind the walls; also cap the wall rows themselves
    instanced(g, new THREE.BoxGeometry(1.08, 0.28, 1.08), mat('roofC'), pos.wallC.map(p => [p[0], 1.6, p[2]]));
    instanced(g, new THREE.BoxGeometry(1.08, 0.28, 1.08), mat('roofH'), pos.wallH.map(p => [p[0], 1.6, p[2]]));

    // doors + windows as planes on south faces of wall tiles
    eachTile(grid, (t, x, y) => {
      if (t === '1' || t === '2' || t === '4') {
        const door = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.0),
          mat(t === '1' ? 'doorC' : 'doorH', { color: t === '1' ? 0x8a4432 : 0x6a4a34 }));
        door.position.set(x + 0.5, 0.52, y + 1.005);
        g.add(door);
      }
      if (t === 'a' || t === 'b') {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.4), mat('win', { color: 0xa8d8f0, emissive: 0x334455 }));
        win.position.set(x + 0.5, 0.95, y + 1.005);
        g.add(win);
      }
    });

    // trees: trunk + two foliage spheres
    instanced(g, new THREE.CylinderGeometry(0.13, 0.17, 0.7, 6), mat('trunk', { color: 0x7a5230 }),
      pos.tree.map(p => [p[0], 0.35, p[2]]), { castShadow: true });
    instanced(g, new THREE.SphereGeometry(0.52, 8, 6), mat('leaf', { color: 0x2f7e40 }),
      pos.tree.map(p => [p[0], 0.95, p[2]]), { castShadow: true });
    instanced(g, new THREE.SphereGeometry(0.34, 8, 6), mat('leaf2', { color: 0x3d9a50 }),
      pos.tree.map(p => [p[0], 1.42, p[2]]), { castShadow: true });

    // tall grass tufts: crossed quads
    const tuftGeo = new THREE.PlaneGeometry(0.95, 0.55);
    const tuftMat = new THREE.MeshLambertMaterial({ map: grassTuftTex(), alphaTest: 0.4, side: THREE.DoubleSide });
    instanced(g, tuftGeo, tuftMat, pos.tuftA);
    instanced(g, tuftGeo, tuftMat, pos.tuftB);

    // flowers
    instanced(g, new THREE.SphereGeometry(0.09, 6, 4), mat('flowerR', { color: 0xe85858, emissive: 0x401010 }),
      pos.flower.map(p => [p[0] - 0.22, 0.1, p[2] - 0.15]));
    instanced(g, new THREE.SphereGeometry(0.09, 6, 4), mat('flowerY', { color: 0xf0d020, emissive: 0x403408 }),
      pos.flower.map(p => [p[0] + 0.2, 0.1, p[2] + 0.2]));

    // signs
    instanced(g, new THREE.BoxGeometry(0.12, 0.5, 0.12), mat('trunk'), pos.sign.map(p => [p[0], 0.25, p[2]]), { castShadow: true });
    instanced(g, new THREE.BoxGeometry(0.7, 0.42, 0.1), mat('signbd', { color: 0xc09858 }), pos.sign.map(p => [p[0], 0.58, p[2]]), { castShadow: true });

    // sea
    waterGeo = new THREE.PlaneGeometry(110, 110, 44, 44);
    waterMesh = new THREE.Mesh(waterGeo, new THREE.MeshLambertMaterial({ color: 0x4a90d8, transparent: true, opacity: 0.92 }));
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(15, -0.22, 30);
    g.add(waterMesh);

    // Mt. Ember on the horizon (visual only, beyond the playable rocks)
    const volcano = new THREE.Mesh(new THREE.ConeGeometry(11, 9, 9), mat('volcano', { color: 0x6e5a48 }));
    volcano.position.set(13, 3.2, -7.5);
    g.add(volcano);
    const crater = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.4, 1.6, 9), mat('crater', { color: 0x4a3a30 }));
    crater.position.set(13, 7.4, -7.5);
    g.add(crater);
    const lava = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.3, 9),
      new THREE.MeshBasicMaterial({ color: 0xff6830 }));
    lava.position.set(13, 8.05, -7.5);
    g.add(lava);
    for (let i = 0; i < 4; i++) {
      const c = document.createElement('canvas');
      c.width = 32; c.height = 32;
      const cg = c.getContext('2d');
      cg.fillStyle = 'rgba(120,120,128,0.7)';
      cg.beginPath(); cg.arc(16, 16, 11, 0, 7); cg.fill();
      const tex = new THREE.CanvasTexture(c);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.55, depthWrite: false }));
      s.scale.set(2.4, 2.4, 1);
      s.userData.phase = i / 4;
      s.position.set(13, 8.6, -7.5);
      worldScene.add(s);
      smokeSprites.push(s);
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
    eachTile(m.grid, (t, x, y) => {
      const cx = x + 0.5, cz = y + 0.5;
      if (t !== 'w') pos.floor.push([cx, -0.25, cz]);
      switch (t) {
        case 'w': pos.wall.push([cx, 0.75, cz]); pos.floor.push([cx, -0.25, cz]); break;
        case 'c': pos.counter.push([cx, 0.4, cz]); break;
        case 'k': pos.shelf.push([cx, 0.7, cz]); break;
        case 't': pos.table.push([cx, 0.3, cz]); break;
        case 'm': pos.mat.push([cx, 0.01, cz]); break;
        case 'h': pos.heal.push([cx, 0.45, cz]); break;
        case 'p': pos.pc.push([cx, 0.55, cz]); break;
      }
    });
    instanced(g, groundGeo, mat('floor', { color: 0xe4d4ac }), pos.floor);
    instanced(g, new THREE.BoxGeometry(1, 1.5, 1), mat('iwall', { color: 0xc4a880 }), pos.wall, { castShadow: true });
    instanced(g, new THREE.BoxGeometry(1, 0.8, 0.8), mat('counter', { color: 0xc87858 }), pos.counter, { castShadow: true });
    instanced(g, new THREE.BoxGeometry(0.95, 1.4, 0.7), mat('shelf', { color: 0x91613d }), pos.shelf, { castShadow: true });
    instanced(g, new THREE.BoxGeometry(0.95, 0.6, 0.95), mat('table', { color: 0xb58a56 }), pos.table, { castShadow: true });
    instanced(g, new THREE.BoxGeometry(0.85, 0.04, 0.85), mat('mat', { color: 0x8fbc6a }), pos.mat);
    instanced(g, new THREE.BoxGeometry(0.9, 0.9, 0.75), mat('healbox', { color: 0xd8dce4 }), pos.heal, { castShadow: true });
    instanced(g, new THREE.BoxGeometry(0.9, 1.1, 0.75), mat('pcbox', { color: 0x707a8c }), pos.pc, { castShadow: true });
    // glows for machines
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

    // player billboard
    const bob = game.walking && game.walkFrame % 8 >= 4 ? 0.07 : 0;
    if (curPlayerFace !== game.dir) {
      curPlayerFace = game.dir;
      playerSprite.material.map = playerTex(game.dir);
      playerSprite.material.needsUpdate = true;
    }
    playerSprite.position.set(p.x, 0.06 + bob, p.z);
    playerShadow.position.set(p.x, 0.015, p.z + 0.05);

    // items visibility
    for (const key in itemSprites) itemSprites[key].visible = !game.collected[key];

    // camera follow
    const indoor = !MAPS[currentMap].outdoor;
    const dy = indoor ? 5.2 : 7.6, dz = indoor ? 4.4 : 6.6;
    worldCam.position.lerp(new THREE.Vector3(p.x, dy, p.z + dz), 0.14);
    worldCam.lookAt(worldCam.position.x, 0.4, worldCam.position.z - dz - 0.4 + 0.0);

    // sun follows player so the shadow window stays useful
    sun.position.set(p.x + 6, 12, p.z + 4);
    sunTarget.position.set(p.x, 0, p.z);

    // water waves
    if (waterGeo) {
      const posAttr = waterGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i), y = posAttr.getY(i);
        posAttr.setZ(i, Math.sin(x * 0.7 + t * 1.6) * 0.06 + Math.cos(y * 0.5 + t * 1.1) * 0.06);
      }
      posAttr.needsUpdate = true;
    }
    // volcano smoke
    for (const s of smokeSprites) {
      const ph = (t * 0.14 + s.userData.phase) % 1;
      s.position.y = 8.6 + ph * 4.2;
      s.position.x = 13 + Math.sin(ph * 5 + s.userData.phase * 7) * 0.8;
      s.material.opacity = 0.5 * (1 - ph);
      const sc = 1.6 + ph * 2.6;
      s.scale.set(sc, sc, 1);
    }
    // gentle ferry bob
    if (ferryGroup) ferryGroup.position.y = -0.05 + Math.sin(t * 1.3) * 0.03;

    renderer.render(worldScene, worldCam);
  }

  // ---------- battle ----------
  function buildBattleScene() {
    battleScene = new THREE.Scene();
    battleScene.background = new THREE.Color(0xa6d8f0);
    battleScene.fog = new THREE.Fog(0xa6d8f0, 18, 40);
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

    const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 24),
      new THREE.MeshLambertMaterial({ color: 0x8cc46c }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    battleScene.add(ground);

    const platMat = new THREE.MeshLambertMaterial({ color: 0x74ac58 });
    const foePlat = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.15, 0.22, 20), platMat);
    foePlat.position.set(1.9, 0.11, -2.9);
    foePlat.receiveShadow = true;
    battleScene.add(foePlat);
    const monPlat = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.25, 0.22, 20), platMat);
    monPlat.position.set(-1.9, 0.11, 1.3);
    monPlat.receiveShadow = true;
    battleScene.add(monPlat);

    // far scenery: a few trees + Mt. Ember silhouette
    for (const [x, z, s] of [[-8, -9, 1.3], [7, -11, 1.6], [-5, -13, 1.1], [10, -8, 1.2]]) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * s, 0.18 * s, 0.8 * s, 6),
        new THREE.MeshLambertMaterial({ color: 0x7a5230 }));
      trunk.position.set(x, 0.4 * s, z);
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.7 * s, 8, 6),
        new THREE.MeshLambertMaterial({ color: 0x2f7e40 }));
      leaf.position.set(x, 1.15 * s, z);
      battleScene.add(trunk, leaf);
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

  function renderBattle() {
    const foe = battle.foe, pm = game.party[battle.activeIdx];
    if (foe && curFoeSpecies !== foe.species) {
      curFoeSpecies = foe.species;
      foeSprite.material.map = monTex(foe.species);
      foeSprite.material.needsUpdate = true;
    }
    if (pm && curMonSpecies !== pm.species) {
      curMonSpecies = pm.species;
      monSprite.material.map = monTex(pm.species, true);
      monSprite.material.needsUpdate = true;
    }
    foeSprite.visible = !!(foe && foe.hp > 0);
    monSprite.visible = !!(pm && pm.hp > 0);

    // attack lunges
    let foeDx = 0, monDx = 0;
    if (battle.foeAnim > 0) { foeDx = -battle.foeAnim * 0.06; battle.foeAnim--; }
    if (battle.playerAnim > 0) { monDx = battle.playerAnim * 0.06; battle.playerAnim--; }
    foeSprite.position.x = 1.9 + foeDx;
    monSprite.position.x = -1.9 + monDx;

    // idle breathing
    t += 1 / 240;
    foeSprite.position.y = 0.2 + Math.sin(t * 9) * 0.03;
    monSprite.position.y = 0.2 + Math.cos(t * 8) * 0.03;

    // hit shake
    if (battle.shake > 0) {
      battleCam.position.x = (battle.shake % 2 ? 0.09 : -0.09);
      battle.shake--;
    } else battleCam.position.x = 0;

    renderer.render(battleScene, battleCam);
  }

  return { init, setMap, renderWorld, renderBattle, hideItem, snapCamera };
})();
