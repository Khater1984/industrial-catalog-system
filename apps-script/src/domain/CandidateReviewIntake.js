/** Conservative intake of worker product, model, and specification candidates.
 *
 * All candidates are staged as NEEDS_REVIEW. Model/product and specification
 * parent links remain blank until a reviewer explicitly assigns them; this
 * module never guesses ownership, scope, or canonical identity and never
 * promotes records into canonical tables.
 */
var CandidateReviewIntake = (function () {
  var SHA_RE = /^[a-f0-9]{64}$/;
  function fail_(code) { throw new Error(code); }
  function require_(condition, code) { if (!condition) fail_(code); }
  function now_() { return new Date().toISOString(); }
  function canonical_(value) {
    if (value === null || typeof value === "boolean") return value;
    if (typeof value === "string") return value.normalize ? value.normalize("NFC") : value;
    if (typeof value === "number") { if (!isFinite(value)) fail_("CANDIDATE_NONFINITE_NUMBER"); return value; }
    if (Array.isArray(value)) return value.map(canonical_);
    if (value && Object.prototype.toString.call(value) === "[object Object]") {
      var out = {};
      var keys = Object.keys(value).map(function (key) {
        return { original: key, normalized: key.normalize ? key.normalize("NFC") : key };
      });
      keys.sort(function (a, b) { return a.normalized < b.normalized ? -1 : (a.normalized > b.normalized ? 1 : 0); });
      keys.forEach(function (entry) {
        if (Object.prototype.hasOwnProperty.call(out, entry.normalized)) fail_("CANDIDATE_CANONICAL_KEY_COLLISION");
        out[entry.normalized] = canonical_(value[entry.original]);
      });
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
    if (result.normalize) result = result.normalize("NFC");
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
    // The destination column is explicitly English; never put Arabic/mixed text in it.
    if (/[\u0600-\u06FF]/.test(name)) { counts.product_names_unassigned += 1; return null; }
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
      Created_At: createdAt, Created_By: actor
    };
    if (ensure_("Review_Queue", "Review_Queue_ID", review,
      ["Review_Type", "Priority", "Proposed_Action", "Created_By"],
      "CANDIDATE_REVIEW_CONFLICT")) counts.review_items += 1;
    var link = {
      Review_Staging_Link_ID: stableId_("rsl", reviewId + "|" + stagingId),
      Review_Queue_ID: reviewId, Staging_ID: stagingId, Review_Role: "PRIMARY",
      Created_At: createdAt, Created_By: actor
    };
    if (ensure_("Review_Staging_Links", "Review_Staging_Link_ID", link,
      ["Review_Queue_ID", "Staging_ID", "Review_Role", "Created_By"],
      "CANDIDATE_REVIEW_LINK_CONFLICT")) counts.review_links += 1;
    return stagingId;
  }
  function createVariant_(candidate, page, artifact, manifest, actor, index, counts) {
    var modelNumber = text_(candidate.proposed_model_number, 160);
    if (!modelNumber) { counts.variants_not_stageable += 1; return null; }
    var modelName = text_(candidate.proposed_model_name, 250);
    var quote = text_(candidate.source_quote, 4000);
    var sourceSeed = manifest.run_id + "|" + page.catalog_page_id + "|VARIANT|" + index + "|" + modelNumber + "|" + modelName + "|" + quote;
    var sourceKey = "candidate-v1|" + sha_(sourceSeed).slice(0, 48);
    var stagingId = stableId_("stgvar", sourceKey);
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
      Parent_Staging_Product_ID: "",
      Proposed_Model_Number: modelNumber, Proposed_Model_Name: modelName,
      Identity_Match_Method: "UNRESOLVED", Source_Record_Key: sourceKey
    };
    var record = Object.assign({}, stablePayload, {
      Staging_Record_Hash: sha_(canonicalJson_(stablePayload)),
      Created_At: createdAt, Updated_At: createdAt
    });
    if (ensure_("Staging_Variants", "Staging_ID", record,
      ["Run_ID", "Catalog_ID", "Catalog_Page_ID", "Raw_Extract_File_ID", "Extracted_Text",
       "Extraction_Method", "Source_Key_Algorithm_Version", "Proposed_Model_Number", "Proposed_Model_Name", "Source_Record_Key"],
      "STAGING_VARIANT_CONFLICT")) counts.staging_variants += 1;
    return stagingId;
  }
  function createSpecification_(candidate, page, artifact, manifest, actor, index, counts) {
    var key = text_(candidate.attribute_key_raw, 160);
    var value = candidate.value_raw === undefined || candidate.value_raw === null ? "" : String(candidate.value_raw).trim();
    if (!key || !value) { counts.specifications_not_stageable += 1; return null; }
    var unit = text_(candidate.unit_raw, 80);
    var quote = text_(candidate.source_quote, 4000);
    var assertionKey = "candidate-v1|" + sha_(manifest.run_id + "|" + page.catalog_page_id + "|SPEC|" + index + "|" + key + "|" + value + "|" + unit).slice(0, 48);
    var stagingId = stableId_("stgspec", assertionKey);
    var createdAt = now_();
    var method = String(artifact.extraction_method || "").toUpperCase();
    require_(["EMBEDDED_TEXT", "OCR", "TABLE_PARSER", "MANUAL"].indexOf(method) >= 0, "CANDIDATE_EXTRACTION_METHOD_INVALID");
    var scope = text_(candidate.scope, 20).toUpperCase();
    if (scope && ["PRODUCT", "VARIANT"].indexOf(scope) < 0) fail_("CANDIDATE_SPEC_SCOPE_INVALID");
    var normalizedValue = candidate.normalized_value_json;
    if (normalizedValue === undefined || normalizedValue === null || normalizedValue === "") normalizedValue = JSON.stringify(value);
    else if (typeof normalizedValue !== "string") normalizedValue = JSON.stringify(normalizedValue);
    var stablePayload = {
      Staging_ID: stagingId, Run_ID: manifest.run_id, Catalog_ID: manifest.catalog_id,
      Catalog_Page_ID: page.catalog_page_id, Raw_Extract_File_ID: page.artifact_file_id,
      Extracted_Text: quote, Extraction_Method: method,
      Extraction_Tool_Version: text_(artifact.extraction_tool_version, 120),
      Source_Key_Algorithm_Version: "candidate-intake-v1",
      Confidence: confidence_(candidate.confidence), Proposed_Status: "NEEDS_REVIEW",
      Parent_Staging_Product_ID: "", Parent_Staging_Variant_ID: "",
      Source_Assertion_Key: assertionKey, Scope: scope,
      Attribute_Key_Raw: key, Value_Raw: value, Unit_Raw: unit,
      Normalized_Key: text_(candidate.normalized_key, 160),
      Normalized_Value_JSON: normalizedValue, Normalized_Unit: text_(candidate.normalized_unit, 80),
      Parse_Status: "AMBIGUOUS"
    };
    var record = Object.assign({}, stablePayload, {
      Staging_Record_Hash: sha_(canonicalJson_(stablePayload)),
      Created_At: createdAt, Updated_At: createdAt
    });
    if (ensure_("Staging_Specifications", "Staging_ID", record,
      ["Run_ID", "Catalog_ID", "Catalog_Page_ID", "Raw_Extract_File_ID", "Extracted_Text",
       "Extraction_Method", "Source_Key_Algorithm_Version", "Source_Assertion_Key", "Attribute_Key_Raw", "Value_Raw"],
      "STAGING_SPECIFICATION_CONFLICT")) counts.staging_specifications += 1;
    return stagingId;
  }
  function createAmbiguityReview_(page, artifact, manifest, actor, evidenceStagingIds, unassignedProductNames, counts) {
    var candidates = artifact.product_candidates || {};
    var variants = Array.isArray(candidates.variants) ? candidates.variants : [];
    var specs = Array.isArray(candidates.specifications) ? candidates.specifications : [];
    if (!variants.length && !specs.length && !unassignedProductNames) return;
    var reviewId = stableId_("revamb", manifest.run_id + "|" + page.catalog_page_id);
    var createdAt = now_();
    var review = {
      Review_Queue_ID: reviewId, Review_Type: "EXTRACTION_AMBIGUITY", Priority: "NORMAL",
      Review_Status: "OPEN",
      Proposed_Action: "Review unassigned product-name, model, and specification candidates on page " + page.catalog_page_id + " in run " + manifest.run_id + ". Inspect the page artifact referenced by Run_Units; non-English product names were not written into the English-name field and no parent relationship was inferred.",
      Created_At: createdAt, Created_By: actor
    };
    if (ensure_("Review_Queue", "Review_Queue_ID", review,
      ["Review_Type", "Priority", "Proposed_Action", "Created_By"],
      "CANDIDATE_AMBIGUITY_REVIEW_CONFLICT")) counts.review_items += 1;
    (evidenceStagingIds || []).forEach(function (stagingId) {
      var link = {
        Review_Staging_Link_ID: stableId_("rsl", reviewId + "|" + stagingId + "|EVIDENCE"),
        Review_Queue_ID: reviewId, Staging_ID: stagingId, Review_Role: "EVIDENCE",
        Created_At: createdAt, Created_By: actor
      };
      if (ensure_("Review_Staging_Links", "Review_Staging_Link_ID", link,
        ["Review_Queue_ID", "Staging_ID", "Review_Role", "Created_By"],
        "CANDIDATE_EVIDENCE_LINK_CONFLICT")) counts.review_links += 1;
    });
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
    var manifestCopy = {};
    Object.keys(manifest).forEach(function (key) { if (key !== "manifest_sha256") manifestCopy[key] = manifest[key]; });
    require_(typeof manifest.manifest_sha256 === "string" && SHA_RE.test(manifest.manifest_sha256) &&
      sha_(canonicalJson_(manifestCopy)) === manifest.manifest_sha256, "CANDIDATE_MANIFEST_CHECKSUM_INVALID");
    var actor = APP.ACTOR_ID;
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var counts = { pages: 0, staging_products: 0, staging_variants: 0, staging_specifications: 0, product_names_unassigned: 0, review_items: 0, review_links: 0, variants_not_stageable: 0, specifications_not_stageable: 0 };
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
        var evidenceStagingIds = [];
        var productStagingIds = [];
        var unassignedProductNames = 0;
        products.forEach(function (candidate, index) {
          var stagingId = createProduct_(candidate, page, artifact, manifest, actor, index, counts);
          if (stagingId) {
            evidenceStagingIds.push(stagingId);
            productStagingIds.push(stagingId);
          } else unassignedProductNames += 1;
        });
        var modelAndSpecEvidenceIds = [];
        variants.forEach(function (candidate, index) {
          var stagingId = createVariant_(candidate, page, artifact, manifest, actor, index, counts);
          if (stagingId) { evidenceStagingIds.push(stagingId); modelAndSpecEvidenceIds.push(stagingId); }
        });
        specs.forEach(function (candidate, index) {
          var stagingId = createSpecification_(candidate, page, artifact, manifest, actor, index, counts);
          if (stagingId) { evidenceStagingIds.push(stagingId); modelAndSpecEvidenceIds.push(stagingId); }
        });
        // Page-level model/spec candidates are exposed as evidence to each product review
        // on this page. The reviewer must explicitly assign or reject each candidate.
        productStagingIds.forEach(function (productStagingId) {
          var reviewId = stableId_("revprd", productStagingId);
          modelAndSpecEvidenceIds.forEach(function (candidateStagingId) {
            var evidenceLink = {
              Review_Staging_Link_ID: stableId_("rsl", reviewId + "|" + candidateStagingId + "|EVIDENCE"),
              Review_Queue_ID: reviewId, Staging_ID: candidateStagingId, Review_Role: "EVIDENCE",
              Created_At: now_(), Created_By: actor
            };
            if (ensure_("Review_Staging_Links", "Review_Staging_Link_ID", evidenceLink,
              ["Review_Queue_ID", "Staging_ID", "Review_Role", "Created_By"],
              "CANDIDATE_EVIDENCE_LINK_CONFLICT")) counts.review_links += 1;
          });
        });
        createAmbiguityReview_(page, artifact, manifest, actor, evidenceStagingIds, unassignedProductNames, counts);
        counts.pages += 1;
      });
    } finally {
      lock.releaseLock();
    }
    // ImageReviewIntake acquires the same Apps Script lock internally. Call it
    // only after releasing this module's lock to avoid a nested-lock timeout.
    var imageIntake = null;
    var imageResult = manifest.image_extraction || {};
    if (imageResult.enabled === true && imageResult.status === "COMPLETED") {
      imageIntake = ImageReviewIntake.intake({
        imageManifestFileId: imageResult.manifest_file_id,
        imageManifestSha256: imageResult.manifest_sha256,
        driveManifestFileId: imageResult.drive_manifest_file_id,
        driveManifestSha256: imageResult.drive_manifest_sha256,
        actor: actor
      });
      require_(imageIntake && imageIntake.status === "COMPLETED", "IMAGE_REVIEW_INTAKE_INCOMPLETE");
    }
    return { status: "COMPLETED", run_id: manifest.run_id, catalog_id: manifest.catalog_id,
      counts: counts, image_intake: imageIntake,
      note: "Product, model, and specification candidates were staged for human review. Model/specification parent relationships remain blank until a reviewer explicitly assigns them." };
  }
  return { intakeRun: intakeRun };
})();
