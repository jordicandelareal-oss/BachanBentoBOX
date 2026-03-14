/**
 * LÓGICA DE EXPORTACIÓN A PDF (Modo Cocina)
 * Genera un PDF limpio con solo la información necesaria para el equipo de cocina.
 */
function exportarRecetaPDF() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const sheetName = sheet.getName();

  // 1. Validar que no sea una hoja de sistema
  const HOJAS_BASE = ["Insumos", "Plantilla", "Panel de Rentabilidad", "Config", "DB"];
  if (HOJAS_BASE.includes(sheetName)) {
    throw new Error("No se puede exportar una hoja de sistema. Abre una receta.");
  }

  // 2. Detectar el área de la receta (asumimos que empieza donde está el título del plato)
  // Buscamos la fila de cabeceras dinámica para saber dónde empieza la tabla
  let filaCabeceras = 2;
  const primerasFilas = sheet.getRange(1, 1, 10, 5).getValues();
  for (let i = 0; i < 10; i++) {
    if (primerasFilas[i].join("").toLowerCase().includes("categoria")) {
      filaCabeceras = i + 1;
      break;
    }
  }

  // 3. Crear una hoja temporal para la exportación limpia
  const tempSheetName = "PDF_TEMP_" + Utilities.getUuid().substring(0, 8);
  const tempSheet = ss.insertSheet(tempSheetName);
  
  // 4. Copiar datos relevantes (Nombre del plato, Ingredientes, Cantidades, Unidad, Alérgenos)
  // Buscamos el nombre del plato (normalmente en la fila anterior a la cabecera o en la misma)
  const nombrePlato = sheet.getRange(filaCabeceras - 1, 1).getValue() || sheetName;
  
  tempSheet.getRange("A1").setValue("FICHA TÉCNICA - BaChan Bento").setFontSize(10).setFontColor("#7a6a5e");
  tempSheet.getRange("A2").setValue(nombrePlato.toString().toUpperCase()).setFontSize(22).setFontWeight("bold").setFontColor("#3d2b1f");
  
  // Copiar la tabla de ingredientes (Sin precios)
  const ultimaFila = sheet.getLastRow();
  const ultimaColumna = sheet.getLastColumn();
  const cabecerasOriginales = sheet.getRange(filaCabeceras, 1, 1, ultimaColumna).getValues()[0].map(c => c.toString().toLowerCase());
  
  const colIng = cabecerasOriginales.indexOf("ingrediente") + 1 || 3;
  const colCant = cabecerasOriginales.findIndex(c => c.includes("cant") || c.includes("gr por")) + 1 || 4;
  const colUnid = cabecerasOriginales.indexOf("unid") + 1 || cabecerasOriginales.indexOf("unidad") + 1 || 6;
  const colAler = cabecerasOriginales.indexOf("alérgenos") + 1 || cabecerasOriginales.indexOf("alergenos") + 1;

  // Cabeceras de la hoja PDF
  const cabecerasPDF = [["INGREDIENTE", "CANTIDAD", "UNID.", "ALÉRGENOS"]];
  tempSheet.getRange("A4:D4").setValues(cabecerasPDF)
      .setBackground("#3d2b1f").setFontColor("#f9f7f2").setFontWeight("bold");

  // Recopilar datos de filas
  let filaEscritura = 5;
  for (let f = filaCabeceras + 1; f <= ultimaFila; f++) {
    const ing = sheet.getRange(f, colIng).getValue();
    if (!ing || ing.toString().trim() === "" || ing.toString().toLowerCase().includes("costo total")) continue;
    
    const cant = sheet.getRange(f, colCant).getValue();
    const unid = sheet.getRange(f, colUnid).getValue();
    const aler = colAler > 0 ? sheet.getRange(f, colAler).getValue() : "-";
    
    tempSheet.getRange(filaEscritura, 1).setValue(ing);
    tempSheet.getRange(filaEscritura, 2).setValue(cant).setHorizontalAlignment("center");
    tempSheet.getRange(filaEscritura, 3).setValue(unid).setHorizontalAlignment("center");
    tempSheet.getRange(filaEscritura, 4).setValue(aler);
    filaEscritura++;
  }

  // Estilos finales
  tempSheet.getRange(4, 1, filaEscritura - 4, 4).setBorder(true, true, true, true, true, true, "#e5e0d8", SpreadsheetApp.BorderStyle.SOLID);
  tempSheet.setColumnWidth(1, 300);
  tempSheet.setColumnWidth(2, 80);
  tempSheet.setColumnWidth(3, 60);
  tempSheet.setColumnWidth(4, 150);

  SpreadsheetApp.flush();

  // 5. Generar URL de descarga de PDF (Hack de Google Apps Script)
  const url = ss.getUrl().replace(/edit$/, '') + 'export?format=pdf' +
              '&gid=' + tempSheet.getSheetId() +
              '&size=A4' +
              '&portrait=true' +
              '&fitw=true' +
              '&source=labnol';

  // Nota: Al ser un Sidebar, devolveremos la URL para que el JS del cliente la abra
  return {
    url: url,
    nombre: "Receta_" + nombrePlato.toString().replace(/\s+/g, '_') + ".pdf",
    tempSheet: tempSheetName
  };
}

/**
 * Limpieza de hojas temporales después de exportar
 */
function limpiarHojasTemporales(nombreHoja) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(nombreHoja);
  if (sheet) ss.deleteSheet(sheet);
}
