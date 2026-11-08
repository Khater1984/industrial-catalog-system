const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const vm = require("node:vm");

const serviceSource = fs.readFileSync("src/domain/CatalogService.js", "utf8");

function createServiceContext({ inAllowedFolder = true } = {}) {
  const rows = { Catalogs: [], Run_Log: [] };
  const pdfBytes = Buffer.from("%PDF-1.7 synthetic catalog");
  let uuid = 0;
  let lockReleased = 0;
  const file = {
    getId: () => "abcdefghij_123456",
    getName: () => "catalog.pdf",
    getSize: () => pdfBytes.length,
    getMimeType: () => "application/pdf",
    getBlob: () => ({ getBytes: () => Array.from(pdfBytes) }),
    getParents: () => {
      let consumed = false;
      return {
        hasNext: () => !consumed,
        next: () => {
          consumed = true;
          return { getId: () => inAllowedFolder ? "dev-folder" : "other-folder" };
        }
      };
    }
  };

  const context = {
    APP: { ACTOR_ID: "actor_test" },
    Utilities: {
      getUuid: () => "00000000-0000-4000-8000-" + String(++uuid).padStart(12, "0"),
      DigestAlgorithm: { SHA_256: "SHA_256" },
      newBlob: (value) => ({ getBytes: () => Array.from(Buffer.from(value, "utf8")) }),
      computeDigest: (_algorithm, bytes) =>
        Array.from(crypto.createHash("sha256").update(Buffer.from(bytes)).digest())
          .map((byte) => byte > 127 ? byte - 256 : byte)
    },
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: (key) => key === "DEV_CATALOG_FOLDER_ID" ? "dev-folder" : "" })
    },
    DriveApp: { getFileById: () => file },
    LockService: {
      getScriptLock: () => ({
        waitLock: () => {},
        releaseLock: () => { lockReleased += 1; }
      })
    },
    SheetsRepository: {
      append: (table, record) => { rows[table].push({ ...record }); return rows[table].length + 1; },
      getBy: (table, column, value) =>
        rows[table].find((record) => String(record[column]) === String(value)) || null
    }
  };
  vm.runInNewContext(serviceSource, context, { filename: "CatalogService.js" });
  return { service: context.CatalogService, rows, getLockReleased: () => lockReleased };
}

const payload = {
  driveFileId: "abcdefghij_123456",
  supplierName: "Example Supplier",
  catalogTitle: "Pump Catalogue",
  catalogReference: "P-001",
  catalogRevision: "Rev A",
  languageCode: "en",
  publishedDate: "2026-11-03",
  sourceUrl: "https://example.com/catalog.pdf",
  notes: "Synthetic test"
};

test("register creates one catalog and its first queued extraction run", () => {
  const { service, rows } = createServiceContext();
  const result = service.register(payload);
  assert.equal(result.status, "QUEUED");
  assert.equal(result.idempotentReplay, false);
  assert.equal(rows.Catalogs.length, 1);
  assert.equal(rows.Run_Log.length, 1);
  assert.equal(rows.Run_Log[0].Run_Type, "CATALOG_EXTRACTION");
  assert.equal(rows.Run_Log[0].Run_Status, "QUEUED");
});

test("identical registration is idempotent and does not append duplicates", () => {
  const { service, rows } = createServiceContext();
  const first = service.register(payload);
  const replay = service.register(payload);
  assert.equal(replay.catalogId, first.catalogId);
  assert.equal(replay.runId, first.runId);
  assert.equal(replay.idempotentReplay, true);
  assert.equal(rows.Catalogs.length, 1);
  assert.equal(rows.Run_Log.length, 1);
});

test("same PDF hash with conflicting catalog metadata is rejected for review", () => {
  const { service, rows } = createServiceContext();
  service.register(payload);
  assert.throws(
    () => service.register({ ...payload, supplierName: "Different Supplier" }),
    /DUPLICATE_SOURCE_SHA256_REQUIRES_REVIEW/
  );
  assert.equal(rows.Catalogs.length, 1);
  assert.equal(rows.Run_Log.length, 1);
});

test("source PDFs outside the configured DEV intake folder are rejected", () => {
  const { service, rows } = createServiceContext({ inAllowedFolder: false });
  assert.throws(() => service.register(payload), /FILE_OUTSIDE_DEV_INTAKE_FOLDER/);
  assert.equal(rows.Catalogs.length, 0);
  assert.equal(rows.Run_Log.length, 0);
});

test("script lock is released even when registration validation fails after acquisition", () => {
  const { service, getLockReleased } = createServiceContext();
  service.register(payload);
  assert.throws(
    () => service.register({ ...payload, supplierName: "Conflicting metadata" }),
    /DUPLICATE_SOURCE_SHA256_REQUIRES_REVIEW/
  );
  assert.equal(getLockReleased(), 2);
});
