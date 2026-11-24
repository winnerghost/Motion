import React from 'react';
import {wobble} from '../lib/anim';

/**
 * A stylised side-view brain (facing left) that can also act — it has an
 * optional cartoon face, a burglar mask, and glowing regions for diagrams.
 * Local units: ~620 x 470 px at scale 1, centred on (x, y).
 */
export type BrainProps = {
  x: number;
  y: number;
  scale?: number;
  rot?: number;
  t: number;
  id?: string;
  opacity?: number;
  face?: number; // 0..1
  lookX?: number;
  lookY?: number;
  lid?: number;
  smile?: number;
  smirk?: number;
  talk?: number;
  worried?: number;
  mask?: number; // 0..1 burglar mask
  motorGlow?: number;
  cerebGlow?: number;
  squash?: number;
};

// Outline control points (clockwise from the front-bottom).
const PTS: [number, number][] = [
  [-292, 40], [-305, -30], [-282, -100], [-236, -158], [-168, -200], [-92, -222], [-10, -226],
  [72, -214], [150, -186], [218, -140], [270, -82], [302, -12], [300, 58], [262, 104],
  [196, 118], [128, 112], [70, 128], [8, 160], [-66, 170], [-140, 156], [-206, 128], [-258, 92],
];

function smoothClosed(pts: [number, number][], bump = 0, t = 0) {
  const n = pts.length;
  const P = pts.map(([x, y], i) => {
    const k = 1 + bump * Math.sin(i * 2.3 + t);
    return [x * k, y * k] as [number, number];
  });
  let d = `M ${P[0][0]} ${P[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n];
    const p1 = P[i];
    const p2 = P[(i + 1) % n];
    const p3 = P[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`;
  }
  return d + ' Z';
}

const OUTLINE = smoothClosed(PTS);

const GYRI = [
  // central sulcus (motor strip runs just in front of it)
  'M 52 -218 C 30 -160 70 -120 34 -70 S 20 10 -6 60',
  // lateral fissure
  'M -214 96 C -150 70 -80 70 -20 48 S 90 20 150 30',
  'M -250 -40 q 34 -46 76 -12 t 70 -30',
  'M -232 30 q 40 -30 70 0 t 70 -20 t 50 10',
  'M -170 -150 q 30 30 64 6 t 60 -16',
  'M -60 -120 q 20 40 56 18',
  'M 110 -170 q -10 40 30 54 t 40 46',
  'M 120 -60 q 40 -20 70 10 t 60 -10',
  'M 90 60 q 30 -40 80 -20 t 70 -20',
  'M -120 -60 q 30 -20 60 6',
  'M -110 120 q 40 -24 90 -4',
];

export const Brain: React.FC<BrainProps> = ({
  x,
  y,
  scale = 1,
  rot = 0,
  t,
  id = 'brain',
  opacity = 1,
  face = 0,
  lookX = 0,
  lookY = 0,
  lid = 0,
  smile = 0.3,
  smirk = 0,
  talk = 0,
  worried = 0,
  mask = 0,
  motorGlow = 0,
  cerebGlow = 0,
  squash = 1,
}) => {
  const breathe = 1 + Math.sin(t * 2.4) * 0.012 + talk * 0.02;
  const sx = breathe / Math.sqrt(squash);
  const sy = breathe * squash;
  const open = Math.min(1, talk);
  const w = 34;
  const Ly = -smile * 12 + smirk * 10;
  const Ry = -smile * 12 - smirk * 10;
  const ends = (Ly + Ry) / 2;
  const upMid = smile * 5 - open * 4;
  const loMid = upMid + 3 + open * 52 + Math.max(0, smile) * 8;
  const mouthD = `M ${-w} ${Ly} Q 0 ${2 * upMid - ends} ${w} ${Ry} Q 0 ${2 * loMid - ends} ${-w} ${Ly} Z`;
  const eyeY = -30;
  const eyes = [-150, -54];
  const lidY = (ry: number) => -ry - 4 + lid * (2 * ry + 8);
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale * sx} ${scale * sy})`}>
      <defs>
        <radialGradient id={`${id}-fill`} cx="35%" cy="25%" r="85%">
          <stop offset="0" stopColor="#FFC3DA" />
          <stop offset="0.5" stopColor="#FF8DB8" />
          <stop offset="1" stopColor="#E25D92" />
        </radialGradient>
        <radialGradient id={`${id}-cfill`} cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#FFB3CF" />
          <stop offset="1" stopColor="#D9547F" />
        </radialGradient>
        <filter id={`${id}-glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <clipPath id={`${id}-clip`}>
          <path d={OUTLINE} />
        </clipPath>
      </defs>

      {/* brainstem */}
      <path d="M 96 100 C 100 160 120 210 112 262 L 170 262 C 168 210 170 160 168 104 Z" fill="#E86F9D" stroke="#B8396C" strokeWidth={6} />

      {/* cerebellum */}
      <g>
        <ellipse cx={208} cy={142} rx={112} ry={70} fill="#45E9FF" opacity={cerebGlow * 0.85} filter={`url(#${id}-glow)`} />
        <ellipse cx={208} cy={142} rx={104} ry={64} fill={`url(#${id}-cfill)`} stroke="#B8396C" strokeWidth={6} />
        {[-30, -8, 14, 36].map((dy, i) => (
          <path
            key={i}
            d={`M ${120 + Math.abs(dy) * 0.5} ${142 + dy} Q 208 ${142 + dy - 16} ${296 - Math.abs(dy) * 0.5} ${142 + dy}`}
            stroke="#B8396C"
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
            opacity={0.8}
          />
        ))}
        <ellipse cx={208} cy={142} rx={104} ry={64} fill="#8FF4FF" opacity={cerebGlow * 0.45} />
      </g>

      {/* cerebrum */}
      <path d={OUTLINE} fill={`url(#${id}-fill)`} stroke="#B8396C" strokeWidth={7} strokeLinejoin="round" />
      <g clipPath={`url(#${id}-clip)`}>
        <path
          d={GYRI[0]}
          stroke="#45E9FF"
          strokeWidth={46}
          strokeLinecap="round"
          fill="none"
          opacity={motorGlow * 0.9}
          filter={`url(#${id}-glow)`}
          transform="translate(-26 0)"
        />
        {GYRI.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="#C94377"
            strokeWidth={i < 2 ? 9 : 7}
            strokeLinecap="round"
            fill="none"
            opacity={(i < 2 ? 0.95 : 0.7) * (1 - face * 0.45)}
          />
        ))}
        <ellipse cx={-150} cy={-150} rx={90} ry={40} transform="rotate(-20 -150 -150)" fill="#fff" opacity={0.3} filter={`url(#${id}-soft)`} />
      </g>

      {/* face */}
      {face > 0.01 && (
        <g opacity={face} transform="translate(-10 0)">
          {mask > 0.01 && (
            <g opacity={Math.min(1, mask * 1.5)} transform={`translate(0 ${(1 - mask) * -60})`}>
              <path d={`M -214 ${eyeY - 40} Q -100 ${eyeY - 62} 12 ${eyeY - 40} L 14 ${eyeY + 36} Q -100 ${eyeY + 50} -214 ${eyeY + 36} Z`} fill="#16112F" />
              <path d={`M 10 ${eyeY - 20} q 40 -16 60 -40 M 10 ${eyeY + 10} q 46 0 66 20`} stroke="#16112F" strokeWidth={14} strokeLinecap="round" fill="none" />
            </g>
          )}
          {eyes.map((ex, i) => (
            <g key={i} transform={`translate(${ex} ${eyeY})`}>
              <clipPath id={`${id}-e${i}`}>
                <ellipse rx={34} ry={40} />
              </clipPath>
              <g clipPath={`url(#${id}-e${i})`}>
                <ellipse rx={34} ry={40} fill="#fff" />
                <g transform={`translate(${lookX * 14} ${lookY * 16})`}>
                  <circle r={18} fill="#1A1446" />
                  <circle cx={-6} cy={-7} r={6} fill="#fff" />
                </g>
                {lid > 0.01 && <rect x={-40} y={-50} width={80} height={lidY(40) + 50} fill="#F58AB5" />}
              </g>
              {lid > 0.01 && <path d={`M -32 ${lidY(40) + 2} L 32 ${lidY(40) + 2}`} stroke="#1A1446" strokeWidth={6} strokeLinecap="round" />}
              <rect
                x={-30}
                y={-66 - worried * 6}
                width={60}
                height={12}
                rx={6}
                fill="#8E2453"
                transform={`rotate(${(i === 0 ? 1 : -1) * worried * -14 + (i === 1 ? smirk * -10 : 0)})`}
              />
            </g>
          ))}
          <g transform={`translate(-102 ${68 + wobble(t, 0.5, `${id}m`) * 2})`}>
            <path d={mouthD} fill="#5A1030" stroke="#5A1030" strokeWidth={9} strokeLinejoin="round" />
          </g>
        </g>
      )}
    </g>
  );
};
