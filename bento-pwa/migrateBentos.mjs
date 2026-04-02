import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

function loadEnv(path) {
  if (fs.existsSync(path)) {
    const content = fs.readFileSync(path, 'utf-8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        val = val.trim();
        process.env[key] = val;
      }
    });
  }
}

loadEnv('.env');
loadEnv('.env.local');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('1. Checking preparation_categories for "Bentos"');
  let { data: cat, error } = await supabase.from('preparation_categories').select('*').ilike('Name', 'Bentos').single();
  let bentoCatId;
  
  if (error || !cat) {
    if (error && error.code !== 'PGRST116') {
      console.log('Error checking category:', error);
      process.exit(1);
    }
    console.log('Category Bentos not found, creating it...');
    const { data: newCat, error: insertErr } = await supabase.from('preparation_categories').insert([{ Name: 'Bentos' }]).select().single();
    if (insertErr) {
      console.error('Error creating category:', insertErr);
      process.exit(1);
    }
    bentoCatId = newCat.id;
  } else {
    bentoCatId = cat.id;
  }
  console.log('Bentos Category ID:', bentoCatId);

  console.log('2. Updating recipes with recipe_type="bento" that have null preparation_category_Id');
  const { data: updated, error: updateErr } = await supabase
    .from('recipes')
    .update({ preparation_category_Id: bentoCatId })
    .eq('recipe_type', 'bento')
    .is('preparation_category_Id', null)
    .select();

  if (updateErr) {
    console.error('Error updating recipes:', updateErr);
  } else {
    console.log(`Updated ${updated ? updated.length : 0} bentos to have preparation_category_Id = ${bentoCatId}.`);
  }
}

run();
