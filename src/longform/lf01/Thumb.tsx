import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Pip} from '../../character/Pip';
import {Brain} from '../../components/Brain';
import {C, FONT_DISPLAY, FONT_HEAD} from '../../lib/theme';

/** YouTube thumbnail, 1280x720. */
export const LF01Thumb: React.FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(160deg, #2C1A6E 0%, #160F45 55%, #0A0722 100%)', overflow: 'hidden'}}>
    <AbsoluteFill style={{background: 'radial-gradient(circle at 76% 52%, rgba(255,200,80,0.45) 0%, rgba(255,120,60,0.15) 30%, rgba(0,0,0,0) 55%)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(circle at 18% 90%, rgba(69,233,255,0.18) 0%, rgba(0,0,0,0) 40%)'}} />
    {/* sunburst behind Pip */}
    <svg width={1280} height={720} style={{position: 'absolute', inset: 0, opacity: 0.12}}>
      {Array.from({length: 18}, (_, i) => (
        <path key={i} d={`M 975 380 L ${975 + Math.cos((i / 18) * Math.PI * 2) * 900} ${380 + Math.sin((i / 18) * Math.PI * 2) * 900} L ${975 + Math.cos(((i + 0.45) / 18) * Math.PI * 2) * 900} ${380 + Math.sin(((i + 0.45) / 18) * Math.PI * 2) * 900} Z`} fill="#FFD84D" />
      ))}
    </svg>
    <svg width={1280} height={720} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <Pip
        id="thumb"
        t={2.3}
        pose={{
          x: 985,
          y: 800,
          scale: 1.18,
          lookX: -0.35,
          lookY: -0.05,
          lid: 0,
          browL: 1,
          browR: 1,
          browAngry: -0.5,
          smile: -0.3,
          mouthOpen: 0.95,
          mouthW: 0.85,
          handL: [-150, -30],
          handR: [150, -30],
          antennaGlow: 1,
          blush: 0.6,
          tilt: -4,
        }}
      />
      {/* teaser: the "10% of your brain" myth, crossed out */}
      <g transform="translate(300 585) rotate(-6)">
        <Brain x={0} y={0} scale={0.3} t={1} id="thumbbrain" />
        <text x={120} y={34} fontFamily={FONT_DISPLAY} fontWeight={700} fontSize={110} fill="#fff" stroke="#120C33" strokeWidth={16} paintOrder="stroke">
          10%
        </text>
        <path d="M 110 -60 L 340 40" stroke={C.red} strokeWidth={22} strokeLinecap="round" />
      </g>
    </svg>
    <div style={{position: 'absolute', left: 48, top: 40, lineHeight: 0.92}}>
      <div style={{fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 196, color: C.yellow, WebkitTextStroke: '20px #120C33', paintOrder: 'stroke fill', textShadow: '0 12px 0 rgba(10,6,30,0.6)', letterSpacing: -2}}>
        10 MYTHS
      </div>
      <div style={{fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 78, color: '#fff', WebkitTextStroke: '12px #120C33', paintOrder: 'stroke fill', textShadow: '0 8px 0 rgba(10,6,30,0.6)', marginTop: 6}}>
        YOU STILL BELIEVE
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 470,
        top: 300,
        transform: 'rotate(-12deg)',
        fontFamily: FONT_HEAD,
        fontWeight: 800,
        fontSize: 92,
        letterSpacing: 6,
        color: C.red,
        border: `10px solid ${C.red}`,
        borderRadius: 22,
        padding: '0 26px 6px',
        background: 'rgba(255,255,255,0.92)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
      }}
    >
      MYTH
    </div>
  </AbsoluteFill>
);
