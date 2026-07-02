/* ============================================================
   VELVET — app shell, practice engine, journal
   ============================================================ */

import { SESSIONS, LEARN } from './data.js';
import { sound } from './audio.js';

const $ = sel => document.querySelector(sel);
const app = $('#app');

/* ---------- persistence ---------- */

const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch (_) { return fallback; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
};

const settings = Object.assign(
  { voice: true, sound: true, haptics: true, volume: 0.7, reduceMotion: false },
  store.get('velvet.settings', {})
);
function saveSettings() { store.set('velvet.settings', settings); }

sound.voiceEnabled = settings.voice;
sound.enabled = settings.sound;
sound.volume = settings.volume;

/* ---------- journal ---------- */

function journal() { return store.get('velvet.journal', []); }
function addEntry(entry) {
  const j = journal();
  j.unshift(entry);
  store.set('velvet.journal', j.slice(0, 500));
}

function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function streak() {
  const days = new Set(journal().map(e => dayKey(e.ts)));
  if (!days.size) return 0;
  let count = 0;
  const cursor = new Date();
  // today counts if practiced; otherwise start from yesterday
  if (!days.has(dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dayKey(cursor.getTime()))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

/* ---------- tiny view helpers ---------- */

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
}
function fmtTime(sec) {
  sec = Math.max(0, Math.round(sec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

function show(screenEl) {
  app.replaceChildren(screenEl);
  window.scrollTo(0, 0);
}

/* ============================================================
   SCREENS
   ============================================================ */

/* ---------- consent gate ---------- */

function maybeConsent(next) {
  if (store.get('velvet.consented', false)) return next();
  const s = el(`
    <section class="screen consent">
      <div class="consent-card">
        <div class="logo-mark" aria-hidden="true"></div>
        <h1>Velvet</h1>
        <p class="tagline">Breath-based somatic practice for full-body aliveness.</p>
        <ul class="consent-points">
          <li>Sessions use breath, gentle movement and attention — nothing else is required.</li>
          <li>Intense breathwork isn’t suitable during pregnancy or with heart, seizure or panic conditions.</li>
          <li>Practice seated or lying down, never while driving or in water.</li>
          <li>This is a wellbeing practice for adults, not medical advice.</li>
        </ul>
        <button class="btn primary" id="consent-go">I understand — begin</button>
      </div>
    </section>`);
  s.querySelector('#consent-go').onclick = () => {
    store.set('velvet.consented', true);
    next();
  };
  show(s);
}

/* ---------- tab nav ---------- */

function nav(active) {
  const n = el(`
    <nav class="tabbar" aria-label="Main">
      <button data-tab="home" aria-label="Practice">
        <span class="tab-ic">◉</span>Practice</button>
      <button data-tab="journal" aria-label="Journal">
        <span class="tab-ic">✎</span>Journal</button>
      <button data-tab="learn" aria-label="Learn">
        <span class="tab-ic">✦</span>Learn</button>
      <button data-tab="settings" aria-label="Settings">
        <span class="tab-ic">⚙</span>Settings</button>
    </nav>`);
  n.querySelectorAll('button').forEach(b => {
    if (b.dataset.tab === active) b.classList.add('active');
    b.onclick = () => routes[b.dataset.tab]();
  });
  return n;
}

/* ---------- home ---------- */

function homeScreen() {
  const st = streak();
  const total = journal().length;
  const s = el(`
    <section class="screen">
      <header class="home-head">
        <div>
          <h1>Velvet</h1>
          <p class="sub">Choose tonight’s practice</p>
        </div>
        <div class="streak" title="Daily streak">
          <span class="streak-n">${st}</span>
          <span class="streak-label">day${st === 1 ? '' : 's'}</span>
        </div>
      </header>
      <div class="session-list"></div>
      <p class="foot-note">${total ? `${total} session${total === 1 ? '' : 's'} practiced` :
        'Your body learns these practices the way it learned to swim — by returning.'}</p>
    </section>`);
  const list = s.querySelector('.session-list');
  for (const sess of SESSIONS) {
    const card = el(`
      <button class="session-card" style="--tint:${sess.tint}">
        <div class="card-glow" aria-hidden="true"></div>
        <div class="card-body">
          <div class="card-top">
            <h2>${esc(sess.title)}</h2>
            <span class="pill">${sess.minutes} min · ${esc(sess.level)}</span>
          </div>
          <p>${esc(sess.subtitle)}</p>
        </div>
      </button>`);
    card.onclick = () => detailScreen(sess);
    list.appendChild(card);
  }
  s.appendChild(nav('home'));
  show(s);
}

/* ---------- session detail ---------- */

function detailScreen(sess) {
  const s = el(`
    <section class="screen detail" style="--tint:${sess.tint}">
      <button class="back" aria-label="Back">‹ Back</button>
      <div class="detail-hero">
        <div class="hero-orb" aria-hidden="true"></div>
        <h1>${esc(sess.title)}</h1>
        <p class="sub">${esc(sess.subtitle)}</p>
        <span class="pill">${sess.minutes} min · ${esc(sess.level)}</span>
      </div>
      <p class="detail-desc">${esc(sess.description)}</p>
      <h3 class="phases-h">The journey</h3>
      <ol class="phase-list">
        ${sess.phases.map(p => `
          <li><span class="phase-name">${esc(p.name)}</span>
              <span class="phase-dur">${fmtTime(p.dur)}</span></li>`).join('')}
      </ol>
      <div class="detail-actions">
        <button class="btn primary big" id="begin">Begin</button>
      </div>
    </section>`);
  s.querySelector('.back').onclick = homeScreen;
  s.querySelector('#begin').onclick = () => practiceScreen(sess);
  show(s);
}

/* ============================================================
   PRACTICE ENGINE
   ============================================================ */

let engine = null;

function practiceScreen(sess) {
  const totalDur = sess.phases.reduce((a, p) => a + p.dur, 0);
  const s = el(`
    <section class="screen practice" style="--tint:${sess.tint}">
      <header class="practice-head">
        <button class="icon-btn" id="p-exit" aria-label="End session">✕</button>
        <div class="phase-label" id="p-phase"></div>
        <div class="time-left" id="p-time">${fmtTime(totalDur)}</div>
      </header>

      <div class="orb-stage">
        <svg class="progress-ring" viewBox="0 0 100 100" aria-hidden="true">
          <circle class="ring-bg" cx="50" cy="50" r="47"/>
          <circle class="ring-fg" cx="50" cy="50" r="47" id="p-ring"/>
        </svg>
        <div class="orb-halo" id="p-halo" aria-hidden="true"></div>
        <div class="orb" id="p-orb" aria-hidden="true"></div>
        <div class="breath-word" id="p-word" aria-live="polite">breathe</div>
      </div>

      <p class="cue" id="p-cue" aria-live="polite"></p>

      <footer class="practice-foot">
        <button class="btn ghost" id="p-pause">Pause</button>
      </footer>
    </section>`);

  const ring = s.querySelector('#p-ring');
  const orb = s.querySelector('#p-orb');
  const halo = s.querySelector('#p-halo');
  const word = s.querySelector('#p-word');
  const cueEl = s.querySelector('#p-cue');
  const phaseEl = s.querySelector('#p-phase');
  const timeEl = s.querySelector('#p-time');
  const pauseBtn = s.querySelector('#p-pause');

  const RING_LEN = 2 * Math.PI * 47;
  ring.style.strokeDasharray = RING_LEN;
  ring.style.strokeDashoffset = RING_LEN;

  const state = {
    sess, totalDur,
    phaseIdx: -1,
    phaseT: 0,        // seconds into current phase
    totalT: 0,
    breathT: 0,       // seconds into current breath cycle
    seg: '',          // current breath segment name
    running: true,
    done: false,
    raf: 0,
    last: performance.now(),
    firedCues: new Set(),
    startedAt: Date.now(),
  };
  engine = state;

  function currentPhase() { return sess.phases[state.phaseIdx]; }

  function segments(breath) {
    return [
      ['in', breath.in], ['holdIn', breath.holdIn],
      ['out', breath.out], ['holdOut', breath.holdOut],
    ].filter(([, d]) => d > 0);
  }

  function enterPhase(i) {
    state.phaseIdx = i;
    state.phaseT = 0;
    state.breathT = 0;
    state.firedCues = new Set();
    const p = currentPhase();
    phaseEl.textContent = `${p.name} · ${i + 1}/${sess.phases.length}`;
    halo.style.opacity = 0.35 + p.intensity * 0.65;
    document.documentElement.style.setProperty('--pulse', p.intensity);
    sound.setIntensity(p.intensity);
    if (i > 0) sound.speak(p.name);
  }

  function setCue(text) {
    cueEl.classList.remove('cue-show');
    // force reflow so the animation restarts
    void cueEl.offsetWidth;
    cueEl.textContent = text;
    cueEl.classList.add('cue-show');
    sound.speak(text);
  }

  const WORDS = { in: 'inhale', holdIn: 'hold', out: 'exhale', holdOut: 'rest' };

  function tick(now) {
    if (!state.running || state.done) return;
    const dt = Math.min(0.1, (now - state.last) / 1000);
    state.last = now;
    state.phaseT += dt;
    state.totalT += dt;
    state.breathT += dt;

    const p = currentPhase();

    // ---- phase transition ----
    if (state.phaseT >= p.dur) {
      if (state.phaseIdx + 1 < sess.phases.length) {
        enterPhase(state.phaseIdx + 1);
      } else {
        return finish(true);
      }
    }

    // ---- cues ----
    for (const c of currentPhase().cues) {
      if (state.phaseT >= c.t && !state.firedCues.has(c.t)) {
        state.firedCues.add(c.t);
        setCue(c.text);
      }
    }

    // ---- breath cycle ----
    const segs = segments(currentPhase().breath);
    const cycleLen = segs.reduce((a, [, d]) => a + d, 0);
    let t = state.breathT % cycleLen;
    let segName = 'in', segDur = 1, segPos = 0;
    for (const [name, d] of segs) {
      if (t < d) { segName = name; segDur = d; segPos = t / d; break; }
      t -= d;
    }
    if (segName !== state.seg) {
      state.seg = segName;
      word.textContent = WORDS[segName];
      if (segName === 'in' || segName === 'out') {
        sound.breathCue(segName);
        if (settings.haptics && navigator.vibrate) {
          navigator.vibrate(segName === 'in' ? 30 : [15, 40, 15]);
        }
      }
    }

    // orb scale: 0.62 (empty) .. 1 (full)
    const ease = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    let scale;
    if (segName === 'in') scale = 0.62 + 0.38 * ease(segPos);
    else if (segName === 'holdIn') scale = 1;
    else if (segName === 'out') scale = 1 - 0.38 * ease(segPos);
    else scale = 0.62;
    if (settings.reduceMotion) scale = 0.81;
    orb.style.transform = `scale(${scale.toFixed(4)})`;
    halo.style.transform = `scale(${(scale * 1.15).toFixed(4)})`;

    // progress + clock
    ring.style.strokeDashoffset = RING_LEN * (1 - state.totalT / totalDur);
    timeEl.textContent = fmtTime(totalDur - state.totalT);

    state.raf = requestAnimationFrame(tick);
  }

  function pause() {
    state.running = false;
    cancelAnimationFrame(state.raf);
    sound.suspend();
    sound.stopSpeech();
    pauseBtn.textContent = 'Resume';
    word.textContent = 'paused';
  }
  function resume() {
    state.running = true;
    state.last = performance.now();
    sound.resume();
    pauseBtn.textContent = 'Pause';
    state.raf = requestAnimationFrame(tick);
  }
  pauseBtn.onclick = () => (state.running ? pause() : resume());
  state.pause = pause;

  // keep the screen awake during practice
  let wakeLock = null;
  navigator.wakeLock?.request('screen')
    .then(l => { wakeLock = l; })
    .catch(() => {});

  function onKey(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      state.running ? pause() : resume();
    } else if (e.code === 'Escape') {
      finish(false);
    }
  }
  document.addEventListener('keydown', onKey);

  function finish(completed) {
    if (state.done) return;
    state.done = true;
    document.removeEventListener('keydown', onKey);
    wakeLock?.release().catch(() => {});
    cancelAnimationFrame(state.raf);
    sound.stopSpeech();
    if (completed) sound.chime();
    sound.stop();
    completeScreen(sess, Math.round(state.totalT), completed);
  }

  s.querySelector('#p-exit').onclick = () => finish(false);

  show(s);
  sound.start().then(() => sound.setIntensity(sess.phases[0].intensity, 1));
  enterPhase(0);
  setCue(`${sess.title}. Settle in.`);
  state.last = performance.now();
  state.raf = requestAnimationFrame(tick);
}

/* ---------- completion + rating ---------- */

function completeScreen(sess, seconds, completed) {
  engine = null;
  let glow = 0;
  const s = el(`
    <section class="screen complete" style="--tint:${sess.tint}">
      <div class="complete-orb" aria-hidden="true"></div>
      <h1>${completed ? 'Beautifully done' : 'Session ended'}</h1>
      <p class="sub">${esc(sess.title)} · ${fmtTime(seconds)}</p>
      <h3 class="rate-h">How’s the glow?</h3>
      <div class="glow-row" role="radiogroup" aria-label="Glow rating">
        ${[1, 2, 3, 4, 5].map(n =>
          `<button class="glow-dot" data-n="${n}" role="radio"
             aria-label="${n} of 5" aria-checked="false"></button>`).join('')}
      </div>
      <textarea id="c-note" placeholder="Anything you noticed? (optional)"
        rows="3" maxlength="500"></textarea>
      <div class="detail-actions">
        <button class="btn primary big" id="c-save">Save & finish</button>
      </div>
    </section>`);
  const dots = [...s.querySelectorAll('.glow-dot')];
  dots.forEach(d => d.onclick = () => {
    glow = Number(d.dataset.n);
    dots.forEach(x => {
      const on = Number(x.dataset.n) <= glow;
      x.classList.toggle('on', on);
      x.setAttribute('aria-checked', String(Number(x.dataset.n) === glow));
    });
  });
  s.querySelector('#c-save').onclick = () => {
    addEntry({
      ts: Date.now(),
      sessionId: sess.id,
      title: sess.title,
      seconds,
      completed,
      glow,
      note: s.querySelector('#c-note').value.trim(),
    });
    homeScreen();
  };
  show(s);
}

/* ---------- journal ---------- */

function journalScreen() {
  const entries = journal();
  const totalMin = Math.round(entries.reduce((a, e) => a + e.seconds, 0) / 60);
  const s = el(`
    <section class="screen">
      <header class="home-head">
        <div>
          <h1>Journal</h1>
          <p class="sub">${entries.length
            ? `${entries.length} session${entries.length === 1 ? '' : 's'} · ` +
              `${totalMin} mindful minute${totalMin === 1 ? '' : 's'} · ${streak()}-day streak`
            : 'Your practice history will live here.'}</p>
        </div>
      </header>
      <div class="entry-list"></div>
    </section>`);
  const list = s.querySelector('.entry-list');
  if (!entries.length) {
    list.appendChild(el(`<p class="foot-note">Finish any session and it lands here —
      with your glow rating and notes, so you can watch the practice deepen.</p>`));
  }
  for (const e of entries) {
    const d = new Date(e.ts);
    const when = d.toLocaleDateString(undefined,
      { weekday: 'short', month: 'short', day: 'numeric' }) +
      ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    const sess = SESSIONS.find(x => x.id === e.sessionId);
    list.appendChild(el(`
      <div class="entry" style="--tint:${sess?.tint ?? '#e0637c'}">
        <div class="entry-head">
          <strong>${esc(e.title)}</strong>
          <span class="entry-when">${when}</span>
        </div>
        <div class="entry-meta">
          ${fmtTime(e.seconds)}${e.completed ? '' : ' · ended early'}
          ${e.glow ? ' · ' + '●'.repeat(e.glow) + '○'.repeat(5 - e.glow) : ''}
        </div>
        ${e.note ? `<p class="entry-note">${esc(e.note)}</p>` : ''}
      </div>`));
  }
  s.appendChild(nav('journal'));
  show(s);
}

/* ---------- learn ---------- */

function learnScreen() {
  const s = el(`
    <section class="screen">
      <header class="home-head"><div>
        <h1>Learn</h1>
        <p class="sub">How and why this works</p>
      </div></header>
      <div class="learn-list">
        ${LEARN.map(x => `
          <details class="learn-card">
            <summary>${esc(x.title)}</summary>
            <p>${esc(x.body)}</p>
          </details>`).join('')}
      </div>
    </section>`);
  s.appendChild(nav('learn'));
  show(s);
}

/* ---------- settings ---------- */

function settingsScreen() {
  const s = el(`
    <section class="screen">
      <header class="home-head"><div>
        <h1>Settings</h1>
        <p class="sub">Make it yours</p>
      </div></header>
      <div class="settings-list">
        ${toggleRow('voice', 'Spoken guidance', 'A calm voice reads each cue aloud')}
        ${toggleRow('sound', 'Soundscape', 'Warm synthesized drone + breath tones')}
        ${toggleRow('haptics', 'Haptics', 'Gentle vibration on breath turns (mobile)')}
        ${toggleRow('reduceMotion', 'Reduce motion', 'Keep the orb still')}
        <div class="setting-row">
          <div><strong>Volume</strong><p>Soundscape level</p></div>
          <input type="range" id="set-volume" min="0" max="1" step="0.05"
            value="${settings.volume}" aria-label="Volume">
        </div>
      </div>
      <p class="foot-note">Velvet stores everything on this device only.
        No accounts, no tracking, nothing leaves your browser.</p>
    </section>`);
  function toggleRow(key, label, desc) {
    return `<div class="setting-row">
      <div><strong>${label}</strong><p>${desc}</p></div>
      <button class="switch ${settings[key] ? 'on' : ''}" data-key="${key}"
        role="switch" aria-checked="${settings[key]}" aria-label="${label}"></button>
    </div>`;
  }
  s.querySelectorAll('.switch').forEach(sw => {
    sw.onclick = () => {
      const k = sw.dataset.key;
      settings[k] = !settings[k];
      sw.classList.toggle('on', settings[k]);
      sw.setAttribute('aria-checked', settings[k]);
      saveSettings();
      if (k === 'voice') sound.voiceEnabled = settings.voice;
      if (k === 'sound') sound.setEnabled(settings.sound);
    };
  });
  s.querySelector('#set-volume').oninput = e => {
    settings.volume = Number(e.target.value);
    saveSettings();
    sound.setVolume(settings.volume);
  };
  s.appendChild(nav('settings'));
  show(s);
}

/* ---------- boot ---------- */

const routes = {
  home: homeScreen,
  journal: journalScreen,
  learn: learnScreen,
  settings: settingsScreen,
};

// keep speech voices warm (Chrome loads them async)
window.speechSynthesis?.getVoices();
window.speechSynthesis?.addEventListener?.('voiceschanged', () => {});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && engine?.running) engine.pause();
});

maybeConsent(homeScreen);
