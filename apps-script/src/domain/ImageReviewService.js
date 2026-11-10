/**
 * Human decision workflow for extracted catalog images.
 *
 * The caller cannot self-assert ACCEPTED: this service resolves the actual
 * IMAGE_QUALITY review task and its PRIMARY Staging_Images record, verifies
 * the immutable Drive bytes, then promotes and approves the resulting link.
 */
var ImageReviewService = (function () {
  var DRIVE_ID_RE = /^[A-Za-z0-9_-]{10,200}$/;
  var SHA_RE = /^[a-f0-9]{64}$/;

  function require_(ok, code) { if (!ok) throw new Error(code); }
  function now_() { return new Date().toISOString(); }
  function text_(v, max, code) {
    var s = v === undefined || v === null ? "" : String(v).trim();
    require_(s.length > 0 && s.length <= max, code);
    return s;
  }
  function sha_(bytes) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes).map(function (b) {
      var n = b < 0 ? b + 256 : b, h = n.toString(16);
      return h.length === 1 ? "0" + h : h;
    }).join("");
  }
  function canonical_(value) {
    if (value === null || typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number") { require_(isFinite(value), "IMAGE_REVIEW_NONFINITE_VALUE"); return value; }
    if (Array.isArray(value)) return value.map(canonical_);
    if (value && Object.prototype.toString.call(value) === "[object Object]") {
      var out = {};
      Object.keys(value).sort().forEach(function (k) {
        require_(value[k] !== undefined, "IMAGE_REVIEW_UNDEFINED_VALUE");
        out[k] = canonical_(value[k]);
      });
      return out;
    }
    throw new Error("IMAGE_REVIEW_VALUE_UNSUPPORTED");
  }
  function canonicalJson_(value) { return JSON.stringify(canonical_(value)); }
  function payloadHash_(value) { return sha_(Utilities.newBlob(canonicalJson_(value)).getBytes()); }
  function stableId_(prefix, seed) { return prefix + "_" + sha_(String(seed)).slice(0, 16); }
  function verifyStagingHash_(row) {
    require_(row && SHA_RE.test(String(row.Staging_Record_Hash || "")), "IMAGE_STAGING_HASH_MISSING");
    var copy = {};
    var mutable = { Staging_Record_Hash: true, Created_At: true, Updated_At: true,
      Proposed_Status: true, Quality_Status: true, Candidate_Product_ID: true,
      Candidate_Variant_ID: true, Image_Role: true };
    Object.keys(row).forEach(function (k) { if (!mutable[k]) copy[k] = row[k]; });
    require_(sha_(Utilities.newBlob(canonicalJson_(copy)).getBytes()) === row.Staging_Record_Hash,
      "IMAGE_STAGING_HASH_MISMATCH");
  }
  function resolveTarget_(type, id) {
    require_(type === "PRODUCT" || type === "VARIANT", "IMAGE_TARGET_TYPE_INVALID");
    id = text_(id, 120, "IMAGE_TARGET_ID_INVALID");
    if (type === "PRODUCT") {
      var product = SheetsRepository.getBy("Products", "Product_ID", id);
      require_(product && product.Lifecycle_Status === "ACTIVE", "IMAGE_TARGET_PRODUCT_NOT_ACTIVE");
      return { type: type, id: id, productId: id };
    }
    var variant = SheetsRepository.getBy("Variants", "Variant_ID", id);
    require_(variant && variant.Lifecycle_Status === "ACTIVE", "IMAGE_TARGET_VARIANT_NOT_ACTIVE");
    var parent = SheetsRepository.getBy("Products", "Product_ID", variant.Product_ID);
    require_(parent && parent.Lifecycle_Status === "ACTIVE", "IMAGE_TARGET_PARENT_NOT_ACTIVE");
    return { type: type, id: id, productId: String(variant.Product_ID) };
  }
  function verifyDrive_(staging) {
    var fileId = text_(staging.Proposed_Image_File_ID, 200, "IMAGE_DRIVE_FILE_ID_INVALID");
    require_(DRIVE_ID_RE.test(fileId), "IMAGE_DRIVE_FILE_ID_INVALID");
    var file;
    try { file = DriveApp.getFileById(fileId); } catch (e) { throw new Error("IMAGE_DRIVE_FILE_NOT_FOUND"); }
    require_(file, "IMAGE_DRIVE_FILE_NOT_FOUND");
    var blob = file.getBlob(), bytes = blob.getBytes();
    require_(file.getSize() === Number(staging.File_Size_Bytes), "IMAGE_DRIVE_SIZE_MISMATCH");
    require_(String(file.getMimeType()).toLowerCase() === String(staging.MIME_Type).toLowerCase(),
      "IMAGE_DRIVE_MIME_MISMATCH");
    require_(sha_(bytes) === String(staging.SHA256).toLowerCase(), "IMAGE_DRIVE_SHA_MISMATCH");
    return true;
  }
  function findTask_(reviewId) {
    var review = SheetsRepository.getBy("Review_Queue", "Review_Queue_ID", text_(reviewId, 120, "IMAGE_REVIEW_ID_INVALID"));
    require_(review && review.Review_Type === "IMAGE_QUALITY", "IMAGE_REVIEW_TASK_NOT_FOUND");
    var links = SheetsRepository.listAll("Review_Staging_Links").filter(function (l) {
      return l.Review_Queue_ID === review.Review_Queue_ID && l.Review_Role === "PRIMARY";
    });
    require_(links.length === 1, "IMAGE_REVIEW_PRIMARY_STAGING_INVALID");
    var staging = SheetsRepository.getBy("Staging_Images", "Staging_ID", links[0].Staging_ID);
    require_(staging, "IMAGE_REVIEW_STAGING_NOT_FOUND");
    verifyStagingHash_(staging);
    return { review: review, staging: staging };
  }
  function decide(options, actor) {
    options = options || {};
    actor = text_(actor || APP.ACTOR_ID, 120, "IMAGE_REVIEW_ACTOR_INVALID");
    var decision = text_(options.decision, 20, "IMAGE_REVIEW_DECISION_INVALID");
    require_(decision === "ACCEPTED" || decision === "REJECTED", "IMAGE_REVIEW_DECISION_INVALID");
    var task = findTask_(options.reviewId), review = task.review, staging = task.staging;
    var target = null;
    var catalogApproved = options.catalogApproved === true;
    var dataSheetApproved = options.dataSheetApproved === true;
    if (decision === "ACCEPTED") {
      require_(review.Review_Status === "OPEN" || review.Review_Status === "IN_REVIEW" ||
        review.Review_Status === "APPROVED", "IMAGE_REVIEW_TASK_NOT_ACTIONABLE");
      require_(staging.Proposed_Status === "NEEDS_REVIEW", "IMAGE_STAGING_NOT_REVIEWABLE");
      require_(catalogApproved || dataSheetApproved, "IMAGE_PUBLICATION_APPROVAL_REQUIRED");
      target = resolveTarget_(options.targetType, options.targetId);
      if (options.targetType === "VARIANT") {
        require_(String(staging.Catalog_ID || "") !== "", "IMAGE_CATALOG_ID_REQUIRED");
      }
    } else {
      require_(review.Review_Status === "OPEN" || review.Review_Status === "IN_REVIEW" ||
        review.Review_Status === "REJECTED", "IMAGE_REVIEW_TASK_NOT_ACTIONABLE");
    }
    var decisionPayload = {
      reviewId: review.Review_Queue_ID, stagingId: staging.Staging_ID, decision: decision,
      targetType: target ? target.type : "", targetId: target ? target.id : "",
      catalogApproved: catalogApproved, dataSheetApproved: dataSheetApproved,
      isPrimary: options.isPrimary === true, notes: String(options.notes || "").trim()
    };
    var fingerprint = payloadHash_(decisionPayload);
    if (review.Review_Status === "APPROVED" || review.Review_Status === "REJECTED") {
      require_(review.Reviewed_Payload_Hash === fingerprint, "IMAGE_REVIEW_DECISION_ALREADY_FINAL");
      if (decision === "ACCEPTED" && options.isPrimary === true) {
        var retryImageId = stableId_("img", String(staging.SHA256).toLowerCase());
        var retryLink = ImageManagement.linkToTarget(retryImageId, target.type, target.id, { actor: actor });
        ImageManagement.setPrimary(retryLink.linkId, actor);
      }
      return { status: review.Review_Status, reviewId: review.Review_Queue_ID, stagingId: staging.Staging_ID, reused: true };
    }
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      // Re-read under lock to avoid two reviewers promoting the same task concurrently.
      task = findTask_(review.Review_Queue_ID); review = task.review; staging = task.staging;
      require_(review.Review_Status === "OPEN" || review.Review_Status === "IN_REVIEW", "IMAGE_REVIEW_TASK_NOT_ACTIONABLE");
      if (decision === "REJECTED") {
        SheetsRepository.updateBy("Staging_Images", "Staging_ID", staging.Staging_ID, {
          Proposed_Status: "REJECTED", Updated_At: now_()
        });
        SheetsRepository.updateBy("Review_Queue", "Review_Queue_ID", review.Review_Queue_ID, {
          Review_Status: "REJECTED", Decision_Notes: decisionPayload.notes,
          Reviewed_Payload_Hash: fingerprint, Reviewed_At: now_(), Reviewed_By: actor
        });
        return { status: "REJECTED", reviewId: review.Review_Queue_ID, stagingId: staging.Staging_ID, reused: false };
      }
      verifyDrive_(staging);
      require_(typeof staging.Width_PX === "number" && staging.Width_PX > 0, "IMAGE_WIDTH_REQUIRED");
      require_(typeof staging.Height_PX === "number" && staging.Height_PX > 0, "IMAGE_HEIGHT_REQUIRED");
      require_(typeof staging.Has_Alpha === "boolean", "IMAGE_ALPHA_FLAG_REQUIRED");
      var imagePayload = {
        review_status: "ACCEPTED", sha256: staging.SHA256,
        drive_file_id: staging.Proposed_Image_File_ID, original_name: staging.Original_File_Name,
        mime_type: staging.MIME_Type, width_px: staging.Width_PX, height_px: staging.Height_PX,
        file_size_bytes: staging.File_Size_Bytes, has_alpha: staging.Has_Alpha,
        catalog_page_id: staging.Catalog_Page_ID || "", page_number: Number(staging.Page_Number || 0) || 1,
        target_type: target.type, target_id: target.id
      };
      ImagePromotion.promoteAcceptedImages({
        images: [imagePayload], run_id: staging.Run_ID, catalog_id: staging.Catalog_ID, actor: actor
      });
      var imageId = stableId_("img", String(staging.SHA256).toLowerCase());
      var linked = ImageManagement.linkToTarget(imageId, target.type, target.id, { actor: actor });
      ImageManagement.setApproval(linked.linkId, {
        catalogApproved: catalogApproved, dataSheetApproved: dataSheetApproved,
        linkStatus: "ACTIVE", actor: actor
      });
      if (options.isPrimary === true) ImageManagement.setPrimary(linked.linkId, actor, true);
      var stagingPatch = {
        Proposed_Status: "PROMOTED", Quality_Status: "ACCEPTABLE", Updated_At: now_()
      };
      if (target.type === "PRODUCT") stagingPatch.Candidate_Product_ID = target.id;
      else stagingPatch.Candidate_Variant_ID = target.id;
      SheetsRepository.updateBy("Image_Assets", "Image_ID", imageId, { Quality_Status: "ACCEPTABLE" });
      SheetsRepository.updateBy("Staging_Images", "Staging_ID", staging.Staging_ID, stagingPatch);
      SheetsRepository.updateBy("Review_Queue", "Review_Queue_ID", review.Review_Queue_ID, {
        Review_Status: "APPROVED", Decision_Notes: decisionPayload.notes,
        Reviewed_Payload_Hash: fingerprint, Reviewed_At: now_(), Reviewed_By: actor
      });
      return { status: "APPROVED", reviewId: review.Review_Queue_ID, stagingId: staging.Staging_ID,
        imageId: imageId, linkId: linked.linkId, target: target, reused: false };
    } finally {
      lock.releaseLock();
    }
  }
  return { decide: decide };
})();