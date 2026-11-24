#!/usr/bin/env python3
"""Synthesise the channel's sound kit (royalty-free, made from scratch).

    python3 scripts/make_sfx.py

Writes public/sfx/*.wav and public/music/curious-loop.wav.
Everything is generated from oscillators + noise, so there is nothing to
license and every video sounds like the same channel.
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
rng = np.random.default_rng(7)
ROOT = Path(__file__).resolve().parent.parent / "public"


def save(path, x, peak=0.89):
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    m = np.max(np.abs(x)) or 1
    x = x / m * peak
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


def t(d):
    return np.arange(int(d * SR)) / SR


def onepole_lp(x, fc):
    """Time-varying one-pole low-pass; fc may be an array."""
    fc = np.broadcast_to(fc, x.shape)
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    v = 0.0
    for i in range(len(x)):
        v += a[i] * (x[i] - v)
        y[i] = v
    return y


def bandnoise(d, f_lo, f_hi):
    n = rng.standard_normal(len(t(d)))
    return onepole_lp(n, f_hi) - onepole_lp(n, f_lo)


def adsr(n, a=0.005, r=0.1, curve=4.0):
    e = np.ones(n)
    na = max(1, int(a * SR))
    e[:na] = np.linspace(0, 1, na)
    tail = np.arange(n - na) / SR
    e[na:] = np.exp(-curve * tail / max(r, 1e-3))
    return e


def whoosh(d=0.55, up=True):
    tt = t(d)
    p = tt / d
    sweep = (300 + 5200 * (p if up else 1 - p) ** 1.6)
    n = rng.standard_normal(len(tt))
    x = onepole_lp(n, sweep) - onepole_lp(n, sweep * 0.25)
    env = np.sin(np.pi * np.clip(p, 0, 1)) ** 1.5
    # stereo movement
    pan = 0.5 + 0.4 * np.sin(np.pi * p - np.pi / 2)
    return np.stack([x * env * (1 - pan), x * env * pan], 1)


def pop(f0=900, f1=260, d=0.16):
    tt = t(d)
    f = f1 + (f0 - f1) * np.exp(-tt * 38)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-tt * 26)
    x += 0.3 * bandnoise(d, 2000, 7000) * np.exp(-tt * 140)
    return x


def tick(f=2400):
    tt = t(0.06)
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 120) + 0.5 * bandnoise(0.06, 1500, 6000) * np.exp(-tt * 200)


def ding(f=1318.5, d=1.4):
    tt = t(d)
    x = sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * k)
            for m, a, k in [(1, 1, 3), (2.0, 0.35, 5), (2.76, 0.25, 7), (5.4, 0.12, 11)])
    return x * adsr(len(tt), 0.002, d, 1.0)


def thud(d=0.5):
    tt = t(d)
    f = 45 + 110 * np.exp(-tt * 30)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9)
    x += 0.6 * bandnoise(d, 80, 1800) * np.exp(-tt * 35)
    return np.tanh(2.2 * x)


def riser(d=1.6):
    tt = t(d)
    p = tt / d
    f = 180 * 2 ** (3 * p ** 1.4)
    x = 0.5 * np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    x += 0.8 * bandnoise(d, 400, 600 + 9000 * p ** 2)
    return x * p ** 2


def zap(d=0.35):
    tt = t(d)
    f = 1800 * np.exp(-tt * 9) + 200
    ph = np.cumsum(f) / SR
    x = np.sign(np.sin(2 * np.pi * ph)) * 0.5 + np.sin(2 * np.pi * ph * 2.01) * 0.5
    return onepole_lp(x, 4000) * np.exp(-tt * 9)


def blip_seq(n=3, base=880):
    out = np.zeros(int(0.09 * n * SR) + int(0.2 * SR))
    for k in range(n):
        b = pop(base * 2 ** (k * 4 / 12), base * 0.8 * 2 ** (k * 4 / 12), 0.12)
        s = int(k * 0.09 * SR)
        out[s:s + len(b)] += b
    return out


def glitch(d=0.4):
    tt = t(d)
    x = np.zeros_like(tt)
    for _ in range(14):
        s = rng.integers(0, len(tt) - 2000)
        L = rng.integers(400, 2000)
        f = rng.uniform(200, 3000)
        x[s:s + L] += np.sign(np.sin(2 * np.pi * f * tt[:L])) * rng.uniform(0.3, 1)
    return onepole_lp(x, 6000) * np.exp(-tt * 3)


def giggle_boing(d=0.9):
    tt = t(d)
    f = 420 + 160 * np.sin(2 * np.pi * 11 * tt) * np.exp(-tt * 2.5) + 300 * np.exp(-tt * 4)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR)
    return x * np.exp(-tt * 3.2)


def servo(d=0.7):
    tt = t(d)
    f = 140 + 60 * np.sin(2 * np.pi * 2.2 * tt) + 40 * (tt / d)
    ph = np.cumsum(f) / SR
    x = 2 * (ph % 1) - 1  # saw
    x = onepole_lp(x, 1400) + 0.25 * bandnoise(d, 2000, 6000)
    env = np.minimum(1, tt / 0.04) * np.minimum(1, (d - tt) / 0.12)
    return x * env


def karplus(freq, d, bright=0.5):
    n = int(d * SR)
    N = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, N)
    buf = onepole_lp(buf, 2000 + 6000 * bright)
    out = np.empty(n)
    idx = 0
    for i in range(n):
        out[i] = buf[idx]
        nxt = (idx + 1) % N
        buf[idx] = 0.497 * (buf[idx] + buf[nxt])
        idx = nxt
    return out * adsr(n, 0.001, d, 1.2)


def music(seconds=46.0, bpm=104):
    """A light, mischievous pizzicato loop (D minor-ish), meant to sit low under VO."""
    beat = 60 / bpm
    n = int(seconds * SR)
    L = np.zeros(n)
    R = np.zeros(n)
    midi = lambda m: 440 * 2 ** ((m - 69) / 12)
    # i - VI - III - VII  (Dm  Bb  F  C), two bars each chord? one bar each.
    chords = [[62, 65, 69, 74], [58, 62, 65, 70], [65, 69, 72, 77], [60, 64, 67, 72]]
    bass = [38, 34, 41, 36]
    patt = [0, 2, 1, 3, 2, 1, 3, 2]  # arpeggio order on 8ths
    bars = int(seconds / (4 * beat)) + 1
    for bar in range(bars):
        ch = chords[bar % 4]
        for k in range(8):
            st = bar * 4 * beat + k * beat / 2
            if st >= seconds - 0.5:
                continue
            note = ch[patt[k]] + (12 if (k == 7 and bar % 2) else 0)
            pl = karplus(midi(note), 0.55, 0.35 + 0.2 * (k % 2 == 0)) * (0.9 if k % 2 == 0 else 0.65)
            s = int(st * SR)
            e = min(n, s + len(pl))
            pan = 0.35 + 0.3 * ((k * 3) % 4) / 3
            L[s:e] += pl[:e - s] * (1 - pan)
            R[s:e] += pl[:e - s] * pan
        # bass: soft sine on beats 1 and 3
        for k in (0, 2):
            st = bar * 4 * beat + k * beat
            if st >= seconds - 0.5:
                continue
            d = beat * 1.6
            tt = t(d)
            b = np.sin(2 * np.pi * midi(bass[bar % 4]) * tt) * adsr(len(tt), 0.01, d, 2.5) * 0.9
            s = int(st * SR)
            e = min(n, s + len(b))
            L[s:e] += b[:e - s]
            R[s:e] += b[:e - s]
        # soft kick on 1 & 3, shaker on 8ths
        for k in range(8):
            st = bar * 4 * beat + k * beat / 2
            if st >= seconds - 0.5:
                continue
            s = int(st * SR)
            if k in (0, 4):
                kk = thud(0.25) * 0.45
            else:
                kk = bandnoise(0.05, 5000, 11000) * np.exp(-t(0.05) * 70) * (0.25 if k % 2 else 0.15)
            e = min(n, s + len(kk))
            L[s:e] += kk[:e - s]
            R[s:e] += kk[:e - s]
    x = np.stack([L, R], 1)
    # fade in/out
    f = int(0.4 * SR)
    x[:f] *= np.linspace(0, 1, f)[:, None]
    x[-int(1.5 * SR):] *= np.linspace(1, 0, int(1.5 * SR))[:, None]
    return np.tanh(x * 0.9)


if __name__ == "__main__":
    S = ROOT / "sfx"
    save(S / "whoosh.wav", whoosh())
    save(S / "whoosh-down.wav", whoosh(0.45, up=False))
    save(S / "pop.wav", pop())
    save(S / "pop-high.wav", pop(1500, 500, 0.12))
    save(S / "tick.wav", tick(), 0.6)
    save(S / "tock.wav", tick(1700), 0.6)
    save(S / "ding.wav", ding(), 0.7)
    save(S / "thud.wav", thud())
    save(S / "riser.wav", riser())
    save(S / "zap.wav", zap(), 0.6)
    save(S / "blips.wav", blip_seq(), 0.7)
    save(S / "glitch.wav", glitch(), 0.6)
    save(S / "boing.wav", giggle_boing(), 0.7)
    save(S / "servo.wav", servo(), 0.5)
    save(ROOT / "music" / "curious-loop.wav", music())
    print("sound kit written to", S)
