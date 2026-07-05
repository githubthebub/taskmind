/* =========================================================================
   Better Decisions — Knowledge Base & Conversation Tree
   -------------------------------------------------------------------------
   No AI backend. Every line is hand-authored. The design goal is a real
   1-on-1 coaching conversation — the coach VALIDATES, then PROBES, then
   NAMES the pattern, then REFRAMES, then lands it — so a perspective shifts
   over a few turns instead of being dumped in one card.

   Node shape:
   {
     coach:   [ "text", ... ]        // sent one at a time, with typing
     note:    { reframe, sub }       // optional inline "perspective shift"
     insight: { title, technique, source, body, actions:[] }  // optional card
     options: [ { label, next } ]    // chips. next:"wheel" returns home.
   }

   Frameworks: CBT · DBT · ACT · somatic / psychosomatic.
   Voices drawn on:
     • Dr. K — HealthyGamerGG (dharma, dopamine, alexithymia, attachment,
       validation, rumination, meditation-as-tolerance)
     • Charlie Houpert — Charisma on Command (inner game, outcome
       independence, warmth+competence, banter, storytelling, boundaries)
     • Big Think (Dan Gilbert, Barry Schwartz, Robert Waldinger, Cal Newport,
       Kelly McGonigal, Adam Grant, Angela Duckworth, Loretta Breuning…)
     • Dr. Judy Ho (self-sabotage, approach vs. avoidance)
     • Ali Abdaal (feel-good productivity, regret minimisation, energy audit)
   ========================================================================= */

const AREAS = [
  { id: "relationships", label: "Relationships", icon: "💜", color: "#a78bfa", blurb: "Dating, friends, family" },
  { id: "social",        label: "Confidence & People", icon: "✨", color: "#f0abfc", blurb: "Charisma, social nerves" },
  { id: "career",        label: "Career & Work", icon: "💼", color: "#60a5fa", blurb: "Quit? Stay? Pivot?" },
  { id: "money",         label: "Money & Buying", icon: "💰", color: "#34d399", blurb: "Big purchases, spending" },
  { id: "habits",        label: "Habits & Focus", icon: "🌱", color: "#4ade80", blurb: "Dopamine, sticking to it" },
  { id: "mind",          label: "Mind & Emotions", icon: "🧠", color: "#f472b6", blurb: "Overthinking, anxiety" },
  { id: "purpose",       label: "Purpose & Meaning", icon: "🧭", color: "#fbbf24", blurb: "What's it all for?" },
];

/* ============================ TOOLBOX ================================== */

const TOOLBOX = [
  {
    id: "covert", name: "Covert Contracts", tag: "Relationships · CoC",
    body: "An unspoken deal — 'I do X for you, so you owe me Y' — that the other person never agreed to, or even knew about. It turns kindness into an invoice and generosity into resentment. Adam Grant's research (Big Think) calls the healthy version 'otherish' giving: give freely, and ask directly for what you want.",
  },
  {
    id: "innergame", name: "Outcome Independence", tag: "Charisma on Command",
    body: "Charlie Houpert's core idea: the most attractive, charismatic thing about a person is the felt sense that they'd be genuinely fine if this went nowhere. Neediness leaks; non-neediness magnetises. You build it by having a life you're not trying to escape.",
  },
  {
    id: "warmthcomp", name: "Warmth × Competence", tag: "Social psychology · CoC",
    body: "The two axes people instantly read you on. Warmth = 'are you for me or against me?'. Competence = 'can you back it up?'. Charisma is being high on both at once — genuinely warm AND self-assured. Missing either reads as fake nice or cold impressive.",
  },
  {
    id: "hedonic", name: "Hedonic Adaptation", tag: "Big Think · Dan Gilbert",
    body: "You return to a happiness baseline after almost everything, good or bad. The Ferrari thrills for weeks, then becomes 'my car'. Dan Gilbert's affective-forecasting work: we systematically overestimate how long things will move us. Experiences, anticipation and buying back time resist adaptation; objects don't.",
  },
  {
    id: "dopamine", name: "Dopamine Isn't Pleasure", tag: "HealthyGamerGG · Big Think",
    body: "Dr. K & Loretta Breuning: dopamine is the wanting chemical, not the liking one. It spikes on the CHASE and drops on arrival — which is why the scroll, the buy, the notification feel urgent yet hollow. Real satisfaction runs on different chemistry (serotonin, oxytocin) that you have to build, not chase.",
  },
  {
    id: "dharma", name: "Purpose Is Grown, Not Found", tag: "HealthyGamerGG (Dr. K)",
    body: "Dr. K's 'dharma': purpose isn't an object hidden somewhere you haven't looked. It condenses out of engagement — you act, and meaning precipitates. It reliably lives where your energy meets someone else's need. You can't think your way to it from the sofa.",
  },
  {
    id: "alexithymia", name: "Name It to Tame It", tag: "HealthyGamerGG · CBT",
    body: "Many people (men especially) were trained out of naming feelings, so emotion arrives as a vague physical pressure that leaks as anger, numbness or scrolling. Dr. K & affect-labelling research: putting the precise word on a feeling measurably lowers its charge. You can't regulate what you can't name.",
  },
  {
    id: "wisemind", name: "Wise Mind (DBT)", tag: "DBT",
    body: "Emotion Mind reacts; Reasonable Mind calculates; Wise Mind is the overlap — the calm, knowing state where good decisions live. Reach it by slowing the exhale and asking: 'What do I already know is true here?'",
  },
  {
    id: "dearman", name: "DEARMAN (DBT)", tag: "DBT · Communication",
    body: "A script for hard asks: Describe the facts, Express your feeling, Assert the request, Reinforce why it helps you both, stay Mindful, Appear confident, Negotiate. It replaces hinting and resentment with one clear, kind request.",
  },
  {
    id: "distortions", name: "Cognitive Distortions (CBT)", tag: "CBT",
    body: "Thinking traps wearing the costume of facts: mind-reading ('they think I'm boring'), catastrophising, all-or-nothing, fortune-telling, overgeneralising from one event. Name the trap and the thought loses half its grip.",
  },
  {
    id: "somatic", name: "Body-First Check", tag: "Psychosomatic · DBT",
    body: "Your body votes before your mind explains. Tight chest, clenched jaw, shallow breath — data, not noise. Before a decision, scan head to toe: is this fear of real danger, or just fear of discomfort? Choices made mid-adrenaline are the ones we tend to regret.",
  },
  {
    id: "reappraisal", name: "Stress Reappraisal", tag: "Big Think · Kelly McGonigal",
    body: "The pounding heart before something that matters isn't malfunction — it's your body delivering oxygen and focus to help you rise. Kelly McGonigal's research: people told to read arousal as 'my body is getting me ready' perform better and stay healthier than those fighting it. Same physiology, different meaning.",
  },
  {
    id: "tenten", name: "10 / 10 / 10", tag: "Decision framework · Big Think",
    body: "How will I feel about this in 10 minutes, 10 months, 10 years? Suzy Welch's tool drags future-you into the room, where they can outvote the craving of present-you.",
  },
  {
    id: "regret", name: "Regret Minimisation", tag: "Ali Abdaal · Bezos",
    body: "Picture yourself at 80 looking back. Which option would you regret NOT trying? People overwhelmingly regret inactions, not actions. Popularised by Bezos, taught widely by Ali Abdaal.",
  },
  {
    id: "oppaction", name: "Opposite Action (DBT)", tag: "DBT",
    body: "When an emotion's urge makes things worse (hide, lash out, chase), do the opposite — gently, all the way. Urge to isolate? Text one friend. Urge to send the angry message? Draft it, don't send, walk first.",
  },
  {
    id: "approach", name: "Approach vs. Avoidance", tag: "Dr. Judy Ho",
    body: "Avoidance goals ('stop being lazy', 'don't get rejected') keep your brain staring at what it fears. Approach goals ('train 3× a week', 'have one real conversation') give it somewhere to go. Self-sabotage feeds on avoidance framing.",
  },
  {
    id: "relationships80", name: "Relationships Are the Variable", tag: "Big Think · Waldinger",
    body: "The 85-year Harvard Study of Adult Development (Robert Waldinger): the single strongest predictor of a long, healthy, happy life isn't money, fame or achievement — it's the warmth of your relationships. Loneliness is as damaging as smoking. Connection is not a soft nice-to-have; it's load-bearing.",
  },
];

/* ============================ CONVERSATION TREE ======================== */

const TREE = {

  start: {
    coach: [
      "Hey — good to see you. 👋",
      "Quick promise before we start: I'm not an AI, and nothing you tap here leaves this page. No feed, no account, no tracking.",
      "Everything I say is written ahead of time from evidence-based psychology — CBT, DBT, somatic work — and thinkers like Dr. K, Charlie from Charisma on Command, Big Think, Dr. Judy Ho and Ali Abdaal.",
      "We'll just talk it through, one step at a time. Where's the weight sitting right now?",
    ],
    options: [],
  },

  /* ======================================================================
     RELATIONSHIPS
     ====================================================================== */

  relationships: {
    coach: ["Relationships — quietly the thing that runs the whole show. Which corner of it?"],
    options: [
      { label: "💘 Dating / romantic", next: "rel_romantic" },
      { label: "🫂 Friendships", next: "rel_friends" },
      { label: "🏠 Family", next: "rel_family" },
    ],
  },

  rel_romantic: {
    coach: ["Okay. Rather than guess, tell me which of these sounds most like the voice in your head lately."],
    options: [
      { label: "\"I'm kind and generous but I always end up used or friend-zoned.\"", next: "ng_1" },
      { label: "\"The good, stable ones bore me. I keep chasing people who treat me badly.\"", next: "sel_1" },
      { label: "\"I'm in it, and we keep having the same fight.\"", next: "rom_conflict" },
      { label: "\"I can't tell if I should stay or leave.\"", next: "rom_stayleave" },
      { label: "\"We broke up and I can't function.\"", next: "rom_breakup" },
    ],
  },

  /* ---- NICE GUY / COVERT CONTRACTS (flagship deep thread) ------------- */

  ng_1: {
    coach: [
      "Alright. I want to actually get this before I say anything useful, so bear with a question or two.",
      "When you do the generous thing — pay for the meal, help them move, drive across town at 2am — what are you quietly hoping happens next? Not the noble version. The honest one.",
    ],
    options: [
      { label: "Honestly… that they'll finally see me as more than a friend.", next: "ng_2" },
      { label: "Nothing specific. I just do it — and then feel invisible.", next: "ng_2b" },
      { label: "I tell myself nothing, but I'm gutted when it goes nowhere.", next: "ng_2" },
    ],
  },

  ng_2b: {
    coach: [
      "Sit with that word for a second — 'invisible'. That's not nothing. That's a real ache.",
      "But let me gently push: if the giving truly had no hope attached, going nowhere wouldn't leave you feeling invisible. It'd just feel neutral. The invisibility is the sound a hope makes when it doesn't get answered.",
      "So can I ask the honest version again — what does a part of you hope the kindness earns?",
    ],
    options: [
      { label: "…Okay. That they'll choose me. Want me.", next: "ng_2" },
      { label: "That I'll finally matter to someone.", next: "ng_2" },
    ],
  },

  ng_2: {
    coach: [
      "Thank you for saying it plainly. Most people can't, even to themselves. That honesty is the whole reason this is fixable.",
      "So there IS a hope riding on the giving. That's deeply human — don't beat yourself up. But the SHAPE of it is the problem, not you. Let me show you the shape.",
      "Can I name the pattern, and you tell me if it fits?",
    ],
    options: [
      { label: "Go for it.", next: "ng_name" },
      { label: "It's not manipulation though — I genuinely like helping people.", next: "ng_genuine" },
    ],
  },

  ng_genuine: {
    coach: [
      "I believe you. And here's the thing — both are true at once. You genuinely like giving AND a quiet part of you keeps a ledger. Those don't cancel out. You're not a bad person running a con.",
      "There's a clean test for it, from Adam Grant's work on givers and takers (great Big Think talk on this): would you still do the favour if you knew — for a fact — it would never once move you closer to them?",
    ],
    options: [
      { label: "…If I'm honest, the answer wobbles.", next: "ng_name" },
      { label: "For some people yes, for the ones I like — no.", next: "ng_name" },
    ],
  },

  ng_name: {
    coach: [
      "That wobble is the tell. Here's the name for it: a covert contract.",
      "The clause reads: 'If I am kind, generous and low-maintenance enough, then they'll owe me affection.' You signed it in your head. They never did — they don't even know it exists.",
      "So when the affection doesn't arrive, you feel cheated. And they feel confused, or vaguely used, without being able to say why. Two people, both quietly hurt, over a contract only one of them ever saw.",
    ],
    note: {
      reframe: "You're not being rejected for being kind. You're being quietly resented for an invoice nobody agreed to receive.",
      sub: "Covert contract · Adam Grant on 'selfless' vs 'otherish' giving",
    },
    options: [
      { label: "…Oof. That actually lands.", next: "ng_kindness" },
      { label: "So being kind is bad now? Great.", next: "ng_kindness" },
    ],
  },

  ng_kindness: {
    coach: [
      "No — the opposite. Don't throw out the kindness. Kindness is non-negotiable. But here's the reframe that changes the whole game:",
      "Kindness is the baseline, not the offer.",
      "It's the entry ticket every decent adult is expected to hold. It doesn't make you special — it makes you eligible. Nobody has ever felt a spark because someone cleared the bar of 'basic human decency'. You don't get points for the floor.",
    ],
    options: [
      { label: "Okay… so if kindness is just the floor, what's the building?", next: "ng_life" },
      { label: "Then what actually makes someone attractive?", next: "ng_life" },
    ],
  },

  ng_life: {
    coach: [
      "This is basically Charlie Houpert's entire thesis at Charisma on Command, so let me hand it over straight.",
      "Attraction isn't a stack of favours you perform ON someone. It's the felt sense that being around you is genuinely fun — AND that you'd be completely fine if they walked away tomorrow.",
      "That second half is the one no amount of giving can fake. The nice-guy strategy leaks neediness precisely because the favours ARE the bid. You're not offering overflow; you're spending your last coin and watching the slot.",
    ],
    options: [
      { label: "So I need a life I'm not secretly trying to escape.", next: "ng_life2" },
      { label: "But I don't really have that life right now.", next: "ng_nolife" },
    ],
  },

  ng_nolife: {
    coach: [
      "Then that — not your kindness, not your looks — is the actual leverage point. And I mean that as good news, because a life is buildable, whereas 'try harder to be liked' is a treadmill.",
      "Dr. K frames the mechanism well: when you have nothing of your own that lights you up, another person becomes the only source of meaning in the room. That's an enormous, invisible weight to hand someone on a second date. They feel it even if neither of you can name it.",
      "Fill your own week first, and the neediness has nowhere to stand.",
    ],
    options: [
      { label: "Okay. How do I actually build that?", next: "ng_life2" },
    ],
  },

  ng_life2: {
    coach: [
      "The move Charlie teaches: make the giving OVERFLOW instead of a BID.",
      "Overflow is 'my life is already good, and I'd love to share a piece of it with you.' A bid is 'please let my kindness be enough.' Same dinner, opposite energy — and people read the energy, not the dinner.",
      "So you build the life for its own sake: the training, the friends, the project you'd do even if you were single forever. Then the interest you express isn't a down-payment on affection. It's an invitation into something that's already full.",
    ],
    insight: {
      title: "Kindness is the floor. Attraction is built on a life.",
      technique: "Covert contracts · Outcome independence · 'Otherish' giving",
      source: "Charisma on Command (Charlie Houpert) · HealthyGamerGG (Dr. K) · Adam Grant / Big Think · Dr. Robert Glover",
      body: "Three shifts, one direction. (1) Tear up the contract: give freely or don't give — and when you want something (a date, exclusivity, a kiss), ASK for it directly instead of smuggling it inside favours. Directness is the opposite of covert. (2) Build outcome independence: cultivate a life you'd keep even if this person vanished — that non-neediness is the single most magnetic thing you own, and it can't be performed, only grown. (3) Express interest early and plainly. Months of auditioning through favours reads as fear; 'I like you, I'd like to take you out' reads as a man with a spine. Kindness stays — it's just demoted from the pitch to the price of entry.",
      actions: [
        "This week, do ONE generous thing with the expectation fully released — and one you'd normally do to score points, and DON'T do it. Feel the difference.",
        "Next time you like someone, express it directly within the first couple of interactions. State it; don't smuggle it.",
        "List three things you'd pursue if you were single forever, then schedule one. That's the life the attraction gets built on.",
        "Catch resentment as a smoke alarm: when it flares, ask 'what did I secretly expect here that I never actually asked for out loud?'",
      ],
    },
    options: [
      { label: "What if I do all this and still get rejected?", next: "ng_reject" },
      { label: "This reframed a lot. Take me back.", next: "wheel" },
    ],
  },

  ng_reject: {
    coach: [
      "You will. Sometimes. Not because the strategy failed — because rejection is the entry fee everyone pays, including every person you've ever envied.",
      "Charlie's reframe here is clean: rejection is information about FIT, not a verdict on WORTH. They didn't weigh your soul and stamp 'insufficient'. A pairing didn't click, filtered through a history and a set of preferences you'll never fully see.",
    ],
    note: {
      reframe: "The people who date well aren't rejected less. They've just unhooked the 'no' from their self-worth — which lets them take more shots at lower cost.",
      sub: "Cognitive restructuring (CBT) · Charisma on Command",
    },
    options: [
      { label: "How do I actually unhook it like that?", next: "ng_reject2" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  ng_reject2: {
    coach: [
      "You train it like a muscle, with reps. Every rejection you survive intact is evidence to your nervous system that the 'no' didn't end you — and the fear shrinks a little each time it fails to destroy you.",
      "One reframe that helps: track ATTEMPTS, not outcomes. Ten genuine attempts is a successful month, full stop, regardless of who said yes. You're grading the only variable you actually control — and outcomes were never in that column anyway.",
    ],
    options: [
      { label: "That helps. Back to the wheel.", next: "wheel" },
      { label: "Honestly I freeze before I can even attempt — help with that", next: "soc_approach" },
    ],
  },

  /* ---- PARTNER SELECTION / 'good ones are boring' -------------------- */

  sel_1: {
    coach: [
      "This one's important, so let me go slow.",
      "First, a reframe you might not have heard put this bluntly: the steady, kind people you call 'boring' ARE attracted to you. They text back, show up on time, stay consistent. The problem was never that good partners don't want you.",
      "The problem is your radar files their signal under 'no spark' and deletes it before anything can start.",
    ],
    options: [
      { label: "Okay… so why does 'good' read as boring to me?", next: "sel_2" },
      { label: "You don't know that they're attracted to me.", next: "sel_challenge" },
    ],
  },

  sel_challenge: {
    coach: [
      "Fair. I don't know your specific inbox. But notice the move your mind just made — it reached for the interpretation that keeps the pattern safe.",
      "So let me ask instead of assert: when someone kind, available and genuinely into you has shown up… what did you feel? Be honest.",
    ],
    options: [
      { label: "Kind of… nothing. Flat. No spark.", next: "sel_2" },
      { label: "A bit suffocated, actually. Like I wanted to run.", next: "sel_2" },
    ],
  },

  sel_2: {
    coach: [
      "Right. Now the opposite question. That intense, unmistakable SPARK you do feel sometimes — think of the last two or three times. What did those people have in common?",
    ],
    options: [
      { label: "Hot and cold. Hard to read. A bit of a chase.", next: "sel_core" },
      { label: "Honestly… I've never examined what the spark correlates with.", next: "sel_core" },
    ],
  },

  sel_core: {
    coach: [
      "Here's the mechanism, and it's wiring, not a character flaw — this is Dr. K's territory.",
      "If your nervous system learned early that love comes with unpredictability, then unpredictability starts to FEEL like love. And here's the cruel chemistry: anxiety and excitement are almost identical inside the body — same racing heart, same adrenaline, same dopamine.",
      "A partner who's reliably warm produces no adrenaline. So your body files it as 'no chemistry' — when what it actually means is 'no threat'.",
    ],
    note: {
      reframe: "'Boring' is often just what safety feels like to a nervous system that was trained on chaos. The calm isn't the absence of a spark. It's the absence of an alarm.",
      sub: "Attachment · Interoception · HealthyGamerGG (Dr. K)",
    },
    options: [
      { label: "…So the 'spark' might be an alarm, not a match.", next: "sel_slot" },
      { label: "But won't choosing 'calm' just mean settling?", next: "sel_settle" },
    ],
  },

  sel_slot: {
    coach: [
      "Exactly that. And the intermittent, hot-and-cold person is running the single most addictive schedule known to psychology — the slot machine. Unpredictable reward creates the strongest dopamine loops there are.",
      "That's why the 'chase' feels like passion. It isn't passion. It's variable-ratio reinforcement — you're pulling a lever, not falling in love. The relief when they finally text back is the exact chemistry of a gambler hitting a small win.",
    ],
    options: [
      { label: "God. So how do I actually recalibrate this?", next: "sel_fix" },
      { label: "But I still worry calm = settling.", next: "sel_settle" },
    ],
  },

  sel_settle: {
    coach: [
      "Let me take that seriously, because it's the fear that keeps the whole pattern locked.",
      "'Calm' isn't the compromise. It's the prerequisite. Passion built on safety deepens over years. Passion built on anxiety burns out the moment the uncertainty resolves — which is exactly why those relationships die right when they 'should' be getting good.",
      "You're not lowering the bar. You're moving it from 'makes my heart race' to 'makes my life bigger'. Racing hearts are cheap. Peace that stays interesting is rare.",
    ],
    options: [
      { label: "Okay. How do I recalibrate the radar?", next: "sel_fix" },
    ],
  },

  sel_fix: {
    coach: [
      "Slowly, and on purpose — but it genuinely moves. The core move is to stop letting the alarm system be the judge of romance.",
      "Give me the summary version and I'll hand you the specifics to keep.",
    ],
    insight: {
      title: "Recalibrate the radar: let 'calm' get a fair trial",
      technique: "Attachment repair · Interoception · Cognitive restructuring",
      source: "HealthyGamerGG (Dr. K on anxious attachment) · Dr. Judy Ho · CBT",
      body: "You don't lack good options — you have a filter calibrated to drama, and filters can be recalibrated. Start by renaming the feeling: next time a huge instant spark hits, label it 'activation', not 'chemistry', and get curious about what triggered it rather than obeying it. Then give secure, available people a real 3-date trial — attraction to a safe partner often builds on a slower curve, so an instant-flat verdict throws away the exact people worth choosing. Meanwhile study your own history: your last three intense connections almost certainly share a signature, and a pattern you can see is a pattern you can interrupt. This is slower than swiping. It's also the actual fix.",
      actions: [
        "Rename it in the moment: intense instant spark → 'activation', and ask what it's really reacting to.",
        "Three-date rule for calm, kind people — judge on the trend, not the first-night fireworks.",
        "Write out your last three 'sparks'. Find the common denominator. That's your alarm signature.",
        "On dates, do a body check: unclench, breathe low, notice — am I settled or vigilant? Practice choosing settled.",
      ],
    },
    options: [
      { label: "This reframes years of my life. Back to the wheel.", next: "wheel" },
      { label: "Related — I think I've got an anxious attachment thing", next: "mind_attach" },
    ],
  },

  /* ---- IN-RELATIONSHIP CONFLICT -------------------------------------- */

  rom_conflict: {
    coach: [
      "Recurring fights are almost never about the thing they're about. The dishes aren't the dishes. They're a stand-in for 'do I count to you'.",
      "Before frameworks — a body question, because your body enters the fight before you do. When it kicks off, what happens physically?",
    ],
    options: [
      { label: "Heat, tight chest, I get loud or sharp.", next: "conf_hot" },
      { label: "I go cold, shut down, leave the room in my head.", next: "conf_cold" },
    ],
  },

  conf_hot: {
    coach: [
      "That heat is your sympathetic nervous system flooding you with adrenaline. And here's the physiology nobody teaches: once you're flooded, the part of your brain that actually negotiates — the prefrontal cortex — goes largely offline.",
      "So continuing the argument while flooded is like steering harder on ice. You're not going to solve it. You're just going to say the thing you'll spend tomorrow apologising for.",
    ],
    options: [
      { label: "So what do I do in the moment?", next: "conf_hot2" },
      { label: "What if THEY'RE the one who explodes?", next: "conf_cold" },
    ],
  },

  conf_hot2: {
    coach: [
      "Rule one: no important sentences while flooded. Call a timeout — but say you're coming back, because leaving without that lands as abandonment and makes it worse.",
      "Then physically downshift. This is DBT's TIPP: cold water on the face, brisk movement, long slow exhales. You're not sulking; you're getting your negotiator back online.",
      "Once you're calm-ish, THEN you talk — and there's a script for that part.",
    ],
    options: [
      { label: "Give me the script.", next: "conf_dearman" },
    ],
  },

  conf_dearman: {
    coach: [
      "It's DBT's DEARMAN, and it turns a fight into a request.",
    ],
    insight: {
      title: "Regulate first, then make ONE clear request",
      technique: "DBT · TIPP + DEARMAN · Somatic regulation",
      source: "DBT skills training · HealthyGamerGG · Gottman research (via Big Think)",
      body: "The rule that saves relationships: no big conversations while flooded. Take 20 minutes (announce the return so it isn't abandonment), downshift with cold water / movement / long exhales, then run DEARMAN — Describe just the facts without spin, Express your feeling with 'I feel…', Assert one clear request, Reinforce how it helps you both, stay Mindful of the goal, Appear steady, Negotiate. One request per conversation; a stacked list is an ambush. And swap every 'you always' for one specific recent moment — global accusations summon global defences, and then you're fighting about the fighting.",
      actions: [
        "Agree a timeout signal with your partner NOW, in peacetime — not mid-fight.",
        "Before the next hard talk, actually write your DEARMAN out. One request.",
        "Replace 'you always/never' with one concrete example. Specific is solvable.",
        "Long exhales during, not just before. 4 in, 6–8 out keeps the negotiator online.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
      { label: "The shutting-down thing is more me, actually", next: "conf_cold" },
    ],
  },

  conf_cold: {
    coach: [
      "Shutting down feels like neutrality from the inside. From the outside it reads as 'you're not worth my energy' — and it's one of the strongest predictors of relationships failing (Gottman calls it stonewalling).",
      "Not because silence is cruel. Because it leaves the other person completely alone with their worst story about what your silence means.",
    ],
    options: [
      { label: "But I genuinely can't talk when I'm overwhelmed.", next: "conf_cold2" },
    ],
  },

  conf_cold2: {
    coach: [
      "And you don't have to. The upgrade isn't forcing words out while you're overwhelmed — it's narrating the state instead of vanishing into it.",
      "One sentence does it: 'I'm shutting down and I don't want to. Give me 20 minutes and I'll come back to this.' That converts abandonment into teamwork. You've told them the silence isn't rejection — it's a reboot.",
    ],
    insight: {
      title: "Name the shutdown out loud instead of disappearing into it",
      technique: "DBT interpersonal effectiveness · Opposite action",
      source: "DBT skills training · HealthyGamerGG (Dr. K on emotional flooding)",
      body: "Stonewalling and healthy self-regulation can look physically identical from the inside — the difference is entirely whether you narrate it. 'I'm flooding, I need 20 minutes, I'm coming back' keeps the connection alive across the pause. Opposite action applies too: the urge says withdraw completely; do the opposite gently — stay in contact ABOUT the disconnection. In the timeout, move your body; do NOT rehearse the argument, because rehearsal is just marinating. Then come back on time even if you're not fully composed. Reliability is the actual message.",
      actions: [
        "Script the sentence now, calm, and keep it: 'I'm flooding. 20 minutes. I'm coming back.'",
        "In the break: walk, don't ruminate. Rehearsing the fight reloads it.",
        "Return on time, every time. The follow-through is what rebuilds trust.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  /* ---- STAY OR LEAVE -------------------------------------------------- */

  rom_stayleave: {
    coach: [
      "The hardest one. Let's not answer it head-on yet — right now the decision is being argued by two unreliable lawyers: fear of loneliness and fantasy of relief. Neither tells the truth.",
      "So let's get your Wise Mind in the room instead. Answer this one quietly, body first — don't think, just notice: imagine waking up in this relationship five years from now, completely unchanged. What does your body do?",
    ],
    options: [
      { label: "Something sinks. Heaviness. Dread.", next: "sl_leave" },
      { label: "It's mostly okay — it's specific fights that wreck us.", next: "sl_stay" },
    ],
  },

  sl_leave: {
    coach: [
      "Notice your body answered before your reasons did. That sinking is data — psychosomatic signals often know months before the mind will admit it.",
      "It doesn't get to make the decision alone. But it belongs in the evidence, and most people spend years explaining it away.",
    ],
    insight: {
      title: "Separate 'reasons to stay' from 'reasons leaving is scary'",
      technique: "Wise Mind (DBT) · Somatic awareness · 10/10/10",
      source: "DBT · Big Think (Suzy Welch's 10/10/10) · Dan Gilbert on affective forecasting",
      body: "Fear of leaving usually wears three disguises: sunk cost ('but all the years we've put in'), catastrophised loneliness ('I'll never find anyone'), and caretaking guilt ('they'll fall apart'). None of these are reasons to stay — they're reasons leaving is hard, which is a completely different thing, and naming which is which dissolves half the paralysis. Then run 10/10/10: in 10 minutes leaving feels terrifying; in 10 months most people report relief they'd postponed for years; in 10 years, staying somewhere your body sinks is precisely what people mean when they say 'regret'. And note Dan Gilbert's finding — we badly overestimate how long the pain of a breakup lasts. Your forecast of the aftermath is almost certainly darker than the reality.",
      actions: [
        "Two columns: 'reasons to stay' vs 'reasons leaving is scary'. Watch items migrate to column two.",
        "If some issues are genuinely fixable, name the concrete change, ask for it once and clearly (DEARMAN), set a real deadline. Vague hope is not a plan.",
        "Talk to one person who left a long relationship and one who stayed and rebuilt. Borrow the hindsight you don't have yet.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
      { label: "How do I even start that conversation?", next: "conf_dearman" },
    ],
  },

  sl_stay: {
    coach: [
      "That's genuinely useful information. It tells me the foundation reads as sound and the CONFLICT PATTERN is what's broken. Those are different problems — and the second one is very trainable.",
      "Most couples never learn to fight well because literally no one taught them. It's a skill gap, not a compatibility verdict. Want the tools?",
    ],
    options: [
      { label: "Yes — teach me to fight well.", next: "rom_conflict" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  /* ---- BREAKUP ------------------------------------------------------- */

  rom_breakup: {
    coach: [
      "I'm sorry. Genuinely. And I want you to hear the first thing clearly: what you're feeling is not weakness or overreaction.",
      "A breakup lights up the same brain circuits as substance withdrawal. The obsessive replaying, the physical ache, the craving — that's neurochemistry doing exactly what it evolved to do. You're not broken. You're detoxing from a person.",
      "What's hitting hardest right now?",
    ],
    options: [
      { label: "I can't stop replaying everything.", next: "bu_rumination" },
      { label: "The urge to text them is unbearable.", next: "bu_urge" },
      { label: "I feel like I'll never find anyone again.", next: "bu_scarcity" },
    ],
  },

  bu_rumination: {
    coach: [
      "Dr. K's take on rumination is the one that finally clicks for most people, so let me give it to you straight.",
      "Your mind replays the relationship because it thinks there's a PUZZLE to solve — as if finding the exact moment it broke would somehow un-break it. But rumination isn't processing. Processing has feeling in it. Rumination is analysis on a loop, and it's actually a clever way to AVOID feeling the loss.",
    ],
    note: {
      reframe: "You're not thinking because it hurts. You're thinking so you don't have to feel. The loop is the avoidance, wearing the mask of problem-solving.",
      sub: "Rumination vs. processing · HealthyGamerGG (Dr. K)",
    },
    options: [
      { label: "So how do I actually feel it instead of loop?", next: "bu_rumination2" },
    ],
  },

  bu_rumination2: {
    coach: [
      "You give grief an appointment instead of letting it ambush you all day.",
    ],
    insight: {
      title: "Feel it once, fully — instead of thinking it a thousand times",
      technique: "Emotional processing · Rumination interruption",
      source: "HealthyGamerGG (Dr. K) · DBT",
      body: "Schedule 20 minutes a day where you deliberately feel it — journal the emotions (not the analysis), cry, let the body do what it needs, no fixing allowed. When the replay starts OUTSIDE that window, label it — 'that's the loop, not new information' — and redirect to something with your hands in it. The loss doesn't need to be solved; it needs to be felt on purpose, so it stops leaking into every hour. Counter-intuitively, the scheduled grief shrinks faster than the all-day drizzle, because feeling it completes the process that looping keeps interrupting.",
      actions: [
        "Set a daily 20-minute grief window. Inside it: feelings, not autopsy.",
        "Outside it: name the loop ('looping'), then do something physical — walk, cook, shower.",
        "Write the unsendable letter. All of it. Then don't send it — that letter was for you.",
      ],
    },
    options: [
      { label: "And the urge to text them?", next: "bu_urge" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  bu_urge: {
    coach: [
      "That urge is a craving, and cravings have a physiology you can use against them: they surge, peak within about 15–20 minutes, and then fall — as long as you don't feed them.",
      "Every text you DON'T send makes the next urge measurably weaker. And every 'harmless' little check-in resets the entire withdrawal clock back to day one. That's not willpower moralising; that's just how the circuit works.",
    ],
    insight: {
      title: "Urge-surf the text — outlast one wave at a time",
      technique: "DBT distress tolerance · Urge surfing",
      source: "DBT skills training · HealthyGamerGG (Dr. K on cravings)",
      body: "Treat the urge like a wave you watch, not a command you obey. Name it ('craving contact, about 8/10'), set a 20-minute timer, and move the body somewhere else — walk, shower, cold water on the wrists. Locate where it sits physically — chest? hands? throat? — and just watch it crest and drop. You're never resisting forever; you're outlasting one wave, and each one you ride leaves the next one smaller. That's not a metaphor — it's extinction learning, and it's reliable if you stop resetting the clock.",
      actions: [
        "Bury or mute the thread so texting takes real effort. Friction is a legitimate tool.",
        "Pre-write what you'd want to say into your notes app instead — same release, no reset.",
        "Appoint one friend as your 'call me before you text the ex' person. Externalise the brake.",
      ],
    },
    options: [
      { label: "The 'I'll never find anyone' fear too", next: "bu_scarcity" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  bu_scarcity: {
    coach: [
      "That fear feels like a fact right now, but it's a distortion with a name: fortune-telling, powered by grief. Grief narrows the whole world down to the one person you lost, then reports back that the world is empty.",
      "Here's the check: is 'I'll never find anyone' a prediction or evidence? You've connected with people before this one. The capacity that built this relationship didn't leave with them — it's yours, and it's intact.",
    ],
    note: {
      reframe: "The loneliness isn't telling you the truth about your future. It's telling you the truth about your present pain. Those are very different reports.",
      sub: "Fortune-telling distortion (CBT) · affective forecasting",
    },
    options: [
      { label: "That helps steady me. Back to the wheel.", next: "wheel" },
    ],
  },

  /* ---- FRIENDS ------------------------------------------------------- */

  rel_friends: {
    coach: [
      "Friendships — the most under-rated, quietly load-bearing thing in a life. The 85-year Harvard study (Robert Waldinger, brilliant Big Think talk) found the warmth of your relationships predicts health and happiness better than money, fame or career. This is not a small topic.",
      "What's going on?",
    ],
    options: [
      { label: "I'm lonely — my circle has quietly shrunk.", next: "fri_lonely" },
      { label: "A friendship feels one-sided and draining.", next: "fri_onesided" },
    ],
  },

  fri_lonely: {
    coach: [
      "First, the reframe that takes the shame out of it: adult loneliness is a LOGISTICS problem long before it's a likability problem.",
      "School and uni handed you repeated, unplanned contact with the same people for free. That's the exact recipe friendships need — and adulthood silently switches it off. So the friendships stopped forming, and your brain, unhelpfully, filed that under 'something's wrong with me'.",
    ],
    options: [
      { label: "So it's not that I'm unlikable — it's that the machinery's gone.", next: "fri_lonely2" },
      { label: "But making friends as an adult feels impossible.", next: "fri_lonely2" },
    ],
  },

  fri_lonely2: {
    coach: [
      "Right. And once you see it as machinery, you can rebuild it deliberately. The research is almost mechanical about how friendship forms: roughly 100–200 hours of shared time, built through repetition plus slowly escalating realness.",
      "Which means two levers: frequency (be somewhere the SAME people show up again and again) and vulnerability (be the one who escalates — from banter, to real talk, to 'we should grab food').",
    ],
    insight: {
      title: "Friendship = frequency × vulnerability, engineered on purpose",
      technique: "Behavioural activation (CBT) · Approach goals",
      source: "Charisma on Command · Big Think (Waldinger; repeated-exposure research) · Dr. Judy Ho",
      body: "Someone has to go first, and Charlie's data point is the encouraging one: the person who initiates is remembered as the likable one, not the needy one — we consistently underestimate how much others want to be approached. So make it structural. Join one thing that meets WEEKLY with a recurring cast (sport, class, club, volunteering) — recurrence is the whole trick, because it manufactures the unplanned repeat contact adulthood took away. Then be the one who nudges it deeper: follow up within 24 hours of a promising conversation, or the thread quietly dies. This is approach-goal work — aim at 'start one recurring thing', not 'stop being lonely'.",
      actions: [
        "Pick ONE weekly recurring thing this month. Recurring beats fun; the same faces are the point.",
        "Reactivate one dormant friendship today with a zero-pressure message — dormant ties respond far warmer than fear predicts.",
        "24-hour rule: met someone promising? Follow up within a day.",
      ],
    },
    options: [
      { label: "I think part of it is social nerves though", next: "social" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  fri_onesided: {
    coach: [
      "Before we label them a bad friend, one honest check — because it's the same trap from the dating thread: did you ever actually SAY what you needed? Or did you give, and keep a silent invoice, and let resentment do the talking?",
      "No judgement either way. But it changes the fix.",
    ],
    options: [
      { label: "…Honestly, I've never said it. I just keep score.", next: "fri_onesided2" },
      { label: "I've hinted a hundred times and nothing changes.", next: "fri_onesided2" },
    ],
  },

  fri_onesided2: {
    coach: [
      "Then the move is the same either way: name it once, directly and kindly — and watch what they do with the information. Hints don't count; hints are deniable, which is exactly why we hide behind them.",
    ],
    insight: {
      title: "One direct ask beats a year of silent scorekeeping",
      technique: "DEARMAN · Covert-contract audit",
      source: "DBT · Adam Grant (Big Think) · Dr. Judy Ho",
      body: "The script: 'Hey — I've noticed I'm usually the one reaching out. I really value this, and that's exactly why I'm saying something instead of just fading. Can you meet me halfway?' That's the whole thing — blame the pattern, not their character. A real friend course-corrects, maybe imperfectly. Someone who gets defensive or changes nothing has also answered you — and an honest answer, either direction, beats years of resentfully carrying a friendship that only exists when you hold it up. Then reinvest your energy where it's reciprocated: attention is a budget, and you've been overspending on one account.",
      actions: [
        "Send one honest, blame-free message this week. Describe the pattern, not the person.",
        "Then experiment: stop initiating for a few weeks — not as punishment, as data.",
        "Redirect the freed-up energy toward people who reach back. Reciprocity is the signal.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  /* ---- FAMILY -------------------------------------------------------- */

  rel_family: {
    coach: ["Family — where every button you've got was originally installed. Which fits?"],
    options: [
      { label: "I can't set a boundary without drowning in guilt.", next: "fam_bound" },
      { label: "Every visit becomes the exact same argument.", next: "fam_arg" },
    ],
  },

  fam_bound: {
    coach: [
      "Start with the sentence that reframes the whole thing: the guilt is the boundary WORKING.",
      "If you were raised — even lovingly — to believe your job is managing your family's emotions, then any act of self-protection will trip the guilt alarm. That guilt isn't evidence you did something wrong. It's evidence you did something NEW.",
    ],
    options: [
      { label: "Huh. So the guilt is expected, not a stop sign.", next: "fam_bound2" },
      { label: "But the guilt is unbearable — it makes me cave.", next: "fam_bound2" },
    ],
  },

  fam_bound2: {
    coach: [
      "Exactly — it's the exit fee, not the verdict. And it gets quieter every time you pay it without folding.",
      "One more piece, from Dr. K's work on enmeshment: a boundary is NOT a demand that they change. It's a statement of what YOU will do. That distinction is everything, because you can't control them — but you can absolutely control your own next move.",
    ],
    insight: {
      title: "A boundary is what YOU'll do — and the guilt is the exit fee",
      technique: "DBT boundaries · Cognitive defusion (ACT)",
      source: "HealthyGamerGG (Dr. K on enmeshment) · Dr. Judy Ho",
      body: "Frame it as an if-then about your own behaviour: 'If the criticism starts, I'm going to head out, and I'll see you next week.' Calm, pre-decided, repeatable. Expect them to escalate at first — that's an extinction burst, it's textbook, and it passes if you hold. Your job isn't to make them LIKE the boundary; it's to survive their disappointment without collapsing, and each time you do, the guilt loses a little voltage. Crucially: after you enforce it, do not over-explain. Explanations are negotiations in disguise, and the moment you start justifying, you've reopened the thing you just closed.",
      actions: [
        "Write the boundary as an if-then about YOUR behaviour. Rehearse it in a flat, weather-report tone.",
        "Pre-decide your response to the pushback (the tears, the 'you've changed', the silence). Surprise is what breaks boundaries.",
        "Enforce, then stop talking. No over-explaining — that's a negotiation you don't want to open.",
      ],
    },
    options: [
      { label: "The recurring-argument one too", next: "fam_arg" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  fam_arg: {
    coach: [
      "Recurring family arguments are usually a RITUAL, not a disagreement. Both of you know your lines by heart. Which is oddly good news — because a play needs everyone to perform their part, and you can simply stop performing yours.",
      "Map your last three fights. I'd bet it's the same script every time: they say X, you defend, they escalate, doors close. Sound about right?",
    ],
    options: [
      { label: "Almost word for word, yeah.", next: "fam_arg2" },
    ],
  },

  fam_arg2: {
    coach: [
      "Then change YOUR line only — that's the whole intervention. The machine can't run its usual cycle without your usual input.",
    ],
    insight: {
      title: "Refuse your role in the script",
      technique: "Pattern interruption · Opposite action",
      source: "DBT · Big Think (conflict & communication research)",
      body: "Instead of defending (your assigned line), try genuine curiosity — 'what worries you most about it?' — or agreement-with-a-twist — 'you might be right, I'll think about that.' Watch the machine stall without its fuel. You're not conceding the actual point; you're declining the choreography, and one person changing their step really does change the dance, because the dance was built for two. Keep your tone soft — content follows tone, and a gentle voice makes the old script impossible to run. And set a visit length you can actually succeed at: two good hours beat six that curdle into the reflex.",
      actions: [
        "Write out your last three arguments. See that it's one script.",
        "Pick ONE replacement line (curiosity or soft-agreement) and use it next visit.",
        "Pre-set the visit duration. End it while it's still good.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  /* ======================================================================
     CONFIDENCE & PEOPLE  (Charisma on Command focus)
     ====================================================================== */

  social: {
    coach: [
      "This whole area is basically Charlie Houpert's home turf, so expect a lot of Charisma on Command. What's the friction?",
    ],
    options: [
      { label: "I freeze — I can't start conversations or approach people.", next: "soc_approach" },
      { label: "I'm awkward in groups / go quiet and invisible.", next: "soc_groups" },
      { label: "I'm a people-pleaser — I can't say no or hold an opinion.", next: "soc_please" },
      { label: "I want to be more magnetic / charismatic, generally.", next: "soc_charisma" },
    ],
  },

  soc_approach: {
    coach: [
      "Freezing isn't shyness — it's your brain massively over-pricing the outcome. It's treating one conversation like a public verdict on your entire worth.",
      "CBT names the exact mechanism: catastrophising ('this will be humiliating') stacked on mind-reading ('they'll think I'm weird') — a prediction, delivered by the least objective witness available, which is your own fear.",
    ],
    options: [
      { label: "Knowing that doesn't stop the freeze though.", next: "soc_approach2" },
    ],
  },

  soc_approach2: {
    coach: [
      "True — insight alone doesn't melt a freeze. You need reps, but graded so your nervous system never gets more than it can handle.",
      "Charlie's version and Dr. Judy Ho's converge here: switch from the avoidance goal ('don't get rejected') to an approach goal ('start one conversation — outcome irrelevant'), then build a ladder of tiny, survivable rungs. Confidence isn't the thing you find BEFORE you act. It's the residue that action leaves behind.",
    ],
    note: {
      reframe: "You don't talk to people because you're confident. You become confident because you talked to people. The order is backwards from how it feels.",
      sub: "Exposure & self-efficacy (CBT) · Charisma on Command",
    },
    options: [
      { label: "Okay, give me the ladder.", next: "soc_approach3" },
    ],
  },

  soc_approach3: {
    coach: [
      "Here it is — and the golden rule is you grade yourself on ATTEMPTS, never on responses, because responses were never yours to control.",
    ],
    insight: {
      title: "Lower the stakes, raise the reps",
      technique: "CBT exposure ladder · Approach goals · Warmth signalling",
      source: "Charisma on Command (Charlie Houpert) · Dr. Judy Ho · CBT",
      body: "Build a ladder and climb one rung a week: (1) eye contact + a real smile at strangers; (2) a throwaway 'how's your day going?' to a barista or cashier; (3) one genuine, specific compliment with zero follow-up agenda; (4) a real conversation; (5) asking someone out or for their number. Before each rep, one slow exhale longer than the inhale — the fastest legal way to downshift the nervous system. Keep an evidence log: what you predicted would happen vs. what actually did. Within two weeks your fear's accuracy rate will embarrass it. Charlie's warmth tip makes every rung easier — walk in assuming people are friendly and glad to talk to you; that single assumption changes your face, your posture and your voice before you say a word, and people mirror it back.",
      actions: [
        "Pick your current rung and do it three times this week. Attempts scored, outcomes ignored.",
        "One long exhale before each rep. Then go before the fear finishes its sentence.",
        "Evidence log: predicted disaster vs. what really happened. Let the data argue with the fear.",
        "Walk in pre-deciding 'people are glad to meet me.' Watch how much it changes before you speak.",
      ],
    },
    options: [
      { label: "What about in groups, where I go invisible?", next: "soc_groups" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  soc_groups: {
    coach: [
      "Going quiet in groups is usually not a personality trait — it's a strategy. Specifically, a safety strategy: if I say nothing, I can't say the wrong thing. The cost is invisibility, but the payoff is zero risk, so your system keeps choosing it.",
      "Quick question so I aim this right: in a group, are you mostly silent because you've got nothing to say, or because you've got things to say but the window closes before you dare?",
    ],
    options: [
      { label: "I have things to say — I just miss the window every time.", next: "soc_groups2" },
      { label: "My mind goes blank and I feel boring.", next: "soc_groups_blank" },
    ],
  },

  soc_groups2: {
    coach: [
      "Then the fix is mechanical, not a personality transplant. Charlie's move: lower the bar for what earns entry. You're waiting for the PERFECT contribution — witty, relevant, unimpeachable — and by the time it's polished, the topic's moved on.",
      "Contributions don't need to be brilliant. Reactions count. A laugh, a 'wait, really?', a short 'that happened to me too' — these keep you present in the group's awareness, and presence is what makes the bigger moments land later.",
    ],
    insight: {
      title: "Be reactive before you try to be impressive",
      technique: "Social exposure · Sub-communication · Warmth × competence",
      source: "Charisma on Command (Charlie Houpert)",
      body: "Charisma reads mostly off warmth signals, not clever lines — how much you visibly enjoy the people around you. So drop the bar: react out loud (laugh, 'no way', 'say more'), ask the small follow-up question, agree with energy. Every reaction is a low-risk deposit that keeps you in the conversation's field, and it compounds — the person who's been warmly present for ten minutes can drop one ordinary observation and it lands, because the group already feels them there. Aim for engaged, not impressive; impressive is a trap that keeps you silent while you wait for perfect, and perfect never clears customs in a live conversation.",
      actions: [
        "Next group: make three reactions before you attempt one 'contribution'. Reactions are reps.",
        "Ask the small follow-up ('how did that go?'). Curiosity reads as warmth and buys you a turn.",
        "Kill the 'perfect line' rule. Present-and-ordinary beats brilliant-and-silent every time.",
      ],
    },
    options: [
      { label: "The 'I go blank / feel boring' part is real too", next: "soc_groups_blank" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  soc_groups_blank: {
    coach: [
      "The blank mind is a physiology, not a lack of substance. When you're socially anxious, your working memory is being hijacked by threat-monitoring — half your processing power is watching yourself, so there's less left over to think of things to say. You're not boring. You're distracted by self-surveillance.",
      "The counter-intuitive fix Charlie teaches: get curious about THEM. Attention aimed outward can't simultaneously be aimed at monitoring yourself. Curiosity is the off-switch for the blank.",
    ],
    note: {
      reframe: "You don't go blank because you're empty. You go blank because half your CPU is watching you perform. Point the attention outward and the mind comes back online.",
      sub: "Self-focused attention (CBT) · Charisma on Command",
    },
    options: [
      { label: "So being interested beats being interesting.", next: "soc_charisma" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  soc_please: {
    coach: [
      "People-pleasing usually isn't kindness — it's a safety behaviour wearing kindness as a costume. Underneath is a learned belief: 'if I disappoint you, I'm in danger / unlovable.' So you auto-agree, over-apologise, and swallow your real opinion to keep everyone soothed.",
      "The cruel irony Charlie points out: it also makes you less liked, not more. A person with no edges, no preferences, no ability to disagree reads as having no SELF — and there's nothing there to connect to.",
    ],
    options: [
      { label: "Oof. So my agreeableness is why I feel invisible?", next: "soc_please2" },
      { label: "But if I say no, people will be upset with me.", next: "soc_please2" },
    ],
  },

  soc_please2: {
    coach: [
      "Partly, yes — and some people WILL be briefly upset, that's real. But that's information about the relationship, not proof you did wrong. A bond that requires you to have no preferences was never a bond; it was a service arrangement.",
      "The reframe: your opinions and your 'no' aren't threats to connection — they're the RAW MATERIAL of it. People bond to a specific person, and specificity means having edges.",
    ],
    insight: {
      title: "Edges make you findable — agreeableness makes you invisible",
      technique: "Assertiveness (DBT) · Values · Warmth × competence",
      source: "Charisma on Command · DBT interpersonal effectiveness · Dr. Judy Ho",
      body: "Charisma needs BOTH warmth and competence — and self-respect is the competence axis. Constant agreement zeroes it out, which is why endless niceness reads as fake or forgettable. Start small: voice one real, low-stakes preference a day ('actually, I'd prefer the other place'), and practise the clean no — 'I can't make that work, but thanks for thinking of me' — with no over-explaining, because justification invites negotiation. Expect guilt; it's the same exit fee as any boundary, and it fades with reps. You're not becoming difficult. You're becoming a specific person other people can actually find and hold onto — playful disagreement, in particular, is one of the most attractive social signals there is, because it says 'I like you AND I have a self.'",
      actions: [
        "Voice one genuine preference a day, starting at low stakes. Reps build the muscle.",
        "Practise the clean no: 'I can't, but thanks for thinking of me.' Then stop talking.",
        "Try playful disagreement with someone safe. Teasing that says 'I like you' is charisma gold.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
      { label: "The self-critical voice underneath is loud too", next: "mind_selftalk" },
    ],
  },

  soc_charisma: {
    coach: [
      "Let's define it properly first, because 'charisma' sounds like a mystical gift you're either born with or not — and Charlie's whole project is proving that's false. It's a set of learnable signals.",
      "The cleanest model: charisma = warmth × competence, shown at the same time. Warmth answers 'are you FOR me?'. Competence answers 'can you back it up?'. Most people accidentally lead with one and starve the other.",
    ],
    options: [
      { label: "So which one am I probably missing?", next: "soc_charisma2" },
      { label: "How do I actually show both at once?", next: "soc_charisma2" },
    ],
  },

  soc_charisma2: {
    coach: [
      "Usually it's warmth that's missing under pressure — because when we want to impress, we go guarded, and guarded reads as cold. The paradox: trying to look impressive is exactly what kills charisma.",
      "Charlie's single most useful reframe: charisma isn't about making people think you're great. It's about making people feel great about THEMSELVES when they're around you. Flip the target, and everything else follows.",
    ],
    note: {
      reframe: "Stop trying to be interesting. Be interested. The most magnetic person in the room is usually the one making someone else feel like the most interesting person in it.",
      sub: "Warmth × competence · Charisma on Command",
    },
    options: [
      { label: "Give me the concrete signals to practise.", next: "soc_charisma3" },
    ],
  },

  soc_charisma3: {
    coach: [
      "Here's the practicable version — a short menu, not a personality overhaul.",
    ],
    insight: {
      title: "Charisma is learnable signals: warmth you show, competence you don't hide",
      technique: "Sub-communication · Warmth × competence · Storytelling",
      source: "Charisma on Command (Charlie Houpert) · social psychology via Big Think",
      body: "Warmth signals: hold eye contact a beat longer than feels natural, react generously (people feel charismatic around those who laugh and light up at them), remember and use small details they mention, and lead with genuine curiosity. Competence signals: speak a little slower and finish your sentences instead of trailing off (fast, hedged, up-talking speech leaks anxiety); have opinions and hold them lightly; and don't fish for approval — outcome independence is the quiet backbone of it all. For stories, Charlie's rule: lead with the interesting bit, keep them short, and make yourself the fool as often as the hero — self-deprecation from someone visibly at ease is pure warmth. None of this can be faked long-term, which is the point: the fastest route to LOOKING magnetic is genuinely enjoying the people in front of you.",
      actions: [
        "Pick ONE warmth signal and one competence signal to run this week. Two levers, not ten.",
        "Slow your speech 15% and finish your sentences. It reads as calm authority instantly.",
        "In your next story, lead with the punchline-adjacent hook and cut it 30% shorter.",
        "Make someone feel like the most interesting person in the room. Watch how they respond to you.",
      ],
    },
    options: [
      { label: "This is what I needed. Back to the wheel.", next: "wheel" },
      { label: "The approach-anxiety piece would help too", next: "soc_approach" },
    ],
  },

  /* ======================================================================
     CAREER
     ====================================================================== */

  career: {
    coach: ["Work — where a third of your waking life goes, so worth deciding well. What's live?"],
    options: [
      { label: "Should I quit my job?", next: "car_quit" },
      { label: "Passion vs. money / the 'safe' path", next: "car_passion" },
      { label: "I think I'm burning out.", next: "car_burnout" },
      { label: "I feel behind everyone my age.", next: "mind_compare" },
    ],
  },

  car_quit: {
    coach: [
      "Big one. Before any framework — the body check, because your body files reports your mind keeps ignoring.",
      "Sunday evening. Work tomorrow. What actually happens in your chest?",
    ],
    options: [
      { label: "Dread. Real, physical dread.", next: "car_dread" },
      { label: "Not dread — more a flatness. Restless. Numb.", next: "car_flat" },
    ],
  },

  car_dread: {
    coach: [
      "Chronic Sunday dread isn't a personality quirk — it's your body billing you for a mismatch. But here's the important part: dread says 'change something', not necessarily 'resign tomorrow'.",
      "Let's make this decision properly, in Wise Mind, instead of in a 2am spiral where fear and fantasy take turns at the wheel.",
    ],
    insight: {
      title: "Decide from age 80; act over 30–60 days",
      technique: "Regret minimisation · Fear-setting · 10/10/10",
      source: "Ali Abdaal · Tim Ferriss & Bezos (via Big Think) · Cal Newport",
      body: "Two exercises, one hour, pen and paper. (1) Regret minimisation: you're 80, looking back — which do you regret, the scary leap or the safe decade? People overwhelmingly regret inaction. (2) Fear-setting: define the worst case in exact detail, how you'd prevent it, and how you'd recover if it happened. Fear does its damage as fog; it shrinks hard when forced into specifics. Then the key realisation: quitting is rarely binary. Interview elsewhere while employed, negotiate a change internally, build the exit skill on nights and weekends. The brave move and the reckless move are not the same move — and conflating them is what keeps people stuck for years.",
      actions: [
        "Do fear-setting tonight, on paper: worst case / how I'd prevent it / how I'd recover. Fog into edges.",
        "Update the CV and take two interviews — options change your psychology even if you stay.",
        "Set a decision deadline (say 60 days). Open loops corrode; deadlines conclude.",
        "Run 10/10/10 on STAYING too. Staying is also a choice, with its own 10-year price.",
      ],
    },
    options: [
      { label: "Honestly it might be burnout, not the job itself", next: "car_burnout" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  car_flat: {
    coach: [
      "Flatness is a different diagnosis than dread, and the difference matters — because people quit good jobs to escape a flatness that quietly follows them to the next one.",
      "Ali Abdaal's feel-good-productivity lens asks a sharper question: is the JOB bad, or has it just gone stale — no growth edge, no play, no autonomy? Those three are usually what died. And sometimes they can be revived right where you are, for a lot less than a resignation.",
    ],
    insight: {
      title: "Audit the job before you leave it",
      technique: "Energy audit · Job-crafting experiment",
      source: "Ali Abdaal (Feel-Good Productivity) · Cal Newport (via Big Think)",
      body: "For two weeks, log energy: which tasks and people leave you fuller, which drain you. Then run ONE deliberate experiment — negotiate toward the energising work, start the slightly-too-hard project, mentor someone, automate the boring part. If the role responds, you've just dodged a lateral move into identical flatness. If it can't respond, the audit becomes the exact spec sheet for what to look for next. Either way you leave (or stay) holding data instead of a mood — and a mood is a terrible thing to resign on.",
      actions: [
        "Two-week energy log: jot +/− after each block of work. The pattern shows up fast.",
        "Pick ONE job-crafting experiment. Run it a month before any resignation letter.",
        "Ask 'what would make this role a 9/10?' If the honest answer is 'nothing available here' — that IS your answer.",
      ],
    },
    options: [
      { label: "The passion-vs-safety question is really the core", next: "car_passion" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  car_passion: {
    coach: [
      "'Follow your passion' is the most expensive free advice ever handed out — because it implies passion is a pre-existing thing you FIND, and the evidence says the opposite.",
      "Cal Newport's research (all over Big Think) and Ali Abdaal's whole arc agree: passion is mostly a BY-PRODUCT of getting good. Competence → autonomy → mattering → the feeling everyone calls passion. It's grown, not discovered — which means 'I haven't found my passion' might just mean 'I haven't gotten good at anything yet.'",
    ],
    options: [
      { label: "So the leap-into-the-dream framing is wrong?", next: "car_passion2" },
      { label: "But I don't even know which direction to build in.", next: "pur_lost" },
    ],
  },

  car_passion2: {
    coach: [
      "The binary itself is the trap — 'soul-dead stable job' vs 'brave leap off a cliff'. There's a robust third door most people never notice.",
    ],
    insight: {
      title: "Don't follow passion — build career capital, then spend it",
      technique: "Career-capital model · Regret minimisation",
      source: "Cal Newport (via Big Think) · Ali Abdaal",
      body: "Keep the income and go all-in on rare, valuable skill in the direction you're drawn to — on the SIDE, for 6–12 focused months. Skill compounds into leverage; leverage buys autonomy; autonomy is what people actually mean when they say 'passion'. The side-bet also generates real data instead of fantasy: many discover the dream is a wonderful hobby (priceless to learn cheaply), while others build a genuine bridge and walk across it without ever white-knuckling a leap. Either outcome beats both the soul-death of staying frozen and the recklessness of jumping blind.",
      actions: [
        "Define the 6–12 month side-bet: which skill, what output, what proof-of-work (portfolio, clients, audience).",
        "Timebox it — 5 focused hours a week beats 40 fantasy hours dreaming about it.",
        "Set the review date and criteria NOW, in writing: what result would justify going further?",
      ],
    },
    options: [
      { label: "I genuinely don't know my direction though", next: "pur_lost" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  car_burnout: {
    coach: [
      "Important distinction first, straight from Dr. K, because it changes the whole treatment plan.",
      "Exhaustion from doing too much heals with rest. Burnout — the cynicism, the detachment, the 'nothing I do matters' — does NOT heal with a holiday. That's why you come back from a week off still empty and panic a little. Burnout is far less about workload than about a drought of efficacy and meaning.",
      "So, honestly — which is it?",
    ],
    options: [
      { label: "Just tired. A real break might genuinely fix me.", next: "car_burnout_rest" },
      { label: "Cynical and detached. Holidays don't touch it.", next: "car_burnout_deep" },
    ],
  },

  car_burnout_rest: {
    coach: [
      "Then the assignment is unglamorous but real: actual rest, taken seriously, before it graduates into the other kind. And 'rest' means the nervous-system kind — not doom-scrolling in bed while feeling guilty about resting, which keeps your stress system fully lit.",
    ],
    insight: {
      title: "Real rest is a skill, and it has a technique",
      technique: "Parasympathetic recovery · Boundaries",
      source: "HealthyGamerGG · Ali Abdaal",
      body: "Screens-plus-guilt is fake rest. Genuine recovery needs: sleep made non-negotiable for two weeks, movement that isn't punishment, some time outdoors, and at least one full day with zero productivity obligations — logged out, actually. Protect it like a meeting with someone who matters, because it is one. The test of real rest is simple: afterwards you feel refilled, not more numb. If a proper break refills you, it was exhaustion. If it doesn't touch it, come back and we'll treat the deeper kind.",
      actions: [
        "Book the recovery day(s) into the calendar now — unbooked rest never happens.",
        "Two-week sleep protocol: fixed wake time, screens out of the final hour.",
        "One session of movement you'd do even if it burned zero calories.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  car_burnout_deep: {
    coach: [
      "Then hear this clearly, because it's the part people get backwards: more discipline will make it WORSE.",
      "Deep burnout is a meaning problem wearing an energy costume. The tank isn't empty because you worked hard — it's empty because nothing you do refills it. Grinding harder just drains a tank with no inlet.",
    ],
    note: {
      reframe: "Burnout's core wound isn't 'I'm tired.' It's 'my effort doesn't matter.' You don't fix that with rest OR discipline. You fix it by restoring visible impact.",
      sub: "Efficacy & meaning · HealthyGamerGG (Dr. K)",
    },
    options: [
      { label: "So how do I restore that?", next: "car_burnout_deep2" },
    ],
  },

  car_burnout_deep2: {
    coach: [
      "Small, visible, chosen impact — the exact opposite of the vague, effortful, thankless work that drained you.",
    ],
    insight: {
      title: "Refill efficacy, not just energy",
      technique: "Behavioural activation · Values reconnection (ACT)",
      source: "HealthyGamerGG (Dr. K on burnout) · Dr. Judy Ho",
      body: "The repair for 'my effort doesn't matter' is one project — at work or entirely outside it — where you can SEE cause and effect again: help one person, build one small thing, fix one broken process, and watch it land. Pair it with subtraction: name your single biggest drain and negotiate one real reduction (DEARMAN works at work too). And if the environment itself is the wound — chronic disrespect, impossible targets, no autonomy — name that honestly, because you cannot self-care your way out of a meat grinder. That's the quit-question, and it deserves the full treatment rather than another wellness app.",
      actions: [
        "Start one small cause-and-effect project this week. Visible outcome, short feedback loop.",
        "Name your biggest drain; make one concrete ask to reduce it.",
        "If detachment persists past a month of this, take the quit-question seriously — and consider a professional; burnout and depression overlap, and a clinician can tell them apart.",
      ],
    },
    options: [
      { label: "Take me to the quit question", next: "car_quit" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  /* ======================================================================
     MONEY
     ====================================================================== */

  money: {
    coach: ["Money decisions — where psychology quietly does most of the spending. What's yours?"],
    options: [
      { label: "I want to buy something big (car, watch, upgrade…).", next: "mon_big" },
      { label: "I keep impulse-spending.", next: "mon_impulse" },
      { label: "Money anxiety, even though I'm technically fine.", next: "mon_anx" },
    ],
  },

  mon_big: {
    coach: [
      "The big purchase. And I want to be clear — I'm not here to talk you out of it. I'm here to make sure the thing you buy actually delivers the feeling you're buying it FOR. Most regret comes from a mismatch between the two.",
      "So, honestly: when you picture owning it, what's the feeling in the fantasy?",
    ],
    options: [
      { label: "The thrill. It would just feel amazing.", next: "mon_big_hedonic" },
      { label: "Status. People would see me differently.", next: "mon_big_status" },
      { label: "It genuinely solves a daily problem.", next: "mon_big_utility" },
    ],
  },

  mon_big_hedonic: {
    coach: [
      "Okay. Then let me hand you the single most useful finding in the happiness literature — Dan Gilbert's work, huge on Big Think — because almost nobody prices it in.",
      "You will adapt. Completely. The Ferrari is euphoric for weeks, thrilling for a few months, and then it's just… 'my car'. Same commute, same you, plus an insurance bill. Lottery-winner studies show happiness returning to baseline within about a year.",
      "Your brain is a difference-detector. It only really feels what's NEW — and ownership is a machine for turning new into normal.",
    ],
    options: [
      { label: "So the thrill I'm imagining has an expiry date.", next: "mon_big_hedonic2" },
      { label: "Honestly, it might be a status thing underneath too.", next: "mon_big_status" },
    ],
  },

  mon_big_hedonic2: {
    coach: [
      "A short one. And this isn't anti-Ferrari — it's pro-arithmetic. Because some purchases genuinely RESIST adaptation, and the research is remarkably consistent about which ones.",
    ],
    insight: {
      title: "You're buying a feeling with a half-life — so buy the ones that last",
      technique: "Hedonic adaptation · Affective forecasting · 10/10/10",
      source: "Dan Gilbert (Big Think) · HealthyGamerGG · lottery/adaptation research",
      body: "Adaptation-resistant purchases: experiences (they end before you fully adapt, then appreciate in memory), anticipation (booking a trip pays out happiness for months in advance), buying back time (outsourcing what you hate frees hours you feel every week), and shared consumption (things done WITH people resist adaptation because the people keep changing). Objects, by contrast, go quiet fast. So the move isn't necessarily 'don't' — it's aim the money at what your brain can't normalise. And if the cash is genuinely spare after that: rent the Ferrari for a weekend. You'll capture ~90% of the peak feeling for ~2% of the price, and the peak was always the actual product.",
      actions: [
        "Run 10/10/10: the thrill in 10 minutes, the payment in 10 months, the verdict in 10 years.",
        "Rent-before-buy for anything over a month's income — test the fantasy at retail before you marry it.",
        "Redirect a slice into an experience with people you love, booked far ahead — the anticipation is free happiness.",
        "30-day cooling-off list. Still want it on day 30? Buy it guilt-free. Most things don't survive the wait.",
      ],
    },
    options: [
      { label: "The status angle is real for me too", next: "mon_big_status" },
      { label: "Convinced. Back to the wheel.", next: "wheel" },
    ],
  },

  mon_big_status: {
    coach: [
      "Respect for admitting it — status motives are universal, and lying about them is exactly how they run the show from the back seat.",
      "Two problems, though. One: nobody thinks about your car anywhere near as much as you imagine (the spotlight effect — robust, and humbling). Two: status bought off a shelf is status anyone with credit can copy, which is precisely why it never quite lands the way you picture.",
    ],
    options: [
      { label: "So what kind of status actually sticks?", next: "mon_big_status2" },
      { label: "Show me the adaptation piece too", next: "mon_big_hedonic" },
    ],
  },

  mon_big_status2: {
    coach: [
      "The kind people can't withdraw when the model year changes.",
    ],
    insight: {
      title: "Earned status sticks; purchased status leaks",
      technique: "Spotlight effect (CBT) · Values check",
      source: "Big Think (social psychology) · Charisma on Command",
      body: "The admiration that actually lasts attaches to competence, generosity and presence — being visibly excellent at something, being the person who helps, being magnetic in a room. That's Charlie's entire catalogue: status is granted to how you make people FEEL, not to what you park. If the deeper wish underneath the object is 'I want to feel respected', then the object is a proxy — and proxies are exactly what we hedonically adapt to fastest, which is why the next purchase always calls soon after. Spend a chunk of that money on the thing that earns the respect for real, and it compounds instead of depreciating off the forecourt.",
      actions: [
        "Finish honestly: 'I want people to think I'm ____.' Then ask what actually earns that word.",
        "Invest a share of the purchase price into the skill or body of work that earns it for real.",
        "Flex-audit: name the last three status purchases by OTHERS that changed your opinion of them. Struggling? So is everyone, about yours.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  mon_big_utility: {
    coach: [
      "Genuine daily utility is the GOOD reason to buy things — and it's the category people systematically UNDER-spend on while over-spending on things meant to be seen. The mattress you're on a third of your life, the chair, the tools of your actual trade.",
      "Quick math beats vibes here.",
    ],
    insight: {
      title: "Cost-per-use is the honest price tag",
      technique: "Cost-per-use analysis · 30-day rule",
      source: "Ali Abdaal · consumer research (via Big Think)",
      body: "Divide the price by realistic uses over its lifetime. The £1,200 chair you sit in 2,000 hours a year costs pennies an hour; the £300 gadget used twice costs £150 a go. One caveat before checkout: confirm it solves a problem you actually HAVE, not one an advert installed last week — the 30-day list catches those beautifully. If it survives both the wait and the arithmetic, buy the good one once, without guilt. Buying quality for real daily use is one of the few purchases that reliably pays you back.",
      actions: [
        "Compute cost-per-use with pessimistic usage estimates. Let the number decide.",
        "30 days on the list. Still needed? Buy quality, once.",
        "Sanity check: was this a problem before I saw the ad?",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  mon_impulse: {
    coach: [
      "Impulse spending is rarely about the items — you're buying a mood exit. Dr. K's framing lands it: the purchase is a dopamine lever you pull when something else feels bad. And here's the tell — the item itself often stays half-opened in the box. It was never the point.",
      "Quick check: when the urge hits, what's usually just happened?",
    ],
    options: [
      { label: "Stress, boredom, or a bad feeling I want gone.", next: "mon_impulse2" },
      { label: "No pattern — it just… happens.", next: "mon_impulse2" },
    ],
  },

  mon_impulse2: {
    coach: [
      "('It just happens' is simply a pattern you haven't logged yet — the two-week log below will find it, they always do.)",
      "The good news is that craving has a SHAPE. It spikes, peaks, and collapses within about 15–20 minutes if you don't feed it. Every urge you surf instead of obey literally retrains the circuit to fire less.",
    ],
    insight: {
      title: "Add friction, surf the spike, then feed the REAL need",
      technique: "Urge surfing (DBT) · Stimulus control (CBT) · Dopamine",
      source: "HealthyGamerGG (Dr. K) · DBT skills · Dr. Judy Ho",
      body: "Three layers. Friction: delete saved cards, remove the shopping apps, unsubscribe from the temptation emails — every added step lets the urge peak before checkout. Surfing: when it hits, name it ('urge, 7/10'), start a 20-minute timer, and watch it as a body sensation rather than a command. Root cause: log what preceded each urge for two weeks, then answer the REAL trigger directly — stress → walk or shower; boredom → an actual hands-on hobby; loneliness → a message to a friend. The cart was answering a question; answer the question and the cart goes quiet. Dopamine is the wanting chemical, and the buy is bait — the wanting fades whether or not you bite.",
      actions: [
        "Tonight: remove saved payment methods and the two worst apps.",
        "Wishlist rule — everything waits 30 days on a list. It's astonishing what evaporates.",
        "Two-week trigger log: time, feeling, and what happened just before.",
      ],
    },
    options: [
      { label: "This is the scrolling problem too, isn't it", next: "hab_dopamine" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  mon_anx: {
    coach: [
      "Money anxiety that ignores your actual balance isn't a math problem — it's a felt-SAFETY problem, usually installed young. Your amygdala doesn't read spreadsheets; it just knows a childhood weather pattern and keeps forecasting it.",
      "So we work both ends: give the fear real numbers, and calm the body that's sounding the alarm.",
    ],
    insight: {
      title: "Give the fear numbers and a floor",
      technique: "CBT decatastrophising · Somatic regulation",
      source: "CBT protocols · Dr. Judy Ho · Kelly McGonigal (Big Think)",
      body: "Anxiety thrives on vagueness, so make everything specific. Write the actual worst case with real figures: if income stopped today, how many months does your runway hold, and what exactly would you cut, sell or do? Almost everyone finds the concrete floor sits far above the imagined abyss. Then automate safety so it accrues without daily vigilance — an auto-transfer to an emergency fund — and cap account-checking at once a week, because compulsive checking feeds the loop exactly like re-checking a locked door. When a wave hits anyway, treat it as a body event (long exhales, cold water, movement), not a summons to re-run the spreadsheet at 1am. And note Kelly McGonigal's reframe: that jolt of arousal is your body mobilising resources, not proof of catastrophe.",
      actions: [
        "Write the numeric worst case plus your response plan. Fog into a floor.",
        "Automate the emergency-fund transfer, however small. Automatic beats anxious.",
        "Cap account-checking at once a week. Notice the urge to peek, and surf it.",
      ],
    },
    options: [
      { label: "The physical anxiety part is the worst of it", next: "mind_soma" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  /* ======================================================================
     HABITS & FOCUS
     ====================================================================== */

  habits: {
    coach: ["Habits and focus — where decisions become a body and a brain. What's the sticking point?"],
    options: [
      { label: "I can't stick to anything (gym, diet, routines).", next: "hab_stick" },
      { label: "I'm losing hours to scrolling / gaming.", next: "hab_dopamine" },
      { label: "I procrastinate the things that matter most.", next: "hab_procrast" },
    ],
  },

  hab_stick: {
    coach: [
      "First, some absolution: quitting habits isn't a willpower defect. Dr. Judy Ho's work on self-sabotage points at the real culprit — the ARCHITECTURE of the goal. It's usually avoidance-framed, identity-less, and sized for your most motivated day instead of your worst one.",
      "Motivation, remember, is weather — not climate. Any plan that needs it to be sunny will fail the first grey week.",
    ],
    options: [
      { label: "So how do I design a habit that survives the grey weeks?", next: "hab_stick2" },
    ],
  },

  hab_stick2: {
    coach: [
      "Three fixes, and they stack.",
    ],
    insight: {
      title: "Shrink it, approach-frame it, tie it to identity",
      technique: "Approach goals · Tiny habits · Identity-based change",
      source: "Dr. Judy Ho · Ali Abdaal · Angela Duckworth & behavioural science (Big Think)",
      body: "(1) Approach, not avoidance: 'train 3× a week' aims your brain somewhere; 'stop being lazy' just points it at the fear and freezes it. (2) Size for your WORST day: the real habit is the floor version — two minutes of exercise, one sentence of journaling. Consistency carves the neural groove; intensity can visit later once the groove exists. (3) Vote for an identity: every rep is a ballot for 'I'm someone who trains', and identity is what remains standing when motivation leaves — which it will. Duckworth's grit research backs the throughline: effort counts twice, and it's showing up on the bad days, not the heroic bursts, that compounds. Missing once is data; missing twice is the start of a new habit — the never-twice rule is basically the whole game.",
      actions: [
        "Rewrite the goal in approach language, sized so your WORST day can still complete it.",
        "Anchor it to an existing routine: 'after [coffee], I do [the floor version].'",
        "Adopt never-twice: miss once freely, never twice in a row.",
        "Say the identity out loud as you do it: 'I'm a person who shows up.' Corny. Works.",
      ],
    },
    options: [
      { label: "The scrolling is what eats my time though", next: "hab_dopamine" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  hab_dopamine: {
    coach: [
      "Dr. K's frame is the honest one, so let me lead with it: the scrolling isn't the problem. It's the SOLUTION your brain found to a problem you haven't named yet.",
      "Discomfort shows up — boredom, anxiety, loneliness, a task you're dreading — and the phone deletes it in under a second. That's not weakness. That's the most efficient relief button ever engineered, sitting in your pocket, fully charged, always.",
    ],
    options: [
      { label: "So the phone is a symptom, not the disease.", next: "hab_dopamine2" },
      { label: "But knowing that, I still can't put it down.", next: "hab_dopamine2" },
    ],
  },

  hab_dopamine2: {
    coach: [
      "Right — and that's because you're fighting the single most optimised dopamine machine in human history with raw willpower, which is a losing matchup. You don't out-willpower a slot machine; you change the game.",
      "One more piece of the mechanism, from Dr. K and Loretta Breuning: dopamine is the WANTING chemical, not the liking one. It spikes on the chase and drops on arrival — which is exactly why the feed feels urgent yet leaves you empty. You're not enjoying it. You're wanting it, on a loop.",
    ],
    note: {
      reframe: "The scroll isn't giving you pleasure. It's giving you wanting — and wanting, unlike liking, never fills up. That's the whole trap, in one sentence.",
      sub: "Dopamine ≠ pleasure · HealthyGamerGG · Loretta Breuning (Big Think)",
    },
    options: [
      { label: "Okay. How do I actually break the loop?", next: "hab_dopamine3" },
    ],
  },

  hab_dopamine3: {
    coach: [
      "You compete with the phone on three fronts instead of just gritting your teeth on one.",
    ],
    insight: {
      title: "Compete with the phone — don't just fight it",
      technique: "Dopamine hygiene · Urge surfing · Stimulus control",
      source: "HealthyGamerGG (Dr. K) · Ali Abdaal · Loretta Breuning (Big Think)",
      body: "Friction: grayscale on, phone out of the bedroom, worst apps logged-out or deleted — every second of delay lets the prefrontal cortex catch up to the impulse. Substitution: the freed hours MUST go somewhere with real feedback (an instrument, a sport, making anything), because boredom with no alternative always loses to the feed. Tolerance training: schedule small doses of doing absolutely nothing — a 10-minute walk with no audio — so mild discomfort stops being an emergency the phone has to fix; this is essentially Dr. K's meditation point, learning to sit with a feeling instead of deleting it. The urge spikes hardest around day 2–3 and fades over weeks. The quiet on the other side is the actual reward — and it's serotonin-and-calm, not another dopamine hit.",
      actions: [
        "Tonight: phone charges OUTSIDE the bedroom. This one change carries half the results.",
        "Grayscale on; worst two apps logged out or deleted (they'll survive — you can reinstall).",
        "Pick the substitution activity and schedule it into the exact hours the scroll used to fill.",
        "One 10-minute nothing-walk daily: no phone, no audio. It's a rep for your attention span.",
      ],
    },
    options: [
      { label: "This connects to my impulse spending too", next: "mon_impulse" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  hab_procrast: {
    coach: [
      "The research reframe that changes the whole fight: procrastination is NOT a time-management problem. It's an EMOTION-management problem.",
      "You're not avoiding the task. You're avoiding a FEELING the task triggers — overwhelm, fear of doing it badly, boredom, resentment. The task is just where that feeling lives, so you flinch away from the whole thing.",
    ],
    options: [
      { label: "So the fix isn't a better schedule.", next: "hab_procrast2" },
      { label: "But I keep waiting to 'feel ready' and never do.", next: "hab_procrast2" },
    ],
  },

  hab_procrast2: {
    coach: [
      "Exactly — and 'waiting to feel ready' is the core error. Ali Abdaal puts it perfectly: motivation follows action, it doesn't precede it. You're waiting at the station for a train that only leaves AFTER you start walking.",
      "The discomfort actually peaks BEFORE you begin, then drops once you're moving — which is why starting is the hardest part and momentum does the rest for free.",
    ],
    insight: {
      title: "Name the feeling, shrink the start",
      technique: "Emotion labelling · 5-minute rule · Feel-good productivity",
      source: "Ali Abdaal · CBT · Dr. Judy Ho",
      body: "Step one: ask 'what feeling am I dodging here?' — naming it (affect labelling) measurably lowers its charge. Step two: make the start laughably small — open the document, write one ugly sentence, put on the gym shoes — and commit to five minutes with full permission to stop. Since the dread peaks before you begin, five honest minutes almost always becomes more. Step three: lower the stakes — first drafts are allowed to be bad, and 'done then better' beats 'perfect but imaginary' every single time. And if one specific task has survived weeks of this treatment, it's telling you something real: renegotiate it, delegate it, or admit it isn't actually yours to do.",
      actions: [
        "Before the next avoided task: name the feeling out loud, then set a 5-minute timer.",
        "Define 'ridiculously done' for step one — one sentence, one email, one set.",
        "Eat the frog: the avoided thing goes FIRST tomorrow, before the inbox eats your willpower.",
      ],
    },
    options: [
      { label: "Underneath it is a harsh inner voice, honestly", next: "mind_selftalk" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  /* ======================================================================
     MIND & EMOTIONS
     ====================================================================== */

  mind: {
    coach: ["The inner weather. Which pattern's running the show?"],
    options: [
      { label: "I overthink every decision into paralysis.", next: "mind_overthink" },
      { label: "Anxiety lives in my body — chest, gut, jaw.", next: "mind_soma" },
      { label: "My self-talk is brutal.", next: "mind_selftalk" },
      { label: "I feel emotionally numb / can't name what I feel.", next: "mind_numb" },
      { label: "I'm anxiously attached / obsess over people.", next: "mind_attach" },
      { label: "I compare myself to everyone and lose.", next: "mind_compare" },
    ],
  },

  mind_overthink: {
    coach: [
      "Barry Schwartz's paradox-of-choice research — a Big Think classic — has your diagnosis. He splits people into two types.",
      "Maximisers must find THE best option; they end up objectively slightly better off and subjectively far more miserable. Satisficers define 'good enough' in advance and take the first option that clears the bar — and they're happier with the same outcomes.",
      "The kicker: for most decisions the options differ by maybe 10%, but the agonising costs you 90% of your peace.",
    ],
    options: [
      { label: "So I'm maximising things that don't deserve it.", next: "mind_overthink2" },
      { label: "But how do I know which decisions deserve the effort?", next: "mind_overthink2" },
    ],
  },

  mind_overthink2: {
    coach: [
      "By triaging them — because the mistake isn't overthinking, it's overthinking EVERYTHING at the same intensity. Most decisions are cheap and reversible and deserve a timer, not a summit.",
    ],
    insight: {
      title: "Satisfice on purpose; save maximising for the few that earn it",
      technique: "Satisficing · Wise Mind · Decision triage",
      source: "Barry Schwartz (Big Think) · DBT",
      body: "Sort your decisions into two bins. Type 1 — reversible, low-stakes (most of them): write the 'good enough' criteria BEFORE you look, set a timer, and take the first option that clears the bar, no re-litigating. Type 2 — rare, irreversible, high-stakes: give those the full treatment (10/10/10, fear-setting, sleep on it). The overthinking loop itself is Emotion Mind wearing a lab coat — it feels like diligence but it's anxiety doing laps, and the third re-analysis of the same options adds no information, only cortisol. When you catch that third loop, that's Wise Mind's cue: 'I already know enough. What do I already know?'",
      actions: [
        "For the current decision: write the 'good enough' bar in one sentence, then set a deadline.",
        "For streams of options (flats, candidates): survey the first ~third without committing, then take the next one better than everything so far.",
        "Catch re-analysis #3 and name it: 'this is anxiety, not analysis.' Then decide.",
      ],
    },
    options: [
      { label: "My anxiety is more physical than mental, actually", next: "mind_soma" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  mind_soma: {
    coach: [
      "Then let's start where it actually lives. 'Psychosomatic' doesn't mean imaginary — it means the opposite. Emotions are BODY events first. The thought 'something is wrong' is often just your mind writing a caption for a clenched gut that started for physical reasons — bad sleep, caffeine, shallow breathing.",
      "Which hands you a lever most people never use: regulate the body, and the thoughts lose their sponsor.",
    ],
    options: [
      { label: "So I can calm the thoughts by calming the body?", next: "mind_soma2" },
    ],
  },

  mind_soma2: {
    coach: [
      "Directly. The body has an override the thinking mind doesn't — and there's a reframe from Kelly McGonigal (Big Think) that changes the meaning of the whole sensation: that racing arousal before something important isn't a malfunction. It's your body delivering oxygen and focus to help you rise to the thing.",
    ],
    insight: {
      title: "The body is the front door",
      technique: "Somatic regulation · TIPP (DBT) · Stress reappraisal",
      source: "DBT skills · HealthyGamerGG · Kelly McGonigal (Big Think)",
      body: "Fast levers, in order of speed: (1) exhale longer than you inhale — 4 in, 8 out, ten rounds; it's the vagus-nerve brake pedal and it works mid-meeting, invisibly. (2) Cold water on face or wrists triggers the dive reflex and drops heart rate in seconds (the T and I of DBT's TIPP). (3) Ground through the senses — 5 things you see, 4 you feel, 3 you hear — which yanks attention out of the doom-simulator and into the room, where things are usually fine. Then, calmer, ask the caption question: 'is this signal about something real to act on, or just weather?' Act on signals; let weather pass. And use McGonigal's reframe live — 'this is my body getting me ready' beats 'this is my body betraying me', same physiology, better outcome. Underneath it all, do the maintenance: sleep, movement and less caffeine delete half the false alarms at the source.",
      actions: [
        "Learn 4–8 breathing NOW, while calm — skills practised calm are the only ones available when panicked.",
        "Body-scan before big decisions: jaw, shoulders, chest, gut. Choices made mid-adrenaline get regretted.",
        "Reappraise on the spot: 'my body is getting me ready,' not 'my body is failing.'",
        "Audit the false-alarm factories: caffeine after noon, sleep debt, zero movement.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  mind_selftalk: {
    coach: [
      "Quick experiment before any theory. Say the last brutal thing you told yourself — 'you're pathetic, you always ruin everything' — but now imagine saying it, word for word, to your best friend right after THEY failed at the same thing.",
      "You wouldn't. Not because you'd be lying to spare them, but because it's neither true nor useful. And yet you're a permanent, captive audience to a voice using a standard you'd never inflict on someone you love.",
    ],
    options: [
      { label: "But the harsh voice keeps me from getting lazy…", next: "mind_selftalk_motiv" },
      { label: "How do I actually quiet it?", next: "mind_selftalk2" },
    ],
  },

  mind_selftalk_motiv: {
    coach: [
      "That's the critic's best lie — 'without me you'd fall apart.' The research says the exact opposite.",
      "Self-compassion beats self-criticism on motivation AND on recovery from failure. Why? Because people who aren't terrified of their own inner verdict take more risks, quit less, and get back up faster. The harsh voice doesn't drive you — it just makes failure so scary you avoid the arena entirely.",
    ],
    note: {
      reframe: "Self-criticism feels like the thing keeping your standards high. It's actually the thing keeping your attempts low. Kindness is the higher-performance setting.",
      sub: "Self-compassion research · CBT",
    },
    options: [
      { label: "Okay. So how do I retrain the voice?", next: "mind_selftalk2" },
    ],
  },

  mind_selftalk2: {
    coach: [
      "You cross-examine it instead of believing it — CBT's core move.",
    ],
    insight: {
      title: "Cross-examine the critic",
      technique: "CBT thought records · Self-compassion · Cognitive defusion",
      source: "CBT protocols · Dr. Judy Ho · HealthyGamerGG",
      body: "The critic survives on two myths: that it's TRUE (it's usually a cocktail of named distortions — all-or-nothing, mind-reading, overgeneralising) and that it's NECESSARY (covered above — it isn't). Practice: catch the thought, name its distortion out loud, then answer it the way you'd answer about a friend — honest, kind, specific. Not hollow propaganda like 'I'm amazing' (your brain rejects that instantly), but 'I handled that badly AND I've handled worse better AND here's the next step.' Dr. K adds a defusion trick that genuinely helps: give the critic a slightly ridiculous name, so 'I'm worthless' becomes 'ah, Gerald's got notes again' — you can't fully obey a voice you've named Gerald.",
      actions: [
        "One-line thought record for a week: trigger → harsh thought → distortion name → friend-version.",
        "Name the critic something absurd. Defusion through comedy actually works.",
        "After any failure, mandatory question: 'what would I tell my best friend right now?' Then take your own advice.",
      ],
    },
    options: [
      { label: "The comparison thing feeds this a lot", next: "mind_compare" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  mind_numb: {
    coach: [
      "This one's under-discussed, and Dr. K is excellent on it, so let me go carefully.",
      "A lot of people — men especially — were quietly trained out of naming feelings. 'Don't be dramatic', 'man up', 'you're fine.' So the emotional vocabulary never developed, and now feelings don't arrive as words — they arrive as a vague physical PRESSURE that leaks out sideways as irritability, numbness, or three hours of scrolling.",
      "Does that land?",
    ],
    options: [
      { label: "Yeah — I genuinely can't tell what I feel, just 'off'.", next: "mind_numb2" },
      { label: "I feel things but they come out as anger or nothing.", next: "mind_numb2" },
    ],
  },

  mind_numb2: {
    coach: [
      "That's alexithymia — difficulty identifying and describing your own emotions — and it's not a fixed trait. It's an untrained skill, which means it's a trainable one.",
      "The core practice is almost stupidly simple, but it rewires things: put the precise word on the feeling. 'Name it to tame it' isn't a slogan — affect-labelling research shows naming an emotion measurably lowers its intensity in the brain. You can't regulate, or even locate, what you can't name.",
    ],
    insight: {
      title: "Build the emotional vocabulary you were never taught",
      technique: "Affect labelling · Interoception · Emotional granularity",
      source: "HealthyGamerGG (Dr. K) · CBT · affective-neuroscience research",
      body: "Start with the body, since that's where the signal actually is: two or three times a day, pause and ask 'where is there sensation, and what is it?' — tight throat, heavy chest, restless legs. Then reach for a specific word, not just 'good/bad/fine' — is it disappointment, resentment, dread, loneliness, relief? Precision is the whole point: 'bad' can't be acted on, but 'I feel unappreciated' points straight at a conversation. Keep a one-line feelings log for a couple of weeks and the fog starts resolving into information. This is the base skill under everything else here — you can't do DBT, set boundaries, or make Wise-Mind decisions on emotions you can't even see. And it dissolves the leakage: named feelings stop escaping as anger and scrolling.",
      actions: [
        "3× a day: pause, scan the body, name the sensation AND the specific emotion under it.",
        "Trade 'fine' for precision — disappointed? resentful? uneasy? relieved? Widen the vocabulary.",
        "One-line feelings log for two weeks. Watch 'off' resolve into actual, actionable information.",
      ],
    },
    options: [
      { label: "This is connected to the numbing/scrolling for me", next: "hab_dopamine" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  mind_attach: {
    coach: [
      "Okay. Anxious attachment — the spiral where a slow text reply can hijack your whole afternoon, and 'are we okay?' runs on a loop. First thing: this is a nervous-system pattern, not a flaw in your character or a sign you're 'too much'.",
      "Dr. K's framing: if early on, love came with unpredictability, your system learned to treat any ambiguity as a THREAT to survival. So a delay isn't experienced as a delay — it's experienced as danger, and the panic that follows is your alarm doing its job too well.",
    ],
    options: [
      { label: "Yes — a slow reply genuinely feels like an emergency.", next: "mind_attach2" },
    ],
  },

  mind_attach2: {
    coach: [
      "Right, and here's the crucial move: the panic is real, but the emergency is not. The gap between those two is where all your freedom lives.",
      "The instinct is to discharge the panic immediately — double-text, seek reassurance, pick a fight to force contact. That's a covert bid for regulation, and it works for about ten minutes before the anxiety returns hungrier. The skill is to regulate YOURSELF through the wave first, so you respond from Wise Mind instead of the alarm.",
    ],
    note: {
      reframe: "The story says 'they're pulling away and I need to act NOW.' The truth is usually 'my alarm is firing and I need to soothe ME first.' Regulate the self, then relate to the person.",
      sub: "Anxious attachment · Self-regulation · HealthyGamerGG (Dr. K)",
    },
    options: [
      { label: "How do I actually ride the wave instead of acting?", next: "mind_attach3" },
    ],
  },

  mind_attach3: {
    coach: [
      "Same urge-surfing physiology as any craving — plus you slowly teach the system that ambiguity isn't death.",
    ],
    insight: {
      title: "Soothe yourself first, then relate from Wise Mind",
      technique: "Self-regulation · Urge surfing · Attachment repair",
      source: "HealthyGamerGG (Dr. K) · DBT · attachment research",
      body: "When the spike hits (slow reply, plans changed, a distant tone), name it — 'my attachment alarm is firing, this is the pattern, not a verdict.' Then downshift the body: long exhales, a walk, cold water. Do NOT act while flooded — the double-text and the manufactured fight are the anxiety spending itself, and they reliably make the very abandonment you fear more likely. Instead, self-soothe until the wave drops, THEN decide if there's a real, calm need to express (DEARMAN handles that cleanly). Over time this does two things: it stops the self-sabotage, and it gently retrains your system that a gap in contact is survivable — the alarm gets quieter each time it fires and nothing bad happens. And the deeper work underneath: build a life and a sense of self solid enough that one person's response isn't load-bearing for your whole mood.",
      actions: [
        "When the spike hits: name it, then 20 minutes of body-first soothing BEFORE any message.",
        "Never send from the flood. Draft it, wait for the wave to drop, then decide if it's still needed.",
        "Build the non-relationship pillars — friends, purpose, body — so no single reply can move your whole day.",
      ],
    },
    options: [
      { label: "This is exactly my dating pattern too", next: "sel_1" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  mind_compare: {
    coach: [
      "The comparison game runs on a rigged scoreboard, and naming the rig is half the cure.",
      "You compare your INSIDES — the doubts, the drafts, the 3am fears — against everyone else's OUTSIDES, which are curated highlight reels. You will lose every single round, because you're the only contestant whose bloopers you've actually seen.",
    ],
    options: [
      { label: "But some people ARE genuinely ahead of me.", next: "mind_compare2" },
      { label: "And I can't stop checking how I measure up.", next: "mind_compare_loop" },
    ],
  },

  mind_compare_loop: {
    coach: [
      "That checking is the other half, and Dr. K names it precisely: comparison isn't just painful, it's a dopamine LOOP. Checking your rank delivers a hit — a little high when you're 'winning', a wound when you're not — and both demand a re-check. Same wanting-not-liking machinery as the scroll.",
      "So it's not just that comparison hurts. It's that it's mildly addictive, which is why 'just stop comparing' never works.",
    ],
    options: [
      { label: "So how do I break both the hurt and the loop?", next: "mind_compare2" },
    ],
  },

  mind_compare2: {
    coach: [
      "By changing the axis of comparison and cutting the loop's supply — and by noticing whose race you're even running.",
    ],
    insight: {
      title: "Compare down your own timeline, not across the feed",
      technique: "Social comparison theory · Values redirect (ACT) · Dopamine hygiene",
      source: "Big Think (social psychology) · HealthyGamerGG (Dr. K) · Ali Abdaal",
      body: "The only comparison with clean data is you-versus-you-a-year-ago: same subject, full information, an actionable delta. Everything else is measurement error dressed as a verdict. Practically: mute — not unfollow, no drama needed — the five accounts that reliably leave you worse, which starves the dopamine loop of fuel. Then interrogate the word 'behind': behind WHOSE schedule, toward WHOSE finish line? 'Behind' almost always assumes a single track and a borrowed set of goals you never actually chose. Define your own — 'if no one could see my life, I'd still want ____' — and half the racers vanish, because they were never running your race in the first place.",
      actions: [
        "Write your honest one-year-ago comparison: skills, relationships, self-knowledge. That delta is real and it's yours.",
        "Mute the worst five accounts tonight. Check your mood a week later.",
        "Finish: 'If no one could ever see it, I'd still want ____.' That list is your actual race.",
      ],
    },
    options: [
      { label: "That last question opens the whole purpose thing", next: "pur_lost" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  /* ======================================================================
     PURPOSE & MEANING
     ====================================================================== */

  purpose: {
    coach: ["The big-picture questions. Which one's loudest right now?"],
    options: [
      { label: "I feel directionless — no idea what I want.", next: "pur_lost" },
      { label: "I hit the goals… and felt nothing.", next: "pur_arrival" },
      { label: "Life feels like pleasure-seeking with no meaning.", next: "pur_pleasure" },
    ],
  },

  pur_lost: {
    coach: [
      "First, Dr. K's reframe, because it removes the panic: 'find your purpose' is a broken question.",
      "Purpose isn't an object hidden somewhere you haven't looked. It's a by-product of ENGAGEMENT — you act, and meaning precipitates out of the acting, like warmth out of motion. He calls it dharma: it condenses where your energy meets a need in the world.",
      "So 'directionless' isn't really a knowledge problem. It's a CONTACT problem — not enough collisions with reality lately.",
    ],
    options: [
      { label: "So I can't think my way to it — I have to move.", next: "pur_lost2" },
      { label: "But I've tried things and nothing 'clicked'.", next: "pur_lost_click" },
    ],
  },

  pur_lost_click: {
    coach: [
      "Two things about 'nothing clicked'. One: 'click' is a Hollywood expectation — most real purpose arrives as a quiet 'huh, I'd do more of that', not a lightning bolt. If you're waiting for the bolt, you'll walk right past the quiet version.",
      "Two: how long did you actually stay? The clicking usually needs enough reps to get slightly good — because the meaning is downstream of competence, and competence is downstream of staying past the awkward-beginner valley most people quit in.",
    ],
    note: {
      reframe: "You're not waiting to feel a calling before you commit. Commitment to something specific, held past the beginner slump, is what MANUFACTURES the feeling of calling.",
      sub: "Dharma · mastery precedes passion · HealthyGamerGG + Cal Newport",
    },
    options: [
      { label: "Okay. How do I run this properly?", next: "pur_lost2" },
    ],
  },

  pur_lost2: {
    coach: [
      "You follow curiosity at small scale, run cheap experiments, and watch what creates aliveness versus what just kills time. Purpose is discovered in motion, not deduced on the sofa.",
    ],
    insight: {
      title: "Purpose is grown in motion, not found in thought",
      technique: "Behavioural activation · Values sort (ACT) · Curiosity-following",
      source: "HealthyGamerGG (Dr. K on dharma) · Ali Abdaal · Cal Newport & Waldinger (Big Think)",
      body: "You cannot think your way to purpose from a stationary position — introspection with no new input just reshuffles old cards. The protocol: follow curiosity at small scale (curiosity is values leaking through — the trailhead, not a distraction), run cheap real-world experiments (a class, volunteering, building one small thing, helping one person), and review what generated aliveness versus what merely passed the time. Watch especially for Dr. K's 'direction of service': meaning reliably lives where your energy meets someone else's need — the Harvard study (Waldinger, Big Think) says the same from the data, that a life feels meaningful largely through contribution and connection, not through solo achievement. Almost always, purpose turns out to be about being useful to something beyond your own comfort.",
      actions: [
        "List three things you're mildly curious about. Book the cheapest possible real-world contact with each this month.",
        "Weekly two-column review: 'made me feel alive' / 'just passed time.' Follow column one.",
        "Help one specific person with something you're halfway decent at. Notice how it lands in your body.",
      ],
    },
    options: [
      { label: "Related — I chase pleasure and it's not filling the hole", next: "pur_pleasure" },
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  pur_arrival: {
    coach: [
      "The arrival fallacy — and the fact that you're feeling it puts you in famous company; it hits high-achievers hardest.",
      "The formula 'I'll be happy WHEN ___' fails because of the same hedonic adaptation that eats the Ferrari: you adapt to an achieved goal within weeks, and the goalpost quietly relocates while you're still catching your breath.",
      "But here's the part that reorganises everything: the enjoyable part was never the summit. It was the CLIMB.",
    ],
    options: [
      { label: "So the satisfaction was in the process, not the prize?", next: "pur_arrival2" },
      { label: "Then what's the point of having goals at all?", next: "pur_arrival2" },
    ],
  },

  pur_arrival2: {
    coach: [
      "Goals still matter — but as direction-setters, not happiness-dispensers. That's the reframe. The summit was always going to be five minutes of view and then weather; progress, growth and problems-worth-having are what your reward system actually pays out for, day to day.",
      "So the fix isn't a BIGGER goal — that's the same trap with more zeros. It's realigning from destination-addiction to process-alignment.",
    ],
    insight: {
      title: "Stop buying summits; invest in climbs",
      technique: "Hedonic adaptation · Process orientation · Values (ACT)",
      source: "Big Think (Tal Ben-Shahar's 'arrival fallacy'; Dan Gilbert) · Ali Abdaal · HealthyGamerGG",
      body: "Convert from destination to process: choose pursuits where you'd endorse the daily VERB even if the noun never arrived. Love training, not 'being fit'; love building, not 'having built'. Goals become the compass heading, not the reward. Then pour your surplus into the assets that resist adaptation — relationships deepened, mastery pursued, contribution made — because those compound in memory and meaning instead of evaporating the way a purchase or a title does. And add a small ritual after any win: celebrate it properly for a week, THEN consciously choose the next climb, so the post-achievement void doesn't get to choose it for you by default.",
      actions: [
        "Audit your current goals: for each, would you enjoy the daily process if the outcome took twice as long? If no, redesign it.",
        "Frame the next goals as verbs you love, not trophies you'll adapt to.",
        "Post-win ritual: celebrate for a week, then deliberately pick the next climb.",
      ],
    },
    options: [
      { label: "Back to the wheel", next: "wheel" },
    ],
  },

  pur_pleasure: {
    coach: [
      "Dr. K draws the distinction that names your exact situation: pleasure and fulfilment run on different circuits.",
      "Pleasure is consumption — it spikes, adapts, and demands escalation (the dopamine treadmill). Fulfilment comes from meaning, contribution and growth — slower, quieter, but it ACCUMULATES instead of resetting.",
      "A life optimised purely for pleasure isn't evil. It's just structurally empty — like eating only dessert and being confused about the hunger.",
    ],
    options: [
      { label: "So I've been asking pleasure to do meaning's job.", next: "pur_pleasure2" },
      { label: "But meaningful stuff feels like effort, and pleasure is easy.", next: "pur_pleasure2" },
    ],
  },

  pur_pleasure2: {
    coach: [
      "Exactly — and that effort gap is the whole trap, so let me name it directly. Meaning-activities have a STARTUP cost that pleasure never has. The scroll is frictionless; the instrument, the workout, the real conversation all ask something of you upfront.",
      "So expect the rebalance to feel WORSE for a bit. That initial resistance isn't a sign you're doing it wrong — it's the price signal of things that actually end up mattering. Pleasure charges nothing at the door and delivers nothing lasting; meaning charges at the door and pays out for years.",
    ],
    insight: {
      title: "Pleasure spikes; meaning compounds",
      technique: "Dopamine hygiene · Eudaimonia vs. hedonia · Contribution",
      source: "HealthyGamerGG (Dr. K) · Big Think (positive psychology) · Robert Waldinger",
      body: "You don't have to renounce pleasure — you have to stop asking it to do meaning's job. Rebalance the portfolio: keep pleasure as SEASONING, and add the three meaning-generators the research keeps surfacing — belonging (being known, not just liked), mastery (getting good at something hard on purpose), and service (mattering to something beyond yourself). The Harvard study (Waldinger) puts belonging at the very centre of a life that feels worth living. Protect these blocks fiercely, because meaning loses every single impulse-battle to pleasure in the moment and wins every retrospective — nobody at 80 wishes they'd scrolled more, and plenty wish they'd built and connected more.",
      actions: [
        "Portfolio audit: list a normal week's activities as 'spike' or 'compound'. Just see the ratio, honestly.",
        "Add ONE compounding block this week — skill practice, a real conversation, concretely helping someone.",
        "Guard it from the spikes. Meaning needs protecting precisely because it never wins the in-the-moment fight.",
      ],
    },
    options: [
      { label: "The dopamine/scrolling side of this", next: "hab_dopamine" },
      { label: "I still don't know my direction though", next: "pur_lost" },
    ],
  },

};

/* Escape hatch present everywhere ---------------------------------------- */
const GLOBAL_OPTIONS = { wheelLabel: "🎡 Back to the wheel" };
