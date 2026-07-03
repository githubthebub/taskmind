import type { PersonaId } from '../types.js';

/**
 * Micro-dialogue pools for the coach avatar: one voice per persona, one pool
 * per state-machine dialoguePool. Three registers, one relational contract —
 * every voice validates effort, never shames a lapse, and keeps instructions
 * concrete:
 *
 *  - sage: warm, steady, effort-first.
 *  - challenger: blunt, numbers-driven, allergic to cope. Discomfort isn't
 *    damage; partial reps don't count; the counter doesn't lie.
 *  - alchemist: psycho-logic. Reframes the practice as the most underpriced
 *    luxury available — value engineering for a nervous system.
 */
export const DIALOGUE: Readonly<
  Record<PersonaId, Readonly<Record<string, readonly string[]>>>
> = {
  sage: {
    welcome: [
      "Hey. Good call showing up — that's the hardest part, and you already did it.",
      "I'm here with you. One breath at a time, nothing else on the agenda.",
      'No performance today. Just you, me, and some very slow air.',
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
      'See that? You just did the whole thing without forcing it.',
      'Another one in the bank. Your baseline is learning from this.',
      "Clean cycle. I'm genuinely impressed with how steady that was.",
    ],
    focusBroken: [
      "Hey, no judgment — attention drifted, that's just data. Come back to the breath.",
      'You noticed you left. That noticing IS the skill. Let’s re-anchor.',
      "The streak resets, you don't. Next breath is a fresh start.",
      "That happens to literally everyone. Back to the nostrils, we're still here.",
    ],
    milestone: [
      'Milestone reached — and you earned every cycle of it.',
      'This one was gated behind real, verified focus. Nobody can hand it to you. You built it.',
      'Look at that. Steady work, banked and locked in.',
    ],
    levelUp: [
      'I leveled up — because YOU leveled up. We grow at exactly the same rate.',
      'New level unlocked. Everything I can do now, your focus paid for.',
      "We just went up a level together. I told you we'd get here.",
    ],
    sessionEnd: [
      'Good session. Notice how your body feels right now — that state is yours, you made it.',
      "That's a wrap. Carry this steadiness with you; it doesn't stay in the app.",
      'Done for now. Whatever you got today, it counted.',
    ],
  },

  challenger: {
    welcome: [
      "Alright. Nineteen seconds a cycle. You've waited longer for a respawn timer. Let's go.",
      'No mysticism required — slow breathing just works. Sit down and run the reps.',
      "You're here. That's step one. Don't make it weird, just breathe.",
    ],
    inhale: [
      'In through the nose. Four seconds. Count it honestly.',
      "Breathe in. Don't rush it — rushing is losing.",
      "Nose. Four seconds. That's the whole assignment.",
    ],
    hold: [
      "Hold. Seven seconds. Yes, it feels long. That's the point.",
      "Hold it. You're fine. Discomfort isn't damage.",
      "Still holding. Don't bail early — partial reps don't count.",
    ],
    exhale: [
      'Out. Eight seconds. Slower than you think you need.',
      'Exhale everything. All of it.',
      'Long exhale. This is the part that actually downshifts you.',
    ],
    cycleComplete: [
      "Cycle logged. That's a real number, not vibes.",
      "One more in the bank. The counter doesn't lie.",
      'Clean rep. Stack another.',
    ],
    focusBroken: [
      "You tabbed out. Run's dead. No cope — reset and go again.",
      "Focus broke. It's data, not a tragedy. Re-anchor.",
      "That cycle didn't verify. The next one can. Go.",
    ],
    milestone: [
      "Milestone. You can't argue with a counter you filled yourself.",
      'That gate only opens with verified reps. You did the reps.',
    ],
    levelUp: [
      'Level up. Earned, not granted. Big difference.',
      'New level. The grind is the feature.',
    ],
    sessionEnd: [
      'Done. Check the numbers — they’re yours.',
      'Session over. Same time tomorrow, or the streak was luck.',
    ],
  },

  alchemist: {
    welcome: [
      'Nineteen seconds of doing nothing — the most underpriced luxury in the world. Shall we?',
      "If this cost £200 an hour you'd swear by it. It costs nothing. People are strange.",
      "The opposite of a good idea can be another good idea. Today's: go slower to feel better.",
    ],
    inhale: [
      "Breathe in like it's first-class air. Same air. Better flight.",
      'In slowly — scarcity makes things valuable, including breath.',
      'Four seconds of air, savoured like wine.',
    ],
    hold: [
      'Hold. A pause is not nothing — a pause is the frame around the picture.',
      'Stillness: the one thing nobody can sell you.',
      'Hold. Waiting feels shorter when you know the train is moving.',
    ],
    exhale: [
      "Exhale like you're setting down heavy shopping bags.",
      'Eight seconds of letting go. Most spas charge for less.',
      'Out, slowly. The discount on calm is doing it yourself.',
    ],
    cycleComplete: [
      'One cycle: free, renewable, and it worked. Try finding that in a store.',
      'Another cycle banked. Compound interest, but for your nervous system.',
      'That cost you nineteen seconds and paid you back double.',
    ],
    focusBroken: [
      'Attention wandered — even Concorde had delays. Board the next breath.',
      "The streak reset. The skill didn't. Back to the nostrils.",
      'A lapse is just proof you noticed. Noticing is the product.',
    ],
    milestone: [
      "A milestone you couldn't buy — which is precisely why it's worth something.",
      'Earned scarcity. The rarest goods are the ones with no shortcut.',
    ],
    levelUp: [
      'We leveled up. Perceived value and actual value, for once, agree.',
      'New level — paid for entirely in attention. The strongest currency there is.',
    ],
    sessionEnd: [
      "Done. You've just manufactured a mood from thin air. Literally.",
      'Session complete. Cheapest luxury you’ll enjoy today.',
    ],
  },
};

/** Deterministic-ish rotation: pick the next line, wrapping per persona+pool. */
export class DialogueRotator {
  private readonly cursors = new Map<string, number>();

  next(persona: PersonaId, pool: string): string {
    const lines = DIALOGUE[persona]?.[pool];
    if (!lines || lines.length === 0) return '';
    const key = `${persona}:${pool}`;
    const i = this.cursors.get(key) ?? 0;
    this.cursors.set(key, (i + 1) % lines.length);
    return lines[i];
  }
}
