import React from 'react';
import {Brain} from '../../components/Brain';
import {C, FONT_HEAD} from '../../lib/theme';
import {clamp, ease, mix, prog, SBig, SPill, springAt, wobble} from '../kit';
import type {ArtProps} from './Art1';

/* Art for myths #5-#1 (same local stage coordinates as Art1). */
const INK = '#120C33';
const appear = (t: number, a: number, cfg = {}) => springAt(t, a, {damping: 12, stiffness: 170, ...cfg});
const fadeOut = (t: number, a: number, d = 0.35) => 1 - ease.in(prog(t, a, a + d));

/* ------------------------------------------------------------------ */
/* #5 — bulls and red                                                   */
/* ------------------------------------------------------------------ */
const Bull: React.FC<{x: number; y: number; s?: number; t: number; charge?: number}> = ({x, y, s = 1, t, charge = 0}) => {
  const bob = Math.sin(t * (charge > 0.1 ? 22 : 3)) * (charge > 0.1 ? 8 : 4);
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s}) rotate(${charge * 6})`}>
      <ellipse cx={0} cy={150} rx={150} ry={16} fill="#000" opacity={0.25} />
      {[-70, -30, 40, 80].map((lx) => (
        <rect key={lx} x={lx - 14} y={60} width={28} height={84} rx={12} fill="#4A2A1A" stroke={INK} strokeWidth={5} />
      ))}
      <ellipse cx={0} cy={30} rx={130} ry={88} fill="#6B3A22" stroke={INK} strokeWidth={6} />
      <path d="M -126 20 q -40 -10 -40 30" stroke="#6B3A22" strokeWidth={14} fill="none" strokeLinecap="round" />
      <g transform="translate(110 -30)">
        <path d="M -20 -40 Q -70 -90 -60 -130 Q -40 -80 0 -60 Z" fill="#F3EAD7" stroke={INK} strokeWidth={5} />
        <path d="M 60 -40 Q 110 -90 100 -130 Q 80 -80 40 -60 Z" fill="#F3EAD7" stroke={INK} strokeWidth={5} />
        <ellipse cx={20} cy={0} rx={70} ry={64} fill="#7A4428" stroke={INK} strokeWidth={6} />
        <ellipse cx={30} cy={34} rx={44} ry={28} fill="#C98A6A" stroke={INK} strokeWidth={5} />
        <circle cx={16} cy={34} r={7} fill={INK} />
        <circle cx={44} cy={34} r={7} fill={INK} />
        <circle cx={0} cy={-18} r={9} fill="#fff" />
        <circle cx={40} cy={-18} r={9} fill="#fff" />
        <circle cx={2} cy={-16} r={5} fill={INK} />
        <circle cx={42} cy={-16} r={5} fill={INK} />
        <path d={`M -14 ${-34 + charge * 8} L 14 ${-28}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <path d={`M 26 -28 L 54 ${-34 + charge * 8}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        {charge > 0.1 &&
          [0, 1].map((i) => {
            const p = ((t * 2.5 + i * 0.5) % 1 + 1) % 1;
            return <circle key={i} cx={70 + p * 60} cy={40 - p * 30} r={10 + p * 18} fill="#fff" opacity={(1 - p) * 0.6} />;
          })}
      </g>
    </g>
  );
};
const Flag: React.FC<{x: number; y: number; color: string; t: number; wave: number; s?: number}> = ({x, y, color, t, wave, s = 1}) => {
  const w1 = Math.sin(t * 9) * 26 * wave;
  const w2 = Math.sin(t * 9 + 1.4) * 26 * wave;
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${Math.sin(t * 4.5) * 10 * wave})`} opacity={clamp(s * 2)}>
      <rect x={-6} y={-200} width={12} height={240} rx={6} fill="#C9B79C" stroke={INK} strokeWidth={4} />
      <path d={`M 6 -196 Q 60 ${-206 + w1} 120 ${-196 + w2} L 120 ${-96 + w2} Q 60 ${-106 + w1} 6 -96 Z`} fill={color} stroke={INK} strokeWidth={5} />
    </g>
  );
};

export const ArtBulls: React.FC<ArtProps> = ({t, W}) => {
  const a0 = W('myth.') + 1.1;
  const bullS = appear(t, a0, {damping: 11});
  const vision = appear(t, W('colour-blind') - 0.1) * fadeOut(t, W('tested') - 0.3);
  const flags = appear(t, W('tested') - 0.2);
  const charge = ease.in(prog(t, W('moving') - 0.15, W('moving') + 0.7));
  const crowd = appear(t, W('crowd.') - 0.2);
  const bullX = mix(-330, mix(-330, 180, charge), flags > 0.5 ? 1 : 0);
  return (
    <g>
      <Bull x={bullX} y={60} s={bullS * 0.95} t={t} charge={charge} />
      {/* what you see vs what the bull sees */}
      {vision > 0.001 && (
        <g transform={`scale(${vision})`} opacity={clamp(vision * 2)}>
          <g transform="translate(150 20)">
            <Flag x={0} y={60} color="#E8283C" t={t} wave={0.5} />
            <text x={60} y={110} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={28} letterSpacing={2} fill="#fff">
              YOU SEE
            </text>
          </g>
          <g transform="translate(400 20)">
            <Flag x={0} y={60} color="#8E8656" t={t + 0.3} wave={0.5} />
            <text x={60} y={110} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={28} letterSpacing={2} fill={C.yellow}>
              A BULL SEES
            </text>
          </g>
          <SPill x={290} y={-250} text="RED-GREEN COLOUR-BLIND" s={vision} bg={C.yellow} size={30} />
        </g>
      )}
      {/* the test: whichever flag moves */}
      {flags > 0.001 && (
        <g>
          <Flag x={140} y={120} color="#E8283C" t={t} wave={0} s={appear(t, W('red', 4))} />
          <Flag x={320} y={120} color="#3D6BFF" t={t} wave={ease.out(prog(t, W('moving') - 0.6, W('moving') - 0.1))} s={appear(t, W('blue'))} />
          <Flag x={500} y={120} color="#F4F1E8" t={t + 0.7} wave={0} s={appear(t, W('white'))} />
          <SPill x={350} y={-210} text="IT CHARGES WHAT MOVES" s={appear(t, W('moving'))} bg={C.pink} color="#fff" size={30} />
        </g>
      )}
      {crowd > 0.001 && (
        <g transform={`translate(0 ${(1 - crowd) * 80})`} opacity={clamp(crowd * 2)}>
          {Array.from({length: 9}, (_, i) => {
            const cx = -420 + i * 105;
            const jump = Math.abs(Math.sin(t * 6 + i)) * 14;
            return (
              <g key={i} transform={`translate(${cx} ${240 - jump})`}>
                <circle cx={0} cy={-46} r={22} fill={['#F5C49A', '#C98A6A', '#E8B48A'][i % 3]} stroke={INK} strokeWidth={4} />
                <path d="M -30 0 Q 0 -30 30 0 Z" fill={[C.pink, C.cyan, C.yellow][i % 3]} stroke={INK} strokeWidth={4} />
                <path d={`M -20 -14 L -34 ${-60 - jump}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
              </g>
            );
          })}
          <SBig x={0} y={150} text="THE RED IS FOR THE CROWD" s={crowd} size={56} color={C.yellow} />
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* #4 — the Great Wall from space                                       */
/* ------------------------------------------------------------------ */
const Globe: React.FC<{x: number; y: number; r: number; night?: number; t: number}> = ({x, y, r, night = 0, t}) => (
  <g transform={`translate(${x} ${y})`}>
    <defs>
      <radialGradient id={`globe-${r}`} cx="35%" cy="30%" r="80%">
        <stop offset="0" stopColor={night > 0.5 ? '#2B3A8C' : '#7FD3FF'} />
        <stop offset="0.6" stopColor={night > 0.5 ? '#141B4D' : '#2E7BD9'} />
        <stop offset="1" stopColor={night > 0.5 ? '#070A26' : '#1B3E8C'} />
      </radialGradient>
      <clipPath id={`gclip-${r}`}>
        <circle r={r} />
      </clipPath>
    </defs>
    <circle r={r + 10} fill="#7FD3FF" opacity={0.15} />
    <circle r={r} fill={`url(#globe-${r})`} stroke={INK} strokeWidth={5} />
    <g clipPath={`url(#gclip-${r})`} opacity={night > 0.5 ? 0.5 : 1}>
      <path d={`M ${-r * 0.6} ${-r * 0.3} q ${r * 0.3} ${-r * 0.4} ${r * 0.7} ${-r * 0.1} q ${r * 0.2} ${r * 0.3} ${-r * 0.1} ${r * 0.5} q ${-r * 0.4} ${r * 0.1} ${-r * 0.6} ${-r * 0.4} Z`} fill={night > 0.5 ? '#1E2A5E' : '#57C46A'} />
      <path d={`M ${r * 0.2} ${r * 0.2} q ${r * 0.4} ${-r * 0.1} ${r * 0.5} ${r * 0.3} q ${-r * 0.1} ${r * 0.4} ${-r * 0.4} ${r * 0.3} Z`} fill={night > 0.5 ? '#1E2A5E' : '#57C46A'} />
    </g>
    {night > 0.01 &&
      Array.from({length: 46}, (_, i) => {
        const a = i * 2.39996;
        const rr = Math.sqrt((i * 37) % 100) / 10 * r * 0.85;
        const px = Math.cos(a) * rr;
        const py = Math.sin(a) * rr;
        return <circle key={i} cx={px} cy={py} r={2 + (i % 3)} fill="#FFD84D" opacity={night * (0.5 + 0.5 * Math.sin(t * 3 + i))} />;
      })}
  </g>
);

export const ArtWall: React.FC<ArtProps> = ({t, W}) => {
  const a0 = W('myth.') + 1.1;
  const wall = appear(t, a0) * fadeOut(t, W('orbit') - 0.4);
  const width = appear(t, W('metres'));
  const colour = ease.inOut(prog(t, W('colour') - 0.1, W('colour') + 0.5));
  const orbit = appear(t, W('orbit') - 0.3) * fadeOut(t, W('moon') - 0.3);
  const moon = appear(t, W('moon') - 0.2) * fadeOut(t, W('city') - 0.3);
  const hair = appear(t, W('hair...') - 0.1);
  const city = appear(t, W('city') - 0.2);
  const wallPath = 'M -520 60 L -400 10 L -300 70 L -180 0 L -60 80 L 60 20 L 180 90 L 300 30 L 420 100 L 540 40';
  return (
    <g>
      {wall > 0.001 && (
        <g opacity={clamp(wall * 2)} transform={`scale(${0.9 + 0.1 * wall})`}>
          <rect x={-560} y={-170} width={1120} height={420} rx={40} fill={mix(0, 1, colour) > 0.5 ? '#9C8A5E' : '#7FAE5A'} opacity={0.85} />
          <rect x={-560} y={-170} width={1120} height={420} rx={40} fill="#9C8A5E" opacity={colour} />
          <path d={wallPath} stroke={mix(0, 1, colour) > 0.5 ? '#A8966A' : '#E9DFC4'} strokeWidth={7} fill="none" strokeLinejoin="round" />
          <SPill x={0} y={-230} text="THOUSANDS OF KM LONG" s={appear(t, W('long,'))} bg={C.yellow} size={32} />
          {width > 0.001 && (
            <g transform={`translate(180 90) scale(${width})`}>
              <circle r={90} fill="rgba(12,8,40,0.8)" stroke="#fff" strokeWidth={6} />
              <rect x={-80} y={-14} width={160} height={28} fill="#E9DFC4" stroke={INK} strokeWidth={4} />
              <text y={60} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={24} fill="#fff">
                ~6 M WIDE
              </text>
            </g>
          )}
          <SPill x={-260} y={200} text="SAME COLOUR AS THE LAND" s={appear(t, W('colour'))} bg={C.cyan} size={28} />
        </g>
      )}
      {orbit > 0.001 && (
        <g opacity={clamp(orbit * 2)}>
          <Globe x={-150} y={60} r={210} t={t} />
          <ellipse cx={-150} cy={60} rx={290} ry={90} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={4} strokeDasharray="12 12" transform={`rotate(-12 -150 60)`} />
          <g transform={`translate(${-150 + Math.cos(t * 0.9) * 290} ${60 + Math.sin(t * 0.9) * 90})`}>
            <rect x={-30} y={-6} width={60} height={12} fill="#C9D3FF" stroke={INK} strokeWidth={3} />
            <rect x={-8} y={-14} width={16} height={28} fill="#fff" stroke={INK} strokeWidth={3} />
          </g>
          <SPill x={290} y={-60} text="FROM ORBIT: BARELY, IF AT ALL" s={appear(t, W('barely'))} bg={C.yellow} size={28} />
        </g>
      )}
      {moon > 0.001 && (
        <g opacity={clamp(moon * 2)}>
          <Globe x={-430} y={-40} r={60} t={t} />
          <circle cx={430} cy={-40} r={44} fill="#D8D4E8" stroke={INK} strokeWidth={5} />
          <circle cx={418} cy={-52} r={8} fill="#B5B0CC" />
          <circle cx={444} cy={-30} r={6} fill="#B5B0CC" />
          <line x1={-360} y1={-40} x2={380} y2={-40} stroke="rgba(255,255,255,0.5)" strokeWidth={4} strokeDasharray="14 12" />
          <SPill x={0} y={-110} text="384,000 KM" s={moon} bg={C.cyan} size={30} />
          {hair > 0.001 && (
            <g transform={`translate(0 140) scale(${hair})`}>
              <path d={`M -420 0 C -200 -30 200 30 420 0`} stroke="#2A1A0A" strokeWidth={3} fill="none" />
              <path d={`M -420 0 C -200 -30 200 30 420 0`} stroke="#E8D2A8" strokeWidth={1.4} fill="none" />
              <line x1={-420} y1={50} x2={420} y2={50} stroke={C.yellow} strokeWidth={6} />
              <line x1={-420} y1={36} x2={-420} y2={64} stroke={C.yellow} strokeWidth={6} />
              <line x1={420} y1={36} x2={420} y2={64} stroke={C.yellow} strokeWidth={6} />
              <SPill x={0} y={110} text="ONE HAIR, SEEN FROM 3 KM" s={appear(t, W('kilometres'))} bg={C.yellow} size={30} />
            </g>
          )}
        </g>
      )}
      {city > 0.001 && (
        <g opacity={clamp(city * 2)} transform={`scale(${0.9 + 0.1 * city})`}>
          <Globe x={0} y={30} r={240} night={1} t={t} />
          <SPill x={0} y={-270} text="CITY LIGHTS: EASY TO SEE" s={appear(t, W('lights,'))} bg={C.yellow} size={32} />
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* #3 — lightning strikes twice (and twenty times a year)               */
/* ------------------------------------------------------------------ */
const Bolt: React.FC<{x: number; y: number; s?: number; o?: number}> = ({x, y, s = 1, o = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <path d="M 0 0 L -30 90 L 6 86 L -20 190 L 50 60 L 14 64 L 40 0 Z" fill={C.yellow} stroke="#fff" strokeWidth={4} strokeLinejoin="round" />
  </g>
);

export const ArtLightning: React.FC<ArtProps> = ({t, W}) => {
  const a0 = W('myth.') + 1.1;
  const tower = appear(t, a0);
  const strikeStart = W('empire') - 0.2;
  const strikeEnd = W('year.') + 0.6;
  const n = Math.max(0, Math.floor(prog(t, strikeStart, strikeEnd) * 20));
  const phase = ((t - strikeStart) * 20 / Math.max(0.5, strikeEnd - strikeStart)) % 1;
  const flash = t > strikeStart && t < strikeEnd ? (phase < 0.35 ? 1 - phase / 0.35 : 0) : 0;
  const ranger = appear(t, W('roy') - 0.2);
  const tally = (i: number) => appear(t, W('seven') + i * 0.11, {damping: 9, stiffness: 260});
  const survived = appear(t, W('survived'), {damping: 9});
  return (
    <g>
      <g transform={`translate(-230 0) scale(${tower})`} opacity={clamp(tower * 2)}>
        {/* storm cloud */}
        <g transform="translate(0 -250)">
          {[[-90, 10, 70], [-20, -20, 90], [70, 0, 75], [130, 20, 55]].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="#3A3570" />
          ))}
        </g>
        {/* art-deco tower */}
        <path d="M -20 -150 L -6 -210 L 6 -210 L 20 -150 Z" fill="#B8B3D6" stroke={INK} strokeWidth={4} />
        <path d="M -50 -150 L 50 -150 L 60 -60 L -60 -60 Z" fill="#9C96C8" stroke={INK} strokeWidth={5} />
        <path d="M -90 -60 L 90 -60 L 100 300 L -100 300 Z" fill="#8781BA" stroke={INK} strokeWidth={6} />
        {Array.from({length: 8}, (_, i) => (
          <g key={i}>
            <rect x={-70} y={-40 + i * 40} width={28} height={18} fill="#FFE58A" opacity={0.6 + 0.4 * Math.sin(i + t)} />
            <rect x={-14} y={-40 + i * 40} width={28} height={18} fill="#FFE58A" opacity={0.6 + 0.4 * Math.sin(i * 2 + t)} />
            <rect x={42} y={-40 + i * 40} width={28} height={18} fill="#FFE58A" opacity={0.6 + 0.4 * Math.sin(i * 3 + t)} />
          </g>
        ))}
        {flash > 0 && <Bolt x={10} y={-410} s={1.05} o={flash} />}
        {flash > 0 && <circle cx={0} cy={-210} r={60} fill={C.yellow} opacity={flash * 0.5} />}
      </g>
      <SBig x={250} y={-170} text={`×${n} THIS YEAR`} s={appear(t, W('twenty')) * fadeOut(t, W('roy') - 0.3)} size={70} color={C.yellow} rot={-4} />
      {ranger > 0.001 && (
        <g transform={`translate(270 -40) scale(${ranger})`} opacity={clamp(ranger * 2)}>
          {/* ranger hat */}
          <ellipse cx={0} cy={40} rx={170} ry={34} fill="#8A6A3A" stroke={INK} strokeWidth={6} />
          <path d="M -80 40 L -60 -60 Q 0 -100 60 -60 L 80 40 Z" fill="#A9864E" stroke={INK} strokeWidth={6} />
          <path d="M -40 -64 L 0 -40 L 40 -64" stroke={INK} strokeWidth={6} fill="none" />
          <rect x={-80} y={14} width={160} height={20} fill="#5C4424" />
          <text y={130} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={30} letterSpacing={2} fill="#fff">
            ROY SULLIVAN, PARK RANGER
          </text>
          {Array.from({length: 7}, (_, i) => (
            <Bolt key={i} x={-210 + i * 64} y={170} s={0.42 * tally(i)} />
          ))}
          {survived > 0.001 && (
            <g transform={`translate(0 330) scale(${survived})`}>
              <rect x={-170} y={-34} width={340} height={68} rx={34} fill={C.lime} />
              <text y={12} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={32} fill={INK}>
                SURVIVED ALL 7
              </text>
            </g>
          )}
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* #2 — 10% of your brain                                               */
/* ------------------------------------------------------------------ */
export const ArtBrain: React.FC<ArtProps> = ({t, W}) => {
  const a0 = W('myth.') + 1.1;
  const brainS = appear(t, a0, {damping: 11});
  const active = ease.out(prog(t, W('scans') - 0.1, W('scans') + 0.8));
  const sleep = appear(t, W('sleep.') - 0.1) * fadeOut(t, W('expensive.') - 0.2);
  const bars = ease.out(prog(t, W('two', 2) - 0.2, W('twenty') + 0.6));
  const barsS = appear(t, W('expensive.') - 0.1);
  const ninety = appear(t, W('ninety'), {damping: 8});
  const shrink = ease.inOut(prog(t, W('expensive.') - 0.3, W('expensive.') + 0.3));
  return (
    <g>
      <g transform={`translate(${mix(0, -300, shrink)} ${mix(0, -20, shrink)}) scale(${mix(1, 0.7, shrink)})`}>
        <Brain x={0} y={0} scale={0.9 * brainS} t={t} id="lfbrain" />
        {active > 0.01 &&
          Array.from({length: 30}, (_, i) => {
            const a = i * 2.39996;
            const rr = Math.sqrt(((i * 31) % 100) / 100);
            const px = Math.cos(a) * rr * 240 - 10;
            const py = Math.sin(a) * rr * 150 - 40;
            const pulse = 0.5 + 0.5 * Math.sin(t * (sleep > 0.5 ? 2 : 5) + i * 1.7);
            return <circle key={i} cx={px} cy={py} r={(10 + pulse * 10) * active} fill={i % 2 ? C.cyan : C.yellow} opacity={(0.35 + 0.55 * pulse) * active} />;
          })}
        {sleep > 0.001 && (
          <g transform={`translate(260 -200) scale(${sleep})`}>
            <path d="M 0 -50 A 50 50 0 1 0 40 30 A 40 40 0 1 1 0 -50 Z" fill={C.yellow} stroke={INK} strokeWidth={5} />
            <text x={60} y={-40} fontFamily={FONT_HEAD} fontWeight={800} fontSize={36} fill="#fff">
              z z z
            </text>
          </g>
        )}
      </g>
      <SPill x={0} y={-280} text="ACTIVE ALL OVER, EVEN ASLEEP" s={appear(t, W('scans') + 0.3) * (1 - shrink)} bg={C.cyan} size={30} />
      {barsS > 0.001 && (
        <g transform={`translate(80 -110) scale(${barsS})`} opacity={clamp(barsS * 2)}>
          <text x={0} y={-20} fontFamily={FONT_HEAD} fontWeight={800} fontSize={28} letterSpacing={2} fill="#fff">
            BODY WEIGHT
          </text>
          <rect x={0} y={0} width={440} height={56} rx={28} fill="rgba(255,255,255,0.1)" />
          <rect x={0} y={0} width={Math.max(56, 440 * 0.02 * 5 * bars)} height={56} rx={28} fill={C.cyan} />
          <text x={460} y={40} fontFamily={FONT_HEAD} fontWeight={800} fontSize={40} fill={C.cyan}>
            2%
          </text>
          <text x={0} y={130} fontFamily={FONT_HEAD} fontWeight={800} fontSize={28} letterSpacing={2} fill="#fff">
            ENERGY USED
          </text>
          <rect x={0} y={150} width={440} height={56} rx={28} fill="rgba(255,255,255,0.1)" />
          <rect x={0} y={150} width={Math.max(56, 440 * ease.out(prog(t, W('twenty') - 0.1, W('twenty') + 0.7)))} height={56} rx={28} fill={C.pink} />
          <text x={460} y={190} fontFamily={FONT_HEAD} fontWeight={800} fontSize={40} fill={C.pink}>
            20%
          </text>
        </g>
      )}
      {ninety > 0.001 && (
        <g transform={`translate(300 230) scale(${ninety}) rotate(-5)`}>
          <text textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={56} fill="#fff" stroke={INK} strokeWidth={10} paintOrder="stroke">
            90% USELESS?
          </text>
          <line x1={-200} y1={-16} x2={200} y2={-16} stroke={C.red} strokeWidth={12} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* #1 — seasons                                                         */
/* ------------------------------------------------------------------ */
const Sun: React.FC<{x: number; y: number; r: number; t: number}> = ({x, y, r, t}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r * 1.8} fill={C.yellow} opacity={0.12} />
    <circle r={r * 1.35} fill={C.orange} opacity={0.2} />
    {Array.from({length: 12}, (_, i) => (
      <line key={i} x1={0} y1={-r * 1.15} x2={0} y2={-r * 1.45} stroke={C.yellow} strokeWidth={8} strokeLinecap="round" transform={`rotate(${i * 30 + t * 10})`} />
    ))}
    <circle r={r} fill="#FFD84D" stroke="#FF8A2A" strokeWidth={6} />
  </g>
);
const TiltedEarth: React.FC<{x: number; y: number; r: number; tilt: number; north?: string; south?: string; northColor?: string; southColor?: string; labels?: number}> = ({
  x,
  y,
  r,
  tilt,
  north,
  south,
  northColor = C.orange,
  southColor = C.cyan,
  labels = 1,
}) => (
  <g transform={`translate(${x} ${y})`}>
    <g transform={`rotate(${tilt})`}>
      <line x1={0} y1={-r * 1.45} x2={0} y2={r * 1.45} stroke="#fff" strokeWidth={6} strokeDasharray="14 10" />
      <circle r={r} fill="#2E7BD9" stroke={INK} strokeWidth={6} />
      <path d={`M ${-r} 0 L ${r} 0`} stroke="rgba(255,255,255,0.5)" strokeWidth={4} />
      <path d={`M ${-r * 0.7} ${-r * 0.4} q ${r * 0.4} ${-r * 0.5} ${r * 0.9} ${-r * 0.15} q ${r * 0.1} ${r * 0.35} ${-r * 0.3} ${r * 0.4} Z`} fill="#57C46A" />
      <path d={`M ${r * 0.15} ${r * 0.25} q ${r * 0.45} ${-r * 0.05} ${r * 0.5} ${r * 0.35} q ${-r * 0.2} ${r * 0.35} ${-r * 0.45} ${r * 0.2} Z`} fill="#57C46A" />
    </g>
    {labels > 0.01 && north && (
      <g opacity={labels}>
        <rect x={-r * 0.9} y={-r - 70} width={r * 1.8} height={56} rx={28} fill={northColor} />
        <text x={0} y={-r - 32} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={28} fill={INK}>
          {north}
        </text>
      </g>
    )}
    {labels > 0.01 && south && (
      <g opacity={labels}>
        <rect x={-r * 0.9} y={r + 14} width={r * 1.8} height={56} rx={28} fill={southColor} />
        <text x={0} y={r + 52} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={28} fill={INK}>
          {south}
        </text>
      </g>
    )}
  </g>
);

export const ArtSeasons: React.FC<ArtProps> = ({t, W}) => {
  const a0 = W('myth.') + 1.1;
  const orbit = appear(t, a0) * fadeOut(t, W('tilt.') - 0.3);
  const ang = mix(-2.4, -3.1, ease.inOut(prog(t, a0, W('closest') + 0.3)));
  const tilt = appear(t, W('tilt.') - 0.2);
  const tiltDeg = mix(0, 23.4, ease.inOut(prog(t, W('leans') - 0.2, W('twenty-three') + 0.4)));
  const rays = ease.out(prog(t, W('directly,') - 0.4, W('directly,') + 0.3));
  const final = ease.inOut(prog(t, W('summer', 3) - 0.3, W('summer', 3) + 0.3));
  const aus = appear(t, W('australia.') - 0.1);
  return (
    <g>
      {orbit > 0.001 && (
        <g opacity={clamp(orbit * 2)} transform={`scale(${0.9 + 0.1 * orbit})`}>
          <Sun x={-120} y={40} r={90} t={t} />
          <ellipse cx={0} cy={40} rx={420} ry={210} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={4} strokeDasharray="12 12" />
          <g transform={`translate(${Math.cos(ang) * 420} ${40 + Math.sin(ang) * 210})`}>
            <circle r={46} fill="#2E7BD9" stroke={INK} strokeWidth={5} />
            <path d="M -30 -20 q 20 -24 50 -8 q 4 18 -16 22 Z" fill="#57C46A" />
            <text x={0} y={-62} textAnchor="middle" fontSize={38}>
              ❄️
            </text>
          </g>
          <SPill x={-330} y={-230} text="CLOSEST TO THE SUN: EARLY JANUARY" s={appear(t, W('closest'))} bg={C.yellow} size={28} />
          <SPill x={-330} y={290} text="…WINTER IN THE NORTH" s={appear(t, W('winter'))} bg={C.cyan} size={28} />
        </g>
      )}
      {tilt > 0.001 && (
        <g opacity={clamp(tilt * 2)}>
          <Sun x={-470} y={20} r={70} t={t} />
          {/* sunlight: direct on the half that leans in, slanted on the other */}
          {rays > 0.01 &&
            Array.from({length: 7}, (_, i) => {
              const yy = -170 + i * 58;
              return <line key={i} x1={-380} y1={yy} x2={mix(-380, 60, rays)} y2={yy} stroke={C.yellow} strokeWidth={10} strokeLinecap="round" opacity={0.75} />;
            })}
          <TiltedEarth
            x={170}
            y={20}
            r={190}
            tilt={-tiltDeg}
            north={final > 0.5 ? 'NORTH: SUMMER ☀️' : rays > 0.5 ? 'TILTED IN: DIRECT LIGHT' : undefined}
            south={final > 0.5 ? 'SOUTH: WINTER ❄️' : rays > 0.5 ? 'TILTED AWAY: SLANTED' : undefined}
            labels={Math.max(rays, final)}
          />
          <SBig x={450} y={-120} text={`${tiltDeg.toFixed(1)}°`} s={appear(t, W('leans'))} size={70} color={C.yellow} />
          <SPill x={-60} y={-290} text="IT'S THE TILT" s={appear(t, W('tilt.'))} bg={C.pink} color="#fff" size={32} />
          <SPill x={170} y={300} text="+ LONGER DAYS" s={appear(t, W('longer.')) * fadeOut(t, W('summer', 3) - 0.4)} bg={C.lime} size={28} />
          {aus > 0.001 && (
            <g transform={`translate(260 150) scale(${aus})`}>
              <path d="M 0 0 C -20 -30 -20 -60 0 -70 C 20 -60 20 -30 0 0 Z" fill={C.red} stroke="#fff" strokeWidth={4} />
              <circle cx={0} cy={-48} r={9} fill="#fff" />
              <SPill x={140} y={-40} text="AUSTRALIA" s={1} bg={C.yellow} size={26} />
            </g>
          )}
        </g>
      )}
    </g>
  );
};

export {wobble};
