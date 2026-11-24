// Render an episode to a finished, upload-ready MP4.
//   npm run render -- EP001-tickle
// 1) Remotion renders 1080x1920 @ 60fps (H.264, CRF 16)
// 2) ffmpeg normalises loudness to -14 LUFS (YouTube/Instagram target), video copied untouched
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

const id = process.argv[2] ?? 'EP001-tickle';
fs.mkdirSync('out', {recursive: true});
const raw = `out/${id}.raw.mp4`;
const final = `out/${id}.mp4`;
execFileSync('npx', ['remotion', 'render', 'src/index.ts', id, raw, '--concurrency=4', '--log=warn'], {stdio: 'inherit'});
execFileSync('ffmpeg', [
  '-y', '-hide_banner', '-loglevel', 'error', '-i', raw,
  '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.0:LRA=11', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000',
  '-movflags', '+faststart', final,
], {stdio: 'inherit'});
fs.rmSync(raw);
console.log(`\n✔ ${final}`);
