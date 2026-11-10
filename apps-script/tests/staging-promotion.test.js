const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("src/domain/StagingPromotion.js", "utf8");

function sha(value) {
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    return crypto.createHash("sha256").update(Buffer.from(value)).digest("hex");
  }
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function buildContext(options) {
  const store = options.store || {};
  const failAfter = options.failAfter == null ? Infinity : options.failAfter;
  const driveFiles = options.driveFiles || {};
  let writes = 0;
  function rows(table) { return store[table] || (store[table] = []); }
  const context = {
    APP: { ACTOR_ID: "actor_primary" },
    Utilities: {
      DigestAlgorithm: { SHA_256: "SHA-256" },
      computeDigest: (_algorithm, bytes) => {
        const buf = Buffer.isBuffer(bytes) ? bytes : (Array.isArray(bytes) ? Buffer.from(bytes) : Buffer.from(String(bytes)));
        return Array.from(crypto.createHash("sha256").update(buf).digest());
      }
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    DriveApp: {
      getFileById(id) {
        const entry = driveFiles[id];
        if (!entry) return null;
        return {
          getBlob() {
            return {
              getBytes: () => Array.from(Buffer.from(entry.content, "utf8")),
              getDataAsString: () => entry.content
            };
          }
        };
      }
    },
    SheetsRepository: {
      getBy(table, key, value) {
        return rows(table).find((row) => String(row[key]) === String(value)) || null;
      },
      append(table, record) {
        writes += 1;
        if (writes > failAfter) throw new Error("SHEETS_CONNECTION_FAILED");
        rows(table).push(Object.assign({}, record));
        return rows(table).length + 1;
      },
      updateBy(table, key, value, patch) {
        const row = rows(table).find((item) => String(item[key]) === String(value));
        if (!row) throw new Error("ROW_NOT_FOUND: " + table);
        if (table === "Specifications") throw new Error("SOURCE_SPECIFICATION_MUTATED");
        Object.assign(row, patch);
        return 1;
      }
    }
  };
  vm.runInNewContext(source, context);
  return { promote: context.StagingPromotion.promoteReviewedStaging, store, driveFiles };
}

function stagingObject() {
  return {
    run_id: "run_demo_001",
    catalog_id: "cat_demo_001",
    source_key_algorithm_version: "source-key-v1",
    products: [{
      staging_id: "stg_prd_1", catalog_page_id: "cp_cat_demo_001_00001",
      proposed_product_name: "Plate Compactor PC Series", source_quote: "PRODUCT: Plate Compactor PC Series",
      review_status: "ACCEPTED", staging_record_hash: "a".repeat(64)
    }],
    variants: [
      { staging_id: "stg_var_1", parent_staging_product_id: "stg_prd_1", catalog_page_id: "cp_cat_demo_001_00001", proposed_model_number: "PC90", source_quote: "VARIANT: PC90", review_status: "ACCEPTED", staging_record_hash: "b".repeat(64) },
      { staging_id: "stg_var_2", parent_staging_product_id: "stg_prd_1", catalog_page_id: "cp_cat_demo_001_00001", proposed_model_number: "PC100", source_quote: "VARIANT: PC100", review_status: "REJECTED", staging_record_hash: "c".repeat(64) }
    ],
    specifications: [
      { staging_id: "stg_spec_1", parent_staging_product_id: "stg_prd_1", parent_staging_variant_id: "stg_var_1", catalog_page_id: "cp_cat_demo_001_00001", attribute_key_raw: "Plate size", value_raw: "600x450", unit_raw: "mm", scope: "VARIANT", source_quote: "SPEC: Plate size | 600x450 | mm", review_status: "ACCEPTED", confidence: "HIGH" },
      { staging_id: "stg_spec_2", parent_staging_product_id: "stg_prd_1", parent_staging_variant_id: "stg_var_1", catalog_page_id: "cp_cat_demo_001_00001", attribute_key_raw: "Weight", value_raw: "91", original_value_raw: "90", edited: true, edit_reason: "Accepted reviewer edit", unit_raw: "kg", scope: "VARIANT", source_quote: "SPEC: Weight | 90 | kg", review_status: "ACCEPTED", confidence: "HIGH" },
      { staging_id: "stg_spec_3", parent_staging_product_id: "stg_prd_1", parent_staging_variant_id: "stg_var_1", catalog_page_id: "cp_cat_demo_001_00001", attribute_key_raw: "Engine power", value_raw: "", unit_raw: "kW", scope: "VARIANT", source_quote: "SPEC: Engine power |  | kW", review_status: "REJECTED", confidence: "MEDIUM" },
      { staging_id: "stg_spec_4", parent_staging_product_id: "stg_prd_1", parent_staging_variant_id: "stg_var_2", catalog_page_id: "cp_cat_demo_001_00001", attribute_key_raw: "Weight", value_raw: "110", unit_raw: "kg", scope: "VARIANT", source_quote: "SPEC: Weight | 110 | kg", review_status: "REJECTED", confidence: "HIGH" }
    ]
  };
}

function makeDriveOptions(staging, fileId = "stagingfileid1") {
  const content = JSON.stringify(staging);
  const sha256 = sha(content);
  return {
    stagingSetFileId: fileId,
    stagingSetSha256: sha256,
    driveFiles: { [fileId]: { content } }
  };
}

test("accepted records are written and rejected records are not", () => {
  const opts = makeDriveOptions(stagingObject());
  const ctx = buildContext(opts);
  const result = ctx.promote({ stagingSetFileId: opts.stagingSetFileId, stagingSetSha256: opts.stagingSetSha256 });
  assert.equal(result.status, "COMPLETED");
  assert.equal(ctx.store.Products.length, 1);
  assert.equal(ctx.store.Variants.length, 1);
  assert.equal(ctx.store.Specifications.length, 2);
  assert.equal(ctx.store.Specification_Changes.length, 1);
  assert.equal(ctx.store.Specification_Changes[0].Operation, "UPDATE");
  assert.equal(ctx.store.Specifications[1].Attribute_Value_Source, "90");
  assert.equal(JSON.parse(ctx.store.Specification_Changes[0].Value_JSON), "91");
});

test("rejects client-supplied staging object", () => {
  const opts = makeDriveOptions(stagingObject());
  const ctx = buildContext(opts);
  assert.throws(
    () => ctx.promote({ staging: stagingObject(), stagingSetFileId: opts.stagingSetFileId, stagingSetSha256: opts.stagingSetSha256 }),
    /PROMOTION_CLIENT_STAGING_FORBIDDEN/
  );
});

test("rejects file whose SHA256 does not match", () => {
  const opts = makeDriveOptions(stagingObject());
  const ctx = buildContext(opts);
  assert.throws(
    () => ctx.promote({ stagingSetFileId: opts.stagingSetFileId, stagingSetSha256: "f".repeat(64) }),
    /STAGING_FILE_SHA_MISMATCH/
  );
});

test("rejects missing Drive file", () => {
  const ctx = buildContext({ driveFiles: {} });
  assert.throws(
    () => ctx.promote({ stagingSetFileId: "missingfileid", stagingSetSha256: "a".repeat(64) }),
    /STAGING_FILE_NOT_FOUND/
  );
});

test("retry does not duplicate products, variants, or source specifications", () => {
  const opts = makeDriveOptions(stagingObject());
  const ctx = buildContext(opts);
  ctx.promote({ stagingSetFileId: opts.stagingSetFileId, stagingSetSha256: opts.stagingSetSha256 });
  const again = ctx.promote({ stagingSetFileId: opts.stagingSetFileId, stagingSetSha256: opts.stagingSetSha256 });
  assert.equal(again.skipped, true);
  assert.equal(ctx.store.Products.length, 1);
  assert.equal(ctx.store.Variants.length, 1);
  assert.equal(ctx.store.Specifications.length, 2);
  assert.equal(ctx.store.Specification_Changes.length, 1);
});

test("connection failure leaves the operation in doubt and retry resumes without duplicates", () => {
  const opts = makeDriveOptions(stagingObject());
  const first = buildContext(Object.assign({ failAfter: 4 }, opts));
  assert.throws(() => first.promote({ stagingSetFileId: opts.stagingSetFileId, stagingSetSha256: opts.stagingSetSha256 }), /SHEETS_CONNECTION_FAILED/);
  assert.equal(first.store.Promotion_Operations[0].Operation_Status, "IN_DOUBT");
  const before = first.store.Products.length;
  const resumed = buildContext(Object.assign({ store: first.store }, opts));
  const result = resumed.promote({ stagingSetFileId: opts.stagingSetFileId, stagingSetSha256: opts.stagingSetSha256 });
  assert.equal(result.status, "COMPLETED");
  assert.equal(resumed.store.Products.length, before);
  assert.equal(resumed.store.Variants.length, 1);
  assert.equal(resumed.store.Specifications.length, 2);
});


test("promotion rejects specification parent mismatch even with a valid file hash", () => {
  const staging = stagingObject();
  staging.products.push({
    staging_id: "stg_prd_2", catalog_page_id: "cp_cat_demo_001_00002",
    proposed_product_name: "Second Product", source_quote: "PRODUCT: Second Product",
    review_status: "ACCEPTED", staging_record_hash: "d".repeat(64)
  });
  staging.specifications[0].parent_staging_product_id = "stg_prd_2";
  const opts = makeDriveOptions(staging);
  const ctx = buildContext(opts);
  assert.throws(
    () => ctx.promote({ stagingSetFileId: opts.stagingSetFileId, stagingSetSha256: opts.stagingSetSha256 }),
    /PROMOTION_SPEC_PARENT_MISMATCH/
  );
});

test("promotion refuses specifications without the supported explicit VARIANT scope", () => {
  const staging = stagingObject();
  staging.specifications[0].scope = "";
  const opts = makeDriveOptions(staging);
  const ctx = buildContext(opts);
  assert.throws(
    () => ctx.promote({ stagingSetFileId: opts.stagingSetFileId, stagingSetSha256: opts.stagingSetSha256 }),
    /PROMOTION_SPEC_SCOPE_UNSUPPORTED/
  );
});


test("promotion writes product-scope specifications against Product_Source_Records", () => {
  const staging = stagingObject();
  staging.specifications[0].scope = "PRODUCT";
  staging.specifications[0].parent_staging_variant_id = "";
  const opts = makeDriveOptions(staging);
  const ctx = buildContext(opts);
  const result = ctx.promote({ stagingSetFileId: opts.stagingSetFileId, stagingSetSha256: opts.stagingSetSha256 });
  assert.equal(result.counts.specifications, 2);
  const spec = ctx.store.Specifications.find(row => row.Scope === "PRODUCT");
  assert.ok(spec);
  assert.ok(spec.Product_Source_Record_ID);
  assert.equal(spec.Variant_Source_Record_ID, "");
  assert.equal(spec.Variant_ID, "");
});

test("promotion rejects product-scope specifications with a variant parent", () => {
  const staging = stagingObject();
  staging.specifications[0].scope = "PRODUCT";
  staging.specifications[0].parent_staging_variant_id = "stg_var_1";
  const opts = makeDriveOptions(staging);
  const ctx = buildContext(opts);
  assert.throws(
    () => ctx.promote({ stagingSetFileId: opts.stagingSetFileId, stagingSetSha256: opts.stagingSetSha256 }),
    /PROMOTION_SPEC_PRODUCT_SCOPE_VARIANT_FORBIDDEN/
  );
});
