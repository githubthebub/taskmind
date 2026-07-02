/**
 * Content Indexer — quota-gated motivational texts and grounding scripts.
 *
 * Offline-first: the entire library ships in this module. Locked bodies are
 * never exposed through the public API; `getLockedPreviews` strips them and
 * `getUnlocked` filters strictly by verified block-clearing quota.
 */

import type { GatedContentItem, IContentIndexer } from '../types.js';

/** Block-clearing thresholds; tier index = position in this array. */
export const QUOTA_TIERS: number[] = [10, 25, 50, 100, 175, 275, 400, 600];

/**
 * Returns true when the given tier exists and its quota threshold has been
 * met by the verified lifetime block-clear count. Used to gate synthesized
 * audio grounding scripts as well as text retrieval.
 */
export function quotaGate(tier: number, totalBlocksCleared: number): boolean {
  if (!Number.isInteger(tier) || tier < 0 || tier >= QUOTA_TIERS.length) {
    return false;
  }
  return QUOTA_TIERS[tier] <= totalBlocksCleared;
}

/**
 * The full gated library. Even tiers are motivational texts (identity-priming,
 * action-anchored); odd tiers are grounding scripts (somatic, body-first,
 * non-linguistic-leaning). One item per quota tier, eight total.
 */
const LIBRARY: readonly GatedContentItem[] = [
  {
    tier: 0,
    quotaThreshold: QUOTA_TIERS[0],
    kind: 'motivational-text',
    title: 'The Rep in Front of You',
    body:
      'You are the kind of person who finishes the rep in front of you. ' +
      'Not the whole workout, not the whole week — this one block, this one clear, done all the way. ' +
      'Every time you complete something small on purpose, you cast a vote for the person you are becoming.',
  },
  {
    tier: 1,
    quotaThreshold: QUOTA_TIERS[1],
    kind: 'grounding-script',
    title: 'Three Points of Contact',
    body:
      'Find three points of contact: feet on the floor, sit bones on the chair, hands resting where they are. ' +
      'Let your weight pour down through each point, one at a time. ' +
      'Unclench your jaw and let your tongue drop from the roof of your mouth. ' +
      'Stay with the pressure of contact for three slow breaths — no words needed, just weight.',
  },
  {
    tier: 2,
    quotaThreshold: QUOTA_TIERS[2],
    kind: 'motivational-text',
    title: 'Showing Up Is the Skill',
    body:
      'You are someone who shows up before feeling ready, because you know readiness is built mid-motion. ' +
      'The next block is not a test of your worth; it is a place to practice being the person who starts. ' +
      'Start badly if you must — starting is the whole skill.',
  },
  {
    tier: 3,
    quotaThreshold: QUOTA_TIERS[3],
    kind: 'grounding-script',
    title: 'Lengthen the Exhale',
    body:
      'Breathe in through the nose for a count of four, letting the belly widen. ' +
      'Exhale through pursed lips for a count of eight, longer and thinner than feels natural. ' +
      'On each exhale, let the shoulders slide down away from the ears. ' +
      'Feel the ribs knit back together at the bottom of the breath. ' +
      'Repeat four times, tracking only the sensation of air leaving.',
  },
  {
    tier: 4,
    quotaThreshold: QUOTA_TIERS[4],
    kind: 'motivational-text',
    title: 'Built by Boring Repetitions',
    body:
      'You are the kind of person who trusts boring repetitions over dramatic gestures. ' +
      'Nobody claps for the hundredth cleared block, and that is exactly why it counts. ' +
      'Do the unglamorous thing again, precisely, and let the compounding do the bragging.',
  },
  {
    tier: 5,
    quotaThreshold: QUOTA_TIERS[5],
    kind: 'grounding-script',
    title: 'Panoramic Gaze',
    body:
      'Soften your gaze and let it widen until you can sense the edges of the room without moving your eyes. ' +
      'Hold that panoramic vision and notice how the breath slows on its own. ' +
      'Let the muscles around the eyes and forehead go slack. ' +
      'Feel the whole visual field at once — near, far, left, right — with nothing to focus on. ' +
      'Rest there for five breaths before narrowing back to the task.',
  },
  {
    tier: 6,
    quotaThreshold: QUOTA_TIERS[6],
    kind: 'motivational-text',
    title: 'The Long Middle',
    body:
      'You are someone who keeps promises to yourself in the long middle, where motivation has already left the room. ' +
      'This is the stretch that separates people who wanted it from people who built it. ' +
      'Lower the drama, raise the standard, and take the next block like it is the only one that exists. ' +
      'Because right now, it is.',
  },
  {
    tier: 7,
    quotaThreshold: QUOTA_TIERS[7],
    kind: 'grounding-script',
    title: 'Weight Through the Sit Bones',
    body:
      'Rock gently side to side until you locate the two sit bones pressing into the seat. ' +
      'Settle your full weight down through them, letting the spine stack tall without effort. ' +
      'Unclench the jaw, soften the hands, and release the belly. ' +
      'Feel gravity holding you — you do not need to hold yourself. ' +
      'Stay with that downward weight for six slow exhales before returning.',
  },
];

/** Deep copy so callers can never mutate the internal library. */
function cloneItem(item: GatedContentItem): GatedContentItem {
  return {
    tier: item.tier,
    quotaThreshold: item.quotaThreshold,
    kind: item.kind,
    title: item.title,
    body: item.body,
  };
}

export class ContentIndexer implements IContentIndexer {
  getUnlocked(totalBlocksCleared: number): GatedContentItem[] {
    return LIBRARY.filter((item) => quotaGate(item.tier, totalBlocksCleared))
      .map(cloneItem)
      .sort((a, b) => a.tier - b.tier);
  }

  getLockedPreviews(
    totalBlocksCleared: number,
  ): Array<Pick<GatedContentItem, 'tier' | 'quotaThreshold' | 'title'>> {
    return LIBRARY.filter((item) => !quotaGate(item.tier, totalBlocksCleared))
      .map((item) => ({
        tier: item.tier,
        quotaThreshold: item.quotaThreshold,
        title: item.title,
      }))
      .sort((a, b) => a.tier - b.tier);
  }
}
