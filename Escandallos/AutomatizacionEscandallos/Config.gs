// ==========================================
// INICIALIZACIÓN DE MENÚS (Interfaz)
// ==========================================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('🍱 BaChan');
  menu.addItem('Abrir Panel de Control', 'showPanelControl')
      .addSeparator()
      .addItem("📤 Enviar Todo a Supabase", "syncAllToSupabase")
      .addItem("📥 Importar desde Supabase", "importInsumosFromSupabase")
      .addItem("📊 Actualizar Rentabilidad", "updateProfitabilityPanel")
      .addSeparator()
      .addItem("⚙️ Ajustes BaChan", "abrirPanelAjustes")
      .addToUi();
      
  // Forzamos la autorización de Google Drive para que se vea el logo del Sidebar
  // DriveApp.getRootFolder(); 
}

// ==========================================
// CONFIGURACIÓN GLOBAL
// ==========================================
const CONFIG = {
  HOJAS_SISTEMA: ["Insumos", "Plantilla", "Panel de Rentabilidad", "Config", "DB"],
  HOJA_INSUMOS: "Insumos"
};

// ==========================================
// 1. EVENTO PRINCIPAL ONEDIT
// ==========================================
function onEdit(e) {
  // If the change comes from Nana, skip further processing to avoid loops
  if (typeof NANA_SYSTEM_EVENT !== 'undefined' && NANA_SYSTEM_EVENT) return;
  
  if (!e || !e.source || !e.range) return;
  
  const sheet = e.source.getActiveSheet();
  const sheetName = sheet.getName();
  const row = e.range.getRow();

  // Cargamos los ajustes del usuario 1 vez para todo el flujo
  const dinamicos = obtenerConfiguracionSidebar();

  // Lógica para Hoja INSUMOS
  if (sheetName === CONFIG.HOJA_INSUMOS) {
    // No actuar si estamos en la cabecera (Fila 1)
    if (row <= 1) return;
    
    // 1. Desplegables independientes (A partir de fila 4)
    if (row >= 4) {
      gestionarDesplegablesInsumos(e, sheet, row);
    }

    // 2. Cálculos de costos
    gestionarCalculoInsumos(e, sheet, row, dinamicos);
    return;
  }

  // Lógica para Hojas de ESCANDALLOS (cualquiera que no sea de sistema)
  if (!CONFIG.HOJAS_SISTEMA.includes(sheetName)) {
    // Buscar dinámicamente dónde están los encabezados
    let filaCabeceras = 2; // Por defecto
    const primerasFilas = sheet.getRange(1, 1, 5, 5).getValues();
    for (let i = 0; i < 5; i++) {
      if (primerasFilas[i].join("").toLowerCase().includes("categoria")) {
        filaCabeceras = i + 1;
        break;
      }
    }

    // No actuar si estamos editando el título o las cabeceras
    if (row <= filaCabeceras) return;

    // Para no hacer lenta la hoja, cargamos la Base de Datos UNA SOLA VEZ aquí.
    const dbSheet = e.source.getSheetByName(CONFIG.HOJA_INSUMOS);
    if (!dbSheet) return;
    const dbData = dbSheet.getDataRange().getValues();
    
    // Obtenemos los nombres de las columnas para la fila correcta
    const cabecerasElaboraciones = sheet.getRange(filaCabeceras, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Pasamos los ajustes dinámicos a las funciones hijas
    gestionarDesplegables(e, sheet, row, dbData, cabecerasElaboraciones, dinamicos);
    gestionarCalculoElaboraciones(e, sheet, row, dbData, cabecerasElaboraciones, dinamicos);
  }
}
