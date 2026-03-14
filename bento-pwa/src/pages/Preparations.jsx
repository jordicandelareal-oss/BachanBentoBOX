import React, { useState } from 'react';
import { useRecipes } from '../hooks/useRecipes';
import { useBentoMaker } from '../hooks/useBentoMaker';
import { useIngredients } from '../hooks/useIngredients';
import { Utensils, Search, ChevronRight, Package, Plus, X, Save, ArrowLeft } from 'lucide-react';
import './Ingredients.css'; // Reusing some base styles

export default function Preparations() {
  const { recipes, loading, error, fetchRecipes } = useRecipes('elaboracion');
  const [editingRecipe, setEditingRecipe] = useState(null);

  if (editingRecipe) {
    return <PreparationEditor 
      recipe={editingRecipe} 
      onClose={() => {
        setEditingRecipe(null);
        fetchRecipes();
      }} 
    />;
  }

  return (
    <div className="ingredients-container fade-in">
      <div className="ingredients-header">
        <div>
          <h1>Elaboraciones</h1>
          <p className="text-slate-500 text-sm">Recetas base y preparaciones intermedias</p>
        </div>
        <button className="btn-add-main" onClick={() => setEditingRecipe({ name: '', portions: 1, items: [] })}>
          <Plus size={24} />
        </button>
      </div>

      {loading ? (
        <div className="ingredients-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" style={{ height: '80px', background: '#f1f5f9', borderRadius: '16px', marginBottom: '16px' }} />
          ))}
        </div>
      ) : (
        <div className="ingredients-grid">
          {recipes.map(recipe => (
            <div key={recipe.id} className="ingredient-card cursor-pointer" onClick={() => setEditingRecipe(recipe)}>
              <div className="ingredient-info">
                <div className="ingredient-icon">
                  <Utensils size={20} />
                </div>
                <div>
                  <h3 className="ingredient-name">{recipe.name}</h3>
                  <p className="ingredient-unit">Rinde: {recipe.portions} rac.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Coste/Rac.</div>
                  <div className="ingredient-price">
                    {recipe.cost_per_portion ? `${recipe.cost_per_portion.toFixed(2)}€` : '0.00€'}
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </div>
            </div>
          ))}

          {recipes.length === 0 && (
            <div className="text-center py-12" style={{ textAlign: 'center', padding: '48px 0' }}>
              <Utensils className="mx-auto text-slate-200 mb-4" size={48} style={{ margin: '0 auto 16px', color: '#e2e8f0' }} />
              <p style={{ color: '#94a3b8' }}>No hay elaboraciones creadas</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PreparationEditor({ recipe, onClose }) {
  const { 
    bentoName, setBentoName, 
    portions, setPortions,
    items, addItem, updateItemQuantity, removeItem,
    totals, saveBento, loadRecipeItems
  } = useBentoMaker(recipe, 'elaboracion');

  const { ingredients } = useIngredients();
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (recipe.id) {
      loadRecipeItems(recipe.id);
    }
  }, [recipe.id]);

  const handleAddItem = (e) => {
    const ingId = e.target.value;
    if (!ingId) return;
    const ingredient = ingredients.find(i => i.id === ingId);
    if (ingredient) {
      addItem({
        type: 'ingredient',
        id: ingredient.id,
        name: ingredient.name,
        costPerUnit: ingredient.net_cost_per_unit || (ingredient.purchase_price / 1000),
        unit: ingredient.unit_id || 'g',
        quantity: 100
      });
    }
    e.target.value = "";
  };

  const handleSave = async () => {
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
    <div className="fade-in">
      <button onClick={onClose} className="flex items-center gap-2 text-slate-500 font-bold text-sm mb-6 hover:text-slate-900">
        <ArrowLeft size={16} /> Volver al listado
      </button>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="mb-4">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nombre de la elaboración</label>
          <input 
            type="text" 
            value={bentoName} 
            onChange={e => setBentoName(e.target.value)}
            className="w-full text-xl font-black text-slate-900 border-b-2 border-slate-100 focus:border-slate-900 outline-none pb-2"
            placeholder="Ej: Salsa Teriyaki..."
          />
        </div>

        <div className="flex gap-6">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Rinde (Raciones/Kg)</label>
            <input 
              type="number" 
              value={portions} 
              onChange={e => setPortions(Number(e.target.value))}
              className="w-full text-lg font-bold text-slate-900 border-b border-slate-100 focus:border-slate-900 outline-none pb-1"
            />
          </div>
          <div className="flex-1 text-right">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Coste Total</label>
            <div className="text-xl font-black text-slate-900">{totals.totalCost.toFixed(2)} €</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="p-4 bg-slate-50 border-bottom border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Package size={18} /> Ingredientes
          </h3>
          <select className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none" onChange={handleAddItem} value="">
            <option value="" disabled>+ Añadir ingrediente...</option>
            {ingredients.map(ing => (
              <option key={ing.id} value={ing.id}>{ing.name}</option>
            ))}
          </select>
        </div>

        <div className="p-4">
          {items.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm italic">Añade ingredientes para calcular el coste</p>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item._key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                    <div className="text-[10px] text-slate-400">{(item.costPerUnit * 1000).toFixed(2)}€/kg</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2">
                      <input 
                        type="number" 
                        value={item.quantity} 
                        onChange={e => updateItemQuantity(item._key, e.target.value)}
                        className="w-16 text-right py-1 text-sm font-bold outline-none"
                      />
                      <span className="text-[10px] font-bold text-slate-400 px-1">{item.unit}</span>
                    </div>
                    <div className="w-16 text-right font-black text-slate-900 text-sm">
                      {(item.costPerUnit * item.quantity).toFixed(2)}€
                    </div>
                    <button onClick={() => removeItem(item._key)} className="text-slate-300 hover:text-red-500 transition-colors">
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
            <div className="text-[10px] font-bold opacity-50 uppercase">Coste por Ración</div>
            <div className="text-lg font-black">{totals.costPerPortion.toFixed(2)} €</div>
          </div>
          <button 
            disabled={isSaving || !bentoName || items.length === 0}
            onClick={handleSave}
            className="bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
          >
            {isSaving ? 'Guardando...' : <><Save size={18} /> Guardar Elaboración</>}
          </button>
        </div>
      </div>
    </div>
  );
}
