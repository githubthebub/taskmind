import { el, toast } from "../ui.js";

/**
 * The gut check — a Dr. K-flavoured coin flip.
 * The coin doesn't make the decision; your reaction to the result does.
 */
export function coinFlipView() {
  let headsLabel = "";
  let tailsLabel = "";
  let flipping = false;

  const headsInput = el("input", {
    type: "text", id: "coin-heads", placeholder: "e.g. Take the job", "aria-label": "Option for heads",
    onInput: (e) => (headsLabel = e.target.value),
  });
  const tailsInput = el("input", {
    type: "text", id: "coin-tails", placeholder: "e.g. Stay put", "aria-label": "Option for tails",
    onInput: (e) => (tailsLabel = e.target.value),
  });

  const coin = el("div", { class: "coin", "aria-live": "polite" }, "?");
  const verdict = el("div", {});

  function flip() {
    if (flipping) return;
    flipping = true;
    verdict.replaceChildren();
    coin.classList.add("spinning");
    coin.textContent = "…";
    setTimeout(() => {
      coin.classList.remove("spinning");
      flipping = false;
      const heads = Math.random() < 0.5;
      const label = heads ? headsLabel.trim() : tailsLabel.trim();
      coin.textContent = label || (heads ? "Heads" : "Tails");
      verdict.append(
        el("h3", { style: { marginTop: "1rem" } }, "Now — the real result:"),
        el("p", { class: "muted small" },
          "Notice the flicker you just felt. Relief means the coin agreed with what you already wanted. " +
          "Disappointment means it didn't — and either way, you just met your real answer."),
        el(
          "div",
          { class: "btn-row" },
          el("button", { class: "btn small", type: "button", onClick: () => conclude("relieved") }, "I felt relieved"),
          el("button", { class: "btn small", type: "button", onClick: () => conclude("disappointed") }, "I felt disappointed"),
          el("button", { class: "btn small ghost", type: "button", onClick: () => conclude("nothing") }, "I felt nothing")
        )
      );
    }, 900);
  }

  function conclude(feeling) {
    verdict.replaceChildren(
      el(
        "div",
        { class: `callout ${feeling === "nothing" ? "info" : "good"}` },
        feeling === "relieved"
          ? "Relief is your gut voting yes on this result. You already knew — the coin just gave you permission to admit it."
          : feeling === "disappointed"
            ? "Disappointment is your gut voting for the other option. Ignore the coin; it did its job."
            : "No reaction can mean genuinely low stakes — in which case, pick either and move — or it can mean you're out of touch with the feeling. If it matters and you feel nothing, run the full decision flow instead."
      ),
      el(
        "div",
        { class: "btn-row" },
        el("button", { class: "btn small ghost", type: "button", onClick: flip }, "Flip again"),
        el("a", { class: "btn small primary", href: "#/new" }, "Run the full flow")
      )
    );
    toast("Gut consulted.");
  }

  return el(
    "div",
    {},
    el("h1", {}, "Gut check"),
    el(
      "p",
      { class: "lede" },
      "An old trick Dr. K would approve of: assign your two options to a coin and flip it. " +
        "You're not outsourcing the choice — you're using the result to surface the preference " +
        "your mind already holds but won't say out loud."
    ),
    el(
      "div",
      { class: "card" },
      el("label", { class: "field-label", for: "coin-heads" }, "Heads means…"),
      headsInput,
      el("label", { class: "field-label", for: "coin-tails" }, "Tails means…"),
      tailsInput,
      el(
        "div",
        { class: "coin-stage" },
        coin,
        el("button", { class: "btn primary", type: "button", onClick: flip }, "Flip the coin")
      ),
      verdict
    ),
    el(
      "p",
      { class: "faint", style: { marginTop: "1rem" } },
      "Best for two-way doors and low stakes. For one-way doors, run the full flow — the coin only reads your gut, and one-way doors deserve your head too."
    )
  );
}
