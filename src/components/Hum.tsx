import React from 'react';
import {clamp, mix} from '../lib/anim';
import {C, FONT_HEAD} from '../lib/theme';

/* Props for FACT #006 (why you can't hum with your nose pinched). Screen coordinates (inside <Svg>). */
const INK = '#120C33';
const SKIN = '#F4C7A1';
const SKIN_SHADE = '#E3A982';
const AIR = '#7FE3FF';

type Pt = [number, number];
type Seg = [Pt, Pt, Pt, Pt];
const bez = ([a, b, c, d]: Seg, u: number): Pt => {
  const v = 1 - u;
  return [
    v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * c[0] + u * u * u * d[0],
    v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * c[1] + u * u * u * d[1],
  ];
};
/** Sample a chain of cubic segments into an evenly-spaced polyline lookup. */
const sampler = (segs: Seg[]) => {
  const pts: Pt[] = [];
  segs.forEach((s) => {
    for (let i = 0; i <= 40; i++) pts.push(bez(s, i / 40));
  });
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = acc[acc.length - 1];
  return (p: number): Pt => {
    const d = clamp(p) * total;
    let i = 1;
    while (i < acc.length - 1 && acc[i] < d) i++;
    const f = (d - acc[i - 1]) / Math.max(1e-6, acc[i] - acc[i - 1]);
    return [mix(pts[i - 1][0], pts[i][0], f), mix(pts[i - 1][1], pts[i][1], f)];
  };
};
const segD = (segs: Seg[]) => `M ${segs[0][0][0]} ${segs[0][0][1]} ` + segs.map(([, b, c, d]) => `C ${b[0]} ${b[1]} ${c[0]} ${c[1]} ${d[0]} ${d[1]}`).join(' ');

// Airway, local coordinates (head faces right). Lungs below, nostril at the right.
const WIND: Seg[] = [
  [[30, 470], [30, 400], [30, 330], [32, 250]],
  [[32, 250], [34, 170], [26, 90], [44, 20]],
  [[44, 20], [90, -14], [170, -12], [222, 22]],
  [[222, 22], [246, 38], [256, 58], [268, 76]],
];
const MOUTH: Seg[] = [[[36, 118], [100, 104], [170, 108], [226, 128]]];
const along = sampler(WIND);
const FOLDS_P = 0.25; // where the vocal folds sit along the windpipe
export const NOSTRIL: Pt = [268, 76];

const HEAD_D =
  'M -150 470 C -160 380 -200 300 -220 200 C -250 60 -230 -140 -120 -250 C -40 -320 110 -320 175 -220 C 205 -170 212 -110 210 -60 C 214 -20 240 10 268 52 C 280 70 276 86 250 92 C 240 94 236 100 244 112 C 250 124 246 134 238 140 C 248 150 246 160 236 166 C 234 196 226 226 200 238 C 160 254 120 260 96 290 C 92 340 100 400 110 470 Z';

/**
 * Side-view head cut-away showing the airway. (x, y) = centre of the skull, s = scale.
 * flow: 0..1 air speed through the nose; pile: 0..1 air bunching up (nose blocked);
 * puff: cheek bulge; buzz: vocal-fold vibration; rings: hum leaving the nostril.
 */
export const HeadSection: React.FC<{x: number; y: number; s?: number; t: number; flow: number; pile: number; puff: number; buzz: number; rings: number; id?: string}> = ({
  x,
  y,
  s = 1,
  t,
  flow,
  pile,
  puff,
  buzz,
  rings,
  id = 'hs',
}) => {
  const fold = along(FOLDS_P);
  const jit = buzz > 0.01 ? Math.sin(t * 90) * 7 * buzz : 0;
  const N = 16;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={clamp(s * 4)}>
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={HEAD_D} />
        </clipPath>
      </defs>
      <path d={HEAD_D} fill={SKIN} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      <g clipPath={`url(#${id}-clip)`}>
        <ellipse cx={-40} cy={-120} rx={200} ry={170} fill={SKIN_SHADE} opacity={0.35} />
        {/* cheek puff */}
        <ellipse cx={170} cy={110} rx={60 + puff * 40} ry={44 + puff * 30} fill="#F2A68C" opacity={0.25 + puff * 0.45} />
        {/* airway */}
        <path d={segD(WIND)} stroke={INK} strokeWidth={56} fill="none" strokeLinecap="round" />
        <path d={segD(MOUTH)} stroke={INK} strokeWidth={50 + puff * 26} fill="none" strokeLinecap="round" />
        <path d={segD(WIND)} stroke="#B83A63" strokeWidth={44} fill="none" strokeLinecap="round" />
        <path d={segD(MOUTH)} stroke="#B83A63" strokeWidth={38 + puff * 26} fill="none" strokeLinecap="round" />
        {/* tongue */}
        <path d="M 60 150 C 100 120 170 128 214 146 C 190 170 110 176 60 168 Z" fill="#E86A8C" stroke={INK} strokeWidth={5} />
        {/* air particles */}
        {Array.from({length: N}, (_, i) => {
          const base = ((((t * 0.55 * flow + i / N) % 1) + 1) % 1);
          // when the nose is blocked, particles bunch up in the throat and mouth instead
          const p = mix(base, 0.32 + 0.62 * Math.pow(i / N, 0.7), pile);
          const [px, py] = along(p);
          const op = flow > 0.01 || pile > 0.01 ? 0.95 : 0;
          return <circle key={i} cx={px + (pile > 0.5 ? Math.sin(t * 8 + i) * 2 : 0)} cy={py} r={9} fill={AIR} stroke="#fff" strokeWidth={3} opacity={op} />;
        })}
        {pile > 0.01 &&
          Array.from({length: 7}, (_, i) => (
            <circle key={i} cx={70 + i * 24 + Math.sin(t * 6 + i) * 3} cy={122 + (i % 2) * 14} r={8} fill={AIR} stroke="#fff" strokeWidth={3} opacity={pile * 0.95} />
          ))}
        {/* vocal folds */}
        <g transform={`translate(${fold[0]} ${fold[1]})`}>
          <path d={`M -22 0 L ${-4 - Math.abs(jit)} -6 L ${-4 - Math.abs(jit)} 6 Z`} fill="#FFF1F6" stroke={INK} strokeWidth={3} />
          <path d={`M 22 0 L ${4 + Math.abs(jit)} -6 L ${4 + Math.abs(jit)} 6 Z`} fill="#FFF1F6" stroke={INK} strokeWidth={3} />
        </g>
      </g>
      {/* lips sealed */}
      <path d="M 228 128 L 246 128" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      {/* eye + brow */}
      <ellipse cx={150} cy={-70} rx={20} ry={14} fill="#fff" stroke={INK} strokeWidth={5} />
      <circle cx={158} cy={-70} r={8} fill={INK} />
      <path d="M 122 -104 Q 150 -114 178 -102" stroke="#6B3A1E" strokeWidth={9} fill="none" strokeLinecap="round" />
      {/* air leaving the nostril */}
      {flow > 0.01 &&
        Array.from({length: 5}, (_, i) => {
          const p = (((t * 0.9 * flow + i / 5) % 1) + 1) % 1;
          return <circle key={i} cx={NOSTRIL[0] + 10 + p * 140} cy={NOSTRIL[1] + 6 + p * 40} r={8 * (1 - p * 0.5)} fill={AIR} opacity={(1 - p) * flow} />;
        })}
      {rings > 0.01 &&
        [0, 1, 2].map((i) => {
          const p = (((t * 1.3 + i / 3) % 1) + 1) % 1;
          return <path key={i} d={`M ${NOSTRIL[0] + 30 + p * 120} ${NOSTRIL[1] - 50 - p * 40} Q ${NOSTRIL[0] + 70 + p * 150} ${NOSTRIL[1] + 10} ${NOSTRIL[0] + 30 + p * 120} ${NOSTRIL[1] + 70 + p * 40}`} stroke={C.yellow} strokeWidth={9} fill="none" strokeLinecap="round" opacity={rings * (1 - p)} />;
        })}
    </g>
  );
};

/** A hand pinching the nose: index finger from above, thumb from below. (x, y) = nose tip. close 0..1, away 0..1 (hand leaves). */
export const Pinch: React.FC<{x: number; y: number; s?: number; close: number; away?: number}> = ({x, y, s = 1, close, away = 0}) => {
  const spread = mix(60, 0, close);
  const index = `M 150 96 C 130 10 70 ${-34 - spread} 10 ${-26 - spread}`;
  const thumb = `M 118 150 C 90 120 50 ${44 + spread} 10 ${26 + spread}`;
  const stroke = (d: string, w: number, color: string) => <path d={d} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" />;
  return (
    <g transform={`translate(${x + away * 220} ${y + away * 160}) scale(${s})`} opacity={clamp((1 - away) * 2.5) * clamp(close * 4 + 0.001)}>
      {/* forearm + sleeve */}
      {stroke('M 170 150 L 330 430', 104, INK)}
      {stroke('M 170 150 L 330 430', 88, SKIN)}
      <g transform="translate(300 380) rotate(-30)">
        <rect x={-62} y={-20} width={124} height={120} rx={22} fill={C.cyan} stroke={INK} strokeWidth={8} />
      </g>
      {stroke(index, 58, INK)}
      {stroke(thumb, 58, INK)}
      <ellipse cx={168} cy={138} rx={78} ry={64} transform="rotate(-30 168 138)" fill={SKIN} stroke={INK} strokeWidth={8} />
      {stroke(index, 44, SKIN)}
      {stroke(thumb, 44, SKIN)}
      <path d="M 140 112 Q 150 128 140 146" stroke={SKIN_SHADE} strokeWidth={6} fill="none" strokeLinecap="round" />
    </g>
  );
};

/** Two pressure columns: lungs (below the folds) vs mouth + throat (above). */
export const PressureBars: React.FC<{x: number; y: number; s: number; above: number; below?: number}> = ({x, y, s, above, below = 0.85}) => {
  const H = 260;
  const bar = (bx: number, v: number, label: string, color: string) => (
    <g transform={`translate(${bx} 0)`}>
      <rect x={-44} y={-H} width={88} height={H} rx={20} fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.35)" strokeWidth={4} />
      <rect x={-44} y={-H * v} width={88} height={H * v} rx={20} fill={color} />
      <text y={48} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={26} letterSpacing={2} fill="#fff">
        {label}
      </text>
    </g>
  );
  const eq = clamp((above - below + 0.08) / 0.08);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={clamp(s * 3)}>
      <text x={0} y={-H - 34} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={30} letterSpacing={3} fill={C.cyan}>
        AIR PRESSURE
      </text>
      {bar(-80, below, 'LUNGS', C.pink)}
      {bar(80, above, 'MOUTH', AIR)}
      <text x={0} y={-H * 0.45} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={64} fill={eq > 0.5 ? C.lime : 'rgba(255,255,255,0.4)'}>
        {eq > 0.5 ? '=' : '>'}
      </text>
    </g>
  );
};
