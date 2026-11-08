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

test("rejects HTTP URLs without a host", () => {
  assert.throws(() => validate({ ...valid, sourceUrl: "https://" }), /VALIDATION_INVALID_FORMAT/);
});

const validateUpload = context.InputValidation.uploadMetadata;
const validUpload = {
  supplierName: "Example Supplier",
  catalogTitle: "Equipment Range",
  catalogRevision: "Rev 1",
  fileName: "sample-catalog.pdf",
  mimeType: "application/pdf",
  base64: "JVBERi0xLjQ="
};

test("accepts and normalizes browser PDF upload metadata", () => {
  const result = validateUpload(validUpload);
  assert.equal(result.fileName, "sample-catalog.pdf");
  assert.equal(result.supplierName, "Example Supplier");
});

test("rejects non-PDF filenames and MIME types", () => {
  assert.throws(() => validateUpload({ ...validUpload, fileName: "catalog.exe" }), /INVALID_PDF_FILENAME/);
  assert.throws(() => validateUpload({ ...validUpload, mimeType: "text/plain" }), /UNSUPPORTED_MIME_TYPE/);
});

test("rejects malformed base64 and unknown upload fields", () => {
  assert.throws(() => validateUpload({ ...validUpload, base64: "not base64!" }), /INVALID_BASE64/);
  assert.throws(() => validateUpload({ ...validUpload, driveId: "unexpected" }), /VALIDATION_UNKNOWN_FIELD/);
});

test("sanitizes unsafe PDF filenames", () => {
  const result = validateUpload({ ...validUpload, fileName: "vendor:catalog.pdf" });
  assert.equal(result.fileName, "vendor_catalog.pdf");
});

test("rejects upload payloads above the encoded-size limit", () => {
  assert.throws(() => validateUpload({ ...validUpload, base64: "A".repeat(16777217) }), /VALIDATION_TOO_LONG/);
});


const validateImages = context.InputValidation.imagesPromotePayload;
const validImagesPayload = {
  catalog_id: "catalog_test_001",
  run_id: "run_test_001",
  images: [{
    review_status: "ACCEPTED",
    sha256: "a".repeat(64),
    drive_file_id: "drive-file-id-123456",
    original_name: "pump.png",
    mime_type: "image/png",
    width_px: 1200,
    height_px: 800,
    file_size_bytes: 120000,
    has_alpha: true,
    catalog_page_id: "catalog_page_001",
    page_number: 1,
    target_type: "PRODUCT",
    target_id: "product_001"
  }]
};

test("accepts a complete typed image promotion payload", () => {
  const result = validateImages(validImagesPayload);
  assert.equal(result.catalog_id, "catalog_test_001");
  assert.equal(result.images[0].width_px, 1200);
  assert.equal(result.images[0].sha256, "a".repeat(64));
  assert.equal(result.images[0].target_type, "PRODUCT");
});

test("rejects numeric strings instead of coercing image dimensions", () => {
  const payload = structuredClone(validImagesPayload);
  payload.images[0].width_px = "1200";
  assert.throws(() => validateImages(payload), /VALIDATION_INVALID_TYPE/);
});

test("rejects unsupported image MIME types and oversized files", () => {
  const badMime = structuredClone(validImagesPayload);
  badMime.images[0].mime_type = "text/html";
  assert.throws(() => validateImages(badMime), /UNSUPPORTED_IMAGE_MIME_TYPE/);
  const tooLarge = structuredClone(validImagesPayload);
  tooLarge.images[0].file_size_bytes = 26214401;
  assert.throws(() => validateImages(tooLarge), /VALIDATION_INVALID_TYPE/);
});

test("rejects partial target references and unknown image fields", () => {
  const partialTarget = structuredClone(validImagesPayload);
  delete partialTarget.images[0].target_id;
  assert.throws(() => validateImages(partialTarget), /IMAGE_TARGET_PAIR_REQUIRED/);
  const unknown = structuredClone(validImagesPayload);
  unknown.images[0].is_admin = true;
  assert.throws(() => validateImages(unknown), /VALIDATION_UNKNOWN_FIELD/);
});

test("allows rejected images without inventing or requiring asset metadata", () => {
  const result = validateImages({
    catalog_id: "catalog_test_001",
    images: [{ review_status: "REJECTED" }]
  });
  assert.deepEqual(JSON.parse(JSON.stringify(result.images)), [{ review_status: "REJECTED" }]);
});
