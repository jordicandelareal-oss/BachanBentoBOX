import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Package, Utensils, Search, X, ArrowLeft } from 'lucide-react';
import './SequentialSelector.css';

/**
 * Selector secuencial en 4 pasos:
 * 1. Tipo (Insumo / Elaboración)
 * 2. Categoría (Despensa / Proteína / etc vs Cocina)
 * 3. Subcategoría (Solo para Insumos: Aceites, Sales, etc)
 * 4. Ítem final
 */
export default function SequentialSelector({ ingredients, recipes, onSelect, onClose, excludeId }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState(null); // 'ingredient' | 'recipe'
  const [category, setCategory] = useState(null);
  const [subcategory, setSubcategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Reset states when type changes
  const handleTypeSelect = (selectedType) => {
    setType(selectedType);
    setCategory(null);
    setSubcategory(null);
    setStep(2);
  };

  const handleCategorySelect = (selectedCat) => {
    setCategory(selectedCat);
    setSubcategory(null);
    // If it's a recipe, we skip subcategories (step 3) and go straight to items (step 4)
    if (type === 'recipe') {
      setStep(4);
    } else {
      setStep(3);
    }
  };

  const handleSubcategorySelect = (selectedSub) => {
    setSubcategory(selectedSub);
    setStep(4);
  };

  // Get unique categories based on type
  const categoriesLoad = useMemo(() => {
    if (!type) return [];
    const source = type === 'ingredient' ? ingredients : recipes;
    // Ingredients use category_name, recipes use preparation_category
    const catField = type === 'ingredient' ? 'category_name' : 'preparation_category';
    const cats = [...new Set(source.map(item => item[catField] || 'General'))];
    return cats.filter(Boolean).sort();
  }, [type, ingredients, recipes]);

  // Get unique subcategories based on category (only for ingredients)
  const subcategoriesLoad = useMemo(() => {
    if (type !== 'ingredient' || !category) return [];
    const subs = [...new Set(
      ingredients
        .filter(ing => ing.category_name === category)
        .map(ing => ing.subcategory_name || 'General')
    )];
    return subs.filter(Boolean).sort();
  }, [type, category, ingredients]);

  // Filter items based on all selections
  const filteredItems = useMemo(() => {
    if (step !== 4) return [];
    const source = type === 'ingredient' ? ingredients : recipes;
    const catField = type === 'ingredient' ? 'category_name' : 'preparation_category';
    
    return source.filter(item => {
      // Prevent circular dependency (don't show the same recipe if we are editing it)
      if (item.id === excludeId && type === 'recipe') return false;
      
      const matchesCategory = item[catField] === category;
      const matchesSubcategory = type === 'recipe' || (item.subcategory_name || 'General') === subcategory;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSubcategory && matchesSearch;
    });
  }, [step, type, category, subcategory, ingredients, recipes, searchTerm]);

  const goBack = () => {
    if (step === 4) {
      if (type === 'recipe') setStep(2);
      else setStep(3);
    } else if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
    }
  };

  return (
    <div className="sequential-selector-overlay" onClick={onClose}>
      <div className="sequential-selector-card" onClick={e => e.stopPropagation()}>
        <div className="selector-header">
          <div className="flex items-center gap-3">
             {step > 1 && (
               <button className="back-button" onClick={goBack}>
                 <ArrowLeft size={18} />
               </button>
             )}
             <h3>Añadir Componente</h3>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="selector-progress">
          <div className={`progress-dot ${step >= 1 ? 'active' : ''}`} onClick={() => setStep(1)}>1</div>
          <div className="progress-line"></div>
          <div className={`progress-dot ${step >= 2 ? 'active' : ''}`} onClick={() => step > 2 ? setStep(2) : null}>2</div>
          <div className="progress-line"></div>
          <div className={`progress-dot ${step >= 3 ? 'active' : ''}`} onClick={() => {
            if (type === 'ingredient' && step > 3) setStep(3);
          }}>3</div>
          <div className="progress-line"></div>
          <div className={`progress-dot ${step === 4 ? 'active' : ''}`}>4</div>
        </div>

        <div className="selector-content">
          {/* STEP 1: TYPE */}
          {step === 1 && (
            <div className="step-container fade-in">
              <p className="step-label">Paso 1: ¿Qué vas a añadir?</p>
              <div className="type-grid">
                <button className="type-option" onClick={() => handleTypeSelect('ingredient')}>
                  <div className="option-icon"><Package size={24} /></div>
                  <div className="option-text">
                    <span className="title">Insumo</span>
                    <span className="desc">Producto de compra directa</span>
                  </div>
                  <ChevronRight size={18} className="arrow" />
                </button>
                <button className="type-option" onClick={() => handleTypeSelect('recipe')}>
                  <div className="option-icon"><Utensils size={24} /></div>
                  <div className="option-text">
                    <span className="title">Elaboración</span>
                    <span className="desc">Base preparada en cocina</span>
                  </div>
                  <ChevronRight size={18} className="arrow" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CATEGORY */}
          {step === 2 && (
            <div className="step-container fade-in">
              <p className="step-label">Paso 2: Elige categoría</p>
              <div className="selection-list">
                {categoriesLoad.length > 0 ? categoriesLoad.map(cat => (
                  <button key={cat} className="selection-option" onClick={() => handleCategorySelect(cat)}>
                    <span className="name">{cat}</span>
                    <ChevronRight size={18} className="arrow" />
                  </button>
                )) : (
                  <p className="empty-msg">No hay categorías disponibles.</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: SUBCATEGORY (Ingredients only) */}
          {step === 3 && (
            <div className="step-container fade-in">
              <p className="step-label">Paso 3: Elige subcategoría</p>
              <div className="selection-list">
                {subcategoriesLoad.length > 0 ? subcategoriesLoad.map(sub => (
                  <button key={sub} className="selection-option" onClick={() => handleSubcategorySelect(sub)}>
                    <span className="name">{sub}</span>
                    <ChevronRight size={18} className="arrow" />
                  </button>
                )) : (
                  <p className="empty-msg">No hay subcategorías disponibles.</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: ITEM */}
          {step === 4 && (
            <div className="step-container fade-in">
              <p className="step-label">Paso 4: Selecciona el ítem</p>
              
              <div className="search-box-wrapper">
                <Search size={18} className="search-icon" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Buscar por nombre..." 
                  className="search-input-field"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="item-selection-list">
                {filteredItems.map(item => (
                  <button key={item.id} className="item-final-option" onClick={() => onSelect({ ...item, type })}>
                    <div className="item-main">
                       <span className="item-name">{item.name}</span>
                       <span className="item-meta">
                         {type === 'ingredient' ? (item.unit_name || 'unid') : 'elaboración'}
                       </span>
                    </div>
                    <div className="item-value">
                       {type === 'ingredient' ? (
                         (() => {
                           const cost = parseFloat(item.net_cost_per_unit || item.cost_per_unit || 0);
                           const unit = (item.unit_name || '').toLowerCase();
                           const isBaseUnit = ['g', 'ml', 'kg', 'l', 'kilo', 'litro'].some(u => unit.includes(u));
                           if (isBaseUnit && cost > 0) return `${(cost * 1000).toFixed(2)}€/kg·l`;
                           return `${cost.toFixed(2)}€`;
                         })()
                       ) : item.cost_per_portion ? (
                         `${item.cost_per_portion.toFixed(2)}€`
                       ) : '0.00€'}
                    </div>
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
