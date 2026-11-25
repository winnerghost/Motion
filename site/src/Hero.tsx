import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Pip} from '../../src/character/Pip';
import {LINKS, pointer, sound, useClock} from './lib';

type Particle = {id: number; x: number; y: number; vx: number; vy: number; born: number; text: string; color: string; rot: number};
type Confetto = {id: number; x: number; vx: number; vy: number; rot: number; vr: number; color: string; born: number};

const HA = ['HA', 'HA!', 'HAHA', 'hehe', 'HA'];
const COLORS = ['#FFD84D', '#FF4F8B', '#45E9FF', '#FFFFFF', '#8DFF6A'];
const LINES = ['Hey! 😂', 'Stoppp haha', 'NOT THE BELLY', 'okay okay!', 'I can’t do this myself!'];

/* Semicircle laugh-o-meter, same design language as the videos */
const LaughMeter: React.FC<{value: number}> = ({value}) => {
  const segs = 16;
  const R = 92;
  const ang = (v: number) => Math.PI + v * Math.PI;
  const p = (r: number, a: number) => `${Math.cos(a) * r} ${Math.sin(a) * r}`;
  return (
    <div className="meter" aria-label={`Laugh-o-meter ${Math.round(value * 100)} percent`}>
      <svg viewBox="-110 -110 220 130" width="220" height="130">
        {Array.from({length: segs}, (_, i) => {
          const a0 = ang(i / segs) + 0.03;
          const a1 = ang((i + 1) / segs) - 0.03;
          const lit = (i + 0.5) / segs <= value;
          const col = i < 5 ? '#8C7DFF' : i < 11 ? '#FFD84D' : '#FF4F8B';
          return (
            <path key={i} d={`M ${p(R - 20, a0)} L ${p(R, a0)} A ${R} ${R} 0 0 1 ${p(R, a1)} L ${p(R - 20, a1)} A ${R - 20} ${R - 20} 0 0 0 ${p(R - 20, a0)} Z`} fill={col} opacity={lit ? 1 : 0.15} />
          );
        })}
        <g transform={`rotate(${180 + value * 180})`}>
          <path d="M 0 -5 L 78 -1.5 L 78 1.5 L 0 5 Z" fill="#fff" />
        </g>
        <circle r="10" fill="#fff" />
        <circle r="4.5" fill="#FF4F8B" />
      </svg>
      <div className="meter__val">{Math.round(value * 100)}%</div>
      <div className="meter__label">LAUGH-O-METER</div>
    </div>
  );
};

const TicklePip: React.FC<{awake: boolean}> = ({awake}) => {
  const {t, dt} = useClock(true);
  const box = useRef<HTMLDivElement>(null);
  const st = useRef({hold: false, holdT: 0, release: -10, meter: 0, look: {x: 0, y: 0}, lastSpawn: 0, won: -10, wins: 0, wake: 0, line: '', lineT: -10});
  const [parts, setParts] = useState<Particle[]>([]);
  const [confetti, setConfetti] = useState<Confetto[]>([]);
  const [toast, setToast] = useState(false);
  const [tried, setTried] = useState(false);
  const idRef = useRef(0);
  const tRef = useRef(0);
  tRef.current = t;
  const s = st.current;

  // wake up after the preloader
  s.wake = Math.min(1, s.wake + (awake ? dt * 2.2 : 0));

  const b = box.current?.getBoundingClientRect();
  const cx = b ? b.left + b.width * 0.5 : 0;
  const cy = b ? b.top + b.height * 0.48 : 0;
  const idle = !pointer.active || performance.now() - pointer.lastMove > 3500;
  const tx = !idle && b ? Math.max(-1, Math.min(1, (pointer.x - cx) / Math.max(240, b.width * 0.7))) : Math.sin(t * 0.55) * 0.45;
  const ty = !idle && b ? Math.max(-1, Math.min(1, (pointer.y - cy) / Math.max(240, b.height * 0.7))) : Math.sin(t * 0.37) * 0.25;
  s.look.x += (tx - s.look.x) * Math.min(1, dt * 10);
  s.look.y += (ty - s.look.y) * Math.min(1, dt * 10);

  // tickle physics
  if (s.hold) {
    s.holdT += dt;
    s.meter = Math.min(1, s.meter + dt * 0.42);
  } else if (t - s.won > 2.2) {
    s.meter = Math.max(0, s.meter - dt * 0.14);
  }
  const laughing = s.hold || t - s.release < 0.7 || t - s.won < 2.2;
  const lp = laughing ? 1 : 0;
  const bounce = laughing ? Math.abs(Math.sin(t * Math.PI * 6)) : 0;

  // spawn HA particles while laughing
  useEffect(() => {
    if (!laughing || !b) return;
    if (t - s.lastSpawn < 0.13) return;
    s.lastSpawn = t;
    const id = ++idRef.current;
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
    const sp = 260 + Math.random() * 220;
    setParts((p) => [
      ...p.filter((q) => t - q.born < 1.3).slice(-24),
      {id, x: b.width * 0.5, y: b.height * 0.42, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, born: t, text: HA[id % HA.length], color: COLORS[id % COLORS.length], rot: (Math.random() - 0.5) * 50},
    ]);
    if (id % 3 === 0) sound.play(id % 2 ? 'pop' : 'pop-high', 0.25);
  });

  // win!
  useEffect(() => {
    if (s.meter >= 1 && t - s.won > 2.5) {
      s.won = t;
      s.wins += 1;
      s.hold = false;
      sound.play('ding', 0.6);
      setToast(true);
      setTimeout(() => setToast(false), 3200);
      const now = t;
      setConfetti(
        Array.from({length: 70}, (_, i) => ({
          id: i + now,
          x: 50 + (Math.random() - 0.5) * 30,
          vx: (Math.random() - 0.5) * 120,
          vy: -(70 + Math.random() * 90),
          rot: Math.random() * 360,
          vr: (Math.random() - 0.5) * 900,
          color: COLORS[i % COLORS.length],
          born: now,
        })),
      );
      setTimeout(() => {
        s.meter = 0;
      }, 2300);
    }
  });

  const start = useCallback(
    (e: React.PointerEvent) => {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      const s2 = st.current;
      s2.hold = true;
      s2.holdT = 0;
      s2.meter = Math.min(1, s2.meter + 0.05);
      if (Math.random() < 0.55) {
        s2.line = LINES[Math.floor(Math.random() * LINES.length)];
        s2.lineT = performance.now() / 1000;
      }
      setTried(true);
      sound.play('boing', 0.4);
    },
    [],
  );
  const stop = useCallback(() => {
    const s2 = st.current;
    if (s2.hold) s2.release = tRef.current;
    s2.hold = false;
  }, []);

  const lineVisible = performance.now() / 1000 - s.lineT < 1.4;
  const wake = s.wake;

  return (
    <div className="tickle">
      <div
        ref={box}
        className={`tickle__pip ${laughing ? 'is-laughing' : ''}`}
        onPointerDown={start}
        onPointerUp={stop}
        onPointerCancel={stop}
        onPointerLeave={stop}
        onPointerMove={() => {
          if (st.current.hold) st.current.meter = Math.min(1, st.current.meter + 0.004);
        }}
        data-cursor="TICKLE"
        role="button"
        tabIndex={0}
        aria-label="Tickle Pip: press and hold"
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            st.current.hold = true;
            setTried(true);
          }
        }}
        onKeyUp={() => stop()}
      >
        <svg viewBox="0 0 700 760" className="tickle__svg">
          <Pip
            id="hero-pip"
            t={t}
            pose={{
              x: 350,
              y: 715,
              scale: 1.08,
              lid: laughing ? 0 : 1 - wake,
              happyEyes: lp,
              lookX: laughing ? 0 : s.look.x,
              lookY: laughing ? 0 : s.look.y,
              smile: laughing ? 1 : 0.35 + s.meter * 0.4 + wake * 0.1,
              mouthOpen: laughing ? 0.55 + bounce * 0.35 : 0,
              mouthW: laughing ? 1.25 : 1,
              browL: laughing ? 0.6 : 0.25 + Math.max(0, -s.look.y) * 0.4,
              browR: laughing ? 0.6 : 0.25 + Math.max(0, -s.look.y) * 0.4,
              blush: laughing ? 1 : 0.3 + s.meter * 0.4,
              hop: bounce * 30 + (1 - wake) * 0,
              tilt: laughing ? Math.sin(t * 9) * 7 : s.look.x * 4,
              squash: 1 + (laughing ? (bounce - 0.5) * 0.08 : 0),
              handL: laughing ? [-140 + bounce * 22, 135] : [-212, 118],
              handR: laughing ? [100, 150 + bounce * 10] : [212, 118],
              antennaGlow: 0.5 + wake * 0.3 + s.meter * 0.2 + (laughing ? 0.2 : 0),
            }}
          />
        </svg>
        {parts.map((p) => {
          const age = t - p.born;
          if (age > 1.2) return null;
          return (
            <span
              key={p.id}
              className="ha"
              style={{
                left: p.x + p.vx * age,
                top: p.y + p.vy * age + 260 * age * age,
                color: p.color,
                opacity: Math.min(1, (1.2 - age) * 2.5),
                transform: `translate(-50%, -50%) rotate(${p.rot}deg) scale(${Math.min(1, age * 8)})`,
              }}
            >
              {p.text}
            </span>
          );
        })}
        {lineVisible && s.line && <div className="tickle__line">{s.line}</div>}
      </div>
      <div className="tickle__meter">
        <LaughMeter value={s.meter} />
        <p className={`tickle__hint ${tried ? 'is-tried' : ''}`}>
          <span className="finger" aria-hidden>
            👆
          </span>{' '}
          {tried ? 'Keep going… fill the meter!' : 'Press & hold Pip to tickle him'}
        </p>
      </div>
      <div className="confetti" aria-hidden>
        {confetti.map((c) => {
          const age = t - c.born;
          if (age > 3) return null;
          return (
            <i
              key={c.id}
              style={{
                left: `calc(${c.x}% + ${c.vx * age}px)`,
                top: `calc(45% + ${c.vy * age * 3 + 300 * age * age}px)`,
                background: c.color,
                transform: `rotate(${c.rot + c.vr * age}deg)`,
                opacity: Math.min(1, (3 - age) * 1.5),
              }}
            />
          );
        })}
      </div>
      <div className={`toast ${toast ? 'is-on' : ''}`} role="status">
        <b>You made Pip LAUGH. 🎉</b>
        <span>He can&rsquo;t do that himself. Now you know why.</span>
      </div>
    </div>
  );
};

export const Hero: React.FC<{awake: boolean}> = ({awake}) => {
  const bg = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const nx = pointer.active ? pointer.x / window.innerWidth - 0.5 : 0;
      const ny = pointer.active ? pointer.y / window.innerHeight - 0.5 : 0;
      bg.current?.style.setProperty('--px', String(nx));
      bg.current?.style.setProperty('--py', String(ny));
      bg.current?.style.setProperty('--sy', String(window.scrollY));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const words1 = ['The', 'facts', 'you', 'always'];
  const words2 = ['wondered', 'about.'];
  return (
    <section id="hero" className={`hero ${awake ? 'is-awake' : ''}`}>
      <div className="hero__bg" ref={bg} aria-hidden>
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
        <div className="grid-floor" />
        <div className="stars">
          {Array.from({length: 26}, (_, i) => (
            <i key={i} style={{left: `${(i * 37) % 100}%`, top: `${(i * 61) % 100}%`, animationDelay: `${(i % 7) * 0.6}s`, width: 4 + (i % 4) * 3, height: 4 + (i % 4) * 3}} />
          ))}
        </div>
      </div>
      <div className="hero__copy">
        <div className="kicker">
          <span className="dot" /> New fact every day<span className="kicker__extra">&nbsp;· Shorts &amp; Reels</span>
        </div>
        <h1 className="hero__title">
          <span className="line">
            {words1.map((w, i) => (
              <span className="word" key={w + i} style={{transitionDelay: `${0.15 + i * 0.07}s`}}>
                <span>{w}</span>
              </span>
            ))}
          </span>
          <span className="line">
            {words2.map((w, i) => (
              <span className={`word ${i === 0 ? 'hl' : ''}`} key={w + i} style={{transitionDelay: `${0.45 + i * 0.08}s`}}>
                <span>{w}</span>
                {i === 0 && (
                  <svg className="squiggle" viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden>
                    <path d="M 4 16 Q 40 2 76 14 T 150 14 T 224 14 T 296 10" />
                  </svg>
                )}
              </span>
            ))}
          </span>
        </h1>
        <p className="hero__sub">
          Pip explains the weird stuff in under a minute: <b>animated</b>, <b>funny</b> and <b>actually true</b>.
        </p>
        <div className="hero__ctas">
          <a className="btn btn--yt" href={LINKS.youtube} target="_blank" rel="noopener noreferrer" data-cursor="WATCH" onClick={() => sound.play('pop', 0.5)}>
            <YtIcon /> Watch on YouTube
          </a>
          <a className="btn btn--ig" href={LINKS.instagram} target="_blank" rel="noopener noreferrer" data-cursor="FOLLOW" onClick={() => sound.play('pop', 0.5)}>
            <IgIcon /> Follow on Instagram
          </a>
        </div>
      </div>
      <TicklePip awake={awake} />
      <div className="scroll-cue" aria-hidden>
        <span>Scroll</span>
        <i />
      </div>
    </section>
  );
};

export const YtIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
    <path fill="currentColor" d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.7 15.1V8.9L15.5 12l-5.8 3.1Z" />
  </svg>
);
export const IgIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
    <path fill="currentColor" d="M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2Zm0 4.8a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Zm5.2-9.6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z" />
  </svg>
);
