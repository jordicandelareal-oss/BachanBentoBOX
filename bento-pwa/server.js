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
  res.send('🤖 Servidor Robot Bachan Activo (v2.11.8)');
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
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);

    // Optimización: Bloqueo de recursos (solo dejamos lo vital)
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'font', 'media', 'other'].includes(type) || req.url().includes('analytics')) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // 1. Ir directo a login/carrito
    console.log('[ROBOT] 1/4 Navegando a Mercadona...');
    await page.goto('https://tienda.mercadona.es/?authenticate-user=', { waitUntil: 'networkidle2' });

    // Aceptar cookies
    try {
      await page.evaluate(() => {
        const btn = document.querySelector('button[data-testid="cookie-policy-accept"]') || 
                    Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Aceptar'));
        if (btn) btn.click();
      });
    } catch (_) {}

    // 2. CP si es necesario
    try {
      const cpInput = await page.$('input[name="postalCode"]');
      if (cpInput) {
        console.log('[ROBOT] 2/4 Validando zona 03005...');
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
        console.log('[ROBOT] ✅ Login completado.');
      }
    }

    // 4. Añadir productos con nuevos selectores
    console.log(`[ROBOT] 4/4 Procesando ${skus.length} productos...`);
    const itemsAdded = [];
    
    // Procesamos uno a uno o en pequeños grupos si falla el paralelo masivo
    for (const sku of skus) {
      const p = await browser.newPage();
      try {
        await p.setRequestInterception(true);
        p.on('request', (r) => {
          if (['image', 'font', 'media'].includes(r.resourceType())) r.abort();
          else r.continue();
        });

        console.log(`[ROBOT] Buscando SKU: ${sku}...`);
        await p.goto(`https://tienda.mercadona.es/product/${sku}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await wait(1500);

        const result = await p.evaluate(() => {
          // Intentar múltiples selectores según el cambio de Mercadona
          const selectors = [
            'button[data-testid="product-button-add"]',
            'button[aria-label*="Añadir al carrito"]',
            'button.button--primary',
            'button.product-format-selection__add-button'
          ];
          
          for (const sel of selectors) {
            const btn = document.querySelector(sel);
            if (btn && !btn.disabled) {
              btn.click();
              return { success: true, selector: sel };
            }
          }
          
          // Último recurso: buscar por texto
          const allBtns = Array.from(document.querySelectorAll('button'));
          const addBtn = allBtns.find(b => b.innerText.toUpperCase().includes('AÑADIR'));
          if (addBtn) {
            addBtn.click();
            return { success: true, selector: 'text' };
          }
          
          return { success: false };
        });

        if (result.success) {
          console.log(`[ROBOT] ✅ SKU ${sku} añadido (vía ${result.selector}).`);
          itemsAdded.push(sku);
          await wait(1000); // Pequeña espera para asegurar el proceso del click
        } else {
          console.log(`[ROBOT] ⚠️ No encontré el botón para el ID: ${sku}`);
        }
        await p.close();
      } catch (e) {
        console.error(`[ROBOT] ❌ Error en SKU ${sku}: ${e.message}`);
        await p.close();
      }
    }

    await browser.close();
    console.log(`[ROBOT] ✨ Sincronización finalizada. Total exitosos: ${itemsAdded.length}`);
    res.json({ success: true, itemsAdded });

  } catch (error) {
    if (browser) await browser.close();
    console.error('[ROBOT FATAL ERROR]', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Bachan Robot v2.11.8 escuchando en puerto ${port}`);
});
