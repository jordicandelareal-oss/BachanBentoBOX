import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GEMINI_KEY = Deno.env.get('VITE_GEMINI_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verify User (Optional but recommended: Verify JWT from Authorization header here)
    // const authHeader = req.headers.get('Authorization')
    // const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } })
    // const { data: { user } } = await supabaseClient.auth.getUser()
    // if (!user) throw new Error('Unauthorized')

    // 2. Extract payload
    const body = await req.json()
    const { prompt, contextData, tools, systemPrompt } = body

    if (!GEMINI_KEY) throw new Error("VITE_GEMINI_KEY not configured in Edge Function")

    const modifiedPrompt = `${systemPrompt}

CONTEXTO ACTUAL EN TIEMPO REAL:
${JSON.stringify(contextData)}
`

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`
    
    const payload = {
      system_instruction: { parts: [{ text: modifiedPrompt }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: tools,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1000,
      }
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    const json = await response.json()
    return new Response(JSON.stringify(json), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }
})
