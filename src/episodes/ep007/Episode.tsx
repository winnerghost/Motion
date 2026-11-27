import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import timing from '../../../public/episodes/ep007/timing.json';
import {Pip, PipPose} from '../../character/Pip';
import {Background, Grain} from '../../components/Background';
import {Brain} from '../../components/Brain';
import {Bowl, Fingertip, Hand, Marble, MARBLE_COLORS, SkinSection, Tire, Tub} from '../../components/Fingers';
import {Captions, TitleChip} from '../../components/Hud';
import {Pill, Stamp} from '../../components/Props';
import {FlowPath} from '../../components/Voice';
import {clamp, ease, FPS, kf, mix, prog, shake, springAt} from '../../lib/anim';
import {cam, Cue, envAt, shotStyle, SoundDesign, Stage, Svg} from '../../lib/shots';
import {C, FONT_DISPLAY, FONT_HEAD} from '../../lib/theme';

/**
 * FACT #005 — Why do fingers wrinkle in water?
 * - Not water soaking in: after ~5 min in water, sympathetic nerves make the blood vessels in the
 *   fingertips constrict; the pulp loses volume and the skin buckles into folds.
 * - Fingers with damaged (cut) nerves don't wrinkle; doctors use immersion wrinkling as a nerve test.
 * - Kareklas et al. (2013): wrinkled fingers moved wet objects faster; the folds may drain water
 *   like tyre treads (still debated — not every study replicated it).
 */

const words = timing.words;
const chunks = timing.chunks;
const env = timing.env;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
/** Start time of the nth occurrence of a word (robust to retakes). */
const at = (word: string, nth = 1) => {
  let n = 0;
  for (const w of words) {
    if (norm(w.text) === norm(word) && ++n === nth) return w.start;
  }
  throw new Error(`EP007: word "${word}" #${nth} not in timing`);
};

export const EP007_DURATION = Math.ceil((timing.duration + 0.6) * FPS);
const END = EP007_DURATION / FPS;
const talkAt = (t: number) => envAt(env, t);

const A = {
  wrinkly: at('wrinkly'),
  bath: at('bath'),
  most: at('most'),
  soaks: at('soaks'),
  nope: at('nope'),
  its: at("it's"),
  nervous: at('nervous'),
  after: at('after'),
  five: at('five'),
  nerves: at('nerves'),
  blood: at('blood'),
  shrink: at('shrink'),
  less: at('less'),
  folds: at('folds'),
  doctors: at('doctors'),
  noticed: at('noticed'),
  damaged: at('damaged'),
  dont: at("don't"),
  so2: at('so', 2),
  purpose: at('purpose'),
  grip: at('grip'),
  in4: at('in', 4),
  people: at('people', 2),
  marbles: at('marbles'),
  faster: at('faster'),
  the4: at('the', 4),
  channel: at('channel'),
  treads: at('treads'),
  tire: at('tire'),
  so3: at('so', 3),
  pruney: at('pruney'),
  rain: at('rain'),
};

const BigText: React.FC<{x: number; y: number; s: number; text: string; color?: string; size?: number; rot?: number}> = ({x, y, s, text, color = C.yellow, size = 110, rot = -3}) =>
  s > 0.001 ? (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${s}) rotate(${rot}deg)`,
        fontFamily: FONT_DISPLAY,
        fontWeight: 700,
        fontSize: size,
        color,
        WebkitTextStroke: `${Math.round(size * 0.15)}px #120C33`,
        paintOrder: 'stroke fill',
        whiteSpace: 'nowrap',
        lineHeight: 1,
      }}
    >
      {text}
    </div>
  ) : null;

const smallPip = (t: number, extra: Partial<PipPose> = {}): Partial<PipPose> => ({
  x: 880,
  y: 1810,
  scale: 0.5,
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
  ...extra,
});

/* A — "Why do your fingers go wrinkly in the bath?" */
const ShotHook: React.FC<{t: number}> = ({t}) => {
  const b = A.most - 0.05;
  const st = shotStyle(t, -1, b, 0.01, 0.2);
  if (!st) return null;
  const look = ease.out(prog(t, A.wrinkly - 0.25, A.wrinkly + 0.15));
  const mag = springAt(t, A.wrinkly - 0.1, {damping: 11});
  const wr = ease.inOut(prog(t, A.wrinkly - 0.1, A.bath + 0.4));
  const pose: Partial<PipPose> = {
    x: 470,
    y: 1360,
    scale: 1.0,
    lookX: mix(0, 0.6, look),
    lookY: mix(0, -0.5, look),
    browL: mix(0.4, 0.9, look),
    browR: mix(0.4, 0.2, look),
    browAngry: -0.3 * look,
    smile: mix(0.55, -0.15, look),
    mouthW: 0.85,
    talk: talkAt(t) * 0.9,
    handR: [235, -150],
    handL: [-212, 118],
    antennaGlow: 0.8,
    blush: 0.45,
    tilt: -5 * look,
  };
  return (
    <Stage style={st} camera={cam(kf(t, [[0, 1.06], [b, 1.0, ease.linear]]), 540, 1000)}>
      <Svg>
        <Pip id="a" t={t} pose={pose} />
        <Tub x={540} y={1150} t={t} />
        {mag > 0.001 && (
          <g>
            <path d="M 690 800 L 660 740 L 850 700 Z" fill="#fff" opacity={0.1 * mag} />
            <Fingertip x={800} y={610} r={180} s={mag} wrinkle={wr} id="fa" t={t} />
          </g>
        )}
      </Svg>
      <BigText x={830} y={830} s={springAt(t, A.bath, {damping: 9})} text="WHY?!" size={84} />
    </Stage>
  );
};

/* B — "Most people think water soaks into your skin. Nope." */
const ShotMyth: React.FC<{t: number}> = ({t}) => {
  const a = A.most - 0.05;
  const b = A.its - 0.05;
  const st = shotStyle(t, a, b, 0.2, 0.2);
  if (!st) return null;
  const tip = springAt(t, a, {damping: 12});
  const label = springAt(t, A.soaks - 0.1, {damping: 10});
  const bounce = t > A.nope ? t - A.nope : 0;
  const sh = shake(t, A.nope, 16, 0.35);
  const head = t > A.nope && t < A.nope + 0.6 ? Math.sin((t - A.nope) * 24) * 0.55 : 0;
  return (
    <Stage style={st} camera={cam(1, 540, 960, 540, 960, sh)}>
      <Svg>
        <Fingertip x={540} y={900} r={250} s={tip} wrinkle={1} id="fb" t={t} />
        {Array.from({length: 8}, (_, i) => {
          const ang = (i / 8) * Math.PI * 2 + 0.3;
          const p = bounce > 0 ? 1 : (((t - a) * 0.9 + i / 8) % 1 + 1) % 1;
          const d = bounce > 0 ? 300 + bounce * 1100 : mix(520, 300, ease.in(p));
          const op = bounce > 0 ? clamp(1 - bounce * 1.6) : Math.sin(p * Math.PI);
          const dx = 540 + Math.cos(ang) * d;
          const dy = 900 + Math.sin(ang) * d;
          const rot = (ang * 180) / Math.PI + 270 + (bounce > 0 ? 180 : 0);
          return (
            <g key={i} transform={`translate(${dx} ${dy}) rotate(${rot}) scale(1.3)`} opacity={op * tip}>
              <path d="M 0 -26 C 14 -6 18 6 18 12 A 18 18 0 0 1 -18 12 C -18 6 -14 -6 0 -26 Z" fill="#4FB8FF" stroke="#120C33" strokeWidth={4} />
            </g>
          );
        })}
        <Pip id="b" t={t} pose={smallPip(t, {lookX: head || -0.6, lookY: head ? 0 : -0.6, browAngry: t > A.nope ? 0.3 : 0, smirk: t > A.nope ? 0.4 : 0})} />
      </Svg>
      {label > 0.001 && <Pill x={540} y={530} text="WATER SOAKS IN?" bg="#4FB8FF" color="#fff" s={label * (t > A.nope ? 1 - ease.in(prog(t, A.nope, A.nope + 0.2)) : 1)} size={46} rot={-2} />}
      <Stamp x={540} y={900} t={t} at={A.nope} text="NOPE" color={C.red} size={150} />
    </Stage>
  );
};

/* C — "It's your nervous system." */
const ShotNerves: React.FC<{t: number}> = ({t}) => {
  const a = A.its - 0.05;
  const b = A.after - 0.05;
  const st = shotStyle(t, a, b, 0.2, 0.2);
  if (!st) return null;
  const brain = springAt(t, a, {damping: 11});
  const draw = ease.inOut(prog(t, a + 0.1, A.nervous + 0.3));
  const hand = springAt(t, a + 0.2, {damping: 12});
  const label = springAt(t, A.nervous, {damping: 9});
  return (
    <Stage style={st} camera={cam(kf(t, [[a, 1.0], [b, 1.05, ease.linear]]), 540, 960)}>
      <Svg>
        <FlowPath d="M 330 820 C 300 1050 500 1230 720 1215" t={t} color={C.yellow} draw={draw} width={12} />
        <Brain x={330} y={640} scale={0.5 * brain} t={t} id="cb" />
        <Hand x={760} y={1130} s={0.75 * hand} rot={-8} wrinkle={0} nerve={draw} pulse={draw} t={t} />
      </Svg>
      <Pill x={540} y={470} text="NERVOUS SYSTEM" bg={C.yellow} s={label} size={52} rot={-2} />
    </Stage>
  );
};

/* D — vessels shrink, skin folds */
const ShotSection: React.FC<{t: number}> = ({t}) => {
  const a = A.after - 0.05;
  const b = A.doctors - 0.05;
  const st = shotStyle(t, a, b, 0.2, 0.2);
  if (!st) return null;
  const box = springAt(t, a, {damping: 13});
  const timer = ease.inOut(prog(t, A.five - 0.2, A.five + 0.9));
  const mins = Math.floor(timer * 5);
  const secs = Math.floor((timer * 300) % 60);
  const signal = ease.out(prog(t, A.nerves - 0.1, A.nerves + 0.3));
  const shrink = ease.inOut(prog(t, A.shrink - 0.25, A.shrink + 0.7));
  const fold = ease.inOut(prog(t, A.less, A.folds + 0.3));
  const sig = springAt(t, A.nerves, {damping: 10});
  const shr = springAt(t, A.shrink - 0.1, {damping: 10});
  const fol = springAt(t, A.folds - 0.1, {damping: 9});
  return (
    <Stage style={st} camera={cam(kf(t, [[a, 1.0], [A.folds, 1.0], [b, 1.06, ease.out]]), 540, 900)}>
      <AbsoluteFill style={{transform: `scale(${0.85 + 0.15 * box})`, opacity: clamp(box * 2), transformOrigin: '540px 850px'}}>
        <Svg>
          <SkinSection x={540} y={850} t={t} shrink={shrink} fold={fold} signal={signal} id="sd" />
        </Svg>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 540, top: 480, transform: 'translate(-50%, -50%)', display: 'flex', gap: 18, alignItems: 'center', opacity: clamp(box * 2)}}>
        <div style={{fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 92, color: '#fff', WebkitTextStroke: '14px #120C33', paintOrder: 'stroke fill'}}>
          {mins}:{String(secs).padStart(2, '0')}
        </div>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 34, letterSpacing: 3, color: '#4FB8FF', lineHeight: 1.1}}>
          MINUTES
          <br />
          IN WATER
        </div>
      </div>
      <div style={{position: 'absolute', left: 120, top: 590, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 28, letterSpacing: 4, color: '#fff', opacity: 0.85 * clamp(box * 2)}}>WATER</div>
      {sig > 0.001 && <Pill x={540} y={1010} text="NERVE SIGNAL" bg={C.yellow} s={sig * (1 - ease.in(prog(t, A.shrink - 0.3, A.shrink - 0.1)))} size={34} />}
      {shr > 0.001 && <Pill x={540} y={1185} text="BLOOD VESSELS SHRINK" bg={C.red} color="#fff" s={shr * (1 - ease.in(prog(t, A.folds - 0.3, A.folds - 0.1)))} size={40} rot={-2} />}
      {fol > 0.001 && <Pill x={540} y={1185} text="SKIN FOLDS UP" bg={C.lime} s={fol} size={48} rot={-2} />}
    </Stage>
  );
};

/* E — doctors: damaged nerves, no wrinkles */
const ShotDoctors: React.FC<{t: number}> = ({t}) => {
  const a = A.doctors - 0.05;
  const b = A.so2 - 0.05;
  const st = shotStyle(t, a, b, 0.2, 0.2);
  if (!st) return null;
  const hands = springAt(t, a + 0.05, {damping: 12});
  const test = springAt(t, A.noticed, {damping: 10});
  const lab = springAt(t, A.damaged - 0.1, {damping: 10});
  const smooth = springAt(t, A.dont, {damping: 8, stiffness: 240});
  const label = (x: number, title: string, sub: string, color: string, s: number) =>
    s > 0.001 ? (
      <div style={{position: 'absolute', left: x, top: 660, transform: `translate(-50%, -50%) scale(${s})`, textAlign: 'center'}}>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 46, letterSpacing: 3, color, whiteSpace: 'nowrap'}}>{title}</div>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 36, letterSpacing: 2, color: '#fff', opacity: 0.85, whiteSpace: 'nowrap'}}>{sub}</div>
      </div>
    ) : null;
  return (
    <Stage style={st} camera={cam(1, 540, 960)}>
      <Svg>
        <Hand x={290} y={1215} s={0.78 * hands} wrinkle={1} nerve={1} pulse={1} t={t} />
        <Hand x={800} y={1215} s={0.78 * hands} wrinkle={0} nerve={1} cut t={t} sleeve="#8C7DFF" />
      </Svg>
      <Pill x={540} y={500} text="THE WRINKLE TEST" bg={C.cyan} s={test} size={44} rot={-2} />
      {label(290, 'NERVES OK', 'wrinkles ✓', C.lime, lab)}
      {label(800, 'NERVE DAMAGED', 'no wrinkles ✗', C.red, lab)}
      {smooth > 0.001 && (
        <div style={{position: 'absolute', left: 800, top: 810, transform: `translate(-50%, -50%) scale(${smooth}) rotate(6deg)`, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 52, color: '#fff', WebkitTextStroke: '9px #120C33', paintOrder: 'stroke fill'}}>
          SMOOTH!
        </div>
      )}
    </Stage>
  );
};

/* F — "So why would your body do this on purpose? Grip." */
const ShotGrip: React.FC<{t: number}> = ({t}) => {
  const a = A.so2 - 0.05;
  const b = A.in4 - 0.05;
  const st = shotStyle(t, a, b, 0.2, 0.2);
  if (!st) return null;
  const whisper = ease.inOut(prog(t, A.grip - 0.35, A.grip));
  const grip = springAt(t, A.grip, {damping: 9, stiffness: 200});
  const pose: Partial<PipPose> = {
    x: 540,
    y: mix(1400, 1500, whisper),
    scale: mix(1.0, 1.35, whisper),
    lookX: mix(-0.35, 0.2, whisper),
    lookY: mix(-0.4, 0, whisper),
    lid: mix(0.15, 0.35, whisper),
    browL: mix(0.85, 0.6, whisper),
    browR: mix(-0.1, 0.6, whisper),
    browAngry: 0.1,
    smirk: mix(0.4, 0.5, whisper),
    smile: mix(0.05, 0.3, whisper),
    mouthW: mix(0.8, 0.6, whisper),
    talk: talkAt(t) * 0.8,
    handL: whisper > 0.5 ? [-120, -20] : [-212, 118],
    handR: whisper > 0.5 ? [212, 118] : [70, 45],
    antennaGlow: 0.8,
    blush: 0.4,
    tilt: whisper * -6,
  };
  return (
    <Stage style={st} camera={cam(1, 540, 960)}>
      <Svg>
        <Pip id="f" t={t} pose={pose} />
        {[0, 1, 2].map((k) => {
          const s = springAt(t, a + 0.3 + k * 0.25, {damping: 8}) * (1 - whisper);
          return s > 0.001 ? (
            <text key={k} x={300 + k * 230} y={620 - (k % 2) * 60 + Math.sin(t * 3 + k) * 10} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={700} fontSize={110 * s} fill={C.yellow} stroke="#120C33" strokeWidth={14} paintOrder="stroke">
              ?
            </text>
          ) : null;
        })}
      </Svg>
      <BigText x={540} y={600} s={grip} text="GRIP." size={170} color={C.lime} />
    </Stage>
  );
};

/* G — the wet-marbles experiment */
const N_MARBLES = 7;
const Lane: React.FC<{t: number; t0: number; y: number; gap: number; title: string; color: string; s: number}> = ({t, t0, y, gap, title, color, s}) => {
  const L = 250;
  const R = 830;
  const moved = clamp(Math.floor((t - t0) / gap) + 1, 0, N_MARBLES);
  const done = t0 + (N_MARBLES - 1) * gap + 0.35;
  return (
    <g opacity={clamp(s * 3)}>
      <text x={540} y={y - 120} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={40} letterSpacing={4} fill={color}>
        {title}
      </text>
      <Bowl x={L} y={y} />
      <Bowl x={R} y={y} />
      {Array.from({length: N_MARBLES}, (_, i) => {
        const start = t0 + i * gap;
        const p = ease.inOut(prog(t, start, start + 0.35));
        const lx = L - 60 + (i % 4) * 40;
        const rx = R - 60 + (i % 4) * 40;
        const ly = y - 6 - Math.floor(i / 4) * 22;
        const mx = mix(lx, rx, p);
        const my = mix(ly, ly, p) - Math.sin(p * Math.PI) * 140;
        return <Marble key={i} x={mx} y={my} r={22} color={MARBLE_COLORS[i % MARBLE_COLORS.length]} />;
      })}
      <text x={540} y={y + 20} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={700} fontSize={56} fill="#fff" stroke="#120C33" strokeWidth={10} paintOrder="stroke">
        {t >= done ? '✓' : `${moved}/${N_MARBLES}`}
      </text>
    </g>
  );
};

const ShotMarbles: React.FC<{t: number}> = ({t}) => {
  const a = A.in4 - 0.05;
  const b = A.the4 - 0.05;
  const st = shotStyle(t, a, b, 0.2, 0.2);
  if (!st) return null;
  const lanes = springAt(t, a, {damping: 12});
  const study = springAt(t, a + 0.15, {damping: 10});
  const t0 = A.people;
  const span = Math.max(1.6, A.faster - t0 - 0.2);
  const gapW = span / N_MARBLES;
  const gapS = gapW * 1.7;
  const fast = springAt(t, A.faster, {damping: 8, stiffness: 240});
  return (
    <Stage style={st} camera={cam(1, 540, 960)}>
      <Svg>
        <Lane t={t} t0={t0} y={730} gap={gapS} title="SMOOTH FINGERS" color="#B8B3D6" s={lanes} />
        <Lane t={t} t0={t0} y={1110} gap={gapW} title="WRINKLY FINGERS" color={C.lime} s={lanes} />
      </Svg>
      <Pill x={540} y={480} text="2013 EXPERIMENT · WET MARBLES" bg={C.cyan} s={study} size={36} />
      <BigText x={540} y={1265} s={fast} text="WRINKLY = FASTER!" size={72} color={C.lime} rot={-3} />
    </Stage>
  );
};

/* H — channels like tyre treads */
const ShotTire: React.FC<{t: number}> = ({t}) => {
  const a = A.the4 - 0.05;
  const b = A.so3 - 0.05;
  const st = shotStyle(t, a, b, 0.2, 0.2);
  if (!st) return null;
  const tip = springAt(t, a, {damping: 12});
  const flow = ease.out(prog(t, A.channel - 0.1, A.channel + 0.4));
  const tire = springAt(t, A.treads - 0.15, {damping: 11});
  const eq = springAt(t, A.tire, {damping: 9});
  const label = springAt(t, A.channel, {damping: 10});
  return (
    <Stage style={st} camera={cam(kf(t, [[a, 1.0], [b, 1.04, ease.linear]]), 540, 900)}>
      <Svg>
        <Fingertip x={tire > 0.01 ? mix(540, 290, ease.out(prog(t, A.treads - 0.2, A.treads + 0.3))) : 540} y={860} r={mix(250, 200, ease.out(prog(t, A.treads - 0.2, A.treads + 0.3)))} s={tip} wrinkle={1} id="fh" t={t} flow={flow} />
        {tire > 0.001 && (
          <g>
            <Tire x={800} y={860} r={190} s={tire} rot={t * 260} />
            {Array.from({length: 10}, (_, i) => {
              const p = (((t * 1.6 + i * 0.1) % 1) + 1) % 1;
              return <circle key={i} cx={800 - 160 - p * 220} cy={1040 - Math.sin(p * Math.PI) * 120 - (i % 3) * 20} r={9 - p * 5} fill="#4FB8FF" opacity={tire * (1 - p)} />;
            })}
            <rect x={560} y={1052} width={480} height={14} rx={7} fill="#4FB8FF" opacity={0.6 * tire} />
          </g>
        )}
        {eq > 0.001 && (
          <text x={545} y={885} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={700} fontSize={110 * eq} fill="#fff" stroke="#120C33" strokeWidth={14} paintOrder="stroke">
            =
          </text>
        )}
      </Svg>
      <Pill x={540} y={480} text="WRINKLES = WATER CHANNELS" bg="#4FB8FF" color="#fff" s={label} size={40} rot={-2} />
    </Stage>
  );
};

/* I — "So pruney fingers... are your body's built-in rain tires." */
const ShotEnd: React.FC<{t: number}> = ({t}) => {
  const a = A.so3 - 0.05;
  const st = shotStyle(t, a, END + 1, 0.2, 0.01);
  if (!st) return null;
  const hand = springAt(t, a + 0.1, {damping: 11});
  const proud = ease.out(prog(t, A.rain - 0.3, A.rain + 0.1));
  const pose: Partial<PipPose> = {
    x: 360,
    y: 1340,
    scale: 0.95,
    lookX: mix(0.5, 0.05, proud),
    lookY: mix(-0.3, 0, proud),
    lid: mix(0.2, 0.3, proud),
    browL: mix(0.5, 0.9, proud),
    browR: mix(0.5, 0.2, proud),
    smirk: mix(0.3, 0.6, proud),
    smile: mix(0.5, 0.75, proud),
    talk: talkAt(t) * 0.85,
    handL: [-212, 118],
    handR: proud > 0.5 ? [250, -40] : [212, 118],
    antennaGlow: 0.8 + proud * 0.2,
    blush: 0.4,
    tilt: proud * 5,
  };
  return (
    <Stage style={st} camera={cam(kf(t, [[a, 1.0], [END, 1.07, ease.linear]]), 560, 1000)}>
      <Svg>
        <Hand x={800} y={1240} s={0.66 * hand} rot={10} wrinkle={1} t={t} />
        <Pip id="i" t={t} pose={pose} />
      </Svg>
      <Stamp x={540} y={640} t={t} at={A.rain} text="RAIN TIRES" color={C.lime} size={104} tint="rgba(141,255,106,0.10)" />
    </Stage>
  );
};

const CUES: Cue[] = [
  [0, 'blips', 0.3],
  [A.wrinkly - 0.1, 'pop', 0.4],
  [A.bath, 'boing', 0.3],
  [A.most - 0.05, 'whoosh', 0.3],
  [A.nope, 'thud', 0.5],
  [A.its - 0.05, 'whoosh-down', 0.3],
  [A.nervous, 'zap', 0.3],
  [A.after - 0.05, 'whoosh', 0.3],
  [A.five, 'tick', 0.35],
  [A.nerves, 'zap', 0.25],
  [A.shrink - 0.1, 'pop', 0.35],
  [A.folds - 0.1, 'boing', 0.35],
  [A.doctors - 0.05, 'whoosh-down', 0.3],
  [A.noticed, 'ding', 0.3],
  [A.dont, 'thud', 0.4],
  [A.so2 - 0.05, 'whoosh', 0.25],
  [A.grip, 'thud', 0.45],
  [A.in4 - 0.05, 'blips', 0.25],
  [A.faster, 'ding', 0.4],
  [A.the4 - 0.05, 'whoosh-down', 0.3],
  [A.treads - 0.15, 'pop-high', 0.35],
  [A.so3 - 0.25, 'riser', 0.3],
  [A.rain, 'thud', 0.45],
];

/** coverAt: render a single clean frame at that second (no captions, no audio) for the cover image. */
export const Episode007: React.FC<{coverAt?: number}> = ({coverAt}) => {
  const current = useCurrentFrame();
  const t = coverAt ?? current / FPS;
  const frame = Math.round(t * FPS);
  const watery = clamp(Math.min((t - A.most) / 0.4, (A.doctors - t) / 0.4));
  return (
    <AbsoluteFill style={{background: C.bg0}}>
      <Background t={t} hue={-watery * 40} />
      <ShotHook t={t} />
      <ShotMyth t={t} />
      <ShotNerves t={t} />
      <ShotSection t={t} />
      <ShotDoctors t={t} />
      <ShotGrip t={t} />
      <ShotMarbles t={t} />
      <ShotTire t={t} />
      <ShotEnd t={t} />
      <TitleChip t={t} episode="FACT #005" line1="WHY DO FINGERS" line2="WRINKLE IN WATER?" />
      {coverAt === undefined && (
        <Captions t={t} words={words} chunks={chunks} emphasis={['wrinkly', 'bath', 'nope', 'nervous', 'five', 'shrink', 'folds', 'damaged', 'grip', 'marbles', 'faster', 'channel', 'treads', 'tire', 'rain', 'tires']} />
      )}
      <Grain frame={frame} />
      {coverAt === undefined && <SoundDesign vo="episodes/ep007/vo.wav" env={env} end={END} cues={CUES} />}
    </AbsoluteFill>
  );
};
