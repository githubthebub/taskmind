import { el } from "../ui.js";
import { MENTORS, FRAMEWORKS } from "../data/content.js";

export function mentorsView() {
  return el(
    "div",
    {},
    el("h1", {}, "The mentors"),
    el(
      "p",
      { class: "lede" },
      "Five schools of thought, one decision. Each lens catches what the others miss: " +
        "awareness catches compulsion, triage catches over-thinking, models catch bias, " +
        "values catch drift, and courage catches fear dressed up as prudence."
    ),
    MENTORS.map((m) =>
      el(
        "section",
        { class: "card mentor-card", style: { borderTopColor: m.color, marginTop: "1rem" } },
        el("h3", {}, m.name),
        el("p", { class: "mentor-role" }, `${m.role} · wizard step: ${m.wizardStep}`),
        el("p", { class: "small", style: { color: m.color, fontWeight: "600" } }, m.lens),
        el("ul", {}, m.principles.map((p) => el("li", {}, p))),
        m.books
          ? [
              el("h4", { class: "section-title", style: { margin: "1.2rem 0 0.2rem" } }, "From Ali's bookshelf"),
              el(
                "ul",
                { class: "book-list" },
                m.books.map((b) =>
                  el(
                    "li",
                    {},
                    el("span", { class: "book-title" }, b.title),
                    el("span", { class: "muted" }, ` — ${b.author}`),
                    el("span", { class: "book-note" }, b.note)
                  )
                )
              ),
            ]
          : null
      )
    ),
    el("h2", { class: "section-title" }, "The frameworks"),
    el(
      "div",
      { class: "card-grid" },
      FRAMEWORKS.map((f) =>
        el(
          "div",
          { class: "card fw-card" },
          el("h3", {}, f.name),
          el("p", { class: "fw-source" }, f.source),
          el("p", { class: "fw-question" }, f.question),
          el("p", { class: "small muted" }, f.hint)
        )
      )
    )
  );
}
