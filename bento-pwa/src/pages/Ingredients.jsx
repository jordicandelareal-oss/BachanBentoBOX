import React, { useState } from 'react';
import { useIngredients } from '../hooks/useIngredients';
import { Package, Search, Edit2, Plus, AlertCircle, Loader2 } from 'lucide-react';
import './Ingredients.css';

export default function Ingredients() {
  const { ingredients, loading, error, updatePrice } = useIngredients();
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const filteredIngredients = ingredients.filter(ing => 
    ing.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="ingredients-container">
        <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-xl border border-red-100 m-4">
          <AlertCircle className="text-red-500 mb-2" size={32} />
          <h3 className="text-red-800 font-bold">Error de Conexión</h3>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ingredients-container fade-in">
      <div className="ingredients-header">
        <div>
          <h1>Insumos</h1>
          <p className="text-slate-500 text-sm">Gestiona tus ingredientes y precios base</p>
        </div>
        <button className="btn-add-main">
          <Plus size={24} />
        </button>
      </div>

      <div className="search-wrapper">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ left: '16px', top: '50%', position: 'absolute', transform: 'translateY(-50%)' }} size={18} />
        <input 
          type="text" 
          placeholder="Buscar ingrediente..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && !ingredients.length ? (
        <div className="ingredients-grid">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" style={{ height: '80px', background: '#f1f5f9', borderRadius: '16px' }} />
          ))}
        </div>
      ) : (
        <div className="ingredients-grid">
          {filteredIngredients.map(ingredient => (
            <div key={ingredient.id} className="ingredient-card">
              <div className="ingredient-info">
                <div className="ingredient-icon">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="ingredient-name">{ingredient.name}</h3>
                  <p className="ingredient-unit">{ingredient.unit_id || 'unid'}</p>
                </div>
              </div>
              
              <div className="ingredient-price-area">
                <div className="ingredient-price">
                  {ingredient.purchase_price ? `${ingredient.purchase_price.toFixed(2)}€` : '0.00€'}
                </div>
                <button 
                  className="btn-edit-price"
                  onClick={() => handleEditPrice(ingredient)}
                  disabled={updatingId === ingredient.id}
                >
                  {updatingId === ingredient.id ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Edit2 size={10} />
                  )}
                  {updatingId === ingredient.id ? 'Guardando...' : 'Editar Precio'}
                </button>
              </div>
            </div>
          ))}

          {!loading && filteredIngredients.length === 0 && (
            <div className="text-center py-12" style={{ textAlign: 'center', padding: '48px 0' }}>
              <Package className="mx-auto text-slate-200 mb-4" size={48} style={{ margin: '0 auto 16px', color: '#e2e8f0' }} />
              <p style={{ color: '#94a3b8' }}>No se encontraron insumos</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
