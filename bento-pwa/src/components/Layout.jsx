import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useIngredients } from '../hooks/useIngredients'
import { processCommand } from '../lib/geminiClient'
import NanaFAB from './Nana/NanaFAB'
import NanaOverlay from './Nana/NanaOverlay'
import '../styles/theme.css'

export default function Layout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  
  // Nana State
  const [isNanaVisible, setIsNanaVisible] = useState(false)
  const [nanaState, setNanaState] = useState('IDLE')
  const [aiResponse, setAiResponse] = useState('')
  const { ingredients } = useIngredients()

  const handleSendMessage = async (text) => {
    setNanaState('THINKING')
    setAiResponse('')
    
    try {
      const result = await processCommand(text, { ingredients: ingredients })
      setAiResponse(result.message)
      setNanaState('IDLE')
    } catch (error) {
      console.error('Nana error:', error)
      setNanaState('ERROR')
    }
  }

  return (
    <div className="app-wrapper">
      <div className="seigaiha-overlay"></div>
      
      <header className="nav-header">
        <div className="container nav-content">
          <NavLink to="/" className="nav-brand">🍱 BaChan</NavLink>
          <nav className="nav-links">
            <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Home</NavLink>
            <NavLink to="/ingredients" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Insumos</NavLink>
            <NavLink to="/bento-maker" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Bento</NavLink>
          </nav>
        </div>
      </header>
      
      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>
      
      <NanaFAB 
        onClick={() => setIsNanaVisible(true)} 
        onLongPress={() => console.log('Voice test')} 
      />

      <NanaOverlay 
        isVisible={isNanaVisible}
        onClose={() => setIsNanaVisible(false)}
        nanaState={nanaState}
        aiResponse={aiResponse}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}
