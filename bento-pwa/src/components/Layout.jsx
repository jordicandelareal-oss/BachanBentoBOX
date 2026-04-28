import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useIngredients } from '../hooks/useIngredients'
import { useRecipes } from '../hooks/useRecipes'
import { useOrderNotifications } from '../hooks/useOrderNotifications'
import { processCommand } from '../lib/geminiClient'
import { BookOpen, CookingPot, Carrot, Sparkles, Settings, BarChart3, LayoutGrid, ShoppingBag } from 'lucide-react'
import pkg from '../../package.json'
import NanaOverlay from './Nana/NanaOverlay'
import AIActionSheet from './Nana/AIActionSheet'
import '../styles/theme.css'

export default function Layout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false)
  
  // Nana State
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false)
  const [isNanaVisible, setIsNanaVisible] = useState(false)
  const [initialVisionMode, setInitialVisionMode] = useState(false)
  const [nanaState, setNanaState] = useState('IDLE')
  const [aiResponse, setAiResponse] = useState('')
  
  const { ingredients } = useIngredients()
  const { recipes } = useRecipes()

  const isMaster = localStorage.getItem('bachan_admin_token') === 'BachAn_Master_2026_Secure';
  
  // 🔑 MASTER ACCESS LOGIC (Shock Recovery)
  const [accessKey, setAccessKey] = useState('');
  const [showGate, setShowGate] = useState(!isMaster);
  const [clickCount, setClickCount] = useState(0);

  // Auto-validate via URL
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('access') === 'master' || params.get('key') === 'BENTO2026') {
      localStorage.setItem('bachan_admin_token', 'BachAn_Master_2026_Secure');
      window.location.href = '/';
    }
  });

  const handleGateSubmit = (e) => {
    e.preventDefault();
    if (accessKey.toUpperCase() === 'BENTO2026') {
      localStorage.setItem('bachan_admin_token', 'BachAn_Master_2026_Secure');
      setShowGate(false);
      window.location.reload();
    } else {
      alert('Llave incorrecta');
      setAccessKey('');
    }
  };

  const handleLogoClick = () => {
    const next = clickCount + 1;
    if (next >= 5) {
      const key = prompt('Introduce la Llave Maestra:');
      if (key?.toUpperCase() === 'BENTO2026') {
        localStorage.setItem('bachan_admin_token', 'BachAn_Master_2026_Secure');
        window.location.reload();
      }
      setClickCount(0);
    } else {
      setClickCount(next);
    }
  };

  // Activar Notificaciones (Gong + Desktop)
  useOrderNotifications(isMaster);

  if (showGate) {
    return (
      <div style={{
        height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', backgroundColor: '#0c1c2e',
        color: 'white', padding: '24px', textAlign: 'center'
      }}>
        <div style={{ marginBottom: '32px', animation: 'float 3s ease-in-out infinite' }}>
          <img src="/logo-bachan.png" alt="BaChan" style={{ width: '120px', filter: 'drop-shadow(0 0 20px rgba(245,230,200,0.3))' }} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', color: '#f5e6c8', marginBottom: '8px' }}>BaChan BentoBox</h2>
        <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '32px' }}>Puerta de Enlace de Administración</p>
        
        <form onSubmit={handleGateSubmit} style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="password"
            placeholder="Introduce la llave..."
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            style={{
              padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', textAlign: 'center',
              fontSize: '18px', fontWeight: 'bold', outline: 'none'
            }}
          />
          <button type="submit" className="btn-primary" style={{ backgroundColor: '#f5e6c8', color: '#000', padding: '16px', borderRadius: '16px', fontWeight: '900' }}>
            VALIDAR ACCESO
          </button>
        </form>
        <p style={{ marginTop: '40px', fontSize: '10px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Sistema Privado • v{pkg.version}
        </p>
      </div>
    );
  }

  const handleSendMessage = async (text, imageBase64 = null) => {
    setNanaState('THINKING')
    setAiResponse('')
    
    try {
      const result = await processCommand(text, { 
        ingredients: ingredients,
        recipes: recipes 
      }, imageBase64)
      setAiResponse(result.message)
      setNanaState('IDLE')
    } catch (error) {
      console.error('Nana error:', error)
      setNanaState('ERROR')
    }
  }

  const openNana = () => {
    setIsActionSheetOpen(true)
  }

  const handleAIActionSelect = (mode) => {
    setInitialVisionMode(mode === 'vision')
    setIsNanaVisible(true)
  }

  return (
    <div className="app-wrapper">
      {/* VERSION INFO FLOATING BUTTON */}
      <button 
        onClick={() => setIsVersionModalOpen(true)}
        style={{ 
          position: 'fixed', 
          bottom: '20px', 
          left: '20px', 
          zIndex: 9999, 
          background: 'rgba(0,0,0,0.3)', 
          color: 'white', 
          border: 'none', 
          borderRadius: '50%', 
          width: '40px', 
          height: '40px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: '12px', 
          fontWeight: 'bold',
          cursor: 'pointer',
          opacity: 0.5,
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
      >
        v
      </button>

      {/* VERSION MODAL */}
      {isVersionModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            textAlign: 'center',
            maxWidth: '90%',
            width: '320px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1a1a1a' }}>Información de Versión</h3>
            <p style={{ margin: '0 0 20px 0', color: '#666' }}>Versión: v{pkg.version} - Test de Despliegue</p>
            <button 
              onClick={() => setIsVersionModalOpen(false)}
              style={{
                background: '#0c1c2e',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <header className="nav-header">
        <div className="container nav-content-wrapper">
          <div className="nav-top-row">
            <div onClick={handleLogoClick} style={{ cursor: 'pointer' }} className="nav-brand">🍱 BaChan</div>
            {isMaster && (
              <div className="desktop-nav">
                <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Inicio</NavLink>
                <NavLink to="/pos" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>TPV</NavLink>
                <NavLink to="/bento-maker" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Menú</NavLink>
                <NavLink to="/preparations" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Elaboraciones</NavLink>
                <NavLink to="/ingredients" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Insumos</NavLink>
                <NavLink to="/settings" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Ajustes</NavLink>
              </div>
            )}
          </div>
          
          {isMaster && (
            <nav className="mobile-icon-nav" style={{ justifyContent: 'space-around', gap: '4px' }}>
              <NavLink to="/" className={({isActive}) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
                <LayoutGrid size={22} />
                <span>Inicio</span>
              </NavLink>
              <NavLink to="/pos" className={({isActive}) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
                <ShoppingBag size={22} />
                <span>TPV</span>
              </NavLink>
              <NavLink to="/bento-maker" className={({isActive}) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
                <BookOpen size={22} />
                <span>Menú</span>
              </NavLink>
              <NavLink to="/preparations" className={({isActive}) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
                <CookingPot size={22} />
                <span>Elabs</span>
              </NavLink>
              <NavLink to="/ingredients" className={({isActive}) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
                <Carrot size={22} />
                <span>Items</span>
              </NavLink>
              <NavLink to="/settings" className={({isActive}) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
                <Settings size={22} />
                <span>Ajustes</span>
              </NavLink>
            </nav>
          )}
        </div>
      </header>
      
      <main className="main-content">
        <div className="container">
          <Outlet context={{ openNana }} />
        </div>
      </main>
      
      <AIActionSheet 
        isOpen={isActionSheetOpen} 
        onClose={() => setIsActionSheetOpen(false)}
        onSelectOption={handleAIActionSelect}
      />

      <NanaOverlay 
        isVisible={isNanaVisible}
        onClose={() => setIsNanaVisible(false)}
        nanaState={nanaState}
        aiResponse={aiResponse}
        onSendMessage={handleSendMessage}
        initialVisionMode={initialVisionMode}
      />
    </div>
  )
}
