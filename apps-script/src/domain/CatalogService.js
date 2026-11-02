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
    var blob = file.getBlob(), bytes = blob.getBytes(), hash = sha256_(bytes);
    var existing = SheetsRepository.findBy("Catalogs", "SHA256", hash);
    if (existing) throw new Error("DUPLICATE_SOURCE_SHA256: existing row " + existing);

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      if (SheetsRepository.findBy("Catalogs", "SHA256", hash)) throw new Error("DUPLICATE_SOURCE_SHA256");
      var now = new Date().toISOString();
      var catalogId = id_("cat"), logicalJobId = id_("job"), runId = id_("run");
      SheetsRepository.append("Catalogs", {
        Catalog_ID: catalogId, Supplier_Name: String(payload.supplierName).trim(),
        Catalog_Title: payload.catalogTitle || "", Catalog_Reference: payload.catalogReference || "",
        Catalog_Revision: payload.catalogRevision || "", Language_Code: payload.languageCode || "",
        Source_File_ID: file.getId(), Source_File_Name: file.getName(), MIME_Type: mime,
        File_Size_Bytes: file.getSize(), SHA256: hash, Published_Date: payload.publishedDate || "",
        Received_At: now, Source_URL: payload.sourceUrl || "", Notes: payload.notes || "",
        Lifecycle_Status: "ACTIVE", Created_At: now, Created_By: APP.ACTOR_ID
      });
      SheetsRepository.append("Run_Log", {
        Run_ID: runId, Run_Type: "CATALOG_EXTRACTION", Catalog_ID: catalogId,
        Logical_Job_ID: logicalJobId, Parent_Run_ID: "", Attempt_Number: 1,
        Retry_Reason: "", Idempotency_Key: id_("idem"), Run_Status: "QUEUED",
        Current_Step: "REGISTERED", Total_Units: "", Completed_Units: 0, Failed_Units: 0,
        Created_At: now, Created_By: APP.ACTOR_ID
      });
      return { catalogId: catalogId, runId: runId, sha256: hash, fileName: file.getName(), status: "QUEUED" };
    } finally {
      lock.releaseLock();
    }
  }
  return { register: register };
})();
