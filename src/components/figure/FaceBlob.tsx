import type { CSSProperties } from 'react';
import type { EyeState, FaceBlobProps, FaceMood } from '../../types';
import './figure.css';

/**
 * Soft blob face — the app's gentle companion. Kawaii-leaning but serene:
 * large round eyes with a highlight, dusty-rose blush, and a mood system:
 *   neutral  — soft presence
 *   happy    — brighter smile, warmer blush
 *   holding  — puffed cheeks + small 'o' mouth (the kumbhaka buddy)
 *   blissful — closed happy arc eyes (^ ^), big smile, tiny sparkles
 *   serene   — the calmest face; used while settling (never brighter ones)
 * Eyes morph between open / soft / closed / śāmbhavī via opacity + transform
 * transitions; `calm` softens everything and slows the idle bob; `breathBpm`
 * makes the whole face puff gently in time — a breathing buddy.
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
  /** Upward happy arc (^ ^) — the blissful expression. */
  happyOpacity: number;
  /** Brow-center point emphasis (śāmbhavī target). */
  browGlow: number;
}

function eyePose(eyeState: EyeState, mood: FaceMood): EyePose {
  if (mood === 'blissful') {
    // Happy closed arcs override the eye state — pure content.
    return { lidScaleY: 0.1, lidOpacity: 0, irisX: 0, irisY: 2, irisOpacity: 0, closedOpacity: 0, happyOpacity: 0.85, browGlow: 0.12 };
  }
  switch (eyeState) {
    case 'open':
      return { lidScaleY: 1, lidOpacity: 0.55, irisX: 0, irisY: 0, irisOpacity: 0.9, closedOpacity: 0, happyOpacity: 0, browGlow: 0.12 };
    case 'soft':
      return { lidScaleY: 0.55, lidOpacity: 0.45, irisX: 0, irisY: 1.4, irisOpacity: 0.55, closedOpacity: 0, happyOpacity: 0, browGlow: 0.12 };
    case 'closed':
      return { lidScaleY: 0.1, lidOpacity: 0, irisX: 0, irisY: 2, irisOpacity: 0, closedOpacity: 0.7, happyOpacity: 0, browGlow: 0.12 };
    case 'shambhavi-lock':
      return { lidScaleY: 0.85, lidOpacity: 0.55, irisX: 1.4, irisY: -3.6, irisOpacity: 0.95, closedOpacity: 0, happyOpacity: 0, browGlow: 0.9 };
  }
}

interface MoodPose {
  /** Smile arc depth (bigger = happier); ignored when oMouth. */
  mouthDepthBoost: number;
  mouthOpacity: number;
  /** Small round 'o' mouth for holding the breath. */
  oMouth: boolean;
  blush: number;
  /** Side cheek puffs (kumbhaka). */
  puff: number;
  sparkles: boolean;
}

const MOOD: Record<FaceMood, MoodPose> = {
  neutral: { mouthDepthBoost: 0, mouthOpacity: 0.5, oMouth: false, blush: 0.28, puff: 0, sparkles: false },
  happy: { mouthDepthBoost: 2.6, mouthOpacity: 0.65, oMouth: false, blush: 0.5, puff: 0, sparkles: false },
  holding: { mouthDepthBoost: 0, mouthOpacity: 0.6, oMouth: true, blush: 0.55, puff: 1, sparkles: false },
  blissful: { mouthDepthBoost: 3.6, mouthOpacity: 0.75, oMouth: false, blush: 0.6, puff: 0, sparkles: true },
  serene: { mouthDepthBoost: 0.8, mouthOpacity: 0.45, oMouth: false, blush: 0.2, puff: 0, sparkles: false },
};

const EYE_LABEL: Record<EyeState, string> = {
  open: 'eyes open',
  soft: 'eyes half-lidded',
  closed: 'eyes gently closed',
  'shambhavi-lock': 'inner gaze raised to the brow point',
};

const MOOD_LABEL: Record<FaceMood, string> = {
  neutral: 'calm',
  happy: 'quietly happy',
  holding: 'cheeks puffed, holding the breath with you',
  blissful: 'blissful',
  serene: 'deeply serene',
};

const HEAD_D =
  'M 50 9 C 71 9 85 25 86 47 C 87 71 71 91 50 91 C 29 91 13 71 14 47 C 15 25 29 9 50 9 Z';

/** Four-point sparkle star. */
const SPARKLE_D = 'M 0 -3 L 0.9 -0.9 L 3 0 L 0.9 0.9 L 0 3 L -0.9 0.9 L -3 0 L -0.9 -0.9 Z';

const SPARKLE_SPOTS = [
  { x: 14, y: 18, s: 1, delay: 0 },
  { x: 87, y: 26, s: 0.8, delay: 0.6 },
  { x: 80, y: 8, s: 0.65, delay: 1.1 },
];

function Eye({ cx, mirror, pose, blink }: { cx: number; mirror: 1 | -1; pose: EyePose; blink: boolean }) {
  return (
    <g transform={`translate(${cx} 48)`}>
      <g className={blink ? 'fb-blink' : undefined}>
        <path
          className="fb-almond figure-anim"
          d="M -9 0 Q 0 -7 9 0 Q 0 7 -9 0 Z"
          style={{ transform: `scaleY(${pose.lidScaleY})`, opacity: pose.lidOpacity }}
        />
        <g
          className="fb-iris-group figure-anim"
          style={{
            transform: `translate(${pose.irisX * mirror}px, ${pose.irisY}px)`,
            opacity: pose.irisOpacity,
          }}
        >
          <circle className="fb-iris" r={4.4} />
          <circle className="fb-iris-shine" cx={1.5 * mirror} cy={-1.6} r={1.5} />
        </g>
      </g>
      <path
        className="fb-closed-arc figure-anim"
        d="M -8 0.5 Q 0 5.5 8 0.5"
        style={{ opacity: pose.closedOpacity }}
      />
      <path
        className="fb-happy-arc figure-anim"
        d="M -8 2 Q 0 -5 8 2"
        style={{ opacity: pose.happyOpacity }}
      />
    </g>
  );
}

export default function FaceBlob({ eyeState, calm, mood, breathBpm, transitionMs }: FaceBlobProps) {
  const ms = transitionMs ?? 800;
  const m: FaceMood = mood ?? 'neutral';
  const c = Math.min(1, Math.max(0, calm));
  const pose = eyePose(eyeState, m);
  const moodPose = MOOD[m];
  /** Softer, quieter mouth as calm rises; moods add their own warmth. */
  const mouthDepth = 5.5 - 3.4 * c + moodPose.mouthDepthBoost;
  /** Blink only when the eyes are meaningfully open. */
  const blink = pose.lidScaleY > 0.4 && pose.irisOpacity > 0;
  const rootStyle = {
    '--fig-ms': `${ms}ms`,
    /** Idle bob only ever slows down as calm rises. */
    '--fb-idle': `${(7 + 7 * c).toFixed(2)}s`,
    /** Breathing-buddy puff period, when pacing. */
    '--fb-breath': breathBpm ? `${(60 / breathBpm).toFixed(3)}s` : undefined,
  } as CSSProperties;

  return (
    <svg
      className="face-blob"
      viewBox="0 0 100 100"
      style={rootStyle}
      role="img"
      aria-label={`Blob companion, ${MOOD_LABEL[m]}, ${EYE_LABEL[eyeState]}`}
    >
      <g className="fb-idle">
        <g className={breathBpm ? 'fb-breathing' : undefined}>
          <path className="fb-head" d={HEAD_D} />

          {/* Cheek puffs — kumbhaka buddy holding the breath with you. */}
          <ellipse
            className="fb-puff figure-anim"
            cx={19}
            cy={60}
            rx={7}
            ry={6}
            style={{ opacity: moodPose.puff * 0.55, transform: `scale(${0.6 + 0.4 * moodPose.puff})` }}
          />
          <ellipse
            className="fb-puff figure-anim"
            cx={81}
            cy={60}
            rx={7}
            ry={6}
            style={{ opacity: moodPose.puff * 0.55, transform: `scale(${0.6 + 0.4 * moodPose.puff})` }}
          />

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

          <Eye cx={35} mirror={1} pose={pose} blink={blink} />
          <Eye cx={65} mirror={-1} pose={pose} blink={blink} />

          {/* Blush — dusty rose, warmer with mood. */}
          <ellipse className="fb-blush figure-anim" cx={27} cy={61} rx={6.5} ry={3.6} style={{ opacity: moodPose.blush }} />
          <ellipse className="fb-blush figure-anim" cx={73} cy={61} rx={6.5} ry={3.6} style={{ opacity: moodPose.blush }} />

          {moodPose.oMouth ? (
            <circle className="fb-mouth-o figure-anim" cx={50} cy={72} r={3.4} style={{ opacity: moodPose.mouthOpacity }} />
          ) : (
            <path
              className="fb-mouth figure-anim"
              d={`M 39 70 Q 50 ${(70 + mouthDepth).toFixed(2)} 61 70`}
              style={{ opacity: moodPose.mouthOpacity - 0.1 * c }}
            />
          )}
        </g>

        {moodPose.sparkles &&
          SPARKLE_SPOTS.map((s, i) => (
            <path
              key={i}
              className="fb-sparkle"
              d={SPARKLE_D}
              transform={`translate(${s.x} ${s.y}) scale(${s.s})`}
              style={{ animationDelay: `${s.delay}s` }}
            />
          ))}
      </g>
    </svg>
  );
}
