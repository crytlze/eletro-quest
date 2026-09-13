import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

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
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/maskable-512.png',
        'icons/apple-touch-icon.png',
      ],
      manifest: {
        name: 'Eletro Quest — Game Edukasi Teknik Elektro',
        short_name: 'Eletro Quest',
        description: 'Game edukasi S1 Teknik Elektro. Rakit rangkaian, taklukkan vektor, menangkan peluang.',
        lang: 'id',
        theme_color: '#050914',
        background_color: '#050914',
        display: 'standalone',
        orientation: 'portrait',
        scope: './',
        start_url: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
        navigateFallback: 'index.html',
        // API + Blob selalu online (jangan cache skor/auth)
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/api/'),
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
