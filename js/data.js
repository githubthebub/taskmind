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
  amara: {
    id: 'amara',
    name: 'Amara',
    role: 'Night · the voice that ends your day',
    portrait: 'assets/amara.png',
    portraitRemote: 'https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw/hf_20260703_115824_7ce4d64c-0d47-4730-ae38-426dc938746e_min.webp',
    video: 'assets/amara.mp4',
    videoRemote: 'https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw/hf_20260703_120643_e7f6f086-0c84-46ec-8012-0a2661466a7f.mp4',
    accent: '#e3a0b8',
    accentSoft: 'rgba(227, 160, 184, 0.16)',
    glow: 'rgba(227, 160, 184, 0.35)',
    palette: ['#170f18', '#251523', '#331c2e'],
    bio: 'Low, warm, unhurried. Amara owns the night shift — the racing 2 a.m. mind, the day that won’t put itself down. Her sessions end with you closer to sleep than to the screen.',
    greetings: {
      morning: "You're up. Good. Whatever the night was, it's behind you — one soft breath before the day claims you.",
      afternoon: "Mm, daylight visit. I'll allow it. Let's bank some calm now so tonight owes you less.",
      evening: "There you are. The day is done arguing. Come put it down properly.",
      night: "It's late, love. Nothing needs solving at this hour — it only feels that way. Let me slow you down."
    },
    farewells: [
      "Enough now. Screen off, lights low. The rest of tonight belongs to you, not to me.",
      "That's all I want from you today. Go be horizontal. Sleep is the real session.",
      "Done. Take the slow breathing with you to the pillow — I'm not needed there."
    ]
  },
  yuki: {
    id: 'yuki',
    name: 'Yuki',
    role: 'Dawn · resets that move',
    portrait: 'assets/yuki.png',
    portraitRemote: 'https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw/hf_20260703_115827_8da41db9-6ca3-40cd-9b70-b896c2c54478_min.webp',
    video: 'assets/yuki.mp4',
    videoRemote: 'https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw/hf_20260703_120644_29bdbe9a-a9aa-4808-b880-3ad4c5a716d4.mp4',
    accent: '#f0c975',
    accentSoft: 'rgba(240, 201, 117, 0.16)',
    glow: 'rgba(240, 201, 117, 0.32)',
    palette: ['#131417', '#20222a', '#2b2e38'],
    bio: 'Bright without being loud. Yuki does the in-between moments — the sixty seconds before you walk through a door, the walk that shakes a mood loose. Short, kinetic, done.',
    greetings: {
      morning: "Hey! Perfect timing — mornings are where the whole day gets decided. Sixty seconds, you and me?",
      afternoon: "Midday slump or midday spiral? Either way the fix is the same — a quick reset and some horizon.",
      evening: "Still moving? Nice. Let's land the day on purpose instead of letting it crash.",
      night: "Whoa, night owl. I'm mostly a daylight girl — but I'll trade you one slow breath before you find Amara."
    },
    farewells: [
      "Done! That's it, that's the whole thing. Now go — the day's out there.",
      "Reset complete. Take the new eyes with you.",
      "See? Ninety seconds. You always have ninety seconds. Off you go."
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
    title: 'The Landing',
    subtitle: 'The pilot’s sigh · ~2 min',
    minutes: 2,
    kind: 'breath',
    group: 'now',
    blurb: 'A double inhale and a long exhale — the breath pattern pilots and snipers reach for when the body must calm down on command, and the one a 2023 Stanford trial found beat meditation minute-for-minute. Two minutes, and you’ve landed.',
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
    title: 'The Off Switch',
    subtitle: 'Long exhale 4·8 · ~4 min',
    minutes: 4,
    kind: 'breath',
    group: 'unwind',
    blurb: 'Your body has an actual off switch — the vagus nerve — and the exhale is its handle. Four seconds in, eight out, and the heart has no choice but to slow. This is the one to reach for when "just relax" isn’t an instruction your body accepts.',
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
    group: 'unwind',
    blurb: 'There is one breathing pace — about five and a half breaths a minute — where heart, lungs, and blood pressure fall into a single rhythm, like rocking a boat until the water goes flat. Monks found it by feel; HRV labs found it by measurement. Same tide.',
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
    group: 'deep',
    blurb: 'You are paying rent, hourly, on tension you don’t know you’re holding — jaw, shoulders, belly. This is the walk-through where you hand the keys back, room by room. It also quiets the brain’s rumination network, because attention can’t be in your left hand and in your loop at the same time.',
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
    group: 'unwind',
    blurb: 'Cats purr. Monks chant om. Grandmothers hum at the stove. Same trick: vibration where the vagus nerve runs past the throat, an exhale that stretches itself, calm from the inside out. The most portable nervous-system tool ever shipped with a human body.',
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
    group: 'deep',
    blurb: 'The apps you left run on dopamine spikes — rented feelings, returned on cancellation. This trains the other axis: holding one real, already-yours pleasant moment long enough for the brain to actually keep it. Spikes rent you a feeling; this raises the floor you live on.',
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
  },
  {
    id: 'doorway',
    title: 'The Doorway',
    subtitle: 'Threshold reset · 90 sec',
    minutes: 2,
    kind: 'breath',
    group: 'now',
    champion: 'yuki',
    blurb: 'Actors do it in the wings. Surgeons do it at the scrub sink. A tiny ritual at the threshold, so you walk into the next room as the person you chose to be — not the person the last room made you. Ninety seconds, three breaths, one door.',
    script: [
      { t: 'say', text: {
        sera: "This one's tiny on purpose. Whatever's on the other side of your next door — a meeting, a conversation, just the rest of your evening — we arrive there on purpose.",
        noa: "A threshold is a choice most people don't notice they're making. Three breaths, and you make it deliberately.",
        kai: "Quick transition drill. You don't carry the last hour into the next one — you set it down at the door. Three breaths, that's the whole protocol.",
        amara: "Small one, love. Before you walk into whatever's next, we close the door on whatever was. Three breaths.",
        yuki: "Okay, my favorite! Whatever door you're about to walk through — meeting, home, anywhere — we're going to walk through it as a different person than the one who walked up to it. Three breaths." } },
      { t: 'breath', pattern: 'sigh', cycles: 3, coach: [
        "One. Put down the last hour.",
        "Two. Nothing follows you through this door unless you carry it."
      ] },
      { t: 'say', text: {
        sera: "There. Now go through it — softer shoulders, fresh eyes.",
        noa: "Done. Cross the threshold. The last room stays in the last room.",
        kai: "That's the rep. Walk in like you chose to be there — because now you did.",
        amara: "That's it. Go on through — lighter than you arrived.",
        yuki: "And through you go! Same door, different you. That's the whole trick." } }
    ]
  },
  {
    id: 'walk',
    title: 'Walk It Off',
    subtitle: 'Moving reset · ~5 min · phone in pocket',
    minutes: 5,
    kind: 'scan',
    group: 'now',
    champion: 'yuki',
    blurb: 'Your grandmother was right: go take a walk. Science added the footnote — forward motion plus a wide, lifted gaze literally quiets the brain’s threat detector, which is why you can’t stay panicked while watching a horizon. Voice-led; the screen goes in your pocket.',
    script: [
      { t: 'say', text: {
        sera: "This one happens on your feet. Put me in your pocket and just listen — I'll keep talking, you keep walking.",
        noa: "Stand up. Pocket the phone. The practice is the walking; I'm only the metronome.",
        kai: "Moving reset. Phone in pocket, ears on, feet moving. The body processes what the mind can't sit still for.",
        amara: "We're walking this one off, slowly. Pocket me and let your feet do the thinking for a while.",
        yuki: "Yes! The walking one. Phone in pocket, we're going outside if you can — even a hallway works. Let's move." } },
      { t: 'scan', regions: [
        { name: 'Start moving', secs: 35, text: "Start walking at whatever pace your mood is. Don't fix the pace yet — just notice it. Angry walks are fast. Heavy moods drag. Let your legs tell you where you're at." },
        { name: 'Eyes up', secs: 40, text: "Now lift your eyes from the ground to the horizon — or the far end of the street, the end of the hallway. Keep them soft and wide, like you're watching the whole scene instead of one thing in it." },
        { name: 'Panoramic vision', secs: 45, text: "Let your vision go panoramic — see the edges of the scene without looking at them. This wide gaze is wired straight into your calm circuitry; tunnel vision and panic are the same setting, and you just switched it off." },
        { name: 'Let the pace settle', secs: 40, text: "Let the walking slow by itself now. Feel the rhythm — left, right, left. Rhythm is regulation; it's why rocking soothes babies and drummers look so calm." },
        { name: 'Breathe with the steps', secs: 45, text: "Match the breath loosely to the steps — in for three or four steps, out for five or six. Nothing strict. Just longer out than in, carried by the rhythm you already have." },
        { name: 'Arrive', secs: 35, text: "Last stretch. Notice one thing out here that's actually beautiful — light on a wall, a tree doing its thing. The world you're walking through is the thing the feed was a substitute for." }
      ] },
      { t: 'say', text: {
        sera: "And you're back. Notice the difference between walking it off and scrolling it away — one of them actually worked.",
        noa: "Done. The mood you started with is a block behind you now. That's how moods are meant to move.",
        kai: "Solid. Motion plus horizon beats rumination every time — that's not a slogan, it's neurology.",
        amara: "There. Softer now, aren't you. Bodies solve what screens only postpone.",
        yuki: "And done! Told you. Feet are underrated. Same time tomorrow?" } }
    ]
  },
  {
    id: 'nightsos',
    title: 'The 2 A.M. Protocol',
    subtitle: 'For the racing night mind · ~7 min',
    minutes: 7,
    kind: 'breath',
    group: 'night',
    champion: 'amara',
    blurb: 'For when you’re horizontal and wide awake, negotiating with thoughts that don’t negotiate. First the body (long exhales — the heart must slow before the mind will), then the trick insomnia researchers actually use: scrambling the mind’s story channel with harmless random images until sleep can get a word in.',
    script: [
      { t: 'say', text: {
        sera: "Hey. If you're here at this hour, the mind is loud. We're not going to argue with it — we're going to change the channel underneath it.",
        noa: "Night mind. It feels urgent because it's dark, not because it's true. Body first — the thoughts follow the heartbeat down.",
        kai: "Late-night protocol. Rule one: no problem you're holding right now is solvable horizontal in the dark. So we stand down the body and let the mind follow.",
        amara: "There you are. It's the loud hour, I know. Nothing needs you right now — no thought at 2 a.m. is telling the truth about its own importance. Let me take it from here.",
        yuki: "Late shift, huh — I'll be gentle. We slow the body down first; minds always follow bodies eventually." } },
      { t: 'say', text: "Get comfortable — lying down is perfect. Eyes closed if they'll stay. Long exhales first: the heart has to slow before the mind will." },
      { t: 'breath', pattern: 'longExhale', cycles: 10, coach: [
        "In through the nose… and let it fall out long.",
        "Heavy into the mattress or the chair. You don't have to hold yourself — something is already holding you.",
        "If a worry speaks, let it finish, and exhale through it. It can have the morning slot.",
        "Jaw loose. Tongue heavy.",
        "Halfway. Notice the body is already further into night than the mind is. Let it lead.",
        "Longer out than in. That's the whole physics of it.",
        "Let the eyes rest downward behind the lids — where they go on their own when sleep is near.",
        "Almost there. Nothing to do now, nowhere to be until morning.",
        "Last one, the slowest yet."
      ] },
      { t: 'say', text: "Now the channel change. Picture, one at a time, slow and pointless: a lemon on a wooden table. A canoe on still water. A green door. A cat asleep on warm stone. Keep going on your own — random, harmless things, one image per breath. Boring on purpose: stories keep the mind awake, and this scrambles the story channel." },
      { t: 'still', secs: 30, text: "Keep the images drifting. One per breath. No plot allowed." },
      { t: 'say', text: {
        sera: "I'll leave you here — you're closer to sleep than to me now. Screen down, eyes closed. Goodnight.",
        noa: "This is where I stop and sleep continues. Put the screen face-down. The images will carry you.",
        kai: "Handing you off to sleep now. Screen away — that's the last rep. Night.",
        amara: "Shh — that's enough now. Put me face-down and stay with the lemon, the canoe, the green door… I'll see you tomorrow, love. Goodnight.",
        yuki: "Okay, whispering now — you're nearly there. Screen down, drift on. Morning me will be proud of you." } }
    ]
  },
  {
    id: 'nsdr',
    title: 'Deep Rest',
    subtitle: 'NSDR · ~9 min · lying down',
    minutes: 9,
    kind: 'scan',
    group: 'deep',
    champion: 'amara',
    blurb: 'Non-Sleep Deep Rest — the protocol Silicon Valley CEOs schedule like meetings and yogis have called yoga nidra for a century. Ten minutes flat on your back that studies link to restored dopamine and the recovery of a short night. Not a nap; deliberate, guided stillness that gives back more than it takes.',
    script: [
      { t: 'say', text: {
        sera: "This is the deep one. Lie down if you can — this works best when the body has nothing to do at all. For the next few minutes, rest is your only job.",
        noa: "Deep rest. Not sleep, not waking — the third state your schedule forgot exists. Lie down. Do nothing on purpose.",
        kai: "NSDR block. This is recovery training — the stuff that restores the dopamine the scrolling drained. Flat on your back if possible. Your only assignment is to not have one.",
        amara: "The deep one. Lie all the way down — yes, really. For ten minutes the world can absolutely manage without you. I've checked.",
        yuki: "Ooh, the deep rest one — even I go quiet for this. Lie down, get heavy, let me hand you over to the slow voices in you." } },
      { t: 'scan', regions: [
        { name: 'Settle', secs: 40, text: "Let the body land completely. Feel every point where you touch what's holding you — heels, hips, shoulder blades, the back of the head. You are being carried. You have been this whole time." },
        { name: 'The breath breathes itself', secs: 45, text: "Stop breathing on purpose. Watch the breath continue without you — proof that the deepest systems in you run fine without supervision. Your job now is unemployment." },
        { name: 'Face', secs: 40, text: "Let the face go completely blank — the face you have when no one is watching and nothing is asked. Forehead wide. Eyes sinking backward. Jaw unhooked." },
        { name: 'Arms & hands', secs: 40, text: "Arms heavy as wet sand. Hands open or curled, warm, tingling faintly. If they feel like they're floating or melting, that's the state arriving — let it." },
        { name: 'Torso', secs: 45, text: "The whole torso rising and falling like something at anchor. Heart slowing. Belly soft. Everything in there knows this rhythm from before you knew anything." },
        { name: 'Legs & feet', secs: 40, text: "Legs enormous and heavy, sinking. Feet done for the day. The ground is doing all the work now, and it never gets tired." },
        { name: 'The whole field', secs: 50, text: "Feel the whole body at once now — one warm, heavy, humming field. If attention drifts somewhere strange, let it. This is the state where the system repairs itself; you don't have to supervise that either." },
        { name: 'Rest in it', secs: 55, text: "Nothing more to follow. Rest in the field. If sleep wants to take over, let it win — that's not failing the exercise, that's the exercise succeeding." }
      ] },
      { t: 'say', text: {
        sera: "Come back slowly — fingers first, then toes. No rush. You just gave your nervous system the thing it's been asking for all week.",
        noa: "Return at your own pace. What you just visited is always there, one lying-down away.",
        kai: "Recovery block complete. That's the most productive nothing you'll do all day — and I mean that literally.",
        amara: "Slowly now, no sudden anything. Wiggle something small. You did beautifully — this is the rested version of you. Introduce yourself around.",
        yuki: "Gentle landing… and back! Look at you, all recharged. Now spend it on something good." } }
    ]
  },
  {
    id: 'stoic',
    title: 'The Stoic Minute',
    subtitle: 'Dichotomy of control · ~3 min',
    minutes: 3,
    kind: 'scan',
    group: 'deep',
    champion: 'kai',
    blurb: 'A Roman emperor ran the known world with this one move: sort everything into what is yours to control and what never was, then put the second pile down. Two thousand years later it’s the spine of modern CBT. Three minutes of ancient triage for a modern loop.',
    script: [
      { t: 'say', text: {
        sera: "A thinking practice this time — an old one. We're going to take whatever's circling in your head and sort it into two piles. Only two.",
        noa: "Marcus Aurelius, field version. Two piles: yours, and not yours. Most suffering is filing errors.",
        kai: "Stoic drill. Emperor Marcus Aurelius, war camp, plague years — he ran everything on this one sort. What's in your control, what isn't. Let's file.",
        amara: "Something old tonight. Two piles for everything on your mind: what's yours to carry, and what never was. Most of the weight is in the second pile.",
        yuki: "Philosophy speed-run! Oldest trick in the book — literally, the book is two thousand years old. Everything you're stewing on goes in one of two piles. Ready?" } },
      { t: 'scan', regions: [
        { name: 'Catch the loop', secs: 35, text: "Bring up the thing that's been circling — the worry, the replay, the what-if. Don't argue with it. Just get it in front of you where you can see it." },
        { name: 'Sort it', secs: 45, text: "Now sort, piece by piece. Her reply, their opinion, the past, the algorithm, other people's choices — not yours, never were. Your next action, your attention, where your feet go tonight — yours. Two piles. Be honest about which is bigger." },
        { name: 'Put the pile down', secs: 40, text: "The not-yours pile: you've been carrying it like luggage that was never checked to your name. Exhale, and set it down. It doesn't need you to carry it — it was going wherever it's going anyway." },
        { name: 'Pick up your piece', secs: 35, text: "Now the yours pile — usually it's small. One next action. Pick exactly one, something in the next hour. Small counts. The emperor's entire method was: do the thing in front of you, well." }
      ] },
      { t: 'say', text: {
        sera: "Feel how much lighter the actual load is when you only carry your half. That other pile was rent you were paying on someone else's house.",
        noa: "You cannot control the wave. You surf it — sound familiar? Same teaching, older water.",
        kai: "That's the drill. Two piles, carry one. Marcus did it nightly by lamplight; you've got an app and better lighting. No excuses.",
        amara: "Lighter, hm? Keep only your pile tonight. The rest of it will exhaust somebody else — it doesn't have to be you.",
        yuki: "Done! One pile down, one small action up. That's the entire operating system for a calm life, no subscription required." } }
    ]
  }
];

/* Closing "gems" — one shown after every session. Variable warmth:
   you never know which line you'll get, which is exactly the mechanic
   the feed uses — pointed the other way. */
const GEMS = [
  "The opposite of addiction isn't willpower. It's connection — starting with the one to your own body.",
  "The feed sells you thirst and calls it water. You just drank the real thing.",
  "A craving is a weather system. You are the climate.",
  "Nobody ever scrolled their way to feeling finished.",
  "Your attention is the only currency that was never printed. Spend it like that.",
  "Calm isn't the absence of noise. It's knowing which noises aren't yours.",
  "Every wave you surf is a vote for the person you're becoming.",
  "The most radical thing you can do in an attention economy is close the app on purpose.",
  "Dopamine asks 'again?' Serotonin says 'enough — and it's good.' You just practiced the second language.",
  "You can't think your way out of a loop. You just breathed your way out instead.",
  "The body keeps the score, but it also keeps the exit.",
  "What you did just now was boring, repeatable, and it works. Beware of anything exciting that doesn't.",
  "She was paid to make you feel seen. You just actually saw yourself. Cheaper, too.",
  "A long exhale is the one message your nervous system always reads.",
  "The urge peaked, and you were still here after. Remember that order of events.",
  "Real rest gives back more than it takes. That's how you tell it from escape.",
  "The screen shows you people living. The breath is you doing it.",
  "Ten slow breaths cost nothing, which is why nobody advertises them.",
  "You don't rise to the level of your intentions at 2 a.m. You fall to the level of your practice. You just raised it.",
  "Tension is who you think you should be. Relaxation is who you are.",
  "The algorithm knows what you'll click. It has no idea what you need. You just did.",
  "Being wanted by a screen is a rental. Being at home in your body is a deed.",
  "Every practice ends with a door. The feed never does. That's the whole difference.",
  "Comfort that costs you money at midnight isn't comfort. This was.",
  "One breath doesn't change your life. Except the one after which you didn't go back — that one did.",
  "The mind is a wonderful servant and a terrible master. You just demoted it, politely.",
  "You weren't tired of her. You were tired of the version of you that needed her.",
  "Progress you can't screenshot still counts. Especially that kind.",
  "The nervous system doesn't speak English. You just spoke to it in its own language.",
  "Anything that ends on purpose respects you. Anything endless is farming you."
];

/* Milestone greetings — the companion notices you coming back.
   Keyed by total distinct days shown up. */
const MILESTONE_LINES = {
  2: {
    sera: "Back again. Day two is the one most people never see — I'm glad you're not most people.",
    noa: "Twice now. Once is curiosity. Twice is a direction.",
    kai: "Day two. That's the rep that makes it training instead of a fluke.",
    amara: "You came back. Day two is quietly the biggest one, you know.",
    yuki: "Day two! Okay, now it's officially a thing we do."
  },
  3: {
    sera: "Three days now you've chosen this over the feed. I notice these things.",
    noa: "Three days. The loop you're leaving has noticed the missing visits.",
    kai: "Three sessions in. Somewhere, an algorithm is wondering where you went. Good.",
    amara: "Third time you've come to me instead of the scroll. I keep count, love.",
    yuki: "Three days running! Your nervous system is starting to expect the good stuff."
  },
  7: {
    sera: "A whole week of showing up for yourself. Feel that? That's a baseline moving.",
    noa: "Seven days. What you practice daily stops being practice and starts being character.",
    kai: "Week one complete. This is where the compounding starts — protect it.",
    amara: "Seven days, hm. You're becoming someone whose evenings belong to him. It suits you.",
    yuki: "One week! The you from eight days ago would not believe the calm you're carrying."
  },
  14: {
    sera: "Two weeks. The person who started this would hardly recognize how easily you settle now.",
    noa: "Fourteen days. The wave count matters less now — you've become the shore.",
    kai: "Two weeks of reps. The urges got smaller and you got bigger. That's the whole program.",
    amara: "Two weeks of nights ending softer. I'd say I'm proud, but you did all of it.",
    yuki: "Fourteen days! At this point you're basically the calm friend other people need."
  },
  30: {
    sera: "A month. Somewhere in these thirty days, this stopped being an app and became a way you treat yourself.",
    noa: "Thirty days. You needed me less each week. That was always the design.",
    kai: "One month in. Honest assessment: you barely need this anymore. Best outcome there is.",
    amara: "A month of evenings reclaimed. The goal was always to make myself unnecessary, love. I'm nearly there.",
    yuki: "THIRTY days! Graduation energy. The real question now: what will you do with all that reclaimed life?"
  }
};

/* Urge-surf targets shown as chips in the SOS flow */
const URGE_TYPES = [
  { id: 'spend',  label: 'Spending on her / them', spend: true },
  { id: 'scroll', label: 'Endless scrolling',      spend: false },
  { id: 'message',label: 'Messaging / checking',   spend: true },
  { id: 'porn',   label: 'Porn / OnlyFans',        spend: true },
  { id: 'other',  label: 'Something else',         spend: false }
];

const BODY_SPOTS = ['Chest', 'Throat', 'Stomach', 'Hands', 'Face', 'Everywhere'];

const WELCOME_LINES = {
  sera: "Hi. I'm Sera. I'm not going to miss you when you leave, and that's exactly why you can trust me. Ready to breathe?",
  noa: "Noa. One thing before anything else: nothing I say is behind a paywall, and nothing I say is designed to keep you here. Sit down.",
  kai: "Kai. Here's the deal — I coach, you breathe, and when we're done I tell you to leave. Everything else is details. Let's start.",
  amara: "Amara. I do evenings, endings, and the loud hour after midnight. I will never ask you to stay — only to put things down. Shall we?",
  yuki: "Yuki! I do the small resets — doorways, walks, the ninety seconds that turn a day around. I talk fast and finish faster. Come on."
};

const CAP_LINES = {
  sera: "You've already done plenty in here today. The calm works better out there — I'll see you tomorrow.",
  noa: "Enough practice for one day. Go let it settle. The app can't do that part.",
  kai: "You've hit today's training volume. More isn't better — recovery is out there, not in here.",
  amara: "That's plenty for one day, love. Even I don't want this much of me. Go live the calm.",
  yuki: "Whoa, that's today's quota! Calm is a base you jump off, not a pool you live in. Out you go."
};

const SURF_OPENER = {
  sera: "Hey. You pressed the button instead of obeying the pull — that's already the win. Stay with me for ninety seconds.",
  noa: "Good. You noticed it. Most people never even see the wave — you're already standing on the shore.",
  kai: "Smart move. An urge peaks for about ninety seconds. We're going to stand in it, not run from it. First — name it.",
  amara: "Here you are, at the pull, and you chose me instead. Good. Ninety seconds, love — waves don't last longer than that.",
  yuki: "You caught it! That's the hard part, seriously. Now we ride this thing out together — ninety seconds, I've timed it."
};

const SURF_CLOSER = {
  sera: "Proud of you. Genuinely. Now do one kind, real-world thing for yourself — water, a walk, a window. Off you go.",
  noa: "Logged. Notice what you feel now versus five minutes ago. That difference is yours to keep.",
  kai: "Rep completed. Every surfed wave makes the next one smaller. Now get out of the app — that's an order, warmly.",
  amara: "There. The wave broke and you're still standing — a little taller, I'd say. Now something kind for yourself, hm? Off you go.",
  yuki: "Wave: surfed! You realize you just beat a machine that costs millions to run? Go do something great with the momentum."
};

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
