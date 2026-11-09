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

  function uploadMetadata_(payload) {
    if (!isPlainObject_(payload)) throw new Error("INVALID_UPLOAD_PAYLOAD");
    var allowed = ["supplierName", "catalogTitle", "catalogRevision", "fileName", "mimeType", "base64"];
    Object.keys(payload).forEach(function (key) {
      if (allowed.indexOf(key) < 0) throw new Error("VALIDATION_UNKNOWN_FIELD: " + key);
    });
    var fileName = requiredString_(payload.fileName, "fileName", 180);
    fileName = fileName.replace(/[\\/:*?"<>|]/g, "_");
    if (!/\.pdf$/i.test(fileName)) throw new Error("INVALID_PDF_FILENAME");
    if (payload.mimeType && payload.mimeType !== "application/pdf") throw new Error("UNSUPPORTED_MIME_TYPE");
    var base64 = requiredString_(payload.base64, "base64", 16777216);
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) throw new Error("INVALID_BASE64");
    return {
      supplierName: requiredString_(payload.supplierName, "supplierName", 160),
      catalogTitle: optionalString_(payload.catalogTitle, "catalogTitle", 240),
      catalogRevision: optionalString_(payload.catalogRevision, "catalogRevision", 80),
      fileName: fileName,
      base64: base64
    };
  }

  function catalogPayload_(payload) {
    if (!isPlainObject_(payload)) throw new Error("VALIDATION_INVALID_OBJECT: payload");
    var allowed = ["driveFileId","supplierName","catalogTitle","catalogReference","catalogRevision","languageCode","publishedDate","sourceUrl","notes"];
    Object.keys(payload).forEach(function (key) {
      if (allowed.indexOf(key) < 0) throw new Error("VALIDATION_UNKNOWN_FIELD: " + key);
    });
    var driveFileId = requiredString_(payload.driveFileId, "driveFileId", 200);
    if (!/^[A-Za-z0-9_-]{10,200}$/.test(driveFileId)) throw new Error("VALIDATION_INVALID_FORMAT: driveFileId");
    var publishedDate = optionalString_(payload.publishedDate, "publishedDate", 10);
    if (publishedDate) {
      var parts = publishedDate.split("-");
      if (parts.length !== 3 || parts[0].length !== 4 || parts[1].length !== 2 || parts[2].length !== 2) {
        throw new Error("VALIDATION_INVALID_FORMAT: publishedDate");
      }
      var year = Number(parts[0]), month = Number(parts[1]), day = Number(parts[2]);
      var date = new Date(Date.UTC(year, month - 1, day));
      if (!year || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
        throw new Error("VALIDATION_INVALID_FORMAT: publishedDate");
      }
    }
    var languageCode = optionalString_(payload.languageCode, "languageCode", 12);
    if (languageCode && !/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(languageCode)) throw new Error("VALIDATION_INVALID_FORMAT: languageCode");
    var sourceUrl = optionalString_(payload.sourceUrl, "sourceUrl", 2048);
    if (sourceUrl) {
      var lowerUrl = sourceUrl.toLowerCase();
      var protocolLength = lowerUrl.indexOf("https://") === 0 ? 8 : (lowerUrl.indexOf("http://") === 0 ? 7 : 0);
      var authority = protocolLength ? sourceUrl.substring(protocolLength).split("/")[0].split("?")[0].split("#")[0] : "";
      var hasControlOrSpace = sourceUrl.split("").some(function (character) { return character.charCodeAt(0) <= 32; });
      if (!protocolLength || !authority || hasControlOrSpace) throw new Error("VALIDATION_INVALID_FORMAT: sourceUrl");
    }
    return {
      driveFileId: driveFileId,
      supplierName: requiredString_(payload.supplierName, "supplierName", 160),
      catalogTitle: optionalString_(payload.catalogTitle, "catalogTitle", 240),
      catalogReference: optionalString_(payload.catalogReference, "catalogReference", 120),
      catalogRevision: optionalString_(payload.catalogRevision, "catalogRevision", 80),
      languageCode: languageCode,
      publishedDate: publishedDate,
      sourceUrl: sourceUrl,
      notes: optionalString_(payload.notes, "notes", 2000)
    };
  }

  function promotionPayload_(payload) {
    if (!isPlainObject_(payload)) throw new Error("VALIDATION_INVALID_OBJECT: payload");
    var allowed = ["stagingSetFileId", "stagingSetSha256"];
    Object.keys(payload).forEach(function (key) {
      if (allowed.indexOf(key) < 0) throw new Error("VALIDATION_UNKNOWN_FIELD: " + key);
    });
    var stagingSetFileId = requiredString_(payload.stagingSetFileId, "stagingSetFileId", 200);
    if (!/^[A-Za-z0-9_-]{10,200}$/.test(stagingSetFileId)) throw new Error("VALIDATION_INVALID_FORMAT: stagingSetFileId");
    var stagingSetSha256 = requiredString_(payload.stagingSetSha256, "stagingSetSha256", 64);
    if (!/^[a-f0-9]{64}$/.test(stagingSetSha256)) throw new Error("VALIDATION_INVALID_FORMAT: stagingSetSha256");
    return { stagingSetFileId: stagingSetFileId, stagingSetSha256: stagingSetSha256 };
  }

  function imagesPromotePayload_(payload) {
    if (!isPlainObject_(payload)) throw new Error("VALIDATION_INVALID_OBJECT: payload");
    var allowed = ["images", "run_id", "catalog_id"];
    Object.keys(payload).forEach(function (key) {
      if (allowed.indexOf(key) < 0) throw new Error("VALIDATION_UNKNOWN_FIELD: " + key);
    });

    var catalogId = requiredString_(payload.catalog_id, "catalog_id", 128);
    var runId = optionalString_(payload.run_id, "run_id", 128);
    if (runId && !/^[A-Za-z0-9_.-]+$/.test(runId)) {
      throw new Error("VALIDATION_INVALID_FORMAT: run_id");
    }
    if (!Array.isArray(payload.images) || payload.images.length > 500) {
      throw new Error("VALIDATION_INVALID_TYPE: images");
    }

    var allowedImageFields = [
      "review_status", "sha256", "drive_file_id", "original_name", "mime_type",
      "width_px", "height_px", "file_size_bytes", "has_alpha",
      "catalog_page_id", "page_number", "target_type", "target_id"
    ];
    var allowedMimeTypes = {
      "image/jpeg": true, "image/png": true, "image/webp": true,
      "image/gif": true, "image/tiff": true, "image/bmp": true,
      "image/jp2": true, "image/jpx": true, "image/x-ms-bmp": true
    };

    function positiveInteger_(value, field, maximum) {
      if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1 || value > maximum) {
        throw new Error("VALIDATION_INVALID_TYPE: " + field);
      }
      return value;
    }

    var images = payload.images.map(function (image, index) {
      var label = "images[" + index + "]";
      if (!isPlainObject_(image)) throw new Error("VALIDATION_INVALID_OBJECT: " + label);
      Object.keys(image).forEach(function (key) {
        if (allowedImageFields.indexOf(key) < 0) {
          throw new Error("VALIDATION_UNKNOWN_FIELD: " + label + "." + key);
        }
      });
      var status = requiredString_(image.review_status, label + ".review_status", 20);
      if (["ACCEPTED", "REJECTED", "PENDING"].indexOf(status) < 0) {
        throw new Error("VALIDATION_INVALID_FORMAT: " + label + ".review_status");
      }
      var normalized = { review_status: status };
      if (status !== "ACCEPTED") return normalized;

      var sha = requiredString_(image.sha256, label + ".sha256", 64).toLowerCase();
      if (!/^[a-f0-9]{64}$/.test(sha)) throw new Error("VALIDATION_INVALID_FORMAT: " + label + ".sha256");
      var driveId = requiredString_(image.drive_file_id, label + ".drive_file_id", 200);
      if (!/^[A-Za-z0-9_-]{10,200}$/.test(driveId)) {
        throw new Error("VALIDATION_INVALID_FORMAT: " + label + ".drive_file_id");
      }
      var originalName = requiredString_(image.original_name, label + ".original_name", 255);
      var mimeType = requiredString_(image.mime_type, label + ".mime_type", 100).toLowerCase();
      if (!allowedMimeTypes[mimeType]) throw new Error("UNSUPPORTED_IMAGE_MIME_TYPE");
      var width = positiveInteger_(image.width_px, label + ".width_px", 50000);
      var height = positiveInteger_(image.height_px, label + ".height_px", 50000);
      if (width * height > 100000000) throw new Error("IMAGE_PIXEL_LIMIT_EXCEEDED");
      var fileSize = positiveInteger_(image.file_size_bytes, label + ".file_size_bytes", 26214400);
      if (typeof image.has_alpha !== "boolean") {
        throw new Error("VALIDATION_INVALID_TYPE: " + label + ".has_alpha");
      }

      normalized.sha256 = sha;
      normalized.drive_file_id = driveId;
      normalized.original_name = originalName;
      normalized.mime_type = mimeType;
      normalized.width_px = width;
      normalized.height_px = height;
      normalized.file_size_bytes = fileSize;
      normalized.has_alpha = image.has_alpha;

      var pageId = optionalString_(image.catalog_page_id, label + ".catalog_page_id", 180);
      if (pageId) normalized.catalog_page_id = pageId;
      if (image.page_number !== undefined && image.page_number !== null && image.page_number !== "") {
        normalized.page_number = positiveInteger_(image.page_number, label + ".page_number", 1000000);
      }
      var targetType = optionalString_(image.target_type, label + ".target_type", 20);
      var targetId = optionalString_(image.target_id, label + ".target_id", 120);
      if (Boolean(targetType) !== Boolean(targetId)) {
        throw new Error("IMAGE_TARGET_PAIR_REQUIRED");
      }
      if (targetType) {
        if (["PRODUCT", "VARIANT"].indexOf(targetType) < 0) {
          throw new Error("VALIDATION_INVALID_FORMAT: " + label + ".target_type");
        }
        normalized.target_type = targetType;
        normalized.target_id = targetId;
      }
      return normalized;
    });

    return { images: images, run_id: runId, catalog_id: catalogId };
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

  function productSearchPayload_(payload) {
    if (!isPlainObject_(payload)) throw new Error("VALIDATION_INVALID_OBJECT: payload");
    var allowed = ["query"];
    Object.keys(payload).forEach(function (key) {
      if (allowed.indexOf(key) < 0) throw new Error("VALIDATION_UNKNOWN_FIELD: " + key);
    });
    return { query: optionalString_(payload.query, "query", 200).toLowerCase() };
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

  function variantUpdatePayload_(payload) {
    if (!isPlainObject_(payload)) throw new Error("VALIDATION_INVALID_OBJECT: payload");
    var allowed = ["variantId", "modelNameEn", "modelNameAr", "notes"];
    Object.keys(payload).forEach(function (key) {
      if (allowed.indexOf(key) < 0) throw new Error("VALIDATION_UNKNOWN_FIELD: " + key);
    });
    return {
      variantId: id_(payload.variantId, "variantId"),
      modelNameEn: payload.modelNameEn !== undefined ? optionalString_(payload.modelNameEn, "modelNameEn", 250) : undefined,
      modelNameAr: payload.modelNameAr !== undefined ? optionalString_(payload.modelNameAr, "modelNameAr", 250) : undefined,
      notes: payload.notes !== undefined ? optionalString_(payload.notes, "notes", 2000) : undefined
    };
  }

  function attributeSetPayload_(payload) {
    if (!isPlainObject_(payload)) throw new Error("VALIDATION_INVALID_OBJECT: payload");
    var allowed = ["productId", "variantId", "attributeId", "valueJson", "mode"];
    Object.keys(payload).forEach(function (key) {
      if (allowed.indexOf(key) < 0) throw new Error("VALIDATION_UNKNOWN_FIELD: " + key);
    });
    var mode = optionalString_(payload.mode, "mode", 30);
    if (mode && ["VALUE", "INTENTIONALLY_EMPTY"].indexOf(mode) < 0) throw new Error("VALIDATION_INVALID_FORMAT: mode");
    return {
      productId: optionalId_(payload.productId, "productId"),
      variantId: optionalId_(payload.variantId, "variantId"),
      attributeId: id_(payload.attributeId, "attributeId"),
      valueJson: optionalString_(payload.valueJson, "valueJson", 2000),
      mode: mode
    };
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

  function effectiveSpecPayload_(payload) {
    if (!isPlainObject_(payload)) throw new Error("VALIDATION_INVALID_OBJECT: payload");
    var allowed = ["productId", "variantId"];
    Object.keys(payload).forEach(function (key) {
      if (allowed.indexOf(key) < 0) throw new Error("VALIDATION_UNKNOWN_FIELD: " + key);
    });
    return {
      productId: id_(payload.productId, "productId"),
      variantId: optionalId_(payload.variantId, "variantId")
    };
  }

  function idOnlyPayload_(payload, field) {
    if (!isPlainObject_(payload)) throw new Error("VALIDATION_INVALID_OBJECT: payload");
    return { [field]: id_(payload[field], field) };
  }

  return {
    catalogPayload: catalogPayload_,
    uploadMetadata: uploadMetadata_,
    promotionPayload: promotionPayload_,
    imagesPromotePayload: imagesPromotePayload_,
    productCreatePayload: productCreatePayload_,
    productUpdatePayload: productUpdatePayload_,
    productSearchPayload: productSearchPayload_,
    variantCreatePayload: variantCreatePayload_,
    variantUpdatePayload: variantUpdatePayload_,
    attributeSetPayload: attributeSetPayload_,
    familyPayload: familyPayload_,
    specificationChangePayload: specificationChangePayload_,
    effectiveSpecPayload: effectiveSpecPayload_,
    idOnlyPayload: idOnlyPayload_
  };
})();
