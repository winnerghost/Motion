import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import timing from '../../../public/episodes/ep008/timing.json';
import {Pip, PipPose} from '../../character/Pip';
import {FoldsBubble, Scope} from '../../components/Anatomy';
import {Background, Grain} from '../../components/Background';
import {Captions, TitleChip} from '../../components/Hud';
import {HeadSection, NOSTRIL, Pinch, PressureBars} from '../../components/Hum';
import {Pill, Stamp} from '../../components/Props';
import {SoundRings} from '../../components/Voice';
import {clamp, ease, FPS, kf, mix, prog, springAt} from '../../lib/anim';
import {cam, Cue, envAt, shotStyle, SoundDesign, Stage, Svg} from '../../lib/shots';
import {C, FONT_DISPLAY, FONT_HEAD} from '../../lib/theme';

/**
 * FACT #006 — Pinch your nose and try to hum.
 * - Humming = voicing with the mouth closed; the vocal folds only vibrate while air flows through
 *   them (a pressure drop across the glottis), and with the mouth shut that air leaves via the nose.
 * - Pinch the nose: the airway above the folds is sealed. It fills for a second or so while the
 *   cheeks/throat stretch, then pressure above the folds equals lung pressure, flow stops, and so
 *   does the vibration (the hum).
 * - A 2-second silent pause is inserted after "I'll wait" (scripts/insert_pause.py) so viewers can try.
 */

const words = timing.words;
const chunks = timing.chunks;
const env = timing.env;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const word = (w: string, nth = 1) => {
  let n = 0;
  for (const x of words) {
    if (norm(x.text) === norm(w) && ++n === nth) return x;
  }
  throw new Error(`EP008: word "${w}" #${nth} not in timing`);
};
const at = (w: string, nth = 1) => word(w, nth).start;

export const EP008_DURATION = Math.ceil((timing.duration + 0.6) * FPS);
const END = EP008_DURATION / FPS;
const talkAt = (t: number) => envAt(env, t);

const A = {
  pinch: at('pinch'),
  close: at('close'),
  hum1: at('hum'),
  go: at('go'),
  wait: at('wait'),
  waitEnd: word('wait').end,
  stopped: at('stopped'),
  heres: at("here's"),
  folds: at('folds'),
  air: at('air'),
  buzz1: at('buzz'),
  with: at('with'),
  shut: at('shut'),
  escapes: at('escapes'),
  nose2: at('nose', 2),
  pinch2: at('pinch', 2),
  nowhere: at('nowhere'),
  second: at('second'),
  cheeks: at('cheeks'),
  pressure: at('pressure'),
  out: at('out'),
  stops: at('stops'),
  buzz2: at('buzz', 2),
  let: at('let'),
  hum3: at('hum', 3),
  back: at('back'),
  so2: at('so', 2),
  nose3: at('nose', 3),
};
/** the silent "try it" window */
const TRY0 = A.waitEnd + 0.15;
const TRY1 = A.stopped - 0.75;

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
  x: 890,
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

/** Pip pinching where a nose would be (between the eyes and the mouth). */
const PINCH_HAND: [number, number] = [18, 2];

/* A + B — the challenge, the silent try-it window, and "Stopped, didn't it?" */
const ShotChallenge: React.FC<{t: number}> = ({t}) => {
  const b = A.heres - 0.05;
  const st = shotStyle(t, -1, b, 0.01, 0.2);
  if (!st) return null;
  const pinch = ease.inOut(prog(t, A.pinch - 0.15, A.pinch + 0.25)) * (1 - ease.inOut(prog(t, TRY1 + 0.1, TRY1 + 0.4)));
  const trying = prog(t, TRY0, TRY1);
  const hum = t > TRY0 && t < TRY1 ? clamp((t - TRY0) / 0.15) * (1 - ease.inOut(prog(t, TRY0 + 1.0, TRY0 + 1.55))) : 0;
  const strain = ease.inOut(prog(t, TRY0 + 0.6, TRY1)) * (1 - ease.out(prog(t, TRY1, TRY1 + 0.35)));
  const laugh = ease.out(prog(t, TRY1 + 0.05, TRY1 + 0.35)) * (1 - ease.inOut(prog(t, A.heres - 0.5, A.heres)));
  const steps = [
    {at: A.pinch, label: 'PINCH YOUR NOSE'},
    {at: A.close, label: 'CLOSE YOUR MOUTH'},
    {at: A.hum1, label: 'HUM'},
  ];
  const list = 1 - ease.in(prog(t, A.go - 0.2, A.go + 0.15));
  const tryS = springAt(t, A.go, {damping: 9, stiffness: 220}) * (1 - ease.in(prog(t, TRY1 - 0.2, TRY1)));
  const scope = springAt(t, TRY0 - 0.35, {damping: 12}) * (1 - ease.in(prog(t, A.stopped + 0.3, A.stopped + 0.6)));
  const stopped = springAt(t, A.stopped - 0.05, {damping: 9, stiffness: 220});
  const pose: Partial<PipPose> = {
    x: 540,
    y: 1460,
    scale: 1.05,
    squash: 1 - strain * 0.1,
    lookX: 0,
    lookY: mix(0, -0.15, strain),
    lid: mix(0, 0.2, strain),
    happyEyes: laugh * 0.9,
    browL: mix(0.5, 0.95, strain),
    browR: mix(0.5, 0.95, strain),
    browAngry: -0.6 * strain,
    smile: t > TRY0 - 0.1 && t < TRY1 ? -0.05 : mix(0.45, 0.9, laugh),
    mouthW: t > TRY0 - 0.1 && t < TRY1 ? 0.5 : 1,
    mouthOpen: laugh * 0.5,
    talk: talkAt(t) * 0.9,
    handR: [mix(212, PINCH_HAND[0], pinch), mix(118, PINCH_HAND[1], pinch)],
    handL: laugh > 0.3 ? [-230, 20] : [-212, 118],
    antennaGlow: 0.6 + hum * 0.4,
    blush: 0.35 + strain * 0.65,
    tilt: Math.sin(t * 22) * 3 * laugh,
  };
  return (
    <Stage style={st} camera={cam(kf(t, [[0, 1.04], [A.go, 1.0, ease.out], [TRY1, 1.06, ease.linear], [b, 1.0, ease.out]]), 540, 960)}>
      <Svg>
        <Pip id="a" t={t} pose={pose} />
        {hum > 0.01 &&
          [0, 1, 2].map((k) => {
            const p = (((t * 0.9 + k / 3) % 1) + 1) % 1;
            return (
              <text key={k} x={640 + k * 50 + p * 120} y={1080 - p * 260} fontFamily={FONT_DISPLAY} fontWeight={700} fontSize={70} fill={C.yellow} stroke="#120C33" strokeWidth={10} paintOrder="stroke" opacity={hum * (1 - p)}>
                ♪
              </text>
            );
          })}
      </Svg>
      {list > 0.01 && (
        <div style={{position: 'absolute', left: 170, top: 470, opacity: list}}>
          {steps.map((s, i) => {
            const on = springAt(t, s.at - 0.05, {damping: 10});
            return on > 0.001 ? (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 22, marginBottom: 18, transform: `translateX(${(1 - on) * -60}px)`, opacity: clamp(on * 2)}}>
                <div style={{width: 64, height: 64, borderRadius: 18, background: C.lime, display: 'grid', placeItems: 'center', fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 40, color: C.ink, boxShadow: '0 0 0 5px #120C33'}}>{i + 1}</div>
                <div style={{fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 62, color: '#fff', WebkitTextStroke: '10px #120C33', paintOrder: 'stroke fill'}}>{s.label}</div>
              </div>
            ) : null;
          })}
        </div>
      )}
      <BigText x={540} y={480} s={tryS} text="TRY IT NOW!" size={120} color={C.lime} />
      {scope > 0.001 && <Scope x={540} y={720} s={scope * 0.95} t={t} buzz={hum} voice={0} title={hum > 0.05 ? 'YOUR HUM: MMMMM…' : 'YOUR HUM: …'} color={C.yellow} />}
      {t > TRY0 && t < TRY1 && (
        <div style={{position: 'absolute', left: 540, top: 900, transform: 'translate(-50%, -50%)', width: 420, height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.15)'}}>
          <div style={{width: `${trying * 100}%`, height: 16, borderRadius: 8, background: C.lime}} />
        </div>
      )}
      <BigText x={540} y={500} s={stopped} text="STOPPED, RIGHT?" size={104} color={C.yellow} />
    </Stage>
  );
};

/* C — vocal folds need airflow to buzz */
const ShotFolds: React.FC<{t: number}> = ({t}) => {
  const a = A.heres - 0.05;
  const b = A.with - 0.05;
  const st = shotStyle(t, a, b, 0.2, 0.2);
  if (!st) return null;
  const bub = springAt(t, a + 0.05, {damping: 12});
  const air = ease.out(prog(t, A.air - 0.1, A.air + 0.3));
  const fast = ease.out(prog(t, A.buzz1 - 0.1, A.buzz1 + 0.2));
  const pill = springAt(t, A.buzz1, {damping: 9});
  return (
    <Stage style={st} camera={cam(kf(t, [[a, 1.0], [b, 1.05, ease.linear]]), 540, 960)}>
      <FoldsBubble x={540} y={700} r={220} s={bub} t={t} speed={mix(0, 1, fast) * air} />
      <Svg>
        {air > 0.01 &&
          [-70, 0, 70].map((dx, k) =>
            [0, 1, 2].map((j) => {
              const p = (((t * 1.2 + j / 3 + k * 0.17) % 1) + 1) % 1;
              const y = 1170 - p * 190;
              return (
                <path key={`${k}-${j}`} d={`M ${540 + dx - 16} ${y + 18} L ${540 + dx} ${y} L ${540 + dx + 16} ${y + 18}`} stroke="#7FE3FF" strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={air * Math.sin(p * Math.PI)} />
              );
            }),
          )}
        <Pip id="c" t={t} pose={smallPip(t)} />
      </Svg>
      {air > 0.01 && (
        <div style={{position: 'absolute', left: 540, top: 1215, transform: 'translate(-50%, -50%)', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: '#7FE3FF', opacity: air}}>
          AIR FROM YOUR LUNGS
        </div>
      )}
      <Pill x={540} y={470} text="AIRFLOW → BUZZ" bg={C.yellow} s={pill} size={48} rot={-2} />
    </Stage>
  );
};

/* D — the airway: mouth shut, nose open → pinched → pressure evens out → let go */
const ShotHead: React.FC<{t: number}> = ({t}) => {
  const a = A.with - 0.05;
  const b = A.so2 - 0.05;
  const st = shotStyle(t, a, b, 0.2, 0.2);
  if (!st) return null;
  const head = springAt(t, a, {damping: 13});
  const close = ease.inOut(prog(t, A.pinch2 - 0.15, A.pinch2 + 0.2));
  const away = ease.inOut(prog(t, A.let - 0.1, A.let + 0.35));
  const blocked = close * (1 - away);
  const flow = ease.out(prog(t, a + 0.1, A.escapes)) * (1 - blocked);
  const pile = ease.out(prog(t, A.pinch2, A.nowhere + 0.6)) * (1 - away);
  const puff = ease.out(prog(t, A.cheeks - 0.15, A.cheeks + 0.45)) * (1 - away);
  const above = mix(0.3, 0.85, ease.inOut(prog(t, A.pressure - 0.1, A.out + 0.3)));
  const bars = springAt(t, A.pressure - 0.2, {damping: 11}) * (1 - ease.in(prog(t, A.let - 0.1, A.let + 0.2)));
  const buzz = 1 - ease.inOut(prog(t, A.buzz2 - 0.25, A.buzz2 + 0.15)) * (1 - away);
  const rings = ease.out(prog(t, A.nose2 - 0.1, A.nose2 + 0.2)) * (1 - blocked) * (t < A.pinch2 || t > A.hum3 - 0.2 ? 1 : 0);
  const shut = springAt(t, A.shut - 0.05, {damping: 10}) * (1 - ease.in(prog(t, A.pinch2 - 0.3, A.pinch2 - 0.05)));
  const exits = springAt(t, A.nose2, {damping: 9}) * (1 - ease.in(prog(t, A.pinch2 - 0.2, A.pinch2)));
  const stuck = springAt(t, A.nowhere, {damping: 9}) * (1 - ease.in(prog(t, A.pressure - 0.4, A.pressure - 0.2)));
  const noBuzz = springAt(t, A.buzz2, {damping: 9}) * (1 - ease.in(prog(t, A.let - 0.1, A.let + 0.1)));
  const backS = springAt(t, A.back - 0.05, {damping: 9});
  const xMark = springAt(t, A.nowhere - 0.1, {damping: 9}) * (1 - away);
  const HX = 430;
  const HY = 880;
  const nx = HX + NOSTRIL[0];
  const ny = HY + NOSTRIL[1];
  return (
    <Stage style={st} camera={cam(kf(t, [[a, 1.0], [A.pinch2, 1.04, ease.out], [b, 1.08, ease.linear]]), 560, 960)}>
      <Svg>
        <HeadSection x={HX} y={HY} s={head} t={t} flow={flow} pile={pile} puff={puff} buzz={buzz} rings={rings} id="hd" />
        <Pinch x={nx - 6} y={ny - 14} close={close} away={away} />
        {xMark > 0.001 && (
          <g transform={`translate(${nx - 30} ${ny - 120}) scale(${xMark})`}>
            <circle r={34} fill={C.red} stroke="#120C33" strokeWidth={6} />
            <path d="M -14 -14 L 14 14 M 14 -14 L -14 14" stroke="#fff" strokeWidth={8} strokeLinecap="round" />
          </g>
        )}
        <PressureBars x={890} y={760} s={bars} above={above} />
      </Svg>
      <Pill x={820} y={1070} text="MOUTH SHUT" bg="#fff" s={shut} size={34} rot={3} />
      <Pill x={560} y={470} text="AIR EXITS THROUGH YOUR NOSE" bg="#7FE3FF" s={exits} size={36} rot={-2} />
      <Pill x={540} y={470} text="AIR HAS NOWHERE TO GO" bg={C.red} color="#fff" s={stuck} size={40} rot={-2} />
      <Pill x={420} y={1250} text="NO AIRFLOW = NO BUZZ" bg={C.yellow} s={noBuzz} size={40} rot={-2} />
      <BigText x={820} y={500} s={backS} text="HUM'S BACK!" size={84} color={C.lime} rot={-4} />
    </Stage>
  );
};

/* E — "So every hum you've ever made... came out of your nose." */
const ShotEnd: React.FC<{t: number}> = ({t}) => {
  const a = A.so2 - 0.05;
  const st = shotStyle(t, a, END + 1, 0.2, 0.01);
  if (!st) return null;
  const shock = ease.out(prog(t, A.nose3 - 0.2, A.nose3 + 0.15));
  const pose: Partial<PipPose> = {
    x: 540,
    y: 1430,
    scale: 1.1,
    lookX: 0,
    lookY: 0,
    lid: mix(0.25, 0, shock),
    browL: mix(0.4, 1, shock),
    browR: mix(0.7, 1, shock),
    smirk: mix(0.45, 0.1, shock),
    smile: mix(0.5, 0.8, shock),
    mouthOpen: shock * 0.3,
    talk: talkAt(t) * 0.85,
    handL: [-212, 118],
    handR: shock > 0.5 ? [...PINCH_HAND] as [number, number] : [212, 118],
    antennaGlow: 1,
    blush: 0.4 + shock * 0.3,
  };
  return (
    <Stage style={st} camera={cam(kf(t, [[a, 1.0], [END, 1.06, ease.linear]]), 540, 960)}>
      <Svg>
        <SoundRings cx={558} cy={1430 - 205 * 1.1 + 4} t={t} color={C.yellow} count={4} maxR={300} speed={1.1} width={10} opacity={0.7} />
        <Pip id="e" t={t} pose={pose} />
      </Svg>
      <Stamp x={540} y={640} t={t} at={A.nose3} text="NOSE-POWERED" color={C.lime} size={96} tint="rgba(141,255,106,0.10)" />
    </Stage>
  );
};

const CUES: Cue[] = [
  [0, 'blips', 0.3],
  [A.pinch, 'pop', 0.35],
  [A.close, 'pop', 0.35],
  [A.hum1, 'pop-high', 0.35],
  [A.go, 'riser', 0.25],
  [TRY0, 'tick', 0.25],
  [TRY0 + 1.0, 'tock', 0.25],
  [A.stopped - 0.05, 'boing', 0.4],
  [A.heres - 0.05, 'whoosh', 0.3],
  [A.buzz1, 'zap', 0.25],
  [A.with - 0.05, 'whoosh-down', 0.3],
  [A.nose2, 'ding', 0.3],
  [A.pinch2, 'thud', 0.4],
  [A.cheeks, 'boing', 0.3],
  [A.stops, 'thud', 0.35],
  [A.let, 'pop-high', 0.35],
  [A.back, 'ding', 0.35],
  [A.so2 - 0.25, 'riser', 0.3],
  [A.nose3, 'thud', 0.45],
];

/** coverAt: render a single clean frame at that second (no captions, no audio) for the cover image. */
export const Episode008: React.FC<{coverAt?: number}> = ({coverAt}) => {
  const current = useCurrentFrame();
  const t = coverAt ?? current / FPS;
  const frame = Math.round(t * FPS);
  const tryHue = clamp(Math.min((t - A.go) / 0.3, (TRY1 + 0.3 - t) / 0.3));
  return (
    <AbsoluteFill style={{background: C.bg0}}>
      <Background t={t} hue={tryHue * 60} />
      <ShotChallenge t={t} />
      <ShotFolds t={t} />
      <ShotHead t={t} />
      <ShotEnd t={t} />
      <TitleChip t={t} episode="FACT #006" line1="PINCH YOUR NOSE" line2="AND TRY TO HUM" />
      {coverAt === undefined && (
        <Captions t={t} words={words} chunks={chunks} emphasis={['pinch', 'close', 'hum', 'stopped', 'folds', 'buzz', 'nose', 'nowhere', 'cheeks', 'pressure', 'stops', 'back']} />
      )}
      <Grain frame={frame} />
      {coverAt === undefined && <SoundDesign vo="episodes/ep008/vo.wav" env={env} end={END} cues={CUES} />}
    </AbsoluteFill>
  );
};
