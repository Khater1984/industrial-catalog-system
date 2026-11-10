/** Image Management — Phase 4
 *
 * Professional domain service for linking images to products/variants,
 * independent catalog/datasheet approvals, primary image, and resolution.
 *
 * Reuses existing Image_Assets / Image_Links tables from Schema V2.1.
 * Does not create new tables. Does not modify source data.
 */
var ImageManagement = (function () {
  function now_() { return new Date().toISOString(); }
  function require_(condition, code) {
    if (!condition) throw new Error(code);
  }
  function text_(value, limit) {
    var t = value === undefined || value === null ? "" : String(value).trim();
    return limit && t.length > limit ? t.slice(0, limit) : t;
  }
  function sha_(value) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value)).map(function (b) {
      var n = b < 0 ? b + 256 : b, hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }
  function stableId_(prefix, seed) {
    return prefix + "_" + sha_(seed).slice(0, 16);
  }

  function getAsset_(imageId) {
    var asset = SheetsRepository.getBy("Image_Assets", "Image_ID", imageId);
    require_(asset, "IMAGE_ASSET_NOT_FOUND");
    require_(asset.Lifecycle_Status === "ACTIVE", "IMAGE_ASSET_NOT_ACTIVE");
    return asset;
  }

  function resolveTarget_(targetType, targetId) {
    require_(targetType === "PRODUCT" || targetType === "VARIANT", "IMAGE_TARGET_TYPE_INVALID");
    require_(text_(targetId, 120), "IMAGE_TARGET_ID_REQUIRED");
    if (targetType === "PRODUCT") {
      var p = SheetsRepository.getBy("Products", "Product_ID", targetId);
      require_(p, "PRODUCT_NOT_FOUND");
      require_(p.Lifecycle_Status !== "ARCHIVED", "PRODUCT_ARCHIVED");
    } else {
      var v = SheetsRepository.getBy("Variants", "Variant_ID", targetId);
      require_(v, "VARIANT_NOT_FOUND");
      require_(v.Lifecycle_Status !== "ARCHIVED", "VARIANT_ARCHIVED");
    }
    return { type: targetType, id: text_(targetId, 120) };
  }

  /** Link an existing image asset to a product or variant. */
  function linkToTarget(imageId, targetType, targetId, options) {
    options = options || {};
    var asset = getAsset_(imageId);
    var target = resolveTarget_(targetType, targetId);
    var actor = options.actor || APP.ACTOR_ID;
    var linkId = stableId_("imgl", asset.Image_ID + "|" + target.type + "|" + target.id);

    var existing = SheetsRepository.getBy("Image_Links", "Image_Link_ID", linkId);
    if (existing) {
      return { status: "EXISTS", linkId: linkId, imageId: asset.Image_ID, target: target };
    }

    SheetsRepository.append("Image_Links", {
      Image_Link_ID: linkId,
      Image_ID: asset.Image_ID,
      Target_Type: target.type,
      Target_ID: target.id,
      Is_Primary: Boolean(options.isPrimary),
      Catalog_Approved: Boolean(options.catalogApproved),
      DataSheet_Approved: Boolean(options.dataSheetApproved),
      Catalog_Order: Number(options.catalogOrder) || 0,
      DataSheet_Order: Number(options.dataSheetOrder) || 0,
      Link_Status: options.linkStatus || "CANDIDATE",
      Created_At: now_(),
      Created_By: actor,
      Updated_At: now_(),
      Updated_By: actor
    });

    return { status: "CREATED", linkId: linkId, imageId: asset.Image_ID, target: target };
  }

  /** Approve or reject a link for catalog and/or datasheet independently. */
  function setApproval(linkId, approval) {
    require_(linkId, "IMAGE_LINK_ID_REQUIRED");
    var link = SheetsRepository.getBy("Image_Links", "Image_Link_ID", linkId);
    require_(link, "IMAGE_LINK_NOT_FOUND");
    var actor = approval.actor || APP.ACTOR_ID;
    var patch = { Updated_At: now_(), Updated_By: actor };

    if (typeof approval.catalogApproved === "boolean") {
      patch.Catalog_Approved = approval.catalogApproved;
    }
    if (typeof approval.dataSheetApproved === "boolean") {
      patch.DataSheet_Approved = approval.dataSheetApproved;
    }
    if (approval.linkStatus) {
      require_(["CANDIDATE", "ACTIVE", "REJECTED", "ARCHIVED"].indexOf(approval.linkStatus) >= 0, "IMAGE_LINK_STATUS_INVALID");
      patch.Link_Status = approval.linkStatus;
    }

    SheetsRepository.updateBy("Image_Links", "Image_Link_ID", linkId, patch);
    return { status: "UPDATED", linkId: linkId };
  }

  /** Set primary image for a target (clears previous primary). */
  function setPrimary(linkId) {
    var link = SheetsRepository.getBy("Image_Links", "Image_Link_ID", linkId);
    require_(link, "IMAGE_LINK_NOT_FOUND");
    var actor = APP.ACTOR_ID;

    // Clear other primaries for same target
    var all = SheetsRepository.listAll("Image_Links") || [];
    all.forEach(function (row) {
      if (row.Target_Type === link.Target_Type && row.Target_ID === link.Target_ID && row.Is_Primary && row.Image_Link_ID !== linkId) {
        SheetsRepository.updateBy("Image_Links", "Image_Link_ID", row.Image_Link_ID, {
          Is_Primary: false,
          Updated_At: now_(),
          Updated_By: actor
        });
      }
    });

    SheetsRepository.updateBy("Image_Links", "Image_Link_ID", linkId, {
      Is_Primary: true,
      Link_Status: "ACTIVE",
      Updated_At: now_(),
      Updated_By: actor
    });

    return { status: "PRIMARY_SET", linkId: linkId };
  }

  /** Resolve effective images for a product (and optional variant). */
  function getImagesForProduct(productId, variantId) {
    require_(productId, "PRODUCT_ID_REQUIRED");
    var productLinks = (SheetsRepository.listAll("Image_Links") || []).filter(function (l) {
      return l.Target_Type === "PRODUCT" && l.Target_ID === productId && l.Link_Status !== "REJECTED" && l.Link_Status !== "ARCHIVED";
    });

    var variantLinks = [];
    if (variantId) {
      variantLinks = (SheetsRepository.listAll("Image_Links") || []).filter(function (l) {
        return l.Target_Type === "VARIANT" && l.Target_ID === variantId && l.Link_Status !== "REJECTED" && l.Link_Status !== "ARCHIVED";
      });
    }

    // Variant images take precedence for display
    var effective = variantLinks.length ? variantLinks : productLinks;
    var assets = [];

    effective.forEach(function (link) {
      var asset = SheetsRepository.getBy("Image_Assets", "Image_ID", link.Image_ID);
      if (asset && asset.Lifecycle_Status === "ACTIVE") {
        assets.push({
          imageId: asset.Image_ID,
          driveFileId: asset.Original_File_ID,
          name: asset.Original_File_Name,
          mimeType: asset.MIME_Type,
          width: asset.Width_PX,
          height: asset.Height_PX,
          sha256: asset.SHA256,
          isPrimary: Boolean(link.Is_Primary),
          catalogApproved: Boolean(link.Catalog_Approved),
          dataSheetApproved: Boolean(link.DataSheet_Approved),
          linkStatus: link.Link_Status,
          source: link.Target_Type
        });
      }
    });

    // Sort: primary first, then by order
    assets.sort(function (a, b) {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      return 0;
    });

    return {
      productId: productId,
      variantId: variantId || null,
      images: assets,
      count: assets.length
    };
  }

  /** Check for exact SHA256 duplicate before creating a new asset. */
  function findDuplicateBySha256(sha256) {
    require_(/^[a-f0-9]{64}$/.test(String(sha256 || "").toLowerCase()), "IMAGE_SHA256_INVALID");
    var digest = String(sha256).toLowerCase();
    var all = SheetsRepository.listAll("Image_Assets") || [];
    for (var i = 0; i < all.length; i++) {
      if (all[i].SHA256 === digest && all[i].Lifecycle_Status === "ACTIVE") {
        return { duplicate: true, imageId: all[i].Image_ID, driveFileId: all[i].Original_File_ID };
      }
    }
    return { duplicate: false };
  }

  return {
    linkToTarget: linkToTarget,
    setApproval: setApproval,
    setPrimary: setPrimary,
    getImagesForProduct: getImagesForProduct,
    findDuplicateBySha256: findDuplicateBySha256
  };
})();
