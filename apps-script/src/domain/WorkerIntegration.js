/** Cloud Run dispatch and authenticated worker callback bridge. */
var WorkerIntegration = (function () {
  var CONTRACT_VERSION = "1";
  function property_(name) {
    return (PropertiesService.getScriptProperties().getProperty(name) || "").trim();
  }
  function constantTimeEqual_(left, right) {
    left = String(left || ""); right = String(right || "");
    if (!left || left.length !== right.length) return false;
    var mismatch = 0;
    for (var i = 0; i < left.length; i++) mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
    return mismatch === 0;
  }
  function json_(value) { return JSON.stringify(value); }
  function getRunFolder_(runId) {
    var rootId = property_("DEV_RUNS_FOLDER_ID");
    if (!rootId) throw new Error("CONFIG_MISSING: DEV_RUNS_FOLDER_ID");
    var root = DriveApp.getFolderById(rootId), folders = root.getFoldersByName(runId);
    if (folders.hasNext()) return folders.next();
    return root.createFolder(runId);
  }
  function immutableJobFile_(folder, body) {
    var content = json_(body), files = folder.getFilesByName("job.json");
    if (files.hasNext()) {
      var existing = files.next();
      if (existing.getBlob().getDataAsString("UTF-8") !== content) throw new Error("JOB_MANIFEST_IMMUTABLE_CONFLICT");
      return existing;
    }
    return folder.createFile("job.json", content, MimeType.JSON);
  }
  function dispatchCatalogRun(catalogId, runId) {
    var endpoint = property_("DEV_WORKER_ENDPOINT");
    if (!endpoint) return { configured: false, accepted: false, reason: "WORKER_ENDPOINT_NOT_CONFIGURED" };
    if (endpoint.indexOf("https://") !== 0) throw new Error("WORKER_ENDPOINT_HTTPS_REQUIRED");
    var token = property_("DEV_WORKER_SHARED_TOKEN");
    if (!token) throw new Error("WORKER_TOKEN_NOT_CONFIGURED");
    var callbackToken = property_("DEV_CALLBACK_SHARED_TOKEN");
    if (!callbackToken) throw new Error("CALLBACK_TOKEN_NOT_CONFIGURED");
    var callbackUrl = ScriptApp.getService().getUrl();
    if (!callbackUrl || callbackUrl.indexOf("https://") !== 0) throw new Error("CALLBACK_URL_UNAVAILABLE");

    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var run = SheetsRepository.getBy("Run_Log", "Run_ID", runId);
      var catalog = SheetsRepository.getBy("Catalogs", "Catalog_ID", catalogId);
      if (!run || !catalog || run.Catalog_ID !== catalogId) throw new Error("RUN_CATALOG_NOT_FOUND");
      if (["COMPLETED", "FAILED", "CANCELLED"].indexOf(run.Run_Status) >= 0) {
        throw new Error("TERMINAL_RUN_CANNOT_DISPATCH");
      }
      var folder = getRunFolder_(runId);
      var job = {
        contract_version: CONTRACT_VERSION, manifest_version: 1,
        run_id: runId, logical_job_id: run.Logical_Job_ID,
        catalog_id: catalogId, source_pdf_file_id: catalog.Source_File_ID,
        source_sha256: catalog.SHA256, attempt_number: Number(run.Attempt_Number) || 1,
        parent_run_id: run.Parent_Run_ID || null, retry_reason: run.Retry_Reason || null,
        extraction_profile: "embedded-text-v1", run_folder_id: folder.getId(),
        created_at: new Date().toISOString()
      };
      var jobFile = immutableJobFile_(folder, job);
      var now = new Date().toISOString();
      SheetsRepository.updateBy("Run_Log", "Run_ID", runId, {
        Run_Status: "RUNNING", Current_Step: "WORKER_DISPATCH",
        Input_Manifest_File_ID: jobFile.getId(), Started_At: run.Started_At || now,
        Heartbeat_At: now, Error_Code: "", Error_Summary: ""
      });

      var payload = {
        contract_version: CONTRACT_VERSION, run_id: runId,
        job_file_id: jobFile.getId(), callback_url: callbackUrl
      };
      var lastError = "";
      for (var attempt = 1; attempt <= 4; attempt++) {
        try {
          var response = UrlFetchApp.fetch(endpoint, {
            method: "post", contentType: "application/json",
            headers: {
              Authorization: "Bearer " + token,
              "Idempotency-Key": runId,
              "Content-Type": "application/json"
            },
            payload: json_(payload), muteHttpExceptions: true
          });
          var code = response.getResponseCode(), text = response.getContentText();
          var parsed = null;
          try { parsed = JSON.parse(text); } catch (ignore) {}
          if (code >= 200 && code < 300 && parsed && parsed.accepted === true && parsed.run_id === runId) {
            return { configured: true, accepted: true, run_id: runId, task: parsed.task || "" };
          }
          lastError = "HTTP_" + code;
          if (code >= 400 && code < 500 && code !== 408 && code !== 429) {
            SheetsRepository.updateBy("Run_Log", "Run_ID", runId, {
              Run_Status: "FAILED", Current_Step: "DISPATCH_REJECTED",
              Finished_At: new Date().toISOString(), Error_Code: "WORKER_REJECTED",
              Error_Summary: "Worker rejected dispatch (" + code + ")."
            });
            throw new Error("WORKER_REJECTED: " + code);
          }
        } catch (err) {
          lastError = String(err && err.message ? err.message : "NETWORK_ERROR").slice(0, 120);
          if (lastError.indexOf("WORKER_REJECTED") === 0) throw err;
        }
        if (attempt < 4) Utilities.sleep(1000 * Math.pow(2, attempt - 1));
      }
      // A timeout can happen after Cloud Tasks accepted the deterministic task.
      // Keep the run recoverable; retrying with the same Run_ID is idempotent.
      SheetsRepository.updateBy("Run_Log", "Run_ID", runId, {
        Run_Status: "RETRY_PENDING", Current_Step: "DISPATCH_UNCONFIRMED",
        Error_Code: "WORKER_DISPATCH_UNCONFIRMED",
        Error_Summary: "Dispatch response was not confirmed; retry with the same Run_ID. " + lastError
      });
      return { configured: true, accepted: false, retryable: true, run_id: runId };
    } finally {
      lock.releaseLock();
    }
  }
  function handleCallback(body) {
    if (!body || body.action !== "worker.callback") throw new Error("CALLBACK_INVALID_ACTION");
    if (!constantTimeEqual_(property_("DEV_CALLBACK_SHARED_TOKEN"), body.callback_token)) {
      throw new Error("CALLBACK_UNAUTHORIZED");
    }
    if (body.contract_version !== CONTRACT_VERSION) throw new Error("CONTRACT_VERSION_MISMATCH");
    if (!body.run_id || !body.result_manifest_file_id) throw new Error("CALLBACK_INVALID_PAYLOAD");
    return Ingest.ingestManifest({
      runId: body.run_id,
      resultManifestFileId: body.result_manifest_file_id,
      resultManifestSha256: body.result_manifest_sha256 || "",
      workerVersion: body.worker_version || ""
    });
  }
  return { dispatchCatalogRun: dispatchCatalogRun, handleCallback: handleCallback };
})();
