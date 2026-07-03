/**
 * SHIELD MAX logic test harness — zero-dependency Node runner.
 *
 * Loads the compiled browser bundle (dist/app.js); the bundle's DOM guard
 * keeps it from booting UI under Node, and every pure-logic class is exposed
 * on globalThis.SHIELD. Run with: node tests/run-tests.mjs
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('../dist/app.js');

const S = globalThis.SHIELD;
if (!S) {
  console.error('FATAL: bundle did not export globalThis.SHIELD — build first (tsc).');
  process.exit(1);
}

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.error(`  FAIL ${name}\n       ${err.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function approx(a, b, eps, msg) {
  assert(Math.abs(a - b) <= eps, `${msg} (got ${a}, want ~${b})`);
}

const hyperSample = (t) => ({ t, actionsPerMinute: 40, errorRate: 0.5, meanLatencyMs: 150, idleRatio: 0 });
const sluggishSample = (t) => ({ t, actionsPerMinute: 2, errorRate: 0, meanLatencyMs: 2900, idleRatio: 0.9 });
const balancedSample = (t) => ({ t, actionsPerMinute: 16, errorRate: 0.08, meanLatencyMs: 900, idleRatio: 0.1 });

console.log('\n── BehavioralMatrixEngine ──');

test('arousal index is clamped to [0,1] and orders states correctly', () => {
  const hi = S.computeArousalIndex(hyperSample(0));
  const mid = S.computeArousalIndex(balancedSample(0));
  const lo = S.computeArousalIndex(sluggishSample(0));
  assert(hi >= 0 && hi <= 1 && lo >= 0 && lo <= 1, 'index out of range');
  assert(hi > 0.7, `hyper sample should exceed 0.7, got ${hi}`);
  assert(mid >= 0.33 && mid < 0.7, `balanced sample should sit mid-band, got ${mid}`);
  assert(lo < 0.33, `sluggish sample should sit low-band, got ${lo}`);
});

test('engine starts BALANCED and dwell-debounces before transitioning', () => {
  const engine = new S.BehavioralMatrixEngine();
  assert(engine.currentState === 'BALANCED', 'initial state');
  const events = [];
  engine.onStateChange((ev) => events.push(ev));
  engine.ingest(hyperSample(0));
  engine.ingest(hyperSample(1000));
  assert(engine.currentState === 'BALANCED', 'must not transition before dwell elapses');
  engine.ingest(hyperSample(3000));
  assert(engine.currentState === 'HYPER', 'should transition after 2.5s dwell');
  assert(events.length === 1 && events[0].action === 'FREEZE_AND_BREATHE', 'HYPER entry must demand freeze+breathe');
});

test('SLUGGISH entry demands TEMPO_BOOST', () => {
  const engine = new S.BehavioralMatrixEngine();
  const events = [];
  engine.onStateChange((ev) => events.push(ev));
  for (let t = 0; t <= 6000; t += 1000) engine.ingest(sluggishSample(t));
  assert(engine.currentState === 'SLUGGISH', 'should reach SLUGGISH');
  assert(events[0].action === 'TEMPO_BOOST', 'SLUGGISH entry must demand tempo boost');
});

test('re-entering BALANCED demands EXIT_PROMPT', () => {
  const engine = new S.BehavioralMatrixEngine();
  const events = [];
  engine.onStateChange((ev) => events.push(ev));
  for (let t = 0; t <= 6000; t += 1000) engine.ingest(hyperSample(t));
  for (let t = 7000; t <= 20000; t += 1000) engine.ingest(balancedSample(t));
  assert(engine.currentState === 'BALANCED', 'should settle back to BALANCED');
  const back = events.find((e) => e.to === 'BALANCED');
  assert(back && back.action === 'EXIT_PROMPT', 'BALANCED entry must demand exit prompt');
});

test('hysteresis prevents thrash at the band boundary', () => {
  const engine = new S.BehavioralMatrixEngine();
  const events = [];
  engine.onStateChange((ev) => events.push(ev));
  // Craft samples that hover fractionally around the 0.33 boundary.
  const nearBoundary = (t, apm) => ({ t, actionsPerMinute: apm, errorRate: 0, meanLatencyMs: 3000, idleRatio: 0.6 });
  for (let t = 0, i = 0; t <= 30000; t += 1000, i++) {
    engine.ingest(nearBoundary(t, i % 2 === 0 ? 32.2 : 33.8)); // index ≈ 0.322 / 0.338
  }
  assert(events.length <= 1, `boundary hover must not thrash (got ${events.length} transitions)`);
});

test('time-in-state accounting accumulates', () => {
  const engine = new S.BehavioralMatrixEngine();
  for (let t = 0; t <= 10000; t += 1000) engine.ingest(balancedSample(t));
  assert(engine.timeInStateMs.BALANCED === 10000, `expected 10000ms balanced, got ${engine.timeInStateMs.BALANCED}`);
});

test('transition table is valid JSON covering [0,1) without gaps', () => {
  const table = new S.BehavioralMatrixEngine().transitionTable;
  const rules = [...table.rules].sort((a, b) => a.min - b.min);
  assert(rules[0].min === 0, 'coverage must start at 0');
  for (let i = 1; i < rules.length; i++) {
    assert(rules[i].min === rules[i - 1].max, `gap between rules ${i - 1} and ${i}`);
  }
  assert(rules[rules.length - 1].max > 1, 'coverage must include 1.0');
  assert(JSON.parse(JSON.stringify(table)).rules.length === rules.length, 'table must round-trip as JSON');
});

console.log('\n── FocusVault ──');

test('vault persists metrics across instances on the same backend', () => {
  const backend = new S.MemoryBackend();
  const a = new S.FocusVault(backend);
  a.recordPatternCleared(3);
  a.recordPatternCleared(5);
  const b = new S.FocusVault(backend);
  assert(b.totalPatternsCleared === 2, 'clear count must persist');
  assert(b.snapshot().bestStreak === 5, 'best streak must persist');
});

test('vault self-heals from corrupted storage', () => {
  const backend = new S.MemoryBackend();
  backend.setItem('shieldmax.vault.v1', '{not json!!');
  const v = new S.FocusVault(backend);
  assert(v.totalPatternsCleared === 0, 'corrupt vault must reset cleanly');
  v.recordPatternCleared(1);
  assert(new S.FocusVault(backend).totalPatternsCleared === 1, 'vault must be writable after heal');
});

test('session log is bounded at 200 entries', () => {
  const backend = new S.MemoryBackend();
  const v = new S.FocusVault(backend);
  const rec = (i) => ({
    startedAt: i, endedAt: i + 1, patternsCleared: 1, bestAccuracy: 1,
    timeInStateMs: { SLUGGISH: 0, BALANCED: 1, HYPER: 0 }, exitedIntentionally: true,
  });
  for (let i = 0; i < 205; i++) v.recordSession(rec(i));
  const snap = v.snapshot();
  assert(snap.sessions.length === 200, `expected 200 retained sessions, got ${snap.sessions.length}`);
  assert(snap.totalSessions === 205, 'total counter must keep full history');
});

console.log('\n── CrucibleModule logic ──');

test('pre-mortem generates exactly 3 scenarios with distinct friction categories', () => {
  const scenarios = S.generateFailureScenarios('Ship my side project by October');
  assert(scenarios.length === 3, 'must generate 3 scenarios');
  const cats = new Set(scenarios.map((s) => s.frictionCategory));
  assert(cats.size === 3, 'categories must be distinct');
  for (const s of scenarios) {
    assert(s.narrative.includes('Ship my side project by October'), 'milestone must be woven into narrative');
    assert(s.weight > 0 && s.weight <= 1, 'weight must be a probability weight');
  }
});

test('pre-mortem is deterministic per milestone and varies across milestones', () => {
  const a1 = S.generateFailureScenarios('run a marathon');
  const a2 = S.generateFailureScenarios('run a marathon');
  assert(JSON.stringify(a1) === JSON.stringify(a2), 'same milestone must yield same scenarios');
  const differsFrom = (m) => JSON.stringify(S.generateFailureScenarios(m).map((s) => s.title));
  const base = differsFrom('run a marathon');
  const variants = ['write a novel', 'learn piano', 'get a promotion'];
  assert(variants.some((m) => differsFrom(m) !== base), 'different milestones should vary');
});

test('hedonic curve decays exponentially from peak to baseline over 12 months', () => {
  const c = S.computeHedonicCurve('any milestone');
  assert(c.points.length === 13, 'must chart months 0..12');
  approx(c.points[0], c.peak, 1e-9, 'month 0 must equal peak');
  for (let i = 1; i < c.points.length; i++) {
    assert(c.points[i] < c.points[i - 1], 'curve must be strictly decreasing');
    assert(c.points[i] > c.baseline, 'curve must stay above baseline');
  }
  approx(c.halfLifeMonths, Math.LN2 / c.lambda, 1e-9, 'half-life must match λ');
  const sAtHalfLife = c.baseline + (c.peak - c.baseline) * Math.exp(-c.lambda * c.halfLifeMonths);
  approx(sAtHalfLife, (c.peak + c.baseline) / 2, 1e-9, 'S(half-life) must bisect peak and baseline');
});

console.log('\n── RewardGate & ExitDirector ──');

test('reward bundles are strictly gated by verified clears', () => {
  for (const bundle of S.REWARD_BUNDLES) {
    assert(!S.RewardGate.isUnlocked(bundle, bundle.requiredClears - 1), `${bundle.id} must stay locked below threshold`);
    assert(S.RewardGate.isUnlocked(bundle, bundle.requiredClears), `${bundle.id} must unlock at threshold`);
  }
  const thresholds = S.REWARD_BUNDLES.map((b) => b.requiredClears);
  assert(thresholds.every((v, i) => i === 0 || v > thresholds[i - 1]), 'thresholds must escalate');
});

test('exit prompt requires balanced state, sustained residency, a real clear, and cooldown expiry', () => {
  const P = S.ExitDirector.shouldPrompt;
  const SUSTAIN = S.ExitDirector.SUSTAIN_MS;
  assert(P('BALANCED', SUSTAIN, 1, 1000, 0) === true, 'eligible case must prompt');
  assert(P('HYPER', SUSTAIN, 1, 1000, 0) === false, 'non-balanced must not prompt');
  assert(P('BALANCED', SUSTAIN - 1, 1, 1000, 0) === false, 'insufficient residency must not prompt');
  assert(P('BALANCED', SUSTAIN, 0, 1000, 0) === false, 'no verified clears must not prompt');
  assert(P('BALANCED', SUSTAIN, 1, 1000, 2000) === false, 'cooldown must suppress prompt');
});

console.log('\n── Geometry & breathing constants ──');

test('rotatedShape: four quarter-turns are identity; one turn transposes dims', () => {
  const L = [[1, 0], [1, 0], [1, 1]];
  assert(JSON.stringify(S.rotatedShape(L, 4)) === JSON.stringify(L), '4 turns must be identity');
  const once = S.rotatedShape(L, 1);
  assert(once.length === 2 && once[0].length === 3, 'one turn must swap dimensions');
  const cells = (m) => m.flat().reduce((a, b) => a + b, 0);
  assert(cells(once) === cells(L), 'rotation must preserve cell count');
});

test('breathing protocol is exactly 4s inhale / 7s hold / 8s exhale', () => {
  const [inhale, hold, exhale] = S.BREATH_478;
  assert(inhale.name === 'Inhale' && inhale.seconds === 4, 'inhale must be 4s');
  assert(hold.name === 'Hold' && hold.seconds === 7, 'hold must be 7s');
  assert(exhale.name === 'Exhale' && exhale.seconds === 8, 'exhale must be 8s');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
