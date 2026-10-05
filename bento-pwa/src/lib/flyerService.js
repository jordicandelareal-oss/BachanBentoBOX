import { toBlob, toPng, toJpeg } from 'html-to-image';
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

export function resolveDishImage(dish, menuItems = []) {
  if (dish?.imageUrl && dish.imageUrl.trim() !== '') {
    return dish.imageUrl;
  }
  if (dish?.image_url && dish.image_url.trim() !== '') {
    return dish.image_url;
  }
  
  // Si tenemos acceso al catálogo del TPV, buscar si este plato tiene foto oficial
  if (menuItems && menuItems.length > 0) {
    const matched = menuItems.find(m => 
      (dish?.menuItemId && m.id === dish.menuItemId) || 
      (m.name && dish?.name && m.name.toLowerCase().trim() === dish.name.toLowerCase().trim())
    );
    if (matched?.image_url && matched.image_url.trim() !== '') {
      return matched.image_url;
    }
  }

  const nameLower = (dish?.name || '').toLowerCase();
  const matched = PRELOADED_DISH_ILLUSTRATIONS.find(item => 
    item.tags.some(tag => nameLower.includes(tag)) || nameLower.includes(item.id)
  );
  
  return matched ? matched.url : '/dishes/tonkatsu.png';
}

const PACKAGING_WORDS = [
  'bento box', 'caja', 'bolsa', 'tarrina', 'envase', 'palillo', 'palillos',
  'servilleta', 'tapa', 'film', 'cubierto', 'bol', 'vaso'
];

const STAPLE_WORDS = ['sal', 'agua', 'aceite girasol', 'aceite de girasol', 'aceite oliva'];

// ── Motor Inteligente de Descripciones y Claims de Sabor desde Elaboraciones ──
export function generateSmartDishDescriptor(item) {
  if (!item) return { description: '', badge: 'especialidad', childNames: [], ingredientNames: [] };

  const name = (item.name || '').trim();
  const nameLower = name.toLowerCase();
  const recipe = item.recipe || {};
  const recipeIngredients = recipe.recipe_ingredients || [];

  // Extraer elaboraciones y alimentos reales
  const childNames = [];
  const ingredientNames = [];

  recipeIngredients.forEach(ri => {
    if (ri.child?.name) {
      const cName = ri.child.name.trim();
      const cLower = cName.toLowerCase();
      if (!PACKAGING_WORDS.some(w => cLower.includes(w))) {
        childNames.push(cName);
      }
    } else if (ri.ingredient?.name) {
      const iName = ri.ingredient.name.trim();
      const iLower = iName.toLowerCase();
      if (!PACKAGING_WORDS.some(w => iLower.includes(w)) && !STAPLE_WORDS.some(w => iLower === w)) {
        ingredientNames.push(iName);
      }
    }
  });

  let description = '';
  let badge = 'especialidad';

  // 1. Detección por platos icónicos japoneses y sus combinaciones
  if (nameLower.includes('tonkatsu') && (nameLower.includes('bento') || recipe.recipe_type === 'bento')) {
    description = '(Lomo de cerdo crujiente empanado en panko con arroz, tsukemono y ensalada fresca)';
    badge = 'el clásico crujiente';
  } else if (nameLower.includes('katsudon')) {
    description = '(Cuenco de arroz con crujiente tonkatsu, huevo meloso y cebolla pochada en salsa dashi)';
    badge = 'confort en cada bocado';
  } else if (nameLower.includes('oyakodon')) {
    description = '(Pollo jugoso y huevo tierno estofados sobre arroz con cebolla en salsa dulce)';
    badge = 'tradición & ternura';
  } else if (nameLower.includes('karaage') || nameLower.includes('pollo frito')) {
    description = '(Pollo marinado al estilo japonés frito crujiente con arroz y salsa especial)';
    badge = 'jugoso & crujiente';
  } else if (nameLower.includes('salmon') || nameLower.includes('salmón')) {
    if (nameLower.includes('maki') || nameLower.includes('sushi') || nameLower.includes('hosomaki') || nameLower.includes('futomaki') || nameLower.includes('nigiri')) {
      description = '(Piezas frescas de arroz sazonado con salmón noruego y alga nori)';
      badge = 'fresco del día';
    } else {
      description = '(Lomo de salmón fresco glaseado con salsa teriyaki dulce sobre cama de arroz)';
      badge = 'glaseado teriyaki';
    }
  } else if (nameLower.includes('onigiri')) {
    if (childNames.length > 1) {
      const nonRice = childNames.filter(c => !c.toLowerCase().includes('arroz'));
      description = `(Triángulos de arroz japonés sazonado envueltos en alga nori con ${nonRice.slice(0, 2).join(' y ')})`;
    } else {
      description = '(Triángulos de arroz japonés artesanal sazonado envueltos en alga nori)';
    }
    badge = 'hecho a mano';
  } else if (nameLower.includes('kare') || nameLower.includes('curry')) {
    description = '(Curry japonés aromático cocinado a fuego lento con verduras tiernas y arroz)';
    badge = 'aroma & calidez';
  } else if (nameLower.includes('gyoza')) {
    description = '(Empanadillas artesanales rellenas de cerdo y verduras doradas a la plancha)';
    badge = 'doradas al punto';
  } else if (nameLower.includes('yakimeshi')) {
    description = '(Arroz salteado al wok teppanyaki con vegetales de temporada y toque de soja)';
    badge = 'salteado al wok';
  } else if (nameLower.includes('natto') || nameLower.includes('nato')) {
    description = '(Habas de soja fermentadas tradicionales de Japón, superalimento nutritivo)';
    badge = '100% tradicional';
  } else if (nameLower.includes('sushi') || nameLower.includes('chirashi')) {
    description = '(Selección de nigiris y makis frescos elaborados artesanalmente al momento)';
    badge = 'selección premium';
  } else if (nameLower.includes('atun') || nameLower.includes('atún') || nameLower.includes('corvina') || nameLower.includes('langostino') || nameLower.includes('surimi') || nameLower.includes('maki') || nameLower.includes('nigiri') || nameLower.includes('roll')) {
    const mainFillings = [...childNames, ...ingredientNames].filter(f => !f.toLowerCase().includes('arroz'));
    if (mainFillings.length > 0) {
      description = `(Piezas preparadas con ${mainFillings.slice(0, 3).join(', ')} y arroz de sushi)`;
    } else {
      description = '(Piezas artesanales de sushi fresco elaboradas al momento)';
    }
    badge = 'fresco del día';
  } else if (nameLower.includes('coca') || nameLower.includes('fanta') || nameLower.includes('ramune') || nameLower.includes('cerveza') || nameLower.includes('refresco') || /\b(te|té|agua)\b/i.test(nameLower)) {
    description = '(Bebida fría refrescante para acompañar tu bento box favorito)';
    badge = 'refrescante';
  } else if (nameLower.includes('bento') && childNames.length >= 2) {
    description = `(Menú completo con ${childNames.slice(0, 3).join(', ')} y guarnición casera)`;
    badge = 'el favorito de BaChan';
  } else if (childNames.length > 0) {
    description = `(Elaborado con ${childNames.slice(0, 3).join(', ')} y guarnición de la casa)`;
    badge = 'receta de la abuela';
  } else if (ingredientNames.length > 0) {
    description = `(Elaboración artesanal con ${ingredientNames.slice(0, 3).join(', ')})`;
    badge = 'hecho con cariño';
  } else {
    description = `(Especialidad artesanal recién elaborada con ingredientes seleccionados)`;
    badge = 'especialidad BaChan';
  }

  return { description, badge, childNames, ingredientNames };
}

export async function saveDishDescriptionToTPV(menuItemId, description) {
  if (!menuItemId) return { success: false, error: 'ID de plato no proporcionado' };
  try {
    const { error } = await supabase
      .from('menu_items')
      .update({ description })
      .eq('id', menuItemId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Error guardando descripción en TPV:', err);
    return { success: false, error: err.message };
  }
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
  headerSubtitle: 'Platos auténticos hechos con amor por la abuela',
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

export const LOCAL_FLYER_HEADER_KEY = 'bachan_flyer_header_custom_v1';

export function getSavedFlyerHeaderSettings() {
  try {
    const raw = localStorage.getItem(LOCAL_FLYER_HEADER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          headerTitle: parsed.headerTitle || DEFAULT_WEEKLY_MENU.headerTitle,
          headerSubtitle: parsed.headerSubtitle || DEFAULT_WEEKLY_MENU.headerSubtitle,
          headerTagline: parsed.headerTagline || DEFAULT_WEEKLY_MENU.headerTagline,
          contactName: parsed.contactName || DEFAULT_WEEKLY_MENU.contactName,
          contactPhone: parsed.contactPhone || DEFAULT_WEEKLY_MENU.contactPhone,
          updated_at: parsed.updated_at
        };
      }
    }
  } catch (err) {
    console.error('Error reading saved header settings:', err);
  }
  return {
    headerTitle: DEFAULT_WEEKLY_MENU.headerTitle,
    headerSubtitle: DEFAULT_WEEKLY_MENU.headerSubtitle,
    headerTagline: DEFAULT_WEEKLY_MENU.headerTagline,
    contactName: DEFAULT_WEEKLY_MENU.contactName,
    contactPhone: DEFAULT_WEEKLY_MENU.contactPhone
  };
}

export async function saveFlyerHeaderSettings(headerData) {
  const payload = {
    headerTitle: (headerData.headerTitle ?? DEFAULT_WEEKLY_MENU.headerTitle).trim(),
    headerSubtitle: (headerData.headerSubtitle ?? DEFAULT_WEEKLY_MENU.headerSubtitle).trim(),
    headerTagline: (headerData.headerTagline ?? DEFAULT_WEEKLY_MENU.headerTagline).trim(),
    contactName: (headerData.contactName ?? DEFAULT_WEEKLY_MENU.contactName).trim(),
    contactPhone: (headerData.contactPhone ?? DEFAULT_WEEKLY_MENU.contactPhone).trim(),
    updated_at: new Date().toISOString()
  };

  try {
    localStorage.setItem(LOCAL_FLYER_HEADER_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('Error writing local header settings:', err);
  }

  // Sincronizar también con Supabase en la tabla flyer_templates si está disponible
  try {
    const { data, error } = await supabase
      .from('flyer_templates')
      .upsert([
        {
          id: '00000000-0000-0000-0000-000000000001',
          title: 'Configuración de Cabecera Predeterminada',
          type: 'header_settings',
          content: payload,
          updated_at: new Date().toISOString()
        }
      ]);
    if (!error) {
      return { success: true, data: payload, syncedSupabase: true };
    }
  } catch (err) {
    console.warn('Supabase flyer header settings sync fallback:', err);
  }

  return { success: true, data: payload, syncedSupabase: false };
}

export function resetFlyerHeaderSettings() {
  try {
    localStorage.removeItem(LOCAL_FLYER_HEADER_KEY);
  } catch (err) {
    console.error('Error resetting flyer header settings:', err);
  }
  return {
    headerTitle: DEFAULT_WEEKLY_MENU.headerTitle,
    headerSubtitle: DEFAULT_WEEKLY_MENU.headerSubtitle,
    headerTagline: DEFAULT_WEEKLY_MENU.headerTagline,
    contactName: DEFAULT_WEEKLY_MENU.contactName,
    contactPhone: DEFAULT_WEEKLY_MENU.contactPhone
  };
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
export async function getFlyerBlob(elementId, format = 'png') {
  const node = document.getElementById(elementId);
  if (!node) {
    throw new Error('Elemento del flyer no encontrado en el DOM');
  }

  // Dimensiones fijas virtuales para renderizado ultra-nítido sin importar
  // si el usuario está en móvil (340px) o pantalla grande (1920px).
  // Evita el solapamiento de textos causado por el cálculo de altura en WebKit.
  const exportOptions = {
    pixelRatio: 3.0,
    cacheBust: true,
    quality: 0.98,
    width: 440,
    style: {
      transform: 'none',
      width: '440px',
      maxWidth: '440px',
      minWidth: '440px',
      margin: '0',
      boxSizing: 'border-box'
    }
  };

  try {
    const blob = await toBlob(node, exportOptions);
    if (blob) return blob;
  } catch (err) {
    console.warn('toBlob error, fallback to toPng -> blob:', err);
  }

  // Fallback: toPng -> fetch blob
  const dataUrl = await toPng(node, exportOptions);
  const res = await fetch(dataUrl);
  return await res.blob();
}

export async function downloadFlyerImage(elementId, fileName = 'carta-semanal-bachan.png', format = 'png') {
  const node = document.getElementById(elementId);
  if (!node) {
    throw new Error('Elemento del flyer no encontrado en el DOM');
  }

  const exportOptions = {
    pixelRatio: 3.0,
    cacheBust: true,
    quality: 0.98,
    width: 440,
    style: {
      transform: 'none',
      width: '440px',
      maxWidth: '440px',
      minWidth: '440px',
      margin: '0',
      boxSizing: 'border-box'
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

export async function copyFlyerImageToClipboard(elementId) {
  const blob = await getFlyerBlob(elementId, 'png');
  if (navigator.clipboard && window.ClipboardItem) {
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    return true;
  }
  throw new Error('Tu navegador no soporta copiar imágenes directamente al portapapeles.');
}

export async function shareFlyerToWhatsApp({ elementId, text, fileName = 'carta-semanal-bachan.png' }) {
  const blob = await getFlyerBlob(elementId, 'png');
  const file = new File([blob], fileName, { type: 'image/png' });

  // 1. Probar Web Share API nativa con soporte de archivos (Móviles iOS / Android / Mac Safari)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: 'Carta Semanal BaChan BentoBox',
        text: text,
        files: [file]
      });
      return { method: 'native_share', success: true };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { method: 'native_share', cancelled: true };
      }
      console.warn('navigator.share falló o fue rechazado, ejecutando flujo web desktop:', err);
    }
  }

  // 2. Flujo Desktop / Navegador sin soporte de compartir archivos nativo:
  // Intentar copiar la imagen directamente al portapapeles del sistema
  let copiedImage = false;
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      copiedImage = true;
    }
  } catch (clipErr) {
    console.warn('No se pudo copiar automáticamente al portapapeles:', clipErr);
  }

  // Descargar también el archivo automáticamente como respaldo
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (dlErr) {
    console.warn('Descarga automática falló:', dlErr);
  }

  // Abrir WhatsApp con el texto preparado
  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank');

  return {
    method: 'desktop_flow',
    copiedImage,
    success: true
  };
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
