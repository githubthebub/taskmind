import { useCallback, useEffect, useRef, useState } from 'react';
import type { SoundEngine, TriggerConfig, TriggerEvent } from '../types';
import { BHASTRIKA_BPM, SOFT_RETENTION_CAP_SECONDS, TUMMO_BPM } from '../constants';

/**
 * Stage 0 trigger engine — drives paced breath rounds + open-ended kumbhaka.
 *
 * Safety invariants (see constants.AUTO_ESCALATION_ALLOWED):
 *  - Retention is OPEN-ENDED. The user releases it; nothing auto-releases,
 *    nothing counts down, nothing escalates duration or tempo.
 *  - The soft cap is a single gentle cue + a flag the UI turns into one quiet
 *    "release when you're ready" line. It is never an alarm.
 *  - Rounds never loop silently forever: after `maxRoundsBeforePrompt`
 *    tap-less rounds (and when the configured round count is reached) the
 *    engine pauses in 'awaiting-choice' and waits for the user.
 *  - "Rapture Onset" is a user SELF-REPORT tap. The engine only records the
 *    timestamp the user provides by tapping; it detects nothing.
 */

export type TriggerPhase =
  | 'idle'
  | 'breathing'
  | 'retention'
  | 'between-rounds'
  | 'awaiting-choice';

/** Gentle recovery pause between rounds. Fixed — never shown as a countdown. */
const BETWEEN_ROUNDS_MS = 6000;

/** How often the coarse elapsed-ms ticker updates (display is never a timer). */
const TICK_MS = 500;

export interface TriggerEngineCallbacks {
  /**
   * After this many consecutive tap-less rounds the engine pauses in
   * 'awaiting-choice' so the UI can offer keep-going / break / skip.
   */
  maxRoundsBeforePrompt: number;
  /** Observe engine events (round-start, retention start/release, rapture tap). */
  onEvent?: (event: TriggerEvent) => void;
}

export interface TriggerEngine {
  phase: TriggerPhase;
  /** 1-based round currently underway (or most recently completed); 0 before start. */
  round: number;
  roundsCompleted: number;
  /** Breaths completed so far in the current round (0..breathsPerRound). */
  breathIndex: number;
  /** True once the soft retention cap has passed during the current hold. */
  softCapReached: boolean;
  /** Coarse ms since start(). Exposed for logging — never render it as a timer. */
  elapsedMs: number;
  /** Pacing tempo for the configured technique, breaths per minute. */
  bpm: number;
  /** Every TriggerEvent recorded this session, in order. */
  events: TriggerEvent[];
  /** Begin round 1. Call from a user gesture so the AudioContext can unlock. */
  start: () => void;
  /** User releases the kumbhaka hold. No-op outside 'retention'. */
  releaseRetention: () => void;
  /** User chose "keep going" from 'awaiting-choice'. */
  continueRounds: () => void;
  /**
   * Record the user's Rapture Onset SELF-REPORT tap: stops pacing and timers,
   * plays the ignition-confirmed cue, records the event, and returns the
   * tap timestamp (epoch ms). Valid from any phase — the tap is always live.
   */
  reportRaptureOnset: () => number;
  /** Stop all pacing and timers (abort / skip). Safe to call in any phase. */
  stop: () => void;
}

export function useTriggerEngine(
  config: TriggerConfig,
  sound: SoundEngine,
  callbacks: TriggerEngineCallbacks,
): TriggerEngine {
  const [phase, setPhaseState] = useState<TriggerPhase>('idle');
  const [round, setRound] = useState(0);
  const [breathIndex, setBreathIndex] = useState(0);
  const [roundsCompleted, setRoundsCompletedState] = useState(0);
  const [softCapReached, setSoftCapReached] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Latest-value refs so the stable timer callbacks never read stale props.
  const configRef = useRef(config);
  configRef.current = config;
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const phaseRef = useRef<TriggerPhase>('idle');
  const breathCountRef = useRef(0);
  const roundsCompletedRef = useRef(0);
  const roundsSincePromptRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);
  const eventsRef = useRef<TriggerEvent[]>([]);

  const breathTimerRef = useRef<number | null>(null);
  const pauseTimerRef = useRef<number | null>(null);
  const softCapTimerRef = useRef<number | null>(null);
  const tickerRef = useRef<number | null>(null);
  // Breaks the beginRound <-> finishRound definition cycle.
  const beginRoundRef = useRef<(roundNumber: number) => void>(() => {});

  const bpm =
    config.technique === 'tummo' ? TUMMO_BPM.default : BHASTRIKA_BPM.default;

  const setPhase = useCallback((next: TriggerPhase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const emit = useCallback((event: TriggerEvent) => {
    eventsRef.current.push(event);
    callbacksRef.current.onEvent?.(event);
  }, []);

  const clearAllTimers = useCallback(() => {
    if (breathTimerRef.current !== null) {
      window.clearInterval(breathTimerRef.current);
      breathTimerRef.current = null;
    }
    if (pauseTimerRef.current !== null) {
      window.clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    if (softCapTimerRef.current !== null) {
      window.clearTimeout(softCapTimerRef.current);
      softCapTimerRef.current = null;
    }
    if (tickerRef.current !== null) {
      window.clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  }, []);

  /** A round is done (retention released, or no retention configured). */
  const finishRound = useCallback(() => {
    const completed = roundsCompletedRef.current + 1;
    roundsCompletedRef.current = completed;
    setRoundsCompletedState(completed);
    roundsSincePromptRef.current += 1;

    const promptEvery = Math.max(1, callbacksRef.current.maxRoundsBeforePrompt);
    // Pause for the user's choice after N tap-less rounds, and when the
    // configured round count is first reached. Never silently loop forever.
    const shouldPause =
      roundsSincePromptRef.current >= promptEvery ||
      completed === configRef.current.rounds;

    if (shouldPause) {
      roundsSincePromptRef.current = 0;
      setPhase('awaiting-choice');
    } else {
      setPhase('between-rounds');
      pauseTimerRef.current = window.setTimeout(() => {
        pauseTimerRef.current = null;
        beginRoundRef.current(completed + 1);
      }, BETWEEN_ROUNDS_MS);
    }
  }, [setPhase]);

  const enterRetention = useCallback(() => {
    setSoftCapReached(false);
    setPhase('retention');
    emit({ type: 'retention-start' });
    soundRef.current.play('cue-retention-start');
    // Soft cap: one gentle cue + a flag. The hold stays open-ended — only the
    // user's releaseRetention() ends it. No countdown, no auto-release.
    softCapTimerRef.current = window.setTimeout(() => {
      softCapTimerRef.current = null;
      setSoftCapReached(true);
      soundRef.current.play('cue-retention-soft-cap');
    }, SOFT_RETENTION_CAP_SECONDS * 1000);
  }, [emit, setPhase]);

  const beginRound = useCallback(
    (roundNumber: number) => {
      const cfg = configRef.current;
      const tempo =
        cfg.technique === 'tummo' ? TUMMO_BPM.default : BHASTRIKA_BPM.default;

      breathCountRef.current = 0;
      setBreathIndex(0);
      setRound(roundNumber);
      setPhase('breathing');
      emit({ type: 'round-start', round: roundNumber });
      soundRef.current.play('cue-round-start');
      soundRef.current.startPacing(tempo);

      breathTimerRef.current = window.setInterval(() => {
        breathCountRef.current += 1;
        setBreathIndex(breathCountRef.current);
        if (breathCountRef.current >= cfg.breathsPerRound) {
          if (breathTimerRef.current !== null) {
            window.clearInterval(breathTimerRef.current);
            breathTimerRef.current = null;
          }
          // Final exhale of the round.
          soundRef.current.stopPacing();
          if (cfg.retentionAfterRound) {
            enterRetention();
          } else {
            finishRound();
          }
        }
      }, 60000 / tempo);
    },
    [emit, enterRetention, finishRound, setPhase],
  );
  beginRoundRef.current = beginRound;

  const start = useCallback(() => {
    if (phaseRef.current !== 'idle' || startedAtRef.current !== null) return;
    const startedAt = Date.now();
    startedAtRef.current = startedAt;
    // Unlock the AudioContext — start() is invoked from a user gesture.
    void soundRef.current.resume();
    tickerRef.current = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, TICK_MS);
    beginRound(1);
  }, [beginRound]);

  const releaseRetention = useCallback(() => {
    if (phaseRef.current !== 'retention') return;
    if (softCapTimerRef.current !== null) {
      window.clearTimeout(softCapTimerRef.current);
      softCapTimerRef.current = null;
    }
    setSoftCapReached(false);
    emit({ type: 'retention-release' });
    soundRef.current.play('cue-retention-release');
    finishRound();
  }, [emit, finishRound]);

  const continueRounds = useCallback(() => {
    if (phaseRef.current !== 'awaiting-choice') return;
    beginRound(roundsCompletedRef.current + 1);
  }, [beginRound]);

  const reportRaptureOnset = useCallback((): number => {
    const timestamp = Date.now();
    clearAllTimers();
    soundRef.current.stopPacing();
    soundRef.current.play('cue-rapture-onset');
    emit({ type: 'rapture-onset-tap', timestamp });
    setPhase('idle');
    return timestamp;
  }, [clearAllTimers, emit, setPhase]);

  const stop = useCallback(() => {
    clearAllTimers();
    soundRef.current.stopPacing();
    setSoftCapReached(false);
    setPhase('idle');
  }, [clearAllTimers, setPhase]);

  // Unmount cleanup: silence pacing and drop every pending timer.
  useEffect(() => {
    return () => {
      if (breathTimerRef.current !== null) window.clearInterval(breathTimerRef.current);
      if (pauseTimerRef.current !== null) window.clearTimeout(pauseTimerRef.current);
      if (softCapTimerRef.current !== null) window.clearTimeout(softCapTimerRef.current);
      if (tickerRef.current !== null) window.clearInterval(tickerRef.current);
      soundRef.current.stopPacing();
    };
  }, []);

  return {
    phase,
    round,
    roundsCompleted,
    breathIndex,
    softCapReached,
    elapsedMs,
    bpm,
    events: eventsRef.current,
    start,
    releaseRetention,
    continueRounds,
    reportRaptureOnset,
    stop,
  };
}

export default useTriggerEngine;
