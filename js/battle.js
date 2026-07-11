/* ============================================================
   battle.js — FRLG-style turn-based battles.
   Runs as one big coroutine; draw() renders current view state.
   ============================================================ */
'use strict';

const Battle = {
  active:false,
  kind:'wild', trainerId:null, trainer:null,
  eParty:[], eIdx:0, pIdx:0,
  view:null, menu:null, menuSel:0, moveSel:0,
  text:'', textShown:0,
  runAttempts:0, result:null,
  legendary:false,
};
const B = Battle;

function bmon(){ return Game.party[B.pIdx]; }
function emon(){ return B.eParty[B.eIdx]; }

function stageMul(s){ return s>=0 ? (2+s)/2 : 2/(2-s); }
function initVolatile(m){ m._st={atk:0,def:0,spa:0,spd:0,spe:0}; m._flinch=false; }
function clearVolatile(m){ delete m._st; delete m._flinch; }

function effSpe(m){
  let s = m.stats.spe * stageMul(m._st? m._st.spe:0);
  if(m.status==='par') s*=0.5;
  return s;
}

// ---------- battle text ----------
async function bmsg(text, opts){
  opts = opts||{};
  B.text = text; B.textShown = 0;
  const total = text.length;
  while(B.textShown < total){
    B.textShown = Math.min(total, B.textShown + (Input.held('A')? 3.4 : 1.7));
    if(Input.took('A')) { B.textShown = total; break; }
    await nextFrame();
  }
  if(opts.hold){
    B.arrow = true;
    while(!Input.took('A') && !Input.took('B')) await nextFrame();
    B.arrow = false;
    SND.sfx('confirm');
  } else {
    await waitMs(opts.ms||620);
  }
}

// ---------- HP/EXP bar animation ----------
async function animHp(side, mon){
  const target = Math.max(0, mon.hp/mon.maxhp);
  const key = side==='p' ? 'pHp' : 'eHp';
  const step = 0.02;
  while(Math.abs(B.view[key]-target) > step){
    B.view[key] += B.view[key]>target ? -step : step;
    await nextFrame();
  }
  B.view[key] = target;
}
async function animExp(mon){
  const lo = expForLevel(mon.lvl), hi = expForLevel(mon.lvl+1);
  const target = Math.max(0, Math.min(1,(mon.exp-lo)/(hi-lo)));
  while(Math.abs(B.view.exp-target) > 0.025){
    B.view.exp += B.view.exp>target ? -0.025 : 0.025;
    await nextFrame();
  }
  B.view.exp = target;
}

// ---------- start ----------
Battle.startWild = async function(mon, opts){
  B.kind='wild'; B.trainerId=null; B.trainer=null;
  B.eParty=[mon]; B.legendary=!!(opts&&opts.legendary);
  return await runBattle();
};
Battle.startTrainer = async function(id){
  B.kind='trainer'; B.trainerId=id; B.trainer=TRAINERS[id];
  B.eParty = B.trainer.party.map(([sp,lvl])=>makeMon(sp,lvl));
  B.legendary=false;
  return await runBattle();
};

function battleBg(){
  const id = Game.map ? Game.map.id : 'town';
  if(id==='ember') return {sky:['#f8b060','#e87040'], ground:'#c08050', plat:'#a06840'};
  if(id==='chamber') return {sky:['#4a4058','#2a2432'], ground:'#584838', plat:'#3e3228'};
  return {sky:['#a8e0f8','#70c0f0'], ground:'#88c860', plat:'#5aa848'};
}

async function runBattle(){
  const prevMusic = SND.songName;
  SND.music('battle');
  await UI.flashBattle();
  Game.mode='battle';
  B.active=true; B.result=null; B.runAttempts=0; B.menu=null; B.text='';
  B.pIdx = Game.party.findIndex(m=>m.hp>0);
  if(B.pIdx<0) B.pIdx=0;
  B.eIdx = 0;
  initVolatile(emon()); initVolatile(bmon());
  B.view = {
    eX:520, eY:0, pX:-200, pY:0, eHp:1, pHp:1, exp:0,
    eShake:0, pShake:0, eFlash:0, pFlash:0, eDrop:0, pDrop:0,
    trainerX:null, ballFrame:-1, ballX:0, ballY:0, eHidden:false, pHidden:true,
  };
  const pm0 = bmon();
  B.view.exp = (pm0.exp-expForLevel(pm0.lvl))/(expForLevel(pm0.lvl+1)-expForLevel(pm0.lvl));
  B.view.pHp = pm0.hp/pm0.maxhp;
  B.view.eHp = emon().hp/emon().maxhp;

  // --- intro ---
  if(B.kind==='trainer'){
    B.view.eHidden = true;
    B.view.trainerX = 520;
    for(let i=0;i<26;i++){ B.view.trainerX -= 8; await nextFrame(); }
    B.view.trainerX = 312;
    const tname = (B.trainer.cls+' '+B.trainer.name).trim();
    await bmsg(tname+' would like to battle!', {hold:true});
    for(let i=0;i<20;i++){ B.view.trainerX += 12; await nextFrame(); }
    B.view.trainerX = null;
    await bmsg(tname+' sent out '+emon().nick+'!');
    B.view.eX = 330; B.view.eHidden=false;
    SND.sfx('monCry');
  } else {
    B.view.eHidden=false;
    for(let i=0;i<26;i++){ B.view.eX -= 8; await nextFrame(); }
    B.view.eX = 330;
    SND.sfx('monCry');
    await bmsg(B.legendary ? emon().nick+' attacks!' : 'Wild '+emon().nick+' appeared!', {hold:true});
  }
  await bmsg('Go! '+bmon().nick+'!');
  B.view.pHidden=false;
  for(let i=0;i<20;i++){ B.view.pX += 9; await nextFrame(); }
  B.view.pX = 0;
  SND.sfx('monCry');

  // --- main loop ---
  while(!B.result){
    const action = await battleMenu();
    await executeRound(action);
  }

  // --- teardown ---
  clearVolatile(bmon()); B.eParty.forEach(clearVolatile);
  await UI.fadeOut(400);
  B.active=false;
  Game.mode='world';
  SND.stopMusic();
  SND.music(prevMusic);
  await UI.fadeIn(300);
  return B.result;
}

// ---------- menus ----------
async function battleMenu(){
  while(true){
    B.text = 'What will '+bmon().nick+' do?';
    B.textShown = 1e9;
    B.menu='main';
    let sel = B.menuSel||0;
    while(B.menu==='main'){
      if(Input.took('LEFT')&&(sel%2)) { sel--; SND.sfx('cursor'); }
      if(Input.took('RIGHT')&&!(sel%2)) { sel++; SND.sfx('cursor'); }
      if(Input.took('UP')&&sel>1) { sel-=2; SND.sfx('cursor'); }
      if(Input.took('DOWN')&&sel<2) { sel+=2; SND.sfx('cursor'); }
      B.menuSel = sel;
      if(Input.took('A')){
        SND.sfx('confirm');
        if(sel===0){ // FIGHT
          const mi = await battleMoveMenu();
          if(mi>=0){ B.menu=null; return {type:'move', idx:mi}; }
          B.menu='main';
        } else if(sel===1){ // BAG
          B.menu=null;
          const r = await bagScreen('battle');
          if(r && r.item) return {type:'ball', item:r.item};
          if(r && r.used) return {type:'pass'};
          B.menu='main';
        } else if(sel===2){ // POKéMON
          B.menu=null;
          const idx = await pickSwitchTarget(false);
          if(idx>=0) return {type:'switch', idx};
          B.menu='main';
        } else { // RUN
          B.menu=null;
          return {type:'run'};
        }
      }
      await nextFrame();
    }
  }
}
async function battleMoveMenu(){
  B.menu='moves';
  let sel = 0;
  const mv = bmon().moves;
  while(true){
    if(Input.took('LEFT')&&(sel%2)) { sel--; SND.sfx('cursor'); }
    if(Input.took('RIGHT')&&!(sel%2)&&sel+1<mv.length) { sel++; SND.sfx('cursor'); }
    if(Input.took('UP')&&sel>1) { sel-=2; SND.sfx('cursor'); }
    if(Input.took('DOWN')&&sel<2&&sel+2<mv.length) { sel+=2; SND.sfx('cursor'); }
    B.moveSel = sel;
    if(Input.took('B')){ SND.sfx('cancel'); B.menu='main'; return -1; }
    if(Input.took('A')){
      if(mv[sel].pp<=0){ SND.sfx('cancel'); await bmsg("There's no PP left for this move!"); B.menu='moves'; continue; }
      SND.sfx('confirm');
      return sel;
    }
    await nextFrame();
  }
}
async function pickSwitchTarget(forced){
  while(true){
    const idx = await partyScreen('battle-switch');
    if(idx<0){
      if(!forced) return -1;
      continue;
    }
    const m = Game.party[idx];
    if(m.hp===0){ await Dlg.say(m.nick+' has no energy left to battle!'); continue; }
    if(idx===B.pIdx){ await Dlg.say(m.nick+' is already in battle!'); continue; }
    return idx;
  }
}

// ---------- round execution ----------
async function executeRound(action){
  const eAct = chooseEnemyMove();
  // player non-move actions resolve first
  if(action.type==='run'){
    if(B.kind==='trainer'){
      await bmsg("There's no running from a TRAINER battle!", {hold:true});
      return;
    }
    B.runAttempts++;
    const f = Math.floor(effSpe(bmon())*128/Math.max(1,effSpe(emon()))) + 30*B.runAttempts;
    if(Math.random()*256 < f){
      SND.sfx('run');
      await bmsg('Got away safely!', {hold:true});
      B.result='ran';
      return;
    }
    await bmsg("Can't escape!");
    await enemyTurn(eAct);
    await endOfTurn();
    return;
  }
  if(action.type==='ball'){
    const done = await throwBall(action.item);
    if(done) return;
    await enemyTurn(eAct);
    await endOfTurn();
    return;
  }
  if(action.type==='pass'){
    await enemyTurn(eAct);
    await endOfTurn();
    return;
  }
  if(action.type==='switch'){
    await doSwitch(action.idx);
    await enemyTurn(eAct);
    await endOfTurn();
    return;
  }
  // both use moves: order by priority then speed
  const pm = bmon(), em = emon();
  const pMove = MOVES[pm.moves[action.idx].id];
  const eMove = MOVES[em.moves[eAct].id];
  const pPrio = pMove.prio||0, ePrio = eMove.prio||0;
  let pFirst;
  if(pPrio!==ePrio) pFirst = pPrio>ePrio;
  else if(effSpe(pm)!==effSpe(em)) pFirst = effSpe(pm)>effSpe(em);
  else pFirst = Math.random()<0.5;

  if(pFirst){
    await playerTurn(action.idx);
    if(!B.result && emon().hp>0) await enemyTurn(eAct);
  } else {
    await enemyTurn(eAct);
    if(!B.result && bmon().hp>0) await playerTurn(action.idx);
  }
  if(!B.result) await endOfTurn();
}

function chooseEnemyMove(){
  const em = emon(), pm = bmon();
  const usable = em.moves.map((mv,i)=>({mv,i})).filter(e=>e.mv.pp>0);
  if(usable.length===0) return 0;
  let best=usable[0], bestScore=-1;
  for(const e of usable){
    const M = MOVES[e.mv.id];
    let score;
    if(M.pow>0){
      const stab = SPECIES[em.sp].types.includes(M.type)?1.5:1;
      score = M.pow*stab*typeEff(M.type, SPECIES[pm.sp].types);
    } else {
      score = 0;
      if(M.fx){
        if((M.fx.status||M.fx.sleep) && !pm.status) score = 55;
        if(M.fx.stage) score = M.fx.stage.target==='self' ? 40 : 42;
      }
      if(em._usedStatus) score *= 0.3;
    }
    if(score>bestScore){ bestScore=score; best=e; }
  }
  if(Math.random()<0.2) best = usable[Math.floor(Math.random()*usable.length)];
  const M = MOVES[best.mv.id];
  if(M.pow===0) em._usedStatus = true;
  return best.i;
}

async function playerTurn(idx){
  const pm = bmon();
  if(!await canAct(pm,'p')) return;
  await useMove(pm, emon(), pm.moves[idx], 'p');
  if(emon().hp<=0) await enemyFainted();
}
async function enemyTurn(idx){
  const em = emon();
  if(em.hp<=0) return;
  if(!await canAct(em,'e')) return;
  await useMove(em, bmon(), em.moves[idx], 'e');
  if(bmon().hp<=0) await playerFainted();
}

async function canAct(m, side){
  if(m._flinch){ m._flinch=false; await bmsg(m.nick+' flinched!'); return false; }
  if(m.status==='slp'){
    if(m.sleepTurns>0){
      m.sleepTurns--;
      await bmsg(m.nick+' is fast asleep...');
      return false;
    }
    m.status=null;
    await bmsg(m.nick+' woke up!');
  }
  if(m.status==='par' && Math.random()<0.25){
    await bmsg(m.nick+" is paralyzed! It can't move!");
    return false;
  }
  return true;
}

async function useMove(user, target, slot, side){
  const M = MOVES[slot.id];
  slot.pp--;
  const userName = side==='p' ? user.nick : (B.kind==='wild'? 'Wild ':'Foe ')+user.nick;
  const targetName = side==='p' ? (B.kind==='wild'? 'Wild ':'Foe ')+target.nick : target.nick;
  await bmsg(userName+' used '+M.name+'!', {ms:420});

  // attack lunge animation
  if(side==='p'){ for(let i=0;i<4;i++){ B.view.pX+=3; await nextFrame(); } }
  else { for(let i=0;i<4;i++){ B.view.eX-=3; await nextFrame(); } }

  // accuracy
  if(!(M.fx&&M.fx.neverMiss) && M.acc<999 && Math.random()*100 >= M.acc){
    await resetLunge(side);
    await bmsg(userName+"'s attack missed!");
    return;
  }

  if(M.pow>0){
    const eff = typeEff(M.type, SPECIES[target.sp].types);
    if(eff===0){
      await resetLunge(side);
      await bmsg("It doesn't affect "+targetName+'...');
      return;
    }
    let hits = 1;
    if(M.fx && M.fx.multihit) hits = [2,2,3,3,4,5][Math.floor(Math.random()*6)];
    let anyCrit=false, totalDmg=0;
    for(let h=0; h<hits && target.hp>0; h++){
      const r = calcDamage(user, target, M, eff);
      anyCrit = anyCrit||r.crit;
      totalDmg += r.dmg;
      target.hp = Math.max(0, target.hp - r.dmg);
      // hit feedback
      SND.sfx(eff>1?'hitSuper': eff<1?'hitWeak':'hit');
      const vk = side==='p' ? 'eShake':'pShake';
      const fk = side==='p' ? 'eFlash':'pFlash';
      B.view[fk]=1;
      for(let i=0;i<10;i++){ B.view[vk]=(i%2? -3:3)*(eff>1?1.6:1); B.view[fk]=i%2; await nextFrame(); }
      B.view[vk]=0; B.view[fk]=0;
      await animHp(side==='p'?'e':'p', target);
    }
    await resetLunge(side);
    if(hits>1) await bmsg('Hit '+hits+' time(s)!');
    if(anyCrit) await bmsg('A critical hit!');
    if(eff>1) await bmsg("It's super effective!");
    if(eff<1) await bmsg("It's not very effective...");
    if(M.fx && M.fx.recoil && totalDmg>0){
      user.hp = Math.max(0, user.hp - Math.max(1,Math.floor(totalDmg*M.fx.recoil)));
      await animHp(side, user);
      await bmsg(userName+' is hit with recoil!');
      if(user.hp<=0){
        if(side==='p'){ await playerFainted(); } else { await enemyFainted(); }
        return;
      }
    }
    // secondary effects
    if(M.fx && target.hp>0){
      if(M.fx.flinch && Math.random()*100 < M.fx.flinch) target._flinch = true;
      if(M.fx.status && !target.status && Math.random()*100 < M.fx.chance){
        if(!(M.fx.status==='psn' && (SPECIES[target.sp].types.includes('poison')||SPECIES[target.sp].types.includes('steel'))) &&
           !(M.fx.status==='brn' && SPECIES[target.sp].types.includes('fire')) &&
           !(M.fx.status==='par' && SPECIES[target.sp].types.includes('electric'))){
          target.status = M.fx.status;
          await bmsg(targetName+statusText(M.fx.status));
        }
      }
    }
  } else {
    await resetLunge(side);
    // status move
    if(M.fx && M.fx.sleep){
      if(target.status){ await bmsg('But it failed!'); return; }
      target.status='slp'; target.sleepTurns = 1+Math.floor(Math.random()*3);
      await bmsg(targetName+' fell asleep!');
      return;
    }
    if(M.fx && M.fx.status==='par'){
      if(target.status || SPECIES[target.sp].types.includes('electric') || SPECIES[target.sp].types.includes('ground')){
        await bmsg('But it failed!'); return;
      }
      target.status='par';
      await bmsg(targetName+statusText('par'));
      return;
    }
    if(M.fx && M.fx.stage){
      const st = M.fx.stage;
      const who = st.target==='self' ? user : target;
      const whoName = st.target==='self' ? userName : targetName;
      if(!who._st) initVolatile(who);
      const cur = who._st[st.stat];
      const next = Math.max(-6, Math.min(6, cur+st.delta));
      if(next===cur){
        await bmsg(whoName+"'s "+statName(st.stat)+" won't go any "+(st.delta>0?'higher':'lower')+'!');
        return;
      }
      who._st[st.stat]=next;
      const adv = Math.abs(st.delta)>1 ? 'sharply ' : '';
      await bmsg(whoName+"'s "+statName(st.stat)+' '+adv+(st.delta>0?'rose!':'fell!'));
      return;
    }
    await bmsg('But nothing happened!');
  }
}
async function resetLunge(side){
  if(side==='p'){ B.view.pX=0; } else { B.view.eX=330; }
}
function statName(s){ return {atk:'ATTACK',def:'DEFENSE',spa:'SP. ATK',spd:'SP. DEF',spe:'SPEED'}[s]; }
function statusText(s){
  return {psn:' was poisoned!', brn:' was burned!', par:' is paralyzed! It may be unable to move!'}[s];
}
function calcDamage(user, target, M, eff){
  const special = SPECIAL_TYPES.includes(M.type);
  let atk = user.stats[special?'spa':'atk'] * stageMul(user._st? user._st[special?'spa':'atk']:0);
  let def = target.stats[special?'spd':'def'] * stageMul(target._st? target._st[special?'spd':'def']:0);
  if(!special && user.status==='brn') atk*=0.5;
  const crit = Math.random() < ((M.fx&&M.fx.highcrit)? 0.125 : 0.0625);
  const stab = SPECIES[user.sp].types.includes(M.type)?1.5:1;
  let dmg = Math.floor(Math.floor(Math.floor(2*user.lvl/5+2)*M.pow*atk/Math.max(1,def))/50)+2;
  dmg = Math.floor(dmg*stab*eff*(crit?2:1)*(0.85+Math.random()*0.15));
  return { dmg:Math.max(1,dmg), crit };
}

async function endOfTurn(){
  if(B.result) return;
  for(const [m, side, name] of [[bmon(),'p',bmon().nick],[emon(),'e',(B.kind==='wild'?'Wild ':'Foe ')+emon().nick]]){
    if(m.hp<=0) continue;
    if(m.status==='psn'){
      m.hp = Math.max(0, m.hp - Math.max(1,Math.floor(m.maxhp/8)));
      await bmsg(name+' is hurt by poison!');
      await animHp(side, m);
    } else if(m.status==='brn'){
      m.hp = Math.max(0, m.hp - Math.max(1,Math.floor(m.maxhp/16)));
      await bmsg(name+' is hurt by its burn!');
      await animHp(side, m);
    }
    if(m.hp<=0){
      if(side==='p') await playerFainted(); else await enemyFainted();
      if(B.result) return;
    }
  }
}

// ---------- faints, exp, switching ----------
async function enemyFainted(){
  const em = emon();
  SND.sfx('faint');
  for(let i=0;i<12;i++){ B.view.eDrop += 8; await nextFrame(); }
  B.view.eHidden = true;
  await bmsg((B.kind==='wild'?'Wild ':'Foe ')+em.nick+' fainted!', {hold:true});
  // EXP
  const pm = bmon();
  if(pm.hp>0 && pm.lvl<100){
    let gain = Math.floor(SPECIES[em.sp].exp * em.lvl / 7);
    if(B.kind==='trainer') gain = Math.floor(gain*1.5);
    pm.exp += gain;
    await bmsg(pm.nick+' gained '+gain+' EXP. Points!', {hold:true});
    while(pm.lvl<100 && pm.exp >= expForLevel(pm.lvl+1)){
      await animExp(pm);
      pm.lvl++;
      const old = pm.stats;
      pm.stats = calcStats(pm.sp, pm.lvl);
      pm.maxhp = pm.stats.hp;
      pm.hp = Math.min(pm.maxhp, pm.hp + (pm.stats.hp-old.hp));
      B.view.exp = 0;
      SND.sfx('lvl');
      await bmsg(pm.nick+' grew to Lv'+pm.lvl+'!', {hold:true});
    }
    await animExp(pm);
  }
  // next enemy or victory
  if(B.kind==='trainer' && B.eIdx+1 < B.eParty.length){
    B.eIdx++;
    initVolatile(emon());
    const tname = (B.trainer.cls+' '+B.trainer.name).trim();
    await bmsg(tname+' sent out '+emon().nick+'!');
    B.view.eDrop=0; B.view.eHidden=false; B.view.eHp = emon().hp/emon().maxhp;
    SND.sfx('monCry');
    return;
  }
  SND.music('victory');
  if(B.kind==='trainer'){
    const tname = (B.trainer.cls+' '+B.trainer.name).trim();
    B.view.trainerX = 312;
    await bmsg('You defeated '+tname+'!', {hold:true});
    await bmsg(B.trainer.lose, {hold:true});
  } else if(B.legendary){
    await bmsg('The FIREBIRD lets out a final, almost approving screech... and dives into the volcano!', {hold:true});
  }
  B.result='win';
}
async function playerFainted(){
  const pm = bmon();
  SND.sfx('faint');
  for(let i=0;i<12;i++){ B.view.pDrop += 10; await nextFrame(); }
  B.view.pHidden = true;
  await bmsg(pm.nick+' fainted!', {hold:true});
  clearVolatile(pm);
  if(!Game.party.some(m=>m.hp>0)){
    B.result='loss';
    return;
  }
  const idx = await pickSwitchTarget(true);
  await doSwitch(idx, true);
}
async function doSwitch(idx, afterFaint){
  const old = bmon();
  if(!afterFaint){
    clearVolatile(old);
    await bmsg('That\'s enough, '+old.nick+'! Come back!');
    B.view.pHidden = true;
  }
  B.pIdx = idx;
  const nm = bmon();
  initVolatile(nm);
  await bmsg('Go! '+nm.nick+'!');
  B.view.pHidden=false; B.view.pDrop=0; B.view.pX=-200;
  B.view.pHp = nm.hp/nm.maxhp;
  B.view.exp = (nm.exp-expForLevel(nm.lvl))/(expForLevel(nm.lvl+1)-expForLevel(nm.lvl));
  for(let i=0;i<20;i++){ B.view.pX += 10; await nextFrame(); }
  B.view.pX=0;
  SND.sfx('monCry');
}

// ---------- catching ----------
async function throwBall(item){
  if(B.kind==='trainer'){
    bagTake(item,1);
    await bmsg('The TRAINER blocked the BALL! Don\'t be a thief!', {hold:true});
    return false;
  }
  bagTake(item,1);
  const em = emon();
  await bmsg('You threw an '+ITEMS[item].name+'!', {ms:300});
  SND.sfx('throwBall');
  // arc animation
  B.view.ballFrame = 0;
  for(let i=0;i<=20;i++){
    const t = i/20;
    B.view.ballX = 100 + t*260;
    B.view.ballY = 170 - Math.sin(t*Math.PI)*120 - t*60;
    await nextFrame();
  }
  // mon absorbed
  B.view.eHidden = true;
  B.view.ballX = 366; B.view.ballY = 128;
  await waitMs(350);
  // shake checks
  const rate = SPECIES[em.sp].catch;
  let a = ((3*em.maxhp - 2*em.hp) * rate * (ITEMS[item].bonus||1)) / (3*em.maxhp);
  if(em.status==='slp') a*=2;
  else if(em.status) a*=1.5;
  let caught = a>=255;
  let shakes = 4;
  if(!caught){
    const b = 1048560 / Math.sqrt(Math.sqrt(16711680/Math.max(1,a)));
    shakes = 0;
    for(let i=0;i<4;i++){
      if(Math.random()*65536 < b) shakes++;
      else break;
    }
    caught = shakes===4;
  }
  for(let i=0;i<Math.min(shakes,3)+ (caught?0:0); i++){
    SND.sfx('shake');
    for(let k=0;k<8;k++){ B.view.ballX = 366 + (k%2? -3:3); await nextFrame(); }
    B.view.ballX = 366;
    await waitMs(260);
  }
  if(caught){
    SND.sfx('catch');
    await waitMs(400);
    SND.music('victory');
    await bmsg('Gotcha! '+em.nick+' was caught!', {hold:true});
    em.status = em.status; // keep status
    if(Game.party.length<6){
      Game.party.push(em);
      await bmsg(em.nick+' joined your team!', {hold:true});
    } else {
      await bmsg(em.nick+' was sent to BILL\'s PC on ONE ISLAND!', {hold:true});
    }
    B.view.ballFrame=-1;
    B.result='caught';
    return true;
  }
  B.view.ballFrame=-1;
  B.view.eHidden=false;
  await bmsg(['Oh no! The POKéMON broke free!','Aww! It appeared to be caught!','Aargh! Almost had it!','Shoot! It was so close, too!'][shakes], {ms:800});
  return false;
}

// ---------- draw ----------
Battle.draw = function(x){
  if(!B.active) return;
  const bg = battleBg();
  const grd = x.createLinearGradient(0,0,0,VH);
  grd.addColorStop(0,bg.sky[0]); grd.addColorStop(1,bg.sky[1]);
  x.fillStyle=grd; x.fillRect(0,0,VW,VH);
  x.fillStyle=bg.ground; x.fillRect(0,236,VW,VH-236);

  // platforms
  x.save();
  x.fillStyle=bg.plat; x.globalAlpha=0.85;
  x.beginPath(); x.ellipse(366+ (B.view.eShake||0), 152, 88, 22, 0, 0, 7); x.fill();
  x.beginPath(); x.ellipse(120, 250, 96, 24, 0, 0, 7); x.fill();
  x.restore();

  // enemy
  if(B.view.trainerX!==null && B.trainer){
    x.drawImage(SPR.trainer(B.trainer.sprite), 0,0,48,56, B.view.trainerX-56, 34, 112, 130);
  }
  if(!B.view.eHidden){
    x.save();
    if(B.view.eFlash) x.globalAlpha = 0.25;
    x.save();
    x.beginPath(); x.rect(0,0,VW,160);
    if(B.view.eDrop>0) x.clip();
    x.drawImage(SPR.mon(emon().sp,'front'), 0,0,48,48,
      Math.round(B.view.eX + (B.view.eShake||0) - 56), Math.round(40 + B.view.eDrop), 112, 112);
    x.restore();
    x.restore();
  }
  // ball throw
  if(B.view.ballFrame>=0){
    x.drawImage(SPR.pokeball(false), 0,0,12,12, Math.round(B.view.ballX-12), Math.round(B.view.ballY-12), 24,24);
  }
  // player mon (back)
  if(!B.view.pHidden){
    x.save();
    if(B.view.pFlash) x.globalAlpha = 0.25;
    x.save();
    x.beginPath(); x.rect(0,0,VW,262);
    if(B.view.pDrop>0) x.clip();
    x.drawImage(SPR.mon(bmon().sp,'back'), 0,0,48,48,
      Math.round(B.view.pX + (B.view.pShake||0) + 56), Math.round(138 + B.view.pDrop), 128, 128);
    x.restore();
    x.restore();
  }

  // enemy info panel
  const em = emon();
  if(!B.view.eHidden || B.view.ballFrame>=0){
    UI.panel(x, 10, 12, 190, 46);
    UI.text(x, em.nick, 22, 30, {font:FONT_U});
    UI.text(x, 'Lv'+em.lvl, 188, 30, {font:FONT_U, align:'right'});
    UI.hpbar(x, 60, 36, 116, B.view.eHp);
    UI.statusTag(x, em.status, 22, 34);
  }

  // player info panel
  const pm = bmon();
  if(!B.view.pHidden){
    UI.panel(x, VW-212, 158, 202, 62);
    UI.text(x, pm.nick, VW-198, 176, {font:FONT_U});
    UI.text(x, 'Lv'+pm.lvl, VW-22, 176, {font:FONT_U, align:'right'});
    UI.hpbar(x, VW-146, 182, 116, B.view.pHp);
    UI.text(x, Math.round(B.view.pHp*pm.maxhp)+'/'+pm.maxhp, VW-22, 202, {font:FONT_U, align:'right'});
    UI.statusTag(x, pm.status, VW-198, 190);
    UI.expbar(x, VW-198, 210, 178, B.view.exp);
  }

  // text box
  UI.box(x, 8, VH-86, VW-16, 78, {fill:'#30485e', border:'#f8f0d0', inner:'#688498'});
  x.save(); x.font=FONT_D;
  const lines = UI.wrap(x, B.text, VW-(B.menu==='main'?200:60), FONT_D);
  let count=0;
  for(let i=0;i<Math.min(2,lines.length);i++){
    const take = Math.max(0, Math.min(lines[i].length, Math.floor(B.textShown-count)));
    UI.text(x, lines[i].slice(0,take), 26, VH-56+i*26, {col:'#f8f8f8', shadowCol:'rgba(0,0,0,0.4)'});
    count += lines[i].length;
  }
  x.restore();
  if(B.arrow){
    const dy = Math.sin(Game.time/8)>0?1:0;
    x.fillStyle='#f8f0d0';
    x.beginPath(); x.moveTo(VW-36,VH-26+dy); x.lineTo(VW-24,VH-26+dy); x.lineTo(VW-30,VH-19+dy); x.closePath(); x.fill();
  }

  // main menu
  if(B.menu==='main'){
    UI.box(x, VW-184, VH-86, 176, 78);
    const opts=['FIGHT','BAG','POKéMON','RUN'];
    for(let i=0;i<4;i++){
      const ox = VW-184+16+(i%2)*86, oy = VH-86+30+Math.floor(i/2)*32;
      UI.text(x, opts[i], ox+14, oy, {font:FONT_U});
      if(B.menuSel===i){
        x.fillStyle='#e05048';
        x.beginPath(); x.moveTo(ox,oy-9); x.lineTo(ox+8,oy-4.5); x.lineTo(ox,oy); x.closePath(); x.fill();
      }
    }
  }
  // move menu
  if(B.menu==='moves'){
    UI.box(x, 8, VH-86, VW-146, 78);
    const mv = pm.moves;
    for(let i=0;i<mv.length;i++){
      const ox = 28+(i%2)*160, oy = VH-56+Math.floor(i/2)*30;
      UI.text(x, MOVES[mv[i].id].name, ox+14, oy, {font:FONT_U, col: mv[i].pp>0? INK:'#a8a8b0'});
      if(B.moveSel===i){
        x.fillStyle='#e05048';
        x.beginPath(); x.moveTo(ox,oy-9); x.lineTo(ox+8,oy-4.5); x.lineTo(ox,oy); x.closePath(); x.fill();
      }
    }
    UI.box(x, VW-132, VH-86, 124, 78, {fill:'#f8f0d0', border:'#786840', inner:'#e8d8a8'});
    const cur = mv[B.moveSel];
    if(cur){
      UI.text(x, 'PP '+cur.pp+'/'+cur.maxpp, VW-118, VH-58, {font:FONT_U});
      UI.text(x, MOVES[cur.id].type.toUpperCase(), VW-118, VH-32, {font:FONT_U, col:'#786840'});
    }
  }
};
