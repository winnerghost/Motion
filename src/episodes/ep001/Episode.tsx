import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import timing from '../../../public/episodes/ep001/timing.json';
import {Pip, PipPose} from '../../character/Pip';
import {Background, Grain} from '../../components/Background';
import {Brain} from '../../components/Brain';
import {Captions, TitleChip} from '../../components/Hud';
import {
  Card,
  FeelingSlider,
  HaBurst,
  Joystick,
  LaughMeter,
  Pill,
  RobotArm,
  SpeechBubble,
  Stamp,
  WaveCard,
} from '../../components/Props';
import {clamp, ease, FPS, H, kf, mix, prog, shake, springAt, W, within, wobble} from '../../lib/anim';
import {C, FONT_DISPLAY, FONT_HEAD} from '../../lib/theme';

/**
 * FACT #001 — "Why can't you tickle yourself?"
 * Source: Blakemore, Wolpert & Frith (1998) Nature Neuroscience 1:635;
 *         Blakemore, Frith & Wolpert (1999) J. Cognitive Neuroscience 11:551.
 */

const words = timing.words;
const chunks = timing.chunks;
const env = timing.env;
const w = (i: number) => words[i].start;

export const EP001_DURATION = Math.ceil((timing.duration + 0.35) * FPS);

// Key beats, straight from the word timestamps of the voiceover.
const T = {
  rightNow: w(4),
  wait: w(6),
  nothing: w(8),
  yeah: w(9),
  nobody: w(10),
  andNo: w(12),
  notBecause: w(14),
  boring: w(18),
  itsBecause: w(19),
  cheating: w(24),
  every: w(25),
  move: w(28),
  secret: w(32),
  back: w(39),
  so: w(43),
  predict: w(46),
  feel: w(52),
  andWhen: w(53),
  touch: w(56),
  matches: w(57),
  prediction: w(59),
  goes: w(61),
  eh: w(63),
  turns: w(67),
  feeling: w(70),
  down: w(72),
  scientists: w(73),
  they: w(77),
  robot: w(84),
  andWhen2: w(85),
  tiny: w(91),
  fraction: w(95),
  second: w(98),
  started: w(99),
  ticklish: w(103),
  yourBrain: w(105),
  cancel: w(108),
  predict2: w(112),
  soTry: w(113),
  tryAgain: w(114),
};
const END = EP001_DURATION / FPS;

const talkAt = (t: number) => env[Math.max(0, Math.min(env.length - 1, Math.floor(t * FPS)))] ?? 0;

/* ------------------------------------------------------------------ */
/* Shot helpers                                                        */
/* ------------------------------------------------------------------ */

function shotStyle(t: number, a: number, b: number, inDur = 0.24, outDur = 0.2): React.CSSProperties | null {
  if (t < a || t > b) return null;
  const pin = ease.out(prog(t, a, a + inDur));
  const pout = ease.in(prog(t, b - outDur, b));
  return {
    opacity: pin * (1 - pout),
    transform: `scale(${(1.07 - 0.07 * pin) * (1 - 0.05 * pout)})`,
    filter: pin < 1 || pout > 0 ? `blur(${(1 - pin) * 14 + pout * 14}px)` : undefined,
  };
}

/** Camera: zoom s around focus (fx, fy), keeping it at the screen point (cx, cy). */
const cam = (s: number, fx: number, fy: number, cx = 540, cy = 960, sh = {x: 0, y: 0, r: 0}) =>
  `translate(${cx - fx * s + sh.x}px, ${cy - fy * s + sh.y}px) scale(${s}) rotate(${sh.r}deg)`;

const Stage: React.FC<{style: React.CSSProperties | null; camera?: string; children: React.ReactNode}> = ({style, camera, children}) =>
  style ? (
    <AbsoluteFill style={style}>
      <AbsoluteFill style={{transformOrigin: '0 0', transform: camera}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  ) : null;

const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
    {children}
  </svg>
);

/* ------------------------------------------------------------------ */
/* SHOT A — Pip's hook (0 → push into the head)                         */
/* ------------------------------------------------------------------ */

function pipHookPose(t: number): Partial<PipPose> {
  const tickling = t < T.rightNow - 0.05;
  const jit = (s: string, a: number) => wobble(t, 9, s) * a;
  const nod = t > T.yeah - 0.05 && t < T.yeah + 0.45 ? Math.sin(prog(t, T.yeah - 0.05, T.yeah + 0.45) * Math.PI) : 0;
  const crossed = prog(t, T.wait - 0.15, T.wait + 0.15);
  const uncross = prog(t, T.nothing - 0.12, T.nothing + 0.12);
  const shrug = ease.out(prog(t, T.nobody - 0.1, T.nobody + 0.2)) * (1 - ease.inOut(prog(t, T.andNo, T.andNo + 0.3)));
  const stamped = T.boring + 0.12;
  const startle = t > stamped ? Math.exp(-(t - stamped) * 5) : 0;
  const headShake = within(t, stamped + 0.42, stamped + 0.95) ? Math.sin((t - stamped - 0.42) * Math.PI * 2 * 4) * 7 : 0;
  const pointHead = ease.out(prog(t, T.itsBecause - 0.1, T.itsBecause + 0.25));

  // hands
  let hL: [number, number] = [-212, 118];
  let hR: [number, number] = [212, 118];
  if (tickling) {
    hL = [-78 + jit('hl', 26), 104 + jit('hl2', 22)];
    hR = [74 + jit('hr', 26), 128 + jit('hr2', 22)];
  }
  const pointP = ease.out(prog(t, T.rightNow - 0.08, T.rightNow + 0.18));
  if (!tickling) {
    hR = [mix(74, 236, pointP), mix(128, -60, pointP)];
    hL = [mix(-78, -212, pointP), mix(104, 118, pointP)];
  }
  // arms crossed for "I'll wait", then hands on hips
  hL = [mix(hL[0], 70, crossed), mix(hL[1], 128, crossed)];
  hR = [mix(hR[0], -70, crossed), mix(hR[1], 150, crossed)];
  hL = [mix(hL[0], -204, uncross), mix(hL[1], 40, uncross)];
  hR = [mix(hR[0], 204, uncross), mix(hR[1], 40, uncross)];
  // shrug
  hL = [mix(hL[0], -262, shrug), mix(hL[1], -40, shrug)];
  hR = [mix(hR[0], 262, shrug), mix(hR[1], -40, shrug)];
  // "and no" — wagging finger
  const wag = within(t, T.andNo, T.notBecause) ? ease.out(prog(t, T.andNo, T.andNo + 0.15)) * (1 - prog(t, T.notBecause - 0.1, T.notBecause)) : 0;
  hR = [mix(hR[0], 150 + Math.sin(t * Math.PI * 2 * 3.2) * 46, wag), mix(hR[1], -40, wag)];
  // "it's not because you're boring" — open palms toward the viewer
  const palms = ease.out(prog(t, T.notBecause - 0.05, T.notBecause + 0.2)) * (1 - ease.out(prog(t, T.itsBecause - 0.2, T.itsBecause)));
  hL = [mix(hL[0], -236, palms), mix(hL[1], 30, palms)];
  hR = [mix(hR[0], 236, palms), mix(hR[1], 30, palms)];
  // pointing at own head
  hR = [mix(hR[0], 132, pointHead), mix(hR[1], -178, pointHead)];

  const waitLook = within(t, T.wait + 0.3, T.nothing - 0.1) ? kf(t, [[T.wait + 0.3, 0], [T.wait + 0.55, -0.8], [T.wait + 1.05, -0.8], [T.wait + 1.25, 0.8], [T.nothing - 0.3, 0.8], [T.nothing - 0.1, 0]]) : 0;

  return {
    x: 540,
    y: kf(t, [[0, 1250], [T.nobody - 0.1, 1250], [T.nobody + 0.25, 1330, ease.out], [T.andNo, 1330], [T.andNo + 0.35, 1250, ease.out]]),
    scale: kf(t, [[0, 1.15], [T.nobody - 0.1, 1.15], [T.nobody + 0.25, 0.8, ease.out], [T.andNo, 0.8], [T.andNo + 0.35, 1.15, ease.out]]),
    tilt: (tickling ? jit('tilt', 2.5) : 0) + headShake - startle * 6 + kf(t, [[T.nothing - 0.1, 0], [T.nothing + 0.15, -4], [T.yeah, -4], [T.yeah + 0.3, 0]]),
    squash: 1 - nod * 0.07 + (tickling ? jit('sq', 0.02) : 0) + startle * 0.08,
    hop: startle * 40,
    lid: tickling
      ? 0.5
      : kf(t, [[T.rightNow, 0.5], [T.rightNow + 0.15, 0.05], [T.wait, 0.05], [T.wait + 0.2, 0.3], [T.nothing, 0.3], [T.nothing + 0.15, 0.1], [T.yeah, 0.1], [T.yeah + 0.2, 0.32], [T.nobody, 0.32], [T.nobody + 0.15, 0.05]]) * (1 - startle),
    lookX: waitLook,
    lookY: -pointHead * 0.9,
    browL: tickling ? -0.15 : kf(t, [[T.rightNow, 0.6], [T.wait, 0.6], [T.wait + 0.2, 0.1], [T.nothing - 0.1, 0.1], [T.nothing + 0.1, 1], [T.nobody, 1], [T.nobody + 0.15, 0.7], [T.boring, 0.4]]) + startle * 0.6,
    browR: tickling ? -0.15 : kf(t, [[T.rightNow, 0.6], [T.wait, 0.6], [T.wait + 0.2, 0.1], [T.nothing - 0.1, 0.1], [T.nothing + 0.1, -0.35], [T.nobody, -0.35], [T.nobody + 0.15, 0.7], [T.boring, 0.4]]) + startle * 0.6,
    smile: tickling ? 0 : kf(t, [[T.rightNow, 0.55], [T.wait + 0.2, 0.15], [T.nothing, 0.15], [T.yeah, 0.45], [T.nobody, 0.1], [T.andNo, 0.2], [T.boring, 0.35], [stamped, 0], [stamped + 0.45, 0.6]]),
    smirk: kf(t, [[T.wait, 0], [T.wait + 0.2, 0.3], [T.nothing, 0.5], [T.nobody, 0.5], [T.nobody + 0.2, 0]]),
    mouthW: tickling ? 0.8 : 1,
    mouthOpen: startle * 0.5,
    talk: talkAt(t) * 0.9,
    handL: hL,
    handR: hR,
    fingers: tickling ? 1 : 0,
    footTap: within(t, T.wait + 0.2, T.nothing - 0.15) ? Math.max(0, Math.sin((t - T.wait - 0.2) * Math.PI * 2 * 2.6)) : 0,
    antennaGlow: 0.5 + pointHead * 0.5 + Math.max(0, Math.sin(t * 3)) * 0.2,
    blush: 0.25,
  };
}

const ShotHook: React.FC<{t: number}> = ({t}) => {
  const a = 0;
  const b = T.itsBecause + 0.52;
  const st = shotStyle(t, a - 1, b, 0.01, 0.08);
  const sh = shake(t, T.boring + 0.12, 22, 0.35);
  const s = kf(t, [
    [0, 1.14],
    [0.45, 1.0, ease.out],
    [T.rightNow - 0.06, 1.0],
    [T.rightNow + 0.14, 1.2, ease.out],
    [T.wait - 0.1, 1.2],
    [T.wait + 0.2, 1.0, ease.out],
    [T.nothing - 0.06, 1.0],
    [T.nothing + 0.16, 1.32, ease.out],
    [T.nobody - 0.1, 1.32],
    [T.nobody + 0.25, 1.0, ease.out],
    [T.itsBecause + 0.05, 1.0],
    [b, 5.2, ease.in],
  ]);
  const fy = kf(t, [[0, 960], [T.rightNow - 0.06, 960], [T.rightNow + 0.14, 900], [T.wait - 0.1, 900], [T.wait + 0.2, 960], [T.nothing - 0.06, 960], [T.nothing + 0.16, 900], [T.nobody - 0.1, 900], [T.nobody + 0.25, 960], [T.itsBecause + 0.05, 960], [b, 790, ease.in]]);
  const pushBlur = prog(t, T.itsBecause + 0.25, b) * 10;
  const pose = pipHookPose(t);

  // "I'll wait" loading pill
  const waitS = springAt(t, T.wait + 0.1) * (1 - ease.in(prog(t, T.nothing - 0.15, T.nothing)));
  const waitFill = prog(t, T.wait + 0.2, T.nothing - 0.15);
  // laugh-o-meter for "Nobody can."
  const meterS = springAt(t, T.nobody - 0.05, {damping: 12}) * (1 - ease.in(prog(t, T.andNo, T.andNo + 0.25)));
  const meterV = 0.002 + Math.max(0, wobble(t, 6, 'needle')) * 0.007;

  return (
    <Stage style={st ? {...st, filter: pushBlur > 0 ? `blur(${pushBlur}px)` : st.filter} : null} camera={cam(s, 540, fy, 540, 960, sh)}>
      <Svg>
        <Pip id="hook" t={t} pose={pose} />
        {meterS > 0.001 && <LaughMeter x={540} y={700} scale={0.95 * meterS} value={meterV} t={t} opacity={clamp(meterS * 2)} />}
      </Svg>
      {waitS > 0.001 && (
        <Card x={540} y={490} w={420} h={96} s={waitS} style={{borderRadius: 999}}>
          <div style={{position: 'absolute', left: 34, top: 22, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 36, letterSpacing: 5, color: '#fff'}}>
            WAITING
          </div>
          <div style={{position: 'absolute', left: 220, right: 34, top: 38, height: 22, borderRadius: 99, background: 'rgba(255,255,255,0.15)'}}>
            <div style={{width: `${waitFill * 100}%`, height: '100%', borderRadius: 99, background: C.cyan, boxShadow: `0 0 20px ${C.cyan}`}} />
          </div>
        </Card>
      )}
      <Stamp x={540} y={640} t={t} at={T.boring + 0.12} strikeAt={T.boring + 0.5} text="BORING" />
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* SHOT B — the cheating brain, then the "secret copy" diagram          */
/* ------------------------------------------------------------------ */

type Seg = [number, number, number, number, number, number, number, number];
function bez(segs: Seg[], u: number): [number, number] {
  const n = segs.length;
  const k = Math.min(n - 1, Math.floor(u * n));
  const p = u * n - k;
  const [x0, y0, x1, y1, x2, y2, x3, y3] = segs[k];
  const q = 1 - p;
  return [
    q * q * q * x0 + 3 * q * q * p * x1 + 3 * q * p * p * x2 + p * p * p * x3,
    q * q * q * y0 + 3 * q * q * p * y1 + 3 * q * p * p * y2 + p * p * p * y3,
  ];
}
const segsToD = (segs: Seg[]) => `M ${segs[0][0]} ${segs[0][1]} ` + segs.map((s) => `C ${s[2]} ${s[3]} ${s[4]} ${s[5]} ${s[6]} ${s[7]}`).join(' ');

const NERVE: Seg[] = [
  [560, 590, 610, 700, 660, 820, 666, 950],
  [666, 950, 672, 1060, 470, 1080, 300, 1140],
];
const COPY_PATH: Seg[] = [[560, 560, 640, 330, 930, 480, 745, 830]];

const ShotBrain: React.FC<{t: number}> = ({t}) => {
  const a = T.itsBecause + 0.46;
  const b = T.andWhen + 0.12;
  const st = shotStyle(t, a, b, 0.2, 0.22);
  const diag = ease.inOut(prog(t, T.every - 0.1, T.every + 0.45));
  const enter = springAt(t, a, {damping: 10, stiffness: 140});
  const sh = shake(t, T.cheating + 0.05, 26, 0.4);
  const shifty = kf(t, [[a, 0], [a + 0.25, -0.85], [a + 0.65, -0.85], [a + 0.8, 0.85], [T.cheating - 0.1, 0.85], [T.cheating + 0.1, 0]]);
  const mask = springAt(t, T.cheating, {damping: 9, stiffness: 240}) * (1 - diag);
  const face = 1 - diag;
  const motorGlow = within(t, T.move - 0.1, T.secret + 0.6) ? Math.sin(prog(t, T.move - 0.1, T.secret + 0.6) * Math.PI) : 0;

  // signal travelling down the nerve to Pip's hand
  const pulseU = prog(t, T.move, T.move + 0.55);
  const pulse = within(t, T.move, T.move + 0.6) ? bez(NERVE, ease.inOut(pulseU)) : null;
  const nerveDraw = ease.out(prog(t, T.every + 0.1, T.move + 0.1));

  // secret copy flying to the cerebellum
  const copyS = springAt(t, T.secret - 0.05, {damping: 10, stiffness: 220});
  const copyU = ease.inOut(prog(t, T.secret + 0.45, T.back + 0.35));
  const [cx, cy] = bez(COPY_PATH, copyU);
  const copyArrive = T.back + 0.35;
  const copyVis = t < copyArrive + 0.12;
  const copyScale = copyS * (1 - ease.in(prog(t, copyArrive - 0.25, copyArrive + 0.1)) * 0.85);
  const cereb = t > copyArrive ? 0.55 + 0.45 * Math.exp(-(t - copyArrive) * 3) : 0;
  const cerebLabel = springAt(t, copyArrive + 0.05) * (1 - ease.in(prog(t, T.so + 0.1, T.so + 0.3)));

  // prediction card
  const predS = springAt(t, T.so + 0.1, {damping: 12});
  const predDraw = ease.inOut(prog(t, T.predict, T.feel + 0.3));

  // Pip (small, narrating from the corner)
  const pipS = springAt(t, T.every, {damping: 11});
  const wave = ease.out(prog(t, T.move - 0.2, T.move + 0.05)) * (1 - ease.inOut(prog(t, T.move + 0.55, T.move + 0.85)));
  const tickle = ease.inOut(prog(t, T.move + 0.55, T.move + 0.85));

  const bx = mix(540, 540, diag);
  const by = mix(820, 700, diag);
  const bs = mix(1.15, 0.92, diag) * (0.6 + 0.4 * enter);

  return (
    <Stage style={st} camera={cam(1, 540, 960, 540, 960, sh)}>
      <Svg>
        <defs>
          <filter id="pulse-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>
        {/* nerve */}
        {diag > 0.01 && (
          <g opacity={diag}>
            <path d={segsToD(NERVE)} stroke={C.cyan} strokeOpacity={0.18} strokeWidth={22} fill="none" strokeLinecap="round" />
            <path d={segsToD(NERVE)} stroke={C.cyan} strokeOpacity={0.55} strokeWidth={6} fill="none" strokeDasharray="4 18" strokeLinecap="round" pathLength={1000} strokeDashoffset={-t * 60} style={{opacity: nerveDraw}} />
          </g>
        )}
        <Brain
          id="b1"
          t={t}
          x={bx + wobble(t, 1.5, 'bx') * 6 * face}
          y={by}
          scale={bs}
          rot={wobble(t, 1.2, 'br') * 3 * face + (mask > 0.5 ? Math.sin(t * 20) * 1.5 * Math.exp(-(t - T.cheating) * 4) : 0)}
          face={face}
          lookX={shifty}
          lid={0.28}
          smile={0.45}
          smirk={0.6}
          mask={mask}
          motorGlow={motorGlow}
          cerebGlow={cereb}
          squash={1 + (1 - enter) * 0.2}
        />
        {pulse && (
          <g>
            <circle cx={pulse[0]} cy={pulse[1]} r={34} fill={C.cyan} filter="url(#pulse-glow)" />
            <circle cx={pulse[0]} cy={pulse[1]} r={14} fill="#fff" />
          </g>
        )}
        {pipS > 0.001 && (
          <Pip
            id="pipB"
            t={t}
            pose={{
              x: 250,
              y: 1260 + (1 - pipS) * 300,
              scale: 0.5,
              lid: 0.15,
              smile: 0.45,
              talk: talkAt(t) * 0.8,
              lookX: 0.5,
              lookY: -0.6,
              handR: [mix(mix(212, 230, 0), 60, tickle) + wave * Math.sin(t * 20) * 30, mix(mix(118, -150, wave), 120, tickle)],
              handL: [mix(-212, -70, tickle), mix(118, 110, tickle)],
              fingers: tickle,
              antennaGlow: 0.6,
            }}
          />
        )}
      </Svg>
      {copyVis && copyS > 0.001 && (
        <div
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            width: 190,
            height: 230,
            transform: `translate(-50%, -50%) scale(${copyScale}) rotate(${mix(-8, 14, copyU)}deg)`,
            background: '#FFF8E8',
            borderRadius: 18,
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            padding: '20px 18px',
          }}
        >
          <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 34, color: C.ink, letterSpacing: 2}}>COPY</div>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{height: 12, width: `${[90, 70, 84, 55][i]}%`, background: '#D9D2C0', borderRadius: 6, marginTop: 12}} />
          ))}
          <div
            style={{
              position: 'absolute',
              left: 12,
              bottom: 26,
              transform: 'rotate(-14deg)',
              border: `5px solid ${C.red}`,
              color: C.red,
              fontFamily: FONT_HEAD,
              fontWeight: 800,
              fontSize: 26,
              padding: '2px 10px',
              borderRadius: 8,
              letterSpacing: 1,
            }}
          >
            TOP SECRET
          </div>
        </div>
      )}
      {cerebLabel > 0.001 && <Pill x={745} y={985} text="CEREBELLUM" s={cerebLabel} size={34} />}
      {predS > 0.001 && (
        <WaveCard x={735} y={1080} w={560} title="PREDICTION" color={C.cyan} t={t} draw={predDraw} s={predS} phase={0.1} />
      )}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* SHOT C — prediction matches touch → "eh, that's just me" → volume ↓ */
/* ------------------------------------------------------------------ */

const ShotMatch: React.FC<{t: number}> = ({t}) => {
  const a = T.andWhen;
  const b = T.scientists + 0.12;
  const st = shotStyle(t, a, b, 0.22, 0.22);
  const cardsOut = ease.inOut(prog(t, T.goes - 0.1, T.goes + 0.35));
  const predS = springAt(t, a, {damping: 12}) * (1 - cardsOut * 0.4);
  const actS = springAt(t, T.touch - 0.05, {damping: 12}) * (1 - cardsOut * 0.4);
  const merge = ease.inOut(prog(t, T.prediction - 0.15, T.prediction + 0.35));
  const matched = springAt(t, T.prediction + 0.3, {damping: 9, stiffness: 220});
  const cardY = mix(0, -340, cardsOut);
  const cardOpacity = 1 - prog(t, T.goes + 0.1, T.goes + 0.4);

  const brainS = springAt(t, T.goes, {damping: 11});
  const bubbleS = springAt(t, T.eh - 0.05, {damping: 11, stiffness: 200}) * (1 - ease.in(prog(t, T.turns - 0.15, T.turns + 0.1)));
  const sliderS = springAt(t, T.turns - 0.1, {damping: 12});
  const level = 1 - 0.92 * ease.inOut(prog(t, T.feeling, T.down + 0.35));
  const talking = within(t, T.eh - 0.05, T.turns - 0.2) ? talkAt(t) : 0;

  return (
    <Stage style={st} camera={cam(1, 540, 960)}>
      <AbsoluteFill style={{opacity: cardOpacity, transform: `translateY(${cardY}px) scale(${1 - cardsOut * 0.3})`}}>
        <WaveCard
          x={540}
          y={640}
          w={840}
          title="PREDICTED"
          color={C.cyan}
          t={t}
          draw={1}
          s={predS}
          phase={0.1}
          glow={matched}
        />
        <WaveCard
          x={540}
          y={mix(930, 640, merge)}
          w={840}
          title={merge > 0.5 ? '' : 'ACTUAL TOUCH'}
          color={C.pink}
          t={t}
          draw={ease.inOut(prog(t, T.touch, T.matches + 0.3))}
          s={actS}
          phase={mix(0.32, 0.1, ease.inOut(prog(t, T.matches, T.prediction + 0.3)))}
          glow={0}
          bare={merge > 0.02 ? 1 : 0}
          badge={null}
        />
        {matched > 0.001 && <Pill x={540} y={810} text="✓  PERFECT MATCH" bg={C.lime} s={matched} size={50} />}
      </AbsoluteFill>
      <Svg>
        {brainS > 0.001 && (
          <Brain
            id="b2"
            t={t}
            x={330}
            y={800 + (1 - brainS) * 120}
            scale={0.62 * brainS}
            face={1}
            lid={0.52}
            smile={0.05}
            smirk={0.2}
            talk={talking}
            lookX={0.4}
            rot={wobble(t, 0.8, 'b2r') * 2}
          />
        )}
      </Svg>
      {bubbleS > 0.001 && <SpeechBubble x={680} y={570} text="eh, that's just me." s={bubbleS} />}
      {sliderS > 0.001 && <FeelingSlider x={540} y={1150} level={level} s={sliderS} />}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* SHOT D — the robot experiment                                       */
/* ------------------------------------------------------------------ */

const ShotLab: React.FC<{t: number}> = ({t}) => {
  const a = T.scientists;
  const b = T.yourBrain + 0.1;
  const st = shotStyle(t, a, b, 0.24, 0.22);
  const laughT = T.ticklish - 0.05;
  const laughing = t > laughT;
  const lp = ease.out(prog(t, laughT, laughT + 0.2));
  const sh = shake(t, laughT, 16, 0.6);

  const badgeS = springAt(t, a + 0.08, {damping: 10}) * (1 - ease.in(prog(t, T.andWhen2 - 0.2, T.andWhen2)));
  const citeS = springAt(t, a + 0.4) * (1 - ease.in(prog(t, T.andWhen2 - 0.2, T.andWhen2)));
  const goggles = springAt(t, a + 0.25, {damping: 9, stiffness: 200});
  const robotIn = ease.out(prog(t, T.they - 0.05, T.they + 0.6));
  const meterS = springAt(t, T.they + 0.5, {damping: 12});
  const delayS = springAt(t, T.andWhen2, {damping: 11});
  const delay = 0.2 * ease.inOut(prog(t, T.tiny, T.second + 0.1));
  const ms = Math.round(delay * 1000);

  // joystick pattern (figure-8), and the feather follows it `delay` seconds later
  const pat = (tt: number): [number, number] => [Math.sin(tt * Math.PI * 2 * 1.3), Math.sin(tt * Math.PI * 2 * 2.6) * 0.6];
  const active = t > T.they + 0.4;
  const [ju, jv] = active ? pat(t) : [0, 0];
  const [fu, fv] = active ? pat(t - delay) : [0, 0];

  const PX = 360;
  const PY = 1270;
  const PS = 0.85;
  const toScreen = (lx: number, ly: number): [number, number] => [PX + lx * PS, PY + (-238 + ly) * PS];
  const handLocal: [number, number] = [-168 + ju * 26, 40 + jv * 22];
  const [jhx, jhy] = toScreen(...handLocal);
  const [jbx, jby] = toScreen(-168, 150);
  const touch = toScreen(80 + fu * 46, 96 + fv * 40);

  const meterV = laughing ? 0.04 + 0.88 * springAt(t, laughT, {damping: 7, stiffness: 120}) + wobble(t, 8, 'lmv') * 0.04 : 0.03 + Math.max(0, wobble(t, 5, 'lm')) * 0.04;

  const bounce = laughing ? Math.abs(Math.sin((t - laughT) * Math.PI * 5.5)) : 0;
  const pose: Partial<PipPose> = {
    x: PX,
    y: PY,
    scale: PS,
    goggles,
    hop: bounce * 26 * lp,
    tilt: laughing ? wobble(t, 4, 'lt') * 8 * lp : 0,
    squash: 1 + (laughing ? (bounce - 0.5) * 0.08 * lp : 0),
    lid: laughing ? 0 : kf(t, [[a, 0], [T.they + 0.6, 0], [T.they + 0.9, 0.45]]),
    happyEyes: lp,
    smile: laughing ? mix(0.1, 1, lp) : kf(t, [[a, 0.75], [T.they + 0.6, 0.75], [T.they + 0.9, 0.05]]),
    mouthW: laughing ? 1.25 : 1,
    mouthOpen: laughing ? 0.55 + bounce * 0.35 : 0,
    talk: laughing ? 0 : talkAt(t) * 0.85,
    browL: laughing ? 0.6 : kf(t, [[a, 0.6], [T.they + 0.6, 0.6], [T.they + 0.9, -0.1]]),
    browR: laughing ? 0.6 : kf(t, [[a, 0.6], [T.they + 0.6, 0.6], [T.they + 0.9, -0.1]]),
    blush: laughing ? 1 : 0.25,
    lookX: laughing ? 0 : active ? 0.6 : 0.3,
    lookY: laughing ? 0 : active ? 0.3 : -0.2,
    handL: laughing ? [-150 + bounce * 20, 140] : handLocal,
    handR: laughing ? [96, 150 + bounce * 10] : [212, 118],
    fingers: 0,
    antennaGlow: laughing ? 1 : 0.7,
  };

  return (
    <Stage style={st} camera={cam(1 + lp * 0.04, 540, 1000, 540, 1000, sh)}>
      <Svg>
        {meterS > 0.001 && <LaughMeter x={815} y={650} scale={0.62 * meterS * (1 + lp * 0.12)} value={meterV} t={t} opacity={clamp(meterS * 2)} />}
        <Pip id="lab" t={t} pose={pose} />
        {!laughing && active && <Joystick x={jbx} y={jby} hx={jhx} hy={jhy} scale={0.85} />}
        {robotIn > 0.001 && <RobotArm bx={mix(1400, 1010, robotIn)} by={1290} tx={touch[0]} ty={touch[1]} t={t} led={delay > 0.01 ? C.pink : C.cyan} />}
      </Svg>
      {badgeS > 0.001 && <Pill x={300} y={490} text="REAL EXPERIMENT" bg={C.yellow} s={badgeS} size={40} />}
      {citeS > 0.001 && (
        <div style={{position: 'absolute', left: 70, width: 470, top: 548, textAlign: 'center', fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 30, lineHeight: 1.25, color: 'rgba(255,255,255,0.75)', opacity: clamp(citeS), transform: `translateY(${(1 - citeS) * 20}px)`}}>
          Blakemore, Frith &amp; Wolpert
          <br />
          J. Cognitive Neuroscience · 1999
        </div>
      )}
      {delayS > 0.001 && (
        <Card x={360} y={560} w={520} h={190} s={delayS} style={{borderColor: delay > 0.01 ? C.pink : 'rgba(255,255,255,0.18)'}}>
          <div style={{position: 'absolute', left: 34, top: 22, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 30, letterSpacing: 5, color: 'rgba(255,255,255,0.75)'}}>
            ROBOT DELAY
          </div>
          <div style={{position: 'absolute', left: 34, top: 62, fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: 92, color: delay > 0.01 ? C.pink : '#fff', textShadow: delay > 0.01 ? `0 0 30px ${C.pink}` : undefined}}>
            +{String(ms).padStart(3, '0')}
            <span style={{fontSize: 52, marginLeft: 10}}>ms</span>
          </div>
        </Card>
      )}
      {laughing && <HaBurst x={PX} y={PY - 300} t={t} at={laughT + 0.05} count={16} />}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* SHOT E — the rule: can't predict → can't cancel                     */
/* ------------------------------------------------------------------ */

const ShotRule: React.FC<{t: number}> = ({t}) => {
  const a = T.yourBrain;
  const b = T.soTry + 0.12;
  const st = shotStyle(t, a, b, 0.22, 0.2);
  const brainS = springAt(t, a, {damping: 11});
  const cardS = springAt(t, a + 0.12, {damping: 12});
  const sliderS = springAt(t, a + 0.25, {damping: 12});
  const up = ease.out(prog(t, T.cancel, T.cancel + 0.6));
  const level = 0.08 + 0.92 * up;
  const sh = shake(t, T.cancel + 0.5, 14, 0.4);
  const q = springAt(t, T.predict2, {damping: 8, stiffness: 240});
  return (
    <Stage style={st} camera={cam(1, 540, 960, 540, 960, sh)}>
      <Svg>
        <Brain
          id="b3"
          t={t}
          x={540}
          y={640 + (1 - brainS) * 100}
          scale={0.55 * brainS}
          face={1}
          worried={1}
          lookX={wobble(t, 3, 'conf') * 0.9}
          lookY={wobble(t, 2.5, 'conf2') * 0.6}
          smile={-0.4}
          rot={wobble(t, 2, 'b3r') * 6}
        />
      </Svg>
      <WaveCard
        x={540}
        y={925}
        w={840}
        title="PREDICTION: ???"
        color={C.cyan}
        t={t}
        draw={1}
        s={cardS}
        glitch={0.85}
        badge={
          q > 0.001 ? (
            <div style={{position: 'absolute', right: 34, top: 14, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 40, color: C.red, transform: `scale(${q})`}}>
              NO MATCH
            </div>
          ) : null
        }
      />
      <FeelingSlider x={540} y={1185} level={level} s={sliderS} />
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* SHOT F — outro / loop: "So... try again."                           */
/* ------------------------------------------------------------------ */

const ShotOutro: React.FC<{t: number}> = ({t}) => {
  const a = T.soTry;
  const st = shotStyle(t, a, END + 1, 0.25, 0.01);
  const reach = ease.out(prog(t, T.tryAgain - 0.1, T.tryAgain + 0.3));
  const s = kf(t, [[a, 1.0], [END, 1.1, ease.linear]]);
  return (
    <Stage style={st} camera={cam(s, 540, 1000)}>
      <Svg>
        <Pip
          id="outro"
          t={t}
          pose={{
            x: 540,
            y: 1560,
            scale: 1.85,
            lid: 0.38,
            browL: 0.85,
            browR: -0.1,
            smirk: 0.65,
            smile: 0.55,
            talk: talkAt(t) * 0.55,
            lookX: 0,
            lookY: 0.1,
            handL: [mix(-212, -120, reach), mix(118, 70, reach)],
            handR: [mix(212, 120, reach), mix(118, 70, reach)],
            fingers: reach,
            antennaGlow: 0.9,
            blush: 0.45,
          }}
        />
      </Svg>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* Sound design                                                        */
/* ------------------------------------------------------------------ */

type Cue = [number, string, number];
const CUES: Cue[] = [
  [0, 'whoosh', 0.35],
  [T.rightNow, 'pop', 0.45],
  [T.wait, 'whoosh-down', 0.3],
  ...Array.from({length: 4}, (_, i): Cue => [T.wait + 0.2 + i / 2.6, i % 2 ? 'tock' : 'tick', 0.4]),
  [T.nothing, 'pop', 0.4],
  [T.nobody - 0.05, 'blips', 0.45],
  [T.andNo, 'whoosh', 0.3],
  [T.boring + 0.12, 'thud', 0.9],
  [T.boring + 0.5, 'zap', 0.45],
  [T.itsBecause + 0.05, 'riser', 0.35],
  [T.itsBecause + 0.46, 'glitch', 0.5],
  [T.cheating, 'thud', 0.75],
  [T.every - 0.05, 'whoosh-down', 0.4],
  [T.move, 'zap', 0.35],
  [T.secret - 0.05, 'pop-high', 0.5],
  [T.secret + 0.45, 'whoosh', 0.3],
  [T.back + 0.35, 'ding', 0.35],
  [T.so + 0.1, 'blips', 0.4],
  [T.andWhen, 'whoosh', 0.35],
  [T.touch - 0.05, 'pop', 0.4],
  [T.prediction + 0.3, 'ding', 0.6],
  [T.goes, 'pop', 0.35],
  [T.eh - 0.05, 'pop-high', 0.4],
  [T.feeling, 'whoosh-down', 0.5],
  [T.scientists, 'whoosh', 0.5],
  [T.scientists + 0.08, 'blips', 0.4],
  [T.scientists + 0.25, 'pop-high', 0.4],
  [T.they - 0.05, 'servo', 0.45],
  [T.andWhen2, 'pop', 0.4],
  ...Array.from({length: 14}, (_, i): Cue => [T.tiny + i * 0.14, 'tick', 0.22]),
  [T.started - 0.9, 'riser', 0.4],
  [T.ticklish - 0.05, 'boing', 0.6],
  [T.ticklish, 'pop-high', 0.4],
  [T.ticklish + 0.15, 'pop', 0.35],
  [T.ticklish + 0.3, 'pop-high', 0.35],
  [T.ticklish + 0.55, 'pop', 0.3],
  [T.yourBrain, 'glitch', 0.4],
  [T.cancel, 'whoosh', 0.4],
  [T.predict2, 'thud', 0.45],
  [T.soTry, 'whoosh-down', 0.35],
  [T.tryAgain, 'pop-high', 0.3],
];

const SoundDesign: React.FC = () => (
  <>
    <Audio src={staticFile('episodes/ep001/vo.wav')} />
    <Audio
      src={staticFile('music/curious-loop.wav')}
      volume={(f) => {
        const t = f / FPS;
        const speaking = talkAt(t) > 0.15 ? 1 : 0;
        const fadeOut = 1 - prog(t, END - 1.2, END);
        return (0.16 - speaking * 0.05) * fadeOut;
      }}
    />
    {CUES.map(([at, name, vol], i) => (
      <Sequence key={i} from={Math.max(0, Math.round(at * FPS))} durationInFrames={Math.round(2 * FPS)} layout="none">
        <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
      </Sequence>
    ))}
  </>
);

/* ------------------------------------------------------------------ */

export const Episode001: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const lab = prog(t, T.scientists - 0.1, T.scientists + 0.3) * (1 - prog(t, T.yourBrain - 0.1, T.yourBrain + 0.2));
  const flash = within(t, T.itsBecause + 0.4, T.itsBecause + 0.62) ? 1 - Math.abs(t - (T.itsBecause + 0.48)) / 0.14 : 0;
  return (
    <AbsoluteFill style={{background: C.bg0}}>
      <Background t={t} hue={lab * 38} glowY={kf(t, [[0, 860], [T.every, 860], [T.every + 0.5, 700]])} />
      <ShotHook t={t} />
      <ShotBrain t={t} />
      <ShotMatch t={t} />
      <ShotLab t={t} />
      <ShotRule t={t} />
      <ShotOutro t={t} />
      {flash > 0 && <AbsoluteFill style={{background: '#fff', opacity: clamp(flash) * 0.85}} />}
      <TitleChip t={t} episode="FACT #001" line1="WHY CAN'T YOU" line2="TICKLE YOURSELF?" />
      <Captions t={t} words={words} chunks={chunks} emphasis={['tickle', 'cheating', 'secret', 'predict', 'robot', 'delay', 'ticklish', 'cancel']} />
      <Grain frame={frame} />
      <SoundDesign />
    </AbsoluteFill>
  );
};
