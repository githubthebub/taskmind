import type { CSSProperties } from 'react';
import type { EyeState, FaceBlobProps } from '../../types';
import './figure.css';

/**
 * Soft blob face — a serene, detail-free head. Eyes morph between open /
 * soft / closed / śāmbhavī (irises risen toward a marked brow-center point)
 * via opacity + transform transitions on layered elements; `calm` softens the
 * mouth curve and slows the idle bob.
 */

interface EyePose {
  /** Vertical scale of the almond outline (1 open → near 0 closed). */
  lidScaleY: number;
  lidOpacity: number;
  /** Iris offset; +irisX drifts inward (toward the nose), -irisY rises. */
  irisX: number;
  irisY: number;
  irisOpacity: number;
  /** Gentle downward-resting arc shown when the eyes are closed. */
  closedOpacity: number;
  /** Brow-center point emphasis (śāmbhavī target). */
  browGlow: number;
}

function eyePose(eyeState: EyeState): EyePose {
  switch (eyeState) {
    case 'open':
      return { lidScaleY: 1, lidOpacity: 0.6, irisX: 0, irisY: 0, irisOpacity: 0.85, closedOpacity: 0, browGlow: 0.12 };
    case 'soft':
      return { lidScaleY: 0.5, lidOpacity: 0.5, irisX: 0, irisY: 1.2, irisOpacity: 0.5, closedOpacity: 0, browGlow: 0.12 };
    case 'closed':
      return { lidScaleY: 0.1, lidOpacity: 0, irisX: 0, irisY: 2, irisOpacity: 0, closedOpacity: 0.7, browGlow: 0.12 };
    case 'shambhavi-lock':
      return { lidScaleY: 0.85, lidOpacity: 0.6, irisX: 1.4, irisY: -3.6, irisOpacity: 0.95, closedOpacity: 0, browGlow: 0.9 };
  }
}

const EYE_LABEL: Record<EyeState, string> = {
  open: 'eyes open',
  soft: 'eyes half-lidded',
  closed: 'eyes gently closed',
  'shambhavi-lock': 'inner gaze raised to the brow point',
};

const HEAD_D =
  'M 50 9 C 71 9 85 25 86 47 C 87 71 71 91 50 91 C 29 91 13 71 14 47 C 15 25 29 9 50 9 Z';

function Eye({ cx, mirror, pose }: { cx: number; mirror: 1 | -1; pose: EyePose }) {
  return (
    <g transform={`translate(${cx} 48)`}>
      <path
        className="fb-almond figure-anim"
        d="M -9 0 Q 0 -6.5 9 0 Q 0 6.5 -9 0 Z"
        style={{ transform: `scaleY(${pose.lidScaleY})`, opacity: pose.lidOpacity }}
      />
      <circle
        className="fb-iris figure-anim"
        r={3.1}
        style={{
          transform: `translate(${pose.irisX * mirror}px, ${pose.irisY}px)`,
          opacity: pose.irisOpacity,
        }}
      />
      <path
        className="fb-closed-arc figure-anim"
        d="M -8 0.5 Q 0 5.5 8 0.5"
        style={{ opacity: pose.closedOpacity }}
      />
    </g>
  );
}

export default function FaceBlob({ eyeState, calm, transitionMs }: FaceBlobProps) {
  const ms = transitionMs ?? 800;
  const c = Math.min(1, Math.max(0, calm));
  const pose = eyePose(eyeState);
  /** Softer, quieter mouth as calm rises. */
  const mouthDepth = 5.5 - 3.4 * c;
  const rootStyle = {
    '--fig-ms': `${ms}ms`,
    /** Idle bob only ever slows down as calm rises. */
    '--fb-idle': `${(7 + 7 * c).toFixed(2)}s`,
  } as CSSProperties;

  return (
    <svg
      className="face-blob"
      viewBox="0 0 100 100"
      style={rootStyle}
      role="img"
      aria-label={`Serene face, ${EYE_LABEL[eyeState]}`}
    >
      <g className="fb-idle">
        <path className="fb-head" d={HEAD_D} />

        {/* Brow-center point — the śāmbhavī gaze target, faint otherwise. */}
        <circle
          className="fb-brow-halo figure-anim"
          cx={50}
          cy={26}
          r={5}
          style={{ opacity: pose.browGlow * 0.3 }}
        />
        <circle
          className="fb-brow-dot figure-anim"
          cx={50}
          cy={26}
          r={1.8}
          style={{ opacity: pose.browGlow }}
        />

        <Eye cx={35} mirror={1} pose={pose} />
        <Eye cx={65} mirror={-1} pose={pose} />

        <path
          className="fb-mouth"
          d={`M 39 70 Q 50 ${(70 + mouthDepth).toFixed(2)} 61 70`}
          style={{ opacity: 0.5 - 0.15 * c }}
        />
      </g>
    </svg>
  );
}
