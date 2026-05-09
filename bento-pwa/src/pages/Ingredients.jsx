import React, { useState, useEffect } from 'react';
import { useIngredients } from '../hooks/useIngredients';
import { useUnits } from '../hooks/useUnits';
import { supabase } from '../lib/supabaseClient';
import { Carrot, Search, Plus, AlertCircle, Loader2, ChevronRight, X, Save, Trash2, Camera, Scan, Image as ImageIcon, RotateCcw, Sparkles, Scale, Package, Store, LayoutGrid, CheckCircle2 } from 'lucide-react';
import ConfirmationModal from '../components/Common/ConfirmationModal';
import NumPad from '../components/Common/NumPad';
import { compressImage, uploadImage, blobToBase64 } from '../lib/imageUtils';
import { processCommand } from '../lib/geminiClient';
import '../styles/Common.css';
import './Ingredients.css';

import PhotoSelector from '../components/Common/PhotoSelector';
import { useProviders } from '../hooks/useProviders';
import PriceHistory from '../components/Ingredients/PriceHistory';
import ShoppingListModal from '../components/Ingredients/ShoppingListModal';
import { LineChart, ShoppingBasket } from 'lucide-react';

// ─── Shared Cost Calculation ──────────────────────────────────────────────────
// Fórmula única para todo el módulo: modal, payload y lista usan el mismo cálculo
// merma > 0 → pérdida de peso → coste SUBE  (waste en %, ej: 20 → pierde 20%)
// merma < 0 → hidratación    → coste BAJA   (ganancia de peso al cocinar)
//
// Fórmula: coste_bruto / (1 - merma/100)
// Equivale a: coste_bruto * (100 / (100 - merma))
//
// Ejemplos:
//   merma  0% → divisor 1.00  → sin cambio
//   merma 20% → divisor 0.80  → coste sube un 25%
//   merma-20% → divisor 1.20  → coste baja un ~17%
function computeNetCost(purchasePrice, purchaseFormat, calculationType, wastePercent) {
  const format = parseFloat(purchaseFormat) || 0;
  const price  = parseFloat(purchasePrice)  || 0;
  const waste  = parseFloat(wastePercent)   || 0;
  if (format <= 0) return 0;
  
  // Coste bruto por KG (o por UD si es de tipo unidad)
  const grossCost = calculationType === 'unidad'
    ? (price / format)
    : ((price / format) * 1000);

  // Fórmula Hidratación vs Merma
  // Merma (positivo): Coste / (1 - %)
  // Hidratación (negativo): Coste / (1 + abs(%))
  const divisor = waste < 0 
    ? (1 + (Math.abs(waste) / 100))
    : Math.max(1 - (waste / 100), 0.01);

  return grossCost / divisor;
}

// ─── Alphabet Sidebar Component ──────────────────────────────────────────────
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function AlphabetSidebar({ scrollToLetter, presentLetters }) {
  return (
    <aside className="alphabet-sidebar">
      {alphabet.map(letter => {
        const isPresent = presentLetters.includes(letter);
        return (
          <button
            key={letter}
            className={`alphabet-letter ${isPresent ? 'present' : 'absent'}`}
            onClick={(e) => {
              e.preventDefault();
              if (isPresent && typeof scrollToLetter === 'function') {
                scrollToLetter(letter);
              }
            }}
            disabled={!isPresent}
          >
            {letter}
          </button>
        );
      })}
    </aside>
  );
}

// ─── Modal Component ──────────────────────────────────────────────────────────
function IngredientModal({ ingredient, onClose, onSave, loading }) {
  const { units } = useUnits();
  const { providers, addProvider } = useProviders();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [numPad, setNumPad] = useState(null); // { field, label, value }
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [newProviderName, setNewProviderName] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const isNew = !ingredient.id;

  const [form, setForm] = useState({
    name: ingredient.name || '',
    purchase_format: ingredient.purchase_format || '',
    purchase_price: ingredient.purchase_price ?? '',
    cost_per_unit: ingredient.cost_per_unit ?? '',
    provider: ingredient.provider || '',
    provider_id: ingredient.provider_id || '',
    unit_id: ingredient.unit_id || '',
    category_id: ingredient.category_id || '',
    subcategory_id: ingredient.subcategory_id || '',
    image_url: ingredient.image_url || '',
    brand: ingredient.brand || '',
    barcode: ingredient.barcode || '',
    calculation_type: ingredient.calculation_type || 'peso',
    waste_percentage: ingredient.waste_percentage || 0,
    waste_type: ingredient.waste_type || 'Limpieza/Procesado',
    is_published: ingredient.is_published || false,
    sale_price: ingredient.sale_price || 0,
    provider_product_code: ingredient.provider_product_code || '',
  });

  const [scanning, setScanning] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]); // Array of base64 strings
  const [scanStep, setScanStep] = useState(0); // 0: Idle, 1: Front, 2: Table, 3: Barcode


  // Fetch ingredient categories (not preparation_categories)
  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      setCategories(data || []);
    }
    load();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (!form.category_id) { setSubcategories([]); return; }
    async function load() {
      const { data } = await supabase
        .from('subcategories')
        .select('id, name')
        .eq('category_id', form.category_id)
        .order('name');
      setSubcategories(data || []);
    }
    load();
  }, [form.category_id]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleUpload = async (file) => {
    try {
      const compressed = await compressImage(file);
      const url = await uploadImage(compressed);
      set('image_url', url);
    } catch (err) {
      alert('Error al subir imagen: ' + err.message);
    }
  };

  const handleRemoveImage = () => {
    set('image_url', '');
  };

  const startNanaScan = () => {
    setScanning(true);
    setScanStep(1);
    setCapturedImages([]);
  };

  const capturePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      const base64 = await blobToBase64(compressed);
      
      const newImages = [...capturedImages, base64];
      setCapturedImages(newImages);

      if (scanStep < 3) {
        setScanStep(scanStep + 1);
      } else {
        // All photos captured, process with AI
        setScanStep(4); // Processing state
        const response = await processCommand("Analiza estas fotos de un ingrediente y extrae la información para registrarlo.", {
          imagesBase64: newImages
        });

        // The tool call `fillIngredientData` will be handled in geminiClient 
        if (response.toolCalls) {
          const fillCall = response.toolCalls.find(c => c.name === 'fillIngredientData');
          if (fillCall) {
            const { name, brand, barcode, purchase_format, category_name, unit_name } = fillCall.args;
            if (name) set('name', name);
            if (brand) set('brand', brand);
            if (barcode) set('barcode', barcode);
            if (purchase_format) set('purchase_format', purchase_format.toString());
            
            // Map category_name to id if exists
            if (category_name) {
              const cat = categories.find(c => c.name.toUpperCase() === category_name.toUpperCase());
              if (cat) set('category_id', cat.id);
            }

            // Map unit_name to id if exists
            if (unit_name) {
              const unit = units.find(u => u.name.toLowerCase() === unit_name.toLowerCase());
              if (unit) set('unit_id', unit.id);
            }
          }
        }
        
        // Also set the first image as the definitive one if not already set
        if (!form.image_url && newImages.length > 0) {
           const url = await uploadImage(await (await fetch(`data:image/jpeg;base64,${newImages[0]}`)).blob());
           set('image_url', url);
        }

        setScanning(false);
        setScanStep(0);
      }
    } catch (err) {
      alert('Error en el escaneo: ' + err.message);
      setScanning(false);
      setScanStep(0);
    }
  };

  const canSave = !!form.name && !!form.category_id && !!form.subcategory_id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Evita que se propague a los padres (ej. el overlay del modal)
    
    // ✅ MASTER RULE: We do NOT send net_cost_per_unit or cost_per_unit.
    // Supabase recalculates these automatically via Trigger/Generated Column.
    // The frontend only provides the raw inputs (price, format, waste, etc.)

    const format = form.purchase_format ? parseFloat(form.purchase_format) : null;
    const price = form.purchase_price !== '' ? parseFloat(form.purchase_price) : null;
    const wasteVal = parseFloat(form.waste_percentage) || 0;

    const payload = {
      name: form.name,
      purchase_format: format,
      purchase_price: price,
      provider_id: form.provider_id || null,
      unit_id: form.calculation_type === 'peso' ? 'c39f0ea5-5325-4876-8395-940b4995ce4a' : '6b013d2c-2079-41fc-a210-2f8e1cb11e41',
      category_id: form.category_id || null,
      subcategory_id: form.subcategory_id || null,
      image_url: form.image_url || null,
      brand: form.brand || null,
      barcode: form.barcode || null,
      calculation_type: form.calculation_type,
      waste_percentage: wasteVal,
      waste_type: form.waste_type || null,
      is_published: form.is_published || false,
      sale_price: form.sale_price !== '' ? parseFloat(form.sale_price) : 0,
      provider_product_code: form.provider_product_code || null,
    };

    console.log('Formulario enviado', payload);

    // Validaciones manuales con alertas específicas
    if (!form.name || form.name.trim() === '') {
      alert('Por favor, indica el nombre del ingrediente.');
      return;
    }
    if (form.purchase_price === '' || form.purchase_price === null) {
      alert('Falta el precio de compra.');
      return;
    }
    if (!form.category_id) {
      alert('Selecciona una categoría.');
      return;
    }
    if (!form.subcategory_id) {
      alert('Selecciona una subcategoría.');
      return;
    }
    // Eliminamos validación de unit_id ya que usamos calculation_type

    console.log('📝 [Form] Intentando guardar componente:', payload);
    await onSave(payload);
  };

  // Calcular el costo dinámico para mostrar en el modal usando la función compartida
  const dynamicCost = computeNetCost(
    form.purchase_price,
    form.purchase_format,
    form.calculation_type,
    form.waste_percentage
  );

  // --- PVP SECTION ---
  const handlePvpClick = () => {
    setNumPad({ 
      field: 'sale_price', 
      label: 'Precio de Venta (PVP)', 
      value: form.sale_price 
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ paddingTop: '2rem' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header border-b-0 pb-0">
          <div className="flex flex-col w-full pr-8">
            <div className="modal-title">
              <span className="text-slate-400 whitespace-nowrap">{isNew ? 'Añadir:' : 'Editar:'}</span>
              <input
                className="modal-title-input"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Nombre del insumo..."
                autoFocus={isNew}
              />
            </div>
            {!isNew && <p className="text-xs text-slate-400 mt-0.5">ID: {ingredient.id.substring(0,8)}</p>}
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form pt-4">
          
          {/* SECCIÓN DE IMAGEN Y NANA SCAN */}
          <div className="mb-8 p-1">
            <PhotoSelector 
              imageUrl={form.image_url}
              onUpload={handleUpload}
              onRemove={handleRemoveImage}
              onNanaScan={isNew ? startNanaScan : null}
              label="Foto del Insumo"
              placeholder="Haz clic para subir foto"
            />



            {/* Nana Scanning Interface Overlay (still needed for the process flow) */}
            {scanning && (
              <div className="fixed inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-white p-6 text-center z-[100] animate-in fade-in zoom-in duration-300">
                {scanStep < 4 ? (
                  <>
                    <div className="w-20 h-20 bg-sky-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse border-2 border-sky-500/30">
                      <Camera size={40} className="text-sky-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">
                      {scanStep === 1 && "Paso 1: Foto Frontal"}
                      {scanStep === 2 && "Paso 2: Tabla Nutricional"}
                      {scanStep === 3 && "Paso 3: Código de Barras"}
                    </h3>
                    <p className="text-slate-400 text-sm mb-8 max-w-xs">
                      {scanStep === 1 && "Muestra el envase de frente para reconocer marca y nombre."}
                      {scanStep === 2 && "Asegura que el texto de la tabla sea legible."}
                      {scanStep === 3 && "Céntralo bien para extraer el código EAN."}
                    </p>
                    <label className="bg-sky-500 text-white px-10 py-5 rounded-3xl font-black text-lg flex items-center gap-4 cursor-pointer hover:bg-sky-600 transition-all shadow-xl active:scale-95">
                      <Camera size={28} />
                      CAPTURA {scanStep}/3
                      <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={capturePhoto} />
                    </label>
                    <button onClick={() => {setScanning(false); setScanStep(0);}} className="mt-10 text-slate-500 font-bold hover:text-white transition-colors underline underline-offset-8">Descartar escaneo</button>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-6" />
                    <h3 className="text-2xl font-bold mb-2">Nana está procesando...</h3>
                    <p className="text-slate-400 text-sm">Extrayendo datos con IA de bajo coste</p>
                  </div>
                )}
              </div>
            )}
          </div>


          {/* Fila: Marca, Proveedor y Código de Barras */}
          <div className="form-row flex gap-2 mb-4" style={{ display: 'flex', gap: '10px', flexWrap: 'nowrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
              <label className="form-label text-slate-500">Marca</label>
              <input
                className="form-input bg-slate-50"
                style={{ width: '100%', minWidth: 0 }}
                type="text"
                placeholder="Ej: Gallo"
                value={form.brand}
                onChange={e => set('brand', e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1.2, minWidth: 0 }}>
              <label className="form-label text-slate-500">Ref. Proveedor</label>
              <input
                className="form-input bg-slate-50"
                style={{ width: '100%', minWidth: 0 }}
                type="text"
                placeholder="Cód. Producto"
                value={form.provider_product_code}
                onChange={e => set('provider_product_code', e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1.8, minWidth: 0 }}>
              <label className="form-label text-slate-500">Código de Barras</label>
              <input
                className="form-input bg-slate-50 uppercase"
                style={{ width: '100%', minWidth: 0 }}
                type="text"
                placeholder="EAN"
                value={form.barcode}
                onChange={e => set('barcode', e.target.value)}
              />
            </div>
          </div>

          {/* Fila 1: Clasificación (Sin Selector de Unidad) */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <label className="form-label text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Categoría *</label>
              <div className="provider-filter-premium mt-0">
                <select
                  style={{ height: '42px', fontSize: '11px' }}
                  value={form.category_id}
                  onChange={e => { set('category_id', e.target.value); set('subcategory_id', ''); }}
                >
                  <option value="">— Elegir Categoría —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <label className="form-label text-slate-500 font-bold text-[10px] uppercase tracking-wider mb-1">Subcategoría *</label>
              <div className="provider-filter-premium mt-0">
                <select
                  style={{ height: '42px', fontSize: '11px' }}
                  value={form.subcategory_id}
                  onChange={e => set('subcategory_id', e.target.value)}
                  disabled={!form.category_id}
                >
                  <option value="">— Elegir Subcategoría —</option>
                  {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Fila 2: Datos de Factura */}
          <div className="form-row mb-4">
            <div className="form-group">
              <label className="form-label text-slate-500">
                Formato de Compra{' '}
                <span className="text-slate-400 font-normal text-[10px]">
                  {form.calculation_type === 'unidad' ? '(unidades/piezas)' : '(en gramos)'}
                </span>
              </label>
              <div 
                className="numpad-control bg-slate-50"
                onClick={() => setNumPad({ field: 'purchase_format', label: 'Formato de Compra', value: form.purchase_format })}
              >
                {form.purchase_format || <span className="numpad-placeholder">Ej: 5.000</span>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label text-slate-500">Precio de Compra (€)</label>
              <div 
                className="numpad-control bg-slate-50"
                onClick={() => setNumPad({ field: 'purchase_price', label: 'Precio de Compra', value: form.purchase_price })}
              >
                {form.purchase_price || <span className="numpad-placeholder">Ej: 8.50</span>}
              </div>
            </div>
          </div>

          {/* Fila 3: Logística */}
          <div className="form-row mb-6">
            <div className="form-group mb-6">
              <label className="form-label text-slate-500">Escenario de Salida</label>
              <div className="segmented-control">
                <button 
                  type="button"
                  className={`segment-btn ${form.calculation_type === 'peso' ? 'active' : ''}`}
                  onClick={() => set('calculation_type', 'peso')}
                >
                  <div className="icon-bg">
                    <Scale size={18} />
                  </div>
                  <span className="segment-label">Peso (Kg/L)</span>
                </button>
                <button 
                  type="button"
                  className={`segment-btn ${form.calculation_type === 'unidad' ? 'active' : ''}`}
                  onClick={() => set('calculation_type', 'unidad')}
                >
                  <div className="icon-bg">
                    <Package size={18} />
                  </div>
                  <span className="segment-label">Unidades (Pzs)</span>
                </button>
              </div>
            </div>
            <div className="form-group relative">
              <label className="form-label text-slate-500">Proveedor</label>
              <div className="provider-filter-premium mt-1">
                <select
                  value={form.provider_id}
                  onChange={e => set('provider_id', e.target.value)}
                >
                  <option value="">— Elegir Proveedor —</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {showAddProvider && (
                <div className="absolute top-full left-0 right-0 mt-1 p-3 bg-white shadow-2xl border border-slate-200 rounded-xl z-10 scale-in">
                  <input 
                    className="form-input mb-2"
                    placeholder="Nombre del proveedor..."
                    value={newProviderName}
                    onChange={e => setNewProviderName(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      className="btn-primary py-1 text-xs flex-1"
                      onClick={async () => {
                        if (!newProviderName) return;
                        const res = await addProvider(newProviderName);
                        if (res.success) {
                          set('provider_id', res.data.id);
                          setShowAddProvider(false);
                          setNewProviderName('');
                        }
                      }}
                    >
                      Guardar
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary py-1 text-xs"
                      onClick={() => setShowAddProvider(false)}
                    >
                      X
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {form.calculation_type === 'peso' && (
            <div className="space-y-4 mb-6 p-4 bg-sky-50/50 rounded-2xl border border-sky-100/50 scale-in">
              <div className="form-group">
                <div className="flex justify-between items-center mb-3">
                  <label className="form-label text-slate-500 font-bold m-0">% Merma / Cocción</label>
                  <div className="provider-filter-premium w-44" style={{ height: '36px' }}>
                    <select 
                      style={{ fontSize: '10px', height: '100%', padding: '0 24px 0 12px' }}
                      value={form.waste_type}
                      onChange={e => set('waste_type', e.target.value)}
                    >
                      <option value="Limpieza/Procesado">⚡ PROCESADO</option>
                      <option value="Cocción/Evaporación">🔥 COCCIÓN</option>
                      <option value="Fritura">🍳 FRITURA</option>
                      <option value="Desperdicio/Rotura">🗑️ ROTURA</option>
                    </select>
                  </div>
                </div>

                <div className="waste-adjuster-row flex items-center gap-4">
                  <div className="waste-adjuster">
                    <button 
                      type="button"
                      className="waste-btn"
                      onClick={() => set('waste_percentage', Math.max(-100, form.waste_percentage - 1))}
                    >
                      -
                    </button>
                    <div className="waste-input-wrapper">
                      <input 
                        type="number"
                        className="waste-input"
                        value={form.waste_percentage}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          set('waste_percentage', isNaN(val) ? 0 : Math.min(100, Math.max(-100, val)));
                        }}
                      />
                      <span className="waste-input-symbol">%</span>
                    </div>
                    <button 
                      type="button"
                      className="waste-btn"
                      onClick={() => set('waste_percentage', Math.min(100, form.waste_percentage + 1))}
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="flex-1">
                    <input 
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={form.waste_percentage}
                      onChange={e => set('waste_percentage', Number(e.target.value))}
                      className="w-full accent-navy"
                      style={{ height: '4px' }}
                    />
                    <div className="flex justify-between mt-1 px-1">
                      <span className="text-[9px] font-bold text-sky-600">HIDRATACIÓN (-)</span>
                      <span className="text-[9px] font-bold text-slate-400">0%</span>
                      <span className="text-[9px] font-bold text-red-400">MERMA (+)</span>
                    </div>
                  </div>
                </div> {/* CIERRE DE waste-adjuster-row */}
                {form.waste_percentage > 45 && (
                  <div className="mt-3 flex items-center gap-1.5 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 animate-pulse">
                    <AlertCircle size={14} />
                    <span className="text-[10px] font-black uppercase tracking-tight">Atención: Merma elevada detectada</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="relative" style={{
            backgroundColor: form.waste_percentage < -45 ? '#fff7ed' : '#f0f7ff',
            border: form.waste_percentage < -45 ? '1px solid #fed7aa' : '1px solid #bae6fd',
            borderRadius: '16px',
            padding: '20px',
            marginTop: '20px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
            transition: 'all 0.3s ease'
          }}>
            {!isNew && (
              <button 
                type="button"
                className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full transition-colors text-sky-600 shadow-sm"
                onClick={() => setShowHistory(!showHistory)}
                title="Ver histórico de precios"
              >
                <LineChart size={18} />
              </button>
            )}

            <span style={{
               fontSize: '11px',
               fontWeight: 900,
               color: form.waste_percentage < -45 ? '#9a3412' : '#64748b',
               textTransform: 'uppercase',
               letterSpacing: '0.05em',
               marginBottom: '4px'
            }}>COSTE NETO CALCULADO {form.calculation_type === 'peso' ? '(€/KG)' : '(€/UD)'}</span>
            <div style={{
               fontSize: '32px',
               fontWeight: 900,
               color: form.waste_percentage < -45 ? '#c2410c' : '#0c4a6e',
               lineHeight: 1
            }}>
              {(Number(dynamicCost) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€ 
              <span style={{ fontSize: '14px', opacity: 0.6, marginLeft: '4px' }}>
                {form.calculation_type === 'peso' ? '/ KG' : '/ UD'}
              </span>
            </div>
            {form.waste_percentage !== 0 && (
              <span style={{ fontSize: '10px', marginTop: '8px', fontWeight: 600, color: '#ef4444' }}>
                Impacto de {form.waste_type.toLowerCase()}: {Math.abs(form.waste_percentage)}%
              </span>
            )}

            {showHistory && !isNew && (
              <div className="mt-4 pt-4 border-t border-sky-100 animate-in slide-in-from-top-2 duration-300">
                <PriceHistory ingredientId={ingredient.id} />
              </div>
            )}
          </div>

          {/* Fila 4: PVP y Estado Tienda (v2.0.0) */}
          <div className="mt-6 p-4 bg-sky-50 rounded-2xl border border-sky-100">
            <div className="flex justify-between items-center mb-3">
              <label className="form-label text-sky-700 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 m-0">
                <Store size={14} /> Precio de Venta (PVP)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Visible TPV</span>
                <button
                  type="button"
                  onClick={() => set('is_published', !form.is_published)}
                  className={`w-10 h-5 rounded-full transition-all duration-300 relative ${form.is_published ? 'bg-sky-500' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${form.is_published ? 'left-5.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
            <div 
              className="numpad-control bg-white border-sky-100 text-sky-700 font-black text-xl text-center shadow-inner"
              onClick={handlePvpClick}
            >
              {form.sale_price ? `${(Number(form.sale_price) || 0).toFixed(2)}€` : <span className="text-sky-200">0.00€</span>}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isNew ? 'Añadir' : 'Guardar'}
            </button>
          </div>
        </form>

        {numPad && (
          <NumPad
            label={numPad.label}
            value={numPad.value}
            onClose={() => setNumPad(null)}
            onChange={(val) => {
              set(numPad.field, val);
              setNumPad(prev => ({ ...prev, value: val }));
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Ingredients() {
  const { ingredients, loading, error, updateIngredient, addIngredient, deleteIngredient, togglePublish } = useIngredients();
  const { providers } = useProviders();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [activeSubcategory, setActiveSubcategory] = useState('Todos');
  const [activeProvider, setActiveProvider] = useState('Todos');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [modal, setModal] = useState(null); // null | { ingredient, isNew }
  const [confirmDelete, setConfirmDelete] = useState(null); // null | ingredientId
  const [saving, setSaving] = useState(false);
  const [publishAction, setPublishAction] = useState(null);

  // Fetch all categories for filter
  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      setCategories(data || []);
    }
    load();
  }, []);

  // Fetch subcategories when activeCategory changes
  useEffect(() => {
    if (activeCategory === 'Todos') {
      setSubcategories([]);
      setActiveSubcategory('Todos');
      return;
    }
    async function load() {
      const { data } = await supabase
        .from('subcategories')
        .select('id, name')
        .eq('category_id', activeCategory)
        .order('name');
      setSubcategories(data || []);
      setActiveSubcategory('Todos');
    }
    load();
  }, [activeCategory]);

  const filteredIngredients = ingredients.filter(ing => {
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || ing.category_id === activeCategory;
    const matchesSubcategory = activeSubcategory === 'Todos' || ing.subcategory_id === activeSubcategory;
    const matchesProvider = activeProvider === 'Todos' || ing.provider_id === activeProvider;
    return matchesSearch && matchesCategory && matchesSubcategory && matchesProvider;
  });

  const presentLetters = [...new Set(filteredIngredients.map(ing => (ing.name || "")[0]?.toUpperCase()))].filter(Boolean);

  const scrollToLetter = (letter) => {
    const el = document.getElementById(`letter-${letter}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const openEdit = (ingredient) => setModal({ ingredient, isNew: false });
  const openAdd = () => setModal({ ingredient: {}, isNew: true });
  const closeModal = () => { setModal(null); setSaving(false); };

  const toggleSelection = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      let result;
      if (modal.isNew) result = await addIngredient(payload);
      else result = await updateIngredient(modal.ingredient.id, payload);
      
      setSaving(false);
      if (!result.success) alert(result.error);
      else closeModal();
    } catch (err) {
      setSaving(false);
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const result = await deleteIngredient(confirmDelete);
    if (!result.success) alert('Error: ' + result.error);
    setConfirmDelete(null);
  };

  const handleToggleStore = async (id, currentStatus, currentPrice) => {
    if (!currentStatus) {
      setPublishAction({ id, price: currentPrice?.toString() || '0' });
    } else {
      setSaving(true);
      const res = await togglePublish(id, true, currentPrice);
      setSaving(false);
      if (!res.success) alert(res.error);
    }
  };

  if (error) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-xl border border-red-100 m-4">
          <AlertCircle className="text-red-500 mb-2" size={32} />
          <h3 className="text-red-800 font-bold">Error de Conexión</h3>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container fade-in insumos-container">
      <div className="page-header" style={{ marginBottom: '0', paddingBottom: '8px' }}>
        <div>
          <h1 className="page-title">Insumos</h1>
          <p className="page-subtitle">Gestiona tus ingredientes y precios base de compra</p>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={() => window.location.href='/dashboard'} className="btn-dashboard">
            <LayoutGrid size={18}/>
            <span>Dashboard</span>
          </button>
          <button className="btn-icon-main" onClick={openAdd}>
            <Plus size={24} />
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bulk-action-bar fade-in">
          <div className="bulk-action-content">
            <div className="bulk-action-info">
              <div className="bulk-action-icon">
                <ShoppingBasket size={20} />
              </div>
              <div className="bulk-action-text">
                <span className="bulk-action-count">{selectedIds.length} productos</span>
                <span className="bulk-action-label">en tu lista</span>
              </div>
            </div>

            <button 
              className="bulk-action-btn"
              onClick={() => {
                console.log('--- CLICK DETECTADO ---');
                console.log('Estado actual de la lista:', selectedIds);
                setShowShoppingList(true);
              }}
            >
              <ShoppingBasket size={16} />
              REVISAR PEDIDO
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="search-wrapper flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ left: '16px', top: '50%', position: 'absolute', transform: 'translateY(-50%)' }} size={18} />
          <input 
            type="text" 
            placeholder="Buscar ingrediente..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="provider-filter-wrapper md:w-64">
          <div className="provider-filter-premium">
            <select 
              value={activeProvider}
              onChange={(e) => setActiveProvider(e.target.value)}
            >
              <option value="Todos">📦 Todos los Proveedores</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="category-tabs-wrapper">
        <div className="category-tabs">
          <button 
            className={`category-tab ${activeCategory === 'Todos' ? 'active' : ''}`}
            onClick={() => setActiveCategory('Todos')}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id} 
              className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {subcategories.length > 0 && (
        <div className="category-tabs-wrapper mb-6" style={{ marginTop: '-12px' }}>
          <div className="category-tabs">
            <button 
              className={`category-tab sub ${activeSubcategory === 'Todos' ? 'active' : ''}`}
              onClick={() => setActiveSubcategory('Todos')}
            >
              Cualquier subcategoría
            </button>
            {subcategories.map(sub => (
              <button 
                key={sub.id} 
                className={`category-tab sub ${activeSubcategory === sub.id ? 'active' : ''}`}
                onClick={() => setActiveSubcategory(sub.id)}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Layout Principal: Flexbox para separar Abecedario y Lista (v2.3.2) */}
      <div className="insumos-layout-wrapper">
        <AlphabetSidebar scrollToLetter={scrollToLetter} presentLetters={presentLetters} />


        <section className="card-grid-container">
          {loading && !ingredients.length ? (
            <div className="insumos-grid">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" style={{ height: '80px', background: '#f1f5f9', borderRadius: '16px' }} />
              ))}
            </div>
          ) : (
            <div className="insumos-grid">
              {filteredIngredients.map((ingredient, idx) => {
                const firstLetter = (ingredient.name || "")[0]?.toUpperCase() || "#";
                const isFirstOfLetter = idx === 0 || (filteredIngredients[idx - 1].name || "")[0]?.toUpperCase() !== firstLetter;
                
                return (
                  <div 
                    key={ingredient.id} 
                    id={isFirstOfLetter ? `letter-${firstLetter}` : undefined}
                    className={`insumo-card ${selectedIds.includes(ingredient.id) ? 'selected' : ''}`} 
                    onClick={(e) => {
                      if (selectedIds.length > 0) {
                        toggleSelection(ingredient.id, e);
                      } else {
                        openEdit(ingredient);
                      }
                    }}
                  >
                    <div 
                      className={`selection-checkbox ${selectedIds.includes(ingredient.id) ? 'active' : ''}`}
                      onClick={(e) => toggleSelection(ingredient.id, e)}
                    >
                      {selectedIds.includes(ingredient.id) && <CheckCircle2 size={16} />}
                    </div>

                    <div className="card-avatar">
                      {ingredient.image_url ? (
                        <img src={ingredient.image_url} alt={ingredient.name} loading="lazy" />
                      ) : (
                        <div className="avatar-initials">
                          {ingredient.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="card-info-center">
                      <h3 className="card-name-bold">{ingredient.name}</h3>
                      <div className="flex items-center gap-2">
                        <p className="card-subtext">
                          {ingredient.category_name || 'General'} · {ingredient.brand || 'S/M'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="card-price-right">
                      <div className="price-main">
                        {/* ✅ FIX: Usar exclusivamente net_cost_per_unit de la base de datos */}
                        {(Number(ingredient.net_cost_per_unit) || 0).toFixed(2)} €
                      </div>
                      <div className="price-unit-label">
                        {ingredient.calculation_type === 'unidad' ? '/ UD' : '/ KG'}
                      </div>
                    </div>


                    <div className="card-actions-subtle flex items-center gap-2">
                      <button 
                        className={`p-2 rounded-lg transition-all ${ingredient.is_published ? 'btn-published-blue' : 'text-slate-300 hover:bg-slate-100'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStore(ingredient.id, ingredient.is_published, ingredient.sale_price);
                        }}
                        title={ingredient.is_published ? "Quitar de la tienda" : "Enviar a la tienda"}
                      >
                        <Store size={18} />
                      </button>
                      <button 
                        className="delete-btn-subtle"
                        style={{ opacity: 0.3 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(ingredient.id);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {!loading && filteredIngredients.length === 0 && (
                <div className="text-center py-12" style={{ textAlign: 'center', padding: '48px 0' }}>
                  <Carrot className="mx-auto text-slate-200 mb-4" size={48} style={{ margin: '0 auto 16px', color: '#e2e8f0' }} />
                  <p style={{ color: '#94a3b8' }}>No se encontraron insumos</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {modal && (
        <IngredientModal
          ingredient={modal.ingredient}
          onClose={closeModal}
          onSave={handleSave}
          loading={saving}
        />
      )}

      {publishAction && (
        <NumPad
          label="Precio de Venta (PVP)"
          value={publishAction.price}
          onChange={(val) => setPublishAction(prev => ({ ...prev, price: val }))}
          onClose={async () => {
            setSaving(true);
            const res = await togglePublish(publishAction.id, false, publishAction.price);
            setSaving(false);
            setPublishAction(null);
            if (!res.success) alert(res.error);
          }}
        />
      )}

      <ConfirmationModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="¿Eliminar insumo?"
        message="Esta acción no se puede deshacer y podría afectar a las recetas que usan este ingrediente."
      />

      {showShoppingList && (
        <ShoppingListModal 
          selectedItems={selectedIds}
          ingredients={ingredients}
          providers={providers}
          onClose={() => setShowShoppingList(false)}
          onClearSelection={() => {
            setSelectedIds([]);
            setShowShoppingList(false);
          }}
        />
      )}
    </div>
  );
}
