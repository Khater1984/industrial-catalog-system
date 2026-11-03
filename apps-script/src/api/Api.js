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
  if (action === "health") return Api.health(e);
  assertPrimaryUser_();
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("Industrial Catalog Studio")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

/** Browser upload endpoint. The deployed web app is restricted to the primary owner. */
function uploadCatalogFromBrowser(payload) {
  assertPrimaryUser_();
  if (!payload || Object.prototype.toString.call(payload) !== "[object Object]") throw new Error("INVALID_UPLOAD_PAYLOAD");
  var allowed = ["supplierName", "catalogTitle", "catalogRevision", "fileName", "mimeType", "base64"];
  Object.keys(payload).forEach(function (key) {
    if (allowed.indexOf(key) < 0) throw new Error("VALIDATION_UNKNOWN_FIELD: " + key);
  });
  var name = String(payload.fileName || "").replace(/[\\\\/:*?"<>|\\x00-\\x1F]/g, "_").trim();
  if (!name || name.length > 180 || !/\\.pdf$/i.test(name)) throw new Error("INVALID_PDF_FILENAME");
  if (payload.mimeType && payload.mimeType !== "application/pdf") throw new Error("UNSUPPORTED_MIME_TYPE");
  if (typeof payload.base64 !== "string" || !payload.base64 || payload.base64.length > 16777216 || !/^[A-Za-z0-9+/]+={0,2}$/.test(payload.base64)) {
    throw new Error("INVALID_BASE64_OR_FILE_TOO_LARGE");
  }
  var bytes = Utilities.base64Decode(payload.base64);
  if (bytes.length < 8 || bytes.length > 12 * 1024 * 1024) throw new Error("FILE_SIZE_OUT_OF_RANGE");
  var signature = bytes.slice(0, 5).map(function (byte) { return String.fromCharCode(byte < 0 ? byte + 256 : byte); }).join("");
  if (signature !== "%PDF-") throw new Error("INVALID_PDF_SIGNATURE");
  var folderId = PropertiesService.getScriptProperties().getProperty("DEV_CATALOG_FOLDER_ID");
  if (!folderId) throw new Error("CONFIG_MISSING: DEV_CATALOG_FOLDER_ID");
  var blob = Utilities.newBlob(bytes, "application/pdf", name);
  var file = DriveApp.getFolderById(folderId).createFile(blob);
  var catalogPayload = InputValidation.catalogPayload({
    driveFileId: file.getId(),
    supplierName: payload.supplierName,
    catalogTitle: payload.catalogTitle || "",
    catalogRevision: payload.catalogRevision || ""
  });
  var registered = CatalogService.register(catalogPayload);
  return {
    catalogId: registered.catalogId,
    runId: registered.runId,
    fileName: file.getName(),
    sha256: registered.sha256,
    status: registered.status,
    idempotentReplay: registered.idempotentReplay
  };
}

/** Owner-only data endpoint called by the HtmlService dashboard. */
function getCatalogDashboard() {
  assertPrimaryUser_();
  var catalogs = SheetsRepository.listRecent("Catalogs", 30);
  var runs = SheetsRepository.listRecent("Run_Log", 60);
  var sheet = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("DEV_SPREADSHEET_ID")).getSheetByName("Catalogs");
  return { catalogs: catalogs, runs: runs, totalCount: sheet ? Math.max(0, sheet.getLastRow() - 1) : 0 };
}

/** Run manually from the Apps Script editor after DEV properties are configured. */
function initializeDevSchema() {
  assertPrimaryUser_();
  return SheetsRepository.initialize();
}

function doPost(e) {
  return Api.post(e);
}
