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
    if (req.method === 'OPTIONS') return res.status(200).end();
    next();
});

app.use(express.json());

const wait = (ms) => new Promise(r => setTimeout(r, ms));

// ── ENDPOINTS ───────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.send('🤖 Servidor Robot Bachan Activo (v2.17.0 - Fuerza Bruta Cookie)');
});

app.post('/sync-mercadona', async (req, res) => {
  const { skus } = req.body;
  const token = process.env.BROWSERLESS_TOKEN || '2UU9JlwwxGmtmYf6d668ca73630ff75fec7e3aa01583de3bb';

  if (!skus || !Array.isArray(skus)) {
    return res.status(400).json({ success: false, error: 'SKUs no válidos' });
  }

  console.log(`\n[ROBOT] 🚀 Iniciando v2.17.0 (Fuerza Bruta Cookie) para ${skus.length} productos...`);

  let browser = null;
  try {
    const args = '&--no-sandbox&--disable-setuid-sandbox&--disable-dev-shm-usage&--disable-accelerated-2d-canvas&--no-first-run&--no-zygote&--single-process';
    const browserWSEndpoint = `wss://chrome.browserless.io?token=${token}&--window-size=1920,1080${args}`;

    browser = await puppeteerExtra.connect({
      browserWSEndpoint,
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);

    // User-Agent Chrome 124 Windows — navegador humano real
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );

    // Viewport humano explícito (1920x1080)
    await page.setViewport({ width: 1920, height: 1080 });

    // ── ANTI-FINGERPRINT: Eliminar todas las huellas de headless ──────────────
    await page.evaluateOnNewDocument(() => {
      // 1. Ocultar webdriver
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      // 2. Simular objeto chrome real (presente en Chrome no-headless)
      window.chrome = { runtime: {} };
      // 3. Idioma español (como un usuario español real)
      Object.defineProperty(navigator, 'languages', { get: () => ['es-ES', 'es'] });
    });

    // 1. Zona de Venta, Cookies y Calentamiento en Home
    console.log('[ROBOT] 1/4 Aterrizando en la Home (calentamiento humano)...');
    await page.goto('https://tienda.mercadona.es/', { waitUntil: 'domcontentloaded' });
    await wait(3000);

    // Aceptar cookies
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const acceptBtn = btns.find(b =>
        b.innerText.match(/Aceptar|Permitir/i) ||
        b.getAttribute('data-testid') === 'cookie-policy-accept'
      );
      if (acceptBtn) acceptBtn.click();
    });
    await wait(1500);

    // ── TRUCO DE LA HOME: 5 segundos de movimientos de ratón aleatorios ───────
    console.log('[ROBOT] 🖱️  Simulando exploración humana en la Home (5 segundos)...');
    for (let i = 0; i < 8; i++) {
      const x = Math.floor(Math.random() * 1600) + 100;
      const y = Math.floor(Math.random() * 700) + 100;
      await page.mouse.move(x, y, { steps: 10 });
      await wait(Math.floor(Math.random() * 500) + 300);
    }
    // Scroll suave hacia abajo y vuelve, como un humano curioso
    await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
    await wait(1200);
    await page.evaluate(() => window.scrollBy({ top: -200, behavior: 'smooth' }));
    await wait(800);
    console.log('[ROBOT] ✅ Calentamiento en Home completado.');

    // 2. Identificación
    let usingCookies = false;
    if (process.env.MERCADONA_COOKIES) {
      try {
        console.log('[ROBOT] 🚀 Cargador de Cookies v2.17.0 (Fuerza Bruta de Dominio)...');
        const rawCookies = JSON.parse(process.env.MERCADONA_COOKIES);

        // ── DETECCIÓN DE SESIÓN REAL: log de los nombres CRUDOS del JSON ──────
        console.log(`[DEBUG RAW] Total cookies en MERCADONA_COOKIES: ${rawCookies.length}`);
        console.log(`[DEBUG RAW] Nombres de cookies en el JSON: ${rawCookies.map(c => c.name).join(', ')}`);
        const sessionInRaw = rawCookies.find(c => 
          c.name === 'p_s' || 
          c.name.toLowerCase().includes('session') || 
          c.name.toLowerCase().includes('token') || 
          c.name.toLowerCase().includes('auth')
        );
        console.log(`[DEBUG RAW] Cookie de sesión en JSON: ${sessionInRaw ? sessionInRaw.name + ' (dominio: ' + sessionInRaw.domain + ')' : 'NO ENCONTRADA ⚠️'}`);

        // ── LIMPIEZA Y NORMALIZACIÓN ────────────────────────────────────────────
        const cleanCookie = (c, domainOverride) => {
          const cleaned = { ...c };
          // Limpiar campos que Puppeteer no acepta
          delete cleaned.hostOnly;
          delete cleaned.storeId;
          delete cleaned.session;
          // Dominio explícito
          cleaned.domain = domainOverride;
          // Forzar secure y sameSite
          cleaned.secure = true;
          if (!cleaned.sameSite) cleaned.sameSite = 'Lax';
          return cleaned;
        };

        // ── FUERZA BRUTA DE DOMINIO: inyectar para AMBOS dominios ─────────
        const cookiesFor_tienda = rawCookies.map(c => cleanCookie(c, 'tienda.mercadona.es'));
        const cookiesFor_dot   = rawCookies.map(c => cleanCookie(c, '.mercadona.es'));
        const allCookies = [...cookiesFor_tienda, ...cookiesFor_dot];

        console.log(`[DEBUG] Inyectando ${allCookies.length} cookies (${rawCookies.length} × 2 dominios)...`);
        console.log(`[DEBUG] Dominios: tienda.mercadona.es + .mercadona.es`);

        await page.setCookie(...allCookies);
        usingCookies = true;
        console.log(`[ROBOT] 🔑 Total cookies cargadas en el navegador: ${allCookies.length}`);

        // Recargar para aplicar la sesión
        await page.reload({ waitUntil: 'domcontentloaded' });
        await wait(4000);

        // ── VERIFICACIÓN DE SESIÓN (SOLO INFORMATIVA, NO BLOQUEA) ───────
        console.log('[ROBOT] 🔍 Comprobando estado de la página post-cookies...');
        const cookieSessionCheck = await page.evaluate(() => {
          const bodyText = document.body.innerText.toLowerCase();
          const isLoggedIn = bodyText.includes('jordi') ||
            bodyText.includes('cerrar sesión') ||
            bodyText.includes('mi cuenta') ||
            bodyText.includes('mis pedidos') ||
            bodyText.includes('mis datos');
          const isBlocked = bodyText.includes('identifícate') ||
            bodyText.includes('inicia sesión') ||
            bodyText.includes('iniciar sesión');
          const btns = Array.from(document.querySelectorAll('button')).slice(0, 8).map(b => b.innerText.trim()).filter(Boolean);
          return { isLoggedIn, isBlocked, btns, sampleText: bodyText.substring(0, 200) };
        });

        console.log(`[DEBUG] Botones visibles post-cookie: ${JSON.stringify(cookieSessionCheck.btns)}`);
        console.log(`[DEBUG] Texto inicial: ${cookieSessionCheck.sampleText.substring(0, 150)}`);

        if (cookieSessionCheck.isBlocked && !cookieSessionCheck.isLoggedIn) {
          // Log de prueba de fuego SIN DETENER EL ROBOT
          console.warn('[ROBOT WARN] Detectado "Identifícate" — el robot continuará de todos modos (Salto de Validación).');
          const browserCookies = await page.cookies();
          console.warn(`[DEBUG FUEGO] Cookies que VE el navegador (${browserCookies.length}): ${browserCookies.map(c => c.name).join(', ')}`);
          const sessionCookie = browserCookies.find(c => c.name.toLowerCase().includes('session') || c.name.toLowerCase().includes('token') || c.name.toLowerCase().includes('auth') || c.name === 'p_s');
          console.warn(`[DEBUG FUEGO] Cookie de sesión en navegador: ${sessionCookie ? JSON.stringify({ name: sessionCookie.name, domain: sessionCookie.domain }) : 'NINGUNA ⚠️'}`);
          // NO abortamos — intentamos el click igualmente
        }

        if (cookieSessionCheck.isLoggedIn) {
          console.log('[ROBOT] ✅ Sesión confirmada. CP de Jordi respetado.');
        } else {
          console.log('[ROBOT] ⚠️ Sesión no visible en DOM, pero continuando con fuerza bruta...');
        }

      } catch (e) {
        console.warn('[ROBOT] ⚠️ Error en Cargador de Cookies v2.17.0, usando login normal.', e.message);
      }
    }

    // Solo forzar CP si NO estamos usando cookies (login normal)
    if (!usingCookies) {
      const cpInput = await page.$('input[name="postalCode"]');
      if (cpInput) {
        await page.type('input[name="postalCode"]', '03005', { delay: 50 });
        await page.keyboard.press('Enter');
        await wait(3000);
        console.log('[ROBOT] ✅ Zona de Venta establecida (03005).');
      }
    } else {
      console.log('[ROBOT] ℹ️  CP no forzado — usando zona de entrega de las cookies de Jordi.');
    }

    if (!usingCookies) {
      console.log('[ROBOT] 2/4 Navegando a página de login directa...');
      await page.goto('https://tienda.mercadona.es/login/', { waitUntil: 'domcontentloaded' });
      await wait(3000);

      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const acceptBtn = btns.find(b =>
          b.innerText.match(/Aceptar|Permitir/i) ||
          b.getAttribute('data-testid') === 'cookie-policy-accept'
        );
        if (acceptBtn) acceptBtn.click();
      });
      await wait(1000);

      let emailInputFound = false;
      let emailSelector = 'input[type="email"], input[name="email"], #email';

      try {
        await page.waitForSelector(emailSelector, { visible: true, timeout: 10000 });
        emailInputFound = true;
      } catch (e) {
        console.log('[INFO] No se encontró el email a la primera, refrescando...');
        await page.reload({ waitUntil: 'domcontentloaded' });
        await wait(5000);

        try {
          await page.waitForSelector(emailSelector, { visible: true, timeout: 10000 });
          emailInputFound = true;
        } catch (e2) {
          console.log('[INFO] Refresco fallido, buscando inputs por fuerza bruta...');
          const inputs = await page.$$('input');
          for (let input of inputs) {
            const type = await page.evaluate(el => el.type, input);
            const name = await page.evaluate(el => el.name, input);
            if (type !== 'search' && name !== 'search') {
              const isVisible = await page.evaluate(el => el.offsetParent !== null, input);
              if (isVisible) {
                emailSelector = input;
                emailInputFound = true;
                break;
              }
            }
          }
          if (!emailInputFound) {
            const allInputs = await page.evaluate(() =>
              Array.from(document.querySelectorAll('input')).map(i => i.name || i.id || i.type)
            );
            console.log('Inputs encontrados:', allInputs);
            throw new Error('No se encontró campo de email.');
          }
        }
      }

      await page.click(emailSelector);
      await wait(500);

      await page.type(emailSelector, process.env.MERCADONA_USER || 'jordicocinab@gmail.com', { delay: 150 });
      await wait(1000);

      await page.type('input[name="password"]', process.env.MERCADONA_PASS || 'soccersmart123', { delay: 150 });
      await wait(1000);

      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const submitBtn = btns.find(b => b.innerText.match(/iniciar sesión|identificarse|entrar/i))
          || document.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
      });

      try {
        console.log('[DEBUG] Esperando navegación post-login...');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
      } catch (e) {
        console.log('[INFO] Timeout de navegación post-login, esperando DOM...');
        await wait(4000);
      }

      // Verificación post-login
      let sessionValidation = { success: false };
      console.log('[INFO] Buscando confirmación de sesión...');
      for (let i = 0; i < 5; i++) {
        sessionValidation = await page.evaluate(() => {
          const bodyText = document.body.innerText.toLowerCase();
          const isOk = bodyText.includes('jordi') ||
            bodyText.includes('cerrar sesión') ||
            bodyText.includes('mi cuenta') ||
            bodyText.includes('mis pedidos') ||
            bodyText.includes('mis datos');
          if (!isOk) {
            const btns = Array.from(document.querySelectorAll('button')).slice(0, 5).map(b => b.innerText.trim() || b.className);
            return { success: false, buttons: btns, sampleText: bodyText.substring(0, 150) };
          }
          return { success: true };
        });

        if (sessionValidation.success) break;
        await wait(1000);
      }

      if (!sessionValidation.success) {
        console.error('[ROBOT FATAL ERROR] Fallo de sesión. No se detectó login exitoso.');
        console.error(`[DEBUG] Botones: ${JSON.stringify(sessionValidation.buttons)}`);
        console.error(`[DEBUG] Texto: ${sessionValidation.sampleText}`);
        await browser.close();
        return res.status(500).json({ success: false, error: 'Fallo de Sesión: Mercadona bloqueó el login.' });
      }
      console.log('[ROBOT] ✅ Sesión verificada.');
    } else {
      console.log('[ROBOT] 2/4 Saltando login (Sesión inyectada por cookies).');
    }

    // 3. Añadir productos — Estrategia "Zero Conflict"
    console.log('[ROBOT] 3/4 Añadiendo productos (Estrategia: Zero Conflict)...');
    const itemsAdded = [];

    for (const sku of skus) {
      try {
        const productUrl = `https://tienda.mercadona.es/product/${sku}/`;
        console.log(`[DEBUG] Visitando ficha de producto: ${productUrl}`);

        await page.goto(productUrl, { waitUntil: 'domcontentloaded' });
        await wait(4000);

        // CP: solo logear qué zona detecta el robot, sin forzar nada
        const cpDetected = await page.evaluate(() => {
          const m = document.body.innerText.match(/\d{5}/);
          return m ? m[0] : 'no-detectado';
        });
        console.log(`[DEBUG] CP detectado en ficha de producto: ${cpDetected}`);


        // Click en "Añadir al carro"
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
            return { success: true, text: btnCompra.innerText };
          }
          return { success: false };
        });

        if (scanResult.success) {
          console.log(`[OK] Click en "Añadir al carro" para SKU ${sku}. Esperando 20 segundos en calma...`);

          // ⏳ ESPERA PASIVA
          await wait(20000);

          // ── NAVEGACIÓN POST-AÑADIDO: ir al carrito y verificar ───────────────
          console.log(`[OK] Calma completada. Navegando al carrito para confirmar SKU ${sku}...`);
          await page.goto('https://tienda.mercadona.es/cart/', { waitUntil: 'domcontentloaded', timeout: 20000 });
          await wait(3000);

          // Log de la URL real del carrito (detecta parámetros extraños o redirecciones)
          const cartUrl = page.url();
          console.log(`[DEBUG] URL real del carrito tras navegación: ${cartUrl}`);

          // Log del contenido visible del carrito
          const cartContent = await page.evaluate(() => {
            return document.body.innerText.substring(0, 300);
          });
          console.log(`[DEBUG] Contenido del carrito (primeros 300 chars): ${cartContent}`);

          await wait(10000);
          console.log(`[OK] SKU ${sku} procesado. Cerrando carrito.`);
          itemsAdded.push(sku);
        } else {
          console.log(`[ERROR] No se encontró botón interactivo para SKU: ${sku}`);
        }
      } catch (err) {
        console.warn(`[SKIP SKU ${sku}] Error: ${err.message}`);
      }
    }

    // 4. Cierre limpio
    console.log(`[ROBOT] 4/4 ✨ Finalizado. Añadidos: ${itemsAdded.length}`);
    await browser.close();
    res.json({ success: true, itemsAdded });

  } catch (error) {
    if (browser) await browser.close();
    console.error('[ROBOT FATAL ERROR]', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Bachan Robot v2.17.0 (Fuerza Bruta Cookie) escuchando en puerto ${port}`);
});
