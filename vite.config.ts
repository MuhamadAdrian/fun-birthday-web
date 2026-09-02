import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'favicon-48x48.png',
        'apple-touch-icon.png',
        'icons.svg',
        'icons/*.png',
        'models/*.glb',
        'audio/*.mp3',
      ],
      manifest: {
        name: 'AR Happy Birthday',
        short_name: 'HappyBday AR',
        description: 'Pilih kue 3D, letakkan di dunia nyata, tiup lilinnya!',
        theme_color: '#E63946',
        background_color: '#FFF8E7',
        display: 'standalone',
        start_url: '/?source=pwa',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Improvement: jangan precache emulate assets XR yang besar (2-3MB) kalau tidak dipakai
        globIgnores: ['**/emulate-*.js', '**/office_*.js', '**/living_*.js', '**/music_*.js', '**/meeting_*.js'],
        runtimeCaching: [
          {
            urlPattern: /^.*\/models\/.*\.glb$/,
            handler: 'CacheFirst',
            options: { cacheName: 'cake-models', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
          {
            urlPattern: /^.*\/audio\/.*\.(mp3|ogg|wav)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'audio-cache', expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
        ],
      },
    }),
  ],
})
