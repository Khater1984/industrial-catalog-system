function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : "";
  if (action !== "health") return jsonResponse_({ ok: false, error: { code: "NOT_FOUND" } });
  try {
    assertPrimaryUser_();
    var props = PropertiesService.getScriptProperties();
    return jsonResponse_({ ok: true, data: {
      appVersion: APP.VERSION,
      schemaVersion: APP.SCHEMA_VERSION,
      environment: APP.ENVIRONMENT,
      spreadsheetConfigured: Boolean(props.getProperty("DEV_SPREADSHEET_ID")),
      schemaInitialized: props.getProperty("APP_SCHEMA_VERSION") === APP.SCHEMA_VERSION
    }});
  } catch (err) {
    return jsonResponse_({ ok: false, error: { code: String(err.message || "HEALTH_FAILED") } });
  }
}

/** Run manually from the Apps Script editor after DEV properties are configured. */
function initializeDevSchema() {
  assertPrimaryUser_();
  return SheetsRepository.initialize();
}

function doPost(e) {
  try {
    assertPrimaryUser_();
    var body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (body.action === "catalog.register") {
      return jsonResponse_({ ok: true, data: CatalogService.register(body.payload || {}) });
    }
    return jsonResponse_({ ok: false, error: { code: "UNSUPPORTED_ACTION" } });
  } catch (err) {
    return jsonResponse_({ ok: false, error: { code: String(err.message || "REQUEST_FAILED") } });
  }
}
