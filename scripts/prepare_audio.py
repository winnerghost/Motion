#!/usr/bin/env python3
"""Turn a voiceover + word timestamps into everything the video needs.

Usage:
    python3 scripts/prepare_audio.py public/episodes/ep001

Reads  <dir>/vo.mp3 and <dir>/words.raw.json  (ElevenLabs Scribe word list)
Writes <dir>/timing.json with:
    words   - spoken words (audio tags removed), snapped to the real speech
              regions found by ffmpeg's silence detector so captions never drift
    chunks  - 1-3 word caption groups (what appears on screen at once)
    env     - mouth-open envelope, one value per video frame (lip sync)
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

FPS = 60
SR = 22050


def speech_regions(mp3: Path):
    out = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(mp3), "-af",
         "silencedetect=noise=-35dB:d=0.18", "-f", "null", "-"],
        capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    dur = float(re.search(r"Duration: (\d+):(\d+):([\d.]+)", out).group(3)) + \
        60 * float(re.search(r"Duration: (\d+):(\d+):([\d.]+)", out).group(2))
    regions, cur = [], 0.0
    for s, e in zip(starts, ends + [dur] * (len(starts) - len(ends))):
        if s > cur:
            regions.append([cur, s])
        cur = e
    if cur < dur - 0.05:
        regions.append([cur, dur])
    return regions, dur


def load_pcm(mp3: Path):
    raw = subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(mp3),
         "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def main(ep_dir: Path):
    words_raw = json.loads((ep_dir / "words.raw.json").read_text())["words"]
    words = []
    for w in words_raw:
        if w.get("type", "word") != "word" or re.fullmatch(r"\[.*\]|\[.*|.*\]", w["text"]):
            continue
        if re.fullmatch(r"[—–-]+", w["text"]):
            if words:
                words[-1]["brk"] = True  # a dash is a phrase break, but never shown
            continue
        words.append({"text": w["text"], "start": w["start"], "end": w["end"]})

    regions, dur = speech_regions(ep_dir / "vo.mp3")

    # Assign each word to the speech region its start falls in (or nearest).
    def region_of(t):
        best, bd = 0, 1e9
        for i, (a, b) in enumerate(regions):
            d = 0 if a - 0.08 <= t <= b else min(abs(t - a), abs(t - b))
            if d < bd:
                best, bd = i, d
        return best

    groups = {}
    for i, w in enumerate(words):
        groups.setdefault(region_of(w["start"]), []).append(i)
    # Re-time words inside each region so the first word starts and the last
    # word ends exactly where the audio says they do.
    for r, idxs in groups.items():
        a, b = regions[r]
        s0, s1 = words[idxs[0]]["start"], max(words[idxs[-1]]["end"], words[idxs[0]]["start"] + 0.05)
        for i in idxs:
            for k in ("start", "end"):
                p = (words[i][k] - s0) / (s1 - s0)
                words[i][k] = round(a + max(0.0, min(1.0, p)) * (b - a), 3)
        words[idxs[-1]]["end"] = round(b, 3)

    # Caption chunks: split into phrases (punctuation / pauses), then split
    # each phrase into balanced groups of at most 3 words, avoiding chunks
    # that end on a dangling little word ("a", "the", "of"...).
    FUNC = {"a", "an", "the", "of", "to", "and", "your", "you", "it", "is", "so", "what"}
    phrases, cur = [], []
    for i, w in enumerate(words):
        cur.append(i)
        nxt = words[i + 1] if i + 1 < len(words) else None
        gap = (nxt["start"] - w["end"]) if nxt else 9
        if w.get("brk") or re.search(r"[.?!,]\"?$", w["text"]) or gap > 0.28:
            phrases.append(cur)
            cur = []
    if cur:
        phrases.append(cur)
    chunks = []
    for ph in phrases:
        n = -(-len(ph) // 3)
        sizes = [len(ph) // n + (1 if k < len(ph) % n else 0) for k in range(n)]
        groups, k = [], 0
        for sz in sizes:
            groups.append(ph[k:k + sz])
            k += sz
        for g in range(len(groups) - 1):
            last = words[groups[g][-1]]["text"].lower().strip('".,')
            if last in FUNC and len(groups[g]) > 1 and len(groups[g + 1]) < 3:
                groups[g + 1].insert(0, groups[g].pop())
        for g in groups:
            chunks.append({"words": g, "start": words[g[0]]["start"], "end": words[g[-1]]["end"]})

    # Lip-sync envelope: RMS per video frame, normalised and smoothed.
    pcm = load_pcm(ep_dir / "vo.mp3")
    hop = SR / FPS
    n = int(np.ceil(len(pcm) / hop))
    rms = np.array([
        np.sqrt(np.mean(pcm[int(i * hop):int((i + 1) * hop)] ** 2) + 1e-12) for i in range(n)
    ])
    db = 20 * np.log10(rms + 1e-9)
    env = np.clip((db + 42) / 30, 0, 1)  # -42 dB -> closed, -12 dB -> wide open
    # light attack/release smoothing so the mouth doesn't flicker
    out, v = [], 0.0
    for x in env:
        v = v + (x - v) * (0.6 if x > v else 0.35)
        out.append(round(float(v), 3))

    timing = {"fps": FPS, "duration": round(dur, 3), "regions": regions,
              "words": words, "chunks": chunks, "env": out}
    (ep_dir / "timing.json").write_text(json.dumps(timing))
    print(f"{len(words)} words, {len(chunks)} chunks, {len(regions)} regions, {dur:.2f}s")
    for c in chunks:
        print(f"  {c['start']:6.2f}-{c['end']:6.2f}  " + " ".join(words[i]["text"] for i in c["words"]))


if __name__ == "__main__":
    main(Path(sys.argv[1]))
