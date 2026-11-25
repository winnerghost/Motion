import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import timing from '../../../public/episodes/ep004/timing.json';
import {Pip, PipPose} from '../../character/Pip';
import {Background, Grain} from '../../components/Background';
import {Captions, TitleChip} from '../../components/Hud';
import {Pill} from '../../components/Props';
import {Ear, EqBars, FlowPath, Phone, SoundRings, Sunglasses} from '../../components/Voice';
import {clamp, ease, FPS, kf, mix, prog, shake, springAt, within, wobble} from '../../lib/anim';
import {cam, Cue, envAt, shotStyle, SoundDesign, Stage, Svg} from '../../lib/shots';
import {C, FONT_DISPLAY} from '../../lib/theme';

/**
 * FACT #003 — Why does your voice sound weird in recordings?
 * You hear your own voice through air AND through bone conduction (your skull),
 * which favours low frequencies, so you sound deeper to yourself. A recording only
 * captures the air-conducted sound. Plugging your ears boosts the bone-conducted
 * part (the occlusion effect).
 * The two "Hey, I'm Pip" lines are played through EQ to dramatise the difference.
 */

const words = timing.words;
const chunks = timing.chunks;
const env = timing.env;
const w = (i: number) => words[i].start;
const we = (i: number) => words[i].end;

export const EP004_DURATION = Math.ceil((timing.duration + 0.6) * FPS);
const END = EP004_DURATION / FPS;
const talkAt = (t: number) => envAt(env, t);

const T = {
  who: w(9),
  that: w(11),
  heres: w(12),
  twice: w(18),
  once: w(19),
  and: w(26),
  skull: w(31),
  andYour: w(32),
  deep: w(37),
  so: w(41),
  head: w(44),
  hey1: w(49),
  pip1End: we(51),
  but: w(52),
  actually: w(62),
  hey2: w(66),
  pip2End: we(68),
  try: w(69),
  plug: w(71),
  boomy: w(77),
  thats: w(79),
  andThe: w(82),
  everyone: w(89),
  hears: w(91),
};
// Demo windows: the processed versions replace the main voice here.
const D1: [number, number] = [T.hey1 - 0.12, T.pip1End + 0.25];
const D2: [number, number] = [T.hey2 - 0.12, T.pip2End + 0.3];
const inWin = (t: number, [a, b]: [number, number], f = 0.04) => clamp(Math.min((t - a) / f, (b - t) / f));

/* Pip-local helpers */
const MOUTH: [number, number] = [0, 60];
const EAR: [number, number] = [188, -42];
const AIR_D = `M 60 92 C 250 190 380 60 300 -40 C 270 -78 236 -60 212 -48`;
const BONE_D = `M 24 50 C 70 30 120 0 176 -38`;

/* ------------------------------------------------------------------ */
/* 1 — hook: Pip hears his own recording                               */
/* ------------------------------------------------------------------ */
const ShotHook: React.FC<{t: number}> = ({t}) => {
  const b = T.heres + 0.05;
  const st = shotStyle(t, -1, b, 0.01, 0.2);
  const horror = ease.out(prog(t, T.who - 0.05, T.who + 0.15));
  const sh = shake(t, T.that, 24, 0.45);
  const tremble = horror * Math.sin(t * 45) * 3;
  const s = kf(t, [[0, 1.08], [0.5, 1.0, ease.out], [T.who - 0.05, 1.0], [T.who + 0.15, 1.28, ease.out], [b, 1.3]]);
  const pose: Partial<PipPose> = {
    x: 540,
    y: 1290,
    scale: 1.05,
    lookX: mix(0.75, 0.2, horror),
    lookY: mix(0.1, -0.1, horror),
    lid: mix(0.15, 0, horror),
    smile: mix(0.55, -0.6, horror),
    mouthOpen: horror * 0.75,
    mouthW: mix(1, 0.8, horror),
    browL: mix(0.3, 1, horror),
    browR: mix(0.3, 1, horror),
    tilt: mix(4, -9, horror) + tremble,
    hop: horror * 30 * Math.exp(-(t - T.who) * 3),
    blush: 0.3,
    talk: horror > 0.5 ? 0 : talkAt(t) * 0.85,
    handR: [mix(200, 230, horror), mix(-10, -30, horror)],
    handL: [mix(-212, -250, horror), mix(118, -60, horror)],
    antennaGlow: 0.6 + horror * 0.4,
  };
  const holding = (
    <g>
      <SoundRings cx={260} cy={-40} t={t} color={C.cyan} count={3} maxR={110} width={6} opacity={0.8} />
      <Phone x={232} y={-46} rot={-12 + tremble * 2} scale={0.75} t={t} playing={1} />
    </g>
  );
  return (
    <Stage style={st} camera={cam(s, 540, mix(980, 900, horror), 540, 960, sh)}>
      <Svg>
        <Pip id="h" t={t} pose={pose} holding={holding} />
      </Svg>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* 2 — you hear yourself TWICE: air + skull                             */
/* ------------------------------------------------------------------ */
const ShotTwice: React.FC<{t: number}> = ({t}) => {
  const a = T.heres - 0.05;
  const b = T.andYour + 0.05;
  const st = shotStyle(t, a, b, 0.22, 0.2);
  const earS = springAt(t, a + 0.2, {damping: 9, stiffness: 220});
  const noteS = springAt(t, a + 0.35) * (1 - ease.in(prog(t, T.twice - 0.2, T.twice)));
  const x2 = springAt(t, T.twice, {damping: 8, stiffness: 230});
  const air = ease.inOut(prog(t, T.once, T.once + 0.8));
  const airLbl = springAt(t, T.once + 0.3, {damping: 10});
  const bone = ease.inOut(prog(t, T.and, T.skull + 0.1));
  const boneLbl = springAt(t, T.skull - 0.05, {damping: 10});
  const PX = 540;
  const PY = 1280;
  const PS = 1.0;
  const toScreen = (lx: number, ly: number): [number, number] => [PX + lx * PS, PY + (-238 + ly) * PS];
  const holding = (
    <g>
      {air > 0.01 && <FlowPath d={AIR_D} t={t} color={C.cyan} draw={air} width={9} />}
      {air > 0.01 && <SoundRings cx={MOUTH[0] + 40} cy={MOUTH[1] + 30} t={t} color={C.cyan} count={3} maxR={90} width={5} opacity={air} />}
      {bone > 0.01 && (
        <g>
          <SoundRings cx={60} cy={20} t={t * 1.3} color={C.pink} count={4} maxR={150} width={7} opacity={bone * 0.9} />
          <FlowPath d={BONE_D} t={t} color={C.pink} draw={bone} width={11} />
        </g>
      )}
      <Ear x={EAR[0]} y={EAR[1]} s={earS} glow={Math.max(air, bone) * (0.5 + 0.5 * Math.sin(t * 8))} />
    </g>
  );
  const [ax, ay] = toScreen(330, 80);
  const [bx, by] = toScreen(60, 150);
  const [nx, ny] = toScreen(250, -150);
  return (
    <Stage style={st} camera={cam(1, 540, 960)}>
      <Svg>
        <Pip
          id="tw"
          t={t}
          holding={holding}
          pose={{
            x: PX,
            y: PY,
            scale: PS,
            smile: 0.5,
            browL: 0.4,
            browR: 0.4,
            lookX: bone > 0.3 ? 0.5 : air > 0.3 ? 0.7 : 0,
            lookY: bone > 0.3 ? -0.2 : 0,
            talk: talkAt(t) * 0.9,
            handL: [-212, 118],
            handR: [mix(212, 120, x2), mix(118, -150, x2 * (1 - air))],
            antennaGlow: 0.7,
            blush: 0.3,
          }}
        />
      </Svg>
      {noteS > 0.001 && <Pill x={nx + 70} y={ny - 30} text="ear (for science)" bg="rgba(255,255,255,0.14)" color="#fff" s={noteS} size={28} rot={6} />}
      {x2 > 0.001 && (
        <div style={{position: 'absolute', left: 540, top: 560, transform: `translate(-50%, -50%) scale(${x2}) rotate(-6deg)`, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 170, color: C.yellow, WebkitTextStroke: '18px #120C33', paintOrder: 'stroke fill'}}>
          ×2
        </div>
      )}
      {airLbl > 0.001 && <Pill x={Math.min(ax, 900)} y={ay} text="AIR" bg={C.cyan} s={airLbl} size={44} />}
      {boneLbl > 0.001 && <Pill x={bx} y={by + 40} text="SKULL" bg={C.pink} color="#fff" s={boneLbl} size={44} />}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* 3+4 — skull loves the low end → "in your head" (sunglasses on)       */
/* ------------------------------------------------------------------ */
const ShotHead: React.FC<{t: number}> = ({t}) => {
  const a = T.andYour - 0.05;
  const b = T.but + 0.05;
  const st = shotStyle(t, a, b, 0.22, 0.2);
  const eqS = springAt(t, T.deep - 0.15, {damping: 11}) * (1 - ease.in(prog(t, T.so - 0.1, T.so + 0.15)));
  const glassesDrop = ease.in(prog(t, T.head - 0.1, T.head + 0.3));
  const glassesOn = t > T.head + 0.3;
  const settle = glassesOn ? Math.exp(-(t - T.head - 0.3) * 8) * Math.sin((t - T.head - 0.3) * 30) : 0;
  const cool = ease.out(prog(t, T.head + 0.2, T.head + 0.6));
  const headLbl = springAt(t, T.head, {damping: 10});
  const demo = inWin(t, D1, 0.08);
  const boom = demo * talkAt(t);
  const s = kf(t, [[a, 1.0], [D1[0], 1.0], [D1[1], 1.08, ease.linear]]);
  const holding = (
    <g>
      {demo > 0.01 && <SoundRings cx={0} cy={0} t={t * 0.8} color={C.pink} count={4} maxR={260} width={10} opacity={demo} />}
      {(glassesDrop > 0 || glassesOn) && <Sunglasses dy={mix(-420, 0, glassesDrop) + settle * 8} />}
    </g>
  );
  return (
    <Stage style={st} camera={cam(s * (1 + boom * 0.02), 540, 1000)}>
      {headLbl > 0.001 && <Pill x={540} y={495} text="IN YOUR HEAD" bg={C.pink} color="#fff" s={headLbl} size={48} rot={-3} />}
      <Svg>
        {eqS > 0.001 && <EqBars x={540} y={760} w={620} h={220} t={t} low={1} high={0.3} color={C.pink} s={eqS} />}
        <Pip
          id="hd"
          t={t}
          holding={holding}
          pose={{
            x: 540,
            y: 1290,
            scale: mix(0.8, 1.05, cool),
            smile: mix(0.4, 0.7, cool),
            smirk: cool * 0.6,
            browL: mix(0.3, 0.7, cool),
            browR: mix(0.3, -0.1, cool),
            talk: talkAt(t) * 0.9,
            tilt: cool * 5,
            squash: 1 + boom * 0.06,
            handL: [-212, 118],
            handR: cool > 0.5 ? [250, -90] : [212, 118],
            fingers: 0,
            antennaGlow: 0.8 + cool * 0.2,
            blush: 0.3,
          }}
        />
      </Svg>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* 5+6 — the recording only catches the air part → the thin voice       */
/* ------------------------------------------------------------------ */
const ShotRecording: React.FC<{t: number}> = ({t}) => {
  const a = T.but - 0.05;
  const b = T.try + 0.05;
  const st = shotStyle(t, a, b, 0.22, 0.2);
  const recLbl = springAt(t, a + 0.05, {damping: 10});
  const phoneS = springAt(t, a + 0.15, {damping: 11});
  const slip = ease.in(prog(t, T.actually, D2[0]));
  const fall = ease.in(prog(t, D2[0] - 0.1, D2[0] + 0.35));
  const demo = inWin(t, D2, 0.08);
  const deflate = ease.out(prog(t, D2[0], D2[0] + 0.4));
  const sigh = within(t, T.pip2End + 0.3, T.try) ? Math.sin(prog(t, T.pip2End + 0.3, T.try) * Math.PI) : 0;
  const holding = (
    <g>
      {fall < 1 && <Sunglasses dy={slip * 40 + fall * 420} rot={fall * 40} s={1 - fall * 0.2} />}
    </g>
  );
  return (
    <Stage style={st} camera={cam(kf(t, [[a, 1.0], [D2[0], 1.0], [D2[1], 0.96, ease.out]]), 540, 1000)}>
      {recLbl > 0.001 && <Pill x={540} y={495} text="RECORDING" bg={C.cyan} s={recLbl} size={48} rot={2} />}
      <Svg>
        {phoneS > 0.001 && (
          <g>
            <SoundRings cx={850} cy={760} t={t} color={C.cyan} count={3} maxR={130} width={6} opacity={phoneS * (demo > 0.1 ? 1 : 0.6)} />
            <Phone x={850} y={760} scale={1.15 * phoneS} rot={8} t={t} playing={demo > 0.1 ? 1 : 0.3} />
            {/* pink (skull) waves bounce off — the mic never hears them */}
            {t < D2[0] && (
              <g opacity={phoneS}>
                <path d="M 610 640 q 30 -30 60 0 t 60 0" stroke={C.pink} strokeWidth={11} fill="none" strokeLinecap="round" />
                <circle cx={670} cy={600} r={30} fill={C.red} />
                <path d="M 656 586 l 28 28 M 684 586 l -28 28" stroke="#fff" strokeWidth={8} strokeLinecap="round" />
              </g>
            )}
          </g>
        )}
        {demo > 0.01 && <EqBars x={330} y={760} w={420} h={160} t={t} low={0.25} high={0.6} color={C.cyan} s={demo} />}
        <Pip
          id="rec"
          t={t}
          holding={holding}
          pose={{
            x: 540,
            y: 1290,
            scale: mix(1.05, 0.82, deflate),
            squash: mix(1, 0.9, deflate) - sigh * 0.05,
            smile: mix(0.6, 0.15, deflate),
            smirk: mix(0.5, -0.2, slip),
            lid: deflate * 0.25 + sigh * 0.3,
            browL: mix(0.6, 0.4, deflate),
            browR: mix(-0.1, 0.4, deflate),
            browAngry: -deflate * 0.6,
            lookX: t < T.actually ? 0.7 : mix(0.7, 0, slip),
            lookY: sigh * 0.6,
            blush: 0.3 + deflate * 0.7,
            talk: talkAt(t) * 0.85,
            handL: [-212, 118],
            handR: [212, 118],
            antennaGlow: mix(1, 0.3, deflate),
          }}
        />
      </Svg>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* 7 — try it: plug your ears and talk                                  */
/* ------------------------------------------------------------------ */
const ShotTry: React.FC<{t: number}> = ({t}) => {
  const a = T.try - 0.05;
  const b = T.andThe + 0.05;
  const st = shotStyle(t, a, b, 0.22, 0.2);
  const tryS = springAt(t, T.try, {damping: 8, stiffness: 220});
  const plug = ease.inOut(prog(t, T.plug - 0.1, T.plug + 0.3));
  const boomyS = springAt(t, T.boomy, {damping: 7, stiffness: 200}) * (1 - ease.in(prog(t, T.thats + 0.4, T.andThe)));
  const vib = plug * (0.6 + 0.4 * talkAt(t));
  const holding = (
    <g>
      {plug > 0.3 && <SoundRings cx={0} cy={0} t={t * 1.4} color={C.pink} count={5} maxR={230} width={9} opacity={vib} />}
    </g>
  );
  return (
    <Stage style={st} camera={cam(1, 540, 1000, 540, 1000, shake(t, T.boomy, 12, 0.35))}>
      {tryS > 0.001 && <Pill x={540} y={480} text="TRY IT 👂" bg={C.yellow} s={tryS} size={56} rot={-3} />}
      <Svg>
        <Pip
          id="try"
          t={t}
          holding={holding}
          pose={{
            x: 540,
            y: 1290,
            scale: 1.0,
            lid: plug * 0.95,
            smile: 0.5 + plug * 0.3,
            talk: talkAt(t) * 0.9,
            tilt: plug * wobble(t, 2, 'tt') * 4,
            squash: 1 + vib * 0.03 * Math.sin(t * 40),
            handL: [mix(-212, -186, plug), mix(118, -48, plug)],
            handR: [mix(212, 186, plug), mix(118, -48, plug)],
            antennaGlow: 0.6 + vib * 0.4,
            blush: 0.4,
          }}
        />
      </Svg>
      {boomyS > 0.001 && (
        <div style={{position: 'absolute', left: 540, top: 660, transform: `translate(-50%, -50%) scale(${boomyS}) rotate(${wobble(t, 6, 'bm') * 4}deg)`, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 130, color: C.pink, WebkitTextStroke: '16px #120C33', paintOrder: 'stroke fill', letterSpacing: 6}}>
          BOOOM
        </div>
      )}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* 8 — the brutal truth: everyone else hears the recording              */
/* ------------------------------------------------------------------ */
const ShotTruth: React.FC<{t: number}> = ({t}) => {
  const a = T.andThe - 0.05;
  const st = shotStyle(t, a, END + 1, 0.22, 0.01);
  const realize = ease.out(prog(t, T.everyone - 0.1, T.everyone + 0.3));
  const hide = ease.inOut(prog(t, T.hears + 0.25, T.hears + 0.7));
  const sweat = springAt(t, T.everyone + 0.2, {damping: 10});
  const holding = (
    <g>
      <Phone x={mix(170, 0, hide)} y={mix(-20, -30, hide)} rot={mix(-10, 0, hide)} scale={mix(0.8, 1.9, hide)} t={t} playing={1 - hide} facing={hide > 0.5 ? 'back' : 'front'} />
      {sweat > 0.001 && hide < 0.5 && (
        <path d="M -150 -170 C -170 -140 -176 -118 -160 -106 C -144 -94 -128 -110 -134 -134 C -138 -150 -144 -160 -150 -170 Z" fill="#7FE3FF" opacity={sweat} transform={`translate(0 ${sweat * 10})`} />
      )}
    </g>
  );
  return (
    <Stage style={st} camera={cam(kf(t, [[a, 1.0], [END, 1.08, ease.linear]]), 540, 1000)}>
      <Svg>
        <Pip
          id="tr"
          t={t}
          holding={holding}
          pose={{
            x: 540,
            y: 1500,
            scale: 1.75,
            lookX: mix(0.6, 0, realize),
            lookY: mix(0.2, 0, realize),
            lid: mix(0.3, 0, realize),
            browL: mix(0.2, 0.9, realize),
            browR: mix(0.2, 0.9, realize),
            browAngry: -realize * 0.7,
            smile: mix(0.1, -0.4, realize),
            mouthW: mix(1, 0.7, realize),
            talk: talkAt(t) * 0.55,
            blush: 0.3 + realize * 0.7,
            handR: [mix(170, 60, hide), mix(40, 10, hide)],
            handL: [mix(-212, -60, hide), mix(118, 10, hide)],
            antennaGlow: mix(0.8, 0.3, realize),
          }}
        />
      </Svg>
    </Stage>
  );
};

const CUES: Cue[] = [
  [0, 'blips', 0.3],
  [T.who - 0.1, 'glitch', 0.5],
  [T.that, 'thud', 0.6],
  [T.heres - 0.05, 'whoosh', 0.35],
  [T.heres + 0.15, 'pop-high', 0.4],
  [T.twice, 'pop', 0.5],
  [T.once, 'zap', 0.3],
  [T.skull - 0.05, 'servo', 0.25],
  [T.andYour - 0.05, 'whoosh', 0.3],
  [T.deep - 0.15, 'blips', 0.35],
  [T.head - 0.1, 'whoosh-down', 0.35],
  [T.head + 0.3, 'thud', 0.4],
  [T.head + 0.35, 'ding', 0.35],
  [T.but - 0.05, 'whoosh', 0.35],
  [T.actually, 'boing', 0.3],
  [D2[0] + 0.3, 'thud', 0.25],
  [T.try, 'pop-high', 0.45],
  [T.boomy, 'thud', 0.45],
  [T.andThe - 0.05, 'whoosh-down', 0.35],
  [T.hears + 0.6, 'pop', 0.3],
];

export const Episode004: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const warm = inWin(t, [T.head, D1[1] + 0.2], 0.3);
  const cold = inWin(t, [D2[0], T.try], 0.3);
  return (
    <AbsoluteFill style={{background: C.bg0}}>
      <Background t={t} hue={-55 + warm * 45 - cold * 35} />
      <ShotHook t={t} />
      <ShotTwice t={t} />
      <ShotHead t={t} />
      <ShotRecording t={t} />
      <ShotTry t={t} />
      <ShotTruth t={t} />
      <TitleChip t={t} episode="FACT #003" line1="WHY DOES YOUR VOICE" line2="SOUND SO WEIRD?" />
      <Captions t={t} words={words} chunks={chunks} emphasis={['twice', 'air', 'skull', 'deep', 'boomy', 'everyone']} />
      <Grain frame={frame} />
      <SoundDesign
        vo="episodes/ep004/vo.wav"
        env={env}
        end={END}
        cues={CUES}
        voVolume={(tt) => 1 - Math.max(inWin(tt, D1), inWin(tt, D2))}
        layers={[
          {src: 'episodes/ep004/vo_head.wav', volume: (tt) => inWin(tt, D1)},
          {src: 'episodes/ep004/vo_rec.wav', volume: (tt) => inWin(tt, D2)},
        ]}
        musicMul={(tt) => 1 - 0.8 * Math.max(inWin(tt, D1, 0.2), inWin(tt, D2, 0.2))}
      />
    </AbsoluteFill>
  );
};
