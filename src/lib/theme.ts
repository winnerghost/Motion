import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

export const C = {
  bg0: '#0B0824',
  bg1: '#1A1150',
  bg2: '#2C1A6E',
  ink: '#140F33',
  white: '#FFFFFF',
  cyan: '#45E9FF',
  lime: '#8DFF6A',
  pink: '#FF4F8B',
  yellow: '#FFD84D',
  orange: '#FF8A2A',
  red: '#FF3B4E',
  brain: '#FF8DB8',
  brainDark: '#D9547F',
};

export const FONT_DISPLAY = 'Fredoka';
export const FONT_HEAD = 'Bricolage Grotesque';

let loaded = false;
export function loadFonts() {
  if (loaded) return;
  loaded = true;
  for (const w of ['500', '600', '700']) {
    loadFont({family: FONT_DISPLAY, url: staticFile(`fonts/fredoka-latin-${w}-normal.woff2`), weight: w});
  }
  for (const w of ['600', '800']) {
    loadFont({
      family: FONT_HEAD,
      url: staticFile(`fonts/bricolage-grotesque-latin-${w}-normal.woff2`),
      weight: w,
    });
  }
}
