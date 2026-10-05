import React, { useState, useMemo } from 'react';
import { useFlyers } from '../hooks/useFlyers';
import { 
  FLYER_THEMES, 
  PROMO_PRESETS,
  DEFAULT_WEEKLY_MENU, 
  PRELOADED_DISH_ILLUSTRATIONS,
  resolveDishImage,
  downloadFlyerImage, 
  generateWhatsAppWeeklyText,
  copyFlyerImageToClipboard,
  shareFlyerToWhatsApp
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
  ExternalLink
} from 'lucide-react';
import './Flyers.css';

// ── Sakura Vector Ornament Component ──────────────────────────────────────────
const SakuraFlowers = ({ color = '#3d2b1f', opacity = 0.6 }) => (
  <svg viewBox="0 0 100 100" fill={color} style={{ width: '100%', height: '100%', opacity }}>
    {/* Flor principal */}
    <g transform="translate(30,30)">
      <path d="M0,0 C-10,-20 10,-20 0,0" />
      <path d="M0,0 C20,-10 20,10 0,0" />
      <path d="M0,0 C10,20 -10,20 0,0" />
      <path d="M0,0 C-20,10 -20,-10 0,0" />
      <path d="M0,0 C-15,-15 -5,-25 0,0" />
      <circle cx="0" cy="0" r="3" fill="#d4af37" />
    </g>
    {/* Pétalos dispersos */}
    <path d="M70,20 Q80,15 75,30 Q65,25 70,20" />
    <path d="M85,50 Q95,45 90,60 Q80,55 85,50" />
    <path d="M40,80 Q50,75 45,90 Q35,85 40,80" />
    {/* Flor secundaria pequeña */}
    <g transform="translate(75,75) scale(0.6)">
      <path d="M0,0 C-10,-20 10,-20 0,0" />
      <path d="M0,0 C20,-10 20,10 0,0" />
      <path d="M0,0 C10,20 -10,20 0,0" />
      <path d="M0,0 C-20,10 -20,-10 0,0" />
      <circle cx="0" cy="0" r="2" fill="#d4af37" />
    </g>
  </svg>
);

// Icono WhatsApp en SVG puro
const WhatsAppIconSVG = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.771.815 2.796.815 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.767-5.768-5.767zm0 10.455c-.93 0-1.657-.256-2.457-.732l-.176-.105-1.58.415.422-1.54-.116-.184c-.524-.834-.8-1.501-.8-2.543 0-2.607 2.122-4.729 4.73-4.729 2.608 0 4.73 2.122 4.73 4.729-.001 2.608-2.123 4.729-4.73 4.729z"/>
  </svg>
);

export default function Flyers() {
  const { menuItems, categories, saveTemplate } = useFlyers();

  const [selectedThemeId, setSelectedThemeId] = useState('bachan_classic');
  const [customLogoUrl, setCustomLogoUrl] = useState('');

  // Carta Semanal Data
  const [weeklyData, setWeeklyData] = useState(DEFAULT_WEEKLY_MENU);

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

  // ── Modificar Platos de la Carta Semanal ──────────────────────────────────
  const handleDishChange = (index, field, value) => {
    const updated = [...weeklyData.dishes];
    updated[index] = { ...updated[index], [field]: value };
    setWeeklyData({ ...weeklyData, dishes: updated });
  };

  const handleAddDish = () => {
    if (weeklyData.dishes.length >= 4) {
      alert('Se recomienda un máximo de 4 platos para mantener la proporción visual perfecta del flyer.');
      return;
    }
    const newDish = {
      id: `dish_${Date.now()}`,
      name: 'Kare Japonés',
      tpvPrice: 13.5,
      price: '13,5€',
      description: '(Estofado japonés de verduras y carne con base de curry suave)',
      badge: 'puro sabor casero',
      imageUrl: '/dishes/kare.png'
    };
    setWeeklyData({ ...weeklyData, dishes: [...weeklyData.dishes, newDish] });
    showToast('🍱 Plato añadido a la carta');
  };

  const handleRemoveDish = (index) => {
    if (weeklyData.dishes.length <= 1) {
      alert('La carta semanal debe tener al menos 1 plato.');
      return;
    }
    const updated = weeklyData.dishes.filter((_, i) => i !== index);
    setWeeklyData({ ...weeklyData, dishes: updated });
  };

  // Asignar plato seleccionado desde el catálogo del TPV
  const handleSelectTPVItem = (item) => {
    if (showCatalogModal !== null) {
      const idx = showCatalogModal;
      const updated = [...weeklyData.dishes];
      
      const itemPrice = Number(item.price || 0);
      const formattedPrice = itemPrice > 0 ? `${itemPrice.toFixed(1).replace('.', ',')}€` : '10,0€';
      const resolvedImg = item.image_url || resolveDishImage(item);

      updated[idx] = {
        ...updated[idx],
        name: item.name,
        tpvPrice: itemPrice,
        price: formattedPrice,
        imageUrl: resolvedImg,
        description: item.description || updated[idx].description || `(Elaborado fresco por la abuela BaChan)`,
        badge: updated[idx].badge || 'especialidad'
      };

      setWeeklyData({ ...weeklyData, dishes: updated });
      setShowCatalogModal(null);
      showToast(`🍱 ${item.name} asignado desde el TPV (${formattedPrice})`);
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
            <label className="editor-section-title">
              <Layers size={16} /> Estilo Visual del Flyer
            </label>
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
          <div>
            <label className="editor-section-title">
              <Sparkles size={16} /> Textos de Cabecera
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <div className="form-group-custom">
                <label>Título Superior</label>
                <input 
                  type="text" 
                  value={weeklyData.headerTitle}
                  onChange={e => setWeeklyData({ ...weeklyData, headerTitle: e.target.value })}
                />
              </div>
              <div className="form-group-custom">
                <label>Subtítulo de Impacto</label>
                <input 
                  type="text" 
                  value={weeklyData.headerSubtitle}
                  onChange={e => setWeeklyData({ ...weeklyData, headerSubtitle: e.target.value })}
                />
              </div>
              <div className="form-group-custom">
                <label>Lema / Frase de la Marca</label>
                <textarea 
                  rows={2}
                  value={weeklyData.headerTagline}
                  onChange={e => setWeeklyData({ ...weeklyData, headerTagline: e.target.value })}
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
                const dishImgUrl = resolveDishImage(dish);
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

                    {/* Descripción entre paréntesis */}
                    <div className="form-group-custom">
                      <label>Descripción / Acompañamiento</label>
                      <input 
                        type="text" 
                        value={dish.description}
                        onChange={e => handleDishChange(idx, 'description', e.target.value)}
                        placeholder="Ej: (Chuleta de cerdo crujiente con arroz, sopa miso...)"
                      />
                    </div>

                    {/* Badge / Claim y Sugerencias Rápidas */}
                    <div className="form-group-custom">
                      <label>Pastilla / Claim de Sabor</label>
                      <input 
                        type="text" 
                        value={dish.badge || ''}
                        onChange={e => handleDishChange(idx, 'badge', e.target.value)}
                        placeholder="Ej: el clásico crujiente, 🎓 Promo Estudiante..."
                      />
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {['el clásico crujiente', '🎓 Promo Estudiante', '⭐ Recomendado', '🔥 Oferta', '🌱 Vegano', '🏫 Tarifa Maru'].map(sugg => (
                          <button
                            key={sugg}
                            type="button"
                            onClick={() => handleDishChange(idx, 'badge', sugg)}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              fontSize: '0.68rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: '#475569'
                            }}
                          >
                            +{sugg}
                          </button>
                        ))}
                      </div>
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
                  <div className="sakura-corner top-left">
                    <SakuraFlowers color={currentTheme.accent} />
                  </div>
                  <div className="sakura-corner top-right">
                    <SakuraFlowers color={currentTheme.accent} />
                  </div>
                  <div className="sakura-corner bottom-left">
                    <SakuraFlowers color={currentTheme.accent} />
                  </div>
                  <div className="sakura-corner bottom-right">
                    <SakuraFlowers color={currentTheme.accent} />
                  </div>

                  {/* ── CABECERA: Logo oficial de la abuela y Titulares ─────── */}
                  <div className="poster-header-section">
                    <img 
                      src={activeLogo} 
                      alt="BaChan BentoBox" 
                      className="poster-logo-seal"
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
                  <div className="poster-dishes-column">
                    {weeklyData.dishes.map((dish, i) => {
                      const dishImg = resolveDishImage(dish);

                      return (
                        <div 
                          key={dish.id || i}
                          className="poster-dish-card"
                          style={{
                            backgroundColor: currentTheme.cardBg,
                            borderColor: currentTheme.border
                          }}
                        >
                          {/* Thumbnail de la ilustración en alta resolución */}
                          <div className="dish-thumbnail-box">
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
                              style={{ color: currentTheme.textPrimary }}
                            >
                              {dish.name}
                            </h4>
                            <p 
                              className="dish-desc-text"
                              style={{ color: currentTheme.textSecondary }}
                            >
                              {dish.description}
                            </p>
                          </div>

                          {/* Precio y Pastilla de Sabor */}
                          <div className="dish-price-badge-col">
                            <span 
                              className="dish-price-val"
                              style={{ color: currentTheme.textPrimary }}
                            >
                              {dish.price}
                            </span>
                            {dish.badge && (
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
                Selecciona un plato del TPV para asignarlo al slot #{showCatalogModal + 1}. Se cargará su nombre, foto e importe base del TPV:
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
                  const img = item.image_url || resolveDishImage(item);
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

            <div className="modal-body-custom" style={{ maxHeight: '450px', overflowY: 'auto' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Selecciona una ilustración artística para el plato #{showIllustrationGalleryModal + 1}:
              </p>

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
