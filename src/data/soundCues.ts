import type { SoundCueId, SoundCueSpec } from '../types';
import { mudraShapes } from './mudras';

/**
 * Sound-cue table (Section 6). All cues are synthesized (no assets) so the
 * eyes-closed / audio-only mode works offline. Each cue is a short, distinct
 * timbre; nothing here is loud or startling — retention cues especially are
 * gentle by design (no alarm, no countdown pressure).
 */

const base: SoundCueSpec[] = [
  { id: 'cue-breath-pulse', freqs: [220], wave: 'sine', durationMs: 90, gain: 0.25, envelope: 'pluck', description: 'Soft pulse marking bhastrika/tummo tempo.' },
  { id: 'cue-round-start', freqs: [330, 440], wave: 'sine', durationMs: 400, gain: 0.5, envelope: 'chime', description: 'A new breath round begins.' },
  { id: 'cue-retention-start', freqs: [196], wave: 'sine', durationMs: 900, gain: 0.45, envelope: 'swell', description: 'Kumbhaka begins — low, settling swell.' },
  { id: 'cue-retention-soft-cap', freqs: [262, 330], wave: 'sine', durationMs: 700, gain: 0.35, envelope: 'swell', description: 'Gentle reminder that the soft cap is reached — release when ready.' },
  { id: 'cue-retention-release', freqs: [294, 392], wave: 'sine', durationMs: 500, gain: 0.5, envelope: 'chime', description: 'Retention released.' },
  { id: 'cue-rapture-onset', freqs: [523, 659, 784], wave: 'sine', durationMs: 1200, gain: 0.6, envelope: 'chime', description: 'Ignition confirmed — the Rapture Onset tap.' },
  { id: 'cue-settled', freqs: [392, 494, 587], wave: 'sine', durationMs: 1600, gain: 0.4, envelope: 'swell', description: 'Settled tap — long, quiet resolution.' },
  { id: 'cue-settle-prompt', freqs: [349], wave: 'sine', durationMs: 600, gain: 0.3, envelope: 'swell', description: 'Path A factor prompt — gets softer as settling deepens.' },
  { id: 'cue-step-advance', freqs: [440, 554], wave: 'sine', durationMs: 350, gain: 0.4, envelope: 'chime', description: 'Ānāpānasati step advance.' },
  { id: 'cue-chakra-shift', freqs: [311, 415], wave: 'triangle', durationMs: 800, gain: 0.45, envelope: 'swell', description: 'Attention moves to a new chakra target.' },
  { id: 'cue-session-complete', freqs: [262, 330, 392, 523], wave: 'sine', durationMs: 2000, gain: 0.5, envelope: 'chime', description: 'Session complete.' },
  { id: 'cue-bandha-mula', freqs: [147], wave: 'triangle', durationMs: 500, gain: 0.45, envelope: 'pluck', description: 'Engage mula bandha (root lock).' },
  { id: 'cue-bandha-uddiyana', freqs: [185], wave: 'triangle', durationMs: 500, gain: 0.45, envelope: 'pluck', description: 'Engage uddiyana bandha (abdominal lock).' },
  { id: 'cue-bandha-jalandhara', freqs: [233], wave: 'triangle', durationMs: 500, gain: 0.45, envelope: 'pluck', description: 'Engage jalandhara bandha (throat lock).' },
  { id: 'cue-bandha-maha', freqs: [147, 185, 233], wave: 'triangle', durationMs: 700, gain: 0.5, envelope: 'pluck', description: 'Maha bandha — all three locks together.' },
];

/** Each mudra gets a distinct two-note signature for audio-only practice. */
const mudraCueFreqs: Record<string, number[]> = {
  dhyana: [392, 523],
  'jnana-palms-down': [349, 440],
  'jnana-palms-up': [349, 466],
  anjali: [415, 523],
  bhairava: [330, 415],
  padma: [440, 587],
};

const mudraCues: SoundCueSpec[] = Object.keys(mudraShapes).map((id) => ({
  id: `cue-mudra-${id}` as SoundCueId,
  freqs: mudraCueFreqs[id] ?? [400, 500],
  wave: 'sine',
  durationMs: 450,
  gain: 0.45,
  envelope: 'chime',
  description: `Transition into ${mudraShapes[id as keyof typeof mudraShapes].sanskritName}.`,
}));

export const soundCueTable: SoundCueSpec[] = [...base, ...mudraCues];

export const soundCueMap: Map<SoundCueId, SoundCueSpec> = new Map(
  soundCueTable.map((c) => [c.id, c]),
);
