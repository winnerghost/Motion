import React from 'react';
import {Composition} from 'remotion';
import {PipSheet} from './PipSheet';
import {WombatSheet} from './WombatSheet';
import {ClipHello, ClipMachine, ClipSleep, WEB_FPS} from './web/WebClips';
import {LuxHero, LuxHost, LuxOg, LUX_FPS} from './web/LuxClips';
import {Avatar, Banner} from './brand/Brand';
import {Episode001, EP001_DURATION} from './episodes/ep001/Episode';
import {Episode002, EP002_DURATION} from './episodes/ep002/Episode';
import {Episode003, EP003_DURATION} from './episodes/ep003/Episode';
import {Episode004, EP004_DURATION} from './episodes/ep004/Episode';
import {loadFonts} from './lib/theme';
import {FPS, W, H} from './lib/anim';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="EP001-tickle" component={Episode001} durationInFrames={EP001_DURATION} fps={FPS} width={W} height={H} />
    <Composition id="EP002-tickle-foot-reply" component={Episode002} durationInFrames={EP002_DURATION} fps={FPS} width={W} height={H} />
    <Composition id="EP003-wombat-cubes" component={Episode003} durationInFrames={EP003_DURATION} fps={FPS} width={W} height={H} />
    <Composition id="EP004-recorded-voice" component={Episode004} durationInFrames={EP004_DURATION} fps={FPS} width={W} height={H} />
    <Composition id="PipSheet" component={PipSheet} durationInFrames={120} fps={FPS} width={W} height={H} />
    <Composition id="WombatSheet" component={WombatSheet} durationInFrames={60} fps={FPS} width={W} height={H} />
    <Composition id="Web-Hello" component={ClipHello} durationInFrames={8 * WEB_FPS} fps={WEB_FPS} width={1080} height={1080} />
    <Composition id="Web-Machine" component={ClipMachine} durationInFrames={8 * WEB_FPS} fps={WEB_FPS} width={1080} height={1080} />
    <Composition id="Web-Sleep" component={ClipSleep} durationInFrames={6 * WEB_FPS} fps={WEB_FPS} width={1080} height={1080} />
    <Composition id="Lux-Hero" component={LuxHero} durationInFrames={8 * LUX_FPS} fps={LUX_FPS} width={1080} height={1350} />
    <Composition id="Lux-Host" component={LuxHost} durationInFrames={6 * LUX_FPS} fps={LUX_FPS} width={1080} height={1080} />
    <Composition id="Lux-Og" component={LuxOg} durationInFrames={1} fps={LUX_FPS} width={1200} height={630} />
    <Composition id="Avatar" component={Avatar} durationInFrames={1} fps={FPS} width={1080} height={1080} />
    <Composition id="Banner" component={Banner} durationInFrames={1} fps={FPS} width={2560} height={1440} />
    <Composition id="BannerSafeArea" component={Banner} defaultProps={{showSafeArea: true}} durationInFrames={1} fps={FPS} width={2560} height={1440} />
  </>
);
