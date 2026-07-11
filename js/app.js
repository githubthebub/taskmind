/* Backbone — UI. Everything runs in the browser; no server, no AI, no network calls. */

const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
};

const SESSION_LEN = 5;

/* ================= navigation ================= */
const SCREENS = ["culture", "home", "scenario", "distortion", "drill", "breathe", "progress", "about"];

function showScreen(name) {
  for (const s of SCREENS) $("#screen-" + s).classList.toggle("hidden", s !== name);
  $("#topbar").classList.toggle("hidden", !state.cultureId);
  window.scrollTo(0, 0);
  stopBreathing();

  if (name === "culture") renderCultureSelect();
  if (name === "home") renderHome();
  if (name === "scenario") startScenarioSession();
  if (name === "distortion") startDistortionSession();
  if (name === "drill") startDrillSession();
  if (name === "breathe") resetBreatheScreen();
  if (name === "progress") renderProgress();
  if (name === "about" && !state.stats.readAbout) {
    state.stats.readAbout = true;
    saveState();
    announceBadges(checkBadges());
  }
  refreshTopbar();
}

document.addEventListener("click", (e) => {
  const nav = e.target.closest("[data-nav]");
  if (nav) showScreen(nav.dataset.nav);
});

function refreshTopbar() {
  const c = currentCulture();
  $("#culture-chip").textContent = c ? `${c.flag} ${c.name}` : "Pick culture";
  $("#streak-chip").textContent = `🔥 ${state.streak.current}`;
  $("#score-chip").textContent = `⭐ ${state.score}`;
}

/* ================= toast / badges ================= */
const toastQueue = [];
let toastBusy = false;

function toast(msg) {
  toastQueue.push(msg);
  if (!toastBusy) nextToast();
}
function nextToast() {
  const msg = toastQueue.shift();
  if (!msg) { toastBusy = false; return; }
  toastBusy = true;
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => { t.classList.add("hidden"); setTimeout(nextToast, 250); }, 2200);
}
function announceBadges(fresh) {
  for (const b of fresh) toast(`${b.emoji} Badge unlocked: ${b.name}!`);
}

/* ================= culture select ================= */
function cultureCard(c) {
  const btn = el("button", "culture-card" + (c.id === state.cultureId ? " selected" : ""));
  btn.append(
    el("span", "cc-name", `${c.flag} ${c.name}`),
    el("span", "cc-blurb", c.blurb),
  );
  btn.addEventListener("click", () => {
    setCulture(c.id);
    announceBadges(checkBadges());
    showScreen("home");
  });
  return btn;
}

function renderCultureSelect(query = "") {
  const q = query.trim().toLowerCase();
  const match = (c) => !q || c.name.toLowerCase().includes(q) || c.blurb.toLowerCase().includes(q);
  const styleGrid = $("#style-grid");
  const countryGrid = $("#country-grid");
  styleGrid.innerHTML = "";
  countryGrid.innerHTML = "";
  for (const c of CULTURES.filter((c) => c.group === "style" && match(c))) styleGrid.append(cultureCard(c));
  for (const c of CULTURES.filter((c) => c.group === "country" && match(c))) countryGrid.append(cultureCard(c));
}

$("#culture-search").addEventListener("input", (e) => renderCultureSelect(e.target.value));

/* ================= home ================= */
function renderHome() {
  const c = currentCulture();
  const banner = $("#home-culture-banner");
  banner.innerHTML = "";
  if (c) {
    banner.append(el("h2", null, `${c.flag} Training for: ${c.name}`));
    banner.append(el("p", "muted small", c.blurb));
    const ul = el("ul");
    for (const n of c.notes) ul.append(el("li", null, n));
    banner.append(ul);
  }

  const bp = backbonePct();
  $("#backbone-pct").textContent = bp === null ? "–" : bp + "%";
  $("#backbone-bar").style.width = (bp ?? 0) + "%";
  const cp = calmPct();
  $("#calm-pct").textContent = cp === null ? "–" : cp + "%";
  $("#calm-bar").style.width = (cp ?? 0) + "%";

  const bars = $("#trait-bars");
  bars.innerHTML = "";
  for (const [key, t] of Object.entries(TRAITS)) {
    const xp = state.xp[key];
    const lvl = traitLevel(xp);
    const floor = levelFloorXp(lvl);
    const next = nextLevelXp(lvl);
    const pct = Math.round(((xp - floor) / (next - floor)) * 100);
    const star = c && c.weights[key] >= 5 ? ` <span class="trait-star" title="Highly valued in ${c.name}">★</span>` : "";
    const row = el("div", "trait-row");
    const nameEl = el("span", "trait-name", `${t.emoji} ${t.name.split(" (")[0]}${star}`);
    nameEl.title = `${t.name} — ${t.desc}`;
    row.append(nameEl);
    const bar = el("div", "bar");
    const fill = el("div", "bar-fill bar-trait");
    fill.style.width = pct + "%";
    bar.append(fill);
    row.append(bar);
    row.append(el("span", "trait-lvl", `Lv ${lvl} · ${xp - floor}/${next - floor}`));
    bars.append(row);
  }
}

/* ================= shared session helpers ================= */
function renderDots(container, total, results, currentIdx) {
  container.innerHTML = "";
  for (let i = 0; i < total; i++) {
    const d = el("span", "dot");
    if (results[i]) d.classList.add("done-" + results[i]);
    else if (i === currentIdx) d.classList.add("current");
    container.append(d);
  }
}

function xpPills(xpGained) {
  return Object.entries(xpGained)
    .map(([k, v]) => `<span class="xp-pill">${TRAITS[k].emoji} ${TRAITS[k].name.split(" ")[0]} ${v > 0 ? "+" : ""}${v} XP</span>`)
    .join("");
}

function sessionSummary(container, title, results, pts, extraLines, replayNav) {
  container.classList.remove("hidden");
  const goods = results.filter((r) => r === "good").length;
  container.innerHTML = "";
  const card = el("div", "card summary-card");
  card.append(el("h2", null, title));
  card.append(el("div", "summary-big", `${goods}/${results.length} strong`));
  card.append(el("div", "summary-line", `Session points: ${pts >= 0 ? "+" : ""}${pts} ⭐`));
  for (const line of extraLines) card.append(el("div", "summary-line", line));
  const row = el("div", "row-buttons");
  row.style.justifyContent = "center";
  const again = el("button", "btn", "Play again");
  again.addEventListener("click", () => showScreen(replayNav));
  const home = el("button", "btn ghost", "Home");
  home.addEventListener("click", () => showScreen("home"));
  row.append(again, home);
  card.append(row);
  container.append(card);
  state.stats.sessionsCompleted++;
  saveState();
  announceBadges(checkBadges());
  refreshTopbar();
}

/* ================= scenario mode ================= */
let scRun = null;

function startScenarioSession() {
  scRun = {
    deck: drawScenarios(SESSION_LEN),
    idx: 0,
    results: [],
    pts: 0,
    doormats: 0,
    hadPush: false,
  };
  $("#scenario-summary").classList.add("hidden");
  renderScenarioRound();
}

function renderScenarioRound() {
  const run = scRun;
  const card = $("#scenario-card");
  const fb = $("#scenario-feedback");
  fb.classList.add("hidden");

  if (run.idx >= run.deck.length) {
    card.innerHTML = "";
    card.classList.add("hidden");
    if (run.hadPush && run.doormats === 0) {
      state.stats.cleanSessions++;
      saveState();
    }
    sessionSummary($("#scenario-summary"), "🎭 Situations complete", run.results, run.pts,
      [run.doormats === 0 ? "Zero doormat picks. 🦴 Respect." : `Doormat picks: ${run.doormats} — next time, hold the line.`],
      "scenario");
    return;
  }

  card.classList.remove("hidden");
  renderDots($("#scenario-progress"), run.deck.length, run.results, run.idx);

  const sc = run.deck[run.idx];
  card.innerHTML = "";
  card.append(el("span", "scene-tag", `${sc.tag} · trains ${TRAITS[sc.focus].emoji} ${TRAITS[sc.focus].name}`));
  card.append(el("p", "scene-text", sc.text));

  const hadDoormat = sc.choices.some((ch) => ch.kind === "doormat");
  if (hadDoormat) run.hadPush = true;

  const list = el("div", "choices");
  const order = shuffle(sc.choices.map((_, i) => i));
  for (const i of order) {
    const ch = sc.choices[i];
    const btn = el("button", "choice-btn", ch.text);
    btn.addEventListener("click", () => {
      ch._roundHadDoormat = hadDoormat;
      const res = applyChoice(ch, sc.focus);
      run.pts += res.pts;
      run.results.push(res.cls);
      if (ch.kind === "doormat") run.doormats++;

      for (const b of list.querySelectorAll("button")) b.disabled = true;
      btn.classList.add("picked-" + res.cls);
      if (res.cls !== "good") {
        for (const j of order) {
          if (kindClass(sc.choices[j].kind) === "good") {
            list.children[order.indexOf(j)].classList.add("reveal-best");
          }
        }
      }

      renderDots($("#scenario-progress"), run.deck.length, run.results, run.idx);
      markSeen(state.seen.scenarios, sc.id);
      saveState();
      showFeedback(fb, res, ch.fb, () => { run.idx++; renderScenarioRound(); });
      refreshTopbar();
    });
    list.append(btn);
  }
  card.append(list);
}

function showFeedback(container, res, text, onNext) {
  container.innerHTML = "";
  container.classList.remove("hidden");
  container.append(el("div", "fb-verdict " + res.cls, res.label));
  container.append(el("p", null, text));
  const pieces = [`<b>${res.pts >= 0 ? "+" : ""}${res.pts} ⭐</b>`];
  container.append(el("div", "fb-points", pieces.join(" ") + " " + xpPills(res.xpGained)));
  const c = res.culture;
  if (c) {
    const note = c.notes[Math.floor(Math.random() * c.notes.length)];
    container.append(el("div", "fb-culture", `${c.flag} <b>${c.name}:</b> ${note}`));
  }
  const next = el("button", "btn fb-next", "Next →");
  next.addEventListener("click", onNext);
  container.append(next);
  next.focus();
  container.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* ================= distortion mode ================= */
let dsRun = null;

function startDistortionSession() {
  dsRun = {
    deck: drawFrom(DISTORTIONS, state.seen.distortions, SESSION_LEN),
    idx: 0,
    results: [],
    pts: 0,
    caught: 0,
  };
  $("#distortion-summary").classList.add("hidden");
  renderDistortionRound();
}

function renderDistortionRound() {
  const run = dsRun;
  const card = $("#distortion-card");
  const fb = $("#distortion-feedback");
  fb.classList.add("hidden");

  if (run.idx >= run.deck.length) {
    card.classList.add("hidden");
    sessionSummary($("#distortion-summary"), "🔍 Distortions named", run.results, run.pts,
      [`Caught ${run.caught}/${run.deck.length} thinking traps.`], "distortion");
    return;
  }

  card.classList.remove("hidden");
  renderDots($("#distortion-progress"), run.deck.length, run.results, run.idx);

  const round = run.deck[run.idx];
  const answerType = DISTORTION_TYPES.find((t) => t.id === round.answer);
  const decoys = shuffle(DISTORTION_TYPES.filter((t) => t.id !== round.answer)).slice(0, 3);
  const options = shuffle([answerType, ...decoys]);

  card.innerHTML = "";
  card.append(el("span", "scene-tag", "Which thinking trap is this?"));
  card.append(el("p", "scene-text", round.thought));

  const list = el("div", "choices");
  for (const opt of options) {
    const btn = el("button", "choice-btn", `<b>${opt.name}</b><br><span class="muted tiny">${opt.short}</span>`);
    btn.addEventListener("click", () => {
      const correct = opt.id === round.answer;
      for (const b of list.querySelectorAll("button")) b.disabled = true;

      const pts = correct ? 10 : 0;
      const sxp = correct ? 8 : 2;
      state.score += pts;
      state.xp.S += sxp;
      if (correct) { state.stats.distortionsCaught++; run.caught++; }
      else state.stats.distortionsMissed++;
      touchStreak();
      markSeen(state.seen.distortions, round.thought);
      saveState();

      run.pts += pts;
      run.results.push(correct ? "good" : "bad");
      btn.classList.add(correct ? "picked-good" : "picked-bad");
      if (!correct) {
        for (const [i, o] of options.entries()) {
          if (o.id === round.answer) list.children[i].classList.add("reveal-best");
        }
      }

      renderDots($("#distortion-progress"), run.deck.length, run.results, run.idx);
      fb.innerHTML = "";
      fb.classList.remove("hidden");
      fb.append(el("div", "fb-verdict " + (correct ? "good" : "bad"),
        correct ? `🎯 Yes — ${answerType.name}` : `Not quite — that's ${answerType.name}`));
      fb.append(el("p", null, `<b>${answerType.name}:</b> ${answerType.short}`));
      fb.append(el("p", null, `<b>The reframe:</b> ${round.reframe}`));
      fb.append(el("div", "fb-points", `<b>${pts >= 0 ? "+" : ""}${pts} ⭐</b> <span class="xp-pill">${TRAITS.S.emoji} Stability +${sxp} XP</span>`));
      const next = el("button", "btn fb-next", "Next →");
      next.addEventListener("click", () => { run.idx++; renderDistortionRound(); });
      fb.append(next);
      next.focus();
      refreshTopbar();
    });
    list.append(btn);
  }
  card.append(list);
}

/* ================= drill mode ================= */
let drRun = null;

function startDrillSession() {
  drRun = {
    deck: drawFrom(DRILLS, state.seen.drills, SESSION_LEN),
    idx: 0,
    results: [],
    pts: 0,
  };
  $("#drill-summary").classList.add("hidden");
  renderDrillRound();
}

const DRILL_CHOICE_EFFECTS = {
  assert: { kind: "assert", traits: { A: 1, S: 1 } },
  doormat: { kind: "doormat", traits: { S: -1 } },
  aggressive: { kind: "aggressive", traits: { A: -1 } },
};

function renderDrillRound() {
  const run = drRun;
  const card = $("#drill-card");
  const fb = $("#drill-feedback");
  fb.classList.add("hidden");

  if (run.idx >= run.deck.length) {
    card.classList.add("hidden");
    sessionSummary($("#drill-summary"), "🗣️ Spine drills complete", run.results, run.pts, [], "drill");
    return;
  }

  card.classList.remove("hidden");
  renderDots($("#drill-progress"), run.deck.length, run.results, run.idx);

  const drill = run.deck[run.idx];
  card.innerHTML = "";
  card.append(el("span", "scene-tag", `Skill: ${drill.skill}`));
  card.append(el("p", "scene-text", drill.situation));
  card.append(el("p", "muted small", "Which response has spine — firm without fangs?"));

  const list = el("div", "choices");
  const opts = shuffle(drill.options.slice());
  for (const opt of opts) {
    const btn = el("button", "choice-btn", opt.text);
    btn.addEventListener("click", () => {
      const effect = { ...DRILL_CHOICE_EFFECTS[opt.kind], fb: "" };
      effect._roundHadDoormat = true;
      const res = applyChoice(effect, "A");
      run.pts += res.pts;
      run.results.push(res.cls);

      for (const b of list.querySelectorAll("button")) b.disabled = true;
      btn.classList.add("picked-" + res.cls);
      if (res.cls !== "good") {
        for (const [i, o] of opts.entries()) {
          if (o.kind === "assert") list.children[i].classList.add("reveal-best");
        }
      }

      renderDots($("#drill-progress"), run.deck.length, run.results, run.idx);
      markSeen(state.seen.drills, drill.situation);
      saveState();

      const verdictText = opt.kind === "assert"
        ? res.label
        : (opt.kind === "doormat" ? "🚪 Doormat wording" : "💥 Flamethrower wording");
      showFeedback(fb, { ...res, label: verdictText },
        `<b>${drill.skill}.</b> ${drill.tip}`,
        () => { run.idx++; renderDrillRound(); });
      refreshTopbar();
    });
    list.append(btn);
  }
  card.append(list);
}

/* ================= breathing ================= */
const BREATH_PHASES = [
  { label: "Breathe in", cls: "grow" },
  { label: "Hold", cls: "grow" },
  { label: "Breathe out", cls: "shrink" },
  { label: "Hold", cls: "shrink" },
];
let breath = null;

function resetBreatheScreen() {
  $("#breathe-setup").classList.remove("hidden");
  $("#breathe-stage").classList.add("hidden");
  $("#breathe-done").classList.add("hidden");
  $("#breathe-done").innerHTML = "";
}

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-breathe]");
  if (b) startBreathing(parseInt(b.dataset.breathe, 10));
});

function startBreathing(totalSec) {
  stopBreathing();
  $("#breathe-setup").classList.add("hidden");
  $("#breathe-done").classList.add("hidden");
  $("#breathe-stage").classList.remove("hidden");

  breath = {
    total: totalSec,
    elapsed: 0,
    phase: -1,
    bonus: 0,
    bonusThisPhase: false,
    phaseChangedAt: 0,
    timer: setInterval(tickBreath, 1000),
  };
  tickBreath();
}

function tickBreath() {
  if (!breath) return;
  const b = breath;
  const phase = Math.floor(b.elapsed / 4) % 4;
  if (phase !== b.phase) {
    b.phase = phase;
    b.phaseChangedAt = Date.now();
    b.bonusThisPhase = false;
    const p = BREATH_PHASES[phase];
    $("#breathe-phase").textContent = p.label;
    const circle = $("#breathe-circle");
    circle.classList.remove("grow", "shrink");
    void circle.offsetWidth; // restart the CSS transition
    circle.classList.add(p.cls);
  }
  const remaining = b.total - b.elapsed;
  $("#breathe-timer").textContent = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
  $("#breathe-bonus").textContent = b.bonus > 0 ? `Rhythm bonus: +${b.bonus}` : "Tap the circle right when the phase changes for bonus points.";

  if (b.elapsed >= b.total) { finishBreathing(true); return; }
  b.elapsed++;
}

$("#breathe-circle").addEventListener("click", () => {
  if (!breath) return;
  if (!breath.bonusThisPhase && Date.now() - breath.phaseChangedAt < 1300) {
    breath.bonus++;
    breath.bonusThisPhase = true;
  }
});

$("#breathe-stop").addEventListener("click", () => finishBreathing(false));

function stopBreathing() {
  if (breath) { clearInterval(breath.timer); breath = null; }
}

function finishBreathing(completed) {
  const b = breath;
  stopBreathing();
  $("#breathe-stage").classList.add("hidden");
  const done = $("#breathe-done");
  done.classList.remove("hidden");
  done.innerHTML = "";

  if (!completed && (!b || b.elapsed < 30)) {
    done.append(el("p", "muted", "Session stopped. Even 30 seconds counts — try again when you're ready."));
    const back = el("button", "btn", "Choose duration");
    back.addEventListener("click", resetBreatheScreen);
    done.append(back);
    return;
  }

  const pts = 10 + b.bonus;
  const sxp = 10 + b.bonus;
  state.score += pts;
  state.xp.S += sxp;
  state.stats.breathSessions++;
  touchStreak();
  saveState();

  done.append(el("div", "fb-verdict good", completed ? "🌊 Session complete" : "🌊 Solid partial session"));
  done.append(el("p", "muted", `You just handed your nervous system the brakes. Rhythm bonus: +${b.bonus}.`));
  done.append(el("div", "fb-points", `<b>+${pts} ⭐</b> <span class="xp-pill">${TRAITS.S.emoji} Stability +${sxp} XP</span>`));
  const row = el("div", "row-buttons");
  row.style.justifyContent = "center";
  const again = el("button", "btn", "Go again");
  again.addEventListener("click", resetBreatheScreen);
  const home = el("button", "btn ghost", "Home");
  home.addEventListener("click", () => showScreen("home"));
  row.append(again, home);
  done.append(row);
  announceBadges(checkBadges());
  refreshTopbar();
}

/* ================= progress ================= */
function renderProgress() {
  const c = currentCulture();
  $("#radar-culture-name").textContent = c ? `${c.flag} ${c.name}` : "your culture";
  drawRadar();

  const grid = $("#stats-grid");
  grid.innerHTML = "";
  const stats = [
    [state.score, "Total score ⭐"],
    [state.stats.sessionsCompleted, "Sessions played"],
    [state.stats.assertiveChoices, "Assertive choices 🦴"],
    [state.stats.doormatChoices, "Doormat slips 🚪"],
    [state.stats.distortionsCaught, "Traps caught 🕵️"],
    [state.stats.breathSessions, "Breath sessions 🌬️"],
    [state.streak.best, "Best streak 🔥"],
    [(state.culturesTried || []).length, "Cultures tried 🌍"],
  ];
  for (const [num, label] of stats) {
    const card = el("div", "stat-card");
    card.append(el("div", "stat-num", String(num)));
    card.append(el("div", "stat-label", label));
    grid.append(card);
  }

  const badges = $("#badge-grid");
  badges.innerHTML = "";
  for (const b of BADGES) {
    const owned = state.badges.includes(b.id);
    const card = el("div", "badge-card" + (owned ? "" : " locked"));
    card.append(el("div", "badge-emoji", b.emoji));
    card.append(el("div", "badge-name", b.name));
    card.append(el("div", "badge-desc", b.desc));
    badges.append(card);
  }
}

function drawRadar() {
  const canvas = $("#radar");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2 + 10, R = Math.min(W, H) / 2 - 70;
  const keys = Object.keys(TRAITS);
  const N = keys.length;
  const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / N;

  // grid rings
  ctx.strokeStyle = "rgba(154,161,192,.25)";
  ctx.lineWidth = 1;
  for (let ring = 1; ring <= 4; ring++) {
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const a = angle(i % N), r = (R * ring) / 4;
      const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // spokes + labels
  ctx.fillStyle = "#9aa1c0";
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  for (let i = 0; i < N; i++) {
    const a = angle(i);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
    ctx.stroke();
    const lx = cx + (R + 38) * Math.cos(a), ly = cy + (R + 30) * Math.sin(a);
    const t = TRAITS[keys[i]];
    ctx.fillText(`${t.emoji} ${t.name.split(" ")[0]}`, lx, ly + 5);
  }

  const drawPoly = (vals, stroke, fill) => {
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const a = angle(i % N), r = R * Math.max(0.04, Math.min(1, vals[i % N]));
      const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  };

  const c = currentCulture();
  if (c) drawPoly(keys.map((k) => c.weights[k] / 5), "rgba(246,200,107,.95)", "rgba(246,200,107,.10)");

  const MAX_LVL = 8;
  drawPoly(keys.map((k) => {
    const xp = state.xp[k], lvl = traitLevel(xp);
    const frac = (xp - levelFloorXp(lvl)) / (nextLevelXp(lvl) - levelFloorXp(lvl));
    return Math.min(1, (lvl + frac) / MAX_LVL);
  }), "rgba(139,124,246,.95)", "rgba(139,124,246,.22)");
}

let resetArmed = false;
$("#reset-save").addEventListener("click", (e) => {
  if (!resetArmed) {
    resetArmed = true;
    e.target.textContent = "Really delete everything? Click again to confirm";
    setTimeout(() => {
      resetArmed = false;
      e.target.textContent = "Reset all progress";
    }, 3000);
    return;
  }
  resetArmed = false;
  resetState();
  showScreen("culture");
});

/* ================= boot ================= */
showScreen(state.cultureId ? "home" : "culture");
