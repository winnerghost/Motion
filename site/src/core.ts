import Lenis from 'lenis';

/* Shared helpers and state used by every module */
export const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s) as T;
export const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));
export const html = document.documentElement;
export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const fine = window.matchMedia('(pointer: fine)').matches;
export const desktop = () => window.innerWidth > 960;
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
export const raf2 = (fn: () => void) => requestAnimationFrame(() => requestAnimationFrame(fn));

/* storage that never throws (private mode, in-app browsers, blocked cookies) */
export const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = window.localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  },
};

/* pointer state (mouse or last touch) */
export const pointer = {x: window.innerWidth / 2, y: window.innerHeight * 0.4, active: false, last: 0, touch: false};
export const activity = {last: performance.now()};
const setPointer = (x: number, y: number, touch: boolean) => {
  pointer.x = x;
  pointer.y = y;
  pointer.active = true;
  pointer.touch = touch;
  pointer.last = performance.now();
  activity.last = pointer.last;
};
window.addEventListener('pointermove', (e) => setPointer(e.clientX, e.clientY, e.pointerType !== 'mouse'), {passive: true});
window.addEventListener('pointerdown', (e) => setPointer(e.clientX, e.clientY, e.pointerType !== 'mouse'), {passive: true});
['scroll', 'keydown', 'wheel', 'touchstart'].forEach((ev) => window.addEventListener(ev, () => (activity.last = performance.now()), {passive: true}));

/* smooth scroll on desktop; touch keeps native momentum */
export const lenis = !reduced && fine ? new Lenis({lerp: 0.075, wheelMultiplier: 0.9, smoothWheel: true}) : null;
lenis?.stop();

export function scrollToTarget(target: string, immediate = false) {
  const el = document.querySelector<HTMLElement>(target);
  if (!el) return;
  const offset = el.id === 'top' ? -400 : 0;
  if (lenis) {
    if (immediate) lenis.scrollTo(el, {immediate: true, force: true, offset});
    else lenis.scrollTo(el, {duration: 1.8, offset, easing: (t) => 1 - Math.pow(1 - t, 4)});
  } else if (immediate) {
    const y = el.id === 'top' ? 0 : el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({top: y, behavior: 'instant' as ScrollBehavior});
  } else el.scrollIntoView({behavior: reduced ? 'auto' : 'smooth'});
}

export function lockScroll(lock: boolean) {
  html.classList.toggle('is-locked', lock);
  if (lock) lenis?.stop();
  else lenis?.start();
}

/* toast */
let toastTimer = 0;
export function toast(text: string, label = 'You found a secret', ms = 6000) {
  const t = $('.toast');
  if (!t) return;
  $('.toast__label', t).textContent = label;
  $('.toast__text', t).textContent = text;
  window.clearTimeout(toastTimer);
  t.classList.remove('is-on');
  raf2(() => t.classList.add('is-on'));
  toastTimer = window.setTimeout(() => t.classList.remove('is-on'), ms);
}
