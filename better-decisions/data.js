/* =========================================================================
   Better Decisions — Knowledge Base & Conversation Tree
   -------------------------------------------------------------------------
   No AI backend. Every "response" is a hand-authored node in this tree,
   built from evidence-based frameworks (CBT, DBT, ACT, psychosomatic /
   somatic awareness) and the public teachings of:
     • Ali Abdaal (feel-good productivity, regret minimisation)
     • Charisma on Command (vibes, sub-communication, social confidence)
     • Big Think (Dan Gilbert, Barry Schwartz, Cal Newport et al.)
     • HealthyGamerGG / Dr. K (dopamine, purpose, rumination, attachment)
     • Dr. Judy Ho (self-sabotage, approach vs. avoidance motivation)
   ========================================================================= */

const AREAS = [
  { id: "relationships", label: "Relationships", icon: "💜", color: "#a78bfa", blurb: "Romance, friends, family" },
  { id: "career",        label: "Career & Work", icon: "💼", color: "#60a5fa", blurb: "Quit? Stay? Pivot?" },
  { id: "money",         label: "Money & Buying", icon: "💰", color: "#34d399", blurb: "Big purchases, spending" },
  { id: "habits",        label: "Habits & Health", icon: "🌱", color: "#4ade80", blurb: "Sticking to change" },
  { id: "mind",          label: "Mind & Emotions", icon: "🧠", color: "#f472b6", blurb: "Overthinking, anxiety" },
  { id: "purpose",       label: "Purpose & Direction", icon: "🧭", color: "#fbbf24", blurb: "What's it all for?" },
];

/* Techniques glossary (Toolbox) ------------------------------------------ */
const TOOLBOX = [
  {
    id: "hedonic",
    name: "Hedonic Adaptation",
    tag: "Psychology of happiness",
    body: "Humans return to a happiness baseline after both good and bad events. The Ferrari feels incredible for ~3 months, then becomes 'my car'. Research (Dan Gilbert, Big Think) shows experiences, anticipation, and buying back your time resist adaptation far better than objects.",
  },
  {
    id: "covert",
    name: "Covert Contracts",
    tag: "Relationships",
    body: "An unspoken deal: 'I do X for you, so you owe me Y' — where the other person never agreed, or even knew. It turns kindness into a transaction and generosity into resentment. The fix: give freely or don't give, and ask directly for what you want.",
  },
  {
    id: "wisemind",
    name: "Wise Mind (DBT)",
    tag: "DBT",
    body: "Emotion Mind reacts; Reasonable Mind calculates; Wise Mind is where they overlap — the calm, knowing state where good decisions live. Access it by slowing your breath and asking: 'What do I already know is true here?'",
  },
  {
    id: "dearman",
    name: "DEARMAN (DBT)",
    tag: "DBT · Communication",
    body: "A script for hard asks: Describe the facts, Express your feeling, Assert your request, Reinforce why it helps both of you, stay Mindful, Appear confident, Negotiate. It replaces hinting and resentment with a clear, kind request.",
  },
  {
    id: "distortions",
    name: "Cognitive Distortions (CBT)",
    tag: "CBT",
    body: "Thinking traps that masquerade as facts: mind-reading ('they think I'm boring'), catastrophising ('this will ruin everything'), all-or-nothing ('if it's not perfect, it's a failure'), fortune-telling. Name the trap and the thought loses half its power.",
  },
  {
    id: "somatic",
    name: "Body-First Check (Psychosomatic)",
    tag: "Somatic awareness",
    body: "Your body votes before your mind explains. Tight chest, clenched jaw, shallow breath — these are data. Before a big decision, scan head-to-toe: is this signal fear of real danger, or just fear of discomfort? Decisions made mid-adrenaline are usually the ones we regret.",
  },
  {
    id: "tenten",
    name: "10 / 10 / 10",
    tag: "Decision framework",
    body: "How will I feel about this choice in 10 minutes, 10 months, and 10 years? It drags future-you into the room, where they can outvote the craving of present-you.",
  },
  {
    id: "regret",
    name: "Regret Minimisation",
    tag: "Ali Abdaal · Bezos",
    body: "Project yourself to age 80 looking back. Which option would you regret NOT trying? People overwhelmingly regret inactions, not actions. Popularised by Jeff Bezos, taught widely by Ali Abdaal.",
  },
  {
    id: "oppaction",
    name: "Opposite Action (DBT)",
    tag: "DBT",
    body: "When an emotion's urge makes things worse (hide, lash out, chase), do the opposite of the urge — gently and all the way. Feeling like isolating? Text one friend. Urge to send the angry message? Draft it, don't send, walk first.",
  },
  {
    id: "approach",
    name: "Approach vs. Avoidance Goals",
    tag: "Dr. Judy Ho",
    body: "Avoidance goals ('stop being lazy', 'don't get rejected') keep your brain staring at the thing you fear. Approach goals ('train 3× a week', 'have one real conversation') give it somewhere to go. Dr. Judy Ho's research: self-sabotage thrives on avoidance framing.",
  },
];

/* -------------------------------------------------------------------------
   Conversation tree.
   Node shape:
   {
     coach: [ "msg", ... ]          messages the coach sends (in order)
     options: [ {label, next} ]     chips the user can tap
     insight: {                     optional — renders a saveable insight card
        title, technique, source, body, actions: [ ... ]
     }
   }
   ------------------------------------------------------------------------- */

const TREE = {

  /* ============================ ENTRY ================================== */

  start: {
    coach: [
      "Hey — welcome back. 👋",
      "I'm not an AI, and that's on purpose. Everything I say was written ahead of time from evidence-based psychology — CBT, DBT, somatic work — and thinkers like Dr. K, Dr. Judy Ho, Ali Abdaal and others.",
      "No feed, no tracking, nothing leaves this page. Pick the part of life where a decision is sitting on you.",
    ],
    options: [], // wheel is shown instead
  },

  /* ======================== RELATIONSHIPS ============================== */

  relationships: {
    coach: ["Relationships it is. Which one is on your mind?"],
    options: [
      { label: "💘 Romantic / dating", next: "rel_romantic" },
      { label: "🫂 Friendships", next: "rel_friends" },
      { label: "🏠 Family", next: "rel_family" },
    ],
  },

  rel_romantic: {
    coach: ["Okay. What's the situation closest to yours?"],
    options: [
      { label: "I'm dating / trying to date and it's not working", next: "rom_dating" },
      { label: "I'm in a relationship and we keep clashing", next: "rom_conflict" },
      { label: "I'm going through a breakup", next: "rom_breakup" },
      { label: "I can't decide: stay or leave?", next: "rom_stayleave" },
    ],
  },

  rom_dating: {
    coach: [
      "Dating frustration usually has a pattern underneath it — and the pattern is more fixable than the individual dates.",
      "So I can point you at the right one: which of these sounds most like your inner monologue?",
    ],
    options: [
      { label: "\"I'm generous and kind to them, but I always end up in the friend zone or feeling used.\"", next: "rom_niceguy" },
      { label: "\"Decent, stable people feel boring to me. I keep picking ones who treat me badly.\"", next: "rom_selection" },
      { label: "\"I freeze up — I can't even start conversations or ask anyone out.\"", next: "rom_approach_anx" },
    ],
  },

  /* ---- The 'nice guy' / covert contract path -------------------------- */

  rom_niceguy: {
    coach: [
      "I want to be straight with you, because this pattern wastes years when nobody names it.",
      "Ask yourself honestly: when you pay for the dinner, do the favours, drive them home at 2am… is a small part of you keeping score? Expecting that eventually the kindness converts into attraction?",
    ],
    options: [
      { label: "…Honestly, yes. A part of me expects something back.", next: "rom_niceguy_core" },
      { label: "No — but I still feel invisible to people I like.", next: "rom_niceguy_vibes" },
    ],
  },

  rom_niceguy_core: {
    coach: [
      "Respect for answering that honestly — most people can't.",
      "What you've described has a name: a covert contract. 'I do nice things → you owe me affection.' The problem is the other person never signed it. They experienced dinner with a friendly person; you experienced an investment. When it doesn't pay out, you feel cheated — and they feel confused, or worse, manipulated.",
      "Here's the reframe that changes everything:",
    ],
    insight: {
      title: "Kindness is the baseline, not the offer",
      technique: "Covert contracts · CBT reframe",
      source: "Charisma on Command · Dr. Robert Glover's 'No More Mr. Nice Guy' · HealthyGamerGG",
      body: "Being kind doesn't make you attractive — it makes you eligible. It's the entry ticket everyone is expected to hold, not the performance. Attraction is built on top of kindness: your vibe, playfulness, confidence, having a life you're genuinely excited about, and being able to express interest directly instead of smuggling it inside favours. Paying for food buys food. It has never once bought affection — and treating it as a purchase quietly turns you into someone who resents the people they claim to care about.",
      actions: [
        "Audit one 'generous' thing you did this month. Would you still do it if you knew, for certain, nothing came back? If no — stop doing it, or do it and truly release the expectation.",
        "Practise directness: express interest early and plainly ('I'd like to take you on a date') instead of auditioning through favours for months.",
        "Redirect the investment into your own life — training, skills, friends, projects. Charisma on Command's core finding: people are drawn to those visibly enjoying their own life.",
        "When resentment shows up, treat it as a smoke alarm for a covert contract you wrote. Ask: what did I secretly expect here, and did I ever actually ask for it out loud?",
      ],
    },
    options: [
      { label: "Okay… so what actually builds attraction?", next: "rom_niceguy_vibes" },
      { label: "That stings but it tracks. Back to the wheel.", next: "wheel" },
    ],
  },

  rom_niceguy_vibes: {
    coach: [
      "Attraction isn't a reward for good behaviour — it's a response to how being around you feels.",
      "Charisma on Command breaks it down to sub-communication: your energy, playfulness, eye contact, whether you can tease and hold your own opinions, whether you seem like you'd be fine without their approval. That last one is huge — neediness is the one thing no favour can offset.",
    ],
    insight: {
      title: "Build vibes, not credit",
      technique: "Sub-communication & self-signal work",
      source: "Charisma on Command",
      body: "People decide how they feel about you mostly from non-verbal signals: do you laugh easily, do you have your own plans, do you express interest without apology, can you disagree playfully? These signals can't be faked long-term — they leak from how your life actually feels. So the strategy isn't tactics on other people; it's making your own week genuinely fun, then inviting someone into it.",
      actions: [
        "Have one plan this week you'd be excited about even if no date ever came from it.",
        "Practise playful disagreement in low-stakes settings — with friends, baristas, colleagues. Agreeableness on everything reads as absence of self.",
        "Express interest within the first few interactions. Direct and early beats perfect and never.",
        "Notice approval-seeking in real time (laughing too hard, instant agreement, over-texting) and just… do 20% less of it.",
      ],
    },
    options: [
      { label: "What if I get rejected anyway?", next: "rom_rejection" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  rom_rejection: {
    coach: [
      "You will. Sometimes. That's not pessimism — it's the entry fee everyone pays, including every person you've ever envied.",
      "The reframe that makes it survivable: rejection is information about FIT, not a verdict on WORTH. They didn't reject you — they rejected a pairing, based on incomplete data, filtered through their own history and preferences you'll never fully see.",
    ],
    insight: {
      title: "Rejection is a fit-check, not a court ruling",
      technique: "Cognitive restructuring (CBT) · Exposure",
      source: "Charisma on Command · Dr. Judy Ho · CBT protocols",
      body: "The catastrophe was never the 'no' — it's the story you attach to it ('this proves I'm unlovable' is overgeneralisation, a named distortion, running on a sample size of one). People who date successfully aren't rejected less; they've just decoupled the 'no' from their self-worth, which lets them take more shots at lower emotional cost. That decoupling is trainable: every rejection you survive intact is a rep, and the fear shrinks with each one that fails to destroy you.",
      actions: [
        "After a no: allow exactly one evening of feeling it, then write one sentence about what it actually proves (hint: fit, not worth).",
        "Track attempts, not outcomes. Ten genuine attempts is a successful month regardless of results.",
        "Notice the survivorship math: everyone you admire has a longer rejection list than you. That's HOW they got there, not despite it.",
      ],
    },
    options: [
      { label: "Back to romantic topics", next: "rel_romantic" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  /* ---- The selection / 'good ones are boring' path -------------------- */

  rom_selection: {
    coach: [
      "This one's important, so let me say it carefully.",
      "The kind, steady people you call 'boring'? They ARE attracted to you. They're asking you out, texting back consistently, showing up on time. The issue isn't that good partners don't want you — it's that your radar files their signal under 'no spark' and filters them out before anything starts.",
      "Quick gut-check: when you feel that intense 'spark' with someone… what's usually true about them?",
    ],
    options: [
      { label: "They're hot-and-cold, hard to read, a bit of a chase", next: "rom_selection_core" },
      { label: "Honestly I've never examined what the spark correlates with", next: "rom_selection_core" },
    ],
  },

  rom_selection_core: {
    coach: [
      "Here's the mechanism, and it's not a character flaw — it's wiring.",
      "If your nervous system learned early that love comes with unpredictability, then unpredictability FEELS like love. Anxiety and excitement are chemically near-identical (adrenaline, dopamine spikes from intermittent reward). A partner who texts back reliably produces no adrenaline — so your body reports 'no chemistry', when what it means is 'no threat'.",
    ],
    insight: {
      title: "'Boring' is what safety feels like to a nervous system trained on chaos",
      technique: "Attachment theory · Interoception (psychosomatic)",
      source: "HealthyGamerGG (Dr. K on anxious attachment) · Dr. Judy Ho",
      body: "The 'spark' is often your threat-detection system firing — intermittent reward from an inconsistent person creates the strongest dopamine loops known to psychology (it's the slot-machine circuit). Meanwhile secure, available partners register as flat because nothing in you is bracing. You don't lack options among good partners; you have a selection filter calibrated to drama. Recalibrating it is slower than swiping, but it's the actual fix — and it starts with letting 'calm' get a fair trial instead of an instant rejection.",
      actions: [
        "Rename the feeling: next time you feel a huge instant spark, label it 'activation', not 'chemistry', and get curious about what triggered it.",
        "Give steady people a 3-date trial. Attraction to secure partners often builds slowly — it's a different curve, not a missing one.",
        "List your last 3 intense connections. Write what they had in common. Patterns you can see are patterns you can interrupt.",
        "Somatic check on dates: unclench, breathe low into the belly, and notice how you feel around this person — settled or vigilant? Choose settled more often, on purpose.",
      ],
    },
    options: [
      { label: "But won't settling for 'calm' mean settling, period?", next: "rom_selection_settle" },
      { label: "This reframes a lot. Back to the wheel.", next: "wheel" },
    ],
  },

  rom_selection_settle: {
    coach: [
      "Fair challenge — and no. 'Calm' isn't the compromise; it's the prerequisite.",
      "Passion built on safety deepens over years. Passion built on anxiety burns out the moment the uncertainty resolves — that's why those relationships die exactly when they 'should' be getting good. You're not lowering the bar. You're moving it from 'makes my heart race' to 'makes my life bigger', which is a much higher bar. Racing hearts are cheap; peace that stays exciting is rare.",
    ],
    options: [
      { label: "Okay. Giving calm a fair trial.", next: "wheel" },
      { label: "Explore another relationship topic", next: "relationships" },
    ],
  },

  rom_approach_anx: {
    coach: [
      "Freezing isn't shyness — it's your brain overpricing the outcome. It's treating one conversation like a verdict on your worth.",
      "CBT calls this catastrophising plus mind-reading: 'they'll think I'm weird' is a prediction, not a fact, made by the least objective witness available — your fear.",
    ],
    insight: {
      title: "Lower the stakes, raise the reps",
      technique: "CBT exposure ladder · Approach goals",
      source: "Charisma on Command · Dr. Judy Ho",
      body: "Confidence is downstream of evidence, and evidence comes from reps your fear predicted would go badly but didn't. Dr. Judy Ho's framing: switch from the avoidance goal ('don't get rejected') to an approach goal ('start one conversation today — outcome irrelevant'). Grade yourself on attempts, never on responses, because responses were never in your control anyway.",
      actions: [
        "Build a ladder: eye contact + smile → 'how's your day' to a stranger → a genuine compliment with no follow-up agenda → asking someone out. One rung per week.",
        "Before each rep, one slow exhale longer than the inhale — it's the fastest legal way to downshift your nervous system.",
        "Keep an evidence log: predicted disaster vs. what actually happened. Your fear's accuracy rate will embarrass it within two weeks.",
      ],
    },
    options: [
      { label: "Back to romantic topics", next: "rel_romantic" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  /* ---- In-relationship conflict --------------------------------------- */

  rom_conflict: {
    coach: [
      "Recurring clashes are almost never about the dishes. They're about what the dishes mean — feeling unseen, uncounted, unchosen.",
      "First, a body question, because your body enters the argument before you do: when a fight starts, what happens physically?",
    ],
    options: [
      { label: "Heat, tight chest, I get loud or sharp", next: "rom_conflict_hot" },
      { label: "I shut down, go quiet, leave the room in my head", next: "rom_conflict_cold" },
    ],
  },

  rom_conflict_hot: {
    coach: [
      "That heat is adrenaline — and here's the inconvenient physiology: once you're flooded, your prefrontal cortex (the part that negotiates) is mostly offline. Continuing the argument flooded is like driving on ice and steering harder.",
    ],
    insight: {
      title: "Regulate first, then DEARMAN",
      technique: "DBT · TIPP + DEARMAN · Somatic awareness",
      source: "DBT skills training · HealthyGamerGG",
      body: "Rule one: no important sentences while flooded. Call a 20-minute timeout (say you're coming back — leaving without that reads as abandonment). Downshift with TIPP: cold water on the face, brisk movement, paced breathing with long exhales. Then return and run DEARMAN: Describe the facts without spin, Express your feeling with 'I feel…', Assert one clear request, Reinforce how it helps you both, stay Mindful of the goal, Appear steady, Negotiate. One request per conversation — a list is an ambush.",
      actions: [
        "Agree on a timeout signal with your partner during peacetime, not mid-fight.",
        "Write your next DEARMAN before the conversation. Seriously — write it.",
        "Swap every 'you always' for one specific recent event. Global accusations get global defences.",
      ],
    },
    options: [
      { label: "What if they're the one who explodes?", next: "rom_conflict_cold" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  rom_conflict_cold: {
    coach: [
      "Shutting down feels like neutrality from the inside, but from the outside it reads as 'you're not worth the energy'. Stonewalling is one of the strongest predictors of relationships failing — not because silence is cruel, but because it leaves the other person alone with their story about it.",
    ],
    insight: {
      title: "Name the shutdown out loud",
      technique: "DBT interpersonal effectiveness · Opposite action",
      source: "DBT skills training · Gottman research (via Big Think)",
      body: "The upgrade isn't forcing yourself to engage while overwhelmed — it's narrating the state instead of disappearing into it: 'I'm shutting down and I don't want to. Give me 20 minutes and I'll come back to this.' That one sentence converts abandonment into teamwork. Opposite action applies too: the urge says withdraw entirely; do the opposite gently — stay in connection about the disconnection.",
      actions: [
        "Script the sentence now, while calm, and keep it: 'I'm flooding. 20 minutes. I'm coming back.'",
        "In the timeout, move your body; don't rehearse the argument. Rehearsal is just marinating.",
        "Come back on time even if you're not fully ready. Reliability is the message.",
      ],
    },
    options: [
      { label: "Back to romantic topics", next: "rel_romantic" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  rom_breakup: {
    coach: [
      "I'm sorry. Breakups register in the brain like withdrawal — same circuits as substance craving — so the obsessive thinking isn't weakness, it's neurochemistry doing exactly what it evolved to do.",
      "What's hitting hardest right now?",
    ],
    options: [
      { label: "I can't stop replaying everything", next: "rom_breakup_rumination" },
      { label: "The urge to text them is unbearable", next: "rom_breakup_urge" },
    ],
  },

  rom_breakup_rumination: {
    coach: [
      "Dr. K's take on rumination is the one that finally clicks for most people: your mind replays the relationship because it thinks there's a puzzle to solve — as if finding the exact moment it broke would un-break it. But rumination isn't processing. Processing has feelings in it; rumination is analysis on loop, and it's a way of NOT feeling the loss.",
    ],
    insight: {
      title: "Feel it once, fully — instead of thinking it a thousand times",
      technique: "Emotional processing · Rumination interruption",
      source: "HealthyGamerGG (Dr. K) · DBT",
      body: "Give grief a scheduled appointment: 20 minutes a day where you deliberately feel it — journal, cry, sit with the body sensations, no fixing allowed. When the replay starts outside that window, note 'that's the loop, not new information' and redirect to something with your hands in it. The loss doesn't need to be solved. It needs to be felt on purpose so it stops ambushing you.",
      actions: [
        "Set the 20-minute grief window daily. In it, write feelings, not analysis.",
        "Outside the window: name it ('looping'), then a physical task — walk, cook, shower.",
        "Write the unsendable letter. Everything. Then don't send it. That letter was for you.",
      ],
    },
    options: [
      { label: "And the urge to contact them?", next: "rom_breakup_urge" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  rom_breakup_urge: {
    coach: [
      "That urge is a craving, and cravings have a physiology: they surge, peak in 15–20 minutes, and fall — IF you don't feed them. Every text you don't send makes the next urge measurably weaker. Every 'harmless' check-in resets the whole withdrawal clock to day one.",
    ],
    insight: {
      title: "Urge-surf the text",
      technique: "DBT distress tolerance · Urge surfing",
      source: "DBT skills training · HealthyGamerGG",
      body: "Treat the urge like a wave you can watch instead of a command you must obey. Name it ('craving contact, ~8/10'), set a 20-minute timer, put the body somewhere else — walk, shower, cold water on the wrists. Where does the urge sit physically? Chest? Hands? Watch it crest and drop. You're not resisting forever; you're outlasting one wave, and the waves get smaller. They just do.",
      actions: [
        "Delete or bury the thread so texting takes effort. Friction is a real tool.",
        "Pre-write what you'd want to say into your notes app instead. Same release, no reset.",
        "Tell one friend to be your 'call before texting the ex' person. Externalise the brake.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  rom_stayleave: {
    coach: [
      "The hardest one. Let's not answer it directly — let's get your Wise Mind into the room first, because right now the decision is being argued by two unreliable lawyers: fear of loneliness and fantasy of relief.",
      "Answer this quietly, body first: when you imagine — really imagine — waking up in this relationship five years from now, unchanged… what does your body do?",
    ],
    options: [
      { label: "Something sinks. Heaviness, dread.", next: "rom_leave_lean" },
      { label: "It's mostly okay — it's specific fights that wreck us", next: "rom_stay_lean" },
    ],
  },

  rom_leave_lean: {
    coach: [
      "Notice that your body answered before your reasons did. That sinking is data — psychosomatic signals often know months before the mind admits it. It doesn't make the decision for you, but it belongs in the evidence.",
    ],
    insight: {
      title: "The 5-year body test",
      technique: "Wise Mind (DBT) · Somatic awareness · 10/10/10",
      source: "DBT · Big Think (Suzy Welch's 10/10/10)",
      body: "Fear of leaving usually wears three disguises: sunk cost ('but the years we've invested'), catastrophised loneliness ('I'll never find anyone'), and caretaking guilt ('they'll fall apart'). None of these are reasons to stay — they're reasons leaving is hard, which is a different thing. Run 10/10/10: in 10 minutes, leaving feels terrifying; in 10 months, most people report relief they postponed for years; in 10 years, staying somewhere your body sinks is the outcome people actually call regret.",
      actions: [
        "Separate two lists: 'reasons to stay' vs. 'reasons leaving is scary'. Watch items migrate to the second list.",
        "If there are fixable things, name the concrete change, request it once clearly (DEARMAN), and set a real timeframe. Vague hope is not a plan.",
        "Talk to one person who left a long relationship and one who stayed and rebuilt. Borrow their hindsight.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
      { label: "How do I even have that conversation?", next: "rom_conflict_hot" },
    ],
  },

  rom_stay_lean: {
    coach: [
      "That's genuinely useful information: the foundation reads as sound, the conflict pattern doesn't. Those are different problems — and the second one is very trainable. Most couples never learn to fight well because nobody taught them; it's a skill gap, not a compatibility verdict.",
    ],
    options: [
      { label: "Teach me the conflict tools", next: "rom_conflict" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  /* ---- Friendships ----------------------------------------------------- */

  rel_friends: {
    coach: ["Friendships — chronically underrated, quietly load-bearing. What's going on?"],
    options: [
      { label: "I'm lonely / my circle has shrunk", next: "fri_lonely" },
      { label: "A friendship feels one-sided or draining", next: "fri_onesided" },
    ],
  },

  fri_lonely: {
    coach: [
      "First: adult loneliness is a logistics problem before it's a likability problem. School and university handed you repeated, unplanned contact for free. Adulthood doesn't — so friendships stopped forming, and your brain wrongly filed that as 'something's wrong with me'.",
    ],
    insight: {
      title: "Friendship = frequency × vulnerability, engineered on purpose",
      technique: "Behavioural activation (CBT) · Approach goals",
      source: "Charisma on Command · Dr. Judy Ho · Big Think (research on repeated exposure)",
      body: "The research is unromantic: close friendship takes roughly 100–200 hours of shared time, and it forms through repetition plus escalating realness. So the move is structural — join things that meet weekly (the same people, again and again), and be the one who escalates: from banter, to real talk, to 'we should grab food'. Someone has to go first. Charisma on Command's data point: the person who initiates is remembered as the likable one, not the needy one.",
      actions: [
        "Pick one weekly recurring thing — sport, class, club, volunteering. Recurring is the whole trick.",
        "Reactivate one dormant friendship today with a zero-pressure message. Dormant ties respond far more warmly than fear predicts.",
        "Use the 24-hour rule: met someone promising? Follow up within a day, or the thread dies.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
      { label: "Relationships menu", next: "relationships" },
    ],
  },

  fri_onesided: {
    coach: [
      "Before labelling them a bad friend, run the covert-contract check on yourself too: did you ever actually SAY what you needed, or did you give and silently invoice them?",
      "Either way, the test is the same: name it once, directly, kindly — then watch what they do with the information.",
    ],
    insight: {
      title: "One direct ask beats a year of silent scorekeeping",
      technique: "DEARMAN · Covert contract audit",
      source: "DBT · Dr. Judy Ho",
      body: "'Hey — I've noticed I'm usually the one reaching out. I value this friendship, that's why I'm mentioning it rather than fading. Can you meet me halfway?' That's the whole script. A real friend course-corrects, maybe imperfectly. Someone who gets defensive or changes nothing has also answered you — and an honest answer, either way, beats years of resentful maintenance of a friendship that only exists when you carry it.",
      actions: [
        "Send one honest, blame-free message this week. Describe the pattern, not their character.",
        "Then experiment: stop initiating for a few weeks. Not as punishment — as data collection.",
        "Reinvest whatever energy comes back into the people who reciprocate. Attention is a budget.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  /* ---- Family ----------------------------------------------------------- */

  rel_family: {
    coach: ["Family — where every button you have was originally installed. What fits best?"],
    options: [
      { label: "I can't set boundaries without guilt", next: "fam_boundaries" },
      { label: "Every visit turns into the same argument", next: "fam_argument" },
    ],
  },

  fam_boundaries: {
    coach: [
      "The guilt is the boundary working. Read that again — it's the most useful sentence in this whole branch.",
      "If you were trained (even lovingly) that your job is managing your family's emotions, then any act of self-protection will fire the guilt alarm. Guilt here isn't evidence you did wrong; it's evidence you did something NEW.",
    ],
    insight: {
      title: "Guilt is the exit fee, not the verdict",
      technique: "DBT boundaries · Cognitive defusion (ACT)",
      source: "HealthyGamerGG (Dr. K on enmeshment) · Dr. Judy Ho",
      body: "A boundary is not a demand that they change — it's a statement of what YOU will do: 'If the criticism starts, I'm going to head out, and I'll see you next week.' Calm, pre-decided, repeatable. They may escalate at first (extinction burst — it's textbook and it passes). Your job isn't to make them like the boundary; it's to survive their disappointment without folding. Each time you do, the guilt gets quieter. That's the whole training arc.",
      actions: [
        "Write the boundary as an if-then about your own behaviour, and rehearse saying it in a boring, weather-report tone.",
        "Pre-decide your response to the pushback ('you've changed', tears, silence). Surprise is what breaks boundaries.",
        "After enforcing it, do NOT over-explain. Explanations are negotiations in disguise.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
      { label: "The recurring-argument one too, please", next: "fam_argument" },
    ],
  },

  fam_argument: {
    coach: [
      "Recurring family arguments are usually a ritual, not a disagreement — both sides know their lines. Which means you can unilaterally quit the play: the argument needs your usual role to run.",
    ],
    insight: {
      title: "Refuse your role in the script",
      technique: "Pattern interruption · Opposite action",
      source: "DBT · Big Think (conflict research)",
      body: "Map the ritual: they say X, you defend, they escalate, doors close. Now change YOUR line only. Instead of defending, try genuine curiosity ('what worries you most about it?') or agreement-with-a-twist ('you might be right, I'll think about that') — and watch the machine stall without fuel. You're not conceding the point; you're declining the choreography. One person changing their step really does change the dance, because the dance was built for two.",
      actions: [
        "Write out the script of your last three arguments. Notice it's the same script.",
        "Choose one replacement line and use it next visit. Keep your tone soft; content follows tone.",
        "Set a visit duration you can succeed at. Two good hours beat six that curdle.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  /* ============================ CAREER ================================= */

  career: {
    coach: ["Work. Where a third of your waking life goes — worth deciding well. What's live for you?"],
    options: [
      { label: "Should I quit my job?", next: "car_quit" },
      { label: "Passion vs. money / 'safe' path", next: "car_passion" },
      { label: "I think I'm burning out", next: "car_burnout" },
      { label: "I feel behind everyone my age", next: "mind_compare" },
    ],
  },

  car_quit: {
    coach: [
      "Big one. Before any framework — the somatic check, because your body files reports your mind ignores: Sunday evening, work tomorrow. What happens in your chest?",
    ],
    options: [
      { label: "Dread. Real, physical dread.", next: "car_quit_dread" },
      { label: "Not dread — more like restlessness / flatness", next: "car_quit_flat" },
    ],
  },

  car_quit_dread: {
    coach: [
      "Chronic Sunday dread isn't a personality trait — it's your body billing you for a mismatch. But dread says 'change something', not necessarily 'resign tomorrow'. Let's make the decision properly instead of in a 2am spiral.",
    ],
    insight: {
      title: "Decide at 80, act at 30 days",
      technique: "Regret minimisation · Fear-setting · 10/10/10",
      source: "Ali Abdaal · Tim Ferriss (via Big Think) · Jeff Bezos",
      body: "Two exercises, one hour, pen and paper. (1) Regret minimisation: you're 80, looking back — which do you regret, the scary leap or the safe decade? People overwhelmingly regret inaction. (2) Fear-setting: define the worst case precisely, how you'd prevent it, and how you'd recover. Fear does its damage as fog; it shrinks dramatically when given exact edges. Then note this: quitting is rarely binary. Interview elsewhere while employed, negotiate a change internally, build the exit skill at nights. The brave move and the reckless move are not the same move.",
      actions: [
        "Do fear-setting on paper tonight: worst case / prevent / recover. Fog → edges.",
        "Update the CV and take two interviews. Options change your psychology even if you stay.",
        "Set a decision deadline (e.g. 60 days). Open loops corrode; deadlines conclude.",
        "10/10/10 the stay-option too — staying is also a decision with a 10-year cost.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
      { label: "It might actually be burnout, not the job", next: "car_burnout" },
    ],
  },

  car_quit_flat: {
    coach: [
      "Flatness is a different diagnosis than dread — and it matters, because people quit good jobs to escape a flatness that follows them to the next one.",
      "Ali Abdaal's feel-good-productivity lens asks: is the job bad, or has it just gone stale — no growth edge, no play, no autonomy? Those three are usually what died, and sometimes they can be revived where you stand, cheaper than a resignation.",
    ],
    insight: {
      title: "Audit the job before you leave it",
      technique: "Energy audit · Job-craft experiment",
      source: "Ali Abdaal (Feel-Good Productivity) · Big Think (Cal Newport)",
      body: "For two weeks, log energy: which tasks and people leave you fuller, which drain you. Then run one deliberate experiment — negotiate toward the energising work, start the slightly-too-hard project, mentor someone, automate the boring part. If the role responds, you just saved yourself a lateral move into identical flatness. If it can't respond — the audit becomes your spec sheet for what to look for next. Either way you leave (or stay) with data instead of a mood.",
      actions: [
        "Two-week energy log: note +/− after each block of work. Patterns appear fast.",
        "Pick ONE job-craft experiment and run it for a month before any resignation letter.",
        "Ask: 'what would make this role a 9/10?' If the answer is 'nothing available here', that's your real answer.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
      { label: "The passion-vs-safety question, then", next: "car_passion" },
    ],
  },

  car_passion: {
    coach: [
      "'Follow your passion' is the most expensive advice ever given for free — because it implies passion is a pre-existing thing you FIND. The evidence says otherwise.",
      "Cal Newport's research (all over Big Think) and Ali Abdaal's whole arc agree: passion is mostly a by-product of getting good. Competence → autonomy → mattering → the feeling everyone calls passion. It's grown, not found.",
    ],
    insight: {
      title: "Don't follow passion — build career capital, then trade it",
      technique: "Career capital model · Regret minimisation",
      source: "Cal Newport (via Big Think) · Ali Abdaal",
      body: "The false binary is 'soul-dead stable job' vs. 'leap into the dream'. The robust third option: keep the income, go all-in on rare-and-valuable skill in the direction you're drawn to, on the side, for 6–12 months. Skill compounds into leverage; leverage buys autonomy; autonomy is what people actually want when they say 'passion'. And the side-bet gives you real data — many discover the dream is a hobby (great to know cheaply!), others build the bridge and walk across it without ever white-knuckling a cliff-jump.",
      actions: [
        "Define the 6–12 month side-bet: what skill, what output, what proof-of-work (portfolio, clients, audience).",
        "Timebox it: 5 focused hours a week beats 40 fantasy hours.",
        "Set the review date now, with criteria written down: what result would justify going further?",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
      { label: "What if I don't even know what direction I'm drawn to?", next: "pur_lost" },
    ],
  },

  car_burnout: {
    coach: [
      "Important distinction first, courtesy of Dr. K: exhaustion from doing too much heals with rest. Burnout — cynicism, detachment, 'nothing I do matters' — does NOT heal with a holiday, which is why you come back from leave still empty. Burnout is less about workload than about efficacy and meaning drought.",
      "Which is it, honestly?",
    ],
    options: [
      { label: "Tired — a real break might actually fix me", next: "car_burnout_rest" },
      { label: "Cynical and detached. Holidays don't touch it.", next: "car_burnout_deep" },
    ],
  },

  car_burnout_rest: {
    coach: [
      "Then the assignment is unglamorous: actual rest, taken seriously, before it graduates into the other kind. And 'rest' means the nervous-system kind — not doomscrolling in bed while feeling guilty about resting.",
    ],
    insight: {
      title: "Rest is a skill with a technique",
      technique: "Parasympathetic recovery · Boundaries",
      source: "HealthyGamerGG · Ali Abdaal",
      body: "Screens-and-guilt is fake rest; your stress system stays lit. Real recovery needs: sleep made non-negotiable for two weeks, movement that isn't punishment, time outdoors, and at least one full day with zero productivity obligations — logged out, actually. Protect it like a meeting with someone important, because it is.",
      actions: [
        "Book the recovery day(s) in the calendar now. Unbooked rest doesn't happen.",
        "Two-week sleep protocol: fixed wake time, screens out of the last hour.",
        "One session of movement you'd do even if it burned zero calories.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  car_burnout_deep: {
    coach: [
      "Then hear this clearly: more discipline will make it worse. Deep burnout is a meaning problem wearing an energy costume — the tank isn't empty because you worked hard, it's empty because nothing refills it.",
    ],
    insight: {
      title: "Refill efficacy, not just energy",
      technique: "Behavioural activation · Values reconnection (ACT)",
      source: "HealthyGamerGG (Dr. K on burnout) · Dr. Judy Ho",
      body: "Burnout's core lesion is 'my effort doesn't matter'. The repair is small, visible, chosen impact: one project (at work or outside it) where you can see cause and effect again — help one person, build one small thing, fix one broken process. Pair it with subtraction: list what drains you most and negotiate one real reduction. And if the environment is the lesion — chronic disrespect, impossible targets — name that honestly: you can't self-care your way out of a meat grinder. That's the quit-question, and it deserves the full treatment.",
      actions: [
        "Start one small cause-and-effect project this week. Visible outcome, short loop.",
        "Name your top drain and make one concrete ask to reduce it (DEARMAN works at work too).",
        "If detachment persists past a month of this, take the quit-question seriously — and consider talking to a professional; burnout and depression overlap and a clinician can tell them apart.",
      ],
    },
    options: [
      { label: "Take me to the quit question", next: "car_quit" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  /* ============================= MONEY ================================= */

  money: {
    coach: ["Money decisions — where psychology does most of the spending. What's yours?"],
    options: [
      { label: "I want to buy something big (car, watch, upgrade…)", next: "mon_bigbuy" },
      { label: "I keep impulse-spending", next: "mon_impulse" },
      { label: "Money anxiety, even when I'm technically fine", next: "mon_anxiety" },
    ],
  },

  mon_bigbuy: {
    coach: [
      "Ah, the big purchase. Let's do this properly — I'm not here to tell you no. I'm here to make sure the thing you buy actually delivers the feeling you're buying it FOR.",
      "So, first question, and be honest: when you imagine owning it, what's the feeling in the fantasy?",
    ],
    options: [
      { label: "The thrill — it would just feel amazing", next: "mon_bigbuy_hedonic" },
      { label: "Status — people would see me differently", next: "mon_bigbuy_status" },
      { label: "It solves a real daily problem", next: "mon_bigbuy_utility" },
    ],
  },

  mon_bigbuy_hedonic: {
    coach: [
      "Here's the single most useful finding in the happiness literature, and almost nobody prices it in:",
      "You will adapt. Completely. The Ferrari is euphoric for weeks, thrilling for months — and then it's 'my car'. Same commute, same you, plus insurance. Lottery-winner studies show happiness returning to baseline within about a year. Your brain is a difference-detector: it only feels what's NEW, and ownership makes things permanently not-new.",
    ],
    insight: {
      title: "You're buying a feeling that has a half-life",
      technique: "Hedonic adaptation · 10/10/10",
      source: "Dan Gilbert (via Big Think) · HealthyGamerGG · lottery/adaptation research",
      body: "This isn't anti-Ferrari — it's pro-arithmetic. Adaptation-resistant purchases exist, and research is consistent about what they are: experiences (they end before you adapt, then appreciate in memory), anticipation (booking a trip pays happiness for months in advance), buying back time (outsourcing what you hate), and shared consumption (things enjoyed with people resist adaptation because people keep changing). If the money is truly spare after that — rent the Ferrari for a weekend. You'll capture 90% of the peak feeling for 2% of the price, and the peak was the product all along.",
      actions: [
        "Run 10/10/10: the thrill at 10 minutes, the payment at 10 months, the verdict at 10 years.",
        "Rent-before-buy rule for any object over a month's income. Test the fantasy at retail.",
        "Redirect a slice into an experience with people you love, booked far in advance — you get the anticipation dividend for free.",
        "30-day cooling-off list for the rest. If you still want it on day 30 (most things don't survive), buy it guilt-free.",
      ],
    },
    options: [
      { label: "Honestly it might be a status thing too…", next: "mon_bigbuy_status" },
      { label: "Convinced. Back to the wheel.", next: "wheel" },
    ],
  },

  mon_bigbuy_status: {
    coach: [
      "Respect for admitting it — status motives are universal and lying about them is how they run the show.",
      "Two problems though. One: nobody thinks about your car remotely as much as you think they do (the spotlight effect — it's robust and it's humbling). Two: status bought off a shelf is status anyone with credit can copy, which is why it never quite lands.",
    ],
    insight: {
      title: "Earned status sticks; purchased status leaks",
      technique: "Spotlight effect (CBT) · Values check",
      source: "Big Think (social psychology) · Charisma on Command",
      body: "The admiration people actually give — and can't withdraw when the model year changes — attaches to competence, generosity, and presence: being visibly excellent at something, being the person who helps, being magnetic in a room. Charisma on Command's whole catalogue is this point: status is granted to how you make people feel, not to what you park. If the deeper wish is 'I want to feel respected', the object is a proxy — and proxies are exactly what we hedonically adapt to fastest.",
      actions: [
        "Finish the sentence honestly: 'I want people to think I'm ____.' Then ask what actually earns that adjective.",
        "Invest a chunk of the purchase price into the skill or body of work that earns it for real.",
        "Try the flex-audit: recall the last three status purchases by OTHER people that changed your opinion of them. Struggling? So is everyone about yours.",
      ],
    },
    options: [
      { label: "Show me the hedonic-adaptation piece too", next: "mon_bigbuy_hedonic" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  mon_bigbuy_utility: {
    coach: [
      "Genuine utility is the good reason to buy things — daily-use quality is the one category people systematically UNDER-spend on while over-spending on peacocks. Mattress, chair, tools of your trade: cost-per-use math usually blesses these.",
    ],
    insight: {
      title: "Cost-per-use is the honest price tag",
      technique: "Cost-per-use analysis · 30-day rule",
      source: "Ali Abdaal · consumer research via Big Think",
      body: "Divide price by realistic uses over its life. The €1,200 office chair you sit in 2,000 hours a year costs pennies per hour; the €300 gadget used twice costs €150 a use. One caveat before checkout: confirm it solves a problem you actually HAVE, not one the marketing installed last week — the 30-day list catches those. If it survives the wait and the math, buy the good one once, without guilt.",
      actions: [
        "Compute cost-per-use with pessimistic usage estimates.",
        "30 days on the list. Still needed? Buy quality, once.",
        "Check: was this a problem before I saw the ad?",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  mon_impulse: {
    coach: [
      "Impulse spending is rarely about the items — you're buying a mood exit. Dr. K's framing: the purchase is a dopamine lever you pull when something else feels bad. The package arriving is the same lever. The item itself? Often barely opened.",
      "Quick check: when the urge hits, what usually just happened?",
    ],
    options: [
      { label: "Stress, boredom, or a bad feeling I want gone", next: "mon_impulse_core" },
      { label: "No pattern — it just… happens", next: "mon_impulse_core" },
    ],
  },

  mon_impulse_core: {
    coach: [
      "('It just happens' is a pattern you haven't logged yet — the log below will find it.)",
      "The good news: craving has a shape. It spikes, peaks, and collapses within about 15–20 minutes if unfed. Every urge you surf instead of obey literally retrains the circuit.",
    ],
    insight: {
      title: "Add friction, surf the spike, feed the real need",
      technique: "Urge surfing (DBT) · Stimulus control (CBT)",
      source: "HealthyGamerGG · DBT skills · Dr. Judy Ho",
      body: "Three layers. Friction: delete saved cards, remove shopping apps, unsubscribe from the temptation feeds — every added step lets the urge peak before checkout. Surfing: when it hits, name it ('urge, 7/10'), start a 20-minute timer, and watch it as a body sensation instead of a command. Root cause: log what preceded each urge for two weeks; then give the real trigger a real answer (stress → walk or shower; boredom → an actual hobby with your hands; loneliness → a message to a friend). The cart was answering a question — answer it directly and the cart goes quiet.",
      actions: [
        "Tonight: remove saved payment methods and the two worst apps.",
        "Wishlist rule — everything waits 30 days on a list. It's astonishing what evaporates.",
        "Two-week trigger log: time, feeling, what happened just before.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  mon_anxiety: {
    coach: [
      "Money anxiety that ignores your bank balance isn't a math problem — it's a felt-safety problem, often installed young. Your amygdala doesn't read spreadsheets.",
    ],
    insight: {
      title: "Give the fear numbers and a floor",
      technique: "CBT decatastrophising · Somatic regulation",
      source: "CBT protocols · Dr. Judy Ho",
      body: "Anxiety thrives on vagueness, so make everything specific. Write the actual worst case with numbers: if income stopped today, how many months does the runway hold? What exactly would you cut, sell, or do? Almost everyone finds the concrete floor is far above the imagined abyss. Then automate safety so it accrues without daily vigilance — auto-transfer to an emergency fund, then STOP checking accounts more than weekly (checking is a compulsion that feeds the loop, like re-checking a locked door). And when the wave hits anyway: it's a body event — long exhales, cold water, movement — not a signal to re-run the spreadsheet at 1am.",
      actions: [
        "Write the numeric worst case + response plan. Fog → floor.",
        "Automate the emergency-fund transfer, even if small. Automatic beats anxious.",
        "Cap account-checking at once a week. Notice the urge, surf it.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  /* ============================= HABITS ================================ */

  habits: {
    coach: ["Habits and health — where decisions become a body. What's the sticking point?"],
    options: [
      { label: "I can't stick to anything (gym, diet, routines)", next: "hab_stick" },
      { label: "I'm losing hours to scrolling / gaming", next: "hab_dopamine" },
      { label: "I procrastinate the things that matter most", next: "hab_procrast" },
    ],
  },

  hab_stick: {
    coach: [
      "First, absolution: quitting habits isn't a willpower deficiency. Dr. Judy Ho's work on self-sabotage shows the usual culprit is the goal's ARCHITECTURE — avoidance-framed, identity-less, and sized for your most motivated day instead of your worst one.",
    ],
    insight: {
      title: "Shrink it, approach-frame it, tie it to identity",
      technique: "Approach goals · Tiny habits · Identity-based change",
      source: "Dr. Judy Ho · Ali Abdaal · behavioural science via Big Think",
      body: "Three fixes. (1) Approach, not avoidance: 'train 3× a week' aims your brain somewhere; 'stop being lazy' just points it at the fear. (2) Size for your worst day: the habit is the floor version — two minutes of exercise, one sentence of journaling. Consistency builds the neural groove; intensity can visit later. (3) Vote for an identity: every rep is evidence for 'I'm someone who trains', and identity is what remains when motivation (which is weather, not climate) inevitably leaves. Missing a day is data; missing twice is the start of a new habit — the never-twice rule is the entire game.",
      actions: [
        "Rewrite your goal in approach language, sized so your worst day can still do it.",
        "Anchor it to an existing routine: after [coffee], I do [the floor version].",
        "Adopt never-twice: miss once freely, never twice in a row.",
        "Say the identity out loud when you do it: 'I'm a person who shows up.' Corny. Works.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
      { label: "The scrolling problem is related, honestly", next: "hab_dopamine" },
    ],
  },

  hab_dopamine: {
    coach: [
      "Dr. K's frame is the honest one: the scrolling isn't the problem — it's the SOLUTION your brain found to a problem you haven't named yet. Discomfort appears (boredom, anxiety, loneliness, a task you're dreading), and the phone deletes it in under a second. That's not weakness; that's the most efficient relief button ever engineered, in your pocket, always.",
    ],
    insight: {
      title: "Compete with the phone, don't just fight it",
      technique: "Dopamine hygiene · Urge surfing · Stimulus control",
      source: "HealthyGamerGG (Dr. K) · Ali Abdaal",
      body: "Three fronts. Friction: grayscale, no phone in the bedroom, apps logged-out — every second of delay lets the prefrontal cortex catch up to the impulse. Substitution: the hours must go somewhere with real feedback — an instrument, a sport, making anything; boredom with no alternative always loses to the feed. Tolerance training: schedule small doses of doing absolutely nothing (a 10-minute walk, no audio) so mild discomfort stops being an emergency your phone must fix. The urge spikes hardest on day 2–3 and fades in weeks. The quiet that follows is the actual reward.",
      actions: [
        "Tonight: phone charges outside the bedroom. This one change carries half the results.",
        "Grayscale on, worst two apps logged out or deleted (they'll survive — you can reinstall).",
        "Pick the substitution activity and schedule it where the scroll-hours lived.",
        "One 10-minute nothing-walk daily: no phone, no audio. It's a training rep for your attention.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  hab_procrast: {
    coach: [
      "The research reframe that changes the whole fight: procrastination is not a time-management problem — it's an EMOTION-management problem. You're not avoiding the task; you're avoiding a feeling the task triggers (overwhelm, fear of doing it badly, boredom, resentment).",
      "Ali Abdaal's version: motivation follows action, not the other way around. Waiting to feel ready is waiting for a train that departs only after you start walking.",
    ],
    insight: {
      title: "Name the feeling, shrink the start",
      technique: "Emotion labelling · 5-minute rule · Feel-good productivity",
      source: "Ali Abdaal · CBT · Dr. Judy Ho",
      body: "Step one: ask 'what feeling am I dodging?' — naming it (affect labelling) measurably reduces its charge. Step two: make the start laughably small — open the document, write one ugly sentence, put on the gym shoes. Commit to five minutes with full permission to stop; the discomfort peaks BEFORE you begin, so starting is genuinely the hardest part and momentum does the rest. Step three: lower the stakes — first drafts are allowed to be bad; 'done then better' beats 'perfect but imaginary'. And if one task has survived weeks of this: it's telling you something. Renegotiate it, delegate it, or admit it's not actually yours to do.",
      actions: [
        "Before the next avoided task: name the feeling out loud, then set a 5-minute timer.",
        "Define 'ridiculously done' for step one (one sentence, one email, one set).",
        "Eat the frog: the avoided thing goes FIRST tomorrow, before the inbox eats the will.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  /* ========================== MIND & EMOTIONS ========================== */

  mind: {
    coach: ["The inner weather. What's the pattern?"],
    options: [
      { label: "I overthink every decision into paralysis", next: "mind_overthink" },
      { label: "Anxiety lives in my body — chest, gut, jaw", next: "mind_soma" },
      { label: "My self-talk is brutal", next: "mind_selftalk" },
      { label: "I compare myself to everyone and lose", next: "mind_compare" },
    ],
  },

  mind_overthink: {
    coach: [
      "Barry Schwartz's paradox-of-choice research (Big Think favourite) has your diagnosis: maximisers — people who must find THE best option — end up objectively slightly better off and subjectively much more miserable than satisficers, who define 'good enough' in advance and take the first option that clears the bar.",
      "And here's the kicker: for most decisions, the options differ by 10%, but the agonising costs you 90% of the peace.",
    ],
    insight: {
      title: "Satisfice on purpose; save maximising for the few that deserve it",
      technique: "Satisficing · Wise Mind · Decision triage",
      source: "Barry Schwartz (via Big Think) · DBT",
      body: "Triage your decisions: Type 1 (reversible, low-stakes — most of them) get a timer and 'good enough' criteria written BEFORE you look at options; first option that clears the bar wins, no re-litigating. Type 2 (rare, irreversible, high-stakes) get the full treatment — 10/10/10, fear-setting, sleeping on it. The overthinking loop itself is emotion-mind wearing a lab coat: it feels like diligence but it's anxiety doing laps. When you catch the third re-analysis of the same options, that's Wise Mind's cue: 'I already know enough. What do I already know?'",
      actions: [
        "For the current decision: write the 'good enough' bar in one sentence, then a deadline.",
        "The 37% heuristic for option streams (flats, candidates): survey the first chunk without committing, then take the next one better than everything seen.",
        "Notice re-analysis #3 and name it: 'this is anxiety, not analysis'. Then decide.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
      { label: "The anxiety is more physical for me", next: "mind_soma" },
    ],
  },

  mind_soma: {
    coach: [
      "Then let's start where the anxiety actually lives. Psychosomatic isn't 'imaginary' — it's the opposite: emotions are body events FIRST. The thought 'something is wrong' is often your mind writing a caption for a clenched gut that started for physical reasons (bad sleep, caffeine, shallow breathing).",
      "Which means you have a lever most people never use: regulate the body, and watch the thoughts lose their sponsor.",
    ],
    insight: {
      title: "The body is the front door",
      technique: "Somatic regulation · TIPP (DBT) · Interoception",
      source: "DBT skills · HealthyGamerGG · polyvagal-informed practice",
      body: "Fast levers, in order of speed: (1) Exhale longer than you inhale — 4 in, 8 out, ten rounds; it's the vagus-nerve brake pedal and it works mid-meeting, invisibly. (2) Cold water on face/wrists — triggers the dive reflex, drops heart rate in seconds (the T and I of DBT's TIPP). (3) Ground through the senses: 5 things you see, 4 feel, 3 hear, 2 smell, 1 taste — it yanks attention out of the doom-simulator and into the room, where things are usually fine. Then, calm-ish, ask the caption question: 'is this signal about something real I should act on — or is it just weather?' Act on signals. Let weather pass. And do the maintenance: sleep, movement, and less caffeine remove half the false alarms at the source.",
      actions: [
        "Learn 4-8 breathing NOW while calm — skills practised calm are the only ones available panicked.",
        "Body-scan before big decisions: jaw, shoulders, chest, gut. Decisions made mid-adrenaline get regretted.",
        "Audit the false-alarm factories: caffeine after noon, sleep debt, zero movement.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  mind_selftalk: {
    coach: [
      "Quick experiment: say the last brutal thing you told yourself — 'you're pathetic, you always ruin it' — but imagine saying it to your best friend after THEY failed at the same thing.",
      "You wouldn't. Not because you'd be lying to them, but because it's neither true nor useful. Yet you're a permanent audience to a voice using standards you'd never inflict on anyone you love.",
    ],
    insight: {
      title: "Cross-examine the critic",
      technique: "CBT thought records · Self-compassion · Cognitive defusion",
      source: "CBT protocols · Dr. Judy Ho · HealthyGamerGG",
      body: "The critic survives on two myths: that it's TRUE (it's usually a cocktail of all-or-nothing thinking, mind-reading and overgeneralisation — literal named distortions), and that it's NECESSARY ('without me you'd get lazy'). The research says the opposite: self-compassion outperforms self-criticism on motivation and recovery from failure, because people who aren't terrified of their own inner verdict take more risks and persist longer. Practice: catch the thought, name its distortion, then answer it like you'd answer about a friend — honest, kind, specific. Not 'I'm amazing' (your brain rejects propaganda), but 'I handled that badly AND I've handled worse better AND here's the next step.'",
      actions: [
        "One-line thought record for a week: trigger → harsh thought → distortion name → friend-version.",
        "Give the critic a slightly ridiculous name. 'Ah, Gerald has notes again.' Defusion through absurdity works.",
        "After any failure, mandatory question: 'what would I tell my best friend right now?' Then take your own advice.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  mind_compare: {
    coach: [
      "The comparison game has a rigged scoreboard: you compare your INSIDES — doubts, drafts, 3am fears — against everyone else's OUTSIDES, which are curated highlight reels. You will lose every round, because you're the only contestant whose bloopers you've seen.",
      "And Dr. K adds the darker mechanic: comparison isn't just painful, it's a dopamine loop — checking how you rank gives a hit (or a wound) that demands re-checking.",
    ],
    insight: {
      title: "Compare down the timeline, not across the feed",
      technique: "Social comparison theory · Values redirect (ACT)",
      source: "Big Think (social psychology) · HealthyGamerGG · Ali Abdaal",
      body: "The only comparison with clean data is you-versus-you-a-year-ago: same subject, full information, actionable delta. Everything else is measurement error. Practical layer: mute (not unfollow — no drama needed) the five accounts that reliably leave you worse, and notice the 'behind' feeling assumes a race with a single track — behind WHOSE schedule, toward WHOSE finish line? The feeling of 'behind' is usually unexamined borrowed goals. Define yours, and half the racers disappear because they were never running your race.",
      actions: [
        "Write your one-year-ago comparison honestly: skills, relationships, self-knowledge. That delta is yours.",
        "Mute the worst five accounts tonight. Check the mood difference in a week.",
        "Finish: 'If no one could see my life, I would still want ____.' That list is your actual race.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
      { label: "That last question hit — the purpose stuff", next: "pur_lost" },
    ],
  },

  /* ============================= PURPOSE =============================== */

  purpose: {
    coach: ["The big-picture questions. Which one is loudest?"],
    options: [
      { label: "I feel directionless — no idea what I want", next: "pur_lost" },
      { label: "I achieved the goals… and feel nothing", next: "pur_arrival" },
      { label: "Life feels like pleasure-seeking with no meaning", next: "pur_pleasure" },
    ],
  },

  pur_lost: {
    coach: [
      "First, Dr. K's reframe, because it removes the panic: 'finding your purpose' is a broken question. Purpose isn't an object hidden somewhere you haven't looked — it's a by-product of engagement. You don't find it and then act; you act, and purpose condenses out of the acting, like warmth from motion.",
      "Which means directionless isn't a knowledge problem. It's a contact problem — not enough collisions with reality lately.",
    ],
    insight: {
      title: "Purpose is discovered in motion, not in thought",
      technique: "Behavioural activation · Values sort (ACT) · Curiosity-following",
      source: "HealthyGamerGG (Dr. K) · Ali Abdaal · Big Think",
      body: "You cannot think your way to purpose from the sofa — introspection without new input just reshuffles old data. The protocol: follow curiosity at a small scale (curiosity is values leaking through — it's the trailhead, not a distraction), run cheap experiments (a class, volunteering, building one small thing, helping one person), and review what created aliveness versus what merely killed time. Watch especially for what Dr. K calls the direction of service: purpose reliably lives where your energy meets someone else's need. Meaning is almost always about being useful to something beyond your own comfort.",
      actions: [
        "List 3 things you're mildly curious about. Book the cheapest possible real-world contact with each this month.",
        "Weekly review, two columns: 'made me feel alive' / 'passed the time'. Follow column one.",
        "Help one specific person with something you're decent at. Note how it lands in your body.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
      { label: "Related: pleasure isn't filling the hole", next: "pur_pleasure" },
    ],
  },

  pur_arrival: {
    coach: [
      "The arrival fallacy — and the fact that you're feeling it puts you in famous company: it's rampant among people who actually achieve their goals. The formula 'I'll be happy when X' fails because of the same hedonic adaptation that eats the Ferrari: you adapt to achieved goals within weeks, and the goalpost quietly relocates.",
      "Here's the part that reorganises everything: the enjoyable part was the CLIMB. Progress, growth, problems worth having — that's what your reward system actually pays for. The summit was always going to be five minutes of view and then weather.",
    ],
    insight: {
      title: "Stop buying summits; invest in climbs",
      technique: "Hedonic adaptation · Process orientation · Values (ACT)",
      source: "Big Think (Tal Ben-Shahar's 'arrival fallacy') · Ali Abdaal · HealthyGamerGG",
      body: "The fix isn't bigger goals — that's the same trap with more zeros. It's converting from destination-addiction to process-alignment: choose pursuits where you'd endorse the daily verb even if the noun never arrived. Love training, not 'being fit'; love building, not 'having built'. Goals become direction-setters rather than happiness-dispensers. And pour surplus into the adaptation-proof assets: relationships deepened, mastery pursued, contribution made. Those compound instead of evaporating.",
      actions: [
        "Audit current goals: for each, would you enjoy the daily process if the outcome took twice as long?",
        "Design next goals as verbs, not trophies.",
        "Post-achievement ritual: celebrate properly for a week, then consciously choose the next climb — don't let the void choose it for you.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  pur_pleasure: {
    coach: [
      "Dr. K draws the distinction that names your exact situation: pleasure and fulfilment run on different circuits. Pleasure is consumption — it spikes, adapts, and demands escalation (the dopamine treadmill). Fulfilment comes from meaning, contribution and growth — slower, quieter, but it accumulates instead of resetting.",
      "A life optimised purely for pleasure isn't evil. It's just structurally empty — like eating only dessert and wondering about the hunger.",
    ],
    insight: {
      title: "Pleasure spikes; meaning compounds",
      technique: "Dopamine hygiene · Eudaimonia vs. hedonia · Contribution",
      source: "HealthyGamerGG (Dr. K) · Big Think (positive psychology)",
      body: "You don't have to renounce pleasure — you have to stop asking it to do meaning's job. Rebalance the portfolio: keep pleasure as seasoning, and add the three meaning generators the research keeps finding — belonging (being known, not just liked), mastery (getting good at something hard on purpose), and service (mattering to something beyond yourself). Expect the transition to feel WORSE briefly: meaning-activities have a startup cost that pleasure never has. That initial resistance isn't a sign it's wrong; it's the price signal of things that end up mattering.",
      actions: [
        "Portfolio audit: list a normal week's activities as 'spike' or 'compound'. Just see the ratio.",
        "Add ONE compounding block this week: skill practice, real conversation, helping someone concretely.",
        "Protect it from the spikes — meaning loses every impulse-battle but wins every retrospective.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
      { label: "The scrolling/dopamine piece of this", next: "hab_dopamine" },
    ],
  },

};

/* Escape hatch present everywhere ---------------------------------------- */
const GLOBAL_OPTIONS = { wheelLabel: "🎡 Back to the wheel" };
