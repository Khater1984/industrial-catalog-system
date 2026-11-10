/** Human review actions and immutable decision/Staging Set generation.
 * Product approval is explicit and limited to PRODUCT_MATCH tasks.
 * Variant/specification decisions are not inferred; the builder validates parent references if supplied later.
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
    if (s.length > limit) fail_("REVIEW_TEXT_TOO_LONG");
    return s;
  }
  function sha_(value) {
    var bytes = typeof value === "string" ? Utilities.newBlob(value, "application/json").getBytes() : value;
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes).map(function (b) {
      var n = b < 0 ? b + 256 : b, h = n.toString(16);
      return h.length === 1 ? "0" + h : h;
    }).join("");
  }
  function runFolder_(runId) {
    var rootId = (PropertiesService.getScriptProperties().getProperty("DEV_RUNS_FOLDER_ID") || "").trim();
    if (!rootId) fail_("CONFIG_MISSING_DEV_RUNS_FOLDER_ID");
    var folders = DriveApp.getFolderById(rootId).getFoldersByName(runId);
    if (!folders.hasNext()) fail_("REVIEW_RUN_FOLDER_NOT_FOUND");
    return folders.next();
  }
  function immutableJsonFile_(folder, name, payload) {
    var content = JSON.stringify(payload), files = folder.getFilesByName(name);
    if (files.hasNext()) {
      var existing = files.next();
      if (existing.getBlob().getDataAsString("UTF-8") !== content) fail_("REVIEW_DECISION_IMMUTABLE_CONFLICT");
      return { file: existing, content: content, sha256: sha_(content), reused: true };
    }
    var file = folder.createFile(name, content, MimeType.JSON);
    return { file: file, content: content, sha256: sha_(content), reused: false };
  }
  function updateStatus(options, actor) {
    if (!options || typeof options.reviewId !== "string" || !/^[A-Za-z0-9_-]{8,160}$/.test(options.reviewId)) fail_("REVIEW_ID_INVALID");
    var next = String(options.status || "");
    if (!ALLOWED[next]) fail_("REVIEW_STATUS_INVALID");
    var notes = text_(options.notes || "", 1500);
    if (!actor || String(actor).length > 120) fail_("REVIEW_ACTOR_MISSING");
    var lock = LockService.getScriptLock(); lock.waitLock(30000);
    try {
      var current = SheetsRepository.getBy("Review_Queue", "Review_Queue_ID", options.reviewId);
      if (!current) fail_("REVIEW_NOT_FOUND");
      var from = String(current.Review_Status || "");
      if (!TRANSITIONS[from] || !TRANSITIONS[from][next]) fail_("REVIEW_TRANSITION_NOT_ALLOWED");
      var now = new Date().toISOString(), patch = { Review_Status: next, Decision_Notes: notes };
      if (next === "IN_REVIEW") patch.Assigned_Actor_ID = String(actor);
      if (next === "REJECTED" || next === "DEFERRED") { patch.Reviewed_At = now; patch.Reviewed_By = String(actor); }
      if (next === "OPEN") { patch.Assigned_Actor_ID = ""; patch.Reviewed_At = ""; patch.Reviewed_By = ""; }
      SheetsRepository.updateBy("Review_Queue", "Review_Queue_ID", options.reviewId, patch);
      return { reviewId: options.reviewId, previousStatus: from, status: next };
    } finally { lock.releaseLock(); }
  }
  function approveProductReview(options, actor) {
    if (!options || typeof options.reviewId !== "string" || !/^[A-Za-z0-9_-]{8,160}$/.test(options.reviewId)) fail_("REVIEW_ID_INVALID");
    var productName = text_(options.productName, 300);
    if (!productName) fail_("REVIEW_PRODUCT_NAME_REQUIRED");
    if (/[\u0600-\u06FF]/.test(productName)) fail_("REVIEW_PRODUCT_NAME_MUST_BE_ENGLISH");
    var notes = text_(options.notes || "", 1500);
    if (!actor || String(actor).length > 120) fail_("REVIEW_ACTOR_MISSING");
    var lock = LockService.getScriptLock(); lock.waitLock(30000);
    try {
      var review = SheetsRepository.getBy("Review_Queue", "Review_Queue_ID", options.reviewId);
      if (!review) fail_("REVIEW_NOT_FOUND");
      if (review.Review_Type !== "PRODUCT_MATCH") fail_("REVIEW_PRODUCT_TASK_REQUIRED");
      if (review.Review_Status === "APPROVED") {
        var approvedFile = DriveApp.getFileById(review.Decision_JSON_File_ID);
        var approved = JSON.parse(approvedFile.getBlob().getDataAsString("UTF-8"));
        if (approved.products && approved.products[0] && approved.products[0].proposed_product_name === productName) {
          return { status: "APPROVED", decisionFileId: review.Decision_JSON_File_ID, decisionSha256: review.Decision_SHA256, reused: true };
        }
        fail_("REVIEW_DECISION_ALREADY_APPROVED");
      }
      if (["OPEN", "IN_REVIEW"].indexOf(review.Review_Status) < 0) fail_("REVIEW_TASK_NOT_ACTIONABLE");
      var links = SheetsRepository.listAll("Review_Staging_Links").filter(function (link) {
        return link.Review_Queue_ID === options.reviewId && link.Review_Role === "PRIMARY";
      });
      if (links.length !== 1) fail_("REVIEW_PRIMARY_STAGING_LINK_INVALID");
      var staging = SheetsRepository.getBy("Staging_Products", "Staging_ID", links[0].Staging_ID);
      if (!staging) fail_("REVIEW_STAGING_PRODUCT_NOT_FOUND");
      var payload = {
        schema_version: 1,
        run_id: staging.Run_ID,
        catalog_id: staging.Catalog_ID,
        source_key_algorithm_version: "source-key-v1",
        products: [{
          staging_id: staging.Staging_ID,
          catalog_page_id: staging.Catalog_Page_ID,
          proposed_product_name: productName,
          source_quote: text_(staging.Extracted_Text || "", 2000),
          review_status: "ACCEPTED",
          staging_record_hash: staging.Staging_Record_Hash
        }],
        variants: [],
        specifications: []
      };
      var saved = immutableJsonFile_(runFolder_(staging.Run_ID), "review-decision-" + options.reviewId + ".json", payload);
      var now = new Date().toISOString();
      SheetsRepository.updateBy("Review_Queue", "Review_Queue_ID", options.reviewId, {
        Review_Status: "APPROVED", Decision_JSON_File_ID: saved.file.getId(),
        Decision_SHA256: saved.sha256, Reviewed_Payload_Hash: saved.sha256,
        Decision_Notes: notes, Reviewed_At: now, Reviewed_By: String(actor)
      });
      return { status: "APPROVED", decisionFileId: saved.file.getId(), decisionSha256: saved.sha256, reused: saved.reused };
    } finally { lock.releaseLock(); }
  }
  function buildStagingSetForRun(runId, actor) {
    var id = text_(runId, 120);
    if (!id) fail_("REVIEW_RUN_ID_REQUIRED");
    if (!actor || String(actor).length > 120) fail_("REVIEW_ACTOR_MISSING");
    var lock = LockService.getScriptLock(); lock.waitLock(30000);
    try {
      var queue = SheetsRepository.listAll("Review_Queue");
      var products = [], variants = [], specifications = [], included = [], catalogId = "";
      queue.filter(function (q) { return q.Review_Status === "APPROVED" && q.Decision_JSON_File_ID; }).forEach(function (q) {
        var file = DriveApp.getFileById(q.Decision_JSON_File_ID);
        if (!file) fail_("REVIEW_DECISION_FILE_NOT_FOUND");
        var blob = file.getBlob(), bytes = blob.getBytes();
        if (sha_(bytes) !== q.Decision_SHA256) fail_("REVIEW_DECISION_SHA_MISMATCH");
        var decision;
        try { decision = JSON.parse(blob.getDataAsString("UTF-8")); } catch (e) { fail_("REVIEW_DECISION_INVALID_JSON"); }
        if (!decision || decision.run_id !== id) return;
        if (!catalogId) catalogId = decision.catalog_id;
        if (catalogId !== decision.catalog_id) fail_("REVIEW_DECISION_CATALOG_MISMATCH");
        if (!Array.isArray(decision.products) || !Array.isArray(decision.variants) || !Array.isArray(decision.specifications)) fail_("REVIEW_DECISION_STRUCTURE_INVALID");
        products = products.concat(decision.products);
        variants = variants.concat(decision.variants);
        specifications = specifications.concat(decision.specifications);
        included.push(q);
      });
      if (!included.length || !products.length) fail_("REVIEW_NO_APPROVED_PRODUCTS_FOR_RUN");
      function unique_(records, label) {
        var seen = {};
        records.forEach(function (record) {
          if (!record || !record.staging_id || seen[record.staging_id]) fail_("REVIEW_DUPLICATE_OR_INVALID_" + label);
          seen[record.staging_id] = true;
        });
        return seen;
      }
      var productIds = unique_(products, "PRODUCT");
      var variantIds = unique_(variants, "VARIANT");
      variants.forEach(function (v) { if (!productIds[v.parent_staging_product_id]) fail_("REVIEW_VARIANT_PARENT_MISSING"); });
      specifications.forEach(function (s) {
        if (!productIds[s.parent_staging_product_id] || !variantIds[s.parent_staging_variant_id]) fail_("REVIEW_SPECIFICATION_PARENT_MISSING");
      });
      var stagingSet = {
        run_id: id, catalog_id: catalogId, source_key_algorithm_version: "source-key-v1",
        products: products, variants: variants, specifications: specifications
      };
      var content = JSON.stringify(stagingSet), digest = sha_(content);
      var saved = immutableJsonFile_(runFolder_(id), "staging-set-" + digest.slice(0, 16) + ".json", stagingSet);
      included.forEach(function (q) {
        SheetsRepository.updateBy("Review_Queue", "Review_Queue_ID", q.Review_Queue_ID, {
          Staging_Set_Manifest_File_ID: saved.file.getId(), Staging_Set_SHA256: digest
        });
      });
      return { status: "READY_FOR_PROMOTION", runId: id, catalogId: catalogId,
        products: products.length, variants: variants.length, specifications: specifications.length,
        stagingSetFileId: saved.file.getId(), stagingSetSha256: digest, reused: saved.reused };
    } finally { lock.releaseLock(); }
  }
  return {
    updateStatus: updateStatus,
    approveProductReview: approveProductReview,
    buildStagingSetForRun: buildStagingSetForRun
  };
})();
