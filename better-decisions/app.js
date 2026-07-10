/* =========================================================================
   Better Decisions — app engine
   A deterministic conversation engine: no network, no AI, no telemetry.
   Every reply is a node from TREE (data.js), chosen by tapping a chip.
   ========================================================================= */

(() => {
  "use strict";

  /* ---------------- state & elements ---------------- */

  const $ = (id) => document.getElementById(id);

  const els = {
    views: {
      home: $("viewHome"),
      chat: $("viewChat"),
      toolbox: $("viewToolbox"),
      saved: $("viewSaved"),
    },
    nav: { home: $("navWheel"), toolbox: $("navToolbox"), saved: $("navSaved") },
    wheel: $("wheel"),
    areaCards: $("areaCards"),
    chatLog: $("chatLog"),
    chatOptions: $("chatOptions"),
    chatScroll: $("chatScroll"),
    chatAvatar: $("chatAvatar"),
    chatName: $("chatName"),
    toolGrid: $("toolGrid"),
    savedList: $("savedList"),
    savedEmpty: $("savedEmpty"),
    savedCount: $("savedCount"),
  };

  const state = {
    view: "home",
    nodeId: null,
    area: null,
    typingTimer: null,
    pendingTimeouts: [],
    saved: loadSaved(),
  };

  /* ---------------- persistence ---------------- */

  const SAVE_KEY = "better-decisions.saved.v1";
  const THEME_KEY = "better-decisions.theme";

  function loadSaved() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || []; }
    catch { return []; }
  }
  function persistSaved() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state.saved)); } catch {}
    updateSavedBadge();
  }
  function updateSavedBadge() {
    els.savedCount.hidden = state.saved.length === 0;
    els.savedCount.textContent = state.saved.length;
  }

  /* ---------------- theme ---------------- */

  function initTheme() {
    let theme = null;
    try { theme = localStorage.getItem(THEME_KEY); } catch {}
    if (!theme) {
      theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    document.documentElement.dataset.theme = theme;
  }
  $("themeToggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch {}
  });

  /* ---------------- view switching ---------------- */

  function show(view) {
    state.view = view;
    Object.entries(els.views).forEach(([k, el]) => { el.hidden = k !== view; });
    Object.entries(els.nav).forEach(([k, el]) => el.classList.toggle("active", k === view));
    if (view === "saved") renderSaved();
    if (view === "home") renderResume();
    window.scrollTo({ top: 0 });
  }

  /* ---------------- resume memory (localStorage only) ---------------- */

  const RESUME_KEY = "better-decisions.resume.v1";

  function saveResume(nodeId, node) {
    // area roots aren't worth resuming to — keep whatever deeper point we had
    if (!state.area || nodeId === state.area) return;
    const area = AREAS.find((a) => a.id === state.area);
    const label = node.insight ? node.insight.title
      : (area ? `${area.label} — mid-conversation` : "your last conversation");
    try {
      localStorage.setItem(RESUME_KEY, JSON.stringify({ nodeId, area: state.area, label }));
    } catch {}
    renderResume();
  }

  function loadResume() {
    try {
      const r = JSON.parse(localStorage.getItem(RESUME_KEY));
      return r && TREE[r.nodeId] && AREAS.some((a) => a.id === r.area) ? r : null;
    } catch { return null; }
  }

  function renderResume() {
    const slot = $("resumeSlot");
    if (!slot) return;
    const r = loadResume();
    slot.innerHTML = "";
    if (!r) return;
    const card = document.createElement("button");
    card.className = "resume-card";
    card.innerHTML = `<span class="resume-kicker">welcome back</span><span class="resume-label"></span><span class="resume-go">pick it back up →</span>`;
    card.querySelector(".resume-label").textContent = r.label;
    card.addEventListener("click", () => {
      const area = AREAS.find((a) => a.id === r.area);
      clearPending();
      state.area = r.area;
      els.chatAvatar.textContent = area.icon;
      els.chatName.textContent = area.label;
      els.chatLog.innerHTML = "";
      els.chatOptions.innerHTML = "";
      show("chat");
      addBubble("Let's pick up where we left off.", "user");
      const t = setTimeout(() => goTo(r.nodeId), 350);
      state.pendingTimeouts.push(t);
    });
    slot.appendChild(card);
  }

  /* ---------------- keyword router (local, no AI) ---------------- */

  const STOP = new Set(
    ("a an the and or but so of to in on at for with about i im me my mine we our you your " +
     "he she it they them this that these those is are am be been do does did done how can " +
     "could would should what why when where who just really keep always never cant dont ive " +
     "get got feel feeling feels feelings help really kinda sorta like").split(" ")
  );

  const stem = (w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w);

  function matchRoutes(query) {
    const norm = query.toLowerCase().replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ").trim();
    if (!norm) return [];
    const tokens = norm.split(" ").filter((t) => t && !STOP.has(t)).map(stem);
    const tset = new Set(tokens);
    const scored = ROUTES.map((r) => {
      let s = 0;
      for (const raw of r.kw) {
        const kw = raw.toLowerCase();
        if (kw.includes(" ")) {
          if (norm.includes(kw)) s += 3;
        } else {
          const k = stem(kw);
          if (tset.has(k)) s += 2;
          else if (k.length >= 4 && tokens.some((t) => t.length >= 4 && (t.includes(k) || k.includes(t)))) s += 1;
        }
      }
      return { r, s };
    }).filter((x) => x.s >= 2).sort((a, b) => b.s - a.s);
    return scored.slice(0, 3);
  }

  const areaById = (id) => AREAS.find((a) => a.id === id);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  function runRouter(query, { append = false } = {}) {
    clearPending();
    const matches = matchRoutes(query);
    const topArea = matches[0] ? areaById(matches[0].r.area) : null;

    els.chatAvatar.textContent = topArea ? topArea.icon : "🧭";
    els.chatName.textContent = topArea ? topArea.label : "Your session";
    if (matches[0]) state.area = matches[0].r.area; // restart replays that area
    state.nodeId = "__router";
    if (!append) els.chatLog.innerHTML = "";
    els.chatOptions.innerHTML = "";
    show("chat");
    addBubble(query, "user");

    let coach, options;

    if (matches.length === 0) {
      coach = [
        "I hear you.",
        "I don't have a pre-written thread that maps exactly onto those words — remember, I'm not an AI improvising, just a set of authored conversations.",
        "But one of these is almost certainly the right room to start in. Which feels closest?",
      ];
      options = AREAS.map((a) => ({ label: `${a.icon} ${a.label}`, next: a.id }));
    } else {
      const confident =
        matches.length === 1 || (matches[0].s >= 3 && matches[0].s >= matches[1].s * 1.7);
      if (confident) {
        const r = matches[0].r;
        coach = [
          append ? "Okay — let's switch gears." : "Okay — I think I know where to start.",
          `It sounds like this is really about ${r.topic}. Want to get into it?`,
        ];
        options = [{ label: "Yes, let's go there", next: r.to }];
        if (matches[1]) options.push({ label: `Actually, more like: ${matches[1].r.topic}`, next: matches[1].r.to });
      } else {
        coach = [
          "Got it. A few different threads could fit what you said —",
          "which one feels closest to the real thing?",
        ];
        options = matches.map((m) => ({ label: cap(m.r.topic), next: m.r.to }));
      }
    }

    playCoachMessages(coach, () => renderOptions({ coach, options }));
  }

  $("brandBtn").addEventListener("click", () => show("home"));
  els.nav.home.addEventListener("click", () => show("home"));
  els.nav.toolbox.addEventListener("click", () => show("toolbox"));
  els.nav.saved.addEventListener("click", () => show("saved"));
  $("chatBack").addEventListener("click", () => show("home"));
  $("chatRestart").addEventListener("click", () => state.area && startChat(state.area));

  /* ---------------- the wheel (SVG) ---------------- */

  function buildWheel() {
    const size = 420, cx = size / 2, cy = size / 2;
    const rOuter = 200, rInner = 78;
    const n = AREAS.length;
    const gap = 0.035; // radians of breathing room between segments

    let svg = `<svg viewBox="0 0 ${size} ${size}" role="group" aria-label="Life areas">`;

    AREAS.forEach((area, i) => {
      const a0 = (i / n) * Math.PI * 2 - Math.PI / 2 + gap;
      const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2 - gap;
      const large = a1 - a0 > Math.PI ? 1 : 0;

      const p = (r, a) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      const d = [
        `M ${p(rInner, a0)}`,
        `L ${p(rOuter, a0)}`,
        `A ${rOuter} ${rOuter} 0 ${large} 1 ${p(rOuter, a1)}`,
        `L ${p(rInner, a1)}`,
        `A ${rInner} ${rInner} 0 ${large} 0 ${p(rInner, a0)}`,
        "Z",
      ].join(" ");

      const mid = (a0 + a1) / 2;
      const rText = (rOuter + rInner) / 2;
      const tx = cx + rText * Math.cos(mid);
      const ty = cy + rText * Math.sin(mid);

      svg += `
        <g class="seg" data-area="${area.id}" tabindex="0" role="button"
           aria-label="${area.label}">
          <path d="${d}" fill="${area.color}" opacity="0.92"/>
          <text class="seg-icon" x="${tx}" y="${ty - 6}">${area.icon}</text>
          <text class="seg-label" x="${tx}" y="${ty + 22}">${area.label.split(" ")[0]}</text>
        </g>`;
    });

    svg += `
      <circle cx="${cx}" cy="${cy}" r="${rInner - 14}" fill="var(--card)" stroke="var(--line)"/>
      <text class="hub-text" x="${cx}" y="${cy - 2}">Start</text>
      <text class="hub-sub" x="${cx}" y="${cy + 18}">pick an area</text>
    </svg>`;

    els.wheel.innerHTML = svg;
    els.wheel.querySelectorAll(".seg").forEach((seg) => {
      const go = () => startChat(seg.dataset.area);
      seg.addEventListener("click", go);
      seg.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
      });
    });
  }

  function buildAreaCards() {
    els.areaCards.innerHTML = "";
    AREAS.forEach((area) => {
      const btn = document.createElement("button");
      btn.className = "area-card";
      btn.style.setProperty("--ac", area.color);
      btn.innerHTML = `
        <span class="area-icon">${area.icon}</span>
        <span><b>${area.label}</b><span>${area.blurb}</span></span>`;
      btn.addEventListener("click", () => startChat(area.id));
      els.areaCards.appendChild(btn);
    });
  }

  /* ---------------- chat engine ---------------- */

  const TYPE_DELAY_BASE = 550;   // ms of "typing" before each coach message
  const TYPE_DELAY_PER_CHAR = 6; // scaled by message length, capped below
  const TYPE_DELAY_MAX = 1500;

  function clearPending() {
    state.pendingTimeouts.forEach(clearTimeout);
    state.pendingTimeouts = [];
    state.playing = null;
    removeTyping();
  }

  function startChat(areaId) {
    const area = AREAS.find((a) => a.id === areaId);
    if (!area) return;
    clearPending();
    state.area = areaId;
    els.chatAvatar.textContent = area.icon;
    els.chatName.textContent = area.label;
    els.chatLog.innerHTML = "";
    els.chatOptions.innerHTML = "";
    show("chat");
    goTo(areaId);
  }

  function goTo(nodeId) {
    if (nodeId === "wheel") { show("home"); return; }
    const node = TREE[nodeId];
    if (!node) { console.warn("Missing node:", nodeId); show("home"); return; }
    state.nodeId = nodeId;
    saveResume(nodeId, node);
    els.chatOptions.innerHTML = "";

    playCoachMessages(node.coach || [], () => {
      if (node.note) renderNote(node.note);
      if (node.insight) renderInsight(node.insight, nodeId);
      renderOptions(node);
    });
  }

  function playCoachMessages(messages, done) {
    if (!messages.length) { done(); return; }
    state.playing = { messages, i: 0, done };
    stepPlay();
  }

  function stepPlay() {
    const p = state.playing;
    if (!p) return;
    if (p.i >= p.messages.length) { state.playing = null; p.done(); return; }
    showTyping();
    const msg = p.messages[p.i++];
    const delay = Math.min(TYPE_DELAY_BASE + msg.length * TYPE_DELAY_PER_CHAR, TYPE_DELAY_MAX);
    const t = setTimeout(() => {
      removeTyping();
      addBubble(msg, "coach");
      stepPlay();
    }, delay);
    state.pendingTimeouts.push(t);
  }

  // tap anywhere in the chat to fast-forward the coach's remaining messages
  function skipPlay() {
    const p = state.playing;
    if (!p) return;
    state.pendingTimeouts.forEach(clearTimeout);
    state.pendingTimeouts = [];
    removeTyping();
    while (p.i < p.messages.length) addBubble(p.messages[p.i++], "coach");
    state.playing = null;
    p.done();
  }

  function addBubble(text, who) {
    const div = document.createElement("div");
    div.className = `msg ${who}`;
    div.textContent = text;
    els.chatLog.appendChild(div);
    scrollChat();
  }

  function showTyping() {
    removeTyping();
    const t = document.createElement("div");
    t.className = "typing";
    t.id = "typingDots";
    t.innerHTML = "<i></i><i></i><i></i>";
    els.chatLog.appendChild(t);
    scrollChat();
  }
  function removeTyping() {
    const t = $("typingDots");
    if (t) t.remove();
  }

  function scrollChat() {
    els.chatScroll.scrollTop = els.chatScroll.scrollHeight;
  }

  function renderOptions(node) {
    const options = [...(node.options || [])];
    const frag = document.createDocumentFragment();

    options.forEach((opt, idx) => {
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.textContent = opt.label;
      chip.style.animationDelay = `${idx * 70}ms`;
      chip.addEventListener("click", () => {
        clearPending();
        els.chatOptions.innerHTML = "";
        addBubble(opt.label, "user");
        const t = setTimeout(() => goTo(opt.next), 350);
        state.pendingTimeouts.push(t);
      });
      frag.appendChild(chip);
    });

    // universal escape hatch, unless the node already offers it
    const hasWheel = options.some((o) => o.next === "wheel");
    if (!hasWheel && state.nodeId !== "start") {
      const chip = document.createElement("button");
      chip.className = "chip ghost";
      chip.textContent = GLOBAL_OPTIONS.wheelLabel;
      chip.style.animationDelay = `${options.length * 70}ms`;
      chip.addEventListener("click", () => { clearPending(); show("home"); });
      frag.appendChild(chip);
    }

    els.chatOptions.appendChild(frag);
    scrollChat();
  }

  /* ---------------- inline reframe (perspective shift) ---------------- */

  function renderNote(note) {
    const el = document.createElement("div");
    el.className = "reframe";
    el.innerHTML = `
      <span class="reframe-kicker">perspective shift</span>
      <p class="reframe-quote">${escapeHTML(note.reframe)}</p>
      ${note.sub ? `<p class="reframe-sub">${escapeHTML(note.sub)}</p>` : ""}`;
    els.chatLog.appendChild(el);
    scrollChat();
  }

  /* ---------------- insight cards ---------------- */

  function insightHTML(ins) {
    const actions = (ins.actions || [])
      .map((a) => `<li>${escapeHTML(a)}</li>`)
      .join("");
    return `
      <span class="insight-tag">${escapeHTML(ins.technique)}</span>
      <h3>${escapeHTML(ins.title)}</h3>
      <div class="src">Drawing on: ${escapeHTML(ins.source)}</div>
      <div class="body">${escapeHTML(ins.body)}</div>
      ${actions ? `<ul class="actions">${actions}</ul>` : ""}`;
  }

  function renderInsight(ins, nodeId) {
    const card = document.createElement("div");
    card.className = "insight";
    card.innerHTML = insightHTML(ins);

    const foot = document.createElement("div");
    foot.className = "insight-foot";
    const save = document.createElement("button");
    save.className = "save-btn";
    const already = state.saved.some((s) => s.nodeId === nodeId);
    save.textContent = already ? "✓ Saved" : "🔖 Save insight";
    if (already) save.classList.add("saved");
    save.addEventListener("click", () => {
      if (state.saved.some((s) => s.nodeId === nodeId)) return;
      state.saved.unshift({ nodeId, ...ins });
      persistSaved();
      save.textContent = "✓ Saved";
      save.classList.add("saved");
    });
    foot.appendChild(save);
    if (SOMATIC_RE.test(ins.technique || "")) foot.appendChild(makeBreatheBtn());
    card.appendChild(foot);

    els.chatLog.appendChild(card);
    scrollChat();
  }

  function renderSaved() {
    els.savedList.innerHTML = "";
    els.savedEmpty.hidden = state.saved.length > 0;
    state.saved.forEach((ins) => {
      const card = document.createElement("div");
      card.className = "insight";
      card.innerHTML = insightHTML(ins);
      const foot = document.createElement("div");
      foot.className = "insight-foot";
      const del = document.createElement("button");
      del.className = "del-btn";
      del.textContent = "Remove";
      del.addEventListener("click", () => {
        state.saved = state.saved.filter((s) => s.nodeId !== ins.nodeId);
        persistSaved();
        renderSaved();
      });
      foot.appendChild(del);
      card.appendChild(foot);
      els.savedList.appendChild(card);
    });
  }

  /* ---------------- breathing widget (4-8 vagal breathing) ---------------- */

  const breather = {
    el: $("breather"),
    circle: $("breatherCircle"),
    phase: $("breatherPhase"),
    count: $("breatherCount"),
    timers: [],
    CYCLES: 5, IN: 4000, OUT: 8000,
  };

  function breatherStop() {
    breather.timers.forEach(clearTimeout);
    breather.timers = [];
    breather.el.hidden = true;
    breather.circle.className = "breather-circle";
  }

  function breatherStart() {
    breatherStop();
    breather.el.hidden = false;
    breather.phase.textContent = "get comfortable…";
    breather.count.textContent = "";
    let cycle = 0;
    const runCycle = () => {
      cycle++;
      if (cycle > breather.CYCLES) {
        breather.circle.className = "breather-circle";
        breather.phase.textContent = "done. notice the difference.";
        breather.count.textContent = "come back any time";
        breather.timers.push(setTimeout(breatherStop, 3500));
        return;
      }
      breather.count.textContent = `round ${cycle} of ${breather.CYCLES}`;
      breather.phase.textContent = "breathe in… 4";
      breather.circle.className = "breather-circle in";
      breather.circle.style.transitionDuration = breather.IN + "ms";
      breather.timers.push(setTimeout(() => {
        breather.phase.textContent = "and out, slow… 8";
        breather.circle.className = "breather-circle out";
        breather.circle.style.transitionDuration = breather.OUT + "ms";
        breather.timers.push(setTimeout(runCycle, breather.OUT));
      }, breather.IN));
    };
    breather.timers.push(setTimeout(runCycle, 1600));
  }

  $("breatherClose").addEventListener("click", breatherStop);

  const SOMATIC_RE = /somatic|TIPP|breath|regulation|interocept/i;

  function makeBreatheBtn() {
    const b = document.createElement("button");
    b.className = "breathe-btn";
    b.textContent = "🫁 Try it — 60s of slow breathing";
    b.addEventListener("click", breatherStart);
    return b;
  }

  /* ---------------- toolbox ---------------- */

  function buildToolbox() {
    els.toolGrid.innerHTML = "";
    TOOLBOX.forEach((tool) => {
      const card = document.createElement("div");
      card.className = "tool-card";
      card.innerHTML = `
        <span class="insight-tag">${escapeHTML(tool.tag)}</span>
        <h3>${escapeHTML(tool.name)}</h3>
        <p>${escapeHTML(tool.body)}</p>`;
      if (SOMATIC_RE.test(tool.name + " " + tool.tag)) card.appendChild(makeBreatheBtn());
      els.toolGrid.appendChild(card);
    });
  }

  /* ---------------- utils ---------------- */

  function escapeHTML(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  /* ---------------- boot ---------------- */

  const askForm = $("askForm");
  if (askForm) {
    askForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("askInput");
      const q = input.value.trim();
      if (!q) return;
      input.value = "";
      input.blur();
      runRouter(q);
    });
  }

  const composerForm = $("composerForm");
  if (composerForm) {
    composerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("composerInput");
      const q = input.value.trim();
      if (!q) return;
      input.value = "";
      runRouter(q, { append: true });
    });
  }

  // tap the conversation to fast-forward the coach's typing
  els.chatScroll.addEventListener("click", (e) => {
    if (state.playing && !e.target.closest("button, a, input")) skipPlay();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !breather.el.hidden) breatherStop();
  });

  initTheme();
  buildWheel();
  buildAreaCards();
  buildToolbox();
  updateSavedBadge();
  renderResume();
  show("home");
})();
