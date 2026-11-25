import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Background} from './components/Background';
import {GutRing, GutTube, Mark, PoopBall, PoopBlob, PoopCube, Rock, Trophy, Wombat} from './components/Wombat';
import {FPS, W, H} from './lib/anim';

/** Model sheet for the EP003 guest star and props. */
export const WombatSheet: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill>
      <Background t={t} />
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <Wombat x={300} y={520} scale={0.75} t={t} smug={0.6} />
        <Wombat x={800} y={520} scale={0.6} t={t} lid={0.5} smug={0.9} id="w2" />
        <PoopCube x={150} y={720} size={90} t={t} sparkle={1} />
        <PoopBall x={330} y={720} r={42} />
        <PoopBlob x={500} y={720} t={t} />
        <Mark x={680} y={680} ok={false} s={1} />
        <Mark x={780} y={680} ok s={1} />
        <GutTube x={540} y={900} t={t} balloonIn={1} inflate={1} />
        <GutRing x={300} y={1300} square={0} poop={1} t={t} labels={1} />
        <GutRing x={780} y={1300} square={1} poop={1} t={t} labels={1} />
        <Rock x={300} y={1800} scale={0.8} />
        <PoopCube x={300} y={1660} size={70} t={t} />
        <Trophy x={800} y={1820} scale={0.9} t={t} />
      </svg>
    </AbsoluteFill>
  );
};
