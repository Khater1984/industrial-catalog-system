const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("src/domain/ReviewDashboard.js", "utf8");

test("review dashboard returns linked staging evidence and source links without mutating sheets", () => {
  const artifact = {
    page_number: 3,
    extraction_method: "OCR",
    extracted_text: "INDUSTRIAL GENERATOR MODEL DG-100",
    product_candidates: {
      products: [{ proposed_product_name: "Industrial Generator", confidence: "LOW" }],
      variants: [{ proposed_model_number: "DG-100", proposed_model_name: "DG-100" }],
      specifications: [{ attribute_key_raw: "Power", value_raw: "100", unit_raw: "kW" }]
    }
  };
  const tables = {
    Review_Queue: [{ Review_Queue_ID: "review-1", Review_Type: "PRODUCT_MATCH", Review_Status: "OPEN", Priority: "NORMAL", Proposed_Action: "Review product" }],
    Review_Staging_Links: [{ Review_Queue_ID: "review-1", Staging_ID: "stg-1", Review_Role: "PRIMARY" }],
    Staging_Products: [{ Staging_ID: "stg-1", Run_ID: "run-1", Catalog_ID: "cat-1", Catalog_Page_ID: "page-1", Raw_Extract_File_ID: "artifact-1", Proposed_Product_Name_EN: "Industrial Generator", Proposed_Product_Reference: "DG", Extracted_Text: "INDUSTRIAL GENERATOR MODEL DG-100", Confidence: "LOW", Extraction_Method: "OCR" }],
    Staging_Variants: [], Staging_Specifications: [], Staging_Images: [], Staging_Documents: [],
    Catalogs: [{ Catalog_ID: "cat-1", Supplier_Name: "Supplier A", Catalog_Title: "Generator Catalog", Source_File_ID: "pdf-1", Source_File_Name: "catalog.pdf" }],
    Catalog_Pages: [{ Catalog_Page_ID: "page-1", Page_Number: 3, Page_Label: "3" }],
    Run_Units: [{ Run_ID: "run-1", Catalog_Page_ID: "page-1", Output_Manifest_File_ID: "artifact-1" }]
  };
  const writes = [];
  const context = {
    SheetsRepository: {
      listRecent: (name) => tables[name] || [],
      listAll: (name) => tables[name] || [],
      getBy: (name) => name === "Run_Log" ? { Catalog_ID: "cat-1" } : null,
      updateBy: (...args) => writes.push(args),
      append: (...args) => writes.push(args)
    },
    DriveApp: {
      getFileById: (id) => ({
        getUrl: () => "https://drive.google.com/file/d/" + id + "/view",
        getBlob: () => ({ getDataAsString: () => JSON.stringify(artifact) })
      })
    }
  };
  vm.runInNewContext(source, context);
  const result = context.ReviewDashboard.getQueue();
  assert.equal(result.counts.open, 1);
  assert.equal(result.items[0].supplierName, "Supplier A");
  assert.equal(result.items[0].pageNumber, 3);
  assert.equal(result.items[0].evidence[0].productName, "Industrial Generator");
  assert.equal(result.items[0].artifact.variants[0].proposed_model_number, "DG-100");
  assert.match(result.items[0].sourcePdfUrl, /pdf-1/);
  assert.equal(writes.length, 0);
});

test("review dashboard can resolve ambiguity page artifacts from run units", () => {
  const artifact = { page_number: 2, extracted_text: "Page two", product_candidates: { products: [], variants: [], specifications: [] } };
  const tables = {
    Review_Queue: [{ Review_Queue_ID: "review-2", Review_Type: "EXTRACTION_AMBIGUITY", Review_Status: "OPEN", Priority: "NORMAL", Proposed_Action: "Review candidates on page page-2 in run run-2." }],
    Review_Staging_Links: [], Staging_Products: [], Staging_Variants: [], Staging_Specifications: [], Staging_Images: [], Staging_Documents: [],
    Catalogs: [{ Catalog_ID: "cat-2", Supplier_Name: "Supplier B", Catalog_Title: "Page Review", Source_File_ID: "pdf-2" }],
    Catalog_Pages: [{ Catalog_Page_ID: "page-2", Page_Number: 2 }],
    Run_Units: [{ Run_ID: "run-2", Catalog_Page_ID: "page-2", Output_Manifest_File_ID: "artifact-2" }]
  };
  const context = {
    SheetsRepository: {
      listRecent: (name) => tables[name] || [],
      listAll: (name) => tables[name] || [],
      getBy: () => ({ Catalog_ID: "cat-2" })
    },
    DriveApp: { getFileById: () => ({ getUrl: () => "https://drive.google.com/file/d/artifact-2/view", getBlob: () => ({ getDataAsString: () => JSON.stringify(artifact) }) }) }
  };
  vm.runInNewContext(source, context);
  const result = context.ReviewDashboard.getQueue();
  assert.equal(result.items[0].pageNumber, 2);
  assert.equal(result.items[0].artifact.extractedText, "Page two");
  assert.match(result.items[0].pageArtifactUrl, /artifact-2/);
});
