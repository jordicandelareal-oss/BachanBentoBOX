import React, { useState } from 'react';
import { useBentoMaker, normalizeUnit } from '../../hooks/useBentoMaker';
import { useIngredients } from '../../hooks/useIngredients';
import { useRecipes } from '../../hooks/useRecipes';
import { useUnits } from '../../hooks/useUnits';
import { 
  Package, Utensils, Plus, X, Save, ChevronRight, 
  TrendingUp, TrendingDown, DollarSign, Target, 
  Trash2, Info
} from 'lucide-react';
import SequentialSelector from '../Common/SequentialSelector';
import '../../styles/Common.css';
import './BentoMaker.css';

export default function BentoMaker() {
  const { 
    bentoName, setBentoName, 
    salePrice, setSalePrice, 
    portions, setPortions,
    unitId, setUnitId,
    items, addItem, updateItemQuantity, removeItem,
    totals, saveBento
  } = useBentoMaker();
  
  const { units } = useUnits();

  const [isSaving, setIsSaving] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

  const { ingredients } = useIngredients();
  const { recipes } = useRecipes('elaboracion');

  const handleSelectComponent = (item) => {
    const normalized = normalizeUnit(item.unit_name || (item.type === 'ingredient' ? 'g' : 'ud'));
    let baseCost = 0;
    
    if (item.type === 'ingredient') {
      baseCost = item.net_cost_per_unit || (item.purchase_price / 1000);
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

  const handleSave = async () => {
    if (!bentoName) return alert("Indica un nombre para el Bento");
    setIsSaving(true);
    try {
      await saveBento();
      alert('¡Bento guardado con éxito! 🍱');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bento Maker</h1>
          <p className="page-subtitle">Diseña productos finales y analiza rentabilidad</p>
        </div>
        <div className="flex gap-2">
          <button 
            className="btn-save-main" 
            onClick={handleSave}
            disabled={isSaving || !bentoName || items.length === 0}
          >
            {isSaving ? '...' : <Save size={20} />}
            <span>{isSaving ? 'Guardando' : 'Guardar'}</span>
          </button>
        </div>
      </div>

      <div className="bento-layout">
        <div className="bento-main">
          {/* Header Info Card */}
          <div className="premium-compact-card mb-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
              <div className="md:col-span-6">
                <label className="card-meta block mb-1">Nombre del Producto</label>
                <input 
                  type="text" 
                  value={bentoName} 
                  onChange={e => setBentoName(e.target.value)}
                  className="w-full text-2xl font-black text-slate-900 border-b-2 border-slate-100 focus:border-slate-900 outline-none pb-2 bg-transparent"
                  placeholder="Ej: Bento Teriyaki Premium..."
                />
              </div>
              <div className="md:col-span-3">
                <label className="card-meta block mb-1">PVP Sugerido</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={salePrice} 
                    onChange={e => setSalePrice(Number(e.target.value))}
                    className="w-full text-xl font-bold text-slate-900 border-b-2 border-slate-100 outline-none pb-2 bg-transparent pr-8"
                  />
                  <span className="absolute right-0 bottom-3 text-slate-400 font-bold">€</span>
                </div>
              </div>
              <div className="md:col-span-3">
                <label className="card-meta block mb-1">Unidades</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={portions} 
                    onChange={e => setPortions(Number(e.target.value))}
                    className="w-full text-xl font-bold text-slate-900 border-b-2 border-slate-100 outline-none pb-2 bg-transparent"
                  />
                  <select
                    value={unitId}
                    onChange={e => setUnitId(e.target.value)}
                    className="text-sm border-b-2 border-slate-100 outline-none bg-transparent"
                  >
                    <option value="">...</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-bottom border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <LayoutGrid size={18} /> Componentes del Bento
              </h3>
              <button className="btn-add-item-small" onClick={() => setShowSelector(true)}>
                <Plus size={14} /> Añadir
              </button>
            </div>

            <div className="p-4">
              {items.length === 0 ? (
                <div className="text-center py-12">
                   <Package className="mx-auto text-slate-200 mb-2" size={40} />
                   <p className="text-slate-400 text-sm italic">Usa el selector para añadir insumos o recetas base</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item._key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300 transition-colors">
                      <div className="flex-1">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          {item.type === 'ingredient' ? <Package size={14} className="text-slate-400" /> : <Utensils size={14} className="text-slate-400" />}
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          {(item.unit === 'g' || item.unit === 'ml') 
                            ? `${(item.costPerUnit * 1000).toFixed(2)}€/kg · l`
                            : `${item.costPerUnit.toFixed(2)}€/ud`}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 shadow-sm">
                          <input 
                            type="number" 
                            value={item.quantity} 
                            onChange={e => updateItemQuantity(item._key, e.target.value)}
                            className="w-20 text-right py-2 text-sm font-black outline-none bg-transparent"
                          />
                          <span className="text-[10px] font-bold text-slate-400 px-2 uppercase">{item.unit}</span>
                        </div>
                        <div className="w-20 text-right font-black text-slate-900">
                          {(item.costPerUnit * item.quantity).toFixed(2)}€
                        </div>
                        <button onClick={() => removeItem(item._key)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bento-sidebar">
          {/* Rentability Card */}
          <div className="rentability-card shadow-xl">
            <h3 className="text-white font-black uppercase tracking-widest text-xs mb-6 opacity-60">Análisis Económico</h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-white/60 text-[10px] font-bold uppercase mb-1">
                  <span>Coste Materia Prima</span>
                  <DollarSign size={12} />
                </div>
                <div className="text-3xl font-black text-white">{totals.totalCost.toFixed(2)}€</div>
              </div>

              <div>
                <div className="flex justify-between text-white/60 text-[10px] font-bold uppercase mb-1">
                  <span>Coste por Ración</span>
                  <Target size={12} />
                </div>
                <div className="text-xl font-black text-white">{totals.costPerPortion.toFixed(2)}€</div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-white/60 text-[10px] font-bold uppercase mb-1">Margen Bruto</div>
                    <div className="text-4xl font-black text-white">{totals.margin.toFixed(1)}%</div>
                  </div>
                  <div className={`margin-indicator ${totals.margin >= 70 ? 'good' : 'warning'}`}>
                    {totals.margin >= 70 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-3 bg-white/5 rounded-xl flex gap-3 items-start">
              <Info size={16} className="text-white/40 mt-0.5" />
              <p className="text-white/40 text-[10px] leading-relaxed">
                El margen recomendado por BaChan es del 70%. Ajusta el PVP o reduce costes si estás por debajo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showSelector && (
        <SequentialSelector 
          ingredients={ingredients}
          recipes={recipes}
          onSelect={handleSelectComponent}
          onClose={() => setShowSelector(false)}
        />
      )}
    </div>
  );
}

// Minimal helper component for LayoutGrid icon in this file
function LayoutGrid({ size }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
}
