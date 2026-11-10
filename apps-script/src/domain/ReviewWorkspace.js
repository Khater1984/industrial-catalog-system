/** Controlled review-queue workflow actions; no staging approval or promotion. */
var ReviewWorkspace = (function () {
  var ALLOWED = { OPEN: true, IN_REVIEW: true, DEFERRED: true, REJECTED: true };
  var TRANSITIONS = {
    OPEN: { IN_REVIEW: true, DEFERRED: true, REJECTED: true },
    IN_REVIEW: { OPEN: true, DEFERRED: true, REJECTED: true },
    DEFERRED: { OPEN: true, IN_REVIEW: true, REJECTED: true },
    REJECTED: {}
  };
  function fail_(code) { throw new Error(code); }
  function updateStatus(options, actor) {
    if (!options || typeof options.reviewId !== "string" || !/^[A-Za-z0-9_-]{8,160}$/.test(options.reviewId)) fail_("REVIEW_ID_INVALID");
    var next = String(options.status || "");
    if (!ALLOWED[next]) fail_("REVIEW_STATUS_INVALID");
    var notes = options.notes === undefined || options.notes === null ? "" : String(options.notes).trim();
    if (notes.length > 1500) fail_("REVIEW_NOTES_TOO_LONG");
    if (!actor || String(actor).length > 120) fail_("REVIEW_ACTOR_MISSING");
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var current = SheetsRepository.getBy("Review_Queue", "Review_Queue_ID", options.reviewId);
      if (!current) fail_("REVIEW_NOT_FOUND");
      var from = String(current.Review_Status || "");
      if (!TRANSITIONS[from] || !TRANSITIONS[from][next]) fail_("REVIEW_TRANSITION_NOT_ALLOWED");
      var now = new Date().toISOString(), patch = { Review_Status: next, Decision_Notes: notes };
      if (next === "IN_REVIEW") patch.Assigned_Actor_ID = String(actor);
      if (next === "REJECTED" || next === "DEFERRED") { patch.Reviewed_At = now; patch.Reviewed_By = String(actor); }
      if (next === "OPEN") { patch.Assigned_Actor_ID = ""; patch.Reviewed_At = ""; patch.Reviewed_By = ""; }
      SheetsRepository.updateBy("Review_Queue", "Review_Queue_ID", options.reviewId, patch);
      return { reviewId: options.reviewId, previousStatus: from, status: next };
    } finally { lock.releaseLock(); }
  }
  return { updateStatus: updateStatus };
})();
