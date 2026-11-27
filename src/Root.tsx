import React from 'react';
import {Composition} from 'remotion';
import {PipSheet} from './PipSheet';
import {WombatSheet} from './WombatSheet';
import {ClipHello, ClipMachine, ClipSleep, WEB_FPS} from './web/WebClips';
import {LuxHero, LuxHost, LuxOg, LUX_FPS} from './web/LuxClips';
import {Avatar, Banner} from './brand/Brand';
import {PipCutout} from './brand/PipCutout';
import {Brain10, MythStamp, PipPoseStill} from './brand/Ingredients';
import {LongMyths, LF01_DURATION} from './longform/lf01/Episode';
import {LFPS, LW, LH} from './longform/kit';
import {LF01Thumb} from './longform/lf01/Thumb';
import {Episode001, EP001_DURATION} from './episodes/ep001/Episode';
import {Episode002, EP002_DURATION} from './episodes/ep002/Episode';
import {Episode003, EP003_DURATION} from './episodes/ep003/Episode';
import {Episode004, EP004_DURATION} from './episodes/ep004/Episode';
import {Episode005, EP005_DURATION} from './episodes/ep005/Episode';
import {Episode006, EP006_DURATION} from './episodes/ep006/Episode';
import {Episode007, EP007_DURATION} from './episodes/ep007/Episode';
import {loadFonts} from './lib/theme';
import {FPS, W, H} from './lib/anim';

loadFonts();

export const Root: React.FC = () => (
  <>
    <Composition id="EP001-tickle" component={Episode001} durationInFrames={EP001_DURATION} fps={FPS} width={W} height={H} />
    <Composition id="EP002-tickle-foot-reply" component={Episode002} durationInFrames={EP002_DURATION} fps={FPS} width={W} height={H} />
    <Composition id="EP003-wombat-cubes" component={Episode003} durationInFrames={EP003_DURATION} fps={FPS} width={W} height={H} />
    <Composition id="EP004-recorded-voice" component={Episode004} durationInFrames={EP004_DURATION} fps={FPS} width={W} height={H} />
    <Composition id="EP005-no-head-reply" component={Episode005} durationInFrames={EP005_DURATION} fps={FPS} width={W} height={H} />
    <Composition id="EP006-bananas" component={Episode006} durationInFrames={EP006_DURATION} fps={FPS} width={W} height={H} />
    <Composition id="EP007-fingers" component={Episode007} durationInFrames={EP007_DURATION} fps={FPS} width={W} height={H} />
    <Composition id="EP007-cover" component={Episode007} defaultProps={{coverAt: 2.62}} durationInFrames={1} fps={FPS} width={W} height={H} />
    <Composition id="EP006-cover" component={Episode006} defaultProps={{coverAt: 1.75}} durationInFrames={1} fps={FPS} width={W} height={H} />
    <Composition id="EP005-cover" component={Episode005} defaultProps={{coverAt: 9.3}} durationInFrames={1} fps={FPS} width={W} height={H} />
    <Composition id="LF01-10-myths" component={LongMyths} durationInFrames={LF01_DURATION} fps={LFPS} width={LW} height={LH} />
    <Composition id="LF01-thumbnail" component={LF01Thumb} durationInFrames={1} fps={LFPS} width={1280} height={720} />
    <Composition id="PipSheet" component={PipSheet} durationInFrames={120} fps={FPS} width={W} height={H} />
    <Composition id="WombatSheet" component={WombatSheet} durationInFrames={60} fps={FPS} width={W} height={H} />
    <Composition id="Web-Hello" component={ClipHello} durationInFrames={8 * WEB_FPS} fps={WEB_FPS} width={1080} height={1080} />
    <Composition id="Web-Machine" component={ClipMachine} durationInFrames={8 * WEB_FPS} fps={WEB_FPS} width={1080} height={1080} />
    <Composition id="Web-Sleep" component={ClipSleep} durationInFrames={6 * WEB_FPS} fps={WEB_FPS} width={1080} height={1080} />
    <Composition id="Lux-Hero" component={LuxHero} durationInFrames={8 * LUX_FPS} fps={LUX_FPS} width={1080} height={1350} />
    <Composition id="Lux-Host" component={LuxHost} durationInFrames={6 * LUX_FPS} fps={LUX_FPS} width={1080} height={1080} />
    <Composition id="Lux-Og" component={LuxOg} durationInFrames={1} fps={LUX_FPS} width={1200} height={630} />
    <Composition
      id="Pip-Poster-Curious"
      component={PipCutout}
      defaultProps={{
        mirror: true,
        pose: {scale: 1.9, lookX: -0.5, lookY: -0.85, browL: 0.85, browR: 0.7, smile: 0.25, mouthOpen: 0.16, mouthW: 0.72, lid: 0, tilt: -6, antennaGlow: 1, blush: 0.3, handL: [-205, 80], handR: [196, 66]},
      }}
      durationInFrames={1}
      fps={FPS}
      width={1080}
      height={1920}
    />
    <Composition id="Ingredient-Pip-shocked" component={PipPoseStill} defaultProps={{pose: 'shocked'}} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="Ingredient-Pip-pointing" component={PipPoseStill} defaultProps={{pose: 'pointing'}} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="Ingredient-Pip-skeptical" component={PipPoseStill} defaultProps={{pose: 'skeptical'}} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="Ingredient-Pip-happy" component={PipPoseStill} defaultProps={{pose: 'happy'}} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="Ingredient-Pip-worried" component={PipPoseStill} defaultProps={{pose: 'worried'}} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="Ingredient-MythStamp" component={MythStamp} durationInFrames={1} fps={FPS} width={1400} height={800} />
    <Composition id="Ingredient-Brain10" component={Brain10} durationInFrames={1} fps={FPS} width={1200} height={700} />
    <Composition id="Avatar" component={Avatar} durationInFrames={1} fps={FPS} width={1080} height={1080} />
    <Composition id="Banner" component={Banner} durationInFrames={1} fps={FPS} width={2560} height={1440} />
    <Composition id="BannerSafeArea" component={Banner} defaultProps={{showSafeArea: true}} durationInFrames={1} fps={FPS} width={2560} height={1440} />
  </>
);
