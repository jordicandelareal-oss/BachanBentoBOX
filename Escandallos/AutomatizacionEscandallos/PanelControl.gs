/**
 * GESTIÓN OBTENCIÓN AUTOMÁTICA DE COSTOS
 * Panel de Control Global para el Modelo Multipestañas (Familia/Categoría)
 */
function actualizarPanelRentabilidad() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. CONFIGURACIÓN DEL PANEL DE CONTROL
  const NOMBRE_PANEL = "Panel de Rentabilidad";
  let hojaPanel = libro.getSheetByName(NOMBRE_PANEL);
  
  // Si no existe, crear la hoja y poner diseño base
  if (!hojaPanel) {
    hojaPanel = libro.insertSheet(NOMBRE_PANEL, 0); // La ponemos la primera
    configurarCabecerasPanel(hojaPanel);
  } else {
    // Si existe, limpiar todo lo que esté de la fila 3 hacia abajo (manteniendo cabeceras)
    const ultimaFila = hojaPanel.getLastRow();
    if (ultimaFila >= 3) {
      hojaPanel.getRange(3, 1, ultimaFila - 2, hojaPanel.getLastColumn()).clearContent();
    }
  }

  // Hojas a ignorar completamente en el escaneo
  const HOJAS_BASE = ["Insumos", "Plantilla", NOMBRE_PANEL, "Config", "DB"];
  const hojas = libro.getSheets();
  
  let datosFinales = []; // Array que almacenará todas las filas del dashboard
  
  // 2. ESCANEO DE TODAS LAS PESTAÑAS DEL LIBRO (Ej: Carnes, Pescados)
  for (let i = 0; i < hojas.length; i++) {
    const hojaActiva = hojas[i];
    const nombreHoja = hojaActiva.getName();
    
    if (HOJAS_BASE.includes(nombreHoja)) continue; // Saltamos las hojas de sistema

    const ultimaFila = hojaActiva.getLastRow();
    const ultimaColumna = hojaActiva.getLastColumn();
    
    // Si la hoja está vacía, saltar
    if (ultimaFila < 2 || ultimaColumna < 2) continue;
    
    // Cargar TODA la matriz 2D de datos de la hoja (súper rápido)
    const datosMatriz = hojaActiva.getRange(1, 1, ultimaFila, ultimaColumna).getValues();

    // 3. RASTREADOR: BÚSQUEDA DE BLOQUES (RECETAS)
    let nombrePlato = "Desconocido";
    let recetaAbierta = false;
    let costoRacionActual = 0;
    
    // Recorremos la matriz hacia abajo fila por fila
    for (let fila = 0; fila < datosMatriz.length; fila++) {
      const arrayFila = datosMatriz[fila];
      
      // --- PATRON A: INICIO DE RECETA ---
      // Identificamos el inicio al encontrar la palabra "Raciones" o "Costo por ración" en la fila del título
      let indiceTitulo = arrayFila.findIndex(celda => {
        let txt = celda.toString().trim().toLowerCase();
        return txt === "raciones" || txt.includes("costo por ración") || txt.includes("costo por racion");
      });
      
      if (indiceTitulo !== -1 && !recetaAbierta) {
        let candidatoNombre = arrayFila.find((celda, index) => index < indiceTitulo && celda.toString().trim().length > 3);
        
        if (candidatoNombre) {
          // ABRIMOS BLOQUE DE RECETA
          recetaAbierta = true;
          nombrePlato = candidatoNombre.toString().trim();
          costoRacionActual = 0; // Se actualizará cuando lleguemos al final de la tabla
          continue; // Pasamos a la siguiente fila
        }
      }

      // --- PATRON B: DENTRO DE LA RECETA ---
      if (recetaAbierta) {
        // Buscar el "Costo por ración" en el resumen nutricional del final de la tabla
        let indiceCostoRacion = arrayFila.findIndex(celda => celda.toString().trim().toLowerCase().includes("costo por ración") || celda.toString().trim().toLowerCase().includes("costo por racion"));
        
        if (indiceCostoRacion !== -1) {
          let nuevoCosto = arrayFila[indiceCostoRacion + 1];
          // Prevenimos setear un costo vacío
          if (!isNaN(nuevoCosto) && nuevoCosto !== "") {
            costoRacionActual = nuevoCosto;
          }
        }

        // Buscar el "Costo total" que marca el final inequívoco del bloque
        let indiceCostoTotal = arrayFila.findIndex(celda => celda.toString().trim().toLowerCase().includes("costo total"));
        
        if (indiceCostoTotal !== -1) {
          let costoTotalActual = arrayFila[indiceCostoTotal + 1];
          if (isNaN(costoTotalActual) || costoTotalActual === "") costoTotalActual = 0;

          // --- PATRON C: PRECIO DE VENTA (NUEVO) ---
          let precioVentaActual = 0;
          for (let fBusqueda = 0; fBusqueda < datosMatriz.length; fBusqueda++) {
            let idxPV = datosMatriz[fBusqueda].findIndex(c => {
              let t = c.toString().trim().toLowerCase();
              return t === "precio de venta" || t === "pvp" || t === "precio venta";
            });
            if (idxPV !== -1) {
              let valPV = datosMatriz[fBusqueda][idxPV + 1];
              if (!isNaN(valPV) && valPV !== "") precioVentaActual = valPV;
              break;
            }
          }

          let margenPorcentaje = precioVentaActual > 0 ? (precioVentaActual - costoRacionActual) / precioVentaActual : 0;

          // ¡BLOQUE COMPLETADO! Registramos el plato en la matriz final
          datosFinales.push([
            nombreHoja,           // Categoría/Familia
            nombrePlato,          // Platillo
            costoRacionActual,    // Costo / Ración (Col C)
            costoTotalActual,     // Costo Total Formula (Col D)
            precioVentaActual,    // PVP (Col E)
            margenPorcentaje      // Margen % (Col F)
          ]);
          
          // Reseteamos las banderas para esperar la siguiente receta más abajo
          recetaAbierta = false;
          nombrePlato = "Desconocido";
          costoRacionActual = 0;
        }
      }
    } // Fin bucle iterar matriz de 1 hoja
  } // Fin iterar todas las hojas

  // 4. ESCRITURA FINAL EN EL DASHBOARD
  if (datosFinales.length > 0) {
    // Escribimos desde Fila 3, Columna A
    hojaPanel.getRange(3, 1, datosFinales.length, 6).setValues(datosFinales);
    
    // Formato de moneda para C, D y E
    hojaPanel.getRange(3, 3, datosFinales.length, 3).setNumberFormat("0.00 €");
    
    // Formato de porcentaje para F
    const rangoMargen = hojaPanel.getRange(3, 6, datosFinales.length, 1);
    rangoMargen.setNumberFormat("0.00%");

    // --- SEMÁFORO DE RENTABILIDAD ---
    const valoresMargen = rangoMargen.getValues();
    const colores = valoresMargen.map(fila => {
      let m = fila[0];
      if (m >= 0.70) return ["#c8e6c9"]; // Verde suave
      if (m >= 0.60) return ["#fff9c4"]; // Amarillo suave
      return ["#ffcdd2"]; // Rojo suave
    });
    rangoMargen.setBackgrounds(colores);
    
    return "✅ ¡Éxito! " + datosFinales.length + " recetas rastreadas.";
  } else {
    return "⚠️ No se han detectado recetas. Revisa la estructura.";
  }
}

/**
 * Función auxiliar para pintar las cabeceras la primera vez que se lanza
 */
function configurarCabecerasPanel(hoja) {
  hoja.getRange("A1").setValue("DASHBOARD DE RENTABILIDAD - BaChan Bento").setFontSize(16).setFontWeight("bold").setFontColor("#3d2b1f");
  
  const cabeceras = [["Familia", "Platillo / Receta", "Costo / Ración", "Costo Total Formula", "PVP / Precio Venta", "Margen (%)"]];
  const rangoCabeceras = hoja.getRange("A2:F2");
  
  rangoCabeceras.setValues(cabeceras)
                .setBackground("#3d2b1f") // Marrón BaChan
                .setFontColor("#f9f7f2") // Lino
                .setFontWeight("bold")
                .setHorizontalAlignment("center")
                .setVerticalAlignment("middle");
                
  hoja.setColumnWidth(1, 120);
  hoja.setColumnWidth(2, 280); 
  hoja.setColumnWidth(3, 100);
  hoja.setColumnWidth(4, 110);
  hoja.setColumnWidth(5, 120);
  hoja.setColumnWidth(6, 100);
  
  hoja.setFrozenRows(2); // Inmovilizar para bajar tranquilamente
}
