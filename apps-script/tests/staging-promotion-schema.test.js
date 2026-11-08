const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const vm = require("node:vm");

const schemaSource = fs.readFileSync("src/config/Schema.js", "utf8");
const promotionSource = fs.readFileSync("src/domain/StagingPromotion.js", "utf8");

function sha(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function buildSchemaContext(driveFiles) {
  const store = {};
  const context = {
    Utilities: {
      DigestAlgorithm: { SHA_256: "SHA-256" },
      computeDigest: (_algorithm, bytes) => {
        const buf = Array.isArray(bytes) ? Buffer.from(bytes) : Buffer.from(String(bytes));
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
    }
  };
  vm.runInNewContext(schemaSource, context);
  function rows(table) { return store[table] || (store[table] = []); }
  context.SheetsRepository = {
    getBy(table, key, value) {
      return rows(table).find((row) => String(row[key]) === String(value)) || null;
    },
    append(table, record) {
      if (!context.TABLES[table]) throw new Error("UNKNOWN_TABLE: " + table);
      const headers = context.TABLES[table];
      headers.forEach((column) => {
        const rule = context.FIELD_RULES[table + "." + column];
        if (!rule) throw new Error("SCHEMA_FIELD_RULE_MISSING: " + table + "." + column);
        const value = Object.prototype.hasOwnProperty.call(record, column) ? record[column] : "";
        const blank = value === "" || value === null || value === undefined || (typeof value === "string" && !value.trim());
        if (rule.required && blank) throw new Error("VALIDATION_REQUIRED: " + table + "." + column);
        if (!blank && rule.type === "ENUM") {
          const enumKey = table + "." + column;
          if (context.ENUMS[enumKey] && context.ENUMS[enumKey].indexOf(String(value)) < 0) {
            throw new Error("VALIDATION_INVALID_ENUM: " + table + "." + column);
          }
        }
      });
      rows(table).push(Object.assign({}, record));
      return rows(table).length + 1;
    },
    updateBy(table, key, value, patch) {
      if (table === "Specifications") throw new Error("SOURCE_SPECIFICATION_MUTATED");
      const row = rows(table).find((item) => String(item[key]) === String(value));
      if (!row) throw new Error("ROW_NOT_FOUND: " + table);
      Object.assign(row, patch);
      return 1;
    }
  };
  vm.runInNewContext(promotionSource, context);
  return { promote: context.StagingPromotion.promoteReviewedStaging, store };
}

function stagingObject() {
  return {
    run_id: "run_schema_001",
    catalog_id: "cat_schema_001",
    source_key_algorithm_version: "source-key-v1",
    products: [{
      staging_id: "stg_prd_s1", catalog_page_id: "cp_cat_schema_001_00001",
      proposed_product_name: "Schema Test Product", source_quote: "PRODUCT",
      review_status: "ACCEPTED", staging_record_hash: "d".repeat(64)
    }],
    variants: [{
      staging_id: "stg_var_s1", parent_staging_product_id: "stg_prd_s1", catalog_page_id: "cp_cat_schema_001_00001",
      proposed_model_number: "ST100", source_quote: "VARIANT", review_status: "ACCEPTED", staging_record_hash: "e".repeat(64)
    }],
    specifications: [{
      staging_id: "stg_spec_s1", parent_staging_product_id: "stg_prd_s1", parent_staging_variant_id: "stg_var_s1",
      catalog_page_id: "cp_cat_schema_001_00001", attribute_key_raw: "Power", value_raw: "5.5", unit_raw: "kW",
      source_quote: "SPEC", review_status: "ACCEPTED", confidence: "HIGH"
    }]
  };
}

test("schema-backed promotion writes only valid records and never mutates Specifications", () => {
  const content = JSON.stringify(stagingObject());
  const sha256 = sha(content);
  const fileId = "schemafileid1";
  const ctx = buildSchemaContext({ [fileId]: { content } });
  const result = ctx.promote({ stagingSetFileId: fileId, stagingSetSha256: sha256 });
  assert.equal(result.status, "COMPLETED");
  assert.ok(ctx.store.Products, "Products table should exist");
  assert.equal(ctx.store.Products.length, 1);
  assert.equal(ctx.store.Products[0].Lifecycle_Status, "ACTIVE");
  assert.equal(ctx.store.Variants.length, 1);
  assert.equal(ctx.store.Specifications.length, 1);
  assert.equal(ctx.store.Specifications[0].Attribute_Value_Source, "5.5");
  assert.equal((ctx.store.Specification_Changes || []).length, 0);
});
