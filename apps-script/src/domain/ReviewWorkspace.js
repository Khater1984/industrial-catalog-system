/** Controlled review-queue workflow actions.
 * Status updates are operational only: they never approve staging data or promote canonical records.
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
    var s = value === null || value === undefined ? "" : String(value).trim();
    if (s.length > limit) fail_("REVIEW_NOTES_TOO_LONG");
    return s;
  }
  function clip_(value, limit) {
    var s = value === null || value === undefined ? "" : String(value);
    return s.length > limit ? s.slice(0, limit) + "…" : s;
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
  function getInbox() {
    var queue = SheetsRepository.listAll("Review_Queue");
    var links = SheetsRepository.listAll("Review_Staging_Links");
    var tableNames = ["Staging_Products", "Staging_Variants", "Staging_Specifications", "Staging_Images", "Staging_Documents"];
    var tables = {};
    tableNames.forEach(function (name) { tables[name] = SheetsRepository.listAll(name); });
    var catalogs = {};
    SheetsRepository.listAll("Catalogs").forEach(function (row) { catalogs[row.Catalog_ID] = row; });
    var pages = {};
    SheetsRepository.listAll("Catalog_Pages").forEach(function (row) { pages[row.Catalog_Page_ID] = row; });
    var runUnits = SheetsRepository.listAll("Run_Units");
    var artifactCache = {};
    var items = queue.filter(function (q) { return ALLOWED[q.Review_Status] === true; }).slice(0, 100).map(function (q) {
      var related = links.filter(function (link) { return link.Review_Queue_ID === q.Review_Queue_ID; }).map(function (link) {
        var found = null;
        for (var i = 0; i < tableNames.length; i++) {
          var rows = tables[tableNames[i]];
          var record = rows.find(function (row) { return row.Staging_ID === link.Staging_ID; });
          if (record) { found = { type: tableNames[i], record: record }; break; }
        }
        if (!found) return { stagingId: link.Staging_ID, role: link.Review_Role, missing: true };
        var r = found.record;
        return {
          stagingId: r.Staging_ID, role: link.Review_Role, table: found.type,
          status: r.Proposed_Status || r.Quality_Status || "",
          productName: clip_(r.Proposed_Product_Name_EN || "", 300),
          productReference: clip_(r.Proposed_Product_Reference || "", 160),
          modelNumber: clip_(r.Proposed_Model_Number || "", 160),
          modelName: clip_(r.Proposed_Model_Name || "", 250),
          attribute: clip_(r.Attribute_Key_Raw || "", 160),
          value: clip_(r.Value_Raw || "", 2000),
          unit: clip_(r.Unit_Raw || "", 80),
          quote: clip_(r.Extracted_Text || "", 4000),
          pageId: clip_(r.Catalog_Page_ID || "", 120),
          runId: clip_(r.Run_ID || "", 120),
          catalogId: clip_(r.Catalog_ID || "", 120),
          confidence: r.Confidence || "",
          extractionMethod: clip_(r.Extraction_Method || "", 40),
          fileUrl: fileUrl_(r.Proposed_Image_File_ID || r.Proposed_Document_File_ID || ""),
          artifact: readArtifact_(r.Raw_Extract_File_ID, artifactCache)
        };
      });
      var match = String(q.Proposed_Action || "").match(/page ([^ ]+) in run ([^ .]+)/i);
      var runId = (related[0] && related[0].runId) || (match && match[2]) || "";
      var pageId = (related[0] && related[0].pageId) || (match && match[1]) || "";
      var unit = runUnits.find(function (row) { return row.Run_ID === runId && row.Catalog_Page_ID === pageId; });
      var pageArtifact = null;
      if (unit && unit.Output_Manifest_File_ID && !related.some(function (link) { return link.artifact; })) {
        pageArtifact = readArtifact_(unit.Output_Manifest_File_ID, artifactCache);
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
        status: q.Review_Status, action: clip_(q.Proposed_Action || "", 500),
        notes: clip_(q.Decision_Notes || "", 1500), createdAt: q.Created_At || "",
        runId: runId, catalogId: catalogId, pageId: pageId,
        pageNumber: page.Page_Number || (pageArtifact && pageArtifact.pageNumber) || "",
        pageLabel: page.Page_Label || "",
        supplierName: clip_(catalog.Supplier_Name || "", 160),
        catalogTitle: clip_(catalog.Catalog_Title || catalog.Source_File_Name || "", 240),
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
    if (!options || typeof options.reviewId !== "string" ||
        !/^[A-Za-z0-9_-]{8,160}$/.test(options.reviewId)) fail_("REVIEW_ID_INVALID");
    var next = String(options.status || "");
    if (!ALLOWED[next]) fail_("REVIEW_STATUS_INVALID");
    var notes = text_(options.notes || "", 1500);
    var reviewer = text_(actor || "", 120);
    if (!reviewer) fail_("REVIEW_ACTOR_MISSING");
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var current = SheetsRepository.getBy("Review_Queue", "Review_Queue_ID", options.reviewId);
      if (!current) fail_("REVIEW_NOT_FOUND");
      var from = String(current.Review_Status || "");
      if (!TRANSITIONS[from] || !TRANSITIONS[from][next]) fail_("REVIEW_TRANSITION_NOT_ALLOWED");
      var now = new Date().toISOString();
      var patch = { Review_Status: next, Decision_Notes: notes };
      if (next === "IN_REVIEW") patch.Assigned_Actor_ID = reviewer;
      if (next === "REJECTED" || next === "DEFERRED") {
        patch.Reviewed_At = now;
        patch.Reviewed_By = reviewer;
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
