/* ============================================================
   engine.js — input, game loop, overworld, script runner, menus.
   The game logic runs as coroutines that await frames.
   ============================================================ */
'use strict';

const TILE = 16, DS = 2; // art px per tile, draw scale
let G_canvas, G_ctx;
let frameCount = 0;

// ---------------- frame coroutines ----------------
let _waiters = [];
function nextFrame(){ return new Promise(r=>_waiters.push(r)); }
function tickWaiters(){ const w=_waiters; _waiters=[]; for(const r of w) r(); }
async function waitFrames(n){ for(let i=0;i<n;i++) await nextFrame(); }
async function waitMs(ms){ await waitFrames(Math.max(1, Math.round(ms/16.7))); }

// ---------------- input ----------------
const Input = {
  d:{}, pf:{}, // held, pressed-frame-stamp
  held(b){ return !!this.d[b]; },
  pressed(b){ return this.pf[b]===frameCount; },
  took(b){ if(this.pf[b]===frameCount){ this.pf[b]=-1; return true; } return false; },
  press(b){ this.pf[b]=frameCount+1; this.d[b]=true; },
  release(b){ this.d[b]=false; },
};
const KEYMAP = {
  ArrowUp:'UP', ArrowDown:'DOWN', ArrowLeft:'LEFT', ArrowRight:'RIGHT',
  w:'UP', s:'DOWN', a:'LEFT', d:'RIGHT',
  W:'UP', S:'DOWN', A:'LEFT', D:'RIGHT',
  z:'A', Z:'A', ' ':'A', Enter:'START',
  x:'B', X:'B', Backspace:'B', Escape:'B',
  Shift:'RUN',
};
function bindInput(){
  window.addEventListener('keydown', e=>{
    const b = KEYMAP[e.key];
    if(!b) return;
    e.preventDefault();
    SND.init();
    if(!Input.d[b]) Input.pf[b] = frameCount+1;
    Input.d[b] = true;
    if(e.key==='m'||e.key==='M') {}
  });
  window.addEventListener('keydown', e=>{
    if(e.key==='m'||e.key==='M'){ SND.init(); const m=SND.toggleMute(); Banner.show(m?'SOUND OFF':'SOUND ON'); }
  });
  window.addEventListener('keyup', e=>{
    const b = KEYMAP[e.key];
    if(b) Input.d[b] = false;
  });
  window.addEventListener('blur', ()=>{ Input.d={}; });
  // touch controls
  document.querySelectorAll('[data-btn]').forEach(el=>{
    const b = el.dataset.btn;
    const down = ev=>{ ev.preventDefault(); SND.init(); if(!Input.d[b]) Input.pf[b]=frameCount+1; Input.d[b]=true; el.classList.add('on'); };
    const up = ev=>{ ev.preventDefault(); Input.d[b]=false; el.classList.remove('on'); };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('pointercancel', up);
  });
}

// ---------------- game state ----------------
const Game = {
  mode:'boot',   // boot,title,world,battle,ending
  flags:{}, bag:{}, party:[],
  map:null, npcs:[],
  player:{ x:14, y:22, dir:0, ox:0, oy:0, moving:false, prog:0, anim:0, run:false },
  cam:{x:0,y:0},
  busy:false, steps:0, time:0, playFrames:0, saveSlot:null,
  surfing:false, strengthActive:false, noEncounters:false, textSpeed:1,
};
function textRate(){ return [1.0,1.9,3.4][Game.textSpeed]||1.9; }

// real-time day/night tint for outdoor maps → [r,g,b,a] or null
function dayNightOverlay(){
  const d = new Date(), h = d.getHours() + d.getMinutes()/60;
  let night = 0;
  if(h<5 || h>=20) night = 1;
  else if(h<6) night = 6-h;           // 05:00–06:00 fade out
  else if(h>=19) night = h-19;        // 19:00–20:00 fade in
  if(night>0) return [24,32,76, 0.34*Math.min(1,night)];
  if(h>=6 && h<8){ const t=1-(h-6)/2; return [250,175,115, 0.18*t]; }   // dawn
  if(h>=17 && h<19){ const t=(h-17)/2; return [250,150,90, 0.22*t]; }   // dusk
  return null;
}

// Fly / teleport destinations (Everything-Allowed mode & post-game)
const FLY_POINTS = [
  { name:'PALLET TOWN',    map:'pallet',    x:9,  y:10, dir:1 },
  { name:'VIRIDIAN CITY',  map:'viridian',  x:10, y:15, dir:1 },
  { name:'PEWTER CITY',    map:'pewter',    x:10, y:14, dir:1 },
  { name:'CELADON CITY',   map:'celadon',   x:11, y:14, dir:1 },
  { name:'SAFFRON CITY',   map:'saffron',   x:11, y:16, dir:1 },
  { name:'CERULEAN CITY',  map:'cerulean',  x:11, y:14, dir:1 },
  { name:'VERMILION CITY', map:'vermilion', x:11, y:12, dir:1 },
  { name:'ONE ISLAND',     map:'town',      x:14, y:10, dir:0 },
  { name:'KINDLE ROAD',    map:'kindle',    x:9,  y:38, dir:1 },
  { name:'MT. EMBER',      map:'ember',     x:12, y:17, dir:1 },
  { name:"ROUTE 25 (BILL)", map:'route25',  x:8,  y:16, dir:1 },
];
function flyAllUnlocked(){ return !!(Game.flags.freeRoam || Game.flags.masterMode); }
function flyVisitedCount(){ return FLY_POINTS.filter(p=>Game.flags['visited_'+p.map]).length; }
// Fly is available in the special modes, post-Ruby, once you own any HM,
// or once you've simply visited a couple of towns on foot.
function canFly(){
  if(flyAllUnlocked() || Game.flags.deliveredRuby) return true;
  if(Game.flags.hm_surf || Game.flags.hm_cut || Game.flags.hm_strength) return true;
  return flyVisitedCount() >= 2;
}
function flyDestinations(){
  if(flyAllUnlocked()) return FLY_POINTS.slice();
  const seen = FLY_POINTS.filter(p=>Game.flags['visited_'+p.map]);
  return seen.length ? seen : FLY_POINTS.slice(0,1);
}

// ---- Master Mode: spawn wild POKéMON native to your current location ----
const SPAWN_LOCKED = new Set(['blastoise','squirtle','wartortle']); // water starter stays locked
const DEFAULT_SPAWN = ['pidgey','rattata','meowth','spearow','pikachu','clefairy'];
function locationSpawnPool(){
  const m = Game.map, pool = new Map();
  const add = list=>{ for(const [sp,lo,hi] of list){
    if(SPAWN_LOCKED.has(sp)) continue;
    const e = pool.get(sp);
    if(e){ e[0]=Math.min(e[0],lo); e[1]=Math.max(e[1],hi); } else pool.set(sp,[lo,hi]);
  } };
  if(m.encounters) add(m.encounters.list);
  if(m.waterEncounters) add(m.waterEncounters.list);
  if(m.floorEncounters) add(m.floorEncounters.list);
  return pool;
}
async function spawnMenu(){
  Game.busy = true;
  try{
    while(true){
      let entries = [...locationSpawnPool().entries()];
      let areaLabel = Game.map.name;
      if(entries.length===0){ entries = DEFAULT_SPAWN.map(sp=>[sp,[12,22]]); areaLabel = Game.map.name+' strays'; }
      const items = ['- WATER STARTER: LOCKED -', ...entries.map(([sp,r])=>SPECIES[sp].name+'   Lv'+r[0]+'-'+r[1])];
      const sel = await Menu.open(items, {x:8, y:8, w:VW-16});
      if(sel<0) return;
      if(sel===0){ await Dlg.say('In MASTER MODE the WATER STARTER stays locked. Command a different POKéMON!'); continue; }
      const [sp,[lo,hi]] = entries[sel-1];
      const lv = await Menu.open(['AREA (Lv '+lo+'-'+hi+')','LV 25','LV 50'], {x:VW-190, y:8, w:182});
      if(lv<0) continue;
      const level = lv===1 ? 25 : lv===2 ? 50 : lo + Math.floor(Math.random()*(hi-lo+1));
      SND.sfx('cry');
      await Dlg.say('MASTER, you summon '+SPECIES[sp].name+' from '+areaLabel+'!');
      Game.busy = false;
      const res = await Battle.startWild(makeMon(sp, level), {});
      Game.busy = true;
      if(res==='loss'){ Game.busy=false; await blackout(); Game.busy=true; }
      return;
    }
  } finally { Game.busy = false; }
}

async function flyMenu(){
  const dests = flyDestinations();
  const sel = await Menu.open(dests.map(p=>p.name), {x:VW-224, y:8, w:216});
  if(sel<0) return;
  const p = dests[sel];
  SND.sfx('swoosh');
  await UI.fadeOut(420);
  loadMap(p.map, p.x, p.y, p.dir);
  await UI.fadeIn(420);
}
const DIRV = [[0,1],[0,-1],[-1,0],[1,0]]; // down,up,left,right

function bagAdd(item,n){ Game.bag[item] = (Game.bag[item]||0)+n; }
function bagTake(item,n){ Game.bag[item] = Math.max(0,(Game.bag[item]||0)-(n||1)); if(!Game.bag[item]) delete Game.bag[item]; }

function defaultParty(){
  return [
    makeMon('blastoise',52),
    makeMon('pidgeot',50),
    makeMon('gengar',50),
    makeMon('nidoking',51),
    makeMon('snorlax',50),
    makeMon('jolteon',50),
  ];
}
function defaultBag(){
  return { hyperpotion:3, superpotion:3, potion:2, fullheal:3, revive:2, ultraball:5 };
}

// ---------------- map handling ----------------
function isVisible(npc){
  if(!npc.vis) return true;
  if(npc.vis[0]==='!') return !Game.flags[npc.vis.slice(1)];
  return !!Game.flags[npc.vis];
}
function loadMap(id, x, y, dir){
  const m = MAPS[id];
  // rebuild grid so field-move changes (cut trees, pushed boulders) reset on entry
  m.grid = m.build(); m.h = m.grid.length; m.w = m.grid[0].length;
  Game.map = m;
  Game.strengthActive = false;
  Game.player.x=x; Game.player.y=y; Game.player.dir=dir!==undefined?dir:0;
  Game.player.moving=false; Game.player.prog=0; Game.player.ox=0; Game.player.oy=0;
  // auto-surf if arriving on water; otherwise dismount
  Game.surfing = (tileAt(m, x, y) === 'w');
  // remember visited Fly destinations
  if(FLY_POINTS.some(p=>p.map===id)) Game.flags['visited_'+id] = true;
  Game.npcs = (m.npcs||[]).map(def=>{
    const rt = Object.assign({}, def);
    if(def.posByFlag && Game.flags[def.posByFlag.flag]){
      rt.x=def.posByFlag.x; rt.y=def.posByFlag.y; rt.dir=def.posByFlag.dir??rt.dir;
    }
    rt.homeX=rt.x; rt.homeY=rt.y;
    rt.ox=0; rt.oy=0; rt.moving=false; rt.prog=0; rt.anim=0; rt.wt=60+Math.random()*120;
    rt.dirN = {down:0,up:1,left:2,right:3}[rt.dir] ?? (typeof rt.dir==='number'?rt.dir:0);
    return rt;
  });
  SND.music(m.music);
  Banner.show(m.name);
}
function tileAt(map,x,y){
  if(x<0||y<0||x>=map.w||y>=map.h) return map.void || 'T';
  return map.grid[y][x];
}
function npcAt(x,y){
  for(const n of Game.npcs) if(isVisible(n) && n.x===x && n.y===y) return n;
  return null;
}
function isBlocked(x,y){
  const t = tileAt(Game.map,x,y);
  if(SOLID_TILES.has(t)) return true;
  if(npcAt(x,y)) return true;
  return false;
}
function warpAt(x,y){
  for(const w of (Game.map.warps||[])) if(w.x===x && w.y===y) return w;
  return null;
}

// ---------------- script runner ----------------
async function runOps(ops, npc){
  for(const op of ops){
    if(typeof op === 'string'){ await Dlg.say(op); continue; }
    if(op.say){ for(const s of op.say) await Dlg.say(s); continue; }
    if(op.q){
      await Dlg.sayHold(op.q);
      const yes = await UI.yesno();
      Dlg.active = false;
      await runOps(yes? op.yes||[] : op.no||[], npc);
      continue;
    }
    if(op.set){ Game.flags[op.set]=true; continue; }
    if(op.sfx){ SND.sfx(op.sfx); await waitMs(400); continue; }
    if(op.music){ SND.music(op.music); continue; }
    if(op.pause){ await waitMs(op.pause); continue; }
    if(op.heal){
      SND.sfx('heal');
      await waitMs(900);
      for(const m of Game.party) healMon(m);
      continue;
    }
    if(op.give){
      bagAdd(op.give.item, op.give.n||1);
      SND.sfx('item');
      const it = ITEMS[op.give.item];
      await Dlg.say(`You received ${op.give.n>1? op.give.n+'× ':''}${it.name}!`);
      continue;
    }
    if(op.take){ bagTake(op.take, 1); continue; }
    if(op.hm){
      Game.flags['hm_'+op.hm] = true;
      bagAdd('hm_'+op.hm, 1);
      SND.sfx('item');
      await Dlg.say('You received the hidden move HM — '+op.hm.toUpperCase()+'!');
      continue;
    }
    if(op.moveNpc){
      const t = Game.npcs.find(n=>n.id===op.moveNpc.id);
      if(t){ t.x=op.moveNpc.x; t.y=op.moveNpc.y; t.homeX=t.x; t.homeY=t.y;
             const d=op.moveNpc.dir;
             t.dirN = typeof d==='number' ? d : ({down:0,up:1,left:2,right:3}[d]??0); }
      continue;
    }
    if(op.trainer){
      const res = await Battle.startTrainer(op.trainer);
      if(res==='loss'){ await blackout(); return 'abort'; }
      Game.flags['beat_'+op.trainer]=true;
      const tr = TRAINERS[op.trainer];
      if(tr.badge && !Game.flags['badge_'+tr.badge]){
        Game.flags['badge_'+tr.badge]=true;
        bagAdd(tr.badge,1);
        SND.sfx('item');
        await Dlg.say('You received the '+ITEMS[tr.badge].name+'!');
      }
      continue;
    }
    if(op.goto){
      Game.busy=true;
      SND.sfx('door');
      await UI.fadeOut(420);
      loadMap(op.goto.to, op.goto.x, op.goto.y, op.goto.dir||0);
      await UI.fadeIn(420);
      continue;
    }
    if(op.wild){
      const res = await Battle.startWild(makeMon(op.wild.sp, op.wild.lvl), {legendary:true});
      if(res==='loss'){ await blackout(); return 'abort'; }
      if(op.wild.resolveFlag && res!=='ran'){ Game.flags[op.wild.resolveFlag]=true; }
      continue;
    }
    if(op.ending){ await Ending.run(); continue; }
  }
}
// say but keep box open (for yes/no)
Dlg.sayHold = async function(text){
  const L = Dlg.layout;
  const wrapped = UI.wrap(G_ctx, text, L.w - L.pad*2 - 14, FONT_D);
  Dlg.active=true; Dlg.lines=wrapped.slice(0,2); Dlg.shown=0; Dlg.done=false;
  const total = Dlg.lines.join('').length;
  const base = textRate();
  while(Dlg.shown < total){
    Dlg.shown = Math.min(total, Dlg.shown + base);
    if(Input.took('A')){ Dlg.shown=total; break; }
    await nextFrame();
  }
  Dlg.done=false; // no arrow; menu takes over
};

async function interactWith(npc){
  Game.busy = true;
  try{
    // face the player (humans only)
    if(npc.sprite && npc.sprite!=='sign' && npc.sprite!=='moltres'){
      npc.dirN = [1,0,3,2][Game.player.dir];
    }
    const def = typeof npc.script==='string' ? SCRIPTS[npc.script] : npc.script;
    const ops = def(Game.flags);
    await runOps(ops, npc);
  } finally {
    Game.busy = false;
  }
}

async function interactSimple(text){
  try{ await Dlg.say(text); } finally { Game.busy=false; }
}
function fieldUser(prefTypes){
  for(const m of Game.party){
    if(prefTypes && SPECIES[m.sp].types.some(t=>prefTypes.includes(t))) return m.nick;
  }
  return (Game.party.find(m=>m.hp>0)||Game.party[0]).nick;
}
async function tryFieldMove(kind, tx, ty){
  Game.busy = true;
  try{
    if(kind==='surf'){
      await Dlg.sayHold('The water is a deep, inviting blue. Would you like to SURF?');
      const yes = await UI.yesno();
      Dlg.active=false;
      if(!yes) return;
      await Dlg.say(fieldUser(['water'])+' used SURF!');
      Game.surfing = true;
      SND.sfx('swoosh');
      // hop onto the water tile we're facing
      const P = Game.player;
      P.dir = [0,1,2,3][P.dir]; // unchanged; already facing water
      if(tileAt(Game.map,tx,ty)==='w' && !npcAt(tx,ty)){ P.moving=true; P.prog=0; P.stepParity=!P.stepParity; }
      return;
    }
    if(kind==='cut'){
      await Dlg.say(fieldUser(['grass','normal'])+' used CUT!');
      SND.sfx('swoosh');
      Game.map.grid[ty][tx] = Game.map.ground || '.';
      await waitMs(220);
      return;
    }
    if(kind==='strength'){
      await Dlg.say(fieldUser(['fighting','ground','normal'])+' used STRENGTH!');
      SND.sfx('item');
      Game.strengthActive = true;
      await Dlg.say('It\'s strong enough to move boulders now!');
      return;
    }
  } finally { Game.busy = false; }
}

async function blackout(){
  Game.busy = true;
  SND.stopMusic();
  await waitMs(500);
  await Dlg.say('Your POKéMON team was overwhelmed...');
  await UI.fadeOut(600);
  for(const m of Game.party) healMon(m);
  loadMap('pc', 7, 5, 1);
  await Dlg.say('You rushed back to the POKéMON CENTER. The nurse patched everyone up with a stern look.');
  await UI.fadeIn(400);
  Game.busy = false;
}

// ---------------- world update ----------------
const WALK_SPD = 1.4, RUN_SPD = 2.6;

function worldUpdate(){
  const P = Game.player;

  // NPC idle/wander
  for(const n of Game.npcs){
    if(!isVisible(n)) continue;
    if(n.moving){
      n.prog += 1.0;
      const [dx,dy] = DIRV[n.dirN];
      n.ox = dx*n.prog; n.oy = dy*n.prog;
      n.anim = Math.floor(n.prog/8)%2+1;
      if(n.prog>=TILE){
        n.x+=dx; n.y+=dy; n.moving=false; n.prog=0; n.ox=0; n.oy=0; n.anim=0;
      }
      continue;
    }
    if(Game.busy || !n.wander) continue;
    if(--n.wt<=0){
      n.wt = 80+Math.random()*200;
      const r = Math.floor(Math.random()*5);
      if(r<2){ n.dirN = Math.floor(Math.random()*4); }
      else if(r<4){
        const d = Math.floor(Math.random()*4);
        n.dirN = d;
        const [dx,dy]=DIRV[d];
        const nx=n.x+dx, ny=n.y+dy;
        const t = tileAt(Game.map,nx,ny);
        if(!SOLID_TILES.has(t) && !ENCOUNTER_TILES.has(t) && !npcAt(nx,ny) && !warpAt(nx,ny)
           && !(Game.player.x===nx&&Game.player.y===ny)
           && Math.abs(nx-n.homeX)<=2 && Math.abs(ny-n.homeY)<=2 && t!=='D'){
          n.moving=true; n.prog=0;
        }
      }
    }
  }

  if(Game.busy) return;

  // movement in progress
  if(P.moving){
    P.prog += P.run? RUN_SPD : WALK_SPD;
    const [dx,dy] = DIRV[P.dir];
    if(P.prog>=TILE){
      P.x+=dx; P.y+=dy; P.moving=false; P.prog=0; P.ox=0; P.oy=0;
      P.anim = 0;
      Game.steps++;
      onStepFinish();
    } else {
      P.ox = dx*P.prog; P.oy = dy*P.prog;
      P.anim = Math.floor((P.prog + (P.stepParity?8:0))/8)%2+1;
    }
    return;
  }

  // start menu
  if(Input.took('START')){ openStartMenu(); return; }
  // interact
  if(Input.took('A')){
    const [dx,dy] = DIRV[P.dir];
    let tx=P.x+dx, ty=P.y+dy;
    let n = npcAt(tx,ty);
    if(!n && tileAt(Game.map,tx,ty)==='K') n = npcAt(tx+dx,ty+dy); // across counter
    if(n && n.script){ interactWith(n); return; }
    // field HM moves on the tile we face
    const ft = tileAt(Game.map,tx,ty);
    if(!Game.surfing && ft==='w'){
      if(Game.flags.hm_surf){ tryFieldMove('surf', tx,ty); return; }
    }
    if(ft==='X'){
      if(Game.flags.hm_cut){ tryFieldMove('cut', tx,ty); return; }
      Game.busy=true; interactSimple('This tree looks like it could be CUT down.'); return;
    }
    if(ft==='O'){
      if(Game.flags.hm_strength){ tryFieldMove('strength', tx,ty); return; }
      Game.busy=true; interactSimple('It\'s a big boulder — too heavy to budge by hand.'); return;
    }
  }
  // walking
  let d = -1;
  if(Input.held('UP')) d=1;
  else if(Input.held('DOWN')) d=0;
  else if(Input.held('LEFT')) d=2;
  else if(Input.held('RIGHT')) d=3;
  if(d>=0){
    P.run = (Input.held('RUN') || Input.held('B')) && !Game.surfing;
    if(P.dir!==d){ P.dir=d; P.turnT=6; return; }
    if(P.turnT>0){ P.turnT--; return; }
    const [dx,dy] = DIRV[d];
    const nx = P.x+dx, ny = P.y+dy;
    const t = tileAt(Game.map,nx,ny);
    // Strength: push a boulder if the space beyond it is clear ground
    if(t==='O' && Game.strengthActive && !npcAt(nx,ny)){
      const bx=nx+dx, by=ny+dy, bt=tileAt(Game.map,bx,by);
      if(!SOLID_TILES.has(bt) && bt!=='w' && bt!=='X' && bt!=='O' && !npcAt(bx,by) && !ENCOUNTER_TILES.has(bt) && !warpAt(bx,by)){
        Game.map.grid[ny][nx] = Game.map.ground||'.';
        Game.map.grid[by][bx] = 'O';
        SND.sfx('bump');
        P.moving=true; P.prog=0; P.stepParity=!P.stepParity;
      } else if(Game.time%24===0){ SND.sfx('bump'); }
      return;
    }
    let can;
    if(Game.surfing){
      can = (t==='w') ? !npcAt(nx,ny) : (!SOLID_TILES.has(t) && !npcAt(nx,ny));
    } else {
      can = !isBlocked(nx,ny);
    }
    if(can){
      P.moving=true; P.prog=0;
      P.stepParity = !P.stepParity;
    } else {
      P.anim = 0;
      if(Game.time%24===0) SND.sfx('bump');
    }
  } else { P.anim=0; P.turnT=0; }
}

function onStepFinish(){
  const P = Game.player;
  const t = tileAt(Game.map,P.x,P.y);
  // dismount when surfing onto land
  if(Game.surfing && t!=='w'){ Game.surfing=false; SND.sfx('door'); }
  // warp?
  const w = warpAt(P.x,P.y);
  if(w){ doWarp(w); return; }
  // land encounter (tall grass)?
  if(ENCOUNTER_TILES.has(t) && Game.map.encounters){
    rollEncounter(Game.map.encounters);
    return;
  }
  // cave-floor encounter (every step on the cave ground)
  if(Game.map.floorEncounters && t===Game.map.ground){
    rollEncounter(Game.map.floorEncounters);
    return;
  }
  // water encounter while surfing
  if(Game.surfing && t==='w' && Game.map.waterEncounters){
    rollEncounter(Game.map.waterEncounters);
  }
}
function rollEncounter(enc){
  if(Game.noEncounters) return;
  if(Math.random() >= enc.rate) return;
  const total = enc.list.reduce((a,e)=>a+e[3],0);
  let r = Math.random()*total;
  let pick = enc.list[0];
  for(const e of enc.list){ r-=e[3]; if(r<=0){ pick=e; break; } }
  const lvl = pick[1] + Math.floor(Math.random()*(pick[2]-pick[1]+1));
  startWildEncounter(makeMon(pick[0], lvl));
}
async function doWarp(w){
  Game.busy = true;
  SND.sfx('door');
  await UI.fadeOut(280);
  loadMap(w.to, w.tx, w.ty, w.dir);
  await UI.fadeIn(280);
  Game.busy = false;
}
async function startWildEncounter(mon){
  Game.busy = true;
  const res = await Battle.startWild(mon, {});
  if(res==='loss'){ await blackout(); }
  Game.busy = false;
}

// ---------------- world draw ----------------
function worldDraw(x){
  const P = Game.player, m = Game.map;
  // camera (art px)
  const viewW = VW/DS, viewH = VH/DS;
  let cx = P.x*TILE + P.ox + TILE/2 - viewW/2;
  let cy = P.y*TILE + P.oy + TILE/2 - viewH/2;
  cx = Math.max(0, Math.min(m.w*TILE - viewW, cx));
  cy = Math.max(0, Math.min(m.h*TILE - viewH, cy));
  if(m.w*TILE < viewW) cx = (m.w*TILE - viewW)/2;
  if(m.h*TILE < viewH) cy = (m.h*TILE - viewH)/2;
  cx = Math.round(cx*DS)/DS; cy = Math.round(cy*DS)/DS;
  Game.cam.x=cx; Game.cam.y=cy;

  x.fillStyle = m.outdoor ? '#48a8d8' : '#181820';
  x.fillRect(0,0,VW,VH);

  const x0 = Math.floor(cx/TILE), y0 = Math.floor(cy/TILE);
  const x1 = Math.ceil((cx+viewW)/TILE), y1 = Math.ceil((cy+viewH)/TILE);
  const wf = Math.floor(Game.time/14)%4;   // water frame
  const ff = Math.floor(Game.time/36)%2;   // flower frame
  for(let ty=y0; ty<=y1; ty++){
    for(let tx=x0; tx<=x1; tx++){
      let ch = tileAt(m,tx,ty);
      const px = Math.round((tx*TILE-cx)*DS), py = Math.round((ty*TILE-cy)*DS);
      // ground-base substitutions
      if(ch==='B'){ x.drawImage(SPR.tile(m.ground||'.',0), px, py, TILE*DS, TILE*DS); continue; }
      if(ch==='D'){ x.drawImage(SPR.tile(m.door||m.ground||'p',0), px, py, TILE*DS, TILE*DS); continue; }
      if(ch==='r'||ch==='O'){ x.drawImage(SPR.tile(m.ground||'.',0), px, py, TILE*DS, TILE*DS); }
      let fr = ch==='w'? wf : ch==='f'? ff : 0;
      x.drawImage(SPR.tile(ch,fr), px, py, TILE*DS, TILE*DS);
    }
  }
  // stamps
  for(const [name,sx,sy] of (m.stamps||[])){
    const img = SPR.stamp(name);
    x.drawImage(img, Math.round((sx*TILE-cx)*DS), Math.round((sy*TILE-cy)*DS), img.width*DS, img.height*DS);
  }
  // ruby on pedestal
  if(m.id==='chamber' && !Game.flags.hasRuby){
    const rx=(5.5*TILE-cx)*DS, ry=(2.9*TILE-cy)*DS;
    x.drawImage(SPR.ruby(), Math.round(rx), Math.round(ry), 16*DS, 16*DS);
    const tw = Game.time%90;
    if(tw<12){
      x.save(); x.strokeStyle='#fff'; x.lineWidth=2; x.globalAlpha=1-tw/12;
      const sx2=rx+26, sy2=ry-2;
      x.beginPath(); x.moveTo(sx2-5,sy2); x.lineTo(sx2+5,sy2); x.moveTo(sx2,sy2-5); x.lineTo(sx2,sy2+5); x.stroke();
      x.restore();
    }
  }
  // entities sorted by y
  const ents = [];
  for(const n of Game.npcs) if(isVisible(n)) ents.push({y:n.y*TILE+n.oy, npc:n});
  ents.push({y:P.y*TILE+P.oy, player:true});
  ents.sort((a,b)=>a.y-b.y);
  for(const e of ents){
    if(e.player){
      if(Game.surfing){
        const ax=P.x*TILE+P.ox, ay=P.y*TILE+P.oy;
        const sxp=Math.round((ax-cx)*DS), syp=Math.round((ay-cy)*DS);
        const bob=Math.round(Math.sin(Game.time/16)*1.2);
        x.save(); x.fillStyle='rgba(30,50,70,0.22)';
        x.beginPath(); x.ellipse(sxp+16, syp+40, 13, 4, 0, 0, 7); x.fill(); x.restore();
        x.drawImage(SPR.surfMount(P.dir, Math.floor(Game.time/16)%2), sxp-2, syp+6+bob, 20*DS, 16*DS);
        x.drawImage(SPR.char('hero', P.dir, 0), sxp, syp-8+bob, 16*DS, 20*DS);
      } else {
        drawActor(x, P.x*TILE+P.ox, P.y*TILE+P.oy, 'hero', P.dir, P.anim, cx, cy, m);
      }
    }
    else {
      const n = e.npc;
      if(n.sprite===null) continue;
      if(n.sprite==='moltres'){
        const img = SPR.moltresOW(Math.floor(Game.time/20)%2);
        const bob = Math.sin(Game.time/20)*1.5;
        x.drawImage(img, Math.round((n.x*TILE-cx)*DS), Math.round(((n.y*TILE-5+bob)-cy)*DS), 16*DS, 20*DS);
        continue;
      }
      if(n.sprite==='sign'){
        x.drawImage(SPR.sign(), Math.round((n.x*TILE-cx)*DS), Math.round((n.y*TILE-cy)*DS), 16*DS, 16*DS);
        continue;
      }
      drawActor(x, n.x*TILE+n.ox, n.y*TILE+n.oy, n.sprite, n.dirN, n.anim, cx, cy, m);
    }
  }
  // real-time day/night tint (outdoor maps only)
  if(m.outdoor){
    const t = dayNightOverlay();
    if(t){ x.save(); x.fillStyle=`rgba(${t[0]},${t[1]},${t[2]},${t[3]})`; x.fillRect(0,0,VW,VH); x.restore(); }
  }
}
function drawActor(x, ax, ay, sprite, dir, anim, cx, cy, m){
  const sxp = Math.round((ax-cx)*DS), syp = Math.round((ay-5-cy)*DS);
  // shadow
  x.save(); x.fillStyle='rgba(30,40,50,0.25)';
  x.beginPath(); x.ellipse(sxp+16, syp+38, 11, 4, 0, 0, 7); x.fill(); x.restore();
  x.drawImage(SPR.char(sprite, dir, anim), sxp, syp, 16*DS, 20*DS);
  // tall grass overlay on feet
  const tx = Math.round(ax/TILE), ty = Math.round(ay/TILE);
  const ch = tileAt(m,tx,ty);
  if(ch==='G'||ch==='A'){
    x.drawImage(SPR.tile(ch,0), 0,9,16,7, Math.round((tx*TILE-cx)*DS), Math.round((ty*TILE+9-cy)*DS), 16*DS, 7*DS);
  }
}

// ---------------- start menu / party / bag ----------------
async function openStartMenu(){
  Game.busy = true;
  try{
    while(true){
      const items = ['POKéMON','BAG'];
      if(Game.flags.masterMode) items.push('SPAWN');
      if(canFly()) items.push('FLY');
      items.push('SAVE');
      if(Game.flags.freeRoam) items.push('ENCOUNTERS: '+(Game.noEncounters?'OFF':'ON'));
      items.push('TEXT: '+['SLOW','MID','FAST'][Game.textSpeed], 'SOUND: '+(SND.muted?'OFF':'ON'), 'CLOSE');
      const w = 220;
      const idx = await Menu.open(items, {x:VW-w-8, y:8, w});
      if(idx<0) break;
      const label = items[idx];
      if(label==='POKéMON'){ await partyScreen('world'); }
      else if(label==='BAG'){ await bagScreen('world'); }
      else if(label==='SPAWN'){ await spawnMenu(); break; }
      else if(label==='FLY'){ await flyMenu(); break; }
      else if(label==='SAVE'){
        const slot = await slotScreen('save');
        if(slot<0) continue;
        if(slotInfo(slot) && slot!==Game.saveSlot){
          await Dlg.sayHold('Overwrite the data in SLOT '+slot+'?');
          const ok = await UI.yesno();
          Dlg.active=false;
          if(!ok) continue;
        }
        if(saveGame(slot)){
          SND.sfx('save');
          await Dlg.say('Your progress has been saved to SLOT '+slot+'!');
        } else {
          await Dlg.say("Couldn't write the save data. Your browser may be blocking storage.");
        }
      }
      else if(label.startsWith('ENCOUNTERS')){ Game.noEncounters = !Game.noEncounters; continue; }
      else if(label.startsWith('TEXT')){ Game.textSpeed = (Game.textSpeed+1)%3; continue; }
      else if(label.startsWith('SOUND')){ SND.toggleMute(); continue; }
      else break; // CLOSE
    }
  } finally { Game.busy=false; }
}

// party screen — mode: 'world' | 'battle-switch' | 'battle-item'
// returns selected index or -1
const PartyUI = { active:false, sel:0, mode:'world' };
async function partyScreen(mode){
  PartyUI.active=true; PartyUI.sel=0; PartyUI.mode=mode;
  try{
    while(true){
      if(Input.took('UP')){ PartyUI.sel=(PartyUI.sel+Game.party.length-1)%Game.party.length; SND.sfx('cursor'); }
      if(Input.took('DOWN')){ PartyUI.sel=(PartyUI.sel+1)%Game.party.length; SND.sfx('cursor'); }
      if(Input.took('B')){ SND.sfx('cancel'); return -1; }
      if(Input.took('A')){
        SND.sfx('confirm');
        if(mode==='world'){ await summaryScreen(Game.party[PartyUI.sel]); }
        else return PartyUI.sel;
      }
      await nextFrame();
    }
  } finally { PartyUI.active=false; }
}
function partyDraw(x){
  if(!PartyUI.active) return;
  x.fillStyle='rgba(24,40,56,0.92)'; x.fillRect(0,0,VW,VH);
  UI.text(x,'POKéMON TEAM', 16, 30, {font:FONT_UB, col:'#f8f0d0', shadowCol:'rgba(0,0,0,0.5)'});
  UI.text(x, PartyUI.mode==='world'? 'Z: summary   X: back':'Z: choose   X: back', VW-16, 30, {font:FONT_U, col:'#a8c8e8', align:'right', shadowCol:'rgba(0,0,0,0.5)'});
  for(let i=0;i<Game.party.length;i++){
    const m = Game.party[i];
    const yy = 44 + i*44;
    const seld = i===PartyUI.sel;
    UI.rounded(x, 12, yy, VW-24, 40, 8);
    x.fillStyle = seld? '#f8f0d0' : 'rgba(248,248,248,0.86)';
    x.fill();
    x.lineWidth=2.5; x.strokeStyle= seld? '#e05048' : '#5080c0'; x.stroke();
    x.drawImage(SPR.mon(m.sp,'front'), 0,0,48,48, 18, yy+2, 36,36);
    UI.text(x, m.nick, 64, yy+18, {font:FONT_U});
    UI.text(x, 'Lv'+m.lvl, 64, yy+33, {font:FONT_U, col:'#687080'});
    UI.hpbar(x, 210, yy+12, 130, m.hp/m.maxhp);
    UI.text(x, m.hp+' / '+m.maxhp, 345+62, yy+24, {font:FONT_U, align:'right', col: m.hp===0?'#e05048':INK});
    UI.statusTag(x, m.status, 350, yy+8);
    if(m.hp===0){ UI.text(x,'FNT',352,yy+34,{font:FONT_U,col:'#e05048'}); }
  }
}
async function summaryScreen(m){
  const S = { on:true, m };
  summaryScreen.cur = S;
  try{
    while(true){
      if(Input.took('A')||Input.took('B')){ SND.sfx('cancel'); return; }
      await nextFrame();
    }
  } finally { summaryScreen.cur=null; }
}
function summaryDraw(x){
  const S = summaryScreen.cur; if(!S) return;
  const m = S.m, sp = SPECIES[m.sp];
  x.fillStyle='rgba(24,40,56,0.95)'; x.fillRect(0,0,VW,VH);
  UI.box(x, 14, 14, 200, 210, {fill:'#f8f4e8'});
  x.save(); x.imageSmoothingEnabled=false;
  x.drawImage(SPR.mon(m.sp,'front'), 0,0,48,48, 46,28, 136,136);
  x.restore();
  UI.text(x, m.nick, 114, 190, {font:FONT_UB, align:'center'});
  UI.text(x, 'Lv'+m.lvl+'  '+sp.types.join(' / ').toUpperCase(), 114, 210, {font:FONT_U, align:'center', col:'#687080'});
  UI.box(x, 226, 14, 240, 130, {fill:'#f8f4e8'});
  const st = m.stats;
  const rows = [['HP', m.hp+'/'+m.maxhp],['ATTACK',st.atk],['DEFENSE',st.def],['SP. ATK',st.spa],['SP. DEF',st.spd],['SPEED',st.spe]];
  rows.forEach((r,i)=>{
    UI.text(x, r[0], 240, 38+i*18, {font:FONT_U, col:'#687080'});
    UI.text(x, String(r[1]), 452, 38+i*18, {font:FONT_U, align:'right'});
  });
  UI.box(x, 226, 152, 240, 118, {fill:'#f8f4e8'});
  m.moves.forEach((mv,i)=>{
    const M = MOVES[mv.id];
    UI.text(x, M.name, 240, 176+i*24, {font:FONT_U});
    UI.text(x, mv.pp+'/'+mv.maxpp, 452, 176+i*24, {font:FONT_U, align:'right', col:'#687080'});
  });
  UI.text(x, 'Z/X: back', VW-16, VH-14, {font:FONT_U, col:'#a8c8e8', align:'right'});
}

// bag — mode 'world'|'battle'. In battle returns {item} used or null
const BagUI = { active:false, sel:0 };
async function bagScreen(mode){
  const entries = ()=> Object.keys(Game.bag);
  BagUI.active=true; BagUI.sel=0;
  try{
    while(true){
      const list = entries();
      if(list.length===0){
        BagUI.active=false;
        await Dlg.say('The BAG is empty.');
        return null;
      }
      if(BagUI.sel>=list.length) BagUI.sel=list.length-1;
      if(Input.took('UP')){ BagUI.sel=(BagUI.sel+list.length-1)%list.length; SND.sfx('cursor'); }
      if(Input.took('DOWN')){ BagUI.sel=(BagUI.sel+1)%list.length; SND.sfx('cursor'); }
      if(Input.took('B')){ SND.sfx('cancel'); return null; }
      if(Input.took('A')){
        SND.sfx('confirm');
        const id = list[BagUI.sel];
        const it = ITEMS[id];
        if(it.kind==='key'){
          BagUI.active=false;
          await Dlg.say('THE RUBY glows softly, warm as a sunbeam. CELIO needs this!');
          BagUI.active=true;
          continue;
        }
        if(it.kind==='ball'){
          if(mode==='battle') return {item:id};
          BagUI.active=false;
          await Dlg.say("Now isn't the time to use that!");
          BagUI.active=true;
          continue;
        }
        // heal/cure/revive: pick a target
        BagUI.active=false;
        const idx = await partyScreen(mode==='battle'?'battle-item':'world-item');
        BagUI.active=true;
        if(idx<0) continue;
        const target = Game.party[idx];
        const ok = applyItem(id, target);
        if(!ok){ BagUI.active=false; await Dlg.say('It would have no effect.'); BagUI.active=true; continue; }
        bagTake(id,1);
        SND.sfx('heal');
        BagUI.active=false;
        await Dlg.say(useMessage(id, target));
        BagUI.active=true;
        if(mode==='battle') return {used:true};
      }
      await nextFrame();
    }
  } finally { BagUI.active=false; }
}
function applyItem(id, m){
  const it = ITEMS[id];
  if(it.kind==='heal'){
    if(m.hp===0 || m.hp===m.maxhp) return false;
    m.hp = Math.min(m.maxhp, m.hp+it.amt); return true;
  }
  if(it.kind==='cure'){
    if(!m.status) return false;
    m.status=null; m.sleepTurns=0; return true;
  }
  if(it.kind==='revive'){
    if(m.hp>0) return false;
    m.hp = Math.ceil(m.maxhp/2); m.status=null; return true;
  }
  return false;
}
function useMessage(id, m){
  const it = ITEMS[id];
  if(it.kind==='heal') return m.nick+"'s HP was restored!";
  if(it.kind==='cure') return m.nick+' became healthy!';
  return m.nick+' came back to its senses!';
}
function bagDraw(x){
  if(!BagUI.active) return;
  x.fillStyle='rgba(24,40,56,0.92)'; x.fillRect(0,0,VW,VH);
  UI.text(x,'BAG', 16, 30, {font:FONT_UB, col:'#f8f0d0', shadowCol:'rgba(0,0,0,0.5)'});
  const list = Object.keys(Game.bag);
  UI.box(x, 12, 42, VW-24, 168, {fill:'#f8f4e8'});
  list.forEach((id,i)=>{
    const it = ITEMS[id];
    const yy = 66+i*22;
    if(i===BagUI.sel){
      x.fillStyle='rgba(224,80,72,0.15)'; x.fillRect(18,yy-15,VW-36,21);
      x.fillStyle='#e05048';
      x.beginPath(); x.moveTo(24,yy-11); x.lineTo(32,yy-6); x.lineTo(24,yy-1); x.closePath(); x.fill();
    }
    UI.text(x, it.name, 42, yy, {font:FONT_U});
    if(it.kind!=='key') UI.text(x, '×'+Game.bag[id], VW-40, yy, {font:FONT_U, align:'right'});
  });
  const cur = ITEMS[list[BagUI.sel]];
  UI.box(x, 12, 218, VW-24, 62, {fill:'#f0f4f8'});
  if(cur) UI.wrap(x, cur.desc, VW-72, FONT_DS).slice(0,2).forEach((l,i)=>{
    UI.text(x, l, 26, 242+i*20, {font:FONT_DS});
  });
  UI.text(x, 'Z: use   X: back', VW-16, VH-10, {font:FONT_U, col:'#a8c8e8', align:'right'});
}

// ---------------- save / load (3 slots) ----------------
const SAVE_SLOTS = 3;
function slotKey(n){ return 'sevii_save_'+n; }
function migrateLegacySave(){
  try{
    const old = localStorage.getItem('sevii_save');
    if(old){
      if(!localStorage.getItem(slotKey(1))) localStorage.setItem(slotKey(1), old);
      localStorage.removeItem('sevii_save');
    }
  }catch(e){}
}
function saveGame(slot){
  slot = slot || Game.saveSlot || 1;
  const P = Game.player;
  const data = {
    v:2, flags:Game.flags, bag:Game.bag, party:Game.party,
    map:Game.map.id, x:P.x, y:P.y, dir:P.dir, steps:Game.steps,
    playFrames:Game.playFrames||0, savedAt:Date.now(),
    noEncounters:!!Game.noEncounters, textSpeed:Game.textSpeed,
  };
  try{
    localStorage.setItem(slotKey(slot), JSON.stringify(data));
    Game.saveSlot = slot;
    return true;
  }catch(e){ return false; }
}
function loadGame(slot){
  slot = slot || 1;
  try{
    const raw = localStorage.getItem(slotKey(slot));
    if(!raw) return false;
    const d = JSON.parse(raw);
    Game.flags = d.flags||{}; Game.bag = d.bag||defaultBag(); Game.party = d.party||defaultParty();
    Game.steps = d.steps||0; Game.playFrames = d.playFrames||0;
    Game.noEncounters = !!d.noEncounters;
    Game.textSpeed = d.textSpeed ?? 1;
    Game.saveSlot = slot;
    loadMap(d.map||'town', d.x??14, d.y??22, d.dir??1);
    return true;
  }catch(e){ return false; }
}
function slotInfo(n){
  try{
    const raw = localStorage.getItem(slotKey(n));
    if(!raw) return null;
    const d = JSON.parse(raw);
    return {
      mapName: (MAPS[d.map] && MAPS[d.map].name) || '???',
      party: (d.party||[]).map(m=>({sp:m.sp, lvl:m.lvl})),
      playFrames: d.playFrames||0,
      savedAt: d.savedAt||0,
      done: !!(d.flags && d.flags.deliveredRuby),
    };
  }catch(e){ return null; }
}
function hasSave(){
  migrateLegacySave();
  for(let i=1;i<=SAVE_SLOTS;i++) if(slotInfo(i)) return true;
  return false;
}
function fmtPlaytime(frames){
  const s = Math.floor(frames/60);
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60);
  return h+':'+String(m).padStart(2,'0');
}

// ---------------- save-slot picker ----------------
const SlotUI = { active:false, sel:0, mode:'save' };
async function slotScreen(mode){
  SlotUI.active=true; SlotUI.mode=mode;
  // default: current slot when saving, most recent save when loading
  if(mode==='save' && Game.saveSlot) SlotUI.sel = Game.saveSlot-1;
  else {
    let best=0, bestAt=-1;
    for(let i=0;i<SAVE_SLOTS;i++){
      const inf = slotInfo(i+1);
      if(inf && inf.savedAt>bestAt){ bestAt=inf.savedAt; best=i; }
    }
    SlotUI.sel = best;
  }
  try{
    while(true){
      if(Input.took('UP')){ SlotUI.sel=(SlotUI.sel+SAVE_SLOTS-1)%SAVE_SLOTS; SND.sfx('cursor'); }
      if(Input.took('DOWN')){ SlotUI.sel=(SlotUI.sel+1)%SAVE_SLOTS; SND.sfx('cursor'); }
      if(Input.took('B')){ SND.sfx('cancel'); return -1; }
      if(Input.took('A')){
        if(SlotUI.mode==='load' && !slotInfo(SlotUI.sel+1)){ SND.sfx('bump'); continue; }
        SND.sfx('confirm');
        return SlotUI.sel+1;
      }
      await nextFrame();
    }
  } finally { SlotUI.active=false; }
}
function slotDraw(x){
  if(!SlotUI.active) return;
  x.fillStyle='rgba(16,28,44,0.94)'; x.fillRect(0,0,VW,VH);
  UI.text(x, SlotUI.mode==='save'? 'SAVE — CHOOSE A SLOT' : 'LOAD GAME', 16, 30,
    {font:FONT_UB, col:'#f8f0d0', shadowCol:'rgba(0,0,0,0.5)'});
  UI.text(x, 'Z: '+(SlotUI.mode==='save'?'save here':'load')+'   X: back', VW-16, 30,
    {font:FONT_U, col:'#a8c8e8', align:'right', shadowCol:'rgba(0,0,0,0.5)'});
  for(let i=0;i<SAVE_SLOTS;i++){
    const inf = slotInfo(i+1);
    const yy = 46 + i*86;
    const seld = i===SlotUI.sel;
    const dim = SlotUI.mode==='load' && !inf;
    UI.rounded(x, 14, yy, VW-28, 78, 8);
    x.fillStyle = seld? '#f8f0d0' : 'rgba(248,248,248,0.88)';
    if(dim) x.fillStyle = seld? 'rgba(200,200,205,0.8)' : 'rgba(190,190,196,0.55)';
    x.fill();
    x.lineWidth=2.5; x.strokeStyle = seld? '#e05048' : '#5080c0'; x.stroke();
    if(seld){
      x.fillStyle='#e05048';
      x.beginPath(); x.moveTo(24,yy+31); x.lineTo(34,yy+38); x.lineTo(24,yy+45); x.closePath(); x.fill();
    }
    UI.text(x, 'SLOT '+(i+1), 46, yy+24, {font:FONT_U, col:'#c07830'});
    if(inf){
      UI.text(x, inf.mapName, 46, yy+48, {font:FONT_UB});
      if(inf.done) UI.text(x, '★', 46+inf.mapName.length*13+12, yy+48, {font:FONT_UB, col:'#e0a020'});
      const lead = inf.party[0];
      UI.text(x, lead? ('Lv'+lead.lvl) : '', 46, yy+66, {font:FONT_U, col:'#687080'});
      inf.party.slice(0,6).forEach((m,k)=>{
        x.drawImage(SPR.monIcon(m.sp), 96+k*26, yy+52, 20,20);
      });
      UI.text(x, fmtPlaytime(inf.playFrames), VW-44, yy+28, {font:FONT_UB, align:'right'});
      if(inf.savedAt){
        const d = new Date(inf.savedAt);
        UI.text(x, 'Saved '+d.toLocaleDateString(undefined,{month:'short',day:'numeric'}),
          VW-44, yy+48, {font:FONT_U, align:'right', col:'#687080'});
      }
    } else {
      UI.text(x, '— empty —', 46, yy+50, {font:FONT_U, col:'#8890a0'});
    }
  }
}
