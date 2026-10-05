import React, { useState, useMemo, useEffect } from 'react';
import { useFlyers } from '../hooks/useFlyers';
import { 
  FLYER_THEMES, 
  PROMO_PRESETS,
  DEFAULT_WEEKLY_MENU, 
  PRELOADED_DISH_ILLUSTRATIONS,
  resolveDishImage,
  generateSmartDishDescriptor,
  downloadFlyerImage, 
  generateWhatsAppWeeklyText,
  copyFlyerImageToClipboard,
  shareFlyerToWhatsApp,
  getSavedFlyerHeaderSettings,
  saveFlyerHeaderSettings,
  resetFlyerHeaderSettings
} from '../lib/flyerService';
import { 
  Sparkles, 
  Download, 
  Share2, 
  Copy, 
  Layers, 
  Utensils, 
  Phone, 
  Check, 
  Plus, 
  Trash2, 
  ChefHat, 
  MessageSquare, 
  Image as ImageIcon,
  Flame, 
  X, 
  Upload, 
  Wand2, 
  Grid, 
  Search, 
  Tag, 
  GraduationCap, 
  Store, 
  RotateCcw, 
  BadgePercent, 
  Sliders, 
  Send, 
  CheckCircle2, 
  HelpCircle, 
  ExternalLink,
  Save
} from 'lucide-react';
import './Flyers.css';

// ── Sakura Authentic Japanese Cherry Blossom Corner Component ─────────────────
const SakuraFlowers = ({ color = '#8b4513', themeId = 'bachan_classic' }) => {
  let petalColor = '#e11d48'; // Rose 600
  let petalHighlight = '#fecdd3'; // Rose 200
  let petalOpacity = 0.88;
  let centerColor = '#f59e0b'; // Amber 500
  let branchColor = '#78350f'; // Warm wood chestnut
  let stamenDotColor = '#b45309';

  if (themeId === 'bachan_classic') {
    petalColor = '#e11d48'; // carmesí flor cerezo tradicional
    petalHighlight = '#fecdd3';
    petalOpacity = 0.88;
    centerColor = '#f59e0b';
    branchColor = '#78350f';
    stamenDotColor = '#b45309';
  } else if (themeId === 'cherry_minimal') {
    petalColor = '#ec4899'; // rosa sakura vibrante
    petalHighlight = '#fbcfe8';
    petalOpacity = 0.9;
    centerColor = '#fbbf24';
    branchColor = '#831843';
    stamenDotColor = '#f59e0b';
  } else if (themeId === 'navy_gold') {
    petalColor = '#f59e0b'; // oro imperial
    petalHighlight = '#fef08a';
    petalOpacity = 0.85;
    centerColor = '#ffffff';
    branchColor = '#d4af37';
    stamenDotColor = '#fef08a';
  } else if (themeId === 'neo_tokyo') {
    petalColor = '#38bdf8'; // cian neón
    petalHighlight = '#e0f2fe';
    petalOpacity = 0.85;
    centerColor = '#f43f5e';
    branchColor = '#0284c7';
    stamenDotColor = '#fda4af';
  }

  return (
    <svg 
      viewBox="0 0 100 100" 
      style={{ width: '100%', height: '100%', overflow: 'visible', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))' }}
    >
      <defs>
        <linearGradient id={`branchGrad-${themeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={branchColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={branchColor} stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* ── Rama Leñosa Japonesa con brotes ── */}
      <path 
        d="M 2,2 C 10,8 20,18 34,30 C 48,42 64,48 82,46" 
        fill="none" 
        stroke={`url(#branchGrad-${themeId})`}
        strokeWidth="2.4" 
        strokeLinecap="round" 
      />
      <path 
        d="M 32,28 C 38,42 44,56 52,70" 
        fill="none" 
        stroke={branchColor} 
        strokeWidth="1.6" 
        strokeLinecap="round" 
        opacity={0.65} 
      />
      <path 
        d="M 16,14 C 22,10 30,8 38,8" 
        fill="none" 
        stroke={branchColor} 
        strokeWidth="1.2" 
        strokeLinecap="round" 
        opacity={0.55} 
      />

      {/* Brote / Botón Sakura en twig superior */}
      <g transform="translate(38, 8) rotate(-15) scale(0.4)">
        <path d="M 0,0 C -4,-8 0,-16 6,-18 C 12,-16 16,-8 12,0 Z" fill={petalColor} opacity={petalOpacity} />
        <path d="M -2,0 C -2,-5 2,-7 6,-8" fill="none" stroke={branchColor} strokeWidth="1.5" />
      </g>

      {/* ── Flor Principal de 5 Pétalos con Muesca Sakura (34, 30) ── */}
      <g transform="translate(34, 30)">
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <g key={i} transform={`rotate(${angle})`}>
            {/* Pétalo exterior */}
            <path
              d="M 0,0 C -6,-6 -14,-14 -8,-22 C -4,-25 -1,-22 0,-21 C 1,-22 4,-25 8,-22 C 14,-14 6,-6 0,0 Z"
              fill={petalColor}
              opacity={petalOpacity}
            />
            {/* Brillo / Sombra interior del pétalo */}
            <path
              d="M 0,0 C -3,-5 -8,-11 -4,-16 C -2,-18 0,-15 0,-15 C 0,-15 2,-18 4,-16 C 8,-11 3,-5 0,0 Z"
              fill={petalHighlight}
              opacity={0.45}
            />
          </g>
        ))}

        {/* Estambres radiantes */}
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <g key={`stamen-${i}`} transform={`rotate(${angle + 36})`}>
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-9"
              stroke={centerColor}
              strokeWidth="1"
              strokeLinecap="round"
            />
            <circle
              cx="0"
              cy="-9.5"
              r="1.2"
              fill={stamenDotColor}
            />
          </g>
        ))}
        {/* Pistilo central */}
        <circle cx="0" cy="0" r="2.8" fill={centerColor} />
        <circle cx="0" cy="0" r="1.3" fill={petalColor} />
      </g>

      {/* ── Flor Secundaria en Rama Superior Derecha (80, 46) ── */}
      <g transform="translate(80, 46) rotate(25) scale(0.62)">
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <path
            key={`sub-${i}`}
            d="M 0,0 C -6,-6 -14,-14 -8,-22 C -4,-25 -1,-22 0,-21 C 1,-22 4,-25 8,-22 C 14,-14 6,-6 0,0 Z"
            fill={petalColor}
            opacity={petalOpacity * 0.95}
            transform={`rotate(${angle})`}
          />
        ))}
        <circle cx="0" cy="0" r="2.4" fill={centerColor} />
      </g>

      {/* ── Flor Terciaria Pequeña en Rama Inferior (52, 70) ── */}
      <g transform="translate(52, 70) rotate(-20) scale(0.48)">
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <path
            key={`sub2-${i}`}
            d="M 0,0 C -6,-6 -14,-14 -8,-22 C -4,-25 -1,-22 0,-21 C 1,-22 4,-25 8,-22 C 14,-14 6,-6 0,0 Z"
            fill={petalColor}
            opacity={petalOpacity * 0.9}
            transform={`rotate(${angle})`}
          />
        ))}
        <circle cx="0" cy="0" r="2" fill={centerColor} />
      </g>

      {/* ── Pétalos Flotantes en el Viento (Sakura Fubuki) ── */}
      <g transform="translate(86, 18) rotate(40) scale(0.55)">
        <path
          d="M 0,0 C -5,-5 -11,-11 -6,-17 C -3,-19 0,-17 0,-17 C 0,-17 3,-19 6,-17 C 11,-11 5,-5 0,0 Z"
          fill={petalColor}
          opacity={petalOpacity * 0.85}
        />
      </g>
      <g transform="translate(20, 78) rotate(-35) scale(0.5)">
        <path
          d="M 0,0 C -5,-5 -11,-11 -6,-17 C -3,-19 0,-17 0,-17 C 0,-17 3,-19 6,-17 C 11,-11 5,-5 0,0 Z"
          fill={petalColor}
          opacity={petalOpacity * 0.8}
        />
      </g>
      <g transform="translate(76, 82) rotate(15) scale(0.42)">
        <path
          d="M 0,0 C -5,-5 -11,-11 -6,-17 C -3,-19 0,-17 0,-17 C 0,-17 3,-19 6,-17 C 11,-11 5,-5 0,0 Z"
          fill={petalColor}
          opacity={petalOpacity * 0.75}
        />
      </g>
    </svg>
  );
};

// Icono WhatsApp en SVG puro
const WhatsAppIconSVG = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.771.815 2.796.815 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.767-5.768-5.767zm0 10.455c-.93 0-1.657-.256-2.457-.732l-.176-.105-1.58.415.422-1.54-.116-.184c-.524-.834-.8-1.501-.8-2.543 0-2.607 2.122-4.729 4.73-4.729 2.608 0 4.73 2.122 4.73 4.729-.001 2.608-2.123 4.729-4.73 4.729z"/>
  </svg>
);

export default function Flyers() {
  const { 
    menuItems, 
    categories, 
    headerSettings, 
    saveTemplate, 
    saveDishDescription, 
    saveHeaders, 
    resetHeaders 
  } = useFlyers();

  const [selectedThemeId, setSelectedThemeId] = useState('bachan_classic');
  const [customLogoUrl, setCustomLogoUrl] = useState('');

  // Carta Semanal Data (iniciada con la cabecera guardada en local / base de datos)
  const [weeklyData, setWeeklyData] = useState(() => {
    const savedHeaders = getSavedFlyerHeaderSettings();
    return {
      ...DEFAULT_WEEKLY_MENU,
      headerTitle: savedHeaders.headerTitle || DEFAULT_WEEKLY_MENU.headerTitle,
      headerSubtitle: savedHeaders.headerSubtitle || DEFAULT_WEEKLY_MENU.headerSubtitle,
      headerTagline: savedHeaders.headerTagline || DEFAULT_WEEKLY_MENU.headerTagline,
      contactName: savedHeaders.contactName || DEFAULT_WEEKLY_MENU.contactName,
      contactPhone: savedHeaders.contactPhone || DEFAULT_WEEKLY_MENU.contactPhone
    };
  });

  // Sincronizar si llegan cabeceras personalizadas de Supabase
  useEffect(() => {
    if (headerSettings) {
      setWeeklyData(prev => ({
        ...prev,
        headerTitle: headerSettings.headerTitle || prev.headerTitle,
        headerSubtitle: headerSettings.headerSubtitle || prev.headerSubtitle,
        headerTagline: headerSettings.headerTagline || prev.headerTagline,
        contactName: headerSettings.contactName || prev.contactName,
        contactPhone: headerSettings.contactPhone || prev.contactPhone
      }));
    }
  }, [headerSettings]);

  // Modals & Feedback
  const [showCatalogModal, setShowCatalogModal] = useState(null); // index of dish to assign from TPV catalog
  const [showIllustrationGalleryModal, setShowIllustrationGalleryModal] = useState(null); // index of dish to pick illustration
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showWhatsAppDesktopModal, setShowWhatsAppDesktopModal] = useState(false);
  const [mobileTab, setMobileTab] = useState('editor'); // 'editor' | 'preview'
  const [toastMessage, setToastMessage] = useState('');

  const currentTheme = FLYER_THEMES.find(t => t.id === selectedThemeId) || FLYER_THEMES[0];
  const activeLogo = customLogoUrl || currentTheme.logo;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // ── Guardar Textos de Cabecera desde el Front ─────────────────────────────
  const handleSaveHeaderSettings = async () => {
    try {
      const res = await saveHeaders({
        headerTitle: weeklyData.headerTitle,
        headerSubtitle: weeklyData.headerSubtitle,
        headerTagline: weeklyData.headerTagline,
        contactName: weeklyData.contactName,
        contactPhone: weeklyData.contactPhone
      });
      if (res.success) {
        showToast('💾 Textos de cabecera guardados con éxito como predeterminados');
      } else {
        showToast('⚠️ No se pudieron guardar los textos');
      }
    } catch (err) {
      console.error('Error saving header settings:', err);
      showToast('❌ Error al guardar cabecera');
    }
  };

  // ── Restablecer Textos de Cabecera al Original de Fábrica ─────────────────
  const handleResetHeaderSettings = () => {
    const defaults = resetHeaders();
    setWeeklyData(prev => ({
      ...prev,
      headerTitle: defaults.headerTitle,
      headerSubtitle: defaults.headerSubtitle,
      headerTagline: defaults.headerTagline,
      contactName: defaults.contactName,
      contactPhone: defaults.contactPhone
    }));
    showToast('🔄 Textos de cabecera restablecidos al diseño original');
  };

  // ── Modificar Platos de la Carta Semanal ──────────────────────────────────
  const handleDishChange = (index, field, value) => {
    const updated = [...weeklyData.dishes];
    updated[index] = { ...updated[index], [field]: value };
    setWeeklyData({ ...weeklyData, dishes: updated });
  };

  // ── Autogenerar Descripción y Pastilla desde Elaboraciones ──────────────
  const handleAutoGenerateDescriptor = (index) => {
    const dish = weeklyData.dishes[index];
    const matched = menuItems.find(m => m.id === dish.menuItemId || (m.name || '').toLowerCase() === (dish.name || '').toLowerCase()) || { name: dish.name };
    const descData = generateSmartDishDescriptor(matched);
    
    const updated = [...weeklyData.dishes];
    updated[index] = {
      ...updated[index],
      description: descData.description || updated[index].description,
      badge: descData.badge || updated[index].badge
    };
    setWeeklyData({ ...weeklyData, dishes: updated });
    showToast(`✨ Descripción y claim de sabor generados desde las elaboraciones`);
  };

  // ── Guardar Descripción Editada en la Ficha del TPV ──────────────────────
  const handleSaveDishDescriptionToTPV = async (index) => {
    const dish = weeklyData.dishes[index];
    const matched = menuItems.find(m => m.id === dish.menuItemId || (m.name || '').toLowerCase() === (dish.name || '').toLowerCase());
    if (!matched) {
      alert(`El plato "${dish.name}" no está vinculado directamente a un plato del TPV. Selecciona el plato desde el botón "TPV" para vincularlo.`);
      return;
    }

    const res = await saveDishDescription(matched.id, dish.description);
    if (res.success) {
      showToast(`💾 Descripción guardada permanentemente en el TPV para "${dish.name}"`);
    } else {
      alert('Error guardando en el TPV: ' + (res.error || 'Error desconocido'));
    }
  };

  const handleAddDish = () => {
    if (weeklyData.dishes.length >= 4) {
      alert('Se recomienda un máximo de 4 platos para mantener la proporción visual perfecta del flyer.');
      return;
    }
    // Abrir directamente el selector de platos del catálogo del TPV
    setShowCatalogModal('new');
  };

  const handleRemoveDish = (index) => {
    if (weeklyData.dishes.length <= 1) {
      alert('La carta semanal debe tener al menos 1 plato.');
      return;
    }
    const updated = weeklyData.dishes.filter((_, i) => i !== index);
    setWeeklyData({ ...weeklyData, dishes: updated });
  };

  // Asignar o añadir plato seleccionado desde el catálogo del TPV
  const handleSelectTPVItem = (item) => {
    if (showCatalogModal !== null) {
      const itemPrice = Number(item.price || 0);
      const formattedPrice = itemPrice > 0 ? `${itemPrice.toFixed(1).replace('.', ',')}€` : '10,0€';
      const resolvedImg = (item.image_url && item.image_url.trim() !== '') 
        ? item.image_url 
        : resolveDishImage(item, menuItems);
      const smartDesc = generateSmartDishDescriptor(item);
      const dishDesc = (item.description && item.description.trim() !== '')
        ? item.description
        : smartDesc.description;
      const dishBadge = smartDesc.badge || '';

      if (showCatalogModal === 'new' || showCatalogModal >= weeklyData.dishes.length) {
        // Añadir nuevo plato al final desde el TPV
        const newDish = {
          id: `dish_${Date.now()}`,
          menuItemId: item.id,
          name: item.name,
          tpvPrice: itemPrice,
          price: formattedPrice,
          imageUrl: resolvedImg,
          description: dishDesc,
          badge: dishBadge
        };
        setWeeklyData(prev => ({ ...prev, dishes: [...prev.dishes, newDish] }));
        showToast(`🍱 ${item.name} añadido a la carta desde el TPV (${formattedPrice})`);
      } else {
        // Sustituir plato existente en el slot idx
        const idx = showCatalogModal;
        const updated = [...weeklyData.dishes];
        updated[idx] = {
          ...updated[idx],
          menuItemId: item.id,
          name: item.name,
          tpvPrice: itemPrice,
          price: formattedPrice,
          imageUrl: resolvedImg,
          description: dishDesc,
          badge: dishBadge
        };
        setWeeklyData(prev => ({ ...prev, dishes: updated }));
        showToast(`🍱 ${item.name} asignado desde el TPV (${formattedPrice})`);
      }

      setShowCatalogModal(null);
    }
  };

  // Restablecer el precio del plato a su precio original del TPV
  const handleResetToTPVPrice = (index) => {
    const dish = weeklyData.dishes[index];
    if (dish && dish.tpvPrice !== undefined) {
      const resetPrice = `${Number(dish.tpvPrice).toFixed(1).replace('.', ',')}€`;
      handleDishChange(index, 'price', resetPrice);
      showToast(`↺ Precio restablecido a ${resetPrice}`);
    }
  };

  // Aplicar un Preset de Promoción rápida
  const handleApplyPromoPreset = (preset) => {
    setWeeklyData(prev => ({
      ...prev,
      showPromoBanner: true,
      promoBannerTitle: preset.title,
      promoBannerSubtext: preset.subtext,
      promoCallout: preset.callout
    }));
    showToast(`✨ Promoción aplicada: ${preset.label}`);
  };

  const handleSelectIllustration = (illustration) => {
    if (showIllustrationGalleryModal !== null) {
      const idx = showIllustrationGalleryModal;
      handleDishChange(idx, 'imageUrl', illustration.url);
      setShowIllustrationGalleryModal(null);
      showToast(`✨ Ilustración de ${illustration.name} asignada`);
    }
  };

  // ── Manejar Subida de Foto del Plato ──────────────────────────────────────
  const handleImageUploadForDish = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      handleDishChange(index, 'imageUrl', e.target.result);
      showToast('📸 Foto del plato cargada');
    };
    reader.readAsDataURL(file);
  };

  // ── Exportar Imagen HD (3x scale) ─────────────────────────────────────────
  const handleDownloadImage = async () => {
    setIsExporting(true);
    try {
      const fileName = `carta-semanal-bachan-${Date.now()}.png`;
      await downloadFlyerImage('bachan-flyer-canvas', fileName, 'png');
      showToast('📸 ¡Flyer HD descargado correctamente!');
    } catch (err) {
      console.error('Error exportando flyer:', err);
      alert('Hubo un error al generar la imagen. Inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  // ── Copiar Imagen del Flyer al Portapapeles ──────────────────────────────
  const handleCopyFlyerImage = async () => {
    setIsExporting(true);
    try {
      await copyFlyerImageToClipboard('bachan-flyer-canvas');
      showToast('📸 ¡Imagen HD copiada! Pégala con Ctrl+V en WhatsApp o redes');
    } catch (err) {
      console.error('Error al copiar imagen:', err);
      // Fallback a descarga si el navegador no permite portapapeles de imágenes
      await handleDownloadImage();
      showToast('📥 Imagen descargada (tu navegador no permitió copiar directo)');
    } finally {
      setIsExporting(false);
    }
  };

  // ── Copiar Texto Formateado para WhatsApp ─────────────────────────────────
  const handleCopyWhatsAppText = () => {
    const text = generateWhatsAppWeeklyText(weeklyData);
    navigator.clipboard.writeText(text);
    showToast('📋 ¡Texto de la carta y promoción copiado con emojis!');
  };

  // ── Compartir en WhatsApp (Imagen HD + Texto) ─────────────────────────────
  const handleShareWhatsApp = async () => {
    setIsSharing(true);
    try {
      const text = generateWhatsAppWeeklyText(weeklyData);
      const fileName = `carta-semanal-bachan-${Date.now()}.png`;
      const result = await shareFlyerToWhatsApp({
        elementId: 'bachan-flyer-canvas',
        text,
        fileName
      });

      if (result.method === 'native_share') {
        if (!result.cancelled) {
          showToast('📲 ¡Abriendo WhatsApp con el Flyer e Información!');
        }
      } else {
        // En escritorio/web mostramos la guía interactiva para pegar el flyer
        setShowWhatsAppDesktopModal(true);
        showToast('📸 ¡Flyer copiado al portapapeles y descargado!');
      }
    } catch (err) {
      console.error('Error al compartir en WhatsApp:', err);
      const text = generateWhatsAppWeeklyText(weeklyData);
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
      showToast('💬 Abriendo WhatsApp con el texto');
    } finally {
      setIsSharing(false);
    }
  };

  // ── Guardar Plantilla ────────────────────────────────────────────────────
  const handleSaveCurrentTemplate = async () => {
    const titlePrompt = prompt('Nombre para guardar esta carta semanal:', weeklyData.promoBannerTitle || 'Carta Semanal BaChan');
    if (!titlePrompt) return;

    await saveTemplate({
      title: titlePrompt,
      type: 'weekly_menu',
      theme: selectedThemeId,
      content: weeklyData
    });
    showToast('💾 Carta semanal guardada con éxito');
  };

  // ── Filtrado del Catálogo del TPV ────────────────────────────────────────
  const filteredCatalogItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = !catalogSearch.trim() || item.name.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchesCat = catalogCategoryFilter === 'all' || String(item.category_id) === String(catalogCategoryFilter);
      return matchesSearch && matchesCat;
    });
  }, [menuItems, catalogSearch, catalogCategoryFilter]);

  return (
    <div className="flyers-root">

      {/* ── TOAST NOTIFICATION ──────────────────────────────────────────────── */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--color-navy)',
          color: '#f5e6c8',
          padding: '12px 24px',
          borderRadius: '12px',
          fontWeight: 'bold',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          zIndex: 9999,
          border: '1px solid rgba(245,230,200,0.3)'
        }}>
          {toastMessage}
        </div>
      )}

      {/* ── HEADER BANNER ──────────────────────────────────────────────────── */}
      <section className="flyers-header-card">
        <div className="flyers-title-group">
          <h1><Sparkles size={24} color="#f5e6c8" /> Creador de Cartas Semanales & Flyers BaChan</h1>
          <p>Conecta platos de tu TPV, aplica precios y promociones especiales (Estudiantes, Academia Maru, Empresas) y descarga en HD</p>
        </div>

        <button 
          type="button"
          className="btn-save-template-header"
          onClick={handleSaveCurrentTemplate}
        >
          💾 Guardar Carta
        </button>
      </section>

      {/* ── SELECTOR DE PESTAÑAS MÓVIL (Configurador vs Vista Previa) ─────── */}
      <div className="mobile-flyer-nav-tabs">
        <button
          type="button"
          className={`mobile-tab-btn ${mobileTab === 'editor' ? 'active' : ''}`}
          onClick={() => setMobileTab('editor')}
        >
          <Sliders size={16} />
          <span>Configurador ({weeklyData.dishes.length} platos)</span>
        </button>
        <button
          type="button"
          className={`mobile-tab-btn ${mobileTab === 'preview' ? 'active' : ''}`}
          onClick={() => setMobileTab('preview')}
        >
          <Sparkles size={16} />
          <span>Ver Flyer & Enviar</span>
        </button>
      </div>

      {/* ── MAIN GENERATOR SPLIT ───────────────────────────────────────────── */}
      <div className="flyers-layout-container">

        {/* ── COLUMNA IZQUIERDA: CONFIGURADOR ───────────────────────────────── */}
        <div className={`flyer-editor-panel ${mobileTab === 'preview' ? 'mobile-hidden' : ''}`}>
          
          {/* Selector de Tema Visual */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="editor-section-title">
                <Layers size={16} /> Estilo Visual del Flyer
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--color-navy)', cursor: 'pointer' }}>
                <input 
                  type="checkbox"
                  checked={weeklyData.showSakura !== false}
                  onChange={e => setWeeklyData({ ...weeklyData, showSakura: e.target.checked })}
                  style={{ width: '16px', height: '16px' }}
                />
                🌸 Flores Sakura
              </label>
            </div>
            <div className="theme-selector-grid" style={{ marginTop: '8px' }}>
              {FLYER_THEMES.map(theme => (
                <div 
                  key={theme.id}
                  className={`theme-card-option ${selectedThemeId === theme.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedThemeId(theme.id);
                    setCustomLogoUrl('');
                  }}
                >
                  <div className="theme-color-preview" style={{ background: theme.bg, border: `2px solid ${theme.border}` }} />
                  <span className="theme-opt-name">{theme.name}</span>
                </div>
              ))}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

          {/* ── SECCIÓN PROMOCIÓN ESPECIAL / COLECTIVOS ─────────────────────── */}
          <div style={{ background: '#fdf8ec', padding: '14px', borderRadius: '12px', border: '1.5px solid #fde68a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
              <label className="editor-section-title" style={{ color: '#92400e' }}>
                <Tag size={16} /> Promoción Especial / Colectivo
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 'bold', color: '#78350f', cursor: 'pointer' }}>
                <input 
                  type="checkbox"
                  checked={weeklyData.showPromoBanner || false}
                  onChange={e => setWeeklyData({ ...weeklyData, showPromoBanner: e.target.checked })}
                  style={{ width: '16px', height: '16px' }}
                />
                Activar Banner Promo
              </label>
            </div>

            {/* Presets Rápidos */}
            <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 'bold', marginTop: '6px' }}>
              Promociones preconfiguradas (1-clic):
            </div>
            <div className="promo-preset-pills">
              {PROMO_PRESETS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  className={`promo-preset-pill ${weeklyData.promoBannerTitle === p.title ? 'active' : ''}`}
                  onClick={() => handleApplyPromoPreset(p)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Inputs de configuración del banner promocional */}
            {weeklyData.showPromoBanner && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                <div className="form-group-custom">
                  <label style={{ color: '#78350f' }}>Título del Banner Promocional</label>
                  <input 
                    type="text" 
                    value={weeklyData.promoBannerTitle || ''}
                    onChange={e => setWeeklyData({ ...weeklyData, promoBannerTitle: e.target.value })}
                    placeholder="Ej: 🎓 PROMOCIÓN ESPECIAL DÍA DEL ESTUDIANTE"
                  />
                </div>
                <div className="form-group-custom">
                  <label style={{ color: '#78350f' }}>Subtexto de la Oferta</label>
                  <input 
                    type="text" 
                    value={weeklyData.promoBannerSubtext || ''}
                    onChange={e => setWeeklyData({ ...weeklyData, promoBannerSubtext: e.target.value })}
                    placeholder="Ej: 15% de dto. para alumnos y profesores de Academia Maru"
                  />
                </div>
                <div className="form-group-custom">
                  <label style={{ color: '#78350f' }}>Condiciones / Nota al Pie del Flyer</label>
                  <input 
                    type="text" 
                    value={weeklyData.promoCallout || ''}
                    onChange={e => setWeeklyData({ ...weeklyData, promoCallout: e.target.value })}
                    placeholder="Ej: * Válido de lunes a viernes en pedidos para llevar o delivery"
                  />
                </div>
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

          {/* ── TEXTOS DE CABECERA ─────────────────────────────────────────── */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
              <label className="editor-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} /> Textos de Cabecera
              </label>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleSaveHeaderSettings}
                  style={{
                    background: 'var(--color-navy)',
                    color: '#f5e6c8',
                    border: '1.5px solid rgba(245, 230, 200, 0.4)',
                    fontSize: '0.74rem',
                    fontWeight: '800',
                    padding: '5px 11px',
                    borderRadius: '7px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 6px rgba(12, 28, 46, 0.18)',
                    transition: 'all 0.15s ease'
                  }}
                  title="Guardar estos textos para que se mantengan siempre como predeterminados en todos los flyers"
                >
                  <Save size={13} /> Guardar Cabecera
                </button>
                <button
                  type="button"
                  onClick={handleResetHeaderSettings}
                  style={{
                    background: '#ffffff',
                    color: '#64748b',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    padding: '5px 9px',
                    borderRadius: '7px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Restablecer los textos a los valores de fábrica de BaChan"
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="form-group-custom">
                <label>Título Superior</label>
                <input 
                  type="text" 
                  value={weeklyData.headerTitle}
                  onChange={e => setWeeklyData({ ...weeklyData, headerTitle: e.target.value })}
                  placeholder="Ej: ¡PEDIDOS ABIERTOS PARA BENTOS!"
                />
              </div>
              <div className="form-group-custom">
                <label>Subtítulo de Impacto</label>
                <input 
                  type="text" 
                  value={weeklyData.headerSubtitle}
                  onChange={e => setWeeklyData({ ...weeklyData, headerSubtitle: e.target.value })}
                  placeholder="Ej: Platos auténticos hechos con amor por la abuela"
                />
              </div>
              <div className="form-group-custom">
                <label>Lema / Frase de la Marca</label>
                <textarea 
                  rows={2}
                  value={weeklyData.headerTagline}
                  onChange={e => setWeeklyData({ ...weeklyData, headerTagline: e.target.value })}
                  placeholder="Ej: En Bachan Bentobox, ¡haz tu pedido hoy! Deliciosos. Tradicionales. Hechos a mano."
                />
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

          {/* ── PLATOS DE LA CARTA SEMANAL ─────────────────────────────────── */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
              <label className="editor-section-title">
                <Utensils size={16} /> Platos de la Carta ({weeklyData.dishes.length})
              </label>
              <button 
                type="button" 
                className="btn-card-action primary"
                style={{ width: 'auto', padding: '5px 10px', fontSize: '0.78rem' }}
                onClick={handleAddDish}
              >
                <Plus size={14} /> Añadir Plato
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {weeklyData.dishes.map((dish, idx) => {
                const dishImgUrl = resolveDishImage(dish, menuItems);
                const isPriceModified = dish.tpvPrice !== undefined && `${Number(dish.tpvPrice).toFixed(1).replace('.', ',')}€` !== dish.price && `${Number(dish.tpvPrice).toFixed(2).replace('.', ',')}€` !== dish.price;

                return (
                  <div key={dish.id || idx} className="dish-editor-card">
                    <div className="dish-editor-header">
                      <span className="dish-badge-num">Plato #{idx + 1}</span>
                      <div className="dish-editor-actions">
                        <button 
                          type="button" 
                          className="btn-choose-catalog"
                          onClick={() => {
                            setShowCatalogModal(idx);
                            setCatalogSearch('');
                          }}
                        >
                          <ChefHat size={13} /> TPV
                        </button>
                        <button 
                          type="button" 
                          className="btn-choose-catalog btn-choose-illu"
                          onClick={() => setShowIllustrationGalleryModal(idx)}
                        >
                          <Grid size={13} /> Foto
                        </button>
                        <button 
                          type="button" 
                          className="btn-dish-remove"
                          onClick={() => handleRemoveDish(idx)}
                          title="Eliminar este plato"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Fila con Foto, Nombre y Precio Editable (100% Mobile Fluid Grid) */}
                    <div className="dish-primary-row">
                      <div 
                        onClick={() => setShowIllustrationGalleryModal(idx)}
                        className="dish-editor-thumb-box"
                        title="Haz clic para cambiar la foto"
                      >
                        <img 
                          src={dishImgUrl} 
                          alt={dish.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>

                      <div className="form-group-custom">
                        <label>Nombre del Plato</label>
                        <input 
                          type="text" 
                          value={dish.name}
                          onChange={e => handleDishChange(idx, 'name', e.target.value)}
                          placeholder="Ej: Bento Tonkatsu"
                        />
                      </div>

                      <div className="form-group-custom">
                        <label>Precio</label>
                        <input 
                          type="text" 
                          value={dish.price}
                          onChange={e => handleDishChange(idx, 'price', e.target.value)}
                          placeholder="12,5€"
                        />
                      </div>
                    </div>

                    {/* Indicador de Precio TPV vs Precio Modificado */}
                    {dish.tpvPrice !== undefined && (
                      <div className="tpv-price-row">
                        <span className="tpv-price-badge">
                          <Store size={11} /> Base TPV: {Number(dish.tpvPrice).toFixed(2)}€
                        </span>
                        {isPriceModified && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#ea580c', fontWeight: 'bold' }}>🔥 Especial flyer</span>
                            <button 
                              type="button" 
                              className="btn-reset-price"
                              onClick={() => handleResetToTPVPrice(idx)}
                              title="Restablecer precio original del TPV"
                            >
                              <RotateCcw size={10} style={{ display: 'inline', marginRight: '2px' }} />
                              Reset
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Descripción entre paréntesis con acciones inteligentes */}
                    <div className="form-group-custom">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                        <label style={{ margin: 0 }}>Descripción / Acompañamiento</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleAutoGenerateDescriptor(idx)}
                            style={{
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              color: '#166534',
                              fontSize: '0.72rem',
                              fontWeight: 'bold',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title="Analizar elaboraciones e ingredientes del TPV y autogenerar descripción"
                          >
                            <Wand2 size={11} /> Autogenerar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveDishDescriptionToTPV(idx)}
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1e40af',
                              fontSize: '0.72rem',
                              fontWeight: 'bold',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title="Guardar esta descripción permanentemente en la base de datos del TPV"
                          >
                            💾 Guardar en TPV
                          </button>
                        </div>
                      </div>
                      <input 
                        type="text" 
                        value={dish.description}
                        onChange={e => handleDishChange(idx, 'description', e.target.value)}
                        placeholder="Ej: (Chuleta de cerdo crujiente con arroz, sopa miso...)"
                      />
                    </div>

                    {/* Badge / Claim y Sugerencias Inteligentes */}
                    {/* Pastilla / Claim de Sabor (Segmented Toggle + Editable Input) */}
                    <div className="form-group-custom" style={{ marginTop: '4px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                        <label style={{ margin: 0, fontWeight: '800', color: '#1e293b' }}>
                          Pastilla / Claim de Sabor
                        </label>
                        
                        {/* Selector Segmentado: Con Pastilla / Sin Pastilla */}
                        <div style={{ display: 'inline-flex', background: '#e2e8f0', borderRadius: '6px', padding: '2px', gap: '2px' }}>
                          <button
                            type="button"
                            onClick={() => handleDishChange(idx, 'badge', '')}
                            style={{
                              border: 'none',
                              padding: '3px 8px',
                              borderRadius: '5px',
                              fontSize: '0.72rem',
                              fontWeight: (!dish.badge || dish.badge.trim() === '') ? '800' : '500',
                              background: (!dish.badge || dish.badge.trim() === '') ? '#ffffff' : 'transparent',
                              color: (!dish.badge || dish.badge.trim() === '') ? '#dc2626' : '#64748b',
                              boxShadow: (!dish.badge || dish.badge.trim() === '') ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            🚫 Sin Pastilla
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!dish.badge || dish.badge.trim() === '') {
                                const matched = menuItems.find(m => m.id === dish.menuItemId || (m.name || '').toLowerCase() === (dish.name || '').toLowerCase()) || { name: dish.name };
                                const smart = generateSmartDishDescriptor(matched);
                                handleDishChange(idx, 'badge', smart.badge || 'especialidad');
                              }
                            }}
                            style={{
                              border: 'none',
                              padding: '3px 8px',
                              borderRadius: '5px',
                              fontSize: '0.72rem',
                              fontWeight: (dish.badge && dish.badge.trim() !== '') ? '800' : '500',
                              background: (dish.badge && dish.badge.trim() !== '') ? 'var(--color-navy)' : 'transparent',
                              color: (dish.badge && dish.badge.trim() !== '') ? '#f5e6c8' : '#64748b',
                              boxShadow: (dish.badge && dish.badge.trim() !== '') ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            🏷️ Con Pastilla
                          </button>
                        </div>
                      </div>

                      {dish.badge && dish.badge.trim() !== '' ? (
                        <div>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input 
                              type="text" 
                              value={dish.badge}
                              onChange={e => handleDishChange(idx, 'badge', e.target.value)}
                              placeholder="Escribe el claim ej: el clásico crujiente, 🎓 Promo..."
                              style={{ paddingRight: '28px' }}
                            />
                            <button
                              type="button"
                              onClick={() => handleDishChange(idx, 'badge', '')}
                              style={{
                                position: 'absolute',
                                right: '6px',
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Borrar pastilla"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                            {(() => {
                              const matched = menuItems.find(m => m.id === dish.menuItemId || (m.name || '').toLowerCase() === (dish.name || '').toLowerCase()) || { name: dish.name };
                              const smart = generateSmartDishDescriptor(matched);
                              const suggestions = Array.from(new Set([
                                smart.badge,
                                'el clásico crujiente',
                                'confort en cada bocado',
                                'jugoso & crujiente',
                                'glaseado teriyaki',
                                'fresco del día',
                                'selección premium',
                                'aroma & tradición',
                                'doradas al punto',
                                'el favorito de BaChan',
                                '🎓 Promo Estudiante',
                                '⭐ Recomendado',
                                '🔥 Oferta',
                                '🌱 Vegano'
                              ])).filter(Boolean).slice(0, 8);

                              return suggestions.map(sugg => {
                                const isSelected = dish.badge === sugg;
                                return (
                                  <button
                                    key={sugg}
                                    type="button"
                                    onClick={() => handleDishChange(idx, 'badge', isSelected ? '' : sugg)}
                                    style={{
                                      background: isSelected ? '#fef3c7' : '#ffffff',
                                      border: `1px solid ${isSelected ? '#f59e0b' : '#cbd5e1'}`,
                                      fontSize: '0.68rem',
                                      padding: '2px 7px',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      color: isSelected ? '#92400e' : '#334155',
                                      fontWeight: isSelected ? 'bold' : 'normal',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px'
                                    }}
                                    title={isSelected ? 'Haz clic para desmarcar y quitar' : `Aplicar "${sugg}"`}
                                  >
                                    {isSelected ? '✓' : '+'} {sugg}
                                  </button>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.74rem', color: '#64748b', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>✓ Este plato no llevará pastilla de sabor (diseño limpio)</span>
                          <button
                            type="button"
                            onClick={() => {
                              const matched = menuItems.find(m => m.id === dish.menuItemId || (m.name || '').toLowerCase() === (dish.name || '').toLowerCase()) || { name: dish.name };
                              const smart = generateSmartDishDescriptor(matched);
                              handleDishChange(idx, 'badge', smart.badge || 'especialidad');
                            }}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              color: 'var(--color-navy)',
                              fontSize: '0.68rem',
                              fontWeight: 'bold',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            + Añadir pastilla
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

          {/* ── PIE DE WHATSAPP ────────────────────────────────────────────── */}
          <div>
            <label className="editor-section-title">
              <Phone size={16} /> Contacto WhatsApp
            </label>
            <div className="contact-inputs-grid" style={{ marginTop: '8px' }}>
              <div className="form-group-custom">
                <label>Nombre de Contacto</label>
                <input 
                  type="text" 
                  value={weeklyData.contactName}
                  onChange={e => setWeeklyData({ ...weeklyData, contactName: e.target.value })}
                  placeholder="Akiko Hirakawa"
                />
              </div>
              <div className="form-group-custom">
                <label>Teléfono de WhatsApp</label>
                <input 
                  type="text" 
                  value={weeklyData.contactPhone}
                  onChange={e => setWeeklyData({ ...weeklyData, contactPhone: e.target.value })}
                  placeholder="691 328 095"
                />
              </div>
            </div>
          </div>

          {/* Botón rápido móvil para ver el flyer */}
          <div className="mobile-quick-preview-bar">
            <button 
              type="button" 
              className="btn-mobile-preview-jump"
              onClick={() => {
                setMobileTab('preview');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <Sparkles size={18} />
              <span>Ver Flyer & WhatsApp ({weeklyData.dishes.length} platos) 👉</span>
            </button>
          </div>

        </div>

        {/* ── COLUMNA DERECHA: LIVE CANVAS PREVIEW & EXPORT ─────────────────── */}
        <div className={`flyer-preview-panel ${mobileTab === 'editor' ? 'mobile-hidden' : ''}`}>
          
          {/* Botones de acción rápida */}
          <div className="preview-actions-bar">
            <button 
              className="btn-export-action whatsapp"
              onClick={handleShareWhatsApp}
              disabled={isSharing || isExporting}
              title="Comparte el flyer y el texto directamente a WhatsApp"
            >
              <Share2 size={18} />
              <span>{isSharing ? 'Preparando...' : 'WhatsApp (Foto + Texto)'}</span>
            </button>

            <button 
              className="btn-export-action download"
              onClick={handleDownloadImage}
              disabled={isExporting || isSharing}
              title="Descarga el archivo PNG en ultra alta definición"
            >
              <Download size={18} />
              <span>{isExporting ? 'Generando HD...' : 'Descargar HD'}</span>
            </button>

            <button 
              className="btn-export-action copy-img"
              onClick={handleCopyFlyerImage}
              disabled={isExporting || isSharing}
              title="Copia la imagen del flyer para pegarla en cualquier chat con Ctrl+V"
            >
              <ImageIcon size={18} />
              <span>Copiar Imagen</span>
            </button>

            <button 
              className="btn-export-action copy"
              onClick={handleCopyWhatsAppText}
              title="Copia el texto formateado con emojis"
            >
              <Copy size={18} />
              <span>Copiar Texto</span>
            </button>
          </div>

          {/* ── CANVAS RENDERIZADO VISUAL EN VIVO ──────────────────────────── */}
          {(() => {
            const dishCount = weeklyData.dishes?.length || 3;
            const hasPromo = !!(weeklyData.showPromoBanner && weeklyData.promoBannerTitle);

            let dynamicLogoSize = 130;
            let dynamicDishesGap = '10px';
            let dynamicHeaderMarginBottom = '10px';
            let dynamicDishPadding = '9px 12px';
            let dynamicThumbSize = '62px';
            let dynamicTitleSize = '1.05rem';
            let dynamicDescSize = '0.72rem';
            let dynamicPriceSize = '1.35rem';

            if (dishCount <= 1) {
              dynamicLogoSize = hasPromo ? 142 : 162;
              dynamicDishesGap = '18px';
              dynamicHeaderMarginBottom = '16px';
              dynamicDishPadding = '14px 16px';
              dynamicThumbSize = '72px';
              dynamicTitleSize = '1.18rem';
              dynamicDescSize = '0.82rem';
              dynamicPriceSize = '1.5rem';
            } else if (dishCount === 2) {
              dynamicLogoSize = hasPromo ? 128 : 146;
              dynamicDishesGap = '14px';
              dynamicHeaderMarginBottom = '12px';
              dynamicDishPadding = '12px 14px';
              dynamicThumbSize = '68px';
              dynamicTitleSize = '1.12rem';
              dynamicDescSize = '0.76rem';
              dynamicPriceSize = '1.42rem';
            } else if (dishCount === 3) {
              dynamicLogoSize = hasPromo ? 112 : 130;
              dynamicDishesGap = hasPromo ? '8px' : '10px';
              dynamicHeaderMarginBottom = hasPromo ? '6px' : '10px';
              dynamicDishPadding = '9px 12px';
              dynamicThumbSize = '62px';
              dynamicTitleSize = '1.05rem';
              dynamicDescSize = '0.72rem';
              dynamicPriceSize = '1.35rem';
            } else if (dishCount >= 4) {
              dynamicLogoSize = hasPromo ? 74 : 84;
              dynamicDishesGap = '6px';
              dynamicHeaderMarginBottom = '4px';
              dynamicDishPadding = '6px 9px';
              dynamicThumbSize = '54px';
              dynamicTitleSize = '0.96rem';
              dynamicDescSize = '0.66rem';
              dynamicPriceSize = '1.22rem';
            }

            return (
              <div className="flyer-canvas-wrapper">
                <div 
                  id="bachan-flyer-canvas"
                  className="bachan-authentic-poster"
                  style={{
                    backgroundColor: currentTheme.bg,
                    color: currentTheme.textPrimary
                  }}
                >
                  
                  {/* Marco exterior doble japonés */}
                  <div 
                    className="poster-inner-frame"
                    style={{
                      borderColor: currentTheme.border
                    }}
                  >
                    
                    {/* Contenedor interior con esquinas japonesas y flores sakura */}
                    <div 
                      className="poster-notched-container"
                      style={{
                        borderColor: currentTheme.border
                      }}
                    >
                      
                      {/* Flores de Sakura vectoriales en las esquinas */}
                      {weeklyData.showSakura !== false && (
                        <>
                          <div className="sakura-corner top-left">
                            <SakuraFlowers color={currentTheme.accent} themeId={selectedThemeId} />
                          </div>
                          <div className="sakura-corner top-right">
                            <SakuraFlowers color={currentTheme.accent} themeId={selectedThemeId} />
                          </div>
                          <div className="sakura-corner bottom-left">
                            <SakuraFlowers color={currentTheme.accent} themeId={selectedThemeId} />
                          </div>
                          <div className="sakura-corner bottom-right">
                            <SakuraFlowers color={currentTheme.accent} themeId={selectedThemeId} />
                          </div>
                        </>
                      )}

                      {/* ── CABECERA: Logo oficial de la abuela y Titulares ─────── */}
                      <div className="poster-header-section" style={{ marginBottom: dynamicHeaderMarginBottom }}>
                        <img 
                          src={activeLogo} 
                          alt="BaChan BentoBox" 
                          className="poster-logo-seal"
                          style={{
                            width: `${dynamicLogoSize}px`,
                            height: `${dynamicLogoSize}px`
                          }}
                          onError={(e) => {
                            if (e.currentTarget.src !== '/logo-bachan.png') {
                              e.currentTarget.src = '/logo-bachan.png';
                            }
                          }}
                        />

                        <h2 
                          className="poster-main-title"
                          style={{ color: currentTheme.textPrimary }}
                        >
                          {weeklyData.headerTitle}
                        </h2>

                        <h3 
                          className="poster-subtitle"
                          style={{ color: currentTheme.textPrimary }}
                        >
                          {weeklyData.headerSubtitle}
                        </h3>

                        <p 
                          className="poster-tagline"
                          style={{ color: currentTheme.textSecondary }}
                        >
                          {weeklyData.headerTagline}
                        </p>
                      </div>

                      {/* ── BANNER PROMOCIÓN ESPECIAL (Si está activo) ──────────── */}
                      {weeklyData.showPromoBanner && weeklyData.promoBannerTitle && (
                        <div 
                          className="poster-promo-ribbon"
                          style={{
                            backgroundColor: currentTheme.bg === '#0c1c2e' ? '#1e3a5f' : currentTheme.bg === '#0f172a' ? '#1e293b' : '#f5e6c8',
                            borderColor: currentTheme.accent,
                            color: currentTheme.textPrimary
                          }}
                        >
                          <span className="poster-promo-title" style={{ color: currentTheme.accent }}>
                            {weeklyData.promoBannerTitle}
                          </span>
                          {weeklyData.promoBannerSubtext && (
                            <span className="poster-promo-subtext" style={{ color: currentTheme.textSecondary }}>
                              {weeklyData.promoBannerSubtext}
                            </span>
                          )}
                        </div>
                      )}

                      {/* ── CUERPO: Tarjetas de Platos de la Carta Semanal ──────── */}
                      <div className="poster-dishes-column" style={{ gap: dynamicDishesGap }}>
                        {weeklyData.dishes.map((dish, i) => {
                          const dishImg = resolveDishImage(dish, menuItems);

                          return (
                            <div 
                              key={dish.id || i}
                              className="poster-dish-card"
                              style={{
                                backgroundColor: currentTheme.cardBg,
                                borderColor: currentTheme.border,
                                padding: dynamicDishPadding
                              }}
                            >
                              {/* Thumbnail de la ilustración en alta resolución */}
                              <div className="dish-thumbnail-box" style={{ width: dynamicThumbSize, height: dynamicThumbSize }}>
                                <img 
                                  src={dishImg} 
                                  alt={dish.name} 
                                  className="dish-thumbnail-img"
                                  onError={(e) => {
                                    if (!e.currentTarget.src.includes('tonkatsu.png')) {
                                      e.currentTarget.src = '/dishes/tonkatsu.png';
                                    }
                                  }}
                                />
                              </div>

                              {/* Nombre y Descripción */}
                              <div className="dish-info-middle">
                                <h4 
                                  className="dish-title-text"
                                  style={{ color: currentTheme.textPrimary, fontSize: dynamicTitleSize }}
                                >
                                  {dish.name}
                                </h4>
                                <p 
                                  className="dish-desc-text"
                                  style={{ color: currentTheme.textSecondary, fontSize: dynamicDescSize }}
                                >
                                  {dish.description}
                                </p>
                              </div>

                              {/* Precio y Pastilla de Sabor */}
                              <div className="dish-price-badge-col">
                                <span 
                                  className="dish-price-val"
                                  style={{ color: currentTheme.textPrimary, fontSize: dynamicPriceSize }}
                                >
                                  {dish.price}
                                </span>
                                {dish.badge && dish.badge.trim() !== '' && (
                                  <span 
                                    className="dish-flavor-badge"
                                    style={{
                                      backgroundColor: currentTheme.bg === '#0f172a' ? '#38bdf8' : '#1a1815',
                                      color: currentTheme.bg === '#0f172a' ? '#0f172a' : '#ffffff'
                                    }}
                                  >
                                    {dish.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* ── NOTA DE CONDICIONES / COLECTIVO ─────────────────────── */}
                      {weeklyData.promoCallout && (
                        <div 
                          className="poster-promo-callout"
                          style={{ color: currentTheme.textSecondary }}
                        >
                          {weeklyData.promoCallout}
                        </div>
                      )}

                      {/* ── PIE: Botón / Pill de WhatsApp ───────────────────────── */}
                      <div className="poster-footer-whatsapp">
                        <div className="poster-whatsapp-pill">
                          <div className="whatsapp-green-icon">
                            <WhatsAppIconSVG />
                          </div>
                          <span>
                            WhatsApp: {weeklyData.contactName} {weeklyData.contactPhone}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              </div>
            );
          })()}

        </div>

      </div>

      {/* ── MODAL SELECTOR DEL CATÁLOGO TPV (Platos Reales del TPV) ─────────── */}
      {showCatalogModal !== null && (
        <div className="modal-backdrop-custom" onClick={() => setShowCatalogModal(null)}>
          <div className="modal-content-custom" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-custom">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ChefHat size={22} color="#f5e6c8" />
                <h2 style={{ margin: 0 }}>Platos del Catálogo TPV BaChan</h2>
              </div>
              <button className="btn-modal-close" onClick={() => setShowCatalogModal(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-custom" style={{ maxHeight: '480px', overflowY: 'auto' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {showCatalogModal === 'new'
                  ? 'Selecciona un plato de tu TPV para añadirlo como nuevo plato al flyer. Se cargará su nombre, foto e importe base del TPV:'
                  : `Selecciona un plato del TPV para asignarlo al slot #${Number(showCatalogModal) + 1}. Se cargará su nombre, foto e importe base del TPV:`}
              </p>

              {/* Buscador y Filtros */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', marginBottom: '8px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input 
                    type="text"
                    placeholder="Buscar plato del TPV por nombre..."
                    value={catalogSearch}
                    onChange={e => setCatalogSearch(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                {categories.length > 0 && (
                  <select
                    value={catalogCategoryFilter}
                    onChange={e => setCatalogCategoryFilter(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="all">Todas las categorías</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Grid de Platos del TPV */}
              <div className="catalog-tpv-grid">
                {filteredCatalogItems.map(item => {
                  const img = (item.image_url && item.image_url.trim() !== '') ? item.image_url : resolveDishImage(item, menuItems);
                  return (
                    <div 
                      key={item.id}
                      className="catalog-dish-card"
                      onClick={() => handleSelectTPVItem(item)}
                    >
                      <div className="catalog-dish-thumb">
                        <img src={img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div className="catalog-dish-info">
                        <span className="catalog-dish-name" title={item.name}>{item.name}</span>
                        <span className="catalog-dish-price">
                          {Number(item.price || 0).toFixed(2)}€
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Precio TPV</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredCatalogItems.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  No se encontraron platos que coincidan con la búsqueda.
                </div>
              )}
            </div>

            <div className="modal-footer-custom">
              <button 
                className="btn-card-action secondary" 
                style={{ width: 'auto', padding: '10px 18px' }}
                onClick={() => setShowCatalogModal(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL GALERÍA DE ILUSTRACIONES TRADICIONALES BACHAN ─────────────── */}
      {showIllustrationGalleryModal !== null && (
        <div className="modal-backdrop-custom" onClick={() => setShowIllustrationGalleryModal(null)}>
          <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h2>Galería de Ilustraciones BaChan</h2>
              <button className="btn-modal-close" onClick={() => setShowIllustrationGalleryModal(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-custom" style={{ maxHeight: '480px', overflowY: 'auto' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Selecciona una ilustración artística o la foto original del TPV para el plato #{showIllustrationGalleryModal + 1}:
              </p>

              {/* Si el plato tiene foto oficial en el catálogo del TPV, mostrarla como opción directa */}
              {(() => {
                const currentDish = weeklyData.dishes[showIllustrationGalleryModal];
                const matchedTPV = currentDish && menuItems.find(m => 
                  (currentDish.menuItemId && m.id === currentDish.menuItemId) || 
                  (m.name && currentDish.name && m.name.toLowerCase().trim() === currentDish.name.toLowerCase().trim())
                );

                if (matchedTPV?.image_url && matchedTPV.image_url.trim() !== '') {
                  return (
                    <div style={{ marginBottom: '14px', background: '#f0fdf4', padding: '10px', borderRadius: '10px', border: '1.5px solid #86efac' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#166534', marginBottom: '6px' }}>
                        📸 Foto oficial del plato en el TPV:
                      </div>
                      <div 
                        onClick={() => {
                          handleDishChange(showIllustrationGalleryModal, 'imageUrl', matchedTPV.image_url);
                          setShowIllustrationGalleryModal(null);
                          showToast(`📸 Foto oficial del TPV asignada`);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          background: '#ffffff',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid #bbf7d0',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        <div style={{ width: '48px', height: '48px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={matchedTPV.image_url} alt={matchedTPV.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#1e293b' }}>{matchedTPV.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#16a34a' }}>Hacer clic para usar esta foto del TPV</div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                {PRELOADED_DISH_ILLUSTRATIONS.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => handleSelectIllustration(item)}
                    style={{
                      border: '2px solid #3d2b1f',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: '#fffdf9',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '8px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div style={{ width: '100%', height: '100px', borderRadius: '8px', overflow: 'hidden', background: '#fcf8ee' }}>
                      <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', marginTop: '6px', textAlign: 'center', color: '#1a1815' }}>
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer-custom">
              <button 
                className="btn-card-action secondary" 
                style={{ width: 'auto', padding: '10px 18px' }}
                onClick={() => setShowIllustrationGalleryModal(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL GUÍA WHATSAPP WEB / ESCRITORIO (FOTO + TEXTO) ─────────────── */}
      {showWhatsAppDesktopModal && (
        <div className="modal-backdrop-custom" onClick={() => setShowWhatsAppDesktopModal(false)}>
          <div className="modal-content-custom" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-custom" style={{ background: '#075e54', color: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: '#25d366', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                  <WhatsAppIconSVG />
                </div>
                <h2 style={{ margin: 0, color: '#ffffff' }}>Flyer Listo para WhatsApp</h2>
              </div>
              <button className="btn-modal-close" style={{ color: '#ffffff' }} onClick={() => setShowWhatsAppDesktopModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-custom" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#e8f5e9', padding: '14px', borderRadius: '10px', border: '1px solid #c8e6c9', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={24} color="#2e7d32" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.88rem', color: '#1b5e20', lineHeight: 1.4 }}>
                  <strong>¡Imagen del flyer copiada al portapapeles y descargada!</strong><br />
                  Se ha abierto WhatsApp Web con el texto de la carta y la promoción preparado.
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e293b', marginBottom: '10px' }}>
                  📲 ¿Cómo enviar la Foto y el Texto en WhatsApp Web?
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', color: '#475569' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ background: 'var(--color-navy)', color: '#f5e6c8', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem', flexShrink: 0 }}>1</span>
                    <div>Haz clic en la conversación o grupo de WhatsApp donde quieras mandar la carta.</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ background: 'var(--color-navy)', color: '#f5e6c8', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem', flexShrink: 0 }}>2</span>
                    <div>
                      Pulsa <kbd style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#1e293b' }}>Ctrl + V</kbd> (o <kbd style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#1e293b' }}>Cmd + V</kbd> en Mac) en el recuadro de mensaje.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ background: '#25d366', color: '#ffffff', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem', flexShrink: 0 }}>3</span>
                    <div>¡La imagen del flyer se adjuntará en alta definición con todo el texto y precios! Dale a <strong>Enviar</strong>.</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-card-action secondary"
                  style={{ width: '100%', padding: '10px', fontSize: '0.82rem' }}
                  onClick={handleCopyFlyerImage}
                >
                  <ImageIcon size={15} /> Volver a Copiar Foto
                </button>
                <button
                  type="button"
                  className="btn-card-action secondary"
                  style={{ width: '100%', padding: '10px', fontSize: '0.82rem' }}
                  onClick={handleCopyWhatsAppText}
                >
                  <Copy size={15} /> Volver a Copiar Texto
                </button>
              </div>
            </div>

            <div className="modal-footer-custom" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button 
                className="btn-card-action primary" 
                style={{ width: 'auto', padding: '10px 20px', background: '#25d366', color: '#ffffff', border: 'none' }}
                onClick={() => {
                  const text = generateWhatsAppWeeklyText(weeklyData);
                  window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                }}
              >
                <ExternalLink size={16} /> Abrir WhatsApp Web
              </button>

              <button 
                className="btn-card-action secondary" 
                style={{ width: 'auto', padding: '10px 18px' }}
                onClick={() => setShowWhatsAppDesktopModal(false)}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
