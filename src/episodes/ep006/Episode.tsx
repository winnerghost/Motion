import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import timing from '../../../public/episodes/ep006/timing.json';
import {Pip, PipPose} from '../../character/Pip';
import {Background, Grain} from '../../components/Background';
import {Captions, TitleChip} from '../../components/Hud';
import {Pill, Stamp} from '../../components/Props';
import {Atom, Banana, Geiger, Person, Portal, Trefoil, Truck} from '../../components/Banana';
import {clamp, ease, FPS, kf, mix, prog, shake, springAt, wobble} from '../../lib/anim';
import {cam, Cue, envAt, shotStyle, SoundDesign, Stage, Svg} from '../../lib/shots';
import {C, FONT_DISPLAY, FONT_HEAD} from '../../lib/theme';

/**
 * FACT #004 — Are bananas radioactive?
 * - Bananas are rich in potassium; ~0.012% of natural potassium is radioactive K-40
 *   (about 1 atom in 8,500). A banana holds ~0.4 g of potassium -> roughly 15 decays per second.
 * - Truckloads of bananas trigger "nuisance alarms" on radiation portal monitors at ports and borders.
 * - A banana's dose is tiny; everyday natural background radiation (ground, air/radon, cosmic rays)
 *   is far larger.
 * - A human body contains K-40 and C-14 too: several thousand decays every second.
 */

const words = timing.words;
const chunks = timing.chunks;
const env = timing.env;
const w = (i: number) => words[i].start;

export const EP006_DURATION = Math.ceil((timing.duration + 0.6) * FPS);
const END = EP006_DURATION / FPS;
const talkAt = (t: number) => envAt(env, t);

const T = {
  radioactive: w(2),
  seriously: w(3),
  trucks: w(4),
  alarms: w(12),
  border: w(14),
  blame: w(16),
  potassium: w(18),
  tiny: w(20),
  k40: w(25),
  radioactive2: w(28),
  inside: w(30),
  fifteen: w(34),
  every: w(38),
  should: w(40),
  nope: w(43),
  more: w(47),
  ground: w(53),
  air: w(55),
  space: w(58),
  and: w(59),
  twist: w(62),
  youre: w(63),
  thousands: w(69),
  you: w(74),
  so: w(77),
  banana: w(80),
  scared: w(83),
};
const GEIGER1: [number, number] = [T.radioactive + 0.05, T.trucks - 0.05];
const GEIGER2: [number, number] = [T.fifteen - 0.05, T.should - 0.05];
const GEIGER3: [number, number] = [T.thousands - 0.05, T.so - 0.05];

/* ------------------------------------------------------------------ */
/* A — "Bananas are radioactive. Seriously."                             */
/* ------------------------------------------------------------------ */
const ShotHook: React.FC<{t: number}> = ({t}) => {
  const b = T.trucks - 0.05;
  const st = shotStyle(t, -1, b, 0.01, 0.2);
  const tref = springAt(t, T.radioactive, {damping: 9, stiffness: 220});
  const geig = springAt(t, T.radioactive + 0.1, {damping: 11});
  const dead = ease.out(prog(t, T.seriously - 0.1, T.seriously + 0.2));
  const sh = shake(t, T.radioactive, 14, 0.3);
  const s = kf(t, [[0, 1.05], [T.radioactive, 1.0, ease.out], [T.seriously, 1.02], [b, 1.12, ease.linear]]);
  const pose: Partial<PipPose> = {
    x: 600,
    y: 1330,
    scale: 1.0,
    lookX: mix(0.55, 0, dead),
    lookY: mix(-0.35, 0, dead),
    lid: dead * 0.5,
    browL: mix(0.7, 0.05, dead),
    browR: mix(0.7, 0.05, dead),
    smile: mix(0.6, 0, dead),
    smirk: dead * 0.3,
    mouthW: mix(1, 0.75, dead),
    talk: talkAt(t) * 0.9,
    handR: [215, -40],
    handL: [-212, 118],
    antennaGlow: 0.8,
    blush: 0.3,
  };
  const holding = <Banana x={250} y={-120} s={0.5} rot={-35} t={t} id="hb" />;
  return (
    <Stage style={st} camera={cam(s, 560, 1000, 540, 960, sh)}>
      <Svg>
        <Pip id="a" t={t} pose={pose} holding={holding} />
        {geig > 0.001 && <Geiger x={250} y={820} s={geig * 0.95} t={t} level={t < GEIGER1[1] ? 0.55 + 0.2 * Math.abs(Math.sin(t * 9)) : 0.3} rot={-6} probe={false} />}
        {tref > 0.001 && <Trefoil x={820} y={600} r={92} s={tref} rot={t * 30} />}
      </Svg>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* B — trucks of bananas set off border radiation alarms                 */
/* ------------------------------------------------------------------ */
const ShotTruck: React.FC<{t: number}> = ({t}) => {
  const a = T.trucks - 0.05;
  const b = T.blame - 0.08;
  const st = shotStyle(t, a, b, 0.18, 0.2);
  if (!st) return null;
  const drive = ease.out(prog(t, a, T.alarms - 0.05));
  const tx = mix(-520, 600, drive);
  const alarm = t > T.alarms - 0.05 ? 1 : 0;
  const flash = alarm && Math.floor(t * 6) % 2 === 0 ? 1 : 0;
  const alarmS = springAt(t, T.alarms, {damping: 8, stiffness: 240});
  const realS = springAt(t, T.border, {damping: 10});
  const sh = shake(t, T.alarms, 18, 0.4);
  const GY = 1220;
  return (
    <Stage style={st} camera={cam(kf(t, [[a, 1.0], [T.alarms, 1.0], [b, 1.08, ease.out]]), 540, 960, 540, 960, sh)}>
      <AbsoluteFill style={{background: C.red, opacity: flash * 0.12}} />
      <Svg>
        {/* road */}
        <rect x={-200} y={GY} width={1480} height={1000} fill="#1A1450" />
        {Array.from({length: 7}, (_, i) => (
          <rect key={i} x={((i * 260 - t * 400 * (1 - drive)) % 1820) - 260} y={GY + 90} width={140} height={14} rx={7} fill="#FFD84D" opacity={0.5} />
        ))}
        <Portal x={600} y={GY} t={t} alarm={alarm} side="back" />
        <rect x={266} y={GY - 560} width={668} height={40} rx={14} fill="#DCD8F0" stroke="#120C33" strokeWidth={6} />
        <Truck x={tx} y={GY} s={1.0} t={t} moving={1 - drive} />
        <Portal x={600} y={GY} t={t + 0.08} alarm={alarm} side="front" />
        <Trefoil x={600} y={GY - 600} r={46} s={alarmS} />
      </Svg>
      {alarmS > 0.001 && (
        <div
          style={{
            position: 'absolute',
            left: 540,
            top: 470,
            transform: `translate(-50%, -50%) scale(${alarmS}) rotate(-4deg)`,
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 96,
            color: flash ? '#fff' : C.red,
            WebkitTextStroke: '16px #120C33',
            paintOrder: 'stroke fill',
            whiteSpace: 'nowrap',
          }}
        >
          RADIATION ALARM!
        </div>
      )}
      {realS > 0.001 && <Pill x={540} y={1530} text="THIS REALLY HAPPENS" bg={C.yellow} s={realS} size={40} rot={2} />}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* C — potassium-40: ~15 atoms decay every second                        */
/* ------------------------------------------------------------------ */
const ATOMS: {x: number; y: number; k40: boolean}[] = (() => {
  const out: {x: number; y: number; k40: boolean}[] = [];
  const special = new Set([7, 18, 26]);
  let i = 0;
  for (let row = -3; row <= 3; row++) {
    for (let col = -3; col <= 3; col++) {
      const x = col * 84 + (row % 2 ? 42 : 0);
      const y = row * 74;
      if (Math.hypot(x, y) > 270) continue;
      out.push({x, y, k40: special.has(i)});
      i++;
    }
  }
  return out;
})();

const ShotAtoms: React.FC<{t: number}> = ({t}) => {
  const a = T.blame - 0.08;
  const b = T.should - 0.1;
  const st = shotStyle(t, a, b, 0.2, 0.2);
  if (!st) return null;
  const banS = springAt(t, a, {damping: 12});
  const bubble = springAt(t, T.potassium + 0.1, {damping: 12, stiffness: 160});
  const k40 = ease.out(prog(t, T.k40 - 0.1, T.k40 + 0.3));
  const fracS = springAt(t, T.k40 + 0.4, {damping: 10});
  const tref = springAt(t, T.radioactive2, {damping: 9});
  const popping = t > T.fifteen - 0.1;
  const countS = springAt(t, T.fifteen, {damping: 9, stiffness: 230});
  const BX = 540;
  const BY = 880;
  const pipPose: Partial<PipPose> = {
    x: 860,
    y: 1800,
    scale: 0.55,
    lookX: -0.6,
    lookY: -0.6,
    browL: 0.6,
    browR: 0.6,
    smile: 0.4,
    talk: talkAt(t) * 0.9,
    handL: [-250, -90],
    handR: [212, 118],
    antennaGlow: 0.8,
    blush: 0.3,
  };
  return (
    <Stage style={st} camera={cam(kf(t, [[a, 1.0], [b, 1.05, ease.linear]]), 540, 960)}>
      <Svg>
        {bubble < 0.999 && <Banana x={BX} y={BY - 20} s={banS * 0.95 * (1 - 0.4 * bubble)} rot={-8} t={t} id="cb" />}
        {bubble > 0.001 && (
          <g>
            <g transform={`translate(${BX} ${BY}) scale(${bubble})`}>
              <circle r={330} fill="#FFF3B8" stroke="#fff" strokeWidth={16} />
              <circle r={330} fill="none" stroke="#120C33" strokeWidth={5} />
              {ATOMS.map((at, i) => {
                const period = 0.55 + (i % 3) * 0.17;
                const ph = (((t - T.fifteen) / period + i * 0.37) % 1 + 1) % 1;
                const pop = at.k40 && popping && t > T.fifteen + (i % 3) * 0.15 ? ph : 0;
                return <Atom key={i} x={at.x} y={at.y} r={30} k40={at.k40 && k40 > 0.5} pop={pop} />;
              })}
            </g>
          </g>
        )}
        {tref > 0.001 && <Trefoil x={BX + 305} y={BY - 225} r={56} s={tref} rot={t * 40} />}
        <Pip id="c" t={t} pose={pipPose} />
      </Svg>
      {bubble > 0.001 && <Pill x={BX} y={BY + 380} text="POTASSIUM ATOMS INSIDE" bg="#8C7DFF" color="#fff" s={bubble} size={36} />}
      {fracS > 0.001 && <Pill x={BX - 10} y={BY - 380} text="ONLY 1 IN 8,500 IS K-40" bg={C.lime} s={fracS * (1 - ease.in(prog(t, T.fifteen - 0.3, T.fifteen)))} size={38} rot={-2} />}
      {countS > 0.001 && (
        <div
          style={{
            position: 'absolute',
            left: BX,
            top: BY - 400,
            transform: `translate(-50%, -50%) scale(${countS}) rotate(-3deg)`,
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 96,
            color: C.lime,
            WebkitTextStroke: '16px #120C33',
            paintOrder: 'stroke fill',
            whiteSpace: 'nowrap',
          }}
        >
          ~15 PER SECOND
        </div>
      )}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* D — "Should you panic? Nope." + everyday background radiation         */
/* ------------------------------------------------------------------ */
const ShotPanic: React.FC<{t: number}> = ({t}) => {
  const a = T.should - 0.1;
  const b = T.and - 0.05;
  const st = shotStyle(t, a, b, 0.2, 0.2);
  if (!st) return null;
  const nope = ease.out(prog(t, T.nope - 0.1, T.nope + 0.2));
  const move = ease.inOut(prog(t, T.more - 0.4, T.more));
  const bars = springAt(t, T.more - 0.1, {damping: 12});
  const fill = ease.out(prog(t, T.more + 0.2, T.ground));
  const icons = [
    {at: T.ground, label: 'GROUND', x: 230},
    {at: T.air, label: 'AIR', x: 540},
    {at: T.space, label: 'SPACE', x: 850},
  ];
  const pose: Partial<PipPose> = {
    x: mix(540, 540, move),
    y: mix(1360, 1840, move),
    scale: mix(1.05, 0.62, move),
    lookX: mix(0.2, 0, nope),
    lookY: mix(0.2, -0.5 * move, nope),
    lid: mix(0.25, 0.1, nope),
    browL: mix(0.7, 0.3, nope),
    browR: mix(0.7, 0.3, nope),
    browAngry: mix(-0.7, 0, nope),
    smile: mix(-0.25, 0.6, nope),
    mouthW: mix(0.7, 1, nope),
    talk: talkAt(t) * 0.9,
    handL: nope > 0.5 ? [-250, -60] : [-120, 40],
    handR: nope > 0.5 ? [250, -60] : [120, 40],
    antennaGlow: 0.7,
    blush: 0.35,
  };
  return (
    <Stage style={st} camera={cam(1, 540, 960)}>
      <Svg>
        {icons.map((ic, i) => {
          const s = springAt(t, ic.at - 0.05, {damping: 9, stiffness: 220});
          if (s <= 0.001) return null;
          return (
            <g key={ic.label} transform={`translate(${ic.x} 1010) scale(${s})`}>
              <circle r={120} fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth={4} />
              {i === 0 && (
                <g>
                  <path d="M -90 40 L -60 -30 L -10 -60 L 40 -40 L 90 30 L 90 60 L -90 60 Z" fill="#8A7A6A" stroke="#120C33" strokeWidth={6} />
                  {[[-30, 10], [20, -10], [50, 30]].map(([px, py], k) => (
                    <circle key={k} cx={px} cy={py} r={6 + 3 * Math.sin(t * 8 + k)} fill={C.lime} />
                  ))}
                </g>
              )}
              {i === 1 && (
                <g transform={`translate(${wobble(t, 0.6, 'cl') * 8} 0)`}>
                  {[[-50, 10, 46], [0, -20, 58], [52, 12, 44]].map(([cx, cy, r], k) => (
                    <circle key={k} cx={cx} cy={cy} r={r} fill="#E9E6FF" stroke="#120C33" strokeWidth={5} />
                  ))}
                  <rect x={-96} y={10} width={192} height={46} rx={23} fill="#E9E6FF" />
                </g>
              )}
              {i === 2 && (
                <g>
                  <path d="M 0 -70 L 18 -22 L 70 -22 L 28 8 L 44 58 L 0 28 L -44 58 L -28 8 L -70 -22 L -18 -22 Z" fill={C.yellow} stroke="#120C33" strokeWidth={6} strokeLinejoin="round" />
                  {[0, 1, 2].map((k) => {
                    const p = ((t * 1.5 + k / 3) % 1 + 1) % 1;
                    return <line key={k} x1={-90 + k * 60} y1={-110 + p * 160} x2={-70 + k * 60} y2={-80 + p * 160} stroke={C.cyan} strokeWidth={6} strokeLinecap="round" opacity={1 - p} />;
                  })}
                </g>
              )}
              <text y={170} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={40} letterSpacing={3} fill="#fff">
                {ic.label}
              </text>
            </g>
          );
        })}
        <Pip id="d" t={t} pose={pose} />
      </Svg>
      {nope > 0.01 && t < T.more && <Stamp x={540} y={620} t={t} at={T.nope} text="NOPE" color={C.lime} size={150} tint="rgba(141,255,106,0.10)" />}
      {bars > 0.001 && (
        <div style={{position: 'absolute', left: 120, top: 520, width: 840, transform: `scale(${bars})`, transformOrigin: 'left center', opacity: clamp(bars * 2)}}>
          {[
            {label: 'EATING 1 BANANA', v: 0.01, color: C.yellow},
            {label: '1 NORMAL DAY ON EARTH', v: fill, color: C.lime},
          ].map((r) => (
            <div key={r.label} style={{marginBottom: 26}}>
              <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 36, letterSpacing: 3, color: '#fff', marginBottom: 10}}>{r.label}</div>
              <div style={{height: 54, borderRadius: 27, background: 'rgba(255,255,255,0.1)'}}>
                <div style={{height: 54, width: `${Math.max(6, r.v * 100)}%`, borderRadius: 27, background: r.color}} />
              </div>
            </div>
          ))}
          <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 36, letterSpacing: 3, color: C.lime, opacity: fill}}>= DOZENS OF BANANAS' WORTH</div>
        </div>
      )}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* E — the twist: you're more radioactive than the banana               */
/* ------------------------------------------------------------------ */
const FLASHES = Array.from({length: 44}, (_, i) => {
  const a = i * 2.39996;
  const r = Math.sqrt(((i * 37) % 100) / 100);
  return {x: Math.cos(a) * r, y: Math.sin(a) * r, ph: (i * 0.618) % 1};
});

const ShotTwist: React.FC<{t: number}> = ({t}) => {
  const a = T.and - 0.05;
  const b = T.so - 0.05;
  const st = shotStyle(t, a, b, 0.2, 0.2);
  if (!st) return null;
  const point = ease.out(prog(t, T.youre - 0.1, T.youre + 0.25));
  const toPerson = ease.inOut(prog(t, T.thousands - 0.35, T.thousands));
  const personS = springAt(t, T.thousands - 0.2, {damping: 12});
  const youS = springAt(t, T.you, {damping: 8, stiffness: 260});
  const sh = shake(t, T.you, 20, 0.4);
  const countS = springAt(t, T.thousands + 0.1, {damping: 9, stiffness: 220});
  const pose: Partial<PipPose> = {
    x: mix(540, 470, point),
    y: mix(1420, 1370, point),
    scale: mix(1.0, 1.2, point),
    lookX: 0,
    lookY: 0,
    tilt: point * 4,
    lid: mix(0.3, 0, point),
    browL: mix(0.2, 0.8, point),
    browR: mix(0.6, 0.3, point),
    smirk: mix(0.5, 0.3, point),
    smile: mix(0.4, 0.7, point),
    talk: talkAt(t) * 0.9,
    handR: [mix(212, 270, point), mix(118, -110, point)],
    handL: [-212, 118],
    antennaGlow: 1,
    blush: 0.4,
  };
  return (
    <Stage style={st} camera={cam(kf(t, [[a, 1.0], [T.youre, 1.0], [T.youre + 0.4, 1.1, ease.out], [T.thousands - 0.35, 1.12], [T.thousands, 1.0, ease.inOut]]), 540, 1000, 540, 960, sh)}>
      <AbsoluteFill style={{opacity: 1 - toPerson}}>
        <Svg>
          <Pip id="e" t={t} pose={pose} />
        </Svg>
        {point > 0.01 && <Pill x={540} y={620} text="YOU > BANANA" bg={C.lime} s={springAt(t, T.youre + 0.3, {damping: 9})} size={56} rot={-3} />}
      </AbsoluteFill>
      {personS > 0.001 && (
        <AbsoluteFill style={{opacity: toPerson}}>
          <Svg>
            <Person x={540} y={1340} s={0.95 * personS} glow={1} />
            {FLASHES.map((f, i) => {
              const ph = ((t * 2.2 + f.ph) % 1 + 1) % 1;
              const fx = 540 + f.x * 140;
              const fy = 1040 + f.y * 290;
              return <circle key={i} cx={fx} cy={fy} r={6 + ph * 26} fill={C.lime} opacity={(1 - ph) * 0.85 * personS} />;
            })}
          </Svg>
          {countS > 0.001 && (
            <div style={{position: 'absolute', left: 540, top: 565, transform: `translate(-50%, -50%) scale(${countS}) rotate(-3deg)`, textAlign: 'center', whiteSpace: 'nowrap'}}>
              <div style={{fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 104, color: C.lime, WebkitTextStroke: '16px #120C33', paintOrder: 'stroke fill', lineHeight: 1}}>THOUSANDS</div>
              <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 40, letterSpacing: 4, color: '#fff', marginTop: 6}}>OF DECAYS PER SECOND</div>
            </div>
          )}
          {youS > 0.001 && (
            <div style={{position: 'absolute', left: 540, top: 1560, transform: `translate(-50%, -50%) scale(${youS}) rotate(4deg)`, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 150, color: C.yellow, WebkitTextStroke: '20px #120C33', paintOrder: 'stroke fill'}}>
              YOU!
            </div>
          )}
        </AbsoluteFill>
      )}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* F — "So really... the banana should be scared of you."               */
/* ------------------------------------------------------------------ */
const ShotScared: React.FC<{t: number}> = ({t}) => {
  const a = T.so - 0.05;
  const st = shotStyle(t, a, END + 1, 0.2, 0.01);
  if (!st) return null;
  const ban = springAt(t, a + 0.05, {damping: 11});
  const scared = ease.out(prog(t, T.scared - 0.15, T.scared + 0.2));
  const back = ease.out(prog(t, T.scared, T.scared + 0.8));
  const boo = ease.out(prog(t, T.scared - 0.2, T.scared + 0.1));
  const pose: Partial<PipPose> = {
    x: mix(330, 380, boo),
    y: 1360,
    scale: 0.95,
    lookX: 0.6,
    lookY: 0,
    lid: mix(0.35, 0.15, boo),
    browL: mix(0.1, 0.9, boo),
    browR: mix(0.6, 0.9, boo),
    browAngry: boo * 0.5,
    smirk: mix(0.5, 0.2, boo),
    smile: mix(0.4, 0.8, boo),
    mouthOpen: boo * 0.5,
    talk: talkAt(t) * 0.85,
    handL: boo > 0.5 ? [-200, -160] : [-212, 118],
    handR: boo > 0.5 ? [220, -180] : [212, 118],
    fingers: boo,
    tilt: boo * 6,
    antennaGlow: 0.8 + boo * 0.2,
    blush: 0.35,
  };
  return (
    <Stage style={st} camera={cam(kf(t, [[a, 1.0], [END, 1.08, ease.linear]]), 560, 1000)}>
      <Svg>
        <Banana x={mix(750, 785, back)} y={1120 - Math.sin(Math.PI * back) * 90} s={ban * 0.9} rot={mix(-14, 8, back) + Math.sin(t * 50) * 2 * scared} t={t} face={1} scared={scared} id="fb" />
        <Pip id="f" t={t} pose={pose} />
      </Svg>
    </Stage>
  );
};

const CUES: Cue[] = [
  [0, 'blips', 0.3],
  [T.radioactive, 'pop', 0.45],
  [T.seriously, 'tick', 0.3],
  [T.trucks - 0.05, 'whoosh', 0.35],
  [T.alarms - 0.05, 'thud', 0.45],
  [T.blame - 0.08, 'whoosh-down', 0.3],
  [T.potassium + 0.1, 'pop', 0.35],
  [T.k40, 'ding', 0.3],
  [T.radioactive2, 'zap', 0.25],
  [T.fifteen, 'pop-high', 0.35],
  [T.should - 0.1, 'whoosh', 0.25],
  [T.nope, 'thud', 0.5],
  [T.more - 0.1, 'blips', 0.25],
  [T.ground, 'pop', 0.35],
  [T.air, 'pop-high', 0.35],
  [T.space, 'zap', 0.3],
  [T.and - 0.2, 'riser', 0.3],
  [T.youre, 'thud', 0.4],
  [T.you, 'thud', 0.45],
  [T.so - 0.05, 'whoosh-down', 0.3],
  [T.scared - 0.05, 'boing', 0.4],
];

/** coverAt: render a single clean frame at that second (no captions, no audio) for the cover image. */
export const Episode006: React.FC<{coverAt?: number}> = ({coverAt}) => {
  const current = useCurrentFrame();
  const t = coverAt ?? current / FPS;
  const frame = Math.round(t * FPS);
  const green = Math.max(
    clamp(Math.min((t - T.blame) / 0.4, (T.should - t) / 0.4)),
    clamp(Math.min((t - T.thousands) / 0.4, (T.so - t) / 0.4)),
  );
  const geigerSeq = (win: [number, number], file: string, vol: number) => (
    <Sequence from={Math.round(win[0] * FPS)} durationInFrames={Math.round((win[1] - win[0]) * FPS)} layout="none">
      <Audio src={staticFile(`sfx/${file}`)} volume={(f) => vol * Math.min(1, f / 6) * Math.min(1, (Math.round((win[1] - win[0]) * FPS) - f) / 12)} />
    </Sequence>
  );
  return (
    <AbsoluteFill style={{background: C.bg0}}>
      <Background t={t} hue={green * 70} />
      <ShotHook t={t} />
      <ShotTruck t={t} />
      <ShotAtoms t={t} />
      <ShotPanic t={t} />
      <ShotTwist t={t} />
      <ShotScared t={t} />
      <TitleChip t={t} episode="FACT #004" line1="ARE BANANAS" line2="RADIOACTIVE?" />
      {coverAt === undefined && <Captions t={t} words={words} chunks={chunks} emphasis={['radioactive', 'seriously', 'alarms', 'potassium', 'potassium-40', 'fifteen', 'nope', 'ground', 'air', 'space', 'twist', 'thousands', 'you', 'scared']} />}
      <Grain frame={frame} />
      {coverAt === undefined && (
        <>
          <SoundDesign vo="episodes/ep006/vo.wav" env={env} end={END} cues={CUES} />
          {geigerSeq(GEIGER1, 'geiger-slow.wav', 0.4)}
          <Sequence from={Math.round((T.alarms - 0.05) * FPS)} durationInFrames={Math.round(1.6 * FPS)} layout="none">
            <Audio src={staticFile('sfx/alarm.wav')} volume={0.32} />
          </Sequence>
          {geigerSeq(GEIGER2, 'geiger-slow.wav', 0.45)}
          {geigerSeq(GEIGER3, 'geiger-fast.wav', 0.4)}
        </>
      )}
    </AbsoluteFill>
  );
};
