import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, TrendingUp, TrendingDown, Target, LayoutGrid, Trash2, Camera, Store, Loader2, Settings, X, Edit, Edit2, Save, Check } from 'lucide-react';

import { useMenuItems } from '../hooks/useMenuItems';
import { useRecipes } from '../hooks/useRecipes';
import { useIngredients } from '../hooks/useIngredients';
import { useMenuCategories } from '../hooks/useMenuCategories';
import ConfirmationModal from '../components/Common/ConfirmationModal';
import Lightbox from '../components/Common/Lightbox';
import NumPad from '../components/Common/NumPad';

import '../styles/Common.css';
import '../styles/Toast.css';
import './CatalogSettings.css';

export default function BentoPage() {
  const navigate = useNavigate();
  const { menuItems, loading: menuLoading, deleteMenuItem, updateMenuItem } = useMenuItems();
  const { recipes } = useRecipes();
  const { ingredients } = useIngredients();
  const { categories: menuCategories } = useMenuCategories();
  
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [lightbox, setLightbox] = useState({ isOpen: false, imageUrl: '', title: '' });
  const [deletingId, setDeletingId] = useState(null);
  const [activeTabId, setActiveTabId] = useState(null);
  const [editingItem, setEditingItem] = useState(null); // { id, name, price, category_id }

  // Combine data
  const publishedItems = useMemo(() => {
    return (menuItems || []).map(item => {
      // Find cost
      let cost = 0;
      let itemType = 'unknown';
      const recipe = recipes?.find(r => r.id === item.id);
      const ingredient = ingredients?.find(i => i.id === item.id);
      
      if (recipe) {
        cost = recipe.cost_per_portion || 0;
        itemType = recipe.recipe_type || 'recipe';
      } else if (ingredient) {
        const fmt = parseFloat(ingredient.purchase_format) || 0;
        const prc = parseFloat(ingredient.purchase_price) || 0;
        if (fmt > 0) {
          if (ingredient.calculation_type === 'unidad') cost = prc / fmt;
          else cost = (prc / fmt) * 1000;
        } else {
          cost = ingredient.cost_per_unit || 0;
        }
        itemType = 'ingredient';
      }
      return {
        ...item,
        cost,
        itemType
      };
    });
  }, [menuItems, recipes, ingredients]);

  const loading = menuLoading;

  // Initialize activeTabId with the first category when they load
  React.useEffect(() => {
    if (menuCategories && menuCategories.length > 0 && !activeTabId) {
      setActiveTabId(menuCategories[0].id);
    } else if (menuCategories && menuCategories.length === 0 && !activeTabId) {
      setActiveTabId('uncategorized');
    }
  }, [menuCategories, activeTabId]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete);
    const result = await deleteMenuItem(confirmDelete);
    if (!result.success) {
      alert('Error al quitar del menú: ' + result.error);
    }
    setConfirmDelete(null);
    setDeletingId(null);
  };

  const handleUpdateItem = async (id, fields) => {
    const result = await updateMenuItem(id, fields);
    if (result.success) {
      setEditingItem(null);
    } else {
      alert('Error al actualizar artículo: ' + result.error);
    }
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
          <p className="page-subtitle">Organiza tu carta y gestiona artículos en venta</p>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            className="flex items-center justify-center bg-[#f3f4f6] text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-all duration-300" 
            onClick={() => navigate('/settings')} 
            style={{ width: '48px', height: '48px', borderRadius: '50%', border: 'none' }}
          >
            <Settings size={22} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-icon shimmer"></div>
              <div>
                <div className="skeleton-text-main shimmer"></div>
                <div className="skeleton-text-sub shimmer"></div>
              </div>
              <div className="skeleton-price shimmer"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="category-tabs-wrapper mb-8">
            <div className="category-tabs flex flex-wrap gap-3">
              {(menuCategories || []).map(cat => (
                <button 
                  key={cat.id} 
                  className={`category-tab px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 ${
                    activeTabId === cat.id 
                      ? 'bg-[#0f172a] text-white shadow-lg active' 
                      : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'
                  }`}
                  onClick={() => setActiveTabId(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
              <button 
                className={`category-tab px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 ${
                  activeTabId === 'uncategorized' 
                    ? 'bg-[#0f172a] text-white shadow-lg active' 
                    : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'
                }`}
                onClick={() => setActiveTabId('uncategorized')}
              >
                  { (publishedItems || []).filter(b => !b.menu_category_id).length > 0 ? '⚠️ Sin Clasificar' : 'Sin Clasificar' }
              </button>
            </div>
          </div>

          <div className="card-grid mt-8">
            {(publishedItems || [])
              .filter(b => {
                if (activeTabId === 'uncategorized') return !b.menu_category_id;
                return b.menu_category_id === activeTabId;
              })
              .map(item => {
                const cost = typeof item.cost === 'number' ? item.cost : 0;
                const salePrice = item.price || 0;
                const margin = salePrice > 0 ? ((salePrice - cost) / salePrice) * 100 : 0;
                const isGoodMargin = margin >= 70;

                return (
                  <div 
                    key={item.id} 
                    className="premium-card relative overflow-hidden cursor-pointer" 
                    onClick={() => setEditingItem({
                      id: item.id,
                      name: item.name,
                      price: item.price,
                      menu_category_id: item.menu_category_id || ''
                    })}
                    style={{ 
                      backgroundColor: 'rgba(0, 160, 223, 0.08)',
                      borderColor: 'transparent',
                      borderLeft: '4px solid #00a0df',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 8px 24px -8px rgba(0, 160, 223, 0.2)'
                    }}
                  >
                    <div className="ingredient-info">
                      <div className="card-icon-wrapper" style={{ 
                        width: '56px', 
                        height: '56px',
                        backgroundColor: 'rgba(0, 160, 223, 0.1)'
                      }}>
                        <Target size={24} className="text-[#00a0df]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="card-title text-lg" style={{ color: '#003a55' }}>{item.name}</h3>
                          <Edit2 size={12} className="text-[#00a0df] opacity-40 ml-auto" />
                        </div>
                        <div className="flex gap-4 mt-1">
                          <p className="card-meta">PVP: {salePrice.toFixed(2)}€</p>
                          <p className="card-meta">Coste: {cost.toFixed(2)}€</p>
                        </div>
                        {item.description && (
                          <div className="text-[10px] text-slate-400 mt-1 italic leading-tight line-clamp-1">{item.description}</div>
                        )}
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
                          className={`p-2 rounded-full transition-all duration-300 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:scale-110 ${deletingId === item.id ? 'opacity-50 cursor-wait' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (deletingId) return;
                            setConfirmDelete(item.id);
                          }}
                          title="Quitar de la tienda"
                        >
                          {deletingId === item.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                        {item.image_url && (
                          <button 
                            className="p-2 text-[#00a0df] hover:bg-sky-50 rounded-full transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightbox({ isOpen: true, imageUrl: item.image_url, title: item.name });
                            }}
                          >
                            <Camera size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

            {(publishedItems || []).filter(b => {
              if (activeTabId === 'uncategorized') return !b.menu_category_id;
              return b.menu_category_id === activeTabId;
            }).length === 0 && (publishedItems || []).length > 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 fade-in">
                <div className="w-16 h-16 bg-white text-slate-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <LayoutGrid size={32} />
                </div>
                <h3 className="text-slate-400 font-bold text-sm mb-1">Sin platos</h3>
                <p className="text-slate-300 text-xs max-w-[200px]">No hay productos registrados en esta categoría aún.</p>
              </div>
            )}
          </div>

          {(publishedItems || []).length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-6">
                 <Store size={32} />
              </div>
              <h2 className="text-slate-400 font-black uppercase tracking-widest text-sm mb-2">Tienda Vacía</h2>
              <p className="text-slate-300 text-sm max-w-[240px]">Aún no has sincronizado ningún Insumo o Elaboración con la Tienda (TPV).</p>
            </div>
          )}
        </>
      )}

      {editingItem && (
        <SaleItemModal 
          item={editingItem} 
          categories={menuCategories} 
          onClose={() => setEditingItem(null)}
          onSave={handleUpdateItem}
        />
      )}

      <ConfirmationModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="¿Quitar del Menú / TPV?"
        message="Esta acción dejará de vender este producto en el TPV y lo marcará como No Publicado."
      />

      <Lightbox 
        isOpen={lightbox.isOpen}
        imageUrl={lightbox.imageUrl}
        title={lightbox.title}
        onClose={() => setLightbox({ ...lightbox, isOpen: false })}
      />
    </div>
  );
}

// ─── Sale Item Edit Modal Component ───────────────────────────────────────────
function SaleItemModal({ item, categories, onClose, onSave }) {
  const [categoryId, setCategoryId] = useState(item.menu_category_id || '');
  const [price, setPrice] = useState(item.price || 0);
  const [numPad, setNumPad] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await onSave(item.id, { 
      menu_category_id: categoryId === '' ? null : categoryId,
      price: parseFloat(price) 
    });
    setLoading(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ paddingTop: '2rem' }}>
        <div className="modal-header border-b-0 pb-2">
          <div className="flex flex-col w-full pr-8">
            <h3 className="modal-title flex items-center gap-2">
              <Edit size={18} className="text-[#00a0df]" />
              Edición de Venta
            </h3>
            <p className="text-sm font-bold text-slate-800 mt-1">{item.name}</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-form pt-4 space-y-6">
          <div className="form-group">
            <label className="form-label text-slate-500 font-bold mb-2 block">Categoría de Menú</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                  categoryId === '' 
                    ? 'bg-[#0f172a] text-white border-[#0f172a]' 
                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                }`}
                onClick={() => setCategoryId('')}
              >
                Sin Clasificar
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  type="button"
                  className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                    categoryId === cat.id 
                      ? 'bg-[#00a0df] text-white border-[#00a0df]' 
                      : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                  }`}
                  onClick={() => setCategoryId(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label text-slate-500 font-bold mb-2 block">Precio de Venta (PVP)</label>
            <div 
              className="numpad-control bg-slate-50 text-2xl font-black text-[#00a0df] py-4"
              onClick={() => setNumPad(true)}
            >
              {parseFloat(price).toFixed(2)}€
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button 
              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-lg active:scale-95 transition-all disabled:opacity-50"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? <Loader2 size={24} className="animate-spin mx-auto" /> : "GUARDAR CAMBIOS"}
            </button>
          </div>
        </div>
      </div>

      {numPad && (
        <NumPad 
          isOpen={true}
          onClose={() => setNumPad(false)}
          onConfirm={(val) => {
            setPrice(val);
            setNumPad(false);
          }}
          label="Ajustar PVP"
          initialValue={price.toString()}
        />
      )}
    </div>
  );
}

