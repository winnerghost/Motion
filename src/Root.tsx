import React from 'react';
import {Composition} from 'remotion';
import {PipSheet} from './PipSheet';
import {Avatar, Banner} from './brand/Brand';
import {Episode001, EP001_DURATION} from './episodes/ep001/Episode';
import {Episode002, EP002_DURATION} from './episodes/ep002/Episode';
import {loadFonts} from './lib/theme';
import {FPS, W, H} from './lib/anim';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="EP001-tickle" component={Episode001} durationInFrames={EP001_DURATION} fps={FPS} width={W} height={H} />
    <Composition id="EP002-tickle-foot-reply" component={Episode002} durationInFrames={EP002_DURATION} fps={FPS} width={W} height={H} />
    <Composition id="PipSheet" component={PipSheet} durationInFrames={120} fps={FPS} width={W} height={H} />
    <Composition id="Avatar" component={Avatar} durationInFrames={1} fps={FPS} width={1080} height={1080} />
    <Composition id="Banner" component={Banner} durationInFrames={1} fps={FPS} width={2560} height={1440} />
    <Composition id="BannerSafeArea" component={Banner} defaultProps={{showSafeArea: true}} durationInFrames={1} fps={FPS} width={2560} height={1440} />
  </>
);
