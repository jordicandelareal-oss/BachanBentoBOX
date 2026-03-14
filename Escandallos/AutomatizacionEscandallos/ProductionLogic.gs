/**
 * LÓGICA DE ESCALADO DE PRODUCCIÓN
 * Calcula las cantidades necesarias para un número determinado de raciones.
 */
function calcularProduccion(racionesDeseadas) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const sheetName = sheet.getName();

  // 1. Validaciones iniciales
  const HOJAS_SISTEMA = ["Insumos", "Plantilla", "Panel de Rentabilidad", "Config", "DB"];
  if (HOJAS_SISTEMA.includes(sheetName)) {
    throw new Error("Abre primero la pestaña de la receta que quieres escalar.");
  }

  // 2. Detectar Estructura y Raciones Actuales
  let filaCabeceras = 2;
  const primerasFilas = sheet.getRange(1, 1, 10, 10).getValues();
  let numRacionesBase = 1;
  let racionesEncontradas = false;

  for (let f = 0; f < 10; f++) {
    let filaValores = primerasFilas[f];
    // Buscar la palabra "Raciones" para saber cuántas raciones tiene el escandallo base
    let idxRaciones = filaValores.findIndex(c => c.toString().trim().toLowerCase() === "raciones");
    if (idxRaciones !== -1) {
      let valR = filaValores[idxRaciones + 1];
      if (!isNaN(valR) && valR > 0) {
        numRacionesBase = valR;
        racionesEncontradas = true;
      }
    }
    // Buscar la cabecera de la tabla para saber dónde empiezan los ingredientes
    if (filaValores.join("").toLowerCase().includes("categoria")) {
      filaCabeceras = f + 1;
    }
  }

  if (!racionesEncontradas) {
    throw new Error("No he encontrado la celda 'Raciones' en esta hoja. Asegúrate de que existe.");
  }

  // 3. Obtener Datos de la Tabla
  const ultimaFila = sheet.getLastRow();
  const ultimaColumna = sheet.getLastColumn();
  const cabeceras = sheet.getRange(filaCabeceras, 1, 1, ultimaColumna).getValues()[0].map(c => c.toString().toLowerCase());
  
  const colIng = cabeceras.indexOf("ingrediente") + 1 || 3;
  const colCant = cabeceras.findIndex(c => c.includes("cant") || c.includes("gr por")) + 1 || 4;
  const colUnid = cabeceras.indexOf("unid") + 1 || cabeceras.indexOf("unidad") + 1 || 6;

  const datosTabla = sheet.getRange(filaCabeceras + 1, 1, ultimaFila - filaCabeceras, ultimaColumna).getValues();
  
  let listaEscalada = [];
  const factor = racionesDeseadas / numRacionesBase;

  for (let i = 0; i < datosTabla.length; i++) {
    const fila = datosTabla[i];
    const ingrediente = fila[colIng - 1];
    
    // Saltamos filas de totales o vacías
    if (!ingrediente || ingrediente.toString().trim() === "" || ingrediente.toString().toLowerCase().includes("costo total")) continue;

    const cantidadBase = fila[colCant - 1];
    const unidad = fila[colUnid - 1];

    if (!isNaN(cantidadBase) && cantidadBase !== "") {
      listaEscalada.push({
        nombre: ingrediente,
        cantidad: (cantidadBase * factor).toFixed(2),
        unidad: unidad
      });
    }
  }

  return {
    plato: sheetName,
    racionesBase: numRacionesBase,
    racionesNuevas: racionesDeseadas,
    ingredientes: listaEscalada
  };
}
