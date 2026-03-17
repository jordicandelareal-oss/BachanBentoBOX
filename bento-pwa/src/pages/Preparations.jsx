import React, { useState, useEffect } from 'react';
import { useRecipes } from '../hooks/useRecipes';
import { useBentoMaker, normalizeUnit } from '../hooks/useBentoMaker';
import { useIngredients } from '../hooks/useIngredients';
import { useUnits } from '../hooks/useUnits';
import { usePrepCategories } from '../hooks/usePrepCategories';
import { Utensils, Package, Plus, X, Save, ArrowLeft, ChevronRight, LayoutGrid, Scale, Trash2, Search } from 'lucide-react';
import SequentialSelector from '../components/Common/SequentialSelector';
import ConfirmationModal from '../components/Common/ConfirmationModal';
import '../styles/Common.css';
import './Ingredients.css'; 
import './Preparations.css';

export function Preparations() {
  const { recipes, loading, error, deleteRecipe, fetchRecipes } = useRecipes('elaboracion');
  const { categories: prepCats } = usePrepCategories();
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [activeTabId, setActiveTabId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

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
          {prepCats.map(cat => (
            <button 
              key={cat.id} 
              className={`category-tab ${activeTabId === cat.id ? 'active' : ''}`}
              onClick={() => setActiveTabId(cat.id)}
            >
              {cat.Name}
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
          {filteredRecipes.map(recipe => (
            <div key={recipe.id} className="premium-card" onClick={() => setEditingRecipe(recipe)}>
              <div className="ingredient-info">
                <div className="card-icon-wrapper">
                  <Utensils size={20} />
                </div>
                <div>
                  <h3 className="card-title">{recipe.name}</h3>
                  <p className="card-meta">Rinde: {recipe.portions} piezas/kg</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="card-meta" style={{ fontSize: '10px' }}>Coste/Uni.</div>
                  <div className="price-display">
                    {recipe.cost_per_portion ? `${recipe.cost_per_portion.toFixed(2)}€` : '0.00€'}
                  </div>
                </div>
                <button 
                  className="delete-btn-subtle"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(recipe.id);
                  }}
                >
                  <Trash2 size={18} />
                </button>
                <ChevronRight size={18} className="text-slate-300" />
              </div>
            </div>
          ))}

          {filteredRecipes.length === 0 && (
            <div className="text-center py-12" style={{ textAlign: 'center', padding: '48px 0' }}>
              <LayoutGrid className="mx-auto text-slate-200 mb-4" size={48} style={{ margin: '0 auto 16px', color: '#e2e8f0' }} />
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
    </div>
  );
}

function PreparationEditor({ recipe, onClose, prepCats }) {
  const { 
    bentoName, setBentoName, 
    portions, setPortions,
    unitId, setUnitId,
    prepCategoryId, setPrepCategoryId,
    items, addItem, updateItemQuantity, removeItem,
    totals, saveBento, loadRecipeItems 
  } = useBentoMaker(recipe, 'elaboracion');
  
  const { units } = useUnits();
  const { ingredients } = useIngredients();
  const { recipes } = useRecipes('elaboracion');
  const [isSaving, setIsSaving] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [internalSearch, setInternalSearch] = useState('');
  const [expandedItem, setExpandedItem] = useState(null);

  useEffect(() => {
    if (recipe.id) loadRecipeItems(recipe.id);
  }, [recipe.id]);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(internalSearch.toLowerCase())
  );

  const handleSelectComponent = (item) => {
    const normalized = normalizeUnit(item.unit_name || (item.type === 'ingredient' ? 'g' : 'ud'));
    let baseCost = 0;
    
    if (item.type === 'ingredient') {
      baseCost = parseFloat(item.cost_per_unit || (item.purchase_price / item.purchase_format));
    } else {
      const recipeCost = item.cost_per_portion || 0;
      baseCost = (normalized === 'g' || normalized === 'ml') ? (recipeCost / 1000) : recipeCost;
    }

    addItem({
      type: item.type,
      id: item.id,
      name: item.name,
      costPerUnit: baseCost,
      unit: normalized,
      quantity: item.type === 'ingredient' ? 100 : 1
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
      setTimeout(() => {
        onClose();
      }, 1500);
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
        <div className="editor-left-panel">
          <div className="premium-form-card">
            <h3 className="section-title mb-6" style={{ fontFamily: 'var(--font-serif)' }}>Datos Generales</h3>
            
            <div className="form-group mb-4">
              <label className="form-label">Nombre de la elaboración</label>
              <input 
                type="text" 
                value={bentoName} 
                onChange={e => setBentoName(e.target.value)}
                className="form-input-premium"
                placeholder="Ej: Salsa Teriyaki..."
              />
            </div>
            
            <div className="form-group mb-4">
              <label className="form-label">Categoría de Mise en Place</label>
              <select 
                value={prepCategoryId}
                onChange={e => setPrepCategoryId(e.target.value)}
                className="form-input-premium form-select-premium"
              >
                <option value="">Selecciona categoría...</option>
                {prepCats.map(cat => <option key={cat.id} value={cat.id}>{cat.Name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Rendimiento</label>
                <input 
                  type="number" 
                  value={portions || ''} 
                  onChange={e => setPortions(e.target.value === '' ? '' : Number(e.target.value))}
                  className="form-input-premium"
                  placeholder="Cant."
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

            <div className="mt-10 pt-8 border-t border-slate-100">
              <div className="cost-summary-card">
                <div className="cost-item primary">
                  <span className="label">Coste por Ración</span>
                  <span className="value">{totals.costPerPortion.toFixed(2)} €</span>
                </div>
                <div className="cost-item secondary">
                  <span className="label">Coste Total de Receta</span>
                  <span className="value">{totals.totalCost.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            {/* Desktop Save Button */}
            <div className="hidden md:block mt-8">
              <button 
                disabled={isSaving || isSaved || !bentoName || items.length === 0}
                onClick={handleSave}
                className={`btn-primary w-full py-4 text-lg ${isSaved ? 'bg-emerald-500' : ''}`}
                style={{ borderRadius: '16px', fontFamily: 'var(--font-serif)' }}
              >
                {isSaving ? 'Guardando...' : isSaved ? '✓ Guardado' : <><Save size={20} /> Guardar Elaboración</>}
              </button>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: INGREDIENTES */}
        <div className="editor-right-panel">
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
                  <div key={item._key} className="mini-card">
                    <div 
                      className="mini-card-header" 
                      onClick={() => setExpandedItem(expandedItem === item._key ? null : item._key)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                          {item.type === 'ingredient' ? <Package size={14} /> : <Utensils size={14} />}
                        </div>
                        <div>
                          <span className="mini-card-title">{item.name}</span>
                          <div className="text-[10px] text-slate-400 font-bold">
                            {item.quantity} {item.unit} · {(item.costPerUnit * item.quantity).toFixed(2)}€
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
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1">
                          <input 
                            type="number" 
                            autoFocus
                            value={item.quantity} 
                            onChange={e => updateItemQuantity(item._key, e.target.value)}
                            className="w-16 text-right py-1 text-sm font-bold text-navy outline-none bg-transparent"
                          />
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
      <div className="floating-save-container md:hidden">
        <button 
          disabled={isSaving || isSaved || !bentoName || items.length === 0}
          onClick={handleSave}
          className={`floating-save-btn ${isSaved ? 'bg-emerald-500' : ''}`}
        >
          {isSaving ? 'Guardando...' : isSaved ? '✓ Guardado' : <><Save size={20} /> Guardar Elaboración</>}
        </button>
      </div>

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
