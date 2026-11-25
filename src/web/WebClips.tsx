import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Pip} from '../character/Pip';
import {SpeechBubble} from '../components/Props';
import {clamp, ease, prog, springAt, wobble} from '../lib/anim';
import {C, FONT_DISPLAY, FONT_HEAD} from '../lib/theme';

/**
 * Square, seamlessly looping clips made specifically for the website.
 * 1080×1080 @ 30 fps. Every motion is periodic in the clip length so the
 * <video loop> seam is invisible.
 */
export const WEB_FPS = 30;
const S = 1080;

const SquareBg: React.FC<{t: number; dim?: number; hue?: number}> = ({t, dim = 0, hue = 0}) => (
  <AbsoluteFill style={{filter: hue ? `hue-rotate(${hue}deg)` : undefined}}>
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 42%, #3A2390 0%, #1E1460 38%, #0E0930 70%, #07051A 100%)`, opacity: 1 - dim * 0.4}} />
    <AbsoluteFill style={{background: `radial-gradient(circle at ${50 + Math.sin((t / 8) * Math.PI * 2) * 8}% 28%, rgba(69,233,255,0.18) 0%, rgba(0,0,0,0) 35%)`}} />
    <AbsoluteFill style={{background: 'radial-gradient(circle at 85% 90%, rgba(255,79,139,0.18) 0%, rgba(0,0,0,0) 40%)'}} />
    <svg width={S} height={S} style={{position: 'absolute'}}>
      <defs>
        <filter id="sqblur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {Array.from({length: 18}, (_, i) => {
        const cx = (i * 263) % S;
        const base = (i * 577) % S;
        const cy = ((base - (t / 8) * S * ((i % 3) + 1)) % S + S) % S; // integer loops per 8 s
        return <circle key={i} cx={cx} cy={cy} r={6 + ((i * 41) % 22)} fill={[C.cyan, C.pink, '#B7A6FF'][i % 3]} opacity={0.08 + (i % 5) / 60} filter="url(#sqblur)" />;
      })}
      <ellipse cx={540} cy={985} rx={420} ry={60} fill="#8C7DFF" opacity={0.12} />
    </svg>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(3,2,12,0.55) 100%)'}} />
  </AbsoluteFill>
);

/** A loop-safe clock: t in [0, L). */
const useLoopT = (L: number) => (useCurrentFrame() / WEB_FPS) % L;

/* ------------------------------------------------------------------ */
/* 1. "Hi, I'm Pip!" — Meet Pip section                                 */
/* ------------------------------------------------------------------ */
export const ClipHello: React.FC = () => {
  const L = 8;
  const t = useLoopT(L);
  const wave = Math.sin((t / L) * Math.PI * 2 * 12);
  const bounce = Math.abs(Math.sin((t / L) * Math.PI * 8));
  const bubble = springAt(t, 0.6, {damping: 11}) * (1 - ease.in(prog(t, 6.9, 7.3)));
  const look = Math.sin((t / L) * Math.PI * 2 * 2) * 0.35;
  const blink = Math.max(0, 1 - Math.abs(t - 3.1) / 0.07, 1 - Math.abs(t - 6.3) / 0.07);
  return (
    <AbsoluteFill>
      <SquareBg t={t} />
      <svg width={S} height={S} style={{position: 'absolute'}}>
        <Pip
          id="hello"
          t={2.2 + 0.0001 * t}
          pose={{
            x: 540,
            y: 985,
            scale: 1.05,
            hop: bounce * 14,
            squash: 1 - bounce * 0.02,
            smile: 0.85,
            mouthOpen: 0.32,
            blush: 0.55,
            browL: 0.5,
            browR: 0.5,
            lookX: look,
            lookY: -0.05,
            lid: blink,
            handR: [250 + wave * 26, -170 + Math.cos((t / L) * Math.PI * 2 * 12) * 18],
            handL: [-212, 118],
            antennaGlow: 0.7 + 0.3 * Math.sin((t / L) * Math.PI * 2 * 4),
            tilt: Math.sin((t / L) * Math.PI * 2 * 2) * 3,
          }}
        />
      </svg>
      {bubble > 0.001 && <SpeechBubble x={720} y={250} text="Hi, I'm Pip! 👋" s={bubble} />}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* 2. The Fact Machine — a question goes in, a fact comes out           */
/* ------------------------------------------------------------------ */
export const ClipMachine: React.FC = () => {
  const L = 8;
  const t = useLoopT(L);
  const qDrop = ease.in(prog(t, 0.3, 1.2));
  const lever = Math.sin(prog(t, 1.1, 1.7) * Math.PI);
  const working = t > 1.3 && t < 3.4;
  const shakeX = working ? Math.sin(t * 60) * 5 : 0;
  const shakeR = working ? Math.sin(t * 47) * 1.2 : 0;
  const gear = t * (working ? 360 : 40);
  const outP = ease.out(prog(t, 3.4, 4.2));
  const caught = t > 4.2;
  const cardFade = 1 - ease.in(prog(t, 6.9, 7.6));
  const cheer = caught && t < 7 ? Math.abs(Math.sin((t - 4.2) * Math.PI * 2.2)) : 0;
  const ding = springAt(t, 3.4, {damping: 8, stiffness: 220}) * (1 - ease.in(prog(t, 4.0, 4.4)));
  const lights = [C.cyan, C.pink, C.yellow, C.lime];
  // card path: chute (700, 840) -> Pip's hands (330, 700)
  const cx = caught ? 300 : 700 - 400 * outP;
  const cy = caught ? 495 + Math.sin(t * 6) * 6 : 860 - 365 * outP - Math.sin(outP * Math.PI) * 120;
  return (
    <AbsoluteFill>
      <SquareBg t={t} hue={-30} />
      <svg width={S} height={S} style={{position: 'absolute'}}>
        <defs>
          <linearGradient id="mach" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6E5BEA" />
            <stop offset="1" stopColor="#2F237E" />
          </linearGradient>
          <filter id="mglow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>
        {/* machine */}
        <g transform={`translate(${720 + shakeX} 560) rotate(${shakeR})`}>
          <path d="M -120 -330 L 120 -330 L 50 -230 L -50 -230 Z" fill="#B7A6FF" stroke="#2F237E" strokeWidth={8} strokeLinejoin="round" />
          <rect x={-220} y={-240} width={440} height={520} rx={60} fill="url(#mach)" stroke="#B7A6FF" strokeOpacity={0.5} strokeWidth={6} />
          <rect x={-170} y={-190} width={340} height={150} rx={28} fill="#120C33" />
          {[-110, -40, 30, 100].map((lx, i) => (
            <circle key={i} cx={lx} cy={-115} r={20} fill={lights[i]} opacity={working ? 0.35 + 0.65 * (Math.sin(t * 18 + i * 1.7) > 0 ? 1 : 0) : 0.35} filter={working ? 'url(#mglow)' : undefined} />
          ))}
          {[-110, -40, 30, 100].map((lx, i) => (
            <circle key={`c${i}`} cx={lx} cy={-115} r={12} fill={lights[i]} />
          ))}
          {[[-100, 60], [60, 60]].map(([gx, gy], i) => (
            <g key={i} transform={`translate(${gx} ${gy}) rotate(${gear * (i ? -1 : 1)})`}>
              {Array.from({length: 8}, (_, k) => (
                <rect key={k} x={-12} y={-74} width={24} height={30} rx={6} fill="#B7A6FF" transform={`rotate(${k * 45})`} />
              ))}
              <circle r={56} fill="#B7A6FF" />
              <circle r={22} fill="#2F237E" />
            </g>
          ))}
          <rect x={-200} y={180} width={130} height={70} rx={20} fill="#120C33" />
          <text x={80} y={235} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={40} fill="#fff" opacity={0.85} letterSpacing={4}>
            FACT-O-MATIC
          </text>
          {/* lever */}
          <g transform={`translate(220 -40) rotate(${-30 + lever * 70})`}>
            <rect x={-8} y={-130} width={16} height={130} rx={8} fill="#E6E9F8" />
            <circle cy={-130} r={26} fill={C.red} />
          </g>
          {working && [0, 1, 2].map((k) => {
            const p = ((t * 1.6 + k / 3) % 1);
            return <circle key={k} cx={-150 + k * 20} cy={-250 - p * 160} r={20 + p * 30} fill="#fff" opacity={(1 - p) * 0.35} />;
          })}
        </g>
        {/* question going in */}
        {t < 1.3 && (
          <g transform={`translate(720 ${-60 + qDrop * 300}) scale(${1 - qDrop * 0.5})`}>
            <circle r={64} fill={C.pink} />
            <text y={30} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={700} fontSize={90} fill="#fff">
              ?
            </text>
          </g>
        )}
        <Pip
          id="mach"
          t={2.2 + 0.0001 * t}
          pose={{
            x: 300,
            y: 1000,
            scale: 0.78,
            goggles: 1,
            lookX: caught ? 0.2 : 0.8,
            lookY: t < 1.3 ? -0.8 : caught ? -0.3 : -0.2,
            smile: caught ? 0.9 : 0.5,
            mouthOpen: caught ? 0.4 : 0.1,
            happyEyes: cheer > 0.05 && t > 4.4 && t < 6.6 ? 1 : 0,
            hop: cheer * 20,
            blush: caught ? 0.8 : 0.4,
            browL: 0.5,
            browR: 0.5,
            handL: caught && cardFade > 0.5 ? [-70, -300] : [-212, 118],
            handR: caught && cardFade > 0.5 ? [70, -300] : [212, 118],
            antennaGlow: caught ? 1 : 0.6,
          }}
        />
        {/* fact card coming out */}
        {t > 3.4 && cardFade > 0.01 && (
          <g transform={`translate(${cx} ${cy}) rotate(${caught ? Math.sin(t * 3) * 4 : -20 + outP * 20})`} opacity={cardFade}>
            <rect x={-110} y={-80} width={220} height={160} rx={26} fill={C.yellow} filter="url(#mglow)" opacity={0.6} />
            <rect x={-110} y={-80} width={220} height={160} rx={26} fill={C.yellow} />
            <text y={40} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={700} fontSize={120} fill={C.ink}>
              !
            </text>
          </g>
        )}
      </svg>
      {ding > 0.001 && (
        <div style={{position: 'absolute', left: 560, top: 380, transform: `translate(-50%, -50%) scale(${ding}) rotate(-8deg)`, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 110, color: C.yellow, WebkitTextStroke: '14px #120C33', paintOrder: 'stroke fill'}}>
          DING!
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* 3. Sleeping Pip — footer ("new fact tomorrow")                       */
/* ------------------------------------------------------------------ */
export const ClipSleep: React.FC = () => {
  const L = 6;
  const t = useLoopT(L);
  const breath = Math.sin((t / L) * Math.PI * 2 * 2);
  return (
    <AbsoluteFill>
      <SquareBg t={(t / L) * 8} dim={1} hue={-40} />
      <svg width={S} height={S} style={{position: 'absolute'}}>
        {/* moon + stars */}
        <circle cx={850} cy={220} r={70} fill="#FFF1A8" opacity={0.9} />
        <circle cx={880} cy={200} r={64} fill="#1A1350" />
        {Array.from({length: 9}, (_, i) => (
          <circle key={i} cx={(i * 233 + 90) % 1000} cy={(i * 137 + 80) % 420} r={3 + (i % 3)} fill="#fff" opacity={0.3 + 0.5 * Math.abs(Math.sin((t / L) * Math.PI * 2 + i))} />
        ))}
        <Pip
          id="sleep"
          t={2.2 + 0.0001 * t}
          pose={{
            x: 540,
            y: 985,
            scale: 1.0,
            lid: 1,
            smile: 0.25,
            mouthOpen: 0.12 + 0.06 * (breath + 1) / 2,
            mouthW: 0.6,
            squash: 1 + breath * 0.025,
            tilt: 7,
            blush: 0.5,
            antennaGlow: 0.15 + 0.15 * (breath + 1) / 2,
            handL: [-150, 150],
            handR: [150, 150],
          }}
        />
      </svg>
      {[0, 1, 2].map((k) => {
        const p = ((t / L) * 2 + k / 3) % 1;
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: 640 + p * 180 + Math.sin(p * 6) * 20,
              top: 470 - p * 300,
              fontFamily: FONT_DISPLAY,
              fontWeight: 700,
              fontSize: 60 + p * 70,
              color: '#B7A6FF',
              opacity: clamp(Math.sin(p * Math.PI) * 1.4),
              transform: `rotate(${-10 + p * 20}deg)`,
            }}
          >
            Z
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// keep a reference so tree-shaking never drops the noise helper used by Pip
export const _noiseRef = wobble;
