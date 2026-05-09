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
  res.send('🤖 Servidor Robot Bachan Activo (v2.12.0)');
});

app.post('/sync-mercadona', async (req, res) => {
  const { skus } = req.body;
  const token = process.env.BROWSERLESS_TOKEN || '2UU9JlwwxGmtmYf6d668ca73630ff75fec7e3aa01583de3bb';

  if (!skus || !Array.isArray(skus)) {
    return res.status(400).json({ success: false, error: 'SKUs no válidos' });
  }

  console.log(`\n[ROBOT] 🚀 Iniciando v2.12.0 para ${skus.length} productos...`);

  let browser = null;
  try {
    const browserWSEndpoint = `wss://chrome.browserless.io?token=${token}&--window-size=1280,800`;
    
    browser = await puppeteerExtra.connect({
      browserWSEndpoint,
      defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);

    // Bloqueo de recursos no esenciales
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'font', 'media'].includes(type)) req.abort();
      else req.continue();
    });

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // 1. Acceso y Limpieza Inicial
    console.log('[ROBOT] 1/4 Accediendo a Mercadona...');
    await page.goto('https://tienda.mercadona.es/?authenticate-user=', { waitUntil: 'networkidle2' });

    // Limpieza de Pop-ups y Cookies
    await page.evaluate(() => {
      const selectors = [
        'button[data-testid="cookie-policy-accept"]',
        '#onesignal-slidedown-cancel-button',
        '.cookie-banner__accept-button',
        '.ui-button--confirm'
      ];
      selectors.forEach(s => {
        const btn = document.querySelector(s);
        if (btn) btn.click();
      });
    });
    await wait(2000);

    // 2. CP 03005 (si aplica)
    try {
      const hasCP = await page.$('input[name="postalCode"]');
      if (hasCP) {
        console.log('[ROBOT] 2/4 Configurando zona 03005...');
        await page.type('input[name="postalCode"]', '03005');
        await page.keyboard.press('Enter');
        await wait(2000);
      }
    } catch (_) {}

    // 3. Login
    console.log('[ROBOT] 3/4 Identificando usuario...');
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
        console.log('[ROBOT] ✅ Login completado.');
      }
    }

    // 4. Búsqueda con Contingencia
    console.log('[ROBOT] 4/4 Despertando buscador...');
    
    // Si no aparece el buscador, vamos a categorías para forzar carga
    try {
      await page.waitForSelector('input[type="search"]', { timeout: 5000 });
    } catch (_) {
      console.log('[ROBOT] ℹ️ Buscador no visto en home, navegando a /categories/...');
      await page.goto('https://tienda.mercadona.es/categories/', { waitUntil: 'networkidle2' });
    }

    const itemsAdded = [];
    for (const sku of skus) {
      try {
        console.log(`[ROBOT] Procesando SKU: ${sku}...`);
        
        // Intentar encontrar el buscador (input o botón de lupa)
        let searchFound = false;
        try {
          await page.waitForSelector('input[type="search"]', { visible: true, timeout: 5000 });
          searchFound = true;
        } catch (_) {
          // Intentar clicar en botón "Buscar" si el input está oculto
          await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button, span, a')).find(el => el.innerText.includes('Buscar'));
            if (btn) btn.click();
          });
          await wait(1000);
          try {
            await page.waitForSelector('input[type="search"]', { visible: true, timeout: 5000 });
            searchFound = true;
          } catch (e2) {
            const html = await page.content();
            console.log('[DEBUG] HTML parcial en fallo:', html.substring(0, 500));
          }
        }

        if (searchFound) {
          await page.click('input[type="search"]', { clickCount: 3 });
          await page.keyboard.press('Backspace');
          await page.type('input[type="search"]', String(sku), { delay: 100 });
          await page.keyboard.press('Enter');
          await wait(2500);

          const added = await page.evaluate(() => {
            const btn = document.querySelector('button[data-testid="product-button-add"]') || 
                        document.querySelector('.button--primary') ||
                        Array.from(document.querySelectorAll('button')).find(b => b.innerText.toUpperCase().includes('AÑADIR'));
            
            if (btn && !btn.disabled) {
              btn.scrollIntoView();
              btn.click();
              return true;
            }
            return false;
          });

          if (added) {
            console.log(`[ROBOT] ✅ SKU ${sku} sincronizado.`);
            itemsAdded.push(sku);
            await wait(1500);
          } else {
            console.log(`[ERROR] No se pudo añadir el SKU: ${sku}`);
          }
        } else {
          console.log(`[ERROR] Buscador no disponible para SKU: ${sku}`);
        }
      } catch (err) {
        console.error(`[FATAL SKU ${sku}]`, err.message);
      }
    }

    await browser.close();
    console.log(`[ROBOT] ✨ Finalizado. Total: ${itemsAdded.length}`);
    res.json({ success: true, itemsAdded });

  } catch (error) {
    if (browser) await browser.close();
    console.error('[ROBOT FATAL ERROR]', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Bachan Robot v2.12.0 escuchando en puerto ${port}`);
});
