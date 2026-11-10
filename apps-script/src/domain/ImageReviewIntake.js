/** Image Review Intake
 *
 * Verifies the worker's immutable image manifests and Drive objects, then
 * idempotently creates Staging_Images, Review_Queue and Review_Staging_Links.
 *
 * Deliberately does not write Image_Assets/Image_Links, associate products,
 * or invoke ImagePromotion.
 */
var ImageReviewIntake = (function () {
  var SHA_RE = /^[a-f0-9]{64}$/;
  var DRIVE_ID_RE = /^[A-Za-z0-9_-]{10,200}$/;

  function fail_(code) { throw new Error(code); }
  function require_(condition, code) { if (!condition) fail_(code); }
  function now_() { return new Date().toISOString(); }

  function bytes_(value) {
    return typeof value === "string" ? Utilities.newBlob(value, "application/json").getBytes() : value;
  }
  function sha_(value) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes_(value)).map(function (b) {
      var n = b < 0 ? b + 256 : b, hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }

  // Matches worker.images.canonical_json_bytes: UTF-8 JSON, sorted object keys,
  // compact separators, non-ASCII characters retained.
  function canonical_(value) {
    if (value === null || typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number") {
      if (!isFinite(value)) fail_("MANIFEST_NONFINITE_NUMBER");
      return value;
    }
    if (Array.isArray(value)) return value.map(canonical_);
    if (value && Object.prototype.toString.call(value) === "[object Object]") {
      var out = {};
      Object.keys(value).sort().forEach(function (key) {
        if (value[key] === undefined) fail_("MANIFEST_UNDEFINED_VALUE");
        out[key] = canonical_(value[key]);
      });
      return out;
    }
    fail_("MANIFEST_VALUE_UNSUPPORTED");
  }
  function canonicalJson_(value) { return JSON.stringify(canonical_(value)); }
  function withoutKey_(value, key) {
    var out = {};
    Object.keys(value).forEach(function (name) { if (name !== key) out[name] = value[name]; });
    return out;
  }
  function verifyRecordHash_(record, hashField, errorCode) {
    require_(record && typeof record[hashField] === "string" && SHA_RE.test(record[hashField]), errorCode);
    require_(sha_(canonicalJson_(withoutKey_(record, hashField))) === record[hashField], errorCode);
  }
  function stableId_(prefix, seed) { return prefix + "_" + sha_(String(seed)).slice(0, 24); }
  function requireText_(value, code, maxLength) {
    require_(typeof value === "string" && value.trim().length > 0, code);
    var result = value.trim();
    if (maxLength) require_(result.length <= maxLength, code);
    return result;
  }
  function requireInteger_(value, code, minimum) {
    require_(typeof value === "number" && Number.isSafeInteger(value) && value >= minimum, code);
    return value;
  }
  function idValid_(value) { return typeof value === "string" && DRIVE_ID_RE.test(value); }

  function loadManifest_(fileId, expectedSha, kind) {
    require_(idValid_(fileId), "MANIFEST_FILE_ID_INVALID");
    var file;
    try { file = DriveApp.getFileById(fileId); } catch (e) { fail_("MANIFEST_FILE_NOT_FOUND"); }
    require_(file, "MANIFEST_FILE_NOT_FOUND");
    var blob = file.getBlob();
    var rawBytes = blob.getBytes();
    var rawSha = sha_(rawBytes);
    if (expectedSha) {
      require_(typeof expectedSha === "string" && SHA_RE.test(expectedSha), "MANIFEST_EXPECTED_SHA_INVALID");
      require_(rawSha === expectedSha, "MANIFEST_FILE_SHA_MISMATCH");
    }
    var data;
    try { data = JSON.parse(blob.getDataAsString("UTF-8")); } catch (e) { fail_("MANIFEST_INVALID_JSON"); }
    require_(data && Object.prototype.toString.call(data) === "[object Object]", "MANIFEST_STRUCTURE_INVALID");
    verifyRecordHash_(data, "manifest_sha256", "MANIFEST_CHECKSUM_INVALID");
    require_(data.manifest_version === 1, "MANIFEST_VERSION_UNSUPPORTED");
    requireText_(data.catalog_id, "MANIFEST_CATALOG_INVALID", 120);
    requireText_(data.run_id, "MANIFEST_RUN_INVALID", 120);
    if (kind === "image") {
      require_(Array.isArray(data.images), "IMAGE_MANIFEST_IMAGES_INVALID");
      require_(data.image_count === data.images.length, "IMAGE_MANIFEST_COUNT_MISMATCH");
      data.images.forEach(function (image) {
        require_(image && Object.prototype.toString.call(image) === "[object Object]", "IMAGE_RECORD_INVALID");
        // Runner adds Drive pointers after extraction. The per-image worker
        // checksum intentionally covers the immutable extraction record only.
        var sourceImage = withoutKey_(withoutKey_(image, "drive_file_id"), "drive_sha256");
        verifyRecordHash_(sourceImage, "output_sha256", "IMAGE_RECORD_CHECKSUM_INVALID");
      });
    } else {
      require_(Array.isArray(data.images), "DRIVE_MANIFEST_IMAGES_INVALID");
      require_(data.image_count === data.images.length, "DRIVE_MANIFEST_COUNT_MISMATCH");
    }
    return { data: data, sha: rawSha };
  }

  function verifyDriveManifest_(imageData, driveData) {
    require_(driveData.catalog_id === imageData.catalog_id, "CATALOG_ID_MISMATCH");
    require_(driveData.run_id === imageData.run_id, "RUN_ID_MISMATCH");
    // The worker Drive manifest references the original extraction manifest.
    // Runner enriches the separately published image manifest with Drive IDs;
    // reconstruct the pre-enrichment manifest before comparing the source hash.
    var sourceCopy = withoutKey_(withoutKey_(imageData, "manifest_sha256"), "enabled");
    sourceCopy.images = imageData.images.map(function (image) {
      return withoutKey_(withoutKey_(image, "drive_file_id"), "drive_sha256");
    });
    require_(driveData.source_manifest_sha256 === sha_(canonicalJson_(sourceCopy)), "SOURCE_MANIFEST_SHA_MISMATCH");
    var counts = { UPLOADED: 0, REUSED: 0, FAILED: 0 };
    var sourceKeys = {};
    imageData.images.forEach(function (item) {
      require_(item && SHA_RE.test(String(item.sha256 || "")), "IMAGE_RECORD_SHA_INVALID");
      requireText_(item.artifact_path, "IMAGE_RECORD_PATH_INVALID", 500);
      var sourceKey = item.sha256 + "|" + item.artifact_path;
      require_(!sourceKeys[sourceKey], "IMAGE_RECORD_DUPLICATE");
      sourceKeys[sourceKey] = true;
    });
    require_(driveData.images.length === imageData.images.length, "DRIVE_IMAGE_SET_COUNT_MISMATCH");
    var seen = {};
    driveData.images.forEach(function (item) {
      require_(item && typeof item === "object", "DRIVE_IMAGE_RECORD_INVALID");
      var status = item.upload_status;
      require_(Object.prototype.hasOwnProperty.call(counts, status), "DRIVE_UPLOAD_STATUS_INVALID");
      counts[status] += 1;
      require_(SHA_RE.test(String(item.sha256 || "")), "DRIVE_IMAGE_SHA_INVALID");
      requireText_(item.artifact_path, "DRIVE_IMAGE_PATH_INVALID", 500);
      var key = item.sha256 + "|" + item.artifact_path;
      require_(Object.prototype.hasOwnProperty.call(sourceKeys, key), "DRIVE_IMAGE_UNMATCHED");
      require_(!seen[key], "DRIVE_IMAGE_DUPLICATE");
      seen[key] = true;
      if (status !== "FAILED") {
        require_(idValid_(item.drive_file_id), "DRIVE_FILE_ID_INVALID");
        require_(item.catalog_id === imageData.catalog_id && item.run_id === imageData.run_id, "DRIVE_IMAGE_IDENTITY_MISMATCH");
      }
    });
    Object.keys(sourceKeys).forEach(function (key) {
      require_(seen[key], "DRIVE_IMAGE_MISSING");
    });
    require_(driveData.uploaded_count === counts.UPLOADED &&
      driveData.reused_count === counts.REUSED &&
      driveData.failed_count === counts.FAILED &&
      driveData.stored_count === counts.UPLOADED + counts.REUSED, "DRIVE_MANIFEST_COUNTER_MISMATCH");
    var expectedOverall = counts.FAILED === 0 ? "COMPLETED" :
      (counts.UPLOADED + counts.REUSED > 0 ? "PARTIAL" : "FAILED");
    require_(driveData.overall_status === expectedOverall, "DRIVE_MANIFEST_STATUS_MISMATCH");
  }

  function verifyDriveFile_(driveFileId, expected) {
    require_(idValid_(driveFileId), "DRIVE_FILE_ID_INVALID");
    var file;
    try { file = DriveApp.getFileById(driveFileId); } catch (e) { fail_("DRIVE_FILE_NOT_FOUND"); }
    require_(file, "DRIVE_FILE_NOT_FOUND");
    var size = file.getSize();
    var mime = file.getMimeType();
    require_(size === expected.file_size_bytes, "DRIVE_FILE_SIZE_MISMATCH");
    require_(mime === expected.mime_type, "DRIVE_FILE_MIME_MISMATCH");
    var actualSha = sha_(file.getBlob().getBytes());
    require_(actualSha === expected.sha256, "DRIVE_FILE_SHA_MISMATCH");
    return { size: size, mime: mime, sha256: actualSha };
  }

  function existingBy_(table, column, value) {
    return SheetsRepository.getBy(table, column, value);
  }
  function compareExisting_(table, existing, expected, fields, code) {
    fields.forEach(function (field) {
      var actual = existing[field];
      var wanted = expected[field];
      if (actual instanceof Date && !isNaN(actual.getTime())) actual = actual.toISOString();
      if (String(actual === undefined || actual === null ? "" : actual) !==
          String(wanted === undefined || wanted === null ? "" : wanted)) fail_(code);
    });
  }
  function ensureRecord_(table, idColumn, record, compareFields, conflictCode) {
    var existing = existingBy_(table, idColumn, record[idColumn]);
    if (existing) {
      compareExisting_(table, existing, record, compareFields, conflictCode);
      return false;
    }
    SheetsRepository.append(table, record);
    return true;
  }

  function stagingHashPayload_(record) {
    var mutable = { Staging_Record_Hash: true, Created_At: true, Updated_At: true,
      Proposed_Status: true, Quality_Status: true, Candidate_Product_ID: true,
      Candidate_Variant_ID: true, Image_Role: true };
    var out = {};
    Object.keys(record).forEach(function (key) { if (!mutable[key]) out[key] = record[key]; });
    return out;
  }

  function buildStaging_(img, driveImage, options, catalogId, runId, stagingId) {
    var name = requireText_(img.original_name, "IMAGE_ORIGINAL_NAME_MISSING", 255);
    var mime = requireText_(driveImage.mime_type, "IMAGE_MIME_TYPE_MISSING", 100);
    var size = requireInteger_(img.file_size_bytes, "IMAGE_FILE_SIZE_INVALID", 1);
    require_(driveImage.file_size_bytes === size, "DRIVE_MANIFEST_FILE_SIZE_MISMATCH");
    require_(img.sha256 === driveImage.sha256, "DRIVE_MANIFEST_SHA_MISMATCH");
    var record = {
      Staging_ID: stagingId,
      Run_ID: runId,
      Catalog_ID: catalogId,
      Raw_Extract_File_ID: options.imageManifestFileId,
      Extraction_Method: "IMAGE_EXTRACTION",
      Proposed_Status: "NEEDS_REVIEW",
      Proposed_Image_File_ID: driveImage.drive_file_id,
      Original_File_Name: name,
      MIME_Type: mime,
      File_Size_Bytes: size,
      SHA256: img.sha256,
      Quality_Status: "NEEDS_REVIEW"
    };
    if (img.catalog_page_id) record.Catalog_Page_ID = requireText_(img.catalog_page_id, "IMAGE_PAGE_ID_INVALID", 120);
    if (img.page_number !== null && img.page_number !== undefined) record.Page_Number = requireInteger_(img.page_number, "IMAGE_PAGE_NUMBER_INVALID", 1);
    if (typeof img.has_alpha === "boolean") record.Has_Alpha = img.has_alpha;
    if (typeof img.extractor_version === "string" && img.extractor_version.trim()) {
      record.Extraction_Tool_Version = requireText_(img.extractor_version, "IMAGE_EXTRACTOR_VERSION_INVALID", 120);
    }
    if (img.width_px !== null && img.width_px !== undefined) record.Width_PX = requireInteger_(img.width_px, "IMAGE_WIDTH_INVALID", 1);
    if (img.height_px !== null && img.height_px !== undefined) record.Height_PX = requireInteger_(img.height_px, "IMAGE_HEIGHT_INVALID", 1);
    record.Staging_Record_Hash = sha_(canonicalJson_(stagingHashPayload_(record)));
    record.Created_At = now_();
    record.Updated_At = record.Created_At;
    return record;
  }

  function intake(options) {
    require_(options && idValid_(options.imageManifestFileId) && idValid_(options.driveManifestFileId), "INTAKE_ARGUMENTS_INVALID");
    var imageManifest = loadManifest_(options.imageManifestFileId, options.imageManifestSha256, "image");
    var driveManifest = loadManifest_(options.driveManifestFileId, options.driveManifestSha256, "drive");
    var imgData = imageManifest.data, drvData = driveManifest.data;
    verifyDriveManifest_(imgData, drvData);

    var catalogId = requireText_(imgData.catalog_id, "CATALOG_OR_RUN_MISSING", 120);
    var runId = requireText_(imgData.run_id, "CATALOG_OR_RUN_MISSING", 120);
    var actor = requireText_(options.actor || APP.ACTOR_ID, "INTAKE_ACTOR_MISSING", 120);
    var driveByKey = {};
    drvData.images.forEach(function (item) {
      if (item.upload_status !== "FAILED") driveByKey[item.sha256 + "|" + item.artifact_path] = item;
    });
    var sourceKeys = {};
    imgData.images.forEach(function (item) {
      require_(item && SHA_RE.test(String(item.sha256 || "")), "IMAGE_RECORD_SHA_INVALID");
      requireText_(item.artifact_path, "IMAGE_RECORD_PATH_INVALID", 500);
      var key = item.sha256 + "|" + item.artifact_path;
      require_(!sourceKeys[key], "IMAGE_RECORD_DUPLICATE");
      sourceKeys[key] = true;
    });

    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var counts = { staging: 0, reviews: 0, links: 0, reused: 0, skipped: 0, failed: 0, conflicts: 0 };
      var results = [];
      imgData.images.forEach(function (img) {
        var key = img.sha256 + "|" + img.artifact_path;
        var driveImage = driveByKey[key];
        if (!driveImage) {
          counts.skipped += 1;
          results.push({ sha256: img.sha256, status: "SKIPPED", reason: "DRIVE_UPLOAD_NOT_AVAILABLE" });
          return;
        }
        try {
          require_(driveImage.drive_file_id, "DRIVE_FILE_ID_MISSING");
          require_(driveImage.sha256 === img.sha256, "DRIVE_IMAGE_SHA_MISMATCH");
          if (img.drive_file_id) require_(img.drive_file_id === driveImage.drive_file_id, "DRIVE_FILE_ID_CONFLICT");
          if (img.drive_sha256) require_(img.drive_sha256 === driveImage.sha256, "DRIVE_SHA_CONFLICT");
          require_(driveImage.artifact_path === img.artifact_path, "DRIVE_IMAGE_PATH_MISMATCH");
          var size = requireInteger_(img.file_size_bytes, "IMAGE_FILE_SIZE_INVALID", 1);
          require_(driveImage.file_size_bytes === size, "DRIVE_MANIFEST_FILE_SIZE_MISMATCH");
          var mime = requireText_(driveImage.mime_type, "IMAGE_MIME_TYPE_MISSING", 100);
          if (img.mime_type) require_(img.mime_type === mime, "IMAGE_MIME_TYPE_CONFLICT");
          verifyDriveFile_(driveImage.drive_file_id, { file_size_bytes: size, mime_type: mime, sha256: img.sha256 });

          var stagingId = stableId_("stgimg", runId + "|" + img.sha256 + "|" + img.artifact_path);
          var staging = buildStaging_(img, driveImage, options, catalogId, runId, stagingId);
          var stagingFields = Object.keys(staging).filter(function (field) {
            return ["Created_At", "Updated_At", "Proposed_Status", "Quality_Status",
              "Candidate_Product_ID", "Candidate_Variant_ID", "Image_Role"].indexOf(field) < 0;
          });
          var stagingCreated = ensureRecord_("Staging_Images", "Staging_ID", staging, stagingFields, "STAGING_CONFLICT");
          if (stagingCreated) counts.staging += 1;

          var reviewId = stableId_("revimg", stagingId);
          var review = {
            Review_Queue_ID: reviewId,
            Review_Type: "IMAGE_QUALITY",
            Priority: "NORMAL",
            Review_Status: "OPEN",
            Proposed_Action: "Review image quality and decide whether it is suitable for use.",
            Created_At: staging.Created_At,
            Created_By: actor
          };
          // Review status and assignment may be changed by a human after creation;
          // retries verify identity fields without resetting that human decision.
          var reviewCreated = ensureRecord_("Review_Queue", "Review_Queue_ID", review,
            ["Review_Type", "Priority", "Proposed_Action", "Created_By"], "REVIEW_QUEUE_CONFLICT");
          if (reviewCreated) counts.reviews += 1;

          var linkId = stableId_("rsl", reviewId + "|" + stagingId);
          var link = {
            Review_Staging_Link_ID: linkId,
            Review_Queue_ID: reviewId,
            Staging_ID: stagingId,
            Review_Role: "PRIMARY",
            Created_At: staging.Created_At,
            Created_By: actor
          };
          var linkCreated = ensureRecord_("Review_Staging_Links", "Review_Staging_Link_ID", link,
            ["Review_Queue_ID", "Staging_ID", "Review_Role", "Created_By"], "REVIEW_STAGING_LINK_CONFLICT");
          if (linkCreated) counts.links += 1;

          if (!stagingCreated && !reviewCreated && !linkCreated) counts.reused += 1;
          results.push({
            sha256: img.sha256, staging_id: stagingId, review_id: reviewId,
            status: stagingCreated || reviewCreated || linkCreated ? "CREATED_OR_COMPLETED" : "REUSED"
          });
        } catch (err) {
          var code = String(err && err.message ? err.message : "IMAGE_INTAKE_FAILED");
          counts.failed += 1;
          if (code.indexOf("CONFLICT") >= 0) counts.conflicts += 1;
          results.push({ sha256: img.sha256, status: "FAILED", reason: code });
        }
      });
      var finalStatus = counts.failed ? (counts.staging + counts.reviews + counts.links + counts.reused ? "PARTIAL" : "FAILED") : "COMPLETED";
      return {
        status: finalStatus,
        catalog_id: catalogId,
        run_id: runId,
        counts: counts,
        results: results
      };
    } finally {
      lock.releaseLock();
    }
  }

  return { intake: intake };
})();
