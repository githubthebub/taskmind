"use client";

import { useEffect, useMemo, useState } from "react";
import type { Stage } from "@/lib/techniques";

type Phase = "inhale" | "hold" | "exhale" | "holdEmpty";

const PHASE_LABEL: Record<Phase, string> = {
  inhale: "Inhale",
  hold: "Hold",
  exhale: "Exhale",
  holdEmpty: "Hold",
};

// Scale factor for the circle at each phase. Inhale grows to 1, exhale shrinks to a resting size.
const PHASE_SCALE: Record<Phase, number> = {
  inhale: 1,
  hold: 1,
  exhale: 0.55,
  holdEmpty: 0.55,
};

type PhaseStep = { phase: Phase; seconds: number };

function buildCycle(pattern: NonNullable<Stage["breathPattern"]>): PhaseStep[] {
  const steps: PhaseStep[] = [{ phase: "inhale", seconds: pattern.inhale }];
  if (pattern.hold) steps.push({ phase: "hold", seconds: pattern.hold });
  steps.push({ phase: "exhale", seconds: pattern.exhale });
  if (pattern.holdEmpty) steps.push({ phase: "holdEmpty", seconds: pattern.holdEmpty });
  return steps;
}

export default function BreathPacer({
  breathPattern,
  paused = false,
}: {
  breathPattern: NonNullable<Stage["breathPattern"]>;
  paused?: boolean;
}) {
  // NOTE: this component is expected to be remounted (via a `key` prop keyed
  // to the stage/breathPattern) by its parent whenever the pattern changes,
  // so step state naturally resets without needing an effect to do it.
  const cycle = useMemo(() => buildCycle(breathPattern), [breathPattern]);
  const [stepIndex, setStepIndex] = useState(0);

  const currentStep = cycle[stepIndex % cycle.length];

  useEffect(() => {
    if (paused) return;
    const timeout = setTimeout(() => {
      setStepIndex((i) => (i + 1) % cycle.length);
    }, currentStep.seconds * 1000);
    return () => clearTimeout(timeout);
  }, [stepIndex, paused, cycle, currentStep.seconds]);

  const scale = PHASE_SCALE[currentStep.phase];
  const label = PHASE_LABEL[currentStep.phase];

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-4">
      <div className="relative flex h-40 w-40 items-center justify-center">
        <div
          className="absolute inset-0 rounded-full bg-teal-400/20"
          style={{
            transform: `scale(${scale})`,
            transition: `transform ${currentStep.seconds}s ease-in-out`,
          }}
        />
        <div
          className="absolute rounded-full border border-teal-300/40 bg-teal-500/10"
          style={{
            width: "70%",
            height: "70%",
            transform: `scale(${scale})`,
            transition: `transform ${currentStep.seconds}s ease-in-out`,
          }}
        />
        <span className="relative z-10 text-sm font-medium tracking-wide text-teal-100">
          {label}
        </span>
      </div>
      <p className="text-xs uppercase tracking-widest text-teal-200/60">
        {breathPattern.inhale}s in
        {breathPattern.hold ? ` · ${breathPattern.hold}s hold` : ""}
        {` · ${breathPattern.exhale}s out`}
        {breathPattern.holdEmpty ? ` · ${breathPattern.holdEmpty}s hold` : ""}
      </p>
    </div>
  );
}
