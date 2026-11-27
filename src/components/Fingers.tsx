import React from 'react';
import {clamp, mix, wobble} from '../lib/anim';
import {C} from '../lib/theme';

/* Props for FACT #005 (why fingers wrinkle in water). Screen coordinates (inside <Svg>). */
const INK = '#120C33';
const SKIN = '#F4C7A1';
const SKIN_SHADE = '#E3A982';
const CREASE = '#A9623F';
const WATER = '#4FB8FF';

/** A wavy crease centred on (cx, y), width w. */
const crease = (cx: number, y: number, w: number, amp: number, seed: number, n = 4) => {
  let d = `M ${cx - w / 2} ${y}`;
  for (let i = 1; i <= n; i++) {
    const x = cx - w / 2 + (w * i) / n;
    const cy = y + (i % 2 ? -1 : 1) * amp * (0.75 + 0.25 * Math.sin(seed * 3.1 + i * 1.7));
    d += ` Q ${x - w / n / 2} ${cy} ${x} ${y}`;
  }
  return d;
};

const FINGERS = [
  {cx: -102, len: 188},
  {cx: -34, len: 226},
  {cx: 34, len: 212},
  {cx: 102, len: 168},
];
const PALM_TOP = -250;
const THUMB = 'translate(-128 -110) rotate(-38)';

/**
 * A raised human hand, palm facing us. (x, y) = wrist centre; fingertips reach ~480 px above at s = 1.
 * wrinkle 0..1 pruney fingertips; nerve 0..1 shows the nerve, pulse animates signals; cut = damaged nerve.
 */
export const Hand: React.FC<{x: number; y: number; s?: number; rot?: number; wrinkle?: number; nerve?: number; pulse?: number; cut?: boolean; t?: number; sleeve?: string}> = ({
  x,
  y,
  s = 1,
  rot = 0,
  wrinkle = 0,
  nerve = 0,
  pulse = 0,
  cut = false,
  t = 0,
  sleeve = C.cyan,
}) => {
  const shapes = (fill: string, stroke?: string) => (
    <g fill={fill} stroke={stroke ?? 'none'} strokeWidth={stroke ? 16 : 0} strokeLinejoin="round">
      {FINGERS.map((f, i) => (
        <rect key={i} x={f.cx - 31} y={PALM_TOP - f.len} width={62} height={f.len + 70} rx={31} />
      ))}
      <rect x={-150} y={PALM_TOP} width={300} height={240} rx={72} />
      <rect x={-92} y={-60} width={184} height={150} rx={30} />
      <g transform={THUMB}>
        <rect x={-31} y={-150} width={62} height={180} rx={31} />
      </g>
    </g>
  );
  const wr = clamp(wrinkle);
  const tips = [...FINGERS.map((f) => ({cx: f.cx, top: PALM_TOP - f.len, tr: ''})), {cx: 0, top: -150, tr: THUMB}];
  const nervePts = FINGERS.map((f) => [f.cx, PALM_TOP - f.len + 70] as const);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={clamp(s * 4)}>
      {shapes(INK, INK)}
      {shapes(SKIN)}
      {/* palm shading */}
      <ellipse cx={10} cy={-150} rx={110} ry={80} fill={SKIN_SHADE} opacity={0.35} />
      <path d="M -110 -200 Q -40 -150 40 -205" stroke={SKIN_SHADE} strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d="M -120 -150 Q -30 -95 90 -130" stroke={SKIN_SHADE} strokeWidth={6} fill="none" strokeLinecap="round" />
      {/* pruney fingertips */}
      {wr > 0.01 &&
        tips.map((f, i) => (
          <g key={i} transform={f.tr || undefined}>
            <rect x={f.cx - 31} y={f.top} width={62} height={120} rx={31} fill="#E7A7A6" opacity={0.35 * wr} />
            <g stroke={CREASE} strokeWidth={4.5} fill="none" strokeLinecap="round" opacity={clamp(wr * 1.5)}>
              {[0, 1, 2, 3].map((k) => (
                <path key={k} d={crease(f.cx, f.top + 26 + k * 22, 42 - (k === 0 ? 10 : 0), 6 * wr, i * 7 + k)} />
              ))}
            </g>
          </g>
        ))}
      {/* nerve */}
      {nerve > 0.01 && (
        <g opacity={nerve} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={`M 0 120 L 0 ${cut ? 40 : -150}`} stroke={C.yellow} strokeWidth={9} />
          {cut ? (
            <g stroke="#8C86B0" strokeWidth={8} strokeDasharray="14 12">
              <path d="M 0 0 L 0 -150" />
              {nervePts.map(([nx, ny], i) => (
                <path key={i} d={`M 0 -150 L ${nx} ${ny}`} />
              ))}
            </g>
          ) : (
            <g stroke={C.yellow} strokeWidth={8}>
              {nervePts.map(([nx, ny], i) => (
                <path key={i} d={`M 0 -150 L ${nx} ${ny}`} />
              ))}
            </g>
          )}
          {!cut &&
            pulse > 0.01 &&
            nervePts.map(([nx, ny], i) => {
              const p = (((t * 1.3 + i * 0.23) % 1) + 1) % 1;
              const px = p < 0.5 ? 0 : (nx * (p - 0.5)) / 0.5;
              const py = p < 0.5 ? mix(120, -150, p / 0.5) : mix(-150, ny, (p - 0.5) / 0.5);
              return <circle key={i} cx={px} cy={py} r={13} fill="#FFF6B0" stroke={C.yellow} strokeWidth={4} opacity={pulse} />;
            })}
          {cut && (
            <g stroke={C.red} strokeWidth={12}>
              <path d="M -30 -10 L 30 50 M 30 -10 L -30 50" />
            </g>
          )}
        </g>
      )}
      {/* sleeve */}
      <rect x={-112} y={60} width={224} height={110} rx={22} fill={sleeve} stroke={INK} strokeWidth={8} />
    </g>
  );
};

/** A round close-up of a fingertip, clipped to a bubble. wrinkle 0..1 deepens the folds. */
export const Fingertip: React.FC<{x: number; y: number; r?: number; s?: number; wrinkle: number; id: string; t?: number; flow?: number}> = ({
  x,
  y,
  r = 200,
  s = 1,
  wrinkle,
  id,
  t = 0,
  flow = 0,
}) => {
  const rows = [-0.62, -0.36, -0.1, 0.16, 0.42, 0.68];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={clamp(s * 4)}>
      <defs>
        <clipPath id={`${id}-clip`}>
          <circle r={r} />
        </clipPath>
        <radialGradient id={`${id}-g`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#FFE0C6" />
          <stop offset="1" stopColor={SKIN_SHADE} />
        </radialGradient>
      </defs>
      <circle r={r + 14} fill="#fff" />
      <g clipPath={`url(#${id}-clip)`}>
        <rect x={-r} y={-r} width={2 * r} height={2 * r} fill={`url(#${id}-g)`} />
        {/* fingerprint ridges */}
        {Array.from({length: 9}, (_, k) => (
          <ellipse key={k} cx={r * 0.05} cy={r * 0.2} rx={r * (0.12 + k * 0.13)} ry={r * (0.09 + k * 0.1)} fill="none" stroke={SKIN_SHADE} strokeWidth={4} opacity={0.5} />
        ))}
        {/* wrinkle folds: shadow + highlight */}
        {wrinkle > 0.01 &&
          rows.map((ry, k) => (
            <g key={k} opacity={clamp(wrinkle * 1.3)}>
              <path d={crease(0, ry * r + 6, r * 2.2, r * 0.09 * wrinkle, k, 5)} stroke="#FFF1E4" strokeWidth={r * 0.05} fill="none" strokeLinecap="round" />
              <path d={crease(0, ry * r, r * 2.2, r * 0.09 * wrinkle, k, 5)} stroke={CREASE} strokeWidth={r * 0.045 * (0.4 + 0.6 * wrinkle)} fill="none" strokeLinecap="round" />
            </g>
          ))}
        {/* water draining along the creases */}
        {flow > 0.01 &&
          rows.flatMap((ry, k) =>
            [0, 1].map((j) => {
              const p = (((t * 0.9 + k * 0.17 + j * 0.5) % 1) + 1) % 1;
              const dir = (k + j) % 2 ? 1 : -1;
              const px = dir * p * r * 1.1;
              const py = ry * r + Math.sin((px / (r * 2.2)) * Math.PI * 5) * r * 0.05 - 4;
              return <ellipse key={`${k}-${j}`} cx={px} cy={py} rx={13} ry={9} fill={WATER} stroke="#fff" strokeWidth={3} opacity={flow * Math.sin(p * Math.PI)} />;
            }),
          )}
      </g>
      <circle r={r} fill="none" stroke="#fff" strokeWidth={14} />
      <circle r={r + 7} fill="none" stroke={INK} strokeWidth={5} />
    </g>
  );
};

/** Cross-section of a fingertip: water / skin / pulp with blood vessels and a nerve. */
export const SkinSection: React.FC<{x: number; y: number; w?: number; h?: number; t: number; shrink: number; fold: number; signal: number; water?: number; id?: string}> = ({
  x,
  y,
  w = 860,
  h = 560,
  t,
  shrink,
  fold,
  signal,
  water = 1,
  id = 'sec',
}) => {
  const x0 = -w / 2;
  const top = -h / 2;
  const surf = -h / 2 + 170;
  const N = 48;
  const yAt = (u: number) => surf + fold * 26 + fold * 30 * Math.sin((u / w) * Math.PI * 2 * 5 + 0.6);
  const curve = (off: number) => Array.from({length: N + 1}, (_, i) => [x0 + (w * i) / N, yAt(x0 + (w * i) / N) + off] as const);
  const topC = curve(0);
  const botC = curve(52);
  const skinD = `M ${topC.map(([a, b]) => `${a} ${b}`).join(' L ')} L ${[...botC].reverse().map(([a, b]) => `${a} ${b}`).join(' L ')} Z`;
  const pulpD = `M ${botC.map(([a, b]) => `${a} ${b}`).join(' L ')} L ${-x0} ${h / 2} L ${x0} ${h / 2} Z`;
  const vessels = [h / 2 - 210, h / 2 - 130];
  const vh = mix(58, 20, clamp(shrink));
  const nerveY = h / 2 - 50;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect x={x0} y={top} width={w} height={h} rx={40} />
        </clipPath>
      </defs>
      <rect x={x0 - 7} y={top - 7} width={w + 14} height={h + 14} rx={46} fill="#fff" />
      <g clipPath={`url(#${id}-clip)`}>
        <rect x={x0} y={top} width={w} height={h} fill="#1E2A6E" />
        {/* water */}
        <rect x={x0} y={top} width={w} height={h} fill={WATER} opacity={0.55 * water} />
        {[0, 1, 2].map((k) => (
          <path key={k} d={crease(0, top + 40 + k * 40 + wobble(t, 0.5, k) * 6, w * 1.1, 8, k, 9)} stroke="#fff" strokeWidth={4} fill="none" opacity={0.35 * water} />
        ))}
        <path d={pulpD} fill="#F6B2A7" />
        {/* blood vessels */}
        {vessels.map((vy, k) => (
          <g key={k}>
            <rect x={x0 + 40} y={vy - vh / 2} width={w - 80} height={vh} rx={vh / 2} fill="#E8455A" stroke={INK} strokeWidth={5} />
            <rect x={x0 + 60} y={vy - vh / 2 + vh * 0.18} width={w - 120} height={Math.max(3, vh * 0.16)} rx={4} fill="#fff" opacity={0.35} />
            {Array.from({length: 7}, (_, j) => {
              const px = ((((t * (90 - k * 20) + j * 120) % (w - 120)) + (w - 120)) % (w - 120)) + x0 + 60;
              return <ellipse key={j} cx={px} cy={vy} rx={Math.min(16, vh * 0.32)} ry={vh * 0.3} fill="#B81E35" opacity={0.8} />;
            })}
          </g>
        ))}
        {/* nerve */}
        <path d={crease(0, nerveY, w * 1.05, 10, 3, 8)} stroke={C.yellow} strokeWidth={9} fill="none" />
        {signal > 0.01 &&
          [0, 1, 2].map((k) => {
            const p = (((t * 0.8 + k / 3) % 1) + 1) % 1;
            const px = x0 + p * w;
            return (
              <g key={k} opacity={signal}>
                <circle cx={px} cy={nerveY} r={16} fill="#FFF6B0" stroke={C.yellow} strokeWidth={5} />
                <path d={`M ${px} ${nerveY - 20} L ${px - 10} ${vessels[1] + vh / 2 + 34} L ${px + 6} ${vessels[1] + vh / 2 + 28} L ${px - 4} ${vessels[1] + vh / 2 + 6}`} stroke={C.yellow} strokeWidth={5} fill="none" strokeLinejoin="round" opacity={0.8} />
              </g>
            );
          })}
        {/* skin */}
        <path d={skinD} fill={SKIN} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d={`M ${topC.map(([a, b]) => `${a} ${b + 12}`).join(' L ')}`} stroke="#FFE3CC" strokeWidth={6} fill="none" opacity={0.7} />
      </g>
      <rect x={x0} y={top} width={w} height={h} rx={40} fill="none" stroke={INK} strokeWidth={6} />
    </g>
  );
};

/** Bathtub, front view. (x, y) = centre of the rim. Draw after whatever sits in it. */
export const Tub: React.FC<{x: number; y: number; s?: number; t: number}> = ({x, y, s = 1, t}) => {
  const foam = [-330, -250, -170, 150, 230, 300, 360];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {foam.map((fx, i) => (
        <g key={i} transform={`translate(${fx} ${-24 + wobble(t, 0.7, i) * 6})`}>
          <circle r={34} fill="#fff" stroke="#C9D6FF" strokeWidth={4} />
          <circle cx={30} cy={8} r={24} fill="#fff" stroke="#C9D6FF" strokeWidth={4} />
          <circle cx={-26} cy={10} r={20} fill="#fff" stroke="#C9D6FF" strokeWidth={4} />
        </g>
      ))}
      <path d="M -380 0 L 380 0 L 352 230 Q 340 300 270 300 L -270 300 Q -340 300 -352 230 Z" fill="#F4F1FF" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      <path d="M -330 60 L -312 240" stroke="#fff" strokeWidth={16} strokeLinecap="round" opacity={0.8} />
      <rect x={-410} y={-26} width={820} height={44} rx={22} fill="#fff" stroke={INK} strokeWidth={9} />
      {[-250, 250].map((fx) => (
        <path key={fx} d={`M ${fx - 34} 296 L ${fx + 34} 296 L ${fx + 20} 340 L ${fx - 20} 340 Z`} fill="#C9C3E8" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      ))}
      {/* rubber duck on the rim */}
      <g transform={`translate(300 -50) rotate(${wobble(t, 0.6, 'duck') * 6})`}>
        <ellipse cx={0} cy={0} rx={54} ry={36} fill={C.yellow} stroke={INK} strokeWidth={6} />
        <circle cx={34} cy={-42} r={28} fill={C.yellow} stroke={INK} strokeWidth={6} />
        <path d="M 58 -44 L 84 -36 L 58 -28 Z" fill={C.orange} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <circle cx={40} cy={-48} r={5} fill={INK} />
      </g>
      {/* bubbles */}
      {[0, 1, 2, 3, 4].map((k) => {
        const p = (((t * 0.35 + k * 0.21) % 1) + 1) % 1;
        return <circle key={k} cx={-300 + k * 150 + Math.sin(t * 2 + k) * 20} cy={-40 - p * 420} r={10 + (k % 3) * 6} fill="none" stroke="#fff" strokeWidth={4} opacity={0.6 * (1 - p)} />;
      })}
    </g>
  );
};

/** A bowl of water, (x, y) = centre of the rim. */
export const Bowl: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -130 0 Q -120 110 0 110 Q 120 110 130 0 Z" fill="#DCD8F0" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <ellipse cx={0} cy={0} rx={130} ry={30} fill={WATER} stroke={INK} strokeWidth={7} />
    <ellipse cx={-30} cy={-6} rx={50} ry={8} fill="#fff" opacity={0.35} />
  </g>
);

export const MARBLE_COLORS = [C.pink, C.cyan, C.lime, C.yellow, C.orange, '#8C7DFF'];
export const Marble: React.FC<{x: number; y: number; r?: number; color: string}> = ({x, y, r = 24, color}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill={color} stroke={INK} strokeWidth={5} />
    <circle cx={-r * 0.35} cy={-r * 0.35} r={r * 0.28} fill="#fff" opacity={0.7} />
  </g>
);

/** Car tyre, side view, rotating by rot degrees. */
export const Tire: React.FC<{x: number; y: number; r?: number; s?: number; rot: number}> = ({x, y, r = 200, s = 1, rot}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={clamp(s * 4)}>
    <g transform={`rotate(${rot})`}>
      <circle r={r} fill="#2B2560" stroke={INK} strokeWidth={8} />
      {Array.from({length: 26}, (_, i) => (
        <g key={i} transform={`rotate(${(i * 360) / 26})`}>
          <path d={`M -14 ${-r + 4} L 14 ${-r + 4} L 8 ${-r + 46} L -8 ${-r + 46} Z`} fill="#120C33" />
        </g>
      ))}
      <circle r={r * 0.78} fill="none" stroke="#4A3F94" strokeWidth={6} />
      <circle r={r * 0.55} fill="#B8B3D6" stroke={INK} strokeWidth={8} />
      {Array.from({length: 5}, (_, i) => (
        <g key={i} transform={`rotate(${i * 72})`}>
          <rect x={-12} y={-r * 0.5} width={24} height={r * 0.36} rx={10} fill="#8C86B0" />
        </g>
      ))}
      <circle r={r * 0.14} fill="#DCD8F0" stroke={INK} strokeWidth={6} />
    </g>
  </g>
);
