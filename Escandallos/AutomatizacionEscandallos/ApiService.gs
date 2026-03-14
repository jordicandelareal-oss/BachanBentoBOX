/**
 * API Service for BaChan Mobile App
 */

/**
 * EJECUTAR ESTA FUNCIÓN UNA SOLA VEZ para guardar la clave de forma segura.
 * Luego puedes borrar la clave de aquí.
 */
function configurarClaveGemini() {
  const key = "REMOVED_GEMINI_KEY"; 
  PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', key);
  console.log("Clave guardada con éxito. Ya puedes borrarla del código.");
}

/**
 * CONFIGURACIÓN DE VOZ NANA
 * Es la voz que usará Google Cloud TTS.
 * @param {string} name - Nombre de la voz (ej: "es-ES-Neural2-A")
 * @param {number} pitch - Tono en el rango [-20, 20]
 * @param {number} rate - Velocidad en el rango [0.25, 4.0]
 */
function configurarVozNana(name, pitch, rate) {
  const props = PropertiesService.getScriptProperties();
  
  if (name) props.setProperty('NANA_VOICE_NAME', name);
  
  // Validaciones de seguridad para evitar errores en la API
  if (pitch !== undefined) {
    const safePitch = Math.max(-20, Math.min(20, pitch));
    props.setProperty('NANA_VOICE_PITCH', safePitch.toString());
  }
  
  if (rate !== undefined) {
    const safeRate = Math.max(0.25, Math.min(4.0, rate));
    props.setProperty('NANA_VOICE_RATE', safeRate.toString());
  }
  
  console.log("Configuración de voz de Nana actualizada.");
}

/**
 * PERFIL: NANA AMISTOSA
 * Voz cálida, tono ligeramente agudo (+2.0) y velocidad pausada (0.85).
 * Ideal para una interacción cercana y acogedera.
 */
function perfilNanaAmistosa() {
  configurarVozNana("es-ES-Neural2-A", 2.0, 0.85);
  PropertiesService.getScriptProperties().setProperty('NANA_SLANG_MODE', 'false');
  console.log("Nana ahora tiene un perfil AMISTOSO.");
}

/**
 * PERFIL: NANA PROFESIONAL
 * Voz equilibrada, tono neutro (-1.0) y velocidad estándar (0.95).
 * Ideal para dar datos, precios o reportes de inventario.
 */
function perfilNanaProfesional() {
  configurarVozNana("es-ES-Neural2-A", -1.0, 0.95);
  PropertiesService.getScriptProperties().setProperty('NANA_SLANG_MODE', 'false');
  console.log("Nana ahora tiene un perfil PROFESIONAL.");
}

/**
 * PERFIL: NANA URGENTE
 * Voz enérgica, tono firme (+4.0) y velocidad rápida (1.15).
 */
function perfilNanaUrgente() {
  configurarVozNana("es-ES-Neural2-A", 4.0, 1.15);
  PropertiesService.getScriptProperties().setProperty('NANA_SLANG_MODE', 'false');
  console.log("Nana ahora tiene un perfil URGENTE.");
}

/**
 * PERFIL: NANA FLAITE (CHILEAN SLANG)
 * Voz con actitud urbana, tono firme y slang chileno activado.
 */
function perfilNanaFlaite() {
  configurarVozNana("es-ES-Wavenet-C", 0.0, 1.05); // Una voz que puede sonar más directa
  PropertiesService.getScriptProperties().setProperty('NANA_SLANG_MODE', 'true');
  console.log("Nana ahora tiene un perfil FLAITE (PULENTO).");
}

/**
 * SISTEMA DE CONSULTA: Muestra la configuración actual guardada.
 */
function obtenerEstadoNana() {
  const props = PropertiesService.getScriptProperties();
  const config = {
    name: props.getProperty('NANA_VOICE_NAME') || "es-ES-Neural2-A (Default)",
    pitch: props.getProperty('NANA_VOICE_PITCH') || "-1.0 (Default)",
    rate: props.getProperty('NANA_VOICE_RATE') || "0.95 (Default)",
    slangMode: props.getProperty('NANA_SLANG_MODE') === 'true',
    apiKeySet: !!props.getProperty('GOOGLE_TTS_KEY')
  };
  
  console.log("--- ESTADO ACTUAL DE NANA ---");
  console.log("Voz: " + config.name);
  console.log("Tono (Pitch): " + config.pitch);
  console.log("Velocidad (Rate): " + config.rate);
  console.log("Modo Slang Chileno: " + (config.slangMode ? "ACTIVADO" : "DESACTIVADO"));
  console.log("API Key Configurada: " + (config.apiKeySet ? "SÍ" : "NO"));
  console.log("----------------------------");
  return config;
}

function configurarGoogleTTS(apiKey) {
  PropertiesService.getScriptProperties().setProperty('GOOGLE_TTS_KEY', apiKey);
  console.log("API Key de Google TTS guardada.");
}

/**
 * DEBUG: Comprueba qué datos reales devuelve Supabase para los ingredientes.
 * Ejecútala manualmente desde el editor para ver los resultados en el Log.
 */
function debugSupabaseIngredients() {
  try {
    const result = callSupabase("ingredients?select=*&limit=5", "GET");
    Logger.log("Columnas y datos de ejemplo:");
    Logger.log(JSON.stringify(result, null, 2));
    return result;
  } catch(e) {
    Logger.log("Error: " + e.message);
    return e.message;
  }
}

function doGet(e) {
  // Debug mode for testing connectivity
  if (e.parameter.test === '1') {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Insumos");
    const data = sheet ? sheet.getDataRange().getValues().slice(0, 5) : "SHEET NOT FOUND";
    const result = { 
      status: 'ok', 
      message: '¡Conexión GET exitosa!',
      sheetFound: !!sheet,
      rowCount: sheet ? sheet.getLastRow() : 0,
      sampleRawData: data,
      processedDataExample: getInsumosData()
    };
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Serve the Mobile App HTML
  const template = HtmlService.createTemplateFromFile('App');
  return template.evaluate()
    .setTitle('BaChan Mobile')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getInsumosData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Insumos");
    
    if (!sheet) throw new Error("No se encuentra la pestaña 'Insumos'.");
    
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];

    // Buscar la fila de cabeceras (donde esté "Ingrediente")
    let headerRowIndex = -1;
    // Buscamos en las primeras 10 filas
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      if (data[i].join("").toLowerCase().includes("ingrediente")) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) headerRowIndex = 0; // Fallback al inicio

    const headers = data[headerRowIndex].map(h => h.toString().toLowerCase().trim());
    console.log("Headers encontrados en fila " + (headerRowIndex + 1) + ": " + headers.join(", "));
    
    const items = data.slice(headerRowIndex + 1).map(row => {
      let obj = {};
      let hasName = false;
      headers.forEach((h, i) => {
        const val = row[i];
        if (!h) return;

        // Mapeo robusto basado en el pantallazo
        if (h === "categoria") obj["categoria"] = val;
        else if (h === "subcategoria") obj["subcategoria"] = val; 
        else if (h === "ingrediente") {
          obj["nombre"] = val;
          if (val) hasName = true;
        }
        else if (h.includes("precio") && h.includes("compra")) obj["precio"] = val;
        else if (h === "unidad") obj["unidad"] = val;
        
        // Guardar también la clave original limpia
        obj[h.replace(/[^a-z0-9]/g, "_")] = val;
      });
      // Solo devolvemos si tiene nombre (evita filas vacías o decorativas)
      return hasName ? obj : null;
    }).filter(item => item !== null);

    return {
      totalInsumos: items.length,
      list: items
    };
  } catch (err) {
    console.error("Error in getInsumosData:", err);
    throw err;
  }
}

/**
 * Handle Assistant Commands
 */
function processAssistantCommand(userText, audioData = null) {
  try {
    let context = "";
    try {
      // --- ESTRATEGIA 1: Búsqueda específica por palabras clave ---
      // Extraemos palabras de más de 3 letras del mensaje del usuario
      const keywords = userText.split(/\s+/).filter(w => w.length > 3);
      let specificResults = [];
      
      for (const keyword of keywords.slice(0, 3)) { // Máximo 3 búsquedas específicas
        const sanitizedKeyword = keyword.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '').trim();
        if (sanitizedKeyword.length > 2) {
          // Buscamos tanto con el término original como una versión simplificada
          const simplified = sanitizedKeyword.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const found = callSupabase(
            `ingredients?select=name,purchase_price,unit_id&or=(name.ilike.*${encodeURIComponent(sanitizedKeyword)}*,name.ilike.*${encodeURIComponent(simplified)}*)&limit=5`,
            "GET"
          );
          specificResults = specificResults.concat(found);
        }
      }

      // --- ESTRATEGIA 2: Contexto general ampliado (80 ingredientes) ---
      const generalResults = callSupabase(
        "ingredients?select=name,purchase_price,unit_id&limit=80&order=name",
        "GET"
      );

      // Combinamos y deduplicamos por nombre
      const allIngredients = [...specificResults, ...generalResults];
      const unique = [];
      const seen = new Set();
      for (const ing of allIngredients) {
        if (!seen.has(ing.name)) {
          seen.add(ing.name);
          unique.push(ing);
        }
      }

      if (unique.length > 0) {
        const unitMapInverse = {
          "c39f0ea5-5325-4876-8395-940b4995ce4a": "KG",
          "5c78f142-b063-4702-8a9d-16f33203923a": "GR",
          "6f7c4e51-d41e-4b62-a5e2-04e8406798a1": "LT",
          "a0e27192-3b1a-4c28-91fb-4a25c317e0b5": "ML",
          "d4b2e8a1-c123-4e56-b789-f01234567890": "UD",
          "e5c3e9b2-d234-5f67-890a-f12345678901": "DOCENA",
          "f6d4f0c3-e345-6a78-901b-f23456789012": "BANDEJA"
        };
        
        context = "\n\nCONTEXTO DE DESPENSA REAL (Precios actuales en €):\n" +
                  unique.map(i => {
                    const unitName = unitMapInverse[i.unit_id] || "ud";
                    return `- ${i.name}: ${i.purchase_price}€/${unitName}`;
                  }).join("\n");
        console.log("Contexto generado con " + unique.length + " ingredientes únicos.");
      } else {
        context = "\n\nAVISO: No se han encontrado ingredientes en la base de datos.";
      }
    } catch (e) {
      console.warn("Could not fetch ingredients for context", e);
      context = "\n\nAVISO: No se puede acceder a los precios ahora mismo (Error: " + e.message + ")";
    }

    const geminiResult = callGemini(userText + context, audioData);
    const { response, toolCalls } = geminiResult;
    
    let actionResultsText = "";
    
    // Process Tool Calls
    if (toolCalls && toolCalls.length > 0) {
      toolCalls.forEach(tc => {
        const validation = validateToolArgs(tc.name, tc.args);
        if (!validation.isValid) {
          actionResultsText += `\n\n⚠️ Error en ${tc.name}: ${validation.error}`;
          return;
        }
        
        // Execute the action (mapping Gemini tool name to handleNanaSyncAction expectations)
        const renamedAction = {
          'updatePrice': 'UPDATE_PRICE',
          'addIngredient': 'ADD_INGREDIENT',
          'getRecipe': 'GET_RECIPE',
          'createRecipe': 'CREATE_RECIPE',
          'checkProfitability': 'CHECK_PROFITABILITY'
        }[tc.name];

        const actionData = {
          action: renamedAction,
          data: validation.sanitizedArgs
        };

        const success = executeAiAction(actionData);
        if (success) {
          actionResultsText += `\n\n${success}`;
        }
      });
    }
    
    // Generate Audio
    let audioOutput = null;
    try {
      const cleanText = cleanTextForSpeech(response);
      audioOutput = callGoogleTTS(cleanText);
    } catch (e) {
      console.warn("Error generando audio Google TTS:", e);
    }
    
    return { 
      message: response + actionResultsText, 
      audio: audioOutput 
    };
  } catch (err) {
    console.error("Error in processAssistantCommand:", err);
    return { message: "Error técnico en el cerebro (GAS): " + err.message + "\n\nDetalle: " + (err.stack ? err.stack.split("\n")[0] : "") };
  }
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    
    if (postData.action === 'assistant') {
      const result = processAssistantCommand(postData.text, postData.audio);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (postData.action === 'getInsumos') {
      const data = getInsumosData();
      return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (postData.action === 'debug_data') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName("Insumos");
      const rows = sheet.getDataRange().getValues().slice(0, 5);
      return ContentService.createTextOutput(JSON.stringify({ 
        sheetName: sheet ? sheet.getName() : "NOT FOUND",
        rowCount: sheet ? sheet.getLastRow() : 0,
        sampleRows: rows
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (postData.action === 'ping') {
      return ContentService.createTextOutput(JSON.stringify({ status: 'ok', msg: 'Conexión con BaChan establecida correctamente.' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ error: 'Acción no reconocida: ' + postData.action }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message, stack: err.stack }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function callSupabase(endpoint, method, payload = null) {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('SUPABASE_URL');
  const key = props.getProperty('SUPABASE_KEY');
  
  const options = {
    method: method,
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };
  
  if (payload) options.payload = JSON.stringify(payload);
  options.muteHttpExceptions = true; // No lanzar excepción en errores 400/500
  
  const response = UrlFetchApp.fetch(url + "/rest/v1/" + endpoint, options);
  const code = response.getResponseCode();
  const content = response.getContentText();
  
  if (code >= 400) {
    throw new Error(`Error en Supabase (${endpoint.split('?')[0]}): ${content}`);
  }
  
  return JSON.parse(content);
}

/**
 * Validates and sanitizes arguments for Gemini tools.
 * @param {string} toolName - Name of the tool being called.
 * @param {Object} args - Arguments passed by Gemini.
 * @returns {Object} { isValid: boolean, error: string, sanitizedArgs: Object }
 */
function validateToolArgs(toolName, args) {
  const result = { isValid: true, error: null, sanitizedArgs: { ...args } };
  
  // Sanitization helper
  const sanitize = (val) => {
    if (typeof val !== 'string') return val;
    // Remove potential script tags and SQL-like injections
    return val.replace(/<script.*?>.*?<\/script>/gi, '')
              .replace(/['";]/g, '')
              .trim();
  };

  try {
    switch (toolName) {
      case 'updatePrice':
        if (!args.item || typeof args.item !== 'string') {
          result.isValid = false;
          result.error = "El nombre del ingrediente es obligatorio y debe ser texto.";
        } else {
          result.sanitizedArgs.item = sanitize(args.item);
        }
        
        const price = parseFloat(args.price);
        if (isNaN(price) || price < 0) {
          result.isValid = false;
          result.error = "El precio debe ser un número positivo.";
        } else {
          result.sanitizedArgs.price = price;
        }
        break;

      case 'addIngredient':
        if (!args.item || typeof args.item !== 'string') {
          result.isValid = false;
          result.error = "El nombre del ingrediente es obligatorio.";
        } else {
          result.sanitizedArgs.item = sanitize(args.item);
        }

        const addPrice = parseFloat(args.price || 0);
        if (isNaN(addPrice) || addPrice < 0) {
          result.isValid = false;
          result.error = "El precio no puede ser negativo.";
        } else {
          result.sanitizedArgs.price = addPrice;
        }

        // Validate unit_id against known list
        const validUnits = [
          "c39f0ea5-5325-4876-8395-940b4995ce4a", // KG
          "5c78f142-b063-4702-8a9d-16f33203923a", // GR
          "6f7c4e51-d41e-4b62-a5e2-04e8406798a1", // LT
          "a0e27192-3b1a-4c28-91fb-4a25c317e0b5", // ML
          "d4b2e8a1-c123-4e56-b789-f01234567890", // UD
          "e5c3e9b2-d234-5f67-890a-f12345678901", // DOCENA
          "f6d4f0c3-e345-6a78-901b-f23456789012"  // BANDEJA
        ];
        if (!args.unit_id || !validUnits.includes(args.unit_id)) {
          result.isValid = false;
          result.error = `El ID de unidad "${args.unit_id}" no es válido. Debe ser un UUID de unidad conocido.`;
        }
        break;

      case 'getRecipe':
      case 'checkProfitability':
        const name = args.item || args.recipe_name;
        if (!name || typeof name !== 'string') {
          result.isValid = false;
          result.error = "Se requiere el nombre de la receta o ingrediente.";
        } else {
          if (args.item) result.sanitizedArgs.item = sanitize(args.item);
          if (args.recipe_name) result.sanitizedArgs.recipe_name = sanitize(args.recipe_name);
        }
        break;

      case 'createRecipe':
        if (!args.name || typeof args.name !== 'string') {
          result.isValid = false;
          result.error = "El nombre de la receta es obligatorio.";
        } else {
          result.sanitizedArgs.name = sanitize(args.name);
        }
        
        if (!args.ingredients || !Array.isArray(args.ingredients) || args.ingredients.length === 0) {
          result.isValid = false;
          result.error = "La receta debe tener al menos un ingrediente.";
        } else {
          result.sanitizedArgs.ingredients = args.ingredients.map(ing => ({
            name: sanitize(ing.name),
            qty: parseFloat(ing.qty) || 0
          }));
        }
        break;
    }
  } catch (e) {
    result.isValid = false;
    result.error = "Error de validación: " + e.message;
  }

  return result;
}

function executeAiAction(action) {
  try {
    const success = handleNanaSyncAction(action);
    
    if (action.action === "UPDATE_PRICE") {
      if (success) return `He actualizado el precio de **${action.item}** a **${action.price}€** en Supabase y el Sheet. Las fórmulas se recalcularon al tiro.`;
      return `Pucha la wea, no pude actualizar el precio de "${action.item}". Revisa si el nombre está bien escrito.`;
    }

    if (action.action === "ADD_INGREDIENT") {
      if (success) return `He añadido **${action.item}** a la base de datos correctamente. ¡Pulento!`;
      return `Me fue mal tratando de añadir el ingrediente. Se me cayó el sistema.`;
    }

    // Keep legacy logic for actions not yet moved to SupabaseSync or specialized ones
    if (action.action === "CREATE_RECIPE") {
      // (Legacy logic simplified for length, usually would move this too)
      const recipe = callSupabase("recipes", "POST", {
        name: action.name,
        portions: action.portions || 1
      })[0];
      
      const ingredientsData = callSupabase("ingredients?select=id,name", "GET");
      const ingredientsMap = {};
      ingredientsData.forEach(i => ingredientsMap[i.name.toLowerCase()] = i.id);
      
      const ingredientsToInsert = action.ingredients.map(ri => ({
        recipe_id: recipe.id,
        ingredient_id: ingredientsMap[ri.name.toLowerCase()],
        quantity: ri.qty
      })).filter(ri => ri.ingredient_id);
      
      if (ingredientsToInsert.length > 0) {
        callSupabase("recipe_ingredients", "POST", ingredientsToInsert);
      }
      return `¡Escandallo creado! He guardado la receta **${action.name}** con ${ingredientsToInsert.length} ingredientes.`;
    }

    if (action.action === "CHECK_PROFITABILITY" || action.action === "GET_RECIPE") {
      const name = action.recipe_name || action.item;
      let data = callSupabase("view_recipe_costs?recipe_name=ilike.*" + encodeURIComponent(name) + "*", "GET");
      if (data.length === 0) return `(Nota: No pillé detalles de "${name}" en los escandallos).`;
      
      const recipe = data[0];
      const cost = parseFloat(recipe.cost_per_portion).toFixed(2);
      return `La receta de **${recipe.recipe_name}** tiene un coste de **${cost}€ por ración**. ¿Le bajamos a los costos o qué?`;
    }

    return null;
  } catch (err) {
    console.error("Error executing action:", err);
    return "Error técnico al ejecutar la acción: " + err.message;
  }
}

/**
 * FUNCIÓN DE DIAGNÓSTICO - Ejecutar manualmente desde el Editor de Apps Script.
 * Comprueba que la API Key de Google TTS funciona correctamente.
 */
function testGoogleTTS() {
  const sampleText = "Aquí tienes la receta de Bento: # Pollo Teriyaki; * 200g de pollo. Coste: 5€. ACCION: {\"action\": \"GET_RECIPE\"}";
  const cleaned = cleanTextForSpeech(sampleText);
  console.log("Texto Original: " + sampleText);
  console.log("Texto Limpio: " + cleaned);
  
  const result = callGoogleTTS(cleaned);
  if (result) {
    console.log("✅ Google TTS OK! Audio generado (" + result.length + " chars en base64).");
  } else {
    console.error("❌ Google TTS falló. Revisa el log de arriba.");
  }
}

/**
 * Limpia el texto de símbolos, markdown y JSON para que suene natural al hablar.
 */
function cleanTextForSpeech(text) {
  if (!text) return "";
  
  let clean = text;
  
  // 1. Quitar bloque de ACCION JSON si existe
  if (clean.includes("ACCION:")) {
    clean = clean.split("ACCION:")[0];
  }
  
  // 2. Quitar Markdown (negritas, cursivas, títulos)
  clean = clean.replace(/\*\*/g, ""); // Negritas
  clean = clean.replace(/\*/g, "");   // Cursivas o listas
  clean = clean.replace(/#/g, "");    // Títulos
  clean = clean.replace(/_/g, "");    // Subrayados
  
  // 3. Quitar caracteres de puntuación técnica que suenan mal
  clean = clean.replace(/;/g, ",");   // Punto y coma por coma (pausa suave)
  clean = clean.replace(/:\s?-/g, ":"); // Quitar guiones tras dos puntos
  clean = clean.replace(/[\(\)\[\]\{\}]/g, ""); // Quitar paréntesis y corchetes
  
  // 4. Convertir símbolos a palabras
  clean = clean.replace(/€/g, " euros");
  clean = clean.replace(/\%/g, " por ciento");
  
  // 5. Corregir gramática de números (uno -> una) y concordancia oral
  // Específico para porciones/raciones
  clean = clean.replace(/\bporciones:?\s?1\b/gi, "una porción");
  clean = clean.replace(/\braciones:?\s?1\b/gi, "una ración");
  clean = clean.replace(/\bración\s?1\b/gi, "una ración");
  clean = clean.replace(/\b1\s?ud\b/gi, "una unidad");
  clean = clean.replace(/\b1\s?unid\b/gi, "una unidad");
  clean = clean.replace(/\b1\s?unidad\b/gi, "una unidad");
  clean = clean.replace(/\b1\s?gramos?\b/gi, "un gramo");
  clean = clean.replace(/\b1\s?kg\b/gi, "un kilo");
  clean = clean.replace(/\b1\s?l\b/gi, "un litro");
  
  // Corregir "uno" suelto que debería ser "un" o "una" delante de sustantivos comunes en cocina
  clean = clean.replace(/\b1\s+(papa|zanahoria|cebolla|cucharada|taza|pizca|unidad)\b/gi, "una $1");
  clean = clean.replace(/\b1\s+(diente|clavo|litro|kilo|gramo|tomate|huevo)\b/gi, "un $1");
  
  // 6. Limpieza final de espacios
  clean = clean.trim();
  
  return clean;
}

/**
 * EXPANSIÓN AVANZADA: DICCIONARIO FLAITE CON SSML
 * Transactua el texto a un estilo urbano chileno agresivo con ritmo "cantadito".
 */
function procesarTextoFlaite(texto) {
  if (!texto) return "";
  let t = texto.toLowerCase();

  // 1. Deformación de Frases (Slang Agresivo de contexto)
  const phraseMap = {
    "aquí tienes los detalles": "ya weon, aquí te traigo toda la pulenta",
    "están los detalles": "está toda la pulenta",
    "te parece bien": "esa onda o no longi",
    "estás de acuerdo": "te hace sentido o no hno",
    "no encuentro la receta": "pucha la wea, no pillé niuna wea de receta",
    "no he encontrado": "no pillé niuna wea",
    "aquí tienes": "ya weon, toma",
    "lo siento": "pucha la wea",
    "error técnico": "quedó la mansa wea en el server",
    "coste de": "lo que te sale la wea de"
  };

  for (let phrase in phraseMap) {
    let regex = new RegExp(phrase, "gi");
    t = t.replace(regex, phraseMap[phrase]);
  }

  // 2. Sustitución Fonética Masiva
  const subst = {
    "nada": "niuna wea",
    "todo": "toda la wea",
    "específica": "detallá poh weon",
    "específico": "detallao poh weon",
    "japoneses": "de esos de allá del japón, ¿cachái?",
    "japonesas": "de esas de allá del japón, ¿cachái?",
    "ingrediente": "cosa",
    "receta": "wea de receta"
  };

  for (let key in subst) {
    let regex = new RegExp("\\b" + key + "\\b", "gi");
    t = t.replace(regex, subst[key]);
  }

  // 3. Diccionario de Base
  const dict = {
    "policía": "los paco",
    "dinero": "las monea",
    "lucas": "las luca",
    "plata": "la plata",
    "amigo": "compa",
    "compadre": "socio",
    "tonto": "longi",
    "torpe": "pavre",
    "imbécil": "gil",
    "fiesta": "el mambo",
    "carrete": "el carrete",
    "casa": "la caleta",
    "comida": "el bajón",
    "ropa": "la pilcha",
    "hermano": "el broca cochi",
    "niño": "el cabro chico",
    "excelente": "pulento",
    "fantástico": "bacán",
    "genial": "filete",
    "malo": "fome",
    "aburrido": "penca"
  };

  for (let key in dict) {
    let regex = new RegExp("\\b" + key + "\\b", "gi");
    t = t.replace(regex, dict[key]);
  }

  // 4. Voseo Chileno
  const voseo = {
    "sabes": "sabí", "quieres": "querí", "tienes": "tení",
    "estás": "estái", "vas": "vai", "miras": "mirái", "haces": "hací"
  };
  for (let verb in voseo) {
    let regex = new RegExp("\\b" + verb + "\\b", "gi");
    t = t.replace(regex, voseo[verb]);
  }

  // 5. Fonética Chilena (-ao, -á)
  t = t.replace(/ado\b/gi, "ao");
  t = t.replace(/ada\b/gi, "á");

  // 6. Elongación Fonética en preguntas/exclamaciones
  t = t.replace(/([aeiouáéíóú])([?!]+)/gi, (match, vocal, sign) => {
    return vocal.repeat(4) + sign;
  });

  // 7. Muletillas con SSML Prosody (el "cantadito")
  const muletillas = ["¿cachái?", "po", "viste", "hermano", "si o no"];
  let frases = t.split(". ");
  t = frases.map(f => {
    if (f.trim().length > 5 && Math.random() > 0.4) {
      const m = muletillas[Math.floor(Math.random() * muletillas.length)];
      const mSSML = `<prosody pitch="+30%">${m}</prosody>`;
      return f.trim() + " " + mSSML;
    }
    return f;
  }).join(". ");

  // 8. Ritmo entrecortado con SSML <break>
  let palabras = t.split(" ");
  let tFinal = "";
  for (let i = 0; i < palabras.length; i++) {
    tFinal += palabras[i] + " ";
    if (i % 4 === 0 && i > 0 && !palabras[i].includes("<")) {
      tFinal += '<break time="50ms"/>';
    }
  }

  return "<speak>" + tFinal.trim() + "</speak>";
}

/**
 * Llama a la API de Google Cloud Text-to-Speech.
 * Devuelve el audio en base64 (MP3) o null si falla.
 */
function callGoogleTTS(text) {
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('GOOGLE_TTS_KEY') || "REMOVED_TTS_KEY";
  
  // 0. Aplicar Slang Chileno si está activo
  let processedText = text;
  let useSSML = false;
  if (props.getProperty('NANA_SLANG_MODE') === 'true') {
    processedText = procesarTextoFlaite(text);
    useSSML = true; // El procesador flaite ahora devuelve SSML
  }

  // Configuraciones personalizables
  const voiceName = props.getProperty('NANA_VOICE_NAME') || "es-ES-Neural2-A";
  const voicePitch = parseFloat(props.getProperty('NANA_VOICE_PITCH') || "-1.0");
  const voiceRate = parseFloat(props.getProperty('NANA_VOICE_RATE') || "0.95");

  const url = "https://texttospeech.googleapis.com/v1/text:synthesize?key=" + apiKey;

  // El input cambia si usamos SSML o texto plano
  const input = useSSML ? { ssml: processedText } : { text: processedText };

  const payload = {
    input: input,
    voice: {
      languageCode: "es-ES",
      name: voiceName,
      ssmlGender: "FEMALE"
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: voiceRate,
      pitch: voicePitch
    }
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    console.log("Google TTS: Generando audio con voz " + voiceName + "...");
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();

    if (code === 200) {
      const json = JSON.parse(response.getContentText());
      console.log("Google TTS: ✅ Audio generado correctamente.");
      return json.audioContent;
    } else {
      console.error("Google TTS ERROR " + code + ":", response.getContentText());
      return null;
    }
  } catch (e) {
    console.error("Google TTS EXCEPCIÓN:", e.message);
    return null;
  }
}
