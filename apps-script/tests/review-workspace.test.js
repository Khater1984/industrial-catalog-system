const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");

const source = fs.readFileSync("src/domain/ReviewWorkspace.js", "utf8");

function fixture() {
  const queue = [
    { Review_Queue_ID: "review-1", Review_Type: "PRODUCT_MATCH", Priority: "NORMAL", Review_Status: "OPEN", Proposed_Action: "Verify product", Created_At: "2026-11-10T10:00:00.000Z", Decision_Notes: "" },
    { Review_Queue_ID: "review-2", Review_Type: "IMAGE_QUALITY", Priority: "LOW", Review_Status: "DEFERRED", Proposed_Action: "Check image", Created_At: "2026-11-10T11:00:00.000Z" }
  ];
  const links = [
    { Review_Queue_ID: "review-1", Staging_ID: "stg-product", Review_Role: "PRIMARY" },
    { Review_Queue_ID: "review-2", Staging_ID: "stg-image", Review_Role: "PRIMARY" }
  ];
  const stagingProducts = [{
    Staging_ID: "stg-product", Run_ID: "run-1", Catalog_ID: "cat-1", Catalog_Page_ID: "page-1",
    Raw_Extract_File_ID: "artifact-1", Extraction_Method: "OCR", Confidence: 0.7,
    Proposed_Status: "NEEDS_REVIEW", Extracted_Text: "Generator DG-100", Proposed_Product_Name_EN: "Industrial Generator"
  }];
  const stagingImages = [{
    Staging_ID: "stg-image", Run_ID: "run-1", Catalog_ID: "cat-1", Catalog_Page_ID: "page-2",
    Raw_Extract_File_ID: "image-manifest", Extraction_Method: "IMAGE_EXTRACTION",
    Proposed_Image_File_ID: "drive-image-file-id", Original_File_Name: "generator.png",
    MIME_Type: "image/png", Width_PX: 800, Height_PX: 600, File_Size_Bytes: 12345,
    SHA256: "a".repeat(64), Quality_Status: "NEEDS_REVIEW"
  }];
  const artifact = { page_number: 1, extraction_method: "OCR", warnings: ["low confidence"], product_candidates: {
    products: [{ proposed_product_name: "Industrial Generator", source_quote: "Generator DG-100", confidence: "MEDIUM" }],
    variants: [{ proposed_model_number: "DG-100", source_quote: "Model DG-100", confidence: "HIGH" }],
    specifications: [{ attribute_key_raw: "Power", value_raw: "100", unit_raw: "kW", source_quote: "Power 100 kW", confidence: "MEDIUM" }]
  }};
  const updates = [];
  const context = {
    APP: { ACTOR_ID: "actor_primary" },
    SheetsRepository: {
      listRecent: (name, limit) => name === "Review_Queue" ? queue.slice(-limit).reverse() : [],
      listAll: (name) => ({
        Review_Staging_Links: links,
        Staging_Products: stagingProducts,
        Staging_Variants: [],
        Staging_Specifications: [],
        Staging_Images: stagingImages
      }[name] || []),
      getBy: (name, key, value) => name === "Review_Queue" ? queue.find(row => row[key] === value) || null : null,
      updateBy: (name, key, value, patch) => {
        const row = queue.find(item => item[key] === value);
        Object.assign(row, patch);updates.push({name,patch});
      }
    },
    DriveApp: { getFileById: id => {
      if(id==="artifact-1") return {getBlob:()=>({getDataAsString:()=>JSON.stringify(artifact)})};
      throw new Error("not found");
    }}
  };
  vm.runInNewContext(source, context);
  return { workspace: context.ReviewWorkspace, queue, updates };
}

test("review dashboard joins queue items to staged evidence and page candidates", () => {
  const ctx = fixture();
  const result = ctx.workspace.getDashboard(50);
  assert.equal(result.counts.total, 2);
  assert.equal(result.counts.open, 1);
  assert.equal(result.counts.deferred, 1);
  const product = result.items.find(x => x.review_queue_id === "review-1").staging_items[0].staging;
  assert.equal(product.proposed_product_name, "Industrial Generator");
  assert.equal(product.page_evidence.variants[0].proposed_model_number, "DG-100");
  assert.equal(product.page_evidence.specifications[0].unit_raw, "kW");
  const image = result.items.find(x => x.review_queue_id === "review-2").staging_items[0].staging;
  assert.match(image.image_preview_url, /drive-image-file-id/);
});

test("review status controls allow only workflow states and never promote records", () => {
  const ctx = fixture();
  const result = ctx.workspace.setStatus({reviewQueueId:"review-1",status:"IN_REVIEW",notes:"Checking source page"});
  assert.equal(result.review_status,"IN_REVIEW");
  assert.equal(ctx.queue[0].Assigned_Actor_ID,"actor_primary");
  assert.equal(ctx.queue[0].Decision_Notes,"Checking source page");
  assert.equal(ctx.updates.length,1);
  assert.throws(()=>ctx.workspace.setStatus({reviewQueueId:"review-1",status:"APPROVED"}),/REVIEW_STATUS_TRANSITION_NOT_ALLOWED/);
  assert.equal(ctx.workspace.setStatus({reviewQueueId:"review-2",status:"OPEN"}).review_status,"OPEN");
  ctx.queue[1].Review_Status = "APPROVED";
  assert.throws(()=>ctx.workspace.setStatus({reviewQueueId:"review-2",status:"IN_REVIEW"}),/REVIEW_ITEM_IS_TERMINAL/);
});

test("review dashboard limits candidate evidence and tolerates inaccessible artifacts", () => {
  const ctx = fixture();
  const result = ctx.workspace.getDashboard(1);
  assert.equal(result.items.length,1);
});
