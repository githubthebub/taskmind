// Core content library for taskmind.
//
// Techniques are grounded in named contemplative and somatic lineages:
// - Anapanasati (mindfulness of breathing, Pali Canon / Ajahn Brahm's "jhana factors" framing)
// - The classical jhana factor progression: vitakka & vicara (applied & sustained attention)
//   -> piti (rapture) -> sukha (pleasure/ease) -> ekaggata (one-pointedness)
// - Taoist internal alchemy / neigong: the microcosmic orbit (xiao zhou tian), governing
//   and conception vessel circulation
// - Wim Hof Method-style controlled hyperventilation + breath retention
// - Tantric and neo-tantric "build, plateau, release" arousal-as-energy circulation practices,
//   reframed here strictly as body-awareness / breath / attention training (no explicit content)
// - Body scan practice (MBSR / Vipassana lineage)
// - Box breathing (used in clinical and performance settings for nervous-system regulation)
// - Metta (loving-kindness) as a closing / integration practice

export type Stage = {
  label: string;
  seconds: number;
  instruction: string;
  breathPattern?: {
    inhale: number;
    hold?: number;
    exhale: number;
    holdEmpty?: number;
  };
};

export type Technique = {
  id: string;
  title: string;
  category: "piti" | "jhana" | "somatic-build" | "breathwork" | "integration";
  durationMinutes: number;
  summary: string;
  groundedIn: string;
  stages: Stage[];
};

export const CATEGORY_LABELS: Record<Technique["category"], string> = {
  piti: "Piti (Rapture)",
  jhana: "Jhana Absorption",
  "somatic-build": "Somatic Build",
  breathwork: "Breathwork",
  integration: "Integration",
};

export const techniques: Technique[] = [
  {
    id: "breath-counting-piti",
    title: "Breath Counting into Piti",
    category: "piti",
    durationMinutes: 15,
    summary:
      "A classical anapanasati sequence that uses sustained, silent breath counting to settle the mind and let rapture arise on its own.",
    groundedIn: "Anapanasati (mindfulness of breathing), Pali Canon / Theravada meditation manuals",
    stages: [
      {
        label: "Settle",
        seconds: 90,
        instruction:
          "Find a stable seated posture. Let your eyes close. Take three slower breaths, feeling the chair or cushion beneath you.",
      },
      {
        label: "Establish the count",
        seconds: 240,
        instruction:
          "Begin counting each exhale silently, one through ten, then start again at one. If you lose the count, simply return to one without judgment.",
        breathPattern: { inhale: 4, exhale: 6 },
      },
      {
        label: "Refine attention",
        seconds: 240,
        instruction:
          "Let the counting fall into the background. Bring finer attention to the raw sensation of breath at the nostrils or chest — its texture, temperature, and rhythm.",
        breathPattern: { inhale: 4, exhale: 6 },
      },
      {
        label: "Notice rapture",
        seconds: 240,
        instruction:
          "As concentration steadies, you may notice tingling, lightness, warmth, or subtle waves of pleasure. This is piti. Don't chase it — simply let your attention rest inside whatever sensation is most vivid.",
      },
      {
        label: "Rest in stillness",
        seconds: 90,
        instruction:
          "Let the counting go entirely. Rest in open, wordless awareness of whatever rapture or calm remains, without adding anything to it.",
      },
    ],
  },
  {
    id: "jhana-factor-ladder",
    title: "The Jhana Factor Ladder",
    category: "jhana",
    durationMinutes: 25,
    summary:
      "A guided progression through the classical jhana factors — applied thought, sustained thought, rapture, pleasure, and one-pointedness — used to approach absorption in stages.",
    groundedIn: "Classical jhana factor model (vitakka, vicara, piti, sukha, ekaggata) as taught by Ajahn Brahm and the Visuddhimagga",
    stages: [
      {
        label: "Vitakka — applied attention",
        seconds: 240,
        instruction:
          "Deliberately place your attention on the breath sensation, again and again. Each time the mind wanders, gently redirect it back. This repeated 'placing' is vitakka.",
        breathPattern: { inhale: 4, exhale: 6 },
      },
      {
        label: "Vicara — sustained attention",
        seconds: 300,
        instruction:
          "Now let attention rest on the breath without needing to keep re-placing it. Investigate the sensation continuously — its beginning, middle, and end — letting it hold you rather than the reverse.",
        breathPattern: { inhale: 4, exhale: 6 },
      },
      {
        label: "Piti — rapture",
        seconds: 300,
        instruction:
          "As the mind unifies, energy or joy may bubble up as tingling, waves, or fullness in the body. Let this rapture spread, keeping attention soft and non-grasping.",
      },
      {
        label: "Sukha — pleasure and ease",
        seconds: 300,
        instruction:
          "The rapture may settle into a quieter, more even pleasure — a contented ease that asks nothing of you. Rest in this comfort, letting the body become very still.",
      },
      {
        label: "Ekaggata — one-pointedness",
        seconds: 300,
        instruction:
          "Let awareness gather to a single, unified point of stillness. There is little left to do — simply remain, undistracted, inside this one-pointed calm.",
      },
      {
        label: "Emerge gently",
        seconds: 60,
        instruction:
          "Slowly widen your awareness back to the room. Notice sound, light through the eyelids, the weight of your body, before opening your eyes.",
      },
    ],
  },
  {
    id: "microcosmic-orbit",
    title: "Microcosmic Orbit Circulation",
    category: "somatic-build",
    durationMinutes: 19,
    summary:
      "A taoist internal-alchemy practice that circulates cultivated energy along the governing and conception vessels — up the spine and down the front of the body.",
    groundedIn: "Taoist neigong / internal alchemy — xiao zhou tian (小周天), the 'microcosmic orbit'",
    stages: [
      {
        label: "Ground and settle",
        seconds: 120,
        instruction:
          "Sit with a straight but relaxed spine. Rest your tongue lightly on the roof of your mouth, just behind the front teeth, to bridge the two vessels. Breathe naturally into the lower belly.",
      },
      {
        label: "Gather at the lower dantian",
        seconds: 180,
        instruction:
          "Bring attention to a point roughly two inches below the navel and inward. With each inhale, imagine warmth or gentle charge gathering there. Let sensation build gradually, without straining.",
        breathPattern: { inhale: 5, hold: 2, exhale: 5 },
      },
      {
        label: "Rise up the governing vessel",
        seconds: 240,
        instruction:
          "On each inhale, trace the sensation from the base of the spine up through the lower back, between the shoulder blades, up the back of the neck, and over the crown of the head. Move slowly — let the breath lead the attention, not the other way around.",
        breathPattern: { inhale: 5, hold: 2, exhale: 5 },
      },
      {
        label: "Descend the conception vessel",
        seconds: 240,
        instruction:
          "On each exhale, let the sensation flow down the front of the face, throat, chest, and belly, returning to the lower dantian. Feel the loop closing — rising on the in-breath, descending on the out-breath.",
        breathPattern: { inhale: 5, hold: 2, exhale: 5 },
      },
      {
        label: "Full orbit, several rounds",
        seconds: 240,
        instruction:
          "Continue the full circuit for several unhurried rounds: gather, rise, crest, descend, return. Let each pass feel a little smoother and warmer than the last.",
        breathPattern: { inhale: 5, hold: 2, exhale: 5 },
      },
      {
        label: "Seal the energy",
        seconds: 120,
        instruction:
          "Let the circulation settle back into the lower dantian. Rest both hands over your belly, breathe naturally, and allow everything you've cultivated to gather quietly at this center.",
      },
    ],
  },
  {
    id: "build-plateau-release",
    title: "Build, Plateau, Release Cycling",
    category: "somatic-build",
    durationMinutes: 20,
    summary:
      "An edging-inspired attention practice: sensation and arousal-as-energy are allowed to build toward a peak, held at a plateau, and consciously redirected — rather than released outward — training the nervous system's capacity to hold and circulate high-intensity states.",
    groundedIn: "Neo-tantric 'build and circulate' methods; nervous-system titration principles from somatic experiencing",
    stages: [
      {
        label: "Orient to the body",
        seconds: 120,
        instruction:
          "Lie down or sit comfortably. Scan gently from feet to scalp, simply noticing what's present. No agenda yet — just contact with the body.",
      },
      {
        label: "Build — round one",
        seconds: 240,
        instruction:
          "Bring warm, curious attention to the pelvic floor and lower belly. Breathe fully into this region, letting natural sensation and charge build gradually. Let it rise to roughly seven out of ten intensity — noticeable, alive, but not overwhelming.",
        breathPattern: { inhale: 4, exhale: 4 },
      },
      {
        label: "Plateau and hold",
        seconds: 90,
        instruction:
          "Stop adding more. Simply hold your attention steady on the sensation without increasing or suppressing it. Breathe evenly and let the intensity plateau rather than peak.",
        breathPattern: { inhale: 4, hold: 4, exhale: 4 },
      },
      {
        label: "Redirect upward",
        seconds: 180,
        instruction:
          "On each inhale, draw the built sensation up through the belly, chest, and toward the crown, as though breath were carrying warmth upward through the body. Feel it spread and diffuse rather than concentrate.",
        breathPattern: { inhale: 5, exhale: 5 },
      },
      {
        label: "Build — round two",
        seconds: 240,
        instruction:
          "Return attention to the pelvic floor and let charge build a second time, slightly further than before. Stay curious about the edge of the sensation without pushing past what feels workable.",
        breathPattern: { inhale: 4, exhale: 4 },
      },
      {
        label: "Full-body release and spread",
        seconds: 210,
        instruction:
          "Let the built energy spread outward through the whole body on a long, slow exhale — arms, legs, spine, scalp. Allow any trembling, warmth, or looseness to move through you unimpeded.",
        breathPattern: { inhale: 4, exhale: 7 },
      },
      {
        label: "Rest",
        seconds: 120,
        instruction:
          "Lie or sit still. Let the body integrate in silence, with no further direction needed.",
      },
    ],
  },
  {
    id: "wim-hof-retention",
    title: "Controlled Hyperventilation & Retention",
    category: "breathwork",
    durationMinutes: 12,
    summary:
      "Rounds of deep, rhythmic breathing followed by breath retention, used to shift blood chemistry and induce a distinct, often tingling or euphoric altered state.",
    groundedIn: "Wim Hof Method-style controlled hyperventilation and breath retention",
    stages: [
      {
        label: "Preparation",
        seconds: 60,
        instruction:
          "Lie down or sit with a tall spine. This practice involves breath retention — never do it in water, while driving, or standing. Take a few natural breaths to arrive.",
      },
      {
        label: "Round 1 — power breaths",
        seconds: 150,
        instruction:
          "Take 30 full, connected breaths: a deep inhale through the nose or mouth, a passive, unforced exhale. Move quickly but without straining. Some lightheadedness or tingling is normal.",
        breathPattern: { inhale: 2, exhale: 1 },
      },
      {
        label: "Round 1 — retention",
        seconds: 90,
        instruction:
          "After the final exhale, let the breath go and hold empty. Stay relaxed. Hold as long as is comfortable, then take one deep recovery breath and hold it for 15 seconds before releasing.",
      },
      {
        label: "Round 2 — power breaths",
        seconds: 150,
        instruction:
          "Repeat 30 connected breaths. Notice how the body feels compared to round one — often more spacious or charged.",
        breathPattern: { inhale: 2, exhale: 1 },
      },
      {
        label: "Round 2 — retention",
        seconds: 120,
        instruction:
          "Exhale and hold empty again, staying soft in the belly and face. When the urge to breathe builds, stay a few more seconds if comfortable, then recover with one deep breath, held 15 seconds.",
      },
      {
        label: "Integration",
        seconds: 150,
        instruction:
          "Let breathing return to normal. Rest in stillness and notice any tingling, warmth, or clarity that remains from the practice.",
      },
    ],
  },
  {
    id: "box-breathing-reset",
    title: "Box Breathing Reset",
    category: "breathwork",
    durationMinutes: 8,
    summary:
      "An even four-part breath pattern used in clinical and high-performance settings to steady the nervous system before or after deeper practice.",
    groundedIn: "Box breathing (four-count breath regulation used in clinical and tactical performance training)",
    stages: [
      {
        label: "Settle",
        seconds: 90,
        instruction: "Sit comfortably with a relaxed, upright spine. Let your first few breaths be unforced.",
      },
      {
        label: "Box breathing",
        seconds: 300,
        instruction:
          "Inhale for four counts, hold for four, exhale for four, hold empty for four. Keep the pattern smooth and even — this is about steadiness, not effort.",
        breathPattern: { inhale: 4, hold: 4, exhale: 4, holdEmpty: 4 },
      },
      {
        label: "Free breath",
        seconds: 90,
        instruction:
          "Release the count and let breathing return to its natural rhythm. Notice the steadiness the pattern has left behind.",
      },
    ],
  },
  {
    id: "body-scan-awareness",
    title: "Somatic Body Scan",
    category: "somatic-build",
    durationMinutes: 15,
    summary:
      "A methodical sweep of attention through the body, building the baseline interoceptive sensitivity that piti and energy-circulation practices depend on.",
    groundedIn: "Body scan practice (MBSR / Vipassana lineage)",
    stages: [
      {
        label: "Arrive",
        seconds: 60,
        instruction: "Lie down, arms at your sides, palms up. Let your eyes close and take a few full breaths.",
      },
      {
        label: "Lower body",
        seconds: 240,
        instruction:
          "Bring attention slowly through the toes, feet, calves, knees, and thighs. Pause at each area just long enough to notice temperature, pressure, or tingling before moving on.",
      },
      {
        label: "Torso and pelvis",
        seconds: 240,
        instruction:
          "Move attention through the pelvic floor, belly, lower back, chest, and upper back. Notice the subtle movement of breath in each area.",
      },
      {
        label: "Arms, neck, and head",
        seconds: 240,
        instruction:
          "Continue through the hands, arms, shoulders, neck, jaw, face, and scalp. Let each region soften slightly as attention passes through it.",
      },
      {
        label: "Whole-body awareness",
        seconds: 120,
        instruction:
          "Let attention expand to hold the entire body at once, as a single field of sensation, breathing as one unified whole.",
      },
    ],
  },
  {
    id: "metta-integration",
    title: "Loving-Kindness Integration",
    category: "integration",
    durationMinutes: 10,
    summary:
      "A metta (loving-kindness) closing sequence that grounds and shares whatever calm, rapture, or energy has been cultivated during a session.",
    groundedIn: "Metta bhavana (loving-kindness meditation), Theravada lineage",
    stages: [
      {
        label: "Settle and locate warmth",
        seconds: 90,
        instruction: "Rest a hand on your chest. Breathe naturally and notice any residual warmth, calm, or openness from your practice.",
      },
      {
        label: "Toward yourself",
        seconds: 150,
        instruction:
          "Silently offer yourself a simple phrase: 'May I be well. May I be at ease.' Let the feeling behind the words matter more than the words themselves.",
        breathPattern: { inhale: 4, exhale: 6 },
      },
      {
        label: "Toward someone you care about",
        seconds: 150,
        instruction:
          "Bring someone you care about to mind. Silently offer: 'May you be well. May you be at ease.' Notice any warmth that arises and let it spread through your chest.",
        breathPattern: { inhale: 4, exhale: 6 },
      },
      {
        label: "Outward, without limit",
        seconds: 150,
        instruction:
          "Widen the offering outward — to neutral people, difficult people, and eventually all beings: 'May all beings be well. May all beings be at ease.'",
        breathPattern: { inhale: 4, exhale: 6 },
      },
      {
        label: "Close",
        seconds: 60,
        instruction: "Let the phrases go. Sit for a few final breaths in whatever warmth remains, then gently open your eyes.",
      },
    ],
  },
];

export function getTechniqueById(id: string): Technique | undefined {
  return techniques.find((t) => t.id === id);
}

export function getTechniquesByCategory(): Record<Technique["category"], Technique[]> {
  const grouped = {} as Record<Technique["category"], Technique[]>;
  for (const t of techniques) {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  }
  return grouped;
}
