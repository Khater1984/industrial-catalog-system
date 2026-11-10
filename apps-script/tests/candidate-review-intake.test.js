const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("src/domain/CandidateReviewIntake.js", "utf8");
function canonical(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(canonical);
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
}
function canonicalText(value) { return JSON.stringify(canonical(value)); }
function sha(value) { return crypto.createHash("sha256").update(value).digest("hex"); }

function fixture() {
  const artifact = {
    run_id: "run_test", catalog_id: "cat_test",
    catalog_page_id: "cp_cat_test_00001", page_number: 1,
    extraction_method: "EMBEDDED_TEXT", extraction_tool_version: "pypdf/6",
    product_candidates: {
      products: [{ proposed_product_name: "Industrial Generator", source_quote: "Industrial Generator DG100", confidence: "LOW" }],
      variants: [{ proposed_model_number: "DG100", source_quote: "Model DG100", confidence: "MEDIUM" }],
      specifications: [{ attribute_key_raw: "Power", value_raw: "100", unit_raw: "kW", source_quote: "Power: 100 kW", confidence: "LOW" }]
    }
  };
  artifact.output_sha256 = sha(canonicalText(artifact));
  const artifactBytes = Buffer.from(canonicalText(artifact));
  const page = {
    catalog_page_id: artifact.catalog_page_id, page_number: 1,
    artifact_file_id: "artifact-file-id", artifact_file_sha256: sha(artifactBytes),
    output_sha256: artifact.output_sha256
  };
  const manifest = {
    run_id: "run_test", catalog_id: "cat_test", run_status: "COMPLETED",
    pages: [page]
  };
  const files = {
    "manifest-file-id": Buffer.from(JSON.stringify(manifest)),
    "artifact-file-id": artifactBytes
  };
  const run = {
    Run_ID: "run_test", Catalog_ID: "cat_test", Run_Status: "COMPLETED",
    Output_Manifest_File_ID: "manifest-file-id"
  };
  const rows = {};
  const context = {
    APP: { ACTOR_ID: "actor_primary" },
    Utilities: {
      DigestAlgorithm: { SHA_256: "SHA-256" },
      newBlob: (value) => ({ getBytes: () => Array.from(Buffer.from(value, "utf8")) }),
      computeDigest: (_algorithm, bytes) => Array.from(crypto.createHash("sha256").update(Buffer.from(bytes)).digest())
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    DriveApp: { getFileById: (id) => ({
      getBlob: () => ({
        getBytes: () => Array.from(files[id]),
        getDataAsString: () => files[id].toString("utf8")
      })
    }) },
    SheetsRepository: {
      getBy: (table, key, value) => {
        if (table === "Run_Log") return key === "Run_ID" && value === run.Run_ID ? run : null;
        return (rows[table] || []).find((row) => row[key] === value) || null;
      },
      append: (table, record) => {
        rows[table] = rows[table] || [];
        rows[table].push(record);
      }
    }
  };
  vm.runInNewContext(source, context);
  return { intake: context.CandidateReviewIntake, rows };
}

test("candidate intake stages products and queues unresolved model/spec evidence without guessing parents", () => {
  const ctx = fixture();
  const result = ctx.intake.intakeRun({ runId: "run_test", resultManifestFileId: "manifest-file-id" });
  assert.equal(result.status, "COMPLETED");
  assert.equal(result.counts.staging_products, 1);
  assert.equal(result.counts.review_items, 2);
  assert.equal(result.counts.variants_unassigned, 1);
  assert.equal(result.counts.specifications_unassigned, 1);
  assert.equal(ctx.rows.Staging_Products.length, 1);
  assert.equal(ctx.rows.Staging_Products[0].Proposed_Status, "NEEDS_REVIEW");
  assert.equal(ctx.rows.Staging_Products[0].Proposed_Product_Name_EN, "Industrial Generator");
  assert.equal(ctx.rows.Staging_Variants, undefined);
  assert.equal(ctx.rows.Staging_Specifications, undefined);
  assert.equal(ctx.rows.Review_Queue.length, 2);
  assert.equal(ctx.rows.Review_Queue.find((row) => row.Review_Type === "EXTRACTION_AMBIGUITY").Decision_JSON_File_ID, "artifact-file-id");
  assert.equal(ctx.rows.Review_Staging_Links.length, 1);
});

test("candidate intake is idempotent across poller retries", () => {
  const ctx = fixture();
  ctx.intake.intakeRun({ runId: "run_test", resultManifestFileId: "manifest-file-id" });
  ctx.intake.intakeRun({ runId: "run_test", resultManifestFileId: "manifest-file-id" });
  assert.equal(ctx.rows.Staging_Products.length, 1);
  assert.equal(ctx.rows.Review_Queue.length, 2);
  assert.equal(ctx.rows.Review_Staging_Links.length, 1);
});

test("candidate intake rejects artifacts with altered bytes or identity", () => {
  const ctx = fixture();
  const run = { Run_ID: "run_test", Catalog_ID: "cat_test", Run_Status: "COMPLETED", Output_Manifest_File_ID: "wrong-manifest" };
  assert.throws(() => ctx.intake.intakeRun({ runId: "run_test", resultManifestFileId: "wrong-manifest" }), /CANDIDATE_MANIFEST_NOT_INGESTED/);
});
