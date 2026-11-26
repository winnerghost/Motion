import {$, $$, html, reduced, fine, clamp, lerp, raf2, pointer, scrollToTarget, lockScroll} from './core';

/* ================================================================== */
/* Lights-out menu                                                      */
/* The page loses power, Pip's antenna bulb (the menu button) becomes a */
/* spotlight, and its beam swings across a dark room to light the words */
/* Choosing a destination cuts the light, moves you there in the dark   */
/* and switches the lights back on in the new room.                     */
/* ================================================================== */

type Item = {a: HTMLAnchorElement; no: HTMLElement; letters: HTMLElement[]; lx: number[]; ly: number[]; lv: number[]; left: number; right: number; cy: number; k: number};

const BEAM_W = 800; // beam box (px) before scaling; cone half-angle ~20deg
const BEAM_L = 1000;

/* The beam is painted once into an image (soft cone, hot core, dust in the air), so on screen it
   is a single plain layer that only ever rotates and scales: no masks, nothing repainted per frame. */
function paintBeam(el: HTMLElement) {
  const W = 400;
  const H = 500;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  if (!g) return;
  const img = g.createImageData(W, H);
  const d = img.data;
  const deg = 180 / Math.PI;
  const sm = (e0: number, e1: number, x: number) => {
    const t = clamp((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - W / 2;
      const dy = y + 0.5;
      const a = Math.abs(Math.atan2(dx, dy)) * deg; // 0 = straight down the beam
      const r = Math.hypot(dx, dy) / H;
      const len = Math.pow(clamp(1 - r), 1.2);
      const hot = 1 + 0.9 * Math.exp(-r * 8);
      const end = sm(0.98, 0.62, r); // fade out well before the edge of the box
      const alpha = (sm(21, 6, a) * 0.3 * (0.35 + 0.65 * len) + sm(7.5, 0.8, a) * 0.36 * len) * hot * end;
      const i = (y * W + x) * 4;
      d[i] = 255;
      d[i + 1] = Math.round(236 - 34 * r);
      d[i + 2] = Math.round(212 - 70 * r);
      d[i + 3] = Math.round(clamp(alpha) * 255);
    }
  }
  g.putImageData(img, 0, 0);
  // dust motes floating in the light
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let k = 0; k < 170; k++) {
    const r = 0.06 + rnd() * 0.9;
    const a = (rnd() * 2 - 1) * 17;
    const x = W / 2 + Math.sin(a / deg) * r * H;
    const y = Math.cos(a / deg) * r * H;
    g.fillStyle = `rgba(255, 244, 228, ${(0.25 + rnd() * 0.55) * (1 - r * 0.85) * sm(19, 9, Math.abs(a))})`;
    g.beginPath();
    g.arc(x, y, 0.5 + rnd() * 1.1, 0, Math.PI * 2);
    g.fill();
  }
  el.style.backgroundImage = `url(${c.toDataURL('image/png')})`;
}

export function createMenu(getCurrent: () => number) {
  const menu = $('.menu');
  const btn = $<HTMLButtonElement>('.menu-btn');
  const icon = $('.menu-btn__icon');
  const beam = $('.menu__beam');
  const pool = $('.menu__pool');
  const poolInner = $('.menu__pool-inner');
  const imgs = $$<HTMLImageElement>('.menu__pool-inner img');
  const caption = $('.menu__caption');
  const countEl = $('.menu__count b');
  const items: Item[] = $$<HTMLAnchorElement>('.menu__list a').map((a) => ({
    a,
    no: $('.menu__no', a),
    letters: $$('.ml', a),
    lx: [],
    ly: [],
    lv: [],
    left: 0,
    right: 0,
    cy: 0,
    k: 0,
  }));

  let open = false;
  let running = false;
  let power = 0;
  let powerTarget = 0;
  let bx = 0;
  let by = 0;
  let px = 0;
  let py = 0;
  let tx = 0;
  let ty = 0;
  let poolW = 0;
  let poolH = 0;
  let spacing = 80;
  let mode: 'sweep' | 'follow' | 'lock' = 'sweep';
  let ignitedAt = 0;
  let restIdx = 0;
  let hoverIdx = -1;
  let focusIdx = -1;
  let lockIdx = -1;
  let shownIdx = -1;
  let frontImg = 0;
  let timers: number[] = [];
  const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, reduced ? 0 : ms));
  const clearTimers = () => {
    timers.forEach((t) => window.clearTimeout(t));
    timers = [];
  };

  function measure() {
    const b = icon.getBoundingClientRect();
    bx = b.left + b.width / 2;
    by = b.top + b.height / 2;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    poolW = vw > 960 ? Math.min(vw * 0.62, 860) : vw * 1.15;
    poolH = vw > 960 ? Math.min(vh * 0.44, 380) : Math.min(vh * 0.3, 250);
    pool.style.width = `${poolW}px`;
    pool.style.height = `${poolH}px`;
    poolInner.style.width = `${vw}px`;
    poolInner.style.height = `${vh}px`;
    items.forEach((it) => {
      const r = it.a.getBoundingClientRect();
      it.cy = r.top + r.height / 2;
      it.lx = it.letters.map((l) => r.left + l.offsetLeft + l.offsetWidth / 2);
      it.ly = it.letters.map((l) => r.top + l.offsetTop + l.offsetHeight / 2);
      it.right = it.lx.length ? it.lx[it.lx.length - 1] : r.right;
      it.left = it.lx.length ? it.lx[0] : r.left;
      it.lv = it.letters.map(() => -1);
    });
    // words are lit by a tighter falloff than the visible glow, so the aimed word clearly wins
    spacing = items.length > 1 ? Math.abs(items[1].cy - items[0].cy) : 80;
  }

  function show(idx: number) {
    if (idx < 0 || idx === shownIdx) return;
    shownIdx = idx;
    const a = items[idx].a;
    items.forEach((it, i) => it.a.classList.toggle('is-lit', i === idx));
    caption.textContent = a.dataset.caption ?? '';
    countEl.textContent = String(idx + 1).padStart(2, '0');
    const src = a.dataset.preview!;
    if (imgs[frontImg].getAttribute('src') !== src) {
      const back = imgs[1 - frontImg];
      back.src = src;
      back.classList.add('is-front');
      imgs[frontImg].classList.remove('is-front');
      frontImg = 1 - frontImg;
    }
  }

  function aim(idx: number, x?: number) {
    const it = items[idx];
    const mid = (it.left + it.right) / 2;
    tx = x === undefined ? mid : clamp(x, it.left + 30, Math.max(it.left + 30, it.right - 30));
    ty = it.cy;
  }

  function setOpen() {
    if (open) return;
    clearTimers();
    open = true;
    running = true;
    menu.hidden = false;
    html.classList.remove('menu-closing', 'lights-on', 'menu-blackout');
    btn.setAttribute('aria-expanded', 'true');
    lockScroll(true);
    measure();
    restIdx = clamp(getCurrent(), 0, items.length - 1);
    hoverIdx = focusIdx = lockIdx = -1;
    shownIdx = -1;
    mode = reduced ? 'follow' : 'sweep';
    // the beam wakes up pointing at the floor below the bulb
    px = tx = bx - 60;
    py = ty = by + 260;
    power = reduced ? 1 : 0;
    powerTarget = reduced ? 1 : 0;
    show(restIdx);
    raf2(() => html.classList.add('menu-open'));
    later(() => {
      powerTarget = 1;
      ignitedAt = performance.now();
    }, 420);
    menu.focus({preventScroll: true});
  }

  function setClosed(fromNav = false) {
    if (!open) return;
    open = false;
    clearTimers();
    btn.setAttribute('aria-expanded', 'false');
    powerTarget = 0;
    html.classList.add('menu-closing');
    later(() => {
      html.classList.remove('menu-open', 'menu-blackout');
      html.classList.add('lights-on');
      lockScroll(false);
    }, fromNav ? 60 : 340);
    later(() => {
      menu.hidden = true;
      running = false;
      html.classList.remove('menu-closing', 'lights-on');
      items.forEach((it) => it.a.classList.remove('is-chosen'));
      menu.classList.remove('is-choosing');
    }, fromNav ? 1300 : 1500);
  }

  /* choosing a room: lock the light on it, cut the power, move, lights on */
  function go(idx: number) {
    if (!open || mode === 'lock') return;
    const href = items[idx].a.getAttribute('href')!;
    mode = 'lock';
    lockIdx = idx;
    show(idx);
    items[idx].a.classList.add('is-chosen');
    menu.classList.add('is-choosing');
    later(() => {
      html.classList.add('menu-blackout');
      powerTarget = 0;
    }, 480);
    later(() => scrollToTarget(href, true), 900);
    later(() => setClosed(true), 980);
  }

  btn.addEventListener('click', () => (open ? setClosed() : setOpen()));
  items.forEach((it, i) => {
    it.a.addEventListener('click', (e) => {
      e.preventDefault();
      go(i);
    });
    it.a.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') hoverIdx = i;
    });
    it.a.addEventListener('pointerleave', () => hoverIdx === i && (hoverIdx = -1));
    it.a.addEventListener('focus', () => (focusIdx = i));
    it.a.addEventListener('blur', () => focusIdx === i && (focusIdx = -1));
  });
  window.addEventListener('resize', () => running && measure());
  window.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') setClosed();
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const cur = focusIdx >= 0 ? focusIdx : shownIdx;
      const next = (cur + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next].a.focus();
    }
  });
  imgs[0].classList.add('is-front');
  paintBeam(beam);

  /* called from the main rAF loop */
  function frame() {
    if (!running) return;
    power = reduced ? powerTarget : lerp(power, powerTarget, powerTarget > power ? 0.07 : 0.2);
    const now = performance.now();

    if (mode === 'sweep' && ignitedAt) {
      const el = now - ignitedAt;
      // swing in low across the room, then come to rest on the room you're in
      aim(el < 480 ? items.length - 1 : restIdx);
      if (el > 1250) mode = 'follow';
    } else if (mode === 'follow') {
      const mouse = fine && pointer.active && !pointer.touch && pointer.last > ignitedAt + 200;
      if (focusIdx >= 0) aim(focusIdx);
      else if (hoverIdx >= 0) aim(hoverIdx, mouse ? pointer.x : undefined);
      else if (mouse) {
        tx = pointer.x;
        ty = pointer.y;
      } else aim(restIdx);
    } else if (mode === 'lock') aim(lockIdx);

    const k = reduced ? 1 : mode === 'lock' ? 0.18 : mode === 'sweep' ? 0.06 : 0.11;
    px = lerp(px, tx, k);
    py = lerp(py, ty, k);

    // beam: rotate around the bulb toward the pool; length follows the distance
    const dx = px - bx;
    const dy = py - by;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const ang = Math.atan2(-dx, dy);
    const grow = 1 - Math.pow(1 - clamp(power), 3);
    const s = Math.max(0.002, ((dist * 1.08) / BEAM_L) * (0.04 + 0.96 * grow));
    beam.style.transform = `translate3d(${(bx - BEAM_W / 2).toFixed(1)}px, ${by.toFixed(1)}px, 0) rotate(${((ang * 180) / Math.PI).toFixed(2)}deg) scale(${s.toFixed(4)})`;
    beam.style.opacity = clamp(power * 1.15).toFixed(3);

    // pool of light on the wall; the picture behind it stays pinned to the room
    const ox = px - poolW / 2;
    const oy = py - poolH / 2;
    pool.style.transform = `translate3d(${ox.toFixed(1)}px, ${oy.toFixed(1)}px, 0)`;
    poolInner.style.transform = `translate3d(${(-ox).toFixed(1)}px, ${(-oy).toFixed(1)}px, 0)`;
    pool.style.opacity = clamp(power * 1.3 - 0.3).toFixed(3);

    // light every letter by how much of the pool (and the beam) falls on it
    const rx = poolW * 0.4;
    const ry = spacing * 1.35;
    const cosEdge = Math.cos((13 * Math.PI) / 180);
    const base = pointer.touch || !fine ? 0.3 : 0.15;
    let best = -1;
    let bestK = 0.12;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      let sum = 0;
      for (let j = 0; j < it.letters.length; j++) {
        const ex = (it.lx[j] - px) / rx;
        const ey = (it.ly[j] - py) / ry;
        let lit = clamp(1 - (ex * ex + ey * ey));
        lit = lit * lit * (3 - 2 * lit);
        // spill from the beam on its way to the wall
        const lxv = it.lx[j] - bx;
        const lyv = it.ly[j] - by;
        const ld = Math.hypot(lxv, lyv);
        if (ld < dist) {
          const c = (lxv * dx + lyv * dy) / (ld * dist || 1);
          if (c > cosEdge) lit = Math.max(lit, ((c - cosEdge) / (1 - cosEdge)) * 0.35);
        }
        lit *= power;
        sum += lit;
        const v = Math.round((base + (1 - base) * lit) * 100) / 100;
        if (v !== it.lv[j]) {
          it.lv[j] = v;
          it.letters[j].style.opacity = String(v);
        }
      }
      it.k = it.letters.length ? sum / it.letters.length : 0;
      it.no.style.opacity = (0.25 + 0.75 * clamp(it.k * 1.6)).toFixed(2);
      if (it.k > bestK) {
        bestK = it.k;
        best = i;
      }
    }
    if (mode !== 'lock' && best >= 0 && power > 0.5) show(best);
  }

  return {
    frame,
    isOpen: () => open,
    isRunning: () => running,
    close: () => setClosed(),
  };
}
