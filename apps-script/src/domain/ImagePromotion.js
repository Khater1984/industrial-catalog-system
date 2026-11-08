/** Promotes accepted image staging records into Image_Assets / Image_Links.

Images must already exist in Drive. This module refuses incomplete image metadata
instead of writing invalid rows that violate Schema V2.1.
*/
var ImagePromotion = (function () {
  function now_() { return new Date().toISOString(); }
  function sha_(value) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value).map(function (b) {
      var n = b < 0 ? b + 256 : b, hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }
  function stableId_(prefix, seed) { return prefix + "_" + sha_(String(seed)).slice(0, 16); }
  function text_(value, limit) {
    var text = value === undefined || value === null ? "" : String(value).trim();
    return text.length > limit ? text.slice(0, limit) : text;
  }
  function require_(condition, code) {
    if (!condition) throw new Error(code);
  }
  function appendOnce_(table, record) { return SheetsRepository.append(table, record); }
  function existingBy_(table, column, value) {
    return value ? SheetsRepository.getBy(table, column, value) : null;
  }

  function promoteAcceptedImages(options) {
    require_(options && Array.isArray(options.images), "IMAGE_PROMOTION_IMAGES_INVALID");
    var actor = options.actor || APP.ACTOR_ID;
    var catalogId = text_(options.catalog_id, 120);
    var counts = { assets: 0, links: 0, skipped: 0 };

    options.images.forEach(function (img) {
      if (!img || img.review_status !== "ACCEPTED") {
        counts.skipped += 1;
        return;
      }

      var digest = text_(img.sha256, 64).toLowerCase();
      require_(/^[a-f0-9]{64}$/.test(digest), "IMAGE_SHA256_INVALID");
      var driveFileId = text_(img.drive_file_id, 120);
      require_(driveFileId, "IMAGE_DRIVE_FILE_ID_REQUIRED");
      var originalName = text_(img.original_name, 255);
      var mimeType = text_(img.mime_type, 100);
      var width = Number(img.width_px);
      var height = Number(img.height_px);
      var fileSize = Number(img.file_size_bytes);
      require_(originalName && mimeType, "IMAGE_FILE_METADATA_REQUIRED");
      require_(Number.isInteger(width) && width > 0, "IMAGE_WIDTH_REQUIRED");
      require_(Number.isInteger(height) && height > 0, "IMAGE_HEIGHT_REQUIRED");
      require_(Number.isInteger(fileSize) && fileSize > 0, "IMAGE_FILE_SIZE_REQUIRED");

      var imageId = stableId_("img", digest);
      var existingAsset = existingBy_("Image_Assets", "Image_ID", imageId);
      if (!existingAsset) {
        appendOnce_("Image_Assets", {
          Image_ID: imageId,
          Original_File_ID: driveFileId,
          Original_File_Name: originalName,
          MIME_Type: mimeType,
          Width_PX: width,
          Height_PX: height,
          File_Size_Bytes: fileSize,
          Has_Alpha: Boolean(img.has_alpha),
          Orientation: "NORMALIZED",
          SHA256: digest,
          Source_Type: "CATALOG_EMBEDDED",
          Source_Catalog_ID: catalogId,
          Source_Catalog_Page_ID: text_(img.catalog_page_id, 120),
          Source_Page_Label: text_(img.page_number, 80),
          Quality_Status: "UNASSESSED",
          Lifecycle_Status: "ACTIVE",
          Created_At: now_(),
          Created_By: actor
        });
        counts.assets += 1;
      }

      // Create a missing link even when the asset already exists (safe retry).
      if (img.target_type || img.target_id) {
        require_(img.target_type === "PRODUCT" || img.target_type === "VARIANT", "IMAGE_TARGET_TYPE_INVALID");
        require_(text_(img.target_id, 120), "IMAGE_TARGET_ID_REQUIRED");
        var linkId = stableId_("imgl", imageId + "|" + img.target_type + "|" + img.target_id);
        if (!existingBy_("Image_Links", "Image_Link_ID", linkId)) {
          appendOnce_("Image_Links", {
            Image_Link_ID: linkId,
            Image_ID: imageId,
            Target_Type: img.target_type,
            Target_ID: text_(img.target_id, 120),
            Is_Primary: false,
            Catalog_Approved: false,
            DataSheet_Approved: false,
            Catalog_Order: 0,
            DataSheet_Order: 0,
            Link_Status: "CANDIDATE",
            Created_At: now_(),
            Created_By: actor,
            Updated_At: now_(),
            Updated_By: actor
          });
          counts.links += 1;
        }
      }
    });

    return { status: "COMPLETED", counts: counts };
  }

  return { promoteAcceptedImages: promoteAcceptedImages };
})();
