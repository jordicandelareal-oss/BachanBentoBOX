import React, { useState } from 'react';
import { ChefHat, Plus, TrendingUp, TrendingDown, Target, LayoutGrid, Trash2, Camera, Store, Loader2, Settings, X, Edit, Edit2, Save, Check } from 'lucide-react';

import { useRecipes } from '../hooks/useRecipes';
import { useMenuCategories } from '../hooks/useMenuCategories';
import BentoMaker from '../components/BentoMaker/BentoMaker';
import ConfirmationModal from '../components/Common/ConfirmationModal';
import Lightbox from '../components/Common/Lightbox';
import '../styles/Common.css';
import '../styles/Toast.css';
import './CatalogSettings.css';

export default function BentoPage() {
  const { recipes: bentos, loading, deleteRecipe, fetchRecipes, togglePublish } = useRecipes('bento');
  const { categories: menuCategories } = useMenuCategories();
  const [editingBento, setEditingBento] = useState(false); // false (list), true (new), or object (edit)
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [lightbox, setLightbox] = useState({ isOpen: false, imageUrl: '', title: '' });
  const [syncingId, setSyncingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [activeTabId, setActiveTabId] = useState(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Initialize activeTabId with the first category when they load
  React.useEffect(() => {
    if (menuCategories.length > 0 && !activeTabId) {
      setActiveTabId(menuCategories[0].id);
    }
  }, [menuCategories]);

  const handleAddNew = () => {
    setEditingBento(true);
  };

  const handleEdit = (bento) => {
    setEditingBento(bento);
  };

  const handleCloseEditor = () => {
    setEditingBento(false);
    fetchRecipes();
  };

  if (editingBento !== false) {
    return (
      <BentoMaker 
        recipe={typeof editingBento === 'object' ? editingBento : null} 
        onClose={handleCloseEditor} 
      />
    );
  }
  
  const handleDelete = async () => {
    if (!confirmDelete) return;
    const result = await deleteRecipe(confirmDelete);
    if (!result.success) {
      alert('Error al eliminar: ' + result.error);
    }
    setConfirmDelete(null);
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <span className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <ChefHat size={24} />
            </span>
            Gestor de Menú
          </h1>
          <p className="page-subtitle">Organiza tu carta y gestiona productos finales</p>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            className="flex items-center justify-center bg-[#f3f4f6] text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-all duration-300" 
            onClick={() => setShowCategoryManager(!showCategoryManager)} 
            style={{ width: '48px', height: '48px', borderRadius: '50%', border: 'none' }}
          >
            <Settings size={22} className={showCategoryManager ? 'text-sky-500 animate-spin-slow' : ''} />
          </button>
          <button className="btn-icon-main" onClick={handleAddNew}>
            <Plus size={24} />
          </button>
        </div>
      </div>

      {showCategoryManager && (
        <CategoryManager 
          categories={menuCategories} 
          onClose={() => setShowCategoryManager(false)} 
        />
      )}

      <div className="category-tabs-wrapper mb-8 overflow-x-auto">
        <div className="category-tabs flex gap-2 min-w-max pb-2">
          {menuCategories.map(cat => (
            <button 
              key={cat.id} 
              className={`category-tab px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 ${
                activeTabId === cat.id 
                  ? 'bg-[#0f172a] text-white shadow-lg' 
                  : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'
              }`}
              onClick={() => setActiveTabId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
          {bentos.filter(b => !b.menu_category_id).length > 0 && (
            <button 
              className={`category-tab px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 ${
                activeTabId === 'uncategorized' 
                  ? 'bg-[#0f172a] text-white shadow-lg' 
                  : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'
              }`}
              onClick={() => setActiveTabId('uncategorized')}
            >
               Sin Categoría
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="card-grid">
          {[1, 2].map(i => (
            <div key={i} className="premium-card animate-pulse" style={{ height: '100px', opacity: 0.5 }}></div>
          ))}
        </div>
      ) : (
        <>
          <div className="card-grid mt-8">
            {bentos
              .filter(b => {
                if (activeTabId === 'uncategorized') return !b.menu_category_id;
                return b.menu_category_id === activeTabId;
              })
              .map(bento => {
                const cost = typeof bento.cost_per_portion === 'number' ? bento.cost_per_portion : 0;
                const salePrice = bento.sale_price || 0;
                const margin = salePrice > 0 ? ((salePrice - cost) / salePrice) * 100 : 0;
                const isGoodMargin = margin >= 70;
                const isActive = bento.is_published;

                return (
                  <div 
                  key={bento.id} 
                  className="premium-card relative overflow-hidden" 
                  style={{ 
                    backgroundColor: isActive ? 'rgba(0, 160, 223, 0.08)' : 'white',
                    borderColor: isActive ? 'transparent' : 'rgba(241, 245, 249, 1)',
                    borderLeft: isActive ? '4px solid #00a0df' : '1px solid rgba(241, 245, 249, 1)',
                    transition: 'all 0.3s ease',
                    boxShadow: isActive ? '0 8px 24px -8px rgba(0, 160, 223, 0.2)' : undefined
                  }}
                  onClick={() => handleEdit(bento)}
                >
                    <div className="ingredient-info">
                      <div className="card-icon-wrapper" style={{ 
                        width: '56px', 
                        height: '56px',
                        backgroundColor: isActive ? 'rgba(0, 160, 223, 0.1)' : 'rgba(241, 245, 249, 1)'
                      }}>
                        <Target size={24} className={isActive ? 'text-[#00a0df]' : 'text-slate-400'} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="card-title text-lg" style={{ color: isActive ? '#003a55' : undefined }}>{bento.name}</h3>
                        </div>
                        <div className="flex gap-4 mt-1">
                          <p className="card-meta">PVP: {salePrice.toFixed(2)}€</p>
                          <p className="card-meta">Coste: {cost.toFixed(2)}€</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right flex flex-col items-end">
                        <div className="card-meta mb-1 uppercase tracking-widest text-[9px]">Margen</div>
                        <div className="flex items-center gap-2">
                           {isGoodMargin ? (
                             <TrendingUp size={16} className="text-emerald-500" />
                           ) : (
                             <TrendingDown size={16} className="text-amber-500" />
                           )}
                           <div className={`price-display text-xl ${isGoodMargin ? 'text-emerald-600' : 'text-amber-600'}`}>
                             {margin.toFixed(1)}%
                           </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button 
                          className={`p-2 rounded-full transition-all duration-300 ${
                            isActive 
                              ? 'bg-[#00a0df] text-white shadow-lg shadow-sky-100 scale-110' 
                              : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-500'
                          } ${syncingId === bento.id ? 'opacity-50 cursor-wait' : ''}`}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (syncingId) return;
                            
                            setSyncingId(bento.id);
                            const result = await togglePublish(bento.id, isActive);
                            
                            if (result.success) {
                              setToast({ 
                                show: true, 
                                message: isActive ? 'Ocultado del TPV' : '✅ Publicado en TPV',
                                type: 'success'
                              });
                              setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
                            } else {
                              setToast({ show: true, message: '❌ Error', type: 'error' });
                              setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
                            }
                            setSyncingId(null);
                          }}
                          title={isActive ? "En TPV (Caja Registradora)" : "Publicar en TPV"}
                        >
                          {syncingId === bento.id ? (
                            <Loader2 size={20} className="animate-spin" />
                          ) : (
                            <Store size={20} />
                          )}
                        </button>
                        {bento.image_url && (
                          <button 
                            className="p-2 text-sky-500 hover:bg-sky-50 rounded-full transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightbox({ isOpen: true, imageUrl: bento.image_url, title: bento.name });
                            }}
                          >
                            <Camera size={20} />
                          </button>
                        )}
                        <button 
                          className="delete-btn-subtle"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete(bento.id);
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

            {bentos.filter(b => {
              if (activeTabId === 'uncategorized') return !b.menu_category_id;
              return b.menu_category_id === activeTabId;
            }).length === 0 && bentos.length > 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 fade-in">
                <div className="w-16 h-16 bg-white text-slate-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <LayoutGrid size={32} />
                </div>
                <h3 className="text-slate-400 font-bold text-sm mb-1">Sin platos</h3>
                <p className="text-slate-300 text-xs max-w-[200px]">No hay productos registrados en esta categoría aún.</p>
              </div>
            )}
          </div>

          {bentos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-6">
                <LayoutGrid size={32} />
              </div>
              <h2 className="text-slate-400 font-black uppercase tracking-widest text-sm mb-2">Carta Vacía</h2>
              <p className="text-slate-300 text-sm max-w-[240px]">Empieza a añadir platos usando el botón de arriba.</p>
            </div>
          )}
        </>
      )}

      <ConfirmationModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="¿Eliminar Bento?"
        message="Esta acción no se puede deshacer y borrará permanentemente este producto del catálogo."
      />

      <Lightbox 
        isOpen={lightbox.isOpen}
        imageUrl={lightbox.imageUrl}
        title={lightbox.title}
        onClose={() => setLightbox({ ...lightbox, isOpen: false })}
      />
      
      {toast.show && (
        <div className="toast-container">
          <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
             {toast.type === 'error' ? '❌' : '✨'} {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Category Manager Component ───────────────────────────────────────────────
function CategoryManager({ categories, onClose }) {
  const { addCategory, updateCategory, deleteCategory } = useMenuCategories();
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleAdd = async () => {
    if (!newCatName.trim()) return;
    setLoading(true);
    await addCategory(newCatName);
    setNewCatName('');
    setLoading(false);
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const handleSave = async () => {
    if (!editingName.trim()) return;
    setLoading(true);
    await updateCategory(editingId, { name: editingName });
    setEditingId(null);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setLoading(true);
    await deleteCategory(confirmDelete.id);
    setConfirmDelete(null);
    setLoading(false);
  };

  return (
    <div className="premium-form-card mb-8 fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="card-title text-xl mb-1">Categorías de Menú</h3>
          <p className="card-meta">Gestionar grupos para el TPV</p>
        </div>
        <button 
          className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-colors" 
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      <div className="catalog-content">
        <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }} className="flex gap-2 mb-8">
          <input 
            className="form-input-premium flex-1"
            placeholder="Nueva categoría de menú..."
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            disabled={loading}
          />
          <button 
            className="btn-icon-main" 
            type="submit" 
            disabled={loading || !newCatName.trim()}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
          </button>
        </form>

        <div className="settings-list">
          {categories.map(cat => (
            <div key={cat.id} className="settings-item flex justify-between">
              {editingId === cat.id ? (
                <div className="flex flex-1 gap-2 items-center">
                  <input 
                    autoFocus
                    className="form-input-premium py-1 text-sm bg-white"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                  />
                  <button type="button" onClick={handleSave} className="text-emerald-500 p-2"><Check size={18} /></button>
                  <button type="button" onClick={() => setEditingId(null)} className="text-slate-300 p-2"><X size={18} /></button>
                </div>
              ) : (
                <>
                  <div className="flex-1 flex items-center">
                    <LayoutGrid size={16} className="text-slate-300 mr-3" />
                    <span className="settings-item-name">{cat.name}</span>
                    <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full ml-3 tracking-widest leading-none flex items-center h-5">Orden: {cat.sort_order}</span>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      type="button"
                      onClick={() => handleEdit(cat)}
                      className="settings-action-btn edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setConfirmDelete({ id: cat.id, name: cat.name })}
                      className="settings-action-btn delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {categories.length === 0 && (
            <div className="text-center py-8 text-slate-400 italic text-sm">No hay categorías configuradas</div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="¿Eliminar categoría?"
        message={`¿Estás seguro de que quieres eliminar "${confirmDelete?.name}"? Esta acción podría dejar algunos productos sin categoría.`}
      />
    </div>
  );
}


