import { supabase } from './supabaseClient';

const LOCAL_CUSTOMERS_KEY = 'bachan_customers_real_v3';

// ── Clientes Reales sincronizados desde Supabase con UUIDs reales ─────────────
export const INITIAL_REAL_CUSTOMERS = [
  {
    id: "9b93fbff-cd29-4cf6-bbdd-be91db5eb400",
    name: "Alina",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Cliente fiel registrada desde tickets de venta TPV.",
    loyalty_tier: "vip",
    discount_percent: 0,
    favorite_dish: "Nato pack 30",
    created_at: "2026-04-18T12:36:55.624+00:00"
  },
  {
    id: "b493d528-8403-43bd-8f88-180d2e22a54d",
    name: "Fumiko",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Cliente habitual de Nato Pack 30. Registrada desde TPV.",
    loyalty_tier: "vip",
    discount_percent: 0,
    favorite_dish: "Nato pack 30",
    created_at: "2026-06-11T04:59:20.999+00:00"
  },
  {
    id: "7a06bc34-b4fc-4e6c-9d97-e75857d86112",
    name: "Sergio",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Comanda grande de Bento Sushi 18 piezas.",
    loyalty_tier: "vip",
    discount_percent: 0,
    favorite_dish: "Bento Sushi 18 piezas",
    created_at: "2026-04-30T10:18:18.446+00:00"
  },
  {
    id: "722a39c3-29bc-40f1-9000-be5641943aad",
    name: "yuka",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Cliente fiel de BaChan.",
    loyalty_tier: "vip",
    discount_percent: 0,
    favorite_dish: "Bento adulto",
    created_at: "2026-04-18T12:30:32.602+00:00"
  },
  {
    id: "0db3a0e1-edec-40c5-8f6c-5e62e1a27740",
    name: "Combi",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Pedidos de Bento Tonkatsu.",
    loyalty_tier: "vip",
    discount_percent: 0,
    favorite_dish: "Bento Tonkatsu",
    created_at: "2026-04-18T12:36:02.868+00:00"
  },
  {
    id: "85ce8386-dd79-4483-8eac-1f4a090729dd",
    name: "Cliente Delivery",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Pedidos agrupados de Delivery general (8 pedidos acumulados).",
    loyalty_tier: "vip",
    discount_percent: 0,
    favorite_dish: "Bento cumpleaños",
    created_at: "2026-04-18T12:31:19.660+00:00"
  },
  {
    id: "395dc504-363e-44ad-a211-f3f06ba2b270",
    name: "DanielSan",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Fan del Bento Tonkatsu.",
    loyalty_tier: "gold",
    discount_percent: 0,
    favorite_dish: "Bento Tonkatsu",
    created_at: "2026-04-18T12:31:56.937+00:00"
  },
  {
    id: "f2f327d9-12db-4b08-986e-37ee295783a8",
    name: "Juanma",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Pedido de Bento Sushi 18 piezas.",
    loyalty_tier: "gold",
    discount_percent: 0,
    favorite_dish: "Bento Sushi 18 piezas",
    created_at: "2026-04-28T16:44:55.392+00:00"
  },
  {
    id: "1b285471-2aed-4eaf-a87a-436ae9cea94e",
    name: "Tomoko",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Pedidos de Nato pack 9.",
    loyalty_tier: "gold",
    discount_percent: 0,
    favorite_dish: "Nato pack 9",
    created_at: "2026-04-18T12:38:31.060+00:00"
  },
  {
    id: "76b538fa-0346-4f9b-91dc-8e7657f1bcf5",
    name: "Wasamolers",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Fan del Chirashi Sushi.",
    loyalty_tier: "gold",
    discount_percent: 0,
    favorite_dish: "Chirashi Sushi",
    created_at: "2026-05-01T07:14:08.322+00:00"
  },
  {
    id: "575eb7c7-a172-4b68-ab5a-e0dd02508f6d",
    name: "laura",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Pedido de Katsudon.",
    loyalty_tier: "gold",
    discount_percent: 0,
    favorite_dish: "Katsudon",
    created_at: "2026-04-18T12:35:03.876+00:00"
  },
  {
    id: "e0d1d021-c82e-4162-93f9-99c287ba33b5",
    name: "Makiko",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Nato pack 30.",
    loyalty_tier: "gold",
    discount_percent: 0,
    favorite_dish: "Nato pack 30",
    created_at: "2026-06-11T05:01:16.840+00:00"
  },
  {
    id: "f7ea7e3f-468a-460e-9214-4d949b7beead",
    name: "Michiko",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Nato pack 30.",
    loyalty_tier: "gold",
    discount_percent: 0,
    favorite_dish: "Nato pack 30",
    created_at: "2026-06-11T05:02:31.335+00:00"
  },
  {
    id: "36292c1b-5cd1-48ad-858f-48c95971afc4",
    name: "Yokopi",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Nato pack 30.",
    loyalty_tier: "gold",
    discount_percent: 0,
    favorite_dish: "Nato pack 30",
    created_at: "2026-08-18T16:20:31.901+00:00"
  },
  {
    id: "ee1faa48-167e-435f-b647-96d02e1a24cf",
    name: "Isabel / BIO 🍀",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Nato pack 30 BIO.",
    loyalty_tier: "gold",
    discount_percent: 0,
    favorite_dish: "Nato pack 30",
    created_at: "2026-09-16T15:53:51.972+00:00"
  },
  {
    id: "b38ca9ae-abbe-467f-8c98-8f5a0ed1efa9",
    name: "ゆーかちゃん　黄／黒",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Nato pack 30.",
    loyalty_tier: "gold",
    discount_percent: 0,
    favorite_dish: "Nato pack 30",
    created_at: "2026-09-18T19:49:25.703+00:00"
  },
  {
    id: "e793fcc2-ab0a-4308-969a-99ca37d5a0a6",
    name: "Bea",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Oyakodon.",
    loyalty_tier: "frequent",
    discount_percent: 0,
    favorite_dish: "Oyakodon",
    created_at: "2026-04-18T12:32:12.352+00:00"
  },
  {
    id: "9bdd86b1-14dd-457b-bc58-14634d216603",
    name: "Nuria",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Nato pack 3.",
    loyalty_tier: "frequent",
    discount_percent: 0,
    favorite_dish: "Nato pack 3",
    created_at: "2026-04-18T12:30:52.199+00:00"
  },
  {
    id: "c1624c5f-648b-4975-83fa-216209378ab8",
    name: "Nuria Sprinter",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Bento Tonkatsu.",
    loyalty_tier: "frequent",
    discount_percent: 0,
    favorite_dish: "Bento Tonkatsu",
    created_at: "2026-04-18T12:35:30.804+00:00"
  },
  {
    id: "c48853f9-d0ae-4594-9977-8cbc2184ef1a",
    name: "Nuria& susana",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Bento Sushi 18 piezas.",
    loyalty_tier: "frequent",
    discount_percent: 0,
    favorite_dish: "Bento Sushi 18 piezas",
    created_at: "2026-04-29T05:58:43.216+00:00"
  },
  {
    id: "7f655bc3-d0d1-4c8d-9ee2-c6022374fefb",
    name: "RAULTIMA",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Bento Sushi 18 piezas.",
    loyalty_tier: "frequent",
    discount_percent: 0,
    favorite_dish: "Bento Sushi 18 piezas",
    created_at: "2026-04-30T10:18:45.369+00:00"
  },
  {
    id: "722e75db-ed37-4473-9ee8-3dd5eb7eac7f",
    name: "Suzuna",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Nato pack 9.",
    loyalty_tier: "frequent",
    discount_percent: 0,
    favorite_dish: "Nato pack 9",
    created_at: "2026-04-26T10:12:41.132+00:00"
  },
  {
    id: "1bf0b3a1-ad28-4823-b95a-955a7ca04516",
    name: "Chika",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Nato pack 9.",
    loyalty_tier: "frequent",
    discount_percent: 0,
    favorite_dish: "Nato pack 9",
    created_at: "2026-06-11T05:02:57.245+00:00"
  },
  {
    id: "3867d2c9-02ed-4ee9-b77d-7faeeec5c7ae",
    name: "Mantenimiento",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Bento cumpleaños.",
    loyalty_tier: "frequent",
    discount_percent: 0,
    favorite_dish: "Bento cumpleaños",
    created_at: "2026-07-30T03:52:21.958+00:00"
  },
  {
    id: "9cc9a9a3-df76-4b66-9521-89196476790b",
    name: "佐々木さん　お試し",
    phone: "",
    email: "",
    birthday: null,
    address: "",
    allergens: "",
    notes: "Nato pack 3.",
    loyalty_tier: "frequent",
    discount_percent: 0,
    favorite_dish: "Nato pack 3",
    created_at: "2026-09-05T14:32:16.758+00:00"
  }
];

// Helper to get local data & clean out obsolete demo seeds
function getLocalCustomers() {
  try {
    localStorage.removeItem('bachan_customers_v1');
    localStorage.removeItem('bachan_customers_real_v2');

    const raw = localStorage.getItem(LOCAL_CUSTOMERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_CUSTOMERS_KEY, JSON.stringify(INITIAL_REAL_CUSTOMERS));
      return INITIAL_REAL_CUSTOMERS;
    }
    const parsed = JSON.parse(raw);
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

// ── Strict PostgreSQL Payload Sanitizer ──────────────────────────────────────
export function sanitizeCustomerPayload(data) {
  const payload = {};
  
  if (data.name !== undefined) payload.name = (data.name || '').trim();
  if (data.phone !== undefined) payload.phone = (data.phone || '').trim();
  if (data.email !== undefined) payload.email = (data.email || '').trim();
  
  // PostgreSQL DATE type strictly requires null when empty or invalid string
  if (data.birthday !== undefined) {
    const b = typeof data.birthday === 'string' ? data.birthday.trim() : data.birthday;
    payload.birthday = b && b.length >= 8 ? b : null;
  }
  
  if (data.address !== undefined) payload.address = (data.address || '').trim();
  if (data.allergens !== undefined) payload.allergens = (data.allergens || '').trim();
  if (data.notes !== undefined) payload.notes = (data.notes || '').trim();
  if (data.loyalty_tier !== undefined) payload.loyalty_tier = data.loyalty_tier || 'standard';
  if (data.discount_percent !== undefined) payload.discount_percent = Number(data.discount_percent || 0);
  if (data.favorite_dish !== undefined) payload.favorite_dish = (data.favorite_dish || '').trim();
  
  payload.updated_at = new Date().toISOString();
  return payload;
}

// ── CRUD Operations ────────────────────────────────────────────────────────
export async function getCustomers() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data && data.length > 0) {
      const realOnly = data.filter(c => !['Marta Soler', 'Carlos Mendoza', 'Lucía Fernández'].includes(c.name));
      saveLocalCustomers(realOnly);
      return { success: true, data: realOnly };
    } else if (error) {
      console.warn('Supabase customers query error:', error);
    }
  } catch (err) {
    console.warn('Supabase customers fetch fallback to localStorage:', err);
  }

  // Fallback to local storage with real customers
  const localData = getLocalCustomers();
  return { success: true, data: localData, isLocalFallback: true };
}

export async function createCustomer(customerData) {
  const now = new Date().toISOString();
  const payload = sanitizeCustomerPayload(customerData);
  payload.created_at = customerData.created_at || now;

  // Try Supabase first
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([payload])
      .select()
      .single();

    if (!error && data) {
      const current = getLocalCustomers();
      saveLocalCustomers([data, ...current.filter(c => c.id !== data.id && c.name.toLowerCase() !== data.name.toLowerCase())]);
      return { success: true, data };
    } else if (error) {
      console.error('Supabase customer insert error:', error);
    }
  } catch (err) {
    console.warn('Supabase customer insert exception:', err);
  }

  // Local fallback
  const newId = crypto.randomUUID ? crypto.randomUUID() : `cust_${Date.now()}`;
  const localObj = { ...payload, id: newId };
  const current = getLocalCustomers();
  const updated = [localObj, ...current.filter(c => c.id !== newId)];
  saveLocalCustomers(updated);
  return { success: true, data: localObj, isLocalFallback: true };
}

export async function updateCustomer(id, customerData) {
  const payload = sanitizeCustomerPayload(customerData);

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    let query = supabase.from('customers').update(payload);
    if (isUuid) {
      query = query.eq('id', id);
    } else {
      query = query.eq('name', customerData.name || '');
    }

    const { data, error } = await query.select().single();

    if (!error && data) {
      const current = getLocalCustomers();
      const updated = current.map(c => (c.id === id || c.id === data.id || (data.name && c.name.toLowerCase() === data.name.toLowerCase())) ? data : c);
      saveLocalCustomers(updated);
      return { success: true, data };
    } else if (error) {
      console.error('Supabase customer update error:', error);
    }
  } catch (err) {
    console.warn('Supabase customer update exception:', err);
  }

  // Local fallback
  const current = getLocalCustomers();
  const updated = current.map(c => {
    if (c.id === id || (customerData.name && c.name.toLowerCase() === customerData.name.toLowerCase())) {
      return { ...c, ...payload };
    }
    return c;
  });
  saveLocalCustomers(updated);
  const updatedObj = updated.find(c => c.id === id || (customerData.name && c.name.toLowerCase() === customerData.name.toLowerCase()));
  return { success: true, data: updatedObj, isLocalFallback: true };
}

export async function deleteCustomer(id) {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (!error) {
        const current = getLocalCustomers();
        saveLocalCustomers(current.filter(c => c.id !== id));
        return { success: true };
      }
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
    const currentListRes = await getCustomers();
    return {
      success: true,
      countCreated: newCustomersToCreate.length,
      totalExisting: (currentListRes.data || []).length,
      newCustomers: newCustomersToCreate
    };
  }

  return {
    success: true,
    countCreated: 0,
    totalExisting: existingCustomers.length,
    newCustomers: []
  };
}

export function cleanCustomerName(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Métricas y Análisis de Consumo del Cliente ─────────────────────────────
export function getCustomerConsumptionStats(customer, allOrders = []) {
  if (!customer) return null;

  const custNameNorm = (customer.name || '').trim().toLowerCase();
  const custNameClean = cleanCustomerName(customer.name);
  const custPhoneNorm = (customer.phone || '').replace(/\D/g, '');

  // Match orders by customer_id, phone, exact name, or clean normalized name
  const customerOrders = allOrders.filter(o => {
    if (!o) return false;
    
    // 1. Exact ID match (highest priority)
    if (o.customer_id && o.customer_id === customer.id) return true;

    // 2. Phone match (if at least 6 digits)
    const orderPhoneNorm = (o.customer_phone || '').replace(/\D/g, '');
    if (custPhoneNorm && custPhoneNorm.length >= 6 && orderPhoneNorm && orderPhoneNorm === custPhoneNorm) return true;

    // 3. Exact and clean normalized name match
    const orderNameNorm = (o.customer_name || '').trim().toLowerCase();
    if (custNameNorm && orderNameNorm) {
      if (orderNameNorm === custNameNorm) return true;
      const orderNameClean = cleanCustomerName(o.customer_name);
      if (custNameClean && orderNameClean && custNameClean === orderNameClean) return true;
    }

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

// ── Contact Picker API & Portapapeles para Agenda del Teléfono ───────────────
export async function pickContactFromPhone() {
  const isSupported = typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window;

  if (!isSupported) {
    return {
      supported: false,
      message: 'La función de abrir la agenda del teléfono mediante la web requiere Chrome en Android o un navegador compatible con la Contact Picker API. En Safari iOS puedes usar la opción de pegar con 1 clic.'
    };
  }

  try {
    const props = ['name', 'tel', 'email'];
    const opts = { multiple: false };
    const contacts = await navigator.contacts.select(props, opts);

    if (contacts && contacts.length > 0) {
      const contact = contacts[0];
      const rawName = contact.name && contact.name.length > 0 ? contact.name[0] : '';
      let rawPhone = contact.tel && contact.tel.length > 0 ? contact.tel[0] : '';
      const rawEmail = contact.email && contact.email.length > 0 ? contact.email[0] : '';

      let cleanPhone = rawPhone.trim();
      if (cleanPhone) {
        const hasPlus = cleanPhone.startsWith('+');
        const digits = cleanPhone.replace(/\D/g, '');
        cleanPhone = hasPlus ? `+${digits}` : digits;
      }

      return {
        supported: true,
        success: true,
        contact: {
          name: rawName,
          phone: cleanPhone,
          email: rawEmail
        }
      };
    }
    return {
      supported: true,
      cancelled: true
    };
  } catch (err) {
    if (err.name === 'AbortError' || err.name === 'SecurityError') {
      return { supported: true, cancelled: true };
    }
    return {
      supported: true,
      error: err.message || 'Error al acceder a la agenda de contactos'
    };
  }
}

export async function pastePhoneFromClipboard() {
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const raw = text.trim();
        const hasPlus = raw.startsWith('+');
        const digits = raw.replace(/\D/g, '');
        if (digits.length >= 6) {
          return {
            success: true,
            phone: hasPlus ? `+${digits}` : digits
          };
        }
      }
    }
  } catch (err) {
    console.warn('Clipboard read error:', err);
  }
  return { success: false };
}
