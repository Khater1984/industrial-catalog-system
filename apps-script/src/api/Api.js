var Api = (function () {
  function requestId_(body) {
    var supplied = body && typeof body.request_id === "string" ? body.request_id.trim() : "";
    return supplied && supplied.length <= 100 ? supplied : Utilities.getUuid();
  }
  function success_(requestId, data) {
    return jsonResponse_({
      protocol_version: "1",
      request_id: requestId,
      correlation_id: requestId,
      ok: true,
      data: data,
      error: null
    });
  }
  function failure_(requestId, code) {
    return jsonResponse_({
      protocol_version: "1",
      request_id: requestId,
      correlation_id: requestId,
      ok: false,
      data: null,
      error: { code: code, message: "Request could not be completed.", retryable: false }
    });
  }
  function safeCode_(err) {
    var message = String(err && err.message ? err.message : "");
    var match = message.match(/^([A-Z][A-Z0-9_]{2,80})/);
    return match ? match[1] : "REQUEST_FAILED";
  }
  function health(e) {
    var requestId = Utilities.getUuid();
    try {
      assertPrimaryUser_();
      var props = PropertiesService.getScriptProperties();
      return success_(requestId, {
        appVersion: APP.VERSION,
        schemaVersion: APP.SCHEMA_VERSION,
        environment: APP.ENVIRONMENT,
        spreadsheetConfigured: Boolean(props.getProperty("DEV_SPREADSHEET_ID")),
        schemaInitialized: props.getProperty("APP_SCHEMA_VERSION") === APP.SCHEMA_VERSION
      });
    } catch (err) {
      return failure_(requestId, safeCode_(err));
    }
  }
  function post(e) {
    var body = {};
    var requestId = Utilities.getUuid();
    try {
      var raw = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
      if (raw.length > 20000) return failure_(requestId, "REQUEST_TOO_LARGE");
      body = JSON.parse(raw);
      if (!body || Object.prototype.toString.call(body) !== "[object Object]") {
        return failure_(requestId, "INVALID_REQUEST");
      }
      requestId = requestId_(body);
      assertPrimaryUser_();
      if (body.protocol_version && body.protocol_version !== "1") {
        return failure_(requestId, "UNSUPPORTED_PROTOCOL_VERSION");
      }
      var p = body.payload || {};
      var actor = APP.ACTOR_ID;

      if (body.action === "catalog.register") {
        var payload = InputValidation.catalogPayload(p);
        var registered = CatalogService.register(payload);
        registered.workerDispatch = dispatchRegisteredCatalog_(registered);
        return success_(requestId, registered);
      }
      if (body.action === "staging.promote") {
        var promoPayload = InputValidation.promotionPayload(p);
        var promoted = StagingPromotion.promoteReviewedStaging({
          stagingSetFileId: promoPayload.stagingSetFileId,
          stagingSetSha256: promoPayload.stagingSetSha256,
          actor: actor
        });
        return success_(requestId, promoted);
      }
      if (body.action === "images.promote") {
        var imgPayload = InputValidation.imagesPromotePayload(p);
        var imgResult = ImagePromotion.promoteAcceptedImages({
          images: imgPayload.images,
          run_id: imgPayload.run_id,
          catalog_id: imgPayload.catalog_id,
          actor: actor
        });
        return success_(requestId, imgResult);
      }
      if (body.action === "images.intake") {
        var intakeResult = ImageReviewIntake.intake({
          imageManifestFileId: p.imageManifestFileId,
          imageManifestSha256: p.imageManifestSha256,
          driveManifestFileId: p.driveManifestFileId,
          driveManifestSha256: p.driveManifestSha256,
          actor: actor
        });
        return success_(requestId, intakeResult);
      }

      // Product domain — all validated at boundary
      if (body.action === "product.createCompanyRecord") {
        var pc = InputValidation.productCreatePayload(p);
        return success_(requestId, ProductService.create(Object.assign({ actor: actor }, pc)));
      }
      if (body.action === "product.getWorkspace") {
        var gw = InputValidation.idOnlyPayload(p, "productId");
        return success_(requestId, ProductService.getWorkspace(gw.productId));
      }
      if (body.action === "product.search") {
        var ps = InputValidation.productSearchPayload(p);
        return success_(requestId, { results: ProductService.search(ps.query) });
      }
      if (body.action === "product.updateCompanyFields") {
        var pu = InputValidation.productUpdatePayload(p);
        return success_(requestId, ProductService.updateCompany(pu.productId, pu, actor));
      }
      if (body.action === "product.archive" || body.action === "product.reactivate") {
        var pid = InputValidation.idOnlyPayload(p, "productId");
        var fn = body.action === "product.archive" ? ProductService.archive : ProductService.reactivate;
        return success_(requestId, fn(pid.productId, actor));
      }
      if (body.action === "family.create" || body.action === "family.updateParent" || body.action === "family.archive" || body.action === "family.reactivate") {
        var fp = InputValidation.familyPayload(p);
        if (body.action === "family.create") return success_(requestId, ProductFamilyService.create(fp.nameEn, fp.nameAr, fp.parentId, actor));
        if (body.action === "family.updateParent") return success_(requestId, ProductFamilyService.updateParent(fp.familyId, fp.newParentId, actor));
        if (body.action === "family.archive") return success_(requestId, ProductFamilyService.archive(fp.familyId, actor));
        return success_(requestId, ProductFamilyService.reactivate(fp.familyId, actor));
      }
      if (body.action === "variant.createCompanyRecord") {
        var vc = InputValidation.variantCreatePayload(p);
        return success_(requestId, VariantService.create(vc.productId, Object.assign({ actor: actor }, vc)));
      }
      if (body.action === "variant.updateCompanyFields") {
        var vu = InputValidation.variantUpdatePayload(p);
        return success_(requestId, VariantService.updateCompany(vu.variantId, vu, actor));
      }
      if (body.action === "variant.archive" || body.action === "variant.reactivate") {
        var vid = InputValidation.idOnlyPayload(p, "variantId");
        var vfn = body.action === "variant.archive" ? VariantService.archive : VariantService.reactivate;
        return success_(requestId, vfn(vid.variantId, actor));
      }
      if (body.action === "attribute.setProductValue") {
        var ap = InputValidation.attributeSetPayload(p);
        return success_(requestId, AttributeService.setProductValue(ap.productId, ap.attributeId, ap.valueJson, actor));
      }
      if (body.action === "attribute.setVariantOverride") {
        var ao = InputValidation.attributeSetPayload(p);
        return success_(requestId, AttributeService.setVariantOverride(ao.variantId, ao.attributeId, ao.mode, ao.valueJson, actor));
      }
      if (body.action === "attribute.clearVariantOverride") {
        var ac = InputValidation.attributeSetPayload(p);
        return success_(requestId, AttributeService.clearVariantOverride(ac.variantId, ac.attributeId, actor));
      }
      if (body.action === "specification.appendChange") {
        var sc = InputValidation.specificationChangePayload(p);
        return success_(requestId, SpecificationService.appendDraft(Object.assign({ actor: actor }, sc)));
      }
      if (body.action === "specification.approveChange" || body.action === "specification.rejectChange") {
        var sid = InputValidation.idOnlyPayload(p, "changeId");
        var sfn = body.action === "specification.approveChange" ? SpecificationService.approve : SpecificationService.reject;
        return success_(requestId, sfn(sid.changeId, actor));
      }
      if (body.action === "specification.getEffective") {
        var se = InputValidation.effectiveSpecPayload(p);
        return success_(requestId, EffectiveSpecificationResolver.resolveEffectiveSpecifications(se.productId, se.variantId || null));
      }

      return failure_(requestId, "UNSUPPORTED_ACTION");
    } catch (err) {
      return failure_(requestId, safeCode_(err));
    }
  }
  return { health: health, post: post };
})();

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : "";
  if (action === "health") return Api.health(e);
  assertPrimaryUser_();
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("Industrial Catalog Studio")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

/** Browser upload endpoint. The deployed web app is restricted to the primary owner. */
function uploadCatalogFromBrowser(payload) {
  assertPrimaryUser_();
  var upload = InputValidation.uploadMetadata(payload);
  var name = upload.fileName;
  var bytesEncoded = upload.base64;
  var bytesLength = bytesEncoded.length;
  if (bytesLength > 16777216) throw new Error("INVALID_BASE64_OR_FILE_TOO_LARGE");
  var bytes = Utilities.base64Decode(bytesEncoded);
  if (bytes.length < 8 || bytes.length > 12 * 1024 * 1024) throw new Error("FILE_SIZE_OUT_OF_RANGE");
  var signature = bytes.slice(0, 5).map(function (byte) { return String.fromCharCode(byte < 0 ? byte + 256 : byte); }).join("");
  if (signature !== "%PDF-") throw new Error("INVALID_PDF_SIGNATURE");
  var folderId = PropertiesService.getScriptProperties().getProperty("DEV_CATALOG_FOLDER_ID");
  if (!folderId) throw new Error("CONFIG_MISSING: DEV_CATALOG_FOLDER_ID");
  var blob = Utilities.newBlob(bytes, "application/pdf", name);
  var file = DriveApp.getFolderById(folderId).createFile(blob);
  var catalogPayload = InputValidation.catalogPayload({
    driveFileId: file.getId(),
    supplierName: upload.supplierName,
    catalogTitle: upload.catalogTitle,
    catalogRevision: upload.catalogRevision
  });
  var registered = CatalogService.register(catalogPayload);
  var workerDispatch = dispatchRegisteredCatalog_(registered);
  return {
    catalogId: registered.catalogId,
    runId: registered.runId,
    fileName: file.getName(),
    sha256: registered.sha256,
    status: registered.status,
    idempotentReplay: registered.idempotentReplay,
    workerDispatch: workerDispatch
  };
}

/** Owner-only data endpoint called by the HtmlService dashboard. */
function getCatalogDashboard() {
  assertPrimaryUser_();
  var catalogs = SheetsRepository.listRecent("Catalogs", 30);
  var runs = SheetsRepository.listRecent("Run_Log", 60);
  var sheet = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("DEV_SPREADSHEET_ID")).getSheetByName("Catalogs");
  return { catalogs: catalogs, runs: runs, totalCount: sheet ? Math.max(0, sheet.getLastRow() - 1) : 0 };
}

/** Run manually from the Apps Script editor after DEV properties are configured. */
function initializeDevSchema() {
  assertPrimaryUser_();
  return SheetsRepository.initialize();
}

/** Owner-only endpoint for promoting a reviewed staging set from Drive. */
function promoteStagingFromBrowser(payload) {
  assertPrimaryUser_();
  var validated = InputValidation.promotionPayload(payload || {});
  return StagingPromotion.promoteReviewedStaging({
    stagingSetFileId: validated.stagingSetFileId,
    stagingSetSha256: validated.stagingSetSha256,
    actor: APP.ACTOR_ID
  });
}

/** Owner-only endpoint for promoting accepted images. */
function promoteImagesFromBrowser(payload) {
  assertPrimaryUser_();
  var validated = InputValidation.imagesPromotePayload(payload || {});
  return ImagePromotion.promoteAcceptedImages({
    images: validated.images,
    run_id: validated.run_id,
    catalog_id: validated.catalog_id,
    actor: APP.ACTOR_ID
  });
}

/** Owner-only endpoint for image review intake. */
function intakeImagesFromBrowser(payload) {
  assertPrimaryUser_();
  return ImageReviewIntake.intake({
    imageManifestFileId: payload.imageManifestFileId,
    imageManifestSha256: payload.imageManifestSha256,
    driveManifestFileId: payload.driveManifestFileId,
    driveManifestSha256: payload.driveManifestSha256,
    actor: APP.ACTOR_ID
  });
}

function doPost(e) {
  return Api.post(e);
}


/** Owner-only review inbox data for the DEV dashboard. */
function getReviewInboxFromBrowser() {
  assertPrimaryUser_();
  return ReviewWorkspace.getInbox();
}

/** Owner-only review queue state update; this does not approve or promote staging data. */
function updateReviewStatusFromBrowser(payload) {
  assertPrimaryUser_();
  if (!payload || Object.prototype.toString.call(payload) !== "[object Object]") throw new Error("REVIEW_PAYLOAD_INVALID");
  return ReviewWorkspace.updateStatus(payload, APP.ACTOR_ID);
}
