/** Conservative intake of worker product candidates into human review.
 *
 * Product candidates are staged as NEEDS_REVIEW. Model/spec candidates remain
 * attached to their immutable page artifact until a human establishes parent
 * relationships; this module never guesses product/model ownership or promotes
 * records into canonical tables.
 */
var CandidateReviewIntake = (function () {
  var SHA_RE = /^[a-f0-9]{64}$/;
  function fail_(code) { throw new Error(code); }
  function require_(condition, code) { if (!condition) fail_(code); }
  function now_() { return new Date().toISOString(); }
  function canonical_(value) {
    if (value === null || typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number") { if (!isFinite(value)) fail_("CANDIDATE_NONFINITE_NUMBER"); return value; }
    if (Array.isArray(value)) return value.map(canonical_);
    if (value && Object.prototype.toString.call(value) === "[object Object]") {
      var out = {};
      Object.keys(value).sort().forEach(function (key) { out[key] = canonical_(value[key]); });
      return out;
    }
    fail_("CANDIDATE_VALUE_UNSUPPORTED");
  }
  function canonicalJson_(value) { return JSON.stringify(canonical_(value)); }
  function sha_(value) {
    var bytes = typeof value === "string" ? Utilities.newBlob(value, "application/json").getBytes() : value;
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes).map(function (b) {
      var n = b < 0 ? b + 256 : b, hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }
  function stableId_(prefix, seed) { return prefix + "_" + sha_(String(seed)).slice(0, 24); }
  function text_(value, limit) {
    var result = typeof value === "string" ? value.trim() : "";
    return result.length > limit ? result.slice(0, limit) : result;
  }
  function confidence_(value) {
    var map = { HIGH: 0.95, MEDIUM: 0.7, LOW: 0.4 };
    return Object.prototype.hasOwnProperty.call(map, String(value || "").toUpperCase())
      ? map[String(value).toUpperCase()] : "";
  }
  function ensure_(table, idColumn, record, compareFields, conflictCode) {
    var existing = SheetsRepository.getBy(table, idColumn, record[idColumn]);
    if (existing) {
      compareFields.forEach(function (field) {
        var a = existing[field], b = record[field];
        if (String(a === undefined || a === null ? "" : a) !== String(b === undefined || b === null ? "" : b)) {
          fail_(conflictCode);
        }
      });
      return false;
    }
    SheetsRepository.append(table, record);
    return true;
  }
  function createProduct_(candidate, page, artifact, manifest, actor, index, counts) {
    var name = text_(candidate.proposed_product_name, 300);
    require_(name, "CANDIDATE_PRODUCT_NAME_MISSING");
    var quote = text_(candidate.source_quote, 4000);
    var sourceSeed = manifest.run_id + "|" + page.catalog_page_id + "|" + index + "|" + name + "|" + quote;
    var sourceKey = "candidate-v1|" + sha_(sourceSeed).slice(0, 48);
    var stagingId = stableId_("stgprd", sourceKey);
    var createdAt = now_();
    var method = String(artifact.extraction_method || "").toUpperCase();
    require_(["EMBEDDED_TEXT", "OCR", "TABLE_PARSER", "MANUAL"].indexOf(method) >= 0, "CANDIDATE_EXTRACTION_METHOD_INVALID");
    var stablePayload = {
      Staging_ID: stagingId, Run_ID: manifest.run_id, Catalog_ID: manifest.catalog_id,
      Catalog_Page_ID: page.catalog_page_id, Raw_Extract_File_ID: page.artifact_file_id,
      Extracted_Text: quote, Extraction_Method: method,
      Extraction_Tool_Version: text_(artifact.extraction_tool_version, 120),
      Source_Key_Algorithm_Version: "candidate-intake-v1",
      Confidence: confidence_(candidate.confidence), Proposed_Status: "NEEDS_REVIEW",
      Proposed_Product_Name_EN: name, Identity_Match_Method: "UNRESOLVED",
      Source_Record_Key: sourceKey
    };
    var record = Object.assign({}, stablePayload, {
      Staging_Record_Hash: sha_(canonicalJson_(stablePayload)),
      Created_At: createdAt, Updated_At: createdAt
    });
    if (ensure_("Staging_Products", "Staging_ID", record,
      ["Run_ID", "Catalog_ID", "Catalog_Page_ID", "Raw_Extract_File_ID", "Extracted_Text",
       "Extraction_Method", "Source_Key_Algorithm_Version", "Proposed_Product_Name_EN", "Source_Record_Key"],
      "STAGING_PRODUCT_CONFLICT")) counts.staging_products += 1;
    var reviewId = stableId_("revprd", stagingId);
    var review = {
      Review_Queue_ID: reviewId, Review_Type: "PRODUCT_MATCH", Priority: "NORMAL",
      Review_Status: "OPEN",
      Proposed_Action: "Verify this extracted product name against the source page before any promotion.",
      Decision_JSON_File_ID: page.artifact_file_id, Created_At: createdAt, Created_By: actor
    };
    if (ensure_("Review_Queue", "Review_Queue_ID", review,
      ["Review_Type", "Priority", "Proposed_Action", "Decision_JSON_File_ID", "Created_By"],
      "CANDIDATE_REVIEW_CONFLICT")) counts.review_items += 1;
    var link = {
      Review_Staging_Link_ID: stableId_("rsl", reviewId + "|" + stagingId),
      Review_Queue_ID: reviewId, Staging_ID: stagingId, Review_Role: "PRIMARY",
      Created_At: createdAt, Created_By: actor
    };
    if (ensure_("Review_Staging_Links", "Review_Staging_Link_ID", link,
      ["Review_Queue_ID", "Staging_ID", "Review_Role", "Created_By"],
      "CANDIDATE_REVIEW_LINK_CONFLICT")) counts.review_links += 1;
  }
  function createAmbiguityReview_(page, artifact, manifest, actor, counts) {
    var candidates = artifact.product_candidates || {};
    var variants = Array.isArray(candidates.variants) ? candidates.variants : [];
    var specs = Array.isArray(candidates.specifications) ? candidates.specifications : [];
    if (!variants.length && !specs.length) return;
    var reviewId = stableId_("revamb", manifest.run_id + "|" + page.catalog_page_id);
    var createdAt = now_();
    var review = {
      Review_Queue_ID: reviewId, Review_Type: "EXTRACTION_AMBIGUITY", Priority: "NORMAL",
      Review_Status: "OPEN",
      Proposed_Action: "Resolve the parent product/model for extracted model and specification candidates. The source-page artifact contains the unassigned candidates; no parent relationship was inferred.",
      Decision_JSON_File_ID: page.artifact_file_id, Created_At: createdAt, Created_By: actor
    };
    if (ensure_("Review_Queue", "Review_Queue_ID", review,
      ["Review_Type", "Priority", "Proposed_Action", "Decision_JSON_File_ID", "Created_By"],
      "CANDIDATE_AMBIGUITY_REVIEW_CONFLICT")) counts.review_items += 1;
  }
  function intakeRun(options) {
    require_(options && typeof options.runId === "string" && typeof options.resultManifestFileId === "string",
      "CANDIDATE_INTAKE_ARGUMENTS_INVALID");
    var run = SheetsRepository.getBy("Run_Log", "Run_ID", options.runId);
    require_(run && run.Run_Status === "COMPLETED", "CANDIDATE_RUN_NOT_COMPLETED");
    require_(run.Output_Manifest_File_ID === options.resultManifestFileId, "CANDIDATE_MANIFEST_NOT_INGESTED");
    var manifestFile = DriveApp.getFileById(options.resultManifestFileId);
    var manifestBlob = manifestFile.getBlob();
    var manifest;
    try { manifest = JSON.parse(manifestBlob.getDataAsString("UTF-8")); } catch (e) { fail_("CANDIDATE_MANIFEST_INVALID_JSON"); }
    require_(manifest && manifest.run_id === run.Run_ID && manifest.catalog_id === run.Catalog_ID &&
      manifest.run_status === "COMPLETED" && Array.isArray(manifest.pages), "CANDIDATE_MANIFEST_IDENTITY_INVALID");
    var actor = APP.ACTOR_ID;
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var counts = { pages: 0, staging_products: 0, review_items: 0, review_links: 0, variants_unassigned: 0, specifications_unassigned: 0 };
      manifest.pages.forEach(function (page) {
        var file = DriveApp.getFileById(page.artifact_file_id);
        var blob = file.getBlob(), bytes = blob.getBytes();
        require_(sha_(bytes) === page.artifact_file_sha256, "CANDIDATE_ARTIFACT_FILE_SHA_MISMATCH");
        var artifact;
        try { artifact = JSON.parse(blob.getDataAsString("UTF-8")); } catch (e) { fail_("CANDIDATE_ARTIFACT_INVALID_JSON"); }
        require_(artifact && artifact.run_id === manifest.run_id && artifact.catalog_id === manifest.catalog_id &&
          artifact.catalog_page_id === page.catalog_page_id && artifact.page_number === page.page_number &&
          artifact.output_sha256 === page.output_sha256, "CANDIDATE_ARTIFACT_IDENTITY_INVALID");
        var artifactCopy = {};
        Object.keys(artifact).forEach(function (key) { if (key !== "output_sha256") artifactCopy[key] = artifact[key]; });
        require_(sha_(canonicalJson_(artifactCopy)) === artifact.output_sha256, "CANDIDATE_ARTIFACT_CHECKSUM_INVALID");
        var candidateSet = artifact.product_candidates || {};
        var products = Array.isArray(candidateSet.products) ? candidateSet.products : [];
        var variants = Array.isArray(candidateSet.variants) ? candidateSet.variants : [];
        var specs = Array.isArray(candidateSet.specifications) ? candidateSet.specifications : [];
        products.forEach(function (candidate, index) {
          createProduct_(candidate, page, artifact, manifest, actor, index, counts);
        });
        createAmbiguityReview_(page, artifact, manifest, actor, counts);
        counts.pages += 1;
        counts.variants_unassigned += variants.length;
        counts.specifications_unassigned += specs.length;
      });
      return { status: "COMPLETED", run_id: manifest.run_id, catalog_id: manifest.catalog_id, counts: counts,
        note: "Product candidates were staged for human review. Model/specification candidates remain in their verified page artifacts until a reviewer establishes parent relationships." };
    } finally {
      lock.releaseLock();
    }
  }
  return { intakeRun: intakeRun };
})();
