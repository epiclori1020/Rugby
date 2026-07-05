import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/')) {
            return 'react'
          }

          if (id.includes('/node_modules/@supabase/')) {
            return 'supabase'
          }

          if (id.includes('/node_modules/dexie/')) {
            return 'storage'
          }

          if (id.includes('/node_modules/lucide-react/')) {
            return 'icons'
          }

          return undefined
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'OnField Coach',
        short_name: 'OnField',
        description: 'Field-ready coach operations for the training day.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        theme_color: '#1F6B5C',
        background_color: '#F4F5F3',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,png,webp,pdf}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
