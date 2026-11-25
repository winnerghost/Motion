import React, {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {EPISODES, Episode, FACTS, finePointer, LINKS, reducedMotion, sound, useInView} from './lib';
import {IgIcon, YtIcon} from './Hero';

/* ------------------------------------------------------------------ */
/* Marquee — speed & direction follow your scrolling                    */
/* ------------------------------------------------------------------ */
export const Marquee: React.FC<{velocity: React.MutableRefObject<number>}> = ({velocity}) => {
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let x = 0;
    let raf = 0;
    let dir = 1;
    const loop = () => {
      const v = velocity.current;
      if (Math.abs(v) > 0.2) dir = Math.sign(v);
      x -= (0.6 + Math.min(14, Math.abs(v) * 0.9)) * dir;
      const w = (a.current?.scrollWidth ?? 2000) / 2;
      if (x < -w) x += w;
      if (x > 0) x -= w;
      if (a.current) a.current.style.transform = `translate3d(${x}px,0,0)`;
      if (b.current) b.current.style.transform = `translate3d(${-w - x}px,0,0)`;
      raf = requestAnimationFrame(loop);
    };
    if (!reducedMotion) raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [velocity]);
  const row1 = ['WAIT… WHY?', 'NEW FACT EVERY DAY', '100% SOURCED', 'TICKLE YOUR BRAIN', 'PIP EXPLAINS'];
  const row2 = ['SHORTS', 'REELS', 'ANIMATED', 'FUNNY', 'ACTUALLY TRUE', 'CURIOUS?'];
  const rep = (r: string[]) => [...r, ...r, ...r, ...r];
  return (
    <section className="marquee" aria-hidden>
      <div className="marquee__row" ref={a}>
        {rep(row1).map((s, i) => (
          <span key={i} className={i % 2 ? 'outline' : ''}>
            {s} <em>✦</em>
          </span>
        ))}
      </div>
      <div className="marquee__row marquee__row--2" ref={b}>
        {rep(row2).map((s, i) => (
          <span key={i} className={i % 2 ? '' : 'outline'}>
            {s} <em>●</em>
          </span>
        ))}
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Episodes — tilt cards with live previews + cinematic lightbox         */
/* ------------------------------------------------------------------ */
const EpisodeCard: React.FC<{ep: Episode; i: number; onOpen: (e: Episode) => void}> = ({ep, i, onOpen}) => {
  const card = useRef<HTMLButtonElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [wrap, inView] = useInView<HTMLDivElement>(0.6);
  const [hover, setHover] = useState(false);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const shouldPlay = finePointer ? hover : inView;
    if (shouldPlay) void v.play().catch(() => undefined);
    else v.pause();
  }, [hover, inView]);
  const move = (e: React.PointerEvent) => {
    const el = card.current;
    if (!el || !finePointer) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${(0.5 - py) * 14}deg`);
    el.style.setProperty('--ry', `${(px - 0.5) * 16}deg`);
    el.style.setProperty('--gx', `${px * 100}%`);
    el.style.setProperty('--gy', `${py * 100}%`);
  };
  const leave = () => {
    setHover(false);
    card.current?.style.setProperty('--rx', '0deg');
    card.current?.style.setProperty('--ry', '0deg');
  };
  return (
    <div className="ep" ref={wrap} data-reveal style={{transitionDelay: `${i * 0.08}s`}}>
      <button
        ref={card}
        className="ep__card"
        onPointerMove={move}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={leave}
        onClick={() => {
          sound.play('whoosh', 0.4);
          onOpen(ep);
        }}
        data-cursor="PLAY"
        aria-label={`Play: ${ep.title}`}
      >
        <video ref={video} src={ep.video} poster={ep.poster} muted loop playsInline preload="none" />
        <span className="ep__glare" />
        <span className="ep__shade" />
        <span className="ep__top">
          <span className="ep__tag">{ep.tag}</span>
          {ep.isNew && <span className="ep__new">NEW</span>}
        </span>
        <span className="ep__play" aria-hidden>
          <svg viewBox="0 0 24 24" width="26" height="26">
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
        </span>
        <span className="ep__bottom">
          <span className="ep__title">{ep.title}</span>
          <span className="ep__hook">{ep.hook}</span>
          <span className="ep__len">{ep.length}</span>
        </span>
      </button>
    </div>
  );
};

const Lightbox: React.FC<{ep: Episode | null; onClose: () => void}> = ({ep, onClose}) => {
  const [shown, setShown] = useState<Episode | null>(ep);
  useEffect(() => {
    if (ep) setShown(ep);
    else {
      const id = setTimeout(() => setShown(null), 500);
      return () => clearTimeout(id);
    }
  }, [ep]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!shown) return null;
  return createPortal(
    <div className={`lightbox ${ep ? 'is-open' : ''}`} onClick={onClose} role="dialog" aria-modal="true" aria-label={shown.title}>
      <div className="lightbox__inner" onClick={(e) => e.stopPropagation()}>
        <video src={shown.video} poster={shown.poster} controls autoPlay playsInline />
        <div className="lightbox__side">
          <span className="ep__tag">{shown.tag}</span>
          <h3>{shown.title}</h3>
          <p>{shown.hook}</p>
          <a className="btn btn--yt" href={LINKS.youtubeShorts} target="_blank" rel="noopener noreferrer">
            <YtIcon /> More on YouTube
          </a>
          <a className="btn btn--ig" href={LINKS.instagram} target="_blank" rel="noopener noreferrer">
            <IgIcon /> Watch on Instagram
          </a>
        </div>
        <button className="lightbox__close" onClick={onClose} aria-label="Close video" data-cursor="CLOSE">
          ✕
        </button>
      </div>
    </div>,
    document.body,
  );
};

export const Episodes: React.FC<{onModal: (open: boolean) => void}> = ({onModal}) => {
  const [open, setOpen] = useState<Episode | null>(null);
  return (
    <section id="episodes" className="section episodes">
      <header className="section__head" data-reveal>
        <span className="eyebrow">02 — Episodes</span>
        <h2>
          Latest <i>facts</i>
        </h2>
        <p>Tap a card to watch. Every video is under a minute, and every fact comes with its sources.</p>
      </header>
      <div className="ep__rail">
        {EPISODES.map((ep, i) => (
          <EpisodeCard
            key={ep.id}
            ep={ep}
            i={i}
            onOpen={(e) => {
              setOpen(e);
              onModal(true);
            }}
          />
        ))}
        <a className="ep ep--more" href={LINKS.youtubeShorts} target="_blank" rel="noopener noreferrer" data-reveal data-cursor="MORE">
          <span className="ep__more-inner">
            <b>More every day</b>
            <span>See all Shorts →</span>
          </span>
        </a>
      </div>
      <Lightbox
        ep={open}
        onClose={() => {
          setOpen(null);
          onModal(false);
        }}
      />
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Meet Pip — a portal that opens as you scroll                          */
/* ------------------------------------------------------------------ */
export const Meet: React.FC = () => {
  const sec = useRef<HTMLElement>(null);
  const portal = useRef<HTMLDivElement>(null);
  const [vRef, inView] = useInView<HTMLVideoElement>(0.2);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const el = sec.current;
      if (el && portal.current) {
        const r = el.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, (window.innerHeight - r.top) / (window.innerHeight * 0.9)));
        portal.current.style.setProperty('--p', String(reducedMotion ? 1 : p));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => {
    const v = vRef.current;
    if (!v) return;
    if (inView) void v.play().catch(() => undefined);
    else v.pause();
  }, [inView, vRef]);
  const specs: [string, string][] = [
    ['Shape', 'Round (mostly)'],
    ['Color', 'Curious orange'],
    ['Ears', '0, borrowed for science'],
    ['Antenna', 'Lights up for good questions'],
    ['Can tickle himself', 'No (not the laughing kind)'],
    ['Favorite word', '“Why?”'],
  ];
  return (
    <section id="meet" className="section meet" ref={sec}>
      <div className="meet__portal" ref={portal}>
        <video ref={vRef} src="/media/clip-hello.mp4" poster="/media/clip-hello.jpg" muted loop playsInline preload="metadata" />
        <span className="meet__ring" />
      </div>
      <div className="meet__copy">
        <span className="eyebrow" data-reveal>
          03 — Meet Pip
        </span>
        <h2 data-reveal>
          Round. Orange. <i>Professionally curious.</i>
        </h2>
        <p data-reveal>
          Pip has one job: answering the &ldquo;wait&hellip; <b>why?</b>&rdquo; questions you never had time to Google, and making them stick. Every fact is
          researched, double-checked and acted out by the most dramatic orange blob on the internet.
        </p>
        <dl className="specs" data-reveal>
          {specs.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Fact deck — flip, swipe, shuffle                                     */
/* ------------------------------------------------------------------ */
export const FactDeck: React.FC = () => {
  const [order, setOrder] = useState(FACTS.map((_, i) => i));
  const [flipped, setFlipped] = useState(false);
  const [drag, setDrag] = useState({x: 0, active: false});
  const [leaving, setLeaving] = useState<0 | 1 | -1>(0);
  const startX = useRef(0);
  const moved = useRef(false);
  const next = (dir: 1 | -1 = 1) => {
    if (leaving) return;
    setLeaving(dir);
    sound.play('whoosh', 0.35);
    setTimeout(() => {
      setOrder((o) => [...o.slice(1), o[0]]);
      setFlipped(false);
      setLeaving(0);
      setDrag({x: 0, active: false});
    }, 380);
  };
  const shuffle = () => {
    sound.play('blips', 0.4);
    setFlipped(false);
    setOrder((o) => [...o].sort(() => Math.random() - 0.5));
  };
  const top = FACTS[order[0]];
  return (
    <section id="facts" className="section facts">
      <header className="section__head" data-reveal>
        <span className="eyebrow">04 — Fact deck</span>
        <h2>
          Flip a card. <i>Tickle your brain.</i>
        </h2>
        <p>Tap to reveal the answer, swipe (or hit next) for another. Cards marked ▶ already have a Pip episode.</p>
      </header>
      <div className="deck" data-reveal>
        {order
          .slice(0, 4)
          .reverse()
          .map((fi, ri, arr) => {
            const depth = arr.length - 1 - ri; // 0 = top
            const f = FACTS[fi];
            const isTop = depth === 0;
            const tx = isTop ? (leaving ? leaving * 700 : drag.x) : 0;
            const rot = isTop ? tx / 18 : (depth % 2 ? -1 : 1) * depth * 3.5;
            return (
              <div
                key={fi}
                className={`card3d ${isTop && flipped ? 'is-flipped' : ''} ${isTop && drag.active ? 'is-drag' : ''}`}
                style={{
                  transform: `translate3d(${tx}px, ${depth * 18}px, 0) rotate(${rot}deg) scale(${1 - depth * 0.05})`,
                  filter: depth ? `brightness(${1 - depth * 0.14})` : undefined,
                  zIndex: 10 - depth,
                  opacity: isTop && leaving ? 0 : 1,
                }}
                onPointerDown={(e) => {
                  if (!isTop) return;
                  (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
                  startX.current = e.clientX;
                  moved.current = false;
                  setDrag({x: 0, active: true});
                }}
                onPointerMove={(e) => {
                  if (!isTop || !drag.active) return;
                  const dx = e.clientX - startX.current;
                  if (Math.abs(dx) > 6) moved.current = true;
                  setDrag({x: dx, active: true});
                }}
                onPointerUp={() => {
                  if (!isTop) return;
                  if (Math.abs(drag.x) > 110) next(drag.x > 0 ? 1 : -1);
                  else {
                    if (!moved.current) {
                      setFlipped((v) => !v);
                      sound.play('pop', 0.35);
                    }
                    setDrag({x: 0, active: false});
                  }
                }}
                onPointerCancel={() => setDrag({x: 0, active: false})}
                data-cursor={isTop ? (flipped ? 'FLIP' : 'REVEAL') : undefined}
                role={isTop ? 'button' : undefined}
                tabIndex={isTop ? 0 : -1}
                aria-label={isTop ? (flipped ? f.a : `Question: ${f.q}. Press to reveal.`) : undefined}
                onKeyDown={(e) => {
                  if (!isTop) return;
                  if (e.key === 'Enter' || e.key === ' ') setFlipped((v) => !v);
                  if (e.key === 'ArrowRight') next(1);
                }}
              >
                <div className="card3d__face card3d__front">
                  <span className="card3d__tag">
                    {f.tag}
                    {f.episode ? ' · ▶' : ''}
                  </span>
                  <span className="card3d__q">{f.q}</span>
                  <span className="card3d__tap">Tap to reveal</span>
                </div>
                <div className="card3d__face card3d__back">
                  <span className="card3d__tag">The answer</span>
                  <span className="card3d__a">{f.a}</span>
                  {f.episode ? (
                    <a className="card3d__link" href={LINKS.youtubeShorts} target="_blank" rel="noopener noreferrer" onPointerDown={(e) => e.stopPropagation()}>
                      ▶ Pip made a video about this
                    </a>
                  ) : (
                    <span className="card3d__soon">Coming soon to Pip</span>
                  )}
                </div>
              </div>
            );
          })}
      </div>
      <div className="deck__controls" data-reveal>
        <span className="deck__count">
          {String(FACTS.indexOf(top) + 1).padStart(2, '0')} <i>/ {String(FACTS.length).padStart(2, '0')}</i>
        </span>
        <button className="chip" onClick={shuffle} data-cursor="SHUFFLE">
          Shuffle
        </button>
        <button className="chip chip--solid" onClick={() => next(1)} data-cursor="NEXT">
          Next fact →
        </button>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* How Pip works — the Fact-O-Matic                                     */
/* ------------------------------------------------------------------ */
export const How: React.FC = () => {
  const [vRef, inView] = useInView<HTMLVideoElement>(0.25);
  useEffect(() => {
    const v = vRef.current;
    if (!v) return;
    if (inView) void v.play().catch(() => undefined);
    else v.pause();
  }, [inView, vRef]);
  const steps = [
    ['A question you’ve always wondered', 'The stuff you think about in the shower, but never look up.'],
    ['Real research, double-checked', 'Actual studies and experts. If it’s a theory, Pip says “probably”.'],
    ['Pip acts it out', 'Hand-crafted motion graphics, a dramatic orange blob and a lot of sound effects.'],
    ['Sources in every description', 'So you can check it, argue in the comments, and look smart at dinner.'],
  ];
  return (
    <section className="section how">
      <div className="how__media" data-reveal>
        <video ref={vRef} src="/media/clip-machine.mp4" poster="/media/clip-machine.jpg" muted loop playsInline preload="metadata" />
        <span className="how__badge">FACT-O-MATIC™</span>
      </div>
      <div className="how__copy">
        <header className="section__head" data-reveal>
          <span className="eyebrow">05 — How it works</span>
          <h2>
            Question in. <i>Fact out.</i>
          </h2>
        </header>
        <ol className="steps">
          {steps.map(([h, p], i) => (
            <li key={h} data-reveal style={{transitionDelay: `${i * 0.1}s`}}>
              <span className="steps__n">0{i + 1}</span>
              <div>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Follow — magnetic platform cards                                     */
/* ------------------------------------------------------------------ */
const Magnetic: React.FC<{href: string; className: string; children: React.ReactNode; cursor: string}> = ({href, className, children, cursor}) => {
  const ref = useRef<HTMLAnchorElement>(null);
  return (
    <a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      data-cursor={cursor}
      onClick={() => sound.play('pop-high', 0.5)}
      onPointerMove={(e) => {
        if (!finePointer || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        ref.current.style.setProperty('--mx', `${x * 0.08}px`);
        ref.current.style.setProperty('--my', `${y * 0.12}px`);
        ref.current.style.setProperty('--lx', `${((e.clientX - r.left) / r.width) * 100}%`);
        ref.current.style.setProperty('--ly', `${((e.clientY - r.top) / r.height) * 100}%`);
      }}
      onPointerLeave={() => {
        ref.current?.style.setProperty('--mx', '0px');
        ref.current?.style.setProperty('--my', '0px');
      }}
    >
      {children}
    </a>
  );
};

export const Follow: React.FC = () => (
  <section id="follow" className="section follow">
    <header className="section__head section__head--center" data-reveal>
      <span className="eyebrow">06 — Follow</span>
      <h2>
        Get a new fact <i>every day.</i>
      </h2>
      <p>Same Pip, two homes. Pick yours (or both, Pip won&rsquo;t judge).</p>
    </header>
    <div className="platforms">
      <Magnetic href={LINKS.youtube} className="platform platform--yt" cursor="SUBSCRIBE">
        <span className="platform__icon">
          <YtIcon />
        </span>
        <span className="platform__name">YouTube</span>
        <span className="platform__handle">{LINKS.ytHandle}</span>
        <span className="platform__what">Shorts · daily</span>
        <span className="platform__arrow">↗</span>
      </Magnetic>
      <Magnetic href={LINKS.instagram} className="platform platform--ig" cursor="FOLLOW">
        <span className="platform__icon">
          <IgIcon />
        </span>
        <span className="platform__name">Instagram</span>
        <span className="platform__handle">{LINKS.igHandle}</span>
        <span className="platform__what">Reels · daily</span>
        <span className="platform__arrow">↗</span>
      </Magnetic>
    </div>
    <p className="follow__note" data-reveal>
      Got a question for Pip? <b>Comment it under any video.</b> The best ones become episodes.
    </p>
  </section>
);

/* ------------------------------------------------------------------ */
/* Footer — Pip is recharging                                            */
/* ------------------------------------------------------------------ */
export const Footer: React.FC<{onTop: () => void}> = ({onTop}) => {
  const [vRef, inView] = useInView<HTMLVideoElement>(0.2);
  useEffect(() => {
    const v = vRef.current;
    if (!v) return;
    if (inView) void v.play().catch(() => undefined);
    else v.pause();
  }, [inView, vRef]);
  return (
    <footer className="footer">
      <div className="footer__sleep">
        <video ref={vRef} src="/media/clip-sleep.mp4" poster="/media/clip-sleep.jpg" muted loop playsInline preload="metadata" />
      </div>
      <div className="footer__copy">
        <h2>
          Pip is recharging. <i>New fact tomorrow.</i>
        </h2>
        <button className="chip chip--solid" onClick={onTop} data-cursor="WAKE">
          Wake Pip up ↑
        </button>
      </div>
      <div className="footer__bar">
        <span>© {new Date().getFullYear()} Pip Explains</span>
        <span className="footer__links">
          <a href={LINKS.youtube} target="_blank" rel="noopener noreferrer">
            YouTube
          </a>
          <a href={LINKS.instagram} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        </span>
        <span>Made with curiosity (and a lot of “why?”)</span>
      </div>
    </footer>
  );
};
