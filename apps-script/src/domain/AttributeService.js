/** Typed attributes and variant overrides. */
var AttributeService = (function () {
  function now_() { return new Date().toISOString(); }
  function sha_(v) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(v)).map(function (b) { var n = b < 0 ? b + 256 : b, h = n.toString(16); return h.length === 1 ? "0" + h : h; }).join(""); }
  function stableId_(p, s) { return p + "_" + sha_(s).slice(0, 16); }
  function require_(c, code) { if (!c) throw new Error(code); }

  function setProductValue(productId, attributeId, valueJson, actor) {
    var existing = (SheetsRepository.listAll("Product_Attributes") || []).find(function (a) { return a.Product_ID === productId && a.Attribute_ID === attributeId; });
    if (existing) {
      SheetsRepository.updateBy("Product_Attributes", "Product_Attribute_ID", existing.Product_Attribute_ID, { Value_JSON: valueJson, Updated_At: now_(), Updated_By: actor });
    } else {
      SheetsRepository.append("Product_Attributes", {
        Product_Attribute_ID: stableId_("pattr", productId + "|" + attributeId),
        Product_ID: productId, Attribute_ID: attributeId, Value_JSON: valueJson,
        Updated_At: now_(), Updated_By: actor
      });
    }
    return { ok: true };
  }

  function setVariantOverride(variantId, attributeId, mode, valueJson, actor) {
    require_(["VALUE", "INTENTIONALLY_EMPTY"].indexOf(mode) >= 0, "INVALID_OVERRIDE_MODE");
    if (mode === "INTENTIONALLY_EMPTY") require_(!valueJson, "INTENTIONALLY_EMPTY_MUST_BE_BLANK");
    var existing = (SheetsRepository.listAll("Variant_Attribute_Overrides") || []).find(function (o) { return o.Variant_ID === variantId && o.Attribute_ID === attributeId; });
    var record = {
      Override_Mode: mode,
      Value_JSON: mode === "VALUE" ? valueJson : "",
      Updated_At: now_(),
      Updated_By: actor
    };
    if (existing) {
      SheetsRepository.updateBy("Variant_Attribute_Overrides", "Variant_Override_ID", existing.Variant_Override_ID, record);
    } else {
      SheetsRepository.append("Variant_Attribute_Overrides", Object.assign({
        Variant_Override_ID: stableId_("vover", variantId + "|" + attributeId),
        Variant_ID: variantId, Attribute_ID: attributeId
      }, record));
    }
    return { ok: true };
  }

  function clearVariantOverride(variantId, attributeId, actor) {
    var existing = (SheetsRepository.listAll("Variant_Attribute_Overrides") || []).find(function (o) { return o.Variant_ID === variantId && o.Attribute_ID === attributeId; });
    if (!existing) return { ok: true, skipped: true };
    // Controlled removal — only this override row. Audited.
    var sheet = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("DEV_SPREADSHEET_ID")).getSheetByName("Variant_Attribute_Overrides");
    var row = SheetsRepository.findBy("Variant_Attribute_Overrides", "Variant_Override_ID", existing.Variant_Override_ID);
    if (row) sheet.deleteRow(row);
    SheetsRepository.append("Audit_Log", {
      Audit_ID: stableId_("aud", "CLEAR_OVERRIDE|" + existing.Variant_Override_ID),
      Event_Idempotency_Key: "CLEAR|" + existing.Variant_Override_ID,
      Payload_SHA256: sha_(existing.Variant_Override_ID),
      Event_At: now_(),
      Actor_ID: actor,
      Action: "CLEAR_OVERRIDE",
      Entity_Type: "VARIANT_ATTRIBUTE_OVERRIDE",
      Entity_ID: existing.Variant_Override_ID,
      Reason: "Override removed; inheritance restored"
    });
    return { ok: true };
  }

  return { setProductValue: setProductValue, setVariantOverride: setVariantOverride, clearVariantOverride: clearVariantOverride };
})();
