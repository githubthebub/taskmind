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

test("adoptDraft persists lazily-created drafts and ignores non-drafts", () => {
  const storage = memStorage();
  const store = createStore(storage);

  const d = newDecision();
  assert.equal(storage.getItem("betterdecisions.v1"), null, "nothing persisted before adoption");
  store.adoptDraft(d);
  assert.equal(store.getDraft().id, d.id);
  assert.equal(createStore(storage).getDraft().id, d.id, "adopted draft survives reload");

  // adopting twice must not duplicate
  store.adoptDraft(d);
  assert.equal(store.state.decisions.length, 1);

  // a committed decision can't be resurrected as the draft pointer
  store.commitDraft(d);
  store.adoptDraft(d);
  assert.equal(store.getDraft(), null);
});

test("reload re-reads state written by another tab", () => {
  const storage = memStorage();
  const a = createStore(storage);
  const b = createStore(storage);
  const d = b.startDraft();
  d.title = "written by tab B";
  b.commitDraft(d);
  assert.equal(a.state.decisions.length, 0, "tab A is stale before reload");
  a.reload();
  assert.equal(a.state.decisions[0].title, "written by tab B");
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

test("valuesFitScore ignores ratings for values no longer on the table", () => {
  // user rated Growth 5, then deselected Growth and picked Family (rated 1)
  assert.equal(valuesFitScore({ Growth: 5, Family: 1 }, ["Family"]), 1);
  assert.equal(valuesFitScore({ Growth: 5 }, ["Family"]), null);
  assert.equal(valuesFitScore({ Growth: 5, Family: 1 }, null), 3); // no filter → all count
  assert.deepEqual(rankOptionsByValues([{ fit: { Old: 5, New: 1 } }, { fit: { New: 4 } }], ["New"]), [1, 0]);
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
  // calendar arithmetic: a window crossing the DST fall-back must still be 30 days
  assert.equal(defaultReviewDate(new Date(2026, 9, 20, 0, 30)), "2026-11-19");
});

test("defaultReviewDate honours a sooner future deadline", () => {
  const now = new Date(2026, 6, 11);
  assert.equal(defaultReviewDate(now, "2026-07-20"), "2026-07-20", "sooner deadline wins");
  assert.equal(defaultReviewDate(now, "2026-09-01"), "2026-08-10", "later deadline ignored");
  assert.equal(defaultReviewDate(now, "2026-07-01"), "2026-08-10", "past deadline ignored");
  assert.equal(defaultReviewDate(now, "2026-07-11"), "2026-08-10", "today is not 'in the future'");
  assert.equal(defaultReviewDate(now, "garbage"), "2026-08-10", "unparseable deadline ignored");
  assert.equal(defaultReviewDate(now, ""), "2026-08-10");
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

test("compileBrief keeps option/notes pairing when a middle option is blanked", () => {
  const d = newDecision();
  d.options = ["Take the job", "", "Move abroad"];
  d.values = ["Growth"];
  d.optionNotes = [
    { pain: "pain one", fit: { Growth: 5 } },
    { pain: "old pain from cleared option", fit: { Growth: 1 } },
    { pain: "pain three", fit: { Growth: 4 } },
  ];
  const brief = compileBrief(d, FRAMEWORKS);
  assert.match(brief, /Option "Move abroad": values fit 4\/5; the pain: pain three\./);
  assert.ok(!brief.includes("old pain from cleared option"), "blank option's note is dropped");
});

test("compileBrief excludes ratings from deselected values and doesn't double-punctuate", () => {
  const d = newDecision();
  d.options = ["Stay"];
  d.values = ["Family"];
  d.optionNotes = [{ pain: "Ends with a period.", fit: { Growth: 5, Family: 1 } }];
  const brief = compileBrief(d, FRAMEWORKS);
  assert.match(brief, /values fit 1\/5/);
  assert.match(brief, /the pain: Ends with a period\.$/m);
  assert.ok(!brief.includes(".."), "no double punctuation");
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

test("content is complete: five voices, reading directions, frameworks resolve", () => {
  assert.equal(MENTORS.length, 5);
  const ids = MENTORS.map((m) => m.id);
  for (const id of ["steady", "experimenter", "strategist", "realist", "confidant"]) assert.ok(ids.includes(id), id);
  assert.ok(mentorById("experimenter").readingDirections.length >= 3, "the experimenter voice has reading directions");
  assert.equal(mentorById("nope"), null);
  for (const m of MENTORS) assert.ok(m.principles.length >= 5, `${m.name} has principles`);
  for (const f of FRAMEWORKS) {
    assert.ok(f.question.length > 10, `${f.id} has a question`);
    assert.ok(mentorById(f.mentorId), `${f.id} maps to a real voice`);
    assert.equal(frameworkById(f.id), f);
  }
});

test("content contains no real named individuals or brands", () => {
  const banned = [
    /ali abdaal/i, /mark manson/i, /\bdr\.?\s?k\b/i, /healthygamergg/i,
    /charlie houpert/i, /charisma on command/i, /big\s?think/i, /annie duke/i,
    /kahneman/i, /munger/i, /gary klein/i, /howard marks/i, /suzy welch/i,
    /jeff bezos/i, /tim ferriss/i, /oliver burkeman/i, /greg mckeown/i,
    /james clear/i, /naval ravikant/i, /derek sivers/i, /cal newport/i,
    /morgan housel/i,
  ];
  const haystacks = [
    JSON.stringify(MENTORS), JSON.stringify(FRAMEWORKS), JSON.stringify(QUOTES),
  ];
  for (const text of haystacks) {
    for (const re of banned) {
      assert.ok(!re.test(text), `content should not mention ${re}`);
    }
  }
});
