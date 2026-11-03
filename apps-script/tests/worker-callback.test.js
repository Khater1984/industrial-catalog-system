const test = require("node:test");
const assert = require("node:assert/strict");
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
