import React from 'react';
import {clamp, wobble} from '../lib/anim';
import {C, FONT_HEAD} from '../lib/theme';

/* Props for FACT #004 (bananas are radioactive). Screen coordinates (inside <Svg>). */
const INK = '#120C33';

/** A cartoon banana, (x, y) = centre. face 0..1 adds eyes; scared 0..1 makes it panic. */
export const Banana: React.FC<{x: number; y: number; s?: number; rot?: number; t: number; face?: number; scared?: number; id?: string}> = ({
  x,
  y,
  s = 1,
  rot = 0,
  t,
  face = 0,
  scared = 0,
  id = 'ban',
}) => {
  const shiver = scared > 0.01 ? Math.sin(t * 70) * 4 * scared : 0;
  return (
    <g transform={`translate(${x + shiver} ${y}) rotate(${rot}) scale(${s})`} opacity={clamp(s * 3)}>
      <defs>
        <linearGradient id={`${id}-peel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF3A0" />
          <stop offset="0.45" stopColor="#FFD84D" />
          <stop offset="1" stopColor="#E8A92A" />
        </linearGradient>
      </defs>
      <ellipse cx={0} cy={150} rx={230} ry={26} fill="#000" opacity={0.18} />
      <path d="M -250 -40 C -180 120 160 150 260 -70 C 210 20 -130 40 -230 -70 Z" fill={`url(#${id}-peel)`} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <path d="M -220 -40 C -120 60 120 70 230 -40" stroke="#C98A1A" strokeWidth={6} fill="none" opacity={0.55} strokeLinecap="round" />
      <path d="M -150 10 C -60 50 70 50 160 0" stroke="#fff" strokeWidth={10} fill="none" opacity={0.45} strokeLinecap="round" />
      {/* stem and tip */}
      <path d="M 250 -64 L 290 -96 L 304 -82 L 266 -54 Z" fill="#6B8E2E" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -236 -60 L -258 -76 L -248 -48 Z" fill="#4A3420" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {face > 0.01 && (
        <g opacity={face} transform="translate(10 44) scale(1.35)">
          {[-46, 46].map((ex) => (
            <g key={ex}>
              <ellipse cx={ex} cy={-10} rx={18 + scared * 6} ry={22 + scared * 8} fill="#fff" stroke={INK} strokeWidth={4} />
              <circle cx={ex + (scared > 0.5 ? -6 : 0)} cy={-6} r={9 - scared * 2} fill={INK} />
            </g>
          ))}
          {scared > 0.3 ? (
            <path d="M -26 36 Q -13 26 0 36 Q 13 46 26 36" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
          ) : (
            <path d="M -22 30 Q 0 46 22 30" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
          )}
          {scared > 0.3 && (
            <path d={`M 84 -60 C 74 -40 70 -26 82 -18 C 94 -10 104 -24 98 -40 C 94 -50 90 -54 84 -60 Z`} fill="#7FE3FF" opacity={scared} transform={`translate(0 ${(t * 40) % 30})`} />
          )}
        </g>
      )}
    </g>
  );
};

/** The radiation trefoil on a yellow disc. */
export const Trefoil: React.FC<{x: number; y: number; r?: number; s?: number; rot?: number}> = ({x, y, r = 70, s = 1, rot = 0}) => {
  const blade = (a: number) => {
    const a0 = ((a - 30) * Math.PI) / 180;
    const a1 = ((a + 30) * Math.PI) / 180;
    const ri = r * 0.24;
    const ro = r * 0.82;
    return `M ${Math.cos(a0) * ri} ${Math.sin(a0) * ri} L ${Math.cos(a0) * ro} ${Math.sin(a0) * ro} A ${ro} ${ro} 0 0 1 ${Math.cos(a1) * ro} ${Math.sin(a1) * ro} L ${Math.cos(a1) * ri} ${Math.sin(a1) * ri} A ${ri} ${ri} 0 0 0 ${Math.cos(a0) * ri} ${Math.sin(a0) * ri} Z`;
  };
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={clamp(s * 3)}>
      <circle r={r} fill={C.yellow} stroke={INK} strokeWidth={r * 0.09} />
      {[-90, 30, 150].map((a) => (
        <path key={a} d={blade(a)} fill={INK} />
      ))}
      <circle r={r * 0.14} fill={INK} />
    </g>
  );
};

/** Handheld Geiger counter with a jittering needle. (x, y) = centre of the box. */
export const Geiger: React.FC<{x: number; y: number; s?: number; t: number; level: number; rot?: number; probe?: boolean}> = ({x, y, s = 1, t, level, rot = 0, probe = true}) => {
  const jitter = wobble(t, 14, 'gg') * 6 * level;
  const ang = -60 + 120 * clamp(level) + jitter;
  const blink = level > 0.05 && Math.sin(t * 40) > 0.3;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={clamp(s * 3)}>
      {probe && <path d="M 90 30 C 160 40 190 90 260 96" stroke="#2B2560" strokeWidth={12} fill="none" strokeLinecap="round" />}
      {probe && <rect x={240} y={78} width={120} height={36} rx={18} fill="#B8B3D6" stroke={INK} strokeWidth={6} />}
      <rect x={-110} y={-90} width={220} height={180} rx={26} fill="#FFD84D" stroke={INK} strokeWidth={7} />
      <rect x={-84} y={-66} width={168} height={92} rx={14} fill="#F6F1DC" stroke={INK} strokeWidth={5} />
      <path d="M -60 4 A 66 66 0 0 1 60 4" stroke={INK} strokeWidth={4} fill="none" />
      <path d="M 20 4 A 66 66 0 0 1 60 4" stroke={C.red} strokeWidth={8} fill="none" />
      <line x1={0} y1={14} x2={Math.sin((ang * Math.PI) / 180) * 62} y2={14 - Math.cos((ang * Math.PI) / 180) * 62} stroke={C.red} strokeWidth={6} strokeLinecap="round" />
      <circle cx={0} cy={14} r={9} fill={INK} />
      <circle cx={-60} cy={56} r={12} fill={blink ? C.red : '#7A2C0C'} stroke={INK} strokeWidth={4} />
      <rect x={-20} y={46} width={84} height={20} rx={8} fill={INK} opacity={0.75} />
      <Trefoil x={86} y={-104} r={26} />
    </g>
  );
};

/** Box truck carrying banana crates. (x, y) = bottom centre. */
export const Truck: React.FC<{x: number; y: number; s?: number; t: number; moving: number}> = ({x, y, s = 1, t, moving}) => {
  const bob = moving > 0.05 ? Math.sin(t * 20) * 2 : 0;
  const wheelRot = t * 600 * moving;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s})`}>
      <ellipse cx={0} cy={4} rx={330} ry={18} fill="#000" opacity={0.25} />
      <rect x={-320} y={-290} width={440} height={240} rx={18} fill="#F4F1E8" stroke={INK} strokeWidth={7} />
      {/* banana crates decal */}
      {[-250, -150, -50, 50].map((cx, i) => (
        <g key={cx} transform={`translate(${cx} -170)`}>
          <rect x={-40} y={-40} width={80} height={80} rx={8} fill="#C98A4A" stroke={INK} strokeWidth={4} />
          <path d={`M -26 ${-8 + i % 2 * 4} C -10 16 14 16 26 -10`} stroke="#FFD84D" strokeWidth={14} strokeLinecap="round" fill="none" />
        </g>
      ))}
      <path d="M 130 -220 L 230 -220 L 300 -140 L 300 -50 L 130 -50 Z" fill={C.cyan} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <path d="M 150 -200 L 220 -200 L 270 -140 L 150 -140 Z" fill="#E9FDFF" stroke={INK} strokeWidth={5} />
      {[-220, 40, 220].map((wx) => (
        <g key={wx} transform={`translate(${wx} -30) rotate(${wheelRot})`}>
          <circle r={42} fill="#2B2560" stroke={INK} strokeWidth={6} />
          <circle r={16} fill="#B8B3D6" />
          <rect x={-4} y={-40} width={8} height={24} fill="#B8B3D6" />
        </g>
      ))}
    </g>
  );
};

/** Radiation-scanner gate: two posts with lights that flash on alarm. (x, y) = bottom centre. */
export const Portal: React.FC<{x: number; y: number; s?: number; t: number; alarm: number; side: 'back' | 'front'}> = ({x, y, s = 1, t, alarm, side}) => {
  const on = alarm > 0.5 && Math.floor(t * 6) % 2 === 0;
  const post = (px: number) => (
    <g transform={`translate(${px} 0)`}>
      <rect x={-34} y={-520} width={68} height={520} rx={14} fill="#DCD8F0" stroke={INK} strokeWidth={6} />
      <rect x={-22} y={-470} width={44} height={300} rx={10} fill="#B8B3D6" />
      <circle cx={0} cy={-560} r={34} fill={on ? C.red : '#7A2C3C'} stroke={INK} strokeWidth={6} />
      {on && <circle cx={0} cy={-560} r={90} fill={C.red} opacity={0.35} />}
    </g>
  );
  return <g transform={`translate(${x} ${y}) scale(${s})`}>{side === 'back' ? post(-300) : post(300)}</g>;
};

/** A potassium atom; k40 ones can "decay" (flash + particle). */
export const Atom: React.FC<{x: number; y: number; r?: number; k40?: boolean; pop?: number; label?: boolean}> = ({x, y, r = 26, k40 = false, pop = 0, label = true}) => (
  <g transform={`translate(${x} ${y})`}>
    {pop > 0.01 && <circle r={r * (1.4 + pop * 2.2)} fill={C.lime} opacity={(1 - pop) * 0.7} />}
    {pop > 0.01 && (
      <line x1={0} y1={0} x2={(60 + pop * 220) * Math.cos(x * 0.01)} y2={(60 + pop * 220) * Math.sin(y * 0.01)} stroke={C.lime} strokeWidth={6} strokeLinecap="round" opacity={1 - pop} />
    )}
    <circle r={r} fill={k40 ? C.lime : '#8C7DFF'} stroke={INK} strokeWidth={4} />
    {label && (
      <text y={r * 0.38} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={r * 1.0} fill={INK}>
        K
      </text>
    )}
  </g>
);

/** Simple human silhouette, (x, y) = feet centre. */
export const Person: React.FC<{x: number; y: number; s?: number; glow?: number}> = ({x, y, s = 1, glow = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {glow > 0.01 && <ellipse cx={0} cy={-330} rx={230} ry={380} fill={C.lime} opacity={glow * 0.15} />}
    <circle cx={0} cy={-610} r={72} fill="#5B52B8" stroke={INK} strokeWidth={7} />
    <path d="M -120 -510 Q 0 -540 120 -510 L 140 -240 Q 0 -220 -140 -240 Z" fill="#5B52B8" stroke={INK} strokeWidth={7} />
    <path d="M -120 -500 L -190 -280 M 120 -500 L 190 -280" stroke="#5B52B8" strokeWidth={56} strokeLinecap="round" />
    <path d="M -70 -240 L -80 0 M 70 -240 L 80 0" stroke="#5B52B8" strokeWidth={64} strokeLinecap="round" />
  </g>
);
