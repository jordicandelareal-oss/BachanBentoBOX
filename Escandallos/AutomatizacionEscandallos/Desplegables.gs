// ==========================================
// 3. GESTIÓN DE DESPLEGABLES EN ELABORACIONES
// ==========================================
function gestionarDesplegables(e, sheet, row, dbData, cabeceras, dinamicos) {
  const col = e.range.getColumn();
  const value = e.value;
  
  // Encontramos cómo se llama la columna que acaban de editar
  const nombreColumna = cabeceras[col - 1] ? cabeceras[col - 1].toString().trim() : "";

  // Buscamos dinámicamente futuras columnas a afectar
  const colSubcategoria = cabeceras.indexOf("Subcategoria") + 1;
  const colIngrediente = cabeceras.indexOf("Ingrediente") + 1;
  const colCategoria = cabeceras.indexOf("Categoria") + 1;

  // Buscar dinámica para la columna de cantidad (Gr porcion) guiada por el panel de control
  const cabecerasLower = cabeceras.map(c => c ? c.toString().trim().toLowerCase() : "");
  const wordGrPorcion = dinamicos.COL_GR_PORCION.toLowerCase();
  
  let colCant = cabecerasLower.indexOf(wordGrPorcion) + 1;
  if (!colCant) colCant = 4; // Fallback

  if (nombreColumna === "Categoria") {
    // LIMPIEZA Si el usuario borra la Categoria, borrar todas las columnas a su derecha para evitar errores
    if (colSubcategoria > 0) sheet.getRange(row, colSubcategoria).clearContent().clearDataValidations();
    if (colIngrediente > 0) sheet.getRange(row, colIngrediente).clearContent().clearDataValidations();
    if (colCant > 0) sheet.getRange(row, colCant).clearContent(); // Limpiamos "Gr porcion"
    if (!value) return;

    let subcats = [...new Set(dbData.filter(r => r[0] === value).map(r => r[1]))].filter(String).sort();
    if (subcats.length > 0 && colSubcategoria > 0) {
      let rule = SpreadsheetApp.newDataValidation().requireValueInList(subcats).build();
      sheet.getRange(row, colSubcategoria).setDataValidation(rule);
    }
  }

  if (nombreColumna === "Subcategoria") {
    if (colIngrediente > 0) sheet.getRange(row, colIngrediente).clearContent().clearDataValidations();
    
    // Buscar la categoría actual en base a su columna dinámica
    const categoriaRow = colCategoria > 0 ? sheet.getRange(row, colCategoria).getValue() : null;
    if (!value || !categoriaRow) return;

    let ingredientes = [...new Set(dbData.filter(r => r[0] === categoriaRow && r[1] === value).map(r => r[2]))].filter(String).sort();
    if (ingredientes.length > 0 && colIngrediente > 0) {
      let rule = SpreadsheetApp.newDataValidation().requireValueInList(ingredientes).build();
      sheet.getRange(row, colIngrediente).setDataValidation(rule);
    }
  }
}

// ==========================================
// 4. GESTIÓN DE DESPLEGABLES EN INSUMOS
// ==========================================
function gestionarDesplegablesInsumos(e, sheet, row) {
  try {
    const col = e.range.getColumn();
    const range = sheet.getRange(row, col);
    const value = range.getValue().toString().trim().toLowerCase();

    // 1. OBTENER DATOS DE LA TABLA DE REFERENCIA (J:K)
    // Según el nuevo pantallazo: J (Col 10) y K (Col 11)
    const lastRow = sheet.getLastRow();
    if (lastRow < 3) return; // Mínimo cabeceras
    
    // Obtenemos la tabla de referencia completa (J:K)
    const refData = sheet.getRange(3, 10, lastRow - 2, 2).getValues();
    const categoriasUnicas = [...new Set(refData.map(r => r[0] ? r[0].toString().trim() : ""))].filter(String).filter(v => v.toLowerCase() !== "categoria").sort();

    // 2. SI EDITAN LA TABLA DE FUENTE (J o K), ACTUALIZAMOS TODA LA COLUMNA A
    if (col === 10 || col === 11) {
      if (categoriasUnicas.length > 0) {
        let ruleA = SpreadsheetApp.newDataValidation().requireValueInList(categoriasUnicas).build();
        sheet.getRange(4, 1, 500, 1).setDataValidation(ruleA);
      }
      return;
    }

    // 3. SI EDITAN LA COLUMNA A (Categoría)
    if (col === 1) {
      const rangeSub = sheet.getRange(row, 2);
      rangeSub.clearContent().clearDataValidations();

      if (value === "") return;

      // Filtramos subcategorías vinculadas (comparación sin espacios y sin mayúsculas)
      let subcats = [...new Set(
        refData.filter(r => {
          const catRef = r[0] ? r[0].toString().trim().toLowerCase() : "";
          return catRef === value;
        }).map(r => r[1] ? r[1].toString().trim() : "")
      )].filter(String).filter(v => v.toLowerCase() !== "subcategoria").sort();
      
      if (subcats.length > 0) {
        let ruleB = SpreadsheetApp.newDataValidation()
          .requireValueInList(subcats)
          .setAllowInvalid(false)
          .build();
        rangeSub.setDataValidation(ruleB);
      }
      SpreadsheetApp.flush();
    }
  } catch (err) {
    console.error("Error en gestionarDesplegablesInsumos: " + err.message);
  }
}
