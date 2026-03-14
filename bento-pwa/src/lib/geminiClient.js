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
  }
  ]
}]

const SYSTEM_PROMPT = `
Eres NANA, el cerebro inteligente, con memoria y visión de BaChan Bento Box.
Tu objetivo es gestionar la cocina, inventarios y rentabilidad con precisión y rapidez.

PERSONALIDAD:
- Profesional, experta y directa. 
- Tono cálido pero eficiente.
- TIENES MEMORIA: Usa 'upsert_user_preference' para recordar gustos o reglas.
- EMPATÍA: Menciona explícitamente cuando uses la memoria ("Como sé que...").
`

export async function processCommand(message, contextData = {}) {
  try {
    const { data: json, error } = await supabase.functions.invoke('nana-chat', {
      body: {
        prompt: message,
        contextData: contextData,
        tools: TOOLS,
        systemPrompt: SYSTEM_PROMPT
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
