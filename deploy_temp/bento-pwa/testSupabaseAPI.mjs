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
        process.env[key] = val.trim();
      }
    });
  }
}

loadEnv('.env'); loadEnv('.env.local');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('menu_items').select('*').limit(2);
  console.log('MenuItems:', data, error);
}
run();
