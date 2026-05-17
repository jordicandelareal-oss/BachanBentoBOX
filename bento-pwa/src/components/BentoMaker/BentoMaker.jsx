import React, { useState } from 'react';
import { Package, Plus, Save, ChevronRight, ChevronDown, LayoutGrid, Trash2, TrendingUp, TrendingDown, DollarSign, Target, Info, Carrot, CookingPot, CheckCircle2, Loader2, Clock } from 'lucide-react';
import PhotoSelector from '../Common/PhotoSelector';
import SequentialSelector from '../Common/SequentialSelector';
import NumPad from '../Common/NumPad';
import useBentoMaker, { normalizeUnit } from '../../hooks/useBentoMaker';
import { usePrepCategories } from '../../hooks/usePrepCategories';
import { useMenuCategories } from '../../hooks/useMenuCategories';
import { useIngredients } from '../../hooks/useIngredients';
import { useRecipes } from '../../hooks/useRecipes';
import { useUnits } from '../../hooks/useUnits';
import { compressImage, uploadImage } from '../../lib/imageUtils';
import './BentoMaker.css';

export default function BentoMaker({ recipe = null, onClose }) {
  const { 
    bentoName, setBentoName, 
    salePrice, setSalePrice, 
    portions, setPortions,
    unitId, setUnitId,
    prepCategoryId, setPrepCategoryId,
    items, addItem, updateItemQuantity, removeItem,
    totals, saveBento, loadRecipeItems, initialCost,
    imageUrl, setImageUrl,
    menuCategoryId, setMenuCategoryId
  } = useBentoMaker(recipe, 'bento');
  
  const { categories: prepCats } = usePrepCategories();
  const { categories: menuCategories } = useMenuCategories();
  const { units } = useUnits();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const { ingredients } = useIngredients();
  const { recipes } = useRecipes('elaboracion');
  const [numPad, setNumPad] = useState(null); // { field: 'salePrice' | 'portions' | itemKey, label: string }
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [prepTime, setPrepTime] = useState(15);

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
      // MASTER RULE: Prioritize net_cost_per_unit from DB (Calculated in DB)
      baseCost = parseFloat(item.net_cost_per_unit || item.cost_per_unit || 0);
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
    if (!bentoName) return alert("⚠️ Indica un nombre para el Producto.");
    if (!menuCategoryId) return alert("⚠️ Selecciona una Categoría de Menú obligatoria.");
    if (items.length === 0) return alert("⚠️ Añade al menos un componente al Bento.");
    
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
      alert('❌ Error: ' + error.message);
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
          className={`btn-primary shadow-lg transition-all ${isSaved ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`} 
          onClick={handleSave}
          disabled={isSaving || isSaved}
          style={{ opacity: (isSaving || isSaved) ? 0.8 : 1 }}
        >
          {isSaving ? (
            <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={20} /> Guardando...</span>
          ) : isSaved ? (
            <span className="flex items-center gap-2"><CheckCircle2 size={20} /> ¡Guardado!</span>
          ) : (
            <span className="flex items-center gap-2"><Save size={20} /> Guardar Producto</span>
          )}
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
                <div className="custom-dropdown-container">
                  <button
                    type="button"
                    className="custom-dropdown-trigger"
                    onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                  >
                    <span>
                      {menuCategories.find(c => c.id === menuCategoryId)?.name || 'Selecciona categoría'}
                    </span>
                    <ChevronDown className={`dropdown-arrow ${isCatDropdownOpen ? 'open' : ''}`} size={16} />
                  </button>
                  {isCatDropdownOpen && (
                    <div className="custom-dropdown-menu">
                      <div 
                        className={`custom-dropdown-item ${!menuCategoryId ? 'active' : ''}`}
                        onClick={() => { setMenuCategoryId(''); setIsCatDropdownOpen(false); }}
                      >
                        Ninguna
                      </div>
                      {menuCategories.filter(c => c.is_active).map(c => (
                        <div
                          key={c.id}
                          className={`custom-dropdown-item ${menuCategoryId === c.id ? 'active' : ''}`}
                          onClick={() => { setMenuCategoryId(c.id); setIsCatDropdownOpen(false); }}
                        >
                          {c.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                    <div key={item._key} className="bento-component-row">
                      {/* Lado Izquierdo: Nombre del ingrediente destacado en fuente semibold (text-sm font-semibold) */}
                      <div className="bento-component-left">
                        <span className="bento-component-name text-sm font-semibold" title={item.name}>{item.name}</span>
                        {item.category_name && (
                          <span className="bento-component-category text-xs text-slate-400">
                            {item.category_name}
                          </span>
                        )}
                      </div>

                      {/* Centro: Tu componente actual de cantidad, alineado perfectamente en el eje vertical */}
                      <div className="bento-component-center">
                        <div className="bento-qty-input-wrapper" onClick={() => openNumPad(item._key, `${item.name} (${item.unit || 'g/ml'})`)}>
                          <input 
                            type="text" 
                            readOnly 
                            value={item.quantity !== undefined && item.quantity !== '' ? Number(item.quantity).toLocaleString('es-ES', { maximumFractionDigits: 2 }) : '0'} 
                            className="bento-qty-input"
                          />
                          <span className="bento-qty-unit-label">{item.unit === 'ud' ? 'uds' : (item.unit || 'g')}</span>
                        </div>
                      </div>

                      {/* Lado Derecho: Agrupa el coste total en formato destacado, el coste unitario debajo en tamaño pequeño y color atenuado (text-xs text-slate-400), y al extremo derecho el botón de eliminar */}
                      <div className="bento-component-right">
                        <div className="bento-component-pricing">
                          <span className="bento-component-total-price">
                            {((item.unit === 'g' || item.unit === 'ml' ? item.costPerUnit / 1000 : item.costPerUnit) * (item.quantity || 0)).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                          </span>
                          <span className="bento-component-unit-price text-xs text-slate-400">
                            {item.costPerUnit.toFixed(3)}€/{(item.unit === 'g' || item.unit === 'ml') ? 'kg·l' : 'ud'}
                          </span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeItem(item._key)} 
                          className="bento-component-delete-btn" 
                          title="Eliminar componente"
                        >
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
          <div className="rentability-card shadow-2xl">
            <h3 className="bento-analysis-title">Análisis de Costes</h3>
            
            {Math.abs(totals.costPerPortion - initialCost) > 0.01 && initialCost > 0 && (
              <div className="mb-6 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
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
            
            <div>
              <div className="bento-analysis-group">
                <div className="bento-analysis-label-row">
                  <span>Inversión Materia Prima</span>
                  <DollarSign size={12} className="opacity-50" />
                </div>
                <div className="bento-analysis-value-large">{totals.totalCost.toFixed(2)}<span>€</span></div>
              </div>

              <div className="bento-analysis-group">
                <div className="bento-analysis-label-row">
                  <span>Factor Tiempo / Elaboración</span>
                  <Clock size={12} className="opacity-50" />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <select
                    value={prepTime}
                    onChange={(e) => setPrepTime(Number(e.target.value))}
                    className="bento-prep-time-select"
                  >
                    <option value={5}>5 min</option>
                    <option value={10}>10 min</option>
                    <option value={15}>15 min</option>
                    <option value={20}>20 min</option>
                    <option value={25}>25 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                  <span className="text-[12px] text-white/40">/</span>
                  <span className="text-[16px] text-sky-400 font-extrabold">{(prepTime * 0.10).toFixed(2)}€</span>
                </div>
              </div>

              <div className="pt-4 mt-2">
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                  <div>
                    <div className="flex items-center gap-1.5 text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">
                      <span>Margen Real</span>
                      <span className="info-icon cursor-pointer">
                        <Info size={11} className="text-sky-400/85 hover:text-sky-400 transition-colors" />
                        <span className="tooltip-text">
                          Para BaChan, el éxito está en un margen del 70%. Ajusta tus precios o recetas para optimizar el beneficio.
                        </span>
                      </span>
                    </div>
                    <div className="text-4xl font-black text-white">{totals.margin.toFixed(1)}<span className="text-xl ml-0.5 opacity-30">%</span></div>
                  </div>
                  <div className={`margin-indicator ${totals.margin >= 70 ? 'good' : 'warning'}`}>
                    {totals.margin >= 70 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                  </div>
                </div>
              </div>
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
          disabled={isSaving || isSaved}
          onClick={handleSave}
          className={`floating-save-btn ${isSaved ? 'saved' : ''}`}
          style={{ opacity: (isSaving || isSaved) ? 0.8 : 1 }}
        >
          {isSaving ? (
            <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={20} /> Guardando...</span>
          ) : isSaved ? (
            <span className="flex items-center gap-2"><CheckCircle2 size={20} /> ¡Guardado!</span>
          ) : (
            <span className="flex items-center gap-2"><Save size={20} /> Guardar Producto</span>
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
    </div>
  );
}
