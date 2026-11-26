import {defineConfig} from 'vite';
import path from 'node:path';

export default defineConfig({
  root: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    assetsInlineLimit: 0,
    target: 'es2019',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        notfound: path.resolve(__dirname, '404.html'),
      },
    },
  },
});
