import 'dotenv/config';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

/**
 * ============================================================
 * Script Mercadona (v9 - Fix ReferenceError + Anti-Bot)
 * ============================================================
 */

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

/**
 * Busca un botón por texto y hace click.
 * BUGFIX v9: usamos 'b.disabled' en lugar de 'btn?.disabled'
 * (btn no existe aún dentro del .find(), causaba ReferenceError)
 */
async function clickByText(page, text, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const clicked = await page.evaluate((t) => {
      const all = Array.from(document.querySelectorAll('button, [role="button"]'));
      // ✅ CORRECCIÓN: usar b.disabled, NO btn?.disabled
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

    if (clicked) {
      console.log(`[ROBOT]   → Click: "${clicked}"`);
      return true;
    }
    await wait(500);
  }
  return false;
}

// ─── Flujo principal ──────────────────────────────────────────────────────────
async function run(skus) {
  console.log('\n[ROBOT] ══════════════════════════════════════════');
  console.log('[ROBOT] 🥷 Stealth Mode v9 (fix ReferenceError)');
  console.log(`[ROBOT] 📦 SKUs: ${skus.join(', ')}`);
  console.log('[ROBOT] ══════════════════════════════════════════\n');

  const browser = await puppeteerExtra.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = await browser.newPage();

  // User-Agent de Chrome real en Mac
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  );

  // Ocultar navigator.webdriver a nivel JS
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  // ─── PASO 1: Home + Cookies ──────────────────────────────────────────────
  console.log('[PASO 1] Cargando Mercadona...');
  await page.goto('https://tienda.mercadona.es/', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  await wait(3000);

  console.log('[PASO 1] Buscando banner de cookies...');
  try {
    await page.waitForSelector('button[data-testid="cookie-policy-accept"]', { timeout: 5000 });
    await humanClick(page, 'button[data-testid="cookie-policy-accept"]');
    console.log('[PASO 1] ✅ Cookies aceptadas (testid).');
  } catch (_) {
    const clicked = await clickByText(page, 'Aceptar', 4000);
    console.log(clicked
      ? '[PASO 1] ✅ Cookies aceptadas (texto).'
      : '[PASO 1] ℹ️  Sin banner de cookies.');
  }
  await wait(2000);

  // ─── PASO 2: Código Postal ───────────────────────────────────────────────
  console.log('\n[PASO 2] Buscando campo de código postal...');
  try {
    await page.waitForSelector('input[name="postalCode"]', { visible: true, timeout: 8000 });
    console.log('[PASO 2] Campo detectado. Escribiendo 03005...');

    await humanType(page, 'input[name="postalCode"]', '03005');
    await wait(600);
    console.log('[PASO 2] CP escrito. Enviando con Enter...');

    // ✅ Usamos Enter directamente — más fiable que buscar el botón CONTINUAR
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
      page.keyboard.press('Enter')
    ]);

    console.log('[ROBOT] ✅ Código postal 03005 introducido con éxito');
    console.log('[PASO 2]   URL:', page.url());
    await wait(2000);

  } catch (_) {
    console.log('[PASO 2] ℹ️  Código postal no solicitado (zona ya validada).');
  }

  // ─── PASO 3: Login ───────────────────────────────────────────────────────
  console.log('\n[PASO 3] Navegando a identificación de usuario...');
  await page.goto('https://tienda.mercadona.es/?authenticate-user=', {
    waitUntil: 'networkidle2',
    timeout: 20000
  });
  await wait(3000);

  try {
    // Buscar campo email — selectores uno a uno (los compuestos con coma fallan en Puppeteer)
    let emailSel = null;
    for (const s of ['input[name="email"]', 'input[type="email"]', 'input[autocomplete="email"]']) {
      try {
        await page.waitForSelector(s, { visible: true, timeout: 3500 });
        emailSel = s;
        break;
      } catch (_) {}
    }
    if (!emailSel) throw new Error('Campo email no encontrado en la página.');

    console.log(`[PASO 3] Email detectado (${emailSel}). Escribiendo...`);
    await humanType(page, emailSel, process.env.MERCADONA_USER || 'jordicocinab@gmail.com');
    await wait(randomDelay(400, 700));

    // ✅ Pulsar Enter después del email (más fiable que buscar botón "Continuar")
    console.log('[PASO 3] Pulsando Enter para confirmar email...');
    await page.keyboard.press('Enter');
    await wait(2000);

    // Buscar campo contraseña (puede aparecer tras el Enter)
    let passSel = null;
    for (const s of ['input[name="password"]', 'input[type="password"]', 'input[autocomplete="current-password"]']) {
      try {
        await page.waitForSelector(s, { visible: true, timeout: 5000 });
        passSel = s;
        break;
      } catch (_) {}
    }
    if (!passSel) throw new Error('Campo contraseña no encontrado.');

    console.log(`[PASO 3] Contraseña detectada (${passSel}). Escribiendo...`);
    await humanType(page, passSel, process.env.MERCADONA_PASS || 'soccersmart123');
    await wait(randomDelay(400, 700));

    // Enviar con submit + fallback Enter
    console.log('[PASO 3] Confirmando acceso...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
      (async () => {
        try {
          await humanClick(page, 'button[type="submit"]', 3000);
        } catch (_) {
          await page.focus(passSel);
          await wait(300);
          await page.keyboard.press('Enter');
        }
      })()
    ]);

    console.log('[PASO 3] ✅ Login completado. URL:', page.url());
    await wait(2500);

  } catch (e) {
    console.error('[ERROR EN PASO 3]:', e.message);
    console.log('[PASO 3]   Continuando (puede haber sesión activa)...');
  }

  // ─── PASO 4: Añadir productos al carrito ─────────────────────────────────
  for (const sku of skus) {
    const url = `https://tienda.mercadona.es/product/${sku}`;
    console.log(`\n[PASO 4] Navegando a producto ${sku}...`);

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
      await wait(3000);

      let added = false;
      try {
        await page.waitForSelector('button[data-testid="product-button-add"]', { timeout: 5000 });
        await humanClick(page, 'button[data-testid="product-button-add"]');
        added = true;
      } catch (_) {
        added = await clickByText(page, 'Añadir al carro', 7000);
      }

      if (added) {
        console.log(`[PASO 4] ✅ Producto ${sku} añadido al carrito de Jordi.`);
      } else {
        console.error(`[ERROR EN PASO 4]: Botón no encontrado para SKU ${sku}.`);
      }
      await wait(2000);

    } catch (e) {
      console.error(`[ERROR EN PASO 4]: Fallo con SKU ${sku} —`, e.message);
    }
  }

  // ─── FIN ─────────────────────────────────────────────────────────────────
  console.log('\n[ROBOT] ══════════════════════════════════════════');
  console.log('[ROBOT] 🏁 Flujo completado. Navegador abierto.');
  console.log('[ROBOT] 👀 Revisa el carrito y confirma el pedido.');
  console.log('[ROBOT] ══════════════════════════════════════════\n');

  // ⚠️ Sin browser.close() — ventana queda abierta para Jordi
}

// ─── Entrada ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
run(args.length > 0 ? args : ['4241']);
