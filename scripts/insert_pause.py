#!/usr/bin/env python3
"""Insert a silent pause into a narration right after a given word, shifting the word timings.

    python3 scripts/insert_pause.py <dir> <word> <seconds>

Rewrites <dir>/vo.mp3 and <dir>/words.raw.json in place (originals kept as *.orig).
Used for "try it now" moments, so viewers get a real beat to try the challenge.
Run prepare_audio.py afterwards.
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path


def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


def main(d: Path, word: str, secs: float):
    mp3, wj = d / "vo.mp3", d / "words.raw.json"
    for f in (mp3, wj):
        if not (d / (f.name + ".orig")).exists():
            shutil.copy(f, d / (f.name + ".orig"))
    data = json.loads((d / "words.raw.json.orig").read_text())
    words = data["words"]
    hit = next(w for w in words if not w["text"].startswith("[") and norm(w["text"]) == norm(word))
    # cut halfway between the word's end and the next word's start
    later = [w["start"] for w in words if w["start"] > hit["end"] and w.get("type", "word") == "word"]
    cut = round((hit["end"] + (min(later) if later else hit["end"])) / 2, 3)
    for w in words:
        if w["start"] >= cut:
            w["start"] = round(w["start"] + secs, 3)
            w["end"] = round(w["end"] + secs, 3)
    wj.write_text(json.dumps(data))
    src = d / "vo.mp3.orig"
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(src), "-filter_complex",
         f"[0]atrim=0:{cut},asetpts=N/SR/TB[a];[0]atrim={cut},asetpts=N/SR/TB[b];"
         f"anullsrc=r=44100:cl=mono,atrim=0:{secs}[s];[a][s][b]concat=n=3:v=0:a=1[o]",
         "-map", "[o]", "-c:a", "libmp3lame", "-q:a", "2", str(mp3)],
        check=True,
    )
    print(f"pause of {secs}s inserted at {cut}s (after '{hit['text']}')")


if __name__ == "__main__":
    main(Path(sys.argv[1]), sys.argv[2], float(sys.argv[3]))
