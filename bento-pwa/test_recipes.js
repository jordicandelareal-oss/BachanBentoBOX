import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function test() {
  console.log("Fetching view_recipe_costs...")
  const { data, error } = await supabase
    .from('view_recipe_costs')
    .select('*')
    .limit(1)
  
  if (data?.length) {
    console.log("Keys available:", Object.keys(data[0]))
    console.log("Sample:", data[0])
  } else {
    console.log("Error:", error)
  }
}
test()
