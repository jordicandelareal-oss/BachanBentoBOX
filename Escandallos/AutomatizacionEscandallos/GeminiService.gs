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

function callGemini(prompt, audioData = null, imageData = null) {
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
      },
      {
        name: "upsert_user_preference",
        description: "Guarda o actualiza una preferencia del usuario (moneda, alergias, margen de rinde, etc).",
        parameters: {
          type: "OBJECT",
          properties: {
            key: { type: "string", description: "Clave de la preferencia (ej: 'moneda', 'alergias')." },
            value: { type: "string", description: "Valor de la preferencia (ej: 'USD', 'mani')." }
          },
          required: ["key", "value"]
        }
      },
      {
        name: "get_user_preferences",
        description: "Recupera todas las preferencias del usuario guardadas.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "process_purchase_ticket",
        description: "Analiza una imagen de un ticket o factura de compra para extraer productos y precios.",
        parameters: {
          type: "OBJECT",
          properties: {
            summary: { type: "string", description: "Resumen breve de la compra (comercio y fecha)." },
            matches: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "string", description: "Nombre del producto en el ticket." },
                  unit_price: { type: "number", description: "Precio unitario detectado." },
                  quantity: { type: "number", description: "Cantidad comprada." }
                }
              }
            },
            suggestions: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "string", description: "Nombre del producto en el ticket." },
                  suggested_name: { type: "string", description: "Nombre del producto existente sugerido." },
                  unit_price: { type: "number", description: "Precio unitario detectado." },
                  quantity: { type: "number", description: "Cantidad comprada." }
                }
              }
            },
            new_items: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "string", description: "Nombre del producto nuevo." },
                  unit_price: { type: "number", description: "Precio unitario." },
                  suggested_category: { type: "string", description: "Categoría sugerida." }
                }
              }
            }
          },
          required: ["summary"]
        }
      }
    ]
  }];

  const systemPrompt = `Eres NANA, el cerebro inteligente, con memoria y visión de BaChan Bento Box.
      Tu objetivo es gestionar la cocina, inventarios y rentabilidad con precisión y rapidez.
      
      PERSONALIDAD:
      - Profesional, experta y directa. 
      - Tono cálido pero eficiente.
      - TIENES MEMORIA: Usa 'upsert_user_preference' para recordar gustos o reglas.
      - EMPATÍA: Menciona explícitamente cuando uses la memoria ("Como sé que...").
      
      VISIÓN (SISTEMA DE RECONCILIACIÓN):
      - Si el usuario sube una imagen, es un ticket de compra.
      - Usa 'process_purchase_ticket' para categorizar el inventario:
        1. 'matches': Coincidencias exactas (>90% similitud).
        2. 'suggestions': Productos parecidos. Indica 'suggested_name' de la base de datos.
        3. 'new_items': Productos totalmente desconocidos.
      - PRIORIZACIÓN: En tickets largos, procesa los 10 productos más importantes/caros.
      - REGLA DE ORO: NO actualices precios automáticamente. Presenta el JSON para validación humana.
      
      IDIOMAS:
      - Español y Japonés.
      
      PARA LA VOZ:
      - Nana debe hablar al inicio: "Dáme un momento para ver este ticket...".
      - Nana debe hablar al final solo si hay dudas: "He terminado, pero tengo un par de dudas con unos ingredientes, ¿me ayudas?".
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
  
  if (imageData && imageData.base64) {
    userParts.push({
      inlineData: {
        mimeType: imageData.mimeType || "image/jpeg",
        data: imageData.base64
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

    if (json.usageMetadata) {
      logTokenUsage(json.usageMetadata);
    }

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

/**
 * Logs token usage for monitoring and efficiency analysis.
 */
function logTokenUsage(metadata) {
  const { promptTokenCount, candidatesTokenCount, totalTokenCount } = metadata;
  console.info(`[TOKEN_MONITOR] Prompt: ${promptTokenCount} | Response: ${candidatesTokenCount} | Total: ${totalTokenCount}`);
  
  // Guardamos un histórico ligero en propiedades por si queremos ver el acumulado semanal
  const props = PropertiesService.getScriptProperties();
  const currentTotal = parseInt(props.getProperty('TOTAL_TOKENS_CONSUMED') || "0");
  props.setProperty('TOTAL_TOKENS_CONSUMED', (currentTotal + totalTokenCount).toString());
}
