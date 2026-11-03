const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const workerSource = fs.readFileSync("src/domain/WorkerIntegration.js", "utf8");
const apiSource = fs.readFileSync("src/api/Api.js", "utf8");

function contextForWorker() {
  const props = { DEV_CALLBACK_SHARED_TOKEN: "callback-secret" };
  const calls = [];
  const context = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => props[key] || "" }) },
    Ingest: { ingestManifest: (options) => { calls.push(options); return { run_status: "COMPLETED" }; } }
  };
  vm.runInNewContext(workerSource, context);
  return { context, calls };
}

test("worker callback authenticates body token and forwards manifest identity", () => {
  const { context, calls } = contextForWorker();
  const result = context.WorkerIntegration.handleCallback({
    action: "worker.callback", callback_token: "callback-secret",
    contract_version: "1", run_id: "run-1",
    result_manifest_file_id: "abcdefghij123456",
    result_manifest_sha256: "a".repeat(64), worker_version: "0.2.1"
  });
  assert.equal(result.run_status, "COMPLETED");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].runId, "run-1");
  assert.equal(calls[0].resultManifestSha256, "a".repeat(64));
});

test("worker callback fails closed for missing or wrong token", () => {
  const { context } = contextForWorker();
  assert.throws(() => context.WorkerIntegration.handleCallback({
    action: "worker.callback", contract_version: "1", run_id: "run-1",
    result_manifest_file_id: "abcdefghij123456", callback_token: "wrong"
  }), /CALLBACK_UNAUTHORIZED/);
});

test("HTTP callback route is handled before primary-user browser authentication", () => {
  let authCalls = 0;
  const context = {
    APP: { VERSION: "test", SCHEMA_VERSION: "2.1", ENVIRONMENT: "TEST" },
    Utilities: { getUuid: () => "request-1" },
    assertPrimaryUser_: () => { authCalls += 1; throw new Error("UNAUTHORIZED"); },
    jsonResponse_: (value) => value,
    WorkerIntegration: { handleCallback: () => ({ run_status: "COMPLETED" }) }
  };
  vm.runInNewContext(apiSource, context);
  const result = context.Api.post({ postData: { contents: JSON.stringify({
    action: "worker.callback", request_id: "callback-1"
  }) } });
  assert.equal(result.ok, true);
  assert.equal(result.data.run_status, "COMPLETED");
  assert.equal(authCalls, 0);
});
