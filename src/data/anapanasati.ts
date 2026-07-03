import type { AnapanasatiStep } from '../types';

/** The 16 steps of ānāpānasati across the four tetrads (MN 118), faithful. */
export const anapanasatiSteps: AnapanasatiStep[] = [
  { tetrad: 1, tetradName: 'Body (kāya)', step: 1, instruction: "Breathing in long, know 'I am breathing in long.' Breathing out long, know 'I am breathing out long.'", attentionObject: 'long breath' },
  { tetrad: 1, tetradName: 'Body (kāya)', step: 2, instruction: "Breathing in short, know 'I am breathing in short.' Breathing out short, know 'I am breathing out short.'", attentionObject: 'short breath' },
  { tetrad: 1, tetradName: 'Body (kāya)', step: 3, instruction: 'Breathing in, experience the whole body. Breathing out, experience the whole body.', attentionObject: 'whole body' },
  { tetrad: 1, tetradName: 'Body (kāya)', step: 4, instruction: 'Breathing in, calm the bodily formations. Breathing out, calm the bodily formations.', attentionObject: 'calming the body' },
  { tetrad: 2, tetradName: 'Feeling (vedanā)', step: 5, instruction: 'Breathing in, experience joy (pīti). Breathing out, experience joy.', attentionObject: 'joy (pīti)' },
  { tetrad: 2, tetradName: 'Feeling (vedanā)', step: 6, instruction: 'Breathing in, experience pleasure (sukha). Breathing out, experience pleasure.', attentionObject: 'pleasure (sukha)' },
  { tetrad: 2, tetradName: 'Feeling (vedanā)', step: 7, instruction: 'Breathing in, experience the mental formations. Breathing out, experience the mental formations.', attentionObject: 'mental formations' },
  { tetrad: 2, tetradName: 'Feeling (vedanā)', step: 8, instruction: 'Breathing in, calm the mental formations. Breathing out, calm the mental formations.', attentionObject: 'calming the mind-states' },
  { tetrad: 3, tetradName: 'Mind (citta)', step: 9, instruction: 'Breathing in, experience the mind. Breathing out, experience the mind.', attentionObject: 'the mind itself' },
  { tetrad: 3, tetradName: 'Mind (citta)', step: 10, instruction: 'Breathing in, gladden the mind. Breathing out, gladden the mind.', attentionObject: 'gladdening the mind' },
  { tetrad: 3, tetradName: 'Mind (citta)', step: 11, instruction: 'Breathing in, concentrate the mind. Breathing out, concentrate the mind.', attentionObject: 'concentrating the mind' },
  { tetrad: 3, tetradName: 'Mind (citta)', step: 12, instruction: 'Breathing in, liberate the mind. Breathing out, liberate the mind.', attentionObject: 'liberating the mind' },
  { tetrad: 4, tetradName: 'Insight (dhamma)', step: 13, instruction: 'Breathing in, contemplate impermanence. Breathing out, contemplate impermanence.', attentionObject: 'impermanence' },
  { tetrad: 4, tetradName: 'Insight (dhamma)', step: 14, instruction: 'Breathing in, contemplate dispassion. Breathing out, contemplate dispassion.', attentionObject: 'dispassion' },
  { tetrad: 4, tetradName: 'Insight (dhamma)', step: 15, instruction: 'Breathing in, contemplate cessation. Breathing out, contemplate cessation.', attentionObject: 'cessation' },
  { tetrad: 4, tetradName: 'Insight (dhamma)', step: 16, instruction: 'Breathing in, contemplate relinquishment. Breathing out, contemplate relinquishment.', attentionObject: 'relinquishment' },
];
