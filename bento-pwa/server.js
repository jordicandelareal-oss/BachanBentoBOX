import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Endpoint para sincronizar con Mercadona
app.post('/sync-mercadona', (req, res) => {
  const { skus } = req.body;
  
  if (!skus || !Array.isArray(skus) || skus.length === 0) {
    return res.status(400).json({ success: false, error: 'No se proporcionaron SKUs válidos' });
  }

  console.log(`\n📦 Recibida solicitud de sincronización para SKUs: ${skus.join(', ')}`);
  
  const scriptPath = path.join(__dirname, 'scripts', 'mercadona_basket.mjs');
  const command = `node ${scriptPath} ${skus.join(' ')}`;
  
  console.log(`🖥️ Ejecutando: ${command}`);
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error al ejecutar el script: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`⚠️ Advertencia en el script: ${stderr}`);
    }
    console.log(`✅ Resultado del script:\n${stdout}`);
  });

  res.json({ 
    success: true, 
    message: 'Proceso de sincronización iniciado. Revisa la ventana del navegador que se ha abierto.',
    skus: skus
  });
});

app.listen(port, () => {
  console.log('Servidor Puente Bachan activo en puerto 3001');
});
