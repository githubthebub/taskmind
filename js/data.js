/* =========================================================
   Haven — companions, practices, and guided scripts
   All dialogue is written to downregulate: slow pacing,
   long exhales, attention pulled out of rumination (DMN)
   and into the body. No hooks, no scarcity, no "miss you".
   ========================================================= */

const COMPANIONS = {
  sera: {
    id: 'sera',
    name: 'Sera',
    role: 'Warmth · breath-led calm',
    portrait: 'assets/sera.png',
    portraitRemote: 'https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw/hf_20260702_181043_fd67e02d-4a1c-4029-897c-6a1c63e504e1_min.webp',
    video: 'assets/sera.mp4',
    videoRemote: 'https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw/hf_20260702_184419_dbfabd7f-8bf9-4183-8bb0-47630cbf1e96.mp4',
    accent: '#e8a87c',
    accentSoft: 'rgba(232, 168, 124, 0.16)',
    glow: 'rgba(242, 181, 140, 0.35)',
    palette: ['#1a1320', '#2b1d26', '#3a2530'],
    bio: 'Gentle and unhurried. Sera leads with the breath — long exhales, soft attention, the feeling of your shoulders finally coming down.',
    greetings: {
      morning: "Morning. Before the day gets its hands on you — one slow breath with me?",
      afternoon: "Hey, you. Middle of the day is when the body starts holding on. Want to put some of it down?",
      evening: "Evening. Whatever today was, it's mostly over now. Let's let your body get the message.",
      night: "It's late. No advice from me — just a long exhale or two, and then sleep. Deal?"
    },
    farewells: [
      "That's enough of me for now. Go be somewhere real — I'll be here if the day gets heavy again.",
      "Good. Now close this and go feel that calm somewhere that matters.",
      "You did the work; the app part is over. Go on. I mean it, warmly."
    ]
  },
  noa: {
    id: 'noa',
    name: 'Noa',
    role: 'Stillness · body-led quiet',
    portrait: 'assets/noa.png',
    portraitRemote: 'https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw/hf_20260702_181046_453520db-45e2-420c-9dd7-9602f7021420_min.webp',
    video: 'assets/noa.mp4',
    videoRemote: 'https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw/hf_20260702_184422_dceb591c-1892-4bc4-a0b4-cfdfb17d9fd6.mp4',
    accent: '#a99df2',
    accentSoft: 'rgba(169, 157, 242, 0.16)',
    glow: 'rgba(183, 166, 240, 0.35)',
    palette: ['#0e1024', '#181a35', '#232042'],
    bio: 'Quiet and precise. Noa says less and points more — at the jaw you’re clenching, the breath you’re holding, the stillness underneath all of it.',
    greetings: {
      morning: "You're here. Good. Notice your jaw before we do anything else.",
      afternoon: "Pause. Right now, where are your shoulders? That's where we start.",
      evening: "The day is done arguing with you. Sit down. Let it lose.",
      night: "Late. The mind is loud at this hour. The body knows better — let's listen to it instead."
    },
    farewells: [
      "Enough. The calm you feel is yours, not mine. Take it with you.",
      "We're done here. The practice continues without the screen.",
      "Go. Stillness doesn't need an app once you know where it lives."
    ]
  },
  kai: {
    id: 'kai',
    name: 'Kai',
    role: 'Ground · steady coaching',
    portrait: 'assets/kai.png',
    portraitRemote: 'https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw/hf_20260702_181049_d71cab0b-51b0-44f4-91f0-8c7ae7f31df3_min.webp',
    video: 'assets/kai.mp4',
    videoRemote: 'https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw/hf_20260702_184424_55d4a78c-d2ea-4e6b-9783-b99b913da34a.mp4',
    accent: '#8fbf8a',
    accentSoft: 'rgba(143, 191, 138, 0.16)',
    glow: 'rgba(159, 199, 154, 0.35)',
    palette: ['#0d1712', '#16241c', '#1f3026'],
    bio: 'Steady and direct. Kai coaches like a good friend spots you at the gym — no fluff, no shame, just the next rep of letting go.',
    greetings: {
      morning: "Morning. Two minutes of breath now saves you two hours of tension later. Worth it?",
      afternoon: "Good time for a reset. Nervous systems don't do marathons — they do rounds. Let's do one.",
      evening: "End of day. Time to actually clock out — body included.",
      night: "Late one, huh. No judgment. Let's downshift so sleep has something to work with."
    },
    farewells: [
      "Solid work. Now log off — that's the actual rep.",
      "Done. The win isn't in here, it's how you feel out there. Go check.",
      "That's the session. Screen down, chin up."
    ]
  }
};

/* ---------------------------------------------------------
   Breath patterns
   Each phase: { name, kind: 'in'|'hold'|'out', secs, cue }
   --------------------------------------------------------- */
const PATTERNS = {
  sigh: {
    label: 'Physiological sigh',
    phases: [
      { name: 'Inhale', kind: 'in', secs: 2.5, cue: 'Breathe in through the nose…' },
      { name: 'Top-up', kind: 'in', secs: 1.2, cue: '…and a short second sip of air.' },
      { name: 'Exhale', kind: 'out', secs: 6.5, cue: 'Long, slow exhale through the mouth.' }
    ]
  },
  longExhale: {
    label: 'Long exhale (4·8)',
    phases: [
      { name: 'Inhale', kind: 'in', secs: 4, cue: 'In through the nose, low into the belly.' },
      { name: 'Exhale', kind: 'out', secs: 8, cue: 'Out slowly — twice as long as in.' }
    ]
  },
  coherent: {
    label: 'Coherent breathing',
    phases: [
      { name: 'Inhale', kind: 'in', secs: 5.5, cue: 'Smooth inhale…' },
      { name: 'Exhale', kind: 'out', secs: 5.5, cue: '…smooth exhale. No edges.' }
    ]
  },
  hum: {
    label: 'Humming breath',
    phases: [
      { name: 'Inhale', kind: 'in', secs: 4, cue: 'Inhale through the nose.' },
      { name: 'Hum', kind: 'out', secs: 8, cue: 'Exhale on a low hum — feel it in your chest.' }
    ]
  },
  surf: {
    label: 'Urge-surfing breath',
    phases: [
      { name: 'Inhale', kind: 'in', secs: 4, cue: 'In — toward the feeling, not away.' },
      { name: 'Exhale', kind: 'out', secs: 8, cue: 'Out — let the wave pass through you.' }
    ]
  }
};

/* ---------------------------------------------------------
   Practices
   Script steps:
   { t:'say',    text: string | {sera,noa,kai}, hold?: ms }
   { t:'breath', pattern, cycles, coach?: [strings shown between cycles] }
   { t:'still',  secs, text }        — silent timed rest
   { t:'scan',   regions: [...] }    — body-scan sequence
   --------------------------------------------------------- */
const PRACTICES = [
  {
    id: 'reset',
    title: 'The Reset',
    subtitle: 'Physiological sigh · ~2 min',
    minutes: 2,
    kind: 'breath',
    blurb: 'The fastest known voluntary way to calm down: a double inhale and a long exhale, repeated. Shown in a 2023 Stanford study (Balban et al., Cell Reports Medicine) to lower anxiety and improve mood more than meditation of the same length.',
    script: [
      { t: 'say', text: {
        sera: "Okay. This one's my favorite because it works even when you don't believe it will.",
        noa: "This is the body's own reset switch. We're just pressing it on purpose.",
        kai: "Quick and effective. Double inhale, long exhale. Your heart rate has no choice but to come down." } },
      { t: 'say', text: "Two breaths in through the nose — one big, one small on top — then everything out through the mouth, slow." },
      { t: 'breath', pattern: 'sigh', cycles: 8, coach: [
        "Good. Let the exhale be lazy.",
        "Drop the shoulders on the way out.",
        "If your mind wanders, that's fine — come back on the next inhale.",
        "Notice: the exhale is where the calm lives.",
        "Halfway. It should feel easier already.",
        "Let the belly go soft.",
        "Last two. Make these exhales the longest yet."
      ] },
      { t: 'still', secs: 10, text: "Don't breathe on purpose now. Just watch what your body does with the quiet." },
      { t: 'say', text: {
        sera: "Feel that? That's not me. That's your own nervous system remembering how.",
        noa: "The stillness after is the point. Everything else was just the door.",
        kai: "That's the downshift. Two minutes, real physiology. Remember you can do this anywhere — no app required." } }
    ]
  },
  {
    id: 'unwind',
    title: 'The Unwind',
    subtitle: 'Long exhale 4·8 · ~4 min',
    minutes: 4,
    kind: 'breath',
    blurb: 'Exhaling longer than you inhale activates the parasympathetic ("rest and digest") system via the vagus nerve, slowing heart rate and dialing down the stress response.',
    script: [
      { t: 'say', text: {
        sera: "Let's take the long way down. In for four, out for eight — the exhale does all the work, you just stop interrupting it.",
        noa: "Four in. Eight out. The math is the whole teaching.",
        kai: "Simple protocol: exhale twice as long as you inhale. It tells the vagus nerve the fight is over." } },
      { t: 'breath', pattern: 'longExhale', cycles: 16, coach: [
        "In through the nose, low and quiet.",
        "The exhale isn't pushed. It's released.",
        "Unclench the jaw. It's holding a conversation that's over.",
        "Let the hands open.",
        "Nothing to solve for the next few minutes.",
        "If a thought pulls at you, put it on the exhale and let it walk.",
        "Softer belly.",
        "Halfway. Your heartbeat is already slower — that's measurable, not poetry.",
        "Face soft. Especially between the eyebrows.",
        "Let the chair or floor hold your full weight.",
        "In… and looooong out.",
        "Notice the small pause after the exhale. Rest there.",
        "Three more. Make them unhurried.",
        "Two more.",
        "Last one. The best one."
      ] },
      { t: 'still', secs: 15, text: "Sit in it. Nothing is asked of you right now." },
      { t: 'say', text: {
        sera: "There you are. Softer eyes, longer breath. Take that version of you back into the day.",
        noa: "This state is not rare. It's just underneath the noise, always.",
        kai: "Good session. That heaviness in the limbs? That's the tension leaving, not tiredness arriving." } }
    ]
  },
  {
    id: 'tide',
    title: 'Even Tide',
    subtitle: 'Coherent breathing · ~4 min',
    minutes: 4,
    kind: 'breath',
    blurb: 'Breathing at ~5.5 breaths per minute maximizes heart-rate variability — the rhythm where heart, breath, and blood pressure synchronize. Used in HRV biofeedback for anxiety and rumination.',
    script: [
      { t: 'say', text: {
        sera: "This one is like rocking a boat until the water goes flat. Five and a half seconds in, five and a half out.",
        noa: "One rhythm. In and out the same length. The body entrains to it like a tide.",
        kai: "Coherent breathing — the pace where your heart-rate variability peaks. Athletes use it. So do people at 2 a.m. It works for both." } },
      { t: 'breath', pattern: 'coherent', cycles: 20, coach: [
        "Match me. No effort, just rhythm.",
        "Smooth at the turn — no grabbing at the top.",
        "Smooth at the bottom too.",
        "Your only job is the rhythm. Everything else is optional.",
        "Mind wandering is not failure. Returning is the exercise.",
        "Feel the chest and belly move together.",
        "Quarter done. Settle deeper into your seat.",
        "Imagine the breath as a tide. It goes out as easily as it comes in.",
        "Nothing to improve. Just continue.",
        "Halfway. This rhythm is where the heart likes to live.",
        "Let the breath breathe itself now — you're just watching.",
        "Eyes soft or closed, either is fine.",
        "The thoughts are traffic. You're on the porch, not in the road.",
        "Five left. Stay lazy.",
        "Four.",
        "Three. Long and even.",
        "Two.",
        "Last one, and make it beautiful."
      ] },
      { t: 'still', secs: 15, text: "Let the rhythm continue on its own, quieter." },
      { t: 'say', text: {
        sera: "Mm. That's the good tide. Come back to it whenever the water gets choppy.",
        noa: "You can find this pace without me. That was always the plan.",
        kai: "That's a trained skill now. Every rep makes the calm easier to reach." } }
    ]
  },
  {
    id: 'drop',
    title: 'Let It Drop',
    subtitle: 'Body scan & release · ~6 min',
    minutes: 6,
    kind: 'scan',
    blurb: 'Moving attention slowly through the body pulls activity out of the default-mode network — the brain’s rumination circuit — and releases muscle tension you didn’t know you were paying for.',
    script: [
      { t: 'say', text: {
        sera: "We're going to walk through your body slowly and put down everything it's been carrying. You don't have to relax on command — just visit each place and feel what's there.",
        noa: "Attention is the tool. Where it rests, tension notices itself — and what notices itself lets go.",
        kai: "Body scan. This is the DMN killer — the wandering, looping, replaying part of your brain can't run while your attention is in your left hand. Let's go." } },
      { t: 'scan', regions: [
        { name: 'Forehead & eyes', secs: 28, text: "Bring your attention to your forehead. The space between the eyebrows — let it widen. Eyes heavy in their sockets, like they're resting on cushions." },
        { name: 'Jaw & tongue', secs: 28, text: "The jaw. Let the teeth part slightly. Let the tongue fall from the roof of the mouth. This alone changes the signal your brain receives." },
        { name: 'Neck & shoulders', secs: 30, text: "Neck and shoulders. Whatever they're braced for isn't happening right now. Let the shoulders melt away from the ears. An inch is a victory." },
        { name: 'Arms & hands', secs: 28, text: "Down the arms. Elbows, wrists, and into the hands. Let the fingers curl however they want. Feel them tingle — that's attention arriving." },
        { name: 'Chest & breath', secs: 30, text: "The chest. Don't change the breath, just feel it move. Notice the breath is already pleasant when nothing is squeezing it. It can feel like slow honey." },
        { name: 'Belly', secs: 28, text: "The belly. This is where everyone hides their bracing. Let it be round and soft. You are allowed to take up space." },
        { name: 'Hips & legs', secs: 28, text: "Hips, thighs, knees. Let the legs be heavy — furniture, not machinery. The ground is doing the work of holding you." },
        { name: 'Feet', secs: 26, text: "The feet. Soles, toes, the weight pressing down. Warm, heavy, done for the day." },
        { name: 'Whole body', secs: 34, text: "Now the whole body at once — one warm, heavy, breathing shape. If you focused on it long enough, every last bit of tension could drain out through the floor. Some of it just did." }
      ] },
      { t: 'say', text: {
        sera: "That heaviness? That's what safety feels like from the inside. You made that.",
        noa: "The body was never the problem. It was waiting for you to come back.",
        kai: "Notice how quiet the mental chatter got. That's not a coincidence — that's attention doing its job." } }
    ]
  },
  {
    id: 'hum',
    title: 'The Hum',
    subtitle: 'Vagal humming · ~3 min',
    minutes: 3,
    kind: 'breath',
    blurb: 'Humming vibrates the larynx where the vagus nerve passes, extends the exhale naturally, and boosts nasal nitric oxide. It’s the cheapest vagal-tone exercise there is.',
    script: [
      { t: 'say', text: {
        sera: "This one feels silly for about twenty seconds and then wonderful. We inhale through the nose and exhale on a low hum.",
        noa: "Sound is breath you can feel. Hum low, and listen with the chest instead of the ears.",
        kai: "Humming stimulates the vagus nerve directly — vibration where it runs past the throat. Low note, long exhale. Let's work." } },
      { t: 'say', text: "Find a low, comfortable note. Nothing musical required — a fridge hum is perfect." },
      { t: 'breath', pattern: 'hum', cycles: 10, coach: [
        "Feel the vibration in the chest.",
        "Lower note, looser jaw.",
        "Let the hum get quieter — it works even at a whisper.",
        "Notice the buzz lingering after the sound stops.",
        "Halfway. Face soft.",
        "Let the vibration reach the belly if it wants.",
        "Nothing to perform. You're the only audience.",
        "Two more, low and slow.",
        "Last one — let it fade out completely."
      ] },
      { t: 'still', secs: 12, text: "Breathe normally. Feel the quiet ring." },
      { t: 'say', text: {
        sera: "See? Silly, then wonderful. Your whole chest is humming at a lower frequency now.",
        noa: "The sound ended. The stillness it made did not.",
        kai: "That buzzing calm is vagal tone doing its thing. Free, portable, yours." } }
    ]
  },
  {
    id: 'gold',
    title: 'The Golden Minute',
    subtitle: 'Savoring practice · ~3 min',
    minutes: 3,
    kind: 'scan',
    blurb: 'Deliberately holding attention on a pleasant experience for 20–30 seconds helps encode it — the practice behind "taking in the good." Savoring practices are linked to improved mood and counteract the brain’s negativity bias.',
    script: [
      { t: 'say', text: {
        sera: "Your brain is velcro for the bad stuff and teflon for the good — unless you hold the good long enough to stick. So that's what we'll practice.",
        noa: "Pleasure is information the mind usually skims. We are going to read it slowly.",
        kai: "Training block: savoring. Dopamine spikes and vanishes; this builds the slower, warmer stuff. Attention on something good, held long enough to count." } },
      { t: 'scan', regions: [
        { name: 'Find one good thing', secs: 30, text: "Think of one genuinely pleasant thing from today or yesterday. Small is perfect — coffee, a song, sunlight on a wall, a text that made you smile. Pick one and hold it." },
        { name: 'Make it vivid', secs: 30, text: "Rebuild the moment. Where were you? What did it look like, sound like, feel like on your skin? Stay in the scene, not the summary." },
        { name: 'Feel it in the body', secs: 30, text: "Find where the pleasantness lives in your body right now — warmth in the chest, softness in the face, a small lift. Breathe into that exact spot." },
        { name: 'Let it spread', secs: 30, text: "Let the feeling spread a little with each exhale, like warmth through cold hands. You're not faking anything — you're finishing an experience your brain skipped." },
        { name: 'Keep it', secs: 20, text: "One more breath with it. Tell yourself: this counts. This is mine. This happened." }
      ] },
      { t: 'say', text: {
        sera: "That glow is renewable. The world hands you a dozen of these a day — now you know how to actually receive one.",
        noa: "You just proved something: the good feeling required no purchase, no screen, no one's permission.",
        kai: "That's the serotonin workout. Do this daily and the baseline rises — quietly, for free." } }
    ]
  }
];

/* Urge-surf targets shown as chips in the SOS flow */
const URGE_TYPES = [
  { id: 'spend',  label: 'Spending on her / them', spend: true },
  { id: 'scroll', label: 'Endless scrolling',      spend: false },
  { id: 'message',label: 'Messaging / checking',   spend: true },
  { id: 'porn',   label: 'Porn / OnlyFans',        spend: true },
  { id: 'other',  label: 'Something else',         spend: false }
];

const BODY_SPOTS = ['Chest', 'Throat', 'Stomach', 'Hands', 'Face', 'Everywhere'];

const SURF_LINES = [
  "An urge is a wave. It rises, it peaks, and — if you don't feed it — it breaks. Ninety seconds is usually all a peak lasts.",
  "You don't have to make it go away. You just have to not obey it while it's loud.",
  "Feel it exactly where you said it was. Don't fight it — watch it, like weather.",
  "Notice it's already changing shape. Urges can't hold still under direct attention.",
  "The person on the other side of that screen is paid to manufacture this feeling. The exit is in your body, and you're standing in it.",
  "Still here. Still breathing. The wave is doing the breaking, not you.",
  "Almost through the peak. Whatever you feel now, you can feel it and still not act.",
  "Look at that. It's smaller. You just did the hardest thing in behavior change — you let a wave break."
];

/* Honest science notes for the Why panel */
const SCIENCE = [
  {
    title: 'Long exhales calm the heart',
    body: 'Your heart naturally slows on every exhale (respiratory sinus arrhythmia). Making exhales longer than inhales — sighs, 4·8 breathing, humming — leans on that reflex through the vagus nerve, lowering heart rate and stress arousal within minutes. The physiological sigh outperformed meditation for mood and anxiety in a 2023 randomized study (Balban et al., Cell Reports Medicine).'
  },
  {
    title: 'Attention starves rumination',
    body: 'The default-mode network (DMN) is the brain circuitry behind self-referential looping — replaying, craving, comparing. Tasks that anchor attention in present-moment body sensation (breath focus, body scans) reliably reduce DMN activity. You can’t think your way out of a loop, but you can feel your way out.'
  },
  {
    title: 'Savoring raises the floor',
    body: 'Parasocial apps run on dopamine spikes: unpredictable rewards, scarcity, "she replied!" Savoring practice works the opposite axis — holding attention on real, already-present pleasant experience — which supports mood and counteracts negativity bias. Spikes rent you a feeling; the floor is where you live.'
  },
  {
    title: 'Urges are waves, not orders',
    body: 'Urge surfing comes from relapse-prevention research (Marlatt & colleagues): cravings peak and subside in minutes when observed without acting. Each surfed wave weakens the loop; each obeyed one strengthens it. The skill is boring, repeatable, and it compounds.'
  }
];

/* The promises — the anti-dark-pattern manifesto, shown in-app */
const PROMISES = [
  { title: 'Sessions end.', body: 'Every practice has a last line, and it points at the door. There is no feed underneath.' },
  { title: 'Affection is not paywalled.', body: 'No tiers of intimacy, no "unlock her attention." Nothing here withholds warmth for money.' },
  { title: 'No punishment mechanics.', body: 'Miss a week and nothing breaks, burns, or guilt-trips you. Your streak counts days you showed up — it never counts against you.' },
  { title: 'Your data stays here.', body: 'Everything lives in your browser’s local storage. No account, no server, no one reading your check-ins.' },
  { title: 'The goal is graduation.', body: 'Success is you needing this less. The companions will tell you to close the app. Believe them.' }
];

/* Soft session budget per day, in minutes — the anti-engagement cap */
const DAILY_SOFT_CAP_MIN = 20;
