import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import './styles.css';

/* ------------------------------------------------------------------ */
/* Setup                                                               */
/* ------------------------------------------------------------------ */
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s) as T;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));
const html = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(pointer: fine)').matches;
const desktop = () => window.innerWidth > 960;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

const FILMS: Record<string, {meta: string; title: string; desc: string; src: string; poster: string}> = {
  ep004: {
    meta: 'No. 003 · Acoustics · 0:35',
    title: 'Why does your voice sound different in recordings?',
    desc: 'You hear yourself twice: through the air, and through your own skull. A recording only captures one of them.',
    src: '/media/ep004.mp4',
    poster: '/media/ep004.jpg',
  },
  ep002: {
    meta: 'No. 002 · Neuroscience · 0:29',
    title: 'Can you tickle your own foot?',
    desc: 'A viewer said yes. The science says: partly. There are two kinds of tickle, and only one of them can be self-produced.',
    src: '/media/ep002.mp4',
    poster: '/media/ep002.jpg',
  },
  ep001: {
    meta: 'No. 001 · Neuroscience · 0:42',
    title: 'Why can’t you tickle yourself?',
    desc: 'Your brain predicts the touch of your own movements and turns it down. Researchers proved it with a robot.',
    src: '/media/ep001.mp4',
    poster: '/media/ep001.jpg',
  },
};

/* ------------------------------------------------------------------ */
/* Text splitting                                                      */
/* ------------------------------------------------------------------ */
function splitWords(el: HTMLElement) {
  let i = 0;
  const out = document.createDocumentFragment();
  el.childNodes.forEach((node) => {
    const isEm = node.nodeName === 'EM';
    const text = node.textContent ?? '';
    text.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        out.appendChild(document.createTextNode(' '));
        return;
      }
      const w = document.createElement('span');
      w.className = 'w';
      const inner = document.createElement(isEm ? 'em' : 'span');
      inner.className = 'w__i';
      inner.textContent = part;
      inner.style.setProperty('--i', String(i++));
      w.appendChild(inner);
      out.appendChild(w);
    });
  });
  el.textContent = '';
  el.appendChild(out);
}

function splitManifesto(el: HTMLElement) {
  const words = (el.textContent ?? '').trim().split(/\s+/);
  el.textContent = '';
  words.forEach((w, i) => {
    const s = document.createElement('span');
    s.className = 'mw';
    s.textContent = w;
    el.appendChild(s);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
  });
  return $$<HTMLSpanElement>('.mw', el);
}

function splitLetters(el: HTMLElement) {
  const text = el.textContent ?? '';
  el.textContent = '';
  Array.from(text).forEach((ch, i) => {
    const s = document.createElement('span');
    s.className = 'l';
    const inner = document.createElement('span');
    inner.textContent = ch === ' ' ? ' ' : ch;
    inner.style.setProperty('--i', String(i));
    s.appendChild(inner);
    el.appendChild(s);
  });
}

$$('[data-split]').forEach(splitWords);
const manifestoWords = splitManifesto($('[data-words]'));
$$('[data-letters]').forEach(splitLetters);
$$('.year').forEach((e) => (e.textContent = String(new Date().getFullYear())));

/* ------------------------------------------------------------------ */
/* Smooth scroll (desktop only — touch keeps native momentum)           */
/* ------------------------------------------------------------------ */
const lenis = !reduced && fine ? new Lenis({lerp: 0.09, wheelMultiplier: 0.95}) : null;
if (lenis) lenis.stop();
const scrollTo = (target: string | HTMLElement) => {
  const el = typeof target === 'string' ? (document.querySelector(target) as HTMLElement | null) : target;
  if (!el) return;
  if (lenis) lenis.scrollTo(el, {duration: 1.6, offset: el.id === 'top' ? -200 : 0});
  else el.scrollIntoView({behavior: reduced ? 'auto' : 'smooth'});
};

/* ------------------------------------------------------------------ */
/* Preloader                                                           */
/* ------------------------------------------------------------------ */
(function loader() {
  const count = $('.loader__count');
  const bar = $('.loader__bar i');
  const start = performance.now();
  const minDur = reduced ? 200 : 1400;
  let assetsReady = false;
  const fonts = (document as Document & {fonts?: FontFaceSet}).fonts;
  const heroPoster = new Image();
  heroPoster.src = '/media/hero.jpg';
  Promise.all([fonts?.ready ?? Promise.resolve(), heroPoster.decode().catch(() => undefined)]).then(() => (assetsReady = true));
  setTimeout(() => (assetsReady = true), 3500);
  const step = (now: number) => {
    const p = clamp((now - start) / minDur);
    const eased = 1 - Math.pow(1 - p, 3);
    const shown = Math.round(eased * (assetsReady ? 100 : 90));
    count.textContent = String(shown).padStart(3, '0');
    bar.style.transform = `scaleX(${shown / 100})`;
    if (p >= 1 && assetsReady) {
      count.textContent = '100';
      bar.style.transform = 'scaleX(1)';
      setTimeout(done, reduced ? 0 : 180);
      return;
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  function done() {
    html.classList.add('is-ready');
    html.classList.remove('is-loading');
    lenis?.start();
    const v = $<HTMLVideoElement>('.hero video');
    v?.play().catch(() => undefined);
    setTimeout(() => $('.loader')?.remove(), 1400);
  }
})();

/* ------------------------------------------------------------------ */
/* Reveals                                                             */
/* ------------------------------------------------------------------ */
const revealIO = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        revealIO.unobserve(e.target);
      }
    }),
  {threshold: 0.15, rootMargin: '0px 0px -8% 0px'},
);
$$('[data-reveal], [data-split], [data-clip], [data-letters], .pillar, .film').forEach((el) => revealIO.observe(el));

/* ------------------------------------------------------------------ */
/* Videos: play only while visible                                      */
/* ------------------------------------------------------------------ */
const videoIO = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      const v = e.target as HTMLVideoElement;
      if (e.isIntersecting) {
        if (v.preload === 'none') v.preload = 'auto';
        void v.play().catch(() => undefined);
      } else v.pause();
    }),
  {threshold: 0.35},
);
$$<HTMLVideoElement>('video[data-inview]').forEach((v) => videoIO.observe(v));
// hero video: pause when scrolled away, resume when back
const heroVideo = $<HTMLVideoElement>('.hero video');
new IntersectionObserver(([e]) => (e.isIntersecting && html.classList.contains('is-ready') ? heroVideo.play().catch(() => undefined) : heroVideo.pause()), {threshold: 0.05}).observe(heroVideo);

/* ------------------------------------------------------------------ */
/* Films: hover to preview (desktop), in-view preview (touch), lightbox  */
/* ------------------------------------------------------------------ */
const filmVideoIO = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      const v = e.target as HTMLVideoElement;
      if (e.isIntersecting) {
        v.preload = 'auto';
        void v.play().catch(() => undefined);
      } else v.pause();
    }),
  {threshold: 0.7},
);
$$<HTMLElement>('.film[data-film]').forEach((card) => {
  const v = $<HTMLVideoElement>('video', card);
  if (fine) {
    card.addEventListener('pointerenter', () => {
      v.preload = 'auto';
      void v.play().catch(() => undefined);
    });
    card.addEventListener('pointerleave', () => v.pause());
  } else filmVideoIO.observe(v);
  card.addEventListener('click', () => openFilm(card.dataset.film!));
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), openFilm(card.dataset.film!)));
});

const lb = $('.lightbox');
const lbVideo = $<HTMLVideoElement>('.lightbox video');
let lbTimer = 0;
function openFilm(id: string) {
  const f = FILMS[id];
  if (!f) return;
  window.clearTimeout(lbTimer);
  $('.lightbox__meta', lb).textContent = f.meta;
  $('.lightbox__title', lb).textContent = f.title;
  $('.lightbox__desc', lb).textContent = f.desc;
  lbVideo.poster = f.poster;
  lbVideo.src = f.src;
  lb.hidden = false;
  lenis?.stop();
  html.classList.add('is-locked');
  requestAnimationFrame(() => requestAnimationFrame(() => lb.classList.add('is-open')));
  void lbVideo.play().catch(() => undefined);
  $<HTMLButtonElement>('.lightbox__close').focus({preventScroll: true});
}
function closeFilm() {
  lb.classList.remove('is-open');
  lbVideo.pause();
  html.classList.remove('is-locked');
  lenis?.start();
  lbTimer = window.setTimeout(() => {
    lb.hidden = true;
    lbVideo.removeAttribute('src');
    lbVideo.load();
  }, 650);
}
$('.lightbox__close').addEventListener('click', closeFilm);
lb.addEventListener('click', (e) => e.target === lb && closeFilm());

/* ------------------------------------------------------------------ */
/* Menu                                                                */
/* ------------------------------------------------------------------ */
const menu = $('.menu');
const menuBtn = $<HTMLButtonElement>('.menu-btn');
const frameImgs = $$<HTMLImageElement>('.menu__frame img');
const menuCaption = $('.menu__preview figcaption');
let menuOpen = false;
let menuTimer = 0;
let frontImg = 0;
function setMenu(open: boolean) {
  if (open === menuOpen) return;
  menuOpen = open;
  window.clearTimeout(menuTimer);
  menuBtn.setAttribute('aria-expanded', String(open));
  if (open) {
    menu.hidden = false;
    lenis?.stop();
    html.classList.add('is-locked');
    requestAnimationFrame(() => requestAnimationFrame(() => html.classList.add('menu-open')));
  } else {
    html.classList.remove('menu-open');
    html.classList.remove('is-locked');
    lenis?.start();
    menuTimer = window.setTimeout(() => (menu.hidden = true), 1000);
  }
}
menuBtn.addEventListener('click', () => setMenu(!menuOpen));
$$<HTMLAnchorElement>('.menu__list a').forEach((a) => {
  const show = () => {
    const src = a.dataset.preview!;
    const back = frameImgs[1 - frontImg];
    if (frameImgs[frontImg].getAttribute('src') === src) return;
    back.src = src;
    back.classList.add('is-front');
    frameImgs[frontImg].classList.remove('is-front');
    frontImg = 1 - frontImg;
    menuCaption.textContent = a.dataset.caption ?? '';
  };
  a.addEventListener('pointerenter', show);
  a.addEventListener('focus', show);
});
frameImgs[0].classList.add('is-front');

/* anchor links: smooth scroll, closing the menu first if needed */
$$<HTMLAnchorElement>('a[data-scroll]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if (!href?.startsWith('#')) return;
    e.preventDefault();
    if (menuOpen) {
      setMenu(false);
      window.setTimeout(() => scrollTo(href), 650);
    } else scrollTo(href);
  }),
);
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!lb.hidden) closeFilm();
  else if (menuOpen) setMenu(false);
});

/* ------------------------------------------------------------------ */
/* Index: filters + accordion                                           */
/* ------------------------------------------------------------------ */
const filters = $$<HTMLButtonElement>('.filter');
const ind = $('.filters__ind');
const moveInd = (b: HTMLElement) => {
  ind.style.width = `${b.offsetWidth}px`;
  ind.style.transform = `translateX(${b.offsetLeft}px)`;
};
filters.forEach((b) =>
  b.addEventListener('click', () => {
    filters.forEach((x) => {
      x.classList.toggle('is-active', x === b);
      x.setAttribute('aria-selected', String(x === b));
    });
    moveInd(b);
    const f = b.dataset.filter;
    $$<HTMLLIElement>('.q').forEach((q, i) => {
      const show = f === 'all' || q.dataset.status === f;
      if (show) {
        q.hidden = false;
        q.classList.add('is-in');
        requestAnimationFrame(() => {
          q.style.transitionDelay = `${i * 30}ms`;
          q.classList.remove('is-out');
        });
      } else {
        q.style.transitionDelay = '0ms';
        q.classList.add('is-out');
        window.setTimeout(() => q.classList.contains('is-out') && (q.hidden = true), 260);
      }
    });
  }),
);
requestAnimationFrame(() => moveInd(filters[0]));
window.addEventListener('resize', () => moveInd(filters.find((f) => f.classList.contains('is-active'))!));
$$<HTMLLIElement>('.q').forEach((q) => {
  const btn = $<HTMLButtonElement>('.q__row', q);
  btn.addEventListener('click', () => {
    const open = !q.classList.contains('is-open');
    $$<HTMLLIElement>('.q.is-open').forEach((o) => {
      o.classList.remove('is-open');
      $('.q__row', o).setAttribute('aria-expanded', 'false');
    });
    q.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
  });
});

/* ------------------------------------------------------------------ */
/* Magnetic buttons + cursor (desktop)                                   */
/* ------------------------------------------------------------------ */
const pointer = {x: window.innerWidth / 2, y: window.innerHeight / 2, seen: false};
const cursor = $('.cursor');
const cursorLabel = $('.cursor__label');
if (fine && !reduced) {
  html.classList.add('has-cursor');
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (!pointer.seen) {
        pointer.seen = true;
        cursor.classList.add('is-visible');
      }
    },
    {passive: true},
  );
  document.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
  document.addEventListener('pointerenter', () => pointer.seen && cursor.classList.add('is-visible'));
  document.addEventListener('pointerover', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-cursor], a, button');
    const label = t?.dataset.cursor ?? '';
    cursor.classList.toggle('is-hover', !!t && !label);
    cursor.classList.toggle('is-label', !!label);
    cursorLabel.textContent = label;
  });
  $$<HTMLElement>('.pill, .menu-btn, .platform__arrow').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.18}px, ${dy * 0.28}px)`;
    });
    el.addEventListener('pointerleave', () => (el.style.transform = ''));
  });
}

/* ------------------------------------------------------------------ */
/* Scroll-linked effects: one rAF loop, transform/opacity only           */
/* ------------------------------------------------------------------ */
const header = $('.header');
const parallax = $$<HTMLElement>('[data-parallax]');
const manifesto = $('[data-words]');
const films = $('.films');
const track = $('.films__track');
const progressBar = $('.films__progress i');
let lastY = window.scrollY;
let filmsDistance = 0;
const wordState = new Float32Array(manifestoWords.length).fill(-1);
let cx = pointer.x;
let cy = pointer.y;

function layoutFilms() {
  if (desktop() && !reduced) {
    track.style.transform = '';
    const distance = Math.max(0, track.scrollWidth - track.clientWidth);
    filmsDistance = distance;
    films.style.height = `${window.innerHeight + distance}px`;
    films.classList.add('is-pinned');
  } else {
    filmsDistance = 0;
    films.style.height = '';
    track.style.transform = '';
    films.classList.remove('is-pinned');
  }
}
layoutFilms();
window.addEventListener('resize', layoutFilms);
window.addEventListener('load', layoutFilms);

function frame(time: number) {
  lenis?.raf(time);
  const y = lenis ? lenis.scroll : window.scrollY;
  const vh = window.innerHeight;

  // header: hide on the way down, return on the way up
  if (!menuOpen) {
    if (y > 160 && y > lastY + 3) header.classList.add('is-hidden');
    else if (y < lastY - 3 || y < 160) header.classList.remove('is-hidden');
    header.classList.toggle('is-solid', y > 40);
  }
  lastY = y;

  if (!reduced) {
    // parallax
    for (const el of parallax) {
      const r = (el.parentElement as HTMLElement).getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      const off = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.parallax!);
      el.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0) scale(1.14)`;
    }
    // manifesto: words light up as you read
    const mr = manifesto.getBoundingClientRect();
    if (mr.bottom > 0 && mr.top < vh) {
      const p = clamp((vh * 0.82 - mr.top) / (mr.height + vh * 0.25));
      const active = p * manifestoWords.length * 1.08;
      for (let i = 0; i < manifestoWords.length; i++) {
        const o = Math.round(clamp(active - i, 0.14, 1) * 100) / 100;
        if (o !== wordState[i]) {
          wordState[i] = o;
          manifestoWords[i].style.opacity = String(o);
        }
      }
    }
    // films: vertical scroll drives the horizontal track
    if (filmsDistance > 0) {
      const fr = films.getBoundingClientRect();
      if (fr.top < vh && fr.bottom > 0) {
        const p = clamp(-fr.top / (fr.height - vh));
        track.style.transform = `translate3d(${(-p * filmsDistance).toFixed(1)}px, 0, 0)`;
        progressBar.style.transform = `scaleX(${p.toFixed(4)})`;
      }
    } else {
      const max = track.scrollWidth - track.clientWidth;
      progressBar.style.transform = `scaleX(${max > 0 ? (track.scrollLeft / max).toFixed(4) : 0})`;
    }
  }

  // cursor
  if (fine && !reduced) {
    cx += (pointer.x - cx) * 0.2;
    cy += (pointer.y - cy) * 0.2;
    cursor.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
