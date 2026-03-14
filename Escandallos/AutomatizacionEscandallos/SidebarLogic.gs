/**
 * SIDEBAR LOGIC (BACKEND)
 * Maneja la lectura y guardado de los ajustes dinámicos de las columnas.
 */

// ==========================================
// 1. ABRIR EL PANEL LATERAL
// ==========================================
function abrirPanelAjustes() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
      .setTitle('⚙️ Ajustes BaChan')
      .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

// Valores por defecto si nunca se ha guardado nada
const DEFAULT_CONFIG = {
  COL_RACIONES: "Raciones",
  COL_GR_PORCION: "Gr porcion",
  COL_GRAMAJE_TOTAL: "Gramaje total",
  COL_COSTO_UNITARIO: "Costo unitario",
  PROPAGAR_INSUMOS: true
};

// ==========================================
// 2. LEER AJUSTES (Llamado desde HTML y desde el backend)
// ==========================================
function obtenerConfiguracionSidebar() {
  const props = PropertiesService.getDocumentProperties();
  const guardado = props.getProperty('BACHAN_CONFIG');
  
  if (guardado) {
    try {
      // Parsear lo guardado en string JSON a Objeto
      const obj = JSON.parse(guardado);
      // Cruzar con los valores por defecto por si añadimos campos nuevos en el futuro
      return { ...DEFAULT_CONFIG, ...obj };
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  }
  return DEFAULT_CONFIG;
}

// ==========================================
// 3. GUARDAR AJUSTES (Llamado desde el botón de HTML)
// ==========================================
function guardarConfiguracionSidebar(nuevaConfig) {
  const props = PropertiesService.getDocumentProperties();
  props.setProperty('BACHAN_CONFIG', JSON.stringify(nuevaConfig));
  return true; 
}

// ==========================================
// 4. OBTENER LOGO EN BASE64 (Para evitar enlaces rotos)
// ==========================================
// Nota: Esta función requiere permisos de DriveApp. 
// Si no ves el logo, asegúrate de haber aceptado los permisos de Google Drive.
function obtenerLogoBase64() {
  try {
    const id = "14q-a9OMOQaHgjQ_Q-hMWM0e7UDA7YskL";
    const file = DriveApp.getFileById(id);
    const blob = file.getBlob();
    const bytes = blob.getBytes();
    const base64String = Utilities.base64Encode(bytes);
    return "data:" + blob.getContentType() + ";base64," + base64String;
  } catch (e) {
    Logger.log("Error obteniendo logo: " + e.message);
    return "ERROR: " + e.message; 
  }
}
