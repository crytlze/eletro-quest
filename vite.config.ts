import { defineConfig } from 'vite';

// Mobile-web friendly base: relative paths so `dist/index.html`
// works from any static host without backend.
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 4096,
    // Phaser ships as one ~1.5MB vendor chunk; splitting it would hurt
    // game load UX, so the limit is sized for it instead of code-splitting.
    chunkSizeWarningLimit: 1700
  },
  server: {
    port: 5173,
    host: true
  }
});
