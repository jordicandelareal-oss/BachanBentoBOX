import React, { useState, useEffect } from 'react';
import { useIngredients } from '../hooks/useIngredients';
import { useUnits } from '../hooks/useUnits';
import { supabase } from '../lib/supabaseClient';
import { Carrot, Search, Plus, AlertCircle, Loader2, ChevronRight, X, Save, Trash2, Camera, Scan, Image as ImageIcon, RotateCcw, Sparkles } from 'lucide-react';
import ConfirmationModal from '../components/Common/ConfirmationModal';
import NumPad from '../components/Common/NumPad';
import { compressImage, uploadImage, blobToBase64 } from '../lib/imageUtils';
import { processCommand } from '../lib/geminiClient';
import '../styles/Common.css';
import './Ingredients.css';

import PhotoSelector from '../components/Common/PhotoSelector';

// ─── Modal Component ──────────────────────────────────────────────────────────
function IngredientModal({ ingredient, onClose, onSave, loading }) {
  const { units } = useUnits();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [numPad, setNumPad] = useState(null); // { field, label, value }

  const isNew = !ingredient.id;

  const [form, setForm] = useState({
    name: ingredient.name || '',
    purchase_format: ingredient.purchase_format || '',
    purchase_price: ingredient.purchase_price ?? '',
    cost_per_unit: ingredient.cost_per_unit ?? '',
    provider: ingredient.provider || '',
    unit_id: ingredient.unit_id || '',
    category_id: ingredient.category_id || '',
    subcategory_id: ingredient.subcategory_id || '',
    image_url: ingredient.image_url || '',
    brand: ingredient.brand || '',
    barcode: ingredient.barcode || '',
    provider: ingredient.provider || '',
  });

  const [scanning, setScanning] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]); // Array of base64 strings
  const [scanStep, setScanStep] = useState(0); // 0: Idle, 1: Front, 2: Table, 3: Barcode
  const [suggesting, setSuggesting] = useState(false);
  const [suggestedImage, setSuggestedImage] = useState(null); // { url, source }
  const [suggestedGallery, setSuggestedGallery] = useState([]); // Array of { url, source }

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
    setSuggestedImage(null);
  };

  const handleSuggestImage = async () => {
    if (!form.name) {
      alert('Primero introduce el nombre del ingrediente.');
      return;
    }
    
    setSuggesting(true);
    setSuggestedImage(null);
    setSuggestedGallery([]);
    
    try {
      const queryContext = `Producto: "${form.name}" ${form.brand ? '| Marca: ' + form.brand : ''} ${form.provider ? '| Proveedor: ' + form.provider : ''}`;
      
      const prompt = `
        Necesito una imagen de CATÁLOGO (fondo blanco, estilo supermercado) para: ${queryContext}.
        
        USA 'suggestSearchQuery' con términos en inglés que incluyan SIEMPRE:
        "product white background supermarket" o "food ingredient isolated"
        
        Ejemplo para brócoli: query="broccoli product white background ingredient isolated"
        Ejemplo para atún: query="canned tuna product supermarket catalog food"
        Ejemplo para queso: query="cheese product food ingredient white background"
        
        NUNCA uses: "dish", "meal", "restaurant", "cooked", "plate" — queremos el ingrediente crudo o envasado.
      `;
      
      console.log('🔍 [Nana Search] Sending prompt to Nana...');
      const response = await processCommand(prompt, { currentForm: form });
      console.log('🔍 [Nana Search] Full response:', response);

      if (!response.toolCalls || response.toolCalls.length === 0) {
        // Nana responded in text only — use the ingredient name directly as fallback query
        console.warn('🔍 [Nana Search] No tool call returned, falling back to direct Pexels search');
        await fetchFromPexels(form.name + ' food');
        return;
      }

      // 1. Best case: Nana suggests a search query → call Pexels for real photos
      const searchQueryCall = response.toolCalls.find(c => c.name === 'suggestSearchQuery');
      if (searchQueryCall) {
        const query = searchQueryCall.args.query || searchQueryCall.args.query_es || form.name;
        console.log('✅ [Nana Search] Query suggested by Nana:', query);
        await fetchFromPexels(query);
        return;
      }

      // 2. Legacy: Nana suggests a gallery of URLs
      const galleryCall = response.toolCalls.find(c => c.name === 'suggestProductGallery');
      if (galleryCall && galleryCall.args.images && galleryCall.args.images.length > 0) {
        console.log('✅ [Nana Search] Gallery suggested:', galleryCall.args.images);
        setSuggestedGallery(galleryCall.args.images);
        setSuggestedImage(galleryCall.args.images[0]);
        return;
      }

      // 3. Legacy: single URL from Nana
      const suggestCall = response.toolCalls.find(c => c.name === 'suggestProductImage');
      if (suggestCall && suggestCall.args.image_url) {
        console.log('✅ [Nana Search] Single URL suggested:', suggestCall.args.image_url);
        setSuggestedImage({ url: suggestCall.args.image_url, source: suggestCall.args.source || 'Catálogo' });
        return;
      }

      // 4. Hard fallback: search Pexels with the ingredient name directly
      console.warn('🔍 [Nana Search] No valid tool call, using direct Pexels fallback');
      await fetchFromPexels(form.name + ' food ingredient');

    } catch (err) {
      console.error('❌ [Nana Search] Error:', err);
      alert('Hubo un problema al buscar la foto: ' + err.message);
    } finally {
      setSuggesting(false);
    }
  };

  // Real photo search via Pexels API (free, no CORS, high quality)
  const fetchFromPexels = async (query) => {
    try {
      console.log('📸 [Pexels] Searching for:', query);
      // Pexels API key (free tier: 200 req/hour, no auth for public images)
      const PEXELS_KEY = import.meta.env.VITE_PEXELS_KEY;
      const resp = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=6&orientation=square`,
        { headers: { Authorization: PEXELS_KEY || '' } }
      );
      
      if (!resp.ok) {
        // Pexels requires auth — fall back to a simple unpslash source URL
        console.warn('📸 [Pexels] Not configured, using Unsplash source fallback');
        const unsplashUrl = `https://source.unsplash.com/300x300/?${encodeURIComponent(query)}`;
        setSuggestedImage({ url: unsplashUrl, source: 'Unsplash' });
        return;
      }

      const data = await resp.json();
      console.log('📸 [Pexels] Results:', data.photos?.length, 'photos found');

      if (data.photos && data.photos.length > 0) {
        const gallery = data.photos.map(p => ({
          url: p.src.medium,
          source: `Pexels | ${p.photographer}`
        }));
        setSuggestedGallery(gallery);
        setSuggestedImage(gallery[0]);
      } else {
        // Nothing found on Pexels — try Unsplash source as last resort
        const unsplashUrl = `https://source.unsplash.com/300x300/?${encodeURIComponent(query)}`;
        setSuggestedImage({ url: unsplashUrl, source: 'Unsplash (fallback)' });
      }
    } catch (pexelsErr) {
      console.error('📸 [Pexels] Error:', pexelsErr);
      // Ultimate fallback: Unsplash source URL (always works, no API key)
      const unsplashUrl = `https://source.unsplash.com/300x300/?${encodeURIComponent(query)}`;
      setSuggestedImage({ url: unsplashUrl, source: 'Unsplash (fallback)' });
    }
  };

  // CORS-safe image proxy — wraps external URLs that may block cross-origin requests
  const proxyImageUrl = (url) => {
    if (!url) return url;
    // Pexels and Unsplash CDNs are already CORS-safe; others go through weserv.nl
    if (url.includes('pexels.com') || url.includes('unsplash.com') || url.includes('images.pexels')) return url;
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=300&h=300&fit=cover`;
  };

  const handleSelectGalleryItem = (item) => {
    setSuggestedImage(item);
  };

  const handleAcceptSuggestion = async () => {
    if (!suggestedImage) return;
    
    setSuggesting(true); // Re-use suggesting for loading state
    try {
      const { uploadFromUrl } = await import('../lib/imageUtils');
      const publicUrl = await uploadFromUrl(suggestedImage.url);
      set('image_url', publicUrl);
      setSuggestedImage(null);
    } catch (err) {
      alert('Error al descargar/subir la imagen sugerida: ' + err.message);
    } finally {
      setSuggesting(false);
    }
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
    const payload = {
      name: form.name,
      purchase_format: form.purchase_format ? parseFloat(form.purchase_format) : null,
      purchase_price: form.purchase_price !== '' ? parseFloat(form.purchase_price) : null,
      provider: form.provider || null,
      unit_id: form.unit_id || null,
      category_id: form.category_id || null,
      subcategory_id: form.subcategory_id || null,
      image_url: form.image_url || null,
      brand: form.brand || null,
      barcode: form.barcode || null,
    };
    await onSave(payload);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
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

            {/* Sugerencia de IA: Modo Galería */}
            <div className="mt-4">
              {!suggestedImage && !suggestedGallery.length ? (
                <button 
                  type="button"
                  onClick={handleSuggestImage}
                  disabled={suggesting || !form.name}
                  className={`w-full py-4 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    suggesting ? 'bg-slate-100 text-slate-400' : 'bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-100'
                  }`}
                >
                  {suggesting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  {suggesting ? 'Nana buscando opciones...' : 'Sugerir galería con IA'}
                </button>
              ) : (
                <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100 animate-in fade-in slide-in-from-top-4">
                  {/* Carrusel de Galería */}
                  {suggestedGallery.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-2">
                      {suggestedGallery.map((item, idx) => (
                        <div 
                          key={idx}
                          role="button"
                          onClick={() => handleSelectGalleryItem(item)}
                          className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 cursor-pointer transition-all ${
                            suggestedImage?.url === item.url ? 'border-sky-500 scale-105 shadow-md shadow-sky-100' : 'border-white opacity-50'
                          }`}
                        >
                          <img src={item.url} alt={`Opción ${idx}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Previsualización del seleccionado */}
                  <div className="flex items-center gap-4 bg-white/50 p-2 rounded-xl mb-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-white shadow-sm flex-shrink-0">
                      <img src={suggestedImage?.url} alt="Sugerencia" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-sky-800 uppercase tracking-widest">Opción Seleccionada</p>
                      <p className="text-[11px] text-sky-600 line-clamp-1">{suggestedImage?.source || 'Catálogo Profesional'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={handleAcceptSuggestion}
                      disabled={suggesting}
                      className="flex-1 py-3 bg-sky-500 text-white rounded-xl text-xs font-black shadow-lg shadow-sky-200 active:scale-95 disabled:opacity-50"
                    >
                      {suggesting ? 'GUARDANDO...' : 'ACEPTAR ESTA FOTO'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setSuggestedImage(null); setSuggestedGallery([]); }}
                      className="px-4 py-3 bg-white text-slate-400 rounded-xl text-xs font-bold border border-slate-200"
                    >
                      X
                    </button>
                  </div>
                </div>
              )}
            </div>

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
              <label className="form-label text-slate-500">Proveedor</label>
              <input
                className="form-input bg-slate-50"
                style={{ width: '100%', minWidth: 0 }}
                type="text"
                placeholder="Ej: Mercadona"
                value={form.provider}
                onChange={e => set('provider', e.target.value)}
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

          {/* Fila 1: Clasificación */}
          <div className="form-row mb-4">
            <div className="form-group">
              <label className="form-label text-slate-500">Categoría <span className="text-red-500">*</span></label>
              <select
                className="form-input form-select bg-slate-50"
                value={form.category_id}
                onChange={e => { set('category_id', e.target.value); set('subcategory_id', ''); }}
              >
                <option value="">— Elegir —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label text-slate-500">Subcategoría <span className="text-red-500">*</span></label>
              <select
                className="form-input form-select bg-slate-50"
                value={form.subcategory_id}
                onChange={e => set('subcategory_id', e.target.value)}
                disabled={!form.category_id}
              >
                <option value="">— Elegir —</option>
                {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Fila 2: Datos de Factura */}
          <div className="form-row mb-4">
            <div className="form-group">
              <label className="form-label text-slate-500">Formato de Compra</label>
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
            <div className="form-group">
              <label className="form-label text-slate-500">Unidad Base</label>
              <select
                className="form-input form-select bg-slate-50"
                value={form.unit_id}
                onChange={e => set('unit_id', e.target.value)}
              >
                <option value="">— Sin unidad —</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label text-slate-500">Proveedor</label>
              <input
                className="form-input bg-slate-50"
                type="text"
                placeholder="Ej: Mercadona"
                value={form.provider}
                onChange={e => set('provider', e.target.value)}
              />
            </div>
          </div>

          {/* Fila 4: Resultado Operativo */}
          <div style={{
            backgroundColor: '#f0f7ff',
            border: '1px solid #bae6fd',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '20px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <span style={{
               fontSize: '12px',
               fontWeight: 700,
               color: '#64748b',
               textTransform: 'uppercase'
            }}>COSTE NETO CALCULADO</span>
            <div style={{
               fontSize: '24px',
               fontWeight: 800,
               color: '#0c4a6e'
            }}>
              {form.purchase_format && form.purchase_price && parseFloat(form.purchase_format) > 0
                ? `${(parseFloat(form.purchase_price) / parseFloat(form.purchase_format)).toFixed(2)}`
                : ingredient.cost_per_unit
                  ? `${parseFloat(ingredient.cost_per_unit).toFixed(2)}`
                  : '0.00'}€ {form.unit_id ? `/ ${units.find(u => u.id === form.unit_id)?.name || ''}` : ''}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading || !canSave}>
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
  const { ingredients, loading, error, updateIngredient, addIngredient, deleteIngredient } = useIngredients();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [activeSubcategory, setActiveSubcategory] = useState('Todos');
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [modal, setModal] = useState(null); // null | { ingredient, isNew }
  const [confirmDelete, setConfirmDelete] = useState(null); // null | ingredientId
  const [saving, setSaving] = useState(false);

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
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const presentLetters = [...new Set(filteredIngredients.map(ing => ing.name[0]?.toUpperCase()))].filter(Boolean);

  const scrollToLetter = (letter) => {
    const el = document.getElementById(`letter-${letter}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const openEdit = (ingredient) => setModal({ ingredient, isNew: false });
  const openAdd = () => setModal({ ingredient: {}, isNew: true });
  const closeModal = () => { setModal(null); setSaving(false); };

  const handleSave = async (payload) => {
    setSaving(true);
    let result;
    if (modal.isNew) {
      result = await addIngredient(payload);
    } else {
      result = await updateIngredient(modal.ingredient.id, payload);
    }
    setSaving(false);
    if (!result.success) {
      alert('Error al guardar: ' + result.error);
    } else {
      closeModal();
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const result = await deleteIngredient(confirmDelete);
    if (!result.success) {
      alert('Error al eliminar: ' + result.error);
    }
    setConfirmDelete(null);
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
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Insumos</h1>
          <p className="page-subtitle">Gestiona tus ingredientes y precios base de compra</p>
        </div>
        <button className="btn-icon-main" onClick={openAdd}>
          <Plus size={24} />
        </button>
      </div>

      <div className="search-wrapper mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ left: '16px', top: '50%', position: 'absolute', transform: 'translateY(-50%)' }} size={18} />
        <input 
          type="text" 
          placeholder="Buscar ingrediente..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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

      {loading && !ingredients.length ? (
        <div className="card-grid">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" style={{ height: '80px', background: '#f1f5f9', borderRadius: '16px' }} />
          ))}
        </div>
      ) : (
        <div className="card-grid">
          {filteredIngredients.map((ingredient, idx) => {
            const firstLetter = ingredient.name[0]?.toUpperCase();
            const isFirstOfLetter = idx === 0 || filteredIngredients[idx - 1].name[0]?.toUpperCase() !== firstLetter;
            
            return (
              <div 
                key={ingredient.id} 
                id={isFirstOfLetter ? `letter-${firstLetter}` : undefined}
                className="premium-card" 
                onClick={() => openEdit(ingredient)}
              >
                {/* IZQUIERDA: AVATAR */}
                <div className="card-avatar">
                  {ingredient.image_url ? (
                    <img src={ingredient.image_url} alt={ingredient.name} loading="lazy" />
                  ) : (
                    <div className="avatar-initials">
                      {ingredient.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* CENTRO: INFO */}
                <div className="card-info-center">
                  <h3 className="card-name-bold">{ingredient.name}</h3>
                  <p className="card-subtext">
                    {ingredient.category_name || 'General'} · {ingredient.brand || 'S/M'}
                  </p>
                </div>
                
                {/* DERECHA: PRECIO */}
                <div className="card-price-right">
                  <div className="price-main">
                    {(() => {
                      const cost = parseFloat(ingredient.cost_per_unit || 0);
                      const unit = (ingredient.unit_name || '').toLowerCase();
                      const isBaseUnit = ['g', 'ml', 'kg', 'l', 'kilo', 'litro'].some(u => unit.includes(u));
                      
                      if (isBaseUnit && cost > 0) {
                        return `${(cost * 1000).toFixed(2)}€`;
                      }
                      return `${cost.toFixed(2)}€`;
                    })()}
                  </div>
                  <div className="price-unit-label">
                    / {ingredient.unit_name || 'unid'}
                  </div>
                </div>

                {/* ACCIONES */}
                <div className="card-actions-subtle">
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
                  <ChevronRight size={16} className="text-slate-200" />
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

      {modal && (
        <IngredientModal
          ingredient={modal.ingredient}
          onClose={closeModal}
          onSave={handleSave}
          loading={saving}
        />
      )}

      <ConfirmationModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="¿Eliminar insumo?"
        message="Esta acción no se puede deshacer y podría afectar a las recetas que usan este ingrediente."
      />

      {/* A-Z Sidebar */}
      <div className="alphabet-sidebar">
        {alphabet.map(letter => {
          const isPresent = presentLetters.includes(letter);
          return (
            <button
              key={letter}
              className={`alphabet-letter ${isPresent ? 'present' : 'absent'}`}
              onClick={() => isPresent && scrollToLetter(letter)}
              disabled={!isPresent}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}
