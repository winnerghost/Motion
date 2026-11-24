import {Config} from '@remotion/cli/config';
import fs from 'node:fs';

// In the cloud sandbox we reuse the pre-installed headless Chrome.
// On your own machine Remotion downloads its own browser automatically.
const sandboxChrome =
  '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
if (fs.existsSync(sandboxChrome)) {
  Config.setBrowserExecutable(sandboxChrome);
}

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
Config.overrideWebpackConfig((c) => c);
