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
import { PersonaPicker } from './ui/personaPicker.js';
import { Hud } from './ui/hud.js';
function el(id) {
    const node = document.getElementById(id);
    if (!node)
        throw new Error(`Missing #${id} in index.html`);
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
    if (m)
        avatar.say(m.cue, 8000);
});
const persona = new PersonaPicker(el('persona'), (p) => {
    store.update({ personaId: p });
    avatar.say(dialogue.next(p, 'welcome'), 6000); // hear the new voice immediately
});
const startBtn = el('start-btn');
const hapticsToggle = el('haptics-toggle');
const audioToggle = el('audio-toggle');
// ---- Avatar state machine wiring ----
/** Coaching-phase lines every cycle would be noise; speak them sparsely. */
const SPARSE_POOLS = new Set(['inhale', 'hold', 'exhale']);
machine.onChange((_id, node) => {
    avatar.applyState(node);
    const sparse = SPARSE_POOLS.has(node.dialoguePool);
    if (!sparse || breath.cycles === 0 || breath.cycles % 3 === 0) {
        avatar.say(dialogue.next(persona.persona, node.dialoguePool));
    }
});
function sendAvatar(event) {
    machine.send(event);
}
const PHASE_EVENT = {
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
    if (to === 'idle')
        return;
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
    avatar.say(`${dialogue.next(persona.persona, 'milestone')} (${m.title})`, 6500);
    avatar.celebrate();
});
bus.on('levelUp', ({ level }) => {
    sendAvatar('LEVEL_UP');
    avatar.setLevel(level);
    avatar.celebrate();
});
bus.on('progress', (p) => hud.render(p));
// ---- Controls ----
/** Session debrief: hard numbers, phrased in the active voice's register. */
function debriefLine(cycles, verified, seconds) {
    const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    const n = (count) => `${count} cycle${count === 1 ? '' : 's'}`;
    switch (persona.persona) {
        case 'challenger':
            return `Debrief: ${n(cycles)}, ${verified} verified, ${clock} on the clock. Real numbers. Run it back tomorrow.`;
        case 'alchemist':
            return `Receipt: ${verified} verified ${verified === 1 ? 'cycle' : 'cycles'} of calm in ${clock}, for the price of nothing. Best trade you'll make today.`;
        case 'sage':
            return `Session: ${n(cycles)}, ${verified} verified, ${clock} steady. Notice how you feel — that's yours.`;
    }
}
let sessionStartedAt = 0;
let verifiedAtStart = 0;
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
        const verified = store.get().verifiedCycles - verifiedAtStart;
        const seconds = Math.round((performance.now() - sessionStartedAt) / 1000);
        if (cycles > 0)
            avatar.say(debriefLine(cycles, verified, seconds), 9000);
    }
    else {
        void audio.resume(); // inside the user gesture, for autoplay policy
        sessionStartedAt = performance.now();
        verifiedAtStart = store.get().verifiedCycles;
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
    if (audioToggle.checked && breath.running)
        void audio.resume();
});
// ---- Boot ----
const initial = store.get();
hapticsToggle.checked = initial.hapticsEnabled;
audioToggle.checked = initial.audioEnabled;
haptics.setEnabled(initial.hapticsEnabled);
audio.setEnabled(initial.audioEnabled);
avatar.setLevel(initial.companionLevel);
mudra.restore(initial.mudraMode, initial.mudraId);
if (initial.mudraMode)
    avatar.setMudra(initial.mudraId);
persona.set(initial.personaId);
hud.render(initial);
avatar.say(dialogue.next(initial.personaId, 'welcome'), 6000);
if (!haptics.available) {
    hapticsToggle.disabled = true;
    hapticsToggle.closest('.toggle')?.classList.add('unsupported');
}
// Offline-first: register the service worker (no-op on file:// or unsupported).
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {
            /* offline cache unavailable; app still fully functional */
        });
    });
}
