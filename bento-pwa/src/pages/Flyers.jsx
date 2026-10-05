import React, { useState } from 'react';
import { useFlyers } from '../hooks/useFlyers';
import { 
  FLYER_THEMES, 
  DEFAULT_WEEKLY_MENU, 
  DEFAULT_PRODUCT_FLYER, 
  PRELOADED_DISH_ILLUSTRATIONS,
  resolveDishImage,
  downloadFlyerImage, 
  generateWhatsAppWeeklyText, 
  generateWhatsAppProductText 
} from '../lib/flyerService';
import { 
  Sparkles, 
  Download, 
  Share2, 
  Copy, 
  Calendar, 
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
  Grid
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
  const { recipes, saveTemplate } = useFlyers();

  const [selectedThemeId, setSelectedThemeId] = useState('bachan_classic');
  const [customLogoUrl, setCustomLogoUrl] = useState('');

  // Carta Semanal Data
  const [weeklyData, setWeeklyData] = useState(DEFAULT_WEEKLY_MENU);

  // Modals & Feedback
  const [showRecipePickerModal, setShowRecipePickerModal] = useState(null); // index of dish to assign
  const [showIllustrationGalleryModal, setShowIllustrationGalleryModal] = useState(null); // index of dish to pick illustration
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const currentTheme = FLYER_THEMES.find(t => t.id === selectedThemeId) || FLYER_THEMES[0];
  const activeLogo = customLogoUrl || currentTheme.logo;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
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
      description: '(Estofado japonés de verduras y carne con base de curry)',
      price: '13,5€',
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

  const handleSelectRecipeForDish = (recipe) => {
    if (showRecipePickerModal !== null) {
      const idx = showRecipePickerModal;
      const updated = [...weeklyData.dishes];
      
      // Auto-match illustration from recipe name
      const tempDish = { name: recipe.name, imageUrl: recipe.image_url };
      const resolvedImg = resolveDishImage(tempDish);

      updated[idx] = {
        ...updated[idx],
        name: recipe.name,
        price: recipe.sale_price ? `${Number(recipe.sale_price).toFixed(1).replace('.', ',')}€` : updated[idx].price,
        imageUrl: resolvedImg,
        description: recipe.notes || updated[idx].description
      };
      setWeeklyData({ ...weeklyData, dishes: updated });
      setShowRecipePickerModal(null);
      showToast(`🍱 ${recipe.name} asignado al flyer`);
    }
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

  // ── Copiar Texto Formateado para WhatsApp ─────────────────────────────────
  const handleCopyWhatsAppText = () => {
    const text = generateWhatsAppWeeklyText(weeklyData);
    navigator.clipboard.writeText(text);
    showToast('📋 ¡Texto de la carta copiado con emojis!');
  };

  // ── Compartir en WhatsApp ────────────────────────────────────────────────
  const handleShareWhatsApp = () => {
    const text = generateWhatsAppWeeklyText(weeklyData);
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // ── Guardar Plantilla ────────────────────────────────────────────────────
  const handleSaveCurrentTemplate = async () => {
    const titlePrompt = prompt('Nombre para guardar esta carta semanal:', 'Carta Semanal BaChan');
    if (!titlePrompt) return;

    await saveTemplate({
      title: titlePrompt,
      type: 'weekly_menu',
      theme: selectedThemeId,
      content: weeklyData
    });
    showToast('💾 Carta semanal guardada con éxito');
  };

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
          <h1><Sparkles size={32} color="#f5e6c8" /> Creador de Cartas Semanales & Flyers BaChan</h1>
          <p>Genera la pequeña carta semanal con ilustraciones tradicionales japonesas y descárgala en alta definición</p>
        </div>

        <button 
          className="btn-export-action copy" 
          style={{ width: 'auto', background: 'rgba(255,255,255,0.1)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}
          onClick={handleSaveCurrentTemplate}
        >
          💾 Guardar Carta
        </button>
      </section>

      {/* ── MAIN GENERATOR SPLIT ───────────────────────────────────────────── */}
      <div className="flyers-layout-container">

        {/* ── COLUMNA IZQUIERDA: CONFIGURADOR ───────────────────────────────── */}
        <div className="flyer-editor-panel">
          
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

          {/* ── TEXTOS DE CABECERA ─────────────────────────────────────────── */}
          <div>
            <label className="editor-section-title">
              <Sparkles size={16} /> Textos de Cabecera
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label className="editor-section-title">
                <Utensils size={16} /> Platos de la Carta ({weeklyData.dishes.length})
              </label>
              <button 
                type="button" 
                className="btn-card-action primary"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.78rem' }}
                onClick={handleAddDish}
              >
                <Plus size={14} /> Añadir Plato
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {weeklyData.dishes.map((dish, idx) => {
                const dishImgUrl = resolveDishImage(dish);

                return (
                  <div key={dish.id || idx} className="dish-editor-card">
                    <div className="dish-editor-header">
                      <span className="dish-badge-num">Plato #{idx + 1}</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button 
                          type="button" 
                          className="btn-choose-catalog"
                          onClick={() => setShowRecipePickerModal(idx)}
                        >
                          <ChefHat size={14} /> Catálogo
                        </button>
                        <button 
                          type="button" 
                          className="btn-choose-catalog"
                          style={{ color: '#d97706' }}
                          onClick={() => setShowIllustrationGalleryModal(idx)}
                        >
                          <Grid size={14} /> Ilustraciones IA
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveDish(idx)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          title="Eliminar este plato"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Fila con Foto y Nombre */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div 
                        onClick={() => setShowIllustrationGalleryModal(idx)}
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          border: '2px solid #3d2b1f',
                          background: '#fff',
                          cursor: 'pointer',
                          flexShrink: 0,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                        }}
                        title="Haz clic para cambiar la ilustración"
                      >
                        <img 
                          src={dishImgUrl} 
                          alt={dish.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>

                      <div className="form-group-custom" style={{ flex: 1 }}>
                        <label>Nombre del Plato</label>
                        <input 
                          type="text" 
                          value={dish.name}
                          onChange={e => handleDishChange(idx, 'name', e.target.value)}
                          placeholder="Ej: Tonkatsu Bento"
                        />
                      </div>

                      <div className="form-group-custom" style={{ width: '85px' }}>
                        <label>Precio</label>
                        <input 
                          type="text" 
                          value={dish.price}
                          onChange={e => handleDishChange(idx, 'price', e.target.value)}
                          placeholder="12,5€"
                        />
                      </div>
                    </div>

                    {/* Descripción entre paréntesis */}
                    <div className="form-group-custom">
                      <label>Descripción / Acompañamiento</label>
                      <input 
                        type="text" 
                        value={dish.description}
                        onChange={e => handleDishChange(idx, 'description', e.target.value)}
                        placeholder="Ej: (Chuleta de cerdo crujiente con arroz, sopa miso y acompañamientos)"
                      />
                    </div>

                    {/* Badge de Sabor y Botón Subir */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div className="form-group-custom">
                        <label>Pastilla / Claim de Sabor</label>
                        <input 
                          type="text" 
                          value={dish.badge}
                          onChange={e => handleDishChange(idx, 'badge', e.target.value)}
                          placeholder="Ej: el clásico crujiente"
                        />
                      </div>

                      <div className="form-group-custom">
                        <label>Cambiar Foto</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setShowIllustrationGalleryModal(idx)}
                            style={{
                              flex: 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              padding: '8px',
                              background: '#fef3c7',
                              color: '#b45309',
                              border: '1px solid #fde68a',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}
                          >
                            <Wand2 size={13} /> Galería
                          </button>

                          <label 
                            style={{
                              flex: 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              padding: '8px',
                              background: '#ffffff',
                              border: '1px dashed #cbd5e1',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              color: '#475569'
                            }}
                          >
                            <Upload size={13} /> Subir
                            <input 
                              type="file" 
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={e => {
                                if (e.target.files?.[0]) {
                                  handleImageUploadForDish(idx, e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                        </div>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
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

        </div>

        {/* ── COLUMNA DERECHA: LIVE CANVAS PREVIEW & EXPORT ─────────────────── */}
        <div className="flyer-preview-panel">
          
          {/* Botones de acción rápida */}
          <div className="preview-actions-bar">
            <button 
              className="btn-export-action download"
              onClick={handleDownloadImage}
              disabled={isExporting}
            >
              <Download size={18} /> {isExporting ? 'Generando HD...' : 'Descargar Flyer HD'}
            </button>

            <button 
              className="btn-export-action whatsapp"
              onClick={handleShareWhatsApp}
            >
              <Share2 size={18} /> WhatsApp
            </button>

            <button 
              className="btn-export-action copy"
              onClick={handleCopyWhatsAppText}
            >
              <Copy size={18} /> Copiar Texto
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
                      crossOrigin="anonymous"
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
                              crossOrigin="anonymous"
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

      {/* ── MODAL SELECTOR DE RECETA / BENTO DEL CATÁLOGO ──────────────────── */}
      {showRecipePickerModal !== null && (
        <div className="modal-backdrop-custom" onClick={() => setShowRecipePickerModal(null)}>
          <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h2>Seleccionar Plato del Catálogo BaChan</h2>
              <button className="btn-modal-close" onClick={() => setShowRecipePickerModal(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-custom" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Haz clic en cualquier receta para rellenar automáticamente el plato #{showRecipePickerModal + 1}:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recipes.map(recipe => (
                  <div 
                    key={recipe.id}
                    className="whatsapp-template-card"
                    onClick={() => handleSelectRecipeForDish(recipe)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#0c1c2e' }}>🍱 {recipe.name}</span>
                      {recipe.sale_price > 0 && (
                        <span style={{ fontWeight: 'bold', color: '#15803d' }}>
                          {Number(recipe.sale_price).toFixed(2)}€
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Tipo: {recipe.recipe_type || 'Elaboración'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer-custom">
              <button 
                className="btn-card-action secondary" 
                style={{ width: 'auto', padding: '10px 18px' }}
                onClick={() => setShowRecipePickerModal(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
