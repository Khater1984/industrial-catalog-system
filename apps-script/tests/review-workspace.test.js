const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("src/domain/ReviewWorkspace.js", "utf8");
function fixture() {
  const tables = {
    Review_Queue: [{ Review_Queue_ID: "rev_12345678", Review_Type: "PRODUCT_MATCH", Priority: "NORMAL", Review_Status: "OPEN", Proposed_Action: "Verify extracted product", Created_At: "2026-11-10T10:00:00Z" }],
    Review_Staging_Links: [{ Review_Staging_Link_ID: "link_12345678", Review_Queue_ID: "rev_12345678", Staging_ID: "stg_12345678", Review_Role: "PRIMARY" }],
    Staging_Products: [{ Staging_ID: "stg_12345678", Run_ID: "run_12345678", Catalog_ID: "cat_12345678", Catalog_Page_ID: "page_1", Raw_Extract_File_ID: "artifact_12345678", Proposed_Status: "NEEDS_REVIEW", Proposed_Product_Name_EN: "Industrial Generator", Extracted_Text: "Industrial Generator DG100", Confidence: 0.7 }],
    Staging_Variants: [], Staging_Specifications: [], Staging_Images: [], Staging_Documents: []
  };
  const artifact = JSON.stringify({ page_number: 1, extracted_text: "Industrial Generator DG100", extraction_method: "OCR", product_candidates: { products: [{ proposed_product_name: "Industrial Generator" }], variants: [{ proposed_model_number: "DG100" }], specifications: [] } });
  const updates = [];
  const context = {
    SheetsRepository: {
      listAll: (name) => tables[name] || [],
      getBy: (name, key, value) => (tables[name] || []).find(r => r[key] === value) || null,
      updateBy: (name, key, value, patch) => { const row=(tables[name]||[]).find(r=>r[key]===value);if(!row)throw new Error("ROW_NOT_FOUND");Object.assign(row,patch);updates.push({name,patch}); }
    },
    DriveApp: { getFileById: () => ({ getBlob: () => ({ getDataAsString: () => artifact }), getUrl: () => "https://drive.google.com/file/d/artifact_12345678/view" }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    APP: { ACTOR_ID: "actor_primary" },
    Date
  };
  vm.runInNewContext(source, context);
  return { workspace: context.ReviewWorkspace, tables, updates };
}

test("review inbox returns queue item, linked staging product and page extraction evidence", () => {
  const ctx = fixture();
  const result = ctx.workspace.getInbox();
  assert.equal(result.counts.open, 1);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].links[0].productName, "Industrial Generator");
  assert.equal(result.items[0].links[0].artifact.variants[0].proposed_model_number, "DG100");
  assert.match(result.items[0].links[0].artifact.fileUrl, /drive.google.com/);
});

test("review status transitions are controlled and do not promote staging records", () => {
  const ctx = fixture();
  const result = ctx.workspace.updateStatus({ reviewId: "rev_12345678", status: "IN_REVIEW", notes: "Checking source page" }, "actor_primary");
  assert.equal(result.status, "IN_REVIEW");
  assert.equal(ctx.tables.Review_Queue[0].Assigned_Actor_ID, "actor_primary");
  assert.equal(ctx.tables.Staging_Products[0].Proposed_Status, "NEEDS_REVIEW");
  assert.throws(() => ctx.workspace.updateStatus({ reviewId: "rev_12345678", status: "APPROVED" }, "actor_primary"), /REVIEW_STATUS_INVALID/);
});

test("rejected review task is terminal and unknown review IDs are rejected", () => {
  const ctx = fixture();
  ctx.workspace.updateStatus({ reviewId: "rev_12345678", status: "REJECTED" }, "actor_primary");
  assert.throws(() => ctx.workspace.updateStatus({ reviewId: "rev_12345678", status: "OPEN" }, "actor_primary"), /REVIEW_TRANSITION_NOT_ALLOWED/);
  assert.throws(() => ctx.workspace.updateStatus({ reviewId: "rev_missing1", status: "OPEN" }, "actor_primary"), /REVIEW_NOT_FOUND/);
});
