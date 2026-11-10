/** Read-only browser projection for the human review queue. */
var ReviewDashboard = (function () {
  function safeUrl_(fileId) {
    if (!fileId || typeof fileId !== "string") return "";
    try { return DriveApp.getFileById(fileId).getUrl(); } catch (err) { return ""; }
  }
  function index_(rows, key) {
    var out = {};
    (rows || []).forEach(function (row) { if (row && row[key]) out[String(row[key])] = row; });
    return out;
  }
  function short_(value, limit) {
    var s = value === null || value === undefined ? "" : String(value);
    return s.length > limit ? s.slice(0, limit) + "…" : s;
  }
  function candidateSummary_(artifact) {
    var set = artifact && artifact.product_candidates || {};
    function pick(list, fields) {
      return (Array.isArray(list) ? list : []).slice(0, 30).map(function (item) {
        var out = {};
        fields.forEach(function (field) {
          if (item && item[field] !== undefined && item[field] !== null) out[field] = short_(item[field], 500);
        });
        return out;
      });
    }
    return {
      products: pick(set.products, ["proposed_product_name", "proposed_product_reference", "source_quote", "confidence"]),
      variants: pick(set.variants, ["proposed_model_number", "proposed_model_name", "source_quote", "confidence"]),
      specifications: pick(set.specifications, ["attribute_key_raw", "value_raw", "unit_raw", "source_quote", "confidence"]),
      extractedText: short_(artifact && artifact.extracted_text, 1800),
      pageText: short_(artifact && artifact.extracted_text, 1800),
      pageNumber: artifact && artifact.page_number || "",
      extractionMethod: artifact && artifact.extraction_method || ""
    };
  }
  function getQueue() {
    var reviews = SheetsRepository.listRecent("Review_Queue", 250);
    var links = SheetsRepository.listAll("Review_Staging_Links");
    var products = index_(SheetsRepository.listAll("Staging_Products"), "Staging_ID");
    var variants = index_(SheetsRepository.listAll("Staging_Variants"), "Staging_ID");
    var specs = index_(SheetsRepository.listAll("Staging_Specifications"), "Staging_ID");
    var images = index_(SheetsRepository.listAll("Staging_Images"), "Staging_ID");
    var docs = index_(SheetsRepository.listAll("Staging_Documents"), "Staging_ID");
    var catalogs = index_(SheetsRepository.listAll("Catalogs"), "Catalog_ID");
    var pages = index_(SheetsRepository.listAll("Catalog_Pages"), "Catalog_Page_ID");
    var units = SheetsRepository.listAll("Run_Units");
    var artifacts = {};
    var linksByReview = {};
    links.forEach(function (link) {
      (linksByReview[link.Review_Queue_ID] || (linksByReview[link.Review_Queue_ID] = [])).push(link);
    });
    function artifactSummary_(id) {
      if (!id) return null;
      if (Object.prototype.hasOwnProperty.call(artifacts, id)) return artifacts[id];
      try {
        var data = JSON.parse(DriveApp.getFileById(id).getBlob().getDataAsString("UTF-8"));
        artifacts[id] = candidateSummary_(data);
      } catch (err) { artifacts[id] = { error: "PAGE_ARTIFACT_UNAVAILABLE" }; }
      return artifacts[id];
    }
    var items = reviews.map(function (review) {
      var linked = (linksByReview[review.Review_Queue_ID] || []).slice(0, 30);
      var evidence = [], artifactId = "", runId = "", catalogId = "";
      linked.forEach(function (link) {
        var row = products[link.Staging_ID] || variants[link.Staging_ID] || specs[link.Staging_ID] || images[link.Staging_ID] || docs[link.Staging_ID];
        if (!row) return;
        var type = products[link.Staging_ID] ? "PRODUCT" : variants[link.Staging_ID] ? "VARIANT" :
          specs[link.Staging_ID] ? "SPECIFICATION" : images[link.Staging_ID] ? "IMAGE" : "DOCUMENT";
        if (!artifactId && row.Raw_Extract_File_ID) artifactId = row.Raw_Extract_File_ID;
        runId = runId || row.Run_ID || "";
        catalogId = catalogId || row.Catalog_ID || "";
        var page = pages[row.Catalog_Page_ID] || {};
        evidence.push({
          stagingId: row.Staging_ID, type: type, role: link.Review_Role || "",
          pageNumber: page.Page_Number || "", pageLabel: page.Page_Label || "",
          productName: row.Proposed_Product_Name_EN || "", productReference: row.Proposed_Product_Reference || "",
          modelNumber: row.Proposed_Model_Number || "", modelName: row.Proposed_Model_Name || "",
          attribute: row.Attribute_Key_Raw || row.Normalized_Key || "",
          value: row.Value_Raw || row.Normalized_Value_JSON || "", unit: row.Unit_Raw || row.Normalized_Unit || "",
          imageName: row.Original_File_Name || "", imageFileUrl: safeUrl_(row.Proposed_Image_File_ID || ""),
          fileUrl: safeUrl_(row.Proposed_Image_File_ID || row.Proposed_Document_File_ID || ""),
          imageMime: row.MIME_Type || "", imageWidth: row.Width_PX || "", imageHeight: row.Height_PX || "",
          parentProductStagingId: row.Parent_Staging_Product_ID || "",
          parentVariantStagingId: row.Parent_Staging_Variant_ID || "",
          scope: row.Scope || "", parseStatus: row.Parse_Status || "",
          proposedStatus: row.Proposed_Status || "",
          confidence: row.Confidence === undefined ? "" : row.Confidence,
          extractionMethod: row.Extraction_Method || "", extractedText: short_(row.Extracted_Text, 700),
          sourceArtifactUrl: safeUrl_(row.Raw_Extract_File_ID || "")
        });
      });
      var pageId = "";
      var match = String(review.Proposed_Action || "").match(/page ([^ ]+) in run ([^ .]+)/i);
      if (match) { pageId = match[1]; runId = runId || match[2]; }
      var unit = units.find(function (u) { return u.Run_ID === runId && u.Catalog_Page_ID === pageId; });
      if (!artifactId && unit) artifactId = unit.Output_Manifest_File_ID || "";
      if (!catalogId && runId) {
        var run = SheetsRepository.getBy("Run_Log", "Run_ID", runId);
        catalogId = run && run.Catalog_ID || "";
      }
      var catalog = catalogs[catalogId] || {}, page = pages[pageId] || {};
      var artifact = artifactSummary_(artifactId);
      if (artifact && !page.Page_Number && artifact.pageNumber) page = { Page_Number: artifact.pageNumber };
      if (artifact) artifact.fileUrl = safeUrl_(artifactId);
      return {
        id: review.Review_Queue_ID, reviewId: review.Review_Queue_ID,
        type: review.Review_Type, status: review.Review_Status,
        priority: review.Priority, proposedAction: short_(review.Proposed_Action, 1800),
        notes: short_(review.Decision_Notes || "", 1500),
        decisionNotes: short_(review.Decision_Notes || "", 1500), createdAt: review.Created_At || "",
        runId: runId, catalogId: catalogId, supplierName: catalog.Supplier_Name || "",
        catalogTitle: catalog.Catalog_Title || catalog.Source_File_Name || "",
        sourcePdfUrl: safeUrl_(catalog.Source_File_ID || ""), pageNumber: page.Page_Number || "",
        pageLabel: page.Page_Label || "", pageArtifactUrl: safeUrl_(artifactId),
        evidence: evidence, artifact: artifact, pageArtifact: artifact
      };
    });
    var counts = { total: items.length, open: 0, inReview: 0, deferred: 0, closed: 0 };
    items.forEach(function (item) {
      if (item.status === "OPEN") counts.open += 1;
      else if (item.status === "IN_REVIEW") counts.inReview += 1;
      else if (item.status === "DEFERRED") counts.deferred += 1;
      else counts.closed += 1;
    });
    return { items: items, counts: counts, limit: 250, readOnly: true };
  }
  return { getQueue: getQueue };
})();
