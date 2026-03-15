import React, { useState } from 'react';
import { useRecipes } from '../hooks/useRecipes';
import { useBentoMaker, normalizeUnit } from '../hooks/useBentoMaker';
import { useIngredients } from '../hooks/useIngredients';
import { useUnits } from '../hooks/useUnits';
import { usePrepCategories } from '../hooks/usePrepCategories';
import { Utensils, Package, Plus, X, Save, ArrowLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import SequentialSelector from '../components/Common/SequentialSelector';
import '../styles/Common.css';
import './Ingredients.css'; // Selective reuse

// Hardcoded fallback removed in favor of usePrepCategories hook

export function Preparations() {
  const { recipes, loading, error, fetchRecipes } = useRecipes('elaboracion');
  const { categories: prepCats, loading: catsLoading } = usePrepCategories();
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [activeTabId, setActiveTabId] = useState(null);

  // Set initial tab once categories load
  React.useEffect(() => {
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

  // Filter recipes by the preparation_category_Id
  const filteredRecipes = recipes.filter(r => r.preparation_category_Id === activeTabId);
  const activeTabName = prepCats.find(c => c.id === activeTabId)?.name || '...';

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
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" style={{ height: '80px', background: '#f1f5f9', borderRadius: '16px' }} />
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
                <ChevronRight size={18} className="text-slate-300" />
              </div>
            </div>
          ))}

            <div className="text-center py-12" style={{ textAlign: 'center', padding: '48px 0' }}>
              <LayoutGrid className="mx-auto text-slate-200 mb-4" size={48} style={{ margin: '0 auto 16px', color: '#e2e8f0' }} />
              <p style={{ color: '#94a3b8' }}>No hay elaboraciones en {activeTabName}</p>
            </div>
        </div>
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
    items, addItem, updateItemQuantity, removeItem,
    totals, saveBento, loadRecipeItems 
  } = useBentoMaker(recipe, 'elaboracion');
  
  const { units } = useUnits();

  const { ingredients } = useIngredients();
  const { recipes } = useRecipes('elaboracion'); // Need sub-recipes
  const [isSaving, setIsSaving] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

  React.useEffect(() => {
    if (recipe.id) {
      loadRecipeItems(recipe.id);
    }
  }, [recipe.id]);

  const handleSelectComponent = (item) => {
    addItem({
      type: item.type,
      id: item.id,
      name: item.name,
      costPerUnit: item.type === 'ingredient' 
        ? (item.net_cost_per_unit || (item.purchase_price / 1000))
        : (item.cost_per_portion || 0),
      // Use unit_name from database or default to 'g' (sometimes ingredients miss units)
      unit: item.type === 'ingredient' ? normalizeUnit(item.unit_name) : 'rac',
      quantity: item.type === 'ingredient' ? 100 : 1
    });
    setShowSelector(false);
  };

  const handleSave = async () => {
    if (!bentoName) return alert("Indica un nombre");
    setIsSaving(true);
    try {
      await saveBento();
      onClose();
    } catch (err) {
      alert("Error al guardar: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-container fade-in">
      <button onClick={onClose} className="back-link mb-6" style={{ fontSize: '14px' }}>
        <ArrowLeft size={16} /> Volver al listado
      </button>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex-1">
            <label className="card-meta block mb-1">Nombre de la elaboración</label>
            <input 
              type="text" 
              value={bentoName} 
              onChange={e => setBentoName(e.target.value)}
              className="w-full text-xl font-black text-slate-900 border-b-2 border-slate-100 focus:border-slate-900 outline-none pb-2 bg-transparent"
              placeholder="Ej: Salsa Teriyaki..."
            />
          </div>
          <div>
            <label className="card-meta block mb-1">Categoría de Mise en Place</label>
            <select 
              value={prepCategoryId}
              onChange={e => setPrepCategoryId(e.target.value)}
              className="w-full text-lg font-bold text-slate-900 border-b-2 border-slate-100 outline-none pb-2 bg-transparent"
            >
              <option value="">Selecciona categoría...</option>
              {prepCats.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-6 mt-6">
          <div className="flex-1">
            <label className="card-meta block mb-1">Rinde</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                value={portions} 
                onChange={e => setPortions(Number(e.target.value))}
                className="w-full text-lg font-bold text-slate-900 border-b border-slate-100 focus:border-slate-900 outline-none pb-1 bg-transparent"
              />
              <select
                value={unitId}
                onChange={e => setUnitId(e.target.value)}
                className="text-sm font-bold text-slate-600 border-b border-slate-100 outline-none bg-transparent"
                style={{ minWidth: '80px' }}
              >
                <option value="">Unidad...</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex-1 text-right">
            <label className="card-meta block mb-1">Coste Total</label>
            <div className="price-display" style={{ fontSize: '1.5rem' }}>{totals.totalCost.toFixed(2)} €</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="p-4 bg-slate-50 border-bottom border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Package size={18} /> Componentes
          </h3>
          <button className="btn-add-item-small" onClick={() => setShowSelector(true)}>
            <Plus size={14} /> Añadir Ingrediente
          </button>
        </div>

        <div className="p-4">
          {items.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm italic">Usa el selector para añadir insumos o bases</p>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item._key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div className="flex-1" style={{ flex: 1 }}>
                    <div className="font-bold text-slate-800 text-sm flex items-center gap-2" style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.type === 'ingredient' ? <Package size={12} className="text-slate-400" /> : <Utensils size={12} className="text-slate-400" />}
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-400" style={{ fontSize: '10px', color: '#94a3b8' }}>{(item.costPerUnit * 1000).toFixed(2)}€/kg</div>
                  </div>
                  <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2" style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 8px' }}>
                      <input 
                        type="number" 
                        value={item.quantity} 
                        onChange={e => updateItemQuantity(item._key, e.target.value)}
                        className="w-16 text-right py-1 text-sm font-bold outline-none"
                        style={{ width: '64px', textAlign: 'right', padding: '4px 0', fontSize: '14px', fontWeight: 'bold', outline: 'none', border: 'none' }}
                      />
                      <span className="text-[10px] font-bold text-slate-400 px-1" style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', padding: '0 4px' }}>{item.unit}</span>
                    </div>
                    <div className="w-16 text-right font-black text-slate-900 text-sm" style={{ width: '64px', textAlign: 'right', fontWeight: '900', color: '#0f172a', fontSize: '14px' }}>
                      {(item.costPerUnit * item.quantity).toFixed(2)}€
                    </div>
                    <button onClick={() => removeItem(item._key)} className="text-slate-300 hover:text-red-500 transition-colors" style={{ color: '#cbd5e1', cursor: 'pointer', background: 'none', border: 'none' }}>
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-900 flex justify-between items-center text-white">
          <div>
            <div className="card-meta opacity-50">Coste por Unidad</div>
            <div className="text-xl font-black">{totals.costPerPortion.toFixed(2)} €</div>
          </div>
          <button 
            disabled={isSaving || !bentoName || items.length === 0}
            onClick={handleSave}
            className="bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
          >
            {isSaving ? 'Guardando...' : <><Save size={18} /> Guardar Elaboración</>}
          </button>
        </div>
      </div>

      {showSelector && (
        <SequentialSelector 
          ingredients={ingredients}
          recipes={recipes.filter(r => r.id !== recipe.id)} // Prevent self-referencing
          onSelect={handleSelectComponent}
          onClose={() => setShowSelector(false)}
        />
      )}
    </div>
  );
}
export default Preparations;
