/** Image Review Intake

Accepts the two manifests published by the Python worker after Drive upload
(image-manifest.json + drive-image-manifest.json) and creates human-review
staging records.

Does NOT write to Image_Assets or Image_Links.
Does NOT auto-link images to products or variants.
Does NOT call ImagePromotion.
*/
var ImageReviewIntake = (function () {
  function now_() { return new Date().toISOString(); }
  function sha_(value) {
    var bytes = typeof value === "string" ? Utilities.newBlob(value).getBytes() : value;
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes).map(function (b) {
      var n = b < 0 ? b + 256 : b, hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }
  function stableId_(prefix, seed) { return prefix + "_" + sha_(String(seed)).slice(0, 16); }
  function text_(value, limit) {
    var t = value === undefined || value === null ? "" : String(value).trim();
    return t.length > limit ? t.slice(0, limit) : t;
  }
  function require_(cond, code) { if (!cond) throw new Error(code); }
  function existingBy_(table, column, value) {
    return value ? SheetsRepository.getBy(table, column, value) : null;
  }
  function appendOnce_(table, record) { return SheetsRepository.append(table, record); }

  function loadManifest_(fileId, expectedSha) {
    require_(fileId && /^[A-Za-z0-9_-]{10,200}$/.test(fileId), "MANIFEST_FILE_ID_INVALID");
    var file = DriveApp.getFileById(fileId);
    if (!file) throw new Error("MANIFEST_FILE_NOT_FOUND");
    var blob = file.getBlob();
    var bytes = blob.getBytes();
    var computed = sha_(bytes);
    if (expectedSha && computed !== expectedSha) throw new Error("MANIFEST_SHA_MISMATCH");
    var content = blob.getDataAsString();
    var data;
    try { data = JSON.parse(content); } catch (e) { throw new Error("MANIFEST_INVALID_JSON"); }
    if (!data || !data.manifest_sha256) throw new Error("MANIFEST_STRUCTURE_INVALID");
    // Re-verify internal checksum if possible (simple structural check)
    return { data: data, sha: computed };
  }

  function verifyDriveFile_(driveFileId, expected) {
    require_(driveFileId, "DRIVE_FILE_ID_MISSING");
    var file;
    try { file = DriveApp.getFileById(driveFileId); } catch (e) { throw new Error("DRIVE_FILE_NOT_FOUND"); }
    if (!file) throw new Error("DRIVE_FILE_NOT_FOUND");
    var size = file.getSize();
    var mime = file.getMimeType();
    if (expected.file_size_bytes && size !== expected.file_size_bytes) {
      throw new Error("DRIVE_FILE_SIZE_MISMATCH");
    }
    if (expected.mime_type && mime !== expected.mime_type) {
      throw new Error("DRIVE_FILE_MIME_MISMATCH");
    }
    // SHA-256 of Drive file when feasible (Apps Script can compute on blob)
    if (expected.sha256) {
      var blob = file.getBlob();
      var actual = sha_(blob.getBytes());
      if (actual !== expected.sha256) throw new Error("DRIVE_FILE_SHA_MISMATCH");
    }
    return { size: size, mime: mime };
  }

  function intake(options) {
    require_(options && options.imageManifestFileId && options.driveManifestFileId, "INTAKE_ARGUMENTS_INVALID");
    var imageManifest = loadManifest_(options.imageManifestFileId, options.imageManifestSha256);
    var driveManifest = loadManifest_(options.driveManifestFileId, options.driveManifestSha256);

    var imgData = imageManifest.data;
    var drvData = driveManifest.data;
    require_(imgData.catalog_id === drvData.catalog_id, "CATALOG_ID_MISMATCH");
    require_(imgData.run_id === drvData.run_id, "RUN_ID_MISMATCH");

    var catalogId = text_(imgData.catalog_id, 120);
    var runId = text_(imgData.run_id, 120);
    require_(catalogId && runId, "CATALOG_OR_RUN_MISSING");

    // Index drive records by sha256 + artifact_path
    var driveByKey = {};
    (drvData.images || []).forEach(function (d) {
      if (d && d.sha256 && d.artifact_path && d.upload_status === "UPLOADED" && d.drive_file_id) {
        var key = d.sha256 + "|" + d.artifact_path;
        driveByKey[key] = d;
      }
    });

    var actor = options.actor || APP.ACTOR_ID;
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var created = { staging: 0, reviews: 0, links: 0, skipped: 0, conflicts: 0 };
      var results = [];

      (imgData.images || []).forEach(function (img) {
        if (!img || !img.sha256 || !img.artifact_path) {
          results.push({ sha256: img && img.sha256, status: "SKIPPED", reason: "INCOMPLETE_IMAGE_RECORD" });
          created.skipped += 1;
          return;
        }
        var key = img.sha256 + "|" + img.artifact_path;
        var drv = driveByKey[key];
        if (!drv || drv.drive_file_id !== (img.drive_file_id || drv.drive_file_id)) {
          results.push({ sha256: img.sha256, status: "REJECTED", reason: "DRIVE_RECORD_MISMATCH" });
          created.skipped += 1;
          return;
        }
        if (drv.drive_file_id !== img.drive_file_id && img.drive_file_id) {
          results.push({ sha256: img.sha256, status: "REJECTED", reason: "DRIVE_FILE_ID_MISMATCH" });
          created.skipped += 1;
          return;
        }

        try {
          verifyDriveFile_(drv.drive_file_id, {
            file_size_bytes: img.file_size_bytes || drv.file_size_bytes,
            mime_type: img.mime_type || drv.mime_type,
            sha256: img.sha256
          });
        } catch (e) {
          results.push({ sha256: img.sha256, status: "REJECTED", reason: e.message });
          created.skipped += 1;
          return;
        }

        var stagingId = stableId_("stgimg", runId + "|" + img.sha256 + "|" + img.artifact_path);
        var existing = existingBy_("Staging_Images", "Staging_ID", stagingId);
        if (existing) {
          if (existing.SHA256 !== img.sha256 || existing.Proposed_Image_File_ID !== drv.drive_file_id) {
            throw new Error("STAGING_CONFLICT");
          }
          created.skipped += 1;
          results.push({ sha256: img.sha256, staging_id: stagingId, status: "REUSED" });
          return;
        }

        var hash = sha_(JSON.stringify({
          run_id: runId, catalog_id: catalogId, sha256: img.sha256,
          drive_file_id: drv.drive_file_id, artifact_path: img.artifact_path
        }));

        var staging = {
          Staging_ID: stagingId,
          Run_ID: runId,
          Catalog_ID: catalogId,
          Catalog_Page_ID: text_(img.catalog_page_id, 120),
          Raw_Extract_File_ID: options.imageManifestFileId,
          Extraction_Method: "IMAGE_EXTRACTION",
          Extraction_Tool_Version: text_(img.extractor_version || "0.1.0", 40),
          Proposed_Status: "NEEDS_REVIEW",
          Staging_Record_Hash: hash,
          Proposed_Image_File_ID: drv.drive_file_id,
          Original_File_Name: text_(img.original_name, 255),
          MIME_Type: text_(img.mime_type, 100),
          Width_PX: img.width_px || "",
          Height_PX: img.height_px || "",
          File_Size_Bytes: img.file_size_bytes || "",
          SHA256: img.sha256,
          Quality_Status: "NEEDS_REVIEW",
          Created_At: now_(),
          Updated_At: now_()
        };
        appendOnce_("Staging_Images", staging);
        created.staging += 1;

        var reviewId = stableId_("revimg", stagingId);
        var existingReview = existingBy_("Review_Queue", "Review_Queue_ID", reviewId);
        if (!existingReview) {
          appendOnce_("Review_Queue", {
            Review_Queue_ID: reviewId,
            Review_Type: "IMAGE_QUALITY",
            Priority: "NORMAL",
            Review_Status: "OPEN",
            Proposed_Action: "Review image quality and optionally associate with a product or variant.",
            Created_At: now_(),
            Created_By: actor
          });
          created.reviews += 1;
        }

        var linkId = stableId_("rsl", reviewId + "|" + stagingId);
        if (!existingBy_("Review_Staging_Links", "Review_Staging_Link_ID", linkId)) {
          appendOnce_("Review_Staging_Links", {
            Review_Staging_Link_ID: linkId,
            Review_Queue_ID: reviewId,
            Staging_ID: stagingId,
            Review_Role: "PRIMARY",
            Created_At: now_(),
            Created_By: actor
          });
          created.links += 1;
        }

        results.push({ sha256: img.sha256, staging_id: stagingId, review_id: reviewId, status: "CREATED" });
      });

      return {
        status: created.conflicts > 0 ? "CONFLICT" : "COMPLETED",
        catalog_id: catalogId,
        run_id: runId,
        counts: created,
        results: results
      };
    } finally {
      lock.releaseLock();
    }
  }

  return { intake: intake };
})();
