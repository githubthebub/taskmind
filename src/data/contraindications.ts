/**
 * Section 5 safety gate content. The gate precedes Stage 0 for EVERY session,
 * on every path, with no bypass. Forceful breathwork with retention is locked
 * unless the user confirms that none of these apply; a contraindicated user is
 * offered gentle classic practice (no forceful breathing, no retention) instead.
 */

export interface ContraindicationItem {
  id: string;
  label: string;
  detail: string;
}

export const contraindications: ContraindicationItem[] = [
  {
    id: 'pregnancy',
    label: 'Pregnancy',
    detail: 'Forceful breathing and breath retention are not recommended during pregnancy.',
  },
  {
    id: 'high-blood-pressure',
    label: 'High blood pressure',
    detail: 'Retention and abdominal locks can raise blood pressure further.',
  },
  {
    id: 'cardiovascular',
    label: 'Cardiovascular conditions',
    detail: 'Heart conditions of any kind — this practice stresses the cardiovascular system.',
  },
  {
    id: 'epilepsy',
    label: 'Epilepsy or seizure history',
    detail: 'Rapid breathing can lower the seizure threshold.',
  },
  {
    id: 'panic-disorder',
    label: 'Panic disorder',
    detail: 'Breath retention and intense body sensations can trigger panic responses.',
  },
  {
    id: 'hernia',
    label: 'Hernia',
    detail: 'Abdominal locks and forceful breathing strain the abdominal wall.',
  },
  {
    id: 'abdominal-surgery',
    label: 'Recent abdominal surgery',
    detail: 'Allow full recovery and medical clearance before abdominal engagement.',
  },
  {
    id: 'glaucoma',
    label: 'Glaucoma',
    detail: 'Retention can raise intraocular pressure.',
  },
];

export interface EnvironmentAffirmation {
  id: string;
  label: string;
}

/** All must be affirmed every session; position and environment are non-negotiable. */
export const environmentAffirmations: EnvironmentAffirmation[] = [
  { id: 'seated-or-lying', label: 'I am seated or lying down — not standing.' },
  { id: 'not-near-water', label: 'I am not in or near water.' },
  { id: 'not-driving', label: 'I am not driving or operating anything.' },
];
