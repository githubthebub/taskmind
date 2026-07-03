import type { ContinuationPath, PathSelectorProps } from '../types';
import './path-a.css';

/**
 * Post-trigger path selector. Shown immediately after the Rapture Onset
 * self-report tap (or the explicit "skip to settling" choice). The headline
 * reflects what the user just reported — reported, never detected.
 */

interface PathCardCopy {
  path: ContinuationPath;
  title: string;
  /** Shown when the user reported Rapture Onset. */
  description: string;
  /** Shown when they skipped without a tap — no state is asserted for them. */
  descriptionNoRapture: string;
  tag: string;
}

const PATH_CARDS: PathCardCopy[] = [
  {
    path: 'fast-settle',
    title: 'Fast Settle',
    description: 'Ride the rapture straight into stillness. Short and direct.',
    descriptionNoRapture: 'Settle straight into stillness. Short and direct.',
    tag: 'soft jhāna, Brasington-style',
  },
  {
    path: 'anapanasati',
    title: 'Full Ānāpānasati',
    description:
      'Use the rapture as a doorway into the traditional 16-step practice. Slow and deep.',
    descriptionNoRapture:
      'Enter the traditional 16-step practice from right where you are. Slow and deep.',
    tag: 'sixteen steps, four tetrads',
  },
  {
    path: 'tantric',
    title: 'Extended Tantric',
    description: 'Carry the energy through locks, centers, and mudra work.',
    descriptionNoRapture: 'Work through locks, centers, and mudra practice.',
    tag: 'bandhas, chakras, mudrās',
  },
  {
    path: 'combo',
    title: 'Combo',
    description:
      'The tantric sequence, annotated with ānāpānasati correspondences. A personal synthesis.',
    descriptionNoRapture:
      'The tantric sequence, annotated with ānāpānasati correspondences. A personal synthesis.',
    tag: 'tantric + ānāpānasati notes',
  },
];

export default function PathSelector({
  outcome,
  onSelect,
  onEndSession,
}: PathSelectorProps) {
  // Rapture Onset is a self-report tap; the headline only echoes what the
  // user themselves reported.
  const reportedRapture = outcome.raptureOnsetAt !== null;

  const headline = reportedRapture
    ? 'You’ve got that rapture going — where do you want to take it?'
    : 'No rush — choose how you’d like to continue.';

  const subline = reportedRapture
    ? 'Whatever you tapped for is yours to work with. Each path takes it somewhere different.'
    : 'Settling is a practice in itself. Any of these can begin from right where you are.';

  return (
    <div className="screen path-select">
      <header className="stack path-select-header">
        <h1>{headline}</h1>
        <p className="dim">{subline}</p>
      </header>

      <main className="stack path-select-list">
        {PATH_CARDS.map((card) => (
          <button
            key={card.path}
            type="button"
            className="card path-card"
            onClick={() => onSelect(card.path)}
          >
            <span className="path-card-title">{card.title}</span>
            <span className="path-card-desc">
              {reportedRapture ? card.description : card.descriptionNoRapture}
            </span>
            <span className="path-card-tag">{card.tag}</span>
          </button>
        ))}
      </main>

      <footer className="path-select-footer">
        <button type="button" className="btn btn-ghost" onClick={onEndSession}>
          End session here
        </button>
      </footer>
    </div>
  );
}
