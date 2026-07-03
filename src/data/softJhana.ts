import type { SoftJhanaFactor } from '../types';

/**
 * Path A settling sequence (soft jhāna, Brasington-style). The user's own
 * "Settled" tap is the only completion signal — self-report, never detection.
 */
export const softJhanaSettling: SoftJhanaFactor[] = [
  {
    factor: 'piti',
    label: 'Rapture',
    promptText: 'Let attention rest fully in the rapture itself.',
  },
  {
    factor: 'sukha',
    label: 'Pleasure',
    promptText: 'Notice the pleasant ease beneath the rapture.',
  },
  {
    factor: 'ekaggata',
    label: 'One-pointedness',
    promptText: 'Let the sense of pleasure become the only thing.',
  },
  {
    factor: 'upekkha',
    label: 'Equanimity',
    promptText: 'If pleasure itself softens, rest in stillness.',
  },
];
