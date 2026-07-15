/* ============================================================
   maps.js — world maps, NPCs, warps, dialogue scripts.
   Maps are built with carve helpers into 2D char grids.
   ============================================================ */
'use strict';

const SOLID_TILES = new Set(['T','M','r','C','W','K','w','B','X','O','R','Z','H']);
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
// generic Kanto Pokémon Center interior + nurse
function kantoPC(){
  const g = grid(15,10,'F');
  rectg(g,0,0,15,2,'W');
  for(let j=0;j<10;j++){ g[j][0]='W'; g[j][14]='W'; }
  rectg(g,0,9,15,1,'W'); g[9][7]='k';
  rectg(g,3,3,6,1,'K');       // healing counter
  rectg(g,11,1,2,2,'B');      // PC machine
  g[2][1]='B'; g[7][1]='B';   // plants
  return g;
}
function kantoNurse(){
  return { id:'nurse', sprite:'nurse', x:5, y:2, dir:0, script:()=>[
    "Welcome to the POKéMON CENTER! We can restore your tired POKéMON to full health.",
    {q:'Shall I heal your POKéMON?', yes:[
      {heal:true},
      "Thank you! Your POKéMON are back to full health!",
      "We hope to see you again. Safe travels!",
    ], no:[ "Okay! Come back any time." ]},
  ]};
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
    { id:'ferry_sailor', sprite:'sailor', x:16, y:21, dir:2,
      script:(f)=> f.metCelio ? [
        "SAILOR: The SEAGALLOP's fueled and ready! I can run you to VERMILION CITY on the KANTO mainland whenever you like.",
        {q:'Set sail for VERMILION CITY?', yes:[
          "SAILOR: Har har! Cast off the lines! KANTO, here we come!",
          {goto:{to:'vermilion', x:11, y:19, dir:1}},
        ], no:[ "SAILOR: Righto. The sea'll keep. Just holler when you're ready." ]},
      ] : [
        "SAILOR: This SEAGALLOP ferry runs clear to the KANTO mainland — VERMILION CITY.",
        "SAILOR: But you look like you've got business on the island first. Go see CELIO. Come back when you're ready to sail!",
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

// ============================================================
//  KANTO MAINLAND (reached by SEAGALLOP ferry from ONE ISLAND)
// ============================================================
vermilion:{
  name:'VERMILION CITY', music:'town', outdoor:true, ground:'.', door:'p', void:'T',
  build(){
    const g = grid(24,22,'.');
    scatter(g,',','.',61,0.08);
    rectg(g,0,0,24,2,'T');
    for(let j=0;j<18;j++){ g[j][0]='T'; g[j][23]='T'; }
    g[0][11]='p'; g[1][11]='p'; g[0][12]='p'; g[1][12]='p';   // north gap → route5
    g[9][0]='p';                                              // west gap → route6 (Saffron)
    rectg(g,1,9,10,1,'p');                                    // west path
    // south sea + pier (ferry)
    rectg(g,0,18,24,4,'w');
    rectg(g,10,17,2,2,'P'); g[16][10]='P'; g[16][11]='P';
    // buildings
    rectg(g,3,4,6,5,'B'); g[8][5]='D'; g[8][6]='D';           // POKéCENTER
    rectg(g,15,4,6,5,'B'); g[8][17]='D'; g[8][18]='D';        // GYM
    rectg(g,3,12,5,4,'B');                                     // house (decor)
    rectg(g,16,12,5,4,'B');                                    // house (decor)
    // paths
    rectg(g,10,2,2,15,'p');
    rectg(g,5,9,13,1,'p'); rectg(g,5,9,1,1,'p');
    rectg(g,17,9,1,1,'p');
    rectg(g,5,9,1,1,'p');
    rectg(g,4,16,16,1,'p');
    rectg(g,6,15,1,1,'p'); rectg(g,17,15,1,1,'p');
    // cuttable-tree nook with a hidden item (west)
    g[13][2]='.'; g[14][1]='X';
    return g;
  },
  stamps:[['pokecenter',3,4],['gym',15,4],['house',3,12],['house',16,12],['boat',10,18]],
  warps:[
    {x:11,y:0,to:'route5',tx:9,ty:32,dir:1},{x:12,y:0,to:'route5',tx:10,ty:32,dir:1},
    {x:0,y:9,to:'route6',tx:20,ty:6,dir:2},
    {x:5,y:8,to:'vermilion_pc',tx:7,ty:8,dir:1},{x:6,y:8,to:'vermilion_pc',tx:7,ty:8,dir:1},
    {x:17,y:8,to:'vermilion_gym',tx:8,ty:14,dir:1},{x:18,y:8,to:'vermilion_gym',tx:9,ty:14,dir:1},
  ],
  npcs:[
    { id:'v_return', sprite:'sailor', x:12, y:18, dir:2,
      script:()=>[
        "SAILOR: Need a lift back to the SEVII ISLANDS? Hop aboard the SEAGALLOP any time.",
        {q:'Sail back to ONE ISLAND?', yes:[
          "SAILOR: Homeward bound! Hold onto your hat!",
          {goto:{to:'town', x:15, y:20, dir:1}},
        ], no:[ "SAILOR: Suit yourself. KANTO's got plenty to see." ]},
      ]},
    { id:'v_cut', sprite:'sailor', x:15, y:16, dir:1,
      script:(f)=> f.hm_cut ? [
        "SAILOR: That HM CUT belonged to the S.S. ANNE's captain. Use it on skinny little trees!",
      ] : [
        "SAILOR: You helped me haul in the SEAGALLOP's lines back there — you didn't have to do that.",
        "SAILOR: Here, the captain wanted a sharp kid to have this. It's an HM — teaches CUT.",
        {hm:'cut'},
        "SAILOR: Face a small tree and press A. Handy for clearing shortcuts! There's one just west of here.",
      ]},
    { id:'v_guide', sprite:'gymguide', x:16, y:9, dir:0,
      script:(f)=> f.beat_surge ? [
        "I'm the GYM's biggest fan! You beat LT. SURGE?! You're the real deal, kid!",
      ] : [
        "Yo! I'm the VERMILION GYM's biggest fan! LT. SURGE uses ELECTRIC POKéMON.",
        "Psst — GROUND POKéMON don't feel electricity at all. Your NIDOKING would love this fight.",
      ]},
    { id:'v_boy', sprite:'youngster', x:7, y:11, dir:0, wander:true,
      script:()=>[
        "Whoa, you came in on the SEAGALLOP? From the SEVII ISLANDS? That's so far!",
        "If you ever learn SURF, the whole sea opens up. You could go almost anywhere!",
      ]},
    { id:'v_sign', sprite:'sign', x:9, y:9, dir:0,
      script:()=>[ "VERMILION CITY\n\"The Port of Exquisite Sunsets\"\nNorth: ROUTE 5 → CERULEAN CITY" ]},
    { id:'v_signgym', sprite:'sign', x:19, y:9, dir:0,
      script:()=>[ "VERMILION GYM\nLEADER: LT. SURGE\n\"The Lightning American!\"" ]},
    { id:'v_item', sprite:null, x:1, y:13, dir:0, vis:'!got_v_item',
      script:()=>[ "You found a HYPER POTION tucked behind the tree!", {give:{item:'hyperpotion',n:1}}, {set:'got_v_item'} ]},
  ],
},

vermilion_pc:{
  name:'POKéMON CENTER', music:'center', outdoor:false, ground:'F', void:'W',
  build(){ return kantoPC(); },
  stamps:[['machine',11,1],['plant',1,2],['plant',1,7]],
  warps:[ {x:7,y:9,to:'vermilion',tx:5,ty:9,dir:0} ],
  npcs:[ kantoNurse(), { id:'vpc_t', sprite:'boy', x:11, y:5, dir:2,
    script:()=>[ "This PC network links every CENTER in KANTO and the SEVII ISLANDS. CELIO's machine did that!" ]} ],
},

vermilion_gym:{
  name:'VERMILION GYM', music:'route', outdoor:false, ground:'F', void:'Z',
  build(){
    const g = grid(18,16,'F');
    rectg(g,0,0,18,2,'Z'); for(let j=0;j<16;j++){ g[j][0]='Z'; g[j][17]='Z'; }
    rectg(g,0,15,18,1,'Z'); g[15][8]='k'; g[15][9]='k';
    // decorative electric-cable pillars
    g[4][4]='O'; g[4][13]='O'; g[9][4]='O'; g[9][13]='O';
    return g;
  },
  warps:[ {x:8,y:15,to:'vermilion',tx:17,ty:9,dir:0},{x:9,y:15,to:'vermilion',tx:18,ty:9,dir:0} ],
  npcs:[
    { id:'gym_s1', sprite:'sailor', x:9, y:10, dir:1, script:trainerScript('gym_sailor') },
    { id:'surge', sprite:'surge', x:9, y:4, dir:0,
      script:(f)=> f.beat_surge ? [
        "LT. SURGE: Ten-hut! You\'re a soldier now, kid. Go show CERULEAN what VERMILION\'s made of!",
      ] : [ TRAINERS.surge.intro, {trainer:'surge'}, TRAINERS.surge.after ] },
    { id:'gyms_sign', sprite:'sign', x:6, y:12, dir:0,
      script:()=>[ "VERMILION GYM — a fortress of raw voltage. Mind the live cables." ]},
  ],
},

route5:{
  name:'ROUTE 5', music:'route', outdoor:true, ground:'.', void:'T',
  build(){
    const g = grid(20,34,'.');
    scatter(g,',','.',71,0.09);
    for(let j=0;j<34;j++){ g[j][0]='T'; g[j][19]='T'; }
    rectg(g,0,0,20,2,'T'); rectg(g,0,32,20,2,'T');
    g[0][9]='p'; g[1][9]='p'; g[0][10]='p'; g[1][10]='p';    // north → cerulean
    g[32][9]='p'; g[33][9]='p'; g[32][10]='p'; g[33][10]='p';// south → vermilion
    rectg(g,9,0,2,34,'p');                                    // main path
    // CUT gate: a thin tree wall across the path midway, with a cuttable gap
    rectg(g,1,16,18,1,'T'); g[16][9]='X'; g[16][10]='T';
    // grass patches
    rectg(g,3,24,5,4,'G'); rectg(g,12,20,5,4,'G'); rectg(g,3,6,5,4,'G'); rectg(g,12,7,5,3,'G');
    // pond (surf-optional item island)
    rectg(g,13,26,6,5,'w'); g[28][16]='.'; // item island tile in the pond
    g[28][16]='B';           // pedestal-less; place item npc
    return g;
  },
  warps:[
    {x:9,y:0,to:'cerulean',tx:11,ty:30,dir:1},{x:10,y:0,to:'cerulean',tx:12,ty:30,dir:1},
    {x:9,y:33,to:'vermilion',tx:11,ty:1,dir:0},{x:10,y:33,to:'vermilion',tx:12,ty:1,dir:0},
  ],
  encounters:{ rate:0.16, list:[
    ['pidgey',12,15,25],['rattata',12,15,25],['oddish',13,16,15],
    ['bellsprout',13,16,15],['spearow',13,16,12],['meowth',13,15,6],['pikachu',14,16,2],
  ]},
  waterEncounters:{ rate:0.2, list:[ ['poliwag',10,15,45],['goldeen',10,14,30],['magikarp',5,15,25] ]},
  npcs:[
    { id:'r5_lass', sprite:'lass', x:7, y:23, dir:3, script:trainerScript('lass_kanto') },
    { id:'r5_young', sprite:'youngster', x:12, y:11, dir:2, script:trainerScript('youngster_joey') },
    { id:'r5_gate', sprite:'sign', x:8, y:15, dir:0,
      script:(f)=> f.hm_cut ? [ "A row of slender trees. One looks freshly CUT — the way north is open!" ]
        : [ "A row of slender trees blocks the path. If only you had a way to CUT through..." ]},
    { id:'r5_item', sprite:null, x:16, y:28, dir:0, vis:'!got_r5_item',
      script:(f)=> f.surfing ? [ "Bobbing in the pond is an ULTRA BALL!", {give:{item:'ultraball',n:1}}, {set:'got_r5_item'} ]
        : [ "There's an item on a tiny island in the pond, just out of reach. You'd need to SURF." ]},
    { id:'r5_sign', sprite:'sign', x:8, y:30, dir:0,
      script:()=>[ "ROUTE 5\nSouth: VERMILION CITY\nNorth: CERULEAN CITY" ]},
  ],
},

cerulean:{
  name:'CERULEAN CITY', music:'town', outdoor:true, ground:'.', door:'p', void:'T',
  build(){
    const g = grid(24,32,'.');
    scatter(g,',','.',81,0.08);
    rectg(g,0,0,24,2,'T');
    for(let j=0;j<32;j++){ g[j][0]='T'; g[j][23]='T'; }
    g[30][11]='p'; g[31][11]='p'; g[30][12]='p'; g[31][12]='p';   // south → route5
    g[0][11]='p'; g[1][11]='p'; g[0][12]='p'; g[1][12]='p';       // north → route24 (Nugget Bridge)
    g[26][0]='p';                                                  // west → route4
    // river across the city (surf-optional), with a land bridge
    rectg(g,0,20,24,3,'w'); rectg(g,10,20,3,3,'p');               // bridge crossing
    // buildings
    rectg(g,3,5,6,5,'B'); g[9][5]='D'; g[9][6]='D';               // POKéCENTER
    rectg(g,15,5,6,5,'B'); g[9][17]='D'; g[9][18]='D';            // GYM (Misty)
    rectg(g,15,13,5,4,'B');                                        // house (decor)
    rectg(g,4,13,5,4,'B');                                         // house (decor)
    // paths
    rectg(g,11,2,2,28,'p');
    rectg(g,5,10,13,1,'p'); rectg(g,4,17,16,1,'p');
    rectg(g,1,26,11,1,'p');                                        // west path to route4
    // strength boulder blocking optional item east
    g[25][20]='O'; g[25][21]='B';
    return g;
  },
  stamps:[['pokecenter',3,5],['gym',15,5],['house',4,13],['house',15,13]],
  warps:[
    {x:11,y:31,to:'route5',tx:9,ty:1,dir:1},{x:12,y:31,to:'route5',tx:10,ty:1,dir:1},
    {x:11,y:0,to:'route24',tx:9,ty:22,dir:1},{x:12,y:0,to:'route24',tx:10,ty:22,dir:1},
    {x:0,y:26,to:'route4',tx:18,ty:6,dir:2},
    {x:5,y:9,to:'cerulean_pc',tx:7,ty:8,dir:1},{x:6,y:9,to:'cerulean_pc',tx:7,ty:8,dir:1},
    {x:17,y:9,to:'cerulean_gym',tx:8,ty:14,dir:1},{x:18,y:9,to:'cerulean_gym',tx:9,ty:14,dir:1},
  ],
  encounters:null,
  npcs:[
    { id:'c_guide', sprite:'gymguide', x:16, y:10, dir:0,
      script:(f)=> f.beat_misty ? [ "You beat MISTY?! The CASCADE BADGE looks good on you, champ." ]
        : [ "Welcome to CERULEAN GYM! LEADER MISTY is a WATER-type master.",
            "GRASS and ELECTRIC POKéMON have the edge on water. Your GENGAR and JOLTEON could shine!" ]},
    { id:'c_hiker', sprite:'hiker', x:14, y:19, dir:2,
      script:(f)=> f.hm_strength ? [ "STRENGTH lets you shove boulders around. Try that one to the east!" ]
        : [ "You look plenty tough. Here — a hiker's gotta pass the torch sometime.",
            "This HM teaches STRENGTH. Activate it, then just walk into a boulder to push it.",
            {hm:'strength'} ]},
    { id:'c_item', sprite:null, x:21, y:25, dir:0, vis:'!got_c_item', script:()=>[
      "Behind the boulder sits a REVIVE!", {give:{item:'revive',n:1}}, {set:'got_c_item'} ]},
    { id:'c_girl', sprite:'girl', x:9, y:24, dir:0, wander:true,
      script:()=>[
        "The NUGGET BRIDGE up north is famous! Beat every trainer on it in a row and you win a prize.",
        "...though I heard someone shady set up shop at the far end. Be careful!",
      ]},
    { id:'c_sign', sprite:'sign', x:10, y:11, dir:0,
      script:()=>[ "CERULEAN CITY\n\"A Mysterious, Blue Aura Surrounds It\"\nNorth: NUGGET BRIDGE" ]},
    { id:'c_signgym', sprite:'sign', x:19, y:10, dir:0,
      script:()=>[ "CERULEAN GYM\nLEADER: MISTY\n\"The Tomboyish Mermaid!\"" ]},
  ],
},

cerulean_pc:{
  name:'POKéMON CENTER', music:'center', outdoor:false, ground:'F', void:'W',
  build(){ return kantoPC(); },
  stamps:[['machine',11,1],['plant',1,2],['plant',1,7]],
  warps:[ {x:7,y:9,to:'cerulean',tx:5,ty:10,dir:0} ],
  npcs:[ kantoNurse(), { id:'cpc_t', sprite:'girl', x:3, y:5, dir:3,
    script:()=>[ "A traveller from the SEVII ISLANDS? You came a long way. Rest up!" ]} ],
},

cerulean_gym:{
  name:'CERULEAN GYM', music:'route', outdoor:false, ground:'F', void:'Z',
  build(){
    const g = grid(18,16,'F');
    rectg(g,0,0,18,2,'Z'); for(let j=0;j<16;j++){ g[j][0]='Z'; g[j][17]='Z'; }
    rectg(g,0,15,18,1,'Z'); g[15][8]='k'; g[15][9]='k';
    // pools of water flanking a central walkway
    rectg(g,2,4,5,8,'w'); rectg(g,11,4,5,8,'w');
    rectg(g,8,2,2,13,'F');                 // central walkway
    rectg(g,7,7,4,1,'F');                  // crossing to the trainer
    return g;
  },
  warps:[ {x:8,y:15,to:'cerulean',tx:17,ty:10,dir:0},{x:9,y:15,to:'cerulean',tx:18,ty:10,dir:0} ],
  npcs:[
    { id:'gym_c1', sprite:'swimmer', x:9, y:9, dir:1, script:trainerScript('gym_swimmer') },
    { id:'misty', sprite:'misty', x:9, y:4, dir:0,
      script:(f)=> f.beat_misty ? [
        "MISTY: You\'re really something. If you\'re ever near an ocean, come SURF with me sometime!",
      ] : [ TRAINERS.misty.intro, {trainer:'misty'}, TRAINERS.misty.after ] },
    { id:'gymc_sign', sprite:'sign', x:6, y:13, dir:0,
      script:()=>[ "CERULEAN GYM — mind the pools. MISTY waits across the water." ]},
  ],
},

route24:{
  name:'ROUTE 24', music:'route', outdoor:true, ground:'.', void:'T',
  build(){
    const g = grid(20,26,'.');
    scatter(g,',','.',91,0.08);
    for(let j=0;j<26;j++){ g[j][0]='T'; g[j][19]='T'; }
    rectg(g,0,24,20,2,'T'); g[24][9]='p'; g[25][9]='p'; g[24][10]='p'; g[25][10]='p'; // south → cerulean
    g[0][9]='p'; g[1][9]='p'; g[0][10]='p'; g[1][10]='p';    // north → route25
    // Nugget Bridge: a plank bridge over water, single-file
    rectg(g,0,6,20,14,'w');
    rectg(g,9,2,2,22,'P');                                   // the bridge itself
    // grass at the two ends
    rectg(g,3,21,5,2,'G'); rectg(g,12,21,5,2,'G');
    return g;
  },
  warps:[
    {x:9,y:25,to:'cerulean',tx:11,ty:1,dir:1},{x:10,y:25,to:'cerulean',tx:12,ty:1,dir:1},
    {x:9,y:0,to:'route25',tx:3,ty:18,dir:1},{x:10,y:0,to:'route25',tx:4,ty:18,dir:1},
  ],
  encounters:{ rate:0.10, list:[ ['pidgey',12,14,40],['oddish',12,14,30],['bellsprout',12,14,30] ]},
  npcs:[
    { id:'nb1', sprite:'youngster', x:10, y:20, dir:2, script:trainerScript('youngster_joey') },
    { id:'nb2', sprite:'lass', x:9, y:16, dir:3, script:trainerScript('lass_kanto') },
    { id:'nb3', sprite:'camper', x:10, y:12, dir:2, script:trainerScript('camper_liam') },
    { id:'nb4', sprite:'bugcatcher', x:9, y:8, dir:3, script:trainerScript('bugcatcher_theo') },
    { id:'nb_rocket', sprite:'grunt', x:10, y:4, dir:0,
      posByFlag:{ flag:'beat_rocket_nugget', x:13, y:4, dir:2 },
      script:(f)=> f.beat_rocket_nugget ? [
        "The NUGGET is yours, fair and square. TEAM ROCKET's hideout is in CERULEAN, if you're feeling brave...",
      ] : [ TRAINERS.rocket_nugget.intro, {trainer:'rocket_nugget'}, TRAINERS.rocket_nugget.after,
            "You crossed the NUGGET BRIDGE! For your grit, take this reward!",
            {give:{item:'ultraball',n:3}},
            {moveNpc:{id:'nb_rocket', x:13, y:4, dir:2}} ]},
    { id:'r24_sign', sprite:'sign', x:12, y:22, dir:0,
      script:()=>[ "NUGGET BRIDGE\nCross it and best every trainer for a prize!" ]},
  ],
},

route25:{
  name:'ROUTE 25', music:'route', outdoor:true, ground:'.', void:'T',
  build(){
    const g = grid(22,20,'.');
    scatter(g,',','.',101,0.08);
    rectg(g,0,0,22,2,'T'); rectg(g,0,18,22,2,'T');
    for(let j=0;j<20;j++){ g[j][0]='T'; g[j][21]='T'; }
    g[17][2]='p'; g[18][2]='p'; g[19][2]='p';                 // south-west entry from route24
    // path along the ridge to Bill's cottage (NE)
    rectg(g,2,17,16,1,'p'); rectg(g,17,3,1,15,'p'); rectg(g,15,3,4,1,'p');
    // Bill's cottage (NE) — enterable
    rectg(g,16,2,5,4,'B'); g[5][18]='D';
    // sea to the south (surf → kanto_sea)
    rectg(g,0,18,22,2,'w');  // handled by border below actually; put a cove
    rectg(g,2,14,7,4,'w'); g[17][2]='p';                       // cove; keep entry path
    // grass
    rectg(g,4,4,5,4,'G'); rectg(g,10,8,5,3,'G');
    // strength boulder blocking a shortcut with an item
    g[10][6]='O'; g[10][7]='B';
    return g;
  },
  stamps:[['cottage',16,2]],
  warps:[
    {x:2,y:19,to:'route24',tx:9,ty:1,dir:1},{x:3,y:19,to:'route24',tx:9,ty:1,dir:1},{x:4,y:19,to:'route24',tx:10,ty:1,dir:1},
    {x:18,y:5,to:'bill_cottage',tx:5,ty:8,dir:1},
  ],
  encounters:{ rate:0.14, list:[ ['pidgey',13,16,30],['oddish',13,16,25],['bellsprout',13,16,25],['spearow',13,16,15],['pikachu',15,17,5] ]},
  waterEncounters:{ rate:0.22, list:[ ['tentacool',12,17,50],['poliwag',12,16,25],['magikarp',5,15,25] ]},
  npcs:[
    { id:'r25_sailor', sprite:'sailor', x:8, y:16, dir:1, script:trainerScript('sailor_marco') },
    { id:'r25_item', sprite:null, x:7, y:10, dir:0, vis:'!got_r25_item', script:()=>[
      "Wedged behind the boulder is a FULL HEAL!", {give:{item:'fullheal',n:1}}, {set:'got_r25_item'} ]},
    { id:'r25_swimmer', sprite:'swimmer', x:5, y:16, dir:0, vis:'hm_surf', script:trainerScript('swimmer_dana') },
    { id:'r25_sign', sprite:'sign', x:14, y:4, dir:0,
      script:()=>[ "BILL'S SEASIDE COTTAGE\njust ahead.\nThe SEA POKéMON researcher lives here." ]},
  ],
},

bill_cottage:{
  name:"BILL'S COTTAGE", music:'center', outdoor:false, ground:'F', void:'W',
  build(){
    const g = grid(12,10,'F');
    rectg(g,0,0,12,2,'W'); for(let j=0;j<10;j++){ g[j][0]='W'; g[j][11]='W'; }
    rectg(g,0,9,12,1,'W'); g[9][5]='k';
    rectg(g,8,1,3,2,'B'); g[2][1]='B'; g[6][10]='B';   // computer + shelves
    return g;
  },
  stamps:[['machine',8,1],['plant',1,2],['pedestal',9,6]],
  warps:[ {x:5,y:9,to:'route25',tx:18,ty:6,dir:0} ],
  npcs:[
    { id:'bill_home', sprite:'bill', x:6, y:4, dir:0,
      script:(f)=> f.hm_surf ? [
        "BILL: How's SURF treating you? The whole KANTO coastline is yours now. Go find something amazing!",
        "BILL: And hey — tell CELIO his network's running perfect. Not a dropped packet all week!",
      ] : [
        "BILL: Well if it isn't my favourite SEVII trainer! Fancy seeing you all the way out on ROUTE 25!",
        "BILL: This is my seaside lab. I study SEA POKéMON when I'm not fiddling with the island network.",
        "BILL: You crossed the NUGGET BRIDGE to get here — that takes guts. Let me give you something special.",
        "BILL: It's the HM for SURF. Ride WATER POKéMON right across the sea!",
        {hm:'surf'},
        "BILL: Face any deep water and press A. That BLASTOISE of yours was born for this. Go on — the ocean's calling!",
      ]},
    { id:'bill_sign', sprite:'sign', x:9, y:7, dir:0,
      script:()=>[ "BILL'S sea-monitoring rig. Blinking away happily, linked clear to the SEVII ISLANDS." ]},
  ],
},

kanto_sea:{
  name:'CERULEAN BAY', music:'route', outdoor:true, ground:'m', void:'w',
  build(){
    const g = grid(20,18,'w');
    // a couple of small rock islets (solid) and one landing with an item
    rectg(g,2,2,3,2,'M'); rectg(g,15,3,3,2,'M');
    rectg(g,8,7,4,3,'m'); g[8][9]='B'; g[8][10]='B';   // sandy islet with item
    rectg(g,3,13,3,2,'M');
    // entry corridor from route25 (south edge stays water)
    return g;
  },
  warps:[
    {x:0,y:16,to:'route25',tx:3,ty:15,dir:2},{x:1,y:16,to:'route25',tx:3,ty:15,dir:2},
  ],
  waterEncounters:{ rate:0.24, list:[
    ['tentacool',14,18,40],['staryu',14,17,20],['goldeen',13,17,20],['poliwag',13,17,12],['magikarp',5,20,8] ]},
  npcs:[
    { id:'sea_item', sprite:null, x:9, y:8, dir:0, vis:'!got_sea_item', script:()=>[
      "On the sandbar glints a rare stone... you pocket an ULTRA BALL and a HYPER POTION!",
      {give:{item:'ultraball',n:2}},{give:{item:'hyperpotion',n:2}},{set:'got_sea_item'} ]},
    { id:'sea_swim', sprite:'swimmer', x:12, y:12, dir:2, script:trainerScript('swimmer_dana') },
    { id:'sea_sign', sprite:null, x:5, y:14, dir:0, script:()=>[
      "Open water in every direction. Somewhere out past the horizon lie more of the SEVII ISLANDS..." ]},
  ],
},

// ============================================================
//  WESTERN KANTO (Fly destinations — where it all began)
// ============================================================
pallet:{
  name:'PALLET TOWN', music:'town', outdoor:true, ground:'.', door:'p', void:'T',
  build(){
    const g = grid(20,18,'.');
    scatter(g,',','.',131,0.08);
    rectg(g,0,0,20,2,'T');
    for(let j=0;j<13;j++){ g[j][0]='T'; g[j][19]='T'; }
    g[0][9]='p'; g[1][9]='p'; g[0][10]='p'; g[1][10]='p';   // north → route1
    // beach + sea to the south
    rectg(g,0,13,20,1,'s'); rectg(g,0,14,20,4,'w');
    // Oak's Lab (south-centre) — enterable
    rectg(g,7,8,6,4,'B'); g[11][9]='D'; g[11][10]='D';
    // player's & rival's houses (decor)
    rectg(g,2,4,4,4,'B'); rectg(g,14,4,4,4,'B');
    // paths & fences
    rectg(g,9,2,2,11,'p'); rectg(g,3,7,7,1,'p'); rectg(g,10,7,7,1,'p');
    rectg(g,4,10,2,2,'f'); rectg(g,14,10,2,2,'f');
    return g;
  },
  stamps:[['lab',7,8],['house',2,4],['house',14,4]],
  warps:[
    {x:9,y:0,to:'route1',tx:6,ty:22,dir:1},{x:10,y:0,to:'route1',tx:7,ty:22,dir:1},
    {x:9,y:11,to:'oak_lab',tx:6,ty:9,dir:1},{x:10,y:11,to:'oak_lab',tx:7,ty:9,dir:1},
  ],
  npcs:[
    { id:'p_sign', sprite:'sign', x:11, y:8, dir:0,
      script:()=>[ "PALLET TOWN\n\"Shades of your journey await!\"\nNorth: ROUTE 1 → VIRIDIAN CITY" ]},
    { id:'p_labsign', sprite:'sign', x:6, y:12, dir:0,
      script:()=>[ "OAK POKéMON RESEARCH LAB" ]},
    { id:'p_girl', sprite:'girl', x:14, y:9, dir:0, wander:true,
      script:()=>[
        "Technology is incredible! Even here in tiny PALLET TOWN, PROF. OAK links up with the whole world.",
        "You came from the SEVII ISLANDS? All the way here? You must love adventures as much as I do!",
      ]},
    { id:'p_fisher', sprite:'fisher', x:4, y:13, dir:0,
      script:()=>[ "This beach is where I first cast a line as a boy. SURF out and the sea just keeps going." ]},
  ],
},

oak_lab:{
  name:'OAK POKéMON LAB', music:'center', outdoor:false, ground:'F', void:'W',
  build(){
    const g = grid(14,11,'F');
    rectg(g,0,0,14,2,'W'); for(let j=0;j<11;j++){ g[j][0]='W'; g[j][13]='W'; }
    rectg(g,0,10,14,1,'W'); g[10][6]='k'; g[10][7]='k';
    rectg(g,1,1,4,1,'B'); rectg(g,9,1,4,1,'B');   // bookshelves
    rectg(g,6,4,3,1,'B');                          // starter table
    g[8][1]='B'; g[8][12]='B';                     // plants
    return g;
  },
  stamps:[['machine',9,1],['pedestal',6,4],['plant',1,8],['plant',12,8]],
  warps:[ {x:6,y:10,to:'pallet',tx:9,ty:10,dir:0},{x:7,y:10,to:'pallet',tx:10,ty:10,dir:0} ],
  npcs:[
    { id:'oak', sprite:'oak', x:7, y:3, dir:0,
      script:()=>[
        "PROF. OAK: Ah — a trainer with SIX seasoned POKéMON and salt still in your hair. The SEVII ferry, was it?",
        "PROF. OAK: This is my lab. Right here, three young trainers each choose their very first partner. It never stops being magical.",
        {q:'PROF. OAK: You look road-weary. Shall I have my aides tend to your POKéMON?', yes:[
          {heal:true},
          "PROF. OAK: Good as new! Off you go — the whole region\'s yours to wander.",
        ], no:[ "PROF. OAK: Ha! Tough as old boots, the lot of you. I like that." ]},
      ]},
    { id:'oak_ball1', sprite:null, x:6, y:4, dir:0,
      script:()=>[ "A POKé BALL rests in the rack. A label reads: BULBASAUR. Someone\'s first friend, one day soon." ]},
    { id:'oak_ball2', sprite:null, x:7, y:4, dir:0,
      script:()=>[ "A POKé BALL rests in the rack. A label reads: CHARMANDER. It\'s warm to the touch." ]},
    { id:'oak_ball3', sprite:null, x:8, y:4, dir:0,
      script:()=>[ "A POKé BALL rests in the rack. A label reads: SQUIRTLE. ...Your BLASTOISE started just like this." ]},
    { id:'oak_aide', sprite:'boy', x:11, y:5, dir:2,
      script:()=>[ "I'm one of PROF. OAK's aides. The POKéDEX, the trade network, the SEVII link-up — it all runs through here!" ]},
  ],
},

route1:{
  name:'ROUTE 1', music:'route', outdoor:true, ground:'.', void:'T',
  build(){
    const g = grid(14,24,'.');
    scatter(g,',','.',141,0.09);
    for(let j=0;j<24;j++){ g[j][0]='T'; g[j][13]='T'; }
    rectg(g,0,0,14,2,'T'); rectg(g,0,22,14,2,'T');
    g[0][6]='p'; g[1][6]='p'; g[0][7]='p'; g[1][7]='p';       // north → viridian
    g[22][6]='p'; g[23][6]='p'; g[22][7]='p'; g[23][7]='p';   // south → pallet
    rectg(g,6,0,2,24,'p');
    rectg(g,2,5,4,3,'G'); rectg(g,8,14,4,3,'G');
    rectg(g,1,11,5,1,'L'); rectg(g,8,18,5,1,'L');             // ledges (decor)
    g[9][3]='X';                                               // an optional CUT tree
    return g;
  },
  warps:[
    {x:6,y:0,to:'viridian',tx:10,ty:17,dir:1},{x:7,y:0,to:'viridian',tx:11,ty:17,dir:1},
    {x:6,y:23,to:'pallet',tx:9,ty:1,dir:0},{x:7,y:23,to:'pallet',tx:10,ty:1,dir:0},
  ],
  encounters:{ rate:0.15, list:[ ['pidgey',3,6,45],['rattata',3,6,45],['spearow',4,6,10] ]},
  npcs:[
    { id:'r1_young', sprite:'youngster', x:8, y:9, dir:2, script:trainerScript('youngster_joey') },
    { id:'r1_sign', sprite:'sign', x:5, y:20, dir:0,
      script:()=>[ "ROUTE 1\nPALLET TOWN — VIRIDIAN CITY" ]},
  ],
},

viridian:{
  name:'VIRIDIAN CITY', music:'town', outdoor:true, ground:'.', door:'p', void:'T',
  build(){
    const g = grid(22,20,'.');
    scatter(g,',','.',151,0.08);
    rectg(g,0,0,22,2,'T'); rectg(g,0,18,22,2,'T');
    for(let j=0;j<20;j++){ g[j][0]='T'; g[j][21]='T'; }
    g[18][10]='p'; g[19][10]='p'; g[18][11]='p'; g[19][11]='p';   // south → route1
    g[0][10]='p'; g[1][10]='p'; g[0][11]='p'; g[1][11]='p';       // north → route2
    // buildings
    rectg(g,3,4,6,5,'B'); g[8][5]='D'; g[8][6]='D';               // POKéCENTER
    rectg(g,14,4,6,5,'B');                                         // GYM (locked — decor)
    rectg(g,3,12,5,3,'B'); rectg(g,14,12,5,3,'B');                // houses (decor)
    // pond (surf-optional) NE
    rectg(g,16,10,5,3,'w');
    // paths
    rectg(g,10,0,2,18,'p'); rectg(g,5,9,13,1,'p'); rectg(g,4,15,15,1,'p');
    return g;
  },
  stamps:[['pokecenter',3,4],['gym',14,4],['house',3,12],['house',14,12]],
  warps:[
    {x:10,y:19,to:'route1',tx:6,ty:1,dir:1},{x:11,y:19,to:'route1',tx:7,ty:1,dir:1},
    {x:10,y:0,to:'route2',tx:8,ty:26,dir:1},{x:11,y:0,to:'route2',tx:9,ty:26,dir:1},
    {x:5,y:8,to:'viridian_pc',tx:7,ty:8,dir:1},{x:6,y:8,to:'viridian_pc',tx:7,ty:8,dir:1},
  ],
  npcs:[
    { id:'v2_guard', sprite:'guard', x:16, y:9, dir:0,
      script:()=>[
        "GYM GUIDE: The VIRIDIAN GYM is shut tight — nobody's seen the LEADER in ages.",
        "GYM GUIDE: They say whoever runs it is the strongest in all KANTO. A mystery for another day, eh?",
      ]},
    { id:'v2_old', sprite:'oldman', x:8, y:16, dir:0, wander:true,
      script:()=>[
        "VIRIDIAN CITY — 'The Eternally Green Paradise.' Prettiest town in KANTO, if you ask me.",
        "Head north through ROUTE 2 and VIRIDIAN FOREST to reach PEWTER CITY. Mind the BUG POKéMON in the trees!",
      ]},
    { id:'v2_sign', sprite:'sign', x:9, y:9, dir:0,
      script:()=>[ "VIRIDIAN CITY\n\"The Eternally Green Paradise\"\nSouth: ROUTE 1 → PALLET TOWN" ]},
    { id:'v2_signgym', sprite:'sign', x:20, y:9, dir:0,
      script:()=>[ "VIRIDIAN GYM\nLEADER: ???\n\"...Currently closed.\"" ]},
    { id:'v2_north', sprite:'sign', x:13, y:3, dir:0,
      script:()=>[ "North: ROUTE 2\n→ VIRIDIAN FOREST → PEWTER CITY\n(and onward, all the way to CERULEAN!)" ]},
  ],
},

viridian_pc:{
  name:'POKéMON CENTER', music:'center', outdoor:false, ground:'F', void:'W',
  build(){ return kantoPC(); },
  stamps:[['machine',11,1],['plant',1,2],['plant',1,7]],
  warps:[ {x:7,y:9,to:'viridian',tx:5,ty:9,dir:0} ],
  npcs:[ kantoNurse(), { id:'vpc2_t', sprite:'gymguide', x:11, y:5, dir:2,
    script:()=>[ "Rumour says the SEVII ISLANDS' network reaches all the way here now. Small world — literally!" ]} ],
},

// ============================================================
//  WESTERN CHAIN: Viridian → Forest → Pewter → Rt3 → Mt Moon → Rt4 → Cerulean
// ============================================================
route2:{
  name:'ROUTE 2', music:'route', outdoor:true, ground:'.', void:'T',
  build(){
    const g = grid(18,28,'.');
    scatter(g,',','.',161,0.08);
    for(let j=0;j<28;j++){ g[j][0]='T'; g[j][17]='T'; }
    rectg(g,0,0,18,2,'T'); rectg(g,0,26,18,2,'T');
    g[0][8]='p'; g[1][8]='p'; g[0][9]='p'; g[1][9]='p';       // north → forest
    g[26][8]='p'; g[27][8]='p'; g[26][9]='p'; g[27][9]='p';   // south → viridian
    rectg(g,8,0,2,28,'p');
    rectg(g,3,8,5,3,'G'); rectg(g,10,17,5,3,'G');
    g[12][4]='X';                                             // optional CUT tree
    g[6][13]='T';                                             // a stray tree
    return g;
  },
  warps:[
    {x:8,y:0,to:'viridian_forest',tx:9,ty:22,dir:1},{x:9,y:0,to:'viridian_forest',tx:10,ty:22,dir:1},
    {x:8,y:27,to:'viridian',tx:10,ty:1,dir:0},{x:9,y:27,to:'viridian',tx:11,ty:1,dir:0},
  ],
  encounters:{ rate:0.15, list:[ ['pidgey',3,6,35],['rattata',3,6,30],['caterpie',3,5,18],['weedle',3,5,17] ]},
  npcs:[
    { id:'r2_sign', sprite:'sign', x:7, y:23, dir:0,
      script:()=>[ "ROUTE 2\nSouth: VIRIDIAN CITY\nNorth: VIRIDIAN FOREST" ]},
    { id:'r2_boy', sprite:'youngster', x:11, y:12, dir:2,
      script:()=>[ "The FOREST is dark and buggy, but push straight through and PEWTER's on the other side." ]},
  ],
},

viridian_forest:{
  name:'VIRIDIAN FOREST', music:'route', outdoor:true, ground:'.', void:'T',
  build(){
    const g = grid(20,24,'.');
    scatter(g,',','.',171,0.05);
    rectg(g,0,0,20,2,'T'); rectg(g,0,22,20,2,'T');
    for(let j=0;j<24;j++){ g[j][0]='T'; g[j][19]='T'; }
    g[0][9]='p'; g[1][9]='p'; g[0][10]='p'; g[1][10]='p';     // north → pewter
    g[22][9]='p'; g[23][9]='p'; g[22][10]='p'; g[23][10]='p'; // south → route2
    // main clear path (never blocked)
    rectg(g,9,2,2,20,'p');
    rectg(g,3,10,8,1,'p'); rectg(g,3,10,1,7,'p');
    rectg(g,11,14,6,1,'p'); rectg(g,16,7,1,8,'p'); rectg(g,11,7,6,1,'p');
    // scattered tree clumps (off the central path)
    for(const [tx,ty] of [[5,5],[6,6],[13,4],[14,5],[6,14],[7,15],[13,17],[14,18],[4,19],[16,20]]) g[ty][tx]='T';
    // bug grass in the clearings
    rectg(g,3,4,5,4,'G'); rectg(g,13,8,4,4,'G'); rectg(g,4,16,4,3,'G'); rectg(g,12,18,5,3,'G');
    return g;
  },
  warps:[
    {x:9,y:0,to:'pewter',tx:10,ty:17,dir:1},{x:10,y:0,to:'pewter',tx:11,ty:17,dir:1},
    {x:9,y:23,to:'route2',tx:8,ty:1,dir:0},{x:10,y:23,to:'route2',tx:9,ty:1,dir:0},
  ],
  encounters:{ rate:0.20, list:[
    ['caterpie',3,5,32],['weedle',3,5,32],['metapod',4,6,12],['kakuna',4,6,12],['pidgey',3,5,10],['pikachu',5,6,2] ]},
  npcs:[
    { id:'vf_bug1', sprite:'bugcatcher', x:7, y:12, dir:3, script:trainerScript('bugcatcher_sam') },
    { id:'vf_bug2', sprite:'bugcatcher', x:16, y:11, dir:2, script:trainerScript('bugcatcher_kip') },
    { id:'vf_lass', sprite:'lass', x:12, y:19, dir:1, script:trainerScript('lass_forest') },
    { id:'vf_sign', sprite:'sign', x:8, y:20, dir:0,
      script:()=>[ "VIRIDIAN FOREST\n\"Nature's own maze.\"\nDeep in the trees, rare POKéMON hide." ]},
  ],
},

pewter:{
  name:'PEWTER CITY', music:'town', outdoor:true, ground:'.', door:'p', void:'T',
  build(){
    const g = grid(22,20,'.');
    scatter(g,',','.',181,0.08);
    rectg(g,0,0,22,2,'T'); rectg(g,0,18,22,2,'T');
    for(let j=0;j<20;j++){ g[j][0]='T'; g[j][21]='T'; }
    g[18][10]='p'; g[19][10]='p'; g[18][11]='p'; g[19][11]='p';   // south → forest
    g[9][21]='p'; g[10][21]='p';                                   // east → route3
    // buildings
    rectg(g,3,4,6,5,'B'); g[8][5]='D'; g[8][6]='D';               // POKéCENTER
    rectg(g,13,4,6,5,'B'); g[8][15]='D'; g[8][16]='D';            // GYM (Brock)
    rectg(g,3,12,5,3,'B');                                         // museum (decor)
    rectg(g,14,12,5,3,'B');                                        // house (decor)
    // paths
    rectg(g,10,2,2,16,'p'); rectg(g,5,9,17,1,'p'); rectg(g,4,15,15,1,'p');
    return g;
  },
  stamps:[['pokecenter',3,4],['gym',13,4],['house',3,12],['house',14,12]],
  warps:[
    {x:10,y:19,to:'viridian_forest',tx:9,ty:1,dir:1},{x:11,y:19,to:'viridian_forest',tx:10,ty:1,dir:1},
    {x:21,y:9,to:'route3',tx:1,ty:6,dir:3},{x:21,y:10,to:'route3',tx:1,ty:7,dir:3},
    {x:5,y:8,to:'pewter_pc',tx:7,ty:8,dir:1},{x:6,y:8,to:'pewter_pc',tx:7,ty:8,dir:1},
    {x:15,y:8,to:'pewter_gym',tx:8,ty:14,dir:1},{x:16,y:8,to:'pewter_gym',tx:9,ty:14,dir:1},
  ],
  npcs:[
    { id:'pw_guide', sprite:'gymguide', x:14, y:9, dir:0,
      script:(f)=> f.beat_brock ? [ "You toppled BROCK's rock-hard defense?! Legendary. The road east is wide open now!" ]
        : [ "This is BROCK's GYM! He uses ROCK POKéMON — super tough defense.",
            "ROCK types crumble against WATER and GRASS. Your BLASTOISE or GENGAR would do nicely!" ]},
    { id:'pw_museum', sprite:'oldman', x:5, y:16, dir:0,
      script:()=>[ "The PEWTER MUSEUM has moon rocks from MT. MOON, just east of here. Space is amazing!" ]},
    { id:'pw_girl', sprite:'girl', x:12, y:6, dir:0, wander:true,
      script:()=>[ "PEWTER CITY — 'A Stone Grey City.' Everything here is carved from the mountain rock." ]},
    { id:'pw_sign', sprite:'sign', x:9, y:9, dir:0,
      script:()=>[ "PEWTER CITY\n\"A Stone Grey City\"\nEast: ROUTE 3 → MT. MOON → CERULEAN" ]},
    { id:'pw_gymsign', sprite:'sign', x:18, y:9, dir:0,
      script:()=>[ "PEWTER GYM\nLEADER: BROCK\n\"The Rock-Solid POKéMON Trainer!\"" ]},
  ],
},

pewter_pc:{
  name:'POKéMON CENTER', music:'center', outdoor:false, ground:'F', void:'W',
  build(){ return kantoPC(); },
  stamps:[['machine',11,1],['plant',1,2],['plant',1,7]],
  warps:[ {x:7,y:9,to:'pewter',tx:5,ty:9,dir:0} ],
  npcs:[ kantoNurse(), { id:'ppc_t', sprite:'hiker', x:3, y:5, dir:3,
    script:()=>[ "Off to MT. MOON? Heal up first. Those tunnels go on forever." ]} ],
},

pewter_gym:{
  name:'PEWTER GYM', music:'route', outdoor:false, ground:'A', void:'Z',
  build(){
    const g = grid(18,16,'A');
    rectg(g,0,0,18,2,'Z'); for(let j=0;j<16;j++){ g[j][0]='Z'; g[j][17]='Z'; }
    rectg(g,0,15,18,1,'Z'); g[15][8]='k'; g[15][9]='k';
    rectg(g,8,2,2,13,'A');                    // central battlefield strip
    g[5][4]='r'; g[5][13]='r'; g[10][4]='r'; g[10][13]='r';   // boulders
    return g;
  },
  warps:[ {x:8,y:15,to:'pewter',tx:15,ty:9,dir:0},{x:9,y:15,to:'pewter',tx:16,ty:9,dir:0} ],
  npcs:[
    { id:'pg_jr', sprite:'camper', x:9, y:10, dir:1, script:trainerScript('gym_camper') },
    { id:'brock', sprite:'brock', x:9, y:4, dir:0,
      script:(f)=> f.beat_brock ? [
        "BROCK: A rock is patient. It waits, it endures. You reminded me of that today. Safe travels, trainer.",
      ] : [ TRAINERS.brock.intro, {trainer:'brock'}, TRAINERS.brock.after ] },
    { id:'pg_sign', sprite:'sign', x:6, y:13, dir:0,
      script:()=>[ "PEWTER GYM — the immovable object. BROCK waits at the far end." ]},
  ],
},

route3:{
  name:'ROUTE 3', music:'route', outdoor:true, ground:'.', void:'T',
  build(){
    const g = grid(24,14,'.');
    scatter(g,',','.',191,0.08);
    rectg(g,0,0,24,2,'T'); rectg(g,0,12,24,2,'T');
    for(let j=0;j<14;j++){ g[j][0]='T'; g[j][23]='T'; }
    g[6][0]='p'; g[7][0]='p';                                 // west → pewter
    g[6][23]='p'; g[7][23]='p';                               // east → mt_moon
    rectg(g,1,6,22,2,'p');
    rectg(g,4,3,5,3,'G'); rectg(g,14,8,6,3,'G');
    g[9][11]='r';                                             // a boulder off-path
    return g;
  },
  warps:[
    {x:0,y:6,to:'pewter',tx:20,ty:9,dir:2},{x:0,y:7,to:'pewter',tx:20,ty:10,dir:2},
    {x:23,y:6,to:'mt_moon',tx:1,ty:9,dir:3},{x:23,y:7,to:'mt_moon',tx:1,ty:10,dir:3},
  ],
  encounters:{ rate:0.16, list:[
    ['spearow',10,12,30],['sandshrew',10,12,25],['mankey',11,13,20],['pidgey',10,12,15],['rattata',10,12,10] ]},
  npcs:[
    { id:'r3_camp', sprite:'camper', x:9, y:5, dir:0, script:trainerScript('camper_flint') },
    { id:'r3_hiker', sprite:'hiker', x:16, y:8, dir:2, script:trainerScript('hiker_marcus') },
    { id:'r3_sign', sprite:'sign', x:3, y:9, dir:0,
      script:()=>[ "ROUTE 3\nWest: PEWTER CITY\nEast: MT. MOON" ]},
  ],
},

mt_moon:{
  name:'MT. MOON', music:'cave', outdoor:false, ground:'c', void:'C',
  build(){
    const g = grid(22,18,'c');
    scatter(g,'C','c',201,0.05);
    rectg(g,0,0,22,2,'C'); rectg(g,0,16,22,2,'C');
    for(let j=0;j<18;j++){ g[j][0]='C'; g[j][21]='C'; }
    g[9][0]='c'; g[10][0]='c';                                // west → route3
    g[8][21]='c'; g[9][21]='c';                               // east → route4
    // rocky pillars / walls carving tunnels (keep a clear route)
    for(const [rx,ry,rw,rh] of [[4,3,2,4],[8,6,2,5],[13,3,2,4],[16,8,2,5],[6,12,3,2],[12,12,4,2]]) rectg(g,rx,ry,rw,rh,'C');
    // clear the main corridor
    rectg(g,1,9,20,2,'c');
    rectg(g,10,2,2,7,'c'); rectg(g,10,11,2,5,'c');
    // boulders
    g[5][7]='r'; g[12][15]='r'; g[3][18]='r';
    return g;
  },
  warps:[
    {x:0,y:9,to:'route3',tx:22,ty:6,dir:2},{x:0,y:10,to:'route3',tx:22,ty:7,dir:2},
    {x:21,y:8,to:'route4',tx:1,ty:5,dir:3},{x:21,y:9,to:'route4',tx:1,ty:6,dir:3},
  ],
  floorEncounters:{ rate:0.16, list:[
    ['zubat',7,10,40],['geodude',7,10,30],['paras',8,10,15],['clefairy',8,10,8],['sandshrew',7,9,7] ]},
  npcs:[
    { id:'mm_nerd', sprite:'youngster', x:7, y:9, dir:3, script:trainerScript('supernerd_miles') },
    { id:'mm_rocket', sprite:'grunt', x:15, y:9, dir:2,
      posByFlag:{ flag:'beat_rocket_moon', x:15, y:12, dir:0 },
      script:(f)=> f.beat_rocket_moon ? [ TRAINERS.rocket_moon.after ]
        : [ TRAINERS.rocket_moon.intro, {trainer:'rocket_moon'}, TRAINERS.rocket_moon.after,
            {moveNpc:{id:'mm_rocket', x:15, y:12, dir:0}} ] },
    { id:'mm_sign', sprite:null, x:2, y:9, dir:0,
      script:()=>[ "MT. MOON\nThe east tunnel leads to ROUTE 4 and CERULEAN CITY.\nMind the ZUBAT!" ]},
  ],
},

route4:{
  name:'ROUTE 4', music:'route', outdoor:true, ground:'.', void:'T',
  build(){
    const g = grid(22,12,'.');
    scatter(g,',','.',211,0.08);
    rectg(g,0,0,22,2,'M'); rectg(g,0,10,22,2,'T');            // cliff to north, trees south
    for(let j=0;j<12;j++){ g[j][0]='T'; g[j][21]='T'; }
    g[5][0]='p'; g[6][0]='p';                                 // west → mt_moon
    g[5][21]='p'; g[6][21]='p';                               // east → cerulean
    rectg(g,1,5,20,2,'p');
    rectg(g,3,3,5,2,'G'); rectg(g,13,7,5,2,'G');
    g[4][10]='r';
    return g;
  },
  warps:[
    {x:0,y:5,to:'mt_moon',tx:20,ty:8,dir:2},{x:0,y:6,to:'mt_moon',tx:20,ty:9,dir:2},
    {x:21,y:5,to:'cerulean',tx:1,ty:26,dir:3},{x:21,y:6,to:'cerulean',tx:1,ty:26,dir:3},
  ],
  encounters:{ rate:0.14, list:[ ['spearow',10,12,35],['rattata',10,12,30],['sandshrew',10,12,20],['mankey',11,13,15] ]},
  npcs:[
    { id:'r4_sign', sprite:'sign', x:3, y:7, dir:0,
      script:()=>[ "ROUTE 4\nWest: MT. MOON\nEast: CERULEAN CITY" ]},
    { id:'r4_hiker', sprite:'hiker', x:12, y:5, dir:0,
      script:()=>[ "Made it through MT. MOON? Then you've earned the CERULEAN breeze. It's just east." ]},
  ],
},

// ============================================================
//  CENTRAL KANTO: Vermilion → Route 6 → Saffron → Route 7 → Celadon
// ============================================================
route6:{
  name:'ROUTE 6', music:'route', outdoor:true, ground:'.', void:'T',
  build(){
    const g = grid(22,12,'.');
    scatter(g,',','.',221,0.08);
    rectg(g,0,0,22,2,'T'); rectg(g,0,10,22,2,'T');
    for(let j=0;j<12;j++){ g[j][0]='T'; g[j][21]='T'; }
    g[5][21]='p'; g[6][21]='p';                              // east → vermilion
    g[5][0]='p'; g[6][0]='p';                                // west → saffron
    rectg(g,1,5,20,2,'p');
    rectg(g,3,3,5,2,'G'); rectg(g,13,7,5,2,'G');
    g[8][11]='T';
    return g;
  },
  warps:[
    {x:21,y:5,to:'vermilion',tx:1,ty:9,dir:2},{x:21,y:6,to:'vermilion',tx:1,ty:9,dir:2},
    {x:0,y:5,to:'saffron',tx:19,ty:12,dir:2},{x:0,y:6,to:'saffron',tx:19,ty:13,dir:2},
  ],
  encounters:{ rate:0.15, list:[ ['pidgey',18,21,30],['meowth',18,21,25],['ekans',19,22,18],['mankey',19,22,15],['growlithe',20,23,12] ]},
  npcs:[
    { id:'r6_bird', sprite:'youngster', x:10, y:4, dir:0, script:trainerScript('bird_keeper') },
    { id:'r6_gambler', sprite:'gymguide', x:15, y:8, dir:2, script:trainerScript('gambler_rich') },
    { id:'r6_sign', sprite:'sign', x:3, y:7, dir:0,
      script:()=>[ "ROUTE 6\nEast: VERMILION CITY\nWest: SAFFRON CITY" ]},
  ],
},

saffron:{
  name:'SAFFRON CITY', music:'town', outdoor:true, ground:'.', door:'p', void:'T',
  build(){
    const g = grid(24,22,'.');
    scatter(g,',','.',231,0.07);
    rectg(g,0,0,24,2,'T'); rectg(g,0,20,24,2,'T');
    for(let j=0;j<22;j++){ g[j][0]='T'; g[j][23]='T'; }
    g[12][23]='p'; g[13][23]='p';                            // east → route6
    g[12][0]='p'; g[13][0]='p';                              // west → route7
    // Silph Co. (big central tower — decor)
    rectg(g,9,3,6,6,'B');
    // Sabrina gym
    rectg(g,17,4,5,5,'B'); g[8][18]='D'; g[8][19]='D';
    // Pokémon Center
    rectg(g,2,4,6,5,'B'); g[8][4]='D'; g[8][5]='D';
    // houses
    rectg(g,3,14,5,3,'B'); rectg(g,16,14,5,3,'B');
    // paths
    rectg(g,1,12,22,2,'p'); rectg(g,11,2,2,18,'p'); rectg(g,4,9,16,1,'p'); rectg(g,18,9,1,1,'p');
    return g;
  },
  stamps:[['pokecenter',2,4],['gym',17,4],['lab',9,3],['house',3,14],['house',16,14]],
  warps:[
    {x:23,y:12,to:'route6',tx:1,ty:5,dir:2},{x:23,y:13,to:'route6',tx:1,ty:6,dir:2},
    {x:0,y:12,to:'route7',tx:20,ty:6,dir:2},{x:0,y:13,to:'route7',tx:20,ty:7,dir:2},
    {x:4,y:8,to:'saffron_pc',tx:7,ty:8,dir:1},{x:5,y:8,to:'saffron_pc',tx:7,ty:8,dir:1},
    {x:18,y:8,to:'saffron_gym',tx:8,ty:14,dir:1},{x:19,y:8,to:'saffron_gym',tx:9,ty:14,dir:1},
  ],
  npcs:[
    { id:'sf_guide', sprite:'gymguide', x:18, y:9, dir:0,
      script:(f)=> f.beat_sabrina ? [ "You beat SABRINA?! I felt a chill when you walked in. You're not normal, are you?" ]
        : [ "SAFFRON GYM's LEADER is SABRINA — a PSYCHIC prodigy. Her POKéMON read your every move.",
            "DARK, GHOST and BUG POKéMON unsettle PSYCHICS. Your GENGAR would give her pause!" ]},
    { id:'sf_silph', sprite:'boy', x:12, y:10, dir:0, wander:true,
      script:()=>[ "That's SILPH CO. HQ — they make the POKé BALLs and the SILPH SCOPE. Cutting-edge stuff!" ]},
    { id:'sf_old', sprite:'oldman', x:6, y:16, dir:0,
      script:()=>[ "SAFFRON is the great crossroads of KANTO. Roads run to every corner from here." ]},
    { id:'sf_sign', sprite:'sign', x:10, y:12, dir:0,
      script:()=>[ "SAFFRON CITY\n\"Shining, Golden Land of Commerce\"\nWest: ROUTE 7 → CELADON  East: ROUTE 6" ]},
    { id:'sf_gymsign', sprite:'sign', x:20, y:9, dir:0,
      script:()=>[ "SAFFRON GYM\nLEADER: SABRINA\n\"The Master of PSYCHIC POKéMON!\"" ]},
  ],
},

saffron_pc:{
  name:'POKéMON CENTER', music:'center', outdoor:false, ground:'F', void:'W',
  build(){ return kantoPC(); },
  stamps:[['machine',11,1],['plant',1,2],['plant',1,7]],
  warps:[ {x:7,y:9,to:'saffron',tx:4,ty:9,dir:0} ],
  npcs:[ kantoNurse(), { id:'sfpc_t', sprite:'youngster', x:3, y:5, dir:3,
    script:()=>[ "They say SABRINA once bent a steel spoon just by frowning at it. ...I believe it." ]} ],
},

saffron_gym:{
  name:'SAFFRON GYM', music:'route', outdoor:false, ground:'F', void:'Z',
  build(){
    const g = grid(18,16,'F');
    rectg(g,0,0,18,2,'Z'); for(let j=0;j<16;j++){ g[j][0]='Z'; g[j][17]='Z'; }
    rectg(g,0,15,18,1,'Z'); g[15][8]='k'; g[15][9]='k';
    // psychic 'pad' decorations (boulders repurposed as glyph stones)
    g[4][4]='O'; g[4][13]='O'; g[10][4]='O'; g[10][13]='O';
    return g;
  },
  warps:[ {x:8,y:15,to:'saffron',tx:18,ty:9,dir:0},{x:9,y:15,to:'saffron',tx:19,ty:9,dir:0} ],
  npcs:[
    { id:'sg_jr', sprite:'youngster', x:9, y:10, dir:1, script:trainerScript('gym_psychic') },
    { id:'sabrina', sprite:'sabrina', x:9, y:4, dir:0,
      script:(f)=> f.beat_sabrina ? [
        "SABRINA: The future feels... open now. Unwritten. I have you to thank for that. Go well.",
      ] : [ TRAINERS.sabrina.intro, {trainer:'sabrina'}, TRAINERS.sabrina.after ] },
    { id:'sg_sign', sprite:'sign', x:6, y:12, dir:0,
      script:()=>[ "SAFFRON GYM — the air hums with unseen force. SABRINA waits, unmoving, at the center." ]},
  ],
},

route7:{
  name:'ROUTE 7', music:'route', outdoor:true, ground:'.', void:'T',
  build(){
    const g = grid(22,12,'.');
    scatter(g,',','.',241,0.08);
    rectg(g,0,0,22,2,'T'); rectg(g,0,10,22,2,'T');
    for(let j=0;j<12;j++){ g[j][0]='T'; g[j][21]='T'; }
    g[6][21]='p'; g[7][21]='p';                              // east → saffron
    g[6][0]='p'; g[7][0]='p';                                // west → celadon
    rectg(g,1,6,20,2,'p');
    rectg(g,3,3,5,2,'G'); rectg(g,13,8,5,2,'G');
    rectg(g,9,3,3,3,'f');                                    // flower bed
    return g;
  },
  warps:[
    {x:21,y:6,to:'saffron',tx:1,ty:12,dir:2},{x:21,y:7,to:'saffron',tx:1,ty:13,dir:2},
    {x:0,y:6,to:'celadon',tx:20,ty:10,dir:2},{x:0,y:7,to:'celadon',tx:20,ty:11,dir:2},
  ],
  encounters:{ rate:0.15, list:[ ['oddish',18,21,30],['bellsprout',18,21,25],['meowth',18,21,18],['pidgey',18,21,15],['gloom',20,23,7],['mankey',19,22,5] ]},
  npcs:[
    { id:'r7_lass', sprite:'lass', x:10, y:5, dir:0, script:trainerScript('lass_petal') },
    { id:'r7_beauty', sprite:'misty', x:15, y:9, dir:2, script:trainerScript('beauty_grace') },
    { id:'r7_sign', sprite:'sign', x:3, y:8, dir:0,
      script:()=>[ "ROUTE 7\nEast: SAFFRON CITY\nWest: CELADON CITY" ]},
  ],
},

celadon:{
  name:'CELADON CITY', music:'town', outdoor:true, ground:'.', door:'p', void:'T',
  build(){
    const g = grid(24,20,'.');
    scatter(g,',','.',251,0.07);
    rectg(g,0,0,24,2,'T'); rectg(g,0,18,24,2,'T');
    for(let j=0;j<20;j++){ g[j][0]='T'; g[j][23]='T'; }
    g[10][23]='p'; g[11][23]='p';                            // east → route7
    // Celadon Dept. Store (big — decor)
    rectg(g,3,3,7,6,'B');
    // Erika's gym (greenhouse)
    rectg(g,16,4,5,5,'B'); g[8][17]='D'; g[8][18]='D';
    // Pokémon Center + Game Corner (decor)
    rectg(g,3,12,5,3,'B'); g[11][4]='D'; g[11][5]='D';
    rectg(g,15,12,6,3,'B');
    // flower beds (Celadon is the garden city)
    rectg(g,11,10,4,3,'f'); rectg(g,12,3,3,2,'f');
    // paths
    rectg(g,10,2,2,16,'p'); rectg(g,4,10,17,1,'p'); rectg(g,4,14,15,1,'p');
    return g;
  },
  stamps:[['mart',3,3],['gym',16,4],['pokecenter',3,11],['house',15,12]],
  warps:[
    {x:23,y:10,to:'route7',tx:1,ty:6,dir:2},{x:23,y:11,to:'route7',tx:1,ty:7,dir:2},
    {x:4,y:11,to:'celadon_pc',tx:7,ty:8,dir:1},{x:5,y:11,to:'celadon_pc',tx:7,ty:8,dir:1},
    {x:17,y:8,to:'celadon_gym',tx:8,ty:14,dir:1},{x:18,y:8,to:'celadon_gym',tx:9,ty:14,dir:1},
  ],
  npcs:[
    { id:'cd_guide', sprite:'gymguide', x:18, y:9, dir:0,
      script:(f)=> f.beat_erika ? [ "You bested ERIKA's garden?! And you still smell of roses. Impressive on both counts." ]
        : [ "CELADON GYM's LEADER is ERIKA — a master of GRASS POKéMON. Her gym's a real greenhouse!",
            "FIRE, FLYING, ICE and PSYCHIC types cut through GRASS. PIDGEOT or MOLTRES would wilt her lineup!" ]},
    { id:'cd_store', sprite:'girl', x:8, y:10, dir:0, wander:true,
      script:()=>[ "The CELADON DEPT. STORE is the biggest in KANTO — five whole floors of everything!" ]},
    { id:'cd_gambler', sprite:'oldman', x:16, y:15, dir:0,
      script:()=>[ "The GAME CORNER's slots ate my savings. But between us... I heard TEAM ROCKET runs the place." ]},
    { id:'cd_sign', sprite:'sign', x:9, y:10, dir:0,
      script:()=>[ "CELADON CITY\n\"The City of Rainbow Dreams\"\nEast: ROUTE 7 → SAFFRON" ]},
    { id:'cd_gymsign', sprite:'sign', x:19, y:9, dir:0,
      script:()=>[ "CELADON GYM\nLEADER: ERIKA\n\"Nature-Loving Princess of GRASS!\"" ]},
  ],
},

celadon_pc:{
  name:'POKéMON CENTER', music:'center', outdoor:false, ground:'F', void:'W',
  build(){ return kantoPC(); },
  stamps:[['machine',11,1],['plant',1,2],['plant',1,7]],
  warps:[ {x:7,y:9,to:'celadon',tx:4,ty:12,dir:0} ],
  npcs:[ kantoNurse(), { id:'cdpc_t', sprite:'girl', x:11, y:5, dir:2,
    script:()=>[ "CELADON's flowers bloom year round. ERIKA says a calm heart makes strong GRASS POKéMON." ]} ],
},

celadon_gym:{
  name:'CELADON GYM', music:'route', outdoor:false, ground:'F', void:'Z',
  build(){
    const g = grid(18,16,'F');
    rectg(g,0,0,18,2,'Z'); for(let j=0;j<16;j++){ g[j][0]='Z'; g[j][17]='Z'; }
    rectg(g,0,15,18,1,'Z'); g[15][8]='k'; g[15][9]='k';
    // greenhouse flower beds & potted trees
    rectg(g,2,4,4,3,'f'); rectg(g,12,4,4,3,'f'); rectg(g,2,9,4,3,'f'); rectg(g,12,9,4,3,'f');
    g[3][3]='T'; g[3][14]='T'; g[11][3]='T'; g[11][14]='T';
    return g;
  },
  warps:[ {x:8,y:15,to:'celadon',tx:17,ty:9,dir:0},{x:9,y:15,to:'celadon',tx:18,ty:9,dir:0} ],
  npcs:[
    { id:'cg_jr', sprite:'misty', x:9, y:10, dir:1, script:trainerScript('gym_beauty') },
    { id:'erika', sprite:'erika', x:9, y:4, dir:0,
      script:(f)=> f.beat_erika ? [
        "ERIKA: The garden is peaceful today. Come admire the blooms any time, champion.",
      ] : [ TRAINERS.erika.intro, {trainer:'erika'}, TRAINERS.erika.after ] },
    { id:'cg_sign', sprite:'sign', x:6, y:13, dir:0,
      script:()=>[ "CELADON GYM — a greenhouse in bloom. ERIKA rests among the flowers ahead." ]},
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
