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
  await page.click(selector);
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await wait(500);
  for (const char of text) {
    await page.type(selector, char, { delay: 100 });
  }
}

// ── ENDPOINTS ───────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.send('🤖 Servidor Robot Bachan Activo (v2.12.5)');
});

app.post('/sync-mercadona', async (req, res) => {
  const { skus } = req.body;
  const token = process.env.BROWSERLESS_TOKEN || '2UU9JlwwxGmtmYf6d668ca73630ff75fec7e3aa01583de3bb';

  if (!skus || !Array.isArray(skus)) {
    return res.status(400).json({ success: false, error: 'SKUs no válidos' });
  }

  console.log(`\n[ROBOT] 🚀 Iniciando v2.12.5 (Modo Estable) para ${skus.length} productos...`);

  let browser = null;
  try {
    const browserWSEndpoint = `wss://chrome.browserless.io?token=${token}&--window-size=1280,800`;
    
    browser = await puppeteerExtra.connect({
      browserWSEndpoint,
      defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(90000);

    // Bloqueo ligero de recursos
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'font', 'media'].includes(req.resourceType())) req.abort();
      else req.continue();
    });

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // 1. Identificación Lenta y Segura
    console.log('[ROBOT] 1/3 Identificando sesión (Modo Estable)...');
    await page.goto('https://tienda.mercadona.es/?authenticate-user=', { waitUntil: 'load' });
    await wait(3000); // Tiempo de asentamiento
    
    await page.keyboard.press('Escape');
    await wait(500);
    await page.evaluate(() => {
      document.querySelector('button[data-testid="cookie-policy-accept"]')?.click();
    });

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
        await wait(3000);
        console.log('[ROBOT] ✅ Sesión preparada.');
      }
    }

    // 2. Sincronización con Reintentos
    console.log('[ROBOT] 2/3 Procesando productos con sistema de reintentos...');
    const itemsAdded = [];

    for (const sku of skus) {
      let retryCount = 0;
      let success = false;

      while (retryCount < 2 && !success) {
        try {
          const productUrl = `https://tienda.mercadona.es/product/${sku}/`;
          console.log(`[DEBUG] SKU ${sku} (Intento ${retryCount + 1}): Navegando a ${productUrl}`);
          
          await page.goto(productUrl, { waitUntil: 'load' });
          await wait(3000); // Esperar a que la página se asiente

          // Cerrar posibles popups
          await page.keyboard.press('Escape');

          // Búsqueda robusta por texto usando evaluate (más estable que $x en entornos remotos)
          const added = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const btn = buttons.find(b => 
              b.innerText.includes('Añadir al carro') || 
              b.innerText.includes('Añadir') ||
              b.className.includes('add-button')
            );
            
            if (btn && !btn.disabled) {
              btn.scrollIntoView();
              btn.click();
              return true;
            }
            return false;
          });

          if (added) {
            console.log(`[OK] SKU ${sku} añadido correctamente.`);
            itemsAdded.push(sku);
            success = true;
          } else {
            console.log(`[WARN] Botón no encontrado para SKU ${sku}. Reintentando...`);
            retryCount++;
            await wait(2000);
          }
        } catch (err) {
          console.error(`[RETRY ERROR SKU ${sku}]`, err.message);
          retryCount++;
          await wait(2000);
        }
      }
      
      if (success) await wait(2000); // Pausa entre productos
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
  console.log(`🚀 Bachan Robot v2.12.5 escuchando en puerto ${port}`);
});
