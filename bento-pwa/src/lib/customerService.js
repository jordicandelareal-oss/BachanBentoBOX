import { supabase } from './supabaseClient';

const LOCAL_CUSTOMERS_KEY = 'bachan_customers_real_v2';

// ── Clientes Reales iniciales extraídos del histórico de tickets TPV ─────────
export const INITIAL_REAL_CUSTOMERS = [
  {
    id: 'cust_alina_vip',
    name: 'Alina',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Cliente fiel. 5 pedidos registrados (Tickets: T-2026-0009, T-2026-0018, T-2026-0039, T-2026-0045).',
    loyalty_tier: 'vip',
    discount_percent: 0,
    favorite_dish: 'Nato pack 30',
    created_at: '2026-04-18T12:36:55.624Z'
  },
  {
    id: 'cust_fumiko_vip',
    name: 'Fumiko',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Cliente habitual de Nato Pack 30. Registrada desde TPV.',
    loyalty_tier: 'vip',
    discount_percent: 0,
    favorite_dish: 'Nato pack 30',
    created_at: '2026-06-11T04:59:20.999Z'
  },
  {
    id: 'cust_sergio_vip',
    name: 'Sergio',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Comanda grande de Bento Sushi 18 piezas.',
    loyalty_tier: 'vip',
    discount_percent: 0,
    favorite_dish: 'Bento Sushi 18 piezas',
    created_at: '2026-04-30T10:18:18.446Z'
  },
  {
    id: 'cust_yuka_vip',
    name: 'yuka',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Cliente fiel de BaChan.',
    loyalty_tier: 'vip',
    discount_percent: 0,
    favorite_dish: 'Bento adulto',
    created_at: '2026-04-18T12:30:32.602Z'
  },
  {
    id: 'cust_combi_vip',
    name: 'Combi',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Pedidos de Bento Tonkatsu.',
    loyalty_tier: 'vip',
    discount_percent: 0,
    favorite_dish: 'Bento Tonkatsu',
    created_at: '2026-04-18T12:36:02.868Z'
  },
  {
    id: 'cust_danielsan_gold',
    name: 'DanielSan',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Fan del Bento Tonkatsu.',
    loyalty_tier: 'gold',
    discount_percent: 0,
    favorite_dish: 'Bento Tonkatsu',
    created_at: '2026-04-18T12:31:56.937Z'
  },
  {
    id: 'cust_juanma_gold',
    name: 'Juanma',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Pedido de Bento Sushi 18 piezas.',
    loyalty_tier: 'gold',
    discount_percent: 0,
    favorite_dish: 'Bento Sushi 18 piezas',
    created_at: '2026-04-28T16:44:55.392Z'
  },
  {
    id: 'cust_tomoko_gold',
    name: 'Tomoko',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Pedidos de Nato pack 9.',
    loyalty_tier: 'gold',
    discount_percent: 0,
    favorite_dish: 'Nato pack 9',
    created_at: '2026-04-18T12:38:31.060Z'
  },
  {
    id: 'cust_wasamolers_gold',
    name: 'Wasamolers',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Fan del Chirashi Sushi.',
    loyalty_tier: 'gold',
    discount_percent: 0,
    favorite_dish: 'Chirashi Sushi',
    created_at: '2026-05-01T07:14:08.322Z'
  },
  {
    id: 'cust_laura_gold',
    name: 'laura',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Pedido de Katsudon.',
    loyalty_tier: 'gold',
    discount_percent: 0,
    favorite_dish: 'Katsudon',
    created_at: '2026-04-18T12:35:03.876Z'
  },
  {
    id: 'cust_makiko_gold',
    name: 'Makiko',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Nato pack 30.',
    loyalty_tier: 'gold',
    discount_percent: 0,
    favorite_dish: 'Nato pack 30',
    created_at: '2026-06-11T05:01:16.840Z'
  },
  {
    id: 'cust_michiko_gold',
    name: 'Michiko',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Nato pack 30.',
    loyalty_tier: 'gold',
    discount_percent: 0,
    favorite_dish: 'Nato pack 30',
    created_at: '2026-06-11T05:02:31.335Z'
  },
  {
    id: 'cust_yokopi_gold',
    name: 'Yokopi',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Nato pack 30.',
    loyalty_tier: 'gold',
    discount_percent: 0,
    favorite_dish: 'Nato pack 30',
    created_at: '2026-08-18T16:20:31.901Z'
  },
  {
    id: 'cust_alinabio_gold',
    name: 'Alina / BIO 🍀',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Nato pack 30 BIO.',
    loyalty_tier: 'gold',
    discount_percent: 0,
    favorite_dish: 'Nato pack 30',
    created_at: '2026-09-16T15:53:11.758Z'
  },
  {
    id: 'cust_isabelbio_gold',
    name: 'Isabel / BIO 🍀',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Nato pack 30 BIO.',
    loyalty_tier: 'gold',
    discount_percent: 0,
    favorite_dish: 'Nato pack 30',
    created_at: '2026-09-16T15:53:51.972Z'
  },
  {
    id: 'cust_yukachan_gold',
    name: 'ゆーかちゃん　黄／黒',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Nato pack 30.',
    loyalty_tier: 'gold',
    discount_percent: 0,
    favorite_dish: 'Nato pack 30',
    created_at: '2026-09-18T19:49:25.703Z'
  },
  {
    id: 'cust_bea_frequent',
    name: 'Bea',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Oyakodon.',
    loyalty_tier: 'frequent',
    discount_percent: 0,
    favorite_dish: 'Oyakodon',
    created_at: '2026-04-18T12:32:12.352Z'
  },
  {
    id: 'cust_nuria_frequent',
    name: 'Nuria',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Nato pack 3.',
    loyalty_tier: 'frequent',
    discount_percent: 0,
    favorite_dish: 'Nato pack 3',
    created_at: '2026-04-18T12:30:52.199Z'
  },
  {
    id: 'cust_nuriasprinter_frequent',
    name: 'Nuria Sprinter',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Bento Tonkatsu.',
    loyalty_tier: 'frequent',
    discount_percent: 0,
    favorite_dish: 'Bento Tonkatsu',
    created_at: '2026-04-18T12:35:30.804Z'
  },
  {
    id: 'cust_nuriasusana_frequent',
    name: 'Nuria& susana',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Bento Sushi 18 piezas.',
    loyalty_tier: 'frequent',
    discount_percent: 0,
    favorite_dish: 'Bento Sushi 18 piezas',
    created_at: '2026-04-29T05:58:43.216Z'
  },
  {
    id: 'cust_raultima_frequent',
    name: 'RAULTIMA',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Bento Sushi 18 piezas.',
    loyalty_tier: 'frequent',
    discount_percent: 0,
    favorite_dish: 'Bento Sushi 18 piezas',
    created_at: '2026-04-30T10:18:45.369Z'
  },
  {
    id: 'cust_suzuna_frequent',
    name: 'Suzuna',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Nato pack 9.',
    loyalty_tier: 'frequent',
    discount_percent: 0,
    favorite_dish: 'Nato pack 9',
    created_at: '2026-04-26T10:12:41.132Z'
  },
  {
    id: 'cust_chika_frequent',
    name: 'Chika',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Nato pack 9.',
    loyalty_tier: 'frequent',
    discount_percent: 0,
    favorite_dish: 'Nato pack 9',
    created_at: '2026-06-11T05:02:57.245Z'
  },
  {
    id: 'cust_mantenimiento_frequent',
    name: 'Mantenimiento',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Bento cumpleaños.',
    loyalty_tier: 'frequent',
    discount_percent: 0,
    favorite_dish: 'Bento cumpleaños',
    created_at: '2026-07-30T03:52:21.958Z'
  },
  {
    id: 'cust_sasaki_frequent',
    name: '佐々木さん　お試し',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Nato pack 3.',
    loyalty_tier: 'frequent',
    discount_percent: 0,
    favorite_dish: 'Nato pack 3',
    created_at: '2026-09-05T14:32:16.758Z'
  },
  {
    id: 'cust_delivery_vip',
    name: 'Cliente Delivery',
    phone: '',
    email: '',
    birthday: null,
    address: '',
    allergens: '',
    notes: 'Pedidos agrupados de Delivery general (8 pedidos acumulados).',
    loyalty_tier: 'vip',
    discount_percent: 0,
    favorite_dish: 'Bento cumpleaños',
    created_at: '2026-04-18T12:31:19.660Z'
  }
];

// Helper to get local data & clean out obsolete demo seeds
function getLocalCustomers() {
  try {
    // Purge old demo key if exists
    localStorage.removeItem('bachan_customers_v1');

    const raw = localStorage.getItem(LOCAL_CUSTOMERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_CUSTOMERS_KEY, JSON.stringify(INITIAL_REAL_CUSTOMERS));
      return INITIAL_REAL_CUSTOMERS;
    }
    const parsed = JSON.parse(raw);
    // Filter out old demo mock names just in case
    const cleaned = parsed.filter(c => !['Marta Soler', 'Carlos Mendoza', 'Lucía Fernández'].includes(c.name));
    if (cleaned.length === 0) {
      localStorage.setItem(LOCAL_CUSTOMERS_KEY, JSON.stringify(INITIAL_REAL_CUSTOMERS));
      return INITIAL_REAL_CUSTOMERS;
    }
    return cleaned;
  } catch (err) {
    console.error('Error reading local customers:', err);
    return INITIAL_REAL_CUSTOMERS;
  }
}

function saveLocalCustomers(customers) {
  try {
    const cleaned = customers.filter(c => !['Marta Soler', 'Carlos Mendoza', 'Lucía Fernández'].includes(c.name));
    localStorage.setItem(LOCAL_CUSTOMERS_KEY, JSON.stringify(cleaned));
  } catch (err) {
    console.error('Error saving local customers:', err);
  }
}

// ── CRUD Operations ────────────────────────────────────────────────────────
export async function getCustomers() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data && data.length > 0) {
      // Filter out any mock names
      const realOnly = data.filter(c => !['Marta Soler', 'Carlos Mendoza', 'Lucía Fernández'].includes(c.name));
      saveLocalCustomers(realOnly);
      return { success: true, data: realOnly };
    }
  } catch (err) {
    console.warn('Supabase customers fetch fallback to localStorage:', err);
  }

  // Fallback to local storage with real customers
  const localData = getLocalCustomers();
  return { success: true, data: localData, isLocalFallback: true };
}

export async function createCustomer(customerData) {
  const newId = crypto.randomUUID ? crypto.randomUUID() : `cust_${Date.now()}`;
  const now = new Date().toISOString();
  
  const customer = {
    id: newId,
    name: customerData.name?.trim() || 'Cliente Sin Nombre',
    phone: customerData.phone?.trim() || '',
    email: customerData.email?.trim() || '',
    birthday: customerData.birthday || null,
    address: customerData.address?.trim() || '',
    allergens: customerData.allergens?.trim() || '',
    notes: customerData.notes?.trim() || '',
    loyalty_tier: customerData.loyalty_tier || 'standard',
    discount_percent: Number(customerData.discount_percent || 0),
    favorite_dish: customerData.favorite_dish?.trim() || '',
    created_at: now,
    updated_at: now
  };

  // Try Supabase first
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .single();

    if (!error && data) {
      const current = getLocalCustomers();
      saveLocalCustomers([data, ...current.filter(c => c.id !== data.id)]);
      return { success: true, data };
    }
  } catch (err) {
    console.warn('Supabase customer insert fallback to local:', err);
  }

  // Local fallback
  const current = getLocalCustomers();
  const updated = [customer, ...current.filter(c => c.id !== customer.id)];
  saveLocalCustomers(updated);
  return { success: true, data: customer, isLocalFallback: true };
}

export async function updateCustomer(id, customerData) {
  const now = new Date().toISOString();
  const cleanData = {
    ...customerData,
    updated_at: now
  };

  try {
    const { data, error } = await supabase
      .from('customers')
      .update(cleanData)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      const current = getLocalCustomers();
      const updated = current.map(c => c.id === id ? data : c);
      saveLocalCustomers(updated);
      return { success: true, data };
    }
  } catch (err) {
    console.warn('Supabase customer update fallback to local:', err);
  }

  // Local fallback
  const current = getLocalCustomers();
  const updated = current.map(c => {
    if (c.id === id) {
      return { ...c, ...cleanData };
    }
    return c;
  });
  saveLocalCustomers(updated);
  const updatedObj = updated.find(c => c.id === id);
  return { success: true, data: updatedObj, isLocalFallback: true };
}

export async function deleteCustomer(id) {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (!error) {
      const current = getLocalCustomers();
      saveLocalCustomers(current.filter(c => c.id !== id));
      return { success: true };
    }
  } catch (err) {
    console.warn('Supabase customer delete fallback to local:', err);
  }

  // Local fallback
  const current = getLocalCustomers();
  saveLocalCustomers(current.filter(c => c.id !== id));
  return { success: true };
}

// ── Sincronizador Automático desde Tickets de Venta ─────────────────────────
export async function syncCustomersFromOrders(allOrders = []) {
  if (!allOrders || allOrders.length === 0) {
    return { success: true, count: 0, message: 'No hay pedidos para analizar.' };
  }

  // 1. Obtener lista actual de clientes
  const currentCustsRes = await getCustomers();
  const existingCustomers = currentCustsRes.data || [];
  const existingNamesSet = new Set(existingCustomers.map(c => (c.name || '').trim().toLowerCase()));

  // 2. Extraer clientes de los tickets
  const customerMap = {};
  
  allOrders.forEach(order => {
    let rawName = order.customer_name?.trim();
    if (!rawName || rawName === 'Mostrador' || rawName === 'Mostrador General') return;
    
    const normKey = rawName.toLowerCase();
    
    if (!customerMap[normKey]) {
      customerMap[normKey] = {
        name: rawName,
        phone: order.customer_phone || '',
        first_order_date: order.created_at,
        orders_count: 0,
        total_spend: 0,
        dish_counts: {},
        tickets: []
      };
    }
    
    const cust = customerMap[normKey];
    cust.orders_count += 1;
    cust.total_spend += Number(order.total || 0);
    if (order.ticket_number) cust.tickets.push(order.ticket_number);
    if (order.customer_phone && !cust.phone) cust.phone = order.customer_phone;
    
    const items = order.items || order.order_items || [];
    if (Array.isArray(items)) {
      items.forEach(item => {
        const dName = item.name || item.title || item.dish_name;
        if (dName) {
          const qty = Number(item.quantity || item.qty || 1);
          cust.dish_counts[dName] = (cust.dish_counts[dName] || 0) + qty;
        }
      });
    }
  });

  // 3. Crear fichas para clientes que no existan todavía
  const newCustomersToCreate = [];
  const now = new Date().toISOString();

  Object.values(customerMap).forEach(c => {
    const normKey = c.name.toLowerCase();
    if (!existingNamesSet.has(normKey)) {
      let favoriteDish = '';
      let maxCount = 0;
      Object.entries(c.dish_counts).forEach(([dish, count]) => {
        if (count > maxCount) {
          maxCount = count;
          favoriteDish = dish;
        }
      });
      
      let tier = 'standard';
      if (c.total_spend >= 60 || c.orders_count >= 4) tier = 'vip';
      else if (c.total_spend >= 30 || c.orders_count >= 2) tier = 'gold';
      else if (c.orders_count >= 1) tier = 'frequent';

      newCustomersToCreate.push({
        id: crypto.randomUUID ? crypto.randomUUID() : `cust_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: c.name,
        phone: c.phone || '',
        email: '',
        birthday: null,
        address: '',
        allergens: '',
        notes: `Cliente sincronizado desde tickets TPV. Primer pedido: ${new Date(c.first_order_date).toLocaleDateString('es-ES')}.`,
        loyalty_tier: tier,
        discount_percent: 0,
        favorite_dish: favoriteDish || 'Plato combinado',
        created_at: c.first_order_date || now,
        updated_at: now
      });
    }
  });

  if (newCustomersToCreate.length > 0) {
    try {
      await supabase.from('customers').insert(newCustomersToCreate);
    } catch (err) {
      console.warn('Sync to Supabase insert warning:', err);
    }
    const combined = [...newCustomersToCreate, ...existingCustomers];
    saveLocalCustomers(combined);
  }

  return {
    success: true,
    countCreated: newCustomersToCreate.length,
    totalExisting: existingCustomers.length,
    newCustomers: newCustomersToCreate
  };
}

// ── Métricas y Análisis de Consumo del Cliente ─────────────────────────────
export function getCustomerConsumptionStats(customer, allOrders = []) {
  if (!customer) return null;

  const custNameNorm = (customer.name || '').trim().toLowerCase();
  const custPhoneNorm = (customer.phone || '').replace(/\D/g, '');

  // Match orders by name, phone or customer_id
  const customerOrders = allOrders.filter(o => {
    if (!o) return false;
    const orderNameNorm = (o.customer_name || '').trim().toLowerCase();
    const orderPhoneNorm = (o.customer_phone || '').replace(/\D/g, '');
    
    if (o.customer_id && o.customer_id === customer.id) return true;
    if (custNameNorm && orderNameNorm && (orderNameNorm === custNameNorm || orderNameNorm.includes(custNameNorm) || custNameNorm.includes(orderNameNorm))) return true;
    if (custPhoneNorm && orderPhoneNorm && orderPhoneNorm === custPhoneNorm) return true;
    return false;
  });

  const ordersCount = customerOrders.length;
  const totalSpent = customerOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const averageTicket = ordersCount > 0 ? totalSpent / ordersCount : 0;

  // Sort orders descending by date
  const sortedOrders = [...customerOrders].sort((a, b) => {
    const dateA = new Date(a.sold_at || a.created_at || 0).getTime();
    const dateB = new Date(b.sold_at || b.created_at || 0).getTime();
    return dateB - dateA;
  });

  const lastOrder = sortedOrders[0] || null;
  const lastOrderDate = lastOrder ? (lastOrder.sold_at || lastOrder.created_at) : null;

  // Favorite product calculation
  const productFrequency = {};
  let totalItemsOrdered = 0;

  customerOrders.forEach(order => {
    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach(item => {
      if (!item || !item.name) return;
      const itemName = item.name.trim();
      const qty = Number(item.quantity || 1);
      productFrequency[itemName] = (productFrequency[itemName] || 0) + qty;
      totalItemsOrdered += qty;
    });
  });

  const topDishes = Object.entries(productFrequency)
    .map(([name, count]) => ({
      name,
      count,
      percent: totalItemsOrdered > 0 ? Math.round((count / totalItemsOrdered) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const calculatedFavorite = topDishes[0] ? topDishes[0].name : (customer.favorite_dish || 'Aún sin pedidos');

  return {
    ordersCount,
    totalSpent,
    averageTicket,
    lastOrderDate,
    topDishes,
    favoriteDish: customer.favorite_dish || calculatedFavorite,
    calculatedFavorite,
    orders: sortedOrders
  };
}

// ── Comprobación de Cumpleaños ──────────────────────────────────────────────
export function checkBirthdayStatus(birthdayStr) {
  if (!birthdayStr) return { isToday: false, isUpcoming: false, daysUntil: null };

  try {
    const today = new Date();
    const currentYear = today.getFullYear();

    const parts = birthdayStr.split('-');
    if (parts.length < 2) return { isToday: false, isUpcoming: false, daysUntil: null };

    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const day = parseInt(parts[2] || parts[0], 10);

    // This year's birthday
    const thisYearBday = new Date(currentYear, month, day);
    const todayZero = new Date(currentYear, today.getMonth(), today.getDate());

    const diffTime = thisYearBday.getTime() - todayZero.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { isToday: true, isUpcoming: false, daysUntil: 0 };
    } else if (diffDays > 0 && diffDays <= 7) {
      return { isToday: false, isUpcoming: true, daysUntil: diffDays };
    } else if (diffDays < 0 && diffDays >= -1) {
      return { isToday: false, wasYesterday: true, daysUntil: diffDays };
    }

    return { isToday: false, isUpcoming: false, daysUntil: diffDays };
  } catch (err) {
    return { isToday: false, isUpcoming: false, daysUntil: null };
  }
}

// ── Generador de Enlaces de WhatsApp ────────────────────────────────────────
export function buildWhatsAppLink(phone, type, options = {}) {
  if (!phone) return null;

  // Clean phone number (add Spanish 34 prefix if 9 digits starting with 6 or 7)
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 9 && (cleanPhone.startsWith('6') || cleanPhone.startsWith('7'))) {
    cleanPhone = '34' + cleanPhone;
  }

  const { customerName = 'Hola', discount = 10, favoriteDish = 'tu bento favorito', customText = '' } = options;

  let message = '';
  switch (type) {
    case 'birthday':
      message = `¡Hola ${customerName}! 🎂🎉\n\nDe parte de todo el equipo de *BaChan BentoBox*, ¡te deseamos un muy feliz cumpleaños! 🥢🍱\n\nPara celebrarlo juntos, tienes una invitación muy especial: un *${discount}% de descuento* (o un postre de la casa de regalo) en tu próximo pedido.\n\n¡Esperamos verte muy pronto! Que tengas un día genial. ✨`;
      break;

    case 'offer':
      message = `¡Hola ${customerName}! 🍱🥢\n\nTe echamos de menos por *BaChan*. Hoy tenemos listo tu plato favorito: *${favoriteDish}* recién preparado con todo el cariño de BaChan.\n\nSi pides hoy, tienes un *${discount}% de descuento exclusivo* diciendo el código *BACHAN${discount}*.\n\n¿Te preparamos tu bento para hoy? 🍣✨`;
      break;

    case 'weekly_menu':
      message = `¡Hola ${customerName}! 🍱🥢\n\nYa está disponible el *Nuevo Menú Semanal de BaChan BentoBox*.\n\nDescubre los bentos y platos de esta semana recién elaborados. ¿Te reservamos alguno para hoy?\n\n¡Take Away y Delivery disponible! 🛵`;
      break;

    case 'custom':
    default:
      message = customText || `¡Hola ${customerName}! Te escribimos desde BaChan BentoBox 🍱`;
      break;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
