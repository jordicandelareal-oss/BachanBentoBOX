import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'

import Layout from './components/Layout'
import Home from './pages/Home'
import Ingredients from './pages/Ingredients'
import Recipes from './pages/Recipes'
import BentoPage from './pages/BentoPage'
import Preparations from './pages/Preparations'
import CatalogSettings from './pages/CatalogSettings'
import Dashboard from './pages/Dashboard'
import POS from './pages/POS'
import BusinessAnalytics from './pages/BusinessAnalytics'
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
          
          {/* Admin & POS Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="pos" element={<POS />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="admin/ventas" element={<Dashboard />} />
            <Route path="ingredients" element={<Ingredients />} />
            <Route path="analytics" element={<BusinessAnalytics />} />

            <Route path="preparations" element={<Preparations />} />
            <Route path="recipes" element={<Recipes />} />
            <Route path="bento-maker" element={<BentoPage />} />
            <Route path="settings" element={<CatalogSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
