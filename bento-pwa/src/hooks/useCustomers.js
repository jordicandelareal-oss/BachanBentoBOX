import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  getCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer,
  getCustomerConsumptionStats,
  checkBirthdayStatus,
  syncCustomersFromOrders
} from '../lib/customerService';
import { supabase } from '../lib/supabaseClient';

export function useCustomers() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch customers and orders in parallel
      const [custRes, ordersRes] = await Promise.all([
        getCustomers(),
        supabase
          .from('orders')
          .select('*')
          .in('status', ['completed', 'paid', 'delivered', 'finalizado'])
          .order('created_at', { ascending: false })
      ]);

      if (custRes.data) {
        setCustomers(custRes.data);
      }

      if (!ordersRes.error && ordersRes.data) {
        setOrders(ordersRes.data);
      }
    } catch (err) {
      console.error('Error in useCustomers loadData:', err);
      setError(err.message || 'Error cargando datos de clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addCustomer = async (data) => {
    const res = await createCustomer(data);
    if (res.success) {
      await loadData();
    }
    return res;
  };

  const editCustomer = async (id, data) => {
    const res = await updateCustomer(id, data);
    if (res.success) {
      await loadData();
    }
    return res;
  };

  const removeCustomer = async (id) => {
    const res = await deleteCustomer(id);
    if (res.success) {
      await loadData();
    }
    return res;
  };

  // Enriched customers with consumption stats & birthday status
  const enrichedCustomers = useMemo(() => {
    return customers.map(cust => {
      const stats = getCustomerConsumptionStats(cust, orders);
      const birthdayStatus = checkBirthdayStatus(cust.birthday);
      return {
        ...cust,
        stats,
        birthdayStatus
      };
    });
  }, [customers, orders]);

  // General summary statistics
  const summary = useMemo(() => {
    const totalCustomers = enrichedCustomers.length;
    const vipCount = enrichedCustomers.filter(c => c.loyalty_tier === 'vip' || c.loyalty_tier === 'gold').length;
    const birthdaysSoon = enrichedCustomers.filter(c => c.birthdayStatus.isToday || c.birthdayStatus.isUpcoming).length;
    const birthdaysToday = enrichedCustomers.filter(c => c.birthdayStatus.isToday).length;
    const totalRevenueFromCustomers = enrichedCustomers.reduce((acc, c) => acc + (c.stats?.totalSpent || 0), 0);

    return {
      totalCustomers,
      vipCount,
      birthdaysSoon,
      birthdaysToday,
      totalRevenueFromCustomers
    };
  }, [enrichedCustomers]);

  const syncFromOrders = async () => {
    const res = await syncCustomersFromOrders(orders);
    await loadData();
    return res;
  };

  return {
    customers: enrichedCustomers,
    rawCustomers: customers,
    orders,
    loading,
    error,
    summary,
    refresh: loadData,
    syncFromOrders,
    addCustomer,
    editCustomer,
    removeCustomer
  };
}
