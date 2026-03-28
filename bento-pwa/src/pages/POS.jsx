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
  ChevronDown
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
      setActiveCategory(categories[0].id);
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

  const [showSettings, setShowSettings] = useState(false);
  const [showMobileTicket, setShowMobileTicket] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState(false);
  const [pendingModifierProduct, setPendingModifierProduct] = useState(null);
  const [entryQuantity, setEntryQuantity] = useState('');

  // 1. DATA FETCHING & SYNC
  const fetchProducts = async (force = false) => {
    setLoading(true);
    try {
      if (force) localStorage.removeItem('bachan_recipes');

      const cached = localStorage.getItem('bachan_recipes');
      if (cached && !force) {
        setProducts(JSON.parse(cached));
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      const mapped = (data || []).map(r => ({
        ...r,
        price: r.sale_price || 0,
        image_url: r.image_url // Removed transformations to restore visibility
      }));

      setProducts(mapped);
      localStorage.setItem('bachan_recipes', JSON.stringify(mapped));
    } catch (err) {
      console.error('Fetch error:', err);
      const cached = localStorage.getItem('bachan_recipes');
      if (cached) setProducts(JSON.parse(cached));
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
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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
    const visibleProducts = products.filter(p => p.menu_category_id === activeCategory);

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
    localStorage.setItem('bachan_recipes', JSON.stringify(sorted));
    
    // Background sync to Supabase
    await supabase.from('recipes').update({ sort_order: finalSortA }).eq('id', itemA.id);
    await supabase.from('recipes').update({ sort_order: finalSortB }).eq('id', itemB.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    // 1. Get visible products for the category
    const visibleProducts = products.filter(p => p.menu_category_id === activeCategory);

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
      localStorage.setItem('bachan_recipes', JSON.stringify(sorted));

      for (const u of updates) {
         supabase.from('recipes').update({ sort_order: u.sort_order }).eq('id', u.id).then();
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
    // The previous modifier logic intercepted bentos with modifiers but the modal was non-existent, 
    // causing clicks to fail silently. Direct pass-through restored.
    const qtyToAdd = entryQuantity === '' ? 1 : Number(entryQuantity);
    const itemId = modifier ? `${product.id}-${modifier}` : product.id;
    const itemName = modifier ? `${product.name} (${modifier})` : product.name;

    setCart(prev => {
      const existing = prev.find(i => i.cartId === itemId);
      if (existing) {
        return prev.map(i => i.cartId === itemId ? { ...i, quantity: i.quantity + qtyToAdd } : i);
      }
      return [...prev, { 
        ...product, 
        cartId: itemId,
        name: itemName,
        modifier,
        quantity: qtyToAdd, 
        price: product.price || product.sale_price || 0 
      }];
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

  const cartTotal = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * item.quantity), 0);

  const handleCheckout = async (method) => {
    if (cartTotal <= 0) return;
    setIsProcessing(true);
    
    const year = new Date().getFullYear();
    let lastNum = Number(localStorage.getItem('bachan_pos_ticket_seq') || 0);
    // User requested absolute reset to 1
    if (lastNum >= 1000) lastNum = 0; 
    const nextNum = lastNum + 1;
    const ticketNumber = `T-${year}-${String(nextNum).padStart(4, '0')}`;
    
    const orderData = {
      customer_name: 'Venta TPV',
      ticket_number: ticketNumber,
      total: cartTotal,
      tax_amount: cartTotal * 0.10,
      items: cart.map(i => ({ 
        id: i.id, 
        name: i.name, 
        quantity: i.quantity, 
        price: i.price,
        modifier: i.modifier 
      })),
      status: 'delivered', 
      payment_method: method
    };

    try {
      const { error } = await supabase.from('orders').insert([orderData]);
      if (error) throw error;
      
      localStorage.setItem('bachan_pos_ticket_seq', nextNum);
      await deductStockForOrder(orderData);

      setSaleSuccess(true);
      setCart([]);
      setTimeout(() => {
        setSaleSuccess(false);
        setShowCheckout(false);
      }, 1500);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. FILTERS & GRID
  const filteredProducts = products.filter(p => p.menu_category_id === activeCategory);

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
    <div className="pos-app font-sans text-slate-900 bg-slate-50" style={{ display: 'flex', flexDirection: 'row', height: '100vh', overflow: 'hidden', width: '100%' }}>
      
      {/* 1. LEFT SIDE: CATALOG (70%) */}
      <div className="flex flex-col bg-white border-r border-slate-200" style={{ width: '70%', height: '100%', flex: '0 0 70%', overflow: 'hidden' }}>
        
        {/* TOP BAR / CATEGORIES */}
        <header className="h-20 flex flex-col border-b border-slate-100 shadow-sm relative z-20 bg-white">
          <div className="flex-1 flex items-center justify-between px-6">
             <div className="flex items-center gap-3">
                <ShoppingBag size={24} className="text-blue-600" />
                <h1 className="font-black text-xl tracking-tighter uppercase italic">BaChan <span className="text-blue-600">POS</span></h1>
             </div>
             <div className="flex items-center gap-2">
                <button onClick={() => fetchProducts(true)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><RefreshCw size={20} className={loading ? 'animate-spin' : ''}/></button>
                <button onClick={() => setShowSettings(true)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><Settings size={20}/></button>
                <button onClick={() => window.location.href='/dashboard'} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><LayoutGrid size={20}/></button>
             </div>
          </div>
          <nav className="h-12 flex px-4 gap-1 bg-slate-50 border-t border-slate-100">
             {categories.filter(c => c.is_active).map(cat => (
               <button
                 key={cat.id}
                 onClick={() => setActiveCategory(cat.id)}
                 className={`px-6 h-full font-black text-[10px] uppercase tracking-widest transition-all border-b-4 ${activeCategory === cat.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
               >
                  {cat.name}
               </button>
             ))}
          </nav>
        </header>

        {/* PRODUCT GRID SECTION */}
        <main className="flex-1 overflow-y-auto bg-slate-50" style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
           {loading ? (
             <div className="h-full flex flex-col items-center justify-center opacity-30 italic"><RefreshCw size={48} className="animate-spin mb-4"/><p className="font-black uppercase tracking-widest text-xs">Sincronizando...</p></div>
           ) : filteredProducts.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center opacity-10 italic"><Search size={80} className="mb-4"/><p className="text-xl">Selecciona otra categoría</p></div>
           ) : (
             <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={finalGrid.map(p => p.id)} strategy={rectSortingStrategy}>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(4, 1fr)', gap: '10px', width: '100%', height: '100%', minHeight: '600px' }}>
                      {finalGrid.map(p => (
                        <SortableProduct key={p.id} id={p.id}>
                          {p.isEmpty ? (
                            <div style={{ aspectRatio: '1/1', border: '2px dashed #cbd5e1', borderRadius: '12px', opacity: 0.5 }} />
                          ) : (
                            <div 
                               className="group relative overflow-hidden rounded-lg shadow-sm border border-slate-200 cursor-pointer text-left bg-slate-100"
                               style={{ aspectRatio: '1/1', width: '100%', height: '100%', position: 'relative', zIndex: 10 }}
                            >
                               {/* Product Photo */}
                               {p.image_url ? (
                                  <img 
                                     src={p.image_url}
                                     alt={p.name}
                                     className="pointer-events-none"
                                     style={{ 
                                       width: '100%', 
                                       height: '100%', 
                                       objectFit: 'cover', 
                                       position: 'absolute', 
                                       top: 0, 
                                       left: 0,
                                       zIndex: 0,
                                       backgroundColor: '#f8fafc',
                                       pointerEvents: 'none'
                                     }}
                                  />
                               ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontWeight: '900', fontSize: '12px', color: '#cbd5e1', padding: '8px', textTransform: 'uppercase', position: 'absolute', top: 0, left: 0, zIndex: 0 }} className="pointer-events-none">
                                    {p.name.split(' ').slice(0,2).join('\n')}
                                  </div>
                               )}

                               {/* Name Overlay */}
                               <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10, pointerEvents: 'none' }} className="pointer-events-none">
                                  <div style={{ color: 'white', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', lineHeight: '1.2', pointerEvents: 'none' }} className="pointer-events-none">
                                     {p.name}
                                  </div>
                                  <div style={{ color: '#60a5fa', fontWeight: '900', fontSize: '12px', marginTop: '2px', pointerEvents: 'none' }} className="pointer-events-none">{(Number(p.price) || 0).toFixed(2)}€</div>
                               </div>

                               {/* ADD BUTTON */}
                               <button 
                                  onClick={(e) => { 
                                     e.stopPropagation(); 
                                     e.preventDefault(); 
                                     console.log('Botón pulsado en: ' + p.name); 
                                     addToCart(p); 
                                  }}
                                  className="absolute w-10 h-10 bg-blue-600 hover:bg-blue-700 active:scale-90 text-white rounded-full flex items-center justify-center shadow-lg transition-transform cursor-pointer"
                                  style={{ zIndex: 9999, touchAction: 'manipulation', top: '4px', right: '4px', position: 'absolute', pointerEvents: 'auto' }}
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

      {/* 2. RIGHT SIDE: TICKET (30% FIJO) */}
      <aside className="bg-slate-50 shadow-inner z-30" style={{ width: '30%', height: '100%', flex: '0 0 30%', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e2e8f0' }}>
         <header className="h-20 px-6 flex items-center justify-between border-b border-slate-200 bg-white" style={{ flexShrink: 0 }}>
            <div className="flex flex-col">
               <h2 className="text-xl font-black tracking-tighter uppercase leading-none text-slate-800">Venta Actual</h2>
               <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Ticket #{String(Number(localStorage.getItem('bachan_pos_ticket_seq') || 0) + 1).padStart(4, '0')}</span>
            </div>
            <button onClick={() => setCart([])} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={24}/></button>
         </header>

         {/* Items List */}
         <div className="flex-1 overflow-y-auto space-y-2" style={{ padding: '24px' }}>
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 italic opacity-50 px-8 text-center">
                 <ShoppingBag size={48} className="mb-4 text-slate-200" />
                 <p className="font-black uppercase tracking-widest text-[10px]">Esperando productos...</p>
                 <p className="text-[10px] mt-2">Haz clic en un Bento para sumarlo al ticket</p>
              </div>
            ) : cart.map(item => (
              <div key={item.cartId} className="bg-white border border-slate-100 rounded-lg p-3 flex justify-between items-center group shadow-sm transition-all hover:border-blue-200">
                 <div className="flex-1 min-w-0 pr-3">
                    <div className="font-black text-slate-800 text-[11px] uppercase truncate">{item.name}</div>
                    <div className="text-[10px] font-bold text-slate-400">Unit: {(item.price).toFixed(2)}€</div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                       <button onClick={() => updateQuantity(item.cartId, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900"><Minus size={14}/></button>
                       <span className="font-black text-sm w-8 text-center">{item.quantity}</span>
                       <button onClick={() => updateQuantity(item.cartId, 1)} className="w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-md shadow-sm"><Plus size={14}/></button>
                    </div>
                    <div className="font-black text-xs text-slate-800 min-w-[50px] text-right">{(item.price * item.quantity).toFixed(2)}€</div>
                 </div>
              </div>
            ))}
         </div>

         {/* Ticket Summary */}
         <footer className="bg-white border-t border-slate-200 p-6 space-y-4">
            <div className="space-y-2">
               <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>{(cartTotal / 1.10).toFixed(2)}€</span>
               </div>
               <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span>IVA Incluido (10%)</span>
                  <span>{(cartTotal - (cartTotal / 1.10)).toFixed(2)}€</span>
               </div>
               <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <span className="font-black text-sm uppercase text-slate-800">TOTAL</span>
                  <span className="font-black tracking-tighter text-slate-900" style={{ fontSize: '32px' }}>{cartTotal.toFixed(2)}€</span>
               </div>
            </div>
            
            <button 
              disabled={cartTotal <= 0 || isProcessing}
              onClick={() => handleCheckout('Efectivo')}
              style={{
                 width: '100%', padding: '24px 0', borderRadius: '12px', fontWeight: '900', fontSize: '20px',
                 textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                 backgroundColor: cartTotal > 0 ? '#2563eb' : '#cbd5e1',
                 color: 'white',
                 transition: 'all 0.2s',
                 boxShadow: cartTotal > 0 ? '0 10px 15px -3px rgba(37, 99, 235, 0.3)' : 'none',
                 cursor: cartTotal > 0 ? 'pointer' : 'not-allowed',
                 border: 'none'
              }}
            >
              {isProcessing ? <RefreshCw className="animate-spin" size={24}/> : (
                <>
                  <CreditCard size={24}/>
                  <span>COBRAR</span>
                </>
              )}
            </button>
         </footer>
      </aside>

      {/* 3. MODALS (Settings, Checkout, Modifiers) */}
      
      {/* SETTINGS MODAL */}
      {showSettings && (
         <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
               <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h2 className="text-2xl font-black">Ajustes TPV</h2>
                  <button onClick={() => setShowSettings(false)} className="p-2 text-slate-300 hover:text-slate-900"><X size={32}/></button>
               </div>
               <div className="p-8 space-y-8">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Columnas del Grid (iPad/Desktop)</label>
                     <div className="flex gap-2">
                        {[3,4,5,6].map(n => (
                          <button key={n} onClick={() => setViewSettings({...viewSettings, columns: n})} className={`flex-1 py-4 rounded-2xl font-black transition-all ${viewSettings.columns === n ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>{n}</button>
                        ))}
                     </div>
                  </div>
                  <div className="flex items-center justify-between">
                     <div><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mostrar Fotos</label></div>
                     <button onClick={() => setViewSettings({...viewSettings, showPhotos: !viewSettings.showPhotos})} className={`w-14 h-8 rounded-full relative transition-all ${viewSettings.showPhotos ? 'bg-emerald-500' : 'bg-slate-200'}`}><div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-all ${viewSettings.showPhotos ? 'translate-x-6' : 'translate-x-0'}`}/></button>
                  </div>
                  <div className="space-y-4">
                     <div className="flex justify-between font-black text-[10px] uppercase text-slate-400 tracking-widest"><span>Tamaño Fuente</span> <span>{viewSettings.fontSize}px</span></div>
                     <input type="range" min="12" max="24" value={viewSettings.fontSize} onChange={(e)=>setViewSettings({...viewSettings, fontSize: Number(e.target.value)})} className="w-full accent-slate-900"/>
                  </div>
                  <button onClick={() => setViewSettings({...viewSettings, isEditMode: !viewSettings.isEditMode})} className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all ${viewSettings.isEditMode ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'}`}>
                     {viewSettings.isEditMode ? 'Guardar Cambios' : 'Modo Reordenar'}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* CHECKOUT MODAL */}
      {showCheckout && (
         <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8">
            <div className="bg-white w-full max-w-2xl rounded-[4rem] p-10 sm:p-16 shadow-2xl relative overflow-hidden animate-in zoom-in slide-in-from-bottom-20 duration-500">
               {saleSuccess ? (
                 <div className="text-center py-10 scale-in flex flex-col items-center">
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6"><CheckCircle2 size={56}/></div>
                    <h2 className="text-5xl font-black tracking-tighter">¡LISTO!</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mt-4">Venta registrada correctamente</p>
                 </div>
               ) : (
                 <>
                   <button onClick={() => setShowCheckout(false)} className="absolute top-10 right-10 text-slate-200 hover:text-slate-900"><X size={32}/></button>
                   <h2 className="text-4xl font-black mb-10 tracking-tight">Cierre de Ticket</h2>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                      <button onClick={() => handleCheckout('cash')} disabled={isProcessing} className="p-8 bg-slate-50 rounded-3xl flex flex-col items-center gap-4 hover:bg-emerald-50 border-2 border-transparent hover:border-emerald-200 transition-all font-black text-slate-400 hover:text-emerald-500 uppercase text-xs tracking-widest"><Banknote size={40}/> Efectivo</button>
                      <button onClick={() => handleCheckout('card')} disabled={isProcessing} className="p-8 bg-slate-50 rounded-3xl flex flex-col items-center gap-4 hover:bg-sky-50 border-2 border-transparent hover:border-sky-200 transition-all font-black text-slate-400 hover:text-sky-500 uppercase text-xs tracking-widest"><CreditCard size={40}/> Tarjeta</button>
                      <button onClick={() => handleCheckout('bizum')} disabled={isProcessing} className="p-8 bg-slate-50 rounded-3xl flex flex-col items-center gap-4 hover:bg-pink-50 border-2 border-transparent hover:border-pink-200 transition-all font-black text-slate-400 hover:text-pink-500 uppercase text-xs tracking-widest"><div className="w-10 h-10 bg-current rounded-full flex items-center justify-center text-white italic text-xl">B</div> Bizum</button>
                   </div>
                   <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] flex flex-col sm:flex-row justify-between items-center gap-4 shadow-2xl shadow-slate-200">
                      <span className="font-black uppercase tracking-widest text-xs opacity-50">Total Final</span>
                      <span className="text-4xl font-black">{cartTotal.toFixed(2)}€</span>
                   </div>
                 </>
               )}
            </div>
         </div>
      )}

      {/* MODIFIERS MODAL */}
      {pendingModifierProduct && (
         <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 overflow-hidden shadow-2xl animate-in zoom-in duration-300">
               <h2 className="text-3xl font-black mb-2">{pendingModifierProduct.name}</h2>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-8">Opciones obligatorias</p>
               <div className="space-y-3">
                  {pendingModifierProduct.modifiers?.map(mod => (
                    <button key={mod} onClick={() => addToCart(pendingModifierProduct, mod)} className="w-full p-6 bg-slate-50 rounded-2xl flex justify-between items-center group hover:bg-slate-900 hover:text-white transition-all">
                       <span className="font-black text-lg">{mod}</span>
                       <ChevronRight className="text-slate-200 group-hover:translate-x-1 transition-transform"/>
                    </button>
                  ))}
               </div>
               <button onClick={() => setPendingModifierProduct(null)} className="w-full mt-8 py-4 text-slate-300 font-bold uppercase tracking-widest text-[10px] hover:text-rose-500">Cancelar</button>
            </div>
         </div>
      )}

    </div>
  );
}
