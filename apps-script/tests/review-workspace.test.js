const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("src/domain/ReviewWorkspace.js", "utf8");


function rewriteDecision(ctx, edit) {
  const queueRow = ctx.queue[0];
  const file = ctx.files[queueRow.Decision_JSON_File_ID];
  const decision = JSON.parse(file.content);
  edit(decision);
  const content = JSON.stringify(decision);
  file.content = content;
  file.getBlob = () => ({
    getBytes: () => Array.from(Buffer.from(content, "utf8")),
    getDataAsString: () => content
  });
  const digest = crypto.createHash("sha256").update(Buffer.from(content, "utf8")).digest("hex");
  queueRow.Decision_SHA256 = digest;
  queueRow.Reviewed_Payload_Hash = digest;
  return decision;
}

function fixture() {
  const queue = [{
    Review_Queue_ID: "rev_product_123456", Review_Type: "PRODUCT_MATCH",
    Review_Status: "IN_REVIEW", Decision_Notes: "", Created_By: "actor_primary"
  }];
  const links = [{ Review_Queue_ID: "rev_product_123456", Staging_ID: "stg_product_123456", Review_Role: "PRIMARY" }];
  const staging = {
    Staging_ID: "stg_product_123456", Run_ID: "run_test_123456", Catalog_ID: "cat_test_123456",
    Catalog_Page_ID: "page_test_0001", Extracted_Text: "Industrial Generator DG-100",
    Staging_Record_Hash: "a".repeat(64)
  };
  const stagingRows = {};
  const products = [];
  const files = {};
  let fileSeq = 0;
  const runFolder = {
    getFilesByName(name) {
      const found = Object.values(files).filter(f => f.name === name);
      let i = 0;
      return { hasNext: () => i < found.length, next: () => found[i++] };
    },
    createFile(name, content) {
      const id = "drive_file_" + (++fileSeq);
      const file = {
        id, name, content,
        getId: () => id,
        getBlob: () => ({
          getBytes: () => Array.from(Buffer.from(content, "utf8")),
          getDataAsString: () => content
        })
      };
      files[id] = file; return file;
    }
  };
  const rootFolder = { getFoldersByName: name => ({ hasNext: () => name === staging.Run_ID, next: () => runFolder }) };
  const context = {
    APP: { ACTOR_ID: "actor_primary" },
    MimeType: { JSON: "application/json" },
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => key === "DEV_RUNS_FOLDER_ID" ? "root_folder_id" : "" }) },
    Utilities: {
      DigestAlgorithm: { SHA_256: "SHA-256" },
      newBlob: value => ({ getBytes: () => Array.from(Buffer.from(value, "utf8")) }),
      computeDigest: (_algorithm, bytes) => Array.from(crypto.createHash("sha256").update(Buffer.from(bytes)).digest())
    },
    DriveApp: {
      getFolderById: () => rootFolder,
      getFileById: id => files[id] || null
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    SheetsRepository: {
      listAll: name => name === "Review_Queue" ? queue : name === "Review_Staging_Links" ? links : [],
      getBy: (table, key, value) => {
        if (table === "Review_Queue") return queue.find(row => row[key] === value) || null;
        if (table === "Staging_Products") return staging[key] === value ? staging : null;
        if (table === "Products") return products.find(row => row[key] === value) || null;
        if (table === "Staging_Variants" || table === "Staging_Specifications") return stagingRows[table] && stagingRows[table][value] || null;
        return null;
      },
      updateBy: (_table, key, value, patch) => {
        const row = queue.find(item => item[key] === value);
        if (!row) throw new Error("ROW_NOT_FOUND");
        Object.assign(row, patch);
      }
    },
    Date
  };
  vm.runInNewContext(source, context);
  return { service: context.ReviewWorkspace, queue, staging, links, stagingRows, products, files, runFolder };
}

test("review approval persists explicitly accepted model and scoped specification decisions from linked evidence", () => {
  const ctx = fixture();
  const productId = ctx.staging.Staging_ID;
  const variant = {
    Staging_ID: "stg_variant_review_1", Run_ID: ctx.staging.Run_ID, Catalog_ID: ctx.staging.Catalog_ID,
    Proposed_Model_Number: "DG100-A", Proposed_Model_Name: "Open Frame", Extracted_Text: "Model DG100-A"
  };
  const spec = {
    Staging_ID: "stg_spec_review_1", Run_ID: ctx.staging.Run_ID, Catalog_ID: ctx.staging.Catalog_ID,
    Attribute_Key_Raw: "Power", Value_Raw: "100", Unit_Raw: "kW",
    Source_Assertion_Key: "assertion-power-1", Extracted_Text: "Power 100 kW"
  };
  ctx.stagingRows.Staging_Variants = { [variant.Staging_ID]: variant };
  ctx.stagingRows.Staging_Specifications = { [spec.Staging_ID]: spec };
  ctx.links.push(
    { Review_Queue_ID: "rev_product_123456", Staging_ID: variant.Staging_ID, Review_Role: "EVIDENCE" },
    { Review_Queue_ID: "rev_product_123456", Staging_ID: spec.Staging_ID, Review_Role: "EVIDENCE" }
  );
  const result = ctx.service.approveProductReview({
    reviewId: "rev_product_123456", productName: "Industrial Generator DG-100", identityResolution: "CREATE_NEW", matchRationale: "Reviewer confirmed new product identity",
    variants: [{ stagingId: variant.Staging_ID, reviewStatus: "ACCEPTED", parentProductStagingId: productId }],
    specifications: [{ stagingId: spec.Staging_ID, reviewStatus: "ACCEPTED", parentProductStagingId: productId,
      scope: "VARIANT", parentVariantStagingId: variant.Staging_ID, valueRaw: "110", unitRaw: "kW", editReason: "Verified against source table" }]
  }, "actor_primary");
  const decision = JSON.parse(ctx.files[result.decisionFileId].content);
  assert.equal(decision.variants[0].review_status, "ACCEPTED");
  assert.equal(decision.variants[0].parent_staging_product_id, productId);
  assert.equal(decision.specifications[0].scope, "VARIANT");
  assert.equal(decision.specifications[0].original_value_raw, "100");
  assert.equal(decision.specifications[0].value_raw, "110");
  assert.equal(decision.specifications[0].edit_reason, "Verified against source table");
});

test("review approval refuses unlinked candidates and edited values without a reason", () => {
  const ctx = fixture();
  const spec = {
    Staging_ID: "stg_spec_review_2", Run_ID: ctx.staging.Run_ID, Catalog_ID: ctx.staging.Catalog_ID,
    Attribute_Key_Raw: "Voltage", Value_Raw: "400", Unit_Raw: "V"
  };
  ctx.stagingRows.Staging_Specifications = { [spec.Staging_ID]: spec };
  assert.throws(() => ctx.service.approveProductReview({
    reviewId: "rev_product_123456", productName: "Industrial Generator", identityResolution: "CREATE_NEW", matchRationale: "Reviewer confirmed new product identity",
    specifications: [{ stagingId: spec.Staging_ID, reviewStatus: "ACCEPTED", parentProductStagingId: ctx.staging.Staging_ID,
      scope: "PRODUCT", valueRaw: "415" }]
  }, "actor_primary"), /REVIEW_CANDIDATE_NOT_LINKED_EVIDENCE/);
  ctx.links.push({ Review_Queue_ID: "rev_product_123456", Staging_ID: spec.Staging_ID, Review_Role: "EVIDENCE" });
  assert.throws(() => ctx.service.approveProductReview({
    reviewId: "rev_product_123456", productName: "Industrial Generator", identityResolution: "CREATE_NEW", matchRationale: "Reviewer confirmed new product identity",
    specifications: [{ stagingId: spec.Staging_ID, reviewStatus: "ACCEPTED", parentProductStagingId: ctx.staging.Staging_ID,
      scope: "PRODUCT", valueRaw: "415" }]
  }, "actor_primary"), /REVIEW_SPECIFICATION_EDIT_REASON_REQUIRED/);
});

test("review approval records an explicit MATCH_EXISTING product identity", () => {
  const ctx = fixture();
  ctx.products.push({ Product_ID: "prd_existing_123456", Lifecycle_Status: "ACTIVE" });
  const result = ctx.service.approveProductReview({
    reviewId: "rev_product_123456", productName: "Industrial Generator",
    identityResolution: "MATCH_EXISTING", canonicalProductId: "prd_existing_123456",
    matchRationale: "Same manufacturer and matching product reference"
  }, "actor_primary");
  const decision = JSON.parse(ctx.files[result.decisionFileId].content);
  assert.equal(decision.products[0].identity_resolution, "MATCH_EXISTING");
  assert.equal(decision.products[0].canonical_product_id, "prd_existing_123456");
  assert.equal(decision.products[0].match_rationale, "Same manufacturer and matching product reference");
});

test("review approval rejects missing, inactive, or unexplained existing-product matches", () => {
  const ctx = fixture();
  assert.throws(() => ctx.service.approveProductReview({
    reviewId: "rev_product_123456", productName: "Industrial Generator",
    identityResolution: "MATCH_EXISTING", canonicalProductId: "prd_missing"
  }, "actor_primary"), /REVIEW_MATCH_PRODUCT_NOT_ACTIVE/);
  ctx.products.push({ Product_ID: "prd_archived", Lifecycle_Status: "ARCHIVED" });
  assert.throws(() => ctx.service.approveProductReview({
    reviewId: "rev_product_123456", productName: "Industrial Generator",
    identityResolution: "MATCH_EXISTING", canonicalProductId: "prd_archived",
    matchRationale: "Same model"
  }, "actor_primary"), /REVIEW_MATCH_PRODUCT_NOT_ACTIVE/);
  ctx.products.push({ Product_ID: "prd_active", Lifecycle_Status: "ACTIVE" });
  assert.throws(() => ctx.service.approveProductReview({
    reviewId: "rev_product_123456", productName: "Industrial Generator",
    identityResolution: "MATCH_EXISTING", canonicalProductId: "prd_active"
  }, "actor_primary"), /REVIEW_MATCH_RATIONALE_REQUIRED/);
});

test("product approval writes an immutable accepted decision and records its SHA", () => {
  const ctx = fixture();
  const result = ctx.service.approveProductReview({ reviewId: "rev_product_123456", productName: "Industrial Generator DG-100", identityResolution: "CREATE_NEW", matchRationale: "Reviewer confirmed new product identity", notes: "Checked source" }, "actor_primary");
  assert.equal(result.status, "APPROVED");
  assert.equal(ctx.queue[0].Review_Status, "APPROVED");
  assert.equal(ctx.queue[0].Decision_JSON_File_ID, result.decisionFileId);
  assert.equal(ctx.queue[0].Decision_SHA256, result.decisionSha256);
  const decision = JSON.parse(ctx.files[result.decisionFileId].content);
  assert.equal(decision.products[0].review_status, "ACCEPTED");
  assert.equal(decision.products[0].staging_id, "stg_product_123456");
  assert.equal(decision.products[0].identity_resolution, "CREATE_NEW");
  assert.equal(decision.products[0].canonical_product_id, "");
  assert.equal(decision.variants.length, 0);
});

test("product approval is idempotent and refuses edits after approval", () => {
  const ctx = fixture();
  const first = ctx.service.approveProductReview({ reviewId: "rev_product_123456", productName: "Industrial Generator DG-100", identityResolution: "CREATE_NEW", matchRationale: "Reviewer confirmed new product identity" }, "actor_primary");
  const again = ctx.service.approveProductReview({ reviewId: "rev_product_123456", productName: "Industrial Generator DG-100", identityResolution: "CREATE_NEW", matchRationale: "Reviewer confirmed new product identity" }, "actor_primary");
  assert.equal(again.decisionFileId, first.decisionFileId);
  assert.equal(again.reused, true);
  assert.throws(() => ctx.service.approveProductReview({ reviewId: "rev_product_123456", productName: "Different Product", identityResolution: "CREATE_NEW", matchRationale: "Reviewer confirmed new product identity" }, "actor_primary"), /REVIEW_DECISION_ALREADY_APPROVED/);
});

test("Arabic product names and non-product review tasks cannot be approved as products", () => {
  const ctx = fixture();
  assert.throws(() => ctx.service.approveProductReview({ reviewId: "rev_product_123456", productName: "مولد كهربائي", identityResolution: "CREATE_NEW", matchRationale: "Reviewer confirmed new product identity" }, "actor_primary"), /REVIEW_PRODUCT_NAME_MUST_BE_ENGLISH/);
  ctx.queue[0].Review_Type = "EXTRACTION_AMBIGUITY";
  assert.throws(() => ctx.service.approveProductReview({ reviewId: "rev_product_123456", productName: "Industrial Generator", identityResolution: "CREATE_NEW", matchRationale: "Reviewer confirmed new product identity" }, "actor_primary"), /REVIEW_PRODUCT_TASK_REQUIRED/);
});

test("Staging Set builder combines approved decision files and updates their queue references", () => {
  const ctx = fixture();
  ctx.service.approveProductReview({ reviewId: "rev_product_123456", productName: "Industrial Generator DG-100", identityResolution: "CREATE_NEW", matchRationale: "Reviewer confirmed new product identity" }, "actor_primary");
  const result = ctx.service.buildStagingSetForRun("run_test_123456", "actor_primary");
  assert.equal(result.status, "READY_FOR_PROMOTION");
  assert.equal(result.products, 1);
  assert.equal(result.variants, 0);
  assert.equal(ctx.queue[0].Staging_Set_Manifest_File_ID, result.stagingSetFileId);
  assert.equal(ctx.queue[0].Staging_Set_SHA256, result.stagingSetSha256);
  const stagingSet = JSON.parse(ctx.files[result.stagingSetFileId].content);
  assert.equal(stagingSet.products[0].proposed_product_name, "Industrial Generator DG-100");
});

test("Staging Set builder refuses runs without approved product decisions", () => {
  const ctx = fixture();
  assert.throws(() => ctx.service.buildStagingSetForRun("run_test_123456", "actor_primary"), /REVIEW_NO_APPROVED_PRODUCTS_FOR_RUN/);
});

test("review status transitions cannot mark a task approved without an immutable decision", () => {
  const ctx = fixture();
  assert.throws(() => ctx.service.updateStatus({ reviewId: "rev_product_123456", status: "APPROVED" }, "actor_primary"), /REVIEW_STATUS_INVALID/);
});


test("Staging Set accepts explicitly linked model/spec candidates with a consistent parent chain", () => {
  const ctx = fixture();
  ctx.service.approveProductReview({ reviewId: "rev_product_123456", productName: "Industrial Generator DG-100", identityResolution: "CREATE_NEW", matchRationale: "Reviewer confirmed new product identity" }, "actor_primary");
  const productStagingId = ctx.service.approveProductReview
    ? JSON.parse(ctx.files[ctx.queue[0].Decision_JSON_File_ID].content).products[0].staging_id
    : "";
  rewriteDecision(ctx, decision => {
    decision.variants.push({
      staging_id: "stg_variant_123456", parent_staging_product_id: productStagingId,
      proposed_model_number: "DG100", review_status: "ACCEPTED"
    });
    decision.specifications.push({
      staging_id: "stg_spec_123456", parent_staging_product_id: productStagingId,
      parent_staging_variant_id: "stg_variant_123456", scope: "VARIANT",
      attribute_key_raw: "Power", value_raw: "100", unit_raw: "kW", review_status: "ACCEPTED"
    });
  });
  const result = ctx.service.buildStagingSetForRun("run_test_123456", "actor_primary");
  assert.equal(result.variants, 1);
  assert.equal(result.specifications, 1);
});

test("Staging Set rejects specifications linked to a variant under a different product", () => {
  const ctx = fixture();
  ctx.service.approveProductReview({ reviewId: "rev_product_123456", productName: "Industrial Generator DG-100", identityResolution: "CREATE_NEW", matchRationale: "Reviewer confirmed new product identity" }, "actor_primary");
  rewriteDecision(ctx, decision => {
    const productStagingId = decision.products[0].staging_id;
    decision.products.push({
      staging_id: "stg_product_other", catalog_page_id: "page_test_0002",
      proposed_product_name: "Other Product", review_status: "ACCEPTED"
    });
    decision.variants.push({
      staging_id: "stg_variant_123456", parent_staging_product_id: productStagingId,
      proposed_model_number: "DG100", review_status: "ACCEPTED"
    });
    decision.specifications.push({
      staging_id: "stg_spec_123456", parent_staging_product_id: "stg_product_other",
      parent_staging_variant_id: "stg_variant_123456", scope: "VARIANT",
      attribute_key_raw: "Power", value_raw: "100", review_status: "ACCEPTED"
    });
  });
  assert.throws(
    () => ctx.service.buildStagingSetForRun("run_test_123456", "actor_primary"),
    /REVIEW_SPECIFICATION_PARENT_MISMATCH/
  );
});

test("Staging Set refuses specifications without an explicit supported scope", () => {
  const ctx = fixture();
  ctx.service.approveProductReview({ reviewId: "rev_product_123456", productName: "Industrial Generator DG-100", identityResolution: "CREATE_NEW", matchRationale: "Reviewer confirmed new product identity" }, "actor_primary");
  rewriteDecision(ctx, decision => {
    const productStagingId = decision.products[0].staging_id;
    decision.variants.push({
      staging_id: "stg_variant_123456", parent_staging_product_id: productStagingId,
      proposed_model_number: "DG100", review_status: "ACCEPTED"
    });
    decision.specifications.push({
      staging_id: "stg_spec_123456", parent_staging_product_id: productStagingId,
      parent_staging_variant_id: "stg_variant_123456", scope: "",
      attribute_key_raw: "Power", value_raw: "100", review_status: "ACCEPTED"
    });
  });
  assert.throws(
    () => ctx.service.buildStagingSetForRun("run_test_123456", "actor_primary"),
    /REVIEW_SPECIFICATION_SCOPE_REQUIRED/
  );
});


test("Staging Set accepts product-scope specifications without a variant parent", () => {
  const ctx = fixture();
  ctx.service.approveProductReview({ reviewId: "rev_product_123456", productName: "Industrial Generator DG-100", identityResolution: "CREATE_NEW", matchRationale: "Reviewer confirmed new product identity" }, "actor_primary");
  rewriteDecision(ctx, decision => {
    const productStagingId = decision.products[0].staging_id;
    decision.specifications.push({
      staging_id: "stg_spec_product_123", parent_staging_product_id: productStagingId,
      parent_staging_variant_id: "", scope: "PRODUCT",
      attribute_key_raw: "Manufacturer", value_raw: "ACME", review_status: "ACCEPTED"
    });
  });
  const result = ctx.service.buildStagingSetForRun("run_test_123456", "actor_primary");
  assert.equal(result.specifications, 1);
});

test("Staging Set rejects a product-scope specification carrying a variant parent", () => {
  const ctx = fixture();
  ctx.service.approveProductReview({ reviewId: "rev_product_123456", productName: "Industrial Generator DG-100", identityResolution: "CREATE_NEW", matchRationale: "Reviewer confirmed new product identity" }, "actor_primary");
  rewriteDecision(ctx, decision => {
    const productStagingId = decision.products[0].staging_id;
    decision.variants.push({
      staging_id: "stg_variant_product_scope", parent_staging_product_id: productStagingId,
      proposed_model_number: "DG100", review_status: "ACCEPTED"
    });
    decision.specifications.push({
      staging_id: "stg_spec_product_scope", parent_staging_product_id: productStagingId,
      parent_staging_variant_id: "stg_variant_product_scope", scope: "PRODUCT",
      attribute_key_raw: "Manufacturer", value_raw: "ACME", review_status: "ACCEPTED"
    });
  });
  assert.throws(
    () => ctx.service.buildStagingSetForRun("run_test_123456", "actor_primary"),
    /REVIEW_SPECIFICATION_PRODUCT_SCOPE_VARIANT_FORBIDDEN/
  );
});


test("Staging Set keeps rejected unresolved candidates without requiring parent assignments", () => {
  const ctx = fixture();
  ctx.service.approveProductReview({ reviewId: "rev_product_123456", productName: "Industrial Generator DG-100", identityResolution: "CREATE_NEW", matchRationale: "Reviewer confirmed new product identity" }, "actor_primary");
  rewriteDecision(ctx, decision => {
    decision.variants.push({
      staging_id: "stg_variant_rejected", parent_staging_product_id: "",
      proposed_model_number: "UNRESOLVED", review_status: "REJECTED"
    });
    decision.specifications.push({
      staging_id: "stg_spec_rejected", parent_staging_product_id: "",
      parent_staging_variant_id: "", scope: "", attribute_key_raw: "Power",
      value_raw: "100", review_status: "REJECTED"
    });
  });
  const result = ctx.service.buildStagingSetForRun("run_test_123456", "actor_primary");
  assert.equal(result.variants, 1);
  assert.equal(result.specifications, 1);
});


test("review approval requires an explicit decision for every linked candidate", () => {
  const ctx = fixture();
  const variant = {
    Staging_ID: "stg_variant_incomplete", Run_ID: ctx.staging.Run_ID, Catalog_ID: ctx.staging.Catalog_ID,
    Proposed_Model_Number: "DG100-B", Proposed_Model_Name: "Enclosed", Extracted_Text: "Model DG100-B"
  };
  ctx.stagingRows.Staging_Variants = { [variant.Staging_ID]: variant };
  ctx.links.push({ Review_Queue_ID: "rev_product_123456", Staging_ID: variant.Staging_ID, Review_Role: "EVIDENCE" });
  assert.throws(() => ctx.service.approveProductReview({
    reviewId: "rev_product_123456", productName: "Industrial Generator", identityResolution: "CREATE_NEW", matchRationale: "Reviewer confirmed new product identity"
  }, "actor_primary"), /REVIEW_CANDIDATE_DECISIONS_INCOMPLETE/);
});

test("changing a specification unit requires a reviewer reason", () => {
  const ctx = fixture();
  const spec = {
    Staging_ID: "stg_spec_unit_edit", Run_ID: ctx.staging.Run_ID, Catalog_ID: ctx.staging.Catalog_ID,
    Attribute_Key_Raw: "Power", Value_Raw: "100", Unit_Raw: "kW"
  };
  ctx.stagingRows.Staging_Specifications = { [spec.Staging_ID]: spec };
  ctx.links.push({ Review_Queue_ID: "rev_product_123456", Staging_ID: spec.Staging_ID, Review_Role: "EVIDENCE" });
  assert.throws(() => ctx.service.approveProductReview({
    reviewId: "rev_product_123456", productName: "Industrial Generator", identityResolution: "CREATE_NEW", matchRationale: "Reviewer confirmed new product identity",
    specifications: [{ stagingId: spec.Staging_ID, reviewStatus: "ACCEPTED",
      parentProductStagingId: ctx.staging.Staging_ID, scope: "PRODUCT",
      valueRaw: "100", unitRaw: "kVA" }]
  }, "actor_primary"), /REVIEW_SPECIFICATION_EDIT_REASON_REQUIRED/);
});
