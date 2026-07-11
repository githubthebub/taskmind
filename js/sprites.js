/* ============================================================
   sprites.js — all art is drawn in code (original artwork).
   - Tiles: 16x16 pixel style
   - Overworld characters: 16x20 pixel style
   - Battle sprites: 48x48 (mons) / 48x56 (trainers) vector style
   ============================================================ */
'use strict';

const SPR = { _c:{} };
const OUTC = '#2e2440';

function cv(w,h){ const c = document.createElement('canvas'); c.width=w; c.height=h; return c; }
function cx2(c){ const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return x; }

// ---- vector helpers (battle sprites) ----
function E(c,cx,cy,rx,ry,f,o,rot){
  c.save(); c.translate(cx,cy); c.rotate(rot||0);
  c.beginPath(); c.ellipse(0,0,rx,ry,0,0,Math.PI*2);
  c.fillStyle=f; c.fill();
  if(o!==0){ c.lineWidth=o||1.4; c.strokeStyle=OUTC; c.stroke(); }
  c.restore();
}
function CIR(c,cx,cy,r,f,o){ E(c,cx,cy,r,r,f,o); }
function PG(c,pts,f,o){
  c.beginPath(); c.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++) c.lineTo(pts[i][0],pts[i][1]);
  c.closePath(); c.fillStyle=f; c.fill();
  if(o!==0){ c.lineWidth=o||1.4; c.strokeStyle=OUTC; c.lineJoin='round'; c.stroke(); }
}
function LN(c,x1,y1,x2,y2,w,col){
  c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2);
  c.lineWidth=w; c.strokeStyle=col||OUTC; c.lineCap='round'; c.stroke();
}
function ARC(c,cx,cy,r,a0,a1,w,col){
  c.beginPath(); c.arc(cx,cy,r,a0,a1);
  c.lineWidth=w; c.strokeStyle=col||OUTC; c.lineCap='round'; c.stroke();
}
function EYE(c,x,y,rx,ry,pup){ // white eye with pupil
  E(c,x,y,rx,ry,'#fff',1);
  E(c,x,y+ry*0.15,rx*0.45,ry*0.45,pup||'#2e2440',0);
}
// curved feather/plume: quad curve from p0 to p1 with thickness w
function PLUME(c,x0,y0,cx,cy,x1,y1,w,f,o){
  c.beginPath();
  c.moveTo(x0,y0);
  c.quadraticCurveTo(cx,cy-w*0.5,x1,y1);
  c.quadraticCurveTo(cx,cy+w*0.6,x0,y0+w*0.7);
  c.closePath();
  c.fillStyle=f; c.fill();
  if(o!==0){ c.lineWidth=o||1.3; c.strokeStyle=OUTC; c.lineJoin='round'; c.stroke(); }
}
// spiky fan of triangles around a point
function SPIKES(c,cx,cy,rIn,rOut,a0,a1,n,f,o){
  for(let i=0;i<n;i++){
    const a=a0+(a1-a0)*(i+0.5)/n, da=(a1-a0)/n*0.42;
    PG(c,[[cx+Math.cos(a-da)*rIn,cy+Math.sin(a-da)*rIn],
          [cx+Math.cos(a)*rOut,cy+Math.sin(a)*rOut],
          [cx+Math.cos(a+da)*rIn,cy+Math.sin(a+da)*rIn]],f,o);
  }
}

// ============================================================
// POKÉMON BATTLE SPRITES (48x48)
// ============================================================
const MON_ART = {

blastoise(c){
  // cannons over shoulders
  LN(c,13,22,7,8,8.4,OUTC); LN(c,35,22,41,8,8.4,OUTC);
  LN(c,13,22,7,8,6.6,'#8c93a2'); LN(c,35,22,41,8,6.6,'#8c93a2');
  LN(c,12,21,8,11,2.4,'#c8ccd4'); LN(c,36,21,40,11,2.4,'#c8ccd4');
  E(c,7,7.4,4.2,3.4,'#aeb4c0',1.3,-0.7); CIR(c,7.4,7,1.9,'#2e2440',0);
  E(c,41,7.4,4.2,3.4,'#aeb4c0',1.3,0.7); CIR(c,40.6,7,1.9,'#2e2440',0);
  // shell rim
  E(c,24,31,16,13,'#b08050',1.4);
  // legs
  E(c,13,42,5.5,4.5,'#5aa8d8',1.4); E(c,35,42,5.5,4.5,'#5aa8d8',1.4);
  PG(c,[[10,45],[12,41],[14,45]],'#e8e8e0',1);
  PG(c,[[32,45],[34,41],[36,45]],'#e8e8e0',1);
  // belly
  E(c,24,31,11.5,11,'#eeddb0',1.4);
  ARC(c,24,26,9,0.4,Math.PI-0.4,1.1,'#b8a070');
  ARC(c,24,31,9,0.3,Math.PI-0.3,1.1,'#b8a070');
  // arms
  E(c,11,30,4,6.5,'#5aa8d8',1.4,-0.4); E(c,37,30,4,6.5,'#5aa8d8',1.4,0.4);
  // head
  CIR(c,24,14,8.6,'#5aa8d8',1.4);
  PG(c,[[16,9],[14,4],[19,7]],'#5aa8d8',1.2);
  PG(c,[[32,9],[34,4],[29,7]],'#5aa8d8',1.2);
  EYE(c,20,13,2.4,2.9,'#7a3020'); EYE(c,28,13,2.4,2.9,'#7a3020');
  LN(c,17,10,22,11.5,1.3); LN(c,31,10,26,11.5,1.3); // brows
  LN(c,20,19.5,28,19.5,1.3); // mouth
},
blastoise_back(c){
  // cannons pointing away/up
  LN(c,13,26,8,8,9,OUTC); LN(c,35,26,40,8,9,OUTC);
  LN(c,13,26,8,8,7,'#8c93a2'); LN(c,35,26,40,8,7,'#8c93a2');
  LN(c,12,25,9,12,2.6,'#c8ccd4'); LN(c,36,25,39,12,2.6,'#c8ccd4');
  E(c,8,6.5,4.4,3,'#5a5462',1.3,-0.5); E(c,40,6.5,4.4,3,'#5a5462',1.3,0.5);
  // head over shell
  CIR(c,24,12,7.6,'#5aa8d8',1.4);
  PG(c,[[17,7],[15,2],[20,5]],'#5aa8d8',1.2);
  PG(c,[[31,7],[33,2],[28,5]],'#5aa8d8',1.2);
  // shell dome
  E(c,24,31,15.5,13.5,'#a87848',1.6);
  E(c,24,31,15.5,13.5,'transparent',0);
  // shell pattern
  PG(c,[[24,22],[31,26],[31,35],[24,39],[17,35],[17,26]],'rgba(0,0,0,0)',1.2);
  LN(c,24,22,24,18.5,1.2); LN(c,31,26,35,23,1.2); LN(c,31,35,35,38,1.2);
  LN(c,24,39,24,43,1.2); LN(c,17,35,13,38,1.2); LN(c,17,26,13,23,1.2);
  // cream rim at base
  E(c,24,43,12,2.6,'#eeddb0',1.2);
  // arms
  E(c,9,33,3.4,5.6,'#5aa8d8',1.4,-0.3); E(c,39,33,3.4,5.6,'#5aa8d8',1.4,0.3);
},

pidgeot(c){
  // tail feathers (behind, lower-right)
  PG(c,[[28,36],[44,39],[43,44],[28,42]],'#e84848',1.1);
  PG(c,[[28,38],[40,43],[36,46],[27,42]],'#f8d048',1.1);
  // crest: swept-back ellipses ending in tips
  PG(c,[[36,4],[46,7],[38,12]],'#e84848',1.2);
  E(c,30,8,11,4.6,'#e84848',1.3,-0.28);
  PG(c,[[33,8],[41,12],[33,13]],'#f8d048',1);
  E(c,27,10,7.5,3,'#f8d048',1,-0.24);
  // body
  E(c,25,30,11,12.5,'#d8b088',1.4);
  E(c,22,32,7.5,9.5,'#f2e2c2',1.1);
  // folded wing
  E(c,32.5,29,6,11,'#b08858',1.4,0.25);
  LN(c,31,22,35,32,1,'#8a6840'); LN(c,34,24,36.5,32,1,'#8a6840');
  // legs
  LN(c,20,41,20,46,2.6,'#e8a878'); LN(c,28,41,28,46,2.6,'#e8a878');
  LN(c,17,46,23,46,2,'#e8a878'); LN(c,25,46,31,46,2,'#e8a878');
  // head
  CIR(c,20,13,7.4,'#e8d0a8',1.4);
  // beak (hooked)
  PG(c,[[14,11.5],[6,12.5],[7.5,15],[14,15.5]],'#e8a878',1.1);
  PG(c,[[7.5,14.6],[6,12.5],[9.5,13.2],[8.5,16]],'#b87848',0.9);
  // eye with small mask stripe
  PG(c,[[15,10.5],[19.5,9],[19.5,12.5],[15.5,13]],'#3a3048',0);
  EYE(c,20,11,2.1,2.5,'#b03028');
},
pidgeot_back(c){
  // tail feathers fanned at bottom
  PG(c,[[19,38],[13,47],[22,42]],'#e84848',1.1);
  PG(c,[[29,38],[35,47],[26,42]],'#e84848',1.1);
  PG(c,[[22,40],[24,48],[26,40]],'#f8d048',1.1);
  // body back
  E(c,24,29,11.5,12,'#d8b088',1.4);
  // folded wings both sides w/ feather lines
  E(c,14.5,29,5.5,10.5,'#b08858',1.4,-0.15);
  E(c,33.5,29,5.5,10.5,'#b08858',1.4,0.15);
  LN(c,13.5,23,12.5,34,1,'#8a6840'); LN(c,34.5,23,35.5,34,1,'#8a6840');
  // head back (cream)
  CIR(c,24,11,6.6,'#e8d0a8',1.4);
  // crest: one teardrop mane flowing down the back
  PG(c,[[19,7],[24,1],[29,7],[30.5,15],[27,26],[21,26],[17.5,15]],'#e84848',1.3);
  PG(c,[[22,9],[24,5],[26,9],[26.8,16],[24,22],[21.2,16]],'#f8d048',0);
},

gengar(c){
  // body: spiky top silhouette
  const pts=[];
  for(let i=0;i<=20;i++){
    const a=Math.PI+ i*(Math.PI/20);
    const spikey=(i>2&&i<18&&i%3===0)?4.5:0;
    pts.push([24+Math.cos(a)*(15+spikey),27+Math.sin(a)*(14+spikey)]);
  }
  pts.push([39,34],[36,42],[30,40],[24,42],[18,40],[12,42],[9,34]);
  PG(c,pts,'#6a4a9e',1.5);
  // ears
  PG(c,[[11,17],[4,4],[18,11]],'#6a4a9e',1.4);
  PG(c,[[37,17],[44,4],[30,11]],'#6a4a9e',1.4);
  // highlight
  E(c,19,22,7,6,'rgba(160,130,220,0.5)',0);
  // arms
  PG(c,[[9,29],[2,33],[4,36],[7,35],[6,38],[10,37]],'#6a4a9e',1.3);
  PG(c,[[39,29],[46,33],[44,36],[41,35],[42,38],[38,37]],'#6a4a9e',1.3);
  // eyes: slanted red
  PG(c,[[13,19],[22,22.5],[14,25]],'#f0f0f0',1.1);
  PG(c,[[35,19],[26,22.5],[34,25]],'#f0f0f0',1.1);
  PG(c,[[15.5,20.5],[21,22.5],[16,24]],'#e83030',0);
  PG(c,[[32.5,20.5],[27,22.5],[32,24]],'#e83030',0);
  // wide toothy grin
  c.beginPath(); c.moveTo(11,28); c.quadraticCurveTo(24,32,37,28);
  c.quadraticCurveTo(35,37.5,24,38); c.quadraticCurveTo(13,37.5,11,28);
  c.closePath();
  c.fillStyle='#fff'; c.fill(); c.lineWidth=1.3; c.strokeStyle=OUTC; c.stroke();
  for(let i=1;i<7;i++){ const gx=11+i*3.7; LN(c,gx,29.2+Math.abs(3.5-i)*0.4,gx-1,33.6-Math.abs(3.5-i)*0.5,0.9,OUTC); }
  c.beginPath(); c.moveTo(12.5,31.5); c.quadraticCurveTo(24,35.2,35.5,31.5);
  c.lineWidth=0.9; c.strokeStyle=OUTC; c.stroke();
},
gengar_back(c){
  // round back with spine spikes
  CIR(c,24,28,15,'#6a4a9e',1.5);
  PG(c,[[11,16],[4,3],[18,10]],'#6a4a9e',1.4);
  PG(c,[[37,16],[44,3],[30,10]],'#6a4a9e',1.4);
  PG(c,[[24,10],[20,17],[28,17]],'#584088',1.2);
  PG(c,[[24,18],[19,26],[29,26]],'#584088',1.2);
  PG(c,[[24,27],[19,35],[29,35]],'#584088',1.2);
  E(c,17,20,5,4,'rgba(160,130,220,0.4)',0);
  // stub arms
  E(c,9,32,3.5,4.5,'#6a4a9e',1.3); E(c,39,32,3.5,4.5,'#6a4a9e',1.3);
  // feet
  E(c,17,42,4.5,3,'#6a4a9e',1.3); E(c,31,42,4.5,3,'#6a4a9e',1.3);
},

nidoking(c){
  // tail
  c.beginPath(); c.moveTo(34,36); c.quadraticCurveTo(47,38,44,28);
  c.lineWidth=6.5; c.strokeStyle='#9a7ab8'; c.lineCap='round'; c.stroke();
  c.beginPath(); c.moveTo(34,36); c.quadraticCurveTo(47,38,44,28);
  c.lineWidth=8.5; c.strokeStyle=OUTC; c.globalCompositeOperation='destination-over'; c.stroke();
  c.globalCompositeOperation='source-over';
  // legs
  E(c,14,42,6,5,'#9a7ab8',1.4); E(c,33,42,6,5,'#9a7ab8',1.4);
  PG(c,[[10,46],[12,42],[14,46]],'#e8e8e0',1);
  PG(c,[[30,46],[32,42],[34,46]],'#e8e8e0',1);
  // body
  E(c,24,31,12.5,12,'#9a7ab8',1.4);
  // belly plates
  E(c,24,33,8.5,9,'#d8c8b8',1.2);
  ARC(c,24,28,7,0.4,Math.PI-0.4,1.1,'#a89078');
  ARC(c,24,33,7,0.3,Math.PI-0.3,1.1,'#a89078');
  // shoulder spikes
  PG(c,[[12,24],[7,18],[15,20]],'#8a6aa8',1.2);
  PG(c,[[36,24],[41,18],[33,20]],'#8a6aa8',1.2);
  // arms
  E(c,10,31,4,6,'#9a7ab8',1.4,-0.35); E(c,38,31,4,6,'#9a7ab8',1.4,0.35);
  // head (blocky)
  E(c,24,14,9,7.5,'#9a7ab8',1.4);
  // ears: pointed, angled out
  PG(c,[[17,10],[10,1],[21,6.5]],'#9a7ab8',1.3);
  PG(c,[[13,6],[11.5,2.5],[17,6.5]],'#584870',0);
  PG(c,[[31,10],[38,1],[27,6.5]],'#9a7ab8',1.3);
  PG(c,[[35,6],[36.5,2.5],[31,6.5]],'#584870',0);
  // big horn on forehead
  PG(c,[[21.5,10],[24,-1],[26.5,10]],'#e0d8c8',1.2);
  // fierce face
  EYE(c,19.5,13.5,2.2,2.5,'#802828'); EYE(c,28.5,13.5,2.2,2.5,'#802828');
  LN(c,16.5,11,21.5,12.5,1.3); LN(c,31.5,11,26.5,12.5,1.3);
  LN(c,18,19.5,30,19.5,1.3);
  PG(c,[[19.5,19.5],[20.5,22.5],[21.8,19.5]],'#fff',0.8);
  PG(c,[[26.2,19.5],[27.5,22.5],[28.5,19.5]],'#fff',0.8);
},
nidoking_back(c){
  // tail sweeping right
  c.beginPath(); c.moveTo(32,38); c.quadraticCurveTo(46,40,45,29);
  c.lineWidth=8.5; c.strokeStyle=OUTC; c.stroke();
  c.beginPath(); c.moveTo(32,38); c.quadraticCurveTo(46,40,45,29);
  c.lineWidth=6.5; c.strokeStyle='#9a7ab8'; c.stroke();
  // body back
  E(c,24,30,13,12.5,'#9a7ab8',1.4);
  // spine spikes
  PG(c,[[24,15],[19,23],[29,23]],'#d8c8b8',1.2);
  PG(c,[[24,24],[18,33],[30,33]],'#d8c8b8',1.2);
  PG(c,[[24,34],[19,41],[29,41]],'#d8c8b8',1.2);
  // head back
  E(c,24,12,8,7,'#9a7ab8',1.4);
  PG(c,[[18,8],[11,-1],[22,4.5]],'#9a7ab8',1.3);
  PG(c,[[30,8],[37,-1],[26,4.5]],'#9a7ab8',1.3);
  // arms
  E(c,9,32,4,6,'#9a7ab8',1.4,-0.3); E(c,39,32,4,6,'#9a7ab8',1.4,0.3);
},

snorlax(c){
  // body
  E(c,24,30,17,15,'#3f6f7f',1.5);
  // belly
  E(c,24,33,12.5,11.5,'#efe0c0',1.3);
  // feet
  E(c,12,42,5.5,4.8,'#efe0c0',1.3); E(c,36,42,5.5,4.8,'#efe0c0',1.3);
  CIR(c,12,43,2.2,'#c8a878',0.9); CIR(c,36,43,2.2,'#c8a878',0.9);
  PG(c,[[8,38.5],[9,36],[10.5,38]],'#fff',0.8); PG(c,[[34,38],[35,35.5],[36.5,38]],'#fff',0.8);
  // arms
  E(c,8,28,4.5,7,'#3f6f7f',1.4,-0.5); E(c,40,28,4.5,7,'#3f6f7f',1.4,0.5);
  // head
  E(c,24,12,10.5,8.5,'#3f6f7f',1.4);
  E(c,24,15,8,5.5,'#efe0c0',1.1);
  // ears
  PG(c,[[15,7],[13,1],[20,4]],'#3f6f7f',1.2);
  PG(c,[[33,7],[35,1],[28,4]],'#3f6f7f',1.2);
  // sleeping face
  LN(c,19,12,22,12,1.4); LN(c,26,12,29,12,1.4);
  LN(c,22,17,26,17,1.2);
  PG(c,[[21,17],[22,19],[23,17]],'#fff',0.7);
  PG(c,[[25,17],[26,19],[27,17]],'#fff',0.7);
},
snorlax_back(c){
  E(c,24,30,17,15,'#3f6f7f',1.5);
  E(c,24,11,10.5,8.5,'#3f6f7f',1.4);
  PG(c,[[15,6],[13,0],[20,3]],'#3f6f7f',1.2);
  PG(c,[[33,6],[35,0],[28,3]],'#3f6f7f',1.2);
  E(c,18,26,6,5,'rgba(255,255,255,0.12)',0);
  E(c,8,30,4.5,7,'#3f6f7f',1.4,-0.5); E(c,40,30,4.5,7,'#3f6f7f',1.4,0.5);
},

jolteon(c){
  // spiky rear/tail
  PG(c,[[33,26],[45,18],[40,27],[46,30],[37,33]],'#f8d030',1.2);
  PG(c,[[30,24],[36,15],[36,24]],'#f8d030',1.2);
  // body
  E(c,27,31,10.5,8,'#f8d030',1.4);
  // hind leg
  E(c,32,34,4.5,5.5,'#f8d030',1.3);
  LN(c,33,38,34,45,4,OUTC); LN(c,33,38,34,45,2.4,'#f8d030');
  // front legs
  LN(c,20,36,19,45,4,OUTC); LN(c,20,36,19,45,2.4,'#f8d030');
  LN(c,25,36,26,45,4,OUTC); LN(c,25,36,26,45,2.4,'#f8d030');
  // spiky white ruff collar
  SPIKES(c,18,26,3,11.5,0.35,2.9,5,'#f8f8f0',1.1);
  E(c,18,26,7,5.5,'#f8f8f0',1.1);
  // head
  CIR(c,16,15,6.8,'#f8d030',1.4);
  PG(c,[[13,9],[16,5],[19,9.5]],'#f8d030',1.1); // head tuft
  // big pointed ears
  PG(c,[[9,13],[3,2],[14,8.5]],'#f8d030',1.3);
  PG(c,[[8.5,9.5],[5.5,4],[12,8]],'#584870',0);
  PG(c,[[19,8],[25,-2],[25,10]],'#f8d030',1.3);
  PG(c,[[21.5,6],[24,1.5],[23.5,8]],'#584870',0);
  // face
  EYE(c,13,15,1.9,2.3,'#2e2440'); EYE(c,20,14.5,1.9,2.3,'#2e2440');
  CIR(c,10.5,18.5,1,'#2e2440',0);
  LN(c,12,20.5,14.5,21.2,1);
},
jolteon_back(c){
  // spiky mane silhouette
  SPIKES(c,24,28,10,19,-3,0.15,6,'#f8d030',1.2);
  E(c,24,30,11.5,10.5,'#f8d030',1.4);
  // white ruff peeking at shoulders
  SPIKES(c,24,21,6,12,-2.7,-0.4,3,'#f8f8f0',1.1);
  // head
  CIR(c,24,13,6.4,'#f8d030',1.4);
  // ears from behind
  PG(c,[[19,9],[13,-2],[23,5]],'#f8d030',1.3);
  PG(c,[[18,6],[15.5,1],[21,5.5]],'#584870',0);
  PG(c,[[29,9],[35,-2],[25,5]],'#f8d030',1.3);
  PG(c,[[30,6],[32.5,1],[27,5.5]],'#584870',0);
  // hind legs
  LN(c,17,39,16,46,3.6,OUTC); LN(c,17,39,16,46,2.2,'#f8d030');
  LN(c,31,39,32,46,3.6,OUTC); LN(c,31,39,32,46,2.2,'#f8d030');
},

spearow(c){
  // tail
  PG(c,[[30,34],[42,42],[36,44],[29,39]],'#8a5838',1.2);
  // body
  E(c,24,31,10,9.5,'#a85838',1.4);
  E(c,22,33,6.5,6.5,'#e8d0a8',1.1);
  // wing
  E(c,30,29,5,7.5,'#8a5838',1.3,0.3);
  // legs
  LN(c,20,40,19,45,1.8,'#e8a878'); LN(c,26,40,26,45,1.8,'#e8a878');
  LN(c,17,45,22,45,1.6,'#e8a878'); LN(c,24,45,29,45,1.6,'#e8a878');
  // head
  CIR(c,20,17,7,'#a85838',1.4);
  // messy crest
  PG(c,[[15,12],[13,7],[18,10]],'#7a3c28',1);
  PG(c,[[19,10],[19,5],[23,9]],'#7a3c28',1);
  PG(c,[[24,10],[27,6],[26,11]],'#7a3c28',1);
  // beak
  PG(c,[[14,16],[6,17],[8,20],[15,20]],'#e8a060',1.1);
  LN(c,7,18.4,14,18.2,0.9);
  // eye patch + eye
  E(c,20,16,3.4,3.2,'#3a3048',0.9);
  EYE(c,20,16,1.8,2,'#fff');
  CIR(c,20,16.4,0.9,'#2e2440',0);
},

fearow(c){
  // tail
  PG(c,[[30,36],[46,40],[41,45],[29,41]],'#8a5838',1.2);
  // body
  E(c,27,33,11,9.5,'#c8a878',1.4);
  // wing
  E(c,33,31,5.5,8.5,'#8a5838',1.3,0.3);
  // legs
  LN(c,23,42,22,47,2,'#e8a878'); LN(c,30,42,30,47,2,'#e8a878');
  // long neck
  c.beginPath(); c.moveTo(24,28); c.quadraticCurveTo(14,22,15,12);
  c.lineWidth=7.5; c.strokeStyle=OUTC; c.stroke();
  c.beginPath(); c.moveTo(24,28); c.quadraticCurveTo(14,22,15,12);
  c.lineWidth=5.5; c.strokeStyle='#c8a878'; c.stroke();
  // head
  CIR(c,15,10,5.8,'#c8a878',1.4);
  // coxcomb crest
  PG(c,[[11,6],[9,0],[14,4],[15,-1],[18,4],[21,1],[19,6]],'#e04838',1.2);
  // long hooked beak
  PG(c,[[10,9],[0,11],[3,13],[10,13]],'#e8a060',1.1);
  PG(c,[[0,11],[2,14.5],[4,13]],'#c87840',0.9);
  EYE(c,15,9,1.9,2.2,'#7a3020');
},

meowth(c){
  // tail curled
  c.beginPath(); c.moveTo(34,38); c.quadraticCurveTo(45,36,43,27);
  c.lineWidth=5.5; c.strokeStyle=OUTC; c.stroke();
  c.beginPath(); c.moveTo(34,38); c.quadraticCurveTo(45,36,43,27);
  c.lineWidth=3.8; c.strokeStyle='#f0e0b8'; c.stroke();
  CIR(c,43,26.5,2.6,'#8a6840',1.1);
  // body
  E(c,24,35,9.5,9,'#f0e0b8',1.4);
  // feet
  E(c,18,43,3.4,2.6,'#f0e0b8',1.2); E(c,30,43,3.4,2.6,'#f0e0b8',1.2);
  // head (big)
  E(c,24,17,11,9.5,'#f0e0b8',1.4);
  // ears
  PG(c,[[14,12],[10,2],[21,7]],'#f0e0b8',1.3);
  PG(c,[[34,12],[38,2],[27,7]],'#f0e0b8',1.3);
  PG(c,[[13.5,8.5],[11.5,4.5],[16.5,7]],'#6a4830',0);
  PG(c,[[34.5,8.5],[36.5,4.5],[31.5,7]],'#6a4830',0);
  // coin
  E(c,24,8,3.8,4.4,'#f8d048',1.3); LN(c,24,4.6,24,7.6,1.2,'#b08828');
  // whiskers
  LN(c,13,17,5,15,1); LN(c,13,20,5,20,1);
  LN(c,35,17,43,15,1); LN(c,35,20,43,20,1);
  // face
  EYE(c,20,16,2.2,2.8,'#2e2440'); EYE(c,28,16,2.2,2.8,'#2e2440');
  PG(c,[[23,20],[24,21.5],[25,20]],'#c87840',0.8);
  ARC(c,22,22.5,1.6,0.2,Math.PI-0.2,1); ARC(c,26,22.5,1.6,0.2,Math.PI-0.2,1);
},

psyduck(c){
  // hair strands
  LN(c,21,4,19,-1,1.1); LN(c,24,3.5,24,-2,1.1); LN(c,27,4,29,-1,1.1);
  // body
  E(c,24,32,11,11.5,'#f8d048',1.4);
  // feet
  E(c,17,44,4.5,2.8,'#f0c888',1.2); E(c,31,44,4.5,2.8,'#f0c888',1.2);
  // head
  CIR(c,24,15,10.5,'#f8d048',1.4);
  // arms up to head
  LN(c,13,26,10,17,4.6,OUTC); LN(c,13,26,10,17,3,'#f8d048');
  LN(c,35,26,38,17,4.6,OUTC); LN(c,35,26,38,17,3,'#f8d048');
  E(c,10,16,2.6,2.2,'#f8d048',1.1); E(c,38,16,2.6,2.2,'#f8d048',1.1);
  // bill
  E(c,24,21,7.5,3.8,'#f0e0c0',1.2);
  LN(c,17,20.6,31,20.6,1);
  CIR(c,21.5,19.4,0.7,'#2e2440',0); CIR(c,26.5,19.4,0.7,'#2e2440',0);
  // vacant eyes
  EYE(c,19,10.5,2.6,3,'#2e2440'); EYE(c,29,10.5,2.6,3,'#2e2440');
},

ponyta(c){
  // flame tail
  PG(c,[[34,30],[46,20],[43,30],[47,34],[38,36]],'#f89030',1.2);
  PG(c,[[35,30],[43,25],[42,32],[37,34]],'#e84820',0);
  // far legs
  LN(c,19,38,17,46,3.4,OUTC); LN(c,19,38,17,46,2,'#e0c8a0');
  LN(c,32,38,33,46,3.4,OUTC); LN(c,32,38,33,46,2,'#e0c8a0');
  // body
  E(c,26,33,10.5,7.5,'#f0dcb8',1.4);
  // near legs
  LN(c,22,38,21,47,3.6,OUTC); LN(c,22,38,21,47,2.2,'#f0dcb8');
  LN(c,34,38,36,47,3.6,OUTC); LN(c,34,38,36,47,2.2,'#f0dcb8');
  LN(c,20,46.4,22,46.4,2.4,'#5a5462'); LN(c,35,46.4,37,46.4,2.4,'#5a5462');
  // neck+head
  PG(c,[[19,32],[13,16],[20,15],[26,29]],'#f0dcb8',1.4);
  E(c,16,14,5.8,4.8,'#f0dcb8',1.4,-0.3);
  // muzzle
  E(c,10.5,16,3.6,2.8,'#f0dcb8',1.2,-0.2);
  CIR(c,9.5,15.5,0.7,'#2e2440',0);
  // ears
  PG(c,[[16,9],[15,4],[19,8]],'#f0dcb8',1.1);
  PG(c,[[20,9],[22,5],[23,10]],'#f0dcb8',1.1);
  // flame mane
  PG(c,[[19,7],[26,2],[25,10],[31,8],[28,15],[33,16],[27,21],[24,15],[21,12]],'#f89030',1.2);
  PG(c,[[22,8],[26,5],[25,11],[28,12],[25,17],[23,12]],'#e84820',0);
  EYE(c,15,13,1.8,2.2,'#4a3020');
},

geodude(c){
  // arms behind
  E(c,7,26,5.5,4.5,'#a8a098',1.4,-0.5); E(c,41,26,5.5,4.5,'#a8a098',1.4,0.5);
  LN(c,6,29,4,36,5.5,OUTC); LN(c,6,29,4,36,3.6,'#a8a098');
  LN(c,42,29,44,36,5.5,OUTC); LN(c,42,29,44,36,3.6,'#a8a098');
  CIR(c,4,38,3.6,'#a8a098',1.3); CIR(c,44,38,3.6,'#a8a098',1.3);
  LN(c,2,36.5,2,39.5,1); LN(c,46,36.5,46,39.5,1);
  // rock body
  PG(c,[[13,18],[22,14],[33,16],[40,24],[38,36],[28,42],[16,41],[9,32]],'#a8a098',1.5);
  // cracks / facets
  LN(c,15,22,20,27,1,'#7a7268'); LN(c,33,20,30,26,1,'#7a7268');
  LN(c,14,35,20,37,1,'#7a7268');
  // face
  LN(c,15,25,21,26.5,1.5); LN(c,33,25,27,26.5,1.5);
  EYE(c,19,29,2.4,2.6,'#2e2440'); EYE(c,29,29,2.4,2.6,'#2e2440');
  c.beginPath(); c.moveTo(18,35); c.quadraticCurveTo(24,38.5,30,35);
  c.lineWidth=1.4; c.strokeStyle=OUTC; c.stroke();
},

machop(c){
  // tail
  c.beginPath(); c.moveTo(33,36); c.quadraticCurveTo(43,38,42,31);
  c.lineWidth=6,c.strokeStyle=OUTC; c.stroke();
  c.beginPath(); c.moveTo(33,36); c.quadraticCurveTo(43,38,42,31);
  c.lineWidth=4.2; c.strokeStyle='#a0b0c0'; c.stroke();
  // legs
  E(c,18,42,5,5.5,'#a0b0c0',1.4); E(c,30,42,5,5.5,'#a0b0c0',1.4);
  // body (broad chest)
  E(c,24,30,11,11,'#a0b0c0',1.4);
  E(c,24,33,6.5,6.5,'#b8c8d8',0);
  ARC(c,24,29,5,0.5,Math.PI-0.5,1,'#78889a');
  // arms flexed
  LN(c,15,25,7,29,5.4,OUTC); LN(c,15,25,7,29,3.8,'#a0b0c0');
  LN(c,7,29,10,35,5.4,OUTC); LN(c,7,29,10,35,3.8,'#a0b0c0');
  LN(c,33,25,41,29,5.4,OUTC); LN(c,33,25,41,29,3.8,'#a0b0c0');
  LN(c,41,29,38,35,5.4,OUTC); LN(c,41,29,38,35,3.8,'#a0b0c0');
  CIR(c,10,36,3,'#a0b0c0',1.2); CIR(c,38,36,3,'#a0b0c0',1.2);
  // head with 3 ridges
  E(c,24,13,8,7.5,'#a0b0c0',1.4);
  PG(c,[[18,8],[15,2.5],[21.5,6]],'#a0b0c0',1.1);
  PG(c,[[22,6],[24,-0.5],[26,6]],'#a0b0c0',1.1);
  PG(c,[[26.5,6],[33,2.5],[30,8]],'#a0b0c0',1.1);
  // face
  EYE(c,20,13,2.2,2.6,'#802828'); EYE(c,28,13,2.2,2.6,'#802828');
  LN(c,17,10.5,21.5,11.5,1.2); LN(c,31,10.5,26.5,11.5,1.2);
  LN(c,20,18.5,28,18.5,1.3);
},

growlithe(c){
  // fluffy tail
  SPIKES(c,37,26,2,9,-2.2,-0.2,3,'#f8f0d8',1.1);
  // hind
  E(c,32,34,6.5,6,'#f89040',1.4);
  LN(c,34,38,35,45,3.4,OUTC); LN(c,34,38,35,45,2.2,'#f89040');
  // body
  E(c,25,32,9.5,8,'#f89040',1.4);
  // stripes
  PG(c,[[27,25],[30,24],[28,31],[26,30]],'#3a3048',0);
  PG(c,[[32,27],[35,27],[33,33],[31,32]],'#3a3048',0);
  // front legs
  LN(c,19,36,18,45,3.6,OUTC); LN(c,19,36,18,45,2.4,'#f89040');
  LN(c,24,36,24,45,3.6,OUTC); LN(c,24,36,24,45,2.4,'#f89040');
  // fluffy chest
  SPIKES(c,17,29,3,9,0.6,2.4,3,'#f8f0d8',1.1);
  E(c,17,29,5,5.5,'#f8f0d8',1.1);
  // head
  CIR(c,16,17,8,'#f89040',1.4);
  // head tuft
  SPIKES(c,16,11,2,9,-2.4,-0.8,3,'#f8f0d8',1.1);
  // ears
  PG(c,[[9,13],[5,5],[14,9]],'#f89040',1.2);
  PG(c,[[21,9],[25,2],[26,11]],'#f89040',1.2);
  // face
  EYE(c,13,17,2.1,2.5,'#4a3020'); EYE(c,20,16,2.1,2.5,'#4a3020');
  CIR(c,10.5,20.5,1.1,'#2e2440',0);
  ARC(c,13,22.5,1.8,0.3,Math.PI-0.5,1);
  // stripe on head
  PG(c,[[18,7],[21,7],[20,12],[18,12]],'#3a3048',0);
},

raticate(c){
  // tail
  c.beginPath(); c.moveTo(36,38); c.quadraticCurveTo(48,34,44,24);
  c.lineWidth=3.6; c.strokeStyle=OUTC; c.stroke();
  c.beginPath(); c.moveTo(36,38); c.quadraticCurveTo(48,34,44,24);
  c.lineWidth=2.2; c.strokeStyle='#d8b090'; c.stroke();
  // body
  E(c,24,30,13,12,'#a87050',1.4);
  E(c,22,34,8.5,7.5,'#e8d0b0',1.1);
  // cheek fluff
  PG(c,[[12,24],[6,26],[12,29]],'#a87050',1.1);
  PG(c,[[36,24],[42,26],[36,29]],'#a87050',1.1);
  // rounded ears at sides of head
  E(c,14,14,4.6,5,'#a87050',1.3,-0.35); E(c,14.5,14.5,2.5,3,'#c89078',0,-0.35);
  E(c,34,14,4.6,5,'#a87050',1.3,0.35);  E(c,33.5,14.5,2.5,3,'#c89078',0,0.35);
  // head area (merged with body) - face
  EYE(c,18,21,2.6,3,'#7a3020'); EYE(c,30,21,2.6,3,'#7a3020');
  LN(c,14,18,17.5,19.5,1.3); LN(c,34,18,30.5,19.5,1.3);
  // whiskers
  LN(c,12,25,3,22,1.1); LN(c,12,27,3,27,1.1);
  LN(c,36,25,45,22,1.1); LN(c,36,27,45,27,1.1);
  // nose + incisors
  PG(c,[[22,25],[24,27],[26,25]],'#7a3020',0.9);
  PG(c,[[21,28],[21,33],[24,30]],'#fff',1);
  PG(c,[[27,28],[27,33],[24,30]],'#fff',1);
  // feet
  E(c,15,42,4.5,3,'#e8d0b0',1.2); E(c,33,42,4.5,3,'#e8d0b0',1.2);
},

golbat(c){
  // wings
  PG(c,[[18,22],[2,10],[1,26],[10,26],[7,36],[17,30]],'#9068c8',1.3);
  PG(c,[[30,22],[46,10],[47,26],[38,26],[41,36],[31,30]],'#9068c8',1.3);
  PG(c,[[18,22],[6,13],[5,24],[16,27]],'#5878e0',0);
  PG(c,[[30,22],[42,13],[43,24],[32,27]],'#5878e0',0);
  // body
  E(c,24,26,10,12,'#5878e0',1.4);
  // giant mouth
  c.beginPath(); c.moveTo(15,22); c.quadraticCurveTo(24,18,33,22);
  c.quadraticCurveTo(33,34,24,36); c.quadraticCurveTo(15,34,15,22);
  c.closePath(); c.fillStyle='#583048'; c.fill(); c.lineWidth=1.3; c.strokeStyle=OUTC; c.stroke();
  // tongue
  E(c,24,33,3.4,3,'#e06888',1);
  // fangs
  PG(c,[[17,22],[19,28],[21,22]],'#fff',1);
  PG(c,[[27,22],[29,28],[31,22]],'#fff',1);
  PG(c,[[20,33],[21.5,29],[23,33]],'#fff',0.8);
  PG(c,[[25,33],[26.5,29],[28,33]],'#fff',0.8);
  // eyes
  LN(c,17,15,21,17,1.5); LN(c,31,15,27,17,1.5);
  // legs
  LN(c,20,38,18,44,1.8,'#5878e0'); LN(c,28,38,30,44,1.8,'#5878e0');
},

drowzee(c){
  // legs
  E(c,17,43,4.5,4.5,'#a8845a',1.4); E(c,31,43,4.5,4.5,'#a8845a',1.4);
  // body: yellow top, brown bottom (clear split)
  E(c,24,29,11,12,'#f0d048',1.4);
  c.save(); c.beginPath(); c.ellipse(24,29,11,12,0,0,Math.PI*2); c.clip();
  c.fillStyle='#a8845a'; c.fillRect(8,30,32,20);
  c.beginPath(); c.moveTo(13,32); c.quadraticCurveTo(18,28,24,31);
  c.quadraticCurveTo(30,34,35,30); c.lineTo(35,42); c.lineTo(13,42); c.closePath(); c.fill();
  c.restore();
  E(c,24,29,11,12,'rgba(0,0,0,0)',1.4);
  // arms raised (hypnosis pose)
  LN(c,15,24,6,17,4.8,OUTC); LN(c,15,24,6,17,3.4,'#f0d048');
  LN(c,33,24,42,17,4.8,OUTC); LN(c,33,24,42,17,3.4,'#f0d048');
  E(c,5.5,15,3,2.6,'#f0d048',1.1); E(c,42.5,15,3,2.6,'#f0d048',1.1);
  // head
  E(c,24,11,9,7.5,'#f0d048',1.4);
  // ears
  PG(c,[[16,6],[13,1],[20,4]],'#f0d048',1.1);
  PG(c,[[32,6],[35,1],[28,4]],'#f0d048',1.1);
  // trunk snout
  c.beginPath(); c.moveTo(19,12); c.quadraticCurveTo(24,13,25,22);
  c.lineWidth=6.4; c.strokeStyle=OUTC; c.lineCap='round'; c.stroke();
  c.beginPath(); c.moveTo(19,12); c.quadraticCurveTo(24,13,25,21.6);
  c.lineWidth=4.6; c.strokeStyle='#f0d048'; c.stroke();
  // sleepy eyes
  LN(c,16.5,9,20,9.5,1.4); LN(c,31.5,9,28,9.5,1.4);
},

moltres(c){
  // flame wings (layered)
  PG(c,[[16,26],[1,10],[6,22],[0,20],[7,29],[2,30],[12,33]],'#e84820',1.2);
  PG(c,[[32,26],[47,10],[42,22],[48,20],[41,29],[46,30],[36,33]],'#e84820',1.2);
  PG(c,[[16,26],[5,14],[8,23],[4,23],[11,30],[14,31]],'#f89030',0);
  PG(c,[[32,26],[43,14],[40,23],[44,23],[37,30],[34,31]],'#f89030',0);
  PG(c,[[17,27],[10,19],[12,26],[15,30]],'#f8d048',0);
  PG(c,[[31,27],[38,19],[36,26],[33,30]],'#f8d048',0);
  // flame tail
  PG(c,[[22,38],[16,47],[22,44],[22,48],[27,43],[30,47],[28,38]],'#f89030',1.2);
  PG(c,[[23,39],[20,45],[24,42],[26,45],[26,39]],'#f8d048',0);
  // body
  E(c,24,31,8.5,9,'#f8a030',1.4);
  // legs
  LN(c,21,38,20,44,2,'#c87840'); LN(c,27,38,28,44,2,'#c87840');
  // neck
  c.beginPath(); c.moveTo(24,26); c.quadraticCurveTo(22,16,24,10);
  c.lineWidth=7; c.strokeStyle=OUTC; c.stroke();
  c.beginPath(); c.moveTo(24,26); c.quadraticCurveTo(22,16,24,10);
  c.lineWidth=5.2; c.strokeStyle='#f8a030'; c.stroke();
  // head
  CIR(c,24,8,5.4,'#f8a030',1.4);
  // flame crest
  PG(c,[[20,4],[15,-2],[21,1],[22,-3],[25,1],[29,-2],[27,4]],'#e84820',1.1);
  PG(c,[[22,3],[21,0],[24,2],[26,0],[25,3]],'#f8d048',0);
  // beak
  PG(c,[[19,8],[12,9.5],[19,11.5]],'#c8a060',1.1);
  EYE(c,24,7.5,1.9,2.2,'#7a2018');
},
};

SPR.mon = function(id, side){
  const key = 'mon:'+id+':'+side;
  if(this._c[key]) return this._c[key];
  const c = cv(48,48), x = cx2(c);
  x.lineJoin='round';
  const fn = (side==='back' && MON_ART[id+'_back']) ? MON_ART[id+'_back'] : MON_ART[id];
  if(fn) fn(x);
  this._c[key] = c;
  return c;
};
SPR.monIcon = function(id){
  const key='icon:'+id;
  if(this._c[key]) return this._c[key];
  const c = cv(20,20), x = cx2(c);
  x.drawImage(SPR.mon(id,'front'), 0,0,48,48, 0,0,20,20);
  this._c[key]=c;
  return c;
};

// ============================================================
// TRAINER BATTLE SPRITES (48x56)
// ============================================================
function drawTrainerBase(c,o){
  // legs
  LN(c,20,40,19,52,5.2,OUTC); LN(c,20,40,19,52,3.6,o.pants);
  LN(c,28,40,29,52,5.2,OUTC); LN(c,28,40,29,52,3.6,o.pants);
  E(c,18,53.5,3.6,2.2,'#4a4048',1); E(c,30,53.5,3.6,2.2,'#4a4048',1);
  // torso
  PG(c,[[16,24],[32,24],[34,42],[14,42]],o.shirt,1.4);
  // arms
  LN(c,16,26,11,38,4.6,OUTC); LN(c,16,26,11,38,3.2,o.shirt);
  LN(c,32,26,37,38,4.6,OUTC); LN(c,32,26,37,38,3.2,o.shirt);
  CIR(c,11,39.5,2.2,o.skin,1); CIR(c,37,39.5,2.2,o.skin,1);
  // head
  CIR(c,24,15,8,o.skin,1.4);
  // eyes+mouth
  CIR(c,21,16,1.1,'#2e2440',0); CIR(c,27,16,1.1,'#2e2440',0);
  LN(c,22.5,20,25.5,20,1);
}
const TRAINER_ART = {
  camper(c){
    drawTrainerBase(c,{skin:'#f0c8a0',shirt:'#e05038',pants:'#3868b0'});
    E(c,24,10,8.4,5,'#48a048',1.3);          // cap
    PG(c,[[16,10],[8,12],[16,13]],'#48a048',1.1); // brim
    LN(c,17,22,17,13,2,'#6a4428'); LN(c,31,22,31,13,2,'#6a4428'); // hair sides
    PG(c,[[15,26],[20,26],[18,40],[14,38]],'#f8d048',1);   // backpack strap
  },
  hiker(c){
    drawTrainerBase(c,{skin:'#e8b088',shirt:'#68a058',pants:'#7a6448'});
    E(c,24,9,7,4,'#c8b8a0',1.2);            // bald-ish head top
    E(c,24,21,6,3,'#6a5438',1.1);           // beard
    LN(c,18,12,22,13,1.4); LN(c,30,12,26,13,1.4); // bushy brows
    PG(c,[[33,24],[41,26],[40,40],[33,38]],'#b0885a',1.2); // backpack
    LN(c,9,28,7,48,2.6,'#8a6840');          // walking stick
  },
  lass(c){
    // hair behind
    E(c,24,16,10.5,10,'#f0d060',1.3);
    LN(c,15,18,13,30,4,'#f0d060'); LN(c,33,18,35,30,4,'#f0d060');
    drawTrainerBase(c,{skin:'#f8d0b0',shirt:'#f8f8f8',pants:'#f8d0b0'});
    PG(c,[[15,38],[33,38],[36,46],[12,46]],'#4878d0',1.3); // skirt
    E(c,24,10,8,4.5,'#f0d060',1.2);          // fringe
    LN(c,18,49,18,52,2.6,'#f8f8f8'); LN(c,30,49,30,52,2.6,'#f8f8f8'); // socks
  },
  grunt(c){
    drawTrainerBase(c,{skin:'#e8c0a0',shirt:'#38343c',pants:'#38343c'});
    E(c,24,9.5,8.2,4.6,'#38343c',1.3);       // cap
    PG(c,[[16,10],[9,12],[16,13]],'#38343c',1.1);
    c.fillStyle='#e03028'; c.font='bold 11px monospace';
    c.fillText('R',21,36);
    LN(c,14,45,34,45,2.4,'#c8c8d0');         // belt
  },
};
SPR.trainer = function(id){
  const key='tr:'+id;
  if(this._c[key]) return this._c[key];
  const c = cv(48,56), x = cx2(c);
  x.lineJoin='round';
  if(TRAINER_ART[id]) TRAINER_ART[id](x);
  this._c[key]=c;
  return c;
};

// ============================================================
// OVERWORLD CHARACTERS (16x20, pixel style)
// pal: {skin, hair, shirt, pants, hat, skirt}
// dir: 0 down / 1 up / 2 left / 3 right ; frame: 0 stand, 1/2 walk
// ============================================================
const CHAR_PALS = {
  hero:  { skin:'#f8c8a0', hair:'#4a3020', shirt:'#e03028', pants:'#3858a8', hat:'#e03028', hatFront:'#f8f8f8' },
  bill:  { skin:'#f8c8a0', hair:'#8a5a30', shirt:'#88b858', pants:'#6a5438' },
  celio: { skin:'#f0c8a0', hair:'#385848', shirt:'#3898a0', pants:'#4a4a58', glasses:true },
  nurse: { skin:'#f8d0b0', hair:'#f088a8', shirt:'#f8f8f8', pants:'#f8b8c8', skirt:true, hat:'#f8f8f8' },
  oldman:{ skin:'#e8b890', hair:'#c8c8c8', shirt:'#8a6a48', pants:'#5a5462' },
  oldwoman:{ skin:'#e8b890', hair:'#c8c8d0', shirt:'#9868a8', pants:'#7858a0', skirt:true },
  boy:   { skin:'#f8c8a0', hair:'#3a3048', shirt:'#f89030', pants:'#38784a' },
  girl:  { skin:'#f8d0b0', hair:'#8a5a30', shirt:'#f8d048', pants:'#e05048', skirt:true },
  hiker: { skin:'#e8b088', hair:'#6a5438', shirt:'#68a058', pants:'#7a6448' },
  camper:{ skin:'#f0c8a0', hair:'#6a4428', shirt:'#e05038', pants:'#3868b0', hat:'#48a048', hatFront:'#48a048' },
  lass:  { skin:'#f8d0b0', hair:'#f0d060', shirt:'#f8f8f8', pants:'#4878d0', skirt:true },
  grunt: { skin:'#e8c0a0', hair:'#38343c', shirt:'#38343c', pants:'#38343c', hat:'#38343c', hatFront:'#e03028' },
  fisher:{ skin:'#e8b088', hair:'#4a3020', shirt:'#3878a8', pants:'#8a6840', hat:'#e8e0c8', hatFront:'#e8e0c8' },
};

function drawHumanOW(x, pal, dir, frame){
  const R=(px,py,w,h,col)=>{ x.fillStyle=col; x.fillRect(px,py,w,h); };
  const OUT='#2e2440';
  const legL = frame===1, legR = frame===2;
  // === legs (y14..19) ===
  const legC = pal.pants;
  if(pal.skirt){
    R(4,13,8,4,legC);          // skirt
    R(3,13,10,1,legC);
    R(5,17, 2, legL?1:2, pal.skin); R(9,17, 2, legR?1:2, pal.skin); // legs
    R(5,19-(legL?1:0),2,1,OUT); R(9,19-(legR?1:0),2,1,OUT);         // shoes
  } else {
    R(5,13, 2, legL?5:6, legC); R(9,13, 2, legR?5:6, legC);
    R(5,19-(legL?1:0),2,1,OUT); R(9,19-(legR?1:0),2,1,OUT);
  }
  // === torso (y8..13) ===
  R(4,8,8,5,pal.shirt);
  // arms
  const armY = (frame===0)?9:8;
  R(3,armY,1,4,pal.shirt); R(12,armY,1,4,pal.shirt);
  R(3,armY+4,1,1,pal.skin); R(12,armY+4,1,1,pal.skin);
  // === head (y0..8) ===
  if(dir===1){ // facing up: back of head
    R(4,1,8,7,pal.hair);
    if(pal.hat){ R(3,0,10,3,pal.hat); R(3,3,10,1,pal.hat); }
  } else if(dir===0){ // down
    R(4,1,8,3,pal.hair);
    R(4,4,8,4,pal.skin);
    R(4,4,1,2,pal.hair); R(11,4,1,2,pal.hair);
    R(5,5,1,2,'#2e2440'); R(10,5,1,2,'#2e2440'); // eyes
    if(pal.glasses){ R(5,5,2,1,'#303048'); R(9,5,2,1,'#303048'); R(7,5,2,1,'#303048'); }
    if(pal.hat){ R(3,0,10,3,pal.hat); R(4,3,8,1,pal.hatFront||pal.hat); }
    else R(3,0,10,2,pal.hair);
  } else { // side (draw facing left; right is mirrored by caller)
    R(4,1,8,3,pal.hair); R(9,4,3,4,pal.hair);
    R(4,4,5,4,pal.skin);
    R(5,5,1,2,'#2e2440');
    if(pal.glasses) R(4,5,3,1,'#303048');
    if(pal.hat){ R(3,0,10,3,pal.hat); R(1,2,5,1,pal.hat); }
    else R(3,0,10,2,pal.hair);
  }
  // outline-ish shadow under feet omitted (engine draws shadow)
}
SPR.char = function(name, dir, frame){
  const key='ch:'+name+':'+dir+':'+frame;
  if(this._c[key]) return this._c[key];
  const c = cv(16,20), x = cx2(c);
  const pal = CHAR_PALS[name] || CHAR_PALS.boy;
  if(dir===3){ // mirror of left
    x.translate(16,0); x.scale(-1,1);
    drawHumanOW(x, pal, 2, frame);
  } else {
    drawHumanOW(x, pal, dir, frame);
  }
  this._c[key]=c;
  return c;
};
// small overworld moltres (perched)
SPR.moltresOW = function(frame){
  const key='mow:'+frame;
  if(this._c[key]) return this._c[key];
  const c = cv(16,20), x = cx2(c);
  const b = frame? 1:0;
  x.lineJoin='round';
  PG(x,[[3,9-b],[0,4],[4,7]],'#e84820',0.8);   // wing L
  PG(x,[[13,9-b],[16,4],[12,7]],'#e84820',0.8);// wing R
  E(x,8,12,4.5,5,'#f8a030',1);                 // body
  PG(x,[[6,17],[8,20],[10,17]],'#e84820',0.8); // tail flame
  CIR(x,8,5,3,'#f8a030',1);                    // head
  PG(x,[[6,2],[5,-1+b],[8,1],[10,-1+b],[10,3]],'#e84820',0.7); // crest
  PG(x,[[5,5],[2,6],[5,7]],'#c8a060',0.7);     // beak
  x.fillStyle='#2e2440'; x.fillRect(6,4,1,2);
  this._c[key]=c;
  return c;
};
SPR.sign = function(){
  const key='sign'; if(this._c[key]) return this._c[key];
  const c=cv(16,16), x=cx2(c);
  x.fillStyle='#8a6840'; x.fillRect(7,8,2,7);
  x.fillStyle='#b08850'; x.fillRect(2,2,12,7);
  x.strokeStyle='#5a3c20'; x.lineWidth=1; x.strokeRect(2.5,2.5,11,6);
  x.fillStyle='#5a3c20'; x.fillRect(4,4,8,1); x.fillRect(4,6,6,1);
  this._c[key]=c; return c;
};
SPR.pokeball = function(open){
  const key='ball:'+(open?1:0); if(this._c[key]) return this._c[key];
  const c=cv(12,12), x=cx2(c);
  CIR(x,6,6,5,'#f8f8f8',1.2);
  x.save(); x.beginPath(); x.arc(6,6,5,Math.PI,0); x.clip();
  x.fillStyle= open?'#f8d048':'#e03028'; x.fillRect(0,0,12,6); x.restore();
  LN(x,1,6,11,6,1.2,OUTC);
  CIR(x,6,6,1.8,'#f8f8f8',1.2);
  this._c[key]=c; return c;
};
SPR.ruby = function(){
  const key='ruby'; if(this._c[key]) return this._c[key];
  const c=cv(16,16), x=cx2(c);
  PG(x,[[8,1],[14,6],[8,15],[2,6]],'#e82848',1.2);
  PG(x,[[8,1],[11,6],[8,10],[5,6]],'#ff7088',0);
  this._c[key]=c; return c;
};

// ============================================================
// TILES (16x16) — SPR.tile(char, frame)
// ============================================================
function speckle(x, col, seed, n){
  let s = seed;
  const rnd = ()=>{ s = (s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; };
  x.fillStyle = col;
  for(let i=0;i<n;i++){ x.fillRect((rnd()*15)|0,(rnd()*15)|0,1,1); }
}
const TILE_ART = {
  '.'(x){ x.fillStyle='#8cd062'; x.fillRect(0,0,16,16); speckle(x,'#7ab84e',7,14); speckle(x,'#9ede74',3,6); },
  ','(x){ TILE_ART['.'](x); x.fillStyle='#6aa844'; x.fillRect(3,5,2,1); x.fillRect(10,9,2,1); x.fillRect(6,12,2,1); },
  'f'(x,f){ TILE_ART['.'](x);
    const sway=f?1:0;
    for(const [fx,fy] of [[3,3],[10,8]]){
      x.fillStyle='#e83030'; x.fillRect(fx+sway,fy,3,3);
      x.fillStyle='#f8e858'; x.fillRect(fx+1+sway,fy+1,1,1);
      x.fillStyle='#48903c'; x.fillRect(fx+1,fy+3,1,2);
    } },
  'G'(x){ x.fillStyle='#7ab84e'; x.fillRect(0,0,16,16); speckle(x,'#6aa844',5,10);
    x.fillStyle='#3e8c40';
    for(let i=0;i<4;i++){ const gx=1+i*4;
      x.fillRect(gx,6,1,8); x.fillRect(gx+1,4,1,10); x.fillRect(gx+2,7,1,7); }
    x.fillStyle='#2e6c34';
    for(let i=0;i<4;i++){ x.fillRect(2+i*4,10,1,4); } },
  'A'(x){ x.fillStyle='#c89870'; x.fillRect(0,0,16,16); speckle(x,'#b0805c',9,12);
    x.fillStyle='#8a5838';
    for(let i=0;i<4;i++){ const gx=1+i*4;
      x.fillRect(gx,6,1,8); x.fillRect(gx+1,4,1,10); x.fillRect(gx+2,7,1,7); }
    x.fillStyle='#6a3c28';
    for(let i=0;i<4;i++){ x.fillRect(2+i*4,10,1,4); } },
  'p'(x){ x.fillStyle='#e0c890'; x.fillRect(0,0,16,16); speckle(x,'#d0b478',11,12); speckle(x,'#eedcaa',4,6); },
  's'(x){ x.fillStyle='#f0e0a8'; x.fillRect(0,0,16,16); speckle(x,'#e0cc8c',13,14); speckle(x,'#f8ecc0',6,6); },
  'w'(x,f){ x.fillStyle='#4890e0'; x.fillRect(0,0,16,16);
    speckle(x,'#3f82cf',f+1,8);
    x.fillStyle='#8cc8f8';
    const o=[0,2,4,2][f%4];
    x.fillRect(1+o,3,5,1); x.fillRect(9+((o+2)%4),8,5,1); x.fillRect(2+((o+3)%4),13,4,1);
  },
  'T'(x){ x.fillStyle='#8cd062'; x.fillRect(0,0,16,16);
    x.fillStyle='#5a3c20'; x.fillRect(6,12,4,4);
    x.fillStyle='#2e6c34'; x.beginPath(); x.arc(8,9,7.4,0,7); x.fill();
    x.fillStyle='#48a048'; x.beginPath(); x.arc(8,7,6.4,0,7); x.fill();
    x.fillStyle='#70c860'; x.beginPath(); x.arc(6,5,3.4,0,7); x.arc(11,6,2.6,0,7); x.fill();
  },
  'M'(x){ // cliff face
    x.fillStyle='#b06a40'; x.fillRect(0,0,16,16);
    x.fillStyle='#c8845a'; x.fillRect(0,0,16,4);
    x.fillStyle='#e0a070'; x.fillRect(0,0,16,1);
    x.fillStyle='#8a4a2c'; x.fillRect(0,4,16,1); x.fillRect(0,13,16,3);
    x.fillStyle='#6a3820'; x.fillRect(0,15,16,1);
    x.fillStyle='#8a4a2c'; x.fillRect(3,5,1,6); x.fillRect(11,7,1,6); x.fillRect(7,5,1,4);
    x.fillStyle='#d89868'; x.fillRect(4,6,2,1); x.fillRect(12,8,2,1); x.fillRect(8,10,2,1);
  },
  'm'(x){ x.fillStyle='#d8a878'; x.fillRect(0,0,16,16); speckle(x,'#c89466',17,12); speckle(x,'#e8bc90',8,7); },
  'r'(x){ // boulder overlay (transparent bg; ground drawn underneath by engine)
    x.fillStyle='#8a8078'; x.beginPath(); x.arc(8,9,6,0,7); x.fill();
    x.fillStyle='#a8a098'; x.beginPath(); x.arc(7,7,4.4,0,7); x.fill();
    x.fillStyle='#c8c0b8'; x.fillRect(5,5,3,2);
    x.strokeStyle='#5a5048'; x.lineWidth=1; x.beginPath(); x.arc(8,9,6,0,7); x.stroke();
  },
  'C'(x){ // cave wall
    x.fillStyle='#584038'; x.fillRect(0,0,16,16);
    x.fillStyle='#6a5044'; x.fillRect(0,0,16,4);
    x.fillStyle='#7e6052'; x.fillRect(0,0,16,1);
    x.fillStyle='#3e2c26'; x.fillRect(0,4,16,1); x.fillRect(0,13,16,3);
    x.fillStyle='#2c1e1a'; x.fillRect(0,15,16,1);
    x.fillStyle='#3e2c26'; x.fillRect(4,5,1,6); x.fillRect(11,6,1,7);
    x.fillStyle='#6a5044'; x.fillRect(5,7,2,1); x.fillRect(12,9,2,1);
  },
  'c'(x){ x.fillStyle='#786058'; x.fillRect(0,0,16,16); speckle(x,'#685048',21,12); speckle(x,'#887068',10,8); },
  'F'(x){ x.fillStyle='#e8d0a8'; x.fillRect(0,0,16,16);
    x.fillStyle='#d8bc90'; x.fillRect(0,7,16,1); x.fillRect(0,15,16,1);
    x.fillRect(7,0,1,7); x.fillRect(12,8,1,7);
  },
  'W'(x){ x.fillStyle='#f0e8d8'; x.fillRect(0,0,16,16);
    x.fillStyle='#d8c8b0'; x.fillRect(0,12,16,4);
    x.fillStyle='#c8b898'; x.fillRect(0,11,16,1);
    x.fillStyle='#e0d4c0'; x.fillRect(2,2,3,6); x.fillRect(10,2,3,6);
  },
  'K'(x){ x.fillStyle='#f8f8f8'; x.fillRect(0,0,16,6);
    x.fillStyle='#d8d8d8'; x.fillRect(0,5,16,1);
    x.fillStyle='#e05048'; x.fillRect(0,6,16,10);
    x.fillStyle='#c03830'; x.fillRect(0,6,16,1); x.fillRect(0,14,16,2);
  },
  'k'(x){ TILE_ART['F'](x); x.fillStyle='#88b8e8'; x.fillRect(1,1,14,14);
    x.fillStyle='#6898d0'; x.fillRect(1,1,14,2); x.fillRect(1,13,14,2); },
  'P'(x){ x.fillStyle='#c89058'; x.fillRect(0,0,16,16);
    x.fillStyle='#a87848'; x.fillRect(0,3,16,1); x.fillRect(0,8,16,1); x.fillRect(0,13,16,1);
    x.fillStyle='#e0a868'; x.fillRect(0,0,16,1); x.fillRect(0,4,16,1); x.fillRect(0,9,16,1);
    speckle(x,'#8a6238',31,5);
  },
  'B'(x){ TILE_ART['.'](x); }, // under stamps
  'D'(x){ TILE_ART['p'](x); }, // door tile base
};
SPR.tile = function(ch, frame){
  frame = frame||0;
  const key='t:'+ch+':'+frame;
  if(this._c[key]) return this._c[key];
  const c = cv(16,16), x = cx2(c);
  const fn = TILE_ART[ch] || TILE_ART['.'];
  fn(x, frame);
  this._c[key]=c;
  return c;
};

// ============================================================
// STAMPS (buildings & props, drawn over ground)
// ============================================================
const STAMP_ART = {
  pokecenter:{ w:96, h:80, draw(x){
    // roof
    x.fillStyle='#f07830';
    x.beginPath(); x.moveTo(2,34); x.quadraticCurveTo(48,-8,94,34); x.lineTo(94,42); x.lineTo(2,42); x.fill();
    x.fillStyle='#d05820';
    x.beginPath(); x.moveTo(2,34); x.quadraticCurveTo(48,-8,94,34); x.lineTo(94,38); x.lineTo(2,38); x.fill();
    x.strokeStyle='#903810'; x.lineWidth=2;
    x.beginPath(); x.moveTo(2,34); x.quadraticCurveTo(48,-8,94,34); x.stroke();
    // walls
    x.fillStyle='#f0e8e0'; x.fillRect(4,42,88,38);
    x.fillStyle='#d0c8c0'; x.fillRect(4,42,88,3);
    x.strokeStyle='#8a8078'; x.lineWidth=1; x.strokeRect(4.5,42.5,87,37);
    // windows
    x.fillStyle='#78b8e8'; x.fillRect(12,50,16,14); x.fillRect(68,50,16,14);
    x.strokeStyle='#5878a0'; x.strokeRect(12.5,50.5,15,13); x.strokeRect(68.5,50.5,15,13);
    x.fillStyle='#a8d8f8'; x.fillRect(13,51,6,5); x.fillRect(69,51,6,5);
    // door (2 tiles wide, centered on tiles 2-3)
    x.fillStyle='#c03028'; x.fillRect(36,52,24,28);
    x.fillStyle='#78b8e8'; x.fillRect(38,54,9,22); x.fillRect(49,54,9,22);
    x.fillStyle='#a8d8f8'; x.fillRect(39,55,4,9); x.fillRect(50,55,4,9);
    // P emblem on roof
    x.fillStyle='#f8f8f8'; x.beginPath(); x.arc(48,22,9,0,7); x.fill();
    x.strokeStyle='#903810'; x.lineWidth=1.6; x.beginPath(); x.arc(48,22,9,0,7); x.stroke();
    x.fillStyle='#e03028'; x.font='bold 13px sans-serif'; x.textAlign='center';
    x.fillText('P',48,27); x.textAlign='left';
  }},
  house:{ w:80, h:64, draw(x){
    // roof
    x.fillStyle='#7890c8';
    x.beginPath(); x.moveTo(0,26); x.lineTo(14,4); x.lineTo(66,4); x.lineTo(80,26); x.lineTo(80,32); x.lineTo(0,32); x.fill();
    x.fillStyle='#5870a8'; x.fillRect(0,26,80,6);
    x.strokeStyle='#38466a'; x.lineWidth=1.6;
    x.beginPath(); x.moveTo(0,26); x.lineTo(14,4); x.lineTo(66,4); x.lineTo(80,26); x.stroke();
    // walls
    x.fillStyle='#f0e0c8'; x.fillRect(4,32,72,32);
    x.strokeStyle='#8a7458'; x.lineWidth=1; x.strokeRect(4.5,32.5,71,31);
    // window
    x.fillStyle='#78b8e8'; x.fillRect(52,38,16,13);
    x.strokeStyle='#5878a0'; x.strokeRect(52.5,38.5,15,12);
    x.fillStyle='#a8d8f8'; x.fillRect(53,39,6,5);
    // door on tile 1 (x16..31)
    x.fillStyle='#8a5a30'; x.fillRect(18,40,13,24);
    x.strokeStyle='#5a3c20'; x.strokeRect(18.5,40.5,12,23);
    x.fillStyle='#f8d048'; x.fillRect(27,52,2,2);
  }},
  boat:{ w:64, h:44, draw(x){
    x.fillStyle='#f0f0f0';
    x.beginPath(); x.moveTo(2,22); x.lineTo(62,22); x.lineTo(54,40); x.lineTo(10,40); x.closePath(); x.fill();
    x.strokeStyle='#586878'; x.lineWidth=1.4;
    x.beginPath(); x.moveTo(2,22); x.lineTo(62,22); x.lineTo(54,40); x.lineTo(10,40); x.closePath(); x.stroke();
    x.fillStyle='#3868b0'; x.fillRect(6,26,52,4);
    x.fillStyle='#e8e8e8'; x.fillRect(16,8,32,14);
    x.strokeStyle='#586878'; x.strokeRect(16.5,8.5,31,13);
    x.fillStyle='#78b8e8'; x.fillRect(19,11,6,6); x.fillRect(29,11,6,6); x.fillRect(39,11,6,6);
    x.fillStyle='#c03028'; x.fillRect(30,2,4,6);
  }},
  machine:{ w:32, h:32, draw(x){
    x.fillStyle='#8890a0'; x.fillRect(2,2,28,30);
    x.strokeStyle='#4a5262'; x.lineWidth=1.4; x.strokeRect(2.5,2.5,27,29);
    x.fillStyle='#182838'; x.fillRect(5,5,22,12);
    x.fillStyle='#38e858'; x.fillRect(7,7,8,2); x.fillRect(7,11,12,2);
    x.fillStyle='#e8b038'; x.fillRect(6,21,4,4);
    x.fillStyle='#e03028'; x.fillRect(12,21,4,4);
    x.fillStyle='#3878e8'; x.fillRect(18,21,4,4);
  }},
  pedestal:{ w:32, h:32, draw(x){
    x.fillStyle='#8a8078'; x.fillRect(8,18,16,12);
    x.fillStyle='#a8a098'; x.fillRect(6,14,20,6);
    x.strokeStyle='#4a4038'; x.lineWidth=1.2; x.strokeRect(6.5,14.5,19,5); x.strokeRect(8.5,19.5,15,10);
  }},
  plant:{ w:16, h:16, draw(x){
    x.fillStyle='#c86838'; x.fillRect(4,10,8,6);
    x.fillStyle='#a84c28'; x.fillRect(4,10,8,2);
    x.fillStyle='#38883c'; x.beginPath(); x.arc(8,7,5,0,7); x.fill();
    x.fillStyle='#58b858'; x.beginPath(); x.arc(6,5,3,0,7); x.fill();
  }},
};
SPR.stamp = function(name){
  const key='st:'+name;
  if(this._c[key]) return this._c[key];
  const def = STAMP_ART[name];
  const c = cv(def.w, def.h), x = cx2(c);
  x.lineJoin='round';
  def.draw(x);
  this._c[key]=c;
  return c;
};
