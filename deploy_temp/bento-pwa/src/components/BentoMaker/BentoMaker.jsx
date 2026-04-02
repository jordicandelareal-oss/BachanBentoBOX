import React, { useState } from 'react';
import { useBentoMaker, normalizeUnit } from '../../hooks/useBentoMaker';
import { useIngredients } from '../../hooks/useIngredients';
import { useRecipes } from '../../hooks/useRecipes';
import { useUnits } from '../../hooks/useUnits';
import { useMenuCategories } from '../../hooks/useMenuCategories';
import { 
  Carrot, CookingPot, Plus, X, Save, ChevronRight, 
  TrendingUp, TrendingDown, DollarSign, Target, 
  Trash2, Info, LayoutGrid, Scale, CheckCircle2, Camera
} from 'lucide-react';
import PhotoSelector from '../Common/PhotoSelector';
import SequentialSelector from '../Common/SequentialSelector';
import NumPad from '../Common/NumPad';
import { compressImage, uploadImage } from '../../lib/imageUtils';

export default function BentoMaker({ recipe = null, onClose }) {
  const { 
    bentoName, setBentoName, 
    salePrice, setSalePrice, 
    portions, setPortions,
    unitId, setUnitId,
    items, addItem, updateItemQuantity, removeItem,
    totals, saveBento, loadRecipeItems, initialCost,
    imageUrl, setImageUrl,
    menuCategoryId, setMenuCategoryId
  } = useBentoMaker(recipe, 'bento');
  
  const { categories: menuCategories } = useMenuCategories();
  const { units } = useUnits();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const { ingredients } = useIngredients();
  const { recipes } = useRecipes('elaboracion');
  const [numPad, setNumPad] = useState(null); // { field: 'salePrice' | 'portions' | itemKey, label: string }

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
    if (numPad.field === 'salePrice') {
      setSalePrice(val === '' ? '' : val);
    } else if (numPad.field === 'portions') {
      setPortions(val === '' ? '' : val);
    } else {
      updateItemQuantity(numPad.field, val);
    }
  };

  const getNumPadValue = () => {
    if (!numPad) return '0';
    if (numPad.field === 'salePrice') return String(salePrice || '');
    if (numPad.field === 'portions') return String(portions || '');
    const item = items.find(i => i._key === numPad.field);
    return String(item?.quantity || '');
  };

  React.useEffect(() => {
    if (recipe?.id) {
      loadRecipeItems(recipe.id);
    }
  }, [recipe?.id, loadRecipeItems]);

  const handleSelectComponent = (item) => {
    let normalized = 'ud';
    let baseCost = 0;
    
    if (item.type === 'ingredient') {
      normalized = normalizeUnit(item.unit_name || 'g');
      baseCost = parseFloat(item.cost_per_unit || 0);
    } else {
      // LÓGICA DUAL PARA ELABORACIONES
      normalized = item.yield_scenario === 'weight' ? 'g' : 'ud'
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

  const handleSave = async () => {
    if (!bentoName) return alert("Indica un nombre para el Producto");
    if (!menuCategoryId) return alert("Selecciona una Categoría de Menú obligatoria.");
    setIsSaving(true);
    try {
      await saveBento();
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => {
        if (onClose) {
          onClose();
        } else {
          setIsSaved(false);
        }
      }, 1500);
    } catch (error) {
      alert('Error: ' + error.message);
      setIsSaving(false);
    }
  };

  return (
    <div className="page-container fade-in">
      {onClose && (
        <button onClick={onClose} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold transition-colors mb-6">
          <ChevronRight className="rotate-180" size={18} /> Volver al listado
        </button>
      )}
      <div className="page-header">
        <div>
          <h1 className="page-title">{recipe ? 'Editar Producto' : 'Editor de Producto'}</h1>
          <p className="page-subtitle">Diseña productos finales y asígnales una categoría</p>
        </div>
        <button 
          className={`btn-primary ${isSaved ? 'bg-emerald-500' : ''}`} 
          onClick={handleSave}
          disabled={isSaving || isSaved || !bentoName || !menuCategoryId || items.length === 0}
        >
          {isSaving ? '...' : isSaved ? '¡Guardado! ✓' : <Save size={20} />}
          <span>{isSaving ? 'Guardando' : isSaved ? '' : 'Guardar Producto'}</span>
        </button>
      </div>

      <div className="bento-layout">
        <div className="bento-main">
          {/* Header Info Card */}
          <div className="premium-form-card mb-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-12 lg:col-span-3">
                <PhotoSelector 
                  imageUrl={imageUrl}
                  onUpload={handleUpload}
                  onRemove={handleRemoveImage}
                  label="Emplatado Final"
                  placeholder="Subir foto del plato"
                />
              </div>
              <div className="md:col-span-12 lg:col-span-3">
                <label className="form-label">Nombre del Producto</label>
                <input 
                  type="text" 
                  value={bentoName} 
                  onChange={e => setBentoName(e.target.value)}
                  className="form-input-premium"
                  placeholder="Ej: Bandeja Premium..."
                />
              </div>
              <div className="md:col-span-6 lg:col-span-3">
                <label className="form-label">Categoría del Menú</label>
                <select
                  value={menuCategoryId}
                  onChange={e => setMenuCategoryId(e.target.value)}
                  className="form-input-premium form-select-premium"
                >
                  <option value="">Selecciona categoría</option>
                  {menuCategories.filter(c => c.is_active).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-6 lg:col-span-3">
                <label className="form-label">PVP Sugerido</label>
                <div 
                  className="numpad-control bg-white pr-10 relative"
                  onClick={() => openNumPad('salePrice', 'PVP Sugerido (€)')}
                >
                  {salePrice || <span className="numpad-placeholder">0.00</span>}
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">€</span>
                </div>
              </div>
              <div className="md:col-span-6 lg:col-span-3">
                <label className="form-label">Rinde (Unid/Porciones)</label>
                <div className="flex gap-2">
                  <div 
                    className="numpad-control bg-white flex-1"
                    onClick={() => openNumPad('portions', 'Rinde (Unid/Porciones)')}
                  >
                    {portions || <span className="numpad-placeholder">1</span>}
                  </div>
                  <select
                    value={unitId}
                    onChange={e => setUnitId(e.target.value)}
                    className="form-input-premium form-select-premium"
                    style={{ minWidth: '100px' }}
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
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="section-header p-6 pb-0 mb-0 border-none">
              <h3 className="section-title">
                <LayoutGrid size={20} className="text-sky-500" /> Componentes del Bento
              </h3>
              <button className="btn-add-item-small" onClick={() => setShowSelector(true)}>
                <Plus size={14} /> Añadir
              </button>
            </div>

            <div className="p-6">
              {items.length === 0 ? (
                <div className="text-center py-12">
                   <Carrot className="mx-auto text-slate-100 mb-2" size={48} />
                   <p className="text-slate-400 text-sm italic">Configura los componentes de este producto</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map(item => (
                    <div key={item._key} className="bg-white border border-slate-100 rounded-2xl p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden mb-3">
                      <div className="grid grid-cols-[1fr_70px_105px_40px] items-center gap-2">
                        {/* COL 1: Icon + Name */}
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                            {item.type === 'ingredient' ? <Carrot size={16} /> : <CookingPot size={16} />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] md:text-sm font-bold text-slate-800 truncate">{item.name}</div>
                            {item.category_name && (
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5 truncate overflow-hidden">
                                {item.category_name}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* COL 2: Quantity (Blue, Fixed 70px) */}
                        <div 
                          className="text-right cursor-pointer"
                          onClick={() => openNumPad(item._key, `${item.name} (${item.unit || 'g/ml'})`)}
                        >
                          <span className="text-[14px] font-black text-sky-600 block leading-none">
                            {item.quantity !== undefined && item.quantity !== '' ? Number(item.quantity).toLocaleString('es-ES', { maximumFractionDigits: 2 }) : '0'}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase italic">{item.unit === 'ud' ? 'pzs' : (item.unit || 'g')}</span>
                        </div>

                        {/* COL 3: Prices (Fixed 105px) */}
                        <div className="text-right">
                          <div className="text-[12px] md:text-[13px] font-black text-slate-900 leading-none">
                            {((item.unit === 'g' || item.unit === 'ml' ? item.costPerUnit / 1000 : item.costPerUnit) * (item.quantity || 0)).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                          </div>
                          <div className="text-[9px] font-bold text-slate-400 mt-1 whitespace-nowrap overflow-hidden">
                            {item.costPerUnit.toFixed(3)}€/{(item.unit === 'g' || item.unit === 'ml') ? 'kg·l' : 'ud'}
                          </div>
                        </div>

                        {/* COL 4: Action (Fixed 40px) */}
                        <div className="flex justify-end">
                          <button 
                            onClick={() => removeItem(item._key)} 
                            className="text-slate-200 hover:text-rose-500 p-1.5 transition-colors" 
                            title="Eliminar componente"
                          >
                            <Trash2 size={18} />
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

        <div className="bento-sidebar">
          {/* Rentability Card */}
          <div className="rentability-card shadow-2xl">
            <h3 className="text-white font-black uppercase tracking-widest text-[10px] mb-8 opacity-40">Análisis de Costes</h3>
            
            {Math.abs(totals.costPerPortion - initialCost) > 0.01 && initialCost > 0 && (
              <div className="mb-8 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <TrendingUp size={14} className="text-amber-400" />
                  </div>
                  <span className="text-white font-black uppercase tracking-widest text-[9px]">Actualización de Precios</span>
                </div>
                <p className="text-white/40 text-[10px] leading-relaxed font-bold">
                  Los insumos han cambiado de precio. <br/> El coste anterior era de <span className="text-white/60">{initialCost.toFixed(2)}€</span>.
                </p>
              </div>
            )}
            
            <div className="space-y-8">
              <div className="group">
                <div className="flex justify-between text-white/40 text-[9px] font-black uppercase tracking-tighter mb-2">
                  <span>Inversión Materia Prima</span>
                  <DollarSign size={12} className="opacity-50" />
                </div>
                <div className="text-4xl font-black text-white group-hover:text-sky-400 transition-colors">{totals.totalCost.toFixed(2)}<span className="text-lg ml-0.5 font-bold opacity-40">€</span></div>
              </div>

              <div>
                <div className="flex justify-between text-white/40 text-[9px] font-black uppercase tracking-tighter mb-2">
                  <span>Coste unitario (Cálculo)</span>
                  <Target size={12} className="opacity-50" />
                </div>
                <div className="text-2xl font-black text-white">{totals.costPerPortion.toFixed(2)}<span className="text-base ml-0.5 font-bold opacity-40">€</span></div>
              </div>

              <div className="pt-8 border-t border-white/5">
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                  <div>
                    <div className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Margen Real</div>
                    <div className="text-4xl font-black text-white">{totals.margin.toFixed(1)}<span className="text-xl ml-0.5 opacity-30">%</span></div>
                  </div>
                  <div className={`margin-indicator ${totals.margin >= 70 ? 'good' : 'warning'}`}>
                    {totals.margin >= 70 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-white/5 rounded-2xl flex gap-3 items-start border border-white/5">
              <Info size={16} className="text-sky-400 mt-0.5 flex-shrink-0" />
              <p className="text-white/40 text-[10px] leading-relaxed font-bold">
                Para BaChan, el éxito está en un margen del 70%. Ajusta tus precios o recetas para optimizar el beneficio.
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

      {/* FOOTER ACCIÓN FLOTANTE (MÓVIL) */}
      <div className="floating-save-container md:hidden" style={{ bottom: numPad ? '340px' : '90px', transition: 'bottom 0.3s ease' }}>
        <button 
          disabled={isSaving || isSaved || !bentoName || items.length === 0}
          onClick={handleSave}
          className={`floating-save-btn ${isSaved ? 'saved' : ''}`}
        >
          {isSaving ? 'Guardando...' : isSaved ? <><CheckCircle2 size={20} /> ¡Guardado!</> : <><Save size={20} /> Guardar Bento</>}
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
    </div>
  );
}
