const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

// Minimal in-memory Sheets mock for behavioral tests
function createMockRepo() {
  const tables = {};
  function ensure(name) { if (!tables[name]) tables[name] = []; return tables[name]; }
  return {
    getBy: (table, col, val) => ensure(table).find(r => String(r[col]) === String(val)) || null,
    listAll: (table) => ensure(table).slice(),
    append: (table, record) => { ensure(table).push(Object.assign({}, record)); return true; },
    updateBy: (table, keyCol, keyVal, patch) => {
      const row = ensure(table).find(r => String(r[keyCol]) === String(keyVal));
      if (!row) throw new Error("ROW_NOT_FOUND");
      Object.assign(row, patch);
      return true;
    },
    findBy: () => 2,
    _tables: tables
  };
}

describe("Product domain behavioral", () => {
  it("resolver reports product/variant mismatch", () => {
    const repo = createMockRepo();
    repo.append("Products", { Product_ID: "p1", Lifecycle_Status: "ACTIVE" });
    repo.append("Variants", { Variant_ID: "v1", Product_ID: "p2", Lifecycle_Status: "ACTIVE" });
    global.SheetsRepository = repo;
    // Load resolver (simplified eval for test)
    const fs = require("fs");
    const src = fs.readFileSync(require("path").join(__dirname, "../src/domain/EffectiveSpecificationResolver.js"), "utf8");
    eval(src);
    const result = EffectiveSpecificationResolver.resolveEffectiveSpecifications("p1", "v1");
    assert.ok(result.validation_errors.some(e => e.code === "VARIANT_PRODUCT_MISMATCH"));
  });

  it("resolver includes company ADD in conflict detection", () => {
    const repo = createMockRepo();
    repo.append("Products", { Product_ID: "p1" });
    repo.append("Specifications", {
      Specification_ID: "s1", Product_ID: "p1", Scope: "PRODUCT",
      Attribute_Key_Source: "Voltage", Normalized_Key: "voltage",
      Attribute_Value_Source: "220V", Unit_Source: "V"
    });
    repo.append("Specification_Changes", {
      Specification_Change_ID: "c1", Logical_Specification_Key: "ADD:c1",
      Product_ID: "p1", Variant_ID: "v1", Attribute_Key: "Voltage",
      Change_Status: "APPROVED", Sequence_No: 1, Operation: "ADD", Value_JSON: "380V"
    });
    global.SheetsRepository = repo;
    const fs = require("fs");
    const src = fs.readFileSync(require("path").join(__dirname, "../src/domain/EffectiveSpecificationResolver.js"), "utf8");
    eval(src);
    const result = EffectiveSpecificationResolver.resolveEffectiveSpecifications("p1", "v1");
    assert.ok(result.conflicts.length > 0);
    assert.ok(result.conflicts[0].normalized_key === "voltage");
  });

  it("variant override without product base is preserved", () => {
    const repo = createMockRepo();
    repo.append("Products", { Product_ID: "p1" });
    repo.append("Variant_Attribute_Overrides", {
      Variant_Override_ID: "o1", Variant_ID: "v1", Attribute_ID: "a1",
      Override_Mode: "VALUE", Value_JSON: "36"
    });
    global.SheetsRepository = repo;
    const fs = require("fs");
    const src = fs.readFileSync(require("path").join(__dirname, "../src/domain/EffectiveSpecificationResolver.js"), "utf8");
    eval(src);
    const result = EffectiveSpecificationResolver.resolveEffectiveSpecifications("p1", "v1");
    const attr = result.company_attributes.find(a => a.attribute_id === "a1");
    assert.ok(attr);
    assert.equal(attr.effective_value, "36");
    assert.equal(attr.mode, "CUSTOMIZED");
  });

  it("InputValidation rejects unknown fields", () => {
    const fs = require("fs");
    const src = fs.readFileSync(require("path").join(__dirname, "../src/validation/InputValidation.js"), "utf8");
    eval(src);
    assert.throws(() => InputValidation.productCreatePayload({ nameEn: "x", unknown: 1 }), /VALIDATION_UNKNOWN_FIELD/);
  });

  it("InputValidation rejects invalid override mode", () => {
    const fs = require("fs");
    const src = fs.readFileSync(require("path").join(__dirname, "../src/validation/InputValidation.js"), "utf8");
    eval(src);
    assert.throws(() => InputValidation.attributeSetPayload({ attributeId: "a1", mode: "BAD" }), /VALIDATION_INVALID_FORMAT/);
  });
});
