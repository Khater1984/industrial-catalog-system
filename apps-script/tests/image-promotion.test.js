const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const vm = require("node:vm");

function sha(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    const out = {};
    Object.keys(value).sort().forEach(k => { out[k] = canonical(value[k]); });
    return out;
  }
  return value;
}
function hashObject(value, field) {
  const copy = { ...value };
  if (field) delete copy[field];
  return sha(Buffer.from(JSON.stringify(canonical(copy)), "utf8"));
}
function file(bytes, mime) {
  const raw = Buffer.from(bytes);
  return {
    getBlob: () => ({
      getBytes: () => Array.from(raw),
      getDataAsString: () => raw.toString("utf8"),
      getContentType: () => mime
    }),
    getSize: () => raw.length,
    getMimeType: () => mime,
    getUrl: () => "https://drive.google.com/file/d/synthetic"
  };
}
function harness(overrides = {}) {
  const imageBytes = Buffer.from("synthetic-png-image");
  const digest = sha(imageBytes);
  const sourceImage = {
    unit_type: "IMAGE", unit_key: "page-2:image-1",
    catalog_id: "catalog_test", run_id: "run_test",
    catalog_page_id: "page_2", page_number: 2, image_index: 1,
    original_name: "pump.png", source_type: "CATALOG_EMBEDDED",
    mime_type: "image/png", width_px: 640, height_px: 480,
    has_alpha: true, metadata_status: "COMPLETED", metadata_error: "",
    quality_status: "UNASSESSED", file_size_bytes: imageBytes.length,
    sha256: digest, source_pdf_sha256: "b".repeat(64),
    extractor_version: "0.1.0", artifact_path: "images/page-00002/" + digest + ".png",
    unit_status: "COMPLETED"
  };
  sourceImage.output_sha256 = hashObject(sourceImage, "output_sha256");
  const manifest = {
    manifest_version: 1, catalog_id: "catalog_test", run_id: "run_test",
    source_sha256: "b".repeat(64), page_count: 2, image_count: 1,
    feature_flag: "CATALOG_WORKER_EXTRACT_IMAGES", extractor_version: "0.1.0",
    images: [sourceImage]
  };
  manifest.manifest_sha256 = hashObject(manifest, "manifest_sha256");
  const manifestBytes = Buffer.from(JSON.stringify(manifest), "utf8");
  const rawManifestSha = sha(manifestBytes);
  const staging = {
    Staging_ID: "stgimg_1234567890abcdef", Run_ID: "run_test",
    Catalog_ID: "catalog_test", Raw_Extract_File_ID: "source-manifest-id-12345",
    Proposed_Image_File_ID: "drive-image-id-123456789",
    Original_File_Name: "pump.png", MIME_Type: "image/png",
    Width_PX: 640, Height_PX: 480, File_Size_Bytes: imageBytes.length,
    SHA256: digest, Catalog_Page_ID: "page_2",
    Staging_Record_Hash: "a".repeat(64), Proposed_Status: "NEEDS_REVIEW",
    Quality_Status: "NEEDS_REVIEW",
    Extracted_Text: JSON.stringify({
      source_manifest_sha256: rawManifestSha,
      source_manifest_internal_sha256: manifest.manifest_sha256,
      image_output_sha256: sourceImage.output_sha256,
      artifact_path: sourceImage.artifact_path,
      metadata_status: "COMPLETED", has_alpha: true,
      color_space: "UNKNOWN", orientation: "UNKNOWN",
      page_number: 2, image_index: 1
    })
  };
  const reviewAt = "2026-11-10T19:00:00.000Z";
  const decision = {
    schema_version: 1, review_queue_id: "revimg_1234567890abcdef",
    staging_id: staging.Staging_ID, reviewed_payload_sha256: staging.Staging_Record_Hash,
    decision: "APPROVED", reviewed_by: "actor_primary", reviewed_at: reviewAt,
    target_type: "PRODUCT", target_id: "product_1",
    catalog_approved: true, datasheet_approved: false,
    is_primary: true, catalog_order: 0, datasheet_order: 0
  };
  const decisionBytes = Buffer.from(JSON.stringify(decision), "utf8");
  const review = {
    Review_Queue_ID: decision.review_queue_id, Review_Type: "IMAGE_QUALITY",
    Review_Status: overrides.reviewStatus || "APPROVED",
    Decision_JSON_File_ID: "decision-file-id-123456",
    Decision_SHA256: sha(decisionBytes),
    Reviewed_Payload_Hash: staging.Staging_Record_Hash,
    Reviewed_By: "actor_primary", Reviewed_At: reviewAt
  };
  const store = {
    Review_Queue: [review],
    Review_Staging_Links: [{
      Review_Queue_ID: review.Review_Queue_ID, Staging_ID: staging.Staging_ID, Review_Role: "PRIMARY"
    }],
    Staging_Images: [staging],
    Image_Assets: [],
    Image_Links: []
  };
  const drive = {
    "source-manifest-id-12345": file(overrides.manifestBytes || manifestBytes, "application/json"),
    "decision-file-id-123456": file(decisionBytes, "application/json"),
    "drive-image-id-123456789": file(imageBytes, "image/png")
  };
  const calls = { link: [], approval: [], primary: [] };
  const context = {
    APP: { ACTOR_ID: "actor_primary" },
    Date, JSON, Object, Array, String, Number, Boolean, RegExp, Error, isFinite,
    Utilities: {
      DigestAlgorithm: { SHA_256: "SHA-256" },
      computeDigest: (_alg, bytes) => Array.from(crypto.createHash("sha256").update(Buffer.from(bytes.map(b => b < 0 ? b + 256 : b))).digest()),
      newBlob: value => ({ getBytes: () => Array.from(Buffer.from(String(value), "utf8")) })
    },
    DriveApp: { getFileById: id => { if (!drive[id]) throw new Error("NOT_FOUND"); return drive[id]; } },
    SheetsRepository: {
      getBy(table, key, value) { return (store[table] || []).find(x => String(x[key]) === String(value)) || null; },
      listAll(table) { return (store[table] || []).map(x => ({ ...x })); },
      append(table, record) { (store[table] || (store[table] = [])).push({ ...record }); return store[table].length; },
      updateBy(table, key, value, patch) {
        const row = (store[table] || []).find(x => String(x[key]) === String(value));
        if (!row) throw new Error("ROW_NOT_FOUND");
        Object.assign(row, patch);
        return 1;
      }
    },
    ImageManagement: {
      linkToTarget(imageId, targetType, targetId, options) {
        calls.link.push({ imageId, targetType, targetId, options });
        return { status: "CREATED", linkId: "imgl_1234567890abcdef" };
      },
      setApproval(linkId, options) { calls.approval.push({ linkId, options }); },
      setPrimary(linkId, actor) { calls.primary.push({ linkId, actor }); }
    }
  };
  vm.runInNewContext(fs.readFileSync("src/domain/ImagePromotion.js", "utf8"), context);
  return { service: context.ImagePromotion, store, calls, staging, sourceImage, decision };
}

test("promotion uses verified extraction metadata and persisted human decision", () => {
  const h = harness();
  const result = h.service.promoteReviewedImage({ reviewQueueId: "revimg_1234567890abcdef" });
  assert.equal(result.status, "COMPLETED");
  assert.equal(h.store.Image_Assets.length, 1);
  const asset = h.store.Image_Assets[0];
  assert.equal(asset.Has_Alpha, true);
  assert.equal(asset.Width_PX, 640);
  assert.equal(asset.Height_PX, 480);
  assert.equal(asset.SHA256, h.sourceImage.sha256);
  assert.equal(asset.Orientation, "UNKNOWN");
  assert.equal(asset.Quality_Status, "ACCEPTABLE");
  assert.equal(h.store.Staging_Images[0].Proposed_Status, "PROMOTED");
  assert.equal(h.calls.link[0].targetId, "product_1");
  assert.equal(h.calls.approval.length, 1);
  assert.equal(h.calls.primary.length, 1);
});

test("promotion refuses a review that is not approved", () => {
  const h = harness({ reviewStatus: "OPEN" });
  assert.throws(() => h.service.promoteReviewedImage({ reviewQueueId: "revimg_1234567890abcdef" }), /IMAGE_REVIEW_NOT_APPROVED/);
  assert.equal(h.store.Image_Assets.length, 0);
});

test("promotion rejects a changed source manifest after review", () => {
  const h = harness({ manifestBytes: Buffer.from("{}") });
  assert.throws(() => h.service.promoteReviewedImage({ reviewQueueId: "revimg_1234567890abcdef" }), /IMAGE_SOURCE_MANIFEST_SHA_MISMATCH/);
  assert.equal(h.store.Image_Assets.length, 0);
});
