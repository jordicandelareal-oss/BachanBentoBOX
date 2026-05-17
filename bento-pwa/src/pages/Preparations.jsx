import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRecipes } from '../hooks/useRecipes';
import useBentoMaker, { normalizeUnit } from '../hooks/useBentoMaker';
import { useIngredients } from '../hooks/useIngredients';
import { useUnits } from '../hooks/useUnits';
import { usePrepCategories } from '../hooks/usePrepCategories';
import { useMenuCategories } from '../hooks/useMenuCategories';
import { Utensils, Package, Plus, X, Save, ArrowLeft, ChevronRight, LayoutGrid, Scale, Trash2, Search, AlertCircle, ChefHat, CheckCircle2, Camera, CookingPot, Loader2, Store, TrendingUp, TrendingDown, Tag } from 'lucide-react';
import SequentialSelector from '../components/Common/SequentialSelector';
import PhotoSelector from '../components/Common/PhotoSelector';
import ConfirmationModal from '../components/Common/ConfirmationModal';
import Lightbox from '../components/Common/Lightbox';
import NumPad from '../components/Common/NumPad';
import BentoMaker from '../components/BentoMaker/BentoMaker';
import { compressImage, uploadImage } from '../lib/imageUtils';
import '../styles/Common.css';
import './Ingredients.css'; 
import './Preparations.css';

export function Preparations() {
  const { recipes, loading, deleteRecipe, fetchRecipes, togglePublish } = useRecipes(['elaboracion', 'bento']);
  const { categories: prepCats } = usePrepCategories();
  const { categories: menuCats } = useMenuCategories();
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [activeTabId, setActiveTabId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [lightbox, setLightbox] = useState({ isOpen: false, imageUrl: '', title: '' });
  // publishAction: { id, price, cost, name, menuCategoryId }
  const [publishAction, setPublishAction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pvpModalOpen, setPvpModalOpen] = useState(false);
  
  const activeTabName = useMemo(() => 
    (prepCats || []).find(c => c.id === activeTabId)?.Name || '',
    [prepCats, activeTabId]
  );
  
  const isBentosTab = useMemo(() => 
    activeTabName.toLowerCase() === 'bentos',
    [activeTabName]
  );

  useEffect(() => {
    if (prepCats && prepCats.length > 0 && !activeTabId) {
      setTimeout(() => setActiveTabId(prepCats[0].id), 0);
    }
  }, [prepCats, activeTabId]);

  const handleEditClose = useCallback(() => {
    setEditingRecipe(null);
    fetchRecipes();
  }, [fetchRecipes]);

  const handleOpenEditor = useCallback((recipe = null) => {
    if (!recipe) {
      setEditingRecipe({ name: '', portions: 1, items: [], preparation_category_Id: activeTabId });
    } else {
      setEditingRecipe(recipe);
    }
  }, [activeTabId]);

  const filteredRecipes = useMemo(() => {
    if (!recipes || !Array.isArray(recipes)) return [];
    return recipes.filter(r => 
      r.preparation_category_Id === activeTabId && 
      (isBentosTab ? r.recipe_type === 'bento' : r.recipe_type === 'elaboracion')
    );
  }, [recipes, activeTabId, isBentosTab]);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) return;
    const result = await deleteRecipe(confirmDelete);
    if (!result.success) {
      alert('Error al eliminar: ' + result.error);
    }
    setConfirmDelete(null);
  }, [confirmDelete, deleteRecipe]);

  const handleToggleStore = async (recipe) => {
    if (!recipe.is_published) {
      // Open rich PVP modal before publishing
      setPublishAction({
        id: recipe.id,
        price: recipe.sale_price?.toString() || '0',
        cost: recipe.cost_per_portion || 0,
        name: recipe.name,
        menuCategoryId: recipe.menu_category_id || ''
      });
      setPvpModalOpen(true);
    } else {
      // Unpublish directly
      setSaving(true);
      const res = await togglePublish(recipe.id, true, recipe.sale_price);
      await fetchRecipes();
      setSaving(false);
      if (!res.success) alert(res.error);
    }
  };

  const handleConfirmPublish = async () => {
    if (!publishAction) return;
    setSaving(true);
    const res = await togglePublish(publishAction.id, false, publishAction.price, publishAction.menuCategoryId);
    await fetchRecipes();
    setSaving(false);
    setPvpModalOpen(false);
    setPublishAction(null);
    if (!res.success) alert(res.error);
  };

  if (editingRecipe) {
    if (editingRecipe.recipe_type === 'bento' || (isBentosTab && !editingRecipe.id)) {
      return <BentoMaker 
        recipe={editingRecipe.id ? editingRecipe : null} 
        onClose={handleEditClose} 
      />;
    }

    return <PreparationEditor 
      recipe={editingRecipe} 
      onClose={handleEditClose} 
      prepCats={prepCats}
    />;
  }

  // SECURITY CHECK (Prioridad 911): Prevent white screen if recipes or prepCats are null/undefined
  if (!recipes || !Array.isArray(recipes) || !prepCats) {
    return (
      <div className="page-container flex justify-center items-center h-64 text-slate-400">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-slate-300" size={32} />
          <p>Cargando datos o sincronizando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Elaboraciones</h1>
          <p className="page-subtitle">Gestiona la mise en place, recetas base y precios de venta (TPV)</p>
        </div>
        <div className="flex gap-4 items-center">
          <button className="btn-icon-main" onClick={() => handleOpenEditor()}>
            <Plus size={24} />
          </button>
        </div>
      </div>

      <div className="category-tabs-wrapper">
        <div className="category-tabs">
          {(prepCats || []).map((cat, index) => (
            <button 
              key={cat?.id || index} 
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
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-icon shimmer"></div>
              <div>
                <div className="skeleton-text-main shimmer"></div>
                <div className="skeleton-text-sub shimmer"></div>
              </div>
              <div className="skeleton-price shimmer"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-grid">
          {(filteredRecipes || []).map((recipe, index) => (
            <div key={recipe?.id || index} className="elaboracion-card" onClick={() => handleOpenEditor(recipe)}>
              <div className="ingredient-info">
                <div className="card-icon-wrapper">
                  {isBentosTab ? <ChefHat size={20} /> : <CookingPot size={20} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="card-title">{recipe?.name || 'Receta sin nombre'}</h3>
                  </div>
                  <p className="card-meta">
                    RINDE: {recipe?.yield_scenario === 'weight' 
                      ? (recipe.net_yield >= 1000 ? `${(recipe.net_yield / 1000).toFixed(2)} Kg` : `${recipe.net_yield || 0} g`)
                      : `${recipe?.portions || 0} ${recipe?.unit_name || 'ud'}`
                    }
                    {(recipe?.platos_estimados > 0) && ` | 🍽️ ${recipe?.platos_estimados} platos`}
                  </p>
                </div>
              </div>
              
              {(() => {
                const cost = Number(recipe?.cost_per_portion || 0);
                const pvp = Number(recipe?.sale_price || 0);
                const isPublished = recipe?.is_published;
                
                return (
                  <div className="elaboracion-card-right-container">
                    {/* Compact Financial Pills */}
                    <div className="financial-pills-row">
                      {/* Cost Pill */}
                      <div className="financial-pill">
                        <span className="pill-label">C:</span>
                        <span>{cost > 0 ? `${cost.toFixed(2)}€` : '0.00€'}</span>
                      </div>

                      {/* PVP Pill */}
                      <div className={`financial-pill ${isPublished ? 'published-pvp' : 'unpublished'}`}>
                        <span className="pill-label">P:</span>
                        <span>{isPublished && pvp > 0 ? `${pvp.toFixed(2)}€` : '—'}</span>
                      </div>
                    </div>

                    {/* Actions container */}
                    <div className="card-actions-subtle" onClick={(e) => e.stopPropagation()}>
                      {/* TPV Store Toggle — central control */}
                      <button 
                        className={`tpv-store-btn ${isPublished ? 'active' : ''}`}
                        style={{ border: 'none' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStore(recipe);
                        }}
                        title={isPublished ? `Publicado en TPV · PVP ${pvp.toFixed(2)}€ — Click para despublicar` : "Publicar en TPV (configura PVP)"}
                      >
                        {saving && publishAction?.id === recipe.id 
                          ? <Loader2 size={16} className="animate-spin" /> 
                          : <Store size={16} />}
                      </button>
                      
                      {recipe?.image_url && (
                        <button 
                          className="p-1.5 md:p-2 text-sky-500 hover:bg-sky-50 rounded-xl transition-colors border border-transparent"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightbox({ isOpen: true, imageUrl: recipe.image_url, title: recipe.name });
                          }}
                        >
                          <Camera size={16} />
                        </button>
                      )}
                      
                      <button 
                        className="delete-btn-subtle"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(recipe?.id);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <ChevronRight size={16} className="text-slate-300 hidden sm:block" />
                  </div>
                );
              })()}

            </div>
          ))}

          {(!filteredRecipes || filteredRecipes.length === 0) && (
            <div className="col-span-full py-16 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200 fade-in" style={{ textAlign: 'center' }}>
              <div className="w-16 h-16 bg-white text-slate-200 rounded-full flex items-center justify-center mb-4 mx-auto shadow-sm">
                <CookingPot size={32} />
              </div>
              <h3 className="text-slate-400 font-bold text-sm mb-1">No hay elaboraciones</h3>
              <p className="text-slate-300 text-xs max-w-[240px] mx-auto">
                No se encontraron recetas para la categoría {activeTabName || 'seleccionada'}.
              </p>
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

      {/* ── PVP / TPV Modal ───────────────────────────────────────── */}
      {pvpModalOpen && publishAction && (
        <PvpPublishModal
          item={publishAction}
          menuCats={menuCats}
          saving={saving}
          onChange={(patch) => setPublishAction(prev => ({ ...prev, ...patch }))}
          onClose={() => { setPvpModalOpen(false); setPublishAction(null); }}
          onConfirm={handleConfirmPublish}
        />
      )}
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
    items,
    yieldScenario, setYieldScenario,
    adjustmentPercent, setAdjustmentPercent,
    addItem, updateItemQuantity, removeItem,
    totals, saveBento, loadRecipeItems,
    imageUrl, setImageUrl
  } = useBentoMaker(recipe, 'elaboracion');
  
  const initialCost = recipe?.cost_per_portion || 0;

  const { units } = useUnits();
  const { ingredients } = useIngredients();
  const { recipes } = useRecipes('elaboracion');
  const [isSaving, setIsSaving] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [internalSearch, setInternalSearch] = useState('');
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
      setPortions(val === '' ? '' : val);
    } else if (numPad.field === 'platos') {
      setPlatosEstimados(val === '' ? 0 : val);
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
  }, [recipe.id, loadRecipeItems]);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(internalSearch.toLowerCase())
  );

  const handleSelectComponent = (item) => {
    // For ingredients: use the unit from DB (unit_name); never assume 'ud' if it's a weight unit
    // For sub-recipes: if weight scenario → 'g', else 'ud'
    let normalized;
    let baseCost = 0;

    if (item.type === 'ingredient') {
      // MASTER RULE: Prioritize net_cost_per_unit from DB (Calculated in DB)
      normalized = normalizeUnit(item.unit_name || 'g');
      baseCost = parseFloat(item.net_cost_per_unit || item.cost_per_unit || 0);
    } else {
      // Sub-recipe: Respect the recipe's own yield_scenario
      // If weight-based: cost_per_portion is already stored as €/kg → treat like a weight ingredient
      // If unit-based: cost_per_portion is €/ud → treat as direct multiplication
      if (item.yield_scenario === 'weight') {
        normalized = 'g'; // Will trigger the /1000 rule in the totalizer
      } else {
        normalized = 'ud'; // Direct multiplication: qty * cost_per_portion
      }
      baseCost = parseFloat(item.cost_per_portion || 0);
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
    // Validación explícita para evitar que el usuario se quede sin feedback
    if (!bentoName) return alert("⚠️ Indica un nombre para la elaboración.");
    if (!prepCategoryId) return alert("⚠️ Selecciona una categoría de Mise en Place.");
    if (items.length === 0) return alert("⚠️ Añade al menos un ingrediente a la receta.");
    
    // Alerta de seguridad para costes excesivos (informativa, no bloqueante si el usuario confirma)
    if (totals.costPerPortion > 1000) {
      if (!window.confirm(`⚠️ El coste calculado es muy alto (${totals.costPerPortion.toFixed(2)}€). ¿Estás seguro de que las cantidades son correctas?`)) {
        return;
      }
    }

    setIsSaving(true);
    try {
      await saveBento();
      setIsSaving(false);
      setIsSaved(true);
      // Feedback visible durante 1.5 segundos, luego cerrar
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      alert("❌ Error al guardar: " + err.message);
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
                  {(prepCats || []).map(cat => <option key={cat.id} value={cat.id}>{cat.Name}</option>)}
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
                      onChange={e => setPortions(e.target.value === '' ? '' : e.target.value)}
                      className="form-input-premium"
                      placeholder="Cant. piezas"
                      step="any"
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
                      {(units || []).map(u => (
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
                  
                  {Math.abs(totals.costPerPortion - initialCost) > 0.01 && initialCost > 0 && (
                    <div className="warning-banner mb-4 animate-in fade-in slide-in-from-top-2" style={{ backgroundColor: '#fff1f2', color: '#be123c', padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #ffe4e6' }}>
                      <AlertCircle size={16} />
                      <div className="flex-1 text-[10px] font-bold uppercase">
                        ¡Precios actualizados! 
                        <span className="opacity-60 ml-1">Antes: {initialCost.toFixed(2)}€</span>
                      </div>
                    </div>
                  )}
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
                  disabled={isSaving || isSaved}
                  onClick={handleSave}
                  className={`btn-primary w-full py-4 text-lg transition-all ${isSaved ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                  style={{ 
                    borderRadius: '16px', 
                    fontFamily: 'var(--font-serif)',
                    opacity: (isSaving || isSaved) ? 0.8 : 1
                  }}
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={20} /> Guardando...</span>
                  ) : isSaved ? (
                    <span className="flex items-center gap-2"><CheckCircle2 size={20} /> Guardado con éxito</span>
                  ) : (
                    <span className="flex items-center gap-2"><Save size={20} /> Guardar Elaboración</span>
                  )}
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
                {(filteredItems || []).map((item, index) => (
                  <div key={item._key || index} className="mini-card compact overflow-hidden px-3 py-2.5">
                    <div className="grid grid-cols-[1fr_70px_105px_40px] items-center gap-2">
                      {/* COL 1: Name (Flexible + Truncated) */}
                      <div 
                        className="flex items-center gap-2 min-w-0 cursor-pointer group" 
                        onClick={() => {
                          const targetKey = item._key || item.id || `idx-${index}`;
                          const label = (normalizeUnit(item.unit) === 'g' || normalizeUnit(item.unit) === 'ml')
                            ? `${item.name} (g/ml)` 
                            : `${item.name} (ud)`;
                          openNumPad(targetKey, label);
                        }}
                      >
                        <div className="mini-icon-box shrink-0 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                          {item.type === 'ingredient' ? <Package size={14} className="text-slate-400" /> : <Utensils size={14} className="text-slate-400" />}
                        </div>
                        <span className="text-[13px] font-bold text-slate-700 truncate min-w-0">{item.name}</span>
                      </div>

                      {/* COL 2: Quantity (Blue, Fixed 70px) */}
                      <div 
                        className="text-right cursor-pointer"
                        onClick={() => {
                          const targetKey = item._key || item.id || `idx-${index}`;
                          openNumPad(targetKey, `CANTIDAD: ${item.name}`);
                        }}
                      >
                        <span className="text-[14px] font-black text-sky-600 block leading-tight">
                          {Number(item.quantity || 0).toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase italic">
                          {item.unit === 'ud' ? 'pzs' : (item.unit || 'g')}
                        </span>
                      </div>

                      {/* COL 3: Prices (Fixed 105px) */}
                      <div className="text-right">
                        <div className="text-[13px] font-black text-navy leading-none">
                          {((normalizeUnit(item.unit) === 'g' || normalizeUnit(item.unit) === 'ml')
                            ? (item.costPerUnit / 1000) * (item.quantity || 0)
                            : (item.costPerUnit * (item.quantity || 0))
                          ).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 mt-1 whitespace-nowrap overflow-hidden">
                          {item.costPerUnit.toFixed(3)}€/{(normalizeUnit(item.unit) === 'g' || normalizeUnit(item.unit) === 'ml') ? 'kg·l' : 'ud'}
                        </div>
                      </div>

                      {/* COL 4: Action (Fixed 40px) */}
                      <div className="flex justify-end">
                        <button 
                          onClick={() => {
                            const targetKey = item._key || item.id || `idx-${index}`;
                            removeItem(targetKey);
                          }} 
                          className="text-slate-200 hover:text-rose-500 p-1.5 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
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
          disabled={isSaving || isSaved}
          onClick={handleSave}
          className={`floating-save-btn ${isSaved ? 'saved' : ''}`}
          style={{ 
            backgroundColor: isSaved ? '#10b981' : undefined,
            opacity: (isSaving || isSaved) ? 0.8 : 1
          }}
        >
          {isSaving ? (
            <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={20} /> Guardando...</span>
          ) : isSaved ? (
            <span className="flex items-center gap-2"><CheckCircle2 size={20} /> Guardado</span>
          ) : (
            <span className="flex items-center gap-2"><Save size={20} /> Guardar Elaboración</span>
          )}
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

// ─── PVP Publish Modal
function PvpPublishModal({ item, menuCats, saving, onChange, onClose, onConfirm }) {
  const pvp = parseFloat(item.price) || 0;
  const cost = parseFloat(item.cost) || 0;
  const margin = pvp > 0 ? ((pvp - cost) / pvp) * 100 : 0;
  const isGood = margin >= 70;

  return (
    <div className="tpv-modal-overlay" onClick={onClose}>
      <div className="tpv-modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="tpv-modal-header">
          <button className="tpv-modal-close-btn" onClick={onClose} aria-label="Cerrar modal">
            <X size={18} />
          </button>
          <div className="tpv-modal-header-icon">
            <Store size={22} className="text-white" />
          </div>
          <h3 className="tpv-modal-header-title">Publicar en TPV</h3>
          <p className="tpv-modal-header-subtitle">{item.name}</p>
        </div>

        <div className="tpv-modal-body">
          {/* Financial Info Grid */}
          <div className="tpv-modal-financial-grid">
            {/* Cost Badge Card */}
            <div className="tpv-modal-financial-card">
              <span className="tpv-modal-financial-label">Coste Insumos</span>
              <span className="tpv-modal-financial-value">{cost.toFixed(2)}€</span>
              <span className="tpv-modal-financial-meta">Fijo calculado</span>
            </div>

            {/* Gross Benefit Badge Card */}
            <div className={`tpv-modal-financial-card ${
              pvp === 0 
                ? '' 
                : isGood 
                  ? 'accent' 
                  : margin > 0 
                    ? 'warn' 
                    : 'danger'
            }`}>
              <span className="tpv-modal-financial-label">Beneficio Bruto</span>
              <span className="tpv-modal-financial-value">
                {pvp > 0 ? `${(pvp - cost).toFixed(2)}€` : '—'}
              </span>
              <span className="tpv-modal-financial-meta">
                {pvp > 0 ? `${margin.toFixed(1)}% margen` : 'PVP no definido'}
              </span>
            </div>
          </div>

          {/* PVP Input */}
          <div className="tpv-modal-form-group">
            <label className="tpv-modal-label">Precio de Venta (PVP) <span style={{ color: '#ef4444' }}>*</span></label>
            <div className="tpv-modal-input-wrapper">
              <span className="tpv-modal-input-currency">€</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.price}
                onChange={e => onChange({ price: e.target.value })}
                className="tpv-modal-input"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          {/* Menu Category Selection */}
          {menuCats && menuCats.length > 0 && (
            <div className="tpv-modal-form-group">
              <label className="tpv-modal-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={12} /> Categoría de Carta
              </label>
              <div className="tpv-modal-categories-grid">
                <button
                  type="button"
                  className={`tpv-modal-category-btn ${!item.menuCategoryId ? 'active' : ''}`}
                  onClick={() => onChange({ menuCategoryId: '' })}
                >
                  Sin categoría
                </button>
                {menuCats.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`tpv-modal-category-btn ${item.menuCategoryId === cat.id ? 'active' : ''}`}
                    onClick={() => onChange({ menuCategoryId: cat.id })}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="tpv-modal-actions">
            <button
              className="tpv-modal-btn tpv-modal-btn-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              className="tpv-modal-btn tpv-modal-btn-confirm"
              onClick={onConfirm}
              disabled={saving || pvp <= 0}
            >
              {saving ? (
                <><Loader2 size={16} className="animate-spin" /> Procesando...</>
              ) : (
                <><Store size={16} /> Confirmar PVP</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Preparations;

