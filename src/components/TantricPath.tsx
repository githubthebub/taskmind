import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  Bandha,
  BandhaStep,
  ChakraId,
  ComboCorrespondence,
  FigureMotion,
  MudraId,
  PathScreenProps,
  TantricStage,
} from '../types';
import {
  advancedMudraChains,
  bandhaSteps,
  chakras,
  tantricStageSequence,
} from '../data/tantric';
import { mudraShapes } from '../data/mudras';
import SeatedBody from './figure/SeatedBody';
import './path-cd.css';

/**
 * Path C — Extended Tantric (also the engine for Path D, Combo).
 *
 * Enters directly at "Lock & Rise": Stage 0 (bhastrika/tummo + kumbhaka)
 * already provided the ignition, so there is no standalone trigger stage here.
 *
 * FRAMING (product constraint): every chakra/bandha reference on this screen
 * is traditional-practice framing — "in the tradition, this seals the risen
 * energy" — never a physiological claim, and nothing here detects or measures
 * any state. All pacing is the user's own.
 *
 * SAFETY INVARIANT: bandha holds and breath retentions never auto-escalate.
 * Locks are engaged only on a user-initiated stage entry and released by the
 * user moving on; the optional soft dwell below never drifts INTO a bandha
 * stage. There are no countdowns and no alarms.
 */

export type TantricPathProps = PathScreenProps & {
  /** Path D: per-stage tetrad / jhāna-factor annotations. */
  correspondences?: ComboCorrespondence[];
  /** Path D: dismissible personal-synthesis framing note shown at the top. */
  framing?: string;
};

/**
 * Expand a stage's bandha into its concrete lock steps, ALWAYS sorted into the
 * traditional engagement order (jalandhara -> uddiyana -> mula, via the
 * engagementOrder field) so no data ordering can violate the sequence.
 * 'maha' — the great lock — combines all three.
 */
export function engagedLocks(bandha: Bandha | null): BandhaStep[] {
  if (bandha === null) return [];
  const locks =
    bandha === 'maha' ? [...bandhaSteps] : bandhaSteps.filter((s) => s.bandha === bandha);
  return locks.sort((a, b) => a.engagementOrder - b.engagementOrder);
}

/** Release order is strictly the reverse of engagement order. */
export function releaseLocks(bandha: Bandha | null): BandhaStep[] {
  return engagedLocks(bandha).reverse();
}

/**
 * The mudras cycled within a stage: the stage's single base mudra, or — when
 * the user has opted in AND earned the tier through practice (never payment) —
 * the advanced chain for that tier and stage.
 */
function mudraChainFor(
  stage: TantricStage,
  advancedEnabled: boolean,
  tier: number,
): MudraId[] {
  if (advancedEnabled && tier >= 2) {
    const tierKey = (tier >= 3 ? 3 : 2) as 2 | 3;
    const chain = advancedMudraChains[tierKey][stage.stage];
    if (chain && chain.length > 0) return chain;
  }
  return [stage.mudra];
}

/** Generous optional dwell before a soft stage drift (never shown, never a
 *  countdown; the manual continue tap always works sooner). */
const STAGE_DWELL_MS = 120_000;
/** Gentle dwell between mudras in an advanced chain. */
const MUDRA_DWELL_MS = 45_000;

const LAST_STAGE_INDEX = tantricStageSequence.length - 1;

export default function TantricPath({
  settings,
  progression,
  sound,
  eyesClosed,
  onComplete,
  correspondences,
  framing,
}: TantricPathProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [chainIndex, setChainIndex] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [framingDismissed, setFramingDismissed] = useState(false);

  const stage = tantricStageSequence[Math.min(stageIndex, LAST_STAGE_INDEX)];
  const isLastStage = stageIndex >= LAST_STAGE_INDEX;

  const brisk = settings.cueTempo === 'brisk';
  /** 'brisk' cue tempo = shorter mudra morphs and tighter cue spacing. */
  const transitionMs = brisk ? 1200 : 2600;
  const mudraCueDelayMs = brisk ? 200 : 450;
  const bandhaCueGapMs = brisk ? 400 : 900;

  const chain = useMemo(
    () => mudraChainFor(stage, settings.advancedMudraChains, progression.mudraTier),
    [stage, settings.advancedMudraChains, progression.mudraTier],
  );
  const mudra = chain[chainIndex % chain.length];
  const shape = mudraShapes[mudra];
  const locks = useMemo(() => engagedLocks(stage.bandha), [stage.bandha]);
  const releases = useMemo(() => releaseLocks(stage.bandha), [stage.bandha]);
  const chakra = chakras.find((c) => c.id === stage.chakra);
  const correspondence: ComboCorrespondence | undefined = correspondences?.find(
    (c) => c.stage === stage.stage,
  );

  /** Distinct mudras actually shown, in first-use order (for the session log). */
  const usedMudrasRef = useRef<MudraId[]>([]);
  const mudraSetUsed = () => usedMudrasRef.current.join(', ');

  // --- Cues -----------------------------------------------------------------
  // All change announcements live in effects, so in eyes-closed mode the
  // distinct cues alone carry the bandha/chakra/mudra transitions.

  // Chakra target: play the shift cue whenever the target changes (including
  // arriving at the first stage). Bandha engagement cues follow, spaced out
  // and in the traditional engagement order.
  const prevChakraRef = useRef<ChakraId | null>(null);
  useEffect(() => {
    if (prevChakraRef.current !== stage.chakra) {
      prevChakraRef.current = stage.chakra;
      sound.play('cue-chakra-shift');
    }
    const timers = locks.map((lock, i) =>
      window.setTimeout(
        () => sound.play(`cue-bandha-${lock.bandha}`),
        (i + 1) * bandhaCueGapMs,
      ),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [stageIndex, stage.chakra, locks, sound, bandhaCueGapMs]);

  // Mudra: record usage and play its cue on every transition (slightly after
  // any chakra cue so the two stay distinct to a closed-eyed listener).
  const prevMudraRef = useRef<MudraId | null>(null);
  useEffect(() => {
    if (!usedMudrasRef.current.includes(mudra)) usedMudrasRef.current.push(mudra);
    if (prevMudraRef.current === mudra) return;
    prevMudraRef.current = mudra;
    const t = window.setTimeout(() => sound.play(`cue-mudra-${mudra}`), mudraCueDelayMs);
    return () => window.clearTimeout(t);
  }, [mudra, sound, mudraCueDelayMs]);

  // Advanced chains cycle within the stage on a gentle timer; the manual
  // "next mudra" tap always works sooner and resets the timer.
  useEffect(() => {
    if (completing || chain.length <= 1) return;
    const t = window.setTimeout(
      () => setChainIndex((i) => (i + 1) % chain.length),
      MUDRA_DWELL_MS,
    );
    return () => window.clearTimeout(t);
  }, [chainIndex, chain, completing]);

  // Optional soft dwell: after a generous, never-shown interval, drift to the
  // next stage — but ONLY if that stage has no bandha. Engaging a lock is
  // always user-initiated (nothing auto-escalates), and nothing auto-completes.
  useEffect(() => {
    if (completing) return;
    const next = tantricStageSequence[stageIndex + 1];
    if (!next || next.bandha !== null) return;
    const t = window.setTimeout(() => {
      setStageIndex((i) => Math.min(i + 1, LAST_STAGE_INDEX));
      setChainIndex(0);
    }, STAGE_DWELL_MS);
    return () => window.clearTimeout(t);
  }, [stageIndex, completing]);

  // --- Navigation -----------------------------------------------------------

  const goToStage = (index: number) => {
    setStageIndex(Math.max(0, Math.min(index, LAST_STAGE_INDEX)));
    setChainIndex(0);
  };

  const nextMudra = () => setChainIndex((i) => (i + 1) % chain.length);

  const startCompletion = () => {
    sound.play('cue-session-complete');
    setCompleting(true);
  };

  const handleContinue = () => {
    if (isLastStage) startCompletion();
    else goToStage(stageIndex + 1);
  };

  const closeSession = () => {
    onComplete({
      stagesCompleted: tantricStageSequence.length,
      mudraSetUsed: mudraSetUsed(),
      endedEarly: false,
    });
  };

  const handleEndHere = () => {
    if (completing) {
      closeSession();
      return;
    }
    onComplete({
      // Stages fully passed through; the current stage is not counted.
      stagesCompleted: stageIndex,
      mudraSetUsed: mudraSetUsed(),
      endedEarly: true,
    });
  };

  // --- Eyes-closed / audio-only live mode ------------------------------------
  // Near-black veil; every change is announced purely by its distinct cue.
  // The whole screen advances: next mudra in the chain first, then the next
  // stage, then the quiet completion. A thin bottom strip ends the session.

  if (eyesClosed) {
    const veilAdvance = () => {
      if (completing) {
        closeSession();
        return;
      }
      if (chain.length > 1 && chainIndex < chain.length - 1) {
        setChainIndex(chainIndex + 1);
        return;
      }
      if (isLastStage) {
        startCompletion();
        return;
      }
      goToStage(stageIndex + 1);
    };

    const advanceLabel = completing
      ? 'The sequence is complete. Tap anywhere to close the session, whenever you are ready.'
      : chain.length > 1 && chainIndex < chain.length - 1
        ? 'Tap anywhere to move to the next mudra in the chain, whenever you are ready.'
        : isLastStage
          ? 'Tap anywhere to complete the sequence, whenever you are ready.'
          : 'Tap anywhere to move to the next stage, whenever you are ready.';

    return (
      <div className="eyes-closed-veil tantric-veil">
        <button
          type="button"
          className="tantric-veil-advance"
          onClick={veilAdvance}
          aria-label={advanceLabel}
        >
          <span className="tantric-veil-hint" aria-hidden="true">
            tap anywhere — next
          </span>
        </button>
        <button
          type="button"
          className="tantric-veil-end"
          onClick={handleEndHere}
          aria-label="Bottom edge of the screen — end the session here"
        >
          <span className="tantric-veil-hint" aria-hidden="true">
            end here
          </span>
        </button>
      </div>
    );
  }

  // --- Quiet completion moment ------------------------------------------------

  if (completing) {
    return (
      <div className="screen screen-centered tantric-complete">
        <div className="tantric-figure tantric-complete-figure" aria-hidden="true">
          <SeatedBody
            mudra={mudra}
            eyeState="closed"
            motion="still"
            glowChakra={null}
            transitionMs={transitionMs}
          />
        </div>
        <p className="prompt-text">
          The sequence is complete. Rest here as long as you like — nothing is
          waiting.
        </p>
        <button type="button" className="btn btn-calm tantric-close" onClick={closeSession}>
          Close session
        </button>
      </div>
    );
  }

  // --- Standard visual mode ----------------------------------------------------

  const motion: FigureMotion = stageIndex === 0 ? 'settling' : 'still';

  return (
    <div className="screen tantric-path">
      <header className="top-bar">
        <span>Tantric sequence</span>
        <span className="faint">
          stage {stage.stage} of {tantricStageSequence.length} · self-paced
        </span>
      </header>

      {framing && !framingDismissed && (
        <aside className="card framing-note">
          <p className="dim framing-text">{framing}</p>
          <button
            type="button"
            className="btn btn-ghost framing-dismiss"
            onClick={() => setFramingDismissed(true)}
          >
            Dismiss
          </button>
        </aside>
      )}

      <main className="tantric-main">
        <h2 className="tantric-stage-name">{stage.name}</h2>

        <div className="tantric-figure" aria-hidden="true">
          <SeatedBody
            mudra={mudra}
            eyeState={stage.eyeState}
            motion={motion}
            glowChakra={stage.chakra}
            transitionMs={transitionMs}
          />
        </div>

        {chakra && (
          <p className="chakra-label">
            {chakra.sanskritName} — {chakra.name} center, at the {chakra.location}
          </p>
        )}

        <p className="prompt-text">{stage.guidance}</p>

        <div className="stack tantric-mudra-block">
          <p className="faint mudra-name">
            {shape.sanskritName} · {shape.name}
            {chain.length > 1 && ` · ${(chainIndex % chain.length) + 1} of ${chain.length} in the chain`}
          </p>
          {chain.length > 1 && (
            <button type="button" className="btn tantric-next-mudra" onClick={nextMudra}>
              Next mudra when ready
            </button>
          )}
        </div>

        {locks.length > 0 && (
          <section className="card bandha-panel">
            <h3>{locks.length > 1 ? 'The locks, in traditional order' : 'The lock'}</h3>
            <div className="stack bandha-steps">
              {locks.map((lock, i) => (
                <div key={lock.bandha} className="bandha-step">
                  {locks.length > 1 && (
                    <span className="faint bandha-order">{i + 1}.</span>
                  )}
                  <div className="bandha-step-text">
                    <p className="bandha-name">{lock.name}</p>
                    <p className="dim bandha-desc">{lock.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {locks.length > 1 && (
              <p className="faint bandha-release-note">
                Release in the reverse order, gently:{' '}
                {releases.map((l) => l.name.split(' ')[0]).join(', then ')}.
              </p>
            )}
            <p className="faint bandha-hold-note">
              In the tradition, the lock seals the risen energy. Engage only as
              firmly as feels easeful, and hold only as long as you choose —
              like the retention, it is yours to release. Nothing here times or
              deepens the hold.
            </p>
          </section>
        )}

        {correspondence && (
          <aside className="card corr-panel">
            <div className="row-between corr-head">
              <span className="faint">correspondence</span>
              <span
                className={
                  correspondence.genuine
                    ? 'corr-badge corr-badge-shared'
                    : 'corr-badge corr-badge-personal'
                }
              >
                {correspondence.genuine ? 'shared language' : 'personal synthesis'}
              </span>
            </div>
            {correspondence.tetradNote && (
              <p className="corr-note">{correspondence.tetradNote}</p>
            )}
            {correspondence.jhanaFactorNote && (
              <p className="dim corr-note">{correspondence.jhanaFactorNote}</p>
            )}
          </aside>
        )}
      </main>

      <footer className="stack tantric-footer">
        <button
          type="button"
          className="btn btn-calm btn-block tantric-continue"
          onClick={handleContinue}
        >
          {isLastStage ? 'Complete the sequence' : 'Continue when ready'}
        </button>
        <div className="row tantric-footer-row">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => goToStage(stageIndex - 1)}
            disabled={stageIndex === 0}
          >
            Back
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleEndHere}>
            End here
          </button>
        </div>
        <p className="faint tantric-selfnote">
          Every step here is paced by you. The app never times, measures, or
          detects anything — the traditional framings above are practice
          language, not physiological claims.
        </p>
      </footer>
    </div>
  );
}
