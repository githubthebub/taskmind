import type { PathScreenProps } from '../types';
import { comboCorrespondences, comboFraming } from '../data/tantric';
import TantricPath from './TantricPath';

/**
 * Path D — Combo. Explicitly the Path C (Extended Tantric) engine as the
 * outer structure, annotated with Path B (ānāpānasati) tetrad / jhāna-factor
 * correspondence labels where they are genuine, and framed as personal
 * synthesis — not shared canonical lineage — where they are not.
 */
export default function ComboPath(props: PathScreenProps) {
  return (
    <TantricPath
      {...props}
      correspondences={comboCorrespondences}
      framing={comboFraming}
    />
  );
}
