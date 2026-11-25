import React, {useCallback, useEffect, useRef, useState} from 'react';
import Lenis from 'lenis';
import {Cursor, Header, Menu, Preloader} from './Chrome';
import {Hero} from './Hero';
import {Episodes, FactDeck, Follow, Footer, How, Marquee, Meet} from './Sections';
import {reducedMotion, sound, useRevealAll} from './lib';

export const App: React.FC = () => {
  const [loaded, setLoaded] = useState(false);
  const [menu, setMenu] = useState(false);
  const [origin, setOrigin] = useState({x: 0, y: 0});
  const [progress, setProgress] = useState(0);
  const lenis = useRef<Lenis | null>(null);
  const velocity = useRef(0);

  useEffect(() => {
    if (reducedMotion) {
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? window.scrollY / max : 0);
      };
      window.addEventListener('scroll', onScroll, {passive: true});
      return () => window.removeEventListener('scroll', onScroll);
    }
    const l = new Lenis({lerp: 0.085, wheelMultiplier: 1, touchMultiplier: 1.4});
    lenis.current = l;
    l.on('scroll', (e: Lenis) => {
      velocity.current = e.velocity;
      setProgress(e.progress || 0);
    });
    let raf = 0;
    const loop = (time: number) => {
      l.raf(time);
      velocity.current *= 0.92;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      l.destroy();
    };
  }, []);

  useEffect(() => {
    if (!loaded) lenis.current?.stop();
    else lenis.current?.start();
    document.documentElement.classList.toggle('is-loading', !loaded);
  }, [loaded]);

  useRevealAll(loaded);

  const lock = useCallback((on: boolean) => {
    if (on) lenis.current?.stop();
    else lenis.current?.start();
    document.documentElement.classList.toggle('is-locked', on);
  }, []);

  const toggleMenu = useCallback(
    (o: {x: number; y: number}) => {
      setOrigin(o);
      setMenu((m) => {
        lock(!m);
        sound.play(m ? 'whoosh' : 'blips', 0.45);
        return !m;
      });
    },
    [lock],
  );

  const go = useCallback(
    (id: string) => {
      setMenu(false);
      lock(false);
      sound.play('whoosh', 0.4);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (!el) return;
        if (lenis.current) lenis.current.scrollTo(el, {offset: id === 'hero' ? 0 : -40, duration: 1.4});
        else el.scrollIntoView({behavior: 'smooth'});
      }, 350);
    },
    [lock],
  );

  return (
    <>
      <Preloader onDone={useCallback(() => setLoaded(true), [])} />
      <Cursor />
      <Header menuOpen={menu} onMenu={toggleMenu} progress={progress} />
      <Menu
        open={menu}
        origin={origin}
        onClose={() => {
          setMenu(false);
          lock(false);
          sound.play('whoosh', 0.4);
        }}
        onGo={go}
      />
      <main id="top">
        <Hero awake={loaded} />
        <Marquee velocity={velocity} />
        <Episodes onModal={lock} />
        <Meet />
        <FactDeck />
        <How />
        <Follow />
      </main>
      <Footer onTop={() => go('hero')} />
      <div className="grain" aria-hidden />
    </>
  );
};
