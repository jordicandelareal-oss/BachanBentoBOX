import React, { useState, useMemo, useRef } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { 
  buildWhatsAppLink, 
  checkBirthdayStatus,
  pickContactFromPhone,
  pastePhoneFromClipboard,
  parseVCard,
  CUSTOMER_LANGUAGES
} from '../lib/customerService';
import { 
  Users, 
  Cake, 
  Crown, 
  TrendingUp, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  AlertTriangle, 
  Sparkles, 
  UtensilsCrossed, 
  ShoppingBag, 
  Calendar, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  MessageSquare, 
  ExternalLink, 
  Gift, 
  Percent, 
  ChevronRight,
  Clock,
  Heart,
  RefreshCw,
  Receipt,
  BookUser,
  Smartphone,
  ClipboardPaste,
  Info,
  FileUp,
  Apple,
  Languages,
  Globe
} from 'lucide-react';
import './Customers.css';

export default function Customers() {
  const { 
    customers, 
    orders,
    loading, 
    summary, 
    syncFromOrders,
    addCustomer, 
    editCustomer, 
    removeCustomer 
  } = useCustomers();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, birthday, vip, allergens, orders
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Modals state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showAgendaGuideModal, setShowAgendaGuideModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null);
  const [whatsappModalCustomer, setWhatsappModalCustomer] = useState(null);
  const [whatsappLanguage, setWhatsappLanguage] = useState('es');
  const [customDiscount, setCustomDiscount] = useState(10);
  const [toastMessage, setToastMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    birthday: '',
    address: '',
    allergens: '',
    notes: '',
    loyalty_tier: 'standard',
    discount_percent: 0,
    favorite_dish: '',
    language: 'es'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // ── Sincronizar desde Tickets de Venta ─────────────────────────────────────
  const handleSyncTickets = async () => {
    setIsSyncing(true);
    try {
      const res = await syncFromOrders();
      if (res.countCreated > 0) {
        showToast(`🎉 ¡Sincronizados ${res.countCreated} nuevos clientes desde tickets!`);
      } else {
        showToast(`✅ Clientes al día. Analizados ${orders?.length || 0} tickets de venta.`);
      }
    } catch (err) {
      console.error('Error syncing:', err);
      showToast('⚠️ Error al sincronizar comandas');
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Filtrado Inteligente ──────────────────────────────────────────────────
  const filteredCustomers = useMemo(() => {
    let result = customers;

    // Filter chip
    if (activeFilter === 'birthday') {
      result = result.filter(c => c.birthdayStatus?.isToday || c.birthdayStatus?.isUpcoming);
    } else if (activeFilter === 'vip') {
      result = result.filter(c => c.loyalty_tier === 'vip' || c.loyalty_tier === 'gold');
    } else if (activeFilter === 'allergens') {
      result = result.filter(c => c.allergens && c.allergens.trim().length > 0);
    } else if (activeFilter === 'orders') {
      result = result.filter(c => (c.stats?.ordersCount || 0) > 0);
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(c => 
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        (c.favorite_dish || '').toLowerCase().includes(q) ||
        (c.notes || '').toLowerCase().includes(q) ||
        (c.allergens || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [customers, activeFilter, searchTerm]);

  // ── Handlers de Formulario ────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      birthday: '',
      address: '',
      allergens: '',
      notes: '',
      loyalty_tier: 'standard',
      discount_percent: 0,
      favorite_dish: '',
      language: 'es'
    });
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      birthday: customer.birthday || '',
      address: customer.address || '',
      allergens: customer.allergens || '',
      notes: customer.notes || '',
      loyalty_tier: customer.loyalty_tier || 'standard',
      discount_percent: customer.discount_percent || 0,
      favorite_dish: customer.favorite_dish || '',
      language: customer.language || 'es'
    });
    setShowAddEditModal(true);
  };

  const handleOpenWhatsAppModal = (customer) => {
    setWhatsappModalCustomer(customer);
    setWhatsappLanguage(customer.language || 'es');
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('El nombre del cliente es obligatorio');
      return;
    }

    try {
      if (editingCustomer) {
        const res = await editCustomer(editingCustomer.id, formData);
        if (res.success) {
          showToast('✅ Ficha y datos de cliente guardados');
          if (selectedCustomerDetail?.id === editingCustomer.id) {
            setSelectedCustomerDetail(prev => ({ ...prev, ...formData }));
          }
        } else {
          showToast('⚠️ No se pudo actualizar en Supabase');
        }
      } else {
        const res = await addCustomer(formData);
        if (res.success) {
          showToast('🎉 Nuevo cliente registrado en Supabase');
        } else {
          showToast('⚠️ No se pudo registrar el cliente');
        }
      }
    } catch (err) {
      console.error('Error guardando cliente:', err);
      showToast('❌ Error al guardar cliente');
    }

    setShowAddEditModal(false);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`¿Estás seguro de eliminar la ficha de ${name}?`)) {
      await removeCustomer(id);
      showToast('🗑️ Cliente eliminado');
      if (selectedCustomerDetail?.id === id) {
        setSelectedCustomerDetail(null);
      }
    }
  };

  // ── Contact Picker API (Agenda del Móvil) ─────────────────────────────────
  const handlePickContact = async () => {
    const res = await pickContactFromPhone();
    if (res.supported && res.success && res.contact) {
      const { name, phone, email } = res.contact;
      setFormData(prev => ({
        ...prev,
        phone: phone || prev.phone,
        name: (!prev.name.trim() || prev.name === 'Nuevo Cliente') && name ? name : prev.name,
        email: !prev.email && email ? email : prev.email
      }));
      showToast(`📱 Teléfono de ${name || phone} cargado desde tu agenda`);
    } else if (!res.supported) {
      // Navegador sin Contact Picker API directa (ej. Safari iOS)
      setShowAgendaGuideModal(true);
    } else if (res.error) {
      showToast('⚠️ No se pudo acceder a la agenda');
    }
  };

  const vcardInputRef = useRef(null);

  const handlePastePhone = async () => {
    const res = await pastePhoneFromClipboard();
    if (res.success && res.phone) {
      setFormData(prev => ({ ...prev, phone: res.phone }));
      showToast(`📋 Teléfono pegado: ${res.phone}`);
    } else {
      showToast('ℹ️ Copia primero un número de tu agenda o WhatsApp');
    }
  };

  const handleVCardFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const parsed = parseVCard(content);
        if (parsed.phone || parsed.name || parsed.email) {
          setFormData(prev => ({
            ...prev,
            phone: parsed.phone || prev.phone,
            name: (!prev.name.trim() || prev.name === 'Nuevo Cliente') && parsed.name ? parsed.name : (parsed.name || prev.name),
            email: !prev.email && parsed.email ? parsed.email : prev.email,
            address: !prev.address && parsed.address ? parsed.address : prev.address
          }));
          showToast(`📇 Contacto importado: ${parsed.name || parsed.phone}`);
          setShowAgendaGuideModal(false);
        } else {
          showToast('⚠️ No se detectaron números en la tarjeta');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ── Abrir WhatsApp ────────────────────────────────────────────────────────
  const handleSendWhatsApp = (type) => {
    if (!whatsappModalCustomer || !whatsappModalCustomer.phone) {
      alert('Este cliente no tiene número de teléfono registrado');
      return;
    }

    const url = buildWhatsAppLink(whatsappModalCustomer.phone, type, {
      customerName: whatsappModalCustomer.name,
      discount: customDiscount || whatsappModalCustomer.discount_percent || 10,
      favoriteDish: whatsappModalCustomer.stats?.favoriteDish || whatsappModalCustomer.favorite_dish || 'Bento BaChan',
      language: whatsappLanguage || whatsappModalCustomer.language || 'es'
    });

    if (url) {
      window.open(url, '_blank');
      setWhatsappModalCustomer(null);
    }
  };

  return (
    <div className="customers-root">

      {/* ── TOAST NOTIFICATION ──────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="custom-toast-notification">
          {toastMessage}
        </div>
      )}

      {/* ── HEADER & KPIS ──────────────────────────────────────────────────── */}
      <section className="customers-header-card">
        <div className="customers-title-row">
          <div className="customers-title-group">
            <h1><Users size={32} color="#f5e6c8" /> Clientes & Fidelización</h1>
            <p>Fichas reales de clientes, histórico de tickets de venta, preferencias y ofertas WhatsApp</p>
          </div>
          <div className="customers-actions-group">
            <button 
              className="btn-sync-tickets" 
              onClick={handleSyncTickets}
              disabled={isSyncing}
              title="Analizar tickets de venta del TPV y sincronizar clientes automáticamente"
            >
              <RefreshCw size={18} className={isSyncing ? 'spin-icon' : ''} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Tickets TPV'}</span>
            </button>
            <button className="btn-add-customer" onClick={handleOpenAdd}>
              <Plus size={20} /> Nuevo Cliente
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="customers-kpi-grid">
          <div className="customer-kpi-card">
            <div className="kpi-icon-badge blue"><Users size={22} /></div>
            <div>
              <div className="kpi-info-val">{summary.totalCustomers}</div>
              <div className="kpi-info-lbl">Clientes Reales</div>
            </div>
          </div>

          <div className="customer-kpi-card">
            <div className="kpi-icon-badge rose"><Cake size={22} /></div>
            <div>
              <div className="kpi-info-val">{summary.birthdaysSoon}</div>
              <div className="kpi-info-lbl">Cumpleaños Pronto</div>
            </div>
          </div>

          <div className="customer-kpi-card">
            <div className="kpi-icon-badge gold"><Crown size={22} /></div>
            <div>
              <div className="kpi-info-val">{summary.vipCount}</div>
              <div className="kpi-info-lbl">Clientes VIP / Gold</div>
            </div>
          </div>

          <div className="customer-kpi-card">
            <div className="kpi-icon-badge emerald"><TrendingUp size={22} /></div>
            <div>
              <div className="kpi-info-val">{(summary.totalOrdersRevenue || summary.totalRevenueFromCustomers || 0).toFixed(2)}€</div>
              <div className="kpi-info-lbl">Ventas Acumuladas</div>
            </div>
          </div>
        </div>

        {/* Birthday Alert Banner if someone has a birthday today */}
        {summary.birthdaysToday > 0 && (
          <div className="birthday-alert-bar">
            <div className="birthday-alert-left">
              <Gift size={24} color="#f43f5e" />
              <span>🎂 ¡Hoy es el cumpleaños de <strong>{summary.birthdaysToday}</strong> de tus clientes! Envíales una felicitación y regalo.</span>
            </div>
            <button 
              className="btn-card-action whatsapp"
              style={{ width: 'auto', padding: '8px 16px' }}
              onClick={() => {
                const bdayCust = customers.find(c => c.birthdayStatus?.isToday);
                if (bdayCust) handleOpenWhatsAppModal(bdayCust);
              }}
            >
              <Cake size={16} /> Felicitar ahora
            </button>
          </div>
        )}
      </section>

      {/* ── SEARCH & FILTER CONTROLS ───────────────────────────────────────── */}
      <section className="customers-controls">
        <div className="customers-search-bar">
          <Search size={20} />
          <input 
            type="text"
            className="customers-search-input"
            placeholder="Buscar por nombre, teléfono, plato favorito, ticket o notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="customers-filter-chips">
          <button 
            className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Todos ({customers.length})
          </button>
          <button 
            className={`filter-chip ${activeFilter === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveFilter('orders')}
          >
            🧾 Con Comandas ({customers.filter(c => (c.stats?.ordersCount || 0) > 0).length})
          </button>
          <button 
            className={`filter-chip ${activeFilter === 'vip' ? 'active' : ''}`}
            onClick={() => setActiveFilter('vip')}
          >
            ⭐ VIP & Gold ({summary.vipCount})
          </button>
          <button 
            className={`filter-chip ${activeFilter === 'birthday' ? 'active' : ''}`}
            onClick={() => setActiveFilter('birthday')}
          >
            🎂 Cumpleaños ({summary.birthdaysSoon})
          </button>
          <button 
            className={`filter-chip ${activeFilter === 'allergens' ? 'active' : ''}`}
            onClick={() => setActiveFilter('allergens')}
          >
            ⚠️ Con Alérgenos
          </button>
        </div>
      </section>

      {/* ── CUSTOMERS GRID ─────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          <p>Cargando fichas de clientes y tickets de venta...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--color-border)',
          color: '#64748b'
        }}>
          <Users size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <h3>No se encontraron clientes</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>
            {searchTerm ? 'Intenta con otro término de búsqueda' : 'Sincroniza tus tickets de venta para importar las fichas automáticamente.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '16px' }}>
            <button 
              className="btn-sync-tickets"
              style={{ background: 'var(--color-navy)', color: '#f5e6c8' }}
              onClick={handleSyncTickets}
            >
              <RefreshCw size={16} /> Sincronizar de Tickets
            </button>
            <button 
              className="btn-add-customer" 
              onClick={handleOpenAdd}
            >
              <Plus size={18} /> Añadir Cliente Manual
            </button>
          </div>
        </div>
      ) : (
        <div className="customers-grid">
          {filteredCustomers.map(customer => {
            const initials = (customer.name || 'C')
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            const isBirthdayToday = customer.birthdayStatus?.isToday;
            const isBirthdayUpcoming = customer.birthdayStatus?.isUpcoming;
            const ordersCount = customer.stats?.ordersCount || 0;
            const totalSpent = customer.stats?.totalSpent || 0;
            const favorite = customer.stats?.calculatedFavorite || customer.favorite_dish || 'Plato combinado';

            return (
              <div 
                key={customer.id} 
                className={`customer-card ${customer.loyalty_tier} ${isBirthdayToday ? 'birthday-today-border' : ''}`}
                onClick={() => setSelectedCustomerDetail(customer)}
              >
                {/* Header de la Tarjeta */}
                <div className="customer-card-header">
                  <div className="customer-avatar">
                    {initials}
                  </div>
                  <div className="customer-main-info">
                    <div className="customer-name-row">
                      <span className="customer-name">{customer.name}</span>
                      <div className="customer-badges-group">
                        <span className={`loyalty-badge ${customer.loyalty_tier}`}>
                          {customer.loyalty_tier === 'vip' ? '👑 VIP' : customer.loyalty_tier === 'gold' ? '⭐ Gold' : customer.loyalty_tier === 'frequent' ? '🥢 Habitual' : 'Estándar'}
                        </span>
                        <span 
                          className="customer-lang-pill" 
                          title={`Idioma de contacto: ${customer.language === 'ja' ? 'Japonés' : customer.language === 'en' ? 'English' : 'Español'}`}
                        >
                          {customer.language === 'ja' ? '🇯🇵 日本語' : customer.language === 'en' ? '🇬🇧 EN' : '🇪🇸 ES'}
                        </span>
                      </div>
                    </div>
                    <div className="customer-contact-quick">
                      {customer.phone ? (
                        <span><Phone size={12} /> {customer.phone}</span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Completar teléfono</span>
                      )}
                      {customer.birthday && (
                        <span><Cake size={12} /> {customer.birthday}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Banner de Cumpleaños */}
                {isBirthdayToday && (
                  <div className="customer-badge-birthday">
                    🎉 ¡CUMPLEAÑOS HOY! Enviar regalo
                  </div>
                )}
                {isBirthdayUpcoming && !isBirthdayToday && (
                  <div className="customer-badge-birthday" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                    🎂 Cumpleaños en {customer.birthdayStatus.daysUntil} días
                  </div>
                )}

                {/* Métricas de Consumo Real */}
                <div className="customer-card-stats">
                  <div className="stat-item-card">
                    <div className="stat-val">{totalSpent > 0 ? `${totalSpent.toFixed(2)}€` : '0.00€'}</div>
                    <div className="stat-lbl">Total Gastado</div>
                  </div>
                  <div className="stat-item-card">
                    <div className="stat-val">{ordersCount}</div>
                    <div className="stat-lbl">Tickets / Comandas</div>
                  </div>
                  <div className="stat-item-card">
                    <div className="stat-val">
                      {customer.discount_percent > 0 ? `${customer.discount_percent}%` : '0%'}
                    </div>
                    <div className="stat-lbl">Descuento</div>
                  </div>
                </div>

                {/* Preferencias Culinarias */}
                <div className="customer-favorite-dish">
                  <UtensilsCrossed size={14} color="#8c2d19" />
                  <span className="fav-label">Favorito:</span>
                  <span className="fav-name">{favorite}</span>
                </div>

                {/* Alérgenos o Alerta */}
                {customer.allergens && (
                  <div className="customer-allergens-tag">
                    <AlertTriangle size={12} /> {customer.allergens}
                  </div>
                )}

                {/* Acciones de la Tarjeta */}
                <div className="customer-card-actions" onClick={e => e.stopPropagation()}>
                  <button 
                    className="btn-card-action primary"
                    onClick={() => setSelectedCustomerDetail(customer)}
                    title="Ver ficha completa e historial"
                  >
                    <Receipt size={14} /> Ficha & Historial
                  </button>

                  <button 
                    className="btn-card-action whatsapp"
                    onClick={() => handleOpenWhatsAppModal(customer)}
                    title="Enviar promoción o felicitación por WhatsApp"
                  >
                    <MessageSquare size={14} /> WhatsApp
                  </button>

                  <button 
                    className="btn-card-action secondary"
                    onClick={() => handleOpenEdit(customer)}
                    title="Editar información"
                  >
                    <Edit3 size={14} />
                  </button>

                  <button 
                    className="btn-card-action danger"
                    onClick={() => handleDelete(customer.id, customer.name)}
                    title="Eliminar cliente"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL DETALLE / HISTORIAL COMPLETO ─────────────────────────────── */}
      {selectedCustomerDetail && (
        <div className="modal-backdrop-custom" onClick={() => setSelectedCustomerDetail(null)}>
          <div className="modal-content-custom modal-detail" onClick={e => e.stopPropagation()}>
            <div className="modal-header-custom">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="customer-avatar" style={{ width: '44px', height: '44px', fontSize: '1.1rem' }}>
                  {(selectedCustomerDetail.name || 'C').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{selectedCustomerDetail.name}</h2>
                  <span className={`loyalty-badge ${selectedCustomerDetail.loyalty_tier}`} style={{ marginTop: '4px' }}>
                    {selectedCustomerDetail.loyalty_tier?.toUpperCase()} • {selectedCustomerDetail.discount_percent || 0}% Descuento TPV
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  className="btn-card-action secondary"
                  style={{ width: 'auto', padding: '6px 12px' }}
                  onClick={() => {
                    handleOpenEdit(selectedCustomerDetail);
                  }}
                >
                  <Edit3 size={14} /> Editar Ficha
                </button>
                <button className="btn-modal-close" onClick={() => setSelectedCustomerDetail(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="modal-body-custom" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Info de Contacto y Preferencias */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📞 CONTACTO</div>
                  <div style={{ fontWeight: 'bold', marginTop: '2px' }}>{selectedCustomerDetail.phone || 'Sin teléfono registrado'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedCustomerDetail.email || 'Sin email'}</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>🎂 CUMPLEAÑOS</div>
                  <div style={{ fontWeight: 'bold', marginTop: '2px' }}>
                    {selectedCustomerDetail.birthday || 'No registrado'}
                  </div>
                  {selectedCustomerDetail.birthdayStatus?.isToday && (
                    <span style={{ color: '#e11d48', fontSize: '0.8rem', fontWeight: 'bold' }}>🎉 ¡Cumpleaños hoy!</span>
                  )}
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>🌐 IDIOMA DE TRATO</div>
                  <div style={{ fontWeight: 'bold', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {selectedCustomerDetail.language === 'ja' ? '🇯🇵 日本語 (Japonés)' : selectedCustomerDetail.language === 'en' ? '🇬🇧 English' : '🇪🇸 Español'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>Mensajes automáticos en este idioma</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📍 DIRECCIÓN HABITUAL</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '500', marginTop: '2px' }}>
                    {selectedCustomerDetail.address || 'Recoge en local / Delivery'}
                  </div>
                </div>
              </div>

              {/* Métricas Grandes */}
              <div className="customer-card-stats" style={{ padding: '16px' }}>
                <div className="stat-item-card">
                  <div className="stat-val" style={{ fontSize: '1.2rem', color: '#0c1c2e' }}>
                    {selectedCustomerDetail.stats?.totalSpent?.toFixed(2) || '0.00'}€
                  </div>
                  <div className="stat-lbl">Gasto Acumulado</div>
                </div>
                <div className="stat-item-card">
                  <div className="stat-val" style={{ fontSize: '1.2rem', color: '#0c1c2e' }}>
                    {selectedCustomerDetail.stats?.ordersCount || 0}
                  </div>
                  <div className="stat-lbl">Tickets Totales</div>
                </div>
                <div className="stat-item-card">
                  <div className="stat-val" style={{ fontSize: '1.2rem', color: '#0c1c2e' }}>
                    {selectedCustomerDetail.stats?.averageTicket?.toFixed(2) || '0.00'}€
                  </div>
                  <div className="stat-lbl">Ticket Medio</div>
                </div>
              </div>

              {/* Platos Favoritos Ranking */}
              <div>
                <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: '#475569', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Heart size={16} color="#ef4444" /> Platos Más Pedidos por este Cliente
                </h4>
                {selectedCustomerDetail.stats?.topDishes && selectedCustomerDetail.stats.topDishes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedCustomerDetail.stats.topDishes.slice(0, 4).map((dish, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px' }}>
                        <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                          #{i+1} {dish.name}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>
                          {dish.count} uds ({dish.percent}%)
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <strong>Favorito registrado:</strong> {selectedCustomerDetail.favorite_dish || 'Plato combinado'}
                  </div>
                )}
              </div>

              {/* Historial de Pedidos */}
              <div>
                <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: '#475569', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} /> Historial de Tickets ({selectedCustomerDetail.stats?.orders?.length || 0})
                </h4>
                {selectedCustomerDetail.stats?.orders && selectedCustomerDetail.stats.orders.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                    {selectedCustomerDetail.stats.orders.map((order, idx) => (
                      <div key={idx} className="order-history-item" style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div className="order-history-top" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#1e293b' }}>
                            Ticket #{order.ticket_number || idx + 1} • {new Date(order.sold_at || order.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span style={{ fontWeight: '800', color: '#0c1c2e' }}>
                            {Number(order.total || 0).toFixed(2)}€
                          </span>
                        </div>
                        <div className="order-history-items-list" style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {Array.isArray(order.items) ? order.items.map(it => `${it.quantity || 1}x ${it.name}`).join(', ') : 'Comanda TPV'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Sin pedidos registrados hasta el momento.</p>
                )}
              </div>

              {/* Notas y Alérgenos */}
              {(selectedCustomerDetail.notes || selectedCustomerDetail.allergens) && (
                <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {selectedCustomerDetail.allergens && (
                    <div style={{ color: '#b45309', fontWeight: 'bold', marginBottom: '4px' }}>
                      ⚠️ Alérgenos: {selectedCustomerDetail.allergens}
                    </div>
                  )}
                  {selectedCustomerDetail.notes && (
                    <div style={{ color: '#78350f' }}>
                      📝 Notas: {selectedCustomerDetail.notes}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer-custom">
              {selectedCustomerDetail.phone && (
                <button 
                  className="btn-card-action whatsapp" 
                  style={{ width: 'auto', padding: '10px 18px' }}
                  onClick={() => {
                    handleOpenWhatsAppModal(selectedCustomerDetail);
                  }}
                >
                  <MessageSquare size={16} /> Enviar Oferta WhatsApp
                </button>
              )}
              <button 
                className="btn-card-action secondary" 
                style={{ width: 'auto', padding: '10px 18px' }}
                onClick={() => setSelectedCustomerDetail(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL WHATSAPP PROMOTIONS & BIRTHDAYS ───────────────────────────── */}
      {whatsappModalCustomer && (
        <div className="modal-backdrop-custom" onClick={() => setWhatsappModalCustomer(null)}>
          <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
            <div className="modal-header-custom" style={{ background: '#128c7e' }}>
              <div>
                <h2 style={{ margin: 0, color: '#ffffff' }}>Mensaje WhatsApp</h2>
                <span style={{ fontSize: '0.8rem', color: '#e0f2fe' }}>
                  Para: {whatsappModalCustomer.name} ({whatsappModalCustomer.phone || 'Sin número'})
                </span>
              </div>
              <button className="btn-modal-close" onClick={() => setWhatsappModalCustomer(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-custom">
              {/* Barra de Selección Dinámica de Idioma */}
              <div className="whatsapp-lang-bar">
                <span className="whatsapp-lang-title">
                  <Languages size={16} color="#0f766e" /> Idioma del mensaje:
                </span>
                <div className="whatsapp-lang-tabs">
                  {CUSTOMER_LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      type="button"
                      className={`whatsapp-lang-tab ${whatsappLanguage === lang.code ? 'active' : ''}`}
                      onClick={() => setWhatsappLanguage(lang.code)}
                    >
                      <span className="lang-tab-flag">{lang.flag}</span>
                      <span className="lang-tab-label">{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ajustar % Descuento para las ofertas */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px' }}>
                <Percent size={18} color="#0c1c2e" />
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Descuento a ofrecer:</span>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  value={customDiscount}
                  onChange={(e) => setCustomDiscount(e.target.value)}
                  style={{ width: '70px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}
                />
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>%</span>
              </div>

              {/* Plantilla 1: Cumpleaños */}
              <div className="whatsapp-template-card" onClick={() => handleSendWhatsApp('birthday')}>
                <h4>
                  🎂 {whatsappLanguage === 'ja' ? 'お誕生日お祝いメッセージ + プレゼント' : whatsappLanguage === 'en' ? 'Birthday Greeting + Gift Offer' : 'Felicitación de Cumpleaños + Regalo'}
                </h4>
                <p>
                  {whatsappLanguage === 'ja'
                    ? `「${whatsappModalCustomer.name}様、お誕生日おめでとうございます！...」次回【${customDiscount}%割引】または特製デザートプレゼント`
                    : whatsappLanguage === 'en'
                    ? `Send a warm birthday wish with an exclusive ${customDiscount}% discount or complimentary dessert.`
                    : `Envía felicitación formal de cumpleaños con un ${customDiscount}% de descuento o postre de regalo en su próximo pedido.`
                  }
                </p>
              </div>

              {/* Plantilla 2: Oferta Producto Favorito */}
              <div className="whatsapp-template-card" onClick={() => handleSendWhatsApp('offer')}>
                <h4>
                  🍱 {whatsappLanguage === 'ja' ? 'お気に入り料理の限定プロモーション' : whatsappLanguage === 'en' ? 'Favorite Dish Special Offer' : 'Oferta de su Plato Favorito'}
                </h4>
                <p>
                  {whatsappLanguage === 'ja'
                    ? `「${whatsappModalCustomer.name}様のお気に入り【${whatsappModalCustomer.stats?.favoriteDish || whatsappModalCustomer.favorite_dish || 'Bento BaChan'}】をご用意...」コード【BACHAN${customDiscount}】で${customDiscount}%OFF`
                    : whatsappLanguage === 'en'
                    ? `Personalized promotion for their top dish (${whatsappModalCustomer.stats?.favoriteDish || whatsappModalCustomer.favorite_dish || 'Bento BaChan'}) with a ${customDiscount}% discount.`
                    : `Promoción personalizada de su plato más pedido (${whatsappModalCustomer.stats?.favoriteDish || whatsappModalCustomer.favorite_dish || 'Bento BaChan'}) con un ${customDiscount}% de descuento.`
                  }
                </p>
              </div>

              {/* Plantilla 3: Nuevo Menú Semanal */}
              <div className="whatsapp-template-card" onClick={() => handleSendWhatsApp('weekly_menu')}>
                <h4>
                  🥢 {whatsappLanguage === 'ja' ? '新作ウィークリーメニューのご案内' : whatsappLanguage === 'en' ? 'New Weekly Menu Announcement' : 'Aviso de Nuevo Menú Semanal'}
                </h4>
                <p>
                  {whatsappLanguage === 'ja'
                    ? `「BaChan BentoBox 今週の新作ウィークリーメニューのご案内...」お取り置き＆テイクアウト/デリバリー対応`
                    : whatsappLanguage === 'en'
                    ? `Inform the customer about this week's freshly prepared bentos and seasonal dishes available for order.`
                    : `Informa al cliente de que ya está disponible el menú semanal con platos frescos para reservar con antelación.`
                  }
                </p>
              </div>
            </div>

            <div className="modal-footer-custom">
              <button 
                className="btn-card-action secondary" 
                style={{ width: 'auto', padding: '10px 18px' }}
                onClick={() => setWhatsappModalCustomer(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CREAR / EDITAR CLIENTE ───────────────────────────────────── */}
      {showAddEditModal && (
        <div className="modal-backdrop-custom" onClick={() => setShowAddEditModal(false)}>
          <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
            <div className="modal-header-custom">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{editingCustomer ? `Editar: ${editingCustomer.name}` : 'Nuevo Cliente'}</h2>
                <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Ficha de contacto y fidelización</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  type="submit" 
                  form="customer-add-edit-form" 
                  className="btn-header-quick-save"
                  title="Guardar ficha"
                >
                  <Check size={16} /> Guardar
                </button>
                <button className="btn-modal-close" onClick={() => setShowAddEditModal(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <form id="customer-add-edit-form" onSubmit={handleSaveCustomer} className="modal-form-custom">
              <div className="modal-body-custom">
                
                {/* Banner Rápido de Acceso a Agenda del Teléfono */}
                <div className="agenda-banner-card" onClick={handlePickContact}>
                  <div className="agenda-banner-icon">
                    <BookUser size={22} color="#0284c7" />
                  </div>
                  <div className="agenda-banner-text">
                    <strong>¿Buscar en la Agenda de tu Teléfono?</strong>
                    <span>Toca aquí para seleccionar un contacto y autorrellenar su nombre y móvil</span>
                  </div>
                  <button type="button" className="btn-open-agenda" onClick={(e) => { e.stopPropagation(); handlePickContact(); }}>
                    <Smartphone size={14} /> Abrir Agenda
                  </button>
                </div>

                {/* Idioma de Comunicación */}
                <div className="form-group-custom lang-selector-group">
                  <label className="lang-section-label">
                    <Languages size={16} color="#0c1c2e" /> Idioma de Comunicación con el Cliente *
                  </label>
                  <div className="lang-selector-segmented">
                    {CUSTOMER_LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        type="button"
                        className={`lang-btn ${formData.language === lang.code ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, language: lang.code })}
                      >
                        <span className="lang-flag">{lang.flag}</span>
                        <span className="lang-name">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                  <span className="lang-helper-text">
                    💬 Los mensajes de WhatsApp (cumpleaños, ofertas y avisos) se enviarán redactados en este idioma.
                  </span>
                </div>

                {/* Nombre y Teléfono */}
                <div className="form-row-custom">
                  <div className="form-group-custom">
                    <label>Nombre y Apellidos *</label>
                    <input 
                      type="text" 
                      required
                      name="name"
                      autoComplete="name"
                      id="customer-name"
                      placeholder="Ej: Alina"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group-custom">
                    <div className="label-with-action-row">
                      <label>Teléfono / WhatsApp</label>
                      <button
                        type="button"
                        className="btn-agenda-chip"
                        onClick={handlePickContact}
                        title="Buscar contacto en tu teléfono"
                      >
                        <BookUser size={12} />
                        <span>Agenda Móvil</span>
                      </button>
                    </div>
                    <div className="phone-input-combo">
                      <input 
                        type="tel" 
                        name="tel"
                        autoComplete="tel"
                        id="customer-tel"
                        placeholder="Ej: 612345678"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="phone-combo-input"
                      />
                      <button
                        type="button"
                        className="btn-paste-phone-quick"
                        onClick={handlePastePhone}
                        title="Pegar número copiado del portapapeles"
                      >
                        <ClipboardPaste size={14} />
                        <span>Pegar</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Email y Cumpleaños */}
                <div className="form-row-custom">
                  <div className="form-group-custom">
                    <label>Email</label>
                    <input 
                      type="email" 
                      name="email"
                      autoComplete="email"
                      id="customer-email"
                      placeholder="cliente@ejemplo.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group-custom">
                    <label>Fecha de Cumpleaños</label>
                    <input 
                      type="date" 
                      value={formData.birthday || ''}
                      onChange={e => setFormData({ ...formData, birthday: e.target.value })}
                    />
                  </div>
                </div>

                {/* Nivel de Fidelidad y Descuento */}
                <div className="form-row-custom">
                  <div className="form-group-custom">
                    <label>Nivel de Fidelización</label>
                    <select 
                      value={formData.loyalty_tier}
                      onChange={e => setFormData({ ...formData, loyalty_tier: e.target.value })}
                    >
                      <option value="standard">Estándar</option>
                      <option value="frequent">🥢 Cliente Habitual</option>
                      <option value="gold">⭐ Gold</option>
                      <option value="vip">👑 VIP Premium</option>
                    </select>
                  </div>
                  <div className="form-group-custom">
                    <label>Descuento Fijo TPV (%)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      placeholder="0"
                      value={formData.discount_percent}
                      onChange={e => setFormData({ ...formData, discount_percent: e.target.value })}
                    />
                  </div>
                </div>

                {/* Plato Favorito */}
                <div className="form-group-custom">
                  <label>Plato / Bento Favorito</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Nato pack 30, Bento Tonkatsu..."
                    value={formData.favorite_dish}
                    onChange={e => setFormData({ ...formData, favorite_dish: e.target.value })}
                  />
                </div>

                {/* Dirección */}
                <div className="form-group-custom">
                  <label>Dirección de Entrega Habitual</label>
                  <input 
                    type="text" 
                    placeholder="Calle, número, piso, puerta..."
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                {/* Alérgenos */}
                <div className="form-group-custom">
                  <label>Alérgenos / Preferencias Dietéticas</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Sin gluten, vegano, alérgico a los cacahuetes..."
                    value={formData.allergens}
                    onChange={e => setFormData({ ...formData, allergens: e.target.value })}
                  />
                </div>

                {/* Notas Internas */}
                <div className="form-group-custom">
                  <label>Notas Internas</label>
                  <textarea 
                    rows="3"
                    placeholder="Preferencias de entrega, salsas adicionales, observaciones..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

              </div>

              <div className="modal-footer-custom">
                <button 
                  type="button" 
                  className="btn-modal-cancel"
                  onClick={() => setShowAddEditModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-modal-save">
                  <Check size={18} /> Guardar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden file input for vCard (.vcf) imports */}
      <input 
        type="file" 
        ref={vcardInputRef} 
        accept=".vcf,text/vcard" 
        style={{ display: 'none' }} 
        onChange={handleVCardFile} 
      />

      {/* ── MODAL GUÍA AGENDA DE CONTACTOS (FALLBACK & PASTE) ─────────────── */}
      {showAgendaGuideModal && (
        <div className="modal-backdrop-custom" onClick={() => setShowAgendaGuideModal(false)}>
          <div className="modal-content-custom" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-custom" style={{ background: '#0c1c2e', color: '#f5e6c8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookUser size={22} color="#f5e6c8" />
                <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#f5e6c8' }}>Acceso a Contactos del Móvil</h2>
              </div>
              <button className="btn-modal-close" onClick={() => setShowAgendaGuideModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-custom" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '12px 14px', borderRadius: '12px', display: 'flex', gap: '10px' }}>
                <Info size={20} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.84rem', color: '#0369a1', lineHeight: 1.4 }}>
                  <strong>Política de Seguridad de Navegadores Web:</strong><br />
                  La apertura automática de la agenda solo está permitida por <strong>Google Chrome en Android</strong>. En <strong>iPhone (iOS Safari)</strong> o Mac/PC, Apple y los navegadores web bloquean el acceso directo a la libreta privada de contactos por privacidad a cualquier página web.
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '12px' }}>
                <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#1e293b', marginBottom: '8px' }}>
                  ⚡ Opciones ultrarrápidas disponibles:
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Opción 1: Pegar Portapapeles */}
                  <button
                    type="button"
                    className="btn-modal-save"
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', 
                      color: '#fff', 
                      border: 'none', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '8px',
                      fontSize: '0.9rem',
                      borderRadius: '10px'
                    }}
                    onClick={async () => {
                      await handlePastePhone();
                      setShowAgendaGuideModal(false);
                    }}
                  >
                    <ClipboardPaste size={18} /> 1. Pegar Número desde Portapapeles
                  </button>

                  {/* Opción 2: Importar archivo vCard */}
                  <button
                    type="button"
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      background: '#ffffff', 
                      color: '#0c1c2e', 
                      border: '1px solid #cbd5e1', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      vcardInputRef.current?.click();
                    }}
                  >
                    <FileUp size={18} color="#0284c7" /> 2. Importar Tarjeta de Contacto (.vcf)
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#64748b', background: '#f1f5f9', padding: '10px 12px', borderRadius: '8px' }}>
                💡 <strong>Consejo en iPhone:</strong> Al tocar la casilla de teléfono, el propio teclado de Apple suele mostrar una sugerencia con tus contactos recientes en la barra superior.
              </div>
            </div>

            <div className="modal-footer-custom">
              <button
                type="button"
                className="btn-modal-cancel"
                style={{ width: 'auto', padding: '8px 18px' }}
                onClick={() => setShowAgendaGuideModal(false)}
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
