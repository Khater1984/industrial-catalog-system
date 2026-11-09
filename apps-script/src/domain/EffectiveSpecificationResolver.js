/** Deterministic effective specification resolver.
 * Reads immutable Specifications + APPROVED Specification_Changes only.
 * Never writes. Surfaces product/variant scope conflicts (ADR-040).
 * Includes company-created ADD records in conflict detection.
 */
var EffectiveSpecificationResolver = (function () {
  function getChangesForKey_(logicalKey) {
    return (SheetsRepository.listAll("Specification_Changes") || [])
      .filter(function (c) { return c.Logical_Specification_Key === logicalKey && c.Change_Status === "APPROVED"; })
      .sort(function (a, b) { return Number(a.Sequence_No) - Number(b.Sequence_No); });
  }

  function reduce_(logicalKey, initialState, initialValue) {
    var changes = getChangesForKey_(logicalKey);
    var state = initialState;
    var value = initialValue;
    var history = [];
    var quarantined = false;
    var seenSeq = {};

    changes.forEach(function (c) {
      var seq = Number(c.Sequence_No);
      if (!seq || seq < 1 || seenSeq[seq]) { quarantined = true; return; }
      seenSeq[seq] = true;
      var op = c.Operation;
      if (op === "ADD" && state === "ABSENT") {
        state = "ACTIVE"; value = c.Value_JSON; history.push(c);
      } else if (op === "UPDATE" && state === "ACTIVE") {
        value = c.Value_JSON; history.push(c);
      } else if (op === "DELETE" && state === "ACTIVE") {
        state = "DELETED"; value = null; history.push(c);
      } else {
        quarantined = true;
      }
    });

    return {
      state: quarantined ? "QUARANTINED" : state,
      value: quarantined ? null : value,
      history: history,
      quarantined: quarantined
    };
  }

  function normKey_(key) {
    return String(key || "").trim().toLowerCase();
  }

  function resolveEffectiveSpecifications(productId, variantId) {
    var validationErrors = [];
    if (variantId) {
      var variant = SheetsRepository.getBy("Variants", "Variant_ID", variantId);
      if (!variant) validationErrors.push({ code: "VARIANT_NOT_FOUND", variantId: variantId });
      else if (variant.Product_ID !== productId) validationErrors.push({ code: "VARIANT_PRODUCT_MISMATCH", productId: productId, variantId: variantId });
    }
    var product = SheetsRepository.getBy("Products", "Product_ID", productId);
    if (!product) validationErrors.push({ code: "PRODUCT_NOT_FOUND", productId: productId });

    var sourceSpecs = (SheetsRepository.listAll("Specifications") || []).filter(function (s) {
      return s.Product_ID === productId && (!variantId || !s.Variant_ID || s.Variant_ID === variantId || s.Scope === "PRODUCT");
    });

    var sourceResults = [];
    var byNorm = {};

    sourceSpecs.forEach(function (spec) {
      var logical = "SRC:" + spec.Specification_ID;
      var reduced = reduce_(logical, "ACTIVE", spec.Attribute_Value_Source);
      var nk = normKey_(spec.Normalized_Key || spec.Attribute_Key_Source);
      var item = {
        specification_id: spec.Specification_ID,
        logical_key: logical,
        scope: spec.Scope,
        attribute_key: spec.Attribute_Key_Source,
        normalized_key: nk,
        original_source_value: spec.Attribute_Value_Source,
        effective_value: reduced.value,
        unit: spec.Unit_Source || "",
        provenance: reduced.quarantined ? "QUARANTINED" : (reduced.history.length ? "SOURCE_MODIFIED" : "SOURCE"),
        state: reduced.state,
        quarantined: reduced.quarantined,
        history: reduced.history.map(function (h) { return { id: h.Specification_Change_ID, op: h.Operation, seq: h.Sequence_No }; })
      };
      if (item.state !== "DELETED" && !item.quarantined) sourceResults.push(item);
      if (!byNorm[nk]) byNorm[nk] = [];
      byNorm[nk].push(item);
      if (reduced.quarantined) validationErrors.push({ code: "LOGICAL_KEY_QUARANTINED", key: logical });
    });

    // Company-created ADD records — include in conflict detection
    var companyCreated = (SheetsRepository.listAll("Specification_Changes") || [])
      .filter(function (c) {
        return c.Product_ID === productId &&
               (!variantId || !c.Variant_ID || c.Variant_ID === variantId) &&
               String(c.Logical_Specification_Key || "").indexOf("ADD:") === 0 &&
               c.Change_Status === "APPROVED";
      });
    var seenAdd = {};
    companyCreated.forEach(function (c) {
      var key = c.Logical_Specification_Key;
      if (seenAdd[key]) return;
      seenAdd[key] = true;
      var reduced = reduce_(key, "ABSENT", null);
      var nk = normKey_(c.Attribute_Key);
      var item = {
        specification_id: null,
        logical_key: key,
        scope: c.Variant_ID ? "VARIANT" : "PRODUCT",
        attribute_key: c.Attribute_Key,
        normalized_key: nk,
        effective_value: reduced.value,
        unit: c.Unit_Code || "",
        provenance: "COMPANY_ADDED",
        state: reduced.state,
        quarantined: reduced.quarantined,
        history: reduced.history.map(function (h) { return { id: h.Specification_Change_ID, op: h.Operation, seq: h.Sequence_No }; })
      };
      if (item.state === "ACTIVE" && !item.quarantined) sourceResults.push(item);
      if (!byNorm[nk]) byNorm[nk] = [];
      byNorm[nk].push(item);
      if (reduced.quarantined) validationErrors.push({ code: "LOGICAL_KEY_QUARANTINED", key: key });
    });

    var conflicts = [];
    Object.keys(byNorm).forEach(function (nk) {
      var items = byNorm[nk].filter(function (i) { return !i.quarantined && i.state !== "DELETED"; });
      var productItems = items.filter(function (i) { return i.scope === "PRODUCT"; });
      var variantItems = items.filter(function (i) { return i.scope === "VARIANT"; });
      if (productItems.length && variantItems.length) {
        conflicts.push({
          normalized_key: nk,
          product: productItems,
          variant: variantItems,
          note: "ADR-040: both product-scope and variant-scope assertions preserved; no automatic precedence"
        });
      }
    });

    // Company attributes — include variant-only overrides
    var productAttrs = (SheetsRepository.listAll("Product_Attributes") || []).filter(function (a) { return a.Product_ID === productId; });
    var variantOverrides = variantId
      ? (SheetsRepository.listAll("Variant_Attribute_Overrides") || []).filter(function (o) { return o.Variant_ID === variantId; })
      : [];
    var attrMap = {};
    productAttrs.forEach(function (pa) {
      attrMap[pa.Attribute_ID] = { attribute_id: pa.Attribute_ID, product_value: pa.Value_JSON, effective_value: pa.Value_JSON, mode: "INHERITED", override_mode: null };
    });
    variantOverrides.forEach(function (ov) {
      if (!attrMap[ov.Attribute_ID]) {
        attrMap[ov.Attribute_ID] = { attribute_id: ov.Attribute_ID, product_value: null, effective_value: null, mode: "NO_BASE", override_mode: ov.Override_Mode };
      }
      var entry = attrMap[ov.Attribute_ID];
      entry.override_mode = ov.Override_Mode;
      if (ov.Override_Mode === "VALUE") {
        entry.effective_value = ov.Value_JSON;
        entry.mode = "CUSTOMIZED";
      } else if (ov.Override_Mode === "INTENTIONALLY_EMPTY") {
        entry.effective_value = null;
        entry.mode = "EMPTY";
      }
    });
    var companyAttributes = Object.keys(attrMap).map(function (k) { return attrMap[k]; });

    return {
      source_specifications: sourceResults,
      company_attributes: companyAttributes,
      conflicts: conflicts,
      provenance: { product_id: productId, variant_id: variantId || null, resolved_at: new Date().toISOString() },
      validation_errors: validationErrors
    };
  }

  return { resolveEffectiveSpecifications: resolveEffectiveSpecifications };
})();
