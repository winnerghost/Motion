import React from 'react';
import {Trophy} from '../../components/Wombat';
import {C, FONT_HEAD} from '../../lib/theme';
import {clamp, ease, mix, prog, SBig, SPill, springAt, wobble} from '../kit';

/* Art for myths #10-#6. Local stage coords: origin at the stage centre,
 * roughly x -560..560, y -330..300. Each gets local time t and W(word). */
export type ArtProps = {t: number; W: (word: string, nth?: number, edge?: 'start' | 'end') => number};
const INK = '#120C33';

const appear = (t: number, a: number, cfg = {}) => springAt(t, a, {damping: 12, stiffness: 170, ...cfg});
const fadeOut = (t: number, a: number, d = 0.35) => 1 - ease.in(prog(t, a, a + d));

/** Rising heat squiggles. */
const Heat: React.FC<{x: number; y: number; t: number; o: number; n?: number; spread?: number}> = ({x, y, t, o, n = 3, spread = 46}) =>
  o > 0.01 ? (
    <g opacity={o}>
      {Array.from({length: n}, (_, i) => {
        const p = ((t * 0.9 + i / n) % 1 + 1) % 1;
        const dx = (i - (n - 1) / 2) * spread;
        return (
          <path
            key={i}
            d={`M ${x + dx} ${y - p * 120} q 14 -18 0 -36 q -14 -18 0 -36`}
            stroke={C.orange}
            strokeWidth={9 * (1 - p * 0.6)}
            fill="none"
            strokeLinecap="round"
            opacity={(1 - p) * 0.9}
          />
        );
      })}
    </g>
  ) : null;

/* ------------------------------------------------------------------ */
/* #10 — heat through your head                                         */
/* ------------------------------------------------------------------ */
export const ArtHead: React.FC<ArtProps> = ({t, W}) => {
  const a0 = W('myth.') + 1.2;
  const fig = appear(t, a0);
  const donut = ease.out(prog(t, W('skin') - 0.2, W('skin') + 0.6));
  const donutS = appear(t, W('only'));
  const suit = ease.inOut(prog(t, W('arctic') - 0.1, W('arctic') + 0.6));
  const armyS = appear(t, W('army'));
  const hat = ease.in(prog(t, W('hat.') - 0.35, W('hat.')));
  const hatLand = appear(t, W('hat.'), {damping: 7, stiffness: 260});
  const tenS = appear(t, W('percent', 3));
  const FX = -230;
  const FY = 40;
  return (
    <g opacity={clamp(fig * 2)} transform={`translate(0 ${(1 - fig) * 40})`}>
      <defs>
        <radialGradient id="thermal" cx="50%" cy="40%" r="70%">
          <stop offset="0" stopColor="#FFE14D" />
          <stop offset="0.45" stopColor="#FF8A2A" />
          <stop offset="1" stopColor="#C2187E" />
        </radialGradient>
      </defs>
      {/* thermal person */}
      <g transform={`translate(${FX} ${FY})`}>
        <ellipse cx={0} cy={270} rx={150} ry={20} fill="#000" opacity={0.25} />
        <circle cx={0} cy={-180} r={62} fill="url(#thermal)" />
        <path d="M -95 -95 Q 0 -125 95 -95 L 110 80 Q 0 100 -110 80 Z" fill="url(#thermal)" />
        <path d="M -95 -90 L -150 60 M 95 -90 L 150 60" stroke="url(#thermal)" strokeWidth={42} strokeLinecap="round" />
        <path d="M -55 85 L -60 250 M 55 85 L 60 250" stroke="url(#thermal)" strokeWidth={50} strokeLinecap="round" />
        {/* arctic suit */}
        {suit > 0.01 && (
          <g opacity={suit}>
            <clipPath id="suitclip">
              <rect x={-200} y={mix(300, -125, suit)} width={400} height={500} />
            </clipPath>
            <g clipPath="url(#suitclip)">
              <path d="M -110 -105 Q 0 -140 110 -105 L 128 95 Q 0 118 -128 95 Z" fill="#2E2A6E" stroke={INK} strokeWidth={6} />
              <path d="M -108 -98 L -170 70 M 108 -98 L 170 70" stroke="#2E2A6E" strokeWidth={62} strokeLinecap="round" />
              <path d="M -62 90 L -66 262 M 62 90 L 66 262" stroke="#2E2A6E" strokeWidth={66} strokeLinecap="round" />
              {[-60, -10, 40].map((yy) => (
                <path key={yy} d={`M -118 ${yy} Q 0 ${yy + 14} 118 ${yy}`} stroke="#4C46A8" strokeWidth={5} fill="none" />
              ))}
              <rect x={-112} y={-112} width={224} height={26} rx={13} fill="#E8E4FF" opacity={0.85} />
            </g>
          </g>
        )}
        {/* beanie */}
        {hat > 0.001 && (
          <g transform={`translate(0 ${mix(-420, 0, hat) + (1 - hatLand) * 0})`}>
            <path d="M -66 -196 Q -70 -268 0 -270 Q 70 -268 66 -196 Z" fill={C.pink} stroke={INK} strokeWidth={6} />
            <rect x={-72} y={-206} width={144} height={30} rx={14} fill="#FF8DB8" stroke={INK} strokeWidth={6} />
            <circle cx={0} cy={-276} r={18} fill="#FFD84D" stroke={INK} strokeWidth={5} />
          </g>
        )}
        {/* heat leaving: everywhere before the suit, only the head after */}
        <Heat x={0} y={-250} t={t} o={fig * (1 - hat * (t > W('hat.') ? 1 : 0))} n={3} spread={40} />
        <Heat x={-130} y={-20} t={t + 0.3} o={fig * (1 - suit)} n={2} spread={50} />
        <Heat x={130} y={-20} t={t + 0.6} o={fig * (1 - suit)} n={2} spread={50} />
        <Heat x={0} y={40} t={t + 0.15} o={fig * (1 - suit)} n={3} spread={60} />
      </g>
      {/* donut: head = ~10% of the skin */}
      {donutS > 0.001 && (
        <g transform={`translate(230 -40) scale(${donutS})`} opacity={clamp(donutS * 2) * (1 - suit * 0.75)}>
          <circle r={120} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={46} />
          <circle r={120} fill="none" stroke={C.orange} strokeWidth={46} strokeDasharray={`${2 * Math.PI * 120 * 0.1 * donut} 2000`} transform="rotate(-90)" strokeLinecap="round" />
          <text y={22} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={74} fill="#fff">
            {Math.round(10 * donut)}%
          </text>
          <text y={200} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={30} letterSpacing={2} fill="rgba(255,255,255,0.85)">
            OF YOUR SKIN = YOUR HEAD
          </text>
        </g>
      )}
      <SPill x={240} y={-200} text="ARMY TEST: ONLY THE HEAD UNCOVERED" s={armyS * (1 - hat)} bg={C.cyan} size={28} />
      <SBig x={250} y={120} text="10% IS 10%" s={tenS} size={84} rot={-4} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* #9 — hair and nails after death                                      */
/* ------------------------------------------------------------------ */
export const ArtNails: React.FC<ArtProps> = ({t, W}) => {
  const a0 = W('myth.') + 1.2;
  const batt = appear(t, a0);
  const drain = ease.inOut(prog(t, W('energy,') - 0.2, W('alive.') + 0.2));
  const xS = appear(t, W('alive.') + 0.1, {damping: 9});
  const finger = appear(t, W('sneakier.') - 0.4);
  const shrink = ease.inOut(prog(t, W('skin') - 0.1, W('back.') + 0.3));
  const longS = appear(t, W('longer...'));
  const smallS = appear(t, W('smaller.'));
  const level = 1 - drain;
  // finger geometry (vertical, nail on top)
  const cut = mix(40, 96, shrink); // cuticle line (y)
  const pad = mix(0, 14, shrink); // flesh recedes from the sides
  return (
    <g>
      {/* battery: growing needs energy */}
      <g transform={`translate(-300 -10) scale(${batt})`} opacity={clamp(batt * 2) * (1 - finger * 0.6)}>
        <rect x={-80} y={-150} width={160} height={290} rx={26} fill="rgba(255,255,255,0.06)" stroke="#fff" strokeWidth={10} />
        <rect x={-34} y={-176} width={68} height={28} rx={8} fill="#fff" />
        <rect x={-62} y={-132 + 254 * (1 - level)} width={124} height={254 * level} rx={14} fill={level > 0.3 ? C.lime : C.red} />
        <text y={210} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={30} letterSpacing={2} fill="#fff">
          GROWING = ENERGY
        </text>
        {xS > 0.001 && (
          <g transform={`scale(${xS})`}>
            <path d="M -90 -90 L 90 90 M 90 -90 L -90 90" stroke={C.red} strokeWidth={26} strokeLinecap="round" />
          </g>
        )}
      </g>
      {/* fingertip: the skin pulls back, the nail looks longer */}
      <g transform={`translate(200 40) scale(${0.85 + 0.15 * finger})`} opacity={clamp(finger * 2)}>
        <defs>
          <linearGradient id="skin9" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#D9925E" />
            <stop offset="0.5" stopColor="#F5C49A" />
            <stop offset="1" stopColor="#D9925E" />
          </linearGradient>
        </defs>
        <path d={`M ${-92 + pad} 300 L ${-92 + pad} ${40 + pad} Q ${-92 + pad} ${-70 + pad * 2} 0 ${-78 + pad * 2} Q ${92 - pad} ${-70 + pad * 2} ${92 - pad} ${40 + pad} L ${92 - pad} 300 Z`} fill="url(#skin9)" stroke={INK} strokeWidth={6} />
        {/* nail plate (stays the same) */}
        <path d={`M -66 ${cut} L -70 -40 Q 0 -118 70 -40 L 66 ${cut} Q 0 ${cut + 12} -66 ${cut} Z`} fill="#FFE3E8" stroke={INK} strokeWidth={6} opacity={0.96} />
        <path d="M -70 -40 Q 0 -118 70 -40" stroke="#fff" strokeWidth={10} fill="none" opacity={0.8} />
        {/* cuticle fold */}
        <path d={`M -74 ${cut + 4} Q 0 ${cut + 22} 74 ${cut + 4}`} stroke="#B86B3E" strokeWidth={10} fill="none" strokeLinecap="round" />
        {/* measuring bracket */}
        <g opacity={longS}>
          <path d={`M 120 -88 L 150 -88 L 150 ${cut + 8} L 120 ${cut + 8}`} stroke={C.yellow} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
      <SPill x={200} y={-260} text="THE SKIN PULLS BACK" s={appear(t, W('pulls'))} bg={C.cyan} size={32} />
      <SPill x={470} y={-40} text="LOOKS LONGER" s={longS} bg={C.yellow} size={28} rot={6} />
      <SPill x={-300} y={-250} text="NO LIFE, NO GROWING" s={smallS * 0 + xS * fadeOut(t, W('sneakier.') - 0.2)} bg={C.red} color="#fff" size={28} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* #8 — bats are blind                                                  */
/* ------------------------------------------------------------------ */
const Bat: React.FC<{x: number; y: number; s?: number; t: number; fruit?: number}> = ({x, y, s = 1, t, fruit = 0}) => {
  const flap = Math.sin(t * 7) * 0.5 + 0.5;
  const body = fruit > 0.5 ? '#7A4A2A' : '#3B2E7A';
  const wing = fruit > 0.5 ? '#5C341C' : '#2A2160';
  return (
    <g transform={`translate(${x} ${y + Math.sin(t * 3.5) * 10}) scale(${s})`}>
      {[-1, 1].map((side) => (
        <path
          key={side}
          transform={`scale(${side} 1) rotate(${-10 + flap * 25})`}
          d="M 40 -10 C 120 -110 230 -100 290 -40 C 250 -40 240 -10 210 10 C 190 -10 160 -10 140 20 C 120 0 90 0 70 30 Z"
          fill={wing}
          stroke={INK}
          strokeWidth={6}
          strokeLinejoin="round"
        />
      ))}
      <ellipse cx={0} cy={10} rx={78} ry={92} fill={body} stroke={INK} strokeWidth={6} />
      {/* ears */}
      <path d={`M -50 -60 L ${-64 + fruit * 10} ${-150 + fruit * 50} L -12 -78 Z`} fill={body} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M 50 -60 L ${64 - fruit * 10} ${-150 + fruit * 50} L 12 -78 Z`} fill={body} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {/* snout grows for the fruit bat */}
      {fruit > 0.01 && <ellipse cx={0} cy={44} rx={30 * fruit} ry={24 * fruit} fill="#9C6640" stroke={INK} strokeWidth={5} />}
      {fruit > 0.01 && <circle cx={0} cy={36} r={7 * fruit} fill={INK} />}
      {/* eyes: big and shiny — bats can see */}
      {[-30, 30].map((ex) => (
        <g key={ex}>
          <ellipse cx={ex} cy={-12} rx={22 + fruit * 8} ry={26 + fruit * 8} fill="#fff" />
          <circle cx={ex + 3} cy={-8} r={14 + fruit * 5} fill={INK} />
          <circle cx={ex - 3} cy={-16} r={6} fill="#fff" />
        </g>
      ))}
      <path d="M -14 66 Q 0 76 14 66" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M -10 64 L -6 74 L -2 64 M 2 64 L 6 74 L 10 64" fill="#fff" />
    </g>
  );
};

export const ArtBats: React.FC<ArtProps> = ({t, W}) => {
  const a0 = W('myth.') + 1.1;
  const batS = appear(t, a0, {damping: 10});
  const seeS = appear(t, W('see.') + 0.1) * fadeOut(t, W('echolocation:') - 0.2);
  const echo = ease.out(prog(t, W('echolocation:') - 0.2, W('echolocation:') + 0.3));
  const shout = t > W('shout,') - 0.1;
  const back = t > W('echoes') - 0.1;
  const fruit = ease.inOut(prog(t, W('fruit') - 0.2, W('fruit') + 0.5));
  const mango = appear(t, W('nose.') - 0.3);
  const batX = mix(-230, -120, fruit);
  return (
    <g>
      <Bat x={batX} y={-10} s={batS * 0.95} t={t} fruit={fruit} />
      {/* eye icon: they can see */}
      <SPill x={batX} y={-250} text="EVERY BAT CAN SEE" s={seeS} bg={C.lime} size={32} />
      {/* echolocation: shout out, echoes back */}
      {echo > 0.01 && fruit < 0.99 && (
        <g opacity={echo * (1 - fruit)}>
          <g transform={`translate(280 -30) rotate(${wobble(t, 2, 'moth') * 10})`}>
            <ellipse cx={0} cy={0} rx={18} ry={30} fill="#D9CBA3" stroke={INK} strokeWidth={4} />
            <path d="M 0 -6 C -60 -60 -70 10 -6 12 M 0 -6 C 60 -60 70 10 6 12" fill="#EDE3C4" stroke={INK} strokeWidth={4} />
          </g>
          {shout &&
            Array.from({length: 4}, (_, i) => {
              const p = ((t * 1.1 + i / 4) % 1 + 1) % 1;
              return <path key={`o${i}`} d={`M ${-60 + p * 300} -80 q 30 50 0 100`} stroke={C.pink} strokeWidth={9 * (1 - p * 0.5)} fill="none" opacity={1 - p} strokeLinecap="round" />;
            })}
          {back &&
            Array.from({length: 3}, (_, i) => {
              const p = ((t * 1.1 + 0.5 + i / 3) % 1 + 1) % 1;
              return <path key={`b${i}`} d={`M ${250 - p * 280} -60 q -24 40 0 80`} stroke={C.cyan} strokeWidth={7 * (1 - p * 0.5)} fill="none" opacity={(1 - p) * 0.9} strokeLinecap="round" />;
            })}
          <SPill x={60} y={-220} text="SHOUT" s={appear(t, W('shout,'))} bg={C.pink} color="#fff" size={30} />
          <SPill x={170} y={130} text="ECHO" s={appear(t, W('echoes'))} bg={C.cyan} size={30} />
        </g>
      )}
      {/* fruit bat: eyes and nose */}
      {mango > 0.001 && (
        <g transform={`translate(230 60) scale(${mango})`}>
          <ellipse cx={0} cy={0} rx={80} ry={62} fill="#FFB43D" stroke={INK} strokeWidth={6} transform="rotate(-20)" />
          <ellipse cx={-24} cy={-20} rx={24} ry={12} fill="#fff" opacity={0.4} transform="rotate(-20)" />
          <path d="M 40 -50 q 10 -30 40 -34" stroke="#3E8E2E" strokeWidth={10} fill="none" strokeLinecap="round" />
          {Array.from({length: 3}, (_, i) => {
            const p = ((t * 1.3 + i / 3) % 1 + 1) % 1;
            return <path key={i} d={`M ${-100 - p * 90} ${-10 + i * 18} q -10 -8 -20 0`} stroke="#fff" strokeWidth={5} fill="none" opacity={(1 - p) * 0.7} />;
          })}
        </g>
      )}
      <SPill x={130} y={-230} text="FRUIT BATS: BIG EYES + GREAT NOSE" s={appear(t, W('eyes'))} bg={C.yellow} size={28} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* #7 — sugar makes kids hyper                                          */
/* ------------------------------------------------------------------ */
const Kid: React.FC<{x: number; y: number; s?: number; t: number; bounce?: number; color?: string}> = ({x, y, s = 1, t, bounce = 0, color = '#8C7DFF'}) => (
  <g transform={`translate(${x} ${y - Math.abs(Math.sin(t * 6)) * 18 * bounce}) scale(${s})`}>
    <circle cx={0} cy={-120} r={42} fill="#F5C49A" stroke={INK} strokeWidth={5} />
    <circle cx={-14} cy={-124} r={6} fill={INK} />
    <circle cx={14} cy={-124} r={6} fill={INK} />
    <path d="M -12 -104 Q 0 -96 12 -104" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
    <path d="M -44 -70 Q 0 -86 44 -70 L 40 30 L -40 30 Z" fill={color} stroke={INK} strokeWidth={5} />
    <path d="M -24 30 L -26 92 M 24 30 L 26 92" stroke={INK} strokeWidth={14} strokeLinecap="round" />
  </g>
);
const Cup: React.FC<{x: number; y: number; label: string; color: string; s?: number}> = ({x, y, label, color, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={clamp(s * 2)}>
    <path d="M -50 -60 L 50 -60 L 40 60 L -40 60 Z" fill="#fff" stroke={INK} strokeWidth={6} />
    <rect x={-48} y={-20} width={96} height={30} fill={color} />
    <text y={110} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={30} letterSpacing={2} fill={color}>
      {label}
    </text>
  </g>
);

export const ArtSugar: React.FC<ArtProps> = ({t, W}) => {
  const a0 = W('myth.') + 1.1;
  const cups = appear(t, W('kids', 2) - 0.2);
  const cup1 = appear(t, W('sugar', 2));
  const cup2 = appear(t, W('fake.'));
  const same = appear(t, W('same.'));
  const parentS = appear(t, W('told') - 0.2);
  const bubble = appear(t, W('sugar', 3) - 0.1);
  const rated = ease.out(prog(t, W('rated'), W('hyper', 2) + 0.2));
  const heads = appear(t, W('heads.'));
  const shift = ease.inOut(prog(t, W('told') - 0.5, W('told')));
  const meter = (x: number, y: number, v: number, color: string) => (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-60} y={-14} width={120} height={28} rx={14} fill="rgba(255,255,255,0.12)" />
      <rect x={-60} y={-14} width={120 * v} height={28} rx={14} fill={color} />
    </g>
  );
  const kidEnergy = 0.5 + 0.06 * Math.sin(t * 5);
  return (
    <g opacity={clamp(appear(t, a0) * 2)}>
      <g transform={`translate(${mix(0, -220, shift)} 0) scale(${mix(1, 0.8, shift)})`}>
        <Kid x={-170} y={-10} t={t} bounce={cups * 0.4} color={C.pink} s={cups * 1.25} />
        <Kid x={150} y={-10} t={t + 0.4} bounce={cups * 0.4} color={C.cyan} s={cups * 1.25} />
        <Cup x={-170} y={150} label="SUGAR" color={C.pink} s={cup1} />
        <Cup x={150} y={150} label="FAKE" color={C.cyan} s={cup2} />
        {cups > 0.3 && meter(-170, -250, kidEnergy * cups, C.pink)}
        {cups > 0.3 && meter(150, -250, kidEnergy * cups, C.cyan)}
        <SPill x={-10} y={-300} text="SAME BEHAVIOUR" s={same * (1 - shift)} bg={C.lime} size={30} />
      </g>
      {/* the parent who was told "sugar" */}
      {parentS > 0.001 && (
        <g transform={`translate(260 40) scale(${parentS})`}>
          <circle cx={0} cy={-170} r={52} fill="#E8B48A" stroke={INK} strokeWidth={5} />
          <circle cx={-18} cy={-174} r={7} fill={INK} />
          <circle cx={18} cy={-174} r={7} fill={INK} />
          <path d={`M -16 ${-146 + rated * 4} Q 0 ${-138 - rated * 10} 16 ${-146 + rated * 4}`} stroke={INK} strokeWidth={5} fill="none" />
          <path d="M -70 -110 Q 0 -130 70 -110 L 64 110 L -64 110 Z" fill="#5B52B8" stroke={INK} strokeWidth={5} />
          {/* clipboard rating */}
          <g transform="translate(90 -10) rotate(8)">
            <rect x={-56} y={-80} width={112} height={150} rx={12} fill="#fff" stroke={INK} strokeWidth={5} />
            <text y={-46} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={20} fill={INK}>
              HYPER?
            </text>
            <rect x={-36} y={-30} width={72} height={86} rx={8} fill="#EEE" />
            <rect x={-36} y={56 - 86 * rated} width={72} height={86 * rated} rx={8} fill={C.red} />
          </g>
          {bubble > 0.001 && (
            <g transform={`translate(-150 -300) scale(${bubble})`}>
              <ellipse cx={0} cy={0} rx={120} ry={60} fill="#fff" stroke={INK} strokeWidth={5} />
              <circle cx={70} cy={70} r={14} fill="#fff" stroke={INK} strokeWidth={4} />
              <circle cx={96} cy={100} r={8} fill="#fff" stroke={INK} strokeWidth={4} />
              <text y={14} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={40} fill={C.pink}>
                {heads > 0.5 ? 'SUGAR RUSH?' : 'SUGAR!'}
              </text>
            </g>
          )}
        </g>
      )}
      <SPill x={-230} y={250} text="IT WAS THE FAKE" s={appear(t, W('actually')) * fadeOut(t, W('heads.') + 0.8)} bg={C.cyan} size={28} />
      <SBig x={260} y={250} text="IT'S IN THEIR HEADS" s={heads} size={56} color={C.pink} rot={-3} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* #6 — cracking knuckles                                               */
/* ------------------------------------------------------------------ */
const Hand: React.FC<{x: number; y: number; flip?: boolean; s?: number; label: string; color: string; ok?: number}> = ({x, y, flip = false, s = 1, label, color, ok = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * s} ${s})`} opacity={clamp(s * 2)}>
    <path
      d="M -60 120 L -70 0 Q -74 -40 -54 -44 Q -36 -46 -34 -10 L -32 -110 Q -30 -134 -12 -134 Q 6 -134 6 -110 L 8 -30 L 10 -128 Q 12 -150 30 -150 Q 48 -150 48 -128 L 46 -30 L 52 -110 Q 54 -130 70 -130 Q 86 -128 86 -108 L 82 -20 L 92 -80 Q 96 -98 110 -96 Q 124 -92 120 -70 L 100 80 Q 90 120 40 124 Z"
      fill="#F5C49A"
      stroke={INK}
      strokeWidth={6}
      strokeLinejoin="round"
    />
    <g transform={`scale(${flip ? -1 : 1} 1)`}>
      <text y={180} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={28} letterSpacing={2} fill={color}>
        {label}
      </text>
      {ok > 0.001 && (
        <g transform={`translate(0 -40) scale(${ok})`}>
          <circle r={42} fill={C.lime} stroke={INK} strokeWidth={5} />
          <path d="M -18 0 L -5 14 L 20 -14" stroke={INK} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </g>
  </g>
);

export const ArtKnuckles: React.FC<ArtProps> = ({t, W}) => {
  const a0 = W('myth.') + 1.1;
  const joint = appear(t, a0) * fadeOut(t, W('SIXTY') - 0.6);
  const pull = ease.inOut(prog(t, W('pop') - 0.3, W('pop') + 0.1));
  const bubble = springAt(t, W('pop'), {damping: 6, stiffness: 280});
  const hands = appear(t, W('SIXTY') - 0.4);
  const years = Math.round(60 * ease.inOut(prog(t, W('SIXTY'), W('hand.') + 0.4)));
  const ok = appear(t, W('either'), {damping: 8});
  const trophy = appear(t, W('Ig') - 0.2, {damping: 9});
  const gap = mix(8, 40, pull);
  return (
    <g>
      {joint > 0.001 && (
        <g transform={`scale(${joint})`} opacity={clamp(joint * 2)}>
          <rect x={-420} y={-70} width={380 - gap} height={140} rx={70} fill="#F3EAD7" stroke={INK} strokeWidth={7} />
          <rect x={40 + gap} y={-70} width={380} height={140} rx={70} fill="#F3EAD7" stroke={INK} strokeWidth={7} />
          <ellipse cx={0} cy={0} rx={110 + gap} ry={110} fill={C.cyan} opacity={0.25} stroke={C.cyan} strokeWidth={5} />
          {bubble > 0.001 && (
            <g>
              <circle cx={0} cy={0} r={46 * bubble} fill="#fff" stroke={INK} strokeWidth={5} opacity={0.95} />
              <circle cx={-14} cy={-14} r={12 * bubble} fill="#fff" />
            </g>
          )}
          <SBig x={0} y={-150} text="POP!" s={appear(t, W('pop'), {damping: 7, stiffness: 300}) * fadeOut(t, W('pop') + 0.9)} size={110} color={C.yellow} rot={-6} />
          <SPill x={0} y={190} text="A GAS BUBBLE IN THE JOINT FLUID" s={appear(t, W('bubble'))} bg={C.cyan} size={30} />
        </g>
      )}
      {hands > 0.001 && (
        <g>
          <Hand x={-250} y={60} s={hands} label="CRACKED: 60 YEARS" color={C.pink} ok={ok} />
          <Hand x={170} y={60} flip s={hands} label="NEVER CRACKED" color={C.cyan} ok={ok} />
          <SBig x={-40} y={-200} text={`${years} YEARS`} s={hands * fadeOut(t, W('Ig') - 0.3)} size={80} color={C.yellow} />
          <SPill x={-40} y={-120} text="NO ARTHRITIS IN EITHER HAND" s={ok} bg={C.lime} size={30} />
        </g>
      )}
      {trophy > 0.001 && (
        <g>
          <Trophy x={430} y={-60} scale={0.9 * trophy} t={t} year="2009" />
          <SPill x={430} y={140} text="IG NOBEL PRIZE 2009" s={trophy} bg={C.yellow} size={26} />
        </g>
      )}
    </g>
  );
};

export {mix, wobble};
