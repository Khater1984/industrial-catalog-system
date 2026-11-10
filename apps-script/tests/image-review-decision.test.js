const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const vm = require("node:vm");

function digest(bytes) {
  return crypto.createHash("sha256").update(Buffer.from(bytes)).digest("hex");
}
function harness(reviewStatus = "OPEN", linkCount = 1) {
  const review = {
    Review_Queue_ID: "revimg_1234567890abcdef",
    Review_Type: "IMAGE_QUALITY", Review_Status: reviewStatus
  };
  const staging = {
    Staging_ID: "stgimg_1234567890abcdef",
    Staging_Record_Hash: "a".repeat(64)
  };
  const store = {
    Review_Queue: [review],
    Review_Staging_Links: Array.from({ length: linkCount }, () => ({
      Review_Queue_ID: review.Review_Queue_ID,
      Staging_ID: staging.Staging_ID, Review_Role: "PRIMARY"
    })),
    Staging_Images: [staging],
    Products: [{ Product_ID: "product_1", Lifecycle_Status: "ACTIVE" }]
  };
  const files = [];
  const context = {
    APP: { ACTOR_ID: "actor_primary" },
    Date, JSON, Object, Array, String, Number, Boolean, RegExp, Error,
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: {
      DigestAlgorithm: { SHA_256: "SHA-256" },
      newBlob: (value, mime, name) => ({
        bytes: Array.from(Buffer.from(String(value), "utf8")),
        getBytes() { return this.bytes; },
        getDataAsString() { return String(value); },
        getContentType() { return mime; },
        getName() { return name; }
      }),
      computeDigest: (_algorithm, bytes) => Array.from(
        crypto.createHash("sha256").update(Buffer.from(bytes.map(b => b < 0 ? b + 256 : b))).digest()
      )
    },
    DriveApp: {
      createFile: blob => {
        const raw = Buffer.from(blob.getBytes());
        const item = {
          getId: () => "decision-file-id-123456",
          getBlob: () => ({ getBytes: () => Array.from(raw), getDataAsString: () => raw.toString("utf8") })
        };
        files.push({ item, raw, name: blob.getName() });
        return item;
      }
    },
    SheetsRepository: {
      getBy(table, key, value) { return (store[table] || []).find(x => String(x[key]) === String(value)) || null; },
      listAll(table) { return (store[table] || []).map(x => ({ ...x })); },
      updateBy(table, key, value, patch) {
        const row = (store[table] || []).find(x => String(x[key]) === String(value));
        if (!row) throw new Error("ROW_NOT_FOUND");
        Object.assign(row, patch);
        return 1;
      }
    }
  };
  vm.runInNewContext(fs.readFileSync("src/domain/ImageReviewDecision.js", "utf8"), context);
  return { service: context.ImageReviewDecision, store, files, staging };
}

test("approved image decision is persisted with reviewer, timestamp and reviewed staging hash", () => {
  const h = harness();
  const result = h.service.submit({
    reviewQueueId: "revimg_1234567890abcdef",
    decision: "APPROVED",
    targetType: "PRODUCT",
    targetId: "product_1",
    catalogApproved: true,
    dataSheetApproved: false,
    isPrimary: true,
    catalogOrder: 0,
    dataSheetOrder: 0
  });
  assert.equal(result.status, "APPROVED");
  const row = h.store.Review_Queue[0];
  assert.equal(row.Review_Status, "APPROVED");
  assert.equal(row.Reviewed_By, "actor_primary");
  assert.equal(row.Reviewed_Payload_Hash, h.staging.Staging_Record_Hash);
  assert.equal(digest(h.files[0].raw), row.Decision_SHA256);
  const decision = JSON.parse(h.files[0].raw.toString("utf8"));
  assert.equal(decision.reviewed_payload_sha256, h.staging.Staging_Record_Hash);
  assert.equal(decision.target_id, "product_1");
});

test("rejection can be recorded without a product target", () => {
  const h = harness();
  const result = h.service.submit({
    reviewQueueId: "revimg_1234567890abcdef",
    decision: "REJECTED"
  });
  assert.equal(result.status, "REJECTED");
  assert.equal(h.store.Review_Queue[0].Review_Status, "REJECTED");
});

test("decision requires exactly one linked primary staging record", () => {
  const h = harness("OPEN", 0);
  assert.throws(() => h.service.submit({
    reviewQueueId: "revimg_1234567890abcdef", decision: "REJECTED"
  }), /IMAGE_REVIEW_PRIMARY_STAGING_LINK_INVALID/);
  assert.equal(h.files.length, 0);
});

test("decision cannot be overwritten after review completion", () => {
  const h = harness("APPROVED");
  assert.throws(() => h.service.submit({
    reviewQueueId: "revimg_1234567890abcdef", decision: "REJECTED"
  }), /IMAGE_REVIEW_NOT_OPEN/);
  assert.equal(h.files.length, 0);
});
