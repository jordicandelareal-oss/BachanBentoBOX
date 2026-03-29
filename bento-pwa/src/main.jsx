import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'

// Registrar el Service Worker con auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    // Nueva versión detectada → pedir confirmación al usuario
    if (confirm('🍱 Nueva versión de BaChan disponible. ¿Actualizar ahora?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('✅ BaChan lista para usar offline')
  },
  // Comprobar actualizaciones cada hora (seguridad para apps en segundo plano)
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      setInterval(() => {
        registration.update()
      }, 60 * 60 * 1000) // 1 hora
    }
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
