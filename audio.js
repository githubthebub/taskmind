// ============================================================
// POKeMON FRLG: SEVII EDITION - chiptune music engine
// Original compositions, synthesized live with WebAudio.
// ============================================================

'use strict';

const MUSIC = (() => {
  let ctx = null, master = null;
  let currentName = null, loopTimer = null, liveNodes = [];
  let muted = false;

  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freq(n) {
    // e.g. 'C4', 'F#3', 'Bb2'
    const m = /^([A-G])([#b]?)(\d)$/.exec(n);
    if (!m) return 0;
    let s = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    const midi = (Number(m[3]) + 1) * 12 + s;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Notes are [name|null, eighth-beats]. All channels in a track share total length.
  const TRACKS = {
    title: {
      tempo: 100, loop: true,
      ch: [
        { wave: 'square', vol: 0.030, notes: [
          ['E4',2],['G4',2],['B4',3],[null,1],['A4',2],['G4',2],['E4',3],[null,1],
          ['D4',2],['E4',2],['G4',3],[null,1],['E4',6],[null,2],
        ]},
        { wave: 'triangle', vol: 0.050, notes: [
          ['E2',4],['B2',4],['C3',4],['G2',4],['A2',4],['E2',4],['B2',4],['E2',4],
        ]},
      ],
    },
    overworld: {
      tempo: 126, loop: true,
      ch: [
        { wave: 'square', vol: 0.032, notes: [
          ['E5',1],[null,1],['G5',1],[null,1],['C6',3],[null,1],
          ['A5',1],['G5',1],['A5',1],[null,1],['G5',2],['E5',2],
          ['F5',1],[null,1],['A5',1],[null,1],['G5',2],['E5',1],[null,1],
          ['D5',1],['E5',1],['D5',1],[null,1],['C5',4],
        ]},
        { wave: 'triangle', vol: 0.055, notes: [
          ['C3',2],['G3',2],['C4',2],['G3',2],['A2',2],['E3',2],['A3',2],['E3',2],
          ['F3',2],['C4',2],['F3',2],['C4',2],['G3',2],['D4',2],['G3',2],['B3',2],
        ]},
      ],
    },
    interior: {
      tempo: 96, loop: true,
      ch: [
        { wave: 'square', vol: 0.026, notes: [
          ['A4',2],['C5',2],['F5',3],[null,1],['G5',2],['F5',2],['C5',3],[null,1],
          ['D5',2],['C5',2],['A4',3],[null,1],['G4',2],['A4',2],['F4',3],[null,1],
        ]},
        { wave: 'triangle', vol: 0.050, notes: [
          ['F3',4],['C4',4],['A3',4],['C4',4],['G3',4],['C4',4],['F3',4],['C3',4],
        ]},
      ],
    },
    summit: {
      tempo: 112, loop: true,
      ch: [
        { wave: 'square', vol: 0.030, notes: [
          ['A4',2],['C5',2],['E5',3],['D5',1],['C5',2],['B4',2],['E4',3],[null,1],
          ['F4',2],['A4',2],['D5',3],['C5',1],['B4',2],['G#4',2],['A4',3],[null,1],
        ]},
        { wave: 'triangle', vol: 0.055, notes: [
          ['A2',2],['E3',2],['A2',2],['E3',2],['E2',2],['B2',2],['E2',2],['B2',2],
          ['D3',2],['A3',2],['D3',2],['A3',2],['E3',2],['E2',2],['A2',2],['E3',2],
        ]},
      ],
    },
    battle: {
      tempo: 152, loop: true,
      ch: [
        { wave: 'square', vol: 0.032, notes: [
          ['A4',1],['A4',1],['C5',1],['A4',1],['E5',2],['D5',1],['C5',1],
          ['D5',1],['D5',1],['F5',1],['D5',1],['A5',2],['G5',1],['F5',1],
          ['E5',1],['E5',1],['G5',1],['E5',1],['B5',2],['A5',1],['G5',1],
          ['A5',2],['E5',2],['C5',2],['D5',1],['B4',1],
        ]},
        { wave: 'triangle', vol: 0.060, notes: [
          ['A2',1],['A3',1],['A2',1],['A3',1],['A2',1],['A3',1],['A2',1],['A3',1],
          ['D3',1],['D4',1],['D3',1],['D4',1],['D3',1],['D4',1],['D3',1],['D4',1],
          ['E3',1],['E4',1],['E3',1],['E4',1],['E3',1],['E4',1],['E3',1],['E4',1],
          ['A2',1],['A3',1],['A2',1],['A3',1],['E3',1],['E4',1],['A2',1],['A3',1],
        ]},
      ],
    },
    victory: {
      tempo: 138, loop: true,
      ch: [
        { wave: 'square', vol: 0.034, notes: [
          ['C5',1],['C5',1],['C5',1],['C5',2],['G4',2],['E5',3],
          ['G5',4],['E5',2],['G5',2],['C6',6],[null,2],
          ['A5',2],['G5',2],['E5',2],['G5',2],['C5',6],[null,2],
        ]},
        { wave: 'triangle', vol: 0.055, notes: [
          ['C3',4],['G3',4],['C3',4],['E3',4],['C3',4],['G3',4],['F3',4],['G3',4],
          ['A3',4],['E3',4],['F3',4],['G3',4],
        ]},
      ],
    },
  };

  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(ctx.destination);
      return true;
    } catch (e) { return false; }
  }

  function noteOn(wave, f, when, dur, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = wave; o.frequency.value = f;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.012);
    g.gain.setValueAtTime(vol, when + Math.max(0.012, dur - 0.05));
    g.gain.linearRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(master);
    o.start(when); o.stop(when + dur + 0.02);
    liveNodes.push(o);
    if (liveNodes.length > 220) liveNodes.splice(0, 100);
  }

  function scheduleTrack(track, when, name) {
    const spb = 60 / track.tempo / 2; // seconds per eighth
    let loopLen = 0;
    for (const chn of track.ch) {
      let tc = when;
      for (const [n, len] of chn.notes) {
        const dur = len * spb;
        if (n) noteOn(chn.wave, freq(n), tc, dur * 0.92, chn.vol);
        tc += dur;
      }
      loopLen = Math.max(loopLen, tc - when);
    }
    if (track.loop) {
      loopTimer = setTimeout(() => {
        if (currentName === name) scheduleTrack(track, when + loopLen, name);
      }, (when + loopLen - ctx.currentTime - 0.25) * 1000);
    }
  }

  function stop() {
    currentName = null;
    if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
    for (const o of liveNodes) { try { o.stop(); } catch (e) { /* already stopped */ } }
    liveNodes = [];
  }

  function play(name) {
    if (!ensure()) return;
    if (currentName === name) return;
    stop();
    const track = TRACKS[name];
    if (!track) return;
    currentName = name;
    scheduleTrack(track, ctx.currentTime + 0.06, name);
  }

  function toggleMute() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 1;
    return muted;
  }

  return { play, stop, toggleMute, ensure, get current() { return currentName; }, get muted() { return muted; } };
})();
