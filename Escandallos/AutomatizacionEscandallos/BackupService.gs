/**
 * Backup Service for BaChan Bento Box
 * Manages automated backups of the master Google Sheet.
 */

/**
 * Creates a backup of the current spreadsheet in the "BaChan_Backups" folder.
 */
function autoBackupGoogleSheet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const folderName = "BaChan_Backups";
    let folder;
    
    // 1. Encontrar o crear la carpeta
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
      // Seguridad: Restringir acceso solo al propietario (por defecto)
      console.log(`Carpeta de backups '${folderName}' creada.`);
    }

    // 2. Crear la copia con timestamp
    const timestamp = Utilities.formatDate(new Date(), "GMT+1", "yyyy-MM-dd_HHmm");
    const backupName = `BaChan_Master_Backup_${timestamp}`;
    const backupFile = DriveApp.getFileById(ss.getId()).makeCopy(backupName, folder);
    
    console.info(`[BACKUP_SUCCESS] Copia creada con ID: ${backupFile.getId()}`);
    
    // Resetear el contador de cambios si existe
    PropertiesService.getScriptProperties().setProperty('STRUCTURAL_CHANGES_COUNT', '0');
    
    return backupFile.getUrl();
  } catch (e) {
    console.error(`[BACKUP_ERROR] Error en autoBackupGoogleSheet: ${e.message}`);
    return null;
  }
}

/**
 * Configura un activador semanal para el backup automático.
 * Ejecutar manualmente una vez para establecer el ciclo.
 */
function setupBackupTriggers() {
  // Eliminar triggers previos para evitar duplicidad
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'autoBackupGoogleSheet') {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Crear cron semanal (los lunes a las 3 AM)
  ScriptApp.newTrigger('autoBackupGoogleSheet')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(3)
    .create();
    
  console.log("Activador semanal de backup configurado correctamente.");
}

/**
 * Incrementa el contador de cambios estructurales y dispara backup si llega a 10.
 */
function trackStructuralChange() {
  const props = PropertiesService.getScriptProperties();
  const count = parseInt(props.getProperty('STRUCTURAL_CHANGES_COUNT') || "0") + 1;
  props.setProperty('STRUCTURAL_CHANGES_COUNT', count.toString());
  
  if (count >= 10) {
    console.log("Límite de 10 cambios estructurales alcanzado. Disparando backup...");
    autoBackupGoogleSheet();
  }
}
