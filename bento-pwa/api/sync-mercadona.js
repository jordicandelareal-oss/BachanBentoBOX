// /api/sync-mercadona.js
// Vercel Serverless Function — Automatización Mercadona (Opción C)
// ⚠️ Requiere Plan Pro (maxDuration: 60s en vercel.json)

import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import chromium from '@sparticuz/chromium';
import puppeteerCore from 'puppeteer-core';

puppeteerExtra.use(StealthPlugin());

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const randomDelay = (min = 80, max = 200) => Math.floor(Math.random() * (max - min + 1)) + min;

const IS_VERCEL = !!process.env.VERCEL;

/** Escribe en un input con ritmo humano variable */
async function humanType(page, selector, text) {
  await page.waitForSelector(selector, { visible: true, timeout: 10000 });
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await wait(randomDelay(150, 300));
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

/** Click en botón por texto — BUGFIX: usa b.disabled (no btn?.disabled) */
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
      if (btn) { btn.click(); return btn.innerText.trim(); }
      return null;
    }, text);
    if (clicked) return true;
    await wait(500);
  }
  return false;
}

export default async function handler(req, res) {
  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  const { skus } = req.body;
  if (!skus || !Array.isArray(skus) || skus.length === 0) {
    return res.status(400).json({ success: false, error: 'SKUs no proporcionados' });
  }

  console.log(`[API] Iniciando flujo Mercadona en ${IS_VERCEL ? 'VERCEL' : 'LOCAL'} para SKUs: ${skus.join(', ')}`);

  let browser = null;
  try {
    // ── Configuración del navegador según entorno ──────────────────────────
    const launchOptions = IS_VERCEL
      ? {
          // Vercel/Lambda: usar binario de @sparticuz/chromium
          args: [
            ...chromium.args,
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox'
          ],
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
          defaultViewport: { width: 1280, height: 800 }
        }
      : {
          // Local: usar Puppeteer estándar
          args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
          headless: false,
          defaultViewport: null
        };

    browser = await puppeteerExtra.launch(launchOptions);
    const page = await browser.newPage();

    // Headers de navegador real
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'es-ES,es;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });

    // Ocultar navigator.webdriver
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    const results = [];

    // ── PASO 1: Home + Cookies ─────────────────────────────────────────────
    console.log('[PASO 1] Cargando Mercadona...');
    await page.goto('https://tienda.mercadona.es/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await wait(3000);

    // Verificar si la IP está bloqueada (403 / CAPTCHA)
    const pageContent = await page.content();
    if (pageContent.includes('Access denied') || pageContent.includes('403')) {
      await browser.close();
      return res.status(403).json({
        success: false,
        blocked: true,
        error: 'La IP de Vercel ha sido bloqueada por Cloudflare/Mercadona. Usa la opción local con ngrok.'
      });
    }

    // Aceptar cookies
    try {
      await page.waitForSelector('button[data-testid="cookie-policy-accept"]', { timeout: 5000 });
      await humanClick(page, 'button[data-testid="cookie-policy-accept"]');
      console.log('[PASO 1] ✅ Cookies aceptadas.');
    } catch (_) {
      await clickByText(page, 'Aceptar', 4000);
    }
    await wait(1500);

    // ── PASO 2: Código Postal ──────────────────────────────────────────────
    try {
      await page.waitForSelector('input[name="postalCode"]', { visible: true, timeout: 6000 });
      await humanType(page, 'input[name="postalCode"]', '03005');
      await wait(500);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
        page.keyboard.press('Enter')
      ]);
      console.log('[PASO 2] ✅ CP 03005 validado.');
      await wait(1500);
    } catch (_) {
      console.log('[PASO 2] CP no solicitado (zona ya validada).');
    }

    // ── PASO 3: Login ──────────────────────────────────────────────────────
    console.log('[PASO 3] Iniciando identificación...');
    await page.goto('https://tienda.mercadona.es/?authenticate-user=', {
      waitUntil: 'networkidle2', timeout: 20000
    });
    await wait(2500);

    let emailSel = null;
    for (const s of ['input[name="email"]', 'input[type="email"]', 'input[autocomplete="email"]']) {
      try {
        await page.waitForSelector(s, { visible: true, timeout: 3500 });
        emailSel = s;
        break;
      } catch (_) {}
    }

    if (emailSel) {
      await humanType(page, emailSel, process.env.MERCADONA_USER || '');
      await wait(randomDelay(400, 700));
      await page.keyboard.press('Enter');
      await wait(2000);

      let passSel = null;
      for (const s of ['input[name="password"]', 'input[type="password"]', 'input[autocomplete="current-password"]']) {
        try {
          await page.waitForSelector(s, { visible: true, timeout: 5000 });
          passSel = s;
          break;
        } catch (_) {}
      }

      if (passSel) {
        await humanType(page, passSel, process.env.MERCADONA_PASS || '');
        await wait(randomDelay(400, 700));
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
          (async () => {
            try { await humanClick(page, 'button[type="submit"]', 3000); }
            catch (_) { await page.keyboard.press('Enter'); }
          })()
        ]);
        console.log('[PASO 3] ✅ Login completado.');
        await wait(2000);
      }
    } else {
      console.log('[PASO 3] Formulario de login no encontrado (posible sesión activa o bloqueo).');
    }

    // ── PASO 4: Añadir productos ────────────────────────────────────────────
    for (const sku of skus) {
      const url = `https://tienda.mercadona.es/product/${sku}`;
      console.log(`[PASO 4] Producto ${sku}...`);
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
        await wait(2500);

        let added = false;
        try {
          await page.waitForSelector('button[data-testid="product-button-add"]', { timeout: 5000 });
          await humanClick(page, 'button[data-testid="product-button-add"]');
          added = true;
        } catch (_) {
          added = await clickByText(page, 'Añadir al carro', 6000);
        }

        results.push({ sku, success: added });
        if (added) console.log(`[PASO 4] ✅ SKU ${sku} añadido.`);
        else console.log(`[PASO 4] ⚠️ No se pudo añadir SKU ${sku}.`);
        await wait(1500);
      } catch (e) {
        results.push({ sku, success: false, error: e.message });
      }
    }

    await browser.close();

    return res.status(200).json({
      success: true,
      message: 'Carrito actualizado',
      results
    });

  } catch (error) {
    if (browser) await browser.close().catch(() => {});
    console.error('[API ERROR]', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
