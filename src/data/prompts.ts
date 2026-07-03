import type { ReframePrompt } from '../types.js';

/**
 * The reframing prompt dictionary ("Pīti Matrix").
 *
 * These lines train attentional reappraisal: taking a sensation that is
 * normally filtered out as neutral — the coolness of air at the nostril rim —
 * and deliberately tagging it as salient and pleasant. With repetition, the
 * felt sense of the breath itself becomes rewarding, which is what makes the
 * practice self-sustaining. Deeper prompts (spreading warmth / pīti work)
 * unlock at higher companion levels so they arrive only after the basic
 * anchor is stable.
 */
export const PROMPTS: readonly ReframePrompt[] = [
  // --- Level 1: establish the anchor ---
  {
    id: 'anchor-cool',
    phase: 'inhale',
    minLevel: 1,
    text: 'Find the COOL edge of the air at the rim of your nostrils. That exact point is your anchor.',
  },
  {
    id: 'anchor-contrast',
    phase: 'exhale',
    minLevel: 1,
    text: 'Now the warm return. Cool in, warm out — track the contrast like it matters, because it does.',
  },
  {
    id: 'anchor-choose',
    phase: 'any',
    minLevel: 1,
    text: 'You are choosing what your attention treats as important. Right now: this breath.',
  },
  {
    id: 'anchor-still',
    phase: 'hold',
    minLevel: 1,
    text: 'In the stillness, the sensation is faint. Finding it anyway is the whole exercise.',
  },

  // --- Level 2: tag it as good ---
  {
    id: 'tag-pleasant',
    phase: 'inhale',
    minLevel: 2,
    text: 'This coolness is not neutral. Let it register as PLEASANT — crisp, clean, like fresh air through a window.',
  },
  {
    id: 'tag-reward',
    phase: 'any',
    minLevel: 2,
    text: 'Every time you tag this sensation as good, you are teaching your own reward system what to want.',
  },
  {
    id: 'tag-salience',
    phase: 'hold',
    minLevel: 2,
    text: 'Hold the sensation in the spotlight. Salience is a skill, and you are training it right now.',
  },

  // --- Level 3: let it be enjoyable ---
  {
    id: 'enjoy-permission',
    phase: 'exhale',
    minLevel: 3,
    text: 'Give yourself explicit permission to ENJOY this exhale. Not tolerate — enjoy.',
  },
  {
    id: 'enjoy-smile',
    phase: 'inhale',
    minLevel: 3,
    text: 'Soften the corners of your eyes, hint of a smile. Notice how the same breath feels better already.',
  },
  {
    id: 'enjoy-drink',
    phase: 'inhale',
    minLevel: 3,
    text: 'Drink the breath in like cold water on a hot day. Same air — different instruction to your brain.',
  },

  // --- Level 4+: spread it (pīti work) ---
  {
    id: 'piti-spread',
    phase: 'exhale',
    minLevel: 4,
    text: 'On this exhale, let the pleasantness spill from the nostrils down through the chest. Follow it.',
  },
  {
    id: 'piti-wave',
    phase: 'any',
    minLevel: 4,
    text: 'If a wave of warmth or tingling shows up, do not chase it and do not push it away. Welcome it, keep breathing.',
  },
  {
    id: 'piti-whole-body',
    phase: 'exhale',
    minLevel: 5,
    text: 'Whole body now: breathe out through every pore. Let the good feeling be everywhere the breath is.',
  },
  {
    id: 'piti-source',
    phase: 'any',
    minLevel: 5,
    text: 'Notice: this state came from nowhere but you. No screen, no substance, no scroll. You generated it.',
  },
  {
    id: 'piti-return',
    phase: 'any',
    minLevel: 6,
    text: 'This is trainable, repeatable, and always on your person. The exit is also the entrance: one slow breath.',
  },
];

/** Rotates prompts filtered by phase and unlocked level. */
export class PromptDeck {
  private cursor = 0;

  draw(phase: ReframePrompt['phase'], level: number): ReframePrompt | null {
    const eligible = PROMPTS.filter(
      (p) => p.minLevel <= level && (p.phase === phase || p.phase === 'any'),
    );
    if (eligible.length === 0) return null;
    const pick = eligible[this.cursor % eligible.length];
    this.cursor += 1;
    return pick;
  }
}
