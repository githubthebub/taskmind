/**
 * BetterDecisions store — state, persistence and the pure decision logic.
 *
 * Works in the browser (localStorage) and in Node (in-memory fallback),
 * so the logic here is unit-testable with `node --test`.
 */

const STORAGE_KEY = "betterdecisions.v1";

/* ------------------------------------------------------------------ *
 * Storage adapter
 * ------------------------------------------------------------------ */

function defaultStorage() {
  try {
    if (typeof localStorage !== "undefined") {
      const probe = "__bd_probe__";
      localStorage.setItem(probe, "1");
      localStorage.removeItem(probe);
      return localStorage;
    }
  } catch {
    /* private mode / disabled storage — fall through to memory */
  }
  const mem = new Map();
  return {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
  };
}

/* ------------------------------------------------------------------ *
 * State shape
 * ------------------------------------------------------------------ */

export function emptyState() {
  return {
    version: 1,
    decisions: [],   // finished + in-progress decisions (drafts included)
    draftId: null,   // id of the wizard draft currently in progress
  };
}

let uidCounter = 0;
export function uid() {
  uidCounter += 1;
  return `d${Date.now().toString(36)}${uidCounter.toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/**
 * A decision record. Statuses: draft -> decided -> reviewed.
 */
export function newDecision(now = Date.now()) {
  return {
    id: uid(),
    status: "draft",
    createdAt: now,
    updatedAt: now,

    // Step 1 — check in (Dr. K)
    checkin: { halt: [], emotion: "", intensity: 3 },

    // Step 2 — frame it
    title: "",
    detail: "",
    options: ["", ""],
    deadline: "",          // yyyy-mm-dd or ""

    // Step 3 — triage (Ali)
    reversible: null,      // true | false | null
    stakes: null,          // "low" | "medium" | "high" | null
    fastTracked: false,

    // Step 4 — values (Manson)
    values: [],            // chosen value names (max 3)
    optionNotes: [],       // per option: { pain: "", fit: { [value]: 1..5 } }

    // Step 5 — think it through (Big Think + Ali's bookshelf)
    frameworks: {},        // { [frameworkId]: "answer text" }

    // Step 6 — courage check (Charlie)
    courage: { noJudgement: "", pleasing: null, confidentSelf: "" },

    // Step 7 — gut check
    gut: { done: false, result: "", feeling: null }, // feeling: relieved | disappointed | nothing

    // Step 8 — decide (Annie Duke bet)
    chosenIndex: null,
    confidence: 70,        // 0..100
    rationale: "",
    reviewOn: "",          // yyyy-mm-dd

    // Review (later)
    review: null,          // { outcome, process, lesson, reviewedAt }
  };
}

/* ------------------------------------------------------------------ *
 * Store
 * ------------------------------------------------------------------ */

export function createStore(storage = defaultStorage()) {
  let state = load();
  const listeners = new Set();

  function load() {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.decisions)) {
        return emptyState();
      }
      return { ...emptyState(), ...parsed };
    } catch {
      return emptyState();
    }
  }

  function notify() {
    listeners.forEach((fn) => fn(state));
  }

  function persist() {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota exceeded / private mode — keep going in memory */
    }
    notify();
  }

  const store = {
    get state() {
      return state;
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    /** Re-read state from storage (e.g. after another tab wrote to it). */
    reload() {
      state = load();
      notify();
    },

    /* ---- decisions ---- */

    getDecision(id) {
      return state.decisions.find((d) => d.id === id) || null;
    },

    upsertDecision(decision) {
      decision.updatedAt = Date.now();
      const i = state.decisions.findIndex((d) => d.id === decision.id);
      if (i >= 0) state.decisions[i] = decision;
      else state.decisions.unshift(decision);
      persist();
      return decision;
    },

    deleteDecision(id) {
      state.decisions = state.decisions.filter((d) => d.id !== id);
      if (state.draftId === id) state.draftId = null;
      persist();
    },

    /* ---- wizard draft ---- */

    startDraft() {
      const d = newDecision();
      state.decisions.unshift(d);
      state.draftId = d.id;
      persist();
      return d;
    },

    /**
     * Persist an in-memory draft the first time the user actually touches it
     * (the wizard creates drafts lazily so just visiting #/new leaves no trace).
     * No-op for anything that is no longer a draft.
     */
    adoptDraft(d) {
      if (!d || d.status !== "draft") return;
      state.draftId = d.id;
      this.upsertDecision(d);
    },

    getDraft() {
      if (!state.draftId) return null;
      const d = this.getDecision(state.draftId);
      if (!d || d.status !== "draft") return null;
      return d;
    },

    /** Finalize the current draft as a decided decision. */
    commitDraft(draft) {
      draft.status = "decided";
      draft.decidedAt = Date.now();
      this.upsertDecision(draft);
      if (state.draftId === draft.id) state.draftId = null;
      persist();
      return draft;
    },

    discardDraft() {
      if (!state.draftId) return;
      this.deleteDecision(state.draftId);
    },

    /* ---- review ---- */

    saveReview(id, review) {
      const d = this.getDecision(id);
      if (!d) return null;
      d.review = { ...review, reviewedAt: Date.now() };
      d.status = "reviewed";
      this.upsertDecision(d);
      return d;
    },

    /* ---- import / export ---- */

    exportJSON() {
      return JSON.stringify(state, null, 2);
    },

    importJSON(json) {
      const parsed = JSON.parse(json); // let it throw; caller shows the error
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.decisions)) {
        throw new Error("Not a BetterDecisions export file.");
      }
      state = { ...emptyState(), ...parsed };
      persist();
    },

    clearAll() {
      state = emptyState();
      try {
        storage.removeItem(STORAGE_KEY);
      } catch { /* ignore */ }
      notify();
    },
  };

  return store;
}

/* ------------------------------------------------------------------ *
 * Pure decision logic (unit-tested)
 * ------------------------------------------------------------------ */

/**
 * Dr. K's check-in verdict: should you decide right now?
 * Returns { ok, reasons[] }.
 */
export function checkinVerdict(checkin) {
  const reasons = [];
  const halt = checkin?.halt || [];
  const intensity = Number(checkin?.intensity ?? 0);
  if (halt.length >= 2) {
    reasons.push(`You flagged ${halt.length} of the HALT states (${halt.join(", ").toLowerCase()}).`);
  }
  if (intensity >= 4) {
    reasons.push("Your emotional intensity is high (4+ / 5).");
  }
  return { ok: reasons.length === 0, reasons };
}

/**
 * Ali's triage: is this a two-way door you should just walk through?
 * Returns "fast" | "full".
 */
export function triageRecommendation(reversible, stakes) {
  if (reversible === true && (stakes === "low" || stakes === "medium")) return "fast";
  return "full";
}

/**
 * Average values-fit score for one option's fit map, or null when unrated.
 * When `values` is given, only ratings for those values count — ratings left
 * behind by since-deselected values must not skew the score.
 */
export function valuesFitScore(fit, values = null) {
  if (!fit) return null;
  const entries = Object.entries(fit).filter(
    ([k, n]) => typeof n === "number" && n >= 1 && (!values || values.includes(k))
  );
  if (!entries.length) return null;
  return Math.round((entries.reduce((a, [, n]) => a + n, 0) / entries.length) * 10) / 10;
}

/**
 * Rank options by values fit. Returns indices of `optionNotes` sorted best-first;
 * unrated options sink to the end. Ties keep original order.
 */
export function rankOptionsByValues(optionNotes, values = null) {
  const scored = (optionNotes || []).map((note, i) => ({ i, score: valuesFitScore(note?.fit, values) }));
  return scored
    .slice()
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || a.i - b.i)
    .map((s) => s.i);
}

/** Is a decided decision due for its review? */
export function isReviewDue(decision, today = new Date()) {
  if (decision.status !== "decided" || !decision.reviewOn) return false;
  const due = new Date(`${decision.reviewOn}T00:00:00`);
  if (Number.isNaN(due.getTime())) return false;
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return due <= t;
}

/** Default review date: ~30 days out, or the deadline if it's sooner and in the future. */
export function defaultReviewDate(now = new Date(), deadline = "") {
  // Calendar arithmetic (not ms) so DST transitions can't shave a day off.
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() + 30);
  if (deadline) {
    const dl = new Date(`${deadline}T00:00:00`);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (!Number.isNaN(dl.getTime()) && dl > today && dl < d) return deadline;
  }
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Annie Duke calibration: compare average stated confidence with how often
 * reviewed decisions actually turned out well.
 * Returns null until there are at least `min` reviewed decisions.
 */
export function calibration(decisions, min = 3) {
  const reviewed = decisions.filter((d) => d.status === "reviewed" && d.review);
  if (reviewed.length < min) return null;
  const avgConfidence =
    reviewed.reduce((sum, d) => sum + (Number(d.confidence) || 0), 0) / reviewed.length;
  const goodShare =
    reviewed.filter((d) => d.review.outcome === "good").length / reviewed.length;
  return {
    count: reviewed.length,
    avgConfidence: Math.round(avgConfidence),
    goodShare: Math.round(goodShare * 100),
    gap: Math.round(avgConfidence - goodShare * 100),
  };
}

/**
 * Spot "resulting" (Annie Duke): judging the decision purely by its outcome.
 * Flags reviews where outcome and process quality disagree.
 */
export function resultingWarning(review) {
  if (!review) return null;
  if (review.outcome === "good" && review.process === "poor") {
    return "Good outcome, poor process — that's luck, not skill. Don't let the win teach the wrong lesson.";
  }
  if (review.outcome === "bad" && review.process === "good") {
    return "Bad outcome, good process — that's variance, not failure. The same decision was still worth making.";
  }
  return null;
}

/**
 * Compile the decision brief shown at the Decide step and in the journal.
 * Pure string building — no DOM.
 */
export function compileBrief(d, frameworksCatalog = []) {
  const lines = [];
  // Ends the line with "." only when the text doesn't already punctuate itself.
  const dot = (s) => (/[.!?…"'”)]$/.test(s) ? "" : ".");

  if (d.checkin?.emotion) {
    lines.push(`State going in: feeling ${d.checkin.emotion.trim()} (intensity ${d.checkin.intensity}/5).`);
  }
  if (d.reversible !== null && d.stakes) {
    lines.push(
      `${d.reversible ? "Two-way door" : "One-way door"} with ${d.stakes} stakes` +
        (d.fastTracked ? " — fast-tracked." : ".")
    );
  }
  if (d.values?.length) {
    lines.push(`Values on the table: ${d.values.join(", ")}.`);
  }
  // Iterate original indices — optionNotes is parallel to the unfiltered
  // options array, and a blank row in the middle must not shift the pairing.
  (d.options || []).forEach((opt, i) => {
    if (!opt || !opt.trim()) return;
    const note = d.optionNotes?.[i];
    const score = valuesFitScore(note?.fit, d.values?.length ? d.values : null);
    const bits = [];
    if (score !== null && score !== undefined) bits.push(`values fit ${score}/5`);
    if (note?.pain?.trim()) bits.push(`the pain: ${note.pain.trim()}`);
    if (bits.length) {
      const line = `Option "${opt.trim()}": ${bits.join("; ")}`;
      lines.push(line + dot(line));
    }
  });
  Object.entries(d.frameworks || {}).forEach(([id, answer]) => {
    if (!answer || !answer.trim()) return;
    const fw = frameworksCatalog.find((f) => f.id === id);
    lines.push(`${fw ? fw.name : id}: ${answer.trim()}`);
  });
  if (d.courage?.pleasing === true) {
    lines.push("Flagged: part of this choice is about not disappointing someone.");
  }
  if (d.courage?.confidentSelf?.trim()) {
    lines.push(`The confident version of me would: ${d.courage.confidentSelf.trim()}`);
  }
  if (d.gut?.done && d.gut.feeling) {
    lines.push(`Gut check: coin said "${d.gut.result}" and I felt ${d.gut.feeling}.`);
  }
  return lines.join("\n");
}
