const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("src/validation/InputValidation.js", "utf8");
const context = {};
vm.runInNewContext(source, context, { filename: "InputValidation.js" });
const validate = context.InputValidation.catalogPayload;

const valid = {
  driveFileId: "abcdefghij_123456",
  supplierName: "Example Supplier",
  catalogTitle: "Industrial Equipment",
  languageCode: "en",
  publishedDate: "2026-11-03",
  sourceUrl: "https://example.com/catalog.pdf",
  notes: "Synthetic test"
};

test("accepts a valid catalog payload and returns only normalized allowed fields", () => {
  const result = validate(valid);
  assert.equal(result.supplierName, "Example Supplier");
  assert.equal(result.publishedDate, "2026-11-03");
  assert.equal(Object.hasOwn(result, "unexpected"), false);
});

test("rejects missing required fields", () => {
  assert.throws(() => validate({ driveFileId: valid.driveFileId }), /VALIDATION_REQUIRED/);
});

test("rejects malformed Drive file identifiers", () => {
  assert.throws(() => validate({ ...valid, driveFileId: "not a drive id" }), /VALIDATION_INVALID_FORMAT/);
});

test("rejects impossible calendar dates", () => {
  assert.throws(() => validate({ ...valid, publishedDate: "2026-02-30" }), /VALIDATION_INVALID_FORMAT/);
});

test("rejects non-HTTP source URLs", () => {
  assert.throws(() => validate({ ...valid, sourceUrl: "file:///etc/passwd" }), /VALIDATION_INVALID_FORMAT/);
});

test("rejects unknown fields instead of silently ignoring them", () => {
  assert.throws(() => validate({ ...valid, admin: true }), /VALIDATION_UNKNOWN_FIELD/);
});

test("rejects oversized supplier names", () => {
  assert.throws(() => validate({ ...valid, supplierName: "x".repeat(161) }), /VALIDATION_TOO_LONG/);
});
