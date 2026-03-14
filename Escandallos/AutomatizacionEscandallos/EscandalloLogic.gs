// ==========================================
// 4. LÓGICA DE COSTEO EN ELABORACIONES
// ==========================================
function gestionarCalculoElaboraciones(e, sheet, row, dbData, cabeceras, dinamicos) {
  const col = e.range.getColumn();
  
  const cabecerasLower = cabeceras.map(c => c.toString().trim().toLowerCase());
  
  const colCat = cabecerasLower.indexOf("categoria") + 1 || 1;
  const colSub = cabecerasLower.indexOf("subcategoria") + 1 || 2;
  const colIng = cabecerasLower.indexOf("ingrediente") + 1 || 3;
  
  // Buscar las columnas por sus nombres configurados en el panel de control
  const wordGrPorcion = dinamicos.COL_GR_PORCION.toLowerCase();
  const wordGramajeTotal = dinamicos.COL_GRAMAJE_TOTAL.toLowerCase();
  const wordCostoUni = dinamicos.COL_COSTO_UNITARIO.toLowerCase();

  let colCant = cabecerasLower.indexOf(wordGrPorcion) + 1;
  if (!colCant) colCant = 4; // Fallback
  
  let colGramajeTotal = cabecerasLower.indexOf(wordGramajeTotal) + 1;
  if (!colGramajeTotal) colGramajeTotal = 5; // Fallback

  // Buscar unidad y costo permitiendo ligeros cambios de nombre ("Unid")
  let colUnidad = cabecerasLower.indexOf("unid") + 1;
  if (!colUnidad) colUnidad = cabecerasLower.indexOf("unidad") + 1;
  if (!colUnidad) colUnidad = 6; 
  
  let colCostoUni = cabecerasLower.indexOf(wordCostoUni) + 1;
  if (!colCostoUni) colCostoUni = 7; // Fallback

  let colAlergenos = cabecerasLower.indexOf("alérgenos") + 1 || cabecerasLower.indexOf("alergenos") + 1;

  // Actuar solo si modificamos el Ingrediente o la Cantidad
  if (col !== colIng && col !== colCant) return;

  // Lógica si están vacías las columnas imprescindibles
  if (colUnidad <= 0 || colCostoUni <= 0) return; 

  const cat = colCat > 0 ? sheet.getRange(row, colCat).getValue().toString().trim() : "";
  const sub = colSub > 0 ? sheet.getRange(row, colSub).getValue().toString().trim() : "";
  const ing = colIng > 0 ? sheet.getRange(row, colIng).getValue().toString().trim() : "";
  const cant = colCant > 0 ? sheet.getRange(row, colCant).getValue() : "";

  // Si el ingrediente se borró, borrar el precio
  if (ing === "") {
    // Se ejecuta clear de manera conjunta (mejora de velocidad a la API)
    if (colGramajeTotal > 0) sheet.getRange(row, colGramajeTotal).clearContent();
    sheet.getRange(row, colUnidad).clearContent();
    sheet.getRange(row, colCostoUni).clearContent();
    if (colAlergenos > 0) sheet.getRange(row, colAlergenos).clearContent();
    return;
  }

  // Buscar en la BD cargada previamente
  const registro = dbData.find(r => 
    r[0].toString().trim() === cat && 
    r[1].toString().trim() === sub && 
    r[2].toString().trim() === ing
  );

  if (registro) {
    const unidadInsumo = registro[4]; // Col E de Insumos
    const precioGrInsumo = registro[6]; // Col G de Insumos

    // Ponemos la unidad en F (Elaboraciones)
    sheet.getRange(row, colUnidad).setValue(unidadInsumo);

    // Ponemos los alérgenos
    if (colAlergenos > 0) {
      const alergenosInsumo = registro[7]; // Col H de Insumos (contando que añadimos Alérgenos antes del Costo calculado o al final)
      // Nota: Si añadimos Alérgenos como Col H, su índice es 7
      sheet.getRange(row, colAlergenos).setValue(alergenosInsumo || "");
    }

    // Si hay cantidad puesta en D, calculamos el costo y lo ponemos en G (Elaboraciones)
    if (cant !== "" && !isNaN(cant) && cant > 0) {
      // 1. Obtener número de raciones del escandallo actual buscando hacia arriba
      let numRaciones = 1;
      const wordRaciones = dinamicos.COL_RACIONES.toLowerCase();
      const dataArriba = sheet.getRange(1, 1, row, sheet.getLastColumn()).getValues();
      
      for (let r = row - 1; r >= 0; r--) {
        let indiceRaciones = dataArriba[r].findIndex(celda => celda.toString().trim().toLowerCase() === wordRaciones);
        if (indiceRaciones !== -1) {
          let val = dataArriba[r][indiceRaciones + 1];
          // Validar que sea un número válido
          if (val !== "" && !isNaN(val) && val > 0) numRaciones = val;
          break;
        }
      }

      // 2. Setear gramaje total en su columna (Ej. E)
      if (colGramajeTotal > 0) {
        sheet.getRange(row, colGramajeTotal).setValue(cant * numRaciones);
      }

      // 3. Setear costo unitario en su columna (Ej. G)
      sheet.getRange(row, colCostoUni)
           .setValue(cant * precioGrInsumo)
           .setNumberFormat("0.00000€"); // Usamos 5 decimales para precisión
    } else {
      if (colGramajeTotal > 0) sheet.getRange(row, colGramajeTotal).clearContent();
      sheet.getRange(row, colCostoUni).clearContent();
    }
  } else {
    // Si no lo encuentra en Insumos
    sheet.getRange(row, colUnidad).setValue("No existe");
    sheet.getRange(row, colCostoUni).clearContent();
  }
}
