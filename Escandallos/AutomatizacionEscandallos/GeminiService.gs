/**
 * Gemini API Integration for BaChan
 */
function getGeminiApiKey() {
  const props = PropertiesService.getScriptProperties();
  const key = props.getProperty('GEMINI_API_KEY');
  if (!key) {
    throw new Error("No se ha configurado la clave de API de Gemini en las Propiedades del Script.");
  }
  return key;
}

function callGemini(prompt, audioData = null) {
  const apiKey = getGeminiApiKey();
  const model = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const tools = [{
    function_declarations: [
      {
        name: "updatePrice",
        description: "Actualiza el precio de compra de un ingrediente existente.",
        parameters: {
          type: "OBJECT",
          properties: {
            item: { type: "string", description: "Nombre exacto del ingrediente (ej: 'Sal', 'Tomate')." },
            price: { type: "number", description: "Nuevo precio unitario en euros." }
          },
          required: ["item", "price"]
        }
      },
      {
        name: "addIngredient",
        description: "Añade un nuevo ingrediente a la base de datos.",
        parameters: {
          type: "OBJECT",
          properties: {
            item: { type: "string", description: "Nombre del nuevo ingrediente." },
            price: { type: "number", description: "Precio de compra inicial." },
            unit_id: { 
              type: "string", 
              description: "UUID de la unidad. KG: c39f0ea5-5325-4876-8395-940b4995ce4a, GR: 5c78f142-b063-4702-8a9d-16f33203923a, LT: 6f7c4e51-d41e-4b62-a5e2-04e8406798a1, ML: a0e27192-3b1a-4c28-91fb-4a25c317e0b5, UD: d4b2e8a1-c123-4e56-b789-f01234567890" 
            },
            category: { type: "string", description: "Categoría (ej: 'Proteina', 'Vegetal', 'Secos')." }
          },
          required: ["item", "price", "unit_id"]
        }
      },
      {
        name: "getRecipe",
        description: "Obtiene los detalles y el coste de una receta o plato.",
        parameters: {
          type: "OBJECT",
          properties: {
            item: { type: "string", description: "Nombre de la receta a consultar." }
          },
          required: ["item"]
        }
      },
      {
        name: "checkProfitability",
        description: "Analiza si una receta es rentable según sus costes actuales.",
        parameters: {
          type: "OBJECT",
          properties: {
            recipe_name: { type: "string", description: "Nombre de la receta a analizar." }
          },
          required: ["recipe_name"]
        }
      },
      {
        name: "createRecipe",
        description: "Crea un nuevo escandallo (receta) con sus ingredientes.",
        parameters: {
          type: "OBJECT",
          properties: {
            name: { type: "string", description: "Nombre de la nueva receta." },
            portions: { type: "number", description: "Número de raciones que rinde la receta." },
            ingredients: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "string", description: "Nombre del ingrediente." },
                  qty: { type: "number", description: "Cantidad en la unidad base (g, ml, ud)." }
                }
              }
            }
          },
          required: ["name", "portions", "ingredients"]
        }
      }
    ]
  }];

  const systemPrompt = `Eres BACHAN, el cerebro inteligente de BaChan Bento Box.
      Tu objetivo es gestionar la cocina, inventarios y rentabilidad con precisión y rapidez.
      
      PERSONALIDAD:
      - Profesional, experta y directa. 
      - Tono cálido pero eficiente.
      
      IDIOMAS:
      - Español y Japonés.
      
      REGLAS CRÍTICAS:
      1. Usa los datos de "CONTEXTO DE DESPENSA REAL" para responder.
      2. Si el usuario te da un dato nuevo (como un precio), usa la herramienta correspondiente.
      3. No inventes IDs de unidad. Usa solo los proporcionados en la descripción de las herramientas.
      4. Si falta información para una herramienta, pídela con naturalidad.
      
      PARA LA VOZ:
      - Evita símbolos técnicos (% se dice 'por ciento', € se dice 'euros').
      - Sé natural, como si hablaras en la cocina.`;

  let userParts = [{ text: prompt }];
  if (audioData && audioData.base64) {
    userParts.push({
      inlineData: {
        mimeType: audioData.mimeType || "audio/mp4",
        data: audioData.base64
      }
    });
  }

  const payload = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: userParts }],
    tools: tools,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1000,
    }
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseText = response.getContentText();
  const json = JSON.parse(responseText);
  
  if (json.candidates && json.candidates[0].content) {
    const candidate = json.candidates[0];
    const parts = candidate.content.parts;
    
    let textResponse = "";
    let toolCalls = [];

    parts.forEach(part => {
      if (part.text) {
        textResponse += part.text;
      }
      if (part.functionCall) {
        toolCalls.push({
          name: part.functionCall.name,
          args: part.functionCall.args
        });
      }
    });

    return {
      response: textResponse,
      toolCalls: toolCalls
    };
  } else {
    console.error("Gemini Error:", responseText);
    return {
      response: "Lo siento, tuve un problema al procesar eso. ¿Podrías repetirlo?",
      toolCalls: []
    };
  }
}

/**
 * Debug function to see available models
 */
function debugListModels() {
  const apiKey = getGeminiApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  const options = {
    method: "get",
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  Logger.log(response.getContentText());
  return response.getContentText();
}
