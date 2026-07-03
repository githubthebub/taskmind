import type { BandhaStep, Chakra, ComboCorrespondence, MudraId, TantricStage } from '../types';

/**
 * Bandhas in correct traditional engagement order when combining:
 * jalandhara -> uddiyana -> mula (release in reverse). Framed throughout as
 * traditional practice, never as a physiological claim.
 */
export const bandhaSteps: BandhaStep[] = [
  {
    bandha: 'jalandhara',
    name: 'Jalandhara Bandha (Throat Lock)',
    description: 'Extend the neck, lift the sternum, then drop the chin to rest on the chest.',
    engagementOrder: 1,
    pairsWithRetention: 'antara',
  },
  {
    bandha: 'uddiyana',
    name: 'Uddiyana Bandha (Abdominal Lock)',
    description: 'After exhaling, draw the abdomen up and in, beneath the ribcage.',
    engagementOrder: 2,
    pairsWithRetention: 'bahya',
  },
  {
    bandha: 'mula',
    name: 'Mula Bandha (Root Lock)',
    description: 'Contract the pelvic floor musculature, engaged last when combining locks.',
    engagementOrder: 3,
    pairsWithRetention: 'antara',
  },
];

export const chakras: Chakra[] = [
  { id: 'muladhara', name: 'Root', sanskritName: 'Mūlādhāra', location: 'base of spine' },
  { id: 'svadhisthana', name: 'Sacral', sanskritName: 'Svādhiṣṭhāna', location: 'lower abdomen' },
  { id: 'manipura', name: 'Solar Plexus', sanskritName: 'Maṇipūra', location: 'navel' },
  { id: 'anahata', name: 'Heart', sanskritName: 'Anāhata', location: 'center of chest' },
  { id: 'vishuddha', name: 'Throat', sanskritName: 'Viśuddha', location: 'throat' },
  { id: 'ajna', name: 'Third Eye', sanskritName: 'Ājñā', location: 'between the eyebrows' },
  { id: 'sahasrara', name: 'Crown', sanskritName: 'Sahasrāra', location: 'crown of the head' },
];

/**
 * Path C stage sequence. Enters directly at "Lock & Rise" — Stage 0 already
 * provided the ignition/rapture equivalent of a standalone bhastrika stage.
 */
export const tantricStageSequence: TantricStage[] = [
  {
    stage: 1,
    name: 'Lock & Rise',
    bandha: 'jalandhara',
    chakra: 'vishuddha',
    mudra: 'jnana-palms-down',
    eyeState: 'open',
    guidance:
      'With the rapture still moving, engage the throat lock and let attention gather at the throat center. In the tradition, this seals the risen energy.',
  },
  {
    stage: 2,
    name: 'Anchor',
    bandha: null,
    chakra: 'ajna',
    mudra: 'jnana-palms-down',
    eyeState: 'shambhavi-lock',
    guidance:
      'Release the lock. Turn the inner gaze upward to the point between the eyebrows and hold it steady — śāmbhavī mudrā, the traditional anchor.',
  },
  {
    stage: 3,
    name: 'Launch',
    bandha: null,
    chakra: 'sahasrara',
    mudra: 'dhyana',
    eyeState: 'closed',
    guidance:
      'Hands settle into dhyāna mudrā. Let attention rise to the crown and rest there, open and effortless.',
  },
];

/**
 * Advanced mudra chains for the returning-practitioner layer: extra mudra
 * transitions per tantric stage, unlocked by demonstrated practice (tier),
 * never by payment. Keyed by stage number; the base mudra is always first.
 */
export const advancedMudraChains: Record<2 | 3, Record<number, MudraId[]>> = {
  2: {
    1: ['jnana-palms-down', 'bhairava'],
    2: ['jnana-palms-down', 'jnana-palms-up'],
    3: ['dhyana'],
  },
  3: {
    1: ['jnana-palms-down', 'bhairava', 'anjali'],
    2: ['jnana-palms-down', 'jnana-palms-up', 'bhairava'],
    3: ['padma', 'dhyana'],
  },
};

/**
 * Path D correspondences. Where a pairing is genuine (e.g. pīti/sukha language
 * shared across systems) it is labeled; where it is app-specific synthesis,
 * `genuine` is false and the UI must frame it as personal synthesis —
 * explicitly NOT a shared canonical lineage.
 */
export const comboCorrespondences: ComboCorrespondence[] = [
  {
    stage: 1,
    tetradNote:
      'Echoes tetrad 2, steps 5–6: experiencing pīti and sukha with the breath.',
    jhanaFactorNote: 'Working directly with pīti (rapture) as the object.',
    genuine: true,
  },
  {
    stage: 2,
    tetradNote:
      'Loosely parallels step 11 (concentrating the mind) — a personal-synthesis pairing, not a canonical one.',
    jhanaFactorNote: 'One-pointedness (ekaggatā) as steadiness of inner gaze.',
    genuine: false,
  },
  {
    stage: 3,
    tetradNote:
      'Loosely parallels step 12 (liberating the mind) — a personal-synthesis pairing, not a canonical one.',
    jhanaFactorNote: 'Resting equanimity (upekkhā) as the effortless holding.',
    genuine: false,
  },
];

export const comboFraming =
  'This combined path is a personal synthesis. The tantric sequence and the ' +
  'ānāpānasati framework come from different traditions; the labels below note ' +
  'where they genuinely speak the same language and where the pairing is our own.';
