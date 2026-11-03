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
  function validateFieldValue_(tableName, column, value, type) {
    var errorCode = "VALIDATION_INVALID_TYPE: " + tableName + "." + column;
    if (type === "ENUM") {
      var key = enumKey_(tableName, column);
      if (!key || ENUMS[key].indexOf(String(value)) < 0) throw new Error("VALIDATION_INVALID_ENUM: " + tableName + "." + column);
      return;
    }
    if (type === "INTEGER") {
      if (typeof value !== "number" || !Number.isInteger(value)) throw new Error(errorCode);
      return;
    }
    if (type.indexOf("DECIMAL(") === 0) {
      if (typeof value !== "number" || !isFinite(value)) throw new Error(errorCode);
      return;
    }
    if (type === "BOOLEAN") {
      if (typeof value !== "boolean") throw new Error(errorCode);
      if (tableName === "System_Config" && column === "Is_Secret" && value !== false) throw new Error("SECRET_CONFIG_FORBIDDEN");
      return;
    }
    if (type === "HEX64") {
      if (typeof value !== "string" || value.length !== 64 || !/^[0-9a-f]{64}$/.test(value)) throw new Error(errorCode);
      return;
    }
    if (type === "DATE") {
      if (value instanceof Date) { if (isNaN(value.getTime())) throw new Error(errorCode); return; }
      if (typeof value !== "string") throw new Error(errorCode);
      var dateParts = value.split("-");
      if (dateParts.length !== 3 || dateParts[0].length !== 4 || dateParts[1].length !== 2 || dateParts[2].length !== 2) throw new Error(errorCode);
      var year = Number(dateParts[0]), month = Number(dateParts[1]), day = Number(dateParts[2]);
      var date = new Date(Date.UTC(year, month - 1, day));
      if (!year || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new Error(errorCode);
      return;
    }
    if (type === "DATETIME_UTC") {
      if (typeof value !== "string" || value.indexOf("T") < 0 || value.charAt(value.length - 1) !== "Z" || isNaN(Date.parse(value))) throw new Error(errorCode);
      return;
    }
    if (type === "URL") {
      if (typeof value !== "string") throw new Error(errorCode);
      var lowerUrl = value.toLowerCase();
      var protocolLength = lowerUrl.indexOf("https://") === 0 ? 8 : (lowerUrl.indexOf("http://") === 0 ? 7 : 0);
      var authority = protocolLength ? value.substring(protocolLength).split("/")[0].split("?")[0].split("#")[0] : "";
      if (!protocolLength || !authority || value.split("").some(function (ch) { return ch.charCodeAt(0) <= 32; })) throw new Error(errorCode);
      return;
    }
    if (type === "EMAIL") {
      if (typeof value !== "string" || value.indexOf("@") <= 0 || value.lastIndexOf(".") < value.indexOf("@") + 2) throw new Error(errorCode);
      return;
    }
    if (type === "ID" || type === "ACTOR_ID" || type === "DRIVE_FILE_ID" || type === "JSON_FILE_ID") {
      if (typeof value !== "string" || !value.trim()) throw new Error(errorCode);
      if ((type === "DRIVE_FILE_ID" || type === "JSON_FILE_ID") && !/^[A-Za-z0-9_-]{10,200}$/.test(value)) throw new Error(errorCode);
      return;
    }
    var textLimit = type.indexOf("TEXT(") === 0 ? Number(type.slice(5, -1)) : 0;
    var jsonLimit = type.indexOf("JSON_TEXT(") === 0 ? Number(type.slice(10, -1)) : 0;
    if (textLimit) {
      if (typeof value !== "string" || value.length > textLimit) throw new Error(errorCode);
      return;
    }
    if (jsonLimit) {
      if (typeof value !== "string" || value.length > jsonLimit) throw new Error(errorCode);
      try { JSON.parse(value); } catch (err) { throw new Error("VALIDATION_INVALID_JSON: " + tableName + "." + column); }
      return;
    }
    throw new Error("SCHEMA_UNSUPPORTED_FIELD_TYPE: " + type);
  }
  function validateRecord_(tableName, record, headers) {
    headers.forEach(function (column) {
      var key = tableName + "." + column;
      var rule = FIELD_RULES[key];
      if (!rule) throw new Error("SCHEMA_FIELD_RULE_MISSING: " + key);
      var value = Object.prototype.hasOwnProperty.call(record, column) ? record[column] : "";
      var blank = value === "" || value === null || value === undefined || (typeof value === "string" && !value.trim());
      if (rule.required && blank) throw new Error("VALIDATION_REQUIRED: " + key);
      if (!blank) validateFieldValue_(tableName, column, value, rule.type);
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
    validateRecord_(name, record, headers);
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
  return { initialize: initialize, append: append, findBy: findBy, getBy: getBy, validateEnums: validateEnums_, validateRecord: validateRecord_ };
})();
