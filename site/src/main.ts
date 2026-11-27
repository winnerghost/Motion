import 'lenis/dist/lenis.css';
import './styles.css';
import {$, $$, html, reduced, fine, desktop, clamp, lerp, pointer, activity, lenis, scrollToTarget, lockScroll, toast, raf2} from './core';
import {createMenu} from './menu';
import {initLabs} from './labs';
import {initGame} from './game';
import {initCountdowns} from './countdown';
import {answerCard, toFile, shareFile} from './share';
import {SECRETS} from './facts';

const FILMS: Record<string, {meta: string; title: string; desc: string; src: string; poster: string}> = {
  ep006: {
    meta: 'No. 004 · Physics · 0:36',
    title: 'Are bananas radioactive?',
    desc: 'Yes, a little: about 15 potassium-40 atoms decay inside a banana every second. The twist? Thousands decay inside you.',
    src: '/media/ep006.mp4',
    poster: '/media/ep006.jpg',
  },
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
/* Pip's eyes: live pupils and lids over the video                      */
/* He follows you, blinks, squints when you get close, gets sleepy late */
/* at night, dozes off when you go quiet and gets dizzy if you fling    */
/* the page.                                                            */
/* ================================================================== */
type Eyes = {svg: SVGSVGElement; pupils: SVGGElement[]; centers: [number, number][]; vbW: number; vbH: number; rx: number; ry: number; x: number; y: number; visible: boolean};
type Mood = 'watch' | 'squint' | 'sleepy' | 'doze' | 'dizzy' | 'curious';
const SVGNS = 'http://www.w3.org/2000/svg';
const MOODS: Record<Mood, {lid: number; text: string}> = {
  watch: {lid: 0, text: 'He’s watching'},
  squint: {lid: 0.36, text: 'Squinting at you'},
  sleepy: {lid: 0.5, text: 'Sleepy, it’s late'},
  doze: {lid: 0.68, text: 'Dozing off…'},
  dizzy: {lid: 0.08, text: 'Whoa. Dizzy.'},
  curious: {lid: 0, text: 'Curious, isn’t he?'},
};

function blinkEyes(svg: SVGSVGElement) {
  svg.classList.remove('is-blink');
  void svg.getBoundingClientRect();
  svg.classList.add('is-blink');
  window.setTimeout(() => svg.classList.remove('is-blink'), 200);
}

/* replace the flat blink rects with real lids: a curved edge and a lash line that slide down */
function buildLids(svg: SVGSVGElement) {
  $$<SVGRectElement>('rect.lid', svg).forEach((rect) => {
    const ell = svg.querySelector<SVGEllipseElement>(`${rect.parentElement!.getAttribute('clip-path')!.slice(4, -1)} ellipse`);
    if (!ell) return;
    const cx = ell.cx.baseVal.value;
    const cy = ell.cy.baseVal.value;
    const rx = ell.rx.baseVal.value;
    const ry = ell.ry.baseVal.value;
    const bulge = ry * 0.3;
    const yb = cy - ry - bulge;
    const x0 = cx - rx - 12;
    const x1 = cx + rx + 12;
    const g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', 'lid');
    const body = document.createElementNS(SVGNS, 'path');
    body.setAttribute('d', `M ${x0} ${yb - ry * 2.4} L ${x1} ${yb - ry * 2.4} L ${x1} ${yb} Q ${cx} ${yb + bulge * 2} ${x0} ${yb} Z`);
    body.setAttribute('fill', rect.getAttribute('fill') ?? '#ffa244');
    const lash = document.createElementNS(SVGNS, 'path');
    lash.setAttribute('d', `M ${x0} ${yb} Q ${cx} ${yb + bulge * 2} ${x1} ${yb}`);
    lash.setAttribute('fill', 'none');
    lash.setAttribute('stroke', '#7a3510');
    lash.setAttribute('stroke-opacity', '0.55');
    lash.setAttribute('stroke-width', String(Math.round(ry * 0.07)));
    lash.setAttribute('stroke-linecap', 'round');
    g.append(body, lash);
    rect.replaceWith(g);
    svg.style.setProperty('--travel', `${(ry * 2 + bulge + 2).toFixed(1)}px`);
  });
}

const eyes: Eyes[] = $$<SVGSVGElement>('svg[data-eyes]').map((svg) => {
  buildLids(svg);
  const [rx, ry] = (svg.dataset.range ?? '20 24').split(' ').map(Number);
  const vb = svg.viewBox.baseVal;
  const centers = $$<SVGEllipseElement>('clipPath ellipse', svg).map((e) => [e.cx.baseVal.value, e.cy.baseVal.value] as [number, number]);
  const st: Eyes = {svg, pupils: $$<SVGGElement>('.pupil', svg), centers, vbW: vb.width, vbH: vb.height, rx, ry, x: 0, y: 0, visible: false};
  new IntersectionObserver(([e]) => (st.visible = e.isIntersecting)).observe(svg);
  // natural, irregular blinking
  const blink = () => {
    if (st.visible && !reduced) {
      blinkEyes(svg);
      if (Math.random() < 0.18) window.setTimeout(() => blinkEyes(svg), 330);
    }
    window.setTimeout(blink, 2400 + Math.random() * 3800);
  };
  window.setTimeout(blink, 1800 + Math.random() * 2000);
  return st;
});

const moodEl = $('.hero .mood');
let mood: Mood = 'watch';
let dizzyUntil = 0;
let curiousUntil = 0;
let night = false;
const checkNight = () => {
  const h = new Date().getHours();
  night = h >= 23 || h < 6;
};
checkNight();
window.setInterval(checkNight, 60000);

function setMood(m: Mood) {
  if (m === mood) return;
  const wasAsleep = mood === 'doze' || mood === 'sleepy';
  mood = m;
  eyes.forEach((e) => {
    e.svg.style.setProperty('--lid', String(MOODS[m].lid));
    if (m === 'watch' && wasAsleep) blinkEyes(e.svg);
  });
  if (moodEl) {
    moodEl.classList.add('is-swap');
    window.setTimeout(() => {
      moodEl.textContent = MOODS[m].text;
      moodEl.classList.remove('is-swap');
    }, 220);
  }
}

function updateEyes(t: number, vy: number, rects: (DOMRect | null)[], heroOn: boolean) {
  const now = performance.now();
  if (Math.abs(vy) > 70 && !reduced) dizzyUntil = now + 1500;
  let near = false;
  const idle = !pointer.active || (pointer.touch && now - pointer.last > 2500);
  eyes.forEach((e, n) => {
    const r = rects[n];
    if (!r) return;
    const s = Math.max(r.width / e.vbW, r.height / e.vbH); // preserveAspectRatio slice
    const ox = r.left + (r.width - e.vbW * s) / 2;
    const oy = r.top + (r.height - e.vbH * s) / 2;
    const ex = ox + ((e.centers[0][0] + e.centers[1][0]) / 2) * s;
    const ey = oy + ((e.centers[0][1] + e.centers[1][1]) / 2) * s;
    const span = Math.abs(e.centers[1][0] - e.centers[0][0]) * s;
    let tx: number;
    let ty: number;
    if (now < dizzyUntil) {
      tx = Math.cos(t * 11) * 0.95;
      ty = Math.sin(t * 11) * 0.95;
    } else if (now < curiousUntil) {
      tx = Math.sin(t * 2.2) * 0.12;
      ty = -0.15;
    } else if (mood === 'doze') {
      tx = Math.sin(t * 0.3) * 0.15;
      ty = 0.55;
    } else if (idle) {
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
      if (fine && d < span * 0.95) near = true;
    }
    const k = now < dizzyUntil ? 0.3 : 0.14;
    e.x = lerp(e.x, tx, k);
    e.y = lerp(e.y, ty, k);
    const tf = `translate(${(e.x * e.rx).toFixed(2)}px, ${(e.y * e.ry).toFixed(2)}px)`;
    for (const pu of e.pupils) pu.style.transform = tf;
  });
  if (reduced) return;
  const quiet = now - activity.last > 25000;
  const next: Mood = now < dizzyUntil ? 'dizzy' : now < curiousUntil ? 'curious' : near ? 'squint' : quiet ? 'doze' : night ? 'sleepy' : 'watch';
  if (next !== mood && (heroOn || eyes.some((e) => e.visible))) setMood(next);
}

/* type "why" anywhere: Pip shares a secret */
(function secrets() {
  let buf = '';
  let n = Math.floor(Math.random() * SECRETS.length);
  window.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, select') || e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-3);
    if (buf !== 'why') return;
    buf = '';
    n = (n + 1) % SECRETS.length;
    toast(SECRETS[n]);
    curiousUntil = performance.now() + 3500;
    eyes.forEach((e) => blinkEyes(e.svg));
  });
})();

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
  lockScroll(true);
  requestAnimationFrame(() => requestAnimationFrame(() => lb.classList.add('is-open')));
  void lbVideo.play().catch(() => undefined);
  $<HTMLButtonElement>('.lightbox__close').focus({preventScroll: true});
}
function closeFilm() {
  lb.classList.remove('is-open');
  lbVideo.pause();
  lockScroll(false);
  lbTimer = window.setTimeout(() => {
    lb.hidden = true;
    lbVideo.removeAttribute('src');
    lbVideo.load();
  }, 700);
}
$('.lightbox__close').addEventListener('click', closeFilm);
lb.addEventListener('click', (e) => e.target === lb && closeFilm());

/* ================================================================== */
/* Menu: lights out, Pip's antenna becomes a spotlight (see menu.ts)    */
/* ================================================================== */
let currentChapter = '';
const menu = createMenu(() => (currentChapter ? Math.max(0, parseInt(currentChapter, 10) - 1) : 0));

$$<HTMLAnchorElement>('a[data-scroll]').forEach((a) => {
  if (a.closest('.menu')) return;
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if (!href?.startsWith('#')) return;
    e.preventDefault();
    scrollToTarget(href);
  });
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !lb.hidden) closeFilm();
});

/* ================================================================== */
/* Chapter marker: rolls to the section you're reading                  */
/* ================================================================== */
const chapter = $('.chapter');
const chapterNo = $('.chapter__no');
const chapterName = $('.chapter__name');
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

/* share an answer as a story card */
$$<HTMLLIElement>('.q').forEach((q) => {
  const body = $('.q__body > div', q);
  const btn = document.createElement('button');
  btn.className = 'q__share link link--line';
  btn.innerHTML = 'Share this answer <span class="arrow">&nearr;</span>';
  body.appendChild(btn);
  let ready: Promise<File | null> | null = null;
  const prep = () =>
    (ready ??= answerCard({
      no: $('.q__no', q).textContent ?? '',
      field: $('.q__field', q).textContent ?? '',
      question: $('.q__title', q).textContent ?? '',
      answer: $('p', body).textContent ?? '',
    }).then((c) => toFile(c, `pip-explains-${$('.q__no', q).textContent}.png`)));
  $('.q__row', q).addEventListener('click', () => void prep());
  btn.addEventListener('click', async () => {
    const f = await prep();
    if (!f) return;
    const r = await shareFile(f, `${$('.q__title', q).textContent} ${location.origin}/#index`);
    if (r === 'downloaded') btn.firstChild!.textContent = 'Saved to your device ';
  });
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
let pagePaused = false;
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
  menu.frame();
  const inMenu = menu.isRunning() && html.classList.contains('menu-open') && !html.classList.contains('menu-closing');
  if (inMenu !== pagePaused) {
    pagePaused = inMenu;
    const hv = $<HTMLVideoElement>('.hero video');
    if (inMenu) hv.pause();
    else if (heroVisible) void hv.play().catch(() => undefined);
  }
  if (!menu.isRunning()) {
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

  if (!pagePaused) updateEyes(t, vel, eyeRects, heroVisible);

  if (fine && !reduced) {
    cx = lerp(cx, pointer.x, 0.22);
    cy = lerp(cy, pointer.y, 0.22);
    cursor.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
    spot.style.transform = `translate3d(${(cx - 450).toFixed(1)}px, ${(cy - 450).toFixed(1)}px, 0)`;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

initLabs();
initGame();
initCountdowns();
