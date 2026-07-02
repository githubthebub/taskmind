/* Stillpoint — breathwork & somatic wellness. Vanilla JS, no dependencies.
   All state lives in localStorage under "stillpoint.sessions". */

"use strict";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* ================= navigation ================= */

function showView(name) {
  $$(".view").forEach((v) => v.classList.toggle("active", v.id === `view-${name}`));
  $$(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
  if (name === "progress") renderProgress();
  window.scrollTo({ top: 0 });
}

$$(".nav-btn").forEach((b) => b.addEventListener("click", () => showView(b.dataset.view)));
document.addEventListener("click", (e) => {
  const goto = e.target.closest("[data-goto]");
  if (goto) showView(goto.dataset.goto);
});

/* ================= session store ================= */

const STORE_KEY = "stillpoint.sessions";

function loadSessions() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
  catch { return []; }
}

function logSession(type, minutes) {
  const sessions = loadSessions();
  sessions.push({ type, minutes: Math.round(minutes * 10) / 10, at: new Date().toISOString() });
  localStorage.setItem(STORE_KEY, JSON.stringify(sessions.slice(-500)));
}

function localDayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ================= breathing studio ================= */

const TECHNIQUES = [
  {
    id: "coherence",
    name: "Coherence 5.5",
    desc: "Even breathing at about 5.5 breaths per minute — the pace most consistently linked to increased heart-rate variability and a calm, alert state. A good default for daily practice.",
    phases: [
      { label: "Inhale", secs: 5.5, to: 1 },
      { label: "Exhale", secs: 5.5, to: 0.45 },
    ],
  },
  {
    id: "sigh",
    name: "Cyclic sighing",
    desc: "A full inhale through the nose, a short second sip of air to pop the lungs' air sacs open, then a long slow exhale. In a 2023 Stanford study this outperformed meditation for improving daily mood in five minutes a day.",
    phases: [
      { label: "Inhale", secs: 2.5, to: 0.85 },
      { label: "Inhale again", secs: 1.5, to: 1 },
      { label: "Long exhale", secs: 6, to: 0.45 },
    ],
  },
  {
    id: "box",
    name: "Box breathing",
    desc: "Inhale, hold, exhale, hold — four seconds each. Used by military and first responders to steady the nervous system under pressure. Good before a stressful meeting or difficult conversation.",
    phases: [
      { label: "Inhale", secs: 4, to: 1 },
      { label: "Hold", secs: 4, to: 1 },
      { label: "Exhale", secs: 4, to: 0.45 },
      { label: "Hold", secs: 4, to: 0.45 },
    ],
  },
  {
    id: "478",
    name: "4–7–8",
    desc: "Inhale for 4, hold for 7, exhale slowly for 8. The long exhale and hold make this one drowsy by design — best used in bed or when winding down, not before you need to focus.",
    phases: [
      { label: "Inhale", secs: 4, to: 1 },
      { label: "Hold", secs: 7, to: 1 },
      { label: "Exhale", secs: 8, to: 0.45 },
    ],
  },
];

let selectedTechnique = TECHNIQUES[0];
let selectedMins = 5;
let breatheTimers = [];
let breatheEndsAt = 0;
let breatheTicker = null;

const techniqueRow = $("#technique-row");
TECHNIQUES.forEach((t, i) => {
  const btn = document.createElement("button");
  btn.className = "option" + (i === 0 ? " active" : "");
  btn.textContent = t.name;
  btn.addEventListener("click", () => {
    selectedTechnique = t;
    $$("#technique-row .option").forEach((o) => o.classList.toggle("active", o === btn));
    $("#technique-desc").textContent = t.desc;
  });
  techniqueRow.appendChild(btn);
});
$("#technique-desc").textContent = selectedTechnique.desc;

$$("#duration-row .option").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedMins = Number(btn.dataset.mins);
    $$("#duration-row .option").forEach((o) => o.classList.toggle("active", o === btn));
  });
});

/* Soft sine blip on phase change (WebAudio, no assets). */
let audioCtx = null;
function blip() {
  if (!$("#sound-toggle").checked) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 432;
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.55);
  } catch { /* audio unavailable — session works fine without it */ }
}

function fmtClock(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function startBreathing() {
  $("#breathe-setup").hidden = true;
  $("#breathe-done").hidden = true;
  $("#breathe-session").hidden = false;

  breatheEndsAt = Date.now() + selectedMins * 60_000;
  runPhase(0);

  breatheTicker = setInterval(() => {
    const left = breatheEndsAt - Date.now();
    $("#time-left").textContent = fmtClock(left) + " left";
    if (left <= 0) finishBreathing(true);
  }, 250);
  $("#time-left").textContent = fmtClock(selectedMins * 60_000) + " left";
}

function runPhase(idx) {
  const phase = selectedTechnique.phases[idx % selectedTechnique.phases.length];
  const circle = $("#pacer-circle");

  $("#phase-label").textContent = phase.label;
  circle.style.transitionDuration = `${phase.secs}s`;
  circle.style.transform = `scale(${phase.to})`;
  blip();

  // per-second countdown inside the phase
  let remaining = Math.round(phase.secs);
  $("#phase-count").textContent = remaining || "";
  for (let i = 1; i < phase.secs; i++) {
    breatheTimers.push(setTimeout(() => {
      remaining -= 1;
      $("#phase-count").textContent = remaining;
    }, i * 1000));
  }

  breatheTimers.push(setTimeout(() => runPhase(idx + 1), phase.secs * 1000));
}

function finishBreathing(completed) {
  clearInterval(breatheTicker);
  breatheTimers.forEach(clearTimeout);
  breatheTimers = [];
  $("#breathe-session").hidden = true;

  const minutesDone = completed
    ? selectedMins
    : (selectedMins * 60_000 - (breatheEndsAt - Date.now())) / 60_000;

  if (minutesDone >= 0.5) logSession(selectedTechnique.name, minutesDone);

  if (completed) {
    $("#breathe-done").hidden = false;
    $("#breathe-done-text").textContent =
      `${selectedMins} minutes of ${selectedTechnique.name}. Notice how the body feels before rushing on.`;
  } else {
    $("#breathe-setup").hidden = false;
  }
}

$("#breathe-start").addEventListener("click", startBreathing);
$("#breathe-stop").addEventListener("click", () => finishBreathing(false));
$("#breathe-again").addEventListener("click", () => {
  $("#breathe-done").hidden = true;
  $("#breathe-setup").hidden = false;
});

/* ================= body scan ================= */

const SCAN_STEPS = [
  ["Feet", "Bring your attention to your feet. Feel the contact with the floor or bed — pressure, temperature, tingling, or nothing at all. Nothing to fix; just register what's there."],
  ["Lower legs", "Move up through ankles, calves and shins. Notice any tightness or heaviness. If the mind wanders, that's normal — return without judgment."],
  ["Thighs & hips", "Feel the weight of your thighs and the contact of your hips with the seat or floor. Let them be heavy."],
  ["Belly", "Rest attention on the belly. Feel it rise and fall with the breath. No need to change the breathing — just watch it."],
  ["Chest", "Notice the chest: the heartbeat if you can find it, the gentle stretch of each inhale."],
  ["Hands & arms", "Sweep attention from fingertips to shoulders. Warmth, pulse, contact with clothing — whatever is actually there."],
  ["Shoulders & neck", "This is where many people store tension. Notice it without forcing it to release. Often noticing is enough."],
  ["Face & jaw", "Soften the eyes, unclench the jaw, let the tongue rest. Feel the small muscles around the mouth and brow."],
  ["Head", "Notice the crown of the head, the weight of the skull, the space behind the eyes."],
  ["Whole body", "Widen the attention to hold the whole body at once, breathing. Rest here until the tone sounds."],
];
const SCAN_STEP_SECS = 32;

let scanTimers = [];
let scanStartedAt = 0;

function runScanStep(idx) {
  if (idx >= SCAN_STEPS.length) return finishScan(true);
  const [region, prompt] = SCAN_STEPS[idx];
  $("#scan-region").textContent = region;
  $("#scan-prompt").textContent = prompt;
  $("#scan-step-label").textContent = `${idx + 1} of ${SCAN_STEPS.length}`;
  $("#scan-progress-fill").style.width = `${((idx + 1) / SCAN_STEPS.length) * 100}%`;
  blip();
  scanTimers.push(setTimeout(() => runScanStep(idx + 1), SCAN_STEP_SECS * 1000));
}

function finishScan(completed) {
  scanTimers.forEach(clearTimeout);
  scanTimers = [];
  $("#scan-session").hidden = true;

  const minutes = (Date.now() - scanStartedAt) / 60_000;
  if (minutes >= 0.5) logSession("Body scan", minutes);

  if (completed) {
    $("#scan-done").hidden = false;
  } else {
    $("#scan-setup").hidden = false;
  }
}

$("#scan-start").addEventListener("click", () => {
  $("#scan-setup").hidden = true;
  $("#scan-done").hidden = true;
  $("#scan-session").hidden = false;
  scanStartedAt = Date.now();
  runScanStep(0);
});
$("#scan-stop").addEventListener("click", () => finishScan(false));
$("#scan-again").addEventListener("click", () => {
  $("#scan-done").hidden = true;
  $("#scan-setup").hidden = false;
});

/* ================= grounding ================= */

const GROUND_STEPS = [
  [5, "things you can see", "Look around and name five things. Go slowly — notice a detail about each one you hadn't clocked before: a colour, an edge, a shadow."],
  [4, "things you can feel", "The chair against your back, feet in shoes, air on skin, the texture of your sleeve. Name four distinct sensations of touch."],
  [3, "things you can hear", "Near sounds and far ones — traffic, a fan, your own breath. Name three."],
  [2, "things you can smell", "Two scents, even faint ones. If the room gives you nothing, your coffee cup or the back of your hand will do."],
  [1, "thing you can taste", "One taste — a sip of water counts. Stay with it for a moment."],
];

let groundIdx = 0;
let groundStartedAt = 0;

function showGroundStep() {
  const [n, sense, hint] = GROUND_STEPS[groundIdx];
  $("#ground-count").textContent = n;
  $("#ground-sense").textContent = `${n} ${sense}`;
  $("#ground-hint").textContent = hint;
  $("#ground-next").textContent = groundIdx === GROUND_STEPS.length - 1 ? "Finish" : "Done — next sense";
}

$("#ground-start").addEventListener("click", () => {
  $("#ground-setup").hidden = true;
  $("#ground-done").hidden = true;
  $("#ground-session").hidden = false;
  groundIdx = 0;
  groundStartedAt = Date.now();
  showGroundStep();
});

$("#ground-next").addEventListener("click", () => {
  groundIdx += 1;
  if (groundIdx >= GROUND_STEPS.length) {
    $("#ground-session").hidden = true;
    $("#ground-done").hidden = false;
    logSession("Grounding 5-4-3-2-1", Math.max(1, (Date.now() - groundStartedAt) / 60_000));
  } else {
    showGroundStep();
  }
});

$("#ground-again").addEventListener("click", () => {
  $("#ground-done").hidden = true;
  $("#ground-setup").hidden = false;
});

/* ================= progress ================= */

function renderProgress() {
  const sessions = loadSessions();

  // --- last 7 local days, oldest first ---
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ key: localDayKey(d), date: d, minutes: 0 });
  }
  const byDay = new Map(days.map((d) => [d.key, d]));
  let totalMinutes = 0;
  const activeDays = new Set();

  sessions.forEach((s) => {
    const d = new Date(s.at);
    const key = localDayKey(d);
    totalMinutes += s.minutes;
    activeDays.add(key);
    if (byDay.has(key)) byDay.get(key).minutes += s.minutes;
  });

  // --- stat tiles ---
  let streak = 0;
  for (let i = 0; ; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (activeDays.has(localDayKey(d))) streak++;
    else if (i === 0) continue; // today empty doesn't break yesterday's streak
    else break;
  }
  $("#stat-streak").textContent = streak;
  $("#stat-week").textContent = sessions.filter((s) => byDay.has(localDayKey(new Date(s.at)))).length;
  $("#stat-minutes").textContent = Math.round(totalMinutes);

  // --- 7-day bar strip ---
  const chart = $("#week-chart");
  const tooltip = $("#chart-tooltip");
  chart.innerHTML = "";
  const max = Math.max(1, ...days.map((d) => d.minutes));
  const todayKey = localDayKey(new Date());
  const dayName = (d) => d.toLocaleDateString(undefined, { weekday: "short" });

  days.forEach((d) => {
    const col = document.createElement("div");
    col.className = "week-col" + (d.key === todayKey ? " today" : "");
    col.tabIndex = 0;
    col.setAttribute("role", "img");
    col.setAttribute("aria-label", `${dayName(d.date)}: ${Math.round(d.minutes)} minutes`);

    const bar = document.createElement("div");
    bar.className = "week-bar" + (d.minutes === 0 ? " empty" : "");
    bar.style.height = d.minutes === 0 ? "2px" : `${Math.max(6, (d.minutes / max) * 100)}%`;

    const label = document.createElement("div");
    label.className = "week-day";
    label.textContent = dayName(d.date);

    col.append(bar, label);
    chart.appendChild(col);

    const show = () => {
      tooltip.innerHTML = `${d.date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })} · <strong>${Math.round(d.minutes)} min</strong>`;
      tooltip.hidden = false;
      const cardBox = chart.parentElement.getBoundingClientRect();
      const colBox = col.getBoundingClientRect();
      tooltip.style.left = `${colBox.left - cardBox.left + colBox.width / 2}px`;
      tooltip.style.top = `${colBox.top - cardBox.top}px`;
    };
    const hide = () => { tooltip.hidden = true; };
    col.addEventListener("mouseenter", show);
    col.addEventListener("mouseleave", hide);
    col.addEventListener("focus", show);
    col.addEventListener("blur", hide);
  });

  // --- table view ---
  const tbody = $("#week-table tbody");
  tbody.innerHTML = "";
  days.forEach((d) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${d.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</td><td>${Math.round(d.minutes)}</td>`;
    tbody.appendChild(tr);
  });

  // --- history ---
  const list = $("#history-list");
  list.innerHTML = "";
  const recent = sessions.slice(-12).reverse();
  if (recent.length === 0) {
    list.innerHTML = `<li class="history-empty">No sessions yet — your first breath session takes two minutes.</li>`;
  } else {
    recent.forEach((s) => {
      const li = document.createElement("li");
      const when = new Date(s.at).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      li.innerHTML = `<span>${s.type}</span><span>${s.minutes} min · ${when}</span>`;
      list.appendChild(li);
    });
  }
}

$("#clear-data").addEventListener("click", () => {
  if (confirm("Delete all locally stored session history? This cannot be undone.")) {
    localStorage.removeItem(STORE_KEY);
    renderProgress();
  }
});
