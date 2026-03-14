import React, { useState, useEffect } from 'react';
import { ChevronRight, Package, Utensils, Search, X } from 'lucide-react';
import './SequentialSelector.css';

/**
 * Selector secuencial en 3 pasos:
 * 1. Tipo (Insumo / Elaboración)
 * 2. Categoría (Compra / Cocina)
 * 3. Ítem final
 */
export default function SequentialSelector({ ingredients, recipes, onSelect, onClose }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState(null); // 'ingredient' | 'recipe'
  const [category, setCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Reset steps if type changes (not likely here as it's sequential but good practice)
  const handleTypeSelect = (selectedType) => {
    setType(selectedType);
    setCategory(null);
    setStep(2);
  };

  const handleCategorySelect = (selectedCat) => {
    setCategory(selectedCat);
    setStep(3);
  };

  // Get unique categories based on type
  const categories = React.useMemo(() => {
    if (!type) return [];
    const source = type === 'ingredient' ? ingredients : recipes;
    // Ingredients use category_name (from JOIN), recipes use preparation_category
    const catField = type === 'ingredient' ? 'category_name' : 'preparation_category';
    const cats = [...new Set(source.map(item => item[catField]).filter(Boolean))];
    return cats.sort();
  }, [type, ingredients, recipes]);

  // Filter items based on type and category
  const filteredItems = React.useMemo(() => {
    if (step !== 3) return [];
    const source = type === 'ingredient' ? ingredients : recipes;
    // Ingredients use category_name (from JOIN), recipes use preparation_category
    const catField = type === 'ingredient' ? 'category_name' : 'preparation_category';
    
    return source.filter(item => 
      item[catField] === category && 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [step, type, category, ingredients, recipes, searchTerm]);

  return (
    <div className="sequential-selector-overlay" onClick={onClose}>
      <div className="sequential-selector-card" onClick={e => e.stopPropagation()}>
        <div className="selector-header">
          <h3>Añadir Ingrediente</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="selector-progress">
          <div className={`progress-dot ${step >= 1 ? 'active' : ''}`} onClick={() => setStep(1)}>1</div>
          <div className="progress-line"></div>
          <div className={`progress-dot ${step >= 2 ? 'active' : ''}`} onClick={() => step > 2 ? setStep(2) : null}>2</div>
          <div className="progress-line"></div>
          <div className={`progress-dot ${step === 3 ? 'active' : ''}`}>3</div>
        </div>

        <div className="selector-content">
          {step === 1 && (
            <div className="step-container fade-in">
              <p className="step-label">Paso 1: ¿Qué vas a añadir?</p>
              <div className="type-grid">
                <button className="type-option" onClick={() => handleTypeSelect('ingredient')}>
                  <Package size={24} />
                  <span>Ingrediente</span>
                  <p>Productos de compra directa</p>
                </button>
                <button className="type-option" onClick={() => handleTypeSelect('recipe')}>
                  <Utensils size={24} />
                  <span>Elaboración</span>
                  <p>Bases preparadas en cocina</p>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-container fade-in">
              <button className="back-link" onClick={() => setStep(1)}>← Cambiar tipo</button>
              <p className="step-label">Paso 2: Elige categoría ({type === 'ingredient' ? 'Compra' : 'Cocina'})</p>
              <div className="category-list">
                {categories.length > 0 ? categories.map(cat => (
                  <button key={cat} className="category-option" onClick={() => handleCategorySelect(cat)}>
                    {cat}
                    <ChevronRight size={16} />
                  </button>
                )) : (
                  <p className="empty-msg">No hay categorías configuradas para este tipo.</p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-container fade-in">
              <button className="back-link" onClick={() => setStep(2)}>← Cambiar categoría</button>
              <p className="step-label">Paso 3: Selecciona el ítem</p>
              
              <div className="search-box">
                <Search size={16} />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Buscar..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="item-list">
                {filteredItems.map(item => (
                  <button key={item.id} className="item-option" onClick={() => onSelect({ ...item, type })}>
                    <span className="item-name">{item.name}</span>
                    <span className="item-price">
                       {item.net_cost_per_unit ? `${(item.net_cost_per_unit * 1000).toFixed(2)}€/kg` : 
                        item.cost_per_portion ? `${item.cost_per_portion.toFixed(2)}€/rac` : '0.00€'}
                    </span>
                  </button>
                ))}
                {filteredItems.length === 0 && <p className="empty-msg">No se encontraron resultados</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
