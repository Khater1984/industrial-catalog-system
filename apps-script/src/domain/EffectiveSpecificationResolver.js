/** Deterministic effective specification resolver.
 * Reads immutable Specifications + APPROVED Specification_Changes only.
 * Never writes. Surfaces product/variant scope conflicts (ADR-040).
 * Separates source-derived specs from company-managed attributes.
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
      if (!seq || seenSeq[seq]) { quarantined = true; return; }
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

  function resolveEffectiveSpecifications(productId, variantId) {
    // Source-backed specifications
    var sourceSpecs = (SheetsRepository.listAll("Specifications") || []).filter(function (s) {
      return s.Product_ID === productId && (!variantId || !s.Variant_ID || s.Variant_ID === variantId || s.Scope === "PRODUCT");
    });

    var sourceResults = [];
    var byNorm = {};

    sourceSpecs.forEach(function (spec) {
      var logical = "SRC:" + spec.Specification_ID;
      var reduced = reduce_(logical, "ACTIVE", spec.Attribute_Value_Source);
      var item = {
        specification_id: spec.Specification_ID,
        logical_key: logical,
        scope: spec.Scope,
        attribute_key: spec.Attribute_Key_Source,
        normalized_key: spec.Normalized_Key || spec.Attribute_Key_Source,
        effective_value: reduced.value,
        unit: spec.Unit_Source || "",
        provenance: reduced.quarantined ? "QUARANTINED" : (reduced.history.length ? "SOURCE_MODIFIED" : "SOURCE"),
        state: reduced.state,
        quarantined: reduced.quarantined,
        history: reduced.history.map(function (h) { return { id: h.Specification_Change_ID, op: h.Operation, seq: h.Sequence_No }; })
      };
      if (item.state !== "DELETED" && !item.quarantined) {
        sourceResults.push(item);
      }
      var nk = item.normalized_key;
      if (!byNorm[nk]) byNorm[nk] = [];
      byNorm[nk].push(item);
    });

    // Company-created specifications (ADD keys)
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
      if (reduced.state === "ACTIVE" && !reduced.quarantined) {
        sourceResults.push({
          specification_id: null,
          logical_key: key,
          scope: c.Variant_ID ? "VARIANT" : "PRODUCT",
          attribute_key: c.Attribute_Key,
          normalized_key: c.Attribute_Key,
          effective_value: reduced.value,
          unit: c.Unit_Code || "",
          provenance: "COMPANY_ADDED",
          state: reduced.state,
          quarantined: false,
          history: reduced.history.map(function (h) { return { id: h.Specification_Change_ID, op: h.Operation, seq: h.Sequence_No }; })
        });
      }
    });

    // ADR-040 conflicts
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

    // Company-managed typed attributes (separate layer)
    var productAttrs = (SheetsRepository.listAll("Product_Attributes") || []).filter(function (a) { return a.Product_ID === productId; });
    var variantOverrides = variantId
      ? (SheetsRepository.listAll("Variant_Attribute_Overrides") || []).filter(function (o) { return o.Variant_ID === variantId; })
      : [];
    var companyAttributes = productAttrs.map(function (pa) {
      var override = variantOverrides.find(function (o) { return o.Attribute_ID === pa.Attribute_ID; });
      var effective = pa.Value_JSON;
      var mode = "INHERITED";
      if (override) {
        if (override.Override_Mode === "VALUE") {
          effective = override.Value_JSON;
          mode = "CUSTOMIZED";
        } else if (override.Override_Mode === "INTENTIONALLY_EMPTY") {
          effective = null;
          mode = "EMPTY";
        }
      }
      return {
        attribute_id: pa.Attribute_ID,
        effective_value: effective,
        mode: mode,
        product_value: pa.Value_JSON,
        override_mode: override ? override.Override_Mode : null
      };
    });

    return {
      source_specifications: sourceResults,
      company_attributes: companyAttributes,
      conflicts: conflicts,
      provenance: { product_id: productId, variant_id: variantId || null, resolved_at: new Date().toISOString() },
      validation_errors: []
    };
  }

  return { resolveEffectiveSpecifications: resolveEffectiveSpecifications };
})();
