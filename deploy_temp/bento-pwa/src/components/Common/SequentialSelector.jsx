import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Package, Utensils, Search, X, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
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
  const [globalSearch, setGlobalSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Dynamic Categories
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);

  // Debounce global search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(globalSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [globalSearch]);

  // Fetch categories when type changes
  useEffect(() => {
    if (!type) {
      setDynamicCategories([]);
      return;
    }

    async function fetchCats() {
      setLoadingCats(true);
      try {
        const table = type === 'ingredient' ? 'categories' : 'preparation_categories';
        const nameField = type === 'ingredient' ? 'name' : 'Name';
        
        const { data, error } = await supabase
          .from(table)
          .select(`id, ${nameField}`)
          .order(nameField);

        if (error) throw error;
        
        const formatted = data.map(c => ({
          id: c.id,
          name: c[nameField]
        }));
        
        if (formatted.length === 0) {
          formatted.push({ id: 'general', name: 'General' });
        }
        
        setDynamicCategories(formatted);
      } catch (err) {
        console.error('Error fetching dynamic categories:', err);
      } finally {
        setLoadingCats(false);
      }
    }

    fetchCats();
  }, [type]);

  // Reset states when type changes
  const handleTypeSelect = (selectedType) => {
    setType(selectedType);
    setCategory(null);
    setSubcategory(null);
    setStep(2);
  };

  const handleCategorySelect = (selectedCat) => {
    setCategory(selectedCat); // selectedCat is now {id, name}
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
  const categoriesLoad = dynamicCategories;

  // Get unique subcategories based on category (only for ingredients)
  const subcategoriesLoad = useMemo(() => {
    if (type !== 'ingredient' || !category) return [];
    const subs = [...new Set(
      ingredients
        .filter(ing => ing.category_id === category.id)
        .map(ing => ing.subcategory_name || 'General')
    )];
    return subs.filter(Boolean).sort();
  }, [type, category, ingredients]);

  // Filter items based on all selections (Legacy mode)
  const filteredItems = useMemo(() => {
    if (step !== 4) return [];
    const source = type === 'ingredient' ? ingredients : recipes;
    const catField = type === 'ingredient' ? 'category_name' : 'preparation_category';
    
    return source.filter(item => {
      // Prevent circular dependency
      if (item.id === excludeId && type === 'recipe') return false;
      
      const itemCatId = type === 'ingredient' ? item.category_id : item.preparation_category_Id;
      const matchesCategory = category.id === 'general' ? !itemCatId : itemCatId === category.id;
      const matchesSubcategory = type === 'recipe' || (item.subcategory_name || 'General') === subcategory;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSubcategory && matchesSearch;
    });
  }, [step, type, category, subcategory, ingredients, recipes, searchTerm, excludeId]);

  // Omnichannel mixed search for Step 1
  const mixedResults = useMemo(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) return [];
    
    const term = debouncedSearch.toLowerCase();
    
    const ingResults = ingredients
      .filter(ing => ing.name.toLowerCase().includes(term))
      .map(ing => ({ ...ing, type: 'ingredient' }));
      
    const recResults = recipes
      .filter(rec => rec.id !== excludeId && rec.name.toLowerCase().includes(term))
      .map(rec => ({ ...rec, type: 'recipe' }));
      
    return [...ingResults, ...recResults].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 15);
  }, [globalSearch, ingredients, recipes, excludeId]);

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
          {/* STEP 1: TYPE + GLOBAL SEARCH */}
          {step === 1 && (
            <div className="step-container fade-in">
              {/* OMNICHANNEL SEARCH BAR */}
              <div className="omnisearch-wrapper">
                <div className="search-box-premium">
                  <Search size={20} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Busca por nombre (ej: Pollo, Sal...)" 
                    value={globalSearch}
                    onChange={e => setGlobalSearch(e.target.value)}
                    className="omnisearch-input"
                    autoFocus
                  />
                  {globalSearch && (
                    <button className="clear-search" onClick={() => setGlobalSearch('')}>
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {globalSearch.length >= 2 ? (
                <div className="quick-results-container fade-in">
                  <p className="results-label">Resultados encontrados:</p>
                  <div className="item-selection-list">
                    {mixedResults.map(item => (
                      <button key={`${item.type}-${item.id}`} className="item-final-option" onClick={() => onSelect(item)}>
                        <div className="item-main">
                          <div className="item-icon-small">
                            {item.type === 'ingredient' ? <Package size={14} /> : <Utensils size={14} />}
                          </div>
                          <div>
                            <span className="item-name">{item.name}</span>
                            <span className="item-meta">
                              {item.type === 'ingredient' ? (item.unit_name || 'unid') : 'elaboración'}
                            </span>
                          </div>
                        </div>
                        <div className="item-value">
                           {item.type === 'ingredient' ? (
                             (() => {
                               const cost = parseFloat(item.net_cost_per_unit || item.cost_per_unit || 0);
                               const unit = (item.unit_name || '').toLowerCase();
                               const isBaseUnit = ['g', 'ml', 'kg', 'l', 'kilo', 'litro'].some(u => unit.includes(u));
                               if (isBaseUnit && cost > 0) return `${cost.toFixed(2)}€/kg·l`;
                               return `${cost.toFixed(2)}€/ud`;
                             })()
                           ) : item.cost_per_portion ? (
                             `${item.cost_per_portion.toFixed(2)}€/${item.yield_scenario === 'weight' ? 'kg·l' : 'ud'}`
                           ) : '0.00€'}
                        </div>
                      </button>
                    ))}
                    {mixedResults.length === 0 && <p className="empty-msg">No se encontraron productos o elaboraciones.</p>}
                  </div>
                </div>
              ) : (
                <>
                  <p className="step-label">O navega por categorías:</p>
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
                </>
              )}
            </div>
          )}

           {/* STEP 2: CATEGORY */}
          {step === 2 && (
            <div className="step-container fade-in">
              <p className="step-label">Paso 2: Elige categoría</p>
              <div className="selection-list">
                {loadingCats ? (
                   <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <Loader2 size={32} className="animate-spin mb-4" />
                      <p className="text-xs font-bold uppercase tracking-widest">Cargando categorías...</p>
                   </div>
                ) : categoriesLoad.length > 0 ? categoriesLoad.map(cat => (
                  <button key={cat.id} className="selection-option" onClick={() => handleCategorySelect(cat)}>
                    <span className="name">{cat.name}</span>
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
                         {type === 'ingredient' ? (item.unit_name || 'unid') : (item.yield_scenario === 'weight' ? 'peso (kg/l)' : (item.unit_name || 'unid'))}
                       </span>
                    </div>
                    <div className="item-value">
                       {type === 'ingredient' ? (
                         (() => {
                           const cost = parseFloat(item.net_cost_per_unit || item.cost_per_unit || 0);
                           const unit = (item.unit_name || '').toLowerCase();
                           const isBaseUnit = ['g', 'ml', 'kg', 'l', 'kilo', 'litro'].some(u => unit.includes(u));
                           if (isBaseUnit && cost > 0) return `${cost.toFixed(2)}€/kg·l`;
                           return `${cost.toFixed(2)}€/ud`;
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
