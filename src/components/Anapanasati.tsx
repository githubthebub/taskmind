import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnapanasatiProps, EyeState, JhanaFactor, TetradName } from '../types';
import { anapanasatiSteps } from '../data/anapanasati';
import SeatedBody from './figure/SeatedBody';
import './path-b.css';

/**
 * Path B — full ānāpānasati (16 steps, 4 tetrads, MN 118).
 *
 * PACING: self-paced and breath-cycle-counted, never clock-driven. The user
 * may mark breath cycles with a large, unobtrusive tap (or the space bar) —
 * or simply sit. After settings.breathsPerStep marked cycles the step either
 * softly advances (if settings.autoAdvanceSteps) or the "next step"
 * affordance quietly becomes a touch more present. Manual next/back is
 * always available. Nothing counts down, nothing alarms, nothing escalates.
 *
 * ENTRY: post-trigger sessions are offered a shortcut to step 5 (the Feeling
 * tetrad) since the trigger stage was itself conscious breathing; classic
 * sessions always run the full 1–16 with no shortcut.
 *
 * The closing "Looking back" screen is REFLECTION ONLY — a private,
 * skippable notes moment. Nothing here detects, scores, or measures any
 * state; marks are discarded when the screen closes.
 */

const steps = anapanasatiSteps;
const LAST_INDEX = steps.length - 1;
const TOTAL_STEPS = steps.length;

/** Index of step 5 — the Feeling (vedanā) tetrad entry point. */
const FEELING_ENTRY_INDEX = steps.findIndex((s) => s.step === 5);

const MUDRA_SET_USED = 'dhyana (static)';

/** Slow ambient breath cycle for the figure's torso (~9s), display only. */
const BREATH_CYCLE_MS = 9_000;

/** Tetrad interstitial dwell — the "slightly longer pause" between tetrads. */
const INTERSTITIAL_MS = 4_500;

/**
 * Post-session reflection list: the six jhāna factors with plain-English
 * glosses. Educational framing only — see the on-screen copy.
 */
const REFLECTION_FACTORS: { factor: JhanaFactor; name: string; gloss: string }[] = [
  { factor: 'vitakka', name: 'Vitakka — aiming', gloss: 'The mind placing itself on the breath, again and again.' },
  { factor: 'vicara', name: 'Vicāra — sustaining', gloss: 'Attention staying with the breath on its own for a while.' },
  { factor: 'piti', name: 'Pīti — rapture', gloss: 'Energetic joy: tingling, warmth, a sense of uplift.' },
  { factor: 'sukha', name: 'Sukha — pleasure', gloss: 'A contented, easeful happiness, quieter than rapture.' },
  { factor: 'ekaggata', name: 'Ekaggatā — one-pointedness', gloss: 'Attention gathering around a single thing.' },
  { factor: 'upekkha', name: 'Upekkhā — equanimity', gloss: 'An even, unruffled balance with whatever arose.' },
];

type Phase = 'entry' | 'practice' | 'reflection';

export default function Anapanasati({
  settings,
  sound,
  raptureOnsetAt,
  eyesClosed,
  entryMode,
  onComplete,
}: AnapanasatiProps) {
  // Post-trigger arrivals always get the entry choice — step 5 is an offered
  // shortcut, never a forced start. In eyes-closed mode the choice renders as
  // a two-zone veil instead of the visual cards.
  const initialEntry = entryMode === 'post-trigger';
  const initialIndex = 0;

  const [phase, setPhase] = useState<Phase>(initialEntry ? 'entry' : 'practice');
  const [stepIndex, setStepIndex] = useState(initialIndex);
  const [breathCount, setBreathCount] = useState(0);
  /** Tetrad name currently fading in on the between-tetrads pause. */
  const [interstitial, setInterstitial] = useState<TetradName | null>(null);
  const [breathPhase, setBreathPhase] = useState<number | undefined>(undefined);
  const [noticed, setNoticed] = useState<JhanaFactor[]>([]);
  const [result, setResult] = useState({ stepsCompleted: 0, endedEarly: false });

  /** Lowest 1-based step visited, for an honest steps-practiced count. */
  const lowestStepRef = useRef(steps[initialIndex].step);

  const breathsPerStep = Math.max(1, settings.breathsPerStep);
  const currentStep = steps[Math.min(stepIndex, LAST_INDEX)];
  const onLastStep = stepIndex >= LAST_INDEX;

  const goToStep = useCallback((nextIndex: number) => {
    lowestStepRef.current = Math.min(lowestStepRef.current, steps[nextIndex].step);
    setStepIndex(nextIndex);
    setBreathCount(0);
  }, []);

  /**
   * End the practice portion and open the optional reflection screen.
   * stepsCompleted counts steps actually practiced this sitting: everything
   * from the lowest step visited up to (and, on a natural finish, including)
   * the final step; an early finish does not count the step left mid-way.
   */
  const completePractice = useCallback(
    (endedEarly: boolean) => {
      const lowest = lowestStepRef.current;
      const current = steps[Math.min(stepIndex, LAST_INDEX)].step;
      const stepsCompleted = endedEarly
        ? Math.max(0, current - lowest)
        : TOTAL_STEPS - lowest + 1;
      setResult({ stepsCompleted, endedEarly });
      sound.play('cue-session-complete');
      setPhase('reflection');
    },
    [stepIndex, sound],
  );

  const advance = useCallback(() => {
    if (stepIndex >= LAST_INDEX) {
      completePractice(false);
      return;
    }
    const nextIndex = stepIndex + 1;
    sound.play('cue-step-advance');
    // Tetrad transitions get a slightly longer pause: the new tetrad's name
    // fades in on an interstitial before the step instruction appears.
    // (Eyes-closed mode is audio-only — the cue alone announces the change.)
    if (!eyesClosed && steps[nextIndex].tetrad !== steps[stepIndex].tetrad) {
      setInterstitial(steps[nextIndex].tetradName);
    }
    goToStep(nextIndex);
  }, [stepIndex, sound, eyesClosed, goToStep, completePractice]);

  const goBack = useCallback(() => {
    if (stepIndex === 0) return;
    goToStep(stepIndex - 1);
  }, [stepIndex, goToStep]);

  /**
   * Mark one breath cycle. Purely a self-paced pacing aid — the user can
   * also just sit and use the manual next/back controls.
   */
  const markBreath = useCallback(() => {
    if (eyesClosed) {
      // Audio-only mode: a soft pulse confirms the tap registered.
      sound.play('cue-breath-pulse');
    }
    const next = breathCount + 1;
    if (settings.autoAdvanceSteps && next >= breathsPerStep && !onLastStep) {
      // Soft advance — never past the final step; completing the practice is
      // always the user's own tap.
      advance();
      return;
    }
    setBreathCount(next);
  }, [breathCount, breathsPerStep, settings.autoAdvanceSteps, onLastStep, eyesClosed, sound, advance]);

  // Space bar marks a breath during practice.
  useEffect(() => {
    if (phase !== 'practice') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return;
      event.preventDefault();
      markBreath();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, markBreath]);

  // The tetrad interstitial clears itself after a gentle dwell (it can also
  // be tapped through). This pause delays nothing but the on-screen text —
  // it is not a countdown and is never displayed as one.
  useEffect(() => {
    if (interstitial === null) return;
    const timer = window.setTimeout(() => setInterstitial(null), INTERSTITIAL_MS);
    return () => window.clearTimeout(timer);
  }, [interstitial]);

  // Slow ambient breath phase for the figure — display only, ~10fps is
  // plenty. Omitted entirely under prefers-reduced-motion or eyes-closed.
  useEffect(() => {
    if (phase !== 'practice' || eyesClosed) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const startedAt = performance.now();
    const timer = window.setInterval(() => {
      setBreathPhase(((performance.now() - startedAt) % BREATH_CYCLE_MS) / BREATH_CYCLE_MS);
    }, 120);
    return () => window.clearInterval(timer);
  }, [phase, eyesClosed]);

  const startAt = (index: number) => {
    lowestStepRef.current = steps[index].step;
    setStepIndex(index);
    setBreathCount(0);
    setPhase('practice');
  };

  const finishSession = () => {
    // Reflection marks are deliberately discarded: nothing leaves this
    // screen except the completion summary below.
    onComplete({
      stepsCompleted: result.stepsCompleted,
      mudraSetUsed: MUDRA_SET_USED,
      endedEarly: result.endedEarly,
    });
  };

  const toggleFactor = (factor: JhanaFactor) => {
    setNoticed((list) =>
      list.includes(factor) ? list.filter((f) => f !== factor) : [...list, factor],
    );
  };

  // ------------------------------------------------------------------
  // Entry choice (post-trigger only)
  // ------------------------------------------------------------------

  if (phase === 'entry') {
    if (eyesClosed) {
      // Audio-only entry choice: same two options as the visual cards.
      return (
        <div className="eyes-closed-veil">
          <button
            type="button"
            className="anp-veil-zone anp-veil-breath"
            onClick={() => startAt(FEELING_ENTRY_INDEX)}
            aria-label="Upper half of the screen — start at step 5, the Feeling tetrad, recommended after the trigger stage"
          >
            <span className="anp-veil-hint" aria-hidden="true">
              upper half — start at step 5
            </span>
          </button>
          <button
            type="button"
            className="anp-veil-zone"
            onClick={() => startAt(0)}
            aria-label="Lower half of the screen — start from step 1 and take the full sixteen-step sequence"
          >
            <span className="anp-veil-hint" aria-hidden="true">
              lower half — start from step 1
            </span>
          </button>
        </div>
      );
    }
    const raptureClause =
      raptureOnsetAt !== null
        ? 'You can use the rapture you just generated as a doorway into the traditional practice — '
        : 'If rapture is with you now, you can use it as a doorway into the traditional practice — ';
    return (
      <div className="screen">
        <header className="stack anp-entry-header">
          <h1>Ānāpānasati</h1>
          <p className="dim">
            Sixteen steps across four tetrads — body, feeling, mind, insight.
            Entirely self-paced; each step lasts as long as you like.
          </p>
        </header>

        <div className="stack">
          <button
            type="button"
            className="card anp-entry-card anp-entry-card-recommended"
            onClick={() => startAt(FEELING_ENTRY_INDEX)}
          >
            <span className="anp-entry-title">Start at step 5 — the Feeling tetrad</span>
            <span className="anp-entry-desc">
              You have already been breathing consciously through the trigger
              stage — the work of the first four steps. {raptureClause}joining
              the sequence where joy itself becomes the object of attention.
            </span>
            <span className="anp-entry-tag">recommended after the trigger stage</span>
          </button>

          <button
            type="button"
            className="card anp-entry-card"
            onClick={() => startAt(0)}
          >
            <span className="anp-entry-title">Start from step 1</span>
            <span className="anp-entry-desc">
              Take the full sequence from the beginning — long breath, short
              breath, whole body, calming — and let the tetrads unfold in
              their traditional order.
            </span>
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Reflection ("Looking back — optional"): reflective and educational,
  // never detection or attainment scoring.
  // ------------------------------------------------------------------

  if (phase === 'reflection') {
    return (
      <div className="screen">
        <header className="stack anp-entry-header">
          <h1>Looking back (optional)</h1>
          <p className="dim">
            If you like, take a quiet moment to recall which of these six
            qualities you remember meeting during the sit. This is private
            reflection to help you learn the territory — it is not detection,
            not a score, and not a measure of attainment. Nothing you mark
            here is saved; it stays on this screen.
          </p>
        </header>

        <div className="stack anp-reflect-list">
          {REFLECTION_FACTORS.map(({ factor, name, gloss }) => {
            const on = noticed.includes(factor);
            return (
              <button
                key={factor}
                type="button"
                className={`card anp-factor${on ? ' anp-factor-on' : ''}`}
                aria-pressed={on}
                onClick={() => toggleFactor(factor)}
              >
                <span className="anp-factor-name">
                  {name}
                  {on && <span className="anp-factor-mark">· noticed</span>}
                </span>
                <span className="anp-factor-gloss">{gloss}</span>
              </button>
            );
          })}
        </div>

        <div className="stack anp-reflect-actions">
          <button type="button" className="btn btn-calm btn-block" onClick={finishSession}>
            Done
          </button>
          <button type="button" className="btn btn-ghost" onClick={finishSession}>
            Skip reflection
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Eyes-closed / audio-only live mode: instruction text hidden (this mode
  // is for practitioners who completed learn-mode and know the sequence).
  // Step changes are announced only by the advance cue.
  // ------------------------------------------------------------------

  if (eyesClosed) {
    return (
      <div className="eyes-closed-veil">
        <button
          type="button"
          className="anp-veil-zone anp-veil-breath"
          onClick={markBreath}
          aria-label="Upper half of the screen — tap to mark one breath cycle, or simply sit"
        >
          <span className="anp-veil-hint" aria-hidden="true">
            upper half — breath
          </span>
        </button>
        <button
          type="button"
          className="anp-veil-zone"
          onClick={advance}
          aria-label={
            onLastStep
              ? 'Lower half of the screen — tap to complete the practice, whenever you are ready'
              : 'Lower half of the screen — tap to move to the next step, whenever you are ready'
          }
        >
          <span className="anp-veil-hint" aria-hidden="true">
            lower half — next step
          </span>
        </button>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Practice screen
  // ------------------------------------------------------------------

  // Eyes soften into closed from the Feeling tetrad onward; the hands stay
  // in a static dhyāna mudrā the whole way.
  const eyeState: EyeState = currentStep.tetrad >= 2 ? 'closed' : 'soft';
  const nextReady = !settings.autoAdvanceSteps && breathCount >= breathsPerStep;

  return (
    <div className="screen anp-practice">
      <header className="top-bar">
        <span className="anp-tetrad-name" key={currentStep.tetradName}>
          Ānāpānasati · {currentStep.tetradName}
        </span>
        <span className="faint">
          step {currentStep.step} / {TOTAL_STEPS}
        </span>
      </header>

      {interstitial !== null ? (
        <button
          type="button"
          className="anp-interstitial"
          onClick={() => setInterstitial(null)}
          aria-label={`Entering the ${interstitial} tetrad — tap anywhere to continue`}
        >
          <span className="anp-interstitial-name">{interstitial}</span>
          <span className="anp-interstitial-hint">a new tetrad — no hurry</span>
        </button>
      ) : (
        <main className="anp-main">
          <div className="anp-figure" aria-hidden="true">
            <SeatedBody
              mudra="dhyana"
              eyeState={eyeState}
              motion="settling"
              breathPhase={breathPhase}
              glowChakra={null}
              transitionMs={4000}
            />
          </div>

          <p className="prompt-text anp-instruction" key={currentStep.step}>
            {currentStep.instruction}
          </p>
          <p className="anp-attention">attention · {currentStep.attentionObject}</p>
        </main>
      )}

      <div className="stack anp-breath-zone">
        <div className="anp-dots" aria-hidden="true">
          {breathsPerStep <= 12 ? (
            Array.from({ length: breathsPerStep }, (_, i) => (
              <span
                key={i}
                className={`anp-dot${i < breathCount ? ' anp-dot-marked' : ''}`}
              />
            ))
          ) : (
            <span className="faint">{breathCount > 0 ? `${breathCount} breaths` : ''}</span>
          )}
        </div>

        <button
          type="button"
          className="anp-breath-tap"
          onClick={markBreath}
          aria-label="Mark one breath cycle — optional. You can also press the space bar, or simply sit."
        >
          <span className="anp-breath-label">breath</span>
          <span className="anp-breath-hint">
            tap (or press space) to mark a cycle — or simply sit
          </span>
        </button>

        <div className="anp-nav">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={goBack}
            disabled={stepIndex === 0}
          >
            back
          </button>
          <button
            type="button"
            className={`btn anp-next${nextReady ? ' anp-next-ready' : ''}`}
            onClick={advance}
          >
            {onLastStep ? 'complete the practice' : 'next step'}
          </button>
        </div>

        <button
          type="button"
          className="btn btn-ghost anp-finish-early"
          onClick={() => completePractice(true)}
        >
          finish early
        </button>
      </div>
    </div>
  );
}
