import { EventBus } from './state/bus.js';
import { ProgressStore } from './state/store.js';
import { AvatarStateMachine } from './state/avatarStateMachine.js';
import { AVATAR_MACHINE } from './data/avatarMachine.js';
import { DialogueRotator } from './data/dialogue.js';
import { BreathEngine, PROTOCOL_478 } from './engine/breath.js';
import { HapticGrid } from './engine/haptics.js';
import { OscillatorComplex } from './engine/audio.js';
import { MilestoneTracker } from './engine/milestones.js';
import { AvatarView } from './ui/avatar.js';
import { BreathRing } from './ui/breathRing.js';
import { PromptGrid } from './ui/promptGrid.js';
import { NeuroPanel } from './ui/neuroPanel.js';
import { MudraPanel } from './ui/mudraPanel.js';
import { Hud } from './ui/hud.js';
import type { AvatarEvent, BreathPhase } from './types.js';

function el(id: string): HTMLElement {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id} in index.html`);
  return node;
}

const bus = new EventBus();
const store = new ProgressStore();
const breath = new BreathEngine(bus, PROTOCOL_478);
const haptics = new HapticGrid(bus);
const audio = new OscillatorComplex(bus);
const machine = new AvatarStateMachine(AVATAR_MACHINE);
const dialogue = new DialogueRotator();

const avatar = new AvatarView(el('avatar'));
const ring = new BreathRing(el('ring'));
const prompts = new PromptGrid(el('prompts'));
const neuro = new NeuroPanel(el('neuro'));
const hud = new Hud(el('hud'));
const mudra = new MudraPanel(el('mudra'), (m) => {
  avatar.setMudra(m ? m.id : null);
  store.update({ mudraMode: m !== null, mudraId: m ? m.id : store.get().mudraId });
  if (m) avatar.say(m.cue, 8000);
});

const startBtn = el('start-btn') as HTMLButtonElement;
const hapticsToggle = el('haptics-toggle') as HTMLInputElement;
const audioToggle = el('audio-toggle') as HTMLInputElement;

// ---- Avatar state machine wiring ----

/** Coaching-phase lines every cycle would be noise; speak them sparsely. */
const SPARSE_POOLS = new Set(['inhale', 'hold', 'exhale']);

machine.onChange((_id, node) => {
  avatar.applyState(node);
  const sparse = SPARSE_POOLS.has(node.dialoguePool);
  if (!sparse || breath.cycles === 0 || breath.cycles % 3 === 0) {
    avatar.say(dialogue.next(node.dialoguePool));
  }
});

function sendAvatar(event: AvatarEvent): void {
  machine.send(event);
}

const PHASE_EVENT: Record<Exclude<BreathPhase, 'idle'>, AvatarEvent> = {
  inhale: 'PHASE_INHALE',
  hold: 'PHASE_HOLD',
  exhale: 'PHASE_EXHALE',
};

// ---- Engine event wiring ----

bus.on('sessionStart', () => sendAvatar('SESSION_START'));

bus.on('tick', (tick) => {
  ring.update(tick);
  avatar.syncBreath(tick);
  neuro.update(tick.elapsedMs);
});

bus.on('transition', ({ from, to, cycleCount }) => {
  if (to === 'idle') return;
  if (from === 'exhale' && to === 'inhale' && cycleCount > 0) {
    sendAvatar('CYCLE_COMPLETE');
    avatar.celebrate();
  }
  sendAvatar(PHASE_EVENT[to]);
  // One prompt per cycle, delivered as the new inhale begins.
  if (to === 'inhale') {
    prompts.showFor('inhale', store.get().companionLevel);
  }
});

// Constructed AFTER the transition wiring above: bus listeners run in
// registration order, and the avatar must receive CYCLE_COMPLETE (entering
// 'celebrating-cycle', the only state with a MILESTONE_REACHED edge) before
// the tracker synchronously emits 'milestone'/'levelUp' for that same cycle.
const milestones = new MilestoneTracker(bus, store);

bus.on('focusBroken', () => sendAvatar('FOCUS_BROKEN'));

bus.on('milestone', (m) => {
  sendAvatar('MILESTONE_REACHED');
  avatar.say(`${dialogue.next('milestone')} (${m.title})`, 6500);
  avatar.celebrate();
});

bus.on('levelUp', ({ level }) => {
  sendAvatar('LEVEL_UP');
  avatar.setLevel(level);
  avatar.celebrate();
});

bus.on('progress', (p) => hud.render(p));

// ---- Controls ----

startBtn.addEventListener('click', () => {
  if (breath.running) {
    const cycles = breath.cycles;
    breath.stop();
    milestones.finishSession(cycles);
    sendAvatar('SESSION_END');
    ring.reset();
    prompts.clear();
    neuro.freeze();
    avatar.setIdle();
    startBtn.textContent = 'Begin';
    startBtn.classList.remove('active');
  } else {
    void audio.resume(); // inside the user gesture, for autoplay policy
    neuro.reset();
    neuro.show();
    breath.start();
    startBtn.textContent = 'End session';
    startBtn.classList.add('active');
  }
});

hapticsToggle.addEventListener('change', () => {
  haptics.setEnabled(hapticsToggle.checked);
  store.update({ hapticsEnabled: hapticsToggle.checked });
});

audioToggle.addEventListener('change', () => {
  audio.setEnabled(audioToggle.checked);
  store.update({ audioEnabled: audioToggle.checked });
  if (audioToggle.checked && breath.running) void audio.resume();
});

// ---- Boot ----

const initial = store.get();
hapticsToggle.checked = initial.hapticsEnabled;
audioToggle.checked = initial.audioEnabled;
haptics.setEnabled(initial.hapticsEnabled);
audio.setEnabled(initial.audioEnabled);
avatar.setLevel(initial.companionLevel);
mudra.restore(initial.mudraMode, initial.mudraId);
if (initial.mudraMode) avatar.setMudra(initial.mudraId);
hud.render(initial);
avatar.say(dialogue.next('welcome'), 6000);

if (!haptics.available) {
  hapticsToggle.disabled = true;
  (hapticsToggle.closest('.toggle') as HTMLElement | null)?.classList.add('unsupported');
}

// Offline-first: register the service worker (no-op on file:// or unsupported).
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* offline cache unavailable; app still fully functional */
    });
  });
}
