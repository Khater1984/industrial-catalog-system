/** Persisted human decisions for product, variant and specification review tasks. */
var CandidateReviewDecision = (function () {
  var SHA_RE = /^[a-f0-9]{64}$/;
  function fail_(code) { throw new Error(code); }
  function require_(ok, code) { if (!ok) fail_(code); }
  function text_(value, code, max, required) {
    var s = value === undefined || value === null ? "" : String(value).trim();
    if (required && !s) fail_(code);
    require_(s.length <= max, code);
    return s;
  }
  function sha_(bytes) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes).map(function (b) {
      var n = b < 0 ? b + 256 : b, h = n.toString(16);
      return h.length === 1 ? "0" + h : h;
    }).join("");
  }
  function submit(options) {
    require_(options && /^[A-Za-z0-9_.-]{1,120}$/.test(String(options.reviewQueueId || "")), "CANDIDATE_REVIEW_ID_REQUIRED");
    var allowed = ["reviewQueueId", "decision", "targetProductId", "targetVariantId", "scope",
      "nameEn", "modelNameEn", "attributeKey", "valueRaw", "unitRaw", "rationale"];
    Object.keys(options).forEach(function (key) { require_(allowed.indexOf(key) >= 0, "CANDIDATE_REVIEW_UNKNOWN_FIELD"); });
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var review = SheetsRepository.getBy("Review_Queue", "Review_Queue_ID", options.reviewQueueId);
      require_(review, "CANDIDATE_REVIEW_NOT_FOUND");
      require_(["PRODUCT_MATCH", "VARIANT_MATCH", "SPECIFICATION"].indexOf(review.Review_Type) >= 0, "CANDIDATE_REVIEW_TYPE_UNSUPPORTED");
      require_(review.Review_Status === "OPEN" || review.Review_Status === "IN_REVIEW", "CANDIDATE_REVIEW_NOT_OPEN");
      var table = review.Review_Type === "PRODUCT_MATCH" ? "Staging_Products" :
        (review.Review_Type === "VARIANT_MATCH" ? "Staging_Variants" : "Staging_Specifications");
      var links = (SheetsRepository.listAll("Review_Staging_Links") || []).filter(function (x) {
        return x.Review_Queue_ID === review.Review_Queue_ID && x.Review_Role === "PRIMARY";
      });
      require_(links.length === 1, "CANDIDATE_REVIEW_PRIMARY_LINK_INVALID");
      var staging = SheetsRepository.getBy(table, "Staging_ID", links[0].Staging_ID);
      require_(staging, "CANDIDATE_STAGING_NOT_FOUND");
      require_(staging.Proposed_Status === "NEEDS_REVIEW", "CANDIDATE_STAGING_NOT_REVIEWABLE");
      require_(SHA_RE.test(String(staging.Staging_Record_Hash || "")), "CANDIDATE_STAGING_HASH_INVALID");

      var action = text_(options.decision, "CANDIDATE_DECISION_REQUIRED", 24, true);
      var actor = APP.ACTOR_ID;
      var at = new Date().toISOString();
      var record = {
        schema_version: 1, review_queue_id: review.Review_Queue_ID,
        review_type: review.Review_Type, staging_id: staging.Staging_ID,
        reviewed_payload_sha256: staging.Staging_Record_Hash,
        decision: action, reviewed_by: actor, reviewed_at: at,
        rationale: text_(options.rationale, "CANDIDATE_RATIONALE_INVALID", 1000, false)
      };
      var nextStatus = "APPROVED";
      if (action === "REJECTED") nextStatus = "REJECTED";
      else if (action === "DEFERRED") nextStatus = "DEFERRED";

      if (review.Review_Type === "PRODUCT_MATCH") {
        require_(["CREATE_NEW", "MATCH_EXISTING", "REJECTED", "DEFERRED"].indexOf(action) >= 0, "PRODUCT_DECISION_INVALID");
        if (action === "MATCH_EXISTING") {
          var productId = text_(options.targetProductId, "PRODUCT_MATCH_TARGET_REQUIRED", 120, true);
          var product = SheetsRepository.getBy("Products", "Product_ID", productId);
          require_(product && product.Lifecycle_Status === "ACTIVE", "PRODUCT_MATCH_TARGET_INVALID");
          record.target_product_id = productId;
        } else if (action === "CREATE_NEW") {
          record.name_en = text_(options.nameEn || staging.Proposed_Product_Name_EN, "PRODUCT_REVIEW_NAME_REQUIRED", 300, true);
        }
      } else if (review.Review_Type === "VARIANT_MATCH") {
        require_(["CREATE_NEW", "MATCH_EXISTING", "REJECTED", "DEFERRED"].indexOf(action) >= 0, "VARIANT_DECISION_INVALID");
        if (action === "CREATE_NEW" || action === "MATCH_EXISTING") {
          var parentId = text_(options.targetProductId, "VARIANT_PARENT_PRODUCT_REQUIRED", 120, true);
          var parent = SheetsRepository.getBy("Products", "Product_ID", parentId);
          require_(parent && parent.Lifecycle_Status === "ACTIVE", "VARIANT_PARENT_PRODUCT_INVALID");
          record.target_product_id = parentId;
          record.model_name_en = text_(options.modelNameEn || staging.Proposed_Model_Name || staging.Proposed_Model_Number,
            "VARIANT_REVIEW_NAME_REQUIRED", 250, true);
          if (action === "MATCH_EXISTING") {
            var variantId = text_(options.targetVariantId, "VARIANT_MATCH_TARGET_REQUIRED", 120, true);
            var variant = SheetsRepository.getBy("Variants", "Variant_ID", variantId);
            require_(variant && variant.Lifecycle_Status === "ACTIVE" && variant.Product_ID === parentId, "VARIANT_MATCH_TARGET_INVALID");
            record.target_variant_id = variantId;
          }
        }
      } else {
        require_(["APPROVED", "REJECTED", "DEFERRED"].indexOf(action) >= 0, "SPECIFICATION_DECISION_INVALID");
        if (action === "APPROVED") {
          var scope = text_(options.scope, "SPECIFICATION_SCOPE_REQUIRED", 20, true);
          require_(scope === "PRODUCT" || scope === "VARIANT", "SPECIFICATION_SCOPE_INVALID");
          record.scope = scope;
          if (scope === "PRODUCT") {
            var specProductId = text_(options.targetProductId, "SPECIFICATION_PRODUCT_REQUIRED", 120, true);
            var specProduct = SheetsRepository.getBy("Products", "Product_ID", specProductId);
            require_(specProduct && specProduct.Lifecycle_Status === "ACTIVE", "SPECIFICATION_PRODUCT_INVALID");
            record.target_product_id = specProductId;
          } else {
            var specVariantId = text_(options.targetVariantId, "SPECIFICATION_VARIANT_REQUIRED", 120, true);
            var specVariant = SheetsRepository.getBy("Variants", "Variant_ID", specVariantId);
            var variantParent = specVariant && SheetsRepository.getBy("Products", "Product_ID", specVariant.Product_ID);
            require_(specVariant && specVariant.Lifecycle_Status === "ACTIVE" && variantParent && variantParent.Lifecycle_Status === "ACTIVE", "SPECIFICATION_VARIANT_INVALID");
            record.target_variant_id = specVariantId;
            record.target_product_id = specVariant.Product_ID;
          }
          record.attribute_key = text_(options.attributeKey || staging.Attribute_Key_Raw, "SPECIFICATION_KEY_REQUIRED", 160, true);
          record.value_raw = text_(options.valueRaw || staging.Value_Raw, "SPECIFICATION_VALUE_REQUIRED", 2000, true);
          record.unit_raw = text_(options.unitRaw === undefined ? staging.Unit_Raw : options.unitRaw, "SPECIFICATION_UNIT_INVALID", 80, false);
        }
      }

      var raw = JSON.stringify(record);
      var blob = Utilities.newBlob(raw, "application/json", "candidate-review-" + review.Review_Queue_ID + ".json");
      var evidenceFile = DriveApp.createFile(blob);
      var digest = sha_(evidenceFile.getBlob().getBytes());
      SheetsRepository.updateBy("Review_Queue", "Review_Queue_ID", review.Review_Queue_ID, {
        Review_Status: nextStatus,
        Decision_JSON_File_ID: evidenceFile.getId(),
        Decision_SHA256: digest,
        Reviewed_Payload_Hash: staging.Staging_Record_Hash,
        Reviewed_At: at,
        Reviewed_By: actor
      });
      return { status: nextStatus, reviewQueueId: review.Review_Queue_ID, decisionFileId: evidenceFile.getId(), decisionSha256: digest };
    } finally {
      lock.releaseLock();
    }
  }
  return { submit: submit };
})();
