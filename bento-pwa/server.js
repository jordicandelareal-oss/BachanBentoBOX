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
  res.send('🤖 Servidor Robot Bachan Activo (v2.12.8)');
});

app.post('/sync-mercadona', async (req, res) => {
  const { skus } = req.body;
  const token = process.env.BROWSERLESS_TOKEN || '2UU9JlwwxGmtmYf6d668ca73630ff75fec7e3aa01583de3bb';

  if (!skus || !Array.isArray(skus)) {
    return res.status(400).json({ success: false, error: 'SKUs no válidos' });
  }

  console.log(`\n[ROBOT] 🚀 Iniciando v2.12.8 (Click Coordenadas) para ${skus.length} productos...`);

  let browser = null;
  try {
    const browserWSEndpoint = `wss://chrome.browserless.io?token=${token}&--window-size=1280,800`;
    
    browser = await puppeteerExtra.connect({
      browserWSEndpoint,
      defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(90000);

    // User Agent Real para evitar sospechas
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // 1. Identificación
    console.log('[ROBOT] 1/3 Identificando sesión...');
    await page.goto('https://tienda.mercadona.es/?authenticate-user=', { waitUntil: 'load' });
    await wait(5000);
    
    await page.keyboard.press('Escape');
    await wait(1000);

    const emailIn = await page.$('input[name="email"]');
    if (emailIn) {
      await page.type('input[name="email"]', process.env.MERCADONA_USER || 'jordicocinab@gmail.com', { delay: 100 });
      await page.keyboard.press('Enter');
      await wait(2000);
      const passIn = await page.$('input[name="password"]');
      if (passIn) {
        await page.type('input[name="password"]', process.env.MERCADONA_PASS || 'soccersmart123', { delay: 100 });
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load' }),
          page.keyboard.press('Enter')
        ]);
        await wait(5000);
        console.log('[ROBOT] ✅ Sesión activa.');
      }
    }

    // 2. Click por Coordenadas Reales
    console.log('[ROBOT] 2/3 Sincronizando productos...');
    const itemsAdded = [];

    for (const sku of skus) {
      try {
        const productUrl = `https://tienda.mercadona.es/product/${sku}/`;
        console.log(`[DEBUG] Procesando SKU ${sku}: ${productUrl}`);
        
        await page.goto(productUrl, { waitUntil: 'load' });
        await wait(4000);

        const targetSelector = 'button[data-testid="product-format-selection-add-button"]';
        
        // Espera de visibilidad
        await page.waitForSelector(targetSelector, { visible: true, timeout: 20000 });

        // Obtener Coordenadas
        const rect = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          el.scrollIntoView();
          const {top, left, width, height} = el.getBoundingClientRect();
          return {x: left + width/2, y: top + height/2, oldText: el.innerText};
        }, targetSelector);

        if (rect) {
          console.log(`[ROBOT] Clicando coordenadas: X=${rect.x}, Y=${rect.y}`);
          await page.mouse.click(rect.x, rect.y);
          
          // 3. Verificación de éxito
          await wait(3000);
          const isAdded = await page.evaluate((sel, oldText) => {
            const el = document.querySelector(sel);
            return el && el.innerText !== oldText;
          }, targetSelector, rect.oldText);

          if (isAdded) {
            console.log(`[OK] SKU ${sku} confirmado en el carrito.`);
            itemsAdded.push(sku);
          } else {
            console.log(`[WARN] El click no cambió el estado del botón para SKU ${sku}.`);
          }
        }
      } catch (err) {
        console.warn(`[SKIP SKU ${sku}] Error: ${err.message}`);
      }
    }

    await browser.close();
    console.log(`[ROBOT] 3/3 ✨ Finalizado. Total confirmados: ${itemsAdded.length}`);
    res.json({ success: true, itemsAdded });

  } catch (error) {
    if (browser) await browser.close();
    console.error('[ROBOT FATAL ERROR]', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Bachan Robot v2.12.8 escuchando en puerto ${port}`);
});
