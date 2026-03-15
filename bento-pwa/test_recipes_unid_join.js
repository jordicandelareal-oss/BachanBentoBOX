import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function test() {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, "Unid_Id", units(name)')
    .limit(1)
  if (data?.length) {
    console.log("Success:", JSON.stringify(data[0]))
  } else {
    console.log("Error:", error)
  }
}
test()
