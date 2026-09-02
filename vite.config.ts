import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'models/*.glb', 'audio/*.mp3'],
      manifest: {
        name: 'AR Happy Birthday',
        short_name: 'HappyBday AR',
        description: 'Pilih kue 3D, letakkan di dunia nyata, tiup lilinnya!',
        theme_color: '#E63946',
        background_color: '#FFF8E7',
        display: 'standalone',
        start_url: '/?source=pwa',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
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
