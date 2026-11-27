import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Brain} from '../components/Brain';
import {C, FONT_DISPLAY, FONT_HEAD} from '../lib/theme';
import {PipCutout} from './PipCutout';

/* Transparent "ingredient" images for thumbnails made in other tools. */

export const PIP_POSES = {
  shocked: {lookX: 0, lookY: 0.05, browL: 1, browR: 1, browAngry: -0.5, mouthOpen: 0.95, mouthW: 0.85, smile: -0.3, handL: [-150, -30], handR: [150, -30], blush: 0.6, antennaGlow: 1},
  pointing: {x: 470, lookX: 0.65, lookY: -0.1, browL: 0.25, browR: 0.7, smirk: 0.45, smile: 0.55, handL: [-212, 118], handR: [270, -110], antennaGlow: 1, blush: 0.35, tilt: 4},
  skeptical: {lookX: -0.35, lookY: -0.35, lid: 0.38, browL: 0.85, browR: -0.15, browAngry: 0.2, smirk: 0.55, smile: 0.1, mouthW: 0.8, handL: [-212, 118], handR: [70, 45], antennaGlow: 0.8, blush: 0.3},
  happy: {happyEyes: 0.85, smile: 0.95, browL: 0.5, browR: 0.5, handL: [-212, 118], handR: [236, -150], antennaGlow: 1, blush: 0.6},
  worried: {lookX: -0.4, lookY: 0.2, browL: 0.7, browR: 0.7, browAngry: -0.9, smile: -0.55, mouthOpen: 0.25, mouthW: 0.7, handL: [-120, 20], handR: [120, 20], antennaGlow: 0.5, blush: 0.5},
} as const;

export const PipPoseStill: React.FC<{pose: keyof typeof PIP_POSES}> = ({pose}) => <PipCutout pose={{scale: 1.75, ...PIP_POSES[pose]} as never} t={2.3} />;

/** A red rubber "MYTH" stamp on transparency. 1200x600. */
export const MythStamp: React.FC = () => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
    <div
      style={{
        transform: 'rotate(-10deg)',
        fontFamily: FONT_HEAD,
        fontWeight: 800,
        fontSize: 260,
        letterSpacing: 18,
        lineHeight: 1,
        color: '#E8283C',
        border: '26px solid #E8283C',
        borderRadius: 60,
        padding: '10px 70px 26px',
        background: 'rgba(255,255,255,0.94)',
      }}
    >
      MYTH
    </div>
  </AbsoluteFill>
);

/** The "10% of your brain" prop, crossed out. 1200x700. */
export const Brain10: React.FC = () => (
  <AbsoluteFill>
    <svg width={1200} height={700} style={{overflow: 'visible'}}>
      <Brain x={360} y={360} scale={0.95} t={1} id="ing" />
      <text x={700} y={420} fontFamily={FONT_DISPLAY} fontWeight={700} fontSize={240} fill="#fff" stroke="#120C33" strokeWidth={30} paintOrder="stroke">
        10%
      </text>
      <path d="M 690 290 L 1150 470" stroke={C.red} strokeWidth={46} strokeLinecap="round" />
    </svg>
  </AbsoluteFill>
);
