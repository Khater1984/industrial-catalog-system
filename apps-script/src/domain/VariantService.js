/** Variant domain service. Product_ID is immutable (ADR-035). */
var VariantService = (function () {
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

  function create(productId, options) {
    require_(options && options.actor, "VARIANT_ACTOR_REQUIRED");
    var product = SheetsRepository.getBy("Products", "Product_ID", productId);
    require_(product, "PRODUCT_NOT_FOUND");
    require_(product.Lifecycle_Status === "ACTIVE", "PRODUCT_NOT_ACTIVE");
    var variantId = stableId_("var", productId + "|" + (options.idempotencyKey || Utilities.getUuid()));
    if (SheetsRepository.getBy("Variants", "Variant_ID", variantId)) return { variantId: variantId, reused: true };
    SheetsRepository.append("Variants", {
      Variant_ID: variantId,
      Product_ID: productId,
      Lifecycle_Status: "ACTIVE",
      Canonical_Notes: text_(options.notes, 2000),
      Created_At: now_(),
      Created_By: options.actor
    });
    SheetsRepository.append("Variant_Company", {
      Variant_ID: variantId,
      Model_Name_EN: text_(options.modelNameEn, 250),
      Model_Name_AR: text_(options.modelNameAr, 250),
      Company_Model_Notes: text_(options.notes, 2000),
      Updated_At: now_(),
      Updated_By: options.actor
    });
    audit_(options.actor, "CREATE", "VARIANT", variantId, "Variant created under product");
    return { variantId: variantId, reused: false };
  }

  function updateCompany(variantId, fields, actor) {
    require_(SheetsRepository.getBy("Variants", "Variant_ID", variantId), "VARIANT_NOT_FOUND");
    var patch = { Updated_At: now_(), Updated_By: actor };
    if (fields.modelNameEn !== undefined) patch.Model_Name_EN = text_(fields.modelNameEn, 250);
    if (fields.modelNameAr !== undefined) patch.Model_Name_AR = text_(fields.modelNameAr, 250);
    if (fields.notes !== undefined) patch.Company_Model_Notes = text_(fields.notes, 2000);
    SheetsRepository.updateBy("Variant_Company", "Variant_ID", variantId, patch);
    audit_(actor, "UPDATE", "VARIANT_COMPANY", variantId, "Variant company fields updated");
    return { ok: true };
  }

  function archive(variantId, actor) {
    require_(SheetsRepository.getBy("Variants", "Variant_ID", variantId), "VARIANT_NOT_FOUND");
    SheetsRepository.updateBy("Variants", "Variant_ID", variantId, { Lifecycle_Status: "ARCHIVED" });
    audit_(actor, "ARCHIVE", "VARIANT", variantId, "Variant archived");
    return { ok: true };
  }

  function reactivate(variantId, actor) {
    var variant = SheetsRepository.getBy("Variants", "Variant_ID", variantId);
    require_(variant, "VARIANT_NOT_FOUND");
    var product = SheetsRepository.getBy("Products", "Product_ID", variant.Product_ID);
    require_(product && product.Lifecycle_Status === "ACTIVE", "PARENT_PRODUCT_NOT_ACTIVE");
    SheetsRepository.updateBy("Variants", "Variant_ID", variantId, { Lifecycle_Status: "ACTIVE" });
    audit_(actor, "REACTIVATE", "VARIANT", variantId, "Variant reactivated");
    return { ok: true };
  }

  return { create: create, updateCompany: updateCompany, archive: archive, reactivate: reactivate };
})();
