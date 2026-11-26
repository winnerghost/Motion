import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Pip, PipPose} from '../character/Pip';
import {Svg} from '../lib/shots';

/** Pip alone on a transparent background, for compositing into stills and posters. */
export const PipCutout: React.FC<{pose?: Partial<PipPose>; t?: number; mirror?: boolean}> = ({pose = {}, t = 2.3, mirror = false}) => (
  <AbsoluteFill style={{transform: mirror ? 'scaleX(-1)' : undefined}}>
    <Svg>
      <Pip id="cut" t={t} pose={{x: 540, y: 1660, scale: 2.2, ...pose}} />
    </Svg>
  </AbsoluteFill>
);
