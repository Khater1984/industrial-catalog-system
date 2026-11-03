var CatalogService = (function () {
  function id_(prefix) {
    return prefix + "_" + Utilities.getUuid().replace(/-/g, "");
  }
  function sha256_(bytes) {
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes);
    return digest.map(function (b) {
      var v = (b < 0 ? b + 256 : b).toString(16);
      return v.length === 1 ? "0" + v : v;
    }).join("");
  }
  function resultFor_(catalog, run) {
    return {
      catalogId: catalog.Catalog_ID,
      runId: run.Run_ID,
      sha256: catalog.SHA256,
      fileName: catalog.Source_File_Name,
      status: run.Run_Status,
      idempotentReplay: true
    };
  }
  function sameRegistration_(catalog, payload, file, mime) {
    var expected = {
      Supplier_Name: String(payload.supplierName).trim(),
      Catalog_Title: payload.catalogTitle || "",
      Catalog_Reference: payload.catalogReference || "",
      Catalog_Revision: payload.catalogRevision || "",
      Language_Code: payload.languageCode || "",
      Published_Date: payload.publishedDate || "",
      Source_URL: payload.sourceUrl || "",
      Notes: payload.notes || "",
      Source_File_ID: file.getId(),
      Source_File_Name: file.getName(),
      MIME_Type: mime,
      File_Size_Bytes: file.getSize()
    };
    return Object.keys(expected).every(function (key) {
      return String(catalog[key] === undefined || catalog[key] === null ? "" : catalog[key]) === String(expected[key]);
    });
  }
  function createRun_(catalogId, sourceHash, now) {
    var runId = id_("run");
    var logicalJobId = id_("job");
    SheetsRepository.append("Run_Log", {
      Run_ID: runId, Run_Type: "CATALOG_EXTRACTION", Catalog_ID: catalogId,
      Logical_Job_ID: logicalJobId, Parent_Run_ID: "", Attempt_Number: 1,
      Retry_Reason: "", Idempotency_Key: "catalog_sha256_" + sourceHash, Run_Status: "QUEUED",
      Current_Step: "REGISTERED", Total_Units: "", Completed_Units: 0, Failed_Units: 0,
      Created_At: now, Created_By: APP.ACTOR_ID
    });
    return SheetsRepository.getBy("Run_Log", "Run_ID", runId);
  }
  function register(payload) {
    var required = ["driveFileId", "supplierName"];
    required.forEach(function (key) {
      if (!payload[key] || !String(payload[key]).trim()) throw new Error("VALIDATION_REQUIRED: " + key);
    });
    var props = PropertiesService.getScriptProperties();
    var folderId = props.getProperty("DEV_CATALOG_FOLDER_ID");
    if (!folderId) throw new Error("CONFIG_MISSING: DEV_CATALOG_FOLDER_ID");

    var file = DriveApp.getFileById(String(payload.driveFileId));
    var parents = file.getParents(), allowed = false;
    while (parents.hasNext()) if (parents.next().getId() === folderId) allowed = true;
    if (!allowed) throw new Error("FILE_OUTSIDE_DEV_INTAKE_FOLDER");
    var mime = file.getMimeType();
    if (mime !== "application/pdf") throw new Error("UNSUPPORTED_MIME_TYPE");
    var hash = sha256_(file.getBlob().getBytes());

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var existingCatalog = SheetsRepository.getBy("Catalogs", "SHA256", hash);
      if (existingCatalog) {
        if (!sameRegistration_(existingCatalog, payload, file, mime)) {
          throw new Error("DUPLICATE_SOURCE_SHA256_REQUIRES_REVIEW");
        }
        var existingRun = SheetsRepository.getBy("Run_Log", "Catalog_ID", existingCatalog.Catalog_ID);
        // A crash after the Catalogs append but before Run_Log append is repaired on retry.
        if (!existingRun) existingRun = createRun_(existingCatalog.Catalog_ID, hash, new Date().toISOString());
        return resultFor_(existingCatalog, existingRun);
      }

      var now = new Date().toISOString();
      var catalogId = id_("cat");
      SheetsRepository.append("Catalogs", {
        Catalog_ID: catalogId, Supplier_Name: String(payload.supplierName).trim(),
        Catalog_Title: payload.catalogTitle || "", Catalog_Reference: payload.catalogReference || "",
        Catalog_Revision: payload.catalogRevision || "", Language_Code: payload.languageCode || "",
        Source_File_ID: file.getId(), Source_File_Name: file.getName(), MIME_Type: mime,
        File_Size_Bytes: file.getSize(), SHA256: hash, Published_Date: payload.publishedDate || "",
        Received_At: now, Source_URL: payload.sourceUrl || "", Notes: payload.notes || "",
        Lifecycle_Status: "ACTIVE", Created_At: now, Created_By: APP.ACTOR_ID
      });
      // If this second append fails, a retry finds the catalog by SHA256 and repairs Run_Log.
      var run = createRun_(catalogId, hash, now);
      return {
        catalogId: catalogId, runId: run.Run_ID, sha256: hash,
        fileName: file.getName(), status: run.Run_Status, idempotentReplay: false
      };
    } finally {
      lock.releaseLock();
    }
  }
  return { register: register };
})();
