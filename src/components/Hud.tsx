import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ease, prog, springAt, wobble} from '../lib/anim';
import {C, FONT_DISPLAY, FONT_HEAD} from '../lib/theme';

export type Word = {text: string; start: number; end: number};
export type Chunk = {words: number[]; start: number; end: number};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z']/g, '');

/**
 * Word-by-word "karaoke" captions in the Shorts style: big, heavy, outlined,
 * each word pops in exactly when it is spoken; the current word is highlighted.
 */
export const Captions: React.FC<{
  t: number;
  words: Word[];
  chunks: Chunk[];
  emphasis?: string[];
  y?: number;
  hidden?: (t: number) => boolean;
  /** size multiplier (1 = vertical Shorts; ~0.6 for 16:9) */
  scale?: number;
  side?: number;
}> = ({t, words, chunks, emphasis = [], y = 1330, hidden, scale = 1, side = 90}) => {
  if (hidden?.(t)) return null;
  const emph = new Set(emphasis.map(norm));
  let idx = -1;
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const next = chunks[i + 1];
    const until = next ? Math.min(next.start - 0.02, c.end + 0.45) : c.end + 0.6;
    if (t >= c.start - 0.04 && t < until) idx = i;
  }
  if (idx < 0) return null;
  const chunk = chunks[idx];
  const next = chunks[idx + 1];
  const until = next ? Math.min(next.start - 0.02, chunk.end + 0.45) : chunk.end + 0.6;
  const exit = ease.in(prog(t, until - 0.08, until));
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          top: y,
          left: side,
          right: side,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'flex-end',
          columnGap: 40 * scale,
          rowGap: 0,
          transform: `scale(${1 - exit * 0.15})`,
          opacity: 1 - exit,
        }}
      >
        {chunk.words.map((wi) => {
          const w = words[wi];
          const s = springAt(t, w.start - 0.04, {damping: 11, stiffness: 260});
          const active = t >= w.start - 0.04 && t < w.end + 0.06;
          const isEmph = emph.has(norm(w.text));
          const color = isEmph ? C.pink : active ? C.yellow : C.white;
          const txt = w.text.replace(/["“”]/g, '').replace(/[.,]+$/, '').replace(/—/g, '');
          return (
            <span
              key={wi}
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 700,
                fontSize: (isEmph ? 108 : 94) * scale,
                lineHeight: 1.08,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color,
                WebkitTextStroke: `${18 * scale}px #120C33`,
                paintOrder: 'stroke fill',
                textShadow: `0 ${10 * scale}px 0 rgba(10,6,30,0.55), 0 ${18 * scale}px ${40 * scale}px rgba(0,0,0,0.45)`,
                display: 'inline-block',
                transform: `translateY(${(1 - s) * 40 * scale}px) scale(${0.55 + 0.45 * s}) rotate(${isEmph && active ? wobble(t, 9, wi) * 3 : 0}deg)`,
                opacity: Math.min(1, s * 1.6),
              }}
            >
              {txt}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Series tag + episode question, pinned at the top for swipe-in viewers. */
export const TitleChip: React.FC<{t: number; episode: string; line1: string; line2: string}> = ({
  t,
  episode,
  line1,
  line2,
}) => {
  const s = 1 + (1 - ease.out(prog(t, 0, 0.45))) * 0.12;
  const float = wobble(t, 0.4, 'title') * 4;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          top: 150 + float,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `scale(${s})`,
        }}
      >
        <div
          style={{
            fontFamily: FONT_HEAD,
            fontWeight: 800,
            fontSize: 30,
            letterSpacing: 4,
            color: C.ink,
            background: C.cyan,
            padding: '8px 22px 9px',
            borderRadius: 999,
            boxShadow: '0 0 30px rgba(69,233,255,0.45)',
            marginBottom: 16,
          }}
        >
          {episode}
        </div>
        {[line1, line2].map((l, i) => (
          <div
            key={i}
            style={{
              fontFamily: FONT_HEAD,
              fontWeight: 800,
              fontSize: 74,
              lineHeight: 1.02,
              letterSpacing: -1,
              color: i === 1 ? C.yellow : C.white,
              textShadow: '0 6px 0 rgba(10,6,30,0.6), 0 12px 40px rgba(0,0,0,0.5)',
            }}
          >
            {l}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
