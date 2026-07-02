import { describe, expect, it } from 'vitest';
import { JhanaStateMachine } from '../src/machine.js';
import { Phase, SignalSnapshot } from '../src/types.js';

const CALM_BREATH = { bpm: 8, regularity: 0.9, exhaleRatio: 1.5, warmedUp: true };

function snap(overrides: Partial<SignalSnapshot> = {}): SignalSnapshot {
  return {
    stability: 0.5,
    pleasantness: 0.3,
    piti: 0,
    sukha: 0,
    effort: 0.2,
    graspingRisk: 0,
    breath: CALM_BREATH,
    ...overrides,
  };
}

/** Fast dwell times so tests read in seconds, not minutes. */
const FAST = {
  dwell: {
    [Phase.Settling]: 1000,
    [Phase.Access]: 1000,
    [Phase.PitiCultivation]: 1000,
    [Phase.Transition]: 1000,
    [Phase.Jhana1]: 1000,
  },
  regressionHoldMs: 500,
};

describe('JhanaStateMachine', () => {
  it('starts in Settling', () => {
    const m = new JhanaStateMachine(0);
    expect(m.phase).toBe(Phase.Settling);
  });

  it('progresses through the full path with good signals', () => {
    const m = new JhanaStateMachine(0, FAST);
    const good = snap({
      stability: 0.9,
      pleasantness: 0.8,
      piti: 0.8,
      sukha: 0.7,
      effort: 0.1,
    });
    const seen: Phase[] = [];
    for (let t = 100; t <= 10_000; t += 100) {
      const change = m.update(t, good);
      if (change) {
        expect(change.reason).toBe('progress');
        seen.push(change.to);
      }
    }
    expect(seen).toEqual([
      Phase.Access,
      Phase.PitiCultivation,
      Phase.Transition,
      Phase.Jhana1,
      Phase.Jhana2,
    ]);
  });

  it('does not advance before the minimum dwell time', () => {
    const m = new JhanaStateMachine(0, FAST);
    const good = snap({ stability: 0.9 });
    expect(m.update(999, good)).toBeNull();
    expect(m.update(1000, good)?.to).toBe(Phase.Access);
  });

  it('does not advance when criteria are unmet, however long the dwell', () => {
    const m = new JhanaStateMachine(0, FAST);
    m.requestBegin(0);
    // In Access: stable but the breath has not become pleasant yet.
    const flat = snap({ stability: 0.9, pleasantness: 0.2 });
    for (let t = 100; t <= 60_000; t += 100) {
      expect(m.update(t, flat)).toBeNull();
    }
    expect(m.phase).toBe(Phase.Access);
  });

  it('is hysteretic: signals between exit and entry thresholds cause no oscillation', () => {
    const m = new JhanaStateMachine(0, FAST);
    m.requestBegin(0);
    m.update(1000, snap({ stability: 0.9, pleasantness: 0.8 })); // -> PitiCultivation
    expect(m.phase).toBe(Phase.PitiCultivation);
    // stability 0.5: below the 0.65 needed to advance, above the 0.35 exit.
    const between = snap({ stability: 0.5, piti: 0.9 });
    for (let t = 1100; t <= 30_000; t += 100) {
      expect(m.update(t, between)).toBeNull();
    }
    expect(m.phase).toBe(Phase.PitiCultivation);
  });

  it('regresses gently from Transition when piti fades', () => {
    const m = new JhanaStateMachine(0, FAST);
    m.requestBegin(0);
    m.update(1000, snap({ stability: 0.9, pleasantness: 0.8 }));
    m.update(2000, snap({ stability: 0.9, piti: 0.7 }));
    expect(m.phase).toBe(Phase.Transition);

    const faded = snap({ stability: 0.8, piti: 0.1 });
    expect(m.update(2100, faded)).toBeNull(); // regression hold not yet elapsed
    const change = m.update(2600, faded);
    expect(change?.to).toBe(Phase.PitiCultivation);
    expect(change?.reason).toBe('regression');
  });

  it('freezes progression while grasping risk is high', () => {
    const m = new JhanaStateMachine(0, FAST);
    m.requestBegin(0);
    const goodButGrasping = snap({
      stability: 0.9,
      pleasantness: 0.9,
      graspingRisk: 0.6,
    });
    for (let t = 100; t <= 5000; t += 100) {
      expect(m.update(t, goodButGrasping)).toBeNull();
    }
    expect(m.phase).toBe(Phase.Access);
    expect(m.holding).toBe(true);
    // Risk subsides -> progression resumes immediately.
    const softened = snap({ stability: 0.9, pleasantness: 0.9, graspingRisk: 0.2 });
    expect(m.update(5100, softened)?.to).toBe(Phase.PitiCultivation);
  });

  it('collapses one phase after sustained severe grasping in a deep phase', () => {
    const m = new JhanaStateMachine(0, {
      ...FAST,
      grasping: { hold: 0.5, collapse: 0.75, sustainMs: 2000 },
    });
    m.requestBegin(0);
    m.update(1000, snap({ stability: 0.9, pleasantness: 0.8 }));
    m.update(2000, snap({ stability: 0.9, piti: 0.7 }));
    expect(m.phase).toBe(Phase.Transition);

    const grabbing = snap({ stability: 0.9, piti: 0.9, sukha: 0.7, graspingRisk: 0.85 });
    let collapse = null;
    for (let t = 2100; t <= 6000 && !collapse; t += 100) {
      collapse = m.update(t, grabbing);
    }
    expect(collapse?.to).toBe(Phase.PitiCultivation);
    expect(collapse?.reason).toBe('grasping');
  });

  it('does not collapse shallow phases on grasping — it only holds', () => {
    const m = new JhanaStateMachine(0, {
      ...FAST,
      grasping: { hold: 0.5, collapse: 0.75, sustainMs: 1000 },
    });
    m.requestBegin(0);
    const grabbing = snap({ graspingRisk: 0.9 });
    for (let t = 100; t <= 10_000; t += 100) {
      expect(m.update(t, grabbing)).toBeNull();
    }
    expect(m.phase).toBe(Phase.Access);
  });

  it('honors explicit user transitions', () => {
    const m = new JhanaStateMachine(0);
    expect(m.requestBegin(10)?.to).toBe(Phase.Access);
    const end = m.requestEmergence(20);
    expect(end?.to).toBe(Phase.Emergence);
    expect(end?.reason).toBe('user');
    // Emergence is terminal for the machine.
    expect(m.update(100_000, snap({ stability: 1 }))).toBeNull();
  });
});
