const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function harness(seed = {}) {
  const tables = {
    Documents: [], Document_Versions: [], Document_Links: [], Audit_Log: [],
    Products: [{ Product_ID: "prd_1" }],
    Variants: [{ Variant_ID: "var_1", Product_ID: "prd_1" }]
  };
  Object.keys(seed).forEach(k => { tables[k] = seed[k].slice(); });
  const context = {
    APP: { ACTOR_ID: "actor_test" },
    ENUMS: {
      "Documents.Document_Type": ["USER_MANUAL","BROCHURE","CERTIFICATE","WARRANTY","OTHER"]
    },
    Utilities: {
      getUuid: (() => { let n=0; return () => "uuid-" + (++n); })(),
      DigestAlgorithm: { SHA_256: "SHA_256" },
      computeDigest: (_alg, bytes) => {
        const crypto = require("node:crypto");
        return Array.from(crypto.createHash("sha256").update(Buffer.from(bytes)).digest()).map(b => b > 127 ? b-256 : b);
      },
      newBlob: value => ({ getBytes: () => Array.from(Buffer.from(value)) })
    },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    DriveApp: { getFileById: id => {
      const f = files[id]; if (!f) throw new Error("FILE_NOT_FOUND");
      return { getBlob: () => ({ getBytes: () => f.bytes, getContentType: () => "application/pdf" }), getMimeType: () => "application/pdf", getName: () => f.name };
    }},
    SheetsRepository: {
      listAll: name => tables[name].slice().reverse(),
      getBy: (name, key, value) => tables[name].find(r => String(r[key]) === String(value)) || null,
      append: (name, row) => { tables[name].push({ ...row }); return tables[name].length + 1; },
      updateBy: (name, key, value, patch) => {
        const row = tables[name].find(r => String(r[key]) === String(value));
        if (!row) throw new Error("ROW_NOT_FOUND");
        Object.assign(row, patch); return 2;
      }
    }
  };
  const files = {
    file_1234567890: { name: "manual.pdf", bytes: Array.from(Buffer.from("%PDF-1.4 synthetic")) },
    file_abcdefghij: { name: "manual-revB.pdf", bytes: Array.from(Buffer.from("%PDF-1.4 revision B")) },
    file_klmnopqrst: { name: "other.pdf", bytes: Array.from(Buffer.from("%PDF-1.4 other doc")) }
  };
  vm.runInNewContext(fs.readFileSync("src/domain/DocumentService.js", "utf8"), context, { filename: "DocumentService.js" });
  return { service: context.DocumentService, tables };
}

test("creates a logical document with immutable first version and current pointer", () => {
  const h = harness();
  const result = h.service.create({ title: "Operating Manual", documentType: "USER_MANUAL", driveFileId: "file_1234567890", versionLabel: "Rev A" });
  assert.equal(result.document.Lifecycle_Status, "ACTIVE");
  assert.equal(result.document.Current_Version_ID, result.version.Version_ID);
  assert.equal(result.version.SHA256.length, 64);
  assert.equal(h.tables.Document_Versions.length, 1);
  assert.equal(h.tables.Audit_Log.length, 1);
});

test("adds a new immutable version and supersedes the previous current version", () => {
  const h = harness();
  const first = h.service.create({ title: "Operating Manual", documentType: "USER_MANUAL", driveFileId: "file_1234567890", versionLabel: "Rev A" });
  const second = h.service.addVersion(first.document.Doc_ID, { driveFileId: "file_abcdefghij", versionLabel: "Rev B" });
  assert.equal(h.tables.Document_Versions.length, 2);
  assert.equal(second.Supersedes_Version_ID, first.version.Version_ID);
  assert.equal(h.tables.Documents[0].Current_Version_ID, second.Version_ID);
  assert.equal(h.tables.Document_Versions[0].SHA256, first.version.SHA256);
});

test("rejects duplicate file bytes within one logical document", () => {
  const h = harness();
  const first = h.service.create({ title: "Manual", documentType: "USER_MANUAL", driveFileId: "file_1234567890" });
  assert.throws(() => h.service.addVersion(first.document.Doc_ID, { driveFileId: "file_1234567890", versionLabel: "Rev A" }), /DOCUMENT_VERSION_DUPLICATE/);
});

test("resolves product inheritance, variant exclusion and direct variant inclusion", () => {
  const h = harness();
  const docA = h.service.create({ title: "Shared brochure", documentType: "BROCHURE", driveFileId: "file_1234567890" });
  const docB = h.service.create({ title: "Variant certificate", documentType: "CERTIFICATE", driveFileId: "file_klmnopqrst" });
  h.service.link({ docId: docA.document.Doc_ID, targetType: "PRODUCT", targetId: "prd_1", linkMode: "INCLUDE" });
  h.service.link({ docId: docA.document.Doc_ID, targetType: "VARIANT", targetId: "var_1", linkMode: "EXCLUDE" });
  h.service.link({ docId: docB.document.Doc_ID, targetType: "VARIANT", targetId: "var_1", linkMode: "INCLUDE" });
  const resolved = h.service.resolve("VARIANT", "var_1");
  assert.deepEqual(Array.from(resolved, x => x.document.Doc_ID), [docB.document.Doc_ID]);
  assert.equal(resolved[0].inherited, false);
});

test("direct variant include coexists with inherited exclude for same document", () => {
  const h = harness();
  const doc = h.service.create({ title: "Variant override", documentType: "BROCHURE", driveFileId: "file_1234567890" });
  h.service.link({ docId: doc.document.Doc_ID, targetType: "PRODUCT", targetId: "prd_1", linkMode: "INCLUDE" });
  h.service.link({ docId: doc.document.Doc_ID, targetType: "VARIANT", targetId: "var_1", linkMode: "EXCLUDE" });
  h.service.link({ docId: doc.document.Doc_ID, targetType: "VARIANT", targetId: "var_1", linkMode: "INCLUDE" });
  assert.equal(h.service.resolve("VARIANT", "var_1").length, 1);
  assert.equal(h.service.resolve("VARIANT", "var_1")[0].inherited, false);
});

test("rejects product-level exclusions and invalid variant exclusions", () => {
  const h = harness();
  const doc = h.service.create({ title: "Brochure", documentType: "BROCHURE", driveFileId: "file_1234567890" });
  assert.throws(() => h.service.link({ docId: doc.document.Doc_ID, targetType: "PRODUCT", targetId: "prd_1", linkMode: "EXCLUDE" }), /PRODUCT_DOCUMENT_EXCLUDE_FORBIDDEN/);
  assert.throws(() => h.service.link({ docId: doc.document.Doc_ID, targetType: "VARIANT", targetId: "var_1", linkMode: "EXCLUDE" }), /DOCUMENT_EXCLUDE_WITHOUT_INHERITED_LINK/);
});

test("rejects a pinned version owned by another document", () => {
  const h = harness();
  const a = h.service.create({ title: "A", documentType: "BROCHURE", driveFileId: "file_1234567890" });
  const b = h.service.create({ title: "B", documentType: "BROCHURE", driveFileId: "file_klmnopqrst" });
  assert.throws(() => h.service.link({ docId: a.document.Doc_ID, targetType: "PRODUCT", targetId: "prd_1", linkMode: "INCLUDE", pinnedVersionId: b.version.Version_ID }), /DOCUMENT_VERSION_OWNERSHIP_MISMATCH/);
});
