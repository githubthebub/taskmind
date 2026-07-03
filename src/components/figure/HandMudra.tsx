import type { CSSProperties } from 'react';
import type { FingerId, FingerState, HandMudraProps, MudraShape } from '../../types';
import './figure.css';

/**
 * Stylized SVG hand — abstract line-drawing, not anatomical.
 *
 * Morphing strategy: interpolating path `d` strings is unreliable, so every
 * finger is a chain of nested segment groups. Each segment carries a CSS
 * transform (rotate + a foreshortening scaleY) computed from its FingerState,
 * and `.figure-anim` transitions those transforms over --fig-ms. Static
 * positioning (knuckle bases, joint offsets, mirroring) lives in attribute
 * transforms, so the CSS rotation always happens about the local (0,0) joint.
 */

interface SegmentPose {
  /** Rotation in degrees; negative curls toward the thumb side / palm. */
  rot: number;
  /** ScaleY along the segment axis — a soft foreshortening cue for curl. */
  scale: number;
}

/** Per-joint poses, proximal → distal, for the four fingers. */
function fingerPoses(state: FingerState): SegmentPose[] {
  if (state.touchesThumb) {
    // Mostly-distal curl that drops the fingertip down to meet the thumb tip.
    return [
      { rot: -8, scale: 0.95 },
      { rot: -80, scale: 0.9 },
      { rot: -80, scale: 0.85 },
    ];
  }
  switch (state.curl) {
    case 'extended':
      return [
        { rot: 0, scale: 1 },
        { rot: 0, scale: 1 },
        { rot: 0, scale: 1 },
      ];
    case 'half':
      return [
        { rot: -16, scale: 0.96 },
        { rot: -24, scale: 0.93 },
        { rot: -28, scale: 0.9 },
      ];
    case 'curled':
      return [
        { rot: -45, scale: 0.88 },
        { rot: -62, scale: 0.82 },
        { rot: -66, scale: 0.78 },
      ];
  }
}

/** Per-joint poses for the thumb (two segments). */
function thumbPoses(state: FingerState): SegmentPose[] {
  if (state.touchesThumb) {
    // Reach up toward the index tip (jñāna circle / dhyāna thumb bridge).
    return [
      { rot: -5, scale: 0.97 },
      { rot: 20, scale: 0.95 },
    ];
  }
  switch (state.curl) {
    case 'extended':
      return [
        { rot: -8, scale: 1 },
        { rot: -10, scale: 1 },
      ];
    case 'half':
      return [
        { rot: 8, scale: 0.94 },
        { rot: 16, scale: 0.9 },
      ];
    case 'curled':
      return [
        { rot: 28, scale: 0.88 },
        { rot: 40, scale: 0.85 },
      ];
  }
}

interface FingerGeometry {
  id: Exclude<FingerId, 'thumb'>;
  baseX: number;
  baseY: number;
  /** Resting splay angle in degrees (attribute transform, never animated). */
  splay: number;
  lengths: readonly number[];
  strokeWidth: number;
}

/** Drawn as a RIGHT hand, palm toward the viewer, thumb on the left. */
const FINGERS: readonly FingerGeometry[] = [
  { id: 'index', baseX: 35, baseY: 62, splay: -6, lengths: [18, 14, 10], strokeWidth: 7 },
  { id: 'middle', baseX: 48, baseY: 59, splay: -1, lengths: [20, 15, 11], strokeWidth: 7.2 },
  { id: 'ring', baseX: 61, baseY: 61, splay: 4, lengths: [18, 14, 10], strokeWidth: 7 },
  { id: 'little', baseX: 73, baseY: 65, splay: 10, lengths: [13, 10, 8], strokeWidth: 6.2 },
];

const THUMB = { baseX: 30, baseY: 88, splay: -30, lengths: [18, 15] as const, strokeWidth: 7.5 };

const PALM_D =
  'M 33 64 C 31 78 30 96 34 112 C 36 121 43 126 53 126 ' +
  'C 63 126 70 121 72 112 C 76 96 76 79 74 64 ' +
  'C 73 58 67 55 60 56 C 53 57 45 57 40 56 C 36 55.5 34 59 33 64 Z';

const CREASE_D = 'M 40 74 C 47 82 59 82 68 75';

/** Whole-hand pose per palm orientation (rotates about a mid-hand pivot). */
const ORIENT: Record<
  MudraShape['palm'],
  { rot: number; scaleX: number; palmFill: number; crease: number }
> = {
  up: { rot: 0, scaleX: 1, palmFill: 0.1, crease: 0.32 },
  // Back of the hand: drape it downward from the wrist, hide the palm lines.
  down: { rot: 180, scaleX: 1, palmFill: 0.03, crease: 0 },
  // Edge-on toward the other palm: narrow the silhouette.
  inward: { rot: 0, scaleX: 0.78, palmFill: 0.07, crease: 0.16 },
};

interface SegmentChainProps {
  lengths: readonly number[];
  poses: SegmentPose[];
  index: number;
  strokeWidth: number;
}

/** One finger segment; nests the next segment at its own tip. */
function SegmentChain({ lengths, poses, index, strokeWidth }: SegmentChainProps) {
  const pose = poses[index];
  const len = lengths[index];
  return (
    <g
      className="figure-anim"
      style={{ transform: `rotate(${pose.rot}deg) scaleY(${pose.scale})` }}
    >
      <line className="hm-seg-line" x1={0} y1={0} x2={0} y2={-len} strokeWidth={strokeWidth} />
      {index < lengths.length - 1 && (
        <g transform={`translate(0 ${-len})`}>
          <SegmentChain
            lengths={lengths}
            poses={poses}
            index={index + 1}
            strokeWidth={strokeWidth}
          />
        </g>
      )}
    </g>
  );
}

export default function HandMudra({ shape, side, transitionMs }: HandMudraProps) {
  const ms = transitionMs ?? 800;
  const orient = ORIENT[shape.palm];
  const rootStyle = { '--fig-ms': `${ms}ms` } as CSSProperties;

  return (
    <svg
      className="hand-mudra"
      viewBox="0 0 100 130"
      style={rootStyle}
      role="img"
      aria-label={`${side === 'left' ? 'Left' : 'Right'} hand held in ${shape.sanskritName}`}
    >
      {/* The drawing is a right hand; mirror it for the left. */}
      <g transform={side === 'left' ? 'translate(100 0) scale(-1 1)' : undefined}>
        {/* Orientation pivot at mid-hand so palm-up ↔ palm-down swings in place. */}
        <g transform="translate(53 82)">
          <g
            className="figure-anim"
            style={{ transform: `rotate(${orient.rot}deg) scaleX(${orient.scaleX})` }}
          >
            <g transform="translate(-53 -82)">
              <path className="hm-palm-fill figure-anim" d={PALM_D} style={{ opacity: orient.palmFill }} />
              <path className="hm-palm-outline" d={PALM_D} />
              <path className="hm-crease figure-anim" d={CREASE_D} style={{ opacity: orient.crease }} />

              {/* Thumb (drawn beneath the fingers). */}
              <g transform={`translate(${THUMB.baseX} ${THUMB.baseY}) rotate(${THUMB.splay})`}>
                <SegmentChain
                  lengths={THUMB.lengths}
                  poses={thumbPoses(shape.fingers.thumb)}
                  index={0}
                  strokeWidth={THUMB.strokeWidth}
                />
              </g>

              {FINGERS.map((finger) => (
                <g
                  key={finger.id}
                  transform={`translate(${finger.baseX} ${finger.baseY}) rotate(${finger.splay})`}
                >
                  <SegmentChain
                    lengths={finger.lengths}
                    poses={fingerPoses(shape.fingers[finger.id])}
                    index={0}
                    strokeWidth={finger.strokeWidth}
                  />
                </g>
              ))}
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
