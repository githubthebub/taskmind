import { el, fmtDate, toast } from "../ui.js";
import { FRAMEWORKS } from "../data/content.js";
import { isReviewDue, calibration, resultingWarning, compileBrief } from "../store.js";

/* ------------------------------------------------------------------ *
 * Journal list
 * ------------------------------------------------------------------ */

export function journalView(ctx) {
  const { store } = ctx;
  const decisions = store.state.decisions;
  const calib = calibration(decisions);

  const children = [
    el("h1", {}, "Decision journal"),
    el(
      "p",
      { class: "lede" },
      "Annie Duke's habit, borrowed: write the bet down, then come back and grade the process — " +
        "not just the outcome. A good decision can lose; a bad one can win. The journal is how you tell the difference."
    ),
  ];

  if (calib) {
    children.push(
      el(
        "div",
        { class: "card accent-left", style: { margin: "1rem 0" } },
        el("h3", {}, "Calibration"),
        el(
          "p",
          { class: "small muted" },
          `Across ${calib.count} reviewed decisions you were ${calib.avgConfidence}% confident on average, ` +
            `and ${calib.goodShare}% turned out well.`
        ),
        calibBar("Stated confidence", calib.avgConfidence),
        calibBar("Good outcomes", calib.goodShare),
        el(
          "p",
          { class: "small", style: { marginTop: "0.5rem" } },
          calib.gap > 15
            ? "You may be overconfident — consider shading your bets down."
            : calib.gap < -15
              ? "You may be underconfident — your process is better than you give it credit for."
              : "Nicely calibrated. Keep betting."
        )
      )
    );
  }

  if (!decisions.length) {
    children.push(
      el(
        "div",
        { class: "empty-state" },
        el("p", {}, "No decisions yet."),
        el("a", { class: "btn primary", href: "#/new", style: { marginTop: "0.6rem" } }, "Make your first decision")
      )
    );
  } else {
    const groups = [
      ["Drafts in progress", decisions.filter((d) => d.status === "draft")],
      ["Awaiting review", decisions.filter((d) => d.status === "decided")],
      ["Reviewed", decisions.filter((d) => d.status === "reviewed")],
    ];
    for (const [label, list] of groups) {
      if (!list.length) continue;
      children.push(el("h2", { class: "section-title" }, label));
      children.push(el("div", {}, list.map((d) => decisionCard(d))));
    }
  }

  return el("div", {}, children);
}

function calibBar(label, pct) {
  return el(
    "div",
    {},
    el("div", { class: "faint" }, `${label}: ${pct}%`),
    el("div", { class: "calib-bar" }, el("span", { style: { width: `${Math.max(0, Math.min(100, pct))}%` } }))
  );
}

function decisionCard(d) {
  const badge =
    d.status === "draft"
      ? el("span", { class: "badge draft" }, "draft")
      : d.status === "reviewed"
        ? el("span", { class: `badge ${d.review?.outcome || "reviewed"}` }, d.review?.outcome ? `went ${d.review.outcome}` : "reviewed")
        : isReviewDue(d)
          ? el("span", { class: "badge review-due" }, "review due")
          : el("span", { class: "badge decided" }, "decided");

  const chosen = d.chosenIndex !== null && d.options?.[d.chosenIndex] ? d.options[d.chosenIndex] : null;
  const meta = [];
  if (chosen) meta.push(`chose “${chosen}” at ${d.confidence}% confidence`);
  if (d.status === "decided" && d.reviewOn) meta.push(`review ${fmtDate(d.reviewOn)}`);
  if (d.status === "draft") meta.push("pick up where you left off");

  return el(
    "a",
    { class: "card decision-card", href: d.status === "draft" ? "#/new" : `#/decision/${d.id}` },
    el("div", { class: "dc-head" }, el("h3", {}, d.title || "Untitled decision"), badge),
    meta.length ? el("p", { class: "meta-line" }, meta.join(" · ")) : null
  );
}

/* ------------------------------------------------------------------ *
 * Decision detail
 * ------------------------------------------------------------------ */

export function decisionDetailView(ctx, { id }) {
  const { store, router } = ctx;
  const d = store.getDecision(id);
  if (!d) {
    return el(
      "div",
      { class: "empty-state" },
      el("p", {}, "That decision doesn't exist (or was deleted)."),
      el("a", { class: "btn", href: "#/journal" }, "Back to journal")
    );
  }

  const chosen = d.chosenIndex !== null ? d.options?.[d.chosenIndex] : null;
  const brief = compileBrief(d, FRAMEWORKS);
  const warning = resultingWarning(d.review);

  const children = [
    el("a", { class: "faint", href: "#/journal" }, "← Journal"),
    el("h1", { style: { marginTop: "0.5rem" } }, d.title || "Untitled decision"),
    d.detail ? el("p", { class: "lede" }, d.detail) : null,
    el(
      "div",
      { class: "card accent-left" },
      el("h3", {}, chosen ? `Decision: ${chosen}` : "No option chosen"),
      el("p", { class: "muted small" }, `Confidence at the time: ${d.confidence}% · decided ${fmtDate(d.decidedAt || d.updatedAt)}` + (d.reviewOn ? ` · review ${fmtDate(d.reviewOn)}` : "")),
      d.rationale ? el("p", { style: { whiteSpace: "pre-wrap" } }, d.rationale) : null
    ),
  ];

  if (brief) {
    children.push(
      el(
        "div",
        { class: "card" },
        el("h3", {}, "The thinking that went in"),
        el("p", { class: "small muted", style: { whiteSpace: "pre-wrap" } }, brief)
      )
    );
  }

  if (d.review) {
    children.push(
      el(
        "div",
        { class: "card" },
        el("h3", {}, "Review"),
        el(
          "p",
          { class: "small" },
          el("span", { class: `badge ${d.review.outcome}` }, `outcome: ${d.review.outcome}`),
          " ",
          el("span", { class: `badge ${d.review.process === "good" ? "good" : d.review.process === "ok" ? "mixed" : "bad"}` }, `process: ${d.review.process}`)
        ),
        warning ? el("div", { class: "callout warn" }, warning) : null,
        d.review.lesson ? el("p", { style: { whiteSpace: "pre-wrap" } }, d.review.lesson) : null,
        el("p", { class: "faint" }, `Reviewed ${fmtDate(d.review.reviewedAt)}`)
      )
    );
  } else if (d.status === "decided") {
    children.push(
      el(
        "div",
        { class: isReviewDue(d) ? "callout warn" : "callout info" },
        isReviewDue(d)
          ? "This decision is due for its honest look back."
          : `Review scheduled for ${fmtDate(d.reviewOn) || "later"} — you can review early if the outcome is already clear.`,
        " ",
        el("a", { href: `#/review/${d.id}` }, "Review it now")
      )
    );
  }

  children.push(
    el(
      "div",
      { class: "btn-row" },
      el("button", {
        class: "btn danger small",
        type: "button",
        onClick: () => {
          if (confirm("Delete this decision permanently?")) {
            store.deleteDecision(d.id);
            toast("Decision deleted.");
            router.go("/journal");
          }
        },
      }, "Delete")
    )
  );

  return el("div", {}, children);
}

/* ------------------------------------------------------------------ *
 * Review flow — grade the process, not just the outcome
 * ------------------------------------------------------------------ */

export function reviewView(ctx, { id }) {
  const { store, router } = ctx;
  const d = store.getDecision(id);
  if (!d || d.status === "draft") {
    return el(
      "div",
      { class: "empty-state" },
      el("p", {}, "Nothing to review here."),
      el("a", { class: "btn", href: "#/journal" }, "Back to journal")
    );
  }

  const review = { outcome: d.review?.outcome || null, process: d.review?.process || null, lesson: d.review?.lesson || "" };
  const chosen = d.chosenIndex !== null ? d.options?.[d.chosenIndex] : null;

  const outcomeList = choiceGroup(
    [
      ["good", "It went well", "The result is one I'm glad about."],
      ["mixed", "Mixed", "Some of it worked, some didn't."],
      ["bad", "It went badly", "Knowing only the result, I'd want it back."],
    ],
    review.outcome,
    (v) => (review.outcome = v)
  );

  const processList = choiceGroup(
    [
      ["good", "Good process", "Given what I knew then, I'd decide the same way again."],
      ["ok", "Okay process", "I thought about it, but skipped steps I shouldn't have."],
      ["poor", "Poor process", "Honestly, I decided on impulse, fear, or someone else's approval."],
    ],
    review.process,
    (v) => (review.process = v)
  );

  const lessonInput = el("textarea", {
    placeholder: "What did this decision teach you about how you decide?",
    "aria-label": "Lesson learned",
    onInput: (e) => (review.lesson = e.target.value),
  }, review.lesson);

  const saveBtn = el("button", {
    class: "btn primary",
    type: "button",
    onClick: () => {
      if (!review.outcome || !review.process) {
        toast("Rate both the outcome and the process first.");
        return;
      }
      store.saveReview(d.id, review);
      toast("Review saved. That's how calibration is built.");
      router.go(`/decision/${d.id}`);
    },
  }, "Save review");

  return el(
    "div",
    {},
    el("a", { class: "faint", href: `#/decision/${d.id}` }, "← Back to decision"),
    el("h1", { style: { marginTop: "0.5rem" } }, "The honest look back"),
    el(
      "p",
      { class: "lede" },
      `You chose ${chosen ? `“${chosen}”` : "an option"} at ${d.confidence}% confidence. ` +
        "Now grade the two things separately — Annie Duke's rule: outcomes are what happened, process is what you controlled."
    ),
    el("div", { class: "card" },
      el("h3", {}, "1 · The outcome"),
      el("p", { class: "field-hint" }, "Just the result, luck included."),
      outcomeList,
      el("h3", { style: { marginTop: "1.4rem" } }, "2 · The process"),
      el("p", { class: "field-hint" }, "Only what you knew and did at the time. Hindsight doesn't get a vote."),
      processList,
      el("h3", { style: { marginTop: "1.4rem" } }, "3 · The lesson"),
      lessonInput,
      el("div", { class: "btn-row" }, saveBtn)
    )
  );
}

function choiceGroup(items, current, onPick) {
  const wrap = el("div", { class: "choice-list", role: "group" });
  for (const [value, title, sub] of items) {
    const btn = el(
      "button",
      {
        type: "button",
        class: "choice-card",
        "aria-pressed": String(current === value),
        onClick: () => {
          onPick(value);
          [...wrap.children].forEach((c) => c.setAttribute("aria-pressed", "false"));
          btn.setAttribute("aria-pressed", "true");
        },
      },
      el("div", { class: "choice-title" }, title),
      el("div", { class: "choice-sub" }, sub)
    );
    wrap.append(btn);
  }
  return wrap;
}
