/* ============================================================
   ATTUNE — UI: screens, body map, state map, session player
   ============================================================ */

(() => {
  const $ = (sel) => document.querySelector(sel);
  const S = Attune.session;

  /* ================= navigation ================= */

  const SCREENS = ["welcome", "checkin", "destination", "session", "arrival", "log"];
  let currentScreen = "welcome";

  function show(name) {
    for (const s of SCREENS) $(`#screen-${s}`).hidden = s !== name;
    currentScreen = name;
    window.scrollTo(0, 0);
    if (name === "destination") { refreshPlan(); mapLoop(); }
    if (name === "arrival") arrivalLoop();
    if (name === "log") renderLog();
  }
  Attune.show = show;

  document.querySelectorAll("[data-nav]").forEach((btn) =>
    btn.addEventListener("click", () => show(btn.dataset.nav))
  );

  /* ================= body map ================= */

  const QUALITIES = [null, "tension", "numb", "warm"];

  function buildBodyMap() {
    const svg = $("#bodymap");
    const NS = "http://www.w3.org/2000/svg";
    const shapes = {
      head:      `<circle cx="100" cy="30" r="20"/>`,
      face:      `<ellipse cx="100" cy="52" rx="13" ry="11"/>`,
      jaw:       `<ellipse cx="100" cy="69" rx="10" ry="6"/>`,
      neck:      `<rect x="90" y="76" width="20" height="18" rx="6"/>`,
      shoulderL: `<ellipse cx="64" cy="104" rx="21" ry="12"/>`,
      shoulderR: `<ellipse cx="136" cy="104" rx="21" ry="12"/>`,
      chest:     `<rect x="72" y="106" width="56" height="42" rx="14"/>`,
      armL:      `<rect x="34" y="112" width="19" height="92" rx="9"/>`,
      armR:      `<rect x="147" y="112" width="19" height="92" rx="9"/>`,
      handL:     `<circle cx="43" cy="218" r="12"/>`,
      handR:     `<circle cx="157" cy="218" r="12"/>`,
      belly:     `<ellipse cx="100" cy="170" rx="29" ry="22"/>`,
      back:      `<rect x="72" y="192" width="56" height="34" rx="12"/>`,
      legL:      `<rect x="73" y="228" width="23" height="118" rx="11"/>`,
      legR:      `<rect x="104" y="228" width="23" height="118" rx="11"/>`,
      feet:      `<g><ellipse cx="83" cy="360" rx="15" ry="9"/><ellipse cx="117" cy="360" rx="15" ry="9"/></g>`,
    };
    svg.innerHTML = Object.entries(shapes)
      .map(([id, shape]) => shape.replace(/<(circle|ellipse|rect|g)/, `<$1 class="region" data-region="${id}"`))
      .join("");
    svg.querySelectorAll(".region").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.dataset.region;
        const cur = QUALITIES.indexOf(S.bodyMarks[id] || null);
        const next = QUALITIES[(cur + 1) % QUALITIES.length];
        if (next) S.bodyMarks[id] = next; else delete S.bodyMarks[id];
        el.classList.remove("q-tension", "q-numb", "q-warm");
        if (next) el.classList.add(`q-${next}`);
      });
    });
  }

  /* ================= feeling chips ================= */

  function buildFeelingChips() {
    const row = $("#feeling-words");
    row.innerHTML = "";
    for (const word of Attune.FEELING_WORDS) {
      const b = document.createElement("button");
      b.className = "chip";
      b.textContent = word;
      b.addEventListener("click", () => {
        b.classList.toggle("selected");
        if (b.classList.contains("selected")) S.feelings.push(word);
        else S.feelings = S.feelings.filter((w) => w !== word);
      });
      row.appendChild(b);
    }
  }

  /* ================= check-in sliders ================= */

  function readCheckin() {
    S.before = {
      energy: +$("#sl-energy").value,
      ease: +$("#sl-ease").value,
      ground: +$("#sl-ground").value,
      clarity: +$("#sl-clarity").value,
    };
  }

  /* ================= destination ================= */

  const stateMap = $("#statemap");
  let planDirty = true;

  function readTarget() {
    S.target = {
      energy: +$("#tg-energy").value,
      ease: +$("#tg-ease").value,
      ground: +$("#tg-ground").value,
      clarity: +$("#tg-clarity").value,
    };
  }

  function writeTarget() {
    $("#tg-energy").value = S.target.energy;
    $("#tg-ease").value = S.target.ease;
    $("#tg-ground").value = S.target.ground;
    $("#tg-clarity").value = S.target.clarity;
  }

  function buildPresets() {
    const row = $("#preset-row");
    row.innerHTML = "";
    for (const p of Attune.PRESETS) {
      const b = document.createElement("button");
      b.className = "chip";
      b.textContent = p.name;
      b.title = p.blurb;
      b.dataset.preset = p.id;
      b.addEventListener("click", () => {
        S.presetId = p.id;
        S.target = { ...p.vector };
        writeTarget();
        row.querySelectorAll(".chip").forEach((c) => c.classList.toggle("selected", c === b));
        markPlanDirty();
      });
      row.appendChild(b);
    }
    row.querySelector(`[data-preset="${S.presetId}"]`)?.classList.add("selected");
  }

  function clearPresetSelection() {
    S.presetId = null;
    document.querySelectorAll("#preset-row .chip").forEach((c) => c.classList.remove("selected"));
  }

  ["#tg-energy", "#tg-ease", "#tg-ground", "#tg-clarity"].forEach((sel) =>
    $(sel).addEventListener("input", () => { readTarget(); clearPresetSelection(); markPlanDirty(); })
  );

  /* drag the destination point on the map */
  let dragging = false;
  function mapPointerVec(e) {
    const rect = stateMap.getBoundingClientRect();
    return Attune.fromMapXY(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height, Attune.MapView.PAD);
  }
  stateMap.addEventListener("pointerdown", (e) => {
    dragging = true;
    stateMap.setPointerCapture(e.pointerId);
    const v = mapPointerVec(e);
    S.target.ease = Math.round(v.ease);
    S.target.energy = Math.round(v.energy);
    writeTarget(); clearPresetSelection(); markPlanDirty();
  });
  stateMap.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const v = mapPointerVec(e);
    S.target.ease = Math.round(v.ease);
    S.target.energy = Math.round(v.energy);
    writeTarget(); clearPresetSelection(); markPlanDirty();
  });
  stateMap.addEventListener("pointerup", () => { dragging = false; });

  /* duration buttons */
  document.querySelectorAll(".dur-btn").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll(".dur-btn").forEach((x) => x.classList.remove("selected"));
      b.classList.add("selected");
      S.minutes = +b.dataset.min;
      markPlanDirty();
    })
  );

  function markPlanDirty() { planDirty = true; refreshPlan(); }

  function refreshPlan() {
    if (currentScreen !== "destination" && currentScreen !== "session") return;
    S.plan = Attune.buildPlan(S.before, S.target, S.minutes, {
      marks: S.bodyMarks, presetId: S.presetId,
    });
    renderItinerary(S.plan);
    planDirty = false;
  }

  function renderItinerary(plan) {
    const ol = $("#itinerary");
    ol.innerHTML = "";
    for (const item of plan.queue) {
      const li = document.createElement("li");
      const m = Math.round(item.dur / 60 * 10) / 10;
      li.innerHTML = `<span class="it-phase">${item.phase}</span>
        <span class="it-name">${item.practice.name}</span>
        <span class="it-dur">${m >= 1 ? Math.round(m) + " min" : Math.round(item.dur) + " s"}</span>`;
      ol.appendChild(li);
    }
  }

  let mapRAF = null;
  function mapLoop() {
    if (mapRAF) cancelAnimationFrame(mapRAF);
    const step = () => {
      if (currentScreen !== "destination") { mapRAF = null; return; }
      Attune.MapView.draw(stateMap, {
        before: S.before,
        target: S.target,
        waypoints: S.plan ? Attune.planWaypoints(S.plan) : null,
      });
      mapRAF = requestAnimationFrame(step);
    };
    step();
  }

  /* ================= session player ================= */

  const Player = {
    items: [], itemIndex: 0,
    steps: [], stepIndex: 0,
    stepElapsed: 0, doneSec: 0,
    lastTick: 0, running: false, finished: false,
    checkinsShown: 0,
    raf: null,
  };
  Attune.Player = Player;

  function ctxForBuild() {
    return { marks: S.bodyMarks, target: S.target, before: S.before, feelings: S.feelings };
  }

  function startSession() {
    readTarget();
    refreshPlanForSession();
    S.startedAt = Date.now();
    S.voice = $("#opt-voice").checked;
    S.sound = $("#opt-sound").checked;
    Attune.Audio.voiceEnabled = S.voice;
    Attune.Audio.setEnabled(S.sound);
    if (S.sound) Attune.Audio.start(S.target.energy / 100);
    Attune.Field.mood = 0.25 + (S.target.energy / 100) * 0.5;

    Player.items = S.plan.queue;
    Player.itemIndex = -1;
    Player.doneSec = 0;
    Player.checkinsShown = 0;
    Player.finished = false;
    Player.running = true;

    $("#ctl-voice").classList.toggle("off", !S.voice);
    $("#ctl-sound").classList.toggle("off", !S.sound);
    renderCrumbs();
    show("session");
    nextItem();
    Player.lastTick = performance.now();
    tick();
  }

  function refreshPlanForSession() {
    S.plan = Attune.buildPlan(S.before, S.target, S.minutes, {
      marks: S.bodyMarks, presetId: S.presetId,
    });
  }

  function renderCrumbs() {
    const wrap = $("#phase-crumbs");
    wrap.innerHTML = "";
    const phases = [...new Set(Player.items.map((i) => i.phase))];
    for (const ph of phases) {
      const c = document.createElement("span");
      c.className = "crumb";
      c.dataset.phase = ph;
      c.textContent = ph;
      wrap.appendChild(c);
    }
    updateCrumbs();
  }

  function updateCrumbs() {
    const cur = Player.items[Player.itemIndex]?.phase;
    const phases = [...document.querySelectorAll(".crumb")];
    let seen = false;
    for (const c of phases) {
      const isCur = c.dataset.phase === cur;
      if (isCur) seen = true;
      c.classList.toggle("active", isCur);
      c.classList.toggle("done", !isCur && !seen);
    }
  }

  function nextItem() {
    Player.itemIndex++;
    if (Player.itemIndex >= Player.items.length) { finishSession(); return; }
    const item = Player.items[Player.itemIndex];
    Player.steps = item.practice.build(item.dur, ctxForBuild());
    Player.stepIndex = -1;
    updateCrumbs();
    Attune.Audio.bell();
    nextStep();
  }

  function nextStep() {
    Player.stepIndex++;
    if (Player.stepIndex >= Player.steps.length) {
      Player.doneSec += Player.steps.reduce((s, x) => s + x.dur, 0);
      // a check-in due? show it at this natural boundary
      if (maybeCheckin()) return;
      nextItem();
      return;
    }
    Player.stepElapsed = 0;
    const step = Player.steps[Player.stepIndex];
    setGuidance(step.text);
    Attune.Pacer.setPattern(step.breath || null);
    Attune.Pacer.running = true;
    if (S.voice) Attune.Audio.speak(step.text);
  }

  function prevStep() {
    if (Player.stepIndex > 0) {
      Player.stepIndex -= 2;
      nextStep();
    } else if (Player.itemIndex > 0) {
      Player.itemIndex -= 2;
      // recompute doneSec
      Player.doneSec = 0;
      for (let i = 0; i <= Player.itemIndex; i++) {
        Player.doneSec += Player.items[i].dur;
      }
      nextItem();
    }
  }

  function setGuidance(text) {
    const el = $("#guidance-text");
    el.classList.remove("visible");
    setTimeout(() => { el.textContent = text; el.classList.add("visible"); }, 450);
  }

  function stepDoneSec() {
    let s = 0;
    for (let i = 0; i < Player.stepIndex; i++) s += Player.steps[i].dur;
    return s;
  }

  function totalElapsed() {
    return Player.doneSec + stepDoneSec() + Player.stepElapsed;
  }

  function tick() {
    if (!Player.running || Player.finished) return;
    const now = performance.now();
    const dt = ((now - Player.lastTick) / 1000) * Attune.TIME_SCALE;
    Player.lastTick = now;
    Player.stepElapsed += dt;

    const step = Player.steps[Player.stepIndex];
    if (step && Player.stepElapsed >= step.dur) {
      nextStep();
      if (Player.finished) return;
    }

    const remain = Math.max(0, planTotal() - totalElapsed());
    $("#session-clock").textContent = fmtTime(remain);

    Player.raf = requestAnimationFrame(tick);
  }

  function planTotal() {
    return Player.items.reduce((s, x) => s + x.dur, 0);
  }

  function fmtTime(sec) {
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  /* ---- mid-session check-in ---- */

  function maybeCheckin() {
    const due = S.plan.checkins || [];
    if (Player.checkinsShown >= due.length) return false;
    if (totalElapsed() < due[Player.checkinsShown]) return false;
    // don't check in during the final stretch
    if (Player.itemIndex >= Player.items.length - 2) { Player.checkinsShown++; return false; }
    Player.checkinsShown++;
    pausePlayer(true);
    // seed sliders with the planned trajectory at this point
    const t = totalElapsed() / planTotal();
    const expect = Attune.vecLerp(S.plan.before, S.plan.target, t * t * (3 - 2 * t));
    $("#micro-energy").value = Math.round(expect.energy);
    $("#micro-ground").value = Math.round(expect.ground);
    $("#micro-checkin").hidden = false;
    return true;
  }

  $("#micro-continue").addEventListener("click", () => {
    $("#micro-checkin").hidden = true;
    const reported = { energy: +$("#micro-energy").value, ground: +$("#micro-ground").value };
    const newPlan = Attune.replan(S.plan, Player.itemIndex, reported, {
      marks: S.bodyMarks, presetId: S.presetId,
    });
    if (newPlan !== S.plan) {
      S.plan = newPlan;
      Player.items = newPlan.queue;
      renderCrumbs();
      if (newPlan.adapted) {
        setGuidance("Heard. Adjusting the rest of the route for where you actually are.");
        if (S.voice) Attune.Audio.speak("Heard. Adjusting the rest of the route.");
      }
    }
    resumePlayer();
    nextItem();
  });

  /* ---- controls ---- */

  function pausePlayer(silent) {
    Player.running = false;
    Attune.Pacer.running = false;
    if (Player.raf) cancelAnimationFrame(Player.raf);
    Attune.Audio.hush();
    if (!silent) $("#ctl-pause").textContent = "▷";
  }

  function resumePlayer() {
    if (Player.finished) return;
    Player.running = true;
    Attune.Pacer.running = true;
    Player.lastTick = performance.now();
    $("#ctl-pause").textContent = "II";
    tick();
  }

  $("#ctl-pause").addEventListener("click", () => {
    if (Player.running) pausePlayer(); else resumePlayer();
  });
  $("#ctl-skip").addEventListener("click", () => { if (Player.running) nextStep(); });
  $("#ctl-back").addEventListener("click", () => { if (Player.running) prevStep(); });
  $("#ctl-voice").addEventListener("click", () => {
    S.voice = !S.voice;
    Attune.Audio.voiceEnabled = S.voice;
    if (!S.voice) Attune.Audio.hush();
    $("#ctl-voice").classList.toggle("off", !S.voice);
  });
  $("#ctl-sound").addEventListener("click", () => {
    S.sound = !S.sound;
    if (S.sound && !Attune.Audio.running) Attune.Audio.start(S.target.energy / 100);
    Attune.Audio.setEnabled(S.sound);
    $("#ctl-sound").classList.toggle("off", !S.sound);
  });
  $("#ctl-exit").addEventListener("click", finishSession);

  /* the lifeline: bail out of whatever is happening into eyes-open
     grounding, then re-enter the interrupted practice more gently */
  $("#ctl-lifeline").addEventListener("click", () => {
    if (Player.finished) return;
    const cur = Player.items[Player.itemIndex];
    if (!cur || cur.practice.id === "rescue") return;
    const done = stepDoneSec() + Player.stepElapsed;
    const insert = [{ practice: Attune.PRACTICES.rescue, dur: 95, phase: cur.phase }];
    // revisit the interrupted practice only if most of it remains
    if (cur.dur - done > cur.dur * 0.4 && cur.dur - done > 60) {
      insert.push({ ...cur, dur: Math.round(cur.dur - done) });
    }
    Player.items.splice(Player.itemIndex + 1, 0, ...insert);
    cur.dur = Math.round(done);   // the interrupted item ends here — keep the clock honest
    Player.doneSec += done;
    Attune.Audio.hush();
    if (!Player.running) resumePlayer();
    nextItem();
  });

  function finishSession() {
    if (Player.finished) return;
    Player.finished = true;
    Player.running = false;
    if (Player.raf) cancelAnimationFrame(Player.raf);
    Attune.Pacer.running = false;
    Attune.Pacer.setPattern(null);
    Attune.Audio.hush();
    Attune.Audio.stop();
    openArrival();
  }

  /* ================= arrival ================= */

  function openArrival() {
    // seed the arrival sliders at the honest midpoint of intention
    const seed = Attune.vecLerp(S.before, S.target, 0.5);
    $("#ar-energy").value = Math.round(seed.energy);
    $("#ar-ease").value = Math.round(seed.ease);
    $("#ar-ground").value = Math.round(seed.ground);
    $("#ar-clarity").value = Math.round(seed.clarity);
    show("arrival");
    updateArrivalReadout();
  }

  function readAfter() {
    return {
      energy: +$("#ar-energy").value,
      ease: +$("#ar-ease").value,
      ground: +$("#ar-ground").value,
      clarity: +$("#ar-clarity").value,
    };
  }

  function updateArrivalReadout() {
    const after = readAfter();
    const dEase = Math.round(after.ease - S.before.ease);
    const dEnergy = Math.round(after.energy - S.before.energy);
    const dGround = Math.round(after.ground - S.before.ground);
    const toTargetBefore = Math.round(Attune.vecDist(S.before, S.target));
    const toTargetAfter = Math.round(Attune.vecDist(after, S.target));
    const covered = toTargetBefore > 0
      ? Math.round(Math.max(0, (toTargetBefore - toTargetAfter) / toTargetBefore) * 100)
      : 100;
    const sign = (n) => (n > 0 ? `+${n}` : `${n}`);
    $("#arrival-readout").innerHTML =
      `You started <strong>${Attune.describeVector(S.before)}</strong> and landed
       <strong>${Attune.describeVector(after)}</strong>.<br>
       Ease ${sign(dEase)} · activation ${sign(dEnergy)} · groundedness ${sign(dGround)}.<br>
       You covered <strong>${covered}%</strong> of the distance to the state you chose.`;
  }

  ["#ar-energy", "#ar-ease", "#ar-ground", "#ar-clarity"].forEach((sel) =>
    $(sel).addEventListener("input", updateArrivalReadout)
  );

  let arrivalRAF = null;
  function arrivalLoop() {
    if (arrivalRAF) cancelAnimationFrame(arrivalRAF);
    const step = () => {
      if (currentScreen !== "arrival") { arrivalRAF = null; return; }
      Attune.MapView.draw($("#arrivalmap"), {
        before: S.before,
        target: S.target,
        after: readAfter(),
      });
      arrivalRAF = requestAnimationFrame(step);
    };
    step();
  }

  $("#btn-save-arrival").addEventListener("click", () => {
    S.after = readAfter();
    Attune.saveJourney({
      at: S.startedAt || Date.now(),
      minutes: S.minutes,
      presetId: S.presetId,
      before: S.before,
      target: S.target,
      after: S.after,
      feelings: S.feelings,
      practices: (S.plan?.queue || []).map((q) => q.practice.id),
    });
    show("log");
  });

  /* ================= history ================= */

  function renderLog() {
    const list = Attune.loadJourneys();
    const wrap = $("#log-list");
    if (!list.length) {
      wrap.innerHTML = `<p class="log-empty">No journeys yet. The map is waiting.</p>`;
      return;
    }
    // insights across all journeys
    const totalMin = list.reduce((s, j) => s + (j.minutes || 0), 0);
    const coverages = list.map((j) => {
      const b = Attune.vecDist(j.before, j.target);
      const a = Attune.vecDist(j.after, j.target);
      return b > 0 ? Math.max(0, (b - a) / b) : 1;
    });
    const avgCov = Math.round((coverages.reduce((s, c) => s + c, 0) / coverages.length) * 100);
    const destCount = {};
    for (const j of list) if (j.presetId) destCount[j.presetId] = (destCount[j.presetId] || 0) + 1;
    const topDest = Object.entries(destCount).sort((a, b) => b[1] - a[1])[0];
    const topName = topDest ? (Attune.PRESETS.find((p) => p.id === topDest[0]) || {}).name : null;
    const insights = `<p class="log-insights">
      ${list.length} journey${list.length === 1 ? "" : "s"} · ${totalMin} minutes of practice ·
      on average you cover <strong>${avgCov}%</strong> of the distance to the state you choose${
        topName ? ` · your most-traveled destination is <strong>${topName}</strong>` : ""}.
    </p>`;
    wrap.innerHTML = insights + list.map((j) => {
      const d = new Date(j.at);
      const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
        " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
      const gain = Math.round((j.after.ease - j.before.ease + (j.before.energy > j.target.energy
        ? j.before.energy - j.after.energy : j.after.energy - j.before.energy)) / 2);
      const preset = Attune.PRESETS.find((p) => p.id === j.presetId);
      return `<div class="log-entry">
        <span class="log-date">${date}</span>
        <span class="log-desc">${Attune.describeVector(j.before)} → ${Attune.describeVector(j.after)}
          <small>${j.minutes} min${preset ? " · toward " + preset.name : ""}</small></span>
        <span class="log-delta">${gain >= 0 ? "+" : ""}${gain}</span>
      </div>`;
    }).join("");
  }

  /* ================= breath label wiring ================= */

  Attune.Pacer.onPhase = (phase) => {
    const label = $("#breath-label");
    label.textContent = Attune.Pacer.labelFor(phase);
    label.classList.add("on");
    Attune.Audio.cue(phase);
  };

  /* ================= top-level buttons ================= */

  $("#btn-begin").addEventListener("click", () => {
    // user gesture: safe moment to warm up the audio context
    Attune.Audio.init();
    show("checkin");
  });
  $("#btn-history").addEventListener("click", () => show("log"));
  $("#btn-to-destination").addEventListener("click", () => {
    readCheckin();
    show("destination");
  });
  $("#btn-embark").addEventListener("click", startSession);

  /* ================= init ================= */

  Attune.initUI = function () {
    buildBodyMap();
    buildFeelingChips();
    buildPresets();
    writeTarget();
  };
})();
