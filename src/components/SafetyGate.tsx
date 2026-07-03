import { useState } from 'react';
import type { SafetyGateProps } from '../types';
import {
  contraindications,
  environmentAffirmations,
} from '../data/contraindications';
import './misc.css';

/**
 * THE hard safety gate. Shown before Stage 0 on EVERY session, with no
 * bypass and no memory of previous answers — the confirmations are fresh
 * each time, by design. Do not add persistence or a skip path.
 */
export default function SafetyGate({
  onCleared,
  onContraindicated,
  onBack,
}: SafetyGateProps) {
  // Per-session state only. Never persisted, never pre-filled.
  const [noneApply, setNoneApply] = useState(false);
  const [env, setEnv] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(environmentAffirmations.map((a) => [a.id, false])),
  );

  const allEnvChecked = environmentAffirmations.every((a) => env[a.id]);
  const ready = noneApply && allEnvChecked;

  const setEnvChecked = (id: string, checked: boolean) => {
    setEnv((prev) => ({ ...prev, [id]: checked }));
  };

  return (
    <div className="screen safety-gate">
      <div className="top-bar">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Back
        </button>
        <span>Safety check — every session</span>
      </div>

      <header className="stack">
        <h1>Before we begin</h1>
        <p className="dim">
          Forceful breathing with retention is a strong practice, and it is not
          for every body.
        </p>
      </header>

      <section className="card stack" aria-label="Contraindications">
        <h3>Please read through these</h3>
        <ul className="gate-items">
          {contraindications.map((c) => (
            <li key={c.id} className="gate-item">
              <span className="gate-item-label">{c.label}</span>
              <span className="gate-item-detail">{c.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="stack" aria-label="Your response">
        <label className="check gate-affirm">
          <input
            type="checkbox"
            checked={noneApply}
            onChange={(e) => setNoneApply(e.target.checked)}
          />
          <span>I confirm none of the above apply to me.</span>
        </label>

        <div className="card stack gate-alt">
          <p className="dim">
            If one of them does apply, that’s completely fine — this practice
            will keep. We’ll offer you a gentle breath practice instead, with
            no forceful breathing and no retention.
          </p>
          <button
            type="button"
            className="btn btn-calm btn-block gate-big-btn"
            onClick={onContraindicated}
          >
            One of these applies to me
          </button>
        </div>
      </section>

      <section className="stack" aria-label="Right now">
        <h3>And right now</h3>
        {environmentAffirmations.map((a) => (
          <label key={a.id} className="check gate-affirm">
            <input
              type="checkbox"
              checked={!!env[a.id]}
              onChange={(e) => setEnvChecked(a.id, e.target.checked)}
            />
            <span>{a.label}</span>
          </label>
        ))}
      </section>

      <p className="gate-static-line">
        Seated or lying down only. Never standing, never in or near water,
        never while driving.
      </p>

      <footer className="stack">
        <button
          type="button"
          className="btn btn-primary btn-block gate-big-btn"
          disabled={!ready}
          onClick={onCleared}
        >
          Begin
        </button>
        {!ready && (
          <p className="faint gate-hint">
            The four confirmations above open the way — fresh every session, by
            design.
          </p>
        )}
      </footer>
    </div>
  );
}
