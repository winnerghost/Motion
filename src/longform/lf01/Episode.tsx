import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Pip, PipPose} from '../../character/Pip';
import {Background, Grain} from '../../components/Background';
import {C, FONT_DISPLAY, FONT_HEAD} from '../../lib/theme';
import {
  Badge,
  clamp,
  ease,
  hostPose,
  layoutSections,
  LFPS,
  LH,
  LSvg,
  LW,
  mix,
  MusicBed,
  MythCard,
  prog,
  Progress,
  Section,
  SectionAudio,
  SectionCaptions,
  springAt,
  Sting,
  Timing,
  wobble,
  wordsOf,
} from '../kit';
import {ArtBats, ArtHead, ArtKnuckles, ArtNails, ArtProps, ArtSugar} from './Art1';
import {ArtBrain, ArtBulls, ArtLightning, ArtSeasons, ArtWall} from './Art2';
import script from './script.json';
import tIntro from '../../../public/longform/lf01/intro/timing.json';
import t10 from '../../../public/longform/lf01/m10/timing.json';
import t9 from '../../../public/longform/lf01/m9/timing.json';
import t8 from '../../../public/longform/lf01/m8/timing.json';
import t7 from '../../../public/longform/lf01/m7/timing.json';
import t6 from '../../../public/longform/lf01/m6/timing.json';
import t5 from '../../../public/longform/lf01/m5/timing.json';
import t4 from '../../../public/longform/lf01/m4/timing.json';
import t3 from '../../../public/longform/lf01/m3/timing.json';
import t2 from '../../../public/longform/lf01/m2/timing.json';
import t1 from '../../../public/longform/lf01/m1/timing.json';
import tOutro from '../../../public/longform/lf01/outro/timing.json';

/**
 * LONG FORM #01 — "10 Myths You Still Believe" (16:9, ~5 min)
 * Sources: Vreeman & Carroll, BMJ 2007/2008 (medical myths incl. head heat, hair after death);
 * Wolraich et al., JAMA 1995 and Hoover & Milich 1994 (sugar); Unger 1998 / Ig Nobel 2009 (knuckles);
 * Kawchuk et al. 2015 (joint cavitation); NOAA (lightning, Empire State Building); Guinness (Roy Sullivan);
 * NASA (Great Wall from orbit, perihelion); Raichle & Gusnard 2002 (brain energy budget).
 */

const TIMINGS: Record<string, Timing> = {
  intro: tIntro as Timing,
  m10: t10 as Timing,
  m9: t9 as Timing,
  m8: t8 as Timing,
  m7: t7 as Timing,
  m6: t6 as Timing,
  m5: t5 as Timing,
  m4: t4 as Timing,
  m3: t3 as Timing,
  m2: t2 as Timing,
  m1: t1 as Timing,
  outro: tOutro as Timing,
};
const ART: Record<string, React.FC<ArtProps>> = {
  m10: ArtHead,
  m9: ArtNails,
  m8: ArtBats,
  m7: ArtSugar,
  m6: ArtKnuckles,
  m5: ArtBulls,
  m4: ArtWall,
  m3: ArtLightning,
  m2: ArtBrain,
  m1: ArtSeasons,
};
const EMPH: Record<string, string[]> = {
  intro: ['one', 'ten', 'school'],
  m10: ['myth', 'ten', 'army', 'hat'],
  m9: ['myth', 'skin', 'longer', 'smaller'],
  m8: ['myth', 'see', 'echolocation', 'eyes', 'nose'],
  m7: ['myth', 'same', 'told', 'fake', 'parents'],
  m6: ['myth', 'pop', 'bubble', 'sixty', 'one', 'either'],
  m5: ['myth', 'colour-blind', 'moving', 'crowd'],
  m4: ['myth', 'metres', 'barely', 'moon', 'hair', 'lights'],
  m3: ['myth', 'tall', 'twenty', 'seven', 'survived'],
  m2: ['myth', 'everywhere', 'expensive', 'twenty', 'ninety'],
  m1: ['myth', 'closest', 'january', 'tilt', 'directly', 'australia'],
  outro: ['comments', 'pip'],
};

const DEFS = script.sections.map((s) => ({
  id: s.id,
  timing: TIMINGS[s.id],
  vo: `longform/lf01/${s.id}/vo.wav`,
  n: s.id.startsWith('m') ? parseInt(s.id.slice(1), 10) : undefined,
  myth: (s as {myth?: string}).myth,
}));
export const {sections: LF01_SECTIONS, total: LF01_TOTAL} = layoutSections(DEFS);
export const LF01_DURATION = Math.ceil(LF01_TOTAL * LFPS);

/* ------------------------------------------------------------------ */
/* Myth scene: host + card + art                                         */
/* ------------------------------------------------------------------ */
const MythScene: React.FC<{sec: Section; t: number; i: number}> = ({sec, t, i}) => {
  const lt = t - sec.off;
  if (lt < -0.5 || lt > sec.dur + 0.6) return null;
  const W = wordsOf(sec.timing);
  const mythAt = W('myth.');
  const vis = Math.min(ease.out(prog(lt, -0.5, 0.05)), 1 - ease.in(prog(lt, sec.dur + 0.1, sec.dur + 0.6)));
  const Art = ART[sec.id];
  // whisper beats: Pip leans in
  const whisperWord: Record<string, string> = {m7: 'sugar', m3: 'lightning'};
  const wNth: Record<string, number> = {m7: 4, m3: 3};
  const wAt = whisperWord[sec.id] ? W(whisperWord[sec.id], wNth[sec.id]) : 1e9;
  const lean = ease.inOut(prog(lt, wAt - 0.3, wAt + 0.1));
  const pose: Partial<PipPose> = hostPose(lt, sec.timing.env, {
    mythAt,
    mood: lean > 0.01 ? {lid: 0.35 * lean, smirk: 0.5 * lean, handR: [mix(212, 120, lean), mix(118, 40, lean)], lookX: mix(0.3, 0, lean)} : undefined,
    scale: 0.95 + lean * 0.12,
  });
  return (
    <AbsoluteFill style={{opacity: vis, transform: `scale(${0.97 + 0.03 * vis})`}}>
      <LSvg>
        <g transform={`translate(1255 600)`}>
          <Art t={lt} W={W} />
        </g>
        <Pip id={`host${i}`} t={lt} pose={pose} />
      </LSvg>
      <MythCard t={lt} text={sec.myth ?? ''} mythAt={mythAt} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Intro                                                                 */
/* ------------------------------------------------------------------ */
const MYTH_TITLES = ['HEAT & HATS', 'NAILS', 'BATS', 'SUGAR', 'KNUCKLES', 'BULLS', 'GREAT WALL', 'LIGHTNING', '10% BRAIN', 'SEASONS'];

const IntroScene: React.FC<{sec: Section; t: number}> = ({sec, t}) => {
  const lt = t - sec.off;
  if (t > sec.off + sec.dur + 1.0) return null;
  const W = wordsOf(sec.timing);
  const out = ease.out(prog(lt, sec.dur - 0.25, sec.dur + 0.3));
  const one = ease.out(prog(lt, W('one') - 0.1, W('one') + 0.3)) * (1 - ease.out(prog(lt, W('all') - 0.1, W('all') + 0.2)));
  const all = ease.out(prog(lt, W('all') - 0.1, W('all') + 0.3));
  const title = springAt(t, 0.1, {damping: 13, stiffness: 150});
  const school = springAt(lt, W('school.') - 0.1, {damping: 9});
  const go = ease.in(prog(lt, W('go!') - 0.2, W('go!') + 0.4));
  const env = sec.timing.env;
  const pose: Partial<PipPose> = {
    ...hostPose(Math.max(0, lt), env, {x: 960, y: 1010, scale: 0.95}),
    lookX: 0,
    lookY: mix(0, -0.4, school),
    browL: 0.6,
    browR: 0.6,
    smile: 0.6,
    hop: springAt(lt, W('go!'), {damping: 6}) * 40 * Math.exp(-Math.max(0, lt - W('go!')) * 3),
    handL: go > 0.1 ? [-240, -120] : [-212, 118],
    handR: go > 0.1 ? [240, -120] : [212, 118],
  };
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      <LSvg>
        {MYTH_TITLES.map((m, i) => {
          const a = (i / 10) * Math.PI * 2 + t * 0.25;
          const rx = 720;
          const ry = 230;
          const x = 960 + Math.cos(a) * rx * (1 + go * 1.2);
          const y = 660 + Math.sin(a) * ry * (1 + go * 1.2);
          const glow = Math.max(i === 0 ? one : 0, all);
          const s = springAt(t, 0.2 + i * 0.06, {damping: 12});
          return (
            <g key={m} transform={`translate(${x} ${y}) rotate(${wobble(t, 0.4, m) * 8}) scale(${s * (0.9 + glow * 0.15)})`} opacity={clamp(s * 2)}>
              <rect x={-120} y={-44} width={240} height={88} rx={22} fill={glow > 0.5 ? C.yellow : 'rgba(255,255,255,0.12)'} stroke={glow > 0.5 ? '#fff' : 'rgba(255,255,255,0.25)'} strokeWidth={3} />
              <text y={12} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={30} letterSpacing={2} fill={glow > 0.5 ? C.ink : '#fff'}>
                {m}
              </text>
            </g>
          );
        })}
        <Pip id="intro" t={t} pose={pose} />
      </LSvg>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 120,
          textAlign: 'center',
          transform: `scale(${0.8 + 0.2 * title}) translateY(${-go * 200}px)`,
          opacity: clamp(title * 2),
        }}
      >
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 40, letterSpacing: 10, color: C.cyan}}>PIP EXPLAINS</div>
        <div style={{fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 112, lineHeight: 1, whiteSpace: 'nowrap', color: '#fff', WebkitTextStroke: '16px #120C33', paintOrder: 'stroke fill', textShadow: '0 10px 0 rgba(10,6,30,0.5)'}}>
          10 MYTHS <span style={{color: C.yellow}}>YOU STILL BELIEVE</span>
        </div>
      </div>
      {school > 0.001 && (
        <div style={{position: 'absolute', left: 1400, top: 470, transform: `translate(-50%, -50%) scale(${school * (1 - go)}) rotate(8deg)`, fontSize: 130}}>🎓</div>
      )}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Outro + end screen                                                    */
/* ------------------------------------------------------------------ */
const OutroScene: React.FC<{sec: Section; t: number; total: number}> = ({sec, t, total}) => {
  const lt = t - sec.off;
  if (lt < -0.6) return null;
  const W = wordsOf(sec.timing);
  const vis = ease.out(prog(lt, -0.6, 0.1));
  const q = springAt(lt, 0.1);
  const comment = springAt(lt, W('comments:') - 0.1);
  const sub = springAt(lt, W('do.') - 0.2, {damping: 9});
  const press = ease.inOut(prog(lt, W('do.') + 0.1, W('do.') + 0.35)) * (1 - ease.inOut(prog(lt, W('do.') + 0.35, W('do.') + 0.6)));
  const subbed = lt > W('do.') + 0.35;
  const tag = springAt(lt, W('curiosity,') - 0.1);
  const end = ease.inOut(prog(t, sec.off + sec.dur + 0.3, sec.off + sec.dur + 1.1));
  const wave = Math.sin(t * 9);
  const pose: Partial<PipPose> = {
    ...hostPose(Math.max(0, lt), sec.timing.env, {x: mix(560, 1500, end), y: mix(980, 960, end), scale: mix(1.0, 0.95, end)}),
    lookX: mix(0.3, -0.5, end),
    smile: 0.7,
    happyEyes: tag > 0.5 ? 0.7 : 0,
    handR: end > 0.5 ? [236, -150 + wave * 30] : [212, 118],
  };
  return (
    <AbsoluteFill style={{opacity: vis}}>
      <LSvg>
        <Pip id="outro" t={t} pose={pose} />
      </LSvg>
      <div style={{position: 'absolute', left: 1230, top: 250, transform: `translate(-50%, -50%) scale(${q * (1 - end)})`, textAlign: 'center', opacity: clamp(q * 2) * (1 - end)}}>
        <div style={{fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 96, color: '#fff', WebkitTextStroke: '14px #120C33', paintOrder: 'stroke fill', lineHeight: 1}}>
          HOW MANY DID
          <br />
          <span style={{color: C.yellow}}>YOU BELIEVE?</span>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 1230,
          top: 560,
          transform: `translate(-50%, -50%) scale(${comment * (1 - end)}) rotate(-2deg)`,
          opacity: clamp(comment * 2) * (1 - end),
          width: 900,
          background: '#fff',
          borderRadius: 40,
          padding: '30px 40px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
          fontFamily: FONT_HEAD,
          fontWeight: 800,
          fontSize: 50,
          lineHeight: 1.1,
          color: C.ink,
        }}
      >
        💬 Which myth fooled you the longest? 👇
      </div>
      {sub > 0.001 && (
        <div
          style={{
            position: 'absolute',
            left: 1230,
            top: 760,
            transform: `translate(-50%, -50%) scale(${sub * (1 - press * 0.12) * (1 - end)})`,
            opacity: clamp(sub * 2) * (1 - end),
            background: subbed ? '#3A3570' : C.red,
            color: '#fff',
            fontFamily: FONT_HEAD,
            fontWeight: 800,
            fontSize: 48,
            letterSpacing: 3,
            padding: '20px 54px',
            borderRadius: 999,
            boxShadow: subbed ? 'none' : '0 0 50px rgba(255,59,78,0.55)',
          }}
        >
          {subbed ? 'SUBSCRIBED ✓' : 'SUBSCRIBE'}
        </div>
      )}
      {tag > 0.001 && (
        <div style={{position: 'absolute', left: mix(1230, 760, end), top: mix(900, 150, end), transform: `translate(-50%, -50%) scale(${tag})`, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 70, color: C.yellow, WebkitTextStroke: '10px #120C33', paintOrder: 'stroke fill', whiteSpace: 'nowrap', opacity: clamp(tag * 2)}}>
          Curiosity, answered.
        </div>
      )}
      {/* end screen: frames for YouTube's end-screen videos */}
      {end > 0.001 && (
        <div style={{position: 'absolute', inset: 0, opacity: end}}>
          {[0, 1].map((k) => (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: 150 + k * 640,
                top: 380,
                width: 560,
                height: 315,
                borderRadius: 26,
                border: '4px dashed rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: 14,
                fontFamily: FONT_HEAD,
                fontWeight: 800,
                fontSize: 30,
                letterSpacing: 3,
                color: 'rgba(255,255,255,0.55)',
                transform: `translateY(${(1 - end) * 40}px)`,
              }}
            >
              {k === 0 ? 'WATCH NEXT' : 'MORE FROM PIP'}
            </div>
          ))}
        </div>
      )}
      <AbsoluteFill style={{background: '#05030F', opacity: ease.in(prog(t, total - 1.2, total)), pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
export const LongMyths: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / LFPS;
  const secs = LF01_SECTIONS;
  const myths = secs.filter((s) => s.n !== undefined);
  const cur = [...myths].reverse().find((s) => t >= (s.stingAt ?? s.off) + 1.0);
  const outro = secs[secs.length - 1];
  const inMyths = cur && t < outro.off - 0.3;
  const progVis = inMyths ? 1 : 0;
  const idx = cur ? 10 - (cur.n ?? 10) : 0;
  const cues: [number, string, number][] = [];
  myths.forEach((s) => {
    const W = wordsOf(s.timing);
    cues.push([s.stingAt ?? s.off, 'whoosh', 0.45], [(s.stingAt ?? s.off) + 0.08, 'thud', 0.5], [(s.stingAt ?? s.off) + 1.05, 'whoosh-down', 0.25]);
    cues.push([s.off + 0.12, 'pop', 0.3], [s.off + W('myth.'), 'thud', 0.55], [s.off + W('myth.') + 0.02, 'glitch', 0.18]);
  });
  cues.push([0.1, 'blips', 0.3], [outro.off + wordsOf(outro.timing)('do.') + 0.3, 'pop-high', 0.4], [outro.off + wordsOf(outro.timing)('curiosity,'), 'ding', 0.35]);
  return (
    <AbsoluteFill style={{background: C.bg0}}>
      <Background t={t} w={LW} h={LH} hue={inMyths ? -25 + idx * 6 : 0} glowX={inMyths ? 1250 : 960} glowY={inMyths ? 520 : 560} />
      <IntroScene sec={secs[0]} t={t} />
      {myths.map((s, i) => (
        <MythScene key={s.id} sec={s} t={t} i={i} />
      ))}
      <OutroScene sec={outro} t={t} total={LF01_TOTAL} />
      {myths.map((s) => (s.stingAt !== undefined && t >= s.stingAt && t < s.stingAt + 1.7 ? <Sting key={`st${s.id}`} t={t - s.stingAt} n={s.n ?? 0} /> : null))}
      {cur && inMyths && t >= (cur.stingAt ?? cur.off) + 1.6 && <Badge t={t} n={cur.n ?? 0} />}
      <Progress current={cur?.n ?? 11} t={t} opacity={progVis} />
      {secs.map((s) => (
        <SectionCaptions key={`c${s.id}`} sec={s} t={t} emphasis={EMPH[s.id]} />
      ))}
      <Grain frame={frame} w={LW} h={LH} opacity={0.06} />
      {secs.map((s) => (
        <SectionAudio key={`a${s.id}`} sec={s} fps={LFPS} />
      ))}
      <MusicBed sections={secs} total={LF01_TOTAL} fps={LFPS} />
      {cues.map(([at, name, vol], i) => (
        <Sequence key={`sfx${i}`} from={Math.max(0, Math.round(at * LFPS))} durationInFrames={Math.round(2 * LFPS)} layout="none">
          <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/** Chapter timestamps for the YouTube description. */
export const LF01_CHAPTERS = LF01_SECTIONS.map((s) => ({id: s.id, start: s.stingAt ?? s.off}));
