const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context = {};
vm.runInNewContext(fs.readFileSync("src/config/Schema.js", "utf8"), context, { filename: "Schema.js" });
vm.runInNewContext(fs.readFileSync("src/repositories/SheetsRepository.js", "utf8"), context, { filename: "SheetsRepository.js" });
const validate = context.SheetsRepository.validateEnums;

test("accepts valid required run enums", () => {
  assert.doesNotThrow(() => validate("Run_Log", { Run_Type: "CATALOG_EXTRACTION", Run_Status: "QUEUED" }, context.TABLES.Run_Log));
});

test("rejects missing required enum fields", () => {
  assert.throws(() => validate("Run_Log", { Run_Type: "CATALOG_EXTRACTION" }, context.TABLES.Run_Log), /VALIDATION_REQUIRED/);
});

test("rejects unknown enum tokens", () => {
  assert.throws(() => validate("Run_Log", { Run_Type: "CATALOG_EXTRACTION", Run_Status: "WAITING" }, context.TABLES.Run_Log), /VALIDATION_INVALID_ENUM/);
});

test("applies shared enum rules to every staging table", () => {
  assert.doesNotThrow(() => validate("Staging_Products", { Extraction_Method: "OCR", Proposed_Status: "NEW" }, context.TABLES.Staging_Products));
  assert.throws(() => validate("Staging_Products", { Extraction_Method: "MAGIC", Proposed_Status: "NEW" }, context.TABLES.Staging_Products), /VALIDATION_INVALID_ENUM/);
});
