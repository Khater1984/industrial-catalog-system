/** Promotes accepted image staging records into Image_Assets / Image_Links.

This is a companion to StagingPromotion. It expects an image-manifest or
staging.images array with Drive file IDs already uploaded (or local paths
for DEV). Source images are immutable.
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
  function appendOnce_(table, record) { return SheetsRepository.append(table, record); }
  function existingBy_(table, column, value) {
    return value ? SheetsRepository.getBy(table, column, value) : null;
  }

  function promoteAcceptedImages(options) {
    if (!options || !options.images) return { status: "SKIPPED", reason: "NO_IMAGES" };
    var actor = options.actor || APP.ACTOR_ID;
    var runId = text_(options.run_id, 120);
    var catalogId = text_(options.catalog_id, 120);
    var counts = { assets: 0, links: 0, skipped: 0 };

    (options.images || []).forEach(function (img) {
      if (img.review_status && img.review_status !== "ACCEPTED") {
        counts.skipped += 1;
        return;
      }
      var digest = text_(img.sha256, 64);
      if (!digest || digest.length !== 64) {
        counts.skipped += 1;
        return;
      }
      var imageId = stableId_("img", digest);
      var existing = existingBy_("Image_Assets", "Image_ID", imageId);
      if (existing) {
        counts.skipped += 1;
        return;
      }
      appendOnce_("Image_Assets", {
        Image_ID: imageId,
        Original_File_ID: text_(img.drive_file_id || "", 120),
        Original_File_Name: text_(img.original_name, 255),
        MIME_Type: text_(img.mime_type, 100),
        Width_PX: Number(img.width_px) || 0,
        Height_PX: Number(img.height_px) || 0,
        File_Size_Bytes: Number(img.file_size_bytes) || 0,
        Has_Alpha: false,
        Orientation: "NORMALIZED",
        SHA256: digest,
        Source_Type: "CATALOG_EMBEDDED",
        Source_Catalog_ID: catalogId,
        Source_Catalog_Page_ID: text_(img.catalog_page_id, 120),
        Source_Page_Label: String(img.page_number || ""),
        Quality_Status: "UNASSESSED",
        Lifecycle_Status: "ACTIVE",
        Created_At: now_(),
        Created_By: actor
      });
      counts.assets += 1;

      // Optional link if target provided
      if (img.target_type && img.target_id) {
        var linkId = stableId_("imgl", imageId + "|" + img.target_type + "|" + img.target_id);
        if (!existingBy_("Image_Links", "Image_Link_ID", linkId)) {
          appendOnce_("Image_Links", {
            Image_Link_ID: linkId,
            Image_ID: imageId,
            Target_Type: img.target_type,
            Target_ID: img.target_id,
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
