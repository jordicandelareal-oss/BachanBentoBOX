import { supabase } from './supabaseClient';

const LOCAL_CUSTOMERS_KEY = 'bachan_customers_v1';

// Seed demo customers if localStorage is empty to give an awesome initial experience
const INITIAL_SEED_CUSTOMERS = [
  {
    id: 'c1111111-1111-4111-a111-111111111111',
    name: 'Marta Soler',
    phone: '612345678',
    email: 'marta.soler@email.com',
    birthday: '1992-10-08', // Birthday coming soon
    address: 'Carrer de Mallorca 245, 2º 1ª',
    allergens: 'Sin marisco',
    notes: 'Le encanta la salsa teriyaki extra. Suele pedir para recoger a las 14:15.',
    loyalty_tier: 'vip',
    discount_percent: 10,
    favorite_dish: 'Bento Tonkatsu',
    created_at: '2026-01-15T12:00:00Z'
  },
  {
    id: 'c2222222-2222-4222-a222-222222222222',
    name: 'Carlos Mendoza',
    phone: '655987321',
    email: 'cmendoza@empresa.es',
    birthday: '1988-10-05', // Birthday TODAY!
    address: 'Av. Diagonal 400, Oficina 4B',
    allergens: '',
    notes: 'Pide para la oficina los viernes con compañeros.',
    loyalty_tier: 'gold',
    discount_percent: 5,
    favorite_dish: 'Bento Salmón Teriyaki',
    created_at: '2026-02-01T10:30:00Z'
  },
  {
    id: 'c3333333-3333-4333-a333-333333333333',
    name: 'Lucía Fernández',
    phone: '677112233',
    email: 'lucia.f@gmail.com',
    birthday: '1995-11-20',
    address: 'Carrer d\'Aragó 118, Ppal',
    allergens: 'Vegana / Sin lactosa',
    notes: 'Siempre opciones con Tofu o Edamame. Muy fan del arroz Koshihikari.',
    loyalty_tier: 'frequent',
    discount_percent: 0,
    favorite_dish: 'Bento Vegan Tofu & Setas',
    created_at: '2026-02-18T18:20:00Z'
  }
];

// Helper to get local data
function getLocalCustomers() {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOMERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_CUSTOMERS_KEY, JSON.stringify(INITIAL_SEED_CUSTOMERS));
      return INITIAL_SEED_CUSTOMERS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading local customers:', err);
    return INITIAL_SEED_CUSTOMERS;
  }
}

function saveLocalCustomers(customers) {
  try {
    localStorage.setItem(LOCAL_CUSTOMERS_KEY, JSON.stringify(customers));
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
      saveLocalCustomers(data);
      return { success: true, data };
    }
  } catch (err) {
    console.warn('Supabase customers fetch fallback to localStorage:', err);
  }

  // Fallback to local storage
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
