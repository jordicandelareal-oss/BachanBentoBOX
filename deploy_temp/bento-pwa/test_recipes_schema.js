import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function test() {
  const { data, error } = await supabase.from('recipes').select('*').limit(1)
  if (data?.length) {
    console.log("Recipes columns:", Object.keys(data[0]))
  } else {
    console.log("No data or error:", error)
  }
}
test()
