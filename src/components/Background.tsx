import React from 'react';
import {AbsoluteFill} from 'remotion';
import {wobble, W, H} from '../lib/anim';

/**
 * Deep-space studio backdrop: layered gradients, drifting bokeh, a moving key
 * light, film grain and a vignette. `hue` shifts the whole palette per scene.
 */
export const Background: React.FC<{t: number; hue?: number; glow?: number; glowX?: number; glowY?: number; w?: number; h?: number}> = ({
  t,
  hue = 0,
  glow = 1,
  glowX = 540,
  glowY = 860,
  w = W,
  h = H,
}) => {
  const cx = w / 2;
  const horizon = h * 0.6;
  const bokeh = Array.from({length: 26}, (_, i) => {
    const sx = (i * 397) % w;
    const sy = (i * 733) % h;
    const r = 6 + ((i * 53) % 30);
    const x = sx + wobble(t, 0.05, `bx${i}`) * 120;
    const y = ((sy - t * (10 + (i % 5) * 6)) % h + h) % h;
    const a = 0.05 + ((i * 17) % 10) / 100;
    return {x, y, r, a, c: i % 3 === 0 ? '#45E9FF' : i % 3 === 1 ? '#FF4F8B' : '#B7A6FF'};
  });
  const lx = glowX + wobble(t, 0.12, 'lx') * 80;
  const ly = glowY + wobble(t, 0.1, 'ly') * 60;
  return (
    <AbsoluteFill style={{filter: hue ? `hue-rotate(${hue}deg)` : undefined}}>
      <AbsoluteFill
        style={{background: 'linear-gradient(170deg, #1B1352 0%, #120C3A 45%, #0A0722 100%)'}}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${lx}px ${ly}px, rgba(120,90,255,${0.42 * glow}) 0%, rgba(90,60,220,${0.16 * glow}) 28%, rgba(0,0,0,0) 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${w * 0.83 + wobble(t, 0.08, 'p') * 60}px ${h * 0.16}px, rgba(255,79,139,0.16) 0%, rgba(0,0,0,0) 40%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${w * 0.11}px ${h * 0.78}px, rgba(69,233,255,0.12) 0%, rgba(0,0,0,0) 42%)`,
        }}
      />
      {/* subtle perspective grid floor */}
      <svg width={w} height={h} style={{position: 'absolute', opacity: 0.22}}>
        <defs>
          <linearGradient id="floorfade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8C7DFF" stopOpacity="0" />
            <stop offset="1" stopColor="#8C7DFF" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {Array.from({length: 15}, (_, i) => {
          const x = cx - 1740 * (w / 1080) + i * 240 * (w / 1080);
          return <line key={`v${i}`} x1={cx} y1={horizon} x2={x} y2={h} stroke="url(#floorfade)" strokeWidth={2} />;
        })}
        {Array.from({length: 8}, (_, i) => {
          const p = ((i + (t * 0.25) % 1) / 8) ** 2;
          const y = horizon + 30 + p * (h - horizon - 30);
          return <line key={`h${i}`} x1={0} y1={y} x2={w} y2={y} stroke="#8C7DFF" strokeOpacity={p * 0.8} strokeWidth={2} />;
        })}
      </svg>
      <svg width={w} height={h} style={{position: 'absolute'}}>
        <defs>
          <filter id="bokehblur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        {bokeh.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={b.c} opacity={b.a} filter="url(#bokehblur)" />
        ))}
      </svg>
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(3,2,12,0.62) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

/** Animated film grain — sits on top of everything at low opacity. */
export const Grain: React.FC<{frame: number; opacity?: number; w?: number; h?: number}> = ({frame, opacity = 0.07, w = W, h = H}) => (
  <svg width={w} height={h} style={{position: 'absolute', inset: 0, opacity, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={Math.floor(frame / 2) % 50} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width={w} height={h} filter="url(#grain)" />
  </svg>
);
