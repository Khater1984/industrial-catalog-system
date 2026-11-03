const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function setup(existingSheets = {}) {
  const sheets = { ...existingSheets };
  const properties = { DEV_SPREADSHEET_ID: "synthetic-spreadsheet" };
  const context = {
    APP: { SCHEMA_VERSION: "2.1" },
    TABLES: {},
    ENUMS: {},
    ENUM_REQUIRED: {},
    FIELD_RULES: {},
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (key) => properties[key] || "",
      setProperty: (key, value) => { properties[key] = value; }
    }) },
    SpreadsheetApp: { openById: () => ({
      getId: () => "synthetic-spreadsheet",
      getSheetByName: (name) => sheets[name] || null,
      insertSheet: (name) => {
        const sheet = makeSheet(name, []);
        sheets[name] = sheet;
        return sheet;
      }
    }) }
  };
  vm.runInNewContext(fs.readFileSync("src/config/Schema.js", "utf8"), context, { filename: "Schema.js" });
  vm.runInNewContext(fs.readFileSync("src/repositories/SheetsRepository.js", "utf8"), context, { filename: "SheetsRepository.js" });
  return { repository: context.SheetsRepository, sheets, properties, tables: context.TABLES };
}

function makeSheet(name, headers) {
  let rows = headers.length ? [headers.slice()] : [];
  return {
    name,
    getLastRow: () => rows.length,
    getLastColumn: () => rows.length ? rows[0].length : 0,
    getRange: (row, column, rowCount, columnCount) => ({
      setValues: (values) => {
        if (row === 1 && rowCount === 1) rows[0] = values[0].slice();
      },
      getValues: () => rows.slice(row - 1, row - 1 + rowCount).map((r) => r.slice(column - 1, column - 1 + columnCount))
    }),
    setFrozenRows: () => {},
    readHeaders: () => rows[0] || []
  };
}

test("initializes all 52 required tabs with exact headers", () => {
  const h = setup();
  const result = h.repository.initialize();
  assert.equal(result.tables.length, 52);
  assert.equal(Object.keys(h.sheets).length, 52);
  for (const [name, columns] of Object.entries(h.tables)) {
    assert.equal(JSON.stringify(h.sheets[name].readHeaders()), JSON.stringify(Array.from(columns)), name);
  }
  assert.equal(h.properties.APP_SCHEMA_VERSION, "2.1");
});

test("refuses to rewrite an existing mismatched header", () => {
  const h = setup({ Catalogs: makeSheet("Catalogs", ["Catalog_ID", "Wrong_Column"]) });
  assert.throws(() => h.repository.initialize(), /SCHEMA_MISMATCH/);
  assert.equal(JSON.stringify(h.sheets.Catalogs.readHeaders()), JSON.stringify(["Catalog_ID", "Wrong_Column"]));
  assert.equal(h.properties.APP_SCHEMA_VERSION, undefined);
});
