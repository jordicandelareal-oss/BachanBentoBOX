import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // ── Cache Bust v4 ─────────────────────────────────────────────────────
        // Cambiar este prefijo fuerza a TODOS los Service Workers instalados
        // a invalidar sus cachés y descargar la versión más reciente.
        // Imprescindible cuando el SW antiguo sigue sirviendo código roto.
        cacheId: 'BACHAN_CACHE_FINAL_V9',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/, /\/supabase\//],
        runtimeCaching: [
          {
            // ESTRATEGIA DE CHOQUE: Siempre preguntar al servidor por cambios (HTML/JS/CSS)
            urlPattern: /\.(?:html|js|css)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'BACHAN_CACHE_MAIN_V3',
              expiration: { maxEntries: 100 }
            }
          },
          {
            // No cachear NUNCA las peticiones a Supabase (datos en tiempo real)
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bachan-fonts-v6',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'BaChan POS & ERP',
        short_name: 'BaChan TPV',
        description: 'Sistema de gestión interna y punto de venta para BaChan',
        theme_color: '#0f172a',

        background_color: '#F8F9FA',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        scope: '/',
        // start_url apunta a la raíz. El token de admin en localStorage
        // se detecta en Home.jsx y muestra el panel directamente.
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
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
  ]
})
