const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadModule(rel) {
  const src = fs.readFileSync(path.join(__dirname, rel), "utf8");
  const sandbox = { console, SheetsRepository: global.SheetsRepository };
  sandbox.global = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox;
}

describe("Product domain regression", () => {
  it("product.search rejects unknown fields", () => {
    const s = loadModule("../src/validation/InputValidation.js");
    assert.throws(() => s.InputValidation.productSearchPayload({ query: "pump", extra: 1 }), /VALIDATION_UNKNOWN_FIELD/);
  });

  it("variant.updateCompanyFields rejects unknown fields and invalid IDs", () => {
    const s = loadModule("../src/validation/InputValidation.js");
    assert.throws(() => s.InputValidation.variantUpdatePayload({ variantId: "v1", unknown: true }), /VALIDATION_UNKNOWN_FIELD/);
    assert.throws(() => s.InputValidation.variantUpdatePayload({ variantId: "" }), /VALIDATION_REQUIRED/);
  });

  it("specification.getEffective rejects unknown fields", () => {
    const s = loadModule("../src/validation/InputValidation.js");
    assert.throws(() => s.InputValidation.effectiveSpecPayload({ productId: "p1", extra: 1 }), /VALIDATION_UNKNOWN_FIELD/);
    assert.throws(() => s.InputValidation.effectiveSpecPayload({ productId: "p1", variantId: "bad id!" }), /VALIDATION_INVALID_FORMAT/);
  });

  it("Sequence_No rejects decimal values", () => {
    const repo = {
      getBy: () => ({ Product_ID: "p1" }),
      listAll: (table) => {
        if (table === "Specifications") return [{
          Specification_ID: "s1", Product_ID: "p1", Scope: "PRODUCT",
          Attribute_Key_Source: "k", Attribute_Value_Source: "v"
        }];
        if (table === "Specification_Changes") return [{
          Specification_Change_ID: "c1", Logical_Specification_Key: "SRC:s1",
          Change_Status: "APPROVED", Sequence_No: 1.5, Operation: "UPDATE", Value_JSON: "x"
        }];
        return [];
      }
    };
    global.SheetsRepository = repo;
    const s = loadModule("../src/domain/EffectiveSpecificationResolver.js");
    const result = s.EffectiveSpecificationResolver.resolveEffectiveSpecifications("p1", null);
    assert.ok(result.validation_errors.some(e => e.code === "LOGICAL_KEY_QUARANTINED"));
  });

  it("Sequence_No rejects zero", () => {
    const repo = {
      getBy: () => ({ Product_ID: "p1" }),
      listAll: (table) => {
        if (table === "Specifications") return [{
          Specification_ID: "s1", Product_ID: "p1", Scope: "PRODUCT",
          Attribute_Key_Source: "k", Attribute_Value_Source: "v"
        }];
        if (table === "Specification_Changes") return [{
          Specification_Change_ID: "c1", Logical_Specification_Key: "SRC:s1",
          Change_Status: "APPROVED", Sequence_No: 0, Operation: "UPDATE", Value_JSON: "x"
        }];
        return [];
      }
    };
    global.SheetsRepository = repo;
    const s = loadModule("../src/domain/EffectiveSpecificationResolver.js");
    const result = s.EffectiveSpecificationResolver.resolveEffectiveSpecifications("p1", null);
    assert.ok(result.validation_errors.some(e => e.code === "LOGICAL_KEY_QUARANTINED"));
  });
});
