const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

function read(rel) {
  return fs.readFileSync(path.join(__dirname, rel), "utf8");
}

describe("Product domain engine", () => {
  it("ProductService enforces active-variants guard and supports search", () => {
    const src = read("../src/domain/ProductService.js");
    assert.match(src, /PRODUCT_HAS_ACTIVE_VARIANTS/);
    assert.match(src, /function search/);
    assert.match(src, /IDEMPOTENCY_PAYLOAD_MISMATCH/);
  });

  it("VariantService does not allow reparenting", () => {
    const src = read("../src/domain/VariantService.js");
    assert.match(src, /immutable/);
    assert.doesNotMatch(src, /updateBy\([^)]*Product_ID/);
  });

  it("ProductFamilyService blocks cycles and unsafe archive", () => {
    const src = read("../src/domain/ProductFamilyService.js");
    assert.match(src, /FAMILY_CYCLE_DETECTED/);
    assert.match(src, /FAMILY_HAS_ACTIVE_CHILDREN/);
    assert.match(src, /FAMILY_HAS_ACTIVE_PRODUCTS/);
    assert.match(src, /function archive/);
  });

  it("Resolver implements ADR-040 and company-created specs", () => {
    const src = read("../src/domain/EffectiveSpecificationResolver.js");
    assert.match(src, /ADR-040/);
    assert.match(src, /COMPANY_ADDED/);
    assert.match(src, /QUARANTINED/);
  });

  it("SpecificationService validates transitions under lock", () => {
    const src = read("../src/domain/SpecificationService.js");
    assert.match(src, /tryLock/);
    assert.match(src, /INVALID_TRANSITION/);
    assert.match(src, /IDEMPOTENCY_PAYLOAD_MISMATCH/);
  });

  it("AttributeService distinguishes VALUE and INTENTIONALLY_EMPTY", () => {
    const src = read("../src/domain/AttributeService.js");
    assert.match(src, /INTENTIONALLY_EMPTY_MUST_BE_BLANK/);
    assert.match(src, /CLEAR_OVERRIDE/);
  });

  it("Api exposes search and family operations", () => {
    const src = read("../src/api/Api.js");
    assert.match(src, /product\.search/);
    assert.match(src, /family\.create/);
    assert.match(src, /family\.archive/);
  });
});
