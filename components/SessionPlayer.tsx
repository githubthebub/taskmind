"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import Link from "next/link";
import type { Stage, Technique } from "@/lib/techniques";
import { CATEGORY_LABELS } from "@/lib/techniques";
import { logSession } from "@/lib/progress";
import { startBinaural, stopBinaural } from "@/lib/audio";
import BreathPacer from "./BreathPacer";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type PlayerState = {
  stageIndex: number;
  secondsLeft: number;
  isPlaying: boolean;
  isComplete: boolean;
};

type PlayerAction = { type: "tick" } | { type: "toggle" } | { type: "skip" } | { type: "restart" };

function initialState(stages: Stage[]): PlayerState {
  return {
    stageIndex: 0,
    secondsLeft: stages[0]?.seconds ?? 0,
    isPlaying: false,
    isComplete: false,
  };
}

function advanceOrComplete(stages: Stage[], stageIndex: number, isPlaying: boolean): PlayerState {
  const nextIndex = stageIndex + 1;
  if (nextIndex < stages.length) {
    return {
      stageIndex: nextIndex,
      secondsLeft: stages[nextIndex].seconds,
      isPlaying,
      isComplete: false,
    };
  }
  return { stageIndex, secondsLeft: 0, isPlaying: false, isComplete: true };
}

function makeReducer(stages: Stage[]) {
  return function reducer(state: PlayerState, action: PlayerAction): PlayerState {
    switch (action.type) {
      case "tick": {
        if (!state.isPlaying || state.isComplete) return state;
        if (state.secondsLeft > 1) {
          return { ...state, secondsLeft: state.secondsLeft - 1 };
        }
        return advanceOrComplete(stages, state.stageIndex, true);
      }
      case "toggle":
        return { ...state, isPlaying: !state.isPlaying };
      case "skip":
        return advanceOrComplete(stages, state.stageIndex, state.isPlaying);
      case "restart":
        return initialState(stages);
      default:
        return state;
    }
  };
}

export default function SessionPlayer({ technique }: { technique: Technique }) {
  const reducer = useMemo(() => makeReducer(technique.stages), [technique.stages]);
  const [state, dispatch] = useReducer(reducer, technique.stages, initialState);
  const { stageIndex, secondsLeft, isPlaying, isComplete } = state;

  const [ambienceOn, setAmbienceOn] = useState(false);
  const hasLoggedRef = useRef(false);

  const stage = technique.stages[stageIndex];
  const totalSeconds = useMemo(
    () => technique.stages.reduce((sum, s) => sum + s.seconds, 0),
    [technique]
  );
  const elapsedSeconds = useMemo(() => {
    const priorStages = technique.stages.slice(0, stageIndex).reduce((sum, s) => sum + s.seconds, 0);
    return priorStages + ((stage?.seconds ?? 0) - secondsLeft);
  }, [technique, stageIndex, stage, secondsLeft]);

  // Countdown ticker — the only place that mutates player state on a timer,
  // via dispatch inside the interval callback (not the effect body itself).
  useEffect(() => {
    if (!isPlaying || isComplete) return;
    const interval = setInterval(() => {
      dispatch({ type: "tick" });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isComplete]);

  // Log completion once, and stop any ambience. This effect only touches
  // external systems (localStorage, Web Audio) directly; the one React
  // setState call is guarded by a ref so it fires at most once per session.
  useEffect(() => {
    if (!isComplete || hasLoggedRef.current) return;
    hasLoggedRef.current = true;
    logSession({
      techniqueId: technique.id,
      durationMinutes: technique.durationMinutes,
    });
    stopBinaural();
    setAmbienceOn(false);
  }, [isComplete, technique]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopBinaural();
    };
  }, []);

  function handlePlayPause() {
    dispatch({ type: "toggle" });
  }

  function handleSkip() {
    dispatch({ type: "skip" });
  }

  function handleRestart() {
    dispatch({ type: "restart" });
    hasLoggedRef.current = false;
  }

  function toggleAmbience() {
    if (ambienceOn) {
      stopBinaural();
      setAmbienceOn(false);
    } else {
      // 200Hz base with a 6Hz beat sits in a calm "theta" range, kept subtle.
      startBinaural(200, 6);
      setAmbienceOn(true);
    }
  }

  const progressPct = totalSeconds > 0 ? Math.min(100, (elapsedSeconds / totalSeconds) * 100) : 0;

  if (isComplete) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 rounded-3xl border border-teal-800/40 bg-teal-950/20 px-8 py-16 text-center">
        <span className="text-4xl">✦</span>
        <h1 className="text-2xl font-semibold text-teal-50">Session complete</h1>
        <p className="text-teal-200/70">
          You completed <span className="text-teal-100">{technique.title}</span> —{" "}
          {technique.durationMinutes} minutes. Take a moment before you move on.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleRestart}
            className="rounded-full border border-teal-700/50 px-5 py-2 text-sm text-teal-100 transition hover:bg-teal-900/40"
          >
            Practice again
          </button>
          <Link
            href="/progress"
            className="rounded-full bg-teal-500/90 px-5 py-2 text-sm font-medium text-teal-950 transition hover:bg-teal-400"
          >
            View progress
          </Link>
          <Link
            href="/"
            className="rounded-full border border-teal-700/50 px-5 py-2 text-sm text-teal-100 transition hover:bg-teal-900/40"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 px-4 py-10">
      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-teal-300/60">
        <span>{CATEGORY_LABELS[technique.category]}</span>
        <span>
          Stage {stageIndex + 1} / {technique.stages.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-teal-50">{technique.title}</h1>
        <p className="text-sm text-teal-200/60">{stage?.label}</p>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-teal-900/40">
        <div
          className="h-full rounded-full bg-teal-400/80 transition-all duration-1000 ease-linear"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="rounded-3xl border border-teal-800/30 bg-teal-950/20 px-6 py-8">
        <p className="text-lg leading-relaxed text-teal-50/90">{stage?.instruction}</p>

        {stage?.breathPattern && (
          <BreathPacer key={stageIndex} breathPattern={stage.breathPattern} paused={!isPlaying} />
        )}

        <div className="mt-6 text-center text-3xl font-light tabular-nums text-teal-100">
          {formatTime(secondsLeft)}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handlePlayPause}
          className="rounded-full bg-teal-500/90 px-8 py-3 text-sm font-medium text-teal-950 transition hover:bg-teal-400"
        >
          {isPlaying ? "Pause" : stageIndex === 0 && secondsLeft === stage?.seconds ? "Begin" : "Resume"}
        </button>
        <button
          onClick={handleSkip}
          className="rounded-full border border-teal-700/50 px-6 py-3 text-sm text-teal-100 transition hover:bg-teal-900/40"
        >
          Skip
        </button>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={toggleAmbience}
          className={`rounded-full border px-4 py-1.5 text-xs transition ${
            ambienceOn
              ? "border-teal-400/60 bg-teal-500/20 text-teal-100"
              : "border-teal-800/40 text-teal-300/60 hover:bg-teal-900/30"
          }`}
        >
          {ambienceOn ? "Binaural ambience: on" : "Binaural ambience: off"}
        </button>
      </div>
    </div>
  );
}
