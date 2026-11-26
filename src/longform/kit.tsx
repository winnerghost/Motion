import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {Pip, PipPose} from '../character/Pip';
import {Captions} from '../components/Hud';
import {clamp, ease, kf, mix, prog, springAt, wobble} from '../lib/anim';
import {envAt} from '../lib/shots';
import {C, FONT_DISPLAY, FONT_HEAD} from '../lib/theme';

/* ================================================================== */
/* Long-form (16:9) kit                                                 */
/* ================================================================== */
export const LW = 1920;
export const LH = 1080;
export const LFPS = 30;

export type Word = {text: string; start: number; end: number};
export type Timing = {duration: number; words: Word[]; chunks: {words: number[]; start: number; end: number}[]; env: number[]; placeholder?: boolean};
export type SectionDef = {id: string; timing: Timing; vo: string; n?: number; myth?: string};
export type Section = SectionDef & {off: number; dur: number; stingAt?: number};

/** Lay sections end to end; myths get a countdown sting before them. */
export function layoutSections(defs: SectionDef[], {lead = 0.4, sting = 1.6, gap = 0.5, tail = 7}: {lead?: number; sting?: number; gap?: number; tail?: number} = {}) {
  let t = lead;
  const out: Section[] = [];
  for (const d of defs) {
    let stingAt: number | undefined;
    if (d.n !== undefined) {
      stingAt = t;
      t += sting;
    } else if (out.length) t += gap;
    out.push({...d, off: t, dur: d.timing.duration, stingAt});
    t += d.timing.duration;
  }
  return {sections: out, total: t + tail};
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9%'-]/g, '');

/** Local time of the nth occurrence of a spoken word in a section (falls back gracefully). */
export function wordTime(timing: Timing, word: string, nth = 1, edge: 'start' | 'end' = 'start') {
  const target = norm(word);
  let seen = 0;
  for (const w of timing.words) {
    if (norm(w.text) === target && ++seen === nth) return w[edge];
  }
  // eslint-disable-next-line no-console
  console.warn(`word "${word}" #${nth} not found`);
  return timing.duration * 0.5;
}
export const wordsOf = (timing: Timing) => (word: string, nth = 1, edge: 'start' | 'end' = 'start') => wordTime(timing, word, nth, edge);

/** 1920x1080 SVG layer. */
export const LSvg: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <svg width={LW} height={LH} style={{position: 'absolute', inset: 0, overflow: 'visible', ...style}}>
    {children}
  </svg>
);

/** Fade window helper: 0 before a, 1 inside, 0 after b. */
export const win = (t: number, a: number, b: number, fin = 0.3, fout = 0.3) =>
  Math.min(ease.out(prog(t, a, a + fin)), 1 - ease.in(prog(t, b - fout, b)));

/* ------------------------------------------------------------------ */
/* Presenter Pip                                                        */
/* ------------------------------------------------------------------ */
export const HOST = {x: 400, y: 915, scale: 0.95};

/** Pip presenting: reads the myth (looking at the card), deadpans "Myth.", then explains. */
export function hostPose(t: number, env: number[], o: {mythAt?: number; dur?: number; mood?: Partial<PipPose>; x?: number; y?: number; scale?: number} = {}): Partial<PipPose> {
  const talk = envAt(env, t);
  const m = o.mythAt ?? -10;
  const reading = 1 - ease.inOut(prog(t, m - 0.25, m));
  const dead = ease.out(prog(t, m - 0.1, m + 0.12)) * (1 - ease.inOut(prog(t, m + 0.9, m + 1.3)));
  const explain = ease.inOut(prog(t, m + 0.9, m + 1.3));
  const glance = 0.5 + 0.5 * Math.sin(t * 0.9 + 1.3);
  const gesture = explain * clamp(talk * 1.6) * (0.5 + 0.5 * wobble(t, 0.35, 'gest'));
  const enter = springAt(t, 0, {damping: 13, stiffness: 160});
  return {
    x: o.x ?? HOST.x,
    y: o.y ?? HOST.y,
    scale: (o.scale ?? HOST.scale) * (0.9 + 0.1 * enter),
    lookX: mix(mix(0.15, 0.7, glance), 0.68, reading) * (1 - dead),
    lookY: mix(-0.05, -0.15, reading),
    lid: dead * 0.5,
    browL: mix(mix(0.35, 0.55, reading), 0.05, dead),
    browR: mix(mix(0.35, 0.45, reading), 0.05, dead),
    smile: mix(mix(0.45, 0.3, reading), -0.05, dead),
    smirk: dead * 0.35,
    mouthW: mix(1, 0.75, dead),
    talk: talk * 0.9,
    tilt: wobble(t, 0.4, 'htilt') * 3 + dead * -3,
    hop: springAt(t, m, {damping: 7, stiffness: 260}) * 18 * Math.exp(-Math.max(0, t - m) * 4),
    handL: [-212, 118],
    handR: [mix(212, 250, gesture), mix(118, -70, gesture)],
    antennaGlow: 0.6 + 0.4 * clamp(talk * 1.5),
    blush: 0.3,
    ...o.mood,
  };
}

/* ------------------------------------------------------------------ */
/* Countdown sting: the number slams in, then docks in the corner badge */
/* ------------------------------------------------------------------ */
export const BADGE = {x: 120, y: 112};

export const Sting: React.FC<{t: number; n: number}> = ({t, n}) => {
  // t is relative to the start of the sting (0..~1.6), and continues to the dock
  const inS = springAt(t, 0.05, {damping: 10, stiffness: 180});
  const dock = ease.inOut(prog(t, 1.05, 1.6));
  const ring = prog(t, 0.05, 0.7);
  const x = mix(LW / 2, BADGE.x, dock);
  const y = mix(LH / 2 - 30, BADGE.y, dock);
  const s = mix(mix(2.2, 1, inS), 0.32, dock);
  const flash = (1 - ring) * clamp(t * 8);
  if (t < 0 || t > 1.65) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 46%, rgba(255,216,77,${0.22 * flash}) 0%, rgba(0,0,0,0) 55%)`}} />
      <LSvg>
        <circle cx={LW / 2} cy={LH / 2 - 30} r={120 + ring * 520} fill="none" stroke={C.yellow} strokeWidth={14 * (1 - ring)} opacity={(1 - ring) * (1 - dock)} />
      </LSvg>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          transform: `translate(-50%, -50%) scale(${s}) rotate(${(1 - inS) * -10}deg)`,
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          fontSize: 300,
          lineHeight: 1,
          color: C.yellow,
          WebkitTextStroke: '26px #120C33',
          paintOrder: 'stroke fill',
          textShadow: '0 16px 0 rgba(10,6,30,0.55)',
          opacity: clamp(inS * 3),
          whiteSpace: 'nowrap',
        }}
      >
        #{n}
      </div>
    </AbsoluteFill>
  );
};

/** Corner badge for the current myth. */
export const Badge: React.FC<{t: number; n: number; out?: number}> = ({t, n, out = 0}) => (
  <div style={{position: 'absolute', left: BADGE.x, top: BADGE.y, transform: `translate(-50%, -50%) scale(${1 - out})`, opacity: 1 - out}}>
    <div
      style={{
        fontFamily: FONT_DISPLAY,
        fontWeight: 700,
        fontSize: 96,
        lineHeight: 1,
        color: C.yellow,
        WebkitTextStroke: '9px #120C33',
        paintOrder: 'stroke fill',
        transform: `rotate(${wobble(t, 0.3, 'badge') * 3}deg)`,
        whiteSpace: 'nowrap',
      }}
    >
      #{n}
    </div>
  </div>
);

/** Ten slots at the top right: done myths get struck through. */
export const Progress: React.FC<{current: number; t: number; opacity?: number}> = ({current, t, opacity = 1}) => (
  <div style={{position: 'absolute', left: 48, top: 186, display: 'flex', gap: 8, opacity}}>
    {Array.from({length: 10}, (_, i) => {
      const n = 10 - i;
      const done = n > current;
      const now = n === current;
      return (
        <div
          key={n}
          style={{
            position: 'relative',
            width: 38,
            height: 38,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT_HEAD,
            fontWeight: 800,
            fontSize: 19,
            color: now ? C.ink : done ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.8)',
            background: now ? C.yellow : 'rgba(255,255,255,0.08)',
            border: `2px solid ${now ? C.yellow : 'rgba(255,255,255,0.18)'}`,
            transform: now ? `scale(${1.12 + 0.04 * Math.sin(t * 4)})` : undefined,
            boxShadow: now ? '0 0 26px rgba(255,216,77,0.55)' : undefined,
          }}
        >
          {n}
          {done && <div style={{position: 'absolute', left: 5, right: 5, top: '50%', height: 3, marginTop: -1.5, background: C.red, borderRadius: 4, transform: 'rotate(-30deg)'}} />}
        </div>
      );
    })}
  </div>
);

/* ------------------------------------------------------------------ */
/* The myth card: appears, gets stamped MYTH, docks at the top           */
/* ------------------------------------------------------------------ */
export const CARD = {x: 1255, y: 430, dockY: 150};

export const MythCard: React.FC<{t: number; text: string; mythAt: number; showAt?: number}> = ({t, text, mythAt, showAt = 0.15}) => {
  const s = springAt(t, showAt, {damping: 13, stiffness: 170});
  const stamp = ease.out(prog(t, mythAt, mythAt + 0.16));
  const stampS = 2.3 - 1.3 * stamp;
  const dock = ease.inOut(prog(t, mythAt + 1.0, mythAt + 1.6));
  const shake = t > mythAt && t < mythAt + 0.35 ? Math.sin(t * 90) * 10 * (1 - prog(t, mythAt, mythAt + 0.35)) : 0;
  if (s <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: CARD.x + shake,
        top: mix(CARD.y, CARD.dockY, dock),
        width: 1060,
        transform: `translate(-50%, -50%) scale(${mix(0.85 + 0.15 * s, 0.62, dock)}) rotate(${mix(-1.5, 0, dock)}deg)`,
        opacity: clamp(s * 2),
      }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 40,
          padding: '34px 390px 40px 50px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
          position: 'relative',
        }}
      >
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 26, letterSpacing: 5, color: '#8C7DFF', marginBottom: 8}}>EVERYONE SAYS</div>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 54, lineHeight: 1.08, color: C.ink, letterSpacing: -0.5}}>“{text}”</div>
        {stamp > 0 && (
          <div
            style={{
              position: 'absolute',
              right: 34,
              top: '50%',
              transform: `translateY(-50%) rotate(-12deg) scale(${stampS})`,
              opacity: stamp,
              fontFamily: FONT_HEAD,
              fontWeight: 800,
              fontSize: 92,
              letterSpacing: 5,
              color: C.red,
              border: `10px solid ${C.red}`,
              borderRadius: 24,
              padding: '0 26px 6px',
              background: 'rgba(255,59,78,0.08)',
              boxShadow: '0 0 60px rgba(255,59,78,0.35)',
            }}
          >
            MYTH
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* SVG label pill (inside art)                                           */
/* ------------------------------------------------------------------ */
export const SPill: React.FC<{x: number; y: number; text: string; s?: number; bg?: string; color?: string; size?: number; rot?: number}> = ({
  x,
  y,
  text,
  s = 1,
  bg = C.cyan,
  color = C.ink,
  size = 34,
  rot = 0,
}) => {
  if (s <= 0.001) return null;
  const w = text.length * size * 0.66 + size * 1.4;
  const h = size * 1.7;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={clamp(s * 2)}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={bg} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={size} letterSpacing={size * 0.06} fill={color}>
        {text}
      </text>
    </g>
  );
};

/** Big outlined display text inside SVG. */
export const SBig: React.FC<{x: number; y: number; text: string; s?: number; size?: number; color?: string; rot?: number; anchor?: 'start' | 'middle' | 'end'}> = ({
  x,
  y,
  text,
  s = 1,
  size = 90,
  color = C.yellow,
  rot = 0,
  anchor = 'middle',
}) =>
  s > 0.001 ? (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={clamp(s * 2)}>
      <text textAnchor={anchor} fontFamily={FONT_DISPLAY} fontWeight={700} fontSize={size} fill={color} stroke="#120C33" strokeWidth={size * 0.16} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  ) : null;

/* ------------------------------------------------------------------ */
/* Section audio + captions                                              */
/* ------------------------------------------------------------------ */
export const SectionAudio: React.FC<{sec: Section; fps: number}> = ({sec, fps}) => (
  <Sequence from={Math.round(sec.off * fps)} durationInFrames={Math.ceil((sec.dur + 0.5) * fps)} layout="none">
    <Audio src={staticFile(sec.vo)} />
  </Sequence>
);

export const SectionCaptions: React.FC<{sec: Section; t: number; emphasis?: string[]}> = ({sec, t, emphasis = []}) => {
  const lt = t - sec.off;
  if (lt < -0.2 || lt > sec.dur + 0.8) return null;
  return <Captions t={lt} words={sec.timing.words} chunks={sec.timing.chunks} emphasis={emphasis} y={905} scale={0.62} side={330} />;
};

/** Host Pip drawn inside an LSvg. */
export const Host: React.FC<{t: number; id: string; pose: Partial<PipPose>; holding?: React.ReactNode}> = ({t, id, pose, holding}) => (
  <Pip id={id} t={t} pose={pose} holding={holding} />
);

/** Music bed for the whole video, ducked under the voice. */
export const MusicBed: React.FC<{sections: Section[]; total: number; fps: number}> = ({sections, total, fps}) => (
  <Audio
    src={staticFile('music/curious-loop.wav')}
    loop
    volume={(f) => {
      const t = f / fps;
      const sec = sections.find((s) => t >= s.off && t < s.off + s.dur);
      const speaking = sec ? (envAt(sec.timing.env, t - sec.off) > 0.15 ? 1 : 0) : 0;
      const fadeOut = 1 - prog(t, total - 3, total);
      const fadeIn = prog(t, 0, 1);
      return (0.13 - speaking * 0.045) * fadeOut * fadeIn;
    }}
  />
);

export {kf, mix, prog, clamp, ease, springAt, wobble};
