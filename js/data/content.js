/**
 * BetterDecisions content — five voices, each a distinct way of thinking
 * about a choice. None of them is a real person; each condenses a widely
 * shared, publicly discussed style of reasoning (an emotional check-in
 * practice, an experiment-first productivity mindset, decision-science
 * mental models, a values-first worldview, a confidence-and-courage lens)
 * into a character the app can speak through consistently.
 *
 * Quotes marked `paraphrase: true` are original lines written to carry a
 * commonly discussed idea, not verbatim quotations from any book or person.
 */

export const MENTORS = [
  {
    id: "steady",
    name: "The Steady Mind",
    role: "The awareness voice — checks the state of the decider before the decision",
    lens: "Awareness: know the mind that's deciding",
    color: "var(--c-steady)",
    wizardStep: "Check in",
    principles: [
      "Check the machine before trusting its output — a hungry, angry, lonely or tired mind makes different choices than a rested one (HALT).",
      "Name the emotion. A feeling you can't name steers you invisibly; naming it moves it from autopilot to awareness.",
      "Your mind generates reasons for what it already wants. Notice the want first, then weigh the reasons.",
      "Old emotional residue votes in present decisions. Ask how much of the pull toward an option comes from an old wound rather than the situation in front of you.",
      "Run a craving check: is this what you'd choose, or what your cravings would choose for you?",
      "When you're activated, breathe first. Almost no good decision requires you to skip a breath.",
    ],
  },
  {
    id: "experimenter",
    name: "The Experimenter",
    role: "The energy voice — treats most choices as cheap, reversible tests, not verdicts",
    lens: "Energy & experiments: make choices you can sustain",
    color: "var(--c-experimenter)",
    wizardStep: "Triage",
    principles: [
      "Apply the feel-good filter: the option that energises you is usually more sustainable than the one that merely impresses.",
      "Treat decisions as experiments. Most choices are data-gathering, not final verdicts — design the cheap test.",
      "Distinguish two-way doors from one-way doors. If you can walk back through it, decide fast and learn.",
      "Reduce the cost of failure instead of agonising over the odds of success.",
      "Ask what 10-years-older you would advise. Distance shrinks fake stakes and reveals real ones.",
      "If it isn't a clear yes, treat that as information — enthusiasm is data.",
    ],
    readingDirections: [
      "Habit and identity — how small repeated choices compound into who you become.",
      "The finiteness of time — ruthless prioritization as a response to having too little of it.",
      "Saying no by default so the rare full yes has room to exist.",
      "Decision speed — sorting cheap reversible bets from the rare ones worth slowing down for.",
      "Fear-setting — defining a worst case precisely enough that it stops running the show.",
    ],
  },
  {
    id: "strategist",
    name: "The Strategist",
    role: "The mental-models voice — a toolkit for thinking clearly under uncertainty",
    lens: "Mental models: think clearly under uncertainty",
    color: "var(--c-strategist)",
    wizardStep: "Think it through",
    principles: [
      "A decision is a bet on an uncertain future. Judge it by the quality of the process, not just the outcome — a good process can still lose, and a bad one can still win.",
      "Ask 'and then what?' — second-order thinking looks past the immediate result to what it causes next.",
      "Invert the problem: list what would guarantee failure, then check whether you're about to do any of it.",
      "Take the outside view: forget your specifics for a moment — how does this usually go for people who choose it?",
      "Run a premortem: assume it's a year later and the choice failed badly. Writing the story surfaces risks optimism hides.",
      "Beware sunk costs — the money, time or pride already spent is gone either way and shouldn't cast a vote.",
      "Quitting on time usually feels like quitting too early.",
    ],
  },
  {
    id: "realist",
    name: "The Straight Talker",
    role: "The values voice — blunt about what a choice is actually in service of",
    lens: "Values: choose your struggle",
    color: "var(--c-realist)",
    wizardStep: "Values",
    principles: [
      "Who you are is defined by what you're willing to struggle for. Every option is a package deal that includes its own pain — pick the pain you can respect.",
      "Interrogate the value behind the choice. Good values are chosen, honest and in your control (growth, courage, craft); bad values outsource your worth (status, approval, comfort).",
      "If it's not a 'hell yes', get curious about why you're still considering it.",
      "Not deciding is also a decision — it just hands the steering wheel to circumstance.",
      "Use the deathbed test: from the end of your life, most options don't even register. The ones that do are your answer.",
      "Action isn't just the effect of motivation, it's also the cause. If you're stuck, do something small and let clarity follow.",
    ],
  },
  {
    id: "confidant",
    name: "The Confidant",
    role: "The courage voice — catches fear dressed up as prudence",
    lens: "Courage: act from confidence, not approval",
    color: "var(--c-confidant)",
    wizardStep: "Courage check",
    principles: [
      "Ask what the boldest, most self-respecting version of you would do. The gap between that answer and your plan is usually fear, not wisdom.",
      "Catch people-pleasing in the act: a choice made mainly to avoid disappointing someone is still your choice — and you pay for it later.",
      "Most social risks are smaller and more recoverable than they feel in the moment.",
      "Trade short-term approval for long-term self-respect, not the other way around.",
      "Confidence is built by keeping promises to yourself. Once you decide, honouring the decision matters as much as the choice.",
      "Discomfort is not danger. The presence of butterflies doesn't mean the answer is no.",
    ],
  },
];

export const VALUES = [
  "Growth", "Honesty", "Health", "Freedom", "Family", "Craft & mastery",
  "Courage", "Contribution", "Security", "Adventure", "Connection",
  "Creativity", "Integrity", "Learning", "Peace of mind", "Independence",
];

/**
 * Frameworks offered in the "Think it through" step and the mentors library.
 * These are widely taught decision techniques, described generically rather
 * than credited to a single named originator.
 */
export const FRAMEWORKS = [
  {
    id: "ten-ten-ten",
    name: "10 / 10 / 10",
    source: "A classic time-horizon test",
    mentorId: "experimenter",
    question: "How will you feel about each option in 10 minutes, 10 months, and 10 years?",
    hint: "Snap feelings fade; write down which option still looks right at each horizon.",
  },
  {
    id: "regret-minimization",
    name: "Regret minimization",
    source: "A well-known long-view test",
    mentorId: "experimenter",
    question: "Imagine you're 80, looking back. Which choice would you regret NOT making?",
    hint: "Regret usually attaches to the untried thing, not the failed attempt.",
  },
  {
    id: "fear-setting",
    name: "Fear-setting",
    source: "A structured way to size up worst-case fear",
    mentorId: "experimenter",
    question: "Define the worst realistic case. How would you prevent it, and how would you repair it if it happened?",
    hint: "Fear thrives on vagueness. Spell the disaster out and it usually shrinks to an inconvenience.",
  },
  {
    id: "premortem",
    name: "Premortem",
    source: "A pre-decision risk-surfacing exercise",
    mentorId: "strategist",
    question: "It's one year later and this choice failed badly. Write the story: what went wrong?",
    hint: "You're not predicting failure, you're surfacing risks while they're still cheap to fix.",
  },
  {
    id: "inversion",
    name: "Inversion",
    source: "A classic problem-solving reframe",
    mentorId: "strategist",
    question: "What would guarantee this goes badly? Are you about to do any of those things?",
    hint: "It's often easier to avoid stupidity than to manufacture brilliance.",
  },
  {
    id: "second-order",
    name: "Second-order thinking",
    source: "A consequences-of-consequences check",
    mentorId: "strategist",
    question: "And then what? What does each option cause after its immediate result?",
    hint: "First-order thinking is crowded. The consequences of the consequences are where choices really differ.",
  },
  {
    id: "outside-view",
    name: "The outside view",
    source: "A base-rate reality check",
    mentorId: "strategist",
    question: "Forget your specifics: how does this decision usually turn out for people like you?",
    hint: "Base rates beat vibes. You are probably not the exception — plan as if you're the average case.",
  },
  {
    id: "opportunity-cost",
    name: "Opportunity cost",
    source: "A trade-off visibility check",
    mentorId: "experimenter",
    question: "What are you saying no to by saying yes to this? What's the best alternative use of the same time, money or energy?",
    hint: "Every yes silently spends a no. Make the trade visible before you sign it.",
  },
];

/**
 * Rotating wisdom cards shown on the home screen — original lines, each
 * carrying a widely discussed idea, attributed only to one of the app's
 * five voices.
 */
export const QUOTES = [
  { text: "Every choice you make is a small vote for who you're becoming — cast it on purpose.", who: "The Steady Mind", paraphrase: true },
  { text: "When you genuinely can't decide, that's usually the answer.", who: "The Experimenter", paraphrase: true },
  { text: "If it isn't an obvious yes, it's usually a no wearing a disguise.", who: "The Experimenter", paraphrase: true },
  { text: "A good decision can still lose, and a bad one can still win — judge the thinking, not just the scoreboard.", who: "The Strategist", paraphrase: true },
  { text: "What you're willing to struggle for says more about you than what you enjoy.", who: "The Straight Talker", paraphrase: true },
  { text: "Waiting for motivation is backwards — act first, in something small, and let the clarity follow.", who: "The Straight Talker", paraphrase: true },
  { text: "Every option comes bundled with its own kind of pain. Pick the pain you can respect, not the one that looks easiest today.", who: "The Straight Talker", paraphrase: true },
  { text: "Ask what the boldest version of you would do — the gap between that and your plan is usually fear, not wisdom.", who: "The Confidant", paraphrase: true },
  { text: "Your mind is happy to invent reasons for whatever it already wants. Catch the want before you catch the reasons.", who: "The Steady Mind", paraphrase: true },
  { text: "No decision worth making requires you to skip a breath first.", who: "The Steady Mind", paraphrase: true },
  { text: "Saying yes to one thing quietly says no to everything else you could have chosen instead.", who: "The Experimenter", paraphrase: true },
  { text: "Worry less about the odds of failing and more about how expensive failing would be — keep the downside small, then take the bet.", who: "The Experimenter", paraphrase: true },
  { text: "If quitting doesn't feel a little too early, you probably waited too long.", who: "The Strategist", paraphrase: true },
];

/** Pick the quote of the day deterministically (stable across reloads). */
export function quoteOfTheDay(date = new Date()) {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const day = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 86400000);
  return QUOTES[day % QUOTES.length];
}

export function mentorById(id) {
  return MENTORS.find((m) => m.id === id) || null;
}

export function frameworkById(id) {
  return FRAMEWORKS.find((f) => f.id === id) || null;
}
