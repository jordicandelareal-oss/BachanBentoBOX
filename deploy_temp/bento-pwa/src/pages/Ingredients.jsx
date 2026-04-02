import React, { useState, useEffect } from 'react';
import { useIngredients } from '../hooks/useIngredients';
import { useUnits } from '../hooks/useUnits';
import { supabase } from '../lib/supabaseClient';
import { Carrot, Search, Plus, AlertCircle, Loader2, ChevronRight, X, Save, Trash2, Camera, Scan, Image as ImageIcon, RotateCcw, Sparkles, Scale, Package, Store } from 'lucide-react';
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
    calculation_type: ingredient.calculation_type || 'peso',
    waste_percentage: ingredient.waste_percentage || 0,
    is_published: ingredient.is_published || false,
    sale_price: ingredient.sale_price || 0,
  });

  const [scanning, setScanning] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]); // Array of base64 strings
  const [scanStep, setScanStep] = useState(0); // 0: Idle, 1: Front, 2: Table, 3: Barcode
  const [suggesting, setSuggesting] = useState(false);
  const [suggestedImage, setSuggestedImage] = useState(null); // { url, source }
  const [suggestedGallery, setSuggestedGallery] = useState([]); // Array of { url, source }
  const [imageError, setImageError] = useState(false);
  const [apiDiagnostic, setApiDiagnostic] = useState({ 
    key: false, 
    cx: false, 
    error: null, 
    reason: null,
    maskKey: '',
    maskCx: '',
    testResult: null
  });


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
    setImageError(false);
    
    try {
      const queryContext = `Producto: "${form.name}" ${form.brand ? '| Marca: ' + form.brand : ''} ${form.provider ? '| Proveedor: ' + form.provider : ''}`;
      
      const prompt = `
        Necesito encontrar la foto oficial de catálogo para este producto: ${queryContext}.
        
        USA 'suggestSearchQuery' con este formato exacto:
        query="${form.name} raw ingredient isolated white background"
        
        NUNCA uses palabras sobre recetas o platos cocinados. Solo foto de producto crudo o envase.
      `;
      
      console.log('🔍 [Nana Search] Sending prompt to Nana...');
      const response = await processCommand(prompt, { currentForm: form });
      console.log('🔍 [Nana Search] Full response:', response);

      if (!response.toolCalls || response.toolCalls.length === 0) {
        console.warn('🔍 [Nana Search] No tool call returned, falling back to direct search');
        await fetchProductPhotos(`${form.name} raw ingredient isolated white background`);
        return;
      }

      // 1. Best case: Nana suggests a search query → call Google/Pexels
      const searchQueryCall = response.toolCalls.find(c => c.name === 'suggestSearchQuery');
      if (searchQueryCall) {
        const query = searchQueryCall.args.query_es || searchQueryCall.args.query || `${form.name} raw ingredient isolated white background`;
        console.log('✅ [Nana Search] Query suggested by Nana:', query);
        await fetchProductPhotos(query);
        return;
      }

      // 2. Legacy callbacks
      const galleryCall = response.toolCalls.find(c => c.name === 'suggestProductGallery');
      if (galleryCall && galleryCall.args.images && galleryCall.args.images.length > 0) {
        setSuggestedGallery(galleryCall.args.images);
        setSuggestedImage(galleryCall.args.images[0]);
        return;
      }

      const suggestCall = response.toolCalls.find(c => c.name === 'suggestProductImage');
      if (suggestCall && suggestCall.args.image_url) {
        setSuggestedImage({ url: suggestCall.args.image_url, source: suggestCall.args.source || 'Catálogo' });
        return;
      }

      await fetchProductPhotos(`${form.name} raw ingredient isolated white background`);

    } catch (err) {
      console.error('❌ [Nana Search] Error:', err);
      alert('Hubo un problema al buscar la foto: ' + err.message);
    } finally {
      setSuggesting(false);
    }
  };

  // Buscador de fotos en cascada: Google API (Prioridad) -> Pexels API -> Wikipedia
  const fetchProductPhotos = async (queryParam) => {
    const applyProxy = (url) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=300&h=300&fit=cover`;

    try {
      const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
      const GOOGLE_CX = import.meta.env.VITE_GOOGLE_CX;
      const PEXELS_KEY = import.meta.env.VITE_PEXELS_KEY;

      // 🔍 [LOGS DE VERIFICACIÓN]
      console.log('🔍 [Config] VITE_GOOGLE_API_KEY:', GOOGLE_API_KEY ? 'CARGADA' : 'FALTA');
      console.log('🔍 [Config] VITE_GOOGLE_CX:', GOOGLE_CX ? 'CARGADA' : 'FALTA');

      const mask = (str) => str ? `${str.substring(0, 5)}...${str.substring(str.length - 5)}` : '---';

      setApiDiagnostic({ 
        key: !!GOOGLE_API_KEY, 
        cx: !!GOOGLE_CX, 
        error: null,
        reason: null,
        maskKey: mask(GOOGLE_API_KEY),
        maskCx: mask(GOOGLE_CX)
      });

      const testGoogle = async () => {
        if (!GOOGLE_API_KEY || !GOOGLE_CX) return;
        setApiDiagnostic(prev => ({ ...prev, testResult: 'Probando...' }));
        try {
          // Búsqueda pura sin searchType=image para verificar conectividad
          const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=test&num=1`;
          const resp = await fetch(url);
          const data = await resp.json();
          if (resp.ok) {
            setApiDiagnostic(prev => ({ ...prev, testResult: 'CONECTADO (Texto OK)' }));
          } else {
            setApiDiagnostic(prev => ({ ...prev, testResult: `FALLO: ${data.error?.message || 'Error desconocido'}` }));
          }
        } catch (e) {
          setApiDiagnostic(prev => ({ ...prev, testResult: `ERROR RED: ${e.message}` }));
        }
      };

      const searchGoogle = async (term, retryCount = 0) => {
        if (!GOOGLE_API_KEY || !GOOGLE_CX) return { items: [] };
        
        const cleanTerm = term.replace(/\s+/g, '+');
        console.log(`Iniciado búsqueda Google v1.4.1 (Intento ${retryCount + 1}) para: ${cleanTerm}`);
        
        try {
          const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&searchType=image&q=${cleanTerm}&num=8`;
          
          const resp = await fetch(url, { 
            headers: { 'Accept': 'application/json' }
          });

          if (!resp.ok) {
            const errorData = await resp.json();
            const errMsg = errorData.error?.message || `Error ${resp.status}`;
            const errReason = errorData.error?.errors?.[0]?.reason || 'unknown';
            console.error('❌ [Google API Error]:', errorData);
            setApiDiagnostic(prev => ({ ...prev, error: errMsg, reason: errReason }));
            return { items: [] };
          }

          const data = await resp.json();
          setApiDiagnostic(prev => ({ ...prev, error: null, reason: null }));
          return data;
        } catch (err) {
          console.error('❌ [Network Error]:', err);
          setApiDiagnostic(prev => ({ ...prev, error: err.message, reason: 'network_error' }));
          return { items: [] };
        }
      };

      const searchPexels = async (term) => {
        if (!PEXELS_KEY) return { photos: [] }; 
        console.log('📸 [Pexels] Iniciando búsqueda para:', term);
        const headers = { Authorization: PEXELS_KEY.trim() };
        const resp = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(term)}&per_page=6&orientation=square&locale=es-ES`,
          { headers }
        );
        if (!resp.ok) return { photos: [] };
        return await resp.json();
      };

      const searchWikipedia = async (term) => {
        try {
          const wResp = await fetch(`https://es.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(term)}&gsrlimit=1&prop=pageimages&format=json&piprop=original&origin=*`);
          const wData = await wResp.json();
          const pages = wData.query?.pages;
          if (pages) {
            const pageId = Object.keys(pages)[0];
            if (pageId !== '-1' && pages[pageId].original?.source) {
              return pages[pageId].original.source;
            }
          }
          return null;
        } catch(e) { return null; }
      };

      let gallery = [];
      const mainSearchTerm = queryParam || form.name;
      const hasGoogleKeys = !!(GOOGLE_API_KEY && GOOGLE_CX);
      if (hasGoogleKeys) {
        // --- MODO ESTRICTO GOOGLE v1.4.1 (Con Fallback Automático) ---
        let gData = await searchGoogle(mainSearchTerm, 0);
        
        // Segundo intento con términos simplificados si el primero falló (o dio 403)
        if (!gData.items?.length) {
          console.warn('⚠️ [Google] Reintentando con términos simples...');
          gData = await searchGoogle(form.name, 1);
        }
        
        if (gData.items?.length) {
          gallery = gData.items.slice(0, 8).map(p => ({
            url: applyProxy(p.link),
            source: `Google | ${p.displayLink}`
          }));
        } else {
          console.warn('⚠️ [Google] Fallo persistente. Activando Fallback Wikipedia...');
          const wikiUrl = await searchWikipedia(form.name);
          if (wikiUrl) {
            gallery.push({ url: applyProxy(wikiUrl), source: 'Wikipedia (Auto-Fallback)' });
          }
        }
      } else {
        // --- MODO FALLBACK (Wikipedia / Pexels) Solo si NO hay Google ---
        console.warn('⚠️ [Aviso] Llaves de Google ausentes. Usando motores secundarios.');
        
        // Intentar con Pexels
        if (PEXELS_KEY) {
          let data = await searchPexels(`${form.name} raw ingredient isolated white background`);
          if (data.photos?.length) {
            gallery = data.photos.map(p => ({
              url: applyProxy(p.src.medium),
              source: `Pexels | ${p.photographer}`
            }));
          }
        }

        // Si Pexels falló, intentar Wikipedia
        if (gallery.length === 0) {
          const wikiUrl = await searchWikipedia(form.name);
          if (wikiUrl) {
            gallery.push({
              url: applyProxy(wikiUrl),
              source: 'Wikipedia Commons'
            });
          }
        }
      }

      // Fallback final de emergencia (Solo si realmente no hay NADA tras los intentos permitidos)
      if (gallery.length === 0) {
        const textImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name)}&size=300&background=f0f9ff&color=0284c7&font-size=0.4&length=2`;
        gallery.push({ url: textImg, source: 'Icono Base' });
      }

      setSuggestedGallery(gallery);
      setSuggestedImage(gallery[0]);

    } catch (err) {
      console.error('📸 [Search] Error Crítico:', err);
      // Fallback seguro antierrores
      const textImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name)}&size=300&background=fef2f2&color=dc2626&font-size=0.4&length=2`;
      const option = { url: textImg, source: 'Sin Imagen' };
      setSuggestedGallery([option]);
      setSuggestedImage(option);
      setImageError(false); // La imagen generada no debería fallar
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
    e.stopPropagation(); // Evita que se propague a los padres (ej. el overlay del modal)
    
    const format = form.purchase_format ? parseFloat(form.purchase_format) : 0;
    const price = form.purchase_price !== '' ? parseFloat(form.purchase_price) : 0;
    // cost_per_unit is now calculated on the server by a Supabase Trigger

    const payload = {
      name: form.name,
      purchase_format: format || null,
      purchase_price: price || null,
      provider: form.provider || null,
      unit_id: form.calculation_type === 'peso' ? 'c39f0ea5-5325-4876-8395-940b4995ce4a' : '6b013d2c-2079-41fc-a210-2f8e1cb11e41',
      category_id: form.category_id || null,
      subcategory_id: form.subcategory_id || null,
      image_url: form.image_url || null,
      brand: form.brand || null,
      barcode: form.barcode || null,
      calculation_type: form.calculation_type,
      waste_percentage: form.waste_percentage || 0,
      is_published: form.is_published || false,
      sale_price: form.sale_price !== '' ? parseFloat(form.sale_price) : 0,
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

  const formatVal = parseFloat(form.purchase_format) || 0;
  const priceVal = parseFloat(form.purchase_price) || 0;
  let dynamicCost = 0;
  if (formatVal > 0) {
    if (form.calculation_type === 'unidad') {
      dynamicCost = priceVal / formatVal;
    } else {
      dynamicCost = (priceVal / formatVal) * 1000;
    }
  }

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
                  {/* --- PANEL DE DIAGNÓSTICO v1.4.0 --- */}
                  <div className="mb-4 p-3 bg-white/80 rounded-xl border border-sky-200 text-[9px] font-mono leading-tight">
                    <div className="mb-2 pb-2 border-b border-sky-100">
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-500 uppercase">Key:</span>
                        <span className="text-slate-700 font-bold">{apiDiagnostic.maskKey}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-500 uppercase">CX:</span>
                        <span className="text-slate-700 font-bold">{apiDiagnostic.maskCx}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); testGoogle(); }}
                        className="w-full py-1.5 bg-sky-500 text-white rounded-md font-bold uppercase hover:bg-sky-600 transition-colors"
                      >
                        {apiDiagnostic.testResult || 'Test Conectividad Google'}
                      </button>
                    </div>
                    {apiDiagnostic.error && (
                      <div className="pt-1 italic break-words">
                        <div className="text-rose-600 font-bold mb-1 uppercase">⚠️ ERROR: {apiDiagnostic.error}</div>
                        {apiDiagnostic.reason && (
                          <div className="text-slate-500 text-[8px] bg-rose-50 p-1 rounded font-bold">MOTIVO: {apiDiagnostic.reason}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cuadrícula de Galería (3 columnas) */}
                  {suggestedGallery.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Opciones encontradas:</p>
                      <div className="grid grid-cols-3 gap-2 pb-2">
                         {suggestedGallery.map((item, idx) => (
                          <div 
                            key={item.url + idx}
                            role="button"
                            onClick={() => { setSuggestedImage(item); setImageError(false); }}
                            className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                              suggestedImage?.url === item.url ? 'border-sky-500 scale-105 shadow-md shadow-sky-100 ring-2 ring-sky-100' : 'border-white opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={item.url} alt={`Opción ${idx}`} crossOrigin={item.url.includes('ui-avatars') ? undefined : "anonymous"} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Previsualización del seleccionado con detalle de la fuente */}
                  <div className="flex items-center gap-4 bg-white/50 p-2 rounded-xl mb-4 border border-white">
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-white shadow-sm flex-shrink-0 relative bg-slate-100">
                      {!imageError ? (
                        <img 
                          src={suggestedImage?.url} 
                          alt="Sugerencia" 
                          key={suggestedImage?.url}
                          crossOrigin={suggestedImage?.url?.includes('ui-avatars') ? undefined : "anonymous"}
                          onLoad={() => setImageError(false)}
                          onError={() => setImageError(true)}
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="absolute inset-0 bg-red-50 flex items-center justify-center">
                          <span className="text-red-500 font-bold text-xs">X</span>
                        </div>
                      )}
                    </div>
                    {imageError ? (
                      <div className="flex-1">
                        <p className="text-[11px] text-red-500 font-bold">Error al cargar la imagen</p>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fuente de la Imagen</p>
                        <p className="text-[11px] text-slate-700 font-medium line-clamp-1">{suggestedImage?.source}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!imageError && (
                      <button 
                        type="button"
                        onClick={handleAcceptSuggestion}
                        disabled={suggesting}
                        className="flex-1 py-3 bg-sky-500 text-white rounded-xl text-xs font-black shadow-lg shadow-sky-200 active:scale-95 disabled:opacity-50"
                      >
                        {suggesting ? 'GUARDANDO...' : 'ACEPTAR ESTA FOTO'}
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={() => { setSuggestedImage(null); setSuggestedGallery([]); setImageError(false); }}
                      className="px-4 py-3 bg-white text-slate-400 rounded-xl text-xs font-bold border border-slate-200 w-full"
                    >
                      {imageError ? 'CERRAR Y DESCARTAR' : 'X'}
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

          {/* Fila 1: Clasificación (Sin Selector de Unidad) */}
          <div className="form-row mb-4">
            <div className="form-group w-full flex gap-2">
              <div style={{ flex: 1 }}>
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
              <div style={{ flex: 1 }}>
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
          
          {form.calculation_type === 'peso' && (
            <div className="space-y-4 mb-6 p-4 bg-sky-50/50 rounded-2xl border border-sky-100/50 scale-in">
              <div className="form-group">
                <label className="form-label flex justify-between">
                  <span className="text-slate-500">% Merma / Cocción</span>
                  <span className={form.waste_percentage < 0 ? 'text-rose-500' : 'text-emerald-500'} style={{ fontWeight: 900 }}>
                    {form.waste_percentage > 0 ? '+' : ''}{form.waste_percentage}%
                  </span>
                </label>
                <input 
                  type="range"
                  min="-50"
                  max="100"
                  step="5"
                  value={form.waste_percentage}
                  onChange={e => set('waste_percentage', Number(e.target.value))}
                  className="w-full accent-navy"
                  style={{ height: '4px' }}
                />
                <div className="flex justify-between text-[8px] font-bold text-slate-400 mt-1 uppercase">
                  <span>Merma (-50%)</span>
                  <span>Hidratación (+100%)</span>
                </div>
              </div>
            </div>
          )}

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
            }}>COSTE NETO CALCULADO {form.calculation_type === 'peso' ? '(€/KG)' : '(€/UD)'}</span>
            <div style={{
               fontSize: '24px',
               fontWeight: 800,
               color: '#0c4a6e'
            }}>
              {dynamicCost.toFixed(2)}€ {form.calculation_type === 'peso' ? '/ KG' : '/ UD'}
            </div>
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
              {form.sale_price ? `${Number(form.sale_price).toFixed(2)}€` : <span className="text-sky-200">0.00€</span>}
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
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [activeSubcategory, setActiveSubcategory] = useState('Todos');
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
        <div className="card-grid" style={{ paddingRight: '60px', maxWidth: '500px', margin: '0 auto' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" style={{ height: '80px', background: '#f1f5f9', borderRadius: '16px' }} />
          ))}
        </div>
      ) : (
        <div className="card-grid" style={{ paddingRight: '60px', maxWidth: '500px', margin: '0 auto' }}>
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
                    {ingredient.is_published && (
                       <span className="bg-sky-100 text-sky-600 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">En Tienda</span>
                    )}
                  </div>
                </div>
                
                <div className="card-price-right">
                  <div className="price-main">
                    {(() => {
                      const fmt = parseFloat(ingredient.purchase_format) || 0;
                      const prc = parseFloat(ingredient.purchase_price) || 0;
                      if (fmt <= 0) return (parseFloat(ingredient.cost_per_unit || 0)).toFixed(2);
                      if (ingredient.calculation_type === 'unidad') return (prc / fmt).toFixed(2);
                      return ((prc / fmt) * 1000).toFixed(2);
                    })()} €
                  </div>
                  <div className="price-unit-label">
                    {ingredient.calculation_type === 'unidad' ? '/ UD' : '/ KG'}
                  </div>
                </div>

                <div className="card-actions-subtle flex items-center gap-2">
                  <button 
                    className={`p-2 rounded-lg transition-all ${ingredient.is_published ? 'bg-sky-500 text-white shadow-lg shadow-sky-100' : 'text-slate-300 hover:bg-slate-100'}`}
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
