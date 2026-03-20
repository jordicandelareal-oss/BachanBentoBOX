import React, { useState, useEffect } from 'react';
import { useIngredients } from '../hooks/useIngredients';
import { useUnits } from '../hooks/useUnits';
import { supabase } from '../lib/supabaseClient';
import { Package, Search, Plus, AlertCircle, Loader2, ChevronRight, LayoutGrid, X, Save, Trash2 } from 'lucide-react';
import ConfirmationModal from '../components/Common/ConfirmationModal';
import NumPad from '../components/Common/NumPad';
import '../styles/Common.css';
import './Ingredients.css';

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

  const canSave = !!form.name && !!form.category_id && !!form.subcategory_id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      purchase_format: form.purchase_format ? parseFloat(form.purchase_format) : null,
      purchase_price: form.purchase_price !== '' ? parseFloat(form.purchase_price) : null,
      provider: form.provider || null,
      unit_id: form.unit_id || null,
      category_id: form.category_id || null,
      subcategory_id: form.subcategory_id || null,
    };
    await onSave(payload);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isNew ? 'Añadir Insumo' : `Editar: ${ingredient.name}`}</h2>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">

          {/* Nombre (Siempre el primero si es nuevo) */}
          {isNew && (
            <div className="form-group mb-4">
              <label className="form-label">Nombre del Insumo *</label>
              <input
                className="form-input"
                type="text"
                required
                placeholder="Ej: Aceite de Oliva"
                value={form.name}
                onChange={e => set('name', e.target.value)}
              />
            </div>
          )}

          {/* Fila 1: Clasificación */}
          <div className="form-row mb-4">
            <div className="form-group">
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
            <div className="form-group">
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

          {/* Fila 2: Datos de Factura */}
          <div className="form-row mb-4">
            <div className="form-group">
              <label className="form-label text-slate-500">Formato de Compra</label>
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
            <div className="form-group">
              <label className="form-label text-slate-500">Unidad Base</label>
              <select
                className="form-input form-select bg-slate-50"
                value={form.unit_id}
                onChange={e => set('unit_id', e.target.value)}
              >
                <option value="">— Sin unidad —</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
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

          {/* Fila 4: Resultado Operativo */}
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
            }}>COSTE NETO CALCULADO</span>
            <div style={{
               fontSize: '24px',
               fontWeight: 800,
               color: '#0c4a6e'
            }}>
              {form.purchase_format && form.purchase_price && parseFloat(form.purchase_format) > 0
                ? `${(parseFloat(form.purchase_price) / parseFloat(form.purchase_format)).toFixed(2)}`
                : ingredient.cost_per_unit
                  ? `${parseFloat(ingredient.cost_per_unit).toFixed(2)}`
                  : '0.00'}€ {form.unit_id ? `/ ${units.find(u => u.id === form.unit_id)?.name || ''}` : ''}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading || !canSave}>
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
  const { ingredients, loading, error, updateIngredient, addIngredient, deleteIngredient } = useIngredients();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [activeSubcategory, setActiveSubcategory] = useState('Todos');
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [modal, setModal] = useState(null); // null | { ingredient, isNew }
  const [confirmDelete, setConfirmDelete] = useState(null); // null | ingredientId
  const [saving, setSaving] = useState(false);

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
    let result;
    if (modal.isNew) {
      result = await addIngredient(payload);
    } else {
      result = await updateIngredient(modal.ingredient.id, payload);
    }
    setSaving(false);
    if (!result.success) {
      alert('Error al guardar: ' + result.error);
    } else {
      closeModal();
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const result = await deleteIngredient(confirmDelete);
    if (!result.success) {
      alert('Error al eliminar: ' + result.error);
    }
    setConfirmDelete(null);
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
        <div className="card-grid">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" style={{ height: '80px', background: '#f1f5f9', borderRadius: '16px' }} />
          ))}
        </div>
      ) : (
        <div className="card-grid">
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
              <div className="ingredient-info">
                <div className="card-icon-wrapper">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="card-title">{ingredient.name}</h3>
                  <p className="card-meta">
                    {ingredient.unit_name || 'unid'} · {ingredient.category_name || 'Sin categoría'}
                    {ingredient.provider ? ` · ${ingredient.provider}` : ''}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="card-meta" style={{ fontSize: '10px' }}>Precio / kg·lt</div>
                  <div className="price-display">
                    {(() => {
                      const cost = parseFloat(ingredient.cost_per_unit || 0);
                      const unit = (ingredient.unit_name || '').toLowerCase();
                      const isBaseUnit = ['g', 'ml', 'kg', 'l', 'kilo', 'litro'].some(u => unit.includes(u));
                      
                      if (isBaseUnit && cost > 0) {
                        return `${(cost * 1000).toFixed(2)}€`;
                      }
                      return `${cost.toFixed(2)}€`;
                    })()}
                  </div>
                </div>
                <button 
                  className="delete-btn-subtle"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(ingredient.id);
                  }}
                >
                  <Trash2 size={18} />
                </button>
                <ChevronRight size={18} className="text-slate-300" />
              </div>
              </div>
            );
          })}

          {!loading && filteredIngredients.length === 0 && (
            <div className="text-center py-12" style={{ textAlign: 'center', padding: '48px 0' }}>
              <LayoutGrid className="mx-auto text-slate-200 mb-4" size={48} style={{ margin: '0 auto 16px', color: '#e2e8f0' }} />
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

      <ConfirmationModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="¿Eliminar insumo?"
        message="Esta acción no se puede deshacer y podría afectar a las recetas que usan este ingrediente."
      />

      {/* A-Z Sidebar */}
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
