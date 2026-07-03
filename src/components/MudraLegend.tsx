import { useState } from 'react';
import type { MudraId, MudraShape } from '../types';
import { mudraList } from '../data/mudras';
import HandMudra from './figure/HandMudra';
import './figure/figure.css';

/**
 * Learn-mode legend — a separate, unhurried walkthrough of every mudra,
 * one at a time. Completing it is what unlocks eyes-closed live sessions,
 * so each shape is shown large with its name, Sanskrit name, and meaning.
 * No timers, no pressure: the user moves on when they feel they know it.
 */

export interface MudraLegendProps {
  onComplete: (learned: MudraId[]) => void;
  onBack: () => void;
}

const PLACEMENT_LABEL: Record<MudraShape['placement'], string> = {
  knees: 'resting on the knees',
  lap: 'resting in the lap',
  heart: 'held at the heart',
};

const PALM_LABEL: Record<MudraShape['palm'], string> = {
  up: 'palms open upward',
  down: 'palms facing down',
  inward: 'palms turned toward each other',
};

export default function MudraLegend({ onComplete, onBack }: MudraLegendProps) {
  const [index, setIndex] = useState(0);
  const mudra = mudraList[index];
  const isLast = index === mudraList.length - 1;

  const advance = () => {
    if (isLast) {
      onComplete(mudraList.map((m) => m.id));
    } else {
      setIndex(index + 1);
    }
  };

  return (
    <div className="screen mudra-legend">
      <div className="top-bar">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Back
        </button>
        <span>
          Learn the mudrās · {index + 1} of {mudraList.length}
        </span>
      </div>

      <div className="card stack" aria-live="polite">
        <div className="legend-hands" data-placement={mudra.placement}>
          <div className="legend-hand">
            <HandMudra shape={mudra} side="left" />
          </div>
          <div className="legend-hand">
            <HandMudra shape={mudra} side="right" />
          </div>
        </div>
        <h2>{mudra.name}</h2>
        <p className="legend-sanskrit">{mudra.sanskritName}</p>
        <p className="dim">{mudra.meaning}</p>
        <p className="faint">
          {PALM_LABEL[mudra.palm]} · {PLACEMENT_LABEL[mudra.placement]}
        </p>
      </div>

      <div className="legend-dots" aria-hidden="true">
        {mudraList.map((m, i) => (
          <span key={m.id} className={i <= index ? 'legend-dot legend-dot-seen' : 'legend-dot'} />
        ))}
      </div>

      <div className="stack">
        <button type="button" className="btn btn-primary btn-block" onClick={advance}>
          {isLast ? 'I know them all' : 'Got it — next'}
        </button>
        {index > 0 && (
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => setIndex(index - 1)}
          >
            Show me the previous one again
          </button>
        )}
      </div>

      <p className="faint legend-note">
        Shape each mudrā with your own hands as you go — knowing them by feel is
        what opens eyes-closed practice later. There's no clock here; take all
        the time you like.
      </p>
    </div>
  );
}
