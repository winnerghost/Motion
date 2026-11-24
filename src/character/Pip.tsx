import React from 'react';
import {wobble} from '../lib/anim';

/**
 * PIP — the channel's signature character.
 *
 * A round, glossy, endlessly curious creature with a glowing "idea" antenna.
 * Pip is drawn entirely in SVG and driven by a `pose` object, so every
 * episode can puppet the same character with keyframes (see episodes/).
 *
 * Coordinates: (x, y) is the point on the ground between Pip's feet.
 * Local units are pixels at scale 1 — Pip is ~470px tall at scale 1.
 */
export type PipPose = {
  x: number;
  y: number;
  scale: number;
  tilt: number; // degrees, pivots at the feet
  squash: number; // 1 = normal, >1 tall & thin, <1 short & wide
  hop: number; // px off the ground
  lookX: number; // -1..1
  lookY: number; // -1..1
  lid: number; // 0 open .. 0.5 deadpan .. 1 closed
  happyEyes: number; // 0..1  ^ ^
  browL: number; // -1 low .. 1 raised
  browR: number;
  browAngry: number; // -1 worried .. 1 angry
  smile: number; // -1 frown .. 1 grin
  smirk: number; // -1..1 lopsided
  mouthOpen: number; // 0..1 on top of talking
  mouthW: number; // width multiplier
  talk: number; // 0..1 lip-sync envelope
  blush: number; // 0..1
  handL: [number, number]; // hand position relative to body centre
  handR: [number, number];
  fingers: number; // 0..1 finger wiggle (tickling!)
  antennaGlow: number; // 0..1
  goggles: number; // 0..1
  footTap: number; // 0..1
  opacity: number;
};

export const PIP_REST: PipPose = {
  x: 540,
  y: 1150,
  scale: 1,
  tilt: 0,
  squash: 1,
  hop: 0,
  lookX: 0,
  lookY: 0,
  lid: 0,
  happyEyes: 0,
  browL: 0,
  browR: 0,
  browAngry: 0,
  smile: 0.35,
  smirk: 0,
  mouthOpen: 0,
  mouthW: 1,
  talk: 0,
  blush: 0.25,
  handL: [-212, 118],
  handR: [212, 118],
  fingers: 0,
  antennaGlow: 0.5,
  goggles: 0,
  footTap: 0,
  opacity: 1,
};

const BODY_RX = 190;
const BODY_RY = 205;
const GROUND = 238; // local y of the ground line

const COL = {
  bodyHi: '#FFC56E',
  body: '#FF9433',
  bodyLo: '#E4541A',
  limb: '#F07A22',
  foot: '#D9531A',
  ink: '#1A1446',
  mouth: '#3B0D1F',
  tongue: '#FF6B8E',
  brow: '#7A2C0C',
  antenna: '#E8691F',
  bulb: '#45E9FF',
};

function blinkAmount(t: number) {
  // Natural, irregular blinking: every ~2.6–4.2 s, 0.14 s long.
  let a = 0;
  for (let k = 0; k < 40; k++) {
    const bt = 0.7 + k * 3.3 + wobble(k * 1.7, 1, 'blink') * 0.9;
    const d = Math.abs(t - bt);
    if (d < 0.07) a = Math.max(a, 1 - d / 0.07);
  }
  return a;
}

const Arm: React.FC<{
  side: -1 | 1;
  hand: [number, number];
  fingers: number;
  t: number;
}> = ({side, hand, fingers, t}) => {
  const sx = side * 150;
  const sy = 40;
  const [hx, hy] = hand;
  const dx = hx - sx;
  const dy = hy - sy;
  const len = Math.hypot(dx, dy) || 1;
  // perpendicular, pick the one that droops downward (gravity)
  let nx = -dy / len;
  let ny = dx / len;
  if (ny < 0 || (Math.abs(ny) < 0.05 && nx * side < 0)) {
    nx = -nx;
    ny = -ny;
  }
  const bend = Math.min(60, len * 0.2);
  const cx = (sx + hx) / 2 + nx * bend;
  const cy = (sy + hy) / 2 + ny * bend;
  const ux = dx / len;
  const uy = dy / len;
  const fingerNubs = [-42, 0, 42].map((deg, i) => {
    const w = fingers * Math.sin(t * 34 + i * 2.1) * 28;
    const a = Math.atan2(uy, ux) + ((deg + w) * Math.PI) / 180;
    return [hx + Math.cos(a) * 26, hy + Math.sin(a) * 26] as const;
  });
  return (
    <g>
      <path
        d={`M ${sx} ${sy} Q ${cx} ${cy} ${hx} ${hy}`}
        stroke={COL.limb}
        strokeWidth={30}
        strokeLinecap="round"
        fill="none"
      />
      {fingerNubs.map(([fx, fy], i) => (
        <circle key={i} cx={fx} cy={fy} r={11} fill={COL.body} />
      ))}
      <circle cx={hx} cy={hy} r={28} fill={COL.body} />
      <circle cx={hx - 9} cy={hy - 10} r={9} fill="#fff" opacity={0.35} />
    </g>
  );
};

const Eye: React.FC<{
  id: string;
  cx: number;
  cy: number;
  lookX: number;
  lookY: number;
  lid: number;
  happy: number;
  lidColor: string;
}> = ({id, cx, cy, lookX, lookY, lid, happy, lidColor}) => {
  const rx = 50;
  const ry = 60;
  const lidY = -ry - 4 + Math.min(1, lid) * (2 * ry + 8);
  const sag = 10 - lid * 14; // eyelid edge curvature
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <g opacity={1 - happy}>
        <clipPath id={`${id}-clip`}>
          <ellipse cx={0} cy={0} rx={rx} ry={ry} />
        </clipPath>
        <g clipPath={`url(#${id}-clip)`}>
          <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="#fff" />
          <ellipse cx={0} cy={-ry * 0.55} rx={rx} ry={ry * 0.5} fill="#DCD8F0" opacity={0.55} />
          <g transform={`translate(${lookX * 20} ${lookY * 24})`}>
            <circle r={31} fill="#2B2A6B" />
            <circle r={20} fill={COL.ink} />
            <circle cx={-10} cy={-11} r={10} fill="#fff" />
            <circle cx={9} cy={10} r={4.5} fill="#fff" opacity={0.85} />
          </g>
          {lid > 0.01 && (
            <path
              d={`M ${-rx - 10} ${-ry - 20} L ${rx + 10} ${-ry - 20} L ${rx + 10} ${lidY} Q 0 ${lidY + sag * 2} ${-rx - 10} ${lidY} Z`}
              fill={lidColor}
            />
          )}
        </g>
        {lid > 0.01 && lid < 0.98 && (
          <path
            d={`M ${-rx * 0.96} ${lidY + 4} Q 0 ${lidY + sag * 2 + 4} ${rx * 0.96} ${lidY + 4}`}
            stroke={COL.ink}
            strokeWidth={7}
            strokeLinecap="round"
            fill="none"
            opacity={0.85}
          />
        )}
        {lid >= 0.98 && (
          <path
            d={`M ${-rx * 0.8} 6 Q 0 22 ${rx * 0.8} 6`}
            stroke={COL.ink}
            strokeWidth={9}
            strokeLinecap="round"
            fill="none"
          />
        )}
      </g>
      {happy > 0.01 && (
        <path
          d={`M ${-rx * 0.85} 14 Q 0 ${-ry * 0.9} ${rx * 0.85} 14`}
          stroke={COL.ink}
          strokeWidth={13}
          strokeLinecap="round"
          fill="none"
          opacity={happy}
        />
      )}
    </g>
  );
};

export const Pip: React.FC<{pose: Partial<PipPose>; t: number; id?: string}> = ({
  pose: partial,
  t,
  id = 'pip',
}) => {
  const p: PipPose = {...PIP_REST, ...partial};
  const breathe = Math.sin(t * Math.PI * 0.9) * 0.012;
  const sq = p.squash + breathe + p.talk * 0.025;
  const sx = 1 / Math.sqrt(sq);
  const sy = sq;
  const lid = Math.max(p.lid, blinkAmount(t) * (1 - p.happyEyes));
  const open = Math.min(1, p.mouthOpen + p.talk * 0.95);

  // Mouth geometry
  const w = 46 * p.mouthW * (1 + open * 0.15);
  const lift = p.smile * 16;
  const Ly = -lift + p.smirk * 12;
  const Ry = -lift - p.smirk * 12;
  const upMid = p.smile * 7 - open * 6;
  const loMid = upMid + 4 + open * 78 + Math.max(0, p.smile) * 12;
  const ctrl = (mid: number, ends: number) => 2 * mid - ends;
  const ends = (Ly + Ry) / 2;
  const mouthD = `M ${-w} ${Ly} Q 0 ${ctrl(upMid, ends)} ${w} ${Ry} Q 0 ${ctrl(loMid, ends)} ${-w} ${Ly} Z`;

  const sway = wobble(t, 0.7, `${id}-ant`) * 16 - p.tilt * 2.2 + p.hop * 0.05;
  const tipX = sway;
  const tipY = -330 + Math.abs(sway) * 0.25 - p.talk * 6;

  const browY = (raise: number) => -132 - raise * 24 - (1 - p.lid) * 0 + p.lid * 10;
  const glow = p.antennaGlow;

  return (
    <g opacity={p.opacity}>
      <defs>
        <radialGradient id={`${id}-body`} cx="34%" cy="26%" r="82%">
          <stop offset="0" stopColor={COL.bodyHi} />
          <stop offset="0.45" stopColor={COL.body} />
          <stop offset="1" stopColor={COL.bodyLo} />
        </radialGradient>
        <radialGradient id={`${id}-rim`} cx="28%" cy="30%" r="88%">
          <stop offset="0.74" stopColor="#7B6BFF" stopOpacity={0} />
          <stop offset="1" stopColor="#8C7DFF" stopOpacity={0.55} />
        </radialGradient>
        <radialGradient id={`${id}-bulb`} cx="40%" cy="38%" r="60%">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.45" stopColor="#B9F7FF" />
          <stop offset="1" stopColor={COL.bulb} />
        </radialGradient>
        <radialGradient id={`${id}-lens`} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#E9FDFF" stopOpacity={0.95} />
          <stop offset="0.5" stopColor="#7FEFFF" stopOpacity={0.7} />
          <stop offset="1" stopColor="#2EB8E6" stopOpacity={0.85} />
        </radialGradient>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={`${id}-glow`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <filter id={`${id}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <clipPath id={`${id}-bodyclip`}>
          <ellipse cx={0} cy={0} rx={BODY_RX} ry={BODY_RY} />
        </clipPath>
      </defs>

      <g transform={`translate(${p.x} ${p.y}) scale(${p.scale})`}>
        {/* ground shadow (doesn't tilt or hop) */}
        <ellipse
          cx={0}
          cy={2}
          rx={170 * (1 - Math.min(0.5, p.hop / 500))}
          ry={22}
          fill="#05030F"
          opacity={0.5 * (1 - Math.min(0.7, p.hop / 300))}
          filter={`url(#${id}-shadow)`}
        />
        <g transform={`rotate(${p.tilt}) translate(0 ${-GROUND - p.hop})`}>
          {/* feet */}
          <ellipse cx={-78} cy={214} rx={58} ry={27} fill={COL.foot} />
          <g transform={`translate(78 ${214 - p.footTap * 22}) rotate(${-p.footTap * 22} 40 10)`}>
            <ellipse cx={0} cy={0} rx={58} ry={27} fill={COL.foot} />
          </g>

          {/* squash & stretch anchored at the bottom of the body */}
          <g transform={`translate(0 ${BODY_RY}) scale(${sx} ${sy}) translate(0 ${-BODY_RY})`}>
            {/* antenna */}
            <path
              d={`M 0 -190 Q ${tipX * 0.35} -262 ${tipX} ${tipY}`}
              stroke={COL.antenna}
              strokeWidth={10}
              strokeLinecap="round"
              fill="none"
            />
            <circle cx={tipX} cy={tipY} r={44} fill={COL.bulb} opacity={0.18 + glow * 0.5} filter={`url(#${id}-glow)`} />
            <circle cx={tipX} cy={tipY} r={21} fill={`url(#${id}-bulb)`} />
            <circle cx={tipX - 6} cy={tipY - 7} r={6} fill="#fff" opacity={0.9} />

            {/* body */}
            <ellipse cx={0} cy={0} rx={BODY_RX} ry={BODY_RY} fill={`url(#${id}-body)`} />
            <g clipPath={`url(#${id}-bodyclip)`}>
              <ellipse cx={0} cy={100} rx={128} ry={96} fill="#FFDDB0" opacity={0.42} filter={`url(#${id}-soft)`} />
              <ellipse cx={0} cy={0} rx={BODY_RX} ry={BODY_RY} fill={`url(#${id}-rim)`} />
              <ellipse
                cx={-78}
                cy={-128}
                rx={54}
                ry={30}
                transform="rotate(-32 -78 -128)"
                fill="#fff"
                opacity={0.42}
                filter={`url(#${id}-soft)`}
              />
              {/* goggles strap */}
              {p.goggles > 0.01 && (
                <rect x={-200} y={-176} width={400} height={24} fill="#2A2350" opacity={p.goggles} />
              )}
            </g>

            {/* cheeks */}
            <ellipse cx={-122} cy={24} rx={32} ry={18} fill="#FF4F8B" opacity={0.12 + p.blush * 0.5} filter={`url(#${id}-soft)`} />
            <ellipse cx={122} cy={24} rx={32} ry={18} fill="#FF4F8B" opacity={0.12 + p.blush * 0.5} filter={`url(#${id}-soft)`} />

            {/* eyes */}
            <Eye id={`${id}-eL`} cx={-72} cy={-48} lookX={p.lookX} lookY={p.lookY} lid={lid} happy={p.happyEyes} lidColor="#FFA244" />
            <Eye id={`${id}-eR`} cx={72} cy={-48} lookX={p.lookX} lookY={p.lookY} lid={lid} happy={p.happyEyes} lidColor="#FF9A3C" />

            {/* brows */}
            <rect
              x={-108}
              y={browY(p.browL)}
              width={72}
              height={17}
              rx={8.5}
              fill={COL.brow}
              transform={`rotate(${p.browAngry * 16 - p.browL * 4} -72 ${browY(p.browL) + 8})`}
            />
            <rect
              x={36}
              y={browY(p.browR)}
              width={72}
              height={17}
              rx={8.5}
              fill={COL.brow}
              transform={`rotate(${-p.browAngry * 16 + p.browR * 4} 72 ${browY(p.browR) + 8})`}
            />

            {/* mouth */}
            <g transform="translate(0 58)">
              <clipPath id={`${id}-mouthclip`}>
                <path d={mouthD} />
              </clipPath>
              <path d={mouthD} fill={COL.mouth} stroke={COL.mouth} strokeWidth={10} strokeLinejoin="round" />
              {open > 0.08 && (
                <g clipPath={`url(#${id}-mouthclip)`}>
                  <rect x={-w} y={ctrl(upMid, ends) / 2 - 30} width={w * 2} height={30 + open * 2} fill="#fff" opacity={Math.min(1, (open - 0.08) * 4)} />
                  <ellipse cx={0} cy={loMid - 4} rx={w * 0.62} ry={14 + open * 16} fill={COL.tongue} />
                </g>
              )}
            </g>

            {/* goggles on forehead */}
            {p.goggles > 0.01 && (
              <g opacity={p.goggles} transform={`translate(0 ${(1 - p.goggles) * -40})`}>
                {[-64, 64].map((gx) => (
                  <g key={gx}>
                    <circle cx={gx} cy={-166} r={40} fill={`url(#${id}-lens)`} stroke="#3A3570" strokeWidth={11} />
                    <ellipse cx={gx - 12} cy={-178} rx={12} ry={7} fill="#fff" opacity={0.8} transform={`rotate(-30 ${gx - 12} -178)`} />
                  </g>
                ))}
                <rect x={-26} y={-172} width={52} height={12} rx={6} fill="#3A3570" />
              </g>
            )}
          </g>

          {/* arms in front of the body */}
          <Arm side={-1} hand={p.handL} fingers={p.fingers} t={t} />
          <Arm side={1} hand={p.handR} fingers={p.fingers} t={t + 0.13} />
        </g>
      </g>
    </g>
  );
};
