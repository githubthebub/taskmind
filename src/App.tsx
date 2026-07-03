import { useMemo, useRef, useState } from 'react';
import type {
  AppSettings,
  ContinuationPath,
  PathCompletion,
  ProgressionState,
  SessionLogEntry,
  TriggerOutcome,
} from './types';
import SafetyGate from './components/SafetyGate';
import TriggerStage from './components/TriggerStage';
import PathSelector from './components/PathSelector';
import FastSettle from './components/FastSettle';
import Anapanasati from './components/Anapanasati';
import TantricPath from './components/TantricPath';
import ComboPath from './components/ComboPath';
import MudraLegend from './components/MudraLegend';
import SessionLogView from './components/SessionLogView';
import SettingsScreen from './components/SettingsScreen';
import { createSoundEngine } from './audio/soundEngine';
import { appendEntry, newSessionId } from './engine/sessionLog';
import {
  eyesClosedEligible,
  loadProgression,
  markLearnModeCompleted,
  recordCompletedSession,
} from './engine/progression';
import { loadSettings, saveSettings } from './engine/settings';

type Screen =
  | 'home'
  | 'gate'
  | 'trigger'
  | 'select'
  | 'path'
  | 'classic'
  | 'complete'
  | 'log'
  | 'settings'
  | 'learn';

function formatMs(ms: number | null): string {
  if (ms === null) return '—';
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const pathNames: Record<ContinuationPath | 'classic-anapanasati', string> = {
  'fast-settle': 'Fast Settle',
  anapanasati: 'Full Ānāpānasati',
  tantric: 'Extended Tantric',
  combo: 'Combo',
  'classic-anapanasati': 'Classic Ānāpānasati',
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [progression, setProgression] = useState<ProgressionState>(() => loadProgression());
  const [chosenPath, setChosenPath] = useState<ContinuationPath | null>(null);
  const [lastEntry, setLastEntry] = useState<SessionLogEntry | null>(null);

  const sound = useMemo(() => createSoundEngine(), []);
  const sessionStartedAt = useRef(0);
  const pathStartedAt = useRef(0);
  const triggerOutcome = useRef<TriggerOutcome | null>(null);

  const eyesClosed = settings.eyesClosedMode && eyesClosedEligible(progression);

  const updateSettings = (s: AppSettings) => {
    setSettings(s);
    saveSettings(s);
    sound.setEnabled(s.soundEnabled);
  };

  const finishSession = (
    path: ContinuationPath | 'classic-anapanasati' | null,
    completion: PathCompletion | null,
  ) => {
    const outcome = triggerOutcome.current;
    const raptureOnsetAt = outcome?.raptureOnsetAt ?? null;
    const settledAt = completion?.settledAt ?? null;
    const entry: SessionLogEntry = {
      id: newSessionId(),
      startedAt: sessionStartedAt.current,
      technique: path === 'classic-anapanasati' ? 'none' : settings.trigger.technique,
      path,
      raptureOnsetMs:
        raptureOnsetAt !== null ? raptureOnsetAt - sessionStartedAt.current : null,
      settledMs:
        settledAt !== null
          ? settledAt - (raptureOnsetAt ?? pathStartedAt.current)
          : null,
      roundsCompleted: outcome?.roundsCompleted ?? 0,
      stepsCompleted: completion?.stepsCompleted ?? null,
      stagesCompleted: completion?.stagesCompleted ?? null,
      mudraSetUsed: completion?.mudraSetUsed ?? '—',
      eyesClosed,
      completed: completion !== null && !completion.endedEarly,
      endedAt: Date.now(),
    };
    appendEntry(entry);
    setLastEntry(entry);
    if (entry.completed && path !== null) {
      setProgression(recordCompletedSession(path));
    }
    sound.stopPacing();
    sound.setIntensity(1);
    setScreen('complete');
  };

  const abortSession = () => {
    finishSession(chosenPath, null);
  };

  const beginSession = async () => {
    await sound.resume();
    sound.setEnabled(settings.soundEnabled);
    sound.setIntensity(1);
    triggerOutcome.current = null;
    setChosenPath(null);
    setScreen('gate');
  };

  const beginClassic = async () => {
    await sound.resume();
    sound.setEnabled(settings.soundEnabled);
    sound.setIntensity(1);
    triggerOutcome.current = null;
    setChosenPath(null);
    sessionStartedAt.current = Date.now();
    pathStartedAt.current = Date.now();
    setScreen('classic');
  };

  const pathScreenProps = {
    settings,
    progression,
    sound,
    sessionStartedAt: sessionStartedAt.current,
    raptureOnsetAt: triggerOutcome.current?.raptureOnsetAt ?? null,
    eyesClosed,
    onAbort: abortSession,
  };

  switch (screen) {
    case 'gate':
      return (
        <SafetyGate
          onCleared={() => {
            sessionStartedAt.current = Date.now();
            setScreen('trigger');
          }}
          onContraindicated={() => {
            // Breath-retention work stays locked; offer the gentle classic
            // practice instead (no forceful breathing, no retention).
            sessionStartedAt.current = Date.now();
            pathStartedAt.current = Date.now();
            setScreen('classic');
          }}
          onBack={() => setScreen('home')}
        />
      );

    case 'trigger':
      return (
        <TriggerStage
          settings={settings}
          sound={sound}
          sessionStartedAt={sessionStartedAt.current}
          onComplete={(outcome) => {
            triggerOutcome.current = outcome;
            setScreen('select');
          }}
          onAbort={abortSession}
        />
      );

    case 'select':
      return (
        <PathSelector
          outcome={triggerOutcome.current ?? { raptureOnsetAt: null, roundsCompleted: 0, skippedToSettle: true }}
          onSelect={(path) => {
            pathStartedAt.current = Date.now();
            setChosenPath(path);
            setScreen('path');
          }}
          onEndSession={() => finishSession(null, null)}
        />
      );

    case 'path': {
      const onComplete = (completion: PathCompletion) => finishSession(chosenPath, completion);
      switch (chosenPath) {
        case 'fast-settle':
          return <FastSettle {...pathScreenProps} onComplete={onComplete} />;
        case 'anapanasati':
          return <Anapanasati {...pathScreenProps} onComplete={onComplete} entryMode="post-trigger" />;
        case 'tantric':
          return <TantricPath {...pathScreenProps} onComplete={onComplete} />;
        case 'combo':
          return <ComboPath {...pathScreenProps} onComplete={onComplete} />;
        default:
          setScreen('home');
          return null;
      }
    }

    case 'classic':
      return (
        <Anapanasati
          {...pathScreenProps}
          onComplete={(completion) => finishSession('classic-anapanasati', completion)}
          entryMode="classic"
        />
      );

    case 'complete':
      return (
        <div className="screen screen-centered">
          <h1>Session complete</h1>
          {lastEntry && (
            <div className="card stack" style={{ minWidth: '280px', textAlign: 'left' }}>
              <div className="row-between">
                <span className="dim">Path</span>
                <span>{lastEntry.path ? pathNames[lastEntry.path] : 'Ended at selector'}</span>
              </div>
              <div className="row-between">
                <span className="dim">Time to rapture onset</span>
                <span>{formatMs(lastEntry.raptureOnsetMs)}</span>
              </div>
              {lastEntry.settledMs !== null && (
                <div className="row-between">
                  <span className="dim">Rapture onset → settled</span>
                  <span>{formatMs(lastEntry.settledMs)}</span>
                </div>
              )}
              <p className="faint">
                Times are from your own taps — self-reports, nothing measured.
              </p>
            </div>
          )}
          <p className="dim">However it went, it counts. See you next sit.</p>
          <button className="btn btn-primary" onClick={() => setScreen('home')}>
            Done
          </button>
        </div>
      );

    case 'log':
      return <SessionLogView onBack={() => setScreen('home')} />;

    case 'settings':
      return (
        <SettingsScreen
          settings={settings}
          progression={progression}
          onChange={updateSettings}
          onBack={() => setScreen('home')}
        />
      );

    case 'learn':
      return (
        <MudraLegend
          onComplete={(learned) => {
            setProgression(markLearnModeCompleted(learned));
            setScreen('home');
          }}
          onBack={() => setScreen('home')}
        />
      );

    case 'home':
    default:
      return (
        <div className="screen screen-centered">
          <h1>Stillpoint</h1>
          <p className="dim" style={{ maxWidth: '400px' }}>
            Breath-led practice: generate the spark, then choose where to take it.
          </p>
          <div className="stack" style={{ width: '100%', maxWidth: '360px' }}>
            <button className="btn btn-primary btn-block" onClick={beginSession}>
              Begin practice
            </button>
            <button className="btn btn-block" onClick={beginClassic}>
              Classic Ānāpānasati (gentle, no breathwork trigger)
            </button>
            <button className="btn btn-block" onClick={() => setScreen('learn')}>
              Learn the mudras
            </button>
            <div className="row" style={{ justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setScreen('log')}>
                Session log
              </button>
              <button className="btn btn-ghost" onClick={() => setScreen('settings')}>
                Settings
              </button>
            </div>
          </div>
          <p className="faint" style={{ maxWidth: '420px' }}>
            {progression.sessionsCompleted} session{progression.sessionsCompleted === 1 ? '' : 's'} completed
            · mudra tier {progression.mudraTier}
          </p>
          <p className="faint" style={{ maxWidth: '420px' }}>
            Practice seated or lying down only — never standing, never near water,
            never while driving.
          </p>
        </div>
      );
  }
}
