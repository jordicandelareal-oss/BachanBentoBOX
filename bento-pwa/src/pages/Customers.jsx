import React, { useState, useMemo } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { 
  buildWhatsAppLink, 
  checkBirthdayStatus 
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
  Heart
} from 'lucide-react';
import './Customers.css';

export default function Customers() {
  const { 
    customers, 
    loading, 
    summary, 
    addCustomer, 
    editCustomer, 
    removeCustomer 
  } = useCustomers();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, birthday, vip, allergens
  
  // Modals state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null);
  const [whatsappModalCustomer, setWhatsappModalCustomer] = useState(null);
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
    favorite_dish: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
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
      favorite_dish: ''
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
      favorite_dish: customer.favorite_dish || ''
    });
    setShowAddEditModal(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('El nombre del cliente es obligatorio');
      return;
    }

    if (editingCustomer) {
      await editCustomer(editingCustomer.id, formData);
      showToast('✅ Ficha de cliente actualizada');
    } else {
      await addCustomer(formData);
      showToast('🎉 Nuevo cliente registrado');
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

  // ── Abrir WhatsApp ────────────────────────────────────────────────────────
  const handleSendWhatsApp = (type) => {
    if (!whatsappModalCustomer || !whatsappModalCustomer.phone) {
      alert('Este cliente no tiene número de teléfono registrado');
      return;
    }

    const url = buildWhatsAppLink(whatsappModalCustomer.phone, type, {
      customerName: whatsappModalCustomer.name,
      discount: customDiscount || whatsappModalCustomer.discount_percent || 10,
      favoriteDish: whatsappModalCustomer.stats?.favoriteDish || whatsappModalCustomer.favorite_dish || 'Bento BaChan'
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

      {/* ── HEADER & KPIS ──────────────────────────────────────────────────── */}
      <section className="customers-header-card">
        <div className="customers-title-row">
          <div className="customers-title-group">
            <h1><Users size={32} color="#f5e6c8" /> Clientes & Fidelización</h1>
            <p>Historial de consumo, preferencias, alertas de cumpleaños y promociones WhatsApp</p>
          </div>
          <button className="btn-add-customer" onClick={handleOpenAdd}>
            <Plus size={20} /> Nuevo Cliente
          </button>
        </div>

        {/* KPI Cards */}
        <div className="customers-kpi-grid">
          <div className="customer-kpi-card">
            <div className="kpi-icon-badge blue"><Users size={22} /></div>
            <div>
              <div className="kpi-info-val">{summary.totalCustomers}</div>
              <div className="kpi-info-lbl">Total Clientes</div>
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
              <div className="kpi-info-lbl">Clientes VIP</div>
            </div>
          </div>

          <div className="customer-kpi-card">
            <div className="kpi-icon-badge emerald"><TrendingUp size={22} /></div>
            <div>
              <div className="kpi-info-val">{summary.totalRevenueFromCustomers.toFixed(2)}€</div>
              <div className="kpi-info-lbl">Consumo Registrado</div>
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
                if (bdayCust) setWhatsappModalCustomer(bdayCust);
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
            placeholder="Buscar por nombre, teléfono, plato favorito, alérgeno o notas..."
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
            className={`filter-chip ${activeFilter === 'birthday' ? 'active' : ''}`}
            onClick={() => setActiveFilter('birthday')}
          >
            🎂 Cumpleaños ({summary.birthdaysSoon})
          </button>
          <button 
            className={`filter-chip ${activeFilter === 'vip' ? 'active' : ''}`}
            onClick={() => setActiveFilter('vip')}
          >
            ⭐ VIP & Gold ({summary.vipCount})
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
          <p>Cargando fichas de clientes y métricas de consumo...</p>
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
            {searchTerm ? 'Intenta con otro término de búsqueda' : 'Comienza añadiendo el primer cliente a BaChan'}
          </p>
          <button 
            className="btn-add-customer" 
            style={{ marginTop: '16px' }}
            onClick={handleOpenAdd}
          >
            <Plus size={18} /> Añadir Cliente
          </button>
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

            const isBdayToday = customer.birthdayStatus?.isToday;
            const isBdaySoon = customer.birthdayStatus?.isUpcoming;

            return (
              <div key={customer.id} className="customer-card">
                
                {/* Header Card */}
                <div>
                  <div className="customer-card-header">
                    <div className="customer-avatar-row">
                      <div className="customer-avatar">{initials}</div>
                      <div>
                        <h3 className="customer-card-name">{customer.name}</h3>
                        {customer.phone && (
                          <span className="customer-phone-sub">
                            <Phone size={13} /> {customer.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span className={`tier-badge ${customer.loyalty_tier || 'standard'}`}>
                        {customer.loyalty_tier === 'vip' && <Crown size={12} />}
                        {customer.loyalty_tier?.toUpperCase()}
                      </span>
                      {isBdayToday && (
                        <span className="birthday-badge-inline">
                          <Cake size={12} /> ¡Hoy cumple!
                        </span>
                      )}
                      {isBdaySoon && (
                        <span className="birthday-badge-inline" style={{ background: '#fef3c7', color: '#b45309' }}>
                          <Cake size={12} /> En {customer.birthdayStatus.daysUntil}d
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Consumo Stats */}
                  <div className="customer-card-stats" style={{ marginTop: '14px' }}>
                    <div className="stat-item-card">
                      <div className="stat-val">{customer.stats?.totalSpent?.toFixed(2) || '0.00'}€</div>
                      <div className="stat-lbl">Gasto Total</div>
                    </div>
                    <div className="stat-item-card">
                      <div className="stat-val">{customer.stats?.ordersCount || 0}</div>
                      <div className="stat-lbl">Pedidos</div>
                    </div>
                    <div className="stat-item-card">
                      <div className="stat-val">{customer.stats?.averageTicket?.toFixed(2) || '0.00'}€</div>
                      <div className="stat-lbl">Ticket Medio</div>
                    </div>
                  </div>

                  {/* Plato Favorito */}
                  <div className="customer-favorite-dish" style={{ marginTop: '12px' }}>
                    <UtensilsCrossed size={16} color="#b45309" />
                    <div>
                      <span>Favorito: </span>
                      <strong>{customer.stats?.favoriteDish || customer.favorite_dish || 'Aún sin pedidos'}</strong>
                    </div>
                  </div>

                  {/* Alérgenos & Descuento Especial */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                    {customer.allergens && (
                      <span className="customer-allergens-tag">
                        <AlertTriangle size={13} /> {customer.allergens}
                      </span>
                    )}
                    {customer.discount_percent > 0 && (
                      <span className="tier-badge" style={{ background: '#dcfce7', color: '#15803d' }}>
                        <Percent size={12} /> {customer.discount_percent}% dto. fijo
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="customer-card-actions">
                  <button 
                    className="btn-card-action primary"
                    onClick={() => setSelectedCustomerDetail(customer)}
                    title="Ver Ficha y Estadísticas"
                  >
                    <ShoppingBag size={15} /> Ficha
                  </button>

                  <button 
                    className="btn-card-action whatsapp"
                    onClick={() => setWhatsappModalCustomer(customer)}
                    title="Enviar Oferta / WhatsApp"
                  >
                    <MessageSquare size={15} /> WhatsApp
                  </button>

                  <button 
                    className="btn-card-action secondary"
                    style={{ flex: 'none', width: '38px', padding: 0 }}
                    onClick={() => handleOpenEdit(customer)}
                    title="Editar"
                  >
                    <Edit3 size={15} />
                  </button>

                  <button 
                    className="btn-card-action secondary"
                    style={{ flex: 'none', width: '38px', padding: 0, color: '#ef4444' }}
                    onClick={() => handleDelete(customer.id, customer.name)}
                    title="Eliminar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL FICHA COMPLETA / DETALLE DE CONSUMO ─────────────────────── */}
      {selectedCustomerDetail && (
        <div className="modal-backdrop-custom" onClick={() => setSelectedCustomerDetail(null)}>
          <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
            <div className="modal-header-custom">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="customer-avatar" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                  {selectedCustomerDetail.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ margin: 0 }}>{selectedCustomerDetail.name}</h2>
                  <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                    Cliente desde {new Date(selectedCustomerDetail.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button className="btn-modal-close" onClick={() => setSelectedCustomerDetail(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-custom">
              {/* Info rápida */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📞 CONTACTO</div>
                  <div style={{ fontWeight: 'bold', marginTop: '2px' }}>{selectedCustomerDetail.phone || 'Sin teléfono'}</div>
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
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📍 DIRECCIÓN HABITUAL</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '500', marginTop: '2px' }}>
                    {selectedCustomerDetail.address || 'Recoge en local'}
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
                  <div className="stat-lbl">Pedidos Totales</div>
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
                          {dish.count} veces ({dish.percent}%)
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Aún no hay pedidos registrados para calcular sus favoritos.</p>
                )}
              </div>

              {/* Historial de Pedidos */}
              <div>
                <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: '#475569', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} /> Historial Reciente de Pedidos ({selectedCustomerDetail.stats?.orders?.length || 0})
                </h4>
                {selectedCustomerDetail.stats?.orders && selectedCustomerDetail.stats.orders.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {selectedCustomerDetail.stats.orders.map((order, idx) => (
                      <div key={idx} className="order-history-item">
                        <div className="order-history-top">
                          <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                            Ticket #{order.ticket_number || idx + 1} • {new Date(order.sold_at || order.created_at).toLocaleDateString()}
                          </span>
                          <span style={{ fontWeight: '800', color: '#0c1c2e' }}>
                            {Number(order.total || 0).toFixed(2)}€
                          </span>
                        </div>
                        <div className="order-history-items-list">
                          {Array.isArray(order.items) ? order.items.map(it => `${it.quantity}x ${it.name}`).join(', ') : 'Detalle no disponible'}
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
              <button 
                className="btn-card-action whatsapp" 
                style={{ width: 'auto', padding: '10px 18px' }}
                onClick={() => {
                  setWhatsappModalCustomer(selectedCustomerDetail);
                }}
              >
                <MessageSquare size={16} /> Enviar Oferta WhatsApp
              </button>
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
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Selecciona una plantilla para enviar directamente al WhatsApp del cliente con 1 clic:
              </p>

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
                <h4>🎂 Felicitación de Cumpleaños + Regalo</h4>
                <p>Envía felicitación formal de cumpleaños con un {customDiscount}% de descuento o postre de regalo en su próximo pedido.</p>
              </div>

              {/* Plantilla 2: Oferta Producto Favorito */}
              <div className="whatsapp-template-card" onClick={() => handleSendWhatsApp('offer')}>
                <h4>🍱 Oferta de su Plato Favorito</h4>
                <p>
                  Promoción personalizada de su plato más pedido ({whatsappModalCustomer.stats?.favoriteDish || whatsappModalCustomer.favorite_dish || 'Bento Tonkatsu'}) con un {customDiscount}% de descuento.
                </p>
              </div>

              {/* Plantilla 3: Nuevo Menú Semanal */}
              <div className="whatsapp-template-card" onClick={() => handleSendWhatsApp('weekly_menu')}>
                <h4>🥢 Aviso de Nuevo Menú Semanal</h4>
                <p>Informa al cliente de que ya está disponible el menú semanal con platos frescos para reservar con antelación.</p>
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
              <h2>{editingCustomer ? 'Editar Ficha de Cliente' : 'Nuevo Cliente'}</h2>
              <button className="btn-modal-close" onClick={() => setShowAddEditModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer}>
              <div className="modal-body-custom">
                
                {/* Nombre y Teléfono */}
                <div className="form-row-custom">
                  <div className="form-group-custom">
                    <label>Nombre y Apellidos *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej: Marta Soler"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group-custom">
                    <label>Teléfono / WhatsApp</label>
                    <input 
                      type="tel" 
                      placeholder="Ej: 612345678"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Email y Cumpleaños */}
                <div className="form-row-custom">
                  <div className="form-group-custom">
                    <label>Email</label>
                    <input 
                      type="email" 
                      placeholder="marta@ejemplo.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group-custom">
                    <label>Fecha de Cumpleaños 🎂</label>
                    <input 
                      type="date" 
                      value={formData.birthday}
                      onChange={e => setFormData({ ...formData, birthday: e.target.value })}
                    />
                  </div>
                </div>

                {/* Dirección de entrega habitual */}
                <div className="form-group-custom">
                  <label>Dirección habitual (para Delivery)</label>
                  <input 
                    type="text" 
                    placeholder="Calle, número, piso, puerta o notas de timbre"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                {/* Nivel y Descuento */}
                <div className="form-row-custom">
                  <div className="form-group-custom">
                    <label>Nivel de Fidelidad</label>
                    <select 
                      value={formData.loyalty_tier}
                      onChange={e => setFormData({ ...formData, loyalty_tier: e.target.value })}
                    >
                      <option value="standard">Estándar</option>
                      <option value="frequent">Frecuente</option>
                      <option value="gold">Oro</option>
                      <option value="vip">VIP ⭐</option>
                    </select>
                  </div>
                  <div className="form-group-custom">
                    <label>Descuento Fijo (%)</label>
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

                {/* Alérgenos y Plato Favorito */}
                <div className="form-row-custom">
                  <div className="form-group-custom">
                    <label>Alérgenos / Restricciones</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Sin gluten, Vegano, Alergia cacahuete"
                      value={formData.allergens}
                      onChange={e => setFormData({ ...formData, allergens: e.target.value })}
                    />
                  </div>
                  <div className="form-group-custom">
                    <label>Plato Favorito (opcional)</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Bento Tonkatsu"
                      value={formData.favorite_dish}
                      onChange={e => setFormData({ ...formData, favorite_dish: e.target.value })}
                    />
                  </div>
                </div>

                {/* Notas internas */}
                <div className="form-group-custom">
                  <label>Notas Internas y Preferencias</label>
                  <textarea 
                    rows={2}
                    placeholder="Ej: Le gusta la salsa teriyaki extra. Suele pedir para las 14:00."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

              </div>

              <div className="modal-footer-custom">
                <button 
                  type="button"
                  className="btn-card-action secondary"
                  style={{ width: 'auto', padding: '10px 18px' }}
                  onClick={() => setShowAddEditModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="btn-card-action primary"
                  style={{ width: 'auto', padding: '10px 24px' }}
                >
                  Guardar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
