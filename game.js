// ============================================================
// POKeMON FRLG: SEVII EDITION - engine
// 3D world rendered by render3d.js (WebGL, HD-2D style);
// UI drawn on a transparent 240x160 2D canvas layered on top.
// ============================================================

'use strict';

const VW = 240, VH = 160, TS = 16;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const SAVE_KEY = 'frlg-sevii-save-v2';

// ---------- Input ----------
const keys = {};
const pressed = {}; // consumed edge-trigger
window.addEventListener('keydown', e => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Enter'].includes(e.key)) e.preventDefault();
  if (!keys[e.key]) pressed[e.key] = true;
  keys[e.key] = true;
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

function tapped(...ks) {
  for (const k of ks) if (pressed[k]) return true;
  return false;
}
const tapA = () => tapped('z', 'Z', 'Enter', ' ');
const tapB = () => tapped('x', 'X', 'Escape');
const tapUp = () => tapped('ArrowUp', 'w', 'W');
const tapDown = () => tapped('ArrowDown', 's', 'S');
const tapLeft = () => tapped('ArrowLeft', 'a', 'A');
const tapRight = () => tapped('ArrowRight', 'd', 'D');

// ---------- Audio blips ----------
let audioCtx = null;
function blip(freq, dur = 0.06, vol = 0.04) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) { /* audio unavailable */ }
}

// ---------- RNG / helpers ----------
const rand = n => Math.floor(Math.random() * n);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- Pokemon construction ----------
const IV = 20;
function calcStats(speciesKey, level) {
  const b = SPECIES[speciesKey].base;
  const hp = Math.floor((2 * b[0] + IV) * level / 100) + level + 10;
  const st = i => Math.floor((2 * b[i] + IV) * level / 100) + 5;
  return { hp, atk: st(1), def: st(2), spa: st(3), spd: st(4), spe: st(5) };
}

function makeMon(speciesKey, level, moveNames) {
  const stats = calcStats(speciesKey, level);
  return {
    species: speciesKey,
    name: SPECIES[speciesKey].name,
    level,
    stats,
    hp: stats.hp,
    status: null,          // PAR | PSN | BRN | SLP | FRZ
    sleepTurns: 0,
    exp: 0,
    expNext: expToNext(level),
    moves: moveNames.map(m => ({ name: m, pp: MOVES[m].pp, maxPp: MOVES[m].pp })),
  };
}
function expToNext(level) { return level * level * 4; }

// ---------- Game state ----------
const game = {
  state: 'title',          // title | world | dialog | menu | party | bag | battle | fade
  map: 'oneisland',
  px: 12, py: 32,          // tile position
  ox: 0, oy: 0,            // pixel offset while walking
  dir: 'down',
  walking: false,
  walkFrame: 0,
  party: [],
  bag: [],
  gotGift: false,
  collected: {},
  beaten: {},
  steps: 0,
  frame: 0,
};

function newGame() {
  game.party = STARTING_PARTY.map(p => makeMon(p.species, p.level, p.moves));
  game.bag = STARTING_BAG.map(s => ({ ...s }));
  game.map = 'oneisland'; game.px = 13; game.py = 49; game.dir = 'up';
  game.gotGift = false;
  game.collected = {}; game.beaten = {};
  R3D.setMap(game.map);
  startDialog([
    'ONE ISLAND - SEVII ISLANDS',
    'You step off the SEAGALLOP ferry', 'onto the harbor pier.',
    'After conquering the POKeMON', 'LEAGUE, BILL asked you to visit', 'CELIO at the NETWORK CENTER here.',
    'KINDLE ROAD, EMBER SPA and', 'MT. EMBER lie to the north.', 'Good luck, CHAMPION!',
  ], () => { game.state = 'world'; });
}

// ---------- Save / load ----------
function saveGame() {
  const s = {
    map: game.map, px: game.px, py: game.py, dir: game.dir,
    party: game.party, bag: game.bag, gotGift: game.gotGift,
    collected: game.collected, beaten: game.beaten,
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); return true; }
  catch (e) { return false; }
}
function loadGame() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!s || !s.party) return false;
    Object.assign(game, s);
    game.collected = game.collected || {};
    game.beaten = game.beaten || {};
    R3D.setMap(game.map);
    return true;
  } catch (e) { return false; }
}
const hasSave = () => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };

// ---------- Dialog ----------
const dialog = { lines: [], page: 0, chars: 0, cb: null, choice: null, choiceIdx: 0 };
function startDialog(lines, cb, choice) {
  dialog.lines = lines.slice();
  dialog.page = 0; dialog.chars = 0;
  dialog.cb = cb || null;
  dialog.choice = choice || null; // {options:[..], cb(idx)}
  dialog.choiceIdx = 0;
  game.prevState = (game.state === 'dialog') ? game.prevState : game.state;
  game.state = 'dialog';
}

function updateDialog() {
  const pageLines = dialog.lines.slice(dialog.page, dialog.page + 2);
  const total = pageLines.join('').length;
  if (dialog.chars < total) {
    dialog.chars += (keys['z'] || keys['Enter']) ? 3 : 1.5;
    if (tapA()) dialog.chars = total;
    return;
  }
  const lastPage = dialog.page + 2 >= dialog.lines.length;
  if (lastPage && dialog.choice) {
    if (tapUp() || tapDown()) { dialog.choiceIdx = 1 - dialog.choiceIdx; blip(700); }
    if (tapA()) {
      const cb = dialog.choice.cb, idx = dialog.choiceIdx;
      dialog.choice = null; blip(900);
      cb(idx);
    }
    return;
  }
  if (tapA()) {
    blip(600, 0.04);
    if (!lastPage) { dialog.page += 2; dialog.chars = 0; }
    else {
      const cb = dialog.cb;
      game.state = game.prevState === 'battle' ? 'battle' : 'world';
      if (cb) cb();
    }
  }
}

// ---------- Map helpers ----------
const SOLID_TILES = new Set(['#', 'R', 'W', 'A', 'a', 'B', 'b', '!', '4', '~', 'w', 'c', 'h', 'p', 'k', 't']);
function tileAt(mapKey, x, y) {
  const g = MAPS[mapKey].grid;
  if (y < 0 || y >= g.length || x < 0 || x >= g[0].length) return '#';
  return g[y][x];
}
function npcAt(mapKey, x, y) {
  return MAPS[mapKey].npcs.find(n => n.x === x && n.y === y) || null;
}
function isBlocked(mapKey, x, y) {
  if (npcAt(mapKey, x, y)) return true;
  const t = tileAt(mapKey, x, y);
  if (t === 'I') return !game.collected[x + ',' + y]; // item ball blocks until picked up
  return SOLID_TILES.has(t);
}

// ---------- World update ----------
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function updateWorld() {
  game.frame++;
  if (game.walking) {
    game.walkFrame++;
    const [dx, dy] = DIRS[game.dir];
    game.ox = dx * game.walkFrame * 2;
    game.oy = dy * game.walkFrame * 2;
    if (game.walkFrame >= 8) {
      game.px += dx; game.py += dy;
      game.ox = 0; game.oy = 0; game.walking = false; game.walkFrame = 0;
      onStep();
    }
    return;
  }

  if (tapA()) { interact(); return; }
  if (tapB() || tapped('m', 'M')) { openMenu(); return; }

  let dir = null;
  if (keys['ArrowUp'] || keys['w']) dir = 'up';
  else if (keys['ArrowDown'] || keys['s']) dir = 'down';
  else if (keys['ArrowLeft'] || keys['a']) dir = 'left';
  else if (keys['ArrowRight'] || keys['d']) dir = 'right';
  if (!dir) return;

  if (game.dir !== dir) { game.dir = dir; return; }
  const [dx, dy] = DIRS[dir];
  const nx = game.px + dx, ny = game.py + dy;

  const warp = MAPS[game.map].warps[nx + ',' + ny];
  if (warp) { doWarp(warp); return; }
  if (isBlocked(game.map, nx, ny)) return;
  game.walking = true; game.walkFrame = 0;
}

function doWarp(warp) {
  fadeOut(() => {
    game.map = warp.map; game.px = warp.x; game.py = warp.y; game.dir = warp.dir;
    game.walking = false; game.ox = game.oy = 0;
    R3D.setMap(game.map);
    fadeIn(() => { game.state = 'world'; });
  });
}

function onStep() {
  game.steps++;
  const t = tileAt(game.map, game.px, game.py);
  if (t === 'T' && Math.random() < 0.14) startWildBattle();
}

function interact() {
  const [dx, dy] = DIRS[game.dir];
  let tx = game.px + dx, ty = game.py + dy;
  // talk across counters
  if (tileAt(game.map, tx, ty) === 'c' && npcAt(game.map, tx + dx, ty + dy)) { tx += dx; ty += dy; }
  const npc = npcAt(game.map, tx, ty);
  if (npc) {
    // face the player
    npc.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[game.dir];
    if (npc.trainer) {
      if (game.beaten[npc.trainer.id]) startDialog(npc.trainer.after);
      else startDialog(npc.trainer.intro, () => startTrainerBattle(npc));
    } else if (npc.action === 'heal') {
      startDialog(npc.lines, null, {
        options: ['YES', 'NO'],
        cb: idx => {
          if (idx === 0) {
            healParty(); blip(1000, .1); blip(1300, .1);
            startDialog(['...', 'Your POKeMON are fully healed!', 'We hope to see you again!']);
          } else startDialog(['We hope to see you again!']);
        },
      });
    } else if (npc.action === 'gift' && !game.gotGift) {
      startDialog(npc.lines, () => {
        game.gotGift = true;
        for (const g of GIFT_ITEMS) addItem(g.item, g.qty);
        const names = GIFT_ITEMS.map(g => g.qty + ' ' + g.item).join(' and ');
        startDialog(['You received ' + names + '!']);
      });
    } else if (npc.action === 'gift') {
      startDialog(['How is your journey going?', 'Do come visit an old lady again.']);
    } else {
      startDialog(npc.lines);
    }
    return;
  }
  const sign = MAPS[game.map].signs[tx + ',' + ty];
  if (sign) { startDialog(sign); return; }
  const t = tileAt(game.map, tx, ty);
  if (t === 'I') {
    const key = tx + ',' + ty;
    const ball = game.map === 'oneisland' && ITEM_BALLS[key];
    if (ball && !game.collected[key]) {
      game.collected[key] = true;
      addItem(ball.item, ball.qty);
      R3D.hideItem(key);
      blip(1200, .1);
      startDialog(['You found ' + ball.qty + ' ' + ball.item + '!']);
    }
    return;
  }
  if (t === '~') {
    blip(1000, .1); blip(1300, .12);
    healParty();
    startDialog(['You soaked in the EMBER SPA\'s', 'soothing hot spring...', 'Your POKeMON were fully healed!']);
    return;
  }
  if (t === '4') startDialog(['The door is locked.', 'Somebody must be out on the KINDLE', 'ROAD...']);
  if (t === 'p' && game.map === 'center') startDialog(['It\'s the POKeMON NETWORK MACHINE.', 'CELIO is fine-tuning it.']);
  if (t === 'W') startDialog(['The sea sparkles in the sunlight.', 'The other SEVII ISLANDS lie far', 'beyond the horizon.']);
}

function healParty() {
  for (const p of game.party) {
    p.hp = p.stats.hp; p.status = null; p.sleepTurns = 0;
    for (const m of p.moves) m.pp = m.maxPp;
  }
}
function addItem(name, qty) {
  const e = game.bag.find(b => b.item === name);
  if (e) e.qty += qty; else game.bag.push({ item: name, qty });
}

// ---------- Fade ----------
const fade = { alpha: 0, dir: 0, cb: null, bg: 'world' };
function fadeOut(cb, bg) { fade.dir = 1; fade.cb = cb; fade.bg = bg || 'world'; game.state = 'fade'; }
function fadeIn(cb, bg) { fade.dir = -1; fade.alpha = 1; fade.cb = cb; fade.bg = bg || 'world'; game.state = 'fade'; }
function updateFade() {
  fade.alpha += fade.dir * 0.08;
  if (fade.dir > 0 && fade.alpha >= 1) { fade.alpha = 1; const cb = fade.cb; fade.cb = null; if (cb) cb(); }
  if (fade.dir < 0 && fade.alpha <= 0) { fade.alpha = 0; const cb = fade.cb; fade.cb = null; game.state = 'world'; if (cb) cb(); }
}

// ---------- Menu ----------
const menu = { idx: 0, items: ['POKeMON', 'BAG', 'SAVE', 'EXIT'] };
function openMenu() { menu.idx = 0; game.state = 'menu'; blip(800); }
function updateMenu() {
  if (tapUp()) { menu.idx = (menu.idx + menu.items.length - 1) % menu.items.length; blip(700); }
  if (tapDown()) { menu.idx = (menu.idx + 1) % menu.items.length; blip(700); }
  if (tapB()) { game.state = 'world'; return; }
  if (!tapA()) return;
  blip(900);
  const sel = menu.items[menu.idx];
  if (sel === 'POKeMON') { party.idx = 0; party.mode = 'view'; game.state = 'party'; }
  else if (sel === 'BAG') { bagUI.idx = 0; bagUI.mode = 'menu'; game.state = 'bag'; }
  else if (sel === 'SAVE') {
    const ok = saveGame();
    startDialog(ok ? ['Saved the game!'] : ['Save failed...']);
  }
  else game.state = 'world';
}

// ---------- Party screen ----------
const party = { idx: 0, mode: 'view' }; // view | switch (battle)
function updateParty() {
  if (tapUp()) { party.idx = (party.idx + game.party.length - 1) % game.party.length; blip(700); }
  if (tapDown()) { party.idx = (party.idx + 1) % game.party.length; blip(700); }
  if (tapB()) {
    // can't cancel out of a forced switch after a faint
    if (party.mode === 'switch' && playerMon().hp <= 0) { blip(200); return; }
    game.state = party.mode === 'switch' ? 'battle' : 'menu';
    return;
  }
  if (tapA() && party.mode === 'switch') {
    const mon = game.party[party.idx];
    if (mon.hp <= 0 || party.idx === battle.activeIdx) { blip(200); return; }
    battle.pendingSwitch = party.idx;
    game.state = 'battle';
    battleQueuePlayerSwitch();
  }
}

// ---------- Bag ----------
const bagUI = { idx: 0, mode: 'menu' }; // menu | battle
function updateBag() {
  const n = game.bag.length;
  if (n === 0) { if (tapA() || tapB()) game.state = bagUI.mode === 'battle' ? 'battle' : 'menu'; return; }
  if (tapUp()) { bagUI.idx = (bagUI.idx + n - 1) % n; blip(700); }
  if (tapDown()) { bagUI.idx = (bagUI.idx + 1) % n; blip(700); }
  if (tapB()) { game.state = bagUI.mode === 'battle' ? 'battle' : 'menu'; return; }
  if (!tapA()) return;
  const slot = game.bag[bagUI.idx];
  const item = ITEMS[slot.item];
  blip(900);
  if (bagUI.mode === 'battle') {
    useBattleItem(slot, item);
    return;
  }
  if (item.kind === 'heal') {
    const mon = game.party.find(p => p.hp > 0 && p.hp < p.stats.hp) || game.party[0];
    if (mon.hp >= mon.stats.hp) { startDialog(['It would have no effect.']); return; }
    const healed = Math.min(item.amt, mon.stats.hp - mon.hp);
    mon.hp += healed;
    consumeItem(slot);
    startDialog([mon.name + ' recovered ' + healed + ' HP!']);
  } else {
    startDialog(['OAK\'s words echoed...', 'There\'s a time and place for', 'everything!']);
  }
}
function consumeItem(slot) {
  slot.qty--;
  if (slot.qty <= 0) {
    game.bag.splice(game.bag.indexOf(slot), 1);
    bagUI.idx = clamp(bagUI.idx, 0, Math.max(0, game.bag.length - 1));
  }
}

// ============================================================
// BATTLE
// ============================================================
const battle = {
  foe: null, activeIdx: 0, phase: 'intro', menuIdx: 0, moveIdx: 0,
  queue: [], pendingSwitch: -1, foeAnim: 0, playerAnim: 0, shake: 0,
  catchShakes: 0, expGain: 0,
  trainer: null, trainerParty: [], foeIdx: 0,
};

const wildOrFoe = () => (battle.trainer ? 'Foe ' : 'Wild ');

function stageMult(stg) { return stg >= 0 ? (2 + stg) / 2 : 2 / (2 - stg); }
function freshStages() { return { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0 }; }

function startWildBattle() {
  // weighted pick
  const total = WILD_TABLE.reduce((s, w) => s + w.weight, 0);
  let r = rand(total), pick = WILD_TABLE[0];
  for (const w of WILD_TABLE) { if (r < w.weight) { pick = w; break; } r -= w.weight; }
  const lv = pick.minLv + rand(pick.maxLv - pick.minLv + 1);
  const foe = makeMon(pick.species, lv, pick.moves);
  battle.trainer = null; battle.trainerParty = []; battle.foeIdx = 0;
  const lead = game.party.find(p => p.hp > 0);
  beginBattle(foe, ['Wild ' + foe.name + ' appeared!', 'Go! ' + lead.name + '!']);
}

function startTrainerBattle(npc) {
  const tr = npc.trainer;
  battle.trainer = { id: tr.id, name: npc.name, npc };
  battle.trainerParty = tr.party.map(p => makeMon(p.species, p.level, p.moves));
  battle.foeIdx = 0;
  const foe = battle.trainerParty[0];
  const lead = game.party.find(p => p.hp > 0);
  beginBattle(foe, [
    npc.name + ' would like to battle!',
    npc.name + ' sent out ' + foe.name + '!',
    'Go! ' + lead.name + '!',
  ]);
}

function beginBattle(foe, introMsgs) {
  battle.foe = foe;
  battle.foe.stages = freshStages();
  battle.activeIdx = game.party.findIndex(p => p.hp > 0);
  for (const p of game.party) p.stages = freshStages();
  battle.phase = 'msg';
  battle.menuIdx = 0; battle.moveIdx = 0;
  battle.queue = [];
  battle.foeAnim = 0; battle.playerAnim = 0;
  blip(200, .15, .06); blip(150, .2, .06);
  fadeOut(() => {
    game.state = 'battle';
    introMsgs.forEach((m, i) => {
      queueMsg(m, i === introMsgs.length - 1 ? () => { battle.phase = 'menu'; } : null);
    });
    fade.alpha = 0;
  });
}

const playerMon = () => game.party[battle.activeIdx];

// message queue: {text, cb}
function queueMsg(text, cb) { battle.queue.push({ text, cb }); }
const battleMsg = { text: '', chars: 0, cb: null };

function updateBattle() {
  game.frame++;
  if (battle.shake > 0) battle.shake--;

  if (battle.phase === 'msg') {
    if (!battleMsg.text && battle.queue.length) {
      const m = battle.queue.shift();
      battleMsg.text = m.text; battleMsg.chars = 0; battleMsg.cb = m.cb;
    }
    if (battleMsg.text) {
      if (battleMsg.chars < battleMsg.text.length) {
        battleMsg.chars += (keys['z'] || keys['Enter']) ? 3 : 1.5;
        return;
      }
      if (tapA()) {
        const cb = battleMsg.cb;
        battleMsg.text = ''; battleMsg.cb = null;
        if (cb) cb();
      }
      return;
    }
    if (!battle.queue.length && battle.phase === 'msg') battle.phase = 'menu';
    return;
  }

  if (battle.phase === 'menu') {
    const col = battle.menuIdx % 2, row = Math.floor(battle.menuIdx / 2);
    if (tapLeft() && col === 1) { battle.menuIdx--; blip(700); }
    if (tapRight() && col === 0) { battle.menuIdx++; blip(700); }
    if (tapUp() && row === 1) { battle.menuIdx -= 2; blip(700); }
    if (tapDown() && row === 0) { battle.menuIdx += 2; blip(700); }
    if (!tapA()) return;
    blip(900);
    const sel = ['FIGHT', 'BAG', 'POKeMON', 'RUN'][battle.menuIdx];
    if (sel === 'FIGHT') { battle.phase = 'moves'; battle.moveIdx = 0; }
    else if (sel === 'BAG') { bagUI.idx = 0; bagUI.mode = 'battle'; game.state = 'bag'; }
    else if (sel === 'POKeMON') { party.idx = 0; party.mode = 'switch'; game.state = 'party'; }
    else { // RUN
      battle.phase = 'msg';
      if (battle.trainer) queueMsg('No! There\'s no running from a', () => {
        queueMsg('TRAINER battle!', () => { battle.phase = 'menu'; });
        battle.phase = 'msg';
      });
      else if (Math.random() < 0.85) queueMsg('Got away safely!', () => endBattle());
      else queueMsg('Can\'t escape!', () => doTurn(null));
    }
    return;
  }

  if (battle.phase === 'moves') {
    const moves = playerMon().moves;
    const col = battle.moveIdx % 2, row = Math.floor(battle.moveIdx / 2);
    if (tapLeft() && col === 1) { battle.moveIdx--; blip(700); }
    if (tapRight() && col === 0 && battle.moveIdx + 1 < moves.length) { battle.moveIdx++; blip(700); }
    if (tapUp() && row === 1) { battle.moveIdx -= 2; blip(700); }
    if (tapDown() && row === 0 && battle.moveIdx + 2 < moves.length) { battle.moveIdx += 2; blip(700); }
    if (tapB()) { battle.phase = 'menu'; return; }
    if (!tapA()) return;
    const mv = moves[battle.moveIdx];
    if (mv.pp <= 0) { blip(200); return; }
    blip(900);
    doTurn(mv);
    return;
  }
}

// ---------- Turn resolution ----------
function effSpeed(mon) {
  let s = mon.stats.spe * stageMult(mon.stages.spe);
  if (mon.status === 'PAR') s *= 0.25;
  return s;
}

function doTurn(playerMove) {
  battle.phase = 'msg';
  const foe = battle.foe;
  const foeMove = pickFoeMove(foe);
  const pm = playerMon();

  let order;
  if (!playerMove) order = [['foe', foeMove]];
  else {
    const pPrio = MOVES[playerMove.name].prio || 0;
    const fPrio = MOVES[foeMove.name].prio || 0;
    const pFirst = pPrio !== fPrio ? pPrio > fPrio
      : effSpeed(pm) === effSpeed(foe) ? Math.random() < 0.5
      : effSpeed(pm) > effSpeed(foe);
    order = pFirst ? [['player', playerMove], ['foe', foeMove]] : [['foe', foeMove], ['player', playerMove]];
  }

  runSteps(order.map(([who, mv]) => ({ who, mv })), 0);
}

function runSteps(steps, i) {
  const foe = battle.foe;
  if (i >= steps.length) {
    // end-of-turn effects
    endOfTurn(() => {
      if (checkFaints()) return;
      battle.phase = 'menu';
    });
    return;
  }
  const { who, mv } = steps[i];
  const user = who === 'player' ? playerMon() : foe;
  const target = who === 'player' ? foe : playerMon();
  if (user.hp <= 0 || target.hp <= 0) { runSteps(steps, i + 1); return; }

  const next = () => {
    if (checkFaints()) return;
    runSteps(steps, i + 1);
  };
  executeMove(who, user, target, mv, next);
}

function executeMove(who, user, target, mv, done) {
  const foePrefix = who === 'foe' ? wildOrFoe() : '';
  const tgtPrefix = who === 'foe' ? '' : wildOrFoe();
  battle.phase = 'msg';

  // flinch
  if (user.flinched) {
    user.flinched = false;
    queueMsg(foePrefix + user.name + ' flinched!', done);
    return;
  }
  // status prevention
  if (user.status === 'SLP') {
    if (user.sleepTurns > 0) { user.sleepTurns--; queueMsg(foePrefix + user.name + ' is fast asleep.', done); return; }
    user.status = null; queueMsg(foePrefix + user.name + ' woke up!', () => attackWith());
    return;
  }
  if (user.status === 'FRZ') {
    if (Math.random() < 0.2) { user.status = null; queueMsg(foePrefix + user.name + ' thawed out!', () => attackWith()); }
    else queueMsg(foePrefix + user.name + ' is frozen solid!', done);
    return;
  }
  if (user.status === 'PAR' && Math.random() < 0.25) {
    queueMsg(foePrefix + user.name + ' is fully paralyzed!', done);
    return;
  }
  attackWith();

  function attackWith() {
    mv.pp = Math.max(0, mv.pp - 1);
    const md = MOVES[mv.name];
    queueMsg(foePrefix + user.name + ' used ' + mv.name + '!', () => {
      if (who === 'player') battle.playerAnim = 10; else battle.foeAnim = 10;
      blip(300, .08);
      // accuracy
      if (!md.neverMiss && md.acc > 0) {
        const accMult = stageMult(user.stages.acc);
        if (Math.random() * 100 >= md.acc * accMult) {
          queueMsg('But it missed!', done);
          battle.phase = 'msg';
          return;
        }
      }
      if (md.pow > 0) {
        const { dmg, effMult, crit } = calcDamage(user, target, md);
        target.hp = Math.max(0, target.hp - dmg);
        battle.shake = 8;
        blip(effMult > 1 ? 150 : 250, .12, .06);
        const msgs = [];
        if (crit) msgs.push('A critical hit!');
        if (effMult > 1) msgs.push('It\'s super effective!');
        else if (effMult === 0) msgs.push('It doesn\'t affect ' + tgtPrefix + target.name + '...');
        else if (effMult < 1) msgs.push('It\'s not very effective...');
        chainMsgs(msgs, () => applyEffects());
      } else {
        applyEffects();
      }
      battle.phase = 'msg';
    });
    battle.phase = 'msg';

    function applyEffects() {
      if (target.hp <= 0) { done(); return; }
      const e = md.eff;
      const after = [];
      if (e) {
        const ch = e.ch === undefined ? 100 : e.ch;
        if (Math.random() * 100 < ch) {
          if (e.status && !target.status && md.pow >= 0) {
            if (!(md.type === 'ELECTRIC' && SPECIES[target.species].types.includes('GROUND')) &&
                !(e.status === 'PAR' && SPECIES[target.species].types.includes('ELECTRIC')) &&
                !(e.status === 'PSN' && SPECIES[target.species].types.includes('POISON')) &&
                !(e.status === 'BRN' && SPECIES[target.species].types.includes('FIRE')) &&
                !(e.status === 'FRZ' && SPECIES[target.species].types.includes('ICE'))) {
              target.status = e.status;
              if (e.status === 'SLP') target.sleepTurns = 1 + rand(3);
              const words = { PAR: 'was paralyzed!', PSN: 'was poisoned!', BRN: 'was burned!', FRZ: 'was frozen solid!', SLP: 'fell asleep!' };
              after.push(tgtPrefix + target.name + ' ' + words[e.status]);
            }
          }
          if (e.stat) {
            const whoM = e.who === 'self' ? user : target;
            const whoP = e.who === 'self' ? foePrefix : tgtPrefix;
            for (const st of e.stat.split('+')) {
              const old = whoM.stages[st];
              whoM.stages[st] = clamp(old + e.stg, -6, 6);
              if (whoM.stages[st] !== old) {
                const label = { atk: 'ATTACK', def: 'DEFENSE', spa: 'SP. ATK', spd: 'SP. DEF', spe: 'SPEED', acc: 'accuracy' }[st];
                after.push(whoP + whoM.name + '\'s ' + label + (e.stg > 0 ? (e.stg > 1 ? ' rose sharply!' : ' rose!') : (e.stg < -1 ? ' fell harshly!' : ' fell!')));
              }
            }
          }
          if (e.heal) {
            const amt = Math.min(Math.floor(user.stats.hp * e.heal / 100), user.stats.hp - user.hp);
            if (amt > 0) { user.hp += amt; after.push(foePrefix + user.name + ' regained health!'); }
            else after.push('But it failed!');
            if (md.selfSleep && amt > 0) { user.status = 'SLP'; user.sleepTurns = 2; after.push(foePrefix + user.name + ' went to sleep!'); }
          }
          if (e.flinch && md.pow > 0) {
            target.flinched = Math.random() * 100 < e.flinch;
          }
        }
      }
      chainMsgs(after, done);
    }
  }
}

function chainMsgs(msgs, done) {
  if (!msgs.length) { done(); return; }
  queueMsg(msgs[0], () => chainMsgs(msgs.slice(1), done));
}

function calcDamage(user, target, md) {
  const special = SPECIAL_TYPES.includes(md.type);
  let atk = special ? user.stats.spa * stageMult(user.stages.spa) : user.stats.atk * stageMult(user.stages.atk);
  let def = special ? target.stats.spd * stageMult(target.stages.spd) : target.stats.def * stageMult(target.stages.def);
  if (user.status === 'BRN' && !special) atk *= 0.5;
  const crit = Math.random() < 1 / 16;
  let dmg = Math.floor(Math.floor(Math.floor(2 * user.level / 5 + 2) * md.pow * atk / def) / 50) + 2;
  if (crit) dmg *= 2;
  // STAB
  if (SPECIES[user.species].types.includes(md.type)) dmg *= 1.5;
  // type effectiveness
  let effMult = 1;
  for (const t of SPECIES[target.species].types) {
    const row = TYPE_CHART[md.type] || {};
    effMult *= (row[t] === undefined ? 1 : row[t]);
  }
  dmg *= effMult;
  dmg *= (85 + rand(16)) / 100;
  dmg = Math.max(effMult === 0 ? 0 : 1, Math.floor(dmg));
  return { dmg, effMult, crit };
}

function pickFoeMove(foe) {
  const usable = foe.moves.filter(m => m.pp > 0);
  if (!usable.length) return { name: 'TACKLE', pp: 1, maxPp: 1 };
  // prefer damaging moves 75% of the time
  const dmgMoves = usable.filter(m => MOVES[m.name].pow > 0);
  if (dmgMoves.length && Math.random() < 0.75) return dmgMoves[rand(dmgMoves.length)];
  return usable[rand(usable.length)];
}

function endOfTurn(done) {
  const msgs = [];
  for (const [mon, prefix] of [[playerMon(), ''], [battle.foe, wildOrFoe()]]) {
    if (mon.hp <= 0) continue;
    if (mon.status === 'PSN' || mon.status === 'BRN') {
      const amt = Math.max(1, Math.floor(mon.stats.hp / 8));
      mon.hp = Math.max(0, mon.hp - amt);
      msgs.push(prefix + mon.name + (mon.status === 'PSN' ? ' is hurt by poison!' : ' is hurt by its burn!'));
    }
  }
  chainMsgs(msgs, () => { if (!checkFaints()) done(); });
}

function checkFaints() {
  const foe = battle.foe, pm = playerMon();
  if (foe.hp <= 0) {
    queueMsg(wildOrFoe() + foe.name + ' fainted!', () => giveExp(afterFoeFainted));
    battle.phase = 'msg';
    return true;
  }
  if (pm.hp <= 0) {
    queueMsg(pm.name + ' fainted!', () => {
      const alive = game.party.filter(p => p.hp > 0);
      if (!alive.length) {
        queueMsg('You are out of usable POKeMON!', () => {
          queueMsg('You blacked out!', () => {
            endBattle(() => {
              healParty();
              game.map = 'center'; game.px = 4; game.py = 4; game.dir = 'down';
              R3D.setMap('center');
              startDialog(['You scurried back to the POKeMON', 'CENTER...']);
            });
          });
          battle.phase = 'msg';
        });
        battle.phase = 'msg';
      } else {
        party.idx = 0; party.mode = 'switch';
        game.state = 'party';
      }
    });
    battle.phase = 'msg';
    return true;
  }
  return false;
}

function giveExp(done) {
  const foe = battle.foe, pm = playerMon();
  const exp = Math.floor(SPECIES[foe.species].exp * foe.level / 7);
  pm.exp += exp;
  queueMsg(pm.name + ' gained ' + exp + ' EXP. Points!', () => {
    let leveled = false;
    while (pm.exp >= pm.expNext) {
      pm.exp -= pm.expNext;
      pm.level++;
      pm.expNext = expToNext(pm.level);
      const old = pm.stats;
      pm.stats = calcStats(pm.species, pm.level);
      pm.hp = Math.min(pm.stats.hp, pm.hp + (pm.stats.hp - old.hp));
      leveled = true;
    }
    if (leveled) {
      blip(800, .08); blip(1000, .08); blip(1300, .12);
      queueMsg(pm.name + ' grew to LV. ' + pm.level + '!', done);
    } else done();
    battle.phase = 'msg';
  });
  battle.phase = 'msg';
}

function afterFoeFainted() {
  if (battle.trainer && battle.foeIdx + 1 < battle.trainerParty.length) {
    battle.foeIdx++;
    const next = battle.trainerParty[battle.foeIdx];
    next.stages = freshStages();
    battle.foe = next;
    queueMsg(battle.trainer.name + ' sent out ' + next.name + '!', () => { battle.phase = 'menu'; });
    battle.phase = 'msg';
  } else if (battle.trainer) {
    const tr = battle.trainer.npc.trainer;
    const finish = () => {
      queueMsg('You defeated ' + battle.trainer.name + '!', () => {
        game.beaten[tr.id] = true;
        endBattle(() => startDialog(tr.win));
      });
      battle.phase = 'msg';
    };
    if (tr.defeat) {
      queueMsg(battle.trainer.name + ': ' + tr.defeat, finish);
      battle.phase = 'msg';
    } else finish();
  } else {
    endBattle();
  }
}

function endBattle(cb) {
  battleMsg.text = ''; battle.queue = [];
  for (const p of game.party) { p.stages = freshStages(); p.flinched = false; }
  fadeOut(() => {
    battle.foe = null;
    battle.trainer = null; battle.trainerParty = []; battle.foeIdx = 0;
    fadeIn();
    if (cb) cb();
  }, 'battle');
}

function battleQueuePlayerSwitch() {
  const newIdx = battle.pendingSwitch;
  battle.pendingSwitch = -1;
  const old = playerMon();
  const fresh = game.party[newIdx];
  battle.phase = 'msg';
  const wasFainted = old.hp <= 0;
  const doSwitch = () => {
    battle.activeIdx = newIdx;
    fresh.stages = freshStages();
    queueMsg('Go! ' + fresh.name + '!', () => {
      if (wasFainted) { battle.phase = 'menu'; return; }
      // switching costs the turn - foe attacks
      const foeMove = pickFoeMove(battle.foe);
      executeMove('foe', battle.foe, playerMon(), foeMove, () => {
        endOfTurn(() => { if (!checkFaints()) battle.phase = 'menu'; });
      });
    });
  };
  if (wasFainted) doSwitch();
  else queueMsg(old.name + ', that\'s enough!', doSwitch);
}

function useBattleItem(slot, item) {
  game.state = 'battle';
  battle.phase = 'msg';
  if (item.kind === 'heal') {
    const pm = playerMon();
    if (pm.hp >= pm.stats.hp) { queueMsg('It would have no effect.', () => { battle.phase = 'menu'; }); return; }
    const healed = Math.min(item.amt, pm.stats.hp - pm.hp);
    pm.hp += healed;
    consumeItem(slot);
    blip(1000, .1);
    queueMsg(pm.name + ' recovered ' + healed + ' HP!', () => {
      const foeMove = pickFoeMove(battle.foe);
      executeMove('foe', battle.foe, playerMon(), foeMove, () => {
        endOfTurn(() => { if (!checkFaints()) battle.phase = 'menu'; });
      });
    });
    return;
  }
  // ball
  if (battle.trainer) {
    queueMsg('The TRAINER blocked the BALL!', () => {
      queueMsg('Don\'t be a thief!', () => { battle.phase = 'menu'; });
      battle.phase = 'msg';
    });
    return;
  }
  consumeItem(slot);
  throwBall(item.bonus);
}

function throwBall(bonus) {
  const foe = battle.foe;
  queueMsg('You threw a POKe BALL!', () => {
    const maxHp = foe.stats.hp;
    const statusBonus = (foe.status === 'SLP' || foe.status === 'FRZ') ? 2 : foe.status ? 1.5 : 1;
    const a = Math.min(255, Math.floor((3 * maxHp - 2 * foe.hp) * SPECIES[foe.species].catchRate * bonus * statusBonus / (3 * maxHp)));
    let shakes = 0;
    if (a >= 255) shakes = 4;
    else {
      const b = Math.floor(1048560 / Math.sqrt(Math.sqrt(16711680 / a)));
      for (let i = 0; i < 4; i++) if (rand(65536) < b) shakes++; else break;
    }
    battle.catchShakes = shakes;
    const shakeMsgs = [];
    for (let i = 0; i < Math.min(shakes, 3); i++) shakeMsgs.push('...' + '!'.repeat(i + 1));
    chainMsgs(shakeMsgs, () => {
      if (shakes === 4) {
        blip(1200, .15);
        queueMsg('Gotcha! ' + foe.name + ' was caught!', () => {
          queueMsg(foe.name + ' was sent to BILL\'s PC.', () => endBattle());
          battle.phase = 'msg';
        });
      } else {
        blip(250, .12);
        queueMsg('Oh no! The POKeMON broke free!', () => {
          const foeMove = pickFoeMove(foe);
          executeMove('foe', foe, playerMon(), foeMove, () => {
            endOfTurn(() => { if (!checkFaints()) battle.phase = 'menu'; });
          });
        });
        battle.phase = 'msg';
      }
      battle.phase = 'msg';
    });
    battle.phase = 'msg';
  });
  battle.phase = 'msg';
}

// ============================================================
// RENDERING (UI layer)
// ============================================================
function px(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

// pre-rendered sprite canvases for crisp scaled drawing
const monCanvasCache = {};
function monCanvas(species) {
  if (monCanvasCache[species]) return monCanvasCache[species];
  const s = SPRITES[species];
  const c = document.createElement('canvas');
  c.width = s.px[0].length; c.height = s.px.length;
  const g = c.getContext('2d');
  for (let r = 0; r < s.px.length; r++) {
    for (let i = 0; i < s.px[r].length; i++) {
      const ch = s.px[r][i];
      if (ch === '.') continue;
      g.fillStyle = s.pal[ch] || '#f0f';
      g.fillRect(i, r, 1, 1);
    }
  }
  return (monCanvasCache[species] = c);
}
function drawMon(species, x, y, size) {
  ctx.imageSmoothingEnabled = false;
  // small icons use the crisp 24px base; big art uses the smoothed 96px version
  const src = size >= 40 ? R3D.bigMonCanvas(species) : monCanvas(species);
  ctx.drawImage(src, x, y, size, size);
}

// ---------- World draw (3D scene + optional location banner) ----------
function drawWorld() {
  game.frame++;
  R3D.renderWorld();
}

// ---------- UI primitives ----------
// FRLG-style frames: white dialog box with blue frame, cream battle info boxes
function drawBox(x, y, w, h) {
  px(x, y, w, h, '#f8f8f8');
  ctx.strokeStyle = '#4870a8'; ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.strokeStyle = '#a8c0e0'; ctx.lineWidth = 1;
  ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
}

function drawInfoBox(x, y, w, h) {
  px(x, y, w, h, '#f8f0d8');
  ctx.strokeStyle = '#584838'; ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  px(x + 2, y + h - 4, w - 4, 2, '#d8c8a0');
}

function drawMsgPanel(x, y, w, h) {
  px(x, y, w, h, '#b05038');
  px(x + 3, y + 3, w - 6, h - 6, '#28384e');
  ctx.strokeStyle = '#e8d8b0'; ctx.lineWidth = 1;
  ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
}

function text(str, x, y, color = '#383838', size = 8) {
  ctx.font = 'bold ' + size + 'px monospace';
  ctx.textBaseline = 'top';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function drawHPBar(x, y, w, cur, max, label) {
  if (label) {
    px(x, y, 13, 6, '#584838');
    text('HP', x + 1, y, '#f8b830', 6);
    x += 13; w -= 13;
  }
  px(x, y, w, 6, '#584838');
  const ratio = clamp(cur / max, 0, 1);
  const c = ratio > 0.5 ? '#58c838' : ratio > 0.2 ? '#e8b030' : '#e85838';
  px(x + 1, y + 1, Math.max(0, Math.round((w - 2) * ratio)), 4, c);
  px(x + 1, y + 1, Math.max(0, Math.round((w - 2) * ratio)), 1, ratio > 0.5 ? '#88e868' : ratio > 0.2 ? '#f8d060' : '#f88868');
}

function drawExpBar(x, y, w, cur, max) {
  px(x, y, w, 3, '#584838');
  px(x + 1, y + 1, Math.max(0, Math.round((w - 2) * clamp(cur / max, 0, 1))), 1, '#48a0f8');
}

function drawDialogBox() {
  drawBox(2, VH - 42, VW - 4, 40);
  const pageLines = dialog.lines.slice(dialog.page, dialog.page + 2);
  let shown = Math.floor(dialog.chars);
  for (let i = 0; i < pageLines.length; i++) {
    const line = pageLines[i];
    const take = clamp(shown, 0, line.length);
    text(line.slice(0, take), 10, VH - 34 + i * 13);
    shown -= line.length;
  }
  const total = pageLines.join('').length;
  if (dialog.chars >= total && !dialog.choice && Math.floor(game.frame / 20) % 2 === 0) {
    text('▼', VW - 18, VH - 14, '#e85838');
  }
  if (dialog.chars >= total && dialog.choice && dialog.page + 2 >= dialog.lines.length) {
    drawBox(VW - 60, VH - 82, 56, 38);
    dialog.choice.options.forEach((o, i) => {
      text(o, VW - 42, VH - 74 + i * 14);
      if (dialog.choiceIdx === i) text('▶', VW - 52, VH - 74 + i * 14, '#e85838');
    });
  }
}

// ---------- Menu / party / bag draw ----------
function drawMenu() {
  drawWorld();
  drawBox(VW - 76, 4, 72, 12 + menu.items.length * 14);
  menu.items.forEach((it, i) => {
    text(it, VW - 58, 12 + i * 14);
    if (menu.idx === i) text('▶', VW - 68, 12 + i * 14, '#e85838');
  });
}

function drawParty() {
  px(0, 0, VW, VH, '#286858');
  text(party.mode === 'switch' ? 'Choose a POKeMON.' : 'POKeMON TEAM', 8, 4, '#f8f8f8');
  game.party.forEach((p, i) => {
    const y = 16 + i * 23;
    const sel = party.idx === i;
    px(6, y, VW - 12, 21, sel ? '#f8f8f8' : '#d8e0d8');
    if (sel) { ctx.strokeStyle = '#e85838'; ctx.lineWidth = 2; ctx.strokeRect(7, y + 1, VW - 14, 19); }
    drawMon(p.species, 7, y + 1, 19);
    text(p.name, 30, y + 2, '#383838');
    text('Lv' + p.level, 100, y + 2);
    drawHPBar(140, y + 4, 66, p.hp, p.stats.hp, true);
    text(p.hp + '/' + p.stats.hp, 153, y + 11, '#484848', 7);
    if (p.status) text(p.status, 206, y + 2, '#c04838');
    if (i === battle.activeIdx && party.mode === 'switch') text('IN BATTLE', 30, y + 11, '#3868c0');
  });
}

function drawBag() {
  px(0, 0, VW, VH, '#886848');
  drawBox(8, 8, VW - 16, VH - 16);
  text('BAG', 16, 14, '#c04838');
  if (!game.bag.length) text('It is empty...', 24, 34);
  game.bag.forEach((slot, i) => {
    const y = 30 + i * 14;
    text(slot.item, 30, y);
    text('x' + slot.qty, 160, y);
    if (bagUI.idx === i) text('▶', 20, y, '#e85838');
  });
  if (game.bag[bagUI.idx]) text(ITEMS[game.bag[bagUI.idx].item].desc, 16, VH - 26, '#585858');
}

// ---------- Battle draw (3D arena + 2D UI overlay) ----------
function drawBattle() {
  game.frame++;
  R3D.renderBattle();
  drawBattleUI();
}

function drawBattleUI() {
  const foe = battle.foe;
  const pm = playerMon();

  // foe info box (no HP numbers, like the original)
  if (foe) {
    drawInfoBox(4, 4, 108, 28);
    text(foe.name, 9, 8, '#40342c', 7);
    text('Lv' + foe.level, 82, 8, '#40342c', 7);
    drawHPBar(9, 19, 94, foe.hp, foe.stats.hp, true);
    if (foe.status) text(foe.status, 86, 25, '#c04838', 6);
    if (battle.trainer) {
      // party dots for trainer battles
      battle.trainerParty.forEach((mon2, i) => {
        px(64 + i * 8, 9, 6, 6, '#584838');
        px(65 + i * 8, 10, 4, 4, mon2.hp > 0 ? '#e85838' : '#a09888');
      });
    }
  }
  // player info box with HP numbers + EXP bar
  if (pm) {
    drawInfoBox(VW - 116, 74, 112, 40);
    text(pm.name, VW - 110, 78, '#40342c', 7);
    text('Lv' + pm.level, VW - 40, 78, '#40342c', 7);
    drawHPBar(VW - 110, 89, 100, pm.hp, pm.stats.hp, true);
    text(pm.hp + '/' + pm.stats.hp, VW - 68, 97, '#484038', 7);
    if (pm.status) text(pm.status, VW - 110, 97, '#c04838', 6);
    drawExpBar(VW - 110, 108, 100, pm.exp, pm.expNext);
  }

  // bottom: FRLG dark message panel / split command panel
  if (battle.phase === 'msg' || battleMsg.text) {
    drawMsgPanel(2, VH - 42, VW - 4, 40);
    const t = battleMsg.text.slice(0, Math.floor(battleMsg.chars));
    wrapText(t, 12, VH - 33, VW - 28, 13, '#f8f8f8');
    if (battleMsg.text && battleMsg.chars >= battleMsg.text.length && Math.floor(game.frame / 20) % 2 === 0) {
      text('▼', VW - 18, VH - 14, '#f8b830');
    }
  } else if (battle.phase === 'menu') {
    drawMsgPanel(2, VH - 42, 126, 40);
    wrapText('What will ' + playerMon().name + ' do?', 12, VH - 33, 106, 12, '#f8f8f8');
    drawInfoBox(128, VH - 42, VW - 130, 40);
    const opts = ['FIGHT', 'BAG', 'POKeMON', 'RUN'];
    opts.forEach((o, i) => {
      const x = 146 + (i % 2) * 52, y = VH - 34 + Math.floor(i / 2) * 15;
      text(o, x, y, '#40342c', 7);
      if (battle.menuIdx === i) text('▶', x - 9, y, '#e85838', 7);
    });
  } else if (battle.phase === 'moves') {
    drawInfoBox(2, VH - 42, 158, 40);
    const moves = playerMon().moves;
    moves.forEach((m, i) => {
      const x = 16 + (i % 2) * 74, y = VH - 35 + Math.floor(i / 2) * 15;
      text(m.name, x, y, m.pp > 0 ? '#40342c' : '#a89c88', 6);
      if (battle.moveIdx === i) text('▶', x - 9, y, '#e85838', 7);
    });
    const sel = moves[battle.moveIdx];
    drawInfoBox(162, VH - 42, VW - 164, 40);
    text('PP', 170, VH - 35, '#584838', 7);
    text(sel.pp + '/' + sel.maxPp, 192, VH - 35, '#40342c', 7);
    text(MOVES[sel.name].type + '/', 170, VH - 20, '#584838', 7);
  }
}

function wrapText(str, x, y, w, lh, color = '#383838') {
  ctx.font = 'bold 8px monospace';
  const words = str.split(' ');
  let line = '', ly = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > w && line) {
      text(line, x, ly, color); line = word; ly += lh;
    } else line = test;
  }
  if (line) text(line, x, ly, color);
}

// ---------- Title ----------
function drawTitle() {
  px(0, 0, VW, VH, '#183048');
  // sea + islands silhouette
  px(0, 110, VW, 50, '#28527a');
  for (const [ix, iw, ih] of [[30, 40, 18], [110, 60, 26], [200, 30, 14]]) {
    ctx.fillStyle = '#0f1e30';
    ctx.beginPath(); ctx.ellipse(ix, 112, iw / 2, ih / 2, 0, Math.PI, 0); ctx.fill();
  }
  const ph = Math.floor(game.frame / 25) % 2;
  px(20 + ph * 3, 125, 24, 2, '#3a6a95'); px(150 - ph * 4, 138, 30, 2, '#3a6a95');

  text('POKeMON', 62, 24, '#f8d030', 24);
  text('POKeMON', 60, 22, '#c04838', 24);
  text('FIRERED: SEVII EDITION', 52, 52, '#f8f8f8', 10);
  text('~ One Island Adventure ~', 62, 66, '#88b8d8', 8);
  drawMon('BLASTOISE', 30, 72, 52);
  drawMon('PIDGEOT', 162, 72, 52);
  if (Math.floor(game.frame / 30) % 2 === 0) {
    text(hasSave() ? 'ENTER: CONTINUE   N: NEW GAME' : 'PRESS ENTER', hasSave() ? 32 : 86, 142, '#f8f8f8', 8);
  }
}

function updateTitle() {
  game.frame++;
  if (tapped('n', 'N')) { blip(900); newGame(); return; }
  if (tapA()) {
    blip(900);
    if (hasSave() && loadGame()) { game.state = 'world'; }
    else newGame();
  }
}

// ---------- Main loop ----------
function frame() {
  ctx.clearRect(0, 0, VW, VH); // UI layer is transparent over the 3D canvas
  switch (game.state) {
    case 'title': updateTitle(); drawTitle(); break;
    case 'world': updateWorld(); drawWorld(); break;
    case 'dialog':
      updateDialog();
      if (game.prevState === 'battle') drawBattle(); else drawWorld();
      drawDialogBox();
      break;
    case 'menu': updateMenu(); drawMenu(); break;
    case 'party': updateParty(); drawParty(); break;
    case 'bag': updateBag(); drawBag(); break;
    case 'battle': updateBattle(); drawBattle(); break;
    case 'fade':
      updateFade();
      if (fade.bg === 'battle' && battle.foe) drawBattle(); else drawWorld();
      px(0, 0, VW, VH, 'rgba(16,16,24,' + clamp(fade.alpha, 0, 1) + ')');
      break;
  }
  if (game.state !== 'fade' && fade.alpha > 0 && fade.dir < 0) {
    fade.alpha -= 0.08;
    px(0, 0, VW, VH, 'rgba(16,16,24,' + clamp(fade.alpha, 0, 1) + ')');
  }
  for (const k in pressed) pressed[k] = false;
  requestAnimationFrame(frame);
}

R3D.init(document.getElementById('gl'));

// debug hook for automated testing
window.GAME = { game, battle, startWildBattle, startTrainerBattle, makeMon, newGame };

requestAnimationFrame(frame);
