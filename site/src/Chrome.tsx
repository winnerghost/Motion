import React, {useEffect, useRef, useState} from 'react';
import {Pip} from '../../src/character/Pip';
import {finePointer, LINKS, pointer, reducedMotion, sound, useClock, useSoundOn} from './lib';

/* ------------------------------------------------------------------ */
/* Preloader — Pip's antenna bulb charges up, then floods the screen    */
/* ------------------------------------------------------------------ */
export const Preloader: React.FC<{onDone: () => void}> = ({onDone}) => {
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<'charge' | 'flash' | 'gone'>('charge');
  useEffect(() => {
    const dur = reducedMotion ? 300 : 1700;
    const start = performance.now();
    let fontsReady = false;
    (document as Document & {fonts?: FontFaceSet}).fonts?.ready.then(() => (fontsReady = true));
    setTimeout(() => (fontsReady = true), 2500);
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setPct(Math.round(eased * (fontsReady ? 100 : 92)));
      if (p >= 1 && fontsReady) {
        setPct(100);
        setPhase('flash');
        setTimeout(() => {
          setPhase('gone');
          onDone();
        }, reducedMotion ? 50 : 900);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);
  if (phase === 'gone') return null;
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className={`preloader ${phase === 'flash' ? 'is-flash' : ''}`} aria-hidden>
      <div className="preloader__bulb">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle cx="80" cy="80" r={r} fill="none" stroke="var(--cyan)" strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 80 80)" />
        </svg>
        <span className="preloader__glow" style={{opacity: 0.25 + (pct / 100) * 0.75, transform: `scale(${0.6 + pct / 250})`}} />
        <span className="preloader__core" />
        <span className="preloader__stem" />
      </div>
      <div className="preloader__label">
        <span>Charging curiosity</span>
        <b>{String(pct).padStart(3, '0')}%</b>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Custom cursor (desktop): glowing bulb + lagging ring with labels      */
/* ------------------------------------------------------------------ */
export const Cursor: React.FC = () => {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState('');
  useEffect(() => {
    if (!finePointer) return;
    document.documentElement.classList.add('has-cursor');
    let rx = pointer.x;
    let ry = pointer.y;
    let raf = 0;
    const loop = () => {
      rx += (pointer.x - rx) * 0.16;
      ry += (pointer.y - ry) * 0.16;
      if (dot.current) dot.current.style.transform = `translate(${pointer.x}px, ${pointer.y}px)`;
      if (ring.current) ring.current.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const over = (e: Event) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-cursor], a, button');
      setLabel(el ? el.dataset.cursor ?? 'hover' : '');
    };
    document.addEventListener('pointerover', over);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('pointerover', over);
    };
  }, []);
  if (!finePointer) return null;
  return (
    <>
      <div ref={ring} className={`cursor-ring ${label ? 'is-active' : ''} ${label && label !== 'hover' ? 'has-label' : ''}`}>
        <span>{label !== 'hover' ? label : ''}</span>
      </div>
      <div ref={dot} className="cursor-dot" />
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */
export const Header: React.FC<{menuOpen: boolean; onMenu: (origin: {x: number; y: number}) => void; progress: number}> = ({
  menuOpen,
  onMenu,
  progress,
}) => {
  const soundOn = useSoundOn();
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <header className={`header ${menuOpen ? 'is-menu' : ''}`}>
      <a className="brand" href="#top" data-cursor="TOP" aria-label="Pip Explains, back to top">
        <img src="/icon-192.png" alt="" width={36} height={36} />
        <span>
          PIP <em>EXPLAINS</em>
        </span>
      </a>
      <div className="header__right">
        <button className={`sound ${soundOn ? 'is-on' : ''}`} onClick={() => sound.toggle()} aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'} data-cursor={soundOn ? 'MUTE' : 'SOUND'}>
          {[0, 1, 2, 3].map((i) => (
            <i key={i} style={{animationDelay: `${i * 0.12}s`}} />
          ))}
        </button>
        <button
          className={`bulb-btn ${menuOpen ? 'is-open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          data-cursor={menuOpen ? 'CLOSE' : 'MENU'}
          onClick={(e) => {
            const b = (e.currentTarget as HTMLElement).getBoundingClientRect();
            onMenu({x: b.left + b.width / 2, y: b.top + b.height / 2});
          }}
        >
          <svg width="64" height="64" viewBox="0 0 64 64" className="bulb-btn__ring">
            <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
            <circle cx="32" cy="32" r={r} fill="none" stroke="var(--cyan)" strokeWidth="2" strokeDasharray={c} strokeDashoffset={c * (1 - progress)} transform="rotate(-90 32 32)" strokeLinecap="round" />
          </svg>
          <span className="bulb-btn__core" />
          <span className="bulb-btn__x" />
        </button>
      </div>
    </header>
  );
};

/* ------------------------------------------------------------------ */
/* Menu — a light-burst portal from the antenna bulb, with a giant Pip   */
/* peeking in whose eyes follow you                                     */
/* ------------------------------------------------------------------ */
const MENU = [
  {id: 'hero', label: 'Tickle Pip', sub: 'He can’t do it himself', preview: '/media/clip-hello.mp4'},
  {id: 'episodes', label: 'Episodes', sub: 'Watch the latest facts', preview: '/media/ep004.mp4'},
  {id: 'meet', label: 'Meet Pip', sub: 'Zero ears. Infinite questions.', preview: '/media/clip-hello.mp4'},
  {id: 'facts', label: 'Fact Deck', sub: 'Flip a card, learn a thing', preview: '/media/clip-machine.mp4'},
  {id: 'follow', label: 'Follow', sub: 'New fact every day', preview: '/media/clip-sleep.mp4'},
];

const Roll: React.FC<{text: string}> = ({text}) => (
  <span className="roll" aria-label={text}>
    {Array.from(text).map((ch, i) => (
      <span key={i} className="roll__ch" style={{transitionDelay: `${i * 0.018}s`}} aria-hidden>
        <span>{ch === ' ' ? ' ' : ch}</span>
        <span>{ch === ' ' ? ' ' : ch}</span>
      </span>
    ))}
  </span>
);

const MenuPip: React.FC<{hover: number}> = ({hover}) => {
  const {t} = useClock(true);
  const ref = useRef<HTMLDivElement>(null);
  const look = useRef({x: 0, y: 0});
  const b = ref.current?.getBoundingClientRect();
  const cx = b ? b.left + b.width * 0.5 : 0;
  const cy = b ? b.top + b.height * 0.42 : 0;
  const tx = b && pointer.active ? Math.max(-1, Math.min(1, (pointer.x - cx) / (window.innerWidth * 0.35))) : Math.sin(t * 0.6) * 0.5;
  const ty = b && pointer.active ? Math.max(-1, Math.min(1, (pointer.y - cy) / (window.innerHeight * 0.35))) : -0.2;
  look.current.x += (tx - look.current.x) * 0.15;
  look.current.y += (ty - look.current.y) * 0.15;
  const excited = hover >= 0;
  return (
    <div className="menu__pip" ref={ref} aria-hidden>
      <svg viewBox="0 0 700 700">
        <Pip
          id="menu-pip"
          t={t}
          pose={{
            x: 350,
            y: 880,
            scale: 1.25,
            lookX: look.current.x,
            lookY: look.current.y,
            smile: excited ? 0.85 : 0.45,
            mouthOpen: excited ? 0.35 : 0,
            browL: excited ? 0.8 : 0.3,
            browR: excited ? 0.8 : 0.3,
            blush: excited ? 0.8 : 0.35,
            antennaGlow: excited ? 1 : 0.6,
            handL: [-200, 260],
            handR: [200, 260],
          }}
        />
      </svg>
    </div>
  );
};

export const Menu: React.FC<{open: boolean; origin: {x: number; y: number}; onClose: () => void; onGo: (id: string) => void}> = ({open, origin, onClose, onGo}) => {
  const [hover, setHover] = useState(-1);
  const [mounted, setMounted] = useState(open);
  const vid = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (open) setMounted(true);
    else {
      const id = setTimeout(() => setMounted(false), reducedMotion ? 0 : 900);
      return () => clearTimeout(id);
    }
  }, [open]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && open && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  useEffect(() => {
    if (hover >= 0 && vid.current) {
      vid.current.src = MENU[hover].preview;
      void vid.current.play().catch(() => undefined);
    }
  }, [hover]);
  if (!mounted) return null;
  const style = {'--ox': `${origin.x}px`, '--oy': `${origin.y}px`} as React.CSSProperties;
  return (
    <div className={`menu ${open ? 'is-open' : 'is-closing'}`} style={style} role="dialog" aria-modal="true" aria-label="Menu">
      <div className="menu__bg" />
      <div className="menu__inner">
        <nav className="menu__list">
          {MENU.map((m, i) => (
            <button
              key={m.id}
              className={`menu__item ${hover === i ? 'is-hover' : ''}`}
              style={{transitionDelay: open ? `${0.28 + i * 0.06}s` : '0s'}}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(-1)}
              onFocus={() => setHover(i)}
              onClick={() => onGo(m.id)}
              data-cursor="GO"
            >
              <span className="menu__num">0{i + 1}</span>
              <span className="menu__label">
                <Roll text={m.label} />
              </span>
              <span className="menu__sub">{m.sub}</span>
            </button>
          ))}
        </nav>
        <div className={`menu__preview ${hover >= 0 ? 'is-on' : ''}`} aria-hidden>
          <video ref={vid} muted loop playsInline />
        </div>
        <div className="menu__foot">
          <a href={LINKS.youtube} target="_blank" rel="noopener noreferrer" data-cursor="YOUTUBE">
            YouTube <span>{LINKS.ytHandle}</span>
          </a>
          <a href={LINKS.instagram} target="_blank" rel="noopener noreferrer" data-cursor="INSTAGRAM">
            Instagram <span>{LINKS.igHandle}</span>
          </a>
        </div>
      </div>
      {open && <MenuPip hover={hover} />}
    </div>
  );
};
