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

async function humanType(page, selector, text) {
  await page.waitForSelector(selector, { visible: true, timeout: 10000 });
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await wait(randomDelay(150, 350));
  for (const char of text) {
    await page.type(selector, char, { delay: randomDelay(80, 150) });
  }
}

// ── ENDPOINTS ───────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.send('🤖 Servidor Robot Bachan Activo (v2.12.3)');
});

app.post('/sync-mercadona', async (req, res) => {
  const { skus } = req.body;
  const token = process.env.BROWSERLESS_TOKEN || '2UU9JlwwxGmtmYf6d668ca73630ff75fec7e3aa01583de3bb';

  if (!skus || !Array.isArray(skus)) {
    return res.status(400).json({ success: false, error: 'SKUs no válidos' });
  }

  console.log(`\n[ROBOT] 🚀 Iniciando v2.12.3 (Ficha Directa) para ${skus.length} productos...`);

  let browser = null;
  try {
    const browserWSEndpoint = `wss://chrome.browserless.io?token=${token}&--window-size=1280,800`;
    
    browser = await puppeteerExtra.connect({
      browserWSEndpoint,
      defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);

    // Bloqueo de recursos (ligero para ver el botón)
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'font', 'media'].includes(req.resourceType())) req.abort();
      else req.continue();
    });

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // 1. Identificación
    console.log('[ROBOT] 1/3 Asegurando sesión...');
    await page.goto('https://tienda.mercadona.es/?authenticate-user=', { waitUntil: 'networkidle2' });
    
    // Cookies
    await page.evaluate(() => {
      document.querySelector('button[data-testid="cookie-policy-accept"]')?.click();
      document.querySelector('#onesignal-slidedown-cancel-button')?.click();
    });

    const emailIn = await page.$('input[name="email"]');
    if (emailIn) {
      await humanType(page, 'input[name="email"]', process.env.MERCADONA_USER || 'jordicocinab@gmail.com');
      await page.keyboard.press('Enter');
      await wait(1500);
      const passIn = await page.$('input[name="password"]');
      if (passIn) {
        await humanType(page, 'input[name="password"]', process.env.MERCADONA_PASS || 'soccersmart123');
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2' }),
          page.keyboard.press('Enter')
        ]);
        console.log('[ROBOT] ✅ Sesión activa.');
      }
    }

    // 2. Navegación Directa a Producto
    console.log('[ROBOT] 2/3 Añadiendo productos desde ficha directa...');
    const itemsAdded = [];

    for (const sku of skus) {
      try {
        const productUrl = `https://tienda.mercadona.es/product/${sku}/`;
        console.log(`[DEBUG] Intentando añadir desde ficha directa: ${productUrl}`);
        await page.goto(productUrl, { waitUntil: 'networkidle2' });
        
        await wait(2000); // Renderizado

        // Intentar selectores maestros
        const added = await page.evaluate(() => {
          const selectors = [
            'button.product-format-selection__add-button',
            'button.main-button',
            'button[data-testid="product-button-add"]',
            'button.button--primary'
          ];
          
          let btn = null;
          for (const s of selectors) {
            btn = document.querySelector(s);
            if (btn && !btn.disabled) break;
          }

          // Respaldo: por texto
          if (!btn) {
            const allBtns = Array.from(document.querySelectorAll('button'));
            btn = allBtns.find(b => b.innerText.includes('Añadir') || b.getAttribute('aria-label')?.includes('Añadir'));
          }

          if (btn && !btn.disabled) {
            btn.scrollIntoView();
            btn.click();
            return true;
          }
          return false;
        });

        if (added) {
          console.log(`[OK] Producto ${sku} añadido correctamente.`);
          itemsAdded.push(sku);
          await wait(1500);
        } else {
          console.log(`[ERROR] No encontré botón de compra para SKU: ${sku}`);
          const html = await page.content();
          console.log('[DEBUG] Fragmento HTML:', html.substring(0, 400));
        }
      } catch (err) {
        console.error(`[ERROR SKU ${sku}]`, err.message);
      }
    }

    await browser.close();
    console.log(`[ROBOT] 3/3 ✨ Sincronización terminada. Total: ${itemsAdded.length}`);
    res.json({ success: true, itemsAdded });

  } catch (error) {
    if (browser) await browser.close();
    console.error('[ROBOT FATAL ERROR]', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Bachan Robot v2.12.3 escuchando en puerto ${port}`);
});
