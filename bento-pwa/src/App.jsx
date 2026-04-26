import { useState, useEffect, Component } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'

import Layout          from './components/Layout'
import Home            from './pages/Home'
import Ingredients     from './pages/Ingredients'
import Recipes         from './pages/Recipes'
import BentoPage       from './pages/BentoPage'
import Preparations    from './pages/Preparations'
import CatalogSettings from './pages/CatalogSettings'
import POS             from './pages/POS'
import BusinessAnalytics from './pages/BusinessAnalytics'
import AdminRoute      from './components/AdminRoute'
import SplashScreen    from './components/SplashScreen'

import './styles/theme.css'
import './styles/animations.css'

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errorMsg: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error?.message || 'Error desconocido' }
  }

  componentDidCatch(error, info) {
    console.error('🚨 [ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', backgroundColor: '#0c1c2e',
          color: '#fff', textAlign: 'center', padding: '20px', gap: '16px'
        }}>
          <span style={{ fontSize: '48px' }}>⚠️</span>
          <h2 style={{ fontFamily: 'Georgia, serif', color: '#f5e6c8', margin: 0 }}>
            Algo ha fallado
          </h2>
          <p style={{ color: '#aaa', maxWidth: '320px', margin: 0, fontSize: '14px' }}>
            {this.state.errorMsg}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '14px 28px', backgroundColor: '#f5e6c8', color: '#000',
              border: 'none', borderRadius: '12px', fontWeight: 'bold',
              cursor: 'pointer', fontSize: '15px'
            }}
          >
            🔄 Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
// ─────────────────────────────────────────────────────────────────────────────

function App() {
  const [showSplash, setShowSplash] = useState(true);

  // 🚨 SHOCK RECOVERY (v2.2.8): Purga inmediata si la versión es antigua
  useEffect(() => {
    const APP_VERSION = '2.3.2';
    const savedVersion = localStorage.getItem('bachan_app_version');
    
    if (savedVersion && savedVersion !== APP_VERSION) {
      console.log('🔄 BaChan SHOCK UPDATE (v2.3.5): Limpiando caché y forzando recarga...');
      
      // Limpiar cachés del Service Worker
      if ('serviceWorker' in navigator) {
        caches.keys().then(names => {
          for (let name of names) caches.delete(name);
        });
      }
      
      localStorage.setItem('bachan_app_version', APP_VERSION);
      // Hard reload saltándose la caché
      window.location.reload(true);
    }
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Navigate to="/" replace />} />

            {/* Dashboard directo — sin SplashScreen, sin portal cliente */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />

              <Route element={<AdminRoute />}>
                <Route path="pos"          element={<POS />} />
                <Route path="ingredients"  element={<Ingredients />} />
                <Route path="analytics"    element={<BusinessAnalytics />} />
                <Route path="preparations" element={<Preparations />} />
                <Route path="recipes"      element={<Recipes />} />
                <Route path="bento-maker"  element={<BentoPage />} />
                <Route path="settings"     element={<CatalogSettings />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
