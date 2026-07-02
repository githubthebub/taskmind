import { describe, expect, it } from 'vitest';
import { SignalFusion } from '../src/signals.js';

/** Advance fusion time in small steps, like a UI tick loop. */
function run(fusion: SignalFusion, from: number, to: number, stepMs = 100): number {
  for (let t = from + stepMs; t <= to; t += stepMs) fusion.tick(t);
  return to;
}

describe('SignalFusion', () => {
  it('moves signals most of the way to a self-report', () => {
    const f = new SignalFusion();
    f.tick(0);
    f.report({ piti: 1 });
    expect(f.snapshot().piti).toBeCloseTo(0.8, 5); // 0 + 0.8 * (1 - 0)
  });

  it('lets unreported dimensions stand', () => {
    const f = new SignalFusion();
    f.tick(0);
    const before = f.snapshot().stability;
    f.report({ sukha: 0.9 });
    expect(f.snapshot().stability).toBe(before);
  });

  it('fades absorption factors slowly between reports', () => {
    const f = new SignalFusion();
    f.tick(0);
    f.report({ piti: 1 });
    run(f, 0, 60_000);
    const piti = f.snapshot().piti;
    expect(piti).toBeLessThan(0.8); // faded...
    expect(piti).toBeGreaterThan(0.5); // ...but not gone (tau = 4 min)
  });

  it('drifts stability toward breath regularity once warmed up', () => {
    const f = new SignalFusion();
    f.tick(0);
    f.setBreath({ bpm: 8, regularity: 0.95, exhaleRatio: 1.5, warmedUp: true });
    run(f, 0, 300_000);
    expect(f.snapshot().stability).toBeGreaterThan(0.85);
  });

  it('raises grasping risk on a sudden piti surge', () => {
    const f = new SignalFusion();
    f.tick(0);
    run(f, 0, 10_000);
    expect(f.snapshot().graspingRisk).toBeLessThan(0.3);
    // A big excited jump in reported piti + effort.
    f.report({ piti: 0.9, effort: 0.8 });
    run(f, 10_000, 20_000);
    expect(f.snapshot().graspingRisk).toBeGreaterThan(0.5);
  });

  it('keeps grasping risk low for a gradual piti build', () => {
    const f = new SignalFusion();
    f.tick(0);
    f.report({ effort: 0.1 });
    let t = 0;
    let target = 0.1;
    for (let i = 0; i < 8; i++) {
      f.report({ piti: target });
      t = run(f, t, t + 30_000);
      target = Math.min(1, target + 0.1);
    }
    const s = f.snapshot();
    expect(s.piti).toBeGreaterThan(0.5);
    expect(s.graspingRisk).toBeLessThan(0.5);
  });

  it('treats a heart-rate spike above baseline as arousal feeding effort', () => {
    const f = new SignalFusion();
    f.tick(0);
    f.report({ effort: 0 });
    // Establish a calm baseline.
    let t = 0;
    for (let i = 0; i < 60; i++) {
      f.biometric({ heartRate: 60 });
      t = run(f, t, t + 1000);
    }
    const calmRisk = f.snapshot().graspingRisk;
    // Sudden sympathetic surge.
    for (let i = 0; i < 10; i++) {
      f.biometric({ heartRate: 78 });
      t = run(f, t, t + 1000);
    }
    expect(f.snapshot().graspingRisk).toBeGreaterThan(calmRisk + 0.2);
  });
});
