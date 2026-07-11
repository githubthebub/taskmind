/* ============================================================
   ui.js — FRLG-style boxes, typewriter dialogue, menus, bars.
   All UI runs as coroutines awaiting frames (see engine.js).
   ============================================================ */
'use strict';

const VW = 480, VH = 320;           // internal canvas size
const FONT_D = '21px VT323';        // dialogue font
const FONT_DS = '18px VT323';       // small dialogue font
const FONT_U = '9px "Press Start 2P"';   // HUD font
const FONT_UB = '11px "Press Start 2P"'; // HUD big
const INK = '#40424e';
const INK_SHADOW = 'rgba(64,66,78,0.25)';

const UI = {};

UI.rounded = function(x, xx,yy,w,h,r){
  x.beginPath();
  x.moveTo(xx+r,yy);
  x.arcTo(xx+w,yy,xx+w,yy+h,r);
  x.arcTo(xx+w,yy+h,xx,yy+h,r);
  x.arcTo(xx,yy+h,xx,yy,r);
  x.arcTo(xx,yy,xx+w,yy,r);
  x.closePath();
};

// classic FRLG message frame: white with blue double border
UI.box = function(x, xx,yy,w,h,opts){
  opts = opts||{};
  x.save();
  UI.rounded(x, xx+2,yy+3,w,h,6);
  x.fillStyle='rgba(48,56,80,0.35)'; x.fill();     // soft shadow
  UI.rounded(x, xx,yy,w,h,6);
  x.fillStyle = opts.fill || '#f8f8f8'; x.fill();
  x.lineWidth = 3; x.strokeStyle = opts.border || '#5080c0'; x.stroke();
  UI.rounded(x, xx+2.5,yy+2.5,w-5,h-5,4);
  x.lineWidth = 1.5; x.strokeStyle = opts.inner || '#b8d0e8'; x.stroke();
  x.restore();
};
// beige battle info panel
UI.panel = function(x, xx,yy,w,h){
  x.save();
  UI.rounded(x, xx,yy,w,h,5);
  x.fillStyle='#f8f0d0'; x.fill();
  x.lineWidth=3; x.strokeStyle='#786840'; x.stroke();
  UI.rounded(x, xx+2.5,yy+2.5,w-5,h-5,3);
  x.lineWidth=1.5; x.strokeStyle='#e8d8a8'; x.stroke();
  x.restore();
};

UI.text = function(x, str, xx, yy, opts){
  opts = opts||{};
  x.save();
  x.font = opts.font || FONT_D;
  x.textBaseline = 'alphabetic';
  x.textAlign = opts.align || 'left';
  if(opts.shadow !== false){
    x.fillStyle = opts.shadowCol || INK_SHADOW;
    x.fillText(str, xx+1, yy+1);
  }
  x.fillStyle = opts.col || INK;
  x.fillText(str, xx, yy);
  x.restore();
};
UI.wrap = function(x, str, maxw, font){
  x.save(); x.font = font || FONT_D;
  const out = [];
  for(const hard of String(str).split('\n')){
    const words = hard.split(' ');
    let line='';
    for(const w of words){
      const t = line? line+' '+w : w;
      if(x.measureText(t).width > maxw && line){ out.push(line); line=w; }
      else line=t;
    }
    out.push(line);
  }
  x.restore();
  return out;
};

// HP bar: pos, w, ratio
UI.hpbar = function(x, xx, yy, w, ratio){
  ratio = Math.max(0, Math.min(1, ratio));
  x.save();
  x.fillStyle='#584838'; x.fillRect(xx-14, yy-1, w+15, 7);
  x.font='7px "Press Start 2P"'; x.fillStyle='#f8b050'; x.textAlign='left';
  x.fillText('HP', xx-12, yy+5);
  x.fillStyle='#40424e'; x.fillRect(xx+1, yy, w, 5);
  const col = ratio>0.5 ? '#48d068' : ratio>0.2 ? '#f8e038' : '#f05038';
  x.fillStyle=col; x.fillRect(xx+1, yy, Math.round(w*ratio), 5);
  x.fillStyle='rgba(255,255,255,0.35)'; x.fillRect(xx+1, yy, Math.round(w*ratio), 2);
  x.restore();
};
UI.expbar = function(x, xx, yy, w, ratio){
  ratio = Math.max(0, Math.min(1, ratio));
  x.save();
  x.fillStyle='#40424e'; x.fillRect(xx, yy, w, 3);
  x.fillStyle='#48a8f8'; x.fillRect(xx, yy, Math.round(w*ratio), 3);
  x.restore();
};
UI.statusTag = function(x, st, xx, yy){
  if(!st) return;
  const s = STATUS[st]; if(!s) return;
  x.save();
  UI.rounded(x, xx, yy, 26, 11, 3);
  x.fillStyle=s.color; x.fill();
  x.font='7px "Press Start 2P"'; x.fillStyle='#fff'; x.textAlign='center';
  x.fillText(s.tag, xx+13, yy+9);
  x.restore();
};

// ============ Dialogue (typewriter) ============
const Dlg = {
  active:false, lines:[], shown:0, done:false, arrowT:0, speaker:null,
};
Dlg.layout = { x:8, y:VH-78, w:VW-16, h:70, pad:14 };

// say one page of text (auto-wrapped, paginated by 2 lines)
Dlg.say = async function(text){
  const L = Dlg.layout;
  const wrapped = UI.wrap(G_ctx, text, L.w - L.pad*2 - 14, FONT_D);
  for(let start=0; start<wrapped.length; start+=2){
    const page = wrapped.slice(start, start+2);
    Dlg.active=true; Dlg.lines=page; Dlg.shown=0; Dlg.done=false;
    const total = page.join('').length;
    // typewriter
    while(Dlg.shown < total){
      Dlg.shown = Math.min(total, Dlg.shown + (Input.held('A')||Input.held('B') ? 3 : 1.4));
      if(Input.took('A')) { Dlg.shown = total; break; }
      await nextFrame();
    }
    Dlg.done=true;
    SNDsafe('pageDone');
    // wait for A/B
    while(!Input.took('A') && !Input.took('B')) await nextFrame();
    SNDsafe('confirm');
  }
  Dlg.active=false;
};
Dlg.draw = function(x){
  if(!Dlg.active) return;
  const L = Dlg.layout;
  UI.box(x, L.x, L.y, L.w, L.h);
  x.save(); x.font=FONT_D;
  let count=0;
  for(let i=0;i<Dlg.lines.length;i++){
    const line = Dlg.lines[i];
    const take = Math.max(0, Math.min(line.length, Math.floor(Dlg.shown - count)));
    UI.text(x, line.slice(0,take), L.x+L.pad, L.y+27+i*24);
    count += line.length;
  }
  if(Dlg.done){
    Dlg.arrowT += 0.1;
    const dy = Math.sin(Dlg.arrowT)>0 ? 1 : 0;
    x.fillStyle='#e05048';
    x.beginPath();
    x.moveTo(L.x+L.w-22, L.y+L.h-16+dy);
    x.lineTo(L.x+L.w-10, L.y+L.h-16+dy);
    x.lineTo(L.x+L.w-16, L.y+L.h-9+dy);
    x.closePath(); x.fill();
  }
  x.restore();
};

// ============ Menu (list with cursor) ============
// items: array of strings (or {label, disabled}). returns index or -1 (B)
const Menu = { active:false, items:[], sel:0, x:0, y:0, w:0, title:null };
Menu.open = async function(items, opts){
  opts = opts||{};
  Menu.items = items.map(i => typeof i==='string' ? {label:i} : i);
  Menu.sel = opts.sel||0;
  Menu.w = opts.w || (Math.max(...Menu.items.map(i=>i.label.length))*11 + 44);
  Menu.x = opts.x !== undefined ? opts.x : VW - Menu.w - 8;
  Menu.y = opts.y !== undefined ? opts.y : 8;
  Menu.h = Menu.items.length*22 + 18;
  if(opts.bottom) Menu.y = VH - Menu.h - (Dlg.active? 84 : 8);
  Menu.active = true;
  try{
    while(true){
      if(Input.took('UP')){ Menu.sel = (Menu.sel+Menu.items.length-1)%Menu.items.length; SNDsafe('cursor'); }
      if(Input.took('DOWN')){ Menu.sel = (Menu.sel+1)%Menu.items.length; SNDsafe('cursor'); }
      if(Input.took('A')){ SNDsafe('confirm'); return Menu.sel; }
      if(Input.took('B') && !opts.noCancel){ SNDsafe('cancel'); return -1; }
      await nextFrame();
    }
  } finally { Menu.active=false; }
};
Menu.draw = function(x){
  if(!Menu.active) return;
  UI.box(x, Menu.x, Menu.y, Menu.w, Menu.h);
  x.save(); x.font=FONT_D;
  for(let i=0;i<Menu.items.length;i++){
    const it = Menu.items[i];
    UI.text(x, it.label, Menu.x+26, Menu.y+24+i*22, {col: it.disabled? '#a8a8b0' : INK});
    if(i===Menu.sel){
      x.fillStyle='#e05048';
      x.beginPath();
      x.moveTo(Menu.x+10, Menu.y+11+i*22);
      x.lineTo(Menu.x+19, Menu.y+16+i*22);
      x.lineTo(Menu.x+10, Menu.y+21+i*22);
      x.closePath(); x.fill();
    }
  }
  x.restore();
};
UI.yesno = async function(){
  const r = await Menu.open(['YES','NO'], {x:VW-110, y:VH-78-70, w:100});
  return r===0;
};

// ============ Fades & flashes ============
const Fx = { fade:0, flash:0, white:false };
UI.fadeOut = async function(ms){
  ms = ms||400;
  const steps = Math.max(1, Math.round(ms/16.7));
  for(let i=0;i<=steps;i++){ Fx.fade = i/steps; await nextFrame(); }
  Fx.fade = 1;
};
UI.fadeIn = async function(ms){
  ms = ms||400;
  const steps = Math.max(1, Math.round(ms/16.7));
  for(let i=steps;i>=0;i--){ Fx.fade = i/steps; await nextFrame(); }
  Fx.fade = 0;
};
UI.flashBattle = async function(){
  for(let k=0;k<3;k++){
    Fx.white=true;  for(let i=0;i<4;i++){ Fx.flash=1; await nextFrame(); }
    Fx.flash=0; for(let i=0;i<4;i++) await nextFrame();
  }
  Fx.white=false;
};
UI.drawFx = function(x){
  if(Fx.fade>0){ x.fillStyle=`rgba(8,8,16,${Fx.fade})`; x.fillRect(0,0,VW,VH); }
  if(Fx.flash>0){ x.fillStyle=Fx.white? `rgba(255,255,255,${Fx.flash})` : `rgba(0,0,0,${Fx.flash})`; x.fillRect(0,0,VW,VH); }
};

// ============ Location banner ============
const Banner = { t:0, text:'' };
Banner.show = function(text){ Banner.text=text; Banner.t=150; };
Banner.draw = function(x){
  if(Banner.t<=0) return;
  Banner.t--;
  const slide = Banner.t>130 ? (150-Banner.t)/20 : Banner.t<20 ? Banner.t/20 : 1;
  const w = 30 + Banner.text.length*10.5;
  const yy = -34 + slide*42;
  UI.box(x, 8, yy, w, 30, {fill:'#f8f0d0', border:'#786840', inner:'#e8d8a8'});
  UI.text(x, Banner.text, 8+w/2, yy+21, {align:'center', col:'#584828'});
};

// safe sfx helper (audio may not be unlocked yet)
function SNDsafe(name){ try{ SND.sfx(name); }catch(e){} }
