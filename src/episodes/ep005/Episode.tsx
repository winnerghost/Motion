import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import timing from '../../../public/episodes/ep005/timing.json';
import {Pip, PipPose} from '../../character/Pip';
import {Background, Grain} from '../../components/Background';
import {Captions, TitleChip} from '../../components/Hud';
import {CommentCard, Pill, Stamp} from '../../components/Props';
import {SoundRings} from '../../components/Voice';
import {Dummy, DummyHead, DUMMY_HEAD_OFFSET, FoldsBubble, Kazoo, Mic, MuteIcon, Scope} from '../../components/Anatomy';
import {clamp, ease, FPS, kf, mix, prog, shake, springAt, wobble} from '../../lib/anim';
import {cam, Cue, envAt, shotStyle, SoundDesign, Stage, Svg} from '../../lib/shots';
import {C, FONT_DISPLAY} from '../../lib/theme';

/**
 * FACT #003 · PART 2 — reply to @en.zai: "What if I don't have a head?"
 *
 * Science (source-filter model of speech, Fant 1960):
 * - Hearing happens in the inner ear, inside the skull: no head, no hearing.
 * - The voice starts in the larynx, in the neck: the vocal folds vibrate
 *   over a hundred times a second (adult speech averages ~120 Hz men, ~200 Hz women).
 * - On its own that vibration is a buzz; the throat, mouth and nose (the vocal
 *   tract, mostly in the head) shape it into vowels and consonants.
 * The buzz demo is Pip's own line with its vocal tract removed by glottal
 * inverse filtering (LPC), see scripts/make_buzz.py.
 */

const raw = timing.words;
// the first "Hey, I'm Pip!" is played as the bare buzz, so caption it as one
const BUZZ_WORDS: Record<number, string> = {72: 'BZZ,', 73: 'BZZ', 74: 'BZZZT!'};
const words = raw.map((w, i) => (BUZZ_WORDS[i] ? {...w, text: BUZZ_WORDS[i]} : w));
const chunks = timing.chunks;
const env = timing.env;
const w = (i: number) => raw[i].start;

export const EP005_DURATION = Math.ceil((timing.duration + 0.6) * FPS);
const END = EP005_DURATION / FPS;
const talkAt = (t: number) => envAt(env, t);

export const COMMENT = {user: 'en.zai', text: "What if I don't have a head?"};

const T = {
  head1: w(8),
  bold: w(9),
  basically: w(16),
  all: w(17),
  okay: w(19),
  forS: w(20),
  science: w(21),
  problem: w(22),
  ears: w(25),
  hear: w(32),
  nothing: w(33),
  fine: w(34),
  stick: w(36),
  mic: w(38),
  twist: w(41),
  start: w(46),
  it: w(50),
  neck: w(54),
  two: w(55),
  buzzing: w(58),
  hundred: w(61),
  second: w(64),
  on: w(65),
  headBack: w(76),
  shapes: w(77),
  that: w(78),
  buzz: w(79),
  into: w(80),
  hey2: w(82),
  noHead: w(85),
  kazoo: w(91),
  nobody: w(93),
  hear2: w(95),
  including: w(96),
};
const D1: [number, number] = [26.98, 28.1]; // the buzz replaces the first "Hey, I'm Pip!"
const QUIET: [number, number] = [T.hear + 0.45, T.fine - 0.05]; // "...nothing."
const inWin = (t: number, [a, b]: [number, number], f = 0.04) => clamp(Math.min((t - a) / f, (b - t) / f));

/* screen-space overlay layer for a shot (no camera) */
const Overlay: React.FC<{style: React.CSSProperties | null; children: React.ReactNode}> = ({style, children}) =>
  style ? <AbsoluteFill style={{opacity: style.opacity}}>{children}</AbsoluteFill> : null;

/* ------------------------------------------------------------------ */
/* A — the comment · "Bold question... for a guy who is ALL head"       */
/* ------------------------------------------------------------------ */
const ShotComment: React.FC<{t: number}> = ({t}) => {
  const b = T.okay - 0.05;
  const st = shotStyle(t, -1, b, 0.01, 0.2);
  const cardS = springAt(t, -0.1, {damping: 12, stiffness: 190});
  const cardOut = ease.in(prog(t, T.bold - 0.3, T.bold + 0.05));
  const deadpan = ease.out(prog(t, T.bold - 0.15, T.bold + 0.15));
  const lookDown = kf(t, [[T.basically - 0.1, 0], [T.basically + 0.15, 1], [T.all - 0.05, 1], [T.all + 0.1, 0]]);
  const allPop = springAt(t, T.all, {damping: 9, stiffness: 240});
  const sh = shake(t, T.all, 22, 0.35);
  const s = kf(t, [[0, 1.0], [T.bold - 0.1, 1.0], [T.bold + 0.5, 1.22, ease.out], [b, 1.28, ease.linear]]);
  const fy = kf(t, [[0, 960], [T.bold - 0.1, 960], [T.bold + 0.5, 1150, ease.out]]);
  const pose: Partial<PipPose> = {
    x: 540,
    y: 1400,
    scale: 0.85,
    lookY: mix(kf(t, [[0, -0.85], [T.head1 - 0.3, -0.85], [T.head1 + 0.1, 0]]), 0.9, lookDown),
    lookX: kf(t, [[0, -0.1], [T.head1 + 0.1, 0]]),
    lid: mix(mix(0.15, 0.48, deadpan), 0.05, allPop),
    browL: mix(mix(0.5, 0.05, deadpan), 0.9, allPop),
    browR: mix(mix(0.5, 0.05, deadpan), 0.9, allPop),
    smile: mix(mix(0.25, -0.05, deadpan), 0.3, allPop),
    mouthW: mix(1, 0.75, deadpan),
    tilt: lookDown * -4,
    talk: talkAt(t) * 0.85,
    handL: [mix(-212, -236, allPop), mix(118, -30, allPop)],
    handR: [mix(212, 236, allPop), mix(118, -30, allPop)],
    antennaGlow: 0.6 + allPop * 0.4,
    blush: 0.3,
  };
  return (
    <>
      <Stage style={st} camera={cam(s, 540, fy, 540, 960, sh)}>
        <Svg>
          <Pip id="a" t={t} pose={pose} />
        </Svg>
      </Stage>
      <Overlay style={st}>
        <AbsoluteFill style={{transform: `translateY(${-cardOut * 300}px)`, opacity: 1 - cardOut}}>
          <CommentCard x={540} y={720} user={COMMENT.user} text={COMMENT.text} s={cardS} rot={-2} />
        </AbsoluteFill>
        <Stamp x={540} y={560} t={t} at={T.all} text="100% HEAD" color={C.yellow} size={110} tint="rgba(255,216,77,0.10)" />
      </Overlay>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* B..F — the lab: the science dummy loses its head                      */
/* ------------------------------------------------------------------ */
const S = 0.85; // dummy scale
const DX = 430;
const DY = 1180;
const STUMP = DY - 178 * S;
const LARYNX: [number, number] = [DX, DY - 122 * S];
const PARK: [number, number] = [835, 790];
const PARK_S = 0.55;

/** Where the dummy's head is (screen), and whether it is attached. */
function headState(t: number, hx = DX) {
  const home: [number, number] = [hx, DY + DUMMY_HEAD_OFFSET * S];
  const attached = {x: home[0], y: home[1], rot: 0, s: S, on: true};
  const pop1 = T.science;
  const back = T.headBack - 0.25;
  const pop2 = T.noHead + 0.35;
  if (t < pop1) return attached;
  if (t < back) {
    // launch up, spin, then float in the corner like a balloon
    const fly = prog(t, pop1, pop1 + 0.85);
    const e = ease.out(fly);
    const x = mix(home[0], PARK[0], e);
    const y = mix(home[1], PARK[1], e) - Math.sin(fly * Math.PI) * 220;
    const settle = springAt(t, pop1 + 0.85, {damping: 8, stiffness: 120});
    const rot = fly < 1 ? -620 * e : (1 - settle) * 20 + wobble(t, 0.8, 'bob') * 6;
    return {x, y: y + wobble(t, 0.6, 'bobY') * 12, rot, s: mix(S, PARK_S, e), on: false};
  }
  if (t < pop2) {
    const p = ease.inOut(prog(t, back, back + 0.5));
    if (p >= 1) return attached;
    return {x: mix(PARK[0], home[0], p), y: mix(PARK[1], home[1], p) - Math.sin(p * Math.PI) * 160, rot: mix(10, 0, p), s: mix(PARK_S, S, p), on: false};
  }
  const fly = prog(t, pop2, pop2 + 0.9);
  const e = ease.out(fly);
  return {x: mix(home[0], 1250, e), y: mix(home[1], 300, e) - Math.sin(fly * Math.PI) * 160, rot: 540 * e, s: mix(S, 0.6, e), on: false};
}

const ShotLab: React.FC<{t: number}> = ({t}) => {
  const a = T.okay - 0.1;
  const b = T.hey2 - 0.12;
  const st = shotStyle(t, a, b, 0.22, 0.14);
  if (!st) return null;
  const enter = springAt(t, a, {damping: 14, stiffness: 140});
  const dx = mix(-420, DX, enter);
  const hs = headState(t);
  const popSh = shake(t, T.science, 16, 0.3);
  const earGlow = ease.out(prog(t, T.ears - 0.1, T.ears + 0.2)) * (1 - ease.in(prog(t, T.nothing, T.fine)));
  const quiet = inWin(t, QUIET, 0.25);
  const micDrop = ease.in(prog(t, T.stick - 0.1, T.mic + 0.05));
  const micLand = springAt(t, T.mic + 0.05, {damping: 7, stiffness: 260});
  const micOff = ease.in(prog(t, T.headBack - 0.2, T.headBack + 0.25));
  const hasMic = t > T.stick - 0.1 && micOff < 1;
  const demo = inWin(t, D1, 0.05);
  const xray = clamp(ease.out(prog(t, T.it - 0.1, T.neck)) * (1 - ease.inOut(prog(t, T.on + 0.2, T.on + 0.6))) + inWin(t, D1, 0.08));
  const buzz = Math.max(ease.out(prog(t, T.buzzing - 0.1, T.buzzing + 0.2)) * (1 - ease.in(prog(t, T.second + 0.3, T.on + 0.3))), demo);
  const tract = ease.out(prog(t, T.shapes - 0.1, T.shapes + 0.2));
  const parts: [number, number, number] = [ease.out(prog(t, T.that - 0.05, T.that + 0.25)), springAt(t, T.buzz - 0.05, {damping: 10}), ease.out(prog(t, T.into - 0.05, T.into + 0.3))];

  // camera: into the neck for the twist, back out for the demo, onto the head for the shaping
  const zoom = kf(t, [[a, 1], [T.it - 0.05, 1], [T.neck - 0.05, 1.75, ease.out], [T.on - 0.05, 1.8, ease.linear], [T.on + 0.6, 1.0, ease.inOut], [T.headBack + 0.25, 1.0], [T.shapes + 0.3, 1.4, ease.out], [b, 1.45, ease.linear]]);
  const fx = kf(t, [[a, 540], [T.it - 0.05, 540], [T.neck - 0.05, DX + 110, ease.out], [T.on - 0.05, DX + 110], [T.on + 0.6, 540, ease.inOut], [T.headBack + 0.25, 540], [T.shapes + 0.3, DX + 40, ease.out]]);
  const fy = kf(t, [[a, 960], [T.it - 0.05, 960], [T.neck - 0.05, LARYNX[1] + 20, ease.out], [T.on - 0.05, LARYNX[1] + 20], [T.on + 0.6, 960, ease.inOut], [T.headBack + 0.25, 960], [T.shapes + 0.3, DY - 245, ease.out]]);
  const toScr = (x: number, y: number): [number, number] => [540 + (x - fx) * zoom, 960 + (y - fy) * zoom];
  const neckSh = shake(t, T.neck, 14, 0.3);
  const sh = {x: popSh.x + neckSh.x, y: popSh.y + neckSh.y, r: popSh.r + neckSh.r};
  const parkedVis = 1 - ease.inOut(prog(t, T.it - 0.15, T.it + 0.2)) + ease.inOut(prog(t, T.on + 0.3, T.on + 0.7));

  // Pip, narrating from the corner
  const cringe = demo;
  const shapeJoy = ease.out(prog(t, T.shapes, T.shapes + 0.3));
  const pipOut = ease.inOut(prog(t, T.it - 0.2, T.it + 0.2)) * (1 - ease.inOut(prog(t, T.on + 0.2, T.on + 0.6))) + ease.inOut(prog(t, T.shapes - 0.1, T.shapes + 0.3));
  const pip: Partial<PipPose> = {
    x: mix(860, 1250, clamp(pipOut)),
    y: 1760,
    scale: 0.6,
    goggles: ease.out(prog(t, T.forS - 0.1, T.forS + 0.25)),
    lookX: hs.on && t < T.science ? -0.7 : -0.25,
    lookY: t > T.science + 0.6 && t < T.fine ? -0.7 : -0.2,
    lid: Math.max(quiet * 0.35, cringe),
    browL: mix(0.4, -0.2, cringe),
    browR: mix(0.4, -0.2, cringe),
    browAngry: -cringe * 0.8 - quiet * 0.4,
    smile: mix(mix(0.5, -0.3, cringe), 0.7, shapeJoy * (1 - cringe)),
    mouthW: mix(1, 0.7, cringe),
    talk: talkAt(t) * (1 - cringe) * 0.9,
    tilt: cringe * wobble(t, 6, 'cr') * 5,
    squash: 1 + cringe * 0.04 * Math.sin(t * 60),
    hop: springAt(t, T.science, {damping: 6}) * 30 * Math.exp(-Math.max(0, t - T.science) * 3),
    handL: cringe > 0.3 ? [-170, -120] : quiet > 0.3 ? [-60, 40] : [-212, 118],
    handR: cringe > 0.3 ? [170, -120] : t > T.fine && t < T.mic + 0.6 ? [236, -40] : [212, 118],
    antennaGlow: 0.7 + demo * 0.3,
    blush: 0.35,
  };

  const problemS = springAt(t, T.problem, {damping: 10}) * (1 - ease.in(prog(t, T.hear, T.hear + 0.25)));
  const earsS = springAt(t, T.ears + 0.05, {damping: 10}) * (1 - ease.in(prog(t, T.hear, T.hear + 0.25)));
  const muteS = springAt(t, T.nothing - 0.05, {damping: 11}) * (1 - ease.in(prog(t, T.fine - 0.1, T.fine + 0.15)));
  const micPill = springAt(t, T.mic + 0.1, {damping: 10}) * (1 - ease.in(prog(t, T.twist - 0.2, T.twist + 0.1)));
  const xMark = springAt(t, T.start, {damping: 9, stiffness: 240}) * (1 - ease.in(prog(t, T.it - 0.15, T.it + 0.15)));
  const neckPill = springAt(t, T.neck, {damping: 9, stiffness: 230}) * (1 - ease.in(prog(t, T.on, T.on + 0.3)));
  const bubble = springAt(t, T.two - 0.05, {damping: 12, stiffness: 180}) * (1 - ease.in(prog(t, T.on - 0.15, T.on + 0.2)));
  const counter = springAt(t, T.hundred - 0.05, {damping: 9, stiffness: 220}) * (1 - ease.in(prog(t, T.on - 0.15, T.on + 0.2)));
  const scopeS = springAt(t, T.on + 0.25, {damping: 12});
  const scopeVoice = ease.inOut(prog(t, T.shapes, T.into + 0.3));
  const micY = hasMic ? mix(-500, STUMP, micDrop) : 0;
  const counterVal = Math.round(mix(0, 150, ease.out(prog(t, T.hundred - 0.05, T.second + 0.2))));
  const [lx, ly] = toScr(...LARYNX);
  const BUB: [number, number] = [775, 760];
  const labels = [
    {at: T.that, text: 'THROAT', p: [DX, DY - 150 * S] as [number, number], dx: -230, bg: C.cyan},
    {at: T.buzz, text: 'MOUTH', p: [DX, DY - 242 * S] as [number, number], dx: 250, bg: C.cyan},
    {at: T.into, text: 'NOSE', p: [DX, DY - 290 * S] as [number, number], dx: -230, bg: C.lime},
  ];

  return (
    <>
      <Stage style={st} camera={cam(zoom, fx, fy, 540, 960, sh)}>
        <Svg>
          <Dummy
            x={dx}
            y={DY}
            s={S}
            t={t}
            head={hs.on}
            earGlow={hs.on ? earGlow : 0}
            xray={xray}
            buzz={buzz}
            tract={hs.on ? tract : 0}
            tractParts={parts}
            rot={(1 - enter) * -8}
            dim={quiet * 0.35}
          />
          {hasMic && (
            <Mic x={DX + micOff * 260} y={micY - micOff * 260} s={(0.72 + (1 - micLand) * 0.12) * (micDrop > 0 ? 1 : 0)} rot={micOff * 60} t={t} live={demo + buzz * 0.4} />
          )}
          {!hs.on && (
            <g opacity={clamp(parkedVis)}>
              <DummyHead x={hs.x} y={hs.y} s={hs.s} rot={hs.rot} t={t} earGlow={earGlow} shocked={demo} />
              {earGlow > 0.01 && (
                <g>
                  <SoundRings cx={hs.x - 80 * hs.s} cy={hs.y} t={t} color={C.pink} count={3} maxR={90} width={6} opacity={earGlow * (1 - quiet)} />
                  <SoundRings cx={hs.x + 80 * hs.s} cy={hs.y} t={t + 0.3} color={C.pink} count={3} maxR={90} width={6} opacity={earGlow * (1 - quiet)} />
                </g>
              )}
              {xMark > 0.001 && (
                <g transform={`translate(${hs.x} ${hs.y}) scale(${xMark}) rotate(${(1 - xMark) * 40})`}>
                  <path d="M -105 -105 L 105 105 M 105 -105 L -105 105" stroke={C.red} strokeWidth={32} strokeLinecap="round" />
                </g>
              )}
            </g>
          )}
          {muteS > 0.001 && <MuteIcon x={DX} y={STUMP - 230} s={muteS * 0.85} />}
          <Pip id="lab" t={t} pose={pip} />
        </Svg>
        <AbsoluteFill style={{background: '#04020C', opacity: quiet * 0.55, pointerEvents: 'none'}} />
      </Stage>
      <Overlay style={st}>
        {problemS > 0.001 && <Pill x={290} y={560} text="PROBLEM #1" bg={C.yellow} s={problemS} size={44} rot={-4} />}
        {earsS > 0.001 && <Pill x={PARK[0] - 40} y={PARK[1] + 150} text="EARS LIVE HERE" bg={C.pink} color="#fff" s={earsS} size={34} rot={3} />}
        {micPill > 0.001 && <Pill x={DX + 260} y={STUMP - 170} text="MIC" bg={C.cyan} s={micPill} size={44} rot={4} />}
        {neckPill > 0.001 && <Pill x={lx - 210} y={ly - 40} text="NECK" bg={C.pink} color="#fff" s={neckPill} size={44} rot={-4} />}
        {bubble > 0.001 && (
          <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: clamp(bubble * 2) * 0.6}}>
            <path d={`M ${lx + 20} ${ly - 18} L ${BUB[0] - 120} ${BUB[1] - 100} M ${lx + 20} ${ly + 18} L ${BUB[0] - 110} ${BUB[1] + 110}`} stroke="#fff" strokeWidth={4} strokeDasharray="10 10" />
            <circle cx={lx} cy={ly} r={34} fill="none" stroke="#fff" strokeWidth={5} />
          </svg>
        )}
        {bubble > 0.001 && <FoldsBubble x={BUB[0]} y={BUB[1]} r={165} s={bubble} t={t} speed={buzz} />}
        {counter > 0.001 && (
          <div
            style={{
              position: 'absolute',
              left: BUB[0],
              top: BUB[1] + 285,
              transform: `translate(-50%, -50%) scale(${counter * 0.6}) rotate(-4deg)`,
              fontFamily: FONT_DISPLAY,
              fontWeight: 700,
              fontSize: 110,
              color: C.yellow,
              WebkitTextStroke: '16px #120C33',
              paintOrder: 'stroke fill',
              whiteSpace: 'nowrap',
            }}
          >
            {counterVal}+ / SEC
          </div>
        )}
        {scopeS > 0.001 && (
          <Scope
            x={540}
            y={575}
            s={scopeS * 0.88}
            t={t}
            buzz={demo > 0 ? 1 : t < T.shapes ? 0.12 * buzz : 1 - scopeVoice}
            voice={t > T.shapes ? scopeVoice : 0}
            title={t < T.shapes ? (demo > 0 ? 'NO HEAD: JUST THE BUZZ' : 'MIC FEED') : 'WITH A HEAD'}
            color={t < T.shapes ? C.pink : C.cyan}
          />
        )}
        {labels.map((l) => {
          const s = springAt(t, l.at, {damping: 10}) * (hs.on ? 1 : 0);
          if (s <= 0.001) return null;
          const [px, py] = toScr(...l.p);
          return <Pill key={l.text} x={px + l.dx} y={py} text={l.text} bg={l.bg} s={s} size={40} rot={wobble(t, 0.5, l.text) * 3} />;
        })}
      </Overlay>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* G — "Hey, I'm Pip!" (with a head)                                     */
/* ------------------------------------------------------------------ */
const ShotHello: React.FC<{t: number}> = ({t}) => {
  const a = T.hey2 - 0.12;
  const b = T.noHead - 0.04;
  const st = shotStyle(t, a, b, 0.14, 0.16);
  const wave = Math.sin((t - a) * Math.PI * 2 * 2.6);
  const pop = springAt(t, a, {damping: 8, stiffness: 220});
  return (
    <>
      <Stage style={st} camera={cam(kf(t, [[a, 1.08], [b, 1.0, ease.out]]), 540, 1000)}>
        <Svg>
          <SoundRings cx={540} cy={1060} t={t} color={C.cyan} count={3} maxR={300} width={8} opacity={0.6} />
          <Pip
            id="hi"
            t={t}
            pose={{
              x: 540,
              y: 1300,
              scale: 1.0 * (0.85 + 0.15 * pop),
              happyEyes: 0.8,
              smile: 0.9,
              talk: talkAt(t) * 0.9,
              handR: [236, -150 + wave * 30],
              handL: [-212, 118],
              antennaGlow: 1,
              blush: 0.6,
              hop: pop * 26 * Math.exp(-Math.max(0, t - a) * 4),
            }}
          />
        </Svg>
      </Stage>
      <Overlay style={st}>
        <Scope x={540} y={575} s={0.88} t={t} buzz={0} voice={1} title="WITH A HEAD" color={C.cyan} />
      </Overlay>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* H — "So no head? You're basically a kazoo... that nobody can hear."  */
/* ------------------------------------------------------------------ */
const KX = 540;
const ShotKazoo: React.FC<{t: number}> = ({t}) => {
  const a = T.noHead - 0.04;
  const st = shotStyle(t, a, END + 1, 0.16, 0.01);
  if (!st) return null;
  const hs = headState(t, KX);
  const kz = springAt(t, T.kazoo - 0.05, {damping: 9, stiffness: 230});
  const buzzing = kz * (t < T.including ? 1 : 0.3);
  const crowd = ease.out(prog(t, T.nobody - 0.15, T.nobody + 0.5));
  const hush = ease.inOut(prog(t, T.including - 0.25, T.including + 0.35));
  const zoom = kf(t, [[a, 1.0], [T.nobody - 0.15, 1.0], [T.hear2 + 0.2, 0.9, ease.out], [T.including - 0.1, 0.9], [END, 1.08, ease.inOut]]);
  const crowdPos: [number, number, number][] = [
    [140, DY - 70, 0.5],
    [940, DY - 70, 0.5],
    [-40, DY - 150, 0.4],
    [1120, DY - 150, 0.4],
  ];
  return (
    <>
      <Stage style={st} camera={cam(zoom, 540, 1000)}>
        <Svg>
          {crowdPos.map(([cx, cy, cs], i) => {
            const y = cy - (1 - crowd) * 160;
            return (
              <g key={i} opacity={crowd * (1 - hush * 0.6) * (i > 1 ? 0.7 : 0.9)}>
                <Dummy x={cx} y={y} s={cs} t={t + i} head={false} />
                <Kazoo x={cx} y={y - 178 * cs - 26 * cs} s={cs * 0.7} rot={-6} t={t + i * 0.3} buzz={buzzing * crowd} />
              </g>
            );
          })}
          <Dummy x={KX} y={DY} s={S} t={t} head={hs.on} buzz={kz * 0.6} dim={hush * 0.3} />
          {!hs.on && <DummyHead x={hs.x} y={hs.y} s={hs.s} rot={hs.rot} t={t} shocked={1} />}
          {kz > 0.001 && <Kazoo x={KX + 8} y={STUMP - 34} s={kz * 0.9} rot={-6 + wobble(t, 3, 'kz') * 3} t={t} buzz={buzzing} />}
          <Pip
            id="kz"
            t={t}
            pose={{
              x: mix(870, 790, hush),
              y: mix(1760, 1250, hush),
              scale: mix(0.6, 0.95, hush),
              lookX: mix(-0.6, 0, hush),
              lookY: mix(-0.4, 0, hush),
              lid: mix(0.45, 0.3, hush),
              smirk: mix(0.4, 0.25, hush),
              smile: mix(0.2, 0.1, hush),
              browL: mix(0.1, 0.6, hush),
              browR: mix(0.6, 0.6, hush),
              talk: talkAt(t) * 0.8,
              handL: hush > 0.5 ? [-150, 40] : [-212, 118],
              handR: hush > 0.5 ? [120, 20] : [212, 118],
              antennaGlow: mix(0.7, 0.35, hush),
              blush: 0.35,
            }}
          />
        </Svg>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 70% 55%, rgba(0,0,0,0) 25%, rgba(3,2,12,0.85) 100%)', opacity: hush, pointerEvents: 'none'}} />
      </Stage>
      <Overlay style={st}>
        {kz > 0.001 && t < T.nobody && <Pill x={KX + 250} y={STUMP - 230} text="BZZZT" bg={C.yellow} s={kz} size={48} rot={-6} />}
      </Overlay>
    </>
  );
};

const CUES: Cue[] = [
  [0, 'blips', 0.3],
  [T.bold - 0.05, 'tick', 0.3],
  [T.all, 'thud', 0.5],
  [T.okay - 0.12, 'whoosh', 0.35],
  [T.okay + 0.15, 'servo', 0.22],
  [T.forS - 0.1, 'blips', 0.2],
  [T.science, 'pop', 0.6],
  [T.science + 0.05, 'boing', 0.35],
  [T.science + 0.1, 'whoosh', 0.3],
  [T.science + 0.85, 'ding', 0.22],
  [T.problem, 'pop-high', 0.4],
  [T.ears, 'zap', 0.22],
  [T.fine, 'pop-high', 0.3],
  [T.stick - 0.1, 'whoosh-down', 0.35],
  [T.mic + 0.05, 'thud', 0.55],
  [T.twist - 0.25, 'riser', 0.3],
  [T.start, 'glitch', 0.32],
  [T.it - 0.05, 'whoosh', 0.3],
  [T.neck, 'thud', 0.45],
  [T.two - 0.05, 'pop-high', 0.4],
  [T.buzzing, 'servo', 0.22],
  [T.hundred - 0.05, 'blips', 0.3],
  [T.on - 0.05, 'whoosh-down', 0.3],
  [T.headBack - 0.25, 'whoosh', 0.35],
  [T.headBack + 0.25, 'thud', 0.4],
  [T.headBack + 0.28, 'pop', 0.3],
  [T.that - 0.05, 'tick', 0.3],
  [T.buzz - 0.05, 'tock', 0.3],
  [T.into - 0.05, 'tick', 0.3],
  [T.hey2 - 0.1, 'ding', 0.3],
  [T.noHead + 0.35, 'pop', 0.5],
  [T.noHead + 0.4, 'boing', 0.3],
  [T.kazoo - 0.05, 'zap', 0.3],
  [T.nobody - 0.15, 'whoosh-down', 0.3],
];

/** coverAt: render a single clean frame at that second (no captions, no audio) for the cover image. */
export const Episode005: React.FC<{coverAt?: number}> = ({coverAt}) => {
  const current = useCurrentFrame();
  const t = coverAt ?? current / FPS;
  const frame = Math.round(t * FPS);
  const quiet = inWin(t, QUIET, 0.25);
  const lab = inWin(t, [T.okay, T.hey2], 0.4);
  return (
    <AbsoluteFill style={{background: C.bg0}}>
      <Background t={t} hue={-20 * lab + 30 * inWin(t, D1, 0.15)} glow={1 - quiet * 0.7} glowX={lab > 0.5 ? 430 : 540} />
      <ShotComment t={t} />
      <ShotLab t={t} />
      <ShotHello t={t} />
      <ShotKazoo t={t} />
      <TitleChip t={t} episode="FACT #003 · PART 2" line1="WHAT IF YOU HAD" line2="NO HEAD?" />
      {coverAt === undefined && <Captions t={t} words={words} chunks={chunks} emphasis={['head', 'nothing', 'neck', 'folds', 'buzz', 'bzzzt', 'kazoo', 'you']} />}
      <Grain frame={frame} />
      {coverAt === undefined && <SoundDesign
        vo="episodes/ep005/vo.wav"
        env={env}
        end={END}
        cues={CUES}
        voVolume={(tt) => 1 - inWin(tt, D1)}
        layers={[{src: 'episodes/ep005/vo_buzz.wav', volume: (tt) => inWin(tt, D1)}]}
        musicMul={(tt) => (1 - inWin(tt, QUIET, 0.12)) * (1 - 0.85 * inWin(tt, D1, 0.15))}
      />}
    </AbsoluteFill>
  );
};
