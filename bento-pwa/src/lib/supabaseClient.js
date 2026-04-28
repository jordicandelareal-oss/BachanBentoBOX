import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Faltan variables de entorno de Supabase.')
}

// Lee el token en el momento de instanciar el módulo.
// AdminSetup usa window.location.href para forzar un hard-reload completo
// de la página, lo que garantiza que este módulo se reimporta con el token
// ya guardado en localStorage (incluyendo el header x-bachan-key).
const bachanToken = localStorage.getItem('bachan_admin_token')

const options = bachanToken ? {
  global: {
    headers: {
      'x-bachan-key': bachanToken
    }
  }
} : {}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, options)

// Helper centralizado para comprobar si el dispositivo tiene sesión Maestro
export const isMasterClient = () =>
  localStorage.getItem('bachan_admin_token') === 'BachAn_Master_2026_Secure'
