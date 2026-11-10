/** Human image-review decision writer.
 * The service derives the reviewed staging record from Review_Staging_Links;
 * clients cannot supply or replace the image metadata being approved.
 */
var ImageReviewDecision = (function () {
  function fail_(code) { throw new Error(code); }
  function require_(ok, code) { if (!ok) fail_(code); }
  function sha_(bytes) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes).map(function (b) {
      var n = b < 0 ? b + 256 : b, h = n.toString(16);
      return h.length === 1 ? "0" + h : h;
    }).join("");
  }
  function submit(options) {
    require_(options && /^[A-Za-z0-9_.-]{1,120}$/.test(String(options.reviewQueueId || "")), "IMAGE_REVIEW_ID_REQUIRED");
    var decision = options.decision;
    require_(decision === "APPROVED" || decision === "REJECTED", "IMAGE_REVIEW_DECISION_INVALID");
    var review = SheetsRepository.getBy("Review_Queue", "Review_Queue_ID", options.reviewQueueId);
    require_(review && review.Review_Type === "IMAGE_QUALITY", "IMAGE_REVIEW_NOT_FOUND");
    require_(review.Review_Status === "OPEN" || review.Review_Status === "IN_REVIEW", "IMAGE_REVIEW_NOT_OPEN");
    var links = (SheetsRepository.listAll("Review_Staging_Links") || []).filter(function (r) {
      return r.Review_Queue_ID === review.Review_Queue_ID && r.Review_Role === "PRIMARY";
    });
    require_(links.length === 1, "IMAGE_REVIEW_PRIMARY_STAGING_LINK_INVALID");
    var staging = SheetsRepository.getBy("Staging_Images", "Staging_ID", links[0].Staging_ID);
    require_(staging && /^[a-f0-9]{64}$/.test(String(staging.Staging_Record_Hash || "")), "IMAGE_STAGING_HASH_INVALID");

    var actor = APP.ACTOR_ID;
    var timestamp = new Date().toISOString();
    var record = {
      schema_version: 1,
      review_queue_id: review.Review_Queue_ID,
      staging_id: staging.Staging_ID,
      reviewed_payload_sha256: staging.Staging_Record_Hash,
      decision: decision,
      reviewed_by: actor,
      reviewed_at: timestamp
    };
    if (decision === "APPROVED") {
      require_(options.targetType === "PRODUCT" || options.targetType === "VARIANT", "IMAGE_TARGET_TYPE_INVALID");
      require_(typeof options.targetId === "string" && options.targetId.trim(), "IMAGE_TARGET_ID_REQUIRED");
      require_(typeof options.catalogApproved === "boolean" && typeof options.dataSheetApproved === "boolean", "IMAGE_APPROVAL_FLAGS_REQUIRED");
      require_(options.catalogApproved || options.dataSheetApproved, "IMAGE_APPROVAL_USAGE_REQUIRED");
      record.target_type = options.targetType;
      record.target_id = options.targetId.trim();
      record.catalog_approved = options.catalogApproved;
      record.datasheet_approved = options.dataSheetApproved;
      record.is_primary = options.isPrimary === true;
      record.catalog_order = Number.isSafeInteger(options.catalogOrder) ? options.catalogOrder : 0;
      record.datasheet_order = Number.isSafeInteger(options.dataSheetOrder) ? options.dataSheetOrder : 0;
      record.has_alpha = options.hasAlpha === true;
      // Validate target existence and parent-product integrity before recording approval.
      if (record.target_type === "PRODUCT") {
        var product = SheetsRepository.getBy("Products", "Product_ID", record.target_id);
        require_(product && product.Lifecycle_Status === "ACTIVE", "IMAGE_TARGET_PRODUCT_INVALID");
      } else {
        var variant = SheetsRepository.getBy("Variants", "Variant_ID", record.target_id);
        var parent = variant && SheetsRepository.getBy("Products", "Product_ID", variant.Product_ID);
        require_(variant && variant.Lifecycle_Status === "ACTIVE" && parent && parent.Lifecycle_Status === "ACTIVE", "IMAGE_TARGET_VARIANT_INVALID");
      }
    }
    var raw = JSON.stringify(record);
    var blob = Utilities.newBlob(raw, "application/json", "image-review-" + review.Review_Queue_ID + ".json");
    var file = DriveApp.createFile(blob);
    var digest = sha_(file.getBlob().getBytes());
    SheetsRepository.updateBy("Review_Queue", "Review_Queue_ID", review.Review_Queue_ID, {
      Review_Status: decision === "APPROVED" ? "APPROVED" : "REJECTED",
      Decision_JSON_File_ID: file.getId(),
      Decision_SHA256: digest,
      Reviewed_Payload_Hash: staging.Staging_Record_Hash,
      Reviewed_At: timestamp,
      Reviewed_By: actor
    });
    return { status: decision, reviewQueueId: review.Review_Queue_ID, decisionFileId: file.getId(), decisionSha256: digest };
  }
  return { submit: submit };
})();
