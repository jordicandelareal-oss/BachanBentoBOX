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
const randomDelay = (min = 80, max = 200) => Math.floor(Math.random() * (max - min + 1)) + min;

// Utilidades de simulación humana
async function humanType(page, selector, text) {
  await page.waitForSelector(selector, { visible: true, timeout: 15000 });
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await wait(randomDelay(150, 350));
  for (const char of text) {
    await page.type(selector, char, { delay: randomDelay(80, 150) });
  }
}

// ── ENDPOINTS ───────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.send('🤖 Servidor Robot Bachan Activo (v2.11.9)');
});

app.post('/sync-mercadona', async (req, res) => {
  const { skus } = req.body;
  const token = process.env.BROWSERLESS_TOKEN || '2UU9JlwwxGmtmYf6d668ca73630ff75fec7e3aa01583de3bb';

  if (!skus || !Array.isArray(skus)) {
    return res.status(400).json({ success: false, error: 'SKUs no válidos' });
  }

  console.log(`\n[ROBOT] 🚀 Iniciando sincronización de ${skus.length} productos vía Búsqueda...`);

  let browser = null;
  try {
    const browserWSEndpoint = `wss://chrome.browserless.io?token=${token}&--window-size=1280,800`;
    
    browser = await puppeteerExtra.connect({
      browserWSEndpoint,
      defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);

    // Bloqueo de recursos pesados
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'font', 'media'].includes(type) || req.url().includes('analytics')) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // 1. Login/Identificación
    console.log('[ROBOT] 1/4 Accediendo a Mercadona...');
    await page.goto('https://tienda.mercadona.es/?authenticate-user=', { waitUntil: 'networkidle2' });

    // Aceptar cookies
    await page.evaluate(() => {
      const btn = document.querySelector('button[data-testid="cookie-policy-accept"]') || 
                  Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Aceptar'));
      if (btn) btn.click();
    });

    // 2. CP 03005
    try {
      const cpInput = await page.$('input[name="postalCode"]');
      if (cpInput) {
        console.log('[ROBOT] 2/4 Configurando zona 03005...');
        await page.type('input[name="postalCode"]', '03005');
        await page.keyboard.press('Enter');
        await wait(2000);
      }
    } catch (_) {}

    // 3. Login real
    console.log('[ROBOT] 3/4 Identificando usuario...');
    const emailInput = await page.$('input[name="email"]');
    if (emailInput) {
      await humanType(page, 'input[name="email"]', process.env.MERCADONA_USER || 'jordicocinab@gmail.com');
      await page.keyboard.press('Enter');
      await wait(1500);
      
      const passInput = await page.$('input[name="password"]');
      if (passInput) {
        await humanType(page, 'input[name="password"]', process.env.MERCADONA_PASS || 'soccersmart123');
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2' }),
          page.keyboard.press('Enter')
        ]);
        console.log('[ROBOT] ✅ Sesión iniciada.');
      }
    }

    // 4. Búsqueda y Añadido de Productos
    console.log('[ROBOT] 4/4 Procesando productos mediante búsqueda...');
    const itemsAdded = [];

    // Ir a la tienda principal para tener el buscador
    await page.goto('https://tienda.mercadona.es/', { waitUntil: 'networkidle2' });

    for (const sku of skus) {
      try {
        console.log(`[ROBOT] Buscando ID: ${sku}...`);
        
        // Esperar a que el buscador sea visible
        await page.waitForSelector('input[type="search"]', { visible: true, timeout: 15000 });
        
        // Limpiar búsqueda anterior y escribir nuevo SKU con delay
        await page.click('input[type="search"]', { clickCount: 3 });
        await page.keyboard.press('Backspace');
        await page.type('input[type="search"]', String(sku), { delay: 100 });
        await page.keyboard.press('Enter');
        
        // Esperar a que carguen los resultados
        await wait(2500);

        // Intentar añadir el producto
        const added = await page.evaluate(() => {
          // Buscamos el contenedor del producto y su botón
          const btn = document.querySelector('button[data-testid="product-button-add"]') || 
                      document.querySelector('.button--primary') ||
                      document.querySelector('button[aria-label*="Añadir al carrito"]');
          
          if (btn && !btn.disabled) {
            btn.scrollIntoView();
            btn.click();
            return true;
          }
          return false;
        });

        if (added) {
          console.log(`[ROBOT] ✅ Producto ${sku} añadido al carro.`);
          itemsAdded.push(sku);
          await wait(1500); // Pausa para que Mercadona registre el cambio
        } else {
          console.log(`[ERROR] No encontré el botón para el producto: ${sku}`);
        }
      } catch (e) {
        console.error(`[ERROR] Error procesando SKU ${sku}: ${e.message}`);
      }
    }

    await browser.close();
    console.log(`[ROBOT] ✨ Fin. Total añadidos: ${itemsAdded.length}`);
    res.json({ success: true, itemsAdded });

  } catch (error) {
    if (browser) await browser.close();
    console.error('[ROBOT FATAL ERROR]', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Bachan Robot v2.11.9 escuchando en puerto ${port}`);
});
