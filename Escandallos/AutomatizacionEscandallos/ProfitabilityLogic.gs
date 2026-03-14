/**
 * Logic for Menu Engineering and Profitability Analysis
 */

/**
 * Calculates the profitability of all recipes and updates the "Panel de Rentabilidad" sheet.
 */
function updateProfitabilityPanel() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let panelSheet = ss.getSheetByName("Panel de Rentabilidad");
  
  if (!panelSheet) {
    panelSheet = ss.insertSheet("Panel de Rentabilidad");
    setupProfitabilityHeaders(panelSheet);
  }

  const recipes = fetchFromSupabase('recipes?select=*,recipe_ingredients(quantity,ingredient:ingredients(name,cost_per_unit,purchase_price))');
  
  if (!recipes || recipes.length === 0) {
    Logger.log("No recipes found for profitability analysis.");
    return;
  }

  const analysisData = recipes.map(recipe => {
    let totalCost = 0;
    recipe.recipe_ingredients.forEach(ri => {
      const cost = ri.ingredient.cost_per_unit || 0;
      totalCost += ri.quantity * cost;
    });

    // Assume selling price is stored in a sheet or we need to define it.
    // For now, let's use a placeholder or look it up if available.
    // In a real scenario, we might have a 'selling_price' column in 'recipes'.
    const sellingPrice = recipe.selling_price || (totalCost * 3); // Default 3x markup if not set
    const margin = sellingPrice - totalCost;
    const marginPercentage = (margin / sellingPrice) * 100;

    let status = "NORMAL";
    if (marginPercentage < 60) status = "LOW MARGIN ⚠️";
    if (marginPercentage > 75) status = "STAR ⭐";

    return [
      recipe.name,
      recipe.portions,
      totalCost,
      sellingPrice,
      margin,
      marginPercentage / 100,
      status
    ];
  });

  // Clear and update the sheet
  const lastRow = panelSheet.getLastRow();
  if (lastRow > 1) {
    panelSheet.getRange(2, 1, lastRow - 1, 7).clearContent();
  }
  
  if (analysisData.length > 0) {
    panelSheet.getRange(2, 1, analysisData.length, 7).setValues(analysisData);
    
    // Formatting
    panelSheet.getRange(2, 3, analysisData.length, 3).setNumberFormat("0.00€");
    panelSheet.getRange(2, 6, analysisData.length, 1).setNumberFormat("0.0%");
    
    // Conditional formatting for status
    applyStatusFormatting(panelSheet, analysisData.length);
  }

  SpreadsheetApp.getUi().alert("✅ Panel de Rentabilidad actualizado con éxito.");
}

function setupProfitabilityHeaders(sheet) {
  const headers = [
    ["RECETA", "RACIONES", "COSTO TOTAL", "PRECIO VENTA (EST.)", "MARGEN €", "MARGEN %", "ESTADO"]
  ];
  sheet.getRange(1, 1, 1, 7).setValues(headers).setFontWeight("bold").setBackground("#f3f3f3");
  sheet.setFrozenRows(1);
}

function applyStatusFormatting(sheet, numRows) {
  const range = sheet.getRange(2, 7, numRows, 1);
  const rules = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("STAR ⭐")
    .setBackground("#d4edda")
    .setFontColor("#155724")
    .setRanges([range])
    .build();
    
  const rules2 = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("LOW MARGIN ⚠️")
    .setBackground("#f8d7da")
    .setFontColor("#721c24")
    .setRanges([range])
    .build();

  sheet.setConditionalFormatRules([rules, rules2]);
}
