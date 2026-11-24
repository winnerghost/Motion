import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Pip, PipPose} from './character/Pip';
import {Background} from './components/Background';
import {FPS, W, H} from './lib/anim';

const poses: Partial<PipPose>[] = [
  {},
  {lid: 0.5, smile: 0, mouthW: 0.8, browL: -0.2, browR: -0.2},
  {browL: 0.9, browR: -0.3, smirk: 0.6, smile: 0.2, lookX: 0.6},
  {happyEyes: 1, mouthOpen: 0.9, smile: 1, blush: 1, handL: [-240, -40], handR: [240, -40]},
  {mouthOpen: 0.5, browL: 0.6, browR: 0.6, handL: [-60, 130], handR: [60, 120], fingers: 1, lid: 0.45, smile: -0.1},
  {goggles: 1, smile: 0.6, mouthOpen: 0.3, antennaGlow: 1, handR: [260, -150]},
];

export const PipSheet: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  return (
    <AbsoluteFill>
      <Background t={t} />
      <svg width={W} height={H} style={{position: 'absolute'}}>
        {poses.map((p, i) => (
          <Pip key={i} id={`p${i}`} t={t + i} pose={{...p, x: 270 + (i % 2) * 540, y: 600 + Math.floor(i / 2) * 600, scale: 0.85}} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
