const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("src/domain/WorkerIntegration.js", "utf8");

test("owner-executed poller ingests a Drive result manifest for active runs", () => {
  const calls = [];
  const manifestFile = { getId: () => "manifest-file-id" };
  const folder = { getFilesByName: (name) => ({
    hasNext: () => name === "result-manifest.json",
    next: () => manifestFile
  }) };
  const jobFile = { getParents: () => ({ hasNext: () => true, next: () => folder }) };
  const context = {
    SheetsRepository: {
      listAll: () => [{
        Run_ID: "run-1", Run_Status: "RUNNING",
        Input_Manifest_File_ID: "job-file-id"
      }]
    },
    DriveApp: { getFileById: () => jobFile },
    Ingest: { ingestManifest: (options) => {
      calls.push(options);
      return { run_id: options.runId, run_status: "COMPLETED" };
    } }
  };
  vm.runInNewContext(source, context);
  const result = context.WorkerIntegration.processCompletedRuns();
  assert.equal(result.processed.length, 1);
  assert.equal(result.processed[0].run_status, "COMPLETED");
  assert.equal(calls[0].runId, "run-1");
  assert.equal(calls[0].resultManifestFileId, "manifest-file-id");
});

test("poller ignores terminal runs and runs without an input manifest", () => {
  const context = {
    SheetsRepository: { listAll: () => [
      { Run_ID: "done", Run_Status: "COMPLETED", Input_Manifest_File_ID: "job-1" },
      { Run_ID: "empty", Run_Status: "RUNNING", Input_Manifest_File_ID: "" }
    ] },
    DriveApp: { getFileById: () => { throw new Error("must not be called"); } },
    Ingest: { ingestManifest: () => { throw new Error("must not be called"); } }
  };
  vm.runInNewContext(source, context);
  const result = context.WorkerIntegration.processCompletedRuns();
  assert.equal(result.processed.length, 0);
  assert.equal(result.errors.length, 0);
});

test("dispatch writes an immutable job manifest and starts the GitHub Actions workflow", () => {
  const properties = {
    DEV_RUNS_FOLDER_ID: "runs-folder-id-123456",
    GITHUB_ACTIONS_TOKEN: "github-actions-token",
    GITHUB_WORKFLOW_REF: "dev/worker-v2.1-resumable"
  };
  const key = crypto.createHash("sha256")
    .update(["logical_1", "run_1", "1", "", "", "a".repeat(64)].join("|"))
    .digest("hex");
  const run = {
    Run_ID: "run_1", Catalog_ID: "cat_1", Logical_Job_ID: "logical_1",
    Attempt_Number: 1, Run_Status: "QUEUED", Started_At: "", Idempotency_Key: key
  };
  const catalog = {
    Catalog_ID: "cat_1", Source_File_ID: "source-file-id-123456",
    SHA256: "a".repeat(64)
  };
  let jobContent = "";
  let request = null;
  const folder = {
    getId: () => "run-folder-id-123456",
    getFilesByName: () => ({ hasNext: () => false }),
    createFile: (_name, content) => {
      jobContent = content;
      return { getId: () => "job-file-id-123456" };
    }
  };
  const root = {
    getFoldersByName: () => ({ hasNext: () => false }),
    createFolder: () => folder
  };
  const context = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => properties[key] || "" }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    DriveApp: { getFolderById: () => root },
    MimeType: { JSON: "application/json" },
    Utilities: {
      sleep() {}, getUuid: () => "lease-test-uuid",
      DigestAlgorithm: { SHA_256: "SHA-256" },
      newBlob: (value) => ({ getBytes: () => Array.from(Buffer.from(value, "utf8")) }),
      computeDigest: (_algorithm, bytes) => Array.from(crypto.createHash("sha256").update(Buffer.from(bytes)).digest()).map((byte) => byte > 127 ? byte - 256 : byte)
    },
    SheetsRepository: {
      getBy: (table) => table === "Run_Log" ? run : catalog,
      updateBy: (_table, _key, _value, patch) => Object.assign(run, patch)
    },
    UrlFetchApp: {
      fetch: (url, options) => {
        request = { url, options };
        return { getResponseCode: () => 204, getContentText: () => "" };
      }
    }
  };
  vm.runInNewContext(source, context);
  const result = context.WorkerIntegration.dispatchCatalogRun("cat_1", "run_1");
  assert.equal(result.accepted, true);
  assert.equal(run.Run_Status, "RUNNING");
  assert.equal(request.url, "https://api.github.com/repos/Khater1984/industrial-catalog-system/actions/workflows/catalog-worker-dispatch.yml/dispatches");
  assert.equal(request.options.headers.Authorization, "Bearer github-actions-token");
  assert.equal(request.options.headers.Accept, "application/vnd.github+json");
  assert.equal(request.options.headers["X-GitHub-Api-Version"], "2022-11-28");
  const payload = JSON.parse(request.options.payload);
  assert.equal(payload.ref, "dev/worker-v2.1-resumable");
  assert.equal(payload.inputs.run_id, "run_1");
  assert.equal(payload.inputs.job_file_id, "job-file-id-123456");
  const job = JSON.parse(jobContent);
  assert.equal(job.run_id, "run_1");
  assert.equal(job.source_pdf_file_id, "source-file-id-123456");
  assert.equal(job.run_folder_id, "run-folder-id-123456");
  assert.equal(job.idempotency_key, run.Idempotency_Key);
  assert.match(run.Idempotency_Key, /^[a-f0-9]{64}$/);
});

test("poller marks an expired worker lease failed when no result manifest exists", () => {
  const run = {
    Run_ID: "run-expired", Run_Status: "RUNNING",
    Input_Manifest_File_ID: "job-expired",
    Lease_Expires_At: "2000-01-01T00:00:00.000Z"
  };
  const updates = [];
  const folder = { getFilesByName: () => ({ hasNext: () => false }) };
  const jobFile = { getParents: () => ({ hasNext: () => true, next: () => folder }) };
  const context = {
    SheetsRepository: {
      listAll: () => [run],
      updateBy: (_table, _key, _id, patch) => updates.push(patch)
    },
    DriveApp: { getFileById: () => jobFile },
    Ingest: { ingestManifest: () => { throw new Error("must not ingest"); } }
  };
  vm.runInNewContext(source, context);
  const result = context.WorkerIntegration.processCompletedRuns();
  assert.equal(result.errors[0].code, "WORKER_LEASE_EXPIRED");
  assert.equal(updates[0].Run_Status, "FAILED");
  assert.equal(updates[0].Lease_Expires_At, "");
});

test("GitHub workflow rejection is surfaced as a terminal failed registration", () => {
  const context = {};
  vm.runInNewContext(source, context);
  context.WorkerIntegration.dispatchCatalogRun = () => {
    throw new Error("GITHUB_WORKFLOW_REJECTED: 403");
  };
  const registered = { catalogId: "cat_1", runId: "run_1", status: "QUEUED" };
  const result = context.dispatchRegisteredCatalog_(registered);
  assert.equal(result.accepted, false);
  assert.equal(result.retryable, false);
  assert.equal(result.error_code, "GITHUB_WORKFLOW_REJECTED");
  assert.equal(registered.status, "FAILED");
});
