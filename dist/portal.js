import { STATE_MATRIX, STATE_ORDER } from './states.js';
/**
 * Highest-State Selection Portal: the introductory dashboard. Renders one
 * card per entry in STATE_MATRIX; choosing a card hands its full StateConfig
 * to the session, retuning sound, tactile, and text modules in one move.
 */
export function renderPortal(root, onSelect) {
    root.innerHTML = '';
    root.className = 'portal';
    const header = document.createElement('header');
    header.className = 'portal-header';
    header.innerHTML = `
    <h1>Sensory Rewire</h1>
    <p class="tagline">Select your target state. Sound, touch, and script retune as one.</p>
  `;
    root.appendChild(header);
    const grid = document.createElement('div');
    grid.className = 'portal-grid';
    root.appendChild(grid);
    for (const key of STATE_ORDER) {
        grid.appendChild(buildCard(STATE_MATRIX[key], onSelect));
    }
    const foot = document.createElement('footer');
    foot.className = 'portal-foot';
    foot.innerHTML = `
    <p>Fully offline &middot; no accounts, no cloud, no tracking.
    Use headphones for the binaural layer; haptics require a device with a vibration motor.</p>
  `;
    root.appendChild(foot);
}
function buildCard(config, onSelect) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'state-card';
    card.style.setProperty('--accent', config.accent);
    card.setAttribute('aria-label', `Begin ${config.title} session`);
    const beat = config.audio.binauralBeatHz;
    card.innerHTML = `
    <span class="card-glyph" aria-hidden="true"></span>
    <h2>${config.title}</h2>
    <h3>${config.subtitle}</h3>
    <p>${config.description}</p>
    <dl class="card-specs">
      <div><dt>Breath</dt><dd>${config.breath.inhaleSec}–${config.breath.holdSec}–${config.breath.exhaleSec}</dd></div>
      <div><dt>Beat</dt><dd>${beat.inhale}→${beat.exhale} Hz</dd></div>
      <div><dt>Haptic</dt><dd>${config.haptics.transitionPattern.join('/')} ms</dd></div>
    </dl>
    <span class="card-cta">Enter ${config.subtitle}</span>
  `;
    card.addEventListener('click', () => onSelect(config));
    return card;
}
