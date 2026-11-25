import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// The site reuses the exact Pip character code from the video engine (../src).
// `remotion` is aliased to a tiny shim so the video framework isn't bundled.
export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  resolve: {
    alias: {
      remotion: path.resolve(__dirname, 'src/remotion-shim.ts'),
    },
  },
  server: {fs: {allow: [path.resolve(__dirname, '..')]}},
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    assetsInlineLimit: 0,
    target: 'es2019',
  },
});
