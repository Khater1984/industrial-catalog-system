/** Product domain service — canonical identity + company fields.
 * Does not create source records or specifications.
 */
var ProductService = (function () {
  function now_() { return new Date().toISOString(); }
  function sha_(value) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value)).map(function (b) {
      var n = b < 0 ? b + 256 : b, hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }
  function stableId_(prefix, seed) { return prefix + "_" + sha_(seed).slice(0, 16); }
  function text_(v, limit) { var t = v == null ? "" : String(v).trim(); return t.length > limit ? t.slice(0, limit) : t; }
  function require_(c, code) { if (!c) throw new Error(code); }
  function audit_(actor, action, entityType, entityId, reason) {
    SheetsRepository.append("Audit_Log", {
      Audit_ID: stableId_("aud", action + "|" + entityType + "|" + entityId + "|" + now_()),
      Event_Idempotency_Key: text_(action + "|" + entityId, 180),
      Payload_SHA256: sha_(entityId),
      Event_At: now_(),
      Actor_ID: actor,
      Action: action,
      Entity_Type: entityType,
      Entity_ID: entityId,
      Reason: text_(reason, 1000)
    });
  }

  function create(options) {
    require_(options && options.actor, "PRODUCT_ACTOR_REQUIRED");
    var productId = stableId_("prd", options.idempotencyKey || Utilities.getUuid());
    var existing = SheetsRepository.getBy("Products", "Product_ID", productId);
    if (existing) return { productId: productId, reused: true };
    SheetsRepository.append("Products", {
      Product_ID: productId,
      Lifecycle_Status: "ACTIVE",
      Canonical_Notes: text_(options.notes, 2000),
      Created_At: now_(),
      Created_By: options.actor
    });
    SheetsRepository.append("Product_Company", {
      Product_ID: productId,
      Product_Name_EN: text_(options.nameEn, 300),
      Product_Name_AR: text_(options.nameAr, 300),
      Company_Description: text_(options.description, 4000),
      Manufacturer_or_Product_Brand_Label: text_(options.brandLabel, 160),
      Product_Family_ID: options.familyId || "",
      Company_Notes: text_(options.notes, 4000),
      Updated_At: now_(),
      Updated_By: options.actor
    });
    audit_(options.actor, "CREATE", "PRODUCT", productId, "Manual product created");
    return { productId: productId, reused: false };
  }

  function getWorkspace(productId) {
    var product = SheetsRepository.getBy("Products", "Product_ID", productId);
    require_(product, "PRODUCT_NOT_FOUND");
    var company = SheetsRepository.getBy("Product_Company", "Product_ID", productId) || {};
    var variants = (SheetsRepository.listAll("Variants") || []).filter(function (v) { return v.Product_ID === productId; });
    return { product: product, company: company, variants: variants };
  }

  function updateCompany(productId, fields, actor) {
    require_(SheetsRepository.getBy("Products", "Product_ID", productId), "PRODUCT_NOT_FOUND");
    var patch = { Updated_At: now_(), Updated_By: actor };
    if (fields.nameEn !== undefined) patch.Product_Name_EN = text_(fields.nameEn, 300);
    if (fields.nameAr !== undefined) patch.Product_Name_AR = text_(fields.nameAr, 300);
    if (fields.description !== undefined) patch.Company_Description = text_(fields.description, 4000);
    if (fields.brandLabel !== undefined) patch.Manufacturer_or_Product_Brand_Label = text_(fields.brandLabel, 160);
    if (fields.notes !== undefined) patch.Company_Notes = text_(fields.notes, 4000);
    if (fields.familyId !== undefined) patch.Product_Family_ID = fields.familyId || "";
    SheetsRepository.updateBy("Product_Company", "Product_ID", productId, patch);
    audit_(actor, "UPDATE", "PRODUCT_COMPANY", productId, "Company fields updated");
    return { ok: true };
  }

  function archive(productId, actor) {
    var product = SheetsRepository.getBy("Products", "Product_ID", productId);
    require_(product, "PRODUCT_NOT_FOUND");
    var activeVariants = (SheetsRepository.listAll("Variants") || []).filter(function (v) {
      return v.Product_ID === productId && v.Lifecycle_Status === "ACTIVE";
    });
    require_(activeVariants.length === 0, "PRODUCT_HAS_ACTIVE_VARIANTS");
    SheetsRepository.updateBy("Products", "Product_ID", productId, { Lifecycle_Status: "ARCHIVED" });
    audit_(actor, "ARCHIVE", "PRODUCT", productId, "Product archived");
    return { ok: true };
  }

  function reactivate(productId, actor) {
    require_(SheetsRepository.getBy("Products", "Product_ID", productId), "PRODUCT_NOT_FOUND");
    SheetsRepository.updateBy("Products", "Product_ID", productId, { Lifecycle_Status: "ACTIVE" });
    audit_(actor, "REACTIVATE", "PRODUCT", productId, "Product reactivated");
    return { ok: true };
  }

  return { create: create, getWorkspace: getWorkspace, updateCompany: updateCompany, archive: archive, reactivate: reactivate };
})();
