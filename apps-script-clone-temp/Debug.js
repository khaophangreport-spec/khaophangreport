function debugActualSpreadsheetData() {
  var properties = PropertiesService.getScriptProperties();
  var spreadsheetId = properties.getProperty('SPREADSHEET_ID');

  if (!spreadsheetId) {
    throw new Error('ไม่พบ SPREADSHEET_ID ใน Script Properties');
  }

  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);

  console.log('SPREADSHEET_ID: ' + spreadsheetId);
  console.log('Spreadsheet name: ' + spreadsheet.getName());
  console.log('Spreadsheet URL: ' + spreadsheet.getUrl());

  ['categories', 'settings'].forEach(function (sheetName) {
    var sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      console.log(sheetName + ': SHEET NOT FOUND');
      return;
    }

    console.log('--- ' + sheetName + ' ---');
    console.log('Last row: ' + sheet.getLastRow());
    console.log('Last column: ' + sheet.getLastColumn());

    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();

    if (lastRow > 0 && lastColumn > 0) {
      var values = sheet
        .getRange(1, 1, lastRow, lastColumn)
        .getDisplayValues();

      console.log(JSON.stringify(values));
    }
  });
}