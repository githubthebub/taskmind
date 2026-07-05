/* =========================================================
   Haven — session player & urge-surfing (SOS) flow
   ========================================================= */

/* ---------- tiny DOM + speech helpers (shared with app.js) ---------- */

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function pick(textOrMap) {
  if (typeof textOrMap === 'string') return textOrMap;
  const c = State.profile.companion || 'sera';
  return textOrMap[c] || textOrMap.sera;
}

/* stable key for a spoken line — must match tools/voice-corpus.js */
function lineKey(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

let _voiceAudio = null;
let _voiceDone = null;   // resolver of the in-flight speak() promise

function _resolveVoice() {
  if (_voiceDone) { const r = _voiceDone; _voiceDone = null; r(); }
  Ambient.duck(false);
}

function stopSpeech() {
  if (_voiceAudio) { _voiceAudio.pause(); _voiceAudio = null; }
  if (window.speechSynthesis) speechSynthesis.cancel();
  _resolveVoice();
}

function speakSynth(text, res) {
  if (!window.speechSynthesis) { res(); return; }
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.86; u.pitch = 1.0; u.volume = 0.9;
  u.onend = u.onerror = () => res();
  speechSynthesis.speak(u);
}

/* Speak with the companion's pre-generated AI voice clip when the library
   has it (local file first, then the hosted copy), else fall back to the
   browser's speech synthesis. Nothing is generated at runtime.
   Returns { spoke, done } — done resolves when the line has finished. */
function speak(text, cidOverride) {
  if (!State.data.settings.voice) return { spoke: false, done: Promise.resolve() };
  stopSpeech();
  const cid = cidOverride || State.profile.companion || 'sera';
  const lib = (typeof VOICE_LIB !== 'undefined' && VOICE_LIB[cid]) || null;
  const key = lineKey(text);
  const done = new Promise(res => { _voiceDone = res; });
  const finish = () => _resolveVoice();
  Ambient.duck(true);

  if (lib && lib[key]) {
    const audio = new Audio();
    _voiceAudio = audio;
    let stage = 0;                                  // 0 = local file, 1 = hosted
    audio.onended = () => { if (audio === _voiceAudio) finish(); };
    audio.onerror = () => {
      if (audio !== _voiceAudio) return;
      if (stage === 0) { stage = 1; audio.src = lib[key]; audio.play().catch(() => {}); }
      else speakSynth(text, finish);
    };
    const ext = (lib[key].split('.').pop() || 'mp3').split('?')[0];
    audio.src = `assets/voice/${cid}/${key}.${ext}`;
    audio.play().catch(() => {});
    return { spoke: true, done };
  }
  speakSynth(text, finish);
  return { spoke: true, done };
}

/* ---------- ambient sound bed ----------
   Procedural brown noise through a slow lowpass — a distant-tide texture.
   The filter opens with the inhale and settles with the exhale; the whole
   bed ducks while a companion is speaking. No audio assets, no cost. */
const Ambient = {
  ctx: null, gain: null, filter: null, running: false,

  start() {
    if (State.data.settings.ambient === false) return;
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        const len = this.ctx.sampleRate * 4;
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        let last = 0;
        for (let i = 0; i < len; i++) {
          const white = Math.random() * 2 - 1;
          last = (last + 0.02 * white) / 1.02;
          d[i] = last * 3.5;
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buf; src.loop = true;
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass'; this.filter.frequency.value = 320; this.filter.Q.value = 0.4;
        this.gain = this.ctx.createGain();
        this.gain.gain.value = 0;
        src.connect(this.filter); this.filter.connect(this.gain); this.gain.connect(this.ctx.destination);
        src.start();
      }
      this.ctx.resume();
      this.running = true;
      this.gain.gain.setTargetAtTime(0.05, this.ctx.currentTime, 2);
    } catch (e) { /* no audio available — silence is also calm */ }
  },

  stop() {
    if (this.gain) this.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.8);
    this.running = false;
  },

  setBreath(v) {
    if (this.running && this.filter) {
      this.filter.frequency.setTargetAtTime(280 + 260 * v, this.ctx.currentTime, 0.15);
    }
  },

  duck(speaking) {
    if (this.running && this.gain) {
      this.gain.gain.setTargetAtTime(speaking ? 0.018 : 0.05, this.ctx.currentTime, 0.4);
    }
  }
};

/* ---------- screen wake lock (sessions run eyes-closed) ---------- */
const Wake = {
  lock: null,
  async on() {
    try { this.lock = await (navigator.wakeLock && navigator.wakeLock.request('screen')); }
    catch (e) { this.lock = null; }
  },
  off() {
    try { if (this.lock) this.lock.release(); } catch (e) { /* already gone */ }
    this.lock = null;
  }
};

function pulse() { if (navigator.vibrate) navigator.vibrate(12); }

function typewrite(node, text, msPerChar, done) {
  node.textContent = '';
  const cursor = el('<span class="cursor"></span>');
  node.appendChild(cursor);
  let i = 0;
  const step = () => {
    if (!node.isConnected) return;                 // screen was torn down
    if (i < text.length) {
      cursor.before(document.createTextNode(text[i++]));
      setTimeout(step, msPerChar);
    } else {
      cursor.remove();
      if (done) done();
    }
  };
  step();
}

function setBreathVar(v) {
  const clamped = Math.max(0, Math.min(1, v));
  document.documentElement.style.setProperty('--breath', String(clamped));
  Ambient.setBreath(clamped);
}

function fmtMoney(n) {
  return '$' + (Math.round(n * 100) / 100).toLocaleString();
}

/* ---------- tension slider component ---------- */

function tensionSlider(label, initial, onChange) {
  const wrap = el(`
    <div class="card stack">
      <div class="spread">
        <h3>${label}</h3>
        <span class="accent" style="font-family:var(--serif);font-size:1.5rem" data-val>${initial}</span>
      </div>
      <input type="range" min="0" max="10" step="1" value="${initial}">
      <div class="spread faint"><span>loose · calm</span><span>wound tight</span></div>
    </div>`);
  const input = wrap.querySelector('input');
  const val = wrap.querySelector('[data-val]');
  const paint = () => {
    input.style.setProperty('--fill', (input.value / 10 * 100) + '%');
    val.textContent = input.value;
    if (onChange) onChange(Number(input.value));
  };
  input.addEventListener('input', paint);
  paint();
  return wrap;
}

/* =========================================================
   Session player
   ========================================================= */

const Session = {
  active: null,

  start(practice) {
    const c = State.companion;
    this.active = { practice, before: null, after: null, cancelled: false, engine: null };
    const app = document.getElementById('app');
    app.innerHTML = '';
    document.getElementById('sosBtn').classList.add('hidden');

    /* --- pre check-in --- */
    let tension = 5;
    const pre = el(`
      <div class="screen stack">
        <div class="topbar">
          <span class="brand">${practice.title}</span>
          <button class="linklike" data-x>close</button>
        </div>
        <p class="dim">${pick(c.greetings[App.timeOfDay()])}</p>
      </div>`);
    pre.appendChild(tensionSlider('How wound up are you right now?', tension, v => tension = v));
    const go = el('<button class="btn wide">Begin</button>');
    pre.appendChild(go);
    pre.querySelector('[data-x]').onclick = () => this.abort();
    go.onclick = () => {
      this.active.before = tension;
      Ambient.start();
      Wake.on();
      this._run();
    };
    app.appendChild(pre);
  },

  abort() {
    if (this.active && this.active.engine) this.active.engine.stop();
    stopSpeech();
    this.active = null;
    setBreathVar(0);
    App.home();
  },

  _stage() {
    const c = State.companion;
    const app = document.getElementById('app');
    app.innerHTML = '';
    const stage = el(`
      <div class="screen stack" style="align-items:center; text-align:center;">
        <div class="topbar" style="width:100%; text-align:left;">
          <span class="brand">${this.active.practice.title}</span>
          <span class="row" style="gap:14px">
            <button class="linklike" data-voice>${State.data.settings.voice ? 'voice on' : 'voice off'}</button>
            <button class="linklike" data-amb>${State.data.settings.ambient === false ? 'sound off' : 'sound on'}</button>
            <button class="linklike" data-x>end</button>
          </span>
        </div>
        <div class="portrait-wrap" style="width:min(50vw,190px)">
          <div class="portrait-glow"></div>
          ${App.portraitImg(c, 'portrait')}
        </div>
        <div class="bubble" data-bubble style="width:100%"></div>
        <div data-zone style="width:100%"></div>
      </div>`);
    stage.querySelector('[data-x]').onclick = () => this.abort();
    const vbtn = stage.querySelector('[data-voice]');
    vbtn.onclick = () => {
      State.data.settings.voice = !State.data.settings.voice;
      State.save();
      vbtn.textContent = State.data.settings.voice ? 'voice on' : 'voice off';
      if (!State.data.settings.voice) stopSpeech();
    };
    const abtn = stage.querySelector('[data-amb]');
    abtn.onclick = () => {
      State.data.settings.ambient = State.data.settings.ambient === false;
      State.save();
      abtn.textContent = State.data.settings.ambient ? 'sound on' : 'sound off';
      if (State.data.settings.ambient) Ambient.start(); else Ambient.stop();
    };
    app.appendChild(stage);
    return {
      bubble: stage.querySelector('[data-bubble]'),
      zone: stage.querySelector('[data-zone]')
    };
  },

  _run() {
    const steps = this.active.practice.script;
    const ui = this._stage();
    let ix = 0;

    const next = () => {
      if (!this.active) return;
      if (ix >= steps.length) return this._finish();
      const step = steps[ix++];
      if (step.t === 'say')    return this._say(ui, step, next);
      if (step.t === 'breath') return this._breath(ui, step, next);
      if (step.t === 'still')  return this._still(ui, step, next);
      if (step.t === 'scan')   return this._scan(ui, step, next);
      if (step.t === 'choose') return this._choose(ui, step, next);
      next();
    };
    next();
  },

  _say(ui, step, next) {
    ui.zone.innerHTML = '';
    const text = pick(step.text);
    const voice = speak(text);
    typewrite(ui.bubble, text, 34, () => {
      const hold = step.hold != null ? step.hold : Math.max(2200, text.length * 42);
      const proceed = () => { if (this.active) next(); };
      if (voice.spoke) {
        // pace to the voice: advance shortly after the companion finishes,
        // with a generous safety timeout in case audio stalls
        let advanced = false;
        const go = () => { if (!advanced) { advanced = true; setTimeout(proceed, 800); } };
        voice.done.then(go);
        setTimeout(go, hold + 15000);
      } else {
        setTimeout(proceed, hold);
      }
    });
  },

  /* interactive fork: companion asks, you pick, they respond */
  _choose(ui, step, next) {
    ui.zone.innerHTML = '';
    speak(step.prompt);
    typewrite(ui.bubble, step.prompt, 32, null);
    const chips = el('<div class="chips" style="justify-content:center"></div>');
    step.options.forEach(opt => {
      const ch = el(`<button class="chip">${opt.label}</button>`);
      ch.onclick = () => {
        chips.querySelectorAll('.chip').forEach(x => { x.disabled = true; x.classList.remove('on'); });
        ch.classList.add('on');
        const voice = speak(opt.reply);
        typewrite(ui.bubble, opt.reply, 32, () => {
          const hold = Math.max(2600, opt.reply.length * 40);
          const proceed = () => { if (this.active) next(); };
          if (voice.spoke) {
            let advanced = false;
            const go = () => { if (!advanced) { advanced = true; setTimeout(proceed, 900); } };
            voice.done.then(go);
            setTimeout(go, hold + 15000);
          } else {
            setTimeout(proceed, hold);
          }
        });
      };
      chips.appendChild(ch);
    });
    ui.zone.appendChild(chips);
  },

  _still(ui, step, next) {
    ui.zone.innerHTML = '';
    ui.bubble.textContent = step.text;
    speak(step.text);
    const bar = el(`<div class="card"><div class="faint" style="text-align:center" data-t></div></div>`);
    ui.zone.appendChild(bar);
    let left = step.secs;
    const t = bar.querySelector('[data-t]');
    const tick = () => {
      if (!this.active) return;
      t.textContent = left > 0 ? `${left}s of quiet` : '';
      if (left-- > 0) setTimeout(tick, 1000); else next();
    };
    tick();
  },

  _breath(ui, step, next) {
    const pattern = PATTERNS[step.pattern];
    ui.zone.innerHTML = '';
    ui.bubble.textContent = pattern.phases[0].cue;

    const R = 108, CIRC = 2 * Math.PI * R;
    const ring = el(`
      <div class="breath-stage">
        <div class="ring-wrap">
          <div class="ring-orb"></div>
          <svg viewBox="0 0 230 230">
            <circle class="ring-track" cx="115" cy="115" r="${R}"></circle>
            <circle class="ring-fill" cx="115" cy="115" r="${R}"
                    stroke-dasharray="${CIRC}" stroke-dashoffset="${CIRC}"></circle>
          </svg>
          <div class="ring-core">
            <div class="phase-name" data-phase>Ready</div>
            <div class="phase-count" data-count></div>
          </div>
        </div>
      </div>`);
    ui.zone.appendChild(ring);

    const fill = ring.querySelector('.ring-fill');
    const phaseEl = ring.querySelector('[data-phase]');
    const countEl = ring.querySelector('[data-count]');
    let coachIx = 0;
    let lastFullness = 0;

    const engine = new BreathEngine(pattern, step.cycles, {
      onPhase: (phase, cycle, cycles) => {
        phaseEl.textContent = phase.name;
        countEl.textContent = `breath ${cycle + 1} of ${cycles}`;
        pulse();
      },
      onProgress: (frac, phase) => {
        lastFullness = breathFullness(frac, phase, lastFullness);
        setBreathVar(lastFullness);
        fill.style.strokeDashoffset = String(CIRC * (1 - lastFullness));
      },
      onCycle: () => {
        if (step.coach && coachIx < step.coach.length) {
          const line = step.coach[coachIx++];
          ui.bubble.textContent = line;
          speak(line);
        }
      },
      onDone: () => { setBreathVar(0); if (this.active) next(); }
    });
    this.active.engine = engine;
    engine.start();
  },

  _scan(ui, step, next) {
    ui.zone.innerHTML = '';
    const prog = el(`
      <div class="card stack">
        <div class="spread">
          <h3 data-region></h3>
          <span class="faint" data-ix></span>
        </div>
        <div style="height:5px;border-radius:3px;background:rgba(255,255,255,.1);overflow:hidden">
          <div data-bar style="height:100%;width:0;background:var(--accent);transition:width 1s linear"></div>
        </div>
      </div>`);
    ui.zone.appendChild(prog);
    const regionEl = prog.querySelector('[data-region]');
    const ixEl = prog.querySelector('[data-ix]');
    const barEl = prog.querySelector('[data-bar]');

    let r = 0;
    const runRegion = () => {
      if (!this.active) return;
      if (r >= step.regions.length) return next();
      const region = step.regions[r];
      regionEl.textContent = region.name;
      ixEl.textContent = `${r + 1} / ${step.regions.length}`;
      speak(region.text);
      typewrite(ui.bubble, region.text, 30, null);
      barEl.style.width = '0%';
      let elapsed = 0;
      const tick = () => {
        if (!this.active) return;
        elapsed++;
        barEl.style.width = Math.min(100, elapsed / region.secs * 100) + '%';
        if (elapsed < region.secs) setTimeout(tick, 1000);
        else { r++; runRegion(); }
      };
      setTimeout(tick, 1000);
    };
    runRegion();
  },

  _finish() {
    const c = State.companion;
    const p = this.active.practice;
    const before = this.active.before;
    const app = document.getElementById('app');
    app.innerHTML = '';

    let after = Math.max(0, (before != null ? before : 5) - 2);
    const doneScreen = el(`
      <div class="screen stack">
        <h2>And… back.</h2>
        <p class="dim">Before you go — same question, honest answer.</p>
      </div>`);
    doneScreen.appendChild(tensionSlider('How wound up are you now?', after, v => after = v));
    const save = el('<button class="btn wide">Done</button>');
    doneScreen.appendChild(save);
    app.appendChild(doneScreen);

    save.onclick = () => {
      State.logSession(p.id, p.minutes, before, after);
      const delta = before - after;
      const farewell = c.farewells[Math.floor((State.data.sessions.length - 1) % c.farewells.length)];
      app.innerHTML = '';
      const gem = GEMS[Math.floor(Math.random() * GEMS.length)];
      const out = el(`
        <div class="screen stack" style="text-align:center; align-items:center;">
          <div class="portrait-wrap" style="width:min(46vw,170px)">
            <div class="portrait-glow" style="--breath:.35"></div>
            ${App.portraitImg(c, 'portrait ambient')}
          </div>
          <h2>${delta > 0 ? `Tension down ${delta} point${delta === 1 ? '' : 's'}.` : delta === 0 ? 'You showed up. That counts.' : 'Some days are like that. Showing up still counts.'}</h2>
          <div class="bubble" style="width:100%" data-bye></div>
          <div class="card fade-slow" style="width:100%"><p class="dim" style="font-style:italic; font-family:var(--serif); font-size:1rem">“${gem}”</p></div>
          <button class="btn wide" data-home>Close &amp; go live your life</button>
        </div>`);
      app.appendChild(out);
      speak(farewell);
      typewrite(out.querySelector('[data-bye]'), farewell, 34, null);
      out.querySelector('[data-home]').onclick = () => { this.active = null; App.home(); };
    };
  }
};

/* =========================================================
   SOS — urge surfing
   ========================================================= */

const Surf = {
  start() {
    const c = State.companion;
    const app = document.getElementById('app');
    document.getElementById('sosBtn').classList.add('hidden');
    app.innerHTML = '';
    const log = { type: null, spot: null, before: 7, after: null, avoided: 0 };

    /* step 1: acknowledge + name it */
    const s1 = el(`
      <div class="screen stack">
        <div class="topbar"><span class="brand">The Pull</span><button class="linklike" data-x>close</button></div>
        <div class="bubble" data-b></div>
        <div class="stack">
          <h3>What is it pulling you toward?</h3>
          <div class="chips" data-chips></div>
        </div>
      </div>`);
    s1.querySelector('[data-x]').onclick = () => App.home();
    const opener = pick(SURF_OPENER);
    typewrite(s1.querySelector('[data-b]'), opener, 30, null);
    speak(opener);
    const chips = s1.querySelector('[data-chips]');
    URGE_TYPES.forEach(u => {
      const ch = el(`<button class="chip">${u.label}</button>`);
      ch.onclick = () => { log.type = u.id; this._step2(log); };
      chips.appendChild(ch);
    });
    app.appendChild(s1);
  },

  _step2(log) {
    const app = document.getElementById('app');
    app.innerHTML = '';
    let intensity = 7;
    const s2 = el(`
      <div class="screen stack">
        <div class="topbar"><span class="brand">The Pull</span><button class="linklike" data-x>close</button></div>
        <div class="stack">
          <h3>Where do you feel it in your body?</h3>
          <p class="dim">Urges are physical. Finding the sensation is how you get upstream of it.</p>
          <div class="chips" data-spots></div>
        </div>
      </div>`);
    s2.querySelector('[data-x]').onclick = () => App.home();
    s2.appendChild(tensionSlider('How strong is it?', intensity, v => intensity = v));
    const go = el('<button class="btn wide" disabled>Ride the wave</button>');
    const spots = s2.querySelector('[data-spots]');
    BODY_SPOTS.forEach(name => {
      const ch = el(`<button class="chip">${name}</button>`);
      ch.onclick = () => {
        spots.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
        ch.classList.add('on');
        log.spot = name;
        go.disabled = false;
      };
      spots.appendChild(ch);
    });
    s2.appendChild(go);
    go.onclick = () => { log.before = intensity; this._wave(log); };
    app.appendChild(s2);
  },

  _wave(log) {
    const app = document.getElementById('app');
    app.innerHTML = '';
    const TOTAL = 96;   // 8 breaths at 12s
    const s3 = el(`
      <div class="screen stack">
        <div class="topbar"><span class="brand">Riding it out</span><span class="faint">don't switch apps — that's the wave talking</span></div>
        <div class="wave-stage">
          <div class="wave-timer" data-t>90</div>
          <svg class="w1" viewBox="0 0 1200 100" preserveAspectRatio="none">
            <path d="M0 60 Q 75 20 150 60 T 300 60 T 450 60 T 600 60 T 750 60 T 900 60 T 1050 60 T 1200 60 V100 H0 Z" fill="var(--accent)"/>
          </svg>
          <svg class="w2" viewBox="0 0 1200 100" preserveAspectRatio="none">
            <path d="M0 65 Q 100 35 200 65 T 400 65 T 600 65 T 800 65 T 1000 65 T 1200 65 V100 H0 Z" fill="var(--accent)"/>
          </svg>
        </div>
        <div class="bubble" data-b></div>
        <div class="breath-stage">
          <div class="ring-wrap" style="width:170px;height:170px">
            <div class="ring-orb" style="width:96px;height:96px;margin:-48px 0 0 -48px"></div>
            <svg viewBox="0 0 230 230">
              <circle class="ring-track" cx="115" cy="115" r="108"></circle>
              <circle class="ring-fill" cx="115" cy="115" r="108"
                      stroke-dasharray="${2 * Math.PI * 108}" stroke-dashoffset="${2 * Math.PI * 108}"></circle>
            </svg>
            <div class="ring-core"><div class="phase-name" data-phase style="font-size:1.1rem">In</div></div>
          </div>
        </div>
      </div>`);
    app.appendChild(s3);

    const bubble = s3.querySelector('[data-b]');
    const timerEl = s3.querySelector('[data-t]');
    const fill = s3.querySelector('.ring-fill');
    const phaseEl = s3.querySelector('[data-phase]');
    const CIRC = 2 * Math.PI * 108;

    let lineIx = 0, lastFullness = 0, left = TOTAL, alive = true;

    const showLine = () => {
      if (!alive || lineIx >= SURF_LINES.length) return;
      const line = SURF_LINES[lineIx++];
      bubble.textContent = line;
      speak(line);
    };
    showLine();

    Ambient.start();
    Wake.on();
    const engine = new BreathEngine(PATTERNS.surf, 8, {
      onPhase: p => { phaseEl.textContent = p.name; pulse(); },
      onProgress: (frac, phase) => {
        lastFullness = breathFullness(frac, phase, lastFullness);
        setBreathVar(lastFullness);
        fill.style.strokeDashoffset = String(CIRC * (1 - lastFullness));
      },
      onCycle: showLine,
      onDone: () => { alive = false; setBreathVar(0); this._after(log); }
    });

    const countdown = () => {
      if (!alive) return;
      timerEl.textContent = String(Math.max(0, left--));
      if (left >= 0) setTimeout(countdown, 1000);
    };
    countdown();
    engine.start();
  },

  _after(log) {
    const app = document.getElementById('app');
    app.innerHTML = '';
    let after = Math.max(0, log.before - 3);
    const s4 = el(`
      <div class="screen stack">
        <h2>The wave broke.</h2>
        <p class="dim">You just watched an urge peak without obeying it. That circuit is now slightly weaker. Rate it again:</p>
      </div>`);
    s4.appendChild(tensionSlider('How strong is the pull now?', after, v => after = v));

    const type = URGE_TYPES.find(u => u.id === log.type);
    let moneyRow = null;
    if (type && type.spend) {
      moneyRow = el(`
        <div class="card stack">
          <h3>What would that have cost you?</h3>
          <p class="faint">Honest guess. This money is now redirected to your actual life.</p>
          <div class="chips" data-m>
            <button class="chip" data-v="5">$5</button>
            <button class="chip" data-v="20">$20</button>
            <button class="chip" data-v="50">$50</button>
            <button class="chip" data-v="100">$100</button>
            <button class="chip on" data-v="0">Nothing</button>
          </div>
        </div>`);
      moneyRow.querySelectorAll('.chip').forEach(ch => {
        ch.onclick = () => {
          moneyRow.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
          ch.classList.add('on');
          log.avoided = Number(ch.dataset.v);
        };
      });
      s4.appendChild(moneyRow);
    }

    const done = el('<button class="btn wide">Log it &amp; close</button>');
    s4.appendChild(done);
    done.onclick = () => {
      log.after = after;
      State.logUrge(log);
      const c = State.companion;
      app.innerHTML = '';
      const closeLine = pick(SURF_CLOSER);
      const gem = GEMS[Math.floor(Math.random() * GEMS.length)];
      const goalName = State.profile.goalName;
      const goalAmount = State.profile.goalAmount || 0;
      const out = el(`
        <div class="screen stack" style="text-align:center;align-items:center;">
          <div class="stat" style="min-width:200px">
            <div class="num">${State.urgesSurfed()}</div>
            <div class="lbl">waves surfed, total</div>
          </div>
          ${log.avoided ? `<div class="stat" style="min-width:200px"><div class="num">${fmtMoney(State.moneyRedirected())}</div><div class="lbl">${goalName && goalAmount ? `toward ${goalName} — ${Math.min(100, Math.round(State.moneyRedirected() / goalAmount * 100))}% there` : 'redirected to your real life, total'}</div></div>` : ''}
          <div class="bubble" style="width:100%" data-b></div>
          <div class="card fade-slow" style="width:100%"><p class="dim" style="font-style:italic; font-family:var(--serif); font-size:1rem">“${gem}”</p></div>
          <button class="btn wide" data-h>Close &amp; go live your life</button>
        </div>`);
      app.appendChild(out);
      speak(closeLine);
      typewrite(out.querySelector('[data-b]'), closeLine, 32, null);
      out.querySelector('[data-h]').onclick = () => App.home();
    };
    app.appendChild(s4);
  }
};
