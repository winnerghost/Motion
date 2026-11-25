#!/usr/bin/env python3
"""Deploy the built website (site/dist) to Vercel as a static site.

    npx vite build --config site/vite.config.ts
    VERCEL_TOKEN=... python3 scripts/deploy_site.py [project-name]

Uses the Vercel REST API directly (no CLI): uploads every file by its SHA-1,
then creates a production deployment. In the Claude cloud sandbox the token
is injected by the network proxy, so VERCEL_TOKEN can be left unset there.
"""
import hashlib
import json
import os
import sys
import time
import urllib.request
from pathlib import Path

API = "https://api.vercel.com"
ROOT = Path(__file__).resolve().parent.parent / "site" / "dist"
PROJECT = sys.argv[1] if len(sys.argv) > 1 else "pip-explains"
TOKEN = os.environ.get("VERCEL_TOKEN")
TEAM = os.environ.get("VERCEL_TEAM_ID")

VERCEL_JSON = {
    "cleanUrls": True,
    "headers": [
        {"source": "/assets/(.*)", "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}]},
        {"source": "/(media|fonts|sfx)/(.*)", "headers": [{"key": "Cache-Control", "value": "public, max-age=604800"}]},
    ],
}


def req(method, path, body=None, headers=None, raw=False):
    url = API + path + (("&" if "?" in path else "?") + f"teamId={TEAM}" if TEAM else "")
    h = {"Content-Type": "application/json"}
    if TOKEN:
        h["Authorization"] = f"Bearer {TOKEN}"
    h.update(headers or {})
    data = body if raw else (json.dumps(body).encode() if body is not None else None)
    r = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=300) as resp:
            txt = resp.read().decode() or "{}"
            return json.loads(txt)
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{method} {path} -> {e.code}: {e.read().decode()[:500]}")


def main():
    if not ROOT.exists():
        raise SystemExit("site/dist not found: build the site first")
    files = []
    blobs = {p.relative_to(ROOT).as_posix(): p.read_bytes() for p in sorted(ROOT.rglob("*")) if p.is_file()}
    blobs["vercel.json"] = json.dumps(VERCEL_JSON, indent=2).encode()
    for name, data in blobs.items():
        sha = hashlib.sha1(data).hexdigest()
        req("POST", "/v2/files", data, {"Content-Type": "application/octet-stream", "x-vercel-digest": sha, "Content-Length": str(len(data))}, raw=True)
        files.append({"file": name, "sha": sha, "size": len(data)})
        print(f"  uploaded {name} ({len(data) // 1024} KB)")
    dep = req("POST", "/v13/deployments", {
        "name": PROJECT,
        "files": files,
        "target": "production",
        "projectSettings": {"framework": None, "buildCommand": None, "installCommand": None, "outputDirectory": None},
    })
    dep_id = dep["id"]
    print("deployment", dep_id, dep.get("url"))
    for _ in range(120):
        d = req("GET", f"/v13/deployments/{dep_id}")
        state = d.get("readyState")
        if state in ("READY", "ERROR", "CANCELED"):
            break
        time.sleep(3)
    print("state:", state)
    print("aliases:", ", ".join(d.get("alias", []) or []))
    print("url: https://" + d.get("url", ""))


if __name__ == "__main__":
    main()
