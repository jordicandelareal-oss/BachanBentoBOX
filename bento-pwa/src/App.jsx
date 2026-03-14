import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'

import Layout from './components/Layout'
import Home from './pages/Home'
import Ingredients from './pages/Ingredients'
import Recipes from './pages/Recipes'
import BentoPage from './pages/BentoPage'
import SplashScreen from './components/SplashScreen'
import './styles/theme.css'
import './styles/animations.css'

// Removed PrivateRoute component

function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Navigate to="/" replace />} />
          
          {/* Public Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="ingredients" element={<Ingredients />} />
            <Route path="recipes" element={<Recipes />} />
            <Route path="bento-maker" element={<BentoPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
