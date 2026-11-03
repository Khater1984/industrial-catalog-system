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
      var dateParts = publishedDate.match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);
      if (!dateParts) throw new Error("VALIDATION_INVALID_FORMAT: publishedDate");
      var date = new Date(Date.UTC(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3])));
      if (date.getUTCFullYear() !== Number(dateParts[1]) || date.getUTCMonth() !== Number(dateParts[2]) - 1 || date.getUTCDate() !== Number(dateParts[3])) {
        throw new Error("VALIDATION_INVALID_FORMAT: publishedDate");
      }
    }
    var languageCode = optionalString_(payload.languageCode, "languageCode", 12);
    if (languageCode && !/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(languageCode)) throw new Error("VALIDATION_INVALID_FORMAT: languageCode");
    var sourceUrl = optionalString_(payload.sourceUrl, "sourceUrl", 2048);
    if (sourceUrl && !/^https?:\\/\\//i.test(sourceUrl)) throw new Error("VALIDATION_INVALID_FORMAT: sourceUrl");
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
  return { catalogPayload: catalogPayload_ };
})();
