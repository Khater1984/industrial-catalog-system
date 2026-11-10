const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const vm = require("node:vm");

function sha(bytes) { return crypto.createHash("sha256").update(Buffer.from(bytes)).digest("hex"); }
function harness(type, overrides = {}) {
  const reviewId = "rev_1234567890abcdef";
  const stagingId = "stg_1234567890abcdef";
  const table = type === "PRODUCT_MATCH" ? "Staging_Products" :
    (type === "VARIANT_MATCH" ? "Staging_Variants" : "Staging_Specifications");
  const staging = {
    Staging_ID: stagingId, Staging_Record_Hash: "a".repeat(64),
    Proposed_Status: "NEEDS_REVIEW", Catalog_ID: "cat_1",
    Catalog_Page_ID: "page_1", Run_ID: "run_1",
    Source_Record_Key: "source-key-1", Source_Assertion_Key: "assertion-key-1",
    Proposed_Product_Name_EN: "Industrial Generator",
    Proposed_Model_Number: "DG100", Proposed_Model_Name: "DG100",
    Attribute_Key_Raw: "Power", Value_Raw: "100", Unit_Raw: "kW",
    Normalized_Key: "Power", Normalized_Value_JSON: "\"100\"", Normalized_Unit: "kW",
    ...overrides.staging
  };
  const store = {
    Review_Queue: [{ Review_Queue_ID: reviewId, Review_Type: type, Review_Status: "OPEN" }],
    Review_Staging_Links: [{ Review_Queue_ID: reviewId, Staging_ID: stagingId, Review_Role: "PRIMARY" }],
    [table]: [staging],
    Products: [{ Product_ID: "product_1", Lifecycle_Status: "ACTIVE" }],
    Variants: [
      { Variant_ID: "variant_1", Product_ID: "product_1", Lifecycle_Status: "ACTIVE" },
      { Variant_ID: "variant_2", Product_ID: "product_2", Lifecycle_Status: "ACTIVE" }
    ]
  };
  const files = [];
  const context = {
    APP: { ACTOR_ID: "actor_primary" }, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Error,
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: {
      DigestAlgorithm: { SHA_256: "SHA-256" },
      newBlob: (value, mime, name) => ({ getBytes: () => Array.from(Buffer.from(String(value), "utf8")), getName: () => name }),
      computeDigest: (_algorithm, bytes) => Array.from(crypto.createHash("sha256").update(Buffer.from(bytes.map(b => b < 0 ? b + 256 : b))).digest())
    },
    DriveApp: {
      createFile: blob => {
        const raw = Buffer.from(blob.getBytes());
        const item = {
          getId: () => "decision-file-id-123456",
          getBlob: () => ({ getBytes: () => Array.from(raw) })
        };
        files.push({ item, raw });
        return item;
      }
    },
    SheetsRepository: {
      getBy(tableName, key, value) { return (store[tableName] || []).find(x => String(x[key]) === String(value)) || null; },
      listAll(tableName) { return (store[tableName] || []).map(x => ({ ...x })); },
      updateBy(tableName, key, value, patch) {
        const row = (store[tableName] || []).find(x => String(x[key]) === String(value));
        if (!row) throw new Error("ROW_NOT_FOUND");
        Object.assign(row, patch);
        return 1;
      }
    }
  };
  vm.runInNewContext(fs.readFileSync("src/domain/CandidateReviewDecision.js", "utf8"), context);
  return { service: context.CandidateReviewDecision, store, files, reviewId, staging, table };
}

test("product review records a CREATE_NEW decision against the exact staging hash", () => {
  const h = harness("PRODUCT_MATCH");
  const result = h.service.submit({ reviewQueueId: h.reviewId, decision: "CREATE_NEW" });
  assert.equal(result.status, "APPROVED");
  assert.equal(h.store.Review_Queue[0].Review_Status, "APPROVED");
  assert.equal(h.store.Review_Queue[0].Reviewed_Payload_Hash, h.staging.Staging_Record_Hash);
  assert.equal(h.store.Review_Queue[0].Decision_SHA256, sha(h.files[0].raw));
  const evidence = JSON.parse(h.files[0].raw.toString("utf8"));
  assert.equal(evidence.name_en, "Industrial Generator");
  assert.equal(evidence.staging_id, h.staging.Staging_ID);
});

test("variant review requires an explicit active parent product", () => {
  const h = harness("VARIANT_MATCH");
  assert.throws(() => h.service.submit({ reviewQueueId: h.reviewId, decision: "CREATE_NEW" }), /VARIANT_PARENT_PRODUCT_REQUIRED/);
  const result = h.service.submit({ reviewQueueId: h.reviewId, decision: "CREATE_NEW", targetProductId: "product_1" });
  assert.equal(result.status, "APPROVED");
  assert.equal(JSON.parse(h.files[0].raw.toString("utf8")).target_product_id, "product_1");
});

test("variant match cannot cross the selected product boundary", () => {
  const h = harness("VARIANT_MATCH");
  assert.throws(() => h.service.submit({
    reviewQueueId: h.reviewId, decision: "MATCH_EXISTING",
    targetProductId: "product_1", targetVariantId: "variant_2"
  }), /VARIANT_MATCH_TARGET_INVALID/);
  assert.equal(h.files.length, 0);
});

test("specification review requires explicit scope and target", () => {
  const h = harness("SPECIFICATION");
  assert.throws(() => h.service.submit({
    reviewQueueId: h.reviewId, decision: "APPROVED", scope: "VARIANT"
  }), /SPECIFICATION_VARIANT_REQUIRED/);
  const result = h.service.submit({
    reviewQueueId: h.reviewId, decision: "APPROVED",
    scope: "VARIANT", targetVariantId: "variant_1"
  });
  assert.equal(result.status, "APPROVED");
  const evidence = JSON.parse(h.files[0].raw.toString("utf8"));
  assert.equal(evidence.scope, "VARIANT");
  assert.equal(evidence.target_product_id, "product_1");
});

test("rejected candidate review does not require a canonical target", () => {
  const h = harness("SPECIFICATION");
  const result = h.service.submit({ reviewQueueId: h.reviewId, decision: "REJECTED" });
  assert.equal(result.status, "REJECTED");
  assert.equal(h.store.Review_Queue[0].Review_Status, "REJECTED");
});

test("candidate decision refuses unknown payload fields", () => {
  const h = harness("PRODUCT_MATCH");
  assert.throws(() => h.service.submit({
    reviewQueueId: h.reviewId, decision: "CREATE_NEW", clientApproved: true
  }), /CANDIDATE_REVIEW_UNKNOWN_FIELD/);
});
