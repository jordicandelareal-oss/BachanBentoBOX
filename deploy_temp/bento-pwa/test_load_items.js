import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function test() {
  console.log("Fetching recipe_ingredients with explicit FK...")
  const { data, error } = await supabase
    .from('recipe_ingredients')
    .select(`
      quantity,
      ingredient:ingredients(
        id, name, purchase_price, unit_id,
        units:unit_id(name)
      ),
      child_recipe:recipes!recipe_ingredients_child_recipe_id_fkey(id, name, portions)
    `)
    .eq('recipe_id', 'eef2a850-f63b-4feb-b6ef-c52f4461cd94')
  console.log("Error:", error)
  console.log("Data length:", data?.length)
  if (data?.length) {
    console.log("Sample:", JSON.stringify(data[0], null, 2))
  }
}
test()
