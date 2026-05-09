// /api/sync-mercadona.js
// Vercel Serverless Function — Automatización Mercadona vía Browserless.io
// Evita bloqueos de IP (403) usando un navegador remoto.

import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import puppeteer from 'puppeteer-core';

// Usar el plugin stealth para evadir detección de bots
puppeteerExtra.use(StealthPlugin());

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const randomDelay = (min = 80, max = 200) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Escribe en un input simulando ritmo humano */
async function humanType(page, selector, text) {
  await page.waitForSelector(selector, { visible: true, timeout: 10000 });
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await wait(randomDelay(150, 350));
  for (const char of text) {
    await page.type(selector, char, { delay: randomDelay(80, 170) });
  }
}

/** Hover + click con pausa humana */
async function humanClick(page, selector, timeout = 8000) {
  await page.waitForSelector(selector, { visible: true, timeout });
  await page.hover(selector);
  await wait(randomDelay(200, 450));
  await page.click(selector);
}

/** Busca un botón por texto y hace click */
async function clickByText(page, text, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const clicked = await page.evaluate((t) => {
      const all = Array.from(document.querySelectorAll('button, [role="button"]'));
      const btn = all.find(b =>
        !b.disabled &&
        b.innerText &&
        b.innerText.trim().toUpperCase().includes(t.toUpperCase())
      );
      if (btn) {
        btn.click();
        return btn.innerText.trim();
      }
      return null;
    }, text);

    if (clicked) return true;
    await wait(500);
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  const { skus } = req.body;
  const token = process.env.BROWSERLESS_TOKEN || '2UU9JlwwxGmtmYf6d668ca73630ff75fec7e3aa01583de3bb';

  if (!skus || !Array.isArray(skus)) {
    return res.status(400).json({ success: false, error: 'SKUs no válidos' });
  }

  console.log(`[API] Iniciando sincronización remota para SKUs: ${skus.join(', ')}`);

  let browser = null;
  try {
    // ── Conexión a Browserless.io ──────────────────────────────────────────
    // Forzamos tamaño de ventana y otros parámetros vía query string
    const browserWSEndpoint = `wss://chrome.browserless.io?token=${token}&--window-size=1280,800`;
    
    browser = await puppeteerExtra.connect({
      browserWSEndpoint,
      defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // ── PASO 1: Home + Cookies ──────────────────────────────────────────────
    await page.goto('https://tienda.mercadona.es/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await wait(2000);

    try {
      await page.waitForSelector('button[data-testid="cookie-policy-accept"]', { timeout: 5000 });
      await humanClick(page, 'button[data-testid="cookie-policy-accept"]');
    } catch (_) {
      await clickByText(page, 'Aceptar', 4000);
    }

    // ── PASO 2: Código Postal 03005 ─────────────────────────────────────────
    try {
      await page.waitForSelector('input[name="postalCode"]', { visible: true, timeout: 8000 });
      await humanType(page, 'input[name="postalCode"]', '03005');
      await wait(500);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
        page.keyboard.press('Enter')
      ]);
    } catch (_) {
      console.log('[API] CP no solicitado o error en validación.');
    }

    // ── PASO 3: Login ───────────────────────────────────────────────────────
    await page.goto('https://tienda.mercadona.es/?authenticate-user=', { waitUntil: 'networkidle2' });
    await wait(2000);

    try {
      let emailSel = null;
      for (const s of ['input[name="email"]', 'input[type="email"]']) {
        try {
          await page.waitForSelector(s, { visible: true, timeout: 3000 });
          emailSel = s;
          break;
        } catch (_) {}
      }

      if (emailSel) {
        await humanType(page, emailSel, process.env.MERCADONA_USER || 'jordicocinab@gmail.com');
        await page.keyboard.press('Enter');
        await wait(2000);

        let passSel = null;
        for (const s of ['input[name="password"]', 'input[type="password"]']) {
          try {
            await page.waitForSelector(s, { visible: true, timeout: 3000 });
            passSel = s;
            break;
          } catch (_) {}
        }

        if (passSel) {
          await humanType(page, passSel, process.env.MERCADONA_PASS || 'soccersmart123');
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
            page.keyboard.press('Enter')
          ]);
        }
      }
    } catch (e) {
      console.log('[API] Error en login o ya identificado.');
    }

    // ── PASO 4: Añadir productos ────────────────────────────────────────────
    const itemsAdded = [];
    for (const sku of skus) {
      try {
        await page.goto(`https://tienda.mercadona.es/product/${sku}`, { waitUntil: 'networkidle2' });
        await wait(2000);
        
        let done = false;
        try {
          await page.waitForSelector('button[data-testid="product-button-add"]', { timeout: 5000 });
          await humanClick(page, 'button[data-testid="product-button-add"]');
          done = true;
        } catch (_) {
          done = await clickByText(page, 'Añadir al carro', 5000);
        }
        
        if (done) itemsAdded.push(sku);
      } catch (e) {
        console.error(`[API] Error con SKU ${sku}: ${e.message}`);
      }
    }

    await browser.close();
    return res.status(200).json({ success: true, itemsAdded });

  } catch (error) {
    if (browser) await browser.close();
    console.error('[API ERROR]', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
