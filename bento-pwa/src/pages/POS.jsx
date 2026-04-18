import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { deductStockForOrder } from '../lib/inventoryService';
import { 
  Plus, 
  Minus, 
  ShoppingBag, 
  Trash2, 
  CheckCircle2, 
  CreditCard, 
  Banknote, 
  X,
  ChevronRight,
  LayoutGrid,
  Utensils,
  Coffee,
  Sparkles,
  Search,
  RefreshCw,
  Settings,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMenuCategories } from '../hooks/useMenuCategories';

class SmartTouchSensor extends TouchSensor {
  static activators = [
    {
      eventName: 'onTouchStart',
      handler: ({ nativeEvent: event }) => {
        if (!event.isPrimary || event.target.closest('button')) {
          return false;
        }
        return true;
      },
    },
  ];
}

class SmartMouseSensor extends MouseSensor {
  static activators = [
    {
      eventName: 'onMouseDown',
      handler: ({ nativeEvent: event }) => {
        if (event.button !== 0 || event.target.closest('button')) {
          return false;
        }
        return true;
      },
    },
  ];
}

import '../styles/Common.css';
import './POS.css';

function SortableProduct({ id, isEmpty, children, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({id});
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
    touchAction: 'none',
    aspectRatio: '1 / 1',
    width: '100%',
    height: '100%'
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onClick}>
      {children}
    </div>
  );
}

export default function POS() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { categories } = useMenuCategories();
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      // Prioritize explicit active categories
      const firstActive = categories.find(c => c.is_active);
      if (firstActive) {
        console.log('📦 TPV: Setting initial category (ID):', firstActive.id, `(${firstActive.name})`);
        setActiveCategory(String(firstActive.id));
      } else {
        console.log('📦 TPV: No active categories found, using first available ID:', categories[0].id);
        setActiveCategory(String(categories[0].id));
      }
    }
  }, [categories, activeCategory]);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('bachan_tpv_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // UI Settings (No-Code Config)
  const [viewSettings, setViewSettings] = useState(() => {
    const saved = localStorage.getItem('bachan_tpv_settings');
    return saved ? JSON.parse(saved) : {
      columns: 4,
      showPhotos: true,
      fontSize: 14,
      isEditMode: false
    };
  });

  const [ticketSeq, setTicketSeq] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileTicket, setShowMobileTicket] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState(false);
  const [pendingModifierProduct, setPendingModifierProduct] = useState(null);
  const [entryQuantity, setEntryQuantity] = useState('');
  
  // New Workflow States
  const [customerName, setCustomerName] = useState('');
  const [tableId, setTableId] = useState('Delivery');
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [showOpenOrders, setShowOpenOrders] = useState(false);
  const [openOrdersList, setOpenOrdersList] = useState([]);
  
  // Discount States
  const [discountValue, setDiscountValue] = useState(0); // El valor ingresado (ej: 10)
  const [discountType, setDiscountType] = useState('percent'); // 'percent' o 'fixed'
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);

  // 1. DATA FETCHING & SYNC
  const fetchTicketSeq = async () => {
    try {
      const { data, error } = await supabase
        .from('pos_config')
        .select('value')
        .eq('key', 'ticket_sequence')
        .single();
      
      if (error) throw error;
      setTicketSeq(Number(data.value?.last_number || 0));
    } catch (err) {
      console.warn('⚠️ TPV: Error fetching ticket sequence for preview:', err);
    }
  };

  useEffect(() => {
    fetchTicketSeq();
  }, []);

  const resetTicketCounter = async () => {
    if (window.confirm("¿Seguro que quieres reiniciar la numeración de tickets al #0001? (Esto afectará a todos los dispositivos)")) {
      const { error } = await supabase
        .from('pos_config')
        .update({ value: { last_number: 0 } })
        .eq('key', 'ticket_sequence');
      
      if (error) {
        alert("Error al reiniciar: " + error.message);
      } else {
        fetchTicketSeq();
        alert("Numeración reiniciada. El próximo ticket será el #0001.");
      }
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    console.log('🔄 TPV: Fetching fresh menu_items from Supabase...');
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ TPV Fetch error:', error);
        throw error;
      }
      
      const mapped = (data || []).map(r => ({
        ...r,
        price: r.price || 0,
        image_url: r.image_url,
        quantity_multiplier: r.quantity_multiplier || 1
      }));

      console.log(`✅ TPV: Fetched ${mapped.length} active menu_items.`);
      console.log('📦 TPV: Productos cargados:', mapped);
      setProducts(mapped);
    } catch (err) {
      console.error('❌ TPV Fetch error (Check RLS Policies):', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Watch menu_items for any changes (e.g. changing category or price)
    const channel = supabase.channel('pos-menu-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        fetchProducts(); // Re-fetch from network
      })
      .subscribe();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('bachan_tpv_settings', JSON.stringify(viewSettings));
  }, [viewSettings]);

  useEffect(() => {
    localStorage.setItem('bachan_tpv_cart', JSON.stringify(cart));
  }, [cart]);

  // 2. PRODUCT REORDERING (Modo Edición)
  const moveProduct = async (id, direction) => {
    const visibleProducts = products.filter(p => String(p.menu_category_id) === String(activeCategory));

    const index = visibleProducts.findIndex(p => p.id === id);
    if (index === -1) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= visibleProducts.length) return;

    const newProducts = [...products];
    const itemA = visibleProducts[index];
    const itemB = visibleProducts[newIndex];

    // Swap sort_order values
    const tempSort = itemA.sort_order || 0;
    const targetSort = itemB.sort_order || 0;
    
    // Ensure they aren't the same if they were both 0
    const finalSortA = targetSort;
    const finalSortB = tempSort === targetSort ? tempSort + direction : tempSort;

    const idxA = products.findIndex(p => p.id === itemA.id);
    const idxB = products.findIndex(p => p.id === itemB.id);

    newProducts[idxA] = { ...itemA, sort_order: finalSortA };
    newProducts[idxB] = { ...itemB, sort_order: finalSortB };

    const sorted = newProducts.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    setProducts(sorted);
    
    // Background sync to Supabase (ONLY menu_items now)
    await supabase.from('menu_items').update({ sort_order: finalSortA }).eq('id', itemA.id);
    await supabase.from('menu_items').update({ sort_order: finalSortB }).eq('id', itemB.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    // 1. Get visible products for the category
    const visibleProducts = products.filter(p => String(p.menu_category_id) === String(activeCategory));

    // 2. Build the 16-slot grid
    const gridItems = Array(16).fill(null);
    const unplaced = [];
    visibleProducts.forEach(p => {
       const order = p.sort_order;
       if (order >= 0 && order < 16 && !gridItems[order]) {
          gridItems[order] = p;
       } else {
          unplaced.push(p);
       }
    });
    unplaced.forEach(p => {
       const firstEmpty = gridItems.findIndex(x => x === null);
       if (firstEmpty !== -1) gridItems[firstEmpty] = p;
    });
    const finalGrid = gridItems.map((item, index) => {
       return item || { id: `empty-${index}`, isEmpty: true, sort_order: index };
    });

    // 3. Find indices
    const oldIndex = finalGrid.findIndex(p => p.id === active.id);
    const newIndex = finalGrid.findIndex(p => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // 4. Move
    const reorderedGrid = arrayMove(finalGrid, oldIndex, newIndex);
    
    const newProducts = [...products];
    const updates = [];
    
    // 5. Update sort_order for all real products in this grid
    reorderedGrid.forEach((p, idx) => {
       if (!p.isEmpty) {
          const prodIndex = newProducts.findIndex(x => x.id === p.id);
          if (prodIndex !== -1 && newProducts[prodIndex].sort_order !== idx) {
             newProducts[prodIndex] = { ...p, sort_order: idx };
             updates.push({ id: p.id, sort_order: idx });
          }
       }
    });

    if (updates.length > 0) {
      const sorted = newProducts.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setProducts(sorted);

      for (const u of updates) {
         supabase.from('menu_items').update({ sort_order: u.sort_order }).eq('id', u.id).then();
      }
    }
  };

  const sensors = useSensors(
    useSensor(SmartMouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(SmartTouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 3. CART LOGIC
  const addToCart = (product, modifier = null) => {
    // Si el producto tiene modificadores y no se ha seleccionado uno todavía, abrimos el modal
    if (product.modifiers && product.modifiers.length > 0 && !modifier) {
      setPendingModifierProduct(product);
      return;
    }

    const qtyToAdd = entryQuantity === '' ? 1 : Number(entryQuantity);
    const itemId = modifier ? `${product.id}-${modifier}` : product.id;
    const itemName = modifier ? `${product.name} (${modifier})` : product.name;

    setCart(prev => {
      const existing = prev.find(i => i.cartId === itemId);
      let nextCart;
      if (existing) {
        nextCart = prev.map(i => i.cartId === itemId ? { ...i, quantity: i.quantity + qtyToAdd } : i);
      } else {
        nextCart = [...prev, { 
          ...product, 
          cartId: itemId,
          name: itemName,
          modifier,
          quantity: qtyToAdd, 
          quantity_multiplier: product.quantity_multiplier || 1,
          price: product.price || product.sale_price || 0,
          cost: Number(product.cost || 0)
        }];
      }
      return nextCart;
    });
    setEntryQuantity('');
    setPendingModifierProduct(null);
  };

  const updateQuantity = (cartId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(i => i.quantity > 0));
  };

  const fetchOpenOrders = async (silent = false) => {
    if (!silent) setIsProcessing(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOpenOrdersList(data || []);
      return data;
    } catch (err) {
      console.error("Error cargando cuentas abiertas:", err);
      if (!silent) alert("Error cargando cuentas abiertas: " + err.message);
    } finally {
      if (!silent) setIsProcessing(false);
    }
  };

  const handleOpenOrdersClick = async () => {
    await fetchOpenOrders();
    setShowOpenOrders(true);
  };

  const loadOpenOrder = (order) => {
    setCart(order.items || []);
    setCustomerName(order.customer_name || '');
    setTableId(order.table_id || 'Delivery');
    setDiscountValue(Number(order.discount_amount_input || 0));
    setDiscountType(order.discount_type || 'percent');
    setActiveOrderId(order.id);
    setShowOpenOrders(false);
  };

  const handleDeleteOrder = async (e, orderId) => {
    e.stopPropagation();
    if (!window.confirm("¿Seguro que quieres borrar este pedido pendiente?")) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
      await fetchOpenOrders(true);
    } catch (err) {
      alert("Error borrando pedido: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = Number(cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * item.quantity), 0));
  const calculatedDiscount = discountType === 'percent' 
    ? Number(subtotal * (Number(discountValue) / 100)) 
    : Number(discountValue);
  const cartTotal = Math.max(0, subtotal - calculatedDiscount);

  const handleSaveOrder = async (action, method = null) => {
    try {
      // 1. Definición clara de la intención (Marchar vs Cobrar)
      const isCharge = action === 'charge';
      console.log(`--- Iniciando ${isCharge ? 'COBRO' : 'MARCHA'} ---`, { cartTotal, isCharge, method });
      
      const finalCustomerName = customerName.trim() || 'Cliente Delivery';
      
      if (cartTotal <= 0) {
        console.warn('⚠️ Carrito vacío');
        if (action === 'march') return; // En marcha bloqueamos si está vacío
      }

      setIsProcessing(true);
    
      let ticketNumber = '';
      let originalCreatedAt = new Date().toISOString();
      const year = new Date().getFullYear();
      
      if (activeOrderId) {
        // Reuse existing ticket number for open orders
        const existing = openOrdersList.find(o => o.id === activeOrderId);
        ticketNumber = existing?.ticket_number || `T-${year}-OPEN`;
        if (existing?.created_at) originalCreatedAt = existing.created_at;
      } else {
        // ATOMIC SYNC: Fetch next sequence from Supabase RPC
        console.log('🔄 TPV: Requesting next ticket sequence from Supabase...');
        const { data: nextSeq, error: seqError } = await supabase.rpc('increment_ticket_sequence');
        
        if (seqError) {
          console.error('❌ TPV: Error fetching sequence:', seqError);
          // Fallback minimal safe numbering if RPC fails (should not happen in production)
          ticketNumber = `T-${year}-ERR-${Date.now().toString().slice(-4)}`;
        } else {
          ticketNumber = `T-${year}-${String(nextSeq).padStart(4, '0')}`;
          console.log(`✅ TPV: Atomic Ticket Sequence assigned: ${ticketNumber}`);
        }
      }
      
      // 3. Preparación de datos para Supabase
      const orderData = {
        customer_name: finalCustomerName,
        table_id: tableId,
        ticket_number: ticketNumber,
        total: cartTotal,
        tax_amount: cartTotal - (cartTotal / 1.10), // IVA 10% incluido en el total
        discount_amount: calculatedDiscount,
        discount_amount_input: discountValue,
        discount_type: discountType,
        sold_at: isCharge ? new Date().toISOString() : null,
        created_at: originalCreatedAt,
        items: cart.map(i => ({ 
          id: i.id, 
          name: i.name, 
          quantity: i.quantity, 
          price: i.price,
          cost: Number(i.cost || 0),
          modifier: i.modifier,
          recipe_id: i.recipe_id,
          ingredient_id: i.ingredient_id,
          quantity_multiplier: i.quantity_multiplier || 1
        })),
        status: action === 'charge' ? 'completed' : 'pending', 
        payment_method: action === 'charge' ? method : null
      };

      let error;
      if (activeOrderId) {
        const res = await supabase.from('orders').update(orderData).eq('id', activeOrderId);
        error = res.error;
      } else {
        const res = await supabase.from('orders').insert([orderData]);
        error = res.error;
      }
      
      if (error) throw error;
      
      // Refresh list in background
      fetchOpenOrders(true);

      if (action === 'charge') {
        await deductStockForOrder(orderData);
        setSaleSuccess(true);
        fetchTicketSeq(); // REFRESH SEQUENCE PREVIEW
        setTimeout(() => {
          setSaleSuccess(false);
          setShowCheckout(false);
          setCart([]);
          setCustomerName('');
          setActiveOrderId(null);
        }, 1500);
      } else {
        setCart([]);
        setCustomerName('');
        setTableId('Delivery'); // Reset to Delivery
        setDiscountValue(0);
        setDiscountType('percent');
        setActiveOrderId(null);
        fetchTicketSeq(); // REFRESH SEQUENCE PREVIEW
      }
    } catch (err) {
      console.error('❌ ERROR CRÍTICO EN handleSaveOrder:', err);
      alert(`ERROR CRÍTICO: ${err.message}\nRevisa la consola para más detalles.`);
    } finally {
      setIsProcessing(false);
      console.log('--- Fin del proceso de guardado ---');
    }
  };

  // 4. FILTERS & GRID
  useEffect(() => {
    console.log('🎯 TPV: Categoría activa seleccionada:', activeCategory);
    console.log('📊 TPV: Total productos en memoria:', products.length);
  }, [activeCategory, products]);

  const filteredProducts = products.filter(p => String(p.menu_category_id) === String(activeCategory));

  const gridItems = Array(16).fill(null);
  const unplaced = [];
  filteredProducts.forEach(p => {
     const order = p.sort_order;
     if (order >= 0 && order < 16 && !gridItems[order]) {
        gridItems[order] = p;
     } else {
        unplaced.push(p);
     }
  });
  unplaced.forEach(p => {
     const firstEmpty = gridItems.findIndex(x => x === null);
     if (firstEmpty !== -1) gridItems[firstEmpty] = p;
  });
  const finalGrid = gridItems.map((item, index) => {
    return item || { id: `empty-${index}`, isEmpty: true, sort_order: index };
  });

  return (
    <div className="pos-app">
      
      {/* 1. SECCIÓN IZQUIERDA: CATÁLOGO */}
      <div className="pos-catalog-container">
        
        {/* HEADER / CATEGORÍAS */}
        <header className="pos-header">
          <div className="pos-header-top">
             <div className="pos-logo-wrapper">
                <ShoppingBag size={24} className="pos-logo-accent" />
                <h1 className="pos-logo-text">BaChan <span className="pos-logo-accent">POS</span></h1>
             </div>
             <div className="pos-header-actions">
                <button onClick={() => fetchProducts()} className="pos-icon-btn"><RefreshCw size={20} className={loading ? 'animate-spin' : ''}/></button>
                <button onClick={() => setShowSettings(true)} className="pos-icon-btn"><Settings size={20}/></button>
                <button onClick={() => window.location.href='/dashboard'} className="btn-dashboard">
                   <LayoutGrid size={18}/>
                   <span>Inicio</span>
                </button>
             </div>
          </div>
          <nav className="pos-category-nav">
             <div className="pos-category-tabs">
               {categories.filter(c => c.is_active).map(cat => (
                 <button
                   key={cat.id}
                   onClick={() => setActiveCategory(cat.id)}
                   className={`pos-category-tab ${activeCategory === cat.id ? 'active' : ''}`}
                 >
                    {cat.name}
                 </button>
               ))}
             </div>
             <button 
               onClick={handleOpenOrdersClick} 
               className={`pos-open-orders-btn ${openOrdersList.length > 0 ? 'has-orders' : ''}`}
             >
                <LayoutGrid size={16}/>
                <span className="pos-label" style={{ color: 'inherit', marginBottom: 0 }}>Cuentas Abiertas</span>
                {openOrdersList.length > 0 && <div className="pos-order-count-badge">{openOrdersList.length}</div>}
             </button>
          </nav>
        </header>

        {/* GRID DE PRODUCTOS */}
        <main className="pos-grid-main">
           {loading ? (
             <div className="pos-cart-empty"><RefreshCw size={48} className="animate-spin mb-4"/><p className="pos-label">Sincronizando...</p></div>
           ) : filteredProducts.length === 0 ? (
             <div className="pos-cart-empty"><Search size={80} className="mb-4"/><p className="pos-modal-subtitle">Selecciona otra categoría</p></div>
           ) : (
             <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={finalGrid.map(p => p.id)} strategy={rectSortingStrategy}>
                   <div className="pos-grid">
                      {finalGrid.map(p => (
                        <SortableProduct key={p.id} id={p.id}>
                          {p.isEmpty ? (
                            <div className="pos-card-empty" />
                          ) : (
                            <div className="pos-card">
                               {/* Foto del Producto */}
                               {p.image_url ? (
                                  <img 
                                     src={p.image_url}
                                     alt={p.name}
                                     className="pos-card-img"
                                  />
                               ) : (
                                  <div className="pos-card-placeholder">
                                    {p.name.split(' ').slice(0,2).join('\n')}
                                  </div>
                               )}

                               {/* Overlay de Info */}
                               <div className="pos-card-overlay">
                                  <div className="pos-card-name">{p.name}</div>
                                  <div className="pos-card-price">{(Number(p.price) || 0).toFixed(2)}€</div>
                               </div>

                               {/* Botón Añadir */}
                               <button 
                                  onClick={(e) => { 
                                     e.stopPropagation(); 
                                     e.preventDefault(); 
                                     addToCart(p); 
                                  }}
                                  className="pos-card-add-btn"
                               >
                                  <Plus size={20} strokeWidth={3} />
                               </button>
                            </div>
                          )}
                        </SortableProduct>
                      ))}
                   </div>
                </SortableContext>
             </DndContext>
           )}
        </main>
      </div>

      {/* 2. SECCIÓN DERECHA: TICKET (ESCRITORIO) / MODAL (MÓVIL) */}
      <aside className={`pos-sidebar ${showMobileCart ? 'mobile-visible' : ''}`}>
         {/* Botón Cerrar (Solo visible en Móvil) */}
         <button 
           onClick={() => setShowMobileCart(false)} 
           className="pos-modal-close mobile-only-block"
           style={{ display: 'none', position: 'absolute', top: '24px', right: '24px', zIndex: 100 }}
         >
           <X size={32}/>
         </button>

         <header className="pos-sidebar-header">
             <div>
                <h2 className="pos-ticket-title">Venta Actual</h2>
                <div className="pos-ticket-number">Ticket #{String(ticketSeq + 1).padStart(4, '0')}</div>
             </div>
            <button onClick={() => setCart([])} className="pos-icon-btn" style={{ color: '#ef4444' }}><Trash2 size={24}/></button>
         </header>

         {/* INPUTS CLIENTE/MESA */}
         <div className="pos-sidebar-inputs">
            <div className="pos-input-group">
               <label className="pos-label">Mesa / Zona</label>
               <select value={tableId} onChange={(e) => setTableId(e.target.value)} className="pos-select">
                  <option value="Barra">Barra</option>
                  <option value="Mesa 1">Mesa 1</option>
                  <option value="Mesa 2">Mesa 2</option>
                  <option value="Mesa 3">Mesa 3</option>
                  <option value="Terraza 1">Terraza 1</option>
                  <option value="Para Llevar">Para Llevar</option>
                  <option value="Delivery">Delivery</option>
               </select>
            </div>
            <div className="pos-input-group" style={{ flex: 2 }}>
               <label className="pos-label">Nombre Cliente</label>
               <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Opcional..." className="pos-input" />
            </div>
         </div>

         {/* LISTA DE ITEMS */}
         <div className="pos-cart-list">
            {cart.length === 0 ? (
              <div className="pos-cart-empty">
                 <ShoppingBag size={48} className="mb-4" />
                 <p className="pos-label">Ticket Vacío</p>
              </div>
            ) : cart.map(item => (
              <div key={item.cartId} className="pos-cart-item">
                 <div className="pos-item-info">
                    <div className="pos-item-name">{item.name}</div>
                    <div className="pos-item-price">Unit: {(item.price).toFixed(2)}€</div>
                 </div>
                 <div className="pos-qty-control">
                    <button onClick={() => updateQuantity(item.cartId, -1)} className="pos-qty-btn"><Minus size={14}/></button>
                    <span className="pos-qty-num">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cartId, 1)} className="pos-qty-btn pos-qty-btn-dark"><Plus size={14}/></button>
                 </div>
                 <div className="pos-item-total">{(item.price * item.quantity).toFixed(2)}€</div>
              </div>
            ))}
         </div>

         {/* RESUMEN Y ACCIONES */}
         <footer className="pos-sidebar-footer">
            
            {/* BOTÓN DESCUENTO */}
            <button 
              onClick={() => setShowDiscountModal(true)} 
              className={`pos-discount-btn ${discountValue > 0 ? 'active' : ''}`}
            >
               <Sparkles size={16}/>
               <span>{discountValue > 0 ? `Descuento: ${discountValue}${discountType === 'percent' ? '%' : '€'}` : 'Aplicar Descuento'}</span>
            </button>

            <div className="pos-summary-row"><span>Subtotal</span><span>{(subtotal).toFixed(2)}€</span></div>
            
            {discountValue > 0 && (
               <div className="pos-discount-summary">
                  <span>Descuento ({discountValue}{discountType === 'percent' ? '%' : '€'})</span>
                  <span>-{calculatedDiscount.toFixed(2)}€</span>
               </div>
            )}

            <div className="pos-summary-row"><span>IVA (10%)</span><span>{(cartTotal - (cartTotal / 1.10)).toFixed(2)}€</span></div>
            <div className="pos-summary-total">
               <span className="pos-total-label">TOTAL</span>
               <span className="pos-total-amount">{cartTotal.toFixed(2)}€</span>
            </div>
            
            <div className="pos-actions">
               <button disabled={cartTotal <= 0 || isProcessing} onClick={() => handleSaveOrder('march')} className="pos-btn pos-btn-marchar">
                 {isProcessing ? <RefreshCw className="animate-spin" size={16}/> : <><Utensils size={16}/><span>Marchar</span></>}
               </button>
               <button disabled={cartTotal <= 0 || isProcessing} onClick={() => { console.log('--- Iniciando Checkout ---'); setShowCheckout(true); setShowMobileCart(false); }} className="pos-btn pos-btn-cobrar">
                 {isProcessing ? <RefreshCw className="animate-spin" size={16}/> : <><CreditCard size={16}/><span>Cobrar</span></>}
               </button>
            </div>
         </footer>
      </aside>

      {/* BOTÓN FLOTANTE CARRITO (MÓVIL) */}
      <button 
        className={`pos-floating-cart-btn ${cart.length > 0 ? 'has-items' : ''}`}
        onClick={() => setShowMobileCart(true)}
      >
        <ShoppingBag size={28} />
        {cart.length > 0 && (
          <div className="pos-cart-badge">
            {cart.reduce((sum, item) => sum + item.quantity, 0)}
          </div>
        )}
      </button>

      {/* 3. MODALES */}
      
      {/* CHECKOUT MODAL */}
      {showCheckout && (
         <div className="pos-modal-overlay">
            <div className="pos-modal-content">
               {saleSuccess ? (
                 <div className="pos-success-body">
                    <div className="pos-success-icon"><CheckCircle2 size={56}/></div>
                    <h2 className="pos-modal-title">¡LISTO!</h2>
                    <p className="pos-modal-subtitle">Venta registrada</p>
                 </div>
               ) : (
                 <div className="pos-modal-body">
                    <button onClick={() => setShowCheckout(false)} className="pos-modal-close"><X size={32}/></button>
                    
                    {/* TOTAL DESTACADO AL INICIO */}
                    <div style={{ textAlign: 'center', marginBottom: '40px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '24px' }}>
                       <div className="pos-label" style={{ marginBottom: '8px' }}>Total a Pagar</div>
                       <div style={{ fontSize: '5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.05em', lineHeight: 1 }}>{cartTotal.toFixed(2)}€</div>
                    </div>

                    <h2 className="pos-modal-title" style={{ fontSize: '1.5rem', textAlign: 'center' }}>Cierre de Ticket</h2>
                    <p className="pos-modal-subtitle" style={{ textAlign: 'center', marginBottom: '32px' }}>{customerName || 'Cliente General'}</p>
                    
                    <div className="pos-payment-grid">
                       <button onClick={() => handleSaveOrder('charge', 'cash')} disabled={isProcessing} className="pos-payment-btn cash"><Banknote size={40}/> Efectivo</button>
                       <button onClick={() => handleSaveOrder('charge', 'card')} disabled={isProcessing} className="pos-payment-btn card"><CreditCard size={40}/> Tarjeta</button>
                       <button onClick={() => handleSaveOrder('charge', 'bizum')} disabled={isProcessing} className="pos-payment-btn bizum"><Coffee size={40}/> Bizum</button>
                    </div>

                    {/* BOTÓN VOLVER (NUEVO v2.0.9) */}
                    <button 
                      onClick={() => setShowCheckout(false)} 
                      className="pos-btn-back-checkout"
                    >
                       <ArrowLeft size={24} />
                       <span>Volver al Carrito</span>
                    </button>
                 </div>
               )}
            </div>
         </div>
      )}

      {/* CUENTAS ABIERTAS MODAL */}
      {showOpenOrders && (
         <div className="pos-modal-overlay">
            <div className="pos-modal-content" style={{ maxWidth: '900px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
               <div className="pos-modal-body" style={{ flex: 1, overflowY: 'auto' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                       <h2 className="pos-modal-title">Cuentas Abiertas</h2>
                       <p className="pos-modal-subtitle">Comandas pendientes</p>
                    </div>
                    <button onClick={() => setShowOpenOrders(false)} className="pos-modal-close"><X size={32}/></button>
                 </div>
                 
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {openOrdersList.map(order => (
                       <div key={order.id} onClick={() => loadOpenOrder(order)} className="pos-open-order-card" style={{ cursor: 'pointer' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                             <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase', lineHeight: 1 }}>{order.customer_name}</div>
                                <div className="pos-badge" style={{ marginTop: '8px', display: 'inline-block' }}>EN COCINA</div>
                             </div>
                             <button onClick={(e) => handleDeleteOrder(e, order.id)} className="pos-btn-delete-order">
                                <Trash2 size={20} />
                             </button>
                          </div>
                          <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>
                             {order.table_id} • Pedido #{order.ticket_number?.split('-').pop()}
                          </div>
                          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: 'auto' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Total</span>
                                <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#2563eb' }}>{(Number(order.total) || 0).toFixed(2)}€</span>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
               </div>
            </div>
         </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
         <div className="pos-modal-overlay">
            <div className="pos-modal-content" style={{ maxWidth: '450px' }}>
               <div className="pos-modal-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                     <h2 className="pos-modal-title" style={{ fontSize: '1.5rem' }}>Ajustes TPV</h2>
                     <button onClick={() => setShowSettings(false)} className="pos-modal-close" style={{ position: 'static' }}><X size={24}/></button>
                  </div>
                  
                  <div className="pos-settings-group">
                     <label className="pos-label">Columnas del Grid</label>
                     <div className="pos-settings-grid">
                        {[3,4,5,6].map(n => (
                           <button 
                             key={n} 
                             onClick={() => setViewSettings({...viewSettings, columns: n})}
                             className={`pos-btn ${viewSettings.columns === n ? 'pos-btn-cobrar' : 'pos-btn-marchar'}`}
                             style={{ padding: '12px' }}
                           >
                              {n}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="pos-settings-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <label className="pos-label">Mostrar Fotos</label>
                     <button 
                       onClick={() => setViewSettings({...viewSettings, showPhotos: !viewSettings.showPhotos})}
                       className={`pos-toggle-btn ${viewSettings.showPhotos ? 'active' : ''}`}
                     >
                        <div className="pos-toggle-thumb" />
                     </button>
                  </div>

                  <div className="pos-settings-group">
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <label className="pos-label">Tamaño Fuente</label>
                        <span className="pos-label" style={{ color: '#0f172a' }}>{viewSettings.fontSize}px</span>
                     </div>
                     <input 
                       type="range" min="12" max="24" 
                       value={viewSettings.fontSize} 
                       onChange={(e) => setViewSettings({...viewSettings, fontSize: Number(e.target.value)})} 
                       className="pos-range"
                     />
                  </div>

                  <button 
                    onClick={() => setViewSettings({...viewSettings, isEditMode: !viewSettings.isEditMode})}
                    className="pos-btn" 
                    style={{ width: '100%', padding: '20px', background: viewSettings.isEditMode ? '#10b981' : '#f59e0b', color: 'white', marginBottom: '12px' }}
                  >
                     {viewSettings.isEditMode ? 'Guardar Cambios' : 'Modo Reordenar'}
                  </button>

                  <button 
                    onClick={resetTicketCounter}
                    className="pos-btn" 
                    style={{ width: '100%', padding: '16px', background: '#f8fafc', color: '#ef4444', border: '1px solid #fee2e2' }}
                  >
                     Reiniciar Contador de Tickets
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* MODIFIERS MODAL */}
      {pendingModifierProduct && (
         <div className="pos-modal-overlay">
            <div className="pos-modal-content" style={{ maxWidth: '500px' }}>
               <div className="pos-modal-body">
                  <h2 className="pos-modal-title" style={{ fontSize: '1.8rem' }}>{pendingModifierProduct.name}</h2>
                  <p className="pos-modal-subtitle">Opciones requeridas</p>
                  
                  <div className="pos-modifier-list">
                     {pendingModifierProduct.modifiers?.map(mod => (
                        <button 
                          key={mod} 
                          onClick={() => addToCart(pendingModifierProduct, mod)}
                          className="pos-modifier-btn"
                        >
                           <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>{mod}</span>
                           <ChevronRight size={20} />
                        </button>
                     ))}
                  </div>
                  
                  <button 
                    onClick={() => setPendingModifierProduct(null)}
                    className="pos-btn pos-btn-marchar" 
                    style={{ width: '100%', marginTop: '24px', padding: '16px' }}
                  >
                     Cancelar
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* DISCOUNT MODAL */}
      {showDiscountModal && (
        <DiscountModal 
          value={discountValue}
          type={discountType}
          onValueChange={setDiscountValue}
          onTypeChange={setDiscountType}
          onClose={() => setShowDiscountModal(false)}
          onApply={() => setShowDiscountModal(false)}
        />
      )}

    </div>
  );
}

// MODAL DE DESCUENTO
function DiscountModal({ value, type, onValueChange, onTypeChange, onClose, onApply }) {
  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal-content" style={{ maxWidth: '400px' }}>
        <div className="pos-modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 className="pos-modal-title" style={{ fontSize: '1.5rem' }}>Descuento</h2>
            <button onClick={onClose} className="pos-modal-close" style={{ position: 'static' }}><X size={24}/></button>
          </div>

          <div className="pos-type-selector">
            <button onClick={() => onTypeChange('percent')} className={`pos-type-btn ${type === 'percent' ? 'active' : ''}`}>%</button>
            <button onClick={() => onTypeChange('fixed')} className={`pos-type-btn ${type === 'fixed' ? 'active' : ''}`}>€</button>
          </div>

          <div style={{ position: 'relative', marginBottom: '32px' }}>
            <input 
              type="number" 
              value={value || ''} 
              onChange={(e) => onValueChange(Number(e.target.value))}
              className="pos-input" 
              style={{ fontSize: '3rem', height: '100px', textAlign: 'center', paddingRight: '40px' }}
              placeholder="0"
              autoFocus
            />
            <span style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', fontSize: '2rem', fontWeight: 900, color: '#64748b' }}>
              {type === 'percent' ? '%' : '€'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button onClick={() => onValueChange(0)} className="pos-btn pos-btn-marchar">Limpiar</button>
            <button onClick={onApply} className="pos-btn pos-btn-cobrar">Aplicar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
