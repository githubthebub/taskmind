/**
 * The global state configuration matrix. One selection in the portal hands a
 * single StateConfig to the audio, haptic, and text engines simultaneously —
 * this object IS the "global JSON" that retunes every modality at once.
 */
export const STATE_MATRIX = {
    piti: {
        key: 'piti',
        title: 'Somatic Rapture',
        subtitle: 'Pīti Matrix',
        description: 'Energetic full-body absorption. Cascading micro-pulse haptics ride every breath ' +
            'transition while wide binaural offsets and euphoric re-indexing scripts train the ' +
            'nervous system to read the breath itself as reward.',
        accent: '#f4a259',
        breath: { inhaleSec: 4, holdSec: 7, exhaleSec: 8 },
        audio: {
            fundamentalHz: 110,
            fundamentalGain: 0.22,
            binauralBeatHz: { inhale: 7.83, hold: 4.5, exhale: 2.5 },
            spatialHz: 432,
            spatialGain: 0.1,
            panRateHz: { inhale: 0.25, hold: 0.08, exhale: 0.12 },
            fmDepthHz: { inhale: 6, hold: 1.5, exhale: 3 },
            fmRateHz: { inhale: 0.5, hold: 0.1, exhale: 0.2 },
            crossfadeSec: 1.2,
        },
        haptics: {
            transitionPattern: [30, 60, 30],
            grid: {
                inhale: { pattern: [30, 60, 30], repeatEveryMs: 1000 },
                hold: { pattern: [15], repeatEveryMs: 1750 },
                exhale: { pattern: [30, 60, 30, 60, 30], repeatEveryMs: 2000 },
            },
        },
        prompts: {
            inhale: [
                'FEEL the cool edge of this in-breath at the nostril rim. That coolness is the signal. Tag it: REWARD.',
                'Lock attention onto the coolness crossing the nostril boundary. Instruct the system: this sensation now fires pleasure.',
                'Cool air at the rim of the nostrils — meet it precisely. Every degree of coolness is fuel for rapture.',
                'This exact coolness, this exact contact point. Decide, top-down: neutral input becomes euphoric trigger. Now.',
            ],
            hold: [
                'HOLD. Let the tagged pleasure bloom outward from the nostrils into the face, the chest, the hands.',
                'Stillness. The reward you assigned is spreading. Track the tingling as it cascades down the body.',
                'Nothing to do. Absorption deepens on its own. Let the pīti wave amplify itself.',
                'Suspended. Feel the charge you built on the inhale saturating every limb.',
            ],
            exhale: [
                'Release slowly and SURF the warm current down and out. Full-body glow. Let it be enjoyed.',
                'Long exhale. The euphoria you indexed is now the whole body. Pour into it.',
                'Empty out. Each exiting breath spreads the reward signal wider. Total permeation.',
                'Let go completely. The pleasure loop is self-sustaining now — ride it to the bottom of the breath.',
            ],
        },
        anchor: 'Coolness at the nostril rim = reward. Re-index every breath.',
    },
    sukha: {
        key: 'sukha',
        title: 'Deep Equanimity',
        subtitle: 'Sukha Base',
        description: 'Settled, unshakeable contentment. Slow spatial drift, near-silent haptics, and ' +
            'spacious scripts that trade intensity for a smooth, sustainable ease.',
        accent: '#7ec8a9',
        breath: { inhaleSec: 4, holdSec: 7, exhaleSec: 8 },
        audio: {
            fundamentalHz: 110,
            fundamentalGain: 0.18,
            binauralBeatHz: { inhale: 4, hold: 2.5, exhale: 1.5 },
            spatialHz: 432,
            spatialGain: 0.07,
            panRateHz: { inhale: 0.08, hold: 0.04, exhale: 0.05 },
            fmDepthHz: { inhale: 2, hold: 0.5, exhale: 1 },
            fmRateHz: { inhale: 0.15, hold: 0.05, exhale: 0.08 },
            crossfadeSec: 2.5,
        },
        haptics: {
            transitionPattern: [40],
            grid: {
                inhale: { pattern: [20], repeatEveryMs: 2000 },
                hold: null,
                exhale: null,
            },
        },
        prompts: {
            inhale: [
                'Breathe in. Nothing needs to change. The breath is already enough.',
                'Soft inhale. Let contentment sit underneath the sensation, wide and quiet.',
                'Draw the breath in gently. Notice: this moment is complete as it is.',
                'In. Ease is the baseline now, not the goal.',
            ],
            hold: [
                'Rest here. Steadiness without effort.',
                'Hold lightly. Equanimity is what remains when nothing is grasped.',
                'Still point. Let the mind be as level as the held breath.',
                'Pause. Everything is allowed to be exactly what it is.',
            ],
            exhale: [
                'Long, smooth release. Settle a layer deeper into ease.',
                'Exhale everything. What is left is sukha — quiet, reliable well-being.',
                'Let the out-breath lower you onto solid ground. Unshakeable.',
                'Release. Contentment does not depend on the next breath. It is already here.',
            ],
        },
        anchor: 'Ease as baseline. Nothing to chase, nothing to push away.',
    },
    flow: {
        key: 'flow',
        title: 'Peak Cognitive Acceleration',
        subtitle: 'Flow State',
        description: 'Task-ready executive focus. Crisp metronomic haptics, tighter modulation, and ' +
            'directive scripts that collapse attention onto a single working channel.',
        accent: '#6aa9ff',
        breath: { inhaleSec: 4, holdSec: 7, exhaleSec: 8 },
        audio: {
            fundamentalHz: 110,
            fundamentalGain: 0.2,
            binauralBeatHz: { inhale: 14, hold: 10, exhale: 8 },
            spatialHz: 432,
            spatialGain: 0.08,
            panRateHz: { inhale: 0.4, hold: 0.2, exhale: 0.25 },
            fmDepthHz: { inhale: 4, hold: 2, exhale: 2.5 },
            fmRateHz: { inhale: 0.8, hold: 0.4, exhale: 0.5 },
            crossfadeSec: 0.8,
        },
        haptics: {
            transitionPattern: [50],
            grid: {
                inhale: { pattern: [10], repeatEveryMs: 1000 },
                hold: { pattern: [10], repeatEveryMs: 1000 },
                exhale: { pattern: [10], repeatEveryMs: 1000 },
            },
        },
        prompts: {
            inhale: [
                'Inhale: gather every scattered thread of attention into one line.',
                'Draw in. One task. One channel. Everything else is background.',
                'Sharp intake. Prime the system: the next block of work is the only world.',
                'In. Narrow the beam. Distraction costs are now visible — refuse them.',
            ],
            hold: [
                'Hold: compress focus. Feel the single point sharpen.',
                'Static hold. The target task loads into working memory. Nothing else boards.',
                'Pressure builds usefully. Precision over speed.',
                'Hold the line. The mind is a closed loop around one objective.',
            ],
            exhale: [
                'Exhale: release the excess, keep the edge. Begin.',
                'Long out-breath. Drop the tension, keep the aim. Execute.',
                'Vent everything nonessential. What remains is pure task engagement.',
                'Release and engage. Flow is action with no leftover attention.',
            ],
        },
        anchor: 'One channel. Zero leakage. Execute.',
    },
};
export const STATE_ORDER = ['piti', 'sukha', 'flow'];
