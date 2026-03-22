import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useIngredients } from '../hooks/useIngredients'
import { useRecipes } from '../hooks/useRecipes'
import { processCommand } from '../lib/geminiClient'
import { Box, CookingPot, Carrot, Sparkles, Settings } from 'lucide-react'
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
            <NavLink to="/" className="nav-brand">🍱 BaChan</NavLink>
            <div className="desktop-nav">
              <NavLink to="/bento-maker" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Bentos</NavLink>
              <NavLink to="/preparations" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Elaboraciones</NavLink>
              <NavLink to="/ingredients" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Insumos</NavLink>
              <NavLink to="/settings" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Categorías</NavLink>
            </div>
          </div>
          
          <nav className="mobile-icon-nav">
            <NavLink to="/bento-maker" className={({isActive}) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
              <Box size={22} />
              <span>Bentos</span>
            </NavLink>
            <NavLink to="/preparations" className={({isActive}) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
              <CookingPot size={22} />
              <span>Elaboraciones</span>
            </NavLink>
            <NavLink to="/ingredients" className={({isActive}) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
              <Carrot size={22} />
              <span>Inventario</span>
            </NavLink>
            <button onClick={openNana} className="mobile-nav-item nana-btn">
              <Sparkles size={22} />
              <span>Nana IA</span>
            </button>
            <NavLink to="/settings" className={({isActive}) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
              <Settings size={22} />
              <span>Ajustes</span>
            </NavLink>
          </nav>
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
