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
  res.send('🤖 Servidor Robot Bachan Activo (v2.11.7)');
});

app.post('/sync-mercadona', async (req, res) => {
  const { skus } = req.body;
  const token = process.env.BROWSERLESS_TOKEN || '2UU9JlwwxGmtmYf6d668ca73630ff75fec7e3aa01583de3bb';

  if (!skus || !Array.isArray(skus)) {
    return res.status(400).json({ success: false, error: 'SKUs no válidos' });
  }

  console.log(`\n[ROBOT] 🚀 Iniciando sincronización para ${skus.length} productos...`);

  let browser = null;
  try {
    const browserWSEndpoint = `wss://chrome.browserless.io?token=${token}&--window-size=1280,800`;
    
    browser = await puppeteerExtra.connect({
      browserWSEndpoint,
      defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();
    
    // Aumentamos el timeout a 60 segundos por defecto
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);

    // ── OPTIMIZACIÓN: Bloqueo de recursos pesados ──────────────────────────
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'font', 'media', 'stylesheet', 'other'].includes(type) || req.url().includes('google-analytics') || req.url().includes('facebook')) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // 1. Ir directo a la página de validación/login
    console.log('[ROBOT] 1/4 Navegando directo a login...');
    await page.goto('https://tienda.mercadona.es/?authenticate-user=', { waitUntil: 'networkidle2' });

    // Aceptar cookies (si aparecen)
    try {
      await page.evaluate(() => {
        const btn = document.querySelector('button[data-testid="cookie-policy-accept"]');
        if (btn) btn.click();
      });
    } catch (_) {}

    // 2. Código Postal 03005 (si lo pide)
    try {
      const cpInput = await page.$('input[name="postalCode"]');
      if (cpInput) {
        console.log('[ROBOT] 2/4 Introduciendo Código Postal 03005...');
        await page.type('input[name="postalCode"]', '03005');
        await page.keyboard.press('Enter');
        await wait(2000);
      }
    } catch (_) {}

    // 3. Login
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
        console.log('[ROBOT] ✅ Login completado con éxito.');
      }
    } else {
      console.log('[ROBOT] ℹ️ Usuario ya identificado o formulario no visible.');
    }

    // 4. Añadir Productos (en paralelo)
    console.log(`[ROBOT] 4/4 Sincronizando ${skus.length} productos...`);
    const itemsAdded = [];
    
    await Promise.all(skus.map(async (sku) => {
      const p = await browser.newPage();
      try {
        await p.setRequestInterception(true);
        p.on('request', (r) => {
          if (['image', 'font', 'media', 'stylesheet'].includes(r.resourceType())) r.abort();
          else r.continue();
        });
        
        await p.goto(`https://tienda.mercadona.es/product/${sku}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const done = await p.evaluate(() => {
          const btn = document.querySelector('button[data-testid="product-button-add"]');
          if (btn) { btn.click(); return true; }
          return false;
        });
        
        if (done) {
          console.log(`[ROBOT] 📦 Producto ${sku} añadido.`);
          itemsAdded.push(sku);
        }
        await p.close();
      } catch (e) {
        console.error(`[ROBOT] ❌ Error en SKU ${sku}: ${e.message}`);
        await p.close();
      }
    }));

    await browser.close();
    console.log(`[ROBOT] ✨ Sincronización finalizada. Total: ${itemsAdded.length} productos.`);
    res.json({ success: true, itemsAdded });

  } catch (error) {
    if (browser) await browser.close();
    console.error('[ROBOT FATAL ERROR]', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Bachan Robot v2.11.7 escuchando en puerto ${port}`);
});
