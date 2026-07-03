import { useEffect, useState } from 'react';
import type { EyeState, FigureMotion, PathScreenProps } from '../types';
import { softJhanaSettling } from '../data/softJhana';
import SeatedBody from './figure/SeatedBody';
import './path-a.css';

/**
 * Path A — Fast Settle (soft jhāna, Brasington-style).
 *
 * Walks through the four settling factors. Advancing is manual (a soft
 * "continue" tap) or, after a generous dwell, a soft auto-advance; the user
 * always goes at their own pace and nothing counts down at them.
 *
 * STIMULATION TAPER (safety/product invariant): as the user progresses,
 * everything only ever DECREASES — sound intensity steps down, visuals dim,
 * animation slows, and no new visual elements appear. The "Settled" button is
 * a USER SELF-REPORT tap; nothing on this screen detects or measures any
 * state.
 */

const LAST_FACTOR = softJhanaSettling.length - 1;

/** Master sound intensity per factor index — strictly decreasing. */
const INTENSITY_BY_FACTOR = [1, 0.75, 0.5, 0.3];

/** Generous dwell before a soft auto-advance (~90s). Not a countdown; it is
 *  never shown, and the manual continue tap always works sooner. */
const DWELL_MS = 90_000;

const MUDRA_SET_USED = 'dhyana (static)';

export default function FastSettle({ sound, eyesClosed, onComplete }: PathScreenProps) {
  const [factorIndex, setFactorIndex] = useState(0);

  const factor = softJhanaSettling[Math.min(factorIndex, LAST_FACTOR)];

  // On arriving at each factor (including the first — in eyes-closed mode the
  // cue is the only sign the settling has begun): taper the master intensity
  // DOWN, then play the prompt cue, which therefore sounds quieter each time.
  useEffect(() => {
    sound.setIntensity(INTENSITY_BY_FACTOR[factorIndex] ?? 0.3);
    sound.play('cue-settle-prompt');
  }, [factorIndex, sound]);

  // Soft auto-advance after a generous dwell. No auto-advance past the last
  // factor, and nothing ever auto-completes — only the user's Settled tap
  // ends the settling.
  useEffect(() => {
    if (factorIndex >= LAST_FACTOR) return;
    const timer = window.setTimeout(() => {
      setFactorIndex((i) => Math.min(i + 1, LAST_FACTOR));
    }, DWELL_MS);
    return () => window.clearTimeout(timer);
  }, [factorIndex]);

  const advance = () => {
    setFactorIndex((i) => Math.min(i + 1, LAST_FACTOR));
  };

  const handleSettled = () => {
    // Self-report timestamp — the user's tap is the only completion signal.
    sound.play('cue-settled');
    onComplete({
      settledAt: Date.now(),
      mudraSetUsed: MUDRA_SET_USED,
      endedEarly: false,
    });
  };

  const handleEndHere = () => {
    onComplete({
      settledAt: null,
      mudraSetUsed: MUDRA_SET_USED,
      endedEarly: true,
    });
  };

  // Figure state: motion and eyes settle with the factors; the hands stay in
  // a static dhyāna mudrā the whole time — still, and out of the way.
  const motion: FigureMotion = factorIndex <= 1 ? 'settling' : 'still';
  const eyeState: EyeState = factorIndex <= 1 ? 'soft' : 'closed';

  if (eyesClosed) {
    // Audio-only live mode: near-black veil, no figure, no prompts on screen —
    // the tapering cues carry the session. Two giant zones: top advances,
    // bottom is the Settled self-report tap.
    return (
      <div className={`eyes-closed-veil settle-veil taper-${factorIndex}`}>
        <button
          type="button"
          className="settle-veil-zone settle-veil-advance"
          onClick={advance}
          aria-label="Upper half of the screen — tap to move to the next settling prompt, whenever you are ready"
        >
          <span className="settle-veil-hint" aria-hidden="true">
            upper half — next
          </span>
        </button>
        <button
          type="button"
          className="settle-veil-zone settle-veil-settled"
          onClick={handleSettled}
          aria-label="Lower half of the screen — Settled, a self-report tap. Tap when the settling feels complete; your report is the only signal"
        >
          <span className="settle-veil-hint" aria-hidden="true">
            lower half — settled
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={`screen fast-settle taper-${factorIndex}`}>
      <header className="top-bar">
        <span>Fast Settle</span>
        <span className="faint">self-paced</span>
      </header>

      <main className="fast-settle-main">
        <div className="settle-visuals" aria-hidden="true">
          <div className="settle-aura" />
          <div className="settle-figure">
            <SeatedBody
              mudra="dhyana"
              eyeState={eyeState}
              motion={motion}
              glowChakra={null}
              transitionMs={4000}
            />
          </div>
        </div>

        <p className="prompt-text settle-prompt">{factor.promptText}</p>
        <p className="faint settle-factor-label">
          {factor.label} · {factorIndex + 1} of {softJhanaSettling.length}
        </p>

        {factorIndex < LAST_FACTOR && (
          <button
            type="button"
            className="btn settle-continue"
            onClick={advance}
          >
            Continue when ready
          </button>
        )}
      </main>

      <div className="stack settle-tap-zone">
        <button
          type="button"
          className="tap-report tap-report-calm"
          onClick={handleSettled}
        >
          <span className="settle-tap-label">Settled</span>
          <span className="settle-tap-hint">
            Tap when the settling feels complete — your report is the only
            signal.
          </span>
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleEndHere}>
          End here
        </button>
      </div>
    </div>
  );
}
