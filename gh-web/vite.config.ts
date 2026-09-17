import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  // Pinned to this file rather than the shell's directory, so `bun run site:build`
  // works from the repository root the way every other package script does.
  root: fileURLToPath(new URL('.', import.meta.url)),
  // Pages serves this under /obi-e2e/, and the same bundle is opened from
  // file:// when someone checks a build by hand. Relative asset URLs cover both.
  base: './',
  plugins: [react(), tailwindcss()],
  /*
   * `bun run site:fixtures` writes fake runs into `fixtures/`, and the dev server
   * serves them at the paths the published branch uses. The build is given no
   * public directory at all: served from `public/` they would land in `dist/`, and
   * a fake `runs.json` on the published site shadows the real one.
   */
  publicDir: command === 'serve' && 'fixtures',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // The Playwright report next to it is already several megabytes; there is no
    // reason to also ship sourcemaps for a dashboard.
    sourcemap: false,
    // react-dom and motion account for most of it and neither splits usefully for
    // a page this small. 170 kB gzipped next to a multi-megabyte Playwright report
    // is not the thing to optimise.
    chunkSizeWarningLimit: 700,
  },
}));
