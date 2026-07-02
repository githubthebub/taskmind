/* ============================================================
   ATTUNE — visuals

   1. Field  — the living background: slow drifting orbs of color
               whose palette and tempo follow a mood parameter,
               and which swell with the breath during sessions.
   2. Pacer  — the breath circle: expands on inhale, holds, and
               releases, with a progress arc and phase callbacks.
   3. Map    — the state map (circumplex: ease × energy) with
               regions, the "you are here" point, the destination,
               and the planned journey arc.
   ============================================================ */

(() => {
  /* ================= FIELD ================= */

  const Field = {
    canvas: null, ctx: null, orbs: [],
    mood: 0.35,        // 0 = deep/dark, 1 = bright/awake
    breath: 0,         // 0…1 from pacer, swells the field
    t: 0,
  };
  Attune.Field = Field;

  const PALETTES = [
    // deep rest — indigo/teal midnight
    [[178, 40, 22], [200, 45, 18], [160, 35, 16]],
    // settled — sea green / slate
    [[165, 38, 24], [190, 35, 22], [145, 30, 18]],
    // awake — warm dawn edges
    [[155, 40, 26], [40, 45, 24], [180, 38, 24]],
  ];

  function lerp(a, b, t) { return a + (b - a) * t; }

  function palette(mood) {
    const idx = mood * (PALETTES.length - 1);
    const i = Math.min(PALETTES.length - 2, Math.floor(idx));
    const f = idx - i;
    return PALETTES[i].map((c, k) => [
      lerp(c[0], PALETTES[i + 1][k][0], f),
      lerp(c[1], PALETTES[i + 1][k][1], f),
      lerp(c[2], PALETTES[i + 1][k][2], f),
    ]);
  }

  Field.init = function () {
    Field.canvas = document.getElementById("field");
    Field.ctx = Field.canvas.getContext("2d");
    const resize = () => {
      Field.canvas.width = innerWidth;
      Field.canvas.height = innerHeight;
    };
    addEventListener("resize", resize);
    resize();
    Field.orbs = Array.from({ length: 5 }, (_, i) => ({
      seed: i * 7.3 + 2.1,
      r: 0.32 + (i % 3) * 0.14,
    }));
    requestAnimationFrame(Field.frame);
  };

  Field.frame = function () {
    const { ctx, canvas } = Field;
    const w = canvas.width, h = canvas.height;
    Field.t += 0.0016 + Field.mood * 0.0022;

    ctx.fillStyle = "#060d12";
    ctx.fillRect(0, 0, w, h);

    const pal = palette(Field.mood);
    const swell = 1 + Field.breath * 0.18;

    Field.orbs.forEach((orb, i) => {
      const c = pal[i % pal.length];
      const x = w * (0.5 + 0.38 * Math.sin(Field.t * 0.7 + orb.seed));
      const y = h * (0.5 + 0.36 * Math.cos(Field.t * 0.53 + orb.seed * 1.7));
      const r = Math.max(w, h) * orb.r * swell;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `hsla(${c[0]}, ${c[1]}%, ${c[2]}%, 0.32)`);
      g.addColorStop(1, "hsla(0, 0%, 0%, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });

    requestAnimationFrame(Field.frame);
  };

  /* ================= PACER ================= */

  const Pacer = {
    canvas: null, ctx: null,
    pattern: null,          // {inhale, holdIn, exhale, holdOut, label}
    phaseStart: 0, phase: "idle", running: false,
    onPhase: null,          // callback(phaseName)
    value: 0.35,            // current radius factor 0…1
    idleT: 0,
  };
  Attune.Pacer = Pacer;

  const PHASE_ORDER = ["inhale", "holdIn", "exhale", "holdOut"];
  const PHASE_LABEL = { inhale: "breathe in", holdIn: "hold", exhale: "let it go", holdOut: "rest" };

  Pacer.init = function () {
    Pacer.canvas = document.getElementById("pacer");
    Pacer.ctx = Pacer.canvas.getContext("2d");
    requestAnimationFrame(Pacer.frame);
  };

  Pacer.setPattern = function (pattern) {
    Pacer.pattern = pattern || null;
    if (pattern) {
      Pacer.phase = "inhale";
      Pacer.phaseStart = performance.now();
      if (Pacer.onPhase) Pacer.onPhase("inhale", pattern);
    } else {
      Pacer.phase = "idle";
    }
  };

  Pacer.frame = function (now) {
    const { ctx, canvas } = Pacer;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const rMax = Math.min(w, h) * 0.36;
    const rMin = rMax * 0.42;

    let target = Pacer.value;
    let progress = 0;

    if (Pacer.pattern && Pacer.running) {
      const p = Pacer.pattern;
      const scale = Attune.TIME_SCALE;
      let el = ((now - Pacer.phaseStart) / 1000) * scale;
      let durOf = (ph) => Math.max(0.001, p[ph] || 0);
      // advance phases (skipping zero-length ones)
      let guard = 8;
      while (el >= durOf(Pacer.phase) && guard-- > 0) {
        el -= durOf(Pacer.phase);
        const idx = PHASE_ORDER.indexOf(Pacer.phase);
        let next = PHASE_ORDER[(idx + 1) % 4];
        while ((p[next] || 0) <= 0.05) next = PHASE_ORDER[(PHASE_ORDER.indexOf(next) + 1) % 4];
        Pacer.phase = next;
        Pacer.phaseStart = now - (el / scale) * 1000;
        if (Pacer.onPhase) Pacer.onPhase(next, p);
      }
      const t = Math.min(1, el / durOf(Pacer.phase));
      progress = t;
      const easeInOut = (x) => x * x * (3 - 2 * x);
      if (Pacer.phase === "inhale") target = easeInOut(t);
      else if (Pacer.phase === "holdIn") target = 1;
      else if (Pacer.phase === "exhale") target = 1 - easeInOut(t);
      else target = 0;
    } else {
      // idle: a slow ambient pulse (~9s period) — presence without instruction
      Pacer.idleT += 0.016;
      target = 0.3 + 0.12 * Math.sin(Pacer.idleT * (2 * Math.PI / 9));
    }

    Pacer.value += (target - Pacer.value) * 0.08;
    const v = Pacer.value;
    Attune.Field.breath = v;

    const r = rMin + (rMax - rMin) * v;

    // halo
    const halo = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.1);
    halo.addColorStop(0, `rgba(127, 184, 164, ${0.16 + v * 0.14})`);
    halo.addColorStop(1, "rgba(127, 184, 164, 0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);

    // outer guide ring (breath range)
    ctx.beginPath();
    ctx.arc(cx, cy, rMax, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(143, 168, 164, 0.16)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // main breathing disc
    const disc = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    disc.addColorStop(0, "rgba(168, 220, 200, 0.30)");
    disc.addColorStop(0.75, "rgba(127, 184, 164, 0.16)");
    disc.addColorStop(1, "rgba(127, 184, 164, 0.03)");
    ctx.fillStyle = disc;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(168, 220, 200, ${0.5 + v * 0.3})`;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // phase progress arc
    if (Pacer.pattern && Pacer.running) {
      ctx.beginPath();
      ctx.arc(cx, cy, rMax + 14, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.strokeStyle = "rgba(217, 165, 102, 0.55)";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    requestAnimationFrame(Pacer.frame);
  };

  Pacer.labelFor = (phase) => PHASE_LABEL[phase] || "";

  /* ================= MAP ================= */

  const MapView = {};
  Attune.MapView = MapView;

  const REGIONS = [
    { name: "wired",      x: 0.22, y: 0.14 },
    { name: "energized",  x: 0.78, y: 0.14 },
    { name: "braced",     x: 0.18, y: 0.42 },
    { name: "engaged",    x: 0.80, y: 0.40 },
    { name: "flat",       x: 0.20, y: 0.72 },
    { name: "calm",       x: 0.78, y: 0.68 },
    { name: "shut down",  x: 0.22, y: 0.92 },
    { name: "restful",    x: 0.78, y: 0.92 },
  ];

  MapView.PAD = 34;

  MapView.draw = function (canvas, { before, target, waypoints, after }) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height, pad = MapView.PAD;

    // water
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "rgba(12, 24, 32, 0.9)");
    bg.addColorStop(1, "rgba(8, 16, 22, 0.9)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // quadrant glows: unease (left) rose/slate, ease (right) green/amber
    const glows = [
      [0.2, 0.2, "rgba(201, 138, 138, 0.10)"],   // high energy, low ease
      [0.8, 0.2, "rgba(217, 165, 102, 0.10)"],   // high energy, high ease
      [0.2, 0.8, "rgba(110, 135, 168, 0.10)"],   // low energy, low ease
      [0.8, 0.8, "rgba(127, 184, 164, 0.12)"],   // low energy, high ease
    ];
    for (const [gx, gy, color] of glows) {
      const g = ctx.createRadialGradient(w * gx, h * gy, 0, w * gx, h * gy, Math.max(w, h) * 0.5);
      g.addColorStop(0, color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    // axes
    ctx.strokeStyle = "rgba(143, 168, 164, 0.14)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(w / 2, pad); ctx.lineTo(w / 2, h - pad);
    ctx.moveTo(pad, h / 2); ctx.lineTo(w - pad, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(143, 168, 164, 0.55)";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("A C T I V A T E D", w / 2, pad - 12);
    ctx.fillText("Q U I E T", w / 2, h - pad + 20);
    ctx.save();
    ctx.translate(pad - 14, h / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText("U N E A S Y", 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(w - pad + 16, h / 2); ctx.rotate(Math.PI / 2);
    ctx.fillText("A T   E A S E", 0, 0);
    ctx.restore();

    // region names
    ctx.font = "italic 11px Georgia, serif";
    ctx.fillStyle = "rgba(143, 168, 164, 0.4)";
    for (const rg of REGIONS) {
      ctx.fillText(rg.name, pad + rg.x * (w - pad * 2), pad + rg.y * (h - pad * 2));
    }

    const pt = (vec) => Attune.toMapXY(vec, w, h, pad);

    // journey arc
    if (waypoints && waypoints.length > 1) {
      ctx.beginPath();
      const p0 = pt(waypoints[0]);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < waypoints.length; i++) {
        const a = pt(waypoints[i - 1]), b = pt(waypoints[i]);
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        ctx.quadraticCurveTo(a.x, a.y, mx, my);
      }
      const pl = pt(waypoints[waypoints.length - 1]);
      ctx.lineTo(pl.x, pl.y);
      ctx.strokeStyle = "rgba(168, 220, 200, 0.45)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([1, 6]);
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.setLineDash([]);
      // waypoint ticks
      for (let i = 1; i < waypoints.length - 1; i++) {
        const p = pt(waypoints[i]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(168, 220, 200, 0.5)";
        ctx.fill();
      }
    }

    // "you are here"
    if (before) {
      const p = pt(before);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(220, 232, 230, 0.9)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(220, 232, 230, 0.35)";
      ctx.stroke();
      ctx.fillStyle = "rgba(220, 232, 230, 0.75)";
      ctx.font = "9px sans-serif";
      // keep the label clear of the region names near the corners
      const ly = p.y > 40 ? p.y - 20 : p.y + 28;
      ctx.fillText("you, now", p.x, ly);
    }

    // arrival (actual) — drawn on the results map
    if (after) {
      const p = pt(after);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(217, 165, 102, 0.95)";
      ctx.fill();
      ctx.fillStyle = "rgba(217, 165, 102, 0.85)";
      ctx.font = "9px sans-serif";
      ctx.fillText("you landed here", p.x, p.y - 16);
    }

    // destination
    if (target) {
      const p = pt(target);
      const t = performance.now() / 1000;
      const pulse = 1 + 0.15 * Math.sin(t * 2.2);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 26 * pulse);
      g.addColorStop(0, "rgba(168, 220, 200, 0.5)");
      g.addColorStop(1, "rgba(168, 220, 200, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 26 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(168, 220, 200, 1)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 13 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(168, 220, 200, 0.6)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = "rgba(168, 220, 200, 0.9)";
      ctx.font = "9px sans-serif";
      ctx.fillText(after ? "you aimed here" : "destination", p.x, p.y + 26);
    }
  };
})();
