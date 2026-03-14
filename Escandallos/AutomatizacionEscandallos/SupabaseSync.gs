/**
 * SUPABASE SYNC BRIDGE - NANA VERSION
 * Optimized for speed and atomic updates.
 */

// Global flag to prevent trigger loops
var NANA_SYSTEM_EVENT = false;

/**
 * Core function for atomic upserts.
 * @param {string} table - Table name in Supabase.
 * @param {Object|Array} data - Data to insert or update.
 * @param {string} onConflict - Column(s) to handle conflicts (e.g. 'id' or 'name').
 */
function upsertToSupabase(table, data, onConflict = 'id') {
  const props = PropertiesService.getScriptProperties();
  const baseUrl = props.getProperty('SUPABASE_URL');
  const apiKey = props.getProperty('SUPABASE_KEY');

  if (!baseUrl || !apiKey) {
    Logger.log("❌ ERROR: Missing Supabase credentials in Script Properties.");
    return false;
  }

  // Ensure data types are correct (ultralight sanitation)
  const sanitizedData = sanitizeNumericalData(data);
  
  const url = `${baseUrl}/rest/v1/${table}?on_conflict=${onConflict}`;
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'Prefer': 'resolution=merge-duplicates, return=representation'
    },
    payload: JSON.stringify(sanitizedData),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    if (code >= 200 && code < 300) {
      Logger.log(`✅ Upsert success on ${table}`);
      return true;
    } else {
      Logger.log(`❌ Supabase Error (${code}): ${response.getContentText()}`);
      return false;
    }
  } catch (e) {
    Logger.log(`❌ Exception in upsertToSupabase: ${e.message}`);
    return false;
  }
}

/**
 * Sanitizes data objects/arrays to ensure numbers are numbers.
 */
function sanitizeNumericalData(data) {
  if (Array.isArray(data)) return data.map(item => sanitizeNumericalData(item));
  if (typeof data !== 'object' || data === null) return data;

  const sanitized = { ...data };
  const numericFields = ['price', 'value', 'quantity', 'purchase_price', 'cost_per_unit', 'purchase_format', 'portions', 'total_cost', 'price_suggestion'];
  
  for (let key in sanitized) {
    if (numericFields.includes(key) && sanitized[key] !== null) {
      const val = parseFloat(sanitized[key]);
      sanitized[key] = isNaN(val) ? 0 : val;
    }
  }
  return sanitized;
}

/**
 * Updates a cell in the Sheet from Nana's execution.
 * @param {string} sheetName - Name of the tab.
 * @param {string} itemName - Unique name of the item (Ingrediente/Receta).
 * @param {string} columnName - Header name to update.
 * @param {any} newValue - Value to set.
 */
function updateSheetValueFromNana(sheetName, itemName, columnName, newValue) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return false;

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => h.toString().toLowerCase().trim());
  const colIndex = headers.indexOf(columnName.toLowerCase().trim());
  
  if (colIndex === -1) return false;

  // Find row (linear search for lightness)
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === itemName || data[i][0] === itemName) { // Check Ingrediente or Name col
      NANA_SYSTEM_EVENT = true; // Set flag before change
      sheet.getRange(i + 1, colIndex + 1).setValue(newValue);
      SpreadsheetApp.flush(); // Recalculate logic
      NANA_SYSTEM_EVENT = false; // Reset flag
      return true;
    }
  }
  return false;
}

/**
 * Main handler for Nana actions returning success/failure.
 */
function handleNanaSyncAction(actionJson) {
  const { action, data } = actionJson;
  let success = false;

  switch (action) {
    case 'UPDATE_PRICE':
      const price = data.price || data.value;
      success = upsertToSupabase('ingredients', { name: data.item, purchase_price: price }, 'name');
      if (success) {
        updateSheetValueFromNana('Insumos', data.item, 'precio compra', price);
      }
      break;

    case 'ADD_INGREDIENT':
      success = upsertToSupabase('ingredients', { 
        name: data.item, 
        purchase_price: data.price || data.value || 0,
        unit_id: data.unit_id || "c39f0ea5-5325-4876-8395-940b4995ce4a" // KG default
      }, 'name');
      break;
      
    case 'CREATE_RECIPE':
      // This is handled in executeAiAction for now, but we can move it here if needed
      break;
      
    case 'UPSERT_PREFERENCE':
      success = upsertToSupabase('user_preferences', { key: data.key, value: data.value }, 'key');
      break;
      
    default:
      Logger.log("Nana action not handled: " + action);
      break;
  }

  return success;
}

/**
 * Fetches all user preferences from Supabase.
 * @returns {Object} Key-value pairs of preferences.
 */
function fetchUserPreferences() {
  try {
    const data = callSupabase("user_preferences?select=key,value", "GET");
    const prefs = {};
    data.forEach(p => prefs[p.key] = p.value);
    return prefs;
  } catch (e) {
    Logger.log("⚠️ Error fetching user preferences: " + e.message);
    return {};
  }
}
