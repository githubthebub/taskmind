/**
 * The coach's behavior is a strict local JSON state machine: pure data, no
 * logic. The interpreter (state/avatarStateMachine.ts) is the only thing that
 * walks it, and unknown events in a state are simply ignored.
 *
 * Relational protocol: collaborative and high-encouragement — the coach
 * validates effort before outcome, treats broken focus as information rather
 * than failure, and celebrates in proportion to what was actually earned.
 */
export const AVATAR_MACHINE = {
    initial: 'resting',
    states: {
        resting: {
            expression: 'warm',
            dialoguePool: 'welcome',
            animationIntensity: 0.3,
            on: {
                SESSION_START: 'guiding-inhale',
            },
        },
        'guiding-inhale': {
            expression: 'focused',
            dialoguePool: 'inhale',
            animationIntensity: 0.8,
            on: {
                PHASE_HOLD: 'guiding-hold',
                FOCUS_BROKEN: 'reassuring',
                SESSION_END: 'wrapping-up',
            },
        },
        'guiding-hold': {
            expression: 'focused',
            dialoguePool: 'hold',
            animationIntensity: 0.4,
            on: {
                PHASE_EXHALE: 'guiding-exhale',
                FOCUS_BROKEN: 'reassuring',
                SESSION_END: 'wrapping-up',
            },
        },
        'guiding-exhale': {
            expression: 'warm',
            dialoguePool: 'exhale',
            animationIntensity: 0.6,
            on: {
                PHASE_INHALE: 'guiding-inhale',
                CYCLE_COMPLETE: 'celebrating-cycle',
                FOCUS_BROKEN: 'reassuring',
                SESSION_END: 'wrapping-up',
            },
        },
        'celebrating-cycle': {
            expression: 'delighted',
            dialoguePool: 'cycleComplete',
            animationIntensity: 0.9,
            on: {
                PHASE_HOLD: 'guiding-hold',
                MILESTONE_REACHED: 'milestone',
                FOCUS_BROKEN: 'reassuring',
                SESSION_END: 'wrapping-up',
            },
        },
        reassuring: {
            expression: 'gentle-concern',
            dialoguePool: 'focusBroken',
            animationIntensity: 0.5,
            on: {
                PHASE_INHALE: 'guiding-inhale',
                PHASE_HOLD: 'guiding-hold',
                PHASE_EXHALE: 'guiding-exhale',
                SESSION_END: 'wrapping-up',
            },
        },
        milestone: {
            expression: 'proud',
            dialoguePool: 'milestone',
            animationIntensity: 1,
            on: {
                LEVEL_UP: 'leveling-up',
                PHASE_HOLD: 'guiding-hold',
                PHASE_INHALE: 'guiding-inhale',
                SESSION_END: 'wrapping-up',
            },
        },
        'leveling-up': {
            expression: 'proud',
            dialoguePool: 'levelUp',
            animationIntensity: 1,
            on: {
                PHASE_HOLD: 'guiding-hold',
                PHASE_INHALE: 'guiding-inhale',
                SESSION_END: 'wrapping-up',
            },
        },
        'wrapping-up': {
            expression: 'warm',
            dialoguePool: 'sessionEnd',
            animationIntensity: 0.4,
            on: {
                SESSION_START: 'guiding-inhale',
            },
        },
    },
};
