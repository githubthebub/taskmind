/**
 * BetterDecisions content — the five schools of thought the app is built on,
 * plus the frameworks, values and quotes drawn from them.
 *
 * Quotes marked `paraphrase: true` are condensed restatements of a recurring
 * idea, not verbatim quotations.
 */

export const MENTORS = [
  {
    id: "drk",
    name: "Dr. K",
    role: "HealthyGamerGG — psychiatrist & meditation teacher",
    lens: "Awareness: know the mind that's deciding",
    color: "var(--c-drk)",
    wizardStep: "Check in",
    principles: [
      "Check the machine before trusting its output — a hungry, angry, lonely or tired mind makes different choices than a rested one (HALT).",
      "Name the emotion. A feeling you can't name steers you invisibly; naming it moves it from autopilot to awareness.",
      "Your mind generates reasons for what it already wants. Notice the want first, then weigh the reasons.",
      "Old emotional residue votes in present decisions. Ask how much of the pull toward an option comes from an old wound rather than the situation in front of you.",
      "Run a dopamine check: is this what you'd choose, or what your cravings would choose for you?",
      "When you're activated, breathe first. Almost no good decision requires you to skip a breath.",
    ],
  },
  {
    id: "ali",
    name: "Ali Abdaal",
    role: "Doctor turned productivity YouTuber — author of Feel-Good Productivity",
    lens: "Energy & experiments: make choices you can sustain",
    color: "var(--c-ali)",
    wizardStep: "Triage",
    principles: [
      "Apply the feel-good filter: the option that energises you is usually more sustainable than the one that merely impresses.",
      "Treat decisions as experiments. Most choices are data-gathering, not final verdicts — design the cheap test.",
      "Distinguish two-way doors from one-way doors. If you can walk back through it, decide fast and learn.",
      "Reduce the cost of failure instead of agonising over the odds of success.",
      "Ask what 10-years-older you would advise. Distance shrinks fake stakes and reveals real ones.",
      "If it isn't a clear yes, treat that as information — enthusiasm is data.",
    ],
    books: [
      { title: "Atomic Habits", author: "James Clear", note: "Every action is a vote for the type of person you wish to become — decisions compound." },
      { title: "Four Thousand Weeks", author: "Oliver Burkeman", note: "Your time is brutally finite. Every yes is a hundred silent no's — choose what to neglect." },
      { title: "Essentialism", author: "Greg McKeown", note: "If it isn't a clear yes, then it's a clear no. Apply tougher criteria on purpose." },
      { title: "The Almanack of Naval Ravikant", author: "Eric Jorgenson", note: "If you can't decide, the answer is no. Play long-term games with long-term people." },
      { title: "Hell Yeah or No", author: "Derek Sivers", note: "When you say no to almost everything, you leave room for the rare things worth a full yes." },
      { title: "Deep Work", author: "Cal Newport", note: "Attention is the resource behind every other resource — decide what deserves it." },
      { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", note: "Know when you're running on snap judgement (System 1) and when the choice deserves slow thought (System 2)." },
      { title: "The 4-Hour Work Week", author: "Tim Ferriss", note: "Fear-setting: define the worst case precisely, then plan prevention and repair — vague fear shrinks under detail." },
      { title: "The Psychology of Money", author: "Morgan Housel", note: "Aim to be reasonable rather than perfectly rational, and always leave room for error." },
    ],
  },
  {
    id: "bigthink",
    name: "Big Think",
    role: "Interviews with scientists & thinkers — Annie Duke, Daniel Kahneman, Adam Grant and more",
    lens: "Mental models: think clearly under uncertainty",
    color: "var(--c-bigthink)",
    wizardStep: "Think it through",
    principles: [
      "A decision is a bet on an uncertain future. Judge it by the quality of the process, not just the outcome (Annie Duke calls the error 'resulting').",
      "Ask 'and then what?' — second-order thinking looks past the immediate result to what it causes next.",
      "Invert the problem: list what would guarantee failure, then check whether you're about to do any of it (Charlie Munger's habit).",
      "Take the outside view: forget your specifics for a moment — how does this usually go for people who choose it?",
      "Run a premortem: assume it's a year later and the choice failed badly. Writing the story surfaces risks optimism hides (Gary Klein).",
      "Beware sunk costs — the money, time or pride already spent is gone either way and shouldn't cast a vote.",
      "Quitting on time usually feels like quitting too early (Annie Duke).",
    ],
  },
  {
    id: "manson",
    name: "Mark Manson",
    role: "Author of The Subtle Art of Not Giving a F*ck",
    lens: "Values: choose your struggle",
    color: "var(--c-manson)",
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
    id: "charlie",
    name: "Charlie Houpert",
    role: "Charisma on Command — confidence & social dynamics",
    lens: "Courage: act from confidence, not approval",
    color: "var(--c-charlie)",
    wizardStep: "Courage check",
    principles: [
      "Ask what the most confident version of you would do. The gap between that answer and your plan is usually fear, not wisdom.",
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
 */
export const FRAMEWORKS = [
  {
    id: "ten-ten-ten",
    name: "10 / 10 / 10",
    source: "Suzy Welch — popular on Ali Abdaal's channel",
    mentorId: "ali",
    question: "How will you feel about each option in 10 minutes, 10 months, and 10 years?",
    hint: "Snap feelings fade; write down which option still looks right at each horizon.",
  },
  {
    id: "regret-minimization",
    name: "Regret minimization",
    source: "Jeff Bezos — echoed by Ali Abdaal & Naval Ravikant",
    mentorId: "ali",
    question: "Imagine you're 80, looking back. Which choice would you regret NOT making?",
    hint: "Regret usually attaches to the untried thing, not the failed attempt.",
  },
  {
    id: "fear-setting",
    name: "Fear-setting",
    source: "Tim Ferriss — The 4-Hour Work Week (on Ali's bookshelf)",
    mentorId: "ali",
    question: "Define the worst realistic case. How would you prevent it, and how would you repair it if it happened?",
    hint: "Fear thrives on vagueness. Spell the disaster out and it usually shrinks to an inconvenience.",
  },
  {
    id: "premortem",
    name: "Premortem",
    source: "Gary Klein — a Big Think staple",
    mentorId: "bigthink",
    question: "It's one year later and this choice failed badly. Write the story: what went wrong?",
    hint: "You're not predicting failure, you're surfacing risks while they're still cheap to fix.",
  },
  {
    id: "inversion",
    name: "Inversion",
    source: "Charlie Munger",
    mentorId: "bigthink",
    question: "What would guarantee this goes badly? Are you about to do any of those things?",
    hint: "It's often easier to avoid stupidity than to manufacture brilliance.",
  },
  {
    id: "second-order",
    name: "Second-order thinking",
    source: "Howard Marks — via Big Think & Farnam Street",
    mentorId: "bigthink",
    question: "And then what? What does each option cause after its immediate result?",
    hint: "First-order thinking is crowded. The consequences of the consequences are where choices really differ.",
  },
  {
    id: "outside-view",
    name: "The outside view",
    source: "Daniel Kahneman",
    mentorId: "bigthink",
    question: "Forget your specifics: how does this decision usually turn out for people like you?",
    hint: "Base rates beat vibes. You are probably not the exception — plan as if you're the average case.",
  },
  {
    id: "opportunity-cost",
    name: "Opportunity cost",
    source: "Oliver Burkeman & Greg McKeown (on Ali's bookshelf)",
    mentorId: "ali",
    question: "What are you saying no to by saying yes to this? What's the best alternative use of the same time, money or energy?",
    hint: "Every yes silently spends a no. Make the trade visible before you sign it.",
  },
];

/**
 * Rotating wisdom cards shown on the home screen.
 */
export const QUOTES = [
  { text: "Every action you take is a vote for the type of person you wish to become.", who: "James Clear, Atomic Habits — Ali Abdaal's bookshelf" },
  { text: "If you can't decide, the answer is no.", who: "Naval Ravikant — Ali Abdaal's bookshelf" },
  { text: "If it isn't a clear yes, then it's a clear no.", who: "Greg McKeown, Essentialism" },
  { text: "A great decision is not the same thing as a great outcome — don't judge one by the other.", who: "Annie Duke, Thinking in Bets (paraphrase)", paraphrase: true },
  { text: "Who you are is defined by what you're willing to struggle for.", who: "Mark Manson" },
  { text: "Action isn't just the effect of motivation. It's also the cause of it.", who: "Mark Manson" },
  { text: "The question isn't whether you'll suffer for your choice — every choice has a cost. The question is whether the cost is one you can respect.", who: "After Mark Manson (paraphrase)", paraphrase: true },
  { text: "Ask what the most confident version of you would do — the gap between that and your plan is usually fear, not wisdom.", who: "After Charlie Houpert, Charisma on Command (paraphrase)", paraphrase: true },
  { text: "Your mind will happily generate reasons for whatever it already wants. Notice the want first.", who: "After Dr. K, HealthyGamerGG (paraphrase)", paraphrase: true },
  { text: "No good decision requires you to skip a breath.", who: "After Dr. K, HealthyGamerGG (paraphrase)", paraphrase: true },
  { text: "Saying yes to one thing is, always and unavoidably, saying no to everything else you could have done instead.", who: "After Oliver Burkeman, Four Thousand Weeks (paraphrase)", paraphrase: true },
  { text: "The cost of failure matters more than the odds of failure — make the bet cheap to lose, then take it.", who: "After Ali Abdaal (paraphrase)", paraphrase: true },
  { text: "Quitting on time usually feels like quitting too early.", who: "Annie Duke, Quit" },
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
