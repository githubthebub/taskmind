import { useMemo } from 'react';
import type { SessionLogEntry } from '../types';
import { downloadLog, loadLog } from '../engine/sessionLog';
import './misc.css';

export interface SessionLogViewProps {
  onBack: () => void;
}

const PATH_LABELS: Record<string, string> = {
  'fast-settle': 'Fast Settle',
  anapanasati: 'Ānāpānasati',
  tantric: 'Tantric',
  combo: 'Combo',
  'classic-anapanasati': 'Classic Ānāpānasati',
};

const TECHNIQUE_LABELS: Record<string, string> = {
  bhastrika: 'Bhastrika',
  tummo: 'Tummo',
  none: '—',
};

function fmtDuration(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms < 0) return '—';
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function fmtDate(epochMs: number): string {
  return new Date(epochMs).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Private session history. Data lives only on this device; export is a
 * manual, explicit action. Onset/settled times are the user's own
 * self-report taps — no detection of any state is claimed. No social or
 * comparison features, by design.
 */
export default function SessionLogView({ onBack }: SessionLogViewProps) {
  const entries = useMemo<SessionLogEntry[]>(
    () => loadLog().slice().sort((a, b) => b.startedAt - a.startedAt),
    [],
  );

  return (
    <div className="screen session-log">
      <div className="top-bar">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Back
        </button>
        <span>Session log</span>
      </div>

      <header className="stack">
        <h1>Your sessions</h1>
        <p className="faint">Stored only on this device. Export is manual.</p>
      </header>

      {entries.length === 0 ? (
        <div className="card log-empty">
          <p className="dim">
            No sessions yet. Your practice history will gather here, quietly.
          </p>
        </div>
      ) : (
        <div className="log-table-wrap">
          <table className="log-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Technique</th>
                <th>Path</th>
                <th>To onset</th>
                <th>To settled</th>
                <th>Rounds</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{fmtDate(e.startedAt)}</td>
                  <td>{TECHNIQUE_LABELS[e.technique] ?? e.technique}</td>
                  <td>{e.path ? PATH_LABELS[e.path] ?? e.path : '—'}</td>
                  <td>{fmtDuration(e.raptureOnsetMs)}</td>
                  <td>{fmtDuration(e.settledMs)}</td>
                  <td>{e.roundsCompleted}</td>
                  <td>{e.completed ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="faint">
        “To onset” and “to settled” are the times of your own self-report taps
        — a personal record, not a measurement of any state.
      </p>

      <footer className="stack">
        <button
          type="button"
          className="btn btn-block"
          disabled={entries.length === 0}
          onClick={downloadLog}
        >
          Export as JSON
        </button>
      </footer>
    </div>
  );
}
