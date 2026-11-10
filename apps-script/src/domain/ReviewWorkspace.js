/** Read-only review workspace and controlled queue-state updates.
 * This module never approves staging records or promotes canonical data.
 */
var ReviewWorkspace = (function () {
  var ALLOWED = { OPEN: true, IN_REVIEW: true, DEFERRED: true, REJECTED: true };
  var TRANSITIONS = {
    OPEN: { IN_REVIEW: true, DEFERRED: true, REJECTED: true },
    IN_REVIEW: { OPEN: true, DEFERRED: true, REJECTED: true },
    DEFERRED: { OPEN: true, IN_REVIEW: true, REJECTED: true },
    REJECTED: {}
  };
  function fail_(code) { throw new Error(code); }
  function text_(value, limit) {
    var s = value === null || value === undefined ? "" : String(value);
    return s.length > limit ? s.slice(0, limit) : s;
  }
  function fileUrl_(id) {
    if (!id || !/^[A-Za-z0-9_-]{10,200}$/.test(String(id))) return "";
    try { return DriveApp.getFileById(String(id)).getUrl(); } catch (e) { return ""; }
  }
  function readArtifact_(fileId, cache) {
    if (!fileId) return null;
    if (Object.prototype.hasOwnProperty.call(cache, fileId)) return cache[fileId];
    try {
      var raw = DriveApp.getFileById(fileId).getBlob().getDataAsString("UTF-8");
      var a = JSON.parse(raw);
      cache[fileId] = {
        pageNumber: a.page_number || null,
        pageText: text_(a.extracted_text || "", 4000),
        extractionMethod: text_(a.extraction_method || "", 40),
        products: Array.isArray(a.product_candidates && a.product_candidates.products) ? a.product_candidates.products.slice(0, 30) : [],
        variants: Array.isArray(a.product_candidates && a.product_candidates.variants) ? a.product_candidates.variants.slice(0, 60) : [],
        specifications: Array.isArray(a.product_candidates && a.product_candidates.specifications) ? a.product_candidates.specifications.slice(0, 100) : [],
        fileUrl: fileUrl_(fileId)
      };
    } catch (e) {
      cache[fileId] = { warning: "PAGE_ARTIFACT_UNAVAILABLE", fileUrl: fileUrl_(fileId) };
    }
    return cache[fileId];
  }
  function stagingRecord_(id, tables) {
    var names = ["Staging_Products", "Staging_Variants", "Staging_Specifications", "Staging_Images", "Staging_Documents"];
    for (var i = 0; i < names.length; i++) {
      var record = (tables[names[i]] || []).find(function (r) { return r.Staging_ID === id; });
      if (record) return { type: names[i], record: record };
    }
    return null;
  }
  function getInbox() {
    var queue = SheetsRepository.listAll("Review_Queue");
    var links = SheetsRepository.listAll("Review_Staging_Links");
    var tables = {
      Staging_Products: SheetsRepository.listAll("Staging_Products"),
      Staging_Variants: SheetsRepository.listAll("Staging_Variants"),
      Staging_Specifications: SheetsRepository.listAll("Staging_Specifications"),
      Staging_Images: SheetsRepository.listAll("Staging_Images"),
      Staging_Documents: SheetsRepository.listAll("Staging_Documents")
    };
    var artifactCache = {};
    var catalogs = {};
    SheetsRepository.listAll("Catalogs").forEach(function (row) { catalogs[row.Catalog_ID] = row; });
    var pages = {};
    SheetsRepository.listAll("Catalog_Pages").forEach(function (row) { pages[row.Catalog_Page_ID] = row; });
    var runUnits = SheetsRepository.listAll("Run_Units");
    var items = queue.filter(function (q) { return ALLOWED[q.Review_Status] === true; }).slice(0, 100).map(function (q) {
      var related = links.filter(function (l) { return l.Review_Queue_ID === q.Review_Queue_ID; }).map(function (link) {
        var found = stagingRecord_(link.Staging_ID, tables);
        if (!found) return { stagingId: link.Staging_ID, role: link.Review_Role, missing: true };
        var r = found.record;
        var artifact = readArtifact_(r.Raw_Extract_File_ID, artifactCache);
        return {
          stagingId: r.Staging_ID, role: link.Review_Role, table: found.type,
          status: r.Proposed_Status || r.Quality_Status || "",
          productName: text_(r.Proposed_Product_Name_EN || "", 300),
          modelNumber: text_(r.Proposed_Model_Number || "", 160),
          modelName: text_(r.Proposed_Model_Name || "", 250),
          attribute: text_(r.Attribute_Key_Raw || "", 160),
          value: text_(r.Value_Raw || "", 2000),
          unit: text_(r.Unit_Raw || "", 80),
          quote: text_(r.Extracted_Text || "", 4000),
          pageId: text_(r.Catalog_Page_ID || "", 120),
          runId: text_(r.Run_ID || "", 120),
          catalogId: text_(r.Catalog_ID || "", 120),
          confidence: r.Confidence || "",
          fileUrl: fileUrl_(r.Proposed_Image_File_ID || r.Proposed_Document_File_ID || ""),
          artifact: artifact
        };
      });
      var actionMatch = String(q.Proposed_Action || "").match(/page ([^ ]+) in run ([^ .]+)/i);
      var runId = (related[0] && related[0].runId) || (actionMatch && actionMatch[2]) || "";
      var pageId = (related[0] && related[0].pageId) || (actionMatch && actionMatch[1]) || "";
      var runUnit = runUnits.find(function (unit) { return unit.Run_ID === runId && unit.Catalog_Page_ID === pageId; });
      var pageArtifact = null;
      if (runUnit && runUnit.Output_Manifest_File_ID && !related.some(function (link) { return link.artifact; })) {
        pageArtifact = readArtifact_(runUnit.Output_Manifest_File_ID, artifactCache);
      }
      var catalogId = (related[0] && related[0].catalogId) || "";
      if (!catalogId && runId) {
        var run = SheetsRepository.getBy("Run_Log", "Run_ID", runId);
        catalogId = run && run.Catalog_ID || "";
      }
      var catalog = catalogs[catalogId] || {};
      var page = pages[pageId] || {};
      return {
        id: q.Review_Queue_ID, type: q.Review_Type, priority: q.Priority,
        status: q.Review_Status, action: text_(q.Proposed_Action || "", 500),
        notes: text_(q.Decision_Notes || "", 1500), createdAt: q.Created_At || "",
        runId: runId, catalogId: catalogId, pageId: pageId,
        pageNumber: page.Page_Number || (pageArtifact && pageArtifact.pageNumber) || "",
        pageLabel: page.Page_Label || "",
        supplierName: text_(catalog.Supplier_Name || "", 160),
        catalogTitle: text_(catalog.Catalog_Title || catalog.Source_File_Name || "", 240),
        sourcePdfUrl: fileUrl_(catalog.Source_File_ID || ""),
        pageArtifact: pageArtifact,
        links: related
      };
    });
    return {
      items: items,
      counts: {
        open: items.filter(function (x) { return x.status === "OPEN"; }).length,
        inReview: items.filter(function (x) { return x.status === "IN_REVIEW"; }).length,
        deferred: items.filter(function (x) { return x.status === "DEFERRED"; }).length,
        rejected: items.filter(function (x) { return x.status === "REJECTED"; }).length
      }
    };
  }
  function updateStatus(options, actor) {
    if (!options || typeof options.reviewId !== "string" || !/^[A-Za-z0-9_-]{8,160}$/.test(options.reviewId)) fail_("REVIEW_ID_INVALID");
    var next = String(options.status || "");
    if (!ALLOWED[next]) fail_("REVIEW_STATUS_INVALID");
    var notes = text_(options.notes || "", 1500);
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var current = SheetsRepository.getBy("Review_Queue", "Review_Queue_ID", options.reviewId);
      if (!current) fail_("REVIEW_NOT_FOUND");
      var from = String(current.Review_Status || "");
      if (!TRANSITIONS[from] || !TRANSITIONS[from][next]) fail_("REVIEW_TRANSITION_NOT_ALLOWED");
      var now = new Date().toISOString();
      var patch = { Review_Status: next, Decision_Notes: notes };
      if (next === "IN_REVIEW") patch.Assigned_Actor_ID = actor;
      if (next === "REJECTED" || next === "DEFERRED") {
        patch.Reviewed_At = now;
        patch.Reviewed_By = actor;
      }
      if (next === "OPEN") {
        patch.Assigned_Actor_ID = "";
        patch.Reviewed_At = "";
        patch.Reviewed_By = "";
      }
      SheetsRepository.updateBy("Review_Queue", "Review_Queue_ID", options.reviewId, patch);
      return { reviewId: options.reviewId, previousStatus: from, status: next };
    } finally {
      lock.releaseLock();
    }
  }
  return { getInbox: getInbox, updateStatus: updateStatus };
})();
