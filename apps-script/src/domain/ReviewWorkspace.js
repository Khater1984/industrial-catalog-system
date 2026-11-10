/** Read-only extraction review workspace and safe review-status controls.
 *
 * This layer exposes staged evidence to the owner without promoting or editing
 * canonical product, variant, specification, or image records.
 */
var ReviewWorkspace = (function () {
  function fail_(code) { throw new Error(code); }
  function require_(condition, code) { if (!condition) fail_(code); }
  function shortText_(value, max) {
    var s = typeof value === "string" ? value : "";
    return s.length > max ? s.slice(0, max) : s;
  }
  function safeArtifact_(fileId, cache) {
    if (!fileId) return null;
    if (Object.prototype.hasOwnProperty.call(cache, fileId)) return cache[fileId];
    try {
      var file = DriveApp.getFileById(fileId);
      var parsed = JSON.parse(file.getBlob().getDataAsString("UTF-8"));
      cache[fileId] = parsed && typeof parsed === "object" ? parsed : null;
    } catch (err) {
      cache[fileId] = null;
    }
    return cache[fileId];
  }
  function projectCandidates_(staging, cache) {
    if (!staging || !staging.Raw_Extract_File_ID || staging.Extraction_Method === "IMAGE_EXTRACTION") return null;
    var artifact = safeArtifact_(staging.Raw_Extract_File_ID, cache);
    if (!artifact) return { unavailable: true };
    var set = artifact.product_candidates || {};
    function project(list, fields) {
      return (Array.isArray(list) ? list : []).slice(0, 40).map(function (item) {
        var out = {};
        fields.forEach(function (key) {
          if (item && item[key] !== undefined && item[key] !== null) out[key] = shortText_(String(item[key]), 1200);
        });
        return out;
      });
    }
    return {
      page_number: artifact.page_number || staging.Catalog_Page_ID || "",
      extraction_method: artifact.extraction_method || staging.Extraction_Method || "",
      warnings: Array.isArray(artifact.warnings) ? artifact.warnings.slice(0, 20).map(function (x) { return shortText_(String(x), 300); }) : [],
      products: project(set.products, ["proposed_product_name", "source_quote", "confidence"]),
      variants: project(set.variants, ["proposed_model_number", "proposed_model_name", "source_quote", "confidence"]),
      specifications: project(set.specifications, ["attribute_key_raw", "value_raw", "unit_raw", "source_quote", "confidence"])
    };
  }
  function projectStaging_(record, cache) {
    if (!record) return null;
    var out = {
      staging_id: record.Staging_ID,
      run_id: record.Run_ID,
      catalog_id: record.Catalog_ID,
      catalog_page_id: record.Catalog_Page_ID || "",
      raw_extract_file_id: record.Raw_Extract_File_ID || "",
      extraction_method: record.Extraction_Method || "",
      confidence: record.Confidence || "",
      proposed_status: record.Proposed_Status || "",
      extracted_text: shortText_(record.Extracted_Text || "", 1200),
      proposed_product_name: record.Proposed_Product_Name_EN || "",
      proposed_model_number: record.Proposed_Model_Number || "",
      proposed_model_name: record.Proposed_Model_Name || "",
      attribute_key: record.Attribute_Key_Raw || "",
      value_raw: record.Value_Raw || "",
      unit_raw: record.Unit_Raw || "",
      original_file_name: record.Original_File_Name || "",
      mime_type: record.MIME_Type || "",
      width_px: record.Width_PX || "",
      height_px: record.Height_PX || "",
      file_size_bytes: record.File_Size_Bytes || "",
      sha256: record.SHA256 || "",
      image_file_id: record.Proposed_Image_File_ID || "",
      image_preview_url: record.Proposed_Image_File_ID
        ? "https://drive.google.com/thumbnail?id=" + encodeURIComponent(record.Proposed_Image_File_ID) + "&sz=w640"
        : "",
      quality_status: record.Quality_Status || ""
    };
    out.page_evidence = projectCandidates_(record, cache);
    return out;
  }
  function getDashboard(limit) {
    var max = Math.min(200, Math.max(1, Number(limit) || 100));
    var allQueues = SheetsRepository.listAll("Review_Queue");
    // Keep active work visible even when the queue has a long terminal history.
    var active = allQueues.filter(function (q) {
      return ["OPEN", "IN_REVIEW", "DEFERRED"].indexOf(q.Review_Status) >= 0;
    });
    var terminal = allQueues.filter(function (q) {
      return ["OPEN", "IN_REVIEW", "DEFERRED"].indexOf(q.Review_Status) < 0;
    });
    var queues = active.concat(terminal).slice(0, max);
    var queueIds = {};
    queues.forEach(function (q) { queueIds[q.Review_Queue_ID] = true; });
    var links = SheetsRepository.listAll("Review_Staging_Links").filter(function (link) {
      return !!queueIds[link.Review_Queue_ID];
    });
    var stagingById = {};
    ["Staging_Products", "Staging_Variants", "Staging_Specifications", "Staging_Images"].forEach(function (table) {
      SheetsRepository.listAll(table).forEach(function (record) {
        stagingById[record.Staging_ID] = record;
      });
    });
    var linksByQueue = {};
    links.forEach(function (link) {
      if (!linksByQueue[link.Review_Queue_ID]) linksByQueue[link.Review_Queue_ID] = [];
      linksByQueue[link.Review_Queue_ID].push(link);
    });
    var artifactCache = {};
    var items = queues.map(function (queue) {
      var linked = (linksByQueue[queue.Review_Queue_ID] || []).map(function (link) {
        var staging = stagingById[link.Staging_ID];
        return { role: link.Review_Role, staging: projectStaging_(staging, artifactCache) };
      }).filter(function (item) { return !!item.staging; });
      return {
        review_queue_id: queue.Review_Queue_ID,
        review_type: queue.Review_Type,
        priority: queue.Priority,
        review_status: queue.Review_Status,
        proposed_action: queue.Proposed_Action || "",
        decision_notes: queue.Decision_Notes || "",
        created_at: queue.Created_At || "",
        assigned_actor_id: queue.Assigned_Actor_ID || "",
        staging_items: linked
      };
    });
    var counts = { total: items.length, open: 0, in_review: 0, deferred: 0, completed: 0 };
    items.forEach(function (item) {
      if (item.review_status === "OPEN") counts.open += 1;
      else if (item.review_status === "IN_REVIEW") counts.in_review += 1;
      else if (item.review_status === "DEFERRED") counts.deferred += 1;
      else counts.completed += 1;
    });
    return { items: items, counts: counts, limit: max };
  }
  function setStatus(payload) {
    require_(payload && typeof payload.reviewQueueId === "string", "REVIEW_QUEUE_ID_REQUIRED");
    var status = String(payload.status || "");
    require_(["OPEN", "IN_REVIEW", "DEFERRED"].indexOf(status) >= 0, "REVIEW_STATUS_TRANSITION_NOT_ALLOWED");
    var notes = typeof payload.notes === "string" ? payload.notes.trim() : "";
    require_(notes.length <= 1500, "REVIEW_NOTES_TOO_LONG");
    var current = SheetsRepository.getBy("Review_Queue", "Review_Queue_ID", payload.reviewQueueId);
    require_(current, "REVIEW_QUEUE_NOT_FOUND");
    require_(["OPEN", "IN_REVIEW", "DEFERRED"].indexOf(current.Review_Status) >= 0,
      "REVIEW_ITEM_IS_TERMINAL");
    var patch = { Review_Status: status, Decision_Notes: notes };
    if (status === "IN_REVIEW") patch.Assigned_Actor_ID = APP.ACTOR_ID;
    else if (status === "OPEN") patch.Assigned_Actor_ID = "";
    SheetsRepository.updateBy("Review_Queue", "Review_Queue_ID", payload.reviewQueueId, patch);
    return { review_queue_id: payload.reviewQueueId, review_status: status };
  }
  return { getDashboard: getDashboard, setStatus: setStatus };
})();
