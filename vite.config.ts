import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  // Exclude the api folder from Vite - these are Vercel serverless functions
  server: {
    watch: {
      ignored: ['**/api/**'],
    },
  },
  build: {
    rollupOptions: {
      external: [/googleapis/],
    },
  },
  optimizeDeps: {
    exclude: ['googleapis'],
    entries: ['src/**/*.{ts,tsx}'], // Only analyze src folder
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Force re-download of all assets on update
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Don't cache API routes - let them go to the server
        navigateFallbackDenylist: [/^\/api/],
      },
      devOptions: {
        enabled: false,
      },
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Looops - Personal Operating System',
        short_name: 'Looops',
        description: 'A personal operating system for managing all aspects of your life',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
