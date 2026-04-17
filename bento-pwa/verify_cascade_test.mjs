import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { setTimeout } from 'timers/promises';

function loadEnv(path) {
  try {
    if (fs.existsSync(path)) {
      const content = fs.readFileSync(path, 'utf-8');
      content.split(/\r?\n/).forEach(line => {
        const match = line.match(/^\s*([^=]+)\s*=\s*(.*)$/);
        if (match) {
          const key = match[1].trim();
          const val = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes if any
          process.env[key] = val;
        }
      });
    }
  } catch (e) {
    console.error('Error reading env:', e);
  }
}

loadEnv('.env'); 
loadEnv('.env.local');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log(`🔗 Conectando a Supabase: ${supabaseUrl ? 'URL OK' : 'URL MISSING'}`);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no encontradas en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('🚀 Iniciando Prueba de Integridad de Cascada de Costes...');

  // 1. Obtener estado inicial (Nótese: Carne test1 con C mayúscula)
  const { data: initialRecipes, error: err1 } = await supabase
    .from('recipes')
    .select('name, cost_per_portion')
    .in('name', ['Carne test1', 'bento test1']);

  const { data: initialIng, error: err2 } = await supabase
    .from('ingredients')
    .select('name, cost_per_unit')
    .eq('id', '60802209-c0cd-46fe-ba18-883f7bb2f70e')
    .single();

  if (err1 || err2) {
    console.error('❌ Error al obtener datos iniciales:', err1 || err2);
    return;
  }

  console.log('📊 Estado Inicial:');
  console.log(` - Insumo (Lomo): ${initialIng.cost_per_unit} €/ud`);
  initialRecipes.forEach(r => console.log(` - ${r.name}: ${r.cost_per_portion} €`));

  // 2. Simular cambio (incremento de 1€)
  const newPrice = Number(initialIng.cost_per_unit) + 1.0;
  console.log(`\nI. Actualizando Insumo (Lomo) a -> ${newPrice} €/ud...`);
  
  const { error: updateErr, count } = await supabase
    .from('ingredients')
    .update({ cost_per_unit: newPrice })
    .eq('id', '60802209-c0cd-46fe-ba18-883f7bb2f70e', { count: 'exact' });

  if (updateErr) {
    console.error('❌ Error actualizando ingrediente:', updateErr);
    return;
  }
  
  if (count === 0) {
    console.warn('⚠️ Advertencia: No se actualizó ninguna fila. ¿Faltan permisos (RLS)?');
  } else {
    console.log(`✅ Ingrediente actualizado correctamente (${count} filas).`);
  }

  // 3. Esperar a que los triggers actúen
  console.log('II. Esperando propagación (3s)...');
  await setTimeout(3000);

  // 4. Verificar resultados
  const { data: finalRecipes, error: err3 } = await supabase
    .from('recipes')
    .select('name, cost_per_portion')
    .in('name', ['Carne test1', 'bento test1']);

  console.log('\n📊 Estado Final:');
  finalRecipes.forEach(r => {
    const initial = initialRecipes.find(ir => ir.name === r.name);
    const changed = Number(r.cost_per_portion) !== Number(initial.cost_per_portion);
    console.log(` - ${r.name}: ${r.cost_per_portion} € [${changed ? '✅ ACTUALIZADO' : '❌ NO CAMBIÓ'}]`);
  });

  // 5. Revertir cambio para dejar datos como estaban
  console.log(`\nIII. Revirtiendo precio original (${initialIng.cost_per_unit} €)...`);
  await supabase
    .from('ingredients')
    .update({ cost_per_unit: initialIng.cost_per_unit })
    .eq('id', '60802209-c0cd-46fe-ba18-883f7bb2f70e');

  console.log('🏁 Prueba Finalizada.');
}

verify();
