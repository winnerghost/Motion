// Render preview stills of a composition at given seconds.
// Usage: node scripts/stills.mjs <compId> <outDir> <sec> [sec...]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const [compId, outDir, ...secs] = process.argv.slice(2);
const chrome = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const browserExecutable = fs.existsSync(chrome) ? chrome : null;
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable});
const composition = await selectComposition({serveUrl, id: compId, puppeteerInstance: browser, browserExecutable});
for (const s of secs) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(parseFloat(s) * composition.fps));
  const output = path.join(outDir, `${compId}-${String(s).padStart(5, '0')}.png`);
  await renderStill({composition, serveUrl, output, frame, puppeteerInstance: browser, browserExecutable, scale: 0.5});
  console.log(output);
}
await browser.close({silent: true});
