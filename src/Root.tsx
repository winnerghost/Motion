import React from 'react';
import {Composition} from 'remotion';
import {PipSheet} from './PipSheet';
import {Episode001, EP001_DURATION} from './episodes/ep001/Episode';
import {loadFonts} from './lib/theme';
import {FPS, W, H} from './lib/anim';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="EP001-tickle" component={Episode001} durationInFrames={EP001_DURATION} fps={FPS} width={W} height={H} />
    <Composition id="PipSheet" component={PipSheet} durationInFrames={120} fps={FPS} width={W} height={H} />
  </>
);
