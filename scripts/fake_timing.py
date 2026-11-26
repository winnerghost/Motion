#!/usr/bin/env python3
"""Placeholder timings for a long-form script, so the animation can be built
before the voiceover exists. Writes, per section, <out>/<id>/timing.json (same
shape as prepare_audio.py) plus a silent vo.wav of matching length.
Real takes replace both via prepare_audio.py.

Usage: python3 scripts/fake_timing.py src/longform/lf01/script.json public/longform/lf01
"""
import json
import math
import re
import subprocess
import sys
from pathlib import Path

FPS = 60


def chunks_for(words):
    FUNC = {"a", "an", "the", "of", "to", "and", "your", "you", "it", "is", "so", "what"}
    phrases, cur = [], []
    for i, w in enumerate(words):
        cur.append(i)
        if re.search(r"[.?!,:]\"?$", w["text"]) or w["text"].endswith("..."):
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
    return chunks


def main(script: Path, out: Path):
    data = json.loads(script.read_text())
    for sec in data["sections"]:
        text = re.sub(r"\[[^\]]*\]", " ", sec["prompt"])
        toks = text.split()
        t = 0.25
        words = []
        for tok in toks:
            dur = 0.11 + 0.055 * len(re.sub(r"[^A-Za-z0-9]", "", tok))
            words.append({"text": tok, "start": round(t, 3), "end": round(t + dur, 3)})
            t += dur + 0.06
            if tok.endswith("..."):
                t += 0.55
            elif re.search(r"[.?!]$", tok):
                t += 0.38
            elif re.search(r"[,:]$", tok):
                t += 0.16
        dur = round(t + 0.3, 3)
        n = math.ceil(dur * FPS)
        env = [0.0] * n
        for w in words:
            for f in range(int(w["start"] * FPS), min(n, int(w["end"] * FPS))):
                env[f] = round(0.35 + 0.45 * abs(math.sin(f * 0.9)), 3)
        d = out / sec["id"]
        d.mkdir(parents=True, exist_ok=True)
        timing = {"fps": FPS, "duration": dur, "regions": [], "words": words, "chunks": chunks_for(words), "env": env, "placeholder": True}
        (d / "timing.json").write_text(json.dumps(timing))
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono",
                        "-t", str(dur), str(d / "vo.wav")], check=True)
        print(f"{sec['id']:6s} {dur:6.2f}s  {len(words)} words")


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
