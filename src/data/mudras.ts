import type { MudraId, MudraShape } from '../types';

const extended = { curl: 'extended', touchesThumb: false } as const;
const curled = { curl: 'curled', touchesThumb: false } as const;
const half = { curl: 'half', touchesThumb: false } as const;
const touchingThumb = { curl: 'half', touchesThumb: true } as const;

export const mudraShapes: Record<MudraId, MudraShape> = {
  dhyana: {
    id: 'dhyana',
    name: 'Meditation Mudra',
    sanskritName: 'Dhyāna Mudrā',
    meaning: 'Hands rest in the lap, right over left, thumb tips touching — the classic posture of absorbed meditation.',
    palm: 'up',
    placement: 'lap',
    fingers: { thumb: touchingThumb, index: extended, middle: extended, ring: extended, little: extended },
  },
  'jnana-palms-down': {
    id: 'jnana-palms-down',
    name: 'Knowledge Mudra (palms down)',
    sanskritName: 'Jñāna Mudrā',
    meaning: 'Index and thumb tips join, remaining fingers extended, palms resting down on the knees — grounding variant.',
    palm: 'down',
    placement: 'knees',
    fingers: { thumb: touchingThumb, index: touchingThumb, middle: extended, ring: extended, little: extended },
  },
  'jnana-palms-up': {
    id: 'jnana-palms-up',
    name: 'Knowledge Mudra (palms up)',
    sanskritName: 'Cin Mudrā',
    meaning: 'Index and thumb tips join, palms open upward on the knees — receptive variant.',
    palm: 'up',
    placement: 'knees',
    fingers: { thumb: touchingThumb, index: touchingThumb, middle: extended, ring: extended, little: extended },
  },
  anjali: {
    id: 'anjali',
    name: 'Prayer Mudra',
    sanskritName: 'Añjali Mudrā',
    meaning: 'Palms pressed together at the heart center.',
    palm: 'inward',
    placement: 'heart',
    fingers: { thumb: extended, index: extended, middle: extended, ring: extended, little: extended },
  },
  bhairava: {
    id: 'bhairava',
    name: 'Fierce Mudra',
    sanskritName: 'Bhairava Mudrā',
    meaning: 'Right hand rests open in the left palm, both in the lap.',
    palm: 'up',
    placement: 'lap',
    fingers: { thumb: extended, index: extended, middle: extended, ring: extended, little: extended },
  },
  padma: {
    id: 'padma',
    name: 'Lotus Mudra',
    sanskritName: 'Padma Mudrā',
    meaning: 'Heels of the hands together at the heart, thumbs and little fingers touching, remaining fingers blooming open.',
    palm: 'inward',
    placement: 'heart',
    fingers: { thumb: extended, index: half, middle: extended, ring: extended, little: extended },
  },
};

export const mudraList: MudraShape[] = Object.values(mudraShapes);
