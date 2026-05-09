import React, { useState, useEffect, useMemo } from 'react';
import { useProviders } from '../hooks/useProviders';
import { 
  Truck, Phone, Mail, Package, AlertCircle, Loader2, 
  ChevronRight, Search, Plus, X, Euro, CheckCircle2,
  AlertTriangle, Filter, User, Clock, ArrowRight, Trash2, Edit2, MapPin, Globe, Save, MessageCircle
} from 'lucide-react';
import ConfirmationModal from '../components/Common/ConfirmationModal';
import './Providers.css';

// ─── Componente Toast Interno ──────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-[5000] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 ${
      type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
    }`}>
      {type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
      <span className="font-bold text-sm">{message}</span>
    </div>
  );
};

export default function Providers() {
  const { providers, loading, error, addProvider, updateProvider, fetchProviderDetails, fetchProviders, deleteProvider } = useProviders();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // ID del proveedor a borrar
  const [isClosing, setIsClosing] = useState(false); // Para animación de cierre
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    contact_info: '',
    min_order: 0
  });

  const filteredProviders = useMemo(() => {
    return providers.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.contact_info && p.contact_info.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [providers, searchTerm]);

  useEffect(() => {
    if (selectedId) {
      loadDetails(selectedId);
      setIsEditing(false);
    } else {
      setDetails(null);
      setIsEditing(false);
      setEditForm(null);
    }
  }, [selectedId]);

  async function loadDetails(id) {
    setDetailsLoading(true);
    const res = await fetchProviderDetails(id);
    if (res.success) {
      setDetails(res);
      setEditForm({
        name: res.provider.name || '',
        contact_person: res.provider.contact_person || '',
        phone: res.provider.phone || '',
        email: res.provider.email || '',
        address: res.provider.address || '',
        website: res.provider.website || '',
        contact_info: res.provider.contact_info || '',
        min_order: res.provider.min_order || 0
      });
    } else {
      setToast({ message: 'Error al cargar detalles', type: 'error' });
    }
    setDetailsLoading(false);
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name) {
      setToast({ message: 'El nombre es obligatorio', type: 'error' });
      return;
    }
    const res = await updateProvider(selectedId, {
      name: editForm.name,
      contact_person: editForm.contact_person,
      phone: editForm.phone,
      email: editForm.email,
      address: editForm.address,
      website: editForm.website,
      contact_info: editForm.contact_info,
      min_order: parseFloat(editForm.min_order) || 0
    });

    if (res.success) {
      setToast({ message: 'Proveedor actualizado con éxito', type: 'success' });
      loadDetails(selectedId);
      fetchProviders();
      setIsEditing(false);
    } else {
      setToast({ message: 'Error al actualizar', type: 'error' });
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      setToast({ message: 'El nombre es obligatorio', type: 'error' });
      return;
    }
    
    const res = await addProvider({
      name: formData.name,
      contact_person: formData.contact_person,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      website: formData.website,
      contact_info: formData.contact_info,
      min_order: parseFloat(formData.min_order) || 0
    });
    
    if (res.success) {
      setToast({ message: '¡Proveedor guardado con éxito!', type: 'success' });
      setFormData({ 
        name: '', 
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        website: '',
        contact_info: '', 
        min_order: 0 
      });
      
      // Animación de cierre suave
      setIsClosing(true);
      setTimeout(() => {
        setShowAdd(false);
        setIsClosing(false);
        fetchProviders(); // Refresh list to get updated counts
      }, 300);
    } else {
      console.error("❌ RLS/DB Error:", res.error);
      setToast({ 
        message: res.error.includes('RLS') ? 'Error de Permisos (RLS)' : 'No se pudo guardar', 
        type: 'error' 
      });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    
    const provider = providers.find(p => p.id === confirmDelete);
    if (provider && provider.ingredients_count > 0) {
      setToast({ 
        message: `No se puede eliminar: este proveedor tiene ${provider.ingredients_count} insumos asociados. Cambia los insumos de proveedor antes de borrar.`, 
        type: 'error' 
      });
      setConfirmDelete(null);
      return;
    }

    const res = await deleteProvider(confirmDelete);
    if (res.success) {
      setToast({ message: 'Proveedor eliminado correctamente', type: 'success' });
    } else {
      setToast({ message: 'Error al eliminar: ' + res.error, type: 'error' });
    }
    setConfirmDelete(null);
  };

  return (
    <div className="page-container fade-in providers-dashboard">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="page-header">
        <div>
          <h1 className="page-title">Proveedores</h1>
          <p className="page-subtitle">Gestiona tu red de suministros y condiciones de compra</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={20} />
          Nuevo Proveedor
        </button>
      </div>

      {/* Toolbar / Search Premium */}
      <div className="search-container-premium">
        <input 
          type="text" 
          placeholder="Buscar proveedores por nombre o contacto..." 
          className="search-input-premium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="search-icon-premium" size={22} />
      </div>

      {/* Grid de Tarjetas */}
      {loading && providers.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton-card h-48 bg-slate-100 rounded-3xl animate-pulse" />)}
        </div>
      ) : filteredProviders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map(p => (
            <div 
              key={p.id} 
              className="provider-card-premium"
              onClick={() => setSelectedId(p.id)}
            >
              <button 
                className="btn-delete-card" 
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(p.id);
                }}
                title="Eliminar Proveedor"
              >
                <Trash2 size={18} />
              </button>

              <div className="card-top">
                <div className="icon-box">
                  <Truck size={24} />
                </div>
                <div className="badge-count">
                  <Package size={12} />
                  <span>{p.ingredients_count} insumos</span>
                </div>
              </div>
              
              <div className="card-body">
                <h3 className="name">{p.name}</h3>
                <div className="contact-bits">
                  <div className="bit">
                    <User size={12} />
                    <span>{p.contact_info || 'Sin contacto'}</span>
                  </div>
                  <div className="bit">
                    <Euro size={12} />
                    <span>Mín: {p.min_order || 0}€</span>
                  </div>
                </div>
              </div>

              <div className="card-footer">
                <span className="text-[10px] font-black uppercase text-slate-300">Detalles técnicos</span>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-sky-500 transition-all" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Truck size={64} strokeWidth={1} />
          <h3>No hay proveedores</h3>
          <p>Configura tus suministradores para empezar a comprar</p>
        </div>
      )}

      {/* Side Drawer (Detalle) */}
      {selectedId && (
        <div className="drawer-overlay" onClick={() => setSelectedId(null)}>
          <div className="drawer-content" onClick={e => e.stopPropagation()}>
            {detailsLoading ? (
              <div className="h-full flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-sky-500 mb-4" size={40} />
                <p className="font-black text-slate-400 uppercase text-[10px]">Cargando ficha...</p>
              </div>
            ) : details ? (
              <div className="drawer-inner-wrapper">
                {isEditing ? (
                  // MODO EDICIÓN
                  <div className="drawer-edit-form">
                    <div className="drawer-header-dark">
                      <div className="header-actions">
                        <button className="btn-icon text-slate-400 hover:text-white" onClick={() => setIsEditing(false)}>
                          <X size={20} />
                        </button>
                        <button className="btn-icon text-sky-400 hover:text-sky-300" onClick={handleEditSubmit}>
                          <Save size={20} />
                        </button>
                      </div>
                      <div className="header-info">
                        <div className="avatar-lg bg-slate-800">
                          <Edit2 size={32} className="text-slate-400" />
                        </div>
                        <div className="w-full">
                          <input 
                            className="edit-input-title"
                            value={editForm.name}
                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                            placeholder="Nombre del Proveedor"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="drawer-body-scroll custom-scrollbar">
                      <section className="detail-section">
                        <h4>Datos de Contacto</h4>
                        <div className="edit-grid">
                          <div className="form-group">
                            <label><User size={14}/> Persona de Contacto</label>
                            <input 
                              className="styled-input"
                              value={editForm.contact_person}
                              onChange={e => setEditForm({...editForm, contact_person: e.target.value})}
                              placeholder="Ej: Paco (Ventas)"
                            />
                          </div>
                          <div className="form-group">
                            <label><Phone size={14}/> Teléfono</label>
                            <input 
                              className="styled-input"
                              value={editForm.phone}
                              onChange={e => setEditForm({...editForm, phone: e.target.value})}
                              placeholder="+34 600 000 000"
                            />
                          </div>
                          <div className="form-group">
                            <label><Mail size={14}/> Correo Electrónico</label>
                            <input 
                              className="styled-input"
                              type="email"
                              value={editForm.email}
                              onChange={e => setEditForm({...editForm, email: e.target.value})}
                              placeholder="pedidos@empresa.com"
                            />
                          </div>
                          <div className="form-group">
                            <label><MapPin size={14}/> Dirección</label>
                            <input 
                              className="styled-input"
                              value={editForm.address}
                              onChange={e => setEditForm({...editForm, address: e.target.value})}
                              placeholder="Calle principal, Ciudad"
                            />
                          </div>
                          <div className="form-group">
                            <label><Globe size={14}/> Sitio Web</label>
                            <input 
                              className="styled-input"
                              value={editForm.website}
                              onChange={e => setEditForm({...editForm, website: e.target.value})}
                              placeholder="https://www.empresa.com"
                            />
                          </div>
                          <div className="form-group">
                            <label><Euro size={14}/> Pedido Mínimo (€)</label>
                            <input 
                              type="number"
                              className="styled-input"
                              value={editForm.min_order}
                              onChange={e => setEditForm({...editForm, min_order: e.target.value})}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </section>
                      <button className="btn-primary w-full mt-4" onClick={handleEditSubmit}>
                        Guardar Cambios
                      </button>
                    </div>
                  </div>
                ) : (
                  // MODO VISTA
                  <div className="drawer-view-mode">
                    <div className="drawer-header-dark">
                      <button className="close-btn" onClick={() => setSelectedId(null)}>
                        <X size={20} />
                      </button>
                      <button className="edit-btn" onClick={() => setIsEditing(true)}>
                        <Edit2 size={16} /> Editar
                      </button>
                      <div className="header-info">
                        <div className="avatar-lg">
                          <Truck size={32} />
                        </div>
                        <div className="header-text-container">
                          <h2>{details.provider.name}</h2>
                          <p>Socio Comercial • ID: {details.provider.id.slice(0,8)}</p>
                        </div>
                      </div>
                      
                      {/* Quick Actions Bar */}
                      <div className="quick-actions">
                        {details.provider.phone && (
                          <a href={`tel:${details.provider.phone.replace(/[^0-9+]/g, '')}`} className="action-btn">
                            <Phone size={18} />
                          </a>
                        )}
                        {details.provider.email && (
                          <a href={`mailto:${details.provider.email}`} className="action-btn">
                            <Mail size={18} />
                          </a>
                        )}
                        {details.provider.website && (
                          <a href={details.provider.website.startsWith('http') ? details.provider.website : `https://${details.provider.website}`} target="_blank" rel="noreferrer" className="action-btn">
                            <Globe size={18} />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="drawer-body-scroll custom-scrollbar">
                      <section className="detail-section">
                        <h4>Información de Contacto</h4>
                        <div className="info-grid">
                          <div className="info-item">
                            <User size={14} />
                            <div>
                              <label>Persona de Contacto</label>
                              <p className={!details.provider.contact_person ? 'text-sin-definir' : ''}>
                                {details.provider.contact_person || 'Sin definir'}
                              </p>
                              {!details.provider.contact_person && (
                                <button className="add-field-btn" onClick={() => setIsEditing(true)}>
                                  <Plus size={12} /> Añadir
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="info-item">
                            <Phone size={14} />
                            <div className="info-item-content">
                              <div>
                                <label>Teléfono</label>
                                <p className={!details.provider.phone ? 'text-sin-definir' : ''}>
                                  {details.provider.phone || 'Sin definir'}
                                </p>
                                {!details.provider.phone && (
                                  <button className="add-field-btn" onClick={() => setIsEditing(true)}>
                                    <Plus size={12} /> Añadir
                                  </button>
                                )}
                              </div>
                              {details.provider.phone && (
                                <a 
                                  href={`https://wa.me/${details.provider.phone.replace(/[^0-9+]/g, '')}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="wa-inline-btn"
                                  title="Enviar WhatsApp"
                                >
                                  <MessageCircle size={16} />
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="info-item">
                            <Mail size={14} />
                            <div>
                              <label>Email</label>
                              <p className={`truncate-text ${!details.provider.email ? 'text-sin-definir' : ''}`}>
                                {details.provider.email || 'Sin definir'}
                              </p>
                              {!details.provider.email && (
                                <button className="add-field-btn" onClick={() => setIsEditing(true)}>
                                  <Plus size={12} /> Añadir
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="info-item full-width">
                            <MapPin size={14} />
                            <div>
                              <label>Dirección</label>
                              <p className={!details.provider.address ? 'text-sin-definir' : ''}>
                                {details.provider.address || 'Sin definir'}
                              </p>
                              {!details.provider.address && (
                                <button className="add-field-btn" onClick={() => setIsEditing(true)}>
                                  <Plus size={12} /> Añadir
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="info-item">
                            <Globe size={14} />
                            <div>
                              <label>Sitio Web</label>
                              <p className={!details.provider.website ? 'text-sin-definir' : ''}>
                                {details.provider.website || 'Sin definir'}
                              </p>
                              {!details.provider.website && (
                                <button className="add-field-btn" onClick={() => setIsEditing(true)}>
                                  <Plus size={12} /> Añadir
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </section>

                      <section className="detail-section">
                        <h4>Condiciones de Compra</h4>
                        <div className="info-grid">
                          <div className="info-item">
                            <Euro size={14} />
                            <div>
                              <label>Pedido Mínimo</label>
                              <p>{(Number(details.provider.min_order) || 0).toFixed(2)} €</p>
                            </div>
                          </div>
                        </div>
                      </section>

                      {details.provider.contact_info && !details.provider.phone && !details.provider.email && (
                        <section className="detail-section">
                          <h4>Datos Históricos</h4>
                          <div className="info-item full-width">
                            <AlertCircle size={14} className="text-amber-500" />
                            <div>
                              <label>Nota de Contacto (Legacy)</label>
                              <p>{details.provider.contact_info}</p>
                            </div>
                          </div>
                        </section>
                      )}

                      <section className="detail-section">
                        <h4>Inventario Vinculado ({details.ingredients.length})</h4>
                        <div className="product-stack">
                          {details.ingredients.map(ing => (
                            <div key={ing.id} className="product-row">
                              <div>
                                <p className="name">{ing.name}</p>
                                <p className="waste">Merma: {Number(ing.waste_percentage || 0)}%</p>
                              </div>
                              <div className="price-tag">
                                {(Number(ing.purchase_price) || 0).toFixed(2)}€
                              </div>
                            </div>
                          ))}
                          {details.ingredients.length === 0 && (
                            <p className="text-sm text-slate-500 italic mt-2">No hay insumos asignados a este proveedor aún.</p>
                          )}
                        </div>
                      </section>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Modal Alta (Bachan Style) */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div 
            className={`modal-content-styled ${isClosing ? 'scale-out' : 'scale-in'}`}
            onClick={e => e.stopPropagation()}
          >
            <form onSubmit={handleAddSubmit}>
              <div className="modal-head">
                <div>
                  <h3>Alta de Proveedor</h3>
                  <p>Añade un nuevo suministrador a tu red</p>
                </div>
                <div className="icon-head">
                  <Plus size={24} />
                </div>
              </div>

              <div className="modal-body-form">
                <div className="form-group">
                  <label>Nombre de la Empresa *</label>
                  <input 
                    className="styled-input"
                    placeholder="Ej: Mayorista Bachan S.L."
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    autoFocus
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label>Persona de Contacto</label>
                    <input 
                      className="styled-input"
                      placeholder="Ej: Paco"
                      value={formData.contact_person}
                      onChange={e => setFormData({...formData, contact_person: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Teléfono (WhatsApp)</label>
                    <input 
                      className="styled-input"
                      placeholder="+34 600 000 000"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Correo Electrónico</label>
                  <input 
                    className="styled-input"
                    type="email"
                    placeholder="ejemplo@proveedor.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Dirección Física</label>
                  <input 
                    className="styled-input"
                    placeholder="Calle, Ciudad, CP"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label>Sitio Web</label>
                    <input 
                      className="styled-input"
                      placeholder="https://..."
                      value={formData.website}
                      onChange={e => setFormData({...formData, website: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Pedido Mínimo (€)</label>
                    <input 
                      type="number"
                      className="styled-input font-black"
                      placeholder="0.00"
                      value={formData.min_order}
                      onChange={e => setFormData({...formData, min_order: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer-styled">
                <button type="button" className="btn-ghost" onClick={() => setShowAdd(false)}>Cancelar</button>
                <button type="submit" className="btn-submit-styled">GUARDAR PROVEEDOR</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Confirmación Borrado */}
      <ConfirmationModal 
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="¿Eliminar proveedor?"
        message="Esta acción no se puede deshacer y fallará si hay insumos vinculados."
        confirmText="ELIMINAR"
        cancelText="CANCELAR"
      />
    </div>
  );
}
