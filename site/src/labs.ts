import {$, $$, clamp, reduced} from './core';

/* ================================================================== */
/* Lab 01: your two voices                                              */
/* Record a few seconds, then hear it "in your head" (bone conduction:  */
/* more low end, softer highs) and as everyone else hears it.           */
/* Nothing is uploaded: the audio lives in memory on this page.         */
/* ================================================================== */
function voiceLab() {
  const lab = $('.lab--voice');
  if (!lab) return;
  const recBtn = $<HTMLButtonElement>('.voice__rec', lab);
  const prog = $<SVGCircleElement>('.voice__prog', lab);
  const status = $('.voice__status', lab);
  const playWrap = $('.voice__play', lab);
  const alt = $<HTMLButtonElement>('.voice__alt', lab);
  const canvas = $<HTMLCanvasElement>('.voice__viz', lab);
  const g = canvas.getContext('2d')!;
  const vbtns = $$<HTMLButtonElement>('.vbtn', lab);
  const MAX = 4000;
  const C = 2 * Math.PI * 56;
  prog.style.strokeDasharray = `${C}`;
  prog.style.strokeDashoffset = `${C}`;

  let ac: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let micAnalyser: AnalyserNode | null = null; // never routed to the speakers (no feedback)
  let buffer: AudioBuffer | null = null;
  let source: AudioBufferSourceNode | null = null;
  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let recStart = 0;
  let mode: 'idle' | 'rec' | 'head' | 'air' = 'idle';
  let visible = false;
  let looping = false;
  let stopTimer = 0;
  const data = new Uint8Array(256);

  const ctx = () => {
    if (!ac) {
      const AC = window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
      ac = new AC();
      analyser = ac.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.78;
      micAnalyser = ac.createAnalyser();
      micAnalyser.fftSize = 512;
      micAnalyser.smoothingTimeConstant = 0.78;
    }
    void ac.resume();
    return ac;
  };
  const say = (t: string) => (status.textContent = t);

  async function decode(ab: ArrayBuffer) {
    const a = ctx();
    return await new Promise<AudioBuffer>((res, rej) => a.decodeAudioData(ab, res, rej));
  }
  function ready(b: AudioBuffer, label: string) {
    buffer = b;
    playWrap.hidden = false;
    lab.classList.add('has-audio');
    say(label);
  }

  async function startRec() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      say('Recording isn’t supported in this browser. Try Pip’s voice instead, or open the page in Safari or Chrome.');
      lab.classList.add('no-mic');
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: false, noiseSuppression: false}});
    } catch {
      say('Microphone access was blocked. Allow it and try again, or use Pip’s voice instead.');
      lab.classList.add('no-mic');
      return;
    }
    const a = ctx();
    stopPlayback();
    const src = a.createMediaStreamSource(stream);
    src.connect(micAnalyser!);
    const chunks: Blob[] = [];
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = async () => {
      src.disconnect();
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      try {
        const blob = new Blob(chunks, {type: recorder?.mimeType || 'audio/webm'});
        ready(await decode(await blob.arrayBuffer()), 'Now compare the two. Which one sounds like you?');
      } catch {
        say('That recording couldn’t be played back here. Try once more, or use Pip’s voice.');
      }
    };
    recorder.start();
    recStart = performance.now();
    mode = 'rec';
    lab.classList.add('is-rec');
    recBtn.setAttribute('aria-label', 'Stop recording');
    say('Recording… say anything');
    loop();
    stopTimer = window.setTimeout(stopRec, MAX);
  }
  function stopRec() {
    window.clearTimeout(stopTimer);
    if (mode !== 'rec') return;
    mode = 'idle';
    lab.classList.remove('is-rec');
    recBtn.setAttribute('aria-label', 'Record your voice');
    prog.style.strokeDashoffset = `${C}`;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }

  function stopPlayback() {
    if (source) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
      source.disconnect();
      source = null;
    }
    vbtns.forEach((b) => b.classList.remove('is-on'));
    if (mode === 'head' || mode === 'air') mode = 'idle';
  }

  function play(m: 'head' | 'air') {
    if (!buffer) return;
    const a = ctx();
    stopPlayback();
    const src = a.createBufferSource();
    src.buffer = buffer;
    let node: AudioNode = src;
    const chain = (n: AudioNode) => {
      node.connect(n);
      node = n;
    };
    const filter = (type: BiquadFilterType, f: number, gain = 0, q = 0.8) => {
      const b = a.createBiquadFilter();
      b.type = type;
      b.frequency.value = f;
      b.gain.value = gain;
      b.Q.value = q;
      return b;
    };
    const out = a.createGain();
    if (m === 'head') {
      // bone conduction carries the low end and dulls the highs
      chain(filter('lowshelf', 220, 11));
      chain(filter('peaking', 380, 4, 0.9));
      chain(filter('lowpass', 3300, 0, 0.6));
      out.gain.value = 0.62;
    } else {
      // air only: what a microphone (and everyone else) hears
      chain(filter('highpass', 110, 0, 0.7));
      chain(filter('peaking', 3000, 2.5, 0.9));
      out.gain.value = 0.95;
    }
    chain(out);
    node.connect(analyser!);
    analyser!.connect(a.destination);
    src.onended = () => {
      if (source === src) stopPlayback();
    };
    src.start();
    source = src;
    mode = m;
    vbtns.forEach((b) => b.classList.toggle('is-on', b.dataset.mode === m));
    loop();
  }

  async function usePip() {
    say('Loading Pip’s voice…');
    try {
      const r = await fetch('/media/pip-voice.mp3');
      ready(await decode(await r.arrayBuffer()), 'Pip’s voice is loaded. Compare how it sounds to Pip, and to you.');
      play('head');
    } catch {
      say('Couldn’t load the sample. Check your connection and try again.');
    }
  }

  /* visualiser: mirrored bars from the centre line */
  function draw(t: number) {
    const w = canvas.width;
    const h = canvas.height;
    g.clearRect(0, 0, w, h);
    const bars = 56;
    const bw = w / bars;
    const an = mode === 'rec' ? micAnalyser : analyser;
    const active = mode !== 'idle' && an;
    if (active) an!.getByteFrequencyData(data);
    const col = mode === 'head' ? '255, 138, 61' : mode === 'rec' ? '255, 92, 70' : '236, 232, 225';
    for (let i = 0; i < bars; i++) {
      const c = Math.abs(i - bars / 2 + 0.5) / (bars / 2);
      let v: number;
      if (active) v = data[Math.floor(Math.pow(c, 1.4) * 120) + 2] / 255;
      else v = 0.05 + 0.04 * Math.sin(t * 0.002 + i * 0.35);
      const bh = Math.max(3, v * h * 0.9);
      g.fillStyle = `rgba(${col}, ${(0.25 + v * 0.75).toFixed(3)})`;
      g.fillRect(i * bw + bw * 0.22, (h - bh) / 2, bw * 0.56, bh);
    }
    if (mode === 'rec') {
      const p = clamp((performance.now() - recStart) / MAX);
      prog.style.strokeDashoffset = `${(C * (1 - p)).toFixed(1)}`;
    }
  }
  function loop() {
    if (looping) return;
    looping = true;
    const step = (t: number) => {
      draw(t);
      if ((visible && !reduced) || mode !== 'idle') requestAnimationFrame(step);
      else looping = false;
    };
    requestAnimationFrame(step);
  }

  recBtn.addEventListener('click', () => (mode === 'rec' ? stopRec() : void startRec()));
  alt?.addEventListener('click', () => void usePip());
  vbtns.forEach((b) => b.addEventListener('click', () => (b.classList.contains('is-on') ? stopPlayback() : play(b.dataset.mode as 'head' | 'air'))));
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) loop();
    else if (mode === 'head' || mode === 'air') stopPlayback();
  }).observe(canvas);
  draw(0);
}

/* ================================================================== */
/* Lab 02: the tickle delay                                             */
/* Your touch shows up instantly; the light answers after the delay.    */
/* Blakemore, Wolpert & Frith (1999): as a robot's delay grew from 0 to */
/* 300 ms, self-tickles were rated progressively more ticklish.         */
/* ================================================================== */
function tickleLab() {
  const lab = $('.lab--tickle');
  if (!lab) return;
  const padEl = $('.pad', lab);
  const range = $<HTMLInputElement>('#delay', lab);
  const out = $('.delay__val', lab);
  const bar = $('.feel__bar i', lab);
  let delay = 0;
  const words = (d: number) => (d === 0 ? 'feels like you' : d < 100 ? 'still mostly you' : d < 200 ? 'starting to feel foreign' : 'feels like someone else');
  const update = () => {
    delay = Number(range.value);
    out.textContent = `${delay} ms · ${words(delay)}`;
    bar.style.transform = `scaleX(${(0.08 + 0.9 * (delay / 300)).toFixed(3)})`;
    range.style.setProperty('--p', `${(delay / 3).toFixed(1)}%`);
  };
  range.addEventListener('input', update);
  update();

  const spawn = (cls: string, x: number, y: number, txt?: string) => {
    const s = document.createElement('span');
    s.className = cls;
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    if (txt) s.textContent = txt;
    padEl.appendChild(s);
    window.setTimeout(() => s.remove(), 1400);
  };
  const touch = (x: number, y: number) => {
    padEl.classList.add('is-used');
    spawn('pad__you', x, y);
    const d = delay;
    window.setTimeout(() => {
      spawn('pad__ripple', x, y);
      if (d > 0) spawn('pad__ms', x, y, `+${d} ms`);
      try {
        navigator.vibrate?.(18);
      } catch {
        /* not supported */
      }
    }, d);
  };
  padEl.addEventListener('pointerdown', (e) => {
    const r = padEl.getBoundingClientRect();
    touch(e.clientX - r.left, e.clientY - r.top);
  });
  padEl.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    touch(padEl.clientWidth / 2, padEl.clientHeight / 2);
  });
}

export function initLabs() {
  voiceLab();
  tickleLab();
}
