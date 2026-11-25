import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {ease, FPS, H, prog, W} from './anim';

/** Fade/scale/blur in-out envelope for a shot visible during [a, b]. */
export function shotStyle(t: number, a: number, b: number, inDur = 0.24, outDur = 0.2): React.CSSProperties | null {
  if (t < a || t > b) return null;
  const pin = inDur <= 0 ? 1 : ease.out(prog(t, a, a + inDur));
  const pout = outDur <= 0 ? 0 : ease.in(prog(t, b - outDur, b));
  return {
    opacity: pin * (1 - pout),
    transform: `scale(${(1.07 - 0.07 * pin) * (1 - 0.05 * pout)})`,
    filter: pin < 1 || pout > 0 ? `blur(${(1 - pin) * 14 + pout * 14}px)` : undefined,
  };
}

/** Camera: zoom s around focus (fx, fy), keeping it at the screen point (cx, cy). */
export const cam = (s: number, fx: number, fy: number, cx = 540, cy = 960, sh = {x: 0, y: 0, r: 0}) =>
  `translate(${cx - fx * s + sh.x}px, ${cy - fy * s + sh.y}px) scale(${s}) rotate(${sh.r}deg)`;

export const Stage: React.FC<{style: React.CSSProperties | null; camera?: string; children: React.ReactNode}> = ({
  style,
  camera,
  children,
}) =>
  style ? (
    <AbsoluteFill style={style}>
      <AbsoluteFill style={{transformOrigin: '0 0', transform: camera}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  ) : null;

export const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
    {children}
  </svg>
);

export const envAt = (env: number[], t: number) => env[Math.max(0, Math.min(env.length - 1, Math.floor(t * FPS)))] ?? 0;

export type Cue = [number, string, number];

/** Voiceover + ducked music bed + sound-effect cues.
 *  `voVolume` lets an episode mute the main voice for a moment (e.g. to swap in
 *  a processed version of the same line from `layers`, which share its timeline). */
export const SoundDesign: React.FC<{
  vo: string;
  env: number[];
  end: number;
  cues: Cue[];
  voVolume?: (t: number) => number;
  layers?: {src: string; volume: (t: number) => number}[];
  musicMul?: (t: number) => number;
}> = ({vo, env, end, cues, voVolume, layers = [], musicMul}) => (
  <>
    <Audio src={staticFile(vo)} volume={voVolume ? (f) => voVolume(f / FPS) : undefined} />
    {layers.map((l, i) => (
      <Audio key={i} src={staticFile(l.src)} volume={(f) => l.volume(f / FPS)} />
    ))}
    <Audio
      src={staticFile('music/curious-loop.wav')}
      volume={(f) => {
        const t = f / FPS;
        const speaking = envAt(env, t) > 0.15 ? 1 : 0;
        return (0.16 - speaking * 0.05) * (1 - prog(t, end - 1.2, end)) * (musicMul ? musicMul(t) : 1);
      }}
    />
    {cues.map(([at, name, vol], i) => (
      <Sequence key={i} from={Math.max(0, Math.round(at * FPS))} durationInFrames={Math.round(2 * FPS)} layout="none">
        <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
      </Sequence>
    ))}
  </>
);
