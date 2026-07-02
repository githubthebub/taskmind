/* ============================================================
   ATTUNE — state model
   The nervous system is modeled as a 4-dimensional vector,
   each dimension 0–100:

     energy  : 0 = collapsed / shut down … 100 = wired / racing
               (autonomic arousal — the vertical axis of the map)
     ease    : 0 = distressed / braced   … 100 = deeply at ease
               (affective valence — the horizontal axis of the map)
     ground  : 0 = dissociated / floaty  … 100 = embodied / rooted
     clarity : 0 = foggy / scattered     … 100 = clear / focused
   ============================================================ */

const Attune = {};

Attune.DIMS = ["energy", "ease", "ground", "clarity"];

Attune.defaultVector = () => ({ energy: 50, ease: 50, ground: 50, clarity: 50 });

/* Destination presets — the "shores" on the map.
   Each is a well-formed autonomic target a practitioner would recognize. */
Attune.PRESETS = [
  {
    id: "calm", name: "Deep Calm",
    vector: { energy: 32, ease: 86, ground: 80, clarity: 55 },
    blurb: "parasympathetic settling — quiet, warm, unhurried",
  },
  {
    id: "focus", name: "Grounded Focus",
    vector: { energy: 62, ease: 70, ground: 78, clarity: 92 },
    blurb: "alert and organized without bracing",
  },
  {
    id: "energize", name: "Alive & Energized",
    vector: { energy: 82, ease: 74, ground: 66, clarity: 76 },
    blurb: "charged, warm, ready to move toward the day",
  },
  {
    id: "open", name: "Soft & Open",
    vector: { energy: 46, ease: 90, ground: 72, clarity: 48 },
    blurb: "undefended — the state connection happens from",
  },
  {
    id: "sleep", name: "Ready for Sleep",
    vector: { energy: 14, ease: 80, ground: 68, clarity: 20 },
    blurb: "heavy, dim, dissolving toward rest",
  },
  {
    id: "release", name: "Release & Reset",
    vector: { energy: 45, ease: 76, ground: 88, clarity: 60 },
    blurb: "let the body finish what it's been holding",
  },
];

/* Emotion-granularity vocabulary for the check-in.
   Naming affect precisely is itself regulating (affect labeling). */
Attune.FEELING_WORDS = [
  "restless", "braced", "heavy", "numb", "buzzing", "scattered",
  "tender", "irritable", "hollow", "pressured", "weary", "keyed-up",
  "flat", "anxious", "okay", "hopeful", "quiet", "raw",
];

/* Body-map regions. Each has an id, a label used in guidance text,
   and an SVG shape (built in ui.js). Qualities cycle:
   none → tension → numb → warm → none */
Attune.BODY_REGIONS = [
  { id: "head",      label: "the crown of your head" },
  { id: "face",      label: "your face" },
  { id: "jaw",       label: "your jaw" },
  { id: "neck",      label: "your neck and throat" },
  { id: "shoulderL", label: "your left shoulder" },
  { id: "shoulderR", label: "your right shoulder" },
  { id: "chest",     label: "your chest" },
  { id: "armL",      label: "your left arm" },
  { id: "armR",      label: "your right arm" },
  { id: "handL",     label: "your left hand" },
  { id: "handR",     label: "your right hand" },
  { id: "belly",     label: "your belly" },
  { id: "back",      label: "your lower back and hips" },
  { id: "legL",      label: "your left leg" },
  { id: "legR",      label: "your right leg" },
  { id: "feet",      label: "your feet" },
];

/* ---------- the session record ---------- */

Attune.session = {
  before: Attune.defaultVector(),
  target: { ...Attune.PRESETS[0].vector },
  after: null,
  bodyMarks: {},        // regionId -> "tension" | "numb" | "warm"
  feelings: [],         // chosen words
  minutes: 20,
  presetId: "calm",
  plan: null,           // built by sequencer
  startedAt: null,
  voice: true,
  sound: true,
};

/* ---------- vector helpers ---------- */

Attune.clamp01 = (v) => Math.max(0, Math.min(100, v));

Attune.vecLerp = (a, b, t) => {
  const out = {};
  for (const d of Attune.DIMS) out[d] = a[d] + (b[d] - a[d]) * t;
  return out;
};

Attune.vecDist = (a, b) => {
  let s = 0;
  for (const d of Attune.DIMS) s += (a[d] - b[d]) ** 2;
  return Math.sqrt(s);
};

/* Map projection: x = ease, y = energy (both 0–100). */
Attune.toMapXY = (vec, w, h, pad) => ({
  x: pad + (vec.ease / 100) * (w - pad * 2),
  y: h - pad - (vec.energy / 100) * (h - pad * 2),
});
Attune.fromMapXY = (x, y, w, h, pad) => ({
  ease: Attune.clamp01(((x - pad) / (w - pad * 2)) * 100),
  energy: Attune.clamp01(((h - pad - y) / (h - pad * 2)) * 100),
});

/* Human-readable description of a vector — used in guidance & history. */
Attune.describeVector = (v) => {
  const e = v.energy, s = v.ease;
  if (e < 30 && s < 45) return "shut down";
  if (e < 30 && s >= 45) return e < 18 ? "deeply restful" : "quiet and settled";
  if (e < 55 && s >= 60) return "calm";
  if (e < 55 && s < 40) return "flat and uneasy";
  if (e < 55) return "steady";
  if (e >= 55 && s >= 60) return e > 78 ? "bright and energized" : "engaged and at ease";
  if (e >= 78 && s < 45) return "wired and braced";
  if (e >= 55 && s < 45) return "activated and tense";
  return "activated";
};

/* ---------- persistence ---------- */

Attune.STORAGE_KEY = "attune.journeys.v1";

Attune.loadJourneys = () => {
  try { return JSON.parse(localStorage.getItem(Attune.STORAGE_KEY)) || []; }
  catch { return []; }
};

Attune.saveJourney = (record) => {
  const list = Attune.loadJourneys();
  list.unshift(record);
  try { localStorage.setItem(Attune.STORAGE_KEY, JSON.stringify(list.slice(0, 200))); }
  catch { /* storage unavailable — session still works */ }
};

/* Dev mode: append ?fast to the URL to run session time 12x faster
   (for development and review only). */
Attune.TIME_SCALE = new URLSearchParams(location.search).has("fast") ? 12 : 1;
