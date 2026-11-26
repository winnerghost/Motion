#!/usr/bin/env python3
""""Your voice with no head": strip the vocal tract off a spoken line.

Usage:
    python3 scripts/make_buzz.py public/episodes/ep005 27.0 28.05 vo_buzz.wav

Source-filter view of speech: the vocal folds make a buzz (the source) and the
throat, mouth and nose shape it into vowels (the filter). Glottal inverse
filtering, the standard research method, estimates that filter frame by frame
with linear prediction (LPC) and undoes it. What is left is the excitation:
the buzz of the folds with the speaker's real pitch and rhythm, but no vowels.
A gentle spectral tilt is added back (the natural roll-off of the glottal
pulse), so it sounds like a buzz rather than a click train.

The output has the same length as vo.wav and is silent outside the window, so
it can be layered on the episode timeline.
"""
import subprocess
import sys
from pathlib import Path

import numpy as np

SR = 48000
AR = 16000  # analysis rate
ORDER = 18


def load(path: Path, sr: int):
    raw = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def lpc(frame, order):
    r = np.correlate(frame, frame, mode="full")[len(frame) - 1:len(frame) + order]
    if r[0] <= 1e-10:
        return np.r_[1.0, np.zeros(order)]
    r[0] *= 1.0001  # tiny white-noise floor for stability
    a = np.zeros(order + 1)
    a[0] = 1.0
    err = r[0]
    for i in range(1, order + 1):
        k = -(r[i] + np.dot(a[1:i], r[i - 1:0:-1])) / err
        a[1:i + 1] = a[1:i + 1] + k * np.r_[a[i - 1:0:-1], 1.0]
        err *= 1 - k * k
    return a


def one_pole(x, c):
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = v + c * acc
        y[i] = acc
    return y


def strip_tract(seg):
    n = int(0.025 * AR)
    hop = n // 2
    win = np.hanning(n)
    pre = np.r_[seg[0], seg[1:] - 0.97 * seg[:-1]]  # pre-emphasis so LPC models the tract, not the source tilt
    out = np.zeros(len(seg) + n)
    norm = np.zeros(len(seg) + n)
    padded = np.r_[pre, np.zeros(n + ORDER)]
    for s in range(0, len(seg), hop):
        fr = padded[s:s + n]
        a = lpc(fr * win, ORDER)
        ctx = padded[max(0, s - ORDER):s + n]
        res = np.convolve(ctx, a)[len(ctx) - n - (0 if s >= ORDER else ORDER - s):][:n] if s >= ORDER else np.convolve(np.r_[np.zeros(ORDER - s), ctx], a)[ORDER:ORDER + n]
        out[s:s + n] += res * win
        norm[s:s + n] += win
    e = out[:len(seg)] / np.maximum(norm[:len(seg)], 1e-3)
    return e


def resample(x, src, dst):
    raw = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-f", "f32le", "-ar", str(src), "-ac", "1", "-i", "-",
                          "-ar", str(dst), "-f", "f32le", "-"], input=x.astype(np.float32).tobytes(), capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def main(ep: Path, t0: float, t1: float, out_name: str):
    full = load(ep / "vo.wav", SR)
    seg16 = load(ep / "vo.wav", AR)[int(t0 * AR):int(t1 * AR)]
    e = strip_tract(seg16)
    # glottal roll-off (~ -6 dB/octave above a few hundred Hz), then a ~90 Hz high-pass
    buzz = one_pole(e, 0.86)
    buzz -= one_pole(buzz, 0.965) * (1 - 0.965)
    # follow the loudness of the original line (10 ms RMS) so the rhythm stays exact
    k = int(0.01 * AR)
    env_o = np.sqrt(np.convolve(seg16 ** 2, np.ones(k) / k, mode="same"))
    env_b = np.sqrt(np.convolve(buzz ** 2, np.ones(k) / k, mode="same")) + 1e-6
    gain = np.clip(env_o / env_b, 0, 50)
    gain = np.convolve(gain, np.ones(k) / k, mode="same")
    buzz *= gain
    b48 = resample(buzz, AR, SR)
    seg48 = full[int(t0 * SR):int(t0 * SR) + len(b48)]
    b48 *= np.sqrt(np.mean(seg48 ** 2)) / (np.sqrt(np.mean(b48 ** 2)) or 1)
    fade = int(0.012 * SR)
    b48[:fade] *= np.linspace(0, 1, fade)
    b48[-fade:] *= np.linspace(1, 0, fade)
    peak = np.max(np.abs(b48))
    if peak > 0.89:
        b48 *= 0.89 / peak
    out = np.zeros_like(full)
    a = int(t0 * SR)
    out[a:a + len(b48)] = b48[:len(out) - a]
    pcm = (np.clip(out, -1, 1) * 32767).astype("<i2").tobytes()
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    str(ep / out_name)], input=pcm, check=True)

    # report: how much vowel (formant) structure is left? compare LPC envelope peakiness
    def peakiness(x):
        a_ = lpc(x * np.hanning(len(x)), ORDER)
        h = np.abs(1 / np.fft.rfft(np.r_[a_, np.zeros(1024 - len(a_))]))
        return 20 * np.log10(np.max(h) / np.median(h))
    mid = len(seg16) // 2
    fr = slice(mid - 200, mid + 200)
    print(f"{out_name}: {t0}-{t1}s; formant peak above median: original {peakiness(seg16[fr]):.1f} dB, buzz {peakiness(buzz[fr]):.1f} dB")


if __name__ == "__main__":
    main(Path(sys.argv[1]), float(sys.argv[2]), float(sys.argv[3]), sys.argv[4])
