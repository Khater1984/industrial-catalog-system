/**
 * Shared document library: immutable versions, explicit links and deterministic inheritance.
 * Binary originals live in the private DEV_DOCUMENTS_FOLDER_ID Drive folder.
 */
var DocumentService = (function () {
  function text_(value, max, code, required) {
    var s = value === null || value === undefined ? "" : String(value).trim();
    if (required && !s) throw new Error(code + "_REQUIRED");
    if (s.length > max) throw new Error(code + "_TOO_LONG");
    return s;
  }
  function id_(prefix) { return prefix + "_" + Utilities.getUuid().replace(/-/g, ""); }
  function now_() { return new Date().toISOString(); }
  function actor_(value) { return value || APP.ACTOR_ID; }
  function lock_() {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) throw new Error("DOCUMENT_LOCK_BUSY");
    return lock;
  }
  function rows_(table) { return SheetsRepository.listAll(table); }
  function one_(table, key, value) {
    var row = SheetsRepository.getBy(table, key, value);
    return row || null;
  }
  function digest_(bytes) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes)
      .map(function (b) { var v = (b < 0 ? b + 256 : b).toString(16); return v.length === 1 ? "0" + v : v; }).join("");
  }
  function audit_(action, type, entityId, beforeValue, afterValue, reason) {
    var payload = JSON.stringify({ action: action, entity_type: type, entity_id: entityId,
      before: beforeValue || null, after: afterValue || null, reason: reason || "" });
    var hash = digest_(Utilities.newBlob(payload).getBytes());
    SheetsRepository.append("Audit_Log", {
      Audit_ID: id_("aud"), Event_Idempotency_Key: "document|" + action + "|" + entityId + "|" + hash.slice(0, 32),
      Payload_SHA256: hash, Event_At: now_(), Actor_ID: APP.ACTOR_ID, Action: action,
      Entity_Type: type, Entity_ID: entityId, Before_Value_JSON: beforeValue ? JSON.stringify(beforeValue).slice(0, 3000) : "",
      After_Value_JSON: afterValue ? JSON.stringify(afterValue).slice(0, 3000) : "", Reason: reason || ""
    });
  }
  function validateTarget_(type, targetId) {
    if (type === "PRODUCT") {
      if (!one_("Products", "Product_ID", targetId)) throw new Error("DOCUMENT_TARGET_NOT_FOUND");
      return { productId: targetId, variantId: "" };
    }
    if (type === "VARIANT") {
      var variant = one_("Variants", "Variant_ID", targetId);
      if (!variant) throw new Error("DOCUMENT_TARGET_NOT_FOUND");
      return { productId: String(variant.Product_ID), variantId: targetId };
    }
    throw new Error("DOCUMENT_TARGET_TYPE_INVALID");
  }
  function validateVersion_(docId, versionId) {
    if (!versionId) return null;
    var version = one_("Document_Versions", "Version_ID", versionId);
    if (!version || String(version.Doc_ID) !== String(docId)) throw new Error("DOCUMENT_VERSION_OWNERSHIP_MISMATCH");
    if (version.Lifecycle_Status !== "AVAILABLE") throw new Error("DOCUMENT_VERSION_NOT_AVAILABLE");
    return version;
  }
  function fileMetadata_(fileId) {
    if (!/^[A-Za-z0-9_-]{10,200}$/.test(String(fileId || ""))) throw new Error("DOCUMENT_FILE_ID_INVALID");
    var file = DriveApp.getFileById(fileId);
    var blob = file.getBlob();
    var bytes = blob.getBytes();
    if (!bytes.length || bytes.length > 12 * 1024 * 1024) throw new Error("DOCUMENT_FILE_SIZE_INVALID");
    var mime = String(file.getMimeType() || blob.getContentType() || "").toLowerCase();
    if (mime !== "application/pdf") throw new Error("DOCUMENT_FILE_TYPE_UNSUPPORTED");
    if (bytes.length < 8 || bytes.slice(0, 5).map(function (b) { return String.fromCharCode(b < 0 ? b + 256 : b); }).join("") !== "%PDF-") {
      throw new Error("DOCUMENT_PDF_SIGNATURE_INVALID");
    }
    return { file: file, name: file.getName(), mime: mime, size: bytes.length, sha: digest_(bytes) };
  }
  function create_(payload, actor) {
    var p = payload || {};
    var title = text_(p.title, 250, "DOCUMENT_TITLE", true);
    var type = text_(p.documentType, 40, "DOCUMENT_TYPE", true);
    if (!ENUMS["Documents.Document_Type"] || ENUMS["Documents.Document_Type"].indexOf(type) < 0) throw new Error("DOCUMENT_TYPE_INVALID");
    var meta = fileMetadata_(p.driveFileId);
    var duplicate = rows_("Documents").filter(function (d) {
      return rows_("Document_Versions").some(function (v) { return v.Doc_ID === d.Doc_ID && v.SHA256 === meta.sha; });
    })[0];
    if (duplicate) throw new Error("DOCUMENT_DUPLICATE_FILE:" + duplicate.Doc_ID);
    var at = now_(), docId = id_("doc"), versionId = id_("docv");
    var doc = {
      Doc_ID: docId, Document_Type: type, Title: title,
      Language_Code: text_(p.languageCode, 10, "DOCUMENT_LANGUAGE", false),
      Description: text_(p.description, 1500, "DOCUMENT_DESCRIPTION", false),
      Current_Version_ID: "", Lifecycle_Status: "DRAFT",
      Created_At: at, Created_By: actor_(actor), Updated_At: at, Updated_By: actor_(actor)
    };
    var version = {
      Version_ID: versionId, Doc_ID: docId, Version_Label: text_(p.versionLabel || "Version 1", 80, "DOCUMENT_VERSION_LABEL", true),
      Drive_File_ID: String(p.driveFileId), Original_File_Name: meta.name, MIME_Type: meta.mime,
      File_Size_Bytes: meta.size, SHA256: meta.sha, Uploaded_At: at, Uploaded_By: actor_(actor),
      Version_Notes: text_(p.versionNotes, 1000, "DOCUMENT_VERSION_NOTES", false),
      Source_Type: "MANUAL_UPLOAD", Source_Catalog_ID: "", Source_Catalog_Page_ID: "",
      Source_Product_Source_Record_ID: "", Source_Variant_Source_Record_ID: "", Source_Quote: "",
      Source_URL: "", Extraction_Run_ID: "", Extraction_Record_ID: "", Supersedes_Version_ID: "",
      Lifecycle_Status: "AVAILABLE"
    };
    SheetsRepository.append("Documents", doc);
    try {
      SheetsRepository.append("Document_Versions", version);
      SheetsRepository.updateBy("Documents", "Doc_ID", docId, {
        Current_Version_ID: versionId, Lifecycle_Status: "ACTIVE", Updated_At: now_(), Updated_By: actor_(actor)
      });
    } catch (err) {
      throw new Error("DOCUMENT_CREATE_PARTIAL:" + docId + ":" + String(err && err.message || err));
    }
    audit_("CREATE", "DOCUMENT", docId, null, { document: doc, version: version }, "Initial document upload");
    return { document: one_("Documents", "Doc_ID", docId), version: one_("Document_Versions", "Version_ID", versionId) };
  }
  function addVersion_(docId, payload, actor) {
    var p = payload || {}, doc = one_("Documents", "Doc_ID", docId);
    if (!doc || doc.Lifecycle_Status === "ARCHIVED") throw new Error("DOCUMENT_NOT_AVAILABLE");
    var meta = fileMetadata_(p.driveFileId);
    var versions = rows_("Document_Versions").filter(function (v) { return String(v.Doc_ID) === String(docId); });
    if (versions.some(function (v) { return v.SHA256 === meta.sha; })) throw new Error("DOCUMENT_VERSION_DUPLICATE");
    var current = validateVersion_(docId, doc.Current_Version_ID);
    var at = now_(), versionId = id_("docv");
    var version = {
      Version_ID: versionId, Doc_ID: docId, Version_Label: text_(p.versionLabel, 80, "DOCUMENT_VERSION_LABEL", true),
      Drive_File_ID: String(p.driveFileId), Original_File_Name: meta.name, MIME_Type: meta.mime,
      File_Size_Bytes: meta.size, SHA256: meta.sha, Uploaded_At: at, Uploaded_By: actor_(actor),
      Version_Notes: text_(p.versionNotes, 1000, "DOCUMENT_VERSION_NOTES", false),
      Source_Type: "MANUAL_UPLOAD", Source_Catalog_ID: "", Source_Catalog_Page_ID: "",
      Source_Product_Source_Record_ID: "", Source_Variant_Source_Record_ID: "", Source_Quote: "",
      Source_URL: "", Extraction_Run_ID: "", Extraction_Record_ID: "",
      Supersedes_Version_ID: current ? current.Version_ID : "", Lifecycle_Status: "AVAILABLE"
    };
    SheetsRepository.append("Document_Versions", version);
    SheetsRepository.updateBy("Documents", "Doc_ID", docId, {
      Current_Version_ID: versionId, Lifecycle_Status: "ACTIVE", Updated_At: at, Updated_By: actor_(actor)
    });
    audit_("UPDATE", "DOCUMENT", docId, { Current_Version_ID: doc.Current_Version_ID }, { Current_Version_ID: versionId }, "New immutable document version");
    return version;
  }
  function link_(payload, actor) {
    var p = payload || {}, docId = text_(p.docId, 120, "DOCUMENT_ID", true);
    var type = text_(p.targetType, 20, "DOCUMENT_TARGET_TYPE", true);
    var targetId = text_(p.targetId, 120, "DOCUMENT_TARGET_ID", true);
    var mode = text_(p.linkMode || "INCLUDE", 20, "DOCUMENT_LINK_MODE", true);
    var doc = one_("Documents", "Doc_ID", docId);
    if (!doc || doc.Lifecycle_Status !== "ACTIVE") throw new Error("DOCUMENT_NOT_ACTIVE");
    var target = validateTarget_(type, targetId);
    if (type === "PRODUCT" && mode !== "INCLUDE") throw new Error("PRODUCT_DOCUMENT_EXCLUDE_FORBIDDEN");
    if (mode !== "INCLUDE" && mode !== "EXCLUDE") throw new Error("DOCUMENT_LINK_MODE_INVALID");
    var existing = rows_("Document_Links").filter(function (l) {
      return l.Doc_ID === docId && l.Target_Type === type && l.Target_ID === targetId && l.Link_Mode === mode;
    })[0];
    if (existing) return existing;
    if (mode === "EXCLUDE") {
      var inherited = rows_("Document_Links").some(function (l) {
        return l.Doc_ID === docId && l.Target_Type === "PRODUCT" && l.Target_ID === target.productId && l.Link_Mode === "INCLUDE";
      });
      if (!inherited) throw new Error("DOCUMENT_EXCLUDE_WITHOUT_INHERITED_LINK");
    }
    var pinned = validateVersion_(docId, p.pinnedVersionId || "");
    var link = {
      Link_ID: id_("docl"), Doc_ID: docId, Target_Type: type, Target_ID: targetId,
      Link_Mode: mode, Pinned_Version_ID: pinned ? pinned.Version_ID : "",
      Display_Order: Number.isInteger(p.displayOrder) ? p.displayOrder : 0,
      Created_At: now_(), Created_By: actor_(actor), Link_Notes: text_(p.notes, 500, "DOCUMENT_LINK_NOTES", false)
    };
    SheetsRepository.append("Document_Links", link);
    audit_("LINK", "DOCUMENT_LINK", link.Link_ID, null, link, "Document linked to " + type);
    return link;
  }
  function resolve_(type, targetId) {
    var target = validateTarget_(type, targetId);
    var docs = rows_("Documents"), versions = rows_("Document_Versions"), links = rows_("Document_Links");
    var productLinks = links.filter(function (l) {
      return l.Target_Type === "PRODUCT" && l.Target_ID === target.productId && l.Link_Mode === "INCLUDE";
    });
    var directLinks = type === "VARIANT" ? links.filter(function (l) {
      return l.Target_Type === "VARIANT" && l.Target_ID === targetId;
    }) : [];
    var excludes = {};
    directLinks.filter(function (l) { return l.Link_Mode === "EXCLUDE"; }).forEach(function (l) { excludes[l.Doc_ID] = true; });
    var chosen = {};
    productLinks.forEach(function (l) { if (!excludes[l.Doc_ID]) chosen[l.Doc_ID] = { link: l, inherited: true }; });
    directLinks.filter(function (l) { return l.Link_Mode === "INCLUDE"; }).forEach(function (l) {
      chosen[l.Doc_ID] = { link: l, inherited: false };
    });
    return Object.keys(chosen).map(function (docId) {
      var doc = docs.filter(function (d) { return d.Doc_ID === docId && d.Lifecycle_Status === "ACTIVE"; })[0];
      if (!doc) return null;
      var selected = chosen[docId], link = selected.link;
      var versionId = link.Pinned_Version_ID || doc.Current_Version_ID;
      var version = versions.filter(function (v) { return v.Version_ID === versionId && v.Doc_ID === docId && v.Lifecycle_Status === "AVAILABLE"; })[0];
      if (!version) return null;
      return { document: doc, version: version, link: link, inherited: selected.inherited };
    }).filter(Boolean).sort(function (a, b) {
      return Number(a.link.Display_Order || 0) - Number(b.link.Display_Order || 0) || String(a.document.Title).localeCompare(String(b.document.Title));
    });
  }
  function list_() {
    var docs = rows_("Documents"), versions = rows_("Document_Versions"), links = rows_("Document_Links");
    return docs.map(function (doc) {
      return { document: doc, versions: versions.filter(function (v) { return v.Doc_ID === doc.Doc_ID; }),
        links: links.filter(function (l) { return l.Doc_ID === doc.Doc_ID; }) };
    }).sort(function (a, b) { return String(b.document.Updated_At).localeCompare(String(a.document.Updated_At)); });
  }
  function archive_(docId, reason, actor) {
    var doc = one_("Documents", "Doc_ID", docId);
    if (!doc) throw new Error("DOCUMENT_NOT_FOUND");
    if (doc.Lifecycle_Status === "ARCHIVED") return doc;
    SheetsRepository.updateBy("Documents", "Doc_ID", docId, {
      Lifecycle_Status: "ARCHIVED", Updated_At: now_(), Updated_By: actor_(actor)
    });
    audit_("ARCHIVE", "DOCUMENT", docId, { Lifecycle_Status: doc.Lifecycle_Status },
      { Lifecycle_Status: "ARCHIVED" }, text_(reason, 1000, "DOCUMENT_ARCHIVE_REASON", true));
    return one_("Documents", "Doc_ID", docId);
  }
  function withLock_(fn) { var lock = lock_(); try { return fn(); } finally { lock.releaseLock(); } }
  return {
    create: function (p, a) { return withLock_(function () { return create_(p, a); }); },
    addVersion: function (id, p, a) { return withLock_(function () { return addVersion_(id, p, a); }); },
    link: function (p, a) { return withLock_(function () { return link_(p, a); }); },
    resolve: resolve_, list: list_,
    archive: function (id, reason, a) { return withLock_(function () { return archive_(id, reason, a); }); }
  };
})();

/** Owner-only browser actions. Files are stored privately; no public Drive URL is returned. */
function createDocumentFromBrowser(payload) {
  assertPrimaryUser_();
  var p = payload || {};
  var name = String(p.fileName || "").trim();
  var encoded = String(p.base64 || "");
  if (!name || name.length > 255 || !/^[A-Za-z0-9._ ()\-\u0600-\u06FF]+$/.test(name)) throw new Error("DOCUMENT_FILE_NAME_INVALID");
  if (encoded.length > 16777216) throw new Error("DOCUMENT_FILE_TOO_LARGE");
  var bytes = Utilities.base64Decode(encoded);
  if (bytes.length < 8 || bytes.length > 12 * 1024 * 1024) throw new Error("DOCUMENT_FILE_SIZE_INVALID");
  var signature = bytes.slice(0, 5).map(function (b) { return String.fromCharCode(b < 0 ? b + 256 : b); }).join("");
  if (signature !== "%PDF-") throw new Error("DOCUMENT_PDF_SIGNATURE_INVALID");
  var folderId = PropertiesService.getScriptProperties().getProperty("DEV_DOCUMENTS_FOLDER_ID");
  if (!folderId) throw new Error("CONFIG_MISSING: DEV_DOCUMENTS_FOLDER_ID");
  var file = DriveApp.getFolderById(folderId).createFile(Utilities.newBlob(bytes, "application/pdf", name));
  return DocumentService.create({
    title: p.title, documentType: p.documentType, languageCode: p.languageCode,
    description: p.description, versionLabel: p.versionLabel || "Version 1",
    versionNotes: p.versionNotes, driveFileId: file.getId()
  }, APP.ACTOR_ID);
}
function addDocumentVersionFromBrowser(payload) {
  assertPrimaryUser_();
  var p = payload || {}, name = String(p.fileName || "").trim(), encoded = String(p.base64 || "");
  if (!name || name.length > 255 || encoded.length > 16777216) throw new Error("DOCUMENT_UPLOAD_INVALID");
  var bytes = Utilities.base64Decode(encoded);
  if (bytes.length < 8 || bytes.length > 12 * 1024 * 1024) throw new Error("DOCUMENT_FILE_SIZE_INVALID");
  var signature = bytes.slice(0, 5).map(function (b) { return String.fromCharCode(b < 0 ? b + 256 : b); }).join("");
  if (signature !== "%PDF-") throw new Error("DOCUMENT_PDF_SIGNATURE_INVALID");
  var folderId = PropertiesService.getScriptProperties().getProperty("DEV_DOCUMENTS_FOLDER_ID");
  if (!folderId) throw new Error("CONFIG_MISSING: DEV_DOCUMENTS_FOLDER_ID");
  var file = DriveApp.getFolderById(folderId).createFile(Utilities.newBlob(bytes, "application/pdf", name));
  return DocumentService.addVersion(p.docId, {
    driveFileId: file.getId(), versionLabel: p.versionLabel, versionNotes: p.versionNotes
  }, APP.ACTOR_ID);
}
function listDocumentsForBrowser() { assertPrimaryUser_(); return DocumentService.list(); }
function linkDocumentFromBrowser(payload) { assertPrimaryUser_(); return DocumentService.link(payload, APP.ACTOR_ID); }
function resolveDocumentsForBrowser(targetType, targetId) { assertPrimaryUser_(); return DocumentService.resolve(targetType, targetId); }
function archiveDocumentFromBrowser(docId, reason) { assertPrimaryUser_(); return DocumentService.archive(docId, reason, APP.ACTOR_ID); }
