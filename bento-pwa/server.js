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

async function humanType(page, selector, text) {
  await page.waitForSelector(selector, { visible: true, timeout: 15000 });
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await wait(500);
  for (const char of text) {
    await page.type(selector, char, { delay: 100 });
  }
}

// ── ENDPOINTS ───────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.send('🤖 Servidor Robot Bachan Activo (v2.12.7)');
});

app.post('/sync-mercadona', async (req, res) => {
  const { skus } = req.body;
  const token = process.env.BROWSERLESS_TOKEN || '2UU9JlwwxGmtmYf6d668ca73630ff75fec7e3aa01583de3bb';

  if (!skus || !Array.isArray(skus)) {
    return res.status(400).json({ success: false, error: 'SKUs no válidos' });
  }

  console.log(`\n[ROBOT] 🚀 Iniciando v2.12.7 (Selector Técnico) para ${skus.length} productos...`);

  let browser = null;
  try {
    const browserWSEndpoint = `wss://chrome.browserless.io?token=${token}&--window-size=1280,800`;
    
    browser = await puppeteerExtra.connect({
      browserWSEndpoint,
      defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(90000);

    // Bloqueo ligero
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'font', 'media'].includes(req.resourceType())) req.abort();
      else req.continue();
    });

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // 1. Identificación
    console.log('[ROBOT] 1/3 Identificando...');
    await page.goto('https://tienda.mercadona.es/?authenticate-user=', { waitUntil: 'load' });
    await wait(5000);
    
    await page.keyboard.press('Escape');
    await wait(1000);

    const emailIn = await page.$('input[name="email"]');
    if (emailIn) {
      await humanType(page, 'input[name="email"]', process.env.MERCADONA_USER || 'jordicocinab@gmail.com');
      await page.keyboard.press('Enter');
      await wait(2000);
      const passIn = await page.$('input[name="password"]');
      if (passIn) {
        await humanType(page, 'input[name="password"]', process.env.MERCADONA_PASS || 'soccersmart123');
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load' }),
          page.keyboard.press('Enter')
        ]);
        await wait(5000);
        console.log('[ROBOT] ✅ Login OK.');
      }
    }

    // 2. Proceso Técnico de Click
    console.log('[ROBOT] 2/3 Sincronizando productos...');
    const itemsAdded = [];

    for (const sku of skus) {
      try {
        const productUrl = `https://tienda.mercadona.es/product/${sku}/`;
        console.log(`[DEBUG] Procesando SKU ${sku}: ${productUrl}`);
        
        await page.goto(productUrl, { waitUntil: 'load' });
        await wait(4000); // Espera de renderizado

        // Selector técnico maestro
        const targetSelector = 'button[data-testid="product-format-selection-add-button"]';
        
        // Espera dinámica a que el botón exista y sea visible
        await page.waitForSelector(targetSelector, { visible: true, timeout: 15000 });

        // Scroll forzado para activación
        await page.evaluate((sel) => {
          document.querySelector(sel)?.scrollIntoView();
        }, targetSelector);
        
        await wait(1000);

        // Click técnico final
        const btn = await page.$(targetSelector);
        if (btn) {
          await btn.click();
          console.log(`[OK] Botón técnico pulsado para SKU ${sku}`);
          itemsAdded.push(sku);
          await wait(2000);
        } else {
          console.log(`[WARN] Botón no encontrado para SKU ${sku}`);
        }
      } catch (err) {
        console.warn(`[SKIP SKU ${sku}] Error: ${err.message}`);
      }
    }

    await browser.close();
    console.log(`[ROBOT] 3/3 ✨ Finalizado. Total: ${itemsAdded.length}`);
    res.json({ success: true, itemsAdded });

  } catch (error) {
    if (browser) await browser.close();
    console.error('[ROBOT FATAL ERROR]', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Bachan Robot v2.12.7 escuchando en puerto ${port}`);
});
