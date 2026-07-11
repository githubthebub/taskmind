import test from "node:test";
import assert from "node:assert/strict";
import {
  createStore,
  emptyState,
  newDecision,
  checkinVerdict,
  triageRecommendation,
  valuesFitScore,
  rankOptionsByValues,
  isReviewDue,
  defaultReviewDate,
  calibration,
  resultingWarning,
  compileBrief,
} from "../js/store.js";
import { quoteOfTheDay, QUOTES, MENTORS, FRAMEWORKS, mentorById, frameworkById } from "../js/data/content.js";

function memStorage() {
  const mem = new Map();
  return {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
    _mem: mem,
  };
}

/* ------------------------------------------------ store lifecycle */

test("store starts empty and persists decisions across reloads", () => {
  const storage = memStorage();
  const store = createStore(storage);
  assert.equal(store.state.decisions.length, 0);

  const d = store.startDraft();
  d.title = "Take the Berlin job?";
  store.upsertDecision(d);

  const reloaded = createStore(storage);
  assert.equal(reloaded.state.decisions.length, 1);
  assert.equal(reloaded.state.decisions[0].title, "Take the Berlin job?");
  assert.equal(reloaded.getDraft().id, d.id);
});

test("corrupt storage falls back to empty state", () => {
  const storage = memStorage();
  storage.setItem("betterdecisions.v1", "{not json!!");
  const store = createStore(storage);
  assert.deepEqual(store.state, emptyState());

  storage.setItem("betterdecisions.v1", JSON.stringify({ decisions: "nope" }));
  assert.deepEqual(createStore(storage).state, emptyState());
});

test("commitDraft finalizes and clears the draft pointer", () => {
  const store = createStore(memStorage());
  const d = store.startDraft();
  d.title = "X";
  d.chosenIndex = 0;
  store.commitDraft(d);
  assert.equal(store.getDraft(), null);
  assert.equal(store.getDecision(d.id).status, "decided");
  assert.ok(store.getDecision(d.id).decidedAt > 0);
});

test("deleteDecision removes and clears draft pointer when needed", () => {
  const store = createStore(memStorage());
  const d = store.startDraft();
  store.deleteDecision(d.id);
  assert.equal(store.state.decisions.length, 0);
  assert.equal(store.state.draftId, null);
});

test("saveReview marks decision reviewed", () => {
  const store = createStore(memStorage());
  const d = store.startDraft();
  store.commitDraft(d);
  store.saveReview(d.id, { outcome: "good", process: "good", lesson: "trust triage" });
  const saved = store.getDecision(d.id);
  assert.equal(saved.status, "reviewed");
  assert.equal(saved.review.outcome, "good");
  assert.ok(saved.review.reviewedAt > 0);
});

test("export/import roundtrip preserves state; bad imports throw", () => {
  const store = createStore(memStorage());
  const d = store.startDraft();
  d.title = "Roundtrip";
  store.upsertDecision(d);

  const other = createStore(memStorage());
  other.importJSON(store.exportJSON());
  assert.equal(other.state.decisions[0].title, "Roundtrip");

  assert.throws(() => other.importJSON("[]"), /Not a BetterDecisions export/);
  assert.throws(() => other.importJSON("{"), SyntaxError);
  // failed import must not clobber existing state
  assert.equal(other.state.decisions[0].title, "Roundtrip");
});

test("clearAll wipes state and storage", () => {
  const storage = memStorage();
  const store = createStore(storage);
  store.startDraft();
  store.clearAll();
  assert.deepEqual(store.state, emptyState());
  assert.equal(storage.getItem("betterdecisions.v1"), null);
});

test("subscribe notifies on changes", () => {
  const store = createStore(memStorage());
  let calls = 0;
  const off = store.subscribe(() => calls++);
  store.startDraft();
  assert.ok(calls >= 1);
  off();
  const before = calls;
  store.startDraft();
  assert.equal(calls, before);
});

/* ------------------------------------------------ pure logic */

test("checkinVerdict flags HALT stacking and high intensity", () => {
  assert.equal(checkinVerdict({ halt: [], emotion: "calm", intensity: 2 }).ok, true);
  assert.equal(checkinVerdict({ halt: ["Hungry", "Tired"], intensity: 1 }).ok, false);
  assert.equal(checkinVerdict({ halt: [], intensity: 4 }).ok, false);
  assert.equal(checkinVerdict({ halt: ["Tired"], intensity: 3 }).ok, true);
  assert.equal(checkinVerdict(null).ok, true);
});

test("triage: reversible low/medium stakes fast-track; everything else full", () => {
  assert.equal(triageRecommendation(true, "low"), "fast");
  assert.equal(triageRecommendation(true, "medium"), "fast");
  assert.equal(triageRecommendation(true, "high"), "full");
  assert.equal(triageRecommendation(false, "low"), "full");
  assert.equal(triageRecommendation(null, "low"), "full");
});

test("valuesFitScore averages only rated values", () => {
  assert.equal(valuesFitScore(null), null);
  assert.equal(valuesFitScore({}), null);
  assert.equal(valuesFitScore({ Growth: 4, Freedom: 5 }), 4.5);
  assert.equal(valuesFitScore({ Growth: 4, Freedom: 0 }), 4); // unrated (0) ignored
  assert.equal(valuesFitScore({ Growth: 1, Freedom: 2, Health: 2 }), 1.7);
});

test("rankOptionsByValues sorts best-first, unrated last, stable ties", () => {
  const notes = [
    { fit: { Growth: 2 } },
    { fit: { Growth: 5 } },
    { fit: {} },
    { fit: { Growth: 2 } },
  ];
  assert.deepEqual(rankOptionsByValues(notes), [1, 0, 3, 2]);
  assert.deepEqual(rankOptionsByValues([]), []);
});

test("isReviewDue only fires for decided decisions with past/today dates", () => {
  const base = newDecision();
  const today = new Date(2026, 6, 15);
  assert.equal(isReviewDue({ ...base, status: "decided", reviewOn: "2026-07-15" }, today), true);
  assert.equal(isReviewDue({ ...base, status: "decided", reviewOn: "2026-07-01" }, today), true);
  assert.equal(isReviewDue({ ...base, status: "decided", reviewOn: "2026-08-01" }, today), false);
  assert.equal(isReviewDue({ ...base, status: "reviewed", reviewOn: "2026-07-01" }, today), false);
  assert.equal(isReviewDue({ ...base, status: "decided", reviewOn: "" }, today), false);
  assert.equal(isReviewDue({ ...base, status: "decided", reviewOn: "garbage" }, today), false);
});

test("defaultReviewDate is ~30 days out in yyyy-mm-dd", () => {
  const d = defaultReviewDate(new Date(2026, 0, 1));
  assert.equal(d, "2026-01-31");
  assert.match(defaultReviewDate(), /^\d{4}-\d{2}-\d{2}$/);
});

test("calibration needs 3 reviews, then compares confidence to outcomes", () => {
  const mk = (confidence, outcome) => ({
    status: "reviewed",
    confidence,
    review: { outcome, process: "good" },
  });
  assert.equal(calibration([mk(80, "good"), mk(80, "good")]), null);
  const c = calibration([mk(90, "good"), mk(80, "bad"), mk(70, "bad"), mk(60, "good")]);
  assert.equal(c.count, 4);
  assert.equal(c.avgConfidence, 75);
  assert.equal(c.goodShare, 50);
  assert.equal(c.gap, 25);
});

test("resultingWarning fires only when outcome and process disagree", () => {
  assert.equal(resultingWarning(null), null);
  assert.equal(resultingWarning({ outcome: "good", process: "good" }), null);
  assert.match(resultingWarning({ outcome: "good", process: "poor" }), /luck/);
  assert.match(resultingWarning({ outcome: "bad", process: "good" }), /variance/);
  assert.equal(resultingWarning({ outcome: "bad", process: "poor" }), null);
});

test("compileBrief assembles the narrative from wizard answers", () => {
  const d = newDecision();
  d.checkin = { halt: [], emotion: "anxious", intensity: 4 };
  d.options = ["Take the job", "Stay put"];
  d.reversible = false;
  d.stakes = "high";
  d.values = ["Growth"];
  d.optionNotes = [
    { pain: "imposter syndrome for a year", fit: { Growth: 5 } },
    { pain: "", fit: { Growth: 2 } },
  ];
  d.frameworks = { "regret-minimization": "At 80 I'd regret not trying.", "premortem": "  " };
  d.courage = { noJudgement: "", pleasing: true, confidentSelf: "take it and ask for help early" };
  d.gut = { done: true, result: "Take the job", feeling: "relieved" };

  const brief = compileBrief(d, FRAMEWORKS);
  assert.match(brief, /feeling anxious \(intensity 4\/5\)/);
  assert.match(brief, /One-way door with high stakes\./);
  assert.match(brief, /Values on the table: Growth\./);
  assert.match(brief, /Option "Take the job": values fit 5\/5; the pain: imposter syndrome for a year\./);
  assert.match(brief, /Regret minimization: At 80 I'd regret not trying\./);
  assert.ok(!brief.includes("Premortem"), "blank framework answers are skipped");
  assert.match(brief, /not disappointing someone/);
  assert.match(brief, /confident version of me would: take it and ask for help early/);
  assert.match(brief, /coin said "Take the job" and I felt relieved/);

  assert.equal(compileBrief(newDecision(), FRAMEWORKS), "");
});

/* ------------------------------------------------ content integrity */

test("quoteOfTheDay is deterministic per day and cycles the catalog", () => {
  const a = quoteOfTheDay(new Date(2026, 6, 11));
  const b = quoteOfTheDay(new Date(2026, 6, 11));
  assert.deepEqual(a, b);
  assert.ok(QUOTES.includes(a));
  const days = [];
  for (let i = 1; i <= QUOTES.length; i++) days.push(quoteOfTheDay(new Date(2026, 0, i)).text);
  assert.equal(new Set(days).size, QUOTES.length, "consecutive days walk the whole catalog");
});

test("content is complete: five mentors, books on Ali, frameworks resolve", () => {
  assert.equal(MENTORS.length, 5);
  const ids = MENTORS.map((m) => m.id);
  for (const id of ["drk", "ali", "bigthink", "manson", "charlie"]) assert.ok(ids.includes(id), id);
  assert.ok(mentorById("ali").books.length >= 8, "Ali's bookshelf is stocked");
  assert.equal(mentorById("nope"), null);
  for (const m of MENTORS) assert.ok(m.principles.length >= 5, `${m.name} has principles`);
  for (const f of FRAMEWORKS) {
    assert.ok(f.question.length > 10, `${f.id} has a question`);
    assert.ok(mentorById(f.mentorId), `${f.id} maps to a real mentor`);
    assert.equal(frameworkById(f.id), f);
  }
});
