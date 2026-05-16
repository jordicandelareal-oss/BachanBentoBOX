import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useIngredients } from '../hooks/useIngredients';
import { useProviders } from '../hooks/useProviders';
import { 
  PackageSearch, ShoppingCart, FileText, Plus, Search,
  TrendingUp, PackageMinus, ChevronDown, ChevronUp, 
  CheckCircle2, AlertTriangle, ListOrdered, Carrot 
} from 'lucide-react';
import '../styles/theme.css';
import '../styles/Common.css';
import './Ingredients.css';

export default function Operations() {
  const [activeTab, setActiveTab] = useState('stock');

  return (
    <div className="catalog-settings-root">
      <header className="settings-header">
        <h1 className="settings-title">Gestión de Operaciones</h1>
        <p className="settings-subtitle">Compras, Stock y Facturación</p>
      </header>

      <nav className="settings-tabs" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <button className={`tab-btn ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}>
          <PackageSearch size={18} /> Stock de Insumos
        </button>
        <button className={`tab-btn ${activeTab === 'compras' ? 'active' : ''}`} onClick={() => setActiveTab('compras')}>
          <ShoppingCart size={18} /> Sugerencia de Compra
        </button>
        <button className={`tab-btn ${activeTab === 'facturas' ? 'active' : ''}`} onClick={() => setActiveTab('facturas')}>
          <FileText size={18} /> Facturas
        </button>
      </nav>

      <div className="settings-content">
        {activeTab === 'stock' && <StockTab />}
        {activeTab === 'compras' && <ComprasTab />}
        {activeTab === 'facturas' && <FacturasTab />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Stock Tab (Clon de Insumos.jsx)
// ─────────────────────────────────────────────────────────────────────────────
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function AlphabetSidebar({ scrollToLetter, presentLetters }) {
  return (
    <aside className="alphabet-sidebar">
      {alphabet.map(letter => {
        const isPresent = presentLetters.includes(letter);
        return (
          <button
            key={letter}
            className={`alphabet-letter ${isPresent ? 'present' : 'absent'}`}
            onClick={(e) => {
              e.preventDefault();
              if (isPresent && typeof scrollToLetter === 'function') {
                scrollToLetter(letter);
              }
            }}
            disabled={!isPresent}
          >
            {letter}
          </button>
        );
      })}
    </aside>
  );
}

function StockCard({ ingredient, updateIngredient }) {
  const [minStock, setMinStock] = useState(ingredient.min_stock || 0);
  const [stock, setStock] = useState(ingredient.stock || 0);

  useEffect(() => {
    setMinStock(ingredient.min_stock || 0);
    setStock(ingredient.stock || 0);
  }, [ingredient.min_stock, ingredient.stock]);

  const handleBlur = (field, val) => {
    let num = parseFloat(val);
    if (isNaN(num)) num = 0;
    if (num !== (ingredient[field] || 0)) {
      updateIngredient(ingredient.id, { [field]: num });
    }
  };

  const isLow = stock < minStock;
  const unit = ingredient.units?.name || (ingredient.calculation_type === 'unidad' ? 'UD' : 'KG');
  const providerName = ingredient.providers?.name || ingredient.provider || 'S/M';
  const categoryName = ingredient.category_name || ingredient.categories?.name || 'General';

  return (
    <div className="insumo-card relative" style={{ overflow: 'visible', paddingTop: '28px' }}>
      
      {/* Badge de Estado Absoluto */}
      <div className="absolute top-0 right-3 -translate-y-1/2 z-10 shadow-md">
        {isLow ? (
          <div className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-black uppercase flex items-center gap-1.5 backdrop-blur-sm">
            <AlertTriangle size={12} strokeWidth={3} /> REPOSICIÓN
          </div>
        ) : (
          <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-[10px] font-black uppercase flex items-center gap-1.5 backdrop-blur-sm">
            <CheckCircle2 size={12} strokeWidth={3} /> OK
          </div>
        )}
      </div>

      <div className="card-avatar mt-1">
        {ingredient.image_url ? (
          <img src={ingredient.image_url} alt={ingredient.name} loading="lazy" />
        ) : (
          <div className="avatar-initials">
            {ingredient.name.substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      <div className="card-info-center">
        <h3 className="card-name-bold">{ingredient.name}</h3>
        <p className="card-subtext">
          {categoryName} · {providerName}
        </p>
      </div>

      <div className="flex flex-col items-end gap-2 ml-auto">
        {/* Input Stock Mínimo */}
        <div className="flex items-center bg-slate-900/60 rounded-lg p-1 border border-slate-700/80 focus-within:border-slate-500 transition-colors w-36 shadow-inner">
          <span className="text-[10px] text-slate-500 font-bold px-2 uppercase tracking-wider flex-1">Mín:</span>
          <input 
            type="number"
            value={minStock}
            onChange={e => setMinStock(e.target.value)}
            onBlur={e => handleBlur('min_stock', e.target.value)}
            className="bg-transparent border-none outline-none text-white w-12 text-right font-bold text-sm"
          />
          <span className="text-[10px] text-slate-400 pr-2 pl-1 font-semibold">{unit}</span>
        </div>

        {/* Input Stock Disponible */}
        <div className={`flex items-center rounded-lg p-1 border transition-colors w-36 shadow-inner ${isLow ? 'bg-red-500/10 border-red-500/40 focus-within:border-red-400' : 'bg-slate-900/80 border-accent/40 focus-within:border-accent'}`}>
          <span className="text-[10px] text-slate-500 font-bold px-2 uppercase tracking-wider flex-1">Disp:</span>
          <input 
            type="number"
            value={stock}
            onChange={e => setStock(e.target.value)}
            onBlur={e => handleBlur('stock', e.target.value)}
            className={`bg-transparent border-none outline-none w-12 text-right font-bold text-sm ${isLow ? 'text-red-400' : 'text-accent'}`}
          />
          <span className="text-[10px] text-slate-400 pr-2 pl-1 font-semibold">{unit}</span>
        </div>
      </div>
    </div>
  );
}

function StockTab() {
  const { ingredients, loading, updateIngredient } = useIngredients();
  const { providers } = useProviders();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [activeProvider, setActiveProvider] = useState('Todos');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      setCategories(data || []);
    }
    load();
  }, []);

  const filteredIngredients = ingredients.filter(ing => {
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || ing.category_id === activeCategory;
    const matchesProvider = activeProvider === 'Todos' || ing.provider_id === activeProvider;
    return matchesSearch && matchesCategory && matchesProvider;
  });

  const presentLetters = [...new Set(filteredIngredients.map(ing => (ing.name || "")[0]?.toUpperCase()))].filter(Boolean);

  const scrollToLetter = (letter) => {
    const el = document.getElementById(`letter-${letter}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="insumos-container w-full">
      {/* Buscador y Filtro Proveedor */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="search-wrapper flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} style={{ left: '16px', top: '50%', position: 'absolute', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar ingrediente en stock..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="provider-filter-wrapper md:w-64">
          <div className="provider-filter-premium">
            <select 
              value={activeProvider}
              onChange={(e) => setActiveProvider(e.target.value)}
            >
              <option value="Todos">📦 Todos los Proveedores</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Píldoras de Categorías */}
      <div className="category-tabs-wrapper mb-6">
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

      {/* Layout Abecedario + Grid */}
      <div className="insumos-layout-wrapper">
        <AlphabetSidebar scrollToLetter={scrollToLetter} presentLetters={presentLetters} />

        <section className="card-grid-container w-full">
          {loading && !ingredients.length ? (
            <div className="insumos-grid">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-24 bg-slate-800 rounded-xl animate-pulse border border-slate-700" />
              ))}
            </div>
          ) : (
            <div className="insumos-grid">
              {filteredIngredients.map((ingredient, idx) => {
                const firstLetter = (ingredient.name || "")[0]?.toUpperCase() || "#";
                const isFirstOfLetter = idx === 0 || (filteredIngredients[idx - 1].name || "")[0]?.toUpperCase() !== firstLetter;
                
                return (
                  <React.Fragment key={ingredient.id}>
                    {isFirstOfLetter && <div id={`letter-${firstLetter}`} className="sr-only"></div>}
                    <StockCard 
                      ingredient={ingredient} 
                      updateIngredient={updateIngredient} 
                    />
                  </React.Fragment>
                );
              })}

              {!loading && filteredIngredients.length === 0 && (
                <div className="text-center py-12 col-span-full">
                  <Carrot className="mx-auto text-slate-600 mb-4" size={48} />
                  <p className="text-slate-400">No se encontraron insumos en stock</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Compras Tab (Motor Inteligente)
// ─────────────────────────────────────────────────────────────────────────────
function ComprasTab() {
  const [shoppingList, setShoppingList] = useState([]);
  const [pendingItemsSummary, setPendingItemsSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  async function calculatePurchases() {
    setLoading(true);
    try {
      const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('items')
        .eq('status', 'pending');
      if (ordersErr) throw ordersErr;

      const itemsSummary = {};
      (orders || []).forEach(order => {
        (order.items || []).forEach(item => {
          itemsSummary[item.name] = (itemsSummary[item.name] || 0) + item.quantity;
        });
      });
      setPendingItemsSummary(Object.entries(itemsSummary).map(([name, qty]) => ({ name, qty })));

      const { data: ingredients, error: ingErr } = await supabase
        .from('ingredients')
        .select('*, providers:provider_id(name), units:unit_id(name)');
      if (ingErr) throw ingErr;

      const { data: recipeIngs, error: recIngErr } = await supabase
        .from('recipe_ingredients')
        .select('*');
      if (recIngErr) throw recIngErr;

      const neededQty = {};

      const addRecipeNeeds = (recipeId, multiplier) => {
        const ingredientsForRecipe = recipeIngs.filter(ri => ri.recipe_id === recipeId);
        ingredientsForRecipe.forEach(ri => {
          if (ri.ingredient_id) {
            neededQty[ri.ingredient_id] = (neededQty[ri.ingredient_id] || 0) + (ri.quantity * multiplier);
          } else if (ri.child_recipe_id) {
            addRecipeNeeds(ri.child_recipe_id, ri.quantity * multiplier);
          }
        });
      };

      (orders || []).forEach(order => {
        (order.items || []).forEach(item => {
          if (item.recipe_id) {
            addRecipeNeeds(item.recipe_id, item.quantity);
          } else if (item.ingredient_id) {
            neededQty[item.ingredient_id] = (neededQty[item.ingredient_id] || 0) + item.quantity;
          }
        });
      });

      const list = [];
      ingredients.forEach(ing => {
        const needFromOrders = neededQty[ing.id] || 0;
        const currentStock = parseFloat(ing.stock || 0);
        const minStock = parseFloat(ing.min_stock || 0);
        
        const target = needFromOrders + minStock;
        const toBuy = target - currentStock;

        if (toBuy > 0) {
          list.push({
            id: ing.id,
            name: ing.name,
            providerName: ing.providers?.name || ing.provider || 'Sin Proveedor',
            unitName: ing.units?.name || 'Unid.',
            toBuy: toBuy,
            needFromOrders,
            currentStock,
            minStock
          });
        }
      });

      const grouped = list.reduce((acc, curr) => {
        if (!acc[curr.providerName]) acc[curr.providerName] = [];
        acc[curr.providerName].push(curr);
        return acc;
      }, {});

      setShoppingList(Object.entries(grouped).sort((a,b) => a[0].localeCompare(b[0])));
      setHasCalculated(true);
    } catch (err) {
      console.error(err);
      alert('Error calculando sugerencias de compra.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="card-panel flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="panel-title mb-1 flex items-center gap-2">
            <ShoppingCart size={22} className="text-accent" />
            Motor Inteligente de Compras
          </h2>
          <p className="text-gray-400 text-sm">Analiza comandas pendientes, calcula el consumo y sugiere pedidos según stock.</p>
        </div>
        <button 
          onClick={calculatePurchases} 
          className="btn-primary rounded-full px-6 py-2.5 font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all flex items-center gap-2" 
          disabled={loading}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          ) : (
            <TrendingUp size={18} />
          )}
          {loading ? 'Procesando...' : 'Calcular Necesidades'}
        </button>
      </div>

      {hasCalculated && (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ListOrdered size={16} className="text-accent" />
            Comandas Pendientes Detectadas
          </h3>
          
          {pendingItemsSummary.length === 0 ? (
            <p className="text-gray-500 text-sm italic">No hay comandas pendientes en el TPV en este momento.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {pendingItemsSummary.map((item, idx) => (
                <div key={idx} className="bg-slate-900/60 border border-slate-700 text-white text-sm px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                  <span className="font-bold text-accent">{item.qty}x</span>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {shoppingList.length === 0 && hasCalculated && (
        <div className="p-12 text-center bg-slate-800/20 rounded-xl border border-dashed border-slate-700/50">
          <CheckCircle2 size={56} className="mx-auto text-green-500/80 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">¡Todo en Orden!</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            El stock actual es suficiente para cubrir las comandas pendientes manteniendo el stock mínimo de seguridad.
          </p>
        </div>
      )}

      {shoppingList.length === 0 && !hasCalculated && (
        <div className="p-12 text-center bg-slate-800/20 rounded-xl border border-dashed border-slate-700/50">
          <PackageMinus size={56} className="mx-auto text-slate-600 mb-4" />
          <p className="text-gray-400">Presiona "Calcular Necesidades" para iniciar el análisis.</p>
        </div>
      )}

      {shoppingList.length > 0 && (
        <div className="flex flex-col gap-5">
          <h3 className="text-lg font-bold text-white mb-1 border-b border-slate-700/50 pb-2">Lista de Compra Generada</h3>
          {shoppingList.map(([provider, items]) => (
            <ProviderPurchaseCard key={provider} provider={provider} items={items} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProviderPurchaseCard({ provider, items }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-slate-800/40 border border-slate-700/80 rounded-xl overflow-hidden shadow-lg">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-800 hover:bg-slate-700/80 transition-colors px-5 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center text-accent">
            <ShoppingCart size={18} />
          </div>
          <div className="text-left">
            <h4 className="text-base font-bold text-white">{provider}</h4>
            <span className="text-xs text-gray-400">{items.length} insumos a reponer</span>
          </div>
        </div>
        <div className="text-gray-400">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {isOpen && (
        <div className="p-0 border-t border-slate-700/50">
          <div className="hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/30 text-gray-400 border-b border-slate-700/50">
                <tr>
                  <th className="px-5 py-3 font-semibold">Insumo</th>
                  <th className="px-5 py-3 font-semibold">Pedidos Pend.</th>
                  <th className="px-5 py-3 font-semibold">Stock Actual</th>
                  <th className="px-5 py-3 font-semibold">Stock Mín.</th>
                  <th className="px-5 py-3 font-semibold text-right text-accent">A Comprar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4 font-medium text-white">{item.name}</td>
                    <td className="px-5 py-4 text-gray-300">{item.needFromOrders.toFixed(2)} <span className="text-xs text-gray-500">{item.unitName}</span></td>
                    <td className="px-5 py-4 text-gray-300">{item.currentStock.toFixed(2)} <span className="text-xs text-gray-500">{item.unitName}</span></td>
                    <td className="px-5 py-4 text-gray-300">{item.minStock.toFixed(2)} <span className="text-xs text-gray-500">{item.unitName}</span></td>
                    <td className="px-5 py-4 text-right text-accent font-bold text-base bg-accent/5">
                      {item.toBuy.toFixed(2)} <span className="text-xs text-accent/70">{item.unitName}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden flex flex-col divide-y divide-slate-700/30">
            {items.map(item => (
              <div key={item.id} className="p-4 flex flex-col gap-3">
                <div className="font-medium text-white text-base">{item.name}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-slate-900/40 p-2 rounded border border-slate-700/50">
                    <div className="text-xs text-gray-500 mb-1">Pendiente</div>
                    <div className="text-gray-300">{item.needFromOrders.toFixed(2)} {item.unitName}</div>
                  </div>
                  <div className="bg-slate-900/40 p-2 rounded border border-slate-700/50">
                    <div className="text-xs text-gray-500 mb-1">Stock Actual</div>
                    <div className="text-gray-300">{item.currentStock.toFixed(2)} {item.unitName}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-accent/10 border border-accent/20 p-3 rounded-lg mt-1">
                  <span className="text-sm font-semibold text-accent/80">Necesidad Total:</span>
                  <span className="text-base font-bold text-accent">{item.toBuy.toFixed(2)} {item.unitName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Facturas Tab
// ─────────────────────────────────────────────────────────────────────────────
function FacturasTab() {
  const [invoices, setInvoices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ provider_id: '', invoice_number: '', date: '', total_amount: '', status: 'pendiente' });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [invRes, provRes] = await Promise.all([
      supabase.from('provider_invoices').select('*, providers(name)').order('date', { ascending: false }),
      supabase.from('providers').select('id, name').order('name')
    ]);
    
    if (invRes.error) console.error(invRes.error);
    else setInvoices(invRes.data || []);

    if (provRes.error) console.error(provRes.error);
    else setProviders(provRes.data || []);
    
    setLoading(false);
  }

  async function handleAddInvoice(e) {
    e.preventDefault();
    const { error } = await supabase.from('provider_invoices').insert([
      {
        provider_id: newInvoice.provider_id || null,
        invoice_number: newInvoice.invoice_number,
        date: newInvoice.date || new Date().toISOString().split('T')[0],
        total_amount: parseFloat(newInvoice.total_amount) || 0,
        status: newInvoice.status
      }
    ]);
    
    if (error) {
      alert("Error guardando factura: " + error.message);
    } else {
      setShowModal(false);
      setNewInvoice({ provider_id: '', invoice_number: '', date: '', total_amount: '', status: 'pendiente' });
      fetchData();
    }
  }

  async function toggleStatus(id, currentStatus) {
    const nextStatus = currentStatus === 'pendiente' ? 'pagado' : 'pendiente';
    await supabase.from('provider_invoices').update({ status: nextStatus }).eq('id', id);
    fetchData();
  }

  return (
    <div className="card-panel">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="panel-title mb-1">Registro de Facturas</h2>
          <p className="text-gray-400 text-sm">Control de gastos por proveedor</p>
        </div>
        <button className="btn-primary rounded-full px-5 flex items-center gap-2 font-semibold" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Añadir Factura
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Cargando facturas...</div>
      ) : (
        <div className="table-responsive hidden md:block">
          <table className="settings-table w-full text-left">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Número</th>
                <th>Importe</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && (
                <tr><td colSpan="5" className="text-center text-gray-500 py-8">No hay facturas registradas.</td></tr>
              )}
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-800/30">
                  <td className="text-gray-300">{new Date(inv.date).toLocaleDateString()}</td>
                  <td className="font-medium text-white">{inv.providers?.name || 'Desconocido'}</td>
                  <td className="text-gray-300">{inv.invoice_number}</td>
                  <td className="font-bold text-white text-base">{parseFloat(inv.total_amount).toFixed(2)}€</td>
                  <td>
                    <button 
                      onClick={() => toggleStatus(inv.id, inv.status)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all shadow-sm ${
                        inv.status === 'pagado' 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                      }`}
                    >
                      {inv.status.toUpperCase()}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
        <div className="md:hidden flex flex-col gap-3">
          {invoices.length === 0 && (
            <div className="text-center text-gray-500 py-8">No hay facturas registradas.</div>
          )}
          {invoices.map(inv => (
            <div key={inv.id} className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white text-lg">{inv.providers?.name || 'Desconocido'}</h4>
                  <p className="text-xs text-gray-400">Factura: {inv.invoice_number}</p>
                </div>
                <button 
                  onClick={() => toggleStatus(inv.id, inv.status)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    inv.status === 'pagado' 
                      ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {inv.status.toUpperCase()}
                </button>
              </div>
              <div className="flex justify-between items-end border-t border-slate-700/50 pt-3 mt-1">
                <span className="text-sm text-gray-400">{new Date(inv.date).toLocaleDateString()}</span>
                <span className="font-bold text-white text-xl">{parseFloat(inv.total_amount).toFixed(2)}€</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-md w-full !bg-slate-900 !border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="modal-header border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Nueva Factura</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddInvoice} className="modal-body flex flex-col gap-5 pt-5">
              <div className="form-group">
                <label className="text-sm text-gray-400 font-medium mb-1 block">Proveedor</label>
                <select 
                  className="form-input w-full bg-slate-800 border-slate-700 text-white rounded-lg focus:border-accent" 
                  value={newInvoice.provider_id} 
                  onChange={e => setNewInvoice({...newInvoice, provider_id: e.target.value})}
                  required
                >
                  <option value="">Selecciona un proveedor...</option>
                  {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="text-sm text-gray-400 font-medium mb-1 block">Nº Factura</label>
                  <input 
                    type="text" 
                    className="form-input w-full bg-slate-800 border-slate-700 text-white rounded-lg focus:border-accent" 
                    value={newInvoice.invoice_number} 
                    onChange={e => setNewInvoice({...newInvoice, invoice_number: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="text-sm text-gray-400 font-medium mb-1 block">Fecha</label>
                  <input 
                    type="date" 
                    className="form-input w-full bg-slate-800 border-slate-700 text-white rounded-lg focus:border-accent" 
                    value={newInvoice.date} 
                    onChange={e => setNewInvoice({...newInvoice, date: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="text-sm text-gray-400 font-medium mb-1 block">Importe (€)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-input w-full bg-slate-800 border-slate-700 text-white rounded-lg focus:border-accent" 
                    value={newInvoice.total_amount} 
                    onChange={e => setNewInvoice({...newInvoice, total_amount: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="text-sm text-gray-400 font-medium mb-1 block">Estado</label>
                  <select 
                    className="form-input w-full bg-slate-800 border-slate-700 text-white rounded-lg focus:border-accent" 
                    value={newInvoice.status} 
                    onChange={e => setNewInvoice({...newInvoice, status: e.target.value})}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button type="button" className="btn-secondary rounded-lg px-4" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary rounded-lg px-6 font-bold shadow-md shadow-accent/20">Guardar Factura</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
