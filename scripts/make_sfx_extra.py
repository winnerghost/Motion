#!/usr/bin/env python3
"""Extra synthesised sound effects (FACT #004 and later).

    python3 scripts/make_sfx_extra.py

geiger-*.wav  : Geiger-counter clicks (random, Poisson-timed like real decays)
alarm.wav     : two-tone radiation-portal alarm, 1.6 s
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
ROOT = Path(__file__).resolve().parent.parent / "public" / "sfx"
rng = np.random.default_rng(40)


def save(path, x, peak=0.89):
    x = np.asarray(x, dtype=np.float64)
    m = np.max(np.abs(x)) or 1
    x = np.stack([x, x], 1) / m * peak
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


def click():
    n = int(0.006 * SR)
    k = np.arange(n) / SR
    body = rng.standard_normal(n) * np.exp(-k * 900)
    tick = np.sin(2 * np.pi * 3200 * k) * np.exp(-k * 1400)
    return body * 0.7 + tick * 0.6


def geiger(rate, dur, name):
    x = np.zeros(int(dur * SR))
    tt = rng.exponential(1 / rate)
    while tt < dur - 0.01:
        c = click() * rng.uniform(0.6, 1.0)
        i = int(tt * SR)
        x[i:i + len(c)] += c[: len(x) - i]
        tt += rng.exponential(1 / rate)
    x += rng.standard_normal(len(x)) * 0.004  # faint hiss
    save(ROOT / name, x, 0.8)


def alarm():
    dur = 1.6
    k = np.arange(int(dur * SR)) / SR
    hi = (np.floor(k / 0.2) % 2) == 0
    f = np.where(hi, 1180, 880)
    phase = np.cumsum(2 * np.pi * f / SR)
    sq = np.sign(np.sin(phase)) * 0.5 + np.sin(phase) * 0.5
    env = np.minimum(1, k / 0.01) * np.minimum(1, (dur - k) / 0.08)
    gate = 1 - 0.15 * ((k % 0.2) > 0.17)
    save(ROOT / "alarm.wav", sq * env * gate, 0.7)


if __name__ == "__main__":
    geiger(15, 4.0, "geiger-slow.wav")  # ~a banana held to the probe (15 decays/s)
    geiger(60, 4.0, "geiger-fast.wav")  # "thousands inside you" (illustrative)
    alarm()
    print("ok")
