import { el, toast, chip, ratingRow } from "../ui.js";
import { VALUES, FRAMEWORKS } from "../data/content.js";
import {
  checkinVerdict,
  triageRecommendation,
  valuesFitScore,
  defaultReviewDate,
  compileBrief,
} from "../store.js";

const HALT = ["Hungry", "Angry", "Lonely", "Tired"];

const STEPS = [
  { key: "checkin", label: "Check in", mentor: "Dr. K · HealthyGamerGG", color: "var(--c-drk)" },
  { key: "frame", label: "Frame it", mentor: "You", color: "var(--accent)" },
  { key: "triage", label: "Triage", mentor: "Ali Abdaal", color: "var(--c-ali)" },
  { key: "values", label: "Values", mentor: "Mark Manson", color: "var(--c-manson)" },
  { key: "models", label: "Think it through", mentor: "Big Think & the bookshelf", color: "var(--c-bigthink)" },
  { key: "courage", label: "Courage check", mentor: "Charlie · Charisma on Command", color: "var(--c-charlie)" },
  { key: "gut", label: "Gut check", mentor: "Dr. K · HealthyGamerGG", color: "var(--c-drk)" },
  { key: "decide", label: "Decide", mentor: "Annie Duke's bet", color: "var(--accent)" },
];

export function wizardView(ctx) {
  const { store, router } = ctx;
  let draft = store.getDraft();
  if (!draft) draft = store.startDraft();
  if (typeof draft.step !== "number") draft.step = 0;

  const root = el("div", {});
  const progress = el("div", { class: "wizard-progress", "aria-hidden": "true" });
  const stage = el("div", {});
  root.append(progress, stage);

  function save() {
    store.upsertDecision(draft);
  }

  function syncOptionNotes() {
    draft.optionNotes = draft.options.map((_, i) => draft.optionNotes[i] || { pain: "", fit: {} });
  }

  function goStep(n) {
    draft.step = Math.max(0, Math.min(STEPS.length - 1, n));
    save();
    renderStep();
    window.scrollTo({ top: 0 });
  }

  function renderProgress() {
    progress.replaceChildren(
      ...STEPS.map((s, i) =>
        el("div", {
          class: `step-dot${i < draft.step ? " done" : i === draft.step ? " current" : ""}`,
          title: s.label,
        })
      )
    );
  }

  function header(step) {
    return [
      el(
        "span",
        { class: "step-eyebrow", style: { background: "var(--panel-2)", color: step.color } },
        `Step ${draft.step + 1} of ${STEPS.length} — ${step.label}`
      ),
      el("p", { class: "mentor-tag" }, `Lens: ${step.mentor}`),
    ];
  }

  function navRow({ backTo = draft.step - 1, next = null, nextLabel = "Next" } = {}) {
    return el(
      "div",
      { class: "btn-row" },
      draft.step > 0
        ? el("button", { class: "btn ghost", type: "button", onClick: () => goStep(backTo) }, "Back")
        : null,
      el("span", { class: "spacer" }),
      el("button", {
        class: "btn subtle",
        type: "button",
        onClick: () => {
          save();
          toast("Draft saved.");
          router.go("/journal");
        },
      }, "Save & exit"),
      el("button", {
        class: "btn subtle danger",
        type: "button",
        onClick: () => {
          if (confirm("Discard this decision draft?")) {
            store.discardDraft();
            router.go("/");
          }
        },
      }, "Discard"),
      next
        ? el("button", { class: "btn primary", type: "button", onClick: next }, nextLabel)
        : null
    );
  }

  /* -------------------------------------------------- step 0: check in */

  function stepCheckin() {
    const step = STEPS[0];
    const verdictBox = el("div", {});

    function refreshVerdict() {
      const v = checkinVerdict(draft.checkin);
      verdictBox.replaceChildren(
        v.ok
          ? el("div", { class: "callout good" },
              "Clear enough to think. Decisions made from a steady baseline are the only ones your future self co-signs.")
          : el(
              "div",
              { class: "callout warn" },
              el("strong", {}, "Dr. K would tell you to wait. "),
              `${v.reasons.join(" ")} Your mind will generate reasons for whatever it already wants — `,
              "handle the state first (eat, breathe, step outside, sleep on it), then come back. ",
              "The draft will be saved right here. If it truly can't wait, at least take ten slow breaths before the next step."
            )
      );
    }

    const emotionInput = el("input", {
      type: "text",
      id: "emotion",
      placeholder: "e.g. anxious, excited, resentful, torn…",
      value: draft.checkin.emotion,
      onInput: (e) => (draft.checkin.emotion = e.target.value),
    });

    const slider = el("input", {
      type: "range", min: "1", max: "5", step: "1",
      value: String(draft.checkin.intensity),
      id: "intensity",
      onInput: (e) => {
        draft.checkin.intensity = Number(e.target.value);
        sliderLabel.textContent = intensityLabel(draft.checkin.intensity);
        refreshVerdict();
      },
    });
    const sliderLabel = el("span", { class: "muted small" }, intensityLabel(draft.checkin.intensity));

    const content = el(
      "div",
      { class: "card" },
      el("h1", {}, "Before the decision: check the decider"),
      el(
        "p",
        { class: "muted" },
        "Dr. K's rule: the state you decide in shapes what you decide. Sixty seconds of honesty now saves months of cleanup later."
      ),
      el("div", { class: "step-quote" },
        "“Your mind will happily generate reasons for whatever it already wants. Notice the want first.”",
        el("span", { class: "who" }, "— after Dr. K, HealthyGamerGG")),
      el("label", { class: "field-label" }, "Any of these true right now? (HALT)"),
      el(
        "div",
        { class: "chip-row" },
        HALT.map((h) =>
          chip(h, draft.checkin.halt.includes(h), (pressed) => {
            draft.checkin.halt = pressed
              ? [...new Set([...draft.checkin.halt, h])]
              : draft.checkin.halt.filter((x) => x !== h);
            refreshVerdict();
          })
        )
      ),
      el("label", { class: "field-label", for: "emotion" }, "Name what you're feeling about this decision"),
      el("p", { class: "field-hint" }, "A feeling you can name is a feeling you can factor in. One or two words is plenty."),
      emotionInput,
      el("label", { class: "field-label", for: "intensity" }, "How loud is that feeling?"),
      slider,
      sliderLabel,
      verdictBox,
      navRow({ next: () => goStep(1) })
    );
    refreshVerdict();
    return [header(step), content];
  }

  function intensityLabel(n) {
    return ["", "1 — barely a whisper", "2 — background hum", "3 — noticeable", "4 — loud", "5 — running the show"][n];
  }

  /* -------------------------------------------------- step 1: frame it */

  function stepFrame() {
    const step = STEPS[1];
    const optionsWrap = el("div", {});

    function renderOptions() {
      optionsWrap.replaceChildren(
        ...draft.options.map((opt, i) =>
          el(
            "div",
            { class: "option-row" },
            el("input", {
              type: "text",
              value: opt,
              placeholder: i === 0 ? "e.g. Take the new job" : i === 1 ? "e.g. Stay and renegotiate" : "Another option…",
              "aria-label": `Option ${i + 1}`,
              onInput: (e) => (draft.options[i] = e.target.value),
            }),
            draft.options.length > 2
              ? el("button", {
                  class: "btn small ghost", type: "button", "aria-label": `Remove option ${i + 1}`,
                  onClick: () => {
                    draft.options.splice(i, 1);
                    draft.optionNotes.splice(i, 1);
                    if (draft.chosenIndex === i) draft.chosenIndex = null;
                    else if (draft.chosenIndex > i) draft.chosenIndex -= 1;
                    renderOptions();
                  },
                }, "✕")
              : null
          )
        ),
        draft.options.length < 5
          ? el("button", {
              class: "btn small ghost", type: "button",
              onClick: () => {
                draft.options.push("");
                syncOptionNotes();
                renderOptions();
              },
            }, "+ Add an option")
          : null
      );
    }
    renderOptions();

    const content = el(
      "div",
      { class: "card" },
      el("h1", {}, "What are you actually deciding?"),
      el(
        "p",
        { class: "muted" },
        "A decision you can't state in one sentence isn't ready to be made. And remember Manson's point: " +
          "“keep things as they are” is an option too — refusing to choose is choosing."
      ),
      el("label", { class: "field-label", for: "d-title" }, "The decision, in one sentence"),
      el("input", {
        type: "text", id: "d-title", value: draft.title,
        placeholder: "e.g. Do I take the Berlin job offer?",
        onInput: (e) => (draft.title = e.target.value),
      }),
      el("label", { class: "field-label", for: "d-detail" }, "Context (optional)"),
      el("textarea", {
        id: "d-detail",
        placeholder: "Anything your future self will need to understand why this was hard.",
        onInput: (e) => (draft.detail = e.target.value),
      }, draft.detail),
      el("label", { class: "field-label" }, "Your options (2–5)"),
      optionsWrap,
      el("label", { class: "field-label", for: "d-deadline" }, "Real deadline (optional)"),
      el("p", { class: "field-hint" }, "Parkinson's law applies to choices too — an open-ended decision expands to fill your whole head."),
      el("input", {
        type: "date", id: "d-deadline", value: draft.deadline,
        onInput: (e) => (draft.deadline = e.target.value),
      }),
      navRow({
        next: () => {
          const filled = draft.options.filter((o) => o.trim()).length;
          if (!draft.title.trim()) return toast("Give the decision a one-sentence title first.");
          if (filled < 2) return toast("You need at least two real options — even if one is “change nothing”.");
          syncOptionNotes();
          goStep(2);
        },
      })
    );
    return [header(step), content];
  }

  /* -------------------------------------------------- step 2: triage */

  function stepTriage() {
    const step = STEPS[2];
    const adviceBox = el("div", {});

    function refreshAdvice() {
      adviceBox.replaceChildren();
      if (draft.reversible === null || !draft.stakes) return;
      if (triageRecommendation(draft.reversible, draft.stakes) === "fast") {
        adviceBox.append(
          el(
            "div",
            { class: "callout good" },
            el("strong", {}, "This is a two-way door. "),
            "Ali's advice (borrowed from Bezos): walk through it. Reversible, modest-stakes choices are experiments, " +
              "not verdicts — the cost of deciding slowly is higher than the cost of deciding wrong. " +
              "Trust the gut, pick, and gather real data."
          ),
          el(
            "div",
            { class: "btn-row" },
            el("button", {
              class: "btn primary", type: "button",
              onClick: () => {
                draft.fastTracked = true;
                if (!draft.reviewOn) draft.reviewOn = defaultReviewDate();
                goStep(7);
              },
            }, "Fast-track: just decide"),
            el("button", {
              class: "btn ghost", type: "button",
              onClick: () => {
                draft.fastTracked = false;
                goStep(3);
              },
            }, "I still want the full walkthrough")
          )
        );
      } else {
        adviceBox.append(
          el(
            "div",
            { class: "callout info" },
            draft.reversible === false
              ? "One-way door — worth the full walkthrough. Slow is appropriate here; this is exactly the kind of choice the next five steps exist for."
              : "High stakes even if reversible — give it the full walkthrough."
          )
        );
      }
    }

    const content = el(
      "div",
      { class: "card" },
      el("h1", {}, "Is this a one-way door, or a two-way door?"),
      el(
        "p",
        { class: "muted" },
        "Ali Abdaal's most repeated decision advice: most choices are reversible experiments, and we burn " +
          "weeks treating them like verdicts. Sort this one before you spend another minute on it."
      ),
      el("div", { class: "step-quote" },
        "“Reduce the cost of failure instead of agonising over the odds of success.”",
        el("span", { class: "who" }, "— the experiment mindset, after Ali Abdaal")),
      el("label", { class: "field-label" }, "If this goes wrong, can you walk it back?"),
      pick(
        [
          [true, "Two-way door", "Mostly reversible — I could undo or adjust course without lasting damage."],
          [false, "One-way door", "Hard or impossible to reverse — quitting, ending, signing, telling."],
        ],
        draft.reversible,
        (v) => {
          draft.reversible = v;
          refreshAdvice();
        }
      ),
      el("label", { class: "field-label" }, "How big are the stakes, honestly?"),
      pick(
        [
          ["low", "Low", "A month from now this barely registers."],
          ["medium", "Medium", "Real consequences, but survivable either way."],
          ["high", "High", "This shapes years — money, health, people I love."],
        ],
        draft.stakes,
        (v) => {
          draft.stakes = v;
          refreshAdvice();
        }
      ),
      adviceBox,
      navRow({
        next: () => {
          if (draft.reversible === null || !draft.stakes) return toast("Answer both questions — the triage is the point.");
          draft.fastTracked = false;
          goStep(3);
        },
      })
    );
    refreshAdvice();
    return [header(step), content];
  }

  /* -------------------------------------------------- step 3: values */

  function stepValues() {
    const step = STEPS[3];
    syncOptionNotes();
    const optionCardsWrap = el("div", {});
    const chipsWrap = el("div", { class: "chip-row" });

    function renderChips() {
      const all = [...new Set([...VALUES, ...draft.values])];
      chipsWrap.replaceChildren(
        ...all.map((v) =>
          chip(v, draft.values.includes(v), (pressed) => {
            if (pressed) {
              if (draft.values.length >= 3) {
                toast("Three values maximum — the limit is the exercise.");
                renderChips();
                return;
              }
              draft.values = [...draft.values, v];
            } else {
              draft.values = draft.values.filter((x) => x !== v);
            }
            renderChips();
            renderOptionCards();
          })
        )
      );
    }

    const customInput = el("input", {
      type: "text", placeholder: "Add your own value…", "aria-label": "Add a custom value",
      style: { maxWidth: "16rem" },
      onKeydown: (e) => {
        if (e.key === "Enter") { e.preventDefault(); addCustom(); }
      },
    });
    function addCustom() {
      const v = customInput.value.trim();
      if (!v) return;
      if (draft.values.length >= 3) return toast("Three values maximum — the limit is the exercise.");
      if (!draft.values.includes(v)) draft.values = [...draft.values, v];
      customInput.value = "";
      renderChips();
      renderOptionCards();
    }

    function renderOptionCards() {
      optionCardsWrap.replaceChildren();
      if (!draft.values.length) return;
      draft.options.forEach((opt, i) => {
        if (!opt.trim()) return;
        const note = draft.optionNotes[i];
        optionCardsWrap.append(
          el(
            "div",
            { class: "card", style: { marginTop: "0.8rem" } },
            el("h3", {}, opt),
            el("label", { class: "field-label" }, "What's the pain that comes bundled with this option?"),
            el("p", { class: "field-hint" }, "Every option is a package deal. Name the struggle you'd be signing up for."),
            el("textarea", {
              placeholder: "e.g. Two years of being the least experienced person in the room…",
              "aria-label": `The pain of option: ${opt}`,
              onInput: (e) => (note.pain = e.target.value),
            }, note.pain),
            draft.values.map((v) =>
              el(
                "div",
                { style: { display: "flex", alignItems: "center", gap: "0.8rem", margin: "0.55rem 0", flexWrap: "wrap" } },
                el("span", { class: "small", style: { minWidth: "9rem" } }, `Serves “${v}”?`),
                ratingRow(note.fit[v] || 0, (n) => (note.fit[v] = n), `How well “${opt}” serves ${v}`)
              )
            )
          )
        );
      });
    }

    renderChips();
    renderOptionCards();

    const content = el(
      "div",
      { class: "card" },
      el("h1", {}, "What is this choice in service of?"),
      el(
        "p",
        { class: "muted" },
        "Mark Manson's test: good values are chosen, honest, and in your control — growth, courage, craft. " +
          "Bad values outsource your worth — status, approval, comfort. Pick the (max three) values this decision should serve. " +
          "If you catch yourself choosing “impressing people”, that's worth knowing."
      ),
      el("div", { class: "step-quote" },
        "“Who you are is defined by what you're willing to struggle for.”",
        el("span", { class: "who" }, "— Mark Manson")),
      el("label", { class: "field-label" }, "The values on the table (pick up to 3)"),
      chipsWrap,
      el("div", { style: { display: "flex", gap: "0.5rem", marginTop: "0.4rem" } },
        customInput,
        el("button", { class: "btn small ghost", type: "button", onClick: addCustom }, "Add")),
      optionCardsWrap,
      navRow({ next: () => goStep(4) })
    );
    return [header(step), content];
  }

  /* -------------------------------------------------- step 4: models */

  function stepModels() {
    const step = STEPS[4];
    const answered = () => Object.values(draft.frameworks).filter((a) => a && a.trim()).length;
    const counter = el("p", { class: "faint" }, "");

    function refreshCounter() {
      counter.textContent = `${answered()} of ${FRAMEWORKS.length} lenses used — two or three good ones beat eight rushed ones.`;
    }
    refreshCounter();

    const cards = FRAMEWORKS.map((f) =>
      el(
        "div",
        { class: "card fw-card", style: { marginTop: "0.8rem" } },
        el("h3", {}, f.name),
        el("p", { class: "fw-source" }, f.source),
        el("p", { class: "fw-question" }, f.question),
        el("p", { class: "small muted" }, f.hint),
        el("textarea", {
          placeholder: "Think out loud here… (leave blank to skip this lens)",
          "aria-label": `${f.name}: ${f.question}`,
          onInput: (e) => {
            draft.frameworks[f.id] = e.target.value;
            refreshCounter();
          },
        }, draft.frameworks[f.id] || "")
      )
    );

    const content = el(
      "div",
      {},
      el(
        "div",
        { class: "card" },
        el("h1", {}, "Run it through the models"),
        el(
          "p",
          { class: "muted" },
          "The Big Think school: you can't remove uncertainty, but you can remove predictable stupidity. " +
            "Pick the two or three lenses that fit this decision and actually write — writing is where the fog lifts. " +
            "(And watch for sunk costs: what you've already spent doesn't get a vote.)"
        ),
        el("div", { class: "step-quote" },
          "“A great decision is not the same thing as a great outcome.”",
          el("span", { class: "who" }, "— after Annie Duke, Thinking in Bets")),
        counter
      ),
      cards,
      el("div", { class: "card", style: { marginTop: "0.8rem" } },
        navRow({
          next: () => {
            if (answered() < 1) return toast("Write through at least one lens — that's the thinking part.");
            goStep(5);
          },
        }))
    );
    return [header(step), content];
  }

  /* -------------------------------------------------- step 5: courage */

  function stepCourage() {
    const step = STEPS[5];
    const pleasingDetail = el("div", {});

    function refreshPleasing() {
      pleasingDetail.replaceChildren(
        draft.courage.pleasing === true
          ? el(
              "div",
              { class: "callout warn" },
              "Noted — and worth sitting with. Charlie's line: a choice made mainly to avoid disappointing someone " +
                "trades long-term self-respect for short-term approval. Their disappointment is temporary; your resentment isn't. " +
                "This doesn't decide the question, but it belongs in the open."
            )
          : null
      );
    }
    refreshPleasing();

    const content = el(
      "div",
      { class: "card" },
      el("h1", {}, "Which answer is fear writing?"),
      el(
        "p",
        { class: "muted" },
        "The Charisma on Command lens: fear is a terrible ghostwriter — it drafts decisions and signs your name. " +
          "Three questions to catch it in the act."
      ),
      el("div", { class: "step-quote" },
        "“Discomfort is not danger. The presence of butterflies doesn't mean the answer is no.”",
        el("span", { class: "who" }, "— after Charlie Houpert, Charisma on Command")),
      el("label", { class: "field-label", for: "c-nojudge" }, "1 · If nobody would ever know or judge either way — which option would you pick?"),
      el("input", {
        type: "text", id: "c-nojudge", value: draft.courage.noJudgement,
        placeholder: "Answer fast. First instinct.",
        onInput: (e) => (draft.courage.noJudgement = e.target.value),
      }),
      el("label", { class: "field-label" }, "2 · Is part of this choice about not disappointing someone?"),
      pick(
        [
          [true, "Yes, honestly", "There's a person whose reaction I'm managing."],
          [false, "No", "The pull is about the thing itself, not someone's approval."],
        ],
        draft.courage.pleasing,
        (v) => {
          draft.courage.pleasing = v;
          refreshPleasing();
        }
      ),
      pleasingDetail,
      el("label", { class: "field-label", for: "c-confident" }, "3 · What would the most confident version of you do — the you that keeps promises to yourself?"),
      el("textarea", {
        id: "c-confident",
        placeholder: "Not the loudest you. The one with nothing to prove.",
        onInput: (e) => (draft.courage.confidentSelf = e.target.value),
      }, draft.courage.confidentSelf),
      navRow({ next: () => goStep(6) })
    );
    return [header(step), content];
  }

  /* -------------------------------------------------- step 6: gut */

  function stepGut() {
    const step = STEPS[6];
    const opts = draft.options.map((o, i) => ({ o: o.trim(), i })).filter((x) => x.o);
    let headsI = opts[0]?.i ?? 0;
    let tailsI = opts[1]?.i ?? 1;
    let flipping = false;

    const coin = el("div", { class: "coin", "aria-live": "polite" }, "?");
    const feelBox = el("div", {});

    const headsSel = select(opts, headsI, (v) => (headsI = v), "Heads means");
    const tailsSel = select(opts, tailsI, (v) => (tailsI = v), "Tails means");

    function flip() {
      if (flipping) return;
      flipping = true;
      feelBox.replaceChildren();
      coin.classList.add("spinning");
      coin.textContent = "…";
      setTimeout(() => {
        coin.classList.remove("spinning");
        flipping = false;
        const heads = Math.random() < 0.5;
        const winner = draft.options[heads ? headsI : tailsI] || (heads ? "Heads" : "Tails");
        draft.gut.result = winner;
        coin.textContent = winner;
        feelBox.append(
          el("p", { class: "muted small", style: { textAlign: "center" } },
            "Don't obey the coin. Just answer: what did you feel the instant you saw the result?"),
          el(
            "div",
            { class: "btn-row", style: { justifyContent: "center" } },
            feelBtn("relieved", "Relieved"),
            feelBtn("disappointed", "Disappointed"),
            feelBtn("nothing", "Nothing")
          )
        );
      }, 900);
    }

    function feelBtn(value, label) {
      return el("button", {
        class: "btn small", type: "button",
        onClick: () => {
          draft.gut.feeling = value;
          draft.gut.done = true;
          save();
          feelBox.replaceChildren(
            el(
              "div",
              { class: `callout ${value === "nothing" ? "info" : "good"}` },
              value === "relieved"
                ? `Relief means some part of you was already hoping for “${draft.gut.result}”. That's data no spreadsheet gives you.`
                : value === "disappointed"
                  ? `Disappointment is your gut casting its vote against “${draft.gut.result}”. The coin did its job — it made you honest.`
                  : "Flat response. Either the stakes are lower than you thought, or the feeling is hiding. Let the other lenses carry this one."
            ),
            el("div", { class: "btn-row" }, el("button", { class: "btn small ghost", type: "button", onClick: flip }, "Flip again"))
          );
        },
      }, label);
    }

    const content = el(
      "div",
      { class: "card" },
      el("h1", {}, "Ask your gut — with a coin"),
      el(
        "p",
        { class: "muted" },
        "You've done the head work. Now the Dr. K move: assign two options to a coin and flip it — " +
          "not to obey it, but to catch the hope or dread that surfaces while it's in the air. " +
          "That reaction is the honest signal under all the reasoning."
      ),
      opts.length >= 2
        ? [headsSel, tailsSel, el("div", { class: "coin-stage" }, coin, el("button", { class: "btn primary", type: "button", onClick: flip }, "Flip the coin")), feelBox]
        : el("div", { class: "callout info" }, "Add at least two named options in the Frame step to run the gut check."),
      navRow({
        next: () => {
          if (!draft.reviewOn) draft.reviewOn = defaultReviewDate();
          goStep(7);
        },
        nextLabel: draft.gut.done ? "Next" : "Skip / Next",
      })
    );
    return [header(step), content];
  }

  function select(opts, current, onChange, label) {
    const id = `sel-${label.replace(/\W+/g, "-").toLowerCase()}`;
    return el(
      "div",
      { style: { margin: "0.4rem 0" } },
      el("label", { class: "field-label", for: id }, label),
      el(
        "select",
        { id, onChange: (e) => onChange(Number(e.target.value)) },
        opts.map((x) => el("option", { value: String(x.i), selected: x.i === current || null }, x.o))
      )
    );
  }

  /* -------------------------------------------------- step 7: decide */

  function stepDecide() {
    const step = STEPS[7];
    if (!draft.reviewOn) draft.reviewOn = defaultReviewDate();
    const opts = draft.options.map((o, i) => ({ o: o.trim(), i })).filter((x) => x.o);
    const brief = compileBrief(draft, FRAMEWORKS);

    const confLabel = el("span", { class: "muted small" }, confText(draft.confidence));
    const confSlider = el("input", {
      type: "range", min: "5", max: "95", step: "5", id: "confidence",
      value: String(draft.confidence),
      onInput: (e) => {
        draft.confidence = Number(e.target.value);
        confLabel.textContent = confText(draft.confidence);
      },
    });

    const optionPick = el(
      "div",
      { class: "choice-list" },
      opts.map(({ o, i }) => {
        const note = draft.optionNotes[i];
        const score = valuesFitScore(note?.fit);
        const btn = el(
          "button",
          {
            type: "button",
            class: "choice-card",
            "aria-pressed": String(draft.chosenIndex === i),
            onClick: () => {
              draft.chosenIndex = i;
              [...optionPick.children].forEach((c) => c.setAttribute("aria-pressed", "false"));
              btn.setAttribute("aria-pressed", "true");
            },
          },
          el("div", { class: "choice-title" }, o),
          score !== null ? el("div", { class: "choice-sub" }, `values fit ${score}/5`) : null
        );
        return btn;
      })
    );

    const content = el(
      "div",
      { class: "card" },
      el("h1", {}, draft.fastTracked ? "Two-way door — just pick" : "Place your bet"),
      el(
        "p",
        { class: "muted" },
        draft.fastTracked
          ? "You triaged this as reversible with modest stakes. Don't relitigate it — pick, set a review date, and treat the outcome as experiment data."
          : "Annie Duke's frame: this is a bet, not a prophecy. Choose, state your confidence out loud, and book the honest look back. " +
            "And remember — at some point, more analysis is just fear wearing a lab coat."
      ),
      brief
        ? el("div", { class: "card", style: { background: "var(--bg-soft)" } },
            el("h3", { class: "small" }, "What the walkthrough surfaced"),
            el("p", { class: "small muted", style: { whiteSpace: "pre-wrap" } }, brief))
        : null,
      el("label", { class: "field-label" }, "The decision"),
      optionPick,
      el("label", { class: "field-label", for: "confidence" }, "How confident are you that this is the right call?"),
      el("p", { class: "field-hint" }, "If you had to bet money on “future me endorses this” — what odds would you take?"),
      confSlider,
      confLabel,
      el("label", { class: "field-label", for: "rationale" }, "Why this one? (your future self will read this)"),
      el("textarea", {
        id: "rationale",
        placeholder: "The two or three reasons that actually carried the decision.",
        onInput: (e) => (draft.rationale = e.target.value),
      }, draft.rationale),
      el("label", { class: "field-label", for: "review-on" }, "Honest look back on…"),
      el("input", {
        type: "date", id: "review-on", value: draft.reviewOn,
        onInput: (e) => (draft.reviewOn = e.target.value),
      }),
      navRow({
        backTo: draft.fastTracked ? 2 : 6,
        next: () => {
          if (draft.chosenIndex === null || !draft.options[draft.chosenIndex]?.trim()) {
            return toast("Pick the option you're committing to.");
          }
          store.commitDraft(draft);
          toast("Decision made. Now honour it — confidence comes from keeping promises to yourself.");
          router.go(`/decision/${draft.id}`);
        },
        nextLabel: "Commit to it",
      })
    );
    return [header(step), content];
  }

  function confText(c) {
    if (c >= 85) return `${c}% — near certain. If you're wrong, the review will be interesting.`;
    if (c >= 65) return `${c}% — a solid bet with open eyes.`;
    if (c >= 45) return `${c}% — a coin toss you're choosing to call. That's allowed.`;
    return `${c}% — you're betting against your own pick. Worth pausing on.`;
  }

  /* -------------------------------------------------- shared bits */

  function pick(items, current, onPick) {
    const wrap = el("div", { class: "choice-list", role: "group" });
    items.forEach(([value, title, sub]) => {
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
    });
    return wrap;
  }

  const renderers = [stepCheckin, stepFrame, stepTriage, stepValues, stepModels, stepCourage, stepGut, stepDecide];

  function renderStep() {
    renderProgress();
    stage.replaceChildren(...[renderers[draft.step]()].flat(Infinity));
  }

  renderStep();
  return root;
}
