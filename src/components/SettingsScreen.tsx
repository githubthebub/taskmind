import type {
  AppSettings,
  ProgressionState,
  TriggerConfig,
  TriggerTechnique,
} from '../types';
import { MUDRA_TIER_THRESHOLDS, SOFT_RETENTION_CAP_SECONDS } from '../constants';
import { eyesClosedEligible } from '../engine/progression';
import './misc.css';

export interface SettingsScreenProps {
  settings: AppSettings;
  progression: ProgressionState;
  onChange: (s: AppSettings) => void;
  onBack: () => void;
}

/**
 * Every value here changes only by explicit user action. Nothing in the app
 * auto-increases retention duration or practice intensity; the soft retention
 * cap is fixed in code (pending clinician review) and shown read-only.
 * Unlocks are practice-gated — never payment-gated.
 */

interface StepperProps {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}

function Stepper({ label, hint, value, min, max, onChange }: StepperProps) {
  return (
    <div className="settings-row">
      <span className="settings-row-text">
        <span>{label}</span>
        {hint && <span className="faint">{hint}</span>}
      </span>
      <span className="stepper" role="group" aria-label={label}>
        <button
          type="button"
          className="stepper-btn"
          aria-label={`Fewer: ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          −
        </button>
        <span className="stepper-value">{value}</span>
        <button
          type="button"
          className="stepper-btn"
          aria-label={`More: ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          +
        </button>
      </span>
    </div>
  );
}

interface ToggleProps {
  label: string;
  note?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ label, note, checked, disabled, onChange }: ToggleProps) {
  return (
    <label className={`check settings-toggle${disabled ? ' settings-locked' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="settings-row-text">
        <span>{label}</span>
        {note && <span className="faint">{note}</span>}
      </span>
    </label>
  );
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string; disabled?: boolean }[];
  onSelect: (v: T) => void;
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onSelect,
}: SegmentedProps<T>) {
  return (
    <div className="settings-row">
      <span className="settings-row-text">
        <span>{label}</span>
      </span>
      <span className="seg" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`seg-btn${value === o.value ? ' seg-on' : ''}`}
            aria-pressed={value === o.value}
            disabled={o.disabled}
            onClick={() => onSelect(o.value)}
          >
            {o.label}
          </button>
        ))}
      </span>
    </div>
  );
}

export default function SettingsScreen({
  settings,
  progression,
  onChange,
  onBack,
}: SettingsScreenProps) {
  const set = (patch: Partial<AppSettings>) =>
    onChange({ ...settings, ...patch });
  const setTrigger = (patch: Partial<TriggerConfig>) =>
    onChange({ ...settings, trigger: { ...settings.trigger, ...patch } });

  const tier2Unlocked = progression.mudraTier >= 2;
  const sessionsToTier2 = Math.max(
    0,
    MUDRA_TIER_THRESHOLDS.tier2 - progression.sessionsCompleted,
  );
  const tier2Note = tier2Unlocked
    ? undefined
    : `Unlocks at tier 2 — ${sessionsToTier2} more session${
        sessionsToTier2 === 1 ? '' : 's'
      }. Practice-gated, never paid.`;

  const eyesReady = eyesClosedEligible(progression);
  const eyesNote = eyesReady
    ? 'Audio-only live sessions with a near-dark screen.'
    : 'Complete the mudra learn-mode first.';

  return (
    <div className="screen settings-screen">
      <div className="top-bar">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Back
        </button>
        <span>Settings</span>
      </div>

      <header className="stack">
        <h1>Settings</h1>
        <p className="dim">Shape the practice to fit you. Nothing changes on its own.</p>
      </header>

      <section className="card stack settings-section" aria-label="Trigger stage">
        <h3>Trigger stage</h3>
        <Segmented<TriggerTechnique>
          label="Technique"
          value={settings.trigger.technique}
          options={[
            { value: 'bhastrika', label: 'Bhastrika' },
            { value: 'tummo', label: 'Tummo' },
          ]}
          onSelect={(technique) => setTrigger({ technique })}
        />
        <Stepper
          label="Rounds"
          value={settings.trigger.rounds}
          min={1}
          max={5}
          onChange={(rounds) => setTrigger({ rounds })}
        />
        <div className="settings-row settings-row-col">
          <span className="row-between">
            <span>Breaths per round</span>
            <span className="dim">{settings.trigger.breathsPerRound}</span>
          </span>
          <input
            className="settings-range"
            type="range"
            min={15}
            max={40}
            step={1}
            value={settings.trigger.breathsPerRound}
            aria-label="Breaths per round"
            onChange={(e) =>
              setTrigger({ breathsPerRound: Number(e.target.value) })
            }
          />
        </div>
        <Toggle
          label="Retention after each round"
          note="A relaxed hold after the round’s final exhale. No countdowns, ever."
          checked={settings.trigger.retentionAfterRound}
          onChange={(retentionAfterRound) => setTrigger({ retentionAfterRound })}
        />
        <Stepper
          label="Rounds before check-in"
          hint="After this many rounds without a tap, we gently check in."
          value={settings.maxRoundsBeforePrompt}
          min={1}
          max={6}
          onChange={(maxRoundsBeforePrompt) => set({ maxRoundsBeforePrompt })}
        />
      </section>

      <section className="card stack settings-section" aria-label="Ānāpānasati path">
        <h3>Ānāpānasati path</h3>
        <Stepper
          label="Breaths per step"
          hint="Breath cycles to rest with each of the sixteen steps."
          value={settings.breathsPerStep}
          min={2}
          max={10}
          onChange={(breathsPerStep) => set({ breathsPerStep })}
        />
        <Toggle
          label="Softly auto-advance steps"
          note="Move on after those breaths — or stay fully self-paced."
          checked={settings.autoAdvanceSteps}
          onChange={(autoAdvanceSteps) => set({ autoAdvanceSteps })}
        />
      </section>

      <section className="card stack settings-section" aria-label="Sound">
        <h3>Sound</h3>
        <Toggle
          label="Sound cues"
          checked={settings.soundEnabled}
          onChange={(soundEnabled) => set({ soundEnabled })}
        />
        <Segmented<AppSettings['cueTempo']>
          label="Cue tempo"
          value={settings.cueTempo}
          options={[
            { value: 'standard', label: 'Standard' },
            { value: 'brisk', label: 'Brisk', disabled: !tier2Unlocked },
          ]}
          onSelect={(cueTempo) => set({ cueTempo })}
        />
        {tier2Note && <p className="faint settings-lock-note">{tier2Note}</p>}
      </section>

      <section className="card stack settings-section" aria-label="Deeper practice">
        <h3>Deeper practice</h3>
        <Toggle
          label="Advanced mudrā chains"
          note={tier2Note ?? 'Longer mudrā sequences on the tantric paths.'}
          checked={settings.advancedMudraChains}
          disabled={!tier2Unlocked}
          onChange={(advancedMudraChains) => set({ advancedMudraChains })}
        />
        <Toggle
          label="Eyes-closed mode"
          note={eyesNote}
          checked={settings.eyesClosedMode}
          disabled={!eyesReady}
          onChange={(eyesClosedMode) => set({ eyesClosedMode })}
        />
      </section>

      <footer className="settings-footer">
        <p className="faint">
          Stillpoint never auto-increases retention time or intensity. Every
          adjustment on this screen is an explicit choice you make.
        </p>
        <p className="faint">
          Soft retention cap: {SOFT_RETENTION_CAP_SECONDS} seconds — fixed and
          read-only. At that point a gentle release cue plays; never a
          countdown, never an alarm. This is a deliberately conservative
          placeholder pending clinician review.
        </p>
      </footer>
    </div>
  );
}
