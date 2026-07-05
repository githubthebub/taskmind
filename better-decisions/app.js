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
    window.scrollTo({ top: 0 });
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
    els.chatOptions.innerHTML = "";

    playCoachMessages(node.coach || [], () => {
      if (node.note) renderNote(node.note);
      if (node.insight) renderInsight(node.insight, nodeId);
      renderOptions(node);
    });
  }

  function playCoachMessages(messages, done) {
    if (!messages.length) { done(); return; }
    let i = 0;
    const next = () => {
      if (i >= messages.length) { done(); return; }
      showTyping();
      const msg = messages[i++];
      const delay = Math.min(TYPE_DELAY_BASE + msg.length * TYPE_DELAY_PER_CHAR, TYPE_DELAY_MAX);
      const t = setTimeout(() => {
        removeTyping();
        addBubble(msg, "coach");
        next();
      }, delay);
      state.pendingTimeouts.push(t);
    };
    next();
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

  initTheme();
  buildWheel();
  buildAreaCards();
  buildToolbox();
  updateSavedBadge();
  show("home");
})();
