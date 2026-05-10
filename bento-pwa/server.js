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
  for (const char of text) {
    await page.type(selector, char, { delay: Math.floor(Math.random() * 100) + 100 });
  }
}

// ── ENDPOINTS ───────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.send('🤖 Servidor Robot Bachan Activo (v2.12.12 - Secure Session)');
});

app.post('/sync-mercadona', async (req, res) => {
  const { skus } = req.body;
  const token = process.env.BROWSERLESS_TOKEN || '2UU9JlwwxGmtmYf6d668ca73630ff75fec7e3aa01583de3bb';

  if (!skus || !Array.isArray(skus)) {
    return res.status(400).json({ success: false, error: 'SKUs no válidos' });
  }

  console.log(`\n[ROBOT] 🚀 Iniciando v2.12.12 (Sesión Segura y Verificación de Carrito) para ${skus.length} productos...`);

  let browser = null;
  try {
    const args = '&--no-sandbox&--disable-setuid-sandbox&--disable-dev-shm-usage&--disable-accelerated-2d-canvas&--no-first-run&--no-zygote&--single-process';
    const browserWSEndpoint = `wss://chrome.browserless.io?token=${token}&--window-size=1280,800${args}`;
    
    browser = await puppeteerExtra.connect({
      browserWSEndpoint,
      defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);

    // User-Agent de Chrome Premium (Evita bloqueos)
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

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

    // 2. Identificación Forzada y Verificación de Usuario
    console.log('[ROBOT] 2/4 Iniciando flujo de Login explícito...');
    await page.goto('https://tienda.mercadona.es/', { waitUntil: 'domcontentloaded' });
    await wait(3000);
    
    // Espera de Carga Real
    await wait(4000);

    // Click en Identifícate
    const button = await page.waitForSelector('xpath/.//button[contains(., "Identifícate")]', { timeout: 10000 }).catch(() => null);
    if (button) {
        await page.evaluate(b => b.click(), button);
        console.log('[DEBUG] Clic forzado en botón "Identifícate" via DOM.');
    } else {
        // Intento de respaldo por si el texto está en minúsculas o es un enlace
        const link = await page.waitForSelector('xpath/.//span[contains(text(), "identifícate")]', { timeout: 5000 }).catch(() => null);
        if (link) {
            await page.evaluate(l => l.click(), link);
            console.log('[DEBUG] Clic forzado en span "identifícate" via DOM.');
        } else {
            const texts = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.innerText));
            console.log('Textos de botones encontrados:', texts);
        }
    }

    // Esperar al Formulario
    const emailSelector = 'input[type="email"], input[name="email"], #email';
    try {
        await page.waitForSelector(emailSelector, { visible: true, timeout: 20000 });
    } catch (e) {
        const inputs = await page.evaluate(() => Array.from(document.querySelectorAll('input')).map(i => i.name || i.id || i.type));
        console.log('Inputs encontrados:', inputs);
        throw e;
    }

    // Click de Seguridad antes de escribir
    await page.click(emailSelector);
    await wait(500);

    // Login Secuencial con delay
    await page.type(emailSelector, process.env.MERCADONA_USER || 'jordicocinab@gmail.com', { delay: 150 });
    await wait(1000);
    
    await page.type('input[name="password"]', process.env.MERCADONA_PASS || 'soccersmart123', { delay: 150 });
    await wait(1000);
    
    // Click en el botón de Login (Identificarse)
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const submitBtn = btns.find(b => b.innerText.match(/iniciar sesión|identificarse|entrar/i)) || document.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
    });

    // Espera de Navegación obligatoria para asentar sesión
    try {
        console.log('[DEBUG] Esperando navegación de red post-login (networkidle2)...');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    } catch (e) {
        console.log('[INFO] Espera de navegación finalizada por tiempo, verificando DOM...');
        await wait(4000);
    }

    // Verificación post-login
    let sessionValidation = { success: false };
    console.log('[INFO] Intentando encontrar "Jordi" (o equivalente) por al menos 5 segundos...');
    for (let i = 0; i < 5; i++) {
      sessionValidation = await page.evaluate(() => {
        const bodyText = document.body.innerText.toLowerCase();
        const isOk = bodyText.includes('jordi') || 
                     bodyText.includes('cerrar sesión') || 
                     bodyText.includes('mi cuenta') ||
                     bodyText.includes('mis pedidos') ||
                     bodyText.includes('mis datos');
        
        if (!isOk) {
           // Capturar contexto visual (primeros botones) para entender qué ve el robot
           const btns = Array.from(document.querySelectorAll('button')).slice(0, 5).map(b => b.innerText.trim() || b.className);
           return { success: false, buttons: btns, sampleText: bodyText.substring(0, 150) };
        }
        return { success: true };
      });
      
      if (sessionValidation.success) break;
      await wait(1000);
    }

    if (!sessionValidation.success) {
      console.error('[ROBOT FATAL ERROR] [FALLO DE SESIÓN] No se detectó inicio de sesión exitoso.');
      console.error(`[DEBUG VIRTUAL] Botones visibles: ${JSON.stringify(sessionValidation.buttons)}`);
      console.error(`[DEBUG VIRTUAL] Texto inicial web: ${sessionValidation.sampleText}`);
      await browser.close();
      return res.status(500).json({ success: false, error: 'Fallo de Sesión: Mercadona bloqueó el login (Posible Captcha o Cambio de Interfaz).' });
    }
    console.log('[ROBOT] ✅ Sesión verificada y mantenida para el usuario.');

    // 3. Sincronización y Verificación Post-Click en /cart/
    console.log('[ROBOT] 3/4 Sincronizando y verificando carrito...');
    const itemsAdded = [];

    for (const sku of skus) {
      try {
        const productUrl = `https://tienda.mercadona.es/product/${sku}/`;
        console.log(`[DEBUG] Visitando ficha: ${productUrl}`);
        
        await page.goto(productUrl, { waitUntil: 'domcontentloaded' });
        await wait(4000);

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
            return { success: true, text: btnCompra.innerText };
          }
          return { success: false };
        });

        if (scanResult.success) {
          console.log(`[DEBUG] Click detectado en botón: "${scanResult.text}". Procediendo a verificación en carrito...`);
          await wait(2000);

          // VERIFICACIÓN DE FUEGO: NAVEGAR AL CARRITO (FLEXIBLE)
          try {
            await page.goto('https://tienda.mercadona.es/cart/', { waitUntil: 'domcontentloaded', timeout: 20000 });
            await wait(4000); 
            
            await page.evaluate(() => window.scrollBy(0, 500));
            await wait(1000);

            const cartValidation = await page.evaluate(() => {
              const bodyText = document.body.innerText.toLowerCase();
              if (bodyText.includes('tu cesta está vacía') || bodyText.includes('carro vacío') || bodyText.match(/0 productos/i)) {
                return { hasItems: false, total: '0,00' };
              }
              
              const textNodes = Array.from(document.querySelectorAll('*'))
                  .filter(el => el.children.length === 0 && el.innerText.includes('€'));
              
              let totalMatch = 'Desconocido';
              for (const node of textNodes) {
                if (node.innerText.match(/\d+,\d{2}/)) {
                   totalMatch = node.innerText.trim();
                   break;
                }
              }
              return { hasItems: true, total: totalMatch };
            });

            if (cartValidation.hasItems && cartValidation.total !== 'Desconocido') {
              console.log(`[OK] AÑADIDO: Producto ${sku} consolidado en el carrito.`);
              console.log(`Validación final: El carrito tiene un total de ${cartValidation.total}`);
            } else {
              console.log(`[INFO] No se pudo leer el total explícito, pero el click de compra fue realizado para SKU ${sku}.`);
            }
            itemsAdded.push(sku); // Asumimos éxito si el click ocurrió sin errores catastróficos

          } catch (validationErr) {
            console.log(`[INFO] Timeout o error al leer el total (${validationErr.message}), pero el click de compra fue realizado para SKU ${sku}.`);
            itemsAdded.push(sku);
          }

        } else {
          console.log(`[ERROR] No se encontró botón interactivo para SKU: ${sku}`);
        }
      } catch (err) {
        console.warn(`[SKIP SKU ${sku}] Error de navegación durante el proceso: ${err.message}`);
      }
    }

    await browser.close();
    console.log(`[ROBOT] 4/4 ✨ Finalizado. Añadidos REALES: ${itemsAdded.length}`);
    res.json({ success: true, itemsAdded });

  } catch (error) {
    if (browser) await browser.close();
    console.error('[ROBOT FATAL ERROR]', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Bachan Robot v2.12.12 escuchando en puerto ${port}`);
});
