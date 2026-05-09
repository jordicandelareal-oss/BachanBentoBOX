import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import puppeteer from 'puppeteer-core';

// ── CONFIGURACIÓN ROBOT ──────────────────────────────────────────────────────
puppeteerExtra.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

app.use(express.json());

const wait = (ms) => new Promise(r => setTimeout(r, ms));

// ── ENDPOINTS ───────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.send('🤖 Servidor Robot Bachan Activo (v2.12.12 - Secure Session)');
});

app.post('/sync-mercadona', async (req, res) => {
  const { skus } = req.body;
  const token = process.env.BROWSERLESS_TOKEN || '2UU9JlwwxGmtmYf6d668ca73630ff75fec7e3aa01583de3bb';

  if (!skus || !Array.isArray(skus)) {
    return res.status(400).json({ success: false, error: 'SKUs no válidos' });
  }

  console.log(`\n[ROBOT] 🚀 Iniciando v2.12.12 (Sesión Segura y Verificación de Carrito) para ${skus.length} productos...`);

  let browser = null;
  try {
    const args = '&--no-sandbox&--disable-setuid-sandbox&--disable-dev-shm-usage&--disable-accelerated-2d-canvas&--no-first-run&--no-zygote&--single-process';
    const browserWSEndpoint = `wss://chrome.browserless.io?token=${token}&--window-size=1280,800${args}`;
    
    browser = await puppeteerExtra.connect({
      browserWSEndpoint,
      defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);

    // User-Agent de Chrome real
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // 1. Zona de Venta y Cookies
    console.log('[ROBOT] 1/4 Estableciendo Zona de Venta...');
    await page.goto('https://tienda.mercadona.es/', { waitUntil: 'domcontentloaded' });
    await wait(3000);

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const acceptBtn = btns.find(b => 
        b.innerText.match(/Aceptar|Permitir/i) || 
        b.getAttribute('data-testid') === 'cookie-policy-accept'
      );
      if (acceptBtn) acceptBtn.click();
    });
    await wait(1500);

    const cpInput = await page.$('input[name="postalCode"]');
    if (cpInput) {
      await page.type('input[name="postalCode"]', '03005', { delay: 50 });
      await page.keyboard.press('Enter');
      await wait(3000);
      console.log('[ROBOT] ✅ Zona de Venta establecida (03005).');
    }

    // 2. Identificación Forzada y Verificación de Usuario
    console.log('[ROBOT] 2/4 Identificando sesión de forma rigurosa...');
    await page.goto('https://tienda.mercadona.es/?authenticate-user=', { waitUntil: 'domcontentloaded' });
    await wait(4000);
    
    await page.mouse.click(10, 10);
    await page.keyboard.press('Escape');
    await wait(1000);

    const emailIn = await page.$('input[name="email"]');
    if (emailIn) {
      await page.type('input[name="email"]', process.env.MERCADONA_USER || 'jordicocinab@gmail.com', { delay: 50 });
      await page.keyboard.press('Enter');
      await wait(1500);
      const passIn = await page.$('input[name="password"]');
      if (passIn) {
        await page.type('input[name="password"]', process.env.MERCADONA_PASS || 'soccersmart123', { delay: 50 });
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
          page.keyboard.press('Enter')
        ]);
        await wait(5000);
      }
    }

    // Verificación de que "Jordi" aparece en la página (sesión consolidada)
    const isSessionOk = await page.evaluate(() => {
      return document.body.innerText.toLowerCase().includes('jordi');
    });

    if (!isSessionOk) {
      console.error('[ROBOT FATAL ERROR] [FALLO DE SESIÓN] No se detectó el nombre del usuario en la web. Cookies o login bloqueados.');
      await browser.close();
      return res.status(500).json({ success: false, error: 'Fallo de Sesión: Mercadona bloqueó el login.' });
    }
    console.log('[ROBOT] ✅ Sesión verificada y mantenida para el usuario.');

    // 3. Sincronización y Verificación Post-Click en /cart/
    console.log('[ROBOT] 3/4 Sincronizando y verificando carrito...');
    const itemsAdded = [];

    for (const sku of skus) {
      try {
        const productUrl = `https://tienda.mercadona.es/product/${sku}/`;
        console.log(`[DEBUG] Visitando ficha: ${productUrl}`);
        
        await page.goto(productUrl, { waitUntil: 'domcontentloaded' });
        await wait(4000);

        await page.mouse.click(10, 10);

        const scanResult = await page.evaluate(() => {
          const botones = Array.from(document.querySelectorAll('button'));
          const btnCompra = botones.find(b => 
            b.innerText.includes('Añadir') || 
            b.innerHTML.includes('cart') ||
            b.className.includes('add-button') ||
            b.className.includes('main-button') ||
            b.className.includes('button--primary') ||
            b.getAttribute('data-testid') === 'product-format-selection-add-button'
          );
          
          if (btnCompra && !btnCompra.disabled) {
            btnCompra.scrollIntoView();
            btnCompra.click();
            return { success: true, text: btnCompra.innerText };
          }
          return { success: false };
        });

        if (scanResult.success) {
          console.log(`[DEBUG] Click detectado en botón: "${scanResult.text}". Procediendo a verificación en carrito...`);
          await wait(2000);

          // VERIFICACIÓN DE FUEGO: NAVEGAR AL CARRITO
          await page.goto('https://tienda.mercadona.es/cart/', { waitUntil: 'domcontentloaded' });
          await wait(4000);

          const cartHasItems = await page.evaluate(() => {
            const bodyText = document.body.innerText.toLowerCase();
            // Buscar indicadores de carrito vacío o "0"
            if (bodyText.includes('tu cesta está vacía') || bodyText.includes('carro vacío') || bodyText.match(/0 productos/i)) {
              return false;
            }
            // Buscar indicadores de carrito con elementos
            const hasCheckoutBtn = Array.from(document.querySelectorAll('button')).some(b => 
              b.innerText.toLowerCase().includes('tramitar') || 
              b.innerText.toLowerCase().includes('pagar') || 
              b.innerText.toLowerCase().includes('pedido')
            );
            return hasCheckoutBtn || bodyText.includes('total'); // Si hay botón de tramitar o un total, hay items.
          });

          if (cartHasItems) {
            console.log(`[OK] AÑADIDO: Producto ${sku} consolidado en el carrito.`);
            itemsAdded.push(sku);
          } else {
            console.log(`[FALLO DE SESIÓN] Producto ${sku}: El click no se registró en la cuenta (Carrito con 0 elementos).`);
          }
        } else {
          console.log(`[ERROR] No se encontró botón interactivo para SKU: ${sku}`);
        }
      } catch (err) {
        console.warn(`[SKIP SKU ${sku}] Error de navegación durante el proceso.`);
      }
    }

    await browser.close();
    console.log(`[ROBOT] 4/4 ✨ Finalizado. Añadidos REALES: ${itemsAdded.length}`);
    res.json({ success: true, itemsAdded });

  } catch (error) {
    if (browser) await browser.close();
    console.error('[ROBOT FATAL ERROR]', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Bachan Robot v2.12.12 escuchando en puerto ${port}`);
});
