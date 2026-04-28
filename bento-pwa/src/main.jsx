import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'

// ─── Service Worker: Actualización Silenciosa ────────────────────────────────
// CRÍTICO: En Safari iOS en modo PWA standalone, el confirm() está bloqueado
// por políticas de seguridad de WebKit. Usamos reload silencioso para
// garantizar que el SW nuevo tome el control inmediatamente en todos los
// dispositivos sin requerir interacción del usuario.
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('🔄 [SW] Nueva versión detectada → recargando automáticamente...')
    // Reload silencioso: activa el nuevo SW y recarga la página
    updateSW(true)
  },
  onOfflineReady() {
    console.log('✅ [SW] BaChan lista para usar offline')
  },
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      // Comprobar actualizaciones cada 5 minutos (crítico post-deploy)
      setInterval(() => {
        registration.update()
      }, 5 * 60 * 1000)
    }
  },
  onRegisterError(error) {
    console.error('❌ [SW] Error de registro:', error)
  }
})
// ─────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
