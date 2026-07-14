import { el } from "../ui.js";
import { quoteOfTheDay, MENTORS } from "../data/content.js";
import { isReviewDue, calibration } from "../store.js";

export function homeView(ctx) {
  const { store } = ctx;
  const decisions = store.state.decisions;
  const draft = store.getDraft();
  const decided = decisions.filter((d) => d.status === "decided");
  const reviewed = decisions.filter((d) => d.status === "reviewed");
  const due = decided.filter((d) => isReviewDue(d));
  const quote = quoteOfTheDay();
  const calib = calibration(decisions);

  const hero = el(
    "section",
    { class: "hero" },
    el("h1", {}, "Decide like your smartest mentors are in the room."),
    el(
      "p",
      { class: "lede" },
      "BetterDecisions walks any choice through five voices — an emotional check-in, " +
        "an energy-and-experiments triage, a set of mental models, a values test, " +
        "and a courage check — then holds you to an honest review."
    ),
    el(
      "div",
      { class: "btn-row" },
      el("a", { class: "btn primary", href: "#/new" }, draft ? "Resume your decision" : "Start a decision"),
      el("a", { class: "btn ghost", href: "#/gut-check" }, "Quick gut check"),
      el("a", { class: "btn ghost", href: "#/mentors" }, "Meet the mentors")
    )
  );

  const quoteCard = el(
    "aside",
    { class: "quote-card" },
    el("blockquote", {}, `“${quote.text}”`),
    el("cite", {}, `— ${quote.who}`)
  );

  const stats = el(
    "div",
    { class: "stat-row" },
    stat(decided.length + reviewed.length, "decisions made"),
    stat(due.length, "reviews due"),
    stat(reviewed.length, "reviewed"),
    calib
      ? stat(`${calib.avgConfidence}% / ${calib.goodShare}%`, "confidence vs. good outcomes")
      : stat("—", "calibration (needs 3 reviews)")
  );

  const children = [hero, quoteCard, stats];

  if (due.length) {
    children.push(el("h2", { class: "section-title" }, "Due for review"));
    children.push(
      el(
        "div",
        {},
        due.slice(0, 3).map((d) =>
          el(
            "a",
            { class: "card decision-card accent-left", href: `#/decision/${d.id}` },
            el("div", { class: "dc-head" }, el("h3", {}, d.title || "Untitled decision"), el("span", { class: "badge review-due" }, "review due")),
            el("p", { class: "meta-line" }, "You promised yourself an honest look back. Judge the process, not just the outcome.")
          )
        )
      )
    );
  }

  children.push(el("h2", { class: "section-title" }, "The five lenses"));
  children.push(
    el(
      "div",
      { class: "card-grid" },
      MENTORS.map((m) =>
        el(
          "div",
          { class: "card mentor-card", style: { borderTopColor: m.color } },
          el("h3", {}, m.name),
          el("p", { class: "mentor-role" }, m.lens),
          el("p", { class: "small muted" }, m.principles[0])
        )
      )
    )
  );

  return el("div", {}, children);
}

function stat(value, label) {
  return el(
    "div",
    { class: "stat" },
    el("div", { class: "stat-value" }, String(value)),
    el("div", { class: "stat-label" }, label)
  );
}
