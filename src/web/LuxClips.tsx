import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Pip} from '../character/Pip';

/**
 * Cinematic, seamless website loops: Pip as a calm host in a dark studio.
 * Every motion is periodic in the loop length so <video loop> never jumps.
 */
export const LUX_FPS = 30;
const TAU = Math.PI * 2;

let fontsLoaded = false;
const ensureFonts = () => {
  if (fontsLoaded) return;
  fontsLoaded = true;
  loadFont({family: 'Instrument Serif', url: staticFile('fonts/instrument-serif-latin-400-normal.woff2'), weight: '400'});
  loadFont({family: 'Instrument Serif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'});
  loadFont({family: 'Inter Tight', url: staticFile('fonts/inter-tight-latin-500-normal.woff2'), weight: '500'});
};

const blinkAt = (t: number, times: number[]) => Math.max(0, ...times.map((bt) => 1 - Math.abs(t - bt) / 0.08));

/** Dark studio: spotlight cone, warm floor pool, drifting dust, vignette. */
const Studio: React.FC<{w: number; h: number; t: number; L: number; floorY: number; coneX?: number; warm?: number}> = ({w, h, t, L, floorY, coneX = 0.5, warm = 1}) => {
  const cx = w * coneX;
  const dust = Array.from({length: 46}, (_, i) => {
    const seed = (i * 9301 + 49297) % 233280;
    const r0 = seed / 233280;
    const r1 = ((i * 7919) % 1000) / 1000;
    const cycles = 1 + (i % 2); // integer cycles per loop -> seamless
    const p = ((t / L) * cycles + r0) % 1;
    const x = cx + (r1 - 0.5) * w * 0.55 * (0.4 + p * 0.6) + Math.sin(TAU * ((t / L) * cycles + r1)) * 18;
    const y = floorY - p * floorY * 0.95;
    const a = Math.sin(p * Math.PI) * (0.25 + r1 * 0.45);
    return {x, y, a, r: 1.2 + r1 * 2.6};
  });
  return (
    <>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 35%, #1b1822 0%, #0e0d12 45%, #070709 100%)'}} />
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff5e6" stopOpacity={0.2} />
            <stop offset="1" stopColor="#fff5e6" stopOpacity={0} />
          </linearGradient>
          <radialGradient id="pool" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#ffd9a8" stopOpacity={0.22 * warm} />
            <stop offset="1" stopColor="#ffd9a8" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="bounce" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#ff8a3d" stopOpacity={0.22 * warm} />
            <stop offset="1" stopColor="#ff8a3d" stopOpacity={0} />
          </radialGradient>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>
        <path d={`M ${cx - w * 0.06} 0 L ${cx + w * 0.06} 0 L ${cx + w * 0.36} ${floorY + 40} L ${cx - w * 0.36} ${floorY + 40} Z`} fill="url(#cone)" filter="url(#soft)" />
        <ellipse cx={cx} cy={floorY - h * 0.22} rx={w * 0.42} ry={h * 0.3} fill="url(#bounce)" />
        <ellipse cx={cx} cy={floorY + 8} rx={w * 0.4} ry={h * 0.06} fill="url(#pool)" />
        <line x1={0} y1={floorY + 30} x2={w} y2={floorY + 30} stroke="#ffffff" strokeOpacity={0.05} strokeWidth={2} />
        {dust.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#fff3e0" opacity={d.a} />
        ))}
      </svg>
    </>
  );
};

const Vignette: React.FC = () => <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)'}} />;

/* Hero: Pip on stage, full body, 4:5 ------------------------------------ */
export const LuxHero: React.FC = () => {
  const L = 8;
  const t = (useCurrentFrame() / LUX_FPS) % L;
  const W = 1080;
  const H = 1350;
  const push = 1 + 0.025 * (1 - Math.cos((TAU * t) / L)) / 2;
  const breath = Math.sin((TAU * t) / 4);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 60%'}}>
        <Studio w={W} h={H} t={t} L={L} floorY={1130} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <Pip
            id="luxhero"
            t={2.2}
            pose={{
              x: 540,
              y: 1135,
              scale: 1.22,
              squash: 1 + breath * 0.012,
              tilt: Math.sin((TAU * t) / L) * 1.6,
              lookX: Math.sin((TAU * t) / L) * 0.42,
              lookY: -0.06 + Math.sin((TAU * 2 * t) / L) * 0.05,
              lid: blinkAt(t, [2.4, 5.9]),
              smile: 0.32,
              browL: 0.12,
              browR: 0.12,
              blush: 0.25,
              antennaGlow: 0.55 + 0.45 * Math.pow(Math.sin((TAU * t) / L), 2),
              handL: [-206, 124],
              handR: [206, 124],
            }}
          />
        </svg>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

/* Host portrait: close-up, 1:1 ------------------------------------------ */
export const LuxHost: React.FC = () => {
  const L = 6;
  const t = (useCurrentFrame() / LUX_FPS) % L;
  const W = 1080;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Studio w={W} h={W} t={t} L={L} floorY={1060} coneX={0.46} warm={1.2} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 12% 40%, rgba(255,138,61,0.20), rgba(0,0,0,0) 45%), radial-gradient(circle at 92% 30%, rgba(120,200,255,0.12), rgba(0,0,0,0) 40%)'}} />
      <svg width={W} height={W} style={{position: 'absolute', inset: 0}}>
        <Pip
          id="luxhost"
          t={2.2}
          pose={{
            x: 540,
            y: 1360,
            scale: 2.0,
            lookX: Math.sin((TAU * t) / L) * 0.5,
            lookY: Math.sin((TAU * 2 * t) / L) * 0.18,
            lid: blinkAt(t, [3.3]),
            smile: 0.38,
            browL: 0.15 + Math.max(0, Math.sin((TAU * t) / L)) * 0.25,
            browR: 0.15,
            blush: 0.25,
            squash: 1 + Math.sin((TAU * t) / 3) * 0.01,
            antennaGlow: 0.6 + 0.4 * Math.pow(Math.sin((TAU * t) / L), 2),
            handL: [-200, 300],
            handR: [200, 300],
          }}
        />
      </svg>
      <Vignette />
    </AbsoluteFill>
  );
};

/* Social share card 1200×630 ------------------------------------------- */
export const LuxOg: React.FC = () => {
  ensureFonts();
  return (
    <AbsoluteFill style={{background: '#09090b'}}>
      <AbsoluteFill style={{left: 560}}>
        <Studio w={640} h={630} t={1} L={8} floorY={600} warm={1.2} />
        <svg width={640} height={630} style={{position: 'absolute', inset: 0}}>
          <Pip id="og" t={2.2} pose={{x: 320, y: 600, scale: 0.78, smile: 0.35, lookX: -0.45, antennaGlow: 0.9, handL: [-206, 124], handR: [206, 124]}} />
        </svg>
        <Vignette />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(90deg, #09090b 48%, rgba(9,9,11,0) 62%)'}} />
      <div style={{position: 'absolute', left: 72, top: 70, fontFamily: 'Inter Tight', fontWeight: 500, fontSize: 18, letterSpacing: 5, color: '#8d8a85', textTransform: 'uppercase'}}>
        Pip Explains · Daily science series
      </div>
      <div style={{position: 'absolute', left: 66, top: 170, fontFamily: 'Instrument Serif', fontSize: 132, lineHeight: 0.95, color: '#ece8e1', letterSpacing: -2}}>
        Curiosity,
        <br />
        <span style={{fontStyle: 'italic', color: '#ff9a55'}}>answered.</span>
      </div>
      <div style={{position: 'absolute', left: 72, bottom: 70, fontFamily: 'Inter Tight', fontWeight: 500, fontSize: 22, color: '#bdb8b0'}}>
        One question a day · Under a minute · Sources included
      </div>
    </AbsoluteFill>
  );
};
