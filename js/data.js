/* ============================================================
   VELVET — session data
   Each session is a sequence of phases. A phase has:
     name       — shown as the current stage label
     dur        — seconds
     breath     — {in, holdIn, out, holdOut} seconds (0 = skip)
     intensity  — 0..1, drives orb glow + soundscape energy
     cues       — [{t: secondsIntoPhase, text}] guidance lines
   ============================================================ */

const SESSIONS = [
  {
    id: 'full-body-wave',
    title: 'Full-Body Wave',
    subtitle: 'The classic breath-and-energy practice',
    level: 'Deep',
    tint: '#e0637c',
    description:
      'A slow build from grounded relaxation into circular breathing, ' +
      'moving warmth and aliveness up from the pelvis through the whole body — ' +
      'then a long, melting release. This is the flagship somatic practice.',
    phases: [
      {
        name: 'Arrive',
        dur: 150,
        breath: { in: 4, holdIn: 0, out: 6, holdOut: 0 },
        intensity: 0.15,
        cues: [
          { t: 2,   text: 'Lie down or recline. Let your whole weight be held.' },
          { t: 18,  text: 'Close your eyes. Breathe with the circle — in as it grows, out as it softens.' },
          { t: 45,  text: 'Unclench your jaw. Let your tongue rest heavy.' },
          { t: 75,  text: 'Soften your belly. There is nothing to hold in.' },
          { t: 105, text: 'Notice the places your body touches the surface beneath you.' },
          { t: 130, text: 'For the next while, nothing is required of you but feeling.' },
        ],
      },
      {
        name: 'Body Scan',
        dur: 180,
        breath: { in: 4, holdIn: 0, out: 6, holdOut: 0 },
        intensity: 0.25,
        cues: [
          { t: 2,   text: 'Bring your attention to your feet. Just notice — warmth, weight, tingling.' },
          { t: 25,  text: 'Let the attention drift up through calves and knees, slow as honey.' },
          { t: 50,  text: 'Rest your awareness in your thighs. Feel the blood in them.' },
          { t: 75,  text: 'Now the pelvis — the floor of the body. Breathe into it, gently.' },
          { t: 100, text: 'Notice any warmth or hum there. Don’t chase it. Just say hello.' },
          { t: 125, text: 'Let attention rise through belly and chest, softening as it goes.' },
          { t: 155, text: 'Face, scalp, hands. Your whole body, lit from inside with attention.' },
        ],
      },
      {
        name: 'Pelvic Wave',
        dur: 240,
        breath: { in: 4, holdIn: 0, out: 4, holdOut: 0 },
        intensity: 0.45,
        cues: [
          { t: 2,   text: 'On each inhale, gently rock your pelvis back and let your lower back arch.' },
          { t: 20,  text: 'On each exhale, curl the pelvis forward. A slow wave, like seaweed in water.' },
          { t: 50,  text: 'On the inhale, lightly engage your pelvic floor — as if drawing water upward.' },
          { t: 80,  text: 'On the exhale, release it completely. The release matters more than the squeeze.' },
          { t: 115, text: 'Keep the movement small and lazy. Effort is the enemy here.' },
          { t: 150, text: 'Imagine each inhale drawing warmth up from the pelvis into the belly.' },
          { t: 190, text: 'If sensation builds, let it. If it doesn’t, that’s equally perfect.' },
          { t: 220, text: 'A soft sound on the exhale — a sigh, a hum — helps the wave travel.' },
        ],
      },
      {
        name: 'Circular Breath',
        dur: 300,
        breath: { in: 3, holdIn: 0, out: 3, holdOut: 0 },
        intensity: 0.7,
        cues: [
          { t: 2,   text: 'Let the breath become circular — no pause at the top or bottom.' },
          { t: 25,  text: 'Breathe into the belly first, then the chest. Two-part breath.' },
          { t: 60,  text: 'Keep the exhale relaxed — just let it fall out of you.' },
          { t: 100, text: 'Keep the pelvic wave going underneath the breath. Wave and breath together.' },
          { t: 140, text: 'You may feel tingling, heat, trembling, emotion. All of it is welcome.' },
          { t: 180, text: 'Spread any sensation with your hands — sweep from pelvis up over belly and chest.' },
          { t: 220, text: 'If it gets intense, soften your jaw and keep the exhale loose.' },
          { t: 260, text: 'Last minute of the strong breath. Give it your full, easy attention.' },
        ],
      },
      {
        name: 'Peak & Spread',
        dur: 180,
        breath: { in: 2.5, holdIn: 0, out: 2.5, holdOut: 0 },
        intensity: 1.0,
        cues: [
          { t: 2,   text: 'Quicken the breath slightly. Stay loose. Ride the wave you’ve built.' },
          { t: 30,  text: 'Squeeze and release the pelvic floor in slow pulses with the breath.' },
          { t: 65,  text: 'Imagine the warmth rising up your spine to the crown of your head.' },
          { t: 100, text: 'Let your body move however it wants — arch, shake, curl.' },
          { t: 135, text: 'When you’re ready: take one huge inhale, hold, squeeze everything—' },
          { t: 150, text: '—and let it ALL go. Every muscle. Total surrender.' },
        ],
      },
      {
        name: 'Melt',
        dur: 240,
        breath: { in: 4, holdIn: 0, out: 8, holdOut: 2 },
        intensity: 0.2,
        cues: [
          { t: 2,   text: 'Let the breath go back to its own rhythm. Do absolutely nothing.' },
          { t: 30,  text: 'Feel the afterglow — the hum in your hands, chest, pelvis.' },
          { t: 70,  text: 'This stillness is part of the practice. Maybe the best part.' },
          { t: 120, text: 'Let any leftover trembling or emotion move through without a story.' },
          { t: 170, text: 'Place a hand on your heart, a hand on your belly. Thank your body.' },
          { t: 220, text: 'When the session ends, move like you’re waking from deep sleep — slowly.' },
        ],
      },
    ],
  },

  {
    id: 'pelvic-pulse',
    title: 'Pelvic Pulse',
    subtitle: 'Wake up the floor of the body',
    level: 'Foundation',
    tint: '#d98e4a',
    description:
      'A focused practice pairing breath with slow pelvic-floor pulses. ' +
      'Builds the mind–body wiring that every deeper practice rests on. ' +
      'Great daily practice; also genuinely good for pelvic health.',
    phases: [
      {
        name: 'Settle',
        dur: 90,
        breath: { in: 4, holdIn: 0, out: 6, holdOut: 0 },
        intensity: 0.15,
        cues: [
          { t: 2,  text: 'Sit or lie comfortably. Let your sit bones or hips feel heavy.' },
          { t: 25, text: 'Breathe low into your belly. Let it be round and soft.' },
          { t: 55, text: 'Bring attention to the pelvic floor — the hammock of muscle at your base.' },
        ],
      },
      {
        name: 'Find the Muscles',
        dur: 150,
        breath: { in: 4, holdIn: 0, out: 6, holdOut: 0 },
        intensity: 0.3,
        cues: [
          { t: 2,   text: 'On this exhale, gently lift the pelvic floor — like sipping through a straw.' },
          { t: 20,  text: 'On the inhale, release fully. Feel it drop and widen.' },
          { t: 50,  text: 'Keep everything else soft — thighs, glutes, jaw. Only the floor works.' },
          { t: 85,  text: 'Make the release as deliberate as the lift. Melt it open.' },
          { t: 120, text: 'Notice: can you feel the front, the back, the sides of the floor?' },
        ],
      },
      {
        name: 'Pulse Wave',
        dur: 240,
        breath: { in: 3, holdIn: 0, out: 5, holdOut: 0 },
        intensity: 0.55,
        cues: [
          { t: 2,   text: 'Now reverse it: inhale and lift, exhale and release. Feel the difference.' },
          { t: 40,  text: 'Add a slow pelvic rock — arch on the inhale, curl on the exhale.' },
          { t: 80,  text: 'Imagine the lift drawing warmth upward into the belly.' },
          { t: 120, text: 'Let the pulses get lazier and more pleasurable. Less gym, more wave.' },
          { t: 165, text: 'If warmth or tingling shows up, breathe it up and outward.' },
          { t: 210, text: 'A few more waves. Savor each release completely.' },
        ],
      },
      {
        name: 'Rest & Glow',
        dur: 120,
        breath: { in: 4, holdIn: 0, out: 8, holdOut: 0 },
        intensity: 0.2,
        cues: [
          { t: 2,  text: 'Stop all effort. Let the whole pelvis go completely quiet.' },
          { t: 35, text: 'Feel the echo of the pulses — warmth, heaviness, hum.' },
          { t: 80, text: 'This aliveness is yours. You can return to it any time.' },
        ],
      },
    ],
  },

  {
    id: 'spinal-current',
    title: 'Spinal Current',
    subtitle: 'Run energy up the spine',
    level: 'Deep',
    tint: '#8b6fd6',
    description:
      'A moving-meditation take on the microcosmic orbit: breath, gentle spinal ' +
      'undulation and attention combine to draw sensation from the base of the ' +
      'spine to the crown and back down the front of the body.',
    phases: [
      {
        name: 'Ground',
        dur: 120,
        breath: { in: 4, holdIn: 0, out: 6, holdOut: 0 },
        intensity: 0.15,
        cues: [
          { t: 2,  text: 'Sit tall but easy — spine like a stack of warm stones.' },
          { t: 30, text: 'Rest your attention at the very base of your spine.' },
          { t: 70, text: 'Breathe as if you could inhale through that spot.' },
        ],
      },
      {
        name: 'Undulate',
        dur: 210,
        breath: { in: 4, holdIn: 0, out: 4, holdOut: 0 },
        intensity: 0.4,
        cues: [
          { t: 2,   text: 'Begin a small wave through the spine — pelvis first, then ribs, then neck.' },
          { t: 35,  text: 'Inhale as the wave rolls up the back. Exhale as it melts down the front.' },
          { t: 80,  text: 'Make it smaller and smoother. The wave becomes almost invisible.' },
          { t: 130, text: 'Feel the warmth the movement generates at the base.' },
          { t: 175, text: 'Let your head float on top of the wave, jaw slack.' },
        ],
      },
      {
        name: 'Raise the Current',
        dur: 270,
        breath: { in: 4, holdIn: 2, out: 6, holdOut: 0 },
        intensity: 0.75,
        cues: [
          { t: 2,   text: 'On each inhale, draw sensation up the spine — base to crown.' },
          { t: 35,  text: 'In the brief hold, let it pool at the crown like light.' },
          { t: 75,  text: 'On the exhale, pour it down the front — face, throat, heart, belly, pelvis.' },
          { t: 120, text: 'A closed loop. Nothing leaves; it just circulates and warms.' },
          { t: 170, text: 'Add a soft pelvic-floor lift at the start of each inhale to feed the loop.' },
          { t: 220, text: 'If the current stutters, smile slightly. It genuinely helps.' },
        ],
      },
      {
        name: 'Still Point',
        dur: 180,
        breath: { in: 5, holdIn: 0, out: 8, holdOut: 2 },
        intensity: 0.2,
        cues: [
          { t: 2,   text: 'Let the movement stop. Let the loop keep spinning on its own.' },
          { t: 45,  text: 'Rest attention in the belly, just below the navel. Store the warmth there.' },
          { t: 100, text: 'Sit in the hum. There is nowhere else to be.' },
          { t: 150, text: 'Seal the practice with three slow breaths at your own pace.' },
        ],
      },
    ],
  },

  {
    id: 'quick-glow',
    title: 'Quick Glow',
    subtitle: 'Five minutes of embodied warmth',
    level: 'Anytime',
    tint: '#4aa8a0',
    description:
      'A short reset for the middle of a day: three minutes of wave breathing ' +
      'and two minutes of glow. Enough to change the weather in your body.',
    phases: [
      {
        name: 'Drop In',
        dur: 60,
        breath: { in: 4, holdIn: 0, out: 6, holdOut: 0 },
        intensity: 0.2,
        cues: [
          { t: 2,  text: 'Wherever you are — soften your belly and your jaw.' },
          { t: 30, text: 'Three breaths that are only for you.' },
        ],
      },
      {
        name: 'Wave',
        dur: 150,
        breath: { in: 3, holdIn: 0, out: 4, holdOut: 0 },
        intensity: 0.55,
        cues: [
          { t: 2,   text: 'Rock the pelvis gently with the breath — arch in, curl out.' },
          { t: 35,  text: 'Add a soft pelvic-floor lift on each inhale, full release on each exhale.' },
          { t: 75,  text: 'Sweep warmth upward with your attention on every in-breath.' },
          { t: 115, text: 'Let a sigh out. Louder than feels polite.' },
        ],
      },
      {
        name: 'Glow',
        dur: 90,
        breath: { in: 4, holdIn: 0, out: 8, holdOut: 0 },
        intensity: 0.25,
        cues: [
          { t: 2,  text: 'Stop everything. Feel what the wave left behind.' },
          { t: 40, text: 'Carry this hum back into your day.' },
        ],
      },
    ],
  },

  {
    id: 'evening-surrender',
    title: 'Evening Surrender',
    subtitle: 'Downshift into pleasure and sleep',
    level: 'Gentle',
    tint: '#5a7fd6',
    description:
      'A slow, downward-flowing practice for the end of the day. Long exhales, ' +
      'heavy limbs, and a body scan that trades tension for warmth. ' +
      'Designed to end with you on the edge of sleep.',
    phases: [
      {
        name: 'Unwind',
        dur: 180,
        breath: { in: 4, holdIn: 0, out: 8, holdOut: 0 },
        intensity: 0.2,
        cues: [
          { t: 2,   text: 'Lie down. Tonight the only direction is down.' },
          { t: 30,  text: 'Double-length exhales. Each one drains a little more of the day.' },
          { t: 80,  text: 'Squeeze your shoulders up to your ears… and drop them. Twice more.' },
          { t: 130, text: 'Let your legs roll open. Hands soft, palms up.' },
        ],
      },
      {
        name: 'Warm Scan',
        dur: 300,
        breath: { in: 4, holdIn: 0, out: 8, holdOut: 0 },
        intensity: 0.3,
        cues: [
          { t: 2,   text: 'Imagine warm oil poured slowly over the crown of your head.' },
          { t: 45,  text: 'It melts down your face, your throat, the back of your neck.' },
          { t: 95,  text: 'Down over chest and shoulders. Everything it touches goes heavy and warm.' },
          { t: 150, text: 'It pools in the belly and pelvis, gathering there as slow heat.' },
          { t: 210, text: 'Down the thighs, the knees, the calves, out the soles of the feet.' },
          { t: 260, text: 'Your whole body: warm, heavy, humming, done for the day.' },
        ],
      },
      {
        name: 'Edge of Sleep',
        dur: 240,
        breath: { in: 4, holdIn: 0, out: 10, holdOut: 2 },
        intensity: 0.1,
        cues: [
          { t: 2,   text: 'Let the breath become barely anything.' },
          { t: 60,  text: 'Each exhale, sink one centimeter deeper into the bed.' },
          { t: 140, text: 'You don’t have to finish this session. Sleep is a perfect ending.' },
        ],
      },
    ],
  },
];

/* minutes shown in the UI derive from the actual phase durations,
   so cards, pills and the in-session countdown always agree */
for (const s of SESSIONS) {
  s.minutes = Math.round(s.phases.reduce((a, p) => a + p.dur, 0) / 60);
}

/* ---------- building blocks for custom sessions ----------
   Each references a canonical phase; duration is user-adjustable
   and cue times scale with it. */

function findPhase(sessionId, phaseName) {
  const s = SESSIONS.find(x => x.id === sessionId);
  return s.phases.find(p => p.name === phaseName);
}

const PHASE_LIBRARY = [
  { id: 'arrive',   label: 'Arrive',           desc: 'Settle and soften',            phase: findPhase('full-body-wave', 'Arrive') },
  { id: 'scan',     label: 'Body Scan',        desc: 'Wake the body with attention', phase: findPhase('full-body-wave', 'Body Scan') },
  { id: 'pulse',    label: 'Pelvic Pulse',     desc: 'Slow floor pulses with breath', phase: findPhase('pelvic-pulse', 'Pulse Wave') },
  { id: 'wave',     label: 'Pelvic Wave',      desc: 'Rocking wave, warmth rising',  phase: findPhase('full-body-wave', 'Pelvic Wave') },
  { id: 'undulate', label: 'Spinal Undulation', desc: 'A wave through the spine',    phase: findPhase('spinal-current', 'Undulate') },
  { id: 'circular', label: 'Circular Breath',  desc: 'Connected breath, energy builds', phase: findPhase('full-body-wave', 'Circular Breath') },
  { id: 'current',  label: 'Spinal Current',   desc: 'Run sensation base to crown',  phase: findPhase('spinal-current', 'Raise the Current') },
  { id: 'peak',     label: 'Peak & Spread',    desc: 'Ride the wave to release',     phase: findPhase('full-body-wave', 'Peak & Spread') },
  { id: 'melt',     label: 'Melt',             desc: 'Afterglow and integration',    phase: findPhase('full-body-wave', 'Melt') },
];

/* ---------- Learn content ---------- */

const LEARN = [
  {
    title: 'What is somatic practice?',
    body:
      'Somatic simply means of the body. These practices use breath, micro-movement, ' +
      'muscle engagement and attention to amplify pleasant sensation and release held ' +
      'tension. The "full-body" or "energy" orgasm described in tantra, Taoist and ' +
      'modern somatic traditions is a whole-nervous-system wave of warmth, tingling and ' +
      'release built from nothing but breath and attention — no touch required.',
  },
  {
    title: 'How the practices work',
    body:
      'Three levers, stacked: (1) Breath — faster circular breathing shifts blood gases and ' +
      'autonomic tone, producing tingling and waves of sensation; long exhales downshift you ' +
      'into the parasympathetic "rest and glow" state. (2) Pelvic floor — slow contract/release ' +
      'cycles increase blood flow and interoceptive signal from the pelvis, the seed of the wave. ' +
      '(3) Attention — sensation grows where attention rests. Sweeping attention (and hands) ' +
      'upward literally trains sensation to travel.',
  },
  {
    title: 'Nothing happening?',
    body:
      'Completely normal, especially for the first weeks. The wiring builds with repetition, ' +
      'like learning to wiggle your ears. Chasing a result is the one reliable way to block it. ' +
      'Treat every session as succeeding at exactly what it did. Consistency beats intensity: ' +
      'ten relaxed minutes daily outperforms an occasional heroic hour.',
  },
  {
    title: 'Safety & care',
    body:
      'Strong circular breathing can cause light-headedness or tingling in hands and face — ' +
      'harmless, but always practice lying down or seated, never while driving or in water. ' +
      'Skip intense breathwork if you are pregnant or have cardiovascular conditions, epilepsy, ' +
      'or panic disorder, unless your clinician okays it. Emotional releases (tears, laughter, ' +
      'shaking) are common and healthy — slow the breath and let them pass. This app is for ' +
      'adults and is not medical advice.',
  },
];

export { SESSIONS, LEARN, PHASE_LIBRARY };
