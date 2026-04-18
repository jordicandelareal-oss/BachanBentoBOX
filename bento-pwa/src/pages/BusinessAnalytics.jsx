import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Star,
  Target,
  Award,
  AlertTriangle,
  ShoppingBag,
  DollarSign,
  Percent,
  Package,
  Sparkles,
  Loader2,
  ArrowUpRight,
  PieChart,
  Clock,
  User,
  Ticket,
  CreditCard,
  Banknote,
  QrCode,
  Wallet
} from 'lucide-react';

import '../styles/Common.css';
import './BusinessAnalytics.css';

export default function BusinessAnalytics() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today'); // today, 7d, 30d, all
  const [menuItems, setMenuItems] = useState([]);

  // ── Data Fetching ──────────────────────────────
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [ordersRes, menuRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .in('status', ['completed', 'paid', 'delivered', 'finalizado'])
          .order('created_at', { ascending: false }),
        supabase
          .from('menu_items')
          .select('*')
          .eq('active', true)
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (menuRes.error) throw menuRes.error;

      console.log('📊 [Analytics] Órdenes recuperadas:', ordersRes.data?.length || 0);
      setOrders(ordersRes.data || []);
      setMenuItems(menuRes.data || []);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  }

  // ── Period Filter ──────────────────────────────
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(order => {
      const orderDate = new Date(order.sold_at || order.created_at);
      switch (period) {
        case 'today': {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return orderDate >= today;
        }
        case '7d': {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        }
        case '30d': {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= monthAgo;
        }
        default: return true;
      }
    });
  }, [orders, period]);

  // ── Aggregate item-level stats ─────────────────
  const itemStats = useMemo(() => {
    const stats = {};

    filteredOrders.forEach(order => {
      if (!order.items || !Array.isArray(order.items)) return;
      order.items.forEach(item => {
        const key = item.name || item.id;
        if (!stats[key]) {
          stats[key] = {
            name: item.name || 'Sin nombre',
            totalQty: 0,
            totalRevenue: 0,
            totalCost: 0,
            recipe_id: item.recipe_id,
            ingredient_id: item.ingredient_id
          };
        }
        const lookupItem = menuItems.find(mi => mi.id === item.id);
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const cost = Number(item.cost) || (lookupItem ? Number(lookupItem.cost) : 0) || 0;
        const mult = Number(item.quantity_multiplier) || 1;

        if (cost === 0) {
          console.warn(`⚠️ [Analytics] Producto sin coste definido: ${item.name || item.id}`);
        }

        stats[key].totalQty += qty * mult;
        stats[key].totalRevenue += price * qty;
        stats[key].totalCost += cost * qty;
      });
    });

    return Object.values(stats).map(s => ({
      ...s,
      marginAbsolute: s.totalRevenue - s.totalCost,
      marginPercent: s.totalRevenue > 0
        ? ((s.totalRevenue - s.totalCost) / s.totalRevenue) * 100
        : 0,
      marginPerUnit: s.totalQty > 0
        ? (s.totalRevenue - s.totalCost) / s.totalQty
        : 0
    }));
  }, [filteredOrders]);

  // ── KPIs ───────────────────────────────────────
  const kpis = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    const totalOrders = filteredOrders.length;
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalItemsSold = itemStats.reduce((s, i) => s + i.totalQty, 0);
    const totalCost = itemStats.reduce((s, i) => s + i.totalCost, 0);
    const avgMargin = totalRevenue > 0
      ? ((totalRevenue - totalCost) / totalRevenue) * 100
      : 0;

    let totalServiceTimeMs = 0;
    let countedServiceOrders = 0;
    filteredOrders.forEach(o => {
      if (o.sold_at && o.created_at) {
        const diff = new Date(o.sold_at) - new Date(o.created_at);
        if (diff > 0 && diff < 1000 * 60 * 60 * 24) { // max 24h
          totalServiceTimeMs += diff;
          countedServiceOrders++;
        }
      }
    });
    const avgServiceTimeMins = countedServiceOrders > 0 ? (totalServiceTimeMs / countedServiceOrders) / 60000 : 0;
    const netProfit = totalRevenue - totalCost;

    return { totalRevenue, totalOrders, avgTicket, totalItemsSold, totalCost, netProfit, avgMargin, avgServiceTimeMins };
  }, [filteredOrders, itemStats]);

  // ── Rankings ───────────────────────────────────
  const popularityRanking = useMemo(() =>
    [...itemStats].sort((a, b) => b.totalQty - a.totalQty).slice(0, 10),
    [itemStats]
  );

  const marginRanking = useMemo(() =>
    [...itemStats]
      .filter(i => i.totalQty > 0)
      .sort((a, b) => b.marginPerUnit - a.marginPerUnit)
      .slice(0, 10),
    [itemStats]
  );

  // ── BCG Matrix (Menu Engineering) ──────────────
  const bcgMatrix = useMemo(() => {
    if (itemStats.length === 0) return { stars: [], workhorses: [], puzzles: [], dogs: [] };

    // Calculate medians for classification
    const avgQty = itemStats.reduce((s, i) => s + i.totalQty, 0) / Math.max(itemStats.length, 1);
    const avgMarginPct = itemStats.length > 0
      ? itemStats.reduce((s, i) => s + i.marginPercent, 0) / itemStats.length
      : 0;

    const stars = [];       // High sales + High margin
    const workhorses = [];  // High sales + Low margin
    const puzzles = [];     // Low sales + High margin
    const dogs = [];        // Low sales + Low margin

    itemStats.forEach(item => {
      const highSales = item.totalQty >= avgQty;
      const highMargin = item.marginPercent >= avgMarginPct;

      if (highSales && highMargin) stars.push(item);
      else if (highSales && !highMargin) workhorses.push(item);
      else if (!highSales && highMargin) puzzles.push(item);
      else dogs.push(item);
    });

    return { stars, workhorses, puzzles, dogs };
  }, [itemStats]);

  // ── Render Helpers ─────────────────────────────
  const getRankStyle = (index) => {
    if (index === 0) return 'gold';
    if (index === 1) return 'silver';
    if (index === 2) return 'bronze';
    return 'default';
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-slate-300" size={40} />
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Cargando analítica...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container fade-in analytics-page">
      {/* ── Header ──────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white' }}>
              <BarChart3 size={24} />
            </span>
            Análisis de Negocio
          </h1>
          <p className="page-subtitle">Inteligencia operativa para optimizar tu carta</p>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={() => window.location.href='/dashboard'} className="btn-dashboard">
            <LayoutGrid size={18}/>
            <span>Dashboard</span>
          </button>
          <div className="card-icon-wrapper" style={{
            width: '48px', height: '48px',
            background: 'linear-gradient(135deg, #c084fc, #a855f7)',
            color: 'white', cursor: 'pointer'
          }} onClick={fetchData}>
            <Sparkles size={22} />
          </div>
        </div>
      </div>

      {/* ── Period Filter ─────────────────────── */}
      <div className="period-filter">
        {[
          { id: 'today', label: 'Hoy' },
          { id: '7d', label: '7 Días' },
          { id: '30d', label: '30 Días' },
          { id: 'all', label: 'Todo' }
        ].map(p => (
          <button
            key={p.id}
            className={`period-btn ${period === p.id ? 'active' : ''}`}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── KPI Cards ────────────────────────── */}
      <div className="kpi-grid">
        <div className="kpi-card revenue">
          <div className="kpi-label">Ingresos Netos</div>
          <div className="kpi-value">{kpis.totalRevenue.toFixed(0)}€</div>
          <div className="kpi-trend positive">
            <TrendingUp size={12} /> {filteredOrders.length} pedidos
          </div>
        </div>
        <div className="kpi-card cost">
          <div className="kpi-label">Coste Total (Food Cost)</div>
          <div className="kpi-value">{kpis.totalCost.toFixed(0)}€</div>
          <div className="kpi-trend negative">
            <TrendingDown size={12} /> Salida de caja
          </div>
        </div>
        <div className="kpi-card profit">
          <div className="kpi-label">Beneficio Neto</div>
          <div className="kpi-value">{kpis.netProfit.toFixed(0)}€</div>
          <div className="kpi-trend positive">
            <ArrowUpRight size={12} /> Beneficio real
          </div>
        </div>
        <div className="kpi-card orders">
          <div className="kpi-label">Ticket Medio</div>
          <div className="kpi-value">{kpis.avgTicket.toFixed(2)}€</div>
          <div className="kpi-trend neutral">
            <ShoppingBag size={12} /> Por pedido
          </div>
        </div>
        <div className="kpi-card margin">
          <div className="kpi-label">Margen Medio</div>
          <div className="kpi-value">{kpis.avgMargin.toFixed(1)}%</div>
          <div className={`kpi-trend ${kpis.avgMargin >= 60 ? 'positive' : 'negative'}`}>
            {kpis.avgMargin >= 60 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {kpis.avgMargin >= 60 ? 'Saludable' : 'Mejorar costes'}
          </div>
        </div>
        <div className="kpi-card items">
          <div className="kpi-label">Unidades Vendidas</div>
          <div className="kpi-value">{kpis.totalItemsSold}</div>
          <div className="kpi-trend neutral">
            <Package size={12} /> Total periodo
          </div>
        </div>
        <div className="kpi-card time">
          <div className="kpi-label">T. Servicio</div>
          <div className="kpi-value">{kpis.avgServiceTimeMins.toFixed(0)} min</div>
          <div className="kpi-trend neutral">
            <Clock size={12} /> T. Promedio cocina
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-100 italic">
          <PieChart size={48} className="mx-auto text-slate-100 mb-4" />
          <p className="text-slate-400 text-lg font-bold">Sin datos para este periodo</p>
          <p className="text-slate-300 text-sm mt-2">Registra ventas desde el TPV para ver analíticas</p>
        </div>
      ) : (
        <>
          {/* ── Ranking de Popularidad ──────── */}
          <div className="analytics-section">
            <div className="analytics-section-header">
              <h2 className="analytics-section-title">
                <div className="icon-bg" style={{ background: '#fef3c7', color: '#f59e0b' }}>
                  <Award size={20} />
                </div>
                Ranking de Popularidad
              </h2>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>
                Top platos por volumen de venta
              </span>
            </div>

            <div className="ranking-list">
              {popularityRanking.map((item, idx) => {
                const maxQty = popularityRanking[0]?.totalQty || 1;
                return (
                  <div key={item.name} className="ranking-item">
                    <div className={`ranking-position ${getRankStyle(idx)}`}>{idx + 1}</div>
                    <div className="ranking-info">
                      <div className="ranking-name">{item.name}</div>
                      <div className="ranking-subtext">{item.totalRevenue.toFixed(2)}€ facturado</div>
                    </div>
                    <div className="ranking-bar-wrapper">
                      <div
                        className="ranking-bar"
                        style={{
                          width: `${(item.totalQty / maxQty) * 100}%`,
                          background: 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                        }}
                      />
                    </div>
                    <div className="ranking-value" style={{ color: '#f59e0b' }}>
                      {item.totalQty} uds
                    </div>
                  </div>
                );
              })}
              {popularityRanking.length === 0 && (
                <div className="bcg-empty">No hay datos suficientes</div>
              )}
            </div>
          </div>

          {/* ── Análisis de Margen ──────────── */}
          <div className="analytics-section">
            <div className="analytics-section-header">
              <h2 className="analytics-section-title">
                <div className="icon-bg" style={{ background: '#dcfce7', color: '#22c55e' }}>
                  <DollarSign size={20} />
                </div>
                Análisis de Margen
              </h2>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>
                Dinero limpio por plato vendido (PVP − Coste)
              </span>
            </div>

            <div className="ranking-list">
              {marginRanking.map((item, idx) => {
                const maxMargin = marginRanking[0]?.marginPerUnit || 1;
                return (
                  <div key={item.name} className="ranking-item">
                    <div className={`ranking-position ${getRankStyle(idx)}`}>{idx + 1}</div>
                    <div className="ranking-info">
                      <div className="ranking-name">{item.name}</div>
                      <div className="ranking-subtext">
                        {item.marginPercent.toFixed(1)}% margen · {item.totalQty} vendidos
                      </div>
                    </div>
                    <div className="ranking-bar-wrapper">
                      <div
                        className="ranking-bar"
                        style={{
                          width: `${Math.max(0, (item.marginPerUnit / maxMargin) * 100)}%`,
                          background: item.marginPercent >= 60
                            ? 'linear-gradient(90deg, #34d399, #10b981)'
                            : 'linear-gradient(90deg, #fb923c, #f97316)'
                        }}
                      />
                    </div>
                    <div className="ranking-value" style={{
                      color: item.marginPercent >= 60 ? '#10b981' : '#f97316'
                    }}>
                      {item.marginPerUnit.toFixed(2)}€
                    </div>
                  </div>
                );
              })}
              {marginRanking.length === 0 && (
                <div className="bcg-empty">No hay datos suficientes</div>
              )}
            </div>
          </div>

          {/* ── Ingeniería de Menú (BCG Matrix) ── */}
          <div className="analytics-section">
            <div className="analytics-section-header">
              <h2 className="analytics-section-title">
                <div className="icon-bg" style={{ background: '#ede9fe', color: '#8b5cf6' }}>
                  <Target size={20} />
                </div>
                Ingeniería de Menú
              </h2>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>
                Clasificación BCG por venta y margen
              </span>
            </div>

            <div className="bcg-grid">
              {/* ⭐ Stars */}
              <div className="bcg-quadrant star">
                <div className="bcg-header">
                  <div className="bcg-title">
                    <Star size={16} /> Estrellas
                  </div>
                  <span className="bcg-badge">⭐ Potenciar</span>
                </div>
                <div className="bcg-items">
                  {bcgMatrix.stars.length > 0 ? bcgMatrix.stars.map(item => (
                    <div key={item.name} className="bcg-item">
                      <span className="bcg-item-name">{item.name}</span>
                      <div className="bcg-item-stats">
                        <span style={{ color: '#15803d' }}>{item.totalQty} uds</span>
                        <span style={{ color: '#15803d' }}>{item.marginPercent.toFixed(0)}%</span>
                      </div>
                    </div>
                  )) : <div className="bcg-empty">Ningún plato en esta categoría</div>}
                </div>
              </div>

              {/* 🐴 Workhorses (Caballos de Batalla) */}
              <div className="bcg-quadrant workhorse">
                <div className="bcg-header">
                  <div className="bcg-title">
                    <TrendingUp size={16} /> Caballos de Batalla
                  </div>
                  <span className="bcg-badge">🐴 Optimizar Coste</span>
                </div>
                <div className="bcg-items">
                  {bcgMatrix.workhorses.length > 0 ? bcgMatrix.workhorses.map(item => (
                    <div key={item.name} className="bcg-item">
                      <span className="bcg-item-name">{item.name}</span>
                      <div className="bcg-item-stats">
                        <span style={{ color: '#92400e' }}>{item.totalQty} uds</span>
                        <span style={{ color: '#dc2626' }}>{item.marginPercent.toFixed(0)}%</span>
                      </div>
                    </div>
                  )) : <div className="bcg-empty">Ningún plato en esta categoría</div>}
                </div>
              </div>

              {/* 🧩 Puzzles */}
              <div className="bcg-quadrant puzzle">
                <div className="bcg-header">
                  <div className="bcg-title">
                    <Sparkles size={16} /> Puzzles
                  </div>
                  <span className="bcg-badge">🧩 Promocionar</span>
                </div>
                <div className="bcg-items">
                  {bcgMatrix.puzzles.length > 0 ? bcgMatrix.puzzles.map(item => (
                    <div key={item.name} className="bcg-item">
                      <span className="bcg-item-name">{item.name}</span>
                      <div className="bcg-item-stats">
                        <span style={{ color: '#1d4ed8' }}>{item.totalQty} uds</span>
                        <span style={{ color: '#1d4ed8' }}>{item.marginPercent.toFixed(0)}%</span>
                      </div>
                    </div>
                  )) : <div className="bcg-empty">Ningún plato en esta categoría</div>}
                </div>
              </div>

              {/* 🐕 Dogs (Perros) */}
              <div className="bcg-quadrant dog">
                <div className="bcg-header">
                  <div className="bcg-title">
                    <AlertTriangle size={16} /> Perros
                  </div>
                  <span className="bcg-badge">🐕 Eliminar</span>
                </div>
                <div className="bcg-items">
                  {bcgMatrix.dogs.length > 0 ? bcgMatrix.dogs.map(item => (
                    <div key={item.name} className="bcg-item">
                      <span className="bcg-item-name">{item.name}</span>
                      <div className="bcg-item-stats">
                        <span style={{ color: '#b91c1c' }}>{item.totalQty} uds</span>
                        <span style={{ color: '#b91c1c' }}>{item.marginPercent.toFixed(0)}%</span>
                      </div>
                    </div>
                  )) : <div className="bcg-empty">Ningún plato en esta categoría</div>}
                </div>
              </div>
            </div>
          </div>

          {/* ── Historial de Ventas ────────────── */}
          <div className="analytics-section mt-8">
            <div className="analytics-section-header">
              <h2 className="analytics-section-title">
                <div className="icon-bg" style={{ background: '#e0f2fe', color: '#0ea5e9' }}>
                  <ShoppingBag size={20} />
                </div>
                Historial de Ventas
              </h2>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>
                Tickets de venta cobrados en este periodo
              </span>
            </div>

            {/* HEADER DE TABLA (VISIBLE SOLO EN ESCRITORIO) */}
            {filteredOrders.filter(o => ['completed', 'paid', 'delivered', 'finalizado'].includes(o.status)).length > 0 && (
              <div className="history-table-header flex px-5 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                <div style={{ flexBasis: '20%' }}>Cliente</div>
                <div style={{ flexBasis: '25%' }}>Fecha y Hora</div>
                <div style={{ flexBasis: '10%' }} className="text-right">Precio</div>
                <div style={{ flexBasis: '10%' }} className="text-right">Dto.</div>
                <div style={{ flexBasis: '15%' }} className="text-right">Total</div>
                <div style={{ flexBasis: '20%' }} className="text-center">Tipo</div>
              </div>
            )}

            <div className="ranking-list">
              {filteredOrders
                .filter(o => ['completed', 'paid', 'delivered', 'finalizado'].includes(o.status))
                .map((order) => {
                  const getPaymentStyles = (method) => {
                    switch(method) {
                      case 'bizum': return { bg: '#eff6ff', color: '#1d4ed8', label: 'Bizum' };
                      case 'cash': return { bg: '#f0fdf4', color: '#15803d', label: 'Efectivo' };
                      case 'card': return { bg: '#faf5ff', color: '#7e22ce', label: 'Tarjeta' };
                      default: return { bg: '#f8fafc', color: '#64748b', label: 'Otro' };
                    }
                  };
                  const pStyles = getPaymentStyles(order.payment_method);
                  const subtotal = Number(order.total) + Number(order.discount_amount || 0);
                  const discount = Number(order.discount_amount || 0);

                  // Cálculo de margen por ticket
                  const orderItems = Array.isArray(order.items) ? order.items : [];
                  const orderCost = orderItems.reduce((acc, item) => {
                    const itemCost = Number(item.cost) || 0;
                    return acc + (itemCost * (Number(item.quantity) || 0));
                  }, 0);
                  const orderMarginPct = order.total > 0 ? ((Number(order.total) - orderCost) / Number(order.total)) * 100 : 0;

                  return (
                    <React.Fragment key={order.id}>
                      {/* 1. VISTA ESCRITORIO (ROW) */}
                      <div className="ranking-item hidden lg:flex items-center gap-0 py-4" style={{ cursor: 'default' }}>
                        <div style={{ flexBasis: '20%' }} className="font-black text-slate-800 text-xs uppercase truncate pr-4">
                          {order.customer_name || 'Mostrador'}
                        </div>
                        <div style={{ flexBasis: '25%' }} className="text-xs font-bold text-slate-400 flex items-center gap-2">
                          <Clock size={12} className="opacity-30"/>
                          {new Date(order.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ flexBasis: '10%' }} className="text-right text-xs font-bold text-slate-500">
                          {subtotal.toFixed(2)}€
                        </div>
                        <div style={{ flexBasis: '10%' }} className={`text-right text-xs font-black ${discount > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                          {discount > 0 ? `-${discount.toFixed(2)}€` : '—'}
                        </div>
                        <div style={{ flexBasis: '15%' }} className="text-right text-base font-black text-slate-900 pr-4">
                          <div className="flex flex-col items-end">
                            <span>{Number(order.total).toFixed(2)}€</span>
                            <span className="ticket-margin-badge mt-1">Margen: {orderMarginPct.toFixed(0)}%</span>
                          </div>
                        </div>
                        <div style={{ flexBasis: '20%' }} className="text-center">
                          <span 
                            className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block min-w-[80px]"
                            style={{ backgroundColor: pStyles.bg, color: pStyles.color }}
                          >
                            {pStyles.label}
                          </span>
                        </div>
                      </div>

                      {/* 2. VISTA MÓVIL (CARD) */}
                      <div className="history-card block lg:hidden">
                        <div className="history-card-top">
                          <div>
                            <div className="history-card-customer">{order.customer_name || 'Mostrador'}</div>
                            <div className="history-card-meta mt-1">
                              <Ticket size={12} />
                              #{order.ticket_number?.split('-').pop()}
                              <span className="ticket-margin-badge ml-2">{orderMarginPct.toFixed(0)}% marg.</span>
                            </div>
                          </div>
                          <div className="history-card-total">{Number(order.total).toFixed(2)}€</div>
                        </div>
                        
                        <div className="history-card-details">
                          <div className="history-card-meta">
                            <Clock size={12} />
                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <span 
                            className="history-card-badge"
                            style={{ backgroundColor: pStyles.bg, color: pStyles.color }}
                          >
                            {pStyles.label}
                          </span>
                        </div>
                        
                        {discount > 0 && (
                          <div className="text-[10px] font-black text-red-500 uppercase mt-1">
                            Ahorro de {discount.toFixed(2)}€ aplicado
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              
              {filteredOrders.filter(o => ['completed', 'paid', 'delivered', 'finalizado'].includes(o.status)).length === 0 && (
                <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-100 text-slate-300 font-bold text-xs uppercase tracking-[4px] italic">
                   No hay ventas registradas
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
