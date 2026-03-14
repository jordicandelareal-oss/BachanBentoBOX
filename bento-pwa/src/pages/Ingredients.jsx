import React, { useState } from 'react';
import { useIngredients } from '../hooks/useIngredients';
import { Package, Search, Edit2, Plus, AlertCircle, Loader2, ChevronRight, LayoutGrid } from 'lucide-react';
import '../styles/Common.css';
import './Ingredients.css';

export default function Ingredients() {
  const { ingredients, loading, error, updatePrice } = useIngredients();
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Todos');

  // Unique categories from the JOIN with the categories table
  const categories = ['Todos', ...new Set(ingredients.map(ing => ing.category_name).filter(Boolean))].sort((a, b) => a === 'Todos' ? -1 : a.localeCompare(b));

  const filteredIngredients = ingredients.filter(ing => {
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || ing.category_name === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEditPrice = async (ingredient) => {
    const newPriceStr = prompt(`Actualizar precio para ${ingredient.name}:`, ingredient.purchase_price);
    if (newPriceStr === null) return;
    
    const newPrice = parseFloat(newPriceStr);
    if (isNaN(newPrice)) {
      alert("Por favor, introduce un número válido.");
      return;
    }

    setUpdatingId(ingredient.id);
    const result = await updatePrice(ingredient.id, newPrice);
    setUpdatingId(null);

    if (!result.success) {
      alert("Error al actualizar: " + result.error);
    }
  };

  if (error) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-xl border border-red-100 m-4">
          <AlertCircle className="text-red-500 mb-2" size={32} />
          <h3 className="text-red-800 font-bold">Error de Conexión</h3>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Insumos</h1>
          <p className="page-subtitle">Gestiona tus ingredientes y precios base de compra</p>
        </div>
        <button className="btn-icon-main">
          <Plus size={24} />
        </button>
      </div>

      <div className="search-wrapper mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ left: '16px', top: '50%', position: 'absolute', transform: 'translateY(-50%)' }} size={18} />
        <input 
          type="text" 
          placeholder="Buscar ingrediente..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="category-tabs-wrapper">
        <div className="category-tabs">
          {categories.map(cat => (
            <button 
              key={cat || 'null'} 
              className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading && !ingredients.length ? (
        <div className="card-grid">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" style={{ height: '80px', background: '#f1f5f9', borderRadius: '16px' }} />
          ))}
        </div>
      ) : (
        <div className="card-grid">
          {filteredIngredients.map(ingredient => (
            <div key={ingredient.id} className="premium-card" onClick={() => handleEditPrice(ingredient)}>
              <div className="ingredient-info">
                <div className="card-icon-wrapper">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="card-title">{ingredient.name}</h3>
                  <p className="card-meta">
                    {ingredient.unit_name || 'unid'} · {ingredient.category_name || 'Sin categoría'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="card-meta" style={{ fontSize: '10px' }}>Precio Compra</div>
                  <div className="price-display">
                    {ingredient.purchase_price ? `${ingredient.purchase_price.toFixed(2)}€` : '0.00€'}
                  </div>
                </div>
                {updatingId === ingredient.id ? (
                    <Loader2 size={18} className="animate-spin text-slate-400" />
                  ) : (
                    <ChevronRight size={18} className="text-slate-300" />
                )}
              </div>
            </div>
          ))}

          {!loading && filteredIngredients.length === 0 && (
            <div className="text-center py-12" style={{ textAlign: 'center', padding: '48px 0' }}>
              <LayoutGrid className="mx-auto text-slate-200 mb-4" size={48} style={{ margin: '0 auto 16px', color: '#e2e8f0' }} />
              <p style={{ color: '#94a3b8' }}>No se encontraron insumos</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
