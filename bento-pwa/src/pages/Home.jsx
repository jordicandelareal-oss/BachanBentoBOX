import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart2, 
  Package, 
  Camera, 
  Search, 
  ChevronRight 
} from 'lucide-react';
import { useIngredients } from '../hooks/useIngredients';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { ingredients, loading } = useIngredients();

  const totalInsumos = ingredients?.length || 0;

  return (
    <div className="home-container fade-in">
      <div className="hero-section">
        <img src="/logo-bachan.png" alt="BaChan Logo" className="hero-logo" />
      </div>

      <div className="premium-card" onClick={() => navigate('/ingredients')}>
        <div className="premium-card-header">
          <div className="premium-icon-circle">
            <BarChart2 size={16} color="var(--color-brand)" />
          </div>
          <span className="premium-card-title">DETALLES DE RENTABILIDAD</span>
        </div>
        
        <div className="premium-stats-grid">
          <div className="premium-stat-item">
            <span className="premium-stat-value">{loading ? '...' : totalInsumos}</span>
            <span className="premium-stat-label">INSUMOS</span>
          </div>
          <div className="premium-stat-divider" />
          <div className="premium-stat-item">
            <span className="premium-stat-value">68%</span>
            <span className="premium-stat-label">MARGEN MEDIO</span>
          </div>
        </div>
      </div>

      <div className="actions-grid">
        <button className="action-card" onClick={() => navigate('/ingredients')}>
          <div className="action-left">
            <div className="icon-circle brand-bg">
              <Package size={20} color="var(--color-brand)" />
            </div>
            <span className="action-text">Gestionar Insumos</span>
          </div>
          <ChevronRight size={18} color="#ccc" />
        </button>

        <button className="action-card" onClick={() => navigate('/bento-maker')}>
          <div className="action-left">
            <div className="icon-circle accent-bg">
              <Camera size={20} color="var(--color-accent)" />
            </div>
            <span className="action-text">Bento Maker</span>
          </div>
          <ChevronRight size={18} color="#ccc" />
        </button>

        <button className="action-card" onClick={() => navigate('/recipes')}>
          <div className="action-left">
            <div className="icon-circle brown-bg">
              <Search size={20} color="var(--color-bachan-brown)" />
            </div>
            <span className="action-text">Buscar Receta</span>
          </div>
          <ChevronRight size={18} color="#ccc" />
        </button>
      </div>

      <div className="info-box">
        <p className="info-text">
          Prueba a decir: "BACHAN, ¿a cuánto está el salmón?" o "El arroz ha subido a 2.50€".
        </p>
      </div>
    </div>
  );
}
