import { useEffect, useRef } from 'react';
import type { TriggerOutcome, TriggerStageProps, TriggerTechnique } from '../types';
import { useTriggerEngine } from '../engine/triggerEngine';
import FaceBlob from './figure/FaceBlob';
import './trigger.css';

/**
 * Stage 0 screen: paced bhastrika/tummo rounds with open-ended kumbhaka.
 *
 * The "Rapture Onset" button is a USER SELF-REPORT tap — the copy below says
 * so explicitly, and nothing on this screen claims to detect any state.
 * There are no countdowns, no alarms, and nothing auto-escalates.
 */

const TECHNIQUE_COPY: Record<TriggerTechnique, { name: string; how: string }> = {
  bhastrika: {
    name: 'Bhastrika',
    how: 'Bellows breath — quick, even breaths in and out through the nose, shoulders soft, belly doing the work.',
  },
  tummo: {
    name: 'Tummo',
    how: 'Inner-fire breath — deep, full breaths at an unhurried pace, letting each exhale simply fall away.',
  },
};

export default function TriggerStage({
  settings,
  sound,
  onComplete,
  onAbort,
}: TriggerStageProps) {
  const trigger = settings.trigger;
  const copy = TECHNIQUE_COPY[trigger.technique];
  const engine = useTriggerEngine(trigger, sound, {
    maxRoundsBeforePrompt: settings.maxRoundsBeforePrompt,
  });

  const handleRaptureTap = () => {
    // Self-report timestamp; the engine stops pacing and plays the
    // ignition-confirmed cue, then hands the tap time back.
    const raptureOnsetAt = engine.reportRaptureOnset();
    const outcome: TriggerOutcome = {
      raptureOnsetAt,
      roundsCompleted: engine.roundsCompleted,
      skippedToSettle: false,
    };
    onComplete(outcome);
  };

  const handleSkipToSettle = () => {
    engine.stop();
    onComplete({
      raptureOnsetAt: null,
      roundsCompleted: engine.roundsCompleted,
      skippedToSettle: true,
    });
  };

  const handleEnd = () => {
    engine.stop();
    onAbort({
      raptureOnsetAt: null,
      roundsCompleted: engine.roundsCompleted,
      skippedToSettle: false,
    });
  };

  // Keyboard self-reports, so desktop practice works with eyes closed:
  // Space = Rapture Onset (live once the session has started), Enter =
  // release the hold. Focused buttons keep their native key handling —
  // we only act when the key would otherwise do nothing.
  const keyHandlersRef = useRef({ handleRaptureTap, release: engine.releaseRetention, phase: engine.phase });
  keyHandlersRef.current = { handleRaptureTap, release: engine.releaseRetention, phase: engine.phase };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest('button, input, select, textarea, a')) return;
      const { handleRaptureTap: tap, release, phase } = keyHandlersRef.current;
      if (phase === 'idle') return;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        tap();
      } else if (e.key === 'Enter' && phase === 'retention') {
        e.preventDefault();
        release();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const roundLabel =
    engine.round === 0
      ? `${trigger.rounds} round${trigger.rounds === 1 ? '' : 's'}`
      : engine.round <= trigger.rounds
        ? `round ${engine.round} of ${trigger.rounds}`
        : `round ${engine.round}`;

  const currentBreath = Math.min(engine.breathIndex + 1, trigger.breathsPerRound);

  return (
    <div className="screen trigger-stage">
      <header className="top-bar">
        <span>{copy.name}</span>
        <span>{roundLabel}</span>
        <button type="button" className="btn btn-ghost" onClick={handleEnd}>
          End session
        </button>
      </header>

      <main className="trigger-main">
        {engine.phase === 'idle' && (
          <div className="card stack trigger-intro">
            <div className="trigger-buddy trigger-buddy-small" aria-hidden="true">
              <FaceBlob eyeState="open" calm={0.3} mood="happy" />
            </div>
            <h2>{copy.name}</h2>
            <p className="dim">{copy.how}</p>
            <p className="faint">
              {trigger.rounds} round{trigger.rounds === 1 ? '' : 's'} of{' '}
              {trigger.breathsPerRound} breaths
              {trigger.retentionAfterRound
                ? ', each ending in an open hold that you release whenever you choose'
                : ''}
              . Nothing here is timed against you.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-block trigger-big"
              onClick={engine.start}
            >
              Begin
            </button>
          </div>
        )}

        {engine.phase === 'breathing' && (
          <div className="trigger-visual">
            <div className="trigger-buddy-ring">
              <div
                className="trigger-pulse"
                style={{ animationDuration: `${60 / engine.bpm}s` }}
                aria-hidden="true"
              />
              <div className="trigger-buddy" aria-hidden="true">
                <FaceBlob eyeState="soft" calm={0.2} mood="neutral" breathBpm={engine.bpm} />
              </div>
            </div>
            <p className="prompt-text dim">Breathe together — it&rsquo;s keeping pace with you.</p>
            <p className="faint trigger-breath-count">
              breath {currentBreath} of {trigger.breathsPerRound}
            </p>
          </div>
        )}

        {engine.phase === 'retention' && (
          <div className="trigger-visual">
            <div className="trigger-buddy-ring">
              <div className="trigger-glow" aria-hidden="true" />
              <div className="trigger-buddy" aria-hidden="true">
                <FaceBlob eyeState="closed" calm={0.6} mood="holding" />
              </div>
            </div>
            <p className="prompt-text">Hold, softly. Empty, and at ease.</p>
            {engine.softCapReached && (
              <p className="trigger-softcap">Whenever you&rsquo;re ready, let it go.</p>
            )}
            <button
              type="button"
              className="btn btn-calm trigger-release"
              onClick={engine.releaseRetention}
              aria-keyshortcuts="Enter"
            >
              Release
            </button>
          </div>
        )}

        {engine.phase === 'between-rounds' && (
          <div className="trigger-visual">
            <div className="trigger-buddy-ring">
              <div className="trigger-glow trigger-glow-dim" aria-hidden="true" />
              <div className="trigger-buddy" aria-hidden="true">
                <FaceBlob eyeState="soft" calm={0.7} mood="serene" />
              </div>
            </div>
            <p className="prompt-text dim">Let the breath find its own way back.</p>
          </div>
        )}

        {engine.phase === 'awaiting-choice' && (
          <div className="card stack trigger-choice">
            <div className="trigger-buddy trigger-buddy-small" aria-hidden="true">
              <FaceBlob eyeState="open" calm={0.4} mood="happy" />
            </div>
            <p className="prompt-text">
              That&rsquo;s {engine.roundsCompleted} round
              {engine.roundsCompleted === 1 ? '' : 's'} — well sat.
            </p>
            <p className="dim">
              Nothing needs to have happened yet — this often takes its own time.
              What would feel right?
            </p>
            <button
              type="button"
              className="btn btn-primary btn-block trigger-big"
              onClick={engine.continueRounds}
            >
              Keep going
            </button>
            <button
              type="button"
              className="btn btn-block trigger-big"
              onClick={handleEnd}
            >
              Take a break
            </button>
            <button
              type="button"
              className="btn btn-calm btn-block trigger-big"
              onClick={handleSkipToSettle}
            >
              Skip to settling anyway
            </button>
          </div>
        )}
      </main>

      <div className="stack trigger-tap-zone">
        <button
          type="button"
          className="tap-report"
          onClick={handleRaptureTap}
          aria-keyshortcuts="Space"
        >
          <span className="trigger-tap-label">Rapture Onset</span>
          <span className="trigger-tap-hint">
            Tap when you feel warmth, tingling, waves, or the mind loosening —
            don&rsquo;t wait for anything dramatic.
          </span>
        </button>
        <p className="faint trigger-selfreport-note">
          A self-report, nothing more — only you can know. Nothing here measures
          your body.
          {engine.phase !== 'idle' && (
            <span className="trigger-key-hint">
              {' '}
              With a keyboard: Space marks it, Enter releases the hold — no
              need to look.
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
