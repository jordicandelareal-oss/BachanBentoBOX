import { toPng, toJpeg } from 'html-to-image';
import { supabase } from './supabaseClient';

const LOCAL_FLYERS_KEY = 'bachan_flyer_templates_v3';

export const PRELOADED_DISH_ILLUSTRATIONS = [
  { id: 'tonkatsu', name: 'Tonkatsu Bento', url: '/dishes/tonkatsu.png', tags: ['tonkatsu', 'cerdo', 'panko'] },
  { id: 'katsudon', name: 'Katsudon Bento', url: '/dishes/katsudon.png', tags: ['katsudon', 'donburi', 'tonkatsu huevo'] },
  { id: 'oyakodon', name: 'Oyakodon Bento', url: '/dishes/oyakodon.png', tags: ['oyakodon', 'pollo', 'huevo'] },
  { id: 'kare', name: 'Kare Japonés', url: '/dishes/kare.png', tags: ['kare', 'curry', 'estofado'] },
  { id: 'karaage', name: 'Karaage de Pollo', url: '/dishes/karaage.jpg', tags: ['karaage', 'pollo frito', 'crujiente'] },
  { id: 'salmon', name: 'Salmón Teriyaki', url: '/dishes/salmon_teriyaki.jpg', tags: ['salmon', 'teriyaki', 'pescado'] },
  { id: 'gyoza', name: 'Gyozas de Cerdo/Col', url: '/dishes/gyoza.jpg', tags: ['gyoza', 'empanadilla', 'dumpling'] },
  { id: 'onigiri', name: 'Onigiris Tradicionales', url: '/dishes/onigiri.jpg', tags: ['onigiri', 'arroz', 'triangulo'] },
  { id: 'sushi', name: 'Sushi Box Especial', url: '/dishes/sushi.png', tags: ['sushi', 'nigiri', 'maki', 'uramaki'] },
  { id: 'natto3', name: 'Natto 3 Packs', url: '/dishes/natto_3.png', tags: ['natto', 'soja'] },
  { id: 'natto9', name: 'Natto 9 Packs', url: '/dishes/natto_9.png', tags: ['natto', 'pack'] },
  { id: 'natto30', name: 'Natto 30 Packs', url: '/dishes/natto_30.png', tags: ['natto', 'familiar'] }
];

export function resolveDishImage(dish) {
  if (dish?.imageUrl && dish.imageUrl.trim() !== '') {
    return dish.imageUrl;
  }
  
  const nameLower = (dish?.name || '').toLowerCase();
  const matched = PRELOADED_DISH_ILLUSTRATIONS.find(item => 
    item.tags.some(tag => nameLower.includes(tag)) || nameLower.includes(item.id)
  );
  
  return matched ? matched.url : '/dishes/tonkatsu.png';
}

export const FLYER_THEMES = [
  {
    id: 'bachan_classic',
    name: 'BaChan Tradicional Crema (Original)',
    desc: 'El diseño auténtico de la abuela: papel pergamino, doble marco japonés, flores sakura y logo marrón',
    bg: '#fcf6e8',
    cardBg: '#fffdf9',
    textPrimary: '#1a1815',
    textSecondary: '#3d2b1f',
    accent: '#8b4513',
    stamp: '#b91c1c',
    border: '#3d2b1f',
    logo: '/logo-bachan-seal-brown.png'
  },
  {
    id: 'navy_gold',
    name: 'BaChan Imperial Navy',
    desc: 'Azul marino noche con toques oro y marco imperial',
    bg: '#0c1c2e',
    cardBg: '#132338',
    textPrimary: '#f5e6c8',
    textSecondary: '#cbd5e1',
    accent: '#f59e0b',
    stamp: '#dc2626',
    border: '#d4af37',
    logo: '/logo-bachan-seal-navy.png'
  },
  {
    id: 'cherry_minimal',
    name: 'Cherry Blossom Rosa',
    desc: 'Fondo suave con detalles sakura rosa y logo BaChan',
    bg: '#fdf2f4',
    cardBg: '#ffffff',
    textPrimary: '#3b0764',
    textSecondary: '#701a75',
    accent: '#db2777',
    stamp: '#be185d',
    border: '#9d174d',
    logo: '/logo-bachan-seal-rose.png'
  },
  {
    id: 'neo_tokyo',
    name: 'Neo Tokyo Dark',
    desc: 'Modo oscuro de alto contraste con acentos dorados',
    bg: '#0f172a',
    cardBg: '#1e293b',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    accent: '#38bdf8',
    stamp: '#f43f5e',
    border: '#38bdf8',
    logo: '/logo-bachan-illustration.png'
  }
];

// Presets de promociones rápidas configurables
export const PROMO_PRESETS = [
  {
    id: 'student',
    label: '🎓 Día del Estudiante',
    title: '🎓 PROMOCIÓN ESPECIAL DÍA DEL ESTUDIANTE',
    subtext: '15% de descuento en bentos presentando carnet de estudiante',
    callout: '* Válido en pedidos de mediodía de lunes a viernes con carnet universitario/estudiante.',
    badge: '🎓 Promo Estudiante'
  },
  {
    id: 'academia_maru',
    label: '🏫 Academia Maru',
    title: '🏷️ TARIFA ESPECIAL ALUMNOS ACADEMIA MARU',
    subtext: 'Menú exclusivo para alumnos y profesores de Academia Maru',
    callout: '* Presenta tu acreditación de la Academia Maru para disfrutar de tu precio exclusivo.',
    badge: '🏫 Tarifa Maru'
  },
  {
    id: 'offices',
    label: '🏢 Empresas & Oficinas',
    title: '🏢 MENÚ ESPECIAL EMPRESAS & COWORKING',
    subtext: 'Pide antes de las 12:00h y te lo llevamos puntual a la oficina',
    callout: '* Pedidos de grupo a partir de 3 bentos: entrega prioritaria garantizada.',
    badge: '🏢 Pack Oficina'
  },
  {
    id: 'weekend',
    label: '🎉 Especial Fin de Semana',
    title: '🎉 MENÚ DEGUSTACIÓN FIN DE SEMANA',
    subtext: 'Nuestras especialidades más exclusivas recién preparadas',
    callout: '* Cantidades limitadas elaboradas artesanalmente. ¡Reserva con antelación!',
    badge: '⭐ Edición Especial'
  },
  {
    id: 'free_delivery',
    label: '🛵 Envío Gratis + Regalo',
    title: '🛵 ENVÍO GRATIS EN PEDIDOS SUPERIORES A 20€',
    subtext: 'Incluye bebida o aperitivo japonés de cortesía',
    callout: '* Promoción activa esta semana para pedidos por WhatsApp o local.',
    badge: '🛵 Envío Gratis'
  }
];

export const DEFAULT_WEEKLY_MENU = {
  headerTitle: '¡PEDIDOS ABIERTOS PARA BENTOS!',
  headerSubtitle: '¡NUESTROS PRIMEROS PLATOS AUTÉNTICOS, HECHOS CON AMOR POR LA ABUELA!',
  headerTagline: 'En Bachan Bentobox, ¡haz tu pedido hoy! Deliciosos. Tradicionales. Hechos a mano.',
  showPromoBanner: false,
  promoBannerTitle: '🎓 PROMOCIÓN ESPECIAL DÍA DEL ESTUDIANTE',
  promoBannerSubtext: '15% de descuento presentando tu carnet de estudiante',
  promoCallout: '',
  contactName: 'Akiko Hirakawa',
  contactPhone: '691 328 095',
  contactPrefix: 'WhatsApp:',
  showSakura: true,
  dishes: [
    {
      id: 'dish_1',
      name: 'Bento Tonkatsu',
      tpvPrice: 12.5,
      price: '12,5€',
      description: '(Chuleta de cerdo crujiente con arroz, sopa miso y acompañamientos)',
      badge: 'el clásico crujiente',
      imageUrl: '/dishes/tonkatsu.png'
    },
    {
      id: 'dish_2',
      name: 'Katsudon Bento',
      tpvPrice: 14.5,
      price: '14,5€',
      description: '(Cuenco de arroz con Tonkatsu, huevo y cebolla en salsa tradicional)',
      badge: 'confort en cada bocado',
      imageUrl: '/dishes/katsudon.png'
    },
    {
      id: 'dish_3',
      name: 'Bento Sushi 18 piezas',
      tpvPrice: 19.5,
      price: '19,5€',
      description: '(Selección premium de nigiris, makis variados y uramakis frescos)',
      badge: 'selección premium',
      imageUrl: '/dishes/sushi.png'
    }
  ]
};

export const DEFAULT_PRODUCT_FLYER = {
  headerTitle: '¡EDICIÓN ESPECIAL BACHAN!',
  headerSubtitle: 'EL PLATO ESTRELLA DE LA SEMANA',
  headerTagline: 'Elaborado artesanalmente por la abuela con receta tradicional japonesa.',
  title: 'Tonkatsu Bento Crujiente',
  description: 'Lomo de cerdo seleccionado rebozado en panko japonés artesanal, frito al punto dorado. Acompañado de salsa tonkatsu casera, arroz Koshihikari al vapor y sopa miso.',
  price: '12,50€',
  badge: 'el clásico crujiente',
  contactName: 'Akiko Hirakawa',
  contactPhone: '691 328 095',
  imageUrl: '/dishes/tonkatsu.png',
  includes: [
    'Arroz Koshihikari cocido al vapor',
    'Tamagoyaki japonés artesanal',
    'Encurtidos caseros Tsukemono',
    'Sopa Miso caliente tradicional'
  ]
};

const INITIAL_FLYER_TEMPLATES = [
  {
    id: 'flyer_classic_weekly',
    title: 'Carta Semanal Auténtica BaChan',
    type: 'weekly_menu',
    aspect_ratio: 'story',
    theme: 'bachan_classic',
    content: DEFAULT_WEEKLY_MENU,
    created_at: new Date().toISOString()
  }
];

function getLocalFlyers() {
  try {
    const raw = localStorage.getItem(LOCAL_FLYERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_FLYERS_KEY, JSON.stringify(INITIAL_FLYER_TEMPLATES));
      return INITIAL_FLYER_TEMPLATES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading local flyers:', err);
    return INITIAL_FLYER_TEMPLATES;
  }
}

function saveLocalFlyers(flyers) {
  try {
    localStorage.setItem(LOCAL_FLYERS_KEY, JSON.stringify(flyers));
  } catch (err) {
    console.error('Error saving local flyers:', err);
  }
}

export async function getFlyerTemplates() {
  try {
    const { data, error } = await supabase
      .from('flyer_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      saveLocalFlyers(data);
      return { success: true, data };
    }
  } catch (err) {
    console.warn('Supabase flyer_templates fallback:', err);
  }

  return { success: true, data: getLocalFlyers(), isLocalFallback: true };
}

export async function saveFlyerTemplate(templateData) {
  const newId = templateData.id || (crypto.randomUUID ? crypto.randomUUID() : `flyer_${Date.now()}`);
  const now = new Date().toISOString();

  const record = {
    ...templateData,
    id: newId,
    updated_at: now,
    created_at: templateData.created_at || now
  };

  try {
    const { data, error } = await supabase
      .from('flyer_templates')
      .upsert([record])
      .select()
      .single();

    if (!error && data) {
      const current = getLocalFlyers();
      const exists = current.some(f => f.id === data.id);
      const updated = exists ? current.map(f => f.id === data.id ? data : f) : [data, ...current];
      saveLocalFlyers(updated);
      return { success: true, data };
    }
  } catch (err) {
    console.warn('Supabase save flyer fallback:', err);
  }

  const current = getLocalFlyers();
  const exists = current.some(f => f.id === record.id);
  const updated = exists ? current.map(f => f.id === record.id ? record : f) : [record, ...current];
  saveLocalFlyers(updated);
  return { success: true, data: record, isLocalFallback: true };
}

export async function deleteFlyerTemplate(id) {
  try {
    const { error } = await supabase
      .from('flyer_templates')
      .delete()
      .eq('id', id);

    if (!error) {
      const current = getLocalFlyers();
      saveLocalFlyers(current.filter(f => f.id !== id));
      return { success: true };
    }
  } catch (err) {
    console.warn('Supabase delete flyer fallback:', err);
  }

  const current = getLocalFlyers();
  saveLocalFlyers(current.filter(f => f.id !== id));
  return { success: true };
}

// ── Exportación de Imagen en Alta Resolución ──────────────────────────────
export async function downloadFlyerImage(elementId, fileName = 'carta-semanal-bachan.png', format = 'png') {
  const node = document.getElementById(elementId);
  if (!node) {
    throw new Error('Elemento del flyer no encontrado en el DOM');
  }

  const exportOptions = {
    pixelRatio: 3.0,
    cacheBust: true,
    quality: 0.98,
    style: {
      transform: 'none'
    }
  };

  let dataUrl;
  if (format === 'jpeg' || format === 'jpg') {
    dataUrl = await toJpeg(node, exportOptions);
  } else {
    dataUrl = await toPng(node, exportOptions);
  }

  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return dataUrl;
}

// ── Generador de Texto para WhatsApp ─────────────────────────────────────────
export function generateWhatsAppWeeklyText(weeklyData) {
  const {
    headerTitle = '¡PEDIDOS ABIERTOS PARA BENTOS!',
    headerSubtitle = '¡Nuestros platos auténticos hechos con amor por la abuela!',
    showPromoBanner = false,
    promoBannerTitle = '',
    promoBannerSubtext = '',
    promoCallout = '',
    contactName = 'Akiko Hirakawa',
    contactPhone = '691 328 095',
    dishes = []
  } = weeklyData;

  let text = `🍱 *${headerTitle}* 🍱\n`;
  if (headerSubtitle) text += `_${headerSubtitle}_\n\n`;

  // Promotional Highlight if active
  if (showPromoBanner && promoBannerTitle) {
    text += `✨ *${promoBannerTitle}* ✨\n`;
    if (promoBannerSubtext) text += `📌 _${promoBannerSubtext}_\n`;
    text += `\n`;
  }

  text += `*CARTA DE ESTA SEMANA:*\n\n`;

  dishes.forEach((d) => {
    if (d.name) {
      text += `🥢 *${d.name}* • *${d.price}*\n`;
      if (d.description) text += `   _${d.description}_\n`;
      if (d.badge) text += `   ↳ ✨ [${d.badge}]\n`;
      text += `\n`;
    }
  });

  if (promoCallout) {
    text += `ℹ️ _${promoCallout}_\n\n`;
  }

  text += `🛵 *En Bachan Bentobox, ¡haz tu pedido hoy!*\n`;
  text += `Deliciosos. Tradicionales. Hechos a mano.\n\n`;
  if (contactPhone) text += `📲 *WhatsApp de pedidos:* ${contactName ? contactName + ' ' : ''}${contactPhone}\n`;
  text += `\n¡Te esperamos en BaChan! 🍣🥢`;

  return text;
}

export function generateWhatsAppProductText(productData) {
  const {
    title = '',
    price = '',
    badge = '',
    description = '',
    includes = [],
    contactName = 'Akiko Hirakawa',
    contactPhone = '691 328 095'
  } = productData;

  let text = `🍱 *${title.toUpperCase()}* 🍱\n`;
  if (badge) text += `✨ *${badge}*\n`;
  if (price) text += `💰 *Precio:* ${price}\n\n`;

  if (description) text += `${description}\n\n`;

  if (includes && includes.length > 0) {
    text += `🥢 *Incluye:*\n`;
    includes.forEach(inc => {
      if (inc) text += `• ${inc}\n`;
    });
    text += `\n`;
  }

  text += `📲 *WhatsApp de pedidos:* ${contactName ? contactName + ' ' : ''}${contactPhone}\n`;
  text += `\n¡Hecho al momento con todo el cariño de la abuela BaChan! 🍣🎋`;

  return text;
}
