import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import puppeteer from 'puppeteer-core';

// Configuración Stealth
puppeteerExtra.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const randomDelay = (min = 80, max = 200) => Math.floor(Math.random() * (max - min + 1)) + min;

async function humanType(page, selector, text) {
  await page.waitForSelector(selector, { visible: true, timeout: 10000 });
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await wait(randomDelay(150, 350));
  for (const char of text) {
    await page.type(selector, char, { delay: randomDelay(80, 170) });
  }
}

async function humanClick(page, selector, timeout = 8000) {
  await page.waitForSelector(selector, { visible: true, timeout });
  await page.hover(selector);
  await wait(randomDelay(200, 450));
  await page.click(selector);
}

// Endpoint de salud para Railway
app.get('/', (req, res) => {
  res.send('🤖 Bachan Robot Backend is RUNNING (Railway Edition)');
});

// Ruta de Sincronización
app.post('/sync', async (req, res) => {
  const { skus } = req.body;
  const token = process.env.BROWSERLESS_TOKEN || '2UU9JlwwxGmtmYf6d668ca73630ff75fec7e3aa01583de3bb';

  if (!skus || !Array.isArray(skus)) {
    return res.status(400).json({ success: false, error: 'SKUs no válidos' });
  }

  console.log(`\n[ROBOT] Recibida solicitud para ${skus.length} SKUs...`);

  let browser = null;
  try {
    const browserWSEndpoint = `wss://chrome.browserless.io?token=${token}&--window-size=1280,800`;
    
    browser = await puppeteerExtra.connect({
      browserWSEndpoint,
      defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();
    
    // Bloqueo de recursos para velocidad
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'font', 'media'].includes(req.resourceType())) req.abort();
      else req.continue();
    });

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // Flujo Mercadona
    console.log('[ROBOT] Navegando a login...');
    await page.goto('https://tienda.mercadona.es/?authenticate-user=', { waitUntil: 'networkidle2', timeout: 30000 });

    // Aceptar cookies
    await page.evaluate(() => {
      const btn = document.querySelector('button[data-testid="cookie-policy-accept"]');
      if (btn) btn.click();
    });

    // Código Postal
    const hasCP = await page.$('input[name="postalCode"]');
    if (hasCP) {
      await page.type('input[name="postalCode"]', '03005');
      await page.keyboard.press('Enter');
      await wait(1500);
    }

    // Login
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
        console.log('[ROBOT] Login exitoso.');
      }
    }

    // Añadir productos en paralelo
    const itemsAdded = [];
    await Promise.all(skus.map(async (sku) => {
      const p = await browser.newPage();
      try {
        await p.setRequestInterception(true);
        p.on('request', (r) => {
          if (['image', 'font', 'media'].includes(r.resourceType())) r.abort();
          else r.continue();
        });
        await p.goto(`https://tienda.mercadona.es/product/${sku}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const done = await p.evaluate(() => {
          const btn = document.querySelector('button[data-testid="product-button-add"]');
          if (btn) { btn.click(); return true; }
          return false;
        });
        if (done) itemsAdded.push(sku);
        await p.close();
      } catch (e) {
        await p.close();
      }
    }));

    await browser.close();
    console.log(`[ROBOT] Sincronización completada. ${itemsAdded.length} productos añadidos.`);
    res.json({ success: true, itemsAdded });

  } catch (error) {
    if (browser) await browser.close();
    console.error('[ROBOT ERROR]', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Bachan Robot escuchando en puerto ${port}`);
});
