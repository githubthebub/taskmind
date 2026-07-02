import {
  CuePriority,
  GuidanceCue,
  PHASE_DEPTH,
  Phase,
  PhaseChange,
  SignalSnapshot,
} from './types.js';

/**
 * Adaptive guidance: what to say, and — just as important — when to stay
 * silent. Verbal guidance is scaffolding; absorption deepens in the gaps.
 * So the minimum interval between cues *grows* with depth, and cue
 * intensity (suggested TTS volume/energy) *shrinks* with depth.
 */

/** Minimum silence (ms) between non-corrective cues, per phase. */
const MIN_CUE_INTERVAL: Readonly<Record<Phase, number>> = {
  [Phase.Settling]: 20_000,
  [Phase.Access]: 40_000,
  [Phase.PitiCultivation]: 50_000,
  [Phase.Transition]: 70_000,
  [Phase.Jhana1]: 120_000,
  [Phase.Jhana2]: 240_000,
  [Phase.Emergence]: 25_000,
};

/** Corrective cues preempt the phase interval but have their own cooldown. */
const CORRECTIVE_COOLDOWN_MS = 30_000;

/** Signals below/above these mark dullness (sinking mind). */
const DULLNESS = { maxStability: 0.35, maxEffort: 0.15 };

const ENTRY_CUES: Readonly<Record<Phase, string>> = {
  [Phase.Settling]:
    'Arrive. Let the body be held by the seat. Nothing to achieve for a few breaths — just landing.',
  [Phase.Access]:
    'Bring attention to the small area at the rims of the nostrils and the upper lip. Feel the touch of air there — cool as it enters, warm and soft as it leaves. Let that tiny patch of sensation become the most interesting place in the world.',
  [Phase.PitiCultivation]:
    'Now let the breath be more than air. As you breathe in, sense a gentle energy filling the whole body, as if every cell were breathing. As you breathe out, let that energy soften and spread.',
  [Phase.Transition]:
    'The pleasantness is here. You can let the breath fade into the background now — turn toward the enjoyment itself. Rest your attention on the pleasure, lightly, the way you would watch a sunset.',
  [Phase.Jhana1]:
    'Let the joy fill everything. Applied and sustained — return to it, stay with it. There is nothing else to do.',
  [Phase.Jhana2]:
    'Even the inner voice that returns you to the object can rest now. Confidence carries you. Stillness, joy, and ease — born of the stillness itself.',
  [Phase.Emergence]:
    'Slowly widen the field. Feel the room, sounds, the weight of the body. Take a moment to notice how the mind is different from when you sat down.',
};

/** Rotating deepening cues per phase (avoid habituation to one phrasing). */
const DEEPENING_CUES: Readonly<Record<Phase, readonly string[]>> = {
  [Phase.Settling]: [
    'Soften the jaw, the shoulders, the hands.',
    'Take one slightly deeper breath, and on the exhale, let the weight of the day drain down and out.',
    'Nowhere to go. This sit has already begun by itself.',
  ],
  [Phase.Access]: [
    'Notice the coolness of this in-breath at the nostril rims. Is it slightly pleasant? Let it be.',
    'On the out-breath, feel the warmth and the letting go. The exhale itself relaxes you — notice that reward.',
    'If the mind wanders, smile inwardly — noticing IS the practice — and return to the touch of the breath.',
    'Make the attention finer, like listening for a distant sound with your skin.',
    'Each breath is a small pleasure delivered for free. Receive it.',
  ],
  [Phase.PitiCultivation]: [
    'On the in-breath, imagine the breath energy rising up the back of the body. On the out-breath, down the front.',
    'Any tingling, warmth, or pleasant vibration — anywhere in the body — let it be welcome. Give it room.',
    'Breathe as if through the palms of the hands, the soles of the feet.',
    'Let the pleasant quality of the breath soak outward from the nostrils into the face, the chest, the belly.',
    'You are not manufacturing anything. You are noticing what was already faintly here, and letting it grow.',
  ],
  [Phase.Transition]: [
    'Attend to the pleasantness itself, not its story. Where is it most vivid right now? Rest there.',
    'Hold it like water in open palms. No squeezing.',
    'If excitement bubbles up, fine — let even the excitement be part of the pleasure, and settle around it.',
    'The breath keeps breathing itself in the background. You are off duty.',
  ],
  [Phase.Jhana1]: [
    'Stay. Sustain. Let the joy know you are staying.',
    'Whole body, one glow.',
    'Return, rest. Return, rest.',
  ],
  [Phase.Jhana2]: [
    'Still. Bright. At ease.',
    'No steering. Being carried.',
  ],
  [Phase.Emergence]: [
    'Wiggle fingers and toes when you are ready.',
    'Carry a thread of this ease with you as you open the eyes.',
  ],
};

/** Delivered instead of the entry cue when the machine stepped back. */
const REGRESSION_CUES: Readonly<Partial<Record<Phase, string>>> = {
  [Phase.Access]:
    'The mind drifted — completely normal. Come home to the touch of breath at the nostrils. The door opens again from here.',
  [Phase.PitiCultivation]:
    'The wave receded. Nothing is lost — waves return. Rest with the whole-body breath and let it rebuild on its own.',
  [Phase.Transition]:
    'Ease back. Feel the pleasantness that is still here, however faint, and keep it company.',
  [Phase.Jhana1]:
    'Let it re-gather. Joy is nearby; you only stepped into the doorway.',
};

/** Delivered when grasping collapsed the state. Deliberately kind. */
const GRASPING_COLLAPSE_CUES: Readonly<Partial<Record<Phase, string>>> = {
  [Phase.PitiCultivation]:
    'That surge was wonderful — and reaching for it squeezed it away. This happens to everyone. Soften. Let the body breathe, and let the pleasure come to you this time.',
  [Phase.Transition]:
    'Excitement grabbed the controls for a moment. Lean back inside. The state returns when it is not being chased.',
  [Phase.Jhana1]:
    'You touched it, and the touching thrilled the mind out of it. Beautiful sign of progress. Settle, and let it rise again on its own.',
};

const SOFTEN_CUES: readonly string[] = [
  'Something is being gripped. Relax the forehead, the eyes, the chest — and let the experience hold itself.',
  'Less reaching. The pleasure does not need your help.',
  'Let go of wanting it to grow. Watch it the way you would watch a shy animal: still, and kind.',
];

const BRIGHTEN_CUES: readonly string[] = [
  'The mind is dimming. Sit a little taller. Take one intentionally vivid breath and feel its texture precisely.',
  'Open the eyes a sliver of light, refresh the posture, and meet the very next in-breath at the nostrils like it is the first.',
  'Add gentle interest: exactly how does this exhale end? Catch the last wisp of it.',
];

export class GuidanceEngine {
  private lastCueAt = -Infinity;
  private lastCorrectiveAt = -Infinity;
  private deepeningIndex: Record<Phase, number>;
  private softenIndex = 0;
  private brightenIndex = 0;
  private seq = 0;

  constructor() {
    this.deepeningIndex = {
      [Phase.Settling]: 0,
      [Phase.Access]: 0,
      [Phase.PitiCultivation]: 0,
      [Phase.Transition]: 0,
      [Phase.Jhana1]: 0,
      [Phase.Jhana2]: 0,
      [Phase.Emergence]: 0,
    };
  }

  /** Cue for a phase change; always delivered, resets the silence clock. */
  onPhaseChange(change: PhaseChange): GuidanceCue {
    let text: string;
    if (change.reason === 'grasping') {
      text =
        GRASPING_COLLAPSE_CUES[change.to] ??
        REGRESSION_CUES[change.to] ??
        ENTRY_CUES[change.to];
    } else if (change.reason === 'regression') {
      text = REGRESSION_CUES[change.to] ?? ENTRY_CUES[change.to];
    } else {
      text = ENTRY_CUES[change.to];
    }
    this.lastCueAt = change.at;
    return this.makeCue(change.at, change.to, CuePriority.PhaseEntry, text);
  }

  /**
   * Periodic evaluation. Returns at most one cue — corrective first, then
   * a rotating deepening cue if the silence interval has elapsed.
   */
  poll(now: number, phase: Phase, s: SignalSnapshot, holding: boolean): GuidanceCue | null {
    // 1. Corrective: grasping hold.
    if (holding && now - this.lastCorrectiveAt >= CORRECTIVE_COOLDOWN_MS) {
      const text = SOFTEN_CUES[this.softenIndex % SOFTEN_CUES.length]!;
      this.softenIndex++;
      this.lastCorrectiveAt = now;
      this.lastCueAt = now;
      return this.makeCue(now, phase, CuePriority.Corrective, text);
    }

    // 2. Corrective: dullness (only once attention training has begun,
    //    and not during Emergence where low arousal is expected).
    const trainable =
      PHASE_DEPTH[phase] >= PHASE_DEPTH[Phase.Access] && phase !== Phase.Emergence;
    if (
      trainable &&
      s.stability < DULLNESS.maxStability &&
      s.effort < DULLNESS.maxEffort &&
      now - this.lastCorrectiveAt >= CORRECTIVE_COOLDOWN_MS
    ) {
      const text = BRIGHTEN_CUES[this.brightenIndex % BRIGHTEN_CUES.length]!;
      this.brightenIndex++;
      this.lastCorrectiveAt = now;
      this.lastCueAt = now;
      return this.makeCue(now, phase, CuePriority.Corrective, text);
    }

    // 3. Deepening, if enough silence has passed.
    if (now - this.lastCueAt >= MIN_CUE_INTERVAL[phase]) {
      const bank = DEEPENING_CUES[phase];
      const text = bank[this.deepeningIndex[phase] % bank.length]!;
      this.deepeningIndex[phase]++;
      this.lastCueAt = now;
      return this.makeCue(now, phase, CuePriority.Deepening, text);
    }

    return null;
  }

  private makeCue(at: number, phase: Phase, priority: CuePriority, text: string): GuidanceCue {
    // Softer delivery as absorption deepens; corrections stay a bit clearer.
    const depth = PHASE_DEPTH[phase];
    const base = 1 - Math.min(depth, 5) * 0.14;
    const intensity = priority === CuePriority.Corrective ? Math.min(1, base + 0.2) : base;
    return {
      id: `cue-${this.seq++}`,
      phase,
      priority,
      text,
      intensity: Math.max(0.2, intensity),
      at,
    };
  }
}
