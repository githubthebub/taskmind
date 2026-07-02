/* ============================================================
   ATTUNE — the sequencer

   Turns (where you are, where you want to go, how long we have,
   what the body map says) into a journey:

     Arrive    — orienting & contact. Non-negotiable: interoception
                 without orientation is how sessions backfire.
     Regulate  — breath as the steering wheel, chosen by the
                 direction and size of the arousal shift.
     Deepen    — the main modality, scored against the remaining
                 gap (release, pendulation, resourcing, focus,
                 energizing, sleep descent…).
     Integrate — seal the state so it survives contact with the day.

   The plan is a flat list of items { practice, dur, phase }.
   Mid-session check-ins call replan() with the reported state and
   the remaining seconds; the rest of the journey is rebuilt while
   the traveler keeps breathing.
   ============================================================ */

(() => {
  const P = () => Attune.PRACTICES;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  /* How much a practice serves the current gap.
     gap = target - current, per dimension (-100 … 100). */
  function score(practice, gap) {
    let s = 0;
    for (const d of Attune.DIMS) {
      const need = gap[d] / 25;             // roughly -4 … 4
      s += practice.effects[d] * clamp(need, -3, 3);
    }
    return s;
  }

  function gapOf(cur, target) {
    const g = {};
    for (const d of Attune.DIMS) g[d] = target[d] - cur[d];
    return g;
  }

  /* Give each chosen practice a duration inside its bounds,
     distributing budget proportionally to weight. */
  function allocate(items, budget) {
    if (!items.length) return [];
    let remaining = budget;
    const out = items.map((it) => {
      const d = clamp(Math.round(budget * it.share), it.practice.min, it.practice.max);
      return { ...it, dur: d };
    });
    // fix rounding drift: scale to fit the budget, respecting bounds
    let total = out.reduce((s, x) => s + x.dur, 0);
    let guard = 8;
    while (Math.abs(total - budget) > 8 && guard-- > 0) {
      const k = budget / total;
      for (const x of out) x.dur = clamp(Math.round(x.dur * k), x.practice.min, x.practice.max);
      total = out.reduce((s, x) => s + x.dur, 0);
    }
    return out;
  }

  /* ---------- phase builders ---------- */

  function pickRegulate(gap, ctx) {
    const dE = gap.energy;
    const list = [];
    if (dE < -22) {
      list.push({ practice: P().sigh, share: 0.35 });
      list.push({ practice: P().longExhale, share: 0.65 });
    } else if (dE < -6) {
      list.push({ practice: P().longExhale, share: 1 });
    } else if (dE <= 8) {
      list.push({ practice: gap.clarity > 20 ? P().box : P().coherent, share: 1 });
    } else if (dE <= 24) {
      list.push({ practice: P().liftBreath, share: 1 });
    } else {
      list.push({ practice: P().sigh, share: 0.3 });   // clear the static first
      list.push({ practice: P().liftBreath, share: 0.7 });
    }
    // very low groundedness: anchor before any breath work
    if (ctx.current.ground < 30) list.unshift({ practice: P().feetRoots, share: 0.4 });
    return list;
  }

  function pickDeepen(gap, ctx, budget) {
    const chosen = [];
    const used = new Set(ctx.used || []);
    const add = (pr) => {
      if (pr && !used.has(pr.id)) { chosen.push(pr); used.add(pr.id); }
    };

    // intent-specific spine
    if (ctx.presetId === "sleep" || (ctx.target.energy < 25 && ctx.target.clarity < 35)) {
      add(P().weightSink); add(P().descend);
    } else if (ctx.presetId === "release") {
      add(P().voo); add(P().pendulate); add(P().unclench);
    }

    // the body map speaks
    const marks = ctx.marks || {};
    const values = Object.values(marks);
    const headedDown = ctx.target.energy < 32;
    if (values.includes("tension")) add(P().unclench);
    if ((values.includes("numb") || ctx.current.ground < 35) && !headedDown) add(P().tapWake);

    // fill by score against the gap — but never stimulate on the way down
    const pool = Object.values(P()).filter(
      (pr) => pr.phase.includes("deepen") && !used.has(pr.id) &&
        !(headedDown && pr.effects.energy > 0)
    );
    pool.sort((a, b) => score(b, gap) - score(a, gap));
    for (const pr of pool) {
      const minSum = chosen.reduce((s, x) => s + x.min, 0);
      if (minSum + pr.min > budget) break;
      if (score(pr, gap) <= 0 && chosen.length) break;
      add(pr);
      if (chosen.length >= (budget > 900 ? 4 : budget > 420 ? 3 : 2)) break;
    }
    if (!chosen.length) add(P().stillPoint);

    // long journeys earn open water
    if (budget > 1000 && !used.has("stillPoint")) chosen.push(P().stillPoint);

    const share = 1 / chosen.length;
    return chosen.map((pr) => ({ practice: pr, share }));
  }

  function pickIntegrate(ctx) {
    const t = ctx.target;
    if (ctx.presetId === "sleep" || (t.energy < 25 && t.clarity < 35))
      return [{ practice: P().sealSleep, share: 1 }];
    if (t.clarity > 72 && t.energy >= 55)
      return [{ practice: P().sealFocus, share: 1 }];
    return [{ practice: P().seal, share: 1 }];
  }

  /* ---------- the public planner ---------- */

  Attune.buildPlan = function (before, target, minutes, opts = {}) {
    const total = minutes * 60;
    const ctx = {
      current: before,
      target,
      marks: opts.marks || {},
      presetId: opts.presetId || null,
      used: [],
    };
    const gap = gapOf(before, target);

    // phase budgets — a 5-minute journey is a different animal
    let bArrive, bRegulate, bDeepen, bIntegrate;
    if (minutes <= 5) {
      bArrive = total * 0.18; bRegulate = total * 0.45; bDeepen = 0; bIntegrate = total * 0.37 * 0.6;
    } else if (minutes <= 10) {
      bArrive = total * 0.16; bRegulate = total * 0.34; bDeepen = total * 0.32; bIntegrate = total * 0.18;
    } else {
      bArrive = total * 0.13; bRegulate = total * 0.27; bDeepen = total * 0.42; bIntegrate = total * 0.18;
    }

    const phases = [];

    // ARRIVE
    const arrive = [{ practice: P().orient, share: minutes > 10 ? 0.55 : 1 }];
    if (minutes > 10) arrive.push({ practice: gap.ground > 15 ? P().contact : P().feetRoots, share: 0.45 });
    phases.push({ name: "Arrive", items: allocate(arrive, bArrive) });

    // REGULATE
    const regulate = pickRegulate(gap, ctx);
    ctx.used = [...arrive, ...regulate].map((it) => it.practice.id);
    phases.push({ name: "Regulate", items: allocate(regulate, bRegulate) });

    // DEEPEN
    if (bDeepen > 0) {
      const midpoint = Attune.vecLerp(before, target, 0.5);
      const deepGap = gapOf(midpoint, target);
      for (const d of Attune.DIMS) deepGap[d] = gap[d]; // score on the full journey's character
      phases.push({ name: "Deepen", items: allocate(pickDeepen(deepGap, ctx, bDeepen), bDeepen) });
    }

    // INTEGRATE
    phases.push({ name: "Integrate", items: allocate(pickIntegrate(ctx), Math.max(bIntegrate, 60)) });

    // flatten
    const queue = [];
    for (const ph of phases) {
      for (const it of ph.items) queue.push({ practice: it.practice, dur: it.dur, phase: ph.name });
    }

    // per-phase min-duration clamps can overshoot the promised time —
    // normalize so "20 minutes" means 20 minutes
    const rawTotal = queue.reduce((s, x) => s + x.dur, 0);
    if (Math.abs(rawTotal - total) > total * 0.03) {
      const k = total / rawTotal;
      for (const q of queue) {
        q.dur = Math.round(Math.max(q.practice.min * 0.7, q.dur * k));
      }
    }

    // check-ins: one for ≥10 min, two for ≥20 — placed at ~45% and ~75%
    const planTotal = queue.reduce((s, x) => s + x.dur, 0);
    const checkins = [];
    if (minutes >= 10) checkins.push(Math.round(planTotal * 0.45));
    if (minutes >= 20) checkins.push(Math.round(planTotal * 0.75));

    return {
      queue,
      phases: phases.map((p) => p.name),
      totalSec: planTotal,
      checkins,
      before: { ...before },
      target: { ...target },
    };
  };

  /* Waypoints for drawing the journey on the map: the state the
     traveler should be passing through at the end of each item. */
  Attune.planWaypoints = function (plan) {
    const pts = [{ ...plan.before }];
    let elapsed = 0;
    for (const item of plan.queue) {
      elapsed += item.dur;
      const t = elapsed / plan.totalSec;
      // ease-in-out: most movement mid-journey, gentle at both ends
      const eased = t * t * (3 - 2 * t);
      pts.push(Attune.vecLerp(plan.before, plan.target, eased));
    }
    pts[pts.length - 1] = { ...plan.target };
    return pts;
  };

  /* ---------- mid-session adaptation ----------
     reported: { energy, ground } from the micro check-in.
     Rebuilds everything after the current item from the reported
     state, keeping the same target and remaining time. */
  Attune.replan = function (plan, doneIndex, reported, opts = {}) {
    const remaining = plan.queue.slice(doneIndex + 1);
    const remainingSec = remaining.reduce((s, x) => s + x.dur, 0);
    if (remainingSec < 120) return plan; // too little runway to bother

    const current = {
      energy: reported.energy,
      ease: Attune.vecLerp(plan.before, plan.target, 0.5).ease,
      ground: reported.ground,
      clarity: Attune.vecLerp(plan.before, plan.target, 0.5).clarity,
    };
    const gap = gapOf(current, plan.target);
    const ctx = {
      current, target: plan.target,
      marks: opts.marks || {}, presetId: opts.presetId || null,
      used: plan.queue.slice(0, doneIndex + 1).map((x) => x.practice.id),
    };

    const integrate = allocate(pickIntegrate(ctx), Math.max(remainingSec * 0.3, 60));
    const integrateSec = integrate.reduce((s, x) => s + x.dur, 0);
    let corrective = [];
    const room = remainingSec - integrateSec;

    if (room > 90) {
      if (gap.energy < -18) {
        // still running hotter than the destination — stronger brakes
        corrective = allocate(
          [{ practice: P().voo, share: 0.45 }, { practice: P().longExhale, share: 0.55 }],
          room
        );
      } else if (gap.energy > 18) {
        // overshot into sluggish while aiming higher — gentle re-charge
        corrective = allocate(
          [{ practice: P().reach, share: 0.45 }, { practice: P().tapWake, share: 0.55 }],
          room
        );
      } else if (reported.ground < 38) {
        corrective = allocate(
          [{ practice: P().contact, share: 0.5 }, { practice: P().pendulate, share: 0.5 }],
          room
        );
      } else {
        // on course — keep the original itinerary, trimmed to fit
        corrective = null;
      }
    } else {
      corrective = null;
    }

    let newTail;
    if (corrective) {
      newTail = [
        ...corrective.map((it) => ({ practice: it.practice, dur: it.dur, phase: "Deepen" })),
        ...integrate.map((it) => ({ practice: it.practice, dur: it.dur, phase: "Integrate" })),
      ];
    } else {
      newTail = remaining;
    }

    const queue = [...plan.queue.slice(0, doneIndex + 1), ...newTail];
    return {
      ...plan,
      queue,
      totalSec: queue.reduce((s, x) => s + x.dur, 0),
      adapted: !!corrective,
    };
  };
})();
