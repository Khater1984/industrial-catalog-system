/** Typed attributes and variant overrides.
 * VALUE vs INTENTIONALLY_EMPTY are distinct. Removing override restores inheritance.
 */
var AttributeService = (function () {
  function now_() { return new Date().toISOString(); }
  function sha_(v) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(v)).map(function (b) { var n = b < 0 ? b + 256 : b, h = n.toString(16); return h.length === 1 ? "0" + h : h; }).join(""); }
  function stableId_(p, s) { return p + "_" + sha_(s).slice(0, 16); }
  function require_(c, code) { if (!c) throw new Error(code); }
  function audit_(actor, action, entityType, entityId, reason) {
    SheetsRepository.append("Audit_Log", {
      Audit_ID: stableId_("aud", action + "|" + entityId + "|" + now_()),
      Event_Idempotency_Key: textSafe_(action + "|" + entityId),
      Payload_SHA256: sha_(entityId),
      Event_At: now_(),
      Actor_ID: actor,
      Action: action,
      Entity_Type: entityType,
      Entity_ID: entityId,
      Reason: reason || ""
    });
  }
  function textSafe_(s) { return String(s || "").slice(0, 180); }

  function setProductValue(productId, attributeId, valueJson, actor) {
    require_(productId && attributeId && valueJson, "ATTRIBUTE_ARGUMENTS_INVALID");
    var existing = (SheetsRepository.listAll("Product_Attributes") || []).find(function (a) {
      return a.Product_ID === productId && a.Attribute_ID === attributeId;
    });
    if (existing) {
      SheetsRepository.updateBy("Product_Attributes", "Product_Attribute_ID", existing.Product_Attribute_ID, {
        Value_JSON: valueJson, Updated_At: now_(), Updated_By: actor
      });
    } else {
      SheetsRepository.append("Product_Attributes", {
        Product_Attribute_ID: stableId_("pattr", productId + "|" + attributeId),
        Product_ID: productId, Attribute_ID: attributeId, Value_JSON: valueJson,
        Updated_At: now_(), Updated_By: actor
      });
    }
    audit_(actor, "SET_PRODUCT_ATTRIBUTE", "PRODUCT_ATTRIBUTE", productId + "|" + attributeId, "Product attribute set");
    return { ok: true };
  }

  function setVariantOverride(variantId, attributeId, mode, valueJson, actor) {
    require_(["VALUE", "INTENTIONALLY_EMPTY"].indexOf(mode) >= 0, "INVALID_OVERRIDE_MODE");
    if (mode === "INTENTIONALLY_EMPTY") {
      require_(!valueJson || String(valueJson).trim() === "", "INTENTIONALLY_EMPTY_MUST_BE_BLANK");
    } else {
      require_(valueJson, "VALUE_REQUIRED_FOR_VALUE_MODE");
    }
    var existing = (SheetsRepository.listAll("Variant_Attribute_Overrides") || []).find(function (o) {
      return o.Variant_ID === variantId && o.Attribute_ID === attributeId;
    });
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
    audit_(actor, "SET_VARIANT_OVERRIDE", "VARIANT_ATTRIBUTE_OVERRIDE", variantId + "|" + attributeId, mode);
    return { ok: true };
  }

  function clearVariantOverride(variantId, attributeId, actor) {
    var existing = (SheetsRepository.listAll("Variant_Attribute_Overrides") || []).find(function (o) {
      return o.Variant_ID === variantId && o.Attribute_ID === attributeId;
    });
    if (!existing) return { ok: true, skipped: true };
    var sheet = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("DEV_SPREADSHEET_ID"))
      .getSheetByName("Variant_Attribute_Overrides");
    var row = SheetsRepository.findBy("Variant_Attribute_Overrides", "Variant_Override_ID", existing.Variant_Override_ID);
    if (row) sheet.deleteRow(row);
    audit_(actor, "CLEAR_OVERRIDE", "VARIANT_ATTRIBUTE_OVERRIDE", existing.Variant_Override_ID, "Override removed; inheritance restored");
    return { ok: true };
  }

  return { setProductValue: setProductValue, setVariantOverride: setVariantOverride, clearVariantOverride: clearVariantOverride };
})();
