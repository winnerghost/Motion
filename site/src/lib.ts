import {useEffect, useRef, useState} from 'react';

export const LINKS = {
  youtube: 'https://www.youtube.com/@pipexplainsfacts',
  youtubeShorts: 'https://www.youtube.com/@pipexplainsfacts/shorts',
  instagram: 'https://www.instagram.com/pip.explainsfacts',
  ytHandle: '@pipexplainsfacts',
  igHandle: '@pip.explainsfacts',
};

export const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
export const finePointer = typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches;

/* ------------------------------------------------------------------ */
/* Pointer — one global listener                                       */
/* ------------------------------------------------------------------ */
export const pointer = {x: -9999, y: -9999, active: false, lastMove: 0};
if (typeof window !== 'undefined') {
  const set = (x: number, y: number) => {
    pointer.x = x;
    pointer.y = y;
    pointer.active = true;
    pointer.lastMove = performance.now();
  };
  window.addEventListener('pointermove', (e) => set(e.clientX, e.clientY), {passive: true});
  window.addEventListener('pointerdown', (e) => set(e.clientX, e.clientY), {passive: true});
}

/* ------------------------------------------------------------------ */
/* rAF clock — re-renders the calling component every frame            */
/* ------------------------------------------------------------------ */
export function useClock(running = true) {
  const [, setFrame] = useState(0);
  const t = useRef(0);
  const dt = useRef(0);
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      dt.current = Math.min(0.05, (now - last) / 1000);
      last = now;
      t.current += dt.current;
      setFrame((f) => (f + 1) % 1e9);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);
  return {t: t.current, dt: dt.current};
}

/* ------------------------------------------------------------------ */
/* In-view (adds .is-in to [data-reveal] elements)                      */
/* ------------------------------------------------------------------ */
export function useRevealAll(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (reducedMotion || !('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('is-in');
            io.unobserve(en.target);
          }
        }),
      {threshold: 0.18, rootMargin: '0px 0px -6% 0px'},
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [ready]);
}

export function useInView<T extends HTMLElement>(threshold = 0.5) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([en]) => setInView(en.isIntersecting), {threshold});
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

/* ------------------------------------------------------------------ */
/* Sound — off by default, remembered per visitor                       */
/* ------------------------------------------------------------------ */
type SoundName = 'pop' | 'pop-high' | 'whoosh' | 'boing' | 'ding' | 'blips';
const cache: Partial<Record<SoundName, HTMLAudioElement>> = {};
let soundOn = false;
try {
  soundOn = localStorage.getItem('pip-sound') === '1';
} catch {
  /* storage unavailable */
}
const listeners = new Set<(on: boolean) => void>();

export const sound = {
  get on() {
    return soundOn;
  },
  toggle() {
    soundOn = !soundOn;
    try {
      localStorage.setItem('pip-sound', soundOn ? '1' : '0');
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l(soundOn));
    if (soundOn) sound.play('pop-high', 0.5);
  },
  subscribe(l: (on: boolean) => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  play(name: SoundName, volume = 0.5) {
    if (!soundOn) return;
    try {
      const base = cache[name] ?? (cache[name] = new Audio(`/sfx/${name}.mp3`));
      const a = base.cloneNode(true) as HTMLAudioElement;
      a.volume = volume;
      void a.play().catch(() => undefined);
    } catch {
      /* ignore */
    }
  },
};

export function useSoundOn() {
  const [on, setOn] = useState(sound.on);
  useEffect(() => {
    const unsub = sound.subscribe(setOn);
    return () => {
      unsub();
    };
  }, []);
  return on;
}

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */
export type Episode = {id: string; tag: string; title: string; hook: string; video: string; poster: string; isNew?: boolean; length: string};
export const EPISODES: Episode[] = [
  {
    id: 'ep004',
    tag: 'FACT #003',
    title: 'Why does your voice sound so weird in recordings?',
    hook: 'You hear yourself twice. Only one version is real (for everyone else).',
    video: '/media/ep004.mp4',
    poster: '/media/ep004.jpg',
    isNew: true,
    length: '0:35',
  },
  {
    id: 'ep002',
    tag: 'FACT #001 · PART 2',
    title: 'Can you tickle your own foot?',
    hook: 'A viewer said yes. He was half right.',
    video: '/media/ep002.mp4',
    poster: '/media/ep002.jpg',
    length: '0:29',
  },
  {
    id: 'ep001',
    tag: 'FACT #001',
    title: "Why can't you tickle yourself?",
    hook: 'Your brain is cheating. Scientists proved it with a robot.',
    video: '/media/ep001.mp4',
    poster: '/media/ep001.jpg',
    length: '0:42',
  },
];

export type Fact = {q: string; a: string; tag: string; episode?: boolean};
export const FACTS: Fact[] = [
  {q: "Why can't you tickle yourself?", a: 'Your brain predicts the touch before it happens and turns the feeling down. No surprise, no tickle.', tag: 'Brain', episode: true},
  {q: 'Why does your recorded voice sound so weird?', a: 'In your head you also hear yourself through your skull, which makes you sound deeper. A recording only catches the air part.', tag: 'Body', episode: true},
  {q: 'Can you tickle your own foot?', a: 'The light, itchy kind, a little. The laugh-till-you-cry kind, no: your brain sees it coming.', tag: 'Brain', episode: true},
  {q: 'Do wombats really poop cubes?', a: 'Yes. Their gut has stiff and stretchy bands that shape the corners, and they can drop up to about 100 a day.', tag: 'Animals'},
  {q: 'Are bananas radioactive?', a: 'Slightly. They contain potassium-40, a natural radioactive isotope, in an amount that is completely harmless.', tag: 'Science'},
  {q: 'Why do your fingers wrinkle in water?', a: "It's your nervous system tightening blood vessels, not water soaking in. Fingers with damaged nerves don't wrinkle.", tag: 'Body'},
  {q: 'Can you hum while holding your nose?', a: "Not for long. Humming needs air to escape through your nose, and when it's pinched, the air has nowhere to go.", tag: 'Body'},
  {q: 'Why do onions make you cry?', a: 'Cutting one releases an irritating gas that reaches your eyes, and your eyes flush it out with tears.', tag: 'Science'},
];
