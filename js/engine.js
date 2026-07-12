/* Backbone — engine: state, scoring, persistence. Pure client-side, saves to localStorage. */

const SAVE_KEY = "backbone-save-v1";

function defaultState() {
  return {
    cultureId: null,
    culturesTried: [],
    xp: { O: 0, C: 0, E: 0, A: 0, S: 0 },
    score: 0,
    streak: { current: 0, best: 0, lastDay: null },
    stats: {
      sessionsCompleted: 0,
      assertiveChoices: 0,
      doormatChoices: 0,
      aggressiveChoices: 0,
      avoidChoices: 0,
      pushSituations: 0,     // rounds where a doormat option existed
      distortionsCaught: 0,
      distortionsMissed: 0,
      breathSessions: 0,
      cleanSessions: 0,      // scenario sessions with zero doormat picks
      calmReps: 0,           // stability-building actions of any kind
      readAbout: false,
    },
    seen: { scenarios: [], distortions: [], drills: [] },
    campaigns: {
      career: { stage: 0, done: false },
      love: { stage: 0, done: false },
    },
    badges: [],
  };
}

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    // merge over defaults so new fields added in updates don't break old saves
    const base = defaultState();
    return {
      ...base, ...parsed,
      xp: { ...base.xp, ...(parsed.xp || {}) },
      streak: { ...base.streak, ...(parsed.streak || {}) },
      stats: { ...base.stats, ...(parsed.stats || {}) },
      seen: { ...base.seen, ...(parsed.seen || {}) },
      campaigns: {
        career: { ...base.campaigns.career, ...((parsed.campaigns || {}).career || {}) },
        love: { ...base.campaigns.love, ...((parsed.campaigns || {}).love || {}) },
      },
    };
  } catch {
    return defaultState();
  }
}

function saveState() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* storage full/blocked: play on */ }
}

function resetState() {
  state = defaultState();
  saveState();
}

/* ---------- culture ---------- */
function currentCulture() {
  return CULTURES.find((c) => c.id === state.cultureId) || null;
}

function setCulture(id) {
  state.cultureId = id;
  if (!state.culturesTried.includes(id)) state.culturesTried.push(id);
  touchStreak();
  saveState();
}

/* ---------- leveling ---------- */
function traitLevel(xp) {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 20));
}
function levelFloorXp(level) {
  return level * level * 20;
}
function nextLevelXp(level) {
  return (level + 1) * (level + 1) * 20;
}

/* ---------- streak (daily) ---------- */
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function touchStreak() {
  const today = todayKey();
  if (state.streak.lastDay === today) return;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}`;
  state.streak.current = state.streak.lastDay === yesterday ? state.streak.current + 1 : 1;
  state.streak.best = Math.max(state.streak.best, state.streak.current);
  state.streak.lastDay = today;
}

/* ---------- scoring ----------
   Assertiveness always beats doormat/aggressive/avoidant, in every culture.
   Culture directness decides which STYLE of assertiveness earns the style bonus. */
function baseScore(kind, culture) {
  const d = culture ? culture.directness : 0.5;
  switch (kind) {
    case "assertDirect": return Math.round(7 + 7 * d);
    case "assertDiplo": return Math.round(7 + 7 * (1 - d));
    case "assert": return 12;
    case "good": return 12;
    case "ok": return 4;
    case "doormat": return -4;
    case "aggressive": return -5;
    case "avoid": return -3;
    default: return 0;
  }
}

function kindClass(kind) {
  if (["assertDirect", "assertDiplo", "assert", "good"].includes(kind)) return "good";
  if (kind === "ok") return "mid";
  return "bad";
}

function kindLabel(kind, culture) {
  const d = culture ? culture.directness : 0.5;
  switch (kind) {
    case "assertDirect":
      return d >= 0.6 ? "💪 Assertive — and direct plays great here"
           : d <= 0.4 ? "💪 Assertive — though this culture prefers softer wrapping"
           : "💪 Assertive & direct";
    case "assertDiplo":
      return d <= 0.4 ? "🤝 Assertive — and the diplomatic style is exactly right here"
           : d >= 0.6 ? "🤝 Assertive — though this culture would take it even straighter"
           : "🤝 Assertive & diplomatic";
    case "assert": return "💪 Assertive";
    case "good": return "✅ Strong move";
    case "ok": return "😐 Half-measure";
    case "doormat": return "🚪 Doormat move";
    case "aggressive": return "💥 Blow-up";
    case "avoid": return "🙈 Avoidance";
    default: return "";
  }
}

/* Apply a scenario/drill choice. Returns a result object for the UI. */
function applyChoice(choice, focusTrait) {
  const culture = currentCulture();
  const pts = baseScore(choice.kind, culture);
  const xpGained = {};

  for (const [trait, delta] of Object.entries(choice.traits || {})) {
    const weight = culture ? (culture.weights[trait] || 3) : 3;
    const amount = Math.round(delta * (2 + weight));
    if (amount !== 0) {
      xpGained[trait] = amount;
      state.xp[trait] = Math.max(0, state.xp[trait] + amount);
    }
  }

  // style bonus XP for landing culturally-attuned assertiveness
  if (choice.kind === "assertDirect" || choice.kind === "assertDiplo" || choice.kind === "assert") {
    const bonus = Math.max(2, Math.round(pts / 3));
    xpGained.A = (xpGained.A || 0) + bonus;
    state.xp.A += bonus;
  }

  state.score = Math.max(0, state.score + pts);

  const hasDoormatOption = !!choice._roundHadDoormat;
  if (hasDoormatOption) state.stats.pushSituations++;

  switch (choice.kind) {
    case "assertDirect":
    case "assertDiplo":
    case "assert":
      state.stats.assertiveChoices++; break;
    case "doormat": state.stats.doormatChoices++; break;
    case "aggressive": state.stats.aggressiveChoices++; break;
    case "avoid": state.stats.avoidChoices++; break;
  }
  if ((choice.traits || {}).S > 0) state.stats.calmReps++;

  touchStreak();
  saveState();

  return { pts, xpGained, culture, cls: kindClass(choice.kind), label: kindLabel(choice.kind, culture) };
}

/* Backbone meter: assertive share of the choices made when someone pushed on you. */
function backbonePct() {
  const total = state.stats.assertiveChoices + state.stats.doormatChoices
    + state.stats.aggressiveChoices;
  if (!total) return null;
  return Math.round((state.stats.assertiveChoices / total) * 100);
}

/* Calm meter: stability practice, saturating toward 100. */
function calmPct() {
  const reps = state.stats.calmReps + state.stats.distortionsCaught + state.stats.breathSessions * 3;
  if (!reps) return null;
  return Math.min(100, Math.round(100 * (1 - Math.exp(-reps / 25))));
}

/* ---------- badges ---------- */
function checkBadges() {
  const fresh = [];
  for (const b of BADGES) {
    if (!state.badges.includes(b.id) && b.check(state)) {
      state.badges.push(b.id);
      fresh.push(b);
    }
  }
  if (fresh.length) saveState();
  return fresh;
}

/* ---------- deck serving: prefer unseen, then least-recently-seen ---------- */
function drawFrom(deck, seenList, count, filter) {
  const pool = filter ? deck.filter(filter) : deck.slice();
  const unseen = pool.filter((item) => !seenList.includes(item.id ?? item.thought ?? item.situation));
  const seen = pool.filter((item) => seenList.includes(item.id ?? item.thought ?? item.situation));
  shuffle(unseen);
  // least-recently-seen first: order of seenList is play order
  seen.sort((a, b) =>
    seenList.indexOf(a.id ?? a.thought ?? a.situation) - seenList.indexOf(b.id ?? b.thought ?? b.situation));
  const picked = unseen.concat(seen).slice(0, count);
  shuffle(picked);
  return picked;
}

function markSeen(seenList, key) {
  const i = seenList.indexOf(key);
  if (i !== -1) seenList.splice(i, 1);
  seenList.push(key);
  // keep the list bounded
  if (seenList.length > 200) seenList.splice(0, seenList.length - 200);
}

/* Scenario serving is culture-aware: traits the culture prizes (and where the
   player is weakest) surface more often. */
function drawScenarios(count) {
  const culture = currentCulture();
  const pool = SCENARIOS.slice();
  const weightFor = (sc) => {
    const w = culture ? (culture.weights[sc.focus] || 3) : 3;
    const lvl = traitLevel(state.xp[sc.focus] || 0);
    const unseenBoost = state.seen.scenarios.includes(sc.id) ? 0 : 6;
    return w + Math.max(0, 4 - lvl) + unseenBoost;
  };
  const picked = [];
  while (picked.length < count && pool.length) {
    const weights = pool.map(weightFor);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let idx = 0;
    while (r > weights[idx]) { r -= weights[idx]; idx++; }
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
