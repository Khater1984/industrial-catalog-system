var Api = (function () {
  function requestId_(body) {
    var supplied = body && typeof body.request_id === "string" ? body.request_id.trim() : "";
    return supplied && supplied.length <= 100 ? supplied : Utilities.getUuid();
  }
  function success_(requestId, data) {
    return jsonResponse_({
      protocol_version: "1",
      request_id: requestId,
      correlation_id: requestId,
      ok: true,
      data: data,
      error: null
    });
  }
  function failure_(requestId, code) {
    return jsonResponse_({
      protocol_version: "1",
      request_id: requestId,
      correlation_id: requestId,
      ok: false,
      data: null,
      error: { code: code, message: "Request could not be completed.", retryable: false }
    });
  }
  function safeCode_(err) {
    var message = String(err && err.message ? err.message : "");
    var match = message.match(/^([A-Z][A-Z0-9_]{2,80})/);
    return match ? match[1] : "REQUEST_FAILED";
  }
  function health(e) {
    var requestId = Utilities.getUuid();
    try {
      assertPrimaryUser_();
      var props = PropertiesService.getScriptProperties();
      return success_(requestId, {
        appVersion: APP.VERSION,
        schemaVersion: APP.SCHEMA_VERSION,
        environment: APP.ENVIRONMENT,
        spreadsheetConfigured: Boolean(props.getProperty("DEV_SPREADSHEET_ID")),
        schemaInitialized: props.getProperty("APP_SCHEMA_VERSION") === APP.SCHEMA_VERSION
      });
    } catch (err) {
      return failure_(requestId, safeCode_(err));
    }
  }
  function post(e) {
    var body = {};
    var requestId = Utilities.getUuid();
    try {
      assertPrimaryUser_();
      var raw = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
      if (raw.length > 20000) return failure_(requestId, "REQUEST_TOO_LARGE");
      body = JSON.parse(raw);
      if (!body || Object.prototype.toString.call(body) !== "[object Object]") {
        return failure_(requestId, "INVALID_REQUEST");
      }
      requestId = requestId_(body);
      if (body.protocol_version && body.protocol_version !== "1") {
        return failure_(requestId, "UNSUPPORTED_PROTOCOL_VERSION");
      }
      if (body.action === "catalog.register") {
        var payload = InputValidation.catalogPayload(body.payload || {});
        return success_(requestId, CatalogService.register(payload));
      }
      return failure_(requestId, "UNSUPPORTED_ACTION");
    } catch (err) {
      return failure_(requestId, safeCode_(err));
    }
  }
  return { health: health, post: post };
})();

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : "";
  if (action !== "health") return jsonResponse_({
    protocol_version: "1", request_id: Utilities.getUuid(), correlation_id: "",
    ok: false, data: null, error: { code: "NOT_FOUND", message: "Route not found.", retryable: false }
  });
  return Api.health(e);
}

/** Run manually from the Apps Script editor after DEV properties are configured. */
function initializeDevSchema() {
  assertPrimaryUser_();
  return SheetsRepository.initialize();
}

function doPost(e) {
  return Api.post(e);
}
