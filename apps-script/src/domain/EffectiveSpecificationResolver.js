/** Deterministic effective specification resolver.
 * Reads immutable Specifications + APPROVED Specification_Changes only.
 * Never writes. Surfaces product/variant scope conflicts (ADR-040).
 */
var EffectiveSpecificationResolver = (function () {
  function getChangesForKey_(logicalKey) {
    return (SheetsRepository.listAll("Specification_Changes") || [])
      .filter(function (c) { return c.Logical_Specification_Key === logicalKey && c.Change_Status === "APPROVED"; })
      .sort(function (a, b) { return Number(a.Sequence_No) - Number(b.Sequence_No); });
  }

  function reduce_(logicalKey, sourceValue) {
    var changes = getChangesForKey_(logicalKey);
    var state = sourceValue ? "ACTIVE" : "ABSENT";
    var value = sourceValue || null;
    var history = [];
    var quarantined = false;
    var seenSeq = {};

    changes.forEach(function (c) {
      var seq = Number(c.Sequence_No);
      if (!seq || seenSeq[seq]) { quarantined = true; return; }
      seenSeq[seq] = true;
      if (c.Operation === "ADD" && state === "ABSENT") {
        state = "ACTIVE"; value = c.Value_JSON; history.push(c);
      } else if (c.Operation === "UPDATE" && state === "ACTIVE") {
        value = c.Value_JSON; history.push(c);
      } else if (c.Operation === "DELETE" && state === "ACTIVE") {
        state = "DELETED"; value = null; history.push(c);
      } else {
        quarantined = true;
      }
    });

    return { state: state, value: quarantined ? null : value, history: history, quarantined: quarantined };
  }

  function resolveEffectiveSpecifications(productId, variantId) {
    var sourceSpecs = (SheetsRepository.listAll("Specifications") || []).filter(function (s) {
      return s.Product_ID === productId && (!variantId || s.Variant_ID === variantId || s.Scope === "PRODUCT");
    });

    var sourceResults = [];
    var conflicts = [];
    var byNorm = {};

    sourceSpecs.forEach(function (spec) {
      var logical = "SRC:" + spec.Specification_ID;
      var reduced = reduce_(logical, spec.Attribute_Value_Source);
      var item = {
        specification_id: spec.Specification_ID,
        scope: spec.Scope,
        attribute_key: spec.Attribute_Key_Source,
        normalized_key: spec.Normalized_Key || spec.Attribute_Key_Source,
        effective_value: reduced.quarantined ? null : reduced.value,
        unit: spec.Unit_Source,
        provenance: "SOURCE",
        quarantined: reduced.quarantined,
        history: reduced.history
      };
      sourceResults.push(item);
      var nk = item.normalized_key;
      if (!byNorm[nk]) byNorm[nk] = [];
      byNorm[nk].push(item);
    });

    Object.keys(byNorm).forEach(function (nk) {
      var items = byNorm[nk];
      var productItems = items.filter(function (i) { return i.scope === "PRODUCT"; });
      var variantItems = items.filter(function (i) { return i.scope === "VARIANT"; });
      if (productItems.length && variantItems.length) {
        conflicts.push({ normalized_key: nk, product: productItems, variant: variantItems, note: "ADR-040: both scopes preserved" });
      }
    });

    // Company attributes (separate)
    var productAttrs = (SheetsRepository.listAll("Product_Attributes") || []).filter(function (a) { return a.Product_ID === productId; });
    var variantOverrides = variantId ? (SheetsRepository.listAll("Variant_Attribute_Overrides") || []).filter(function (o) { return o.Variant_ID === variantId; }) : [];
    var companyAttributes = productAttrs.map(function (pa) {
      var override = variantOverrides.find(function (o) { return o.Attribute_ID === pa.Attribute_ID; });
      var effective = pa.Value_JSON;
      var mode = "INHERITED";
      if (override) {
        if (override.Override_Mode === "VALUE") { effective = override.Value_JSON; mode = "CUSTOMIZED"; }
        else if (override.Override_Mode === "INTENTIONALLY_EMPTY") { effective = null; mode = "EMPTY"; }
      }
      return { attribute_id: pa.Attribute_ID, effective_value: effective, mode: mode };
    });

    return {
      source_specifications: sourceResults,
      company_attributes: companyAttributes,
      conflicts: conflicts,
      provenance: { product_id: productId, variant_id: variantId || null }
    };
  }

  return { resolveEffectiveSpecifications: resolveEffectiveSpecifications };
})();
