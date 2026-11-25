import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Pip} from '../character/Pip';
import {Brain} from '../components/Brain';
import {Feather} from '../components/Props';
import {C, FONT_DISPLAY, FONT_HEAD} from '../lib/theme';

/** Channel profile picture (YouTube + Instagram). 1080×1080, shown as a circle. */
export const Avatar: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        'radial-gradient(circle at 50% 42%, #4A2DB0 0%, #2A1A78 34%, #150E44 66%, #0B0824 100%)',
    }}
  >
    <AbsoluteFill
      style={{background: 'radial-gradient(circle at 50% 22%, rgba(69,233,255,0.35) 0%, rgba(69,233,255,0) 30%)'}}
    />
    <AbsoluteFill
      style={{background: 'radial-gradient(circle at 50% 90%, rgba(255,79,139,0.28) 0%, rgba(255,79,139,0) 45%)'}}
    />
    <svg width={1080} height={1080} style={{position: 'absolute'}}>
      <circle cx={540} cy={540} r={500} fill="none" stroke="rgba(140,125,255,0.35)" strokeWidth={6} />
      <Pip
        id="avatar"
        t={2.2}
        pose={{
          x: 540,
          y: 1110,
          scale: 1.62,
          smile: 0.8,
          mouthOpen: 0.28,
          browL: 0.55,
          browR: 0.35,
          lid: 0,
          lookY: -0.05,
          blush: 0.55,
          antennaGlow: 1,
          handL: [-175, 300],
          handR: [175, 300],
        }}
      />
    </svg>
  </AbsoluteFill>
);

const Planet: React.FC<{x: number; y: number; r: number; o?: number}> = ({x, y, r, o = 1}) => (
  <g transform={`translate(${x} ${y})`} opacity={o}>
    <defs>
      <radialGradient id="planet" cx="35%" cy="30%" r="80%">
        <stop offset="0" stopColor="#B7A6FF" />
        <stop offset="0.6" stopColor="#6E5BEA" />
        <stop offset="1" stopColor="#2F237E" />
      </radialGradient>
    </defs>
    <ellipse rx={r * 1.9} ry={r * 0.42} fill="none" stroke="#FFD84D" strokeOpacity={0.55} strokeWidth={r * 0.12} transform="rotate(-18)" />
    <circle r={r} fill="url(#planet)" />
    <path d={`M ${-r * 1.9} 0 A ${r * 1.9} ${r * 0.42} 0 0 0 ${r * 1.9} 0`} fill="none" stroke="#FFD84D" strokeOpacity={0.8} strokeWidth={r * 0.12} transform="rotate(-18)" />
  </g>
);

const Atom: React.FC<{x: number; y: number; s: number; o?: number}> = ({x, y, s, o = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    {[0, 60, 120].map((a) => (
      <ellipse key={a} rx={120} ry={42} fill="none" stroke={C.cyan} strokeWidth={9} transform={`rotate(${a})`} />
    ))}
    <circle r={22} fill={C.pink} />
  </g>
);

const Bulb: React.FC<{x: number; y: number; s: number; o?: number}> = ({x, y, s, o = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <circle r={90} fill={C.yellow} opacity={0.25} />
    <path d="M -50 -20 A 60 60 0 1 1 50 -20 C 40 10 26 20 26 46 L -26 46 C -26 20 -40 10 -50 -20 Z" fill={C.yellow} />
    <rect x={-28} y={52} width={56} height={14} rx={6} fill="#C9C3E8" />
    <rect x={-22} y={70} width={44} height={12} rx={6} fill="#C9C3E8" />
  </g>
);

const Q: React.FC<{x: number; y: number; size: number; rot: number; color: string; o?: number}> = ({x, y, size, rot, color, o = 1}) => (
  <text
    x={x}
    y={y}
    fontFamily={FONT_DISPLAY}
    fontWeight={700}
    fontSize={size}
    fill={color}
    opacity={o}
    transform={`rotate(${rot} ${x} ${y})`}
    textAnchor="middle"
  >
    ?
  </text>
);

/** YouTube banner, 2560×1440. Everything important sits in the 1546×423 mobile safe area. */
export const Banner: React.FC<{showSafeArea?: boolean}> = ({showSafeArea = false}) => (
  <AbsoluteFill style={{background: 'linear-gradient(165deg, #22176A 0%, #140D45 45%, #0A0722 100%)'}}>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 52%, rgba(120,90,255,0.42) 0%, rgba(90,60,220,0.12) 35%, rgba(0,0,0,0) 62%)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(circle at 86% 20%, rgba(255,79,139,0.22) 0%, rgba(0,0,0,0) 30%)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(circle at 12% 82%, rgba(69,233,255,0.18) 0%, rgba(0,0,0,0) 30%)'}} />
    <svg width={2560} height={1440} style={{position: 'absolute'}}>
      <defs>
        <linearGradient id="bfloor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8C7DFF" stopOpacity="0" />
          <stop offset="1" stopColor="#8C7DFF" stopOpacity="0.5" />
        </linearGradient>
        <filter id="bblur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      {/* perspective floor */}
      {Array.from({length: 25}, (_, i) => (
        <line key={i} x1={1280} y1={980} x2={-1800 + i * 256} y2={1440} stroke="url(#bfloor)" strokeWidth={2} />
      ))}
      {[0, 1, 2, 3, 4].map((i) => {
        const p = ((i + 0.5) / 5) ** 2;
        return <line key={i} x1={0} x2={2560} y1={1000 + p * 440} y2={1000 + p * 440} stroke="#8C7DFF" strokeOpacity={0.12 + p * 0.3} strokeWidth={2} />;
      })}
      {/* bokeh */}
      {Array.from({length: 40}, (_, i) => (
        <circle
          key={i}
          cx={(i * 641) % 2560}
          cy={(i * 389) % 1440}
          r={8 + ((i * 37) % 26)}
          fill={[C.cyan, C.pink, '#B7A6FF'][i % 3]}
          opacity={0.08 + ((i * 13) % 8) / 100}
          filter="url(#bblur)"
        />
      ))}
      {/* decorations (visible on desktop / TV, outside the mobile safe area) */}
      <Planet x={300} y={330} r={95} o={0.9} />
      <Atom x={2290} y={1150} s={0.9} o={0.75} />
      <Bulb x={330} y={1120} s={0.95} o={0.8} />
      <Brain id="bannerbrain" t={1.3} x={2250} y={300} scale={0.42} rot={8} face={1} smile={0.6} smirk={0.3} lookX={-0.6} lid={0.1} />
      <Feather x={2050} y={1250} rot={-28} scale={1.1} t={0.4} />
      <Q x={560} y={260} size={140} rot={-14} color={C.yellow} o={0.85} />
      <Q x={1980} y={240} size={110} rot={12} color={C.cyan} o={0.8} />
      <Q x={150} y={720} size={120} rot={-8} color={C.pink} o={0.75} />
      <Q x={2440} y={700} size={150} rot={14} color={C.yellow} o={0.7} />
      <Q x={1180} y={1280} size={100} rot={-10} color={C.cyan} o={0.5} />
      {/* Pip */}
      <Pip
        id="bannerpip"
        t={2.2}
        pose={{
          x: 760,
          y: 985,
          scale: 0.74,
          smile: 0.85,
          mouthOpen: 0.32,
          browL: 0.55,
          browR: 0.45,
          blush: 0.55,
          lookX: 0.55,
          lookY: -0.1,
          antennaGlow: 1,
          tilt: 3,
          handR: [250, -150],
          handL: [-212, 118],
        }}
      />
      {showSafeArea && <rect x={507} y={508} width={1546} height={423} fill="none" stroke="#f00" strokeWidth={4} strokeDasharray="20 12" />}
    </svg>
    <div style={{position: 'absolute', left: 1010, top: 560, display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
      <div
        style={{
          fontFamily: FONT_HEAD,
          fontWeight: 800,
          fontSize: 36,
          letterSpacing: 6,
          color: C.ink,
          background: C.cyan,
          padding: '9px 26px 10px',
          borderRadius: 999,
          boxShadow: '0 0 34px rgba(69,233,255,0.5)',
        }}
      >
        NEW FACT EVERY DAY
      </div>
      <div
        style={{
          fontFamily: FONT_HEAD,
          fontWeight: 800,
          fontSize: 150,
          lineHeight: 1,
          letterSpacing: -3,
          marginTop: 22,
          color: '#fff',
          textShadow: '0 8px 0 rgba(10,6,30,0.6), 0 20px 50px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap',
        }}
      >
        PIP <span style={{color: C.yellow}}>EXPLAINS</span>
      </div>
      <div style={{fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 50, marginTop: 20, color: 'rgba(255,255,255,0.88)', whiteSpace: 'nowrap'}}>
        The facts you always wondered about.
      </div>
    </div>
  </AbsoluteFill>
);
