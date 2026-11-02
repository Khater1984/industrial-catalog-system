var SheetsRepository = (function () {
  function spreadsheet_() {
    var id = PropertiesService.getScriptProperties().getProperty("DEV_SPREADSHEET_ID");
    if (!id) throw new Error("CONFIG_MISSING: DEV_SPREADSHEET_ID");
    return SpreadsheetApp.openById(id);
  }
  function initialize() {
    var ss = spreadsheet_();
    Object.keys(TABLES).forEach(function (name) {
      var headers = TABLES[name];
      var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
      if (sheet.getLastRow() === 0) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.setFrozenRows(1);
      } else {
        var existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0];
        var actual = existing.slice(0, headers.length);
        if (JSON.stringify(actual) !== JSON.stringify(headers)) {
          throw new Error("SCHEMA_MISMATCH: " + name + " header differs; no automatic rewrite performed");
        }
      }
    });
    var props = PropertiesService.getScriptProperties();
    props.setProperty("APP_SCHEMA_VERSION", APP.SCHEMA_VERSION);
    return { spreadsheetId: ss.getId(), schemaVersion: APP.SCHEMA_VERSION, tables: Object.keys(TABLES) };
  }
  function append(name, record) {
    if (!TABLES[name]) throw new Error("UNKNOWN_TABLE: " + name);
    var ss = spreadsheet_(), sheet = ss.getSheetByName(name);
    if (!sheet) throw new Error("SCHEMA_NOT_INITIALIZED: " + name);
    var headers = TABLES[name];
    var row = headers.map(function (key) {
      return Object.prototype.hasOwnProperty.call(record, key) ? record[key] : "";
    });
    sheet.appendRow(row);
    return sheet.getLastRow();
  }
  function findBy(name, column, value) {
    var headers = TABLES[name];
    if (!headers || headers.indexOf(column) < 0) throw new Error("INVALID_LOOKUP");
    var sheet = spreadsheet_().getSheetByName(name);
    if (!sheet || sheet.getLastRow() < 2) return null;
    var col = headers.indexOf(column) + 1;
    var values = sheet.getRange(2, col, sheet.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < values.length; i++) if (String(values[i][0]) === String(value)) return i + 2;
    return null;
  }
  return { initialize: initialize, append: append, findBy: findBy };
})();
