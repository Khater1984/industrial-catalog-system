/** Promotes accepted staging records into V2.1 Sheets tables.

Source specification rows are append-only. Reviewer edits are recorded in
Specification_Changes and never overwrite Specifications.Attribute_Value_Source.
There is no Specifications_Source table in Schema V2.1; the immutable source
row in Specifications is the source assertion.
*/
var StagingPromotion = (function () {
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
  function json_(value) { return JSON.stringify(value === undefined || value === null ? "" : value); }
  function confidence_(value) {
    if (typeof value === "number" && isFinite(value)) return value;
    var map = { HIGH: 0.95, MEDIUM: 0.7, LOW: 0.4 };
    return map[String(value || "").toUpperCase()] || "";
  }
  function require_(condition, code) { if (!condition) throw new Error(code); }
  function accepted_(record) { return record && record.review_status === "ACCEPTED"; }
  function sourceValue_(spec) {
    return spec.edited && Object.prototype.hasOwnProperty.call(spec, "original_value_raw")
      ? spec.original_value_raw : spec.value_raw;
  }

  function existingBy_(table, column, value) {
    return value ? SheetsRepository.getBy(table, column, value) : null;
  }
  function appendOnce_(table, record) { return SheetsRepository.append(table, record); }
  function mapping_(operationId, stagingType, stagingId, productionType, productionId, canonicalType, canonicalId, decisionId, payload) {
    var existing = existingBy_("Promotion_Mappings", "Staging_ID", stagingId);
    if (existing && existing.Production_Entity_Type === productionType) return existing;
    var record = {
      Promotion_Mapping_ID: stableId_("pmap", operationId + "|" + stagingType + "|" + stagingId + "|" + productionType),
      Promotion_Operation_ID: operationId,
      Staging_Type: stagingType,
      Staging_ID: stagingId,
      Production_Entity_Type: productionType,
      Production_Entity_ID: productionId,
      Canonical_Entity_Type: canonicalType || "",
      Canonical_Entity_ID: canonicalId || "",
      Identity_Match_Decision_ID: decisionId || "",
      Payload_SHA256: sha_(json_(payload)),
      Created_At: now_()
    };
    appendOnce_("Promotion_Mappings", record);
    return record;
  }
  function audit_(actor, action, entityType, entityId, reason, runId, payload) {
    appendOnce_("Audit_Log", {
      Audit_ID: stableId_("aud", action + "|" + entityType + "|" + entityId + "|" + reason),
      Event_Idempotency_Key: text_(action + "|" + entityType + "|" + entityId + "|" + reason, 180),
      Payload_SHA256: sha_(json_(payload)),
      Event_At: now_(),
      Actor_ID: actor,
      Action: action,
      Entity_Type: entityType,
      Entity_ID: entityId,
      Reason: text_(reason, 1000),
      Related_Run_ID: runId || ""
    });
  }
  function decision_(entityType, stagingType, stagingId, stagingHash, resultId, actor, parentDecisionId) {
    var existing = existingBy_("Identity_Match_Decisions", "Source_Staging_ID", stagingId);
    if (existing) return existing;
    var record = {
      Match_Decision_ID: stableId_("imd", stagingType + "|" + stagingId),
      Entity_Type: entityType,
      Source_Staging_Type: stagingType,
      Source_Staging_ID: stagingId,
      Source_Staging_Hash: stagingHash,
      Parent_Product_Match_Decision_ID: parentDecisionId || "",
      Decision: "CREATE_NEW",
      Result_Canonical_ID: resultId,
      Rationale: "Accepted staging record promoted as a new canonical identity.",
      Decided_At: now_(),
      Decided_By: actor
    };
    appendOnce_("Identity_Match_Decisions", record);
    return record;
  }

  function promoteReviewedStaging(options) {
    require_(options && options.stagingSetFileId && options.stagingSetSha256, "PROMOTION_ARGUMENTS_INVALID");
    if (options.staging) throw new Error("PROMOTION_CLIENT_STAGING_FORBIDDEN");
    require_(/^[A-Za-z0-9_-]{10,200}$/.test(options.stagingSetFileId), "PROMOTION_FILE_ID_INVALID");
    require_(/^[a-f0-9]{64}$/.test(options.stagingSetSha256), "PROMOTION_SHA_INVALID");
    var file = DriveApp.getFileById(options.stagingSetFileId);
    if (!file) throw new Error("STAGING_FILE_NOT_FOUND");
    var blob = file.getBlob();
    var bytes = blob.getBytes();
    var computed = sha_(bytes);
    require_(computed === options.stagingSetSha256, "STAGING_FILE_SHA_MISMATCH");
    var content = blob.getDataAsString();
    var staging;
    try { staging = JSON.parse(content); } catch (e) { throw new Error("STAGING_FILE_INVALID_JSON"); }
    require_(staging && Array.isArray(staging.products) && Array.isArray(staging.variants) && Array.isArray(staging.specifications), "STAGING_SET_INVALID");
    var actor = options.actor || APP.ACTOR_ID;
    var runId = text_(staging.run_id, 120);
    var catalogId = text_(staging.catalog_id, 120);
    var keyVersion = text_(staging.source_key_algorithm_version || "source-key-v1", 80);
    var promotionKey = text_("promote|" + runId + "|" + options.stagingSetSha256.slice(0, 32), 180);
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    var operationId = stableId_("pop", promotionKey);
    try {
      var existingOp = existingBy_("Promotion_Operations", "Promotion_Key", promotionKey);
      if (existingOp && existingOp.Operation_Status === "COMPLETED") {
        return { promotion_operation_id: existingOp.Promotion_Operation_ID, skipped: true, status: "COMPLETED" };
      }
      if (!existingOp) {
        SheetsRepository.append("Promotion_Operations", {
          Promotion_Operation_ID: operationId,
          Promotion_Key: promotionKey,
          Run_ID: runId,
          Operation_Status: "APPLYING",
          Staging_Set_Manifest_File_ID: options.stagingSetFileId,
          Staging_Set_SHA256: options.stagingSetSha256,
          Intended_Output_Manifest_File_ID: options.intendedOutputFileId || options.stagingSetFileId,
          Intended_Output_SHA256: options.intendedOutputSha256 || options.stagingSetSha256,
          Created_At: now_(),
          Created_By: actor,
          Started_At: now_()
        });
      } else {
        operationId = existingOp.Promotion_Operation_ID;
        SheetsRepository.updateBy("Promotion_Operations", "Promotion_Operation_ID", operationId, { Operation_Status: "APPLYING", Started_At: now_() });
      }

      var counts = { products: 0, variants: 0, specifications: 0, changes: 0, rejected: 0, skipped: 0 };
      var productIds = {};
      var variantIds = {};
      var variantParentIds = {};
      var variantSourceIds = {};
      var productSourceIds = {};
      var productDecisionIds = {};

      staging.products.forEach(function (product) {
        if (!accepted_(product)) { counts.rejected += 1; return; }
        var sourceKey = text_(catalogId + "|" + product.catalog_page_id + "|" + product.proposed_product_name, 160);
        var productId = stableId_("prd", sourceKey);
        var existingSource = existingBy_("Product_Source_Records", "Source_Record_Key", sourceKey);
        if (existingSource) {
          productIds[product.staging_id] = existingSource.Product_ID;
          productSourceIds[product.staging_id] = existingSource.Product_Source_Record_ID;
          productDecisionIds[product.staging_id] = existingSource.Match_Decision_ID;
          counts.skipped += 1;
          return;
        }
        var hash = product.staging_record_hash || sha_(product.staging_id);
        var decision = decision_("PRODUCT", "STAGING_PRODUCT", product.staging_id, hash, productId, actor);
        if (!existingBy_("Products", "Product_ID", productId)) {
          appendOnce_("Products", {
            Product_ID: productId, Lifecycle_Status: "ACTIVE",
            Canonical_Notes: text_(product.proposed_product_name, 2000),
            Created_At: now_(), Created_By: actor
          });
          counts.products += 1;
        }
        var sourceId = stableId_("psr", sourceKey);
        appendOnce_("Product_Source_Records", {
          Product_Source_Record_ID: sourceId, Product_ID: productId, Catalog_ID: catalogId,
          Source_Record_Key: sourceKey, Source_Key_Algorithm_Version: keyVersion,
          Source_Product_Name: text_(product.proposed_product_name, 300),
          Catalog_Page_ID: product.catalog_page_id, Source_Quote: text_(product.source_quote, 2000),
          Extraction_Run_ID: runId, Extraction_Record_ID: product.staging_id,
          Identity_Resolution: "CREATE_NEW", Match_Decision_ID: decision.Match_Decision_ID,
          Created_At: now_(), Created_By: actor
        });
        mapping_(operationId, "PRODUCT", product.staging_id, "PRODUCT", productId, "PRODUCT", productId, decision.Match_Decision_ID, product);
        mapping_(operationId, "PRODUCT", product.staging_id, "PRODUCT_SOURCE_RECORD", sourceId, "PRODUCT", productId, decision.Match_Decision_ID, product);
        audit_(actor, "PROMOTE", "PRODUCT", productId, "Accepted staging product", runId, product);
        productIds[product.staging_id] = productId;
        productSourceIds[product.staging_id] = sourceId;
        productDecisionIds[product.staging_id] = decision.Match_Decision_ID;
      });

      staging.variants.forEach(function (variant) {
        if (!accepted_(variant)) { counts.rejected += 1; return; }
        var productId = productIds[variant.parent_staging_product_id];
        if (!productId) { counts.skipped += 1; return; }
        var sourceKey = text_(productId + "|" + variant.proposed_model_number, 160);
        var variantId = stableId_("var", sourceKey);
        var existingSource = existingBy_("Variant_Source_Records", "Source_Record_Key", sourceKey);
        if (existingSource) {
          variantIds[variant.staging_id] = existingSource.Variant_ID;
          variantParentIds[variant.staging_id] = variant.parent_staging_product_id;
          variantSourceIds[variant.staging_id] = existingSource.Variant_Source_Record_ID;
          counts.skipped += 1;
          return;
        }
        var hash = variant.staging_record_hash || sha_(variant.staging_id);
        var decision = decision_("VARIANT", "STAGING_VARIANT", variant.staging_id, hash, variantId, actor, productDecisionIds[variant.parent_staging_product_id]);
        if (!existingBy_("Variants", "Variant_ID", variantId)) {
          appendOnce_("Variants", {
            Variant_ID: variantId, Product_ID: productId, Lifecycle_Status: "ACTIVE",
            Canonical_Notes: text_(variant.proposed_model_number, 2000),
            Created_At: now_(), Created_By: actor
          });
          counts.variants += 1;
        }
        var sourceId = stableId_("vsr", sourceKey);
        appendOnce_("Variant_Source_Records", {
          Variant_Source_Record_ID: sourceId, Variant_ID: variantId,
          Product_Source_Record_ID: productSourceIds[variant.parent_staging_product_id],
          Source_Record_Key: sourceKey, Source_Key_Algorithm_Version: keyVersion,
          Source_Model_Number: text_(variant.proposed_model_number, 160),
          Source_Model_Name: text_(variant.proposed_model_name || variant.proposed_model_number, 250),
          Catalog_Page_ID: variant.catalog_page_id, Source_Quote: text_(variant.source_quote, 2000),
          Extraction_Run_ID: runId, Extraction_Record_ID: variant.staging_id,
          Identity_Resolution: "CREATE_NEW", Match_Decision_ID: decision.Match_Decision_ID,
          Created_At: now_(), Created_By: actor
        });
        mapping_(operationId, "VARIANT", variant.staging_id, "VARIANT", variantId, "VARIANT", variantId, decision.Match_Decision_ID, variant);
        mapping_(operationId, "VARIANT", variant.staging_id, "VARIANT_SOURCE_RECORD", sourceId, "VARIANT", variantId, decision.Match_Decision_ID, variant);
        audit_(actor, "PROMOTE", "VARIANT", variantId, "Accepted staging variant", runId, variant);
        variantIds[variant.staging_id] = variantId;
        variantParentIds[variant.staging_id] = variant.parent_staging_product_id;
        variantSourceIds[variant.staging_id] = sourceId;
      });

      staging.specifications.forEach(function (spec) {
        if (!accepted_(spec)) { counts.rejected += 1; return; }
        var productId = productIds[spec.parent_staging_product_id];
        var scope = text_(spec.scope, 20).toUpperCase();
        var variantId = "";
        var productSourceRecordId = "";
        var variantSourceRecordId = "";
        var canonicalEntityType = "PRODUCT";
        var canonicalEntityId = productId;
        require_(productId, "PROMOTION_SPEC_PRODUCT_PARENT_MISSING");
        if (scope === "PRODUCT") {
          require_(!spec.parent_staging_variant_id, "PROMOTION_SPEC_PRODUCT_SCOPE_VARIANT_FORBIDDEN");
          productSourceRecordId = productSourceIds[spec.parent_staging_product_id];
          require_(productSourceRecordId, "PROMOTION_SPEC_PRODUCT_SOURCE_MISSING");
        } else if (scope === "VARIANT") {
          variantId = variantIds[spec.parent_staging_variant_id];
          require_(variantId, "PROMOTION_SPEC_VARIANT_PARENT_MISSING");
          require_(variantParentIds[spec.parent_staging_variant_id] === spec.parent_staging_product_id, "PROMOTION_SPEC_PARENT_MISMATCH");
          variantSourceRecordId = variantSourceIds[spec.parent_staging_variant_id];
          require_(variantSourceRecordId, "PROMOTION_SPEC_VARIANT_SOURCE_MISSING");
          canonicalEntityType = "VARIANT";
          canonicalEntityId = variantId;
        } else {
          require_(false, "PROMOTION_SPEC_SCOPE_UNSUPPORTED");
        }
        var original = text_(sourceValue_(spec), 2000);
        var assertionKey = text_(canonicalEntityId + "|" + spec.attribute_key_raw, 160);
        if (original) {
          var specId = stableId_("spec", assertionKey + "|" + original);
          if (!existingBy_("Specifications", "Specification_ID", specId)) {
            appendOnce_("Specifications", {
              Specification_ID: specId, Source_Assertion_Key: assertionKey,
              Source_Key_Algorithm_Version: keyVersion, Scope: scope,
              Product_Source_Record_ID: productSourceRecordId, Variant_Source_Record_ID: variantSourceRecordId,
              Product_ID: productId, Variant_ID: variantId,
              Attribute_Key_Source: text_(spec.attribute_key_raw, 160),
              Attribute_Value_Source: original, Unit_Source: text_(spec.unit_raw, 80),
              Normalized_Key: text_(spec.normalized_key || spec.attribute_key_raw, 160),
              Normalized_Value_JSON: json_(original),
              Normalized_Unit: text_(spec.normalized_unit || spec.unit_raw, 80),
              Catalog_Page_ID: spec.catalog_page_id, Source_Quote: text_(spec.source_quote, 2000),
              Extraction_Run_ID: runId, Extraction_Confidence: confidence_(spec.confidence),
              Created_At: now_(), Created_By: actor
            });
            counts.specifications += 1;
            audit_(actor, "PROMOTE", "SPECIFICATION", specId, "Accepted source specification", runId, spec);
          } else counts.skipped += 1;
          mapping_(operationId, "SPECIFICATION", spec.staging_id, "SPECIFICATION", specId, scope, canonicalEntityId, "", spec);
          if (spec.edited && text_(spec.value_raw, 2000) && text_(spec.value_raw, 2000) !== original) {
            var changePayload = { before: original, after: spec.value_raw };
            var changeId = stableId_("chg", assertionKey + "|" + original + "|" + spec.value_raw);
            if (!existingBy_("Specification_Changes", "Specification_Change_ID", changeId)) {
              appendOnce_("Specification_Changes", {
                Specification_Change_ID: changeId, Logical_Specification_Key: text_(assertionKey, 180),
                Sequence_No: 1, Operation: "UPDATE", Target_Specification_ID: specId,
                Product_ID: productId, Variant_ID: variantId,
                Attribute_Key: text_(spec.attribute_key_raw, 160),
                Value_JSON: json_(spec.value_raw), Unit_Code: text_(spec.unit_raw, 40),
                Change_Status: "APPROVED", Reason: text_(spec.edit_reason || "Accepted reviewer edit", 1000),
                Created_At: now_(), Created_By: actor, Approved_At: now_(), Approved_By: actor,
                Approval_Payload_SHA256: sha_(json_(changePayload))
              });
              counts.changes += 1;
            }
          }
        } else if (text_(spec.value_raw, 2000)) {
          var addId = stableId_("chg", "ADD|" + assertionKey + "|" + spec.value_raw);
          if (!existingBy_("Specification_Changes", "Specification_Change_ID", addId)) {
            appendOnce_("Specification_Changes", {
              Specification_Change_ID: addId, Logical_Specification_Key: text_(assertionKey, 180),
              Sequence_No: 1, Operation: "ADD", Product_ID: productId, Variant_ID: variantId,
              Attribute_Key: text_(spec.attribute_key_raw, 160), Value_JSON: json_(spec.value_raw),
              Unit_Code: text_(spec.unit_raw, 40), Change_Status: "APPROVED",
              Reason: "Reviewer supplied a value missing from source.",
              Created_At: now_(), Created_By: actor, Approved_At: now_(), Approved_By: actor,
              Approval_Payload_SHA256: sha_(json_({ after: spec.value_raw }))
            });
            counts.changes += 1;
          }
        } else counts.skipped += 1;
      });

      SheetsRepository.updateBy("Promotion_Operations", "Promotion_Operation_ID", operationId, {
        Operation_Status: "COMPLETED", Finished_At: now_()
      });
      return { promotion_operation_id: operationId, status: "COMPLETED", counts: counts, skipped: false };
    } catch (err) {
      try {
        if (existingBy_("Promotion_Operations", "Promotion_Operation_ID", operationId)) {
          SheetsRepository.updateBy("Promotion_Operations", "Promotion_Operation_ID", operationId, {
            Operation_Status: "IN_DOUBT", Recovery_Notes: text_(String(err && err.message || err), 1500)
          });
        }
      } catch (statusErr) {}
      throw err;
    } finally {
      lock.releaseLock();
    }
  }

  return { promoteReviewedStaging: promoteReviewedStaging };
})();
