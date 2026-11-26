import React from 'react';
import {clamp, ease, prog, springAt, wobble} from '../lib/anim';
import {C, FONT_DISPLAY, FONT_HEAD} from '../lib/theme';

/* ------------------------------------------------------------------ */
/* SVG props (render inside a full-frame <svg>)                        */
/* ------------------------------------------------------------------ */

/** Semicircle "LAUGH-O-METER" gauge. value 0..1 */
export const LaughMeter: React.FC<{x: number; y: number; scale?: number; value: number; t: number; opacity?: number}> = ({
  x,
  y,
  scale = 1,
  value,
  t,
  opacity = 1,
}) => {
  const R = 230;
  const segs = 18;
  const ang = (v: number) => Math.PI + v * Math.PI; // 180° -> 360°
  const needle = ang(clamp(value, 0, 1));
  const pct = Math.floor(clamp(value) * 100);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <defs>
        <filter id="lm-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <rect x={-290} y={-300} width={580} height={380} rx={48} fill="#1C1550" stroke="rgba(255,255,255,0.16)" strokeWidth={3} />
      {Array.from({length: segs}, (_, i) => {
        const a0 = ang(i / segs) + 0.025;
        const a1 = ang((i + 1) / segs) - 0.025;
        const lit = (i + 0.5) / segs <= value;
        const col = i < 6 ? '#8C7DFF' : i < 12 ? C.yellow : C.pink;
        const r0 = R - 46;
        const p = (r: number, a: number) => `${Math.cos(a) * r} ${Math.sin(a) * r}`;
        return (
          <path
            key={i}
            d={`M ${p(r0, a0)} L ${p(R, a0)} A ${R} ${R} 0 0 1 ${p(R, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 0 0 ${p(r0, a0)} Z`}
            fill={col}
            opacity={lit ? 1 : 0.16}
          />
        );
      })}
      <g transform={`rotate(${(needle * 180) / Math.PI})`}>
        <path d="M 0 -13 L 200 -3 L 200 3 L 0 13 Z" fill="#fff" />
      </g>
      <circle r={26} fill="#fff" />
      <circle r={12} fill={C.pink} />
      <text x={0} y={-84} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={72} fill="#fff">
        {pct}%
      </text>
      <text x={0} y={52} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={30} letterSpacing={5} fill="rgba(255,255,255,0.7)">
        LAUGH-O-METER
      </text>
    </g>
  );
};

/** A fluffy feather. Tip at (0,0), pointing along +x. */
export const Feather: React.FC<{x: number; y: number; rot?: number; scale?: number; t: number}> = ({x, y, rot = 0, scale = 1, t}) => {
  const flutter = wobble(t, 3, 'feather') * 6;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
      <path
        d={`M 0 0 C 40 ${-40 + flutter} 140 ${-60 + flutter} 210 -18 C 150 -6 80 4 0 0 Z`}
        fill="#FFE3F0"
      />
      <path d={`M 0 0 C 50 ${30 - flutter} 150 ${36 - flutter} 210 -18 C 150 -6 80 4 0 0 Z`} fill="#FFB3D1" />
      {[40, 80, 120, 160].map((s, i) => (
        <path key={i} d={`M ${s} ${-2 - s * 0.05} l 16 ${-22 + i * 2}`} stroke="#fff" strokeWidth={3} opacity={0.6} />
      ))}
      <path d="M 0 0 C 80 2 150 -8 240 -20" stroke="#E86A9E" strokeWidth={5} fill="none" strokeLinecap="round" />
    </g>
  );
};

/** Two-segment robot arm solved with simple IK, holding a feather at the target. */
export const RobotArm: React.FC<{
  bx: number;
  by: number;
  tx: number;
  ty: number;
  t: number;
  l1?: number;
  l2?: number;
  opacity?: number;
  led?: string;
}> = ({bx, by, tx, ty, t, l1 = 400, l2 = 340, opacity = 1, led = C.cyan}) => {
  // The gripper holds the feather's quill; the feather's tip touches (tx, ty).
  const ul = Math.hypot(tx - bx, ty - by) || 1;
  const gx = tx - ((tx - bx) / ul) * 185;
  const gy = ty - ((ty - by) / ul) * 185;
  const dx = gx - bx;
  const dy = gy - by;
  const d = clamp(Math.hypot(dx, dy), 20, l1 + l2 - 1);
  const a = Math.atan2(dy, dx);
  const cosB = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const b = Math.acos(clamp(cosB, -1, 1));
  const a1 = a + b; // elbow up (arm comes from the lower right)
  const ex = bx + Math.cos(a1) * l1;
  const ey = by + Math.sin(a1) * l1;
  const a2 = Math.atan2(gy - ey, gx - ex);
  const wrist = (Math.atan2(ty - gy, tx - gx) * 180) / Math.PI;
  const seg = (x0: number, y0: number, ang: number, len: number, w: number) => (
    <g transform={`translate(${x0} ${y0}) rotate(${(ang * 180) / Math.PI})`}>
      <rect x={-w / 2} y={-w / 2} width={len + w} height={w} rx={w / 2} fill="url(#robo-metal)" stroke="#9AA3C7" strokeWidth={3} />
      <rect x={w * 0.2} y={-w * 0.18} width={len - w * 0.4} height={w * 0.16} rx={w * 0.08} fill="#fff" opacity={0.55} />
    </g>
  );
  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id="robo-metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor="#D8DDF0" />
          <stop offset="1" stopColor="#A9B0D3" />
        </linearGradient>
        <filter id="robo-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {/* base */}
      <rect x={bx - 110} y={by - 10} width={220} height={120} rx={30} fill="#2F2869" stroke="#4B43A0" strokeWidth={4} />
      {seg(bx, by, a1, l1, 84)}
      {seg(ex, ey, a2, l2 - 30, 64)}
      {/* joints */}
      {[
        [bx, by, 62],
        [ex, ey, 50],
      ].map(([jx, jy, r], i) => (
        <g key={i}>
          <circle cx={jx} cy={jy} r={r} fill="#3B3480" stroke="#E6E9F8" strokeWidth={6} />
          <circle cx={jx} cy={jy} r={r * 0.45} fill={led} filter="url(#robo-glow)" opacity={0.9} />
          <circle cx={jx} cy={jy} r={r * 0.3} fill="#E9FDFF" />
        </g>
      ))}
      {/* wrist turns the feather toward the touch point */}
      <Feather x={gx} y={gy} rot={wrist} scale={0.9} t={t} />
      <circle cx={gx} cy={gy} r={30} fill="#3B3480" stroke="#E6E9F8" strokeWidth={5} />
      <g transform={`translate(${gx} ${gy}) rotate(${wrist})`}>
        <rect x={-46} y={-30} width={58} height={60} rx={14} fill="#3B3480" stroke="#E6E9F8" strokeWidth={5} />
        <rect x={4} y={-22} width={22} height={12} rx={5} fill="#E6E9F8" />
        <rect x={4} y={10} width={22} height={12} rx={5} fill="#E6E9F8" />
      </g>
    </g>
  );
};

/** Little arcade joystick, the stick tip follows (hx, hy). */
export const Joystick: React.FC<{x: number; y: number; hx: number; hy: number; scale?: number}> = ({x, y, hx, hy, scale = 1}) => (
  <g>
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={-80} y={0} width={160} height={70} rx={22} fill="#2F2869" stroke="#6E64D8" strokeWidth={5} />
      <circle cx={40} cy={34} r={12} fill={C.pink} />
      <circle cx={-40} cy={34} r={12} fill={C.cyan} />
      <ellipse cx={0} cy={4} rx={36} ry={12} fill="#1A1446" />
    </g>
    <line x1={x} y1={y + 4 * scale} x2={hx} y2={hy} stroke="#1A1446" strokeWidth={16 * scale} strokeLinecap="round" />
    <circle cx={hx} cy={hy} r={26 * scale} fill={C.red} />
    <circle cx={hx - 8 * scale} cy={hy - 8 * scale} r={8 * scale} fill="#fff" opacity={0.6} />
  </g>
);

/* ------------------------------------------------------------------ */
/* HTML props (absolutely positioned)                                   */
/* ------------------------------------------------------------------ */

const glass: React.CSSProperties = {
  background: 'linear-gradient(160deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05))',
  border: '3px solid rgba(255,255,255,0.18)',
  boxShadow: '0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
  backdropFilter: 'blur(14px)',
  borderRadius: 40,
};

export const Pill: React.FC<{
  x: number;
  y: number;
  text: string;
  color?: string;
  bg?: string;
  size?: number;
  s?: number; // 0..1 appear
  rot?: number;
}> = ({x, y, text, color = C.ink, bg = C.cyan, size = 34, s = 1, rot = 0}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(-50%, -50%) scale(${s}) rotate(${rot}deg)`,
      opacity: clamp(s * 2),
      fontFamily: FONT_HEAD,
      fontWeight: 800,
      fontSize: size,
      letterSpacing: size * 0.08,
      color,
      background: bg,
      padding: `${size * 0.28}px ${size * 0.7}px`,
      borderRadius: 999,
      whiteSpace: 'nowrap',
      boxShadow: `0 10px 40px ${bg}66`,
    }}
  >
    {text}
  </div>
);

/** A glass card with a title and an animated signal waveform. */
export const WaveCard: React.FC<{
  x: number;
  y: number;
  w?: number;
  title: string;
  color: string;
  t: number;
  draw: number; // 0..1 how much of the wave is drawn
  s?: number;
  glitch?: number;
  phase?: number;
  badge?: React.ReactNode;
  glow?: number;
  bare?: number; // 0..1 fades the card chrome away, leaving only the wave
}> = ({x, y, w = 760, title, color, t, draw, s = 1, glitch = 0, phase = 0, badge, glow = 0, bare = 0}) => {
  const h = 250;
  const N = 120;
  const pts = Array.from({length: N + 1}, (_, i) => {
    const u = i / N;
    const env = Math.sin(Math.PI * u) ** 1.2;
    let v =
      Math.sin((u * 6 + phase) * Math.PI * 2) * 0.55 +
      Math.sin((u * 13 + phase * 2) * Math.PI * 2) * 0.25 +
      Math.sin((u * 2.2 + phase) * Math.PI * 2) * 0.2;
    if (glitch > 0) v = v * (1 - glitch) + wobble(u * 30 + t * 6, 1, 'gl') * 1.4 * glitch;
    return [30 + u * (w - 60 - 60), 120 - v * env * 62] as const;
  });
  const d = pts.map(([px, py], i) => `${i ? 'L' : 'M'} ${px.toFixed(1)} ${py.toFixed(1)}`).join(' ');
  const len = 2600;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        transform: `translate(-50%, -50%) scale(${s})`,
        opacity: clamp(s * 1.5),
        ...glass,
        boxShadow: `${glass.boxShadow}, 0 0 ${60 * glow}px ${color}`,
        borderColor: glow > 0.05 ? color : 'rgba(255,255,255,0.18)',
        ...(bare > 0
          ? {background: 'transparent', backdropFilter: 'none', boxShadow: 'none', borderColor: `rgba(255,255,255,${0.18 * (1 - bare)})`}
          : {}),
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 30,
          top: 22,
          fontFamily: FONT_HEAD,
          fontWeight: 800,
          fontSize: 32,
          letterSpacing: 4,
          color,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{width: 16, height: 16, borderRadius: 99, background: color, boxShadow: `0 0 16px ${color}`}} />
        {title}
      </div>
      {badge}
      <svg width={w - 60} height={h} style={{position: 'absolute', left: 30, top: 30, overflow: 'visible'}}>
        <path d={d} stroke={color} strokeWidth={14} fill="none" opacity={0.25} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} style={{filter: 'blur(6px)'}} />
        <path d={d} stroke={color} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
      </svg>
    </div>
  );
};

/** "TICKLE FEELING" level slider. level 0..1 */
export const FeelingSlider: React.FC<{x: number; y: number; level: number; s?: number; label?: string}> = ({
  x,
  y,
  level,
  s = 1,
  label = 'TICKLE FEELING',
}) => {
  const w = 760;
  const lv = clamp(level);
  const col = lv > 0.5 ? C.pink : lv > 0.2 ? C.yellow : '#8C86B8';
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: 210,
        transform: `translate(-50%, -50%) scale(${s})`,
        opacity: clamp(s * 1.5),
        ...glass,
      }}
    >
      <div style={{position: 'absolute', left: 36, top: 26, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 32, letterSpacing: 4, color: 'rgba(255,255,255,0.8)'}}>
        {label}
      </div>
      <div style={{position: 'absolute', right: 36, top: 14, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 52, color: col}}>
        {Math.round(lv * 100)}%
      </div>
      <div style={{position: 'absolute', left: 40, right: 40, top: 120, height: 36, borderRadius: 99, background: 'rgba(255,255,255,0.12)'}}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${lv * 100}%`,
            borderRadius: 99,
            background: `linear-gradient(90deg, #8C7DFF, ${col})`,
            boxShadow: `0 0 30px ${col}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `calc(${lv * 100}% - 34px)`,
            top: -16,
            width: 68,
            height: 68,
            borderRadius: 99,
            background: '#fff',
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
          }}
        />
      </div>
    </div>
  );
};

/** Rubber stamp that slams in. */
export const Stamp: React.FC<{
  x: number;
  y: number;
  t: number;
  at: number;
  text: string;
  strikeAt?: number;
  color?: string;
  size?: number;
  tint?: string;
}> = ({x, y, t, at, text, strikeAt, color = C.red, size = 150, tint = 'rgba(255,59,78,0.08)'}) => {
  if (t < at) return null;
  const p = ease.out(prog(t, at, at + 0.16));
  const sc = 2.4 - 1.4 * p;
  const strike = strikeAt !== undefined ? ease.out(prog(t, strikeAt, strikeAt + 0.22)) : 0;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(-11deg) scale(${sc})`, opacity: p}}>
      <div
        style={{
          fontFamily: FONT_HEAD,
          fontWeight: 800,
          fontSize: size,
          letterSpacing: size * 0.05,
          color,
          border: `${Math.round(size * 0.09)}px solid ${color}`,
          borderRadius: size * 0.23,
          padding: `${size * 0.04}px ${size * 0.28}px ${size * 0.09}px`,
          background: tint,
          whiteSpace: 'nowrap',
          textShadow: `0 0 40px ${color}55`,
          boxShadow: `0 0 60px ${color}44, inset 0 0 40px ${color}33`,
        }}
      >
        {text}
      </div>
      {strike > 0 && (
        <div
          style={{
            position: 'absolute',
            left: -30,
            right: -30,
            top: '50%',
            height: 26,
            marginTop: -13,
            background: '#fff',
            borderRadius: 99,
            transformOrigin: 'left center',
            transform: `scaleX(${strike}) rotate(4deg)`,
            boxShadow: '0 0 30px rgba(255,255,255,0.8)',
          }}
        />
      )}
    </div>
  );
};

/** Speech bubble with a tail pointing at (tailX, tailY) relative to its box's bottom-left. */
export const SpeechBubble: React.FC<{x: number; y: number; text: string; s: number; tail?: 'left' | 'right'}> = ({x, y, text, s, tail = 'left'}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(-50%, -50%) scale(${s})`,
      transformOrigin: tail === 'left' ? '10% 110%' : '90% 110%',
      opacity: clamp(s * 2),
    }}
  >
    <div
      style={{
        position: 'relative',
        background: '#fff',
        color: C.ink,
        fontFamily: FONT_DISPLAY,
        fontWeight: 600,
        fontSize: 58,
        padding: '24px 42px 28px',
        borderRadius: 60,
        whiteSpace: 'nowrap',
        boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
      }}
    >
      {text}
      <svg width={90} height={70} style={{position: 'absolute', bottom: -52, [tail]: 70} as React.CSSProperties}>
        <path d={tail === 'left' ? 'M 0 0 L 70 0 L 6 66 Z' : 'M 20 0 L 90 0 L 84 66 Z'} fill="#fff" />
      </svg>
    </div>
  </div>
);

/** Burst of "HA" letters flying out of a point. */
export const HaBurst: React.FC<{x: number; y: number; t: number; at: number; count?: number}> = ({x, y, t, at, count = 14}) => {
  if (t < at) return null;
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const delay = (i % 7) * 0.09 + Math.floor(i / 7) * 0.5;
        const tt = t - at - delay;
        if (tt < 0 || tt > 1.3) return null;
        const ang = -Math.PI / 2 + (((i * 137.5) % 360) - 180) * (Math.PI / 180) * 0.5;
        const dist = 150 + ease.out(clamp(tt / 1.1)) * (150 + (i % 4) * 40);
        const s = springAt(tt, 0, {damping: 9, stiffness: 220});
        const fade = 1 - prog(tt, 0.8, 1.3);
        const cols = [C.yellow, C.pink, '#fff', C.cyan];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: clamp(x + Math.cos(ang) * dist, 120, 960),
              top: y + Math.sin(ang) * dist,
              transform: `translate(-50%, -50%) scale(${s * (0.8 + (i % 3) * 0.25)}) rotate(${((i * 47) % 50) - 25}deg)`,
              opacity: fade,
              fontFamily: FONT_DISPLAY,
              fontWeight: 700,
              fontSize: 80,
              color: cols[i % 4],
              WebkitTextStroke: '10px #120C33',
              paintOrder: 'stroke fill',
            }}
          >
            {i % 3 === 0 ? 'HA!' : 'HA'}
          </div>
        );
      })}
    </>
  );
};

/** A glass card with arbitrary content. */
export const Card: React.FC<{x: number; y: number; w: number; h: number; s?: number; children?: React.ReactNode; style?: React.CSSProperties}> = ({
  x,
  y,
  w,
  h,
  s = 1,
  children,
  style,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      transform: `translate(-50%, -50%) scale(${s})`,
      opacity: clamp(s * 1.5),
      ...glass,
      ...style,
    }}
  >
    {children}
  </div>
);

/**
 * A comment bubble in the style of a social reply ("Replying to @user").
 * Uses an initial instead of the commenter's photo.
 */
export const CommentCard: React.FC<{
  x: number;
  y: number;
  user: string;
  text: string;
  s?: number;
  rot?: number;
  label?: string;
  /** override the chip text / the display name (e.g. when the username isn't shown) */
  tag?: string;
  name?: string;
}> = ({x, y, user, text, s = 1, rot = 0, label = 'Replying to', tag, name}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(-50%, -50%) scale(${s}) rotate(${rot}deg)`,
      opacity: clamp(s * 2),
      width: 860,
    }}
  >
    <div
      style={{
        fontFamily: FONT_HEAD,
        fontWeight: 800,
        fontSize: 30,
        letterSpacing: 4,
        color: C.ink,
        background: C.yellow,
        display: 'inline-block',
        padding: '8px 22px 9px',
        borderRadius: 999,
        marginLeft: 26,
        marginBottom: -8,
        position: 'relative',
        zIndex: 1,
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}
    >
      {tag ?? `${label.toUpperCase()} @${user.toUpperCase()}`}
    </div>
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 44,
        padding: '34px 40px 36px',
        display: 'flex',
        gap: 28,
        alignItems: 'flex-start',
        boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
      }}
    >
      <div
        style={{
          width: 104,
          height: 104,
          flex: '0 0 104px',
          borderRadius: 999,
          background: 'linear-gradient(135deg, #FF4F8B, #8C7DFF)',
          color: '#fff',
          fontFamily: FONT_HEAD,
          fontWeight: 800,
          fontSize: 54,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {user.slice(0, 1).toUpperCase()}
      </div>
      <div>
        <div style={{fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 38, color: '#3B3570'}}>{name ?? user}</div>
        <div style={{fontFamily: `${FONT_DISPLAY}, "Noto Color Emoji"`, fontWeight: 500, fontSize: 58, lineHeight: 1.15, color: C.ink, marginTop: 4}}>
          {text}
        </div>
      </div>
    </div>
  </div>
);

/** Glass "type" card used to compare two things side by side. */
export const TypeCard: React.FC<{
  x: number;
  y: number;
  title: string;
  sub: string;
  color: string;
  s?: number;
  icon?: React.ReactNode;
  dim?: number;
  w?: number;
}> = ({x, y, title, sub, color, s = 1, icon, dim = 0, w = 430}) => (
  <Card
    x={x}
    y={y}
    w={w}
    h={420}
    s={s}
    style={{borderColor: color, boxShadow: `0 30px 80px rgba(0,0,0,0.45), 0 0 50px ${color}55`, opacity: clamp(s * 1.5) * (1 - dim * 0.6)}}
  >
    <div style={{position: 'absolute', left: 0, right: 0, top: 26, height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      {icon}
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 52, lineHeight: 1.0, color}}>
      {title}
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 350, textAlign: 'center', fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 32, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic'}}>
      {sub}
    </div>
  </Card>
);
