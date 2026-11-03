const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context = {};
vm.runInNewContext(fs.readFileSync("src/config/Schema.js", "utf8"), context, { filename: "Schema.js" });

test("contains the complete approved 52-table V2.1 registry", () => {
  assert.equal(Object.keys(context.TABLES).length, 52);
  assert.equal(Object.values(context.TABLES).reduce((sum, columns) => sum + columns.length, 0), 711);
});

test("contains the authoritative 79-field enum registry", () => {
  assert.equal(Object.keys(context.ENUMS).length, 79);
  for (const [field, values] of Object.entries(context.ENUMS)) {
    assert.ok(field.includes("."), "enum key must identify its table and field");
    assert.ok(values.length > 0, "enum values must not be empty");
    assert.equal(new Set(values).size, values.length, "enum values must be unique");
  }
});

test("every table has unique, non-empty column names", () => {
  for (const [table, columns] of Object.entries(context.TABLES)) {
    assert.ok(columns.length > 0, table + " must have columns");
    assert.equal(new Set(columns).size, columns.length, table + " has duplicate columns");
    assert.ok(columns.every((column) => typeof column === "string" && column.length > 0));
  }
});

test("staging tables begin with the shared immutable provenance envelope", () => {
  const expected = [
    "Staging_ID", "Run_ID", "Catalog_ID", "Catalog_Page_ID", "Source_Region",
    "Raw_Extract_File_ID", "Extracted_Text", "Extraction_Method",
    "Extraction_Tool_Version", "Source_Key_Algorithm_Version", "Confidence",
    "Proposed_Status", "Staging_Record_Hash", "Created_At", "Updated_At"
  ];
  for (const table of ["Staging_Products", "Staging_Variants", "Staging_Specifications", "Staging_Images", "Staging_Documents"]) {
    assert.deepEqual(Array.from(context.TABLES[table]).slice(0, expected.length), expected, table);
  }
});

test("critical operational table contracts match the approved schema", () => {
  assert.equal(context.TABLES.Catalogs.length, 18);
  assert.equal(context.TABLES.Run_Log.length, 25);
  assert.equal(context.TABLES.Run_Units.length, 14);
  assert.ok(context.TABLES.Review_Staging_Links.includes("Review_Role"));
  assert.ok(context.TABLES.System_Config.includes("Is_Secret"));
});
