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
  res.send('🤖 Servidor Robot Bachan Activo (v2.12.11 - Ultra-Light)');
});

app.post('/sync-mercadona', async (req, res) => {
  const { skus } = req.body;
  const token = process.env.BROWSERLESS_TOKEN || '2UU9JlwwxGmtmYf6d668ca73630ff75fec7e3aa01583de3bb';

  if (!skus || !Array.isArray(skus)) {
    return res.status(400).json({ success: false, error: 'SKUs no válidos' });
  }

  console.log(`\n[ROBOT] 🚀 Iniciando v2.12.11 (Modo Ultra-Light) para ${skus.length} productos...`);

  let browser = null;
  try {
    // Argumentos Ultra-Light para Browserless / Puppeteer
    const args = '&--no-sandbox&--disable-setuid-sandbox&--disable-dev-shm-usage&--disable-accelerated-2d-canvas&--no-first-run&--no-zygote&--single-process';
    const browserWSEndpoint = `wss://chrome.browserless.io?token=${token}&--window-size=1280,800${args}`;
    
    browser = await puppeteerExtra.connect({
      browserWSEndpoint,
      defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000); // Reducido a 60s para evitar SIGTERM

    // User-Agent de Incógnito (Chrome Windows actualizado)
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // 1. Zona de Venta y Cookies
    console.log('[ROBOT] 1/4 Estableciendo Zona de Venta...');
    await page.goto('https://tienda.mercadona.es/', { waitUntil: 'domcontentloaded' });
    await wait(2000);

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const acceptBtn = btns.find(b => 
        b.innerText.match(/Aceptar|Permitir/i) || 
        b.getAttribute('data-testid') === 'cookie-policy-accept'
      );
      if (acceptBtn) acceptBtn.click();
    });
    await wait(1000);

    const cpInput = await page.$('input[name="postalCode"]');
    if (cpInput) {
      await page.type('input[name="postalCode"]', '03005', { delay: 50 });
      await page.keyboard.press('Enter');
      await wait(2000);
      console.log('[ROBOT] ✅ Zona de Venta establecida (03005).');
    }

    // 2. Identificación
    console.log('[ROBOT] 2/4 Identificando sesión...');
    await page.goto('https://tienda.mercadona.es/?authenticate-user=', { waitUntil: 'domcontentloaded' });
    await wait(3000);
    
    await page.mouse.click(10, 10);
    await page.keyboard.press('Escape');
    await wait(500);

    const emailIn = await page.$('input[name="email"]');
    if (emailIn) {
      await page.type('input[name="email"]', process.env.MERCADONA_USER || 'jordicocinab@gmail.com', { delay: 50 });
      await page.keyboard.press('Enter');
      await wait(1000);
      const passIn = await page.$('input[name="password"]');
      if (passIn) {
        await page.type('input[name="password"]', process.env.MERCADONA_PASS || 'soccersmart123', { delay: 50 });
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
          page.keyboard.press('Enter')
        ]);
        await wait(3000);
        console.log('[ROBOT] ✅ Sesión activa.');
      }
    }

    // 3. Rastreo Universal de Botones
    console.log('[ROBOT] 3/4 Sincronizando productos...');
    const itemsAdded = [];

    for (const sku of skus) {
      try {
        const productUrl = `https://tienda.mercadona.es/product/${sku}/`;
        console.log(`[DEBUG] Visitando ficha: ${productUrl}`);
        
        await page.goto(productUrl, { waitUntil: 'domcontentloaded' });
        await wait(3000);

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
            return { success: true, count: botones.length, text: btnCompra.innerText };
          }
          return { success: false, count: botones.length };
        });

        if (scanResult.success) {
          console.log(`[OK] Producto ${sku} añadido (Botón: "${scanResult.text}")`);
          itemsAdded.push(sku);
          await wait(1500);
        } else {
          console.log(`[ERROR] No se detectó botón de compra para SKU: ${sku}. Botones en página: ${scanResult.count}`);
          // Eliminado log HTML completo para no saturar memoria
        }
      } catch (err) {
        console.warn(`[SKIP SKU ${sku}] Error de navegación mitigado.`);
      }
    }

    await browser.close();
    console.log(`[ROBOT] 4/4 ✨ Finalizado. Total añadidos: ${itemsAdded.length}`);
    res.json({ success: true, itemsAdded });

  } catch (error) {
    if (browser) await browser.close();
    console.error('[ROBOT FATAL ERROR]', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Bachan Robot v2.12.11 escuchando en puerto ${port}`);
});
