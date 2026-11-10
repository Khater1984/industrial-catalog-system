const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("src/domain/ReviewDashboard.js", "utf8");

test("review dashboard projects linked staging evidence and verified page candidates", () => {
  const artifact = JSON.stringify({ page_number: 4, extraction_method: "OCR", extracted_text: "GENERATOR DG-100", product_candidates: {
    products: [{ proposed_product_name: "Industrial Generator", confidence: "HIGH" }],
    variants: [{ proposed_model_number: "DG-100" }],
    specifications: [{ attribute_key_raw: "Power", value_raw: "100", unit_raw: "kW" }]
  }});
  const tables = {
    Review_Queue: [{ Review_Queue_ID: "rev_12345678", Review_Type: "PRODUCT_MATCH", Review_Status: "OPEN", Priority: "NORMAL", Proposed_Action: "Verify product", Decision_Notes: "Check the page" }],
    Review_Staging_Links: [{ Review_Queue_ID: "rev_12345678", Staging_ID: "stg_12345678", Review_Role: "PRIMARY" }],
    Staging_Products: [{ Staging_ID: "stg_12345678", Run_ID: "run_12345678", Catalog_ID: "cat_12345678", Catalog_Page_ID: "page_4", Raw_Extract_File_ID: "artifact_12345678", Proposed_Product_Name_EN: "Industrial Generator", Confidence: 0.95, Extraction_Method: "OCR" }],
    Staging_Variants: [], Staging_Specifications: [], Staging_Images: [], Staging_Documents: [],
    Catalogs: [{ Catalog_ID: "cat_12345678", Supplier_Name: "Supplier A", Catalog_Title: "Machines", Source_File_ID: "pdf_12345678" }],
    Catalog_Pages: [{ Catalog_Page_ID: "page_4", Page_Number: 4 }],
    Run_Units: []
  };
  const context = {
    SheetsRepository: { listRecent: name => tables[name] || [], listAll: name => tables[name] || [], getBy: () => null },
    DriveApp: { getFileById: id => ({
      getUrl: () => "https://drive.google.com/file/d/" + id + "/view",
      getBlob: () => ({ getDataAsString: () => artifact })
    }) }
  };
  vm.runInNewContext(source, context);
  const result = context.ReviewDashboard.getQueue();
  assert.equal(result.counts.open, 1);
  assert.equal(result.items[0].supplierName, "Supplier A");
  assert.equal(result.items[0].evidence[0].productName, "Industrial Generator");
  assert.equal(result.items[0].artifact.variants[0].proposed_model_number, "DG-100");
  assert.equal(result.items[0].decisionNotes, "Check the page");
});


test("review dashboard HTML consumes the exact ReviewDashboard response contract", () => {
  const html = fs.readFileSync("Index.html", "utf8");
  assert.match(html, /item\\.reviewId/);
  assert.match(html, /item\\.proposedAction/);
  assert.match(html, /item\\.evidence/);
  assert.match(html, /item\\.decisionNotes/);
  assert.match(html, /item\\.pageArtifactUrl/);
  assert.match(html, /item\\.artifact/);
  assert.doesNotMatch(html, /item\\.id\\b|item\\.action\\b|item\\.links\\b|item\\.pageArtifact\\b|item\\.notes\\b/);
  assert.match(html, /ev\\.sourceArtifactUrl/);
  assert.match(html, /ev\\.imageFileUrl/);
  assert.match(html, /artifact\\.extractedText/);
});
