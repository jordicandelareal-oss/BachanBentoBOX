import { supabase } from './supabaseClient'

// GEMINI_KEY is no longer needed on the client. It lives in the Supabase Edge Function environment.
const TOOLS = [{
  functionDeclarations: [
    {
      name: "updatePrice",
      description: "Actualiza el precio de compra de un ingrediente existente.",
      parameters: {
        type: "OBJECT",
        properties: {
          item: { type: "string" },
          price: { type: "number" }
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
          item: { type: "string" },
          price: { type: "number" },
          unit_id: { type: "string" }
        },
        required: ["item", "price", "unit_id"]
      }
    },
    {
      name: "fillIngredientData",
      description: "Extrae datos de un ingrediente desde fotos (frontal, nutricional, código de barras).",
      parameters: {
        type: "OBJECT",
        properties: {
          name: { type: "string", description: "Nombre descriptivo del producto" },
          brand: { type: "string", description: "Marca del producto" },
          barcode: { type: "string", description: "Código de barras (EAN)" },
          purchase_format: { type: "number", description: "Cantidad/Peso del envase (ej: 1000 para 1kg)" },
          unit_name: { type: "string", description: "Unidad (kg, L, g, ml, ud)" },
          category_name: { type: "string", description: "Sugerencia de categoría (ej: PROTEINA, VERDURA, etc.)" }
        }
      }
    },
    {
      name: "suggestProductImage",
      description: "Busca y sugiere una URL de imagen de catálogo para un producto específico (Mercadona/Retail).",
      parameters: {
        type: "OBJECT",
        properties: {
          image_url: { type: "string", description: "URL directa de la imagen del producto" },
          source: { type: "string", description: "Fuente de la imagen (ej: Mercadona, OpenFoodFacts, etc.)" }
        },
        required: ["image_url"]
      }
    },
    {
      name: "suggestProductGallery",
      description: "Sugiere una galería de múltiples imágenes profesionales para un producto.",
      parameters: {
        type: "OBJECT",
        properties: {
          images: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                url: { type: "string" },
                source: { type: "string" }
              },
              required: ["url"]
            }
          }
        },
        required: ["images"]
      }
    },
    {
      name: "suggestSearchQuery",
      description: "Sugiere una query de búsqueda optimizada para encontrar una imagen profesional del producto. ÚSALA cuando no sepas la URL exacta de la imagen.",
      parameters: {
        type: "OBJECT",
        properties: {
          query: { type: "string", description: "Término de búsqueda en inglés (ej: 'broccoli white background food photography')" },
          query_es: { type: "string", description: "Término de búsqueda en español como alternativa" }
        },
        required: ["query"]
      }
    }
  ]
}]

const SYSTEM_PROMPT = `
Eres NANA, el cerebro inteligente de BaChan Bento Box.
Tu objetivo es gestionar la cocina, inventarios y rentabilidad con precisión.

PERSONALIDAD: Profesional, experta y directa. Tono cálido pero eficiente.

SOBRE BÚSQUEDA DE IMÁGENES:
- NUNCA inventes ni supongas URLs de imágenes. Las URLs inventadas no funcionan.
- Para buscar una imagen de producto, usa SIEMPRE la herramienta 'suggestSearchQuery' con términos en inglés optimizados (ej: 'broccoli isolated white background', 'canned tuna product photo').
- Puedes también intentar 'suggestProductImage' si conoces la URL exacta y real de un producto en Open Food Facts (openfoodfacts.org) o similar.
`

export async function processCommand(message, contextData = {}) {
  try {
    const { data: json, error } = await supabase.functions.invoke('nana-chat', {
      body: {
        prompt: message,
        contextData: contextData,
        tools: TOOLS,
        systemPrompt: SYSTEM_PROMPT,
        imagesBase64: contextData.imagesBase64 || null
      }
    })

    if (error) {
      console.error("Error calling Nana Edge Function:", error)
      return { message: "Estoy un poco sorda ahora mismo, revisa la conexión.", toolCalls: [] }
    }
    
    if (json.candidates && json.candidates[0].content) {
      const candidate = json.candidates[0]
      const parts = candidate.content.parts
      
      let textResponse = ""
      let toolCalls = []

      parts.forEach(part => {
        if (part.text) textResponse += part.text
        if (part.functionCall) {
          // [DIAGNOSTIC LOG - remove before production]
          console.log(`🔍 [Nana Tool] Called: ${part.functionCall.name}`, part.functionCall.args);
          toolCalls.push({
            name: part.functionCall.name,
            args: part.functionCall.args
          })
        }
      })

      if (toolCalls.length > 0) {
        await executeToolCalls(toolCalls)
      }

      return { message: textResponse, toolCalls }
    }
  } catch (err) {
    console.error("Network or parsing error in processCommand:", err);
    return { message: "Estoy un poco sorda ahora mismo, revisa la conexión.", toolCalls: [] }
  }

  return { message: "Lo siento, tuve un problema al procesar eso.", toolCalls: [] }
}

async function executeToolCalls(calls) {
  for (const call of calls) {
    try {
      if (call.name === 'updatePrice') {
        await supabase.from('ingredients').update({ purchase_price: call.args.price }).eq('name', call.args.item)
      } else if (call.name === 'addIngredient') {
        await supabase.from('ingredients').insert({ 
          name: call.args.item, 
          purchase_price: call.args.price,
          unit_id: call.args.unit_id 
        })
      }
    } catch (e) {
      console.error(`Error executing tool ${call.name}:`, e);
    }
  }
}
