import { describe, expect, it } from 'vitest';
import { MeditationSession } from '../src/session.js';
import { CuePriority, EngineEvent, Phase } from '../src/types.js';

/** Fast dwell config so a full scripted sit runs in simulated seconds. */
const FAST_CONFIG = {
  dwell: {
    [Phase.Settling]: 1000,
    [Phase.Access]: 1000,
    [Phase.PitiCultivation]: 1000,
    [Phase.Transition]: 1000,
    [Phase.Jhana1]: 1000,
  },
  regressionHoldMs: 500,
  // Keep the grasping detector out of the way for the progression script;
  // it has its own dedicated tests.
  grasping: { hold: 0.95, collapse: 0.99, sustainMs: 60_000 },
};

function collector() {
  const events: EngineEvent[] = [];
  return { events, listener: (e: EngineEvent) => events.push(e) };
}

function runTicks(s: MeditationSession, from: number, to: number, step = 100): number {
  for (let t = from + step; t <= to; t += step) s.tick(t);
  return to;
}

describe('MeditationSession (integration)', () => {
  it('guides a well-behaved scripted sit all the way to the second jhana', () => {
    const { events, listener } = collector();
    const s = new MeditationSession(0, { config: FAST_CONFIG, listener });

    let t = 0;
    s.selfReport(t, { focus: 0.7, effort: 0.2 });
    t = runTicks(s, t, 2000);
    expect(s.phase).toBe(Phase.Access);

    s.selfReport(t, { focus: 0.8, pleasantness: 0.8 });
    t = runTicks(s, t, 4000);
    expect(s.phase).toBe(Phase.PitiCultivation);

    s.selfReport(t, { piti: 0.7 });
    t = runTicks(s, t, 6000);
    expect(s.phase).toBe(Phase.Transition);

    s.selfReport(t, { piti: 0.9, sukha: 0.7, effort: 0.1 });
    t = runTicks(s, t, 8000);
    expect(s.phase).toBe(Phase.Jhana1);

    s.selfReport(t, { focus: 0.95, effort: 0.05 });
    t = runTicks(s, t, 10_000);
    expect(s.phase).toBe(Phase.Jhana2);

    // Every phase change carried an entry cue.
    const changes = events.filter((e) => e.type === 'phaseChange');
    expect(changes.map((c) => c.change.to)).toEqual([
      Phase.Access,
      Phase.PitiCultivation,
      Phase.Transition,
      Phase.Jhana1,
      Phase.Jhana2,
    ]);
    const entryCues = events.filter(
      (e) => e.type === 'cue' && e.cue.priority === CuePriority.PhaseEntry,
    );
    // Opening settling cue + one per phase change.
    expect(entryCues.length).toBe(changes.length + 1);
  });

  it('feeds breath marks through to the signal snapshot', () => {
    const s = new MeditationSession(0, { config: FAST_CONFIG });
    let t = 0;
    for (let i = 0; i < 8; i++) {
      s.breathMark({ t, kind: 'inhaleStart' });
      s.breathMark({ t: t + 2400, kind: 'exhaleStart' });
      t += 6000;
    }
    s.tick(t);
    const snap = s.signals();
    expect(snap.breath.warmedUp).toBe(true);
    expect(snap.breath.bpm).toBeCloseTo(10, 1);
    expect(snap.breath.regularity).toBeGreaterThan(0.9);
  });

  it('spaces deepening cues by at least the phase silence interval', () => {
    const { events, listener } = collector();
    const s = new MeditationSession(0, { config: FAST_CONFIG, listener });
    s.begin(0); // jump to Access
    // Stable but not pleasant enough to advance; renew focus to avoid
    // dullness corrections muddying the cadence measurement.
    let t = 0;
    for (let i = 0; i < 6; i++) {
      s.selfReport(t, { focus: 0.6, pleasantness: 0.2, effort: 0.25 });
      t = runTicks(s, t, t + 30_000);
    }
    const deepening = events.filter(
      (e) => e.type === 'cue' && e.cue.priority === CuePriority.Deepening,
    );
    expect(deepening.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < deepening.length; i++) {
      expect(deepening[i]!.cue.at - deepening[i - 1]!.cue.at).toBeGreaterThanOrEqual(40_000);
    }
    // Rotation: consecutive deepening cues use different phrasings.
    if (deepening.length >= 2) {
      expect(deepening[0]!.cue.text).not.toBe(deepening[1]!.cue.text);
    }
  });

  it('delivers a soften cue while the machine is holding for grasping', () => {
    const { events, listener } = collector();
    // Default grasping thresholds this time — we want the hold.
    const s = new MeditationSession(0, {
      config: { ...FAST_CONFIG, grasping: { hold: 0.5, collapse: 0.75, sustainMs: 15_000 } },
      listener,
    });
    s.begin(0);
    let t = runTicks(s, 0, 2000);
    // Sudden ecstatic surge, over-reported with high effort.
    s.selfReport(t, { piti: 0.95, effort: 0.9 });
    t = runTicks(s, t, 12_000);
    const correctives = events.filter(
      (e) => e.type === 'cue' && e.cue.priority === CuePriority.Corrective,
    );
    expect(correctives.length).toBeGreaterThanOrEqual(1);
  });

  it('moves to Emergence when the session budget elapses', () => {
    const { events, listener } = collector();
    const s = new MeditationSession(0, {
      config: FAST_CONFIG,
      sessionBudgetMs: 5000,
      listener,
    });
    runTicks(s, 0, 6000);
    expect(s.phase).toBe(Phase.Emergence);
    const change = events.find((e) => e.type === 'phaseChange' && e.change.to === Phase.Emergence);
    expect(change && change.type === 'phaseChange' && change.change.reason).toBe('timeout');
  });

  it('ignores inputs after the session has ended', () => {
    const s = new MeditationSession(0, { config: FAST_CONFIG });
    s.end(1000);
    expect(s.phase).toBe(Phase.Emergence);
    s.selfReport(1100, { piti: 1 });
    s.tick(2000);
    expect(s.phase).toBe(Phase.Emergence);
  });
});
