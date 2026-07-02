import { BreathClock } from './breath.js';
import { OscillatorEngine } from './audio.js';
import { HapticGrid } from './haptics.js';
import { Lexicon } from './lexicon.js';
import type { BreathPhase, StateConfig } from './types.js';

const PHASE_LABEL: Record<BreathPhase, string> = {
  inhale: 'Inhale',
  hold: 'Hold',
  exhale: 'Exhale',
};

/**
 * Live session view. One BreathClock drives everything: the orb animation,
 * the haptic grid, the oscillator engine's phase re-targeting, and the
 * lexicon's prompt rotation — all from the same phasechange event, so the
 * modalities can never drift apart.
 */
export class Session {
  private root: HTMLElement;
  private config: StateConfig;
  private onExit: () => void;

  private clock: BreathClock;
  private audio: OscillatorEngine;
  private haptics: HapticGrid;
  private lexicon: Lexicon;

  private orb: HTMLElement | null = null;
  private phaseEl: HTMLElement | null = null;
  private countEl: HTMLElement | null = null;
  private promptEl: HTMLElement | null = null;
  private cycleEl: HTMLElement | null = null;
  private audioBtn: HTMLButtonElement | null = null;
  private hapticBtn: HTMLButtonElement | null = null;

  private unsubscribers: Array<() => void> = [];
  private ended = false;

  constructor(root: HTMLElement, config: StateConfig, onExit: () => void) {
    this.root = root;
    this.config = config;
    this.onExit = onExit;
    this.clock = new BreathClock(config.breath);
    this.audio = new OscillatorEngine(config.audio);
    this.haptics = new HapticGrid(config.haptics);
    this.lexicon = new Lexicon(config);
  }

  start(): void {
    this.render();
    this.unsubscribers.push(
      this.clock.onPhaseChange(({ phase, cycle }) => {
        this.audio.setPhase(phase);
        this.haptics.onPhaseChange(phase);
        this.updatePhaseUi(phase, cycle);
      }),
      this.clock.onProgress(({ phase, t, remainingSec }) => {
        this.updateProgressUi(phase, t, remainingSec);
      }),
    );
    this.clock.start();
  }

  private async teardown(): Promise<void> {
    if (this.ended) return;
    // Flag first and freeze the controls: nothing may re-arm an engine while
    // the audio fade below is still awaiting.
    this.ended = true;
    if (this.audioBtn) this.audioBtn.disabled = true;
    if (this.hapticBtn) this.hapticBtn.disabled = true;
    this.clock.stop();
    for (const un of this.unsubscribers) un();
    this.unsubscribers = [];
    this.haptics.disable();
    await this.audio.stop();
  }

  private render(): void {
    const c = this.config;
    this.root.innerHTML = '';
    this.root.className = 'session';
    this.root.style.setProperty('--accent', c.accent);

    const bar = document.createElement('div');
    bar.className = 'session-bar';
    bar.innerHTML = `<span class="session-title">${c.title} <em>${c.subtitle}</em></span>`;
    const exitBtn = document.createElement('button');
    exitBtn.type = 'button';
    exitBtn.className = 'btn btn-ghost';
    exitBtn.textContent = 'End session';
    exitBtn.addEventListener('click', () => {
      void this.teardown().then(() => this.onExit());
    });
    bar.appendChild(exitBtn);
    this.root.appendChild(bar);

    const stage = document.createElement('div');
    stage.className = 'stage';
    stage.innerHTML = `
      <div class="orb-wrap">
        <div class="orb" id="orb"><span class="orb-count" id="count"></span></div>
        <div class="phase-label" id="phase">Ready</div>
      </div>
      <p class="prompt" id="prompt" aria-live="polite"></p>
      <p class="anchor-line">${c.anchor}</p>
      <p class="cycle-line" id="cycle"></p>
    `;
    this.root.appendChild(stage);

    const controls = document.createElement('div');
    controls.className = 'controls';

    this.audioBtn = document.createElement('button');
    this.audioBtn.type = 'button';
    this.audioBtn.className = 'btn';
    this.audioBtn.textContent = 'Enable sound';
    this.audioBtn.addEventListener('click', () => void this.toggleAudio());

    this.hapticBtn = document.createElement('button');
    this.hapticBtn.type = 'button';
    this.hapticBtn.className = 'btn';
    if (this.haptics.supported) {
      this.hapticBtn.textContent = 'Enable haptics';
      this.hapticBtn.addEventListener('click', () => this.toggleHaptics());
    } else {
      this.hapticBtn.textContent = 'Haptics unavailable on this device';
      this.hapticBtn.disabled = true;
    }

    controls.append(this.audioBtn, this.hapticBtn);
    this.root.appendChild(controls);

    this.orb = stage.querySelector('#orb');
    this.phaseEl = stage.querySelector('#phase');
    this.countEl = stage.querySelector('#count');
    this.promptEl = stage.querySelector('#prompt');
    this.cycleEl = stage.querySelector('#cycle');
  }

  private async toggleAudio(): Promise<void> {
    if (!this.audioBtn || this.ended) return;
    if (this.audio.enabled) {
      this.audioBtn.disabled = true;
      try {
        await this.audio.stop();
      } finally {
        // Session may have ended during the fade; keep the button frozen then.
        this.audioBtn.disabled = this.ended;
        this.audioBtn.textContent = 'Enable sound';
        this.audioBtn.classList.remove('btn-active');
      }
    } else {
      try {
        this.audio.start(this.clock.phase);
        this.audioBtn.textContent = 'Sound on (headphones)';
        this.audioBtn.classList.add('btn-active');
      } catch (err) {
        console.warn('Audio start failed:', err);
        this.audioBtn.textContent = 'Sound unavailable — tap to retry';
      }
    }
  }

  private toggleHaptics(): void {
    if (!this.hapticBtn || this.ended) return;
    if (this.haptics.enabled) {
      this.haptics.disable();
      this.hapticBtn.textContent = 'Enable haptics';
      this.hapticBtn.classList.remove('btn-active');
    } else {
      this.haptics.enable();
      this.haptics.onPhaseChange(this.clock.phase);
      this.hapticBtn.textContent = 'Haptics on';
      this.hapticBtn.classList.add('btn-active');
    }
  }

  private updatePhaseUi(phase: BreathPhase, cycle: number): void {
    if (this.phaseEl) this.phaseEl.textContent = PHASE_LABEL[phase];
    if (this.promptEl) {
      this.promptEl.classList.remove('prompt-in');
      // restart the fade-in animation
      void this.promptEl.offsetWidth;
      this.promptEl.textContent = this.lexicon.prompt(phase, cycle);
      this.promptEl.classList.add('prompt-in');
    }
    if (this.cycleEl) this.cycleEl.textContent = `Cycle ${cycle + 1}`;
    if (this.orb) this.orb.dataset['phase'] = phase;
  }

  private updateProgressUi(phase: BreathPhase, t: number, remainingSec: number): void {
    if (this.countEl) this.countEl.textContent = String(Math.ceil(remainingSec));
    if (!this.orb) return;
    // Orb breathes with the user: grows on inhale, holds, shrinks on exhale.
    let scale: number;
    switch (phase) {
      case 'inhale':
        scale = 0.6 + 0.4 * easeInOut(t);
        break;
      case 'hold':
        scale = 1 + 0.02 * Math.sin(t * Math.PI * 4); // faint shimmer
        break;
      case 'exhale':
        scale = 1 - 0.4 * easeInOut(t);
        break;
    }
    this.orb.style.transform = `scale(${scale.toFixed(4)})`;
  }
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
