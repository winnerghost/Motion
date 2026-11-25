import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import timing from '../../../public/episodes/ep002/timing.json';
import {Pip, PipPose} from '../../character/Pip';
import {Background, Grain} from '../../components/Background';
import {Brain} from '../../components/Brain';
import {Captions, TitleChip} from '../../components/Hud';
import {
  Card,
  CommentCard,
  Feather,
  FeelingSlider,
  HaBurst,
  LaughMeter,
  Pill,
  RobotArm,
  Stamp,
  TypeCard,
} from '../../components/Props';
import {clamp, ease, FPS, kf, mix, prog, shake, springAt, within, wobble} from '../../lib/anim';
import {cam, Cue, envAt, shotStyle, SoundDesign, Stage, Svg} from '../../lib/shots';
import {C, FONT_DISPLAY, FONT_HEAD} from '../../lib/theme';

/**
 * FACT #001 · PART 2 — reply to "Bro i can tickle my own foot 😂"
 *
 * Light, itchy tickle (knismesis) can be partly self-produced: the brain
 * attenuates self-touch rather than abolishing it. The laughter-inducing kind
 * (gargalesis) is essentially impossible to produce on yourself.
 * Sources: Blakemore, Wolpert & Frith (1998); Hall & Allin (1897) for the two terms.
 */

const words = timing.words;
const chunks = timing.chunks;
const env = timing.env;
const w = (i: number) => words[i].start;

export const EP002_DURATION = Math.ceil((timing.duration + 0.6) * FPS);
const END = EP002_DURATION / FPS;
const talkAt = (t: number) => envAt(env, t);

export const COMMENT = {user: 'mrkyyyyo', text: 'Bro i can tickle my own foot 😂'};

const T = {
  okay: w(7),
  half: w(9),
  there: w(11),
  two: w(14),
  the: w(18),
  like: w(22),
  yourBrain: w(28),
  turns: w(31),
  down: w(33),
  off: w(35),
  soles: w(38),
  sneaks: w(46),
  through: w(47),
  but: w(48),
  theOne: w(52),
  laugh: w(57),
  youCant: w(62),
  yourBrain2: w(69),
  coming: w(73),
  so2: w(74),
  laughWord: w(79),
  ill: w(80),
};

/* ------------------------------------------------------------------ */
/* A — the comment, and "you're HALF right"                            */
/* ------------------------------------------------------------------ */
const ShotComment: React.FC<{t: number}> = ({t}) => {
  const b = T.there + 0.05;
  const st = shotStyle(t, -1, b, 0.01, 0.22);
  const cardS = springAt(t, -0.1, {damping: 12, stiffness: 190});
  const cardOut = ease.in(prog(t, T.there - 0.35, T.there));
  const sh = shake(t, T.half + 0.05, 20, 0.35);
  const thinking = ease.inOut(prog(t, T.okay - 0.1, T.okay + 0.3)) * (1 - ease.inOut(prog(t, T.half - 0.25, T.half)));
  const soSo = ease.out(prog(t, T.half - 0.15, T.half + 0.1));
  const pose: Partial<PipPose> = {
    x: 540,
    y: 1300,
    scale: 0.9,
    lookY: kf(t, [[0, -0.85], [T.okay - 0.1, -0.85], [T.okay + 0.3, -0.3], [T.half - 0.2, -0.3], [T.half, 0]]),
    lookX: kf(t, [[0, -0.15], [T.okay - 0.1, -0.15], [T.okay + 0.3, 0.65], [T.half - 0.2, 0.65], [T.half, 0]]),
    lid: kf(t, [[0, 0.1], [0.6, 0.38], [T.okay, 0.38], [T.okay + 0.3, 0.2], [T.half, 0.05]]),
    browL: kf(t, [[0, 0.3], [0.6, 0.9], [T.okay, 0.9], [T.okay + 0.3, 0.4], [T.half, 0.8]]),
    browR: kf(t, [[0, 0.3], [0.6, -0.25], [T.okay, -0.25], [T.okay + 0.3, 0.1], [T.half, 0.8]]),
    smirk: kf(t, [[0, 0.2], [0.6, 0.45], [T.okay, 0.45], [T.half, 0.1]]),
    smile: kf(t, [[0, 0.15], [T.half - 0.1, 0.15], [T.half + 0.1, 0.6]]),
    tilt: thinking * 4,
    talk: talkAt(t) * 0.9,
    handR: [mix(mix(212, 52, thinking), 236, soSo), mix(mix(118, 98, thinking), -20 + Math.sin(t * Math.PI * 2 * 4.5) * 22 * soSo, soSo)],
    handL: [-212, 118],
    antennaGlow: 0.6 + thinking * 0.4,
    blush: 0.3,
  };
  return (
    <Stage style={st} camera={cam(kf(t, [[0, 1.0], [b, 1.05, ease.linear]]), 540, 960, 540, 960, sh)}>
      <Svg>
        <Pip id="a" t={t} pose={pose} />
      </Svg>
      <AbsoluteFill style={{transform: `translateY(${-cardOut * 260}px)`, opacity: 1 - cardOut}}>
        <CommentCard x={540} y={600} user={COMMENT.user} text={COMMENT.text} s={cardS} rot={-2} />
        <Stamp x={650} y={690} t={t} at={T.half} text="HALF RIGHT" color={C.pink} size={84} tint="rgba(255,79,139,0.10)" />
      </AbsoluteFill>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* B — two kinds of tickle                                             */
/* ------------------------------------------------------------------ */
const FeatherIcon: React.FC<{t: number}> = ({t}) => (
  <svg width={300} height={200} style={{overflow: 'visible'}}>
    <Feather x={40} y={150} rot={-28} scale={0.95} t={t} />
  </svg>
);
const HaIcon: React.FC = () => (
  <div
    style={{
      fontFamily: FONT_DISPLAY,
      fontWeight: 700,
      fontSize: 130,
      color: C.pink,
      WebkitTextStroke: '14px #120C33',
      paintOrder: 'stroke fill',
      transform: 'rotate(-8deg)',
    }}
  >
    HA!
  </div>
);

const ShotTwoKinds: React.FC<{t: number}> = ({t}) => {
  const a = T.there - 0.1;
  const b = T.like + 0.08;
  const st = shotStyle(t, a, b, 0.22, 0.22);
  const l = springAt(t, T.two - 0.05, {damping: 11});
  const r = springAt(t, T.two + 0.15, {damping: 11});
  const focus = ease.inOut(prog(t, T.the - 0.1, T.the + 0.3));
  return (
    <Stage style={st} camera={cam(1, 540, 960)}>
      <TypeCard x={mix(300, 330, focus)} y={760} w={420} title="LIGHT TICKLE" sub="knismesis" color={C.cyan} s={l * (1 + focus * 0.12)} icon={<FeatherIcon t={t} />} />
      <TypeCard x={mix(780, 820, focus)} y={760} w={420} title="LAUGH TICKLE" sub="gargalesis" color={C.pink} s={r * (1 - focus * 0.12)} dim={focus} icon={<HaIcon />} />
      <Svg>
        <Pip
          id="b"
          t={t}
          pose={{
            x: 540,
            y: 1300,
            scale: 0.55,
            lookY: -0.7,
            lookX: mix(-0.6, 0.6, r) * (1 - focus) - 0.6 * focus,
            smile: 0.6,
            talk: talkAt(t) * 0.8,
            handL: [mix(-212, -230, l), mix(118, -170, l * (1 - r * 0.6) + focus)],
            handR: [mix(212, 230, r), mix(118, -170, r * (1 - focus))],
            antennaGlow: 0.8,
          }}
        />
      </Svg>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* C — Pip tickles its own foot: turned DOWN, not off                   */
/* ------------------------------------------------------------------ */
const ShotFoot: React.FC<{t: number}> = ({t}) => {
  const a = T.like;
  const b = T.but + 0.05;
  const st = shotStyle(t, a, b, 0.24, 0.2);
  const lift = ease.out(prog(t, a + 0.1, a + 0.5));
  const brushing = lift > 0.5;
  const brush = brushing ? Math.sin(t * Math.PI * 2 * 3.6) : 0;
  const sliderS = springAt(t, T.turns - 0.25, {damping: 12});
  const sneak = within(t, T.sneaks, T.but) ? 0.08 * Math.max(0, Math.sin((t - T.sneaks) * 9)) : 0;
  const level = 1 - 0.62 * ease.inOut(prog(t, T.down - 0.05, T.off + 0.1)) + sneak;
  const notOff = springAt(t, T.off - 0.05, {damping: 9, stiffness: 230});
  const glow = ease.out(prog(t, T.soles - 0.1, T.soles + 0.3));
  const giggle = within(t, T.sneaks - 0.05, T.through + 0.55) ? Math.sin(prog(t, T.sneaks - 0.05, T.through + 0.55) * Math.PI) : 0;
  const lookingDown = 1 - ease.inOut(prog(t, T.yourBrain - 0.1, T.yourBrain + 0.2)) + ease.inOut(prog(t, T.soles - 0.1, T.soles + 0.2));
  const ld = clamp(lookingDown);

  const handX = 258 + brush * 20;
  const handY = 230 - lift * 4;
  const sparkles = Array.from({length: 7}, (_, i) => {
    const ang = (i / 7) * Math.PI * 2 + t * 1.5;
    const r = 70 + Math.sin(t * 4 + i) * 14;
    return [84 + Math.cos(ang) * r, 186 + Math.sin(ang) * r * 0.6, i] as const;
  });

  const holding = (
    <g>
      {glow > 0.01 && (
        <g opacity={glow}>
          <ellipse cx={84} cy={188} rx={78} ry={46} fill={C.pink} opacity={0.35} filter="url(#c-glow)" />
          {sparkles.map(([sx, sy, i]) => (
            <circle key={i} cx={sx} cy={sy} r={5 + (i % 3) * 2} fill={i % 2 ? C.cyan : C.yellow} opacity={0.5 + 0.5 * Math.sin(t * 8 + i)} />
          ))}
        </g>
      )}
      {lift > 0.01 && <Feather x={handX} y={handY} rot={190 + brush * 6} scale={0.72} t={t} />}
    </g>
  );

  return (
    <Stage style={st} camera={cam(kf(t, [[a, 1.0], [b, 1.05, ease.linear]]), 540, 1000)}>
      {sliderS > 0.001 && <FeelingSlider x={540} y={565} level={level} s={sliderS} label="LIGHT TICKLE" />}
      {notOff > 0.001 && <Pill x={830} y={735} text="NOT OFF!" bg={C.cyan} s={notOff} size={40} rot={6} />}
      <Svg>
        <defs>
          <filter id="c-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>
        <Pip
          id="c"
          t={t}
          holding={holding}
          pose={{
            x: 540,
            y: 1255,
            scale: 1.0,
            tilt: -3 * lift + wobble(t, 1.4, 'bal') * 2.5 * lift + giggle * Math.sin(t * 30) * 2,
            footTap: 2.0 * lift,
            lookX: mix(0, 0.55, ld),
            lookY: mix(0, 0.85, ld),
            lid: mix(0.1, 0.35, ld) * (1 - giggle),
            happyEyes: giggle > 0.5 ? 1 : 0,
            smile: 0.35 + glow * 0.3 + giggle * 0.5,
            mouthOpen: giggle * 0.4,
            blush: 0.3 + glow * 0.5,
            browL: 0.3 + giggle * 0.4,
            browR: 0.3 + giggle * 0.4,
            talk: giggle > 0.5 ? 0 : talkAt(t) * 0.85,
            handL: [mix(-212, -255, lift), mix(118, -10, lift)],
            handR: [mix(212, handX, lift), mix(118, handY, lift)],
            antennaGlow: 0.6 + glow * 0.4,
          }}
        />
      </Svg>
      {giggle > 0.3 && <HaBurst x={700} y={1000} t={t} at={T.sneaks + 0.05} count={4} />}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* D — the other kind: someone else (the robot) → full laughter        */
/* ------------------------------------------------------------------ */
const ShotLaugh: React.FC<{t: number}> = ({t}) => {
  const a = T.but - 0.05;
  const b = T.youCant + 0.05;
  const st = shotStyle(t, a, b, 0.22, 0.2);
  const laughT = T.laugh - 0.1;
  const laughing = t > laughT;
  const lp = ease.out(prog(t, laughT, laughT + 0.2));
  const sh = shake(t, laughT, 16, 0.6);
  const robotIn = ease.out(prog(t, a, a + 0.55));
  const pillS = springAt(t, a + 0.05, {damping: 10});
  const meterS = springAt(t, a + 0.25, {damping: 12});
  const PX = 380;
  const PY = 1270;
  const PS = 0.85;
  const u = Math.sin(t * Math.PI * 2 * 1.6);
  const v = Math.sin(t * Math.PI * 2 * 3.2) * 0.6;
  const touch: [number, number] = [PX + (80 + u * 46) * PS, PY + (-238 + 96 + v * 40) * PS];
  const bounce = laughing ? Math.abs(Math.sin((t - laughT) * Math.PI * 6)) : 0;
  const meterV = laughing ? 0.05 + 0.93 * springAt(t, laughT, {damping: 7, stiffness: 120}) + wobble(t, 8, 'm2') * 0.03 : 0.04;
  return (
    <Stage style={st} camera={cam(1 + lp * 0.04, 540, 1000, 540, 1000, sh)}>
      {pillS > 0.001 && <Pill x={300} y={500} text="LAUGH TICKLE" bg={C.pink} color="#fff" s={pillS} size={42} rot={-4} />}
      {pillS > 0.001 && (
        <div style={{position: 'absolute', left: 70, width: 460, top: 560, textAlign: 'center', fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 36, color: 'rgba(255,255,255,0.8)', opacity: clamp(pillS)}}>
          needs someone else
        </div>
      )}
      <Svg>
        {meterS > 0.001 && <LaughMeter x={815} y={650} scale={0.62 * meterS * (1 + lp * 0.12)} value={meterV} t={t} opacity={clamp(meterS * 2)} />}
        <Pip
          id="d"
          t={t}
          pose={{
            x: PX,
            y: PY,
            scale: PS,
            hop: bounce * 26 * lp,
            tilt: laughing ? wobble(t, 4, 'dl') * 8 * lp : 0,
            squash: 1 + (laughing ? (bounce - 0.5) * 0.08 * lp : 0),
            happyEyes: lp,
            lid: 0,
            smile: laughing ? 1 : 0.2,
            mouthW: laughing ? 1.25 : 0.9,
            mouthOpen: laughing ? 0.55 + bounce * 0.35 : 0.15,
            browL: laughing ? 0.6 : 0.9,
            browR: laughing ? 0.6 : 0.9,
            lookX: laughing ? 0 : 0.8,
            lookY: laughing ? 0 : 0.2,
            blush: laughing ? 1 : 0.4,
            talk: laughing ? 0 : talkAt(t) * 0.6,
            handL: laughing ? [-150 + bounce * 20, 140] : [-230, 40],
            handR: laughing ? [96, 150 + bounce * 10] : [230, 40],
            antennaGlow: 1,
          }}
        />
        {robotIn > 0.001 && <RobotArm bx={mix(1400, 1010, robotIn)} by={1290} tx={touch[0]} ty={touch[1]} t={t} led={C.pink} />}
      </Svg>
      {laughing && <HaBurst x={PX} y={PY - 300} t={t} at={laughT + 0.05} count={16} />}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* E — try it yourself: deadpan, brain sees it coming                  */
/* ------------------------------------------------------------------ */
const ShotSelf: React.FC<{t: number}> = ({t}) => {
  const a = T.youCant - 0.05;
  const b = T.so2 + 0.05;
  const st = shotStyle(t, a, b, 0.22, 0.2);
  const jit = (s: string, amt: number) => wobble(t, 9, s) * amt;
  const meterS = springAt(t, a + 0.1, {damping: 12});
  const brainS = springAt(t, T.yourBrain2 - 0.05, {damping: 10});
  const predS = springAt(t, T.coming, {damping: 9, stiffness: 230});
  const shifty = kf(t, [[T.yourBrain2, 0], [T.yourBrain2 + 0.2, -0.9], [T.coming, -0.9], [T.coming + 0.2, -0.3]]);
  return (
    <Stage style={st} camera={cam(1, 540, 960)}>
      <Svg>
        {meterS > 0.001 && <LaughMeter x={290} y={620} scale={0.6 * meterS} value={0.002 + Math.max(0, wobble(t, 6, 'e')) * 0.006} t={t} opacity={clamp(meterS * 2)} />}
        {brainS > 0.001 && (
          <Brain id="e" t={t} x={800} y={600 + (1 - brainS) * 80} scale={0.4 * brainS} face={1} mask={1} lookX={shifty} lid={0.25} smile={0.45} smirk={0.6} rot={wobble(t, 1.2, 'er') * 4} />
        )}
        <Pip
          id="e-pip"
          t={t}
          pose={{
            x: 540,
            y: 1270,
            scale: 1.0,
            lid: 0.5,
            smile: 0,
            mouthW: 0.8,
            browL: -0.15,
            browR: -0.15,
            tilt: jit('et', 2.5),
            squash: 1 + jit('es', 0.02),
            talk: talkAt(t) * 0.85,
            handL: [-78 + jit('h1', 26), 104 + jit('h2', 22)],
            handR: [74 + jit('h3', 26), 128 + jit('h4', 22)],
            fingers: 1,
            lookX: 0,
            antennaGlow: 0.5,
          }}
        />
      </Svg>
      {predS > 0.001 && <Pill x={800} y={790} text="PREDICTED ✓" bg={C.cyan} s={predS} size={38} />}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* F — "So go ahead... make yourself LAUGH. I'll wait."                */
/* ------------------------------------------------------------------ */
const ShotOutro: React.FC<{t: number}> = ({t}) => {
  const a = T.so2 - 0.05;
  const st = shotStyle(t, a, END + 1, 0.24, 0.01);
  const crossed = ease.inOut(prog(t, T.ill - 0.25, T.ill + 0.05));
  const waitS = springAt(t, T.ill - 0.1);
  const fill = prog(t, T.ill, END);
  return (
    <Stage style={st} camera={cam(kf(t, [[a, 1.0], [END, 1.07, ease.linear]]), 540, 1000)}>
      {waitS > 0.001 && (
        <Card x={540} y={495} w={420} h={96} s={waitS} style={{borderRadius: 999}}>
          <div style={{position: 'absolute', left: 34, top: 22, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 36, letterSpacing: 5, color: '#fff'}}>WAITING</div>
          <div style={{position: 'absolute', left: 220, right: 34, top: 38, height: 22, borderRadius: 99, background: 'rgba(255,255,255,0.15)'}}>
            <div style={{width: `${fill * 100}%`, height: '100%', borderRadius: 99, background: C.cyan, boxShadow: `0 0 20px ${C.cyan}`}} />
          </div>
        </Card>
      )}
      <Svg>
        <Pip
          id="f"
          t={t}
          pose={{
            x: 540,
            y: 1290,
            scale: 1.2,
            lid: 0.3,
            browL: 0.8,
            browR: -0.1,
            smirk: 0.6,
            smile: 0.45,
            talk: talkAt(t) * 0.7,
            lookX: t > T.ill + 0.2 ? kf(t, [[T.ill + 0.2, 0], [T.ill + 0.4, -0.7], [END, -0.7]]) : 0,
            handL: [mix(-212, 70, crossed), mix(118, 128, crossed)],
            handR: [mix(212, -70, crossed), mix(118, 150, crossed)],
            footTap: t > T.ill + 0.1 ? Math.max(0, Math.sin((t - T.ill - 0.1) * Math.PI * 2 * 2.6)) : 0,
            antennaGlow: 0.8,
            blush: 0.4,
          }}
        />
      </Svg>
    </Stage>
  );
};

const CUES: Cue[] = [
  [0, 'pop-high', 0.45],
  [T.half, 'thud', 0.8],
  [T.two - 0.05, 'pop', 0.45],
  [T.two + 0.15, 'pop-high', 0.45],
  [T.like, 'whoosh', 0.4],
  [T.down - 0.05, 'whoosh-down', 0.45],
  [T.off - 0.05, 'blips', 0.4],
  [T.soles, 'ding', 0.3],
  [T.sneaks, 'pop-high', 0.3],
  [T.sneaks + 0.15, 'pop', 0.25],
  [T.but - 0.05, 'whoosh', 0.45],
  [T.but, 'servo', 0.4],
  [T.laugh - 0.15, 'boing', 0.6],
  [T.laugh, 'pop-high', 0.35],
  [T.laugh + 0.2, 'pop', 0.3],
  [T.laugh + 0.4, 'pop-high', 0.3],
  [T.youCant - 0.05, 'whoosh-down', 0.4],
  [T.yourBrain2 - 0.05, 'glitch', 0.4],
  [T.coming, 'ding', 0.45],
  [T.so2 - 0.05, 'whoosh', 0.35],
  ...Array.from({length: 2}, (_, i): Cue => [T.ill + 0.1 + i / 2.6, i % 2 ? 'tock' : 'tick', 0.4]),
];

export const Episode002: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const hue = prog(t, T.but - 0.1, T.but + 0.3) * (1 - prog(t, T.youCant - 0.1, T.youCant + 0.2));
  return (
    <AbsoluteFill style={{background: C.bg0}}>
      <Background t={t} hue={hue * 38} />
      <ShotComment t={t} />
      <ShotTwoKinds t={t} />
      <ShotFoot t={t} />
      <ShotLaugh t={t} />
      <ShotSelf t={t} />
      <ShotOutro t={t} />
      <TitleChip t={t} episode="FACT #001 · PART 2" line1="CAN YOU TICKLE" line2="YOUR OWN FOOT?" />
      <Captions t={t} words={words} chunks={chunks} emphasis={['half', 'two', 'down', 'off', 'sensitive', 'laugh', "can't", 'coming']} />
      <Grain frame={frame} />
      <SoundDesign vo="episodes/ep002/vo.wav" env={env} end={END} cues={CUES} />
    </AbsoluteFill>
  );
};
