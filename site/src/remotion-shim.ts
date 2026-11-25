/**
 * Minimal stand-ins for the two `remotion` helpers used by the shared animation
 * code (src/lib/anim.ts), so the website bundle stays tiny.
 */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const A = (a: number, b: number) => 1 - 3 * b + 3 * a;
  const B = (a: number, b: number) => 3 * b - 6 * a;
  const Cc = (a: number) => 3 * a;
  const calc = (t: number, a: number, b: number) => ((A(a, b) * t + B(a, b)) * t + Cc(a)) * t;
  const slope = (t: number, a: number, b: number) => 3 * A(a, b) * t * t + 2 * B(a, b) * t + Cc(a);
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const s = slope(t, x1, x2);
      if (Math.abs(s) < 1e-6) break;
      t -= (calc(t, x1, x2) - x) / s;
    }
    t = Math.min(1, Math.max(0, t));
    return calc(t, y1, y2);
  };
}

export const Easing = {bezier};

export function spring({
  frame,
  fps,
  config = {},
}: {
  frame: number;
  fps: number;
  config?: {damping?: number; stiffness?: number; mass?: number};
}) {
  const {damping = 10, stiffness = 100, mass = 1} = config;
  const steps = Math.max(1, Math.ceil(frame * 4));
  const dt = frame / fps / steps;
  let x = 0;
  let v = 0;
  for (let i = 0; i < steps; i++) {
    const a = (-stiffness * (x - 1) - damping * v) / mass;
    v += a * dt;
    x += v * dt;
  }
  return x;
}

/** Deterministic pseudo-random number in [0, 1) from a seed (used by @remotion/noise). */
export function random(seed: string | number | null): number {
  const str = String(seed ?? Math.random());
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let t = (h += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
