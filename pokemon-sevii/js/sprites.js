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

// ===================== KANTO ADDITIONS =====================
pidgey(c){
  PG(c,[[30,34],[41,38],[36,42],[29,39]],'#b08858',1.2);   // tail
  E(c,24,31,9.5,9,'#d8b888',1.4);                          // body
  E(c,22,33,6,6,'#f2e2c2',1.1);
  E(c,30,30,4.5,6.5,'#b08858',1.3,0.3);                    // wing
  LN(c,20,40,20,45,1.8,'#e8a878'); LN(c,27,40,27,45,1.8,'#e8a878');
  CIR(c,21,17,7,'#c8a068',1.4);                            // head
  PG(c,[[16,12],[13,7],[19,11]],'#a07840',1);              // crest tufts
  PG(c,[[22,11],[24,6],[26,12]],'#a07840',1);
  PG(c,[[15,16],[7,17],[15,19]],'#e8a860',1.1);            // beak
  E(c,20,16,3.2,3,'#e8d0a8',0.9);
  EYE(c,20,16,1.9,2.2,'#3a3048');
},
rattata(c){
  c.beginPath(); c.moveTo(34,36); c.quadraticCurveTo(46,34,44,26);
  c.lineWidth=2.6; c.strokeStyle=OUTC; c.stroke();
  c.beginPath(); c.moveTo(34,36); c.quadraticCurveTo(46,34,44,26);
  c.lineWidth=1.4; c.strokeStyle='#c8a0c0'; c.stroke();
  E(c,24,32,11,10,'#9868b0',1.4);                          // body
  E(c,22,35,7,6,'#e8d8c0',1.1);
  E(c,14,14,4.6,5,'#9868b0',1.3,-0.3); E(c,14.5,14.5,2.4,3,'#c890b0',0,-0.3);
  E(c,34,14,4.6,5,'#9868b0',1.3,0.3);  E(c,33.5,14.5,2.4,3,'#c890b0',0,0.3);
  EYE(c,19,22,2.2,2.6,'#7a3020'); EYE(c,30,22,2.2,2.6,'#7a3020');
  LN(c,12,26,4,24,1); LN(c,12,28,4,29,1);
  LN(c,36,26,44,24,1); LN(c,36,28,44,29,1);
  PG(c,[[22,26],[24,28],[26,26]],'#7a3020',0.9);
  PG(c,[[21,29],[21,33],[24,30]],'#fff',1); PG(c,[[27,29],[27,33],[24,30]],'#fff',1);
},
ekans(c){
  // coiled snake
  ARC(c,24,34,11,0,Math.PI*2,7,'#9060b0');
  ARC(c,24,34,11,0,Math.PI*2,9,OUTC); ARC(c,24,34,11,0,Math.PI*2,6.4,'#9060b0');
  E(c,24,33,7,5.5,'#c0a0d8',0);
  // rising head
  c.beginPath(); c.moveTo(24,28); c.quadraticCurveTo(20,18,26,12);
  c.lineWidth=8.5; c.strokeStyle=OUTC; c.stroke();
  c.beginPath(); c.moveTo(24,28); c.quadraticCurveTo(20,18,26,12);
  c.lineWidth=6.5; c.strokeStyle='#9060b0'; c.stroke();
  CIR(c,27,11,6,'#9060b0',1.4);
  PG(c,[[30,10],[36,9],[30,13]],'#d0b0e0',1);              // snout
  EYE(c,26,10,2,2.4,'#e0b020');
  LN(c,30,13,35,14,1.2,'#c02020');                         // tongue
  PG(c,[[35,14],[38,12.5],[38,15.5]],'#c02020',0);
},
sandshrew(c){
  E(c,24,32,12,11,'#e8c878',1.4);                          // body
  // back plates
  for(const [px,py,r] of [[18,24,3],[28,24,3],[23,20,3.4],[17,30,3],[31,30,3]]){
    E(c,px,py,r,r*0.8,'#c8a058',1);
  }
  E(c,22,35,7,6,'#f0e0b0',1.1);                            // belly
  E(c,12,40,4,3.4,'#e8c878',1.2); E(c,36,40,4,3.4,'#e8c878',1.2);
  E(c,10,30,3.6,5,'#e8c878',1.3,-0.4); E(c,38,30,3.6,5,'#e8c878',1.3,0.4);
  PG(c,[[8,31],[4,30],[8,33]],'#f0e8d8',0.9);              // claws
  PG(c,[[40,31],[44,30],[40,33]],'#f0e8d8',0.9);
  CIR(c,24,15,8,'#e8c878',1.4);                            // head
  PG(c,[[17,9],[15,4],[21,8]],'#e8c878',1.1);
  PG(c,[[31,9],[33,4],[27,8]],'#e8c878',1.1);
  EYE(c,20,15,2,2.4,'#3a3048'); EYE(c,28,15,2,2.4,'#3a3048');
  LN(c,20,20,28,20,1.2);
},
mankey(c){
  E(c,24,30,11,10,'#e8dcc0',1.4);                          // body/fur
  SPIKES(c,24,22,3,7,-2.5,-0.6,4,'#e8dcc0',1);             // head fur
  E(c,10,30,3.6,5.5,'#e8dcc0',1.3,-0.4); E(c,38,30,3.6,5.5,'#e8dcc0',1.3,0.4);
  E(c,16,42,4.5,4,'#c8a878',1.2); E(c,32,42,4.5,4,'#c8a878',1.2);
  CIR(c,24,16,8,'#e8dcc0',1.4);                            // pig-like face
  E(c,24,18,5,4,'#d8a878',1.1);                            // snout
  CIR(c,22,18,1,'#2e2440',0); CIR(c,26,18,1,'#2e2440',0);
  E(c,13,13,3,3.4,'#d0b090',1.1); E(c,35,13,3,3.4,'#d0b090',1.1); // ears
  PG(c,[[18,12],[20,15],[22,12]],'#3a3048',0);             // angry brows
  PG(c,[[26,12],[28,15],[30,12]],'#3a3048',0);
  EYE(c,20,15,1.7,2,'#3a3048'); EYE(c,28,15,1.7,2,'#3a3048');
},
oddish(c){
  E(c,24,34,9,7,'#4878c0',1.4);                            // blue bulb body
  E(c,21,35,5,4,'#78a8e0',0);
  LN(c,19,40,18,45,2.2,'#4878c0'); LN(c,29,40,30,45,2.2,'#4878c0');
  EYE(c,20,33,2.4,2.8,'#f8f8f0'); EYE(c,28,33,2.4,2.8,'#f8f8f0');
  CIR(c,20,33.5,0.9,'#2e2440',0); CIR(c,28,33.5,0.9,'#2e2440',0);
  E(c,24,32,4,1.4,'#3a3048',0);                            // mouth
  // leaves on head
  PG(c,[[24,26],[18,14],[22,25]],'#48a048',1.2);
  PG(c,[[24,26],[24,10],[27,25]],'#48a048',1.2);
  PG(c,[[24,26],[31,15],[27,26]],'#48a048',1.2);
  LN(c,20,20,22,25,0.8,'#2e6c34'); LN(c,24,13,24,25,0.8,'#2e6c34'); LN(c,29,18,27,25,0.8,'#2e6c34');
},
bellsprout(c){
  LN(c,24,40,24,28,3,'#c8b060'); LN(c,24,40,24,28,4.4,OUTC); LN(c,24,40,24,28,2.6,'#c8b060'); // stem
  E(c,18,42,5,2.4,'#c8b060',1.2); E(c,30,42,5,2.4,'#c8b060',1.2); // feet
  PG(c,[[19,30],[10,26],[20,33]],'#78b048',1.1);           // leaf
  PG(c,[[29,30],[38,26],[28,33]],'#78b048',1.1);
  // bell head
  c.beginPath(); c.moveTo(16,18); c.quadraticCurveTo(24,4,32,18);
  c.quadraticCurveTo(30,26,24,26); c.quadraticCurveTo(18,26,16,18); c.closePath();
  c.fillStyle='#f0e048'; c.fill(); c.lineWidth=1.4; c.strokeStyle=OUTC; c.stroke();
  E(c,24,10,4,3.5,'#f8ec88',0);
  EYE(c,20,17,2,2.4,'#2e2440'); EYE(c,28,17,2,2.4,'#2e2440');
  E(c,24,22,3.5,1.6,'#c88030',0);
},
pikachu(c){
  // lightning tail
  PG(c,[[32,34],[42,30],[38,26],[46,22],[40,20],[44,14]],'#f8d030',1.2);
  PG(c,[[33,34],[40,30],[37,27],[42,24]],'#b87828',0);
  E(c,24,32,9,8.5,'#f8d030',1.4);                          // body
  E(c,17,40,3.6,3,'#f8d030',1.2); E(c,31,40,3.6,3,'#f8d030',1.2);
  E(c,13,31,3,4.5,'#f8d030',1.3,-0.4); E(c,35,31,3,4.5,'#f8d030',1.3,0.4);
  CIR(c,24,16,8,'#f8d030',1.4);                            // head
  PG(c,[[16,10],[11,-2],[19,8]],'#f8d030',1.3);            // ears
  PG(c,[[14,2],[11,-2],[17,4]],'#2e2440',0);
  PG(c,[[32,10],[37,-2],[29,8]],'#f8d030',1.3);
  PG(c,[[34,2],[37,-2],[31,4]],'#2e2440',0);
  CIR(c,17,20,2.4,'#e05028',0); CIR(c,31,20,2.4,'#e05028',0); // cheeks
  EYE(c,20,15,2.2,2.6,'#2e2440'); EYE(c,28,15,2.2,2.6,'#2e2440');
  CIR(c,24,18,1,'#2e2440',0);
  LN(c,22,20,26,20,1);
},
raichu(c){
  // long tail ending in lightning bolt
  c.beginPath(); c.moveTo(30,34); c.quadraticCurveTo(42,36,42,26);
  c.lineWidth=3; c.strokeStyle=OUTC; c.stroke();
  c.beginPath(); c.moveTo(30,34); c.quadraticCurveTo(42,36,42,26);
  c.lineWidth=1.8; c.strokeStyle='#c07830'; c.stroke();
  PG(c,[[42,26],[36,20],[41,20],[38,12],[47,22],[42,22]],'#f8d030',1.2);
  E(c,24,31,10,9.5,'#e0a038',1.4);                         // body (orange)
  E(c,22,33,6.5,7,'#e8d0a0',1.1);
  E(c,16,41,4,3.4,'#e0a038',1.2); E(c,32,41,4,3.4,'#e0a038',1.2);
  E(c,11,31,3.2,5,'#e0a038',1.3,-0.4); E(c,37,31,3.2,5,'#e0a038',1.3,0.4);
  CIR(c,24,15,8,'#e0a038',1.4);                            // head
  PG(c,[[16,9],[12,-2],[20,7]],'#e0a038',1.3); PG(c,[[14,1],[12,-2],[18,4]],'#2e2440',0);
  PG(c,[[32,9],[36,-2],[28,7]],'#e0a038',1.3); PG(c,[[34,1],[36,-2],[30,4]],'#2e2440',0);
  CIR(c,17,19,2.4,'#e8b020',1); CIR(c,31,19,2.4,'#e8b020',1);
  EYE(c,20,14,2.2,2.6,'#2e2440'); EYE(c,28,14,2.2,2.6,'#2e2440');
  LN(c,21,19,27,19,1);
},
voltorb(c){
  CIR(c,24,28,15,'#e83028',1.5);                           // ball
  c.save(); c.beginPath(); c.arc(24,28,15,0,Math.PI*2); c.clip();
  c.fillStyle='#f0f0f0'; c.fillRect(9,28,30,18);
  c.restore();
  LN(c,9,28,39,28,1.6,OUTC);
  E(c,18,20,4,3,'rgba(255,255,255,0.4)',0);                // shine
  EYE(c,18,26,2.6,2.8,'#f8f8f0'); EYE(c,30,26,2.6,2.8,'#f8f8f0');
  CIR(c,18,26.5,1.1,'#2e2440',0); CIR(c,30,26.5,1.1,'#2e2440',0);
  LN(c,20,31,28,31,1.4);
},
magnemite(c){
  CIR(c,24,24,8,'#c0c8d0',1.4);                            // core
  CIR(c,24,24,4.5,'#e0e8f0',0);
  EYE(c,24,23,3,3.4,'#f8f8f0'); CIR(c,24,23.5,1.4,'#2e2440',0);
  // screws/antenna
  LN(c,24,16,24,10,1.6,'#8890a0'); CIR(c,24,9,2,'#a8b0bc',1);
  // magnets
  PG(c,[[16,26],[8,22],[8,30],[16,32]],'#d84028',1.2);     // left U magnet (red end)
  PG(c,[[9,22],[6,24],[6,28],[9,30]],'#3858c8',0);
  PG(c,[[32,26],[40,22],[40,30],[32,32]],'#d84028',1.2);
  PG(c,[[39,22],[42,24],[42,28],[39,30]],'#3858c8',0);
  // side screws
  CIR(c,16,20,1.6,'#8890a0',1); CIR(c,32,20,1.6,'#8890a0',1);
},
tentacool(c){
  // dome
  c.beginPath(); c.arc(24,22,11,Math.PI,0); c.closePath();
  c.fillStyle='#48b0d0'; c.fill(); c.lineWidth=1.4; c.strokeStyle=OUTC; c.stroke();
  E(c,24,22,8,3,'#78d0e8',0);
  CIR(c,18,20,3.4,'#e83048',1); CIR(c,30,20,3.4,'#e83048',1); // red gems
  CIR(c,18,20,1.4,'#f89098',0); CIR(c,30,20,1.4,'#f89098',0);
  // lower body
  E(c,24,24,11,4,'#48b0d0',1.2);
  EYE(c,20,25,1.8,1.4,'#2e2440'); EYE(c,28,25,1.8,1.4,'#2e2440');
  // tentacles
  for(let i=0;i<6;i++){ const tx=14+i*4;
    c.beginPath(); c.moveTo(tx,27); c.quadraticCurveTo(tx+(i%2?2:-2),36,tx,44);
    c.lineWidth=2.2; c.strokeStyle='#48b0d0'; c.lineCap='round'; c.stroke();
  }
},
magikarp(c){
  // big fish body
  c.save(); c.translate(24,26); c.rotate(-0.15); c.translate(-24,-26);
  E(c,24,26,14,9,'#e05038',1.5);
  // scales
  for(let i=0;i<3;i++) for(let j=0;j<2;j++){
    E(c,16+i*8,23+j*6,3,3,'#f07850',0.8);
  }
  // tail
  PG(c,[[36,26],[46,18],[44,26],[46,34]],'#f0e0a0',1.2);
  // pectoral fin
  PG(c,[[20,33],[16,40],[26,36]],'#f0e0a0',1.1);
  // dorsal fin
  PG(c,[[20,17],[24,10],[28,17]],'#f0e0a0',1.1);
  // head
  EYE(c,14,24,2.6,3,'#f8f8f0'); CIR(c,13.5,24,1.2,'#2e2440',0);
  PG(c,[[10,26],[6,25],[8,29],[11,29]],'#e8c060',1);       // lips
  LN(c,18,14,20,10,1.4,'#f8e058'); PG(c,[[18,13],[20,9],[22,13]],'#f8e058',0); // whisker
  c.restore();
},
goldeen(c){
  E(c,24,28,12,8,'#f0f0f0',1.4);                           // white body
  E(c,20,28,5,5,'#f0a838',0);                              // orange patch
  E(c,30,28,4,5,'#f0a838',0);
  PG(c,[[35,26],[46,20],[44,28],[47,36],[35,31]],'#f89890',1.2); // flowing tail
  PG(c,[[36,27],[44,24],[43,32]],'#fcc0b8',0);
  PG(c,[[20,34],[16,42],[26,37]],'#f89890',1.1);           // fin
  PG(c,[[20,20],[24,16],[27,21]],'#f0a838',1);             // dorsal
  // horn
  PG(c,[[14,22],[9,14],[17,21]],'#f0e0c0',1.1);
  EYE(c,16,26,2.2,2.6,'#2e2440');
  PG(c,[[11,29],[6,30],[10,32]],'#f0a838',0.9);            // mouth
},
poliwag(c){
  E(c,24,28,12,12,'#4880d0',1.5);                          // round body
  E(c,23,30,9,9,'#f0f0f0',0);                              // white belly
  // spiral
  c.beginPath();
  for(let a=0;a<Math.PI*4;a+=0.3){ const r=1+a*0.9; const px=24+Math.cos(a)*r, py=31+Math.sin(a)*r; a===0?c.moveTo(px,py):c.lineTo(px,py); }
  c.lineWidth=1.6; c.strokeStyle='#2e2440'; c.stroke();
  EYE(c,18,22,2.6,3,'#f8f8f0'); CIR(c,18.5,22,1.2,'#2e2440',0);
  EYE(c,30,22,2.6,3,'#f8f8f0'); CIR(c,29.5,22,1.2,'#2e2440',0);
  // tail
  PG(c,[[34,36],[44,40],[40,44],[33,40]],'#4880d0',1.2);
  PG(c,[[34,37],[42,41],[38,43]],'#f0e0a0',0);
  LN(c,18,40,17,45,2,'#4880d0'); LN(c,30,40,31,45,2,'#4880d0');
},
staryu(c){
  const star=(cx,cy,rO,rI,rot,f,o)=>{
    const pts=[];
    for(let i=0;i<10;i++){ const a=rot+i*Math.PI/5; const r=i%2?rI:rO;
      pts.push([cx+Math.cos(a)*r, cy+Math.sin(a)*r]); }
    PG(c,pts,f,o);
  };
  star(24,26,18,8,-Math.PI/2,'#c8a058',1.5);               // gold star
  star(24,26,15,6.5,-Math.PI/2,'#e0c078',0);
  CIR(c,24,26,5.5,'#c02828',1.2);                          // core
  CIR(c,24,26,3.2,'#f04858',0);
  CIR(c,24,26,1.6,'#f8d0d0',0);
  // facet lines
  for(let i=0;i<5;i++){ const a=-Math.PI/2+i*2*Math.PI/5;
    LN(c,24,26,24+Math.cos(a)*15,26+Math.sin(a)*15,0.8,'#a88040'); }
},
starmie(c){
  const star=(cx,cy,rO,rI,rot,f,o)=>{
    const pts=[];
    for(let i=0;i<10;i++){ const a=rot+i*Math.PI/5; const r=i%2?rI:rO;
      pts.push([cx+Math.cos(a)*r, cy+Math.sin(a)*r]); }
    PG(c,pts,f,o);
  };
  star(24,24,17,7,-Math.PI/2+0.31,'#8060b0',1.4);          // back star (offset)
  star(24,26,18,8,-Math.PI/2,'#b048a0',1.5);               // front purple star
  star(24,26,14,6,-Math.PI/2,'#c868c0',0);
  // jewel core
  PG(c,[[24,20],[30,26],[24,32],[18,26]],'#e83048',1.2);
  PG(c,[[24,22],[28,26],[24,30],[20,26]],'#f89060',0);
  CIR(c,24,26,1.6,'#f8e8a0',0);
},
onix(c){
  // rock snake made of chained boulders
  const seg=[[10,40,6],[15,32,7],[13,23,7],[19,16,7],[28,13,7],[36,17,6.5],[40,25,6]];
  for(const [sx,sy,r] of seg){
    CIR(c,sx,sy,r,'#9a9088',1.3);
    E(c,sx-r*0.3,sy-r*0.3,r*0.4,r*0.35,'#b8b0a8',0);
  }
  // head
  CIR(c,40,25,7.5,'#9a9088',1.4);
  PG(c,[[38,18],[40,10],[43,18]],'#c8c0b8',1.2);           // head horn
  EYE(c,42,24,2.2,2.6,'#2e2440');
  LN(c,38,29,45,29,1.4);                                   // mouth
},

caterpie(c){
  // segmented body curving up
  const seg=[[14,40,6],[19,34,6.2],[17,27,6.2],[22,21,6.4]];
  for(const [sx,sy,r] of seg){ CIR(c,sx,sy,r,'#7cc040',1.3); E(c,sx,sy+r*0.4,r*0.7,r*0.4,'#a0d868',0); }
  // yellow ring segments
  for(const [sx,sy] of [[19,34],[17,27]]){ E(c,sx,sy,5.5,2,'#f0e058',0.8); CIR(c,sx-3,sy,1,'#e05038',0); CIR(c,sx+3,sy,1,'#e05038',0); }
  // head
  CIR(c,26,16,7,'#7cc040',1.4);
  EYE(c,23,15,2.6,3,'#f8f8f0'); CIR(c,23,15.5,1.2,'#2e2440',0);
  EYE(c,30,15,2.6,3,'#f8f8f0'); CIR(c,30,15.5,1.2,'#2e2440',0);
  LN(c,25,20,29,20,1);
  PG(c,[[26,9],[24,3],[27,7]],'#e05038',1);                // red antenna
  CIR(c,24,3,1.6,'#f05848',0.8);
},
metapod(c){
  // green chrysalis
  c.beginPath(); c.moveTo(24,8); c.quadraticCurveTo(38,24,24,44); c.quadraticCurveTo(10,24,24,8); c.closePath();
  c.fillStyle='#5aa838'; c.fill(); c.lineWidth=1.5; c.strokeStyle=OUTC; c.stroke();
  E(c,24,20,7,9,'#7cc858',0);
  // segment lines
  ARC(c,24,24,11,0.5,Math.PI-0.5,1.2,'#3e8020');
  ARC(c,24,30,10,0.5,Math.PI-0.5,1.2,'#3e8020');
  // closed eyes
  LN(c,18,18,23,18,1.4); LN(c,25,18,30,18,1.4);
},
weedle(c){
  const seg=[[14,40,5.5],[19,34,5.7],[18,27,5.7],[23,21,5.9]];
  for(const [sx,sy,r] of seg){ CIR(c,sx,sy,r,'#e8b048',1.3); E(c,sx,sy+r*0.4,r*0.6,r*0.35,'#f0c878',0); }
  for(const [sx,sy] of [[19,34],[18,27]]) PG(c,[[sx-5,sy+1],[sx,sy+4],[sx+5,sy+1]],'#d05038',0.8); // pink underside spikes
  CIR(c,27,16,6.5,'#e8b048',1.4);
  PG(c,[[27,9],[26,2],[29,8]],'#c02828',1.1);              // head horn
  EYE(c,24,16,2.2,2.6,'#2e2440');
  PG(c,[[22,20],[20,24],[24,21]],'#f0a8b8',0.8);           // nose spike
},
kakuna(c){
  // yellow cocoon
  c.beginPath(); c.moveTo(24,8); c.quadraticCurveTo(37,24,24,44); c.quadraticCurveTo(11,24,24,8); c.closePath();
  c.fillStyle='#e8c048'; c.fill(); c.lineWidth=1.5; c.strokeStyle=OUTC; c.stroke();
  E(c,24,20,6.5,8,'#f0d878',0);
  ARC(c,24,26,10,0.4,Math.PI-0.4,1.2,'#b89028');
  // triangular eyes
  PG(c,[[17,19],[22,20],[18,22]],'#2e2440',0);
  PG(c,[[31,19],[26,20],[30,22]],'#2e2440',0);
},
zubat(c){
  // wings
  PG(c,[[20,22],[3,12],[6,24],[12,22],[9,32],[19,28]],'#7a68c0',1.3);
  PG(c,[[28,22],[45,12],[42,24],[36,22],[39,32],[29,28]],'#7a68c0',1.3);
  PG(c,[[20,22],[8,15],[14,26]],'#9a88e0',0);
  PG(c,[[28,22],[40,15],[34,26]],'#9a88e0',0);
  // body
  E(c,24,24,8,10,'#8878c8',1.4);
  // big ears
  PG(c,[[19,15],[15,4],[23,12]],'#8878c8',1.2);
  PG(c,[[29,15],[33,4],[25,12]],'#8878c8',1.2);
  PG(c,[[19,13],[17,7],[22,12]],'#5a4a8a',0);
  PG(c,[[29,13],[31,7],[26,12]],'#5a4a8a',0);
  // open fanged mouth (no eyes)
  c.beginPath(); c.moveTo(18,24); c.quadraticCurveTo(24,20,30,24); c.quadraticCurveTo(24,34,18,24); c.closePath();
  c.fillStyle='#582848'; c.fill(); c.lineWidth=1.3; c.strokeStyle=OUTC; c.stroke();
  PG(c,[[20,24],[22,29],[24,24]],'#fff',0.9); PG(c,[[24,24],[26,29],[28,24]],'#fff',0.9);
  LN(c,20,20,22,21,1); LN(c,28,20,26,21,1);                // brow ridges
  // feet
  LN(c,21,33,20,38,1.6,'#8878c8'); LN(c,27,33,28,38,1.6,'#8878c8');
},
paras(c){
  // two red mushrooms on back
  E(c,17,14,6,4,'#e84838',1.3); CIR(c,14,13,1.4,'#f8d0c0',0); CIR(c,19,12,1.4,'#f8d0c0',0); CIR(c,17,15,1.3,'#f8d0c0',0);
  E(c,31,14,6,4,'#e84838',1.3); CIR(c,28,13,1.4,'#f8d0c0',0); CIR(c,33,12,1.4,'#f8d0c0',0); CIR(c,31,15,1.3,'#f8d0c0',0);
  LN(c,17,18,18,24,2,'#f0e0c8'); LN(c,31,18,30,24,2,'#f0e0c8');
  // body
  E(c,24,30,12,9,'#e8944c',1.4);
  E(c,22,32,7,5,'#f0b070',0);
  // legs
  for(const lx of [13,16,32,35]) LN(c,lx,34,lx-2,42,2,'#e8944c');
  // claws
  PG(c,[[13,28],[8,26],[12,31]],'#e0c840',1.1); PG(c,[[35,28],[40,26],[36,31]],'#e0c840',1.1);
  EYE(c,20,28,2.4,2.2,'#f8f8f0'); CIR(c,20,28,1,'#2e2440',0);
  EYE(c,28,28,2.4,2.2,'#f8f8f0'); CIR(c,28,28,1,'#2e2440',0);
},
clefairy(c){
  // wings
  PG(c,[[13,26],[6,22],[8,30]],'#f8d8e0',1); PG(c,[[35,26],[42,22],[40,30]],'#f8d8e0',1);
  // body
  E(c,24,30,10,10,'#f0b0c0',1.4);
  E(c,23,32,6.5,6.5,'#f8d0dc',0);
  // arms/legs
  E(c,14,31,3,4,'#f0b0c0',1.2); E(c,34,31,3,4,'#f0b0c0',1.2);
  E(c,18,41,4,3,'#f0b0c0',1.2); E(c,30,41,4,3,'#f0b0c0',1.2);
  // head
  CIR(c,24,16,8.5,'#f0b0c0',1.4);
  // ears
  PG(c,[[16,10],[13,3],[20,8]],'#f0b0c0',1.2); PG(c,[[32,10],[35,3],[28,8]],'#f0b0c0',1.2);
  PG(c,[[16,9],[14,5],[19,8]],'#3a3048',0); PG(c,[[32,9],[34,5],[29,8]],'#3a3048',0);
  // forehead curl
  c.beginPath(); c.moveTo(24,9); c.quadraticCurveTo(30,7,28,12); c.lineWidth=2.2; c.strokeStyle='#d88098'; c.lineCap='round'; c.stroke();
  EYE(c,20,16,2.2,2.8,'#2e2440'); EYE(c,28,16,2.2,2.8,'#2e2440');
  CIR(c,15,19,1.6,'#f89ab0',0); CIR(c,33,19,1.6,'#f89ab0',0);
  c.beginPath(); c.moveTo(22,21); c.quadraticCurveTo(24,23,26,21); c.lineWidth=1.1; c.strokeStyle=OUTC; c.stroke();
},

kadabra(c){
  // tail
  c.beginPath(); c.moveTo(30,36); c.quadraticCurveTo(42,34,40,24);
  c.lineWidth=3.2; c.strokeStyle=OUTC; c.stroke();
  c.beginPath(); c.moveTo(30,36); c.quadraticCurveTo(42,34,40,24);
  c.lineWidth=2; c.strokeStyle='#a06838'; c.stroke();
  // legs / body
  E(c,24,32,9,9,'#e8c048',1.4);
  // brown chest armor
  PG(c,[[17,28],[31,28],[29,40],[19,40]],'#9a6838',1.3);
  LN(c,24,29,24,39,1,'#7a5028');
  E(c,15,40,3.5,3,'#e8c048',1.2); E(c,33,40,3.5,3,'#e8c048',1.2);
  // arm holding spoon
  LN(c,32,28,38,20,3.4,OUTC); LN(c,32,28,38,20,2,'#e8c048');
  E(c,39,17,2,4,'#d0d4dc',1.1,0.5);                        // spoon
  // head (fox-like)
  CIR(c,22,15,7,'#e8c048',1.4);
  PG(c,[[17,10],[13,2],[20,9]],'#e8c048',1.2);             // ears
  PG(c,[[26,10],[30,2],[24,9]],'#e8c048',1.2);
  PG(c,[[14,17],[8,17],[15,20]],'#c8a038',1.1);            // snout
  // star on forehead
  PG(c,[[22,7],[23,10],[26,10],[23.5,12],[24.5,15],[22,13],[19.5,15],[20.5,12],[18,10],[21,10]],'#e05038',0.8);
  EYE(c,20,15,1.8,2,'#a02828');
  LN(c,17,19,20,20,1,'#9a6838'); LN(c,18,21,21,21,1,'#9a6838'); // mustache
},
alakazam(c){
  E(c,24,32,10,9,'#e8c048',1.4);                           // body
  PG(c,[[16,28],[32,28],[30,41],[18,41]],'#9a6838',1.3);   // chest armor
  // shoulder pads
  E(c,14,27,4,3,'#9a6838',1.2); E(c,34,27,4,3,'#9a6838',1.2);
  E(c,15,41,3.6,3,'#e8c048',1.2); E(c,33,41,3.6,3,'#e8c048',1.2);
  // two arms with spoons
  LN(c,15,28,9,20,3.4,OUTC); LN(c,15,28,9,20,2,'#e8c048'); E(c,8,17,2,4,'#d0d4dc',1.1,-0.5);
  LN(c,33,28,39,20,3.4,OUTC); LN(c,33,28,39,20,2,'#e8c048'); E(c,40,17,2,4,'#d0d4dc',1.1,0.5);
  // head
  CIR(c,24,15,7.5,'#e8c048',1.4);
  PG(c,[[18,9],[14,0],[22,8]],'#e8c048',1.2);
  PG(c,[[30,9],[34,0],[26,8]],'#e8c048',1.2);
  PG(c,[[24,7],[25,10],[28,10],[25.5,12],[26.5,16],[24,14],[21.5,16],[22.5,12],[20,10],[23,10]],'#e05038',0.8);
  EYE(c,20,15,1.6,1.9,'#a02828'); EYE(c,28,15,1.6,1.9,'#a02828');
  // big mustache
  c.beginPath(); c.moveTo(20,18); c.quadraticCurveTo(14,17,12,21); c.lineWidth=1.4; c.strokeStyle='#9a6838'; c.stroke();
  c.beginPath(); c.moveTo(28,18); c.quadraticCurveTo(34,17,36,21); c.lineWidth=1.4; c.strokeStyle='#9a6838'; c.stroke();
},
mrmime(c){
  // legs
  LN(c,20,40,19,46,3,'#f0e0e0'); LN(c,28,40,29,46,3,'#f0e0e0');
  E(c,18,46,3,2,'#e05038',1); E(c,30,46,3,2,'#e05038',1);
  // white body
  E(c,24,32,10,10,'#f0e8ec',1.4);
  // pink circle 'buttons'
  CIR(c,20,32,2.4,'#e06888',1); CIR(c,28,32,2.4,'#e06888',1);
  // white-gloved hands
  CIR(c,11,30,3.4,'#f8f8f8',1.3); CIR(c,37,30,3.4,'#f8f8f8',1.3);
  LN(c,15,30,11,30,3,'#e8b0c0'); LN(c,33,30,37,30,3,'#e8b0c0');
  // head pink
  CIR(c,24,15,8,'#f0c0cc',1.4);
  // curly points on head
  CIR(c,16,9,2.6,'#e05038',1.1); CIR(c,32,9,2.6,'#e05038',1.1);
  LN(c,18,12,17,10,2,'#e05038'); LN(c,30,12,31,10,2,'#e05038');
  // big red cheeks
  CIR(c,17,17,2.6,'#e04858',0); CIR(c,31,17,2.6,'#e04858',0);
  EYE(c,20,14,2,2.4,'#2e2440'); EYE(c,28,14,2,2.4,'#2e2440');
  c.beginPath(); c.moveTo(22,19); c.quadraticCurveTo(24,21,26,19); c.lineWidth=1.1; c.strokeStyle=OUTC; c.stroke();
},
tangela(c){
  // mass of blue vines
  CIR(c,24,28,14,'#4878c0',1.4);
  for(let i=0;i<40;i++){
    const a=(i*97)%628/100, r=6+((i*53)%80)/10;
    const x0=24+Math.cos(a)*r, y0=28+Math.sin(a)*r;
    LN(c,x0,y0,x0+Math.cos(a)*4,y0+Math.sin(a)*4,1.4,'#5a88d0');
  }
  E(c,24,28,12,11,'#5888d8',0);
  // squiggly overlay
  for(let i=0;i<8;i++){ const bx=12+i*3;
    c.beginPath(); c.moveTo(bx,20); c.quadraticCurveTo(bx+2,28,bx,36);
    c.lineWidth=1.2; c.strokeStyle='#3f6ab0'; c.stroke(); }
  // red feet
  E(c,17,41,3.5,3,'#e05038',1.2); E(c,31,41,3.5,3,'#e05038',1.2);
  // googly eyes peeking through
  EYE(c,20,27,3,3.4,'#f8f8f0'); CIR(c,20,27,1.4,'#2e2440',0);
  EYE(c,28,27,3,3.4,'#f8f8f0'); CIR(c,28,27,1.4,'#2e2440',0);
},
gloom(c){
  // body
  E(c,24,33,10,8,'#5a80c0',1.4);
  E(c,22,34,5.5,4,'#7a9cd8',0);
  LN(c,19,40,18,45,2.2,'#5a80c0'); LN(c,29,40,30,45,2.2,'#5a80c0');
  // drooping leaves
  PG(c,[[15,32],[6,34],[15,37]],'#48a048',1.2); PG(c,[[33,32],[42,34],[33,37]],'#48a048',1.2);
  // drooping red flower on head
  E(c,24,20,9,5,'#d83848',1.3);
  PG(c,[[16,20],[13,26],[19,23]],'#c02838',1.1); PG(c,[[32,20],[35,26],[29,23]],'#c02838',1.1);
  E(c,24,18,5,3,'#f0e058',0);                              // pollen center
  // drool
  LN(c,20,30,20,34,1.4,'#c8b048'); LN(c,28,30,28,33,1.4,'#c8b048');
  EYE(c,20,32,2.2,1.8,'#2e2440'); EYE(c,28,32,2.2,1.8,'#2e2440');
},
vileplume(c){
  // body
  E(c,24,35,9,6,'#5a80c0',1.4);
  LN(c,20,40,19,45,2.2,'#5a80c0'); LN(c,28,40,29,45,2.2,'#5a80c0');
  PG(c,[[16,35],[8,37],[16,39]],'#48a048',1.2); PG(c,[[32,35],[40,37],[32,39]],'#48a048',1.2);
  // huge rafflesia flower (red with white spots)
  E(c,24,20,15,10,'#d02838',1.5);
  for(const [sx,sy] of [[14,18],[20,15],[28,15],[34,19],[18,24],[30,24],[24,13]]) CIR(c,sx,sy,2,'#f8f0f0',0);
  E(c,24,20,6,4,'#f0d848',0);                              // yellow center
  // petal separations
  for(let i=0;i<6;i++){ const a=i*Math.PI/3; LN(c,24,20,24+Math.cos(a)*14,20+Math.sin(a)*9,1,'#a82030'); }
  EYE(c,21,32,2,1.8,'#2e2440'); EYE(c,27,32,2,1.8,'#2e2440');
},
victreebel(c){
  // yellow pitcher body
  c.beginPath(); c.moveTo(24,44); c.quadraticCurveTo(12,36,14,20);
  c.quadraticCurveTo(16,10,24,10); c.quadraticCurveTo(32,10,34,20);
  c.quadraticCurveTo(36,36,24,44); c.closePath();
  c.fillStyle='#e8c848'; c.fill(); c.lineWidth=1.5; c.strokeStyle=OUTC; c.stroke();
  E(c,24,26,7,10,'#f0dc80',0);
  // big lid/mouth open at top
  c.beginPath(); c.moveTo(15,14); c.quadraticCurveTo(24,2,33,14); c.quadraticCurveTo(24,18,15,14); c.closePath();
  c.fillStyle='#8a3838'; c.fill(); c.lineWidth=1.3; c.strokeStyle=OUTC; c.stroke();
  // teeth
  for(let i=0;i<5;i++){ const tx=17+i*3.5; PG(c,[[tx,13],[tx+1.5,10],[tx+3,13]],'#f8f8f0',0.7); }
  // curly vine on top
  c.beginPath(); c.moveTo(26,6); c.quadraticCurveTo(34,2,30,10); c.lineWidth=2; c.strokeStyle='#5a9c40'; c.lineCap='round'; c.stroke();
  // leaf arm
  PG(c,[[14,26],[4,22],[6,30],[14,30]],'#5aa040',1.2);
  // face on body
  EYE(c,20,30,2.2,2.6,'#2e2440'); EYE(c,28,30,2.2,2.6,'#2e2440');
  LN(c,21,35,27,35,1.2);
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
  youngster(c){
    drawTrainerBase(c,{skin:'#f0c8a0',shirt:'#3878c0',pants:'#c8a038'});
    E(c,24,9.5,8,4.4,'#3868b0',1.3);          // blue cap
    PG(c,[[16,10],[8,12],[16,13]],'#3868b0',1.1);
    LN(c,17,22,17,13,2,'#3a3048'); LN(c,31,22,31,13,2,'#3a3048');
    LN(c,20,42,20,50,4,'#f0c8a0');            // bare knee (shorts)
  },
  bugcatcher(c){
    drawTrainerBase(c,{skin:'#f0c8a0',shirt:'#e8d048',pants:'#68884a'});
    E(c,24,9,9,4,'#e8d8a0',1.2);              // straw hat
    E(c,24,8,5.5,2.6,'#d8c088',1);
    LN(c,38,20,44,8,2,'#a88838');             // net pole
    CIR(c,45,7,4,'rgba(240,240,255,0.5)',1.2);// net
  },
  sailor(c){
    drawTrainerBase(c,{skin:'#e8b890',shirt:'#f0f0f0',pants:'#2a3a6a'});
    PG(c,[[16,24],[32,24],[33,30],[15,30]],'#3868b0',0); // collar stripe
    E(c,24,9,7.5,3.6,'#f0f0f0',1.2);          // sailor cap
    E(c,24,10.5,7.5,1.6,'#2a3a6a',0);
    E(c,24,20,5,2.6,'#4a3020',1);             // beard
  },
  swimmer(c){
    drawTrainerBase(c,{skin:'#e0a878',shirt:'#e0a878',pants:'#2088c0'});
    E(c,24,24,9,7,'#e0a878',1.3);             // bare torso
    LN(c,18,26,30,26,1,'#c08858');
    E(c,24,14,7.6,7,'#e0a878',1.4);           // head
    E(c,24,12,7.6,2.6,'#3a3048',0);           // hair cap
    LN(c,19,13,29,13,2,'#4878c8');            // goggles strap
    CIR(c,21,15,1.6,'#a8d8f8',1); CIR(c,27,15,1.6,'#a8d8f8',1);
  },
  surge(c){
    drawTrainerBase(c,{skin:'#e8b088',shirt:'#48684a',pants:'#3a4a38'});
    // broad shoulders / muscles
    PG(c,[[14,24],[34,24],[37,40],[11,40]],'#48684a',1.4);
    LN(c,14,26,8,40,5.4,OUTC); LN(c,14,26,8,40,4,'#48684a');
    LN(c,34,26,40,40,5.4,OUTC); LN(c,34,26,40,40,4,'#48684a');
    CIR(c,8,41,2.6,'#e8b088',1); CIR(c,40,41,2.6,'#e8b088',1);
    CIR(c,24,14,8.2,'#e8b088',1.4);
    // blond flat-top
    PG(c,[[15,10],[15,5],[33,5],[33,10]],'#f0d048',1.2);
    for(let i=0;i<5;i++) LN(c,17+i*3.5,5,17+i*3.5,2.5,1.4,'#f0d048');
    CIR(c,21,15,1.2,'#2e2440',0); CIR(c,27,15,1.2,'#2e2440',0);
    LN(c,18,12,22,13,1.4); LN(c,30,12,26,13,1.4); // stern brows
    // dog tags
    LN(c,24,24,24,30,1,'#c0c0c0'); CIR(c,24,31,1.4,'#c0c0c0',0.8);
  },
  brock(c){
    drawTrainerBase(c,{skin:'#c89060',shirt:'#48804a',pants:'#6a5238'});
    // broad build
    PG(c,[[14,24],[34,24],[36,40],[12,40]],'#48804a',1.4);
    LN(c,14,26,9,39,5,OUTC); LN(c,14,26,9,39,3.6,'#c89060');
    LN(c,34,26,39,39,5,OUTC); LN(c,34,26,39,39,3.6,'#c89060');
    CIR(c,24,14,8.4,'#c89060',1.4);
    // spiky brown hair
    for(let i=0;i<6;i++){ const hx=16+i*3.2; PG(c,[[hx-2,9],[hx,2.5],[hx+2,9]],'#5a3c20',1); }
    E(c,24,9,8,3,'#5a3c20',0);
    // squinted eyes (Brock's signature)
    LN(c,19,14.5,23,14.5,1.6); LN(c,25,14.5,29,14.5,1.6);
    LN(c,23,19,25,19,1.2);
    // vest opening
    LN(c,24,24,24,38,1.4,'#2e5230');
  },
  sabrina(c){
    drawTrainerBase(c,{skin:'#f0d0b0',shirt:'#e04858',pants:'#c03848'});
    // long dark hair framing
    E(c,24,15,10,10,'#3a3450',1.2);
    LN(c,15,16,13,34,4.5,'#3a3450'); LN(c,33,16,35,34,4.5,'#3a3450');
    CIR(c,24,15,7.6,'#f0d0b0',1.4);
    E(c,24,9,8,3.5,'#3a3450',0);                 // fringe
    CIR(c,21,15,1.1,'#2e2440',0); CIR(c,27,15,1.1,'#2e2440',0);
    // red dress
    PG(c,[[15,24],[33,24],[35,44],[13,44]],'#e04858',1.3);
    // floating spoon (psychic)
    E(c,40,20,1.6,3.5,'#d0d4dc',1,0.4);
    ARC(c,40,20,5,0,Math.PI*2,0.8,'rgba(200,140,240,0.6)');
  },
  erika(c){
    // kimono figure
    E(c,24,15,10,10,'#2a2438',1.2);              // black hair bun
    CIR(c,18,10,3,'#2a2438',1); CIR(c,30,10,3,'#2a2438',1);
    drawTrainerBase(c,{skin:'#f8d8b8',shirt:'#f0d048',pants:'#c8a038'});
    CIR(c,24,15,7.6,'#f8d8b8',1.4);
    E(c,24,9,8,3.5,'#2a2438',0);
    // gentle closed eyes
    LN(c,20,15,23,15,1.4); LN(c,25,15,28,15,1.4);
    // yellow kimono with green sash
    PG(c,[[15,24],[33,24],[35,44],[13,44]],'#f0d048',1.3);
    LN(c,14,32,34,32,3,'#5aa040');               // obi sash
    PG(c,[[22,24],[24,32],[26,24]],'#e8804a',0);  // collar
    // a lotus flower in hair
    CIR(c,32,9,2,'#e05878',0.8);
  },
  misty(c){
    drawTrainerBase(c,{skin:'#f8d0b0',shirt:'#f0d048',pants:'#f0d048'});
    // red suspenders
    LN(c,20,24,20,40,2,'#e04838'); LN(c,28,24,28,40,2,'#e04838');
    // orange side ponytails
    E(c,24,15,7.6,7,'#f0a038',1.4);
    E(c,14,16,3.4,5,'#f0a038',1.3,-0.4); LN(c,13,20,12,30,3,'#f0a038');
    E(c,34,16,3.4,5,'#f0a038',1.3,0.4);  LN(c,35,20,36,30,3,'#f0a038');
    E(c,24,10,7,3.4,'#f0a038',1.1);           // fringe
    CIR(c,21,16,1.2,'#3a6a8a',0); CIR(c,27,16,1.2,'#3a6a8a',0);
    LN(c,22.5,20,25.5,20,1);
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
  youngster:{ skin:'#f0c8a0', hair:'#3a3048', shirt:'#3878c0', pants:'#c8a038', hat:'#3868b0', hatFront:'#3868b0' },
  bugcatcher:{ skin:'#f0c8a0', hair:'#5a4028', shirt:'#e8d048', pants:'#68884a', hat:'#e8d8a0', hatFront:'#d8c088' },
  sailor:{ skin:'#e8b890', hair:'#4a3020', shirt:'#f0f0f0', pants:'#2a3a6a', hat:'#f0f0f0', hatFront:'#2a3a6a' },
  swimmer:{ skin:'#e0a878', hair:'#3a3048', shirt:'#e0a878', pants:'#2088c0' },
  surge:{ skin:'#e8b088', hair:'#f0d048', shirt:'#48684a', pants:'#3a4a38' },
  misty:{ skin:'#f8d0b0', hair:'#f0a038', shirt:'#f0d048', pants:'#f0d048', skirt:true },
  gymguide:{ skin:'#f0c8a0', hair:'#5a4028', shirt:'#e04838', pants:'#3a3a48' },
  oak:{ skin:'#f0c8a0', hair:'#d0d0d0', shirt:'#f0f0f0', pants:'#8a7858' },
  guard:{ skin:'#e8c0a0', hair:'#3a3048', shirt:'#3a5a8a', pants:'#2a3a5a', hat:'#3a5a8a', hatFront:'#c8b048' },
  brock:{ skin:'#c89060', hair:'#5a3c20', shirt:'#48804a', pants:'#6a5238' },
  sabrina:{ skin:'#f0d0b0', hair:'#3a3450', shirt:'#e04858', pants:'#c03848' },
  erika:{ skin:'#f8d8b8', hair:'#2a2438', shirt:'#f0d048', pants:'#c8a038', skirt:true },
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
// surf mount: a friendly blue plesiosaur the hero rides (20x16), dir 0..3, frame 0/1
SPR.surfMount = function(dir, frame){
  const key='surf:'+dir+':'+frame;
  if(this._c[key]) return this._c[key];
  const c = cv(20,16), x = cx2(c);
  x.lineJoin='round';
  const body='#4aa0e0', belly='#bfe6f8', shell='#8cd0f0';
  // wake ripples
  x.strokeStyle='rgba(255,255,255,0.7)'; x.lineWidth=1;
  const wf = frame?0.3:0;
  x.beginPath(); x.arc(4,14,2+wf,Math.PI,0); x.arc(15,14,2-wf,Math.PI,0); x.stroke();
  // body shell
  E(x,10,10,8.5,5.2,body,1.3);
  E(x,10,11,6,3.4,belly,0);
  E(x,10,8.5,7,3.2,shell,0);
  // flippers (paddle)
  const fp = frame?1:-1;
  PG(x,[[4,11],[2,13+fp],[6,12]],body,1);
  PG(x,[[16,11],[18,13-fp],[14,12]],body,1);
  // neck + head, oriented by dir
  let hx=10, hy=4;
  if(dir===2){ hx=3; hy=6; } else if(dir===3){ hx=17; hy=6; } else if(dir===0){ hx=10; hy=7; } else { hx=10; hy=3; }
  // neck
  LN(x,10,7,hx,hy,4.2,OUTC); LN(x,10,7,hx,hy,2.8,body);
  CIR(x,hx,hy,3,body,1.2);
  // eye + horn
  if(dir!==1){
    const ex = dir===2? hx-1 : dir===3? hx+1 : hx-1.4;
    x.fillStyle='#2e2440'; x.fillRect(ex,hy-1,1,1);
    if(dir===0){ x.fillStyle='#2e2440'; x.fillRect(hx+0.6,hy-1,1,1); }
  }
  PG(x,[[hx-1,hy-2.6],[hx,hy-5],[hx+1,hy-2.6]],'#e8f4ff',0.8);
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
  'X'(x){ // cuttable tree (like T, with a pale cut-notch marker)
    TILE_ART['T'](x);
    x.fillStyle='#f8f0c0'; x.fillRect(6,9,4,1); x.fillRect(7,8,2,1);
    x.fillStyle='#c8b060'; x.fillRect(6,10,4,1);
  },
  'O'(x){ // strength boulder (bigger, with arrows hint)
    x.fillStyle='#9a9088'; x.beginPath(); x.arc(8,8,7,0,7); x.fill();
    x.fillStyle='#b6ada4'; x.beginPath(); x.arc(7,6,5,0,7); x.fill();
    x.fillStyle='#d0c8c0'; x.fillRect(4,4,3,2); x.fillRect(9,9,2,2);
    x.strokeStyle='#5a5048'; x.lineWidth=1.2; x.beginPath(); x.arc(8,8,7,0,7); x.stroke();
    x.strokeStyle='#70685f'; x.lineWidth=1; x.beginPath(); x.moveTo(5,11); x.lineTo(11,11); x.stroke();
  },
  'R'(x){ // town building wall (brick + trim)
    x.fillStyle='#d8c0a0'; x.fillRect(0,0,16,16);
    x.fillStyle='#c0a480'; for(let r=0;r<4;r++){ x.fillRect(0,r*4+3,16,1); }
    x.fillStyle='#cbb190'; for(let r=0;r<4;r++){ const o=(r%2)*4; for(let cc=0;cc<3;cc++) x.fillRect(o+cc*8,r*4,1,3); }
    x.fillStyle='#b09070'; x.fillRect(0,0,16,1);
  },
  'Z'(x){ // gym facade
    x.fillStyle='#9a9aa8'; x.fillRect(0,0,16,16);
    x.fillStyle='#7a7a8a'; x.fillRect(0,0,16,2); x.fillRect(0,7,16,1); x.fillRect(0,13,16,1);
    x.fillStyle='#b0b0c0'; x.fillRect(1,3,6,3); x.fillRect(9,3,6,3); x.fillRect(1,9,6,3); x.fillRect(9,9,6,3);
  },
  'H'(x){ // hedge / fence
    TILE_ART['.'](x);
    x.fillStyle='#2e6c34'; x.fillRect(1,4,14,9);
    x.fillStyle='#48a048'; x.fillRect(1,4,14,2); speckle(x,'#3e8c40',44,8);
    x.fillStyle='#245626'; x.fillRect(1,12,14,1);
  },
  'L'(x){ // ledge (jump-down south edge) — decorative, walkable
    TILE_ART['.'](x);
    x.fillStyle='#c8a86a'; x.fillRect(0,11,16,5);
    x.fillStyle='#a8874a'; x.fillRect(0,11,16,1);
    x.fillStyle='#8a6a38'; x.fillRect(2,14,3,1); x.fillRect(8,14,3,1);
  },
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
  gym:{ w:96, h:80, draw(x){
    // grey roof
    x.fillStyle='#8890a0'; x.beginPath(); x.moveTo(0,30); x.lineTo(16,8); x.lineTo(80,8); x.lineTo(96,30); x.lineTo(96,38); x.lineTo(0,38); x.fill();
    x.fillStyle='#6a7284'; x.fillRect(0,30,96,8);
    x.strokeStyle='#4a5262'; x.lineWidth=2; x.beginPath(); x.moveTo(0,30); x.lineTo(16,8); x.lineTo(80,8); x.lineTo(96,30); x.stroke();
    // walls
    x.fillStyle='#c8ccd4'; x.fillRect(4,38,88,42);
    x.strokeStyle='#7a8290'; x.lineWidth=1; x.strokeRect(4.5,38.5,87,41);
    x.fillStyle='#a8b0bc'; x.fillRect(4,38,88,3);
    // big columns
    x.fillStyle='#e0e4ea'; x.fillRect(12,42,8,38); x.fillRect(76,42,8,38);
    x.strokeStyle='#9098a4'; x.strokeRect(12.5,42.5,7,37); x.strokeRect(76.5,42.5,7,37);
    // door
    x.fillStyle='#485060'; x.fillRect(38,52,20,28);
    x.fillStyle='#68707e'; x.fillRect(40,54,7,24); x.fillRect(49,54,7,24);
    // emblem
    x.fillStyle='#f0d048'; x.beginPath(); x.arc(48,20,8,0,7); x.fill();
    x.strokeStyle='#4a5262'; x.lineWidth=1.4; x.stroke();
    x.fillStyle='#4a5262'; x.font='bold 12px sans-serif'; x.textAlign='center'; x.fillText('G',48,25); x.textAlign='left';
  }},
  mart:{ w:80, h:64, draw(x){
    x.fillStyle='#3878c0'; x.beginPath(); x.moveTo(0,26); x.lineTo(12,6); x.lineTo(68,6); x.lineTo(80,26); x.lineTo(80,32); x.lineTo(0,32); x.fill();
    x.fillStyle='#2a5c98'; x.fillRect(0,26,80,6);
    x.strokeStyle='#1c3a68'; x.lineWidth=1.6; x.beginPath(); x.moveTo(0,26); x.lineTo(12,6); x.lineTo(68,6); x.lineTo(80,26); x.stroke();
    x.fillStyle='#f0ece0'; x.fillRect(4,32,72,32);
    x.strokeStyle='#8a8478'; x.lineWidth=1; x.strokeRect(4.5,32.5,71,31);
    x.fillStyle='#78b8e8'; x.fillRect(48,38,20,14); x.strokeStyle='#5878a0'; x.strokeRect(48.5,38.5,19,13);
    x.fillStyle='#8a5a30'; x.fillRect(16,40,14,24);
    // blue roof emblem
    x.fillStyle='#f8f8f8'; x.font='bold 10px sans-serif'; x.textAlign='center'; x.fillText('MART',40,20); x.textAlign='left';
  }},
  lab:{ w:96, h:80, draw(x){
    // domed research roof
    x.fillStyle='#c85040';
    x.beginPath(); x.moveTo(4,36); x.quadraticCurveTo(48,4,92,36); x.lineTo(92,42); x.lineTo(4,42); x.fill();
    x.fillStyle='#a83828'; x.beginPath(); x.moveTo(4,36); x.quadraticCurveTo(48,10,92,36); x.lineTo(92,40); x.lineTo(4,40); x.fill();
    x.strokeStyle='#7a2418'; x.lineWidth=2; x.beginPath(); x.moveTo(4,36); x.quadraticCurveTo(48,4,92,36); x.stroke();
    // walls
    x.fillStyle='#eef0f2'; x.fillRect(4,42,88,38);
    x.fillStyle='#d4d8dc'; x.fillRect(4,42,88,3);
    x.strokeStyle='#8a9098'; x.lineWidth=1; x.strokeRect(4.5,42.5,87,37);
    // big windows
    x.fillStyle='#78b8e8'; x.fillRect(12,50,18,16); x.fillRect(66,50,18,16);
    x.strokeStyle='#5878a0'; x.strokeRect(12.5,50.5,17,15); x.strokeRect(66.5,50.5,17,15);
    x.fillStyle='#a8d8f8'; x.fillRect(13,51,7,6); x.fillRect(67,51,7,6);
    // door
    x.fillStyle='#5a4a6a'; x.fillRect(38,54,20,26);
    x.fillStyle='#7a6a8a'; x.fillRect(40,56,7,22); x.fillRect(49,56,7,22);
    // rooftop antenna / dish
    x.strokeStyle='#8a9098'; x.lineWidth=2; x.beginPath(); x.moveTo(48,8); x.lineTo(48,-2); x.stroke();
    x.fillStyle='#c8ccd0'; x.beginPath(); x.arc(48,-2,4,0,7); x.fill();
    // sign band
    x.fillStyle='#385888'; x.fillRect(30,44,36,7);
    x.fillStyle='#f8f8f8'; x.font='bold 7px sans-serif'; x.textAlign='center'; x.fillText('LAB',48,50); x.textAlign='left';
  }},
  cottage:{ w:80, h:64, draw(x){
    x.fillStyle='#c86038'; x.beginPath(); x.moveTo(0,28); x.lineTo(14,6); x.lineTo(66,6); x.lineTo(80,28); x.lineTo(80,34); x.lineTo(0,34); x.fill();
    x.fillStyle='#a84a28'; x.fillRect(0,28,80,6);
    x.strokeStyle='#7a3418'; x.lineWidth=1.6; x.beginPath(); x.moveTo(0,28); x.lineTo(14,6); x.lineTo(66,6); x.lineTo(80,28); x.stroke();
    x.fillStyle='#e8dcc0'; x.fillRect(4,34,72,30);
    x.strokeStyle='#9a8a68'; x.lineWidth=1; x.strokeRect(4.5,34.5,71,29);
    x.fillStyle='#78b8e8'; x.fillRect(50,40,16,12); x.strokeStyle='#5878a0'; x.strokeRect(50.5,40.5,15,11);
    x.fillStyle='#8a5a30'; x.fillRect(18,42,13,22); x.fillStyle='#f8d048'; x.fillRect(27,52,2,2);
    // chimney
    x.fillStyle='#9a8a68'; x.fillRect(58,8,8,12);
  }},
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
