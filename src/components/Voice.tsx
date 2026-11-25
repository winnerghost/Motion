import React from 'react';
import {wobble} from '../lib/anim';
import {C, FONT_HEAD} from '../lib/theme';

/* All of these are drawn in Pip's LOCAL coordinates (via <Pip holding={...}/>)
 * unless noted: body centre = (0, 0), eyes at (±72, -48), mouth at (0, 58). */

/** Smartphone with a voice-memo screen. (x, y) = centre. */
export const Phone: React.FC<{x: number; y: number; rot?: number; scale?: number; t: number; playing?: number; facing?: 'front' | 'back'}> = ({
  x,
  y,
  rot = 0,
  scale = 1,
  t,
  playing = 0,
  facing = 'front',
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
    <rect x={-66} y={-120} width={132} height={240} rx={26} fill="#1A1446" stroke="#5B52B8" strokeWidth={6} />
    {facing === 'front' ? (
      <>
        <rect x={-56} y={-108} width={112} height={216} rx={18} fill="#2A2266" />
        <circle cx={0} cy={-80} r={10} fill={C.red} opacity={0.6 + 0.4 * Math.sin(t * 8)} />
        {Array.from({length: 11}, (_, i) => {
          const h = 8 + (playing > 0 ? Math.abs(wobble(t * 3 + i, 4, 'ph')) * 60 * playing : 4);
          return <rect key={i} x={-46 + i * 8.6} y={-h / 2} width={5} height={h} rx={2.5} fill={C.cyan} />;
        })}
        <rect x={-36} y={70} width={72} height={10} rx={5} fill="#5B52B8" />
      </>
    ) : (
      <>
        <rect x={-40} y={-100} width={46} height={46} rx={12} fill="#2A2266" />
        <circle cx={-17} cy={-77} r={12} fill="#0A0722" stroke="#5B52B8" strokeWidth={3} />
      </>
    )}
  </g>
);

/** Cool sunglasses that sit on Pip's eyes. */
export const Sunglasses: React.FC<{s?: number; dy?: number; rot?: number}> = ({s = 1, dy = 0, rot = 0}) => (
  <g transform={`translate(0 ${-50 + dy}) rotate(${rot}) scale(${s})`} opacity={Math.min(1, s * 3)}>
    <rect x={-150} y={-10} width={300} height={16} rx={8} fill="#0B0824" />
    {[-72, 72].map((ex) => (
      <g key={ex}>
        <path d={`M ${ex - 66} -22 L ${ex + 66} -22 L ${ex + 56} 30 C ${ex + 50} 52 ${ex - 50} 52 ${ex - 56} 30 Z`} fill="#0B0824" />
        <path d={`M ${ex - 46} -12 L ${ex - 14} -12 L ${ex - 40} 26 Z`} fill="#fff" opacity={0.25} />
      </g>
    ))}
  </g>
);

/** A cartoon ear "sticker" (Pip has no ears — this one is for science). */
export const Ear: React.FC<{x: number; y: number; s?: number; glow?: number}> = ({x, y, s = 1, glow = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, s * 2)}>
    {glow > 0 && <circle r={70} fill={C.pink} opacity={glow * 0.35} />}
    <path d="M -12 -50 C 40 -62 52 -8 36 18 C 26 34 14 34 12 52 C 10 66 -12 66 -16 50" fill="#FFB36B" stroke="#C8571B" strokeWidth={7} strokeLinejoin="round" />
    <path d="M -2 -30 C 26 -34 30 -6 18 8 C 12 16 4 14 4 26" stroke="#C8571B" strokeWidth={6} fill="none" strokeLinecap="round" />
  </g>
);

/** Expanding sound rings from a point. */
export const SoundRings: React.FC<{cx: number; cy: number; t: number; color: string; count?: number; maxR?: number; speed?: number; width?: number; opacity?: number}> = ({
  cx,
  cy,
  t,
  color,
  count = 4,
  maxR = 160,
  speed = 1.4,
  width = 8,
  opacity = 1,
}) => (
  <g opacity={opacity}>
    {Array.from({length: count}, (_, i) => {
      const p = ((t * speed + i / count) % 1 + 1) % 1;
      return <circle key={i} cx={cx} cy={cy} r={20 + p * maxR} fill="none" stroke={color} strokeWidth={width * (1 - p * 0.6)} opacity={(1 - p) * 0.9} />;
    })}
  </g>
);

/** Dashed, flowing path. */
export const FlowPath: React.FC<{d: string; t: number; color: string; draw?: number; width?: number}> = ({d, t, color, draw = 1, width = 10}) => (
  <g>
    <path d={d} stroke={color} strokeOpacity={0.2} strokeWidth={width * 3} fill="none" strokeLinecap="round" pathLength={1000} strokeDasharray={1000} strokeDashoffset={1000 * (1 - draw)} />
    <path
      d={d}
      stroke={color}
      strokeWidth={width}
      fill="none"
      strokeLinecap="round"
      pathLength={1000}
      strokeDasharray={draw >= 1 ? '30 26' : `${1000 * draw} 1000`}
      strokeDashoffset={draw >= 1 ? -t * 160 : 0}
    />
  </g>
);

/** Equaliser bars (screen coordinates). `low` / `high` 0..1 scale each half. */
export const EqBars: React.FC<{x: number; y: number; w?: number; h?: number; t: number; low: number; high: number; color: string; s?: number}> = ({
  x,
  y,
  w = 640,
  h = 240,
  t,
  low,
  high,
  color,
  s = 1,
}) => {
  const n = 14;
  const bw = w / n;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, s * 2)}>
      <rect x={-w / 2 - 30} y={-h - 40} width={w + 60} height={h + 110} rx={36} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" strokeWidth={3} />
      {Array.from({length: n}, (_, i) => {
        const u = i / (n - 1);
        const base = (1 - u) * low + u * high;
        const jig = 0.75 + 0.25 * Math.abs(wobble(t * 2 + i * 0.7, 3, 'eq'));
        const bh = Math.max(10, h * base * jig);
        return <rect key={i} x={-w / 2 + i * bw + 6} y={-bh} width={bw - 12} height={bh} rx={8} fill={color} opacity={0.55 + 0.45 * (1 - u)} />;
      })}
      <text x={-w / 2} y={50} fontFamily={FONT_HEAD} fontWeight={800} fontSize={28} letterSpacing={4} fill="rgba(255,255,255,0.7)">
        LOW
      </text>
      <text x={w / 2} y={50} textAnchor="end" fontFamily={FONT_HEAD} fontWeight={800} fontSize={28} letterSpacing={4} fill="rgba(255,255,255,0.7)">
        HIGH
      </text>
    </g>
  );
};
