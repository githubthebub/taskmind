/* =========================================================================
   Blisswheel — content library
   Five coaching "lenses" inspired by public thinkers & traditions.
   These are original paraphrases/interpretations for educational use —
   not affiliated with or endorsed by the people who inspired them.
   ========================================================================= */

const LENSES = [
  {
    id: "healer",
    name: "The Healer",
    inspiration: "inspired by Dr. K / HealthyGamerGG",
    icon: "🧘",
    color: "#7c6ff0",
    philosophy:
      "Your mind is the instrument through which you experience everything. Most suffering comes from unprocessed emotion and a mind you've never learned to operate. Meditation, breathwork, and honest introspection aren't luxuries — they're maintenance. Understand the samskara (the emotional imprint driving the behavior) before you try to change the behavior.",
    questions: [
      "What emotion are you avoiding right now, and where did you learn to avoid it?",
      "If you sat with this feeling for five minutes without fixing it, what would it tell you?",
      "Is this goal actually yours, or is it borrowed from someone you're trying to impress?",
    ],
    advice: {
      procrastination:
        "Procrastination is usually emotional avoidance, not laziness. The task triggers shame, fear of failure, or overwhelm — and your brain protects you by escaping. Don't force discipline; sit for two minutes, name the feeling the task brings up, and let it exist. Once the emotion is processed, the resistance drops on its own.",
      anxiety:
        "Anxiety lives in the future your mind keeps simulating. Come back to the body: slow the breath, lengthen the exhale, feel your feet. Then journal the specific fear — vague dread is fuel for anxiety; a named fear is just a problem.",
      relationships:
        "You can't have a healthy relationship with someone else while at war with yourself. Notice what the other person activates in you — irritation, neediness, shutdown — that activation is your material to work with, not their crime.",
      health:
        "The body follows the mind. Cravings, doom-scrolling, and skipped workouts are symptoms of dysregulation. Regulate first (breathwork, sleep, meditation), and healthy choices stop being a fight.",
      money:
        "Look at the emotional relationship behind the numbers: is money safety, status, or self-worth for you? Compulsive spending and financial avoidance are both emotional strategies. Heal the strategy, then budget.",
      purpose:
        "Purpose (dharma) isn't found by thinking harder — it's uncovered by removing what's not you: the borrowed ambitions, the coping mechanisms, the numbing. Follow what generates energy instead of what drains it, even in small doses.",
      confidence:
        "Confidence isn't believing you'll win; it's being okay with whatever happens. It grows from evidence of surviving discomfort. Stop feeding the inner critic with comparison, and start collecting small proofs of capability.",
    },
    journalPrompts: [
      "What did I feel today that I didn't let myself fully feel?",
      "When did my mind wander today, and what was it running from?",
      "What activity gave me energy today? What drained me?",
      "Which of my current goals would survive if nobody ever knew I achieved it?",
    ],
    dailyPrinciples: [
      "Feelings that are felt fully tend to pass; feelings that are suppressed run your life from the shadows.",
      "You cannot think your way out of a problem you behaved your way into — but you can breathe your way into a mind that behaves differently.",
      "Discipline is downstream of a regulated nervous system.",
    ],
  },
  {
    id: "architect",
    name: "The Architect",
    inspiration: "inspired by Jordan Peterson",
    icon: "🏛️",
    color: "#e0a94e",
    philosophy:
      "Meaning is found in voluntarily carrying a worthwhile load. Set your own house in perfect order before you criticize the world. Compare yourself to who you were yesterday, not to who someone else is today. Personality is not fixed: you can consciously grow conscientiousness, courage, and assertiveness through deliberate, incremental practice — aim at the highest good you can conceive and take the next small step toward it.",
    questions: [
      "What is one thing you know you should do, that you could do, that you would actually do?",
      "If you treated yourself like someone you were responsible for helping, what would you do differently today?",
      "What tiny piece of chaos in your immediate environment could you put in order right now?",
    ],
    advice: {
      procrastination:
        "Break the task down until the first piece is so small it's almost embarrassing to refuse — then negotiate with yourself like you would with a reluctant employee: honest work, then a real reward. Aim low enough to start, and let momentum raise the bar.",
      anxiety:
        "Much anxiety is faced-away-from responsibility. Write the fear down, then voluntarily confront a small version of it. The dragon you approach voluntarily is far smaller than the one that stalks you while you hide.",
      relationships:
        "Tell the truth — or at least don't lie. Resentment means either you're being taken advantage of or you need to speak up. Negotiate explicitly: unspoken expectations are premeditated resentments.",
      health:
        "Get up at the same time every day, eat a real breakfast, and fix your sleep before you philosophize about motivation. Routine isn't a cage; it's the platform every higher goal stands on.",
      money:
        "Treat your finances like a room to clean: face the numbers you've been avoiding, itemize the chaos, and order it piece by piece. Delayed gratification is the discovery that the future is real.",
      purpose:
        "Pick the best goal you can currently conceive and pursue it — you'll refine the aim as you move. An imperfect aim beats aimlessness, because you can only steer a ship that's moving.",
      confidence:
        "Stand up straight, speak what you believe carefully and clearly, and let the consequences teach you. Competence, honestly earned, is the only durable foundation of confidence.",
    },
    journalPrompts: [
      "What did I do today that made things slightly better? Slightly worse?",
      "Where in my life am I saying yes when I mean no?",
      "What would my life look like in five years if I fixed the things I know are broken? If I didn't?",
      "What responsibility am I avoiding that would give my life more weight and meaning if I picked it up?",
    ],
    dailyPrinciples: [
      "Compare yourself to who you were yesterday, not to who someone else is today.",
      "Treat yourself like someone you are responsible for helping.",
      "Do the next right thing in front of you, and the path assembles itself.",
    ],
  },
  {
    id: "rationalist",
    name: "The Rationalist",
    inspiration: "inspired by Destiny",
    icon: "🎯",
    color: "#4e9de0",
    philosophy:
      "Feelings are data, not commands. Waiting for motivation is a category error — systems, schedules, and honest accounting get things done while motivation sleeps in. Steelman your excuses, then debate them: most collapse under thirty seconds of scrutiny. Consistency over intensity, evidence over vibes, and radical honesty about what you actually do versus what you say you value.",
    questions: [
      "What would you say to a friend who gave you the excuse you just gave yourself?",
      "What does your actual behavior — not your stated values — say you care about?",
      "If you had to bet money on whether you'll do this tomorrow, which way would you bet? Why?",
    ],
    advice: {
      procrastination:
        "Stop moralizing it and start engineering around it. Remove the friction to start (open the file before bed), add friction to escape (phone in another room), and time-box: 25 focused minutes counts as a win. You don't need to feel like it — you need a system that doesn't care how you feel.",
      anxiety:
        "Interrogate the claim your anxiety is making. What's the actual probability of the feared outcome? What's the actual cost? Most anxious predictions are terrible forecasts — track them for two weeks and watch your brain's accuracy rating collapse.",
      relationships:
        "Communicate like an adult: state the issue plainly, without the passive-aggressive meta-game. Most conflicts are two people arguing about different things while using the same words — define terms before you fight.",
      health:
        "Count things. Calories, steps, sleep hours. You cannot optimize what you don't measure, and self-report without data is fiction. Pick the minimum consistent version — three workouts a week you actually do beats six you imagine.",
      money:
        "Run the numbers you've been avoiding. A budget isn't a moral document, it's a dashboard. Most financial stress is uncertainty, and uncertainty dies when you open the spreadsheet.",
      purpose:
        "'Finding your passion' is mostly survivorship bias. Competence generates passion more often than passion generates competence. Pick something plausible, get good at it, and reassess with real information instead of daydreams.",
      confidence:
        "Confidence is a track record. Make small promises to yourself and keep them, publicly if possible. Every kept promise is evidence; every broken one is evidence too. Build the case.",
    },
    journalPrompts: [
      "What excuse did I use today, and would it survive cross-examination?",
      "What did I predict would go badly recently — and how did it actually go?",
      "Where is there a gap between my stated values and my logged behavior this week?",
      "What is the minimum consistent version of the habit I keep failing at maximally?",
    ],
    dailyPrinciples: [
      "Motivation is a bonus, not a prerequisite. The schedule is the boss.",
      "Your calendar and bank statement are the most honest autobiography you'll ever write.",
      "Debate your excuses like they came from someone you disagree with.",
    ],
  },
  {
    id: "neuropsychologist",
    name: "The Neuropsychologist",
    inspiration: "inspired by Dr. Judy Ho",
    icon: "🧠",
    color: "#e06a9a",
    philosophy:
      "Self-sabotage is not a character flaw — it's your brain doing its job badly. We're wired to seek reward and avoid threat, and when a goal triggers threat (fear of failure, fear of success, low self-worth, need for control), avoidance wins. Identify your L.I.F.E. triggers, catch the moment of choice, and use values-based commitment to route around the sabotage. Your attachment history writes your defaults; it doesn't have to write your future.",
    questions: [
      "Which trigger is active here: Low self-concept, Internalized beliefs, Fear of failure/success, or Excessive need for control?",
      "What is the split-second moment where you usually abandon this goal — and what happens right before it?",
      "Which of your core values does this goal serve? Would the sabotage still win if you kept that value in view?",
    ],
    advice: {
      procrastination:
        "Find the trigger under the delay. Fear of failure says 'if I never finish, I can never fail.' Counter it by defining success as process, not outcome: 'I succeed today if I work 30 minutes,' which your fear can't threaten. Then reward completion immediately — the brain repeats what gets reinforced.",
      anxiety:
        "Label the thought pattern: catastrophizing, mind-reading, fortune-telling. Then run the CBT triple-column: the automatic thought, the distortion, the fairer statement. Cognitive labels shrink limbic alarms.",
      relationships:
        "Know your attachment style, because it's running the show under stress. Anxious protest behavior and avoidant stonewalling are both self-sabotage in relational costume. Name your pattern out loud to your partner — patterns lose power when they're on the table.",
      health:
        "Habit change fails at the identity level, not the willpower level. 'I'm someone who takes care of my body' beats 'I have to work out.' Pair the new behavior with an existing routine, keep it stupidly small, and track streaks visually.",
      money:
        "Financial self-sabotage often protects an old belief: 'people like me don't get to have security.' Surface the belief, write its origin story, then write the counter-evidence. Automate the good decision so the belief never gets a vote.",
      purpose:
        "Values first, goals second. Goals you can fail; values you can only live or not live today. List your top five values, and check each major goal against them — goals misaligned with values are self-sabotage generators.",
      confidence:
        "Collect disconfirming evidence deliberately. Keep a daily log of moments that contradict your negative self-story. The brain's negativity bias won't do this for you — you have to run the counter-campaign on purpose.",
    },
    journalPrompts: [
      "What did I want to do today, and what did I do instead? What happened in the moment between?",
      "Which old belief about myself got airtime today? Where did I first learn it?",
      "What's one piece of evidence from today that contradicts my harshest self-judgment?",
      "Which of my top five values did I actually live today, and how?",
    ],
    dailyPrinciples: [
      "You can't out-discipline a trigger you haven't identified.",
      "Self-sabotage is a solvable pattern, not a personality.",
      "Values can be lived today; keep them where you can see them.",
    ],
  },
  {
    id: "somatic",
    name: "The Somatic Guide",
    inspiration: "inspired by psychosomatic & mind-body practice",
    icon: "🌿",
    color: "#5cc98f",
    philosophy:
      "The body keeps the score and speaks first. Chronic tension, shallow breath, gut knots, and fatigue are messages, not malfunctions. Stress that isn't discharged gets stored — as posture, pain, and illness. Bliss is not a thought; it's a nervous system state you can cultivate: long exhales, soft eyes, unclenched jaw, felt gratitude. Listen to the body daily and it stops needing to shout. (For persistent symptoms, always see a physician — mind-body work complements medicine, never replaces it.)",
    questions: [
      "Scan right now: jaw, shoulders, belly, hands. Where are you bracing, and against what?",
      "What is your breath doing at this moment — and what does that say about the story you're telling yourself?",
      "When did this body sensation start, and what was happening in your life at the time?",
    ],
    advice: {
      procrastination:
        "Check the body before blaming the mind: under-slept, under-fed, and over-caffeinated nervous systems produce 'laziness' on schedule. Do a 90-second reset — stand, shake out the limbs, three physiological sighs — then approach the task from a discharged state.",
      anxiety:
        "Anxiety is a body state before it's a thought. Extend your exhale to twice your inhale for two minutes; the vagus nerve doesn't argue, it just calms. Then unclench the jaw and drop the shoulders — the brain reads the body's report and lowers the alarm.",
      relationships:
        "Your body knows how a relationship feels before your mind admits it. Notice who you brace around and who you breathe easily around. Co-regulation is real: calm bodies calm each other — bring a settled nervous system to hard conversations.",
      health:
        "Treat symptoms as correspondence. Tension headaches, tight hips, gut trouble under deadline — map them against your calendar and your suppressed emotions. Move daily not to burn calories but to complete the stress cycles your life keeps starting.",
      money:
        "Money stress lives in the body as chronic low-grade bracing. Before financial decisions, settle the body first — decisions made in fight-or-flight optimize for escape, not for your life.",
      purpose:
        "The body votes on your direction with energy. Expansion, warmth, and steady breath around an activity are data. Contraction, exhaustion, and shallow breath are data too. Follow the expansion.",
      confidence:
        "Posture is bidirectional: the body shapes the mind that shapes the body. Practice taking up your full space, breathing low and slow, and grounding through the feet before hard moments. Embodied calm reads as confidence because it is.",
    },
    journalPrompts: [
      "Where did I feel tension today, and what was happening when it appeared?",
      "What did my energy do today — when did it rise, when did it crash?",
      "What is one sensation of pleasure or ease I actually paused to feel today?",
      "If my most persistent body symptom could speak, what would it be asking for?",
    ],
    dailyPrinciples: [
      "The exhale is the fastest lever on the nervous system you own.",
      "Unfelt stress doesn't disappear — it relocates into the body.",
      "Bliss is a practiced state, not a lucky mood.",
    ],
  },
];

/* --------------------------- Wheel of Life ---------------------------- */

const WHEEL_AREAS = [
  { id: "career",    name: "Career & Purpose",   icon: "💼", color: "#4e9de0" },
  { id: "money",     name: "Money & Finances",   icon: "💰", color: "#e0a94e" },
  { id: "health",    name: "Health & Body",      icon: "💪", color: "#5cc98f" },
  { id: "love",      name: "Love & Romance",     icon: "❤️", color: "#e06a9a" },
  { id: "social",    name: "Friends & Family",   icon: "👥", color: "#c98f5c" },
  { id: "growth",    name: "Growth & Learning",  icon: "📚", color: "#7c6ff0" },
  { id: "play",      name: "Play & Fun",         icon: "🎉", color: "#e0d24e" },
  { id: "order",     name: "Environment & Order",icon: "🏡", color: "#5cb8c9" },
];

// Which lens categories map naturally to each wheel area (for council & tips)
const AREA_TO_CATEGORY = {
  career: "purpose",
  money: "money",
  health: "health",
  love: "relationships",
  social: "relationships",
  growth: "confidence",
  play: "anxiety",
  order: "procrastination",
};

const COUNCIL_CATEGORIES = [
  { id: "procrastination", name: "Procrastination & discipline" },
  { id: "anxiety",         name: "Anxiety & overthinking" },
  { id: "relationships",   name: "Relationships & connection" },
  { id: "health",          name: "Health, energy & habits" },
  { id: "money",           name: "Money & finances" },
  { id: "purpose",         name: "Purpose & career" },
  { id: "confidence",      name: "Confidence & self-worth" },
];

/* ----------------------- Personality Studio ---------------------------
   Big Five–based trait targets. Each trait: what it is, why each lens
   cares, and micro-actions that train it. Selecting a trait feeds the
   daily practice checklist.
------------------------------------------------------------------------ */

const TRAITS = [
  {
    id: "industriousness",
    name: "Industriousness",
    domain: "Conscientiousness",
    icon: "⚒️",
    tagline: "Doing hard things on schedule, regardless of mood.",
    helps: ["career", "money", "growth", "order"],
    why: "The single strongest personality predictor of long-term achievement. The Architect calls it carrying your load; The Rationalist calls it systems beating motivation.",
    actions: [
      "Do your #1 task for 25 undistracted minutes before any entertainment",
      "Write tomorrow's top 3 tasks the night before",
      "Finish one thing you started and abandoned",
    ],
  },
  {
    id: "orderliness",
    name: "Orderliness",
    domain: "Conscientiousness",
    icon: "🧹",
    tagline: "An ordered environment and schedule that carries you.",
    helps: ["order", "money", "health"],
    why: "Chaos taxes every decision. Set your house in order — the room you clean is the mind you clear.",
    actions: [
      "Reset one surface or space to perfect order (10 min)",
      "Process your inbox / pile-of-doom for 10 minutes",
      "Lay out tomorrow (clothes, gear, plan) before bed",
    ],
  },
  {
    id: "stability",
    name: "Emotional Stability",
    domain: "Low Neuroticism",
    icon: "⚓",
    tagline: "A nervous system that recovers fast and doesn't catastrophize.",
    helps: ["health", "love", "play"],
    why: "The Healer and the Somatic Guide agree: regulation precedes everything. Train the body's alarm system daily and life's volume knob turns down.",
    actions: [
      "10 minutes of meditation or breathwork",
      "Two-minute physiological-sigh reset when stressed",
      "Name (in writing) one emotion you felt today instead of judging it",
    ],
  },
  {
    id: "assertiveness",
    name: "Assertiveness",
    domain: "Extraversion",
    icon: "🗣️",
    tagline: "Saying what you want, asking for what you're worth.",
    helps: ["career", "love", "social", "money"],
    why: "Unspoken needs become resentments. The Architect says negotiate explicitly; The Rationalist says state the issue plainly, without the meta-game.",
    actions: [
      "Make one direct request you'd normally swallow",
      "State one honest opinion in a conversation today",
      "Say no (kindly, plainly) to one thing that isn't yours to carry",
    ],
  },
  {
    id: "sociability",
    name: "Warm Sociability",
    domain: "Extraversion",
    icon: "🤝",
    tagline: "Initiating connection instead of waiting for it.",
    helps: ["social", "love", "play"],
    why: "Connection is the most replicated predictor of well-being. Co-regulation is real — calm, warm contact is nervous-system medicine.",
    actions: [
      "Send one genuine message to someone you've been meaning to contact",
      "Ask one person a real question and listen without planning your reply",
      "Schedule (actually schedule) one social thing this week",
    ],
  },
  {
    id: "openness",
    name: "Openness & Curiosity",
    domain: "Openness",
    icon: "🔭",
    tagline: "Learning, exploring, and staying interested in the world.",
    helps: ["growth", "play", "career"],
    why: "Curiosity is how purpose is discovered — follow what generates energy. Competence in new domains compounds into opportunity.",
    actions: [
      "Read or watch 15 minutes of something that stretches you",
      "Write down one question you genuinely want answered",
      "Do one familiar thing a new way today",
    ],
  },
  {
    id: "compassion",
    name: "Grounded Compassion",
    domain: "Agreeableness",
    icon: "💗",
    tagline: "Kindness with a spine — toward others and yourself.",
    helps: ["love", "social", "health"],
    why: "The Neuropsychologist's counter-campaign: self-criticism is not a performance enhancer. Compassion with boundaries beats niceness without them.",
    actions: [
      "Do one small unrequested kindness",
      "Write one sentence of evidence against your harshest self-judgment",
      "Catch one inner-critic attack and restate it as you would to a friend",
    ],
  },
  {
    id: "courage",
    name: "Voluntary Courage",
    domain: "Low Neuroticism / High Assertiveness",
    icon: "🐉",
    tagline: "Approaching the feared thing on purpose, in small doses.",
    helps: ["career", "growth", "love", "money"],
    why: "The dragon you approach voluntarily is smaller than the one that stalks you. Exposure, chosen freely, is how fear is retrained.",
    actions: [
      "Do one thing today that scares you a 3/10 or more",
      "Have (or schedule) the conversation you've been avoiding",
      "Ship something imperfect instead of polishing it another day",
    ],
  },
];

/* ------------------------------ Practices ------------------------------ */

const BREATH_PATTERNS = [
  {
    id: "sigh",
    name: "Physiological Sigh",
    desc: "Double inhale through the nose, long exhale through the mouth. The fastest known real-time stress reset.",
    phases: [
      { label: "Inhale", secs: 2 },
      { label: "Top-up inhale", secs: 1 },
      { label: "Long exhale", secs: 6 },
      { label: "Rest", secs: 2 },
    ],
    rounds: 6,
  },
  {
    id: "box",
    name: "Box Breathing",
    desc: "Equal four-count sides. Steadies attention and calms the system. Used by performers under pressure.",
    phases: [
      { label: "Inhale", secs: 4 },
      { label: "Hold", secs: 4 },
      { label: "Exhale", secs: 4 },
      { label: "Hold", secs: 4 },
    ],
    rounds: 8,
  },
  {
    id: "478",
    name: "4-7-8 Breathing",
    desc: "Long hold, longer exhale. Strongly parasympathetic — great before sleep or after stress.",
    phases: [
      { label: "Inhale", secs: 4 },
      { label: "Hold", secs: 7 },
      { label: "Exhale", secs: 8 },
    ],
    rounds: 6,
  },
  {
    id: "coherent",
    name: "Coherent Breathing",
    desc: "Five-and-a-half seconds in, five-and-a-half out. Balances heart-rate variability; the daily-driver of breath practices.",
    phases: [
      { label: "Inhale", secs: 5.5 },
      { label: "Exhale", secs: 5.5 },
    ],
    rounds: 12,
  },
];

const BODY_SCAN_STEPS = [
  { label: "Settle", text: "Sit or lie down. Let the breath be natural. Three slow exhales to arrive.", secs: 30 },
  { label: "Head & face", text: "Notice the scalp, forehead, eyes. Unclench the jaw. Let the tongue rest.", secs: 40 },
  { label: "Neck & shoulders", text: "Feel where the shoulders sit. Invite them down. Breathe into the base of the neck.", secs: 40 },
  { label: "Arms & hands", text: "Attention down each arm. Open the hands. Notice warmth, tingling, contact.", secs: 40 },
  { label: "Chest & breath", text: "Feel the ribs move. No fixing — just watch the breath breathe itself.", secs: 45 },
  { label: "Belly & gut", text: "Soften the belly. This is where stress hides. Let it be round and unguarded.", secs: 45 },
  { label: "Hips & legs", text: "Notice the seat, the thighs, the knees. Let the legs be heavy.", secs: 40 },
  { label: "Feet & ground", text: "Feel the soles of the feet. The ground holds you. Nothing to do.", secs: 40 },
  { label: "Whole body", text: "Hold the whole body in awareness at once. Rest in the state you've built.", secs: 60 },
];

/* --------------------------- Bliss check-in ---------------------------- */

const TENSION_SPOTS = ["Jaw", "Neck", "Shoulders", "Chest", "Stomach", "Back", "Head", "None"];

const MOOD_LABELS = {
  1: "Rock bottom", 2: "Heavy", 3: "Low", 4: "Meh", 5: "Neutral",
  6: "Okay", 7: "Good", 8: "Great", 9: "Joyful", 10: "Blissful",
};
