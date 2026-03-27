import React, { useState, useEffect } from 'react';
import { useRecipes } from '../hooks/useRecipes';
import { useBentoMaker, normalizeUnit } from '../hooks/useBentoMaker';
import { useIngredients } from '../hooks/useIngredients';
import { useUnits } from '../hooks/useUnits';
import { usePrepCategories } from '../hooks/usePrepCategories';
import { Utensils, Package, Plus, X, Save, ArrowLeft, ChevronRight, LayoutGrid, Scale, Trash2, Search, AlertCircle, ChefHat, CheckCircle2, Camera, CookingPot } from 'lucide-react';
import SequentialSelector from '../components/Common/SequentialSelector';
import PhotoSelector from '../components/Common/PhotoSelector';
import ConfirmationModal from '../components/Common/ConfirmationModal';
import Lightbox from '../components/Common/Lightbox';
import NumPad from '../components/Common/NumPad';
import { compressImage, uploadImage } from '../lib/imageUtils';
import '../styles/Common.css';
import './Ingredients.css'; 
import './Preparations.css';

export function Preparations() {
  const { recipes, loading, error, deleteRecipe, fetchRecipes } = useRecipes('elaboracion');
  const { categories: prepCats } = usePrepCategories();
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [activeTabId, setActiveTabId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [lightbox, setLightbox] = useState({ isOpen: false, imageUrl: '', title: '' });

  useEffect(() => {
    if (prepCats.length > 0 && !activeTabId) {
      setActiveTabId(prepCats[0].id);
    }
  }, [prepCats]);

  if (editingRecipe) {
    return <PreparationEditor 
      recipe={editingRecipe} 
      onClose={() => {
        setEditingRecipe(null);
        fetchRecipes();
      }} 
      prepCats={prepCats}
    />;
  }

  // SECURTY CHECK (Prioridad 911): Prevent white screen if recipes is null/undefined
  if (!recipes || !Array.isArray(recipes)) {
    return (
      <div className="page-container flex justify-center items-center h-64 text-slate-400">
        <p>Cargando datos o sin conexión...</p>
      </div>
    );
  }

  const filteredRecipes = recipes.filter(r => r.preparation_category_Id === activeTabId);
  const activeTabName = prepCats.find(c => c.id === activeTabId)?.Name || '...';

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const result = await deleteRecipe(confirmDelete);
    if (!result.success) {
      alert('Error al eliminar: ' + result.error);
    }
    setConfirmDelete(null);
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Elaboraciones</h1>
          <p className="page-subtitle">Gestiona la mise en place y recetas base</p>
        </div>
        <button className="btn-icon-main" onClick={() => setEditingRecipe({ name: '', portions: 1, items: [], preparation_category_Id: activeTabId })}>
          <Plus size={24} />
        </button>
      </div>

      <div className="category-tabs-wrapper">
        <div className="category-tabs">
          {(prepCats || []).map(cat => (
            <button 
              key={cat?.id || Math.random()} 
              className={`category-tab ${activeTabId === cat?.id ? 'active' : ''}`}
              onClick={() => setActiveTabId(cat?.id)}
            >
              {cat?.Name || 'Sin Nombre'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="premium-card animate-pulse" style={{ height: '80px', opacity: 0.5 }}></div>
          ))}
        </div>
      ) : (
        <div className="card-grid">
          {(filteredRecipes || []).map(recipe => (
            <div key={recipe?.id || Math.random()} className="premium-card" onClick={() => setEditingRecipe(recipe)}>
              <div className="ingredient-info">
                <div className="card-icon-wrapper">
                  <CookingPot size={20} />
                </div>
                <div>
                  <h3 className="card-title">{recipe?.name || 'Receta sin nombre'}</h3>
                  <p className="card-meta">
                    RINDE: {recipe?.yield_scenario === 'weight' 
                      ? (recipe.net_yield >= 1000 ? `${(recipe.net_yield / 1000).toFixed(2)} Kg` : `${recipe.net_yield || 0} g`)
                      : `${recipe?.portions || 0} ${recipe?.unit_name || 'ud'}`
                    }
                    {(recipe?.platos_estimados > 0) && ` | 🍽️ ${recipe?.platos_estimados} platos`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="card-meta" style={{ fontSize: '10px' }}>
                    {recipe?.yield_scenario === 'weight' ? 'Coste/Kg' : 'Coste/Uni.'}
                  </div>
                  <div className="price-display">
                    {recipe?.cost_per_portion ? `${Number(recipe.cost_per_portion).toFixed(2)}€` : '0.00€'}
                  </div>
                </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      className="delete-btn-subtle"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(recipe?.id);
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                    {recipe?.image_url && (
                      <button 
                        className="p-2 text-sky-500 hover:bg-sky-50 rounded-full transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightbox({ isOpen: true, imageUrl: recipe.image_url, title: recipe.name });
                        }}
                      >
                        <Camera size={20} />
                      </button>
                    )}
                  </div>
                <ChevronRight size={18} className="text-slate-300" />
              </div>
            </div>
          ))}

          {(!filteredRecipes || filteredRecipes.length === 0) && (
            <div className="text-center py-12" style={{ textAlign: 'center', padding: '48px 0' }}>
              <CookingPot className="mx-auto text-slate-200 mb-4" size={48} style={{ margin: '0 auto 16px', color: '#e2e8f0' }} />
              <p style={{ color: '#94a3b8' }}>No hay elaboraciones en {activeTabName}</p>
            </div>
          )}
        </div>
      )}
      <ConfirmationModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="¿Eliminar elaboración?"
        message="Esta acción no se puede deshacer y eliminará permanentemente la receta y sus costos asociados."
      />
      <Lightbox 
        isOpen={lightbox.isOpen}
        imageUrl={lightbox.imageUrl}
        title={lightbox.title}
        onClose={() => setLightbox({ ...lightbox, isOpen: false })}
      />
    </div>
  );
}

function PreparationEditor({ recipe, onClose, prepCats }) {
  const { 
    bentoName, setBentoName, 
    portions, setPortions,
    unitId, setUnitId,
    prepCategoryId, setPrepCategoryId,
    platosEstimados, setPlatosEstimados,
    items, setItems,
    yieldScenario, setYieldScenario,
    adjustmentPercent, setAdjustmentPercent,
    netYield, setNetYield,
    addItem, updateItemQuantity, removeItem,
    totals, saveBento, loadRecipeItems,
    imageUrl, setImageUrl
  } = useBentoMaker(recipe, 'elaboracion');
  
  const { units } = useUnits();
  const { ingredients } = useIngredients();
  const { recipes } = useRecipes('elaboracion');
  const [isSaving, setIsSaving] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [internalSearch, setInternalSearch] = useState('');
  const [expandedItem, setExpandedItem] = useState(null);
  // NumPad state: { field: 'portions'|'platos'|key_of_item, label: string }
  const [numPad, setNumPad] = useState(null);

  const openNumPad = (field, label) => setNumPad({ field, label });
  const closeNumPad = () => setNumPad(null);

  const handleUpload = async (file) => {
    try {
      const compressed = await compressImage(file);
      const url = await uploadImage(compressed, 'images', 'plating');
      setImageUrl(url);
    } catch (err) {
      alert('Error al subir foto: ' + err.message);
    }
  };

  const handleRemoveImage = () => setImageUrl('');

  const handleNumPadChange = (val) => {
    if (!numPad) return;
    if (numPad.field === 'portions') {
      setPortions(val === '' ? '' : Number(val));
    } else if (numPad.field === 'platos') {
      setPlatosEstimados(val === '' ? 0 : Number(val));
    } else {
      // ingredient quantity
      updateItemQuantity(numPad.field, val);
    }
  };

  const getNumPadValue = () => {
    if (!numPad) return '0';
    if (numPad.field === 'portions') return String(portions || '');
    if (numPad.field === 'platos') return String(platosEstimados || '');
    const item = items.find(i => i._key === numPad.field);
    return String(item?.quantity || '');
  };

  useEffect(() => {
    if (recipe.id) loadRecipeItems(recipe.id);
  }, [recipe.id]);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(internalSearch.toLowerCase())
  );

  const handleSelectComponent = (item) => {
    // For ingredients: use the unit from DB (unit_name); never assume 'ud' if it's a weight unit
    // For sub-recipes: if weight scenario → 'g', else 'ud'
    let normalized;
    let baseCost = 0;

    if (item.type === 'ingredient') {
      // Inherit unit from the ingredient's own unit_name field
      normalized = normalizeUnit(item.unit_name || 'g');
      // Prioritize net_cost_per_unit (which includes waste) over cost_per_unit
      baseCost = parseFloat(item.net_cost_per_unit || item.cost_per_unit || 0);
    } else {
      // Sub-elaboration: if it yields by weight, cost is already €/Kg → convert to €/g
      const recipeCost = parseFloat(item.cost_per_portion || 0);
      if (item.yield_scenario === 'weight') {
        normalized = 'g';
        baseCost = recipeCost / 1000; // €/Kg → €/g
      } else {
        normalized = 'ud';
        baseCost = recipeCost;
      }
    }

    addItem({
      type: item.type,
      id: item.id,
      name: item.name,
      costPerUnit: baseCost,
      unit: normalized,
      quantity: '',
      category_name: item.category_name || item.preparation_category || 'General'
    });
    setShowSelector(false);
  };

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    if (!bentoName) return alert("Indica un nombre");
    setIsSaving(true);
    try {
      await saveBento();
      setIsSaving(false);
      setIsSaved(true);
      // Feedback visible during 1.5 seconds, then close
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      alert("Error al guardar: " + err.message);
      setIsSaving(false);
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="flex justify-between items-center mb-8">
        <button onClick={onClose} className="premium-ghost-btn">
          <ArrowLeft size={18} />
          <span>Volver al listado</span>
        </button>
      </div>

      <div className="preparations-editor-layout">
        {/* PANEL IZQUIERDO: DATOS GENERALES */}
          <div className="editor-left-panel space-y-6">
            <div className="premium-form-card">
              <div className="flex gap-4 items-start mb-8">
                <div className="flex-1">
                  <h3 className="section-title" style={{ fontFamily: 'var(--font-serif)' }}>Datos Generales</h3>
                </div>
                <div className="w-24 h-24">
                  <PhotoSelector 
                    imageUrl={imageUrl}
                    onUpload={handleUpload}
                    onRemove={handleRemoveImage}
                    isCircular={false}
                    placeholder="Sube foto"
                  />
                </div>
              </div>
              
              <div className="form-group mb-4">
                <label className="form-label">Nombre de la elaboración <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  value={bentoName} 
                  onChange={e => setBentoName(e.target.value)}
                  className="form-input-premium"
                  placeholder="Ej: Salsa Teriyaki..."
                />
              </div>
              
              <div className="form-group mb-6">
                <label className="form-label">Categoría de Mise en Place <span className="text-rose-500">*</span></label>
                <select 
                  value={prepCategoryId}
                  onChange={e => setPrepCategoryId(e.target.value)}
                  className="form-input-premium form-select-premium"
                >
                  <option value="">Selecciona categoría...</option>
                  {prepCats.map(cat => <option key={cat.id} value={cat.id}>{cat.Name}</option>)}
                </select>
              </div>

              {/* ESCENARIO DE SALIDA - BACK TO LEFT */}
              <div className="form-group mb-6">
                <label className="form-label">Escenario de Salida</label>
                <div className="segmented-control">
                  <button 
                    className={`segment-btn ${yieldScenario === 'weight' ? 'active' : ''}`}
                    onClick={() => setYieldScenario('weight')}
                  >
                    <div className="icon-bg">
                      <Scale size={18} />
                    </div>
                    <span className="segment-label">Peso (Kg/L)</span>
                  </button>
                  <button 
                    className={`segment-btn ${yieldScenario === 'units' ? 'active' : ''}`}
                    onClick={() => setYieldScenario('units')}
                  >
                    <div className="icon-bg">
                      <Package size={18} />
                    </div>
                    <span className="segment-label">Unidades (Pzs)</span>
                  </button>
                </div>
              </div>

              {yieldScenario === 'weight' && (
                <div className="space-y-4 mb-6 p-4 bg-sky-50/50 rounded-2xl border border-sky-100/50 scale-in">
                  <div className="form-group">
                    <span className="form-label uppercase text-[10px] opacity-60">Peso Bruto (Suma)</span>
                    <div className="read-only-value">
                      {totals.totalGrossWeight} g
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label flex justify-between">
                      <span>% Merma / Cocción</span>
                      <span className={adjustmentPercent < 0 ? 'text-rose-500' : 'text-emerald-500'} style={{ fontWeight: 900 }}>
                        {adjustmentPercent > 0 ? '+' : ''}{adjustmentPercent}%
                      </span>
                    </label>
                    <input 
                      type="range"
                      min="-50"
                      max="100"
                      step="5"
                      value={adjustmentPercent}
                      onChange={e => setAdjustmentPercent(Number(e.target.value))}
                      className="w-full accent-navy"
                      style={{ height: '4px' }}
                    />
                    <div className="flex justify-between text-[8px] font-bold text-slate-400 mt-1 uppercase">
                      <span>Merma (-50%)</span>
                      <span>Hidratación (+100%)</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-sky-100">
                    <span className="text-[10px] font-bold text-sky-600 uppercase">Peso Neto Final</span>
                    <span className="text-lg font-black text-sky-700">{(totals.finalNetYield / 1000).toFixed(2)} Kg/L</span>
                  </div>
                </div>
              )}

              {yieldScenario === 'units' && (
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 scale-in">
                  <div className="form-group">
                    <label className="form-label">Rendimiento (Piezas)</label>
                    <input 
                      type="number" 
                      value={portions || ''} 
                      onChange={e => setPortions(e.target.value === '' ? '' : Number(e.target.value))}
                      className="form-input-premium"
                      placeholder="Cant. piezas"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unidad</label>
                    <select
                      value={unitId}
                      onChange={e => setUnitId(e.target.value)}
                      className="form-input-premium form-select-premium"
                    >
                      <option value="">Unidad...</option>
                      {units.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* COST SUMMARY - ALWAYS AT END OF LEFT */}
              <div className="mt-10 pt-8 border-t border-slate-100">
                <div className="cost-summary-card">
                  <div className="cost-item primary">
                    <span className="label">Coste por {yieldScenario === 'weight' ? 'KG' : 'Ración'}</span>
                    <span className={`value ${totals.costPerPortion > 500 ? 'text-rose-600' : ''}`}>
                      {totals.costPerPortion.toFixed(2)} €
                    </span>
                  </div>
                  {totals.costPerPortion > 500 && (
                    <div className="warning-banner">
                      <AlertCircle size={18} />
                      <span>Revisar cantidades: Coste excesivo</span>
                    </div>
                  )}
                  <div className="cost-item secondary">
                    <span className="label">Coste Total de Receta</span>
                    <span className="value">{totals.totalCost.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* Desktop Save Button */}
              <div className="hidden md:block mt-8">
                <button 
                  disabled={isSaving || isSaved || !bentoName || !prepCategoryId || items.length === 0 || totals.costPerPortion > 500}
                  onClick={handleSave}
                  className={`btn-primary w-full py-4 text-lg ${isSaved ? 'bg-emerald-500' : ''}`}
                  style={{ borderRadius: '16px', fontFamily: 'var(--font-serif)', backgroundColor: totals.costPerPortion > 500 ? '#fca5a5' : undefined }}
                >
                  {isSaving ? 'Guardando...' : isSaved ? <><CheckCircle2 size={20} />  Guardado con éxito</> : <><Save size={20} /> Guardar Elaboración</>}
                </button>
              </div>
            </div>
          </div>

        {/* PANEL DERECHO: PLATOS Y COMPONENTES */}
        <div className="editor-right-panel">
          {/* PLATOS SUGERIDOS - PREMIUM STYLE ON RIGHT */}
          <div className="form-group mb-6">
            <label className="form-label flex items-center gap-2">
              <ChefHat size={14} className="text-slate-400" /> platos sugeridos (Ref.)
            </label>
            <div 
              className="flex items-center gap-4 p-4 bg-amber-50/50 rounded-2xl border border-amber-100 shadow-sm cursor-pointer"
              onClick={() => openNumPad('platos', 'Platos Sugeridos')}
            >
              <div className="icon-bg-amber">
                <Utensils size={18} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-black text-amber-600 uppercase block mb-1">Rinde para:</span>
                <div className="font-black text-navy text-xl">{platosEstimados || '0'}</div>
              </div>
              <span className="text-xs font-black text-amber-600 uppercase">platos</span>
            </div>
            <p className="text-[9px] text-slate-400 mt-2 italic px-1 opacity-60">
              * Este valor es informativo y no afecta a los costes calculados.
            </p>
          </div>
          <div className="section-header flex justify-between items-center mb-4">
            <h3 className="section-title">
              <Package size={20} className="text-sky-500" /> Ingredientes
            </h3>
            <button className="btn-primary" onClick={() => setShowSelector(true)} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
              <Plus size={16} /> Añadir
            </button>
          </div>

          <div className="internal-search">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Filtrar ingredientes en esta receta..." 
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.target.value)}
            />
          </div>

          <div className="ingredients-scroll-area">
            {filteredItems.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-200">
                 <Scale className="mx-auto text-slate-100 mb-2" size={48} />
                 <p className="text-slate-400 text-sm italic">
                   {internalSearch ? "No se encontraron coincidencias" : "Define los ingredientes de esta receta"}
                 </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map(item => (
                  <div key={item._key} className="mini-card compact">
                    <div 
                      className="mini-card-header" 
                      onClick={() => setExpandedItem(expandedItem === item._key ? null : item._key)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="mini-icon-box">
                          {item.type === 'ingredient' ? <Package size={14} /> : <Utensils size={14} />}
                        </div>
                        <div>
                          <span className="mini-card-title">{item.name}</span>
                          <div className="flex gap-2 items-center">
                            <span className="text-[10px] text-slate-400 font-bold">{item.quantity} {item.unit}</span>
                            <span className="text-[10px] text-slate-300">·</span>
                            <span className="text-[10px] text-navy font-black">{(item.costPerUnit * item.quantity).toFixed(2)}€</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight 
                        size={16} 
                        className={`text-slate-300 transition-transform ${expandedItem === item._key ? 'rotate-90' : ''}`} 
                      />
                    </div>
                    
                    {expandedItem === item._key && (
                      <div className="mini-card-details fade-in">
                        {/* Tap-to-edit quantity -> opens NumPad */}
                        <div 
                          className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer"
                          onClick={() => {
                            openNumPad(item._key, `${item.name} (${item.unit})`);
                          }}
                        >
                          <span className="w-16 text-right text-sm font-black text-navy">{item.quantity}</span>
                          <span className="text-[10px] font-black text-slate-400 px-2 uppercase">{item.unit}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="text-[10px] text-slate-400 font-bold mr-2">
                            {(item.unit === 'g' || item.unit === 'ml') 
                              ? `${(item.costPerUnit * 1000).toFixed(2)}€/kg` 
                              : `${item.costPerUnit.toFixed(2)}€/ud`}
                          </div>
                          <button 
                            onClick={() => removeItem(item._key)} 
                            className="delete-btn-subtle opacity-100"
                            style={{ padding: '6px' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER ACCIÓN FLOTANTE (MÓVIL) */}
      <div className="floating-save-container md:hidden" style={{ bottom: numPad ? '340px' : '32px', transition: 'bottom 0.3s ease' }}>
        <button 
          disabled={isSaving || isSaved || !bentoName || !prepCategoryId || items.length === 0 || totals.costPerPortion > 500}
          onClick={handleSave}
          className={`floating-save-btn ${isSaved ? 'saved' : ''}`}
          style={{ backgroundColor: isSaved ? '#10b981' : totals.costPerPortion > 500 ? '#fca5a5' : undefined }}
        >
          {isSaving ? 'Guardando...' : isSaved ? <><CheckCircle2 size={20} />  Guardado</> : <><Save size={20} /> Guardar Elaboración</>}
        </button>
      </div>

      {/* CUSTOM NUMPAD */}
      {numPad && (
        <NumPad
          value={getNumPadValue()}
          onChange={handleNumPadChange}
          onClose={closeNumPad}
          label={numPad.label}
        />
      )}

      {showSelector && (
        <SequentialSelector 
          ingredients={ingredients}
          recipes={recipes}
          excludeId={recipe.id}
          onSelect={handleSelectComponent}
          onClose={() => setShowSelector(false)}
        />
      )}
    </div>
  );
}

export default Preparations;
