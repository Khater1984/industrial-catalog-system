const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("src/domain/Ingest.js", "utf8");

function canonical(value) {
  if (typeof value === "string") return value.normalize("NFC");
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key.normalize("NFC"), canonical(value[key])]));
  }
  return value;
}
function canonicalText(value) { return JSON.stringify(canonical(value)); }
function sha(value) { return crypto.createHash("sha256").update(value).digest("hex"); }

function buildContext(manifest, artifact) {
  const artifactBytes = Buffer.from(canonicalText(artifact));
  const manifestBytes = Buffer.from(canonicalText(manifest));
  const files = {
    "manifest-file": manifestBytes,
    "artifact-file": artifactBytes
  };
  const appended = [];
  const updates = [];
  const run = {
    Run_ID: "run_test_1", Catalog_ID: "cat_test_1",
    Logical_Job_ID: "job_test_1", Attempt_Number: 1,
    Run_Status: "RUNNING", Output_Manifest_File_ID: "", Idempotency_Key: "f".repeat(64)
  };
  const catalog = { Catalog_ID: "cat_test_1", SHA256: "b".repeat(64) };
  const context = {
    Utilities: {
      DigestAlgorithm: { SHA_256: "SHA-256" },
      computeDigest: (_algorithm, bytes) => Array.from(crypto.createHash("sha256").update(Buffer.from(bytes)).digest()),
      newBlob: (value) => ({ getBytes: () => Array.from(Buffer.from(value, "utf8")) })
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    DriveApp: {
      getFileById: (id) => ({
        getBlob: () => ({
          getBytes: () => Array.from(files[id]),
          getDataAsString: () => files[id].toString("utf8")
        })
      })
    },
    SheetsRepository: {
      getBy: (table, key, value) => {
        if (table === "Run_Log" && key === "Run_ID" && value === run.Run_ID) return run;
        if (table === "Catalogs" && key === "Catalog_ID" && value === catalog.Catalog_ID) return catalog;
        return null;
      },
      append: (table, record) => appended.push({ table, record }),
      updateBy: (table, key, value, patch) => updates.push({ table, key, value, patch })
    }
  };
  vm.runInNewContext(source, context);
  return { ingest: context.Ingest, appended, updates, files, run, catalog, artifactBytes, manifestBytes };
}

function validPayload() {
  const artifact = {
    manifest_version: 2, protocol_version: "1", worker_version: "0.2.1",
    run_id: "run_test_1", logical_job_id: "job_test_1", idempotency_key: "f".repeat(64), catalog_id: "cat_test_1",
    run_unit_id: "unit_test_1", unit_type: "CATALOG_PAGE",
    unit_key: "cp_cat_test_1_00001", catalog_page_id: "cp_cat_test_1_00001",
    run_type: "CATALOG_EXTRACTION", page_number: 1, unit_status: "COMPLETED",
    input_sha256: "a".repeat(64), source_pdf_sha256: "b".repeat(64),
    page_text_sha256: "c".repeat(64), extraction_method: "EMBEDDED_TEXT",
    extraction_tool_version: "pypdf/6", text_char_count: 12, extracted_text: "test page"
  };
  artifact.output_sha256 = sha(Object.keys(artifact).sort().reduce((o, key) => {
    o[key] = artifact[key]; return o;
  }, {} ) && canonicalText(artifact));
  const page = {
    run_unit_id: artifact.run_unit_id, unit_type: "CATALOG_PAGE",
    unit_key: artifact.unit_key, catalog_page_id: artifact.catalog_page_id,
    page_number: 1, unit_status: "COMPLETED", input_sha256: artifact.input_sha256,
    output_sha256: artifact.output_sha256, artifact_path: "pages/page-00001.json",
    artifact_file_id: "artifact-file", artifact_file_sha256: sha(canonicalText(artifact)),
    output_manifest_file_id: "artifact-file"
  };
  const manifest = {
    manifest_version: 2, protocol_version: "1", worker_version: "0.2.1",
    run_type: "CATALOG_EXTRACTION", run_id: "run_test_1",
    logical_job_id: "job_test_1", attempt_number: 1, parent_run_id: null,
    retry_reason: null, catalog_id: "cat_test_1", source_sha256: "b".repeat(64),
    job_input_sha256: "d".repeat(64), page_count: 1, completed_units: 1,
    failed_units: 0, reused_units: 0, newly_processed_units: 1,
    run_status: "COMPLETED", started_at: "2026-11-03T00:00:00Z",
    finished_at: "2026-11-03T00:00:10Z", pages: [page]
  };
  manifest.manifest_sha256 = sha(canonicalText(manifest));
  return { manifest, artifact };
}

test("Ingest verifies the manifest and each page artifact before writing Sheets", () => {
  const { manifest, artifact } = validPayload();
  const ctx = buildContext(manifest, artifact);
  const result = ctx.ingest.ingestManifest({
    runId: "run_test_1", resultManifestFileId: "manifest-file"
  });
  assert.equal(result.run_status, "COMPLETED");
  assert.equal(ctx.appended.length, 2);
  assert.deepEqual(ctx.appended.map((x) => x.table), ["Catalog_Pages", "Run_Units"]);
  assert.equal(ctx.updates[0].patch.Run_Status, "COMPLETED");
  assert.equal(ctx.updates[0].patch.Completed_Units, 1);
});

test("Ingest rejects a tampered page artifact before creating any rows", () => {
  const { manifest, artifact } = validPayload();
  const changed = { ...artifact, extracted_text: "tampered" };
  const ctx = buildContext(manifest, changed);
  assert.throws(() => ctx.ingest.ingestManifest({
    runId: "run_test_1", resultManifestFileId: "manifest-file"
  }), /PAGE_ARTIFACT_FILE_SHA256_MISMATCH/);
  assert.equal(ctx.appended.length, 0);
  assert.equal(ctx.updates.length, 0);
});
