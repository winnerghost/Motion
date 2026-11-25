import React from 'react';
import {wobble} from '../lib/anim';
import {C, FONT_HEAD} from '../lib/theme';

/* ------------------------------------------------------------------ */
/* Wombat — a chunky, loaf-shaped guest star. (x, y) = ground, centre. */
/* ------------------------------------------------------------------ */
export const Wombat: React.FC<{
  x: number;
  y: number;
  scale?: number;
  t: number;
  id?: string;
  lid?: number;
  lookX?: number;
  smug?: number; // 0..1 smile
  squash?: number;
  tilt?: number;
  flip?: boolean;
  opacity?: number;
}> = ({x, y, scale = 1, t, id = 'wb', lid = 0, lookX = 0, smug = 0.4, squash = 1, tilt = 0, flip = false, opacity = 1}) => {
  const breathe = 1 + Math.sin(t * 2.2) * 0.012;
  const sy = squash * breathe;
  const sx = 1 / Math.sqrt(squash);
  const blink = (() => {
    for (let k = 0; k < 30; k++) {
      const bt = 1.3 + k * 3.7 + wobble(k, 1, `${id}b`) * 0.8;
      if (Math.abs(t - bt) < 0.07) return 1 - Math.abs(t - bt) / 0.07;
    }
    return 0;
  })();
  const l = Math.max(lid, blink);
  const eye = (ex: number) => (
    <g transform={`translate(${ex} -282)`}>
      <ellipse rx={17} ry={20 * (1 - l * 0.9)} fill="#1A1210" />
      {l < 0.6 && <circle cx={-5 + lookX * 4} cy={-7} r={5.5} fill="#fff" />}
    </g>
  );
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) scale(${scale * (flip ? -1 : 1)} ${scale}) rotate(${tilt})`}>
      <defs>
        <radialGradient id={`${id}-fur`} cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#C49A6C" />
          <stop offset="0.55" stopColor="#9C734B" />
          <stop offset="1" stopColor="#6E4D30" />
        </radialGradient>
        <radialGradient id={`${id}-muzzle`} cx="50%" cy="40%" r="70%">
          <stop offset="0" stopColor="#E2C29C" />
          <stop offset="1" stopColor="#C09A70" />
        </radialGradient>
        <filter id={`${id}-sh`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>
      <ellipse cx={0} cy={4} rx={250} ry={26} fill="#05030F" opacity={0.45} filter={`url(#${id}-sh)`} />
      <g transform={`scale(${sx} ${sy})`}>
        {/* body */}
        <path d="M -235 -20 C -250 -150 -200 -235 -110 -250 L 110 -250 C 200 -235 250 -150 235 -20 C 230 0 200 8 170 8 L -170 8 C -200 8 -230 0 -235 -20 Z" fill={`url(#${id}-fur)`} />
        {/* ears */}
        {[-1, 1].map((s) => (
          <g key={s} transform={`translate(${s * 122} -362) rotate(${s * 28 + wobble(t, 0.6, `${id}e${s}`) * 5})`}>
            <path d="M -26 22 C -30 -10 -14 -40 0 -44 C 14 -40 30 -10 26 22 Z" fill="#8A6340" />
            <path d="M -13 14 C -15 -6 -7 -26 0 -28 C 7 -26 15 -6 13 14 Z" fill="#D9A3A0" />
          </g>
        ))}
        {/* head */}
        <ellipse cx={0} cy={-280} rx={160} ry={118} fill={`url(#${id}-fur)`} />
        <ellipse cx={-60} cy={-340} rx={60} ry={24} fill="#fff" opacity={0.18} transform="rotate(-18 -60 -340)" />
        {/* muzzle + big nose */}
        <ellipse cx={0} cy={-218} rx={96} ry={62} fill={`url(#${id}-muzzle)`} />
        <path d="M -70 -252 C -70 -280 70 -280 70 -252 C 70 -220 40 -204 0 -204 C -40 -204 -70 -220 -70 -252 Z" fill="#2B1E1A" />
        <ellipse cx={-18} cy={-256} rx={14} ry={7} fill="#fff" opacity={0.35} />
        <path
          d={`M -26 -186 Q -13 ${-178 + smug * 8} 0 -188 Q 13 ${-178 + smug * 8} 26 -186`}
          stroke="#3A2618"
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
        />
        {eye(-62)}
        {eye(62)}
        {lid > 0.05 && (
          <>
            <path d="M -84 -292 L -40 -288" stroke="#3A2618" strokeWidth={6} strokeLinecap="round" />
            <path d="M 40 -288 L 84 -292" stroke="#3A2618" strokeWidth={6} strokeLinecap="round" />
          </>
        )}
        <ellipse cx={-118} cy={-236} rx={22} ry={12} fill="#FF4F8B" opacity={0.25} />
        <ellipse cx={118} cy={-236} rx={22} ry={12} fill="#FF4F8B" opacity={0.25} />
        {/* front paws */}
        {[-1, 1].map((s) => (
          <g key={s} transform={`translate(${s * 96} -6)`}>
            <ellipse rx={58} ry={28} fill="#5E412A" />
            {[-24, 0, 24].map((cx) => (
              <path key={cx} d={`M ${cx} 10 l 0 14`} stroke="#F3E6D4" strokeWidth={6} strokeLinecap="round" />
            ))}
          </g>
        ))}
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Poop shapes                                                        */
/* ------------------------------------------------------------------ */

/** Isometric rounded cube. (x, y) = bottom-centre on the ground. */
export const PoopCube: React.FC<{x: number; y: number; size?: number; rot?: number; opacity?: number; sparkle?: number; t?: number}> = ({
  x,
  y,
  size = 80,
  rot = 0,
  opacity = 1,
  sparkle = 0,
  t = 0,
}) => {
  const s = size / 2;
  const h = s * 0.58; // half-height of the top rhombus
  const v = s * 1.15; // vertical edge length (isometric)
  const top = `M 0 ${-v - h} L ${s} ${-v} L 0 ${-v + h} L ${-s} ${-v} Z`;
  const left = `M ${-s} ${-v} L 0 ${-v + h} L 0 ${h} L ${-s} 0 Z`;
  const right = `M ${s} ${-v} L 0 ${-v + h} L 0 ${h} L ${s} 0 Z`;
  const r = Math.max(4, s * 0.16);
  return (
    <g transform={`translate(${x} ${y - h}) rotate(${rot})`} opacity={opacity}>
      <path d={left} fill="#5A3A22" stroke="#5A3A22" strokeWidth={r} strokeLinejoin="round" />
      <path d={right} fill="#43291A" stroke="#43291A" strokeWidth={r} strokeLinejoin="round" />
      <path d={top} fill="#7D5434" stroke="#7D5434" strokeWidth={r} strokeLinejoin="round" />
      <ellipse cx={-s * 0.15} cy={-v} rx={s * 0.35} ry={s * 0.12} fill="#fff" opacity={0.18} />
      {sparkle > 0 &&
        [0, 1, 2].map((i) => {
          const a = t * 3 + i * 2.1;
          const px = Math.cos(a) * s * 1.6;
          const py = -s + Math.sin(a) * s * 1.2;
          const k = (0.5 + 0.5 * Math.sin(t * 9 + i * 2)) * sparkle;
          return <path key={i} d={`M ${px} ${py - 14 * k} L ${px + 4 * k} ${py} L ${px} ${py + 14 * k} L ${px - 4 * k} ${py} Z`} fill={C.yellow} opacity={k} />;
        })}
    </g>
  );
};

export const PoopBall: React.FC<{x: number; y: number; r?: number; rot?: number; opacity?: number}> = ({x, y, r = 40, rot = 0, opacity = 1}) => (
  <g transform={`translate(${x} ${y - r}) rotate(${rot})`} opacity={opacity}>
    <circle r={r} fill="#6B4426" />
    <ellipse cx={-r * 0.3} cy={-r * 0.35} rx={r * 0.35} ry={r * 0.18} fill="#fff" opacity={0.2} />
    <path d={`M ${-r * 0.5} 0 Q 0 ${r * 0.25} ${r * 0.5} 0`} stroke="#4A2E1A" strokeWidth={r * 0.08} fill="none" />
  </g>
);

export const PoopBlob: React.FC<{x: number; y: number; size?: number; t: number}> = ({x, y, size = 90, t}) => {
  const k = size / 90;
  const w = (i: number) => wobble(t, 1.5, `blob${i}`) * 6;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <path
        d={`M -48 0 C -60 ${-30 + w(1)} -30 ${-50 + w(2)} -10 ${-46 + w(3)} C 4 ${-74 + w(4)} 40 ${-60 + w(5)} 36 ${-34 + w(6)} C 62 ${-30 + w(7)} 58 0 40 0 Z`}
        fill="#6B4426"
      />
      <ellipse cx={-6} cy={-40} rx={14} ry={6} fill="#fff" opacity={0.2} />
    </g>
  );
};

/** Big red X or green check badge. */
export const Mark: React.FC<{x: number; y: number; ok: boolean; s: number}> = ({x, y, ok, s}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, s * 2)}>
    <circle r={38} fill={ok ? C.lime : C.red} />
    {ok ? (
      <path d="M -17 1 L -5 14 L 18 -12" stroke={C.ink} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ) : (
      <path d="M -14 -14 L 14 14 M 14 -14 L -14 14" stroke="#fff" strokeWidth={10} strokeLinecap="round" />
    )}
  </g>
);

/** A rock to perch territory markers on. (x, y) = ground centre. */
export const Rock: React.FC<{x: number; y: number; scale?: number}> = ({x, y, scale = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <defs>
      <radialGradient id="rockg" cx="35%" cy="25%" r="85%">
        <stop offset="0" stopColor="#B9B3D6" />
        <stop offset="0.6" stopColor="#7C76A3" />
        <stop offset="1" stopColor="#4A4570" />
      </radialGradient>
    </defs>
    <ellipse cx={0} cy={4} rx={260} ry={24} fill="#05030F" opacity={0.4} />
    <path d="M -250 0 C -260 -80 -190 -170 -80 -180 C 20 -196 150 -170 210 -110 C 250 -70 262 -30 250 0 Z" fill="url(#rockg)" />
    <path d="M -150 -120 q 40 -30 90 -20" stroke="#fff" strokeOpacity={0.25} strokeWidth={10} strokeLinecap="round" fill="none" />
  </g>
);

/** Gold trophy. */
export const Trophy: React.FC<{x: number; y: number; scale?: number; t: number}> = ({x, y, scale = 1, t}) => (
  <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${wobble(t, 1, 'tr') * 3})`}>
    <defs>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFF1A8" />
        <stop offset="0.45" stopColor="#FFD84D" />
        <stop offset="1" stopColor="#C9901A" />
      </linearGradient>
    </defs>
    <radialGradient id="trophyglow">
      <stop offset="0" stopColor={C.yellow} stopOpacity={0.45} />
      <stop offset="1" stopColor={C.yellow} stopOpacity={0} />
    </radialGradient>
    <circle cx={0} cy={-150} r={220} fill="url(#trophyglow)" />
    <path d="M -95 -250 L 95 -250 C 95 -150 60 -100 0 -95 C -60 -100 -95 -150 -95 -250 Z" fill="url(#gold)" />
    <path d="M -95 -230 C -150 -230 -150 -150 -80 -140" stroke="url(#gold)" strokeWidth={16} fill="none" />
    <path d="M 95 -230 C 150 -230 150 -150 80 -140" stroke="url(#gold)" strokeWidth={16} fill="none" />
    <rect x={-16} y={-98} width={32} height={50} fill="url(#gold)" />
    <rect x={-70} y={-50} width={140} height={50} rx={10} fill="#3B3480" stroke="url(#gold)" strokeWidth={6} />
    <ellipse cx={-40} cy={-215} rx={18} ry={30} fill="#fff" opacity={0.45} />
    <text x={0} y={-17} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={26} fill={C.yellow}>
      2019
    </text>
  </g>
);

/* ------------------------------------------------------------------ */
/* Intestine diagrams                                                  */
/* ------------------------------------------------------------------ */

/** Side view of a gut section with an optional party balloon inside. */
export const GutTube: React.FC<{
  x: number;
  y: number;
  w?: number;
  t: number;
  balloonIn?: number; // 0..1 slides in
  inflate?: number; // 0..1
  poopU?: number; // -1 = none, 0..1 position of a poop travelling through
  bandsShown?: number; // 0..1 shows stiff/stretchy bands without inflating
}> = ({x, y, w = 860, t, balloonIn = 0, inflate = 0, poopU = -1, bandsShown = 0}) => {
  const h = 150;
  const bands = 7;
  const bulge = (i: number) => (i % 2 === 0 ? 1 : 0.3) * inflate * 38;
  // smooth outline: each band bulges by its own stretchiness
  const bw = w / bands;
  let d = `M ${-w / 2} ${-h / 2}`;
  for (let i = 0; i < bands; i++) {
    const x0 = -w / 2 + i * bw;
    d += ` Q ${x0 + bw / 2} ${-h / 2 - bulge(i) * 2} ${x0 + bw} ${-h / 2}`;
  }
  d += ` L ${w / 2} ${h / 2}`;
  for (let i = bands - 1; i >= 0; i--) {
    const x0 = -w / 2 + i * bw;
    d += ` Q ${x0 + bw / 2} ${h / 2 + bulge(i) * 2} ${x0} ${h / 2}`;
  }
  d += ' Z';
  const bl = w * 0.9;
  const bx = -w / 2 - bl + balloonIn * (bl + w * 0.05);
  const pu = poopU;
  const px = -w / 2 + pu * w;
  const sq = Math.min(1, Math.max(0, (pu - 0.45) / 0.45));
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <linearGradient id="gut" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFB3CF" />
          <stop offset="0.5" stopColor="#F27FA8" />
          <stop offset="1" stopColor="#C94F80" />
        </linearGradient>
        <clipPath id="gutclip">
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill="url(#gut)" stroke="#9E2F5E" strokeWidth={6} strokeLinejoin="round" opacity={0.95} />
      <g clipPath="url(#gutclip)">
        {Array.from({length: bands}, (_, i) => (
          <rect key={i} x={-w / 2 + (i / bands) * w} y={-h} width={w / bands} height={h * 2} fill={i % 2 === 0 ? '#ffffff' : '#7A1F48'} opacity={(i % 2 === 0 ? 0.22 : 0.42) * Math.min(1, inflate * 2 + bandsShown)} />
        ))}
        {balloonIn > 0 && (
          <rect x={bx} y={-(20 + inflate * 44)} width={bl} height={40 + inflate * 88} rx={20 + inflate * 44} fill={C.cyan} opacity={0.9} />
        )}
        {pu >= 0 && (
          <g transform={`translate(${px} 0)`}>
            <rect x={-48} y={-48} width={96} height={96} rx={48 * (1 - sq) + 10 * sq} fill="#6B4426" />
          </g>
        )}
        <rect x={-w / 2} y={-h / 2 - 40} width={w} height={30} fill="#fff" opacity={0.18} />
      </g>
      {balloonIn > 0 && balloonIn < 1 && <path d={`M ${bx} 0 l -40 -10 l 0 20 z`} fill={C.cyan} />}
    </g>
  );
};

/**
 * Cross-section of the gut: a ring of alternating stiff (dark) and stretchy
 * (light) bands. `square` 0..1 morphs the opening from a circle into a rounded
 * square: stiff bands become the corners, stretchy bands the flat sides.
 */
export const GutRing: React.FC<{x: number; y: number; r?: number; square: number; poop?: number; t: number; labels?: number}> = ({
  x,
  y,
  r = 230,
  square,
  poop = 0,
  t,
  labels = 0,
}) => {
  const n = 2 + square * 8; // superellipse exponent
  const pt = (ang: number, rad: number): [number, number] => {
    // superellipse: corners at 45°, 135°, ... where the stiff bands are
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const k = Math.pow(Math.pow(Math.abs(c), n) + Math.pow(Math.abs(s), n), -1 / n);
    const rr = rad * (1 + (k - 1) * 0.92);
    return [Math.cos(ang) * rr, Math.sin(ang) * rr];
  };
  const arc = (a0: number, a1: number, rad: number) => {
    const N = 24;
    return Array.from({length: N + 1}, (_, i) => {
      const [px, py] = pt(a0 + ((a1 - a0) * i) / N, rad);
      return `${i ? 'L' : 'M'} ${px.toFixed(1)} ${py.toFixed(1)}`;
    }).join(' ');
  };
  const inner = Array.from({length: 97}, (_, i) => {
    const [px, py] = pt((i / 96) * Math.PI * 2, r * 0.78);
    return `${i ? 'L' : 'M'} ${px.toFixed(1)} ${py.toFixed(1)}`;
  }).join(' ') + ' Z';
  const segs = Array.from({length: 8}, (_, i) => {
    const mid = (i * Math.PI) / 4; // even = stretchy (sides), odd = stiff (corners)
    const stiff = i % 2 === 1;
    return {d: arc(mid - Math.PI / 8, mid + Math.PI / 8, r), stiff};
  });
  const pulse = 0.5 + 0.5 * Math.sin(t * 6);
  return (
    <g transform={`translate(${x} ${y})`}>
      {segs.map((sg, i) => (
        <path
          key={i}
          d={sg.d}
          stroke={sg.stiff ? '#A6245A' : '#FFB3CF'}
          strokeWidth={sg.stiff ? 64 : 40}
          strokeLinecap="butt"
          fill="none"
        />
      ))}
      {segs.map((sg, i) =>
        sg.stiff ? <path key={`g${i}`} d={sg.d} stroke={C.yellow} strokeWidth={8} strokeOpacity={labels * (0.4 + 0.5 * pulse)} fill="none" strokeLinecap="round" /> : null,
      )}
      {poop > 0 && <path d={inner} fill="#6B4426" opacity={poop} transform={`scale(${0.9})`} />}
    </g>
  );
};
