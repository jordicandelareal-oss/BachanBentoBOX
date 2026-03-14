
function debugSupabaseColumns() {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('SUPABASE_URL');
  const key = props.getProperty('SUPABASE_KEY');
  
  const options = {
    method: 'get',
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key
    },
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url + "/rest/v1/ingredients?limit=1", options);
  console.log("RESPONSE: " + response.getContentText());
}
