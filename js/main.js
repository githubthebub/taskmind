/* ============================================================
   main.js — boot, title screen, ending credits, main loop.
   ============================================================ */
'use strict';

// ---------------- title ----------------
const Title = { t:0, showMenu:false };
Title.draw = function(x){
  Title.t++;
  const t = Title.t;
  // sunset sky
  const grd = x.createLinearGradient(0,0,0,VH);
  grd.addColorStop(0,'#2a3a78'); grd.addColorStop(0.45,'#c05868'); grd.addColorStop(0.72,'#f8a050'); grd.addColorStop(1,'#f8d078');
  x.fillStyle=grd; x.fillRect(0,0,VW,VH);
  // sun
  x.save(); x.globalAlpha=0.9; x.fillStyle='#f8e8a0';
  x.beginPath(); x.arc(VW/2, 208, 34, 0, 7); x.fill(); x.restore();
  // sea
  x.fillStyle='#28527a'; x.fillRect(0,214,VW,VH-214);
  for(let i=0;i<9;i++){
    const yy = 222+i*11;
    const off = Math.sin(t/40+i)*8;
    x.fillStyle = i%2? 'rgba(120,190,240,0.25)':'rgba(248,208,120,0.28)';
    x.fillRect(VW/2-120+off - i*9, yy, 90+i*22, 2);
  }
  // island silhouettes
  x.fillStyle='#1c3050';
  x.beginPath(); x.moveTo(0,224); x.quadraticCurveTo(60,178,132,222); x.lineTo(132,240); x.lineTo(0,240); x.fill();
  x.beginPath(); x.moveTo(352,226); x.quadraticCurveTo(414,162,480,220); x.lineTo(480,244); x.lineTo(352,244); x.fill();
  // volcano smoke
  x.save(); x.globalAlpha=0.35+0.1*Math.sin(t/30); x.fillStyle='#d8c8c8';
  x.beginPath(); x.arc(416+Math.sin(t/50)*4, 150-((t/2)%36), 8+((t/2)%36)/4, 0, 7); x.fill(); x.restore();
  // moltres
  const bob = Math.sin(t/32)*6;
  x.save(); x.imageSmoothingEnabled=false;
  x.drawImage(SPR.mon('moltres','front'), 0,0,48,48, VW/2-84, 34+bob, 168, 168);
  x.restore();
  // logo
  x.save();
  x.font='34px "Press Start 2P"'; x.textAlign='center';
  x.lineWidth=8; x.strokeStyle='#2a3a78'; x.lineJoin='round';
  x.strokeText('POKéMON', VW/2, 74);
  x.fillStyle='#f8d020'; x.fillText('POKéMON', VW/2, 74);
  x.fillStyle='#f8f0d0'; x.font='15px "Press Start 2P"';
  x.lineWidth=5; x.strokeText('SEVII ADVENTURES', VW/2, 102);
  x.fillText('SEVII ADVENTURES', VW/2, 102);
  x.font='9px "Press Start 2P"';
  x.fillStyle='rgba(248,240,208,0.75)';
  x.fillText('A FIRERED-STYLE FAN DEMO', VW/2, 122);
  x.restore();
  if(!Title.showMenu && Math.floor(t/32)%2===0){
    UI.text(x, 'PRESS ENTER', VW/2, 286, {font:FONT_UB, col:'#f8f8f8', align:'center', shadowCol:'rgba(0,0,0,0.5)'});
  }
  UI.text(x, 'Z/SPACE: A   X: B   ENTER: START   SHIFT: RUN   M: SOUND', VW/2, VH-8, {font:'7px "Press Start 2P"', col:'rgba(255,255,255,0.55)', align:'center', shadow:false});
};

async function titleScreen(){
  Game.mode='title';
  SND.music('title');
  Title.showMenu=false;
  while(!Input.took('START') && !Input.took('A')) await nextFrame();
  SND.sfx('confirm');
  Title.showMenu=true;
  while(true){
    if(hasSave()){
      const choice = await Menu.open(['CONTINUE','NEW GAME'], {x:VW/2-80, y:150, w:160, noCancel:true});
      if(choice===0){
        const slot = await slotScreen('load');
        if(slot<0) continue;              // back to title menu
        if(loadGame(slot)){
          await UI.fadeOut(500);
          Game.mode='world';
          await UI.fadeIn(400);
          return;
        }
        continue;
      }
    } else {
      await Menu.open(['NEW GAME'], {x:VW/2-80, y:150, w:160, noCancel:true});
    }
    await UI.fadeOut(500);
    await newGame();
    return;
  }
}

async function newGame(){
  Game.flags={}; Game.bag=defaultBag(); Game.party=defaultParty(); Game.steps=0;
  Game.playFrames=0; Game.saveSlot=null;
  loadMap('town', 14, 22, 1);
  Game.mode='world';
  await UI.fadeIn(600);
  await waitMs(300);
  // opening cutscene: Bill on the pier
  const bill = Game.npcs.find(n=>n.id==='bill_pier');
  if(bill && !Game.flags.introDone){
    await interactWith(bill);
  }
}

// ---------------- ending ----------------
const Ending = { active:false, t:0, lines:[] };
Ending.run = async function(){
  Game.flags.deliveredRuby = true;
  SND.stopMusic();
  // machine comes alive
  Fx.white=true;
  for(let i=0;i<3;i++){ Fx.flash=0.9; await waitMs(90); Fx.flash=0; await waitMs(120); }
  Fx.white=false;
  SND.sfx('machine');
  await Dlg.say('The NETWORK MACHINE hums to life! Lights sweep across the console — green... green... ALL GREEN!');
  SND.music('ending');
  await Dlg.say("CELIO: It works!! The SEVII ISLANDS are linked to KANTO! BILL!! WE DID IT!!");
  await Dlg.say("BILL: Ha! Never doubted it for a second. Either of you!");
  await Dlg.say('CELIO: Thank you, friend. Truly. Today you connected more than machines.');
  // credits
  Ending.lines = [
    ['POKéMON','big'],
    ['SEVII ADVENTURES','mid'],
    ['',''],
    ['A fan-made homage to',''],
    ['Pokémon FireRed & LeafGreen',''],
    ['',''],
    ['STARRING','head'],
    ['BLASTOISE   PIDGEOT','' ],
    ['GENGAR   NIDOKING',''],
    ['SNORLAX   JOLTEON',''],
    ['',''],
    ['SPECIAL THANKS','head'],
    ['CELIO — for believing in a rock',''],
    ['BILL — for the boat ride',''],
    ['GRANDMA — for the ULTRA BALLs',''],
    ['TEAM ROCKET — for leaving',''],
    ['',''],
    ['Original code, art & music',''],
    ['made with Claude',''],
    ['',''],
    ['Pokémon © Nintendo / Creatures /',''],
    ['GAME FREAK. This is a free fan demo,',''],
    ['not affiliated or endorsed.',''],
    ['',''],
    ['AND YOU','head'],
    ['Thanks for playing!',''],
  ];
  const prevMode = Game.mode;
  Game.mode='ending';
  Ending.active=true; Ending.t=0;
  const total = Ending.lines.length*26 + VH + 60;
  while(Ending.t < total){
    Ending.t += Input.held('A') ? 3.2 : 1.1;
    if(Input.took('START')) break;
    await nextFrame();
  }
  Ending.active=false;
  Game.mode=prevMode;
  await UI.fadeOut(100); Fx.fade=1;
  SND.music('center');
  await waitMs(400);
  await UI.fadeIn(500);
  await Dlg.say('CELIO: Oh — before I forget. The islanders keep talking about a light circling MT. EMBER\'s summit...');
  await Dlg.say('CELIO: If anyone should go see what it is... it\'s you. Your adventure isn\'t over yet!');
  saveGame();
  await Dlg.say('(Your progress has been saved. The FIREBIRD awaits...)');
};
Ending.draw = function(x){
  x.fillStyle='#0c0c18'; x.fillRect(0,0,VW,VH);
  // stars
  for(let i=0;i<40;i++){
    const sx = (i*127)%VW, sy = (i*211)%VH;
    x.fillStyle = `rgba(255,255,255,${0.2+0.3*Math.abs(Math.sin(i+Game.time/60))})`;
    x.fillRect(sx, sy, 2, 2);
  }
  x.save(); x.imageSmoothingEnabled=false; x.globalAlpha=0.5;
  x.drawImage(SPR.mon('moltres','front'), 0,0,48,48, VW/2-60, 96, 120, 120);
  x.restore();
  x.save(); x.textAlign='center';
  Ending.lines.forEach((l,i)=>{
    const yy = VH + i*26 - Ending.t;
    if(yy<-30||yy>VH+30) return;
    if(l[1]==='big'){ x.font='24px "Press Start 2P"'; x.fillStyle='#f8d020'; }
    else if(l[1]==='mid'){ x.font='12px "Press Start 2P"'; x.fillStyle='#f8f0d0'; }
    else if(l[1]==='head'){ x.font='10px "Press Start 2P"'; x.fillStyle='#f8a050'; }
    else { x.font='9px "Press Start 2P"'; x.fillStyle='#e8e8f0'; }
    x.fillText(l[0], VW/2, yy);
  });
  x.restore();
};

// ---------------- main loop ----------------
function drawFrame(){
  const x = G_ctx;
  x.imageSmoothingEnabled = false;
  if(Game.mode==='title'){ Title.draw(x); }
  else if(Game.mode==='ending'){ Ending.draw(x); }
  else if(Game.mode==='battle'){ Battle.draw(x); }
  else if(Game.mode==='world'){ worldDraw(x); }
  else { x.fillStyle='#101018'; x.fillRect(0,0,VW,VH); }
  // overlays
  partyDraw(x);
  summaryDraw(x);
  bagDraw(x);
  slotDraw(x);
  Dlg.draw(x);
  Menu.draw(x);
  if(Game.mode==='world') Banner.draw(x);
  UI.drawFx(x);
}

function loop(){
  requestAnimationFrame(loop);
  frameCount++;
  Game.time++;
  if(Game.mode!=='title' && Game.mode!=='boot') Game.playFrames = (Game.playFrames||0)+1;
  if(Game.mode==='world') worldUpdate();
  tickWaiters();
  drawFrame();
}

function fitCanvas(){
  const pad = document.getElementById('gamepad');
  const padH = (pad && getComputedStyle(pad).display!=='none') ? pad.offsetHeight+8 : 0;
  const availW = window.innerWidth - 16;
  const availH = window.innerHeight - 16 - padH;
  let scale = Math.min(availW/VW, availH/VH);
  if(scale>1) scale = Math.max(1, Math.floor(scale*2)/2);
  G_canvas.style.width = Math.round(VW*scale)+'px';
  G_canvas.style.height = Math.round(VH*scale)+'px';
}

// ---------------- debug helpers (used by automated tests) ----------------
function debugSpriteSheet(){
  const x = G_ctx;
  x.fillStyle='#20303c'; x.fillRect(0,0,VW,VH);
  const mons = Object.keys(SPECIES);
  mons.forEach((id,i)=>{
    const col = i%9, row = Math.floor(i/9);
    x.drawImage(SPR.mon(id,'front'), 4+col*53, 4+row*62, 48,48);
    x.font='7px monospace'; x.fillStyle='#fff'; x.textAlign='center';
    x.fillText(id.slice(0,9), 4+col*53+24, 60+row*62);
  });
  ['blastoise','pidgeot','gengar','nidoking','snorlax','jolteon'].forEach((id,i)=>{
    x.drawImage(SPR.mon(id,'back'), 4+i*53, 132, 48,48);
    x.fillText(id.slice(0,9)+'-bk', 4+i*53+24, 188);
  });
  ['camper','hiker','lass','grunt'].forEach((id,i)=>{
    x.drawImage(SPR.trainer(id), 340+i*34, 132, 24,28);
  });
  const chars = Object.keys(CHAR_PALS);
  chars.forEach((id,i)=>{
    for(let d=0;d<4;d++) x.drawImage(SPR.char(id,d,0), 4+i*34+ (d%2)*16, 196+Math.floor(d/2)*20, 16,20);
    x.font='6px monospace'; x.fillStyle='#fff';
    x.fillText(id.slice(0,7), 4+i*34+16, 244);
  });
  const tiles = Object.keys(TILE_ART);
  tiles.forEach((ch,i)=>{
    x.drawImage(SPR.tile(ch,0), 4+i*22, 252, 20,20);
    x.font='8px monospace'; x.fillStyle='#fff';
    x.fillText(ch, 4+i*22+10, 284);
  });
  ['pokecenter','house','boat','machine','pedestal'].forEach((s,i)=>{
    const img = SPR.stamp(s);
    x.drawImage(img, 4+i*72, 288, img.width*0.6, img.height*0.35);
  });
}

// ---------------- boot ----------------
window.addEventListener('load', async ()=>{
  G_canvas = document.getElementById('game');
  G_ctx = G_canvas.getContext('2d');
  G_ctx.imageSmoothingEnabled = false;
  bindInput();
  // keyboard focus insurance (esp. when embedded in an iframe/artifact)
  G_canvas.setAttribute('tabindex','0');
  G_canvas.style.outline = 'none';
  const grabFocus = ()=>{ try{ window.focus(); G_canvas.focus(); }catch(e){} SND.init(); };
  grabFocus();
  document.addEventListener('pointerdown', grabFocus);
  fitCanvas();
  window.addEventListener('resize', fitCanvas);
  try{ await document.fonts.ready; }catch(e){}
  try{ await Promise.all([
    document.fonts.load('9px "Press Start 2P"'),
    document.fonts.load('21px VT323'),
  ]);}catch(e){}

  const q = new URLSearchParams(location.search);
  window.__game = { Game, Battle, SPR, MAPS, loadMap, makeMon, Input, PartyUI, BagUI, Dlg, Menu, B, saveGame, loadGame, slotInfo, SlotUI };
  if(q.get('debug')==='sprites'){
    requestAnimationFrame(function ds(){ requestAnimationFrame(ds); frameCount++; Game.time++; tickWaiters(); debugSpriteSheet(); });
    return;
  }
  loop();
  if(q.get('map')){
    // debug teleport straight into the world
    Game.flags={introDone:true}; Game.bag=defaultBag(); Game.party=defaultParty();
    loadMap(q.get('map'), Number(q.get('x')||5), Number(q.get('y')||5), Number(q.get('dir')||0));
    Game.mode='world';
    Fx.fade=0;
    return;
  }
  titleScreen();
});
