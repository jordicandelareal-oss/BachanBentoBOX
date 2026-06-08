import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useIngredients } from '../hooks/useIngredients';
import { useProviders } from '../hooks/useProviders';
import { 
  PackageSearch, ShoppingCart, FileText, Plus, Search,
  TrendingUp, PackageMinus, ChevronDown, ChevronUp, 
  CheckCircle2, AlertTriangle, ListOrdered, Carrot,
  Loader2
} from 'lucide-react';
import '../styles/theme.css';
import '../styles/Common.css';
import './Ingredients.css';

export default function Operations() {
  const [activeTab, setActiveTab] = useState('stock');

  return (
    <div className="page-container fade-in md:!max-w-none md:px-8">
      <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="page-title">Gestión de Operaciones</h1>
          <p className="page-subtitle">Compras, Stock y Facturación</p>
        </div>
      </div>

      <div className="category-tabs-wrapper mb-6">
        <div className="category-tabs">
          <button 
            className={`category-tab ${activeTab === 'stock' ? 'active' : ''}`} 
            onClick={() => setActiveTab('stock')}
          >
            <PackageSearch size={16} /> Stock de Insumos
          </button>
          <button 
            className={`category-tab ${activeTab === 'compras' ? 'active' : ''}`} 
            onClick={() => setActiveTab('compras')}
          >
            <ShoppingCart size={16} /> Sugerencias de Compra
          </button>
          <button 
            className={`category-tab ${activeTab === 'facturas' ? 'active' : ''}`} 
            onClick={() => setActiveTab('facturas')}
          >
            <FileText size={16} /> Facturas
          </button>
        </div>
      </div>

      <div className="mt-4">
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
  const [maxStock, setMaxStock] = useState(ingredient.max_stock || 0);
  const [stock, setStock]       = useState(ingredient.stock || 0);

  useEffect(() => {
    setMinStock(ingredient.min_stock || 0);
    setMaxStock(ingredient.max_stock || 0);
    setStock(ingredient.stock || 0);
  }, [ingredient.min_stock, ingredient.max_stock, ingredient.stock]);

  const handleBlur = (field, val) => {
    let num = parseFloat(val);
    if (isNaN(num)) num = 0;
    if (num !== (ingredient[field] || 0)) {
      updateIngredient(ingredient.id, { [field]: num });
    }
  };

  const isLow        = stock <= minStock;
  const unit         = ingredient.calculation_type === 'unidad' ? 'ud' : 'g';
  const providerName = ingredient.providers?.name || ingredient.provider || 'S/M';
  const categoryName = ingredient.category_name || ingredient.categories?.name || 'General';

  return (
    <div className="stock-card">

      {/* Fila 1 (Superior Móvil): Identidad + Estado */}
      <div className="stock-card__row-1 flex flex-row justify-between items-center w-full md:contents">
        
        {/* BLOQUE IZQUIERDO: identidad */}
        <div className="stock-card__left">
          <div className="stock-card__avatar">
            {ingredient.image_url
              ? <img src={ingredient.image_url} alt={ingredient.name} loading="lazy" />
              : <span className="stock-card__initials">{ingredient.name.substring(0, 2).toUpperCase()}</span>
            }
          </div>
          {/* min-width garantizado para que el nombre nunca colapse a una letra */}
          <div className="stock-card__text">
            <p className="stock-card__name">{ingredient.name}</p>
            <p className="stock-card__sub">{categoryName} · {providerName}</p>
          </div>
        </div>

        {/* Badge de estado: abreviado tanto en móvil como en escritorio */}
        <div className="stock-card__badge">
          <span className={`stock-badge ${isLow ? 'stock-badge--low' : 'stock-badge--ok'}`}>
            {isLow ? 'REP' : 'OK'}
          </span>
        </div>

      </div>

      {/* Fila 2 (Inferior Móvil): El Bloque Numérico */}
      <div className="stock-card__row-2 flex flex-row items-center gap-2 w-full mt-2 md:mt-0 md:contents">

        {/* Píldoras Min / Máx */}
        <div className="stock-card__alarms">
          <div className="stock-pill">
            <span className="stock-pill__label">Min</span>
            <input
              type="number"
              className="stock-pill__input"
              value={minStock}
              onChange={e => setMinStock(e.target.value)}
              onBlur={e => handleBlur('min_stock', e.target.value)}
            />
          </div>
          <div className="stock-pill">
            <span className="stock-pill__label">Máx</span>
            <input
              type="number"
              className="stock-pill__input"
              value={maxStock}
              onChange={e => setMaxStock(e.target.value)}
              onBlur={e => handleBlur('max_stock', e.target.value)}
            />
          </div>
        </div>

        {/* Input de stock disponible */}
        <div className="stock-card__qty">
          <input
            type="number"
            className={`stock-card__qty-input ${isLow ? 'stock-card__qty-input--low' : 'stock-card__qty-input--ok'}`}
            value={stock}
            onChange={e => setStock(e.target.value)}
            onBlur={e => handleBlur('stock', e.target.value)}
          />
          <span className="stock-card__unit">{unit}</span>
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
  const [activeSubcategory, setActiveSubcategory] = useState('Todos');
  const [activeProvider, setActiveProvider] = useState('Todos');
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      setCategories(data || []);
    }
    load();
  }, []);

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
    const matchesProvider = activeProvider === 'Todos' || ing.provider_id === activeProvider;
    return matchesSearch && matchesCategory && matchesSubcategory && matchesProvider;
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
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    async function fetchPendingOrders() {
      setLoadingOrders(true);
      try {
        const { data: orders, error } = await supabase
          .from('orders')
          .select('items')
          .eq('status', 'pending');
        if (error) throw error;
        
        const itemsSummary = {};
        (orders || []).forEach(order => {
          (order.items || []).forEach(item => {
            itemsSummary[item.name] = (itemsSummary[item.name] || 0) + item.quantity;
          });
        });
        setPendingItemsSummary(Object.entries(itemsSummary).map(([name, qty]) => ({ name, qty })));
      } catch (err) {
        console.error("Error loading pending orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    }
    fetchPendingOrders();
  }, []);

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
      const usageBreakdown = {};

      const addRecipeNeeds = (recipeId, multiplier, orderItemName) => {
        const ingredientsForRecipe = recipeIngs.filter(ri => ri.recipe_id === recipeId);
        ingredientsForRecipe.forEach(ri => {
          if (ri.ingredient_id) {
            neededQty[ri.ingredient_id] = (neededQty[ri.ingredient_id] || 0) + (ri.quantity * multiplier);
            if (!usageBreakdown[ri.ingredient_id]) {
              usageBreakdown[ri.ingredient_id] = {};
            }
            usageBreakdown[ri.ingredient_id][orderItemName] = (usageBreakdown[ri.ingredient_id][orderItemName] || 0) + (ri.quantity * multiplier);
          } else if (ri.child_recipe_id) {
            addRecipeNeeds(ri.child_recipe_id, ri.quantity * multiplier, orderItemName);
          }
        });
      };

      (orders || []).forEach(order => {
        (order.items || []).forEach(item => {
          if (item.recipe_id) {
            addRecipeNeeds(item.recipe_id, item.quantity, item.name);
          } else if (item.ingredient_id) {
            neededQty[item.ingredient_id] = (neededQty[item.ingredient_id] || 0) + item.quantity;
            if (!usageBreakdown[item.ingredient_id]) {
              usageBreakdown[item.ingredient_id] = {};
            }
            usageBreakdown[item.ingredient_id][item.name] = (usageBreakdown[item.ingredient_id][item.name] || 0) + item.quantity;
          }
        });
      });

      const list = [];
      ingredients.forEach(ing => {
        const needFromOrders = neededQty[ing.id] || 0;
        
        // REQUISITO CRÍTICO: Solo sugerir compras para los ingredientes demandados por los platos pendientes.
        if (needFromOrders <= 0) return;

        const currentStock = Math.max(0, parseFloat(ing.stock || 0));
        // REQUISITO: Cantidad a Comprar = Total Necesario en Recetas - Stock Actual (si el stock cubre la necesidad, la cantidad es 0)
        const toBuy = needFromOrders - currentStock;

        if (toBuy > 0) {
          list.push({
            id: ing.id,
            name: ing.name,
            providerName: (() => {
              const prov = Array.isArray(ing.providers) ? ing.providers[0] : ing.providers;
              const name = prov?.name || ing.provider || '';
              return (!name || name === 'null') ? 'Sin Proveedor' : name;
            })(),
            unitName: ing.calculation_type === 'unidad' ? 'ud' : 'g',
            toBuy: toBuy,
            needFromOrders,
            currentStock,
            minStock: parseFloat(ing.min_stock || 0),
            breakdown: usageBreakdown[ing.id] || {}
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
      {/* 1. Bloque Superior Nuevo: Pedidos Pendientes */}
      <div className="bg-[#fdfbf7] border border-slate-200/85 rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <ListOrdered size={16} className="text-amber-700" />
          Pedidos en Cola - Servicio Actual
        </h3>
        
        {loadingOrders ? (
          <div className="text-slate-400 text-sm italic flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-amber-600" />
            Cargando comandas pendientes...
          </div>
        ) : pendingItemsSummary.length === 0 ? (
          <p className="text-slate-400 text-sm italic">No hay comandas pendientes de preparar en el TPV.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {pendingItemsSummary.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white border border-amber-100/80 text-slate-700 text-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-sm hover:border-amber-250 transition-colors"
              >
                <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full text-xs">
                  {item.qty}x
                </span>
                <span className="font-semibold text-slate-800">{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Caja del Motor Inteligente */}
      <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-200">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <ShoppingCart size={20} className="text-sky-500" />
            Motor Inteligente de Compras
          </h2>
          <p className="text-slate-400 text-sm mt-1">Analiza comandas pendientes, calcula el consumo y sugiere pedidos según stock.</p>
        </div>
        <button 
          onClick={calculatePurchases} 
          className="btn-primary rounded-full px-6 py-2.5 font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 bg-slate-900 text-white hover:bg-sky-500 hover:border-sky-500 border border-transparent" 
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <TrendingUp size={18} />
          )}
          {loading ? 'Procesando...' : 'Calcular Necesidades'}
        </button>
      </div>

      {shoppingList.length === 0 && hasCalculated && (
        <div className="p-12 text-center bg-emerald-50/30 rounded-xl border border-dashed border-emerald-200 transition-all duration-200">
          <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4 animate-bounce" style={{ animationDuration: '3s' }} />
          <h3 className="text-lg font-bold text-emerald-800 mb-2">¡Todo en Orden!</h3>
          <p className="text-emerald-600/80 text-sm max-w-md mx-auto">
            El stock actual es suficiente para cubrir las comandas pendientes.
          </p>
        </div>
      )}

      {shoppingList.length === 0 && !hasCalculated && (
        <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 transition-all duration-200">
          <PackageMinus size={48} className="mx-auto text-slate-400 mb-4" />
          <h3 className="text-base font-bold text-slate-700 mb-1">Análisis de Stock</h3>
          <p className="text-slate-400 text-sm">Presiona "Calcular Necesidades" para iniciar el análisis inteligente de compras.</p>
        </div>
      )}

      {shoppingList.length > 0 && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <ShoppingCart size={20} className="text-sky-500" />
              Lista de Compra Generada
            </h3>
            <span className="text-xs bg-sky-50 text-sky-700 px-3 py-1 rounded-full font-bold">
              {shoppingList.length} {shoppingList.length === 1 ? 'Proveedor' : 'Proveedores'}
            </span>
          </div>
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
    <div className="bg-[#fdfbf7] border border-slate-200/80 rounded-xl overflow-hidden shadow-sm hover:border-slate-350 transition-all duration-200 w-full">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#fcf9f2] hover:bg-[#f8f4e8] transition-colors px-6 py-4 flex items-center justify-between border-b border-slate-200/60"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <ShoppingCart size={18} />
          </div>
          <div className="text-left flex flex-col md:flex-row md:items-center gap-2">
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase bg-slate-900 text-slate-100 shadow-sm border border-slate-800">
              PROVEEDOR: {provider}
            </span>
            <span className="text-xs text-amber-800/60 font-semibold md:pl-1">
              {items.length} {items.length === 1 ? 'insumo' : 'insumos'} a reponer
            </span>
          </div>
        </div>
        <div className="text-slate-400">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {isOpen && (
        <div className="p-0">
          {/* ── Tabla Semántica Ancho Completo ── */}
          <div className="overflow-x-auto" style={{ borderLeft: '3px solid rgba(251,113,133,0.4)', marginLeft: '8px' }}>
            <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '28%' }} />
                <col style={{ width: '40%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '16%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: 'rgba(252,249,242,0.7)', borderBottom: '1px solid rgba(226,232,240,0.6)' }}>
                  <th style={{
                    padding: '10px 16px 10px 24px',
                    fontSize: '10px', fontWeight: 700,
                    color: 'rgba(120,84,40,0.6)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    textAlign: 'left'
                  }}>Ingrediente</th>
                  <th style={{
                    padding: '10px 16px',
                    fontSize: '10px', fontWeight: 700,
                    color: 'rgba(120,84,40,0.6)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    textAlign: 'left'
                  }}>Desglose Recetas</th>
                  <th style={{
                    padding: '10px 16px',
                    fontSize: '10px', fontWeight: 700,
                    color: 'rgba(120,84,40,0.6)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    textAlign: 'center'
                  }}>Stock Actual</th>
                  <th style={{
                    padding: '10px 24px 10px 16px',
                    fontSize: '10px', fontWeight: 700,
                    color: 'rgba(120,84,40,0.6)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    textAlign: 'right'
                  }}>Total a Comprar</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const breakdownEntries = Object.entries(item.breakdown || {});
                  const isLast = idx === items.length - 1;

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: isLast ? 'none' : '1px solid #f3f4f6',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(254,243,199,0.12)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px 12px 24px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', flexShrink: 0 }} />
                          <span
                            style={{ fontWeight: 700, color: '#1e293b', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={item.name}
                          >
                            {item.name}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', minWidth: 0 }}>
                        {breakdownEntries.length > 0 ? (
                          <span
                            style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            title={breakdownEntries.map(([recipeName, qty]) => `${recipeName}: ${qty.toFixed(0)}${item.unitName}`).join(' · ')}
                          >
                            {breakdownEntries.map(([recipeName, qty]) => `${recipeName}: ${qty.toFixed(0)}${item.unitName}`).join(' · ')}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#cbd5e1', fontStyle: 'italic' }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151', fontFamily: 'ui-monospace, monospace' }}>
                          {item.currentStock.toFixed(1)}
                        </span>
                        <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '2px' }}>{item.unitName}</span>
                      </td>

                      <td style={{ padding: '12px 24px 12px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'baseline', gap: '3px',
                          background: 'rgba(254,243,199,0.6)', border: '1px solid rgba(253,230,138,0.5)',
                          padding: '4px 10px', borderRadius: '6px',
                          fontWeight: 900, fontFamily: 'ui-monospace, monospace', fontSize: '13px', color: '#78350f'
                        }}>
                          {item.toBuy.toFixed(1)}
                          <span style={{ fontSize: '10px', fontWeight: 600, color: '#92400e' }}>{item.unitName}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
