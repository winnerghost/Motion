import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import timing from '../../../public/episodes/ep003/timing.json';
import {Pip, PipPose} from '../../character/Pip';
import {Background, Grain} from '../../components/Background';
import {Captions, TitleChip} from '../../components/Hud';
import {Card, Pill} from '../../components/Props';
import {GutRing, GutTube, Mark, PoopBall, PoopBlob, PoopCube, Rock, Trophy, Wombat} from '../../components/Wombat';
import {clamp, ease, FPS, kf, mix, prog, shake, springAt, within, wobble} from '../../lib/anim';
import {cam, Cue, envAt, shotStyle, SoundDesign, Stage, Svg} from '../../lib/shots';
import {C, FONT_DISPLAY, FONT_HEAD} from '../../lib/theme';

/**
 * FACT #002 — Why does the wombat poop cubes?
 * Sources:
 *  - Yang, Lee, Chan, Martin, Edwards, Carver & Hu (2021) "Intestines of non-uniform
 *    stiffness mold the corners of wombat feces", Soft Matter 17, 475–488.
 *  - Balloon test of uneven stretching: Yang & Hu, APS DFD 2018 (NatGeo / PBS coverage).
 *  - 2019 Ig Nobel Prize in Physics.
 */

const words = timing.words;
const chunks = timing.chunks;
const env = timing.env;
const w = (i: number) => words[i].start;

export const EP003_DURATION = Math.ceil((timing.duration + 0.55) * FPS);
const END = EP003_DURATION / FPS;
const talkAt = (t: number) => envAt(env, t);

const T = {
  cubes: w(3),
  notBalls: w(4),
  balls: w(5),
  notBlobs: w(6),
  blobs: w(7),
  little: w(8),
  cubes2: w(9),
  its: w(10),
  wombat: w(12),
  drop: w(16),
  hundred: w(20),
  day: w(24),
  so: w(25),
  square: w(30),
  round: w(34),
  butt: w(35),
  turns: w(36),
  inside: w(41),
  scientists: w(44),
  slid: w(45),
  intestine: w(53),
  blew: w(55),
  it: w(58),
  stiff: w(61),
  stretchy: w(64),
  as: w(66),
  stiff2: w(72),
  corners: w(79),
  stretchy2: w(82),
  flat: w(86),
  cube: w(88),
  this: w(89),
  ig: w(93),
  prize: w(95),
  why: w(97),
  wombats: w(99),
  rocks: w(107),
  cubes4: w(109),
  roll: w(111),
  probably: w(113),
};

/* ------------------------------------------------------------------ */
/* A — hook: a cube lands. Not balls. Not blobs. Cubes.                */
/* ------------------------------------------------------------------ */
const ShotHook: React.FC<{t: number}> = ({t}) => {
  const b = T.its + 0.05;
  const st = shotStyle(t, -1, b, 0.01, 0.22);
  const land = 0.26;
  const fall = ease.in(prog(t, -0.05, land));
  const impact = t > land ? Math.exp(-(t - land) * 7) * Math.sin((t - land) * 30) : 0;
  const sh = shake(t, land, 22, 0.35);
  const toRow = ease.inOut(prog(t, T.little - 0.2, T.little + 0.25));
  const pipMove = ease.inOut(prog(t, T.notBalls - 0.25, T.notBalls + 0.1));
  const ballS = springAt(t, T.notBalls - 0.05, {damping: 10});
  const blobS = springAt(t, T.notBlobs - 0.05, {damping: 10});
  const xB = springAt(t, T.balls + 0.05, {damping: 9, stiffness: 240});
  const xBl = springAt(t, T.blobs + 0.05, {damping: 9, stiffness: 240});
  const ok = springAt(t, T.cubes2, {damping: 9, stiffness: 240});
  const bigCube = {
    x: mix(400, 850, toRow),
    y: mix(mix(720, 1110, fall), 880, toRow),
    size: mix(240, 150, toRow),
  };
  const pose: Partial<PipPose> = {
    x: mix(800, 540, pipMove),
    y: mix(1290, 1310, pipMove),
    scale: mix(0.75, 0.55, pipMove),
    lid: 0,
    lookX: mix(-0.85, 0, pipMove),
    lookY: mix(0.2, -0.7, pipMove),
    browL: t > land ? 1 : 0.3,
    browR: t > land ? 1 : 0.3,
    mouthOpen: t > land ? 0.55 * (1 - pipMove) : 0,
    smile: mix(-0.1, 0.5, pipMove),
    hop: t > land && t < land + 0.5 ? Math.sin(prog(t, land, land + 0.5) * Math.PI) * 50 : 0,
    tilt: -6 * (1 - pipMove),
    talk: talkAt(t) * 0.85,
    handL: [mix(-240, -230, pipMove), mix(-40, 118, pipMove)],
    handR: [mix(240, 230, pipMove), mix(-40, 118, pipMove)],
    antennaGlow: 1,
  };
  return (
    <Stage style={st} camera={cam(kf(t, [[0, 1.12], [0.5, 1.0, ease.out]]), 540, 1000, 540, 1000, sh)}>
      <Svg>
        {ballS > 0.001 && (
          <g transform={`translate(230 880) scale(${ballS}) translate(-230 -880)`}>
            <PoopBall x={230} y={880} r={72} />
          </g>
        )}
        {blobS > 0.001 && (
          <g transform={`translate(540 880) scale(${blobS}) translate(-540 -880)`}>
            <PoopBlob x={540} y={880} size={170} t={t} />
          </g>
        )}
        {xB > 0.001 && <Mark x={230} y={650} ok={false} s={xB * 1.2} />}
        {xBl > 0.001 && <Mark x={540} y={650} ok={false} s={xBl * 1.2} />}
        {ok > 0.001 && <Mark x={850} y={650} ok s={ok * 1.2} />}
        <g transform={`translate(${bigCube.x} ${bigCube.y}) scale(${1 + impact * 0.12} ${1 - impact * 0.12}) translate(${-bigCube.x} ${-bigCube.y})`}>
          <PoopCube x={bigCube.x} y={bigCube.y} size={bigCube.size} t={t} sparkle={t > land ? 1 : 0} />
        </g>
        <Pip id="a" t={t} pose={pose} />
      </Svg>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* B — meet the wombat: up to 100 a day                                */
/* ------------------------------------------------------------------ */
const SLOTS: [number, number][] = [
  [150, 1262], [240, 1262], [330, 1262], [750, 1262], [840, 1262], [930, 1262],
  [195, 1192], [285, 1192], [795, 1192], [885, 1192], [240, 1122], [840, 1122],
];

const ShotWombat: React.FC<{t: number}> = ({t}) => {
  const a = T.its - 0.05;
  const b = T.so + 0.05;
  const st = shotStyle(t, a, b, 0.22, 0.2);
  const enter = springAt(t, T.wombat - 0.25, {damping: 10, stiffness: 150});
  const nameS = springAt(t, T.wombat + 0.1, {damping: 10});
  const countS = springAt(t, T.drop - 0.1, {damping: 12});
  const n = Math.round(100 * ease.inOut(prog(t, T.drop, T.day + 0.2)));
  return (
    <Stage style={st} camera={cam(1, 540, 1000)}>
      {countS > 0.001 && (
        <Card x={540} y={560} w={600} h={200} s={countS}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 14, textAlign: 'center', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 30, letterSpacing: 5, color: 'rgba(255,255,255,0.75)'}}>
            CUBES A DAY
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 52, textAlign: 'center', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 110, lineHeight: 1, color: C.yellow, textShadow: `0 0 30px ${C.yellow}66`}}>
            <span style={{fontSize: 44, color: '#fff', marginRight: 14}}>UP TO</span>
            {n}
          </div>
        </Card>
      )}
      <Svg>
        {SLOTS.map(([sx, sy], i) => {
          const ts = T.drop - 0.2 + i * 0.14;
          if (t < ts) return null;
          const p = clamp((t - ts) / 0.42);
          const x0 = 540 + (sx < 540 ? -60 : 60);
          const x = mix(x0, sx, p);
          const y = mix(1150, sy, p) - Math.sin(p * Math.PI) * 330;
          const land = p >= 1 ? Math.exp(-(t - ts - 0.42) * 9) : 0;
          return (
            <g key={i} transform={`translate(${x} ${y}) scale(${1 + land * 0.15} ${1 - land * 0.15}) translate(${-x} ${-y})`}>
              <PoopCube x={x} y={y} size={74} rot={(1 - p) * (sx < 540 ? -200 : 200)} />
            </g>
          );
        })}
        <Wombat
          id="wb-b"
          x={540}
          y={1270 + (1 - enter) * 500}
          scale={0.95}
          t={t}
          lid={kf(t, [[a, 0], [T.drop, 0], [T.drop + 0.3, 0.45]])}
          smug={kf(t, [[a, 0.4], [T.drop + 0.3, 0.95]])}
          squash={1 + (1 - enter) * 0.2 + (within(t, T.drop - 0.2, T.day + 0.4) ? Math.sin(t * 22) * 0.012 : 0)}
        />
      </Svg>
      {nameS > 0.001 && <Pill x={540} y={790} text="WOMBAT" bg={C.yellow} s={nameS} size={46} rot={-3} />}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* C — "square poop... with a round butt?"                             */
/* ------------------------------------------------------------------ */
const ShotRound: React.FC<{t: number}> = ({t}) => {
  const a = T.so - 0.05;
  const b = T.turns + 0.05;
  const st = shotStyle(t, a, b, 0.22, 0.2);
  const cubeS = springAt(t, T.square - 0.05, {damping: 10});
  const ringS = springAt(t, T.round - 0.08, {damping: 10});
  const push = ease.in(prog(t, T.butt + 0.05, T.butt + 0.3));
  const bonkT = T.butt + 0.3;
  const back = t > bonkT ? ease.out(prog(t, bonkT, bonkT + 0.35)) : 0;
  const cx = mix(mix(790, 470, push), 640, back);
  const sh = shake(t, bonkT, 18, 0.3);
  const q = springAt(t, bonkT, {damping: 8, stiffness: 260});
  const label = (x: number, text: string, s: number) => (
    <div style={{position: 'absolute', left: x, top: 770, transform: `translate(-50%, 0) scale(${s})`, opacity: clamp(s * 2), fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 40, letterSpacing: 5, color: 'rgba(255,255,255,0.85)'}}>
      {text}
    </div>
  );
  return (
    <Stage style={st} camera={cam(1, 540, 960, 540, 960, sh)}>
      {label(300, 'ROUND EXIT', ringS)}
      {label(790, 'SQUARE POOP', cubeS)}
      <Svg>
        {ringS > 0.001 && (
          <g transform={`translate(300 620) scale(${ringS})`}>
            <circle r={98} fill="#0A0722" stroke="#C98A5C" strokeWidth={30} />
            <circle r={98} fill="none" stroke="#fff" strokeOpacity={0.15} strokeWidth={4} />
          </g>
        )}
        {cubeS > 0.001 && (
          <g transform={`translate(${cx} 720) scale(${cubeS}) rotate(${back * -18 * (1 - back)}) translate(${-cx} -720)`}>
            <PoopCube x={cx} y={720} size={150} />
          </g>
        )}
        <Pip
          id="c"
          t={t}
          pose={{
            x: 540,
            y: 1300,
            scale: 0.75,
            lookY: -0.6,
            lookX: t > bonkT ? 0 : mix(0.6, -0.6, ringS),
            browL: 1,
            browR: -0.4,
            smirk: -0.4,
            smile: 0,
            mouthOpen: t > bonkT ? 0.3 : 0,
            talk: talkAt(t) * 0.85,
            handR: [128, -190],
            handL: [-212, 118],
            fingers: 0.6,
            tilt: wobble(t, 1, 'ct') * 3,
            antennaGlow: 0.5,
          }}
        />
      </Svg>
      {q > 0.001 && (
        <div style={{position: 'absolute', left: 540, top: 500, transform: `translate(-50%, -50%) scale(${q}) rotate(-8deg)`, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 150, color: C.pink, WebkitTextStroke: '16px #120C33', paintOrder: 'stroke fill'}}>
          ?!
        </div>
      )}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* D/E/F — inside the gut: travelling poop, party balloon, uneven bands */
/* ------------------------------------------------------------------ */
const ShotGut: React.FC<{t: number}> = ({t}) => {
  const a = T.turns - 0.05;
  const b = T.as + 0.05;
  const st = shotStyle(t, a, b, 0.24, 0.22);
  const tubeS = springAt(t, a, {damping: 12});
  const poopU = within(t, T.turns, T.scientists) ? mix(0.02, 1.08, ease.inOut(prog(t, T.turns + 0.1, T.inside + 0.9))) : -1;
  const hereS = springAt(t, T.inside - 0.05, {damping: 9}) * (1 - ease.in(prog(t, T.scientists - 0.25, T.scientists)));
  const studyS = springAt(t, T.scientists - 0.05, {damping: 10}) * (1 - ease.in(prog(t, T.it - 0.2, T.it + 0.05)));
  const noteS = springAt(t, T.intestine - 0.1) * (1 - ease.in(prog(t, T.it - 0.2, T.it + 0.05)));
  const balloonIn = ease.inOut(prog(t, T.slid, T.intestine + 0.4));
  const inflate = clamp(springAt(t, T.blew - 0.05, {damping: 8, stiffness: 120}), 0, 1.15);
  const stiffS = springAt(t, T.stiff - 0.05, {damping: 9, stiffness: 230});
  const stretchyS = springAt(t, T.stretchy - 0.05, {damping: 9, stiffness: 230});
  const blewShock = t > T.blew ? Math.exp(-(t - T.blew) * 2.5) : 0;
  return (
    <Stage style={st} camera={cam(1, 540, 960)}>
      {hereS > 0.001 && <Pill x={760} y={630} text="SHAPED IN HERE ↓" bg={C.lime} s={hereS} size={40} rot={-3} />}
      {studyS > 0.001 && <Pill x={540} y={520} text="REAL STUDY" bg={C.yellow} s={studyS} size={42} />}
      {studyS > 0.001 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 578, textAlign: 'center', fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 32, color: 'rgba(255,255,255,0.75)', opacity: clamp(studyS)}}>
          Yang, Hu et al. · Georgia Tech
        </div>
      )}
      {noteS > 0.001 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1000, textAlign: 'center', fontFamily: FONT_DISPLAY, fontWeight: 500, fontStyle: 'italic', fontSize: 30, color: 'rgba(255,255,255,0.6)', opacity: clamp(noteS)}}>
          (from wombats that had been hit by cars)
        </div>
      )}
      {stiffS > 0.001 && <Pill x={540} y={960} text="STIFF" bg="#A6245A" color="#fff" s={stiffS} size={42} />}
      {stretchyS > 0.001 && <Pill x={669} y={640} text="STRETCHY" bg="#FFB3CF" color={C.ink} s={stretchyS} size={42} />}
      <Svg>
        <g transform={`translate(540 810) scale(${tubeS}) translate(-540 -810)`}>
          <GutTube x={540} y={810} w={900} t={t} balloonIn={balloonIn} inflate={inflate} poopU={poopU} />
        </g>
        <Pip
          id="gut"
          t={t}
          pose={{
            x: 540,
            y: 1315,
            scale: 0.5,
            lookY: -0.75,
            lookX: poopU >= 0 ? mix(-0.8, 0.8, clamp(poopU)) : 0,
            smile: 0.5 - blewShock * 0.5,
            mouthOpen: blewShock * 0.6,
            browL: 0.4 + blewShock * 0.6,
            browR: 0.4 + blewShock * 0.6,
            hop: blewShock * 40,
            talk: talkAt(t) * 0.8,
            handL: t > T.stiff - 0.1 ? [-60, -200] : [-230, -150 * hereS],
            handR: t > T.stretchy - 0.1 ? [220, -200] : [230, -150 * hereS],
            antennaGlow: 0.8,
          }}
        />
      </Svg>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* G — cross-section: stiff bands carve corners, stretchy = flat sides */
/* ------------------------------------------------------------------ */
const ShotRing: React.FC<{t: number}> = ({t}) => {
  const a = T.as - 0.05;
  const b = T.this + 0.05;
  const st = shotStyle(t, a, b, 0.24, 0.2);
  const ringS = springAt(t, a, {damping: 12}) * (1 - ease.in(prog(t, T.cube - 0.1, T.cube + 0.15)));
  const poop = ease.out(prog(t, T.as, T.as + 0.4));
  const square = 0.55 * ease.inOut(prog(t, T.stiff2, T.corners + 0.5)) + 0.45 * ease.inOut(prog(t, T.stretchy2, T.flat + 0.5));
  const stiffLabel = springAt(t, T.stiff2 - 0.05, {damping: 10}) * (1 - ease.in(prog(t, T.stretchy2 - 0.25, T.stretchy2)));
  const flatLabel = springAt(t, T.stretchy2 - 0.05, {damping: 10}) * (1 - ease.in(prog(t, T.cube - 0.2, T.cube)));
  const cubeS = springAt(t, T.cube - 0.05, {damping: 8, stiffness: 180});
  const flash = within(t, T.cube - 0.05, T.cube + 0.2) ? 1 - Math.abs(t - T.cube - 0.05) / 0.15 : 0;
  const sectionS = springAt(t, a + 0.1);
  return (
    <Stage style={st} camera={cam(1, 540, 960)}>
      {sectionS > 0.001 && <Pill x={540} y={470} text="CROSS-SECTION" bg="rgba(255,255,255,0.14)" color="#fff" s={sectionS * ringS} size={32} />}
      <Svg>
        {ringS > 0.001 && (
          <g transform={`translate(540 800) scale(${ringS}) translate(-540 -800)`}>
            <GutRing x={540} y={800} r={215} square={square} poop={poop} t={t} labels={within(t, T.stiff2, T.stretchy2) ? 1 : 0} />
          </g>
        )}
        {cubeS > 0.001 && (
          <g transform={`translate(540 1010) scale(${cubeS}) rotate(${(1 - cubeS) * 40}) translate(-540 -1010)`}>
            <PoopCube x={540} y={1010} size={250} t={t} sparkle={1} />
          </g>
        )}
        <Pip
          id="ring"
          t={t}
          pose={{
            x: 170,
            y: 1310,
            scale: 0.5,
            lookY: -0.6,
            lookX: 0.8,
            smile: 0.5 + cubeS * 0.4,
            mouthOpen: cubeS * 0.5,
            talk: talkAt(t) * 0.8,
            handL: cubeS > 0.5 ? [-240, -170] : [-212, 118],
            handR: cubeS > 0.5 ? [240, -170] : [230, -120],
            antennaGlow: 0.6 + cubeS * 0.4,
          }}
        />
      </Svg>
      {stiffLabel > 0.001 && <Pill x={540} y={1150} text="STIFF  →  CORNERS" bg="#A6245A" color="#fff" s={stiffLabel} size={40} />}
      {flatLabel > 0.001 && <Pill x={540} y={1150} text="STRETCHY  →  FLAT SIDES" bg="#FFB3CF" color={C.ink} s={flatLabel} size={40} />}
      {flash > 0 && <AbsoluteFill style={{background: '#fff', opacity: clamp(flash) * 0.6}} />}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* H — the Ig Nobel Prize                                              */
/* ------------------------------------------------------------------ */
const ShotPrize: React.FC<{t: number}> = ({t}) => {
  const a = T.this - 0.05;
  const b = T.why + 0.05;
  const st = shotStyle(t, a, b, 0.22, 0.2);
  const trophyS = springAt(t, T.ig - 0.1, {damping: 9, stiffness: 160});
  const pillS = springAt(t, T.ig, {damping: 10});
  const clap = Math.abs(Math.sin(t * Math.PI * 5));
  const confetti = t > T.prize - 0.1;
  return (
    <Stage style={st} camera={cam(1, 540, 960)}>
      {pillS > 0.001 && <Pill x={540} y={520} text="IG NOBEL PRIZE · PHYSICS" bg={C.yellow} s={pillS} size={42} />}
      {pillS > 0.001 && (
        <div style={{position: 'absolute', left: 60, right: 60, top: 580, textAlign: 'center', fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 32, color: 'rgba(255,255,255,0.78)', opacity: clamp(pillS)}}>
          the prize for research that makes you laugh, then think
        </div>
      )}
      <Svg>
        {confetti &&
          Array.from({length: 40}, (_, i) => {
            const tt = t - (T.prize - 0.1);
            const x0 = 540 + ((i * 97) % 600) - 300;
            const vx = (((i * 53) % 100) - 50) * 6;
            const vy = -900 - ((i * 37) % 500);
            const x = x0 + vx * tt;
            const y = 900 + vy * tt + 1400 * tt * tt;
            const cols = [C.yellow, C.pink, C.cyan, C.lime, '#fff'];
            return <rect key={i} x={x} y={y} width={16} height={26} rx={4} fill={cols[i % 5]} transform={`rotate(${tt * 400 + i * 30} ${x + 8} ${y + 13})`} />;
          })}
        {trophyS > 0.001 && (
          <g transform={`translate(540 1140) scale(${trophyS * 1.35}) translate(-540 -1140)`}>
            <Trophy x={540} y={1140} t={t} />
          </g>
        )}
        <Wombat id="wb-h" x={880} y={1300} scale={0.42} t={t} lid={0.45} smug={1} tilt={wobble(t, 1, 'wh') * 3} />
        <Pip
          id="prize"
          t={t}
          pose={{
            x: 190,
            y: 1310,
            scale: 0.55,
            smile: 0.9,
            mouthOpen: 0.4,
            happyEyes: 1,
            blush: 0.8,
            talk: 0,
            handL: [-60 - clap * 40, -40],
            handR: [60 + clap * 40, -40],
            hop: Math.abs(Math.sin(t * Math.PI * 2.5)) * 20,
            antennaGlow: 1,
          }}
        />
      </Svg>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* I — why cubes? Territory markers that don't roll away               */
/* ------------------------------------------------------------------ */
const ShotRock: React.FC<{t: number}> = ({t}) => {
  const a = T.why - 0.05;
  const b = T.probably - 0.12;
  const st = shotStyle(t, a, b, 0.22, 0.18);
  const rockS = springAt(t, a, {damping: 12});
  const wombatS = springAt(t, T.wombats - 0.2, {damping: 11});
  const cubeT = T.rocks - 0.15;
  const cubeFall = ease.in(prog(t, cubeT, cubeT + 0.3));
  const cubeLand = t > cubeT + 0.3 ? Math.exp(-(t - cubeT - 0.3) * 8) : 0;
  const flagS = springAt(t, cubeT + 0.4, {damping: 9, stiffness: 220});
  const ballT = T.cubes4 - 0.1;
  const bt = t - ballT;
  // ball drops on the rock, then rolls down the right slope and off screen
  const ballFall = ease.in(clamp(bt / 0.3));
  const roll = clamp((bt - 0.3) / 1.4);
  const bx = 740 + ease.in(roll) * 520;
  const by = bt < 0.3 ? mix(380, 1080, ballFall) : 1080 + ease.in(roll) * 220;
  const whyS = springAt(t, T.why, {damping: 9}) * (1 - ease.in(prog(t, T.wombats - 0.2, T.wombats)));
  return (
    <Stage style={st} camera={cam(1, 540, 960)}>
      {whyS > 0.001 && (
        <div style={{position: 'absolute', left: 540, top: 640, transform: `translate(-50%, -50%) scale(${whyS}) rotate(-4deg)`, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 130, color: C.yellow, WebkitTextStroke: '16px #120C33', paintOrder: 'stroke fill', whiteSpace: 'nowrap'}}>
          WHY CUBES?
        </div>
      )}
      <Svg>
        <g transform={`translate(640 1260) scale(${rockS}) translate(-640 -1260)`}>
          <Rock x={640} y={1260} scale={0.95} />
        </g>
        {t > cubeT && (
          <g transform={`translate(600 ${mix(380, 1100, cubeFall)}) scale(${1 + cubeLand * 0.15} ${1 - cubeLand * 0.15}) translate(-600 ${-mix(380, 1100, cubeFall)})`}>
            <PoopCube x={600} y={mix(380, 1100, cubeFall)} size={110} />
            {flagS > 0.001 && (
              <g transform={`translate(600 ${mix(380, 1100, cubeFall) - 120}) scale(${flagS})`}>
                <line x1={0} y1={10} x2={0} y2={-110} stroke="#E6E9F8" strokeWidth={7} strokeLinecap="round" />
                <path d="M 0 -110 L 120 -88 L 0 -60 Z" fill={C.red} />
                <text x={10} y={-78} fontFamily={FONT_HEAD} fontWeight={800} fontSize={26} fill="#fff">
                  MINE
                </text>
              </g>
            )}
          </g>
        )}
        {bt > 0 && bx < 1300 && <PoopBall x={bx} y={by} r={52} rot={roll * 900} />}
        {wombatS > 0.001 && (
          <Wombat id="wb-i" x={200} y={1300 + (1 - wombatS) * 400} scale={0.55} t={t} lid={0.4} smug={0.9} lookX={1} tilt={t > ballT + 0.6 ? wobble(t, 2, 'wi') * 4 : 0} />
        )}
      </Svg>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* J — "Probably."                                                     */
/* ------------------------------------------------------------------ */
const ShotProbably: React.FC<{t: number}> = ({t}) => {
  const a = T.probably - 0.15;
  const st = shotStyle(t, a, END + 1, 0.18, 0.01);
  const shrug = ease.out(prog(t, T.probably, T.probably + 0.25));
  return (
    <Stage style={st} camera={cam(kf(t, [[a, 1.0], [END, 1.06, ease.linear]]), 540, 1000)}>
      <Svg>
        <Pip
          id="prob"
          t={t}
          pose={{
            x: 540,
            y: 1560,
            scale: 1.8,
            lid: 0.4,
            lookX: -0.65,
            browL: 0.8,
            browR: 0.1,
            smirk: 0.55,
            smile: 0.35,
            talk: talkAt(t) * 0.5,
            handL: [mix(-212, -250, shrug), mix(118, -10, shrug)],
            handR: [mix(212, 250, shrug), mix(118, -10, shrug)],
            antennaGlow: 0.8,
            blush: 0.4,
          }}
        />
      </Svg>
    </Stage>
  );
};

const CUES: Cue[] = [
  [0, 'whoosh', 0.35],
  [0.3, 'thud', 0.75],
  [T.notBalls - 0.05, 'pop', 0.4],
  [T.balls + 0.05, 'zap', 0.35],
  [T.notBlobs - 0.05, 'pop', 0.4],
  [T.blobs + 0.05, 'zap', 0.35],
  [T.little - 0.2, 'whoosh', 0.3],
  [T.cubes2, 'ding', 0.5],
  [T.its - 0.05, 'whoosh', 0.4],
  [T.wombat - 0.2, 'pop-high', 0.45],
  ...SLOTS.map((_, i): Cue => [T.drop - 0.2 + i * 0.14 + 0.42, i % 2 ? 'pop' : 'pop-high', 0.18]),
  [T.day, 'blips', 0.35],
  [T.so - 0.05, 'whoosh-down', 0.3],
  [T.square - 0.05, 'pop', 0.4],
  [T.round - 0.08, 'pop-high', 0.4],
  [T.butt + 0.3, 'thud', 0.55],
  [T.butt + 0.3, 'boing', 0.35],
  [T.turns - 0.05, 'whoosh', 0.4],
  [T.inside - 0.05, 'ding', 0.4],
  [T.scientists - 0.05, 'blips', 0.35],
  [T.slid, 'servo', 0.3],
  [T.blew - 0.7, 'riser', 0.45],
  [T.blew, 'pop', 0.5],
  [T.stiff - 0.05, 'pop', 0.4],
  [T.stretchy - 0.05, 'pop-high', 0.4],
  [T.as - 0.05, 'whoosh', 0.4],
  [T.stiff2, 'blips', 0.35],
  [T.stretchy2, 'blips', 0.35],
  [T.cube - 0.05, 'ding', 0.7],
  [T.cube - 0.05, 'pop-high', 0.4],
  [T.this - 0.05, 'whoosh', 0.4],
  [T.ig - 0.1, 'ding', 0.5],
  [T.prize - 0.1, 'blips', 0.4],
  [T.why - 0.05, 'whoosh-down', 0.35],
  [T.rocks + 0.15, 'thud', 0.45],
  [T.cubes4 + 0.2, 'boing', 0.45],
  [T.roll, 'whoosh', 0.35],
  [T.probably - 0.15, 'whoosh-down', 0.3],
];

export const Episode003: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const warm = prog(t, T.its - 0.1, T.its + 0.3) * (1 - prog(t, T.so - 0.1, T.so + 0.2)) + prog(t, T.why - 0.1, T.why + 0.3) * (1 - prog(t, T.probably - 0.2, T.probably));
  return (
    <AbsoluteFill style={{background: C.bg0}}>
      <Background t={t} hue={-warm * 28} />
      <ShotHook t={t} />
      <ShotWombat t={t} />
      <ShotRound t={t} />
      <ShotGut t={t} />
      <ShotRing t={t} />
      <ShotPrize t={t} />
      <ShotRock t={t} />
      <ShotProbably t={t} />
      <TitleChip t={t} episode="FACT #002" line1="WHY DOES THIS ANIMAL" line2="POOP CUBES?" />
      <Captions t={t} words={words} chunks={chunks} emphasis={['cubes', 'square', 'round', 'inside', 'balloon', 'stiff', 'stretchy', 'cube', 'probably']} />
      <Grain frame={frame} />
      <SoundDesign vo="episodes/ep003/vo.wav" env={env} end={END} cues={CUES} />
    </AbsoluteFill>
  );
};
