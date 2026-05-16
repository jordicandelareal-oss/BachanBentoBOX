import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PackageSearch, ShoppingCart, FileText, Plus, Save, AlertCircle, TrendingUp, TrendingDown, PackageMinus } from 'lucide-react';
import '../styles/theme.css';

export default function Operations() {
  const [activeTab, setActiveTab] = useState('stock');

  return (
    <div className="catalog-settings-root">
      <header className="settings-header">
        <h1 className="settings-title">Gestión de Operaciones</h1>
        <p className="settings-subtitle">Compras, Stock y Facturación</p>
      </header>

      <nav className="settings-tabs">
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
    <div className="card-panel">
      <h2 className="panel-title">Control de Existencias</h2>
      <div className="table-responsive">
        <table className="settings-table w-full text-left">
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Stock Mínimo</th>
              <th>En Stock</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map(ing => {
              const stock = ing.stock || 0;
              const minStock = ing.min_stock || 0;
              const status = stock < minStock ? 'Bajo' : 'OK';
              const unit = ing.units?.name || 'Unid.';
              return (
                <tr key={ing.id}>
                  <td>{ing.name}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={minStock}
                        onChange={(e) => updateStock(ing.id, 'min_stock', e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-24 text-white"
                      />
                      <span className="text-sm text-gray-400">{unit}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={stock}
                        onChange={(e) => updateStock(ing.id, 'stock', e.target.value)}
                        className={`bg-slate-800 border rounded px-2 py-1 w-24 text-white ${stock < minStock ? 'border-red-500' : 'border-slate-700'}`}
                      />
                      <span className="text-sm text-gray-400">{unit}</span>
                    </div>
                  </td>
                  <td>
                    {stock < minStock ? (
                      <span className="flex items-center gap-1 text-red-400 text-sm font-semibold">
                        <TrendingDown size={14} /> {status}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-400 text-sm font-semibold">
                        <TrendingUp size={14} /> {status}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Compras Tab (Motor Inteligente)
// ─────────────────────────────────────────────────────────────────────────────
function ComprasTab() {
  const [shoppingList, setShoppingList] = useState([]);
  const [loading, setLoading] = useState(false);

  async function calculatePurchases() {
    setLoading(true);
    try {
      // 1. Fetch pending orders
      const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('items')
        .eq('status', 'pending');
      if (ordersErr) throw ordersErr;

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

      // Recursively break down a recipe
      const addRecipeNeeds = (recipeId, multiplier) => {
        const ingredientsForRecipe = recipeIngs.filter(ri => ri.recipe_id === recipeId);
        ingredientsForRecipe.forEach(ri => {
          if (ri.ingredient_id) {
            neededQty[ri.ingredient_id] = (neededQty[ri.ingredient_id] || 0) + (ri.quantity * multiplier);
          } else if (ri.child_recipe_id) {
            // It's a sub-recipe
            addRecipeNeeds(ri.child_recipe_id, ri.quantity * multiplier);
          }
        });
      };

      // Process all pending orders
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
        
        // We want to have at least 'min_stock' AFTER fulfilling pending orders.
        // So target = needFromOrders + minStock
        // Diff = target - currentStock
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

      setShoppingList(Object.entries(grouped));
    } catch (err) {
      console.error(err);
      alert('Error calculando sugerencias de compra.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-panel">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="panel-title mb-1">Motor de Compras</h2>
          <p className="text-gray-400 text-sm">Despiece de pedidos pendientes vs. Stock actual</p>
        </div>
        <button onClick={calculatePurchases} className="btn-primary" disabled={loading}>
          {loading ? 'Calculando...' : 'Calcular Necesidades'}
        </button>
      </div>

      {shoppingList.length === 0 && !loading && (
        <div className="p-8 text-center bg-slate-800/50 rounded-lg border border-slate-700/50">
          <PackageMinus size={48} className="mx-auto text-slate-500 mb-3" />
          <p className="text-gray-300">No hay sugerencias. Haz clic en "Calcular Necesidades".</p>
        </div>
      )}

      {shoppingList.length > 0 && (
        <div className="flex flex-col gap-6">
          {shoppingList.map(([provider, items]) => (
            <div key={provider} className="bg-slate-800/40 border border-slate-700 rounded-lg overflow-hidden">
              <div className="bg-slate-700/50 px-4 py-3 font-semibold text-accent flex items-center gap-2">
                <ShoppingCart size={16} /> {provider}
              </div>
              <div className="p-4">
                <table className="settings-table w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th>Insumo</th>
                      <th>Pedidos Pend.</th>
                      <th>Stock Actual</th>
                      <th>Stock Mín.</th>
                      <th className="text-right text-accent">A Comprar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td className="font-medium text-white">{item.name}</td>
                        <td className="text-gray-400">{item.needFromOrders.toFixed(2)} {item.unitName}</td>
                        <td className="text-gray-400">{item.currentStock.toFixed(2)} {item.unitName}</td>
                        <td className="text-gray-400">{item.minStock.toFixed(2)} {item.unitName}</td>
                        <td className="text-right text-accent font-bold">
                          {item.toBuy.toFixed(2)} {item.unitName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="panel-title">Registro de Facturas</h2>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Añadir Factura
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400">Cargando facturas...</div>
      ) : (
        <div className="table-responsive">
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
                <tr><td colSpan="5" className="text-center text-gray-500 py-4">No hay facturas registradas.</td></tr>
              )}
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td>{new Date(inv.date).toLocaleDateString()}</td>
                  <td className="font-medium text-white">{inv.providers?.name || 'Desconocido'}</td>
                  <td>{inv.invoice_number}</td>
                  <td className="font-semibold text-white">{parseFloat(inv.total_amount).toFixed(2)}€</td>
                  <td>
                    <button 
                      onClick={() => toggleStatus(inv.id, inv.status)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nueva Factura</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddInvoice} className="modal-body flex flex-col gap-4">
              <div className="form-group">
                <label>Proveedor</label>
                <select 
                  className="form-input" 
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
                  <label>Nº Factura</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newInvoice.invoice_number} 
                    onChange={e => setNewInvoice({...newInvoice, invoice_number: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Fecha</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={newInvoice.date} 
                    onChange={e => setNewInvoice({...newInvoice, date: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label>Importe (€)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-input" 
                    value={newInvoice.total_amount} 
                    onChange={e => setNewInvoice({...newInvoice, total_amount: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Estado</label>
                  <select 
                    className="form-input" 
                    value={newInvoice.status} 
                    onChange={e => setNewInvoice({...newInvoice, status: e.target.value})}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer mt-4">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Factura</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
