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
        var lastColumn = sheet.getLastColumn();
        var existing = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : [];
        if (lastColumn !== headers.length || JSON.stringify(existing) !== JSON.stringify(headers)) {
          throw new Error("SCHEMA_MISMATCH: " + name + " header differs; no automatic rewrite performed");
        }
      }
    });
    PropertiesService.getScriptProperties().setProperty("APP_SCHEMA_VERSION", APP.SCHEMA_VERSION);
    return { spreadsheetId: ss.getId(), schemaVersion: APP.SCHEMA_VERSION, tables: Object.keys(TABLES) };
  }
  function safeCell_(value) {
    if (typeof value !== "string") return value === undefined || value === null ? "" : value;
    // Prevent untrusted supplier/browser text from being interpreted as a Sheets formula.
    var first = value.trim().charAt(0);
    return "=+@-".indexOf(first) >= 0 ? "'" + value : value;
  }
  function enumKey_(tableName, columnName) {
    var directKey = tableName + "." + columnName;
    if (Object.prototype.hasOwnProperty.call(ENUMS, directKey)) return directKey;
    if (tableName.indexOf("Staging_") === 0) {
      var commonKey = "Common staging envelope (all Staging_* sheets)." + columnName;
      if (Object.prototype.hasOwnProperty.call(ENUMS, commonKey)) return commonKey;
    }
    return null;
  }
  function validateEnums_(tableName, record, headers) {
    headers.forEach(function (column) {
      var key = enumKey_(tableName, column);
      if (!key) return;
      var value = Object.prototype.hasOwnProperty.call(record, column) ? record[column] : "";
      var blank = value === "" || value === null || value === undefined;
      if (ENUM_REQUIRED[key] && blank) throw new Error("VALIDATION_REQUIRED: " + tableName + "." + column);
      if (!blank && ENUMS[key].indexOf(String(value)) < 0) {
        throw new Error("VALIDATION_INVALID_ENUM: " + tableName + "." + column);
      }
    });
  }
  function append(name, record) {
    if (!TABLES[name]) throw new Error("UNKNOWN_TABLE: " + name);
    if (!record || Object.prototype.toString.call(record) !== "[object Object]") {
      throw new Error("INVALID_RECORD");
    }
    var headers = TABLES[name];
    Object.keys(record).forEach(function (key) {
      if (headers.indexOf(key) < 0) throw new Error("UNKNOWN_COLUMN: " + name + "." + key);
    });
    validateEnums_(name, record, headers);
    var sheet = spreadsheet_().getSheetByName(name);
    if (!sheet) throw new Error("SCHEMA_NOT_INITIALIZED: " + name);
    var row = headers.map(function (key) {
      return safeCell_(Object.prototype.hasOwnProperty.call(record, key) ? record[key] : "");
    });
    var rowNumber = sheet.getLastRow() + 1;
    sheet.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
    return rowNumber;
  }
  function getBy(name, column, value) {
    var headers = TABLES[name];
    if (!headers || headers.indexOf(column) < 0) throw new Error("INVALID_LOOKUP");
    var sheet = spreadsheet_().getSheetByName(name);
    if (!sheet || sheet.getLastRow() < 2) return null;
    var col = headers.indexOf(column) + 1;
    var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
    for (var i = 0; i < values.length; i++) {
      if (String(values[i][col - 1]) === String(value)) {
        var record = {};
        headers.forEach(function (header, index) { record[header] = values[i][index]; });
        return record;
      }
    }
    return null;
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
  return { initialize: initialize, append: append, findBy: findBy, getBy: getBy, validateEnums: validateEnums_ };
})();
