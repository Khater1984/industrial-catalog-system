const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function harness(options = {}) {
  const rows = { Catalogs: [], Run_Log: [] };
  let uuid = 0;
  let failRunAppendOnce = Boolean(options.failRunAppendOnce);
  let lockReleased = false;
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
    APP: { ACTOR_ID: "actor_primary" },
    Utilities: {
      getUuid: () => "uuid-" + (++uuid),
      DigestAlgorithm: { SHA_256: "SHA_256" },
      computeDigest: () => [1, 2, 3, 4]
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => key === "DEV_CATALOG_FOLDER_ID" ? "dev-folder-123" : null }) },
    DriveApp: { getFileById: () => file },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => { lockReleased = true; } }) },
    SheetsRepository: {
      append: (table, record) => {
        if (table === "Run_Log" && failRunAppendOnce) {
          failRunAppendOnce = false;
          throw new Error("SIMULATED_WRITE_FAILURE");
        }
        rows[table].push({ ...record });
      },
      getBy: (table, column, value) => rows[table].find((row) => String(row[column]) === String(value)) || null
    }
  };
  vm.runInNewContext(fs.readFileSync("src/domain/CatalogService.js", "utf8"), context);
  return { register: context.CatalogService.register, rows, wasLockReleased: () => lockReleased };
}

const payload = { driveFileId: "abcdefghij_123456", supplierName: "Example Supplier" };

test("registers a catalog and creates one queued run", () => {
  const h = harness();
  const result = h.register(payload);
  assert.equal(result.status, "QUEUED");
  assert.equal(h.rows.Catalogs.length, 1);
  assert.equal(h.rows.Run_Log.length, 1);
  assert.match(h.rows.Run_Log[0].Idempotency_Key, /^catalog_sha256_/);
  assert.equal(h.wasLockReleased(), true);
});

test("replaying the same source returns the original IDs without duplicate rows", () => {
  const h = harness();
  const first = h.register(payload);
  const second = h.register(payload);
  assert.equal(second.catalogId, first.catalogId);
  assert.equal(second.runId, first.runId);
  assert.equal(second.idempotentReplay, true);
  assert.equal(h.rows.Catalogs.length, 1);
  assert.equal(h.rows.Run_Log.length, 1);
});

test("repairs a catalog row when the Run_Log append fails and the request is retried", () => {
  const h = harness({ failRunAppendOnce: true });
  assert.throws(() => h.register(payload), /SIMULATED_WRITE_FAILURE/);
  assert.equal(h.rows.Catalogs.length, 1);
  assert.equal(h.rows.Run_Log.length, 0);
  const retry = h.register(payload);
  assert.equal(retry.idempotentReplay, true);
  assert.equal(h.rows.Catalogs.length, 1);
  assert.equal(h.rows.Run_Log.length, 1);
  assert.equal(retry.catalogId, h.rows.Catalogs[0].Catalog_ID);
});

test("does not silently reuse identical PDF bytes for different catalog metadata", () => {
  const h = harness();
  h.register(payload);
  assert.throws(() => h.register({ ...payload, supplierName: "Different Supplier" }), /DUPLICATE_SOURCE_SHA256_REQUIRES_REVIEW/);
  assert.equal(h.rows.Catalogs.length, 1);
  assert.equal(h.rows.Run_Log.length, 1);
});
