import {$, $$, clamp, store, reduced} from './core';
import {STATEMENTS, type Statement} from './facts';
import {scoreCard, toFile, shareFile} from './share';

/* ================================================================== */
/* Fact or myth: five statements a day, the same set for everyone       */
/* ================================================================== */
type Pick = 'fact' | 'myth';
type Saved = {day: number; picks: Pick[]};
type Streak = {last: number; streak: number; best: number};

const EPOCH = Date.UTC(2026, 10, 24); // Set No. 1
const PER_DAY = 5;

function dayNumber(d = new Date()) {
  return Math.max(0, Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / 864e5));
}
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(arr: T[], r: () => number) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function setFor(day: number): Statement[] {
  const facts = shuffle(STATEMENTS.filter((s) => s.fact), rng(1234));
  const myths = shuffle(STATEMENTS.filter((s) => !s.fact), rng(5678));
  const r = rng(day * 7919 + 17);
  const nFacts = r() < 0.5 ? 2 : 3;
  const pick = (list: Statement[], start: number, n: number) => Array.from({length: n}, (_, i) => list[(start + i) % list.length]);
  return shuffle([...pick(facts, day * 3, nFacts), ...pick(myths, day * 3, PER_DAY - nFacts)], r);
}
const VERDICTS = ['Even Pip believed some of these once.', 'Tricky set. Tomorrow’s yours.', 'The myths got you today.', 'Solid instincts.', 'Sharper than most.', 'Flawless. Pip is impressed.'];
const pad = (n: number) => String(n).padStart(2, '0');
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]!);

export function initGame() {
  const root = $('.game');
  if (!root) return;
  const stageEl = $('.game__stage', root);
  const deck = $('.game__deck', root);
  const dotsEl = $('.game__dots', root);
  const noEl = $('.game__no', root);
  const streakEl = $('.game__streak', root);
  const buttons = $$<HTMLButtonElement>('.gbtn', root);

  const day = dayNumber();
  const set = setFor(day);
  let saved = store.get<Saved>('pip.game.v1', {day: -1, picks: []});
  if (saved.day !== day || !Array.isArray(saved.picks)) saved = {day, picks: []};
  let streak = store.get<Streak>('pip.streak.v1', {last: -9, streak: 0, best: 0});
  if (streak.last < day - 1) streak = {...streak, streak: 0};
  let card: HTMLElement | null = null;
  let answered = false;
  let inView = false;
  let cdTimer = 0;
  let shareReady: Promise<File | null> | null = null;

  noEl.textContent = `Set No. ${day + 1}`;
  const results = () => saved.picks.map((p, i) => (p === 'fact') === set[i].fact);
  const score = () => results().filter(Boolean).length;

  function renderMeta() {
    const res = results();
    dotsEl.innerHTML = set.map((_, i) => `<i class="gdot${i < res.length ? (res[i] ? ' is-right' : ' is-wrong') : i === res.length ? ' is-now' : ''}"></i>`).join('');
    streakEl.textContent = `Streak ${streak.streak}`;
  }

  function render() {
    window.clearInterval(cdTimer);
    renderMeta();
    const i = saved.picks.length;
    answered = false;
    stageEl.classList.remove('is-answered');
    if (i >= set.length) return renderSummary();
    const s = set[i];
    const peeks = Math.min(2, set.length - i - 1);
    deck.innerHTML =
      Array.from({length: peeks}, (_, d) => `<div class="gpeek" style="--d:${peeks - d}"></div>`).join('') +
      `<article class="gcard is-enter" aria-live="polite">
        <div class="gcard__inner">
          <div class="gcard__face">
            <span class="label gcard__no">Statement ${pad(i + 1)} / ${pad(set.length)}</span>
            <p class="gcard__text">${esc(s.text)}</p>
            <span class="gcard__stamp gcard__stamp--fact" aria-hidden="true">Fact</span>
            <span class="gcard__stamp gcard__stamp--myth" aria-hidden="true">Myth</span>
            <div class="gcard__hint label" aria-hidden="true"><span>&larr; Myth</span><span>Drag or tap</span><span>Fact &rarr;</span></div>
          </div>
          <div class="gcard__back" aria-hidden="true">
            <span class="label gcard__verdict"></span>
            <p class="gcard__result"></p>
            <p class="gcard__why"></p>
            <button class="pill pill--solid gcard__next" tabindex="-1"><span>${i + 1 < set.length ? 'Next statement' : 'See my score'}</span> <span class="arrow">&rarr;</span></button>
          </div>
        </div>
      </article>`;
    card = $('.gcard', deck);
    requestAnimationFrame(() => requestAnimationFrame(() => card?.classList.remove('is-enter')));
    bindDrag(card);
    $('.gcard__next', card).addEventListener('click', next);
  }

  function bindDrag(el: HTMLElement) {
    let sx = 0;
    let sy = 0;
    let dx = 0;
    let id = -1;
    let horiz: boolean | null = null;
    const reset = () => {
      el.style.transform = '';
      el.style.setProperty('--fact', '0');
      el.style.setProperty('--myth', '0');
    };
    el.addEventListener('pointerdown', (e) => {
      if (answered || (e.target as HTMLElement).closest('button')) return;
      id = e.pointerId;
      sx = e.clientX;
      sy = e.clientY;
      dx = 0;
      horiz = e.pointerType === 'mouse' ? true : null;
      el.classList.add('is-drag');
    });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id || answered) return;
      const mx = e.clientX - sx;
      const my = e.clientY - sy;
      if (horiz === null && Math.hypot(mx, my) > 8) {
        horiz = Math.abs(mx) > Math.abs(my);
        if (horiz) el.setPointerCapture(id);
        else {
          id = -1;
          el.classList.remove('is-drag');
          return;
        }
      }
      if (!horiz) return;
      dx = mx;
      el.style.transform = `translate3d(${dx.toFixed(1)}px, ${(Math.abs(dx) * 0.04).toFixed(1)}px, 0) rotate(${(dx * 0.045).toFixed(2)}deg)`;
      el.style.setProperty('--fact', clamp(dx / 110).toFixed(3));
      el.style.setProperty('--myth', clamp(-dx / 110).toFixed(3));
    });
    const end = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = -1;
      el.classList.remove('is-drag');
      if (!answered && horiz && Math.abs(dx) > 95) answer(dx > 0 ? 'fact' : 'myth');
      else reset();
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  function answer(pick: Pick) {
    if (answered || !card || saved.picks.length >= set.length) return;
    answered = true;
    const i = saved.picks.length;
    const s = set[i];
    const right = (pick === 'fact') === s.fact;
    saved.picks.push(pick);
    store.set('pip.game.v1', saved);
    if (saved.picks.length === set.length) {
      if (streak.last !== day) streak = {last: day, streak: streak.last === day - 1 ? streak.streak + 1 : 1, best: streak.best || 0};
      streak.best = Math.max(streak.best || 0, streak.streak);
      store.set('pip.streak.v1', streak);
    }
    card.dataset.pick = pick;
    card.style.transform = '';
    card.style.setProperty('--fact', pick === 'fact' ? '1' : '0');
    card.style.setProperty('--myth', pick === 'myth' ? '1' : '0');
    $('.gcard__verdict', card).textContent = s.fact ? 'It’s a fact' : 'It’s a myth';
    $('.gcard__result', card).textContent = right ? 'You got it.' : 'Not quite.';
    $('.gcard__why', card).textContent = s.why;
    card.classList.add('is-answered', right ? 'is-right' : 'is-wrong', s.fact ? 'is-fact' : 'is-myth');
    $('.gcard__back', card).removeAttribute('aria-hidden');
    stageEl.classList.add('is-answered');
    renderMeta();
    try {
      navigator.vibrate?.(right ? 14 : [10, 70, 10]);
    } catch {
      /* not supported */
    }
    const nb = $<HTMLButtonElement>('.gcard__next', card);
    nb.tabIndex = 0;
    window.setTimeout(() => nb.focus({preventScroll: true}), reduced ? 0 : 650);
  }

  function next() {
    if (!card || !answered) return;
    const c = card;
    c.classList.add(c.dataset.pick === 'fact' ? 'is-out-right' : 'is-out-left');
    card = null;
    window.setTimeout(render, reduced ? 0 : 420);
  }

  function renderSummary() {
    const res = results();
    const sc = score();
    stageEl.classList.add('is-done');
    deck.innerHTML = `<article class="gcard gcard--summary is-enter">
      <div class="gsum">
        <span class="label">Set No. ${day + 1} &middot; complete</span>
        <p class="gsum__score"><b>${sc}</b><em>/${set.length}</em></p>
        <div class="gsum__dots">${res.map((r) => `<i class="gdot ${r ? 'is-right' : 'is-wrong'}"></i>`).join('')}</div>
        <p class="gsum__verdict">${VERDICTS[sc]}</p>
        <div class="gsum__stats label"><span>Streak <b>${streak.streak}</b></span><span>Best <b>${Math.max(streak.best || 0, streak.streak)}</b></span></div>
        <div class="gsum__actions">
          <button class="pill pill--solid gsum__share" data-cursor="Share"><span>Share my score</span> <span class="arrow">&nearr;</span></button>
          <button class="link link--line gsum__review">Review answers</button>
        </div>
        <p class="label gsum__next">New set in <b class="gsum__cd">--:--:--</b></p>
      </div>
      <ol class="gsum__list" hidden>${set
        .map(
          (s, i) =>
            `<li class="${res[i] ? 'is-right' : 'is-wrong'}"><span class="label">${s.fact ? 'Fact' : 'Myth'} &middot; ${res[i] ? 'you got it' : 'missed'}</span><p>${esc(s.text)}</p><small>${esc(s.why)}</small></li>`,
        )
        .join('')}</ol>
    </article>`;
    const el = $('.gcard', deck);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('is-enter')));
    shareReady = scoreCard({set: day + 1, score: sc, results: res, streak: streak.streak, verdict: VERDICTS[sc]}).then((c) => toFile(c, `pip-fact-or-myth-${day + 1}.png`));
    const shareBtn = $<HTMLButtonElement>('.gsum__share', el);
    shareBtn.addEventListener('click', async () => {
      const f = await shareReady;
      if (!f) return;
      const r = await shareFile(f, `I scored ${sc}/${set.length} on Pip Explains’ Fact or Myth (Set No. ${day + 1}). Can you beat it? ${location.origin}/#play`);
      if (r === 'downloaded') $('span', shareBtn).textContent = 'Saved to your device';
    });
    const list = $('.gsum__list', el);
    $('.gsum__review', el).addEventListener('click', (e) => {
      list.hidden = !list.hidden;
      (e.currentTarget as HTMLElement).textContent = list.hidden ? 'Review answers' : 'Hide answers';
    });
    const cd = $('.gsum__cd', el);
    const tick = () => {
      const now = new Date();
      const mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      let s = Math.max(0, Math.floor((mid.getTime() - now.getTime()) / 1000));
      if (s === 0) return window.location.reload();
      const h = Math.floor(s / 3600);
      s -= h * 3600;
      cd.textContent = `${pad(h)}:${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
    };
    tick();
    cdTimer = window.setInterval(tick, 1000);
  }

  buttons.forEach((b) => b.addEventListener('click', () => answer(b.dataset.answer as Pick)));
  new IntersectionObserver(([e]) => (inView = e.isIntersecting), {threshold: 0.4}).observe(stageEl);
  window.addEventListener('keydown', (e) => {
    if (!inView || document.documentElement.classList.contains('menu-open')) return;
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, select')) return;
    if (!answered && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      answer(e.key === 'ArrowRight' ? 'fact' : 'myth');
    }
  });
  render();
}
