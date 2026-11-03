const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const validationSource = fs.readFileSync("src/validation/InputValidation.js", "utf8");
const apiSource = fs.readFileSync("src/api/Api.js", "utf8");

function createApiContext(overrides = {}) {
  let uuid = 0;
  const calls = { auth: 0, register: [] };
  const context = {
    APP: { VERSION: "test", SCHEMA_VERSION: "2.1", ENVIRONMENT: "TEST" },
    Utilities: { getUuid: () => "test-uuid-" + (++uuid) },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => ({
          DEV_SPREADSHEET_ID: "spreadsheet-test",
          APP_SCHEMA_VERSION: "2.1"
        })[key] || ""
      })
    },
    assertPrimaryUser_: () => { calls.auth += 1; return "actor_test"; },
    jsonResponse_: (payload) => payload,
    CatalogService: {
      register: (payload) => {
        calls.register.push(payload);
        return { catalogId: "cat_test", runId: "run_test", status: "QUEUED" };
      }
    },
    ...overrides
  };
  vm.runInNewContext(validationSource, context, { filename: "InputValidation.js" });
  vm.runInNewContext(apiSource, context, { filename: "Api.js" });
  return { api: context.Api, calls };
}

test("health reports app/schema configuration after authentication", () => {
  const { api, calls } = createApiContext();
  const result = api.health({});
  assert.equal(result.ok, true);
  assert.equal(result.data.schemaVersion, "2.1");
  assert.equal(result.data.spreadsheetConfigured, true);
  assert.equal(result.data.schemaInitialized, true);
  assert.equal(calls.auth, 1);
});

test("health fails closed when owner authentication fails", () => {
  const { api } = createApiContext({
    assertPrimaryUser_: () => { throw new Error("UNAUTHORIZED"); }
  });
  const result = api.health({});
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "UNAUTHORIZED");
  assert.equal(result.error.message, "Request could not be completed.");
});

test("catalog.register validates and forwards only normalized payload fields", () => {
  const { api, calls } = createApiContext();
  const result = api.post({
    postData: {
      contents: JSON.stringify({
        protocol_version: "1",
        request_id: "request-001",
        action: "catalog.register",
        payload: {
          driveFileId: "abcdefghij_123456",
          supplierName: "  Example Supplier  ",
          notes: "synthetic"
        }
      })
    }
  });
  assert.equal(result.ok, true);
  assert.equal(result.request_id, "request-001");
  assert.equal(result.data.catalogId, "cat_test");
  assert.equal(calls.register.length, 1);
  assert.equal(calls.register[0].supplierName, "Example Supplier");
  assert.equal(Object.hasOwn(calls.register[0], "unexpected"), false);
});

test("post rejects oversized requests before parsing", () => {
  const { api } = createApiContext();
  const result = api.post({ postData: { contents: "x".repeat(20001) } });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "REQUEST_TOO_LARGE");
});

test("post rejects malformed JSON with a safe error response", () => {
  const { api } = createApiContext();
  const result = api.post({ postData: { contents: "{not-json" } });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "REQUEST_FAILED");
  assert.equal(result.error.message, "Request could not be completed.");
});

test("post rejects unsupported protocol versions and actions", () => {
  const { api } = createApiContext();
  const wrongVersion = api.post({
    postData: { contents: JSON.stringify({ protocol_version: "99", action: "catalog.register" }) }
  });
  assert.equal(wrongVersion.error.code, "UNSUPPORTED_PROTOCOL_VERSION");

  const unknownAction = api.post({
    postData: { contents: JSON.stringify({ protocol_version: "1", action: "run.dispatch" }) }
  });
  assert.equal(unknownAction.error.code, "UNSUPPORTED_ACTION");
});

test("post maps validation errors to stable safe error codes", () => {
  const { api } = createApiContext();
  const result = api.post({
    postData: {
      contents: JSON.stringify({
        protocol_version: "1",
        action: "catalog.register",
        payload: { driveFileId: "bad", supplierName: "Supplier" }
      })
    }
  });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "VALIDATION_INVALID_FORMAT");
});
