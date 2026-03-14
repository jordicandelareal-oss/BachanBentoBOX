// ==========================================
// 2. LÓGICA DE CÁLCULO EN INSUMOS
// ==========================================
function gestionarCalculoInsumos(e, sheet, row, dinamicos) {
  const col = e.range.getColumn();
  
  // Como confirmas que es la Fila 1 toda la cabecera verde:
  const filaCabInsumos = 1; 
  const cabeceras = sheet.getRange(filaCabInsumos, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const cabecerasLower = cabeceras.map(c => c.toString().trim().toLowerCase());
  
  // Buscar índices de las columnas dinámicamente, con fallback a las columnas estándar de tu foto
  const wordCostoUni = dinamicos.COL_COSTO_UNITARIO.toLowerCase();
  let COL_FORMATO = cabecerasLower.findIndex(c => c.includes("formato")) + 1;
  if (!COL_FORMATO) COL_FORMATO = 4; // Col D por defecto

  let COL_UNIDAD = cabecerasLower.indexOf("unidad") + 1;
  if (!COL_UNIDAD) COL_UNIDAD = 5; // Col E por defecto

  let COL_PRECIO = cabecerasLower.findIndex(c => c.includes("precio")) + 1;
  if (!COL_PRECIO) COL_PRECIO = 6; // Col F por defecto
  
  let COL_RESULTADO = cabecerasLower.findIndex(c => c.includes("costo") || c.includes("€/gr") || c.includes("€/ud"));
  if (COL_RESULTADO >= 0) {
    COL_RESULTADO = COL_RESULTADO + 1;
  } else {
    COL_RESULTADO = 7; // Por defecto Col G
  }
  
  const COL_RENDIMIENTO = cabecerasLower.indexOf("rendimiento %") + 1; // Opcional
  const COL_ALERGENOS = cabecerasLower.indexOf("alérgenos") + 1 || cabecerasLower.indexOf("alergenos") + 1;

  // Solo actuar si la edición ocurre en Formato, Unidad, Precio, Rendimiento o Alérgenos
  if (col !== COL_FORMATO && col !== COL_UNIDAD && col !== COL_PRECIO && col !== COL_RENDIMIENTO && col !== COL_ALERGENOS) return;
  if (!COL_RESULTADO) return;

  const formato = sheet.getRange(row, COL_FORMATO).getValue();
  const unidad = sheet.getRange(row, COL_UNIDAD).getValue().toString().toUpperCase().trim();
  const precio = sheet.getRange(row, COL_PRECIO).getValue();
  
  // Si has añadido rendimiento (ej. 0.8 para 80%), usarlo, sino 1 (100%)
  const rendimiento = (COL_RENDIMIENTO && sheet.getRange(row, COL_RENDIMIENTO).getValue()) ? sheet.getRange(row, COL_RENDIMIENTO).getValue() : 1; 
  const alergenos = COL_ALERGENOS ? sheet.getRange(row, COL_ALERGENOS).getValue() : "";
  let costoCalculado = 0;

  if (!formato || formato <= 0 || !precio || precio <= 0 || !unidad) {
    sheet.getRange(row, COL_RESULTADO).clearContent();
    return;
  }

  // Lógica conversiones
  const formatEfectivo = formato * rendimiento;

  switch (unidad) {
    case "KG":
    case "LT":
      costoCalculado = precio / (formatEfectivo * 1000); // Pasado a Gramos/ML
      break;
    default:
      costoCalculado = precio / formatEfectivo; // Ud, Gr, Ml directos
      break;
  }

  sheet.getRange(row, COL_RESULTADO)
       .setValue(costoCalculado)
       .setNumberFormat("0.00000€");

  // ==========================================
  // PROPAGAR CAMBIOS A TODAS LAS HOJAS DE RECETAS
  // ==========================================
  // Obtenemos los datos del ingrediente modificado para buscarlos en las recetas
  const categoriaInsumo = sheet.getRange(row, 1).getValue().toString().trim();
  const subcategoriaInsumo = sheet.getRange(row, 2).getValue().toString().trim();
  const nombreInsumo = sheet.getRange(row, 3).getValue().toString().trim();
  
  // Si no hay nombre de ingrediente, no podemos propagar nada
  if (!nombreInsumo) return;

  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const hojas = libro.getSheets();
  
  // Usamos la misma lista de hojas que ignoramos en Config.gs
  const HOJAS_SISTEMA = ["Insumos", "Plantilla", "Panel de Rentabilidad", "Config", "DB"];

  // Recorremos todas las hojas que sean de recetas (ej: Elaboraciones)
  for (let i = 0; i < hojas.length; i++) {
    const hojaActiva = hojas[i];
    const nombreHoja = hojaActiva.getName();
    
    // Saltamos hojas de sistema
    if (HOJAS_SISTEMA.includes(nombreHoja)) continue;

    const ultimaFila = hojaActiva.getLastRow();
    const ultimaColumna = hojaActiva.getLastColumn();
    if (ultimaFila < 2 || ultimaColumna < 2) continue;

    // Buscamos dinámicamente dónde están las cabeceras en esta hoja (primeras 5 filas)
    let filaCabeceras = 2; // Por defecto
    const primerasFilas = hojaActiva.getRange(1, 1, 5, 5).getValues();
    for (let f = 0; f < 5; f++) {
      if (primerasFilas[f].join("").toLowerCase().includes("categoria")) {
        filaCabeceras = f + 1;
        break;
      }
    }

    // Obtenemos las cabeceras para saber qué columna es cada cual
    const cabecerasElab = hojaActiva.getRange(filaCabeceras, 1, 1, ultimaColumna).getValues()[0];
    const cabecerasLowerElab = cabecerasElab.map(c => c ? c.toString().trim().toLowerCase() : "");

    const colCatElab = cabecerasLowerElab.indexOf("categoria") + 1 || 1;
    const colSubElab = cabecerasLowerElab.indexOf("subcategoria") + 1 || 2;
    const colIngElab = cabecerasLowerElab.indexOf("ingrediente") + 1 || 3;
    
    let colCantElab = cabecerasLowerElab.indexOf("cantidad") + 1;
    if (!colCantElab) colCantElab = cabecerasLowerElab.indexOf("gr porcion") + 1;
    if (!colCantElab) colCantElab = cabecerasLowerElab.indexOf("gr porción") + 1;
    if (!colCantElab) {
      const idx = cabecerasLowerElab.findIndex(c => c.includes("cant") || c.includes("gr "));
      colCantElab = idx >= 0 ? idx + 1 : 4;
    }

    let colUnidadElab = cabecerasLowerElab.indexOf("unid") + 1;
    if (!colUnidadElab) colUnidadElab = cabecerasLowerElab.indexOf("unidad") + 1;
    if (!colUnidadElab) colUnidadElab = 6;
    
    let colCostoUniElab = cabecerasLowerElab.indexOf(wordCostoUni) + 1;
    if (!colCostoUniElab) colCostoUniElab = 7;

    let colAlergenosElab = cabecerasLowerElab.indexOf("alérgenos") + 1 || cabecerasLowerElab.indexOf("alergenos") + 1;
    if (!colAlergenosElab) colAlergenosElab = cabecerasLowerElab.indexOf("aler") + 1; // Búsqueda parcial

    // Obtenemos todos los datos de la hoja para no hacer miles de peticiones lentas
    const datosReceta = hojaActiva.getRange(1, 1, ultimaFila, ultimaColumna).getValues();

    // Arrays para guardar las celdas que actualizaremos de golpe más adelante
    let celdasUnidadAActualizar = [];
    let celdasCostoAActualizar = [];
    let celdasAlergenosAActualizar = [];

    // Recorremos las filas desde la fila debajo de las cabeceras
    for (let f = filaCabeceras; f < ultimaFila; f++) {
      const filaDatos = datosReceta[f];
      
      const catObj = filaDatos[colCatElab - 1];
      const subObj = filaDatos[colSubElab - 1];
      const ingObj = filaDatos[colIngElab - 1];

      const catActual = catObj ? catObj.toString().trim() : "";
      const subActual = subObj ? subObj.toString().trim() : "";
      const ingActual = ingObj ? ingObj.toString().trim() : "";

      // ¿Es este el ingrediente que se acaba de modificar en Insumos?
      if (catActual === categoriaInsumo && subActual === subcategoriaInsumo && ingActual === nombreInsumo) {
        
        // 1. Preparamos para actualizar la Unidad (Ej. GR)
        celdasUnidadAActualizar.push({
          fila: f + 1,
          valor: unidad
        });
        
        // 2. Preparamos para actualizar el Costo Unitario si hay cantidad
        const cantObj = filaDatos[colCantElab - 1];
        if (cantObj !== "" && !isNaN(cantObj) && cantObj > 0) {
          celdasCostoAActualizar.push({
            fila: f + 1,
            valor: cantObj * costoCalculado
          });
        }

        // 3. Preparamos para actualizar Alérgenos si la columna existe en la receta
        if (colAlergenosElab > 0) {
          celdasAlergenosAActualizar.push({
            fila: f + 1,
            valor: alergenos
          });
        }
      }
    }

    // APLICAR LOS CAMBIOS EN ESTA HOJA (si hay algo que actualizar)
    if (celdasUnidadAActualizar.length > 0 || celdasCostoAActualizar.length > 0 || celdasAlergenosAActualizar.length > 0) {
      
      celdasUnidadAActualizar.forEach(item => {
        hojaActiva.getRange(item.fila, colUnidadElab).setValue(item.valor);
      });
      
      celdasCostoAActualizar.forEach(item => {
        hojaActiva.getRange(item.fila, colCostoUniElab).setValue(item.valor).setNumberFormat("0.00000€");
      });

      celdasAlergenosAActualizar.forEach(item => {
        hojaActiva.getRange(item.fila, colAlergenosElab).setValue(item.valor);
      });
    }
  }
}
