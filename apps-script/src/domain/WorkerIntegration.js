/** GitHub Actions dispatch plus owner-executed Drive result polling. */
var WorkerIntegration = (function () {
  var CONTRACT_VERSION = "1";
  function property_(name) {
    return (PropertiesService.getScriptProperties().getProperty(name) || "").trim();
  }
  function sha256Text_(value) {
    var bytes = Utilities.newBlob(String(value), "text/plain").getBytes();
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes);
    return digest.map(function (b) {
      var v = (b < 0 ? b + 256 : b).toString(16);
      return v.length === 1 ? "0" + v : v;
    }).join("");
  }
  function expectedIdempotencyKey_(run, catalog) {
    var attempt = Number(run.Attempt_Number) || 1;
    var parent = String(run.Parent_Run_ID || "").trim();
    var retry = String(run.Retry_Reason || "").trim();
    return sha256Text_([
      String(run.Logical_Job_ID).trim(), String(run.Run_ID).trim(), String(attempt),
      parent, retry, String(catalog.SHA256).trim().toLowerCase()
    ].join("|"));
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
    var token = property_("GITHUB_ACTIONS_TOKEN");
    if (!token) return { configured: false, accepted: false, reason: "GITHUB_ACTIONS_TOKEN_NOT_CONFIGURED" };
    var workflowRef = property_("GITHUB_WORKFLOW_REF") || "dev/worker-v2.1-resumable";
    if (!/^[A-Za-z0-9._\\/-]{1,120}$/.test(workflowRef) || workflowRef.indexOf("..") >= 0) {
      throw new Error("GITHUB_WORKFLOW_REF_INVALID");
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var run = SheetsRepository.getBy("Run_Log", "Run_ID", runId);
      var catalog = SheetsRepository.getBy("Catalogs", "Catalog_ID", catalogId);
      if (!run || !catalog || run.Catalog_ID !== catalogId) throw new Error("RUN_CATALOG_NOT_FOUND");
      if (["COMPLETED", "FAILED", "CANCELLED"].indexOf(run.Run_Status) >= 0) {
        throw new Error("TERMINAL_RUN_CANNOT_DISPATCH");
      }
      var idempotencyKey = expectedIdempotencyKey_(run, catalog);
      var storedKey = String(run.Idempotency_Key || "").trim().toLowerCase();
      if (storedKey !== idempotencyKey) {
        var migrationFolder = getRunFolder_(runId);
        var existingJob = migrationFolder.getFilesByName("job.json");
        var canMigrate = ["QUEUED", "RETRY_PENDING"].indexOf(run.Run_Status) >= 0 &&
          !run.Input_Manifest_File_ID && !existingJob.hasNext();
        if (!canMigrate) throw new Error("RUN_IDEMPOTENCY_KEY_MISMATCH");
        SheetsRepository.updateBy("Run_Log", "Run_ID", runId, { Idempotency_Key: idempotencyKey });
        run.Idempotency_Key = idempotencyKey;
      }
      if (!/^[a-f0-9]{64}$/.test(idempotencyKey)) throw new Error("RUN_IDEMPOTENCY_KEY_INVALID");
      var folder = getRunFolder_(runId);
      var job = {
        contract_version: CONTRACT_VERSION, manifest_version: 1,
        run_id: runId, logical_job_id: run.Logical_Job_ID,
        catalog_id: catalogId, source_pdf_file_id: catalog.Source_File_ID,
        source_sha256: catalog.SHA256, attempt_number: Number(run.Attempt_Number) || 1,
        parent_run_id: run.Parent_Run_ID || null, retry_reason: run.Retry_Reason || null,
        idempotency_key: idempotencyKey,
        extraction_profile: "text-ocr-candidates-v2", ocr_languages: "ara+eng",
        ocr_min_usable_chars: 40, run_folder_id: folder.getId()
      };
      var jobFile = immutableJobFile_(folder, job);
      var now = new Date().toISOString();
      var startedAt = run.Started_At instanceof Date ? run.Started_At.toISOString() : (run.Started_At || now);
      var leaseExpiresAt = new Date(Date.now() + 120 * 60 * 1000).toISOString();
      SheetsRepository.updateBy("Run_Log", "Run_ID", runId, {
        Run_Status: "RUNNING", Current_Step: "WORKER_DISPATCH",
        Input_Manifest_File_ID: jobFile.getId(), Started_At: startedAt,
        Heartbeat_At: now, Worker_Lease_ID: "lease_" + Utilities.getUuid().replace(/-/g, ""),
        Lease_Expires_At: leaseExpiresAt, Error_Code: "", Error_Summary: ""
      });

      var url = "https://api.github.com/repos/Khater1984/industrial-catalog-system/actions/workflows/catalog-worker-dispatch.yml/dispatches";
      var payload = {
        ref: workflowRef,
        inputs: { run_id: runId, job_file_id: jobFile.getId() }
      };
      var lastError = "";
      for (var attempt = 1; attempt <= 3; attempt++) {
        var response;
        try {
          response = UrlFetchApp.fetch(url, {
            method: "post",
            contentType: "application/json",
            headers: {
              Authorization: "Bearer " + token,
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28"
            },
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
          });
        } catch (err) {
          lastError = "GITHUB_NETWORK_ERROR";
          response = null;
        }
        if (response) {
          var code = response.getResponseCode();
          if (code === 204) {
            return { configured: true, accepted: true, run_id: runId, workflow: "catalog-worker-dispatch.yml" };
          }
          lastError = "GITHUB_HTTP_" + code;
          if (code >= 400 && code < 500 && code !== 408 && code !== 429) {
            SheetsRepository.updateBy("Run_Log", "Run_ID", runId, {
              Run_Status: "FAILED", Current_Step: "DISPATCH_REJECTED",
              Finished_At: new Date().toISOString(), Worker_Lease_ID: "", Lease_Expires_At: "",
              Error_Code: "GITHUB_WORKFLOW_REJECTED",
              Error_Summary: "GitHub rejected the workflow dispatch (" + code + "). Check workflow availability and token permissions."
            });
            throw new Error("GITHUB_WORKFLOW_REJECTED: " + code);
          }
        }
        if (attempt < 3) Utilities.sleep(1000 * Math.pow(2, attempt - 1));
      }
      // Re-dispatch uses the same immutable Run_ID/job.json. The worker is idempotent
      // and the workflow concurrency group prevents simultaneous execution per run.
      SheetsRepository.updateBy("Run_Log", "Run_ID", runId, {
        Run_Status: "RETRY_PENDING", Current_Step: "DISPATCH_UNCONFIRMED",
        Error_Code: "GITHUB_DISPATCH_UNCONFIRMED",
        Error_Summary: "GitHub did not confirm workflow dispatch; retry with the same Run_ID. " + lastError
      });
      return { configured: true, accepted: false, retryable: true, run_id: runId };
    } finally {
      lock.releaseLock();
    }
  }
  function processCompletedRuns() {
    var runs = SheetsRepository.listAll("Run_Log"), processed = [], errors = [];
    runs.forEach(function (run) {
      var retryCandidateIntake = run.Run_Status === "COMPLETED" && run.Current_Step === "REVIEW_INTAKE_PENDING";
      if (["RUNNING", "RETRY_PENDING"].indexOf(run.Run_Status) < 0 && !retryCandidateIntake) return;
      if (!run.Input_Manifest_File_ID) return;
      try {
        var jobFile = DriveApp.getFileById(run.Input_Manifest_File_ID);
        var parents = jobFile.getParents();
        if (!parents.hasNext()) throw new Error("RUN_FOLDER_NOT_FOUND");
        var folder = parents.next(), files = folder.getFilesByName("result-manifest.json");
        if (!files.hasNext()) {
          var expiresAt = run.Lease_Expires_At ? new Date(run.Lease_Expires_At).getTime() : 0;
          if (expiresAt && expiresAt <= Date.now()) {
            SheetsRepository.updateBy("Run_Log", "Run_ID", run.Run_ID, {
              Run_Status: "FAILED", Current_Step: "WORKER_LEASE_EXPIRED",
              Finished_At: new Date().toISOString(), Worker_Lease_ID: "", Lease_Expires_At: "",
              Error_Code: "WORKER_LEASE_EXPIRED",
              Error_Summary: "No terminal result manifest arrived before the worker lease expired."
            });
            errors.push({ run_id: run.Run_ID, code: "WORKER_LEASE_EXPIRED" });
          }
          return;
        }
        var resultFile = files.next();
        var result = Ingest.ingestManifest({
          runId: run.Run_ID, resultManifestFileId: resultFile.getId()
        });
        if (result.run_status === "COMPLETED") {
          run.Run_Status = "COMPLETED";
          run.Current_Step = "INGESTED";
        }
        var reviewIntake = CandidateReviewIntake.intakeRun({
          runId: run.Run_ID, resultManifestFileId: resultFile.getId()
        });
        SheetsRepository.updateBy("Run_Log", "Run_ID", run.Run_ID, {
          Current_Step: "REVIEW_READY", Error_Code: "", Error_Summary: ""
        });
        processed.push(Object.assign({}, result, { review_intake: reviewIntake }));
      } catch (err) {
        var code = String(err && err.message ? err.message : "INGEST_FAILED").slice(0, 120);
        if (run.Run_Status === "COMPLETED") {
          try {
            SheetsRepository.updateBy("Run_Log", "Run_ID", run.Run_ID, {
              Current_Step: "REVIEW_INTAKE_PENDING",
              Error_Code: "CANDIDATE_REVIEW_INTAKE_FAILED", Error_Summary: code
            });
          } catch (ignore) {}
        } else if (["COMPLETED", "FAILED", "CANCELLED"].indexOf(run.Run_Status) < 0) {
          try {
            SheetsRepository.updateBy("Run_Log", "Run_ID", run.Run_ID, {
              Error_Code: "RESULT_INGEST_REJECTED", Error_Summary: code
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
    var rejected = code === "WORKER_REJECTED" || code === "GITHUB_WORKFLOW_REJECTED";
    if (rejected) registered.status = "FAILED";
    return { configured: true, accepted: false, retryable: !rejected, run_id: registered.runId,
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
