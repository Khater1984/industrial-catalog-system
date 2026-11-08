const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function createSheet(name, failRunOnce) {
  const rows = [];
  return {
    getName: () => name,
    getLastRow: () => rows.length,
    getLastColumn: () => rows.length ? rows[0].length : 0,
    getRange: (row, column, rowCount, columnCount) => ({
      setValues: (values) => {
        if (name === "Run_Log" && row > 1 && failRunOnce.value) {
          failRunOnce.value = false;
          throw new Error("SIMULATED_SHEET_WRITE_FAILURE");
        }
        for (let index = 0; index < values.length; index += 1) rows[row - 1 + index] = values[index].slice();
      },
      getValues: () => Array.from({ length: rowCount }, (_, index) => {
        const source = rows[row - 1 + index] || [];
        return source.slice(column - 1, column - 1 + columnCount);
      })
    }),
    setFrozenRows: () => {}
  };
}

function createApplication(options = {}) {
  const failRunOnce = { value: Boolean(options.failRunOnce) };
  const sheets = {};
  let uuid = 0;
  const spreadsheet = {
    getId: () => "synthetic-spreadsheet",
    getSheetByName: (name) => sheets[name] || null,
    insertSheet: (name) => {
      const sheet = createSheet(name, failRunOnce);
      sheets[name] = sheet;
      return sheet;
    }
  };
  const properties = {
    DEV_SPREADSHEET_ID: "synthetic-spreadsheet",
    DEV_CATALOG_FOLDER_ID: "dev-folder-123",
    ALLOWED_USER_EMAIL: "owner@example.com"
  };
  const file = {
    getParents: () => {
      let used = false;
      return { hasNext: () => !used, next: () => { used = true; return { getId: () => "dev-folder-123" }; } };
    },
    getMimeType: () => "application/pdf",
    getBlob: () => ({ getBytes: () => [1, 2, 3, 4] }),
    getId: () => "abcdefghij_123456",
    getName: () => "synthetic.pdf",
    getSize: () => 4
  };
  const context = {
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (key) => properties[key] || "",
      setProperty: (key, value) => { properties[key] = value; }
    }) },
    SpreadsheetApp: { openById: () => spreadsheet },
    DriveApp: { getFileById: () => file },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    Utilities: {
      getUuid: () => "uuid-" + (++uuid),
      DigestAlgorithm: { SHA_256: "SHA_256" },
      newBlob: (value) => ({ getBytes: () => Array.from(Buffer.from(value, "utf8")) }),
      computeDigest: () => Array(32).fill(0)
    }
  };
  for (const source of [
    "src/config/Schema.js",
    "src/validation/InputValidation.js",
    "src/repositories/SheetsRepository.js",
    "src/domain/CatalogService.js"
  ]) {
    vm.runInNewContext(fs.readFileSync(source, "utf8"), context, { filename: source });
  }
  context.SheetsRepository.initialize();
  return { context, sheets, properties };
}

const input = { driveFileId: "abcdefghij_123456", supplierName: "Example Supplier" };

test("registers through the real repository validators and is idempotent", () => {
  const app = createApplication();
  const payload = app.context.InputValidation.catalogPayload(input);
  const first = app.context.CatalogService.register(payload);
  const savedCatalog = app.context.SheetsRepository.getBy("Catalogs", "SHA256", first.sha256);
  assert.ok(savedCatalog, "registered catalog must be readable through the repository");
  assert.equal(String(savedCatalog.Supplier_Name), "Example Supplier");
  assert.equal(String(savedCatalog.Catalog_Title || ""), String(payload.catalogTitle || ""));
  assert.equal(String(savedCatalog.Catalog_Revision || ""), String(payload.catalogRevision || ""));
  assert.equal(String(savedCatalog.Language_Code || ""), String(payload.languageCode || ""));
  assert.equal(String(savedCatalog.Source_File_ID), "abcdefghij_123456");
  assert.equal(String(savedCatalog.Source_File_Name), "synthetic.pdf");
  assert.equal(String(savedCatalog.MIME_Type), "application/pdf");
  assert.equal(String(savedCatalog.File_Size_Bytes), "4");
  const second = app.context.CatalogService.register(payload);
  assert.equal(first.status, "QUEUED");
  assert.equal(second.idempotentReplay, true);
  assert.equal(second.catalogId, first.catalogId);
  assert.equal(second.runId, first.runId);
  assert.equal(app.sheets.Catalogs.getLastRow(), 2);
  assert.equal(app.sheets.Run_Log.getLastRow(), 2);
  assert.equal(app.properties.APP_SCHEMA_VERSION, "2.1");
});

test("recovers a failed Run_Log write without duplicating the catalog", () => {
  const app = createApplication({ failRunOnce: true });
  const payload = app.context.InputValidation.catalogPayload(input);
  assert.throws(() => app.context.CatalogService.register(payload), /SIMULATED_SHEET_WRITE_FAILURE/);
  assert.equal(app.sheets.Catalogs.getLastRow(), 2);
  assert.equal(app.sheets.Run_Log.getLastRow(), 1);
  const retry = app.context.CatalogService.register(payload);
  assert.equal(retry.idempotentReplay, true);
  assert.equal(app.sheets.Catalogs.getLastRow(), 2);
  assert.equal(app.sheets.Run_Log.getLastRow(), 2);
});
