import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import puppeteer from 'puppeteer';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

/**
 * Lógica de Automatización Mercadona
 */
async function runMercadonaAutomation(skus) {
  console.log('\n--- INICIANDO AUTOMATIZACIÓN MERCADONA ---');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Queremos ver el proceso en el PC del usuario
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Navegar a Mercadona
    console.log('🌐 [1/5] Accediendo a Mercadona Tienda...');
    await page.goto('https://tienda.mercadona.es/', { waitUntil: 'networkidle2' });

    // 2. Manejo de Cookies
    try {
      const cookieBtn = await page.waitForSelector('button[data-testid="cookie-policy-accept"]', { timeout: 3000 });
      if (cookieBtn) {
        await cookieBtn.click();
        console.log('🍪 Cookies aceptadas.');
      }
    } catch (e) {
      console.log('ℹ️ No se detectó banner de cookies.');
    }

    // 3. Código Postal (Necesario para ver precios y disponibilidad)
    try {
      const zipInput = await page.waitForSelector('input[name="postalCode"]', { timeout: 3000 });
      if (zipInput) {
        console.log('📍 Introduciendo Código Postal (28001)...');
        await page.type('input[name="postalCode"]', '28001');
        await page.keyboard.press('Enter');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
      }
    } catch (e) {
      console.log('ℹ️ Código Postal ya configurado o no solicitado.');
    }

    // 4. Login
    console.log('🔐 [2/5] Intentando inicio de sesión con ' + process.env.MERCADONA_USER);
    await page.goto('https://tienda.mercadona.es/login', { waitUntil: 'networkidle2' });
    
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', process.env.MERCADONA_USER || '');
    await page.type('input[name="password"]', process.env.MERCADONA_PASS || '');
    
    const loginBtn = await page.$('button[type="submit"]');
    if (loginBtn) {
      await loginBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      console.log('✅ [3/5] Sesión iniciada con éxito.');
    }

    // 5. Añadir productos por SKU
    console.log('🛒 [4/5] Procesando lista de productos...');
    for (const sku of skus) {
      console.log(`   🔍 Buscando SKU: ${sku}...`);
      await page.goto(`https://tienda.mercadona.es/search-results?query=${sku}`, { waitUntil: 'networkidle2' });

      try {
        const addBtn = await page.waitForSelector('button[data-testid="product-button-add"]', { timeout: 5000 });
        if (addBtn) {
          await addBtn.click();
          console.log(`   ✅ SKU ${sku} añadido al carrito.`);
          // Pausa estética para no saturar
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (e) {
        console.log(`   ⚠️ No se pudo encontrar el botón de añadir para SKU ${sku}.`);
      }
    }

    console.log('✨ [5/5] Sincronización completada con éxito.');
    return { success: true, message: 'Sincronización completada.' };
    
  } catch (error) {
    console.error('❌ ERROR DURANTE LA AUTOMATIZACIÓN:', error.message);
    throw error; // Propagar para enviar al frontend
  }
}

/**
 * Endpoint de Sincronización
 */
app.post('/sync-mercadona', async (req, res) => {
  const { skus } = req.body;
  
  if (!skus || !Array.isArray(skus) || skus.length === 0) {
    return res.status(400).json({ error: 'No se recibieron SKUs válidos para sincronizar.' });
  }

  console.log(`\n📩 Petición de sincronización recibida: [${skus.join(', ')}]`);
  
  try {
    const result = await runMercadonaAutomation(skus);
    res.json(result);
  } catch (error) {
    console.error('🔴 Error enviado al frontend:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Arranque del Servidor
 */
app.listen(PORT, () => {
  console.log('================================================');
  console.log(`🚀 SERVIDOR PUENTE BACHAN -> MERCADONA ACTIVO`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log('================================================');
  console.log('Mantén esta terminal abierta para procesar pedidos.');
});
