import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function test() {
  const { data, error } = await supabase.from('recipes').select('"Unid_Id"').limit(1)
  if (data?.length) {
    console.log("Success")
  } else {
    console.log("Error:", error)
  }
}
test()
