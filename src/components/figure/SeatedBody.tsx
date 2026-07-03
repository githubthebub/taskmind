import type { CSSProperties } from 'react';
import type { ChakraId, EyeState, SeatedBodyProps } from '../../types';
import { mudraShapes } from '../../data/mudras';
import { chakras } from '../../data/tantric';
import FaceBlob from './FaceBlob';
import HandMudra from './HandMudra';
import './figure.css';

/**
 * Seated meditator — crossed-leg line-art silhouette, FaceBlob head, and two
 * HandMudra instances positioned by the current mudra's placement. Seven
 * chakra points sit on the midline (order from src/data/tantric.ts); the
 * active one glows softly in dim amber. Motion only ever tapers DOWN:
 * active → settling (slower, dimmer) → still (no idle motion at all).
 */

/** Midline y-positions in the 300×400 body coordinate space, per chakra. */
const CHAKRA_Y: Record<ChakraId, number> = {
  muladhara: 268,
  svadhisthana: 232,
  manipura: 196,
  anahata: 150,
  vishuddha: 108,
  ajna: 52,
  sahasrara: 14,
};

interface HandPose {
  left: string;
  top: string;
  width: string;
  rot: number;
}

const HAND_POSES: Record<'knees' | 'lap' | 'heart', { left: HandPose; right: HandPose }> = {
  knees: {
    left: { left: '24%', top: '72%', width: '27%', rot: -8 },
    right: { left: '76%', top: '72%', width: '27%', rot: 8 },
  },
  lap: {
    left: { left: '45.5%', top: '76%', width: '24%', rot: 10 },
    right: { left: '54.5%', top: '76%', width: '24%', rot: -10 },
  },
  heart: {
    left: { left: '47.5%', top: '40%', width: '20%', rot: 3 },
    right: { left: '52.5%', top: '40%', width: '20%', rot: -3 },
  },
};

/** Face expression settles as the figure quiets. */
const CALM_BY_MOTION = { active: 0.25, settling: 0.65, still: 1 } as const;

const EYE_LABEL: Record<EyeState, string> = {
  open: 'eyes open',
  soft: 'eyes half-lidded',
  closed: 'eyes gently closed',
  'shambhavi-lock': 'inner gaze raised to the brow point',
};

/* Line-art body paths (head is the FaceBlob overlay). */
const NECK_LEFT_D = 'M 142 88 C 142 96 143 102 146 108';
const NECK_RIGHT_D = 'M 158 88 C 158 96 157 102 154 108';
const ARM_LEFT_D = 'M 136 102 C 132 110 122 116 106 121 C 87 128 77 145 74 170 C 72 190 71 203 70 214';
const ARM_RIGHT_D = 'M 164 102 C 168 110 178 116 194 121 C 213 128 223 145 226 170 C 228 190 229 203 230 214';
const SIDE_LEFT_D = 'M 96 162 C 92 202 90 240 89 276';
const SIDE_RIGHT_D = 'M 204 162 C 208 202 210 240 211 276';
const SPINE_D = 'M 150 120 L 150 254';
const LEGS_D =
  'M 42 332 C 62 298 100 282 150 282 C 200 282 238 298 258 332 ' +
  'C 265 344 259 355 244 357 C 213 361 181 363 150 363 ' +
  'C 119 363 87 361 56 357 C 41 355 35 344 42 332 Z';
const SHIN_FOLD_D = 'M 100 338 C 126 320 174 320 200 338';
const ANKLE_D = 'M 136 346 C 146 340 158 340 166 346';

export default function SeatedBody({
  mudra,
  eyeState,
  mood,
  breathPhase,
  glowChakra,
  motion,
  transitionMs,
}: SeatedBodyProps) {
  const ms = transitionMs ?? 800;
  const shape = mudraShapes[mudra];
  const calm = CALM_BY_MOTION[motion];
  const rootStyle = { '--fig-ms': `${ms}ms` } as CSSProperties;

  /* Subtle chest rise: 0 at cycle start/end, 1 at mid-cycle. */
  const rise = breathPhase === undefined ? 0 : 0.5 - 0.5 * Math.cos(breathPhase * Math.PI * 2);
  const breathTransform = `scale(${(1 + 0.008 * rise).toFixed(4)}, ${(1 + 0.02 * rise).toFixed(4)})`;

  const glowingChakra = glowChakra ? chakras.find((c) => c.id === glowChakra) : undefined;
  const label =
    `Seated meditator, hands in ${shape.sanskritName}, ${EYE_LABEL[eyeState]}` +
    (glowingChakra ? `, attention resting at the ${glowingChakra.name.toLowerCase()} center` : '');

  return (
    <div
      className="seated-body"
      data-motion={motion}
      style={rootStyle}
      role="img"
      aria-label={label}
    >
      <div className="sb-figure">
        <svg className="sb-svg" viewBox="0 0 300 400" aria-hidden="true" focusable="false">
          {/* Torso breathes about the base of the spine (150, 290). */}
          <g transform="translate(150 290)">
            <g className="sb-breath" style={{ transform: breathTransform }}>
              <g transform="translate(-150 -290)">
                <path className="sb-line sb-line-soft" d={NECK_LEFT_D} />
                <path className="sb-line sb-line-soft" d={NECK_RIGHT_D} />
                <path className="sb-line" d={ARM_LEFT_D} />
                <path className="sb-line" d={ARM_RIGHT_D} />
                <path className="sb-line sb-line-soft" d={SIDE_LEFT_D} />
                <path className="sb-line sb-line-soft" d={SIDE_RIGHT_D} />
                <path className="sb-spine" d={SPINE_D} />
              </g>
            </g>
          </g>

          {/* Crossed legs. */}
          <path className="sb-legs-shape" d={LEGS_D} />
          <path className="sb-line sb-line-soft" d={SHIN_FOLD_D} />
          <path className="sb-line sb-line-soft" d={ANKLE_D} />
        </svg>

        <div
          className="sb-face"
          aria-hidden="true"
          style={{ left: '50%', top: '15.5%', width: '31%', transform: 'translate(-50%, -50%)' }}
        >
          <FaceBlob
            eyeState={eyeState}
            calm={calm}
            mood={mood ?? (motion === 'active' ? 'neutral' : 'serene')}
            transitionMs={ms}
          />
        </div>

        {(['left', 'right'] as const).map((side) => {
          const pose = HAND_POSES[shape.placement][side];
          return (
            <div
              key={side}
              className="sb-hand"
              aria-hidden="true"
              style={{
                left: pose.left,
                top: pose.top,
                width: pose.width,
                transform: `translate(-50%, -50%) rotate(${pose.rot}deg)`,
              }}
            >
              <HandMudra shape={shape} side={side} transitionMs={ms} />
            </div>
          );
        })}

        {/* Chakra points on top so the brow/crown glows read over the face. */}
        <svg
          className="sb-svg sb-chakra-overlay"
          viewBox="0 0 300 400"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <filter id="sb-chakra-blur" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
          </defs>
          {chakras.map((chakra) => (
            <g
              key={chakra.id}
              transform={`translate(150 ${CHAKRA_Y[chakra.id]})`}
              className={chakra.id === glowChakra ? 'sb-chakra sb-chakra-active' : 'sb-chakra'}
            >
              <circle className="sb-chakra-halo" r={14} filter="url(#sb-chakra-blur)" />
              <circle className="sb-chakra-core" r={4} />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
