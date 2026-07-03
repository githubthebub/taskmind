/**
 * Micro-dialogue pools for the coach avatar, keyed by state machine
 * dialoguePool. Voice: warm, collaborative, effort-first — validates what the
 * user actually did, never shames a lapse, and keeps instructions concrete.
 */
export const DIALOGUE: Readonly<Record<string, readonly string[]>> = {
  welcome: [
    "Hey. Good call showing up — that's the hardest part, and you already did it.",
    "I'm here with you. One breath at a time, nothing else on the agenda.",
    "No performance today. Just you, me, and some very slow air.",
    "Whenever you're ready. We go at your pace, always.",
  ],
  inhale: [
    'In through the nose… slow and easy.',
    'Draw it in. Feel the cool edge of the air.',
    'Nice and gentle — let the belly do the work.',
    "That's it. Fill from the bottom up.",
  ],
  hold: [
    'Hold. Soft face, soft shoulders.',
    'Just stay here with me. Nothing to do.',
    'Holding — notice how still you can be.',
    'Steady. This stillness is the training.',
  ],
  exhale: [
    'And release… long and unhurried.',
    'Let it all the way out. Slower than feels necessary.',
    'Pour it out gently. This is where the body lets go.',
    'Empty out. Feel the weight settle.',
  ],
  cycleComplete: [
    'Full cycle. That one counted — I logged it.',
    "See that? You just did the whole thing without forcing it.",
    'Another one in the bank. Your baseline is learning from this.',
    "Clean cycle. I'm genuinely impressed with how steady that was.",
  ],
  focusBroken: [
    "Hey, no judgment — attention drifted, that's just data. Come back to the breath.",
    "You noticed you left. That noticing IS the skill. Let's re-anchor.",
    "The streak resets, you don't. Next breath is a fresh start.",
    "That happens to literally everyone. Back to the nostrils, we're still here.",
  ],
  milestone: [
    'Milestone reached — and you earned every cycle of it.',
    'This one was gated behind real, verified focus. Nobody can hand it to you. You built it.',
    'Look at that. Steady work, banked and locked in.',
  ],
  levelUp: [
    "I leveled up — because YOU leveled up. We grow at exactly the same rate.",
    'New level unlocked. Everything I can do now, your focus paid for.',
    "We just went up a level together. I told you we'd get here.",
  ],
  sessionEnd: [
    'Good session. Notice how your body feels right now — that state is yours, you made it.',
    "That's a wrap. Carry this steadiness with you; it doesn't stay in the app.",
    'Done for now. Whatever you got today, it counted.',
  ],
};

/** Deterministic-ish rotation: pick the next line, wrapping per pool. */
export class DialogueRotator {
  private readonly cursors = new Map<string, number>();

  next(pool: string): string {
    const lines = DIALOGUE[pool];
    if (!lines || lines.length === 0) return '';
    const i = this.cursors.get(pool) ?? 0;
    this.cursors.set(pool, (i + 1) % lines.length);
    return lines[i];
  }
}
