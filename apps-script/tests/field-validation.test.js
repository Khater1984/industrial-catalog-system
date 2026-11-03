const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context = {};
vm.runInNewContext(fs.readFileSync("src/config/Schema.js", "utf8"), context, { filename: "Schema.js" });
vm.runInNewContext(fs.readFileSync("src/repositories/SheetsRepository.js", "utf8"), context, { filename: "SheetsRepository.js" });
const validate = context.SheetsRepository.validateRecord;

const validRun = {
  Run_ID: "run_123456789",
  Run_Type: "CATALOG_EXTRACTION",
  Logical_Job_ID: "job_123456789",
  Attempt_Number: 1,
  Idempotency_Key: "catalog_sha256_" + "a".repeat(64),
  Run_Status: "QUEUED",
  Completed_Units: 0,
  Failed_Units: 0,
  Created_At: "2026-11-03T10:00:00.000Z",
  Created_By: "actor_primary"
};

test("accepts a complete valid Run_Log record", () => {
  assert.doesNotThrow(() => validate("Run_Log", validRun, context.TABLES.Run_Log));
});

test("rejects missing required fields", () => {
  const invalid = { ...validRun };
  delete invalid.Run_Type;
  assert.throws(() => validate("Run_Log", invalid, context.TABLES.Run_Log), /VALIDATION_REQUIRED/);
});

test("rejects incorrect logical data types", () => {
  assert.throws(() => validate("Run_Log", { ...validRun, Attempt_Number: "1" }, context.TABLES.Run_Log), /VALIDATION_INVALID_TYPE/);
});

test("rejects unknown enum values", () => {
  assert.throws(() => validate("Run_Log", { ...validRun, Run_Status: "WAITING" }, context.TABLES.Run_Log), /VALIDATION_INVALID_ENUM/);
});

test("enforces the non-secret System_Config invariant", () => {
  const config = {
    Config_ID: "cfg_123456789", Config_Key: "example", Value_Type: "TEXT",
    Value_Text: "safe", Environment_ID: "DEV", Schema_Version: "2.1",
    Is_Secret: true, Updated_At: "2026-11-03T10:00:00.000Z", Updated_By: "actor_primary"
  };
  assert.throws(() => validate("System_Config", config, context.TABLES.System_Config), /SECRET_CONFIG_FORBIDDEN/);
});

test("requires source-key algorithm version for product staging", () => {
  const staging = {
    Staging_ID: "stg_123456789", Run_ID: "run_123456789",
    Extraction_Method: "OCR", Proposed_Status: "NEW",
    Staging_Record_Hash: "a".repeat(64), Created_At: "2026-11-03T10:00:00.000Z",
    Updated_At: "2026-11-03T10:00:00.000Z",
    Proposed_Product_Name_EN: "Compactor", Source_Record_Key: "page-1-product-1"
  };
  assert.throws(() => validate("Staging_Products", staging, context.TABLES.Staging_Products), /Source_Key_Algorithm_Version/);
});
