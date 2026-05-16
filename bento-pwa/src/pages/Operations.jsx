import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PackageSearch, ShoppingCart, FileText, Plus, Save, AlertCircle, TrendingUp, TrendingDown, PackageMinus, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, ListOrdered } from 'lucide-react';
import '../styles/theme.css';

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
// 1. Stock Tab
// ─────────────────────────────────────────────────────────────────────────────
function StockTab() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStock();
  }, []);

  async function fetchStock() {
    setLoading(true);
    const { data, error } = await supabase
      .from('ingredients')
      .select('id, name, stock, min_stock, units:unit_id(name)')
      .order('name');
    if (error) console.error(error);
    else setIngredients(data || []);
    setLoading(false);
  }

  async function updateStock(id, field, value) {
    const numValue = parseFloat(value) || 0;
    setIngredients(prev => prev.map(ing => ing.id === id ? { ...ing, [field]: numValue } : ing));
    await supabase.from('ingredients').update({ [field]: numValue }).eq('id', id);
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando stock...</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="card-panel mb-2">
        <h2 className="panel-title mb-0">Control de Existencias</h2>
      </div>

      <div className="flex flex-col gap-3">
        {/* Header para Desktop */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 text-sm font-semibold text-gray-400 border-b border-slate-700/50">
          <div className="col-span-5">Insumo</div>
          <div className="col-span-3">Stock Mínimo</div>
          <div className="col-span-2">En Stock</div>
          <div className="col-span-2 text-right">Estado</div>
        </div>

        {ingredients.map(ing => {
          const stock = ing.stock || 0;
          const minStock = ing.min_stock || 0;
          const isLow = stock < minStock;
          const unit = ing.units?.name || 'Unid.';

          return (
            <div key={ing.id} className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 md:px-6 md:py-4 transition-all hover:border-slate-600/80 hover:bg-slate-800/60 flex flex-col md:grid md:grid-cols-12 md:items-center gap-4">
              
              {/* Insumo */}
              <div className="md:col-span-5 flex flex-col">
                <span className="text-white font-medium text-base">{ing.name}</span>
                <span className="text-xs text-gray-400 md:hidden mt-1">Control de stock</span>
              </div>

              {/* Stock Mínimo */}
              <div className="md:col-span-3 flex items-center justify-between md:justify-start gap-3">
                <span className="text-sm text-gray-400 md:hidden w-24">Mínimo:</span>
                <div className="flex items-center gap-2 flex-1 md:flex-none bg-slate-900/50 rounded-lg p-1 border border-slate-700 focus-within:border-accent transition-colors">
                  <input 
                    type="number" 
                    value={minStock}
                    onChange={(e) => updateStock(ing.id, 'min_stock', e.target.value)}
                    className="bg-transparent border-none outline-none text-white w-16 text-right font-medium"
                    min="0" step="0.1"
                  />
                  <span className="text-xs text-gray-400 pr-2">{unit}</span>
                </div>
              </div>

              {/* En Stock */}
              <div className="md:col-span-2 flex items-center justify-between md:justify-start gap-3">
                <span className="text-sm text-gray-400 md:hidden w-24">Actual:</span>
                <div className={`flex items-center gap-2 flex-1 md:flex-none bg-slate-900/50 rounded-lg p-1 border transition-colors ${isLow ? 'border-red-500/50 focus-within:border-red-400' : 'border-slate-700 focus-within:border-accent'}`}>
                  <input 
                    type="number" 
                    value={stock}
                    onChange={(e) => updateStock(ing.id, 'stock', e.target.value)}
                    className={`bg-transparent border-none outline-none w-16 text-right font-medium ${isLow ? 'text-red-400' : 'text-white'}`}
                    min="0" step="0.1"
                  />
                  <span className="text-xs text-gray-400 pr-2">{unit}</span>
                </div>
              </div>

              {/* Estado */}
              <div className="md:col-span-2 flex items-center justify-between md:justify-end border-t border-slate-700/50 md:border-0 pt-3 md:pt-0 mt-1 md:mt-0">
                <span className="text-sm text-gray-400 md:hidden">Estado:</span>
                {isLow ? (
                  <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                    <AlertTriangle size={14} /> REPOSICIÓN
                  </div>
                ) : (
                  <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> OK
                  </div>
                )}
              </div>

            </div>
          );
        })}
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
      // 1. Fetch pending orders
      const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('items')
        .eq('status', 'pending');
      if (ordersErr) throw ordersErr;

      // 1.5 Parse Pending Items Summary
      const itemsSummary = {};
      (orders || []).forEach(order => {
        (order.items || []).forEach(item => {
          itemsSummary[item.name] = (itemsSummary[item.name] || 0) + item.quantity;
        });
      });
      setPendingItemsSummary(Object.entries(itemsSummary).map(([name, qty]) => ({ name, qty })));

      // 2. Fetch all ingredients (for stock, min_stock, provider info)
      const { data: ingredients, error: ingErr } = await supabase
        .from('ingredients')
        .select('*, providers:provider_id(name), units:unit_id(name)');
      if (ingErr) throw ingErr;

      // 3. Fetch all recipe_ingredients to break down recipes
      const { data: recipeIngs, error: recIngErr } = await supabase
        .from('recipe_ingredients')
        .select('*');
      if (recIngErr) throw recIngErr;

      // Map to accumulate needed quantities per ingredient
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

      // 4. Compare needed with stock + min_stock
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

      // Group by provider
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
      
      {/* Cabecera / Acciones */}
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

      {/* Resumen de Platos Pendientes (Solo si se ha calculado) */}
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

      {/* Estado Vacío */}
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

      {/* Lista Agrupada por Proveedor (Acordeones/Cards) */}
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

// Componente Tarjeta Acordeón por Proveedor
function ProviderPurchaseCard({ provider, items }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-slate-800/40 border border-slate-700/80 rounded-xl overflow-hidden shadow-lg">
      {/* Header del Proveedor */}
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

      {/* Contenido (Tabla/Cards) */}
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

          {/* Vista Móvil */}
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

      {/* Facturas Mobile View */}
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

      {/* Modal Nueva Factura */}
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
