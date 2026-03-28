import React, { useState } from 'react';
import { useCatalogSettings } from '../hooks/useCatalogSettings';
import { 
  Settings, Folder, Tag, ChefHat, Plus, 
  Trash2, Edit2, Check, X, Loader2, ArrowLeft,
  ChevronRight, BookOpen
} from 'lucide-react';
import ConfirmationModal from '../components/Common/ConfirmationModal';
import { useNavigate } from 'react-router-dom';
import '../styles/Common.css';
import './CatalogSettings.css';

const TABS = [
  { id: 'menu', label: 'Menú: Categorías', icon: BookOpen, table: 'menu_categories' },
  { id: 'cats', label: 'Insumos: Categorías', icon: Folder, table: 'categories' },
  { id: 'subs', label: 'Insumos: Subcategorías', icon: Tag, table: 'subcategories' },
  { id: 'preps', label: 'Elaboraciones: Categorías', icon: ChefHat, table: 'preparation_categories' }
];

import { useMenuCategories } from '../hooks/useMenuCategories';

export default function CatalogSettings() {
  const { 
    categories, subcategories, prepCategories, 
    loading, error, addItem, updateItem, deleteItem 
  } = useCatalogSettings();
  
  const {
    categories: menuCategories,
    loading: menuLoading,
    addCategory: addMenuCategory,
    updateCategory: updateMenuCategory,
    deleteCategory: deleteMenuCategory
  } = useMenuCategories();
  
  const [activeTab, setActiveTab] = useState('cats');
  const [newItemName, setNewItemName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, table, name }
  const [isActionLoading, setIsActionLoading] = useState(false);
  const navigate = useNavigate();

  const currentTab = TABS.find(t => t.id === activeTab);

  const getItems = () => {
    if (activeTab === 'menu') return menuCategories;
    if (activeTab === 'cats') return categories;
    if (activeTab === 'subs') {
      return subcategories.filter(s => !selectedParentId || s.category_id === selectedParentId);
    }
    return prepCategories;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    if (activeTab === 'subs' && !selectedParentId) return alert('Selecciona una categoría padre');

    setIsActionLoading(true);
    let result;
    if (activeTab === 'menu') {
      result = await addMenuCategory(newItemName);
    } else {
      const payload = activeTab === 'subs' 
        ? { name: newItemName, category_id: selectedParentId }
        : activeTab === 'preps' ? { Name: newItemName } : { name: newItemName };
      
      result = await addItem(currentTab.table, payload);
    }

    if (result.success) setNewItemName('');
    setIsActionLoading(false);
  };

  const handleUpdate = async (id) => {
    if (!editValue.trim()) return setEditingId(null);
    setIsActionLoading(true);
    if (activeTab === 'menu') {
      const result = await updateMenuCategory(id, { name: editValue });
      if (result.success) setEditingId(null);
    } else {
      const fieldName = activeTab === 'preps' ? 'Name' : 'name';
      const result = await updateItem(currentTab.table, id, { [fieldName]: editValue });
      if (result.success) setEditingId(null);
    }
    setIsActionLoading(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setIsActionLoading(true);
    if (confirmDelete.table === 'menu_categories') {
      await deleteMenuCategory(confirmDelete.id);
    } else {
      await deleteItem(confirmDelete.table, confirmDelete.id);
    }
    setConfirmDelete(null);
    setIsActionLoading(false);
  };

  if (error) return <div className="page-container">Error: {error}</div>;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold transition-colors mb-2">
            <ArrowLeft size={16} /> Volver
          </button>
          <h1 className="page-title">Gestión de Categorías</h1>
          <p className="page-subtitle">Personaliza las opciones y filtros de tu catálogo</p>
        </div>
      </div>

      <div className="category-tabs-wrapper mb-8">
        <div className="category-tabs">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button 
                key={tab.id} 
                className={`category-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab.id); setEditingId(null); }}
              >
                <Icon size={14} className="mr-2 inline" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="catalog-content">
        {activeTab === 'subs' && (
          <div className="form-group mb-6">
            <label className="form-label">Filtrar por Categoría Padre</label>
            <select 
              className="form-input-premium"
              value={selectedParentId}
              onChange={e => setSelectedParentId(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        <div className="premium-form-card">
          <form onSubmit={handleAdd} className="flex gap-2 mb-8">
            <input 
              className="form-input-premium flex-1"
              placeholder={`Nueva ${activeTab === 'subs' ? 'subcategoría' : 'categoría'}...`}
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              disabled={isActionLoading}
            />
            <button className="btn-icon-main" type="submit" disabled={isActionLoading || !newItemName.trim()}>
              {isActionLoading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
            </button>
          </form>

          {loading ? (
             <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-200" size={48} /></div>
          ) : (
            <div className="settings-list">
              {getItems().map(item => (
                <div key={item.id} className="settings-item flex justify-between">
                  {editingId === item.id ? (
                    <div className="flex flex-1 gap-2 items-center">
                      <input 
                        autoFocus
                        className="form-input-premium py-1 text-sm bg-white"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleUpdate(item.id)}
                      />
                      <button type="button" onClick={() => handleUpdate(item.id)} className="text-emerald-500 p-2"><Check size={18} /></button>
                      <button type="button" onClick={() => setEditingId(null)} className="text-slate-300 p-2"><X size={18} /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 flex items-center">
                        <span className="settings-item-name">{item.name || item.Name}</span>
                        {activeTab === 'subs' && !selectedParentId && (
                          <span className="settings-item-parent">
                            · {categories.find(c => c.id === item.category_id)?.name || '...'}
                          </span>
                        )}
                        {activeTab === 'menu' && (
                          <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full ml-3 tracking-widest leading-none flex items-center h-5">Orden: {item.sort_order}</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button 
                          type="button"
                          onClick={() => { setEditingId(item.id); setEditValue(item.name || item.Name); }}
                          className="settings-action-btn edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => setConfirmDelete({ id: item.id, table: currentTab.table, name: item.name || item.Name })}
                          className="settings-action-btn delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {getItems().length === 0 && (
                <div className="text-center py-8 text-slate-400 italic text-sm">No hay registros</div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title={`¿Eliminar ${activeTab === 'subs' ? 'subcategoría' : 'categoría'}?`}
        message={`¿Estás seguro de eliminar "${confirmDelete?.name}"? Esto podría desligar elementos asociados.`}
      />
    </div>
  );
}
