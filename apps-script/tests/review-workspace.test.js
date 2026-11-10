const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("src/domain/ReviewWorkspace.js", "utf8");
function fixture() {
  const row = { Review_Queue_ID: "rev_12345678", Review_Status: "OPEN", Decision_Notes: "" };
  const context = {
    SheetsRepository: {
      getBy: (_table, _key, value) => value === row.Review_Queue_ID ? row : null,
      updateBy: (_table, _key, value, patch) => { if (value !== row.Review_Queue_ID) throw new Error("ROW_NOT_FOUND"); Object.assign(row, patch); }
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Date
  };
  vm.runInNewContext(source, context);
  return { workspace: context.ReviewWorkspace, row };
}
test("review task can be claimed and reviewer notes are recorded without staging promotion", () => {
  const ctx = fixture();
  const result = ctx.workspace.updateStatus({ reviewId: "rev_12345678", status: "IN_REVIEW", notes: "Check source" }, "actor_primary");
  assert.equal(result.status, "IN_REVIEW");
  assert.equal(ctx.row.Assigned_Actor_ID, "actor_primary");
  assert.equal(ctx.row.Decision_Notes, "Check source");
});
test("review task can be deferred or rejected and rejection is terminal", () => {
  const ctx = fixture();
  ctx.workspace.updateStatus({ reviewId: "rev_12345678", status: "REJECTED" }, "actor_primary");
  assert.equal(ctx.row.Reviewed_By, "actor_primary");
  assert.throws(() => ctx.workspace.updateStatus({ reviewId: "rev_12345678", status: "OPEN" }, "actor_primary"), /REVIEW_TRANSITION_NOT_ALLOWED/);
});
test("approval, invalid IDs, unknown tasks and oversized notes are refused", () => {
  const ctx = fixture();
  assert.throws(() => ctx.workspace.updateStatus({ reviewId: "rev_12345678", status: "APPROVED" }, "actor_primary"), /REVIEW_STATUS_INVALID/);
  assert.throws(() => ctx.workspace.updateStatus({ reviewId: "bad", status: "OPEN" }, "actor_primary"), /REVIEW_ID_INVALID/);
  assert.throws(() => ctx.workspace.updateStatus({ reviewId: "rev_missing1", status: "OPEN" }, "actor_primary"), /REVIEW_NOT_FOUND/);
  assert.throws(() => ctx.workspace.updateStatus({ reviewId: "rev_12345678", status: "IN_REVIEW", notes: "x".repeat(1501) }, "actor_primary"), /REVIEW_NOTES_TOO_LONG/);
});
