/**
 * Boundary validation for untrusted browser/API input.
 * Pure JavaScript: no Apps Script services, so rules can be tested independently.
 */
var InputValidation = (function () {
  function isPlainObject_(value) {
    return value !== null && typeof value === "object" && Object.prototype.toString.call(value) === "[object Object]";
  }
  function requiredString_(value, field, maxLength) {
    if (typeof value !== "string" || !value.trim()) throw new Error("VALIDATION_REQUIRED: " + field);
    var normalized = value.trim();
    if (normalized.length > maxLength) throw new Error("VALIDATION_TOO_LONG: " + field);
    return normalized;
  }
  function optionalString_(value, field, maxLength) {
    if (value === undefined || value === null || value === "") return "";
    if (typeof value !== "string") throw new Error("VALIDATION_INVALID_TYPE: " + field);
    var normalized = value.trim();
    if (normalized.length > maxLength) throw new Error("VALIDATION_TOO_LONG: " + field);
    return normalized;
  }
  function id_(value, field) {
    var id = requiredString_(value, field, 120);
    if (!/^[A-Za-z0-9_.-]{1,120}$/.test(id)) throw new Error("VALIDATION_INVALID_FORMAT: " + field);
    return id;
  }
  function optionalId_(value, field) {
    if (value === undefined || value === null || value === "") return "";
    return id_(value, field);
  }

  function productCreatePayload_(payload) {
    if (!isPlainObject_(payload)) throw new Error("VALIDATION_INVALID_OBJECT: payload");
    var allowed = ["nameEn", "nameAr", "description", "brandLabel", "notes", "familyId", "idempotencyKey"];
    Object.keys(payload).forEach(function (key) {
      if (allowed.indexOf(key) < 0) throw new Error("VALIDATION_UNKNOWN_FIELD: " + key);
    });
    return {
      nameEn: optionalString_(payload.nameEn, "nameEn", 300),
      nameAr: optionalString_(payload.nameAr, "nameAr", 300),
      description: optionalString_(payload.description, "description", 4000),
      brandLabel: optionalString_(payload.brandLabel, "brandLabel", 160),
      notes: optionalString_(payload.notes, "notes", 4000),
      familyId: optionalId_(payload.familyId, "familyId"),
      idempotencyKey: optionalString_(payload.idempotencyKey, "idempotencyKey", 120)
    };
  }

  function productUpdatePayload_(payload) {
    if (!isPlainObject_(payload)) throw new Error("VALIDATION_INVALID_OBJECT: payload");
    var allowed = ["productId", "nameEn", "nameAr", "description", "brandLabel", "notes", "familyId"];
    Object.keys(payload).forEach(function (key) {
      if (allowed.indexOf(key) < 0) throw new Error("VALIDATION_UNKNOWN_FIELD: " + key);
    });
    return {
      productId: id_(payload.productId, "productId"),
      nameEn: payload.nameEn !== undefined ? optionalString_(payload.nameEn, "nameEn", 300) : undefined,
      nameAr: payload.nameAr !== undefined ? optionalString_(payload.nameAr, "nameAr", 300) : undefined,
      description: payload.description !== undefined ? optionalString_(payload.description, "description", 4000) : undefined,
      brandLabel: payload.brandLabel !== undefined ? optionalString_(payload.brandLabel, "brandLabel", 160) : undefined,
      notes: payload.notes !== undefined ? optionalString_(payload.notes, "notes", 4000) : undefined,
      familyId: payload.familyId !== undefined ? optionalId_(payload.familyId, "familyId") : undefined
    };
  }

  function variantCreatePayload_(payload) {
    if (!isPlainObject_(payload)) throw new Error("VALIDATION_INVALID_OBJECT: payload");
    var allowed = ["productId", "modelNameEn", "modelNameAr", "notes", "idempotencyKey"];
    Object.keys(payload).forEach(function (key) {
      if (allowed.indexOf(key) < 0) throw new Error("VALIDATION_UNKNOWN_FIELD: " + key);
    });
    return {
      productId: id_(payload.productId, "productId"),
      modelNameEn: optionalString_(payload.modelNameEn, "modelNameEn", 250),
      modelNameAr: optionalString_(payload.modelNameAr, "modelNameAr", 250),
      notes: optionalString_(payload.notes, "notes", 2000),
      idempotencyKey: optionalString_(payload.idempotencyKey, "idempotencyKey", 120)
    };
  }

  function attributeSetPayload_(payload) {
    if (!isPlainObject_(payload)) throw new Error("VALIDATION_INVALID_OBJECT: payload");
    var allowed = ["productId", "variantId", "attributeId", "valueJson", "mode"];
    Object.keys(payload).forEach(function (key) {
      if (allowed.indexOf(key) < 0) throw new Error("VALIDATION_UNKNOWN_FIELD: " + key);
    });
    var result = {
      productId: payload.productId ? id_(payload.productId, "productId") : "",
      variantId: payload.variantId ? id_(payload.variantId, "variantId") : "",
      attributeId: id_(payload.attributeId, "attributeId"),
      valueJson: optionalString_(payload.valueJson, "valueJson", 2000),
      mode: optionalString_(payload.mode, "mode", 30)
    };
    if (result.mode && ["VALUE", "INTENTIONALLY_EMPTY"].indexOf(result.mode) < 0) {
      throw new Error("VALIDATION_INVALID_FORMAT: mode");
    }
    return result;
  }

  function familyPayload_(payload) {
    if (!isPlainObject_(payload)) throw new Error("VALIDATION_INVALID_OBJECT: payload");
    var allowed = ["nameEn", "nameAr", "parentId", "familyId", "newParentId"];
    Object.keys(payload).forEach(function (key) {
      if (allowed.indexOf(key) < 0) throw new Error("VALIDATION_UNKNOWN_FIELD: " + key);
    });
    return {
      nameEn: optionalString_(payload.nameEn, "nameEn", 180),
      nameAr: optionalString_(payload.nameAr, "nameAr", 180),
      parentId: optionalId_(payload.parentId, "parentId"),
      familyId: optionalId_(payload.familyId, "familyId"),
      newParentId: optionalId_(payload.newParentId, "newParentId")
    };
  }

  function specificationChangePayload_(payload) {
    if (!isPlainObject_(payload)) throw new Error("VALIDATION_INVALID_OBJECT: payload");
    var allowed = ["operation", "productId", "variantId", "attributeKey", "valueJson", "unitCode", "reason", "targetSpecificationId", "idempotencyKey", "changeId"];
    Object.keys(payload).forEach(function (key) {
      if (allowed.indexOf(key) < 0) throw new Error("VALIDATION_UNKNOWN_FIELD: " + key);
    });
    var operation = payload.operation ? requiredString_(payload.operation, "operation", 20) : "";
    if (operation && ["ADD", "UPDATE", "DELETE"].indexOf(operation) < 0) throw new Error("VALIDATION_INVALID_FORMAT: operation");
    return {
      operation: operation,
      productId: optionalId_(payload.productId, "productId"),
      variantId: optionalId_(payload.variantId, "variantId"),
      attributeKey: optionalString_(payload.attributeKey, "attributeKey", 160),
      valueJson: optionalString_(payload.valueJson, "valueJson", 2000),
      unitCode: optionalString_(payload.unitCode, "unitCode", 40),
      reason: optionalString_(payload.reason, "reason", 1000),
      targetSpecificationId: optionalId_(payload.targetSpecificationId, "targetSpecificationId"),
      idempotencyKey: optionalString_(payload.idempotencyKey, "idempotencyKey", 120),
      changeId: optionalId_(payload.changeId, "changeId")
    };
  }

  function idOnlyPayload_(payload, field) {
    if (!isPlainObject_(payload)) throw new Error("VALIDATION_INVALID_OBJECT: payload");
    return { [field]: id_(payload[field], field) };
  }

  return {
    productCreatePayload: productCreatePayload_,
    productUpdatePayload: productUpdatePayload_,
    variantCreatePayload: variantCreatePayload_,
    attributeSetPayload: attributeSetPayload_,
    familyPayload: familyPayload_,
    specificationChangePayload: specificationChangePayload_,
    idOnlyPayload: idOnlyPayload_,
    catalogPayload: catalogPayload_,
    uploadMetadata: uploadMetadata_,
    promotionPayload: promotionPayload_,
    imagesPromotePayload: imagesPromotePayload_
  };
})();
