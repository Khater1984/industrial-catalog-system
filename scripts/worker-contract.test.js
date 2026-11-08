const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "worker-contract-"));
const fixtureScript = path.join(__dirname, "build_worker_contract_fixture.py");
const generated = spawnSync("python", [fixtureScript, tempDir], {
  cwd: repoRoot, encoding: "utf8",
  env: {
    ...process.env,
    PYTHONPATH: [path.join(repoRoot, "worker/src"), process.env.PYTHONPATH || ""].filter(Boolean).join(path.delimiter)
  }
});
if (generated.status !== 0) {
  throw new Error("Could not generate Worker contract fixture: " + (generated.stderr || generated.stdout));
}
const identity = JSON.parse(generated.stdout.trim());
const manifestBytes = fs.readFileSync(path.join(tempDir, "manifest.json"));
const artifactBytes = fs.readFileSync(path.join(tempDir, "artifact.json"));
const ingestSource = fs.readFileSync(path.join(repoRoot, "apps-script/src/domain/Ingest.js"), "utf8");

function buildIngestContext(runKey = identity.idempotency_key) {
  const rows = { Catalog_Pages: [], Run_Units: [] };
  const run = {
    Run_ID: identity.run_id, Catalog_ID: identity.catalog_id,
    Logical_Job_ID: identity.logical_job_id, Attempt_Number: 1,
    Parent_Run_ID: "", Retry_Reason: "", Idempotency_Key: runKey,
    Run_Status: "RUNNING", Output_Manifest_File_ID: ""
  };
  const catalog = { Catalog_ID: identity.catalog_id, SHA256: identity.source_sha256 };
  const files = { "manifest-file": manifestBytes, "artifact-file": artifactBytes };
  const context = {
    Utilities: {
      DigestAlgorithm: { SHA_256: "SHA-256" },
      computeDigest: (_algorithm, bytes) =>
        Array.from(crypto.createHash("sha256").update(Buffer.from(bytes)).digest())
          .map((byte) => byte > 127 ? byte - 256 : byte),
      newBlob: (value) => ({ getBytes: () => Array.from(Buffer.from(value, "utf8")) })
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    DriveApp: {
      getFileById: (id) => {
        const bytes = files[id];
        if (!bytes) throw new Error("Unexpected Drive file " + id);
        return { getBlob: () => ({
          getBytes: () => Array.from(bytes),
          getDataAsString: () => bytes.toString("utf8")
        }) };
      }
    },
    SheetsRepository: {
      getBy: (table, key, value) => {
        if (table === "Run_Log" && key === "Run_ID" && value === run.Run_ID) return run;
        if (table === "Catalogs" && key === "Catalog_ID" && value === catalog.Catalog_ID) return catalog;
        return null;
      },
      append: (table, record) => rows[table].push(record),
      updateBy: (table, key, value, patch) => {
        if (table === "Run_Log" && key === "Run_ID" && value === run.Run_ID) Object.assign(run, patch);
      }
    }
  };
  vm.runInNewContext(ingestSource, context);
  return { ingest: context.Ingest, rows, run };
}

test("actual Worker output is accepted and materialized by Apps Script Ingest", () => {
  const context = buildIngestContext();
  const result = context.ingest.ingestManifest({ runId: identity.run_id, resultManifestFileId: "manifest-file" });
  assert.equal(result.run_status, "COMPLETED");
  assert.equal(context.rows.Catalog_Pages.length, 1);
  assert.equal(context.rows.Run_Units.length, 1);
  assert.equal(context.rows.Run_Units[0].Output_Manifest_File_ID, "artifact-file");
  assert.equal(context.run.Idempotency_Key, identity.idempotency_key);
});

test("Apps Script rejects a Worker result bound to a different Run_Log key", () => {
  const context = buildIngestContext("0".repeat(64));
  assert.throws(
    () => context.ingest.ingestManifest({ runId: identity.run_id, resultManifestFileId: "manifest-file" }),
    /MANIFEST_IDEMPOTENCY_MISMATCH/
  );
  assert.equal(context.rows.Catalog_Pages.length, 0);
  assert.equal(context.rows.Run_Units.length, 0);
});

fs.rmSync(tempDir, { recursive: true, force: true });
