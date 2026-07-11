/* ============================================================
   maps.js — world maps, NPCs, warps, dialogue scripts.
   Maps are built with carve helpers into 2D char grids.
   ============================================================ */
'use strict';

const SOLID_TILES = new Set(['T','M','r','C','W','K','w','B']);
const ENCOUNTER_TILES = new Set(['G','A']);

function grid(w,h,fill){ return Array.from({length:h},()=>Array(w).fill(fill)); }
function rectg(g,x,y,w,h,ch){
  for(let j=y;j<y+h;j++) for(let i=x;i<x+w;i++)
    if(j>=0&&j<g.length&&i>=0&&i<g[0].length) g[j][i]=ch;
}
function scatter(g,ch,onto,seed,frac){
  let s=seed;
  const rnd=()=>{ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; };
  for(let j=0;j<g.length;j++) for(let i=0;i<g[0].length;i++)
    if(g[j][i]===onto && rnd()<frac) g[j][i]=ch;
}

// ---------------- Scripts helper: T = trainer dialogue shortcuts
function trainerScript(id){
  const t = TRAINERS[id];
  return (f)=> f['beat_'+id]
    ? [t.after]
    : [t.intro, {trainer:id}, t.after];
}

// ---------------- MAP DEFINITIONS ----------------
const MAPS = {

town:{
  name:'ONE ISLAND', music:'town', outdoor:true, ground:'.', door:'p', void:'T',
  build(){
    const g = grid(32,26,'.');
    scatter(g,',','.',42,0.10);
    // borders
    rectg(g,0,0,32,2,'T');
    for(let j=0;j<19;j++){ g[j][0]='T'; g[j][31]='T'; }
    // beach & sea & pier
    rectg(g,0,19,32,2,'s');
    rectg(g,0,21,32,5,'w');
    rectg(g,14,20,2,4,'P');
    // main path
    rectg(g,14,0,2,20,'p');
    rectg(g,5,9,22,1,'p');
    rectg(g,5,16,16,1,'p');
    rectg(g,5,9,2,8,'p');
    rectg(g,19,8,3,1,'p');
    rectg(g,19,15,3,1,'p');
    // flowers
    rectg(g,9,12,3,3,'f');
    g[13][10]=',';
    // buildings (footprints + doors)
    rectg(g,5,4,6,5,'B');  g[8][7]='D'; g[8][8]='D';       // Pokémon Center
    rectg(g,19,4,5,4,'B'); g[7][20]='D';                    // house 1 (enterable)
    rectg(g,19,11,5,4,'B');                                 // house 2 (locked)
    return g;
  },
  stamps:[['pokecenter',5,4],['house',19,4],['house',19,11],['boat',16,21]],
  warps:[
    {x:14,y:0,to:'kindle',tx:9,ty:42,dir:1},{x:15,y:0,to:'kindle',tx:10,ty:42,dir:1},
    {x:7,y:8,to:'pc',tx:7,ty:8,dir:1},{x:8,y:8,to:'pc',tx:7,ty:8,dir:1},
    {x:20,y:7,to:'home',tx:5,ty:7,dir:1},
  ],
  npcs:[
    { id:'bill_pier', sprite:'bill', x:15, y:22, dir:0, vis:'!introDone',
      script:()=>[
        "BILL: Land ho! Welcome to ONE ISLAND, the first of the SEVII ISLANDS!",
        "BILL: Salty air, warm sand, and POKéMON you won't find back in KANTO. Not a bad trade for a boat ride, eh?",
        "BILL: My friend CELIO runs the POKéMON CENTER here. He's a machine whiz — we're linking the islands' network to KANTO!",
        "BILL: Go on up the beach! I'll introduce you. The CENTER is the big orange-roofed building. Meet you there!",
        {set:'introDone'},
      ]},
    { id:'girl_flowers', sprite:'girl', x:10, y:15, dir:1, wander:true,
      script:()=>[
        "These flowers only grow where the sea wind blows. Aren't they lovely?",
        "Grandpa says that when MT. EMBER glows at night, the LEGENDARY FIREBIRD is turning in its sleep...",
      ]},
    { id:'boy_plaza', sprite:'boy', x:22, y:10, dir:0, wander:true,
      script:()=>[
        "The SEAGALLOP ferry is the only way between the islands. KANTO feels a whole world away!",
        "I saw your BLASTOISE from the pier! It's HUGE! Can it really shoot water over the whole bay?",
      ]},
    { id:'oldman', sprite:'oldman', x:25, y:16, dir:2,
      script:()=>[
        "Hoho, a trainer with six badges' worth of swagger, I can tell.",
        "KINDLE ROAD runs north along the coast. Careful — the trainers there have been spoiling for a match all week.",
      ]},
    { id:'fisher', sprite:'fisher', x:8, y:19, dir:0,
      script:()=>[
        "The PSYDUCK keep wandering ashore and stealing my bait. Look at them. Not a care in the world.",
        "They say the sea around the SEVII ISLANDS is the bluest in the world. I say it's tied with the sky.",
      ]},
    { id:'sign_plaza', sprite:'sign', x:13, y:10, dir:0,
      script:()=>[ "ONE ISLAND — KNOT ISLAND\nNorth: KINDLE ROAD → MT. EMBER" ]},
    { id:'sign_exit', sprite:'sign', x:13, y:2, dir:0,
      script:()=>[ "KINDLE ROAD ahead.\nWild POKéMON hide in the tall grass!" ]},
    { id:'sign_house2', sprite:'sign', x:24, y:15, dir:0,
      script:()=>[ "ISLAND HARBOR ASSOCIATION\n...Out surveying TREASURE BEACH." ]},
    { id:'door_house2', sprite:null, x:20, y:14, dir:0,
      script:()=>[ "It's locked. Whoever lives here takes lunch very seriously." ]},
  ],
},

pc:{
  name:'POKéMON CENTER', music:'center', outdoor:false, ground:'F', void:'W',
  build(){
    const g = grid(15,10,'F');
    rectg(g,0,0,15,2,'W');
    for(let j=0;j<10;j++){ g[j][0]='W'; g[j][14]='W'; }
    rectg(g,0,9,15,1,'W'); g[9][7]='k';
    rectg(g,3,3,6,1,'K');                    // counter
    rectg(g,11,1,2,2,'B');                   // machine footprint
    g[2][1]='B'; g[7][1]='B';                // plants
    return g;
  },
  stamps:[['machine',11,1],['plant',1,2],['plant',1,7]],
  warps:[ {x:7,y:9,to:'town',tx:7,ty:9,dir:0} ],
  npcs:[
    { id:'nurse', sprite:'nurse', x:5, y:2, dir:0, noBlockFace:true,
      script:()=>[
        "Welcome to the POKéMON CENTER! We restore your tired POKéMON to full health.",
        {q:'Shall I take a look at your POKéMON?', yes:[
          {heal:true},
          "There you go! Your POKéMON are fighting fit!",
          "We hope to see you again... er, I mean — safe travels!",
        ], no:[ "Okay! Come back anytime." ]},
      ]},
    { id:'celio', sprite:'celio', x:12, y:4, dir:0,
      script:(f)=>{
        if(f.deliveredRuby) return [
          "CELIO: The network link is holding steady! BILL is already sending data from KANTO!",
          "CELIO: Oh — one more thing. The islanders swear the FIREBIRD nests on MT. EMBER's summit. If anyone could face it... it's you.",
        ];
        if(f.hasRuby) return [
          "CELIO: Th-that glow...! You found it! The RUBY!",
          "CELIO: May I? ...Incredible. It's warm, like it kept a piece of the volcano inside it.",
          {take:'ruby'},
          "You handed THE RUBY to CELIO.",
          {sfx:'machine'},
          "CELIO: Setting it into the NETWORK MACHINE... aaaand—",
          {ending:true},
        ];
        if(f.metCelio) return [
          "CELIO: The RUBY should be deep inside MT. EMBER, north up KINDLE ROAD.",
          "CELIO: Be careful out there. And if your team gets hurt, the nurse will patch them up!",
        ];
        return [
          "CELIO: So you're the trainer BILL keeps bragging about! I'm CELIO. I keep this CENTER — and one very stubborn machine — running.",
          "CELIO: That's my NETWORK MACHINE. Once it works, we can trade POKéMON between the SEVII ISLANDS and KANTO instantly!",
          "CELIO: But it needs a precise gemstone to focus the signal... a RUBY that's said to rest deep inside MT. EMBER.",
          "CELIO: I can't leave the machine, and BILL is hopeless on a mountain trail. Would you go find the RUBY for us?",
          "CELIO: Take KINDLE ROAD north, along the coast. The mountain is impossible to miss — it's the one smoking.",
          {set:'metCelio'},
          "BILL: I stocked your BAG with supplies from the ferry — check it with the START menu! Good luck!",
        ];
      }},
    { id:'bill_pc', sprite:'bill', x:11, y:4, dir:3, vis:'introDone',
      script:(f)=>{
        if(f.deliveredRuby) return [
          "BILL: You're the talk of two regions now! CELIO hasn't stopped grinning since the machine lit up.",
        ];
        if(f.metCelio) return [
          "BILL: CELIO's a good sort. A bit machine-mad, but good. That RUBY means everything to him.",
          "BILL: Rocket goons were spotted around the island lately... if you meet any, give 'em one for me!",
        ];
        return [ "BILL: There you are! Talk to CELIO — he's the one by the big machine." ];
      }},
  ],
},

home:{
  name:'ISLANDER HOME', music:'center', outdoor:false, ground:'F', void:'W',
  build(){
    const g = grid(12,9,'F');
    rectg(g,0,0,12,2,'W');
    for(let j=0;j<9;j++){ g[j][0]='W'; g[j][11]='W'; }
    rectg(g,0,8,12,1,'W'); g[8][5]='k';
    g[2][1]='B'; g[2][10]='B';
    return g;
  },
  stamps:[['plant',1,2],['plant',10,2]],
  warps:[ {x:5,y:8,to:'town',tx:20,ty:8,dir:0} ],
  npcs:[
    { id:'grandpa', sprite:'oldman', x:4, y:4, dir:0, wander:true,
      script:()=>[
        "When I was your age, I climbed MT. EMBER with nothing but a MAGIKARP and misplaced confidence.",
        "The FIREBIRD looked at me once. ONCE. My eyebrows took three weeks to grow back. Wonderful summer.",
      ]},
    { id:'grandma', sprite:'oldwoman', x:7, y:4, dir:0,
      script:(f)=> f.grannyBalls ? [
        "GRANDMA: Aim true, dear. And if the FIREBIRD sets your hair alight, vinegar rinse. Trust me.",
      ] : [
        "GRANDMA: Off to the mountain, are you? Then take these — my husband certainly can't throw them straight anymore.",
        {give:{item:'ultraball', n:5}},
        "GRANDMA: If you meet the FIREBIRD... well. Better it goes with you than stays angry at us!",
        {set:'grannyBalls'},
      ]},
  ],
},

kindle:{
  name:'KINDLE ROAD', music:'route', outdoor:true, ground:'.', void:'T',
  build(){
    const g = grid(20,44,'.');
    scatter(g,',','.',77,0.10);
    // west sea & beach
    for(let j=0;j<44;j++){ g[j][0]='w'; }
    rectg(g,0,6,2,32,'w');
    for(let j=4;j<42;j++){ g[j][2]==='w'||(g[j][2]='s'); }
    rectg(g,2,6,1,32,'s'); rectg(g,3,4,1,38,'s');
    // east tree wall
    for(let j=0;j<44;j++){ g[j][19]='T'; g[j][18]=(j%7===3)?'T':g[j][18]; }
    rectg(g,17,0,2,44,'T');
    // north rock face (Mt Ember foothills) with gap
    rectg(g,0,0,20,2,'M');
    rectg(g,9,0,2,2,'p');
    // south tree border with gap to town
    rectg(g,0,42,20,2,'T'); rectg(g,0,42,4,2,'s');
    rectg(g,9,42,2,2,'p');
    // main path
    rectg(g,9,0,2,44,'p');
    // grass patches
    rectg(g,5,32,6,4,'G');
    rectg(g,11,24,5,4,'G');
    rectg(g,5,14,5,4,'G');
    rectg(g,11,6,5,3,'G');
    // boulders & trees inside
    g[10][15]='r'; g[29][14]='r'; g[20][5]='r'; g[37][15]='r';
    g[12][6]='T'; g[28][6]='T'; g[21][13]='T';
    return g;
  },
  warps:[
    {x:9,y:43,to:'town',tx:14,ty:1,dir:0},{x:10,y:43,to:'town',tx:15,ty:1,dir:0},
    {x:9,y:0,to:'ember',tx:12,ty:19,dir:1},{x:10,y:0,to:'ember',tx:13,ty:19,dir:1},
  ],
  encounters:{ rate:0.14, list:[
    ['spearow',28,31,25],['meowth',28,31,25],['ponyta',29,32,20],
    ['psyduck',28,30,15],['geodude',28,31,10],['fearow',33,35,5],
  ]},
  npcs:[
    { id:'lass1', sprite:'lass', x:12, y:33, dir:2, script:trainerScript('lass_joana') },
    { id:'camper1', sprite:'camper', x:7, y:25, dir:3, script:trainerScript('camper_ricky') },
    { id:'hiker1', sprite:'hiker', x:12, y:10, dir:2, script:trainerScript('hiker_earl') },
    { id:'sign_kindle', sprite:'sign', x:8, y:38, dir:0,
      script:()=>[ "KINDLE ROAD\nSouth: ONE ISLAND HARBOR\nNorth: MT. EMBER" ]},
    { id:'sign_ember', sprite:'sign', x:8, y:3, dir:0,
      script:()=>[ "MT. EMBER — ACTIVE VOLCANO\nProceed at your own risk." ]},
    { id:'girl_beach', sprite:'girl', x:3, y:22, dir:2,
      script:()=>[
        "I collect sea glass along TREASURE BEACH. The waves polish it like little jewels.",
        "A weird man in black asked me where the 'red gem' was. I told him gems don't just lie around! ...Right?",
      ]},
  ],
},

ember:{
  name:'MT. EMBER', music:'ember', outdoor:true, ground:'m', door:'c', void:'M',
  build(){
    const g = grid(26,22,'m');
    scatter(g,'A','m',91,0.04);
    // outer walls
    rectg(g,0,0,26,1,'M'); rectg(g,0,21,26,1,'M');
    for(let j=0;j<22;j++){ g[j][0]='M'; g[j][25]='M'; }
    // south entrance gap
    rectg(g,12,20,2,2,'m'); rectg(g,12,21,2,1,'M');
    // terraces
    rectg(g,1,14,17,2,'M');  rectg(g,4,14,2,2,'m');   // lower ridge, gap at x4
    rectg(g,8,8,17,2,'M');   rectg(g,18,8,2,2,'m');   // mid ridge, gap at x18
    // cave block (north-east)
    rectg(g,13,1,12,3,'C');
    g[3][17]='D'; g[3][18]='D';
    // moltres plateau (north-west)
    rectg(g,1,1,11,3,'M');
    rectg(g,2,2,8,2,'m'); rectg(g,2,2,8,1,'A');
    rectg(g,1,4,11,1,'M'); rectg(g,4,4,2,1,'m');      // plateau lip, gap at x4
    // paths
    rectg(g,12,16,2,5,'p');
    rectg(g,4,16,10,1,'p');
    rectg(g,4,10,2,6,'p');
    rectg(g,4,10,15,1,'p');
    rectg(g,18,4,2,6,'p');
    rectg(g,4,5,2,6,'p');
    rectg(g,4,5,15,1,'p');
    // ash grass fields
    rectg(g,6,11,5,3,'A');
    rectg(g,14,11,4,3,'A');
    rectg(g,7,17,4,3,'A');
    rectg(g,20,12,4,4,'A');
    // boulders
    g[18][17]='r'; g[6][21]='r'; g[12][3]='r'; g[19][22]='r'; g[6][2]='r';
    return g;
  },
  warps:[
    {x:12,y:20,to:'kindle',tx:9,ty:1,dir:0},{x:13,y:20,to:'kindle',tx:10,ty:1,dir:0},
    {x:17,y:3,to:'chamber',tx:5,ty:9,dir:1},{x:18,y:3,to:'chamber',tx:6,ty:9,dir:1},
  ],
  encounters:{ rate:0.15, list:[
    ['spearow',30,33,20],['machop',32,36,25],['geodude',31,34,25],
    ['ponyta',32,36,20],['fearow',34,37,10],
  ]},
  npcs:[
    { id:'grunt1', sprite:'grunt', x:17, y:4, dir:0,
      posByFlag:{ flag:'beat_grunt_kai', x:15, y:4, dir:3 },
      script:(f)=> f.beat_grunt_kai ? [TRAINERS.grunt_kai.after]
        : [TRAINERS.grunt_kai.intro, {trainer:'grunt_kai'}, TRAINERS.grunt_kai.after,
           {moveNpc:{id:'grunt1', x:15, y:4, dir:3}}] },
    { id:'grunt2', sprite:'grunt', x:18, y:4, dir:0,
      posByFlag:{ flag:'beat_grunt_rico', x:20, y:4, dir:2 },
      script:(f)=> f.beat_grunt_rico ? [TRAINERS.grunt_rico.after]
        : [TRAINERS.grunt_rico.intro, {trainer:'grunt_rico'}, TRAINERS.grunt_rico.after,
           {moveNpc:{id:'grunt2', x:20, y:4, dir:2}}] },
    { id:'moltres', sprite:'moltres', x:5, y:2, dir:0, vis:'!moltresDone', big:true,
      script:()=>[
        {sfx:'cry'},
        "GYAAOOOO!",
        "The air shimmers with heat! The LEGENDARY FIREBIRD spreads its blazing wings!",
        {wild:{sp:'moltres', lvl:50, resolveFlag:'moltresDone'}},
      ]},
    { id:'sign_summit', sprite:'sign', x:6, y:5, dir:0,
      script:()=>[ "SUMMIT PERCH\nDo not disturb... anything." ]},
    { id:'hiker_e', sprite:'hiker', x:13, y:17, dir:2,
      script:(f)=> f.deliveredRuby ? [
        "Even the volcano seems calmer today. Or maybe that's just you.",
      ] : [
        "Feel that warmth under your boots? The mountain is alive, kid.",
        "Two shady characters in black went up toward the cave. They had the look of people about to touch things they shouldn't.",
      ]},
  ],
},

chamber:{
  name:'RUBY CHAMBER', music:'cave', outdoor:false, ground:'c', void:'C',
  build(){
    const g = grid(13,11,'c');
    rectg(g,0,0,13,2,'C');
    for(let j=0;j<11;j++){ g[j][0]='C'; g[j][12]='C'; }
    rectg(g,0,10,13,1,'C'); g[10][5]='c'; g[10][6]='c';
    rectg(g,5,3,2,2,'B');   // pedestal
    g[4][2]='r'; g[3][9]='r'; g[7][10]='r';
    return g;
  },
  stamps:[['pedestal',5,3]],
  warps:[
    {x:5,y:10,to:'ember',tx:17,ty:4,dir:0},{x:6,y:10,to:'ember',tx:18,ty:4,dir:0},
  ],
  npcs:[
    { id:'ruby1', sprite:null, x:5, y:4, dir:0, script:'rubyScript' },
    { id:'ruby2', sprite:null, x:6, y:4, dir:0, script:'rubyScript' },
  ],
},
};

// scripts referenced by name
const SCRIPTS = {
  rubyScript:(f)=> f.hasRuby ? [
    "The pedestal is empty. Only a faint warmth remains.",
  ] : [
    "A deep red gem rests on the pedestal, glowing like a coal that never went out...",
    {q:'Take THE RUBY?', yes:[
      {sfx:'item'},
      {give:{item:'ruby', n:1}},
      {set:'hasRuby'},
      "The RUBY's glow warms your hands. CELIO is going to flip!",
    ], no:[ "You left the RUBY where it lay. It pulses softly, patient as stone." ]},
  ],
};

// Build caches
for(const key in MAPS){
  const m = MAPS[key];
  m.id = key;
  m.grid = m.build();
  m.h = m.grid.length; m.w = m.grid[0].length;
}
