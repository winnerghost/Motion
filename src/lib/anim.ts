import {Easing, spring} from 'remotion';
import {noise2D} from '@remotion/noise';

export const FPS = 60;
export const W = 1080;
export const H = 1920;

export const ease = {
  linear: (x: number) => x,
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  out: Easing.bezier(0.16, 1, 0.3, 1),
  outSoft: Easing.bezier(0.33, 1, 0.68, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
  backBig: Easing.bezier(0.3, 2.0, 0.6, 1),
  step: (x: number) => (x < 1 ? 0 : 1),
};

/** A keyframe: [timeInSeconds, value, easingIntoThisKey?] */
export type Key = [number, number, ((x: number) => number)?];

/** Keyframe interpolation in seconds. Easing is applied to the segment that ENDS at a key. */
export function kf(t: number, keys: Key[]): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    const [t0, v0] = keys[i - 1];
    if (t <= t1) {
      const p = t1 === t0 ? 1 : (t - t0) / (t1 - t0);
      return v0 + (v1 - v0) * (e ?? ease.inOut)(p);
    }
  }
  return keys[keys.length - 1][1];
}

/** Linear 0..1 progress of t between a and b, clamped. */
export const prog = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

/** Physically based spring that starts at time t0 (seconds). 0 before t0, settles at 1. */
export function springAt(
  t: number,
  t0: number,
  config: {damping?: number; stiffness?: number; mass?: number} = {},
): number {
  if (t < t0) return 0;
  return spring({
    frame: (t - t0) * FPS,
    fps: FPS,
    config: {damping: 13, stiffness: 170, mass: 1, ...config},
  });
}

/** In-and-out window: springs in at a, eases out over `outDur` ending at b. */
export function windowed(t: number, a: number, b: number, outDur = 0.25, cfg = {}) {
  const inn = springAt(t, a, cfg);
  const out = 1 - ease.in(prog(t, b - outDur, b));
  return inn * out;
}

/** Smooth organic wobble in [-1, 1]. */
export function wobble(t: number, freq: number, seed: string | number = 0) {
  return noise2D(String(seed), t * freq, 0.37);
}

/** Visible during [a, b) */
export const within = (t: number, a: number, b: number) => t >= a && t < b;

/** Decaying shake used for impacts. Returns {x, y, r} offsets. */
export function shake(t: number, t0: number, amp = 18, dur = 0.35) {
  if (t < t0 || t > t0 + dur) return {x: 0, y: 0, r: 0};
  const p = (t - t0) / dur;
  const k = (1 - p) ** 2 * amp;
  return {
    x: wobble(t, 40, `sx${t0}`) * k,
    y: wobble(t, 40, `sy${t0}`) * k,
    r: wobble(t, 30, `sr${t0}`) * k * 0.08,
  };
}
