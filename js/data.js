/* ============================================================
   POKÉMON SEVII ADVENTURES — data.js
   Type chart, moves, species, trainers, items.
   A non-commercial fan homage. Original code & art.
   ============================================================ */
'use strict';

// ---- Type chart (gen 3). CHART[atk][def] = multiplier (only non-1 listed)
const CHART = {
  normal:  { rock:.5, ghost:0, steel:.5 },
  fire:    { fire:.5, water:.5, grass:2, ice:2, bug:2, rock:.5, dragon:.5, steel:2 },
  water:   { fire:2, water:.5, grass:.5, ground:2, rock:2, dragon:.5 },
  electric:{ water:2, electric:.5, grass:.5, ground:0, flying:2, dragon:.5 },
  grass:   { fire:.5, water:2, grass:.5, poison:.5, ground:2, flying:.5, bug:.5, rock:2, dragon:.5, steel:.5 },
  ice:     { fire:.5, water:.5, grass:2, ice:.5, ground:2, flying:2, dragon:2, steel:.5 },
  fighting:{ normal:2, ice:2, poison:.5, flying:.5, psychic:.5, bug:.5, rock:2, ghost:0, dark:2, steel:2 },
  poison:  { grass:2, poison:.5, ground:.5, rock:.5, ghost:.5, steel:0 },
  ground:  { fire:2, electric:2, grass:.5, poison:2, flying:0, bug:.5, rock:2, steel:2 },
  flying:  { electric:.5, grass:2, fighting:2, bug:2, rock:.5, steel:.5 },
  psychic: { fighting:2, poison:2, psychic:.5, dark:0, steel:.5 },
  bug:     { fire:.5, grass:2, fighting:.5, poison:.5, flying:.5, psychic:2, ghost:.5, dark:2, steel:.5 },
  rock:    { fire:2, ice:2, fighting:.5, ground:.5, flying:2, bug:2, steel:.5 },
  ghost:   { normal:0, psychic:2, ghost:2, dark:.5, steel:.5 },
  dragon:  { dragon:2, steel:.5 },
  dark:    { fighting:.5, psychic:2, ghost:2, dark:.5, steel:.5 },
  steel:   { fire:.5, water:.5, electric:.5, ice:2, rock:2, steel:.5 },
};
function typeEff(atk, defTypes){
  let m = 1;
  for(const t of defTypes){ const row = CHART[atk]; if(row && row[t] !== undefined) m *= row[t]; }
  return m;
}
const SPECIAL_TYPES = ['fire','water','electric','grass','ice','psychic','dragon','dark']; // gen-3 split

// ---- Moves
// fx: {status:'psn'|'par'|'brn', chance}, {sleep,chance}, {flinch:n}, {stage:{stat,delta,target:'self'|'foe'}},
//     {multihit:true}, {highcrit:true}, {recoil:frac}, {neverMiss:true}
const MOVES = {
  tackle:      { name:'Tackle',       type:'normal',  pow:35,  acc:95,  pp:35 },
  scratch:     { name:'Scratch',      type:'normal',  pow:40,  acc:100, pp:35 },
  quickattack: { name:'Quick Attack', type:'normal',  pow:40,  acc:100, pp:30, prio:1 },
  headbutt:    { name:'Headbutt',     type:'normal',  pow:70,  acc:100, pp:15, fx:{flinch:30} },
  bodyslam:    { name:'Body Slam',    type:'normal',  pow:85,  acc:100, pp:15, fx:{status:'par',chance:30} },
  slash:       { name:'Slash',        type:'normal',  pow:70,  acc:100, pp:20, fx:{highcrit:true} },
  hyperfang:   { name:'Hyper Fang',   type:'normal',  pow:80,  acc:90,  pp:15, fx:{flinch:10} },
  furyswipes:  { name:'Fury Swipes',  type:'normal',  pow:18,  acc:80,  pp:15, fx:{multihit:true} },
  furyattack:  { name:'Fury Attack',  type:'normal',  pow:15,  acc:85,  pp:20, fx:{multihit:true} },
  takedown:    { name:'Take Down',    type:'normal',  pow:90,  acc:85,  pp:20, fx:{recoil:.25} },
  payday:      { name:'Pay Day',      type:'normal',  pow:40,  acc:100, pp:20 },
  skullbash:   { name:'Skull Bash',   type:'normal',  pow:100, acc:100, pp:10 },
  growl:       { name:'Growl',        type:'normal',  pow:0,   acc:100, pp:40, fx:{stage:{stat:'atk',delta:-1,target:'foe'}} },
  leer:        { name:'Leer',         type:'normal',  pow:0,   acc:100, pp:30, fx:{stage:{stat:'def',delta:-1,target:'foe'}} },
  tailwhip:    { name:'Tail Whip',    type:'normal',  pow:0,   acc:100, pp:30, fx:{stage:{stat:'def',delta:-1,target:'foe'}} },
  screech:     { name:'Screech',      type:'normal',  pow:0,   acc:85,  pp:40, fx:{stage:{stat:'def',delta:-2,target:'foe'}} },
  agility:     { name:'Agility',      type:'psychic', pow:0,   acc:999, pp:30, fx:{stage:{stat:'spe',delta:2,target:'self'}} },
  peck:        { name:'Peck',         type:'flying',  pow:35,  acc:100, pp:35 },
  wingattack:  { name:'Wing Attack',  type:'flying',  pow:60,  acc:100, pp:35 },
  aerialace:   { name:'Aerial Ace',   type:'flying',  pow:60,  acc:999, pp:20, fx:{neverMiss:true} },
  drillpeck:   { name:'Drill Peck',   type:'flying',  pow:80,  acc:100, pp:20 },
  skyattack:   { name:'Sky Attack',   type:'flying',  pow:110, acc:90,  pp:5,  fx:{highcrit:true} },
  watergun:    { name:'Water Gun',    type:'water',   pow:40,  acc:100, pp:25 },
  surf:        { name:'Surf',         type:'water',   pow:95,  acc:100, pp:15 },
  hydropump:   { name:'Hydro Pump',   type:'water',   pow:120, acc:80,  pp:5 },
  ember:       { name:'Ember',        type:'fire',    pow:40,  acc:100, pp:25, fx:{status:'brn',chance:10} },
  flamewheel:  { name:'Flame Wheel',  type:'fire',    pow:60,  acc:100, pp:25, fx:{status:'brn',chance:10} },
  flamethrower:{ name:'Flamethrower', type:'fire',    pow:95,  acc:100, pp:15, fx:{status:'brn',chance:10} },
  firespin:    { name:'Fire Spin',    type:'fire',    pow:35,  acc:85,  pp:15, fx:{status:'brn',chance:20} },
  firefang:    { name:'Fire Fang',    type:'fire',    pow:65,  acc:95,  pp:15, fx:{status:'brn',chance:10} },
  thunderbolt: { name:'Thunderbolt',  type:'electric',pow:95,  acc:100, pp:15, fx:{status:'par',chance:10} },
  thundershock:{ name:'ThunderShock', type:'electric',pow:40,  acc:100, pp:30, fx:{status:'par',chance:10} },
  thunderwave: { name:'Thunder Wave', type:'electric',pow:0,   acc:100, pp:20, fx:{status:'par',chance:100} },
  icebeam:     { name:'Ice Beam',     type:'ice',     pow:95,  acc:100, pp:10 },
  megahorn:    { name:'Megahorn',     type:'bug',     pow:120, acc:85,  pp:10 },
  earthquake:  { name:'Earthquake',   type:'ground',  pow:100, acc:100, pp:10 },
  magnitude:   { name:'Magnitude',    type:'ground',  pow:70,  acc:100, pp:30 },
  rockthrow:   { name:'Rock Throw',   type:'rock',    pow:50,  acc:90,  pp:15 },
  rockslide:   { name:'Rock Slide',   type:'rock',    pow:75,  acc:90,  pp:10, fx:{flinch:30} },
  karatechop:  { name:'Karate Chop',  type:'fighting',pow:50,  acc:100, pp:25, fx:{highcrit:true} },
  lowkick:     { name:'Low Kick',     type:'fighting',pow:60,  acc:100, pp:20 },
  crosschop:   { name:'Cross Chop',   type:'fighting',pow:100, acc:80,  pp:5,  fx:{highcrit:true} },
  bite:        { name:'Bite',         type:'dark',    pow:60,  acc:100, pp:25, fx:{flinch:30} },
  crunch:      { name:'Crunch',       type:'dark',    pow:80,  acc:100, pp:15, fx:{flinch:20} },
  shadowball:  { name:'Shadow Ball',  type:'ghost',   pow:80,  acc:100, pp:15 },
  lick:        { name:'Lick',         type:'ghost',   pow:20,  acc:100, pp:30, fx:{status:'par',chance:30} },
  sludgebomb:  { name:'Sludge Bomb',  type:'poison',  pow:90,  acc:100, pp:10, fx:{status:'psn',chance:30} },
  poisonsting: { name:'Poison Sting', type:'poison',  pow:15,  acc:100, pp:35, fx:{status:'psn',chance:30} },
  hypnosis:    { name:'Hypnosis',     type:'psychic', pow:0,   acc:60,  pp:20, fx:{sleep:true,chance:100} },
  confusion:   { name:'Confusion',    type:'psychic', pow:50,  acc:100, pp:25 },
  psybeam:     { name:'Psybeam',      type:'psychic', pow:65,  acc:100, pp:20 },
  // HM / field moves (usable in battle too)
  cut:         { name:'Cut',          type:'normal',  pow:50,  acc:95,  pp:30 },
  strength:    { name:'Strength',     type:'normal',  pow:80,  acc:100, pp:15 },
  rocksmash:   { name:'Rock Smash',   type:'fighting',pow:40,  acc:100, pp:15, fx:{stage:{stat:'def',delta:-1,target:'foe'},chance:50} },
  // extra attacks for Kanto wilds & gyms
  gust:        { name:'Gust',         type:'flying',  pow:40,  acc:100, pp:35 },
  poisonpowder:{ name:'Poison Powder',type:'poison',  pow:0,   acc:75,  pp:35, fx:{status:'psn',chance:100} },
  absorb:      { name:'Absorb',       type:'grass',   pow:20,  acc:100, pp:25 },
  vinewhip:    { name:'Vine Whip',    type:'grass',   pow:45,  acc:100, pp:25 },
  spark:       { name:'Spark',        type:'electric',pow:65,  acc:100, pp:20, fx:{status:'par',chance:30} },
  thunder:     { name:'Thunder',      type:'electric',pow:110, acc:70,  pp:10, fx:{status:'par',chance:30} },
  doublekick:  { name:'Double Kick',  type:'fighting',pow:30,  acc:100, pp:30, fx:{multihit:true} },
  bubblebeam:  { name:'BubbleBeam',   type:'water',   pow:65,  acc:100, pp:20 },
  bubble:      { name:'Bubble',       type:'water',   pow:20,  acc:100, pp:30 },
  horn:        { name:'Horn Attack',  type:'normal',  pow:65,  acc:100, pp:25 },
  swift:       { name:'Swift',        type:'normal',  pow:60,  acc:999, pp:20, fx:{neverMiss:true} },
  metalclaw:   { name:'Metal Claw',   type:'steel',   pow:50,  acc:95,  pp:35 },
  megadrain:   { name:'Mega Drain',   type:'grass',   pow:40,  acc:100, pp:15 },
  stringshot:  { name:'String Shot',  type:'bug',     pow:0,   acc:95,  pp:40, fx:{stage:{stat:'spe',delta:-1,target:'foe'}} },
};

// ---- Species
// base:[hp,atk,def,spa,spd,spe]  learn:[[lvl,move],...]  exp: base exp yield  catch: catch rate
const SPECIES = {
  blastoise:{ name:'BLASTOISE', types:['water'], base:[79,83,100,85,105,78], exp:210, catch:45,
    learn:[[1,'tackle'],[1,'watergun'],[20,'bite'],[35,'surf'],[42,'icebeam'],[47,'skullbash']] },
  pidgeot:{ name:'PIDGEOT', types:['normal','flying'], base:[83,80,75,70,70,91], exp:172, catch:45,
    learn:[[1,'tackle'],[1,'quickattack'],[20,'wingattack'],[38,'aerialace'],[44,'agility'],[48,'drillpeck']] },
  gengar:{ name:'GENGAR', types:['ghost','poison'], base:[60,65,60,130,75,110], exp:190, catch:45,
    learn:[[1,'lick'],[15,'hypnosis'],[30,'shadowball'],[40,'sludgebomb'],[46,'psybeam']] },
  nidoking:{ name:'NIDOKING', types:['poison','ground'], base:[81,92,77,85,75,85], exp:195, catch:45,
    learn:[[1,'poisonsting'],[20,'thunderbolt'],[35,'sludgebomb'],[43,'earthquake'],[47,'megahorn']] },
  snorlax:{ name:'SNORLAX', types:['normal'], base:[160,110,65,65,110,30], exp:154, catch:25,
    learn:[[1,'tackle'],[15,'headbutt'],[30,'bodyslam'],[40,'crunch'],[46,'earthquake']] },
  jolteon:{ name:'JOLTEON', types:['electric'], base:[65,65,60,110,95,130], exp:184, catch:45,
    learn:[[1,'thundershock'],[20,'quickattack'],[30,'thunderwave'],[38,'bite'],[45,'thunderbolt']] },
  spearow:{ name:'SPEAROW', types:['normal','flying'], base:[40,60,30,31,31,70], exp:58, catch:255,
    learn:[[1,'peck'],[1,'growl'],[15,'furyattack'],[25,'aerialace'],[30,'agility']] },
  fearow:{ name:'FEAROW', types:['normal','flying'], base:[65,90,65,61,61,100], exp:162, catch:90,
    learn:[[1,'peck'],[1,'leer'],[20,'furyattack'],[30,'aerialace'],[35,'drillpeck']] },
  meowth:{ name:'MEOWTH', types:['normal'], base:[40,45,35,40,40,90], exp:69, catch:255,
    learn:[[1,'scratch'],[1,'growl'],[15,'bite'],[25,'payday'],[30,'furyswipes'],[35,'slash']] },
  psyduck:{ name:'PSYDUCK', types:['water'], base:[50,52,48,65,50,55], exp:80, catch:190,
    learn:[[1,'scratch'],[1,'tailwhip'],[15,'confusion'],[25,'watergun'],[31,'psybeam']] },
  ponyta:{ name:'PONYTA', types:['fire'], base:[50,85,55,65,65,90], exp:152, catch:190,
    learn:[[1,'tackle'],[1,'growl'],[15,'ember'],[25,'flamewheel'],[32,'takedown'],[38,'firespin']] },
  geodude:{ name:'GEODUDE', types:['rock','ground'], base:[40,80,100,30,30,20], exp:73, catch:255,
    learn:[[1,'tackle'],[10,'rockthrow'],[20,'magnitude'],[30,'rockslide']] },
  machop:{ name:'MACHOP', types:['fighting'], base:[70,80,50,35,35,35], exp:75, catch:180,
    learn:[[1,'lowkick'],[1,'leer'],[15,'karatechop'],[30,'takedown'],[36,'crosschop']] },
  growlithe:{ name:'GROWLITHE', types:['fire'], base:[55,70,45,70,50,60], exp:91, catch:190,
    learn:[[1,'bite'],[1,'leer'],[15,'ember'],[25,'takedown'],[31,'flamewheel'],[34,'firefang']] },
  raticate:{ name:'RATICATE', types:['normal'], base:[55,81,60,50,70,97], exp:116, catch:127,
    learn:[[1,'tackle'],[1,'tailwhip'],[15,'hyperfang'],[25,'bite'],[33,'takedown']] },
  golbat:{ name:'GOLBAT', types:['poison','flying'], base:[75,80,70,65,75,90], exp:171, catch:90,
    learn:[[1,'bite'],[1,'screech'],[20,'wingattack'],[30,'poisonsting'],[35,'aerialace']] },
  drowzee:{ name:'DROWZEE', types:['psychic'], base:[60,48,45,43,90,42], exp:102, catch:190,
    learn:[[1,'headbutt'],[10,'hypnosis'],[17,'confusion'],[31,'psybeam']] },
  moltres:{ name:'MOLTRES', types:['fire','flying'], base:[90,100,90,125,85,90], exp:217, catch:3,
    learn:[[1,'wingattack'],[1,'firespin'],[30,'agility'],[43,'flamethrower'],[50,'skyattack']] },

  // ---- Kanto additions ----
  pidgey:{ name:'PIDGEY', types:['normal','flying'], base:[40,45,40,35,35,56], exp:50, catch:255,
    learn:[[1,'tackle'],[1,'gust'],[9,'quickattack'],[19,'wingattack'],[28,'aerialace']] },
  rattata:{ name:'RATTATA', types:['normal'], base:[30,56,35,25,35,72], exp:51, catch:255,
    learn:[[1,'tackle'],[1,'tailwhip'],[10,'quickattack'],[16,'hyperfang'],[23,'bite']] },
  ekans:{ name:'EKANS', types:['poison'], base:[35,60,44,40,54,55], exp:58, catch:255,
    learn:[[1,'poisonsting'],[1,'leer'],[14,'bite'],[23,'screech'],[33,'crunch']] },
  sandshrew:{ name:'SANDSHREW', types:['ground'], base:[50,75,85,20,30,40], exp:60, catch:255,
    learn:[[1,'scratch'],[11,'magnitude'],[17,'furyswipes'],[26,'slash'],[33,'earthquake']] },
  mankey:{ name:'MANKEY', types:['fighting'], base:[40,80,35,35,45,70], exp:61, catch:190,
    learn:[[1,'scratch'],[1,'leer'],[9,'karatechop'],[15,'furyswipes'],[27,'lowkick'],[33,'crosschop']] },
  oddish:{ name:'ODDISH', types:['grass','poison'], base:[45,50,55,75,65,30], exp:64, catch:255,
    learn:[[1,'absorb'],[14,'poisonpowder'],[18,'megadrain'],[32,'sludgebomb']] },
  bellsprout:{ name:'BELLSPROUT', types:['grass','poison'], base:[50,75,35,70,30,40], exp:60, catch:255,
    learn:[[1,'vinewhip'],[13,'absorb'],[15,'poisonpowder'],[30,'megadrain']] },
  pikachu:{ name:'PIKACHU', types:['electric'], base:[35,55,40,50,50,90], exp:82, catch:190,
    learn:[[1,'thundershock'],[1,'quickattack'],[18,'spark'],[26,'thunderbolt']] },
  raichu:{ name:'RAICHU', types:['electric'], base:[60,90,55,90,80,110], exp:122, catch:75,
    learn:[[1,'thundershock'],[1,'quickattack'],[1,'spark'],[1,'thunderbolt'],[1,'thunder']] },
  voltorb:{ name:'VOLTORB', types:['electric'], base:[40,30,50,55,55,100], exp:66, catch:190,
    learn:[[1,'tackle'],[1,'spark'],[17,'thundershock'],[29,'thunderbolt']] },
  magnemite:{ name:'MAGNEMITE', types:['electric','steel'], base:[25,35,70,95,55,45], exp:89, catch:190,
    learn:[[1,'tackle'],[1,'thundershock'],[11,'metalclaw'],[21,'spark'],[35,'thunderbolt']] },
  tentacool:{ name:'TENTACOOL', types:['water','poison'], base:[40,40,35,50,100,70], exp:67, catch:190,
    learn:[[1,'bubble'],[1,'poisonsting'],[13,'watergun'],[22,'bubblebeam'],[35,'sludgebomb']] },
  magikarp:{ name:'MAGIKARP', types:['water'], base:[20,10,55,15,20,80], exp:40, catch:255,
    learn:[[1,'tackle']] },
  goldeen:{ name:'GOLDEEN', types:['water'], base:[45,67,60,35,50,63], exp:64, catch:225,
    learn:[[1,'peck'],[1,'tailwhip'],[10,'horn'],[24,'watergun'],[31,'bubblebeam']] },
  poliwag:{ name:'POLIWAG', types:['water'], base:[40,50,40,40,40,90], exp:77, catch:255,
    learn:[[1,'bubble'],[16,'watergun'],[19,'hypnosis'],[25,'bubblebeam']] },
  staryu:{ name:'STARYU', types:['water'], base:[30,45,55,70,55,85], exp:68, catch:225,
    learn:[[1,'tackle'],[1,'watergun'],[19,'swift'],[27,'bubblebeam'],[37,'surf']] },
  starmie:{ name:'STARMIE', types:['water','psychic'], base:[60,75,85,100,85,115], exp:106, catch:60,
    learn:[[1,'watergun'],[1,'swift'],[1,'bubblebeam'],[1,'psybeam'],[1,'surf']] },
  onix:{ name:'ONIX', types:['rock','ground'], base:[35,45,160,30,45,70], exp:77, catch:180,
    learn:[[1,'tackle'],[1,'rockthrow'],[15,'rockslide'],[24,'magnitude'],[33,'earthquake']] },
};

// ---- Status conditions
const STATUS = {
  psn:{ tag:'PSN', color:'#a040a0' },
  brn:{ tag:'BRN', color:'#f08030' },
  par:{ tag:'PAR', color:'#f8d030' },
  slp:{ tag:'SLP', color:'#8890a0' },
};

// ---- Items
const ITEMS = {
  potion:      { name:'POTION',       kind:'heal', amt:20,  desc:'Restores 20 HP of one POKéMON.' },
  superpotion: { name:'SUPER POTION', kind:'heal', amt:60,  desc:'Restores 60 HP of one POKéMON.' },
  hyperpotion: { name:'HYPER POTION', kind:'heal', amt:120, desc:'Restores 120 HP of one POKéMON.' },
  fullheal:    { name:'FULL HEAL',    kind:'cure',          desc:'Heals all status problems of one POKéMON.' },
  revive:      { name:'REVIVE',       kind:'revive',        desc:'Revives a fainted POKéMON with half its HP.' },
  ultraball:   { name:'ULTRA BALL',   kind:'ball', bonus:2, desc:'A high-performance BALL for catching wild POKéMON.' },
  ruby:        { name:'THE RUBY',     kind:'key',           desc:'A glowing gem from deep inside MT. EMBER.' },
  hm_surf:     { name:'HM — SURF',     kind:'key', desc:'Ride POKéMON across deep water. Face the sea and press A.' },
  hm_cut:      { name:'HM — CUT',      kind:'key', desc:'Chop down small, thin trees blocking the way.' },
  hm_strength: { name:'HM — STRENGTH', kind:'key', desc:'Push heavy boulders out of the way. Activate, then walk into them.' },
  thunderbadge:{ name:'THUNDER BADGE', kind:'key', desc:'Proof of victory over VERMILION\'s LT. SURGE.' },
  cascadebadge:{ name:'CASCADE BADGE', kind:'key', desc:'Proof of victory over CERULEAN\'s MISTY.' },
};

// ---- Trainers
const TRAINERS = {
  lass_joana:{ cls:'LASS', name:'JOANA', sprite:'lass', party:[['meowth',33],['raticate',34]],
    intro:'My MEOWTH dug up something shiny on TREASURE BEACH! Wanna see it? Too bad! Battle first!',
    lose:'Aww! MEOWTH, our shiny thing...!',
    after:'It was just a bottle cap anyway. But it was MY bottle cap.' },
  camper_ricky:{ cls:'CAMPER', name:'RICKY', sprite:'camper', party:[['growlithe',34],['ponyta',35]],
    intro:'KINDLE ROAD is the best campsite ever! My fire POKéMON light the campfire. Show me your spark!',
    lose:'Whoa! Totally extinguished!',
    after:'You should see MT. EMBER at sunset. The whole sky turns the color of embers.' },
  hiker_earl:{ cls:'HIKER', name:'EARL', sprite:'hiker', party:[['geodude',34],['geodude',35],['machop',36]],
    intro:'Hah! You need boulder-solid legs to climb these slopes! Let me test yours!',
    lose:'Crumbled like old granite!',
    after:'Watch yourself up top. I saw suspicious folks in black sneaking toward the summit.' },
  grunt_kai:{ cls:'TEAM ROCKET GRUNT', name:'', sprite:'grunt', party:[['raticate',36],['drowzee',36]],
    intro:'Huh?! A kid?! This is a restricted... uh... volcano inspection site! Beat it! Or I will beat YOU!',
    lose:'Inspection... failed...',
    after:'We were only told to guard this cave. Nobody said anything about super-strong kids!' },
  grunt_rico:{ cls:'TEAM ROCKET GRUNT', name:'', sprite:'grunt', party:[['machop',37],['golbat',37]],
    intro:'You beat my partner? He always was the weak one. The gem in this cave belongs to TEAM ROCKET!',
    lose:'The BOSS is gonna demote me to mopping duty...',
    after:'Fine, take the stupid rock. Rocks are heavy anyway. We\'re going back to the hideout!' },

  // ---- Kanto: Route 5 & Nugget Bridge ----
  youngster_joey:{ cls:'YOUNGSTER', name:'JOEY', sprite:'youngster', party:[['rattata',31],['spearow',31]],
    intro:'Hey! My RATTATA is in the top percentage of RATTATA! Wanna see?',
    lose:'No way! My RATTATA...!',
    after:'Okay, maybe it\'s just... a normal-percentage RATTATA. But I still love it!' },
  lass_kanto:{ cls:'LASS', name:'IRIS', sprite:'lass', party:[['oddish',31],['pidgey',32]],
    intro:'Are you challenging the NUGGET BRIDGE trainers? You have to beat all of us in a row!',
    lose:'Eek! You\'re strong!',
    after:'Keep going north — but watch out, there\'s a shady offer waiting at the end.' },
  camper_liam:{ cls:'CAMPER', name:'LIAM', sprite:'camper', party:[['sandshrew',32],['mankey',32]],
    intro:'Two down? You won\'t get past MY POKéMON so easily!',
    lose:'Argh, tripped at the finish line!',
    after:'Fine, fine. You earned the right to keep crossing.' },
  bugcatcher_theo:{ cls:'BUG CATCHER', name:'THEO', sprite:'bugcatcher', party:[['oddish',32],['bellsprout',33]],
    intro:'My grass POKéMON grow strong in the CERULEAN air! Photosynthesize THIS!',
    lose:'Wilted...!',
    after:'You\'re nearly across. That last guy in black? He\'s bad news.' },
  rocket_nugget:{ cls:'TEAM ROCKET', name:'', sprite:'grunt', party:[['ekans',34],['sandshrew',34],['golbat',35]],
    intro:'Hehe! I watched you crush the bridge. TEAM ROCKET could use talent like yours. Join us — or be crushed!',
    lose:'Tch! You\'re too straight-laced for us anyway!',
    after:'Bah. Keep your morals. We\'re slithering back to CERULEAN\'s hideout... forget I said that!' },
  sailor_marco:{ cls:'SAILOR', name:'MARCO', sprite:'sailor', party:[['poliwag',33],['tentacool',34]],
    intro:'Landlubber! Nobody surfs my patch of sea without a proper battle first!',
    lose:'Blow me down!',
    after:'Har! Fair winds to ye. The sea route opens up once you can SURF.' },
  swimmer_dana:{ cls:'SWIMMER', name:'DANA', sprite:'swimmer', party:[['goldeen',34],['staryu',35]],
    intro:'You SURFED all the way out here? Impressive. Let\'s see if you can battle on the waves too!',
    lose:'Glub... you win!',
    after:'The CERULEAN water routes hide all sorts of POKéMON. Cast a wide net!' },

  // ---- Gym: Vermilion (Lt. Surge) ----
  gym_sailor:{ cls:'SAILOR', name:'DALE', sprite:'sailor', party:[['voltorb',35],['pikachu',35]],
    intro:'This is LT. SURGE\'s gym — the LIGHTNING AMERICAN\'s turf! You\'ll have to get past me first!',
    lose:'Short-circuited!',
    after:'The LT.\'s RAICHU packs a real punch. Ground types laugh at electricity, y\'know.' },
  surge:{ cls:'LEADER', name:'LT. SURGE', sprite:'surge', gym:true, badge:'thunderbadge',
    party:[['voltorb',36],['magnemite',36],['pikachu',38],['raichu',40]],
    intro:'Hey, KID! They call me the LIGHTNING AMERICAN! Tanks saved my hide in the war — POKéMON do now! My RAICHU\'ll fry you crisp!',
    lose:'Whoa! The kid\'s got voltage! You\'ve earned it, soldier.',
    after:'Take the THUNDER BADGE! It boosts your POKéMON\'s speed. Now scram before I change my mind — heh!' },

  // ---- Gym: Cerulean (Misty) ----
  gym_swimmer:{ cls:'SWIMMER', name:'LUANA', sprite:'swimmer', party:[['goldeen',36],['poliwag',36]],
    intro:'MISTY\'s the real deal, but you have to soak ME first!',
    lose:'You washed right over me!',
    after:'MISTY\'s STARMIE is fast AND hits like a tidal wave. Bring your best.' },
  misty:{ cls:'LEADER', name:'MISTY', sprite:'misty', gym:true, badge:'cascadebadge',
    party:[['goldeen',36],['staryu',37],['starmie',42]],
    intro:'I\'m MISTY, the CERULEAN GYM LEADER! My policy is an all-out offensive with WATER POKéMON! Ready? You\'d better be!',
    lose:'...Wow. You really are as good as they say. Okay — you win.',
    after:'The CASCADE BADGE is yours. It makes even traded POKéMON obey you. And... good luck out there, seriously.' },
};

// ---- Mon factory
function expForLevel(l){ return l*l*l; }
function calcStats(sp, lvl){
  const b = SPECIES[sp].base;
  return {
    hp:  Math.floor(2*b[0]*lvl/100) + lvl + 10,
    atk: Math.floor(2*b[1]*lvl/100) + 5,
    def: Math.floor(2*b[2]*lvl/100) + 5,
    spa: Math.floor(2*b[3]*lvl/100) + 5,
    spd: Math.floor(2*b[4]*lvl/100) + 5,
    spe: Math.floor(2*b[5]*lvl/100) + 5,
  };
}
function movesAtLevel(sp, lvl){
  const learned = SPECIES[sp].learn.filter(e => e[0] <= lvl).map(e => e[1]);
  return learned.slice(-4);
}
function makeMon(sp, lvl, moves){
  const st = calcStats(sp, lvl);
  const mv = (moves || movesAtLevel(sp, lvl)).map(id => ({ id, pp:MOVES[id].pp, maxpp:MOVES[id].pp }));
  return {
    sp, lvl, nick:SPECIES[sp].name,
    hp:st.hp, maxhp:st.hp, stats:st,
    moves:mv, status:null, sleepTurns:0,
    exp:expForLevel(lvl),
  };
}
function healMon(m){
  m.hp = m.maxhp; m.status = null; m.sleepTurns = 0;
  for(const mv of m.moves) mv.pp = mv.maxpp;
}
