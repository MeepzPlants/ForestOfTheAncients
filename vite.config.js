import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    open: true
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifestFilename: 'manifest.webmanifest',
      includeAssets: ['favicon.ico', 'logo.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Forest of the Ancients',
        short_name: 'FOTA',
        description: 'A personal plant care journal and tracker. Log entries, track growth, record harvests, and manage propagation — all stored privately on your device.',
        id: 'https://forest-of-the-ancients-aon0tsjft-meepz-s-projects.vercel.app/',
        start_url: 'https://forest-of-the-ancients-aon0tsjft-meepz-s-projects.vercel.app/',
        scope: 'https://forest-of-the-ancients-aon0tsjft-meepz-s-projects.vercel.app/',
        display: 'standalone',
        background_color: '#1a2e1a',
        theme_color: '#2d5a2d',
        orientation: 'portrait',
        lang: 'en',
        dir: 'ltr',
        categories: ['lifestyle', 'utilities', 'health'],
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Forest of the Ancients home screen'
          }
        ],
        shortcuts: [
          {
            name: 'Add Journal Entry',
            short_name: 'Journal',
            url: '/journal',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'View Inventory',
            short_name: 'Inventory',
            url: '/inventory',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ]
      }
    })
  ]
})
