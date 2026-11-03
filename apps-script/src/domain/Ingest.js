/** Validates and idempotently materializes a Worker result manifest into V2.1 Sheets. */
var Ingest = (function () {
  function canonical_(value) {
    if (typeof value === "string") return value.normalize ? value.normalize("NFC") : value;
    if (Array.isArray(value)) return value.map(canonical_);
    if (value && typeof value === "object") {
      var out = {};
      Object.keys(value).sort().forEach(function (key) {
        var normalizedKey = key.normalize ? key.normalize("NFC") : key;
        if (Object.prototype.hasOwnProperty.call(out, normalizedKey)) throw new Error("MANIFEST_CANONICAL_KEY_COLLISION");
        out[normalizedKey] = canonical_(value[key]);
      });
      return out;
    }
    return value;
  }
  function canonicalJson_(value) { return JSON.stringify(canonical_(value)); }
  function sha256Bytes_(bytes) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes).map(function (b) {
      var n = b < 0 ? b + 256 : b, hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }
  function sha256Text_(value) { return sha256Bytes_(Utilities.newBlob(value, "application/json").getBytes()); }
  function requireString_(obj, key) {
    if (!obj || typeof obj[key] !== "string" || !obj[key].trim()) throw new Error("MANIFEST_FIELD_INVALID: " + key);
    return obj[key].trim();
  }
  function verifyManifest_(manifest, run, expectedRawSha) {
    if (!manifest || Object.prototype.toString.call(manifest) !== "[object Object]") throw new Error("MANIFEST_INVALID");
    if (manifest.protocol_version !== "1" || manifest.manifest_version !== 2) throw new Error("MANIFEST_VERSION_UNSUPPORTED");
    if (requireString_(manifest, "run_id") !== run.Run_ID) throw new Error("MANIFEST_RUN_MISMATCH");
    if (requireString_(manifest, "catalog_id") !== run.Catalog_ID) throw new Error("MANIFEST_CATALOG_MISMATCH");
    if (requireString_(manifest, "logical_job_id") !== run.Logical_Job_ID) throw new Error("MANIFEST_LOGICAL_JOB_MISMATCH");
    if (manifest.attempt_number !== Number(run.Attempt_Number) || manifest.run_type !== "CATALOG_EXTRACTION") {
      throw new Error("MANIFEST_RUN_LINEAGE_MISMATCH");
    }
    var catalog = SheetsRepository.getBy("Catalogs", "Catalog_ID", run.Catalog_ID);
    if (!catalog || manifest.source_sha256 !== catalog.SHA256) throw new Error("MANIFEST_SOURCE_MISMATCH");
    if (expectedRawSha && expectedRawSha !== sha256Text_(canonicalJson_(manifest))) {
      throw new Error("MANIFEST_FILE_SHA256_MISMATCH");
    }
    var copy = {};
    Object.keys(manifest).forEach(function (key) { if (key !== "manifest_sha256") copy[key] = manifest[key]; });
    if (manifest.manifest_sha256 !== sha256Text_(canonicalJson_(copy))) throw new Error("MANIFEST_SHA256_INVALID");
    if (!Number.isInteger(manifest.page_count) || manifest.page_count < 0) throw new Error("MANIFEST_PAGE_COUNT_INVALID");
    if (!Array.isArray(manifest.pages)) throw new Error("MANIFEST_PAGES_INVALID");
    if (manifest.run_status === "COMPLETED") {
      if (manifest.page_count < 1 || manifest.pages.length !== manifest.page_count ||
          manifest.completed_units !== manifest.page_count || manifest.failed_units !== 0) {
        throw new Error("MANIFEST_UNIT_COUNTS_INVALID");
      }
    } else if (manifest.run_status !== "FAILED") {
      throw new Error("MANIFEST_STATUS_NOT_TERMINAL");
    }
    var seen = {};
    manifest.pages.forEach(function (page, index) {
      if (!page || page.page_number !== index + 1) throw new Error("MANIFEST_PAGE_ORDER_INVALID");
      var key = requireString_(page, "unit_key");
      if (page.unit_type !== "CATALOG_PAGE" || key !== page.catalog_page_id ||
          page.catalog_page_id !== "cp_" + manifest.catalog_id + "_" + String(index + 1).padStart(5, "0")) {
        throw new Error("MANIFEST_PAGE_IDENTITY_INVALID");
      }
      if (seen[key] || seen[page.run_unit_id]) throw new Error("MANIFEST_DUPLICATE_UNIT_KEY");
      seen[key] = true; seen[page.run_unit_id] = true;
      requireString_(page, "run_unit_id");
      requireString_(page, "catalog_page_id");
      requireString_(page, "input_sha256");
      if (!/^[a-f0-9]{64}$/.test(page.input_sha256)) throw new Error("MANIFEST_INPUT_SHA_INVALID");
      if (manifest.run_status === "COMPLETED") {
        if (page.unit_status !== "COMPLETED" && page.unit_status !== "REUSED") throw new Error("MANIFEST_UNIT_STATUS_INVALID");
        requireString_(page, "artifact_file_id");
        requireString_(page, "artifact_file_sha256");
        requireString_(page, "output_sha256");
        if (!/^[a-f0-9]{64}$/.test(page.artifact_file_sha256) || !/^[a-f0-9]{64}$/.test(page.output_sha256)) {
          throw new Error("MANIFEST_OUTPUT_SHA_INVALID");
        }
      }
    });
  }
  function verifyArtifact_(page, manifest) {
    var file = DriveApp.getFileById(page.artifact_file_id);
    var bytes = file.getBlob().getBytes();
    if (sha256Bytes_(bytes) !== page.artifact_file_sha256) throw new Error("PAGE_ARTIFACT_FILE_SHA256_MISMATCH");
    var artifact;
    try { artifact = JSON.parse(file.getBlob().getDataAsString("UTF-8")); }
    catch (err) { throw new Error("PAGE_ARTIFACT_JSON_INVALID"); }
    var artifactCopy = {};
    Object.keys(artifact).forEach(function (key) { if (key !== "output_sha256") artifactCopy[key] = artifact[key]; });
    if (artifact.output_sha256 !== sha256Text_(canonicalJson_(artifactCopy))) throw new Error("PAGE_ARTIFACT_CHECKSUM_INVALID");
    if (artifact.source_pdf_sha256 !== manifest.source_sha256 || artifact.page_number !== page.page_number ||
        artifact.run_id !== manifest.run_id || artifact.catalog_id !== manifest.catalog_id ||
        artifact.run_unit_id !== page.run_unit_id || artifact.catalog_page_id !== page.catalog_page_id ||
        artifact.unit_key !== page.unit_key || artifact.input_sha256 !== page.input_sha256 ||
        artifact.output_sha256 !== page.output_sha256 || artifact.unit_status !== page.unit_status) {
      throw new Error("PAGE_ARTIFACT_IDENTITY_MISMATCH");
    }
  }
  function ensureCatalogPage_(catalogId, page, now) {
    var existing = SheetsRepository.getBy("Catalog_Pages", "Catalog_Page_ID", page.catalog_page_id);
    if (existing) {
      if (existing.Catalog_ID !== catalogId || Number(existing.Page_Number) !== page.page_number) {
        throw new Error("CATALOG_PAGE_ID_CONFLICT");
      }
      return;
    }
    SheetsRepository.append("Catalog_Pages", {
      Catalog_Page_ID: page.catalog_page_id, Catalog_ID: catalogId,
      Page_Number: page.page_number, Page_Label: String(page.page_number), Created_At: now
    });
  }
  function ensureRunUnit_(runId, page, manifest, now) {
    var existing = SheetsRepository.getBy("Run_Units", "Run_Unit_ID", page.run_unit_id);
    var record = {
      Run_Unit_ID: page.run_unit_id, Run_ID: runId, Unit_Type: "CATALOG_PAGE",
      Unit_Key: page.unit_key, Catalog_Page_ID: page.catalog_page_id,
      Unit_Status: page.unit_status, Input_SHA256: page.input_sha256,
      Output_Manifest_File_ID: page.artifact_file_id || "",
      Output_SHA256: page.output_sha256 || "",
      Reused_From_Run_Unit_ID: page.reused_from_run_unit_id || "",
      Attempt_Started_At: manifest.started_at ? new Date(manifest.started_at).toISOString() : now,
      Attempt_Finished_At: manifest.finished_at ? new Date(manifest.finished_at).toISOString() : now,
      Error_Code: "", Created_At: now
    };
    if (existing) {
      ["Run_ID", "Unit_Type", "Unit_Key", "Catalog_Page_ID", "Input_SHA256"].forEach(function (key) {
        if (String(existing[key]) !== String(record[key])) throw new Error("RUN_UNIT_ID_CONFLICT: " + key);
      });
      if (existing.Unit_Status !== record.Unit_Status || existing.Output_SHA256 !== record.Output_SHA256 ||
          existing.Output_Manifest_File_ID !== record.Output_Manifest_File_ID) {
        throw new Error("RUN_UNIT_REPLAY_CONFLICT");
      }
      return;
    }
    SheetsRepository.append("Run_Units", record);
  }
  function ingestManifest(options) {
    var runId = options.runId, manifestFileId = options.resultManifestFileId;
    if (!runId || !manifestFileId) throw new Error("INGEST_ARGUMENTS_INVALID");
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var run = SheetsRepository.getBy("Run_Log", "Run_ID", runId);
      if (!run) throw new Error("RUN_NOT_FOUND");
      if (["COMPLETED", "FAILED", "CANCELLED"].indexOf(run.Run_Status) >= 0) {
        if (run.Output_Manifest_File_ID === manifestFileId) return { run_id: runId, run_status: run.Run_Status, skipped: true };
        throw new Error("TERMINAL_RUN_RESULT_CONFLICT");
      }
      var manifestFile = DriveApp.getFileById(manifestFileId);
      var manifestText = manifestFile.getBlob().getDataAsString("UTF-8");
      var manifest;
      try { manifest = JSON.parse(manifestText); } catch (err) { throw new Error("MANIFEST_JSON_INVALID"); }
      var rawSha = sha256Bytes_(manifestFile.getBlob().getBytes());
      if (options.resultManifestSha256 && options.resultManifestSha256 !== rawSha) throw new Error("MANIFEST_FILE_SHA256_MISMATCH");
      verifyManifest_(manifest, run, rawSha);
      var now = new Date().toISOString();
      if (manifest.run_status === "FAILED") {
        SheetsRepository.updateBy("Run_Log", "Run_ID", runId, {
          Run_Status: "FAILED", Current_Step: "WORKER_FAILED",
          Total_Units: manifest.page_count, Completed_Units: 0,
          Failed_Units: Math.max(1, Number(manifest.failed_units) || manifest.page_count || 1),
          Worker_Version: options.workerVersion || manifest.worker_version || "",
          Output_Manifest_File_ID: manifestFileId, Finished_At: now,
          Error_Code: manifest.error_code || "WORKER_FAILED",
          Error_Summary: manifest.error_message || "Worker failed before completing page extraction."
        });
        return { run_id: runId, run_status: "FAILED", completed_units: 0, failed_units: manifest.failed_units || manifest.page_count };
      }
      manifest.pages.forEach(function (page) {
        verifyArtifact_(page, manifest);
        ensureCatalogPage_(run.Catalog_ID, page, now);
        ensureRunUnit_(runId, page, manifest, now);
      });
      SheetsRepository.updateBy("Run_Log", "Run_ID", runId, {
        Run_Status: "COMPLETED", Current_Step: "INGESTED",
        Total_Units: manifest.page_count, Completed_Units: manifest.completed_units,
        Failed_Units: manifest.failed_units, Worker_Version: options.workerVersion || manifest.worker_version || "",
        Output_Manifest_File_ID: manifestFileId,
        Started_At: manifest.started_at ? new Date(manifest.started_at).toISOString() : now,
        Finished_At: manifest.finished_at ? new Date(manifest.finished_at).toISOString() : now,
        Error_Code: "", Error_Summary: ""
      });
      return { run_id: runId, run_status: "COMPLETED", completed_units: manifest.completed_units,
        failed_units: manifest.failed_units, reused_units: manifest.reused_units || 0 };
    } finally {
      lock.releaseLock();
    }
  }
  return { ingestManifest: ingestManifest };
})();
