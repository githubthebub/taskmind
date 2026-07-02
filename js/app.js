/* =========================================================================
   Blisswheel — app logic (vanilla JS, localStorage persistence)
   ========================================================================= */

const STORE_KEY = "blisswheel_v1";

const defaultState = () => ({
  name: "",
  wheel: {
    scores: Object.fromEntries(WHEEL_AREAS.map(a => [a.id, 5])),
    targets: Object.fromEntries(WHEEL_AREAS.map(a => [a.id, 8])),
    history: [], // {date, scores}
  },
  goals: [],            // {id, areaId, text, done, createdAt}
  selectedTraits: [],   // trait ids
  actionLog: {},        // { "YYYY-MM-DD": { "traitId:idx": true } }
  checkins: [],         // {date, bliss, energy, tension:[], note}
  journal: [],          // {id, date, lensId, prompt, text}
  values: [],           // top-5 values (Judy Ho lens)
});

let S = loadState();
let activeView = "dashboard";

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed);
  } catch { return defaultState(); }
}
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(S)); }

const todayKey = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const lensById = id => LENSES.find(l => l.id === id);
const areaById = id => WHEEL_AREAS.find(a => a.id === id);
const traitById = id => TRAITS.find(t => t.id === id);

/* ------------------------------ streaks ------------------------------- */

function dayHadActivity(dateKey) {
  const log = S.actionLog[dateKey];
  if (log && Object.values(log).some(Boolean)) return true;
  if (S.checkins.some(c => c.date.slice(0, 10) === dateKey)) return true;
  if (S.journal.some(j => j.date.slice(0, 10) === dateKey)) return true;
  return false;
}

function currentStreak() {
  let streak = 0;
  const d = new Date();
  // today counts if active, but doesn't break the streak if not yet
  if (dayHadActivity(d.toISOString().slice(0, 10))) streak++;
  for (;;) {
    d.setDate(d.getDate() - 1);
    if (dayHadActivity(d.toISOString().slice(0, 10))) streak++;
    else break;
  }
  return streak;
}

/* --------------------------- daily principle --------------------------- */

function dailyPrinciple() {
  const all = LENSES.flatMap(l =>
    l.dailyPrinciples.map(p => ({ text: p, lens: l })));
  const dayNum = Math.floor(Date.now() / 86400000);
  return all[dayNum % all.length];
}

/* ------------------------------ actions -------------------------------- */

function todaysActions() {
  const acts = [];
  for (const tid of S.selectedTraits) {
    const t = traitById(tid);
    if (!t) continue;
    t.actions.forEach((a, i) =>
      acts.push({ key: `${tid}:${i}`, text: a, trait: t }));
  }
  return acts;
}

function toggleAction(key) {
  const day = todayKey();
  S.actionLog[day] = S.actionLog[day] || {};
  S.actionLog[day][key] = !S.actionLog[day][key];
  save();
  render();
}

/* =============================== VIEWS ================================= */

const VIEWS = {
  dashboard: renderDashboard,
  wheel: renderWheel,
  personality: renderPersonality,
  practices: renderPractices,
  journal: renderJournal,
  council: renderCouncil,
  checkin: renderCheckin,
};

function setView(v) {
  stopBreath(); stopScan(); stopMeditation();
  activeView = v;
  render();
}

function render() {
  document.querySelectorAll(".nav-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.view === activeView));
  const root = document.getElementById("view");
  root.innerHTML = "";
  VIEWS[activeView](root);
}

/* ----------------------------- Dashboard ------------------------------- */

function renderDashboard(root) {
  const p = dailyPrinciple();
  const acts = todaysActions();
  const log = S.actionLog[todayKey()] || {};
  const done = acts.filter(a => log[a.key]).length;
  const streak = currentStreak();
  const lastCheckin = S.checkins[S.checkins.length - 1];
  const gaps = WHEEL_AREAS
    .map(a => ({ a, gap: (S.wheel.targets[a.id] ?? 8) - (S.wheel.scores[a.id] ?? 5) }))
    .sort((x, y) => y.gap - x.gap);

  root.innerHTML = `
    <div class="view-head">
      <h1>${greeting()}</h1>
      <p class="sub">Bliss is built daily. Here's today.</p>
    </div>

    <div class="card principle-card" style="--lens:${p.lens.color}">
      <div class="principle-label">Today's principle · ${p.lens.icon} ${esc(p.lens.name)} <span class="muted">(${esc(p.lens.inspiration)})</span></div>
      <div class="principle-text">${esc(p.text)}</div>
    </div>

    <div class="grid-3">
      <div class="card stat-card">
        <div class="stat-num">🔥 ${streak}</div>
        <div class="stat-label">day streak</div>
      </div>
      <div class="card stat-card">
        <div class="stat-num">${acts.length ? `${done}/${acts.length}` : "—"}</div>
        <div class="stat-label">today's practice</div>
      </div>
      <div class="card stat-card">
        <div class="stat-num">${lastCheckin ? lastCheckin.bliss + "/10" : "—"}</div>
        <div class="stat-label">last bliss check-in</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h2>Today's personality practice</h2>
        ${acts.length ? `
          <ul class="action-list">
            ${acts.map(a => `
              <li class="${log[a.key] ? "done" : ""}" onclick="toggleAction('${a.key}')">
                <span class="check">${log[a.key] ? "✓" : ""}</span>
                <span class="action-text">${esc(a.text)}</span>
                <span class="action-trait">${a.trait.icon} ${esc(a.trait.name)}</span>
              </li>`).join("")}
          </ul>` : `
          <p class="muted">No target traits selected yet. Choose who you're becoming in the
          <a href="#" onclick="setView('personality');return false">Personality Studio</a> —
          your daily micro-actions will appear here.</p>`}
      </div>
      <div class="card">
        <h2>Your wheel right now</h2>
        <canvas id="miniWheel" width="340" height="340"></canvas>
        ${gaps[0] && gaps[0].gap > 0 ? `
          <p class="muted center">Biggest gap: <strong>${gaps[0].a.icon} ${esc(gaps[0].a.name)}</strong>
          (${S.wheel.scores[gaps[0].a.id]} → target ${S.wheel.targets[gaps[0].a.id]}).
          <a href="#" onclick="askCouncilFor('${gaps[0].a.id}');return false">Ask the Council about it →</a></p>` : ""}
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h2>Quick reset</h2>
        <p class="muted">90 seconds to a calmer nervous system.</p>
        <div class="btn-row">
          ${BREATH_PATTERNS.slice(0, 3).map(b =>
            `<button class="btn" onclick="setView('practices');setTimeout(()=>startBreath('${b.id}'),50)">${esc(b.name)}</button>`).join("")}
        </div>
      </div>
      <div class="card">
        <h2>Bliss trend</h2>
        <canvas id="blissSpark" width="360" height="90"></canvas>
        <p class="muted center">${S.checkins.length ? `${S.checkins.length} check-ins logged` :
          `No check-ins yet — <a href="#" onclick="setView('checkin');return false">log your first</a>`}</p>
      </div>
    </div>
  `;
  drawWheelChart("miniWheel", 0.9, false);
  drawBlissSpark();
}

function greeting() {
  const h = new Date().getHours();
  const name = S.name ? `, ${esc(S.name)}` : "";
  if (h < 5) return `Deep night${name}`;
  if (h < 12) return `Good morning${name}`;
  if (h < 18) return `Good afternoon${name}`;
  return `Good evening${name}`;
}

/* --------------------------- Wheel of Life ----------------------------- */

function renderWheel(root) {
  root.innerHTML = `
    <div class="view-head">
      <h1>Wheel of Life</h1>
      <p class="sub">Rate your honest satisfaction in each area (solid), set where you want to be (dashed).
      The gaps become your goals; the goals shape your personality practice.</p>
    </div>
    <div class="grid-2">
      <div class="card">
        <canvas id="bigWheel" width="440" height="440"></canvas>
        <div class="btn-row center">
          <button class="btn primary" onclick="snapshotWheel()">📸 Save snapshot</button>
        </div>
        <p class="muted center">${S.wheel.history.length} snapshot${S.wheel.history.length === 1 ? "" : "s"} saved — re-rate weekly to watch the wheel round out.</p>
      </div>
      <div class="card">
        ${WHEEL_AREAS.map(a => `
          <div class="wheel-row">
            <div class="wheel-row-head">
              <span>${a.icon} ${esc(a.name)}</span>
              <span class="wheel-nums"><strong style="color:${a.color}">${S.wheel.scores[a.id]}</strong> / target ${S.wheel.targets[a.id]}</span>
            </div>
            <input type="range" min="1" max="10" value="${S.wheel.scores[a.id]}"
              style="--c:${a.color}"
              oninput="setWheelScore('${a.id}', this.value)">
            <input type="range" class="target-slider" min="1" max="10" value="${S.wheel.targets[a.id]}"
              oninput="setWheelTarget('${a.id}', this.value)" title="Target">
          </div>`).join("")}
      </div>
    </div>

    <div class="card">
      <h2>Goals per area</h2>
      <p class="muted">Attach concrete goals to the areas with the biggest gaps. Aim at something specific — you can only steer a moving ship.</p>
      <div class="goal-add">
        <select id="goalArea">
          ${WHEEL_AREAS.map(a => `<option value="${a.id}">${a.icon} ${esc(a.name)}</option>`).join("")}
        </select>
        <input id="goalText" type="text" placeholder="e.g. Ship my portfolio site by August" onkeydown="if(event.key==='Enter')addGoal()">
        <button class="btn primary" onclick="addGoal()">Add goal</button>
      </div>
      ${S.goals.length ? `
        <ul class="goal-list">
          ${S.goals.map(g => {
            const a = areaById(g.areaId);
            const suggested = TRAITS.filter(t => t.helps.includes(g.areaId)).slice(0, 3);
            return `<li class="${g.done ? "done" : ""}">
              <span class="check" onclick="toggleGoal('${g.id}')">${g.done ? "✓" : ""}</span>
              <span class="goal-area" style="color:${a.color}">${a.icon}</span>
              <span class="goal-text">${esc(g.text)}</span>
              <span class="goal-traits muted">builds: ${suggested.map(t => t.icon).join(" ")}</span>
              <button class="icon-btn" title="Delete" onclick="deleteGoal('${g.id}')">✕</button>
            </li>`;
          }).join("")}
        </ul>` : ""}
    </div>
  `;
  drawWheelChart("bigWheel", 1, true);
}

function setWheelScore(areaId, v) { S.wheel.scores[areaId] = +v; save(); render(); }
function setWheelTarget(areaId, v) { S.wheel.targets[areaId] = +v; save(); render(); }
function snapshotWheel() {
  S.wheel.history.push({ date: new Date().toISOString(), scores: { ...S.wheel.scores } });
  save(); render();
}
function addGoal() {
  const text = document.getElementById("goalText").value.trim();
  const areaId = document.getElementById("goalArea").value;
  if (!text) return;
  S.goals.push({ id: uid(), areaId, text, done: false, createdAt: new Date().toISOString() });
  save(); render();
}
function toggleGoal(id) { const g = S.goals.find(g => g.id === id); if (g) { g.done = !g.done; save(); render(); } }
function deleteGoal(id) { S.goals = S.goals.filter(g => g.id !== id); save(); render(); }

function drawWheelChart(canvasId, scale, withLabels) {
  const cv = document.getElementById(canvasId);
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const W = cv.width, H = cv.height;
  const cx = W / 2, cy = H / 2;
  const R = Math.min(W, H) / 2 - (withLabels ? 58 : 24);
  const n = WHEEL_AREAS.length;
  ctx.clearRect(0, 0, W, H);

  // rings
  ctx.strokeStyle = "rgba(255,255,255,.08)";
  for (let r = 2; r <= 10; r += 2) {
    ctx.beginPath(); ctx.arc(cx, cy, R * r / 10, 0, Math.PI * 2); ctx.stroke();
  }
  // spokes + colored segment arcs
  WHEEL_AREAS.forEach((a, i) => {
    const ang = -Math.PI / 2 + i * 2 * Math.PI / n;
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(ang), cy + R * Math.sin(ang)); ctx.stroke();

    // filled sector for score
    const a0 = ang - Math.PI / n + 0.02, a1 = ang + Math.PI / n - 0.02;
    const rr = R * (S.wheel.scores[a.id] / 10);
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, rr, a0, a1); ctx.closePath();
    ctx.fillStyle = a.color + "55"; ctx.fill();
    ctx.strokeStyle = a.color; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, rr, a0, a1); ctx.stroke();
    ctx.lineWidth = 1;

    if (withLabels) {
      const lx = cx + (R + 34) * Math.cos(ang), ly = cy + (R + 34) * Math.sin(ang);
      ctx.fillStyle = "rgba(255,255,255,.85)";
      ctx.font = "20px system-ui";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(a.icon, lx, ly - 10);
      ctx.font = "10px system-ui";
      ctx.fillStyle = "rgba(255,255,255,.6)";
      ctx.fillText(a.name.split(" & ")[0], lx, ly + 8);
    }
  });
  // target polygon (dashed)
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = "rgba(255,255,255,.5)";
  ctx.beginPath();
  WHEEL_AREAS.forEach((a, i) => {
    const ang = -Math.PI / 2 + i * 2 * Math.PI / n;
    const rr = R * (S.wheel.targets[a.id] / 10);
    const x = cx + rr * Math.cos(ang), y = cy + rr * Math.sin(ang);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath(); ctx.stroke();
  ctx.setLineDash([]);
}

/* ------------------------- Personality Studio -------------------------- */

function renderPersonality(root) {
  const gaps = WHEEL_AREAS
    .map(a => ({ a, gap: (S.wheel.targets[a.id] ?? 8) - (S.wheel.scores[a.id] ?? 5) }))
    .filter(x => x.gap > 0).sort((x, y) => y.gap - x.gap).slice(0, 3);
  const suggestedIds = new Set(gaps.flatMap(g =>
    TRAITS.filter(t => t.helps.includes(g.a.id)).map(t => t.id)));

  root.innerHTML = `
    <div class="view-head">
      <h1>Personality Studio</h1>
      <p class="sub">Personality is trainable. Pick the traits your goals require — each adds three
      daily micro-actions to your practice. Traits are drawn from the Big Five, the best-validated
      model of personality psychology.</p>
    </div>

    ${gaps.length ? `<div class="card hint-card">
      💡 Based on your wheel's biggest gaps (${gaps.map(g => g.a.icon + " " + esc(g.a.name)).join(", ")}),
      the highlighted traits below would serve you most.
    </div>` : ""}

    <div class="trait-grid">
      ${TRAITS.map(t => {
        const on = S.selectedTraits.includes(t.id);
        const hot = suggestedIds.has(t.id);
        return `
        <div class="card trait-card ${on ? "selected" : ""} ${hot ? "suggested" : ""}" onclick="toggleTrait('${t.id}')">
          <div class="trait-head">
            <span class="trait-icon">${t.icon}</span>
            <div>
              <div class="trait-name">${esc(t.name)} ${hot ? '<span class="pill">suggested</span>' : ""}</div>
              <div class="trait-domain muted">${esc(t.domain)}</div>
            </div>
            <span class="trait-toggle">${on ? "✓" : "+"}</span>
          </div>
          <p class="trait-tagline">${esc(t.tagline)}</p>
          <p class="muted small">${esc(t.why)}</p>
          <div class="trait-actions">
            ${t.actions.map(a => `<div class="mini-action">▸ ${esc(a)}</div>`).join("")}
          </div>
          <div class="trait-helps muted small">Serves: ${t.helps.map(h => areaById(h).icon).join(" ")}</div>
        </div>`;
      }).join("")}
    </div>

    <div class="card">
      <h2>Your top five values</h2>
      <p class="muted">Goals can fail; values you can live today. When self-sabotage strikes,
      values are the tiebreaker. List yours (e.g. honesty, family, mastery, freedom, service):</p>
      <div class="values-row">
        ${[0,1,2,3,4].map(i => `<input type="text" value="${esc(S.values[i] || "")}"
          placeholder="Value ${i + 1}" onchange="setValue(${i}, this.value)">`).join("")}
      </div>
    </div>
  `;
}

function toggleTrait(id) {
  const i = S.selectedTraits.indexOf(id);
  if (i >= 0) S.selectedTraits.splice(i, 1);
  else S.selectedTraits.push(id);
  save(); render();
}
function setValue(i, v) { S.values[i] = v.trim(); save(); }

/* ------------------------------ Practices ------------------------------ */

let breathTimer = null, scanTimer = null, medTimer = null;
let audioCtx = null;

function beep(freq = 528, dur = 0.15, gain = 0.06) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = freq; o.type = "sine";
    g.gain.value = gain;
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.stop(audioCtx.currentTime + dur);
  } catch { /* audio unavailable */ }
}

function renderPractices(root) {
  root.innerHTML = `
    <div class="view-head">
      <h1>Practices</h1>
      <p class="sub">The nervous system is the substrate of bliss. Train it directly:
      breath first, body second, mind third.</p>
    </div>

    <div class="grid-2">
      <div class="card">
        <h2>🌬️ Breathwork</h2>
        <div id="breathStage" class="breath-stage hidden">
          <div class="breath-circle" id="breathCircle"><span id="breathLabel"></span></div>
          <div id="breathRound" class="muted center"></div>
          <div class="btn-row center"><button class="btn" onclick="stopBreath(true)">Stop</button></div>
        </div>
        <div id="breathMenu">
          ${BREATH_PATTERNS.map(b => `
            <div class="practice-row">
              <div>
                <strong>${esc(b.name)}</strong>
                <p class="muted small">${esc(b.desc)}</p>
              </div>
              <button class="btn primary" onclick="startBreath('${b.id}')">Start</button>
            </div>`).join("")}
        </div>
      </div>

      <div class="stack">
        <div class="card">
          <h2>🌿 Body Scan <span class="muted small">(~6 min)</span></h2>
          <p class="muted small">Listen to the body before it has to shout. Steps advance automatically.</p>
          <div id="scanStage" class="hidden">
            <div class="scan-step">
              <div class="scan-label" id="scanLabel"></div>
              <div class="scan-text" id="scanText"></div>
              <div class="progress"><div class="progress-fill" id="scanBar"></div></div>
            </div>
            <div class="btn-row center"><button class="btn" onclick="stopScan(true)">Stop</button></div>
          </div>
          <div id="scanMenu" class="btn-row">
            <button class="btn primary" onclick="startScan()">Begin body scan</button>
          </div>
        </div>

        <div class="card">
          <h2>🧘 Meditation timer</h2>
          <p class="muted small">Sit, watch the breath, return when the mind wanders. That's the whole technique — the returning IS the rep.</p>
          <div id="medStage" class="hidden center">
            <div class="med-time" id="medTime"></div>
            <div class="btn-row center"><button class="btn" onclick="stopMeditation(true)">End early</button></div>
          </div>
          <div id="medMenu" class="btn-row">
            ${[5, 10, 20].map(m => `<button class="btn primary" onclick="startMeditation(${m})">${m} min</button>`).join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}

function startBreath(id) {
  const pat = BREATH_PATTERNS.find(b => b.id === id);
  if (!pat) return;
  stopBreath();
  const stage = document.getElementById("breathStage");
  const menu = document.getElementById("breathMenu");
  if (!stage) return;
  stage.classList.remove("hidden"); menu.classList.add("hidden");
  let round = 0, phaseIdx = 0;

  const runPhase = () => {
    if (round >= pat.rounds) { stopBreath(); markPracticeDone(); beep(660, 0.4); return; }
    const ph = pat.phases[phaseIdx];
    const circle = document.getElementById("breathCircle");
    const label = document.getElementById("breathLabel");
    const roundEl = document.getElementById("breathRound");
    if (!circle) return;
    label.textContent = ph.label;
    roundEl.textContent = `Round ${round + 1} of ${pat.rounds} — ${pat.name}`;
    const grow = /inhale/i.test(ph.label);
    const shrink = /exhale/i.test(ph.label);
    circle.style.transitionDuration = ph.secs + "s";
    circle.style.transform = grow ? "scale(1.45)" : shrink ? "scale(0.85)" : circle.style.transform || "scale(1.1)";
    beep(grow ? 440 : shrink ? 330 : 392, 0.12);
    breathTimer = setTimeout(() => {
      phaseIdx++;
      if (phaseIdx >= pat.phases.length) { phaseIdx = 0; round++; }
      runPhase();
    }, ph.secs * 1000);
  };
  runPhase();
}

function stopBreath(rerender) {
  if (breathTimer) { clearTimeout(breathTimer); breathTimer = null; }
  const stage = document.getElementById("breathStage");
  const menu = document.getElementById("breathMenu");
  if (stage) { stage.classList.add("hidden"); menu.classList.remove("hidden"); }
  if (rerender) render();
}

function startScan() {
  stopScan();
  document.getElementById("scanStage").classList.remove("hidden");
  document.getElementById("scanMenu").classList.add("hidden");
  let i = 0;
  const step = () => {
    if (i >= BODY_SCAN_STEPS.length) { stopScan(); markPracticeDone(); beep(660, 0.4); return; }
    const st = BODY_SCAN_STEPS[i];
    const label = document.getElementById("scanLabel");
    if (!label) return;
    label.textContent = `${i + 1}/${BODY_SCAN_STEPS.length} · ${st.label}`;
    document.getElementById("scanText").textContent = st.text;
    const bar = document.getElementById("scanBar");
    bar.style.transition = "none"; bar.style.width = "0%";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      bar.style.transition = `width ${st.secs}s linear`; bar.style.width = "100%";
    }));
    beep(392, 0.1);
    scanTimer = setTimeout(() => { i++; step(); }, st.secs * 1000);
  };
  step();
}

function stopScan(rerender) {
  if (scanTimer) { clearTimeout(scanTimer); scanTimer = null; }
  const stage = document.getElementById("scanStage");
  if (stage) { stage.classList.add("hidden"); document.getElementById("scanMenu").classList.remove("hidden"); }
  if (rerender) render();
}

function startMeditation(mins) {
  stopMeditation();
  document.getElementById("medStage").classList.remove("hidden");
  document.getElementById("medMenu").classList.add("hidden");
  let remaining = mins * 60;
  beep(528, 0.5);
  const tick = () => {
    const el = document.getElementById("medTime");
    if (!el) return;
    const m = Math.floor(remaining / 60), s = remaining % 60;
    el.textContent = `${m}:${String(s).padStart(2, "0")}`;
    if (remaining <= 0) { stopMeditation(true); markPracticeDone(); beep(528, 1.2, 0.1); return; }
    remaining--;
    medTimer = setTimeout(tick, 1000);
  };
  tick();
}

function stopMeditation(rerender) {
  if (medTimer) { clearTimeout(medTimer); medTimer = null; }
  const stage = document.getElementById("medStage");
  if (stage) { stage.classList.add("hidden"); document.getElementById("medMenu").classList.remove("hidden"); }
  if (rerender && activeView === "practices") render();
}

// completing any practice counts toward the Emotional Stability action & streak
function markPracticeDone() {
  const day = todayKey();
  S.actionLog[day] = S.actionLog[day] || {};
  if (S.selectedTraits.includes("stability")) S.actionLog[day]["stability:0"] = true;
  S.actionLog[day]["practice:free"] = true;
  save();
}

/* ------------------------------- Journal ------------------------------- */

let journalLens = "healer";
let journalPrompt = null;

function renderJournal(root) {
  const lens = lensById(journalLens);
  if (!journalPrompt || journalPrompt.lensId !== journalLens) {
    journalPrompt = { lensId: journalLens, text: lens.journalPrompts[Math.floor(Math.random() * lens.journalPrompts.length)] };
  }
  root.innerHTML = `
    <div class="view-head">
      <h1>Journal</h1>
      <p class="sub">Introspection with structure. Pick a lens; each asks different questions of the same life.</p>
    </div>
    <div class="card">
      <div class="lens-tabs">
        ${LENSES.map(l => `
          <button class="lens-tab ${l.id === journalLens ? "active" : ""}" style="--lens:${l.color}"
            onclick="setJournalLens('${l.id}')">${l.icon} ${esc(l.name)}</button>`).join("")}
      </div>
      <div class="journal-prompt" style="--lens:${lens.color}">
        <span>${esc(journalPrompt.text)}</span>
        <button class="icon-btn" title="New prompt" onclick="shufflePrompt()">🔄</button>
      </div>
      <textarea id="journalText" rows="7" placeholder="Write freely. Nobody reads this but you."></textarea>
      <div class="btn-row">
        <button class="btn primary" onclick="saveJournal()">Save entry</button>
      </div>
    </div>
    ${S.journal.length ? `
    <div class="card">
      <h2>Past entries</h2>
      ${[...S.journal].reverse().slice(0, 20).map(j => {
        const l = lensById(j.lensId);
        return `<div class="journal-entry">
          <div class="journal-meta">
            <span style="color:${l ? l.color : '#888'}">${l ? l.icon + " " + esc(l.name) : ""}</span>
            <span class="muted">${new Date(j.date).toLocaleDateString()}</span>
            <button class="icon-btn" onclick="deleteJournal('${j.id}')">✕</button>
          </div>
          <div class="muted small">${esc(j.prompt)}</div>
          <div class="journal-body">${esc(j.text)}</div>
        </div>`;
      }).join("")}
    </div>` : ""}
  `;
}

function setJournalLens(id) { journalLens = id; journalPrompt = null; render(); }
function shufflePrompt() {
  const lens = lensById(journalLens);
  const others = lens.journalPrompts.filter(p => p !== journalPrompt.text);
  journalPrompt = { lensId: journalLens, text: others[Math.floor(Math.random() * others.length)] };
  render();
}
function saveJournal() {
  const text = document.getElementById("journalText").value.trim();
  if (!text) return;
  S.journal.push({ id: uid(), date: new Date().toISOString(), lensId: journalLens, prompt: journalPrompt.text, text });
  save(); render();
}
function deleteJournal(id) { S.journal = S.journal.filter(j => j.id !== id); save(); render(); }

/* ------------------------------- Council ------------------------------- */

let councilCategory = null;
let councilTopic = "";

function renderCouncil(root) {
  root.innerHTML = `
    <div class="view-head">
      <h1>The Council</h1>
      <p class="sub">Five ways of seeing the same problem. Describe what you're facing, pick the closest
      category, and hear each perspective. They disagree on method — that's the point. Take what serves you.</p>
    </div>
    <div class="card">
      <input id="councilTopic" type="text" placeholder="What are you struggling with? (optional — e.g. 'I keep putting off my job applications')"
        value="${esc(councilTopic)}">
      <div class="lens-tabs" style="margin-top:12px">
        ${COUNCIL_CATEGORIES.map(c => `
          <button class="lens-tab ${c.id === councilCategory ? "active" : ""}"
            onclick="askCouncil('${c.id}')">${esc(c.name)}</button>`).join("")}
      </div>
    </div>
    ${councilCategory ? `
      <div class="council-grid">
        ${LENSES.map(l => `
          <div class="card council-card" style="--lens:${l.color}">
            <div class="council-head">
              <span class="council-icon">${l.icon}</span>
              <div>
                <div class="council-name">${esc(l.name)}</div>
                <div class="muted small">${esc(l.inspiration)}</div>
              </div>
            </div>
            <p class="council-advice">${esc(l.advice[councilCategory])}</p>
            <div class="council-q muted small">Ask yourself: <em>${esc(l.questions[Math.floor(Math.random() * l.questions.length)])}</em></div>
          </div>`).join("")}
      </div>
      <div class="card hint-card">
        🧭 Synthesis: regulate the body first (Somatic, Healer), name the trigger honestly (Neuropsychologist),
        shrink the task and take responsibility for the next step (Architect), then build the system so tomorrow
        doesn't depend on today's mood (Rationalist).
      </div>` : `
      <div class="card muted center">Pick a category above to convene the Council.</div>`}
  `;
}

function askCouncil(cat) {
  councilTopic = document.getElementById("councilTopic")?.value || councilTopic;
  councilCategory = cat;
  render();
}
function askCouncilFor(areaId) {
  councilCategory = AREA_TO_CATEGORY[areaId] || "purpose";
  setView("council");
}

/* ------------------------------- Check-in ------------------------------ */

let checkinDraft = { bliss: 5, energy: 5, tension: [], note: "" };

function renderCheckin(root) {
  root.innerHTML = `
    <div class="view-head">
      <h1>Bliss Check-in</h1>
      <p class="sub">Thirty honest seconds. Mood and body, tracked over time — patterns you can't see day-to-day become obvious in the graph.</p>
    </div>
    <div class="grid-2">
      <div class="card">
        <h2>How is it right now?</h2>
        <label class="slider-label">Bliss <strong>${checkinDraft.bliss}/10 — ${MOOD_LABELS[checkinDraft.bliss]}</strong></label>
        <input type="range" min="1" max="10" value="${checkinDraft.bliss}" oninput="setDraft('bliss', this.value)">
        <label class="slider-label">Energy <strong>${checkinDraft.energy}/10</strong></label>
        <input type="range" min="1" max="10" value="${checkinDraft.energy}" oninput="setDraft('energy', this.value)">
        <label class="slider-label">Where is the body holding tension?</label>
        <div class="chip-row">
          ${TENSION_SPOTS.map(t => `
            <button class="chip ${checkinDraft.tension.includes(t) ? "active" : ""}"
              onclick="toggleTension('${t}')">${t}</button>`).join("")}
        </div>
        <textarea id="checkinNote" rows="3" placeholder="Anything worth noting? (what's behind the number)">${esc(checkinDraft.note)}</textarea>
        <div class="btn-row">
          <button class="btn primary" onclick="saveCheckin()">Log check-in</button>
        </div>
      </div>
      <div class="card">
        <h2>Trends</h2>
        <canvas id="checkinChart" width="420" height="200"></canvas>
        ${renderTensionSummary()}
      </div>
    </div>
    ${S.checkins.length ? `
    <div class="card">
      <h2>Recent check-ins</h2>
      ${[...S.checkins].reverse().slice(0, 10).map(c => `
        <div class="checkin-row">
          <span>${new Date(c.date).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          <span>😌 ${c.bliss}/10 · ⚡ ${c.energy}/10</span>
          <span class="muted small">${(c.tension || []).filter(t => t !== "None").join(", ") || "no tension"}</span>
        </div>`).join("")}
    </div>` : ""}
  `;
  drawCheckinChart();
}

function renderTensionSummary() {
  if (!S.checkins.length) return `<p class="muted center">No data yet.</p>`;
  const counts = {};
  S.checkins.forEach(c => (c.tension || []).forEach(t => { if (t !== "None") counts[t] = (counts[t] || 0) + 1; }));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (!top.length) return `<p class="muted center">No recurring tension logged — nice.</p>`;
  return `<p class="muted center">Most frequent tension: ${top.map(([t, n]) => `<strong>${t}</strong> (${n}×)`).join(", ")}.
    Recurring spots are the body's mail — worth opening in the <a href="#" onclick="setView('journal');return false">journal</a>.</p>`;
}

function setDraft(k, v) { checkinDraft[k] = +v; checkinDraft.note = document.getElementById("checkinNote")?.value || ""; render(); }
function toggleTension(t) {
  checkinDraft.note = document.getElementById("checkinNote")?.value || "";
  if (t === "None") checkinDraft.tension = ["None"];
  else {
    checkinDraft.tension = checkinDraft.tension.filter(x => x !== "None");
    const i = checkinDraft.tension.indexOf(t);
    i >= 0 ? checkinDraft.tension.splice(i, 1) : checkinDraft.tension.push(t);
  }
  render();
}
function saveCheckin() {
  checkinDraft.note = document.getElementById("checkinNote")?.value || "";
  S.checkins.push({ date: new Date().toISOString(), ...checkinDraft, tension: [...checkinDraft.tension] });
  save();
  checkinDraft = { bliss: 5, energy: 5, tension: [], note: "" };
  render();
}

function drawCheckinChart() {
  const cv = document.getElementById("checkinChart");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  ctx.clearRect(0, 0, cv.width, cv.height);
  const data = S.checkins.slice(-30);
  if (data.length < 2) {
    ctx.fillStyle = "rgba(255,255,255,.4)";
    ctx.font = "13px system-ui"; ctx.textAlign = "center";
    ctx.fillText("Log at least two check-ins to see trends", cv.width / 2, cv.height / 2);
    return;
  }
  const pad = 20, W = cv.width - pad * 2, H = cv.height - pad * 2;
  const line = (key, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
    data.forEach((c, i) => {
      const x = pad + (i / (data.length - 1)) * W;
      const y = pad + H - ((c[key] - 1) / 9) * H;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  };
  ctx.strokeStyle = "rgba(255,255,255,.1)";
  ctx.strokeRect(pad, pad, W, H);
  line("bliss", "#7c6ff0");
  line("energy", "#5cc98f");
  ctx.font = "11px system-ui"; ctx.textAlign = "left";
  ctx.fillStyle = "#7c6ff0"; ctx.fillText("● bliss", pad, 12);
  ctx.fillStyle = "#5cc98f"; ctx.fillText("● energy", pad + 50, 12);
}

function drawBlissSpark() {
  const cv = document.getElementById("blissSpark");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  ctx.clearRect(0, 0, cv.width, cv.height);
  const data = S.checkins.slice(-20);
  if (data.length < 2) return;
  const pad = 8, W = cv.width - pad * 2, H = cv.height - pad * 2;
  ctx.strokeStyle = "#7c6ff0"; ctx.lineWidth = 2; ctx.beginPath();
  data.forEach((c, i) => {
    const x = pad + (i / (data.length - 1)) * W;
    const y = pad + H - ((c.bliss - 1) / 9) * H;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
}

/* -------------------------------- boot --------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".nav-btn").forEach(b =>
    b.addEventListener("click", () => setView(b.dataset.view)));
  render();
});
