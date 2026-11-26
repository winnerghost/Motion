import React from 'react';
import {clamp, wobble} from '../lib/anim';
import {C, FONT_HEAD} from '../lib/theme';

/*
 * Props for FACT #003 · PART 2 ("what if we didn't have a head?").
 * A friendly crash-test "science dummy" whose head comes off, a microphone,
 * the vocal folds under a magnifier, an oscilloscope and a kazoo.
 * Dummy pieces are drawn in SCREEN coordinates (inside <Svg>).
 */

const SKIN_HI = '#FFE58A';
const SKIN = '#F7C948';
const SKIN_LO = '#D99A1E';
const LINE = '#6B4A0C';
const INK = '#1B1440';

/** Crash-test target marker. */
const Target: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill="#fff" stroke={INK} strokeWidth={r * 0.16} />
    <path d={`M 0 0 L 0 ${-r} A ${r} ${r} 0 0 1 ${r} 0 Z`} fill={INK} />
    <path d={`M 0 0 L 0 ${r} A ${r} ${r} 0 0 1 ${-r} 0 Z`} fill={INK} />
  </g>
);

export const DUMMY_HEAD_OFFSET = -330; // head centre above the neck base, at scale 1

/** The dummy's head on its own. (x, y) = centre of the head. */
export const DummyHead: React.FC<{
  x: number;
  y: number;
  s?: number;
  rot?: number;
  earGlow?: number;
  t: number;
  shocked?: number;
  opacity?: number;
}> = ({x, y, s = 1, rot = 0, earGlow = 0, t, shocked = 0, opacity = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={opacity}>
    <defs>
      <radialGradient id="dh-skin" cx="35%" cy="28%" r="80%">
        <stop offset="0" stopColor={SKIN_HI} />
        <stop offset="0.55" stopColor={SKIN} />
        <stop offset="1" stopColor={SKIN_LO} />
      </radialGradient>
    </defs>
    {/* ears (behind the head) */}
    {[-1, 1].map((side) => (
      <g key={side}>
        {earGlow > 0.01 && <circle cx={side * 150} cy={6} r={70 + 12 * Math.sin(t * 10)} fill={C.pink} opacity={earGlow * 0.35} />}
        <ellipse cx={side * 142} cy={6} rx={28} ry={48} fill={earGlow > 0.01 ? C.pink : SKIN_LO} stroke={LINE} strokeWidth={6} />
        <path d={`M ${side * 140} -18 C ${side * 156} -6 ${side * 156} 18 ${side * 140} 30`} stroke={LINE} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.6} />
      </g>
    ))}
    <ellipse cx={0} cy={0} rx={140} ry={168} fill="url(#dh-skin)" stroke={LINE} strokeWidth={7} />
    {/* seam + target */}
    <path d="M -138 -40 Q 0 -70 138 -40" stroke={LINE} strokeWidth={4} fill="none" opacity={0.35} />
    <Target x={0} y={-104} r={30} />
    {/* face */}
    {[-52, 52].map((ex) => (
      <g key={ex}>
        <ellipse cx={ex} cy={-6} rx={22 + shocked * 8} ry={26 + shocked * 10} fill={INK} />
        <circle cx={ex - 7} cy={-14} r={7} fill="#fff" opacity={0.9} />
      </g>
    ))}
    <path d="M -8 30 Q 0 52 12 40" stroke={LINE} strokeWidth={6} fill="none" strokeLinecap="round" />
    {shocked > 0.3 ? (
      <ellipse cx={0} cy={92} rx={26} ry={30 * shocked} fill={INK} />
    ) : (
      <path d="M -40 88 Q 0 104 40 88" stroke={LINE} strokeWidth={8} fill="none" strokeLinecap="round" />
    )}
    <ellipse cx={-62} cy={-96} rx={34} ry={18} fill="#fff" opacity={0.35} transform="rotate(-30 -62 -96)" />
  </g>
);

/** Dummy torso + neck (and optionally its head). (x, y) = base of the neck. */
export const Dummy: React.FC<{
  x: number;
  y: number;
  s?: number;
  t: number;
  head?: boolean; // draw the attached head
  earGlow?: number;
  xray?: number; // 0..1 see-through neck with the voice box
  buzz?: number; // 0..1 voice box buzzing
  tract?: number; // 0..1 light up throat -> mouth -> nose (needs head)
  tractParts?: [number, number, number]; // throat, mouth, nose reveal 0..1
  rot?: number;
  dim?: number;
}> = ({x, y, s = 1, t, head = true, earGlow = 0, xray = 0, buzz = 0, tract = 0, tractParts = [1, 1, 1], rot = 0, dim = 0}) => {
  const jig = buzz > 0.01 ? Math.sin(t * 90) * 2.2 * buzz : 0;
  return (
    <g transform={`translate(${x + jig} ${y}) rotate(${rot}) scale(${s})`} opacity={1 - dim}>
      <defs>
        <linearGradient id="dm-torso" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={SKIN_LO} />
          <stop offset="0.35" stopColor={SKIN} />
          <stop offset="0.6" stopColor={SKIN_HI} />
          <stop offset="1" stopColor={SKIN_LO} />
        </linearGradient>
        <linearGradient id="dm-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={1} />
          <stop offset="0.45" stopColor="#fff" stopOpacity={1} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id="dm-mask" maskUnits="userSpaceOnUse" x={-320} y={-10} width={640} height={640}>
          <rect x={-320} y={-10} width={640} height={640} fill="url(#dm-fade)" />
        </mask>
        <linearGradient id="dm-neck" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={SKIN_LO} />
          <stop offset="0.5" stopColor={SKIN_HI} />
          <stop offset="1" stopColor={SKIN_LO} />
        </linearGradient>
      </defs>
      {/* torso (fades out towards the bottom, like a bust) */}
      <g mask="url(#dm-mask)">
      <path d="M -300 620 L -300 150 C -300 62 -236 22 -150 10 L -60 0 L 60 0 L 150 10 C 236 22 300 62 300 150 L 300 620 Z" fill="url(#dm-torso)" stroke={LINE} strokeWidth={7} />
      <path d="M -300 250 Q 0 290 300 250" stroke={LINE} strokeWidth={4} fill="none" opacity={0.3} />
      <Target x={-150} y={140} r={30} />
      {[-232, 232].map((bx) => (
        <circle key={bx} cx={bx} cy={74} r={12} fill={SKIN_LO} stroke={LINE} strokeWidth={4} />
      ))}
      </g>
      {/* neck */}
      <path d="M -56 6 L -52 -178 L 52 -178 L 56 6 Z" fill="url(#dm-neck)" stroke={LINE} strokeWidth={7} strokeLinejoin="round" />
      <path d="M -54 -60 L 54 -60 M -54 -120 L 54 -120" stroke={LINE} strokeWidth={4} opacity={0.35} />
      {/* see-through neck: windpipe + voice box */}
      {xray > 0.01 && (
        <g opacity={xray}>
          <path d="M -46 2 L -44 -172 L 44 -172 L 46 2 Z" fill="#241A5E" opacity={0.85} />
          {Array.from({length: 6}, (_, i) => (
            <rect key={i} x={-20} y={-10 - i * 14} width={40} height={7} rx={3} fill="#8C7DFF" opacity={0.7} />
          ))}
          <path d="M -30 -150 L -24 -104 L 0 -92 L 24 -104 L 30 -150 Z" fill={C.pink} stroke="#fff" strokeWidth={3} />
          <path d="M -14 -138 L 0 -104 L 14 -138" stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" />
          {buzz > 0.01 && (
            <g>
              <circle cx={0} cy={-122} r={46 + 6 * Math.sin(t * 60)} fill={C.pink} opacity={0.35 * buzz} />
              {Array.from({length: 3}, (_, i) => {
                const p = ((t * 2.2 + i / 3) % 1 + 1) % 1;
                return <circle key={i} cx={0} cy={-122} r={30 + p * 140} fill="none" stroke={C.pink} strokeWidth={7 * (1 - p)} opacity={(1 - p) * buzz} />;
              })}
            </g>
          )}
        </g>
      )}
      {!head && (
        <g>
          <ellipse cx={0} cy={-178} rx={52} ry={15} fill="#E0A72C" stroke={LINE} strokeWidth={6} />
          <ellipse cx={0} cy={-180} rx={30} ry={7} fill={LINE} opacity={0.25} />
        </g>
      )}
      {head && <DummyHead x={0} y={DUMMY_HEAD_OFFSET} t={t} earGlow={earGlow} />}
      {/* the vocal tract: throat -> mouth, and up to the nose */}
      {head && tract > 0.01 && (
        <g opacity={tract}>
          <path
            d={`M 0 -100 L 0 ${-100 - 130 * tractParts[0]}`}
            stroke={C.cyan}
            strokeWidth={34}
            strokeLinecap="round"
            opacity={0.85}
          />
          {tractParts[1] > 0.01 && <ellipse cx={0} cy={-244} rx={62 * tractParts[1]} ry={26 * tractParts[1]} fill={C.cyan} opacity={0.85} />}
          {tractParts[2] > 0.01 && (
            <path d={`M 0 -236 L 0 ${-236 - 60 * tractParts[2]}`} stroke={C.lime} strokeWidth={26} strokeLinecap="round" opacity={0.9} />
          )}
          <circle cx={0} cy={-122} r={18} fill={C.pink} stroke="#fff" strokeWidth={4} />
        </g>
      )}
    </g>
  );
};

/** Stage microphone standing on its base. (x, y) = bottom of the mic. */
export const Mic: React.FC<{x: number; y: number; s?: number; rot?: number; t: number; live?: number}> = ({x, y, s = 1, rot = 0, t, live = 0}) => {
  const j = live > 0.01 ? Math.sin(t * 95) * 3 * live : 0;
  return (
    <g transform={`translate(${x + j} ${y}) rotate(${rot}) scale(${s})`} opacity={clamp(s * 3)}>
      <defs>
        <radialGradient id="mic-grille" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#F4F2FF" />
          <stop offset="0.5" stopColor="#A9A3D8" />
          <stop offset="1" stopColor="#4B4485" />
        </radialGradient>
      </defs>
      <rect x={-16} y={-120} width={32} height={120} rx={10} fill="#2B2560" stroke="#120C33" strokeWidth={5} />
      <rect x={-34} y={-142} width={68} height={30} rx={10} fill="#3A3380" stroke="#120C33" strokeWidth={5} />
      <ellipse cx={0} cy={-204} rx={56} ry={70} fill="url(#mic-grille)" stroke="#120C33" strokeWidth={6} />
      {[-40, -20, 0, 20, 40].map((g) => (
        <line key={`v${g}`} x1={g} y1={-262} x2={g} y2={-146} stroke="#120C33" strokeWidth={2.5} opacity={0.35} />
      ))}
      {[-246, -222, -198, -174].map((g) => (
        <line key={`h${g}`} x1={-54} y1={g} x2={54} y2={g} stroke="#120C33" strokeWidth={2.5} opacity={0.35} />
      ))}
      <circle cx={0} cy={-90} r={7} fill={live > 0.1 ? C.red : '#5B52B8'} opacity={live > 0.1 ? 0.6 + 0.4 * Math.sin(t * 14) : 1} />
    </g>
  );
};

/** Magnifier bubble with a top-down view of the vocal folds. Screen coords (HTML). */
export const FoldsBubble: React.FC<{x: number; y: number; r?: number; s: number; t: number; speed?: number; label?: string}> = ({
  x,
  y,
  r = 220,
  s,
  t,
  speed = 0,
  label = 'VOCAL FOLDS',
}) => {
  const ghosts = speed > 0.3 ? 4 : 1;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${s})`, opacity: clamp(s * 2)}}>
      <svg width={r * 2 + 40} height={r * 2 + 40} viewBox={`${-r - 20} ${-r - 20} ${r * 2 + 40} ${r * 2 + 40}`} style={{overflow: 'visible', display: 'block'}}>
        <defs>
          <radialGradient id="fb-tissue" cx="50%" cy="45%" r="60%">
            <stop offset="0" stopColor="#FF9CB9" />
            <stop offset="0.7" stopColor="#E85C86" />
            <stop offset="1" stopColor="#A82A58" />
          </radialGradient>
          <clipPath id="fb-clip">
            <circle r={r} />
          </clipPath>
        </defs>
        <circle r={r + 14} fill="none" stroke="#fff" strokeWidth={14} />
        <g clipPath="url(#fb-clip)">
          <circle r={r} fill="url(#fb-tissue)" />
          {Array.from({length: ghosts}, (_, g) => {
            const ph = t * Math.PI * 2 * (3 + speed * 9) + g * 0.9;
            const open = 0.5 + 0.5 * Math.sin(ph);
            const gap = 8 + open * 52;
            const op = g === 0 ? 1 : 0.28;
            return (
              <g key={g} opacity={op}>
                <path d={`M 0 ${-r * 0.62} L ${-gap} ${r * 0.62} L ${gap} ${r * 0.62} Z`} fill="#2A0E2E" />
                <path d={`M -6 ${-r * 0.66} C ${-gap - 40} ${-r * 0.1} ${-gap - 46} ${r * 0.4} ${-gap - 6} ${r * 0.66} L ${-gap} ${r * 0.62} L 0 ${-r * 0.62} Z`} fill="#FFF1F6" stroke="#FFD0E0" strokeWidth={4} />
                <path d={`M 6 ${-r * 0.66} C ${gap + 40} ${-r * 0.1} ${gap + 46} ${r * 0.4} ${gap + 6} ${r * 0.66} L ${gap} ${r * 0.62} L 0 ${-r * 0.62} Z`} fill="#FFF1F6" stroke="#FFD0E0" strokeWidth={4} />
              </g>
            );
          })}
          <ellipse cx={-r * 0.45} cy={-r * 0.55} rx={r * 0.35} ry={r * 0.16} fill="#fff" opacity={0.18} transform={`rotate(-30 ${-r * 0.45} ${-r * 0.55})`} />
        </g>
      </svg>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: -36,
          transform: 'translateX(-50%)',
          fontFamily: FONT_HEAD,
          fontWeight: 800,
          fontSize: 34,
          letterSpacing: 3,
          color: C.ink,
          background: C.pink,
          padding: '8px 22px',
          borderRadius: 999,
          whiteSpace: 'nowrap',
          boxShadow: '0 10px 40px rgba(255,79,139,0.5)',
        }}
      >
        {label}
      </div>
    </div>
  );
};

/** Oscilloscope card. buzz / voice: 0..1 amounts of each waveform. Screen coords (HTML). */
export const Scope: React.FC<{x: number; y: number; s: number; t: number; buzz: number; voice: number; title: string; color?: string}> = ({
  x,
  y,
  s,
  t,
  buzz,
  voice,
  title,
  color = C.cyan,
}) => {
  const w = 760;
  const h = 200;
  const pts: string[] = [];
  for (let i = 0; i <= 190; i++) {
    const u = i / 190;
    const ph = u * 7 - t * 3;
    const p = ((ph % 1) + 1) % 1;
    const pulse = p < 0.07 ? -1 + p / 0.07 * 0.2 : p < 0.5 ? -0.8 + ((p - 0.07) / 0.43) * 1.6 : 0.8 - ((p - 0.5) / 0.5) * 0.8;
    const sharp = (p < 0.06 ? 1 : 0) * 0.9;
    const bz = pulse * 0.75 + sharp;
    const decay = Math.exp(-p * 3.2);
    const vc = (Math.sin(p * Math.PI * 2) * 0.55 + Math.sin(p * Math.PI * 2 * 4 + 1) * 0.45 * decay + Math.sin(p * Math.PI * 2 * 9 + 2) * 0.22 * decay) * 0.9;
    const yv = (bz * buzz + vc * voice + wobble(t + u, 30, 'scn') * 0.03) * (h * 0.4);
    pts.push(`${(u * w).toFixed(1)},${(h / 2 - yv).toFixed(1)}`);
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w + 60,
        transform: `translate(-50%, -50%) scale(${s})`,
        opacity: clamp(s * 2),
        background: 'rgba(12,8,40,0.72)',
        border: '3px solid rgba(255,255,255,0.18)',
        borderRadius: 36,
        padding: '18px 30px 22px',
        boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 40px ${color}33`,
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6}}>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 28, letterSpacing: 4, color}}>{title}</div>
        <div style={{width: 18, height: 18, borderRadius: 99, background: C.red, opacity: 0.6 + 0.4 * Math.sin(t * 9)}} />
      </div>
      <svg width={w} height={h} style={{display: 'block', overflow: 'visible'}}>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={0} y1={h * g} x2={w} y2={h * g} stroke="rgba(255,255,255,0.08)" strokeWidth={2} />
        ))}
        <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={14} strokeOpacity={0.2} strokeLinejoin="round" />
        <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={5} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/** A kazoo. (x, y) = centre. Screen or local coords. */
export const Kazoo: React.FC<{x: number; y: number; s?: number; rot?: number; t: number; buzz?: number}> = ({x, y, s = 1, rot = 0, t, buzz = 0}) => {
  const j = buzz > 0.01 ? Math.sin(t * 80) * 2.5 * buzz : 0;
  return (
    <g transform={`translate(${x} ${y + j}) rotate(${rot}) scale(${s})`} opacity={clamp(s * 3)}>
      <path d="M -150 -34 L 120 -22 Q 150 -20 150 0 Q 150 20 120 22 L -150 34 Q -170 34 -170 0 Q -170 -34 -150 -34 Z" fill="#FF5A4E" stroke="#120C33" strokeWidth={7} />
      <path d="M -150 -20 L 110 -10" stroke="#fff" strokeWidth={7} opacity={0.35} strokeLinecap="round" />
      <path d="M -10 -28 L -6 -70 Q 22 -80 50 -70 L 54 -26 Z" fill="#FFD84D" stroke="#120C33" strokeWidth={7} strokeLinejoin="round" />
      <ellipse cx={22} cy={-72} rx={28} ry={9} fill="#FFF3B0" stroke="#120C33" strokeWidth={5} />
      {buzz > 0.01 &&
        Array.from({length: 3}, (_, i) => {
          const p = ((t * 2.6 + i / 3) % 1 + 1) % 1;
          return <path key={i} d={`M ${170 + p * 90} ${-30 - p * 20} q 12 30 0 60`} stroke={C.yellow} strokeWidth={8 * (1 - p)} fill="none" opacity={(1 - p) * buzz} strokeLinecap="round" />;
        })}
    </g>
  );
};

/** "Muted" speaker icon. (x, y) = centre. */
export const MuteIcon: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={clamp(s * 2)}>
    <circle r={110} fill="rgba(12,8,40,0.8)" stroke="#fff" strokeWidth={8} />
    <path d="M -58 -24 L -24 -24 L 14 -58 L 14 58 L -24 24 L -58 24 Z" fill="#fff" />
    <path d="M 34 -30 L 74 30 M 74 -30 L 34 30" stroke={C.red} strokeWidth={14} strokeLinecap="round" />
  </g>
);
