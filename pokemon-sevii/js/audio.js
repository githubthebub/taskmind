/* ============================================================
   audio.js — WebAudio chiptune sequencer + SFX (all original).
   Unlocks on first user input. M toggles mute.
   ============================================================ */
'use strict';

const SND = {
  ctx:null, master:null, musicG:null, sfxG:null,
  muted:false, songName:null, _timer:null, _tracks:null, _songT:0,
};

SND.init = function(){
  if(SND.ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) return;
  SND.ctx = new AC();
  SND.master = SND.ctx.createGain(); SND.master.gain.value = 0.55;
  SND.master.connect(SND.ctx.destination);
  SND.musicG = SND.ctx.createGain(); SND.musicG.gain.value = 0.42;
  SND.musicG.connect(SND.master);
  SND.sfxG = SND.ctx.createGain(); SND.sfxG.gain.value = 0.8;
  SND.sfxG.connect(SND.master);
  if(SND._pendingSong){ SND.music(SND._pendingSong); SND._pendingSong=null; }
};
SND.toggleMute = function(){
  SND.muted = !SND.muted;
  if(SND.master) SND.master.gain.value = SND.muted ? 0 : 0.55;
  return SND.muted;
};

// ---- note helpers ----
const NOTE_IDX = {C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};
function nfreq(n){
  // e.g. 'C4', 'F#3'
  const m = /^([A-G]#?)(\d)$/.exec(n);
  if(!m) return 0;
  const midi = (Number(m[2])+1)*12 + NOTE_IDX[m[1]];
  return 440*Math.pow(2,(midi-69)/12);
}
// parse "C4:2 - :1 E4:1" → [{f,beats}] ('-' = rest)
function parseNotes(str){
  return str.trim().split(/\s+/).map(tok=>{
    const [n,b] = tok.split(':');
    return { f: n==='-' ? 0 : nfreq(n), beats: Number(b||1) };
  });
}

// ---- songs (original compositions) ----
const SONGS = {
  title:{ bpm:126, tracks:[
    { wave:'square', vol:0.16, notes:'E4:1 G4:1 B4:1 E5:2 D5:1 B4:2 A4:1 B4:1 G4:2 - :2 C5:1 B4:1 A4:1 G4:2 A4:1 B4:3 - :1' },
    { wave:'triangle', vol:0.30, notes:'E3:2 E3:2 C3:2 C3:2 D3:2 D3:2 G2:2 G2:2 A2:2 A2:2 C3:2 C3:2 D3:2 D3:2 B2:2 B2:2'.replace('B2:2 B2:2','B2:2 B2:2') },
    { wave:'noise', vol:0.05, notes:'C5:1 - :1 C5:1 - :1 C5:1 - :1 C5:0.5 C5:0.5 C5:1 - :1 C5:1 - :1 C5:1 - :1 C5:1 - :1' },
  ]},
  town:{ bpm:96, tracks:[
    { wave:'square', vol:0.12, notes:'G4:1.5 A4:0.5 B4:1 G4:1 E4:2 G4:2 A4:1.5 B4:0.5 C5:1 A4:1 G4:2 E4:2 D4:1 E4:1 G4:1 A4:1 B4:2 A4:2 G4:1 E4:1 D4:1 E4:1 G4:4' },
    { wave:'triangle', vol:0.26, notes:'C3:2 G3:2 A2:2 E3:2 F3:2 C3:2 G2:2 D3:2 C3:2 G3:2 A2:2 E3:2 F3:2 G3:2 C3:4' },
  ]},
  center:{ bpm:104, tracks:[
    { wave:'square', vol:0.10, notes:'E5:1 C5:1 D5:1 G4:1 - :1 G4:0.5 A4:0.5 B4:1 C5:1 - :2 F5:1 D5:1 E5:1 C5:1 - :1 A4:1 B4:1 C5:1 D5:1 - :2' },
    { wave:'triangle', vol:0.24, notes:'C3:2 E3:2 G3:2 E3:2 F3:2 A3:2 G3:2 B2:2 C3:2 E3:2 G3:2 E3:2 F3:2 G3:2 C3:2 G2:2' },
  ]},
  route:{ bpm:134, tracks:[
    { wave:'square', vol:0.13, notes:'C5:1 - :0.5 C5:0.5 D5:1 E5:1 G5:1.5 E5:0.5 D5:1 C5:1 A4:1.5 C5:0.5 D5:1 E5:1 D5:2 - :2 E5:1 - :0.5 E5:0.5 F5:1 G5:1 A5:1.5 G5:0.5 F5:1 E5:1 D5:1.5 E5:0.5 F5:1 D5:1 C5:2 - :2' },
    { wave:'triangle', vol:0.28, notes:'C3:1 G3:1 C3:1 G3:1 A2:1 E3:1 A2:1 E3:1 F3:1 C4:1 F3:1 C4:1 G3:1 D4:1 G3:1 B3:1 C3:1 G3:1 C3:1 G3:1 A2:1 E3:1 A2:1 E3:1 F3:1 C4:1 F3:1 C4:1 G3:1 G2:1 C3:2' },
    { wave:'noise', vol:0.045, notes:'C5:0.5 - :0.5 C5:0.5 C5:0.5 '.repeat(16) },
  ]},
  ember:{ bpm:112, tracks:[
    { wave:'square', vol:0.11, notes:'A4:1 - :1 C5:1 B4:1 A4:1 E4:2 - :1 A4:1 B4:1 C5:1 E5:1 D5:1 B4:2 - :1 F5:1 E5:1 D5:1 C5:1 B4:1 E4:2 - :1 A4:1 G4:1 A4:1 B4:1 A4:2 - :2' },
    { wave:'sawtooth', vol:0.10, notes:'A2:4 A2:4 F2:4 E2:4 A2:4 A2:4 D2:4 E2:4' },
    { wave:'noise', vol:0.05, notes:'C5:1 - :1 C5:0.5 C5:0.5 - :1 '.repeat(8) },
  ]},
  cave:{ bpm:88, tracks:[
    { wave:'triangle', vol:0.22, notes:'D3:2 - :2 F3:2 - :2 A3:2 - :2 G3:2 - :2 D3:2 - :2 A2:2 - :2 C3:2 - :2 D3:2 - :2' },
    { wave:'square', vol:0.06, notes:'- :4 D5:1 - :3 - :4 A4:1 - :3 - :4 F5:1 - :3 - :4 E5:1 - :3' },
  ]},
  battle:{ bpm:152, tracks:[
    { wave:'square', vol:0.13, notes:'A4:0.5 A4:0.5 C5:0.5 A4:0.5 E5:1 D5:1 C5:0.5 D5:0.5 E5:1 C5:1 A4:1 G4:0.5 A4:0.5 B4:1 E4:1 G4:1 A4:2 A4:0.5 A4:0.5 C5:0.5 A4:0.5 F5:1 E5:1 D5:0.5 E5:0.5 F5:1 D5:1 B4:1 A4:0.5 B4:0.5 C5:1 D5:1 E5:1 A4:2' },
    { wave:'sawtooth', vol:0.14, notes:'A2:0.5 A2:0.5 A2:0.5 A2:0.5 A2:0.5 A2:0.5 A2:0.5 A2:0.5 F2:0.5 F2:0.5 F2:0.5 F2:0.5 G2:0.5 G2:0.5 G2:0.5 G2:0.5 '.repeat(4) },
    { wave:'noise', vol:0.06, notes:'C5:0.5 C6:0.5 '.repeat(32) },
  ]},
  victory:{ bpm:132, tracks:[
    { wave:'square', vol:0.13, notes:'C5:0.5 C5:0.5 C5:0.5 C5:1.5 G4:1 C5:1 E5:2 D5:1 C5:1 D5:1 E5:1 C5:2 - :2' },
    { wave:'triangle', vol:0.26, notes:'C3:1 G3:1 C3:1 G3:1 F3:1 C4:1 G3:1 D4:1 C3:1 G3:1 C3:2 - :2' },
  ]},
  ending:{ bpm:100, tracks:[
    { wave:'square', vol:0.12, notes:'E5:1.5 D5:0.5 C5:1 G4:1 A4:1.5 G4:0.5 E4:2 F4:1 G4:1 A4:1 C5:1 G4:3 - :1 E5:1.5 D5:0.5 C5:1 G4:1 A4:1.5 C5:0.5 D5:2 E5:1 D5:1 C5:1 D5:1 C5:3 - :1' },
    { wave:'triangle', vol:0.26, notes:'C3:2 G3:2 A2:2 E3:2 F3:2 C3:2 G2:2 G3:2 C3:2 G3:2 A2:2 E3:2 F3:2 G3:2 C3:2 E3:2' },
  ]},
};

SND.music = function(name){
  if(SND.songName === name) return;
  if(!SND.ctx){ SND._pendingSong = name; SND.songName = name; return; }
  SND.stopMusic();
  SND.songName = name;
  const song = SONGS[name];
  if(!song) return;
  const beat = 60/song.bpm;
  SND._tracks = song.tracks.map(t=>({
    wave:t.wave, vol:t.vol,
    notes:parseNotes(t.notes),
    len:0, i:0, t:SND.ctx.currentTime + 0.08,
  }));
  for(const tr of SND._tracks) tr.len = tr.notes.reduce((a,n)=>a+n.beats,0);
  SND._timer = setInterval(()=>{
    if(!SND.ctx) return;
    const horizon = SND.ctx.currentTime + 0.45;
    for(const tr of SND._tracks){
      while(tr.t < horizon){
        const n = tr.notes[tr.i];
        const dur = n.beats*beat;
        if(n.f>0) SND._playNote(tr.wave, n.f, tr.t, dur, tr.vol);
        tr.t += dur;
        tr.i = (tr.i+1)%tr.notes.length;
      }
    }
  }, 120);
};
SND.stopMusic = function(){
  if(SND._timer){ clearInterval(SND._timer); SND._timer=null; }
  SND.songName = null;
  SND._tracks = null;
};
SND._noiseBuf = null;
SND._playNote = function(wave, freq, t, dur, vol){
  const c = SND.ctx;
  const g = c.createGain();
  g.connect(SND.musicG);
  const sus = Math.max(0.03, dur*0.82);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t+0.008);
  g.gain.setValueAtTime(vol, t+sus*0.7);
  g.gain.linearRampToValueAtTime(0, t+sus);
  if(wave==='noise'){
    if(!SND._noiseBuf){
      const b = c.createBuffer(1, c.sampleRate*0.5, c.sampleRate);
      const d = b.getChannelData(0);
      for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
      SND._noiseBuf = b;
    }
    const s = c.createBufferSource(); s.buffer=SND._noiseBuf;
    s.playbackRate.value = freq>700? 2.4 : 1.1;
    const f = c.createBiquadFilter(); f.type='highpass'; f.frequency.value = freq>700? 6000:2000;
    s.connect(f); f.connect(g);
    s.start(t); s.stop(t+Math.min(sus,0.09));
  } else {
    const o = c.createOscillator();
    o.type = wave; o.frequency.value = freq;
    o.connect(g);
    o.start(t); o.stop(t+sus+0.02);
  }
};

// ---- SFX ----
function tone(freq, dur, wave, vol, slide, delay){
  if(!SND.ctx) return;
  const c = SND.ctx, t = c.currentTime + (delay||0);
  const o = c.createOscillator(), g = c.createGain();
  o.type = wave||'square'; o.frequency.setValueAtTime(freq, t);
  if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide), t+dur);
  g.gain.setValueAtTime(vol||0.18, t);
  g.gain.exponentialRampToValueAtTime(0.001, t+dur);
  o.connect(g); g.connect(SND.sfxG);
  o.start(t); o.stop(t+dur+0.02);
}
function noiseHit(dur, vol, delay, low){
  if(!SND.ctx) return;
  const c = SND.ctx, t = c.currentTime + (delay||0);
  if(!SND._noiseBuf) SND._playNote('noise',100,t,0.001,0); // ensure buffer
  const s = c.createBufferSource(); s.buffer = SND._noiseBuf;
  s.playbackRate.value = low? 0.35 : 0.9;
  const g = c.createGain();
  g.gain.setValueAtTime(vol||0.3, t);
  g.gain.exponentialRampToValueAtTime(0.001, t+dur);
  s.connect(g); g.connect(SND.sfxG);
  s.start(t); s.stop(t+dur);
}
const SFX = {
  cursor(){ tone(880, 0.05, 'square', 0.10); },
  confirm(){ tone(660, 0.06, 'square', 0.12); tone(990, 0.07, 'square', 0.10, 0, 0.05); },
  cancel(){ tone(440, 0.08, 'square', 0.12, -140); },
  pageDone(){},
  bump(){ tone(90, 0.08, 'square', 0.13); },
  door(){ tone(300, 0.08, 'square', 0.12, 160); },
  save(){ tone(520,0.07,'square',0.12); tone(780,0.07,'square',0.12,0,0.08); tone(1040,0.12,'square',0.12,0,0.16); },
  item(){ tone(660,0.09,'square',0.13); tone(880,0.09,'square',0.13,0,0.09); tone(1320,0.16,'square',0.13,0,0.18); },
  heal(){ [523,659,784,1047].forEach((f,i)=>tone(f,0.12,'square',0.12,0,i*0.09)); },
  lvl(){ [523,659,784,880,1047,1319].forEach((f,i)=>tone(f,0.09,'square',0.12,0,i*0.07)); },
  hit(){ noiseHit(0.12, 0.28); },
  hitSuper(){ noiseHit(0.22, 0.34, 0, true); tone(120,0.18,'sawtooth',0.16,-60); },
  hitWeak(){ noiseHit(0.07, 0.16); },
  faint(){ tone(400,0.3,'sawtooth',0.16,-320); },
  throwBall(){ tone(300,0.16,'square',0.12, 420); },
  shake(){ tone(200,0.06,'square',0.13,-60); },
  catch(){ tone(150,0.2,'square',0.14,-80); tone(520,0.1,'square',0.1,0,0.25); tone(780,0.2,'square',0.1,0,0.33); },
  run(){ noiseHit(0.15,0.18); tone(700,0.12,'square',0.08,-300); },
  cry(){ tone(900,0.5,'sawtooth',0.16,-500); tone(1400,0.3,'square',0.08,-700,0.08); },
  machine(){ [700,900,700,1100,1400].forEach((f,i)=>tone(f,0.09,'square',0.1,0,i*0.12)); },
  monCry(){ tone(600,0.18,'square',0.14,-250); },
  swoosh(){ noiseHit(0.1,0.12); },
};
SND.sfx = function(name){ if(SND.ctx && SFX[name]) SFX[name](); };
