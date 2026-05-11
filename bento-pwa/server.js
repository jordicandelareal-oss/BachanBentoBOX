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
  res.send('🤖 Servidor Robot Bachan Activo (v2.13.0 - Clic y Calma)');
});

app.post('/sync-mercadona', async (req, res) => {
  const { skus } = req.body;
  const token = process.env.BROWSERLESS_TOKEN || '2UU9JlwwxGmtmYf6d668ca73630ff75fec7e3aa01583de3bb';

  if (!skus || !Array.isArray(skus)) {
    return res.status(400).json({ success: false, error: 'SKUs no válidos' });
  }

  console.log(`\n[ROBOT] 🚀 Iniciando v2.13.0 (Clic y Calma) para ${skus.length} productos...`);

  let browser = null;
  try {
    const args = '&--no-sandbox&--disable-setuid-sandbox&--disable-dev-shm-usage&--disable-accelerated-2d-canvas&--no-first-run&--no-zygote&--single-process';
    const browserWSEndpoint = `wss://chrome.browserless.io?token=${token}&--window-size=390,844${args}`;

    browser = await puppeteerExtra.connect({
      browserWSEndpoint,
      defaultViewport: { width: 390, height: 844 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);

    // User-Agent iPhone 15 Pro (iOS 17) — parece la App móvil de Jordi
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    );

    // Huella Digital Humana (Evitar detección WebDriver)
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    // 1. Zona de Venta y Cookies
    console.log('[ROBOT] 1/4 Estableciendo Zona de Venta...');
    await page.goto('https://tienda.mercadona.es/', { waitUntil: 'domcontentloaded' });
    await wait(3000);

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const acceptBtn = btns.find(b =>
        b.innerText.match(/Aceptar|Permitir/i) ||
        b.getAttribute('data-testid') === 'cookie-policy-accept'
      );
      if (acceptBtn) acceptBtn.click();
    });
    await wait(1500);

    const cpInput = await page.$('input[name="postalCode"]');
    if (cpInput) {
      await page.type('input[name="postalCode"]', '03005', { delay: 50 });
      await page.keyboard.press('Enter');
      await wait(3000);
      console.log('[ROBOT] ✅ Zona de Venta establecida (03005).');
    }

    // 2. Identificación
    let usingCookies = false;
    if (process.env.MERCADONA_COOKIES) {
      try {
        console.log('[ROBOT] 🚀 Inyectando cookies de sesión directa (Plan B)...');
        const cookies = JSON.parse(process.env.MERCADONA_COOKIES);
        await page.setCookie(...cookies);
        usingCookies = true;
        console.log('[ROBOT] 🔑 Sesión cargada mediante cookies externas. Saltando formulario.');
        await page.reload({ waitUntil: 'domcontentloaded' });
        await wait(3000);
      } catch (e) {
        console.warn('[ROBOT] ⚠️ Error parseando MERCADONA_COOKIES, usando login normal.');
      }
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

    // 3. Añadir productos — Estrategia "Clic y Calma"
    console.log('[ROBOT] 3/4 Añadiendo productos (Estrategia: Clic y Calma)...');
    const itemsAdded = [];

    for (const sku of skus) {
      try {
        const productUrl = `https://tienda.mercadona.es/product/${sku}/`;
        console.log(`[DEBUG] Visitando ficha de producto: ${productUrl}`);

        await page.goto(productUrl, { waitUntil: 'domcontentloaded' });
        await wait(4000);

        // Verificar zona de entrega
        const cpIsCorrect = await page.evaluate(() => document.body.innerText.includes('03005'));
        if (!cpIsCorrect) {
          console.log('[INFO] CP 03005 no detectado, intentando re-forzar...');
          try {
            await page.evaluate(() => {
              const btns = Array.from(document.querySelectorAll('button, a'));
              const cpBtn = btns.find(b => b.innerText.match(/\d{5}/) || (b.getAttribute('aria-label') || '').includes('postal'));
              if (cpBtn) cpBtn.click();
            });
            await wait(2000);
            await page.type('input[name="postalCode"]', '03005', { delay: 50 });
            await page.keyboard.press('Enter');
            await wait(3000);
          } catch (e) {
            console.log('[INFO] No se pudo re-forzar el CP:', e.message);
          }
        }

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

          // ⏳ ESPERA PASIVA — sin navegar a ningún sitio
          await wait(20000);

          console.log(`[OK] Calma completada para SKU ${sku}. Producto en cesta.`);
          itemsAdded.push(sku);
        } else {
          console.log(`[ERROR] No se encontró botón interactivo para SKU: ${sku}`);
        }
      } catch (err) {
        console.warn(`[SKIP SKU ${sku}] Error: ${err.message}`);
      }
    }

    // 4. Cierre Real — un solo reload para confirmar estado de la cesta
    console.log('[ROBOT] 4/4 Recargando página para confirmar cesta. Esperando 5 segundos...');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await wait(5000);

    await browser.close();
    console.log(`[ROBOT] ✨ Finalizado. Añadidos: ${itemsAdded.length}`);
    res.json({ success: true, itemsAdded });

  } catch (error) {
    if (browser) await browser.close();
    console.error('[ROBOT FATAL ERROR]', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Bachan Robot v2.13.0 (Clic y Calma) escuchando en puerto ${port}`);
});
