import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { deductStockForOrder } from '../lib/inventoryService';
import { 
  ShoppingBag, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Package, 
  Search, 
  Trash2, 
  User, 
  ChevronRight,
  AlertCircle,
  Truck,
  History,
  Activity
} from 'lucide-react';

import '../styles/Common.css';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('active'); // active, preparing, delivered

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('public:orders_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchOrders() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }

  const updateStatus = async (orderId, newStatus) => {
    try {
      const order = orders.find(o => o.id === orderId);
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Logic trigger: If delivered, deduct stock
      if (newStatus === 'delivered' && order.status !== 'delivered') {
        const stockResult = await deductStockForOrder(order);
        if (!stockResult.success) {
           alert("Alerta: El pedido se marcó como entregado pero hubo un error de stock: " + stockResult.error);
        }
      }

      fetchOrders();
    } catch (err) {
      alert('Error updating order: ' + err.message);
    }
  };

  // Stats Logic
  const today = new Date().toISOString().split('T')[0];
  const ordersToday = orders.filter(o => o.created_at.startsWith(today)).length;
  const totalSales = orders
    .filter(o => o.status === 'delivered' || o.status === 'paid')
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  // Filter Logic
  const filteredOrders = orders.filter(o => {
    if (filterStatus === 'active') return o.status === 'pending';
    if (filterStatus === 'preparing') return o.status === 'preparing';
    if (filterStatus === 'delivered') return o.status === 'delivered' || o.status === 'paid';
    return true;
  });

  return (
    <div className="page-container fade-in">
      {/* Header Estilo BaChan */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem' }}>Ventas & Pedidos</h1>
          <p className="page-subtitle">Gestión operativa y métricas en tiempo real</p>
        </div>
        <div className="card-icon-wrapper" style={{ width: '56px', height: '56px', background: 'var(--color-brand)', color: 'white' }}>
           <Activity size={28} />
        </div>
      </div>

      {/* KPI Cards: Phase 4 Redesign */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="premium-form-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div className="flex justify-between items-start">
            <div>
              <span className="form-label">Pedidos Hoy</span>
              <div className="text-4xl font-black text-slate-900 mt-2">{ordersToday}</div>
            </div>
            <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
              <ShoppingBag size={24} />
            </div>
          </div>
          <div className="text-[10px] font-bold text-emerald-500 mt-4 flex items-center gap-1">
             <TrendingUp size={12} /> Actualizado ahora
          </div>
        </div>

        <div className="premium-form-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div className="flex justify-between items-start">
            <div>
              <span className="form-label">Ventas Totales</span>
              <div className="text-4xl font-black text-slate-900 mt-2">{totalSales.toFixed(2)}€</div>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="text-[10px] font-bold text-slate-400 mt-4">Solo pedidos entregados</div>
        </div>
      </div>

      {/* Navigation Tabs (Style similar to Insumos/Preparaciones) */}
      <div className="category-tabs-wrapper mb-8">
        <div className="category-tabs" style={{ background: '#f8fafc', padding: '6px', borderRadius: '18px' }}>
          {[
            { id: 'active', label: 'Pendientes', icon: <Clock size={16} /> },
            { id: 'preparing', label: 'En Cocina', icon: <Package size={16} /> },
            { id: 'delivered', label: 'Historial', icon: <History size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              className={`category-tab ${filterStatus === tab.id ? 'active' : ''}`}
              onClick={() => setFilterStatus(tab.id)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Order Cards: Phase 4 Redesign */}
      {loading && orders.length === 0 ? (
        <div className="space-y-4">
           {[1,2].map(i => <div key={i} className="premium-card animate-pulse h-32" style={{ opacity: 0.5 }}></div>)}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-100 italic">
          <Truck size={48} className="mx-auto text-slate-100 mb-4" />
          <p className="text-slate-400 text-lg">No hay pedidos en esta sección</p>
        </div>
      ) : (
        <div className="card-grid">
          {filteredOrders.map(order => (
            <div key={order.id} className="premium-card flex-col items-stretch gap-4" style={{ cursor: 'default' }}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-2xl text-slate-400">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="card-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem' }}>{order.customer_name}</h3>
                    <div className="card-meta flex items-center gap-1">
                      <Clock size={10} /> Recogida: {order.pickup_time || 'Por confirmar'}
                    </div>
                  </div>
                </div>
                
                <StatusBadge status={order.status} />
              </div>

              <div className="bg-slate-50/50 rounded-2xl p-4">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Items del Pedido</div>
                <div className="space-y-2">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <ShoppingBag size={14} className="text-slate-300" />
                        <span className="font-bold text-slate-700">{item.name} <span className="text-slate-400 font-medium">x{item.quantity}</span></span>
                      </div>
                      <span className="font-black text-slate-900">{Number(item.price * item.quantity).toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                   <span className="font-bold text-xs text-slate-400 uppercase">Total</span>
                   <span className="text-lg font-black text-slate-900">{Number(order.total).toFixed(2)}€</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <button 
                    onClick={() => updateStatus(order.id, 'preparing')}
                    className="btn-primary w-full justify-center"
                    style={{ background: '#3b82f6', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}
                  >
                    Mandar a Cocina
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button 
                    onClick={() => updateStatus(order.id, 'delivered')}
                    className="btn-primary w-full justify-center"
                    style={{ background: '#10b981', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
                  >
                    Marcar Entregado
                  </button>
                )}
                {(order.status === 'delivered' || order.status === 'paid') && (
                  <div className="w-full text-center py-2 text-emerald-500 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                     <CheckCircle2 size={16} /> Entregado con éxito
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const configs = {
    pending: { label: 'Pendiente', bg: 'bg-amber-100', text: 'text-amber-600' },
    preparing: { label: 'En Cocina', bg: 'bg-blue-100', text: 'text-blue-600' },
    delivered: { label: 'Entregado', bg: 'bg-emerald-100', text: 'text-emerald-600' },
    paid: { label: 'Pagado', bg: 'bg-emerald-100', text: 'text-emerald-600' }
  };
  
  const config = configs[status] || configs.pending;
  
  return (
    <span className={`${config.bg} ${config.text} px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest`}>
      {config.label}
    </span>
  );
}
