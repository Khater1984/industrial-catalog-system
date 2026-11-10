/** Controlled review-queue workflow actions.
 * Status updates are operational only: they never approve staging data or promote canonical records.
 */
var ReviewWorkspace = (function () {
  var ALLOWED = { OPEN: true, IN_REVIEW: true, DEFERRED: true, REJECTED: true };
  var TRANSITIONS = {
    OPEN: { IN_REVIEW: true, DEFERRED: true, REJECTED: true },
    IN_REVIEW: { OPEN: true, DEFERRED: true, REJECTED: true },
    DEFERRED: { OPEN: true, IN_REVIEW: true, REJECTED: true },
    REJECTED: {}
  };
  function fail_(code) { throw new Error(code); }
  function text_(value, limit) {
    var s = value === null || value === undefined ? "" : String(value).trim();
    if (s.length > limit) fail_("REVIEW_NOTES_TOO_LONG");
    return s;
  }
  function updateStatus(options, actor) {
    if (!options || typeof options.reviewId !== "string" ||
        !/^[A-Za-z0-9_-]{8,160}$/.test(options.reviewId)) fail_("REVIEW_ID_INVALID");
    var next = String(options.status || "");
    if (!ALLOWED[next]) fail_("REVIEW_STATUS_INVALID");
    var notes = text_(options.notes || "", 1500);
    var reviewer = text_(actor || "", 120);
    if (!reviewer) fail_("REVIEW_ACTOR_MISSING");
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var current = SheetsRepository.getBy("Review_Queue", "Review_Queue_ID", options.reviewId);
      if (!current) fail_("REVIEW_NOT_FOUND");
      var from = String(current.Review_Status || "");
      if (!TRANSITIONS[from] || !TRANSITIONS[from][next]) fail_("REVIEW_TRANSITION_NOT_ALLOWED");
      var now = new Date().toISOString();
      var patch = { Review_Status: next, Decision_Notes: notes };
      if (next === "IN_REVIEW") patch.Assigned_Actor_ID = reviewer;
      if (next === "REJECTED" || next === "DEFERRED") {
        patch.Reviewed_At = now;
        patch.Reviewed_By = reviewer;
      }
      if (next === "OPEN") {
        patch.Assigned_Actor_ID = "";
        patch.Reviewed_At = "";
        patch.Reviewed_By = "";
      }
      SheetsRepository.updateBy("Review_Queue", "Review_Queue_ID", options.reviewId, patch);
      return { reviewId: options.reviewId, previousStatus: from, status: next };
    } finally {
      lock.releaseLock();
    }
  }
  return { updateStatus: updateStatus };
})();
