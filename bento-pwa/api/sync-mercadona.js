// /api/sync-mercadona.js
// Vercel Serverless Function — Ultra-Optimized (Speed & Performance)
// Objetivo: Completar el flujo en < 10s para evitar 504 Timeout.

import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import puppeteer from 'puppeteer-core';

puppeteerExtra.use(StealthPlugin());

const wait = (ms) => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  const { skus } = req.body;
  const token = process.env.BROWSERLESS_TOKEN || '2UU9JlwwxGmtmYf6d668ca73630ff75fec7e3aa01583de3bb';

  if (!skus || !Array.isArray(skus)) {
    return res.status(400).json({ success: false, error: 'SKUs no válidos' });
  }

  let browser = null;
  try {
    const browserWSEndpoint = `wss://chrome.browserless.io?token=${token}&--window-size=1280,800`;
    
    browser = await puppeteerExtra.connect({
      browserWSEndpoint,
      defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();
    
    // ── OPTIMIZACIÓN 1: Interceptar y Bloquear Recursos Pesados ──────────
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // ── PASO 1: Ir directo a Login (Ahorra un salto de página) ────────────
    console.log('[API] Navegando directo a login...');
    await page.goto('https://tienda.mercadona.es/?authenticate-user=', { 
      waitUntil: 'networkidle2', 
      timeout: 15000 
    });

    // ── PASO 2: Gestionar Cookies/CP si aparecen (Rápido) ─────────────────
    // Usamos evaluate para detectar y clickar instantáneamente sin esperar timeouts largos
    await page.evaluate(() => {
      // Cookies
      const cookieBtn = document.querySelector('button[data-testid="cookie-policy-accept"]');
      if (cookieBtn) cookieBtn.click();
      
      // Intentar cerrar cualquier modal inicial
      const closeBtn = document.querySelector('button[aria-label="Cerrar"]');
      if (closeBtn) closeBtn.click();
    });

    // Código Postal (Solo si el input está presente)
    const hasCP = await page.$('input[name="postalCode"]');
    if (hasCP) {
      await page.type('input[name="postalCode"]', '03005');
      await page.keyboard.press('Enter');
      await wait(1000); // Mínimo para que procese el cambio de zona
    }

    // ── PASO 3: Login (Agresivo) ──────────────────────────────────────────
    const emailInput = await page.$('input[name="email"], input[type="email"]');
    if (emailInput) {
      await page.type('input[name="email"]', process.env.MERCADONA_USER || 'jordicocinab@gmail.com');
      await page.keyboard.press('Enter');
      await wait(800);
      
      const passInput = await page.$('input[name="password"], input[type="password"]');
      if (passInput) {
        await page.type('input[name="password"]', process.env.MERCADONA_PASS || 'soccersmart123');
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
          page.keyboard.press('Enter')
        ]);
      }
    }

    // ── PASO 4: Añadir productos en Paralelo ──────────────────────────────
    console.log(`[API] Añadiendo ${skus.length} productos en paralelo...`);
    
    // Para maximizar velocidad, procesamos los SKUs de forma concurrente
    const results = await Promise.all(skus.map(async (sku) => {
      const productPage = await browser.newPage();
      try {
        await productPage.setRequestInterception(true);
        productPage.on('request', (r) => {
          if (['image', 'font', 'media'].includes(r.resourceType())) r.abort();
          else r.continue();
        });

        await productPage.goto(`https://tienda.mercadona.es/product/${sku}`, { 
          waitUntil: 'domcontentloaded', 
          timeout: 8000 
        });

        const added = await productPage.evaluate(() => {
          const btn = document.querySelector('button[data-testid="product-button-add"]') || 
                      Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Añadir'));
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        });

        await productPage.close();
        return { sku, success: added };
      } catch (e) {
        await productPage.close();
        return { sku, success: false, error: e.message };
      }
    }));

    await browser.close();
    
    const itemsAdded = results.filter(r => r.success).map(r => r.sku);
    return res.status(200).json({ success: true, itemsAdded });

  } catch (error) {
    if (browser) await browser.close();
    console.error('[API ERROR]', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
