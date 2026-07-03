import type { Mudra } from '../types.js';

/**
 * The mudra library. Each entry pairs a hand position the coach demonstrates
 * with its traditional association and a concrete physical cue. Associations
 * are stated as tradition ("classically used for…"), never as promised
 * effects — invariant #6.
 */
export const MUDRAS: readonly Mudra[] = [
  {
    id: 'gyan',
    name: 'Gyan',
    sanskrit: 'Gyāna Mudrā — seal of knowledge',
    tradition: 'The classic seat of Kundalini and meditation practice: receptive, grounded, alert.',
    cue: 'Rest your hands on your knees, palms up. Touch each index fingertip to its thumb; let the other three fingers extend softly.',
  },
  {
    id: 'dhyana',
    name: 'Dhyana',
    sanskrit: 'Dhyāna Mudrā — seal of absorption',
    tradition: 'The traditional posture for jhāna practice — deep, settled absorption in the breath.',
    cue: 'Cup your right hand inside your left at your lap, palms up, thumb tips lightly touching. Let the whole shape rest — no grip anywhere.',
  },
  {
    id: 'anjali',
    name: 'Anjali',
    sanskrit: 'Añjali Mudrā — palms at the heart',
    tradition: 'Centering and gratitude; classically used to open or close a sitting.',
    cue: 'Press your palms gently together at the center of your chest, fingers up, forearms relaxed. Equal pressure left and right.',
  },
  {
    id: 'prana',
    name: 'Prana',
    sanskrit: 'Prāṇa Mudrā — seal of vitality',
    tradition: 'Associated with vitality and steadiness; pairs well with the long exhale.',
    cue: 'Touch ring and little fingertips to each thumb; extend index and middle fingers. Hands rest on your knees, palms up.',
  },
];

export function mudraById(id: string): Mudra {
  return MUDRAS.find((m) => m.id === id) ?? MUDRAS[0];
}
