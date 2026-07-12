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
const SCREENS = ["culture", "home", "scenario", "distortion", "drill", "career", "love", "safety", "workday", "board", "gauntlet", "perception", "breathe", "progress", "about"];

function showScreen(name) {
  for (const s of SCREENS) $("#screen-" + s).classList.toggle("hidden", s !== name);
  $("#topbar").classList.toggle("hidden", !state.cultureId);
  window.scrollTo(0, 0);
  stopBreathing();
  stopGauntlet();

  if (name === "culture") renderCultureSelect();
  if (name === "home") renderHome();
  if (name === "scenario") startScenarioSession();
  if (name === "distortion") startDistortionSession();
  if (name === "drill") startDrillSession();
  if (name === "career") renderCampaignMap(CAMPAIGNS.career);
  if (name === "love") renderCampaignMap(CAMPAIGNS.love);
  if (name === "safety") startSafetySession();
  if (name === "workday") enterWorkday();
  if (name === "board") renderBoardScreen();
  if (name === "gauntlet") enterGauntlet();
  if (name === "perception") startPerceptionSession();
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

/* ================= juice fx ================= */
const REDUCED_MOTION = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function scorePop(anchor, text, gain) {
  const r = anchor.getBoundingClientRect();
  const p = el("div", "score-pop " + (gain ? "gain" : "loss"), text);
  p.style.left = Math.min(r.left + r.width * 0.72, window.innerWidth - 90) + "px";
  p.style.top = Math.max(r.top, 60) + "px";
  document.body.append(p);
  setTimeout(() => p.remove(), 950);
}

function shakeScreen() {
  if (REDUCED_MOTION) return;
  const app = $("#app");
  app.classList.remove("shake");
  void app.offsetWidth;
  app.classList.add("shake");
}

function juice(btn, res) {
  scorePop(btn, `${res.pts >= 0 ? "+" : ""}${res.pts} ⭐`, res.pts >= 0);
  if (res.cls === "bad") shakeScreen();
}

const CONFETTI_COLORS = ["#8b7cf6", "#f6c86b", "#5eead4", "#60c6fa", "#4ade80", "#f472b6"];
function confettiBurst(count = 130) {
  if (REDUCED_MOTION) return;
  const canvas = $("#fx-confetti");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const parts = Array.from({ length: count }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.5,
    y: canvas.height * 0.3,
    vx: (Math.random() - 0.5) * 11,
    vy: -Math.random() * 10 - 3,
    size: Math.random() * 7 + 4,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
  }));
  const t0 = performance.now();
  (function frame(t) {
    const dt = (t - t0) / 1000;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (dt > 1.8) return;
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - dt / 1.8);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    requestAnimationFrame(frame);
  })(t0);
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

  const career = state.campaigns.career;
  $("#career-mode-progress").textContent = career.done
    ? "🏆 Ladder complete"
    : `Rung ${career.stage + 1}/${CAREER_STAGES.length} · ${CAREER_STAGES[career.stage].title}`;
  const love = state.campaigns.love;
  $("#love-mode-progress").textContent = love.done
    ? "🏆 All chapters cleared"
    : `${(love.cleared || []).length}/${LOVE_CHAPTERS.length} chapters cleared`;
  $("#workday-mode-progress").textContent = state.stats.backboneIndex
    ? `Index ${state.stats.backboneIndex}/100${state.stats.backboneIndexBest > state.stats.backboneIndex ? ` · best ${state.stats.backboneIndexBest}` : ""}`
    : "Get your number";
  $("#board-mode-progress").textContent = state.board.active
    ? `Run in progress — tile ${state.board.pos + 1}/${BOARD_LAYOUT.length} · ${state.board.coins} 🪙`
    : state.stats.boardWins
      ? `🏆 ${state.stats.boardWins} win${state.stats.boardWins > 1 ? "s" : ""} · best ${state.stats.boardBestCoins} 🪙`
      : "";
  $("#gauntlet-mode-progress").textContent = dailyDoneToday()
    ? `Daily #${state.daily.number} ✅${state.stats.gauntletBest ? ` · Best ${state.stats.gauntletBest} ⭐` : ""}`
    : `📅 Daily #${dailyNumber()} is live`;
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
  if (goods === results.length && results.length > 0) confettiBurst();
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
      juice(btn, res);
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
      scorePop(btn, correct ? "+" + pts + " ⭐" : "✗", correct);
      if (!correct) shakeScreen();
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
      juice(btn, res);
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

/* ================= campaigns (Career Ladder / Relationships) ================= */
const CAMPAIGNS = {
  career: {
    key: "career", data: CAREER_STAGES, screen: "career", locked: true,
    title: "💼 The Career Ladder", stageWord: "rung",
    intro: "Six rungs, from the interview chair to the corner office — including a full rung of negotiation craft. Clear a rung by making 2 of 3 strong moves; doormat compliance and blow-ups both stall careers.",
    advanceWord: "Promoted!",
    finale: "🏢 Top of the ladder. You interviewed, negotiated, pushed back, owned mistakes, got the title, and led people — without once playing the doormat.",
  },
  love: {
    key: "love", data: LOVE_CHAPTERS, screen: "love", locked: false,
    title: "❤️ Relationships", stageWord: "chapter",
    intro: "Romantic and platonic, in any order — you know where you are in life, so play the chapter that matches. Nothing's locked. Clear a chapter with 2 of 3 strong moves: honesty and warmth, never doormat peace.",
    advanceWord: "Chapter cleared!",
    finale: "💍 Every chapter cleared. First dates, friendship, hard talks, in-laws, money, and the big fork in the road — handled with warmth and a spine.",
  },
};
let campRun = null;

function campEls(cfg) {
  return {
    map: $(`#${cfg.screen}-map`),
    card: $(`#${cfg.screen}-card`),
    fb: $(`#${cfg.screen}-feedback`),
    summary: $(`#${cfg.screen}-summary`),
    dots: $(`#${cfg.screen}-progress`),
  };
}

function renderCampaignMap(cfg) {
  const els = campEls(cfg);
  const prog = state.campaigns[cfg.key];
  els.card.classList.add("hidden");
  els.fb.classList.add("hidden");
  els.summary.classList.add("hidden");
  els.summary.innerHTML = "";
  els.dots.innerHTML = "";
  els.map.classList.remove("hidden");
  els.map.innerHTML = "";

  els.map.append(el("h2", "section-title", cfg.title));
  els.map.append(el("p", "muted small", cfg.intro));
  if (prog.done) {
    els.map.append(el("div", "banner", `<h2>🏆 Campaign complete</h2><p class="muted small">${cfg.finale} Replay any ${cfg.stageWord} below.</p>`));
  }

  cfg.data.forEach((stage, i) => {
    let done, playable, lockedRow;
    if (cfg.locked) {
      done = prog.done || i < prog.stage;
      playable = !prog.done && i === prog.stage;
      lockedRow = !done && !playable;
    } else {
      done = (prog.cleared || []).includes(stage.id);
      playable = !done;
      lockedRow = false;
    }
    const row = el("div", "stage-row" + (done ? " stage-done" : lockedRow ? " stage-locked" : cfg.locked ? " stage-current" : ""));
    row.append(el("span", "stage-emoji", done ? "✅" : lockedRow ? "🔒" : stage.emoji));
    const info = el("div", "stage-info");
    const label = cfg.locked ? `Rung ${i + 1}: ${stage.title}` : stage.title;
    info.append(el("div", "stage-title", label));
    info.append(el("div", "stage-desc muted tiny", stage.desc));
    row.append(info);
    if (playable) {
      const play = el("button", "btn small-btn", "Play");
      play.addEventListener("click", () => startCampaignStage(cfg, i, false));
      row.append(play);
    } else if (done) {
      const replay = el("button", "btn ghost small-btn", "Replay");
      replay.addEventListener("click", () => startCampaignStage(cfg, i, true));
      row.append(replay);
    }
    els.map.append(row);
  });
}

function startCampaignStage(cfg, stageIdx, isReplay) {
  const stage = cfg.data[stageIdx];
  campRun = {
    cfg, stageIdx, isReplay,
    stage,
    deck: shuffle(stage.scenarios.slice()),
    idx: 0,
    results: [],
    pts: 0,
  };
  const els = campEls(cfg);
  els.map.classList.add("hidden");
  els.summary.classList.add("hidden");
  renderCampaignRound();
}

function renderCampaignRound() {
  const run = campRun;
  const cfg = run.cfg;
  const els = campEls(cfg);
  els.fb.classList.add("hidden");

  if (run.idx >= run.deck.length) {
    finishCampaignStage();
    return;
  }

  els.card.classList.remove("hidden");
  renderDots(els.dots, run.deck.length, run.results, run.idx);

  const sc = run.deck[run.idx];
  els.card.innerHTML = "";
  els.card.append(el("span", "scene-tag", `${run.stage.emoji} ${run.stage.title} · ${sc.tag}`));
  els.card.append(el("p", "scene-text", sc.text));

  const hadDoormat = sc.choices.some((ch) => ch.kind === "doormat");
  const list = el("div", "choices");
  const order = shuffle(sc.choices.map((_, i) => i));
  for (const i of order) {
    const ch = sc.choices[i];
    const btn = el("button", "choice-btn", ch.text);
    btn.addEventListener("click", () => {
      ch._roundHadDoormat = hadDoormat;
      const res = applyChoice(ch, sc.focus);
      juice(btn, res);
      run.pts += res.pts;
      run.results.push(res.cls);

      for (const b of list.querySelectorAll("button")) b.disabled = true;
      btn.classList.add("picked-" + res.cls);
      if (res.cls !== "good") {
        for (const j of order) {
          if (kindClass(sc.choices[j].kind) === "good") {
            list.children[order.indexOf(j)].classList.add("reveal-best");
          }
        }
      }

      renderDots(els.dots, run.deck.length, run.results, run.idx);
      showFeedback(els.fb, res, ch.fb, () => { run.idx++; renderCampaignRound(); });
      refreshTopbar();
    });
    list.append(btn);
  }
  els.card.append(list);
}

function finishCampaignStage() {
  const run = campRun;
  const cfg = run.cfg;
  const els = campEls(cfg);
  const prog = state.campaigns[cfg.key];
  els.card.classList.add("hidden");
  els.card.innerHTML = "";

  const strong = run.results.filter((r) => r === "good").length;
  const cleared = strong >= 2;
  let advanced = false;
  let completedCampaign = false;

  if (cfg.locked) {
    if (cleared && !run.isReplay && run.stageIdx === prog.stage && !prog.done) {
      prog.stage++;
      advanced = true;
      if (prog.stage >= cfg.data.length) {
        prog.done = true;
        completedCampaign = true;
      }
    }
  } else if (cleared) {
    if (!(prog.cleared || []).includes(run.stage.id)) {
      prog.cleared.push(run.stage.id);
      advanced = true;
    }
    if (prog.cleared.length >= cfg.data.length && !prog.done) {
      prog.done = true;
      completedCampaign = true;
    }
  }
  if (advanced || completedCampaign) confettiBurst(completedCampaign ? 220 : 130);
  state.stats.sessionsCompleted++;
  saveState();

  els.summary.classList.remove("hidden");
  els.summary.innerHTML = "";
  const card = el("div", "card summary-card");
  const headline = completedCampaign ? "🏆 " + cfg.finale
    : advanced ? (cfg.locked
        ? `🎉 ${cfg.advanceWord} ${cfg.data[prog.stage].emoji} Next ${cfg.stageWord}: ${cfg.data[prog.stage].title}`
        : `🎉 ${cfg.advanceWord} Pick your next ${cfg.stageWord} from the map.`)
    : cleared ? `✅ ${run.stage.title} cleared${run.isReplay ? " (replay)" : ""}`
    : `Not this time — ${run.stage.title} pushed back.`;
  card.append(el("h2", null, headline));
  card.append(el("div", "summary-big", `${strong}/${run.deck.length} strong`));
  card.append(el("div", "summary-line", `Session points: ${run.pts >= 0 ? "+" : ""}${run.pts} ⭐`));
  if (!cleared) card.append(el("div", "summary-line", `You need 2 strong moves to clear the ${cfg.stageWord}. The reveal showed you where the spine was — run it again.`));

  const row = el("div", "row-buttons");
  row.style.justifyContent = "center";
  if (!cleared) {
    const retry = el("button", "btn", "Run it again");
    retry.addEventListener("click", () => startCampaignStage(cfg, run.stageIdx, run.isReplay));
    row.append(retry);
  } else if (advanced && !completedCampaign && cfg.locked) {
    const next = el("button", "btn", `Next ${cfg.stageWord} →`);
    next.addEventListener("click", () => startCampaignStage(cfg, prog.stage, false));
    row.append(next);
  }
  const map = el("button", "btn ghost", "Back to map");
  map.addEventListener("click", () => renderCampaignMap(cfg));
  const home = el("button", "btn ghost", "Home");
  home.addEventListener("click", () => showScreen("home"));
  row.append(map, home);
  card.append(row);
  els.summary.append(card);

  announceBadges(checkBadges());
  refreshTopbar();
}

/* ================= safety radar ================= */
let sfRun = null;

function startSafetySession() {
  sfRun = {
    deck: drawFrom(SAFETY, state.seen.safety, SESSION_LEN),
    idx: 0,
    results: [],
    pts: 0,
    safeCalls: 0,
  };
  $("#safety-summary").classList.add("hidden");
  renderSafetyRound();
}

function renderSafetyRound() {
  const run = sfRun;
  const card = $("#safety-card");
  const fb = $("#safety-feedback");
  fb.classList.add("hidden");

  if (run.idx >= run.deck.length) {
    card.classList.add("hidden");
    sessionSummary($("#safety-summary"), "🛡️ Radar sweep complete", run.results, run.pts,
      [`Safe calls: ${run.safeCalls}/${run.deck.length}.`,
       "The tactics repeat everywhere — once you can name them, they lose most of their power."],
      "safety");
    return;
  }

  card.classList.remove("hidden");
  renderDots($("#safety-progress"), run.deck.length, run.results, run.idx);

  const round = run.deck[run.idx];
  card.innerHTML = "";
  card.append(el("span", "scene-tag", `🛡️ ${round.tag}`));
  card.append(el("p", "scene-text", round.text));

  const hadDoormat = round.choices.some((ch) => ch.kind === "doormat");
  const list = el("div", "choices");
  const order = shuffle(round.choices.map((_, i) => i));
  for (const i of order) {
    const ch = round.choices[i];
    const btn = el("button", "choice-btn", ch.text);
    btn.addEventListener("click", () => {
      ch._roundHadDoormat = hadDoormat;
      const res = applyChoice(ch, "S");
      juice(btn, res);
      run.pts += res.pts;
      run.results.push(res.cls);
      if (res.cls === "good") {
        run.safeCalls++;
        state.stats.safetyStrong++;
      }

      for (const b of list.querySelectorAll("button")) b.disabled = true;
      btn.classList.add("picked-" + res.cls);
      if (res.cls !== "good") {
        for (const j of order) {
          if (kindClass(round.choices[j].kind) === "good") {
            list.children[order.indexOf(j)].classList.add("reveal-best");
          }
        }
      }

      renderDots($("#safety-progress"), run.deck.length, run.results, run.idx);
      markSeen(state.seen.safety, round.id);
      saveState();

      fb.innerHTML = "";
      fb.classList.remove("hidden");
      fb.append(el("div", "fb-verdict " + res.cls, res.label));
      fb.append(el("p", null, ch.fb));
      fb.append(el("div", "fb-culture", `🎯 <b>The tactic — ${round.tactic.name}:</b> ${round.tactic.tip}`));
      fb.append(el("div", "fb-points", `<b>${res.pts >= 0 ? "+" : ""}${res.pts} ⭐</b> ${xpPills(res.xpGained)}`));
      const next = el("button", "btn fb-next", "Next →");
      next.addEventListener("click", () => { run.idx++; renderSafetyRound(); });
      fb.append(next);
      next.focus();
      refreshTopbar();
    });
    list.append(btn);
  }
  card.append(list);
}

/* ================= workplace backbone test ================= */
let wdRun = null;

function workdayItems() {
  return WORKDAY_TEST.map((ref) => {
    if (ref.type === "drill") {
      const d = DRILLS.find((x) => x.situation.includes(ref.match));
      return {
        tag: `Office moment · ${d.skill}`,
        text: d.situation,
        choices: d.options.map((o) => ({ ...DRILL_CHOICE_EFFECTS[o.kind], text: o.text, fb: `<b>${d.skill}.</b> ${d.tip}` })),
      };
    }
    const pool = ref.type === "career" ? CAREER_STAGES.flatMap((s) => s.scenarios) : SCENARIOS;
    const sc = pool.find((x) => x.id === ref.id);
    return { tag: `Office moment · ${sc.tag}`, text: sc.text, choices: sc.choices, focus: sc.focus };
  });
}

function enterWorkday() {
  wdRun = null;
  $("#workday-intro").classList.remove("hidden");
  $("#workday-card").classList.add("hidden");
  $("#workday-feedback").classList.add("hidden");
  $("#workday-result").classList.add("hidden");
  $("#workday-result").innerHTML = "";
  $("#workday-progress").innerHTML = "";
}

document.addEventListener("click", (e) => {
  if (e.target.closest("#workday-start")) startWorkday();
  if (e.target.closest("#quick-start")) {
    if (!state.cultureId) setCulture("style-global");
    showScreen("workday");
  }
});

function startWorkday() {
  wdRun = { items: workdayItems(), idx: 0, results: [], picks: [] };
  $("#workday-intro").classList.add("hidden");
  renderWorkdayRound();
}

function renderWorkdayRound() {
  const run = wdRun;
  const card = $("#workday-card");
  const fb = $("#workday-feedback");
  fb.classList.add("hidden");

  if (run.idx >= run.items.length) { finishWorkday(); return; }

  card.classList.remove("hidden");
  renderDots($("#workday-progress"), run.items.length, run.results, run.idx);

  const item = run.items[run.idx];
  card.innerHTML = "";
  card.append(el("span", "scene-tag", `🧳 ${run.idx + 1}/10 · ${item.tag}`));
  card.append(el("p", "scene-text", item.text));

  const hadDoormat = item.choices.some((c) => c.kind === "doormat");
  const list = el("div", "choices");
  const order = shuffle(item.choices.map((_, i) => i));
  for (const i of order) {
    const ch = item.choices[i];
    const btn = el("button", "choice-btn", ch.text);
    btn.addEventListener("click", () => {
      ch._roundHadDoormat = hadDoormat;
      const res = applyChoice(ch, item.focus || "A");
      juice(btn, res);
      const pts = INDEX_POINTS[ch.kind] ?? 0;
      run.picks.push({ kind: ch.kind, pts });
      run.results.push(res.cls);

      for (const b of list.querySelectorAll("button")) b.disabled = true;
      btn.classList.add("picked-" + res.cls);
      if (res.cls !== "good") {
        for (const j of order) {
          if (kindClass(item.choices[j].kind) === "good") list.children[order.indexOf(j)].classList.add("reveal-best");
        }
      }

      renderDots($("#workday-progress"), run.items.length, run.results, run.idx);
      fb.innerHTML = "";
      fb.classList.remove("hidden");
      fb.append(el("div", "fb-verdict " + res.cls, res.label));
      fb.append(el("p", null, ch.fb));
      fb.append(el("div", "fb-points", `<b>+${pts} index</b> ${xpPills(res.xpGained)}`));
      const next = el("button", "btn fb-next", run.idx === run.items.length - 1 ? "See my Backbone Index →" : "Next →");
      next.addEventListener("click", () => { run.idx++; renderWorkdayRound(); });
      fb.append(next);
      next.focus();
      refreshTopbar();
    });
    list.append(btn);
  }
  card.append(list);
}

function workdayShareLinkedIn(index, tier, spine, doormats, blowups) {
  return `I took a 2-minute "Workplace Backbone Test" — ten office standoffs (the Friday 5:45pm ask, the credit thief, the salary silence). No right-sounding answers; you pick what you'd actually do.`
    + `\n\nMy Backbone Index: ${index}/100 — ${tier.emoji} ${tier.name}`
    + `\n• Held the line in ${spine}/10 moments`
    + `\n• Doormat slips: ${doormats}`
    + `\n• Blow-ups: ${blowups}`
    + `\n\nIt read me uncomfortably well. Curious where you land.`;
}

function finishWorkday() {
  const run = wdRun;
  const index = run.picks.reduce((a, p) => a + p.pts, 0);
  const spine = run.picks.filter((p) => p.pts === 10).length;
  const doormats = run.picks.filter((p) => p.kind === "doormat").length;
  const blowups = run.picks.filter((p) => p.kind === "aggressive").length;
  const tier = INDEX_TIERS.find((t) => index >= t.min);

  state.stats.workdayRuns++;
  state.stats.backboneIndex = index;
  state.stats.backboneIndexBest = Math.max(state.stats.backboneIndexBest || 0, index);
  state.stats.sessionsCompleted++;
  touchStreak();
  saveState();
  if (index >= 85) confettiBurst(200);

  $("#workday-card").classList.add("hidden");
  $("#workday-feedback").classList.add("hidden");
  const box = $("#workday-result");
  box.classList.remove("hidden");
  box.innerHTML = "";

  const card = el("div", "verdict-card");
  card.append(el("div", "verdict-label", "Your Workplace Backbone Index"));
  const num = el("div", "index-num", "0");
  card.append(num);
  card.append(el("div", "verdict-emoji", tier.emoji));
  card.append(el("div", "verdict-name", tier.name));
  card.append(el("div", "verdict-line", `“${tier.line}”`));
  const stats = el("div", "verdict-stats");
  for (const p of [`🦴 Held the line ${spine}/10`, `🚪 Doormat slips: ${doormats}`, `💥 Blow-ups: ${blowups}`]) {
    stats.append(el("span", "xp-pill", p));
  }
  card.append(stats);
  const shareRow = el("div", "row-buttons");
  shareRow.style.justifyContent = "center";
  const liBtn = el("button", "btn small-btn", "📋 Copy LinkedIn version");
  liBtn.addEventListener("click", () => copyText(workdayShareLinkedIn(index, tier, spine, doormats, blowups)));
  const casualBtn = el("button", "btn ghost small-btn", "📋 Copy group-chat version");
  casualBtn.addEventListener("click", () => copyText(
    `🦴 Backbone Index: ${index}/100 (${tier.emoji} ${tier.name}) — 10 office standoffs, ${doormats} doormat slip${doormats === 1 ? "" : "s"}${doormats ? " 😅" : " 😤"}. Bet you can't beat it.`));
  shareRow.append(liBtn, casualBtn);
  card.append(shareRow);
  box.append(card);

  // train-the-gaps funnel
  const gaps = el("div", "card center-card");
  gaps.append(el("h3", null, "Train the gaps"));
  const sugg = el("div", "row-buttons");
  sugg.style.justifyContent = "center";
  const suggestions = [];
  if (doormats > 0) suggestions.push(["🗣️ Spine drills", "drill"]);
  if (blowups > 0) suggestions.push(["🎭 Situations", "scenario"]);
  if (index < 85) suggestions.push(["🎙️ Negotiation rung", "career"]);
  if (!suggestions.length) suggestions.push(["🎲 Life Board", "board"]);
  for (const [label, nav] of suggestions.slice(0, 2)) {
    const b = el("button", "btn ghost", label);
    b.addEventListener("click", () => showScreen(nav));
    sugg.append(b);
  }
  const retake = el("button", "btn ghost", "↻ Retake");
  retake.addEventListener("click", startWorkday);
  sugg.append(retake);
  gaps.append(sugg);
  box.append(gaps);

  // count-up animation on the big number
  const t0 = performance.now();
  (function tick(t) {
    const p = Math.min(1, (t - t0) / 900);
    num.textContent = String(Math.round(index * (REDUCED_MOTION ? 1 : (1 - Math.pow(1 - p, 3)))));
    if (p < 1) requestAnimationFrame(tick);
  })(t0);

  announceBadges(checkBadges());
  refreshTopbar();
}

/* ================= life board ================= */
const BOARD_DECKS = {
  scenario: () => drawScenarios(1)[0],
  work: () => CAREER_STAGES.flatMap((s) => s.scenarios)[Math.floor(Math.random() * CAREER_STAGES.flatMap((s) => s.scenarios).length)],
  people: () => LOVE_CHAPTERS.flatMap((s) => s.scenarios)[Math.floor(Math.random() * LOVE_CHAPTERS.flatMap((s) => s.scenarios).length)],
  street: () => SAFETY[Math.floor(Math.random() * SAFETY.length)],
  frame: () => PERCEPTION[Math.floor(Math.random() * PERCEPTION.length)],
};
let boardBusy = false;

function boardHud() {
  const b = state.board;
  $("#board-energy").textContent = b.active ? "❤️".repeat(b.energy) + "🖤".repeat(Math.max(0, 3 - b.energy)) : "";
  $("#board-coins").textContent = b.active ? `🪙 ${b.coins}` : "";
  $("#board-tile").textContent = b.active ? `${b.pos + 1}/${BOARD_LAYOUT.length}` : "";
}

function renderBoardScreen() {
  boardBusy = false;
  const b = state.board;
  const view = $("#board-view");
  $("#board-round").classList.add("hidden");
  $("#board-round").innerHTML = "";
  view.classList.remove("hidden");
  view.innerHTML = "";
  boardHud();

  const grid = el("div", "board-grid");
  const cols = 6;
  const rows = Math.ceil(BOARD_LAYOUT.length / cols);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + (row % 2 === 0 ? col : cols - 1 - col); // serpentine path
      if (idx >= BOARD_LAYOUT.length) { grid.append(el("div")); continue; }
      const t = BOARD_LAYOUT[idx];
      const tile = el("div", "tile"
        + (b.active && idx === b.pos ? " tile-current" : "")
        + (b.active && idx < b.pos ? " tile-done" : "")
        + (t.t === "finish" ? " tile-finish" : ""));
      tile.title = `${idx + 1}. ${t.name}`;
      tile.append(el("span", "tile-emoji", t.emoji));
      tile.append(el("span", "tile-name", t.name));
      grid.append(tile);
    }
  }
  view.append(grid);

  const controls = el("div", "board-controls");
  if (!b.active) {
    const intro = el("p", "muted small board-note",
      "One run: roll the die, land on life, answer with spine. Strong answers earn 🪙 and boosts; " +
      "doormat answers slide you back two tiles; blow-ups and bad calls cost ❤️. Reach 🏆 before your hearts run out.");
    view.append(intro);
    const start = el("button", "btn dice-btn", "🎲 Start a run");
    start.addEventListener("click", () => {
      state.board = { active: true, pos: 0, energy: 3, coins: 0 };
      saveState();
      renderBoardScreen();
    });
    controls.append(start);
  } else {
    const roll = el("button", "btn dice-btn", "🎲 Roll");
    roll.id = "board-roll";
    roll.addEventListener("click", rollBoardDice);
    controls.append(roll);
    const abandon = el("button", "btn ghost small-btn", "Abandon run");
    let armed = false;
    abandon.addEventListener("click", () => {
      if (!armed) { armed = true; abandon.textContent = "Really abandon? Coins are lost"; setTimeout(() => { armed = false; abandon.textContent = "Abandon run"; }, 2500); return; }
      state.board = { active: false, pos: 0, energy: 3, coins: 0 };
      saveState();
      renderBoardScreen();
    });
    controls.append(abandon);
  }
  view.append(controls);
}

function rollBoardDice() {
  if (boardBusy || !state.board.active) return;
  boardBusy = true;
  const btn = $("#board-roll");
  const faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  const n = 1 + Math.floor(Math.random() * 6);
  let spins = 0;
  const spin = setInterval(() => {
    btn.textContent = faces[Math.floor(Math.random() * 6)] + " …";
    if (++spins >= 8) {
      clearInterval(spin);
      btn.textContent = `${faces[n - 1]} ${n}!`;
      moveToken(n);
    }
  }, 85);
}

function moveToken(steps) {
  const b = state.board;
  const target = Math.min(b.pos + steps, BOARD_LAYOUT.length - 1);
  const walker = setInterval(() => {
    b.pos++;
    boardHud();
    const current = document.querySelector(".tile-current");
    if (current) current.classList.remove("tile-current");
    // re-render grid marker cheaply
    renderBoardMarker();
    if (b.pos >= target) {
      clearInterval(walker);
      saveState();
      setTimeout(() => triggerBoardTile(), 420);
    }
  }, 230);
}

function renderBoardMarker() {
  const b = state.board;
  const cols = 6;
  document.querySelectorAll(".board-grid .tile").forEach((tileEl) => {
    const idx = parseInt(tileEl.title, 10) - 1;
    tileEl.classList.toggle("tile-current", idx === b.pos);
    tileEl.classList.toggle("tile-done", idx < b.pos);
  });
}

function triggerBoardTile() {
  const b = state.board;
  const tile = BOARD_LAYOUT[b.pos];
  if (tile.t === "finish") { endBoardRun(true); return; }
  if (tile.t === "chance") {
    const ev = CHANCE_EVENTS[Math.floor(Math.random() * CHANCE_EVENTS.length)];
    let line = "";
    if (ev.effect.coins) { b.coins = Math.max(0, b.coins + ev.effect.coins); line = `${ev.effect.coins > 0 ? "+" : ""}${ev.effect.coins} 🪙`; }
    if (ev.effect.energy) { b.energy = Math.min(3, b.energy + ev.effect.energy); line = "+1 ❤️"; }
    if (ev.effect.move) { b.pos = Math.max(0, Math.min(BOARD_LAYOUT.length - 1, b.pos + ev.effect.move)); line = `${ev.effect.move > 0 ? "forward" : "back"} ${Math.abs(ev.effect.move)} tiles`; }
    saveState();
    boardEventCard("🎲 Chance", `${ev.emoji} ${ev.text}`, line, () => {
      if (BOARD_LAYOUT[b.pos].t === "finish") endBoardRun(true);
      else renderBoardScreen();
    });
    return;
  }
  if (tile.t === "rest") {
    b.energy = Math.min(3, b.energy + 1);
    state.xp.S += 4;
    saveState();
    boardEventCard("🌬️ Rest Stop", "Four slow breaths. In 4 — hold 4 — out 4 — hold 4. The board can wait; your nervous system can't.", "+1 ❤️ · Stability +4 XP", renderBoardScreen);
    return;
  }
  startBoardRound(tile);
}

function boardEventCard(tag, text, rewardLine, onContinue) {
  $("#board-view").classList.add("hidden");
  const wrap = $("#board-round");
  wrap.classList.remove("hidden");
  wrap.innerHTML = "";
  const card = el("div", "card center-card");
  card.append(el("span", "scene-tag", tag));
  card.append(el("p", "scene-text", text));
  if (rewardLine) card.append(el("div", "fb-points", `<b>${rewardLine}</b>`));
  const next = el("button", "btn", "Continue →");
  next.addEventListener("click", onContinue);
  card.append(next);
  wrap.append(card);
  boardHud();
  next.focus();
}

function startBoardRound(tile) {
  const b = state.board;
  let item, focus, extraTip = null;
  if (tile.t === "mind") {
    const r = DISTORTIONS[Math.floor(Math.random() * DISTORTIONS.length)];
    const answer = DISTORTION_TYPES.find((t) => t.id === r.answer);
    const decoys = shuffle(DISTORTION_TYPES.filter((t) => t.id !== r.answer)).slice(0, 3);
    item = {
      tag: "🧠 Name the thinking trap", text: r.thought, focus: "S",
      choices: shuffle([answer, ...decoys].map((t) => ({
        kind: t.id === r.answer ? "good" : "avoid",
        traits: t.id === r.answer ? { S: 2 } : {},
        text: `<b>${t.name}</b> — <span class="muted">${t.short}</span>`,
        fb: t.id === r.answer ? `Caught it. The reframe: ${r.reframe}` : `Not this one — it's ${answer.name}. ${r.reframe}`,
      }))),
    };
    focus = "S";
  } else {
    const src = BOARD_DECKS[tile.t]();
    focus = src.focus || "S";
    item = { tag: `${tile.emoji} ${src.tag || tile.name}`, text: src.text, choices: src.choices };
    if (src.tactic) extraTip = `🎯 <b>The tactic — ${src.tactic.name}:</b> ${src.tactic.tip}`;
    if (src.principle) extraTip = `⚗️ <b>The principle — ${src.principle.name}:</b> ${src.principle.tip}`;
  }

  $("#board-view").classList.add("hidden");
  const wrap = $("#board-round");
  wrap.classList.remove("hidden");
  wrap.innerHTML = "";
  const card = el("div", "card");
  card.append(el("span", "scene-tag", item.tag));
  card.append(el("p", "scene-text", item.text));
  const fb = el("div", "feedback hidden");
  const list = el("div", "choices");
  const hadDoormat = item.choices.some((c) => c.kind === "doormat");
  const order = shuffle(item.choices.map((_, i) => i));
  for (const i of order) {
    const ch = item.choices[i];
    const btn = el("button", "choice-btn", ch.text);
    btn.addEventListener("click", () => {
      ch._roundHadDoormat = hadDoormat;
      const res = applyChoice(ch, focus);
      juice(btn, res);
      for (const bt of list.querySelectorAll("button")) bt.disabled = true;
      btn.classList.add("picked-" + res.cls);
      if (res.cls !== "good") {
        for (const j of order) {
          if (kindClass(item.choices[j].kind) === "good") list.children[order.indexOf(j)].classList.add("reveal-best");
        }
      }

      let pendingMove = 0;
      let rewardLine;
      if (res.cls === "good") {
        b.coins += 12;
        rewardLine = "+12 🪙";
        if (["assertDirect", "assertDiplo", "assert"].includes(ch.kind)) { pendingMove = 1; rewardLine += " · 🦴 spine boost: +1 tile"; }
      } else if (res.cls === "mid") {
        b.coins += 4;
        rewardLine = "+4 🪙";
      } else {
        b.energy--;
        rewardLine = "-1 ❤️";
        if (ch.kind === "doormat") { pendingMove = -2; rewardLine += " · 🚪 doormat slide: back 2 tiles"; }
      }
      saveState();
      boardHud();

      fb.innerHTML = "";
      fb.classList.remove("hidden");
      fb.append(el("div", "fb-verdict " + res.cls, res.label));
      fb.append(el("p", null, ch.fb));
      if (extraTip) fb.append(el("div", "fb-culture", extraTip));
      fb.append(el("div", "fb-points", `<b>${rewardLine}</b> ${xpPills(res.xpGained)}`));
      const next = el("button", "btn fb-next", "Continue →");
      next.addEventListener("click", () => {
        if (pendingMove) b.pos = Math.max(0, Math.min(BOARD_LAYOUT.length - 1, b.pos + pendingMove));
        saveState();
        if (b.energy <= 0) endBoardRun(false);
        else if (BOARD_LAYOUT[b.pos].t === "finish") endBoardRun(true);
        else renderBoardScreen();
      });
      fb.append(next);
      next.focus();
      refreshTopbar();
    });
    list.append(btn);
  }
  card.append(list);
  wrap.append(card, fb);
  boardHud();
}

function endBoardRun(won) {
  const b = state.board;
  const coins = b.coins;
  const bonus = won ? coins : Math.floor(coins / 2);
  state.score += bonus;
  state.stats.boardRuns++;
  if (won) state.stats.boardWins++;
  state.stats.boardBestCoins = Math.max(state.stats.boardBestCoins || 0, won ? coins : 0);
  state.stats.sessionsCompleted++;
  state.board = { active: false, pos: 0, energy: 3, coins: 0 };
  touchStreak();
  saveState();
  if (won) confettiBurst(220);

  $("#board-view").classList.add("hidden");
  const wrap = $("#board-round");
  wrap.classList.remove("hidden");
  wrap.innerHTML = "";
  const card = el("div", "card summary-card");
  card.append(el("h2", null, won ? "🏆 Life, well played" : "💔 The board got you"));
  card.append(el("div", "summary-big", `${coins} 🪙`));
  card.append(el("div", "summary-line", won
    ? `Full run survived — coins banked as +${bonus} ⭐`
    : `Out of hearts — half the coins banked anyway: +${bonus} ⭐. The board remembers nothing; run it back.`));
  const row = el("div", "row-buttons");
  row.style.justifyContent = "center";
  const again = el("button", "btn", "🎲 New run");
  again.addEventListener("click", () => {
    state.board = { active: true, pos: 0, energy: 3, coins: 0 };
    saveState();
    renderBoardScreen();
  });
  const home = el("button", "btn ghost", "Home");
  home.addEventListener("click", () => showScreen("home"));
  row.append(again, home);
  card.append(row);
  wrap.append(card);
  wrap.append(buildVerdictCard());
  boardHud();
  announceBadges(checkBadges());
  refreshTopbar();
}

/* ================= verdict card (shareable read) ================= */
function buildVerdictCard() {
  const a = currentArchetype();
  const bp = backbonePct();
  const cp = calmPct();
  const card = el("div", "verdict-card");
  card.append(el("div", "verdict-label", "The game reads you as"));
  card.append(el("div", "verdict-emoji", a.emoji));
  card.append(el("div", "verdict-name", a.name));
  card.append(el("div", "verdict-line", `“${a.line}”`));
  const stats = el("div", "verdict-stats");
  const pills = [
    `🦴 Backbone ${bp === null ? "–" : bp + "%"}`,
    `😌 Calm ${cp === null ? "–" : cp + "%"}`,
    `⭐ ${state.score}`,
  ];
  if (state.stats.gauntletBest) pills.push(`⚡ Best ${state.stats.gauntletBest}`);
  for (const p of pills) stats.append(el("span", "xp-pill", p));
  card.append(stats);
  const share = el("button", "btn small-btn", "📋 Copy my result");
  share.addEventListener("click", copyShare);
  card.append(share);
  return card;
}

function copyShare() {
  copyText(shareText());
}

function copyText(text) {
  const done = () => toast("📋 Copied — go post it");
  const fail = () => {
    try {
      const ta = el("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.append(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      ok ? done() : toast("Couldn't copy — screenshot the card instead 📸");
    } catch {
      toast("Couldn't copy — screenshot the card instead 📸");
    }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, fail);
  } else fail();
}

/* ================= the gauntlet ================= */
const GAUNTLET_ROUNDS = 10;
let gRun = null;

function enterGauntlet() {
  $("#gauntlet-intro").classList.remove("hidden");
  $("#gauntlet-play").classList.add("hidden");
  $("#gauntlet-summary").classList.add("hidden");
  $("#gauntlet-summary").innerHTML = "";
  updateGauntletHud(3, 0, 0);
  $("#gauntlet-daily").classList.remove("hidden");
  renderDailySlot();
}

function renderDailySlot() {
  const slot = $("#gauntlet-daily");
  slot.innerHTML = "";
  const n = dailyNumber();
  if (dailyDoneToday()) {
    const d = state.daily;
    slot.append(el("div", "verdict-label", `📅 Daily #${d.number} — done for today`));
    slot.append(el("div", "summary-big", `${d.score} ⭐`));
    slot.append(el("div", "squares", d.squares.join("")));
    const hrs = Math.floor(msUntilNextDaily() / 3600000);
    const mins = Math.floor((msUntilNextDaily() % 3600000) / 60000);
    slot.append(el("p", "muted tiny", `Same 10 rounds for everyone today. Next daily in ${hrs}h ${mins}m.`));
    const share = el("button", "btn small-btn", "📋 Copy daily result");
    share.addEventListener("click", () => copyText(dailyShareText()));
    slot.append(share);
  } else {
    slot.append(el("div", "verdict-label", "One scored attempt · same rounds for everyone"));
    slot.append(el("h2", null, `📅 Daily Gauntlet #${n}`));
    slot.append(el("p", "muted small", "Today's 10 rounds are identical for every player on Earth. One official run — then your emoji grid is ready to post."));
    const start = el("button", "btn", `Play Daily #${n}`);
    start.addEventListener("click", () => startGauntletRun(true));
    slot.append(start);
  }
}

function gauntletDeck(rng) {
  const shuf = rng ? (arr) => seededShuffle(arr, rng) : shuffle;
  const drills = shuf(DRILLS.slice()).slice(0, 5).map((d) => ({
    type: "drill",
    time: 15,
    tag: `Say it with spine · ${d.skill}`,
    prompt: d.situation,
    options: shuf(d.options.map((o) => ({ text: o.text, correct: o.kind === "assert", kind: o.kind }))),
    lesson: d.tip,
  }));
  const traps = shuf(DISTORTIONS.slice()).slice(0, 5).map((r) => {
    const answer = DISTORTION_TYPES.find((t) => t.id === r.answer);
    const decoys = shuf(DISTORTION_TYPES.filter((t) => t.id !== r.answer)).slice(0, 3);
    return {
      type: "trap",
      time: 11,
      tag: "Name the thinking trap",
      prompt: r.thought,
      options: shuf([answer, ...decoys].map((t) => ({ text: `<b>${t.name}</b>`, correct: t.id === r.answer }))),
      lesson: `${answer.name}: ${answer.short}`,
    };
  });
  return shuf(drills.concat(traps)).slice(0, GAUNTLET_ROUNDS);
}

function startGauntletRun(isDaily = false) {
  if (isDaily && dailyDoneToday()) return;
  gRun = {
    daily: isDaily,
    deck: gauntletDeck(isDaily ? mulberry32(dailyNumber() * 2654435761 + 42) : null),
    idx: 0,
    hearts: 3,
    combo: 0,
    bestCombo: 0,
    score: 0,
    correct: 0,
    squares: [],
    timer: null,
    deadline: 0,
    resolved: false,
  };
  $("#gauntlet-intro").classList.add("hidden");
  $("#gauntlet-daily").classList.add("hidden");
  $("#gauntlet-summary").classList.add("hidden");
  $("#gauntlet-play").classList.remove("hidden");
  renderGauntletRound();
}

function updateGauntletHud(hearts, combo, score) {
  $("#gauntlet-hearts").textContent = "❤️".repeat(hearts) + "🖤".repeat(Math.max(0, 3 - hearts));
  const comboEl = $("#gauntlet-combo");
  const mult = comboMultiplier(combo);
  comboEl.textContent = combo >= 2 ? `x${mult} 🔥` : "";
  comboEl.classList.remove("bump");
  void comboEl.offsetWidth;
  if (combo >= 2) comboEl.classList.add("bump");
  $("#gauntlet-score").textContent = `${score} ⭐`;
}

function comboMultiplier(combo) {
  return Math.min(4, 1 + Math.max(0, combo - 1) * 0.5);
}

function renderGauntletRound() {
  const run = gRun;
  if (!run) return;
  run.resolved = false;
  const round = run.deck[run.idx];
  const card = $("#gauntlet-card");
  $("#gauntlet-flash").textContent = "";
  $("#gauntlet-flash").className = "gauntlet-flash";

  card.innerHTML = "";
  card.append(el("span", "scene-tag", `${run.daily ? "📅 DAILY · " : "⚡ "}${run.idx + 1}/${run.deck.length} · ${round.tag}`));
  card.append(el("p", "scene-text", round.prompt));
  const list = el("div", "choices");
  round.options.forEach((opt) => {
    const btn = el("button", "choice-btn", opt.text);
    btn.addEventListener("click", () => resolveGauntlet(opt, btn, list));
    list.append(btn);
  });
  card.append(list);

  run.deadline = performance.now() + round.time * 1000;
  const fill = $("#gauntlet-timer");
  fill.classList.remove("hurry");
  fill.style.width = "100%";
  clearInterval(run.timer);
  run.timer = setInterval(() => {
    const left = run.deadline - performance.now();
    const pct = Math.max(0, (left / (round.time * 1000)) * 100);
    fill.style.width = pct + "%";
    fill.classList.toggle("hurry", pct < 30);
    if (left <= 0) resolveGauntlet(null, null, list);
  }, 100);
}

function resolveGauntlet(opt, btn, list) {
  const run = gRun;
  if (!run || run.resolved) return;
  run.resolved = true;
  clearInterval(run.timer);
  const round = run.deck[run.idx];
  for (const b of list.querySelectorAll("button")) b.disabled = true;

  const correct = !!(opt && opt.correct);
  const flash = $("#gauntlet-flash");

  if (correct) {
    run.combo++;
    run.bestCombo = Math.max(run.bestCombo, run.combo);
    run.correct++;
    const mult = comboMultiplier(run.combo);
    const pts = Math.round(10 * mult);
    run.score += pts;
    state.score += pts;
    if (round.type === "drill") {
      state.xp.A += 3;
      state.stats.assertiveChoices++;
    } else {
      state.xp.S += 3;
      state.stats.distortionsCaught++;
    }
    btn.classList.add("picked-good");
    scorePop(btn, `+${pts} ⭐${run.combo >= 2 ? ` x${mult}` : ""}`, true);
    flash.textContent = run.combo >= 3 ? `🔥 ${run.combo} in a row!` : "✓ Strong.";
    flash.classList.add("good");
    run.squares.push("🟩");
  } else {
    run.hearts--;
    run.combo = 0;
    if (opt && opt.kind === "doormat") state.stats.doormatChoices++;
    if (opt && opt.kind === "aggressive") state.stats.aggressiveChoices++;
    if (round.type === "trap") state.stats.distortionsMissed++;
    if (btn) btn.classList.add("picked-bad");
    for (const [i, o] of round.options.entries()) {
      if (o.correct) list.children[i].classList.add("reveal-best");
    }
    shakeScreen();
    flash.textContent = (opt ? "✗ " : "⏰ Time! ") + round.lesson;
    flash.classList.add("bad");
    run.squares.push(opt ? "🟥" : "⬛");
  }
  updateGauntletHud(run.hearts, run.combo, run.score);
  touchStreak();
  saveState();

  const over = run.hearts <= 0 || run.idx >= run.deck.length - 1;
  setTimeout(() => {
    if (!gRun) return; // navigated away mid-pause
    if (over) endGauntlet();
    else { run.idx++; renderGauntletRound(); }
  }, correct ? 850 : 1900);
}

function endGauntlet() {
  const run = gRun;
  gRun = null;
  $("#gauntlet-play").classList.add("hidden");

  const flawless = run.hearts === 3 && run.idx >= run.deck.length - 1;
  const newBest = run.score > (state.stats.gauntletBest || 0);
  state.stats.gauntletRuns++;
  state.stats.gauntletBest = Math.max(state.stats.gauntletBest || 0, run.score);
  if (flawless) state.stats.gauntletFlawless = true;
  state.stats.sessionsCompleted++;
  if (run.daily) {
    state.daily = {
      day: todayKey(),
      number: dailyNumber(),
      score: run.score,
      squares: run.squares.slice(),
      hearts: run.hearts,
    };
    state.stats.dailiesPlayed++;
    state.stats.dailyBest = Math.max(state.stats.dailyBest || 0, run.score);
  }
  saveState();
  if (flawless || newBest) confettiBurst(flawless ? 240 : 140);

  const box = $("#gauntlet-summary");
  box.classList.remove("hidden");
  box.innerHTML = "";
  const card = el("div", "card summary-card");
  card.append(el("h2", null,
    run.hearts <= 0 ? (run.daily ? `💀 Daily #${state.daily.number}: the Gauntlet got you` : "💀 The Gauntlet got you")
      : flawless ? (run.daily ? `💯 Daily #${state.daily.number}: FLAWLESS` : "💯 FLAWLESS RUN")
      : run.daily ? `📅 Daily #${state.daily.number} complete` : "⚡ Gauntlet complete"));
  card.append(el("div", "summary-big", `${run.score} ⭐`));
  card.append(el("div", "squares", run.squares.join("")));
  card.append(el("div", "summary-line",
    `${run.correct}/${run.idx + 1} correct · best combo x${comboMultiplier(run.bestCombo)} · ${"❤️".repeat(run.hearts)}${"🖤".repeat(3 - run.hearts)}`));
  card.append(el("div", "summary-line", newBest ? "🏆 New personal best!" : `Personal best: ${state.stats.gauntletBest} ⭐`));
  const row = el("div", "row-buttons");
  row.style.justifyContent = "center";
  if (run.daily) {
    const share = el("button", "btn", "📋 Copy daily result");
    share.addEventListener("click", () => copyText(dailyShareText()));
    const practice = el("button", "btn ghost", "Practice run");
    practice.addEventListener("click", () => startGauntletRun(false));
    row.append(share, practice);
  } else {
    const again = el("button", "btn", "Run it back");
    again.addEventListener("click", () => startGauntletRun(false));
    row.append(again);
  }
  const home = el("button", "btn ghost", "Home");
  home.addEventListener("click", () => showScreen("home"));
  row.append(home);
  card.append(row);
  box.append(card);
  box.append(buildVerdictCard());

  announceBadges(checkBadges());
  refreshTopbar();
}

function stopGauntlet() {
  if (gRun) {
    clearInterval(gRun.timer);
    gRun = null;
  }
}

document.addEventListener("click", (e) => {
  if (e.target.closest("#gauntlet-start")) startGauntletRun();
});

/* ================= perception lab ================= */
let plRun = null;

function startPerceptionSession() {
  plRun = {
    deck: drawFrom(PERCEPTION, state.seen.perception, SESSION_LEN),
    idx: 0,
    results: [],
    pts: 0,
  };
  $("#perception-summary").classList.add("hidden");
  renderPerceptionRound();
}

function renderPerceptionRound() {
  const run = plRun;
  const card = $("#perception-card");
  const fb = $("#perception-feedback");
  fb.classList.add("hidden");

  if (run.idx >= run.deck.length) {
    card.classList.add("hidden");
    sessionSummary($("#perception-summary"), "🧪 Lab session complete", run.results, run.pts,
      ["The engineering answer is usually expensive. The psychology answer is usually free. Now you see both."],
      "perception");
    return;
  }

  card.classList.remove("hidden");
  renderDots($("#perception-progress"), run.deck.length, run.results, run.idx);

  const round = run.deck[run.idx];
  card.innerHTML = "";
  card.append(el("span", "scene-tag", `🧪 ${round.tag}`));
  card.append(el("p", "scene-text", round.text));

  const list = el("div", "choices");
  const order = shuffle(round.choices.map((_, i) => i));
  for (const i of order) {
    const ch = round.choices[i];
    const btn = el("button", "choice-btn", ch.text);
    btn.addEventListener("click", () => {
      const res = applyChoice(ch, "O");
      juice(btn, res);
      run.pts += res.pts;
      run.results.push(res.cls);
      if (res.cls === "good") state.stats.alchemyStrong++;

      for (const b of list.querySelectorAll("button")) b.disabled = true;
      btn.classList.add("picked-" + res.cls);
      if (res.cls !== "good") {
        for (const j of order) {
          if (kindClass(round.choices[j].kind) === "good") {
            list.children[order.indexOf(j)].classList.add("reveal-best");
          }
        }
      }

      renderDots($("#perception-progress"), run.deck.length, run.results, run.idx);
      markSeen(state.seen.perception, round.id);
      saveState();

      fb.innerHTML = "";
      fb.classList.remove("hidden");
      fb.append(el("div", "fb-verdict " + res.cls,
        res.cls === "good" ? "🧪 Alchemy." : res.cls === "mid" ? "😐 Logical. Merely logical." : "📉 Value destroyed"));
      fb.append(el("p", null, ch.fb));
      fb.append(el("div", "fb-culture", `⚗️ <b>The principle — ${round.principle.name}:</b> ${round.principle.tip}`));
      fb.append(el("div", "fb-points", `<b>${res.pts >= 0 ? "+" : ""}${res.pts} ⭐</b> ${xpPills(res.xpGained)}`));
      const next = el("button", "btn fb-next", "Next →");
      next.addEventListener("click", () => { run.idx++; renderPerceptionRound(); });
      fb.append(next);
      next.focus();
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
  const slot = $("#verdict-slot");
  slot.innerHTML = "";
  slot.append(buildVerdictCard());
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
    [state.campaigns.career.done ? "🏆" : `${state.campaigns.career.stage}/${CAREER_STAGES.length}`, "Career rungs 💼"],
    [state.campaigns.love.done ? "🏆" : `${(state.campaigns.love.cleared || []).length}/${LOVE_CHAPTERS.length}`, "Chapters cleared ❤️"],
    [state.stats.safetyStrong, "Safe calls 🛡️"],
    [state.stats.gauntletBest, "Gauntlet best ⚡"],
    [state.stats.alchemyStrong, "Frames bent 🧪"],
    [state.stats.dailiesPlayed, "Dailies played 📅"],
    [state.stats.boardWins, "Board wins 🎲"],
    [state.stats.boardBestCoins, "Best board run 🪙"],
    [state.stats.backboneIndexBest || "–", "Backbone Index 🧳"],
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

  renderResetControls();
}

/* Fine-grained resets: zero one meter/mode without touching the rest.
   Earned badges are never removed. */
const RESETS = [
  { label: "🦴 Backbone Meter", apply: () => Object.assign(state.stats, { assertiveChoices: 0, doormatChoices: 0, aggressiveChoices: 0, pushSituations: 0 }) },
  { label: "😌 Calm Meter", apply: () => Object.assign(state.stats, { calmReps: 0, distortionsCaught: 0, distortionsMissed: 0, breathSessions: 0 }) },
  { label: "📊 Trait XP & levels", apply: () => { state.xp = { O: 0, C: 0, E: 0, A: 0, S: 0 }; } },
  { label: "⭐ Score & streak", apply: () => { state.score = 0; state.streak = { current: 0, best: 0, lastDay: null }; } },
  { label: "💼❤️ Both campaigns", apply: () => { state.campaigns = { career: { stage: 0, done: false }, love: { cleared: [], done: false } }; } },
  { label: "⚡ Gauntlet & Daily records", apply: () => { Object.assign(state.stats, { gauntletBest: 0, gauntletRuns: 0, gauntletFlawless: false, dailiesPlayed: 0, dailyBest: 0 }); state.daily = { day: null, number: 0, score: 0, squares: [], hearts: 0 }; } },
  { label: "🎲 Life Board", apply: () => { state.board = { active: false, pos: 0, energy: 3, coins: 0 }; Object.assign(state.stats, { boardRuns: 0, boardWins: 0, boardBestCoins: 0 }); } },
  { label: "🧳 Backbone Index history", apply: () => Object.assign(state.stats, { workdayRuns: 0, backboneIndex: 0, backboneIndexBest: 0 }) },
  { label: "🃏 Card memory (reshuffle all decks)", apply: () => { state.seen = { scenarios: [], distortions: [], drills: [], safety: [], perception: [] }; } },
];

function renderResetControls() {
  const grid = $("#reset-grid");
  grid.innerHTML = "";
  for (const r of RESETS) {
    const btn = el("button", "btn ghost small-btn", `Reset ${r.label}`);
    let armed = false;
    let timer = null;
    btn.addEventListener("click", () => {
      if (!armed) {
        armed = true;
        btn.textContent = `Sure? Tap again to reset ${r.label}`;
        btn.style.borderColor = "var(--warn)";
        timer = setTimeout(() => { armed = false; btn.textContent = `Reset ${r.label}`; btn.style.borderColor = ""; }, 3000);
        return;
      }
      clearTimeout(timer);
      r.apply();
      saveState();
      toast(`✅ ${r.label} reset`);
      renderProgress();
      refreshTopbar();
    });
    grid.append(btn);
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
