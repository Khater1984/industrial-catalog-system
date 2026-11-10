/** Secure image promotion.
 * The browser supplies only a Review_Queue_ID. All image metadata and approval
 * facts are loaded from server-side Sheets/Drive records and verified here.
 */
var ImagePromotion = (function () {
  var SHA_RE = /^[a-f0-9]{64}$/;
  function fail_(code) { throw new Error(code); }
  function require_(ok, code) { if (!ok) fail_(code); }
  function now_() { return new Date().toISOString(); }
  function sha_(bytes) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes).map(function (b) {
      var n = b < 0 ? b + 256 : b, h = n.toString(16);
      return h.length === 1 ? "0" + h : h;
    }).join("");
  }
  function stableId_(prefix, seed) { return prefix + "_" + sha_(String(seed)).slice(0, 16); }
  function text_(v, code, max) {
    require_(typeof v === "string" && v.trim().length > 0, code);
    var s = v.trim(); require_(s.length <= max, code); return s;
  }
  function promoteReviewedImage(options) {
    require_(options && /^[A-Za-z0-9_.-]{1,120}$/.test(String(options.reviewQueueId || "")), "IMAGE_REVIEW_ID_REQUIRED");
    var review = SheetsRepository.getBy("Review_Queue", "Review_Queue_ID", options.reviewQueueId);
    require_(review, "IMAGE_REVIEW_NOT_FOUND");
    require_(review.Review_Type === "IMAGE_QUALITY", "IMAGE_REVIEW_TYPE_INVALID");
    require_(review.Review_Status === "APPROVED", "IMAGE_REVIEW_NOT_APPROVED");
    require_(review.Decision_JSON_File_ID && SHA_RE.test(String(review.Decision_SHA256 || "")), "IMAGE_DECISION_EVIDENCE_MISSING");
    require_(review.Reviewed_Payload_Hash && SHA_RE.test(String(review.Reviewed_Payload_Hash)), "IMAGE_REVIEWED_HASH_MISSING");
    require_(review.Reviewed_By && review.Reviewed_At, "IMAGE_REVIEW_ACTOR_OR_TIME_MISSING");

    var decisionFile;
    try { decisionFile = DriveApp.getFileById(review.Decision_JSON_File_ID); } catch (e) { fail_("IMAGE_DECISION_FILE_NOT_FOUND"); }
    var decisionBytes = decisionFile.getBlob().getBytes();
    require_(sha_(decisionBytes) === review.Decision_SHA256, "IMAGE_DECISION_FILE_SHA_MISMATCH");
    var decision;
    try { decision = JSON.parse(decisionFile.getBlob().getDataAsString("UTF-8")); } catch (e) { fail_("IMAGE_DECISION_JSON_INVALID"); }
    require_(decision && decision.schema_version === 1, "IMAGE_DECISION_SCHEMA_INVALID");
    require_(decision.review_queue_id === review.Review_Queue_ID, "IMAGE_DECISION_REVIEW_MISMATCH");
    require_(decision.decision === "APPROVED", "IMAGE_DECISION_NOT_APPROVED");
    require_(decision.reviewed_by === review.Reviewed_By, "IMAGE_DECISION_ACTOR_MISMATCH");
    require_(String(decision.reviewed_at) === String(review.Reviewed_At instanceof Date ? review.Reviewed_At.toISOString() : review.Reviewed_At), "IMAGE_DECISION_TIME_MISMATCH");

    var links = (SheetsRepository.listAll("Review_Staging_Links") || []).filter(function (r) {
      return r.Review_Queue_ID === review.Review_Queue_ID && r.Review_Role === "PRIMARY";
    });
    require_(links.length === 1, "IMAGE_REVIEW_PRIMARY_STAGING_LINK_INVALID");
    var staging = SheetsRepository.getBy("Staging_Images", "Staging_ID", links[0].Staging_ID);
    require_(staging, "IMAGE_STAGING_NOT_FOUND");
    require_(decision.staging_id === staging.Staging_ID, "IMAGE_DECISION_STAGING_MISMATCH");
    require_(staging.Staging_Record_Hash === review.Reviewed_Payload_Hash, "IMAGE_STAGING_REVIEW_HASH_MISMATCH");
    require_(decision.reviewed_payload_sha256 === staging.Staging_Record_Hash, "IMAGE_DECISION_PAYLOAD_HASH_MISMATCH");

    var targetType = text_(decision.target_type, "IMAGE_DECISION_TARGET_TYPE_REQUIRED", 20);
    var targetId = text_(decision.target_id, "IMAGE_DECISION_TARGET_ID_REQUIRED", 120);
    require_(targetType === "PRODUCT" || targetType === "VARIANT", "IMAGE_DECISION_TARGET_TYPE_INVALID");
    require_(typeof decision.catalog_approved === "boolean" && typeof decision.datasheet_approved === "boolean", "IMAGE_DECISION_APPROVAL_FLAGS_INVALID");
    require_(decision.catalog_approved || decision.datasheet_approved, "IMAGE_DECISION_HAS_NO_USAGE_APPROVAL");
    var mime = text_(staging.MIME_Type, "IMAGE_STAGING_MIME_MISSING", 100).toLowerCase();
    var allowed = {"image/jpeg":1,"image/png":1,"image/webp":1,"image/gif":1,"image/tiff":1,"image/bmp":1,"image/jp2":1,"image/jpx":1,"image/x-ms-bmp":1};
    require_(allowed[mime] === 1, "IMAGE_STAGING_MIME_UNSUPPORTED");
    var width = Number(staging.Width_PX), height = Number(staging.Height_PX), size = Number(staging.File_Size_Bytes);
    require_(Number.isSafeInteger(width) && width > 0 && width <= 50000, "IMAGE_WIDTH_INVALID");
    require_(Number.isSafeInteger(height) && height > 0 && height <= 50000, "IMAGE_HEIGHT_INVALID");
    require_(width * height <= 100000000, "IMAGE_PIXEL_LIMIT_EXCEEDED");
    require_(Number.isSafeInteger(size) && size > 0 && size <= 26214400, "IMAGE_SIZE_INVALID");
    var digest = text_(staging.SHA256, "IMAGE_SHA_MISSING", 64).toLowerCase();
    require_(SHA_RE.test(digest), "IMAGE_SHA_INVALID");
    var driveId = text_(staging.Proposed_Image_File_ID, "IMAGE_DRIVE_FILE_ID_MISSING", 200);
    require_(/^[A-Za-z0-9_-]{10,200}$/.test(driveId), "IMAGE_DRIVE_FILE_ID_INVALID");
    var driveFile;
    try { driveFile = DriveApp.getFileById(driveId); } catch (e) { fail_("IMAGE_DRIVE_FILE_NOT_FOUND"); }
    require_(driveFile.getSize() === size, "IMAGE_DRIVE_SIZE_MISMATCH");
    require_(driveFile.getMimeType() === mime, "IMAGE_DRIVE_MIME_MISMATCH");
    require_(sha_(driveFile.getBlob().getBytes()) === digest, "IMAGE_DRIVE_SHA_MISMATCH");

    var imageId = stableId_("img", digest);
    var asset = SheetsRepository.getBy("Image_Assets", "Image_ID", imageId);
    if (!asset) {
      SheetsRepository.append("Image_Assets", {
        Image_ID: imageId, Original_File_ID: driveId,
        Original_File_Name: text_(staging.Original_File_Name, "IMAGE_NAME_MISSING", 255),
        MIME_Type: mime, Width_PX: width, Height_PX: height,
        File_Size_Bytes: size, Has_Alpha: decision.has_alpha === true,
        Orientation: "NORMALIZED", SHA256: digest,
        Source_Type: "CATALOG_EMBEDDED", Source_Catalog_ID: staging.Catalog_ID,
        Source_Catalog_Page_ID: staging.Catalog_Page_ID || "",
        Source_Page_Label: staging.Page_Number || "",
        Quality_Status: "ACCEPTABLE", Lifecycle_Status: "ACTIVE",
        Created_At: now_(), Created_By: options.actor || APP.ACTOR_ID
      });
    } else {
      require_(asset.SHA256 === digest && asset.Original_File_ID === driveId, "IMAGE_ASSET_IDENTITY_CONFLICT");
    }

    var link = ImageManagement.linkToTarget(imageId, targetType, targetId, {
      actor: options.actor || APP.ACTOR_ID,
      catalogApproved: decision.catalog_approved,
      dataSheetApproved: decision.datasheet_approved,
      linkStatus: "ACTIVE",
      isPrimary: decision.is_primary === true,
      catalogOrder: Number.isSafeInteger(decision.catalog_order) ? decision.catalog_order : 0,
      dataSheetOrder: Number.isSafeInteger(decision.datasheet_order) ? decision.datasheet_order : 0
    });
    return { status: "COMPLETED", reviewQueueId: review.Review_Queue_ID, stagingId: staging.Staging_ID, imageId: imageId, link: link };
  }
  return { promoteReviewedImage: promoteReviewedImage };
})();
