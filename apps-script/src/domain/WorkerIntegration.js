/** Cloud Run dispatch plus owner-executed Drive result polling. */
var WorkerIntegration = (function () {
  var CONTRACT_VERSION = "1";
  function property_(name) {
    return (PropertiesService.getScriptProperties().getProperty(name) || "").trim();
  }
  function getRunFolder_(runId) {
    var rootId = property_("DEV_RUNS_FOLDER_ID");
    if (!rootId) throw new Error("CONFIG_MISSING: DEV_RUNS_FOLDER_ID");
    var root = DriveApp.getFolderById(rootId), folders = root.getFoldersByName(runId);
    if (folders.hasNext()) return folders.next();
    return root.createFolder(runId);
  }
  function immutableJobFile_(folder, body) {
    var content = JSON.stringify(body), files = folder.getFilesByName("job.json");
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
        extraction_profile: "embedded-text-v1", run_folder_id: folder.getId()
      };
      var jobFile = immutableJobFile_(folder, job);
      var now = new Date().toISOString();
      var startedAt = run.Started_At instanceof Date ? run.Started_At.toISOString() : (run.Started_At || now);
      SheetsRepository.updateBy("Run_Log", "Run_ID", runId, {
        Run_Status: "RUNNING", Current_Step: "WORKER_DISPATCH",
        Input_Manifest_File_ID: jobFile.getId(), Started_At: startedAt,
        Heartbeat_At: now, Error_Code: "", Error_Summary: ""
      });

      var payload = { contract_version: CONTRACT_VERSION, run_id: runId, job_file_id: jobFile.getId() };
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
            payload: JSON.stringify(payload), muteHttpExceptions: true
          });
          var code = response.getResponseCode(), parsed = null;
          try { parsed = JSON.parse(response.getContentText()); } catch (ignore) {}
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
      // A response can be lost after Cloud Tasks accepted the deterministic task.
      // Keep the same Run_ID; Cloud Tasks task naming makes redispatch idempotent.
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
  function processCompletedRuns() {
    var runs = SheetsRepository.listAll("Run_Log"), processed = [], errors = [];
    runs.forEach(function (run) {
      if (["RUNNING", "RETRY_PENDING"].indexOf(run.Run_Status) < 0 || !run.Input_Manifest_File_ID) return;
      try {
        var jobFile = DriveApp.getFileById(run.Input_Manifest_File_ID);
        var parents = jobFile.getParents();
        if (!parents.hasNext()) throw new Error("RUN_FOLDER_NOT_FOUND");
        var folder = parents.next(), files = folder.getFilesByName("result-manifest.json");
        if (!files.hasNext()) return;
        var resultFile = files.next();
        var result = Ingest.ingestManifest({
          runId: run.Run_ID, resultManifestFileId: resultFile.getId()
        });
        processed.push(result);
      } catch (err) {
        var code = String(err && err.message ? err.message : "INGEST_FAILED").slice(0, 120);
        if (["COMPLETED", "FAILED", "CANCELLED"].indexOf(run.Run_Status) < 0) {
          try {
            SheetsRepository.updateBy("Run_Log", "Run_ID", run.Run_ID, {
              Error_Code: "RESULT_INGEST_REJECTED",
              Error_Summary: code
            });
          } catch (ignore) {}
        }
        errors.push({ run_id: run.Run_ID, code: code });
      }
    });
    return { processed: processed, errors: errors };
  }
  function installPoller() {
    var triggers = ScriptApp.getProjectTriggers();
    var exists = triggers.some(function (trigger) {
      return trigger.getHandlerFunction() === "processWorkerResults";
    });
    if (!exists) ScriptApp.newTrigger("processWorkerResults").timeBased().everyMinutes(5).create();
    return { installed: true, interval_minutes: 5, already_installed: exists };
  }
  return {
    dispatchCatalogRun: dispatchCatalogRun,
    processCompletedRuns: processCompletedRuns,
    installPoller: installPoller
  };
})();

function dispatchRegisteredCatalog_(registered) {
  if (!registered || ["QUEUED", "RETRY_PENDING"].indexOf(registered.status) < 0) {
    return { accepted: false, reason: "RUN_NOT_DISPATCHABLE", status: registered && registered.status || "" };
  }
  try {
    var result = WorkerIntegration.dispatchCatalogRun(registered.catalogId, registered.runId);
    if (result.accepted) registered.status = "RUNNING";
    else if (result.retryable) registered.status = "RETRY_PENDING";
    return result;
  } catch (err) {
    var message = String(err && err.message ? err.message : "WORKER_DISPATCH_FAILED");
    var match = message.match(/^([A-Z][A-Z0-9_]{2,80})/);
    var code = match ? match[1] : "WORKER_DISPATCH_FAILED";
    if (code === "WORKER_REJECTED") registered.status = "FAILED";
    return { configured: true, accepted: false, retryable: code !== "WORKER_REJECTED", run_id: registered.runId,
      error_code: code };
  }
}

function processWorkerResults() {
  return WorkerIntegration.processCompletedRuns();
}

function installWorkerPoller() {
  assertPrimaryUser_();
  return WorkerIntegration.installPoller();
}
