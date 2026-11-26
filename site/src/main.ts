import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import './styles.css';

/* ================================================================== */
/* Setup                                                               */
/* ================================================================== */
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s) as T;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));
const html = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(pointer: fine)').matches;
const desktop = () => window.innerWidth > 960;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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

/* pointer state (mouse or last touch) */
const pointer = {x: window.innerWidth / 2, y: window.innerHeight * 0.4, active: false, last: 0, touch: false};
const setPointer = (x: number, y: number, touch: boolean) => {
  pointer.x = x;
  pointer.y = y;
  pointer.active = true;
  pointer.touch = touch;
  pointer.last = performance.now();
};
window.addEventListener('pointermove', (e) => setPointer(e.clientX, e.clientY, e.pointerType !== 'mouse'), {passive: true});
window.addEventListener('pointerdown', (e) => setPointer(e.clientX, e.clientY, e.pointerType !== 'mouse'), {passive: true});

/* ================================================================== */
/* Text splitting                                                      */
/* ================================================================== */
function splitWords(el: HTMLElement) {
  let i = 0;
  const out = document.createDocumentFragment();
  el.childNodes.forEach((node) => {
    const isEm = node.nodeName === 'EM';
    (node.textContent ?? '').split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) return void out.appendChild(document.createTextNode(' '));
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
function splitInto(el: HTMLElement, cls: string, twin = false) {
  const text = el.textContent ?? '';
  el.textContent = '';
  el.setAttribute('aria-label', text);
  return Array.from(text).map((ch, i) => {
    const s = document.createElement('span');
    s.className = cls;
    s.setAttribute('aria-hidden', 'true');
    s.style.setProperty('--i', String(i));
    const c = ch === ' ' ? ' ' : ch;
    s.innerHTML = twin ? `<span>${c}</span><span>${c}</span>` : `<span>${c}</span>`;
    el.appendChild(s);
    return s;
  });
}
function splitManifesto(el: HTMLElement) {
  const words = (el.textContent ?? '').trim().split(/\s+/);
  el.textContent = '';
  return words.map((w, i) => {
    const s = document.createElement('span');
    s.className = 'mw';
    s.textContent = w;
    el.appendChild(s);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    return s;
  });
}
$$('[data-split]').forEach(splitWords);
$$('[data-roll]').forEach((e) => splitInto(e, 'rc', true));
$$('.menu__txt[data-letters]').forEach((e) => splitInto(e, 'ml'));
const markLetters = $$('[data-mark]').flatMap((e) => splitInto(e, 'l'));
const manifestoWords = splitManifesto($('[data-words]'));
$$('.year').forEach((e) => (e.textContent = String(new Date().getFullYear())));

/* ================================================================== */
/* Smooth scroll (desktop) — touch keeps native momentum               */
/* ================================================================== */
const lenis = !reduced && fine ? new Lenis({lerp: 0.075, wheelMultiplier: 0.9, smoothWheel: true}) : null;
lenis?.stop();
const scrollTo = (target: string) => {
  const el = document.querySelector<HTMLElement>(target);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, {duration: 1.8, offset: el.id === 'top' ? -400 : 0, easing: (t) => 1 - Math.pow(1 - t, 4)});
  else el.scrollIntoView({behavior: reduced ? 'auto' : 'smooth'});
};

/* ================================================================== */
/* Intro: the bulb flickers on, the spotlight opens, the stage appears  */
/* ================================================================== */
(function intro() {
  const start = performance.now();
  const minDur = reduced ? 150 : 2100;
  let ready = false;
  const fonts = (document as Document & {fonts?: FontFaceSet}).fonts;
  const poster = new Image();
  poster.src = '/media/hero.jpg';
  Promise.all([fonts?.ready ?? Promise.resolve(), poster.decode().catch(() => undefined)]).then(() => (ready = true));
  window.setTimeout(() => (ready = true), 4000);
  const wait = () => {
    if (ready && performance.now() - start >= minDur) return go();
    requestAnimationFrame(wait);
  };
  requestAnimationFrame(wait);
  function go() {
    html.classList.add('is-ready');
    html.classList.remove('is-loading');
    lenis?.start();
    void $<HTMLVideoElement>('.hero video').play().catch(() => undefined);
    window.setTimeout(() => html.classList.add('is-answered'), reduced ? 0 : 1250);
    window.setTimeout(() => $('.loader')?.remove(), 1600);
  }
})();

/* ================================================================== */
/* Reveals + video visibility                                          */
/* ================================================================== */
const revealIO = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
    }),
  {threshold: 0.15, rootMargin: '0px 0px -8% 0px'},
);
$$('[data-reveal], [data-split], [data-mark], .pillar, .film, .host__media').forEach((el) => revealIO.observe(el));

const playWhenVisible = (v: HTMLVideoElement, threshold: number) =>
  new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting && html.classList.contains('is-ready')) {
        if (v.preload === 'none') v.preload = 'auto';
        void v.play().catch(() => undefined);
      } else v.pause();
    },
    {threshold},
  ).observe(v);
playWhenVisible($<HTMLVideoElement>('.hero video'), 0.05);
$$<HTMLVideoElement>('video[data-inview]').forEach((v) => playWhenVisible(v, 0.3));

/* ================================================================== */
/* Pip's eyes: live pupils over the video that follow the visitor       */
/* ================================================================== */
type Eyes = {svg: SVGSVGElement; pupils: SVGGElement[]; centers: [number, number][]; vbW: number; vbH: number; rx: number; ry: number; x: number; y: number; visible: boolean};
const eyes: Eyes[] = $$<SVGSVGElement>('svg[data-eyes]').map((svg) => {
  const [rx, ry] = (svg.dataset.range ?? '20 24').split(' ').map(Number);
  const vb = svg.viewBox.baseVal;
  const centers = $$<SVGEllipseElement>('clipPath ellipse', svg).map((e) => [e.cx.baseVal.value, e.cy.baseVal.value] as [number, number]);
  const st: Eyes = {svg, pupils: $$<SVGGElement>('.pupil', svg), centers, vbW: vb.width, vbH: vb.height, rx, ry, x: 0, y: 0, visible: false};
  new IntersectionObserver(([e]) => (st.visible = e.isIntersecting)).observe(svg);
  // natural, irregular blinking
  const blink = () => {
    if (st.visible && !reduced) {
      svg.classList.add('is-blink');
      window.setTimeout(() => svg.classList.remove('is-blink'), 190);
      if (Math.random() < 0.18) window.setTimeout(() => {
        svg.classList.add('is-blink');
        window.setTimeout(() => svg.classList.remove('is-blink'), 170);
      }, 320);
    }
    window.setTimeout(blink, 2400 + Math.random() * 3800);
  };
  window.setTimeout(blink, 1800 + Math.random() * 2000);
  return st;
});
function updateEyes(t: number, vy: number, rects: (DOMRect | null)[]) {
  eyes.forEach((e, n) => {
    const r = rects[n];
    if (!r) return;
    const s = Math.max(r.width / e.vbW, r.height / e.vbH); // preserveAspectRatio slice
    const ox = r.left + (r.width - e.vbW * s) / 2;
    const oy = r.top + (r.height - e.vbH * s) / 2;
    const ex = ox + ((e.centers[0][0] + e.centers[1][0]) / 2) * s;
    const ey = oy + ((e.centers[0][1] + e.centers[1][1]) / 2) * s;
    let tx: number;
    let ty: number;
    const idle = !pointer.active || (pointer.touch && performance.now() - pointer.last > 2500);
    if (idle) {
      // wander, and glance in the direction you scroll
      tx = Math.sin(t * 0.45) * 0.55 + Math.sin(t * 1.3) * 0.12;
      ty = Math.sin(t * 0.31) * 0.3 + clamp(vy * 0.04, -0.6, 0.6);
    } else {
      const dx = pointer.x - ex;
      const dy = pointer.y - ey;
      const d = Math.hypot(dx, dy);
      const k = Math.min(1, d / 320) / (d || 1);
      tx = dx * k;
      ty = dy * k;
    }
    e.x = lerp(e.x, tx, 0.14);
    e.y = lerp(e.y, ty, 0.14);
    const tf = `translate(${(e.x * e.rx).toFixed(2)}px, ${(e.y * e.ry).toFixed(2)}px)`;
    for (const pu of e.pupils) pu.style.transform = tf;
  });
}

/* ================================================================== */
/* Films: projector reel, previews, lightbox                            */
/* ================================================================== */
const films = $('.films');
const track = $('.films__track');
const filmEls = $$<HTMLElement>('.film');
const filmCards = filmEls.map((f) => $<HTMLElement>('.film__card', f));
const filmShades = filmEls.map((f) => $<HTMLElement>('.film__shade', f));
const filmCount = $('.films__count b');
const progressBar = $('.films__progress i');
let filmsDistance = 0;
let trackX = 0;
let centerIdx = -1;

const previewIO = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      const v = e.target as HTMLVideoElement;
      if (e.isIntersecting) {
        v.preload = 'auto';
        void v.play().catch(() => undefined);
      } else v.pause();
    }),
  {threshold: 0.75},
);
$$<HTMLElement>('.film[data-film]').forEach((card) => {
  const v = $<HTMLVideoElement>('video', card);
  if (fine) {
    card.addEventListener('pointerenter', () => {
      v.preload = 'auto';
      void v.play().catch(() => undefined);
    });
    card.addEventListener('pointerleave', () => v.pause());
  } else previewIO.observe(v);
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.addEventListener('click', () => openFilm(card.dataset.film!));
  card.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), openFilm(card.dataset.film!)));
});

const stage = $('.films__stage');
let filmCenters: number[] = [];
let stageLeft = 0;
function layoutFilms() {
  track.style.transform = '';
  trackX = 0;
  if (desktop() && !reduced) {
    filmsDistance = Math.max(0, track.scrollWidth - track.clientWidth);
    films.style.height = `${window.innerHeight + filmsDistance * 1.25}px`;
    films.classList.add('is-pinned');
  } else {
    filmsDistance = 0;
    films.style.height = '';
    films.classList.remove('is-pinned');
  }
  filmCenters = filmEls.map((f) => f.offsetLeft + f.offsetWidth / 2);
  stageLeft = stage.getBoundingClientRect().left;
}
layoutFilms();
window.addEventListener('resize', layoutFilms);
window.addEventListener('load', layoutFilms);

function updateFilms(vh: number, fr: DOMRect) {
  if (fr.bottom < -50 || fr.top > vh + 50) return;
  let shift: number;
  if (filmsDistance > 0) {
    const p = clamp(-fr.top / (fr.height - vh));
    trackX = lerp(trackX, -p * filmsDistance, 0.12);
    track.style.transform = `translate3d(${trackX.toFixed(2)}px, 0, 0)`;
    progressBar.style.transform = `scaleX(${p.toFixed(4)})`;
    shift = trackX;
  } else {
    const max = track.scrollWidth - track.clientWidth;
    progressBar.style.transform = `scaleX(${max > 0 ? (track.scrollLeft / max).toFixed(4) : 0})`;
    shift = -track.scrollLeft;
  }
  // projector reel: cards swing toward the light at the centre of the stage
  const mid = window.innerWidth / 2;
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < filmEls.length; i++) {
    const d = (stageLeft + filmCenters[i] + shift - mid) / (window.innerWidth * 0.55);
    const a = Math.min(1.2, Math.abs(d));
    if (Math.abs(d) < bestD) {
      bestD = Math.abs(d);
      best = i;
    }
    if (reduced) continue;
    filmCards[i].style.transform = `rotateY(${(-d * 16).toFixed(2)}deg) translateZ(${(-a * 90).toFixed(1)}px) scale(${(1 - a * 0.05).toFixed(3)})`;
    filmShades[i].style.opacity = (a * 0.62).toFixed(3);
  }
  if (best !== centerIdx) {
    centerIdx = best;
    filmCount.textContent = String(best + 1).padStart(2, '0');
  }
}

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
  }, 700);
}
$('.lightbox__close').addEventListener('click', closeFilm);
lb.addEventListener('click', (e) => e.target === lb && closeFilm());

/* ================================================================== */
/* Menu: a camera iris that opens from the button                       */
/* ================================================================== */
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
  const b = menuBtn.getBoundingClientRect();
  menu.style.setProperty('--ox', `${b.left + b.width - 20}px`);
  menu.style.setProperty('--oy', `${b.top + b.height / 2}px`);
  if (open) {
    menu.hidden = false;
    lenis?.stop();
    html.classList.add('is-locked');
    requestAnimationFrame(() => requestAnimationFrame(() => html.classList.add('menu-open')));
  } else {
    html.classList.remove('menu-open');
    html.classList.remove('is-locked');
    lenis?.start();
    menuTimer = window.setTimeout(() => (menu.hidden = true), 1100);
  }
}
menuBtn.addEventListener('click', () => setMenu(!menuOpen));
$$<HTMLAnchorElement>('.menu__list a').forEach((a) => {
  const show = () => {
    const src = a.dataset.preview!;
    if (frameImgs[frontImg].getAttribute('src') === src) return;
    const back = frameImgs[1 - frontImg];
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

$$<HTMLAnchorElement>('a[data-scroll]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if (!href?.startsWith('#')) return;
    e.preventDefault();
    if (menuOpen) {
      setMenu(false);
      window.setTimeout(() => scrollTo(href), 700);
    } else scrollTo(href);
  }),
);
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!lb.hidden) closeFilm();
  else if (menuOpen) setMenu(false);
});

/* ================================================================== */
/* Chapter marker: rolls to the section you're reading                  */
/* ================================================================== */
const chapter = $('.chapter');
const chapterNo = $('.chapter__no');
const chapterName = $('.chapter__name');
let currentChapter = '';
const setChapter = (val: string) => {
  if (val === currentChapter) return;
  currentChapter = val;
  chapter.classList.toggle('is-on', !!val);
  if (!val) return;
  const [no, name] = val.split('|');
  chapterNo.textContent = no;
  const old = chapterName.firstElementChild as HTMLElement | null;
  const next = document.createElement('span');
  next.textContent = name;
  next.className = 'is-enter';
  chapterName.appendChild(next);
  requestAnimationFrame(() => requestAnimationFrame(() => next.classList.remove('is-enter')));
  if (old) {
    old.classList.add('is-leave');
    window.setTimeout(() => old.remove(), 700);
  }
};
$$<HTMLElement>('[data-chapter]').forEach((s) =>
  new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting) setChapter(s.dataset.chapter ?? '');
      else if (s.id === 'about' && e.boundingClientRect.top > 0) setChapter('');
    },
    {rootMargin: '-48% 0px -48% 0px'},
  ).observe(s),
);

/* ================================================================== */
/* Index: filters, accordion, row spotlight                             */
/* ================================================================== */
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
    let n = 0;
    $$<HTMLLIElement>('.q').forEach((q) => {
      const show = f === 'all' || q.dataset.status === f;
      if (show) {
        q.hidden = false;
        q.classList.add('is-in');
        const delay = n++ * 45;
        requestAnimationFrame(() => {
          q.style.transitionDelay = `${delay}ms`;
          q.classList.remove('is-out');
        });
      } else {
        q.style.transitionDelay = '0ms';
        q.classList.add('is-out');
        window.setTimeout(() => q.classList.contains('is-out') && (q.hidden = true), 280);
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
  if (fine) btn.addEventListener('pointermove', (e) => btn.style.setProperty('--x', `${e.clientX - btn.getBoundingClientRect().left}px`));
});

/* ================================================================== */
/* Follow rows: light fills in from where you enter                      */
/* ================================================================== */
$$<HTMLElement>('.platform').forEach((p) => {
  const at = (e: PointerEvent) => {
    const r = p.getBoundingClientRect();
    p.style.setProperty('--fx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    p.style.setProperty('--fy', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
  };
  p.addEventListener('pointerenter', (e) => {
    at(e);
    p.classList.add('is-lit');
  });
  p.addEventListener('pointerleave', (e) => {
    at(e);
    p.classList.remove('is-lit');
  });
});

/* ================================================================== */
/* Cursor, spotlight, magnetic buttons (desktop)                        */
/* ================================================================== */
const cursor = $('.cursor');
const cursorLabel = $('.cursor__label');
const spot = $('.spot');
if (fine && !reduced) {
  html.classList.add('has-cursor');
  document.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
  window.addEventListener('pointermove', () => cursor.classList.add('is-visible'), {passive: true});
  document.addEventListener('pointerover', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-cursor], a, button');
    const label = t?.dataset.cursor ?? '';
    cursor.classList.toggle('is-hover', !!t && !label);
    cursor.classList.toggle('is-label', !!label);
    if (label) cursorLabel.textContent = label;
  });
  $$<HTMLElement>('.pill, .menu-btn, .platform__arrow, .lightbox__close span').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${((e.clientX - (r.left + r.width / 2)) * 0.2).toFixed(1)}px, ${((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1)}px)`;
    });
    el.addEventListener('pointerleave', () => (el.style.transform = ''));
  });
}

/* ================================================================== */
/* One rAF loop for everything scroll/pointer-linked                    */
/* ================================================================== */
const header = $('.header');
const hero = $('.hero');
const doodles = $('.doodles');
const parallax = $$<HTMLElement>('[data-parallax]');
const manifesto = $('[data-words]');
const ticker = $('.ticker__track');
let lastY = window.scrollY;
let vel = 0;
let tickerX = 0;
let cx = pointer.x;
let cy = pointer.y;
let sx = pointer.x;
let sy = pointer.y;
let activeWord = -2;
let heroVisible = true;
let footerVisible = false;
new IntersectionObserver(([e]) => (heroVisible = e.isIntersecting)).observe(hero);
new IntersectionObserver(([e]) => (footerVisible = e.isIntersecting)).observe($('.footer'));
const t0 = performance.now();

function frame(time: number) {
  lenis?.raf(time);
  const t = (time - t0) / 1000;
  const y = lenis ? lenis.scroll : window.scrollY;
  const vh = window.innerHeight;
  const dy = y - lastY;
  vel = lerp(vel, dy, 0.2);
  lastY = y;

  /* ---- READ: every layout measurement happens before any write ---- */
  const heroRect = heroVisible ? hero.getBoundingClientRect() : null;
  const parRects = reduced ? [] : parallax.map((el) => (el.parentElement as HTMLElement).getBoundingClientRect());
  const manRect = manifesto.getBoundingClientRect();
  const filmsRect = films.getBoundingClientRect();
  const eyeRects = eyes.map((e) => (e.visible ? e.svg.getBoundingClientRect() : null));
  const letterRects = !reduced && footerVisible && fine ? markLetters.map((l) => l.getBoundingClientRect()) : null;
  const tickerHalf = ticker.scrollWidth / 3;

  /* ---- WRITE ---- */
  if (!menuOpen) {
    if (y > 160 && dy > 2) header.classList.add('is-hidden');
    else if (dy < -2 || y < 160) header.classList.remove('is-hidden');
    header.classList.toggle('is-solid', y > 40);
  }

  if (!reduced) {
    parallax.forEach((el, i) => {
      const r = parRects[i];
      if (r.bottom < -100 || r.top > vh + 100) return;
      el.style.transform = `translate3d(0, ${((r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.parallax!)).toFixed(1)}px, 0) scale(1.12)`;
    });

    // hero: the spotlight reveals hidden science sketches
    if (heroRect) {
      const auto = !fine || !pointer.active || performance.now() - pointer.last > 4000;
      const tx = auto ? heroRect.width * (0.5 + Math.sin(t * 0.33) * 0.38) : pointer.x - heroRect.left;
      const ty = auto ? heroRect.height * (0.45 + Math.sin(t * 0.47) * 0.3) : pointer.y - heroRect.top;
      const nx = lerp(sx, tx, 0.08);
      const ny = lerp(sy, ty, 0.08);
      if (Math.abs(nx - sx) > 0.3 || Math.abs(ny - sy) > 0.3) {
        doodles.style.setProperty('--mx', `${nx.toFixed(1)}px`);
        doodles.style.setProperty('--my', `${ny.toFixed(1)}px`);
      }
      sx = nx;
      sy = ny;
    }

    // manifesto: the word being "read" lights up, like the captions in the films
    if (manRect.bottom > 0 && manRect.top < vh) {
      const p = clamp((vh * 0.78 - manRect.top) / (manRect.height + vh * 0.18));
      const idx = Math.floor(p * (manifestoWords.length + 1)) - 1;
      if (idx !== activeWord) {
        activeWord = idx;
        manifestoWords.forEach((w, i) => {
          w.classList.toggle('is-read', i < idx);
          w.classList.toggle('is-now', i === idx);
        });
      }
    }

    updateFilms(vh, filmsRect);

    // ticker speeds up with scrolling and leans into it
    tickerX -= 0.45 + Math.min(18, Math.abs(vel) * 0.6);
    if (tickerX <= -tickerHalf) tickerX += tickerHalf;
    ticker.style.transform = `translate3d(${tickerX.toFixed(1)}px, 0, 0) skewX(${clamp(-vel * 0.25, -8, 8).toFixed(2)}deg)`;

    // footer wordmark: letters near the cursor catch the light
    if (letterRects) {
      letterRects.forEach((r, i) => {
        const d = Math.hypot(pointer.x - (r.left + r.width / 2), pointer.y - (r.top + r.height / 2));
        const k = clamp(1 - d / 360).toFixed(2);
        if (markLetters[i].dataset.k !== k) {
          markLetters[i].dataset.k = k;
          markLetters[i].style.setProperty('--k', k);
        }
      });
    }
  }

  updateEyes(t, vel, eyeRects);

  if (fine && !reduced) {
    cx = lerp(cx, pointer.x, 0.22);
    cy = lerp(cy, pointer.y, 0.22);
    cursor.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
    spot.style.transform = `translate3d(${(cx - 450).toFixed(1)}px, ${(cy - 450).toFixed(1)}px, 0)`;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
