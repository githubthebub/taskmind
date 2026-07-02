import { describe, expect, it } from 'vitest';
import { BreathAnalyzer } from '../src/breath.js';
import { BreathMark } from '../src/types.js';

/** Generate marks for regular breathing at `periodMs` per cycle. */
function regularBreathing(
  analyzer: BreathAnalyzer,
  cycles: number,
  periodMs: number,
  start = 0,
  inhaleFraction = 0.4,
): number {
  let t = start;
  for (let i = 0; i < cycles; i++) {
    analyzer.mark({ t, kind: 'inhaleStart' });
    analyzer.mark({ t: t + periodMs * inhaleFraction, kind: 'exhaleStart' });
    t += periodMs;
  }
  return t;
}

describe('BreathAnalyzer', () => {
  it('reports not warmed up before enough cycles', () => {
    const a = new BreathAnalyzer();
    a.mark({ t: 0, kind: 'inhaleStart' });
    a.mark({ t: 2000, kind: 'exhaleStart' });
    expect(a.metrics().warmedUp).toBe(false);
  });

  it('computes bpm from regular breathing', () => {
    const a = new BreathAnalyzer();
    regularBreathing(a, 8, 6000); // 10 breaths/min
    const m = a.metrics();
    expect(m.warmedUp).toBe(true);
    expect(m.bpm).toBeCloseTo(10, 1);
  });

  it('scores metronomic breathing as highly regular', () => {
    const a = new BreathAnalyzer();
    regularBreathing(a, 10, 6000);
    expect(a.metrics().regularity).toBeGreaterThan(0.9);
  });

  it('scores erratic breathing as irregular', () => {
    const a = new BreathAnalyzer();
    const periods = [3000, 9000, 4000, 11000, 2500, 10000, 3500, 12000];
    let t = 0;
    for (const p of periods) {
      a.mark({ t, kind: 'inhaleStart' });
      a.mark({ t: t + p * 0.4, kind: 'exhaleStart' });
      t += p;
    }
    expect(a.metrics().regularity).toBeLessThan(0.5);
  });

  it('tracks the exhale/inhale ratio', () => {
    const a = new BreathAnalyzer();
    // inhale 2 s, exhale 4 s -> ratio 2
    regularBreathing(a, 8, 6000, 0, 1 / 3);
    expect(a.metrics().exhaleRatio).toBeCloseTo(2, 1);
  });

  it('debounces marks that arrive too close together', () => {
    const a = new BreathAnalyzer();
    const end = regularBreathing(a, 6, 6000);
    const before = a.metrics().bpm;
    // Accidental double tap 100 ms after the last mark.
    const doubled: BreathMark = { t: end - 6000 * 0.6 + 100, kind: 'inhaleStart' };
    a.mark(doubled);
    expect(a.metrics().bpm).toBeCloseTo(before, 5);
  });

  it('resets statistics after a long signal gap', () => {
    const a = new BreathAnalyzer();
    const end = regularBreathing(a, 6, 6000);
    // 60 s silence, then new breathing must warm up again.
    a.mark({ t: end + 60_000, kind: 'inhaleStart' });
    expect(a.metrics().warmedUp).toBe(false);
  });

  it('prefers an external respiration rate when provided', () => {
    const a = new BreathAnalyzer();
    regularBreathing(a, 6, 6000); // taps say 10 bpm
    a.setExternalRate(7.5);
    expect(a.metrics().bpm).toBeCloseTo(7.5, 5);
    expect(a.metrics().warmedUp).toBe(true);
  });
});
