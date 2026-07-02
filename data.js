// ============================================================
// POKeMON FRLG: SEVII EDITION - game data
// Types, moves, species, sprites, maps, NPCs
// ============================================================

'use strict';

// ---------- Type chart (Gen 3) ----------
// TYPE_CHART[attacker][defender] = multiplier (missing = 1)
const TYPE_CHART = {
  NORMAL:   { ROCK:.5, GHOST:0, STEEL:.5 },
  FIRE:     { FIRE:.5, WATER:.5, GRASS:2, ICE:2, BUG:2, ROCK:.5, DRAGON:.5, STEEL:2 },
  WATER:    { FIRE:2, WATER:.5, GRASS:.5, GROUND:2, ROCK:2, DRAGON:.5 },
  ELECTRIC: { WATER:2, ELECTRIC:.5, GRASS:.5, GROUND:0, FLYING:2, DRAGON:.5 },
  GRASS:    { FIRE:.5, WATER:2, GRASS:.5, POISON:.5, GROUND:2, FLYING:.5, BUG:.5, ROCK:2, DRAGON:.5, STEEL:.5 },
  ICE:      { FIRE:.5, WATER:.5, GRASS:2, ICE:.5, GROUND:2, FLYING:2, DRAGON:2, STEEL:.5 },
  FIGHTING: { NORMAL:2, ICE:2, POISON:.5, FLYING:.5, PSYCHIC:.5, BUG:.5, ROCK:2, GHOST:0, DARK:2, STEEL:2 },
  POISON:   { GRASS:2, POISON:.5, GROUND:.5, ROCK:.5, GHOST:.5, STEEL:0 },
  GROUND:   { FIRE:2, ELECTRIC:2, GRASS:.5, POISON:2, FLYING:0, BUG:.5, ROCK:2, STEEL:2 },
  FLYING:   { ELECTRIC:.5, GRASS:2, FIGHTING:2, BUG:2, ROCK:.5, STEEL:.5 },
  PSYCHIC:  { FIGHTING:2, POISON:2, PSYCHIC:.5, DARK:0, STEEL:.5 },
  BUG:      { FIRE:.5, GRASS:2, FIGHTING:.5, POISON:.5, FLYING:.5, PSYCHIC:2, GHOST:.5, DARK:2, STEEL:.5 },
  ROCK:     { FIRE:2, ICE:2, FIGHTING:.5, GROUND:.5, FLYING:2, BUG:2, STEEL:.5 },
  GHOST:    { NORMAL:0, PSYCHIC:2, GHOST:2, DARK:.5, STEEL:.5 },
  DRAGON:   { DRAGON:2, STEEL:.5 },
  DARK:     { FIGHTING:.5, PSYCHIC:2, GHOST:2, DARK:.5, STEEL:.5 },
  STEEL:    { FIRE:.5, WATER:.5, ELECTRIC:.5, ICE:2, ROCK:2, STEEL:.5 },
};

// Gen 3: damage category is determined by move TYPE
const SPECIAL_TYPES = ['FIRE','WATER','ELECTRIC','GRASS','ICE','PSYCHIC','DRAGON','DARK'];

// ---------- Moves ----------
// pow 0 = status move. eff: {status, ch} inflict / {stat, stg, who, ch} stage change /
// {heal} percent of max HP / {flinch} chance / prio, neverMiss, selfSleep flags
const MOVES = {
  'SURF':         { type:'WATER',    pow:95,  acc:100, pp:15 },
  'ICE BEAM':     { type:'ICE',      pow:95,  acc:100, pp:10, eff:{status:'FRZ', ch:10} },
  'BITE':         { type:'DARK',     pow:60,  acc:100, pp:25, eff:{flinch:30} },
  'SKULL BASH':   { type:'NORMAL',   pow:100, acc:100, pp:15 },
  'AERIAL ACE':   { type:'FLYING',   pow:60,  acc:0,   pp:20, neverMiss:true },
  'QUICK ATTACK': { type:'NORMAL',   pow:40,  acc:100, pp:30, prio:1 },
  'RETURN':       { type:'NORMAL',   pow:90,  acc:100, pp:20 },
  'SAND-ATTACK':  { type:'GROUND',   pow:0,   acc:100, pp:15, eff:{stat:'acc', stg:-1, who:'foe'} },
  'PSYCHIC':      { type:'PSYCHIC',  pow:90,  acc:100, pp:10, eff:{stat:'spd', stg:-1, who:'foe', ch:10} },
  'SHADOW BALL':  { type:'GHOST',    pow:80,  acc:100, pp:15, eff:{stat:'spd', stg:-1, who:'foe', ch:20} },
  'CALM MIND':    { type:'PSYCHIC',  pow:0,   acc:0,   pp:20, eff:{stat:'spa+spd', stg:1, who:'self'} },
  'RECOVER':      { type:'NORMAL',   pow:0,   acc:0,   pp:10, eff:{heal:50} },
  'BODY SLAM':    { type:'NORMAL',   pow:85,  acc:100, pp:15, eff:{status:'PAR', ch:30} },
  'EARTHQUAKE':   { type:'GROUND',   pow:100, acc:100, pp:10 },
  'REST':         { type:'PSYCHIC',  pow:0,   acc:0,   pp:10, eff:{heal:100}, selfSleep:true },
  'ROCK SLIDE':   { type:'ROCK',     pow:75,  acc:90,  pp:10, eff:{flinch:30} },
  'THUNDERBOLT':  { type:'ELECTRIC', pow:95,  acc:100, pp:15, eff:{status:'PAR', ch:10} },
  'THUNDER WAVE': { type:'ELECTRIC', pow:0,   acc:100, pp:20, eff:{status:'PAR', ch:100} },
  'BRICK BREAK':  { type:'FIGHTING', pow:75,  acc:100, pp:15 },
  'SLUDGE BOMB':  { type:'POISON',   pow:90,  acc:100, pp:10, eff:{status:'PSN', ch:30} },
  'MEGAHORN':     { type:'BUG',      pow:120, acc:85,  pp:10 },
  // wild Pokemon moves
  'PECK':         { type:'FLYING',   pow:35,  acc:100, pp:35 },
  'FURY ATTACK':  { type:'NORMAL',   pow:45,  acc:85,  pp:20 },
  'LEER':         { type:'NORMAL',   pow:0,   acc:100, pp:30, eff:{stat:'def', stg:-1, who:'foe'} },
  'GROWL':        { type:'NORMAL',   pow:0,   acc:100, pp:40, eff:{stat:'atk', stg:-1, who:'foe'} },
  'EMBER':        { type:'FIRE',     pow:40,  acc:100, pp:25, eff:{status:'BRN', ch:10} },
  'STOMP':        { type:'NORMAL',   pow:65,  acc:100, pp:20, eff:{flinch:30} },
  'TAIL WHIP':    { type:'NORMAL',   pow:0,   acc:100, pp:30, eff:{stat:'def', stg:-1, who:'foe'} },
  'TACKLE':       { type:'NORMAL',   pow:35,  acc:95,  pp:35 },
  'ROCK THROW':   { type:'ROCK',     pow:50,  acc:90,  pp:15 },
  'MUD-SLAP':     { type:'GROUND',   pow:20,  acc:100, pp:10, eff:{stat:'acc', stg:-1, who:'foe'} },
  'DEFENSE CURL': { type:'NORMAL',   pow:0,   acc:0,   pp:40, eff:{stat:'def', stg:1, who:'self'} },
  'SCRATCH':      { type:'NORMAL',   pow:40,  acc:100, pp:35 },
  'PAY DAY':      { type:'NORMAL',   pow:40,  acc:100, pp:20 },
  'SCREECH':      { type:'NORMAL',   pow:0,   acc:85,  pp:40, eff:{stat:'def', stg:-2, who:'foe'} },
};

// ---------- Species ----------
// base: [hp, atk, def, spa, spd, spe]
const SPECIES = {
  BLASTOISE: { name:'BLASTOISE', types:['WATER'],             base:[79,83,100,85,105,78],  exp:210, catchRate:45 },
  PIDGEOT:   { name:'PIDGEOT',   types:['NORMAL','FLYING'],   base:[83,80,75,70,70,91],    exp:172, catchRate:45 },
  ALAKAZAM:  { name:'ALAKAZAM',  types:['PSYCHIC'],           base:[55,50,45,135,85,120],  exp:186, catchRate:50 },
  SNORLAX:   { name:'SNORLAX',   types:['NORMAL'],            base:[160,110,65,65,110,30], exp:154, catchRate:25 },
  RAICHU:    { name:'RAICHU',    types:['ELECTRIC'],          base:[60,90,55,90,80,100],   exp:122, catchRate:75 },
  NIDOKING:  { name:'NIDOKING',  types:['POISON','GROUND'],   base:[81,92,77,85,75,85],    exp:195, catchRate:45 },
  SPEAROW:   { name:'SPEAROW',   types:['NORMAL','FLYING'],   base:[40,60,30,31,31,70],    exp:58,  catchRate:255 },
  PONYTA:    { name:'PONYTA',    types:['FIRE'],              base:[50,85,55,65,65,90],    exp:152, catchRate:190 },
  GEODUDE:   { name:'GEODUDE',   types:['ROCK','GROUND'],     base:[40,80,100,30,30,20],   exp:73,  catchRate:255 },
  MEOWTH:    { name:'MEOWTH',    types:['NORMAL'],            base:[40,45,35,40,40,90],    exp:69,  catchRate:255 },
};

// ---------- Starting party (post-Elite-Four style FRLG team) ----------
const STARTING_PARTY = [
  { species:'BLASTOISE', level:60, moves:['SURF','ICE BEAM','BITE','SKULL BASH'] },
  { species:'PIDGEOT',   level:57, moves:['AERIAL ACE','QUICK ATTACK','RETURN','SAND-ATTACK'] },
  { species:'ALAKAZAM',  level:54, moves:['PSYCHIC','SHADOW BALL','CALM MIND','RECOVER'] },
  { species:'SNORLAX',   level:56, moves:['BODY SLAM','EARTHQUAKE','REST','ROCK SLIDE'] },
  { species:'RAICHU',    level:53, moves:['THUNDERBOLT','THUNDER WAVE','QUICK ATTACK','BRICK BREAK'] },
  { species:'NIDOKING',  level:55, moves:['EARTHQUAKE','SLUDGE BOMB','MEGAHORN','THUNDERBOLT'] },
];

// ---------- Wild encounters (Kindle Road tall grass) ----------
const WILD_TABLE = [
  { species:'SPEAROW', weight:30, minLv:29, maxLv:34, moves:['PECK','FURY ATTACK','LEER','GROWL'] },
  { species:'PONYTA',  weight:25, minLv:30, maxLv:34, moves:['EMBER','STOMP','TAIL WHIP','QUICK ATTACK'] },
  { species:'MEOWTH',  weight:25, minLv:29, maxLv:33, moves:['SCRATCH','PAY DAY','BITE','SCREECH'] },
  { species:'GEODUDE', weight:20, minLv:29, maxLv:33, moves:['ROCK THROW','TACKLE','MUD-SLAP','DEFENSE CURL'] },
];

// ---------- Items ----------
const ITEMS = {
  'POTION':       { kind:'heal', amt:20,  desc:'Restores 20 HP.' },
  'SUPER POTION': { kind:'heal', amt:50,  desc:'Restores 50 HP.' },
  'HYPER POTION': { kind:'heal', amt:200, desc:'Restores 200 HP.' },
  'POKe BALL':    { kind:'ball', bonus:1,   desc:'Catches wild POKeMON.' },
  'GREAT BALL':   { kind:'ball', bonus:1.5, desc:'A good, high-performance BALL.' },
};

const STARTING_BAG = [
  { item:'HYPER POTION', qty:3 },
  { item:'SUPER POTION', qty:5 },
  { item:'POKe BALL',    qty:10 },
  { item:'GREAT BALL',   qty:5 },
];

// ---------- Pixel sprites (16x16, '.'=transparent) ----------
const SPRITES = {
  BLASTOISE: {
    pal: { b:'#5a8fd6', d:'#3a6cb0', w:'#e8dcc0', r:'#8a6a44', g:'#9aa3ad', G:'#6b7480', k:'#20242c', W:'#ffffff' },
    px: [
      '...gG......Gg...',
      '..ggGg....gGgg..',
      '..gWkg.bb.gkWg..',
      '..ggGgbbbbgGgg..',
      '...GG.bkbk.GG...',
      '..rrbbbbbbbbrr..',
      '.rbbdbbbbbbdbbr.',
      '.rbd.wwwwww.dbr.',
      '.rb.wwwwwwww.br.',
      '.rb.wwwwwwww.br.',
      '..r.wwwwwwww.r..',
      '..bb.wwwwww.bb..',
      '.bbb.rwwwwr.bbb.',
      '.bb...rrrr...bb.',
      '.....bb..bb.....',
      '....bbb..bbb....',
    ],
  },
  PIDGEOT: {
    pal: { t:'#d8b078', d:'#b08850', r:'#d84828', y:'#e8d048', w:'#efe0c0', o:'#e8a030', k:'#20242c' },
    px: [
      '......rry.......',
      '.....rryy.......',
      '....rryyt.......',
      '.....rtttt......',
      '....ttkttt......',
      '....tttttoo.....',
      '...dtttttt......',
      '..ddtwwttt......',
      '.dddtwwwtttt....',
      '.ddttwwwttttt...',
      '..dttwwwttttt...',
      '..ttwwwwtttt....',
      '...twwwttt......',
      '...ryyww........',
      '..rryyoo.o......',
      '.....oo..o......',
    ],
  },
  ALAKAZAM: {
    pal: { y:'#d8b040', d:'#b08828', b:'#8a6a40', w:'#efe8d8', s:'#c8ccd4', k:'#20242c' },
    px: [
      '.s..y....y..s...',
      '.ss.yy..yy.ss...',
      '.s...yyyy...s...',
      '.ss..ykky..ss...',
      '..s..yyyy..s....',
      '..s.wwyyww.s....',
      '..s..wyyw..s....',
      '..ss..yy..ss....',
      '...ybbbbbby.....',
      '..yybbyybbyy....',
      '..y.byyyyb.y....',
      '....byyyyb......',
      '....bybbyb......',
      '....yy..yy......',
      '...yyy..yyy.....',
      '................',
    ],
  },
  SNORLAX: {
    pal: { n:'#2f5d68', d:'#234750', c:'#e8dcc0', k:'#20242c', w:'#efe8d8' },
    px: [
      '....nnnnnnnn....',
      '...nnnnnnnnnn...',
      '..nnnkn..nknnn..',
      '..nnnnnkknnnnn..',
      '...nncccccnn....',
      '..nnnccccccnnn..',
      '.nnncccccccnnnn.',
      '.nnccccccccccnn.',
      '.nnccccccccccnn.',
      '.nnccccccccccnn.',
      '.nnccccccccccnn.',
      '..ncccccccccnn..',
      '..wnccccccccnw..',
      '.wwnncccccnnnww.',
      '..w.nnnnnnnn.w..',
      '.....ww..ww.....',
    ],
  },
  RAICHU: {
    pal: { o:'#e08830', d:'#b06820', w:'#f0e0c0', y:'#f0d020', b:'#6a4a20', k:'#20242c' },
    px: [
      '.bb..........bb.',
      '.obb........bbo.',
      '..obb......bbo..',
      '...ooo....ooo...',
      '....oooooooo....',
      '....okoooko.....',
      '...yoooooooy....',
      '...yooookooy....',
      '....oowwwoo.....',
      '....owwwwwo...b.',
      '...oowwwwwoo..b.',
      '...oowwwwwoo.bb.',
      '....owwwwwo.bb..',
      '....oo.o.oobb...',
      '...oo.....bb....',
      '..oo............',
    ],
  },
  NIDOKING: {
    pal: { p:'#9a68b8', d:'#6a4888', w:'#d8c8e0', g:'#b0b4bc', k:'#20242c', e:'#c8a8d8' },
    px: [
      '..pp...gg...pp..',
      '.peep..gg..peep.',
      '.peep.pppp.peep.',
      '..ppppppppppp...',
      '...ppkppppkpp...',
      '...pppppppppp...',
      '..dpppwwwwppd...',
      '.ddppwwwwwwpdd..',
      '.dpppwwwwwwppd..',
      '.dppwwwwwwwwpd..',
      '..ppwwwwwwwwp.d.',
      '..ppwwwwwwwpp.d.',
      '..pppwwwwwppddd.',
      '...ppp...pppdd..',
      '..pppp...pppp...',
      '..ppp.....ppp...',
    ],
  },
  SPEAROW: {
    pal: { b:'#8a5838', d:'#6a4028', p:'#e0d0a8', r:'#c05848', o:'#e8a898', k:'#20242c', w:'#ffffff' },
    px: [
      '................',
      '.....bbbb.......',
      '....bbbbbb......',
      '....bkbbbb......',
      '...oobbbbb......',
      '..ooobbbbb......',
      '.....pppbbb.....',
      '....ppppprrr....',
      '....pppprrrr....',
      '....ppprrrrr....',
      '.....pprrrr.....',
      '.....ppprr......',
      '......pp........',
      '.....oo.o.......',
      '....oo..o.......',
      '................',
    ],
  },
  PONYTA: {
    pal: { c:'#e8d8c0', d:'#c0a880', f:'#e87828', F:'#f0c030', k:'#20242c', h:'#a08860' },
    px: [
      '.......f........',
      '......fF.f......',
      '...ccfFFfF......',
      '...cccFFF.......',
      '..ckccff........',
      '..ccccc.f.......',
      '...ccccfF.......',
      '...cccccF.f.....',
      '....ccccccfF....',
      '....cccccccF....',
      '...ccccccccf....',
      '...cc...ccc.....',
      '...cc...cc......',
      '...hh...hh......',
      '...hh...hh......',
      '................',
    ],
  },
  GEODUDE: {
    pal: { g:'#a89888', d:'#786858', k:'#20242c', w:'#ffffff' },
    px: [
      '................',
      '................',
      '.....gggggg.....',
      '...gggggggggg...',
      '..gggggggggggg..',
      '.dgg.kk..kk.ggd.',
      'dggg.kw..kw.gggd',
      'dggggggggggggggd',
      'dgggg.gggg.ggggd',
      '.dggg.dddd.gggd.',
      '.gggggggggggggg.',
      'ggdggggggggggdgg',
      'ggg.dggggggd.ggg',
      '.gg..dggggd..gg.',
      '......dddd......',
      '................',
    ],
  },
  MEOWTH: {
    pal: { c:'#e8d8b0', d:'#b09060', b:'#8a6a40', g:'#e8c030', k:'#20242c', w:'#ffffff', p:'#d88888' },
    px: [
      '......gg........',
      '..k...gg...k....',
      '..kc..gg..ck....',
      '..cccccccccc....',
      '..cccccccccc....',
      '.ccckccccckcc...',
      '.cccccppccccc...',
      '..ccbcccccbcc...',
      '...ccccccccc....',
      '....ccccccc.....',
      '...cccccccccc...',
      '...ccdccccdcc.b.',
      '...ccccccccc.bb.',
      '...cccccccccbb..',
      '....cc..cc......',
      '...ccc..ccc.....',
    ],
  },
};

// Player overworld sprites (16x16), keyed by facing; 'left' is mirrored 'right'
const PLAYER_SPRITES = {
  pal: { r:'#d83828', R:'#a82818', s:'#e8b088', k:'#282020', w:'#f0f0f0', b:'#3858a0', d:'#283870', h:'#403028' },
  down: [
    '.....rrrrrr.....',
    '....rrrrrrrr....',
    '...rrRRRRRRrr...',
    '...hhssssssshh..',
    '...hsskssskssh..',
    '....ssssssss....',
    '.....ssssss.....',
    '....wrrwwrrw....',
    '...wwrwwwwrww...',
    '...swwwwwwwws...',
    '...s.wwwwww.s...',
    '.....bbbbbb.....',
    '.....bb..bb.....',
    '.....db..bd.....',
    '.....kk..kk.....',
    '................',
  ],
  up: [
    '.....rrrrrr.....',
    '....rrrrrrrr....',
    '...rrrrrrrrrr...',
    '...rRRRRRRRRr...',
    '...hhhhhhhhhh...',
    '....hhhhhhhh....',
    '.....hhhhhh.....',
    '....wrrwwrrw....',
    '...wwrwwwwrww...',
    '...swwwwwwwws...',
    '...s.wwwwww.s...',
    '.....bbbbbb.....',
    '.....bb..bb.....',
    '.....db..bd.....',
    '.....kk..kk.....',
    '................',
  ],
  right: [
    '.....rrrrrr.....',
    '....rrrrrrrr....',
    '...rrRRRRRRrr...',
    '....hsssssshh...',
    '....ssskssshh...',
    '....ssssssgh....',
    '.....ssssss.....',
    '....wwrrrrw.....',
    '....wwwwwwws....',
    '....wwwwwwws....',
    '.....wwwww......',
    '.....bbbbb......',
    '.....bb.bb......',
    '.....db.bd......',
    '.....kk.kk......',
    '................',
  ],
};

// ---------- Maps ----------
// Overworld legend:
//  G grass  T tall grass  P path  S sand  W water  F flowers  # mountain rock
//  R tree   ! sign        A/a/1 PokeCenter roof/wall/door  B/b/2 house roof/wall/door
//  b wall   4 locked house door
const MAP_ONEISLAND = [
  '############################',
  '#######......#..############',
  '#####..R.....!..R...########',
  '####...RGGGGPPGGGR....######',
  '###..RRRGGGGPPGGGRRR...#####',
  '###..RGGTTTGPPGGGGGR....####',
  '##..RRGGTTTGPPGTTTGRR....###',
  '##..RGGGTTTGPPGTTTGGR.....##',
  '##..RGGGTTTGPPGTTTGGRR....##',
  '##..RGGGGGGGPPGTTTGGGR....##',
  '#...RGGFGGGGPPGGGGGGGR....##',
  '#...RGGGGGGGPPGGGFGGRR....##',
  '#...RRGTTTGGPPGGGGGGR.....##',
  '#....RGTTTGGPPGTTTGGR.....##',
  '#....RGTTTGGPPGTTTGGRR....##',
  '#....RGTTTGGPPGTTTGGGR....##',
  '#....RGGGGGGPPGTTTGGGR....##',
  '#....RRGGFGGPPGGGGGGRR....##',
  '#.....RRGGGGPPGGFGGRR.....##',
  '#......RRGGGPPGGGGRR......##',
  '#.......RGGGPPGGGGR.......##',
  '#.......RGGGPPGGGGR.......##',
  '#......RRGGGPPGGGGRR......##',
  '#......RGGGGPPGGGGGRR.....##',
  '#......RGGGGPPGGGGGGR.....##',
  '######RRGGGGPPGGGGGGRRRR..##',
  '#####RRGGGGGPPGGGGGGGGGRR.##',
  '####RRGAAAAAPPGGBBBBBGGGR.##',
  '####RGGAAAAAPPGGBBBBBGGGR.##',
  '####RGGaaaaaPPGGbbbbbGGGR.##',
  '####RGGaa1aaPPGGbb2bbGGGR.##',
  '####RGG!GPPGPPGGGGPGGGGGR.##',
  '####RGGGGPPPPPPPPPPGGGGGR.##',
  '####RGGGGGGGPPGGGGPPGGGGR.##',
  '####RGFGGGGGPPGGGGGPGGFGR.##',
  '####RGGGBBBBBPGGGGGPGGGGR.##',
  '####RGGGBBBBBPGGFGGPGGGGR.##',
  '####RGGGbbbbbPGGGGGPGGGGR.##',
  '####RGGGbb4bbPGGGGPPGGGGR.##',
  '####RRGGGGGGPPGGGGPGGGRRR.##',
  '#####RGGGGGGPPGGGGPGGGR..###',
  '#####RSSSSSSPPSSSS!SSSR..###',
  '#####SSSSSSSSSSSSSSSSSS..###',
  '#####SSSSSSSSSSSSSSSSSS..###',
  '####WWSSWWSSSSSSWWSSWWW..###',
  '####WWWWWWWWWWWWWWWWWWW..###',
  '############################',
];

// Interior legend: w wall  f floor  c counter  m exit mat  h heal machine
//  p PC/network machine  k bookshelf  t table
const MAP_CENTER = [
  'wwwwwwwww',
  'wkkwhwpkw',
  'wffffffpw',
  'wffcccffw',
  'wfffffffw',
  'wtffffftw',
  'wfffffffw',
  'wwwwmwwww',
];

const MAP_HOUSE = [
  'wwwwwwww',
  'wkkwwtkw',
  'wffffffw',
  'wffffffw',
  'wftffffw',
  'wffffffw',
  'wwwmwwww',
];

const MAPS = {
  oneisland: {
    grid: MAP_ONEISLAND, outdoor: true,
    warps: {
      '9,30':  { map:'center', x:4, y:6, dir:'up' },   // PokeCenter door
      '18,30': { map:'house',  x:3, y:5, dir:'up' },   // house door
    },
    signs: {
      '13,2':  ['MT. EMBER AHEAD', 'The trail is blocked by fallen rocks.'],
      '7,31':  ['POKeMON NETWORK CENTER', 'ONE ISLAND'],
      '18,41': ['TREASURE BEACH', 'Rare treasures wash up on the shore.'],
    },
    npcs: [
      { x:16, y:32, dir:'down', color:'#d06890', name:'WOMAN',
        lines:['Welcome to ONE ISLAND, one of the', 'SEVII ISLANDS!', 'KINDLE ROAD runs north to', 'MT. EMBER. Wild POKeMON lurk in', 'the tall grass along the way.'] },
      { x:8,  y:40, dir:'down', color:'#6890c0', name:'OLD MAN',
        lines:['This is TREASURE BEACH.', 'They say rare items wash ashore...', 'but all I ever find is seaweed.'] },
      { x:14, y:12, dir:'down', color:'#68a860', name:'YOUNGSTER',
        lines:['Your POKeMON look super tough!', 'A BLASTOISE *and* a PIDGEOT?', 'The wild POKeMON here are no', 'match for you!'] },
    ],
  },
  center: {
    grid: MAP_CENTER, outdoor: false,
    warps: { '4,7': { map:'oneisland', x:9, y:31, dir:'down' } },
    signs: {},
    npcs: [
      { x:4, y:2, dir:'down', color:'#e88898', name:'NURSE', action:'heal',
        lines:['Welcome to the POKeMON CENTER!', 'Shall I restore your POKeMON', 'to full health?'] },
      { x:7, y:3, dir:'left', color:'#c05848', name:'CELIO',
        lines:['I\'m CELIO. I run the POKeMON', 'NETWORK CENTER here on ONE ISLAND.', 'One day, my machine will link', 'trainers across the whole world!'] },
    ],
  },
  house: {
    grid: MAP_HOUSE, outdoor: false,
    warps: { '3,6': { map:'oneisland', x:18, y:31, dir:'down' } },
    signs: {},
    npcs: [
      { x:5, y:2, dir:'down', color:'#a878c0', name:'OLD WOMAN', action:'gift',
        lines:['Oh my, a trainer from the mainland!', 'You remind me of my grandson.', 'Please, take these for your travels!'] },
    ],
  },
};

const GIFT_ITEMS = [
  { item:'HYPER POTION', qty:2 },
  { item:'GREAT BALL', qty:3 },
];
