/** Image Management — Phase 4
 *
 * Manages links and independent catalog/datasheet approval without changing
 * extracted source assets. Only ACTIVE links with the relevant approval are
 * returned for a publication use.
 */
var ImageManagement = (function () {
  function now_() { return new Date().toISOString(); }
  function require_(condition, code) { if (!condition) throw new Error(code); }
  function text_(value, limit) {
    var t = value === undefined || value === null ? "" : String(value).trim();
    require_(t.length > 0, "IMAGE_TEXT_REQUIRED");
    require_(!limit || t.length <= limit, "IMAGE_TEXT_INVALID");
    return t;
  }
  function sha_(value) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value)).map(function (b) {
      var n = b < 0 ? b + 256 : b, hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }
  function stableId_(prefix, seed) { return prefix + "_" + sha_(seed).slice(0, 16); }
  function actor_(value) { return text_(value || APP.ACTOR_ID, 120); }

  function getAsset_(imageId) {
    var asset = SheetsRepository.getBy("Image_Assets", "Image_ID", text_(imageId, 120));
    require_(asset, "IMAGE_ASSET_NOT_FOUND");
    require_(asset.Lifecycle_Status === "ACTIVE", "IMAGE_ASSET_NOT_ACTIVE");
    return asset;
  }
  function resolveTarget_(targetType, targetId) {
    require_(targetType === "PRODUCT" || targetType === "VARIANT", "IMAGE_TARGET_TYPE_INVALID");
    targetId = text_(targetId, 120);
    if (targetType === "PRODUCT") {
      var product = SheetsRepository.getBy("Products", "Product_ID", targetId);
      require_(product, "PRODUCT_NOT_FOUND");
      require_(product.Lifecycle_Status === "ACTIVE", "PRODUCT_NOT_ACTIVE");
    } else {
      var variant = SheetsRepository.getBy("Variants", "Variant_ID", targetId);
      require_(variant, "VARIANT_NOT_FOUND");
      require_(variant.Lifecycle_Status === "ACTIVE", "VARIANT_NOT_ACTIVE");
      var parent = SheetsRepository.getBy("Products", "Product_ID", variant.Product_ID);
      require_(parent && parent.Lifecycle_Status === "ACTIVE", "VARIANT_PARENT_PRODUCT_NOT_ACTIVE");
    }
    return { type: targetType, id: targetId };
  }
  function linkToTarget(imageId, targetType, targetId, options) {
    options = options || {};
    var asset = getAsset_(imageId);
    var target = resolveTarget_(targetType, targetId);
    var linkId = stableId_("imgl", asset.Image_ID + "|" + target.type + "|" + target.id);
    var existing = SheetsRepository.getBy("Image_Links", "Image_Link_ID", linkId);
    if (existing) return { status: "EXISTS", linkId: linkId, imageId: asset.Image_ID, target: target };
    var catalogApproved = options.catalogApproved === true;
    var dataSheetApproved = options.dataSheetApproved === true;
    var linkStatus = options.linkStatus || "CANDIDATE";
    require_(["CANDIDATE", "ACTIVE", "REJECTED", "ARCHIVED"].indexOf(linkStatus) >= 0, "IMAGE_LINK_STATUS_INVALID");
    if (linkStatus === "ACTIVE") {
      require_(catalogApproved || dataSheetApproved, "IMAGE_ACTIVE_REQUIRES_APPROVAL");
    }
    require_(!options.isPrimary || (linkStatus === "ACTIVE" && (catalogApproved || dataSheetApproved)),
      "IMAGE_PRIMARY_REQUIRES_ACTIVE_APPROVAL");
    var actor = actor_(options.actor);
    SheetsRepository.append("Image_Links", {
      Image_Link_ID: linkId, Image_ID: asset.Image_ID,
      Target_Type: target.type, Target_ID: target.id,
      Is_Primary: false,
      Catalog_Approved: catalogApproved, DataSheet_Approved: dataSheetApproved,
      Catalog_Order: Number(options.catalogOrder) || 0,
      DataSheet_Order: Number(options.dataSheetOrder) || 0,
      Link_Status: linkStatus, Created_At: now_(), Created_By: actor,
      Updated_At: now_(), Updated_By: actor
    });
    if (options.isPrimary) setPrimary(linkId, actor);
    return { status: "CREATED", linkId: linkId, imageId: asset.Image_ID, target: target };
  }

  function setApproval(linkId, approval) {
    linkId = text_(linkId, 120);
    approval = approval || {};
    var link = SheetsRepository.getBy("Image_Links", "Image_Link_ID", linkId);
    require_(link, "IMAGE_LINK_NOT_FOUND");
    var asset = getAsset_(link.Image_ID);
    var patch = { Updated_At: now_(), Updated_By: actor_(approval.actor) };
    if (typeof approval.catalogApproved === "boolean") patch.Catalog_Approved = approval.catalogApproved;
    if (typeof approval.dataSheetApproved === "boolean") patch.DataSheet_Approved = approval.dataSheetApproved;
    if (approval.linkStatus !== undefined && approval.linkStatus !== null && approval.linkStatus !== "") {
      require_(["CANDIDATE", "ACTIVE", "REJECTED", "ARCHIVED"].indexOf(approval.linkStatus) >= 0, "IMAGE_LINK_STATUS_INVALID");
      patch.Link_Status = approval.linkStatus;
    }
    var nextCatalog = Object.prototype.hasOwnProperty.call(patch, "Catalog_Approved") ? patch.Catalog_Approved : link.Catalog_Approved === true;
    var nextSheet = Object.prototype.hasOwnProperty.call(patch, "DataSheet_Approved") ? patch.DataSheet_Approved : link.DataSheet_Approved === true;
    var nextStatus = patch.Link_Status || link.Link_Status;
    if (nextStatus === "ACTIVE") {
      require_(asset.Lifecycle_Status === "ACTIVE", "IMAGE_ASSET_NOT_ACTIVE");
      require_(nextCatalog || nextSheet, "IMAGE_ACTIVE_REQUIRES_APPROVAL");
    }
    if (nextStatus === "REJECTED" || nextStatus === "ARCHIVED") {
      patch.Catalog_Approved = false;
      patch.DataSheet_Approved = false;
      patch.Is_Primary = false;
    } else if (!nextCatalog && !nextSheet) {
      patch.Is_Primary = false;
    }
    SheetsRepository.updateBy("Image_Links", "Image_Link_ID", linkId, patch);
    return { status: "UPDATED", linkId: linkId, linkStatus: nextStatus };
  }

  function setPrimary(linkId, actor, lockAlreadyHeld) {
    linkId = text_(linkId, 120);
    var link = SheetsRepository.getBy("Image_Links", "Image_Link_ID", linkId);
    require_(link, "IMAGE_LINK_NOT_FOUND");
    getAsset_(link.Image_ID);
    require_(link.Link_Status === "ACTIVE", "IMAGE_LINK_NOT_ACTIVE");
    require_(link.Catalog_Approved === true || link.DataSheet_Approved === true, "IMAGE_PRIMARY_REQUIRES_APPROVAL");
    resolveTarget_(link.Target_Type, link.Target_ID);
    var lock = lockAlreadyHeld ? null : LockService.getScriptLock();
    if (lock) lock.waitLock(30000);
    try {
      var rows = SheetsRepository.listAll("Image_Links") || [];
      var actorId = actor_(actor);
      rows.forEach(function (row) {
        if (row.Target_Type === link.Target_Type && row.Target_ID === link.Target_ID &&
            row.Is_Primary === true && row.Image_Link_ID !== linkId) {
          SheetsRepository.updateBy("Image_Links", "Image_Link_ID", row.Image_Link_ID, {
            Is_Primary: false, Updated_At: now_(), Updated_By: actorId
          });
        }
      });
      SheetsRepository.updateBy("Image_Links", "Image_Link_ID", linkId, {
        Is_Primary: true, Updated_At: now_(), Updated_By: actorId
      });
    } finally {
      if (lock) lock.releaseLock();
    }
    return { status: "PRIMARY_SET", linkId: linkId };
  }

  function sortImages_(items, orderField) {
    items.sort(function (a, b) {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      var diff = (Number(a[orderField]) || 0) - (Number(b[orderField]) || 0);
      if (diff) return diff;
      return String(a.imageId).localeCompare(String(b.imageId));
    });
    return items;
  }
  function project_(links, approvedField, orderField) {
    var result = [];
    links.forEach(function (link) {
      if (link.Link_Status !== "ACTIVE" || link[approvedField] !== true) return;
      var asset = SheetsRepository.getBy("Image_Assets", "Image_ID", link.Image_ID);
      if (!asset || asset.Lifecycle_Status !== "ACTIVE") return;
      result.push({
        imageId: asset.Image_ID, driveFileId: asset.Original_File_ID,
        name: asset.Original_File_Name, mimeType: asset.MIME_Type,
        width: asset.Width_PX, height: asset.Height_PX, sha256: asset.SHA256,
        isPrimary: link.Is_Primary === true, catalogApproved: link.Catalog_Approved === true,
        dataSheetApproved: link.DataSheet_Approved === true, linkStatus: link.Link_Status,
        source: link.Target_Type, catalogOrder: Number(link.Catalog_Order) || 0,
        dataSheetOrder: Number(link.DataSheet_Order) || 0
      });
    });
    return sortImages_(result, orderField);
  }
  function getImagesForProduct(productId, variantId, usage) {
    var product = resolveTarget_("PRODUCT", productId);
    usage = usage || "ALL";
    require_(["ALL", "CATALOG", "DATASHEET"].indexOf(usage) >= 0, "IMAGE_USAGE_INVALID");
    var allLinks = SheetsRepository.listAll("Image_Links") || [];
    var productLinks = allLinks.filter(function (l) {
      return l.Target_Type === "PRODUCT" && l.Target_ID === product.id;
    });
    var variantLinks = [];
    if (variantId) {
      var variant = resolveTarget_("VARIANT", variantId);
      require_(variant.id && SheetsRepository.getBy("Variants", "Variant_ID", variant.id).Product_ID === product.id,
        "VARIANT_PRODUCT_MISMATCH");
      variantLinks = allLinks.filter(function (l) {
        return l.Target_Type === "VARIANT" && l.Target_ID === variant.id;
      });
    }
    function select_(field, order) {
      var variantImages = project_(variantLinks, field, order);
      return variantImages.length ? variantImages : project_(productLinks, field, order);
    }
    var catalog = select_("Catalog_Approved", "catalogOrder");
    var dataSheet = select_("DataSheet_Approved", "dataSheetOrder");
    var images = usage === "CATALOG" ? catalog : usage === "DATASHEET" ? dataSheet :
      catalog.concat(dataSheet.filter(function (item) {
        return !catalog.some(function (c) { return c.imageId === item.imageId; });
      }));
    return { productId: product.id, variantId: variantId || null, usage: usage,
      images: images, catalogImages: catalog, dataSheetImages: dataSheet, count: images.length };
  }

  function findDuplicateBySha256(sha256) {
    require_(/^[a-f0-9]{64}$/i.test(String(sha256 || "")), "IMAGE_SHA256_INVALID");
    var digest = String(sha256).toLowerCase();
    var all = SheetsRepository.listAll("Image_Assets") || [];
    for (var i = 0; i < all.length; i++) {
      if (String(all[i].SHA256 || "").toLowerCase() === digest && all[i].Lifecycle_Status === "ACTIVE") {
        return { duplicate: true, imageId: all[i].Image_ID, driveFileId: all[i].Original_File_ID };
      }
    }
    return { duplicate: false };
  }
  return { linkToTarget: linkToTarget, setApproval: setApproval, setPrimary: setPrimary,
    getImagesForProduct: getImagesForProduct, findDuplicateBySha256: findDuplicateBySha256 };
})();
